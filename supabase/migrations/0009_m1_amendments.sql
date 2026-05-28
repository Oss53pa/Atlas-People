-- ============================================================================
-- Atlas People — M1 P1.9 : Avenants contractuels (DOSSIER-PATTERN).
-- Versionnement contractuel immuable : un avenant crée une nouvelle version
-- v(N+1) sans écraser la précédente. Effet daté, diff explicite, ComplianceGuard,
-- signature électronique, propagation aux modules (M3, M9, M10, M13).
-- Un avenant peut porter sur plusieurs types simultanément (multi-modifications).
-- 3 tables + RLS. Additif et idempotent.
-- ============================================================================

create table if not exists amendments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  reference text not null unique,
  -- Types possibles (12) ; un avenant peut en cumuler plusieurs.
  amendment_type text[] not null,
  current_phase text not null default 'draft' check (current_phase in (
    'draft','compliance_check','pending_validation','pending_employee_acceptance',
    'pending_signature','signed_pending_effect','effective','cancelled','superseded'
  )),
  effective_date date not null,
  current_contract_version_id uuid references contracts (id),
  new_contract_version_id uuid references contracts (id),  -- créé à la signature

  -- Payload des modifications (JSONB pour flexibilité multi-types)
  modifications jsonb not null default '{}'::jsonb,

  -- Workflow
  created_by uuid,
  submitted_at timestamptz,
  validators_required jsonb,
  validators_status jsonb,
  employee_accepted_at timestamptz,
  signed_at timestamptz,
  effective_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,

  -- ComplianceGuard
  last_compliance_check_at timestamptz,
  compliance_status text check (compliance_status in ('not_checked','passed','warnings','blocking','bypass_granted')),
  compliance_report jsonb,
  bypass_motive text,
  bypass_granted_by uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_amendments_employee on amendments (tenant_id, employee_id, current_phase);
create index if not exists idx_amendments_effect on amendments (tenant_id, effective_date) where current_phase = 'signed_pending_effect';

create table if not exists amendment_validators (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  amendment_id uuid not null references amendments (id) on delete cascade,
  validator_user_id uuid not null,
  validator_role text not null,
  ordering int not null,
  status text not null default 'pending' check (status in ('pending','validated','requested_corrections','refused','skipped')),
  validated_at timestamptz,
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists idx_amendment_validators on amendment_validators (tenant_id, amendment_id, ordering);

create table if not exists amendment_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  amendment_id uuid not null references amendments (id) on delete cascade,
  document_type text not null,
  file_path text not null,
  uploaded_by uuid,
  uploaded_at timestamptz not null default now(),
  description text
);
create index if not exists idx_amendment_documents on amendment_documents (tenant_id, amendment_id);

-- ---------------------------------------------------------------------------
-- RLS — isolation tenant
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array['amendments','amendment_validators','amendment_documents'];
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
