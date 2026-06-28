# Payment auto-reconciliation (Phase 2) — design spec

**Date:** 2026-06-28
**Feature:** Auto-confirm storefront P2P payments (Zelle / Cash App / Venmo)
**Migration number:** `0010`
**Branch base:** `main` (work in worktree `payment-auto-reconcile`)
**Builds on:** `docs/superpowers/specs/2026-06-27-storefront-checkout-payments-design.md`
(Phase 1 — manual P2P checkout, now merged to `main`).

## Goal

A shopper places an order (`pending` / `unpaid`), pays in their P2P app
(**Zelle, Cash App, or Venmo** — we keep P2P, we do **not** switch to card
processors), and when they return to `/order/[order_number]` the page shows a
**confirmed** order — ideally updating live without a manual reload. The manual
"staff marks it paid" step from Phase 1 is replaced by an automated
reconciliation engine, with a staff one-tap review queue as the fallback for
anything the engine can't confirm on its own.

## What Phase 1 already gives us (verified in code)

- `place_order(p_items, p_customer, p_payment_method)` SECURITY DEFINER RPC —
  the only anon write into `orders`; generates `KL-YYYYMMDD-XXXX` order numbers
  (alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), recomputes all money, inserts
  `orders` (`status='pending'`, `payment_status='unpaid'`) + `order_items`.
  `supabase/migrations/0008_storefront_checkout.sql:48-135`.
- `get_order_for_payment(p_order_number)` SECURITY DEFINER RPC — returns only
  `order_number, total, payment_method, status, payment_status, created_at`.
  `0008:138-152`.
- `orders` / `order_items` / `payments` tables + enums (`0004_orders.sql`):
  `payment_method` = `venmo|cashapp|zelle|card|applepay|googlepay|crypto|other`;
  `payment_status` = `unpaid|paid|refunded`; `order_status` =
  `pending|paid|fulfilled|shipped|delivered|cancelled|refunded`;
  `payment_record_status` (on `payments.status`) = `pending|confirmed|refunded`.
- `payment_accounts` table + `/admin/payment-accounts` (owner-only editor).
- The pay page `src/app/order/[order_number]/page.tsx` — a **static server
  component** (`export const dynamic = "force-dynamic"`, no polling). It computes
  `const paid = order.paymentStatus === "paid"` and branches between a "Payment
  received" pill/copy and the pending payment-instructions block. **This is the
  exact seam where live updates plug in.**
- Supabase clients: cookieless anon (`@/lib/catalog/client` →
  `createPublicClient()`), cookie server (`@/lib/supabase/server`), and
  service-role admin (`@/lib/supabase/admin` → `createAdminClient()`).
- Admin pattern: `requireStaff()` / `requireOwner()` / `getCurrentStaff()` in
  `src/lib/auth/dal.ts`; nav driven by `ADMIN_SECTIONS` in
  `src/lib/admin/sections.ts` (each `{ slug, label, table, ownerOnly }`).
- Tests: Vitest against **local** Supabase (`127.0.0.1:54321`), service-role
  client, `fileParallelism: false`. Scripts: `db:reset`, `db:seed`, `db:types`,
  `test`.

### What does NOT exist yet (Phase 2 must build)

- **No mark-paid flow at all.** Nothing sets `orders.payment_status='paid'` or
  inserts into `payments`. Phase 2 builds this shared core for the first time.
- **No API route handlers** (`src/app/api/**` is empty). The ingestion webhook is
  the repo's first route handler — read `node_modules/next/dist/docs/` for the
  fork's route-handler API before writing it (per AGENTS.md).

## Decisions (settled in brainstorming — do NOT re-open)

1. **Detection channel built FIRST: push-notification forwarder.** A dedicated
   always-on Android device logged into all three apps runs a
   NotificationListenerService (custom app, or Tasker/MacroDroid) that catches
   each "You received $X from Y" push and POSTs it to our webhook. Email + Plaid
   are future backup adapters — **build the engine channel-agnostic** so they
   drop in behind the same normalizer + matching core.

