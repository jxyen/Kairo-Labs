import type { Metadata } from "next";
import Link from "next/link";
import { jsonLdScript, breadcrumbJsonLd, faqJsonLd, SITE } from "@/lib/research/seo";
import { ledgerRows, LEDGER_LAB } from "@/lib/batches";
import { BatchLookup } from "./batch-lookup";

const TITLE = "Batch Test Ledger — Third-Party Lab Tested Peptides | Kairo Labs";
const DESCRIPTION =
  "Every Kairo Labs peptide lot is assayed by an independent lab (HPLC-MS) and its Certificate of Analysis published here, verifiable by lot number. For research use only.";
const CANONICAL = "/verify";

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

const FAQS = [
  {
    q: "Are Kairo Labs peptides third-party lab tested?",
    a: `Yes — production lots are submitted to an accredited independent laboratory (${LEDGER_LAB}) for analysis, and each report is published on this page, indexed by lot number. Third-party testing means the lab has no stake in the outcome: it measures the material and reports what it finds.`,
  },
  {
    q: "What does the Certificate of Analysis (COA) measure?",
    a: "A COA is a lot-specific analytical summary. For a peptide reference material it typically reports purity by HPLC (the percentage of the main peak) and identity by mass spectrometry (confirming the measured mass matches the expected molecular weight), along with the lot number, test date, and the method used. Because it is lot-specific, each production run carries its own document.",
  },
  {
    q: "How do I verify the lot I received?",
    a: "Enter the lot number printed on your vial into the verify box above. If that lot has a published COA it appears with the lab, purity, method, and a link to the report PDF — plus, where the lab offers it, an independent verification link so you can confirm the document directly with the lab rather than taking our word for it.",
  },
  {
    q: "Why does each batch need its own test?",
    a: "A COA from one lot does not certify a different lot of the same product — purity and identity are properties of a specific production run. Per-batch testing is the honest standard: it ties a measured result to the exact material you have, not to a marketing claim about the product line in general.",
  },
  {
    q: "Is this for human use?",
    a: "No. All Kairo Labs materials are research reference materials for in-vitro and laboratory research use only. Nothing on this page describes, recommends, or authorizes any human or animal use, and purity data is analytical information, not a safety or efficacy claim.",
  },
];

