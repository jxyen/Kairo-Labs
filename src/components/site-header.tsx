"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { useCart } from "@/components/cart-context";

const NAV_LINKS = [
  { label: "Shop", href: "/catalog" },
  { label: "Categories", href: "/#categories" },
  { label: "COA", href: "/#quality" },
  { label: "Reviews", href: "/#reviews" },
  { label: "FAQ", href: "/#faq" },
];

function CartIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#f2f4f5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="20" r="1.3" />
      <circle cx="18" cy="20" r="1.3" />
      <path d="M2 3h3l2.4 12.4a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L22 7H6" />
    </svg>
  );
}

export function SiteHeader() {
  const [navOpen, setNavOpen] = useState(false);
  const { cart } = useCart();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(18px) saturate(140%)",
        WebkitBackdropFilter: "blur(18px) saturate(140%)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="container"
        style={{
          paddingTop: 14,
          paddingBottom: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Logo />

        <nav className="show-desktop" style={{ alignItems: "center", gap: 28 }}>
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="nav-link">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="show-desktop" style={{ alignItems: "center", gap: 14 }}>
          <Link
            href="/catalog"
            aria-label="Cart"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <CartIcon />
            {cart > 0 && (
              <span
                className="font-mono"
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  minWidth: 18,
                  height: 18,
                  padding: "0 4px",
                  borderRadius: 9,
                  background: "var(--accent)",
                  color: "#06181b",
                  fontSize: 11,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cart}
              </span>
            )}
          </Link>
          <Link
            href="/catalog"
            className="btn btn-white"
            style={{ fontSize: 14, padding: "10px 20px" }}
          >
            Shop
          </Link>
        </div>

        <button
          className="show-mobile"
          onClick={() => setNavOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={navOpen}
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "none",
            cursor: "pointer",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f2f4f5" strokeWidth="1.6" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {navOpen && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            padding: "10px 20px 22px",
            background: "rgba(0,0,0,0.97)",
          }}
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setNavOpen(false)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                fontSize: 16,
                color: "#e6e9eb",
                padding: "14px 2px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/catalog"
            onClick={() => setNavOpen(false)}
            className="btn btn-white"
            style={{
              marginTop: 16,
              width: "100%",
              justifyContent: "center",
              fontSize: 15,
              padding: 14,
            }}
          >
            Shop the catalog
          </Link>
        </div>
      )}
    </header>
  );
}
