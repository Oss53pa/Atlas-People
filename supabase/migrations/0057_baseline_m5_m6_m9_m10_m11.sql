-- ============================================================================
-- Atlas People — BASELINE M5 · M6 · M9 · M10 · M11
--
-- Ce fichier ne décrit pas un changement : il rattrape un manque. Les 56 tables
-- ci-dessous existent en production depuis les sprints 134-155, où elles ont
-- été déployées directement via le MCP Supabase sans jamais être écrites dans
-- une migration. Le dépôt ne pouvait donc pas reconstruire le schéma — cf.
-- AUDIT_REPRODUCTIBILITE_SCHEMA.md, point 1.
--
-- Contenu, reconstruit depuis information_schema et pg_catalog de
-- vgtmljfayiysuvrcmunt (pas de pg_dump disponible) :
--   • 13 enums          m9_* / m10_*
--   • 56 tables         M5 recrutement (9) · M6 onboarding (7) · M9 compétences
--                       (16) · M10 carrières (10) · M11 formation (14)
--   • contraintes, clés étrangères, index, RLS, triggers, droits, commentaires
--   • 8 vues            agrégats de reporting
--   • 1 fonction        tenant_bootstrap_state
--
-- Rejouable : tout est en `if not exists` / `drop … if exists`. Sur la base de
-- production, ce fichier est un no-op intégral — c'est sa raison d'être.
--
-- Dépendances externes déjà déclarées par le dépôt : m8_cycles (0025),
-- m9_jobs et m9_skills (0037), m11_fdfp_declarations, m11_registrations,
-- m11_training_sessions (0022), la fonction trigger m8_m9_touch_updated_at
-- (0025) et les helpers RLS current_tenant_ids / is_hr_or_admin (0032, 0034).
-- Ce fichier doit donc rester après 0037 dans l'ordre lexicographique.
-- ============================================================================

set search_path = atlas_people, public, extensions;

-- ---------------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------------
do $$ begin create type m10_confidentiality as enum ('public','interne','sensible','top_secret');
exception when duplicate_object then null; end $$;
do $$ begin create type m10_pattern_code as enum ('P1_PROMO_SANS_CRITERES','P2_COURT_CIRCUIT_COMITE','P3_PLAFOND_VERRE_GENRE','P4_PLAFOND_VERRE_AGE','P5_NEPOTISME','P6_FAVORITISME_HIPO','P7_HIPO_NON_REVISE','P8_SUCCESSION_ORPHELINE','P9_MOBILITE_HORS_FRAMEWORK','P10_FUITE_HIPO','P11_PROMOTION_EXPRESS','P12_COMITE_NON_QUORUM');
exception when duplicate_object then null; end $$;
do $$ begin create type m10_pool_code as enum ('HIPO','FUTURS_LEADERS','EXPERTS','SUCCESSEURS','DIVERSITE','JEUNES_TALENTS');
exception when duplicate_object then null; end $$;
do $$ begin create type m10_promotion_status as enum ('proposed','director_validated','comite_pending','comite_approved','comite_rejected','validated','communicated','contested','closed');
exception when duplicate_object then null; end $$;
do $$ begin create type m10_track as enum ('management','expert','specialist');
exception when duplicate_object then null; end $$;
do $$ begin create type m9_action_kind as enum ('formation','mentorat','mission','certification','coaching','mobilite','autre');
exception when duplicate_object then null; end $$;
do $$ begin create type m9_action_status as enum ('planned','in_progress','completed','cancelled','postponed');
exception when duplicate_object then null; end $$;
do $$ begin create type m9_cert_status as enum ('catalog','requested','approved','declined','financed','in_progress','obtained','expired','renewed','revoked');
exception when duplicate_object then null; end $$;
do $$ begin create type m9_eval_status as enum ('draft','submitted','manager_review','consolidated','signed','closed');
exception when duplicate_object then null; end $$;
do $$ begin create type m9_mobilite_status as enum ('proposed','candidature','validated','rejected','executed','returned');
exception when duplicate_object then null; end $$;
do $$ begin create type m9_pdc_status as enum ('draft','co_constructed','signed','in_progress','closed','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin create type m9_rgpd_sensitivity as enum ('public','interne','sensible');
exception when duplicate_object then null; end $$;
do $$ begin create type m9_suspicious_pattern_code as enum ('P1_INFLATION_AUTO_EVAL','P2_MODIF_POST_VALIDATION','P3_DIVERGENCE_CHRONIQUE','P4_EVAL_SANS_PREUVES','P5_DISCRIMINATION_COMPETENCES','P6_MANAGER_NOTEUR_EXTREME','P7_GAP_CRITIQUE_NON_TRAITE','P8_CERTIFICATION_FICTIVE','P9_MANIPULATION_CARTO_POSTE','P10_MOBILITE_CONTOURNANT_MATCHING');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. TABLES
--    Colonnes, clés primaires, contraintes UNIQUE et CHECK. Les clés étrangères
--    sont posées en section 3, après création de toutes les tables, pour
--    s'affranchir de l'ordre de déclaration.
-- ---------------------------------------------------------------------------
-- ── M5 · Recrutement ────────────────────────────────────────────────────────
create table if not exists m5_applications (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  ref text not null,
  candidate_id uuid not null,
  job_id uuid not null,
  stage atlas_people.m5_app_stage default 'applied'::atlas_people.m5_app_stage not null,
  stage_entered_at timestamp with time zone default now() not null,
  applied_at timestamp with time zone default now() not null,
  score integer,
  last_activity_at timestamp with time zone default now() not null,
  notes text,
  rejection_reason_code text,
  hired_at timestamp with time zone,
  withdrawn_at timestamp with time zone,
  constraint m5_applications_tenant_id_ref_key UNIQUE (tenant_id, ref),
  constraint m5_applications_pkey PRIMARY KEY (id)
);

create table if not exists m5_audit_log (
  id bigserial,
  tenant_id uuid not null,
  occurred_at timestamp with time zone default now() not null,
  actor_id uuid,
  actor_role text,
  action_code text not null,
  resource_type text,
  resource_id uuid,
  before_state jsonb,
  after_state jsonb,
  prev_hash text,
  hash text not null,
  constraint m5_audit_log_pkey PRIMARY KEY (id)
);

create table if not exists m5_candidates (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  anon_ref text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  current_role_label text,
  current_company text,
  location text,
  country_code character(2),
  expected_salary_min bigint,
  expected_salary_max bigint,
  availability text,
  years_experience integer,
  skills text[],
  tags text[],
  source text,
  referrer_employee_id uuid,
  rgpd_consent boolean default false not null,
  rgpd_consent_at timestamp with time zone,
  rgpd_retention_until date,
  cv_url text,
  linkedin_url text,
  created_at timestamp with time zone default now() not null,
  constraint m5_candidates_tenant_id_anon_ref_key UNIQUE (tenant_id, anon_ref),
  constraint m5_candidates_pkey PRIMARY KEY (id)
);

create table if not exists m5_interviews (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  ref text not null,
  application_id uuid not null,
  type atlas_people.m5_interview_type not null,
  mode atlas_people.m5_interview_mode not null,
  scheduled_at timestamp with time zone not null,
  duration_min integer not null,
  location text,
  participants jsonb default '[]'::jsonb,
  status atlas_people.m5_interview_status default 'planned'::atlas_people.m5_interview_status not null,
  reschedule_reason text,
  constraint m5_interviews_tenant_id_ref_key UNIQUE (tenant_id, ref),
  constraint m5_interviews_pkey PRIMARY KEY (id)
);

create table if not exists m5_jobs (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  ref text not null,
  need_id uuid,
  title text not null,
  department text,
  location text,
  country_code character(2) not null,
  contract_type atlas_people.m5_contract_type not null,
  level atlas_people.m5_job_level not null,
  salary_range_min bigint,
  salary_range_max bigint,
  status atlas_people.m5_job_status default 'draft'::atlas_people.m5_job_status not null,
  opened_at timestamp with time zone default now() not null,
  closed_at timestamp with time zone,
  target_close_at date,
  hiring_manager_id uuid not null,
  recruiter_id uuid not null,
  summary text,
  responsibilities text[],
  requirements text[],
  perks text[],
  published_channels text[],
  applications_count integer default 0 not null,
  remote_allowed boolean default false,
  cooptation_bonus bigint,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint m5_jobs_tenant_id_ref_key UNIQUE (tenant_id, ref),
  constraint m5_jobs_pkey PRIMARY KEY (id)
);

create table if not exists m5_needs (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  ref text not null,
  type atlas_people.m5_need_type not null,
  volume integer default 1 not null,
  urgency atlas_people.m5_urgency default 'standard'::atlas_people.m5_urgency not null,
  status atlas_people.m5_need_status default 'draft'::atlas_people.m5_need_status not null,
  title text not null,
  department text,
  hiring_manager_id uuid not null,
  category text,
  contract_type atlas_people.m5_contract_type not null,
  location text,
  country_code character(2) not null,
  experience_min integer,
  experience_max integer,
  salary_min bigint,
  salary_max bigint,
  salary_median bigint,
  budget_year1 bigint,
  ideal_start_date date,
  motivation text,
  business_case text,
  validations jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint m5_needs_tenant_id_ref_key UNIQUE (tenant_id, ref),
  constraint m5_needs_pkey PRIMARY KEY (id)
);

create table if not exists m5_offers (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  ref text not null,
  application_id uuid not null,
  status atlas_people.m5_offer_status default 'draft'::atlas_people.m5_offer_status not null,
  contract_type atlas_people.m5_contract_type not null,
  base_salary bigint not null,
  allowances_total bigint default 0 not null,
  total_package bigint not null,
  start_date date,
  draft_at timestamp with time zone default now() not null,
  sent_at timestamp with time zone,
  accepted_at timestamp with time zone,
  declined_at timestamp with time zone,
  declined_reason text,
  valid_until date,
  signature_workflow text,
  constraint m5_offers_tenant_id_ref_key UNIQUE (tenant_id, ref),
  constraint m5_offers_pkey PRIMARY KEY (id)
);

create table if not exists m5_referrals (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  ref text not null,
  referrer_employee_id uuid not null,
  candidate_id uuid not null,
  job_id uuid not null,
  status atlas_people.m5_referral_status default 'submitted'::atlas_people.m5_referral_status not null,
  submitted_at timestamp with time zone default now() not null,
  bonus_amount bigint default 0 not null,
  paid_at timestamp with time zone,
  constraint m5_referrals_tenant_id_ref_key UNIQUE (tenant_id, ref),
  constraint m5_referrals_pkey PRIMARY KEY (id)
);

create table if not exists m5_scorecards (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  interview_id uuid not null,
  application_id uuid not null,
  interviewer_id uuid not null,
  submitted_at timestamp with time zone default now() not null,
  criteria jsonb default '[]'::jsonb,
  overall numeric,
  recommendation atlas_people.m5_recommendation not null,
  strengths text,
  concerns text,
  constraint m5_scorecards_pkey PRIMARY KEY (id),
  constraint m5_scorecards_overall_check CHECK (((overall >= (1)::numeric) AND (overall <= (5)::numeric)))
);

-- ── M6 · Onboarding ─────────────────────────────────────────────────────────
create table if not exists m6_arrivants (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  employee_id uuid not null,
  template_id uuid,
  start_date date not null,
  manager_id uuid not null,
  buddy_id uuid,
  rh_referent_id uuid,
  parcours_status atlas_people.m6_parcours_status default 'active'::atlas_people.m6_parcours_status not null,
  overall_completion_pct integer default 0 not null,
  pulse_avg numeric,
  fin_essai_at date,
  fin_essai_decision text,
  fin_essai_validated_at timestamp with time zone,
  fin_essai_validated_by uuid,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint m6_arrivants_tenant_id_employee_id_key UNIQUE (tenant_id, employee_id),
  constraint m6_arrivants_pkey PRIMARY KEY (id)
);

create table if not exists m6_audit_log (
  id bigserial,
  tenant_id uuid not null,
  occurred_at timestamp with time zone default now() not null,
  actor_id uuid,
  actor_role text,
  action_code text not null,
  resource_type text,
  resource_id uuid,
  before_state jsonb,
  after_state jsonb,
  prev_hash text,
  hash text not null,
  constraint m6_audit_log_pkey PRIMARY KEY (id)
);

create table if not exists m6_jalons (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  arrivant_id uuid not null,
  kind atlas_people.m6_jalon_kind not null,
  due_date date not null,
  validated_at timestamp with time zone,
  validated_by uuid,
  manager_feedback text,
  employee_feedback text,
  status text default 'pending'::text not null,
  constraint m6_jalons_tenant_id_arrivant_id_kind_key UNIQUE (tenant_id, arrivant_id, kind),
  constraint m6_jalons_pkey PRIMARY KEY (id),
  constraint m6_jalons_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'validated'::text, 'overdue'::text, 'skipped'::text])))
);

