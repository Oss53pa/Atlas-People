-- ============================================================================
-- Atlas People — Seed DÉMO du moteur Performance (M7/M8) + accroche Bonus (M3).
-- Tenant démo 11111111-1111-1111-1111-111111111111. Idempotent (purge + recrée
-- la campagne 2026). Emploie de VRAIS employés du tenant démo.
--
-- Campagne 2026 · 2 départements (Technologie, Finance) · 3 employés :
--   Mariam (e…005) · Serge (e…008, gros écart self/manager → arbitrage) · Yao (e…006).
--
-- Après le seed, dérouler le pipeline live :
--   select rpc_definir_objectifs('ca262626-0000-0000-0000-000000000001');
--   select rpc_consolide_mensuel('11111111-1111-1111-1111-111111111111','2026-06-01');
--   select rpc_valide_evaluation('ca262626-…','<employe>','<rh>');   -- ×3
--   select rpc_remontee_consolidee('ca262626-…','valide');
--   select rpc_remontee_consolidee('ca262626-…','auto');
--
-- Suppression : delete from perf_campagnes where id='ca262626-0000-0000-0000-000000000001';
-- ============================================================================
set search_path = atlas_people, public, extensions;

do $$
declare
  t uuid := '11111111-1111-1111-1111-111111111111';
  camp uuid := 'ca262626-0000-0000-0000-000000000001';
  gobj uuid := 'a0000000-0000-0000-0000-0000000000f1';
  dtech uuid := 'a0000000-0000-0000-0000-0000000000d1';
  dfin  uuid := 'a0000000-0000-0000-0000-0000000000d2';
  ptech uuid := 'd7000000-0000-0000-0000-000000000001';
  pfin  uuid := 'd7000000-0000-0000-0000-000000000002';
  oM uuid := 'a0000000-0000-0000-0000-000000000005';
  oS uuid := 'a0000000-0000-0000-0000-000000000008';
  oY uuid := 'a0000000-0000-0000-0000-000000000006';
  actM uuid := 'ac000000-0000-0000-0000-000000000005';
  actS uuid := 'ac000000-0000-0000-0000-000000000008';
  actY uuid := 'ac000000-0000-0000-0000-000000000006';
  eM uuid := 'e1000001-0000-0000-0000-000000000005';
  eS uuid := 'e1000001-0000-0000-0000-000000000008';
  eY uuid := 'e1000001-0000-0000-0000-000000000006';
begin
  delete from perf_events where campagne_id = camp;
  delete from perf_campagnes where id = camp;  -- cascade objectifs/actions/evals/scores/arbitrages/contributions

  insert into notation_config(tenant_id, echelle_max, cap_depassement, alpha_collectif, seuil_arbitrage)
  values (t, 100, 120, 1, 20)
  on conflict (tenant_id) do update set cap_depassement = 120, alpha_collectif = 1, seuil_arbitrage = 20;

  insert into perf_campagnes(id, tenant_id, annee, statut) values (camp, t, 2026, 'en_cours');

  insert into perf_objectifs(id, tenant_id, campagne_id, niveau, parent_id, porteur_type, porteur_id, libelle, poids, statut) values
    (gobj, t, camp, 'global', null, 'entreprise', null, 'Croissance & fiabilité 2026', 100, 'actif'),
    (dtech, t, camp, 'departement', gobj, 'departement', ptech, 'Excellence Technologie', 100, 'actif'),
    (dfin,  t, camp, 'departement', gobj, 'departement', pfin,  'Rigueur Finance', 100, 'actif'),
    (oM, t, camp, 'employe', dtech, 'employe', eM, 'Design system', 100, 'actif'),
    (oS, t, camp, 'employe', dtech, 'employe', eS, 'Fiabilité plateforme', 100, 'actif'),
    (oY, t, camp, 'employe', dfin,  'employe', eY, 'Clôtures dans les délais', 100, 'actif');

  insert into perf_actions(id, tenant_id, objectif_id, libelle, nature, type_mesure, poids, cible, unite) values
    (actM, t, oM, 'Composants migrés / mois', 'continue', 'quantitatif', 100, 8, 'composants'),
    (actS, t, oS, 'Dashboards fiabilité / mois', 'continue', 'quantitatif', 100, 8, 'dashboards'),
    (actY, t, oY, 'Ponctualité clôture / mois', 'continue', 'quantitatif', 100, 5, 'pts');

  insert into perf_action_evaluations(tenant_id, action_id, periode_mois, resultat, resultat_manager, actif_mois)
  select t, actM, make_date(2026, m::int, 1), s, mgr, true
    from unnest(array[6,7,8,9,8,9], array[6,6,7,8,8,8]) with ordinality as x(s,mgr,m);
  insert into perf_action_evaluations(tenant_id, action_id, periode_mois, resultat, resultat_manager, actif_mois)
  select t, actS, make_date(2026, m::int, 1), s, mgr, true
    from unnest(array[8,9,9,10,9,10], array[3,3,4,4,4,4]) with ordinality as x(s,mgr,m);  -- gros écart → arbitrage
  insert into perf_action_evaluations(tenant_id, action_id, periode_mois, resultat, resultat_manager, actif_mois)
  select t, actY, make_date(2026, m::int, 1), s, mgr, true
    from unnest(array[5,5,6,5,5,4], array[5,6,6,5,5,5]) with ordinality as x(s,mgr,m);

  insert into perf_objectif_contributions(tenant_id, objectif_dept_id, employe_id, objectif_employe_id, poids_contribution) values
    (t, dtech, eM, oM, 2),
    (t, dtech, eS, oS, 2),
    (t, dfin,  eY, oY, 1);

  insert into remu_fiche(tenant_id, employe_id, salaire_mensuel, formule_coef, bonus_formule) values
    (t, eM, 850000, 1, 'SCORE × COEF × SAL_MENS'),
    (t, eS, 1050000, 1, 'SCORE × COEF × SAL_MENS'),
    (t, eY, 620000, 1, 'SCORE × COEF × SAL_MENS')
  on conflict (tenant_id, employe_id) do nothing;
end $$;
