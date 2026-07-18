import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog/queries";
import { productSlug } from "@/lib/products";
import {
  jsonLdScript,
  collectionPageJsonLd,
  breadcrumbJsonLd,
  SITE,
} from "@/lib/research/seo";
import { CatalogBrowser } from "./catalog-browser";

export const dynamic = "force-dynamic";

const TITLE = "Research Peptides Catalog — Lab-Tested, COA-Verified | Kairo Labs";
const DESCRIPTION =
  "Browse Kairo Labs' catalog of research-grade peptides — BPC-157, TB-500, tirzepatide, retatrutide, CJC-1295, ipamorelin and more. Independently lab-tested to ≥99% purity, each with a verifiable certificate of analysis. For research use only.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/catalog" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE}/catalog`,
    type: "website",
    siteName: "Kairo Labs",
  },
};

export default async function CatalogPage() {
  const products = await getCatalog();
  const items = products.map((p) => ({
    name: p.name,
    url: `${SITE}/product/${productSlug(p)}`,
  }));

  return (
    <>
      <script
        {...jsonLdScript(
          collectionPageJsonLd({
            name: "Research Peptides Catalog",
            url: `${SITE}/catalog`,
            description: DESCRIPTION,
            items,
          }),
        )}
      />
      <script
        {...jsonLdScript(
          breadcrumbJsonLd([
            { name: "Home", url: `${SITE}/` },
            { name: "Catalog", url: `${SITE}/catalog` },
          ]),
        )}
      />
      <CatalogBrowser products={products} />
    </>
  );
}
