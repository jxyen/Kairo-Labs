# Admin Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/admin/inventory` feature — view stock per SKU, highlight low stock, and record atomic restock/adjustment movements.

**Architecture:** A client-injected data layer (`src/lib/admin/inventory.ts`) is called by both the RLS request path and service-role tests. A Postgres RPC (migration 0007) makes each movement + stock update atomic. The page is a server component; an expandable client table holds the restock/adjust forms and on-demand history. Server Actions in the feature's own folder guard with `requireStaff()`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19 (`useActionState`), Supabase (`@supabase/ssr` server client + `@supabase/supabase-js` types), Vitest.

## Global Constraints

- Do not edit migrations `0001`–`0005`; new schema only in `0007_*.sql`.
- Every new migration grants `select, insert, update, delete` (and `execute` for functions) to **both** `service_role` and `authenticated` (auto-expose is disabled).
- Server Actions go in `src/app/admin/inventory/actions.ts` only — never append to `src/app/admin/actions.ts`.
- `requireStaff()` at the top of the page and every Server Action.
- Request-path DB access uses `@/lib/supabase/server`; `@/lib/supabase/admin` is never used in a request path (tests use a raw service-role client).
- Do not touch the storefront, `admin-nav.tsx`, `layout.tsx`, or `sections.ts`.
- Run `npm run db:types` after the migration; expect to regenerate again after merging main.
- Read the relevant guide under `node_modules/next/dist/docs/` before writing Next.js code (breaking changes vs. prior versions).

---

### Task 1: Migration 0007 — note column + atomic RPC

**Files:**
- Create: `supabase/migrations/0007_inventory_movement_note_and_rpc.sql`
- Run: `npm run db:reset` (applies all migrations + this one), then `npm run db:seed`, then `npm run db:types`

**Interfaces:**
- Produces: column `inventory_movements.note text`; RPC `apply_inventory_movement(p_size_id uuid, p_delta integer, p_reason public.inventory_reason, p_note text, p_created_by uuid) returns void` that inserts a movement and updates `inventory.quantity_on_hand` atomically, raising if the SKU has no inventory row or the result would be negative.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0007_inventory_movement_note_and_rpc.sql

-- adjustments carry a human note
alter table public.inventory_movements add column note text;

-- record a movement AND update stock atomically (one transaction)
create or replace function public.apply_inventory_movement(
  p_size_id    uuid,
  p_delta      integer,
  p_reason     public.inventory_reason,
  p_note       text,
  p_created_by uuid
) returns void
  language plpgsql
  security invoker            -- existing is_staff() RLS still gates writes
  set search_path = public as $$
declare
  new_qty integer;
begin
  insert into public.inventory_movements (size_id, delta, reason, note, created_by)
  values (p_size_id, p_delta, p_reason, p_note, p_created_by);

  update public.inventory
     set quantity_on_hand = quantity_on_hand + p_delta,
         updated_at = now()
   where size_id = p_size_id
  returning quantity_on_hand into new_qty;

  if new_qty is null then
    raise exception 'no inventory row for size %', p_size_id;
  end if;
  if new_qty < 0 then
    raise exception 'movement would drive stock negative (%)', new_qty;
  end if;
end;
$$;

grant execute on function public.apply_inventory_movement(
  uuid, integer, public.inventory_reason, text, uuid
) to authenticated, service_role;
```

- [ ] **Step 2: Apply, reseed, regenerate types**

Run: `npm run db:reset && npm run db:seed && npm run db:types`
Expected: reset applies migrations with no error; seed prints `Seeded N products.`; `git diff src/lib/supabase/database.types.ts` now shows `note: string | null` on `inventory_movements` and an `apply_inventory_movement` entry under `Functions`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0007_inventory_movement_note_and_rpc.sql src/lib/supabase/database.types.ts
git commit -m "feat(inventory): migration 0007 — movement note + atomic apply RPC"
```

---

### Task 2: Data layer — `src/lib/admin/inventory.ts`

**Files:**
- Create: `src/lib/admin/inventory.ts`
- Test: `tests/db/inventory.test.ts` (extend existing — keep the current schema smoke test)

