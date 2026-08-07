-- Seed M12 Conformité & SST (tenant démo) — généré depuis src/lib/m12/mock.ts.
-- Idempotent : upsert par ref.

insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RSK-2026-001', 'Open space Tech (Plateau)', 'CI', 'tms'::atlas_people.m12_risk_category, 'TMS écran prolongé > 6 h/j', 4, 2, 'eleve'::atlas_people.m12_risk_level, array['Postes ergonomiques · écrans 27"','Pause active toutes les 90 min (alerte LMS)','Étirements collectifs hebdo']::text[], '[]'::jsonb, 8, '2026-04-12'
where not exists (select 1 from atlas_people.m12_risks where ref = 'RSK-2026-001');

insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RSK-2026-002', 'Open space Tech (Plateau)', 'CI', 'electrique'::atlas_people.m12_risk_category, 'Multiprises surchargées', 3, 3, 'eleve'::atlas_people.m12_risk_level, array['Audit annuel installations','PRA électrique','EPI cadenassage']::text[], '[{"description":"Remplacer multiprises non conformes étage 4","ownerEmployeeId":"e1000001-0000-0000-0000-000000000008","dueDate":"2026-06-30","status":"in_progress"}]'::jsonb, 8, '2026-02-08'
where not exists (select 1 from atlas_people.m12_risks where ref = 'RSK-2026-002');

insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RSK-2026-003', 'Espace clientèle Sénégal', 'SN', 'incendie_explosion'::atlas_people.m12_risk_category, 'Issues de secours obstruées par cartons archives', 2, 4, 'eleve'::atlas_people.m12_risk_level, array['Évacuation des cartons sous 30 j','Exercice incendie semestriel','6 extincteurs CO₂ + eau']::text[], '[{"description":"Évacuer cartons & ajouter signalétique BAES","ownerEmployeeId":"e1000001-0000-0000-0000-000000000009","dueDate":"2026-06-15","status":"todo"}]'::jsonb, 12, '2026-03-22'
where not exists (select 1 from atlas_people.m12_risks where ref = 'RSK-2026-003');

insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RSK-2026-004', 'Bureau Direction', 'CI', 'psychosocial'::atlas_people.m12_risk_category, 'Stress lié à objectifs trimestriels élevés', 3, 3, 'eleve'::atlas_people.m12_risk_level, array['1-1 mensuel obligatoire','Cellule d''écoute externe','Enquête RPS semestrielle']::text[], '[]'::jsonb, 14, '2026-05-08'
where not exists (select 1 from atlas_people.m12_risks where ref = 'RSK-2026-004');

insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RSK-2026-005', 'Salle serveurs', 'CI', 'electrique'::atlas_people.m12_risk_category, 'Tension 400V triphasée — risque arc électrique', 2, 4, 'eleve'::atlas_people.m12_risk_level, array['Habilitation BS-BE obligatoire','EPI isolant','Procédure de consignation']::text[], '[]'::jsonb, 2, '2025-12-05'
where not exists (select 1 from atlas_people.m12_risks where ref = 'RSK-2026-005');

insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RSK-2026-006', 'Flotte commerciale', 'CI', 'routier'::atlas_people.m12_risk_category, 'Conduite intensive régionale (> 30 000 km/an)', 4, 3, 'critique'::atlas_people.m12_risk_level, array['Permis valide vérifié','Formation éco-conduite annuelle','GPS + alertes vitesse']::text[], '[{"description":"Formation éco-conduite Q3","ownerEmployeeId":"e1000001-0000-0000-0000-000000000013","dueDate":"2026-09-30","status":"todo"}]'::jsonb, 4, '2026-01-18'
where not exists (select 1 from atlas_people.m12_risks where ref = 'RSK-2026-006');

insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RSK-2026-007', 'Espaces communs', 'CI', 'biologique'::atlas_people.m12_risk_category, 'Risque transmission virale (espaces partagés)', 2, 2, 'modere'::atlas_people.m12_risk_level, array['Gel hydroalcoolique','Aération naturelle','Politique télétravail si symptômes']::text[], '[]'::jsonb, 14, '2026-04-30'
where not exists (select 1 from atlas_people.m12_risks where ref = 'RSK-2026-007');

insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RSK-2026-008', 'Open space Sénégal', 'SN', 'tms'::atlas_people.m12_risk_category, 'Postes mal réglés — douleurs cervicales reportées', 3, 2, 'modere'::atlas_people.m12_risk_level, array['Audit ergonomique','Sièges réglables','Formation gestes & postures']::text[], '[]'::jsonb, 6, '2026-02-14'
where not exists (select 1 from atlas_people.m12_risks where ref = 'RSK-2026-008');

insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RSK-2026-009', 'Stockage matériel IT', 'CI', 'chute_hauteur'::atlas_people.m12_risk_category, 'Rangement en hauteur sans escabeau sécurisé', 2, 3, 'modere'::atlas_people.m12_risk_level, array['Achat escabeau norme EN 131','Procédure rangement','Formation manutention']::text[], '[]'::jsonb, 3, '2025-11-22'
where not exists (select 1 from atlas_people.m12_risks where ref = 'RSK-2026-009');

insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RSK-2026-010', 'Cuisine d''étage', 'CI', 'incendie_explosion'::atlas_people.m12_risk_category, 'Plaque induction — brûlures', 2, 1, 'acceptable'::atlas_people.m12_risk_level, array['Plaques à arrêt auto','Trousse 1er secours visible','Hotte aspirante']::text[], '[]'::jsonb, 14, '2026-03-15'
where not exists (select 1 from atlas_people.m12_risks where ref = 'RSK-2026-010');

insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RSK-2026-011', 'Plateforme cloud', 'CI', 'cyber'::atlas_people.m12_risk_category, 'Compromission identifiants (phishing)', 4, 4, 'critique'::atlas_people.m12_risk_level, array['MFA généralisé','Formation sensibilisation cyber annuelle','Politique mots de passe']::text[], '[{"description":"Audit pentest annuel","ownerEmployeeId":"e1000001-0000-0000-0000-000000000008","dueDate":"2026-09-15","status":"in_progress"}]'::jsonb, 14, '2026-05-10'
where not exists (select 1 from atlas_people.m12_risks where ref = 'RSK-2026-011');

insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RSK-2026-012', 'Open space Tech', 'CI', 'psychosocial'::atlas_people.m12_risk_category, 'Surcharge cognitive · multi-réunions > 4 h/j', 3, 2, 'modere'::atlas_people.m12_risk_level, array['Plages no-meeting matin','Limite 4 réunions/j','1-1 mensuel']::text[], '[]'::jsonb, 8, '2026-04-25'
where not exists (select 1 from atlas_people.m12_risks where ref = 'RSK-2026-012');

insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RSK-2026-013', 'Sites clients', 'CI', 'routier'::atlas_people.m12_risk_category, 'Déplacement clients zones rurales', 3, 4, 'critique'::atlas_people.m12_risk_level, array['Co-voiturage interdit en zone à risque','Véhicule récent vérifié','Briefing sécurité avant déplacement']::text[], '[]'::jsonb, 5, '2026-02-28'
where not exists (select 1 from atlas_people.m12_risks where ref = 'RSK-2026-013');

insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RSK-2026-014', 'Espace bureautique', 'CI', 'environnemental'::atlas_people.m12_risk_category, 'Climatisation excessive — qualité air', 2, 2, 'modere'::atlas_people.m12_risk_level, array['Maintenance trimestrielle clim','Capteurs CO₂','Aération naturelle quotidienne']::text[], '[]'::jsonb, 14, '2026-03-08'
where not exists (select 1 from atlas_people.m12_risks where ref = 'RSK-2026-014');

insert into atlas_people.m12_work_incidents (id, tenant_id, ref, employee_id, type, severity, occurred_at, declared_at, country_code, unite, location, description, workdays_lost, third_party_involved, root_cause, corrective_actions, status, cnps_ref, declared_within_sla)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'INC-2026-001', 'e1000001-0000-0000-0000-000000000009', 'AT'::atlas_people.m12_incident_type, 'leger'::atlas_people.m12_incident_severity, '2026-03-12'::timestamptz, '2026-03-13'::timestamptz, 'SN', 'Espace clientèle', 'Almadies, Dakar', 'Chute glissade — escalier intérieur', 5, false, 'Sol mouillé sans signalétique', array['Tapis antidérapant escalier','Panneau « sol mouillé » obligatoire']::text[], 'closed'::atlas_people.m12_incident_status, 'IPRES-2026-0042', true
where not exists (select 1 from atlas_people.m12_work_incidents where ref = 'INC-2026-001');

