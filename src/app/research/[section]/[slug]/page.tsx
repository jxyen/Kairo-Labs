import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  articleBySlug,
  articleParams,
  productName,
  SECTION_META,
  type ResearchSection,
} from "@/lib/research/articles";
import { articleJsonLd, faqJsonLd, breadcrumbJsonLd, jsonLdScript, SITE } from "@/lib/research/seo";

export const dynamic = "error"; // fully static — the registry is compile-time content

export function generateStaticParams() {
  return articleParams();
}

export async function generateMetadata({ params }: { params: Promise<{ section: string; slug: string }> }): Promise<Metadata> {
  const { section, slug } = await params;
  const article = articleBySlug(section, slug);
  if (!article) return { title: "Not found — Kairo Labs Research" };
  const canonical = `/research/${article.section}/${article.slug}`;
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `${SITE}${canonical}`,
      type: "article",
      siteName: "Kairo Labs",
    },
  };
}

export default async function ResearchArticlePage({ params }: { params: Promise<{ section: string; slug: string }> }) {
  const { section, slug } = await params;
  const article = articleBySlug(section, slug);
  if (!article) notFound();

  const sec = article.section as ResearchSection;
  const canonical = `${SITE}/research/${article.section}/${article.slug}`;

  return (
    <main className="container" style={{ padding: "clamp(28px,5vw,52px) 24px clamp(56px,8vw,96px)" }}>
      <script {...jsonLdScript(articleJsonLd(article))} />
      {article.faqs.length > 0 && <script {...jsonLdScript(faqJsonLd(article.faqs))} />}
      <script
        {...jsonLdScript(
          breadcrumbJsonLd([
            { name: "Research", url: `${SITE}/research` },
            { name: SECTION_META[sec].label, url: `${SITE}/research/${sec}` },
            { name: article.h1, url: canonical },
          ]),
        )}
      />

      <nav className="rh-crumbs" aria-label="Breadcrumb">
        <Link href="/research">Research</Link>
        <span aria-hidden>/</span>
        <Link href={`/research/${sec}`}>{SECTION_META[sec].label}</Link>
        <span aria-hidden>/</span>
        <span className="rh-crumbs-cur">{article.h1}</span>
      </nav>

      <div className="rh-ruo rh-ruo-top">For research use only. Not for human or animal consumption.</div>

      <header className="rh-head">
        <div className="eyebrow">{article.eyebrow}</div>
        <h1 className="rh-h1">{article.h1}</h1>
        <p className="rh-intro">{article.intro}</p>
      </header>

      <div className="rh-layout">
        <article className="rh-prose">
          {article.body.map((s, i) => (
            <section className="rh-sec" key={i}>
              {s.heading && <h2 className="rh-h2">{s.heading}</h2>}
              {s.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {s.bullets && s.bullets.length > 0 && (
                <ul className="rh-list">
                  {s.bullets.map((b, k) => (
                    <li key={k}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        <aside className="rh-aside">
          {article.specs && article.specs.length > 0 && (
            <div className="rh-specs">
              <div className="rh-specs-h">Molecular profile</div>
              <table className="rh-specs-table">
                <tbody>
                  {article.specs.map((sp, i) => (
                    <tr key={i}>
                      <th scope="row">{sp.label}</th>
                      <td>{sp.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="rh-specs-note">Exact values for each lot are reported on that lot&apos;s Certificate of Analysis.</p>
            </div>
          )}

          {article.relatedProductSlugs.length > 0 && (
            <div className="rh-cta">
              <div className="rh-cta-h">Verified to the lot</div>
              <p className="rh-cta-sub">
                Supplied as lyophilized powder, third-party lab-tested with a COA verifiable by lot number.
              </p>
              <div className="rh-cta-links">
                {article.relatedProductSlugs.map((ps) => (
                  <Link key={ps} href={`/product/${ps}`} className="btn btn-emerald" style={{ fontSize: 14, padding: "11px 18px", width: "100%" }}>
                    View {productName(ps)}
                  </Link>
                ))}
              </div>
              <Link href="/research/verification/certificate-of-analysis" className="rh-cta-coa">
                How to verify a COA →
              </Link>
            </div>
          )}
        </aside>
      </div>

      {article.faqs.length > 0 && (
        <section className="rh-faq">
          <div className="eyebrow" style={{ marginBottom: 18 }}>Frequently asked</div>
          <div className="rh-faq-list">
            {article.faqs.map((f, i) => (
              <div className="rh-faq-item" key={i}>
                <div className="rh-faq-q">{f.q}</div>
                <p className="rh-faq-a">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {article.crossLinks.length > 0 && (
        <nav className="rh-cross" aria-label="Related research">
          <span className="rh-cross-label">Keep reading</span>
          {article.crossLinks.map((c) => (
            <Link key={c.href} href={c.href} className="rh-cross-link">
              {c.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="rh-ruo rh-ruo-full">
        <strong>Research Use Only.</strong> All products and information referenced by Kairo Labs are intended strictly for
        laboratory research and educational purposes. They are not for human or animal consumption, and not for diagnostic,
        therapeutic, or clinical use. This content describes mechanisms, molecular properties, and handling as studied in the
        scientific literature; it is educational, not medical advice, and not a recommendation to use any compound in humans or
        animals. Researchers are responsible for handling all materials in accordance with applicable laws, regulations, and
        institutional safety protocols.
      </div>
    </main>
  );
}
