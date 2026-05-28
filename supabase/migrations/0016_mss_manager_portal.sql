-- ============================================================================
-- Atlas People — Portail Manager (MSS) — fondation
-- Réf. 01_FONDATION §3, §8. Tables de la cascade managériale, délégations
-- temporaires, préférences et rituels. RLS managériale PROFONDE (au-delà du N-1
-- direct de 0015) : un manager voit les données de sa cascade jusqu'à la
-- profondeur autorisée par sa préférence.
--
-- Règles dures honorées (01_FONDATION §6) :
--   R2/R3/R4/R5  : aucune table de rémunération/famille/versement/médical n'est
--                  élargie ici — la cascade ne donne accès qu'à l'OPÉRATIONNEL.
--   R8           : le périmètre est strictement la cascade (employee_management_chain).
--   R10/R11      : délégations tracées (source_surface='mss' côté audit_log 0013).
--   R12          : masse salariale agrégée uniquement (vue dédiée, jamais ligne).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 8.1 — Cascade managériale précalculée.
-- depth=1 : N-1 direct ; depth=2 : N-2 ; etc. Une ligne par couple (collab, encadrant).
-- ---------------------------------------------------------------------------
create table if not exists employee_management_chain (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  employee_id uuid not null references employees(id) on delete cascade,
  manager_id uuid not null references employees(id) on delete cascade,
  depth int not null check (depth >= 1),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  unique (tenant_id, employee_id, manager_id, effective_from)
);
create index if not exists idx_emc_manager on employee_management_chain(tenant_id, manager_id, depth) where effective_to is null;
create index if not exists idx_emc_employee on employee_management_chain(tenant_id, employee_id, depth) where effective_to is null;

comment on table employee_management_chain is
  'Cascade hiérarchique précalculée (01_FONDATION §3.3). Recalculée par recompute_management_chain() sur changement de employees.manager_id.';

-- ---------------------------------------------------------------------------
-- 8.2 — Délégations temporaires de validations.
-- ---------------------------------------------------------------------------
create table if not exists manager_delegations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  delegator_id uuid not null references employees(id),
  delegate_id uuid not null references employees(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  scope_leaves boolean default true,
  scope_overtime boolean default true,
  scope_expenses boolean default true,
  scope_trainings boolean default true,
  scope_team_requests boolean default true,
  reason text,
  status text not null default 'pending' check (status in ('pending','accepted','active','expired','revoked')),
  delegate_acceptance_at timestamptz,
  created_at timestamptz default now(),
  check (ends_at > starts_at)
);
create index if not exists idx_mdel_delegator on manager_delegations(tenant_id, delegator_id, status);
create index if not exists idx_mdel_delegate on manager_delegations(tenant_id, delegate_id, status);

