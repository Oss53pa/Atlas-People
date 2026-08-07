-- =====================================================================
-- 0068 — Workspace actif, et un workspace par formule
--
-- PROBLÈME OBSERVÉ EN PRODUCTION.
-- La landing propose 5 formules, mais le produit affiché après connexion
-- n'est pas une propriété du lien cliqué : c'est `tenants.tenant_type` du
-- workspace de l'utilisateur. Avec un seul workspace en mode `entreprise`,
-- les 5 formules ouvraient toutes Atlas People Core.
--
-- CE QUE CETTE MIGRATION REND POSSIBLE : plusieurs workspaces par compte,
-- un par formule, et un workspace ACTIF qui décide de ce que l'on voit.
--
-- LE PIÈGE QU'ELLE FERME.
-- `current_tenant_ids()` est le point de passage de TOUTES les policies
-- RLS. Elle renvoyait l'intégralité des appartenances : dès qu'un compte
-- en aurait eu cinq, chaque écran aurait affiché les données des cinq
-- workspaces FUSIONNÉES — collaborateurs, bulletins, clients mélangés.
-- Le cloisonnement se règle donc ici, à la source, et non écran par
-- écran : aucune requête applicative n'a besoin de changer.
--
-- COMPATIBILITÉ. Sans workspace actif enregistré, la fonction se comporte
-- exactement comme avant (toutes les appartenances, repli démo si aucune).
-- Les comptes existants ne voient aucune différence.
-- =====================================================================

-- ── 1. Workspace actif ───────────────────────────────────────────────
create table if not exists atlas_people.user_active_tenant (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  tenant_id  uuid not null references atlas_people.tenants(id) on delete cascade,
  updated_at timestamptz not null default now()
);

comment on table atlas_people.user_active_tenant is
  'Workspace couramment ouvert par un utilisateur qui en possède plusieurs. Détermine le périmètre RLS via current_tenant_ids().';

alter table atlas_people.user_active_tenant enable row level security;

-- Lecture de sa propre ligne seulement. L'écriture passe par
-- set_active_tenant(), qui vérifie l'appartenance — un update direct
-- permettrait de pointer un workspace auquel on n'appartient pas.
drop policy if exists user_active_tenant_self_read on atlas_people.user_active_tenant;
create policy user_active_tenant_self_read
  on atlas_people.user_active_tenant
  for select
  using (user_id = auth.uid());

revoke insert, update, delete on atlas_people.user_active_tenant from anon, authenticated;
grant select on atlas_people.user_active_tenant to authenticated;

-- ── 2. Périmètre RLS : le workspace actif prime ──────────────────────
create or replace function atlas_people.current_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path to 'atlas_people', 'public'
as $function$
  -- (a) Workspace actif, à condition qu'il reste une appartenance légitime.
  select a.tenant_id
  from atlas_people.user_active_tenant a
  where a.user_id = auth.uid()
    and exists (
      select 1 from atlas_people.tenant_memberships m
      where m.user_id = auth.uid() and m.tenant_id = a.tenant_id
    )

  union all

  -- (b) Aucun workspace actif valide : toutes les appartenances, comme avant.
  select m.tenant_id
  from atlas_people.tenant_memberships m
  where m.user_id = auth.uid()
    and not exists (
      select 1
      from atlas_people.user_active_tenant a2
      join atlas_people.tenant_memberships m2
        on m2.user_id = a2.user_id and m2.tenant_id = a2.tenant_id
      where a2.user_id = auth.uid()
    )

  union all

  -- (c) Repli démonstration : compte authentifié sans aucune appartenance.
  select '11111111-1111-1111-1111-111111111111'::uuid
  where auth.uid() is not null
    and not exists (
      select 1 from atlas_people.tenant_memberships where user_id = auth.uid()
    );
$function$;

