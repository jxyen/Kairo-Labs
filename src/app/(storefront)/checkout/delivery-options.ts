// Static delivery options (UI-only — the backend computes shipping on its own and
// does not yet persist a chosen method). Used by the Delivery Method step and the
// order summary so the displayed shipping line matches the selection.
export interface DeliveryOption {
  id: string;
  label: string;
  price: number;
  eta: string;
}

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  { id: "standard", label: "Standard Shipping", price: 0, eta: "5–7 business days" },
  { id: "two_day", label: "Two-Day Shipping", price: 14.99, eta: "~2 business days" },
];

export const DEFAULT_DELIVERY = DELIVERY_OPTIONS[0].id;

export const deliveryById = (id: string): DeliveryOption =>
  DELIVERY_OPTIONS.find((o) => o.id === id) ?? DELIVERY_OPTIONS[0];
