-- ============================================================================
-- Atlas People — Portail Manager (MSS) — M4 Performance équipe
-- Réf. 05_PERFORMANCE_EQUIPE.md (PERF.1–7). Cascade OKR, évaluations annuelles,
-- 1:1, calibration, feedback 360° et reconnaissance.
--
-- Règles dures honorées :
--   R2  : AUCUN montant salarial ici. Les recommandations d'augmentation sont
--         booléennes (Oui/Non) ; la RH/DRH décide des montants ailleurs.
--   R8  : périmètre strictement la cascade (supervises_in_chain, 0016).
--   R15 : chaque décision (validation, soumission) est auditée individuellement
--         (audit_log, source_surface='mss', 0013) — déclenché applicativement.
--   Anonymat 360° : aucune réponse individuelle n'est exposée au manager ;
--         seules les synthèses agrégées (≥ 3 répondants) le sont (vue dédiée).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PERF.2 — Indicateurs clés (Key Results) rattachés aux objectifs (OKR).
-- La table objectives existe (M1) ; on y ajoute la cascade + les KR.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.objectives') is not null then
    alter table objectives add column if not exists parent_objective_id uuid references objectives(id) on delete set null;
    alter table objectives add column if not exists cascade_from_manager_id uuid references employees(id);
    alter table objectives add column if not exists ai_suggested boolean default false;
  end if;
end $$;

create table if not exists objective_key_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  objective_id uuid not null references objectives(id) on delete cascade,
  label text not null,
  target_value numeric,
  current_value numeric default 0,
  unit text,
  progress int not null default 0 check (progress between 0 and 100),
  status text not null default 'ontrack' check (status in ('achieved','ahead','ontrack','atrisk','low')),
  updated_at timestamptz default now()
);
create index if not exists idx_okr_kr_objective on objective_key_results(tenant_id, objective_id);

-- ---------------------------------------------------------------------------
-- PERF.4 — Entretiens 1:1 et engagements de suivi.
-- ---------------------------------------------------------------------------
create table if not exists one_on_one_meetings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  manager_id uuid not null references employees(id),
  employee_id uuid not null references employees(id) on delete cascade,
  scheduled_at timestamptz,
  held_at timestamptz,
  status text not null default 'planned' check (status in ('planned','prepared','held','cancelled')),
  agenda jsonb,
  manager_private_notes text,   -- privé manager, jamais exposé au collaborateur
  shared_notes text,
  created_at timestamptz default now()
);
create index if not exists idx_1on1_manager on one_on_one_meetings(tenant_id, manager_id, scheduled_at);
create index if not exists idx_1on1_employee on one_on_one_meetings(tenant_id, employee_id);

create table if not exists one_on_one_commitments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  meeting_id uuid references one_on_one_meetings(id) on delete cascade,
  owner_id uuid not null references employees(id),
  description text not null,
  due_date date,
  status text not null default 'open' check (status in ('open','inprogress','done','dropped')),
  created_at timestamptz default now()
);
create index if not exists idx_1on1_commit_meeting on one_on_one_commitments(tenant_id, meeting_id);

-- ---------------------------------------------------------------------------
-- PERF.5 — Sessions de calibration (forced ranking indicatif, animé DRH).
-- ---------------------------------------------------------------------------
create table if not exists calibration_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  campaign_label text not null,
  scheduled_at timestamptz,
  facilitator_id uuid references employees(id),
  target_distribution jsonb,  -- {top:13, good:40, perf:37, improve:8, struggle:2}
  status text not null default 'planned' check (status in ('planned','running','closed')),
  created_at timestamptz default now()
);

create table if not exists calibration_ratings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  session_id uuid references calibration_sessions(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  manager_id uuid not null references employees(id),
  preliminary_note int check (preliminary_note between 1 and 5),
  calibrated_note int check (calibrated_note between 1 and 5),
  flagged boolean default false,
  -- R2 : aucun montant. Recommandation d'augmentation booléenne uniquement.
  raise_recommended boolean,
  updated_at timestamptz default now(),
  unique (session_id, employee_id)
);
create index if not exists idx_calib_session on calibration_ratings(tenant_id, session_id);

