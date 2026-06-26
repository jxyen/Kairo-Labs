"use client";

import { priceDisplay, sizeDisplay, type Product } from "@/lib/products";
import { useCart } from "@/components/cart-context";

/**
 * Compact product tile — vial cutout on the emerald gradient with mechanism
 * pill, name, rating, price and add-to-cart. Used in the bestsellers slider
 * and the catalog grid.
 */
export function ProductCard({ product }: { product: Product; variant?: "featured" | "catalog" }) {
  const { justAdded, add } = useCart();
  const added = justAdded === product.code;
  const multi = product.sizes.length > 1;

  return (
    <div className="tile">
      <span className="tile-purity font-mono">{product.purity}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="tile-vial" src={product.image} alt={`${product.name} research vial`} loading="lazy" />
      <div className="tile-scrim" aria-hidden="true" />
      <div className="tile-body">
        <span className="pill pill-emerald">{product.mechanism}</span>
        <h3 className="tile-name">{product.name}</h3>
        <div className="tile-sub">{product.sub}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span className="tile-stars">★★★★★</span>
          <span className="font-mono" style={{ fontSize: 11, color: "rgba(255,255,255,.66)" }}>
            {product.rating.toFixed(1)} · {product.reviews}
          </span>
        </div>
        <div className="tile-foot">
          <span className="tile-price">
            {multi && <span className="from">FROM</span>}
            {priceDisplay(product)}
            <span className="font-mono" style={{ display: "block", fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,.6)", letterSpacing: ".04em", marginTop: 2 }}>
              {sizeDisplay(product)}
            </span>
          </span>
          <button
            className="tile-add"
            onClick={() => add(product.code)}
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? "✓ Added" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