-- ---------------------------------------------------------------------------
-- 8.3 — Préférences manager (profondeur par défaut, vue, notifications…).
-- ---------------------------------------------------------------------------
create table if not exists manager_preferences (
  manager_id uuid primary key references employees(id),
  tenant_id uuid not null,
  default_team_depth text default 'direct' check (default_team_depth in ('direct','department','all')),
  default_team_view text default 'list' check (default_team_view in ('list','cards','org_chart')),
  notification_matrix jsonb,
  custom_kpi_dashboard jsonb,
  rituals_config jsonb,
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 8.4 — Rituels managériaux (1:1 hebdo, revue OKR mensuelle…).
-- ---------------------------------------------------------------------------
create table if not exists manager_rituals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  ritual_type text not null,
  cadence text not null check (cadence in ('weekly','biweekly','monthly','quarterly')),
  next_occurrence date,
  last_completed_at timestamptz,
  reminders_enabled boolean default true,
  custom_config jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_mrit_manager on manager_rituals(tenant_id, manager_id);

-- ---------------------------------------------------------------------------
-- Recalcul de la cascade : parcours en largeur de employees.manager_id.
-- Idempotent par tenant : purge puis réinsère les lignes actives.
-- ---------------------------------------------------------------------------
create or replace function recompute_management_chain(p_tenant uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from employee_management_chain where tenant_id = p_tenant;
  with recursive chain as (
    -- N-1 directs
    select e.id as employee_id, e.manager_id, 1 as depth, e.manager_id as top_manager
    from employees e
    where e.tenant_id = p_tenant and e.manager_id is not null
    union all
    -- remontée : pour chaque (collab, encadrant à depth d), ajouter l'encadrant de l'encadrant
    select c.employee_id, m.manager_id, c.depth + 1, m.manager_id
    from chain c
    join employees m on m.id = c.top_manager
    where m.manager_id is not null and c.depth < 8
  )
  insert into employee_management_chain (tenant_id, employee_id, manager_id, depth)
  select p_tenant, employee_id, top_manager, depth
  from chain
  where top_manager is not null
  on conflict do nothing;
end $$;

comment on function recompute_management_chain(uuid) is
  'Reconstruit employee_management_chain pour un tenant à partir de employees.manager_id (cascade complète, profondeur ≤ 8).';

-- Trigger : tout changement de manager_id recalcule la cascade du tenant.
create or replace function trg_recompute_chain()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform recompute_management_chain(coalesce(new.tenant_id, old.tenant_id));
  return null;
end $$;

drop trigger if exists employees_chain_recompute on employees;
create trigger employees_chain_recompute
  after insert or update of manager_id or delete on employees
  for each row execute function trg_recompute_chain();

-- ---------------------------------------------------------------------------
-- Helpers RLS managériale profonde (depth-aware).
-- ---------------------------------------------------------------------------
-- Profondeur autorisée (int) pour l'utilisateur courant, depuis ses préférences.
-- direct=1, department=2, all=8.
create or replace function current_manager_depth()
returns int
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case mp.default_team_depth
              when 'direct' then 1 when 'department' then 2 when 'all' then 8 else 1 end
       from manager_preferences mp
       where mp.manager_id in (select id from employees where user_id = auth.uid())
       limit 1),
    1
  );
$$;

-- L'utilisateur courant supervise-t-il p_employee dans sa cascade (≤ profondeur autorisée) ?
create or replace function supervises_in_chain(p_employee uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from employee_management_chain c
    where c.employee_id = p_employee
      and c.effective_to is null
      and c.depth <= current_manager_depth()
      and c.manager_id in (select id from employees where user_id = auth.uid())
  );
$$;

comment on function supervises_in_chain(uuid) is
  'Vrai si l''utilisateur courant encadre l''employé dans sa cascade (profondeur ≤ préférence). Étend is_manager_of (N-1) au portail manager multi-niveaux. Ne donne accès qu''à l''opérationnel (jamais paie/famille/médical, R2-R5).';

-- ---------------------------------------------------------------------------
-- RLS sur les nouvelles tables.
-- ---------------------------------------------------------------------------
alter table employee_management_chain enable row level security;
alter table manager_delegations enable row level security;
alter table manager_preferences enable row level security;
alter table manager_rituals enable row level security;

-- Cascade : lisible par RH/admin et par les managers concernés (en tant que manager).
-- Écriture : système/RH uniquement (recompute via security definer).
drop policy if exists emc_scope on employee_management_chain;
create policy emc_scope on employee_management_chain
  using (
    tenant_id in (select current_tenant_ids())
    and (
      is_hr_or_admin(tenant_id)
      or manager_id in (select id from employees where user_id = auth.uid())
      or employee_id in (select current_employee_ids())
    )
  )
  with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));

-- Délégations : le délégant et le délégué les voient ; RH/admin aussi.
drop policy if exists mdel_parties on manager_delegations;
create policy mdel_parties on manager_delegations
  using (
    tenant_id in (select current_tenant_ids())
    and (
      is_hr_or_admin(tenant_id)
      or delegator_id in (select current_employee_ids())
      or delegate_id in (select current_employee_ids())
    )
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and (delegator_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id))
  );

