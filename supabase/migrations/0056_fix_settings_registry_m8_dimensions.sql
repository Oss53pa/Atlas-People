-- =====================================================================
-- Correctif — pondération des dimensions M8 dans settings_registry
--
-- La migration 0054 a seedé une entrée unique ('M8','weighting','dimensions')
-- dont l'objet jsonb était clé par les CODES du référentiel TypeScript
-- (okr / competences / comportements / leadership / culture). Or les
-- colonnes réelles de atlas_people.m8_evaluations sont :
--   score_dim1_okr / score_dim2_competences / score_dim3_comportements
--   score_dim4_evolution / score_dim5_developpement
-- avec les poids dans weight_dim1..weight_dim5.
--
-- Deux clés du registre ('leadership', 'culture') ne correspondaient donc
-- à aucune colonne : un résolveur de paramétrage n'aurait pas su où écrire.
--
-- Le contrat réel entre le code et la base est POSITIONNEL : src/lib/m8/
-- dataLive.ts construit un tableau dims[0..4] depuis les colonnes puis
-- l'associe à EVAL_DIMENSIONS par index (dataLive.ts:56-71). Ce couplage
-- par position est fragile — réordonner EVAL_DIMENSIONS décalerait
-- silencieusement tous les scores. Le registre est donc reclé sur les
-- colonnes physiques, seule identité stable, et chaque entrée nomme
-- explicitement la colonne qu'elle pilote.
--
-- Une pondération par dimension est un paramètre indépendant borné 0-100 :
-- cinq entrées valent mieux qu'un objet jsonb opaque, et rendent min/max
-- exploitables. L'invariant « somme = 100 » reste une règle de validation
-- applicative (il n'est aujourd'hui garanti par aucune contrainte : les
-- 14 évaluations vivantes le respectent par la donnée seulement).
--
-- NON TRAITÉ ICI, volontairement :
--   • le nom des dimensions 4 et 5. La base dit evolution/developpement,
--     le référentiel TS dit Leadership/Culture, et dataLive.ts:73 s'en
--     sert comme axe « potentiel » du 9-box (potAvg = (dims[3]+dims[4])/2)
--     — ce qui donne raison aux noms de la base. Trancher relève du métier.
--   • l'entrée ('M8','calibration','distribution_targets'), dont la forme
--     est en cours d'arbitrage (l'enum m8_classe_finale vaut A|B|C|D|E).
-- =====================================================================

-- 1. Retrait de l'entrée fautive (aucun settings_override ne la référence).
delete from atlas_people.settings_registry
where tenant_id is null
  and module_code = 'M8'
  and section = 'weighting'
  and key = 'dimensions';

-- 2. Cinq entrées clées sur les colonnes physiques.
insert into atlas_people.settings_registry
  (module_code, section, key, display_name, description, data_type,
   default_value, min_value, max_value, is_system)
values
  ('M8', 'weighting', 'weight_dim1', 'Poids — Atteinte OKR',
   'Pondération de la dimension 1 du score global. Colonne pilotée : m8_evaluations.weight_dim1, score lu depuis score_dim1_okr. La somme des cinq pondérations doit valoir 100.',
   'number', '35'::jsonb, '0'::jsonb, '100'::jsonb, false),

  ('M8', 'weighting', 'weight_dim2', 'Poids — Compétences techniques',
   'Pondération de la dimension 2 du score global. Colonne pilotée : m8_evaluations.weight_dim2, score lu depuis score_dim2_competences. La somme des cinq pondérations doit valoir 100.',
   'number', '25'::jsonb, '0'::jsonb, '100'::jsonb, false),

  ('M8', 'weighting', 'weight_dim3', 'Poids — Comportements et valeurs',
   'Pondération de la dimension 3 du score global. Colonne pilotée : m8_evaluations.weight_dim3, score lu depuis score_dim3_comportements. La somme des cinq pondérations doit valoir 100.',
   'number', '20'::jsonb, '0'::jsonb, '100'::jsonb, false),

  ('M8', 'weighting', 'weight_dim4', 'Poids — Leadership et influence',
   'Pondération de la dimension 4 du score global. Colonne pilotée : m8_evaluations.weight_dim4, score lu depuis score_dim4_evolution. ATTENTION : le référentiel applicatif nomme cette dimension "Leadership / influence" tandis que la colonne la nomme "evolution", et dataLive.ts s''en sert comme axe de potentiel du 9-box. Divergence de dénomination à arbitrer côté métier. La somme des cinq pondérations doit valoir 100.',
   'number', '10'::jsonb, '0'::jsonb, '100'::jsonb, false),

  ('M8', 'weighting', 'weight_dim5', 'Poids — Culture et collaboration',
   'Pondération de la dimension 5 du score global. Colonne pilotée : m8_evaluations.weight_dim5, score lu depuis score_dim5_developpement. ATTENTION : même divergence de dénomination que la dimension 4 ("Culture & collaboration" côté applicatif, "developpement" côté base). La somme des cinq pondérations doit valoir 100.',
   'number', '10'::jsonb, '0'::jsonb, '100'::jsonb, false)

on conflict (module_code, section, key) where tenant_id is null do nothing;
