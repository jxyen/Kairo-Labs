# Products — terminal brief

**Route:** `src/app/admin/products/page.tsx` (replace the stub)
**Tables you own:** `products`, `product_sizes`
**Access:** `requireStaff`

## Goal

Build the product management UI so staff can maintain the catalog. Products have
one or more sizes (stored in `product_sizes`) each with its own SKU, price, and
weight. Staff can upload product images to Supabase Storage. Deactivating a
product hides it from the catalog without deleting it.

## Definition of done

- [ ] List all products (active and inactive) with size count and status
- [ ] Create a product with at least one size (SKU, price, weight)
- [ ] Edit a product: update name, description, category, and sizes
- [ ] Deactivate / reactivate a product (`active` flag)
- [ ] Upload a product image to Supabase Storage and persist the URL
- [ ] RLS respected (no service-role client in request paths)
- [ ] Tests under `tests/` cover the data-access functions
- [ ] Types regenerated if schema changed
