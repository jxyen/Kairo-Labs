# Admin Inventory — design spec

**Date:** 2026-06-26
**Feature:** Inventory management for the `/admin` panel
**Route:** `src/app/admin/inventory/page.tsx` (replaces the foundation stub)
**Owned tables:** `inventory`, `inventory_movements`
**Access:** `requireStaff()` on every page and Server Action
**Reserved migration number:** `0007_*.sql`

## Goal

Let staff see current stock per SKU, spot SKUs at or below their reorder
threshold, and make stock changes (restock / manual adjustment). Every change is
recorded as an `inventory_movements` row so the audit trail is preserved.

## Constraints (from the terminal brief & rules of the road)

- Do **not** edit migrations 0001–0005. New schema goes in `0007_*.sql` and must
  `grant` to `service_role` and `authenticated` (auto-expose is disabled).
- Server Actions live in `src/app/admin/inventory/actions.ts` (own folder — never
  append to the shared `src/app/admin/actions.ts`).
- Use the DAL: `requireStaff()` at the top of the page and every action.
- Request-path DB access uses `@/lib/supabase/server` (RLS). `@/lib/supabase/admin`
  is never used in a request path.
- Do not touch the storefront, `admin-nav.tsx`, `layout.tsx`, or `sections.ts`.

## Existing-state facts (verified in the codebase)

- `scripts/seed-products.ts` already upserts an `inventory` row (defaults
  `quantity_on_hand = 0`, `reorder_threshold = 0`) for **every** seeded
  `product_size`. So every real SKU already has a stock row to read/mutate; we do
  not create inventory rows in this feature.
- `inventory_movements` has **no `note` column** today
  (`id, size_id, delta, reason, order_id, created_by, created_at`). The brief
  requires an adjustment note → this is a genuine schema change (migration 0007).
- `order_id` stays untouched (sale movements are the later Orders feature; the FK
  is documented in `inventory.md` for whoever builds that).
- `is_staff()` is a `security definer` helper; RLS policies on both owned tables
  are `for all using (is_staff()) with check (is_staff())`.

## Architecture

Three layers, each independently testable:

### 1. Data layer — `src/lib/admin/inventory.ts`

Pure functions that **accept a Supabase client as their first argument**. The page
and actions pass the RLS server client; tests pass a raw service-role client. Same
code path, both callers — this is what makes the data-access functions testable in
the existing `tests/db/*` style.

Typed against `Database` from `@/lib/supabase/database.types`. Client param type:
`SupabaseClient<Database>`.

```ts
type InventoryRow = {
  sizeId: string
  sku: string
  mg: string
  price: number
  productName: string
  productCode: string
  quantityOnHand: number
  reorderThreshold: number
  updatedAt: string
  lowStock: boolean        // quantityOnHand <= reorderThreshold
}

type Movement = {
  id: string
  delta: number
  reason: 'restock' | 'sale' | 'adjustment'
  note: string | null
  createdAt: string
}

// nested select: inventory -> product_sizes -> products
listInventory(client): Promise<InventoryRow[]>
// sorted low-stock first, then by sku ascending

listMovements(client, sizeId, limit = 20): Promise<Movement[]>
// newest first (created_at desc)

applyMovement(client, {
  sizeId, delta, reason, note, createdBy
}): Promise<void>
// calls the apply_inventory_movement RPC

restock(client, { sizeId, qty, createdBy }): Promise<void>
// thin wrapper: delta = +qty, reason 'restock', note null. Asserts qty > 0.

adjust(client, { sizeId, delta, note, createdBy }): Promise<void>
// thin wrapper: reason 'adjustment'. Asserts delta !== 0 and note is non-empty.
```

### 2. Migration — `supabase/migrations/0007_inventory_movement_note_and_rpc.sql`

```sql
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
    raise exception 'movement would drive stock negative (% )', new_qty;
  end if;
end;
$$;

grant execute on function public.apply_inventory_movement(
  uuid, integer, public.inventory_reason, text, uuid
) to authenticated, service_role;
```

After applying: `npm run db:types` to regenerate `database.types.ts`. This file is
a known merge point across the three terminals — regenerate again after merging
main rather than fighting conflicts.

Atomicity: both writes are inside one `plpgsql` function = one implicit
transaction. If the negative-guard raises, the insert is rolled back too, so the
ledger never drifts from `quantity_on_hand`.

### 3. UI

**`page.tsx`** (server component):
- `await requireStaff()`
- `const rows = await listInventory(await createClient())`
- Render header (`{rows.length} SKUs · {lowCount} low`) + `<InventoryTable rows={rows} />`.

**`inventory-table.tsx`** (`'use client'`):
- Renders the stock table. Columns: SKU, product, on-hand, reorder@, status.
- **Low-stock** rows: amber status dot + `LOW` badge + subtle amber row tint.
- Clicking a row toggles an expanded panel beneath it containing:
  - **Restock form** — one positive integer qty input → `restockAction`.
  - **Adjust form** — signed integer qty (±) + required note textarea → `adjustAction`.
  - **History** — loaded on first expand via `fetchMovementsAction(sizeId)`
    (scales better than pre-fetching every SKU's ledger). Shows delta, reason,
    note, timestamp; newest first.
- Forms use `useActionState` for the pending state and inline error display.

### 4. Server actions — `src/app/admin/inventory/actions.ts`

`'use server'`. Each action:
1. `await requireStaff()` → gives `staff.id` for `createdBy`.
2. Parse + validate `FormData` (reject non-integers, qty ≤ 0 for restock, delta = 0
   or empty note for adjust). Return `{ error }` on bad input.
3. Call the data layer with the **RLS server client** (`@/lib/supabase/server`).
4. Catch DB errors (e.g. the negative-stock guard) → friendly `{ error }`.
5. `revalidatePath('/admin/inventory')` so the table reflects new stock.

Signatures:
- `restockAction(prev, formData)` → `{ error?: string }`
- `adjustAction(prev, formData)` → `{ error?: string }`
- `fetchMovementsAction(sizeId)` → `Movement[]` (read-only; still `requireStaff()`)

## Testing — `tests/db/inventory.test.ts` (extend existing)

Service-role client, existing pattern (each test creates its own product/size/
inventory row and cleans up by deleting the product, which cascades). Cover the
**data-access functions** imported from `src/lib/admin/inventory.ts`:

1. `restock` increments `quantity_on_hand` and writes a `restock` movement.
2. `adjust` with a note applies the signed delta and writes an `adjustment`
   movement carrying the note.
3. Negative-guard: an `adjust` that would drive stock below zero rejects and
   leaves both the ledger and `quantity_on_hand` unchanged.
4. `listInventory` returns joined fields (sku, productName) and a correct
   `lowStock` flag at/below threshold.
5. `listMovements` returns this SKU's movements newest-first.

The existing schema smoke test in this file is kept.

## Out of scope

- Sale movements / `order_id` FK (Orders feature, later).
- Editing `reorder_threshold` from the UI (not in the brief — stock changes only).
  Note: seeded thresholds default to 0; can be added later if needed.
- Bulk restock, CSV import, low-stock email alerts.

## Decisions made during brainstorming

- **Layout:** table with expandable row (desktop-only admin; no modals).
- **Negative stock:** rejected at the DB level via the RPC guard.
- **History:** loaded on row-expand, not pre-fetched.
- **Atomicity:** Postgres RPC (one transaction), not two client round-trips.
