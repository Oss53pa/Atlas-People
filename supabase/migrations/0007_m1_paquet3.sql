-- ============================================================================
-- Atlas People — M1 Complément Paquet 3 (thèmes M–Q : profil professionnel).
-- Affiliations & mandats, habilitations & certifications, diplômes & formations,
-- mobilité géographique & expatriation, historique de carrière. 17 tables + RLS.
-- ============================================================================

alter table employees add column if not exists highest_education_level text;

-- ---------------------------------------------------------------------------
-- M — Affiliations & mandats
-- ---------------------------------------------------------------------------
create table if not exists professional_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  membership_type text not null check (membership_type in ('professional_order','professional_association','professional_union','alumni_network','other')),
  organization_name text not null,
  country_code text not null,
  member_number text,
  affiliation_date date not null,
  renewal_date date,
  status text not null default 'active',
  particular_role text,
  link_to_job text not null check (link_to_job in ('mandatory','recommended','personal')),
  annual_fee bigint,
  fee_covered_by_employer boolean default false,
  document_id uuid references employee_documents (id),
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_memberships on professional_memberships (tenant_id, employee_id);

create table if not exists employee_mandates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  mandate_category text not null check (mandate_category in ('staff_representation','external')),
  mandate_type text not null,
  union_organization text,
  start_date date not null,
  end_date date,
  under_renewal boolean default false,
  document_id uuid references employee_documents (id),
  scope text not null,
  monthly_delegation_hours int,
  status text not null default 'active' check (status in ('active','suspended','ended','resigned')),
  end_motive text,
  external_entity text,
  external_role text,
  time_commitment text,
  is_paid boolean,
  potential_conflict text,
  compatibility_justification text,
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_mandates on employee_mandates (tenant_id, employee_id, status);

create table if not exists mandate_protection (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  mandate_id uuid not null references employee_mandates (id) on delete cascade,
  protection_start date not null,
  protection_end date not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists idx_mandate_protection on mandate_protection (tenant_id, employee_id, protection_end) where status = 'active';

-- ---------------------------------------------------------------------------
-- N — Habilitations & certifications
-- ---------------------------------------------------------------------------
create table if not exists authorization_catalog (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  code text not null,
  label text not null,
  category text not null,
  activity_description text,
  typical_validity_months int,
  requires_medical_aptitude boolean default false,
  recycling_required boolean default true,
  reference_documents jsonb,
  created_at timestamptz not null default now(),
  unique (coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), code)
);

create table if not exists employee_authorizations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  authorization_id uuid not null references authorization_catalog (id),
  level_or_subcategory text,
  training_organization text,
  obtained_date date not null,
  expiry_date date,
  certificate_number text,
  examiner text,
  document_id uuid references employee_documents (id),
  status text not null default 'active' check (status in ('active','expired','under_renewal','suspended_medical','suspended_other')),
  linked_to_current_job boolean not null default true,
  next_recycling_due date,
  observations text,
  alert_90d_sent boolean default false,
  alert_30d_sent boolean default false,
  alert_7d_sent boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_emp_auth on employee_authorizations (tenant_id, employee_id, status);
create index if not exists idx_emp_auth_expiry on employee_authorizations (tenant_id, expiry_date) where status = 'active';

create table if not exists certification_catalog (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  code text not null,
  label text not null,
  certifier_organization text,
  category text,
  typical_validity_months int,
  reference_url text,
  created_at timestamptz not null default now(),
  unique (coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), code)
);

create table if not exists employee_certifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  certification_id uuid not null references certification_catalog (id),
  certifier_organization text not null,
  level text,
  obtained_date date not null,
  expiry_date date,
  certification_number text,
  verification_url text,
  document_id uuid references employee_documents (id),
  status text not null default 'active',
  continuing_education_credits int,
  linked_to_current_job boolean default true,
  observations text,
  created_at timestamptz not null default now()
);
create index if not exists idx_emp_cert on employee_certifications (tenant_id, employee_id);

-- ---------------------------------------------------------------------------
-- O — Diplômes & formations externes
-- ---------------------------------------------------------------------------
create table if not exists employee_diplomas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  diploma_title text not null,
  specialty text,
  level text,
  institution text not null,
  institution_country_code text not null,
  year_obtained int not null,
  mention text,
  average_grade text,
  study_language text,
  state_recognized boolean,
  has_equivalence boolean default false,
  equivalence_reference text,
  document_id uuid references employee_documents (id),
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_diplomas on employee_diplomas (tenant_id, employee_id);

create table if not exists employee_external_trainings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  training_title text not null,
  training_organization text not null,
  training_type text,
  duration_hours int,
  start_date date,
  end_date date,
  location text,
  domain text,
  obtained_certification boolean default false,
  certification_id uuid references employee_certifications (id),
  funding text,
  document_id uuid references employee_documents (id),
  observations text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- P — Mobilité géographique & expatriation
