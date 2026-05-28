-- ============================================================================
-- Atlas People — Portail Manager (MSS) — M6 Recrutement & intégration
--                                        M7 Vie quotidienne managériale
-- Réf. 07_RECRUTEMENT_INTEGRATION.md (REC.1–5) et 08_VIE_QUOTIDIENNE.md (VQ.1–7).
--
-- Règles dures honorées :
--   M6 §8 : AUCUNE donnée salariale candidat (la négociation appartient à la RH).
--           Pas de communication directe manager → candidat (canal RH).
--           Décision fin de période d'essai = RECOMMANDATION manager → décision
--           formelle RH/DRH. Audit fort sur consultation profils candidats.
--   M7 §8 : Signalements anonymes JAMAIS ré-identifiables (aucune colonne auteur).
--           Alertes RPS sévères escaladées automatiquement (RH + médecin du travail).
--           Sondages d'engagement agrégés, masqués si périmètre < 5 (seuil anonymat).
--   R8  : périmètre = cascade (supervises_in_chain, 0016). R12 : aucun montant salarial.
--   R15 : chaque décision de lot (NDF) auditée individuellement (audit applicatif).
-- ============================================================================

-- ===========================================================================
-- M6 — RECRUTEMENT & INTÉGRATION
-- ===========================================================================

-- REC.2 — Demandes de recrutement (besoins) ouvertes par le manager.
create table if not exists recruitment_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  reference text not null,                 -- ex. DR-2026-0124
  manager_id uuid not null references employees(id),
  title text not null,
  request_type text not null check (request_type in ('replacement','creation','reinforcement','seasonal')),
  urgency text not null default 'normal' check (urgency in ('low','normal','high','critical')),
  justification text,
  -- AUCUNE fourchette de rémunération ici : la RH/DRH gère le cadrage salarial.
  status text not null default 'draft'
    check (status in ('draft','instruction','sourcing','interviews','filled','rejected','cancelled')),
  filled_by_id uuid references employees(id),
  submitted_at timestamptz,
  created_at timestamptz default now(),
  unique (tenant_id, reference)
);
create index if not exists idx_rr_manager on recruitment_requests(tenant_id, manager_id);

-- REC.2 — Fil d'échange RH ↔ manager sur une demande (pas de canal candidat).
create table if not exists recruitment_request_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  request_id uuid not null references recruitment_requests(id) on delete cascade,
  author_id uuid not null references employees(id),
  author_role text not null check (author_role in ('manager','hr')),
  body text not null,
  created_at timestamptz default now()
);
create index if not exists idx_rrm_request on recruitment_request_messages(tenant_id, request_id);

-- REC.3 — Candidats rattachés à une demande. PAS de donnée salariale candidat.
create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  request_id uuid not null references recruitment_requests(id) on delete cascade,
  display_name text not null,
  headline text,                           -- intitulé / séniorité, jamais de salaire
  stage text not null default 'preselected'
    check (stage in ('preselected','tomeet','met','decision','hired','rejected')),
  source text,                             -- sourcing RH / cooptation / cabinet…
  -- expected_salary VOLONTAIREMENT ABSENT : négociation = RH (07 §8).
  created_at timestamptz default now()
);
create index if not exists idx_cand_request on candidates(tenant_id, request_id);

-- REC.3 — Évaluations d'entretien (grille manager).
create table if not exists candidate_evaluations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  candidate_id uuid not null references candidates(id) on delete cascade,
  evaluator_id uuid not null references employees(id),
  technical int check (technical between 1 and 5),
  soft_skills int check (soft_skills between 1 and 5),
  culture_fit int check (culture_fit between 1 and 5),
  comment text,
  created_at timestamptz default now()
);
create index if not exists idx_ceval_candidate on candidate_evaluations(tenant_id, candidate_id);

-- REC.3 — Décision/avis manager sur un candidat (recommandation, RH tranche).
create table if not exists candidate_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  candidate_id uuid not null references candidates(id) on delete cascade,
  manager_id uuid not null references employees(id),
  recommendation text not null check (recommendation in ('advance','hold','reject')),
  rationale text,                          -- obligatoire applicatif si reject
  created_at timestamptz default now()
);
create index if not exists idx_cdec_candidate on candidate_decisions(tenant_id, candidate_id);