insert into atlas_people.m12_work_incidents (id, tenant_id, ref, employee_id, type, severity, occurred_at, declared_at, country_code, unite, location, description, workdays_lost, third_party_involved, root_cause, corrective_actions, status, cnps_ref, declared_within_sla)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'INC-2026-002', 'e1000001-0000-0000-0000-000000000012', 'AT_trajet'::atlas_people.m12_incident_type, 'leger'::atlas_people.m12_incident_severity, '2026-02-28'::timestamptz, '2026-03-01'::timestamptz, 'CI', 'Trajet domicile-travail', 'Marcory-Plateau', 'Accident de la circulation — pas de tiers identifié', 3, false, null, array['Rappel formation éco-conduite à passer']::text[], 'closed'::atlas_people.m12_incident_status, 'CNPS-CI-2026-0118', true
where not exists (select 1 from atlas_people.m12_work_incidents where ref = 'INC-2026-002');

insert into atlas_people.m12_work_incidents (id, tenant_id, ref, employee_id, type, severity, occurred_at, declared_at, country_code, unite, location, description, workdays_lost, third_party_involved, root_cause, corrective_actions, status, cnps_ref, declared_within_sla)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'INC-2026-003', 'e1000001-0000-0000-0000-000000000004', 'AT'::atlas_people.m12_incident_type, 'sans_arret'::atlas_people.m12_incident_severity, '2026-04-22'::timestamptz, '2026-04-23'::timestamptz, 'CI', 'Bureau', 'Plateau, Abidjan', 'Choc tête contre placard ouvert', 0, false, 'Placard mal positionné en hauteur', array['Repositionner placard à 1,80 m mini']::text[], 'closed'::atlas_people.m12_incident_status, 'CNPS-CI-2026-0152', true
where not exists (select 1 from atlas_people.m12_work_incidents where ref = 'INC-2026-003');

insert into atlas_people.m12_work_incidents (id, tenant_id, ref, employee_id, type, severity, occurred_at, declared_at, country_code, unite, location, description, workdays_lost, third_party_involved, root_cause, corrective_actions, status, cnps_ref, declared_within_sla)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'INC-2026-004', 'e1000001-0000-0000-0000-000000000006', 'MP'::atlas_people.m12_incident_type, 'grave'::atlas_people.m12_incident_severity, '2026-01-15'::timestamptz, '2026-02-12'::timestamptz, 'CI', 'Comptabilité', 'Bureau Plateau', 'Syndrome canal carpien — saisie comptable répétée', 30, false, 'Saisie répétée > 6 h/j sans pause', array['Souris ergonomique','Pause obligatoire toutes les 60 min','Aménagement temps de travail']::text[], 'cnps_filed'::atlas_people.m12_incident_status, 'CNPS-CI-MP-2026-008', false
where not exists (select 1 from atlas_people.m12_work_incidents where ref = 'INC-2026-004');

insert into atlas_people.m12_work_incidents (id, tenant_id, ref, employee_id, type, severity, occurred_at, declared_at, country_code, unite, location, description, workdays_lost, third_party_involved, root_cause, corrective_actions, status, cnps_ref, declared_within_sla)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'INC-2026-005', 'e1000001-0000-0000-0000-000000000002', 'presquAccident'::atlas_people.m12_incident_type, 'sans_arret'::atlas_people.m12_incident_severity, '2026-05-08'::timestamptz, '2026-05-09'::timestamptz, 'CI', 'Salle serveurs', 'DC Plateau', 'Étincelle multiprise — sans dommage', 0, false, 'Multiprise surchargée (issue déjà DUER rsk-002)', array['Remplacement immédiat','Audit prévu (DUER rsk-002)']::text[], 'closed'::atlas_people.m12_incident_status, null, true
where not exists (select 1 from atlas_people.m12_work_incidents where ref = 'INC-2026-005');