create table if not exists m6_parcours_templates (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  code text not null,
  label text not null,
  description text,
  duration_days integer default 90 not null,
  default_jalons text[],
  default_tasks jsonb default '[]'::jsonb,
  active boolean default true not null,
  constraint m6_parcours_templates_tenant_id_code_key UNIQUE (tenant_id, code),
  constraint m6_parcours_templates_pkey PRIMARY KEY (id)
);

create table if not exists m6_pulses (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  arrivant_id uuid not null,
  triggered_at timestamp with time zone default now() not null,
  submitted_at timestamp with time zone,
  jalon_kind atlas_people.m6_jalon_kind,
  score atlas_people.m6_pulse_score,
  comment text,
  constraint m6_pulses_pkey PRIMARY KEY (id)
);

create table if not exists m6_tasks (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  arrivant_id uuid not null,
  jalon_kind atlas_people.m6_jalon_kind,
  owner atlas_people.m6_task_owner not null,
  title text not null,
  description text,
  due_date date,
  status atlas_people.m6_task_status default 'todo'::atlas_people.m6_task_status not null,
  completed_at timestamp with time zone,
  completed_by uuid,
  required boolean default true not null,
  created_at timestamp with time zone default now() not null,
  constraint m6_tasks_pkey PRIMARY KEY (id)
);

create table if not exists m6_welcome_book (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  arrivant_id uuid not null,
  doc_kind text not null,
  url text,
  read_at timestamp with time zone,
  read_status text default 'pending'::text,
  constraint m6_welcome_book_pkey PRIMARY KEY (id)
);

-- ── M9 · Compétences & évaluations ──────────────────────────────────────────
create table if not exists m9_anti_discrim_alerts (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  detected_at timestamp with time zone default now() not null,
  cycle_id uuid,
  bias_axis text not null,
  scope_type text not null,
  scope_id uuid,
  metric_observed numeric,
  metric_threshold numeric,
  population_count integer,
  detail text,
  evidence jsonb,
  status text default 'open'::text not null,
  juriste_notified boolean default false not null,
  resolved_at timestamp with time zone,
  constraint m9_anti_discrim_alerts_pkey PRIMARY KEY (id),
  constraint m9_anti_discrim_alerts_bias_axis_check CHECK ((bias_axis = ANY (ARRAY['gender'::text, 'age'::text, 'seniority'::text, 'origin'::text, 'disability'::text, 'autre'::text]))),
  constraint m9_anti_discrim_alerts_scope_type_check CHECK ((scope_type = ANY (ARRAY['team'::text, 'direction'::text, 'enterprise'::text]))),
  constraint m9_anti_discrim_alerts_status_check CHECK ((status = ANY (ARRAY['open'::text, 'investigating'::text, 'resolved'::text, 'false_positive'::text, 'escalated'::text])))
);

create table if not exists m9_certifications_catalog (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  code text not null,
  name text not null,
  issuer text not null,
  family atlas_people.m9_skill_family not null,
  related_skill_ids uuid[],
  duration_years integer,
  cost_estimate bigint,
  status atlas_people.m9_cert_status default 'catalog'::atlas_people.m9_cert_status not null,
  external_url text,
  created_at timestamp with time zone default now() not null,
  constraint m9_certifications_catalog_tenant_id_code_key UNIQUE (tenant_id, code),
  constraint m9_certifications_catalog_pkey PRIMARY KEY (id)
);

create table if not exists m9_certifications_employees (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  employee_id uuid not null,
  certification_id uuid not null,
  status atlas_people.m9_cert_status default 'requested'::atlas_people.m9_cert_status not null,
  requested_at timestamp with time zone default now() not null,
  approved_at timestamp with time zone,
  approved_by uuid,
  financed_amount bigint,
  obtained_at date,
  expires_at date,
  renewal_alerted_at timestamp with time zone,
  attestation_url text,
  revoked_at timestamp with time zone,
  revoked_reason text,
  constraint m9_certifications_employees_tenant_id_employee_id_certifica_key UNIQUE (tenant_id, employee_id, certification_id),
  constraint m9_certifications_employees_pkey PRIMARY KEY (id)
);

create table if not exists m9_eval_auto_competences (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  cycle_id uuid not null,
  employee_id uuid not null,
  ref text not null,
  status atlas_people.m9_eval_status default 'draft'::atlas_people.m9_eval_status not null,
  forces text,
  axes_progres text,
  aspirations text,
  submitted_at timestamp with time zone,
  modified_post_submission boolean default false not null,
  created_at timestamp with time zone default now() not null,
  constraint m9_eval_auto_competences_tenant_id_cycle_id_employee_id_key UNIQUE (tenant_id, cycle_id, employee_id),
  constraint m9_eval_auto_competences_tenant_id_ref_key UNIQUE (tenant_id, ref),
  constraint m9_eval_auto_competences_pkey PRIMARY KEY (id)
);

