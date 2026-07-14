import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  RESEARCH_SECTIONS,
  SECTION_META,
  articlesBySection,
  type ResearchSection,
} from "@/lib/research/articles";
import { collectionPageJsonLd, breadcrumbJsonLd, jsonLdScript, SITE } from "@/lib/research/seo";

export function generateStaticParams() {
  return RESEARCH_SECTIONS.map((section) => ({ section }));
}

function isSection(s: string): s is ResearchSection {
  return (RESEARCH_SECTIONS as string[]).includes(s);
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  if (!isSection(section)) return { title: "Not found — Kairo Labs Research" };
  const meta = SECTION_META[section];
  const title = `${meta.label} — Research Hub | Kairo Labs`;
  return {
    title,
    description: meta.blurb,
    alternates: { canonical: `/research/${section}` },
    openGraph: { title, description: meta.blurb, url: `${SITE}/research/${section}`, siteName: "Kairo Labs" },
  };
}

export default async function ResearchSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isSection(section)) notFound();
  const meta = SECTION_META[section];
  const articles = articlesBySection(section);
  const canonical = `${SITE}/research/${section}`;

  return (
    <main className="container" style={{ padding: "clamp(28px,5vw,52px) 24px clamp(56px,8vw,96px)" }}>
      <script
        {...jsonLdScript(
          collectionPageJsonLd({
            name: `${meta.label} — Kairo Labs Research`,
            url: canonical,
            description: meta.blurb,
            items: articles.map((a) => ({ name: a.h1, url: `${SITE}/research/${a.section}/${a.slug}` })),
          }),
        )}
      />
      <script
        {...jsonLdScript(
          breadcrumbJsonLd([
            { name: "Research", url: `${SITE}/research` },
            { name: meta.label, url: canonical },
          ]),
        )}
      />

      <nav className="rh-crumbs" aria-label="Breadcrumb">
        <Link href="/research">Research</Link>
        <span aria-hidden>/</span>
        <span className="rh-crumbs-cur">{meta.label}</span>
      </nav>

      <header className="rh-head">
        <div className="eyebrow">Research hub</div>
        <h1 className="rh-h1">{meta.label}</h1>
        <p className="rh-intro">{meta.blurb}</p>
      </header>

      {articles.length > 0 ? (
        <div className="rh-grid">
          {articles.map((a) => (
            <Link key={a.slug} href={`/research/${a.section}/${a.slug}`} className="cat-card">
              <div className="eyebrow" style={{ fontSize: 10 }}>{a.eyebrow}</div>
              <div className="rh-card-h">{a.h1}</div>
              <p className="rh-card-sub">{a.description}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rh-intro" style={{ color: "var(--ink-faint)" }}>Articles in this section are on the way.</p>
      )}

      <div className="rh-ruo rh-ruo-full" style={{ marginTop: "clamp(40px,6vw,64px)" }}>
        <strong>Research Use Only.</strong> All materials referenced by Kairo Labs are for laboratory research and educational
        purposes only — not for human or animal consumption.
      </div>
    </main>
  );
}
