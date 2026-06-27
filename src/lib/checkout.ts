/**
 * Checkout contract — shared types + validation used by BOTH the client
 * checkout form (inline errors) and the server `placeOrder` action
 * (authoritative). Pure module: no "use server" / "server-only", safe to
 * import from client components (types are erased; validateDraft is isomorphic).
 */
import type { CartLineInput } from "@/lib/products";

export interface CheckoutContact {
  name: string;
  email: string;
  phone?: string;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  /** ISO-ish country; defaults to "US". */
  country: string;
}

export type ShippingMethod = "standard" | "express";

/** Everything the client gathers and hands to placeOrder(). */
export interface CheckoutDraft {
  items: CartLineInput[];
  contact: CheckoutContact;
  shipping: ShippingAddress;
  method: ShippingMethod;
  /** Research-use / eligibility attestation — must be true to place an order. */
  attestation: boolean;
  notes?: string;
}

export interface PlaceOrderResult {
  ok: boolean;
  orderNumber?: string;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a draft. Returns a map of field -> error message (empty = valid).
 * Used client-side for inline errors and re-run server-side as the gate.
 */
export function validateDraft(draft: CheckoutDraft): Record<string, string> {
  const e: Record<string, string> = {};
  const c = draft.contact ?? ({} as CheckoutContact);
  const s = draft.shipping ?? ({} as ShippingAddress);

  if (!draft.items?.length) e.items = "Your cart is empty.";
  if (!c.name?.trim()) e.name = "Enter the recipient name.";
  if (!c.email?.trim()) e.email = "Enter an email address.";
  else if (!EMAIL_RE.test(c.email.trim())) e.email = "Enter a valid email address.";

  if (!s.line1?.trim()) e.line1 = "Enter a street address.";
  if (!s.city?.trim()) e.city = "Enter a city.";
  if (!s.state?.trim()) e.state = "Enter a state / region.";
  if (!s.postalCode?.trim()) e.postalCode = "Enter a postal code.";
  if (!s.country?.trim()) e.country = "Select a country.";

  if (!draft.attestation) e.attestation = "You must confirm the research-use terms.";

  return e;
}

export const EMPTY_DRAFT: CheckoutDraft = {
  items: [],
  contact: { name: "", email: "", phone: "" },
  shipping: { line1: "", line2: "", city: "", state: "", postalCode: "", country: "US" },
  method: "standard",
  attestation: false,
  notes: "",
};
