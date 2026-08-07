-- Seed M5 Recrutement (tenant démo) — généré depuis src/lib/m5/mock.ts. Idempotent (upsert par ref/anon_ref).

insert into atlas_people.m5_jobs (id, tenant_id, ref, title, department, location, country_code, contract_type, level, salary_range_min, salary_range_max, status, opened_at, closed_at, target_close_at, hiring_manager_id, recruiter_id, summary, responsibilities, requirements, perks, published_channels, applications_count, remote_allowed, cooptation_bonus)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', v.ref, v.title, v.department, v.location, v.cc, v.ct::atlas_people.m5_contract_type, v.lvl::atlas_people.m5_job_level, v.smin, v.smax, v.status::atlas_people.m5_job_status, v.opened::timestamptz, v.closed::timestamptz, v.target::date, v.hm::uuid, v.rec::uuid, v.summary, v.resp, v.req, v.perks, v.channels, v.appc, v.remote, v.coopt
from (values
 ('JOB-2026-0001','Senior Backend Engineer (Node/Go)','Technologie','Plateau Innovation, Abidjan','CI','CDI','senior',1400000,1900000,'open','2026-04-12',null,'2026-06-30','e1000001-0000-0000-0000-000000000002','e1000001-0000-0000-0000-000000000007','Renforcement de l''équipe back-end · architecture distribuée · scale Atlas Studio',array['Concevoir et faire évoluer les services backend','Participer aux revues d''architecture','Coacher les juniors','Astreintes ponctuelles']::text[],array['5+ ans Node.js / Go','Postgres avancé','Distribué (queues, caches)','Anglais professionnel']::text[],array['Télétravail 2 j/sem','Formation 5 % du salaire','Mutuelle premium','Coopération internationale']::text[],array['LINKEDIN','WTTJ','EMPLOI_CI','COOPTATION']::text[],47,true,350000),
 ('JOB-2026-0002','Product Designer Senior','Technologie','Plateau Innovation, Abidjan','CI','CDI','senior',1100000,1500000,'open','2026-04-25',null,'2026-07-15','e1000001-0000-0000-0000-000000000005','e1000001-0000-0000-0000-000000000007','Designer produit confirmé pour piloter le design system Atlas',array['Piloter design system','UX research / wireframes','Prototypage haute fidélité','Collaborer Engineering']::text[],array['5+ ans en SaaS','Figma expert','UX research méthodes','Portfolio solide']::text[],array['Télétravail 2 j/sem','Conférences design','Hardware premium']::text[],array['LINKEDIN','WTTJ','COOPTATION']::text[],28,true,300000),
 ('JOB-2026-0003','Commercial Comptes Stratégiques','Ventes','Marcory, Abidjan','CI','CDI','senior',900000,1300000,'open','2026-05-02',null,'2026-07-30','e1000001-0000-0000-0000-000000000004','e1000001-0000-0000-0000-000000000007','Account Executive pour clients Tier 1 UEMOA · objectif 800M FCFA pipeline',array['Gestion grands comptes','Pipeline et closing','Présentations C-level','Voyages UEMOA']::text[],array['7+ ans BtoB SaaS','Réseau Afrique francophone','Anglais courant','Permis B']::text[],array['Commissions déplafonnées','Véhicule de fonction','Mutuelle premium']::text[],array['LINKEDIN','COOPTATION','AGENCY_LOCAL']::text[],19,false,500000),
 ('JOB-2026-0004','Chargé(e) de paie SN','Finance','Dakar Plateau','SN','CDI','confirme',750000,1000000,'open','2026-05-08',null,'2026-07-22','e1000001-0000-0000-0000-000000000003','e1000001-0000-0000-0000-000000000007','Production paie filiale Sénégal · 60 paies / mois · CCN Commerce SN',array['Saisie variables paie','Génération bulletins','DSN équivalents IPRES','Réponses collaborateurs']::text[],array['3+ ans paie Sénégal','CCN Commerce SN','Sage Paie ou équivalent']::text[],array['Mutuelle','Tickets restaurant','Formation FDFP']::text[],array['LINKEDIN','SENJOB','ANPE_LIKE']::text[],14,false,200000),
 ('JOB-2026-0005','Data Engineer','Technologie','Plateau Innovation, Abidjan','CI','CDI','confirme',1100000,1500000,'on_hold','2026-03-20',null,'2026-06-01','e1000001-0000-0000-0000-000000000002','e1000001-0000-0000-0000-000000000007','Pipeline data Atlas — temporairement en pause (validation budget)',array['Pipelines Airflow/Spark','Modélisation data warehouse','Qualité données']::text[],array['3+ ans data engineering','Python / SQL avancé','Cloud (GCP ou AWS)']::text[],array['Télétravail 2 j','Mutuelle premium']::text[],array['LINKEDIN']::text[],22,true,null),
 ('JOB-2026-0006','DRH Adjoint(e)','Ressources Humaines','Direction Générale Cocody','CI','CDI','manager',1600000,2200000,'draft','2026-05-25',null,null,'e1000001-0000-0000-0000-000000000001','e1000001-0000-0000-0000-000000000007','Bras droit DRH · pilotage paie/admin RH/disciplinaire',array['Pilotage opérationnel équipe RH','Conformité OHADA','Relations sociales']::text[],array['10+ ans RH','Maîtrise OHADA','Master RH ou Droit social']::text[],array['Package complet','Bonus annuel']::text[],'{}'::text[],0,false,null),
 ('JOB-2026-0007','Office Manager (remplacement congé mat.)','Opérations','Dakar Plateau','SN','CDD','confirme',480000,600000,'closed_filled','2026-02-10','2026-04-15','2026-04-15','e1000001-0000-0000-0000-000000000003','e1000001-0000-0000-0000-000000000007','CDD 8 mois remplacement Khady Ndiaye (congé maternité)',array['Coordination bureau Dakar','Achats fournitures','Accueil']::text[],array['2+ ans office management','Bilingue FR/EN']::text[],array['Tickets restaurant']::text[],array['LINKEDIN','SENJOB']::text[],36,false,null),
 ('JOB-2026-0008','Stagiaire Marketing Digital','Ventes','Plateau Innovation, Abidjan','CI','STAGE','junior',120000,150000,'open','2026-05-15',null,'2026-06-30','e1000001-0000-0000-0000-000000000013','e1000001-0000-0000-0000-000000000007','Stage 6 mois · contenu, growth, SEO',array['Création contenus social media','SEO articles blog','Reporting Google Analytics']::text[],array['Bac+3 marketing / digital','Curiosité, écriture','Adobe ou Figma']::text[],array['Indemnité de stage','Coopté CDI possible']::text[],array['INPHB','ESATIC','CAREER_SITE']::text[],52,false,null)
) as v(ref,title,department,location,cc,ct,lvl,smin,smax,status,opened,closed,target,hm,rec,summary,resp,req,perks,channels,appc,remote,coopt)
where not exists (select 1 from atlas_people.m5_jobs x where x.ref = v.ref);

