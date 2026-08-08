-- =====================================================================
-- 0072 — Portail client, lot L1 : mandats, registre, libellés, profil
--
-- Met en œuvre le volume 0 du cahier des charges (docs/cdc/00-socle-portail-client.md).
--
-- ARBITRAGE MAJEUR (C1 du CDC). Le jeu de rubriques ne découle plus de la
-- FORMULE DU CABINET mais du MANDAT DU CLIENT, la formule ne servant que de
-- borne. Sans cela, un cabinet 360 ne peut pas servir un client paie et un
-- client mise à disposition avec la bonne nomenclature.
--
-- LE VOCABULAIRE N'EST PAS COSMÉTIQUE (§9). « Travailleurs placés » plutôt
-- qu'« Effectifs » porte la qualification juridique : en mise à disposition
-- l'employeur est l'agence, pas le client. Les libellés vivent en base.
--
-- L'ABSENCE DE LIBELLÉ VAUT ABSENCE DE RUBRIQUE : les cases « absent » du
-- tableau §9 n'ont pas de ligne. portal_section_labels pilote seule ce qui
-- existe pour un mandat donné.
-- =====================================================================

do $$
begin
  -- `mandate_type` (0069) qualifie le mandat CÔTÉ CABINET ; celui-ci
  -- qualifie la relation CÔTÉ CLIENT, d'où le nom distinct.
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='client_mandate_kind' and n.nspname='atlas_people') then
    create type atlas_people.client_mandate_kind as enum ('tiers','conseil','paie','mad','mixte');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='portal_role' and n.nspname='atlas_people') then
    create type atlas_people.portal_role as enum ('dirigeant','rh','finance','site','lecteur');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='portal_grant_level' and n.nspname='atlas_people') then
    create type atlas_people.portal_grant_level as enum ('none','aggregate','nominative');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='portal_contact_status' and n.nspname='atlas_people') then
    create type atlas_people.portal_contact_status as enum ('invite','actif','suspendu','revoque');
  end if;
end $$;

-- ── 1. Mandat du client, borné par la formule (§4, EX-P-001) ─────────
alter table atlas_people.clients
  add column if not exists mandate_kind atlas_people.client_mandate_kind;

create or replace function atlas_people.mandate_allowed_for_tenant(
  p_tenant_type text, p_mandate atlas_people.client_mandate_kind
) returns boolean language sql immutable as $$
  select case p_tenant_type
    when 'entreprise'      then p_mandate = 'tiers'
    when 'cabinet_complet' then p_mandate in ('conseil','paie')
    when 'cabinet_paie'    then p_mandate = 'paie'
    when 'cabinet_mixte'   then p_mandate in ('conseil','paie','mad','mixte')
    when 'cabinet_agence'  then p_mandate = 'mad'
    else false end;
$$;

-- Contrôlé à l'écriture : un cabinet de paie qui tente un client `mad` est
-- refusé par la BASE, pas seulement par l'écran (recette T-00-08).
create or replace function atlas_people.guard_client_mandate()
returns trigger language plpgsql
set search_path = atlas_people, public as $$
declare v_tenant_type text;
begin
  if new.mandate_kind is null then
    select case t.tenant_type
             when 'entreprise' then 'tiers' when 'cabinet_paie' then 'paie'
             when 'cabinet_agence' then 'mad' else 'conseil' end::atlas_people.client_mandate_kind
      into new.mandate_kind
    from atlas_people.tenants t where t.id = new.tenant_id;
    return new;
  end if;
  select t.tenant_type into v_tenant_type from atlas_people.tenants t where t.id = new.tenant_id;
  if not atlas_people.mandate_allowed_for_tenant(v_tenant_type, new.mandate_kind) then
    raise exception 'MANDAT_HORS_FORMULE: la formule % n''autorise pas le mandat %.',
      v_tenant_type, new.mandate_kind;
  end if;
  return new;
end; $$;

drop trigger if exists trg_guard_client_mandate on atlas_people.clients;
create trigger trg_guard_client_mandate
  before insert or update of mandate_kind, tenant_id on atlas_people.clients
  for each row execute function atlas_people.guard_client_mandate();

update atlas_people.clients c
   set mandate_kind = case t.tenant_type
         when 'entreprise' then 'tiers' when 'cabinet_paie' then 'paie'
         when 'cabinet_agence' then 'mad' else 'conseil' end::atlas_people.client_mandate_kind
  from atlas_people.tenants t
 where t.id = c.tenant_id and c.mandate_kind is null;

