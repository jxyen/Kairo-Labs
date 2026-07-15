// Static delivery-option metadata (id/label/eta). Price is NOT stored here — it
// depends on the cart subtotal and is computed by shippingCost(id, merch) in
// @/lib/cart/cart. See docs/superpowers/specs/2026-07-14-checkout-shipping-tiers-design.md
export interface DeliveryOption {
  id: string;
  label: string;
  eta: string;
}

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  { id: "standard", label: "Standard Shipping", eta: "5–7 business days" },
  { id: "priority", label: "Priority Shipping", eta: "1–3 business days" },
];

export const DEFAULT_DELIVERY = DELIVERY_OPTIONS[0].id;

export const deliveryById = (id: string): DeliveryOption =>
  DELIVERY_OPTIONS.find((o) => o.id === id) ?? DELIVERY_OPTIONS[0];
