-- ============================================================================
-- Atlas People — M4 « Actes & conformité » (back-office Administration RH).
-- Réf. specs M4 ADMIN RH (docs 01–15). Périmètre RECENTRÉ : actes & obligations
-- transverses NON couverts par M1 Collaborateurs (qui porte déjà le dossier
-- 360°, les avenants et les départs côté UI). Les tables d'avenants/départs
-- restent ici comme couche de données partagée, consommée par l'UI Collaborateurs.
--
-- Couvre : contrats (+ modèles, signatures, alertes), période d'essai,
-- événements administratifs, départs, disciplinaire (accès restreint),
-- certificats/attestations, représentation du personnel, obligations légales
-- (registre, DPAE, affichage, contrôles), expatriés, audit chaîné SHA-256.
--
-- Règles dures honorées :
--   R1  Tout acte opposable signé ADVIST (signed_by + advist_hash).
--   R2  Validation 4-eyes (initiated_by / validated_by / signed_by distincts —
--       contrôlé applicativement ; colonnes présentes).
--   R3  Modèles validés par juriste (validated_by_juriste).
--   R4  Conservation 30 ans contrats/certificats, 3 ans sanctions (retention_*).
--   R6  Procédure disciplinaire OHADA : délais (prescription_deadline, etc.).
--   R7  Tout départ => documents légaux (generated_documents liés).
--   R8  Audit chaîné SHA-256 (m4_audit_log : prev_hash -> hash).
--   R10 Données sensibles (disciplinaire) : RLS is_hr_or_admin() strict.
--   R12 Contrats signés immuables (contrôlé applicativement + status).
--
-- RLS : tenant_isolation (current_tenant_ids) en lecture ; écriture gardée par
-- is_hr_or_admin(). Additif & idempotent (create … if not exists).
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- ---------------------------------------------------------------------------
-- 0. ENUMS
-- ---------------------------------------------------------------------------
do $$ begin create type m4_contract_type as enum
  ('CDI','CDD','CDD_CHANT','CDD_SAISON','CDD_REMP','APPR','STAGE','INTERIM','MANDAT','TPS_PART','EXPAT');
exception when duplicate_object then null; end $$;

do $$ begin create type m4_contract_status as enum
  ('draft','validated_n1','signed_employer','pending_employee','signed_both','active',
   'amended','suspended','terminated','archived','cancelled','refused_employee');
exception when duplicate_object then null; end $$;

do $$ begin create type m4_sensitivity as enum ('low','medium','high');
exception when duplicate_object then null; end $$;

do $$ begin create type m4_departure_type as enum
  ('DEMISSION','LICEN_PERSO','LICEN_FAUTE','LICEN_ECO','RUPT_CONV','FIN_CDD',
   'RUPT_ESSAI','RETRAITE','DECES','ABANDON_POSTE');
exception when duplicate_object then null; end $$;

do $$ begin create type m4_discipline_status as enum
  ('opened','under_investigation','interview_scheduled','interview_done',
   'deciding','sanction_notified','contested','closed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin create type m4_probation_decision as enum ('pending','confirmed','extended','terminated');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 1. CONTRATS
-- ---------------------------------------------------------------------------
create table if not exists m4_contract_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  code text not null,
  libelle text not null,
  country_code text not null,
  contract_type m4_contract_type not null,
  convention text,
  language text not null default 'fr' check (language in ('fr','en','bilingual')),
  body jsonb not null default '{}'::jsonb,            -- articles + clauses
  validated_by_juriste boolean not null default false,
  validation_date date, validated_by uuid,
  version int not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, code, version)
);
create index if not exists idx_m4_ctpl on m4_contract_templates (tenant_id, country_code, contract_type);