alter table atlas_people.clients alter column mandate_kind set not null;

-- EX-P-002 : un client `mixte` porte plusieurs mandats simultanés.
create table if not exists atlas_people.client_mandates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references atlas_people.tenants(id) on delete cascade,
  client_id uuid not null references atlas_people.clients(id) on delete cascade,
  mandate_kind atlas_people.client_mandate_kind not null,
  starts_on date not null default current_date,
  ends_on date, contract_ref text,
  created_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);
create index if not exists idx_client_mandates_client
  on atlas_people.client_mandates (tenant_id, client_id, starts_on desc);

-- ── 2. Registre et vocabulaire par mandat (§9) ───────────────────────
create table if not exists atlas_people.portal_sections_registry (
  section_code text primary key,
  sort_order integer not null,
  icon text,
  is_action_capable boolean not null default false
);

create table if not exists atlas_people.portal_section_labels (
  section_code text not null references atlas_people.portal_sections_registry(section_code) on delete cascade,
  mandate_kind atlas_people.client_mandate_kind not null,
  label text not null, subtitle text, empty_state text not null,
  primary key (section_code, mandate_kind)
);

comment on table atlas_people.portal_section_labels is
  'Vocabulaire par mandat (§9). L''ABSENCE de ligne vaut absence de rubrique.';

insert into atlas_people.portal_sections_registry (section_code, sort_order, icon, is_action_capable) values
  ('workforce',10,'users',false), ('time',20,'calendar',true), ('payroll',30,'wallet',true),
  ('compliance',40,'shield-check',false), ('safety',50,'hard-hat',false),
  ('contract',60,'file-signature',false), ('invoices',70,'receipt',true),
  ('documents',80,'file-text',false), ('requests',90,'message-square',true),
  ('insights',100,'bar-chart',false)
on conflict (section_code) do update set sort_order=excluded.sort_order,
  icon=excluded.icon, is_action_capable=excluded.is_action_capable;

insert into atlas_people.portal_section_labels (section_code, mandate_kind, label, subtitle, empty_state) values
  ('workforce','tiers','Registre du personnel','Obligation légale de l''employeur','Registre non encore publié pour cette période.'),
  ('payroll','tiers','Journal de paie','Par période et par rubrique, avec cumuls','Aucun journal publié à ce jour.'),
  ('compliance','tiers','Déclarations et attestations',null,'Aucune déclaration publiée pour cette période.'),
  ('contract','tiers','Ma mission','Objet, périmètre et échéance de votre accès','Mission non encore décrite.'),
  ('documents','tiers','Documents','Pièces qui vous sont adressées','Aucune pièce ne vous a été adressée.'),
  ('workforce','conseil','Effectifs','Les collaborateurs gérés pour votre compte','Effectifs non encore publiés.'),
  ('time','conseil','Temps et absences',null,'Aucun relevé publié pour cette période.'),
  ('payroll','conseil','Paie','Bulletins et journaux de la période','Paie de la période non encore publiée.'),
  ('compliance','conseil','Conformité','Obligations et échéances suivies pour vous','Aucune échéance sur cette période.'),
  ('safety','conseil','Santé et sécurité',null,'Aucun élément publié.'),
  ('contract','conseil','Mon mandat','Périmètre confié et conditions','Mandat non encore publié.'),
  ('invoices','conseil','Mes factures','Honoraires, période par période','Aucune facture ne vous a été adressée.'),
  ('documents','conseil','Documents','Pièces mises à votre disposition','Aucune pièce ne vous a été adressée.'),
  ('requests','conseil','Mes demandes',null,'Aucune demande en cours.'),
  ('insights','conseil','Indicateurs','Pilotage de la prestation','Indicateurs disponibles après la première période close.'),
  ('workforce','paie','Salariés payés','Périmètre de la paie traitée','Aucun salarié sur cette période.'),
  ('time','paie','Éléments variables','Ce que vous transmettez pour la paie','Aucun élément variable pour cette période.'),
  ('payroll','paie','Bulletins et déclarations','Bulletins produits et déclarations transmises','Paie de la période non encore publiée.'),
  ('compliance','paie','Déclarations sociales',null,'Aucune déclaration exigible sur cette période.'),
  ('contract','paie','Mon mandat de paie','Conditions de traitement et calendrier','Mandat non encore publié.'),
  ('invoices','paie','Mes factures','Honoraires, période par période','Aucune facture ne vous a été adressée.'),
  ('documents','paie','Documents','Pièces mises à votre disposition','Aucune pièce ne vous a été adressée.'),
  ('requests','paie','Mes demandes',null,'Aucune demande en cours.'),
  ('workforce','mad','Travailleurs placés','Les personnes mises à disposition sur vos sites','Aucun travailleur placé sur cette période.'),
  ('time','mad','Pointages et heures','Base de facturation de la période','Aucun relevé publié pour cette période.'),
  ('compliance','mad','Conformité de l''agence','Attestations de vigilance et obligations','Aucune attestation publiée.'),
  ('safety','mad','Sécurité sur mes sites',null,'Aucun élément publié.'),
  ('contract','mad','Mon contrat de mise à disposition',null,'Contrat non encore publié.'),
  ('invoices','mad','Mes factures et relevés',null,'Aucune facture ne vous a été adressée.'),
  ('documents','mad','Documents','Pièces mises à votre disposition','Aucune pièce ne vous a été adressée.'),
  ('requests','mad','Mes demandes de personnel',null,'Aucune demande en cours.'),
  ('insights','mad','Indicateurs de mission',null,'Indicateurs disponibles après la première période close.')