**Interfaces:**
- Consumes: `apply_inventory_movement` RPC (Task 1); `Database` types (regenerated in Task 1).
- Produces:
  - `type InventoryRow = { sizeId: string; sku: string; mg: string; price: number; productName: string; productCode: string; quantityOnHand: number; reorderThreshold: number; updatedAt: string; lowStock: boolean }`
  - `type Movement = { id: string; delta: number; reason: 'restock' | 'sale' | 'adjustment'; note: string | null; createdAt: string }`
  - `listInventory(client: SupabaseClient<Database>): Promise<InventoryRow[]>` — low-stock first, then sku asc.
  - `listMovements(client: SupabaseClient<Database>, sizeId: string, limit?: number): Promise<Movement[]>` — newest first, default limit 20.
  - `applyMovement(client, { sizeId, delta, reason, note, createdBy }): Promise<void>`
  - `restock(client, { sizeId, qty, createdBy }): Promise<void>` — delta `+qty`, reason `'restock'`, note null; throws if `qty <= 0`.
  - `adjust(client, { sizeId, delta, note, createdBy }): Promise<void>` — reason `'adjustment'`; throws if `delta === 0` or `note` is empty.

- [ ] **Step 1: Write the failing tests** (append to `tests/db/inventory.test.ts`, after the existing block)

```ts
import {
  listInventory, listMovements, restock, adjust,
} from '../../src/lib/admin/inventory'

// helper: create a throwaway product+size+inventory row, return ids
async function makeSku(opts: { qty?: number; threshold?: number } = {}) {
  const { data: p } = await admin.from('products')
    .insert({ code: `DA-${Date.now()}`, name: 'DA', sub: 's', category: 'Recovery & Repair' })
    .select().single()
  const { data: size } = await admin.from('product_sizes')
    .insert({ product_id: p!.id, mg: '5 mg', price: 1, sku: `DA-${Date.now()}-5MG` })
    .select().single()
  await admin.from('inventory').insert({
    size_id: size!.id,
    quantity_on_hand: opts.qty ?? 0,
    reorder_threshold: opts.threshold ?? 0,
  })
  return { productId: p!.id, sizeId: size!.id, sku: size!.sku }
}

describe('inventory data layer', () => {
  it('restock increments stock and writes a restock movement', async () => {
    const { productId, sizeId } = await makeSku({ qty: 0 })
    await restock(admin, { sizeId, qty: 50, createdBy: null })
    const { data: inv } = await admin.from('inventory')
      .select('quantity_on_hand').eq('size_id', sizeId).single()
    expect(inv!.quantity_on_hand).toBe(50)
    const moves = await listMovements(admin, sizeId)
    expect(moves[0]).toMatchObject({ delta: 50, reason: 'restock' })
    await admin.from('products').delete().eq('id', productId)
  })

  it('adjust applies a signed delta and stores the note', async () => {
    const { productId, sizeId } = await makeSku({ qty: 10 })
    await adjust(admin, { sizeId, delta: -3, note: 'damaged', createdBy: null })
    const { data: inv } = await admin.from('inventory')
      .select('quantity_on_hand').eq('size_id', sizeId).single()
    expect(inv!.quantity_on_hand).toBe(7)
    const moves = await listMovements(admin, sizeId)
    expect(moves[0]).toMatchObject({ delta: -3, reason: 'adjustment', note: 'damaged' })
    await admin.from('products').delete().eq('id', productId)
  })

  it('rejects an adjustment that would drive stock negative', async () => {
    const { productId, sizeId } = await makeSku({ qty: 2 })
    await expect(adjust(admin, { sizeId, delta: -5, note: 'oops', createdBy: null }))
      .rejects.toThrow()
    const { data: inv } = await admin.from('inventory')
      .select('quantity_on_hand').eq('size_id', sizeId).single()
    expect(inv!.quantity_on_hand).toBe(2) // unchanged
    expect(await listMovements(admin, sizeId)).toHaveLength(0) // ledger unchanged
    await admin.from('products').delete().eq('id', productId)
  })

  it('listInventory returns joined fields and a lowStock flag', async () => {
    const { productId, sizeId, sku } = await makeSku({ qty: 1, threshold: 3 })
    const rows = await listInventory(admin)
    const row = rows.find((r) => r.sizeId === sizeId)
    expect(row).toBeDefined()
    expect(row).toMatchObject({ sku, quantityOnHand: 1, reorderThreshold: 3, lowStock: true })
    expect(row!.productName).toBe('DA')
    await admin.from('products').delete().eq('id', productId)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/db/inventory.test.ts`
Expected: FAIL — cannot resolve `../../src/lib/admin/inventory`.

- [ ] **Step 3: Implement the data layer**

