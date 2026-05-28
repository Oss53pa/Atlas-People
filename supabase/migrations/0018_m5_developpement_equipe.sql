-- ============================================================================
-- Atlas People — Portail Manager (MSS) — M5 Développement équipe
-- Réf. 06_DEVELOPPEMENT_EQUIPE.md (DEV.1–9). Plan de développement, validation
-- de formations, mobilité interne, succession et mentorat.
--
-- Règles dures honorées (06 §10) :
--   Souhaits privés des N-1 invisibles (employee_development_wishes.visible_to_manager).
--   Candidatures mobilité interne : mode discret/transparent respecté.
--   Successeurs identifiés JAMAIS révélés à l'intéressé par le système.
--   Validation formation : manager PUIS RH (budget) — double étape.
--   R8 : périmètre = cascade (supervises_in_chain, 0016). Aucun montant salarial.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- DEV.3 — visibilité manager des souhaits (la table existe ; on garantit le flag).
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.employee_development_wishes') is not null then
    alter table employee_development_wishes add column if not exists visible_to_manager boolean default false;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- DEV.5 — Retour managérial post-formation.
-- ---------------------------------------------------------------------------
create table if not exists manager_training_feedback (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  employee_id uuid not null references employees(id) on delete cascade,
  training_label text not null,
  skill_acquired boolean,
  applied_on_job boolean,
  recommend_to_others boolean,
  comment text,
  created_at timestamptz default now()
);
create index if not exists idx_mtf_manager on manager_training_feedback(tenant_id, manager_id);

-- ---------------------------------------------------------------------------
-- DEV.6 — Plan de développement équipe (soumis à la RH) + items.
-- ---------------------------------------------------------------------------
create table if not exists team_development_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  year int not null,
  budget_allocated numeric default 0,   -- budget FORMATION collectif (jamais salaire)
  status text not null default 'draft' check (status in ('draft','submitted','approved','rejected')),
  submitted_at timestamptz,
  created_at timestamptz default now(),
  unique (tenant_id, manager_id, year)
);

create table if not exists team_development_plan_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  plan_id uuid not null references team_development_plans(id) on delete cascade,
  priority int not null,
  title text not null,
  action text,
  estimated_cost numeric default 0,
  expected_impact text,
  target_employee_id uuid references employees(id),
  created_at timestamptz default now()
);
create index if not exists idx_tdpi_plan on team_development_plan_items(tenant_id, plan_id);

-- ---------------------------------------------------------------------------
-- DEV.7 — Propositions d'opportunité de mobilité (non contraignantes).
-- ---------------------------------------------------------------------------
create table if not exists internal_mobility_proposals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  proposer_id uuid not null references employees(id),
  recipient_id uuid not null references employees(id) on delete cascade,
  job_opening_id uuid,
  message text,
  include_job_detail boolean default true,
  status text not null default 'sent' check (status in ('sent','viewed','applied','declined')),
  created_at timestamptz default now()
);
create index if not exists idx_imp_recipient on internal_mobility_proposals(tenant_id, recipient_id);

-- ---------------------------------------------------------------------------
-- DEV.8 — Plan de succession. Confidentialité forte : visible manager/RH/DG.
-- ---------------------------------------------------------------------------
create table if not exists succession_plan_positions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  position_label text not null,
  position_holder_id uuid references employees(id),
  is_critical boolean default true,
  successors_needed int not null default 1,
  created_at timestamptz default now()
);
create index if not exists idx_spp_manager on succession_plan_positions(tenant_id, manager_id);

create table if not exists succession_plan_successors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  position_id uuid not null references succession_plan_positions(id) on delete cascade,
  successor_id uuid not null references employees(id) on delete cascade,
  maturity text not null default 't12' check (maturity in ('ready','t6','t12')),
  development_plan text,
  -- le successeur n'est PAS notifié ; aucun champ ne déclenche d'info côté intéressé
  created_at timestamptz default now(),
  unique (position_id, successor_id)
);
create index if not exists idx_sps_position on succession_plan_successors(tenant_id, position_id);

-- ---------------------------------------------------------------------------
-- DEV.9 — Mentorat : relations + séances.
-- ---------------------------------------------------------------------------
create table if not exists mentoring_relationships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  mentor_id uuid not null references employees(id) on delete cascade,
  mentee_id uuid not null references employees(id) on delete cascade,
  skill text,
  cadence text check (cadence in ('weekly','biweekly','monthly')),
  started_on date,
  sessions_planned int default 8,
  status text not null default 'active' check (status in ('active','completed','paused')),
  created_by uuid references employees(id),
  created_at timestamptz default now(),
  check (mentor_id <> mentee_id)
);
create index if not exists idx_mentor_rel on mentoring_relationships(tenant_id, mentor_id);
create index if not exists idx_mentee_rel on mentoring_relationships(tenant_id, mentee_id);