insert into atlas_people.m5_candidates (id, tenant_id, anon_ref, first_name, last_name, email, current_role_label, current_company, location, country_code, expected_salary_min, expected_salary_max, availability, years_experience, skills, tags, source, referrer_employee_id, rgpd_consent, rgpd_consent_at, rgpd_retention_until)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', v.aref, v.fn, v.ln, v.email, v.role, v.company, v.location, v.cc, v.smin, v.smax, v.avail, v.yexp, v.skills, v.tags, v.source, v.refemp::uuid, v.consent, v.consat::timestamptz, v.retuntil::date
from (values
 ('CDT-2026-0001','Aïcha','Bamba','aïcha.bamba@mail.demo','Senior Backend','Wave','Abidjan','CI',1280000,1700000,'2 mois (préavis)',6,array['Node.js','TypeScript','PostgreSQL','Redis','AWS']::text[],array['top-tier']::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0002','Ousmane','Tall','ousmane.tall@mail.demo','Lead Backend','Orange CI','Abidjan','CI',1440000,1900000,'2 mois (préavis)',8,array['Go','Kafka','gRPC','Kubernetes']::text[],array['cooptation']::text[],'COOPTATION','e1000001-0000-0000-0000-000000000002',true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0003','Émilie','Kouassi','émilie.kouassi@mail.demo','Senior Engineer','Jumia','Abidjan','CI',1200000,1600000,'2 mois (préavis)',5,array['Node.js','NestJS','TypeORM','GCP']::text[],'{}'::text[],'WTTJ',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0004','Yannick','Kouadio','yannick.kouadio@mail.demo','Backend Engineer','MTN','Abidjan','CI',1120000,1500000,'1 mois',4,array['Java','Spring Boot','PostgreSQL']::text[],'{}'::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0005','Mariama','Sarr','mariama.sarr@mail.demo','Software Engineer','Yengo','Dakar','SN',1200000,1600000,'2 mois (préavis)',5,array['Node.js','TypeScript','MongoDB']::text[],'{}'::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0006','Hervé','Yapo','hervé.yapo@mail.demo','Tech Lead','Sama Money','Abidjan','CI',1520000,2000000,'2 mois (préavis)',9,array['Go','Distributed systems','AWS','Architecture']::text[],'{}'::text[],'AGENCY_LOCAL',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0007','Aminata','Diop','aminata.diop@mail.demo','Senior Designer','Wave','Dakar','SN',1280000,1700000,'2 mois (préavis)',6,array['Figma','Design systems','UX research']::text[],array['top-tier']::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0008','Pierre','Achiepo','pierre.achiepo@mail.demo','Product Designer','Jumia','Abidjan','CI',1120000,1500000,'1 mois',4,array['Figma','Prototyping','User testing']::text[],'{}'::text[],'WTTJ',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0009','Salimata','Touré','salimata.touré@mail.demo','UX Lead','Free Sénégal','Dakar','SN',1360000,1800000,'2 mois (préavis)',7,array['Design systems','UX strategy','Workshops']::text[],'{}'::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0010','Désiré','Bah','désiré.bah@mail.demo','UI/UX Designer','Onepoint','Abidjan','CI',1200000,1600000,'2 mois (préavis)',5,array['Figma','Webflow','Prototyping']::text[],'{}'::text[],'COOPTATION','e1000001-0000-0000-0000-000000000005',true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0011','Karim','Touré','karim.touré@mail.demo','Account Manager Senior','Orange B2B','Abidjan','CI',1440000,1900000,'2 mois (préavis)',8,array['BtoB SaaS','Closing','Comptes stratégiques']::text[],'{}'::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0012','Sylvie','N''Guessan','sylvie.n''guessan@mail.demo','Sales Manager','Atlantique Bank','Abidjan','CI',1520000,2000000,'2 mois (préavis)',9,array['BtoB','Banque','Closing C-level']::text[],'{}'::text[],'AGENCY_LOCAL',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0013','Adama','Coulibaly','adama.coulibaly@mail.demo','Key Account Director','Société Générale','Abidjan','CI',1680000,2200000,'2 mois (préavis)',11,array['Grands comptes','Pipeline','CRM Salesforce']::text[],array['top-tier']::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0014','Mireille','Konaté','mireille.konaté@mail.demo','Account Executive','Wave','Bamako','ML',1280000,1700000,'2 mois (préavis)',6,array['SaaS','PME','Closing']::text[],'{}'::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0015','Awa','Ndour','awa.ndour@mail.demo','Gestionnaire paie','Sonatel','Dakar','SN',1120000,1500000,'1 mois',4,array['Sage Paie','IPRES','CSS']::text[],'{}'::text[],'SENJOB',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0016','Modibo','Sow','modibo.sow@mail.demo','Payroll Specialist','Diamond Bank','Dakar','SN',1200000,1600000,'2 mois (préavis)',5,array['Paie SN','IPRES','DSN']::text[],'{}'::text[],'ANPE_LIKE',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0017','Fatim','Faye','fatim.faye@mail.demo','Chargée paie','Free','Dakar','SN',1040000,1400000,'1 mois',3,array['Paie multi-pays','Sage','Excel avancé']::text[],'{}'::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0018','Ange','Tagro','ange.tagro@mail.demo','Étudiante M2 Marketing','INP-HB','Abidjan','CI',800000,1100000,'1 mois',0,array['Social media','SEO','Canva']::text[],'{}'::text[],'INPHB',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0019','Brice','Konan','brice.konan@mail.demo','Étudiant Bac+4','ESATIC','Abidjan','CI',800000,1100000,'1 mois',0,array['Adobe','Vidéo','Copywriting']::text[],'{}'::text[],'ESATIC',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0020','Aurélie','Adou','aurélie.adou@mail.demo','Stagiaire fin d''études','INP-HB','Abidjan','CI',800000,1100000,'1 mois',0,array['SEO','Google Analytics','WordPress']::text[],'{}'::text[],'INPHB',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0021','Aboubacar','Sidibé','aboubacar.sidibé@mail.demo','Étudiant marketing digital','Atlantique UNI','Abidjan','CI',800000,1100000,'1 mois',0,array['Social ads','Figma']::text[],'{}'::text[],'CAREER_SITE',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0022','Khadija','Diallo','khadija.diallo@mail.demo','Office Manager','KPMG','Dakar','SN',1200000,1600000,'2 mois (préavis)',5,array['Coordination','Achats','Bilingue']::text[],array['hired']::text[],'SENJOB',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0023','Astou','Sène','astou.sène@mail.demo','Assistante direction','Sonatel','Dakar','SN',1120000,1500000,'1 mois',4,array['Administration','EN']::text[],'{}'::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0024','Cheikh','Mbaye','cheikh.mbaye@mail.demo','Office Coordinator','Wave','Dakar','SN',1040000,1400000,'1 mois',3,array['Office','Bilingue']::text[],'{}'::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0025','Bakary','Camara','bakary.camara@mail.demo','Data Engineer','BCEAO','Abidjan','CI',1120000,1500000,'1 mois',4,array['Python','Airflow','BigQuery']::text[],'{}'::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0026','Aïssata','Soumah','aïssata.soumah@mail.demo','Data Engineer','Jumia','Abidjan','CI',1040000,1400000,'1 mois',3,array['Spark','Snowflake','dbt']::text[],'{}'::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0027','Rahmatou','Barry','rahmatou.barry@mail.demo','Senior PM','Ecobank','Abidjan','CI',1440000,1900000,'2 mois (préavis)',8,array['Product','Stratégie','Scrum']::text[],array['vivier-future-leaders']::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0028','Joël','Boudou','joël.boudou@mail.demo','CTO','Healthtech','Abidjan','CI',1760000,2300000,'2 mois (préavis)',12,array['Tech leadership','Architecture']::text[],array['vivier-top-tech']::text[],'COOPTATION','e1000001-0000-0000-0000-000000000001',true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0029','Maïmouna','Niang','maïmouna.niang@mail.demo','Head of People','Yengo','Dakar','SN',1520000,2000000,'2 mois (préavis)',9,array['RH stratégie','Internationale']::text[],array['vivier-future-leaders']::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0030','Christian','N''Guessan','christian.n''guessan@mail.demo','Designer Lead','Vodacom','Abidjan','CI',1440000,1900000,'2 mois (préavis)',8,array['Design systems','Leadership']::text[],array['vivier-design']::text[],'WTTJ',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0031','Sophie','Adjéi','sophie.adjéi@mail.demo','Marketing Director','Total','Abidjan','CI',1600000,2100000,'2 mois (préavis)',10,array['B2B Marketing','Stratégie']::text[],array['vivier-future-leaders']::text[],'LINKEDIN',null,true,'2026-04-10','2028-04-10'),
 ('CDT-2026-0032','Ibrahima','Ba','ibrahima.ba@mail.demo','CFO','Fintech YC','Dakar','SN',1920000,2500000,'2 mois (préavis)',14,array['Finance','Fundraising']::text[],array['vivier-c-level']::text[],'COOPTATION','e1000001-0000-0000-0000-000000000001',true,'2026-04-10','2028-04-10')
) as v(aref,fn,ln,email,role,company,location,cc,smin,smax,avail,yexp,skills,tags,source,refemp,consent,consat,retuntil)
where not exists (select 1 from atlas_people.m5_candidates x where x.anon_ref = v.aref);

