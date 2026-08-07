-- =====================================================================
-- Correctif — m4_departures.initiative : trois ruptures que personne n'a
-- décidées étaient enregistrées comme décidées d'un commun accord.
--
-- ExitDossierPage déduisait l'initiative du libellé d'affichage du motif :
--   initiator === 'Employé'   -> 'salarie'
--   initiator === 'Employeur' -> 'employeur'
--   sinon                     -> 'mutuelle'
-- Ce « sinon » balayait tout le reste. Trois motifs y tombaient à tort :
--   • Fin de CDD      (initiator 'Système') -> écrit 'mutuelle'
--   • Décès           (initiator 'Système') -> écrit 'mutuelle'
--   • Invalidité déf. (initiator 'M12')     -> écrit 'mutuelle'
-- Or 'mutuelle' affirme un accord de volontés entre l'employeur et le
-- salarié. Aucun des trois n'en procède : le terme d'un CDD s'éteint seul,
-- un décès et une invalidité définitive s'imposent aux deux parties. Le
-- référentiel M4 du produit disait déjà autre chose (src/lib/m4/
-- referentiels.ts : fin_cdd = « Terme », deces = « Force majeure ») — la
-- donnée écrite contredisait le référentiel affiché.
--
-- Le CHECK n'offrait que salarie|employeur|mutuelle|force_majeure, soit
-- trois volontés et une catégorie résiduelle. Deux valeurs sont ajoutées
-- plutôt que de rabattre par commodité :
--   • 'terme'      : extinction du contrat à la date convenue à sa
--     signature. Ce n'est pas un accord de rupture (RUPT_CONV) — les
--     parties n'ont rien décidé à la sortie, seulement à l'entrée.
--   • 'inaptitude' : constat médical d'invalidité définitive (chaîne M12).
--     Distingué de 'force_majeure' À DESSEIN : la force majeure emporte
--     classiquement dispense de préavis et régime indemnitaire réduit,
--     alors que l'invalidité ouvre droit à indemnité (le motif porte
--     severance: true). Les confondre déplacerait de l'argent.
-- Le décès, lui, rejoint 'force_majeure', valeur déjà présente.
--
-- Additif : le CHECK est élargi, jamais rétréci ; aucune ligne existante
-- ne peut devenir invalide (vérifié avant application — la table ne
-- contenait qu'une ligne, en 'salarie').
--
-- NON TRAITÉ ICI : m4_departures.initiative reste un text + CHECK là où
-- type est un enum. Le convertir en enum touche des lectures hors de ce
-- correctif ; l'écriture est déjà verrouillée côté applicatif par l'union
-- M4DepartureInitiative (src/lib/m4/supabaseLive.ts).
-- =====================================================================

alter table atlas_people.m4_departures
  drop constraint if exists m4_departures_initiative_check;

alter table atlas_people.m4_departures
  add constraint m4_departures_initiative_check
  check (initiative in ('salarie', 'employeur', 'mutuelle', 'force_majeure', 'terme', 'inaptitude'));

-- Fin migration 0063 — fait générateur des départs (terme / inaptitude).
