-- =====================================================================
-- V6.2 · Suppression de l'abattement 20% obsolète (ITS CI, réforme 2024)
--
-- Recherche (source primaire) : Ordonnance n°2023-719 du 13/09/2023
-- (CGI art. 119, nouvellement rédigé) : « Le montant du revenu imposable
-- servant à la détermination de l'impôt brut est le total des
-- rémunérations tel qu'il est défini à l'article précédent. » — aucun
-- abattement forfaitaire n'est mentionné : l'ITS se calcule directement
-- sur le total des rémunérations (net des cotisations sociales
-- obligatoires, cf. art. 116, non modifié sur ce point par l'ordonnance).
--
-- Confirmé par sources secondaires convergentes (macalculatriceenligne.com,
-- linfodrome.com/blog julaya) : la réforme 2024 a supprimé conjointement
-- l'IGR distinct (1,5 %), la Contribution Nationale, ET l'abattement
-- forfaitaire de 20 % pour frais professionnels qui existait sous
-- l'ancien régime — fusionnés dans l'ITS unique calculé sur le brut
-- (après cotisations sociales), sans abattement.
--
-- payroll_regime_configs.abatement_bps valait 2000 (20 %) pour la CI —
-- hérité de l'ancien régime IGR pré-2024, jamais mis à jour lors de la
-- réforme. Comme ce champ est lu directement par la RPC
-- atlas_people.calculate_bulletin() (0055) et par useRegime.ts, chaque
-- bulletin CI calculé jusqu'ici sous-évaluait l'impôt réel.
--
-- Non traité ici (nécessite une modification de la RPC, pas seulement
-- des données) : le nouvel art. 120 remplace le quotient familial
-- (division de l'assiette par le nombre de parts) par une Réduction
-- d'Impôt pour Charges de Famille (RICF) forfaitaire imputée sur le
-- montant de l'impôt lui-même (5 500 FCFA / demi-part / mois, plafonnée
-- à 5 parts). calculate_bulletin() et PayrollEngine.ts utilisent encore
-- l'ancien mécanisme de quotient familial (fiscal_parts) — à corriger
-- séparément, hors périmètre d'une migration de données.
-- =====================================================================

update atlas_people.payroll_regime_configs
set abatement_bps = 0
where country_code = 'CI'
  and abatement_bps <> 0;