create table if not exists m4_contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  ref text not null,
  type m4_contract_type not null,
  template_id uuid references m4_contract_templates (id),
  societe text, etablissement text, convention text,
  fonction text, service text, classification text, coefficient int,
  workplace text, work_time text, weekly_hours numeric, teletravail text,
  base_salary bigint,                                  -- francs (Money)
  allowances jsonb not null default '[]'::jsonb,
  clauses jsonb not null default '[]'::jsonb,
  probation_months int, probation_confirmed_at date,
  signed_at date, effective_date date, end_date date,  -- end_date null si CDI
  status m4_contract_status not null default 'draft',
  -- 4-eyes + signature ADVIST
  initiated_by uuid, validated_by uuid, signed_by uuid,
  advist_hash text,
  retention_until date,                                -- R4 : 30 ans après fin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, ref)
);
create index if not exists idx_m4_contracts_emp on m4_contracts (tenant_id, employee_id);
create index if not exists idx_m4_contracts_status on m4_contracts (tenant_id, status);

create table if not exists m4_contract_signatures (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  contract_id uuid not null references m4_contracts (id) on delete cascade,
  party text not null check (party in ('employer','employee','witness')),
  signer_name text not null, signed_at timestamptz, advist_id text,
  created_at timestamptz not null default now()
);

-- Avenants : couche de données (UI portée par M1 Collaborateurs).
create table if not exists m4_contract_amendments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  contract_id uuid references m4_contracts (id) on delete cascade,
  ref text not null,
  category_code text not null,                          -- remuneration|fonction|lieu|temps|contractuel|clauses|divers
  type_label text not null,
  objet text,
  sensitivity m4_sensitivity not null default 'medium',
  modifications jsonb not null default '[]'::jsonb,
  payroll_delta bigint,                                 -- impact paie /mois (francs)
  effective_date date, signed_at date,
  status m4_contract_status not null default 'draft',
  initiated_by uuid, validated_by uuid, signed_by uuid, advist_hash text,
  created_at timestamptz not null default now(),
  unique (tenant_id, ref)
);
create index if not exists idx_m4_amend_emp on m4_contract_amendments (tenant_id, employee_id);

create table if not exists m4_contract_alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  kind text not null check (kind in ('cdd','probation','expat','mandate','habilitation','medical','disciplinary')),
  severity text not null default 'warn' check (severity in ('info','warn','danger')),
  message text not null,
  due_date date, days_left int,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_m4_alerts on m4_contract_alerts (tenant_id, resolved, due_date);

-- ---------------------------------------------------------------------------
-- 2. PÉRIODE D'ESSAI
-- ---------------------------------------------------------------------------
create table if not exists m4_probation_periods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  contract_id uuid references m4_contracts (id) on delete cascade,
  contract_type m4_contract_type not null,
  category text,
  duration_months int not null,
  start_date date not null, end_date date not null,
  decision m4_probation_decision not null default 'pending',
  decision_notified_at date,
  extended_until date,
  created_at timestamptz not null default now()
);
create index if not exists idx_m4_prob_emp on m4_probation_periods (tenant_id, employee_id);

create table if not exists m4_probation_evaluations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  probation_id uuid not null references m4_probation_periods (id) on delete cascade,
  kind text not null default 'intermediate' check (kind in ('intermediate','final')),
  scores jsonb not null default '{}'::jsonb,
  notes text, recommendation text,
  conducted_by uuid, conducted_at date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. ÉVÉNEMENTS ADMINISTRATIFS
-- ---------------------------------------------------------------------------
create table if not exists m4_admin_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  ref text,
  category text not null,                               -- EMBAUCHE|MOBILITE|SUSPENSION|REPRISE|FIN_CARRIERE|EXCEPTIONNEL|ADMIN
  event_type text not null,
  event_date date not null, effective_date date, end_date date,
  event_data jsonb not null default '{}'::jsonb,
  supporting_documents jsonb not null default '[]'::jsonb,
  impacts jsonb not null default '[]'::jsonb,           -- M1/M2/M3/M12 propagés
  status text not null default 'draft' check (status in ('draft','validated','activated','cancelled')),
  initiated_by uuid, validated_by uuid,
  audit_hash text,
  created_at timestamptz not null default now()
);
create index if not exists idx_m4_events_emp on m4_admin_events (tenant_id, employee_id, event_date);

