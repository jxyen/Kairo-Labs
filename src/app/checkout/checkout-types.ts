// Shared client types for the checkout step components.

export interface ShippingValues {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  billingSame: boolean;
}

export const EMPTY_SHIPPING: ShippingValues = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  billingSame: true,
};

// Serializable subset of PaymentAccount passed from the server page to the client.
export interface AccountLite {
  method: string;
  displayName: string;
  handle: string;
  instructions: string | null;
  qrUrl: string | null;
}

export type StepKey = "shipping" | "delivery" | "payment" | "review";
export type StepStatus = "active" | "done" | "locked";
