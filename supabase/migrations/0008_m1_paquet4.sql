-- ============================================================================
-- Atlas People — M1 Complément Paquet 4 (thèmes R–T : suivi, communication,
-- métadonnées système). Paquet final du complément M1.
--   R — Suivi médical professionnel : MÉTADONNÉES UNIQUEMENT. Aucune donnée
--       médicale (diagnostic, pathologie, traitement) n'est stockée en M1 ;
--       celles-ci relèvent exclusivement de M12 (médecine du travail) sous RLS
--       isolée. Les restrictions sont formulées en termes OPÉRATIONNELS, jamais
--       médicaux.
--   S — Communication & préférences : notifications fines, consentements
--       RGPD/CDP tracés (historique immuable), droit à la déconnexion,
--       accessibilité.
--   T — Métadonnées système : cycle de vie, référent RH, entité juridique.
-- 14 tables + colonnes employees + seed + RLS. Additif et idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- T1/T2/T4 — Enrichissement de employees (cycle de vie & rattachement)
-- NB : la colonne operationnelle `status` (enum employee_status) existe déjà
-- (0001). On ajoute ici le statut technique de cycle de vie sous un nom
-- distinct pour ne pas casser l'enum opérationnel.
-- ---------------------------------------------------------------------------
alter table employees add column if not exists lifecycle_status text not null default 'active'
  check (lifecycle_status in ('draft','pending_signature','active','suspended_disciplinary','suspended_other','transferred_intra_group','left'));
alter table employees add column if not exists lifecycle_status_changed_at timestamptz;
alter table employees add column if not exists legal_entity_id uuid;
alter table employees add column if not exists branch_id uuid;
alter table employees add column if not exists created_by uuid;
alter table employees add column if not exists modification_count int not null default 0;
alter table employees add column if not exists exit_date date;
alter table employees add column if not exists anonymization_due_date date;
alter table employees add column if not exists archival_due_date date;

-- ===========================================================================
-- THÈME R — SUIVI MÉDICAL PROFESSIONNEL (métadonnées seulement)
-- ===========================================================================

-- R1 — Médecin du travail référent
create table if not exists employee_medical_followup (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade unique,
  occupational_doctor_id uuid references employees (id),
  occupational_health_service text,
  assigned_at date,
  non_medical_observations text,  -- préférences logistiques uniquement, JAMAIS médical
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_medical_followup on employee_medical_followup (tenant_id, employee_id);

-- R2 — Calendrier des visites médicales (conclusions transmises par M12)
create table if not exists medical_visits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  visit_type text not null check (visit_type in ('hiring','periodic','return','on_request','pre_return','enhanced_followup','other')),
  scheduled_date date not null,
  effective_date date,
  status text not null default 'scheduled' check (status in ('scheduled','completed','postponed','missed','cancelled')),
  doctor_conclusion text check (doctor_conclusion in ('fit','fit_with_restrictions','temporarily_unfit','permanently_unfit','to_review')),
  next_obligatory_visit date,
  non_medical_observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_medical_visits on medical_visits (tenant_id, employee_id, scheduled_date desc);

-- R3 — Aptitudes au poste (restrictions OPÉRATIONNELLES, sans nature médicale)
create table if not exists employee_aptitudes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  aptitude_general text not null check (aptitude_general in ('fit','fit_with_restrictions','temporarily_unfit','permanently_unfit','pending_opinion')),
  aptitude_date date not null,
  valid_until date,
  restrictions_operational text[],  -- libellés sans nature médicale
  restriction_duration text check (restriction_duration in ('temporary','undetermined','permanent')),
  communicated_to_manager boolean not null default false,
  source_visit_id uuid references medical_visits (id),
  created_at timestamptz not null default now()
);
create index if not exists idx_aptitudes on employee_aptitudes (tenant_id, employee_id, aptitude_date desc);

-- R4 — Vaccinations professionnelles obligatoires
create table if not exists vaccination_catalog (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants (id) on delete cascade,  -- NULL = commun
  code text not null,
  label text not null,
  recall_interval_months int,
  obligatory_for_jobs text[],
  created_at timestamptz not null default now()
);

create table if not exists employee_vaccinations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  vaccination_id uuid not null references vaccination_catalog (id),
  last_dose_date date not null,
  status text not null default 'up_to_date' check (status in ('up_to_date','recall_due_soon','expired','in_progress')),
  next_recall_date date,
  administration_place text,
  obligatory_for_position boolean not null default false,
  document_id uuid references employee_documents (id),
  created_at timestamptz not null default now()
);
create index if not exists idx_vaccinations on employee_vaccinations (tenant_id, employee_id);

-- ===========================================================================
-- THÈME S — COMMUNICATION INTERNE & PRÉFÉRENCES
-- ===========================================================================

-- S1 — Préférences par type × canal
create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  notification_type text not null,
  channel text not null check (channel in ('in_app','email','sms','whatsapp','push')),
  enabled boolean not null default true,
  is_mandatory boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, notification_type, channel)
);
create index if not exists idx_notif_prefs on notification_preferences (tenant_id, employee_id);

