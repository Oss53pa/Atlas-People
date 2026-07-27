-- ════════════════════════════════════════════════════════════════════
-- 0047 — Correctifs schéma atlas_people (idempotent — safe sur prod pré-provisionné)
--
-- Problèmes corrigés :
--   1. atlas_people.tenants absente sur deploy frais → FK de 0032 non satisfaite
--   2. Colonne tenant_type absente → auth.ts ne peut pas lire le mode produit
--   3. atlas_people.current_employee_ids() absente → resolveSessionContext() plante
-- ════════════════════════════════════════════════════════════════════

-- ── 0) Schéma (idempotent) ────────────────────────────────────────────
create schema if not exists atlas_people;

set search_path = atlas_people, public;

-- ── 1) Table atlas_people.tenants ─────────────────────────────────────
-- FK cible pour tenant_memberships / tenant_members / tenant_invitations.
-- Miroir fonctionnel de public.tenants + colonne tenant_type propre aux produits.
create table if not exists atlas_people.tenants (
  id          uuid primary key,
  name        text not null default '',
  tenant_type text not null default 'entreprise',
  zone        text,
  currency    text,
  countries   text[],
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Ajoute tenant_type si la table existait déjà sans cette colonne (prod pré-provisionné)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'atlas_people'
      and table_name   = 'tenants'
      and column_name  = 'tenant_type'
  ) then
    alter table atlas_people.tenants
      add column tenant_type text not null default 'entreprise';
  end if;
end $$;

-- Contrainte CHECK (idempotente via nom)
do $$
begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where table_schema  = 'atlas_people'
      and table_name    = 'tenants'
      and constraint_name = 'tenants_tenant_type_check'
  ) then
    alter table atlas_people.tenants
      add constraint tenants_tenant_type_check
        check (tenant_type in ('entreprise','cabinet_complet','cabinet_paie','cabinet_mixte','cabinet_agence'));
  end if;
end $$;

-- ── 2) Backfill depuis public.tenants ─────────────────────────────────
insert into atlas_people.tenants (id, name, zone, currency, countries, created_at, updated_at)
select
  id,
  name,
  zone::text,
  currency::text,
  countries,
  created_at,
  updated_at
from public.tenants
on conflict (id) do update
  set name       = excluded.name,
      zone       = excluded.zone,
      currency   = excluded.currency,
      countries  = excluded.countries,
      updated_at = excluded.updated_at;

-- Tenant démo permanent
insert into atlas_people.tenants (id, name, tenant_type)
values ('11111111-1111-1111-1111-111111111111', 'Atlas People Demo', 'entreprise')
on conflict (id) do nothing;

-- ── 3) RLS atlas_people.tenants ───────────────────────────────────────
alter table atlas_people.tenants enable row level security;

drop policy if exists ten_select on atlas_people.tenants;
create policy ten_select on atlas_people.tenants for select
  using (id in (select atlas_people.current_tenant_ids()));

drop policy if exists ten_update on atlas_people.tenants;
create policy ten_update on atlas_people.tenants for update
  using (atlas_people.is_hr_or_admin(id))
  with check (atlas_people.is_hr_or_admin(id));

-- ── 4) atlas_people.current_employee_ids() ───────────────────────────
-- session.ts appelle sb.schema('atlas_people').rpc('current_employee_ids')
-- mais la fonction n'existe qu'en public (migration 0015).
-- Cet alias délègue vers public.employees (même logique, schéma cible).
create or replace function atlas_people.current_employee_ids()
returns setof uuid
language sql stable security definer
set search_path = atlas_people, public
as $$
  select id from public.employees where user_id = auth.uid();
$$;

-- ── 5) Trigger sync public.tenants → atlas_people.tenants ─────────────
-- Assure la cohérence lors de créations futures de tenants via le schéma public.
create or replace function public.sync_tenant_to_atlas_people()
returns trigger language plpgsql security definer
set search_path = atlas_people, public as $$
begin
  insert into atlas_people.tenants (id, name, zone, currency, countries, created_at, updated_at)
  values (
    new.id, new.name,
    new.zone::text, new.currency::text,
    new.countries, new.created_at, new.updated_at
  )
  on conflict (id) do update
    set name = excluded.name, updated_at = excluded.updated_at;
  return new;
end;
$$;

drop trigger if exists sync_tenant_to_ap on public.tenants;
create trigger sync_tenant_to_ap
  after insert or update on public.tenants
  for each row execute function public.sync_tenant_to_atlas_people();
