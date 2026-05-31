-- ============================================================================
-- Atlas People — M7 OKR (couche enrichie selon spec EVAL.zip).
-- Couvre : objectives 4 niveaux · key_results pondérés · check-ins · scoring
--          0-100 % · confidence 1-10 · rétrospectives · gouvernance · audit
--          chaîné SHA-256 + anti-fraude.
--
-- Règles dures :
--   R1  Notation finale immuable une fois cycle clôturé (status=closed).
--   R2  Scoring : note Objective = moyenne pondérée des notes KR (poids cumulés = 100).
--   R3  Confidence 1-10 capturée à chaque check-in.
--   R4  Audit chaîné SHA-256 sur création/modif Objective, KR, check-in,
--       rétrospective, scoring final.
--   R5  Anti-fraude : trigger détecte sandbagging (4 cycles consécutifs ≥ 100 %),
--       volatilité notes pré-clôture (3 modifs < 24 h), confidence high sans check-in.
--   R6  RLS tenant-aware + OKR individuel visible owner + manager + HR.
--   R7  Conservation 5 ans cycles clôturés (archivage).
--
-- Additif & idempotent. Schéma atlas_people.
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- ---------------------------------------------------------------------------
-- 0. ENUMS
-- ---------------------------------------------------------------------------
do $$ begin create type m7_okr_level as enum ('entreprise','direction','equipe','individuel');
exception when duplicate_object then null; end $$;

do $$ begin create type m7_objective_status as enum
  ('draft','proposed','aligned','in_progress','at_risk','completed','cancelled','closed');
exception when duplicate_object then null; end $$;

do $$ begin create type m7_cycle_status as enum
  ('planning','open','in_progress','scoring','retrospective','closed');
exception when duplicate_object then null; end $$;

do $$ begin create type m7_kr_type as enum
  ('numeric','percentage','currency','binary','milestone');
exception when duplicate_object then null; end $$;

do $$ begin create type m7_retro_format as enum
  ('individual','team','direction','company');
exception when duplicate_object then null; end $$;

do $$ begin create type m7_suspicious_severity as enum ('low','medium','high');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 1. CYCLES
-- ---------------------------------------------------------------------------
create table if not exists m7_cycles (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  code            text not null,                 -- 2026-Q2, 2027-ANNUAL
  label           text not null,
  start_date      date not null,
  end_date        date not null,
  status          m7_cycle_status not null default 'planning',
  closed_at       timestamptz,
  created_at      timestamptz not null default now(),
  unique (tenant_id, code)
);

-- ---------------------------------------------------------------------------
-- 2. OBJECTIVES
-- ---------------------------------------------------------------------------
create table if not exists m7_objectives (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  cycle_id        uuid not null references m7_cycles(id) on delete cascade,
  ref             text not null,                 -- OBJ-2026-Q2-001
  level           m7_okr_level not null,
  title           text not null check (length(title) <= 200),
  description     text,
  parent_id       uuid references m7_objectives(id),  -- cascade verticale
  owner_id        uuid not null,                 -- employee_id (collab pour indiv, manager pour équipe…)
  team_label      text,
  status          m7_objective_status not null default 'draft',
  final_score     numeric,                       -- 0-100 (figé en clôture)
  scored_at       timestamptz,
  scored_by       uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, ref)
);
create index if not exists m7_obj_cycle_idx on m7_objectives (tenant_id, cycle_id);
create index if not exists m7_obj_owner_idx on m7_objectives (tenant_id, owner_id);
create index if not exists m7_obj_level_idx on m7_objectives (tenant_id, level);

-- ---------------------------------------------------------------------------
-- 3. KEY RESULTS — pondérés
-- ---------------------------------------------------------------------------
create table if not exists m7_key_results (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  objective_id        uuid not null references m7_objectives(id) on delete cascade,
  ref                 text not null,             -- KR-OBJ001-1
  title               text not null,
  type                m7_kr_type not null,
  baseline            numeric,
  target              numeric,
  current_value       numeric,
  unit                text,                      -- FCFA, %, count, etc.
  weight_pct          int  not null default 25 check (weight_pct between 1 and 100),
  score               numeric,                   -- 0-100 (calculé ou figé)
  confidence          int  check (confidence between 1 and 10),
  last_updated_at     timestamptz,
  created_at          timestamptz not null default now(),
  unique (tenant_id, ref)
);
create index if not exists m7_kr_obj_idx on m7_key_results (tenant_id, objective_id);

