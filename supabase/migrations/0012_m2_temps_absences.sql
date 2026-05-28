-- ============================================================================
-- Atlas People — M2 Temps & absences (Document de fondation).
-- Socle de données : 12 thèmes (α–μ). Congés & absences, compteurs &
-- acquisition, demandes, pointage, temps effectif, heures sup, planning &
-- roulements, absences non planifiées, heures de délégation (branché M1 thème M),
-- récupération, astreintes, régularisations.
-- M2 = fournisseur principal de données variables à M3 (paie).
-- ~33 tables + RLS + seed catalogue α. Additif et idempotent.
-- public_holidays : partagé depuis M1 (migration 0011).
-- ============================================================================

-- ===========================================================================
-- α — Types de congés et d'absences (catalogue paramétrable)
-- ===========================================================================
create table if not exists leave_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants (id) on delete cascade,  -- NULL = commun
  code text not null,
  label text not null,
  category text not null check (category in ('paid_leave','special_family','parenthood','health','exceptional','delegation','other')),
  paid boolean not null default true,
  pay_rate_pct int not null default 100,
  consumes_paid_balance boolean not null default false,
  count_unit text not null default 'working_days' check (count_unit in ('working_days','open_days','calendar_days','hours')),
  max_duration numeric,
  default_duration numeric,
  justification_required boolean not null default false,
  justification_type text,
  notice_days int not null default 0,
  validation_required boolean not null default true,
  approval_circuit text not null default 'manager' check (approval_circuit in ('manager','manager_hr','hr','automatic')),
  affects_seniority boolean not null default false,
  affects_leave_accrual boolean not null default false,
  linked_m1_event text check (linked_m1_event in ('marriage','birth','death',null)),
  country_codes text[],
  collective_agreement_id uuid,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now()
);
create index if not exists idx_leave_types on leave_types (tenant_id, category);

create table if not exists leave_type_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  leave_type_id uuid not null references leave_types (id) on delete cascade,
  rule_key text not null,
  rule_value jsonb not null,
  country_code text,
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- β — Compteurs & acquisition
-- ===========================================================================
create table if not exists accrual_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  country_code text not null,
  base_rate_per_month numeric not null,           -- ex. 2.2 jours ouvrables / mois
  reference_period_start text not null default '06-01',  -- MM-DD
  seniority_bonus jsonb,                            -- [{years:5,days:1},{years:10,days:2}]
  mother_bonus_per_child numeric,                   -- jours / enfant < 14 ans
  mother_child_age_max int default 14,
  young_worker_bonus jsonb,                         -- {age_max:18, days:N}
  carryover_policy text not null default 'partial' check (carryover_policy in ('full','partial','none')),
  carryover_max_days numeric,
  expiry_months int,
  created_at timestamptz not null default now()
);

create table if not exists employee_leave_balances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  counter_type text not null,            -- cp_acquired / cp_taken / rtt / recovery / delegation / sick …
  reference_period text not null,
  acquired numeric not null default 0,
  taken numeric not null default 0,
  pending numeric not null default 0,
  available numeric not null default 0,
  carried_over numeric not null default 0,
  expiry_date date,
  last_accrual_date date,
  updated_at timestamptz not null default now(),
  unique (employee_id, counter_type, reference_period)
);
create index if not exists idx_leave_balances on employee_leave_balances (tenant_id, employee_id);

create table if not exists leave_accrual_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  counter_type text not null,
  accrual_date date not null,
  amount numeric not null,
  basis text,                            -- "2.2 base + 1 ancienneté"
  reference_period text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_accrual_history on leave_accrual_history (tenant_id, employee_id, accrual_date desc);

-- ===========================================================================
-- γ — Demandes de congés / absences
-- ===========================================================================
create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  leave_type_id uuid references leave_types (id),
  leave_type_code text not null,
  start_date date not null,
  end_date date not null,
  half_day_start boolean default false,
  half_day_end boolean default false,
  counted_days numeric,                  -- décompte déterministe (hors WE + fériés)
  reason text,
  status text not null default 'pending' check (status in ('draft','pending','approved','refused','cancelled','info_requested')),
  linked_event_id uuid,                  -- événement M1 (naissance/mariage/décès)
  submitted_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_leave_requests on leave_requests (tenant_id, employee_id, status);