-- S1 — Modes globaux (Concentré, Vacances, Silencieux)
create table if not exists notification_global_modes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  mode text not null check (mode in ('normal','focused','vacation','silent')),
  active_from timestamptz,
  active_until timestamptz,
  created_at timestamptz not null default now()
);

-- S2 — Consentements RGPD/CDP
create table if not exists employee_consents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  consent_code text not null,
  granted boolean not null,
  granted_at timestamptz,
  withdrawn_at timestamptz,
  legal_basis text,
  retention_duration text,
  created_at timestamptz not null default now(),
  unique (employee_id, consent_code)
);
create index if not exists idx_consents on employee_consents (tenant_id, employee_id);

-- S2 — Historique des consentements (immuable, chaîné SHA-256)
create table if not exists consent_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  consent_code text not null,
  previous_state boolean,
  new_state boolean,
  changed_at timestamptz not null default now(),
  changed_by uuid not null,
  audit_hash text
);
create index if not exists idx_consent_history on consent_history (tenant_id, employee_id, changed_at desc);

-- S3 — Droit à la déconnexion
create table if not exists employee_disconnection_rights (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade unique,
  status text not null check (status in ('enabled','disabled','not_applicable')),
  default_offline_hours jsonb,
  custom_schedules jsonb,
  allowed_exceptions text[],
  emergency_contact_method text,
  manager_reminder_enabled boolean not null default true,
  effective_from date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- S4 — Préférences d'accessibilité
create table if not exists employee_accessibility_prefs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade unique,
  high_readability_mode boolean not null default false,
  dyslexia_friendly_mode boolean not null default false,
  reduced_motion boolean not null default false,
  font_size_increase int not null default 0,
  high_contrast_mode boolean not null default false,
  amounts_in_words_tts boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===========================================================================
-- THÈME T — MÉTADONNÉES SYSTÈME
-- ===========================================================================

-- T4 — Entités juridiques du tenant
create table if not exists legal_entities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  country_code text not null,
  fiscal_number text,
  registration_number text,
  legal_form text,
  address text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists idx_legal_entities on legal_entities (tenant_id);

-- T4 — Filiales / branches
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  legal_entity_id uuid not null references legal_entities (id),
  name text not null,
  address text,
  manager_employee_id uuid references employees (id),
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists idx_branches on branches (tenant_id, legal_entity_id);

-- T3 — Référent RH attribué
create table if not exists employee_hr_assignment (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade unique,
  primary_hr_referent_id uuid references employees (id),
  backup_hr_referent_id uuid references employees (id),
  assignment_date date,
  assignment_motive text check (assignment_motive in ('geography','functional_scope','specialization','employee_choice')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_hr_assignment on employee_hr_assignment (tenant_id, employee_id);

-- Liens de rattachement employees → legal_entities / branches (post-création)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'employees_legal_entity_fk') then
    alter table employees add constraint employees_legal_entity_fk
      foreign key (legal_entity_id) references legal_entities (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'employees_branch_fk') then
    alter table employees add constraint employees_branch_fk
      foreign key (branch_id) references branches (id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Seed — catalogue de vaccinations professionnelles (commun, tenant_id NULL)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from vaccination_catalog limit 1) then
    insert into vaccination_catalog (code, label, recall_interval_months, obligatory_for_jobs) values
      ('VAC-HEPB','Hépatite B',null,array['health','biological_waste']),
      ('VAC-TETPOL','Tétanos / Polio',120,array['operations','field','health']),
      ('VAC-YF','Fièvre jaune',120,array['business_travel_endemic']),
      ('VAC-MEN','Méningite',60,array['field_endemic']),
      ('VAC-CHOL','Choléra',6,array['field_endemic','business_travel_endemic']),
      ('VAC-TYPH','Typhoïde',36,array['collective_catering','health_endemic']),
      ('VAC-RAB','Rage',null,array['veterinary','forestry']);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS — isolation tenant. Le médical sensible reste limité aux métadonnées ;
-- la séparation fine médecin/RH/manager est portée par M12 (policies par rôle
-- ajoutées avec l'intégration M12). Ici, isolation tenant systématique.
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array[
  'employee_medical_followup','medical_visits','employee_aptitudes','employee_vaccinations',
  'notification_preferences','notification_global_modes','employee_consents','consent_history',
  'employee_disconnection_rights','employee_accessibility_prefs',
  'legal_entities','branches','employee_hr_assignment'
];
begin
  foreach t in array tabs loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy tenant_isolation on %I
        using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
        with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
    $f$, t);
  end loop;
end $$;

-- Catalogue vaccinations : lecture du référentiel commun + tenant
alter table vaccination_catalog enable row level security;
create policy vaccination_catalog_read on vaccination_catalog
  for select using (tenant_id is null or tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