-- REC.3 — Journal de consultation des profils candidats (audit fort, 07 §8).
create table if not exists candidate_view_audit (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  candidate_id uuid not null references candidates(id) on delete cascade,
  viewer_id uuid not null references employees(id),
  viewed_at timestamptz default now()
);
create index if not exists idx_cva_candidate on candidate_view_audit(tenant_id, candidate_id);

-- REC.4 — Décision de fin de période d'essai : RECOMMANDATION manager.
-- La décision formelle (confirmation/rupture) appartient à la RH/DRH.
create table if not exists probation_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  employee_id uuid not null references employees(id) on delete cascade,
  manager_id uuid not null references employees(id),
  axis_technical int check (axis_technical between 1 and 4),
  axis_integration int check (axis_integration between 1 and 4),
  axis_autonomy int check (axis_autonomy between 1 and 4),
  axis_attitude int check (axis_attitude between 1 and 4),
  recommendation text not null check (recommendation in ('confirm','extend','terminate')),
  synthesis text,
  rationale text,                          -- obligatoire applicatif si terminate
  hr_decision text check (hr_decision in ('pending','confirmed','extended','terminated')) default 'pending',
  created_at timestamptz default now()
);
create index if not exists idx_pdec_employee on probation_decisions(tenant_id, employee_id);

-- REC.5 — Transfert de dossiers d'un sortant vers un repreneur.
create table if not exists dossier_transfers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  leaver_id uuid not null references employees(id) on delete cascade,
  label text not null,
  recipient_id uuid references employees(id),
  status text not null default 'pending' check (status in ('pending','in_progress','done')),
  replacement_ref text,                    -- ex. DR-2026-0124
  created_at timestamptz default now()
);
create index if not exists idx_dt_leaver on dossier_transfers(tenant_id, leaver_id);

-- REC.5 — Entretien de départ (synthèse ; détail RH confidentiel).
create table if not exists exit_interviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  leaver_id uuid not null references employees(id) on delete cascade,
  manager_id uuid not null references employees(id),
  held_on date,
  summary text,
  created_at timestamptz default now()
);
create index if not exists idx_ei_leaver on exit_interviews(tenant_id, leaver_id);

-- ===========================================================================
-- M7 — VIE QUOTIDIENNE MANAGÉRIALE
-- ===========================================================================

-- VQ.2 — Trace de décision managériale sur note de frais (avant étape finance).
-- R15 : une ligne PAR décision, même en lot → audit individuel.
create table if not exists expense_validations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  expense_report_id uuid not null,
  manager_id uuid not null references employees(id),
  decision text not null check (decision in ('manager_approved','refused','info_requested')),
  comment text,                            -- obligatoire applicatif si refused
  batch_id uuid,                           -- regroupe une validation de lot
  created_at timestamptz default now()
);
create index if not exists idx_ev_manager on expense_validations(tenant_id, manager_id);
create index if not exists idx_ev_report on expense_validations(tenant_id, expense_report_id);

-- VQ.4 — Courrier officiel managérial (boîte distincte du courrier employé).
create table if not exists manager_correspondence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  kind text not null check (kind in ('convocation','communication','instruction','document')),
  subject text not null,
  body text,
  sender text,
  action_required text,
  read_at timestamptz,
  acknowledged_at timestamptz,
  hash_chain text,                         -- audit chaîné SHA-256 (comme courrier officiel)
  received_at timestamptz default now()
);
create index if not exists idx_mc_manager on manager_correspondence(tenant_id, manager_id);

-- VQ.5 — Sondages d'engagement AGRÉGÉS. Jamais de réponse individuelle.
-- Masqué si participants < 5 (seuil anonymat) — contrôlé applicatif + vue.
create table if not exists engagement_surveys_aggregated (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  period text not null,                    -- ex. 2026-05
  respondents int not null default 0,
  engagement numeric,                      -- /10
  satisfaction numeric,                    -- /5
  nps int,
  participation int,                       -- %
  workload_ok boolean,
  created_at timestamptz default now(),
  unique (tenant_id, manager_id, period),
  check (respondents >= 0)
);

-- VQ.5 — Signalements climat. ANONYME : AUCUNE colonne auteur. Non ré-identifiable.
create table if not exists climate_signals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  scope_manager_id uuid not null references employees(id),  -- périmètre concerné, pas l'auteur
  category text not null,
  content text not null,
  severity text not null default 'normal' check (severity in ('normal','high','severe')),
  anonymous boolean not null default true,
  received_at timestamptz default now(),
  treated boolean not null default false
  -- VOLONTAIREMENT : aucun author_id / reporter_id. Anonymat irréversible (08 §8).
);
create index if not exists idx_cs_scope on climate_signals(tenant_id, scope_manager_id);