insert into atlas_people.m12_work_incidents (id, tenant_id, ref, employee_id, type, severity, occurred_at, declared_at, country_code, unite, location, description, workdays_lost, third_party_involved, root_cause, corrective_actions, status, cnps_ref, declared_within_sla)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'INC-2026-006', 'e1000001-0000-0000-0000-000000000011', 'AT'::atlas_people.m12_incident_type, 'leger'::atlas_people.m12_incident_severity, '2026-05-18'::timestamptz, '2026-05-19'::timestamptz, 'SN', 'Visite client', 'Dakar Centre', 'Faux mouvement port lourd dossier client', 2, false, null, array['Formation gestes et postures','Chariot léger pour transport documents']::text[], 'investigation'::atlas_people.m12_incident_status, null, true
where not exists (select 1 from atlas_people.m12_work_incidents where ref = 'INC-2026-006');

insert into atlas_people.m12_work_incidents (id, tenant_id, ref, employee_id, type, severity, occurred_at, declared_at, country_code, unite, location, description, workdays_lost, third_party_involved, root_cause, corrective_actions, status, cnps_ref, declared_within_sla)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'INC-2026-007', 'e1000001-0000-0000-0000-000000000008', 'AT_trajet'::atlas_people.m12_incident_type, 'leger'::atlas_people.m12_incident_severity, '2026-04-04'::timestamptz, '2026-04-05'::timestamptz, 'CI', 'Trajet', 'Cocody-Plateau', 'Accident moto — choc latéral véhicule', 7, true, null, array['Constat amiable transmis assureur','Suivi médical 30 j']::text[], 'cnps_filed'::atlas_people.m12_incident_status, 'CNPS-CI-2026-0188', true
where not exists (select 1 from atlas_people.m12_work_incidents where ref = 'INC-2026-007');

insert into atlas_people.m12_work_incidents (id, tenant_id, ref, employee_id, type, severity, occurred_at, declared_at, country_code, unite, location, description, workdays_lost, third_party_involved, root_cause, corrective_actions, status, cnps_ref, declared_within_sla)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'INC-2026-008', 'e1000001-0000-0000-0000-000000000014', 'presquAccident'::atlas_people.m12_incident_type, 'sans_arret'::atlas_people.m12_incident_severity, '2026-05-25'::timestamptz, '2026-05-26'::timestamptz, 'CI', 'Bureau', 'Salle réunion B', 'Chaise cassée — risque chute', 0, false, null, array['Retrait immédiat mobilier vétuste','Audit mobilier annuel à prévoir']::text[], 'closed'::atlas_people.m12_incident_status, null, true
where not exists (select 1 from atlas_people.m12_work_incidents where ref = 'INC-2026-008');

insert into atlas_people.m12_rps_surveys (id, tenant_id, ref, title, country_code, scope, scope_label, status, framework, opened_at, closed_at, target_respondents, respondents, average_wellbeing_score, burnout_risk_pct, listening_cell_triggered, insights)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RPS-2026-001', 'WHO-5 Bien-être Q2 2026', 'CI', 'company', 'Atlas People — global', 'analyzed'::atlas_people.m12_rps_status, null, '2026-04-15'::timestamptz, '2026-04-29'::timestamptz, 14, 12, 68, 17, false, array['12/14 répondants (86 %)','Score bien-être 68/100 — en hausse +4 pts vs Q1','Risque burnout 17 % — vigilance équipe Tech']::text[]
where not exists (select 1 from atlas_people.m12_rps_surveys where ref = 'RPS-2026-001');

insert into atlas_people.m12_rps_surveys (id, tenant_id, ref, title, country_code, scope, scope_label, status, framework, opened_at, closed_at, target_respondents, respondents, average_wellbeing_score, burnout_risk_pct, listening_cell_triggered, insights)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RPS-2026-002', 'Karasek Job Strain équipe Tech', 'CI', 'team', 'Équipe Technologie', 'closed'::atlas_people.m12_rps_status, null, '2026-05-10'::timestamptz, '2026-05-25'::timestamptz, 8, 7, 58, 28, true, array['28 % à risque — au-dessus du seuil 20 %','Cellule d''écoute déclenchée le 26/05','Origine identifiée : sprint long Q2']::text[]
where not exists (select 1 from atlas_people.m12_rps_surveys where ref = 'RPS-2026-002');

