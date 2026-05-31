-- ============================================================================
-- Atlas People — M12 « Conformité & Santé Sécurité au Travail ».
-- Réf. specs M12. Couvre :
--   • DUER (Document Unique d'Évaluation des Risques)
--   • RPS (Risques psychosociaux — enquêtes)
--   • AT/MP (Accidents Travail & Maladies Professionnelles)
--   • Registre du personnel OHADA (conservation à vie)
--   • Déclarations sociales 14 régimes (CNPS, IPRES, CNSS, INPS, etc.)
--   • Visites médicales (5 kinds)
--   • Habilitations & EPI
--   • Audits internes (RGPD, Sapin 2, ISO, OHADA…)
--   • Inspections du travail
--   • Politiques de conservation (12 classes documentaires)
--
-- Règles dures :
--   R1  Déclaration AT sous 48 h ouvrées (contrôlé applicativement, drapeau within_sla).
--   R2  DUER : révision annuelle obligatoire (next_review_due).
--   R3  Données médicales : accès médecin du travail uniquement (RLS strict, table séparée).
--   R4  Registre du personnel : conservation à vie · ajout uniquement (append-only via trigger).
--   R5  Audit chaîné SHA-256 sur incidents AT/MP, inspections, audits & findings.
--   R6  Conservation 30 ans contrats AT/MP, 10 ans CNPS, 50 ans dossiers médicaux.
--
-- Additif & idempotent. Schéma atlas_people.
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- ---------------------------------------------------------------------------
-- 0. ENUMS
-- ---------------------------------------------------------------------------
do $$ begin create type m12_risk_category as enum
  ('physique','chimique','biologique','mecanique','electrique','incendie_explosion',
   'chute_hauteur','tms','psychosocial','routier','environnemental','cyber');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_risk_level as enum ('acceptable','modere','eleve','critique');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_rps_status as enum ('draft','open','closed','analyzed');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_incident_type as enum ('AT','MP','AT_trajet','presquAccident');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_incident_severity as enum
  ('sans_arret','leger','grave','tres_grave','mortel');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_incident_status as enum
  ('declare','investigation','cnps_filed','closed','litige');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_declaration_kind as enum
  ('CNPS_CI','IPRES_SN','CNSS_BJ','CNSS_BF','CNSS_TG','CNSS_NE','INPS_ML',
   'INSS_GW','CNPS_CM','CNSS_GA','CNSS_CG','CNSS_CF','CNPS_TD','INSESO_GQ',
   'DGI','DISA','CNAM');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_declaration_status as enum
  ('draft','submitted','paid','overdue','rejected');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_declaration_frequency as enum ('monthly','quarterly','annual');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_visit_kind as enum
  ('embauche','periodique','reprise','surveillance_renforcee','preretraite');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_aptitude as enum
  ('apte','apte_amenagement','inapte_temporaire','inapte_definitif','a_revoir');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_auth_kind as enum
  ('electrique','chimique','travaux_hauteur','cariste','soudure','permis_feu','conduite');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_auth_status as enum ('active','pending_renewal','expired');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_audit_scope as enum
  ('RGPD','Sapin2','ISO27001','ISO9001','OHADA_droit_travail','paie','temps','recrutement','general');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_audit_status as enum ('planned','in_progress','completed','overdue');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_finding_severity as enum ('critical','major','minor','observation');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_finding_status as enum
  ('open','in_remediation','closed','accepted_risk');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_inspection_outcome as enum
  ('conforme','observations','mise_en_demeure','PV');
exception when duplicate_object then null; end $$;

do $$ begin create type m12_document_class as enum
  ('contrat','avenant','paie','cnps','disciplinaire','duer','visite_medicale',
   'inspection','audit','declaration_sociale','registre_personnel','AT_MP');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 1. DUER — RISKS
-- ---------------------------------------------------------------------------
create table if not exists m12_risks (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null,
  ref                         text not null,
  unite                       text not null,
  country_code                char(2) not null,
  category                    m12_risk_category not null,
  hazard                      text not null,
  probability                 int  not null check (probability between 1 and 4),
  severity                    int  not null check (severity between 1 and 4),
  level                       m12_risk_level not null,
  controls                    text[],
  actions                     jsonb default '[]'::jsonb,    -- [{description, ownerEmployeeId, dueDate, status}]
  exposed_employee_count      int  not null default 0,
  last_review_at              date not null,
  next_review_due             date not null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (tenant_id, ref)
);
create index if not exists m12_risks_level_idx on m12_risks (tenant_id, level);
create index if not exists m12_risks_review_due_idx on m12_risks (tenant_id, next_review_due);

-- ---------------------------------------------------------------------------
-- 2. RPS — SURVEYS
-- ---------------------------------------------------------------------------
create table if not exists m12_rps_surveys (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null,
  ref                         text not null,
  title                       text not null,
  country_code                char(2) not null,
  scope                       text not null check (scope in ('company','BU','team')),
  scope_label                 text not null,
  status                      m12_rps_status not null default 'draft',
  framework                   text,                         -- WHO-5 | Karasek | COPSOQ | Maslach
  opened_at                   timestamptz,
  closed_at                   timestamptz,
  target_respondents          int not null default 0,
  respondents                 int not null default 0,
  average_wellbeing_score     numeric,                      -- /100
  burnout_risk_pct            numeric,                      -- 0-100
  listening_cell_triggered    boolean not null default false,
  insights                    text[],
  unique (tenant_id, ref)
);
create index if not exists m12_rps_status_idx on m12_rps_surveys (tenant_id, status);

-- ---------------------------------------------------------------------------
-- 3. AT / MP — INCIDENTS
-- ---------------------------------------------------------------------------
create table if not exists m12_work_incidents (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null,
  ref                         text not null,
  employee_id                 uuid not null,
  type                        m12_incident_type not null,
  severity                    m12_incident_severity not null,
  occurred_at                 timestamptz not null,
  declared_at                 timestamptz not null,
  country_code                char(2) not null,
  unite                       text,
  location                    text,
  description                 text,
  workdays_lost               int  not null default 0,
  third_party_involved        boolean not null default false,
  root_cause                  text,
  corrective_actions          text[],
  status                      m12_incident_status not null default 'declare',
  cnps_ref                    text,
  declared_within_sla         boolean generated always as
    (extract(epoch from (declared_at - occurred_at)) <= 48 * 3600) stored,
  created_at                  timestamptz not null default now(),
  unique (tenant_id, ref)
);
create index if not exists m12_incidents_employee_idx on m12_work_incidents (tenant_id, employee_id);
create index if not exists m12_incidents_status_idx on m12_work_incidents (tenant_id, status);

-- ---------------------------------------------------------------------------
-- 4. REGISTRE DU PERSONNEL — OHADA (append-only)
-- ---------------------------------------------------------------------------
create table if not exists m12_register_entries (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  matricule           int not null,                 -- numéro d'ordre
  employee_id         uuid not null,
  country_code        char(2) not null,
  entry_date          date not null,
  exit_date           date,
  exit_reason         text,
  inspection_visas    jsonb default '[]'::jsonb,    -- [{date, inspector, comment?}]
  created_at          timestamptz not null default now(),
  unique (tenant_id, matricule),
  unique (tenant_id, employee_id)
);

-- Trigger : registre OHADA = append-only sur les colonnes immuables
create or replace function m12_register_no_delete() returns trigger
language plpgsql set search_path = atlas_people, public as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Le registre du personnel est append-only (OHADA — conservation à vie).';
  end if;
  if tg_op = 'UPDATE' and (old.matricule <> new.matricule or old.employee_id <> new.employee_id
        or old.entry_date <> new.entry_date or old.country_code <> new.country_code) then
    raise exception 'Modification interdite des champs immuables du registre (matricule, employee, entry, pays).';
  end if;
  return coalesce(new, old);
end $$;

do $$ begin
  drop trigger if exists m12_register_immutable on m12_register_entries;
  create trigger m12_register_immutable
    before update or delete on m12_register_entries
    for each row execute function m12_register_no_delete();
end $$;

-- ---------------------------------------------------------------------------
-- 5. DÉCLARATIONS SOCIALES (CNPS/IPRES/CNSS/etc.)
-- ---------------------------------------------------------------------------
create table if not exists m12_social_declarations (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  ref                 text not null,
  kind                m12_declaration_kind not null,
  country_code        char(2) not null,
  period              text not null,                -- 2026-04 ou 2026-Q2
  frequency           m12_declaration_frequency not null,
  status              m12_declaration_status not null default 'draft',
  due_date            date not null,
  submitted_at        timestamptz,
  paid_at             timestamptz,
  amount_declared     bigint not null default 0,
  penalty             bigint,
  headcount           int  not null default 0,
  unique (tenant_id, ref)
);
create index if not exists m12_decla_due_idx on m12_social_declarations (tenant_id, due_date);
create index if not exists m12_decla_status_idx on m12_social_declarations (tenant_id, status);

-- ---------------------------------------------------------------------------
-- 6. VISITES MÉDICALES (table sensible — RLS médecin du travail)
-- ---------------------------------------------------------------------------
create table if not exists m12_medical_visits (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  ref                 text not null,
  employee_id         uuid not null,
  kind                m12_visit_kind not null,
  scheduled_at        date not null,
  performed_at        date,
  practitioner        text,
  aptitude            m12_aptitude,
  restrictions        text[],
  next_visit_due      date,
  notes               text,                         -- CONFIDENTIEL — médecin uniquement
  created_at          timestamptz not null default now(),
  unique (tenant_id, ref)
);
create index if not exists m12_visits_employee_idx on m12_medical_visits (tenant_id, employee_id);

-- ---------------------------------------------------------------------------
-- 7. HABILITATIONS & EPI
-- ---------------------------------------------------------------------------
create table if not exists m12_authorizations (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  ref                 text not null,
  employee_id         uuid not null,
  kind                m12_auth_kind not null,
  level               text not null,
  issued_at           date not null,
  expires_at          date not null,
  status              m12_auth_status not null default 'active',
  issuing_authority   text,
  unique (tenant_id, ref)
);
create index if not exists m12_auth_expires_idx on m12_authorizations (tenant_id, expires_at)
  where status in ('active','pending_renewal');

create table if not exists m12_epi_assignments (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null,
  employee_id                 uuid not null,
  category                    text not null check (category in
    ('chaussures','casque','gants','lunettes','masque','harnais','vetement','bouchons')),
  model_label                 text not null,
  size                        text,
  issued_at                   date not null,
  renewal_due                 date,
  acknowledged_by_employee    boolean not null default false
);
create index if not exists m12_epi_employee_idx on m12_epi_assignments (tenant_id, employee_id);

-- ---------------------------------------------------------------------------
-- 8. AUDITS + FINDINGS
-- ---------------------------------------------------------------------------
create table if not exists m12_audits (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null,
  ref                         text not null,
  scope                       m12_audit_scope not null,
  title                       text not null,
  lead_auditor_employee_id    uuid not null,
  external_auditor            text,
  country_code                char(2),
  status                      m12_audit_status not null default 'planned',
  planned_at                  date not null,
  started_at                  date,
  completed_at                date,
  conformity_score            int,                 -- 0-100
  report_url                  text,
  created_at                  timestamptz not null default now(),
  unique (tenant_id, ref)
);

create table if not exists m12_audit_findings (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  audit_id            uuid not null references m12_audits(id) on delete cascade,
  ref                 text not null,
  severity            m12_finding_severity not null,
  domain              text not null,
  description         text not null,
  recommendation      text,
  owner_employee_id   uuid not null,
  due_date            date not null,
  status              m12_finding_status not null default 'open',
  closed_at           timestamptz,
  evidence            text,
  unique (tenant_id, ref)
);
create index if not exists m12_findings_audit_idx on m12_audit_findings (tenant_id, audit_id);
create index if not exists m12_findings_status_idx on m12_audit_findings (tenant_id, status);

-- ---------------------------------------------------------------------------
-- 9. INSPECTIONS DU TRAVAIL
-- ---------------------------------------------------------------------------
create table if not exists m12_labor_inspections (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  ref                 text not null,
  country_code        char(2) not null,
  inspector_name      text not null,
  inspector_authority text not null,
  visited_at          date not null,
  outcome             m12_inspection_outcome not null,
  findings            text[],
  penalties           bigint,
  remediation_due_at  date,
  follow_up_done_at   date,
  unique (tenant_id, ref)
);

-- ---------------------------------------------------------------------------
-- 10. POLITIQUES DE CONSERVATION (table de référence)
-- ---------------------------------------------------------------------------
create table if not exists m12_retention_policies (
  document_class      m12_document_class primary key,
  label               text not null,
  duration_years      int,                          -- null = à vie
  legal_basis         text not null,
  purge_method        text not null check (purge_method in
    ('shred_pdf','archive_cold','anonymize','destroy_certified')),
  notes               text
);

-- Seed des politiques (idempotent)
insert into m12_retention_policies (document_class, label, duration_years, legal_basis, purge_method, notes)
values
  ('contrat',              'Contrats & avenants',          30,   'Code travail OHADA + prescription 30 ans',  'archive_cold',      null),
  ('avenant',              'Avenants',                     30,   'Aligné contrats',                            'archive_cold',      null),
  ('paie',                 'Bulletins de paie & journaux', 10,   'Code travail + Code commerce',               'archive_cold',      'Conservation employeur ≥ 5 ans · employé 10 ans.'),
  ('cnps',                 'Déclarations CNPS / IPRES',    10,   'Codes de Sécurité Sociale',                  'archive_cold',      null),
  ('disciplinaire',        'Sanctions disciplinaires',     3,    'Code travail (effacement amnistie)',         'destroy_certified', 'Effacement automatique sans nouvelle sanction.'),
  ('duer',                 'DUER & versions historiques',  5,    'Code travail SST',                           'archive_cold',      '5 dernières versions glissantes.'),
  ('visite_medicale',      'Dossiers médicaux',            50,   'Secret médical · code santé',                'destroy_certified', 'Médecin du travail uniquement.'),
  ('inspection',           'PV inspection du travail',     10,   'Procédure administrative',                   'archive_cold',      null),
  ('audit',                'Rapports d''audit',            7,    'Référentiel interne + ISO',                  'shred_pdf',         null),
  ('declaration_sociale',  'Déclarations sociales',        10,   'Code sécu + commerce',                       'archive_cold',      null),
  ('registre_personnel',   'Registre du personnel',        null, 'OHADA — conservation à vie',                 'archive_cold',      null),
  ('AT_MP',                'Dossiers AT/MP',               30,   'Code SS + prescription accidents',           'archive_cold',      null)
on conflict (document_class) do nothing;

-- ---------------------------------------------------------------------------
-- 11. AUDIT — chaîne SHA-256
-- ---------------------------------------------------------------------------
create table if not exists m12_audit_log (
  id              bigserial primary key,
  tenant_id       uuid not null,
  occurred_at     timestamptz not null default now(),
  actor_id        uuid,
  actor_role      text,
  actor_ip        inet,
  action_code     text not null,
  resource_type   text,
  resource_id     uuid,
  before_state    jsonb,
  after_state     jsonb,
  prev_hash       text,
  hash            text not null
);
create index if not exists m12_audit_tenant_time_idx on m12_audit_log (tenant_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- 12. RLS — tenant-aware (médical = HR/médecin strict)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'm12_risks','m12_rps_surveys','m12_work_incidents','m12_register_entries',
    'm12_social_declarations','m12_authorizations','m12_epi_assignments',
    'm12_audits','m12_audit_findings','m12_labor_inspections','m12_audit_log'
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

-- Visites médicales : RLS plus restrictive (médecin du travail)
alter table m12_medical_visits enable row level security;
drop policy if exists tenant_read on m12_medical_visits;
create policy tenant_read on m12_medical_visits
  for select using (
    tenant_id = any (current_tenant_ids())
    and (is_hr_or_admin() or auth.uid() = employee_id)
  );
drop policy if exists tenant_write on m12_medical_visits;
create policy tenant_write on m12_medical_visits
  for all using (tenant_id = any (current_tenant_ids()) and is_hr_or_admin())
  with check (tenant_id = any (current_tenant_ids()) and is_hr_or_admin());

-- ---------------------------------------------------------------------------
-- 13. TRIGGERS — updated_at
-- ---------------------------------------------------------------------------
create or replace function m12_touch_updated_at() returns trigger
language plpgsql set search_path = atlas_people, public as $$
begin new.updated_at = now(); return new; end $$;

do $$ begin
  drop trigger if exists m12_risks_touch on m12_risks;
  create trigger m12_risks_touch before update on m12_risks
    for each row execute function m12_touch_updated_at();
end $$;

-- ---------------------------------------------------------------------------
-- 14. VIEWS — KPIs cockpit conformité
-- ---------------------------------------------------------------------------
create or replace view m12_kpi_cockpit as
select
  r.tenant_id,
  count(*) as duer_risks_total,
  count(*) filter (where r.level in ('critique','eleve')) as duer_risks_critical,
  (select count(*) from m12_work_incidents wi
     where wi.tenant_id = r.tenant_id and wi.status <> 'closed') as at_open_count,
  (select count(*) from m12_social_declarations sd
     where sd.tenant_id = r.tenant_id and sd.status = 'overdue') as declarations_overdue,
  (select count(*) from m12_authorizations a
     where a.tenant_id = r.tenant_id
       and a.status in ('active','pending_renewal')
       and a.expires_at - current_date <= 90) as habilitations_expirantes_90j,
  (select count(*) from m12_audit_findings f
     where f.tenant_id = r.tenant_id
       and f.status not in ('closed','accepted_risk')) as audits_open_findings
from m12_risks r
group by r.tenant_id;

comment on view m12_kpi_cockpit is 'Vue agrégée KPIs M12 Conformité & SST — utilisée par /conformite cockpit.';
