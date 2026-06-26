import Link from "next/link";
import { BESTSELLERS, PRODUCTS, CATEGORY_META, categoryCount, type Category } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { FeatureCard } from "@/components/feature-card";
import { Hero } from "@/components/hero";

const sectionPad = { padding: "clamp(56px, 8vw, 96px) 20px" };
const FEATURE = PRODUCTS.find((p) => p.code === "Retatrutide")!;

const PILLARS: { title: string; desc: string; icon: React.ReactNode }[] = [
  {
    title: "Lab-proven purity",
    desc: "Third-party COA on every batch",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6" /><path d="M10 3v6.5L5.5 17a2 2 0 0 0 1.7 3h9.6a2 2 0 0 0 1.7-3L14 9.5V3" /><path d="M8 14h8" />
      </svg>
    ),
  },
  {
    title: "Best pricing",
    desc: "Premium peptides, fair prices",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.6-1.4V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l7.4 7.4a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.2" />
      </svg>
    ),
  },
  {
    title: "Fast US shipping",
    desc: "Same-day dispatch, tracked",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h11v8H3z" /><path d="M14 10h4l3 3v2h-7z" /><circle cx="7" cy="17" r="1.6" /><circle cx="17.5" cy="17" r="1.6" />
      </svg>
    ),
  },
  {
    title: "Discreet packaging",
    desc: "Plain, unmarked, private",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.3 7 12 12l8.7-5" /><path d="M12 22V12" />
      </svg>
    ),
  },
];

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  "Recovery & Repair": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-4.35-9.3-8.5C1.2 9.7 2.6 6 6 6c2 0 3 1.2 6 4 3-2.8 4-4 6-4 3.4 0 4.8 3.7 3.3 6.5C19 16.65 12 21 12 21z" /><path d="M3.5 12h4l1.5-3 2.5 6 1.5-3h4" />
    </svg>
  ),
  "Metabolic & Weight": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c0 3-4 4-4 8a4 4 0 0 0 8 0c0-1.5-1-2.5-1.5-3.5" /><path d="M12 21a6 6 0 0 0 6-6c0-1.2-.3-2.2-.8-3.2" />
    </svg>
  ),
  "Growth Hormone": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19l5-5 3 3 6-7" /><path d="M17 7h4v4" />
    </svg>
  ),
  "Skin & Cosmetic": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
    </svg>
  ),
  "Blends & Stacks": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 12l9 5 9-5" /><path d="M3 16l9 5 9-5" />
    </svg>
  ),
};