create table if not exists m9_eval_auto_per_competence (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  eval_auto_id uuid not null,
  skill_id uuid not null,
  auto_level integer not null,
  target_level integer,
  a_developper boolean default false not null,
  notes text,
  constraint m9_eval_auto_per_competence_tenant_id_eval_auto_id_skill_id_key UNIQUE (tenant_id, eval_auto_id, skill_id),
  constraint m9_eval_auto_per_competence_pkey PRIMARY KEY (id),
  constraint m9_eval_auto_per_competence_auto_level_check CHECK (((auto_level >= 0) AND (auto_level <= 5))),
  constraint m9_eval_auto_per_competence_target_level_check CHECK (((target_level >= 0) AND (target_level <= 5)))
);

create table if not exists m9_eval_auto_preuves (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  eval_auto_per_id uuid not null,
  preuve_type text not null,
  label text not null,
  ref text,
  attached_at timestamp with time zone default now() not null,
  constraint m9_eval_auto_preuves_pkey PRIMARY KEY (id),
  constraint m9_eval_auto_preuves_preuve_type_check CHECK ((preuve_type = ANY (ARRAY['project'::text, 'formation'::text, 'certification'::text, 'livrable'::text, 'feedback'::text, 'autre'::text])))
);

create table if not exists m9_eval_consolidated (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  cycle_id uuid not null,
  employee_id uuid not null,
  skill_id uuid not null,
  final_level integer not null,
  source text not null,
  signed_at timestamp with time zone,
  signed_by uuid,
  constraint m9_eval_consolidated_tenant_id_cycle_id_employee_id_skill_i_key UNIQUE (tenant_id, cycle_id, employee_id, skill_id),
  constraint m9_eval_consolidated_pkey PRIMARY KEY (id),
  constraint m9_eval_consolidated_final_level_check CHECK (((final_level >= 0) AND (final_level <= 5))),
  constraint m9_eval_consolidated_source_check CHECK ((source = ANY (ARRAY['auto'::text, 'manager'::text, 'calibration'::text, '360'::text, 'external'::text])))
);

create table if not exists m9_eval_manager_competences (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  cycle_id uuid not null,
  employee_id uuid not null,
  manager_id uuid not null,
  eval_auto_id uuid,
  ref text not null,
  status atlas_people.m9_eval_status default 'draft'::atlas_people.m9_eval_status not null,
  submitted_at timestamp with time zone,
  divergences_count integer default 0 not null,
  bias_alert_triggered boolean default false not null,
  bias_pattern_code atlas_people.m9_suspicious_pattern_code,
  notes_manager text,
  constraint m9_eval_manager_competences_tenant_id_ref_key UNIQUE (tenant_id, ref),
  constraint m9_eval_manager_competences_pkey PRIMARY KEY (id)
);

create table if not exists m9_eval_manager_per_competence (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  eval_manager_id uuid not null,
  skill_id uuid not null,
  manager_level integer not null,
  preuves text,
  divergence_with_auto integer,
  divergence_resolved boolean default false,
  constraint m9_eval_manager_per_competenc_tenant_id_eval_manager_id_ski_key UNIQUE (tenant_id, eval_manager_id, skill_id),
  constraint m9_eval_manager_per_competence_pkey PRIMARY KEY (id),
  constraint m9_eval_manager_per_competence_manager_level_check CHECK (((manager_level >= 0) AND (manager_level <= 5)))
);

create table if not exists m9_mobilite_candidatures (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  matching_id uuid not null,
  status atlas_people.m9_mobilite_status default 'proposed'::atlas_people.m9_mobilite_status not null,
  initiated_at timestamp with time zone default now() not null,
  initiated_by uuid,
  pdc_accompagnement_id uuid,
  clause_retour_months integer,
  validated_at timestamp with time zone,
  validated_by uuid,
  executed_at timestamp with time zone,
  returned_at timestamp with time zone,
  return_reason text,
  constraint m9_mobilite_candidatures_pkey PRIMARY KEY (id)
);

create table if not exists m9_mobilite_matching (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  poste_id uuid not null,
  candidate_employee_id uuid not null,
  match_pct numeric not null,
  strengths text[],
  gaps text[],
  computed_at timestamp with time zone default now() not null,
  computed_by text default 'PROPH3T'::text not null,
  constraint m9_mobilite_matching_tenant_id_poste_id_candidate_employee__key UNIQUE (tenant_id, poste_id, candidate_employee_id),
  constraint m9_mobilite_matching_pkey PRIMARY KEY (id),
  constraint m9_mobilite_matching_match_pct_check CHECK (((match_pct >= (0)::numeric) AND (match_pct <= (100)::numeric)))
);

create table if not exists m9_pdc (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  cycle_id uuid not null,
  employee_id uuid not null,
  manager_id uuid not null,
  ref text not null,
  status atlas_people.m9_pdc_status default 'draft'::atlas_people.m9_pdc_status not null,
  signed_at timestamp with time zone,
  advist_hash text,
  closed_at timestamp with time zone,
  closing_bilan text,
  created_at timestamp with time zone default now() not null,
  constraint m9_pdc_tenant_id_cycle_id_employee_id_key UNIQUE (tenant_id, cycle_id, employee_id),
  constraint m9_pdc_tenant_id_ref_key UNIQUE (tenant_id, ref),
  constraint m9_pdc_pkey PRIMARY KEY (id)
);

create table if not exists m9_pdc_actions (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  pdc_id uuid not null,
  kind atlas_people.m9_action_kind not null,
  title text not null,
  target_skill_id uuid,
  target_level integer,
  course_id uuid,
  deadline date,
  completion_pct integer default 0 not null,
  status atlas_people.m9_action_status default 'planned'::atlas_people.m9_action_status not null,
  success_indicator text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint m9_pdc_actions_pkey PRIMARY KEY (id),
  constraint m9_pdc_actions_completion_pct_check CHECK (((completion_pct >= 0) AND (completion_pct <= 100))),
  constraint m9_pdc_actions_target_level_check CHECK (((target_level >= 1) AND (target_level <= 5)))
);

create table if not exists m9_pic (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  cycle_id uuid not null,
  scope text not null,
  scope_label text not null,
  budget_envelope bigint default 0 not null,
  budget_consumed bigint default 0 not null,
  competence_priorities text[],
  status text default 'draft'::text not null,
  approved_at timestamp with time zone,
  approved_by uuid,
  created_at timestamp with time zone default now() not null,
  constraint m9_pic_pkey PRIMARY KEY (id),
  constraint m9_pic_scope_check CHECK ((scope = ANY (ARRAY['company'::text, 'BU'::text, 'direction'::text, 'team'::text]))),
  constraint m9_pic_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'approved'::text, 'executing'::text, 'closed'::text])))
);

create table if not exists m9_suspicious_patterns (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  pattern_code atlas_people.m9_suspicious_pattern_code not null,
  detected_at timestamp with time zone default now() not null,
  related_employee_id uuid,
  related_skill_id uuid,
  related_eval_id uuid,
  related_poste_id uuid,
  severity text not null,
  pattern_data jsonb,
  evidence_audit_log_ids bigint[],
  rgpd_sensitivity atlas_people.m9_rgpd_sensitivity default 'sensible'::atlas_people.m9_rgpd_sensitivity not null,
  status text default 'open'::text not null,
  assigned_to uuid,
  investigation_notes text,
  resolution_action text,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  juriste_notified boolean default false not null,
  juriste_notified_at timestamp with time zone,
  constraint m9_suspicious_patterns_pkey PRIMARY KEY (id),
  constraint m9_suspicious_patterns_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
  constraint m9_suspicious_patterns_status_check CHECK ((status = ANY (ARRAY['open'::text, 'investigating'::text, 'resolved'::text, 'accepted_risk'::text, 'escalated'::text])))
);

create table if not exists m9_talents_snapshots (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  snapshot_date date not null,
  scope_type text default 'enterprise'::text not null,
  scope_id uuid,
  total_competences_covered integer,
  experts_count integer,
  spof_count integer,
  gaps_critical_count integer,
  payload jsonb,
  created_at timestamp with time zone default now() not null,
  constraint m9_talents_snapshots_tenant_id_snapshot_date_scope_type_sco_key UNIQUE (tenant_id, snapshot_date, scope_type, scope_id),
  constraint m9_talents_snapshots_pkey PRIMARY KEY (id)
);

-- ── M10 · Carrières & talents ───────────────────────────────────────────────
create table if not exists m10_alumni (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  former_employee_id uuid,
  full_name text not null,
  last_role text,
  exit_year integer not null,
  exit_reason text,
  current_company text,
  current_role_label text,
  boomerang_candidate boolean default false not null,
  opt_in_newsletter boolean default false not null,
  opt_in_events boolean default false not null,
  linkedin_url text,
  created_at timestamp with time zone default now() not null,
  constraint m10_alumni_pkey PRIMARY KEY (id)
);

create table if not exists m10_audit_log (
  id bigserial,
  tenant_id uuid not null,
  occurred_at timestamp with time zone default now() not null,
  actor_id uuid,
  actor_role text,
  action_code text not null,
  resource_type text,
  resource_id uuid,
  before_state jsonb,
  after_state jsonb,
  confidentiality atlas_people.m10_confidentiality default 'interne'::atlas_people.m10_confidentiality not null,
  prev_hash text,
  hash text not null,
  constraint m10_audit_log_pkey PRIMARY KEY (id)
);

