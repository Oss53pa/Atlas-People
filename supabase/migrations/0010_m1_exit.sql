-- ============================================================================
-- Atlas People — M1 P1.11 : Sortie du collaborateur (DOSSIER-PATTERN).
-- Solde de tout compte (STC) exhaustif, traitement des engagements en cours
-- (prêts, cautions, clauses), conformité OHADA / SYSCOHADA, restitutions,
-- entretien de sortie. Ton respectueux ; les motifs disciplinaires (faute)
-- relèvent de M12 — P1.11 ne fait que recevoir le résultat.
-- 4 tables + RLS. Additif et idempotent.
-- ============================================================================

create table if not exists exit_cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  reference text not null unique,
  exit_motive text not null,
  sub_motive text,
  justification text,
  initiator text not null,
  initiated_at date not null,
  current_phase text not null default 'initiation' check (current_phase in (
    'initiation','notification','notice_period','pre_effect','effect','settlement','archived','cancelled'
  )),

  -- Préavis
  legal_notice_days int,
  conventional_notice_days int,
  retained_notice_days int,
  notice_start_date date,
  notice_end_date date,
  effective_date date not null,
  notice_dispensed boolean default false,
  notice_dispense_motive text,
  notice_compensation_paid boolean,
  notice_compensation_amount bigint,

  -- Indemnités calculées (francs entiers — Money.ts)
  severance_amount bigint,
  paid_leave_balance_amount bigint,
  cdd_end_premium bigint,
  retirement_indemnity bigint,
  non_compete_indemnity_monthly bigint,

  -- Solde de tout compte
  stc_total_credits bigint,
  stc_total_debits bigint,
  stc_net_amount bigint,
  stc_payment_mode text,
  stc_payment_account_id uuid,
  stc_paid_at timestamptz,
  stc_signed_at timestamptz,

  -- Communications
  employee_notified_at timestamptz,

  -- Clauses
  non_compete_clause_decision text check (non_compete_clause_decision in ('maintained','waived',null)),
  non_compete_decision_at timestamptz,

  -- Restitutions
  inventory_completed boolean default false,
  vehicle_handed_over boolean,
  housing_handed_over boolean,

  -- ComplianceGuard
  last_compliance_check_at timestamptz,
  compliance_status text,
  compliance_report jsonb,
  bypass_motive text,
  bypass_granted_by uuid,

  -- Phases finales
  cancelled_at timestamptz,
  cancellation_reason text,
  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_exit_cases_employee on exit_cases (tenant_id, employee_id, current_phase);
create index if not exists idx_exit_cases_effect on exit_cases (tenant_id, effective_date);

create table if not exists exit_stc_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  exit_case_id uuid not null references exit_cases (id) on delete cascade,
  line_type text not null check (line_type in ('credit','debit')),
  label text not null,
  amount bigint not null,
  calculation_details jsonb,
  legal_reference text,
  ordering int,
  created_at timestamptz not null default now()
);
create index if not exists idx_exit_stc_lines on exit_stc_lines (tenant_id, exit_case_id, ordering);

create table if not exists exit_restitutions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  exit_case_id uuid not null references exit_cases (id) on delete cascade,
  item_type text not null check (item_type in ('vehicle','housing','phone','laptop','badge','keys','card','other')),
  asset_reference text,
  asset_id uuid,
  attribution_date date,
  expected_return_date date not null,
  actual_return_date date,
  status text not null default 'pending' check (status in ('pending','returned','assessed','closed')),
  return_state_assessment text,
  deduction_amount bigint,
  responsible_receiver uuid,
  handover_document_id uuid references employee_documents (id),
  created_at timestamptz not null default now()
);
create index if not exists idx_exit_restitutions on exit_restitutions (tenant_id, exit_case_id);

create table if not exists exit_interviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  exit_case_id uuid not null references exit_cases (id) on delete cascade,
  interviewer_id uuid,
  scheduled_at timestamptz,
  conducted_at timestamptz,
  mode text check (mode in ('in_person','remote','phone',null)),
  duration_min int,
  questionnaire_responses jsonb,
  interviewer_notes text,
  satisfaction_overall int,
  recommendation_score int,
  willing_to_return boolean,
  created_at timestamptz not null default now()
);
create index if not exists idx_exit_interviews on exit_interviews (tenant_id, exit_case_id);

-- ---------------------------------------------------------------------------
-- RLS — isolation tenant. (La granularité employé/manager/RH sera ajoutée avec
-- les policies par rôle ; ici, isolation tenant systématique.)
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array['exit_cases','exit_stc_lines','exit_restitutions','exit_interviews'];
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
