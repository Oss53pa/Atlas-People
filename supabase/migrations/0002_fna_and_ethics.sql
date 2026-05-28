-- ============================================================================
-- Atlas People — Annexe technique : interface Atlas FNA, RLS affinées,
-- vues agrégées éthiques (anonymisation par seuil d'effectif).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- B.4 — Idempotence du déversement comptable (un run posté UNE seule fois)
-- ---------------------------------------------------------------------------
create table if not exists fna_postings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  run_id uuid not null references payroll_runs (id) on delete cascade,
  posted_at timestamptz not null default now(),
  -- Référence bidirectionnelle + protection anti-doublon comptable.
  unique (run_id)
);
create index on fna_postings (tenant_id);

alter table fna_postings enable row level security;
create policy tenant_isolation on fna_postings
  using (tenant_id in (select current_tenant_ids()))
  with check (tenant_id in (select current_tenant_ids()));

-- Garde-fou : refuse un second déversement du même run.
create or replace function post_run_to_fna(p_run_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into fna_postings (tenant_id, run_id)
  select tenant_id, id from payroll_runs where id = p_run_id;
  update payroll_runs set posted_to_fna = true, status = 'posted' where id = p_run_id;
exception
  when unique_violation then
    raise exception 'Run % déjà déversé dans Atlas FNA (idempotence)', p_run_id;
end $$;

-- ---------------------------------------------------------------------------
-- C.3 — Bulletins : un employé ne voit QUE son bulletin ; RH/admin voient tout
-- ---------------------------------------------------------------------------
drop policy if exists tenant_isolation on payslips;

create policy payslip_self_or_hr on payslips
  using (
    tenant_id in (select current_tenant_ids())
    and (
      employee_id in (select id from employees where user_id = auth.uid())
      or exists (
        select 1 from memberships m
        where m.user_id = auth.uid()
          and m.tenant_id = payslips.tenant_id
          and m.role in ('hr', 'admin')
      )
    )
  )
  with check (tenant_id in (select current_tenant_ids()));

-- ---------------------------------------------------------------------------
-- C.4 — Écoute sociale éthique : agrégation par seuil (≥ 5), jamais nominatif
-- (Point D.4 : seuil d'anonymisation = 5)
-- ---------------------------------------------------------------------------
create or replace view feedback_aggregate
with (security_invoker = true) as
  select
    tenant_id,
    department,
    count(*) as responses,
    round(avg(sentiment), 2) as avg_sentiment
  from feedback_signals
  group by tenant_id, department
  having count(*) >= 5; -- pas de ré-identification sous 5 personnes

create or replace view turnover_aggregate
with (security_invoker = true) as
  select
    tenant_id,
    scope,
    round(avg(attention_score), 2) as avg_attention,
    max(suggested_care_action) as suggested_care_action
  from turnover_predictions
  group by tenant_id, scope;

comment on view feedback_aggregate is
  'Écoute sociale agrégée — seuil minimal de 5 réponses pour empêcher toute ré-identification (cahier §2.4, §10).';
comment on view turnover_aggregate is
  'Signaux de rétention agrégés par périmètre, orientés soin — jamais de score punitif individuel exposé.';
