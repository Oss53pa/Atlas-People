-- =====================================================================
-- Arbitrage des deux divergences signalées par les migrations 0059/0060
--
-- Aucune valeur de paramètre ne change. Seules les descriptions du registre
-- sont corrigées : elles portaient des avertissements dont l'un était faux et
-- l'autre mal cadré, et une description de registre est ce que lira la
-- personne qui règle le paramètre. La laisser fausse coûte plus cher qu'une
-- valeur discutable.
--
-- ══ DIVERGENCE 1 — « doublon » cert_expiration_alert_days : N'EN EST PAS UN
--
-- 0059 avait étiqueté « DOUBLON ASSUMÉ » la coexistence de
-- M9.thresholds.cert_expiration_alert_days et de son homonyme M11, en
-- demandant de garder les deux valeurs alignées. C'était faux. Les structures
-- décrivent deux objets distincts :
--
--   • m9_certifications_employees : certification SPONSORISÉE. Colonnes
--     certification_id (catalogue), requested_at, approved_at, approved_by,
--     financed_amount, renewal_alerted_at, revoked_at, revoked_reason. C'est
--     un cycle de demande, d'approbation, de financement et de renouvellement.
--     Le renouvellement suppose un accord budgétaire.
--   • m11_certifications : ATTESTATION issue d'une formation. Colonnes
--     course_id, certificate_code, issuer, pdf_url, validated_by. Aucune
--     notion de demande, de financement ni d'alerte de renouvellement.
--
-- Populations distinctes (6 lignes contre 14), aucune clé étrangère entre les
-- deux. Une organisation peut légitimement vouloir un préavis plus long sur
-- la certification sponsorisée — il faut du temps pour faire approuver un
-- budget — que sur une attestation de formation.
--
-- ARBITRAGE : deux paramètres indépendants, à conserver tels quels. Les
-- valeurs par défaut restent à 90 jours de part et d'autre, mais rien
-- n'impose qu'elles restent égales. Les descriptions sont corrigées des deux
-- côtés pour que la symétrie soit lisible depuis l'un comme depuis l'autre.
--
-- ══ DIVERGENCE 2 — échelle de maîtrise : LE CODE ET LA BASE L'EMPORTENT
--
-- 0059 signalait une échelle 0-5 côté code contre 0-4 au CDC Compétences
-- (RG-603). Éléments de décision :
--   • Sept contraintes CHECK en base imposent 0..5, ou 1..5 : sur
--     m9_skill_matrix (level, target_level), m9_eval_auto_per_competence
--     (auto_level, target_level), m9_eval_manager_per_competence
--     (manager_level), m9_eval_consolidated (final_level),
--     m9_job_requirements (min_level).
--   • LEVEL_LABEL libelle les six niveaux : 0 —, 1 Notion, 2 Pratique,
--     3 Maîtrise, 4 Expert, 5 Référent. Aucun niveau orphelin.
--   • Les données vivantes UTILISENT le niveau 5 (m9_skill_matrix.target_level
--     atteint 5).
-- Le CDC décrit la même progression sans le palier « Expert ».
--
-- ARBITRAGE : l'échelle 0-5 est retenue. Basculer en 0-4 exigerait d'altérer
-- sept contraintes et de remapper des données déjà saisies, pour supprimer un
-- palier que le produit utilise. C'est le CDC RG-603 qui doit être amendé
-- pour intégrer « Expert », non l'inverse.
--
-- Conséquence notable : « Maîtrise » vaut 3 dans LES DEUX échelles, donc la
-- valeur de mastery_level était juste quelle que soit l'issue de l'arbitrage.
-- Seule la borne supérieure du paramètre était en jeu.
-- =====================================================================

-- ── Divergence 1, côté M9 ─────────────────────────────────────────────
update atlas_people.settings_registry
set description =
  'Jours avant expiration d''une certification sponsorisée à partir desquels une alerte de renouvellement est levée. '
  'Porte sur m9_certifications_employees — certifications demandées par le collaborateur, approuvées et financées par '
  'l''entreprise, avec cycle de renouvellement (renewal_alerted_at) et révocation possible. '
  'DISTINCT de M11.thresholds.cert_expiration_alert_days, qui porte sur les attestations issues des formations '
  '(m11_certifications) et n''a ni financement ni cycle de renouvellement. Les deux paramètres sont indépendants par '
  'construction : un préavis plus long se justifie ici, le renouvellement supposant un accord budgétaire.'
where tenant_id is null and module_code = 'M9' and section = 'thresholds'
  and key = 'cert_expiration_alert_days';

-- ── Divergence 1, côté M11 (symétrie) ─────────────────────────────────
update atlas_people.settings_registry
set description =
  'Jours avant expiration d''une certification à partir desquels une alerte est déclenchée. '
  'Porte sur m11_certifications — attestations délivrées à l''issue d''une formation (course_id, certificate_code, issuer). '
  'DISTINCT de M9.thresholds.cert_expiration_alert_days, qui porte sur les certifications sponsorisées et financées '
  '(m9_certifications_employees, avec cycle d''approbation et de renouvellement). Les deux paramètres sont indépendants '
  'par construction et n''ont pas à porter la même valeur.'
where tenant_id is null and module_code = 'M11' and section = 'thresholds'
  and key = 'cert_expiration_alert_days';

-- ── Divergence 2 ──────────────────────────────────────────────────────
update atlas_people.settings_registry
set description =
  'Niveau minimum, sur l''échelle de maîtrise 0-5, à partir duquel une compétence est réputée maîtrisée. '
  'Sert de seuil au calcul du SPOF (bus factor). '
  'ÉCHELLE ARBITRÉE : 0 —, 1 Notion, 2 Pratique, 3 Maîtrise, 4 Expert, 5 Référent. Cette échelle 0-5 fait foi. '
  'Elle est imposée par sept contraintes CHECK (m9_skill_matrix, m9_eval_auto_per_competence, '
  'm9_eval_manager_per_competence, m9_eval_consolidated, m9_job_requirements) et le niveau 5 est déjà utilisé par '
  'les données. Le CDC Compétences RG-603 décrit la même progression sans le palier « Expert » : c''est le CDC qui '
  'doit être amendé, pas la base. À noter que « Maîtrise » vaut 3 dans les deux échelles, donc cette valeur est '
  'insensible à l''arbitrage.'
where tenant_id is null and module_code = 'M9' and section = 'thresholds'
  and key = 'mastery_level';
