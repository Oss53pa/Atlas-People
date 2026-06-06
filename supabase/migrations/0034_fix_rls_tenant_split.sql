-- ════════════════════════════════════════════════════════════════════
-- 0034 — Correctif RLS : alias public + is_hr_or_admin unifié.
--
-- CONTEXTE (audit C-5) :
--   Dans ce projet Supabase, atlas_people.current_tenant_ids() lit déjà
--   atlas_people.tenant_memberships via migration 0032. Il n'existe pas
--   de table public.memberships.
--
-- CE QUE FAIT CETTE MIGRATION :
--   1. Redéfinit atlas_people.is_hr_or_admin() avec search_path explicite
--   2. Crée public.current_tenant_ids() comme alias délégant vers la version
--      atlas_people — assure la compatibilité des politiques RLS pré-0032
--      qui appelaient la version non-qualifiée.
--   3. Crée public.is_hr_or_admin() de même.
-- ════════════════════════════════════════════════════════════════════

create or replace function atlas_people.is_hr_or_admin(p_tenant uuid)
returns boolean
language sql stable security definer
set search_path = atlas_people, public
as $$
  select exists (
    select 1 from atlas_people.tenant_memberships
    where user_id = auth.uid()
      and tenant_id = p_tenant
      and role in ('super_admin','admin','hr')
  );
$$;

-- Alias public.current_tenant_ids() → délègue à atlas_people
create or replace function public.current_tenant_ids()
returns setof uuid
language sql stable security definer
set search_path = atlas_people, public
as $$
  select atlas_people.current_tenant_ids();
$$;

-- Alias public.is_hr_or_admin() → délègue à atlas_people
create or replace function public.is_hr_or_admin(p_tenant uuid)
returns boolean
language sql stable security definer
set search_path = atlas_people, public
as $$
  select atlas_people.is_hr_or_admin(p_tenant);
$$;
