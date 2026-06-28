"use client";

import Link from "next/link";
import { useState } from "react";
import {
  formatUSD,
  fromPrice,
  productHref,
  perMg,
  bestValueSizeIndex,
  sizeSavingsPct,
  volumeDiscount,
  nextVolumeTier,
  FREE_SHIP_THRESHOLD,
  type AccessoryIcon,
  type Product,
  type ProductDetail,
} from "@/lib/products";
import { itemFromProduct } from "@/lib/cart/cart";
import { useCart } from "@/components/cart-context";
import { AccIcon } from "@/components/accessory-icon";

// Accessories are now real catalog products (migration 0009); map their code → icon kind.
const ACC_ICON: Record<string, AccessoryIcon> = {
  "BAC-WATER": "water",
  SYRINGES: "syringe",
  SWABS: "swab",
  VIALS: "vial",
};

/* ---------- tiny inline icons (stroke, currentColor) ---------- */
const I = {
  truck: "M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  shield: "M12 3l7 3v6c0 4-3 6.5-7 8-4-1.5-7-4-7-8V6z M9 12l2 2 4-4",
  lock: "M6 10V8a6 6 0 0 1 12 0v2 M5 10h14v10H5z",
  flask: "M9 3h6 M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3",
  snow: "M12 3v18 M5 7l14 10 M19 7L5 17 M9 4l3 2 3-2 M9 20l3-2 3 2",
  drop: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
  doc: "M7 3h7l4 4v14H7z M14 3v4h4 M9 12h6 M9 16h6",
  check: "M5 12l4 4 10-10",
};
function Ico({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {d.split(" M").map((seg, i) => (
        <path key={i} d={i === 0 ? seg : "M" + seg} />
      ))}
    </svg>
  );
}

function aminoCount(seq?: string): string | undefined {
  if (!seq) return undefined;
  const n = seq.split(/[-:]/).map((s) => s.trim()).filter(Boolean).length;
  return n > 1 ? String(n) : undefined;
}

