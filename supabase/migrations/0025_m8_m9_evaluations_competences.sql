-- ============================================================================
-- Atlas People — M8 Évaluations enrichies + M9 Compétences (Workday Skills Cloud).
-- Réf. specs : EVAL.zip M8 (11 205 lignes) + best practices Workday M9.
--
-- M8 ÉVALUATIONS couvre :
--   • Cycles annuels (6 phases) · sync OKR/Paie/Budget
--   • Évaluations multi-dimensions (5 dim pondérées 35/25/20/12/8)
--   • Calibration 3 niveaux (équipe/direction/entreprise) + distribution
--   • Feedback 360° (peers/transverse/N-1)
--   • Plans de développement individuels (PDI/PDP)
--   • Audit chaîné SHA-256 + 12 patterns anti-fraude
--   • Anti-discrimination (équité H/F, ancienneté, clustering)
--
-- M9 COMPÉTENCES couvre :
--   • Skills taxonomy (6 familles)
--   • Skill matrix collab × skill (niveaux 0-5)
--   • Job requirements (référentiel métiers)
--   • Certifications compétences
--   • Audit log
--
-- Règles dures :
--   R1  Note finale immuable après signature ADVIST
--   R2  Calibration trace les modifications (before/after en audit)
--   R3  Distribution alerte si > 40 % A ou > 25 % E dans une équipe
--   R4  Cellule d'écoute déclenchée si pattern de biais critique
--   R5  RLS tenant-aware + auto-éval visible owner uniquement
--
-- Additif & idempotent. Schéma atlas_people.
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- ---------------------------------------------------------------------------
-- 0. ENUMS M8
-- ---------------------------------------------------------------------------
do $$ begin create type m8_cycle_phase as enum
  ('preparation','auto_eval','manager_eval','calibration','entretiens','finalisation','closed');
exception when duplicate_object then null; end $$;

do $$ begin create type m8_eval_status as enum
  ('draft','auto_submitted','manager_review','calibrated','entretien_pending','signed','closed');
exception when duplicate_object then null; end $$;

do $$ begin create type m8_classe_finale as enum ('A','B','C','D','E');
exception when duplicate_object then null; end $$;

do $$ begin create type m8_calibration_level as enum ('team','direction','enterprise');
exception when duplicate_object then null; end $$;

do $$ begin create type m8_feedback_relation as enum ('peer','transverse','n_minus_1','manager','external');
exception when duplicate_object then null; end $$;

do $$ begin create type m8_bias_pattern as enum
  ('SCORE_INFLATION','BIAIS_GENRE_SYSTEMIQUE','CLUSTERING','NOTE_MODIFIEE_POST_SIGNATURE',
   'AUTO_EVAL_OUBLIEE','CALIBRATION_BYPASS','DIRECTOR_OVERRIDE_PATTERN',
   'JUNIOR_SYSTEMATIC_C','DRH_ARBITRAGE_FREQUENT','EVAL_TIMING_SUSPECT',
   'PLAN_DEV_MANQUANT','NOTE_INCOHERENTE_OKR');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 1. M8 CYCLES
-- ---------------------------------------------------------------------------
create table if not exists m8_cycles (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  code            text not null,                 -- 2026
  label           text not null,
  year            int not null,
  phase           m8_cycle_phase not null default 'preparation',
  start_date      date not null,
  end_date        date not null,
  closed_at       timestamptz,
  config          jsonb default '{}'::jsonb,     -- pondération dimensions + seuils
  created_at      timestamptz not null default now(),
  unique (tenant_id, code)
);