```ts
// src/lib/admin/inventory.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type Client = SupabaseClient<Database>
export type Reason = Database['public']['Enums']['inventory_reason']

export type InventoryRow = {
  sizeId: string
  sku: string
  mg: string
  price: number
  productName: string
  productCode: string
  quantityOnHand: number
  reorderThreshold: number
  updatedAt: string
  lowStock: boolean
}

export type Movement = {
  id: string
  delta: number
  reason: Reason
  note: string | null
  createdAt: string
}

export async function listInventory(client: Client): Promise<InventoryRow[]> {
  const { data, error } = await client
    .from('inventory')
    .select(
      'size_id, quantity_on_hand, reorder_threshold, updated_at, ' +
        'product_sizes!inner(sku, mg, price, products!inner(name, code))',
    )
  if (error) throw error

  const rows: InventoryRow[] = (data ?? []).map((r) => {
    // supabase types nested !inner relations as arrays in some versions; normalise
    const size = Array.isArray(r.product_sizes) ? r.product_sizes[0] : r.product_sizes
    const product = Array.isArray(size.products) ? size.products[0] : size.products
    return {
      sizeId: r.size_id,
      sku: size.sku,
      mg: size.mg,
      price: size.price,
      productName: product.name,
      productCode: product.code,
      quantityOnHand: r.quantity_on_hand,
      reorderThreshold: r.reorder_threshold,
      updatedAt: r.updated_at,
      lowStock: r.quantity_on_hand <= r.reorder_threshold,
    }
  })

  rows.sort((a, b) =>
    a.lowStock === b.lowStock ? a.sku.localeCompare(b.sku) : a.lowStock ? -1 : 1,
  )
  return rows
}

export async function listMovements(
  client: Client,
  sizeId: string,
  limit = 20,
): Promise<Movement[]> {
  const { data, error } = await client
    .from('inventory_movements')
    .select('id, delta, reason, note, created_at')
    .eq('size_id', sizeId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((m) => ({
    id: m.id,
    delta: m.delta,
    reason: m.reason,
    note: m.note,
    createdAt: m.created_at,
  }))
}

export async function applyMovement(
  client: Client,
  args: { sizeId: string; delta: number; reason: Reason; note: string | null; createdBy: string | null },
): Promise<void> {
  const { error } = await client.rpc('apply_inventory_movement', {
    p_size_id: args.sizeId,
    p_delta: args.delta,
    p_reason: args.reason,
    p_note: args.note,
    p_created_by: args.createdBy,
  })
  if (error) throw new Error(error.message)
}

export async function restock(
  client: Client,
  args: { sizeId: string; qty: number; createdBy: string | null },
): Promise<void> {
  if (!Number.isInteger(args.qty) || args.qty <= 0) throw new Error('Restock quantity must be a positive whole number.')
  await applyMovement(client, { sizeId: args.sizeId, delta: args.qty, reason: 'restock', note: null, createdBy: args.createdBy })
}

export async function adjust(
  client: Client,
  args: { sizeId: string; delta: number; note: string; createdBy: string | null },
): Promise<void> {
  if (!Number.isInteger(args.delta) || args.delta === 0) throw new Error('Adjustment must be a non-zero whole number.')
  if (!args.note.trim()) throw new Error('Adjustment requires a note.')
  await applyMovement(client, { sizeId: args.sizeId, delta: args.delta, reason: 'adjustment', note: args.note.trim(), createdBy: args.createdBy })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/db/inventory.test.ts`
Expected: PASS (5 tests — the original smoke test plus the 4 new ones).

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/inventory.ts tests/db/inventory.test.ts
git commit -m "feat(inventory): client-injected data layer + tests"
```

---

### Task 3: Server Actions — `src/app/admin/inventory/actions.ts`

**Files:**
- Create: `src/app/admin/inventory/actions.ts`

**Interfaces:**
- Consumes: `restock`, `adjust`, `listMovements`, `Movement` (Task 2); `requireStaff` from `@/lib/auth/dal`; `createClient` from `@/lib/supabase/server`.
- Produces:
  - `type ActionState = { error?: string; ok?: boolean }`
  - `restockAction(prev: ActionState | undefined, formData: FormData): Promise<ActionState>`
  - `adjustAction(prev: ActionState | undefined, formData: FormData): Promise<ActionState>`
  - `fetchMovementsAction(sizeId: string): Promise<Movement[]>`

- [ ] **Step 1: Implement the actions** (no separate unit test — exercised via the data layer in Task 2 and the build/manual check in Task 5; logic here is thin parse-and-delegate)

```ts
// src/app/admin/inventory/actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { restock, adjust, listMovements, type Movement } from '@/lib/admin/inventory'

export type ActionState = { error?: string; ok?: boolean }

