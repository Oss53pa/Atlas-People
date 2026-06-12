-- Seed M10 Carrières (tenant démo) — appliqué en prod le 2026-06-12.
-- ATTENTION : purge d'abord les lignes démo ORPHELINES pré-existantes (elles
-- référençaient des uuids employés 11111111-0000-... absents de la table
-- employees), puis reseede depuis le mock avec les VRAIS uuids (e1000001-...).
-- Enums : m10_succession_readiness ∈ {ready_now,ready_18m,ready_3y} (mock
-- 1_2_years→ready_18m, 3_5_years→ready_3y) ; m10_pool_code ∈ {HIPO,
-- FUTURS_LEADERS,EXPERTS,SUCCESSEURS} (programme mock → code pool) ;
-- m10_mentorat_pairs.program_id NOT NULL → programme 'Leadership développement'.

delete from atlas_people.m10_succession_successors where tenant_id='11111111-1111-1111-1111-111111111111';
delete from atlas_people.m10_critical_roles where tenant_id='11111111-1111-1111-1111-111111111111';
delete from atlas_people.m10_mentorat_pairs where tenant_id='11111111-1111-1111-1111-111111111111';
delete from atlas_people.m10_talent_pool_memberships where tenant_id='11111111-1111-1111-1111-111111111111';

insert into atlas_people.m10_critical_roles (id, tenant_id, role_label, current_holder_id, criticality, last_review_at, next_review_due)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', v.label, v.holder::uuid, v.crit, '2026-04-30'::date, '2027-04-30'::date
from (values
 ('CTO','e1000001-0000-0000-0000-000000000002','high'),
 ('CFO','e1000001-0000-0000-0000-000000000001','high'),
 ('DRH','e1000001-0000-0000-0000-000000000003','high'),
 ('Director Sales','e1000001-0000-0000-0000-000000000004','high'),
 ('Head of Product','e1000001-0000-0000-0000-000000000014','medium'),
 ('Marketing Lead','e1000001-0000-0000-0000-000000000013','medium'),
 ('DevOps Lead','e1000001-0000-0000-0000-000000000008','medium'),
 ('Office / Ops Manager','e1000001-0000-0000-0000-000000000009','low')
) as v(label,holder,crit);

insert into atlas_people.m10_succession_successors (id, tenant_id, critical_role_id, successor_id, readiness, ranking, notes, added_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', cr.id, v.cand::uuid, v.rd::atlas_people.m10_succession_readiness, v.rk, v.notes, now()
from (values
 ('CTO','e1000001-0000-0000-0000-000000000008','ready_18m',1,'Formation Leadership Excellence | Mentorat avec CTO | Lead projet stratégique cross-département'),
 ('CTO','e1000001-0000-0000-0000-000000000010','ready_3y',2,'Programme Next Managers | Première équipe à manager'),
 ('CFO','e1000001-0000-0000-0000-000000000006','ready_18m',1,'MBA Executive | Mission transverse direction'),
 ('DRH','e1000001-0000-0000-0000-000000000007','ready_18m',2,'Formation HRBP Senior | Coaching exécutif'),
 ('DRH','e1000001-0000-0000-0000-000000000003','ready_now',1,'Plan de prise de fonction (DRH adjoint déjà)'),
 ('Director Sales','e1000001-0000-0000-0000-000000000011','ready_now',1,'Prise de fonction Q4 2026'),
 ('Director Sales','e1000001-0000-0000-0000-000000000013','ready_18m',2,'Mentor : Director Sales'),
 ('Director Sales','e1000001-0000-0000-0000-000000000004','ready_3y',3,'Programme Global Mobility'),
 ('Head of Product','e1000001-0000-0000-0000-000000000005','ready_18m',1,'Programme Leadership Excellence'),
 ('DevOps Lead','e1000001-0000-0000-0000-000000000010','ready_18m',2,'Formation SRE avancée'),
 ('DevOps Lead','e1000001-0000-0000-0000-000000000002','ready_now',1,'Backup CTO/DevOps Lead'),
 ('Office / Ops Manager','e1000001-0000-0000-0000-000000000012','ready_18m',1,'Formation Lean Six Sigma')
) as v(role,cand,rd,rk,notes)
join atlas_people.m10_critical_roles cr on cr.role_label = v.role and cr.tenant_id='11111111-1111-1111-1111-111111111111';

insert into atlas_people.m10_talent_pool_memberships (id, tenant_id, pool_id, employee_id, joined_at)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', p.id, v.emp::uuid, v.joined::date
from (values
 ('e1000001-0000-0000-0000-000000000008','FUTURS_LEADERS','2026-01-15'),
 ('e1000001-0000-0000-0000-000000000011','HIPO','2026-02-01'),
 ('e1000001-0000-0000-0000-000000000005','FUTURS_LEADERS','2026-03-10'),
 ('e1000001-0000-0000-0000-000000000010','EXPERTS','2026-01-20'),
 ('e1000001-0000-0000-0000-000000000006','HIPO','2026-04-01'),
 ('e1000001-0000-0000-0000-000000000014','FUTURS_LEADERS','2026-03-15')
) as v(emp,pool,joined)
join atlas_people.m10_talent_pools p on p.code = v.pool::atlas_people.m10_pool_code and p.tenant_id='11111111-1111-1111-1111-111111111111';

insert into atlas_people.m10_mentorat_pairs (id, tenant_id, program_id, mentor_id, mentee_id, focus, started_at, status, sessions_held)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-0000-0000-0010-410000000001'::uuid, v.mentor::uuid, v.mentee::uuid, v.focus, v.started::date, 'active'::atlas_people.m10_mentorat_status, v.sess
from (values
 ('e1000001-0000-0000-0000-000000000002','e1000001-0000-0000-0000-000000000008','Leadership','2026-01-15',5),
 ('e1000001-0000-0000-0000-000000000004','e1000001-0000-0000-0000-000000000011','Premier rôle managérial','2026-02-01',4),
 ('e1000001-0000-0000-0000-000000000001','e1000001-0000-0000-0000-000000000005','Leadership','2026-03-10',3),
 ('e1000001-0000-0000-0000-000000000002','e1000001-0000-0000-0000-000000000010','Expertise technique','2026-01-20',5),
 ('e1000001-0000-0000-0000-000000000001','e1000001-0000-0000-0000-000000000006','Premier rôle managérial','2026-04-01',2),
 ('e1000001-0000-0000-0000-000000000001','e1000001-0000-0000-0000-000000000014','Leadership','2026-03-15',3)
) as v(mentor,mentee,focus,started,sess);
