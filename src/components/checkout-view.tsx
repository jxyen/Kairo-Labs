"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-context";
import { AccIcon } from "@/components/accessory-icon";
import { accessoryByCode, formatUSD } from "@/lib/products";
import { placeOrder } from "@/app/checkout/actions";
import {
  validateDraft,
  EMPTY_DRAFT,
  type CheckoutDraft,
  type ShippingMethod,
} from "@/lib/checkout";

function Field({
  label,
  error,
  children,
  half,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  half?: boolean;
}) {
  return (
    <label className="co-field" data-half={half ? "" : undefined}>
      <span className="co-label">{label}</span>
      {children}
      {error && <span className="co-err">{error}</span>}
    </label>
  );
}

export function CheckoutView() {
  const { items, totals, clear } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [contact, setContact] = useState(EMPTY_DRAFT.contact);
  const [shipping, setShipping] = useState(EMPTY_DRAFT.shipping);
  const [method, setMethod] = useState<ShippingMethod>("standard");
  const [attestation, setAttestation] = useState(false);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const draft: CheckoutDraft = useMemo(
    () => ({ items, contact, shipping, method, attestation, notes }),
    [items, contact, shipping, method, attestation, notes],
  );

  const empty = totals.lines.length === 0;

  function submit() {
    const errs = validateDraft(draft);
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length > 0) {
      // Scroll to the first error for visibility.
      const first = document.querySelector(".co-err");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    startTransition(async () => {
      const res = await placeOrder(draft);
      if (res.ok && res.orderNumber) {
        clear();
        router.push(`/checkout/confirmation?order=${encodeURIComponent(res.orderNumber)}`);
      } else {
        setFormError(res.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (empty) {
    return (
      <main className="container co-empty-wrap">
        <h1 className="co-title">Checkout</h1>
        <div className="co-empty">
          <p>Your cart is empty — add a few compounds before checking out.</p>
          <Link href="/catalog" className="btn btn-emerald" style={{ padding: "13px 24px" }}>
            Browse the catalog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container co-wrap">
      <div className="co-crumbs">
        <Link href="/">Home</Link> / <Link href="/catalog">Catalog</Link> / Checkout
      </div>
      <h1 className="co-title">Checkout</h1>

      <div className="co-grid">
        {/* ---------------- form ---------------- */}
        <div className="co-form">
          <section className="co-card">
            <h2 className="co-h">Contact</h2>
            <div className="co-rows">
              <Field label="Full name" error={errors.name}>
                <input
                  className="co-input"
                  value={contact.name}
                  autoComplete="name"
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                />
              </Field>
              <div className="co-row2">
                <Field label="Email" error={errors.email} half>
                  <input
                    className="co-input"
                    type="email"
                    value={contact.email}
                    autoComplete="email"
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  />
                </Field>
                <Field label="Phone (optional)" half>
                  <input
                    className="co-input"
                    type="tel"
                    value={contact.phone}
                    autoComplete="tel"
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="co-card">
            <h2 className="co-h">Shipping address</h2>
            <div className="co-rows">
              <Field label="Street address" error={errors.line1}>
                <input
                  className="co-input"
                  value={shipping.line1}
                  autoComplete="address-line1"
                  onChange={(e) => setShipping({ ...shipping, line1: e.target.value })}
                />
              </Field>
              <Field label="Apartment, suite, etc. (optional)">
                <input
                  className="co-input"
                  value={shipping.line2}
                  autoComplete="address-line2"
                  onChange={(e) => setShipping({ ...shipping, line2: e.target.value })}
                />
              </Field>
              <div className="co-row2">
                <Field label="City" error={errors.city} half>
                  <input
                    className="co-input"
                    value={shipping.city}
                    autoComplete="address-level2"
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                  />
                </Field>
                <Field label="State / region" error={errors.state} half>
                  <input
                    className="co-input"
                    value={shipping.state}
                    autoComplete="address-level1"
                    onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                  />
                </Field>
              </div>
              <div className="co-row2">
                <Field label="Postal code" error={errors.postalCode} half>
                  <input
                    className="co-input"
                    value={shipping.postalCode}
                    autoComplete="postal-code"
                    onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                  />
                </Field>
                <Field label="Country" error={errors.country} half>
                  <select
                    className="co-input"
                    value={shipping.country}
                    autoComplete="country"
                    onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
              </div>
            </div>
          </section>

          <section className="co-card">
            <h2 className="co-h">Shipping method</h2>
            <div className="co-methods">
              <label className="co-method" data-active={method === "standard"}>
                <input type="radio" name="method" checked={method === "standard"} onChange={() => setMethod("standard")} />
                <span className="co-method-main">
                  <span className="nm">Standard · tracked</span>
                  <span className="sb">2–5 business days · cold-chain where needed</span>
                </span>
                <span className="co-method-price">{totals.shipping === 0 ? "Free" : formatUSD(totals.shipping)}</span>
              </label>
              <label className="co-method" data-active={method === "express"}>
                <input type="radio" name="method" checked={method === "express"} onChange={() => setMethod("express")} />
                <span className="co-method-main">
                  <span className="nm">Express · priority</span>
                  <span className="sb">1–2 business days</span>
                </span>
                <span className="co-method-price">Quoted at payment</span>
              </label>
            </div>
          </section>

          <section className="co-card">
            <h2 className="co-h">Order notes (optional)</h2>
            <textarea
              className="co-input co-textarea"
              rows={3}
              placeholder="Anything we should know about this order or its handling."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          {/* ---- PAYMENT SEAM ----
              Intentionally a placeholder. The order is created as `pending`
              when you place it; payment is wired here by the co-founder.
              See HANDOFF.md. */}
          <section className="co-card co-pay">
            <h2 className="co-h">Payment</h2>
            <div className="co-pay-stub">
              <span className="co-pay-ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20" /></svg>
              </span>
              <div>
                <div className="co-pay-t">Payment is confirmed on the next step.</div>
                <div className="co-pay-s">Your order is reserved when you place it. You&apos;ll complete payment securely right after.</div>
              </div>
            </div>
          </section>

          <label className="co-attest" data-err={errors.attestation ? "" : undefined}>
            <input type="checkbox" checked={attestation} onChange={(e) => setAttestation(e.target.checked)} />
            <span>
              I confirm I am at least <b>21 years old</b> and a qualified researcher — or acting for a qualified
              laboratory, institution, or business — and that all materials are purchased strictly{" "}
              <b>for laboratory and research use only</b>, not for human or animal consumption. I accept the terms of sale.
            </span>
          </label>
          {errors.attestation && <div className="co-err" style={{ marginTop: -6 }}>{errors.attestation}</div>}

          {formError && <div className="co-formerr">{formError}</div>}

          <button className="btn btn-emerald co-submit" onClick={submit} disabled={pending}>
            {pending ? "Placing order…" : `Place order · ${formatUSD(totals.total)}`}
          </button>
          <p className="co-rou font-mono">
            For research use only · not for human or animal consumption · all sales final
          </p>
        </div>

        {/* ---------------- summary ---------------- */}
        <aside className="co-summary">
          <div className="co-summary-inner">
            <h2 className="co-h">Order summary</h2>
            <div className="co-lines">
              {totals.lines.map((l) => {
                const acc = l.kind === "accessory" ? accessoryByCode(l.code) : undefined;
                return (
                  <div className="co-line" key={`${l.code}::${l.sizeMg ?? ""}`}>
                    <div className="co-thumb" data-kind={l.kind}>
                      {l.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.image} alt="" />
                      ) : (
                        <span>{acc && <AccIcon kind={acc.icon} size={18} />}</span>
                      )}
                      <span className="co-qbadge font-mono">{l.qty}</span>
                    </div>
                    <div className="co-line-main">
                      <div className="co-line-name">{l.name}</div>
                      <div className="co-line-sub font-mono">{l.sub}</div>
                    </div>
                    <div className="co-line-price">{formatUSD(l.lineTotal)}</div>
                  </div>
                );
              })}
            </div>
            <dl className="co-totals">
              <div><dt>Subtotal</dt><dd>{formatUSD(totals.subtotal)}</dd></div>
              {totals.discount > 0 && (
                <div className="co-totals-disc">
                  <dt>Volume discount (−{Math.round(totals.discountRate * 100)}%)</dt>
                  <dd>−{formatUSD(totals.discount)}</dd>
                </div>
              )}
              <div><dt>Shipping</dt><dd>{totals.shipping === 0 ? "Free" : formatUSD(totals.shipping)}</dd></div>
              <div className="co-totals-grand"><dt>Total</dt><dd>{formatUSD(totals.total)}</dd></div>
            </dl>
            <Link href="/catalog" className="co-back">← Continue shopping</Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