insert into atlas_people.m5_applications (id, tenant_id, ref, candidate_id, job_id, stage, stage_entered_at, applied_at, score, last_activity_at, rejection_reason_code)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', v.ref, c.id, j.id, v.stage::atlas_people.m5_app_stage, v.entered::timestamptz, v.applied::timestamptz, v.score, v.lastact::timestamptz, v.rej
from (values
 ('APP-2026-0001','CDT-2026-0001','JOB-2026-0001','interview','2026-05-22','2026-05-06',85,'2026-05-23',null),
 ('APP-2026-0002','CDT-2026-0002','JOB-2026-0001','offer','2026-05-27','2026-05-21',92,'2026-05-28',null),
 ('APP-2026-0003','CDT-2026-0003','JOB-2026-0001','screening','2026-05-18','2026-04-24',72,'2026-05-19',null),
 ('APP-2026-0004','CDT-2026-0004','JOB-2026-0001','applied','2026-05-28','2026-05-24',64,'2026-05-29',null),
 ('APP-2026-0005','CDT-2026-0005','JOB-2026-0001','rejected','2026-05-10','2026-03-31',58,'2026-05-11','EXPERIENCE'),
 ('APP-2026-0006','CDT-2026-0006','JOB-2026-0001','interview','2026-05-24','2026-05-12',88,'2026-05-25',null),
 ('APP-2026-0007','CDT-2026-0007','JOB-2026-0002','assessment','2026-05-25','2026-05-15',90,'2026-05-26',null),
 ('APP-2026-0008','CDT-2026-0008','JOB-2026-0002','interview','2026-05-20','2026-04-30',75,'2026-05-21',null),
 ('APP-2026-0009','CDT-2026-0009','JOB-2026-0002','offer','2026-05-28','2026-05-24',88,'2026-05-29',null),
 ('APP-2026-0010','CDT-2026-0010','JOB-2026-0002','screening','2026-05-24','2026-05-12',70,'2026-05-25',null),
 ('APP-2026-0011','CDT-2026-0011','JOB-2026-0003','interview','2026-05-21','2026-05-03',82,'2026-05-22',null),
 ('APP-2026-0012','CDT-2026-0012','JOB-2026-0003','screening','2026-05-26','2026-05-18',78,'2026-05-27',null),
 ('APP-2026-0013','CDT-2026-0013','JOB-2026-0003','assessment','2026-05-23','2026-05-09',91,'2026-05-24',null),
 ('APP-2026-0014','CDT-2026-0014','JOB-2026-0003','applied','2026-05-29','2026-05-27',65,'2026-05-30',null),
 ('APP-2026-0015','CDT-2026-0015','JOB-2026-0004','interview','2026-05-25','2026-05-15',78,'2026-05-26',null),
 ('APP-2026-0016','CDT-2026-0016','JOB-2026-0004','screening','2026-05-27','2026-05-21',70,'2026-05-28',null),
 ('APP-2026-0017','CDT-2026-0017','JOB-2026-0004','applied','2026-05-29','2026-05-27',62,'2026-05-30',null),
 ('APP-2026-0018','CDT-2026-0025','JOB-2026-0005','sourced','2026-05-16','2026-04-18',68,'2026-05-17',null),
 ('APP-2026-0019','CDT-2026-0026','JOB-2026-0005','sourced','2026-05-20','2026-04-30',66,'2026-05-21',null),
 ('APP-2026-0020','CDT-2026-0022','JOB-2026-0007','hired','2026-04-15','2026-01-15',80,'2026-04-16',null),
 ('APP-2026-0021','CDT-2026-0023','JOB-2026-0007','rejected','2026-03-31','2025-12-01',65,'2026-04-01','CULTURE_FIT'),
 ('APP-2026-0022','CDT-2026-0024','JOB-2026-0007','rejected','2026-04-05','2025-12-16',62,'2026-04-06','OTHER_OFFER'),
 ('APP-2026-0023','CDT-2026-0018','JOB-2026-0008','interview','2026-05-26','2026-05-18',76,'2026-05-27',null),
 ('APP-2026-0024','CDT-2026-0019','JOB-2026-0008','applied','2026-05-29','2026-05-27',70,'2026-05-30',null),
 ('APP-2026-0025','CDT-2026-0020','JOB-2026-0008','screening','2026-05-27','2026-05-21',74,'2026-05-28',null),
 ('APP-2026-0026','CDT-2026-0021','JOB-2026-0008','applied','2026-05-29','2026-05-27',68,'2026-05-30',null)
) as v(ref,cand_ref,job_ref,stage,entered,applied,score,lastact,rej)
join atlas_people.m5_candidates c on c.anon_ref = v.cand_ref
join atlas_people.m5_jobs j on j.ref = v.job_ref
where not exists (select 1 from atlas_people.m5_applications x where x.ref = v.ref);