-- Préférences : strictement le manager propriétaire (+ RH/admin en lecture).
drop policy if exists mpref_owner on manager_preferences;
create policy mpref_owner on manager_preferences
  using (
    tenant_id in (select current_tenant_ids())
    and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and manager_id in (select current_employee_ids())
  );

-- Rituels : strictement le manager propriétaire.
drop policy if exists mrit_owner on manager_rituals;
create policy mrit_owner on manager_rituals
  using (
    tenant_id in (select current_tenant_ids())
    and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and manager_id in (select current_employee_ids())
  );

-- ---------------------------------------------------------------------------
-- Élargissement de l'OPÉRATIONNEL au manager multi-niveaux (cascade).
-- On combine le N-1 direct (is_manager_of, 0015) avec la cascade profonde.
-- Aucune table sensible (Tier 1/2/4/5 de 0015) n'est touchée — R2-R7 préservées.
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array[
  'time_entries','leaves','expense_claims','objectives','employee_aptitudes',
  'absences','absence_justifications'
];
begin
  foreach t in array tabs loop
    if to_regclass('public.' || t) is null then continue; end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'employee_id'
    ) then continue; end if;
    execute format('drop policy if exists self_team_or_hr on %I', t);
    execute format('drop policy if exists self_chain_or_hr on %I', t);
    execute format($f$
      create policy self_chain_or_hr on %I
        using (tenant_id in (select current_tenant_ids())
               and (employee_id in (select current_employee_ids())
                    or is_manager_of(employee_id)
                    or supervises_in_chain(employee_id)
                    or is_hr_or_admin(tenant_id)))
        with check (tenant_id in (select current_tenant_ids())
               and (employee_id in (select current_employee_ids())
                    or is_manager_of(employee_id)
                    or supervises_in_chain(employee_id)
                    or is_hr_or_admin(tenant_id)));
    $f$, t);
  end loop;
end $$;

-- evaluations : ajoute la cascade au self/évaluateur/N-1/RH (0015).
do $$
begin
  if to_regclass('public.evaluations') is not null then
    drop policy if exists self_reviewer_team_or_hr on evaluations;
    drop policy if exists self_reviewer_chain_or_hr on evaluations;
    create policy self_reviewer_chain_or_hr on evaluations
      using (
        tenant_id in (select current_tenant_ids())
        and (
          employee_id in (select current_employee_ids())
          or reviewer_id in (select current_employee_ids())
          or is_manager_of(employee_id)
          or supervises_in_chain(employee_id)
          or is_hr_or_admin(tenant_id)
        )
      )
      with check (
        tenant_id in (select current_tenant_ids())
        and (
          reviewer_id in (select current_employee_ids())
          or is_manager_of(employee_id)
          or supervises_in_chain(employee_id)
          or is_hr_or_admin(tenant_id)
        )
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- R12 — Masse salariale AGRÉGÉE par périmètre (jamais individuelle).
-- Vue security definer : ne renvoie qu'un total + effectif si ≥ 5 personnes
-- (seuil anti-réidentification), filtrée sur la cascade du manager.
-- ---------------------------------------------------------------------------
create or replace function team_payroll_mass(p_depth int default 1)
returns table (headcount int, total_gross numeric)
language sql stable security definer set search_path = public as $$
  with scope as (
    select distinct c.employee_id
    from employee_management_chain c
    where c.effective_to is null
      and c.depth <= least(greatest(p_depth, 1), 8)
      and c.manager_id in (select id from employees where user_id = auth.uid())
  )
  select count(*)::int,
         case when count(*) >= 5 then sum(e.base_salary) else null end
  from employees e
  join scope s on s.employee_id = e.id
  where e.tenant_id in (select current_tenant_ids());
$$;

comment on function team_payroll_mass(int) is
  'R12 : masse salariale AGRÉGÉE de la cascade du manager (total masqué si < 5 personnes). Jamais de ligne individuelle.';

revoke all on function team_payroll_mass(int) from public;
grant execute on function team_payroll_mass(int) to authenticated;
