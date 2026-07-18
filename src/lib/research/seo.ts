// JSON-LD structured-data builders for the storefront + Research Education Hub.
// Compliance: compound/handling/verification pages use TechArticle (NOT Drug or
// MedicalWebPage, which would signal human medical use); comparisons use Article.
// Product schema stays on PDPs only. Deliberately NO aggregateRating anywhere —
// the catalog carries placeholder star values, and emitting them as schema would
// be both dishonest and a Google structured-data violation.

import type { Article, ArticleFaq } from "./articles";
import type { Product, ProductDetail } from "@/lib/products";
import { productSlug } from "@/lib/products";

export const SITE = "https://kairolabs.org";
const LOGO = `${SITE}/kairo-logo-stacked.png`;

export const ORGANIZATION = {
  "@type": "Organization",
  name: "Kairo Labs",
  url: SITE,
  description: "Research-grade peptides supplied to qualified researchers and laboratories, verified to the lot.",
};

// Sitewide brand identity — rendered once in the root layout so every page
// carries it. Establishes the brand entity for a knowledge panel / brand SERP.
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    ...ORGANIZATION,
    logo: LOGO,
    slogan: "Research peptides, verified to the lot.",
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Kairo Labs",
    url: SITE,
    publisher: ORGANIZATION,
  };
}

// Absolute image URL for a product render (public/products/*.png).
function absImage(image: string): string {
  if (!image) return LOGO;
  if (image.startsWith("http")) return image;
  return `${SITE}${image.startsWith("/") ? "" : "/"}${image}`;
}

// Product schema for a PDP. Uses AggregateOffer to express the price range
// across sizes. Molecular identifiers ride along as additionalProperty so the
// technical profile is machine-readable. Research-framed description only.
export function productJsonLd(p: Product, detail: ProductDetail) {
  const url = `${SITE}/product/${productSlug(p)}`;
  const prices = p.sizes.map((s) => s.price).filter((n) => Number.isFinite(n));
  const additionalProperty = [
    detail.cas && { "@type": "PropertyValue", name: "CAS Number", value: detail.cas },
    detail.formula && { "@type": "PropertyValue", name: "Molecular Formula", value: detail.formula },
    detail.molarMass && { "@type": "PropertyValue", name: "Molar Mass", value: detail.molarMass },
    p.purity && { "@type": "PropertyValue", name: "Purity", value: p.purity },
    detail.form && { "@type": "PropertyValue", name: "Form", value: detail.form },
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: detail.fullName || p.name,
    description: `${p.sub ? p.sub + ". " : ""}${detail.research}`.trim(),
    sku: p.code,
    category: p.category,
    brand: { "@type": "Brand", name: "Kairo Labs" },
    image: absImage(p.image),
    url,
    ...(additionalProperty.length ? { additionalProperty } : {}),
    ...(prices.length
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "USD",
            lowPrice: Math.min(...prices).toFixed(2),
            highPrice: Math.max(...prices).toFixed(2),
            offerCount: prices.length,
            availability: "https://schema.org/InStock",
            url,
            seller: ORGANIZATION,
          },
        }
      : {}),
  };
}

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
