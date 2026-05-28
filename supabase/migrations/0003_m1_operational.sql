-- ============================================================================
-- Atlas People — M1 opérationnel (spécification champ-par-champ).
-- Enrichit employees/contracts/benefits et ajoute le catalogue de rubriques,
-- la rémunération versionnée, les événements de carrière et l'organigramme.
-- Additif et idempotent (ADD COLUMN IF NOT EXISTS / DROP POLICY IF EXISTS).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. EMPLOYEES — état civil, pièce d'identité, social/fiscal, versement
-- ---------------------------------------------------------------------------
alter table employees add column if not exists civility text check (civility in ('M', 'Mme'));
alter table employees add column if not exists birth_name text;
alter table employees add column if not exists birth_date date;
alter table employees add column if not exists birth_place text;
alter table employees add column if not exists gender text check (gender in ('M', 'F'));
alter table employees add column if not exists nationality text;
alter table employees add column if not exists marital_status text
  check (marital_status in ('single', 'married', 'divorced', 'widowed', 'cohabiting'));
alter table employees add column if not exists dependent_children int not null default 0 check (dependent_children >= 0);
alter table employees add column if not exists dependent_persons int not null default 0 check (dependent_persons >= 0);
alter table employees add column if not exists id_doc_type text
  check (id_doc_type in ('cni', 'passport', 'residence_card', 'consular_card'));
alter table employees add column if not exists id_doc_number text;
alter table employees add column if not exists id_doc_issue_date date;
alter table employees add column if not exists id_doc_expiry_date date;
alter table employees add column if not exists id_doc_issuing_country text;
alter table employees add column if not exists social_security_number text;
alter table employees add column if not exists tax_id_number text;
alter table employees add column if not exists phone_primary text;
alter table employees add column if not exists phone_secondary text;
alter table employees add column if not exists address text;
alter table employees add column if not exists city text;
alter table employees add column if not exists emergency_contact_name text;
alter table employees add column if not exists emergency_contact_phone text;
alter table employees add column if not exists payment_method text
  check (payment_method in ('mobile_money', 'bank_transfer', 'cash', 'check'));
alter table employees add column if not exists mobile_money_operator text;
alter table employees add column if not exists mobile_money_number text;   -- sensible → audit_log
alter table employees add column if not exists bank_name text;
alter table employees add column if not exists bank_account text;          -- sensible → audit_log

-- ---------------------------------------------------------------------------
-- 2. CONTRACTS — versioning (avenants) + champs conventionnels
-- ---------------------------------------------------------------------------
alter table contracts add column if not exists parent_contract_id uuid references contracts (id);
alter table contracts add column if not exists version int not null default 1;
alter table contracts add column if not exists contract_type text
  check (contract_type in ('cdi', 'cdd', 'trial', 'internship', 'apprenticeship', 'service', 'temp'));
alter table contracts add column if not exists trial_period_days int;
alter table contracts add column if not exists renewable boolean default false;
alter table contracts add column if not exists renewal_count int default 0;
alter table contracts add column if not exists job_title text;
alter table contracts add column if not exists department_id uuid;
alter table contracts add column if not exists manager_id uuid references employees (id);
alter table contracts add column if not exists workplace text;
alter table contracts add column if not exists classification text;
alter table contracts add column if not exists grade_coefficient text;
alter table contracts add column if not exists work_time text check (work_time in ('full', 'part'));
alter table contracts add column if not exists part_ratio numeric;
alter table contracts add column if not exists weekly_hours numeric;
alter table contracts add column if not exists collective_agreement_id uuid;

-- ---------------------------------------------------------------------------
-- 3. EMPLOYEE_DOCUMENTS — gestion documentaire (Storage, soft delete)
-- ---------------------------------------------------------------------------
create table if not exists employee_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  doc_type text not null check (doc_type in
    ('contract', 'amendment', 'id', 'diploma', 'certificate', 'attestation', 'medical', 'rib', 'other')),
  storage_path text not null,        -- bucket privé : tenant_{id}/employees/{employee_id}/
  label text,
  doc_date date,
  expiry_date date,                  -- alimente les alertes J-60/30/7
  confidential boolean not null default false,
  deleted_at timestamptz,            -- soft delete (suppression physique prohibée)
  created_at timestamptz not null default now()
);
create index if not exists idx_employee_documents_tenant on employee_documents (tenant_id, employee_id);

-- ---------------------------------------------------------------------------
-- 4. PAY_COMPONENTS — catalogue de rubriques configurable AVEC garde-fou
-- ---------------------------------------------------------------------------
create table if not exists pay_components (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  code text not null,
  label text not null,
  system_type text not null check (system_type in
    ('gain', 'social_contribution', 'tax', 'deduction', 'benefit_in_kind', 'employer_contribution')),
  is_legal boolean not null default false,  -- protégée : ni supprimable ni dé-câblée
  calc_mode text not null check (calc_mode in ('fixed', 'percentage', 'scale', 'formula')),
  calc_base text,                            -- base_salary / gross / custom
  taxable boolean default false,
  subject_to_social boolean default false,
  country_code text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);