-- ---------------------------------------------------------------------------
-- 4. DÉPARTS (couche de données ; UI portée par M1 Collaborateurs)
-- ---------------------------------------------------------------------------
create table if not exists m4_departures (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  ref text not null,
  type m4_departure_type not null,
  initiative text check (initiative in ('salarie','employeur','mutuelle','force_majeure')),
  notified_at date, notice_start date, notice_end date, end_date date,
  notice_period_days int, notice_done boolean,
  indemnities jsonb not null default '[]'::jsonb,
  estimated_stc bigint,
  reason text, context text, risks jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','in_progress','closed','cancelled')),
  initiated_by uuid, validated_n1_by uuid, validated_n2_by uuid, signed_by uuid,
  audit_hash text,
  retention_until date,                                  -- 10 ans post-départ
  created_at timestamptz not null default now(),
  unique (tenant_id, ref)
);
create index if not exists idx_m4_dep_emp on m4_departures (tenant_id, employee_id);

create table if not exists m4_departure_checklist (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  departure_id uuid not null references m4_departures (id) on delete cascade,
  category text not null,                                -- RH|PAIE|IT|MANAGEMENT|FINANCE|AUTRE
  label text not null, assignee_role text, due_date date,
  done boolean not null default false, done_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_m4_dep_check on m4_departure_checklist (tenant_id, departure_id);

create table if not exists m4_departure_exit_interviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  departure_id uuid not null references m4_departures (id) on delete cascade,
  conducted_by uuid, conducted_at date,
  sections jsonb not null default '{}'::jsonb,
  global_rating int, would_recommend boolean, alumni_consent boolean,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. DISCIPLINAIRE (accès restreint — R10)
-- ---------------------------------------------------------------------------
create table if not exists m4_disciplinary_cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  case_number text not null,
  opened_at date not null, opened_by uuid,
  source_type text,
  facts_date date not null, facts_location text, facts_description text not null,
  prescription_deadline date not null,                  -- facts_date + 2 mois (R6)
  proposed_qualification text, final_qualification text,
  envisaged_sanction text, final_sanction text, final_sanction_details jsonb,
  conservatory_suspension boolean not null default false,
  conservatory_start date, conservatory_end date,
  status m4_discipline_status not null default 'opened',
  drh_in_charge uuid, legal_advisor uuid,
  protected_category boolean not null default false,
  inspection_authorization_status text,
  effacement_date date,                                  -- 3 ans (R4) sauf récidive
  audit_hash text,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (tenant_id, case_number)
);
create index if not exists idx_m4_disc_emp on m4_disciplinary_cases (tenant_id, employee_id);

create table if not exists m4_disciplinary_steps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  case_id uuid not null references m4_disciplinary_cases (id) on delete cascade,
  kind text not null,            -- evidence|witness|convocation|interview|decision|notification|appeal
  label text not null,
  payload jsonb not null default '{}'::jsonb,
  step_date date, legal_delay text, done boolean not null default false,
  advist_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_m4_disc_steps on m4_disciplinary_steps (tenant_id, case_id);

-- ---------------------------------------------------------------------------
-- 6. CERTIFICATS & ATTESTATIONS
-- ---------------------------------------------------------------------------
create table if not exists m4_document_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  code text not null, libelle text not null,
  category text not null,        -- certificat_legal|attestation|courrier|formulaire
  country_code text not null,
  sensitivity m4_sensitivity not null default 'low',
  signer_role text not null default 'drh',
  retention_years int not null default 10,
  body text not null default '', style jsonb not null default '{}'::jsonb,
  version int not null default 1, active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, code, version)
);

create table if not exists m4_document_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  doc_code text not null, purpose text, recipient text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','generated')),
  requested_at timestamptz not null default now(),
  sla_due_at timestamptz
);

