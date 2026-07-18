// Research Education Hub content registry.
//
// Mirrors the PRODUCT_DETAILS pattern in src/lib/products.ts: a typed interface
// + a data source + lookup helpers. Article bodies are structured data (no MDX —
// not the house style), loaded from articles.data.json and statically generated
// via generateStaticParams.
//
// COMPLIANCE: every article is FOR RESEARCH USE ONLY. No consumer/benefit
// claims, no human dosing. Framing is mechanism / molecular properties / what
// the literature studies / laboratory handling. Schema is TechArticle/Article,
// never Drug/MedicalWebPage.

import ARTICLES_DATA from "./articles.data.json";

export type ResearchSection = "compounds" | "stacks" | "handling" | "verification" | "compare";

export const RESEARCH_SECTIONS: ResearchSection[] = ["compounds", "stacks", "handling", "verification", "compare"];

export interface ArticleBodySection {
  heading?: string;
  paragraphs: string[];
  bullets?: string[] | null;
}
export interface ArticleSpec { label: string; value: string; }
export interface ArticleFaq { q: string; a: string; }
export interface ArticleCrossLink { label: string; href: string; }

export interface Article {
  slug: string;
  section: ResearchSection;
  schema: "TechArticle" | "Article";
  eyebrow: string;
  h1: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  intro: string;
  body: ArticleBodySection[];
  specs?: ArticleSpec[] | null;
  faqs: ArticleFaq[];
  relatedProductSlugs: string[];
  crossLinks: ArticleCrossLink[];
}

export const SECTION_META: Record<ResearchSection, { label: string; blurb: string; }> = {
  compounds: {
    label: "Compounds",
    blurb: "Mechanism of action, receptor targets, and molecular profiles for each research compound.",
  },
  stacks: {
    label: "Stacks & Protocols",
    blurb: "How co-formulated research compounds are studied together — complementary mechanisms and handling.",
  },
  handling: {
    label: "Handling & Stability",
    blurb: "Reconstitution, storage, and stability — for laboratory settings, not human use.",
  },
  verification: {
    label: "Verification & Purity",
    blurb: "How to read a Certificate of Analysis and verify identity and purity to the lot.",
  },
  compare: {
    label: "Comparisons",
    blurb: "Mechanism and receptor-target comparisons between related compounds.",
  },
};

// Display names for related-product CTAs (avoids importing the dynamic catalog).
export const PRODUCT_NAMES: Record<string, string> = {
  "bpc-157": "BPC-157",
  "tb-500": "TB-500",
  tirzepatide: "Tirzepatide",
  retatrutide: "Retatrutide",
  "mots-c": "MOTS-c",
  "cjc-1295": "CJC-1295",
  ipamorelin: "Ipamorelin",
  "igf-1-lr3": "IGF-1 LR3",
  "ghk-cu": "GHK-Cu",
  "mt-2": "MT-2 (Melanotan II)",
  "bpc-tb-blend": "BPC-157 + TB-500 blend",
  "cjc-ipa-blend": "CJC-1295 + Ipamorelin blend",
  glow: "GLOW stack",
};

export const ARTICLES = ARTICLES_DATA as unknown as Article[];

const bySlug = new Map(ARTICLES.map((a) => [`${a.section}/${a.slug}`, a]));

export function articleBySlug(section: string, slug: string): Article | undefined {
  return bySlug.get(`${section}/${slug}`);
}
export function articlesBySection(section: ResearchSection): Article[] {
  return ARTICLES.filter((a) => a.section === section);
}
export function allArticles(): Article[] {
  return ARTICLES;
}
export function articleParams(): { section: string; slug: string }[] {
  return ARTICLES.map((a) => ({ section: a.section, slug: a.slug }));
}
export function productName(slug: string): string {
  return PRODUCT_NAMES[slug] ?? slug;
}

/**
 * Reverse of `relatedProductSlugs`: given a product slug, find the best research
 * article to link back to from its product page. Prefers the compound's own deep
 * article (`compounds/<slug>`); otherwise the first article that references it.
 * This closes the product→research half of the internal-link bridge, so a
 * commercial-search visitor landing on a product can reach the trust-building
 * depth (and link equity flows back into the hub).
 */
export function articleForProduct(productSlug: string): { href: string; label: string } | undefined {
  // Preference order: the compound's own deep article, then a stack/protocol
  // article that features it (right for blend products), then any article that
  // references it at all.
  const own = bySlug.get(`compounds/${productSlug}`);
  const stack = ARTICLES.find((a) => a.section === "stacks" && a.relatedProductSlugs.includes(productSlug));
  const any = ARTICLES.find((a) => a.relatedProductSlugs.includes(productSlug));
  const match = own ?? stack ?? any;
  if (!match) return undefined;
  return { href: `/research/${match.section}/${match.slug}`, label: match.h1 };
}