-- VQ.5 — Traitement d'un signalement (plan d'action ou escalade RH).
create table if not exists signal_treatments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  signal_id uuid not null references climate_signals(id) on delete cascade,
  manager_id uuid not null references employees(id),
  action text not null check (action in ('plan','meeting','escalate')),
  plan text,
  escalated_to_hr boolean default false,
  escalated_to_physician boolean default false,   -- RPS sévère
  created_at timestamptz default now()
);
create index if not exists idx_st_signal on signal_treatments(tenant_id, signal_id);

-- VQ.6 — Conflits de planning à arbitrer.
create table if not exists scheduling_conflicts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  title text not null,
  description text,
  consequence text,
  status text not null default 'open' check (status in ('open','resolved')),
  detected_at timestamptz default now()
);
create index if not exists idx_sc_manager on scheduling_conflicts(tenant_id, manager_id);

-- VQ.6 — Décision d'arbitrage (tracée ComplianceGuard).
create table if not exists conflict_resolutions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  conflict_id uuid not null references scheduling_conflicts(id) on delete cascade,
  manager_id uuid not null references employees(id),
  chosen_option text not null,
  comment text,
  created_at timestamptz default now()
);
create index if not exists idx_cr_conflict on conflict_resolutions(tenant_id, conflict_id);

-- ---------------------------------------------------------------------------
-- RLS — périmètre cascade (supervises_in_chain) / propriétaire / RH.
-- ---------------------------------------------------------------------------
alter table recruitment_requests enable row level security;
alter table recruitment_request_messages enable row level security;
alter table candidates enable row level security;
alter table candidate_evaluations enable row level security;
alter table candidate_decisions enable row level security;
alter table candidate_view_audit enable row level security;
alter table probation_decisions enable row level security;
alter table dossier_transfers enable row level security;
alter table exit_interviews enable row level security;
alter table expense_validations enable row level security;
alter table manager_correspondence enable row level security;
alter table engagement_surveys_aggregated enable row level security;
alter table climate_signals enable row level security;
alter table signal_treatments enable row level security;
alter table scheduling_conflicts enable row level security;
alter table conflict_resolutions enable row level security;

-- M6 — Demandes : manager propriétaire + RH.
drop policy if exists rr_owner on recruitment_requests;
create policy rr_owner on recruitment_requests
  using (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)));

drop policy if exists rrm_via_request on recruitment_request_messages;
create policy rrm_via_request on recruitment_request_messages
  using (
    tenant_id in (select current_tenant_ids())
    and exists (select 1 from recruitment_requests r where r.id = request_id
                and (r.manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and author_id in (select current_employee_ids())
  );

-- Candidats : manager de la demande + RH. Pas de salaire stocké (schéma).
drop policy if exists cand_via_request on candidates;
create policy cand_via_request on candidates
  using (
    tenant_id in (select current_tenant_ids())
    and exists (select 1 from recruitment_requests r where r.id = request_id
                and (r.manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  )
  with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));

drop policy if exists ceval_via_candidate on candidate_evaluations;
create policy ceval_via_candidate on candidate_evaluations
  using (
    tenant_id in (select current_tenant_ids())
    and (evaluator_id in (select current_employee_ids())
         or is_hr_or_admin(tenant_id)
         or exists (select 1 from candidates c join recruitment_requests r on r.id = c.request_id
                    where c.id = candidate_id and r.manager_id in (select current_employee_ids())))
  )
  with check (tenant_id in (select current_tenant_ids()) and evaluator_id in (select current_employee_ids()));

drop policy if exists cdec_via_candidate on candidate_decisions;
create policy cdec_via_candidate on candidate_decisions
  using (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and manager_id in (select current_employee_ids()));

-- Audit de consultation : insertion par le consultant ; lecture RH (contrôle).
drop policy if exists cva_audit on candidate_view_audit;
create policy cva_audit on candidate_view_audit
  using (tenant_id in (select current_tenant_ids()) and (viewer_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and viewer_id in (select current_employee_ids()));

-- Période d'essai : manager (recommandation) + RH (décision). Cascade lecture.
drop policy if exists pdec_scope on probation_decisions;
create policy pdec_scope on probation_decisions
  using (
    tenant_id in (select current_tenant_ids())
    and (manager_id in (select current_employee_ids())
         or supervises_in_chain(employee_id)
         or is_hr_or_admin(tenant_id))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and (manager_id in (select current_employee_ids()) or supervises_in_chain(employee_id))
  );

-- Transfert de dossiers : manager du sortant (cascade) + repreneur + RH.
drop policy if exists dt_scope on dossier_transfers;
create policy dt_scope on dossier_transfers
  using (
    tenant_id in (select current_tenant_ids())
    and (recipient_id in (select current_employee_ids())
         or supervises_in_chain(leaver_id)
         or is_hr_or_admin(tenant_id))
  )
  with check (tenant_id in (select current_tenant_ids()) and (supervises_in_chain(leaver_id) or is_hr_or_admin(tenant_id)));

drop policy if exists ei_scope on exit_interviews;
create policy ei_scope on exit_interviews
  using (
    tenant_id in (select current_tenant_ids())
    and (manager_id in (select current_employee_ids()) or supervises_in_chain(leaver_id) or is_hr_or_admin(tenant_id))
  )
  with check (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or supervises_in_chain(leaver_id)));

-- M7 — Validations NDF : manager auteur + RH/finance.
drop policy if exists ev_manager on expense_validations;
create policy ev_manager on expense_validations
  using (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and manager_id in (select current_employee_ids()));

-- Courrier managérial : destinataire (manager) uniquement + RH (supervision).
drop policy if exists mc_owner on manager_correspondence;
create policy mc_owner on manager_correspondence
  using (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)));