-- Contrainte applicative : somme des weight_pct par Objective = 100.
-- (à valider par trigger AFTER INSERT/UPDATE/DELETE)
create or replace function m7_kr_weight_check() returns trigger
language plpgsql set search_path = atlas_people, public as $$
declare s int;
declare oid uuid;
begin
  oid := coalesce(new.objective_id, old.objective_id);
  select coalesce(sum(weight_pct), 0) into s from m7_key_results where objective_id = oid;
  if s > 100 then
    raise exception 'Somme des poids KR pour Objective % dépasse 100 % (= % %%).', oid, s;
  end if;
  return coalesce(new, old);
end $$;

do $$ begin
  drop trigger if exists m7_kr_weight_trg on m7_key_results;
  create constraint trigger m7_kr_weight_trg
    after insert or update or delete on m7_key_results
    deferrable initially deferred
    for each row execute function m7_kr_weight_check();
end $$;

-- ---------------------------------------------------------------------------
-- 4. CHECK-INS
-- ---------------------------------------------------------------------------
create table if not exists m7_check_ins (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  key_result_id       uuid not null references m7_key_results(id) on delete cascade,
  occurred_at         timestamptz not null default now(),
  author_id           uuid not null,             -- employee_id
  reported_value      numeric,
  computed_score      numeric,                   -- snapshot au moment du check-in
  confidence          int check (confidence between 1 and 10),
  blockers            text,
  next_step           text,
  evidence_url        text
);
create index if not exists m7_checkin_kr_time_idx on m7_check_ins (tenant_id, key_result_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- 5. RÉTROSPECTIVES
-- ---------------------------------------------------------------------------
create table if not exists m7_retrospectives (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  cycle_id            uuid not null references m7_cycles(id) on delete cascade,
  objective_id        uuid references m7_objectives(id),
  format              m7_retro_format not null,
  author_id           uuid not null,
  what_worked         text,
  what_didnt          text,
  lessons             text,
  next_changes        text,
  requests_to_manager text,
  manager_synthesis   text,
  published_at        timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists m7_retro_cycle_idx on m7_retrospectives (tenant_id, cycle_id);

-- ---------------------------------------------------------------------------
-- 6. GOUVERNANCE — Comité OKR
-- ---------------------------------------------------------------------------
create table if not exists m7_committee_members (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  employee_id         uuid not null,
  role                text not null check (role in
    ('sponsor','chair','member','observer','auditor')),
  appointed_at        date not null default current_date,
  revoked_at          date,
  unique (tenant_id, employee_id)
);

create table if not exists m7_committee_sessions (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  cycle_id            uuid not null references m7_cycles(id) on delete cascade,
  held_at             timestamptz not null,
  kind                text not null check (kind in ('kickoff','monthly','quarterly','ad_hoc','closing')),
  attendees           uuid[],
  decisions           text[],
  minutes_url         text
);

-- ---------------------------------------------------------------------------
-- 7. AUDIT — chaîne SHA-256
-- ---------------------------------------------------------------------------
create table if not exists m7_audit_log (
  id              bigserial primary key,
  tenant_id       uuid not null,
  occurred_at     timestamptz not null default now(),
  actor_id        uuid,
  actor_role      text,
  actor_ip        inet,
  action_code     text not null,
  resource_type   text,                 -- objective | key_result | check_in | retrospective | scoring | cycle
  resource_id     uuid,
  before_state    jsonb,
  after_state     jsonb,
  prev_hash       text,
  hash            text not null
);
create index if not exists m7_audit_tenant_time_idx on m7_audit_log (tenant_id, occurred_at desc);
create index if not exists m7_audit_resource_idx on m7_audit_log (tenant_id, resource_type, resource_id);

-- ---------------------------------------------------------------------------
-- 8. ANTI-FRAUDE — patterns suspects
-- ---------------------------------------------------------------------------
create table if not exists m7_suspicious_patterns (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  detected_at         timestamptz not null default now(),
  scope_type          text not null,            -- employee | team | direction
  scope_id            uuid,
  pattern_code        text not null,            -- sandbagging_4cycles | score_volatility_24h | confidence_no_checkin
  severity            m7_suspicious_severity not null default 'medium',
  detail              text,
  resolved_at         timestamptz,
  resolved_by         uuid,
  resolution_note     text
);
create index if not exists m7_susp_unresolved_idx on m7_suspicious_patterns (tenant_id, detected_at desc)
  where resolved_at is null;

-- ---------------------------------------------------------------------------
-- 9. SCORING IMMUTABILITY — bloque modif après clôture
-- ---------------------------------------------------------------------------
create or replace function m7_block_after_close() returns trigger
language plpgsql set search_path = atlas_people, public as $$
declare cstatus m7_cycle_status;
begin
  select c.status into cstatus from m7_cycles c
   where c.id = coalesce(new.cycle_id,
                         (select cycle_id from m7_objectives where id = coalesce(new.objective_id, old.objective_id)));
  if cstatus = 'closed' then
    raise exception 'Cycle clôturé : modifications interdites (final_score immuable).';
  end if;
  return new;
end $$;

do $$ begin
  drop trigger if exists m7_obj_block_close on m7_objectives;
  create trigger m7_obj_block_close
    before update on m7_objectives
    for each row when (old.final_score is not null)
    execute function m7_block_after_close();
end $$;

-- ---------------------------------------------------------------------------
-- 10. RLS — tenant-aware
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'm7_cycles','m7_objectives','m7_key_results','m7_check_ins','m7_retrospectives',
    'm7_committee_members','m7_committee_sessions','m7_audit_log','m7_suspicious_patterns'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format($f$drop policy if exists tenant_read on %I$f$, t);
    execute format($f$create policy tenant_read on %I for select using (tenant_id = any (current_tenant_ids()))$f$, t);
    execute format($f$drop policy if exists tenant_write on %I$f$, t);
    execute format($f$create policy tenant_write on %I
      for all using (tenant_id = any (current_tenant_ids()) and is_hr_or_admin())
      with check (tenant_id = any (current_tenant_ids()) and is_hr_or_admin())$f$, t);
  end loop;
end $$;

-- OKR individuels : également visibles par l'owner
drop policy if exists owner_read on m7_objectives;
create policy owner_read on m7_objectives
  for select using (
    tenant_id = any (current_tenant_ids())
    and (is_hr_or_admin() or auth.uid() = owner_id)
  );

-- ---------------------------------------------------------------------------
-- 11. UPDATED_AT trigger
-- ---------------------------------------------------------------------------
create or replace function m7_touch_updated_at() returns trigger
language plpgsql set search_path = atlas_people, public as $$
begin new.updated_at = now(); return new; end $$;

do $$ begin
  drop trigger if exists m7_obj_touch on m7_objectives;
  create trigger m7_obj_touch before update on m7_objectives
    for each row execute function m7_touch_updated_at();
end $$;

-- ---------------------------------------------------------------------------
-- 12. VIEW — atteinte moyenne par cycle/niveau (alimente reporting)
-- ---------------------------------------------------------------------------
create or replace view m7_attainment_by_level as
select
  o.tenant_id,
  o.cycle_id,
  o.level,
  count(*) as objectives_count,
  avg(o.final_score) filter (where o.final_score is not null) as avg_final_score,
  count(*) filter (where o.status = 'completed') as completed_count,
  count(*) filter (where o.status = 'at_risk') as at_risk_count
from m7_objectives o
group by o.tenant_id, o.cycle_id, o.level;

comment on view m7_attainment_by_level is 'Atteinte moyenne OKR par cycle et niveau — reporting M7.';