create index if not exists idx_leave_requests_dates on leave_requests (tenant_id, start_date);

create table if not exists leave_request_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  leave_request_id uuid not null references leave_requests (id) on delete cascade,
  approver_user_id uuid,
  approver_role text not null,
  ordering int not null default 1,
  status text not null default 'pending' check (status in ('pending','approved','refused','info_requested')),
  comment text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists leave_request_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  leave_request_id uuid not null references leave_requests (id) on delete cascade,
  document_id uuid references employee_documents (id),
  doc_type text,
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- δ — Pointage & présence
-- ===========================================================================
create table if not exists clocking_methods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  method text not null check (method in ('mobile_geo','badge','biometric','manual','web')),
  enabled boolean not null default true,
  config jsonb,
  created_at timestamptz not null default now()
);

create table if not exists clocking_devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  site_id uuid,
  device_type text not null,
  label text not null,
  identifier text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists time_clockings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  clocking_type text not null check (clocking_type in ('in','out','break_start','break_end')),
  clocked_at timestamptz not null,        -- horodatage local d'origine (offline-safe)
  method text not null check (method in ('mobile_geo','badge','biometric','manual','web')),
  device_id uuid references clocking_devices (id),
  site_id uuid,
  geo_lat numeric,
  geo_lng numeric,
  synced_at timestamptz,                   -- date de synchronisation (≠ clocked_at si offline)
  source text not null default 'online' check (source in ('online','offline_sync')),
  verification_status text not null default 'ok' check (verification_status in ('ok','to_verify','rejected')),
  created_at timestamptz not null default now()
);
create index if not exists idx_clockings on time_clockings (tenant_id, employee_id, clocked_at desc);

-- ===========================================================================
-- ε — Temps de travail effectif (timesheets)
-- ===========================================================================
create table if not exists timesheets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft','submitted','validated','exported')),
  total_worked_minutes int not null default 0,
  total_overtime_minutes int not null default 0,
  validated_by uuid,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (employee_id, period_start, period_end)
);
create index if not exists idx_timesheets on timesheets (tenant_id, employee_id, period_start desc);

create table if not exists timesheet_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  timesheet_id uuid not null references timesheets (id) on delete cascade,
  work_date date not null,
  worked_minutes int not null default 0,
  break_minutes int not null default 0,
  overtime_minutes int not null default 0,
  night_minutes int not null default 0,
  sunday_minutes int not null default 0,
  holiday_minutes int not null default 0,
  absence_code text,
  anomaly boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_timesheet_lines on timesheet_lines (tenant_id, timesheet_id, work_date);

create table if not exists worked_time_summary (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  reference_period text not null,
  worked_days numeric not null default 0,
  worked_hours numeric not null default 0,
  overtime_hours numeric not null default 0,
  night_hours numeric not null default 0,
  sunday_hours numeric not null default 0,
  holiday_hours numeric not null default 0,
  absence_days numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (employee_id, reference_period)
);

-- ===========================================================================
-- ζ — Heures supplémentaires
-- ===========================================================================
create table if not exists overtime_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  country_code text not null,
  weekly_threshold_hours numeric not null,        -- au-delà = heures sup
  tier1_hours numeric, tier1_rate_pct int,         -- ex. 8 premières h → +15%
  tier2_hours numeric, tier2_rate_pct int,         -- suivantes → +50%
  night_rate_pct int, sunday_rate_pct int, holiday_rate_pct int,
  annual_cap_hours numeric,
  created_at timestamptz not null default now()
);

create table if not exists overtime_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  work_date date not null,
  hours numeric not null,
  rate_pct int not null,
  category text not null check (category in ('overtime','night','sunday','holiday')),
  status text not null default 'detected' check (status in ('detected','validated','refused','converted_to_recovery')),
  validated_by uuid,
  validated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_overtime on overtime_records (tenant_id, employee_id, work_date desc);

