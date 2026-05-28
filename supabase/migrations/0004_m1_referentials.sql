-- ============================================================================
-- Atlas People — M1 référentiels, demandes de modification, RBAC.
-- Complète le CDC exécutable M1 (pages P1.7/P1.8, P1.15–P1.18).
-- Additif et idempotent.
-- ============================================================================

-- Identifiants employé (matricule, photo)
alter table employees add column if not exists matricule text;
alter table employees add column if not exists photo_path text;
create unique index if not exists uq_employees_matricule on employees (tenant_id, matricule);

-- ---------------------------------------------------------------------------
-- Demandes de modification (self-service → validation RH) — P1.7/P1.8
-- ---------------------------------------------------------------------------
create table if not exists modification_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  field_path text not null,          -- ex : 'phone_primary', 'mobile_money_number'
  current_value text,
  proposed_value text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users (id),
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_modreq on modification_requests (tenant_id, status);

-- ---------------------------------------------------------------------------
-- Référentiels organisationnels — P1.15 / P1.16 / P1.18
-- ---------------------------------------------------------------------------
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  code text not null,
  parent_id uuid references departments (id),
  manager_id uuid references employees (id),
  country_code text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_departments on departments (tenant_id);

create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  code text not null,
  address text,
  city text,
  country_code text not null,
  site_type text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_sites on sites (tenant_id);

create table if not exists job_titles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  title text not null,
  family text,
  description text,
  required_skills jsonb,
  default_classification text,
  created_at timestamptz not null default now()
);
create index if not exists idx_job_titles on job_titles (tenant_id);

create table if not exists collective_agreements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  country_code text not null,
  reference text,
  effective_from date,
  created_at timestamptz not null default now()
);

create table if not exists classifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  collective_agreement_id uuid references collective_agreements (id),
  category text,
  level text,
  coefficient text,
  created_at timestamptz not null default now()
);

create table if not exists public_holidays (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  country_code text not null,
  year int not null,
  date date not null,
  label text not null,
  fixed boolean not null default true,
  paid boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_public_holidays on public_holidays (tenant_id, country_code, year);

-- ---------------------------------------------------------------------------
-- RBAC — P1.17
-- ---------------------------------------------------------------------------
create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  system boolean not null default false,
  permissions jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  role_id uuid not null references roles (id) on delete cascade,
  granted_by uuid references auth.users (id),
  granted_at timestamptz not null default now()
);
create index if not exists idx_user_roles on user_roles (tenant_id, employee_id);

-- ---------------------------------------------------------------------------
-- RLS — isolation tenant systématique
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array[
  'modification_requests','departments','sites','job_titles','classifications',
  'collective_agreements','public_holidays','roles','user_roles'
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

-- L'employé voit ses propres demandes ; RH/DRH voient et traitent toutes.
drop policy if exists tenant_isolation on modification_requests;
create policy modreq_self_or_hr on modification_requests for select
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (employee_id = (auth.jwt() ->> 'employee_id')::uuid or (auth.jwt() ->> 'role') in ('hr', 'drh'))
  );
create policy modreq_employee_insert on modification_requests for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and employee_id = (auth.jwt() ->> 'employee_id')::uuid
  );
create policy modreq_hr_update on modification_requests for update
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and (auth.jwt() ->> 'role') in ('hr', 'drh'));
