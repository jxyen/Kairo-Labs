# Checkout UI Redesign — Design Spec

**Date:** 2026-06-30
**Branch:** `feat/cart-checkout-ui`
**Status:** Approved (brainstorm) → implementation

## Summary

Replace the current flat single-form checkout (`src/app/checkout/checkout-form.tsx`)
with a multi-step accordion checkout plus an order-summary panel, matching the
provided mockups, rendered in the Amino/Kairo design language (the `cd-*` cart
system this branch already established).

**This is a UI-only change. No backend changes.** The real order is still placed
through the existing `placeOrder` server action and `placeOrderSchema`. Anything in
the mockup the backend does not support is rendered as static/visual UI.

## Layout

- **Desktop:** two columns — left = numbered step accordion; right = sticky
  `OrderSummary` card with a "Secure checkout" button beneath it.
- **Mobile:** single column (steps), with a fixed bottom bar (item count + total +
  up-chevron) that expands a bottom **sheet** showing the full `OrderSummary` +
  a "Done" button. Reuses the cart-drawer scrim / `inert` / Escape / scroll-lock
  pattern (`cart-drawer.tsx`).
- The global `SiteHeader`/footer (root `layout.tsx`) is **kept**. A minimal
  checkout-only header (Back / centered logo / Secure-Checkout pill) seen in the
  mockup would require a root-layout route-group refactor of every route and is
  out of scope. Page keeps the `Checkout` / "Complete your order securely" title block.

## Steps (sequential, auto-advance)

One step open at a time. Completing a step runs lightweight client validation,
marks it done (black badge + green check), collapses it to a read-only summary with
an **Edit** link, and auto-opens the next. Steps not yet reached are locked (gray
badge). `Edit` re-opens a completed step.

1. **Shipping Address** — `name`, `email`, `phone (optional)`, `line1`,
   `line2 (optional)`, `city`, `state`, `postal_code`. `country` hidden = `US`.
   "Billing same as shipping" checkbox (visual only — backend has no separate
   billing). Collapsed view: Shipping Address / Contact / Billing columns.
2. **Delivery Method** — selectable **static** options (see Static below) +
   "Free Shipment Protection" callout. Collapsed view: chosen method + ETA line.
3. **Payment** — radio/card list of the active methods from
   `getActivePaymentAccounts()` (Venmo / Cash App / Zelle). Selecting one marks it
   chosen; the actual handle/QR/instructions stay on the post-order
   `/order/[order_number]` page. "Secure checkout · 256-bit SSL" line + trust badges.
4. **Review & Place Order** — final confirmation; this step performs the **real
   submit** via `useActionState(placeOrder, …)`, hidden `items` input from cart
   context, success → `clear()` cart → `router.push('/order/{orderNumber}')`
   (preserves current behavior). Place Order disabled when cart is empty or pending.

## Order Summary (shared: desktop sidebar + mobile sheet)

- Line items from cart context (image, name, mg/sub, price). Mobile sheet variant
  adds qty stepper + remove (uses `setQty`/`remove`), matching mockup image 4.
- `PromoCode` (existing stub component) — "Add promo code".
- Totals from `orderTotals(items)` for subtotal/discount; **shipping line reflects
  the selected static delivery option** (visual). Total = merch + selected delivery.
- Points / rewards blocks, taxes, shipment-protection "Free" line — **static**.

## Wired vs. static

- **Wired (real):** shipping fields, payment-method selection, cart items, order
  placement, subtotal/discount via `orderTotals`, promo stub.
- **Static (visual only, no backend):** delivery options + prices, points/rewards
  ("Earn 100 more…", "You'll earn 175 points"), taxes ($0.00), shipment-protection
  "Free", billing "Same as shipping", trust badges, ETA dates.

### Static delivery options (initial)

| id        | label             | price  | eta            |
|-----------|-------------------|--------|----------------|
| standard  | Standard Shipping | Free   | 5–7 business days |
| two_day   | Two-Day Shipping  | 14.99  | ~2 business days   |

Default selection: `standard`. (Easy to adjust labels/prices later.)

## Files

- `src/app/checkout/page.tsx` (server) — fetch payment accounts, render shell +
  `<CheckoutView accounts={…} />`.
- `src/app/checkout/checkout-view.tsx` (client) — owns step state + responsive layout.
- `src/app/checkout/steps/step-shipping.tsx`
- `src/app/checkout/steps/step-delivery.tsx`
- `src/app/checkout/steps/step-payment.tsx`
- `src/app/checkout/steps/step-review.tsx`
- `src/app/checkout/order-summary.tsx` — shared summary (`variant: "panel" | "sheet"`).
- `src/app/checkout/order-summary-sheet.tsx` — mobile bottom bar + sheet wrapper.
- `src/app/checkout/delivery-options.ts` — static option data.
- Remove old `checkout-form.tsx` (replaced).
- `src/app/globals.css` — add a `/* checkout */` section of `co-*` classes,
  following the existing `cd-*` conventions and Amino tokens (`--hair`, `--emerald`,
  `--surface-card`, `font-mono`, `btn-emerald`).

## State model (`checkout-view`)

```
current: 'shipping' | 'delivery' | 'payment' | 'review'
done:    { shipping: bool, delivery: bool, payment: bool }
shipping: { name, email, phone, line1, line2, city, state, postal_code }
delivery: deliveryOptionId
payment:  method (PaymentMethod)
```

## Edge cases

- Empty cart → summary shows empty state; Review's Place Order disabled.
- Client validation per step is lightweight (required fields); server
  `placeOrderSchema` remains the source of truth on submit.
- Step components are presentational + receive callbacks; `checkout-view` is the
  single orchestrator (keeps each file focused/testable).

## Out of scope

- Real card processing, real delivery rates, points/rewards engine, saved
  addresses / auth, separate billing address, minimal checkout-only header.
