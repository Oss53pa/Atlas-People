-- Seed M4 Admin (2e lot) — disciplinaire / mandats / élections / période d'essai.
-- Généré depuis src/lib/m4/mock.ts. Purge + reseed du tenant démo.

delete from atlas_people.m4_disciplinary_cases where tenant_id='11111111-1111-1111-1111-111111111111';
insert into atlas_people.m4_disciplinary_cases (id, tenant_id, employee_id, case_number, opened_at, facts_date, facts_description, prescription_deadline, proposed_qualification, final_qualification, envisaged_sanction, final_sanction, conservatory_suspension, status, protected_category, effacement_date)
values
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000010', 'DISC-2024-0010', '2024-03-04', '2024-03-04', 'Retards répétés non justifiés (5 occurrences sur 30 j)', '2024-05-03', 'simple', 'simple', 'avertissement', 'avertissement', false, 'closed'::atlas_people.m4_discipline_status, false, '2027-03-22');

delete from atlas_people.m4_representation_mandates where tenant_id='11111111-1111-1111-1111-111111111111';
insert into atlas_people.m4_representation_mandates (id, tenant_id, employee_id, type, mode, start_date, end_date, delegation_hours, protected_until, status)
values
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000001', 'Délégué du personnel', 'elu', '2023-12-04', '2025-12-04', 15, '2026-06-04', 'ended'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000003', 'Référent harcèlement', 'designe', '2024-03-01', null, 0, '2027-03-01', 'active'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000006', 'Délégué du personnel', 'elu', '2025-12-04', '2027-12-04', 15, '2028-06-04', 'active');

delete from atlas_people.m4_representation_elections where tenant_id='11111111-1111-1111-1111-111111111111';
insert into atlas_people.m4_representation_elections (id, tenant_id, instance_id, scrutin_date, status, turnout_pct, results)
values
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', null, '2025-11-15', 'proclaimed', 78, '{"instance":"DP","societe":"Atlas Studio CI SARL","seats":4,"phase":"closed"}'::jsonb),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', null, '2027-06-15', 'planned', null, '{"instance":"CSE","societe":"Atlas Studio CI SARL","seats":3,"phase":"planned"}'::jsonb);

delete from atlas_people.m4_probation_periods where tenant_id='11111111-1111-1111-1111-111111111111';
insert into atlas_people.m4_probation_periods (id, tenant_id, employee_id, contract_type, category, duration_months, start_date, end_date, decision, decision_notified_at)
values
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000001', 'CDI'::atlas_people.m4_contract_type, 'Cadre', 3, '2019-03-12', '2019-06-10', 'confirmed'::atlas_people.m4_probation_decision, '2019-06-07'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000002', 'CDI'::atlas_people.m4_contract_type, 'Cadre', 3, '2021-09-01', '2021-11-30', 'confirmed'::atlas_people.m4_probation_decision, '2021-11-27'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000003', 'CDI'::atlas_people.m4_contract_type, 'Cadre', 6, '2020-01-15', '2020-07-13', 'confirmed'::atlas_people.m4_probation_decision, '2020-07-10'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000004', 'CDI'::atlas_people.m4_contract_type, 'Cadre', 3, '2022-06-20', '2022-09-18', 'confirmed'::atlas_people.m4_probation_decision, '2022-09-15'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000005', 'CDI'::atlas_people.m4_contract_type, 'Maitrise', 3, '2023-02-01', '2023-05-02', 'confirmed'::atlas_people.m4_probation_decision, '2023-04-29'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000006', 'CDI'::atlas_people.m4_contract_type, 'Maitrise', 2, '2018-11-05', '2019-01-04', 'confirmed'::atlas_people.m4_probation_decision, '2019-01-01'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000007', 'CDD'::atlas_people.m4_contract_type, 'Maitrise', 3, '2024-04-10', '2024-07-09', 'confirmed'::atlas_people.m4_probation_decision, '2024-07-06'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000008', 'CDI'::atlas_people.m4_contract_type, 'Maitrise', 2, '2022-10-03', '2022-12-02', 'confirmed'::atlas_people.m4_probation_decision, '2022-11-29'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000009', 'CDI'::atlas_people.m4_contract_type, 'Cadre', 6, '2021-05-18', '2021-11-14', 'confirmed'::atlas_people.m4_probation_decision, '2021-11-11'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000010', 'CDI'::atlas_people.m4_contract_type, 'Maitrise', 2, '2023-08-22', '2023-10-21', 'confirmed'::atlas_people.m4_probation_decision, '2023-10-18'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000011', 'CDI'::atlas_people.m4_contract_type, 'Maitrise', 3, '2024-01-08', '2026-06-05', 'pending'::atlas_people.m4_probation_decision, null),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000012', 'CDD'::atlas_people.m4_contract_type, 'Employe', 1, '2024-09-02', '2024-10-02', 'confirmed'::atlas_people.m4_probation_decision, '2024-09-29'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000013', 'CDI'::atlas_people.m4_contract_type, 'Cadre', 6, '2020-07-30', '2021-01-26', 'confirmed'::atlas_people.m4_probation_decision, '2021-01-23'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000014', 'CDI'::atlas_people.m4_contract_type, 'Cadre', 3, '2021-11-11', '2022-02-09', 'confirmed'::atlas_people.m4_probation_decision, '2022-02-06');