-- ---------------------------------------------------------------------------
-- PERF.6 — Feedback 360°. Réponses individuelles JAMAIS exposées au manager :
-- accès brut réservé RH/admin ; le manager ne lit que la synthèse agrégée.
-- ---------------------------------------------------------------------------
create table if not exists feedback_360_campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  subject_id uuid not null references employees(id) on delete cascade,
  launched_by uuid references employees(id),
  launched_at timestamptz default now(),
  closes_at timestamptz,
  status text not null default 'open' check (status in ('open','closed')),
  min_respondents_for_synthesis int not null default 3
);
create index if not exists idx_f360_subject on feedback_360_campaigns(tenant_id, subject_id);

create table if not exists feedback_360_responses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  campaign_id uuid not null references feedback_360_campaigns(id) on delete cascade,
  respondent_relation text not null check (respondent_relation in ('peer','manager','report','transverse','self')),
  score numeric check (score between 0 and 5),
  strengths text,
  improvements text,
  submitted_at timestamptz default now()
  -- pas de respondent_id stocké côté lecture manager : anonymat
);
create index if not exists idx_f360_resp_campaign on feedback_360_responses(tenant_id, campaign_id);

-- ---------------------------------------------------------------------------
-- PERF.7 — Reconnaissance (badge + message). Symbolique, R2 : aucun montant.
-- ---------------------------------------------------------------------------
create table if not exists recognitions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  from_id uuid not null references employees(id),
  to_id uuid not null references employees(id) on delete cascade,
  badge text not null,
  message text,
  visibility text not null default 'team' check (visibility in ('private','team','company')),
  created_at timestamptz default now()
);
create index if not exists idx_recog_to on recognitions(tenant_id, to_id, created_at);
create index if not exists idx_recog_from on recognitions(tenant_id, from_id);

-- ---------------------------------------------------------------------------
-- RLS — toutes les nouvelles tables. Périmètre = cascade (supervises_in_chain).
-- ---------------------------------------------------------------------------
alter table objective_key_results enable row level security;
alter table one_on_one_meetings enable row level security;
alter table one_on_one_commitments enable row level security;
alter table calibration_sessions enable row level security;
alter table calibration_ratings enable row level security;
alter table feedback_360_campaigns enable row level security;
alter table feedback_360_responses enable row level security;
alter table recognitions enable row level security;

-- KR : visibles via l'objectif (self / cascade / RH).
drop policy if exists okr_kr_scope on objective_key_results;
create policy okr_kr_scope on objective_key_results
  using (
    tenant_id in (select current_tenant_ids())
    and exists (
      select 1 from objectives o
      where o.id = objective_id
        and (o.employee_id in (select current_employee_ids())
             or is_manager_of(o.employee_id)
             or supervises_in_chain(o.employee_id)
             or is_hr_or_admin(tenant_id))
    )
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and exists (
      select 1 from objectives o
      where o.id = objective_id
        and (is_manager_of(o.employee_id)
             or supervises_in_chain(o.employee_id)
             or is_hr_or_admin(tenant_id))
    )
  );

-- 1:1 : le manager animateur, le collaborateur concerné, la RH.
-- manager_private_notes reste privé applicativement (non sélectionné côté collab).
drop policy if exists one_on_one_scope on one_on_one_meetings;
create policy one_on_one_scope on one_on_one_meetings
  using (
    tenant_id in (select current_tenant_ids())
    and (manager_id in (select current_employee_ids())
         or employee_id in (select current_employee_ids())
         or supervises_in_chain(employee_id)
         or is_hr_or_admin(tenant_id))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and (manager_id in (select current_employee_ids())
         or supervises_in_chain(employee_id)
         or is_hr_or_admin(tenant_id))
  );

drop policy if exists one_on_one_commit_scope on one_on_one_commitments;
create policy one_on_one_commit_scope on one_on_one_commitments
  using (
    tenant_id in (select current_tenant_ids())
    and (owner_id in (select current_employee_ids())
         or exists (select 1 from one_on_one_meetings m
                    where m.id = meeting_id
                      and (m.manager_id in (select current_employee_ids())
                           or supervises_in_chain(m.employee_id)))
         or is_hr_or_admin(tenant_id))
  )
  with check (tenant_id in (select current_tenant_ids()));

