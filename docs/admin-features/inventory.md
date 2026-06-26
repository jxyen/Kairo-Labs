# Inventory — terminal brief

**Route:** `src/app/admin/inventory/page.tsx` (replace the stub)
**Tables you own:** `inventory`, `inventory_movements`
**Access:** `requireStaff`

## Goal

Build the inventory management UI so staff can see current stock levels per SKU
and make adjustments. Every stock change (restock, adjustment, sale) is recorded
as an `inventory_movements` row so the audit trail is preserved. SKUs that fall
at or below `reorder_threshold` should be visually highlighted to prompt action.

## Definition of done

- [ ] View current stock level for every SKU in `inventory`
- [ ] Highlight SKUs at or below `reorder_threshold` (low-stock indicator)
- [ ] Restock: write an `inventory_movements` row (reason `restock`) and update `quantity_on_hand`
- [ ] Manual adjustment: write a movement (reason `adjustment`) with a note
- [ ] View movement history per SKU (reason, quantity, timestamp)
- [ ] RLS respected (no service-role client in request paths)
- [ ] Tests under `tests/` cover the data-access functions
- [ ] Types regenerated if schema changed