insert into atlas_people.m5_interviews (id, tenant_id, ref, application_id, type, mode, scheduled_at, duration_min, location, participants, status)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', v.ref, a.id, v.typ::atlas_people.m5_interview_type, v.mode::atlas_people.m5_interview_mode, v.sched::timestamptz, v.dur, v.location, v.parts::jsonb, v.status::atlas_people.m5_interview_status
from (values
 ('INT-2026-0001','APP-2026-0001','manager','visio','2026-05-30T04:00:00.000Z',60,'Google Meet','[{"employeeId":"e1000001-0000-0000-0000-000000000007","role":"Recruteur"},{"employeeId":"e1000001-0000-0000-0000-000000000002","role":"Hiring manager"}]','planned'),
 ('INT-2026-0002','APP-2026-0006','tech','visio','2026-05-31T02:00:00.000Z',90,'Google Meet','[{"employeeId":"e1000001-0000-0000-0000-000000000007","role":"Recruteur"},{"employeeId":"e1000001-0000-0000-0000-000000000002","role":"Hiring manager"}]','planned'),
 ('INT-2026-0003','APP-2026-0008','team','visio','2026-06-01T02:00:00.000Z',45,'Google Meet','[{"employeeId":"e1000001-0000-0000-0000-000000000007","role":"Recruteur"},{"employeeId":"e1000001-0000-0000-0000-000000000002","role":"Hiring manager"}]','planned'),
 ('INT-2026-0004','APP-2026-0011','manager','visio','2026-05-31T04:00:00.000Z',60,'Google Meet','[{"employeeId":"e1000001-0000-0000-0000-000000000007","role":"Recruteur"},{"employeeId":"e1000001-0000-0000-0000-000000000002","role":"Hiring manager"}]','planned'),
 ('INT-2026-0005','APP-2026-0015','phone_screen','phone','2026-05-30T06:00:00.000Z',30,'Plateau Innovation','[{"employeeId":"e1000001-0000-0000-0000-000000000007","role":"Recruteur"},{"employeeId":"e1000001-0000-0000-0000-000000000002","role":"Hiring manager"}]','planned'),
 ('INT-2026-0006','APP-2026-0023','manager','visio','2026-06-02T00:00:00.000Z',60,'Google Meet','[{"employeeId":"e1000001-0000-0000-0000-000000000007","role":"Recruteur"},{"employeeId":"e1000001-0000-0000-0000-000000000002","role":"Hiring manager"}]','planned'),
 ('INT-2026-0007','APP-2026-0002','final','visio','2026-05-27T00:00:00.000Z',60,'Google Meet','[{"employeeId":"e1000001-0000-0000-0000-000000000007","role":"Recruteur"},{"employeeId":"e1000001-0000-0000-0000-000000000002","role":"Hiring manager"}]','completed'),
 ('INT-2026-0008','APP-2026-0002','tech','visio','2026-05-25T00:00:00.000Z',90,'Google Meet','[{"employeeId":"e1000001-0000-0000-0000-000000000007","role":"Recruteur"},{"employeeId":"e1000001-0000-0000-0000-000000000002","role":"Hiring manager"}]','completed'),
 ('INT-2026-0009','APP-2026-0001','phone_screen','visio','2026-05-23T08:00:00.000Z',30,'Google Meet','[{"employeeId":"e1000001-0000-0000-0000-000000000007","role":"Recruteur"},{"employeeId":"e1000001-0000-0000-0000-000000000002","role":"Hiring manager"}]','completed'),
 ('INT-2026-0010','APP-2026-0007','tech','visio','2026-05-28T00:00:00.000Z',90,'Google Meet','[{"employeeId":"e1000001-0000-0000-0000-000000000007","role":"Recruteur"},{"employeeId":"e1000001-0000-0000-0000-000000000002","role":"Hiring manager"}]','completed'),
 ('INT-2026-0011','APP-2026-0009','final','visio','2026-05-29T00:00:00.000Z',60,'Google Meet','[{"employeeId":"e1000001-0000-0000-0000-000000000007","role":"Recruteur"},{"employeeId":"e1000001-0000-0000-0000-000000000002","role":"Hiring manager"}]','completed'),
 ('INT-2026-0012','APP-2026-0013','culture','visio','2026-05-26T00:00:00.000Z',45,'Google Meet','[{"employeeId":"e1000001-0000-0000-0000-000000000007","role":"Recruteur"},{"employeeId":"e1000001-0000-0000-0000-000000000002","role":"Hiring manager"}]','completed'),
 ('INT-2026-0013','APP-2026-0004','phone_screen','visio','2026-05-21T16:00:00.000Z',30,'Google Meet','[{"employeeId":"e1000001-0000-0000-0000-000000000007","role":"Recruteur"},{"employeeId":"e1000001-0000-0000-0000-000000000002","role":"Hiring manager"}]','no_show')
) as v(ref,app_ref,typ,mode,sched,dur,location,parts,status)
join atlas_people.m5_applications a on a.ref = v.app_ref
where not exists (select 1 from atlas_people.m5_interviews x where x.ref = v.ref);

