create type public.affiliate_status as enum ('active', 'inactive');

create table public.affiliates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  code text not null unique,
  commission_rate numeric(5,2) not null default 0,
  status public.affiliate_status not null default 'active',
  created_at timestamptz not null default now()
);

alter table public.orders
  add constraint orders_affiliate_id_fkey
  foreign key (affiliate_id) references public.affiliates(id) on delete set null;

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  carrier text,
  service text,
  tracking_number text,
  label_url text,
  cost numeric(10,2),
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index on public.shipments (order_id);

alter table public.affiliates enable row level security;
alter table public.shipments enable row level security;

create policy "staff all affiliates" on public.affiliates
  for all using (public.is_staff()) with check (public.is_staff());
create policy "staff all shipments" on public.shipments
  for all using (public.is_staff()) with check (public.is_staff());

grant all on public.affiliates to service_role;
grant select, insert, update, delete on public.affiliates to authenticated;
grant all on public.shipments to service_role;
grant select, insert, update, delete on public.shipments to authenticated;