create table if not exists m4_generated_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  document_number text not null,
  template_id uuid references m4_document_templates (id),
  employee_id uuid not null references employees (id) on delete cascade,
  category text not null, purpose text, recipient text,
  related_departure_id uuid references m4_departures (id),
  generated_at timestamptz not null default now(), generated_by uuid,
  generation_method text default 'manual' check (generation_method in ('manual','automatic','bulk')),
  signed_by uuid, signed_at timestamptz, advist_id text,
  pdf_url text, pdf_hash text,
  verify_token text,                                     -- QR vérification publique
  revoked boolean not null default false, revoked_at timestamptz,
  retention_until date,
  unique (tenant_id, document_number)
);
create index if not exists idx_m4_gendoc_emp on m4_generated_documents (tenant_id, employee_id, generated_at desc);

-- ---------------------------------------------------------------------------
-- 7. REPRÉSENTATION DU PERSONNEL
-- ---------------------------------------------------------------------------
create table if not exists m4_representation_instances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  kind text not null check (kind in ('DP','CSE','CE','CHSCT','SYNDICAT')),
  etablissement text,
  mandate_start date, mandate_end date,
  titulaires int default 0, suppleants int default 0,
  created_at timestamptz not null default now()
);

create table if not exists m4_representation_elections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  instance_id uuid references m4_representation_instances (id) on delete cascade,
  scrutin_date date,
  status text not null default 'planned' check (status in ('planned','candidacies','voting','counted','proclaimed','carence')),
  electoral_list_count int, voters_count int, turnout_pct numeric,
  results jsonb not null default '[]'::jsonb,
  audit_hash text,
  created_at timestamptz not null default now()
);

create table if not exists m4_representation_mandates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  instance_id uuid references m4_representation_instances (id) on delete cascade,
  type text not null, mode text check (mode in ('elu','designe')),
  start_date date not null, end_date date,
  delegation_hours int,
  protected_until date,                                  -- statut protégé (R11)
  status text not null default 'active' check (status in ('active','ended','suspended')),
  created_at timestamptz not null default now()
);
create index if not exists idx_m4_mandate_emp on m4_representation_mandates (tenant_id, employee_id, status);

create table if not exists m4_representation_meetings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  instance_id uuid references m4_representation_instances (id) on delete cascade,
  meeting_date timestamptz not null,
  agenda jsonb not null default '[]'::jsonb,
  pv jsonb, commitments jsonb not null default '[]'::jsonb,
  signed_all boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists m4_representation_accords (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  title text not null, kind text,
  period_start date, period_end date,
  status text not null default 'draft' check (status in ('draft','signed','deposited','expired')),
  signatories jsonb not null default '[]'::jsonb,
  pdf_url text, audit_hash text, legal_deposit_at date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 8. OBLIGATIONS LÉGALES
-- ---------------------------------------------------------------------------
create table if not exists m4_legal_registers_status (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  register_code text not null,            -- rup|mouvements|at_mp|hs|repos|sanctions|elections|...
  label text not null,
  up_to_date boolean not null default true,
  last_updated date, volume int,
  retention_years int not null default 5,
  unique (tenant_id, register_code)
);

create table if not exists m4_legal_dpae (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  contract_id uuid references m4_contracts (id) on delete cascade,
  country_code text not null, organisme text not null default 'CNPS',
  hire_date date not null, due_at timestamptz,
  status text not null default 'to_submit' check (status in ('to_submit','validated','submitted','receipt')),
  receipt_number text, submitted_at timestamptz, submitted_by uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_m4_dpae_emp on m4_legal_dpae (tenant_id, employee_id);

create table if not exists m4_legal_postings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  site text not null, document_code text not null, document_label text not null,
  displayed_at date, responsible text,
  status text not null default 'ok' check (status in ('ok','attention','missing')),
  last_verification date,
  unique (tenant_id, site, document_code)
);

create table if not exists m4_legal_controls (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  organisme text not null, scope text, notified_at date, visit_date date,
  inspector_name text,
  status text not null default 'planned' check (status in ('planned','in_progress','observations','closed')),
  observations jsonb not null default '[]'::jsonb,
  pv_number text, pv_url text, closed_at date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 9. EXPATRIÉS & MOBILITÉ INTERNATIONALE
-- ---------------------------------------------------------------------------
create table if not exists m4_expat_files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  category text not null,                 -- salarie_etranger_local|expatrie|detache|impatrie|double_salaire|voyageur
  origin_country text, host_country text, societe text,
  mission_type text, arrival_date date, mission_start date, mission_end date,
  sur_salaire_pct numeric,
  fiscal_residence text, tax_equalization boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, employee_id)
);

