-- ════════════════════════════════════════════════════════════════════
-- 0035 — Tables manquantes M9 / M10 / M11 (audit C-7 / M-2 / M-3 / M-4)
--
-- Ces tables sont requises par supabaseLive.ts (M9/M10/M11) mais absentes
-- des migrations existantes (0026–0030 ne les définissent pas).
-- Sans ces tables, les cockpits crashent au premier rendu avec backend.
-- Toutes les instructions sont idempotentes (IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- M9 — Compétences : PDC, certifications, patterns, anti-discrim
-- ────────────────────────────────────────────────────────────────────

create table if not exists atlas_people.m9_pdc (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null,
  employee_id   uuid not null,
  title         text not null default '',
  status        text not null default 'draft'
    check (status in ('draft','active','completed','abandoned')),
  signed_at     timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_m9_pdc_tenant on atlas_people.m9_pdc(tenant_id, employee_id);

create table if not exists atlas_people.m9_pdc_actions (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null,
  pdc_id     uuid not null references atlas_people.m9_pdc(id) on delete cascade,
  title      text not null,
  status     text not null default 'todo'
    check (status in ('todo','in_progress','done','cancelled')),
  due_date   date,
  created_at timestamptz default now()
);
create index if not exists idx_m9_pdc_actions_tenant on atlas_people.m9_pdc_actions(tenant_id);

create table if not exists atlas_people.m9_certifications_catalog (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null,
  name         text not null,
  provider     text,
  validity_months integer default 24,
  is_active    boolean not null default true,
  created_at   timestamptz default now()
);
create index if not exists idx_m9_certcat_tenant on atlas_people.m9_certifications_catalog(tenant_id);

create table if not exists atlas_people.m9_certifications_employees (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null,
  employee_id    uuid not null,
  certification_id uuid references atlas_people.m9_certifications_catalog(id),
  status         text not null default 'in_progress'
    check (status in ('in_progress','obtained','expired','cancelled')),
  obtained_at    date,
  expires_at     date,
  created_at     timestamptz default now()
);
create index if not exists idx_m9_certemp_tenant on atlas_people.m9_certifications_employees(tenant_id, employee_id);

create table if not exists atlas_people.m9_suspicious_patterns (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null,
  pattern_type text not null,
  severity    text not null default 'medium'
    check (severity in ('low','medium','high','critical')),
  status      text not null default 'open'
    check (status in ('open','investigating','closed','false_positive')),
  detected_at timestamptz default now(),
  created_at  timestamptz default now()
);
create index if not exists idx_m9_patterns_tenant on atlas_people.m9_suspicious_patterns(tenant_id, severity);

create table if not exists atlas_people.m9_anti_discrim_alerts (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null,
  alert_type  text not null,
  axis        text not null,
  status      text not null default 'open'
    check (status in ('open','under_review','resolved','dismissed')),
  created_at  timestamptz default now()
);
create index if not exists idx_m9_discrim_tenant on atlas_people.m9_anti_discrim_alerts(tenant_id, status);

-- ────────────────────────────────────────────────────────────────────
-- M10 — Carrières : talent pools, promotions (si absentes de 0027)
-- ────────────────────────────────────────────────────────────────────

create table if not exists atlas_people.m10_talent_pools (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  name            text not null,
  description     text,
  pool_type       text not null default 'strategic',
  annual_budget   bigint default 0,
  members_count   integer default 0,
  is_active       boolean not null default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists idx_m10_pools_tenant on atlas_people.m10_talent_pools(tenant_id);

create table if not exists atlas_people.m10_promotions (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  employee_id     uuid not null,
  from_role       text,
  to_role         text,
  from_grade      text,
  to_grade        text,
  effective_date  date,
  salary_increase bigint default 0,
  status          text not null default 'planned'
    check (status in ('planned','approved','effective','cancelled')),
  created_at      timestamptz default now()
);
create index if not exists idx_m10_promotions_tenant on atlas_people.m10_promotions(tenant_id, status);

-- ────────────────────────────────────────────────────────────────────
-- M11 — Formation : parcours, enrollments, PIF, LMS, badges, formateurs
-- (si absentes de 0030 qui ne contenait que des ENUMs)
-- ────────────────────────────────────────────────────────────────────

create table if not exists atlas_people.m11_parcours (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null,
  title         text not null,
  description   text,
  duration_hours integer default 0,
  modality      text default 'mixte',
  active        boolean not null default true,
  target_role   text,
  budget        bigint default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_m11_parcours_tenant on atlas_people.m11_parcours(tenant_id);

create table if not exists atlas_people.m11_parcours_enrollments (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null,
  parcours_id   uuid references atlas_people.m11_parcours(id) on delete cascade,
  employee_id   uuid not null,
  status        text not null default 'enrolled'
    check (status in ('enrolled','in_progress','completed','dropped')),
  progress_pct  integer default 0 check (progress_pct between 0 and 100),
  enrolled_at   timestamptz default now(),
  completed_at  timestamptz
);
create index if not exists idx_m11_enroll_tenant on atlas_people.m11_parcours_enrollments(tenant_id, status);

create table if not exists atlas_people.m11_pif (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null,
  employee_id          uuid not null,
  period_year          integer not null,
  status               text not null default 'draft'
    check (status in ('draft','validated','completed','archived')),
  budget_individual    bigint default 0,
  budget_consumed      bigint default 0,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);
create index if not exists idx_m11_pif_tenant on atlas_people.m11_pif(tenant_id, period_year);

create table if not exists atlas_people.m11_lms_progress (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null,
  employee_id   uuid not null,
  course_id     text not null,
  course_title  text,
  status        text not null default 'not_started'
    check (status in ('not_started','in_progress','completed','failed')),
  score         integer,
  completed_at  timestamptz,
  created_at    timestamptz default now()
);
create index if not exists idx_m11_lms_tenant on atlas_people.m11_lms_progress(tenant_id, employee_id);

create table if not exists atlas_people.m11_badge_attributions (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null,
  employee_id   uuid not null,
  badge_type    text not null,
  badge_label   text not null,
  awarded_at    timestamptz default now(),
  source        text
);
create index if not exists idx_m11_badges_tenant on atlas_people.m11_badge_attributions(tenant_id, employee_id);

create table if not exists atlas_people.m11_formateurs (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null,
  name          text not null,
  email         text,
  speciality    text,
  type          text not null default 'interne'
    check (type in ('interne','externe','e-learning')),
  active        boolean not null default true,
  sessions_count integer default 0,
  rating        numeric(3,1) default 0,
  created_at    timestamptz default now()
);
create index if not exists idx_m11_formateurs_tenant on atlas_people.m11_formateurs(tenant_id);

create table if not exists atlas_people.m11_suspicious_patterns (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null,
  pattern_type text not null,
  severity     text not null default 'medium'
    check (severity in ('low','medium','high','critical')),
  status       text not null default 'open'
    check (status in ('open','investigating','closed','false_positive')),
  detected_at  timestamptz default now()
);
create index if not exists idx_m11_patterns_tenant on atlas_people.m11_suspicious_patterns(tenant_id, severity);

-- ────────────────────────────────────────────────────────────────────
-- RLS sur toutes les nouvelles tables
-- Lecture : tout membre du tenant
-- Écriture : hr / admin
-- ────────────────────────────────────────────────────────────────────

do $$
declare
  tname text;
  tables text[] := array[
    'm9_pdc','m9_pdc_actions','m9_certifications_catalog','m9_certifications_employees',
    'm9_suspicious_patterns','m9_anti_discrim_alerts',
    'm10_talent_pools','m10_promotions',
    'm11_parcours','m11_parcours_enrollments','m11_pif','m11_lms_progress',
    'm11_badge_attributions','m11_formateurs','m11_suspicious_patterns'
  ];
begin
  foreach tname in array tables loop
    execute format('alter table atlas_people.%I enable row level security', tname);

    execute format(
      'drop policy if exists %I_select on atlas_people.%I; '||
      'create policy %I_select on atlas_people.%I for select '||
      'using (tenant_id in (select t from atlas_people.current_tenant_ids() t))',
      tname, tname, tname, tname
    );

    execute format(
      'drop policy if exists %I_write on atlas_people.%I; '||
      'create policy %I_write on atlas_people.%I for all '||
      'using (atlas_people.is_hr_or_admin(tenant_id)) '||
      'with check (atlas_people.is_hr_or_admin(tenant_id))',
      tname, tname, tname, tname
    );
  end loop;
end; $$;