create table if not exists m10_job_families (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  code text not null,
  label text not null,
  tracks atlas_people.m10_track[] default ARRAY['management'::atlas_people.m10_track, 'expert'::atlas_people.m10_track] not null,
  positions_count integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  constraint m10_job_families_tenant_id_code_key UNIQUE (tenant_id, code),
  constraint m10_job_families_pkey PRIMARY KEY (id)
);

create table if not exists m10_job_grades (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  level_id uuid not null,
  code text not null,
  ord integer not null,
  constraint m10_job_grades_tenant_id_code_key UNIQUE (tenant_id, code),
  constraint m10_job_grades_pkey PRIMARY KEY (id)
);

create table if not exists m10_job_levels (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  code text not null,
  name text not null,
  ord integer not null,
  salary_band_min bigint,
  salary_band_max bigint,
  constraint m10_job_levels_tenant_id_code_key UNIQUE (tenant_id, code),
  constraint m10_job_levels_pkey PRIMARY KEY (id)
);

create table if not exists m10_promotions (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  ref text not null,
  employee_id uuid not null,
  proposed_by uuid not null,
  from_grade_code text not null,
  to_grade_code text not null,
  from_position text,
  to_position text,
  salary_increase_monthly bigint default 0 not null,
  rationale text,
  status atlas_people.m10_promotion_status default 'proposed'::atlas_people.m10_promotion_status not null,
  comite_session_id uuid,
  comite_decision text,
  comite_voted_at timestamp with time zone,
  comite_quorum_met boolean,
  communicated_at timestamp with time zone,
  contested_at timestamp with time zone,
  contestation_reason text,
  contestation_resolved_at timestamp with time zone,
  contestation_resolution text,
  anciennete_months integer,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint m10_promotions_tenant_id_ref_key UNIQUE (tenant_id, ref),
  constraint m10_promotions_pkey PRIMARY KEY (id)
);

create table if not exists m10_suspicious_patterns (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  pattern_code atlas_people.m10_pattern_code not null,
  detected_at timestamp with time zone default now() not null,
  related_employee_id uuid,
  related_promotion_id uuid,
  severity text not null,
  pattern_data jsonb,
  evidence_audit_log_ids bigint[],
  status text default 'open'::text not null,
  assigned_to uuid,
  resolved_at timestamp with time zone,
  resolution_note text,
  constraint m10_suspicious_patterns_pkey PRIMARY KEY (id),
  constraint m10_suspicious_patterns_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
  constraint m10_suspicious_patterns_status_check CHECK ((status = ANY (ARRAY['open'::text, 'investigating'::text, 'resolved'::text, 'accepted_risk'::text, 'escalated'::text])))
);

create table if not exists m10_talent_pool_memberships (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  pool_id uuid not null,
  employee_id uuid not null,
  joined_at date not null,
  exited_at date,
  exit_reason text,
  constraint m10_talent_pool_memberships_tenant_id_pool_id_employee_id_key UNIQUE (tenant_id, pool_id, employee_id),
  constraint m10_talent_pool_memberships_pkey PRIMARY KEY (id)
);

create table if not exists m10_talent_pools (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  code atlas_people.m10_pool_code not null,
  label text not null,
  description text,
  annual_budget bigint default 0 not null,
  programmes text[],
  constraint m10_talent_pools_tenant_id_code_key UNIQUE (tenant_id, code),
  constraint m10_talent_pools_pkey PRIMARY KEY (id)
);

create table if not exists m10_talent_review_workshops (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  cycle_year integer not null,
  level text not null,
  scope_label text not null,
  scheduled_at timestamp with time zone not null,
  duration_minutes integer,
  participants uuid[] default '{}'::uuid[] not null,
  candidates_reviewed integer default 0 not null,
  hipo_flagged integer default 0 not null,
  status text default 'planned'::text not null,
  decisions text[],
  minutes_url text,
  created_at timestamp with time zone default now() not null,
  constraint m10_talent_review_workshops_pkey PRIMARY KEY (id),
  constraint m10_talent_review_workshops_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);

-- ── M11 · Formation ─────────────────────────────────────────────────────────
create table if not exists m11_badge_attributions (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  badge_id uuid not null,
  employee_id uuid not null,
  awarded_at timestamp with time zone default now() not null,
  awarded_via text,
  evidence_ref text,
  expires_at date,
  constraint m11_badge_attributions_tenant_id_badge_id_employee_id_key UNIQUE (tenant_id, badge_id, employee_id),
  constraint m11_badge_attributions_pkey PRIMARY KEY (id)
);

create table if not exists m11_badges (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  code text not null,
  label text not null,
  description text,
  color text,
  criteria_label text,
  active boolean default true not null,
  constraint m11_badges_tenant_id_code_key UNIQUE (tenant_id, code),
  constraint m11_badges_pkey PRIMARY KEY (id)
);

create table if not exists m11_convocations (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  registration_id uuid not null,
  stage atlas_people.m11_convocation_stage not null,
  scheduled_send_at timestamp with time zone not null,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  status atlas_people.m11_convocation_status default 'pending'::atlas_people.m11_convocation_status not null,
  doc_journey_ref text,
  constraint m11_convocations_tenant_id_registration_id_stage_key UNIQUE (tenant_id, registration_id, stage),
  constraint m11_convocations_pkey PRIMARY KEY (id)
);

create table if not exists m11_formateurs (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  full_name text not null,
  kind atlas_people.m11_formateur_kind not null,
  organism text,
  specialty text,
  hourly_rate bigint,
  internal_employee_id uuid,
  sessions_ytd integer default 0 not null,
  avg_rating numeric,
  active boolean default true not null,
  constraint m11_formateurs_tenant_id_full_name_organism_key UNIQUE (tenant_id, full_name, organism),
  constraint m11_formateurs_pkey PRIMARY KEY (id)
);

create table if not exists m11_invoices (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  ref text not null,
  formateur_id uuid,
  session_id uuid,
  amount bigint not null,
  status atlas_people.m11_invoice_status default 'draft'::atlas_people.m11_invoice_status not null,
  validated_for_payment_at timestamp with time zone,
  validated_by uuid,
  paid_at timestamp with time zone,
  payment_method text,
  duplicate_of_invoice_id uuid,
  rgpd_retention_until date,
  created_at timestamp with time zone default now() not null,
  constraint m11_invoices_tenant_id_ref_key UNIQUE (tenant_id, ref),
  constraint m11_invoices_pkey PRIMARY KEY (id)
);

create table if not exists m11_lms_courses (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  code text not null,
  title text not null,
  scorm_version text,
  duration_hours numeric,
  certifying boolean default false not null,
  badge_code text,
  gamification_notes text,
  package_url text,
  active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  constraint m11_lms_courses_tenant_id_code_key UNIQUE (tenant_id, code),
  constraint m11_lms_courses_pkey PRIMARY KEY (id),
  constraint m11_lms_courses_scorm_version_check CHECK ((scorm_version = ANY (ARRAY['1.2'::text, '2004'::text, 'xAPI'::text])))
);

create table if not exists m11_lms_progress (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  lms_course_id uuid not null,
  employee_id uuid not null,
  enrolled_at timestamp with time zone default now() not null,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  status atlas_people.m11_lms_progress_status default 'not_started'::atlas_people.m11_lms_progress_status not null,
  progress_pct integer default 0 not null,
  score numeric,
  xapi_statements_count integer default 0 not null,
  last_activity_at timestamp with time zone,
  constraint m11_lms_progress_tenant_id_lms_course_id_employee_id_key UNIQUE (tenant_id, lms_course_id, employee_id),
  constraint m11_lms_progress_pkey PRIMARY KEY (id),
  constraint m11_lms_progress_progress_pct_check CHECK (((progress_pct >= 0) AND (progress_pct <= 100)))
);

create table if not exists m11_parcours (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  code text not null,
  label text not null,
  kind atlas_people.m11_parcours_kind not null,
  duration_months integer not null,
  target_audience text,
  certifying boolean default false not null,
  cost_per_enrollee bigint,
  active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  constraint m11_parcours_tenant_id_code_key UNIQUE (tenant_id, code),
  constraint m11_parcours_pkey PRIMARY KEY (id)
);

create table if not exists m11_parcours_enrollments (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  parcours_id uuid not null,
  employee_id uuid not null,
  enrolled_at timestamp with time zone default now() not null,
  expected_completion_at date,
  completed_at timestamp with time zone,
  progress_pct integer default 0 not null,
  status text default 'active'::text not null,
  constraint m11_parcours_enrollments_tenant_id_parcours_id_employee_id_key UNIQUE (tenant_id, parcours_id, employee_id),
  constraint m11_parcours_enrollments_pkey PRIMARY KEY (id),
  constraint m11_parcours_enrollments_progress_pct_check CHECK (((progress_pct >= 0) AND (progress_pct <= 100))),
  constraint m11_parcours_enrollments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'interrupted'::text, 'withdrawn'::text])))
);

