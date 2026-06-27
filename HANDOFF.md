# Payment handoff — Kairo Labs checkout

This document is for whoever wires payment processing. **Everything up to the
money is built and server-validated.** Your job is one well-defined step.

## TL;DR

The storefront has a real cart → checkout → **it creates a real order in
Supabase as `pending` / `unpaid` and stops.** You add the payment step and flip
that order to `paid`.

```
[ already built ]                                          [ you build ]
cart (localStorage)                                        payment provider
   → /checkout form (validated, attestation)               + mark order paid
   → placeOrder(draft)  ──creates order──►  orders row     + decrement inventory
        (server-recomputed totals)          status:pending
                                            payment_status:unpaid
   → /checkout/confirmation?order=KL-XXXX   returns orderNumber
```

You are **not** boxed into a provider. The order exists with an authoritative
total; collect money however you like (Stripe, or the manual venmo/cashapp/zelle/
crypto methods already in the `payment_method` enum).

## The seam — `placeOrder()`

File: **`src/app/checkout/actions.ts`** (`"use server"`).

What it already does:
1. Re-validates the draft server-side (`validateDraft` from `src/lib/checkout.ts`).
2. **Recomputes every total from the catalog** (`computeCartTotals` in
   `src/lib/products.ts`) — client-sent prices are ignored, so a tampered cart
   can't set its own price.
3. Resolves each line's `size_id` from `product_sizes` (SKU = `CODE-20MG`).
4. Inserts `orders` (+ `order_items`) via the **service-role admin client**
   (`src/lib/supabase/admin.ts`) as `status:'pending'`, `payment_status:'unpaid'`,
   `payment_method:'other'`.
5. Returns `{ ok: true, orderNumber }`. The client clears the cart and routes to
   the confirmation page.

What it deliberately does **NOT** do (your job):
- No charge / no `payments` row.
- No inventory decrement.
- No `status` change past `pending`.

## What you need to add

Pick the path that matches how you collect money:

### Option A — automated (e.g. Stripe)
1. After `placeOrder` returns `orderNumber` (or inside it), create your payment
   intent / checkout session with **`order.total`** and put **`orderNumber` in
   the provider metadata**.
2. Redirect the customer to pay (replace/extend the confirmation step, or add a
   "Pay now" action on `/checkout/confirmation`).
3. **Webhook** on payment success:
   - look up the order by `order_number` (from metadata),
   - `update orders set status='paid', payment_status='paid'`,
   - `insert payments (order_id, method, amount, status:'confirmed', reference)`,
   - decrement `inventory` for each `order_item.size_id`.

### Option B — manual (venmo / cashapp / zelle / crypto)
The order already sits `pending`. Email the customer payment instructions
(the confirmation page already tells them to expect this). When the money lands,
staff mark it paid in the **admin dashboard** — same DB writes as the webhook
above (`status='paid'`, insert `payments`, decrement inventory).

## Data model already wired

| Cart / checkout                        | DB column (`orders`)            |
|----------------------------------------|---------------------------------|
| `totals.subtotal` (incl. accessories)  | `subtotal`                      |
| volume discount (peptide units, cart-wide) | `discount_total`            |
| shipping (free ≥ $99, else flat)       | `shipping_cost`                 |
| final                                  | `total`                         |
| contact name / email / phone           | `customer_name/email/phone`     |
| address + shipping method              | `shipping_address` (jsonb)      |
| attestation + method + note            | `notes`                         |

Each cart line → one `order_items` row (`size_id`, `product_name`, `mg`,
`unit_price`, `quantity`, `line_total`). Accessories have `size_id = null`.

Pricing knobs live in `src/lib/products.ts`: `FREE_SHIP_THRESHOLD`,
`FLAT_SHIPPING`, `VOLUME_TIERS`. The volume discount applies to **total peptide
units across the cart** and to the **peptide subtotal only** (accessories are
full price and don't count toward the tier).

## Requirements to run the write path

`.env.local` needs (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

And the catalog must be seeded so `product_sizes` exist:
`npm run db:reset` (applies `supabase/migrations`) then `npm run db:seed`.
Without these, `placeOrder` returns a friendly error and the confirmation page
degrades to "order not found" instead of crashing.

## Open items / hardening (not blockers)

- **Confirmation page** (`src/app/checkout/confirmation/page.tsx`) looks orders up
  by `order_number` (high-entropy, but enumerable). Before launch, gate it (signed
  token in the URL, or session/email match).
- **Express shipping** shows "Quoted at payment" — wire a real rate if offered.
- **Tax** is not computed (let the processor / Stripe Tax handle it, or add it).
- **Inventory** is not decremented until you do it on payment success (intended —
  avoids holding stock for abandoned `pending` orders).
- **Order confirmation email** is referenced in the UI but not sent — add it on
  payment success.
