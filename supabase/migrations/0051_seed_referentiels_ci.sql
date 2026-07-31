-- =====================================================================
-- Seed référentiels CI (catalogue atlas)
-- Rubriques OHADA-CI · Barèmes légaux · Conventions · Profils
-- Country Pack CI 2026
-- Source : src/lib/m3/referentiels.ts
-- Tenant démo : 11111111-1111-1111-1111-111111111111
-- =====================================================================

DO $$
DECLARE
  v_tenant         uuid := '11111111-1111-1111-1111-111111111111';
  v_irpp_id        uuid;
  v_prime_anc_id   uuid;
  v_ccn_commerce   uuid;
BEGIN

-- ── Rubriques ──────────────────────────────────────────────────────────
INSERT INTO atlas_people.payroll_rubriques (
  tenant_id, code, libelle_fr, category, rubrique_type,
  visible_on_bulletin, visible_position, visible_section,
  enters_base_cnps, enters_base_irpp, enters_base_taxes_assimilees,
  enters_brut_social, enters_brut_fiscal,
  applicable_country_codes, active, effective_from, version, status
) VALUES
  -- Gains
  (v_tenant,'R001_SAL_BASE',   'Salaire de base',                     'GAIN-BASE',          'gain',          true, 10,  'gains', true,  true,  false, true,  true,  NULL,              true,'2020-01-01',3,'published'),
  (v_tenant,'R010_PRIME_ANC',  'Prime d''ancienneté',                 'GAIN-ANCIENNETE',    'gain',          true, 20,  'gains', true,  true,  false, true,  true,  ARRAY['CI','SN'],   true,'2020-01-01',2,'published'),
  (v_tenant,'R030_HS_15',      'Heures sup. 15 %',                    'GAIN-HEURES-SUP',    'gain',          true, 30,  'gains', true,  true,  false, true,  true,  ARRAY['CI'],        true,'2020-01-01',4,'published'),
  (v_tenant,'R031_HS_50',      'Heures sup. 50 %',                    'GAIN-HEURES-SUP',    'gain',          true, 31,  'gains', true,  true,  false, true,  true,  ARRAY['CI'],        true,'2020-01-01',4,'published'),
  (v_tenant,'R050_IND_LOG',    'Indemnité de logement',               'GAIN-LOGEMENT',      'gain',          true, 40,  'gains', false, true,  false, true,  true,  NULL,              true,'2020-01-01',2,'published'),
  (v_tenant,'R051_IND_TRANSP', 'Indemnité de transport',              'GAIN-TRANSPORT',     'gain',          true, 41,  'gains', false, false, false, false, false, NULL,              true,'2020-01-01',2,'published'),
  (v_tenant,'R060_PRIME_FONC', 'Prime de fonction',                   'GAIN-FONCTION',      'gain',          true, 50,  'gains', true,  true,  false, true,  true,  NULL,              true,'2020-01-01',1,'published'),
  (v_tenant,'R070_PRIME_EXCP', 'Prime exceptionnelle',                'GAIN-EXCEPTIONNELS', 'gain',          true, 60,  'gains', true,  true,  false, true,  true,  NULL,              true,'2020-01-01',1,'published'),
  (v_tenant,'R078_13E_MOIS',   'Prime de fin d''année / 13e mois',   'GAIN-EXCEPTIONNELS', 'gain',          true, 61,  'gains', true,  true,  false, true,  true,  NULL,              true,'2020-01-01',1,'published'),
  (v_tenant,'R200_REMB_FRAIS', 'Remboursement frais professionnels',  'GAIN-REMBOURSEMENT', 'gain',          true, 70,  'gains', false, false, false, false, false, NULL,              true,'2020-01-01',1,'published'),
  -- Cotisations salariales
  (v_tenant,'C100_CNPS_RG_EMP','CNPS Régime Général (part employé)', 'COTISATION-EMP',     'cotisation_emp',true,100,'cotisations_salariales',false,false,false,false,false,ARRAY['CI'],true,'2020-01-01',5,'published'),
  (v_tenant,'C200_IRPP_CI',    'IRPP / IGR',                          'COTISATION-EMP',     'cotisation_emp',true,110,'cotisations_salariales',false,false,false,false,false,ARRAY['CI'],true,'2020-01-01',7,'published'),
  -- Cotisations patronales
  (v_tenant,'C100_CNPS_RG_PAT','CNPS Régime Général (part patronale)','COTISATION-PAT',    'cotisation_pat',true,200,'cotisations_patronales',false,false,false,false,false,ARRAY['CI'],true,'2020-01-01',5,'published'),
  (v_tenant,'C110_CNPS_PF_PAT','CNPS Prestations familiales (patron.)','COTISATION-PAT',   'cotisation_pat',true,210,'cotisations_patronales',false,false,false,false,false,ARRAY['CI'],true,'2020-01-01',3,'published'),
  (v_tenant,'C120_CNPS_AT_PAT','CNPS Accident du travail (patron.)', 'COTISATION-PAT',     'cotisation_pat',true,220,'cotisations_patronales',false,false,false,false,false,ARRAY['CI'],true,'2020-01-01',3,'published'),
  (v_tenant,'C300_FDFP_TA',    'FDFP — Taxe d''apprentissage',       'COTISATION-PAT',     'cotisation_pat',true,230,'cotisations_patronales',false,false,false,false,false,ARRAY['CI'],true,'2020-01-01',3,'published'),
  (v_tenant,'C310_FDFP_FC',    'FDFP — Formation continue',          'COTISATION-PAT',     'cotisation_pat',true,231,'cotisations_patronales',false,false,false,false,false,ARRAY['CI'],true,'2020-01-01',3,'published'),
  -- Retenues
  (v_tenant,'X100_MUTUELLE',   'Mutuelle santé',                      'RETENUE-AUTRES',     'retenue',       true,300,'retenues',     false,false,false,false,false,NULL,true,'2020-01-01',1,'published'),
  (v_tenant,'X200_PRET',       'Prêt employeur',                      'RETENUE-AVANCE',     'retenue',       true,310,'retenues',     false,false,false,false,false,NULL,true,'2020-01-01',1,'published'),
  (v_tenant,'X300_AVANCE',     'Avance sur salaire',                  'RETENUE-AVANCE',     'retenue',       true,311,'retenues',     false,false,false,false,false,NULL,true,'2020-01-01',1,'published'),
  -- Totaux informatifs
  (v_tenant,'I900_BRUT',       'Brut total (info)',                   'INFO',               'info',          true,400,'totaux',       false,false,false,false,false,NULL,true,'2020-01-01',1,'published'),
  (v_tenant,'I910_NET_IMPOSA', 'Net imposable (info)',                'INFO',               'info',          true,410,'totaux',       false,false,false,false,false,NULL,true,'2020-01-01',1,'published'),
  (v_tenant,'I920_NET_PAYER',  'Net à payer (info)',                  'INFO',               'info',          true,420,'totaux',       false,false,false,false,false,NULL,true,'2020-01-01',1,'published')