export default function VerifyPage() {
  const rows = ledgerRows();
  const hasRows = rows.length > 0;

  return (
    <main className="container" style={{ padding: "clamp(28px,5vw,52px) 24px clamp(56px,8vw,96px)" }}>
      <script {...jsonLdScript(faqJsonLd(FAQS.map((f) => ({ q: f.q, a: f.a }))))} />
      <script
        {...jsonLdScript(
          breadcrumbJsonLd([
            { name: "Home", url: `${SITE}/` },
            { name: "Batch Test Ledger", url: `${SITE}${CANONICAL}` },
          ]),
        )}
      />

      <nav className="rh-crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden>/</span>
        <span className="rh-crumbs-cur">Batch Test Ledger</span>
      </nav>

      <div className="rh-ruo rh-ruo-top">For research use only. Not for human or animal consumption.</div>

      <header className="rh-head">
        <div className="eyebrow">Independent lab testing</div>
        <h1 className="rh-h1">Batch Test Ledger</h1>
        <p className="rh-intro">
          Purity you can check for yourself. Every Kairo Labs production lot is assayed by an
          independent laboratory ({LEDGER_LAB}) and its Certificate of Analysis is published here,
          verifiable by the lot number on your vial — no login, no request, just the report.
        </p>
      </header>

      <BatchLookup />

      <section className="bt-ledger" aria-label="Published batch tests">
        <div className="bt-ledger-head">
          <h2 className="rh-h2" style={{ margin: 0 }}>Published lots</h2>
          {hasRows && (
            <span className="bt-ledger-count">{rows.length} report{rows.length === 1 ? "" : "s"}</span>
          )}
        </div>

        {hasRows ? (
          <div className="bt-table-wrap">
            <table className="bt-table">
              <thead>
                <tr>
                  <th scope="col">Lot</th>
                  <th scope="col">Product</th>
                  <th scope="col">Purity</th>
                  <th scope="col">Method</th>
                  <th scope="col">Lab</th>
                  <th scope="col">Date</th>
                  <th scope="col">COA</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.lot}>
                    <td className="bt-td-lot">{b.lot}</td>
                    <td>
                      {b.productSlug ? (
                        <Link href={`/product/${b.productSlug}`}>{b.productName}</Link>
                      ) : (
                        b.productName
                      )}
                    </td>
                    <td className="bt-td-purity">{b.assayPurity}</td>
                    <td>{b.method}</td>
                    <td>{b.lab}</td>
                    <td>{b.testDate}</td>
                    <td>
                      <a href={b.coaUrl} target="_blank" rel="noopener noreferrer">PDF</a>
                      {b.verifyUrl && (
                        <>
                          {" · "}
                          <a href={b.verifyUrl} target="_blank" rel="noopener noreferrer">verify</a>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bt-empty">
            <p className="bt-empty-lead">Our independent batch-testing program is rolling out.</p>
            <p>
              Every production lot is being submitted to {LEDGER_LAB} for HPLC-MS purity and identity
              analysis, and each Certificate of Analysis will be published here the moment it is issued —
              tied to the lot number on the vial so you can confirm it independently. This page is the
              permanent home for those reports as lots come online.
            </p>
            <p>
              In the meantime, read how to{" "}
              <Link href="/research/verification/certificate-of-analysis">read a peptide COA</Link> and why{" "}
              <Link href="/research/verification/third-party-testing">independent third-party testing</Link>{" "}
              is the signal that actually matters.
            </p>
          </div>
        )}
      </section>

      <div className="rh-layout" style={{ marginTop: "clamp(36px,5vw,56px)" }}>
        <article className="rh-prose">
          <section className="rh-sec">
            <h2 className="rh-h2">How our testing works</h2>
            <p>
              A production lot is a defined quantity of material made in a single run. Before it ships, a
              sample is sent to an independent analytical lab that measures two things that matter most for a
              peptide reference material: <strong>purity</strong>, by high-performance liquid chromatography
              (HPLC), and <strong>identity</strong>, by mass spectrometry, which confirms the measured mass
              matches the compound&apos;s expected molecular weight.
            </p>
            <p>
              The lab returns a Certificate of Analysis — a lot-specific document with the result, the method,
              and a report number. We publish that report here against its lot number, unedited. Where the lab
              provides public verification, the ledger links straight to it, so the proof doesn&apos;t depend on
              us hosting a PDF.
            </p>
            <ul className="rh-list">
              <li>One report per production lot — a COA never carries over to a different run.</li>
              <li>Purity figures are transcribed verbatim from the lab report.</li>
              <li>Reports link out to the lab&apos;s own verification wherever it is offered.</li>
            </ul>
          </section>

          <section className="rh-sec">
            <h2 className="rh-h2">Why per-lot, third-party proof</h2>
            <p>
              Anyone can print &ldquo;99% pure&rdquo; on a page. What&apos;s harder to fake — and what a careful
              researcher looks for — is a report from a lab with no stake in the result, tied to the specific
              lot in hand, and confirmable at the source. That is the entire point of this ledger: not a
              marketing number about the product line, but a checkable measurement of the exact material you
              received. See the guides on{" "}
              <Link href="/research/verification/certificate-of-analysis">reading a COA</Link> and{" "}
              <Link href="/research/verification/third-party-testing">third-party testing</Link> for the full
              picture.
            </p>
          </section>
        </article>

        <aside className="rh-aside">
          <div className="rh-cta">
            <div className="rh-cta-h">Every vial, to the lot</div>
            <p className="rh-cta-sub">
              Kairo Labs peptides ship as lyophilized powder with a lot number that maps to a published,
              third-party COA.
            </p>
            <div className="rh-cta-links">
              <Link href="/catalog" className="btn btn-emerald" style={{ fontSize: 14, padding: "11px 18px", width: "100%" }}>
                Browse the catalog
              </Link>
            </div>
            <Link href="/research/verification/certificate-of-analysis" className="rh-cta-coa">
              How to read a COA &rarr;
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
        <Link href="/research/verification/certificate-of-analysis" className="rh-cross-link">
          How to read a peptide Certificate of Analysis
        </Link>
        <Link href="/research/verification/third-party-testing" className="rh-cross-link">
          Third-party testing for research peptides
        </Link>
        <Link href="/tools/reconstitution-calculator" className="rh-cross-link">
          Peptide reconstitution calculator
        </Link>
      </nav>

      <div className="rh-ruo rh-ruo-full">
        <strong>Research Use Only.</strong> The analytical results published on this page describe research
        reference materials intended for in-vitro and laboratory research use only. Purity and identity data
        are analytical measurements, not safety or efficacy claims, and nothing here describes, recommends, or
        authorizes any human or animal use. All Kairo Labs materials are not for human or animal consumption.
      </div>
    </main>
  );
}