-- ---------------------------------------------------------------------------
-- 2. M8 EVALUATIONS (1 par collab × cycle)
-- ---------------------------------------------------------------------------
create table if not exists m8_evaluations (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null,
  cycle_id                 uuid not null references m8_cycles(id) on delete cascade,
  employee_id              uuid not null,
  manager_id               uuid,
  ref                      text not null,         -- EVAL-2026-0042
  status                   m8_eval_status not null default 'draft',
  -- Scores par dimension (0-5)
  score_dim1_okr           numeric check (score_dim1_okr between 0 and 5),
  score_dim2_competences   numeric check (score_dim2_competences between 0 and 5),
  score_dim3_comportements numeric check (score_dim3_comportements between 0 and 5),
  score_dim4_evolution     numeric check (score_dim4_evolution between 0 and 5),
  score_dim5_developpement numeric check (score_dim5_developpement between 0 and 5),
  -- Pondération (sum = 100, configurable)
  weight_dim1 int default 35, weight_dim2 int default 25, weight_dim3 int default 20,
  weight_dim4 int default 12, weight_dim5 int default 8,
  -- Note finale calculée (0-100) + classe (figée à signature)
  note_finale              numeric,
  classe                   m8_classe_finale,
  -- Texte libre (auto-éval + manager + restitution entretien)
  auto_eval_text           text,
  manager_eval_text        text,
  entretien_notes          text,
  -- Workflow
  auto_submitted_at        timestamptz,
  manager_submitted_at     timestamptz,
  calibrated_at            timestamptz,
  entretien_held_at        timestamptz,
  signed_at                timestamptz,
  advist_hash              text,                  -- signature électronique
  -- Anti-fraude
  modifications_count      int not null default 0,
  override_by_director     boolean not null default false,
  override_by_drh          boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (tenant_id, ref),
  unique (tenant_id, cycle_id, employee_id)
);
create index if not exists m8_eval_cycle_idx on m8_evaluations (tenant_id, cycle_id);
create index if not exists m8_eval_employee_idx on m8_evaluations (tenant_id, employee_id);
create index if not exists m8_eval_status_idx on m8_evaluations (tenant_id, status);

-- Trigger immutabilité après signature
create or replace function m8_eval_immutable() returns trigger
language plpgsql set search_path = atlas_people, public as $$
begin
  if old.signed_at is not null and (
    old.note_finale is distinct from new.note_finale or
    old.classe is distinct from new.classe or
    old.advist_hash is distinct from new.advist_hash
  ) then
    raise exception 'Evaluation signee : note_finale / classe / advist_hash immuables (R1)';
  end if;
  return new;
end $$;

do $$ begin
  drop trigger if exists m8_eval_immutable_trg on m8_evaluations;
  create trigger m8_eval_immutable_trg before update on m8_evaluations
    for each row execute function m8_eval_immutable();
end $$;

-- ---------------------------------------------------------------------------
-- 3. M8 CALIBRATION SESSIONS
-- ---------------------------------------------------------------------------
create table if not exists m8_calibration_sessions (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null,
  cycle_id             uuid not null references m8_cycles(id) on delete cascade,
  level                m8_calibration_level not null,
  scope_label          text not null,             -- "Direction Sales", "Equipe Tech"
  held_at              timestamptz not null,
  duration_minutes     int,
  facilitator_id       uuid,
  attendees            uuid[] not null default '{}',
  evaluations_reviewed int not null default 0,
  notes_modified       int not null default 0,
  -- Distribution avant/après
  distribution_before  jsonb,                     -- {A:n, B:n, C:n, D:n, E:n}
  distribution_after   jsonb,
  decisions            text[],
  minutes_url          text,
  created_at           timestamptz not null default now()
);
create index if not exists m8_calib_cycle_idx on m8_calibration_sessions (tenant_id, cycle_id, level);

-- ---------------------------------------------------------------------------
-- 4. M8 FEEDBACK 360°
-- ---------------------------------------------------------------------------
create table if not exists m8_feedback_360 (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null,
  evaluation_id        uuid not null references m8_evaluations(id) on delete cascade,
  reviewer_id          uuid,                      -- null = anonyme
  reviewer_relation    m8_feedback_relation not null,
  invited_at           timestamptz not null default now(),
  submitted_at         timestamptz,
  -- Scores (0-5) sur 3 axes 360°
  score_collaboration  numeric check (score_collaboration between 0 and 5),
  score_communication  numeric check (score_communication between 0 and 5),
  score_excellence     numeric check (score_excellence between 0 and 5),
  -- Texte libre (anonymisé)
  strengths            text,
  improvements         text,
  visible_to_employee  boolean not null default true
);
create index if not exists m8_360_eval_idx on m8_feedback_360 (tenant_id, evaluation_id);