create table if not exists m11_parcours_modules (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  parcours_id uuid not null,
  ord integer not null,
  title text not null,
  duration_hours integer,
  modality atlas_people.m11_modality,
  course_id uuid,
  constraint m11_parcours_modules_pkey PRIMARY KEY (id)
);

create table if not exists m11_pif (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  ref text not null,
  employee_id uuid not null,
  manager_id uuid not null,
  year integer not null,
  status atlas_people.m11_pif_status default 'draft'::atlas_people.m11_pif_status not null,
  budget_individual bigint default 0 not null,
  budget_consumed bigint default 0 not null,
  signed_by_employee_at timestamp with time zone,
  signed_by_manager_at timestamp with time zone,
  signed_by_drh_at timestamp with time zone,
  advist_hash text,
  closing_bilan text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint m11_pif_tenant_id_employee_id_year_key UNIQUE (tenant_id, employee_id, year),
  constraint m11_pif_tenant_id_ref_key UNIQUE (tenant_id, ref),
  constraint m11_pif_pkey PRIMARY KEY (id)
);

create table if not exists m11_pif_actions (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  pif_id uuid not null,
  kind atlas_people.m11_action_kind not null,
  label text not null,
  target_competence_code text,
  course_id uuid,
  duration_label text,
  start_quarter text,
  cost bigint default 0 not null,
  status atlas_people.m11_action_status default 'planned'::atlas_people.m11_action_status not null,
  completion_pct integer default 0 not null,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  constraint m11_pif_actions_pkey PRIMARY KEY (id),
  constraint m11_pif_actions_completion_pct_check CHECK (((completion_pct >= 0) AND (completion_pct <= 100))),
  constraint m11_pif_actions_start_quarter_chk CHECK (((start_quarter IS NULL) OR (start_quarter ~ '^(20[2-9][0-9]-Q[1-4]|Q[1-4] 20[2-9][0-9]|Q[1-4]→Q[1-4] 20[2-9][0-9]|20[2-9][0-9]\sQ[1-4]→Q[1-4]|Q[1-4] 20[2-9][0-9]→Q[1-4] 20[2-9][0-9]|Q[1-4]\s20[2-9][0-9]|Continue|Q[1-4]→Q[1-4]\s20[2-9][0-9]).*'::text)))
);

create table if not exists m11_session_animations (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  session_id uuid not null,
  formateur_id uuid not null,
  role text default 'main'::text,
  total_hours numeric,
  amount_due bigint,
  paid_at timestamp with time zone,
  constraint m11_session_animations_pkey PRIMARY KEY (id)
);

create table if not exists m11_suspicious_patterns (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  pattern_code atlas_people.m11_pattern_code not null,
  detected_at timestamp with time zone default now() not null,
  related_user_id uuid,
  related_session_id uuid,
  related_invoice_id uuid,
  related_fdfp_dossier_id uuid,
  severity text not null,
  amount_concerned bigint,
  pattern_data jsonb,
  evidence_audit_log_ids bigint[],
  status text default 'open'::text not null,
  assigned_to uuid,
  investigation_notes text,
  resolution_action text,
  resolved_at timestamp with time zone,
  fdfp_implications boolean default false not null,
  daf_notified boolean default false not null,
  juriste_notified boolean default false not null,
  legal_implications text,
  constraint m11_suspicious_patterns_pkey PRIMARY KEY (id),
  constraint m11_suspicious_patterns_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
  constraint m11_suspicious_patterns_status_check CHECK ((status = ANY (ARRAY['open'::text, 'investigating'::text, 'resolved'::text, 'accepted_risk'::text, 'escalated'::text])))
);

-- ---------------------------------------------------------------------------
-- 3. CLÉS ÉTRANGÈRES
--    Posées après toutes les tables : l'ordre de déclaration n'a plus d'effet.
--    `add constraint` n'a pas de forme `if not exists` — d'où le garde par nom.
-- ---------------------------------------------------------------------------
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'm10_job_grades_level_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m10_job_grades add constraint m10_job_grades_level_id_fkey FOREIGN KEY (level_id) REFERENCES atlas_people.m10_job_levels(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm10_suspicious_patterns_related_promotion_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m10_suspicious_patterns add constraint m10_suspicious_patterns_related_promotion_id_fkey FOREIGN KEY (related_promotion_id) REFERENCES atlas_people.m10_promotions(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm10_talent_pool_memberships_pool_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m10_talent_pool_memberships add constraint m10_talent_pool_memberships_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES atlas_people.m10_talent_pools(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm11_badge_attributions_badge_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m11_badge_attributions add constraint m11_badge_attributions_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES atlas_people.m11_badges(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm11_convocations_registration_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m11_convocations add constraint m11_convocations_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES atlas_people.m11_registrations(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm11_invoices_formateur_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m11_invoices add constraint m11_invoices_formateur_id_fkey FOREIGN KEY (formateur_id) REFERENCES atlas_people.m11_formateurs(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm11_invoices_session_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m11_invoices add constraint m11_invoices_session_id_fkey FOREIGN KEY (session_id) REFERENCES atlas_people.m11_training_sessions(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm11_lms_progress_lms_course_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m11_lms_progress add constraint m11_lms_progress_lms_course_id_fkey FOREIGN KEY (lms_course_id) REFERENCES atlas_people.m11_lms_courses(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm11_parcours_enrollments_parcours_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m11_parcours_enrollments add constraint m11_parcours_enrollments_parcours_id_fkey FOREIGN KEY (parcours_id) REFERENCES atlas_people.m11_parcours(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm11_parcours_modules_parcours_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m11_parcours_modules add constraint m11_parcours_modules_parcours_id_fkey FOREIGN KEY (parcours_id) REFERENCES atlas_people.m11_parcours(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm11_pif_actions_pif_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m11_pif_actions add constraint m11_pif_actions_pif_id_fkey FOREIGN KEY (pif_id) REFERENCES atlas_people.m11_pif(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm11_session_animations_formateur_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m11_session_animations add constraint m11_session_animations_formateur_id_fkey FOREIGN KEY (formateur_id) REFERENCES atlas_people.m11_formateurs(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm11_session_animations_session_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m11_session_animations add constraint m11_session_animations_session_id_fkey FOREIGN KEY (session_id) REFERENCES atlas_people.m11_training_sessions(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm11_suspicious_patterns_related_fdfp_dossier_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m11_suspicious_patterns add constraint m11_suspicious_patterns_related_fdfp_dossier_id_fkey FOREIGN KEY (related_fdfp_dossier_id) REFERENCES atlas_people.m11_fdfp_declarations(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm11_suspicious_patterns_related_invoice_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m11_suspicious_patterns add constraint m11_suspicious_patterns_related_invoice_id_fkey FOREIGN KEY (related_invoice_id) REFERENCES atlas_people.m11_invoices(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm11_suspicious_patterns_related_session_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m11_suspicious_patterns add constraint m11_suspicious_patterns_related_session_id_fkey FOREIGN KEY (related_session_id) REFERENCES atlas_people.m11_training_sessions(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm5_applications_candidate_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m5_applications add constraint m5_applications_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES atlas_people.m5_candidates(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm5_applications_job_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m5_applications add constraint m5_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES atlas_people.m5_jobs(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm5_interviews_application_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m5_interviews add constraint m5_interviews_application_id_fkey FOREIGN KEY (application_id) REFERENCES atlas_people.m5_applications(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm5_jobs_need_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m5_jobs add constraint m5_jobs_need_id_fkey FOREIGN KEY (need_id) REFERENCES atlas_people.m5_needs(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm5_offers_application_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m5_offers add constraint m5_offers_application_id_fkey FOREIGN KEY (application_id) REFERENCES atlas_people.m5_applications(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm5_referrals_candidate_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m5_referrals add constraint m5_referrals_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES atlas_people.m5_candidates(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm5_referrals_job_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m5_referrals add constraint m5_referrals_job_id_fkey FOREIGN KEY (job_id) REFERENCES atlas_people.m5_jobs(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm5_scorecards_application_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m5_scorecards add constraint m5_scorecards_application_id_fkey FOREIGN KEY (application_id) REFERENCES atlas_people.m5_applications(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm5_scorecards_interview_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m5_scorecards add constraint m5_scorecards_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES atlas_people.m5_interviews(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm6_arrivants_template_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m6_arrivants add constraint m6_arrivants_template_id_fkey FOREIGN KEY (template_id) REFERENCES atlas_people.m6_parcours_templates(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm6_jalons_arrivant_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m6_jalons add constraint m6_jalons_arrivant_id_fkey FOREIGN KEY (arrivant_id) REFERENCES atlas_people.m6_arrivants(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm6_pulses_arrivant_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m6_pulses add constraint m6_pulses_arrivant_id_fkey FOREIGN KEY (arrivant_id) REFERENCES atlas_people.m6_arrivants(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm6_tasks_arrivant_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m6_tasks add constraint m6_tasks_arrivant_id_fkey FOREIGN KEY (arrivant_id) REFERENCES atlas_people.m6_arrivants(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm6_welcome_book_arrivant_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m6_welcome_book add constraint m6_welcome_book_arrivant_id_fkey FOREIGN KEY (arrivant_id) REFERENCES atlas_people.m6_arrivants(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_anti_discrim_alerts_cycle_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_anti_discrim_alerts add constraint m9_anti_discrim_alerts_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES atlas_people.m8_cycles(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_certifications_employees_certification_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_certifications_employees add constraint m9_certifications_employees_certification_id_fkey FOREIGN KEY (certification_id) REFERENCES atlas_people.m9_certifications_catalog(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_eval_auto_competences_cycle_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_eval_auto_competences add constraint m9_eval_auto_competences_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES atlas_people.m8_cycles(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_eval_auto_per_competence_eval_auto_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_eval_auto_per_competence add constraint m9_eval_auto_per_competence_eval_auto_id_fkey FOREIGN KEY (eval_auto_id) REFERENCES atlas_people.m9_eval_auto_competences(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_eval_auto_per_competence_skill_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_eval_auto_per_competence add constraint m9_eval_auto_per_competence_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES atlas_people.m9_skills(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_eval_auto_preuves_eval_auto_per_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_eval_auto_preuves add constraint m9_eval_auto_preuves_eval_auto_per_id_fkey FOREIGN KEY (eval_auto_per_id) REFERENCES atlas_people.m9_eval_auto_per_competence(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_eval_consolidated_cycle_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_eval_consolidated add constraint m9_eval_consolidated_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES atlas_people.m8_cycles(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_eval_consolidated_skill_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_eval_consolidated add constraint m9_eval_consolidated_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES atlas_people.m9_skills(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_eval_manager_competences_cycle_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_eval_manager_competences add constraint m9_eval_manager_competences_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES atlas_people.m8_cycles(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_eval_manager_competences_eval_auto_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_eval_manager_competences add constraint m9_eval_manager_competences_eval_auto_id_fkey FOREIGN KEY (eval_auto_id) REFERENCES atlas_people.m9_eval_auto_competences(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_eval_manager_per_competence_eval_manager_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_eval_manager_per_competence add constraint m9_eval_manager_per_competence_eval_manager_id_fkey FOREIGN KEY (eval_manager_id) REFERENCES atlas_people.m9_eval_manager_competences(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_eval_manager_per_competence_skill_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_eval_manager_per_competence add constraint m9_eval_manager_per_competence_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES atlas_people.m9_skills(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_mobilite_candidatures_matching_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_mobilite_candidatures add constraint m9_mobilite_candidatures_matching_id_fkey FOREIGN KEY (matching_id) REFERENCES atlas_people.m9_mobilite_matching(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_mobilite_candidatures_pdc_accompagnement_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_mobilite_candidatures add constraint m9_mobilite_candidatures_pdc_accompagnement_id_fkey FOREIGN KEY (pdc_accompagnement_id) REFERENCES atlas_people.m9_pdc(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_mobilite_matching_poste_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_mobilite_matching add constraint m9_mobilite_matching_poste_id_fkey FOREIGN KEY (poste_id) REFERENCES atlas_people.m9_jobs(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_pdc_cycle_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_pdc add constraint m9_pdc_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES atlas_people.m8_cycles(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_pdc_actions_pdc_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_pdc_actions add constraint m9_pdc_actions_pdc_id_fkey FOREIGN KEY (pdc_id) REFERENCES atlas_people.m9_pdc(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_pdc_actions_target_skill_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_pdc_actions add constraint m9_pdc_actions_target_skill_id_fkey FOREIGN KEY (target_skill_id) REFERENCES atlas_people.m9_skills(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_pic_cycle_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_pic add constraint m9_pic_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES atlas_people.m8_cycles(id) ON DELETE CASCADE; end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_suspicious_patterns_related_poste_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_suspicious_patterns add constraint m9_suspicious_patterns_related_poste_id_fkey FOREIGN KEY (related_poste_id) REFERENCES atlas_people.m9_jobs(id); end if;
    if not exists (select 1 from pg_constraint where conname = 'm9_suspicious_patterns_related_skill_id_fkey' and connamespace = 'atlas_people'::regnamespace) then alter table m9_suspicious_patterns add constraint m9_suspicious_patterns_related_skill_id_fkey FOREIGN KEY (related_skill_id) REFERENCES atlas_people.m9_skills(id); end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. INDEX (hors index portés par une contrainte, créés en section 2)
