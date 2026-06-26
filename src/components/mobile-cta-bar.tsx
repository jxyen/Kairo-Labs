"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-context";

/**
 * Persistent mobile conversion bar — fixed to the bottom on phones, revealed
 * after the user scrolls past the hero. Keeps a primary CTA and the cart one
 * tap away at all times (a core mobile-ecom funnel pattern).
 */
export function MobileCtaBar() {
  const { cart } = useCart();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="mcta show-mobile" data-show={show} aria-hidden={!show}>
      <div className="mcta-trust font-mono">
        <span style={{ color: "var(--accent)" }}>✓</span> Lab-tested · Ships from the USA
      </div>
      <div className="mcta-row">
        <Link href="/catalog" className="btn btn-accent mcta-shop">
          Shop the catalog →
        </Link>
        <Link href="/catalog" aria-label="Cart" className="mcta-cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f2f4f5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="20" r="1.3" />
            <circle cx="18" cy="20" r="1.3" />
            <path d="M2 3h3l2.4 12.4a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L22 7H6" />
          </svg>
          {cart > 0 && <span className="mcta-badge font-mono">{cart}</span>}
        </Link>
      </div>
    </div>
  );
}