2. **Pluggable ingestion architecture:**
   ```
   [Android push fwd] → POST /api/payments/ingest/push  (Bearer-authed)
        → push adapter (parse app payload) → NormalizedPaymentEvent
        → ingest_payment_event() RPC (dedup → record → match → maybe auto-apply)
        → strong match? auto-confirm : staff review queue
   ```
   One thin authenticated endpoint **per channel**; all channels normalize to the
   same payload and call the same matching core.

3. **Normalized payload:**
   `{ method, amount, sender, note?, timestamp, rawText }` (+ `channel`,
   `externalId?` for provenance/dedup).

4. **Trust model:** auto-confirm on a **STRONG** match; otherwise a staff
   **one-tap review queue**.

5. **Matching — amount + time-window is the backbone; order code is a bonus
   signal:**
   - Parse the order code `KL-YYYYMMDD-XXXX` from the note when present (mostly
     Venmo; usually absent on Cash App / Zelle).
   - **Strong match (auto-confirm) when:** exactly **one** unpaid order matches
     **method + exact amount** within a recent window. A valid order code in the
     note that resolves to that same unpaid order is corroborating and also
     strong — but a code is **never** sufficient on its own if the amount
     disagrees (→ review).
   - **2+ candidate orders → ambiguous → staff one-tap queue.**
   - **0 candidates → unmatched → staff queue.**
   - Match constraints: `payment_status='unpaid'`, `payment_method = event.method`,
     `total = event.amount` (exact, to the cent — the customer is shown the exact
     amount), `created_at >= now() - INTERVAL '30 days'` (window guards against
     matching a stale abandoned order; tunable constant).

6. **Security:**
   - Webhook authed by a shared **Bearer secret** (`PAYMENT_WEBHOOK_SECRET`),
     constant-time compared; 401 on mismatch.
   - **Dedup** raw events via a `dedup_key` unique constraint (a hash of the
     normalized event) — redelivery is a no-op.
   - **One event applies to at most one order**; **one order is never
     double-paid** (idempotency guards in the apply core).
   - The matching/apply RPCs are SECURITY DEFINER, `execute` granted to
     **`service_role` only** — never `anon`. The webhook holds the Bearer secret
     **and** calls via the service-role client (two layers).

7. **Data model — new `payment_events` table** (see below). On a strong match the
   apply core sets `orders.payment_status='paid'` + `orders.status='paid'`,
   inserts a `payments` row (`status='confirmed'`), and marks the event
   `applied` with `matched_order_id`.

8. **Inventory: NOT decremented in Phase 2.** The admin orders/fulfillment
   feature (per `orders.md`) owns inventory decrement and is not built yet;
   wiring `apply_inventory_movement` into the payment path now would create
   double-decrement risk when that feature lands, and Phase 1 already accepted
   possible oversell on unpaid orders. The apply core leaves a documented seam
   (a comment marking exactly where a future decrement call goes).

9. **Live page update:**
   - **v1 (this spec): polling.** The `/order/[order_number]` paid/pending branch
     moves into a client component that polls a lightweight status endpoint every
     ~4s and flips to "Payment received" in place when `payment_status='paid'`,
     stopping after it flips or after a ~10-min cap.
   - **Upgrade (documented, optional final task): Supabase Realtime broadcast** on
     a per-order channel `order:<order_number>`. Anon can't subscribe to table
     changes via RLS, so use **broadcast**, published server-side by the apply
     path. Polling stays as the fallback.

10. **Admin:** a staff **review-queue** page (`/admin/payments-review`) listing
    `unmatched` + `ambiguous` `payment_events` with a one-tap "apply to order X"
    (and a "dismiss/ignore" action). Visible to all staff (`ownerOnly: false`).

## Constraints (project-wide — apply to every task)

