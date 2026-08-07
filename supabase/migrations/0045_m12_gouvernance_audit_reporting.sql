-- ============================================================================
-- Atlas People — M12 Complémentaire : gouvernance · audit enrichi · reporting.
-- Réf. CDC 14_GOUVERNANCE_M12 · 15_REPORTING_M12 · 16_AUDIT_M12.
--
-- Crée :
--   • m12_medical_access_log (TABLE SAINTE — RLS INSERT only)
--   • m12_audit_log : colonnes manquantes (ALTER safe)
--   • m12_gouvernance_comites + reunions
--   • m12_gouvernance_politique_tenant + versions
--   • m12_gouvernance_escalades_config + historique
--   • m12_suspicious_patterns
--   • m12_kpi_snapshots
--
-- Idempotent · Schéma atlas_people.
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- ---------------------------------------------------------------------------
-- 1. m12_medical_access_log — TABLE SAINTE (secret médical absolu)
--    Conservation 30 ans · RLS INSERT-only · aucune UPDATE/DELETE.
-- ---------------------------------------------------------------------------
create table if not exists m12_medical_access_log (
  id                        bigserial primary key,
  tenant_id                 uuid not null,
  accessed_at               timestamptz not null default now(),
  accessor_id               uuid not null,
  accessor_role             text not null default 'rh_admin',
  accessor_ip               inet,
  patient_employee_id       uuid not null,
  resource_type             text not null default 'medical_visit',
  resource_id               uuid,
  access_reason             text,
  access_duration_seconds   int,
  data_modified             boolean not null default false,
  -- hash nullable : chaîne SHA-256 complétée par EF verify-m12-audit-chain
  -- en prod; null acceptable depuis le front pour scheduling simple.
  hash                      text
);

create index if not exists m12_mal_tenant_time_idx on m12_medical_access_log (tenant_id, accessed_at desc);
create index if not exists m12_mal_patient_idx on m12_medical_access_log (patient_employee_id);
create index if not exists m12_mal_accessor_idx on m12_medical_access_log (accessor_id);

-- RLS : INSERT uniquement — pas de UPDATE/DELETE (table SAINTE)
alter table m12_medical_access_log enable row level security;
drop policy if exists medical_log_insert on m12_medical_access_log;
create policy medical_log_insert on m12_medical_access_log
  for insert with check (tenant_id = any (current_tenant_ids()));
drop policy if exists medical_log_select on m12_medical_access_log;
create policy medical_log_select on m12_medical_access_log
  for select using (
    tenant_id = any (current_tenant_ids())
    and is_hr_or_admin()
  );
-- Aucune policy UPDATE/DELETE → bloquées par RLS (règle R9 secret médical)

-- ---------------------------------------------------------------------------
-- 2. m12_audit_log — colonnes complémentaires CDC §16 (ALTER safe)
-- ---------------------------------------------------------------------------
alter table m12_audit_log
  add column if not exists actor_type               text,
  add column if not exists actor_device_fingerprint text,
  add column if not exists action_category          text,
  add column if not exists metadata                 jsonb,
  add column if not exists employee_id              uuid,
  add column if not exists site_id                  uuid,
  add column if not exists is_medical_data          boolean not null default false,
  add column if not exists medical_access_reason    text,
  add column if not exists amount_concerned         numeric(18,2),
  add column if not exists cnps_dossier_ref         text,
  add column if not exists retention_until          date,
  add column if not exists rgpd_classification      text,
  add column if not exists legal_sensitivity        text;

create index if not exists m12_audit_medical_flag_idx on m12_audit_log (is_medical_data)
  where is_medical_data = true;
create index if not exists m12_audit_employee_idx on m12_audit_log (employee_id)
  where employee_id is not null;

-- ---------------------------------------------------------------------------
-- 3. GOUVERNANCE — Comités & réunions
-- ---------------------------------------------------------------------------
do $$ begin
  create type m12_comite_type as enum ('CHSCT', 'ComiteHSE', 'ComiteDirection');
