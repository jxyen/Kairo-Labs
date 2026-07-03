// JSON-LD structured-data builders for the Research Education Hub.
// Compliance: compound/handling/verification pages use TechArticle (NOT Drug or
// MedicalWebPage, which would signal human medical use); comparisons use Article.
// Product schema stays on PDPs only.

import type { Article, ArticleFaq } from "./articles";

export const SITE = "https://kairolabs.org";

export const ORGANIZATION = {
  "@type": "Organization",
  name: "Kairo Labs",
  url: SITE,
  description: "Research-grade peptides supplied to qualified researchers and laboratories, verified to the lot.",
};

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function faqJsonLd(faqs: ArticleFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function articleJsonLd(article: Article) {
  const url = `${SITE}/research/${article.section}/${article.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": article.schema, // TechArticle | Article
    headline: article.h1,
    description: article.description,
    datePublished: article.datePublished,
    dateModified: article.dateModified ?? article.datePublished,
    author: { "@type": "Organization", name: "Kairo Labs Research" },
    publisher: ORGANIZATION,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@type": "WebSite", name: "Kairo Labs", url: SITE },
    url,
  };
}

export function collectionPageJsonLd(opts: {
  name: string;
  url: string;
  description: string;
  items: { name: string; url: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    isPartOf: { "@type": "WebSite", name: "Kairo Labs", url: SITE },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.items.length,
      itemListElement: opts.items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        url: it.url,
      })),
    },
  };
}

// Renders a JSON-LD <script>. Use inside a page's returned JSX.
export function jsonLdScript(data: unknown) {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  };
}
