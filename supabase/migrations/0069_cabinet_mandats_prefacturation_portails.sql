-- =====================================================================
-- 0069 — Domaine cabinet : mandat, préfacturation, portails client
--
-- CE QUI EXISTAIT. Une seule table, `clients` (15 colonnes descriptives).
-- Les écrans Préfacturation, Rapport cabinet et Interface client
-- affichaient des données fictives sous un libellé annonçant des tables
-- `prefactures`, `rapport_cabinet_view` et `client_portals` — qui
-- n'avaient jamais été créées. Cette migration crée le domaine réel.
--
-- TROIS OBJETS MÉTIER, ET POURQUOI ILS SONT DISTINCTS :
--
--   • LE MANDAT (client_contracts) — l'acte juridique par lequel une
--     entreprise cliente (le MANDANT) confie au cabinet (le MANDATAIRE)
--     la gestion de sa RH ou de sa paie. Il porte l'identité légale du
--     mandant (RCCM, NIF, siège, représentant), le périmètre confié, les
--     conditions financières et les clauses. C'est lui qui rend la
--     préfacturation calculable : sans conditions contractuelles, un
--     montant facturé n'est qu'une saisie arbitraire.
--
--   • LA PRÉFACTURE (prefactures + prefacture_lines) — la proposition
--     d'honoraires d'une période, dérivée des conditions du mandat.
--     Elle est détaillée en lignes : c'est le détail qui permet au client
--     de contester un montant, et au cabinet de le justifier.
--
--   • LE PORTAIL CLIENT (client_portals) — l'accès en lecture donné à un
--     contact du client. Un accès n'est pas un booléen : il a un cycle de
--     vie (invité → actif → révoqué), un périmètre de consultation, et
--     doit être journalisé.
--
-- PÉRIMÈTRE DE DONNÉES. Tout est tenant-scopé et suit la RLS maison
-- (`tenant_id in (select current_tenant_ids())`), donc le cloisonnement
-- par workspace de la migration 0068 s'applique sans rien de plus.
-- =====================================================================

-- ── Énumérations ─────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='mandate_type' and n.nspname='atlas_people') then
    create type atlas_people.mandate_type as enum (
      'gestion_rh_complete',  -- RH + paie + administratif
      'paie_seule',           -- production de paie pour le compte du client
      'mise_a_disposition',   -- personnel placé (agence)
      'conseil_ponctuel'      -- mission cadrée dans le temps
    );
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='contract_status' and n.nspname='atlas_people') then
    create type atlas_people.contract_status as enum ('brouillon','actif','suspendu','resilie');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='billing_mode' and n.nspname='atlas_people') then
    create type atlas_people.billing_mode as enum (
      'forfait',            -- montant fixe par période
      'par_collaborateur',  -- prix unitaire × effectif géré
      'par_bulletin',       -- prix unitaire × bulletins produits
      'mixte'               -- forfait + variable
    );
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='billing_period' and n.nspname='atlas_people') then
    create type atlas_people.billing_period as enum ('mensuelle','trimestrielle','annuelle');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='prefacture_status' and n.nspname='atlas_people') then
    create type atlas_people.prefacture_status as enum ('brouillon','validee','envoyee','payee','annulee');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='portal_status' and n.nspname='atlas_people') then
    create type atlas_people.portal_status as enum ('non_active','invite','actif','revoque');
  end if;
end $$;

