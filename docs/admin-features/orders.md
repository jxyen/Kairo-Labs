# Orders — terminal brief

**Route:** `src/app/admin/orders/page.tsx` (replace the stub)
**Tables you own:** `orders`, `order_items`, `payments`
**Access:** `requireStaff`

## Goal

Build the order management UI so staff can create and edit orders end-to-end.
Line items are pulled from `product_sizes` (SKU, price). Each order tracks a
`payment_method` and `payment_status`; fulfilled payments are recorded in the
`payments` table. When an order's status transitions to `paid`, write an
`inventory_movements` row (reason `sale`) for each line item to decrement stock.

## Definition of done

- [ ] List all orders with status, total, and creation date
- [ ] Create an order: select customer info, add line items from `product_sizes`
- [ ] Edit an order: update quantities, status, `payment_method`, `payment_status`
- [ ] Record a payment entry in `payments` when marking an order paid
- [ ] On status → `paid`, write `inventory_movements` (reason `sale`) to decrement stock
- [ ] RLS respected (no service-role client in request paths)
- [ ] Tests under `tests/` cover the data-access functions
- [ ] Types regenerated if schema changed
