create type public.order_status as enum
  ('pending','paid','fulfilled','shipped','delivered','cancelled','refunded');
create type public.payment_method as enum
  ('venmo','cashapp','zelle','card','applepay','googlepay','crypto','other');
create type public.payment_status as enum ('unpaid','paid','refunded');
create type public.payment_record_status as enum ('pending','confirmed','refunded');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  shipping_address jsonb,
  status public.order_status not null default 'pending',
  payment_method public.payment_method not null default 'other',
  payment_status public.payment_status not null default 'unpaid',
  subtotal numeric(10,2) not null default 0,
  shipping_cost numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  affiliate_id uuid, -- FK added in 0005 once affiliates exists
  notes text,
  created_by uuid references public.staff(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  size_id uuid references public.product_sizes(id),
  product_name text not null,
  mg text,
  unit_price numeric(10,2) not null,
  quantity integer not null default 1,
  line_total numeric(10,2) not null
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method public.payment_method not null,
  amount numeric(10,2) not null,
  status public.payment_record_status not null default 'pending',
  reference text,
  created_at timestamptz not null default now()
);

create index on public.order_items (order_id);
create index on public.payments (order_id);
create index on public.orders (created_at);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

-- All staff can manage orders/items/payments (revenue gating is enforced at the
-- dashboard/query layer, not here, since staff still process orders).
create policy "staff all orders" on public.orders
  for all using (public.is_staff()) with check (public.is_staff());
create policy "staff all order_items" on public.order_items
  for all using (public.is_staff()) with check (public.is_staff());
create policy "staff all payments" on public.payments
  for all using (public.is_staff()) with check (public.is_staff());

grant all on public.orders to service_role;
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.order_items to service_role;
grant select, insert, update, delete on public.order_items to authenticated;
grant all on public.payments to service_role;
grant select, insert, update, delete on public.payments to authenticated;
