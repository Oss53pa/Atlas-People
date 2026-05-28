-- ============================================================================
-- Atlas People — M3 PAIE (back-office ERP paie, 14 régimes OHADA/SYSCOHADA).
-- Schéma atlas_people. Backbone du module : référentiels, dossier paie, cycle
-- mensuel (7 étapes), saisie variables, bulletins, virements, déclarations,
-- OD comptables, régularisations/STC, modèles, reporting, audit chaîné SHA-256.
-- Règles dures : Money bigint (francs), versionnement, 4-eyes, cycle clôturé
-- immuable. RLS tenant_isolation (current_tenant_ids). Additif & idempotent.
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- ---------------------------------------------------------------------------
-- 1. RÉFÉRENTIELS
-- ---------------------------------------------------------------------------
create table if not exists country_payroll_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  country_code text not null,
  version text not null,
  effective_from date not null,
  effective_to date,
  rules jsonb not null default '{}'::jsonb,
  signed_at timestamptz, signed_by uuid, audit_hash text,
  created_at timestamptz not null default now(),
  unique (tenant_id, country_code, version)
);

create table if not exists payroll_companies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  code text not null,
  raison_sociale text not null,
  sigle text,
  legal_form text,
  country_code text not null,
  rccm text, ninea_ifu text,
  capital_social bigint,
  siege_social text,
  representant_legal text,
  convention_id uuid,
  rules_version text,
  status text not null default 'active' check (status in ('active','pre_prod','suspended','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);
create index if not exists idx_payroll_companies on payroll_companies (tenant_id);

create table if not exists payroll_company_establishments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  company_id uuid not null references payroll_companies (id) on delete cascade,
  name text not null, address text, city text, country_code text,
  manager_employee_id uuid references employees (id),
  convention_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists payroll_company_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  company_id uuid not null references payroll_companies (id) on delete cascade,
  role text not null, -- salaires | cnps | fiscal | autre
  bank_name text not null, iban text, swift_bic text, currency text not null default 'XOF',
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists payroll_company_social_numbers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  company_id uuid not null references payroll_companies (id) on delete cascade,
  organisme text not null, -- CNPS | IPRES | DGI | FDFP ...
  numero text not null, affiliation_date date, taux_conventionnel numeric,
  created_at timestamptz not null default now()
);

create table if not exists payroll_rubriques (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  code text not null,
  libelle_fr text not null, libelle_en text,
  category text not null,
  rubrique_type text not null check (rubrique_type in ('gain','retenue','cotisation_emp','cotisation_pat','info')),
  visible_on_bulletin boolean not null default true,
  visible_position int,
  visible_section text check (visible_section in ('gains','retenues','cotisations','cumuls','recap',null)),
  enters_base_cnps boolean not null default false,
  enters_base_irpp boolean not null default false,
  enters_base_taxes_assimilees boolean not null default false,
  enters_brut_social boolean not null default false,
  enters_brut_fiscal boolean not null default false,
  account_debit text, account_credit text, analytical_axis_1 text, analytical_axis_2 text,
  applicable_country_codes text[],
  active boolean not null default true,
  effective_from date not null default '2026-01-01',
  effective_to date,
  version int not null default 1,
  parent_rubrique_id uuid references payroll_rubriques (id),
  status text not null default 'published' check (status in ('draft','submitted','validated','published','refused','archived')),
  created_at timestamptz not null default now(), created_by uuid,
  validated_at timestamptz, validated_by uuid, audit_hash text,
  unique (tenant_id, code, version)
);
create index if not exists idx_payroll_rubriques on payroll_rubriques (tenant_id, category);

create table if not exists payroll_rubrique_formulas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  rubrique_id uuid not null references payroll_rubriques (id) on delete cascade,
  version int not null default 1,
  formula text not null,           -- DSL paie (jamais d'eval JS)
  condition text,
  rounding text not null default 'HALF_EVEN',
  decimals int not null default 0,
  dependencies text[],
  created_at timestamptz not null default now()
);

create table if not exists payroll_baremes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  code text not null,
  libelle text not null,
  type text not null check (type in ('taux_unique','tranches_progressives','tranches_par_tranches','table_valeurs')),
  country_code text,
  unit text,
  value numeric,                   -- pour taux_unique / table_valeurs simple
  effective_from date not null default '2026-01-01',
  effective_to date,
  version text not null default '2026.01',
  reference_legale text,
  signed_by uuid, audit_hash text,
  created_at timestamptz not null default now(),
  unique (tenant_id, code, version)
);

