-- Seed M2 Temps & absences (tenant démo) — déjà appliqué en prod le 2026-06-09.
-- Idempotent : n'insère que si vide. Mapping employé : e1000001-0000-0000-0000-0000000000NN.
-- Contraintes : overtime_records.status ∈ {detected,validated,refused,converted_to_recovery} ;
--               time_clockings.source ∈ {online,offline_sync}, method ∈ {mobile_geo,badge,biometric,manual,web}.

-- Organigramme (manager_id) — câblage de la hiérarchie démo.
update atlas_people.employees set manager_id = m.mid from (values
 ('e1000001-0000-0000-0000-000000000002'::uuid,'e1000001-0000-0000-0000-000000000001'::uuid),
 ('e1000001-0000-0000-0000-000000000004','e1000001-0000-0000-0000-000000000001'),
 ('e1000001-0000-0000-0000-000000000005','e1000001-0000-0000-0000-000000000002'),
 ('e1000001-0000-0000-0000-000000000006','e1000001-0000-0000-0000-000000000001'),
 ('e1000001-0000-0000-0000-000000000007','e1000001-0000-0000-0000-000000000003'),
 ('e1000001-0000-0000-0000-000000000008','e1000001-0000-0000-0000-000000000002'),
 ('e1000001-0000-0000-0000-000000000010','e1000001-0000-0000-0000-000000000002'),
 ('e1000001-0000-0000-0000-000000000011','e1000001-0000-0000-0000-000000000004'),
 ('e1000001-0000-0000-0000-000000000014','e1000001-0000-0000-0000-000000000001')
) as m(eid,mid) where atlas_people.employees.id = m.eid;

-- Heures supplémentaires.
insert into atlas_people.overtime_records (id, tenant_id, employee_id, work_date, hours, rate_pct, category, status, created_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', v.eid::uuid, v.d::date, v.h, v.r, v.c, v.s, now()
from (values
 ('e1000001-0000-0000-0000-000000000002','2026-05-12',1.5,15,'overtime','validated'),
 ('e1000001-0000-0000-0000-000000000002','2026-05-15',1,50,'overtime','validated'),
 ('e1000001-0000-0000-0000-000000000002','2026-05-20',2.5,50,'night','detected'),
 ('e1000001-0000-0000-0000-000000000004','2026-05-19',2,15,'overtime','detected'),
 ('e1000001-0000-0000-0000-000000000010','2026-05-21',1.5,50,'night','detected'),
 ('e1000001-0000-0000-0000-000000000003','2026-05-18',1,15,'overtime','detected')
) as v(eid,d,h,r,c,s)
where not exists (select 1 from atlas_people.overtime_records where tenant_id = '11111111-1111-1111-1111-111111111111');

-- Pointages.
insert into atlas_people.time_clockings (id, tenant_id, employee_id, clocking_type, clocked_at, method, source, verification_status, created_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', v.eid::uuid, v.t, v.at::timestamptz, 'badge', v.src, v.ver, now()
from (values
 ('e1000001-0000-0000-0000-000000000002','in','2026-05-26T08:02:00Z','online','ok'),
 ('e1000001-0000-0000-0000-000000000002','out','2026-05-26T18:05:00Z','online','ok'),
 ('e1000001-0000-0000-0000-000000000002','in','2026-05-27T08:10:00Z','offline_sync','to_verify'),
 ('e1000001-0000-0000-0000-000000000004','in','2026-05-26T08:00:00Z','online','ok'),
 ('e1000001-0000-0000-0000-000000000004','out','2026-05-26T17:30:00Z','online','ok'),
 ('e1000001-0000-0000-0000-000000000008','in','2026-05-26T09:00:00Z','online','ok'),
 ('e1000001-0000-0000-0000-000000000008','out','2026-05-26T18:00:00Z','online','ok')
) as v(eid,t,at,src,ver)
where not exists (select 1 from atlas_people.time_clockings where tenant_id = '11111111-1111-1111-1111-111111111111');
