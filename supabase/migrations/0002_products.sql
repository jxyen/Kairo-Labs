create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sub text,
  category text not null,
  image text,
  mechanism text,
  tagline text,
  purity text,
  rating numeric(2,1) default 0,
  reviews integer default 0,
  bestseller boolean not null default false,
  featured boolean not null default false,
  blurb text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  mg text not null,
  price numeric(10,2) not null,
  sku text not null unique,
  created_at timestamptz not null default now()
);

create index on public.product_sizes (product_id);

alter table public.products enable row level security;
alter table public.product_sizes enable row level security;

create policy "staff read products" on public.products
  for select using (public.is_staff());
create policy "staff write products" on public.products
  for all using (public.is_staff()) with check (public.is_staff());

create policy "staff read sizes" on public.product_sizes
  for select using (public.is_staff());
create policy "staff write sizes" on public.product_sizes
  for all using (public.is_staff()) with check (public.is_staff());

grant all on public.products to service_role;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.product_sizes to service_role;
grant select, insert, update, delete on public.product_sizes to authenticated;
