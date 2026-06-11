-- Seed M4 Admin RH (tenant démo) — appliqué en prod le 2026-06-10. Idempotent.
-- Contrats : complète classification/workplace + 2 contrats manquants (e11, e12).
-- Départ : Bineta Gueye (e13, statut roster 'notice') → démission en cours, cohérence inter-modules.
-- Enums : type=atlas_people.m4_contract_type / m4_departure_type ; status contrats=m4_contract_status ;
--         m4_departures.initiative ∈ {salarie,employeur,mutuelle,force_majeure}, status ∈ {draft,in_progress,closed,cancelled} ;
--         m4_discipline_status ∈ {opened,under_investigation,…,closed,cancelled} (PAS de 'open').

update atlas_people.m4_contracts c set classification = v.classif, workplace = v.site
from (values
 ('CTR-CI-001','Cadre B · Échelon 3','Direction Générale Cocody'),
 ('CTR-CI-002','Cadre B · Échelon 3','Plateau Innovation'),
 ('CTR-CI-003','Cadre B · Échelon 3','Showroom Marcory'),
 ('CTR-CI-004','Maîtrise · Échelon 2','Direction Générale Cocody'),
 ('CTR-CI-005','Maîtrise · Échelon 1','Plateau Innovation'),
 ('CTR-CI-006','Maîtrise · Échelon 1','Plateau Innovation'),
 ('CTR-CI-007','Cadre B · Échelon 3','Plateau Innovation'),
 ('CTR-SN-001','Cadre A · Échelon 2','Siège Plateau'),
 ('CTR-SN-002','Maîtrise · Échelon 1','Plateau Innovation'),
 ('CTR-SN-003','Maîtrise · Échelon 2','Siège Plateau'),
 ('CTR-SN-004','Cadre B · Échelon 3','Siège Plateau'),
 ('CTR-SN-005','Cadre B · Échelon 3','Showroom Marcory')
) as v(ref,classif,site)
where c.ref = v.ref and c.tenant_id = '11111111-1111-1111-1111-111111111111';

insert into atlas_people.m4_contracts (id, tenant_id, employee_id, ref, type, fonction, service, classification, workplace, status)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', v.eid::uuid, v.ref, v.typ::atlas_people.m4_contract_type, v.fonction, v.service, v.classif, v.site, v.st::atlas_people.m4_contract_status
from (values
 ('e1000001-0000-0000-0000-000000000011','CTR-SN-006','CDI','Customer Success','Ventes','Maîtrise · Échelon 1','Showroom Marcory','active'),
 ('e1000001-0000-0000-0000-000000000012','CTR-CI-008','CDD','Technicien support','Opérations','Employé · Échelon 2','Siège Plateau','active')
) as v(eid,ref,typ,fonction,service,classif,site,st)
where not exists (select 1 from atlas_people.m4_contracts where ref = v.ref);

insert into atlas_people.m4_departures (id, tenant_id, employee_id, ref, type, initiative, notified_at, notice_start, notice_end, end_date, notice_period_days, notice_done, reason, status, created_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'e1000001-0000-0000-0000-000000000013', 'DEP-2026-001', 'DEMISSION'::atlas_people.m4_departure_type, 'salarie', '2026-05-15', '2026-05-16', '2026-08-15', '2026-08-15', 90, false, 'Démission — opportunité externe (préavis 3 mois cadre)', 'in_progress', now()
where not exists (select 1 from atlas_people.m4_departures where ref = 'DEP-2026-001');
