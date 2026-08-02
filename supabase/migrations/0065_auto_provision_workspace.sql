-- =====================================================================
-- 0065 — Provisionnement automatique du workspace d'un nouveau client
--
-- PROBLÈME CORRIGÉ.
-- Atlas People partage son projet Supabase avec les autres applications
-- Atlas Studio. Le trigger `on_auth_user_created` → `public.handle_new_user()`
-- appartient au PORTAIL : il alimente `public.profiles` (et y positionne
-- role='admin' pour les comptes désignés). Atlas People, lui, n'autorise
-- que sur `atlas_people.tenant_memberships` — table que RIEN n'alimentait
-- à la création d'un compte. Conséquence observée en production : un
-- utilisateur légitimement admin côté portail arrivait sans aucune
-- appartenance, et tombait sur TenantBootstrapPage.
--
-- POURQUOI PAS UN TRIGGER SUR auth.users.
-- auth.users est mutualisé entre TaxPilot, Cockpit F&A, Atlas Compta,
-- CockpitJourney… Provisionner un workspace RH à chaque insertion
-- créerait un tenant Atlas People pour tout inscrit d'un autre produit.
-- Le provisionnement doit donc être déclenché par une intention explicite
-- d'entrer dans Atlas People : le SSO `atlas-sso` (appId='atlas-people')
-- côté serveur, ou la première ouverture de l'application côté client.
--
-- RÈGLE RETENUE — un workspace par client :
--   • l'appelant qui n'a AUCUNE appartenance obtient un tenant neuf dont
--     il est admin et propriétaire fondateur ;
--   • l'appelant qui en a déjà une est renvoyé vers elle (idempotent) ;
--   • l'appelant qui a une invitation en attente est REFUSÉ — il doit
--     rejoindre le workspace qui l'attend, pas s'en créer un parallèle.
--
-- Ceci ne rouvre pas la faille fermée par 0057 : on ne revendique jamais
-- un tenant existant, on en crée un vierge. `join_tenant_as_admin` reste
-- gardée à l'identique.
--
-- UN TENANT NEUF DOIT ÊTRE UTILISABLE. Les référentiels de paie sont
-- tenant-scopés (payroll_rubriques, payroll_baremes, payroll_conventions,
-- payroll_profils, payroll_regime_configs…). Un tenant créé à vide n'a
-- donc aucune rubrique ni aucun barème : le moteur de paie n'a rien à
-- calculer. Le provisionnement clone le country-pack depuis un tenant
-- modèle, avec remappage déterministe des identifiants.
-- =====================================================================

-- ── 1. Tenant modèle ─────────────────────────────────────────────────
-- Table de configuration à ligne unique : d'où l'on clone les
-- référentiels, et quels défauts monétaires pour un tenant neuf.
create table if not exists atlas_people.tenant_provisioning_config (
  singleton          boolean primary key default true check (singleton),
  template_tenant_id uuid not null references atlas_people.tenants(id),
  default_zone       atlas_people.monetary_zone not null default 'UEMOA',
  default_currency   atlas_people.currency_code  not null default 'XOF',
  default_countries  text[] not null default array['CI'],
  updated_at         timestamptz not null default now()
);

alter table atlas_people.tenant_provisioning_config enable row level security;
-- Aucune policy : la table n'est lisible que par les fonctions
-- SECURITY DEFINER ci-dessous. Le client n'a rien à y voir.

insert into atlas_people.tenant_provisioning_config (singleton, template_tenant_id)
values (true, '11111111-1111-1111-1111-111111111111')
on conflict (singleton) do nothing;