create table if not exists payroll_baremes_tranches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  bareme_id uuid not null references payroll_baremes (id) on delete cascade,
  ordre int not null,
  borne_min numeric, borne_max numeric,  -- max null = infini
  taux numeric, montant_fixe numeric, formule_complement text
);
create index if not exists idx_baremes_tranches on payroll_baremes_tranches (bareme_id, ordre);

create table if not exists payroll_conventions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  code text not null, libelle text not null,
  country_code text not null, secteur text,
  date_signature date, date_application date, reference_legale text,
  rules jsonb not null default '{}'::jsonb,
  active boolean not null default true, version int not null default 1,
  created_at timestamptz not null default now(),
  unique (tenant_id, code, version)
);

create table if not exists payroll_profils (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  code text not null, libelle text not null,
  country_code text not null,
  convention_id uuid references payroll_conventions (id),
  rubriques_par_defaut uuid[],
  rubriques_optionnelles uuid[],
  parametres jsonb not null default '{}'::jsonb,
  active boolean not null default true, version int not null default 1,
  created_at timestamptz not null default now(),
  unique (tenant_id, code, version)
);

create table if not exists payroll_tenant_parameters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  section text not null,           -- calendrier | devises | arrondis | bornages | workflow | numerotation | notifications | integrations
  params jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (tenant_id, section)
);

create table if not exists payroll_modeles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  code text not null, libelle text not null,
  country_code text not null,
  profil_id uuid references payroll_profils (id),
  parent_modele_id uuid references payroll_modeles (id),  -- héritage
  parametres jsonb not null default '{}'::jsonb,
  active boolean not null default true, version int not null default 1,
  created_at timestamptz not null default now(),
  unique (tenant_id, code, version)
);

create table if not exists payroll_modele_rubriques (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  modele_id uuid not null references payroll_modeles (id) on delete cascade,
  rubrique_id uuid not null references payroll_rubriques (id),
  default_value numeric, ordre int, optional boolean not null default false
);