- **Next.js 16.2.9 custom fork.** Cache Components OFF — never `'use cache'`.
  Read `node_modules/next/dist/docs/` before using any Next API (route handlers,
  `revalidate`, etc.). Mutations via `<form action>` need `refresh()` from
  `next/cache` (no auto router refresh in this fork).
- **`'use server'` files export async functions ONLY.** Put zod schemas + types
  in a sibling **plain** module (build passes but dev runtime throws otherwise).
- **zod 4** (`z.email()`, `z.guid()`, `z.enum([...])`).
- **Server-authoritative.** Amounts/matching computed server-side; the webhook
  never trusts a client-asserted "this order is paid".
- **Supabase RLS.** Orders/payments tables are staff-only; anon/public reach them
  only through SECURITY DEFINER RPCs. New RPCs include explicit GRANTs.
- **Prod migrations are a manual `npx supabase db push`** (ref
  `vzgkjosappjszdxsssmh`) — the agent cannot run it; the user does. Local dev/test
  target local Supabase only.

## Data model — migration `0010_payment_events.sql`

### `payment_event_status` enum
`'unmatched' | 'ambiguous' | 'applied' | 'ignored'`

### `payment_events` table
```
id                 uuid pk default gen_random_uuid()
channel            text not null default 'push'        -- adapter: push|email|plaid
method             public.payment_method not null
amount             numeric(10,2) not null
sender             text                                 -- best-effort from push text
note               text                                 -- memo (may carry KL code)
raw_text           text not null                        -- original notification text
external_id        text                                 -- adapter id if any
dedup_key          text not null unique                 -- idempotency hash
received_at        timestamptz not null                 -- event time from device
status             public.payment_event_status not null default 'unmatched'
matched_order_id   uuid references public.orders(id)
candidate_orders   text[]                               -- order_numbers when ambiguous
created_at         timestamptz not null default now()
```
- **RLS:** staff `all` (`is_staff()`); **no anon/public access**. GRANTs: `all`
  to `service_role`, `select,insert,update,delete` to `authenticated`.
- Index on `(status, created_at)` for the review queue.

### `mark_order_paid(p_order_id uuid, p_event_id uuid)` — SECURITY DEFINER, the shared core
Idempotent. If the order is already `paid`, no-op (returns its number). Otherwise,
in one transaction: `UPDATE orders SET payment_status='paid', status='paid',
updated_at=now()`; `INSERT INTO payments (order_id, method, amount, status,
reference) VALUES (..., 'confirmed', order_number)`; if `p_event_id` is not null,
`UPDATE payment_events SET status='applied', matched_order_id=p_order_id`. Returns
the `order_number`. **Seam comment:** `-- FUTURE: decrement inventory here
(apply_inventory_movement) once admin fulfillment owns it`. Grant `execute` to
`service_role` only.

### `ingest_payment_event(p_payload jsonb)` — SECURITY DEFINER, dedup + record + match + apply
Atomic. `p_payload` = the normalized event
(`channel, method, amount, sender, note, raw_text, external_id, received_at,
dedup_key`). Steps:
1. `INSERT INTO payment_events (...) ON CONFLICT (dedup_key) DO NOTHING
   RETURNING id`. If no row (duplicate) → return
   `{status:'duplicate', order_number:null, event_id:<existing id>}`.
2. **Code path:** extract `KL-\d{8}-[A-Z2-9]{4}` (case-insensitive, uppercased)
   from `note`. If found, look up that unpaid order; if its `payment_method` and
   `total` equal the event's → strong, go to apply.
3. **Amount+method+window path:** `SELECT order_number FROM orders WHERE
   payment_status='unpaid' AND payment_method=method AND total=amount AND
   created_at >= now() - interval '30 days'`.
   - exactly 1 → strong → apply.
   - >= 2 → set event `status='ambiguous'`, `candidate_orders` = the numbers;
     return `{status:'ambiguous', ...}` (no apply).
   - 0 → leave `status='unmatched'`; return `{status:'unmatched', ...}`.
4. **Apply:** call `mark_order_paid(matched_order_id, event_id)`; return
   `{status:'applied', order_number, event_id}`.