create index if not exists idx_pay_components_tenant on pay_components (tenant_id);

-- Garde-fou conformité : interdit suppression / désactivation d'une rubrique légale.
create or replace function protect_legal_pay_components()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE') then
    if old.is_legal then raise exception 'Rubrique légale % non supprimable (verrou conformité)', old.code; end if;
    return old;
  end if;
  if old.is_legal and new.active = false then
    raise exception 'Rubrique légale % non désactivable (verrou conformité)', old.code;
  end if;
  return new;
end $$;

drop trigger if exists trg_protect_legal on pay_components;
create trigger trg_protect_legal before update or delete on pay_components
  for each row execute function protect_legal_pay_components();

-- ---------------------------------------------------------------------------
-- 5. EMPLOYEE_PAY_COMPONENTS — affectation versionnée
-- ---------------------------------------------------------------------------
create table if not exists employee_pay_components (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  component_id uuid not null references pay_components (id),
  value numeric,
  calc_base_override text,
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now()
);
create index if not exists idx_emp_pay_components on employee_pay_components (tenant_id, employee_id);

-- ---------------------------------------------------------------------------
-- 6. EMPLOYEE_COMPENSATION — salaire de base versionné
-- ---------------------------------------------------------------------------
create table if not exists employee_compensation (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  base_salary bigint not null,       -- Money, franc entier
  periodicity text not null default 'monthly' check (periodicity in ('monthly', 'hourly', 'daily')),
  currency currency_code not null,
  effective_from date not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_emp_compensation on employee_compensation (tenant_id, employee_id);

-- ---------------------------------------------------------------------------
-- 7. BENEFITS — avantages en nature versionnés (enrichissement)
-- ---------------------------------------------------------------------------
alter table benefits add column if not exists benefit_type text
  check (benefit_type in ('car', 'housing', 'staff', 'phone', 'fuel', 'other'));
alter table benefits add column if not exists valuation_mode text
  check (valuation_mode in ('legal_flat', 'real', 'percentage'));
alter table benefits add column if not exists taxable boolean not null default true;
alter table benefits add column if not exists subject_to_social boolean not null default true;
alter table benefits add column if not exists effective_from date;
alter table benefits add column if not exists effective_to date;

-- ---------------------------------------------------------------------------
-- 8. EMPLOYEE_EVENTS — timeline immuable de carrière
-- ---------------------------------------------------------------------------
create table if not exists employee_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  event_type text not null check (event_type in
    ('hire', 'promotion', 'mobility', 'salary_change', 'suspension', 'return', 'exit')),
  event_date date not null,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_employee_events on employee_events (tenant_id, employee_id);

-- ---------------------------------------------------------------------------
-- 9. ORG_RELATIONSHIPS — hiérarchique + fonctionnel (jumeau numérique M13)
-- ---------------------------------------------------------------------------
create table if not exists org_relationships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  related_employee_id uuid not null references employees (id) on delete cascade,
  relation_type text not null check (relation_type in ('hierarchical', 'functional')),
  created_at timestamptz not null default now()
);
create index if not exists idx_org_relationships on org_relationships (tenant_id);

-- ============================================================================
-- RLS — Partie 6 (style claims SSO Atlas Studio : tenant_id / employee_id / role)
-- Supersède la politique tenant_isolation générique de 0001 pour ces tables M1.
-- ============================================================================
alter table employee_documents enable row level security;
alter table pay_components enable row level security;
alter table employee_pay_components enable row level security;
alter table employee_compensation enable row level security;
alter table employee_events enable row level security;
alter table org_relationships enable row level security;

-- Employé : lecture de sa propre fiche ; RH/DRH : tout le tenant.
drop policy if exists tenant_isolation on employees;
create policy employee_self_read on employees for select
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (id = (auth.jwt() ->> 'employee_id')::uuid or (auth.jwt() ->> 'role') in ('hr', 'drh'))
  );
create policy employee_hr_write on employees for all
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and (auth.jwt() ->> 'role') in ('hr', 'drh'))
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and (auth.jwt() ->> 'role') in ('hr', 'drh'));

-- Rémunération : employé voit la sienne, manager NON, RH/DRH oui.
create policy compensation_access on employee_compensation for select
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (employee_id = (auth.jwt() ->> 'employee_id')::uuid or (auth.jwt() ->> 'role') in ('hr', 'drh'))
  );

-- Documents confidentiels : RH/DRH only ; non-confidentiels : l'employé concerné aussi.
create policy documents_access on employee_documents for select
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (
      (auth.jwt() ->> 'role') in ('hr', 'drh')
      or (employee_id = (auth.jwt() ->> 'employee_id')::uuid and confidential = false)
    )
  );

-- Catalogue de rubriques & affectations : isolation tenant.
create policy tenant_isolation on pay_components
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
create policy tenant_isolation on employee_pay_components
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
create policy tenant_isolation on employee_events
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
create policy tenant_isolation on org_relationships
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