-- ---------------------------------------------------------------------------
create index if not exists m10_alumni_boomerang_idx ON atlas_people.m10_alumni USING btree (tenant_id, boomerang_candidate) WHERE boomerang_candidate;
create index if not exists m10_audit_tenant_time_idx ON atlas_people.m10_audit_log USING btree (tenant_id, occurred_at DESC);
create index if not exists m10_pool_mem_emp_idx ON atlas_people.m10_talent_pool_memberships USING btree (tenant_id, employee_id) WHERE (exited_at IS NULL);
create index if not exists m10_promo_emp_idx ON atlas_people.m10_promotions USING btree (tenant_id, employee_id);
create index if not exists m10_promo_status_idx ON atlas_people.m10_promotions USING btree (tenant_id, status);
create index if not exists m10_susp_open_idx ON atlas_people.m10_suspicious_patterns USING btree (tenant_id, detected_at DESC) WHERE (status = 'open'::text);
create index if not exists m10_workshop_cycle_idx ON atlas_people.m10_talent_review_workshops USING btree (tenant_id, cycle_year);
create index if not exists m11_lms_prog_emp_idx ON atlas_people.m11_lms_progress USING btree (tenant_id, employee_id);
create index if not exists m11_parc_enrol_emp_idx ON atlas_people.m11_parcours_enrollments USING btree (tenant_id, employee_id);
create index if not exists m11_parc_modules_idx ON atlas_people.m11_parcours_modules USING btree (tenant_id, parcours_id, ord);
create index if not exists m11_pif_action_idx ON atlas_people.m11_pif_actions USING btree (tenant_id, pif_id);
create index if not exists m11_pif_emp_idx ON atlas_people.m11_pif USING btree (tenant_id, employee_id);
create index if not exists m11_susp_open_idx ON atlas_people.m11_suspicious_patterns USING btree (tenant_id, detected_at DESC) WHERE (status = 'open'::text);
create index if not exists m5_app_cand_idx ON atlas_people.m5_applications USING btree (tenant_id, candidate_id);
create index if not exists m5_app_job_stage_idx ON atlas_people.m5_applications USING btree (tenant_id, job_id, stage);
create index if not exists m5_audit_tenant_time_idx ON atlas_people.m5_audit_log USING btree (tenant_id, occurred_at DESC);
create index if not exists m5_candidates_email_idx ON atlas_people.m5_candidates USING btree (tenant_id, email);
create index if not exists m5_jobs_status_idx ON atlas_people.m5_jobs USING btree (tenant_id, status);
create index if not exists m5_needs_status_idx ON atlas_people.m5_needs USING btree (tenant_id, status);
create index if not exists m6_arrivants_status_idx ON atlas_people.m6_arrivants USING btree (tenant_id, parcours_status);
create index if not exists m6_audit_tenant_time_idx ON atlas_people.m6_audit_log USING btree (tenant_id, occurred_at DESC);
create index if not exists m6_tasks_arrivant_idx ON atlas_people.m6_tasks USING btree (tenant_id, arrivant_id);
create index if not exists m6_tasks_status_idx ON atlas_people.m6_tasks USING btree (tenant_id, status) WHERE (status <> 'done'::atlas_people.m6_task_status);
create index if not exists m9_cert_emp_idx ON atlas_people.m9_certifications_employees USING btree (tenant_id, employee_id);
create index if not exists m9_cert_expires_idx ON atlas_people.m9_certifications_employees USING btree (tenant_id, expires_at) WHERE (status = 'obtained'::atlas_people.m9_cert_status);
create index if not exists m9_eval_auto_emp_idx ON atlas_people.m9_eval_auto_competences USING btree (tenant_id, employee_id);
create index if not exists m9_eval_mgr_bias_idx ON atlas_people.m9_eval_manager_competences USING btree (tenant_id, bias_alert_triggered) WHERE bias_alert_triggered;
create index if not exists m9_eval_mgr_emp_idx ON atlas_people.m9_eval_manager_competences USING btree (tenant_id, employee_id);
create index if not exists m9_mob_cand_status_idx ON atlas_people.m9_mobilite_candidatures USING btree (tenant_id, status);
create index if not exists m9_mob_match_poste_idx ON atlas_people.m9_mobilite_matching USING btree (tenant_id, poste_id, match_pct DESC);
create index if not exists m9_pdc_action_pdc_idx ON atlas_people.m9_pdc_actions USING btree (tenant_id, pdc_id);
create index if not exists m9_pdc_emp_idx ON atlas_people.m9_pdc USING btree (tenant_id, employee_id);
create index if not exists m9_pdc_status_idx ON atlas_people.m9_pdc USING btree (tenant_id, status);
create index if not exists m9_susp_open_idx ON atlas_people.m9_suspicious_patterns USING btree (tenant_id, detected_at DESC) WHERE (status = 'open'::text);