-- ---------------------------------------------------------------------------
-- 2. DOSSIER PAIE
-- ---------------------------------------------------------------------------
create table if not exists employee_payroll_file (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade unique,
  company_id uuid references payroll_companies (id),
  profil_id uuid references payroll_profils (id),
  modele_id uuid references payroll_modeles (id),
  classification text,
  parts_fiscales numeric(3,1) not null default 1,
  matricule_paie text,
  payment_method text,
  status text not null default 'active' check (status in ('active','suspended','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists employee_payroll_fixed_elements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  rubrique_code text not null,
  amount bigint not null default 0,
  currency text not null default 'XOF',
  effective_from date not null default '2026-01-01',
  effective_to date,
  active boolean not null default true,
  validated_by uuid, validated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_emp_payroll_fixed on employee_payroll_fixed_elements (tenant_id, employee_id, active);

create table if not exists employee_payroll_fixed_elements_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  rubrique_code text not null, old_amount bigint, new_amount bigint,
  reason text, changed_by uuid, changed_at timestamptz not null default now(), audit_hash text
);

create table if not exists employee_payroll_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  company_id uuid references payroll_companies (id),
  profil_id uuid references payroll_profils (id),
  effective_from date not null, effective_to date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. CYCLE & INPUTS
-- ---------------------------------------------------------------------------
create table if not exists payroll_cycles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  company_id uuid references payroll_companies (id),
  period text not null,            -- '2026-05'
  label text not null,
  country_code text not null default 'CI',
  cycle_type text not null default 'normal' check (cycle_type in ('normal','correction','stc')),
  status text not null default 'open' check (status in ('open','preparation','calculation','validation','diffusion','payment','closed','archived')),
  current_phase text not null default 'preparation',
  pay_date date,
  deadline_saisie date, deadline_validation date, deadline_diffusion date,
  headcount int not null default 0,
  seized_count int not null default 0,
  total_brut bigint not null default 0,
  total_net bigint not null default 0,
  total_cotisations bigint not null default 0,
  total_cout_employeur bigint not null default 0,
  opened_at timestamptz not null default now(), opened_by uuid,
  closed_at timestamptz, closed_by uuid, final_hash text,
  created_at timestamptz not null default now(),
  unique (tenant_id, company_id, period, cycle_type)
);
create index if not exists idx_payroll_cycles on payroll_cycles (tenant_id, status);

create table if not exists payroll_cycle_phases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  cycle_id uuid not null references payroll_cycles (id) on delete cascade,
  phase text not null,
  started_at timestamptz, completed_at timestamptz, actor_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists payroll_cycle_alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  cycle_id uuid not null references payroll_cycles (id) on delete cascade,
  employee_id uuid references employees (id),
  severity text not null check (severity in ('info','warn','danger','critical')),
  code text not null, message text not null,
  resolved boolean not null default false, resolved_by uuid, resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_cycle_alerts on payroll_cycle_alerts (tenant_id, cycle_id, resolved);

create table if not exists payroll_inputs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  cycle_id uuid not null references payroll_cycles (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  saisie_status text not null default 'to_seize' check (saisie_status in ('to_seize','prefilled','seized','anomaly','blocked','locked')),
  jours_ouvrables numeric, jours_travailles numeric, heures_travaillees numeric,
  prorata_pct numeric,
  data jsonb not null default '{}'::jsonb,   -- agrégat des sous-saisies (offline-friendly)
  updated_at timestamptz not null default now(), updated_by uuid,
  created_at timestamptz not null default now(),
  unique (cycle_id, employee_id)
);
create index if not exists idx_payroll_inputs on payroll_inputs (tenant_id, cycle_id, saisie_status);

do $$
declare t text;
declare tabs text[] := array[
  'payroll_inputs_time_presence','payroll_inputs_overtime','payroll_inputs_absences',
  'payroll_inputs_bonuses','payroll_inputs_exceptional_deductions','payroll_inputs_expenses',
  'payroll_inputs_advances_deduction','payroll_inputs_events','payroll_inputs_notes'
];
begin
  foreach t in array tabs loop
    execute format($f$
      create table if not exists %I (
        id uuid primary key default gen_random_uuid(),
        tenant_id uuid not null references tenants (id) on delete cascade,
        cycle_id uuid not null references payroll_cycles (id) on delete cascade,
        employee_id uuid not null references employees (id) on delete cascade,
        rubrique_code text,
        label text,
        amount bigint,
        quantity numeric,
        rate numeric,
        payload jsonb not null default '{}'::jsonb,
        source text not null default 'manual',   -- m2 | s7 | s8 | mss | manual | reconduite
        validated_by uuid, validated_at timestamptz,
        created_at timestamptz not null default now(), created_by uuid
      );
    $f$, t);
    execute format('create index if not exists idx_%1$s on %1$s (tenant_id, cycle_id, employee_id);', t);
  end loop;
end $$;

create table if not exists payroll_input_audit_log (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references tenants (id) on delete cascade,
  cycle_id uuid references payroll_cycles (id) on delete cascade,
  employee_id uuid references employees (id),
  actor_id uuid, action_type text not null, input_type text,
  previous_value jsonb, new_value jsonb,
  prev_hash text, current_hash text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. CALCUL & BULLETINS
-- ---------------------------------------------------------------------------
create table if not exists payroll_calculation_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  cycle_id uuid not null references payroll_cycles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  total int not null default 0, computed int not null default 0, anomalies int not null default 0,
  started_at timestamptz, completed_at timestamptz, launched_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists payroll_calculation_anomalies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  cycle_id uuid not null references payroll_cycles (id) on delete cascade,
  employee_id uuid references employees (id),
  severity text not null check (severity in ('info','warn','danger','critical')),
  code text not null, message text not null, blocking boolean not null default false,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists payroll_bulletins (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  cycle_id uuid not null references payroll_cycles (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  numero text,
  currency text not null default 'XOF',
  brut_total bigint not null default 0,
  base_cnps bigint not null default 0,
  base_irpp bigint not null default 0,
  total_cotisations_emp bigint not null default 0,
  total_retenues bigint not null default 0,
  net_a_payer bigint not null default 0,
  total_cotisations_pat bigint not null default 0,
  cout_employeur bigint not null default 0,
  status text not null default 'draft' check (status in ('draft','calculated','validated_n1','validated_n2','signed','diffused','closed','superseded')),
  prev_hash text, audit_hash text,
  calculated_at timestamptz, diffused_at timestamptz,
  created_at timestamptz not null default now(),
  unique (cycle_id, employee_id)
);
create index if not exists idx_payroll_bulletins on payroll_bulletins (tenant_id, cycle_id, status);

create table if not exists payroll_bulletin_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  bulletin_id uuid not null references payroll_bulletins (id) on delete cascade,
  rubrique_code text not null, libelle text not null,
  section text not null, -- gains | bases | cotisations | retenues | recap | patronal
  base bigint, taux numeric, montant bigint not null default 0,
  ordre int,
  created_at timestamptz not null default now()
);
create index if not exists idx_bulletin_lines on payroll_bulletin_lines (bulletin_id, ordre);

create table if not exists payroll_bulletin_validations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  bulletin_id uuid not null references payroll_bulletins (id) on delete cascade,
  level text not null check (level in ('n1','n2','signature')),
  validator_id uuid, validated_at timestamptz, comment text, audit_hash text,
  created_at timestamptz not null default now()
);

create table if not exists payroll_ecarts_justifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  bulletin_id uuid not null references payroll_bulletins (id) on delete cascade,
  rubrique_code text, variation_pct numeric, justification text,
  justified_by uuid, created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. VIREMENTS
-- ---------------------------------------------------------------------------
create table if not exists payroll_payment_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  cycle_id uuid not null references payroll_cycles (id) on delete cascade,
  numero text not null,
  channel text not null check (channel in ('mobile_money','bank_transfer','cash','mixed')),
  provider text,                    -- cinetpay | wave | bank
  total_amount bigint not null default 0, currency text not null default 'XOF',
  beneficiaries int not null default 0,
  status text not null default 'prepared' check (status in ('prepared','validated_drh','validated_tresorier','executing','executed','failed','partial')),
  validated_drh_by uuid, validated_tresorier_by uuid,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, numero)
);