insert into atlas_people.m12_rps_surveys (id, tenant_id, ref, title, country_code, scope, scope_label, status, framework, opened_at, closed_at, target_respondents, respondents, average_wellbeing_score, burnout_risk_pct, listening_cell_triggered, insights)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'RPS-2026-003', 'Pulse hebdo Q3 2026', 'SN', 'BU', 'BU Sénégal', 'open'::atlas_people.m12_rps_status, null, '2026-05-29'::timestamptz, null, 5, 2, null, null, false, '{}'::text[]
where not exists (select 1 from atlas_people.m12_rps_surveys where ref = 'RPS-2026-003');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'CNPS-CI-2025-10', 'CNPS_CI'::atlas_people.m12_declaration_kind, 'CI', '2025-10', 'monthly'::atlas_people.m12_declaration_frequency, 'paid'::atlas_people.m12_declaration_status, '2025-11-15', '2025-11-12'::timestamptz, '2025-11-14'::timestamptz, 1850000, null, 11
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'CNPS-CI-2025-10');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'CNPS-CI-2025-11', 'CNPS_CI'::atlas_people.m12_declaration_kind, 'CI', '2025-11', 'monthly'::atlas_people.m12_declaration_frequency, 'paid'::atlas_people.m12_declaration_status, '2025-12-15', '2025-12-12'::timestamptz, '2025-12-14'::timestamptz, 1862000, null, 11
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'CNPS-CI-2025-11');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'CNPS-CI-2025-12', 'CNPS_CI'::atlas_people.m12_declaration_kind, 'CI', '2025-12', 'monthly'::atlas_people.m12_declaration_frequency, 'paid'::atlas_people.m12_declaration_status, '2026-01-15', '2026-01-12'::timestamptz, '2026-01-14'::timestamptz, 1874000, null, 11
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'CNPS-CI-2025-12');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'CNPS-CI-2026-01', 'CNPS_CI'::atlas_people.m12_declaration_kind, 'CI', '2026-01', 'monthly'::atlas_people.m12_declaration_frequency, 'paid'::atlas_people.m12_declaration_status, '2026-02-15', '2026-02-12'::timestamptz, '2026-02-14'::timestamptz, 1886000, null, 11
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'CNPS-CI-2026-01');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'CNPS-CI-2026-02', 'CNPS_CI'::atlas_people.m12_declaration_kind, 'CI', '2026-02', 'monthly'::atlas_people.m12_declaration_frequency, 'paid'::atlas_people.m12_declaration_status, '2026-03-15', '2026-03-12'::timestamptz, '2026-03-14'::timestamptz, 1898000, null, 11
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'CNPS-CI-2026-02');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'CNPS-CI-2026-03', 'CNPS_CI'::atlas_people.m12_declaration_kind, 'CI', '2026-03', 'monthly'::atlas_people.m12_declaration_frequency, 'paid'::atlas_people.m12_declaration_status, '2026-04-15', '2026-04-12'::timestamptz, '2026-04-14'::timestamptz, 1910000, null, 11
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'CNPS-CI-2026-03');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'CNPS-CI-2026-04', 'CNPS_CI'::atlas_people.m12_declaration_kind, 'CI', '2026-04', 'monthly'::atlas_people.m12_declaration_frequency, 'submitted'::atlas_people.m12_declaration_status, '2026-05-15', '2026-05-12'::timestamptz, null, 1922000, null, 11
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'CNPS-CI-2026-04');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'CNPS-CI-2026-05', 'CNPS_CI'::atlas_people.m12_declaration_kind, 'CI', '2026-05', 'monthly'::atlas_people.m12_declaration_frequency, 'draft'::atlas_people.m12_declaration_status, '2026-06-15', null, null, 1920000, null, 11
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'CNPS-CI-2026-05');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'IPRES-SN-2026-01', 'IPRES_SN'::atlas_people.m12_declaration_kind, 'SN', '2026-01', 'monthly'::atlas_people.m12_declaration_frequency, 'paid'::atlas_people.m12_declaration_status, '2026-02-15', '2026-02-10'::timestamptz, '2026-02-14'::timestamptz, 480000, null, 3
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'IPRES-SN-2026-01');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'IPRES-SN-2026-02', 'IPRES_SN'::atlas_people.m12_declaration_kind, 'SN', '2026-02', 'monthly'::atlas_people.m12_declaration_frequency, 'paid'::atlas_people.m12_declaration_status, '2026-03-15', '2026-03-10'::timestamptz, '2026-03-14'::timestamptz, 488000, null, 3
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'IPRES-SN-2026-02');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'IPRES-SN-2026-03', 'IPRES_SN'::atlas_people.m12_declaration_kind, 'SN', '2026-03', 'monthly'::atlas_people.m12_declaration_frequency, 'paid'::atlas_people.m12_declaration_status, '2026-04-15', '2026-04-10'::timestamptz, '2026-04-14'::timestamptz, 496000, null, 3
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'IPRES-SN-2026-03');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'IPRES-SN-2026-04', 'IPRES_SN'::atlas_people.m12_declaration_kind, 'SN', '2026-04', 'monthly'::atlas_people.m12_declaration_frequency, 'submitted'::atlas_people.m12_declaration_status, '2026-05-15', '2026-05-10'::timestamptz, null, 504000, null, 3
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'IPRES-SN-2026-04');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'IPRES-SN-2026-05', 'IPRES_SN'::atlas_people.m12_declaration_kind, 'SN', '2026-05', 'monthly'::atlas_people.m12_declaration_frequency, 'draft'::atlas_people.m12_declaration_status, '2026-06-15', null, null, 510000, null, 3
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'IPRES-SN-2026-05');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'DGI-CI-2026-Q1', 'DGI'::atlas_people.m12_declaration_kind, 'CI', '2026-Q1', 'quarterly'::atlas_people.m12_declaration_frequency, 'paid'::atlas_people.m12_declaration_status, '2026-04-15', '2026-04-10'::timestamptz, '2026-04-14'::timestamptz, 4280000, null, 11
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'DGI-CI-2026-Q1');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'CNAM-CI-2026-04', 'CNAM'::atlas_people.m12_declaration_kind, 'CI', '2026-04', 'monthly'::atlas_people.m12_declaration_frequency, 'submitted'::atlas_people.m12_declaration_status, '2026-05-15', '2026-05-12'::timestamptz, null, 285000, null, 11
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'CNAM-CI-2026-04');

insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'DISA-CI-2025', 'DISA'::atlas_people.m12_declaration_kind, 'CI', '2025', 'annual'::atlas_people.m12_declaration_frequency, 'overdue'::atlas_people.m12_declaration_status, '2026-03-31', null, null, 0, 250000, 14
where not exists (select 1 from atlas_people.m12_social_declarations where ref = 'DISA-CI-2025');

insert into atlas_people.m12_authorizations (id, tenant_id, ref, employee_id, kind, level, issued_at, expires_at, status, issuing_authority)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'AUT-BS-001', 'e1000001-0000-0000-0000-000000000008', 'electrique'::atlas_people.m12_auth_kind, 'BS-BE manœuvre', '2024-09-10', '2027-09-10', 'active'::atlas_people.m12_auth_status, 'INSPCT CI'
where not exists (select 1 from atlas_people.m12_authorizations where ref = 'AUT-BS-001');

insert into atlas_people.m12_authorizations (id, tenant_id, ref, employee_id, kind, level, issued_at, expires_at, status, issuing_authority)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'AUT-BS-002', 'e1000001-0000-0000-0000-000000000012', 'electrique'::atlas_people.m12_auth_kind, 'BS-BE manœuvre', '2024-09-10', '2027-09-10', 'active'::atlas_people.m12_auth_status, 'INSPCT CI'
where not exists (select 1 from atlas_people.m12_authorizations where ref = 'AUT-BS-002');

insert into atlas_people.m12_authorizations (id, tenant_id, ref, employee_id, kind, level, issued_at, expires_at, status, issuing_authority)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'AUT-PF-001', 'e1000001-0000-0000-0000-000000000012', 'permis_feu'::atlas_people.m12_auth_kind, 'Permis feu général', '2025-04-20', '2026-08-20', 'pending_renewal'::atlas_people.m12_auth_status, 'SDIS / interne'
where not exists (select 1 from atlas_people.m12_authorizations where ref = 'AUT-PF-001');

