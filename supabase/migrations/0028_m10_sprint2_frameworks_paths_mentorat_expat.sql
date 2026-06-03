-- ============================================================================
-- Atlas People — M10 Carrières sprint 2 (selon spec CARRIERE.zip).
-- Couvre :
--   • Career Frameworks dual-track (Management/Expert/Specialist) + transitions
--   • Career Paths individuels (7 sections + signatures ADVIST)
--   • Succession enrichie (politique 3+ successeurs + readiness)
--   • Mentorat & Sponsorship (3 programmes formels + sessions privées)
--   • Expatriation (packages 7 composantes + 1-1 mensuels + clause retour)
-- ============================================================================
set search_path = atlas_people, public, extensions;

do $$ begin create type m10_track_switch_status as enum ('requested','evaluated','approved','rejected','executed'); exception when duplicate_object then null; end $$;
do $$ begin create type m10_career_path_status as enum ('draft','co_constructed','signed','review_pending','expired'); exception when duplicate_object then null; end $$;
do $$ begin create type m10_succession_readiness as enum ('ready_now','ready_18m','ready_3y','not_ready'); exception when duplicate_object then null; end $$;
do $$ begin create type m10_mentorat_kind as enum ('mentorat_formel','sponsorship_cross','reverse_mentoring'); exception when duplicate_object then null; end $$;
do $$ begin create type m10_mentorat_status as enum ('proposed','active','paused','completed','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type m10_expat_status as enum ('candidature','preparation','in_progress','returned','cancelled','breach'); exception when duplicate_object then null; end $$;

-- Career Frameworks
create table if not exists m10_career_frameworks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  track m10_track not null,
  level_code text not null,
  name text not null,
  span_label text,
  ord int not null,
  competences_required text[],
  activities_typical text[],
  created_at timestamptz not null default now(),
  unique (tenant_id, track, level_code)
);

create table if not exists m10_track_switches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  employee_id uuid not null,
  from_track m10_track not null,
  to_track m10_track not null,
  from_level_code text not null,
  to_level_code text not null,
  requested_at timestamptz not null default now(),
  reason text,
  process_notes text,
  status m10_track_switch_status not null default 'requested',
  evaluated_at timestamptz,
  decided_at timestamptz,
  executed_at timestamptz
);

-- Career Paths Individual (7 sections + signatures)
create table if not exists m10_career_paths_individual (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  employee_id uuid not null,
  manager_id uuid not null,
  year int not null,
  status m10_career_path_status not null default 'draft',
  aspirations text,
  forces text,
  competences_to_acquire text,
  next_role_12_18m text,
  horizon_3_5y text,
  mobility_accepted text,
  engagement_mutuel text,
  signed_by_employee_at timestamptz,
  signed_by_manager_at timestamptz,
  signed_by_drh_at timestamptz,
  advist_hash text,
  next_review_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, employee_id, year)
);

-- Succession enrichie
create table if not exists m10_critical_roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  role_label text not null,
  current_holder_id uuid,
  criticality text not null check (criticality in ('low','medium','high','critical')),
  business_impact text,
  last_review_at date,
  next_review_due date,
  created_at timestamptz not null default now(),
  unique (tenant_id, role_label)
);

create table if not exists m10_succession_successors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  critical_role_id uuid not null references m10_critical_roles(id) on delete cascade,
  successor_id uuid not null,
  readiness m10_succession_readiness not null default 'not_ready',
  ranking int,
  development_plan_pdc_id uuid,
  notes text,
  added_at timestamptz not null default now(),
  unique (tenant_id, critical_role_id, successor_id)
);

-- Mentorat & Sponsorship
create table if not exists m10_mentorat_programs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  kind m10_mentorat_kind not null,
  name text not null,
  description text,
  duration_months int not null,
  expected_sessions int,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists m10_mentorat_pairs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  program_id uuid not null references m10_mentorat_programs(id),
  mentor_id uuid not null,
  mentee_id uuid not null,
  focus text,
  started_at date not null,
  expected_end_at date,
  ended_at date,
  end_reason text,
  status m10_mentorat_status not null default 'active',
  sessions_held int not null default 0,
  satisfaction_mentor int check (satisfaction_mentor between 1 and 5),
  satisfaction_mentee int check (satisfaction_mentee between 1 and 5),
  unique (tenant_id, program_id, mentor_id, mentee_id, started_at)
);

create table if not exists m10_mentorat_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  pair_id uuid not null references m10_mentorat_pairs(id) on delete cascade,
  held_at timestamptz not null,
  duration_minutes int,
  notes_private text,
  next_step text,
  created_at timestamptz not null default now()
);

-- Expatriation
create table if not exists m10_expatriations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  employee_id uuid not null,
  from_country char(2) not null,
  to_country char(2) not null,
  role_label text not null,
  start_date date,
  end_date date,
  status m10_expat_status not null default 'candidature',
  package_total bigint,
  return_clause_months int default 24,
  reintegration_role text,
  breach_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists m10_expatriation_packages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  expatriation_id uuid not null references m10_expatriations(id) on delete cascade,
  component text not null check (component in
    ('indemnite_expat','logement','scolarite','voyages','sante','langue','col_adjustment','autre')),
  amount bigint not null,
  pct_of_base numeric,
  notes text,
  unique (tenant_id, expatriation_id, component)
);

create table if not exists m10_expatriation_1on1 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  expatriation_id uuid not null references m10_expatriations(id) on delete cascade,
  held_at timestamptz not null,
  participants text[],
  topics text[],
  satisfaction_collab int check (satisfaction_collab between 1 and 5),
  flagged_issues text,
  next_step text,
  created_at timestamptz not null default now()
);

-- RLS, triggers, vues : voir migration appliquée directement via MCP
-- (rejouable car idempotent : drop policy if exists + create policy)
