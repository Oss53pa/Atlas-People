-- ============================================================================
-- Atlas People — M1 Complément Paquet 2 (thèmes G–L : versement & comptes,
-- contrat enrichi, rémunération détaillée, avantages nature, avantages
-- financiers/prêts, clauses contractuelles). 19 tables + ALTER contracts + RLS.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- H — contracts enrichi
-- ---------------------------------------------------------------------------
alter table contracts add column if not exists contract_subtype text;
alter table contracts add column if not exists detailed_motif text;
alter table contracts add column if not exists signature_date date;
alter table contracts add column if not exists seniority_anchor_date date;
alter table contracts add column if not exists seniority_resume_reason text;
alter table contracts add column if not exists seniority_resume_document_id uuid references employee_documents (id);
alter table contracts add column if not exists trial_period_status text;
alter table contracts add column if not exists job_description text;
alter table contracts add column if not exists functional_manager_id uuid references employees (id);
alter table contracts add column if not exists hierarchical_level text;
alter table contracts add column if not exists work_rhythm text;
alter table contracts add column if not exists working_days text[];
alter table contracts add column if not exists daily_schedule jsonb;
alter table contracts add column if not exists annual_days_forfait int;
alter table contracts add column if not exists disconnection_right boolean default false;
alter table contracts add column if not exists collective_agreement_article text;

-- ---------------------------------------------------------------------------
-- G — Versement & comptes
-- ---------------------------------------------------------------------------
create table if not exists mobile_money_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  operator text not null,
  phone_number text not null,
  account_holder_name text not null,
  status text not null default 'active' check (status in ('active','suspended','closed','to_verify')),
  is_primary boolean not null default false,
  monthly_limit bigint,
  kyc_status text,
  verified_at date,
  document_id uuid references employee_documents (id),
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_mm_accounts on mobile_money_accounts (tenant_id, employee_id);

create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  bank_name text not null,
  bank_country_code text not null,
  branch text,
  account_type text not null,
  iban text not null,
  swift_bic text,
  account_holder_name text not null,
  is_joint_account boolean default false,
  co_holders text[],
  currency text not null,
  status text not null default 'active',
  is_primary boolean not null default false,
  document_id uuid references employee_documents (id),
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_bank_accounts on bank_accounts (tenant_id, employee_id);

create table if not exists employee_payment_methods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade unique,
  primary_mode text not null check (primary_mode in ('mobile_money','bank_transfer','cash','check','mixed')),
  has_split boolean not null default false,
  effective_from date not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists payment_split_destinations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  payment_method_id uuid not null references employee_payment_methods (id) on delete cascade,
  destination_type text not null check (destination_type in ('mobile_money','bank_transfer')),
  mobile_money_account_id uuid references mobile_money_accounts (id),
  bank_account_id uuid references bank_accounts (id),
  percentage numeric(5,2) not null check (percentage > 0 and percentage <= 100),
  ordering int,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- H — Co-affectations & expérience antérieure
-- ---------------------------------------------------------------------------
create table if not exists contract_co_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  contract_id uuid not null references contracts (id) on delete cascade,
  job_title_id uuid,
  department_id uuid,
  site_id uuid,
  manager_id uuid references employees (id),
  quota_pct numeric(5,2) not null check (quota_pct > 0 and quota_pct <= 100),
  created_at timestamptz not null default now()
);

create table if not exists prior_experience (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  employer_name text not null,
  country_code text not null,
  job_title text not null,
  description text,
  start_date date not null,
  end_date date,
  end_reason text,
  retained_for_seniority boolean default false,
  document_id uuid references employee_documents (id),
  observations text,
  created_at timestamptz not null default now()
);
create index if not exists idx_prior_experience on prior_experience (tenant_id, employee_id);

-- ---------------------------------------------------------------------------
-- I — Catalogue & lignes de rémunération
-- ---------------------------------------------------------------------------
create table if not exists compensation_components (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  code text not null,
  label text not null,
  category text not null check (category in ('base_salary','structural_bonus','event_bonus','allowance','overtime','variable','deduction')),
  fiscal_type text not null,
  calculation_base text not null,
  formula text,
  scale jsonb,
  fiscal_exoneration jsonb,
  social_exoneration jsonb,
  frequency text not null check (frequency in ('monthly','quarterly','annual','occasional','event_based')),
  grant_conditions text,
  conventional_mandatory boolean default false,
  collective_agreement_id uuid,
  legal_reference text,
  status text not null default 'active',
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);
create index if not exists idx_comp_components on compensation_components (tenant_id, category, status);

create table if not exists employee_compensation_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  component_id uuid not null references compensation_components (id),
  amount bigint,
  rate_pct numeric(7,4),
  custom_parameters jsonb,
  effective_from date not null,
  effective_to date,
  grant_reason text,
  document_id uuid references employee_documents (id),
  status text not null default 'active',
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_comp_lines on employee_compensation_lines (tenant_id, employee_id, status);

-- ---------------------------------------------------------------------------
-- J — Parcs & avantages en nature typés
-- ---------------------------------------------------------------------------
create table if not exists company_vehicles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  license_plate text not null,
  make text not null,
  model text not null,
  version text,
  year int,
  purchase_or_lease text not null check (purchase_or_lease in ('purchased','leased')),
  acquisition_value bigint,
  current_km int,
  current_holder_employee_id uuid references employees (id),
  status text not null default 'available' check (status in ('available','assigned','maintenance','sold','lost')),
  documents jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, license_plate)
);

