import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelated, getAccessories } from "@/lib/catalog/queries";
import { productDetail } from "@/lib/products";
import { ProductDetailView } from "@/components/product-detail-view";
import { jsonLdScript, productJsonLd, breadcrumbJsonLd, SITE } from "@/lib/research/seo";
import { articleForProduct } from "@/lib/research/articles";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found — Kairo Labs" };
  const detail = productDetail(product);
  const title = `${product.name} (${product.purity}) — Research peptide | Kairo Labs`;
  const description =
    `${detail?.fullName ?? product.name}: ${product.sub}. ${product.purity} purity, third-party lab-tested with a verifiable COA. For laboratory research use only — not for human or animal consumption.`;
  const canonical = `/product/${slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: `${SITE}${canonical}`,
      type: "website",
      siteName: "Kairo Labs",
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const detail = product ? productDetail(product) : undefined;
  if (!product || !detail) notFound();

  const [related, accessories] = await Promise.all([getRelated(product), getAccessories()]);
  const research = articleForProduct(slug);

  return (
    <>
      <script {...jsonLdScript(productJsonLd(product, detail))} />
      <script
        {...jsonLdScript(
          breadcrumbJsonLd([
            { name: "Home", url: `${SITE}/` },
            { name: "Catalog", url: `${SITE}/catalog` },
            { name: product.name, url: `${SITE}/product/${slug}` },
          ]),
        )}
      />
      <ProductDetailView
        product={product}
        detail={detail}
        related={related}
        accessories={accessories}
        research={research}
      />
    </>
  );
}
