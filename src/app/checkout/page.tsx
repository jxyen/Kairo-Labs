import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout-view";

export const metadata: Metadata = {
  title: "Checkout — Kairo Labs",
  description: "Complete your research-peptide order. For research use only.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
