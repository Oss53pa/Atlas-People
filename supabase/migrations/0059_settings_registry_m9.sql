-- =====================================================================
-- V13 (suite) · Manifeste settings_registry — M9 Compétences
--
-- M9 avait été volontairement écarté de la migration 0054 : ses seuils
-- étaient alors des littéraux en dur dans le JSX, sans constante nommée
-- exportée. Les seeder aurait créé des paramètres fantômes ne pilotant rien.
-- L'extraction est faite (src/lib/m9/referentiels.ts, COMPETENCE_THRESHOLDS),
-- donc chaque clé ci-dessous correspond désormais à une constante réellement
-- lue par le code.
--
-- Deux sections, sur le modèle de M11 (thresholds / kirkpatrick) :
--   • thresholds — maîtrise, SPOF, réévaluation, certification, gap
--   • mobility   — seuils de matching et clause de retour
--
-- POINT À ARBITRER, signalé et non tranché ici :
-- cert_expiration_alert_days (90 j) EXISTE DÉJÀ sous M11.thresholds, seedé
-- par 0054. Les deux modules lisent chacun leur propre constante
-- (COMPETENCE_THRESHOLDS vs TRAINING_THRESHOLDS) avec la même valeur et le
-- même sens métier. Le registre reflète fidèlement cet état — donc la console
-- exposera deux boutons pour un seul paramètre réel, qui divergeront si l'un
-- est modifié seul. Consolider relève d'une décision produit (quel module
-- possède l'alerte d'expiration de certification ?), pas d'un seed.
-- =====================================================================

insert into atlas_people.settings_registry
  (module_code, section, key, display_name, description, data_type,
   default_value, min_value, max_value, is_system)
values
  -- ── Seuils de compétence ────────────────────────────────────────────
  ('M9', 'thresholds', 'reevaluation_cadence_months', 'Cadence de réévaluation',
   'Nombre de mois entre deux évaluations d''une même compétence pour un collaborateur.',
   'number', '12'::jsonb, '1'::jsonb, null, false),

  ('M9', 'thresholds', 'mastery_level', 'Niveau considéré comme « Maîtrise »',
   'Niveau minimum, sur l''échelle de maîtrise, à partir duquel une compétence est réputée maîtrisée. Sert de seuil au calcul du SPOF. ATTENTION : le code applique une échelle 0-5, tandis que le CDC Compétences (RG-603) en définit une de 0-4 — divergence à arbiter avant tout paramétrage client.',
   'number', '3'::jsonb, '0'::jsonb, '5'::jsonb, false),

  ('M9', 'thresholds', 'spof_max_holders', 'Seuil SPOF (bus factor)',
   'Nombre maximum de détenteurs au niveau Maîtrise ou plus en deçà duquel une compétence est signalée comme point de défaillance unique. À 1, une compétence détenue par une seule personne déclenche l''alerte.',
   'number', '1'::jsonb, '0'::jsonb, null, false),

  ('M9', 'thresholds', 'cert_expiration_alert_days', 'Alerte expiration certification',
   'Jours avant expiration d''une certification à partir desquels une alerte est levée. DOUBLON ASSUMÉ : le même paramètre existe sous M11.thresholds.cert_expiration_alert_days (migration 0054), chaque module lisant sa propre constante. Les deux valeurs doivent rester alignées tant que la consolidation n''est pas arbitrée.',
   'number', '90'::jsonb, '1'::jsonb, null, false),

  ('M9', 'thresholds', 'gap_severity_high_threshold', 'Seuil de sévérité « élevée » d''un écart',
   'Écart projeté, en niveaux, à partir duquel un déficit de compétence est classé en sévérité élevée dans l''analyse d''écart.',
   'number', '2'::jsonb, '1'::jsonb, '5'::jsonb, false),

  -- ── Mobilité interne ────────────────────────────────────────────────
  ('M9', 'mobility', 'mobility_match_min_pct', 'Score de matching minimum',
   'Score de correspondance minimum, en pourcentage, pour qu''une candidature de mobilité interne soit recevable. En dessous, la candidature ne passe qu''en dérogation.',
   'rate', '40'::jsonb, '0'::jsonb, '100'::jsonb, false),

  ('M9', 'mobility', 'mobility_match_pdc_min_pct', 'Plage PDC obligatoire — borne basse',
   'Borne basse de la plage de score exigeant un plan de développement de carrière signé avant validation de la mobilité.',
   'rate', '60'::jsonb, '0'::jsonb, '100'::jsonb, false),

  ('M9', 'mobility', 'mobility_match_pdc_max_pct', 'Plage PDC obligatoire — borne haute',
   'Borne haute de la plage de score exigeant un plan de développement de carrière signé. Doit rester inférieure au seuil d''auto-validation.',
   'rate', '79'::jsonb, '0'::jsonb, '100'::jsonb, false),

  ('M9', 'mobility', 'mobility_match_auto_validate_pct', 'Seuil d''auto-validation',
   'Score à partir duquel la mobilité est validée par la DRH et le manager d''accueil seuls, sans plan de développement ni passage en comité.',
   'rate', '80'::jsonb, '0'::jsonb, '100'::jsonb, false),

  ('M9', 'mobility', 'mobility_return_clause_months', 'Durée de la clause de retour',
   'Nombre de mois pendant lesquels un collaborateur peut revenir à son poste précédent après une mobilité validée en dérogation.',
   'number', '6'::jsonb, '0'::jsonb, null, false)

on conflict (module_code, section, key) where tenant_id is null do nothing;
