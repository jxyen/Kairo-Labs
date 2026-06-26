"use client";

import Link from "next/link";
import type { Product } from "@/lib/products";

/**
 * Big hero product card — the Kairo vial cutout floating on a baked emerald
 * gradient. Responsive: desktop = vial right / copy left; mobile = vial top /
 * copy bottom. (Reference: the Sermorelin / GLP-1 hero cards, in emerald.)
 */
export function FeatureCard({ product, href = "/catalog" }: { product: Product; href?: string }) {
  const lines = product.tagline.split("\n");
  return (
    <div className="feature">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="feat-vial" src={product.image} alt={`${product.name} research vial`} />
      <div className="feat-scrim" aria-hidden="true" />
      <div className="feat-copy">
        <span className="pill pill-dark">{product.mechanism}</span>
        <h3 className="feat-hl">
          {lines.map((l, i) => (
            <span key={i}>
              {l}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </h3>
        <p className="feat-sub">{product.blurb}</p>
        <Link href={href} className="btn btn-white feat-cta">
          View Product
        </Link>
      </div>
    </div>
  );
}