export default function HomePage() {
  return (
    <main>
      <Hero />

      {/* ===================== FEATURED PRODUCT ===================== */}
      <section className="container" style={{ padding: "0 20px clamp(40px,6vw,72px)" }}>
        <FeatureCard product={FEATURE} href="/catalog?cat=Metabolic%20%26%20Weight" />
      </section>

      {/* ===================== TRUST STRIP ===================== */}
      <section className="band">
        <div
          className="container"
          style={{ padding: "clamp(26px,4vw,38px) 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px 8px" }}
        >
          {PILLARS.map((item, i) => (
            <div key={item.title} style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 22px", borderRight: i < PILLARS.length - 1 ? "1px solid var(--hair-soft)" : undefined }}>
              <span style={{ flex: "none", width: 38, height: 38, borderRadius: "var(--r-md)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--emerald-soft)", border: "1px solid var(--emerald-line)", color: "var(--emerald)" }}>
                {item.icon}
              </span>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em" }}>{item.title}</div>
                <div style={{ marginTop: 2, fontSize: 12.5, color: "var(--ink-faint)" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== BESTSELLERS (horizontal slider) ===================== */}
      <section id="bestsellers" className="container" style={sectionPad}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 26 }}>
          <div>
            <div className="eyebrow">Bestsellers</div>
            <h2 style={{ margin: "12px 0 0", fontSize: "clamp(26px,4.4vw,40px)", fontWeight: 700, letterSpacing: "-0.025em" }}>
              Most-ordered compounds
            </h2>
            <div style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
              <span style={{ color: "var(--emerald)", letterSpacing: "2px", fontSize: 14 }}>★★★★★</span>
              <span className="font-mono" style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
                4.9 average · 1,200+ orders shipped from the USA
              </span>
            </div>
          </div>
          <Link href="/catalog" className="btn btn-ghost" style={{ fontSize: 14, padding: "11px 18px" }}>
            View all →
          </Link>
        </div>
        <div className="h-slider">
          {[...BESTSELLERS].sort((a, b) => b.reviews - a.reviews).map((p) => (
            <div className="h-slide" key={p.code}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        <div className="h-slider-hint font-mono">← swipe for more →</div>
      </section>

      {/* ===================== QUALITY / COA ===================== */}
      <section id="quality" className="band">
        <div className="container" style={{ padding: "clamp(56px,8vw,96px) 20px", display: "flex", flexWrap: "wrap", gap: "clamp(32px,5vw,64px)", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <div className="eyebrow">Verified quality</div>
            <h2 style={{ margin: "14px 0 0", fontSize: "clamp(26px,4.4vw,40px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.08 }}>
              Every batch is tested by an independent lab — and you can check the paperwork.
            </h2>
            <p style={{ margin: "18px 0 0", fontSize: 16, lineHeight: 1.6, color: "var(--ink-muted)", maxWidth: 520 }}>
              We don&apos;t ask you to take our word for it. Each lot is sent to a third-party analytical lab for purity
              and identity testing. The certificate of analysis is matched to the batch number printed on your vial.
            </p>
            <div style={{ margin: "26px 0 0", display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["HPLC purity & mass-spec identity", "Quantified purity with confirmed molecular weight."],
                ["Endotoxin & sterility screening", "Lot-level results, posted before shipment."],
                ["Traceable by batch number", "Look up the exact COA that matches your vial."],
              ].map(([title, body]) => (
                <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ flex: "none", marginTop: 1, color: "var(--emerald)", fontWeight: 700 }}>✓</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
                    <div style={{ fontSize: 13.5, color: "var(--ink-faint)" }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* certificate card */}
          <div style={{ flex: 1, minWidth: 290, maxWidth: 440 }}>
            <div style={{ background: "var(--surface-card)", border: "1px solid var(--hair)", borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 60px -36px rgba(14,21,18,.3)" }}>
              <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div className="font-mono" style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-ghost)" }}>
                    Certificate of Analysis
                  </div>
                  <div style={{ marginTop: 4, fontSize: 15, fontWeight: 600 }}>Atlas Analytical Labs</div>
                </div>
                <span className="pill pill-emerald" style={{ fontSize: 11 }}>● PASS</span>
              </div>
              <div style={{ padding: "6px 20px" }}>
                {([
                  ["Compound", "BPC-157", false],
                  ["Batch / Lot", "CL-2406-A", false],
                  ["Purity (HPLC)", "99.2%", true],
                  ["Identity (MS)", "Confirmed", false],
                  ["Endotoxin", "<0.5 EU/mg", false],
                  ["Test date", "2026-06-12", false],
                ] as [string, string, boolean][]).map(([label, value, hi], i, arr) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "13px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--hair-soft)" : undefined }}>
                    <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>{label}</span>
                    <span className="font-mono" style={{ fontSize: 13, color: hi ? "var(--emerald)" : "var(--ink)", fontWeight: hi ? 600 : 400 }}>{value}</span>
                  </div>
                ))}
              </div>
              <button className="btn" style={{ width: "100%", justifyContent: "center", padding: 15, borderRadius: 0, borderTop: "1px solid var(--hair)", background: "var(--paper-2)", fontSize: 13.5, fontWeight: 600, color: "var(--emerald)" }}>
                View full COA (PDF) →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== REVIEWS ===================== */}
      <section id="reviews" className="container" style={sectionPad}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 34 }}>
          <div>
            <div className="eyebrow">Reviews</div>
            <h2 style={{ margin: "12px 0 0", fontSize: "clamp(26px,4.4vw,40px)", fontWeight: 700, letterSpacing: "-0.025em" }}>
              Trusted by researchers
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "var(--emerald)", fontSize: 16, letterSpacing: "2px" }}>★★★★★</span>
            <span style={{ fontSize: 14, color: "var(--ink-muted)" }}>4.9 / 5 · 1,200+ orders</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {[
            { quote: "Purity matched the COA exactly — reconstituted clean, no cloudiness. Shipping was next-day.", initials: "MR", name: "M. Reyes" },
            { quote: "Documentation is the best I've seen. Batch numbers line up with the certificates every single time.", initials: "AL", name: "Dr. A. Lin" },
            { quote: "Discreet packaging and fast US delivery. This is now my default supplier for lab work.", initials: "JO", name: "J. Okafor" },
          ].map((r) => (
            <div key={r.name} style={{ background: "var(--surface-card)", border: "1px solid var(--hair)", borderRadius: 14, padding: 24 }}>
              <div style={{ color: "var(--emerald)", letterSpacing: "2px", marginBottom: 14 }}>★★★★★</div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft)" }}>&ldquo;{r.quote}&rdquo;</p>
              <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--paper-band)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "var(--ink-muted)" }}>
                  {r.initials}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                  <div className="font-mono" style={{ fontSize: 11, color: "var(--emerald)" }}>Verified buyer</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== SHOP BY CATEGORY ===================== */}
      <section id="categories" className="band">
        <div className="container" style={sectionPad}>
          <div style={{ marginBottom: 34 }}>
            <div className="eyebrow">Shop by research category</div>
            <h2 style={{ margin: "12px 0 0", fontSize: "clamp(26px,4.4vw,40px)", fontWeight: 700, letterSpacing: "-0.025em" }}>
              Find peptides by research goal
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {CATEGORY_META.map((c) => (
              <Link key={c.name} href={`/catalog?cat=${encodeURIComponent(c.name)}`} className="cat-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span className="cat-icon">{CATEGORY_ICONS[c.name]}</span>
                  <span className="font-mono" style={{ fontSize: 11.5, color: "var(--ink-ghost)" }}>{categoryCount(c.name)} products</span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>{c.name}</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-muted)" }}>{c.blurb}</div>
                <span style={{ marginTop: 4, fontSize: 13.5, fontWeight: 600, color: "var(--emerald)" }}>Browse →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PROCESS ===================== */}
      <section className="container" style={sectionPad}>
        <div className="eyebrow">How it works</div>
        <h2 style={{ margin: "12px 0 36px", fontSize: "clamp(26px,4.4vw,40px)", fontWeight: 700, letterSpacing: "-0.025em" }}>
          From synthesis to your bench
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
          {[
            ["01", "Synthesized to spec", "Produced and lyophilized in controlled, ISO-grade facilities."],
            ["02", "Independently tested", "Every lot sent to a third-party lab for purity and identity."],
            ["03", "COA published", "Results posted per batch and matched to your vial's lot number."],
            ["04", "Shipped same day", "Cold-packed, tracked and discreetly packaged — from the USA."],
          ].map(([num, title, body]) => (
            <div key={num} style={{ background: "var(--surface-card)", border: "1px solid var(--hair)", borderRadius: 14, padding: 22 }}>
              <div className="font-mono" style={{ fontSize: 13, color: "var(--emerald)" }}>{num}</div>
              <div style={{ margin: "14px 0 7px", fontSize: 16, fontWeight: 600 }}>{title}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-muted)" }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== SECURE CHECKOUT ===================== */}
      <section className="container" style={{ padding: "clamp(48px,7vw,80px) 20px" }}>
        <div style={{ background: "var(--surface-card)", border: "1px solid var(--hair)", borderRadius: 18, padding: "clamp(28px,4vw,44px)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 28 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="1.6"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              <span className="eyebrow">Secure checkout</span>
            </div>
            <h2 style={{ margin: 0, fontSize: "clamp(22px,3.4vw,30px)", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Encrypted, discreet, and easy to order
            </h2>
            <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.6, color: "var(--ink-muted)", maxWidth: 480 }}>
              256-bit SSL, PCI-compliant payments, and a neutral billing descriptor. Your order ships in unmarked, tracked packaging.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {["VISA", "MASTERCARD", "AMEX", "DISCOVER"].map((c) => (
              <span key={c} className="chip">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section id="faq" style={{ maxWidth: 820, margin: "0 auto", padding: "clamp(40px,6vw,72px) 20px clamp(56px,8vw,96px)" }}>
        <div className="eyebrow">FAQ</div>
        <h2 style={{ margin: "12px 0 30px", fontSize: "clamp(26px,4.4vw,38px)", fontWeight: 700, letterSpacing: "-0.025em" }}>
          Common questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            ["Are these products for human use?", "No. All Kairo Labs products are sold strictly for laboratory and research use only — not for human or veterinary consumption."],
            ["Do you provide a certificate of analysis?", "Yes. Every batch ships with a third-party COA that you can verify against the lot number printed on your vial."],
            ["Where do you ship from, and how fast?", "All orders ship the same day from our US facility, cold-packed, tracked and discreetly packaged."],
            ["What payment methods do you accept?", "All major credit cards through a 256-bit encrypted, PCI-compliant checkout with a discreet billing descriptor."],
          ].map(([q, a], i, arr) => (
            <div key={q} style={{ padding: "22px 0", borderTop: "1px solid var(--hair)", borderBottom: i === arr.length - 1 ? "1px solid var(--hair)" : undefined }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{q}</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-muted)" }}>{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== CTA (emerald) ===================== */}
      <section className="container" style={{ padding: "0 20px clamp(56px,8vw,96px)" }}>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: "var(--r-2xl)", background: "var(--grad-desk)", padding: "clamp(44px,7vw,80px) clamp(24px,5vw,64px)", textAlign: "center" }}>
          <h2 style={{ margin: "0 auto", maxWidth: 620, fontSize: "clamp(26px,4.6vw,44px)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1.02, color: "#fff" }}>
            Reliable peptides,<br />backed by paperwork.
          </h2>
          <p style={{ margin: "18px auto 0", maxWidth: 480, fontSize: 16, color: "rgba(255,255,255,.84)" }}>
            ≥99% purity, third-party tested, honest pricing — shipped same day from the USA in discreet packaging.
          </p>
          <Link href="/catalog" className="btn btn-white" style={{ marginTop: 30, fontSize: 16, padding: "16px 32px" }}>
            Browse the catalog →
          </Link>
        </div>
      </section>
    </main>
  );
}
