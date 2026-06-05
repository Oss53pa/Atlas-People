-- ════════════════════════════════════════════════════════════════════
-- 0031 — Tables du module Reporting (retrospectivement documentées).
--
-- Ces tables ont été déployées via Supabase MCP lors de la livraison
-- du module Reporting (sprint 174-179). Ce fichier documente le schéma
-- exact pour reproductibilité CI/CD et disaster recovery.
-- Toutes les instructions sont idempotentes (IF NOT EXISTS / OR REPLACE).
-- ════════════════════════════════════════════════════════════════════

-- ── Rapports sauvegardés ──────────────────────────────────────────────
create table if not exists atlas_people.atlas_people_reports (
  id            bigserial primary key,
  tenant_id     uuid not null,
  title         text not null,
  type          text not null default 'rh',
  author        text not null default '',
  status        text not null default 'draft'
    check (status in ('draft','review','approved','archived')),
  content       text not null default '{}',  -- JSON sérialisé du ReportConfig
  created_at    bigint not null default extract(epoch from now())::bigint,
  updated_at    bigint not null default extract(epoch from now())::bigint
);

create index if not exists idx_reports_tenant
  on atlas_people.atlas_people_reports(tenant_id, updated_at desc);

-- ── Templates de rapport ─────────────────────────────────────────────
create table if not exists atlas_people.atlas_people_report_templates (
  id            bigserial primary key,
  tenant_id     uuid not null,
  name          text not null,
  author        text not null default '',
  config        text not null default '{}',  -- JSON sérialisé de la config blocs
  created_at    bigint not null default extract(epoch from now())::bigint,
  updated_at    bigint not null default extract(epoch from now())::bigint
);

create index if not exists idx_report_templates_tenant
  on atlas_people.atlas_people_report_templates(tenant_id);

-- ── RLS ──────────────────────────────────────────────────────────────
alter table atlas_people.atlas_people_reports enable row level security;
alter table atlas_people.atlas_people_report_templates enable row level security;

drop policy if exists reports_select on atlas_people.atlas_people_reports;
create policy reports_select on atlas_people.atlas_people_reports for select
  using (tenant_id in (select t from atlas_people.current_tenant_ids() t));

drop policy if exists reports_write on atlas_people.atlas_people_reports;
create policy reports_write on atlas_people.atlas_people_reports for all
  using (atlas_people.is_hr_or_admin(tenant_id))
  with check (atlas_people.is_hr_or_admin(tenant_id));

drop policy if exists report_tmpl_select on atlas_people.atlas_people_report_templates;
create policy report_tmpl_select on atlas_people.atlas_people_report_templates for select
  using (tenant_id in (select t from atlas_people.current_tenant_ids() t));

drop policy if exists report_tmpl_write on atlas_people.atlas_people_report_templates;
create policy report_tmpl_write on atlas_people.atlas_people_report_templates for all
  using (atlas_people.is_hr_or_admin(tenant_id))
  with check (atlas_people.is_hr_or_admin(tenant_id));
