"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { PromoCode } from "@/components/promo-code";
import { orderTotals, lineTotal } from "@/lib/cart/cart";
import { formatUSD } from "@/lib/products";
import { deliveryById } from "./delivery-options";
import { StarIcon, TrashIcon } from "./checkout-icons";

/**
 * Shared order-summary used in the desktop sidebar (`variant="panel"`) and the
 * mobile bottom sheet (`variant="sheet"`). The sheet variant exposes qty steppers
 * and a remove control; the panel variant is read-only with a qty badge.
 */
export function OrderSummary({
  variant,
  delivery,
}: {
  variant: "panel" | "sheet";
  delivery: string;
}) {
  const { items, setQty, remove, count } = useCart();
  const t = orderTotals(items);
  const ship = deliveryById(delivery).price;
  const total = Math.round((t.merch + ship) * 100) / 100;
  const points = Math.round(t.merch * 2.5);
  const editable = variant === "sheet";

  return (
    <div className="co-sum" data-variant={variant}>
      <header className="co-sum-head">
        <h2 className="co-sum-title">Order Summary</h2>
        <div className="co-sum-meta">
          <span className="co-sum-count">{count} item{count === 1 ? "" : "s"}</span>
          <Link href="/cart" className="co-sum-edit">Edit</Link>
        </div>
      </header>

      <div className="co-lines">
        {items.length === 0 ? (
          <p className="co-sum-empty">Your cart is empty.</p>
        ) : (
          items.map((x) => (
            <div className="co-line" key={x.sizeId} data-editable={editable}>
              <div className="co-thumb">
                {x.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={x.image} alt="" />
                ) : null}
                {!editable && <span className="co-qbadge">{x.quantity}</span>}
              </div>
              <div className="co-line-main">
                <div className="co-line-name">{x.productName}</div>
                <div className="co-line-sub font-mono">{x.mg}</div>
                {editable && (
                  <div className="co-line-controls">
                    <div className="cd-stepper">
                      <button type="button" aria-label="Decrease quantity" onClick={() => setQty(x.sizeId, x.quantity - 1)}>−</button>
                      <span>{x.quantity}</span>
                      <button type="button" aria-label="Increase quantity" onClick={() => setQty(x.sizeId, x.quantity + 1)}>+</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="co-line-right">
                <div className="co-line-price">{formatUSD(lineTotal(x))}</div>
                {editable && (
                  <button type="button" className="co-line-trash" aria-label="Remove item" onClick={() => remove(x.sizeId)}>
                    <TrashIcon size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <PromoCode />

      {items.length > 0 && (
        <div className="co-points">
          <div className="co-points-ic"><StarIcon size={15} /></div>
          <div className="co-points-body">
            <b>Earn 100 more points</b> to redeem $1 off.
          </div>
        </div>
      )}

      <dl className="co-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatUSD(t.subtotal)}</dd>
        </div>
        {t.discount > 0 && (
          <div className="co-totals-disc">
            <dt>Volume discount</dt>
            <dd>−{formatUSD(t.discount)}</dd>
          </div>
        )}
        <div>
          <dt>Shipping</dt>
          <dd>{ship === 0 ? "Free" : formatUSD(ship)}</dd>
        </div>
        <div>
          <dt>Shipment Protection</dt>
          <dd className="co-free">Free</dd>
        </div>
        <div>
          <dt>Taxes</dt>
          <dd>{formatUSD(0)}</dd>
        </div>
        <div className="co-totals-grand">
          <dt>Total</dt>
          <dd>{formatUSD(total)}</dd>
        </div>
      </dl>

      {items.length > 0 && (
        <div className="co-earn">
          <div className="co-earn-ic"><StarIcon size={16} /></div>
          <div className="co-earn-body">
            <b>You&apos;ll earn {points} points</b>
            <span>Insiders earn {points + 70} (+70) on this order</span>
          </div>
        </div>
      )}
    </div>
  );
}