create table if not exists company_housing (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  address text not null,
  country_code text not null,
  housing_type text not null,
  surface_sqm numeric,
  rooms_count int,
  monthly_rent bigint,
  ownership text not null check (ownership in ('owned','leased')),
  current_occupant_employee_id uuid references employees (id),
  status text not null default 'available' check (status in ('available','occupied','under_renovation')),
  documents jsonb,
  created_at timestamptz not null default now()
);

create table if not exists in_kind_benefits_typed (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  benefit_type text not null check (benefit_type in ('vehicle','housing','staff','phone','internet','fuel','taxi','restaurant','utilities','schooling','travels','club','equipment')),
  effective_from date not null,
  effective_to date,
  status text not null default 'active',
  valuation_mode text not null,
  monthly_value bigint not null,
  taxable boolean not null default true,
  subject_to_social_contributions boolean not null default true,
  document_id uuid references employee_documents (id),
  observations text,
  asset_vehicle_id uuid references company_vehicles (id),
  asset_housing_id uuid references company_housing (id),
  specific_fields jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_in_kind on in_kind_benefits_typed (tenant_id, employee_id, benefit_type, status);

-- ---------------------------------------------------------------------------
-- K — Avantages financiers & prêts
-- ---------------------------------------------------------------------------
create table if not exists employee_loans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  reference text not null unique,
  loan_purpose text not null check (loan_purpose in ('housing','vehicle','studies','marriage','funeral','birth','health','other')),
  purpose_detail text,
  total_amount bigint not null,
  amount_disbursed bigint not null default 0,
  currency text not null,
  interest_rate_pct numeric(5,2) not null default 0,
  duration_months int not null,
  monthly_installment bigint not null,
  first_repayment_date date not null,
  expected_end_date date not null,
  amount_repaid bigint not null default 0,
  remaining_balance bigint not null,
  installments_remaining int not null,
  status text not null default 'active' check (status in ('active','suspended','repaid','cancelled','litigious')),
  convention_document_id uuid references employee_documents (id),
  guarantee_description text,
  early_repayment_on_exit boolean not null default true,
  justification_documents jsonb,
  approved_by uuid,
  approval_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_loans on employee_loans (tenant_id, employee_id, status);

create table if not exists employee_advances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  reference text not null unique,
  motive text not null,
  amount bigint not null,
  disbursement_date date not null,
  deduction_mode text not null check (deduction_mode in ('next_payroll','spread_over_months')),
  deduction_months int,
  monthly_deduction bigint,
  amount_deducted bigint default 0,
  status text not null default 'active',
  approved_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists recurring_advances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  monthly_amount bigint not null,
  payment_day int not null check (payment_day between 1 and 28),
  payment_mode text not null,
  start_date date not null,
  end_date date,
  justification text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists employee_guarantees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  guarantee_purpose text not null,
  beneficiary text not null,
  guaranteed_amount bigint not null,
  engagement_duration_months int not null,
  start_date date not null,
  end_date date not null,
  convention_document_id uuid references employee_documents (id),
  exit_clause text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists corporate_payment_cards (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  issuer_bank text not null,
  card_type text not null,
  masked_number text not null,
  cardholder_name text not null,
  monthly_limit bigint,
  authorized_categories text[],
  attribution_date date not null,
  expiry_date date not null,
  responsibility text not null,
  convention_document_id uuid references employee_documents (id),
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists saving_share_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  plan_type text not null,
  accumulated_amount bigint default 0,
  monthly_employee_amount bigint,
  employer_matching bigint,
  vesting_date date,
  regulation_document_id uuid references employee_documents (id),
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- L — Clauses contractuelles & obligations
-- ---------------------------------------------------------------------------
create table if not exists contract_clauses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  contract_id uuid not null references contracts (id),
  clause_type text not null check (clause_type in ('non_compete','training_payback','exclusivity','geo_mobility','ip_transfer','nda_enhanced','min_duration')),
  signature_date date,
  effective_from date not null,
  effective_to date,
  status text not null default 'active' check (status in ('active','suspended','expired','breached','waived')),
  document_id uuid references employee_documents (id),
  specific_fields jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_clauses on contract_clauses (tenant_id, employee_id, clause_type, status);

create table if not exists clause_obligations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  clause_id uuid not null references contract_clauses (id) on delete cascade,
  obligation_type text not null,
  amount bigint,
  description text,
  due_date date,
  status text not null default 'pending',
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS — isolation tenant (versement / rémunération / prêts : haute sensibilité)
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array[
  'mobile_money_accounts','bank_accounts','employee_payment_methods','payment_split_destinations',
  'contract_co_assignments','prior_experience','compensation_components','employee_compensation_lines',
  'company_vehicles','company_housing','in_kind_benefits_typed',
  'employee_loans','employee_advances','recurring_advances','employee_guarantees','corporate_payment_cards','saving_share_plans',
  'contract_clauses','clause_obligations'
];
begin
  foreach t in array tabs loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy tenant_isolation on %I
        using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
        with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
    $f$, t);
  end loop;
end $$;
