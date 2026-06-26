# Shipping — terminal brief

**Route:** `src/app/admin/shipping/page.tsx` (replace the stub)
**Tables you own:** `shipments`, `orders`
**Access:** `requireStaff`

## Goal

Build the shipping management UI so staff can create and track shipments for
fulfilled orders. Each order maps to at most one shipment. A shipment record
stores the carrier, tracking number, label URL, and shipping cost. Label API
integration (e.g., EasyPost, Shippo) is a later sub-task; this terminal delivers
the manual-entry workflow and the data model.

## Definition of done

- [ ] List all shipments with linked order ID, carrier, tracking number, and status
- [ ] Create a shipment for an order: enter carrier, tracking number, label URL, cost
- [ ] Edit a shipment: update tracking, status, or label URL
- [ ] Filter/view orders that do not yet have a shipment
- [ ] (Stub) Placeholder for label-API integration (comment in code, no implementation required now)
- [ ] RLS respected (no service-role client in request paths)
- [ ] Tests under `tests/` cover the data-access functions
- [ ] Types regenerated if schema changed
