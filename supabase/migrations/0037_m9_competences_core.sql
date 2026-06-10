-- ============================================================================
-- Atlas People — Noyau COMPÉTENCES (M9), couche « core ».
-- Complète le référentiel m9_* existant (m9_skills / m9_jobs /
-- m9_job_requirements / m9_skill_matrix) avec la mécanique de la *Note de
-- cadrage core* §5, jusque-là absente :
--   • Évaluation TRIANGULÉE employé / manager / RH → niveau_retenu (R4).
--   • Preuve réutilisable depuis la Performance (preuves.source_action_id, R9).
--   • Analyse d'écart vs poste suivant + verdict de readiness (§5.4).
--   • Péremption des compétences réglementaires/HSSE (§5.5).
--
-- Le calcul SQL réplique le noyau TS `src/engine/competences` (testé).
-- Échelle de maîtrise alignée sur m9_skill_matrix : 0–5.
--
-- Règles dures : R3 niveau échelonné → % (jamais binaire) · R4 niveau_retenu =
-- validé manager (consolidé avis RH) · R7 readiness figée + chaînée SHA-256 ·
-- R8 RLS strict · R9 une compétence se prouve.
--
-- Additif & idempotent. Schéma atlas_people. Dépend de 0025 (m9_*) et 0036
-- (preuves, perf_campagnes, perf_chain_hash, helpers RLS).
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- ---------------------------------------------------------------------------
-- 1. ÉVALUATIONS TRIANGULÉES (§5.3)
-- ---------------------------------------------------------------------------
create table if not exists comp_evaluations (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null,
  campagne_id       uuid references perf_campagnes(id) on delete set null,
  employe_id        uuid not null,
  skill_id          uuid not null references m9_skills(id) on delete cascade,
  -- les trois voix
  niveau_self       int check (niveau_self between 0 and 5),
  niveau_manager    int check (niveau_manager between 0 and 5),
  avis_rh           text,                                  -- avis fondé sur l'historique
  niveau_rh_override int check (niveau_rh_override between 0 and 5),
  -- consolidé (calculé par trigger, R4)
  niveau_retenu     int check (niveau_retenu between 0 and 5),
  statut            text check (statut in ('acquis','en_cours','perime')),
  date_validite     date,                                  -- §5.5 péremption
  -- preuve réutilisable (R9) — peut pointer une action Performance via preuves
  preuve_id         uuid references preuves(id) on delete set null,
  evaluateur_id     uuid,
  validee           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (tenant_id, employe_id, skill_id, campagne_id)
);
create index if not exists comp_eval_emp_idx   on comp_evaluations (tenant_id, employe_id);
create index if not exists comp_eval_skill_idx on comp_evaluations (tenant_id, skill_id);

