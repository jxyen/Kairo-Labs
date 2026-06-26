import Link from "next/link";

function FooterCol({ title, links }: { title: string; links: { label: string; href?: string }[] }) {
  return (
    <div>
      <div className="font-mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-ghost)", marginBottom: 14 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {links.map((l) =>
          l.href ? (
            <Link key={l.label} href={l.href} className="footer-link">{l.label}</Link>
          ) : (
            <span key={l.label} style={{ fontSize: 13.5, color: "var(--ink-muted)" }}>{l.label}</span>
          )
        )}
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--hair)", background: "var(--paper-2)" }}>
      {/* Prominent research-use disclaimer banner */}
      <div className="container" style={{ paddingTop: "clamp(32px, 5vw, 48px)" }}>
        <div style={{ border: "1px solid var(--hair)", borderRadius: "var(--r-lg)", background: "var(--surface-card)", padding: "20px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--ink)" }}>
            For research and laboratory use only. Not for human or animal consumption.
          </div>
          <div style={{ marginTop: 7, fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-faint)", maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
            Products are not drugs, foods, cosmetics, or dietary supplements and are not intended to diagnose, cure,
            mitigate, treat, or prevent any disease.
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "clamp(36px, 5vw, 56px)", paddingBottom: 32, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 32 }}>
        <div style={{ gridColumn: "1 / -1", maxWidth: 320 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kairo-mark-new.png" alt="" aria-hidden="true" style={{ height: 28, width: "auto", display: "block" }} />
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
              Kairo<span style={{ color: "var(--ink-faint)", fontWeight: 500 }}> Labs</span>
            </span>
          </div>
          <p style={{ margin: "14px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-faint)" }}>
            A research supply company. We provide research-grade peptides to qualified researchers and laboratories —
            independently lab-tested to verified purity and shipped same day from the USA in plain, tracked packaging.
            For laboratory research use only.
          </p>
          <div style={{ margin: "14px 0 0", fontSize: 12.5, lineHeight: 1.7, color: "var(--ink-ghost)" }}>
            {/* TODO: replace with real registered entity + address + phone before launch */}
            Kairo Labs · Research Supply Co.<br />
            [Registered address — to be added]<br />
            <a href="mailto:support@kairolabs.co" className="footer-link">support@kairolabs.co</a>
          </div>
        </div>

        <FooterCol title="Products" links={[
          { label: "All peptides", href: "/catalog" },
          { label: "Recovery & Repair", href: "/catalog?cat=Recovery%20%26%20Repair" },
          { label: "Metabolic & Weight", href: "/catalog?cat=Metabolic%20%26%20Weight" },
          { label: "Growth Hormone", href: "/catalog?cat=Growth%20Hormone" },
          { label: "Best sellers", href: "/#bestsellers" },
          { label: "Certificates (COA)", href: "/#quality" },
        ]} />
        <FooterCol title="Policies" links={[
          { label: "Terms & Conditions" },
          { label: "Privacy Policy" },
          { label: "Shipping Policy" },
          { label: "Refund Policy" },
          { label: "FAQ", href: "/#faq" },
        ]} />
        <div>
          <div className="font-mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-ghost)", marginBottom: 14 }}>
            Eligibility
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--ink-muted)" }}>
            Sales are restricted to purchasers age 21 or older acting on behalf of a qualified laboratory, institution,
            or business entity engaged in lawful research. All orders are subject to verification and screening.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24, paddingBottom: 40, borderTop: "1px solid var(--hair-soft)" }}>
        <p style={{ margin: "0 0 14px", fontSize: 11.5, lineHeight: 1.7, color: "var(--ink-ghost)", maxWidth: 880 }}>
          All materials supplied by Kairo Labs are intended solely for lawful laboratory and research use by qualified
          professionals. They are not drugs, foods, cosmetics, or dietary supplements, and are not intended to diagnose,
          treat, cure, mitigate, or prevent any disease. Not for human or veterinary use. By purchasing, you confirm that
          you are a qualified researcher acting on behalf of an eligible entity and agree to handle, store, and dispose of
          all materials in accordance with applicable laws and regulations.
        </p>
        <div style={{ fontSize: 12, color: "var(--ink-ghost)" }}>© 2026 Kairo Labs. All rights reserved. Research use only.</div>
      </div>
    </footer>
  );
}