-- ---------------------------------------------------------------------------
-- 5. RLS
--    146 policies en base, réduites ici à trois formes réelles :
--      • tenant_read / tenant_write sur les 56 tables (convention courante) ;
--      • <table>_select / <table>_write sur 15 tables, forme héritée des
--        sprints M9/M10/M11 — conservée telle quelle, c'est ce que porte la
--        base ; noter que _write ne contrôle QUE le rôle, sans borne de tenant,
--        la borne venant de la policy tenant_write permissive posée à côté ;
--      • 4 policies « owner » nominatives.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'm5_applications','m5_audit_log','m5_candidates','m5_interviews','m5_jobs',
    'm5_needs','m5_offers','m5_referrals','m5_scorecards',
    'm6_arrivants','m6_audit_log','m6_jalons','m6_parcours_templates','m6_pulses',
    'm6_tasks','m6_welcome_book',
    'm9_anti_discrim_alerts','m9_certifications_catalog','m9_certifications_employees',
    'm9_eval_auto_competences','m9_eval_auto_per_competence','m9_eval_auto_preuves',
    'm9_eval_consolidated','m9_eval_manager_competences','m9_eval_manager_per_competence',
    'm9_mobilite_candidatures','m9_mobilite_matching','m9_pdc','m9_pdc_actions','m9_pic',
    'm9_suspicious_patterns','m9_talents_snapshots',
    'm10_alumni','m10_audit_log','m10_job_families','m10_job_grades','m10_job_levels',
    'm10_promotions','m10_suspicious_patterns','m10_talent_pool_memberships',
    'm10_talent_pools','m10_talent_review_workshops',
    'm11_badge_attributions','m11_badges','m11_convocations','m11_formateurs',
    'm11_invoices','m11_lms_courses','m11_lms_progress','m11_parcours',
    'm11_parcours_enrollments','m11_parcours_modules','m11_pif','m11_pif_actions',
    'm11_session_animations','m11_suspicious_patterns'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format($f$drop policy if exists tenant_read on %I$f$, t);
    execute format($f$create policy tenant_read on %I for select
      using (tenant_id in (select atlas_people.current_tenant_ids()))$f$, t);
    execute format($f$drop policy if exists tenant_write on %I$f$, t);
    execute format($f$create policy tenant_write on %I
      for all using (atlas_people.is_hr_or_admin(tenant_id)
                     and tenant_id in (select atlas_people.current_tenant_ids()))
      with check (atlas_people.is_hr_or_admin(tenant_id)
                  and tenant_id in (select atlas_people.current_tenant_ids()))$f$, t);
  end loop;

  -- Forme héritée, présente en base sur ces 15 tables uniquement.
  foreach t in array array[
    'm9_anti_discrim_alerts','m9_certifications_catalog','m9_certifications_employees',
    'm9_pdc','m9_pdc_actions','m9_suspicious_patterns',
    'm10_promotions','m10_talent_pools',
    'm11_badge_attributions','m11_formateurs','m11_lms_progress','m11_parcours',
    'm11_parcours_enrollments','m11_pif','m11_suspicious_patterns'
  ]
  loop
    execute format($f$drop policy if exists %I on %I$f$, t || '_select', t);
    execute format($f$create policy %I on %I for select
      using (tenant_id in (select tt.tt from atlas_people.current_tenant_ids() tt(tt)))$f$,
      t || '_select', t);
    execute format($f$drop policy if exists %I on %I$f$, t || '_write', t);
    execute format($f$create policy %I on %I
      for all using (atlas_people.is_hr_or_admin(tenant_id))
      with check (atlas_people.is_hr_or_admin(tenant_id))$f$, t || '_write', t);
  end loop;
end $$;

-- Policies « owner » : l'intéressé voit sa propre ligne sans être RH/admin.
drop policy if exists owner_arrivant_read on m6_arrivants;
create policy owner_arrivant_read on m6_arrivants for select
  using (tenant_id in (select atlas_people.current_tenant_ids())
         and (atlas_people.is_hr_or_admin(tenant_id)
              or auth.uid() = employee_id
              or auth.uid() = manager_id
              or auth.uid() = buddy_id));

drop policy if exists owner_auto_read on m9_eval_auto_competences;
create policy owner_auto_read on m9_eval_auto_competences for select
  using (tenant_id in (select atlas_people.current_tenant_ids())
         and (atlas_people.is_hr_or_admin(tenant_id) or auth.uid() = employee_id));

drop policy if exists owner_lms_read on m11_lms_progress;
create policy owner_lms_read on m11_lms_progress for select
  using (tenant_id in (select atlas_people.current_tenant_ids())
         and (atlas_people.is_hr_or_admin(tenant_id) or auth.uid() = employee_id));

drop policy if exists owner_pif_read on m11_pif;
create policy owner_pif_read on m11_pif for select
  using (tenant_id in (select atlas_people.current_tenant_ids())
         and (atlas_people.is_hr_or_admin(tenant_id)
              or auth.uid() = employee_id
              or auth.uid() = manager_id));

-- ---------------------------------------------------------------------------
-- 6. TRIGGERS — updated_at (fonction m8_m9_touch_updated_at, migration 0025)
-- ---------------------------------------------------------------------------
drop trigger if exists m5_jobs_touch on m5_jobs;
create trigger m5_jobs_touch before update on m5_jobs
  for each row execute function atlas_people.m8_m9_touch_updated_at();
drop trigger if exists m5_needs_touch on m5_needs;
create trigger m5_needs_touch before update on m5_needs
  for each row execute function atlas_people.m8_m9_touch_updated_at();
drop trigger if exists m6_arrivants_touch on m6_arrivants;
create trigger m6_arrivants_touch before update on m6_arrivants
  for each row execute function atlas_people.m8_m9_touch_updated_at();
drop trigger if exists m9_pdc_action_touch on m9_pdc_actions;
create trigger m9_pdc_action_touch before update on m9_pdc_actions
  for each row execute function atlas_people.m8_m9_touch_updated_at();
drop trigger if exists m10_promo_touch on m10_promotions;
create trigger m10_promo_touch before update on m10_promotions
  for each row execute function atlas_people.m8_m9_touch_updated_at();
drop trigger if exists m11_pif_touch on m11_pif;
create trigger m11_pif_touch before update on m11_pif
  for each row execute function atlas_people.m8_m9_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 7. DROITS — uniformes sur les 56 tables et les 8 vues, conformes au default
--    ACL du schéma (anon=r, authenticated=arwd, service_role=tout).
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'm5_applications','m5_audit_log','m5_candidates','m5_interviews','m5_jobs',
    'm5_needs','m5_offers','m5_referrals','m5_scorecards',
    'm6_arrivants','m6_audit_log','m6_jalons','m6_parcours_templates','m6_pulses',
    'm6_tasks','m6_welcome_book',
    'm9_anti_discrim_alerts','m9_certifications_catalog','m9_certifications_employees',
    'm9_eval_auto_competences','m9_eval_auto_per_competence','m9_eval_auto_preuves',
    'm9_eval_consolidated','m9_eval_manager_competences','m9_eval_manager_per_competence',
    'm9_mobilite_candidatures','m9_mobilite_matching','m9_pdc','m9_pdc_actions','m9_pic',
    'm9_suspicious_patterns','m9_talents_snapshots',
    'm10_alumni','m10_audit_log','m10_job_families','m10_job_grades','m10_job_levels',
    'm10_promotions','m10_suspicious_patterns','m10_talent_pool_memberships',
    'm10_talent_pools','m10_talent_review_workshops',
    'm11_badge_attributions','m11_badges','m11_convocations','m11_formateurs',
    'm11_invoices','m11_lms_courses','m11_lms_progress','m11_parcours',
    'm11_parcours_enrollments','m11_parcours_modules','m11_pif','m11_pif_actions',
    'm11_session_animations','m11_suspicious_patterns',
    'employee_status_overview','m5_recrutement_summary','m6_onboarding_summary',
    'm9_anti_discrim_summary','m9_pdc_progress','m10_promotions_summary',
    'm10_succession_status','m11_pif_progress'
  ]
  loop
    execute format('grant select on %I to anon', t);
    execute format('grant select, insert, update, delete on %I to authenticated', t);
    execute format('grant all on %I to service_role', t);
  end loop;
end $$;

