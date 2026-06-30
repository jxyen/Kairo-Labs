"use client";

import { useState } from "react";
import { StepShell } from "../step-shell";
import type { ShippingValues, StepStatus } from "../checkout-types";

export function StepShipping({
  index,
  status,
  values,
  onEdit,
  onContinue,
}: {
  index: number;
  status: StepStatus;
  values: ShippingValues;
  onEdit: () => void;
  onContinue: (v: ShippingValues) => void;
}) {
  const [form, setForm] = useState<ShippingValues>(values);
  const set = (k: keyof ShippingValues, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  if (status === "done") {
    return (
      <StepShell index={index} title="Shipping Address" status={status} onEdit={onEdit}>
        <div className="co-recap">
          <div className="co-recap-col">
            <div className="co-recap-h">Shipping Address</div>
            <p className="co-recap-body">
              {values.name}
              <br />
              {values.line1}
              {values.line2 ? (
                <>
                  <br />
                  {values.line2}
                </>
              ) : null}
              <br />
              {values.city}, {values.state} {values.postal_code}
              <br />
              US
            </p>
          </div>
          <div className="co-recap-col">
            <div className="co-recap-h">Contact</div>
            <p className="co-recap-body">
              {values.phone ? (
                <>
                  {values.phone}
                  <br />
                </>
              ) : null}
              {values.email}
            </p>
            <p className="co-recap-note">Order confirmation, tracking &amp; updates sent here.</p>
          </div>
          <div className="co-recap-col">
            <div className="co-recap-h">Billing Address</div>
            <p className="co-recap-body">
              {values.billingSame ? "Same as shipping address" : "Separate billing address"}
            </p>
          </div>
        </div>
      </StepShell>
    );
  }

  return (
    <StepShell index={index} title="Shipping Address" status={status}>
      <form
        className="co-step-body"
        onSubmit={(e) => {
          e.preventDefault();
          onContinue(form);
        }}
      >
        <div className="co-rows">
          <Field label="Full name" value={form.name} onChange={(v) => set("name", v)} autoComplete="name" required />
          <div className="co-row2">
            <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} autoComplete="email" required />
            <Field label="Phone (optional)" type="tel" value={form.phone} onChange={(v) => set("phone", v)} autoComplete="tel" />
          </div>
          <Field label="Address" value={form.line1} onChange={(v) => set("line1", v)} autoComplete="address-line1" required />
          <Field label="Apt / unit (optional)" value={form.line2} onChange={(v) => set("line2", v)} autoComplete="address-line2" />
          <div className="co-row3">
            <Field label="City" value={form.city} onChange={(v) => set("city", v)} autoComplete="address-level2" required />
            <Field label="State" value={form.state} onChange={(v) => set("state", v)} autoComplete="address-level1" required />
            <Field label="ZIP" value={form.postal_code} onChange={(v) => set("postal_code", v)} autoComplete="postal-code" required />
          </div>
        </div>

        <label className="co-check">
          <input
            type="checkbox"
            checked={form.billingSame}
            onChange={(e) => set("billingSame", e.target.checked)}
          />
          <span>Billing address same as shipping</span>
        </label>

        <button className="btn btn-emerald co-continue" type="submit">
          Continue to delivery
        </button>
      </form>
    </StepShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="co-field">
      <span className="co-label">{label}</span>
      <input
        className="co-input"
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