create table if not exists mentoring_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  relationship_id uuid not null references mentoring_relationships(id) on delete cascade,
  held_on date,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_mentor_sess on mentoring_sessions(tenant_id, relationship_id);

-- ---------------------------------------------------------------------------
-- RLS — périmètre cascade (supervises_in_chain) / parties prenantes / RH.
-- ---------------------------------------------------------------------------
alter table manager_training_feedback enable row level security;
alter table team_development_plans enable row level security;
alter table team_development_plan_items enable row level security;
alter table internal_mobility_proposals enable row level security;
alter table succession_plan_positions enable row level security;
alter table succession_plan_successors enable row level security;
alter table mentoring_relationships enable row level security;
alter table mentoring_sessions enable row level security;

-- Retour formation : manager auteur, RH, et collaborateur concerné (lecture).
drop policy if exists mtf_scope on manager_training_feedback;
create policy mtf_scope on manager_training_feedback
  using (
    tenant_id in (select current_tenant_ids())
    and (manager_id in (select current_employee_ids())
         or employee_id in (select current_employee_ids())
         or supervises_in_chain(employee_id)
         or is_hr_or_admin(tenant_id))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and (manager_id in (select current_employee_ids()) or supervises_in_chain(employee_id) or is_hr_or_admin(tenant_id))
  );

-- Plan de dév. : manager propriétaire + RH.
drop policy if exists tdp_owner on team_development_plans;
create policy tdp_owner on team_development_plans
  using (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)));

drop policy if exists tdpi_via_plan on team_development_plan_items;
create policy tdpi_via_plan on team_development_plan_items
  using (
    tenant_id in (select current_tenant_ids())
    and exists (select 1 from team_development_plans p where p.id = plan_id
                and (p.manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  )
  with check (tenant_id in (select current_tenant_ids()));

-- Mobilité : proposeur, destinataire, RH.
drop policy if exists imp_parties on internal_mobility_proposals;
create policy imp_parties on internal_mobility_proposals
  using (
    tenant_id in (select current_tenant_ids())
    and (proposer_id in (select current_employee_ids())
         or recipient_id in (select current_employee_ids())
         or is_hr_or_admin(tenant_id))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and proposer_id in (select current_employee_ids())
  );

-- Succession : manager propriétaire + RH/DG UNIQUEMENT. Jamais le successeur,
-- ni la cascade descendante — confidentialité forte (06 §8.3).
drop policy if exists spp_owner on succession_plan_positions;
create policy spp_owner on succession_plan_positions
  using (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)));

drop policy if exists sps_owner_only on succession_plan_successors;
create policy sps_owner_only on succession_plan_successors
  using (
    tenant_id in (select current_tenant_ids())
    and exists (select 1 from succession_plan_positions p where p.id = position_id
                and (p.manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and exists (select 1 from succession_plan_positions p where p.id = position_id
                and (p.manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  );

-- Mentorat : mentor, mentee, créateur (manager) et RH.
drop policy if exists mentor_rel_scope on mentoring_relationships;
create policy mentor_rel_scope on mentoring_relationships
  using (
    tenant_id in (select current_tenant_ids())
    and (mentor_id in (select current_employee_ids())
         or mentee_id in (select current_employee_ids())
         or created_by in (select current_employee_ids())
         or supervises_in_chain(mentee_id)
         or is_hr_or_admin(tenant_id))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and (created_by in (select current_employee_ids()) or supervises_in_chain(mentee_id) or is_hr_or_admin(tenant_id))
  );

drop policy if exists mentor_sess_via_rel on mentoring_sessions;
create policy mentor_sess_via_rel on mentoring_sessions
  using (
    tenant_id in (select current_tenant_ids())
    and exists (select 1 from mentoring_relationships r where r.id = relationship_id
                and (r.mentor_id in (select current_employee_ids())
                     or r.mentee_id in (select current_employee_ids())
                     or r.created_by in (select current_employee_ids())
                     or supervises_in_chain(r.mentee_id)
                     or is_hr_or_admin(tenant_id)))
  )
  with check (tenant_id in (select current_tenant_ids()));

comment on table succession_plan_successors is
  '06 §8.3 : successeurs identifiés. CONFIDENTIEL — jamais notifié à l''intéressé par le système. Lecture : manager propriétaire + RH/DG. Audit fort applicatif.';
comment on column team_development_plans.budget_allocated is
  'Budget FORMATION collectif (jamais salaire individuel). R12 préservée.';
