-- ════════════════════════════════════════════════════════════════════
-- 0033 — Paramétrage des régimes de paie OHADA par tenant.
--
-- Architecture :
--   payroll_regime_configs   → enveloppe principale (1 ligne par tenant + pays)
--   payroll_contributions    → cotisations sociales (CNPS, IPRES, etc.)
--   payroll_tax_brackets     → tranches barème IRPP/ITS/IGR progressif
--   payroll_employer_taxes   → taxes purement patronales (FDFP, 3FPT, TA, etc.)
--
-- Le moteur de paie lit EN PRIORITÉ ces tables. Si aucune config n'existe
-- pour (tenant_id, country_code), il tombe sur les régimes statiques
-- compilés dans src/lib/payroll/regimes/.
-- ════════════════════════════════════════════════════════════════════

-- ── Enveloppe principale ─────────────────────────────────────────────
create table if not exists atlas_people.payroll_regime_configs (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references atlas_people.tenants(id) on delete cascade,
  country_code    text not null,   -- ISO-2 : CI, SN, CM, GA, etc.
  country_name    text not null,
  zone            text not null check (zone in ('UEMOA','CEMAC')),
  currency        text not null check (currency in ('XOF','XAF')),
  social_fund     text not null,   -- ex : "CNPS", "IPRES + CSS"
  version         text not null default '1.0',
  effective_from  date not null default current_date,
  -- Options régime
  income_tax_code  text not null default 'IRPP',
  income_tax_label text not null default 'IRPP / ITS',
  abatement_bps   integer not null default 2000, -- abattement frais pro en bps
  -- Métadonnées
  is_active       boolean not null default true,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  created_by      uuid references auth.users(id),
  unique (tenant_id, country_code)
);

-- ── Cotisations sociales ─────────────────────────────────────────────
create table if not exists atlas_people.payroll_contributions (
  id              uuid primary key default gen_random_uuid(),
  regime_id       uuid not null references atlas_people.payroll_regime_configs(id) on delete cascade,
  sort_order      integer not null default 0,
  code            text not null,   -- ex : 'CNPS_RET', 'IPRES_RC'
  label           text not null,
  base_type       text not null check (base_type in ('gross','capped')),
  ceiling         bigint,          -- plafond mensuel en centimes (NULL si base_type='gross')
  employee_bps    integer not null default 0, -- part salariale (1% = 100 bps)
  employer_bps    integer not null default 0, -- part patronale
  account_employee text,           -- compte SYSCOHADA salarié
  account_employer text,           -- compte SYSCOHADA employeur
  is_active       boolean not null default true
);

-- ── Tranches barème impôt progressif ────────────────────────────────
create table if not exists atlas_people.payroll_tax_brackets (
  id              uuid primary key default gen_random_uuid(),
  regime_id       uuid not null references atlas_people.payroll_regime_configs(id) on delete cascade,
  sort_order      integer not null,   -- ordre croissant obligatoire
  up_to           bigint,             -- plafond de la tranche (NULL = tranche supérieure)
  rate_bps        integer not null    -- taux marginal en bps (ex : 2100 = 21%)
);

-- ── Taxes patronales ─────────────────────────────────────────────────
create table if not exists atlas_people.payroll_employer_taxes (
  id              uuid primary key default gen_random_uuid(),
  regime_id       uuid not null references atlas_people.payroll_regime_configs(id) on delete cascade,
  sort_order      integer not null default 0,
  code            text not null,   -- ex : 'FDFP_TA', 'FDFP_FC', '3FPT'
  label           text not null,
  rate_bps        integer not null,
  account         text,
  is_active       boolean not null default true
);

-- ── Index ─────────────────────────────────────────────────────────────
create index if not exists idx_regime_configs_tenant
  on atlas_people.payroll_regime_configs(tenant_id);
create index if not exists idx_contributions_regime
  on atlas_people.payroll_contributions(regime_id, sort_order);
create index if not exists idx_tax_brackets_regime
  on atlas_people.payroll_tax_brackets(regime_id, sort_order);
create index if not exists idx_employer_taxes_regime
  on atlas_people.payroll_employer_taxes(regime_id, sort_order);

-- ── Trigger updated_at ───────────────────────────────────────────────
create or replace function atlas_people.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trig_regime_configs_updated_at on atlas_people.payroll_regime_configs;
create trigger trig_regime_configs_updated_at
  before update on atlas_people.payroll_regime_configs
  for each row execute procedure atlas_people.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────
alter table atlas_people.payroll_regime_configs enable row level security;
alter table atlas_people.payroll_contributions   enable row level security;
alter table atlas_people.payroll_tax_brackets    enable row level security;
alter table atlas_people.payroll_employer_taxes  enable row level security;

-- Lecture : tout membre du tenant
create policy prc_select on atlas_people.payroll_regime_configs for select
  using (tenant_id in (select t from atlas_people.current_tenant_ids() t));
create policy pcon_select on atlas_people.payroll_contributions for select
  using (regime_id in (
    select id from atlas_people.payroll_regime_configs
    where tenant_id in (select t from atlas_people.current_tenant_ids() t)));
create policy ptb_select on atlas_people.payroll_tax_brackets for select
  using (regime_id in (
    select id from atlas_people.payroll_regime_configs
    where tenant_id in (select t from atlas_people.current_tenant_ids() t)));
create policy pet_select on atlas_people.payroll_employer_taxes for select
  using (regime_id in (
    select id from atlas_people.payroll_regime_configs
    where tenant_id in (select t from atlas_people.current_tenant_ids() t)));