delete from atlas_people.m4_expat_packages where tenant_id='11111111-1111-1111-1111-111111111111';
delete from atlas_people.m4_expat_documents where tenant_id='11111111-1111-1111-1111-111111111111';
delete from atlas_people.m4_expat_files where tenant_id='11111111-1111-1111-1111-111111111111';
insert into atlas_people.m4_expat_files (id, tenant_id, employee_id, category, origin_country, host_country, mission_type, mission_start, mission_end, sur_salaire_pct, tax_equalization)
values
('44444444-0000-0000-0004-000000000010', '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000010', 'Contrat local', 'CM', 'CI', 'Contrat local', '2024-06-01', '2027-05-31', 25, false);
insert into atlas_people.m4_expat_documents (id, tenant_id, expat_id, doc_type, label, ref, expiry, status)
values
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0004-000000000010', 'visa', 'Visa de travail D-1', null, '2026-06-30', 'valid'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0004-000000000010', 'work_permit', 'Permis de travail', 'PT-2024-1245', '2026-12-31', 'valid'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0004-000000000010', 'residence_card', 'Carte de séjour', null, '2027-05-31', 'valid');
insert into atlas_people.m4_expat_packages (id, tenant_id, expat_id, lines)
values
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0004-000000000010', '[{"label":"Logement de fonction","value":"Villa Cocody (1 500 000 FCFA / mois)"},{"label":"Scolarité enfants","value":"Lycée Français A. Camus"},{"label":"Voyages annuels","value":"2 A/R Cameroun / personne"},{"label":"Assurance santé internationale","value":"MSH International Premium"}]'::jsonb);

