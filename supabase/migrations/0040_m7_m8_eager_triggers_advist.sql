-- ============================================================================
-- Atlas People — M7/M8 : matérialisation eager + signature ADVIST.
-- Lève les deux « écarts de forme » des mises à jour M7/M8 :
--
--   ÉCART 1 — triggers eager nommés exactement comme les CDC :
--     • trg_recalc_auto   : à chaque saisie d'évaluation, matérialise le score
--                           mensuel AUTO (couche temps réel, fige=false) en
--                           cascade — au lieu du calcul à la lecture seul.
--     • trg_open_arbitrage: ouvre/maj un arbitrage dès que la contre-évaluation
--                           manager crée un écart > seuil sur un objectif.
--
--   ÉCART 2 — signature ADVIST (§8 M8) : colonne + RPC de pose de signature sur
--             l'évaluation figée, sans rouvrir le montant (R6/R7 préservés).
--
-- Le snapshot mensuel reste figé + chaîné : rpc_consolide_mensuel fige
-- désormais la ligne live (au lieu de l'ignorer). Additif & idempotent.
-- Dépend de 0036.
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- ---------------------------------------------------------------------------
-- A. Signature ADVIST sur l'évaluation figée (§8 M8)
-- ---------------------------------------------------------------------------
alter table perf_scores add column if not exists signature_advist_id uuid;
alter table perf_scores add column if not exists signataire_id uuid;
alter table perf_scores add column if not exists signed_at timestamptz;

-- ---------------------------------------------------------------------------
-- B. Freeze guard assoupli : la signature ADVIST peut être posée après
--    figement ; les montants/hash restent immuables (R6/R7).
-- ---------------------------------------------------------------------------
create or replace function perf_score_freeze_guard() returns trigger
language plpgsql set search_path = atlas_people, public as $$
begin
  if old.fige and old.hash is not null then
    if new.pct_auto   is distinct from old.pct_auto
       or new.pct_valide is distinct from old.pct_valide
       or new.hash      is distinct from old.hash
       or new.prev_hash is distinct from old.prev_hash then
      raise exception 'perf_scores % figé : montant/hash immuables (R6/R7).', old.id;
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- C. trg_recalc_auto — matérialise le score mensuel AUTO (live, fige=false)
--    à chaque insert/update/delete d'une évaluation d'action (§ M7 §10).
-- ---------------------------------------------------------------------------
create or replace function perf_recalc_auto_cascade() returns trigger
language plpgsql set search_path = atlas_people, public as $$
declare v_obj perf_objectifs%rowtype; v_mois date; v_ref text; v_pct numeric;
begin
  select o.* into v_obj
    from perf_actions a join perf_objectifs o on o.id = a.objectif_id
   where a.id = coalesce(new.action_id, old.action_id);
  if not found or v_obj.niveau <> 'employe' or v_obj.porteur_id is null then
    return coalesce(new, old);
  end if;

  v_mois := coalesce(new.periode_mois, old.periode_mois);
  v_ref  := to_char(v_mois, 'YYYY-MM');

  -- score mensuel auto employé = moyenne pondérée des objectifs (atteinte mois)
  select coalesce(sum(o.poids * rpc_calcul_atteinte_objectif(o.id,'mois',v_ref,'auto'))
                  / nullif(sum(o.poids),0), 0)
    into v_pct
    from perf_objectifs o
   where o.campagne_id = v_obj.campagne_id and o.niveau='employe'
     and o.porteur_id = v_obj.porteur_id and o.statut <> 'cloture' and o.remplace_id is null;

  insert into perf_scores(tenant_id, scope, scope_id, campagne_id, periode_type, periode_ref, pct_auto, fige)
  values (v_obj.tenant_id,'employe', v_obj.porteur_id, v_obj.campagne_id,'mois', v_ref, v_pct, false)
  on conflict (tenant_id, scope, scope_id, campagne_id, periode_type, periode_ref)
    do update set pct_auto = excluded.pct_auto
    where perf_scores.fige is not true;          -- ne touche jamais un snapshot figé
  return coalesce(new, old);
end $$;

do $$ begin
  drop trigger if exists trg_recalc_auto on perf_action_evaluations;
  create trigger trg_recalc_auto
    after insert or update or delete on perf_action_evaluations
    for each row execute function perf_recalc_auto_cascade();
end $$;

-- ---------------------------------------------------------------------------
-- D. trg_open_arbitrage — ouvre/maj un arbitrage à la contre-évaluation
--    manager si |pct_auto − pct_valide| > seuil sur l'objectif (§6.2 M8).
-- ---------------------------------------------------------------------------
create or replace function perf_open_arbitrage_trg() returns trigger
language plpgsql set search_path = atlas_people, public as $$
declare v_obj perf_objectifs%rowtype; cfg notation_config%rowtype;
        v_sem text; v_auto numeric; v_val numeric; v_ecart numeric;
begin
  -- seulement quand la contre-évaluation manager est posée/modifiée
  if tg_op = 'UPDATE' and new.pct_manager is not distinct from old.pct_manager then
    return new;
  end if;
  if new.pct_manager is null then return new; end if;

  select o.* into v_obj
    from perf_actions a join perf_objectifs o on o.id = a.objectif_id
   where a.id = new.action_id;
  if not found or v_obj.niveau <> 'employe' then return new; end if;

  select * into cfg from notation_config where tenant_id = new.tenant_id;
  if not found then cfg.seuil_arbitrage := 20; end if;

  v_sem := case when extract(month from new.periode_mois) <= 6 then 'S1' else 'S2' end;
  v_auto := rpc_calcul_atteinte_objectif(v_obj.id, 'semestre', v_sem, 'auto');
  v_val  := rpc_calcul_atteinte_objectif(v_obj.id, 'semestre', v_sem, 'valide');
  v_ecart := abs(coalesce(v_auto,0) - coalesce(v_val,0));

  if v_ecart > cfg.seuil_arbitrage then
    insert into perf_arbitrages(tenant_id, campagne_id, objectif_id, scope_id, ecart)
    values (new.tenant_id, v_obj.campagne_id, v_obj.id, v_obj.porteur_id, v_ecart)
    on conflict (campagne_id, objectif_id, scope_id)
      do update set ecart = excluded.ecart
      where perf_arbitrages.statut <> 'clos';
  end if;
  return new;
end $$;

do $$ begin
  drop trigger if exists trg_open_arbitrage on perf_action_evaluations;
  create trigger trg_open_arbitrage
    after insert or update on perf_action_evaluations
    for each row execute function perf_open_arbitrage_trg();
end $$;

-- ---------------------------------------------------------------------------
-- E. rpc_consolide_mensuel — fige désormais la ligne live (au lieu de
--    l'ignorer), tout en restant idempotent sur un mois déjà figé.
-- ---------------------------------------------------------------------------
create or replace function rpc_consolide_mensuel(p_tenant_id uuid, p_mois date)
returns int
language plpgsql security definer set search_path = atlas_people, public, extensions as $$
declare e record; v_prev text; v_hash text; n int := 0; v_ref text; v_pct numeric;
begin
  v_ref := to_char(p_mois,'YYYY-MM');
  for e in
    select distinct o.campagne_id, o.porteur_id as employe_id
      from perf_objectifs o
     where o.tenant_id = p_tenant_id and o.niveau='employe' and o.porteur_id is not null
  loop
    select hash into v_prev from perf_scores
      where tenant_id=p_tenant_id and scope='employe' and scope_id=e.employe_id
        and fige is true and hash is not null
      order by created_at desc limit 1;
    v_prev := coalesce(v_prev, repeat('0',64));

    select coalesce(sum(o.poids * rpc_calcul_atteinte_objectif(o.id,'mois',v_ref,'auto'))
                    / nullif(sum(o.poids),0), 0)
      into v_pct
      from perf_objectifs o
     where o.campagne_id = e.campagne_id and o.niveau='employe' and o.porteur_id = e.employe_id
       and o.statut <> 'cloture' and o.remplace_id is null;

    v_hash := perf_chain_hash(v_prev, jsonb_build_object(
      'scope','employe','scopeId',e.employe_id,'campagneId',e.campagne_id,
      'periodeType','mois','periodeRef',v_ref));

    insert into perf_scores(tenant_id, scope, scope_id, campagne_id, periode_type, periode_ref,
                            pct_auto, fige, prev_hash, hash)
    values (p_tenant_id,'employe', e.employe_id, e.campagne_id,'mois', v_ref, v_pct, true, v_prev, v_hash)
    on conflict (tenant_id, scope, scope_id, campagne_id, periode_type, periode_ref)
      do update set pct_auto = excluded.pct_auto, fige = true,
                    prev_hash = excluded.prev_hash, hash = excluded.hash
      where perf_scores.fige is not true;        -- fige la ligne live, idempotent si déjà figée
    n := n + 1;
  end loop;
  return n;
end $$;

-- ---------------------------------------------------------------------------
-- F. rpc_signe_evaluation_advist — pose la signature ADVIST sur l'évaluation
--    annuelle figée (§8 M8). Le freeze guard autorise la signature seule.
-- ---------------------------------------------------------------------------
create or replace function rpc_signe_evaluation_advist(
  p_score_id uuid, p_advist_id uuid, p_signataire_id uuid
) returns void
language plpgsql security definer set search_path = atlas_people, public as $$
begin
  update perf_scores
     set signature_advist_id = p_advist_id, signataire_id = p_signataire_id, signed_at = now()
   where id = p_score_id and scope = 'employe' and periode_type = 'annee' and fige is true;
  if not found then
    raise exception 'perf_score % introuvable ou non figé : signature impossible.', p_score_id;
  end if;
end $$;

comment on function rpc_signe_evaluation_advist(uuid,uuid,uuid) is
  'Pose la signature ADVIST sur l''évaluation annuelle figée (§8 M8). Montant/hash inchangés (R6/R7).';
comment on function perf_recalc_auto_cascade() is
  'trg_recalc_auto : matérialise le score mensuel auto (live, fige=false) en cascade à chaque évaluation (M7 §10).';
