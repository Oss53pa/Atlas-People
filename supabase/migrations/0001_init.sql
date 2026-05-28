-- ============================================================================
-- Atlas People — Schéma initial multi-tenant (cahier §5.2, §6)
-- Isolation stricte par tenant_id via Row Level Security.
-- Devise portée par le tenant (XOF/XAF) ; rattachement pays par collaborateur.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector"; -- pgvector pour le RAG PROPH3T (§5.1)

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type monetary_zone as enum ('UEMOA', 'CEMAC');
create type currency_code as enum ('XOF', 'XAF');
create type employee_status as enum ('active', 'onboarding', 'leave', 'notice', 'offboarded');
create type contract_type as enum ('CDI', 'CDD', 'Stage', 'Consultant');
create type payroll_status as enum ('draft', 'verified', 'blocked', 'emitted', 'posted');

-- ---------------------------------------------------------------------------
-- Tenants & appartenance (identité fournie par Atlas Studio Core / SSO)
-- ---------------------------------------------------------------------------
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  zone monetary_zone not null,
  currency currency_code not null,
  countries text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table memberships (
  user_id uuid not null references auth.users (id) on delete cascade,
  tenant_id uuid not null references tenants (id) on delete cascade,
  role text not null default 'employee', -- employee | manager | hr | admin
  created_at timestamptz not null default now(),
  primary key (user_id, tenant_id)
);

-- Tenants auxquels l'utilisateur courant appartient (utilisé par toutes les RLS).
create or replace function current_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from memberships where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Régimes versionnés par pays (config paie — §3.3)
-- ---------------------------------------------------------------------------
create table legal_regimes (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  country_name text not null,
  zone monetary_zone not null,
  currency currency_code not null,
  social_fund text not null,
  version text not null,
  effective_from date not null,
  config jsonb not null, -- contributions, barèmes, plafonds, taxes patronales
  created_at timestamptz not null default now(),
  unique (country_code, version)
);

-- ---------------------------------------------------------------------------
-- Socle & administration
-- ---------------------------------------------------------------------------
create table employees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  role_title text,
  department text,
  country_code text not null,
  legal_regime_id uuid references legal_regimes (id),
  contract contract_type not null default 'CDI',
  hire_date date,
  status employee_status not null default 'active',
  base_salary bigint not null default 0,        -- francs entiers (Money.ts)
  taxable_allowances bigint not null default 0,
  non_taxable_allowances bigint not null default 0,
  fiscal_parts numeric(3,1) not null default 1,
  manager_id uuid references employees (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on employees (tenant_id);

create table contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  type contract_type not null,
  start_date date not null,
  end_date date,
  clauses jsonb not null default '{}',
  country_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on contracts (tenant_id);

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  work_date date not null,
  hours numeric(4,1) not null default 0,
  overtime_hours numeric(4,1) not null default 0,
  created_at timestamptz not null default now()
);
create index on time_entries (tenant_id);

create table leaves (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  leave_type text not null,         -- typé par droit national
  start_date date not null,
  end_date date not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index on leaves (tenant_id);

create table expense_claims (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  amount bigint not null,
  currency currency_code not null,
  category text not null,
  status text not null default 'pending',
  receipt_url text,
  created_at timestamptz not null default now()
);
create index on expense_claims (tenant_id);

create table benefits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  kind text not null,               -- voiture, logement, carburant…
  monthly_value bigint not null default 0,
  created_at timestamptz not null default now()
);
create index on benefits (tenant_id);

-- ---------------------------------------------------------------------------
-- Paie
-- ---------------------------------------------------------------------------
create table payroll_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  period text not null,             -- ex : 2026-05
  country_code text not null,
  status payroll_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on payroll_runs (tenant_id);

create table payslips (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  run_id uuid not null references payroll_runs (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  currency currency_code not null,
  regime_version text not null,
  gross_total bigint not null,
  employee_contributions bigint not null,
  income_tax bigint not null,
  net_to_pay bigint not null,
  employer_cost bigint not null,
  lines jsonb not null,
  verified boolean not null default false,    -- double vérification (§2.3)
  prev_hash text not null,                    -- audit chaîné SHA-256
  hash text not null,
  status payroll_status not null default 'draft',
  created_at timestamptz not null default now()
);
create index on payslips (tenant_id);

create table social_declarations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  run_id uuid references payroll_runs (id) on delete set null,
  country_code text not null,
  declaration_type text not null,   -- CNPS, IGR, IPRES, IUTS…
  period text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index on social_declarations (tenant_id);

create table accounting_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  run_id uuid references payroll_runs (id) on delete set null,
  account text not null,            -- comptes SYSCOHADA (66/42/43/447…)
  label text not null,
  debit bigint not null default 0,
  credit bigint not null default 0,
  posted_to_fna boolean not null default false,
  created_at timestamptz not null default now()
);
create index on accounting_entries (tenant_id);

