-- ============================================================================
-- Atlas People — M1 Complément Paquet 1 (thèmes A–F : identité étendue, famille,
-- couverture sociale, fiscal, documents légaux, coordonnées étendues).
-- 18 nouvelles tables + colonnes employees + seed caisses + RLS. Additif/idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- A — employees enrichi
-- ---------------------------------------------------------------------------
alter table employees add column if not exists usage_name text;
alter table employees add column if not exists birth_country_code text;
alter table employees add column if not exists religion text;            -- sensible
alter table employees add column if not exists blood_group text check (blood_group in ('O+','O-','A+','A-','B+','B-','AB+','AB-','unknown'));
alter table employees add column if not exists height_cm smallint;
alter table employees add column if not exists weight_kg numeric(5,2);
alter table employees add column if not exists shoe_size numeric(4,1);
alter table employees add column if not exists clothing_size text;

-- ---------------------------------------------------------------------------
-- E — Documents légaux (créé tôt : référencé par d'autres tables)
-- ---------------------------------------------------------------------------
create table if not exists legal_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  document_type text not null check (document_type in
    ('cni','passport','residence_card','work_permit','visa','consular_card','driving_license','criminal_record','birth_certificate','nationality_certificate')),
  document_number text not null,
  issue_date date,
  expiry_date date,
  issuing_authority text,
  issue_place text,
  issue_country_code text,
  status text not null default 'active' check (status in ('active','expired','renewed','lost','seized','cancelled')),
  specific_fields jsonb,
  observations text,
  file_recto_path text,
  file_verso_path text,
  replaces_document_id uuid references legal_documents (id),
  alert_60d_sent boolean default false,
  alert_30d_sent boolean default false,
  alert_7d_sent boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_legal_documents on legal_documents (tenant_id, employee_id, document_type);
create index if not exists idx_legal_documents_expiry on legal_documents (tenant_id, expiry_date) where status = 'active';

-- ---------------------------------------------------------------------------
-- A — Nationalités & langues
-- ---------------------------------------------------------------------------
create table if not exists employee_nationalities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  country_code text not null,
  is_primary boolean not null default false,
  acquisition_mode text check (acquisition_mode in ('birth','filiation','marriage','naturalization','other')),
  acquired_at date,
  document_id uuid references legal_documents (id),
  created_at timestamptz not null default now(),
  unique (employee_id, country_code)
);
create index if not exists idx_nationalities on employee_nationalities (tenant_id, employee_id);

create table if not exists employee_languages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  language_code text not null,
  level text not null check (level in ('a1','a2','b1','b2','c1','bilingual','native')),
  oral_level text,
  written_level text,
  certification_name text,
  certification_date date,
  document_id uuid references employee_documents (id),
  created_at timestamptz not null default now(),
  unique (employee_id, language_code)
);
create index if not exists idx_languages on employee_languages (tenant_id, employee_id);

