-- Seed M7 OKR (tenant démo) — généré depuis src/lib/m7/mock.ts.
-- Purge + reseed (objectifs/KR). Niveaux : company->entreprise... ; KR percent->percentage ;
-- confidence green/amber/red -> 5/3/1 ; status active -> in_progress. Check-ins gardés mock (modèle DB par-KR).

delete from atlas_people.m7_check_ins where tenant_id='11111111-1111-1111-1111-111111111111';
delete from atlas_people.m7_key_results where tenant_id='11111111-1111-1111-1111-111111111111';
delete from atlas_people.m7_objectives where tenant_id='11111111-1111-1111-1111-111111111111';

insert into atlas_people.m7_objectives (id, tenant_id, cycle_id, ref, level, title, description, owner_id, team_label, status)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-0000-0000-0007-100000000001', v.ref, v.level::atlas_people.m7_okr_level, v.title, v.descr, v.owner::uuid, v.team, v.status::atlas_people.m7_objective_status
from (values
 ('OBJ-2026-Q2-0001','entreprise','Accélérer la croissance du chiffre d''affaires Q2','Pousser les indicateurs de croissance pour atteindre la trajectoire annuelle','e1000001-0000-0000-0000-000000000001',null,'in_progress'),
 ('OBJ-2026-Q2-0002','entreprise','Faire d''Atlas la référence Customer-Loved en Afrique francophone','NPS, churn, NRR — focus rétention & satisfaction','e1000001-0000-0000-0000-000000000001',null,'in_progress'),
 ('OBJ-2026-Q2-0003','entreprise','Industrialiser la livraison produit & paie','Vélocité tech + qualité paie multi-pays','e1000001-0000-0000-0000-000000000001',null,'in_progress'),
 ('OBJ-2026-Q2-0004','direction','Engineering : doubler la vélocité produit',null,'e1000001-0000-0000-0000-000000000002','Technologie','in_progress'),
 ('OBJ-2026-Q2-0005','direction','Commercial : closer 12 comptes Tier 1',null,'e1000001-0000-0000-0000-000000000004','Ventes','in_progress'),
 ('OBJ-2026-Q2-0006','direction','RH : industrialiser le recrutement Tech',null,'e1000001-0000-0000-0000-000000000003','Ressources Humaines','in_progress'),
 ('OBJ-2026-Q2-0007','direction','Customer Success : NPS 55+ et churn -10pts',null,'e1000001-0000-0000-0000-000000000011','Customer Success','in_progress'),
 ('OBJ-2026-Q2-0008','direction','Finance : passer à un closing < 5 j ouvrés',null,'e1000001-0000-0000-0000-000000000001','Finance','in_progress'),
 ('OBJ-2026-Q2-0009','equipe','Squad Paie : passer à 5 pays sur le module M3',null,'e1000001-0000-0000-0000-000000000002','Squad Paie','in_progress'),
 ('OBJ-2026-Q2-0010','equipe','Squad Platform : SLO 99,95 %',null,'e1000001-0000-0000-0000-000000000008','Squad Platform','in_progress'),
 ('OBJ-2026-Q2-0011','equipe','Account Strategic : signer 6 logos Tier 1',null,'e1000001-0000-0000-0000-000000000004','Strategic Sales','in_progress'),
 ('OBJ-2026-Q2-0012','equipe','Talent Acquisition Tech : closer 8 ingés',null,'e1000001-0000-0000-0000-000000000007','Talent Acquisition','in_progress'),
 ('OBJ-2026-Q2-0013','individuel','Livrer la migration paie Sénégal en prod',null,'e1000001-0000-0000-0000-000000000002',null,'in_progress'),
 ('OBJ-2026-Q2-0014','individuel','Lancer la facturation SaaS Atlas Studio',null,'e1000001-0000-0000-0000-000000000001',null,'in_progress'),
 ('OBJ-2026-Q2-0015','individuel','Recruter 3 commerciaux Tier 1 confirmés',null,'e1000001-0000-0000-0000-000000000007',null,'in_progress'),
 ('OBJ-2026-Q2-0016','individuel','Refondre l''onboarding produit (NPS 50+)',null,'e1000001-0000-0000-0000-000000000005',null,'in_progress'),
 ('OBJ-2026-Q2-0017','individuel','Convertir 4 comptes pilotes en contrats',null,'e1000001-0000-0000-0000-000000000004',null,'in_progress')
) as v(ref,level,title,descr,owner,team,status)
where not exists (select 1 from atlas_people.m7_objectives x where x.ref = v.ref and x.tenant_id='11111111-1111-1111-1111-111111111111');