Returns `jsonb`. Grant `execute` to `service_role` only.

### `apply_payment_event(p_event_id uuid, p_order_number text)` — SECURITY DEFINER, staff one-tap
For the review queue. Resolves the order by number, calls
`mark_order_paid(order_id, p_event_id)`. Returns the `order_number`. Grant
`execute` to `service_role` only (admin server action calls it via the
service-role client after `requireStaff()`).

## Ingestion layer — `src/lib/payments/ingest/`

- `normalize.ts` — `NormalizedPaymentEvent` type +
  `buildDedupKey(e): string` (stable hash of
  `channel|method|amount|sender|note|raw_text|received_at`) + the shared
  `extractOrderCode(text): string | null` regex helper.
- `adapters/push.ts` — `parsePushNotification(payload): NormalizedPaymentEvent`.
  Input is the Android forwarder payload
  `{ app: string, title: string, text: string, postedAt: string }`. Maps package
  → method (`com.venmo`→venmo, Cash App pkg→cashapp, Zelle/bank pkgs→zelle),
  parses **amount** (`$1,234.56`) and best-effort **sender** ("from X") and
  **note** from `title`+`text`; `raw_text = title + "\n" + text`. Amount parse
  failure → throw (the route returns 422; nothing to match without an amount).
- `push-schema.ts` — **plain** module with the zod schema for the push payload
  (not a `'use server'` file, but keep schema separate for reuse + consistency).
- `adapters/README.md` — how to add email/Plaid adapters against the same
  `NormalizedPaymentEvent` + `ingest_payment_event` contract (future).

## Webhook — `src/app/api/payments/ingest/push/route.ts`

