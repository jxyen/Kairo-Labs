"use client";

import type { Product } from "@/lib/products";
import { useCart } from "@/components/cart-context";
import { VialPlaceholder } from "@/components/vial-placeholder";

export function ProductCard({
  product,
  variant = "catalog",
}: {
  product: Product;
  variant?: "featured" | "catalog";
}) {
  const { justAdded, add } = useCart();
  const added = justAdded === product.code;

  const tileHeight = variant === "featured" ? 214 : 200;
  const nameSize = variant === "featured" ? 18 : 17;
  const subSize = variant === "featured" ? 11.5 : 11;
  const blurbSize = variant === "featured" ? 13.5 : 13;
  const sizeSize = variant === "featured" ? 13 : 12.5;
  const priceSize = variant === "featured" ? 20 : 19;
  const addPad = variant === "featured" ? "10px 16px" : "9px 15px";
  const addFont = variant === "featured" ? 13.5 : 13;

  return (
    <div className="product-card">
      <div className="studio-tile" style={{ height: tileHeight }}>
        <VialPlaceholder height={tileHeight} />
        <span className="chip-category">{product.category}</span>
        <span className="chip-purity">{product.purity}</span>
      </div>

      <div
        style={{
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 9,
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: nameSize,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            {product.name}
          </h3>
          <span
            className="font-mono"
            style={{ fontSize: sizeSize, color: "var(--text-dim)", flex: "none" }}
          >
            {product.size}
          </span>
        </div>

        <div
          className="font-mono"
          style={{ fontSize: subSize, letterSpacing: "0.04em", color: "var(--text-faint)" }}
        >
          {product.sub}
        </div>

        <p style={{ margin: "2px 0 0", fontSize: blurbSize, lineHeight: 1.5, color: "var(--text-muted)" }}>
          {product.blurb}
        </p>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingTop: 14,
            borderTop: "1px solid var(--hairline-soft)",
          }}
        >
          <span style={{ fontSize: priceSize, fontWeight: 600, letterSpacing: "-0.01em" }}>
            {product.price}
          </span>
          <button
            className="add-btn"
            style={{ padding: addPad, fontSize: addFont }}
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