create table if not exists payroll_payment_order_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  order_id uuid not null references payroll_payment_orders (id) on delete cascade,
  employee_id uuid not null references employees (id),
  bulletin_id uuid references payroll_bulletins (id),
  amount bigint not null, currency text not null default 'XOF',
  method text not null, account_ref text,
  status text not null default 'pending' check (status in ('pending','sent','succeeded','failed')),
  created_at timestamptz not null default now()
);
create index if not exists idx_payment_order_lines on payroll_payment_order_lines (order_id);

create table if not exists payroll_payment_execution (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  order_line_id uuid not null references payroll_payment_order_lines (id) on delete cascade,
  external_ref text, provider_status text, executed_at timestamptz, error_message text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. DÉCLARATIONS SOCIALES / FISCALES
-- ---------------------------------------------------------------------------
create table if not exists declaration_catalog (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants (id) on delete cascade, -- NULL = commun
  country_code text not null, code text not null, libelle text not null,
  organisme text not null, periodicite text not null, -- mensuelle | trimestrielle | annuelle
  created_at timestamptz not null default now()
);
create unique index if not exists uq_declaration_catalog on declaration_catalog (coalesce(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid), country_code, code);

create table if not exists payroll_declarations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  cycle_id uuid references payroll_cycles (id) on delete cascade,
  company_id uuid references payroll_companies (id),
  catalog_code text not null, organisme text not null,
  period text not null,
  total_base bigint not null default 0, total_cotisations bigint not null default 0,
  status text not null default 'generated' check (status in ('generated','validated','submitted','receipt_received','rejected','corrected')),
  generated_at timestamptz not null default now(), submitted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_payroll_declarations on payroll_declarations (tenant_id, status);

create table if not exists payroll_declaration_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  declaration_id uuid not null references payroll_declarations (id) on delete cascade,
  employee_id uuid references employees (id),
  base bigint, taux numeric, montant bigint not null default 0, line_code text,
  created_at timestamptz not null default now()
);

