import Link from "next/link";
import { fromPrice, formatUSD, productHref, type Product } from "@/lib/products";

/**
 * Premium product tile — the white-studio vial render multiplied onto a clean
 * light media panel, with the product name, a descriptor subtitle, a "From"
 * price, and a full-width View CTA. The whole tile links to the product page.
 */
export function ProductCard({ product }: { product: Product; variant?: "featured" | "catalog" }) {
  const multi = product.sizes.length > 1;

  return (
    <Link href={productHref(product)} className="tile">
      <div className="tile-media">
        {product.bestseller ? <span className="tile-badge">Bestseller</span> : null}
        <span className="tile-purity font-mono">{product.purity}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="tile-vial" src={product.image} alt={`${product.name} research vial`} loading="lazy" />
      </div>
      <div className="tile-body">
        <h3 className="tile-name">{product.name}</h3>
        <p className="tile-sub">{product.sub}</p>
        <span className="tile-priceblock">
          <span className="tile-from">{multi ? "From" : "Price"}</span>
          <span className="tile-price">{formatUSD(fromPrice(product))}</span>
        </span>
        <span className="tile-view">View</span>
      </div>
    </Link>
  );
}
