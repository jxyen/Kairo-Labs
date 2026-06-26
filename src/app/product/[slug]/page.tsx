import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PRODUCTS,
  productSlug,
  productBySlug,
  productDetail,
  relatedProducts,
} from "@/lib/products";
import { ProductDetailView } from "@/components/product-detail-view";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: productSlug(p) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return { title: "Product not found — Kairo Labs" };
  const detail = productDetail(product);
  return {
    title: `${product.name} (${product.purity}) — Research peptide | Kairo Labs`,
    description:
      `${detail?.fullName ?? product.name}: ${product.sub}. ${product.purity} purity, third-party lab-tested with a verifiable COA. For laboratory research use only — not for human or animal consumption.`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  const detail = product ? productDetail(product) : undefined;
  if (!product || !detail) notFound();

  return (
    <ProductDetailView
      product={product}
      detail={detail}
      related={relatedProducts(product, 3)}
    />
  );
}