exception when duplicate_object then null; end $$;

do $$ begin
  create type m12_comite_frequence as enum ('mensuel', 'trimestriel', 'annuel');
exception when duplicate_object then null; end $$;

do $$ begin
  create type m12_reunion_status as enum ('planned', 'held', 'cancelled', 'postponed');
exception when duplicate_object then null; end $$;

create table if not exists m12_gouvernance_comites (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null,
  type        m12_comite_type not null,
  label       text not null,
  frequence   m12_comite_frequence not null,
  actif       boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (tenant_id, type)
);

create table if not exists m12_gouvernance_comites_reunions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null,
  comite_id   uuid not null references m12_gouvernance_comites(id) on delete cascade,
  ref         text not null,
  planned_at  date not null,
  held_at     date,
  status      m12_reunion_status not null default 'planned',
  odj         text[],
  actions     jsonb default '[]'::jsonb,
  pv_url      text,
  created_at  timestamptz not null default now(),
  unique (tenant_id, ref)
);
create index if not exists m12_reunions_comite_idx on m12_gouvernance_comites_reunions (tenant_id, comite_id);
create index if not exists m12_reunions_date_idx on m12_gouvernance_comites_reunions (tenant_id, planned_at);

-- ---------------------------------------------------------------------------
-- 4. GOUVERNANCE — Politique tenant (config par entité)
-- ---------------------------------------------------------------------------
create table if not exists m12_gouvernance_politique_tenant (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null unique,
  country_code                char(2) not null default 'CI',
  code_travail_ref            text not null default 'CI_2015',
  organisme_secu              text not null default 'CNPS_CI',
  delai_visite_embauche_days  int not null default 8,
  delai_visite_reprise_days   int not null default 21,
  periodicite_visite_months   int not null default 12,
  delai_at_declaration_hours  int not null default 48,
  chsct_seuil_effectif        int not null default 50,
  maintien_salaire_100_atmp   boolean not null default true,
  subrogation_active          boolean not null default true,
  budget_hse_pct_ms           numeric not null default 1.2,
  anonymisation_aggregations  boolean not null default true,
  conservation_medical_years  int not null default 30,
  current_version             int not null default 1,
  updated_at                  timestamptz not null default now()
);

create table if not exists m12_gouvernance_politique_versions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null,
  version     int not null,
  snapshot    jsonb not null,
  changed_by  uuid not null,
  changed_at  timestamptz not null default now(),
  unique (tenant_id, version)
);
create index if not exists m12_politique_versions_idx on m12_gouvernance_politique_versions (tenant_id, version desc);

-- ---------------------------------------------------------------------------
-- 5. GOUVERNANCE — Escalades
-- ---------------------------------------------------------------------------
create table if not exists m12_gouvernance_escalades_config (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  event_type      text not null,
  severity        text not null check (severity in ('immediate', 'urgence_4h', 'standard_24h', 'alerte')),
  recipients      text[] not null default '{}',
  delay_hours     numeric not null default 24,
  immediate       boolean not null default false,
  active          boolean not null default true,
  unique (tenant_id, event_type)
);

create table if not exists m12_gouvernance_escalades_historique (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  config_id       uuid references m12_gouvernance_escalades_config(id),
  event_type      text not null,
  triggered_at    timestamptz not null default now(),
  triggered_by    uuid,
  recipients      text[],
  payload         jsonb,
  status          text not null default 'sent' check (status in ('sent', 'failed', 'ack'))
);
create index if not exists m12_escalades_hist_idx on m12_gouvernance_escalades_historique (tenant_id, triggered_at desc);

