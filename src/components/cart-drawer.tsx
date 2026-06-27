"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { AccIcon } from "@/components/accessory-icon";
import {
  ACCESSORIES,
  FREE_SHIP_THRESHOLD,
  accessoryByCode,
  cartLineFromAccessory,
  formatUSD,
  nextVolumeTier,
} from "@/lib/products";

export function CartDrawer() {
  const { open, closeCart, totals, items, updateQty, remove, add } = useCart();
  const { lines, subtotal, discount, discountRate, shipping, total, freeShipRemaining, productUnits } = totals;

  // Lock body scroll + close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, closeCart]);

  const empty = lines.length === 0;
  const freeShipPct = Math.min(100, Math.round(((FREE_SHIP_THRESHOLD - freeShipRemaining) / FREE_SHIP_THRESHOLD) * 100));
  const nextTier = nextVolumeTier(productUnits);

  // Accessory cross-sell: consumables not already in the cart.
  const inCart = new Set(items.map((l) => l.code));
  const crossSell = ACCESSORIES.filter((a) => !inCart.has(a.code)).slice(0, 3);

  return (
    <div className="cd-root" data-open={open} aria-hidden={!open}>
      <button className="cd-scrim" aria-label="Close cart" onClick={closeCart} tabIndex={open ? 0 : -1} />

      <aside className="cd-panel" role="dialog" aria-label="Shopping cart" aria-modal="true">
        <header className="cd-head">
          <div className="cd-title">
            Your cart
            {!empty && <span className="cd-count font-mono">{totals.count}</span>}
          </div>
          <button className="cd-x" aria-label="Close cart" onClick={closeCart}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>

        {empty ? (
          <div className="cd-empty">
            <div className="cd-empty-ic">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /><path d="M2 3h3l2.4 12.4a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L22 7H6" /></svg>
            </div>
            <p>Your cart is empty.</p>
            <Link href="/catalog" className="btn btn-emerald" style={{ padding: "12px 22px", fontSize: 14.5 }} onClick={closeCart}>
              Browse the catalog
            </Link>
          </div>
        ) : (
          <>
            {/* free-shipping progress */}
            <div className="cd-ship">
              <div className="cd-ship-msg">
                {freeShipRemaining > 0 ? (
                  <>Add <b>{formatUSD(freeShipRemaining)}</b> more for <b>free US shipping</b></>
                ) : (
                  <><b>✓ Your order ships free.</b></>
                )}
              </div>
              <div className="cd-ship-track"><div className="cd-ship-fill" style={{ width: `${freeShipPct}%` }} /></div>
            </div>

            {/* scrollable middle — items + nudges + cross-sell scroll together */}
            <div className="cd-scroll">
            {/* line items */}
            <div className="cd-lines">
              {lines.map((l) => {
                const acc = l.kind === "accessory" ? accessoryByCode(l.code) : undefined;
                return (
                  <div className="cd-line" key={`${l.code}::${l.sizeMg ?? ""}`}>
                    <div className="cd-thumb" data-kind={l.kind}>
                      {l.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.image} alt="" />
                      ) : (
                        <span className="cd-thumb-ic">{acc && <AccIcon kind={acc.icon} size={22} />}</span>
                      )}
                    </div>
                    <div className="cd-line-main">
                      <div className="cd-line-name">{l.name}</div>
                      <div className="cd-line-sub font-mono">{l.sub}</div>
                      <div className="cd-line-controls">
                        <div className="cd-stepper">
                          <button aria-label="Decrease quantity" onClick={() => updateQty(l.code, l.sizeMg, l.qty - 1)}>−</button>
                          <span>{l.qty}</span>
                          <button aria-label="Increase quantity" onClick={() => updateQty(l.code, l.sizeMg, l.qty + 1)}>+</button>
                        </div>
                        <button className="cd-remove" onClick={() => remove(l.code, l.sizeMg)}>Remove</button>
                      </div>
                    </div>
                    <div className="cd-line-price">{formatUSD(l.lineTotal)}</div>
                  </div>
                );
              })}
            </div>

            {/* volume upsell nudge */}
            {nextTier && (
              <div className="cd-nudge">
                Add <b>{nextTier.need}</b> more {nextTier.need === 1 ? "vial" : "vials"} → save <b>{Math.round(nextTier.off * 100)}%</b> on all peptides
              </div>
            )}

            {/* accessory cross-sell */}
            {crossSell.length > 0 && (
              <div className="cd-cross">
                <div className="cd-cross-h">Complete your order</div>
                {crossSell.map((a) => (
                  <div className="cd-cross-item" key={a.code}>
                    <span className="cd-cross-ic"><AccIcon kind={a.icon} size={18} /></span>
                    <div className="cd-cross-meta">
                      <div className="nm">{a.name}</div>
                      <div className="sb font-mono">{a.sub}</div>
                    </div>
                    <button className="cd-cross-add" onClick={() => add(cartLineFromAccessory(a))}>
                      {formatUSD(a.price)} · Add
                    </button>
                  </div>
                ))}
              </div>
            )}
            </div>{/* /cd-scroll */}

            {/* summary + checkout */}
            <footer className="cd-foot">
              <dl className="cd-summary">
                <div><dt>Subtotal</dt><dd>{formatUSD(subtotal)}</dd></div>
                {discount > 0 && (
                  <div className="cd-summary-disc">
                    <dt>Volume discount (−{Math.round(discountRate * 100)}%)</dt>
                    <dd>−{formatUSD(discount)}</dd>
                  </div>
                )}
                <div>
                  <dt>Shipping</dt>
                  <dd>{shipping === 0 ? "Free" : formatUSD(shipping)}</dd>
                </div>
                <div className="cd-summary-total"><dt>Total</dt><dd>{formatUSD(total)}</dd></div>
              </dl>
              <Link href="/checkout" className="btn btn-emerald cd-checkout" onClick={closeCart}>
                Checkout · {formatUSD(total)}
              </Link>
              <button className="cd-continue" onClick={closeCart}>Continue shopping</button>
              <p className="cd-rou font-mono">For research use only · not for human or animal consumption</p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
