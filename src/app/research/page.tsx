import type { Metadata } from "next";
import Link from "next/link";
import {
  RESEARCH_SECTIONS,
  SECTION_META,
  articlesBySection,
  allArticles,
} from "@/lib/research/articles";
import { collectionPageJsonLd, breadcrumbJsonLd, jsonLdScript, ORGANIZATION, SITE } from "@/lib/research/seo";

export const dynamic = "error";

const TITLE = "Research Education Hub — Peptide Mechanisms, Handling & Verification | Kairo Labs";
const DESC =
  "The technical reference for researchers: mechanism of action, reconstitution and stability, and how to read a Certificate of Analysis — where every claim about a compound is verifiable to the lot. Research use only.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/research" },
  openGraph: { title: TITLE, description: DESC, url: `${SITE}/research`, siteName: "Kairo Labs" },
};

export default function ResearchHubPage() {
  const canonical = `${SITE}/research`;
  const featured = allArticles().slice(0, 6);

  return (
    <main>
      <script
        {...jsonLdScript({
          "@context": "https://schema.org",
          "@graph": [
            collectionPageJsonLd({
              name: "Kairo Labs Research Education Hub",
              url: canonical,
              description: DESC,
              items: RESEARCH_SECTIONS.map((s) => ({ name: SECTION_META[s].label, url: `${SITE}/research/${s}` })),
            }),
            ORGANIZATION,
            breadcrumbJsonLd([{ name: "Research", url: canonical }]),
          ],
        })}
      />

      <section className="container" style={{ padding: "clamp(40px,7vw,88px) 24px clamp(28px,4vw,44px)" }}>
        <div className="eyebrow" style={{ marginBottom: 18 }}>Research education hub</div>
        <h1 className="h-hero" style={{ fontSize: "clamp(34px,6vw,64px)", maxWidth: "16ch" }}>
          The technical reference,<br />
          <span className="g">verified to the lot.</span>
        </h1>
        <p className="rh-intro" style={{ marginTop: 22, maxWidth: "60ch" }}>
          Mechanism of action, reconstitution and stability, and how to read a Certificate of Analysis. Rigorous,
          research-use-only explainers — where every claim about a compound is one you can verify by lot number.
        </p>
      </section>

      <section className="container" style={{ padding: "0 24px clamp(32px,5vw,56px)" }}>
        <div className="rh-grid">
          {RESEARCH_SECTIONS.map((s) => {
            const count = articlesBySection(s).length;
            return (
              <Link key={s} href={`/research/${s}`} className="cat-card">
                <div className="cat-icon" aria-hidden>
                  <SectionGlyph section={s} />
                </div>
                <div className="rh-card-h">{SECTION_META[s].label}</div>
                <p className="rh-card-sub">{SECTION_META[s].blurb}</p>
                <div className="rh-card-count">{count} {count === 1 ? "article" : "articles"}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="band">
          <div className="container" style={{ padding: "clamp(40px,6vw,72px) 24px" }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>Start here</div>
            <div className="rh-grid">
              {featured.map((a) => (
                <Link key={`${a.section}/${a.slug}`} href={`/research/${a.section}/${a.slug}`} className="cat-card">
                  <div className="eyebrow" style={{ fontSize: 10 }}>{SECTION_META[a.section].label}</div>
                  <div className="rh-card-h">{a.h1}</div>
                  <p className="rh-card-sub">{a.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container" style={{ padding: "clamp(32px,5vw,56px) 24px clamp(56px,8vw,96px)" }}>
        <div className="rh-ruo rh-ruo-full">
          <strong>Research Use Only.</strong> All products and information referenced by Kairo Labs are intended strictly for
          laboratory research and educational purposes. They are not for human or animal consumption, and not for diagnostic,
          therapeutic, or clinical use.
        </div>
      </section>
    </main>
  );
}

function SectionGlyph({ section }: { section: string }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (section === "compounds") return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>;
  if (section === "handling") return <svg {...common}><path d="M9 2h6M10 2v6l-4 9a2 2 0 0 0 2 3h8a2 2 0 0 0 2-3l-4-9V2" /></svg>;
  if (section === "verification") return <svg {...common}><path d="M9 12l2 2 4-4" /><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg>;
  return <svg {...common}><path d="M4 7h7M4 12h7M4 17h7M17 5v14M14 8l3-3 3 3" /></svg>;
}
