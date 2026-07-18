import type { Metadata } from "next";
import Link from "next/link";
import { jsonLdScript, breadcrumbJsonLd, faqJsonLd, SITE } from "@/lib/research/seo";
import { ReconstitutionCalculator } from "./calculator";

const TITLE = "Peptide Reconstitution Calculator | Kairo Labs";
const DESCRIPTION =
  "Free peptide reconstitution calculator for the lab: enter vial mg, bacteriostatic water volume, and target amount to get the concentration, the exact volume to draw, and the units on a U-100 syringe. For research use only.";
const CANONICAL = "/tools/reconstitution-calculator";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE}${CANONICAL}`,
    type: "website",
    siteName: "Kairo Labs",
  },
};

// Q&A pairs surface as an on-page FAQ AND as FAQPage structured data — the
// questions mirror how researchers phrase the search ("how much bacteriostatic
// water", "how many units"). RUO-framed throughout.
const FAQS = [
  {
    q: "How do you calculate peptide reconstitution?",
    a: "Divide the peptide mass in the vial by the volume of solvent added to get the stock concentration. For example, 10 mg of peptide in 2 mL of bacteriostatic water gives 5 mg/mL (5,000 mcg/mL). To find the volume to withdraw for a target amount, divide the target amount by that concentration: a 250 mcg target from a 5,000 mcg/mL stock needs 0.05 mL, which is 5 units on a U-100 insulin syringe.",
  },
  {
    q: "How much bacteriostatic water should I use to reconstitute a peptide?",
    a: "The solvent volume is a choice, not a fixed rule — more water gives a more dilute stock and a larger, easier-to-measure draw volume; less water gives a concentrated stock and a smaller draw. Common laboratory practice is 1–3 mL per vial. Enter your chosen volume in the calculator to see the resulting concentration and draw size, then adjust until the draw lands on a convenient syringe graduation.",
  },
  {
    q: "How many units on an insulin syringe is my target amount?",
    a: "A U-100 insulin syringe is graduated so that 100 units equals 1 mL. Multiply the volume to withdraw (in mL) by 100 to get units. The calculator does this automatically and shows both the volume in mL and the equivalent U-100 units for the amount you enter.",
  },
  {
    q: "What is the difference between mg and mcg here?",
    a: "1 milligram (mg) equals 1,000 micrograms (mcg). Peptide vials are usually labelled in mg (e.g. 5 mg, 10 mg), while target amounts are often expressed in mcg. The calculator accepts either unit for the target amount and converts internally.",
  },
  {
    q: "Does the calculator account for the powder's volume?",
    a: "No — like standard reconstitution math, it assumes the lyophilized powder adds negligible volume, so the final solution volume equals the solvent volume added. For milligram-scale peptides this approximation is well within measurement tolerance.",
  },
  {
    q: "Is this calculator for human dosing?",
    a: "No. This tool performs laboratory reconstitution math for research reference materials intended for in-vitro use only. It is not medical guidance and does not describe or authorize any human or animal use.",
  },
];

const HOW_TO_JSONLD = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to calculate peptide reconstitution",
  description:
    "Calculate the concentration and withdrawal volume for a reconstituted research peptide.",
  step: [
    {
      "@type": "HowToStep",
      name: "Find the concentration",
      text: "Divide the peptide mass in the vial (mg) by the volume of solvent added (mL) to get the stock concentration in mg/mL.",
    },
    {
      "@type": "HowToStep",
      name: "Find the volume to draw",
      text: "Divide your target amount by the concentration to get the volume to withdraw in mL.",
    },
    {
      "@type": "HowToStep",
      name: "Convert to syringe units",
      text: "Multiply the withdrawal volume in mL by 100 to get the graduation on a U-100 insulin syringe.",
    },
  ],
};

const WEBAPP_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Peptide Reconstitution Calculator",
  url: `${SITE}${CANONICAL}`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  description: DESCRIPTION,
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: { "@type": "Organization", name: "Kairo Labs", url: SITE },
};

export default function ReconstitutionCalculatorPage() {
  return (
    <main className="container" style={{ padding: "clamp(28px,5vw,52px) 24px clamp(56px,8vw,96px)" }}>
      <script {...jsonLdScript(WEBAPP_JSONLD)} />
      <script {...jsonLdScript(HOW_TO_JSONLD)} />
      <script {...jsonLdScript(faqJsonLd(FAQS.map((f) => ({ q: f.q, a: f.a }))))} />
      <script
        {...jsonLdScript(
          breadcrumbJsonLd([
            { name: "Home", url: `${SITE}/` },
            { name: "Tools", url: `${SITE}/tools/reconstitution-calculator` },
            { name: "Reconstitution Calculator", url: `${SITE}${CANONICAL}` },
          ]),
        )}
      />

      <nav className="rh-crumbs" aria-label="Breadcrumb">
        <Link href="/research">Research</Link>
        <span aria-hidden>/</span>
        <span className="rh-crumbs-cur">Reconstitution calculator</span>
      </nav>

      <div className="rh-ruo rh-ruo-top">For research use only. Not for human or animal consumption.</div>

      <header className="rh-head">
        <div className="eyebrow">Free lab tool</div>
        <h1 className="rh-h1">Peptide Reconstitution Calculator</h1>
        <p className="rh-intro">
          Enter the peptide mass in the vial, the volume of bacteriostatic water you&apos;re adding, and the
          amount you want to withdraw. The calculator returns the stock concentration, the exact volume to
          draw, and the equivalent graduation on a U-100 insulin syringe — the standard math for
          reconstituting a lyophilized research reference material.
        </p>
      </header>

      <ReconstitutionCalculator />

      <div className="rh-layout" style={{ marginTop: "clamp(36px,5vw,56px)" }}>
        <article className="rh-prose">
          <section className="rh-sec">
            <h2 className="rh-h2">How the calculation works</h2>
            <p>
              Reconstitution math is two divisions. First, the <strong>stock concentration</strong> is the
              peptide mass in the vial divided by the volume of solvent added — 10&nbsp;mg of peptide in
              2&nbsp;mL of solvent is a 5&nbsp;mg/mL (5,000&nbsp;mcg/mL) stock. Second, the{" "}
              <strong>volume to withdraw</strong> for a target amount is that amount divided by the
              concentration: a 250&nbsp;mcg target from a 5,000&nbsp;mcg/mL stock is 0.05&nbsp;mL.
            </p>
            <p>
              Because a U-100 insulin syringe is graduated at 100 units per millilitre, multiplying the
              withdrawal volume by 100 converts it to units — 0.05&nbsp;mL is 5&nbsp;units. The calculation
              assumes the lyophilized powder contributes negligible volume, so the final solution volume equals
              the solvent volume you add.
            </p>
            <ul className="rh-list">
              <li>Concentration (mg/mL) = peptide mass (mg) ÷ solvent volume (mL)</li>
              <li>Draw volume (mL) = target amount ÷ concentration</li>
              <li>U-100 units = draw volume (mL) × 100</li>
            </ul>
          </section>

          <section className="rh-sec">
            <h2 className="rh-h2">Choosing your reconstitution volume</h2>
            <p>
              The volume of solvent is a deliberate choice. A larger volume produces a more dilute stock and a
              larger, easier-to-measure withdrawal; a smaller volume produces a concentrated stock and a
              smaller draw. Neither is inherently correct — the goal is a draw volume that lands on a clean
              syringe graduation and a total that a vial can supply across the number of withdrawals you plan.
              Adjust the solvent volume in the calculator and watch the draw size and draws-per-vial update.
            </p>
            <p>
              The choice of solvent matters as much as the volume. Bacteriostatic water — sterile water with
              0.9% benzyl alcohol — is the usual choice when one vial will be sampled repeatedly, because the
              preservative suppresses microbial growth across multiple withdrawals. See the companion guides on{" "}
              <Link href="/research/handling/bacteriostatic-water">bacteriostatic water</Link> and{" "}
              <Link href="/research/handling/reconstitution">peptide reconstitution</Link> for the full method.
            </p>
          </section>
        </article>

        <aside className="rh-aside">
          <div className="rh-cta">
            <div className="rh-cta-h">Verified to the lot</div>
            <p className="rh-cta-sub">
              Every Kairo Labs peptide ships as lyophilized powder, third-party lab-tested with a COA
              verifiable by lot number.
            </p>
            <div className="rh-cta-links">
              <Link href="/catalog" className="btn btn-emerald" style={{ fontSize: 14, padding: "11px 18px", width: "100%" }}>
                Browse the catalog
              </Link>
            </div>
            <Link href="/research/verification/certificate-of-analysis" className="rh-cta-coa">
              How to verify a COA →
            </Link>
          </div>
        </aside>
      </div>

      <section className="rh-faq">
        <div className="eyebrow" style={{ marginBottom: 18 }}>Frequently asked</div>
        <div className="rh-faq-list">
          {FAQS.map((f, i) => (
            <div className="rh-faq-item" key={i}>
              <div className="rh-faq-q">{f.q}</div>
              <p className="rh-faq-a">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <nav className="rh-cross" aria-label="Related research">
        <span className="rh-cross-label">Keep reading</span>
        <Link href="/research/handling/reconstitution" className="rh-cross-link">
          Peptide reconstitution for laboratory research
        </Link>
        <Link href="/research/handling/bacteriostatic-water" className="rh-cross-link">
          Bacteriostatic water for peptides
        </Link>
        <Link href="/research/handling/storage" className="rh-cross-link">
          Peptide storage &amp; handling
        </Link>
      </nav>

      <div className="rh-ruo rh-ruo-full">
        <strong>Research Use Only.</strong> This calculator performs laboratory reconstitution arithmetic for
        research reference materials. It is educational, not medical advice, and does not describe, recommend,
        or authorize any human or animal use. All Kairo Labs materials are for in-vitro and laboratory research
        only, and are not for human or animal consumption.
      </div>
    </main>
  );
}