delete from atlas_people.m4_legal_dpae where tenant_id='11111111-1111-1111-1111-111111111111';
insert into atlas_people.m4_legal_dpae (id, tenant_id, employee_id, country_code, organisme, hire_date, status, receipt_number, payload)
values
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000001', 'CI', 'CNPS-CI', '2019-03-12', 'receipt', 'DPAE-2019-e1', '{}'::jsonb),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000002', 'CI', 'CNPS-CI', '2021-09-01', 'receipt', 'DPAE-2021-e2', '{}'::jsonb),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000003', 'SN', 'IPRES + CSS + IPM', '2020-01-15', 'receipt', 'DPAE-2020-e3', '{}'::jsonb),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000004', 'CI', 'CNPS-CI', '2022-06-20', 'receipt', 'DPAE-2022-e4', '{}'::jsonb),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000005', 'SN', 'IPRES + CSS + IPM', '2023-02-01', 'receipt', 'DPAE-2023-e5', '{}'::jsonb),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000006', 'CI', 'CNPS-CI', '2018-11-05', 'receipt', 'DPAE-2018-e6', '{}'::jsonb),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000007', 'SN', 'IPRES + CSS + IPM', '2024-04-10', 'receipt', 'DPAE-2024-e7', '{}'::jsonb),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000008', 'CI', 'CNPS-CI', '2022-10-03', 'receipt', 'DPAE-2022-e8', '{}'::jsonb),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000009', 'SN', 'IPRES + CSS + IPM', '2021-05-18', 'receipt', 'DPAE-2021-e9', '{}'::jsonb),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000010', 'CI', 'CNPS-CI', '2023-08-22', 'receipt', 'DPAE-2023-e10', '{}'::jsonb),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000011', 'SN', 'IPRES + CSS + IPM', '2024-01-08', 'receipt', 'DPAE-2024-e11', '{}'::jsonb),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000012', 'CI', 'CNPS-CI', '2024-09-02', 'receipt', 'DPAE-2024-e12', '{}'::jsonb),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000013', 'SN', 'IPRES + CSS + IPM', '2020-07-30', 'receipt', 'DPAE-2020-e13', '{}'::jsonb),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000014', 'CI', 'CNPS-CI', '2021-11-11', 'receipt', 'DPAE-2021-e14', '{}'::jsonb);
delete from atlas_people.m4_legal_registers_status where tenant_id='11111111-1111-1111-1111-111111111111';
insert into atlas_people.m4_legal_registers_status (id, tenant_id, register_code, label, up_to_date, last_updated, retention_years)
values
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-00', 'Registre unique du personnel (RUP)', false, '2026-05-15', 5),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-01', 'Registre des mouvements', true, '2026-05-15', 5),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-02', 'Registre AT/MP (accidents travail / maladies pro)', true, '2026-05-15', 5),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-03', 'Registre médecine du travail', true, '2026-05-15', 5),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-04', 'Registre repos hebdomadaire', true, '2026-05-15', 5),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-05', 'Registre des heures supplémentaires', false, '2026-05-15', 5),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-06', 'Registre des élections', true, '2026-05-15', 5),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-07', 'Registre des mandats', true, '2026-05-15', 5),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-08', 'Registre PV CSE/DP', true, '2026-05-15', 5),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-09', 'Registre accords entreprise', true, '2026-05-15', 5),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-10', 'Registre des sanctions disciplinaires', false, '2026-05-15', 5),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-11', 'Registre formation professionnelle', true, '2026-05-15', 5),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-12', 'Registre apprentissage', true, '2026-05-15', 5),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-13', 'Registre stagiaires', true, '2026-05-15', 5),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'REG-14', 'Registre handicap (BOETH quota 6 %)', true, '2026-05-15', 5);
delete from atlas_people.m4_legal_postings where tenant_id='11111111-1111-1111-1111-111111111111';
insert into atlas_people.m4_legal_postings (id, tenant_id, site, document_code, document_label, displayed_at, status, last_verification)
values
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Tous établissements', 'DISP-00', 'Convention collective applicable', '2026-01-10', 'ok', '2026-01-10'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Tous établissements', 'DISP-01', 'Règlement intérieur', '2026-01-10', 'ok', '2026-01-10'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Tous établissements', 'DISP-02', 'Coordonnées Inspection du Travail', '2026-01-10', 'ok', '2026-01-10'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Tous établissements', 'DISP-03', 'Coordonnées médecine du travail', '2026-01-10', 'ok', '2026-01-10'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Tous établissements', 'DISP-04', 'Liste des élus DP/CSE', '2026-01-10', 'ok', '2026-01-10'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Tous établissements', 'DISP-05', 'Horaires de travail', '2026-01-10', 'ok', '2026-01-10'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Tous établissements', 'DISP-06', 'Repos hebdomadaire', '2026-01-10', 'ok', '2026-01-10'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Tous établissements', 'DISP-07', 'Planning congés payés (annuel)', '2026-01-10', 'ok', '2026-01-10'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Tous établissements', 'DISP-08', 'Consignes sécurité incendie', '2026-01-10', 'missing', '2026-01-10'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Tous établissements', 'DISP-09', 'Droit de retrait (sécurité)', '2026-01-10', 'ok', '2026-01-10'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Tous établissements', 'DISP-10', 'Index égalité H/F', '2026-01-10', 'ok', '2026-01-10'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Tous établissements', 'DISP-11', 'Lutte discrimination/harcèlement', '2026-01-10', 'ok', '2026-01-10'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Tous établissements', 'DISP-12', 'Numéros d''urgence', '2026-01-10', 'ok', '2026-01-10'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Tous établissements', 'DISP-13', 'Coordonnées DGT', '2026-01-10', 'ok', '2026-01-10');