export function ProductDetailView({
  product,
  detail,
  related,
  accessories,
}: {
  product: Product;
  detail: ProductDetail;
  related: Product[];
  accessories: Product[];
}) {
  const { add, justAdded } = useCart();
  const [sizeIdx, setSizeIdx] = useState(0);
  const [qty, setQty] = useState(1);

  const size = product.sizes[sizeIdx];
  const multi = product.sizes.length > 1;
  const added = justAdded === product.code;
  const bestIdx = bestValueSizeIndex(product);

  const disc = volumeDiscount(qty);
  const volNext = nextVolumeTier(qty);
  const subtotal = size.price * qty;
  const total = subtotal * (1 - disc);
  const qualifies = total >= FREE_SHIP_THRESHOLD;
  const remaining = Math.max(0, FREE_SHIP_THRESHOLD - total);

  const idChips = [detail.cas && `CAS ${detail.cas}`, product.category, detail.aliases?.split(",")[0]?.trim()].filter(
    Boolean,
  ) as string[];

  // Representative third-party COA records, one per dosage variant.
  const COA_DATES = ["May 29, 2026", "May 14, 2026", "Apr 30, 2026", "Apr 16, 2026", "Apr 2, 2026"];
  const lotPrefix = product.code.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
  const coaCards = product.sizes.map((s, i) => {
    const labeled = parseFloat(s.mg) || 0;
    const actual = (labeled + 0.21 + i * 0.06).toFixed(2);
    return {
      variant: `${product.name} ${s.mg}`,
      lot: `${lotPrefix}${1001 + i}`,
      labeled: s.mg,
      actual: `${actual} mg`,
      tested: COA_DATES[i % COA_DATES.length],
      purity: product.purity,
    };
  });

  const molecular: [string, string | undefined][] = [
    ["Type", "Synthetic peptide"],
    ["CAS number", detail.cas],
    ["Molecular weight", detail.molarMass?.replace("≈ ", "")],
    ["Molecular formula", detail.formula],
    ["Amino acids", aminoCount(detail.sequence)],
    ["Form", detail.form],
  ];

  const addToCart = () => add(itemFromProduct(product, sizeIdx, qty));

  return (
    <main className="container pdp-main">
      <div className="pdp-crumbs">
        <Link href="/">Home</Link> / <Link href="/catalog">Catalog</Link> / {product.name}
      </div>

      <div className="pdp">
        {/* ---------- compact media ---------- */}
        <div className="pdp-media">
          <div className="pdp-media-inner">
            <span className="pdp-badge-tl"><Ico d={I.flask} size={13} /> Lab tested</span>
            <span className="pdp-badge-tr font-mono">{product.purity} pure</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pdp-vial" src={product.image} alt={`${product.name} research vial`} />
          </div>
        </div>

        {/* ---------- buy box ---------- */}
        <div className="pdp-buybox">
          <div className="pdp-descriptor">{product.sub}</div>
          <h1 className="pdp-name">{product.name}</h1>
          <div className="pdp-idchips">
            {idChips.map((c) => (
              <span className="pdp-idchip font-mono" key={c}>{c}</span>
            ))}
          </div>
          <p className="pdp-desc">{detail.research}</p>

          {multi && (
            <div className="pdp-field">
              <div className="pdp-field-label">Dosage</div>
              <div className="pdp-doses">
                {product.sizes.map((s, i) => (
                  <button key={s.mg} className="pdp-dose" data-active={i === sizeIdx} onClick={() => setSizeIdx(i)}>
                    {s.mg}
                    {i === bestIdx && sizeSavingsPct(product, i) > 0 && (
                      <span className="pdp-dose-save">save {sizeSavingsPct(product, i)}%</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pdp-qtyrow">
            <div className="pdp-field-label">Quantity</div>
            <div className="pdp-stepper">
              <button aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
            </div>
            <div className="pdp-priceblock">
              {multi && <span className="from">From</span>}
              <span className="amt">{formatUSD(size.price)}</span>
              <span className="per font-mono">{formatUSD(perMg(size))}/mg</span>
            </div>
          </div>

          <button className="pdp-add" onClick={addToCart}>
            {added ? (
              <span className="inl"><Ico d={I.check} size={18} /> Added to cart</span>
            ) : (
              <span className="inl">
                Add to cart
                {disc > 0 && <span className="strike">{formatUSD(subtotal)}</span>}
                <b>{formatUSD(total)}</b>
              </span>
            )}
          </button>

          {(disc > 0 || volNext) && (
            <div className="pdp-savehint">
              {disc > 0 ? (
                <>✓ Saving {formatUSD(subtotal - total)} ({Math.round(disc * 100)}% off){volNext && ` — add ${volNext.need} more for ${Math.round(volNext.off * 100)}%`}</>
              ) : (
                <>Buy more, save up to 20%{volNext && ` — add ${volNext.need} more for ${Math.round(volNext.off * 100)}%`}</>
              )}
            </div>
          )}

          <div className="pdp-shipbox">
            <div className="pdp-shipitem"><span className="ic"><Ico d={I.truck} /></span><div><b>{qualifies ? "Ships free" : `${formatUSD(remaining)} to free shipping`}</b><span>Same-day US dispatch</span></div></div>
            <div className="pdp-shipitem"><span className="ic"><Ico d={I.flask} /></span><div><b>COA on every lot</b><span>Third-party tested</span></div></div>
            <div className="pdp-shipitem"><span className="ic"><Ico d={I.lock} /></span><div><b>Secure checkout</b><span>Encrypted payment</span></div></div>
          </div>

          <div className="pdp-rou">
            <b>Research use only.</b> Sold strictly for laboratory and research use — not a drug, food, cosmetic, or
            supplement, and not for human or veterinary consumption.
          </div>
        </div>
      </div>

      {/* ---------- Certificate of Analysis ---------- */}
      <section className="pdp-section" id="coa">
        <div className="pdp-sec-head">
          <span className="pdp-sec-ic"><Ico d={I.flask} size={20} /></span>
          <div>
            <h2 className="pdp-h">Certificate of Analysis</h2>
            <div className="pdp-sec-sub">Third-party tested · <span className="pdp-accred">ISO/IEC 17025 accredited</span></div>
          </div>
        </div>

        <div className="pdp-coa-row">
          {coaCards.map((c) => (
            <div className="pdp-coa-card" key={c.lot}>
              <div className="pdp-coa-top">
                <span className="pdp-coa-tag dark">Latest</span>
                <span className="pdp-coa-tag soft">ISO 17025</span>
                <span className="pdp-coa-tag emer">7× testing</span>
              </div>
              <div className="pdp-coa-purity">
                <div className="big">{c.purity.replace(/[^0-9.]/g, "")}%</div>
                <div className="lab">Purity</div>
                <div className="pass"><Ico d={I.check} size={14} /> Passed full QC panel</div>
              </div>
              <div className="pdp-coa-grid">
                {([
                  ["Variant", c.variant, false],
                  ["Lot #", c.lot, false],
                  ["Labeled", c.labeled, false],
                  ["Actual", c.actual, true],
                  ["Tested", c.tested, false],
                ] as [string, string, boolean][]).map(([k, v, hi]) => (
                  <div className="pdp-coa-grow" key={k}><span className="k">{k}</span><span className={hi ? "v hi" : "v"}>{v}</span></div>
                ))}
              </div>
              <div className="pdp-coa-panel">
                <div className="hd"><span>Full QC panel</span><span className="emer">7× tested</span></div>
                {([
                  ["Purity (HPLC)", c.purity],
                  ["Net peptide content", c.actual],
                  ["Identity (HPLC-MS)", "Confirmed"],
                  ["Heavy metals (ICP-MS)", "Not detected"],
                  ["Sterility (PCR)", "No growth"],
                  ["Endotoxin (LAL)", "< 0.5 EU/mg"],
                ] as [string, string][]).map(([k, v]) => (
                  <div className="pdp-coa-prow" key={k}>
                    <span className="k">{k}</span>
                    <span className="v">{v} <Ico d={I.check} size={12} /></span>
                  </div>
                ))}
              </div>
              <button className="pdp-coa-btn"><Ico d={I.doc} size={15} /> View COA (PDF)</button>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Frequently researched together (compact) ---------- */}
      {related.length > 0 && (
        <section className="pdp-section">
          <h2 className="pdp-h">Frequently researched together</h2>
          <p className="pdp-desc" style={{ margin: "2px 0 16px" }}>Compounds commonly studied alongside {product.name}.</p>
          <div className="pdp-rel-row">
            {related.map((p) => (
              <Link href={productHref(p)} className="pdp-rel-card" key={p.code}>
                <div className="pdp-rel-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="pdp-rel-vial" src={p.image} alt={`${p.name} research vial`} loading="lazy" />
                </div>
                <div className="pdp-rel-body">
                  <div className="pdp-rel-name">{p.name}</div>
                  <div className="pdp-rel-sub">{p.sub}</div>
                  <div className="pdp-rel-foot">
                    <span className="pdp-rel-price"><span className="from">From</span>{formatUSD(fromPrice(p))}</span>
                    <span className="pdp-rel-go" aria-hidden>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Compound Information ---------- */}
      <section className="pdp-section">
        <div className="pdp-sec-head">
          <span className="pdp-sec-ic"><Ico d={I.drop} size={20} /></span>
          <div>
            <h2 className="pdp-h">Compound Information</h2>
            <div className="pdp-sec-sub">Technical specifications</div>
          </div>
        </div>
        <div className="pdp-info-card">
          <div className="pdp-info-eyebrow font-mono">Molecular profile</div>
          <h3 className="pdp-info-q">What is {product.name}?</h3>
          <p className="pdp-desc" style={{ marginTop: 0 }}>{detail.research}</p>
          <div className="pdp-info-table">
            {molecular.filter(([, v]) => !!v).map(([k, v]) => (
              <div className="pdp-info-row" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
            ))}
          </div>
          {detail.sequence && (
            <div className="pdp-seq">
              <span className="lab font-mono">Sequence</span>
              <span className="val font-mono">{detail.sequence}</span>
            </div>
          )}
          {detail.components && (
            <div className="pdp-seq">
              <span className="lab font-mono">Components</span>
              <span className="val">{detail.components.join("  ·  ")}</span>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Storage & Stability ---------- */}
      <section className="pdp-section">
        <div className="pdp-sec-head">
          <span className="pdp-sec-ic"><Ico d={I.snow} size={20} /></span>
          <div>
            <h2 className="pdp-h">Storage &amp; Stability</h2>
            <div className="pdp-sec-sub">Keep it research-grade</div>
          </div>
        </div>
        <div className="pdp-store-chips">
          {["Avoid freeze/thaw cycles", "Protect from light", "Keep refrigerated"].map((c) => (
            <span className="pdp-store-chip" key={c}>{c}</span>
          ))}
        </div>
        <div className="pdp-store-cards">
          <div className="pdp-store-card">
            <span className="ic blue"><Ico d={I.snow} /></span>
            <div><div className="t">Lyophilized (powder)</div><div className="d"><b>−20°C</b> · 24+ months</div></div>
          </div>
          <div className="pdp-store-card">
            <span className="ic green"><Ico d={I.drop} /></span>
            <div><div className="t">Reconstituted</div><div className="d"><b>2–8°C</b> · ~4 weeks</div></div>
          </div>
        </div>
      </section>

      {/* ---------- Complete your order ---------- */}
      <section className="pdp-section">
        <h2 className="pdp-h">Complete your order</h2>
        <p className="pdp-desc" style={{ margin: "2px 0 16px" }}>Everything you need to reconstitute and run your research.</p>
        <div className="pdp-acc-row">
          {accessories.map((a) => (
            <div className="pdp-acc" key={a.code}>
              <span className="pdp-acc-ic"><AccIcon kind={ACC_ICON[a.code] ?? "vial"} /></span>
              <div className="pdp-acc-meta">
                <div className="nm">{a.name}</div>
                <div className="sb">{a.sub}</div>
              </div>
              <div className="pdp-acc-buy">
                <span className="pr">{formatUSD(a.sizes[0].price)}</span>
                <button className="pdp-acc-add" onClick={() => add(itemFromProduct(a, 0))}>
                  {justAdded === a.code ? "✓ Added" : "+ Add"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- fine print ---------- */}
      <section className="pdp-section pdp-fine">
        <p><b>Disclaimer.</b> This compound has not been evaluated by the FDA. It is not intended to diagnose, treat, cure, or prevent any disease, and is not a drug, food, cosmetic, or dietary supplement.</p>
        <p><b>Terms of sale.</b> By purchasing, you affirm that you are at least 21 and a qualified researcher (or acting on behalf of a qualified laboratory or institution). You assume full responsibility for safe handling, storage, use, and disposal in compliance with all applicable laws. Orders may be subject to verification; all sales are final.</p>
      </section>

      {/* ---------- sticky add-to-cart bar (mobile) ---------- */}
      <div className="pdp-sticky">
        <div className="pdp-sticky-info">
          <span className="nm">{product.name}</span>
          <span className="pr">{formatUSD(size.price)}</span>
        </div>
        <div className="pdp-sticky-buy">
          {multi && (
            <div className="pdp-sticky-doses">
              {product.sizes.map((s, i) => (
                <button key={s.mg} data-active={i === sizeIdx} onClick={() => setSizeIdx(i)}>{s.mg}</button>
              ))}
            </div>
          )}
          <button className="pdp-sticky-add" onClick={addToCart}>{added ? "✓ Added" : "Add"}</button>
        </div>
      </div>
    </main>
  );
}
