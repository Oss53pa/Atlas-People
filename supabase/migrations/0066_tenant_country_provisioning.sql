-- =====================================================================
-- 0066 — Pays du workspace : provisionnement et réglage
--
-- CE QUE 0065 LAISSAIT EN SUSPENS.
-- Tout tenant créé héritait de UEMOA / XOF / {CI} en dur, et aucune
-- interface ne permettait d'en changer : `tenants.zone`, `currency` et
-- `countries` n'étaient écrits nulle part dans l'application (seul
-- `tenant_type` l'était, depuis AdminWorkspacePage). Un client camerounais
-- se retrouvait donc avec un workspace en XOF, définitivement.
--
-- CE QUE FAIT CETTE MIGRATION :
--   1. `country_monetary_zones` — les 14 pays du cahier avec zone, devise
--      et caisse sociale, côté base. Miroir de `src/data/countries.ts`,
--      qui restait jusqu'ici la seule source et n'était pas interrogeable
--      depuis le SQL. C'est cette table qui rend le provisionnement
--      capable de déduire zone et devise d'un code pays.
--   2. Provisionnement sensible au pays — `p_country` explicite, sinon
--      les métadonnées du compte (`country_code`, `country`, `pays`),
--      sinon le défaut configuré. Zone et devise en découlent.
--   3. `set_tenant_countries()` — réglage par un administrateur.
--
-- RÈGLE MONÉTAIRE, appliquée en base et pas seulement à l'écran :
-- « XOF (UEMOA) et XAF (CEMAC) ne se mélangent jamais dans un calcul »
-- (CountrySwitcher). Donc les pays d'un workspace doivent partager une
-- zone, et la devise ne peut plus bouger dès qu'un bulletin existe —
-- sinon des montants déjà calculés changeraient de sens rétroactivement.
-- =====================================================================

-- ── 1. Référentiel des zones monétaires ──────────────────────────────
create table if not exists atlas_people.country_monetary_zones (
  code        text primary key,
  name        text not null,
  zone        atlas_people.monetary_zone not null,
  currency    atlas_people.currency_code  not null,
  social_fund text not null
);

alter table atlas_people.country_monetary_zones enable row level security;

drop policy if exists country_monetary_zones_read on atlas_people.country_monetary_zones;
create policy country_monetary_zones_read
  on atlas_people.country_monetary_zones for select
  to authenticated using (true);

grant select on atlas_people.country_monetary_zones to authenticated;

insert into atlas_people.country_monetary_zones (code, name, zone, currency, social_fund) values
  ('CI', 'Côte d''Ivoire',      'UEMOA', 'XOF', 'CNPS'),
  ('SN', 'Sénégal',             'UEMOA', 'XOF', 'IPRES + CSS'),
  ('ML', 'Mali',                'UEMOA', 'XOF', 'INPS'),
  ('BF', 'Burkina Faso',        'UEMOA', 'XOF', 'CNSS'),
  ('BJ', 'Bénin',               'UEMOA', 'XOF', 'CNSS'),
  ('TG', 'Togo',                'UEMOA', 'XOF', 'CNSS'),
  ('NE', 'Niger',               'UEMOA', 'XOF', 'CNSS'),
  ('GW', 'Guinée-Bissau',       'UEMOA', 'XOF', 'INPS'),
  ('CM', 'Cameroun',            'CEMAC', 'XAF', 'CNPS'),
  ('GA', 'Gabon',               'CEMAC', 'XAF', 'CNSS + CNAMGS'),
  ('CG', 'Congo',               'CEMAC', 'XAF', 'CNSS'),
  ('TD', 'Tchad',               'CEMAC', 'XAF', 'CNPS'),
  ('CF', 'RCA',                 'CEMAC', 'XAF', 'CNSS'),
  ('GQ', 'Guinée Équatoriale',  'CEMAC', 'XAF', 'INSESO')
on conflict (code) do update
  set name = excluded.name, zone = excluded.zone,
      currency = excluded.currency, social_fund = excluded.social_fund;

-- Le pays par défaut du provisionnement devient explicite et vérifiable.
alter table atlas_people.tenant_provisioning_config
  add column if not exists default_country text
    references atlas_people.country_monetary_zones(code);

update atlas_people.tenant_provisioning_config
set default_country = 'CI'
where default_country is null;

-- ── 2. Provisionnement sensible au pays ──────────────────────────────
-- Les façades sont supprimées puis recréées : ajouter un paramètre à
-- défaut créerait une surcharge, et l'appel PostgREST deviendrait ambigu.
drop function if exists atlas_people.provision_own_workspace(text);
drop function if exists atlas_people.provision_workspace_for_user(uuid, text);
drop function if exists atlas_people.provision_workspace_internal(uuid, text);

create or replace function atlas_people.provision_workspace_internal(
  p_user_id uuid,
  p_name    text default null,
  p_country text default null
)
returns table(tenant_id uuid, tenant_name text, role text, created boolean)
language plpgsql
security definer
set search_path = atlas_people, public
as $$
declare
  v_existing record;
  v_cfg      record;
  v_geo      record;
  v_email    text;
  v_meta     jsonb;
  v_name     text;
  v_country  text;
  v_new      uuid;
begin
  if p_user_id is null then
    raise exception 'AUTH_REQUIRED: aucun utilisateur.';
  end if;

  -- Idempotence : une appartenance existante prime toujours.
  -- Les champs sont aliasés : `tenant_id` et `role` sont aussi des
  -- paramètres OUT de cette fonction, donc en scope — sans alias, plpgsql
  -- lève une ambiguïté de nom.
  select m.tenant_id as tid, m.role as rle, t.name as nme into v_existing
  from atlas_people.tenant_memberships m
  join atlas_people.tenants t on t.id = m.tenant_id
  where m.user_id = p_user_id
  order by m.added_at asc nulls last
  limit 1;

  if found then
    return query select v_existing.tid, v_existing.nme, v_existing.rle, false;
    return;
  end if;

  select u.email, coalesce(u.raw_user_meta_data, '{}'::jsonb)
    into v_email, v_meta
  from auth.users u where u.id = p_user_id;

  if v_email is null then
    raise exception 'USER_NOT_FOUND: %', p_user_id;
  end if;

  -- Une invitation en attente désigne un workspace précis : on ne crée
  -- pas de workspace parallèle qui l'orphelinerait.
  if exists (
    select 1 from atlas_people.tenant_invitations i
    where lower(i.email) = lower(v_email)
      and i.accepted_at is null
      and (i.expires_at is null or i.expires_at > now())
  ) then
    raise exception
      'INVITATION_PENDING: une invitation est en attente pour cette adresse. '
      'Utilisez le jeton reçu par email pour rejoindre le workspace concerné.';
  end if;

  select * into v_cfg from atlas_people.tenant_provisioning_config where singleton;
  if not found then
    raise exception 'PROVISIONING_UNCONFIGURED: aucun tenant modèle défini.';
  end if;

  v_name := coalesce(
    nullif(btrim(p_name), ''),
    nullif(btrim(v_meta->>'company_name'), ''),
    nullif(btrim(v_meta->>'full_name'), ''),
    nullif(split_part(v_email, '@', 1), ''),
    'Workspace'
  );
  v_name := left(v_name, 120);

  -- Pays : argument explicite, sinon métadonnées du compte portail,
  -- sinon défaut configuré. Un code inconnu est ignoré au profit du
  -- défaut plutôt que de faire échouer la création du workspace.
  v_country := upper(btrim(coalesce(
    nullif(btrim(p_country), ''),
    nullif(btrim(v_meta->>'country_code'), ''),
    nullif(btrim(v_meta->>'country'), ''),
    nullif(btrim(v_meta->>'pays'), ''),
    v_cfg.default_country
  )));

  select * into v_geo from atlas_people.country_monetary_zones where code = v_country;
  if not found then
    select * into v_geo from atlas_people.country_monetary_zones where code = v_cfg.default_country;
    v_country := v_cfg.default_country;
  end if;

  insert into atlas_people.tenants (name, zone, currency, countries, tenant_type)
  values (v_name, v_geo.zone, v_geo.currency, array[v_country], 'entreprise')
  returning id into v_new;

  -- Appartenance AVANT owner_user_id : le trigger de 0052 protège le
  -- propriétaire dès qu'il est désigné, l'ordre inverse serait plus fragile.
  insert into atlas_people.tenant_memberships (user_id, tenant_id, role, added_by)
  values (p_user_id, v_new, 'admin', p_user_id);

  update atlas_people.tenants set owner_user_id = p_user_id where id = v_new;

  insert into atlas_people.tenant_members (tenant_id, email, display_name, role, active)
  values (v_new, v_email, nullif(btrim(coalesce(v_meta->>'full_name', '')), ''), 'admin', true);

  -- Sans country-pack, le moteur de paie n'aurait aucune rubrique.
  perform atlas_people.clone_tenant_referentials(v_new, v_cfg.template_tenant_id);

  return query select v_new, v_name, 'admin'::text, true;
end;
$$;

revoke all on function atlas_people.provision_workspace_internal(uuid, text, text) from public;
revoke all on function atlas_people.provision_workspace_internal(uuid, text, text) from anon;
revoke all on function atlas_people.provision_workspace_internal(uuid, text, text) from authenticated;

-- Façade client : l'appelant ne provisionne QUE pour lui-même.
create or replace function atlas_people.provision_own_workspace(
  p_name    text default null,
  p_country text default null
)
returns table(tenant_id uuid, tenant_name text, role text, created boolean)
language plpgsql
security definer
set search_path = atlas_people, public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED: appel anonyme interdit.';
  end if;
  return query select * from atlas_people.provision_workspace_internal(v_uid, p_name, p_country);
end;
$$;

revoke all on function atlas_people.provision_own_workspace(text, text) from public;
revoke all on function atlas_people.provision_own_workspace(text, text) from anon;
grant execute on function atlas_people.provision_own_workspace(text, text) to authenticated;

-- Façade serveur par identifiant.
create or replace function atlas_people.provision_workspace_for_user(
  p_user_id uuid,
  p_name    text default null,
  p_country text default null
)
returns table(tenant_id uuid, tenant_name text, role text, created boolean)
language sql
security definer
set search_path = atlas_people, public
as $$
  select * from atlas_people.provision_workspace_internal(p_user_id, p_name, p_country);
$$;

revoke all on function atlas_people.provision_workspace_for_user(uuid, text, text) from public;
revoke all on function atlas_people.provision_workspace_for_user(uuid, text, text) from anon;
revoke all on function atlas_people.provision_workspace_for_user(uuid, text, text) from authenticated;
grant execute on function atlas_people.provision_workspace_for_user(uuid, text, text) to service_role;

-- Façade serveur par email — celle qu'utilise l'edge function `atlas-sso`.
-- Le SSO ne connaît que l'email : `createUser` ne renvoie pas d'identifiant
-- quand le compte existe déjà, et l'admin API ne sait pas chercher par
-- email sans parcourir toute la table.
create or replace function atlas_people.provision_workspace_for_email(
  p_email   text,
  p_name    text default null,
  p_country text default null
)
returns table(tenant_id uuid, tenant_name text, role text, created boolean)
language plpgsql
security definer
set search_path = atlas_people, public
as $$
declare
  v_uid uuid;
begin
  select u.id into v_uid
  from auth.users u
  where lower(u.email) = lower(btrim(p_email))
  order by u.created_at asc
  limit 1;

  if v_uid is null then
    raise exception 'USER_NOT_FOUND: %', p_email;
  end if;

  return query select * from atlas_people.provision_workspace_internal(v_uid, p_name, p_country);
end;
$$;

revoke all on function atlas_people.provision_workspace_for_email(text, text, text) from public;
revoke all on function atlas_people.provision_workspace_for_email(text, text, text) from anon;
revoke all on function atlas_people.provision_workspace_for_email(text, text, text) from authenticated;
grant execute on function atlas_people.provision_workspace_for_email(text, text, text) to service_role;

-- ── 3. Réglage des pays par un administrateur ────────────────────────
create or replace function atlas_people.set_tenant_countries(
  p_tenant_id uuid,
  p_countries text[]
)
returns table(zone text, currency text, countries text[])
language plpgsql
security definer
set search_path = atlas_people, public
as $$
declare
  v_uid       uuid := auth.uid();
  v_codes     text[];
  v_zones     atlas_people.monetary_zone[];
  v_zone      atlas_people.monetary_zone;
  v_currency  atlas_people.currency_code;
  v_current   record;
  v_bulletins int;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED: appel anonyme interdit.';
  end if;

  if not exists (
    select 1 from atlas_people.tenant_memberships m
    where m.tenant_id = p_tenant_id and m.user_id = v_uid
      and m.role in ('admin', 'super_admin')
  ) then
    raise exception 'FORBIDDEN: réservé aux administrateurs du workspace.';
  end if;

  select array_agg(distinct upper(btrim(c))) into v_codes
  from unnest(coalesce(p_countries, '{}'::text[])) c
  where nullif(btrim(c), '') is not null;

  if v_codes is null or cardinality(v_codes) = 0 then
    raise exception 'COUNTRIES_EMPTY: au moins un pays est requis.';
  end if;

  if exists (
    select 1 from unnest(v_codes) c
    where not exists (select 1 from atlas_people.country_monetary_zones z where z.code = c)
  ) then
    raise exception 'COUNTRY_UNKNOWN: code pays hors des 14 régimes supportés.';
  end if;

  select array_agg(distinct z.zone) into v_zones
  from atlas_people.country_monetary_zones z where z.code = any(v_codes);

  if cardinality(v_zones) > 1 then
    raise exception
      'ZONE_MISMATCH: un workspace ne peut pas mélanger UEMOA (XOF) et CEMAC (XAF) — '
      'les deux devises ne se combinent jamais dans un calcul de paie.';
  end if;

  v_zone := v_zones[1];
  select z.currency into v_currency
  from atlas_people.country_monetary_zones z where z.zone = v_zone limit 1;

  select t.zone as z, t.currency as c into v_current
  from atlas_people.tenants t where t.id = p_tenant_id;

  -- La devise ne peut plus bouger dès qu'un bulletin existe : des montants
  -- déjà calculés changeraient de sens rétroactivement.
  if v_current.c <> v_currency then
    select count(*) into v_bulletins
    from atlas_people.payroll_bulletins b where b.tenant_id = p_tenant_id;

    if v_bulletins > 0 then
      raise exception
        'CURRENCY_LOCKED: % bulletin(s) déjà calculé(s) en %. Changer de zone monétaire '
        'rendrait ces montants faux — créez un workspace distinct pour l''autre zone.',
        v_bulletins, v_current.c;
    end if;
  end if;

  update atlas_people.tenants t
  set countries = v_codes, zone = v_zone, currency = v_currency, updated_at = now()
  where t.id = p_tenant_id;

  return query select v_zone::text, v_currency::text, v_codes;
end;
$$;

revoke all on function atlas_people.set_tenant_countries(uuid, text[]) from public;
revoke all on function atlas_people.set_tenant_countries(uuid, text[]) from anon;
grant execute on function atlas_people.set_tenant_countries(uuid, text[]) to authenticated;
