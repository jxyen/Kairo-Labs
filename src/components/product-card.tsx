"use client";

import { priceDisplay, sizeDisplay, type Product } from "@/lib/products";
import { useCart } from "@/components/cart-context";

function Stars({ rating }: { rating: number }) {
  const pct = (rating / 5) * 100;
  return (
    <span
      aria-label={`${rating} out of 5`}
      style={{ position: "relative", display: "inline-block", lineHeight: 1, fontSize: 12 }}
    >
      <span style={{ color: "rgba(255,255,255,0.16)", letterSpacing: "1.5px" }}>★★★★★</span>
      <span
        style={{
          position: "absolute",
          inset: 0,
          width: `${pct}%`,
          overflow: "hidden",
          whiteSpace: "nowrap",
          color: "var(--accent)",
          letterSpacing: "1.5px",
        }}
      >
        ★★★★★
      </span>
    </span>
  );
}

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
  const priceSize = variant === "featured" ? 19 : 18;
  const addPad = variant === "featured" ? "10px 16px" : "9px 15px";
  const addFont = variant === "featured" ? 13.5 : 13;

  return (
    <div className="product-card">
      <div className="studio-tile" style={{ height: tileHeight }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={`${product.name} research vial`}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {product.bestseller ? (
          <span className="chip-bestseller">Bestseller</span>
        ) : (
          <span className="chip-category">{product.category}</span>
        )}
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
            {sizeDisplay(product)}
          </span>
        </div>

        <div
          className="font-mono"
          style={{ fontSize: subSize, letterSpacing: "0.04em", color: "var(--text-faint)" }}
        >
          {product.sub}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Stars rating={product.rating} />
          <span className="font-mono" style={{ fontSize: 11.5, color: "var(--text-dim)" }}>
            {product.rating.toFixed(1)} · {product.reviews} reviews
          </span>
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
          <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {product.sizes.length > 1 && (
              <span className="font-mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.06em" }}>
                FROM
              </span>
            )}
            <span style={{ fontSize: priceSize, fontWeight: 600, letterSpacing: "-0.01em" }}>
              {priceDisplay(product)}
            </span>
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