-- ===========================================================================
-- η — Planning & roulements
-- ===========================================================================
create table if not exists work_rhythm_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  description text,
  weekly_hours numeric,
  working_days text[],
  daily_schedule jsonb,
  created_at timestamptz not null default now()
);

create table if not exists work_cycles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  cycle_type text not null check (cycle_type in ('fixed','rotating_2x12','rotating_3x8','flexible','annualized','7_7')),
  cycle_length_days int,
  pattern jsonb,
  created_at timestamptz not null default now()
);

create table if not exists shift_patterns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  work_cycle_id uuid references work_cycles (id) on delete cascade,
  label text not null,
  start_time text not null,
  end_time text not null,
  is_night boolean not null default false,
  break_minutes int not null default 0,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  site_id uuid,
  department_id uuid,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_schedules on schedules (tenant_id, period_start);

create table if not exists schedule_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  schedule_id uuid not null references schedules (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  work_date date not null,
  shift_pattern_id uuid references shift_patterns (id),
  status text not null default 'planned' check (status in ('planned','confirmed','swapped','absent')),
  created_at timestamptz not null default now()
);
create index if not exists idx_schedule_assignments on schedule_assignments (tenant_id, employee_id, work_date);

create table if not exists shift_swaps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  requester_id uuid not null references employees (id) on delete cascade,
  target_employee_id uuid references employees (id),
  assignment_id uuid references schedule_assignments (id),
  status text not null default 'pending' check (status in ('pending','accepted','refused','approved')),
  reason text,
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- θ — Absences non planifiées
-- ===========================================================================
create table if not exists absences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  absence_code text not null,            -- MAL / AT / MP / unjustified …
  start_date date not null,
  end_date date,
  declared_at timestamptz not null default now(),
  source text not null default 'employee' check (source in ('employee','manager','hr','m12')),
  status text not null default 'declared' check (status in ('declared','justified','unjustified','closed')),
  justified boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_absences on absences (tenant_id, employee_id, start_date desc);

create table if not exists absence_justifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  absence_id uuid not null references absences (id) on delete cascade,
  document_id uuid references employee_documents (id),
  justification_type text,
  received_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists medical_leave_tracking (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  absence_id uuid not null references absences (id) on delete cascade,
  pay_rate_pct int,                       -- dégressif selon ancienneté/convention
  social_fund_handover boolean default false,
  expected_return_date date,
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- ι — Heures de délégation (branché M1 thème M — employee_mandates)
-- ===========================================================================
create table if not exists delegation_hours (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  mandate_id uuid,                        -- M1 employee_mandates
  monthly_quota_hours numeric not null,
  reference_month text not null,          -- YYYY-MM
  used_hours numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (employee_id, mandate_id, reference_month)
);

create table if not exists delegation_usage (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  delegation_hours_id uuid not null references delegation_hours (id) on delete cascade,
  usage_date date not null,
  hours numeric not null,
  note text,
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- κ — Récupération & compensation
-- ===========================================================================
create table if not exists recovery_counters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  balance_hours numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (employee_id)
);

create table if not exists recovery_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  movement_type text not null check (movement_type in ('credit','debit')),
  hours numeric not null,
  source text,                            -- overtime_conversion / recovery_taken
  movement_date date not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_recovery_movements on recovery_movements (tenant_id, employee_id, movement_date desc);

-- ===========================================================================
-- λ — Astreintes
-- ===========================================================================
create table if not exists on_call_periods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  compensation_type text,                 -- forfait / horaire
  compensation_amount bigint,
  created_at timestamptz not null default now()
);
create index if not exists idx_on_call on on_call_periods (tenant_id, employee_id, start_at desc);

