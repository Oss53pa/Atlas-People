-- ============================================================================
-- Atlas People — Portail Manager (MSS) — M8  Reporting & pilotage
--                                        M9  Ma pratique managériale
--                                        M10 Paramètres manager (délégations)
-- Réf. 09_REPORTING_PILOTAGE.md (REP.1–9), 10_MA_PRATIQUE.md (PRA.1–7),
--      11_PARAMETRES.md (PAR.1–5).
--
-- Règles dures honorées :
--   R12 : masse salariale TOUJOURS agrégée ; aucune ligne individuelle.
--         Toute agrégation est masquée si le périmètre compte < 5 personnes
--         (MIN_AGG=5, anti ré-identification). Les vues de reporting ne stockent
--         donc QUE des agrégats ; aucune table « par salarié » côté masse.
--   M9  : feedback ascendant ANONYMISÉ (aucune colonne auteur). Le score
--         d'efficacité est visible manager + N+1 + RH, JAMAIS par les N-1.
--   M10 : délégation max 90 jours (contrainte CHECK). Le délégué doit être un
--         manager de niveau équivalent ou supérieur (contrôlé applicativement +
--         audit). Périmètres non délégables par défaut (évaluations, période
--         d'essai, recrutement). Audit fort : decided_by + delegated_by +
--         audit_hash (chaîne SHA-256). N-1 notifiés à l'ouverture/clôture.
--   R8  : périmètre = cascade (supervises_in_chain, 0016).
-- ============================================================================

-- ===========================================================================
-- M8 — REPORTING & PILOTAGE
-- ===========================================================================

-- REP.8 — Dashboards personnalisés du manager (builder).
create table if not exists manager_custom_dashboards (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists idx_mcd_manager on manager_custom_dashboards(tenant_id, manager_id);

-- REP.8 — Widgets d'un dashboard. Métrique référencée par clé applicative ;
-- seules des métriques AGRÉGÉES sont autorisées (jamais d'individuel — R12).
create table if not exists manager_custom_widgets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  dashboard_id uuid not null references manager_custom_dashboards(id) on delete cascade,
  metric_key text not null,                 -- ex. headcount, payroll_mass, okr_progress
  viz text not null default 'kpi' check (viz in ('kpi','vbars','hbars','stack','gauge','line')),
  position int not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_mcw_dashboard on manager_custom_widgets(tenant_id, dashboard_id);

-- REP.9 — Historique des exports (filigrane + audit obligatoire).
create table if not exists manager_exports_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  export_kind text not null,                -- ex. effectif, masse_salariale_agregee, formation
  fmt text not null check (fmt in ('pdf','xlsx','csv')),
  scope_depth text not null check (scope_depth in ('direct','department','all')),
  row_count int,                            -- nb d'agrégats exportés (jamais d'individuel sensible)
  watermark text not null,                  -- filigrane « confidentiel — <manager> — <ts> »
  audit_hash text not null,                 -- empreinte SHA-256 de l'export
  created_at timestamptz default now()
);
create index if not exists idx_meh_manager on manager_exports_history(tenant_id, manager_id);

-- ===========================================================================
-- M9 — MA PRATIQUE MANAGÉRIALE
-- ===========================================================================

-- PRA.2 — Rituels managériaux planifiés (1:1, réunions équipe, feedback…).
create table if not exists manager_rituals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  label text not null,
  cadence text not null check (cadence in ('weekly','biweekly','monthly','quarterly','adhoc')),
  active boolean not null default true,
  created_at timestamptz default now()
);
create index if not exists idx_mr_manager on manager_rituals(tenant_id, manager_id);

-- PRA.2 — Occurrences d'un rituel (suivi de régularité).
create table if not exists ritual_occurrences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  ritual_id uuid not null references manager_rituals(id) on delete cascade,
  due_on date not null,
  status text not null default 'planned' check (status in ('planned','done','skipped','late')),
  done_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_ro_ritual on ritual_occurrences(tenant_id, ritual_id);