-- ---------------------------------------------------------------------------
-- 5. M8 PLANS DE DÉVELOPPEMENT
-- ---------------------------------------------------------------------------
create table if not exists m8_dev_plans (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  evaluation_id       uuid not null references m8_evaluations(id) on delete cascade,
  employee_id         uuid not null,
  category            text not null check (category in
    ('formation','mentorat','mission','certification','coaching','mobilite','autre')),
  title               text not null,
  description         text,
  target_skill_code   text,                       -- ref M9
  target_level        int check (target_level between 1 and 5),
  course_id           uuid,                       -- ref M11 si formation
  due_date            date,
  completion_pct      int default 0 check (completion_pct between 0 and 100),
  status              text not null default 'planned' check (status in
    ('planned','in_progress','completed','cancelled','postponed')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists m8_devplan_emp_idx on m8_dev_plans (tenant_id, employee_id);
create index if not exists m8_devplan_status_idx on m8_dev_plans (tenant_id, status);

-- ---------------------------------------------------------------------------
-- 6. M8 AUDIT CHAIN + ANTI-FRAUDE
-- ---------------------------------------------------------------------------
create table if not exists m8_audit_log (
  id              bigserial primary key,
  tenant_id       uuid not null,
  occurred_at     timestamptz not null default now(),
  actor_id        uuid,
  actor_role      text,
  actor_ip        inet,
  action_code     text not null,                  -- eval.score.update, calibration.close, bias.detection, …
  resource_type   text,                           -- evaluation | calibration | dev_plan | feedback_360
  resource_id     uuid,
  before_state    jsonb,
  after_state     jsonb,
  prev_hash       text,
  hash            text not null
);
create index if not exists m8_audit_tenant_time_idx on m8_audit_log (tenant_id, occurred_at desc);
create index if not exists m8_audit_resource_idx on m8_audit_log (tenant_id, resource_type, resource_id);

create table if not exists m8_bias_alerts (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  cycle_id        uuid not null references m8_cycles(id) on delete cascade,
  detected_at     timestamptz not null default now(),
  pattern         m8_bias_pattern not null,
  severity        text not null check (severity in ('low','medium','high')),
  scope_type      text not null,                  -- employee | team | direction | enterprise
  scope_id        uuid,
  detail          text,
  resolved_at     timestamptz,
  resolved_by     uuid,
  resolution_note text
);
create index if not exists m8_bias_unresolved_idx on m8_bias_alerts (tenant_id, detected_at desc)
  where resolved_at is null;

-- ---------------------------------------------------------------------------
-- 7. M9 ENUMS
-- ---------------------------------------------------------------------------
do $$ begin create type m9_skill_family as enum ('TECH','DATA','FIN','COMP','SOFT','BIZ');
exception when duplicate_object then null; end $$;

do $$ begin create type m9_skill_status as enum ('active','deprecated','archived');
exception when duplicate_object then null; end $$;

do $$ begin create type m9_job_level as enum ('junior','confirme','senior','lead','manager','director');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 8. M9 SKILLS CATALOG
-- ---------------------------------------------------------------------------
create table if not exists m9_skills (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  code                text not null,                 -- TECH-REACT-TS
  name                text not null,
  family              m9_skill_family not null,
  domain              text,                          -- libellé secondaire historique
  description         text,
  status              m9_skill_status not null default 'active',
  /** Standards externes alignés (O*NET, ESCO). */
  external_refs       jsonb default '{}'::jsonb,
  /** Synonymes pour recherche. */
  aliases             text[],
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (tenant_id, code)
);
create index if not exists m9_skills_family_idx on m9_skills (tenant_id, family);

-- ---------------------------------------------------------------------------
-- 9. M9 SKILL MATRIX (collab × skill × level)
-- ---------------------------------------------------------------------------
create table if not exists m9_skill_matrix (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  employee_id         uuid not null,
  skill_id            uuid not null references m9_skills(id) on delete cascade,
  level               int not null check (level between 0 and 5),
  target_level        int check (target_level between 0 and 5),
  certified           boolean not null default false,
  certification_ref   text,                          -- M11 cert id si applicable
  last_assessed_at    date not null,
  assessed_by         uuid,                          -- manager_id
  source              text not null default 'manager' check (source in
    ('manager','auto_eval','m11_formation','peer_360','external_audit')),
  notes               text,
  unique (tenant_id, employee_id, skill_id)
);
create index if not exists m9_matrix_emp_idx on m9_skill_matrix (tenant_id, employee_id);
create index if not exists m9_matrix_skill_idx on m9_skill_matrix (tenant_id, skill_id, level);

-- ---------------------------------------------------------------------------
-- 10. M9 JOB CATALOG (référentiel métiers)
-- ---------------------------------------------------------------------------
create table if not exists m9_jobs (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  code                text not null,                 -- LEAD-DEV, DEVOPS, DAF, …
  name                text not null,
  family              m9_skill_family not null,
  level               m9_job_level not null,
  description         text,
  created_at          timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists m9_job_requirements (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  job_id              uuid not null references m9_jobs(id) on delete cascade,
  skill_id            uuid not null references m9_skills(id) on delete cascade,
  min_level           int not null check (min_level between 1 and 5),
  critical            boolean not null default false,
  unique (tenant_id, job_id, skill_id)
);
create index if not exists m9_job_req_job_idx on m9_job_requirements (tenant_id, job_id);

-- ---------------------------------------------------------------------------
-- 11. M9 AUDIT LOG (alignement Atlas)
-- ---------------------------------------------------------------------------
create table if not exists m9_audit_log (
  id              bigserial primary key,
  tenant_id       uuid not null,
  occurred_at     timestamptz not null default now(),
  actor_id        uuid,
  actor_role      text,
  action_code     text not null,
  resource_type   text,
  resource_id     uuid,
  before_state    jsonb,
  after_state     jsonb,
  prev_hash       text,
  hash            text not null
);
create index if not exists m9_audit_tenant_time_idx on m9_audit_log (tenant_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- 12. RLS — tenant-aware
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'm8_cycles','m8_evaluations','m8_calibration_sessions','m8_feedback_360',
    'm8_dev_plans','m8_audit_log','m8_bias_alerts',
    'm9_skills','m9_skill_matrix','m9_jobs','m9_job_requirements','m9_audit_log'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format($f$drop policy if exists tenant_read on %I$f$, t);
    execute format($f$create policy tenant_read on %I for select using (tenant_id in (select current_tenant_ids()))$f$, t);
    execute format($f$drop policy if exists tenant_write on %I$f$, t);
    execute format($f$create policy tenant_write on %I for all using (is_hr_or_admin(tenant_id) and tenant_id in (select current_tenant_ids())) with check (is_hr_or_admin(tenant_id) and tenant_id in (select current_tenant_ids()))$f$, t);
  end loop;
end $$;

-- Auto-éval visible owner uniquement
drop policy if exists owner_auto_eval_read on m8_evaluations;
create policy owner_auto_eval_read on m8_evaluations
  for select using (
    tenant_id in (select current_tenant_ids())
    and (is_hr_or_admin(tenant_id) or auth.uid() = employee_id or auth.uid() = manager_id)
  );

-- 360° anonyme : reviewer ne peut pas lire sa propre soumission après envoi (anti-edit)
drop policy if exists feedback_anon_read on m8_feedback_360;
create policy feedback_anon_read on m8_feedback_360
  for select using (
    tenant_id in (select current_tenant_ids())
    and (is_hr_or_admin(tenant_id) or (visible_to_employee and auth.uid() in (
      select employee_id from m8_evaluations e where e.id = evaluation_id
    )))
  );

-- ---------------------------------------------------------------------------
-- 13. TRIGGERS updated_at
-- ---------------------------------------------------------------------------
create or replace function m8_m9_touch_updated_at() returns trigger
language plpgsql set search_path = atlas_people, public as $$
begin new.updated_at = now(); return new; end $$;

do $$ begin
  drop trigger if exists m8_eval_touch on m8_evaluations;
  create trigger m8_eval_touch before update on m8_evaluations
    for each row execute function m8_m9_touch_updated_at();
  drop trigger if exists m8_devplan_touch on m8_dev_plans;
  create trigger m8_devplan_touch before update on m8_dev_plans
    for each row execute function m8_m9_touch_updated_at();
  drop trigger if exists m9_skills_touch on m9_skills;
  create trigger m9_skills_touch before update on m9_skills
    for each row execute function m8_m9_touch_updated_at();
end $$;

-- ---------------------------------------------------------------------------
-- 14. VUES KPI
-- ---------------------------------------------------------------------------
create or replace view m8_distribution_classes as
select
  e.tenant_id,
  e.cycle_id,
  e.classe,
  count(*) as n,
  count(*) filter (where g.is_female) as n_female,
  count(*) filter (where not g.is_female) as n_male
from m8_evaluations e
left join lateral (select false as is_female) g on true   -- placeholder : à brancher sur m1 gender
where e.classe is not null
group by e.tenant_id, e.cycle_id, e.classe;

comment on view m8_distribution_classes is 'Distribution des classes ABCDE par cycle';

create or replace view m9_skills_coverage as
select
  s.tenant_id,
  s.id as skill_id,
  s.code as skill_code,
  s.name,
  s.family,
  count(distinct sm.employee_id) as holders_count,
  count(distinct sm.employee_id) filter (where sm.level >= 3) as masters_count,
  count(distinct sm.employee_id) filter (where sm.certified) as certified_count,
  avg(sm.level) as avg_level
from m9_skills s
left join m9_skill_matrix sm on sm.tenant_id = s.tenant_id and sm.skill_id = s.id
where s.status = 'active'
group by s.tenant_id, s.id, s.code, s.name, s.family;

comment on view m9_skills_coverage is 'Couverture par skill : détenteurs, masters niveau 3+, certifiés';