create table if not exists payroll_declaration_submissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  declaration_id uuid not null references payroll_declarations (id) on delete cascade,
  channel text, submitted_at timestamptz not null default now(), submitted_by uuid,
  receipt_ref text, receipt_at timestamptz, audit_hash text
);

-- ---------------------------------------------------------------------------
-- 7. OD COMPTABLES
-- ---------------------------------------------------------------------------
create table if not exists payroll_accounting_mappings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  rubrique_code text not null, account_debit text, account_credit text,
  analytical_axis_1 text, analytical_axis_2 text,
  created_at timestamptz not null default now()
);

create table if not exists payroll_accounting_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  cycle_id uuid not null references payroll_cycles (id) on delete cascade,
  reference text, label text, journal text not null default 'PAIE',
  entry_date date not null default now(),
  total_debit bigint not null default 0, total_credit bigint not null default 0,
  balanced boolean not null default false,
  status text not null default 'draft' check (status in ('draft','generated','exported')),
  exported_to text, exported_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists payroll_accounting_entry_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  entry_id uuid not null references payroll_accounting_entries (id) on delete cascade,
  account text not null, label text, debit bigint not null default 0, credit bigint not null default 0,
  analytical_axis_1 text, analytical_axis_2 text
);
create index if not exists idx_accounting_entry_lines on payroll_accounting_entry_lines (entry_id);

-- ---------------------------------------------------------------------------
-- 8. RÉGULARISATIONS & STC
-- ---------------------------------------------------------------------------
create table if not exists payroll_regularizations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  reg_type text not null check (reg_type in ('retroactive','rappel','trop_percu','correction')),
  target_period text not null, applied_period text,
  amount bigint not null default 0,
  reason text,
  status text not null default 'created' check (status in ('created','calculated','validated','executed','cancelled')),
  created_at timestamptz not null default now(), created_by uuid
);

create table if not exists payroll_stc (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  exit_date date not null, exit_motive text,
  total_credits bigint not null default 0, total_debits bigint not null default 0, net_amount bigint not null default 0,
  status text not null default 'initiated' check (status in ('initiated','calculated','signed','executed')),
  signed_at timestamptz, executed_at timestamptz, audit_hash text,
  created_at timestamptz not null default now()
);

create table if not exists payroll_stc_components (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  stc_id uuid not null references payroll_stc (id) on delete cascade,
  line_type text not null check (line_type in ('credit','debit')),
  label text not null, amount bigint not null default 0, legal_reference text, ordre int
);

-- ---------------------------------------------------------------------------
-- 9. REPORTING
-- ---------------------------------------------------------------------------
create table if not exists payroll_budgets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  company_id uuid references payroll_companies (id),
  year int not null, label text not null,
  total_budget bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists payroll_budget_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  budget_id uuid not null references payroll_budgets (id) on delete cascade,
  period text not null, category text, budgeted bigint not null default 0, realized bigint not null default 0
);

create table if not exists payroll_kpi_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  period text not null, company_id uuid references payroll_companies (id),
  masse_salariale_brute bigint, masse_salariale_chargee bigint, net_total bigint,
  effectif int, etp numeric, cout_moyen bigint,
  parite_h_pct numeric, parite_f_pct numeric,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 10. AUDIT CENTRAL (chaîné SHA-256)