-- PRA.3 — Feedback reçu sur la posture managériale.
-- Le feedback ASCENDANT (par les N-1) est ANONYME : aucune colonne auteur,
-- agrégé par axe et stocké en verbatims détachés de l'identité (M9 §confid.).
create table if not exists manager_feedback_received (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  direction text not null check (direction in ('ascending','descending','lateral')),
  axis text not null,                       -- ex. clarté, écoute, équité
  score numeric(3,2),                       -- moyenne agrégée sur l'axe
  respondents int,                          -- nb de répondants (masqué si < 5 pour ascending)
  verbatim text,                            -- détaché de toute identité (ascending = anonyme strict)
  period text not null,                     -- ex. 2026-T1
  created_at timestamptz default now(),
  -- Garde-fou anti ré-identification du feedback ascendant anonyme.
  constraint mfr_ascending_anon check (direction <> 'ascending' or respondents is null or respondents >= 5)
);
create index if not exists idx_mfr_manager on manager_feedback_received(tenant_id, manager_id);

-- PRA.3 — Plan de progrès personnel du manager.
create table if not exists manager_improvement_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  axis text not null,
  action text not null,
  target_date date,
  status text not null default 'open' check (status in ('open','in_progress','done','dropped')),
  created_at timestamptz default now()
);
create index if not exists idx_mip_manager on manager_improvement_plans(tenant_id, manager_id);

-- PRA.6 — Catégories de ressources manager (référentiel léger).
create table if not exists manager_resources_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  label text not null,
  position int not null default 0
);

-- PRA.6 — Ressources manager (guides, trames, articles).
create table if not exists manager_resources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  category_id uuid references manager_resources_categories(id) on delete set null,
  title text not null,
  kind text not null check (kind in ('guide','template','article','video','tool')),
  url text,
  created_at timestamptz default now()
);
create index if not exists idx_mres_cat on manager_resources(tenant_id, category_id);

-- PRA.7 — Score d'efficacité managériale.
-- Visibilité : manager concerné + N+1 + RH. JAMAIS visible par les N-1
-- (filtre applicatif + RLS : seul le manager lui-même, sa hiérarchie au-dessus,
--  ou la RH peuvent lire — voir policy mes_visibility).
create table if not exists manager_effectiveness_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  period text not null,                     -- ex. 2026-T1
  global_score numeric(3,2) not null,
  components jsonb not null default '{}'::jsonb,  -- {ritualRegularity, 360, kpi, ...}
  created_at timestamptz default now(),
  unique (tenant_id, manager_id, period)
);
create index if not exists idx_mes_manager on manager_effectiveness_scores(tenant_id, manager_id);

-- ===========================================================================
-- M10 — PARAMÈTRES MANAGER
-- ===========================================================================

-- PAR.1 — Matrice de préférences de notification (par événement × canal).
create table if not exists manager_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  event_key text not null,                  -- ex. leave_request, anomaly, eval_due
  channels text[] not null default '{}',    -- sous-ensemble de push/email/sms/whatsapp/inapp
  created_at timestamptz default now(),
  unique (tenant_id, manager_id, event_key)
);
create index if not exists idx_mnp_manager on manager_notification_preferences(tenant_id, manager_id);

-- PAR.2 — Délégations temporaires de responsabilité managériale.
-- max 90 jours ; délégué = manager de niveau >= (contrôle applicatif + audit) ;
-- périmètres non délégables par défaut (évaluation, période d'essai, recrutement).
create table if not exists manager_delegations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),       -- titulaire (délégant)
  delegate_id uuid not null references employees(id),      -- délégué (manager >=)
  start_on date not null,
  end_on date not null,
  reason text not null check (reason in ('vacances','mission','formation','maladie','autre')),
  scope text[] not null default '{}',       -- portées explicitement déléguées
  message text,
  status text not null default 'pending'
    check (status in ('pending','accepted','active','expired','revoked','declined')),
  -- Audit fort (M10 §audit).
  decided_by uuid references employees(id), -- qui a accepté/refusé côté délégué
  delegated_by uuid not null references employees(id),     -- = manager_id (traçabilité)
  audit_hash text not null,                 -- empreinte SHA-256 de l'acte de délégation
  created_at timestamptz default now(),
  -- Durée bornée à 90 jours pleins.
  constraint mdg_max_90d check (end_on >= start_on and (end_on - start_on) <= 90),
  -- Pas d'auto-délégation.
  constraint mdg_not_self check (delegate_id <> manager_id)
);
create index if not exists idx_mdg_manager on manager_delegations(tenant_id, manager_id);
create index if not exists idx_mdg_delegate on manager_delegations(tenant_id, delegate_id);