-- Écriture : hr / admin seulement
create policy prc_write on atlas_people.payroll_regime_configs for all
  using (atlas_people.is_hr_or_admin(tenant_id))
  with check (atlas_people.is_hr_or_admin(tenant_id));
create policy pcon_write on atlas_people.payroll_contributions for all
  using (regime_id in (
    select id from atlas_people.payroll_regime_configs
    where atlas_people.is_hr_or_admin(tenant_id)));
create policy ptb_write on atlas_people.payroll_tax_brackets for all
  using (regime_id in (
    select id from atlas_people.payroll_regime_configs
    where atlas_people.is_hr_or_admin(tenant_id)));
create policy pet_write on atlas_people.payroll_employer_taxes for all
  using (regime_id in (
    select id from atlas_people.payroll_regime_configs
    where atlas_people.is_hr_or_admin(tenant_id)));

-- ── Seed démo tenant (CI + SN) ────────────────────────────────────────
insert into atlas_people.payroll_regime_configs
  (id, tenant_id, country_code, country_name, zone, currency, social_fund,
   version, effective_from, income_tax_code, income_tax_label, abatement_bps)
values
  ('a0000001-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   'CI', 'Côte d''Ivoire', 'UEMOA', 'XOF', 'CNPS',
   '2025.1', '2025-01-01', 'IGR', 'IGR / IRPP', 2000),
  ('a0000001-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111',
   'SN', 'Sénégal', 'UEMOA', 'XOF', 'IPRES + CSS',
   '2025.1', '2025-01-01', 'ITS', 'ITS / IRPP', 2500)
on conflict (tenant_id, country_code) do nothing;

-- Contributions CI
insert into atlas_people.payroll_contributions
  (regime_id, sort_order, code, label, base_type, ceiling, employee_bps, employer_bps, account_employee, account_employer)
values
  ('a0000001-0000-0000-0000-000000000001', 1, 'CNPS_RET', 'CNPS — Retraite', 'capped', 337500000, 630, 770, '431100', '664100'),
  ('a0000001-0000-0000-0000-000000000001', 2, 'CNPS_PF',  'CNPS — Prestations familiales', 'capped', 7000000, 0, 525, null, '664200'),
  ('a0000001-0000-0000-0000-000000000001', 3, 'CNPS_AT',  'CNPS — Accident du travail', 'capped', 7000000, 0, 200, null, '664300'),
  ('a0000001-0000-0000-0000-000000000001', 4, 'CMU',      'Couverture Maladie Universelle', 'gross', null, 0, 0, null, '664400')
on conflict do nothing;

-- Tranches IGR CI
insert into atlas_people.payroll_tax_brackets (regime_id, sort_order, up_to, rate_bps) values
  ('a0000001-0000-0000-0000-000000000001', 1, 7500000, 0),
  ('a0000001-0000-0000-0000-000000000001', 2, 24000000, 1600),
  ('a0000001-0000-0000-0000-000000000001', 3, 80000000, 2100),
  ('a0000001-0000-0000-0000-000000000001', 4, 240000000, 2400),
  ('a0000001-0000-0000-0000-000000000001', 5, 800000000, 2800),
  ('a0000001-0000-0000-0000-000000000001', 6, null, 3200)
on conflict do nothing;

-- Taxes patronales CI
insert into atlas_people.payroll_employer_taxes (regime_id, sort_order, code, label, rate_bps, account) values
  ('a0000001-0000-0000-0000-000000000001', 1, 'FDFP_TA', 'FDFP — Taxe d''apprentissage', 40, '637100'),
  ('a0000001-0000-0000-0000-000000000001', 2, 'FDFP_FC', 'FDFP — Formation continue',    60, '637200')
on conflict do nothing;

-- Contributions SN
insert into atlas_people.payroll_contributions
  (regime_id, sort_order, code, label, base_type, ceiling, employee_bps, employer_bps, account_employee, account_employer)
values
  ('a0000001-0000-0000-0000-000000000002', 1, 'IPRES_RC', 'IPRES — Régime cadre (retraite)', 'capped', 100000000, 580, 870, '431100', '664100'),
  ('a0000001-0000-0000-0000-000000000002', 2, 'CSS_AM', 'CSS — Assurance maladie', 'gross', null, 0, 700, null, '664200'),
  ('a0000001-0000-0000-0000-000000000002', 3, 'CSS_PF', 'CSS — Prestations familiales', 'gross', null, 0, 700, null, '664300'),
  ('a0000001-0000-0000-0000-000000000002', 4, 'CSS_AT', 'CSS — Accident du travail (moy.)', 'capped', 63000000, 0, 150, null, '664400')
on conflict do nothing;

-- Tranches ITS SN
insert into atlas_people.payroll_tax_brackets (regime_id, sort_order, up_to, rate_bps) values
  ('a0000001-0000-0000-0000-000000000002', 1, 63000000, 0),
  ('a0000001-0000-0000-0000-000000000002', 2, 151200000, 2000),
  ('a0000001-0000-0000-0000-000000000002', 3, 378000000, 3000),
  ('a0000001-0000-0000-0000-000000000002', 4, 756000000, 3500),
  ('a0000001-0000-0000-0000-000000000002', 5, null, 4000)
on conflict do nothing;

-- Taxes patronales SN
insert into atlas_people.payroll_employer_taxes (regime_id, sort_order, code, label, rate_bps, account) values
  ('a0000001-0000-0000-0000-000000000002', 1, '3FPT',  '3FPT — Fonds Formation Professionnelle et Technique', 300, '637100'),
  ('a0000001-0000-0000-0000-000000000002', 2, 'CFCE',  'CFCE — Contribution Forfaitaire à la Charge de l''Employeur', 300, '637200')
on conflict do nothing;
