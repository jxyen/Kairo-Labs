"use client";

import { StepShell } from "../step-shell";
import { ShieldIcon } from "../checkout-icons";
import { DELIVERY_OPTIONS, deliveryById } from "../delivery-options";
import { formatUSD } from "@/lib/products";
import type { StepStatus } from "../checkout-types";

export function StepDelivery({
  index,
  status,
  selected,
  onSelect,
  onEdit,
  onContinue,
}: {
  index: number;
  status: StepStatus;
  selected: string;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onContinue: () => void;
}) {
  if (status === "done") {
    const opt = deliveryById(selected);
    return (
      <StepShell index={index} title="Delivery Method" status={status} onEdit={onEdit}>
        <div className="co-recap">
          <div className="co-recap-col">
            <div className="co-recap-h">Delivery Method</div>
            <p className="co-recap-body">
              {opt.label} — {opt.price === 0 ? "Free" : formatUSD(opt.price)}
              <br />
              <span className="co-recap-muted">Arrives in {opt.eta}</span>
            </p>
          </div>
        </div>
      </StepShell>
    );
  }

  return (
    <StepShell index={index} title="Delivery Method" status={status}>
      <div className="co-step-body">
        <div className="co-methods">
          {DELIVERY_OPTIONS.map((o) => (
            <label key={o.id} className="co-method" data-active={selected === o.id}>
              <input
                type="radio"
                name="delivery"
                value={o.id}
                checked={selected === o.id}
                onChange={() => onSelect(o.id)}
              />
              <div className="co-method-main">
                <span className="nm">{o.label}</span>
                <span className="sb">Arrives in {o.eta}</span>
              </div>
              <span className="co-method-price">{o.price === 0 ? "Free" : formatUSD(o.price)}</span>
            </label>
          ))}
        </div>

        <div className="co-protect">
          <span className="co-protect-ic">
            <ShieldIcon size={18} />
          </span>
          <div>
            <div className="co-protect-t">Free Shipment Protection</div>
            <p className="co-protect-s">
              Every order is protected at no extra cost. If your package is damaged, lost, or
              stolen in transit, we&apos;ll replace it or issue a full refund.
            </p>
          </div>
        </div>

        <button className="btn btn-emerald co-continue" type="button" onClick={onContinue}>
          Continue to payment
        </button>
      </div>
    </StepShell>
  );
}
