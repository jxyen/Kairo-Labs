import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog/queries";
import { productSlug } from "@/lib/products";
import { allArticles, RESEARCH_SECTIONS } from "@/lib/research/articles";
import { SITE } from "@/lib/research/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/catalog`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/research`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/verify`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/tools/reconstitution-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const sectionRoutes: MetadataRoute.Sitemap = RESEARCH_SECTIONS.map((s) => ({
    url: `${SITE}/research/${s}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = allArticles().map((a) => ({
    url: `${SITE}/research/${a.section}/${a.slug}`,
    lastModified: new Date(a.dateModified ?? a.datePublished),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const catalog = await getCatalog();
    productRoutes = catalog.map((p) => ({
      url: `${SITE}/product/${productSlug(p)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    productRoutes = [];
  }

  return [...staticRoutes, ...sectionRoutes, ...articleRoutes, ...productRoutes];
}