on conflict (section_code, mandate_kind) do update
  set label=excluded.label, subtitle=excluded.subtitle, empty_state=excluded.empty_state;

-- ── 3. Contacts, périmètres et octrois (§5) ──────────────────────────
create table if not exists atlas_people.portal_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references atlas_people.tenants(id) on delete cascade,
  client_id uuid not null references atlas_people.clients(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null, full_name text not null,
  role atlas_people.portal_role not null default 'lecteur',
  status atlas_people.portal_contact_status not null default 'invite',
  invited_at timestamptz, activated_at timestamptz,
  last_seen_at timestamptz, revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, client_id, email)
);

comment on table atlas_people.portal_contacts is
  'Contact externe d''un client. EX-P-003 : ne consomme aucun siège de licence, n''apparaît pas dans l''annuaire interne.';

create table if not exists atlas_people.portal_contact_scopes (
  contact_id uuid not null references atlas_people.portal_contacts(id) on delete cascade,
  scope_type text not null check (scope_type in ('legal_entity','site','department')),
  scope_id uuid not null,
  primary key (contact_id, scope_type, scope_id)
);

create table if not exists atlas_people.portal_access_grants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references atlas_people.tenants(id) on delete cascade,
  client_id uuid not null references atlas_people.clients(id) on delete cascade,
  section_code text not null references atlas_people.portal_sections_registry(section_code),
  level atlas_people.portal_grant_level not null default 'aggregate',
  motive text,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (tenant_id, client_id, section_code)
);

comment on table atlas_people.portal_access_grants is
  'R3 — minimisation graduée : aucun / agrégé / nominatif, jamais un booléen. Le nominatif exige un motif.';

alter table atlas_people.portal_access_grants
  add constraint portal_grant_nominative_needs_motive
  check (level <> 'nominative' or (motive is not null and length(btrim(motive)) >= 10))
  not valid;

-- ── 4. Fonctions d'appui RLS (EX-P-010) ──────────────────────────────
-- Le CDC les nomme `auth.*`. Elles sont créées dans `atlas_people` : le
-- schéma `auth` est géré par la plateforme et une migration Supabase
-- écraserait nos objets.
create or replace function atlas_people.is_portal()
returns boolean language sql stable security definer
set search_path = atlas_people, public as $$
  select exists (select 1 from atlas_people.portal_contacts
                 where user_id = auth.uid() and status = 'actif');
$$;

create or replace function atlas_people.portal_client_ids()
returns setof uuid language sql stable security definer
set search_path = atlas_people, public as $$
  select client_id from atlas_people.portal_contacts
  where user_id = auth.uid() and status = 'actif';
$$;

create or replace function atlas_people.portal_role()
returns atlas_people.portal_role language sql stable security definer
set search_path = atlas_people, public as $$
  select role from atlas_people.portal_contacts
  where user_id = auth.uid() and status = 'actif' limit 1;
$$;

create or replace function atlas_people.portal_scopes()
returns table(scope_type text, scope_id uuid)
language sql stable security definer
set search_path = atlas_people, public as $$
  select s.scope_type, s.scope_id
  from atlas_people.portal_contact_scopes s
  join atlas_people.portal_contacts c on c.id = s.contact_id
  where c.user_id = auth.uid() and c.status = 'actif';
$$;

