# Payment auto-reconciliation (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically confirm storefront P2P payments (Zelle/Cash App/Venmo) from forwarded push notifications, flipping the shopper's `/order/[code]` page to "Payment received" live, with a staff one-tap review queue for anything the engine can't confirm.

**Architecture:** A Bearer-authed webhook (`/api/payments/ingest/push`) receives forwarded Android push payloads → a per-channel adapter normalizes them → a SECURITY DEFINER `ingest_payment_event` RPC dedups, records, matches (order code, else exact amount + method + recent window), and auto-applies a strong (single-candidate) match via a shared `mark_order_paid` core. Non-strong matches land in a staff review queue. The pay page polls a status endpoint and flips live.

**Tech Stack:** Next.js 16.2.9 (custom fork), Supabase (Postgres + RLS + SECURITY DEFINER RPCs), zod 4, Vitest against local Supabase.

**Design spec:** `docs/superpowers/specs/2026-06-28-payment-auto-reconciliation-design.md`

## Global Constraints

- **Next.js 16.2.9 custom fork.** Cache Components OFF — never `'use cache'`. Read `node_modules/next/dist/docs/` before using any Next API (route handlers, dynamic `params`, `revalidate`). This is the repo's first `src/app/api/**` route handler.
- **`'use server'` files export async functions ONLY.** zod schemas + types go in a sibling **plain** module, else the dev runtime throws (build still passes — don't trust the build alone).
- **Form-action mutations need `refresh()` from `next/cache`** (this fork has no auto router refresh).
- **zod 4** (`z.email()`, `z.guid()`, `z.enum([...])`).
- **Supabase RLS:** orders/payments/payment_events are staff-only; public reaches them only via SECURITY DEFINER RPCs. New RPCs ship explicit GRANTs (`execute` to `service_role` only for the apply/ingest core — never `anon`).
- **Server-authoritative:** matching/amounts computed in SQL; the webhook never trusts a client "this is paid".
- **Local-only for dev/test.** Tests hit local Supabase (`127.0.0.1:54321`); requires `supabase start`. Prod migrations are a manual `npx supabase db push` the **user** runs (agent cannot).
- **Enums (existing):** `payment_method = venmo|cashapp|zelle|card|applepay|googlepay|crypto|other`; `payment_status = unpaid|paid|refunded`; `order_status = pending|paid|fulfilled|shipped|delivered|cancelled|refunded`; `payment_record_status (payments.status) = pending|confirmed|refunded`.
- **Order code format:** `KL-YYYYMMDD-XXXX`, alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. Match with regex `KL-\d{8}-[A-Z0-9]{4}` (case-insensitive, uppercase before lookup).
- **Helpers that already exist:** `public.is_staff()`, `public.is_owner()` (used in `0004`/`0008`); `createAdminClient()` (`@/lib/supabase/admin`), `createPublicClient()` (`@/lib/catalog/client`), `createClient()` (`@/lib/supabase/server`); `getOrderForPayment()` (`@/lib/orders/queries`); `requireStaff()`/`requireOwner()` (`@/lib/auth/dal`).

**Prerequisite for every task with DB tests:** `npx supabase start` must be running, and `npm run db:reset` re-applies migrations including the new `0010`.

---

### Task 1: Migration — `payment_events` table + `mark_order_paid` core

**Files:**
- Create: `supabase/migrations/0010_payment_events.sql`
- Test: `tests/db/mark-order-paid.test.ts`

**Interfaces:**
- Produces: table `public.payment_events`; enum `public.payment_event_status` (`unmatched|ambiguous|applied|ignored`); RPC `public.mark_order_paid(p_order_id uuid, p_event_id uuid default null) returns text` (the paid order_number). Idempotent: already-paid order → no-op (no second `payments` row), still links the event.

- [ ] **Step 1: Write the migration (table + enum + RLS + `mark_order_paid`)**

Create `supabase/migrations/0010_payment_events.sql`:

```sql
-- supabase/migrations/0010_payment_events.sql
-- Phase 2 auto-reconciliation: payment_events ledger + shared mark-paid core.

create type public.payment_event_status as enum
  ('unmatched','ambiguous','applied','ignored');

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'push',          -- adapter: push|email|plaid
  method public.payment_method not null,
  amount numeric(10,2) not null,
  sender text,
  note text,
  raw_text text not null,
  external_id text,
  dedup_key text not null unique,                -- idempotency hash
  received_at timestamptz not null,
  status public.payment_event_status not null default 'unmatched',
  matched_order_id uuid references public.orders(id),
  candidate_orders text[],
  created_at timestamptz not null default now()
);
create index on public.payment_events (status, created_at desc);

alter table public.payment_events enable row level security;
create policy "staff all payment_events" on public.payment_events
  for all using (public.is_staff()) with check (public.is_staff());

grant all on public.payment_events to service_role;
grant select, insert, update, delete on public.payment_events to authenticated;
-- NOTE: no grant to anon — the public never touches this table.

-- Shared core: idempotently mark an order paid + record the payment + link event.
create or replace function public.mark_order_paid(p_order_id uuid, p_event_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number text;
  v_method public.payment_method;
  v_amount numeric(10,2);
  v_status public.payment_status;
begin
  select order_number, payment_method, total, payment_status
    into v_number, v_method, v_amount, v_status
    from public.orders where id = p_order_id;
  if v_number is null then raise exception 'unknown order: %', p_order_id; end if;

  if v_status = 'paid' then
    -- already paid: idempotent no-op; still link the event if one was passed.
    if p_event_id is not null then
      update public.payment_events
        set status = 'applied', matched_order_id = p_order_id where id = p_event_id;
    end if;
    return v_number;
  end if;

  update public.orders
    set payment_status = 'paid', status = 'paid', updated_at = now()
    where id = p_order_id;

  insert into public.payments (order_id, method, amount, status, reference)
    values (p_order_id, v_method, v_amount, 'confirmed', v_number);

  -- FUTURE: decrement inventory here (apply_inventory_movement) once the admin
  -- fulfillment feature owns it. Intentionally omitted in Phase 2 (see spec).

  if p_event_id is not null then
    update public.payment_events
      set status = 'applied', matched_order_id = p_order_id where id = p_event_id;
  end if;

  return v_number;
end;
$$;

grant execute on function public.mark_order_paid(uuid, uuid) to service_role;
```

- [ ] **Step 2: Apply the migration**

Run: `npm run db:reset`
Expected: applies through `0010` with no SQL errors ("Finished supabase db reset.").

- [ ] **Step 3: Write the failing test**

Create `tests/db/mark-order-paid.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const created: string[] = []
afterEach(async () => {
  for (const id of created.splice(0)) await admin.from('orders').delete().eq('id', id)
})

async function newOrder(amount: number, method: 'venmo' | 'cashapp' | 'zelle' = 'venmo') {
  const order_number = `KL-20260628-T${Math.floor(Math.random() * 9000 + 1000)}`
  const { data, error } = await admin.from('orders').insert({
    order_number, customer_name: 'Test', status: 'pending',
    payment_method: method, payment_status: 'unpaid', subtotal: amount, total: amount,
  }).select().single()
  if (error) throw error
  created.push(data!.id)
  return data!
}

describe('mark_order_paid', () => {
  it('marks the order paid, records one payment, is idempotent', async () => {
    const order = await newOrder(42.11)
    const r1 = await admin.rpc('mark_order_paid', { p_order_id: order.id, p_event_id: null })
    expect(r1.error).toBeNull()
    expect(r1.data).toBe(order.order_number)

    const { data: o } = await admin.from('orders').select('status, payment_status').eq('id', order.id).single()
    expect(o!.payment_status).toBe('paid')
    expect(o!.status).toBe('paid')

    // call again — must stay paid with still exactly one payment row
    await admin.rpc('mark_order_paid', { p_order_id: order.id, p_event_id: null })
    const { data: pays } = await admin.from('payments').select('id, status, amount').eq('order_id', order.id)
    expect(pays!.length).toBe(1)
    expect(pays![0].status).toBe('confirmed')
    expect(Number(pays![0].amount)).toBe(42.11)
  })

  it('raises on an unknown order', async () => {
    const r = await admin.rpc('mark_order_paid', {
      p_order_id: '00000000-0000-0000-0000-000000000000', p_event_id: null,
    })
    expect(r.error).not.toBeNull()
  })
})
```

- [ ] **Step 4: Run the test**

Run: `npm test -- tests/db/mark-order-paid.test.ts`
Expected: PASS (2 tests). If `mark_order_paid` is missing/typed-unknown that's a runtime PASS regardless — vitest does not typecheck.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0010_payment_events.sql tests/db/mark-order-paid.test.ts
git commit -m "feat(payments): payment_events table + idempotent mark_order_paid core"
```

---

### Task 2: Migration — `ingest_payment_event` matching engine

**Files:**
- Modify: `supabase/migrations/0010_payment_events.sql` (append the function)
- Test: `tests/db/ingest-payment-event.test.ts`

**Interfaces:**
- Consumes: `mark_order_paid` (Task 1).
- Produces: RPC `public.ingest_payment_event(p_payload jsonb) returns jsonb`. Payload keys: `channel, method, amount, sender, note, raw_text, external_id, received_at, dedup_key`. Returns `{ status, order_number, event_id }` where `status ∈ applied|ambiguous|unmatched|duplicate`.

- [ ] **Step 1: Append the function to `0010_payment_events.sql`**

```sql
-- Ingestion core: dedup → record → match (code, else amount+method+window) → maybe apply.
create or replace function public.ingest_payment_event(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_method public.payment_method;
  v_amount numeric(10,2);
  v_dedup text;
  v_event_id uuid;
  v_existing uuid;
  v_code text;
  v_match uuid;
  v_count int;
  v_number text;
  v_candidates text[];
begin
  v_method := (p_payload->>'method')::public.payment_method;
  v_amount := (p_payload->>'amount')::numeric(10,2);
  v_dedup  := p_payload->>'dedup_key';

  insert into public.payment_events
    (channel, method, amount, sender, note, raw_text, external_id, received_at, dedup_key, status)
  values (
    coalesce(p_payload->>'channel','push'), v_method, v_amount,
    p_payload->>'sender', p_payload->>'note', p_payload->>'raw_text',
    p_payload->>'external_id', (p_payload->>'received_at')::timestamptz,
    v_dedup, 'unmatched'
  )
  on conflict (dedup_key) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    select id into v_existing from public.payment_events where dedup_key = v_dedup;
    return jsonb_build_object('status','duplicate','order_number',null,'event_id',v_existing);
  end if;

  -- Code path: a KL code anywhere in raw_text that resolves to a matching unpaid order.
  v_code := substring(upper(coalesce(p_payload->>'raw_text','')) from 'KL-[0-9]{8}-[A-Z0-9]{4}');
  if v_code is not null then
    select id, order_number into v_match, v_number
      from public.orders
      where order_number = v_code
        and payment_status = 'unpaid'
        and payment_method = v_method
        and total = v_amount;
    if v_match is not null then
      perform public.mark_order_paid(v_match, v_event_id);
      return jsonb_build_object('status','applied','order_number',v_number,'event_id',v_event_id);
    end if;
  end if;

  -- Amount + method + recent-window path.
  select count(*), min(id), array_agg(order_number)
    into v_count, v_match, v_candidates
    from public.orders
    where payment_status = 'unpaid'
      and payment_method = v_method
      and total = v_amount
      and created_at >= now() - interval '30 days';

  if v_count = 1 then
    select order_number into v_number from public.orders where id = v_match;
    perform public.mark_order_paid(v_match, v_event_id);
    return jsonb_build_object('status','applied','order_number',v_number,'event_id',v_event_id);
  elsif v_count >= 2 then
    update public.payment_events
      set status = 'ambiguous', candidate_orders = v_candidates where id = v_event_id;
    return jsonb_build_object('status','ambiguous','order_number',null,'event_id',v_event_id);
  else
    return jsonb_build_object('status','unmatched','order_number',null,'event_id',v_event_id);
  end if;
end;
$$;

grant execute on function public.ingest_payment_event(jsonb) to service_role;
```

- [ ] **Step 2: Re-apply the migration**

Run: `npm run db:reset`
Expected: applies cleanly through `0010`.

- [ ] **Step 3: Write the failing test**

Create `tests/db/ingest-payment-event.test.ts`. **Every test uses a unique amount** so the amount-window scan can't collide with other tests' leftover unpaid orders.

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const orderIds: string[] = []
const eventKeys: string[] = []
afterEach(async () => {
  for (const id of orderIds.splice(0)) await admin.from('orders').delete().eq('id', id)
  for (const k of eventKeys.splice(0)) await admin.from('payment_events').delete().eq('dedup_key', k)
})

async function newOrder(opts: {
  amount: number; method?: 'venmo' | 'cashapp' | 'zelle'; number?: string; createdDaysAgo?: number
}) {
  const { amount, method = 'venmo', number, createdDaysAgo } = opts
  const order_number = number ?? `KL-20260628-X${Math.floor(Math.random() * 9000 + 1000)}`
  const row: Record<string, unknown> = {
    order_number, customer_name: 'Test', status: 'pending',
    payment_method: method, payment_status: 'unpaid', subtotal: amount, total: amount,
  }
  if (createdDaysAgo != null) {
    row.created_at = new Date(Date.now() - createdDaysAgo * 86400_000).toISOString()
  }
  const { data, error } = await admin.from('orders').insert(row).select().single()
  if (error) throw error
  orderIds.push(data!.id)
  return data!
}

function payload(over: Partial<Record<string, unknown>>) {
  const dedup_key = `dk-${Math.random().toString(36).slice(2)}`
  eventKeys.push(dedup_key)
  return {
    channel: 'push', method: 'venmo', amount: 0, sender: 'Someone',
    note: null, raw_text: 'You received', external_id: null,
    received_at: new Date().toISOString(), dedup_key, ...over,
  }
}

async function ingest(p: Record<string, unknown>) {
  const { data, error } = await admin.rpc('ingest_payment_event', { p_payload: p })
  expect(error).toBeNull()
  return data as { status: string; order_number: string | null; event_id: string }
}

describe('ingest_payment_event', () => {
  it('auto-applies a single exact amount+method match', async () => {
    const o = await newOrder({ amount: 111.01 })
    const r = await ingest(payload({ amount: 111.01, method: 'venmo' }))
    expect(r.status).toBe('applied')
    expect(r.order_number).toBe(o.order_number)
    const { data } = await admin.from('orders').select('payment_status').eq('id', o.id).single()
    expect(data!.payment_status).toBe('paid')
  })

  it('auto-applies when a KL code in raw_text resolves to a matching order', async () => {
    const o = await newOrder({ amount: 111.02 })
    const r = await ingest(payload({
      amount: 111.02, method: 'venmo', raw_text: `Payment received note ${o.order_number} thanks`,
    }))
    expect(r.status).toBe('applied')
    expect(r.order_number).toBe(o.order_number)
  })

  it('does NOT auto-apply a code whose amount disagrees', async () => {
    const o = await newOrder({ amount: 111.03 })
    const r = await ingest(payload({
      amount: 999.99, method: 'venmo', raw_text: `note ${o.order_number}`,
    }))
    expect(r.status).toBe('unmatched')
    const { data } = await admin.from('orders').select('payment_status').eq('id', o.id).single()
    expect(data!.payment_status).toBe('unpaid')
  })

  it('marks ambiguous when two unpaid orders share amount+method', async () => {
    const a = await newOrder({ amount: 111.04 })
    const b = await newOrder({ amount: 111.04 })
    const r = await ingest(payload({ amount: 111.04, method: 'venmo' }))
    expect(r.status).toBe('ambiguous')
    const { data } = await admin.from('payment_events').select('candidate_orders').eq('id', r.event_id).single()
    expect(data!.candidate_orders).toEqual(expect.arrayContaining([a.order_number, b.order_number]))
    for (const o of [a, b]) {
      const { data: od } = await admin.from('orders').select('payment_status').eq('id', o.id).single()
      expect(od!.payment_status).toBe('unpaid')
    }
  })

  it('is unmatched when nothing matches', async () => {
    const r = await ingest(payload({ amount: 111.05, method: 'venmo' }))
    expect(r.status).toBe('unmatched')
  })

  it('does not match a different method', async () => {
    await newOrder({ amount: 111.06, method: 'cashapp' })
    const r = await ingest(payload({ amount: 111.06, method: 'venmo' }))
    expect(r.status).toBe('unmatched')
  })

  it('does not match an order older than the 30-day window', async () => {
    await newOrder({ amount: 111.07, createdDaysAgo: 45 })
    const r = await ingest(payload({ amount: 111.07, method: 'venmo' }))
    expect(r.status).toBe('unmatched')
  })

  it('treats a redelivered dedup_key as a duplicate (no second apply)', async () => {
    const o = await newOrder({ amount: 111.08 })
    const p = payload({ amount: 111.08, method: 'venmo' })
    const r1 = await ingest(p)
    expect(r1.status).toBe('applied')
    const r2 = await ingest(p) // same dedup_key
    expect(r2.status).toBe('duplicate')
    const { data: pays } = await admin.from('payments').select('id').eq('order_id', o.id)
    expect(pays!.length).toBe(1)
  })
})
```

- [ ] **Step 4: Run the test**

Run: `npm test -- tests/db/ingest-payment-event.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0010_payment_events.sql tests/db/ingest-payment-event.test.ts
git commit -m "feat(payments): ingest_payment_event matching engine (code + amount/window)"
```

---

### Task 3: Migration — `apply_payment_event` (staff one-tap) + RLS test + regen types

**Files:**
- Modify: `supabase/migrations/0010_payment_events.sql` (append the function)
- Modify: `src/lib/supabase/database.types.ts` (regen)
- Test: `tests/db/payment-events-rls.test.ts`

**Interfaces:**
- Consumes: `mark_order_paid` (Task 1).
- Produces: RPC `public.apply_payment_event(p_event_id uuid, p_order_number text) returns text` (the paid order_number). Regenerated `Database` types now include the three RPCs + `payment_events` row type + `payment_event_status` enum.

- [ ] **Step 1: Append the function to `0010_payment_events.sql`**

```sql
-- Staff one-tap: apply a reviewed event to a chosen order.
create or replace function public.apply_payment_event(p_event_id uuid, p_order_number text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  select id into v_order_id from public.orders where order_number = p_order_number;
  if v_order_id is null then raise exception 'unknown order: %', p_order_number; end if;
  return public.mark_order_paid(v_order_id, p_event_id);
end;
$$;

grant execute on function public.apply_payment_event(uuid, text) to service_role;
```

- [ ] **Step 2: Re-apply the migration + regenerate types**

Run: `npm run db:reset && npm run db:types`
Expected: reset applies cleanly; `src/lib/supabase/database.types.ts` now contains `payment_events`, `payment_event_status`, and the `mark_order_paid`/`ingest_payment_event`/`apply_payment_event` function signatures.

- [ ] **Step 3: Write the failing test (one-tap apply + RLS)**

Create `tests/db/payment-events-rls.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const anon = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const orderIds: string[] = []
const eventIds: string[] = []
afterEach(async () => {
  for (const id of eventIds.splice(0)) await admin.from('payment_events').delete().eq('id', id)
  for (const id of orderIds.splice(0)) await admin.from('orders').delete().eq('id', id)
})

async function unmatchedEvent(amount: number) {
  const { data, error } = await admin.from('payment_events').insert({
    channel: 'push', method: 'venmo', amount, raw_text: 'You received', status: 'ambiguous',
    dedup_key: `dk-${Math.random().toString(36).slice(2)}`, received_at: new Date().toISOString(),
  }).select().single()
  if (error) throw error
  eventIds.push(data!.id)
  return data!
}

async function unpaidOrder(amount: number) {
  const order_number = `KL-20260628-A${Math.floor(Math.random() * 9000 + 1000)}`
  const { data, error } = await admin.from('orders').insert({
    order_number, customer_name: 'Test', status: 'pending',
    payment_method: 'venmo', payment_status: 'unpaid', subtotal: amount, total: amount,
  }).select().single()
  if (error) throw error
  orderIds.push(data!.id)
  return data!
}

describe('apply_payment_event + payment_events RLS', () => {
  it('staff one-tap applies an event to a chosen order', async () => {
    const ev = await unmatchedEvent(222.01)
    const o = await unpaidOrder(222.01)
    const r = await admin.rpc('apply_payment_event', { p_event_id: ev.id, p_order_number: o.order_number })
    expect(r.error).toBeNull()
    expect(r.data).toBe(o.order_number)
    const { data: od } = await admin.from('orders').select('payment_status').eq('id', o.id).single()
    expect(od!.payment_status).toBe('paid')
    const { data: evd } = await admin.from('payment_events').select('status, matched_order_id').eq('id', ev.id).single()
    expect(evd!.status).toBe('applied')
    expect(evd!.matched_order_id).toBe(o.id)
  })

  it('anon cannot read or insert payment_events', async () => {
    await unmatchedEvent(222.02)
    const { data: read } = await anon.from('payment_events').select('id')
    expect(read ?? []).toHaveLength(0) // RLS hides all rows from anon
    const { error: insErr } = await anon.from('payment_events').insert({
      channel: 'push', method: 'venmo', amount: 1, raw_text: 'x',
      dedup_key: `dk-${Math.random()}`, received_at: new Date().toISOString(),
    })
    expect(insErr).not.toBeNull()
  })
})
```

- [ ] **Step 4: Run the test + full DB suite**

Run: `npm test -- tests/db/payment-events-rls.test.ts && npm test -- tests/db/mark-order-paid.test.ts tests/db/ingest-payment-event.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0010_payment_events.sql src/lib/supabase/database.types.ts tests/db/payment-events-rls.test.ts
git commit -m "feat(payments): apply_payment_event one-tap RPC; regen types; payment_events RLS test"
```

---

### Task 4: Normalizer — types, dedup key, order-code extraction

**Files:**
- Create: `src/lib/payments/ingest/normalize.ts`
- Test: `tests/lib/normalize.test.ts`

**Interfaces:**
- Produces: `NormalizedPaymentEvent` (`{ channel, method, amount, sender?, note?, rawText, externalId?, receivedAt }`); `extractOrderCode(text): string | null`; `buildDedupKey(e): string`; `toIngestPayload(e): Record<string, unknown>` (snake_case payload + `dedup_key`, matching the `ingest_payment_event` contract).

- [ ] **Step 1: Write the failing test**

Create `tests/lib/normalize.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildDedupKey, extractOrderCode, toIngestPayload, type NormalizedPaymentEvent } from '@/lib/payments/ingest/normalize'

const base: NormalizedPaymentEvent = {
  channel: 'push', method: 'venmo', amount: 42.5, sender: 'Jane',
  note: 'KL-20260628-AB23', rawText: 'You received $42.50 from Jane — KL-20260628-AB23',
  receivedAt: '2026-06-28T12:00:00.000Z',
}

describe('extractOrderCode', () => {
  it('finds an uppercase code', () => {
    expect(extractOrderCode('memo KL-20260628-AB23 here')).toBe('KL-20260628-AB23')
  })
  it('uppercases a lowercase code', () => {
    expect(extractOrderCode('kl-20260628-ab23')).toBe('KL-20260628-AB23')
  })
  it('returns null when no code is present', () => {
    expect(extractOrderCode('thanks for lunch')).toBeNull()
    expect(extractOrderCode(null)).toBeNull()
  })
})

describe('buildDedupKey', () => {
  it('is stable for identical input', () => {
    expect(buildDedupKey(base)).toBe(buildDedupKey({ ...base }))
  })
  it('changes when any field changes', () => {
    expect(buildDedupKey(base)).not.toBe(buildDedupKey({ ...base, amount: 42.51 }))
    expect(buildDedupKey(base)).not.toBe(buildDedupKey({ ...base, receivedAt: '2026-06-28T12:00:01.000Z' }))
  })
})

describe('toIngestPayload', () => {
  it('emits the snake_case RPC payload with a dedup_key', () => {
    const p = toIngestPayload(base)
    expect(p).toMatchObject({
      channel: 'push', method: 'venmo', amount: 42.5, sender: 'Jane',
      note: 'KL-20260628-AB23', raw_text: base.rawText, received_at: base.receivedAt,
    })
    expect(typeof p.dedup_key).toBe('string')
    expect((p.dedup_key as string).length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/normalize.test.ts`
Expected: FAIL ("Cannot find module '@/lib/payments/ingest/normalize'").

- [ ] **Step 3: Write the implementation**

Create `src/lib/payments/ingest/normalize.ts`:

```ts
import { createHash } from 'node:crypto'
import type { Database } from '@/lib/supabase/database.types'

export type PaymentMethod = Database['public']['Enums']['payment_method']

export interface NormalizedPaymentEvent {
  channel: string
  method: PaymentMethod
  amount: number
  sender?: string
  note?: string
  rawText: string
  externalId?: string
  receivedAt: string // ISO 8601
}

const ORDER_CODE_RE = /KL-\d{8}-[A-Z0-9]{4}/i

export function extractOrderCode(text: string | null | undefined): string | null {
  if (!text) return null
  const m = text.match(ORDER_CODE_RE)
  return m ? m[0].toUpperCase() : null
}

export function buildDedupKey(e: NormalizedPaymentEvent): string {
  const basis = [
    e.channel, e.method, e.amount.toFixed(2),
    e.sender ?? '', e.note ?? '', e.rawText, e.receivedAt,
  ].join('|')
  return createHash('sha256').update(basis).digest('hex')
}

export function toIngestPayload(e: NormalizedPaymentEvent): Record<string, unknown> {
  return {
    channel: e.channel,
    method: e.method,
    amount: e.amount,
    sender: e.sender ?? null,
    note: e.note ?? null,
    raw_text: e.rawText,
    external_id: e.externalId ?? null,
    received_at: e.receivedAt,
    dedup_key: buildDedupKey(e),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/lib/normalize.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/payments/ingest/normalize.ts tests/lib/normalize.test.ts
git commit -m "feat(payments): normalizer — dedup key, order-code extraction, RPC payload"
```

---

### Task 5: Push adapter — parse Android notification payloads

**Files:**
- Create: `src/lib/payments/ingest/push-schema.ts`
- Create: `src/lib/payments/ingest/adapters/push.ts`
- Create: `src/lib/payments/ingest/adapters/README.md`
- Test: `tests/lib/push-adapter.test.ts`

**Interfaces:**
- Consumes: `NormalizedPaymentEvent`, `extractOrderCode` (Task 4).
- Produces: `pushPayloadSchema` + `PushPayload` (plain module); `parsePushNotification(payload: PushPayload): NormalizedPaymentEvent` (throws on unparseable amount or unknown app).

- [ ] **Step 1: Write the schema module**

Create `src/lib/payments/ingest/push-schema.ts`:

```ts
// Plain module (NOT 'use server'): zod schema + type for the Android push payload.
import { z } from 'zod'

export const pushPayloadSchema = z.object({
  app: z.string().min(1),       // Android package name, e.g. "com.venmo"
  title: z.string().default(''),
  text: z.string().default(''),
  postedAt: z.string().optional(), // ISO timestamp from the device
})

export type PushPayload = z.infer<typeof pushPayloadSchema>
```

- [ ] **Step 2: Write the failing test**

Create `tests/lib/push-adapter.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parsePushNotification } from '@/lib/payments/ingest/adapters/push'

describe('parsePushNotification', () => {
  it('parses a Venmo payment with a memo carrying the order code', () => {
    const e = parsePushNotification({
      app: 'com.venmo', title: 'Venmo',
      text: 'Jane Doe paid you $42.50 - KL-20260628-AB23', postedAt: '2026-06-28T12:00:00.000Z',
    })
    expect(e.method).toBe('venmo')
    expect(e.amount).toBe(42.5)
    expect(e.sender).toBe('Jane Doe')
    expect(e.rawText).toContain('KL-20260628-AB23')
    expect(e.receivedAt).toBe('2026-06-28T12:00:00.000Z')
  })

  it('parses a Cash App payment and a comma-grouped amount', () => {
    const e = parsePushNotification({
      app: 'com.squareup.cash', title: 'Cash App', text: 'You received $1,200.00 from $johndoe',
    })
    expect(e.method).toBe('cashapp')
    expect(e.amount).toBe(1200)
  })

  it('maps a Zelle-style app name', () => {
    const e = parsePushNotification({
      app: 'com.zellepay.zelle', title: 'Zelle', text: 'You received $80.00 from ALEX',
    })
    expect(e.method).toBe('zelle')
    expect(e.amount).toBe(80)
  })

  it('throws on an unparseable amount', () => {
    expect(() => parsePushNotification({ app: 'com.venmo', title: 'Venmo', text: 'no money here' }))
      .toThrow(/amount/i)
  })

  it('throws on an unknown app', () => {
    expect(() => parsePushNotification({ app: 'com.whatsapp', title: 'x', text: '$1.00' }))
      .toThrow(/unknown payment app/i)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/lib/push-adapter.test.ts`
Expected: FAIL ("Cannot find module '.../adapters/push'").

- [ ] **Step 4: Write the adapter**

Create `src/lib/payments/ingest/adapters/push.ts`:

```ts
import type { NormalizedPaymentEvent, PaymentMethod } from '../normalize'
import type { PushPayload } from '../push-schema'

const APP_METHOD: Record<string, PaymentMethod> = {
  'com.venmo': 'venmo',
  'com.squareup.cash': 'cashapp',
  'com.zellepay.zelle': 'zelle',
}

function methodForApp(app: string): PaymentMethod {
  const direct = APP_METHOD[app]
  if (direct) return direct
  const a = app.toLowerCase()
  if (a.includes('venmo')) return 'venmo'
  if (a.includes('cash')) return 'cashapp'
  if (a.includes('zelle')) return 'zelle'
  throw new Error(`unknown payment app: ${app}`)
}

function parseAmount(text: string): number {
  const m = text.match(/\$\s?([0-9][0-9,]*(?:\.[0-9]{2})?)/)
  if (!m) throw new Error('no amount in notification')
  return Number(m[1].replace(/,/g, ''))
}

// Best-effort sender extraction: "<Name> paid you" or "from <Name>".
function parseSender(text: string): string | undefined {
  const paid = text.match(/^([A-Z][\w .'-]+?)\s+paid you\b/i)
  if (paid) return paid[1].trim()
  const from = text.match(/\bfrom\s+([A-Z$][\w .'-]+?)(?:[.!]|\s+for\b|\s+on\b|$)/i)
  return from ? from[1].trim() : undefined
}

export function parsePushNotification(payload: PushPayload): NormalizedPaymentEvent {
  const rawText = [payload.title, payload.text].filter(Boolean).join('\n')
  return {
    channel: 'push',
    method: methodForApp(payload.app),
    amount: parseAmount(rawText),
    sender: parseSender(payload.text || rawText),
    note: payload.text || undefined,
    rawText,
    receivedAt: payload.postedAt ?? new Date().toISOString(),
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/lib/push-adapter.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Write the adapters README**

Create `src/lib/payments/ingest/adapters/README.md`:

```markdown
# Ingestion adapters

Each adapter turns one detection channel's raw payload into a
`NormalizedPaymentEvent` (`../normalize.ts`). The webhook route for the channel
authenticates, validates the raw payload, calls the adapter, then
`toIngestPayload()` → `ingest_payment_event` RPC. The matching engine is
channel-agnostic, so adding a channel never touches the SQL.

## Current
- `push.ts` — Android push-notification forwarder. Input `PushPayload`
  (`{ app, title, text, postedAt? }`); maps package→method, parses amount + sender.

## Adding a channel (e.g. email, Plaid)
1. Add `<channel>-schema.ts` (zod) for the raw payload.
2. Add `adapters/<channel>.ts` exporting
   `parse<Channel>(payload): NormalizedPaymentEvent` with `channel: '<channel>'`.
3. Add `src/app/api/payments/ingest/<channel>/route.ts` mirroring the push route
   (Bearer auth → validate → adapter → `toIngestPayload` → RPC).
4. Unit-test the adapter; the engine + DB tests already cover matching.
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/payments/ingest/push-schema.ts src/lib/payments/ingest/adapters/ tests/lib/push-adapter.test.ts
git commit -m "feat(payments): push-notification adapter + adapters guide"
```

---

### Task 6: Push webhook route handler

**Files:**
- Create: `src/app/api/payments/ingest/push/route.ts`
- Modify: `.env.example` (add `PAYMENT_WEBHOOK_SECRET`)
- Test: `tests/lib/webhook-push.test.ts`

**Interfaces:**
- Consumes: `pushPayloadSchema`, `parsePushNotification`, `toIngestPayload`, `createAdminClient`, `ingest_payment_event` RPC.
- Produces: `POST` handler returning `200 { status, orderNumber }` (applied|ambiguous|unmatched|duplicate); 401 (bad/missing Bearer); 500 (missing secret env); 400 (bad json/schema); 422 (unparseable amount).

**FIRST:** read `node_modules/next/dist/docs/` for this fork's route-handler API and confirm the `export async function POST(request: Request)` signature + `Response.json`. Adjust the handler to match the fork if it differs.

- [ ] **Step 1: Add the env var to `.env.example`**

Append to `.env.example`:

```
# Shared secret for the payment-ingestion webhook (Authorization: Bearer <secret>)
PAYMENT_WEBHOOK_SECRET=
```

- [ ] **Step 2: Write the failing test**

Create `tests/lib/webhook-push.test.ts`. The 401/500 cases need no DB; the success case needs local Supabase + a seeded unpaid order.

```ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { POST } from '@/app/api/payments/ingest/push/route'

const SECRET = 'test-webhook-secret'
const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

function req(body: unknown, auth?: string) {
  return new Request('http://localhost/api/payments/ingest/push', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(auth ? { authorization: auth } : {}) },
    body: JSON.stringify(body),
  })
}

