"use client";

import Link from "next/link";
import { useState } from "react";
import {
  formatUSD,
  productHref,
  perMg,
  bestValueSizeIndex,
  sizeSavingsPct,
  bundleSavings,
  volumeDiscount,
  FREE_SHIP_THRESHOLD,
  ACCESSORIES,
  type Accessory,
  type AccessoryIcon,
  type Product,
  type ProductDetail,
} from "@/lib/products";
import { useCart } from "@/components/cart-context";
import { ProductCard } from "@/components/product-card";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pdp-section">
      <h2 className="pdp-h">{title}</h2>
      {children}
    </div>
  );
}

function AccIcon({ kind }: { kind: AccessoryIcon }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (kind === "water") return <svg {...common}><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" /></svg>;
  if (kind === "syringe") return <svg {...common}><path d="M4 20l3-3" /><path d="M14 4l6 6" /><path d="M17 7l-9 9-3 .5.5-3 9-9 2.5 2.5z" /></svg>;
  if (kind === "swab") return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 12h6" /></svg>;
  return <svg {...common}><path d="M9 3h6" /><path d="M10 3v5l-2.2 8.5A2 2 0 0 0 9.7 19h4.6a2 2 0 0 0 1.9-2.5L14 8V3" /><path d="M8.3 12h7.4" /></svg>;
}

const TIER_LABELS = [
  { min: 2, off: 0.1 },
  { min: 3, off: 0.15 },
  { min: 5, off: 0.2 },
];

