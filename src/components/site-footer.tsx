import Link from "next/link";

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href?: string }[];
}) {
  return (
    <div>
      <div
        className="font-mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-faint)",
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {links.map((l) =>
          l.href ? (
            <Link key={l.label} href={l.href} className="footer-link">
              {l.label}
            </Link>
          ) : (
            <span key={l.label} style={{ fontSize: 13.5, color: "#b9c0c6" }}>
              {l.label}
            </span>
          )
        )}
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--hairline)",
        background: "var(--bg-band)",
      }}
    >
      <div
        className="container"
        style={{
          paddingTop: "clamp(40px, 6vw, 64px)",
          paddingBottom: 32,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 32,
        }}
      >
        <div style={{ gridColumn: "1 / -1", maxWidth: 300 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className="font-mono"
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: "var(--grad-logo)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 14,
                color: "#06181b",
              }}
            >
              C
            </span>
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              Covalent
              <span style={{ color: "var(--text-faint)", fontWeight: 400 }}> Labs</span>
            </span>
          </div>
          <p style={{ margin: "14px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "var(--text-dim)" }}>
            Independently tested research peptides, shipped same day from the USA.
          </p>
        </div>

        <FooterCol
          title="Products"
          links={[
            { label: "Catalog", href: "/catalog" },
            { label: "Best sellers", href: "/catalog" },
            { label: "New arrivals", href: "/catalog" },
            { label: "Certificates", href: "/#quality" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { label: "About" },
            { label: "Quality standards", href: "/#quality" },
            { label: "Lab partners" },
            { label: "Contact" },
          ]}
        />
        <FooterCol
          title="Support"
          links={[
            { label: "Shipping" },
            { label: "Returns" },
            { label: "FAQ", href: "/#faq" },
            { label: "Track order" },
          ]}
        />
      </div>

      <div
        className="container"
        style={{ paddingTop: 24, paddingBottom: 40, borderTop: "1px solid var(--hairline-soft)" }}
      >
        <p style={{ margin: "0 0 14px", fontSize: 11.5, lineHeight: 1.7, color: "#5a636a", maxWidth: 880 }}>
          Covalent Labs products are intended for laboratory and research use only. They are not
          drugs, foods, cosmetics, or dietary supplements, and are not intended to diagnose, treat,
          cure, or prevent any disease. Not for human or veterinary use. By purchasing, you confirm
          that you are a qualified researcher and agree to handle and dispose of all materials in
          accordance with applicable laws and regulations.
        </p>
        <div style={{ fontSize: 12, color: "#5a636a" }}>
          © 2026 Covalent Labs. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
