-- ============================================================================
-- Atlas People — M9 Compétences : conformité « mise à jour M9 ».
-- Complète le noyau M9 livré en 0037 (comp_evaluations triangulées +
-- comp_readiness) avec les éléments explicitement nommés par la mise à jour :
--   • comp_niveaux_ref       : échelle de maîtrise paramétrable tenant (§3).
--   • comp_referentiel /      : noms canoniques de la mise à jour, exposés en
--     poste_competences         VUES sur le référentiel existant m9_skills /
--                               m9_job_requirements (« une seule définition,
--                               pas de doublon », §10).
--   • comp_evaluation_preuves: lien M:N évaluation ↔ preuves (employé/manager).
--   • comp_pdc               : plan de développement dérivé des écarts (→ M11).
--   • RPC rpc_calcul_ecart_competences / rpc_calcul_readiness / rpc_genere_pdc.
--   • trg_recalc_readiness   : recalcule le verdict quand niveau_retenu change.
--   • rpc_check_peremption   : passe à `perime` à échéance (tâche quotidienne).
--
-- Additif & idempotent. Dépend de 0025 (m9_*), 0036 (preuves, helpers RLS) et
-- 0037 (comp_evaluations, comp_readiness, rpc_comp_readiness).
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- ---------------------------------------------------------------------------
-- 1. Échelle de maîtrise paramétrable (§3)
-- ---------------------------------------------------------------------------
create table if not exists comp_niveaux_ref (
  tenant_id uuid not null,
  niveau    int  not null,
  label     text not null,
  primary key (tenant_id, niveau)
);

-- ---------------------------------------------------------------------------
-- 2. Référentiel & attentes par poste — VUES canoniques (zéro doublon, §10)
--    security_invoker : la RLS des tables m9_* sous-jacentes s'applique.
-- ---------------------------------------------------------------------------
create or replace view comp_referentiel
  with (security_invoker = true) as
  select s.id,
         s.tenant_id,
         case s.family
           when 'TECH' then 'technique'
           when 'DATA' then 'technique'
           when 'SOFT' then 'comportementale'
           when 'COMP' then 'comportementale'
           when 'BIZ'  then 'metier'
           when 'FIN'  then 'metier'
           else 'metier'
         end as famille,
         s.name as libelle,
         s.description
    from m9_skills s;

create or replace view poste_competences
  with (security_invoker = true) as
  select r.job_id     as poste_id,
         r.skill_id   as competence_id,
         r.tenant_id,
         r.min_level  as niveau_attendu,
         case when r.critical then 2 else 1 end as criticite,
         r.critical   as bloquante
    from m9_job_requirements r;

-- ---------------------------------------------------------------------------
-- 3. Lien évaluation ↔ preuves (M:N, employé/manager) (§5)
-- ---------------------------------------------------------------------------
create table if not exists comp_evaluation_preuves (
  tenant_id     uuid not null,
  evaluation_id uuid not null references comp_evaluations(id) on delete cascade,
  preuve_id     uuid not null references preuves(id) on delete cascade,
  apportee_par  text not null check (apportee_par in ('employe','manager')),
  primary key (evaluation_id, preuve_id)
);
create index if not exists comp_eval_preuves_idx on comp_evaluation_preuves (tenant_id, evaluation_id);

-- ---------------------------------------------------------------------------
-- 4. Plan de développement compétences dérivé des écarts (§7, → M11)
-- ---------------------------------------------------------------------------
create table if not exists comp_pdc (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null,
  employe_id     uuid not null,
  poste_cible_id uuid,
  competence_id  uuid,
  niveau_actuel  int,
  niveau_cible   int,
  ecart          int,
  action_suggeree text,
  statut         text not null default 'propose' check (statut in ('propose','planifie','en_cours','clos')),
  created_at     timestamptz not null default now(),
  unique (employe_id, competence_id, poste_cible_id)
);
create index if not exists comp_pdc_emp_idx on comp_pdc (tenant_id, employe_id);

-- ============================================================================
-- RPC — écart, readiness (alias canonique), génération PDC
-- ============================================================================

-- §7 écart par compétence vs le poste cible (perime → niveau 0).
create or replace function rpc_calcul_ecart_competences(p_employe_id uuid, p_poste_cible_id uuid)
returns table (
  competence_id uuid, niveau_attendu int, niveau_retenu int,
  ecart int, criticite numeric, bloquant boolean
)
language sql security definer set search_path = atlas_people, public as $$
  select req.skill_id,
         req.min_level,
         coalesce(ce.retenu, 0),
         req.min_level - coalesce(ce.retenu, 0),
         case when req.critical then 2 else 1 end,
         (req.critical and (req.min_level - coalesce(ce.retenu, 0)) > 0)
    from m9_job_requirements req
    left join lateral (
      select case when e.statut = 'perime' then 0 else coalesce(e.niveau_retenu,0) end as retenu
        from comp_evaluations e
       where e.employe_id = p_employe_id and e.skill_id = req.skill_id
       order by e.updated_at desc limit 1
    ) ce on true
   where req.job_id = p_poste_cible_id;
$$;

-- §7 verdict d'accès — nom canonique de la mise à jour ; délègue à 0037.
create or replace function rpc_calcul_readiness(p_employe_id uuid, p_poste_cible_id uuid)
returns text
language sql security definer set search_path = atlas_people, public as $$
  select rpc_comp_readiness(p_employe_id, p_poste_cible_id);
$$;