insert into atlas_people.m5_offers (id, tenant_id, ref, application_id, status, contract_type, base_salary, allowances_total, total_package, start_date, draft_at, sent_at, accepted_at, declined_at, declined_reason, valid_until, signature_workflow)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', v.ref, a.id, v.status::atlas_people.m5_offer_status, v.ct::atlas_people.m5_contract_type, v.base, v.allow, v.pkg, v.start::date, v.draft::timestamptz, v.sent::timestamptz, v.acc::timestamptz, v.dec::timestamptz, v.decr, v.valid::date, v.sig
from (values
 ('OFF-2026-0001','APP-2026-0002','sent','CDI',1750000,250000,24000000,'2026-08-01','2026-05-25','2026-05-27',null,null,null,'2026-06-10','advist_employee_pending'),
 ('OFF-2026-0002','APP-2026-0009','negotiating','CDI',1400000,150000,18600000,'2026-07-15','2026-05-22','2026-05-24',null,null,null,'2026-06-07',null),
 ('OFF-2025-0042','APP-2026-0020','accepted','CDD',560000,80000,5120000,'2026-04-15','2026-04-05','2026-04-07','2026-04-09',null,null,'2026-04-20','advist_signed_both')
) as v(ref,app_ref,status,ct,base,allow,pkg,start,draft,sent,acc,dec,decr,valid,sig)
join atlas_people.m5_applications a on a.ref = v.app_ref
where not exists (select 1 from atlas_people.m5_offers x where x.ref = v.ref);