grant usage, select on sequence m5_audit_log_id_seq  to authenticated, service_role;
grant usage, select on sequence m6_audit_log_id_seq  to authenticated, service_role;
grant usage, select on sequence m10_audit_log_id_seq to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8. VUES
--
--    ATTENTION — reproduites À L'IDENTIQUE de la base, y compris un défaut :
--    aucune ne porte `security_invoker`. En PostgreSQL >= 15 le défaut est
--    « definer » : la vue s'exécute avec les droits du propriétaire et
--    court-circuite la RLS des tables sous-jacentes. Seule
--    employee_status_overview est protégée, parce qu'elle filtre elle-même sur
--    current_tenant_ids(). Les sept autres agrègent par tenant_id sans filtre :
--    un utilisateur authentifié y lit les agrégats de TOUS les tenants.
--
--    Non corrigé ici volontairement : ce fichier est un miroir de l'existant et
--    doit rester un no-op sur la production. `create or replace view` n'est PAS
--    neutre — ajouter security_invoker ici changerait le comportement de la
--    prod au premier rejeu. Correction à porter par une migration dédiée, comme
--    cela a été fait pour m12_kpi_reporting en 0045.
-- ---------------------------------------------------------------------------
create or replace view employee_status_overview as
 SELECT id,
    tenant_id,
    lifecycle_status,
    status AS presence_status,
        CASE
            WHEN lifecycle_status = 'left'::text THEN 'Parti'::text
            WHEN lifecycle_status = 'draft'::text THEN 'Brouillon'::text
            WHEN lifecycle_status = 'pending_signature'::text THEN 'En attente de signature'::text
            WHEN lifecycle_status ~~ 'suspended%'::text THEN 'Suspendu'::text
            WHEN lifecycle_status = 'transferred_intra_group'::text THEN 'Transféré (groupe)'::text
            WHEN status = 'leave'::atlas_people.employee_status THEN 'En congé'::text
            WHEN status = 'notice'::atlas_people.employee_status THEN 'En préavis'::text
            WHEN status = 'onboarding'::atlas_people.employee_status THEN 'En intégration'::text
            ELSE 'Actif'::text
        END AS effective_label
   FROM atlas_people.employees e
  WHERE (tenant_id IN ( SELECT atlas_people.current_tenant_ids() AS current_tenant_ids));

create or replace view m5_recrutement_summary as
 SELECT tenant_id,
    count(*) FILTER (WHERE status = 'open'::atlas_people.m5_job_status) AS jobs_ouverts,
    count(*) FILTER (WHERE status = 'closed_filled'::atlas_people.m5_job_status) AS jobs_pourvus,
    avg(EXTRACT(epoch FROM COALESCE(closed_at, now()) - opened_at) / 86400::numeric) FILTER (WHERE status = 'closed_filled'::atlas_people.m5_job_status) AS time_to_fill_avg_days
   FROM atlas_people.m5_jobs
  GROUP BY tenant_id;

create or replace view m6_onboarding_summary as
 SELECT tenant_id,
    count(*) AS arrivants_total,
    count(*) FILTER (WHERE parcours_status = 'active'::atlas_people.m6_parcours_status) AS arrivants_actifs,
    count(*) FILTER (WHERE parcours_status = 'completed'::atlas_people.m6_parcours_status) AS parcours_termines,
    round(avg(overall_completion_pct), 1) AS completion_avg_pct,
    round(avg(pulse_avg), 2) AS pulse_avg
   FROM atlas_people.m6_arrivants
  GROUP BY tenant_id;

create or replace view m9_anti_discrim_summary as
 SELECT tenant_id,
    count(*) AS total_alerts,
    count(*) FILTER (WHERE status = 'open'::text) AS open_alerts,
    count(*) FILTER (WHERE status = 'open'::text AND bias_axis = 'gender'::text) AS gender_open,
    count(*) FILTER (WHERE status = 'open'::text AND bias_axis = 'age'::text) AS age_open,
    count(*) FILTER (WHERE juriste_notified) AS juriste_notified_count
   FROM atlas_people.m9_anti_discrim_alerts
  GROUP BY tenant_id;

create or replace view m9_pdc_progress as
 SELECT p.tenant_id,
    p.id AS pdc_id,
    p.employee_id,
    p.status,
    count(a.id) AS actions_total,
    count(a.id) FILTER (WHERE a.status = 'completed'::atlas_people.m9_action_status) AS actions_completed,
    count(a.id) FILTER (WHERE a.status = 'in_progress'::atlas_people.m9_action_status) AS actions_in_progress,
    COALESCE(round(avg(a.completion_pct), 0), 0::numeric) AS completion_avg
   FROM atlas_people.m9_pdc p
     LEFT JOIN atlas_people.m9_pdc_actions a ON a.tenant_id = p.tenant_id AND a.pdc_id = p.id
  GROUP BY p.tenant_id, p.id, p.employee_id, p.status;

create or replace view m10_promotions_summary as
 SELECT tenant_id,
    count(*) AS total,
    count(*) FILTER (WHERE status = 'comite_pending'::atlas_people.m10_promotion_status) AS pending_comite,
    count(*) FILTER (WHERE status = ANY (ARRAY['validated'::atlas_people.m10_promotion_status, 'communicated'::atlas_people.m10_promotion_status])) AS validated_count,
    count(*) FILTER (WHERE status = 'contested'::atlas_people.m10_promotion_status) AS contested_count,
    sum(salary_increase_monthly) FILTER (WHERE status = ANY (ARRAY['validated'::atlas_people.m10_promotion_status, 'communicated'::atlas_people.m10_promotion_status])) AS total_monthly_increase
   FROM atlas_people.m10_promotions
  GROUP BY tenant_id;

create or replace view m10_succession_status as
 SELECT cr.tenant_id,
    cr.id AS role_id,
    cr.role_label,
    cr.criticality,
    count(ss.id) AS successors_count,
    count(ss.id) FILTER (WHERE ss.readiness = 'ready_now'::atlas_people.m10_succession_readiness) AS ready_now_count,
    count(ss.id) FILTER (WHERE ss.readiness = 'ready_18m'::atlas_people.m10_succession_readiness) AS ready_18m_count,
    count(ss.id) FILTER (WHERE ss.readiness = 'ready_3y'::atlas_people.m10_succession_readiness) AS ready_3y_count,
    cr.last_review_at,
    cr.next_review_due
   FROM atlas_people.m10_critical_roles cr
     LEFT JOIN atlas_people.m10_succession_successors ss ON ss.tenant_id = cr.tenant_id AND ss.critical_role_id = cr.id
  GROUP BY cr.tenant_id, cr.id, cr.role_label, cr.criticality, cr.last_review_at, cr.next_review_due;

create or replace view m11_pif_progress as
 SELECT p.tenant_id,
    p.id AS pif_id,
    p.employee_id,
    p.year,
    p.status,
    count(a.id) AS actions_total,
    count(a.id) FILTER (WHERE a.status = 'completed'::atlas_people.m11_action_status) AS actions_completed,
    count(a.id) FILTER (WHERE a.status = 'in_progress'::atlas_people.m11_action_status) AS actions_in_progress,
    COALESCE(round(avg(a.completion_pct), 0), 0::numeric) AS completion_avg,
    p.budget_individual,
    p.budget_consumed,
        CASE
            WHEN p.budget_individual > 0 THEN round(p.budget_consumed::numeric / p.budget_individual::numeric * 100::numeric, 1)
            ELSE 0::numeric
        END AS budget_pct
   FROM atlas_people.m11_pif p
     LEFT JOIN atlas_people.m11_pif_actions a ON a.tenant_id = p.tenant_id AND a.pif_id = p.id
  GROUP BY p.tenant_id, p.id, p.employee_id, p.year, p.status, p.budget_individual, p.budget_consumed;

-- ---------------------------------------------------------------------------
-- 9. FONCTION — bootstrap tenant (état de revendication côté onboarding)
-- ---------------------------------------------------------------------------
create or replace function atlas_people.tenant_bootstrap_state(p_tenant_id uuid)
 returns table(exists_tenant boolean, tenant_name text, claimable boolean, is_owner boolean)
 language sql
 stable security definer
 set search_path to 'atlas_people', 'public'
as $function$
  select
    true,
    t.name,
    (t.owner_user_id is null
      and not exists (select 1 from atlas_people.tenant_memberships m where m.tenant_id = t.id)),
    (t.owner_user_id is not null and t.owner_user_id = auth.uid())
  from atlas_people.tenants t
  where t.id = p_tenant_id and auth.uid() is not null;
$function$;

grant execute on function atlas_people.tenant_bootstrap_state(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 10. COMMENTAIRES
-- ---------------------------------------------------------------------------
comment on view employee_status_overview is 'Statut effectif consolidé Atlas People : combine lifecycle_status (prioritaire) et status (présence) en un libellé unique pour l''UI.';
comment on view m10_succession_status is 'Synthese succession M10 : couverture 3+ + readiness';
comment on view m11_pif_progress is 'Synthese PIF par employee : completion + budget consume';
comment on view m9_anti_discrim_summary is 'Synthese M9 anti-discrimination par tenant';
comment on view m9_pdc_progress is 'Synthese PDC par employee : completion moyenne pondéree';
