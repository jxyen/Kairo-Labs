import Link from "next/link";

/**
 * Kairo Labs hero — clean white editorial. Big two-tone uppercase headline,
 * trust chips and CTAs, centered. The featured emerald product card sits in a
 * full-width section directly below (see page.tsx).
 */
export function Hero() {
  return (
    <section className="k-hero">
      <style>{`
        .k-hero { position: relative; overflow: hidden; background: var(--paper); }
        .k-hero::before {
          content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(60% 50% at 78% -8%, rgba(24,184,131,0.12), transparent 62%),
            radial-gradient(50% 44% at 16% 8%, rgba(24,184,131,0.07), transparent 64%);
        }
        .k-hero-inner {
          position: relative; z-index: 1; text-align: center;
          max-width: 880px; margin: 0 auto;
          padding: clamp(56px, 9vw, 110px) 0 clamp(40px, 6vw, 72px);
        }
        .k-hero-inner > * { max-width: 100%; }
        .k-sub { margin-left: auto; margin-right: auto; }
        .k-eyebrow { display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 11.5px; letter-spacing: .16em; text-transform: uppercase;
          color: var(--emerald); flex-wrap: wrap; justify-content: center; max-width: 100%; }
        .k-eyebrow .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--emerald); box-shadow: 0 0 10px var(--emerald); }
        .k-h1 {
          font-family: var(--font-display); font-weight: 800; text-transform: uppercase;
          letter-spacing: -0.025em; line-height: 0.96; margin: 20px 0 0;
          font-size: clamp(27px, 7.1vw, 76px); color: var(--ink);
          overflow-wrap: break-word; max-width: 100%;
        }
        .k-h1 .g { color: var(--forest); }
        .k-sub { margin: 24px auto 0; font-size: clamp(15px, 2.1vw, 19px); line-height: 1.6; color: var(--ink-muted); max-width: 560px; }
        .k-cta { margin: 32px 0 0; display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
        .k-chips { margin: 30px 0 0; display: flex; flex-wrap: wrap; gap: 9px 10px; justify-content: center; }
        .k-note { margin: 26px 0 0; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .14em;
          text-transform: uppercase; color: var(--ink-ghost); }
        @media (max-width: 620px) {
          .k-cta .btn { flex: 1 1 100%; }
          .k-eyebrow { font-size: 10.5px; letter-spacing: .1em; }
        }
        @media (max-width: 440px) {
          .k-h1 { font-size: 22px; letter-spacing: -0.03em; line-height: 1.02; }
        }
      `}</style>

      <div className="container k-hero-inner">
        <span className="k-eyebrow"><span className="dot" /> Shipped from the USA · Same-day dispatch</span>
        <h1 className="k-h1">
          Reach your <span className="g">peak.</span><br />
          Research peptides, verified to the lot.
        </h1>
        <p className="k-sub">
          Independently lab-tested to ≥99% purity with a certificate of analysis you can verify by
          lot number — dispatched same-day in discreet, tracked packaging.
        </p>
        <div className="k-cta">
          <Link href="/catalog" className="btn btn-emerald" style={{ fontSize: 15, padding: "15px 28px" }}>
            Shop the catalog →
          </Link>
          <Link href="/#quality" className="btn btn-ghost" style={{ fontSize: 15, padding: "15px 24px" }}>
            View certificates
          </Link>
        </div>
        <div className="k-chips font-mono">
          {["Ships from the USA", "Same-day dispatch", "≥99% lab-tested", "Discreet packaging"].map((t) => (
            <span key={t} className="chip"><b>✓</b> {t}</span>
          ))}
        </div>
        <p className="k-note">For laboratory &amp; research use only · Not for human consumption</p>
      </div>
    </section>
  );
}