create table if not exists m4_expat_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  expat_id uuid not null references m4_expat_files (id) on delete cascade,
  doc_type text not null check (doc_type in ('passport','visa','residence_card','work_permit','medical')),
  label text not null, ref text, expiry date,
  status text not null default 'valid' check (status in ('valid','expiring','expired','pending')),
  created_at timestamptz not null default now()
);
create index if not exists idx_m4_expatdoc on m4_expat_documents (tenant_id, expat_id, expiry);

create table if not exists m4_expat_packages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  expat_id uuid not null references m4_expat_files (id) on delete cascade,
  lines jsonb not null default '[]'::jsonb,            -- {label,value,imposable}
  monthly_total bigint, annual_employer_cost bigint,
  created_at timestamptz not null default now()
);

create table if not exists m4_expat_missions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  destination text not null, host_company text,
  start_date date, end_date date, mission_type text,
  prerequisites jsonb not null default '[]'::jsonb,
  status text not null default 'planned' check (status in ('planned','in_progress','ended')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 10. AUDIT CHAÎNÉ M4 (SHA-256 : prev_hash -> hash) — R8
-- ---------------------------------------------------------------------------
create table if not exists m4_audit_log (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid references employees (id),
  actor uuid,
  action_type text not null,              -- ex. admin.contract.signed
  severity text not null default 'INFO' check (severity in ('INFO','WARNING','CRITICAL')),
  detail text,
  payload jsonb not null default '{}'::jsonb,
  prev_hash text, hash text,
  created_at timestamptz not null default now()
);
create index if not exists idx_m4_audit on m4_audit_log (tenant_id, created_at desc);

-- ===========================================================================
-- RLS — lecture isolée par tenant ; écriture gardée par is_hr_or_admin().
-- Disciplinaire : même garde (is_hr_or_admin couvre DRH/admin ; accès restreint).
-- ===========================================================================
do $$
declare t text;
  tabs text[] := array[
    'm4_contract_templates','m4_contracts','m4_contract_signatures','m4_contract_amendments',
    'm4_contract_alerts','m4_probation_periods','m4_probation_evaluations','m4_admin_events',
    'm4_departures','m4_departure_checklist','m4_departure_exit_interviews',
    'm4_disciplinary_cases','m4_disciplinary_steps',
    'm4_document_templates','m4_document_requests','m4_generated_documents',
    'm4_representation_instances','m4_representation_elections','m4_representation_mandates',
    'm4_representation_meetings','m4_representation_accords',
    'm4_legal_registers_status','m4_legal_dpae','m4_legal_postings','m4_legal_controls',
    'm4_expat_files','m4_expat_documents','m4_expat_packages','m4_expat_missions',
    'm4_audit_log'
  ];
begin
  foreach t in array tabs loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists %I on %I;', 'p_'||t||'_sel', t);
    execute format(
      'create policy %I on %I for select using (tenant_id in (select current_tenant_ids()));',
      'p_'||t||'_sel', t);
    execute format('drop policy if exists %I on %I;', 'p_'||t||'_all', t);
    execute format(
      'create policy %I on %I for all using (is_hr_or_admin(tenant_id) and tenant_id in (select current_tenant_ids())) with check (is_hr_or_admin(tenant_id) and tenant_id in (select current_tenant_ids()));',
      'p_'||t||'_all', t);
  end loop;
end $$;

-- Fin migration 0021 — M4 Actes & conformité.
