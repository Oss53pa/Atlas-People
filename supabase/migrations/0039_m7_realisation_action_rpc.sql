-- ============================================================================
-- Atlas People — M7 OKR : RPC de réalisation d'action (mise à jour M7 §11).
-- Ajoute la fonction nommée `rpc_calcul_realisation_action(action_id, mois,
-- couche)` listée au CDC/mise à jour M7, en complément du moteur déjà livré en
-- 0036 (perf_pct_realisation + rpc_calcul_atteinte_objectif).
--
-- Retourne le % de réalisation d'une action sur un MOIS donné, couche
-- auto (self) ou valide (manager). Réplique de pctRealisation (§6.2,
-- src/engine/performance) : utilise le pct déjà calculé par le trigger et
-- retombe sur le calcul à partir de la mesure brute si besoin.
--
-- Additif & idempotent. Dépend de 0036.
-- ============================================================================
set search_path = atlas_people, public, extensions;

create or replace function rpc_calcul_realisation_action(
  p_action_id uuid, p_mois date, p_couche text
) returns numeric
language plpgsql security definer set search_path = atlas_people, public as $$
declare a perf_actions%rowtype; cfg notation_config%rowtype; e perf_action_evaluations%rowtype;
begin
  select * into a from perf_actions where id = p_action_id;
  if not found then return null; end if;

  select * into cfg from notation_config where tenant_id = a.tenant_id;
  if not found then cfg.echelle_max := 100; cfg.cap_depassement := 100; end if;

  select * into e from perf_action_evaluations
   where action_id = p_action_id and periode_mois = p_mois;
  if not found then return null; end if;

  if p_couche = 'valide' then
    return coalesce(
      e.pct_manager,
      perf_pct_realisation(a.type_mesure, e.resultat_manager, e.note_manager,
                           a.cible, cfg.echelle_max, cfg.cap_depassement));
  end if;
  return coalesce(
    e.pct_self,
    perf_pct_realisation(a.type_mesure, e.resultat, e.note,
                         a.cible, cfg.echelle_max, cfg.cap_depassement));
end $$;

comment on function rpc_calcul_realisation_action(uuid,date,text) is
  '% de réalisation d''une action sur un mois (couche auto/valide), §6.2 / mise à jour M7 §11. Réplique pctRealisation (src/engine/performance).';