beforeAll(() => { process.env.PAYMENT_WEBHOOK_SECRET = SECRET })

let orderId: string | undefined
let dedupKey: string | undefined
afterAll(async () => {
  if (orderId) {
    await admin.from('payment_events').delete().eq('matched_order_id', orderId)
    await admin.from('orders').delete().eq('id', orderId)
  }
})

describe('POST /api/payments/ingest/push', () => {
  it('rejects a missing Bearer token with 401', async () => {
    const res = await POST(req({ app: 'com.venmo', text: '$1.00' }))
    expect(res.status).toBe(401)
  })

  it('rejects a wrong Bearer token with 401', async () => {
    const res = await POST(req({ app: 'com.venmo', text: '$1.00' }, 'Bearer nope'))
    expect(res.status).toBe(401)
  })

  it('returns 422 on an unparseable amount', async () => {
    const res = await POST(req({ app: 'com.venmo', text: 'no money' }, `Bearer ${SECRET}`))
    expect(res.status).toBe(422)
  })

  it('ingests a valid push and auto-applies a matching order', async () => {
    const amount = 333.77
    const order_number = `KL-20260628-W${Math.floor(Math.random() * 9000 + 1000)}`
    const { data } = await admin.from('orders').insert({
      order_number, customer_name: 'Test', status: 'pending',
      payment_method: 'venmo', payment_status: 'unpaid', subtotal: amount, total: amount,
    }).select().single()
    orderId = data!.id

    const res = await POST(req(
      { app: 'com.venmo', title: 'Venmo', text: `Jane paid you $${amount} - ${order_number}` },
      `Bearer ${SECRET}`,
    ))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('applied')
    expect(json.orderNumber).toBe(order_number)

    const { data: od } = await admin.from('orders').select('payment_status').eq('id', orderId!).single()
    expect(od!.payment_status).toBe('paid')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/lib/webhook-push.test.ts`
Expected: FAIL ("Cannot find module '@/app/api/payments/ingest/push/route'").

- [ ] **Step 4: Write the route handler**

Create `src/app/api/payments/ingest/push/route.ts`:

```ts
import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { pushPayloadSchema } from '@/lib/payments/ingest/push-schema'
import { parsePushNotification } from '@/lib/payments/ingest/adapters/push'
import { toIngestPayload } from '@/lib/payments/ingest/normalize'

export const dynamic = 'force-dynamic'

function authorize(request: Request): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET
  if (!secret) throw new Error('PAYMENT_WEBHOOK_SECRET is not set')
  const got = Buffer.from(request.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret}`)
  return got.length === want.length && timingSafeEqual(got, want)
}

export async function POST(request: Request) {
  let ok: boolean
  try {
    ok = authorize(request)
  } catch {
    return Response.json({ error: 'server misconfigured' }, { status: 500 })
  }
  if (!ok) return Response.json({ error: 'unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 })
  }

  const parsed = pushPayloadSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'invalid payload' }, { status: 400 })

  let event
  try {
    event = parsePushNotification(parsed.data)
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 422 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('ingest_payment_event', { p_payload: toIngestPayload(event) })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const result = data as { status: string; order_number: string | null }
  return Response.json({ status: result.status, orderNumber: result.order_number })
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/lib/webhook-push.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/payments/ingest/push/route.ts .env.example tests/lib/webhook-push.test.ts
git commit -m "feat(payments): Bearer-authed push ingestion webhook"
```

---

### Task 7: Live pay page — status endpoint + polling watcher

**Files:**
- Create: `src/app/api/order/[order_number]/status/route.ts`
- Create: `src/app/order/[order_number]/payment-status.tsx`
- Modify: `src/app/order/[order_number]/page.tsx`
- Test: `tests/lib/order-status-route.test.ts`

**Interfaces:**
- Consumes: `getOrderForPayment` (`@/lib/orders/queries`).
- Produces: `GET` status route → `{ paymentStatus, status }` (404 if unknown), `no-store`; client `PaymentStatusWatcher` that polls every 4s (cap 150 polls ≈ 10 min) and flips to the paid view in place.

**FIRST:** confirm the dynamic-segment route-handler signature (`{ params }: { params: Promise<{ order_number: string }> }`) against `node_modules/next/dist/docs/`.

- [ ] **Step 1: Write the failing test for the status route**

Create `tests/lib/order-status-route.test.ts`:

```ts
import { afterAll, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { GET } from '@/app/api/order/[order_number]/status/route'

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

let orderId: string | undefined
afterAll(async () => { if (orderId) await admin.from('orders').delete().eq('id', orderId) })

function call(order_number: string) {
  return GET(new Request(`http://localhost/api/order/${order_number}/status`), {
    params: Promise.resolve({ order_number }),
  })
}

describe('GET /api/order/[order_number]/status', () => {
  it('returns the payment + order status for a real order', async () => {
    const order_number = `KL-20260628-S${Math.floor(Math.random() * 9000 + 1000)}`
    const { data } = await admin.from('orders').insert({
      order_number, customer_name: 'Test', status: 'pending',
      payment_method: 'venmo', payment_status: 'unpaid', subtotal: 5, total: 5,
    }).select().single()
    orderId = data!.id
    const res = await call(order_number)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ paymentStatus: 'unpaid', status: 'pending' })
  })

  it('returns 404 for an unknown order', async () => {
    const res = await call('KL-20260628-ZZZZ')
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/order-status-route.test.ts`
Expected: FAIL ("Cannot find module '.../status/route'").

- [ ] **Step 3: Write the status route**

Create `src/app/api/order/[order_number]/status/route.ts`:

```ts
import { getOrderForPayment } from '@/lib/orders/queries'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ order_number: string }> },
) {
  const { order_number } = await params
  const order = await getOrderForPayment(order_number)
  if (!order) return Response.json({ error: 'not found' }, { status: 404 })
  return Response.json(
    { paymentStatus: order.paymentStatus, status: order.status },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/lib/order-status-route.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the polling watcher (client component)**

Create `src/app/order/[order_number]/payment-status.tsx`:

```tsx
'use client'
import { useEffect, useState, type ReactNode } from 'react'
import type { Database } from '@/lib/supabase/database.types'

type PaymentStatus = Database['public']['Enums']['payment_status']

export function PaymentStatusWatcher({
  orderNumber,
  initialPaymentStatus,
  pendingPillLabel,
  codeSection,
  pendingBody,
  paidBody,
}: {
  orderNumber: string
  initialPaymentStatus: PaymentStatus
  pendingPillLabel: string
  codeSection: ReactNode
  pendingBody: ReactNode
  paidBody: ReactNode
}) {
  const [paid, setPaid] = useState(initialPaymentStatus === 'paid')

  useEffect(() => {
    if (paid) return
    let polls = 0
    const id = setInterval(async () => {
      if (++polls > 150) return clearInterval(id) // ~10 min cap
      try {
        const res = await fetch(`/api/order/${orderNumber}/status`, { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as { paymentStatus: PaymentStatus }
        if (data.paymentStatus === 'paid') {
          setPaid(true)
          clearInterval(id)
        }
      } catch {
        /* transient network error — keep polling */
      }
    }, 4000)
    return () => clearInterval(id)
  }, [orderNumber, paid])

  return (
    <>
      <div className="pill pill-emerald" style={{ marginBottom: 16 }}>
        {paid ? 'Payment received' : pendingPillLabel}
      </div>
      {codeSection}
      {paid ? paidBody : pendingBody}
    </>
  )
}
```

- [ ] **Step 6: Rewire `page.tsx` to use the watcher**

Replace the body of `src/app/order/[order_number]/page.tsx` (keep imports + `Line` helper; add the watcher import). The full file:

```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { getOrderForPayment } from "@/lib/orders/queries";
import { getPaymentAccountForMethod } from "@/lib/payments/accounts";
import { formatUSD } from "@/lib/products";
import { CopyButton } from "@/components/copy-button";
import { PaymentStatusWatcher } from "./payment-status";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = { zelle: "Zelle", cashapp: "Cash App", venmo: "Venmo" };

export default async function OrderPage({ params }: { params: Promise<{ order_number: string }> }) {
  const { order_number } = await params;
  const order = await getOrderForPayment(order_number);
  if (!order) notFound();
  const account = await getPaymentAccountForMethod(order.paymentMethod);
  const label = LABELS[order.paymentMethod] ?? order.paymentMethod;

  const codeSection = (
    <section style={{ border: "1px solid var(--hair)", borderRadius: 12, padding: 20, marginBottom: 16, textAlign: "center" }}>
      <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>Your Order Code</div>
      <div className="font-mono" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.04em", margin: "6px 0" }}>{order.orderNumber}</div>
      <CopyButton value={order.orderNumber} label="Copy code" />
      <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 6 }}>Include this code in your payment memo/note</div>
    </section>
  );

  const paidBody = (
    <p style={{ fontSize: 14 }}>We’ve received your payment. Your order is being processed and will ship soon.</p>
  );

  const pendingBody = (
    <section style={{ border: "1px solid var(--hair)", borderRadius: 12, padding: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{label} Payment Details</h2>
      {account?.qrUrl && (
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <Image src={account.qrUrl} alt={`${label} QR`} width={180} height={180} unoptimized />
        </div>
      )}
      <Line label={`Send ${label} to`} value={account?.handle ?? "—"} copy={account?.handle} />
      <Line label="Amount to send" value={formatUSD(order.total)} copy={String(order.total)} />
      <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: "rgba(245, 200, 66, 0.12)", border: "1px solid rgba(245,200,66,0.4)", fontSize: 13 }}>
        <strong>⚠ Include in payment note:</strong> your order code <span className="font-mono">{order.orderNumber}</span>. It’s all we need to match your payment to your order.
      </div>
      <ol style={{ marginTop: 16, paddingLeft: 18, fontSize: 13, color: "var(--ink-muted)", display: "flex", flexDirection: "column", gap: 6 }}>
        <li>Open {label} and send {formatUSD(order.total)} to {account?.handle ?? "our account"}.</li>
        <li>In the note, include your order code ({order.orderNumber}).</li>
        <li>Once payment is received, your order will ship.</li>
      </ol>
      <p style={{ marginTop: 16, fontSize: 12.5, color: "var(--ink-ghost)" }}>
        A confirmation email is on the way — please check your spam/junk folder. Refund policy: once an order has begun
        processing, no returns or refunds are possible unless there is an issue with the product with evidence provided.
      </p>
    </section>
  );

  return (
    <main className="container" style={{ padding: "32px 20px 80px", maxWidth: 560 }}>
      <PaymentStatusWatcher
        orderNumber={order.orderNumber}
        initialPaymentStatus={order.paymentStatus}
        pendingPillLabel={`Payment Pending — ${label}`}
        codeSection={codeSection}
        pendingBody={pendingBody}
        paidBody={paidBody}
      />
    </main>
  );
}

function Line({ label, value, copy }: { label: string; value: string; copy?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--hair)" }}>
      <div>
        <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{label}</div>
        <div className="font-mono" style={{ fontWeight: 600 }}>{value}</div>
      </div>
      {copy && <CopyButton value={copy} />}
    </div>
  );
}
```

- [ ] **Step 7: Verify the build compiles**

Run: `npm run build`
Expected: build succeeds (the order route + new client component compile).

- [ ] **Step 8: Commit**

```bash
git add "src/app/api/order/[order_number]/status/route.ts" "src/app/order/[order_number]/payment-status.tsx" "src/app/order/[order_number]/page.tsx" tests/lib/order-status-route.test.ts
git commit -m "feat(order): live payment-status polling on the pay page"
```

---

### Task 8: Admin payments-review queue (one-tap apply / dismiss)

**Files:**
- Modify: `src/lib/admin/sections.ts`
- Create: `src/app/admin/payments-review/page.tsx`
- Create: `src/app/admin/payments-review/actions-schema.ts`
- Create: `src/app/admin/payments-review/actions.ts`
- Create: `src/app/admin/payments-review/review-table.tsx`
- Create: `docs/admin-features/payments-review.md`

**Interfaces:**
- Consumes: `requireStaff`, `createClient` (server), `createAdminClient`, `apply_payment_event` RPC, `payment_events` table.
- Produces: `/admin/payments-review` page; server actions `applyEvent(eventId, orderNumber)` and `dismissEvent(eventId)` returning `{ ok: true } | { ok: false, error }`.

- [ ] **Step 1: Add the nav section**

In `src/lib/admin/sections.ts`, append to the `ADMIN_SECTIONS` array (after the `payment-accounts` entry):

```ts
  { slug: 'payments-review', label: 'Payments Review', table: 'payment_events', ownerOnly: false },
```

If `table` is a typed union that doesn't yet include `'payment_events'`, the regenerated `database.types.ts` (Task 3) already added it; if `TableName` is a hand-written union, add `'payment_events'` to it.

- [ ] **Step 2: Write the action schema (plain module)**

Create `src/app/admin/payments-review/actions-schema.ts`:

```ts
import { z } from 'zod'

export const applyEventSchema = z.object({
  eventId: z.guid(),
  orderNumber: z.string().regex(/^KL-\d{8}-[A-Z0-9]{4}$/, 'Enter a valid order code'),
})

export const dismissEventSchema = z.object({ eventId: z.guid() })
```

- [ ] **Step 3: Write the server actions**

Create `src/app/admin/payments-review/actions.ts`:

```ts
'use server'
import { refresh } from 'next/cache'
import { requireStaff } from '@/lib/auth/dal'
import { createAdminClient } from '@/lib/supabase/admin'
import { applyEventSchema, dismissEventSchema } from './actions-schema'

export async function applyEvent(eventId: string, orderNumber: string) {
  await requireStaff()
  const parsed = applyEventSchema.safeParse({ eventId, orderNumber })
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }
  const supabase = createAdminClient()
  const { error } = await supabase.rpc('apply_payment_event', {
    p_event_id: parsed.data.eventId,
    p_order_number: parsed.data.orderNumber,
  })
  if (error) return { ok: false as const, error: error.message }
  refresh()
  return { ok: true as const }
}

export async function dismissEvent(eventId: string) {
  await requireStaff()
  const parsed = dismissEventSchema.safeParse({ eventId })
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }
  const supabase = createAdminClient()
  const { error } = await supabase.from('payment_events')
    .update({ status: 'ignored' }).eq('id', parsed.data.eventId)
  if (error) return { ok: false as const, error: error.message }
  refresh()
  return { ok: true as const }
}
```

- [ ] **Step 4: Write the review table (client component)**

Create `src/app/admin/payments-review/review-table.tsx`:

```tsx
'use client'
import { useState, useTransition } from 'react'
import { applyEvent, dismissEvent } from './actions'

export interface ReviewRow {
  id: string
  method: string
  amount: number
  sender: string | null
  note: string | null
  raw_text: string
  received_at: string
  status: string
  candidate_orders: string[] | null
}

export function ReviewTable({ rows }: { rows: ReviewRow[] }) {
  if (rows.length === 0) {
    return <p style={{ color: 'var(--ink-muted)' }}>No events awaiting review.</p>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((r) => <Card key={r.id} row={r} />)}
    </div>
  )
}

function Card({ row }: { row: ReviewRow }) {
  const [orderNumber, setOrderNumber] = useState(row.candidate_orders?.[0] ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onApply() {
    setError(null)
    start(async () => {
      const res = await applyEvent(row.id, orderNumber.trim().toUpperCase())
      if (!res.ok) setError(res.error)
    })
  }
  function onDismiss() {
    setError(null)
    start(async () => {
      const res = await dismissEvent(row.id)
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <div style={{ border: '1px solid var(--hair)', borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <strong>${row.amount.toFixed(2)}</strong> · {row.method} · {row.status}
          <div style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
            {row.sender ?? 'unknown sender'} · {new Date(row.received_at).toLocaleString()}
          </div>
          {row.note && <div style={{ fontSize: 12.5, marginTop: 4 }}>note: {row.note}</div>}
          {row.candidate_orders?.length ? (
            <div style={{ fontSize: 12.5, marginTop: 4 }}>candidates: {row.candidate_orders.join(', ')}</div>
          ) : null}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="KL-YYYYMMDD-XXXX"
          className="font-mono"
          style={{ padding: '6px 8px', border: '1px solid var(--hair)', borderRadius: 6, fontSize: 13 }}
        />
        <button onClick={onApply} disabled={pending || !orderNumber.trim()} className="btn btn-primary">
          Apply to order
        </button>
        <button onClick={onDismiss} disabled={pending} className="btn">Dismiss</button>
        {error && <span style={{ color: 'crimson', fontSize: 12.5 }}>{error}</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write the page**

Create `src/app/admin/payments-review/page.tsx`:

```tsx
import { requireStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { ReviewTable, type ReviewRow } from './review-table'

export const metadata = { title: 'Payments Review · Kairo Labs Admin' }

export default async function PaymentsReviewPage() {
  await requireStaff()
  const supabase = await createClient()
  const { data } = await supabase
    .from('payment_events')
    .select('id, method, amount, sender, note, raw_text, received_at, status, candidate_orders')
    .in('status', ['unmatched', 'ambiguous'])
    .order('received_at', { ascending: false })

  const rows: ReviewRow[] = (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) }))

  return (
    <section>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Payments Review</h1>
      <p style={{ color: 'var(--ink-muted)', marginBottom: 20 }}>
        Payments the auto-matcher couldn’t confirm on its own. Apply each to the right order, or dismiss it.
      </p>
      <ReviewTable rows={rows} />
    </section>
  )
}
```

- [ ] **Step 6: Write the admin brief**

Create `docs/admin-features/payments-review.md`:

```markdown
# Payments Review