-- ---------------------------------------------------------------------------
-- 2. READINESS — verdict d'accès au poste suivant (§5.4), figé + chaîné (R7)
-- ---------------------------------------------------------------------------
create table if not exists comp_readiness (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  employe_id      uuid not null,
  job_cible_id    uuid not null references m9_jobs(id) on delete cascade,
  verdict         text not null check (verdict in ('pret','pret_sous_conditions','pas_pret')),
  score_couverture numeric,                                -- 0–100 pondéré criticité
  conditions      jsonb,                                   -- [{skill_id,attendu,retenu,ecart,bloquant}]
  computed_at     timestamptz not null default now(),
  hash            text,
  prev_hash       text,
  unique (tenant_id, employe_id, job_cible_id)
);
create index if not exists comp_readiness_emp_idx on comp_readiness (tenant_id, employe_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- touch updated_at
do $$ begin
  drop trigger if exists comp_eval_touch on comp_evaluations;
  create trigger comp_eval_touch before update on comp_evaluations
    for each row execute function perf_touch_updated_at();
end $$;

-- §5.3/§5.5 : niveau_retenu (R4) + statut (péremption R9) à chaque saisie.
create or replace function comp_set_retenu() returns trigger
language plpgsql set search_path = atlas_people, public as $$
begin
  new.niveau_retenu := coalesce(new.niveau_rh_override, new.niveau_manager, new.niveau_self, 0);
  if new.date_validite is not null and new.date_validite < current_date then
    new.statut := 'perime';                                -- ne comptera jamais comme acquis
  elsif new.niveau_retenu <= 0 or new.preuve_id is null then
    new.statut := 'en_cours';                              -- R9 : sans preuve, pas d'acquis
  else
    new.statut := 'acquis';
  end if;
  return new;
end $$;

do $$ begin
  drop trigger if exists comp_eval_retenu on comp_evaluations;
  create trigger comp_eval_retenu before insert or update on comp_evaluations
    for each row execute function comp_set_retenu();
end $$;

-- readiness figée : immutabilité une fois le hash écrit (R7)
create or replace function comp_readiness_freeze_guard() returns trigger
language plpgsql set search_path = atlas_people, public as $$
begin
  if old.hash is not null then
    raise exception 'comp_readiness % figé : modification interdite (R7).', old.id;
  end if;
  return new;
end $$;

do $$ begin
  drop trigger if exists comp_readiness_freeze on comp_readiness;
  create trigger comp_readiness_freeze before update on comp_readiness
    for each row when (old.hash is not null) execute function comp_readiness_freeze_guard();
end $$;

-- ============================================================================
-- RPC — analyse d'écart & readiness (réplique du noyau TS), SECURITY DEFINER
-- ============================================================================

-- §5.4 : calcule et fige le verdict d'accès au poste cible pour un employé.
--   gap = min_level − niveau_retenu (périmé → 0)
--   bloquant = critical AND gap > 0
--   verdict : pas_pret si bloquant ; pret_sous_conditions si gaps restants ;
--             sinon pret.
--   score_couverture = Σ(poids · min(retenu/attendu,1)) / Σ poids × 100,
--   poids = 2 si critical, sinon 1 (criticité).
create or replace function rpc_comp_readiness(p_employe_id uuid, p_job_cible_id uuid)
returns text
language plpgsql security definer set search_path = atlas_people, public, extensions as $$
declare
  v_tenant uuid; r record;
  v_num numeric := 0; v_den numeric := 0; v_bloquant boolean := false;
  v_conditions jsonb := '[]'::jsonb; v_verdict text; v_score numeric;
  v_prev text; v_hash text; v_retenu int; v_poids numeric; v_gap int;
begin
  select tenant_id into v_tenant from m9_jobs where id = p_job_cible_id;

  for r in
    select req.skill_id, req.min_level, req.critical
      from m9_job_requirements req
     where req.job_id = p_job_cible_id
  loop
    -- niveau retenu courant (compétence périmée comptée 0)
    select case when ce.statut = 'perime' then 0 else coalesce(ce.niveau_retenu,0) end
      into v_retenu
      from comp_evaluations ce
     where ce.employe_id = p_employe_id and ce.skill_id = r.skill_id
     order by ce.updated_at desc limit 1;
    v_retenu := coalesce(v_retenu, 0);

    v_gap := r.min_level - v_retenu;
    v_poids := case when r.critical then 2 else 1 end;
    v_num := v_num + v_poids * least(case when r.min_level <= 0 then 1 else v_retenu::numeric / r.min_level end, 1);
    v_den := v_den + v_poids;

    if r.critical and v_gap > 0 then v_bloquant := true; end if;
    if v_gap > 0 then
      v_conditions := v_conditions || jsonb_build_object(
        'skill_id', r.skill_id, 'attendu', r.min_level, 'retenu', v_retenu,
        'ecart', v_gap, 'bloquant', (r.critical and v_gap > 0));
    end if;
  end loop;

  v_score := case when v_den = 0 then 100 else round(v_num / v_den * 100, 2) end;
  v_verdict := case when v_bloquant then 'pas_pret'
                    when jsonb_array_length(v_conditions) > 0 then 'pret_sous_conditions'
                    else 'pret' end;

  -- chaînage R7
  select hash into v_prev from comp_readiness
    where tenant_id = v_tenant and employe_id = p_employe_id and hash is not null
    order by computed_at desc limit 1;
  v_prev := coalesce(v_prev, repeat('0',64));
  v_hash := perf_chain_hash(v_prev, jsonb_build_object(
    'employe', p_employe_id, 'job', p_job_cible_id, 'verdict', v_verdict, 'score', v_score::text));

  insert into comp_readiness(tenant_id, employe_id, job_cible_id, verdict, score_couverture, conditions, prev_hash, hash)
  values (v_tenant, p_employe_id, p_job_cible_id, v_verdict, v_score, v_conditions, v_prev, v_hash)
  on conflict (tenant_id, employe_id, job_cible_id)
    do update set verdict = excluded.verdict, score_couverture = excluded.score_couverture,
                  conditions = excluded.conditions, computed_at = now(),
                  prev_hash = excluded.prev_hash, hash = excluded.hash
    where comp_readiness.hash is null;
  return v_verdict;
end $$;

-- ============================================================================
-- RLS — strict par rôle / périmètre (§5 confidentialité, R8)
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array['comp_evaluations','comp_readiness']
  loop
    execute format('alter table %I enable row level security', t);
    execute format($f$drop policy if exists comp_tenant_write on %I$f$, t);
    execute format($f$create policy comp_tenant_write on %I for all
      using (tenant_id = any (current_tenant_ids()) and is_hr_or_admin(tenant_id))
      with check (tenant_id = any (current_tenant_ids()) and is_hr_or_admin(tenant_id))$f$, t);
  end loop;
end $$;

-- lecture scopée : employé concerné + manager (N-1) + RH/admin.
drop policy if exists comp_eval_scoped_read on comp_evaluations;
create policy comp_eval_scoped_read on comp_evaluations for select using (
  tenant_id = any (current_tenant_ids()) and (
    is_hr_or_admin(tenant_id)
    or employe_id in (select current_employee_ids())
    or is_manager_of(employe_id)
  )
);

-- l'employé auto-évalue ses compétences (saisie self + preuve), le manager
-- contre-évalue son équipe.
drop policy if exists comp_eval_self_write on comp_evaluations;
create policy comp_eval_self_write on comp_evaluations for all using (
  tenant_id = any (current_tenant_ids()) and (
    is_hr_or_admin(tenant_id)
    or employe_id in (select current_employee_ids())
    or is_manager_of(employe_id)
  )
) with check (tenant_id = any (current_tenant_ids()));

drop policy if exists comp_readiness_scoped_read on comp_readiness;
create policy comp_readiness_scoped_read on comp_readiness for select using (
  tenant_id = any (current_tenant_ids()) and (
    is_hr_or_admin(tenant_id)
    or employe_id in (select current_employee_ids())
    or is_manager_of(employe_id)
  )
);

-- ---------------------------------------------------------------------------
comment on table comp_evaluations is
  'Évaluation triangulée employé/manager/RH d''une compétence (M9 §5.3). niveau_retenu = validé manager consolidé (R4) ; preuve réutilisable depuis la Performance (R9).';
comment on function rpc_comp_readiness(uuid,uuid) is
  'Verdict d''accès au poste suivant §5.4 (prêt / sous conditions / pas prêt) + couverture pondérée, figé et chaîné SHA-256 (R7). Réplique src/engine/competences.';