insert into atlas_people.m12_authorizations (id, tenant_id, ref, employee_id, kind, level, issued_at, expires_at, status, issuing_authority)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'AUT-CON-001', 'e1000001-0000-0000-0000-000000000004', 'conduite'::atlas_people.m12_auth_kind, 'B + transport', '2010-06-15', '2030-06-15', 'active'::atlas_people.m12_auth_status, 'État CI'
where not exists (select 1 from atlas_people.m12_authorizations where ref = 'AUT-CON-001');

insert into atlas_people.m12_authorizations (id, tenant_id, ref, employee_id, kind, level, issued_at, expires_at, status, issuing_authority)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'AUT-CON-002', 'e1000001-0000-0000-0000-000000000011', 'conduite'::atlas_people.m12_auth_kind, 'B', '2018-09-10', '2028-09-10', 'active'::atlas_people.m12_auth_status, 'État SN'
where not exists (select 1 from atlas_people.m12_authorizations where ref = 'AUT-CON-002');

insert into atlas_people.m12_authorizations (id, tenant_id, ref, employee_id, kind, level, issued_at, expires_at, status, issuing_authority)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'AUT-CON-003', 'e1000001-0000-0000-0000-000000000013', 'conduite'::atlas_people.m12_auth_kind, 'B', '2015-03-22', '2026-08-22', 'pending_renewal'::atlas_people.m12_auth_status, 'État SN'
where not exists (select 1 from atlas_people.m12_authorizations where ref = 'AUT-CON-003');

insert into atlas_people.m12_authorizations (id, tenant_id, ref, employee_id, kind, level, issued_at, expires_at, status, issuing_authority)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'AUT-CHIM-001', 'e1000001-0000-0000-0000-000000000009', 'chimique'::atlas_people.m12_auth_kind, 'Produits ménagers ERP', '2025-06-10', '2027-06-10', 'active'::atlas_people.m12_auth_status, 'Formation interne'
where not exists (select 1 from atlas_people.m12_authorizations where ref = 'AUT-CHIM-001');

insert into atlas_people.m12_authorizations (id, tenant_id, ref, employee_id, kind, level, issued_at, expires_at, status, issuing_authority)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'AUT-CACES-001', 'e1000001-0000-0000-0000-000000000012', 'cariste'::atlas_people.m12_auth_kind, 'CACES 1A', '2024-03-15', '2029-03-15', 'active'::atlas_people.m12_auth_status, 'INSPCT CI'
where not exists (select 1 from atlas_people.m12_authorizations where ref = 'AUT-CACES-001');

insert into atlas_people.m12_authorizations (id, tenant_id, ref, employee_id, kind, level, issued_at, expires_at, status, issuing_authority)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'AUT-PF-002', 'e1000001-0000-0000-0000-000000000008', 'permis_feu'::atlas_people.m12_auth_kind, 'Permis feu général', '2025-04-20', '2027-04-20', 'active'::atlas_people.m12_auth_status, 'SDIS / interne'
where not exists (select 1 from atlas_people.m12_authorizations where ref = 'AUT-PF-002');

insert into atlas_people.m12_authorizations (id, tenant_id, ref, employee_id, kind, level, issued_at, expires_at, status, issuing_authority)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'AUT-HAUT-001', 'e1000001-0000-0000-0000-000000000008', 'travaux_hauteur'::atlas_people.m12_auth_kind, 'Travaux hauteur < 5 m', '2023-11-08', '2026-07-08', 'pending_renewal'::atlas_people.m12_auth_status, 'INSPCT CI'
where not exists (select 1 from atlas_people.m12_authorizations where ref = 'AUT-HAUT-001');

insert into atlas_people.m12_authorizations (id, tenant_id, ref, employee_id, kind, level, issued_at, expires_at, status, issuing_authority)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'AUT-CON-004', 'e1000001-0000-0000-0000-000000000001', 'conduite'::atlas_people.m12_auth_kind, 'B', '2005-04-12', '2026-09-12', 'pending_renewal'::atlas_people.m12_auth_status, 'État CI'
where not exists (select 1 from atlas_people.m12_authorizations where ref = 'AUT-CON-004');

