"use client";

import { StepShell } from "../step-shell";
import { LockIcon } from "../checkout-icons";
import { OrderSummary } from "../order-summary";
import { deliveryById } from "../delivery-options";
import { formatUSD } from "@/lib/products";
import type { PlaceOrderState } from "@/lib/orders/place-order-schema";
import type { AccountLite, ShippingValues, StepStatus } from "../checkout-types";

const METHOD_LABELS: Record<string, string> = {
  venmo: "Venmo",
  cashapp: "Cash App",
  zelle: "Zelle",
};

interface RpcItem {
  size_id: string;
  quantity: number;
}

export function StepReview({
  index,
  status,
  shipping,
  payment,
  delivery,
  accounts,
  rpcItems,
  action,
  pending,
  state,
  total,
}: {
  index: number;
  status: StepStatus;
  shipping: ShippingValues;
  payment: string;
  delivery: string;
  accounts: AccountLite[];
  rpcItems: RpcItem[];
  action: (payload: FormData) => void;
  pending: boolean;
  state: PlaceOrderState;
  total: number;
}) {
  if (status === "locked") {
    return <StepShell index={index} title="Review & Place Order" status={status} />;
  }

  const acc = accounts.find((a) => a.method === payment);
  const methodLabel = METHOD_LABELS[payment] || acc?.displayName || payment;
  const opt = deliveryById(delivery);
  const empty = rpcItems.length === 0;

  return (
    <StepShell index={index} title="Review & Place Order" status={status}>
      <form className="co-step-body" action={action}>
        <input type="hidden" name="name" value={shipping.name} />
        <input type="hidden" name="email" value={shipping.email} />
        <input type="hidden" name="phone" value={shipping.phone} />
        <input type="hidden" name="line1" value={shipping.line1} />
        <input type="hidden" name="line2" value={shipping.line2} />
        <input type="hidden" name="city" value={shipping.city} />
        <input type="hidden" name="state" value={shipping.state} />
        <input type="hidden" name="postal_code" value={shipping.postal_code} />
        <input type="hidden" name="country" value="US" />
        <input type="hidden" name="method" value={payment} />
        <input type="hidden" name="items" value={JSON.stringify(rpcItems)} />

        {/* Mobile only: the order summary lives in a bottom sheet on other steps,
            but at the point of placing the order we surface it inline. Desktop
            already shows it in the sticky sidebar. */}
        <div className="co-review-summary">
          <OrderSummary variant="panel" delivery={delivery} />
        </div>

        <dl className="co-review-list">
          <div>
            <dt>Ship to</dt>
            <dd>
              {shipping.name} · {shipping.line1}, {shipping.city} {shipping.state}{" "}
              {shipping.postal_code}
            </dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>
              {opt.label} — {opt.price === 0 ? "Free" : formatUSD(opt.price)}
            </dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>{methodLabel}</dd>
          </div>
        </dl>

        {!state.ok && state.error && <div className="co-formerr">{state.error}</div>}

        <button className="btn btn-emerald co-submit" type="submit" disabled={pending || empty}>
          {pending ? "Placing order…" : `Place order · ${formatUSD(total)}`}
        </button>
        <p className="co-secure-line co-secure-center">
          <LockIcon size={13} /> Secure checkout · your details are encrypted
        </p>
        <p className="co-rou">For research use only · not for human or animal consumption</p>
      </form>
    </StepShell>
  );
}
