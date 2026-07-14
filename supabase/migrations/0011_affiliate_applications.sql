-- supabase/migrations/0011_affiliate_applications.sql
-- Affiliate program: public application intake + staff review inbox.
-- Separate from public.affiliates (approved partners). Applications flow:
--   new -> reviewing -> approved | rejected. On approval, staff create the
--   affiliate row + code manually from /admin/affiliates.

create type public.affiliate_application_status as enum (
  'new', 'reviewing', 'approved', 'rejected'
);

create table public.affiliate_applications (
  id uuid primary key default gen_random_uuid(),
  -- Contact
  full_name text not null,
  email text not null,
  phone text,
  -- Reach
  primary_platform text not null,
  primary_handle text not null,
  audience_size text not null,
  other_links text,
  -- Fit
  niche text not null,
  promo_plan text not null,
  experience text,
  website text,
  referral_source text,
  -- Compliance ack (21+ / research-use-only promotion)
  agreed_terms boolean not null default false,
  -- Staff-only review fields
  status public.affiliate_application_status not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.affiliate_applications (status, created_at desc);

alter table public.affiliate_applications enable row level security;

-- Applicants are anon: NO table-level select/insert grant to anon. The only
-- anon write path is the SECURITY DEFINER RPC below (mirrors place_order).
create policy "staff read affiliate_applications" on public.affiliate_applications
  for select using (public.is_staff());
create policy "staff update affiliate_applications" on public.affiliate_applications
  for update using (public.is_staff()) with check (public.is_staff());

grant all on public.affiliate_applications to service_role;
grant select, update on public.affiliate_applications to authenticated;

-- submit_affiliate_application: the ONLY anon write. Trims + validates, ignores
-- any client-supplied status/notes, always inserts as 'new'.
create or replace function public.submit_affiliate_application(p_app jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text := nullif(btrim(p_app->>'full_name'), '');
  v_email text := nullif(btrim(p_app->>'email'), '');
  v_platform text := nullif(btrim(p_app->>'primary_platform'), '');
  v_handle text := nullif(btrim(p_app->>'primary_handle'), '');
  v_audience text := nullif(btrim(p_app->>'audience_size'), '');
  v_niche text := nullif(btrim(p_app->>'niche'), '');
  v_plan text := nullif(btrim(p_app->>'promo_plan'), '');
begin
  if v_name is null or v_email is null or v_platform is null
     or v_handle is null or v_audience is null or v_niche is null or v_plan is null then
    raise exception 'missing required fields';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid email';
  end if;
  if coalesce((p_app->>'agreed_terms')::boolean, false) is not true then
    raise exception 'terms must be accepted';
  end if;

  insert into public.affiliate_applications (
    full_name, email, phone, primary_platform, primary_handle, audience_size,
    other_links, niche, promo_plan, experience, website, referral_source, agreed_terms
  ) values (
    v_name, v_email, nullif(btrim(p_app->>'phone'), ''),
    v_platform, v_handle, v_audience,
    nullif(btrim(p_app->>'other_links'), ''), v_niche, v_plan,
    nullif(btrim(p_app->>'experience'), ''), nullif(btrim(p_app->>'website'), ''),
    nullif(btrim(p_app->>'referral_source'), ''), true
  ) returning id into v_id;

  return jsonb_build_object('id', v_id);
end;
$$;

grant execute on function public.submit_affiliate_application(jsonb) to anon, authenticated, service_role;
