-- ============================================================================
-- Atlas People — M1 référentiels, demandes de modification, RBAC.
-- Complète le CDC exécutable M1 (pages P1.7/P1.8, P1.15–P1.18).
-- Additif et idempotent.
-- ============================================================================

-- Objets déclarés sans qualification de schéma : sans cette directive, un
-- rejeu du dépôt les crée dans public au lieu d'atlas_people.
set search_path = atlas_people, public, extensions;

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
--
-- departments · sites · collective_agreements · classifications ·
-- public_holidays NE SONT PLUS DÉCLARÉES ICI.
--
-- Elles l'étaient en double, ici et dans 0011_m1_config_referentials, avec des
-- colonnes incompatibles. `create table if not exists` fait gagner la première
-- déclaration en silence : un rejeu du dépôt installait la version de ce
-- fichier, alors que la base porte celle de 0011 (vérifié colonne par colonne —
-- aucune colonne propre à 0004 n'existe en base : ni `active`, ni `year`, ni
-- `date`, ni `fixed`, ni `level`, ni `reference`, ni `manager_id`).
--
-- Même piège sur deux index homonymes, désormais laissés à 0011 :
--   idx_departments      ici (tenant_id)                  / 0011 (tenant_id, parent_id)
--   idx_public_holidays  ici (tenant_id, country_code, year) / 0011 (country_code, holiday_date)
--
-- 0011 reste la déclaration unique de ces cinq tables.
-- ---------------------------------------------------------------------------
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
-- Les cinq référentiels retirés plus haut sont désormais créés — et leur RLS
-- posée — par 0011_m1_config_referentials. Les laisser ici ferait échouer la
-- boucle au rejeu : elle s'exécuterait sur des tables pas encore créées.
declare tabs text[] := array[
  'modification_requests','job_titles','roles','user_roles'
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