`/admin/payments-review` (all staff). Lists `payment_events` with status
`unmatched` or `ambiguous` — payments the auto-reconciliation engine recorded
but could not confirm to a single order.

- **unmatched** — no unpaid order matched the amount + method in the last 30 days.
- **ambiguous** — two or more unpaid orders matched; `candidate_orders` lists them.

Each card shows amount, method, sender, note, and received time. Staff type (or
pick) the target order code and **Apply to order** → calls `apply_payment_event`
(→ `mark_order_paid`: marks the order paid, records a `payments` row, links the
event as `applied`). **Dismiss** sets the event to `ignored`.

Auto-confirmed payments never appear here — a single exact amount+method match (or
an order code in the memo that resolves to the matching order) is applied
automatically by `ingest_payment_event`.
```

- [ ] **Step 7: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 8: Commit**

```bash
git add src/lib/admin/sections.ts src/app/admin/payments-review/ docs/admin-features/payments-review.md
git commit -m "feat(admin): payments review queue — one-tap apply / dismiss"
```

---

### Task 9 (OPTIONAL): Realtime broadcast upgrade

Only do this after Tasks 1–8 are green and committed. Polling already satisfies the
goal; this makes the flip near-instant. Skippable.

**Files:**
- Modify: `src/app/api/payments/ingest/push/route.ts` (publish on apply)
- Modify: `src/app/admin/payments-review/actions.ts` (publish on apply)
- Modify: `src/app/order/[order_number]/payment-status.tsx` (subscribe)

**Interfaces:**
- Produces: a `payment_confirmed` broadcast on channel `order:<order_number>`,
  published server-side whenever an order is confirmed; the watcher subscribes via
  the anon realtime client and flips immediately, with polling still as fallback.

- [ ] **Step 1: Add a publish helper**

Create `src/lib/payments/realtime.ts`:

```ts
import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

