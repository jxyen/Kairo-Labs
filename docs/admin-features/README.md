# Admin feature terminals

Each feature below is built by one terminal against the shared foundation
(Supabase schema + `/admin` shell + DAL). Read your brief, then replace the
matching `src/app/admin/<slug>/page.tsx` stub.

## Who logs in (two populations)

There are two completely separate user types:

- **Admins** — the small core team (currently 3), who control everything. They
  live in the `staff` table; all of them have the `owner` role and see all data
  including revenue. The `staff` role (non-owner) exists for a possible future
  limited-access hire (e.g. fulfillment) and is otherwise unused today. Admins
  are invited manually, not via open sign-up.
- **Affiliates** — external marketers who only have a referral code and bring in
  buyers. They live in the `affiliates` table, **never** in `staff`, and never
  reach `/admin`. Their own minimal portal (code, referrals, earnings) is a
  separate later surface — see `affiliates.md` for the auth-separation warning.

Because all admins are `owner`, there is no revenue gating between admins today.

## Rules of the road

- **Do not edit migrations 0001–0005.** Add new migrations (`0006_…`) if your
  feature needs new columns/tables; coordinate enum changes.
- **New migrations must include GRANTs.** Supabase does not auto-expose tables,
  so any migration you add (`0006+`) must explicitly grant `SELECT`/`INSERT`/
  `UPDATE`/`DELETE` to both `service_role` and `authenticated`. Follow the
  pattern in `supabase/migrations/0001_staff.sql`.
- **Use the DAL**: `requireStaff()` / `requireOwner()` at the top of every page
  and Server Action. Never trust the client.
- **Use the typed clients**: `@/lib/supabase/server` (user/RLS) for reads/writes
  in pages and actions; `@/lib/supabase/admin` only for trusted server scripts,
  never in a request path.
- **Regenerate types** after any schema change: `npm run db:types`.
- **Write tests** under `tests/` following the existing Vitest patterns. Use a
  service-role client in tests to assert DB behavior; see `tests/setup.ts` for
  the env bootstrap and `ws` WebSocket polyfill (Node 20).
- **Do not touch the public storefront** (`src/app/page.tsx`, `src/components/*`,
  `src/lib/products.ts`, `src/app/catalog/`).

## Feature index

| Feature | Slug | Owner-only | Primary tables |
|---|---|---|---|
| Dashboard | `dashboard` (`/admin`) | yes | `orders`, `payments` |
| Orders | `orders` | no | `orders`, `order_items`, `payments` |
| Products | `products` | no | `products`, `product_sizes` |
| Inventory | `inventory` | no | `inventory`, `inventory_movements` |
| Affiliates | `affiliates` | no | `affiliates`, `orders.affiliate_id` |
| Shipping | `shipping` | no | `shipments`, `orders` |
| Staff | `staff` | yes | `staff` (Supabase Auth admin API) |

Each feature's brief is in this directory: `orders.md`, `products.md`,
`inventory.md`, `affiliates.md`, `shipping.md`, `dashboard.md`, `staff.md`.
