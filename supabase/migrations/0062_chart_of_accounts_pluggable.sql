-- =====================================================================
-- P8 · Plan comptable enfichable — socle de données
--
-- OBJET. Rendre le plan comptable une DONNÉE, conformément au CDC PROVISIONS
-- §8.3 : « Aucun numéro de compte n'apparaît dans le code ». Aujourd'hui
-- src/lib/payroll/AccountingPlan.ts porte sept numéros littéraux, la table qui
-- serait le vrai paramétrage (payroll_accounting_mappings, migration 0016) est
-- morte, et src/pages/paie/ComptabilitePage.tsx réécrit un schéma divergent.
-- Aucun plan alternatif — SYSCOHADA révisé, SYCEBNL ou plan libre — ne peut
-- donc être hébergé.
--
-- PÉRIMÈTRE VOLONTAIREMENT LIMITÉ À LA BASE. Le recâblage applicatif
-- (AccountingPlan.ts, AccountingMapper.ts, ComptabilitePage.tsx) et
-- l'alimentation d'accounting_entries relèvent d'un chantier en cours par
-- ailleurs. Cette migration lui fournit les tables dont il a besoin, sans
-- toucher à un seul fichier TypeScript.
--
-- FORME REPRISE DE L'EXISTANT. Les colonnes des comptes reprennent celles de
-- public.coop_plan_comptable (numero, libelle, classe, niveau, parent,
-- normal_balance, actif), déjà éprouvées sur le produit coopératives, plutôt
-- que d'inventer une troisième modélisation.
--
-- CE QUI N'EST PAS FAIT, ET POURQUOI.
--   • Aucun plan normatif complet n'est seedé. Le plan SYSCOHADA révisé
--     intégral, comme le SYCEBNL (annexe de 422 pages à l'Acte uniforme du
--     22 décembre 2022, en vigueur depuis le 1er janvier 2024), sont des
--     référentiels normatifs. Les reconstituer de mémoire produirait des
--     numéros inventés — donc des écritures mal imputées passant les
--     contrôles d'équilibre. Ils se chargent par import, depuis le texte
--     officiel.
--   • client_file_id n'est pas introduit, alors que le CDC PROVISIONS l'inscrit
--     dans ces tables. Cette colonne n'existe sur aucune des 412 tables du
--     schéma et le multi-dossiers cabinet est aujourd'hui modélisé autrement
--     (un tenant par entreprise cliente). Trancher ce modèle est un préalable
--     transverse aux quatre CDC ; l'anticiper ici le prédéterminerait.
--     Le périmètre retenu est tenant_id + legal_entity_id optionnel.
-- =====================================================================