-- ---------------------------------------------------------------------------
-- B — Famille & bénéficiaires
-- ---------------------------------------------------------------------------
create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  member_type text not null check (member_type in ('spouse','child','ascendant','other_dependent')),
  rank int,
  is_primary boolean default false,
  civility text,
  last_name text not null,
  first_names text not null,
  birth_name text,
  birth_date date,
  birth_place text,
  birth_country_code text,
  gender text check (gender in ('M','F')),
  nationality_country_code text,
  spouse_profession text,
  spouse_employer text,
  union_type text,
  union_date date,
  union_place text,
  filiation_type text,
  other_parent_employee_id uuid references employees (id),
  other_parent_name text,
  school_level text,
  school_class text,
  school_name text,
  school_type text,
  school_fees_covered boolean default false,
  school_fees_annual bigint,
  has_disability boolean default false,
  disability_nature text,
  birth_certificate_number text,
  ascendant_link text,
  ascendant_residence_address text,
  ascendant_residence_country_code text,
  monthly_support_amount bigint,
  other_dependent_link text,
  custody_reason text,
  custody_legal_doc_id uuid references employee_documents (id),
  fiscal_dependent boolean not null default false,
  effective_dependent boolean not null default false,
  health_insurance_beneficiary boolean not null default false,
  phone text,
  address text,
  current_status text not null default 'alive' check (current_status in ('alive','deceased','separated','divorced','emancipated')),
  status_changed_at date,
  document_id uuid references employee_documents (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_family_members on family_members (tenant_id, employee_id, member_type);

create table if not exists beneficiaries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  benefit_type text not null check (benefit_type in ('death_capital','life_insurance','pension_reversion','heritage_indemnities','other')),
  beneficiary_family_member_id uuid references family_members (id),
  external_last_name text,
  external_first_names text,
  external_birth_date date,
  external_link text,
  external_contact text,
  share_percentage numeric(5,2) not null check (share_percentage >= 0 and share_percentage <= 100),
  special_conditions text,
  designation_date date not null,
  document_id uuid references employee_documents (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((beneficiary_family_member_id is not null) or (external_last_name is not null))
);
create index if not exists idx_beneficiaries on beneficiaries (tenant_id, employee_id, benefit_type);

-- ---------------------------------------------------------------------------
-- C — Couverture sociale & assurances
-- ---------------------------------------------------------------------------
create table if not exists country_social_funds (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  code text not null,
  label text not null,
  fund_type text[] not null,
  affiliation_number_format text,
  mandatory_for_categories text[],
  effective_from date,
  effective_to date,
  unique (country_code, code, effective_from)
);

create table if not exists social_security_affiliations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  fund_id uuid not null references country_social_funds (id),
  affiliation_number text,
  affiliation_date date,
  status text not null default 'to_complete' check (status in ('active','suspended','radiated','detached','to_complete')),
  covered_dependents uuid[],
  observations text,
  document_id uuid references employee_documents (id),
  bilateral_convention text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, fund_id)
);

create table if not exists tenant_insurance_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  label text not null,
  company text not null,
  policy_type text not null check (policy_type in ('health','prevoyance','life','mutual')),
  policy_number text not null,
  subscription_date date not null,
  end_date date,
  coverage_levels text[],
  dependents_scope text not null,
  employer_share_pct numeric(5,2),
  employee_share_pct numeric(5,2),
  eligibility_conditions text,
  document_id uuid references employee_documents (id),
  manager_contact text,
  status text not null default 'active' check (status in ('active','suspended','terminated')),
  created_at timestamptz not null default now()
);

