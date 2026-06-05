-- ════════════════════════════════════════════════════════════════════
-- 0034 — Correctif critique : unification du split RLS tenant.
--
-- PROBLÈME (audit C-5) :
--   • Migrations 0001-0025 RLS → lisent public.memberships via public.current_tenant_ids()
--   • Migration 0032 auth → écrit dans atlas_people.tenant_memberships
--   • Ces deux tables ne sont JAMAIS synchronisées → toutes les RLS legacy cassées
--     pour les utilisateurs onboardés via le flow 0032.
--
-- SOLUTION (deux étapes) :
--   1. Redéfinir public.current_tenant_ids() pour lire EN PRIORITÉ
--      atlas_people.tenant_memberships, avec fallback sur public.memberships.
--   2. Ajouter un trigger de synchronisation : toute entrée dans
--      atlas_people.tenant_memberships est propagée vers public.memberships.
--
-- Cette migration est IDEMPOTENTE (CREATE OR REPLACE / IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════════

-- ── ÉTAPE 1 : Redéfinir public.current_tenant_ids() ─────────────────
-- Avant : lit public.memberships (alimenté par l'ancien flow admin)
-- Après  : lit atlas_people.tenant_memberships EN PRIORITÉ, puis fallback
--          sur public.memberships pour la compatibilité ascendante.

create or replace function public.current_tenant_ids()
returns setof uuid
language sql stable security definer
set search_path = atlas_people, public
as $$
  -- Source principale : tenant_memberships (flow auth 0032)
  select tenant_id
  from atlas_people.tenant_memberships
  where user_id = auth.uid()

  union

  -- Fallback : ancienne table public.memberships (legacy)
  select tenant_id
  from public.memberships
  where user_id = auth.uid()

  union

  -- Démo tenant : accessible à tout user authentifié sans appartenance explicite
  select '11111111-1111-1111-1111-111111111111'::uuid
  where auth.uid() is not null
    and not exists (
      select 1 from atlas_people.tenant_memberships where user_id = auth.uid()
    )
    and not exists (
      select 1 from public.memberships where user_id = auth.uid()
    );
$$;

-- ── Redéfinir public.is_hr_or_admin() de même ────────────────────────
create or replace function public.is_hr_or_admin(p_tenant uuid)
returns boolean
language sql stable security definer
set search_path = atlas_people, public
as $$
  select exists (
    select 1 from atlas_people.tenant_memberships
    where user_id = auth.uid()
      and tenant_id = p_tenant
      and role in ('super_admin','admin','hr')
  )
  or exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and tenant_id = p_tenant
      and role in ('admin','hr','super_admin')
  );
$$;

-- ── ÉTAPE 2 : Trigger de synchronisation ─────────────────────────────
-- Toute entrée dans atlas_people.tenant_memberships est propagée vers
-- public.memberships pour que les anciennes politiques RLS continuent de
-- fonctionner sans modification.

-- Vérifier que public.memberships a bien la colonne role (compatible)
-- Si la colonne n'existe pas, on la crée prudemment.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'memberships'
      and column_name = 'role'
  ) then
    alter table public.memberships add column if not exists role text not null default 'employee';
  end if;
end; $$;

-- Fonction de synchronisation
create or replace function atlas_people.sync_membership_to_public()
returns trigger
language plpgsql security definer
set search_path = atlas_people, public
as $$
begin
  if TG_OP = 'INSERT' or TG_OP = 'UPDATE' then
    insert into public.memberships (user_id, tenant_id, role)
    values (NEW.user_id, NEW.tenant_id, NEW.role)
    on conflict (user_id, tenant_id) do update
      set role = EXCLUDED.role;
    return NEW;
  elsif TG_OP = 'DELETE' then
    delete from public.memberships
    where user_id = OLD.user_id and tenant_id = OLD.tenant_id;
    return OLD;
  end if;
  return null;
end;
$$;

-- Attacher le trigger sur la table authoritative
drop trigger if exists trig_sync_membership on atlas_people.tenant_memberships;
create trigger trig_sync_membership
  after insert or update or delete on atlas_people.tenant_memberships
  for each row execute function atlas_people.sync_membership_to_public();

-- ── ÉTAPE 3 : Backfill initial ────────────────────────────────────────
-- Synchronise les entrées existantes dans tenant_memberships vers public.memberships
insert into public.memberships (user_id, tenant_id, role)
select user_id, tenant_id, role
from atlas_people.tenant_memberships
on conflict (user_id, tenant_id) do update set role = EXCLUDED.role;