-- §7 génère/rafraîchit le PDC à partir des écarts restants (verdicts existants).
create or replace function rpc_genere_pdc(p_employe_id uuid)
returns int
language plpgsql security definer set search_path = atlas_people, public as $$
declare r record; v_tenant uuid; n int := 0;
begin
  for r in
    select cr.poste_cible_id, cr.tenant_id,
           (c->>'skill_id')::uuid as competence_id,
           (c->>'attendu')::int   as niveau_cible,
           (c->>'retenu')::int    as niveau_actuel,
           (c->>'ecart')::int     as ecart
      from comp_readiness cr
      cross join lateral jsonb_array_elements(coalesce(cr.conditions,'[]'::jsonb)) c
     where cr.employe_id = p_employe_id
  loop
    insert into comp_pdc(tenant_id, employe_id, poste_cible_id, competence_id,
                         niveau_actuel, niveau_cible, ecart, action_suggeree)
    values (r.tenant_id, p_employe_id, r.poste_cible_id, r.competence_id,
            r.niveau_actuel, r.niveau_cible, r.ecart,
            'Monter de ' || r.niveau_actuel || ' à ' || r.niveau_cible || ' (formation / mentorat — lien M11)')
    on conflict (employe_id, competence_id, poste_cible_id)
      do update set niveau_actuel = excluded.niveau_actuel, niveau_cible = excluded.niveau_cible,
                    ecart = excluded.ecart
      where comp_pdc.statut = 'propose';
    n := n + 1;
  end loop;
  return n;
end $$;

-- §8 péremption : passe les compétences échues à `perime` (tâche quotidienne).
create or replace function rpc_check_peremption(p_tenant_id uuid)
returns int
language plpgsql security definer set search_path = atlas_people, public as $$
declare n int;
begin
  update comp_evaluations
     set statut = 'perime'
   where tenant_id = p_tenant_id and date_validite is not null
     and date_validite < current_date and statut <> 'perime';
  get diagnostics n = row_count;
  return n;
end $$;

-- ============================================================================
-- TRIGGER — trg_recalc_readiness : recalcule le verdict quand niveau_retenu change
-- ============================================================================
create or replace function comp_recalc_readiness_trg() returns trigger
language plpgsql set search_path = atlas_people, public as $$
declare r record;
begin
  -- ne recalcule que les readiness NON figées de l'employé concerné
  for r in
    select distinct poste_cible_id from comp_readiness
     where employe_id = new.employe_id and hash is null
  loop
    perform rpc_comp_readiness(new.employe_id, r.poste_cible_id);
  end loop;
  return new;
end $$;

do $$ begin
  drop trigger if exists trg_recalc_readiness on comp_evaluations;
  create trigger trg_recalc_readiness
    after update of niveau_retenu on comp_evaluations
    for each row when (new.niveau_retenu is distinct from old.niveau_retenu)
    execute function comp_recalc_readiness_trg();
end $$;

-- ============================================================================
-- RLS — nouvelles tables (R8)
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array['comp_niveaux_ref','comp_evaluation_preuves','comp_pdc']
  loop
    execute format('alter table %I enable row level security', t);
    execute format($f$drop policy if exists comp2_tenant_write on %I$f$, t);
    execute format($f$create policy comp2_tenant_write on %I for all
      using (tenant_id = any (current_tenant_ids()) and is_hr_or_admin(tenant_id))
      with check (tenant_id = any (current_tenant_ids()) and is_hr_or_admin(tenant_id))$f$, t);
  end loop;
end $$;

-- échelle : lecture tenant-large (référentiel non sensible).
drop policy if exists comp_niveaux_read on comp_niveaux_ref;
create policy comp_niveaux_read on comp_niveaux_ref for select
  using (tenant_id = any (current_tenant_ids()));

-- PDC : l'employé voit le sien, le manager (N-1) celui de son équipe.
drop policy if exists comp_pdc_scoped_read on comp_pdc;
create policy comp_pdc_scoped_read on comp_pdc for select using (
  tenant_id = any (current_tenant_ids()) and (
    is_hr_or_admin(tenant_id)
    or employe_id in (select current_employee_ids())
    or is_manager_of(employe_id)
  )
);

-- preuves d'évaluation : visibles si l'évaluation l'est (employé/manager/RH).
drop policy if exists comp_eval_preuves_read on comp_evaluation_preuves;
create policy comp_eval_preuves_read on comp_evaluation_preuves for select using (
  tenant_id = any (current_tenant_ids()) and exists (
    select 1 from comp_evaluations e
     where e.id = comp_evaluation_preuves.evaluation_id
       and (is_hr_or_admin(e.tenant_id)
            or e.employe_id in (select current_employee_ids())
            or is_manager_of(e.employe_id))
  )
);

-- ---------------------------------------------------------------------------
comment on view comp_referentiel is
  'Référentiel compétences (mise à jour M9 §10) — VUE canonique sur m9_skills, zéro doublon.';
comment on view poste_competences is
  'Attentes par poste (mise à jour M9 §10) — VUE sur m9_job_requirements (niveau_attendu=min_level, criticite=2 si critical).';
comment on function rpc_calcul_readiness(uuid,uuid) is
  'Verdict d''accès au poste suivant (nom canonique mise à jour M9 §11.2) — délègue à rpc_comp_readiness (0037).';
comment on function rpc_genere_pdc(uuid) is
  'Génère le plan de développement à partir des écarts de readiness (§7, → M11 Formation).';