update atlas_people.m7_objectives o set parent_id = p.id
from atlas_people.m7_objectives p, (values
 ('OBJ-2026-Q2-0004','OBJ-2026-Q2-0003'),
 ('OBJ-2026-Q2-0005','OBJ-2026-Q2-0001'),
 ('OBJ-2026-Q2-0006','OBJ-2026-Q2-0003'),
 ('OBJ-2026-Q2-0007','OBJ-2026-Q2-0002'),
 ('OBJ-2026-Q2-0009','OBJ-2026-Q2-0004'),
 ('OBJ-2026-Q2-0010','OBJ-2026-Q2-0004'),
 ('OBJ-2026-Q2-0011','OBJ-2026-Q2-0005'),
 ('OBJ-2026-Q2-0012','OBJ-2026-Q2-0006'),
 ('OBJ-2026-Q2-0013','OBJ-2026-Q2-0009'),
 ('OBJ-2026-Q2-0015','OBJ-2026-Q2-0012'),
 ('OBJ-2026-Q2-0016','OBJ-2026-Q2-0007'),
 ('OBJ-2026-Q2-0017','OBJ-2026-Q2-0011')
) as m(child_ref, parent_ref)
where o.ref = m.child_ref and p.ref = m.parent_ref and o.tenant_id='11111111-1111-1111-1111-111111111111' and p.tenant_id='11111111-1111-1111-1111-111111111111';

