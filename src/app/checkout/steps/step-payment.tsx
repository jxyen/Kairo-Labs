"use client";

import { StepShell } from "../step-shell";
import { LockIcon, ShieldIcon } from "../checkout-icons";
import type { AccountLite, StepStatus } from "../checkout-types";

const METHOD_LABELS: Record<string, string> = {
  venmo: "Venmo",
  cashapp: "Cash App",
  zelle: "Zelle",
};

const labelFor = (a: AccountLite) => a.displayName || METHOD_LABELS[a.method] || a.method;

export function StepPayment({
  index,
  status,
  accounts,
  selected,
  onSelect,
  onEdit,
  onContinue,
}: {
  index: number;
  status: StepStatus;
  accounts: AccountLite[];
  selected: string;
  onSelect: (method: string) => void;
  onEdit: () => void;
  onContinue: () => void;
}) {
  if (status === "done") {
    const acc = accounts.find((a) => a.method === selected);
    return (
      <StepShell index={index} title="Payment" status={status} onEdit={onEdit}>
        <div className="co-recap">
          <div className="co-recap-col">
            <div className="co-recap-h">Payment Method</div>
            <p className="co-recap-body">
              {acc ? labelFor(acc) : selected}
              <br />
              <span className="co-recap-muted">
                You&apos;ll complete payment after placing your order.
              </span>
            </p>
          </div>
        </div>
      </StepShell>
    );
  }

  return (
    <StepShell index={index} title="Payment" status={status}>
      <div className="co-step-body">
        <div className="co-secure-line">
          <LockIcon size={14} /> Secure checkout · 256-bit SSL
        </div>

        {accounts.length === 0 ? (
          <p className="co-err">No payment methods are available right now.</p>
        ) : (
          <div className="co-methods">
            {accounts.map((a) => (
              <label key={a.method} className="co-method" data-active={selected === a.method}>
                <input
                  type="radio"
                  name="payment"
                  value={a.method}
                  checked={selected === a.method}
                  onChange={() => onSelect(a.method)}
                />
                <div className="co-method-main">
                  <span className="nm">{labelFor(a)}</span>
                  {a.handle ? <span className="sb font-mono">{a.handle}</span> : null}
                </div>
              </label>
            ))}
          </div>
        )}

        <p className="co-pay-hint">
          Choose how you&apos;d like to pay. After you place your order we&apos;ll show the exact
          handle and a QR code to send payment — your order is reserved while you do.
        </p>

        <div className="co-badges">
          <span className="co-badge-chip">
            <ShieldIcon size={15} /> Damage protection included
          </span>
          <span className="co-badge-chip">
            <ShieldIcon size={15} /> Shipment protection
          </span>
        </div>

        <button
          className="btn btn-emerald co-continue"
          type="button"
          onClick={onContinue}
          disabled={!selected}
        >
          Review your order
        </button>
      </div>
    </StepShell>
  );
}
