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

select (select count(*) from atlas_people.m4_disciplinary_cases where tenant_id='11111111-1111-1111-1111-111111111111') as disc,
       (select count(*) from atlas_people.m4_representation_mandates where tenant_id='11111111-1111-1111-1111-111111111111') as mandates,
       (select count(*) from atlas_people.m4_representation_elections where tenant_id='11111111-1111-1111-1111-111111111111') as elections,
       (select count(*) from atlas_people.m4_probation_periods where tenant_id='11111111-1111-1111-1111-111111111111') as probations;