-- ── 2. Clonage des référentiels ──────────────────────────────────────
-- Remappage des identifiants : md5(cible || ':' || id_source)::uuid.
-- Déterministe, donc les clés étrangères se remappent par la MÊME
-- expression, sans table de correspondance ni second passage.
create or replace function atlas_people.clone_tenant_referentials(
  p_target uuid,
  p_source uuid
)
returns void
language plpgsql
security definer
set search_path = atlas_people, public
as $$
begin
  if p_target = p_source then
    raise exception 'CLONE_SELF: tenant source et cible identiques.';
  end if;

  -- Rubriques (parent_rubrique_id auto-référent → même remappage).
  insert into atlas_people.payroll_rubriques (
    id, tenant_id, code, libelle_fr, libelle_en, category, rubrique_type,
    visible_on_bulletin, visible_position, visible_section,
    enters_base_cnps, enters_base_irpp, enters_base_taxes_assimilees,
    enters_brut_social, enters_brut_fiscal,
    account_debit, account_credit, analytical_axis_1, analytical_axis_2,
    applicable_country_codes, active, effective_from, effective_to, version,
    parent_rubrique_id, status, created_at, created_by,
    validated_at, validated_by, audit_hash
  )
  select
    md5(p_target::text || ':' || r.id::text)::uuid, p_target,
    r.code, r.libelle_fr, r.libelle_en, r.category, r.rubrique_type,
    r.visible_on_bulletin, r.visible_position, r.visible_section,
    r.enters_base_cnps, r.enters_base_irpp, r.enters_base_taxes_assimilees,
    r.enters_brut_social, r.enters_brut_fiscal,
    r.account_debit, r.account_credit, r.analytical_axis_1, r.analytical_axis_2,
    r.applicable_country_codes, r.active, r.effective_from, r.effective_to, r.version,
    case when r.parent_rubrique_id is null then null
         else md5(p_target::text || ':' || r.parent_rubrique_id::text)::uuid end,
    r.status, now(), r.created_by,
    r.validated_at, r.validated_by, r.audit_hash
  from atlas_people.payroll_rubriques r
  where r.tenant_id = p_source
  on conflict (tenant_id, code, version) do nothing;

  insert into atlas_people.payroll_rubrique_formulas (
    id, tenant_id, rubrique_id, version, formula, condition, rounding, decimals,
    dependencies, created_at
  )
  select
    md5(p_target::text || ':' || f.id::text)::uuid, p_target,
    md5(p_target::text || ':' || f.rubrique_id::text)::uuid,
    f.version, f.formula, f.condition, f.rounding, f.decimals,
    f.dependencies, now()
  from atlas_people.payroll_rubrique_formulas f
  where f.tenant_id = p_source;

  -- Barèmes et leurs tranches.
  insert into atlas_people.payroll_baremes (
    id, tenant_id, code, libelle, type, country_code, unit, value,
    effective_from, effective_to, version, reference_legale,
    signed_by, audit_hash, created_at
  )
  select
    md5(p_target::text || ':' || b.id::text)::uuid, p_target,
    b.code, b.libelle, b.type, b.country_code, b.unit, b.value,
    b.effective_from, b.effective_to, b.version, b.reference_legale,
    b.signed_by, b.audit_hash, now()
  from atlas_people.payroll_baremes b
  where b.tenant_id = p_source
  on conflict (tenant_id, code, version) do nothing;

  insert into atlas_people.payroll_baremes_tranches (
    id, tenant_id, bareme_id, ordre, borne_min, borne_max, taux,
    montant_fixe, formule_complement
  )
  select
    md5(p_target::text || ':' || t.id::text)::uuid, p_target,
    md5(p_target::text || ':' || t.bareme_id::text)::uuid,
    t.ordre, t.borne_min, t.borne_max, t.taux, t.montant_fixe, t.formule_complement
  from atlas_people.payroll_baremes_tranches t
  where t.tenant_id = p_source;

  -- Conventions collectives.
  insert into atlas_people.payroll_conventions (
    id, tenant_id, code, libelle, country_code, secteur, date_signature,
    date_application, reference_legale, rules, active, version, created_at
  )
  select
    md5(p_target::text || ':' || c.id::text)::uuid, p_target,
    c.code, c.libelle, c.country_code, c.secteur, c.date_signature,
    c.date_application, c.reference_legale, c.rules, c.active, c.version, now()
  from atlas_people.payroll_conventions c
  where c.tenant_id = p_source
  on conflict (tenant_id, code, version) do nothing;

  -- Profils : convention_id + DEUX tableaux uuid[] de rubriques à remapper.
  insert into atlas_people.payroll_profils (
    id, tenant_id, code, libelle, country_code, convention_id,
    rubriques_par_defaut, rubriques_optionnelles, parametres, active, version, created_at
  )
  select
    md5(p_target::text || ':' || p.id::text)::uuid, p_target,
    p.code, p.libelle, p.country_code,
    case when p.convention_id is null then null
         else md5(p_target::text || ':' || p.convention_id::text)::uuid end,
    case when p.rubriques_par_defaut is null then null else coalesce((
      select array_agg(md5(p_target::text || ':' || u::text)::uuid order by ord)
      from unnest(p.rubriques_par_defaut) with ordinality as x(u, ord)
    ), '{}'::uuid[]) end,
    case when p.rubriques_optionnelles is null then null else coalesce((
      select array_agg(md5(p_target::text || ':' || u::text)::uuid order by ord)
      from unnest(p.rubriques_optionnelles) with ordinality as x(u, ord)
    ), '{}'::uuid[]) end,
    p.parametres, p.active, p.version, now()
  from atlas_people.payroll_profils p
  where p.tenant_id = p_source
  on conflict (tenant_id, code, version) do nothing;

  -- Modèles de bulletin (parent_modele_id auto-référent).
  insert into atlas_people.payroll_modeles (
    id, tenant_id, code, libelle, country_code, profil_id, parent_modele_id,
    parametres, active, version, created_at
  )
  select
    md5(p_target::text || ':' || m.id::text)::uuid, p_target,
    m.code, m.libelle, m.country_code,
    case when m.profil_id is null then null
         else md5(p_target::text || ':' || m.profil_id::text)::uuid end,
    case when m.parent_modele_id is null then null
         else md5(p_target::text || ':' || m.parent_modele_id::text)::uuid end,
    m.parametres, m.active, m.version, now()
  from atlas_people.payroll_modeles m
  where m.tenant_id = p_source
  on conflict (tenant_id, code, version) do nothing;

  insert into atlas_people.payroll_modele_rubriques (
    id, tenant_id, modele_id, rubrique_id, default_value, ordre, optional
  )
  select
    md5(p_target::text || ':' || mr.id::text)::uuid, p_target,
    md5(p_target::text || ':' || mr.modele_id::text)::uuid,
    md5(p_target::text || ':' || mr.rubrique_id::text)::uuid,
    mr.default_value, mr.ordre, mr.optional
  from atlas_people.payroll_modele_rubriques mr
  where mr.tenant_id = p_source;

  -- Régimes pays (CNPS / FDFP / IRPP …).
  insert into atlas_people.payroll_regime_configs (
    id, tenant_id, country_code, country_name, zone, currency, social_fund,
    version, effective_from, income_tax_code, income_tax_label, abatement_bps,
    is_active, notes, created_at, updated_at, created_by
  )
  select
    md5(p_target::text || ':' || g.id::text)::uuid, p_target,
    g.country_code, g.country_name, g.zone, g.currency, g.social_fund,
    g.version, g.effective_from, g.income_tax_code, g.income_tax_label, g.abatement_bps,
    g.is_active, g.notes, now(), now(), g.created_by
  from atlas_people.payroll_regime_configs g
  where g.tenant_id = p_source
  on conflict (tenant_id, country_code) do nothing;

  -- Paramètres de paie par section.
  insert into atlas_people.payroll_tenant_parameters (id, tenant_id, section, params, updated_at)
  select md5(p_target::text || ':' || tp.id::text)::uuid, p_target, tp.section, tp.params, now()
  from atlas_people.payroll_tenant_parameters tp
  where tp.tenant_id = p_source
  on conflict (tenant_id, section) do nothing;

  -- Plan comptable de paie.
  insert into atlas_people.payroll_accounting_mappings (
    id, tenant_id, rubrique_code, account_debit, account_credit,
    analytical_axis_1, analytical_axis_2, created_at
  )
  select
    md5(p_target::text || ':' || am.id::text)::uuid, p_target,
    am.rubrique_code, am.account_debit, am.account_credit,
    am.analytical_axis_1, am.analytical_axis_2, now()
  from atlas_people.payroll_accounting_mappings am
  where am.tenant_id = p_source;