-- ── 5. Résolution du profil (§4) ─────────────────────────────────────
-- profil = mandat_client ∩ formule_cabinet ∩ grants ∩ rôle du contact
create or replace function atlas_people.portal_profile()
returns table(
  section_code text, label text, subtitle text, empty_state text,
  sort_order integer, icon text,
  grant_level atlas_people.portal_grant_level, is_action_capable boolean)
language sql stable security definer
set search_path = atlas_people, public as $$
  with moi as (
    select c.client_id, c.role, cl.mandate_kind
    from atlas_people.portal_contacts c
    join atlas_people.clients cl on cl.id = c.client_id
    where c.user_id = auth.uid() and c.status = 'actif' limit 1
  )
  select r.section_code, l.label, l.subtitle, l.empty_state, r.sort_order, r.icon,
         coalesce(g.level,'none')::atlas_people.portal_grant_level, r.is_action_capable
  from moi
  join atlas_people.portal_section_labels l on l.mandate_kind = moi.mandate_kind
  join atlas_people.portal_sections_registry r on r.section_code = l.section_code
  left join atlas_people.portal_access_grants g
         on g.client_id = moi.client_id and g.section_code = r.section_code
        and g.revoked_at is null
  where coalesce(g.level,'none') <> 'none'
    and case moi.role
      when 'finance' then r.section_code in ('invoices','payroll','compliance','contract','documents','insights','requests')
      when 'site'    then r.section_code in ('time','safety','workforce','documents')
      when 'rh'      then r.section_code in ('workforce','time','compliance','safety','contract','documents','requests','insights')
      when 'lecteur' then r.section_code in ('documents','contract')
      else true end
  order by r.sort_order;
$$;

revoke all on function atlas_people.is_portal() from public, anon;
revoke all on function atlas_people.portal_client_ids() from public, anon;
revoke all on function atlas_people.portal_role() from public, anon;
revoke all on function atlas_people.portal_scopes() from public, anon;
revoke all on function atlas_people.portal_profile() from public, anon;
grant execute on function atlas_people.is_portal() to authenticated;
grant execute on function atlas_people.portal_client_ids() to authenticated;
grant execute on function atlas_people.portal_role() to authenticated;
grant execute on function atlas_people.portal_scopes() to authenticated;
grant execute on function atlas_people.portal_profile() to authenticated;

-- ── 6. RLS ───────────────────────────────────────────────────────────
alter table atlas_people.client_mandates        enable row level security;
alter table atlas_people.portal_contacts        enable row level security;
alter table atlas_people.portal_contact_scopes  enable row level security;
alter table atlas_people.portal_access_grants   enable row level security;

drop policy if exists client_mandates_tenant on atlas_people.client_mandates;
create policy client_mandates_tenant on atlas_people.client_mandates
  for all to authenticated
  using (tenant_id in (select atlas_people.current_tenant_ids()))
  with check (tenant_id in (select atlas_people.current_tenant_ids()));

drop policy if exists portal_contacts_tenant on atlas_people.portal_contacts;
create policy portal_contacts_tenant on atlas_people.portal_contacts
  for all to authenticated
  using (tenant_id in (select atlas_people.current_tenant_ids()))
  with check (tenant_id in (select atlas_people.current_tenant_ids()));

drop policy if exists portal_access_grants_tenant on atlas_people.portal_access_grants;
create policy portal_access_grants_tenant on atlas_people.portal_access_grants
  for all to authenticated
  using (tenant_id in (select atlas_people.current_tenant_ids()))
  with check (tenant_id in (select atlas_people.current_tenant_ids()));

drop policy if exists portal_contact_scopes_tenant on atlas_people.portal_contact_scopes;
create policy portal_contact_scopes_tenant on atlas_people.portal_contact_scopes
  for all to authenticated
  using (exists (select 1 from atlas_people.portal_contacts c
                 where c.id = contact_id
                   and c.tenant_id in (select atlas_people.current_tenant_ids())));

-- Côté portail : le contact lit sa propre fiche, rien d'autre.
drop policy if exists portal_contacts_self on atlas_people.portal_contacts;
create policy portal_contacts_self on atlas_people.portal_contacts
  for select to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on atlas_people.client_mandates to authenticated;
grant select, insert, update, delete on atlas_people.portal_contacts to authenticated;
grant select, insert, update, delete on atlas_people.portal_contact_scopes to authenticated;
grant select, insert, update, delete on atlas_people.portal_access_grants to authenticated;
grant select on atlas_people.portal_sections_registry to authenticated;
grant select on atlas_people.portal_section_labels to authenticated;