export function ProductDetailView({
  product,
  detail,
  related,
}: {
  product: Product;
  detail: ProductDetail;
  related: Product[];
}) {
  const { add, justAdded } = useCart();
  const [sizeIdx, setSizeIdx] = useState(0);
  const [qty, setQty] = useState(1);

  const size = product.sizes[sizeIdx];
  const added = justAdded === product.code;
  const bestIdx = bestValueSizeIndex(product);
  const bundle = bundleSavings(product);

  const disc = volumeDiscount(qty);
  const subtotal = size.price * qty;
  const total = subtotal * (1 - disc);
  const qualifies = total >= FREE_SHIP_THRESHOLD;
  const remaining = Math.max(0, FREE_SHIP_THRESHOLD - total);

  const specs: [string, string | undefined][] = [
    ["Category", product.category],
    ["CAS number", detail.cas],
    ["Molecular formula", detail.formula],
    ["Molar mass", detail.molarMass],
    ["Sequence", detail.sequence],
    ["Form", detail.form],
    ["Purity", `${product.purity} (HPLC)`],
    ["Size", size.mg],
  ];

  return (
    <main className="container" style={{ padding: "clamp(20px,3vw,36px) 20px clamp(56px,8vw,96px)" }}>
      <div className="pdp-crumbs">
        <Link href="/">Home</Link> / <Link href="/catalog">Catalog</Link> / {product.name}
      </div>

      <div className="pdp">
        {/* ---------- media ---------- */}
        <div className="pdp-media">
          <div className="pdp-media-inner">
            <span className="pill pill-dark pdp-badge-tl" style={{ fontSize: 10.5 }}>Lab tested</span>
            <span className="pdp-badge-tr font-mono">{product.purity} pure</span>
            {bundle && <span className="pdp-bundle-flag">Bundle · save {bundle.pct}%</span>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pdp-vial" src={product.image} alt={`${product.name} research vial`} />
          </div>
        </div>

        {/* ---------- buy box ---------- */}
        <div>
          <span className="pill pill-emerald" style={{ fontSize: 10.5 }}>{product.mechanism}</span>
          <h1 className="pdp-name">{product.name}</h1>
          <div className="pdp-sub">{detail.fullName}</div>

          <div className="pdp-price">
            <span className="now">{formatUSD(size.price)}</span>
            {bundle && <span className="was">{formatUSD(bundle.compareAt)}</span>}
            {bundle ? (
              <span className="pdp-save-pill">Save {formatUSD(bundle.save)} vs. separately</span>
            ) : (
              <span className="unit">USD · {size.mg}</span>
            )}
          </div>

          {product.sizes.length > 1 && (
            <>
              <div className="pdp-label">Size — bigger vials cost less per mg</div>
              <div className="pdp-sizes">
                {product.sizes.map((s, i) => (
                  <button
                    key={s.mg}
                    className="pdp-size"
                    data-active={i === sizeIdx}
                    onClick={() => setSizeIdx(i)}
                  >
                    {i === bestIdx && <span className="pdp-size-flag">Best value</span>}
                    <span className="mg">{s.mg}</span>
                    <span className="permg font-mono">{formatUSD(perMg(s))}/mg</span>
                    {i === bestIdx && sizeSavingsPct(product, i) > 0 && (
                      <span className="save font-mono">save {sizeSavingsPct(product, i)}%</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* volume / bulk pricing */}
          <div className="pdp-label">Buy more, save more</div>
          <div className="pdp-tiers">
            {TIER_LABELS.map((t) => (
              <div key={t.min} className="pdp-tier" data-active={disc === t.off}>
                <span className="q font-mono">{t.min}+ vials</span>
                <span className="o">−{Math.round(t.off * 100)}%</span>
              </div>
            ))}
          </div>

          <div className="pdp-label">Quantity</div>
          <div className="pdp-buy">
            <div className="pdp-stepper">
              <button aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
            </div>
            <button className="btn btn-emerald pdp-add" style={{ fontSize: 15.5, padding: "15px 18px" }} onClick={() => add(product.code, qty)}>
              {added ? "✓ Added to cart" : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  Add to cart
                  {disc > 0 && <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{formatUSD(subtotal)}</span>}
                  <b>{formatUSD(total)}</b>
                </span>
              )}
            </button>
          </div>

          {disc > 0 && (
            <div className="pdp-disc-note font-mono">✓ {Math.round(disc * 100)}% bulk discount applied — you save {formatUSD(subtotal - total)}</div>
          )}

          <div className="pdp-ship" data-ok={qualifies}>
            <span style={{ fontWeight: 700 }}>{qualifies ? "✓" : "🚚"}</span>
            {qualifies
              ? "This order ships free"
              : `Add ${formatUSD(remaining)} more for free US shipping`}
          </div>

          <div className="pdp-rou">
            <b>Research use only.</b> This material is sold strictly for laboratory and research use. It is not a drug,
            food, cosmetic, or supplement, and is not for human or veterinary consumption.
          </div>

          <Section title="Research overview">
            <p className="pdp-block" style={{ margin: 0 }}>{detail.research}</p>
          </Section>

          <Section title="Specifications">
            <div className="pdp-spec">
              {specs.filter(([, v]) => !!v).map(([k, v]) => (
                <div className="pdp-spec-row" key={k}>
                  <span className="k">{k}</span>
                  <span className="v">{v}</span>
                </div>
              ))}
            </div>
            {detail.components && (
              <div style={{ marginTop: 14 }}>
                <div className="pdp-label" style={{ margin: "0 0 8px" }}>Components</div>
                <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                  {detail.components.map((c) => (
                    <li key={c} className="font-mono" style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          <Section title="Handling & storage">
            <p className="pdp-block" style={{ margin: 0 }}>{detail.storage}</p>
          </Section>

          <Section title="Disclaimer">
            <p className="pdp-block" style={{ margin: 0 }}>
              This compound has not been evaluated by the FDA. It is not intended to diagnose, treat, cure, or prevent
              any disease, and is not a drug, food, cosmetic, or dietary supplement. All handling and use must follow
              applicable institutional, safety, and regulatory guidelines.
            </p>
          </Section>

          <Section title="Terms of sale">
            <p className="pdp-block" style={{ margin: 0 }}>
              By purchasing, you affirm that you are at least 21 years of age and a qualified researcher — or are
              acting on behalf of a qualified laboratory, institution, or business engaged in lawful research. You
              assume full responsibility for the safe handling, storage, use, and disposal of this material in
              compliance with all applicable laws and regulations. Orders may be subject to verification; all sales
              are final.
            </p>
          </Section>
        </div>
      </div>

      {/* ---------- complete your order (accessories) ---------- */}
      <Section title="Complete your order">
        <p className="pdp-block" style={{ margin: "-4px 0 16px" }}>Everything you need to reconstitute and run your research, added in one tap.</p>
        <div className="pdp-acc-row">
          {ACCESSORIES.map((a: Accessory) => (
            <div className="pdp-acc" key={a.code}>
              <span className="pdp-acc-ic"><AccIcon kind={a.icon} /></span>
              <div className="pdp-acc-meta">
                <div className="nm">{a.name}</div>
                <div className="sb">{a.sub}</div>
              </div>
              <div className="pdp-acc-buy">
                <span className="pr">{formatUSD(a.price)}</span>
                <button className="pdp-acc-add" onClick={() => add(a.code)}>
                  {justAdded === a.code ? "✓ Added" : "+ Add"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- lab testing / COA ---------- */}
      <Section title="Lab testing &amp; certificate of analysis">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(20px,3vw,40px)", alignItems: "flex-start" }}>
          <p className="pdp-block" style={{ flex: "1 1 280px", margin: 0, maxWidth: 460 }}>
            Every lot of {product.name} is third-party tested for purity, identity, sterility and endotoxin. The
            certificate of analysis is matched to the batch number printed on your vial — verify it before you run.
          </p>
          <div style={{ flex: "1 1 300px", maxWidth: 440, background: "var(--surface-card)", border: "1px solid var(--hair)", borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 60px -36px rgba(14,21,18,.3)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div className="font-mono" style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-ghost)" }}>Certificate of Analysis</div>
                <div style={{ marginTop: 4, fontSize: 15, fontWeight: 600 }}>Atlas Analytical Labs</div>
              </div>
              <span className="pill pill-emerald" style={{ fontSize: 11 }}>● PASS</span>
            </div>
            <div style={{ padding: "6px 20px" }}>
              {([
                ["Compound", product.name, false],
                ["Purity (HPLC)", product.purity, true],
                ["Identity (MS)", "Confirmed", false],
                ["Endotoxin", "<0.5 EU/mg", false],
              ] as [string, string, boolean][]).map(([label, value, hi], i, arr) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--hair-soft)" : undefined }}>
                  <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>{label}</span>
                  <span className="font-mono" style={{ fontSize: 13, color: hi ? "var(--emerald)" : "var(--ink)", fontWeight: hi ? 600 : 400 }}>{value}</span>
                </div>
              ))}
            </div>
            <button className="btn" style={{ width: "100%", justifyContent: "center", padding: 14, borderRadius: 0, borderTop: "1px solid var(--hair)", background: "var(--paper-2)", fontSize: 13.5, fontWeight: 600, color: "var(--emerald)" }}>
              View full COA (PDF) →
            </button>
          </div>
        </div>
      </Section>

      {/* ---------- frequently bought together ---------- */}
      {related.length > 0 && (
        <Section title="Frequently bought together">
          <div className="cat-tab-grid">
            {related.map((p) => (
              <ProductCard key={p.code} product={p} />
            ))}
          </div>
          <div style={{ marginTop: 18 }}>
            <button className="btn btn-dark" style={{ fontSize: 14.5, padding: "13px 22px" }} onClick={() => related.forEach((r) => add(r.code))}>
              + Add all {related.length} to cart
            </button>
          </div>
        </Section>
      )}
    </main>
  );
}