-- 1. Plans comptables ---------------------------------------------------
-- tenant_id IS NULL = plan livré par l'éditeur, lisible par tous les tenants
-- et dérivable ; non-NULL = plan propre à un tenant.
create table if not exists atlas_people.chart_of_accounts (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid references atlas_people.tenants(id) on delete cascade,
  code           text not null,
  label          text not null,
  referential    text not null
                 check (referential in ('syscohada_revise','sycebnl','other','custom')),
  zone           text,
  country_codes  text[],
  version        text not null,
  effective_from date not null,
  effective_to   date,
  status         text not null default 'draft'
                 check (status in ('draft','published','archived')),
  -- CDC PROVISIONS §8.4 : les comptes livrés sont des PROPOSITIONS. Le
  -- responsable comptable du client doit les confirmer explicitement avant la
  -- première comptabilisation. Sans confirmation, le plan reste en draft.
  confirmed_by   uuid references auth.users(id),
  confirmed_at   timestamptz,
  source_ref     text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index if not exists chart_of_accounts_global_uidx
  on atlas_people.chart_of_accounts (code, version) where tenant_id is null;
create unique index if not exists chart_of_accounts_tenant_uidx
  on atlas_people.chart_of_accounts (tenant_id, code, version) where tenant_id is not null;

-- Un plan publié doit avoir été confirmé par un comptable.
alter table atlas_people.chart_of_accounts
  drop constraint if exists chart_of_accounts_published_needs_confirmation;
alter table atlas_people.chart_of_accounts
  add constraint chart_of_accounts_published_needs_confirmation
  check (status <> 'published' or (confirmed_by is not null and confirmed_at is not null));

-- 2. Comptes ------------------------------------------------------------
create table if not exists atlas_people.chart_of_accounts_entry (
  id             uuid primary key default gen_random_uuid(),
  chart_id       uuid not null references atlas_people.chart_of_accounts(id) on delete cascade,
  numero         text not null,
  libelle        text not null,
  classe         smallint check (classe between 1 and 9),
  niveau         smallint not null default 1,   -- 1 classe, 2 principal, 3+ divisionnaire
  parent_numero  text,
  account_type   text check (account_type in
                 ('actif','passif','charge','produit','tiers','tresorerie','engagement','analytique')),
  normal_balance text check (normal_balance in ('debit','credit')),
  -- Un compte de regroupement n'est jamais imputable : il totalise ses enfants.
  is_postable    boolean not null default true,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (chart_id, numero)
);

create index if not exists coa_entry_chart_classe_idx
  on atlas_people.chart_of_accounts_entry (chart_id, classe, numero);

-- 3. Schémas d'écriture (CDC PROVISIONS §8.2) ---------------------------
create table if not exists atlas_people.accounting_scheme (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references atlas_people.tenants(id) on delete cascade,
  legal_entity_id uuid,
  chart_id        uuid not null references atlas_people.chart_of_accounts(id),
  code            text not null,
  label           text not null,
  event_type      text not null
                  check (event_type in ('payroll','provision','payment','severance','reversal')),
  journal_code    text,
  effective_from  date not null,
  effective_to    date,
  status          text not null default 'draft'
                  check (status in ('draft','published','archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, code, effective_from)
);

create table if not exists atlas_people.accounting_scheme_line (
  id               uuid primary key default gen_random_uuid(),
  scheme_id        uuid not null references atlas_people.accounting_scheme(id) on delete cascade,
  sequence_no      int not null,
  -- Quelle grandeur alimente la ligne : rubrique, famille de rubriques, part
  -- salariale/patronale, organisme… Décrit en données, jamais en code.
  source_selector  jsonb not null,
  direction        text not null check (direction in ('debit','credit')),
  account_numero   text not null,
  third_party_rule jsonb,
  analytic_rule    jsonb,
  label_template   text not null,
  unique (scheme_id, sequence_no)
);

-- 4. RLS ----------------------------------------------------------------
alter table atlas_people.chart_of_accounts       enable row level security;
alter table atlas_people.chart_of_accounts_entry enable row level security;
alter table atlas_people.accounting_scheme       enable row level security;
alter table atlas_people.accounting_scheme_line  enable row level security;

drop policy if exists coa_read on atlas_people.chart_of_accounts;
create policy coa_read on atlas_people.chart_of_accounts for select
  using (tenant_id is null or tenant_id in (select atlas_people.current_tenant_ids()));

drop policy if exists coa_write on atlas_people.chart_of_accounts;
create policy coa_write on atlas_people.chart_of_accounts for all
  using (tenant_id in (select atlas_people.current_tenant_ids()))
  with check (tenant_id in (select atlas_people.current_tenant_ids()));

-- Les comptes héritent du périmètre de leur plan.
drop policy if exists coa_entry_read on atlas_people.chart_of_accounts_entry;
create policy coa_entry_read on atlas_people.chart_of_accounts_entry for select
  using (exists (select 1 from atlas_people.chart_of_accounts c
                 where c.id = chart_id
                   and (c.tenant_id is null
                        or c.tenant_id in (select atlas_people.current_tenant_ids()))));

drop policy if exists coa_entry_write on atlas_people.chart_of_accounts_entry;
create policy coa_entry_write on atlas_people.chart_of_accounts_entry for all
  using (exists (select 1 from atlas_people.chart_of_accounts c
                 where c.id = chart_id
                   and c.tenant_id in (select atlas_people.current_tenant_ids())))
  with check (exists (select 1 from atlas_people.chart_of_accounts c
                 where c.id = chart_id
                   and c.tenant_id in (select atlas_people.current_tenant_ids())));

drop policy if exists scheme_tenant on atlas_people.accounting_scheme;
create policy scheme_tenant on atlas_people.accounting_scheme for all
  using (tenant_id in (select atlas_people.current_tenant_ids()))
  with check (tenant_id in (select atlas_people.current_tenant_ids()));

drop policy if exists scheme_line_tenant on atlas_people.accounting_scheme_line;
create policy scheme_line_tenant on atlas_people.accounting_scheme_line for all
  using (exists (select 1 from atlas_people.accounting_scheme s
                 where s.id = scheme_id
                   and s.tenant_id in (select atlas_people.current_tenant_ids())))
  with check (exists (select 1 from atlas_people.accounting_scheme s
                 where s.id = scheme_id
                   and s.tenant_id in (select atlas_people.current_tenant_ids())));

grant select on atlas_people.chart_of_accounts, atlas_people.chart_of_accounts_entry
  to authenticated, anon;
grant insert, update, delete on atlas_people.chart_of_accounts,
  atlas_people.chart_of_accounts_entry, atlas_people.accounting_scheme,
  atlas_people.accounting_scheme_line to authenticated;
grant select on atlas_people.accounting_scheme, atlas_people.accounting_scheme_line
  to authenticated;

-- 5. Amorce : les comptes que le code porte AUJOURD'HUI en dur -----------
-- Ce plan est délibérément nommé « sous-ensemble paie » : il ne prétend pas
-- être le SYSCOHADA révisé intégral. Il contient exactement les sept comptes
-- de DEFAULT_ACCOUNTING_PLAN, leurs comptes de regroupement à trois chiffres,
-- et les deux classes concernées — de quoi supprimer la justification des
-- constantes en dur, sans inventer un référentiel.
insert into atlas_people.chart_of_accounts
  (tenant_id, code, label, referential, zone, version, effective_from, status, source_ref, notes)
values
  (null, 'SYSCOHADA_REVISE_PAIE', 'SYSCOHADA révisé — sous-ensemble paie',
   'syscohada_revise', 'OHADA', '2017.1', '2018-01-01', 'draft',
   'SYSCOHADA révisé (2017) — sous-ensemble limité aux écritures de paie',
   'Sous-ensemble, NON exhaustif : reprend les 7 comptes de src/lib/payroll/AccountingPlan.ts (DEFAULT_ACCOUNTING_PLAN) plus leurs regroupements. Le plan normatif complet se charge par import depuis le texte officiel. Reste en draft jusqu''à confirmation par un responsable comptable (CDC PROVISIONS §8.4).')
on conflict (code, version) where tenant_id is null do nothing;

insert into atlas_people.chart_of_accounts_entry
  (chart_id, numero, libelle, classe, niveau, parent_numero, account_type, normal_balance, is_postable)
select c.id, v.numero, v.libelle, v.classe, v.niveau, v.parent, v.atype, v.bal, v.postable
from atlas_people.chart_of_accounts c,
(values
  -- Classes concernées
  ('4',      'Comptes de tiers',                                    4, 1, null,  'tiers',   null,     false),
  ('6',      'Comptes de charges des activités ordinaires',         6, 1, null,  'charge',  null,     false),
  -- Regroupements à trois chiffres
  ('422',    'Personnel, rémunérations dues',                       4, 2, '4',   'tiers',   'credit', false),
  ('431',    'Sécurité sociale',                                    4, 2, '4',   'tiers',   'credit', false),
  ('437',    'Autres organismes sociaux',                           4, 2, '4',   'tiers',   'credit', false),
  ('447',    'État, impôts retenus à la source',                    4, 2, '4',   'tiers',   'credit', false),
  ('637',    'Cotisations aux organismes de formation',             6, 2, '6',   'charge',  'debit',  false),
  ('661',    'Rémunérations directes versées au personnel',         6, 2, '6',   'charge',  'debit',  false),
  ('664',    'Charges sociales patronales',                         6, 2, '6',   'charge',  'debit',  false),
  -- Les 7 comptes imputables réellement utilisés par le moteur de paie
  ('422000', 'Personnel, rémunérations dues (net à payer)',         4, 3, '422', 'tiers',   'credit', true),
  ('431000', 'Sécurité sociale — caisses',                          4, 3, '431', 'tiers',   'credit', true),
  ('437000', 'Organismes sociaux — taxes de formation',             4, 3, '437', 'tiers',   'credit', true),
  ('447000', 'État, impôts sur salaires retenus à la source',       4, 3, '447', 'tiers',   'credit', true),
  ('637000', 'Cotisations de formation professionnelle',            6, 3, '637', 'charge',  'debit',  true),
  ('661100', 'Rémunérations directes — salaires bruts',             6, 3, '661', 'charge',  'debit',  true),
  ('664000', 'Charges sociales patronales',                         6, 3, '664', 'charge',  'debit',  true)
) as v(numero, libelle, classe, niveau, parent, atype, bal, postable)
where c.tenant_id is null and c.code = 'SYSCOHADA_REVISE_PAIE' and c.version = '2017.1'
on conflict (chart_id, numero) do nothing;