-- ---------------------------------------------------------------------------
-- 6. ANTI-FRAUDE — Patterns suspects
-- ---------------------------------------------------------------------------
create table if not exists m12_suspicious_patterns (
  id                            uuid primary key default gen_random_uuid(),
  tenant_id                     uuid not null,
  pattern_code                  text not null,
  detected_at                   timestamptz not null default now(),
  related_user_id               uuid,
  related_at_id                 uuid references m12_work_incidents(id),
  related_cnps_dossier_id       uuid,
  related_duer_id               uuid references m12_risks(id),
  severity                      text not null check (severity in ('critical', 'high', 'medium', 'low')),
  amount_concerned              numeric(18,2),
  pattern_data                  jsonb,
  evidence_audit_log_ids        bigint[],
  status                        text not null default 'open'
    check (status in ('open', 'investigating', 'resolved', 'false_positive')),
  assigned_to                   uuid,
  investigation_notes           text,
  resolution_action             text,
  resolved_at                   timestamptz,
  medical_confidentiality_breach boolean not null default false,
  penal_implications            boolean not null default false,
  cnps_implications             boolean not null default false,
  rgpd_implications             boolean not null default false,
  faute_inexcusable_potentielle boolean not null default false,
  juriste_notified              boolean not null default false,
  dg_notified                   boolean not null default false,
  legal_implications            text,
  created_at                    timestamptz not null default now()
);
create index if not exists m12_suspicious_tenant_idx on m12_suspicious_patterns (tenant_id, detected_at desc);
create index if not exists m12_suspicious_status_idx on m12_suspicious_patterns (tenant_id, status);
create index if not exists m12_suspicious_severity_idx on m12_suspicious_patterns (tenant_id, severity)
  where status = 'open';

-- ---------------------------------------------------------------------------
-- 7. REPORTING — Snapshots KPI mensuels
-- ---------------------------------------------------------------------------
create table if not exists m12_kpi_snapshots (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  period              text not null,         -- 2026-06
  tf1                 numeric,               -- taux fréquence AT avec arrêt
  tf2                 numeric,               -- taux fréquence tous AT
  tg                  numeric,               -- taux gravité
  ig                  numeric,               -- indice gravité
  conformite_score    int,
  at_count            int not null default 0,
  mp_count            int not null default 0,
  jours_arret         int not null default 0,
  visites_taux_pct    numeric,
  epi_conformite_pct  numeric,
  budget_hse          bigint,
  heures_travaillees  bigint,
  computed_at         timestamptz not null default now(),
  unique (tenant_id, period)
);
create index if not exists m12_kpi_snap_tenant_idx on m12_kpi_snapshots (tenant_id, period desc);

-- ---------------------------------------------------------------------------
-- 8. RLS — nouvelles tables gouvernance
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'm12_gouvernance_comites', 'm12_gouvernance_comites_reunions',
    'm12_gouvernance_politique_tenant', 'm12_gouvernance_politique_versions',
    'm12_gouvernance_escalades_config', 'm12_gouvernance_escalades_historique',
    'm12_suspicious_patterns', 'm12_kpi_snapshots'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format($f$drop policy if exists tenant_read on %I$f$, t);
    execute format($f$create policy tenant_read on %I for select
      using (tenant_id = any (current_tenant_ids()))$f$, t);
    execute format($f$drop policy if exists tenant_write on %I$f$, t);
    execute format($f$create policy tenant_write on %I
      for all using (tenant_id = any (current_tenant_ids()) and is_hr_or_admin())
      with check (tenant_id = any (current_tenant_ids()) and is_hr_or_admin())$f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 9. Vue reporting complémentaire (TF/TG)
-- ---------------------------------------------------------------------------
create or replace view m12_kpi_reporting as
select
  wi.tenant_id,
  date_trunc('month', wi.occurred_at) as mois,
  count(*) as total_incidents,
  count(*) filter (where wi.type = 'AT') as at_count,
  count(*) filter (where wi.type = 'MP') as mp_count,
  count(*) filter (where wi.severity in ('grave', 'tres_grave', 'mortel')) as incidents_graves,
  sum(wi.workdays_lost) as total_jours_arret
from m12_work_incidents wi
group by wi.tenant_id, date_trunc('month', wi.occurred_at);

comment on view m12_kpi_reporting is 'KPI mensuel AT/MP M12 — utilisé par /conformite/reporting';