export async function restockAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff()
  const sizeId = String(formData.get('sizeId') ?? '')
  const qty = Number(formData.get('qty'))
  if (!sizeId) return { error: 'Missing SKU.' }
  if (!Number.isInteger(qty) || qty <= 0) return { error: 'Enter a positive whole number to restock.' }
  try {
    const supabase = await createClient()
    await restock(supabase, { sizeId, qty, createdBy: staff.id })
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Restock failed.' }
  }
  revalidatePath('/admin/inventory')
  return { ok: true }
}

export async function adjustAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff()
  const sizeId = String(formData.get('sizeId') ?? '')
  const delta = Number(formData.get('delta'))
  const note = String(formData.get('note') ?? '')
  if (!sizeId) return { error: 'Missing SKU.' }
  if (!Number.isInteger(delta) || delta === 0) return { error: 'Enter a non-zero whole number (e.g. -2 or 5).' }
  if (!note.trim()) return { error: 'A note is required for adjustments.' }
  try {
    const supabase = await createClient()
    await adjust(supabase, { sizeId, delta, note, createdBy: staff.id })
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Adjustment failed.' }
  }
  revalidatePath('/admin/inventory')
  return { ok: true }
}

export async function fetchMovementsAction(sizeId: string): Promise<Movement[]> {
  await requireStaff()
  const supabase = await createClient()
  return listMovements(supabase, sizeId)
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors from `actions.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/inventory/actions.ts
git commit -m "feat(inventory): server actions (restock, adjust, fetch history)"
```

---

### Task 4: UI — page + expandable client table

**Files:**
- Modify (replace stub): `src/app/admin/inventory/page.tsx`
- Create: `src/app/admin/inventory/inventory-table.tsx`

**Interfaces:**
- Consumes: `requireStaff` (DAL); `createClient` (`@/lib/supabase/server`); `listInventory`, `InventoryRow`, `Movement` (Task 2); `restockAction`, `adjustAction`, `fetchMovementsAction`, `ActionState` (Task 3).
- Produces: default-exported `InventoryPage` server component; `InventoryTable` client component (`{ rows: InventoryRow[] }`).

- [ ] **Step 1: Replace the page stub**

```tsx
// src/app/admin/inventory/page.tsx
import { requireStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { listInventory } from '@/lib/admin/inventory'
import { InventoryTable } from './inventory-table'

export default async function InventoryPage() {
  await requireStaff()
  const supabase = await createClient()
  const rows = await listInventory(supabase)
  const low = rows.filter((r) => r.lowStock).length

  return (
    <section>
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <span className="text-sm text-black/50">
          {rows.length} SKUs{low > 0 && <> · <span className="text-amber-700">{low} low</span></>}
        </span>
      </header>
      <InventoryTable rows={rows} />
    </section>
  )
}
```

- [ ] **Step 2: Build the client table** (read `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` first — confirms `useActionState` + form `action` usage)

```tsx
// src/app/admin/inventory/inventory-table.tsx
'use client'
import { useActionState, useEffect, useState, useTransition } from 'react'
import {
  restockAction, adjustAction, fetchMovementsAction, type ActionState,
} from './actions'
import type { InventoryRow, Movement } from '@/lib/admin/inventory'

export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <div className="overflow-hidden rounded-lg border border-black/10">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-black/50">
          <tr>
            <th className="px-4 py-2 font-medium">SKU</th>
            <th className="px-4 py-2 font-medium">Product</th>
            <th className="px-4 py-2 font-medium text-right">On hand</th>
            <th className="px-4 py-2 font-medium text-right">Reorder @</th>
            <th className="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Row key={r.sizeId} row={r} open={openId === r.sizeId}
              onToggle={() => setOpenId(openId === r.sizeId ? null : r.sizeId)} />
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-black/50">No SKUs yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Row({ row, open, onToggle }: { row: InventoryRow; open: boolean; onToggle: () => void }) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-t border-black/5 ${row.lowStock ? 'bg-amber-50' : ''} hover:bg-black/[0.02]`}
      >
        <td className="px-4 py-2 font-mono text-xs">{row.sku}</td>
        <td className="px-4 py-2">{row.productName} <span className="text-black/40">{row.mg}</span></td>
        <td className="px-4 py-2 text-right tabular-nums">{row.quantityOnHand}</td>
        <td className="px-4 py-2 text-right tabular-nums text-black/50">{row.reorderThreshold}</td>
        <td className="px-4 py-2">
          {row.lowStock
            ? <span className="inline-flex items-center gap-1.5 text-amber-700"><span className="h-2 w-2 rounded-full bg-amber-500" />LOW</span>
            : <span className="inline-flex items-center gap-1.5 text-black/50"><span className="h-2 w-2 rounded-full bg-emerald-500" />OK</span>}
        </td>
      </tr>
      {open && (
        <tr className="border-t border-black/5 bg-neutral-50/60">
          <td colSpan={5} className="px-4 py-4">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr_1.2fr]">
              <RestockForm sizeId={row.sizeId} />
              <AdjustForm sizeId={row.sizeId} />
              <History sizeId={row.sizeId} open={open} />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function RestockForm({ sizeId }: { sizeId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(restockAction, {})
  return (
    <form action={action} className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-black/50">Restock</p>
      <input type="hidden" name="sizeId" value={sizeId} />
      <input name="qty" type="number" min={1} step={1} required placeholder="Qty"
        className="w-full rounded border border-black/15 px-2 py-1" />
      <button disabled={pending}
        className="rounded bg-black px-3 py-1 text-white disabled:opacity-50">
        {pending ? 'Saving…' : 'Restock'}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.ok && <p className="text-xs text-emerald-700">Stock updated.</p>}
    </form>
  )
}

function AdjustForm({ sizeId }: { sizeId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(adjustAction, {})
  return (
    <form action={action} className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-black/50">Adjust</p>
      <input type="hidden" name="sizeId" value={sizeId} />
      <input name="delta" type="number" step={1} required placeholder="± Qty (e.g. -2)"
        className="w-full rounded border border-black/15 px-2 py-1" />
      <input name="note" type="text" required placeholder="Reason / note"
        className="w-full rounded border border-black/15 px-2 py-1" />
      <button disabled={pending}
        className="rounded bg-black px-3 py-1 text-white disabled:opacity-50">
        {pending ? 'Saving…' : 'Apply'}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.ok && <p className="text-xs text-emerald-700">Adjusted.</p>}
    </form>
  )
}

function History({ sizeId, open }: { sizeId: string; open: boolean }) {
  const [moves, setMoves] = useState<Movement[] | null>(null)
  const [, startTransition] = useTransition()
  useEffect(() => {
    if (!open) return
    startTransition(async () => setMoves(await fetchMovementsAction(sizeId)))
  }, [open, sizeId])
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-black/50">History</p>
      {moves === null && <p className="text-xs text-black/40">Loading…</p>}
      {moves?.length === 0 && <p className="text-xs text-black/40">No movements yet.</p>}
      <ul className="space-y-1">
        {moves?.map((m) => (
          <li key={m.id} className="flex items-baseline gap-2 text-xs">
            <span className={`font-mono ${m.delta < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {m.delta > 0 ? `+${m.delta}` : m.delta}
            </span>
            <span className="text-black/60">{m.reason}</span>
            {m.note && <span className="text-black/40">“{m.note}”</span>}
            <span className="ml-auto text-black/30">{new Date(m.createdAt).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/inventory/page.tsx src/app/admin/inventory/inventory-table.tsx
git commit -m "feat(inventory): stock table UI with restock/adjust + history"
```

---

### Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the whole test suite**

Run: `npm run test`
Expected: all suites pass (inventory data-layer tests included).

- [ ] **Step 2: Typecheck + lint + production build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all succeed; `/admin/inventory` appears in the build output.

- [ ] **Step 3 (manual, optional): dev smoke**

Run: `npm run dev`, log in at `/admin/login`, open `/admin/inventory`. Verify: low-stock rows are amber; expanding a row shows both forms + history; restock raises on-hand; an over-decrement adjustment shows the negative-stock error inline.

---

## Self-Review

**Spec coverage:**
- View stock per SKU → `listInventory` + table (Tasks 2, 4). ✓
- Low-stock highlight → `lowStock` flag + amber row/badge (Tasks 2, 4). ✓
- Restock writes movement + updates qty atomically → RPC + `restock` + `restockAction` (Tasks 1–3). ✓
- Adjustment with note → `note` column + `adjust` + `adjustAction` (Tasks 1–3). ✓
- Per-SKU history → `listMovements` + `fetchMovementsAction` + `History` (Tasks 2–4). ✓
- RLS respected (no service-role in request path) → server client in page/actions; service-role only in tests (Tasks 2–4). ✓
- Tests cover data-access functions → Task 2. ✓
- Types regenerated → Task 1 Step 2. ✓

**Placeholder scan:** none — every code step is complete.

**Type consistency:** `InventoryRow`/`Movement`/`ActionState` and function signatures (`listInventory`, `listMovements`, `restock`, `adjust`, `applyMovement`, `restockAction`, `adjustAction`, `fetchMovementsAction`) are used identically across tasks. RPC param names (`p_size_id`, …) match between Task 1 and `applyMovement` in Task 2.