-- PAR.2 — Journal des actions effectuées SOUS délégation (« délégué par vous »).
-- Chaque acte du délégué est tracé avec decided_by + delegated_by + hash chaîné.
create table if not exists delegation_actions_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  delegation_id uuid not null references manager_delegations(id) on delete cascade,
  action_kind text not null,                -- ex. leave_approved, expense_validated
  target_ref text,                          -- référence de l'objet impacté
  performed_by uuid not null references employees(id),     -- le délégué
  on_behalf_of uuid not null references employees(id),     -- le titulaire
  prev_hash text,                           -- chaînage SHA-256 (intégrité)
  audit_hash text not null,
  created_at timestamptz default now()
);
create index if not exists idx_dal_delegation on delegation_actions_log(tenant_id, delegation_id);

-- PAR.3 / PAR.4 — Préférences de vue & profondeur par défaut du manager.
create table if not exists manager_preferences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id) unique,
  default_team_depth text not null default 'direct'
    check (default_team_depth in ('direct','department','all')),
  default_team_view text not null default 'cards'
    check (default_team_view in ('cards','table','org')),
  default_team_sort text not null default 'name',
  team_columns text[] not null default '{}',  -- colonnes activées (jamais de salaire)
  default_planning_view text not null default 'week'
    check (default_planning_view in ('week','month')),
  global_notif_mode text not null default 'normal'
    check (global_notif_mode in ('normal','focus','holiday')),
  quiet_hours_enabled boolean not null default true,
  updated_at timestamptz default now()
);

-- PAR.5 — Modèles managériaux personnels (1:1, feedback, entretien, comm.).
create table if not exists manager_custom_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  category text not null check (category in ('one_on_one','feedback','interview','team_comm')),
  label text not null,
  body text,
  is_org boolean not null default false,    -- modèle organisation (RH) vs personnel
  created_at timestamptz default now()
);
create index if not exists idx_mct_manager on manager_custom_templates(tenant_id, manager_id);

-- ===========================================================================
-- RLS — périmètre managérial strict (R8) + visibilité score (M9) + audit (M10)
-- ===========================================================================
alter table manager_custom_dashboards enable row level security;
alter table manager_custom_widgets enable row level security;
alter table manager_exports_history enable row level security;
alter table manager_rituals enable row level security;
alter table ritual_occurrences enable row level security;
alter table manager_feedback_received enable row level security;
alter table manager_improvement_plans enable row level security;
alter table manager_resources_categories enable row level security;
alter table manager_resources enable row level security;
alter table manager_effectiveness_scores enable row level security;
alter table manager_notification_preferences enable row level security;
alter table manager_delegations enable row level security;
alter table delegation_actions_log enable row level security;
alter table manager_preferences enable row level security;
alter table manager_custom_templates enable row level security;

-- M8 — Dashboards/widgets/exports : strictement le manager propriétaire (+ RH).
drop policy if exists mcd_owner on manager_custom_dashboards;
create policy mcd_owner on manager_custom_dashboards
  using (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)));