ON CONFLICT DO NOTHING;

-- ── Barèmes IRPP CI (progressif 8 tranches) ────────────────────────────
INSERT INTO atlas_people.payroll_baremes
  (tenant_id, code, libelle, type, country_code, unit, effective_from, version, reference_legale)
VALUES
  (v_tenant,'IRPP_CI','Barème IRPP Côte d''Ivoire','tranches_progressives','CI','%','2026-01-01','2026.01','CGI CI — barème progressif annuel par parts')
ON CONFLICT DO NOTHING;

SELECT id INTO v_irpp_id FROM atlas_people.payroll_baremes
WHERE tenant_id = v_tenant AND code = 'IRPP_CI';

-- Tranches seulement si la table est vide pour ce barème
INSERT INTO atlas_people.payroll_baremes_tranches
  (tenant_id, bareme_id, ordre, borne_min, borne_max, taux)
SELECT v_tenant, v_irpp_id, ordre, borne_min, borne_max, taux FROM (VALUES
  (1,       0,   600000, 0  ),
  (2,  600001, 1560000,  1.5),
  (3, 1560001, 2400000,  5  ),
  (4, 2400001, 3600000,  10 ),
  (5, 3600001, 4800000,  15 ),
  (6, 4800001, 6000000,  20 ),
  (7, 6000001, 9600000,  25 ),
  (8, 9600001, NULL,     35 )
) AS t(ordre, borne_min, borne_max, taux)
WHERE NOT EXISTS (
  SELECT 1 FROM atlas_people.payroll_baremes_tranches
  WHERE bareme_id = v_irpp_id
);

-- ── Barèmes valeurs simples (taux / plafonds) ──────────────────────────
INSERT INTO atlas_people.payroll_baremes
  (tenant_id, code, libelle, type, country_code, unit, value, effective_from, version, reference_legale)
VALUES
  (v_tenant,'PLAFOND_CNPS_RG_CI',  'Plafond CNPS Régime Général',       'taux_unique','CI','FCFA/mois',1647315,'2024-01-01','2024.01','CNPS CI'),
  (v_tenant,'TAUX_CNPS_RG_EMP_CI', 'Taux CNPS RG part employé',         'taux_unique','CI','%',       6.3,    '2024-01-01','2024.01',NULL),
  (v_tenant,'TAUX_CNPS_RG_PAT_CI', 'Taux CNPS RG part patronale',       'taux_unique','CI','%',       7.7,    '2024-01-01','2024.01',NULL),
  (v_tenant,'TAUX_CNPS_PF_CI',     'Taux CNPS Prestations familiales',  'taux_unique','CI','%',       5.75,   '2024-01-01','2024.01',NULL),
  (v_tenant,'TAUX_CNPS_AT_CI',     'Taux CNPS Accident travail (moyen)','taux_unique','CI','%',       2,      '2024-01-01','2024.01',NULL),
  (v_tenant,'FDFP_TA_CI',          'FDFP Taxe apprentissage',           'taux_unique','CI','%',       0.4,    '2024-01-01','2024.01',NULL),
  (v_tenant,'FDFP_FC_CI',          'FDFP Formation continue',           'taux_unique','CI','%',       1.2,    '2024-01-01','2024.01',NULL)