insert into atlas_people.m7_key_results (id, tenant_id, objective_id, ref, title, type, baseline, target, current_value, unit, weight_pct, confidence)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', o.id, v.ref, v.title, v.typ::atlas_people.m7_kr_type, v.base, v.target, v.cur, v.unit, v.w, v.conf
from (values
 ('OBJ-2026-Q2-0001','KR-2026-Q2-0001','Atteindre 850 M FCFA de revenu trimestriel','currency',0,850000000,510000000,'FCFA',5,5),
 ('OBJ-2026-Q2-0001','KR-2026-Q2-0002','Acquérir 12 nouveaux comptes Tier 1','numeric',0,12,7,null,4,3),
 ('OBJ-2026-Q2-0001','KR-2026-Q2-0003','Activer 2 nouveaux pays (présence commerciale)','numeric',0,2,1,null,3,3),
 ('OBJ-2026-Q2-0002','KR-2026-Q2-0004','Porter le NPS produit à 55+','numeric',32,55,47,null,5,5),
 ('OBJ-2026-Q2-0002','KR-2026-Q2-0005','Réduire le churn annuel à 8 %','percentage',18,8,12,'%',5,1),
 ('OBJ-2026-Q2-0002','KR-2026-Q2-0006','NRR portée à 115 %','percentage',95,115,108,'%',4,5),
 ('OBJ-2026-Q2-0003','KR-2026-Q2-0007','Déployer la paie M3 sur 5 pays UEMOA','numeric',2,5,3,null,5,1),
 ('OBJ-2026-Q2-0003','KR-2026-Q2-0008','Réduire le lead-time des PRs < 36 h (médiane)','numeric',72,36,48,'h',4,1),
 ('OBJ-2026-Q2-0004','KR-2026-Q2-0009','95 % de coverage tests sur cœur paie','percentage',78,95,88,'%',5,3),
 ('OBJ-2026-Q2-0004','KR-2026-Q2-0010','3 déploiements prod par semaine','numeric',1,3,2,null,4,3),
 ('OBJ-2026-Q2-0004','KR-2026-Q2-0011','Time-to-recovery incident < 60 min','numeric',180,60,90,'min',3,1),
 ('OBJ-2026-Q2-0005','KR-2026-Q2-0012','Pipeline qualifié 1,8 Md FCFA','currency',800000000,1800000000,1200000000,'FCFA',5,3),
 ('OBJ-2026-Q2-0005','KR-2026-Q2-0013','Cycle de vente < 90 j (médiane)','numeric',120,90,102,'j',4,1),
 ('OBJ-2026-Q2-0006','KR-2026-Q2-0014','Embaucher 8 ingénieurs senior','numeric',0,8,3,null,5,1),
 ('OBJ-2026-Q2-0006','KR-2026-Q2-0015','Time-to-fill ≤ 40 jours (médiane)','numeric',60,40,45,'j',4,1),
 ('OBJ-2026-Q2-0006','KR-2026-Q2-0016','NPS candidat ≥ 60','numeric',45,60,58,null,3,5),
 ('OBJ-2026-Q2-0007','KR-2026-Q2-0017','NPS Customer 47 → 55+','numeric',47,55,51,null,5,3),
 ('OBJ-2026-Q2-0007','KR-2026-Q2-0018','Churn -10pts (18 % → 8 %)','percentage',18,8,12,'%',5,1),
 ('OBJ-2026-Q2-0008','KR-2026-Q2-0019','Réduire le closing à 5 jours ouvrés','numeric',12,5,8,'j',5,1),
 ('OBJ-2026-Q2-0008','KR-2026-Q2-0020','Automatiser 80 % des écritures','percentage',40,80,55,'%',4,1),
 ('OBJ-2026-Q2-0009','KR-2026-Q2-0021','CI/CD Sénégal opérationnel','binary',0,1,1,null,4,5),
 ('OBJ-2026-Q2-0009','KR-2026-Q2-0022','Modèles paie Mali livrés','milestone',0,5,3,null,5,5),
 ('OBJ-2026-Q2-0009','KR-2026-Q2-0023','Charge utilisateur tests UAT','percentage',0,100,60,'%',3,5),
 ('OBJ-2026-Q2-0010','KR-2026-Q2-0024','Uptime production ≥ 99,95 %','percentage',99.7,99.95,99.92,'%',5,5),
 ('OBJ-2026-Q2-0010','KR-2026-Q2-0025','MTBF doublé','numeric',120,240,190,'h',4,3),
 ('OBJ-2026-Q2-0011','KR-2026-Q2-0026','6 logos Tier 1 signés','numeric',0,6,3,null,5,3),
 ('OBJ-2026-Q2-0011','KR-2026-Q2-0027','Win-rate ≥ 40 %','percentage',25,40,33,'%',4,3),
 ('OBJ-2026-Q2-0012','KR-2026-Q2-0028','8 offres acceptées Tech','numeric',0,8,3,null,5,1),
 ('OBJ-2026-Q2-0012','KR-2026-Q2-0029','Taux acceptation offres ≥ 75 %','percentage',60,75,71,'%',4,5),
 ('OBJ-2026-Q2-0013','KR-2026-Q2-0030','Tests UAT 100 % verts SN','percentage',0,100,80,'%',5,5),
 ('OBJ-2026-Q2-0013','KR-2026-Q2-0031','Go-live production Sénégal','binary',0,1,0,null,5,1),
 ('OBJ-2026-Q2-0014','KR-2026-Q2-0032','Spec finalisée + validée','binary',0,1,1,null,3,5),
 ('OBJ-2026-Q2-0014','KR-2026-Q2-0033','POC technique livré','binary',0,1,0,null,4,1),
 ('OBJ-2026-Q2-0015','KR-2026-Q2-0034','3 commerciaux Tier 1 signés','numeric',0,3,2,null,5,5),
 ('OBJ-2026-Q2-0016','KR-2026-Q2-0035','NPS onboarding ≥ 50','numeric',30,50,42,null,5,5),
 ('OBJ-2026-Q2-0016','KR-2026-Q2-0036','Réduire le time-to-first-value à 7 j','numeric',21,7,12,'j',4,1),
 ('OBJ-2026-Q2-0017','KR-2026-Q2-0037','4 contrats annuels signés','numeric',0,4,2,null,5,3)
) as v(obj_ref,ref,title,typ,base,target,cur,unit,w,conf)
join atlas_people.m7_objectives o on o.ref = v.obj_ref and o.tenant_id='11111111-1111-1111-1111-111111111111'
where not exists (select 1 from atlas_people.m7_key_results x where x.ref = v.ref and x.tenant_id='11111111-1111-1111-1111-111111111111');
