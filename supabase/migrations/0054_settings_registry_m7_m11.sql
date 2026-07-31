-- =====================================================================
-- V13 · Manifestes settings_registry — M7 OKR, M8 Évaluations,
-- M10 Carrières, M11 Formation.
--
-- Source : constantes exportées et nommées des référentiels de chaque
-- module (src/lib/m{7,8,10,11}/referentiels.ts). Entrées atlas globales
-- (tenant_id NULL) — les tenants surchargent via settings_override.
--
-- M9 Compétences est délibérément absent : au moment de cette migration
-- ses seuils étaient en dur dans le JSX sans constante nommée exportée.
-- Voir 0056_settings_registry_m9.sql pour son manifeste, ajouté après
-- extraction en constantes (COMPETENCE_THRESHOLDS).
-- =====================================================================

insert into atlas_people.settings_registry
  (module_code, section, key, display_name, description, data_type, default_value, min_value, max_value, is_system)
values
  -- ── M7 OKR ──────────────────────────────────────────────────────────
  ('M7', 'scoring',   'confidence_green_threshold',  'Seuil confidence verte',        'Progression (0-1) au-delà de laquelle un KR passe en confidence verte.', 'rate', '0.9'::jsonb, '0'::jsonb, '1'::jsonb, false),
  ('M7', 'scoring',   'confidence_amber_threshold',  'Seuil confidence orange',       'Progression (0-1) au-delà de laquelle un KR passe en confidence orange (en-dessous : rouge).', 'rate', '0.6'::jsonb, '0'::jsonb, '1'::jsonb, false),
  ('M7', 'scoring',   'cycle_closure_excellent_score','Score de clôture excellent',   'Score de clôture de cycle (0-1) à partir duquel le cycle est qualifié d''excellent.', 'rate', '0.7'::jsonb, '0'::jsonb, '1'::jsonb, false),
  ('M7', 'alignment', 'cascade_target_pct',          'Taux d''alignement cascade cible','Pourcentage cible d''objectifs équipe alignés sur les objectifs entreprise.', 'rate', '80'::jsonb, '0'::jsonb, '100'::jsonb, false),
  ('M7', 'checkin',   'low_confidence_alert_pct',    'Seuil d''alerte confidence basse','En-dessous de ce pourcentage de probabilité au check-in, une alerte manager est déclenchée.', 'rate', '30'::jsonb, '0'::jsonb, '100'::jsonb, false),

  -- ── M8 Évaluations ──────────────────────────────────────────────────
  ('M8', 'sla', 'auto_eval_days',        'Délai auto-évaluation',          'Jours accordés au collaborateur pour compléter son auto-évaluation depuis le lancement du cycle.', 'number', '14'::jsonb, '1'::jsonb, null, false),
  ('M8', 'sla', 'manager_eval_days',     'Délai évaluation manager',       'Jours accordés au manager pour compléter l''évaluation depuis le lancement du cycle.', 'number', '21'::jsonb, '1'::jsonb, null, false),
  ('M8', 'sla', 'calibration_gap_days',  'Délai avant calibration',        'Jours entre la fin des évaluations et la session de calibration.', 'number', '7'::jsonb, '0'::jsonb, null, false),
  ('M8', 'sla', 'share_within_days',     'Délai de restitution',           'Jours pour restituer le résultat au collaborateur après calibration.', 'number', '5'::jsonb, '0'::jsonb, null, false),
  ('M8', 'sla', 'sign_within_days',      'Délai de signature',             'Jours accordés pour la signature électronique de l''évaluation restituée.', 'number', '14'::jsonb, '1'::jsonb, null, false),
  ('M8', 'sla', 'one_on_one_default_cadence', 'Cadence 1:1 par défaut',     'Cadence par défaut des entretiens 1:1 manager/collaborateur.', 'text', '"biweekly"'::jsonb, null, null, false),
  ('M8', 'weighting', 'dimensions', 'Pondération des dimensions du score', 'Poids (somme = 100) des 5 dimensions du score global d''évaluation (OKR, Compétences, Comportements, Leadership, Culture).', 'json',
    '{"okr":35,"competences":25,"comportements":20,"leadership":10,"culture":10}'::jsonb, null, null, false),
  ('M8', 'calibration', 'distribution_targets', 'Cibles de distribution 9-box', 'Répartition cible des talents par tranche lors de la calibration 9-box.', 'json',
    '[{"box":"top_talent","target_pct":[15,20]},{"box":"solid_performer","target_pct":[50,60]},{"box":"underperformer","target_pct":[5,10]}]'::jsonb, null, null, false),

  -- ── M10 Carrières ─────────────────────────────────────────────────
  ('M10', 'succession', 'bench_strength_strong_threshold',   'Seuil bench "solide"',   'Nombre de successeurs identifiés à partir duquel le plan de succession est qualifié de solide.', 'number', '3'::jsonb, '1'::jsonb, null, false),
  ('M10', 'succession', 'bench_strength_adequate_threshold', 'Seuil bench "suffisant"','Nombre de successeurs identifiés à partir duquel le plan de succession est qualifié de suffisant.', 'number', '2'::jsonb, '1'::jsonb, null, false),
  ('M10', 'succession', 'bench_strength_alert_pct',          'Seuil d''alerte bench strength', 'Pourcentage global de bench strength en-dessous duquel le KPI cockpit passe en alerte.', 'rate', '60'::jsonb, '0'::jsonb, '100'::jsonb, false),
  ('M10', 'retention', 'benchmarks', 'Objectifs de rétention par segment', 'Taux de rétention cible par segment talent (grille 9-box).', 'json',
    '{"top_talent":95,"high_performer":90,"solid_performer":85,"underperformer":50}'::jsonb, null, null, false),

  -- ── M11 Formation ─────────────────────────────────────────────────
  ('M11', 'thresholds', 'cert_expiration_alert_days',   'Alerte expiration certification',  'Jours avant expiration d''une certification à partir desquels une alerte est déclenchée.', 'number', '90'::jsonb, '1'::jsonb, null, false),
  ('M11', 'thresholds', 'plan_validation_dg_amount',    'Plafond validation DG',             'Montant (FCFA) du plan de formation au-delà duquel la validation DG est requise.', 'amount', '30000000'::jsonb, '0'::jsonb, null, false),
  ('M11', 'thresholds', 'waitlist_auto_promote_days',   'Délai auto-promotion liste d''attente', 'Jours avant qu''un inscrit en liste d''attente soit automatiquement promu si une place se libère.', 'number', '3'::jsonb, '0'::jsonb, null, false),
  ('M11', 'thresholds', 'reaction_target',              'Cible satisfaction (Kirkpatrick L1)', 'Note moyenne de satisfaction visée (échelle /5) sur les évaluations à chaud.', 'rate', '4.2'::jsonb, '0'::jsonb, '5'::jsonb, false),
  ('M11', 'thresholds', 'learning_pass_threshold',      'Seuil de réussite (Kirkpatrick L2)', 'Score minimum (/100) pour valider l''évaluation des acquis.', 'number', '70'::jsonb, '0'::jsonb, '100'::jsonb, false),
  ('M11', 'thresholds', 'transfer_target',              'Cible de transfert en poste (Kirkpatrick L3)', 'Taux cible (0-1) de transfert effectif des acquis en situation de travail.', 'rate', '0.70'::jsonb, '0'::jsonb, '1'::jsonb, false),
  ('M11', 'thresholds', 'roi_target',                   'ROI minimum visé',                  'Retour sur investissement minimum visé sur les formations jugées stratégiques (multiplicateur).', 'number', '3.0'::jsonb, '0'::jsonb, null, false),
  ('M11', 'thresholds', 'access_rate_target',           'Taux d''accès à la formation visé', 'Taux cible (0-1) de collaborateurs ayant suivi au moins une formation dans l''année.', 'rate', '0.70'::jsonb, '0'::jsonb, '1'::jsonb, false),
  ('M11', 'thresholds', 'hours_per_employee_target',    'Heures de formation / collaborateur / an', 'Objectif annuel d''heures de formation par collaborateur.', 'number', '35'::jsonb, '0'::jsonb, null, false),
  ('M11', 'kirkpatrick', 'trigger_days_l1', 'Déclenchement évaluation L1 (Réaction)',   'Jours après la session avant déclenchement de l''évaluation à chaud.', 'number', '1'::jsonb, '0'::jsonb, null, false),
  ('M11', 'kirkpatrick', 'trigger_days_l2', 'Déclenchement évaluation L2 (Apprentissage)', 'Jours après la session avant déclenchement de l''évaluation des acquis.', 'number', '7'::jsonb, '0'::jsonb, null, false),
  ('M11', 'kirkpatrick', 'trigger_days_l3', 'Déclenchement évaluation L3 (Transfert)',  'Jours après la session avant déclenchement de l''évaluation du transfert en poste.', 'number', '90'::jsonb, '0'::jsonb, null, false),
  ('M11', 'kirkpatrick', 'trigger_days_l4', 'Déclenchement évaluation L4 (Résultats)',  'Jours après la session avant déclenchement de l''évaluation des résultats business.', 'number', '180'::jsonb, '0'::jsonb, null, false)
on conflict (module_code, section, key) where tenant_id is null do nothing;