end;
$$;

revoke all on function atlas_people.clone_tenant_referentials(uuid, uuid) from public;
revoke all on function atlas_people.clone_tenant_referentials(uuid, uuid) from anon;
revoke all on function atlas_people.clone_tenant_referentials(uuid, uuid) from authenticated;

-- ── 3. Provisionnement (cœur, non exposé) ────────────────────────────
create or replace function atlas_people.provision_workspace_internal(
  p_user_id uuid,
  p_name    text default null
)
returns table(tenant_id uuid, tenant_name text, role text, created boolean)
language plpgsql
security definer
set search_path = atlas_people, public
as $$
declare
  v_existing   record;
  v_cfg        record;
  v_email      text;
  v_meta       jsonb;
  v_name       text;
  v_new        uuid;
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

  insert into atlas_people.tenants (name, zone, currency, countries, tenant_type)
  values (v_name, v_cfg.default_zone, v_cfg.default_currency, v_cfg.default_countries, 'entreprise')
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

revoke all on function atlas_people.provision_workspace_internal(uuid, text) from public;
revoke all on function atlas_people.provision_workspace_internal(uuid, text) from anon;
revoke all on function atlas_people.provision_workspace_internal(uuid, text) from authenticated;

-- ── 4. Façade client : l'appelant ne provisionne QUE pour lui-même ────
create or replace function atlas_people.provision_own_workspace(p_name text default null)
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
  return query select * from atlas_people.provision_workspace_internal(v_uid, p_name);
end;
$$;

revoke all on function atlas_people.provision_own_workspace(text) from public;
revoke all on function atlas_people.provision_own_workspace(text) from anon;
grant execute on function atlas_people.provision_own_workspace(text) to authenticated;

-- ── 5. Façade serveur : SSO Atlas Studio (service_role uniquement) ───
-- Appelée par l'edge function `atlas-sso` juste après createUser, pour que
-- le workspace existe AVANT que le magic-link ne pose la session.
create or replace function atlas_people.provision_workspace_for_user(
  p_user_id uuid,
  p_name    text default null
)
returns table(tenant_id uuid, tenant_name text, role text, created boolean)
language sql
security definer
set search_path = atlas_people, public
as $$
  select * from atlas_people.provision_workspace_internal(p_user_id, p_name);
$$;

revoke all on function atlas_people.provision_workspace_for_user(uuid, text) from public;
revoke all on function atlas_people.provision_workspace_for_user(uuid, text) from anon;
revoke all on function atlas_people.provision_workspace_for_user(uuid, text) from authenticated;
grant execute on function atlas_people.provision_workspace_for_user(uuid, text) to service_role;
