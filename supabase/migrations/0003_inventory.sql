create type public.inventory_reason as enum ('restock', 'sale', 'adjustment');

create table public.inventory (
  size_id uuid primary key references public.product_sizes(id) on delete cascade,
  quantity_on_hand integer not null default 0,
  reorder_threshold integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  size_id uuid not null references public.product_sizes(id) on delete cascade,
  delta integer not null,
  reason public.inventory_reason not null,
  order_id uuid,
  created_by uuid references public.staff(id),
  created_at timestamptz not null default now()
);

create index on public.inventory_movements (size_id);

alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;

create policy "staff all inventory" on public.inventory
  for all using (public.is_staff()) with check (public.is_staff());
create policy "staff all movements" on public.inventory_movements
  for all using (public.is_staff()) with check (public.is_staff());

grant all on public.inventory to service_role;
grant select, insert, update, delete on public.inventory to authenticated;
grant all on public.inventory_movements to service_role;
grant select, insert, update, delete on public.inventory_movements to authenticated;