- `POST` route handler (read the fork's route-handler docs first).
- Auth: `Authorization: Bearer <PAYMENT_WEBHOOK_SECRET>`; constant-time compare;
  **401** on missing/bad. Missing env secret → **500** (misconfig, fail closed).
- Parse JSON → validate with push schema → `parsePushNotification` →
  `buildDedupKey` → `createAdminClient().rpc('ingest_payment_event', { p_payload })`.
- Returns `200 { status, orderNumber }` for `applied|ambiguous|unmatched|duplicate`;
  **422** on unparseable payload (bad amount); **400** on schema failure.
- No caching; this is a mutation endpoint.

## Live update — order pay page

- New client component `src/app/order/[order_number]/payment-status.tsx`
  (`'use client'`): props `{ orderNumber, initialPaymentStatus }`. If not paid,
  polls `GET /api/order/[order_number]/status` every 4s; on `paymentStatus==='paid'`
  swaps to the received state and stops; hard stop after 150 polls (~10 min).
- New route handler `src/app/api/order/[order_number]/status/route.ts` — `GET`
  returns `{ paymentStatus, status }` via `getOrderForPayment` (anon, existing
  SECURITY DEFINER RPC). No PII. `no-store`.
- `src/app/order/[order_number]/page.tsx` keeps the server render (initial state,
  order code, payment instructions) and delegates the paid/pending pill + the
  "payment received" swap to `<PaymentStatusWatcher>`. The instructions block
  stays server-rendered; only the status-dependent bits become live.
- **Optional final task — Realtime broadcast:** the apply path publishes a
  `payment_confirmed` broadcast on channel `order:<order_number>`; the watcher
  subscribes via the anon realtime client and treats a broadcast as an instant
  flip, keeping polling as the fallback.

## Admin — `/admin/payments-review`

- Add `{ slug: 'payments-review', label: 'Payments Review', table: 'payments',
  ownerOnly: false }` to `ADMIN_SECTIONS`.
- `page.tsx` — `requireStaff()`; lists `payment_events` where
  `status IN ('unmatched','ambiguous')`, newest first (read via cookie server
  client — staff RLS allows it). Each row shows method, amount, sender, note,
  raw_text, received_at, and (for ambiguous) the `candidate_orders`.
- `actions.ts` (`'use server'`, async fns only) —
  `applyEvent(eventId, orderNumber)`: `requireStaff()` →
  `createAdminClient().rpc('apply_payment_event', ...)` → `refresh()`.
  `dismissEvent(eventId)`: `requireStaff()` → set `status='ignored'` → `refresh()`.
- `review-table.tsx` (client) — the list + one-tap buttons; a small input to type
  the target order number when applying (defaults to a candidate for ambiguous).
- `actions-schema.ts` — plain module with zod schemas for the two actions.
- Brief: `docs/admin-features/payments-review.md`.

## Testing (Vitest, local Supabase, service-role)

**SQL (`tests/db/`):**
- `mark_order_paid`: flips `orders` to paid+paid, inserts one `payments` row
  (`confirmed`), sets the event `applied`; **idempotent** (called twice → still
  one payment row, stays paid); already-paid order → no-op.
- `ingest_payment_event`:
  - exact-amount + method, single unpaid order → `applied`; order is paid.
  - code in note resolving to the matching unpaid order → `applied`.
  - code present but amount mismatched → NOT auto-applied (falls through; ends
    `unmatched`/`ambiguous`, order stays unpaid).
  - two unpaid orders same method+amount in window → `ambiguous`, no apply,
    `candidate_orders` has both.
  - no match → `unmatched`.
  - wrong method / wrong amount / order older than window → not matched.
  - duplicate `dedup_key` → second call `duplicate`, no second payment.
- `apply_payment_event`: staff applies an `ambiguous` event to a chosen order →
  paid + event `applied`.
- `payment_events` RLS: anon cannot select/insert; staff can.

**Unit (`tests/lib/`):**
- `parsePushNotification`: sample Venmo/Cash App/Zelle notification texts →
  correct `method`, `amount`, `sender`, `note`; Venmo memo with a KL code →
  `extractOrderCode` finds it; malformed amount → throws.
- `buildDedupKey`: stable for identical input, differs when any field differs.
- `extractOrderCode`: finds upper/lower-case codes, ignores non-codes.

**Route (`tests/lib/` or `tests/api/`):**
- push webhook: missing/bad Bearer → 401; missing env secret → 500; valid →
  delegates to RPC and returns its status; unparseable amount → 422.

## File-by-file change list

**New**
- `supabase/migrations/0010_payment_events.sql`
- `src/lib/payments/ingest/normalize.ts`
- `src/lib/payments/ingest/push-schema.ts`
- `src/lib/payments/ingest/adapters/push.ts`
- `src/lib/payments/ingest/adapters/README.md`
- `src/app/api/payments/ingest/push/route.ts`
- `src/app/api/order/[order_number]/status/route.ts`
- `src/app/order/[order_number]/payment-status.tsx`
- `src/app/admin/payments-review/page.tsx` + `actions.ts` + `actions-schema.ts`
  + `review-table.tsx`
- `docs/admin-features/payments-review.md`
- `tests/db/mark-order-paid.test.ts`, `tests/db/ingest-payment-event.test.ts`,
  `tests/db/payment-events-rls.test.ts`
- `tests/lib/push-adapter.test.ts`, `tests/lib/webhook-push.test.ts`

**Modified**
- `src/app/order/[order_number]/page.tsx` (delegate paid/pending to the watcher)
- `src/lib/admin/sections.ts` (add `payments-review`)
- `src/lib/supabase/database.types.ts` (regen via `npm run db:types`)
- `.env.example` (add `PAYMENT_WEBHOOK_SECRET`)

## Out of scope

- The custom Android NotificationListenerService app / Tasker config (operational,
  device-side — documented contract only; the webhook is the boundary).
- Email + Plaid adapters (future; engine is built channel-agnostic for them).
- Inventory decrement on paid (admin fulfillment feature owns it — seam left).
- Refunds / partial payments / overpayments (event recorded; staff handles).
- Customer-facing email (Resend) — separate fast-follow.
```

