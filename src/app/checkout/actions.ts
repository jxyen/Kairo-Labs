"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { computeCartTotals, accessoryByCode, type CartLineInput } from "@/lib/products";
import { validateDraft, type CheckoutDraft, type PlaceOrderResult } from "@/lib/checkout";

/* SKU convention must match scripts/seed-products.ts: `${code}-${mg-no-spaces-upper}`. */
function skuFor(code: string, mg: string): string {
  return `${code}-${mg.replace(/\s+/g, "").toUpperCase()}`;
}

/** High-entropy human-readable order number, e.g. "KL-LZ4F9K7Q". */
function genOrderNumber(): string {
  const t = Date.now().toString(36).toUpperCase().slice(-5);
  let r = "";
  for (let i = 0; i < 4; i++) r += "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)];
  return `KL-${t}${r}`;
}

/* ============================================================================
   placeOrder — THE PAYMENT SEAM.

   This creates a real order in Supabase as `pending` / `unpaid` and stops.
   It deliberately does NOT charge anyone, write a `payments` row, or touch
   inventory. The co-founder owns the next step:

     • Automated (e.g. Stripe): use the returned `orderNumber` as payment
       metadata, then a webhook flips status 'pending' -> 'paid', inserts a
       `payments` row, and decrements inventory.
     • Manual (venmo/cashapp/zelle/crypto — already in the payment_method enum):
       the order sits 'pending'; staff mark it paid in the admin dashboard.

   Either way, everything UP TO the money is done and server-validated here.
   See HANDOFF.md for the full contract.
   ========================================================================== */
export async function placeOrder(draft: CheckoutDraft): Promise<PlaceOrderResult> {
  // 1. Re-validate on the server — never trust the client gate alone.
  const errors = validateDraft(draft);
  if (Object.keys(errors).length > 0) {
    return { ok: false, error: Object.values(errors)[0] ?? "Invalid order details." };
  }

  const admin = createAdminClient();

  // 2. Pull AUTHORITATIVE prices from the DB. The client-sent snapshot prices
  //    are never trusted — products price from product_sizes, accessories from
  //    the static ACCESSORIES list.
  const { data: sizes, error: sizesErr } = await admin
    .from("product_sizes")
    .select("id, sku, price");
  if (sizesErr) {
    return { ok: false, error: "Could not verify product catalog. Please try again." };
  }
  const skuMap = new Map((sizes ?? []).map((s) => [s.sku, { id: s.id, price: Number(s.price) }]));

  // 3. Rebuild every line with the server price; reject anything we can't price.
  const resolved: { line: CartLineInput; sizeId: string | null }[] = [];
  for (const it of draft.items) {
    const qty = Math.max(1, Math.floor(it.qty || 1));
    if (it.kind === "accessory") {
      const acc = accessoryByCode(it.code);
      if (!acc) return { ok: false, error: `Unavailable item: ${it.name || it.code}.` };
      resolved.push({
        line: { code: acc.code, sizeMg: null, qty, kind: "accessory", name: acc.name, sub: acc.sub, image: null, unitPrice: acc.price },
        sizeId: null,
      });
    } else {
      if (!it.sizeMg) return { ok: false, error: `Missing size for ${it.name || it.code}.` };
      const row = skuMap.get(skuFor(it.code, it.sizeMg));
      if (!row) return { ok: false, error: `Unavailable item: ${it.name || it.code} ${it.sizeMg}.` };
      resolved.push({
        line: { ...it, qty, kind: "product", unitPrice: row.price },
        sizeId: row.id,
      });
    }
  }

  // 4. Compute authoritative totals from the server-priced lines.
  const totals = computeCartTotals(resolved.map((r) => r.line));
  if (totals.lines.length === 0 || totals.lines.length !== resolved.length || totals.total <= 0) {
    return { ok: false, error: "Your cart is empty or contains unavailable items." };
  }

  const items = totals.lines.map((l, i) => ({
    size_id: resolved[i].sizeId,
    product_name: l.name,
    mg: l.sizeMg,
    unit_price: l.unitPrice,
    quantity: l.qty,
    line_total: l.lineTotal,
  }));

  const noteParts = [
    "Research-use attestation: ACCEPTED.",
    `Shipping method: ${draft.method}.`,
    draft.notes?.trim() ? `Customer note: ${draft.notes.trim()}` : null,
  ].filter(Boolean);

  // 5. Insert the order (pending/unpaid), retrying on the rare order_number clash.
  let orderId: string | null = null;
  let orderNumber = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    orderNumber = genOrderNumber();
    const { data, error } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: draft.contact.name.trim(),
        customer_email: draft.contact.email.trim(),
        customer_phone: draft.contact.phone?.trim() || null,
        shipping_address: { ...draft.shipping, method: draft.method },
        status: "pending",
        payment_method: "other",
        payment_status: "unpaid",
        subtotal: totals.subtotal,
        shipping_cost: totals.shipping,
        discount_total: totals.discount,
        total: totals.total,
        notes: noteParts.join(" "),
      })
      .select("id")
      .single();

    if (!error && data) {
      orderId = data.id;
      break;
    }
    // 23505 = unique_violation on order_number → regenerate and retry.
    if (error && error.code !== "23505") {
      return { ok: false, error: "Could not place your order. Please try again." };
    }
  }

  if (!orderId) {
    return { ok: false, error: "Could not generate a unique order. Please try again." };
  }

  // 6. Insert the line items. On failure, roll back the order so we don't
  //    leave a totals-less order behind.
  const { error: itemsErr } = await admin
    .from("order_items")
    .insert(items.map((i) => ({ ...i, order_id: orderId })));

  if (itemsErr) {
    await admin.from("orders").delete().eq("id", orderId);
    return { ok: false, error: "Could not save your order items. Please try again." };
  }

  return { ok: true, orderNumber };
}
