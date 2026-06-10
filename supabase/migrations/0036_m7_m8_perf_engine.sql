-- ============================================================================
-- Atlas People — Noyau PERFORMANCE (M7 OKR + M8 Évaluations).
-- Modèle `perf_*` du CDC Module Performance §10 + note de cadrage core §8.
--
-- Couvre : cascade global→département→employé (§4) · plans d'action 2D
--          (continue/one_shot × quantitatif/qualitatif, §5) · moteur de calcul
--          deux passes auto/valide (§6) · arbitrage des écarts (§7) · snapshots
--          figés + audit chaîné SHA-256 (§8, §13) · accroche bonus M3 (§9).
--
-- Le moteur de calcul SQL (rpc_calcul_*) réplique fidèlement le noyau TS
-- `src/engine/performance` (testé, déterministe) : mêmes moyennes pondérées,
-- mêmes bornes, mêmes deux passes. Aucun calcul monétaire ici (Money.ts/M3).
--
-- Règles dures honorées :
--   R1 Atteinte dérivée des actions (jamais saisie directe) — pas de pct objectif
--      en écriture libre ; seules les RPC le calculent.
--   R2 Σ poids = 100 par porteur/objectif — trg_check_poids_100 (≤100 garde-fou)
--      + rpc_definir_objectifs (gate = 100 au passage objectifs_definis).
--   R3 Notation paramétrable → % (notation_config.echelle_max).
--   R4 Couche `valide` (contre-évaluation manager) = seule officielle/remontée.
--   R5 Écart > seuil → arbitrage tracé (trg/rpc).
--   R6 Snapshot mensuel figé + chaîné, immuable (perf_scores + perf_audit_chain).
--   R7 Versioning des objectifs en cours de cycle (version + motif).
--   R8 RLS strict par rôle/périmètre.
--
-- Additif & idempotent. Schéma atlas_people.
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- ---------------------------------------------------------------------------
-- 1. PARAMÉTRAGE TENANT — notation_config (§3, §10)
-- ---------------------------------------------------------------------------
create table if not exists notation_config (
  tenant_id                uuid primary key,
  echelle_max              int     not null default 100 check (echelle_max > 0),
  cap_depassement          numeric not null default 100 check (cap_depassement >= 100),
  paliers                  jsonb,                                  -- [{label,min,max}]
  alpha_collectif          numeric not null default 1
                             check (alpha_collectif between 0 and 1),
  ponderation_semestres    jsonb   not null default '{"s1":50,"s2":50}',
  mode_agregation_continue text    not null default 'moyenne'
                             check (mode_agregation_continue in ('moyenne','moyenne_ponderee')),
  seuil_arbitrage          numeric not null default 20 check (seuil_arbitrage >= 0),
  periode_bonus            text    not null default 'annuel'
                             check (periode_bonus in ('annuel','semestriel')),
  updated_at               timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. CAMPAGNES — machine à états (§3.3)
-- ---------------------------------------------------------------------------
create table if not exists perf_campagnes (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null,
  annee          int  not null,
  statut         text not null default 'brouillon' check (statut in
                   ('brouillon','objectifs_definis','en_cours','cloture_S1',
                    'en_cours_S2','cloture_S2','en_validation','validee','archivee')),
  date_ouverture date,
  date_cloture   date,
  created_at     timestamptz not null default now(),
  unique (tenant_id, annee)
);

-- ---------------------------------------------------------------------------
-- 3. OBJECTIFS — cascade pondérée, versionnée (§4)
-- ---------------------------------------------------------------------------
create table if not exists perf_objectifs (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null,
  campagne_id   uuid not null references perf_campagnes(id) on delete cascade,
  niveau        text not null check (niveau in ('global','departement','employe')),
  parent_id     uuid references perf_objectifs(id),
  porteur_type  text check (porteur_type in ('employe','departement','entreprise')),
  porteur_id    uuid,                                   -- employe_id / departement / null(global)
  libelle       text not null,
  description   text,
  poids         numeric not null check (poids >= 0),    -- Σ = 100 par porteur (R2)
  est_collectif boolean not null default false,
  version       int  not null default 1,
  motif_revision text,                                  -- obligatoire si version > 1 (R7)
  remplace_id   uuid references perf_objectifs(id),     -- soft-history : ancienne ligne
  statut        text not null default 'brouillon' check (statut in
                  ('brouillon','actif','revise','cloture')),
  created_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists perf_obj_camp_idx    on perf_objectifs (tenant_id, campagne_id);
create index if not exists perf_obj_parent_idx  on perf_objectifs (parent_id);
create index if not exists perf_obj_porteur_idx on perf_objectifs (tenant_id, porteur_id);

-- ---------------------------------------------------------------------------
-- 4. ACTIONS — plans d'action 2D (§5)
-- ---------------------------------------------------------------------------
create table if not exists perf_actions (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  objectif_id     uuid not null references perf_objectifs(id) on delete cascade,
  libelle         text not null,
  nature          text not null check (nature in ('continue','one_shot')),
  type_mesure     text not null check (type_mesure in ('quantitatif','qualitatif')),
  poids           numeric not null check (poids >= 0),  -- Σ = 100 par objectif (R2)
  cible           numeric,                              -- requis si quantitatif
  unite           text,
  date_debut      date,
  date_echeance   date,
  livrable_attendu text,
  lien_livrable   text,                                 -- ADVIST / DocJourney
  statut          text not null default 'a_faire' check (statut in
                    ('a_faire','en_cours','en_retard','realisee','evaluee_auto',
                     'contre_evaluee','figee')),
  created_at      timestamptz not null default now()
);
create index if not exists perf_act_obj_idx on perf_actions (tenant_id, objectif_id);

-- ---------------------------------------------------------------------------
-- 5. ÉVALUATIONS MENSUELLES — deux passes self/manager (§6.7, §7)
-- ---------------------------------------------------------------------------
create table if not exists perf_action_evaluations (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  action_id       uuid not null references perf_actions(id) on delete cascade,
  periode_mois    date not null,                        -- 1er du mois
  -- saisie employé (couche auto)
  resultat        numeric,
  note            numeric,
  pct_self        numeric,                              -- calculé (trigger)
  -- contre-évaluation manager (couche valide)
  resultat_manager numeric,
  note_manager    numeric,
  pct_manager     numeric,                              -- calculé (trigger)
  -- méta
  poids_mois      numeric not null default 1,           -- pour moyenne_ponderee
  actif_mois      boolean not null default true,
  statut          text,
  en_retard       boolean not null default false,       -- calculé (trigger)
  date_realisation date,
  resultat_obtenu text,
  evaluation_txt  text,
  commentaire     text,
  preuve_id       uuid,                                 -- FK ajoutée après preuves
  evaluateur_id   uuid,
  validee         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (action_id, periode_mois)
);
create index if not exists perf_aeval_action_idx on perf_action_evaluations (tenant_id, action_id, periode_mois);

-- ---------------------------------------------------------------------------
-- 6. CONTRIBUTIONS — remontée pondérée employé → département (§6.6)
-- ---------------------------------------------------------------------------
create table if not exists perf_objectif_contributions (
  tenant_id          uuid not null,
  objectif_dept_id   uuid not null references perf_objectifs(id) on delete cascade,
  employe_id         uuid not null,
  objectif_employe_id uuid references perf_objectifs(id) on delete set null,
  poids_contribution numeric not null check (poids_contribution >= 0),
  primary key (objectif_dept_id, employe_id)
);

-- ---------------------------------------------------------------------------
-- 7. SCORES CONSOLIDÉS — snapshots figés, deux couches (§6, §8)
-- ---------------------------------------------------------------------------
create table if not exists perf_scores (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null,
  scope         text not null check (scope in ('employe','departement','global')),
  scope_id      uuid,
  campagne_id   uuid not null references perf_campagnes(id) on delete cascade,
  periode_type  text not null check (periode_type in ('mois','semestre','annee')),
  periode_ref   text not null,                          -- '2026-03' | 'S1' | '2026'
  pct_auto      numeric,
  pct_valide    numeric,
  fige          boolean not null default false,
  validateur_id uuid,
  validated_at  timestamptz,
  hash          text,
  prev_hash     text,
  created_at    timestamptz not null default now(),
  unique (tenant_id, scope, scope_id, campagne_id, periode_type, periode_ref)
);
create index if not exists perf_scores_scope_idx on perf_scores (tenant_id, scope, scope_id);
create index if not exists perf_scores_camp_idx  on perf_scores (tenant_id, campagne_id, periode_type);

-- ---------------------------------------------------------------------------
-- 8. ARBITRAGES — écart auto/valide > seuil (§7.3)
-- ---------------------------------------------------------------------------
create table if not exists perf_arbitrages (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null,
  campagne_id        uuid not null references perf_campagnes(id) on delete cascade,
  objectif_id        uuid references perf_objectifs(id) on delete cascade,
  scope_id           uuid,                              -- employe concerné
  ecart              numeric not null,
  commentaire_employe text,
  decision_rh        text,
  decideur_id        uuid,
  statut             text not null default 'ouvert' check (statut in
                       ('ouvert','commente','arbitre','clos')),
  created_at         timestamptz not null default now(),
  resolved_at        timestamptz,
  unique (campagne_id, objectif_id, scope_id)
);
create index if not exists perf_arb_open_idx on perf_arbitrages (tenant_id, campagne_id)
  where statut <> 'clos';

-- ---------------------------------------------------------------------------
-- 9. PREUVES — réutilisables côté M9 (§5.4, R9)
-- ---------------------------------------------------------------------------
create table if not exists preuves (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null,
  employe_id       uuid not null,
  type             text check (type in ('tache','projet')),
  source_action_id uuid references perf_actions(id) on delete set null,  -- M9 reuse
  titre            text,
  description      text,
  fichier_advist_id uuid,
  date             date,
  validee_par      uuid,
  created_at       timestamptz not null default now()
);
create index if not exists preuves_emp_idx on preuves (tenant_id, employe_id);

-- FK différée de perf_action_evaluations.preuve_id → preuves(id)
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'perf_aeval_preuve_fk' and table_name = 'perf_action_evaluations'
  ) then
    alter table perf_action_evaluations
      add constraint perf_aeval_preuve_fk foreign key (preuve_id)
      references preuves(id) on delete set null;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 10. ÉVÉNEMENTS — accroche bonus M3 (§9 : evaluation.validee)
-- ---------------------------------------------------------------------------
create table if not exists perf_events (
  id          bigserial primary key,
  tenant_id   uuid not null,
  event_type  text not null,                            -- 'evaluation.validee'
  campagne_id uuid,
  scope       text,
  scope_id    uuid,
  periode_ref text,
  payload     jsonb,
  emitted_at  timestamptz not null default now(),
  consumed_at timestamptz                               -- M3 marque la consommation
);
create index if not exists perf_events_unconsumed_idx on perf_events (tenant_id, event_type)
  where consumed_at is null;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- touch updated_at générique
create or replace function perf_touch_updated_at() returns trigger
language plpgsql set search_path = atlas_people, public as $$
begin new.updated_at = now(); return new; end $$;

do $$ begin
  drop trigger if exists perf_obj_touch on perf_objectifs;
  create trigger perf_obj_touch before update on perf_objectifs
    for each row execute function perf_touch_updated_at();
  drop trigger if exists perf_aeval_touch on perf_action_evaluations;
  create trigger perf_aeval_touch before update on perf_action_evaluations
    for each row execute function perf_touch_updated_at();
end $$;

-- ---------------------------------------------------------------------------
-- trg_check_poids_100 — garde-fou : Σ poids ≤ 100 (R2). Le gate strict = 100
-- est appliqué au passage objectifs_definis par rpc_definir_objectifs.
-- ---------------------------------------------------------------------------
create or replace function perf_check_poids_objectifs() returns trigger
language plpgsql set search_path = atlas_people, public as $$
declare s numeric; ref_campagne uuid; ref_porteur uuid;
begin
  ref_campagne := coalesce(new.campagne_id, old.campagne_id);
  ref_porteur  := coalesce(new.porteur_id, old.porteur_id);
  -- on ne somme que les lignes courantes (non remplacées) d'un même porteur
  select coalesce(sum(poids),0) into s from perf_objectifs
   where campagne_id = ref_campagne
     and porteur_id is not distinct from ref_porteur
     and statut <> 'cloture' and remplace_id is null;
  if s > 100.0001 then
    raise exception 'Σ poids objectifs du porteur dépasse 100 %% (= %).', s;
  end if;
  return coalesce(new, old);
end $$;

create or replace function perf_check_poids_actions() returns trigger
language plpgsql set search_path = atlas_people, public as $$
declare s numeric; ref_obj uuid;
begin
  ref_obj := coalesce(new.objectif_id, old.objectif_id);
  select coalesce(sum(poids),0) into s from perf_actions where objectif_id = ref_obj;
  if s > 100.0001 then
    raise exception 'Σ poids actions de l''objectif % dépasse 100 %% (= %).', ref_obj, s;
  end if;
  return coalesce(new, old);
end $$;

do $$ begin
  drop trigger if exists perf_obj_poids_trg on perf_objectifs;
  create constraint trigger perf_obj_poids_trg
    after insert or update or delete on perf_objectifs
    deferrable initially deferred
    for each row execute function perf_check_poids_objectifs();
  drop trigger if exists perf_act_poids_trg on perf_actions;
  create constraint trigger perf_act_poids_trg
    after insert or update or delete on perf_actions
    deferrable initially deferred
    for each row execute function perf_check_poids_actions();
end $$;

-- ---------------------------------------------------------------------------
-- perf_pct_realisation — §6.2 : réplique de pctRealisation (TS).
--   quantitatif : min((resultat/cible)*100, cap), borné ≥ 0
--   qualitatif  : note/echelle_max*100, borné [0,100]
-- ---------------------------------------------------------------------------
create or replace function perf_pct_realisation(
  p_type_mesure text, p_resultat numeric, p_note numeric,
  p_cible numeric, p_echelle_max int, p_cap numeric
) returns numeric
language plpgsql immutable set search_path = atlas_people, public as $$
declare taux numeric;
begin
  if p_type_mesure = 'quantitatif' then
    if p_cible is null or p_cible <= 0 then return null; end if;
    taux := (coalesce(p_resultat,0) / p_cible) * 100;
    return greatest(0, least(taux, p_cap));
  else
    if p_echelle_max is null or p_echelle_max <= 0 then return null; end if;
    return greatest(0, least((coalesce(p_note,0) / p_echelle_max) * 100, 100));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- trg_recalc_auto — recalcule pct_self & pct_manager + flag retard à chaque
-- saisie d'évaluation (§7.1/§7.2). Atteinte objectif = jamais ici (R1).
-- ---------------------------------------------------------------------------
create or replace function perf_recalc_eval() returns trigger
language plpgsql set search_path = atlas_people, public as $$
declare a perf_actions%rowtype; cfg notation_config%rowtype;
begin
  select * into a from perf_actions where id = new.action_id;
  select * into cfg from notation_config where tenant_id = new.tenant_id;
  if not found then
    -- défauts cohérents si tenant non configuré (§3)
    cfg.echelle_max := 100; cfg.cap_depassement := 100;
  end if;

  new.pct_self := perf_pct_realisation(
    a.type_mesure, new.resultat, new.note, a.cible, cfg.echelle_max, cfg.cap_depassement);

  if new.resultat_manager is not null or new.note_manager is not null then
    new.pct_manager := perf_pct_realisation(
      a.type_mesure, new.resultat_manager, new.note_manager, a.cible,
      cfg.echelle_max, cfg.cap_depassement);
  end if;

  -- trg_flag_retard (§5.3)
  new.en_retard := (a.date_echeance is not null
                    and a.date_echeance < current_date
                    and coalesce(new.statut, a.statut) not in ('realisee','figee'));
  return new;
end $$;

do $$ begin
  drop trigger if exists perf_aeval_recalc on perf_action_evaluations;
  create trigger perf_aeval_recalc before insert or update on perf_action_evaluations
    for each row execute function perf_recalc_eval();
end $$;

-- ---------------------------------------------------------------------------
-- Immutabilité des snapshots figés (R6) + audit chaîné SHA-256 (§13).
-- ---------------------------------------------------------------------------
create or replace function perf_score_freeze_guard() returns trigger
language plpgsql set search_path = atlas_people, public as $$
begin
  if old.fige and old.hash is not null then
    raise exception 'perf_scores % figé : modification interdite (R6).', old.id;
  end if;
  return new;
end $$;

do $$ begin
  drop trigger if exists perf_scores_freeze on perf_scores;
  create trigger perf_scores_freeze before update on perf_scores
    for each row when (old.fige is true) execute function perf_score_freeze_guard();
end $$;

-- hash chaîné : sha256( prev_hash || canonical_json(record) ), cf. src/lib/audit.ts
create or replace function perf_chain_hash(p_prev text, p_payload jsonb) returns text
language sql immutable set search_path = atlas_people, public, extensions as $$
  select encode(digest(coalesce(p_prev,'') || '|' ||
    (select string_agg(k || ':' || coalesce(p_payload->>k,''), ',' order by k)
       from jsonb_object_keys(p_payload) k), 'sha256'), 'hex');
$$;

-- ============================================================================
-- RPC — moteur de calcul SECURITY DEFINER (§11.2), réplique du noyau TS.
-- ============================================================================

-- §6.4 mensuel : Σ(poids·pct)/Σ poids_actives. §6.4 semestriel : Σ(poids·pct)/100.
-- couche ∈ ('auto','valide') sélectionne pct_self vs pct_manager (§6.7).
create or replace function rpc_calcul_atteinte_objectif(
  p_objectif_id uuid, p_periode_type text, p_ref text, p_couche text
) returns numeric
language plpgsql security definer set search_path = atlas_people, public as $$
declare result numeric;
begin
  if p_periode_type = 'mois' then
    -- renormalisé sur les actions actives le mois
    select case when sum(a.poids) filter (where e.actif_mois) is null
                  or sum(a.poids) filter (where e.actif_mois) = 0 then 0
                else sum(a.poids * coalesce(case when p_couche='valide' then e.pct_manager else e.pct_self end,0))
                       filter (where e.actif_mois)
                     / sum(a.poids) filter (where e.actif_mois)
           end
      into result
      from perf_actions a
      join perf_action_evaluations e
        on e.action_id = a.id and e.periode_mois = to_date(p_ref || '-01','YYYY-MM-DD')
     where a.objectif_id = p_objectif_id;
  else
    -- semestriel : Σ poids = 100 garanti (R2) → moyenne pondérée sur toutes actions
    select case when coalesce(sum(a.poids),0) = 0 then 0
                else sum(a.poids * coalesce(s.pct,0)) / sum(a.poids) end
      into result
      from perf_actions a
      left join lateral (
        select case when p_couche='valide' then e.pct_manager else e.pct_self end as pct
          from perf_action_evaluations e
         where e.action_id = a.id
         order by e.periode_mois desc limit 1
      ) s on true
     where a.objectif_id = p_objectif_id;
  end if;
  return coalesce(result, 0);
end $$;

-- §6.5 score employé : α·indiv + (1−α)·collectif, par moyenne pondérée des objectifs.
create or replace function rpc_calcul_score_employe(
  p_employe_id uuid, p_campagne_id uuid, p_couche text
) returns numeric
language plpgsql security definer set search_path = atlas_people, public as $$
declare cfg notation_config%rowtype; v_ind numeric; v_col numeric; v_tenant uuid; v_has_col boolean;
begin
  select tenant_id into v_tenant from perf_campagnes where id = p_campagne_id;
  select * into cfg from notation_config where tenant_id = v_tenant;
  if not found then cfg.alpha_collectif := 1; end if;

  -- atteinte annuelle par objectif employé = pondération des deux semestres
  with obj as (
    select o.id, o.poids, o.est_collectif,
           (coalesce((cfg.ponderation_semestres->>'s1')::numeric,50)
              * rpc_calcul_atteinte_objectif(o.id,'semestre','S1',p_couche)
            + coalesce((cfg.ponderation_semestres->>'s2')::numeric,50)
              * rpc_calcul_atteinte_objectif(o.id,'semestre','S2',p_couche))
           / nullif(coalesce((cfg.ponderation_semestres->>'s1')::numeric,50)
                    + coalesce((cfg.ponderation_semestres->>'s2')::numeric,50),0) as pct_annuel
      from perf_objectifs o
     where o.campagne_id = p_campagne_id and o.niveau = 'employe'
       and o.porteur_id = p_employe_id and o.statut <> 'cloture' and o.remplace_id is null
  )
  select coalesce(sum(poids*pct_annuel) filter (where not est_collectif)
                  / nullif(sum(poids) filter (where not est_collectif),0),0),
         coalesce(sum(poids*pct_annuel) filter (where est_collectif)
                  / nullif(sum(poids) filter (where est_collectif),0),0),
         bool_or(est_collectif)
    into v_ind, v_col, v_has_col
    from obj;

  if not coalesce(v_has_col,false) then return round(v_ind,4); end if;
  return round(cfg.alpha_collectif * v_ind + (1 - cfg.alpha_collectif) * v_col, 4);
end $$;

-- §6.6 remontée : département puis global, couche validée (R4).
create or replace function rpc_remontee_consolidee(p_campagne_id uuid, p_couche text)
returns void
language plpgsql security definer set search_path = atlas_people, public as $$
declare v_tenant uuid; d record; col text;
begin
  select tenant_id into v_tenant from perf_campagnes where id = p_campagne_id;
  col := case when p_couche='valide' then 'pct_valide' else 'pct_auto' end;

  -- département : Σ(poids_contribution · score_employé) / Σ poids_contribution
  for d in
    select o.id as dept_obj_id, o.porteur_id as dept_id,
           coalesce(sum(c.poids_contribution
                        * rpc_calcul_score_employe(c.employe_id, p_campagne_id, p_couche))
                    / nullif(sum(c.poids_contribution),0),0) as pct
      from perf_objectifs o
      join perf_objectif_contributions c on c.objectif_dept_id = o.id
     where o.campagne_id = p_campagne_id and o.niveau = 'departement'
     group by o.id, o.porteur_id
  loop
    insert into perf_scores(tenant_id, scope, scope_id, campagne_id, periode_type, periode_ref, pct_auto, pct_valide)
    values (v_tenant,'departement', d.dept_id, p_campagne_id,'annee','rollup',
            case when p_couche='valide' then null else d.pct end,
            case when p_couche='valide' then d.pct else null end)
    on conflict (tenant_id, scope, scope_id, campagne_id, periode_type, periode_ref)
      do update set pct_auto = case when p_couche='valide' then perf_scores.pct_auto else excluded.pct_auto end,
                    pct_valide = case when p_couche='valide' then excluded.pct_valide else perf_scores.pct_valide end;
  end loop;

  -- global : Σ(poids_objectif_département · pct_département) / Σ poids, Σ = 100 (R2).
  -- Chaque objectif de niveau département porte le poids du département dans le
  -- global ; on le pondère par le score consolidé de ce département.
  insert into perf_scores(tenant_id, scope, scope_id, campagne_id, periode_type, periode_ref, pct_auto, pct_valide)
  select v_tenant,'global', null, p_campagne_id,'annee','rollup',
         case when p_couche='valide' then null else g.pct end,
         case when p_couche='valide' then g.pct else null end
    from (
      select coalesce(sum(o.poids * coalesce(case when p_couche='valide' then s.pct_valide else s.pct_auto end,0))
                      / nullif(sum(o.poids),0),0) as pct
        from perf_objectifs o
        left join perf_scores s
          on s.scope='departement' and s.scope_id = o.porteur_id
         and s.campagne_id = p_campagne_id and s.periode_type='annee' and s.periode_ref='rollup'
       where o.campagne_id = p_campagne_id and o.niveau='departement'
    ) g
  on conflict (tenant_id, scope, scope_id, campagne_id, periode_type, periode_ref)
    do update set pct_auto = case when p_couche='valide' then perf_scores.pct_auto else excluded.pct_auto end,
                  pct_valide = case when p_couche='valide' then excluded.pct_valide else perf_scores.pct_valide end;
end $$;

-- §8 snapshot mensuel figé + hash chaîné (R6).
create or replace function rpc_consolide_mensuel(p_tenant_id uuid, p_mois date)
returns int
language plpgsql security definer set search_path = atlas_people, public, extensions as $$
declare e record; v_prev text; v_hash text; n int := 0; v_ref text;
begin
  v_ref := to_char(p_mois,'YYYY-MM');
  for e in
    select distinct o.campagne_id, o.porteur_id as employe_id
      from perf_objectifs o
     where o.tenant_id = p_tenant_id and o.niveau='employe' and o.porteur_id is not null
  loop
    -- chaînage : dernier hash figé du même scope
    select hash into v_prev from perf_scores
      where tenant_id=p_tenant_id and scope='employe' and scope_id=e.employe_id
        and fige is true and hash is not null
      order by created_at desc limit 1;
    v_prev := coalesce(v_prev, repeat('0',64));

    insert into perf_scores(tenant_id, scope, scope_id, campagne_id, periode_type, periode_ref,
                            pct_auto, fige, prev_hash, hash)
    select p_tenant_id,'employe', e.employe_id, e.campagne_id,'mois', v_ref,
           coalesce(sum(o.poids * rpc_calcul_atteinte_objectif(o.id,'mois',v_ref,'auto'))
                    / nullif(sum(o.poids),0),0),
           true, v_prev,
           perf_chain_hash(v_prev, jsonb_build_object(
             'scope','employe','scopeId',e.employe_id,'campagneId',e.campagne_id,
             'periodeType','mois','periodeRef',v_ref))
      from perf_objectifs o
     where o.campagne_id = e.campagne_id and o.niveau='employe' and o.porteur_id = e.employe_id
       and o.statut <> 'cloture' and o.remplace_id is null
    on conflict (tenant_id, scope, scope_id, campagne_id, periode_type, periode_ref)
      do nothing;
    n := n + 1;
  end loop;
  return n;
end $$;

-- §7.3 ouvre les arbitrages quand |auto − valide| > seuil sur un objectif.
create or replace function rpc_ouvre_arbitrages(p_campagne_id uuid, p_employe_id uuid)
returns int
language plpgsql security definer set search_path = atlas_people, public as $$
declare cfg notation_config%rowtype; v_tenant uuid; o record; v_auto numeric; v_val numeric; n int := 0;
begin
  select tenant_id into v_tenant from perf_campagnes where id = p_campagne_id;
  select * into cfg from notation_config where tenant_id = v_tenant;
  if not found then cfg.seuil_arbitrage := 20; end if;

  for o in select id from perf_objectifs
            where campagne_id=p_campagne_id and niveau='employe' and porteur_id=p_employe_id
              and statut <> 'cloture' and remplace_id is null
  loop
    v_auto := rpc_calcul_atteinte_objectif(o.id,'semestre','S1','auto');
    v_val  := rpc_calcul_atteinte_objectif(o.id,'semestre','S1','valide');
    if abs(coalesce(v_auto,0) - coalesce(v_val,0)) > cfg.seuil_arbitrage then
      insert into perf_arbitrages(tenant_id, campagne_id, objectif_id, scope_id, ecart)
      values (v_tenant, p_campagne_id, o.id, p_employe_id, abs(v_auto - v_val))
      on conflict (campagne_id, objectif_id, scope_id) do nothing;
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

-- §7.4/§9 fige, signe et émet evaluation.validee (accroche bonus M3).
create or replace function rpc_valide_evaluation(
  p_campagne_id uuid, p_employe_id uuid, p_validateur_id uuid
) returns numeric
language plpgsql security definer set search_path = atlas_people, public, extensions as $$
declare v_tenant uuid; v_score numeric; v_prev text; v_hash text;
begin
  select tenant_id into v_tenant from perf_campagnes where id = p_campagne_id;
  v_score := rpc_calcul_score_employe(p_employe_id, p_campagne_id, 'valide');

  select hash into v_prev from perf_scores
    where tenant_id=v_tenant and scope='employe' and scope_id=p_employe_id
      and fige is true and hash is not null order by created_at desc limit 1;
  v_prev := coalesce(v_prev, repeat('0',64));
  v_hash := perf_chain_hash(v_prev, jsonb_build_object(
    'scope','employe','scopeId',p_employe_id,'campagneId',p_campagne_id,
    'periodeType','annee','periodeRef','final','pct',v_score::text));

  insert into perf_scores(tenant_id, scope, scope_id, campagne_id, periode_type, periode_ref,
                          pct_valide, fige, validateur_id, validated_at, prev_hash, hash)
  values (v_tenant,'employe', p_employe_id, p_campagne_id,'annee','final',
          v_score, true, p_validateur_id, now(), v_prev, v_hash)
  on conflict (tenant_id, scope, scope_id, campagne_id, periode_type, periode_ref)
    do update set pct_valide = excluded.pct_valide, validateur_id = excluded.validateur_id,
                  validated_at = now(), fige = true, prev_hash = excluded.prev_hash, hash = excluded.hash
    where perf_scores.fige is not true;

  -- §9 accroche bonus : score validé exposé en lecture seule à M3
  insert into perf_events(tenant_id, event_type, campagne_id, scope, scope_id, periode_ref, payload)
  values (v_tenant,'evaluation.validee', p_campagne_id,'employe', p_employe_id,'final',
          jsonb_build_object('score', v_score, 'validateur', p_validateur_id));
  return v_score;
end $$;

-- gate R2 : refuse le passage à objectifs_definis si Σ poids ≠ 100.
create or replace function rpc_definir_objectifs(p_campagne_id uuid)
returns void
language plpgsql security definer set search_path = atlas_people, public as $$
declare bad record;
begin
  for bad in
    select porteur_id, sum(poids) s from perf_objectifs
     where campagne_id = p_campagne_id and statut <> 'cloture' and remplace_id is null
     group by porteur_id having round(sum(poids),4) <> 100
  loop
    raise exception 'Porteur % : Σ poids objectifs = % (≠ 100, R2).', bad.porteur_id, bad.s;
  end loop;
  update perf_campagnes set statut = 'objectifs_definis'
   where id = p_campagne_id and statut = 'brouillon';
end $$;

-- ============================================================================
-- RLS — strict par rôle / périmètre (§11.1, R8)
-- ============================================================================
-- Toutes les tables : RLS ON + écriture RH/admin du tenant.
do $$
declare t text;
begin
  foreach t in array array[
    'notation_config','perf_campagnes','perf_objectifs','perf_actions',
    'perf_action_evaluations','perf_objectif_contributions','perf_scores',
    'perf_arbitrages','preuves','perf_events'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format($f$drop policy if exists perf_tenant_write on %I$f$, t);
    execute format($f$create policy perf_tenant_write on %I for all
      using (tenant_id = any (current_tenant_ids()) and is_hr_or_admin(tenant_id))
      with check (tenant_id = any (current_tenant_ids()) and is_hr_or_admin(tenant_id))$f$, t);
  end loop;
end $$;

-- Lecture TENANT-LARGE réservée aux tables non sensibles (référentiel & cascade) :
-- objectifs/actions/config/campagnes/contributions sont consultables par tous
-- les rôles du tenant (§2 « Consulter ses objectifs/actions »).
do $$
declare t text;
begin
  foreach t in array array[
    'notation_config','perf_campagnes','perf_objectifs','perf_actions',
    'perf_objectif_contributions'
  ]
  loop
    execute format($f$drop policy if exists perf_tenant_read on %I$f$, t);
    execute format($f$create policy perf_tenant_read on %I for select
      using (tenant_id = any (current_tenant_ids()))$f$, t);
  end loop;
end $$;
-- Les tables SENSIBLES (perf_scores, perf_action_evaluations, perf_arbitrages,
-- preuves, perf_events) n'ont PAS de lecture tenant-large : seules les policies
-- scopées ci-dessous ouvrent l'accès (R8).

-- perf_scores : employé voit SON scope ; manager voit son équipe (N-1). (§11.1)
drop policy if exists perf_scores_self on perf_scores;
create policy perf_scores_self on perf_scores for select using (
  tenant_id = any (current_tenant_ids()) and (
    is_hr_or_admin(tenant_id)
    or (scope = 'employe' and scope_id in (select current_employee_ids()))
    or (scope = 'employe' and is_manager_of(scope_id))
  )
);

-- perf_action_evaluations : employé met à jour SES actions (auto-évaluation,
-- §2) ; le manager contre-évalue (équipe). RH/admin déjà couverts.
drop policy if exists perf_aeval_self_write on perf_action_evaluations;
create policy perf_aeval_self_write on perf_action_evaluations for all using (
  tenant_id = any (current_tenant_ids()) and (
    is_hr_or_admin(tenant_id)
    or evaluateur_id in (select current_employee_ids())
    or exists (
      select 1 from perf_actions a join perf_objectifs o on o.id = a.objectif_id
       where a.id = perf_action_evaluations.action_id
         and (o.porteur_id in (select current_employee_ids()) or is_manager_of(o.porteur_id))
    )
  )
) with check (tenant_id = any (current_tenant_ids()));

-- preuves : l'employé voit/gère les siennes ; manager (N-1) en lecture.
drop policy if exists preuves_self on preuves;
create policy preuves_self on preuves for select using (
  tenant_id = any (current_tenant_ids()) and (
    is_hr_or_admin(tenant_id)
    or employe_id in (select current_employee_ids())
    or is_manager_of(employe_id)
  )
);

-- perf_arbitrages : RH/Direction arbitrent ; l'employé concerné lit son écart et
-- saisit son commentaire obligatoire (§7.3) ; manager (N-1) en lecture.
drop policy if exists perf_arb_scoped_read on perf_arbitrages;
create policy perf_arb_scoped_read on perf_arbitrages for select using (
  tenant_id = any (current_tenant_ids()) and (
    is_hr_or_admin(tenant_id)
    or scope_id in (select current_employee_ids())
    or is_manager_of(scope_id)
  )
);
drop policy if exists perf_arb_employe_comment on perf_arbitrages;
create policy perf_arb_employe_comment on perf_arbitrages for update using (
  tenant_id = any (current_tenant_ids()) and scope_id in (select current_employee_ids())
) with check (
  tenant_id = any (current_tenant_ids()) and scope_id in (select current_employee_ids())
);

-- perf_events : file d'accroche bonus — RH/Direction uniquement (M3 consomme via
-- service role qui contourne RLS). Pas d'accès employé (gating bonus R6/§9).
drop policy if exists perf_events_rh_read on perf_events;
create policy perf_events_rh_read on perf_events for select using (
  tenant_id = any (current_tenant_ids()) and is_hr_or_admin(tenant_id)
);

-- ---------------------------------------------------------------------------
-- COMMENTAIRES
-- ---------------------------------------------------------------------------
comment on table notation_config is
  'Paramétrage tenant du moteur Performance (échelle, cap, α collectif, poids semestres, seuil arbitrage). Défauts neutres et défendables (note de cadrage §3).';
comment on function rpc_calcul_score_employe(uuid,uuid,text) is
  'Score employé §6.5 : α·individuel + (1−α)·collectif. Réplique src/engine/performance/scoring.ts (testé).';
comment on function rpc_valide_evaluation(uuid,uuid,uuid) is
  'Fige le score validé, chaîne SHA-256 et émet evaluation.validee (accroche bonus M3, §9). Couche validée = seule officielle (R4).';
comment on table perf_events is
  'File d''événements consommés par M3 (bonus). evaluation.validee expose le score final validé en lecture seule (§9).';