-- Sondages agrégés : manager propriétaire + RH. Agrégat seulement (jamais individuel).
drop policy if exists esa_owner on engagement_surveys_aggregated;
create policy esa_owner on engagement_surveys_aggregated
  using (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));

-- Signalements anonymes : manager du périmètre + RH. Aucune ré-identification possible
-- (pas de colonne auteur dans le schéma) ; la RLS borne au périmètre concerné.
drop policy if exists cs_scope on climate_signals;
create policy cs_scope on climate_signals
  using (tenant_id in (select current_tenant_ids()) and (scope_manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));

drop policy if exists st_via_signal on signal_treatments;
create policy st_via_signal on signal_treatments
  using (
    tenant_id in (select current_tenant_ids())
    and (manager_id in (select current_employee_ids())
         or is_hr_or_admin(tenant_id)
         or exists (select 1 from climate_signals s where s.id = signal_id and s.scope_manager_id in (select current_employee_ids())))
  )
  with check (tenant_id in (select current_tenant_ids()) and manager_id in (select current_employee_ids()));

-- Conflits planning : manager propriétaire + RH.
drop policy if exists sc_owner on scheduling_conflicts;
create policy sc_owner on scheduling_conflicts
  using (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
  with check (tenant_id in (select current_tenant_ids()) and (manager_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)));

drop policy if exists cr_via_conflict on conflict_resolutions;
create policy cr_via_conflict on conflict_resolutions
  using (
    tenant_id in (select current_tenant_ids())
    and (manager_id in (select current_employee_ids())
         or is_hr_or_admin(tenant_id)
         or exists (select 1 from scheduling_conflicts c where c.id = conflict_id and c.manager_id in (select current_employee_ids())))
  )
  with check (tenant_id in (select current_tenant_ids()) and manager_id in (select current_employee_ids()));

-- ---------------------------------------------------------------------------
-- Documentation des invariants de confidentialité.
-- ---------------------------------------------------------------------------
comment on table candidates is
  '07 §8 : AUCUNE donnée salariale candidat. La négociation/cadrage appartient à la RH. Pas de canal de communication direct manager → candidat.';
comment on table probation_decisions is
  '07 §8 : recommandation manager (confirm/extend/terminate). Décision FORMELLE = RH/DRH (hr_decision). Le manager ne décide pas seul.';
comment on table climate_signals is
  '08 §8 : signalement ANONYME et non ré-identifiable. Aucune colonne auteur. RLS bornée au périmètre concerné, jamais à l''émetteur.';
comment on table engagement_surveys_aggregated is
  '08 §8 : données AGRÉGÉES uniquement. Masquées côté applicatif si respondents < 5 (seuil d''anonymisation). Jamais de réponse individuelle.';
comment on table expense_validations is
  'R15 : chaque décision (y compris en lot) est tracée individuellement (une ligne par NDF, batch_id pour le regroupement).';
