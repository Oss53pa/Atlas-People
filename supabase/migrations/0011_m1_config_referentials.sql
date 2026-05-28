-- ============================================================================
-- Atlas People — M1 P1.15–P1.18 : référentiels de configuration (socle).
--   P1.15 départements (hiérarchie) & sites (legal_entities/branches en 0008)
--   P1.16 familles de postes, postes, classifications
--   P1.17 rôles personnalisés & attributions
--   P1.18 conventions collectives & jours fériés
-- Versionné par date d'effet pour les conventions ; intégrité référentielle
-- (archivage plutôt que suppression quand des employés sont rattachés).
-- 9 tables + RLS + seeds. Additif et idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- P1.15 — Départements (hiérarchie) & sites
-- ---------------------------------------------------------------------------
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  code text not null,
  parent_id uuid references departments (id),
  manager_employee_id uuid references employees (id),
  legal_entity_id uuid,
  cost_center text,
  description text,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);
create index if not exists idx_departments on departments (tenant_id, parent_id);

create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  code text not null,
  site_type text not null check (site_type in ('headquarters','agency','store','factory','warehouse','site','office','other')),
  address text not null,
  local_references text,
  city text not null,
  country_code text not null,
  geo_point text,
  manager_employee_id uuid references employees (id),
  legal_entity_id uuid,
  capacity int,
  timezone text not null default 'Africa/Abidjan',
  geo_clock_in boolean not null default false,
  status text not null default 'active' check (status in ('active','opening','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);
create index if not exists idx_sites on sites (tenant_id);

-- ---------------------------------------------------------------------------
-- P1.16 — Familles de postes, postes, classifications
-- ---------------------------------------------------------------------------
create table if not exists job_families (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists classifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  label text not null,
  collective_agreement_id uuid,
  category text not null,
  echelon text,
  coefficient numeric,
  min_conventional_salary bigint not null,  -- base du ComplianceGuard rémunération
  hierarchy_level text not null check (hierarchy_level in ('employee','supervisor','manager','senior_manager','executive')),
  country_code text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_classifications on classifications (tenant_id, country_code);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  title text not null,
  code text not null,
  job_family_id uuid references job_families (id),
  hierarchy_level text not null check (hierarchy_level in ('employee','supervisor','manager','senior_manager','executive')),
  description text,
  required_skills text[],
  required_authorizations text[],
  minimum_diploma text,
  minimum_experience_years int,
  compatible_classifications uuid[],
  salary_range_min bigint,
  salary_range_max bigint,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);
create index if not exists idx_jobs on jobs (tenant_id, job_family_id);

-- ---------------------------------------------------------------------------
-- P1.17 — Rôles personnalisés & attributions
-- ---------------------------------------------------------------------------
create table if not exists custom_roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  description text,
  base_role text,  -- rôle prédéfini dont il dérive
  permissions jsonb not null default '{}'::jsonb,
  scope_site_id uuid references sites (id),
  scope_department_id uuid references departments (id),
  scope_legal_entity_id uuid,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table if not exists role_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  user_id uuid not null,
  role_code text not null,  -- rôle prédéfini ou custom_roles.name
  scope_site_id uuid references sites (id),
  scope_department_id uuid references departments (id),
  effective_from date not null default now(),
  effective_to date,
  assigned_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_role_assignments on role_assignments (tenant_id, user_id);

-- ---------------------------------------------------------------------------
-- P1.18 — Conventions collectives & jours fériés
-- ---------------------------------------------------------------------------
create table if not exists collective_agreements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  country_code text not null,
  sector text not null,
  effective_from date not null,
  document_id uuid references employee_documents (id),
  mandatory_premiums text[],
  trial_period_max jsonb,        -- par type de contrat
  notice_period jsonb,           -- par tranche d'ancienneté
  cdd_max_renewals int,
  cdd_max_months int,
  severance_scale jsonb,         -- barème par tranche d'ancienneté
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now()
);
create index if not exists idx_collective_agreements on collective_agreements (tenant_id, country_code);

create table if not exists public_holidays (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants (id) on delete cascade,  -- NULL = commun
  label text not null,
  country_code text not null,
  holiday_date date not null,
  holiday_type text not null check (holiday_type in ('civil','muslim','christian','national','customary')),
  recurring_annual boolean not null default false,
  variable_date boolean not null default false,
  paid boolean not null default true,
  worked_surcharge_pct int not null default 100,
  created_at timestamptz not null default now()
);
create index if not exists idx_public_holidays on public_holidays (country_code, holiday_date);

-- ---------------------------------------------------------------------------
-- Seeds — jours fériés communs (CI 2026, illustratif)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public_holidays limit 1) then
    insert into public_holidays (label, country_code, holiday_date, holiday_type, recurring_annual, variable_date, paid, worked_surcharge_pct) values
      ('Nouvel An','CI','2026-01-01','civil',true,false,true,100),
      ('Fête du Travail','CI','2026-05-01','civil',true,false,true,100),
      ('Fête de l''Indépendance','CI','2026-08-07','national',true,false,true,100),
      ('Aïd el-Fitr','CI','2026-03-20','muslim',false,true,true,100),
      ('Aïd el-Kébir (Tabaski)','CI','2026-05-27','muslim',false,true,true,100),
      ('Lundi de Pâques','CI','2026-04-06','christian',false,true,true,100),
      ('Assomption','CI','2026-08-15','christian',true,false,true,100),
      ('Noël','CI','2026-12-25','christian',true,false,true,100);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS — isolation tenant (public_holidays : commun + tenant en lecture)
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array[
  'departments','sites','job_families','classifications','jobs',
  'custom_roles','role_assignments','collective_agreements'
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

alter table public_holidays enable row level security;
create policy public_holidays_read on public_holidays
  for select using (tenant_id is null or tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
create policy public_holidays_write on public_holidays
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