-- ── 3. Choisir son workspace actif ───────────────────────────────────
create or replace function atlas_people.set_active_tenant(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = atlas_people, public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED: aucune session.';
  end if;

  -- On ne peut activer qu'un workspace dont on est membre : sans ce
  -- contrôle, la fonction serait un contournement direct de la RLS.
  if not exists (
    select 1 from atlas_people.tenant_memberships
    where user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'NOT_A_MEMBER: ce workspace ne vous est pas accessible.';
  end if;

  insert into atlas_people.user_active_tenant (user_id, tenant_id, updated_at)
  values (auth.uid(), p_tenant_id, now())
  on conflict (user_id) do update
    set tenant_id = excluded.tenant_id, updated_at = now();
end;
$$;

revoke all on function atlas_people.set_active_tenant(uuid) from public, anon;
grant execute on function atlas_people.set_active_tenant(uuid) to authenticated;

-- ── 4. Lister ses workspaces ─────────────────────────────────────────
-- SECURITY DEFINER obligatoire : une lecture directe de `tenants` est
-- filtrée par current_tenant_ids(), donc réduite au workspace actif —
-- le sélecteur ne verrait jamais les autres.
create or replace function atlas_people.my_workspaces()
returns table(
  tenant_id   uuid,
  name        text,
  tenant_type text,
  role        text,
  is_active   boolean,
  added_at    timestamptz
)
language sql
stable
security definer
set search_path = atlas_people, public
as $$
  select t.id, t.name, t.tenant_type, m.role,
         coalesce(a.tenant_id = t.id, false),
         m.added_at
  from atlas_people.tenant_memberships m
  join atlas_people.tenants t on t.id = m.tenant_id
  left join atlas_people.user_active_tenant a on a.user_id = auth.uid()
  where m.user_id = auth.uid()
  order by m.added_at asc nulls last;
$$;

revoke all on function atlas_people.my_workspaces() from public, anon;
grant execute on function atlas_people.my_workspaces() to authenticated;

-- ── 5. Créer le workspace d'une formule ──────────────────────────────
-- Complète provision_own_workspace (0066), qui refuse dès qu'une
-- appartenance existe — donc incapable de créer le 2ᵉ workspace.
--
-- Cette fonction ne revendique JAMAIS un workspace existant : elle en
-- crée un vierge dont l'appelant est propriétaire, ou renvoie celui
-- qu'il possède déjà dans ce mode. Elle est donc bornée à un workspace
-- par formule et par compte, soit cinq au maximum.
create or replace function atlas_people.provision_product_workspace(
  p_tenant_type text,
  p_name        text default null
)
returns table(tenant_id uuid, tenant_name text, role text, created boolean)
language plpgsql
security definer
set search_path = atlas_people, public
as $$
declare
  v_user    uuid := auth.uid();
  v_existing record;
  v_cfg     record;
  v_geo     record;
  v_email   text;
  v_meta    jsonb;
  v_name    text;
  v_country text;
  v_new     uuid;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED: aucune session.';
  end if;

  if p_tenant_type not in ('entreprise','cabinet_complet','cabinet_paie','cabinet_mixte','cabinet_agence') then
    raise exception 'UNKNOWN_TENANT_TYPE: %', p_tenant_type;
  end if;

  -- Idempotent : un seul workspace par formule et par compte.
  select m.tenant_id as tid, m.role as rle, t.name as nme into v_existing
  from atlas_people.tenant_memberships m
  join atlas_people.tenants t on t.id = m.tenant_id
  where m.user_id = v_user and t.tenant_type = p_tenant_type
  order by m.added_at asc nulls last
  limit 1;

  if found then
    return query select v_existing.tid, v_existing.nme, v_existing.rle, false;
    return;
  end if;

  select u.email, coalesce(u.raw_user_meta_data, '{}'::jsonb)
    into v_email, v_meta
  from auth.users u where u.id = v_user;

  if v_email is null then
    raise exception 'USER_NOT_FOUND: %', v_user;
  end if;

  select * into v_cfg from atlas_people.tenant_provisioning_config where singleton;
  if not found then
    raise exception 'PROVISIONING_UNCONFIGURED: aucun tenant modèle défini.';
  end if;

  v_name := left(coalesce(
    nullif(btrim(p_name), ''),
    nullif(btrim(v_meta->>'company_name'), ''),
    nullif(split_part(v_email, '@', 1), ''),
    'Workspace'
  ), 120);

  v_country := upper(btrim(coalesce(
    nullif(btrim(v_meta->>'country_code'), ''),
    v_cfg.default_country
  )));

  select * into v_geo from atlas_people.country_monetary_zones where code = v_country;
  if not found then
    select * into v_geo from atlas_people.country_monetary_zones where code = v_cfg.default_country;
  end if;

  insert into atlas_people.tenants (name, zone, currency, countries, tenant_type)
  values (v_name, v_geo.zone, v_geo.currency, array[v_geo.code], p_tenant_type)
  returning id into v_new;

  -- Appartenance avant owner_user_id : le trigger de 0052 protège le
  -- propriétaire dès qu'il est désigné (même ordre qu'en 0066).
  insert into atlas_people.tenant_memberships (user_id, tenant_id, role, added_by)
  values (v_user, v_new, 'admin', v_user);

  update atlas_people.tenants set owner_user_id = v_user where id = v_new;

  insert into atlas_people.tenant_members (tenant_id, email, display_name, role, active)
  values (v_new, v_email, nullif(btrim(coalesce(v_meta->>'full_name', '')), ''), 'admin', true);

  -- Sans country-pack, le moteur de paie n'aurait ni rubrique ni barème.
  perform atlas_people.clone_tenant_referentials(v_new, v_cfg.template_tenant_id);

  return query select v_new, v_name, 'admin'::text, true;
end;
$$;

revoke all on function atlas_people.provision_product_workspace(text, text) from public, anon;
grant execute on function atlas_people.provision_product_workspace(text, text) to authenticated;