insert into atlas_people.m5_referrals (id, tenant_id, ref, referrer_employee_id, candidate_id, job_id, status, submitted_at, bonus_amount)
select gen_random_uuid(), '11111111-1111-1111-1111-111111111111', v.ref, v.refer::uuid, c.id, j.id, v.status::atlas_people.m5_referral_status, v.sub::timestamptz, v.bonus
from (values
 ('REF-2026-001','e1000001-0000-0000-0000-000000000002','CDT-2026-0002','JOB-2026-0001','in_pipeline','2026-04-20',350000),
 ('REF-2026-002','e1000001-0000-0000-0000-000000000005','CDT-2026-0010','JOB-2026-0002','in_pipeline','2026-05-05',300000),
 ('REF-2026-003','e1000001-0000-0000-0000-000000000001','CDT-2026-0028','JOB-2026-0001','submitted','2026-05-15',350000),
 ('REF-2025-014','e1000001-0000-0000-0000-000000000001','CDT-2026-0032','JOB-2026-0006','submitted','2026-05-28',600000)
) as v(ref,refer,cand_ref,job_ref,status,sub,bonus)
join atlas_people.m5_candidates c on c.anon_ref = v.cand_ref
join atlas_people.m5_jobs j on j.ref = v.job_ref
where not exists (select 1 from atlas_people.m5_referrals x where x.ref = v.ref);