ON CONFLICT DO NOTHING;

-- ── Barème prime ancienneté CCN Commerce (tranches en années) ──────────
INSERT INTO atlas_people.payroll_baremes
  (tenant_id, code, libelle, type, country_code, unit, effective_from, version, reference_legale)
VALUES
  (v_tenant,'PRIME_ANC_CCN1','Prime ancienneté CCN Commerce','tranches_par_tranches','CI','%','2023-01-01','2023.01','CCN Commerce CI')
ON CONFLICT DO NOTHING;

SELECT id INTO v_prime_anc_id FROM atlas_people.payroll_baremes
WHERE tenant_id = v_tenant AND code = 'PRIME_ANC_CCN1';

INSERT INTO atlas_people.payroll_baremes_tranches
  (tenant_id, bareme_id, ordre, borne_min, borne_max, taux)
SELECT v_tenant, v_prime_anc_id, ordre, borne_min, borne_max, taux FROM (VALUES
  (1,  0,  2,    0),
  (2,  2,  5,    2),
  (3,  5,  10,   5),
  (4,  10, 15,  10),
  (5,  15, 20,  15),
  (6,  20, 25,  20),
  (7,  25, NULL,25)
) AS t(ordre, borne_min, borne_max, taux)
WHERE NOT EXISTS (
  SELECT 1 FROM atlas_people.payroll_baremes_tranches
  WHERE bareme_id = v_prime_anc_id
);

-- ── Conventions collectives ────────────────────────────────────────────
INSERT INTO atlas_people.payroll_conventions
  (tenant_id, code, libelle, country_code, secteur, version)
VALUES
  (v_tenant,'CCN_COMMERCE_CI',  'CCN Commerce Côte d''Ivoire',           'CI','Commerce',2),
  (v_tenant,'CCN_INDUSTRIE_CI', 'CCN Industrie Côte d''Ivoire',          'CI','Industrie',1),
  (v_tenant,'CCN_BANQUE_CI',    'CCN Banques & établissements financiers','CI','Banque',1)
ON CONFLICT DO NOTHING;

SELECT id INTO v_ccn_commerce FROM atlas_people.payroll_conventions
WHERE tenant_id = v_tenant AND code = 'CCN_COMMERCE_CI';

-- ── Profils de paie ───────────────────────────────────────────────────
INSERT INTO atlas_people.payroll_profils
  (tenant_id, code, libelle, country_code, convention_id, version)
VALUES
  (v_tenant,'PRO_CADRE_B_CI', 'Cadre B — CCN Commerce CI',   'CI', v_ccn_commerce, 1),
  (v_tenant,'PRO_EMPLOYE_CI', 'Employé administratif CI',    'CI', v_ccn_commerce, 1),
  (v_tenant,'PRO_OUVRIER_CI', 'Ouvrier CCN Commerce CI',     'CI', v_ccn_commerce, 1),
  (v_tenant,'PRO_EXPAT_CI',   'Expatrié CI',                 'CI', v_ccn_commerce, 1)
ON CONFLICT DO NOTHING;

-- ── Country Pack CI 2026 (entrée atlas globale, tenant_id IS NULL) ─────
INSERT INTO atlas_people.country_packs
  (country_code, pack_version, effective_from, status, parameters, changelog)
VALUES (
  'CI', '2026.01', '2026-01-01', 'published',
  jsonb_build_object(
    'irpp_bareme_code',   'IRPP_CI',
    'cnps_plafond_code',  'PLAFOND_CNPS_RG_CI',
    'cnps_emp_taux_code', 'TAUX_CNPS_RG_EMP_CI',
    'cnps_pat_taux_code', 'TAUX_CNPS_RG_PAT_CI',
    'cnps_pf_taux_code',  'TAUX_CNPS_PF_CI',
    'cnps_at_taux_code',  'TAUX_CNPS_AT_CI',
    'fdfp_ta_code',       'FDFP_TA_CI',
    'fdfp_fc_code',       'FDFP_FC_CI',
    'prime_anc_code',     'PRIME_ANC_CCN1',
    'smig_mensuel',       75000,
    'smig_horaire',       432,
    'currency',           'XOF',
    'zone',               'OHADA'
  ),
  'Paramètres légaux CI 2026 — CNPS 2024, IRPP 2026, FDFP 2024'
)
ON CONFLICT DO NOTHING;

END $$;
