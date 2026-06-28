"use client";

import Link from "next/link";
import { productHref, type Product } from "@/lib/products";

/**
 * Big hero product card — light split: the white-studio vial render in a light
 * media panel beside dark editorial copy. Responsive: desktop = copy left /
 * vial right; mobile = vial top / copy bottom.
 */
export function FeatureCard({ product, href }: { product: Product; href?: string }) {
  const lines = product.tagline.split("\n");
  const target = href ?? productHref(product);
  return (
    <div className="feature">
      <div className="feat-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="feat-vial" src={product.image} alt={`${product.name} research vial`} />
      </div>
      <div className="feat-copy">
        <span className="pill pill-soft">{product.mechanism}</span>
        <h3 className="feat-hl">
          {lines.map((l, i) => (
            <span key={i}>
              {l}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </h3>
        <p className="feat-sub">{product.blurb}</p>
        <Link href={target} className="btn btn-dark feat-cta">
          View Product
        </Link>
      </div>
    </div>
  );
}
