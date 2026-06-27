import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatUSD } from "@/lib/products";

export const metadata: Metadata = {
  title: "Order received — Kairo Labs",
  robots: { index: false, follow: false },
};

async function fetchOrder(orderNumber: string) {
  const admin = createAdminClient();
  const { data: ord } = await admin
    .from("orders")
    .select("id, order_number, customer_name, customer_email, status, subtotal, shipping_cost, discount_total, total, shipping_address")
    .eq("order_number", orderNumber)
    .maybeSingle();
  const { data: items } = ord
    ? await admin
        .from("order_items")
        .select("product_name, mg, unit_price, quantity, line_total")
        .eq("order_id", ord.id)
    : { data: null };
  return { ord, items };
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  // Fetch the order; degrade gracefully to "not found" if the DB is
  // unreachable or env is missing (e.g. local dev without Supabase creds).
  let ord: Awaited<ReturnType<typeof fetchOrder>>["ord"] = null;
  let items: Awaited<ReturnType<typeof fetchOrder>>["items"] = null;
  if (order) {
    try {
      const res = await fetchOrder(order);
      ord = res.ord;
      items = res.items;
    } catch {
      ord = null;
    }
  }

  if (!order || !ord) {
    return (
      <main className="container co-conf-wrap">
        <div className="co-conf-card">
          <h1 className="co-title">Order not found</h1>
          <p className="co-conf-lead">
            We couldn&apos;t find that order. If you just placed it, check your email for confirmation.
          </p>
          <Link href="/catalog" className="btn btn-emerald" style={{ padding: "13px 24px" }}>
            Back to the catalog
          </Link>
        </div>
      </main>
    );
  }

  const addr = (ord.shipping_address ?? {}) as Record<string, string>;

  return (
    <main className="container co-conf-wrap">
      <div className="co-conf-card">
        <div className="co-conf-check" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
        <h1 className="co-title" style={{ marginTop: 14 }}>Order received</h1>
        <p className="co-conf-lead">
          Thanks, {ord.customer_name.split(" ")[0] || "researcher"}. Your order{" "}
          <b className="font-mono">{ord.order_number}</b> is reserved. A confirmation is on its way to{" "}
          <b>{ord.customer_email}</b>.
        </p>

        {/* ---- PAYMENT SEAM (continues) ----
            Order is `pending` / `unpaid`. The co-founder wires the actual
            payment step — either a "Pay now" redirect here, or emailed
            payment instructions. See HANDOFF.md. */}
        <div className="co-conf-next">
          <div className="co-conf-next-h font-mono">What happens next</div>
          <ol className="co-conf-steps">
            <li><b>Payment.</b> You&apos;ll receive secure payment details for this order by email shortly.</li>
            <li><b>Processing.</b> Once payment clears, your order is packed and lab paperwork matched to your lot.</li>
            <li><b>Shipping.</b> Tracked, same-day US dispatch where possible — you&apos;ll get a tracking number.</li>
          </ol>
          <div className="co-conf-status font-mono">Status: {ord.status.toUpperCase()} · awaiting payment</div>
        </div>

        <div className="co-conf-summary">
          <div className="co-conf-sec-h">Order summary</div>
          <div className="co-conf-items">
            {(items ?? []).map((it, i) => (
              <div className="co-conf-item" key={i}>
                <span className="nm">
                  {it.product_name}
                  {it.mg ? <span className="font-mono mg"> · {it.mg}</span> : null}
                  <span className="font-mono q"> × {it.quantity}</span>
                </span>
                <span className="pr">{formatUSD(it.line_total)}</span>
              </div>
            ))}
          </div>
          <dl className="co-totals" style={{ marginTop: 4 }}>
            <div><dt>Subtotal</dt><dd>{formatUSD(ord.subtotal)}</dd></div>
            {ord.discount_total > 0 && (
              <div className="co-totals-disc"><dt>Volume discount</dt><dd>−{formatUSD(ord.discount_total)}</dd></div>
            )}
            <div><dt>Shipping</dt><dd>{ord.shipping_cost === 0 ? "Free" : formatUSD(ord.shipping_cost)}</dd></div>
            <div className="co-totals-grand"><dt>Total</dt><dd>{formatUSD(ord.total)}</dd></div>
          </dl>
        </div>

        {(addr.line1 || addr.city) && (
          <div className="co-conf-summary">
            <div className="co-conf-sec-h">Shipping to</div>
            <p className="co-conf-addr">
              {ord.customer_name}<br />
              {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
              {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}<br />
              {addr.country}
            </p>
          </div>
        )}

        <Link href="/catalog" className="btn btn-dark co-conf-cta">Continue shopping</Link>
        <p className="co-rou font-mono" style={{ marginTop: 16 }}>
          For research use only · not for human or animal consumption
        </p>
      </div>
    </main>
  );
}
