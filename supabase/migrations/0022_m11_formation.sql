-- ============================================================================
-- Atlas People — M11 « Formation & Développement ».
-- Réf. specs M11 (catalogue · plan annuel · sessions · inscriptions · Kirkpatrick
-- 4 niveaux · certifications · FDFP/3FPT OHADA · ROI · uplift compétences).
--
-- Règles dures :
--   R1  RLS tenant-aware (current_tenant_ids() en lecture, is_hr_or_admin pour écriture).
--   R2  Plan annuel validé > 30 M FCFA → escalade DG (contrôlé applicativement).
--   R3  Certifications HSE/conformité alerte renouvellement à J-90.
--   R4  Conservation 10 ans déclarations FDFP/3FPT, 7 ans audits.
--   R5  Audit chaîné SHA-256 sur opérations sensibles (plan approve, scoring,
--       certification émission, déclaration FDFP submit).
--
-- Additif & idempotent (create … if not exists). Schéma atlas_people.
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- ---------------------------------------------------------------------------
-- 0. ENUMS
-- ---------------------------------------------------------------------------
do $$ begin create type m11_modality as enum
  ('e_learning','classroom','blended','workshop','coaching','mentoring','conference','certification_prep');
exception when duplicate_object then null; end $$;

do $$ begin create type m11_provider as enum ('internal','external','mooc');
exception when duplicate_object then null; end $$;

do $$ begin create type m11_category as enum
  ('leadership','management','technical','business','language','compliance',
   'safety','product','sales','soft_skills','digital','finance');
exception when duplicate_object then null; end $$;

do $$ begin create type m11_level as enum ('beginner','intermediate','advanced','expert');
exception when duplicate_object then null; end $$;

do $$ begin create type m11_course_status as enum ('draft','active','paused','archived');
exception when duplicate_object then null; end $$;

do $$ begin create type m11_plan_status as enum
  ('draft','pending_drh','pending_daf','pending_dg','approved','in_execution','closed');
exception when duplicate_object then null; end $$;

do $$ begin create type m11_plan_item_status as enum
  ('planned','scheduled','in_progress','completed','cancelled','postponed');
exception when duplicate_object then null; end $$;

do $$ begin create type m11_plan_origin as enum
  ('evaluation','okr','career_path','legal','strategic','individual_request');
exception when duplicate_object then null; end $$;