drop policy if exists mcw_via_dashboard on manager_custom_widgets;
create policy mcw_via_dashboard on manager_custom_widgets
  using (
    tenant_id in (select current_tenant_ids())
    and exists (select 1 from manager_custom_dashboards d where d.id = dashboard_id
                and (d.manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and exists (select 1 from manager_custom_dashboards d where d.id = dashboard_id
                and (d.manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  );

drop policy if exists meh_owner on manager_exports_history;
create policy meh_owner on manager_exports_history
  using (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and manager_id in (select current_employee_ids()));

-- M9 — Rituels & occurrences & plan & feedback : le manager concerné (+ RH).
drop policy if exists mr_owner on manager_rituals;
create policy mr_owner on manager_rituals
  using (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)));

drop policy if exists ro_via_ritual on ritual_occurrences;
create policy ro_via_ritual on ritual_occurrences
  using (
    tenant_id in (select current_tenant_ids())
    and exists (select 1 from manager_rituals r where r.id = ritual_id
                and (r.manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and exists (select 1 from manager_rituals r where r.id = ritual_id
                and (r.manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  );

-- Feedback reçu : visible par le manager concerné + sa hiérarchie au-dessus + RH.
-- L'ANONYMAT du feedback ascendant est garanti par le schéma (aucune colonne auteur),
-- jamais par cette policy de lecture.
drop policy if exists mfr_visibility on manager_feedback_received;
create policy mfr_visibility on manager_feedback_received
  using (
    tenant_id in (select current_tenant_ids())
    and (
      manager_id in (select current_employee_ids())          -- le manager lui-même
      or supervises_in_chain(manager_id)                      -- sa hiérarchie (N+1…)
      or is_hr_or_admin(tenant_id)
    )
  )
  with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));

drop policy if exists mip_owner on manager_improvement_plans;
create policy mip_owner on manager_improvement_plans
  using (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)));

-- Ressources & catégories : lecture pour tout le tenant, écriture RH.
drop policy if exists mrc_read on manager_resources_categories;
create policy mrc_read on manager_resources_categories
  using (tenant_id in (select current_tenant_ids()))
  with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));

drop policy if exists mres_read on manager_resources;
create policy mres_read on manager_resources
  using (tenant_id in (select current_tenant_ids()))
  with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));

-- Score d'efficacité : manager concerné + N+1 (hiérarchie) + RH. JAMAIS les N-1.
-- supervises_in_chain(manager_id) est vrai pour la hiérarchie AU-DESSUS du manager ;
-- un N-1 ne supervise pas son propre manager → il ne peut pas lire son score.
drop policy if exists mes_visibility on manager_effectiveness_scores;
create policy mes_visibility on manager_effectiveness_scores
  using (
    tenant_id in (select current_tenant_ids())
    and (
      manager_id in (select current_employee_ids())          -- le manager concerné
      or supervises_in_chain(manager_id)                      -- N+1 et au-dessus
      or is_hr_or_admin(tenant_id)
    )
  )
  with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));

-- M10 — Préférences de notification : strictement le manager (+ RH).
drop policy if exists mnp_owner on manager_notification_preferences;
create policy mnp_owner on manager_notification_preferences
  using (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and manager_id in (select current_employee_ids()));

-- Délégations : visibles par le titulaire, le délégué, et la RH.
drop policy if exists mdg_parties on manager_delegations;
create policy mdg_parties on manager_delegations
  using (
    tenant_id in (select current_tenant_ids())
    and (
      manager_id in (select current_employee_ids())
      or delegate_id in (select current_employee_ids())
      or is_hr_or_admin(tenant_id)
    )
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and manager_id in (select current_employee_ids())        -- seul le titulaire ouvre/révoque
  );

-- Journal des actions déléguées : titulaire + délégué + RH (lecture seule applicative).
drop policy if exists dal_parties on delegation_actions_log;
create policy dal_parties on delegation_actions_log
  using (
    tenant_id in (select current_tenant_ids())
    and exists (select 1 from manager_delegations d where d.id = delegation_id
                and (d.manager_id in (select current_employee_ids())
                     or d.delegate_id in (select current_employee_ids())
                     or is_hr_or_admin(tenant_id)))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and performed_by in (select current_employee_ids())
  );

-- Préférences & modèles : strictement le manager (+ RH).
drop policy if exists mp_owner on manager_preferences;
create policy mp_owner on manager_preferences
  using (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)));

drop policy if exists mct_owner on manager_custom_templates;
create policy mct_owner on manager_custom_templates
  using (
    tenant_id in (select current_tenant_ids())
    and (manager_id in (select current_employee_ids()) or is_org or is_hr_or_admin(tenant_id))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and ((manager_id in (select current_employee_ids()) and is_org = false) or is_hr_or_admin(tenant_id))
  );