// Fire-and-forget broadcast that an order was confirmed. Anon clients can
// subscribe to broadcast channels without table RLS access.
export async function publishOrderPaid(orderNumber: string): Promise<void> {
  const supabase = createAdminClient()
  const channel = supabase.channel(`order:${orderNumber}`, { config: { broadcast: { ack: true } } })
  try {
    await channel.send({ type: 'broadcast', event: 'payment_confirmed', payload: { orderNumber } })
  } finally {
    await supabase.removeChannel(channel)
  }
}
```

- [ ] **Step 2: Publish from the webhook + the admin action**

In `route.ts`, after a successful RPC where `result.status === 'applied'` and `result.order_number`:

```ts
  if (result.status === 'applied' && result.order_number) {
    const { publishOrderPaid } = await import('@/lib/payments/realtime')
    await publishOrderPaid(result.order_number)
  }
```

In `applyEvent` (actions.ts), after `refresh()` is reached on success, before `return`:

```ts
  const { publishOrderPaid } = await import('@/lib/payments/realtime')
  await publishOrderPaid(parsed.data.orderNumber)
```

- [ ] **Step 3: Subscribe in the watcher**

In `payment-status.tsx`, inside the existing `useEffect` (before the `setInterval`), add a subscription using the browser client (`@/lib/supabase/client`):

```tsx
    import('@/lib/supabase/client').then(({ createClient }) => {
      const sb = createClient()
      const ch = sb
        .channel(`order:${orderNumber}`)
        .on('broadcast', { event: 'payment_confirmed' }, () => { setPaid(true); clearInterval(id) })
        .subscribe()
      cleanup = () => { sb.removeChannel(ch) }
    })
