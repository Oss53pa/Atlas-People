-- =====================================================================
-- Réconciliation — clés de mobilité M9 dupliquées dans settings_registry
--
-- CE QUI S'EST PASSÉ.
-- Deux seeds M9 concurrents ont atterri à 12 minutes d'intervalle :
--   • 15:40 — migration enregistrée « 0057_settings_registry_m9 », qui a créé
--     3 clés sous section 'mobility' : match_min_pct, match_pdc_min_pct,
--     match_auto_validate_pct. Son FICHIER est absent du dépôt : elle a été
--     appliquée en base sans être commitée.
--   • 15:52 — migration 0059 (ce dépôt), qui a créé 10 clés dont 5 sous
--     'mobility', préfixées 'mobility_*'.
-- Le ON CONFLICT de 0059 n'a rien intercepté puisque les noms diffèrent :
-- résultat, 3 paramètres réels exposés deux fois. La console de paramétrage
-- afficherait deux boutons pour un seul réglage, qui divergeraient dès qu'un
-- seul est modifié.
--
-- CONVENTION RETENUE : les noms courts, sans préfixe redondant. La section
-- dit déjà 'mobility', donc « mobility.match_min_pct » se lit mieux que
-- « mobility.mobility_match_min_pct ». C'est aussi l'antériorité.
--
-- Cette migration est écrite pour être correcte DANS LES DEUX MONDES :
--   • en production, où les 3 clés courtes existent déjà (l'insert no-ope) ;
--   • sur un rejeu à neuf, où elles n'existent pas puisque leur fichier
--     manque — l'insert les crée. Le dépôt redevient donc auto-suffisant
--     pour reconstruire l'état de la base, ce qui n'était plus le cas.
--
-- Sûreté : settings_override est vide (0 ligne, vérifié), aucun override ne
-- référence les clés supprimées.
-- =====================================================================

-- 1. Garantir la présence des 3 clés courtes (no-op en production).
insert into atlas_people.settings_registry
  (module_code, section, key, display_name, description, data_type,
   default_value, min_value, max_value, is_system)
values
  ('M9', 'mobility', 'match_min_pct', 'Seuil match minimum',
   'Score de matching (%) en-dessous duquel une candidature de mobilité interne n''est pas recevable sans dérogation.',
   'rate', '40'::jsonb, '0'::jsonb, '100'::jsonb, false),
  ('M9', 'mobility', 'match_pdc_min_pct', 'Seuil match — PDC requis',
   'Borne basse de la plage de score exigeant un plan de développement de carrière signé avant validation de la mobilité.',
   'rate', '60'::jsonb, '0'::jsonb, '100'::jsonb, false),
  ('M9', 'mobility', 'match_auto_validate_pct', 'Seuil match — validation DRH',
   'Score de matching (%) à partir duquel la décision DRH et manager d''accueil suffit, sans plan de développement ni comité.',
   'rate', '80'::jsonb, '0'::jsonb, '100'::jsonb, false)
on conflict (module_code, section, key) where tenant_id is null do nothing;

-- 2. Renommer les 2 clés que seule 0059 apportait, vers la convention courte.
--    Aucune collision possible : ces deux noms courts n'existent pas encore.
update atlas_people.settings_registry
set key = 'match_pdc_max_pct',
    display_name = 'Seuil match — borne haute PDC'
where tenant_id is null and module_code = 'M9' and section = 'mobility'
  and key = 'mobility_match_pdc_max_pct';

update atlas_people.settings_registry
set key = 'return_clause_months'
where tenant_id is null and module_code = 'M9' and section = 'mobility'
  and key = 'mobility_return_clause_months';

-- 3. Supprimer les 3 doublons longs introduits par 0059.
delete from atlas_people.settings_registry
where tenant_id is null and module_code = 'M9' and section = 'mobility'
  and key in ('mobility_match_min_pct',
              'mobility_match_pdc_min_pct',
              'mobility_match_auto_validate_pct');