-- ── 1. Mandat, contrat et conditions ─────────────────────────────────
create table if not exists atlas_people.client_contracts (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references atlas_people.tenants(id) on delete cascade,
  client_id   uuid not null references atlas_people.clients(id) on delete cascade,

  reference     text not null,
  mandate_type  atlas_people.mandate_type not null default 'gestion_rh_complete',
  status        atlas_people.contract_status not null default 'brouillon',

  -- Le MANDANT : identité légale de l'entreprise cliente. Un mandat qui
  -- ne désigne pas précisément son mandant n'est pas opposable.
  mandant_raison_sociale  text not null,
  mandant_forme_juridique text,
  mandant_rccm            text,
  mandant_nif             text,
  mandant_siege           text,
  mandant_representant    text,
  mandant_qualite         text,

  -- Le MANDATAIRE : le cabinet signataire.
  mandataire_signataire text,
  mandataire_qualite    text,

  -- Durée et sortie
  signed_on      date,
  effective_from date not null default current_date,
  effective_to   date,
  notice_days    integer not null default 90 check (notice_days between 0 and 365),
  tacit_renewal  boolean not null default true,

  -- Conditions financières
  billing_mode      atlas_people.billing_mode not null default 'par_collaborateur',
  currency          text not null default 'XOF',
  unit_amount       bigint not null default 0 check (unit_amount >= 0),
  forfait_amount    bigint not null default 0 check (forfait_amount >= 0),
  minimum_amount    bigint not null default 0 check (minimum_amount >= 0),
  billing_period    atlas_people.billing_period not null default 'mensuelle',
  billing_day       integer not null default 1 check (billing_day between 1 and 28),
  payment_terms_days integer not null default 30 check (payment_terms_days between 0 and 180),
  late_penalty_rate numeric(5,2) not null default 0 check (late_penalty_rate >= 0),
  tax_rate          numeric(5,2) not null default 18 check (tax_rate >= 0 and tax_rate <= 100),

  -- Périmètre et engagements de service
  scope_modules   text[] not null default '{}',
  sla_hours       integer check (sla_hours is null or sla_hours > 0),
  payroll_cutoff_day integer check (payroll_cutoff_day is null or payroll_cutoff_day between 1 and 28),
  confidentiality boolean not null default true,
  data_protection boolean not null default true,
  notes           text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, reference)
);

comment on table atlas_people.client_contracts is
  'Mandat confié par une entreprise cliente au cabinet : identité du mandant, périmètre, conditions financières et clauses. Base de calcul des préfactures.';

create index if not exists idx_client_contracts_client on atlas_people.client_contracts (tenant_id, client_id, status);

-- ── 2. Préfactures ───────────────────────────────────────────────────
create table if not exists atlas_people.prefactures (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references atlas_people.tenants(id) on delete cascade,
  client_id   uuid not null references atlas_people.clients(id) on delete cascade,
  contract_id uuid references atlas_people.client_contracts(id) on delete set null,

  reference    text not null,
  period_start date not null,
  period_end   date not null,
  period_label text not null,
  status       atlas_people.prefacture_status not null default 'brouillon',

  currency       text   not null default 'XOF',
  headcount      integer not null default 0 check (headcount >= 0),
  subtotal_amount bigint not null default 0,
  tax_rate       numeric(5,2) not null default 18,
  tax_amount     bigint not null default 0,
  total_amount   bigint not null default 0,

  issued_on  date,
  sent_at    timestamptz,
  due_on     date,
  paid_at    timestamptz,
  payment_reference text,

  notes        text,
  created_by   uuid references auth.users(id) on delete set null,
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, reference),
  check (period_end >= period_start)
);

comment on table atlas_people.prefactures is
  'Proposition d''honoraires d''une période pour un client, dérivée des conditions du mandat.';

create index if not exists idx_prefactures_client on atlas_people.prefactures (tenant_id, client_id, period_start desc);
create index if not exists idx_prefactures_status on atlas_people.prefactures (tenant_id, status, period_start desc);

create table if not exists atlas_people.prefacture_lines (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references atlas_people.tenants(id) on delete cascade,
  prefacture_id uuid not null references atlas_people.prefactures(id) on delete cascade,

  position    integer not null default 1,
  label       text not null,
  kind        text not null default 'prestation'
              check (kind in ('abonnement','collaborateur','bulletin','prestation','remise')),
  quantity    numeric(12,2) not null default 1,
  unit_amount bigint not null default 0,
  amount      bigint not null default 0,
  created_at  timestamptz not null default now()
);

comment on table atlas_people.prefacture_lines is
  'Détail ligne à ligne d''une préfacture — ce qui permet au client de contester un montant et au cabinet de le justifier.';

create index if not exists idx_prefacture_lines_parent on atlas_people.prefacture_lines (prefacture_id, position);

-- ── 3. Portails client ───────────────────────────────────────────────
create table if not exists atlas_people.client_portals (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references atlas_people.tenants(id) on delete cascade,
  client_id  uuid not null references atlas_people.clients(id) on delete cascade,

  contact_name  text not null,
  contact_email text not null,
  status        atlas_people.portal_status not null default 'non_active',

  -- Périmètre de consultation : un accès client n'est jamais « tout ou rien ».
  scope_payslips   boolean not null default true,
  scope_headcount  boolean not null default true,
  scope_compliance boolean not null default true,
  scope_invoices   boolean not null default true,
  scope_documents  boolean not null default false,

  invited_at     timestamptz,
  activated_at   timestamptz,
  revoked_at     timestamptz,
  last_access_at timestamptz,
  user_id        uuid references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, client_id, contact_email)
);