```

Declare `let cleanup = () => {}` above and call it in the effect's return alongside `clearInterval(id)`.

- [ ] **Step 4: Manual verification**

Start dev (`npm run dev`), open a pending order page, POST a matching event to the
webhook with curl, and confirm the page flips without waiting for the 4s poll.

- [ ] **Step 5: Commit**

```bash
git add src/lib/payments/realtime.ts "src/app/order/[order_number]/payment-status.tsx" src/app/admin/payments-review/actions.ts src/app/api/payments/ingest/push/route.ts
git commit -m "feat(order): instant pay-page flip via Supabase Realtime broadcast"
```

---

### Task 10: Full verification + docs cross-link

**Files:**
- Modify: `docs/superpowers/specs/2026-06-27-storefront-checkout-payments-design.md` (mark Phase 2 built)

- [ ] **Step 1: Run the entire test suite**

Run: `npm test`
Expected: all tests pass (existing + the new DB/lib suites). `supabase start` must be running.

- [ ] **Step 2: Build + lint clean**

Run: `npm run build && npm run lint`
Expected: both succeed with no errors.

- [ ] **Step 3: Cross-link the Phase 1 spec**

In `docs/superpowers/specs/2026-06-27-storefront-checkout-payments-design.md`, under the "Auto-reconciliation is Phase 2" bullet, append: `Built 2026-06-28 — see docs/superpowers/specs/2026-06-28-payment-auto-reconciliation-design.md and the matching plan.`

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-06-27-storefront-checkout-payments-design.md
git commit -m "docs: link Phase 2 auto-reconciliation from the Phase 1 checkout spec"
```