create table if not exists employee_insurance_enrollments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  policy_id uuid not null references tenant_insurance_policies (id),
  level_chosen text not null,
  enrollment_date date not null,
  end_date date,
  individual_coverage_number text,
  covered_dependents uuid[],
  monthly_contribution bigint,
  card_document_id uuid references employee_documents (id),
  status text not null default 'active' check (status in ('active','suspended','terminated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists employee_personal_insurance (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  insurance_type text not null,
  company text not null,
  policy_number text,
  manager_contact text,
  observations text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- D — Identité fiscale
-- ---------------------------------------------------------------------------
create table if not exists tax_identity (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  country_code text not null,
  identifier_type text not null,
  identifier_number text not null,
  status text not null default 'active' check (status in ('active','pending','suspended')),
  attribution_date date,
  is_primary boolean not null default false,
  document_id uuid references employee_documents (id),
  created_at timestamptz not null default now(),
  unique (employee_id, country_code)
);

create table if not exists tax_regime (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  fiscal_residence_status text not null check (fiscal_residence_status in ('resident_local','non_resident','resident_other_country','special')),
  fiscal_residence_country_code text,
  expatriation_status text check (expatriation_status in ('local','expat','detached','impat','special')),
  bilateral_convention text,
  special_regime_description text,
  fiscal_address text,
  fiscal_city text,
  fiscal_country_code text,
  fiscal_address_same_as_residence boolean default true,
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now()
);

create table if not exists employee_additional_income (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  income_types text[],
  observations text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- F — Coordonnées étendues
-- ---------------------------------------------------------------------------
create table if not exists employee_addresses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  address_type text not null check (address_type in ('residence_primary','residence_secondary','family_home','fiscal','billing','temporary')),
  is_primary boolean not null default false,
  line_1 text not null,
  line_2 text,
  local_references text,
  neighborhood text,
  city text not null,
  region text,
  postal_code text,
  country_code text not null,
  po_box text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  observations text,
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_addresses on employee_addresses (tenant_id, employee_id, address_type);

create table if not exists employee_phones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  phone_type text not null check (phone_type in ('primary','secondary','professional','landline','family','emergency')),
  number text not null,
  operator text,
  has_whatsapp boolean default false,
  has_mobile_money boolean default false,
  is_primary boolean not null default false,
  visibility text not null default 'manager_plus' check (visibility in ('public','manager_plus','hr_only','personal')),
  observations text,
  created_at timestamptz not null default now()
);
create index if not exists idx_phones on employee_phones (tenant_id, employee_id);

create table if not exists employee_emails (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  email_type text not null check (email_type in ('professional','personal','secondary','linkedin','other_pro')),
  address text not null,
  is_primary boolean not null default false,
  visibility text not null default 'public',
  used_for_hr_communications boolean default true,
  created_at timestamptz not null default now()
);

create table if not exists employee_emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  is_primary boolean not null default false,
  family_member_id uuid references family_members (id),
  external_last_name text,
  external_first_names text,
  external_link text,
  phone text not null,
  address text,
  preferred_language text,
  created_at timestamptz not null default now(),
  check ((family_member_id is not null) or (external_last_name is not null))
);

create table if not exists employee_communication_preferences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade unique,
  preferred_language text not null default 'fr',
  general_channel text not null default 'email',
  urgent_channel text not null default 'phone_call',
  legal_docs_channel text not null default 'in_app',
  accessibility_hours jsonb,
  unavailability_days jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Seed — caisses sociales obligatoires des 14 pays (référentiel)
-- ---------------------------------------------------------------------------
insert into country_social_funds (country_code, code, label, fund_type, effective_from) values
  ('CI','CNPS_CI','Caisse Nationale de Prévoyance Sociale', array['retirement','family','at'], '2024-01-01'),
  ('CI','CMU_CI','Couverture Maladie Universelle', array['health'], '2024-01-01'),
  ('SN','IPRES_SN','Institution de Prévoyance Retraite du Sénégal', array['retirement'], '2024-01-01'),
  ('SN','CSS_SN','Caisse de Sécurité Sociale', array['family','at'], '2024-01-01'),
  ('ML','INPS_ML','Institut National de Prévoyance Sociale', array['retirement','health'], '2024-01-01'),
  ('BF','CNSS_BF','Caisse Nationale de Sécurité Sociale', array['retirement','family'], '2024-01-01'),
  ('BJ','CNSS_BJ','Caisse Nationale de Sécurité Sociale', array['retirement'], '2024-01-01'),
  ('TG','CNSS_TG','Caisse Nationale de Sécurité Sociale', array['retirement'], '2024-01-01'),
  ('NE','CNSS_NE','Caisse Nationale de Sécurité Sociale', array['retirement'], '2024-01-01'),
  ('GW','INPS_GW','Instituto Nacional de Previdência Social', array['retirement'], '2024-01-01'),
  ('CM','CNPS_CM','Caisse Nationale de Prévoyance Sociale', array['retirement','family','at'], '2024-01-01'),
  ('GA','CNSS_GA','Caisse Nationale de Sécurité Sociale', array['retirement','family'], '2024-01-01'),
  ('GA','CNAMGS_GA','Caisse Nationale d''Assurance Maladie et de Garantie Sociale', array['health'], '2024-01-01'),
  ('CG','CNSS_CG','Caisse Nationale de Sécurité Sociale', array['retirement'], '2024-01-01'),
  ('TD','CNPS_TD','Caisse Nationale de Prévoyance Sociale', array['retirement'], '2024-01-01'),
  ('CF','CNSS_CF','Caisse Nationale de Sécurité Sociale', array['retirement'], '2024-01-01'),
  ('GQ','INSESO','Instituto de Seguridad Social', array['retirement','health'], '2024-01-01')
on conflict (country_code, code, effective_from) do nothing;

-- ---------------------------------------------------------------------------
-- RLS — isolation tenant systématique (claims SSO)
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array[
  'legal_documents','employee_nationalities','employee_languages','family_members','beneficiaries',
  'social_security_affiliations','tenant_insurance_policies','employee_insurance_enrollments','employee_personal_insurance',
  'tax_identity','tax_regime','employee_additional_income',
  'employee_addresses','employee_phones','employee_emails','employee_emergency_contacts','employee_communication_preferences'
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

-- country_social_funds : référentiel public en lecture
alter table country_social_funds enable row level security;
create policy social_funds_read on country_social_funds for select using (true);
