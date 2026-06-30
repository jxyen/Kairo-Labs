"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-context";
import { CartContents } from "@/components/cart-contents";
import type { Product } from "@/lib/products";

export function CartDrawer({ accessories }: { accessories: Product[] }) {
  const { drawerOpen, closeCart, count } = useCart();
  const pathname = usePathname();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Close the drawer on navigation (e.g. after "View full cart" / Checkout).
  useEffect(() => {
    closeCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen, closeCart]);

  return (
    <div className="cd-root" data-open={drawerOpen} aria-hidden={!drawerOpen}>
      <button className="cd-scrim" aria-label="Close cart" onClick={closeCart} tabIndex={drawerOpen ? 0 : -1} />
      <aside className="cd-panel" role="dialog" aria-label="Shopping cart" aria-modal="true" inert={!drawerOpen}>
        <header className="cd-head">
          <div className="cd-title">
            Cart {count > 0 && <span className="cd-count font-mono">{count}</span>}
          </div>
          <button className="cd-x" aria-label="Close cart" onClick={closeCart} ref={closeBtnRef}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>
        <CartContents variant="drawer" accessories={accessories} />
      </aside>
    </div>
  );
}