-- ---------------------------------------------------------------------------
create table if not exists current_geographic_status (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade unique,
  assignment_status text not null check (assignment_status in ('local','expatriate','detached','impatriate','international_mobile')),
  residence_country_code text not null,
  legal_employer_country_code text not null,
  work_execution_country_code text not null,
  origin_country_code text,
  status_start_date date not null,
  status_end_date date,
  bilateral_convention text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists expatriation_packages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  package_tier text not null,
  reference_currency text not null,
  expatriation_bonus bigint,
  cost_of_living_bonus bigint,
  installation_allowance bigint,
  repatriation_allowance bigint,
  housing_covered boolean default false,
  car_provided boolean default false,
  domestic_staff_covered boolean default false,
  international_school boolean default false,
  annual_home_trips int,
  international_health_insurance boolean default false,
  medical_evacuation boolean default false,
  local_language_courses boolean default false,
  tax_briefing boolean default false,
  security_briefing boolean default false,
  return_clause boolean default true,
  return_position_description text,
  contractual_document_id uuid references employee_documents (id),
  effective_from date not null,
  effective_to date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists expat_accompanying_family (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  expatriation_package_id uuid not null references expatriation_packages (id) on delete cascade,
  family_member_id uuid not null references family_members (id),
  arrival_date date,
  spouse_status text,
  visa_document_id uuid references legal_documents (id),
  schooling_arrangement text,
  observations text,
  created_at timestamptz not null default now()
);

create table if not exists geographic_assignments_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  mobility_type text not null,
  origin_country_code text not null,
  destination_country_code text not null,
  origin_site text,
  destination_site text,
  start_date date not null,
  end_date date,
  motive text,
  mobility_case_id uuid,
  final_status text,
  returned_to_origin boolean,
  created_at timestamptz not null default now()
);
create index if not exists idx_geo_history on geographic_assignments_history (tenant_id, employee_id, start_date desc);

-- ---------------------------------------------------------------------------
-- Q — Historique de carrière interne
-- ---------------------------------------------------------------------------
create table if not exists career_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  position_start date not null,
  position_end date,
  job_title text not null,
  job_family text,
  classification text,
  department_id uuid,
  site_id uuid,
  manager_id uuid references employees (id),
  transition_type text not null check (transition_type in ('initial_hiring','promotion','internal_mobility','reorganization','geographic_mobility','functional_change')),
  contract_version_id uuid references contracts (id),
  created_at timestamptz not null default now()
);
create index if not exists idx_career_history on career_history (tenant_id, employee_id, position_start desc);

create table if not exists manager_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  manager_id uuid not null references employees (id),
  management_type text not null check (management_type in ('hierarchical','functional')),
  period_start date not null,
  period_end date,
  created_at timestamptz not null default now()
);
create index if not exists idx_manager_history on manager_history (tenant_id, employee_id, period_start desc);

create table if not exists site_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  site_id uuid not null,
  period_start date not null,
  period_end date,
  created_at timestamptz not null default now()
);

create table if not exists career_promotions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  promotion_date date not null,
  previous_position_id uuid references career_history (id),
  new_position_id uuid references career_history (id),
  previous_classification text,
  new_classification text,
  previous_salary bigint,
  new_salary bigint,
  motive text,
  decided_by uuid,
  observations text,
  created_at timestamptz not null default now()
);
create index if not exists idx_promotions on career_promotions (tenant_id, employee_id, promotion_date desc);

-- ---------------------------------------------------------------------------
-- Seed catalogues (communs) — habilitations & certifications
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from authorization_catalog limit 1) then
    insert into authorization_catalog (code, label, category, typical_validity_months, requires_medical_aptitude) values
      ('HEC-B0','Habilitation électrique B0','Électrique',36,false),
      ('HEC-BR','Habilitation électrique BR','Électrique',36,true),
      ('HTH','Travail en hauteur (port harnais)','Hauteur',36,true),
      ('MAN-CACES','CACES (conduite engins)','Manutention',60,true),
      ('SST','Sauveteur Secouriste du Travail','Sécurité',24,false),
      ('INC-EPI','Équipier de Première Intervention incendie','Sécurité',12,false),
      ('ALI-HACCP','HACCP / Hygiène alimentaire','Alimentaire',36,false),
      ('HEN-ATEX','Atmosphères explosives (ATEX)','Environnement',36,true);
  end if;
  if not exists (select 1 from certification_catalog limit 1) then
    insert into certification_catalog (code, label, certifier_organization, category, typical_validity_months) values
      ('PMP','Project Management Professional','PMI','Project management',36),
      ('ITIL4','ITIL 4 Foundation','PeopleCert','IT',null),
      ('AWS-SAA','AWS Solutions Architect Associate','Amazon','IT',36),
      ('ISO27001-LA','ISO 27001 Lead Auditor','PECB','Qualité',36),
      ('DSCG','Diplôme Supérieur de Comptabilité et Gestion','État','Audit/Comptabilité',null),
      ('SIXSIGMA-GB','Six Sigma Green Belt','ASQ','Qualité',null);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS — isolation tenant
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array[
  'professional_memberships','employee_mandates','mandate_protection',
  'employee_authorizations','employee_certifications','employee_diplomas','employee_external_trainings',
  'current_geographic_status','expatriation_packages','expat_accompanying_family','geographic_assignments_history',
  'career_history','manager_history','site_history','career_promotions'
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

-- Catalogues : référentiels en lecture
alter table authorization_catalog enable row level security;
create policy auth_catalog_read on authorization_catalog for select using (true);
alter table certification_catalog enable row level security;
create policy cert_catalog_read on certification_catalog for select using (true);
