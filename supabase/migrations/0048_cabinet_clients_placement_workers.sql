-- ════════════════════════════════════════════════════════════════════
-- 0048 — Tables cabinet : atlas_people.clients + atlas_people.workers
--
-- atlas_people.clients  → portefeuille des entreprises clientes d'un cabinet
-- atlas_people.workers  → travailleurs placés (module Placement)
--
-- RLS : chaque cabinet ne voit que ses propres clients / workers.
-- ════════════════════════════════════════════════════════════════════

-- ── 1) atlas_people.clients ───────────────────────────────────────────

create table if not exists atlas_people.clients (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references atlas_people.tenants(id) on delete cascade,
  name        text not null,
  pays        text not null default 'CI',
  effectif    int  not null default 0,
  status      text not null default 'actif'
              check (status in ('actif', 'en_attente', 'suspendu')),
  modules     text[] not null default '{}',
  contact     text,
  email       text,
  secteur     text,
  ville       text,
  depuis      text,
  conformite  int  not null default 0 check (conformite between 0 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists clients_tenant_idx on atlas_people.clients (tenant_id);

alter table atlas_people.clients enable row level security;

drop policy if exists clients_select on atlas_people.clients;
create policy clients_select on atlas_people.clients for select
  using (tenant_id in (select atlas_people.current_tenant_ids()));

drop policy if exists clients_insert on atlas_people.clients;
create policy clients_insert on atlas_people.clients for insert
  with check (
    tenant_id in (select atlas_people.current_tenant_ids())
    and atlas_people.is_hr_or_admin(tenant_id)
  );

drop policy if exists clients_update on atlas_people.clients;
create policy clients_update on atlas_people.clients for update
  using (atlas_people.is_hr_or_admin(tenant_id))
  with check (atlas_people.is_hr_or_admin(tenant_id));

drop policy if exists clients_delete on atlas_people.clients;
create policy clients_delete on atlas_people.clients for delete
  using (atlas_people.is_hr_or_admin(tenant_id));

-- ── 2) atlas_people.workers ───────────────────────────────────────────

create table if not exists atlas_people.workers (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references atlas_people.tenants(id) on delete cascade,
  nom           text not null,
  poste         text,
  site_client   text,
  client_id     uuid references atlas_people.clients(id) on delete set null,
  pays          text not null default 'CI',
  debut_mission date,
  fin_mission   date,
  status        text not null default 'disponible'
                check (status in ('en_mission', 'disponible', 'fin_mission')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists workers_tenant_idx on atlas_people.workers (tenant_id);
create index if not exists workers_client_idx on atlas_people.workers (client_id);

alter table atlas_people.workers enable row level security;

drop policy if exists workers_select on atlas_people.workers;
create policy workers_select on atlas_people.workers for select
  using (tenant_id in (select atlas_people.current_tenant_ids()));

drop policy if exists workers_insert on atlas_people.workers;
create policy workers_insert on atlas_people.workers for insert
  with check (
    tenant_id in (select atlas_people.current_tenant_ids())
    and atlas_people.is_hr_or_admin(tenant_id)
  );

drop policy if exists workers_update on atlas_people.workers;
create policy workers_update on atlas_people.workers for update
  using (atlas_people.is_hr_or_admin(tenant_id))
  with check (atlas_people.is_hr_or_admin(tenant_id));

drop policy if exists workers_delete on atlas_people.workers;
create policy workers_delete on atlas_people.workers for delete
  using (atlas_people.is_hr_or_admin(tenant_id));