-- Calibration : RH/DRH (animation) + managers participants pour leurs notes.
drop policy if exists calib_session_scope on calibration_sessions;
create policy calib_session_scope on calibration_sessions
  using (tenant_id in (select current_tenant_ids()))
  with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));

drop policy if exists calib_rating_scope on calibration_ratings;
create policy calib_rating_scope on calibration_ratings
  using (
    tenant_id in (select current_tenant_ids())
    and (manager_id in (select current_employee_ids())
         or supervises_in_chain(employee_id)
         or is_hr_or_admin(tenant_id))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and (manager_id in (select current_employee_ids())
         or supervises_in_chain(employee_id)
         or is_hr_or_admin(tenant_id))
  );

-- 360° campagnes : sujet, lanceur, cascade, RH.
drop policy if exists f360_campaign_scope on feedback_360_campaigns;
create policy f360_campaign_scope on feedback_360_campaigns
  using (
    tenant_id in (select current_tenant_ids())
    and (subject_id in (select current_employee_ids())
         or launched_by in (select current_employee_ids())
         or supervises_in_chain(subject_id)
         or is_hr_or_admin(tenant_id))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and (launched_by in (select current_employee_ids())
         or supervises_in_chain(subject_id)
         or is_hr_or_admin(tenant_id))
  );

-- 360° réponses brutes : RH/admin UNIQUEMENT (anonymat vis-à-vis du manager).
-- Le manager passe par la vue agrégée team_360_synthesis ci-dessous.
drop policy if exists f360_response_hr_only on feedback_360_responses;
create policy f360_response_hr_only on feedback_360_responses
  using (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id))
  with check (tenant_id in (select current_tenant_ids()));

-- Reconnaissance : émetteur, destinataire, cascade et RH (selon visibilité).
drop policy if exists recog_scope on recognitions;
create policy recog_scope on recognitions
  using (
    tenant_id in (select current_tenant_ids())
    and (from_id in (select current_employee_ids())
         or to_id in (select current_employee_ids())
         or supervises_in_chain(to_id)
         or (visibility = 'company')
         or is_hr_or_admin(tenant_id))
  )
  with check (
    tenant_id in (select current_tenant_ids())
    and from_id in (select current_employee_ids())
  );

-- ---------------------------------------------------------------------------
-- Synthèse 360° agrégée et anonymisée pour le manager (≥ min répondants).
-- Renvoie une moyenne + le nombre de répondants ; jamais de réponse nominative.
-- ---------------------------------------------------------------------------
create or replace function team_360_synthesis(p_subject uuid)
returns table (respondents int, avg_score numeric)
language sql stable security definer set search_path = public as $$
  with c as (
    select id, min_respondents_for_synthesis as mn
    from feedback_360_campaigns
    where subject_id = p_subject
      and tenant_id in (select current_tenant_ids())
      and (supervises_in_chain(subject_id) or is_hr_or_admin(tenant_id))
    order by launched_at desc
    limit 1
  )
  select count(r.*)::int,
         case when count(r.*) >= (select mn from c)
              then round(avg(r.score)::numeric, 1) else null end
  from feedback_360_responses r
  join c on c.id = r.campaign_id;
$$;

comment on function team_360_synthesis(uuid) is
  'PERF.6 : synthèse 360° agrégée (moyenne masquée si < seuil de répondants). Garantit l''anonymat — aucune réponse individuelle exposée au manager.';

revoke all on function team_360_synthesis(uuid) from public;
grant execute on function team_360_synthesis(uuid) to authenticated;

comment on table recognitions is
  'PERF.7 : reconnaissance symbolique (badge + message). R2 : aucun montant ni prime — la rémunération relève de la RH/DRH.';
comment on column calibration_ratings.raise_recommended is
  'R2 : recommandation d''augmentation booléenne (Oui/Non). Aucun montant — la RH/DRH décide.';
