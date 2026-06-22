import Link from "next/link";
import { FEATURED } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { VialPlaceholder } from "@/components/vial-placeholder";

const sectionPad = { padding: "clamp(56px, 8vw, 96px) 20px" };

export default function HomePage() {
  return (
    <main>
      {/* ===================== HERO ===================== */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url('/hero-bg4.png')",
              backgroundSize: "cover",
              backgroundPosition: "62% center",
              opacity: 0.85,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(13,15,17,0.5) 0%, transparent 20%, transparent 60%, rgba(13,15,17,0.6) 84%, #0d0f11 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(100deg, rgba(13,15,17,0.5) 0%, rgba(13,15,17,0.12) 38%, transparent 56%)",
            }}
          />
        </div>

        <div
          className="container"
          style={{
            position: "relative",
            padding: "clamp(48px,8vw,92px) 20px clamp(40px,6vw,64px)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "clamp(28px,5vw,56px)",
          }}
        >
          <div style={{ flex: 1, minWidth: 300 }}>
            <span className="glass-pill">
              <span className="dot" />
              Independently lab-tested
            </span>
            <h1
              style={{
                margin: "22px 0 0",
                fontSize: "clamp(33px,6.6vw,56px)",
                lineHeight: 1.04,
                letterSpacing: "-0.03em",
                fontWeight: 600,
              }}
            >
              Research-grade peptides, shipped same day from the USA.
            </h1>
            <p
              style={{
                margin: "20px 0 0",
                fontSize: "clamp(15px,2.4vw,18px)",
                lineHeight: 1.55,
                color: "var(--text-muted)",
                maxWidth: 520,
              }}
            >
              Every batch is independently lab-tested for ≥99% purity, with a certificate of analysis
              you can verify by lot number. Discreet packaging. Fast, tracked domestic delivery.
            </p>
            <div style={{ margin: "30px 0 0", display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link href="/catalog" className="btn btn-white" style={{ fontSize: 15, padding: "14px 26px" }}>
                Shop the catalog →
              </Link>
              <Link href="/#quality" className="btn btn-ghost" style={{ fontSize: 15, padding: "14px 24px" }}>
                View certificates
              </Link>
            </div>
            <div
              className="font-mono"
              style={{
                margin: "26px 0 0",
                display: "flex",
                flexWrap: "wrap",
                gap: "18px 22px",
                fontSize: 12,
                color: "var(--text-faint)",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: "var(--coral)" }}>✓</span> ≥99% HPLC purity
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: "var(--coral)" }}>✓</span> COA per batch
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: "var(--coral)" }}>✓</span> US-based fulfillment
              </span>
            </div>
          </div>

          {/* hero visual */}
          <div
            style={{
              position: "relative",
              flex: 1,
              minWidth: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 340,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 360,
                height: 360,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(236,138,94,0.18), transparent 62%)",
              }}
            />
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 380,
                borderRadius: 24,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 50px 90px -45px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ background: "radial-gradient(120% 95% at 50% 12%, #fdfcfb, #e6e3df)" }}>
                <VialPlaceholder height={380} />
              </div>
              <span
                className="font-mono"
                style={{
                  position: "absolute",
                  top: 14,
                  left: 14,
                  pointerEvents: "none",
                  fontSize: 10,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: "var(--text-warm)",
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(0,0,0,0.07)",
                  padding: "5px 10px",
                  borderRadius: 999,
                }}
              >
                Research use only
              </span>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: 16,
                  background: "linear-gradient(180deg, transparent, rgba(13,15,17,0.78))",
                  pointerEvents: "none",
                }}
              >
                <span className="font-mono" style={{ fontSize: 12, color: "#eef1f2", fontWeight: 500 }}>
                  BPC-157 · 5 mg
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--coral)",
                    background: "rgba(13,15,17,0.55)",
                    backdropFilter: "blur(6px)",
                    padding: "5px 10px",
                    borderRadius: 999,
                  }}
                >
                  99.2% pure
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== TRUST STRIP ===================== */}
      <section
        style={{
          borderTop: "1px solid var(--hairline-soft)",
          borderBottom: "1px solid var(--hairline-soft)",
          background: "var(--bg-band)",
        }}
      >
        <div
          className="container"
          style={{
            padding: "clamp(28px,4vw,40px) 20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 8,
          }}
        >
          {[
            { stat: "≥99%", label: "HPLC-verified purity", divider: true },
            { stat: "100%", label: "Third-party batch tested", divider: true },
            { stat: "Same-day", label: "US-based shipping", divider: true },
            { stat: "256-bit", label: "Encrypted checkout", divider: false },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "8px 18px",
                borderRight: item.divider ? "1px solid var(--hairline-soft)" : undefined,
              }}
            >
              <div style={{ fontSize: "clamp(24px,4vw,30px)", fontWeight: 600, letterSpacing: "-0.02em" }}>
                {item.stat}
              </div>
              <div style={{ marginTop: 5, fontSize: 13, color: "var(--text-dim)" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== FEATURED PRODUCTS ===================== */}
      <section className="container" style={sectionPad}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 34,
          }}
        >
          <div>
            <div className="eyebrow">Catalog</div>
            <h2 style={{ margin: "12px 0 0", fontSize: "clamp(26px,4.4vw,38px)", fontWeight: 600, letterSpacing: "-0.025em" }}>
              Most-ordered compounds
            </h2>
          </div>
          <Link
            href="/catalog"
            className="btn"
            style={{
              fontSize: 14,
              color: "#b9c0c6",
              border: "1px solid rgba(255,255,255,0.14)",
              padding: "11px 18px",
              fontWeight: 500,
            }}
          >
            View all →
          </Link>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {FEATURED.map((p) => (
            <ProductCard key={p.code} product={p} variant="featured" />
          ))}
        </div>
      </section>

      {/* ===================== QUALITY / COA ===================== */}
      <section id="quality" className="band">
        <div
          className="container"
          style={{
            padding: "clamp(56px,8vw,96px) 20px",
            display: "flex",
            flexWrap: "wrap",
            gap: "clamp(32px,5vw,64px)",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, minWidth: 300 }}>
            <div className="eyebrow">Verified quality</div>
            <h2
              style={{
                margin: "14px 0 0",
                fontSize: "clamp(26px,4.4vw,38px)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                lineHeight: 1.08,
              }}
            >
              Every batch is tested by an independent lab — and you can check the paperwork.
            </h2>
            <p style={{ margin: "18px 0 0", fontSize: 16, lineHeight: 1.6, color: "var(--text-muted)", maxWidth: 520 }}>
              We don&apos;t ask you to take our word for it. Each lot is sent to a third-party
              analytical lab for purity and identity testing. The certificate of analysis is matched
              to the batch number printed on your vial.
            </p>
            <div style={{ margin: "26px 0 0", display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["HPLC purity & mass-spec identity", "Quantified purity with confirmed molecular weight."],
                ["Endotoxin & sterility screening", "Lot-level results, posted before shipment."],
                ["Traceable by batch number", "Look up the exact COA that matches your vial."],
              ].map(([title, body]) => (
                <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ flex: "none", marginTop: 1, color: "var(--coral)" }}>✓</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{title}</div>
                    <div style={{ fontSize: 13.5, color: "var(--text-dim)" }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* certificate card */}
          <div style={{ flex: 1, minWidth: 290, maxWidth: 440 }}>
            <div
              style={{
                background: "var(--surface-panel)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 30px 60px -30px rgba(0,0,0,0.8)",
              }}
            >
              <div
                style={{
                  padding: "18px 20px",
                  borderBottom: "1px solid var(--hairline)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    className="font-mono"
                    style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}
                  >
                    Certificate of Analysis
                  </div>
                  <div style={{ marginTop: 4, fontSize: 15, fontWeight: 600 }}>Atlas Analytical Labs</div>
                </div>
                <span className="glass-badge">● PASS</span>
              </div>
              <div style={{ padding: "6px 20px" }}>
                {([
                  ["Compound", "BPC-157", false],
                  ["Batch / Lot", "CL-2406-A", false],
                  ["Purity (HPLC)", "99.2%", true],
                  ["Identity (MS)", "Confirmed", false],
                  ["Endotoxin", "<0.5 EU/mg", false],
                  ["Test date", "2026-06-12", false],
                ] as [string, string, boolean][]).map(([label, value, coral], i, arr) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "13px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "var(--text-dim)" }}>{label}</span>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 13,
                        color: coral ? "var(--coral)" : "#e6e9eb",
                        fontWeight: coral ? 500 : 400,
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="add-btn"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: 15,
                  borderRadius: 0,
                  border: "none",
                  borderTop: "1px solid var(--hairline)",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: "var(--coral)",
                }}
              >
                View full COA (PDF) →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== PROCESS ===================== */}
      <section className="container" style={sectionPad}>
        <div className="eyebrow">How it works</div>
        <h2 style={{ margin: "12px 0 36px", fontSize: "clamp(26px,4.4vw,38px)", fontWeight: 600, letterSpacing: "-0.025em" }}>
          From synthesis to your bench
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
          {[
            ["01", "Synthesized to spec", "Produced and lyophilized in controlled, ISO-grade facilities."],
            ["02", "Independently tested", "Every lot sent to a third-party lab for purity and identity."],
            ["03", "COA published", "Results posted per batch and matched to your vial's lot number."],
            ["04", "Shipped same day", "Cold-packed, tracked and discreetly packaged — from the USA."],
          ].map(([num, title, body]) => (
            <div
              key={num}
              style={{
                background: "var(--surface-panel)",
                border: "1px solid var(--hairline)",
                borderRadius: 14,
                padding: 22,
              }}
            >
              <div className="font-mono" style={{ fontSize: 13, color: "var(--coral)" }}>
                {num}
              </div>
              <div style={{ margin: "14px 0 7px", fontSize: 16, fontWeight: 600 }}>{title}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-muted)" }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== REVIEWS ===================== */}
      <section id="reviews" className="band">
        <div className="container" style={sectionPad}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 34,
            }}
          >
            <div>
              <div className="eyebrow">Reviews</div>
              <h2 style={{ margin: "12px 0 0", fontSize: "clamp(26px,4.4vw,38px)", fontWeight: 600, letterSpacing: "-0.025em" }}>
                Trusted by researchers
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "var(--coral)", fontSize: 16, letterSpacing: "2px" }}>★★★★★</span>
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}>4.9 / 5 · 1,200+ orders</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {[
              {
                quote:
                  "Purity matched the COA exactly — reconstituted clean, no cloudiness. Shipping was next-day.",
                initials: "MR",
                name: "M. Reyes",
              },
              {
                quote:
                  "Documentation is the best I've seen. Batch numbers line up with the certificates every single time.",
                initials: "AL",
                name: "Dr. A. Lin",
              },
              {
                quote:
                  "Discreet packaging and fast US delivery. This is now my default supplier for lab work.",
                initials: "JO",
                name: "J. Okafor",
              },
            ].map((r) => (
              <div
                key={r.name}
                style={{
                  background: "var(--surface-panel)",
                  border: "1px solid var(--hairline)",
                  borderRadius: 14,
                  padding: 24,
                }}
              >
                <div style={{ color: "var(--coral)", letterSpacing: "2px", marginBottom: 14 }}>★★★★★</div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#dfe3e5" }}>&ldquo;{r.quote}&rdquo;</p>
                <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "#22272b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                    }}
                  >
                    {r.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: "var(--coral)" }}>
                      Verified buyer
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SECURE CHECKOUT ===================== */}
      <section className="container" style={{ padding: "clamp(48px,7vw,80px) 20px" }}>
        <div
          style={{
            background: "linear-gradient(180deg, #15181b, #0f1214)",
            border: "1px solid var(--hairline)",
            borderRadius: 18,
            padding: "clamp(28px,4vw,44px)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 28,
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec8a5e" strokeWidth="1.6">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <span className="eyebrow">Secure checkout</span>
            </div>
            <h2 style={{ margin: 0, fontSize: "clamp(22px,3.4vw,30px)", fontWeight: 600, letterSpacing: "-0.02em" }}>
              Encrypted, discreet, and easy to order
            </h2>
            <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)", maxWidth: 480 }}>
              256-bit SSL, PCI-compliant payments, and a neutral billing descriptor. Your order ships
              in unmarked, tracked packaging.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {["VISA", "MASTERCARD", "AMEX", "DISCOVER"].map((c) => (
              <span key={c} className="glass-chip">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section
        id="faq"
        style={{ maxWidth: 820, margin: "0 auto", padding: "clamp(40px,6vw,72px) 20px clamp(56px,8vw,96px)" }}
      >
        <div className="eyebrow">FAQ</div>
        <h2 style={{ margin: "12px 0 30px", fontSize: "clamp(26px,4.4vw,36px)", fontWeight: 600, letterSpacing: "-0.025em" }}>
          Common questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            [
              "Are these products for human use?",
              "No. All Covalent Labs products are sold strictly for laboratory and research use only — not for human or veterinary consumption.",
            ],
            [
              "Do you provide a certificate of analysis?",
              "Yes. Every batch ships with a third-party COA that you can verify against the lot number printed on your vial.",
            ],
            [
              "Where do you ship from, and how fast?",
              "All orders ship the same day from our US facility, cold-packed, tracked and discreetly packaged.",
            ],
            [
              "What payment methods do you accept?",
              "All major credit cards through a 256-bit encrypted, PCI-compliant checkout with a discreet billing descriptor.",
            ],
          ].map(([q, a], i, arr) => (
            <div
              key={q}
              style={{
                padding: "22px 0",
                borderTop: "1px solid var(--hairline)",
                borderBottom: i === arr.length - 1 ? "1px solid var(--hairline)" : undefined,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{q}</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--text-muted)" }}>{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section style={{ position: "relative", overflow: "hidden", borderTop: "1px solid var(--hairline-soft)", background: "var(--bg-band)" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              inset: "-40%",
              background:
                "radial-gradient(34% 70% at 10% 50%, rgba(236,138,94,0.22), transparent 60%), radial-gradient(36% 80% at 92% 50%, rgba(151,118,236,0.24), transparent 60%), radial-gradient(40% 90% at 55% 120%, rgba(236,150,104,0.2), transparent 60%)",
            }}
          />
        </div>
        <div className="container" style={{ position: "relative", padding: "clamp(48px,7vw,80px) 20px", textAlign: "center" }}>
          <h2
            style={{
              margin: "0 auto",
              maxWidth: 600,
              fontSize: "clamp(26px,4.6vw,40px)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
            }}
          >
            Reliable peptides, backed by paperwork you can verify.
          </h2>
          <p style={{ margin: "16px auto 0", maxWidth: 480, fontSize: 16, color: "var(--text-muted)" }}>
            ≥99% purity, third-party tested, shipped same day from the USA.
          </p>
          <Link
            href="/catalog"
            className="btn btn-gradient"
            style={{ marginTop: 28, fontSize: 15, padding: "15px 30px" }}
          >
            Browse the catalog →
          </Link>
        </div>
      </section>
    </main>
  );
}
