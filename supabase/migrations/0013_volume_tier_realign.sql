-- supabase/migrations/0013_volume_tier_realign.sql
--
-- Repriced volume ladder + blends excluded from it. Rebuilt on top of the 4-arg
-- place_order from 0012_shipping_method.sql, so the standard/priority shipping
-- matrix is carried through unchanged.
--
-- REPRICE — the ladder was 2/10%, 3/15%, 5/20%. The top tier was buy-4-get-1-free,
--   applied retroactively, on units that each carry a full unit of fixed cost, and
--   it undercut the size ladder it competes with (5x Retatrutide 10mg landed within
--   37% of a single 60mg vial while costing 5x the fulfilment). A flat % also bites
--   hardest on low-ASP SKUs. New ladder: 3/5%, 5/10%, 10/15%. The 2-unit tier is
--   dropped -- 2 is the natural repeat quantity, so it was paying for behaviour we
--   already had -- and the ceiling moves to 10 so the discount buys incremental
--   units instead of repricing the same basket.
--
-- EXCLUDE BLENDS — blends/stacks (products.compare_at is not null) are already sold
--   at a standing discount to component value. Stacking the volume tier took a
--   5-pack to ~39% under component value (GLOW: $351.96 vs $574.95). They now keep
--   their standing ~23% and nothing more, while still counting toward the subtotal
--   and the free-shipping threshold.
--
-- MUST stay in sync with VOLUME_TIERS + isBundleProduct in src/lib/products.ts and
-- orderTotals in src/lib/cart/cart.ts.

create or replace function public.place_order(
  p_items jsonb,
  p_customer jsonb,
  p_payment_method public.payment_method,
  p_shipping_method text default 'standard'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_size_id uuid;
  v_qty int;
  v_price numeric(10,2);
  v_mg text;
  v_name text;
  v_active boolean;
  v_compare_at numeric(10,2);
  v_line numeric(10,2);
  v_frac numeric;
  v_ship_method text := coalesce(p_shipping_method, 'standard');
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_merch numeric(10,2);
  v_shipping numeric(10,2);
  v_total numeric(10,2);
  v_order_id uuid;
  v_number text;
  v_alpha text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_tries int := 0;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'cart is empty';
  end if;
  if v_ship_method not in ('standard', 'priority') then
    raise exception 'invalid shipping method: %', v_ship_method;
  end if;

  -- Pass 1: validate + accumulate totals.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_size_id := (v_item->>'size_id')::uuid;
    v_qty := least(greatest(coalesce((v_item->>'quantity')::int, 1), 1), 99);
    select ps.price, ps.mg, p.name, p.active, p.compare_at
      into v_price, v_mg, v_name, v_active, v_compare_at
      from public.product_sizes ps join public.products p on p.id = ps.product_id
      where ps.id = v_size_id;
    if v_price is null then raise exception 'unknown product size: %', v_size_id; end if;
    if not v_active then raise exception 'product is no longer available: %', v_name; end if;
    v_line := round(v_price * v_qty, 2);
    v_subtotal := v_subtotal + v_line;
    -- Blends/stacks (compare_at set) already carry a standing discount to their
    -- component value, so the volume tier does not stack on top of them.
    if v_compare_at is null then
      v_frac := case when v_qty >= 10 then 0.15 when v_qty >= 5 then 0.10 when v_qty >= 3 then 0.05 else 0 end;
      v_discount := v_discount + round(v_line * v_frac, 2);
    end if;
  end loop;

  v_merch := v_subtotal - v_discount;
  -- Price matrix (mirror of shippingCost in src/lib/cart/cart.ts). Threshold 150 = FREE_SHIP_THRESHOLD.
  v_shipping := case
    when v_merch <= 0 then 0
    when v_ship_method = 'priority' and v_merch >= 150 then 11.99
    when v_ship_method = 'priority' then 16.99
    when v_merch >= 150 then 0
    else 9.99
  end;
  v_total := v_merch + v_shipping;

  -- Unique order number.
  loop
    v_tries := v_tries + 1;
    v_number := 'KL-' || to_char(now(), 'YYYYMMDD') || '-' || (
      select string_agg(substr(v_alpha, 1 + floor(random() * length(v_alpha))::int, 1), '')
      from generate_series(1, 4)
    );
    exit when not exists (select 1 from public.orders where order_number = v_number);
    if v_tries > 25 then raise exception 'could not allocate order number'; end if;
  end loop;

  insert into public.orders (
    order_number, customer_name, customer_email, customer_phone, shipping_address,
    status, payment_method, payment_status, shipping_method,
    subtotal, shipping_cost, discount_total, total
  ) values (
    v_number, p_customer->>'name', p_customer->>'email', p_customer->>'phone', p_customer->'address',
    'pending', p_payment_method, 'unpaid', v_ship_method,
    v_subtotal, v_shipping, v_discount, v_total
  ) returning id into v_order_id;

  -- Pass 2: insert line items.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_size_id := (v_item->>'size_id')::uuid;
    v_qty := least(greatest(coalesce((v_item->>'quantity')::int, 1), 1), 99);
    select ps.price, ps.mg, p.name into v_price, v_mg, v_name
      from public.product_sizes ps join public.products p on p.id = ps.product_id
      where ps.id = v_size_id;
    insert into public.order_items (order_id, size_id, product_name, mg, unit_price, quantity, line_total)
    values (v_order_id, v_size_id, v_name, v_mg, v_price, v_qty, round(v_price * v_qty, 2));
  end loop;

  return jsonb_build_object('order_number', v_number, 'total', v_total);
end;
$$;

grant execute on function public.place_order(jsonb, jsonb, public.payment_method, text) to anon, authenticated, service_role;
