"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-context";
import { orderTotals, shippingCost, type ShippingMethod } from "@/lib/cart/cart";
import { placeOrder } from "@/lib/orders/place-order";
import { identify, track } from "@/lib/analytics/track";
import type { PlaceOrderState } from "@/lib/orders/place-order-schema";
import { StepShipping } from "./steps/step-shipping";
import { StepDelivery } from "./steps/step-delivery";
import { StepPayment } from "./steps/step-payment";
import { StepReview } from "./steps/step-review";
import { OrderSummary } from "./order-summary";
import { OrderSummarySheet } from "./order-summary-sheet";
import { DEFAULT_DELIVERY } from "./delivery-options";
import { EMPTY_SHIPPING, type AccountLite, type ShippingValues, type StepKey, type StepStatus } from "./checkout-types";

const FLOW: StepKey[] = ["shipping", "delivery", "payment"];
const initial: PlaceOrderState = { ok: false, error: "" };

export function CheckoutView({ accounts }: { accounts: AccountLite[] }) {
  const { items, clear } = useCart();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [current, setCurrent] = useState<StepKey>("shipping");
  const [done, setDone] = useState({ shipping: false, delivery: false, payment: false });
  const [shipping, setShipping] = useState<ShippingValues>(EMPTY_SHIPPING);
  const [delivery, setDelivery] = useState<string>(DEFAULT_DELIVERY);
  const [payment, setPayment] = useState<string>(accounts[0]?.method ?? "");

  const [state, action, pending] = useActionState(placeOrder, initial);

  // One-shot post-mount flag so we don't flash the "empty cart" state before the
  // cart hydrates from localStorage (same hydration concern as cart-context).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const statusOf = (key: StepKey): StepStatus => {
    if (current === key) return "active";
    if (key !== "review" && done[key as keyof typeof done]) return "done";
    return "locked";
  };

  const advanceFrom = (key: keyof typeof done) => {
    const nextDone = { ...done, [key]: true };
    setDone(nextDone);
    const next = FLOW.find((s) => !nextDone[s as keyof typeof done]) ?? ("review" as StepKey);
    setCurrent(next);
  };

  const t = orderTotals(items);
  const total = Math.round((t.merch + shippingCost(delivery as ShippingMethod, t.merch)) * 100) / 100;

  // On a successful place_order: record the conversion, then clear the cart
  // and move to the pay page. `placedRef` makes this fire exactly once per
  // order even though the deps (items → [] after clear()) change underneath it.
  const placedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!state.ok || placedRef.current === state.orderNumber) return;
    placedRef.current = state.orderNumber;
    identify(shipping.email.toLowerCase(), { email: shipping.email, name: shipping.name });
    track("order_placed", {
      order_number: state.orderNumber,
      total,
      items_count: items.reduce((n, i) => n + i.quantity, 0),
      products: items.map((i) => `${i.productName} ${i.mg}`),
      payment_method: payment,
      shipping_method: delivery,
    });
    clear();
    router.push(`/order/${state.orderNumber}`);
  }, [state, clear, router, items, shipping, payment, delivery, total]);
  const rpcItems = items.map((x) => ({ size_id: x.sizeId, quantity: x.quantity }));

  if (mounted && items.length === 0) {
    return (
      <div className="co-empty">
        <p>Your cart is empty.</p>
        <Link href="/catalog" className="btn btn-emerald" style={{ padding: "12px 22px" }}>
          Browse the catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="co-grid">
      <div className="co-steps">
        <StepShipping
          index={1}
          status={statusOf("shipping")}
          values={shipping}
          onEdit={() => setCurrent("shipping")}
          onContinue={(v) => {
            setShipping(v);
            advanceFrom("shipping");
          }}
        />
        <StepDelivery
          index={2}
          status={statusOf("delivery")}
          selected={delivery}
          onSelect={setDelivery}
          onEdit={() => setCurrent("delivery")}
          onContinue={() => advanceFrom("delivery")}
          merch={t.merch}
        />
        <StepPayment
          index={3}
          status={statusOf("payment")}
          accounts={accounts}
          selected={payment}
          onSelect={setPayment}
          onEdit={() => setCurrent("payment")}
          onContinue={() => advanceFrom("payment")}
        />
        <StepReview
          index={4}
          status={statusOf("review")}
          shipping={shipping}
          payment={payment}
          delivery={delivery}
          accounts={accounts}
          rpcItems={rpcItems}
          action={action}
          pending={pending}
          state={state}
          total={total}
          merch={t.merch}
        />
      </div>

      <aside className="co-summary">
        <div className="co-summary-inner">
          <OrderSummary variant="panel" delivery={delivery} />
        </div>
        <div className="co-secure-foot">
          <Link href="/cart" className="co-back">← Back to cart</Link>
        </div>
      </aside>

      {/* On review the full summary is shown inline (mobile); the bottom bar
          slides away rather than unmounting, so keep it mounted and let it
          animate out via `atReview`. */}
      <OrderSummarySheet delivery={delivery} atReview={current === "review"} />
    </div>
  );
}