-- ---------------------------------------------------------------------------
create table if not exists payroll_audit_log (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references tenants (id) on delete cascade,
  actor_id uuid, action_type text not null,
  entity text, entity_id text, cycle_id uuid, employee_id uuid,
  payload jsonb not null default '{}'::jsonb,
  prev_hash text not null default '', current_hash text not null default '',
  ip_source text, created_at timestamptz not null default now()
);
create index if not exists idx_payroll_audit_log on payroll_audit_log (tenant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS — isolation tenant systématique (back-office paie ; rôles affinés ult.)
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array[
  'country_payroll_rules','payroll_companies','payroll_company_establishments',
  'payroll_company_bank_accounts','payroll_company_social_numbers',
  'payroll_rubriques','payroll_rubrique_formulas','payroll_baremes','payroll_baremes_tranches',
  'payroll_conventions','payroll_profils','payroll_tenant_parameters','payroll_modeles','payroll_modele_rubriques',
  'employee_payroll_file','employee_payroll_fixed_elements','employee_payroll_fixed_elements_history','employee_payroll_assignments',
  'payroll_cycles','payroll_cycle_phases','payroll_cycle_alerts','payroll_inputs',
  'payroll_inputs_time_presence','payroll_inputs_overtime','payroll_inputs_absences','payroll_inputs_bonuses',
  'payroll_inputs_exceptional_deductions','payroll_inputs_expenses','payroll_inputs_advances_deduction',
  'payroll_inputs_events','payroll_inputs_notes','payroll_input_audit_log',
  'payroll_calculation_runs','payroll_calculation_anomalies',
  'payroll_bulletins','payroll_bulletin_lines','payroll_bulletin_validations','payroll_ecarts_justifications',
  'payroll_payment_orders','payroll_payment_order_lines','payroll_payment_execution',
  'payroll_declarations','payroll_declaration_lines','payroll_declaration_submissions',
  'payroll_accounting_mappings','payroll_accounting_entries','payroll_accounting_entry_lines',
  'payroll_regularizations','payroll_stc','payroll_stc_components',
  'payroll_budgets','payroll_budget_lines','payroll_kpi_snapshots','payroll_audit_log'
];
begin
  foreach t in array tabs loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy tenant_isolation on %I
        using (tenant_id in (select current_tenant_ids()))
        with check (tenant_id in (select current_tenant_ids()));
    $f$, t);
  end loop;
end $$;

-- declaration_catalog : référentiel commun + tenant en lecture
alter table declaration_catalog enable row level security;
create policy declaration_catalog_read on declaration_catalog
  for select using (tenant_id is null or tenant_id in (select current_tenant_ids()));
create policy declaration_catalog_write on declaration_catalog
  for all using (tenant_id in (select current_tenant_ids()))
  with check (tenant_id in (select current_tenant_ids()));

-- ---------------------------------------------------------------------------
-- SEED — catalogue déclarations commun (CI + SN principaux)
-- ---------------------------------------------------------------------------
insert into declaration_catalog (country_code, code, libelle, organisme, periodicite) values
  ('CI','DISA_CNPS','Déclaration individuelle des salaires annuels','CNPS','annuelle'),
  ('CI','COTIS_CNPS','Cotisations sociales mensuelles','CNPS','mensuelle'),
  ('CI','DAS_ITS','Déclaration ITS / IRPP','DGI','mensuelle'),
  ('CI','FDFP_TA','Taxe d''apprentissage FDFP','FDFP','annuelle'),
  ('CI','FDFP_FC','Formation continue FDFP','FDFP','mensuelle'),
  ('SN','IPRES_RG','Cotisations IPRES régime général','IPRES','mensuelle'),
  ('SN','CSS_PF','Cotisations CSS prestations familiales','CSS','mensuelle'),
  ('SN','IR_TRIMF','Impôt sur le revenu + TRIMF','DGID','mensuelle')
on conflict do nothing;

comment on table payroll_cycles is 'M3 — Cycle mensuel de paie (7 étapes). Cycle clôturé = immuable (R6).';
comment on table payroll_audit_log is 'M3 — Audit chaîné SHA-256 immuable de toutes les opérations paie (R4).';