- [ ] **Step 5: Report deployment note**

Remind the user: prod needs `npx supabase db push` (migration `0010`) and the
`PAYMENT_WEBHOOK_SECRET` env var set in the deploy environment before the webhook
will work. The agent cannot run the prod push.

---

## Self-review notes (author)

- **Spec coverage:** every spec section maps to a task — data model (T1–3), engine
  (T2), ingestion adapter (T4–5), webhook (T6), live page (T7), admin queue (T8),
  realtime upgrade (T9, optional), security (Bearer + dedup + service_role grants
  across T1/T2/T6), inventory-deferred seam (T1 comment).
- **Order code is matched from `raw_text`** (not just `note`) in `ingest_payment_event` —
  more robust than the spec's "from note"; the column `note` is kept for display.
- **Determinism:** DB tests use unique amounts + cleanup so the amount-window scan
  can't collide across tests (`fileParallelism: false` already serializes files).
- **Type regen** happens once (T3) after all RPCs/table exist; vitest doesn't
  typecheck, so earlier DB tests run fine against string RPC names; `npm run build`
  in T7/T8/T10 is the typecheck gate.
- **Fork gotchas honored:** `'use server'` actions export async fns only (schemas in
  `actions-schema.ts` / `push-schema.ts`); `refresh()` after admin mutations; route
  handlers verified against `node_modules/next/dist/docs/` before writing.