comment on table atlas_people.client_portals is
  'Accès en lecture d''un contact client à son espace. Cycle de vie complet : non activé → invité → actif → révoqué.';

create index if not exists idx_client_portals_client on atlas_people.client_portals (tenant_id, client_id);

create table if not exists atlas_people.client_portal_access (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references atlas_people.tenants(id) on delete cascade,
  portal_id   uuid not null references atlas_people.client_portals(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  action      text not null check (action in ('invitation','activation','consultation','telechargement','revocation')),
  detail      text
);

create index if not exists idx_portal_access_portal on atlas_people.client_portal_access (portal_id, occurred_at desc);

-- ── 4. RLS — périmètre tenant, comme le reste du schéma ──────────────
do $$
declare t text;
begin
  foreach t in array array[
    'client_contracts','prefactures','prefacture_lines','client_portals','client_portal_access'
  ] loop
    execute format('alter table atlas_people.%I enable row level security', t);
    execute format('drop policy if exists %I on atlas_people.%I', t || '_tenant', t);
    execute format(
      'create policy %I on atlas_people.%I for all to authenticated
         using (tenant_id in (select atlas_people.current_tenant_ids()))
         with check (tenant_id in (select atlas_people.current_tenant_ids()))',
      t || '_tenant', t);
    execute format('grant select, insert, update, delete on atlas_people.%I to authenticated', t);
  end loop;
end $$;

-- ── 5. Rapport cabinet consolidé ─────────────────────────────────────
-- Vue en SECURITY INVOKER (défaut) : elle lit `clients`, donc la RLS de
-- l'appelant s'applique — la vue ne peut pas devenir une fuite entre
-- workspaces.
create or replace view atlas_people.rapport_cabinet_view as
select
  c.tenant_id,
  c.id            as client_id,
  c.name          as client_name,
  c.pays,
  c.status,
  c.effectif,
  c.conformite,
  cardinality(c.modules)                                as modules_count,
  ct.id                                                 as contract_id,
  ct.reference                                          as contract_reference,
  ct.mandate_type,
  ct.status                                             as contract_status,
  ct.billing_mode,
  ct.currency,
  coalesce(pf.prefactures_count, 0)                     as prefactures_count,
  coalesce(pf.total_facture, 0)                         as total_facture,
  coalesce(pf.total_encaisse, 0)                        as total_encaisse,
  coalesce(pf.total_en_attente, 0)                      as total_en_attente,
  pf.derniere_periode,
  po.portails_actifs,
  po.dernier_acces
from atlas_people.clients c
left join lateral (
  select ct2.* from atlas_people.client_contracts ct2
  where ct2.client_id = c.id and ct2.status = 'actif'
  order by ct2.effective_from desc limit 1
) ct on true
left join lateral (
  select
    count(*)                                                          as prefactures_count,
    sum(p.total_amount) filter (where p.status <> 'annulee')          as total_facture,
    sum(p.total_amount) filter (where p.status = 'payee')             as total_encaisse,
    sum(p.total_amount) filter (where p.status in ('validee','envoyee')) as total_en_attente,
    max(p.period_label)                                               as derniere_periode
  from atlas_people.prefactures p where p.client_id = c.id
) pf on true
left join lateral (
  select
    count(*) filter (where cp.status = 'actif') as portails_actifs,
    max(cp.last_access_at)                      as dernier_acces
  from atlas_people.client_portals cp where cp.client_id = c.id
) po on true;

comment on view atlas_people.rapport_cabinet_view is
  'Consolidation par client : mandat actif, facturation et portails. SECURITY INVOKER — la RLS de l''appelant s''applique.';

grant select on atlas_people.rapport_cabinet_view to authenticated;

-- ── 6. Horodatage ────────────────────────────────────────────────────
create or replace function atlas_people.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array['client_contracts','prefactures','client_portals'] loop
    execute format('drop trigger if exists trg_touch_%I on atlas_people.%I', t, t);
    execute format(
      'create trigger trg_touch_%I before update on atlas_people.%I
         for each row execute function atlas_people.touch_updated_at()', t, t);
  end loop;
end $$;