do $$ begin create type m11_session_status as enum
  ('scheduled','open_registration','closed_registration','in_progress','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin create type m11_delivery_mode as enum ('on_site','remote','hybrid');
exception when duplicate_object then null; end $$;

do $$ begin create type m11_registration_status as enum
  ('requested','waitlisted','approved','confirmed','attended','partial','no_show',
   'completed','failed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin create type m11_kirkpatrick_level as enum ('1','2','3','4');
exception when duplicate_object then null; end $$;

do $$ begin create type m11_kirkpatrick_status as enum ('pending','in_progress','completed','expired');
exception when duplicate_object then null; end $$;

do $$ begin create type m11_certification_status as enum ('active','expired','revoked','pending_renewal');
exception when duplicate_object then null; end $$;

do $$ begin create type m11_fdfp_status as enum
  ('draft','submitted','under_review','approved','reimbursed','rejected');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 1. CATALOGUE — COURSES
-- ---------------------------------------------------------------------------
create table if not exists m11_courses (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null,
  ref                text not null,                       -- FRM-2026-0042
  title              text not null,
  modality           m11_modality not null,
  provider           m11_provider not null,
  provider_name      text not null,
  category           m11_category not null,
  level              m11_level not null,
  language           text not null check (language in ('FR','EN','BIL')),
  duration_hours     numeric not null check (duration_hours >= 0),
  cost_per_head      bigint not null default 0,           -- FCFA
  cost_per_session   bigint,
  min_participants   int,
  max_participants   int,
  summary            text,
  objectives         jsonb default '[]'::jsonb,           -- [{text, skillCode?, targetLevel?}]
  prerequisites      text[],
  certification_code text,
  fdfp_eligible      boolean not null default false,
  status             m11_course_status not null default 'draft',
  kirkpatrick_levels int not null default 1 check (kirkpatrick_levels between 1 and 4),
  tags               text[],
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (tenant_id, ref)
);
create index if not exists m11_courses_tenant_status_idx on m11_courses (tenant_id, status);
create index if not exists m11_courses_category_idx on m11_courses (tenant_id, category);

-- ---------------------------------------------------------------------------
-- 2. PLAN ANNUEL — TRAINING_PLANS + PLAN_ITEMS
-- ---------------------------------------------------------------------------
create table if not exists m11_training_plans (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null,
  ref                      text not null,                 -- PLN-2026
  year                     int not null,
  scope                    text not null check (scope in ('company','BU','department')),
  scope_label              text not null,
  status                   m11_plan_status not null default 'draft',
  budget_envelope          bigint not null default 0,     -- FCFA
  budget_consumed          bigint not null default 0,
  fdfp_rebate_forecast     bigint not null default 0,
  beneficiaries_forecast   int  not null default 0,
  hours_forecast           numeric not null default 0,
  approved_by              uuid,                          -- employee_id
  approved_at              timestamptz,
  created_by               uuid not null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (tenant_id, ref)
);
create index if not exists m11_plans_tenant_year_idx on m11_training_plans (tenant_id, year);

create table if not exists m11_plan_items (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null,
  plan_id               uuid not null references m11_training_plans(id) on delete cascade,
  course_id             uuid not null references m11_courses(id),
  target_employee_ids   uuid[] not null default '{}',
  target_teams          text[],
  origin                m11_plan_origin not null default 'strategic',
  priority              text not null default 'medium' check (priority in ('critical','high','medium','low')),
  forecast_quarter      text not null check (forecast_quarter in ('Q1','Q2','Q3','Q4')),
  forecast_cost         bigint not null default 0,
  realised_cost         bigint,
  status                m11_plan_item_status not null default 'planned',
  rationale             text,
  created_at            timestamptz not null default now()
);
create index if not exists m11_plan_items_plan_idx on m11_plan_items (tenant_id, plan_id);
create index if not exists m11_plan_items_status_idx on m11_plan_items (tenant_id, status);

-- ---------------------------------------------------------------------------
-- 3. SESSIONS
-- ---------------------------------------------------------------------------
create table if not exists m11_training_sessions (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null,
  ref                      text not null,                 -- SES-2026-0089
  course_id                uuid not null references m11_courses(id),
  plan_id                  uuid references m11_training_plans(id),
  status                   m11_session_status not null default 'scheduled',
  delivery_mode            m11_delivery_mode not null,
  location                 text,
  meeting_url              text,
  trainers                 jsonb default '[]'::jsonb,     -- [{type, employee_id?, externalName?, organization?, hourlyRate?}]
  days                     jsonb not null default '[]'::jsonb, -- [{date, startTime, endTime}]
  total_hours              numeric not null default 0,
  capacity                 int not null check (capacity > 0),
  registered_count         int not null default 0,
  waitlist_count           int not null default 0,
  attended_count           int,
  completion_rate          numeric,                       -- 0-1
  average_score            numeric,                       -- L2 0-100
  average_reaction_score   numeric,                       -- L1 1-5
  cost_total               bigint not null default 0,
  country_code             char(2) not null,
  fdfp_declaration_ref     text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (tenant_id, ref)
);
create index if not exists m11_sessions_tenant_status_idx on m11_training_sessions (tenant_id, status);
create index if not exists m11_sessions_country_idx on m11_training_sessions (tenant_id, country_code);

-- ---------------------------------------------------------------------------
-- 4. REGISTRATIONS
-- ---------------------------------------------------------------------------
create table if not exists m11_registrations (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  ref                 text not null,
  session_id          uuid not null references m11_training_sessions(id) on delete cascade,
  employee_id         uuid not null,
  status              m11_registration_status not null default 'requested',
  requested_at        timestamptz not null default now(),
  approved_at         timestamptz,
  approved_by         uuid,
  confirmed_at        timestamptz,
  attended_hours      numeric,
  learning_score      int,                                -- 0-100
  reaction_score      int check (reaction_score between 1 and 5),
  reaction_comment    text,
  certificate_id      uuid,
  cancelled_at        timestamptz,
  cancelled_reason    text,
  allocated_cost      bigint not null default 0,
  unique (tenant_id, ref),
  unique (tenant_id, session_id, employee_id)
);
create index if not exists m11_regs_tenant_session_idx on m11_registrations (tenant_id, session_id);
create index if not exists m11_regs_tenant_employee_idx on m11_registrations (tenant_id, employee_id);

-- ---------------------------------------------------------------------------
-- 5. KIRKPATRICK EVALS
-- ---------------------------------------------------------------------------
create table if not exists m11_kirkpatrick_evals (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  session_id          uuid not null references m11_training_sessions(id) on delete cascade,
  level               m11_kirkpatrick_level not null,
  trigger_days        int not null,
  status              m11_kirkpatrick_status not null default 'pending',
  launched_at         timestamptz,
  closed_at           timestamptz,
  target_respondents  int not null default 0,
  respondents         int not null default 0,
  aggregate_score     numeric,
  insights            text[]
);
create index if not exists m11_kp_session_level_idx on m11_kirkpatrick_evals (tenant_id, session_id, level);

-- ---------------------------------------------------------------------------
-- 6. CERTIFICATIONS
-- ---------------------------------------------------------------------------
create table if not exists m11_certifications (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  ref                 text not null,
  employee_id         uuid not null,
  course_id           uuid not null references m11_courses(id),
  certificate_code    text not null,
  issued_at           date not null,
  expires_at          date,
  issuer              text not null,
  status              m11_certification_status not null default 'active',
  pdf_url             text,
  validated_by        uuid,
  unique (tenant_id, ref)
);
create index if not exists m11_certs_employee_idx on m11_certifications (tenant_id, employee_id);
create index if not exists m11_certs_expires_idx on m11_certifications (tenant_id, expires_at)
  where status in ('active','pending_renewal');

-- ---------------------------------------------------------------------------
-- 7. FDFP DECLARATIONS
-- ---------------------------------------------------------------------------
create table if not exists m11_fdfp_declarations (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null,
  ref                   text not null,
  country_code          char(2) not null,
  year                  int not null,
  quarter               int not null check (quarter between 1 and 4),
  status                m11_fdfp_status not null default 'draft',
  sessions_count        int not null default 0,
  hours_total           numeric not null default 0,
  beneficiaries_count   int not null default 0,
  cost_declared         bigint not null default 0,
  rebate_expected       bigint not null default 0,
  rebate_received       bigint,
  submitted_at          timestamptz,
  reimbursed_at         timestamptz,
  rejection_reason      text,
  unique (tenant_id, ref)
);
create index if not exists m11_fdfp_country_period_idx on m11_fdfp_declarations (tenant_id, country_code, year, quarter);

-- ---------------------------------------------------------------------------
-- 8. SKILL UPLIFTS
-- ---------------------------------------------------------------------------
create table if not exists m11_skill_uplifts (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null,
  employee_id              uuid not null,
  skill_code               text not null,
  pre_level                int not null check (pre_level between 1 and 5),
  post_level               int not null check (post_level between 1 and 5),
  acquired_via_session_id  uuid references m11_training_sessions(id),
  acquired_at              date not null
);
create index if not exists m11_uplifts_employee_idx on m11_skill_uplifts (tenant_id, employee_id);

-- ---------------------------------------------------------------------------
-- 9. AUDIT — chaîne SHA-256
-- ---------------------------------------------------------------------------
create table if not exists m11_audit_log (
  id              bigserial primary key,
  tenant_id       uuid not null,
  occurred_at     timestamptz not null default now(),
  actor_id        uuid,
  actor_role      text,
  actor_ip        inet,
  action_code     text not null,
  resource_type   text,                 -- course | plan | session | registration | kirkpatrick | certification | fdfp
  resource_id     uuid,
  before_state    jsonb,
  after_state     jsonb,
  prev_hash       text,
  hash            text not null
);
create index if not exists m11_audit_tenant_time_idx on m11_audit_log (tenant_id, occurred_at desc);
create index if not exists m11_audit_resource_idx on m11_audit_log (tenant_id, resource_type, resource_id);

-- ---------------------------------------------------------------------------
-- 10. RLS — tenant-aware
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'm11_courses','m11_training_plans','m11_plan_items','m11_training_sessions',
    'm11_registrations','m11_kirkpatrick_evals','m11_certifications',
    'm11_fdfp_declarations','m11_skill_uplifts','m11_audit_log'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format($f$drop policy if exists tenant_read on %I$f$, t);
    execute format($f$create policy tenant_read on %I for select using (tenant_id = any (current_tenant_ids()))$f$, t);
    -- écriture : HR/admin
    execute format($f$drop policy if exists tenant_write on %I$f$, t);
    execute format($f$create policy tenant_write on %I
      for all using (tenant_id = any (current_tenant_ids()) and is_hr_or_admin())
      with check (tenant_id = any (current_tenant_ids()) and is_hr_or_admin())$f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 11. TRIGGERS — updated_at
-- ---------------------------------------------------------------------------
create or replace function m11_touch_updated_at() returns trigger
language plpgsql set search_path = atlas_people, public as $$
begin new.updated_at = now(); return new; end $$;

do $$ begin
  drop trigger if exists m11_courses_touch on m11_courses;
  create trigger m11_courses_touch before update on m11_courses
    for each row execute function m11_touch_updated_at();

  drop trigger if exists m11_plans_touch on m11_training_plans;
  create trigger m11_plans_touch before update on m11_training_plans
    for each row execute function m11_touch_updated_at();

  drop trigger if exists m11_sessions_touch on m11_training_sessions;
  create trigger m11_sessions_touch before update on m11_training_sessions
    for each row execute function m11_touch_updated_at();
end $$;

-- ---------------------------------------------------------------------------
-- 12. VIEWS — KPIs cockpit
-- ---------------------------------------------------------------------------
create or replace view m11_kpi_cockpit as
select
  c.tenant_id,
  count(distinct r.employee_id) filter (where r.status in ('attended','completed','partial')) as beneficiaires_ytd,
  count(distinct s.id) filter (where s.status in ('scheduled','open_registration')) as sessions_to_come,
  avg(r.reaction_score) as satisfaction_l1,
  avg(r.learning_score) as acquis_l2,
  count(*) filter (where cert.status = 'active') as certifications_actives,
  count(*) filter (where cert.status = 'pending_renewal') as certifications_a_renouveler
from m11_courses c
left join m11_training_sessions s on s.tenant_id = c.tenant_id and s.course_id = c.id
left join m11_registrations r on r.tenant_id = c.tenant_id and r.session_id = s.id
left join m11_certifications cert on cert.tenant_id = c.tenant_id and cert.course_id = c.id
group by c.tenant_id;

comment on view m11_kpi_cockpit is 'Vue agrégée KPIs M11 Formation — utilisée par /formation cockpit.';