create table if not exists on_call_interventions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  on_call_period_id uuid not null references on_call_periods (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  description text,
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- μ — Régularisations & anomalies
-- ===========================================================================
create table if not exists clocking_anomalies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  anomaly_date date not null,
  anomaly_type text not null check (anomaly_type in ('missing_in','missing_out','overlap','out_of_zone','clock_tampering','excessive_duration')),
  status text not null default 'open' check (status in ('open','resolved','ignored')),
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists idx_clocking_anomalies on clocking_anomalies (tenant_id, employee_id, anomaly_date desc);

create table if not exists time_corrections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  target_clocking_id uuid references time_clockings (id),
  correction_type text not null check (correction_type in ('add','modify','delete')),
  proposed_value jsonb,
  reason text not null,
  requested_by uuid,
  status text not null default 'pending' check (status in ('pending','approved','refused')),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_time_corrections on time_corrections (tenant_id, employee_id, status);

-- ===========================================================================
-- Seed — catalogue α (commun, tenant_id NULL)
-- ===========================================================================
do $$
begin
  if not exists (select 1 from leave_types limit 1) then
    insert into leave_types (code, label, category, paid, consumes_paid_balance, count_unit, default_duration, justification_required, justification_type, notice_days, approval_circuit, linked_m1_event, country_codes) values
      ('CP','Congé payé annuel','paid_leave',true,true,'working_days',null,false,null,15,'manager',null,array['CI','SN']),
      ('RTT','Récupération du temps de travail','paid_leave',true,false,'working_days',null,false,null,7,'manager',null,array['CI','SN']),
      ('CS-MAR','Mariage du salarié','special_family',true,false,'working_days',4,true,'certificate',7,'manager','marriage',array['CI','SN']),
      ('CS-NAIS','Naissance / Paternité','special_family',true,false,'working_days',3,true,'birth_certificate',2,'manager','birth',array['CI','SN']),
      ('CS-DEC-CJT','Décès conjoint','special_family',true,false,'working_days',5,true,'death_certificate',0,'manager','death',array['CI','SN']),
      ('CS-DEC-ASC','Décès ascendant','special_family',true,false,'working_days',3,true,'death_certificate',0,'manager','death',array['CI','SN']),
      ('MAT','Congé maternité','parenthood',true,false,'calendar_days',98,true,'medical_certificate',30,'hr',null,array['CI','SN']),
      ('PAT','Congé paternité','parenthood',true,false,'working_days',3,true,'birth_certificate',7,'manager','birth',array['CI','SN']),
      ('MAL','Congé maladie','health',true,false,'calendar_days',null,true,'medical_certificate',0,'hr',null,array['CI','SN']),
      ('AT','Accident du travail','health',true,false,'calendar_days',null,true,'at_declaration',0,'hr',null,array['CI','SN']),
      ('HADJ','Congé pèlerinage (Hadj)','exceptional',false,false,'calendar_days',21,true,'other',60,'hr',null,array['CI','SN']),
      ('PERM','Permission exceptionnelle','exceptional',true,false,'working_days',1,false,null,2,'manager',null,array['CI','SN']),
      ('CSS','Congé sans solde','exceptional',false,false,'calendar_days',null,false,null,15,'manager_hr',null,array['CI','SN']),
      ('MANDAT','Heures de délégation','delegation',true,false,'hours',null,false,null,0,'automatic',null,array['CI','SN']);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS — isolation tenant (leave_types : commun + tenant en lecture)
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array[
  'leave_type_rules','accrual_rules','employee_leave_balances','leave_accrual_history',
  'leave_requests','leave_request_approvals','leave_request_documents',
  'clocking_methods','clocking_devices','time_clockings',
  'timesheets','timesheet_lines','worked_time_summary',
  'overtime_rules','overtime_records',
  'work_rhythm_templates','work_cycles','shift_patterns','schedules','schedule_assignments','shift_swaps',
  'absences','absence_justifications','medical_leave_tracking',
  'delegation_hours','delegation_usage','recovery_counters','recovery_movements',
  'on_call_periods','on_call_interventions','clocking_anomalies','time_corrections'
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

alter table leave_types enable row level security;
create policy leave_types_read on leave_types
  for select using (tenant_id is null or tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
create policy leave_types_write on leave_types
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