delete from atlas_people.m4_generated_documents where tenant_id='11111111-1111-1111-1111-111111111111';
insert into atlas_people.m4_generated_documents (id, tenant_id, document_number, employee_id, category, purpose, recipient, generated_at, generation_method, signed_at, revoked)
values
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ATT-2019-e1-001', 'e1000001-0000-0000-0000-000000000001', 'attestation', 'Attestation de présence', 'ATT_PRESENCE', '2019-05-11', 'automatic', '2019-05-11', false),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ATT-2021-e2-001', 'e1000001-0000-0000-0000-000000000002', 'attestation', 'Attestation de présence', 'ATT_PRESENCE', '2021-10-31', 'automatic', '2021-10-31', false),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ATT-2020-e3-001', 'e1000001-0000-0000-0000-000000000003', 'attestation', 'Attestation de présence', 'ATT_PRESENCE', '2020-03-15', 'automatic', '2020-03-15', false),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ATT-2022-e4-001', 'e1000001-0000-0000-0000-000000000004', 'attestation', 'Attestation de présence', 'ATT_PRESENCE', '2022-08-19', 'automatic', '2022-08-19', false),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ATT-2023-e5-001', 'e1000001-0000-0000-0000-000000000005', 'attestation', 'Attestation de présence', 'ATT_PRESENCE', '2023-04-02', 'automatic', '2023-04-02', false),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ATT-2018-e6-001', 'e1000001-0000-0000-0000-000000000006', 'attestation', 'Attestation de présence', 'ATT_PRESENCE', '2019-01-04', 'automatic', '2019-01-04', false),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ATT-2024-e7-001', 'e1000001-0000-0000-0000-000000000007', 'attestation', 'Attestation de présence', 'ATT_PRESENCE', '2024-06-09', 'automatic', '2024-06-09', false),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ATT-2022-e8-001', 'e1000001-0000-0000-0000-000000000008', 'attestation', 'Attestation de présence', 'ATT_PRESENCE', '2022-12-02', 'automatic', '2022-12-02', false),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ATT-2021-e9-001', 'e1000001-0000-0000-0000-000000000009', 'attestation', 'Attestation de présence', 'ATT_PRESENCE', '2021-07-17', 'automatic', '2021-07-17', false),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ATT-2023-e10-001', 'e1000001-0000-0000-0000-000000000010', 'attestation', 'Attestation de présence', 'ATT_PRESENCE', '2023-10-21', 'automatic', '2023-10-21', false),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ATT-2024-e11-001', 'e1000001-0000-0000-0000-000000000011', 'attestation', 'Attestation de présence', 'ATT_PRESENCE', '2024-03-08', 'automatic', '2024-03-08', false),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ATT-2024-e12-001', 'e1000001-0000-0000-0000-000000000012', 'attestation', 'Attestation de présence', 'ATT_PRESENCE', '2024-11-01', 'automatic', '2024-11-01', false),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ATT-2020-e13-001', 'e1000001-0000-0000-0000-000000000013', 'attestation', 'Attestation de présence', 'ATT_PRESENCE', '2020-09-28', 'automatic', '2020-09-28', false),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'CERT-2026-e13-002', 'e1000001-0000-0000-0000-000000000013', 'certificat', 'Certificat de travail', 'CERT_TRAVAIL', '2026-07-15', 'automatic', null, false),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ATT-2021-e14-001', 'e1000001-0000-0000-0000-000000000014', 'attestation', 'Attestation de présence', 'ATT_PRESENCE', '2022-01-10', 'automatic', '2022-01-10', false);

select (select count(*) from atlas_people.m4_disciplinary_cases where tenant_id='11111111-1111-1111-1111-111111111111') as disc,
       (select count(*) from atlas_people.m4_representation_mandates where tenant_id='11111111-1111-1111-1111-111111111111') as mandates,
       (select count(*) from atlas_people.m4_representation_elections where tenant_id='11111111-1111-1111-1111-111111111111') as elections,
       (select count(*) from atlas_people.m4_probation_periods where tenant_id='11111111-1111-1111-1111-111111111111') as probations,
       (select count(*) from atlas_people.m4_expat_files where tenant_id='11111111-1111-1111-1111-111111111111') as expats,
       (select count(*) from atlas_people.m4_legal_dpae where tenant_id='11111111-1111-1111-1111-111111111111') as dpae,
       (select count(*) from atlas_people.m4_legal_registers_status where tenant_id='11111111-1111-1111-1111-111111111111') as registers,
       (select count(*) from atlas_people.m4_legal_postings where tenant_id='11111111-1111-1111-1111-111111111111') as postings,
       (select count(*) from atlas_people.m4_generated_documents where tenant_id='11111111-1111-1111-1111-111111111111') as certificates;