-- ---------------------------------------------------------------------------
-- Performance & Talents
-- ---------------------------------------------------------------------------
create table objectives (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid references employees (id) on delete cascade,
  parent_id uuid references objectives (id) on delete set null, -- cascade OKR
  title text not null,
  progress numeric(5,2) not null default 0,
  due_date date,
  created_at timestamptz not null default now()
);
create index on objectives (tenant_id);

create table evaluations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  reviewer_id uuid references employees (id),
  score numeric(4,2),
  summary text,
  created_at timestamptz not null default now()
);
create index on evaluations (tenant_id);

create table skills (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  domain text,
  created_at timestamptz not null default now()
);
create index on skills (tenant_id);

create table employee_skills (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  skill_id uuid not null references skills (id) on delete cascade,
  level smallint not null default 0,    -- 0..4
  evidence text,                        -- preuve
  created_at timestamptz not null default now(),
  unique (employee_id, skill_id)
);
create index on employee_skills (tenant_id);

create table career_paths (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid references employees (id) on delete cascade,
  target_role text not null,
  steps jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index on career_paths (tenant_id);

create table succession_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  key_role text not null,
  successors jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index on succession_plans (tenant_id);

create table trainings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  title text not null,
  skill_id uuid references skills (id),
  budget bigint not null default 0,
  created_at timestamptz not null default now()
);
create index on trainings (tenant_id);

create table training_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  training_id uuid not null references trainings (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  completed boolean not null default false,
  impact_score numeric(4,2),
  created_at timestamptz not null default now()
);
create index on training_records (tenant_id);

-- ---------------------------------------------------------------------------
-- Pilotage & protection
-- ---------------------------------------------------------------------------
create table disciplinary_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  action_type text not null,        -- avertissement, sanction, licenciement…
  details jsonb not null default '{}',
  prev_hash text not null,          -- audit chaîné (procédure juridique)
  hash text not null,
  created_at timestamptz not null default now()
);
create index on disciplinary_actions (tenant_id);

create table incidents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid references employees (id) on delete set null,
  kind text not null,               -- accident du travail, SST…
  severity text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on incidents (tenant_id);

-- Micro-feedbacks ANONYMISÉS par défaut (pas de FK vers employees — §6, §2.4)
create table feedback_signals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  department text,
  sentiment numeric(4,2),
  topic text,
  created_at timestamptz not null default now()
);
create index on feedback_signals (tenant_id);

-- Scores agrégés orientés soin (jamais punitif individuel exposé — §10)
create table turnover_predictions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  scope text not null,              -- département / équipe (agrégé)
  attention_score numeric(5,2) not null,
  suggested_care_action text,
  created_at timestamptz not null default now()
);
create index on turnover_predictions (tenant_id);

-- ---------------------------------------------------------------------------
-- Transverse
-- ---------------------------------------------------------------------------
create table audit_log (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references tenants (id) on delete cascade,
  actor_id uuid references auth.users (id),
  action text not null,
  entity text not null,
  entity_id text,
  payload jsonb not null default '{}',
  prev_hash text not null,
  hash text not null,               -- SHA-256 chaîné (§2.3)
  created_at timestamptz not null default now()
);
create index on audit_log (tenant_id);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on notifications (tenant_id);

-- ============================================================================
-- Row Level Security — isolation systématique par tenant (§5.2)
-- Aucune requête ne peut traverser la frontière d'un tenant.
-- ============================================================================
do $$
declare
  t text;
  tenant_tables text[] := array[
    'employees','contracts','time_entries','leaves','expense_claims','benefits',
    'payroll_runs','payslips','social_declarations','accounting_entries',
    'objectives','evaluations','skills','employee_skills','career_paths',
    'succession_plans','trainings','training_records',
    'disciplinary_actions','incidents','feedback_signals','turnover_predictions',
    'audit_log','notifications'
  ];
begin
  foreach t in array tenant_tables loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy tenant_isolation on %I
        using (tenant_id in (select current_tenant_ids()))
        with check (tenant_id in (select current_tenant_ids()));
    $f$, t);
  end loop;
end $$;

-- tenants & memberships : visibles seulement pour ses propres tenants
alter table tenants enable row level security;
create policy tenant_self on tenants
  using (id in (select current_tenant_ids()));

alter table memberships enable row level security;
create policy membership_self on memberships
  using (user_id = auth.uid());

-- legal_regimes : config publique en lecture (pas de donnée sensible)
alter table legal_regimes enable row level security;
create policy regimes_read on legal_regimes for select using (true);

-- ---------------------------------------------------------------------------
-- updated_at automatique
-- ---------------------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
declare touched text[] := array['tenants','employees','contracts','payroll_runs'];
begin
  foreach t in array touched loop
    execute format(
      'create trigger trg_touch_%1$s before update on %1$s
       for each row execute function touch_updated_at();', t);
  end loop;
end $$;
