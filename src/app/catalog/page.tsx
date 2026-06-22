"use client";

import { useState } from "react";
import { CATEGORIES, PRODUCTS, type FilterCategory } from "@/lib/products";
import { ProductCard } from "@/components/product-card";

export default function CatalogPage() {
  const [category, setCategory] = useState<FilterCategory>("All");

  const filtered =
    category === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === category);

  return (
    <main
      className="container"
      style={{ padding: "clamp(36px,6vw,64px) 20px clamp(56px,8vw,96px)" }}
    >
      <div className="eyebrow">Catalog</div>
      <h1 style={{ margin: "12px 0 0", fontSize: "clamp(28px,5vw,42px)", fontWeight: 600, letterSpacing: "-0.03em" }}>
        Research peptides
      </h1>
      <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.6, color: "var(--text-muted)", maxWidth: 560 }}>
        Every compound is independently lab-tested with a verifiable certificate of analysis. All
        products are for research use only.
      </p>

      <div
        style={{
          margin: "28px 0 26px",
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 4,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className="cat-chip"
            data-active={c === category}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(244px, 1fr))",
          gap: 18,
        }}
      >
        {filtered.map((p) => (
          <ProductCard key={p.code} product={p} variant="catalog" />
        ))}
      </div>
    </main>
  );
}
