// Génère supabase/seeds/m5_recrutement_seed.sql depuis les datasets mock M5.
// Usage : npx tsx scripts/gen-m5-seed.mjs
// Format compact (1 INSERT multi-lignes par table), FK résolues par ref/anon_ref.
import { JOBS, CANDIDATES, APPLICATIONS, INTERVIEWS, OFFERS, REFERRALS } from '../src/lib/m5/mock.ts';
import { writeFileSync } from 'node:fs';

const TENANT = '11111111-1111-1111-1111-111111111111';
const emp = (eid) => eid == null ? null : `e1000001-0000-0000-0000-${String(parseInt(String(eid).slice(1), 10)).padStart(12, '0')}`;
const q = (s) => s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`;
const qn = (n) => n == null ? 'null' : String(n);
const arr = (a) => a && a.length ? `array[${a.map(q).join(',')}]::text[]` : `'{}'::text[]`;
const js = (v) => v == null ? `'[]'::jsonb` : `${q(JSON.stringify(v))}`;
const jobRefOf = new Map(JOBS.map((j) => [j.id, j.ref]));
const candRefOf = new Map(CANDIDATES.map((c) => [c.id, c.anonRef]));
const appRefOf = new Map(APPLICATIONS.map((a) => [a.id, a.ref]));

let sql = `-- Seed M5 Recrutement (tenant démo) — généré depuis src/lib/m5/mock.ts. Idempotent (upsert par ref/anon_ref).\n\n`;

sql += `insert into atlas_people.m5_jobs (id, tenant_id, ref, title, department, location, country_code, contract_type, level, salary_range_min, salary_range_max, status, opened_at, closed_at, target_close_at, hiring_manager_id, recruiter_id, summary, responsibilities, requirements, perks, published_channels, applications_count, remote_allowed, cooptation_bonus)
select gen_random_uuid(), '${TENANT}', v.ref, v.title, v.department, v.location, v.cc, v.ct::atlas_people.m5_contract_type, v.lvl::atlas_people.m5_job_level, v.smin, v.smax, v.status::atlas_people.m5_job_status, v.opened::timestamptz, v.closed::timestamptz, v.target::date, v.hm::uuid, v.rec::uuid, v.summary, v.resp, v.req, v.perks, v.channels, v.appc, v.remote, v.coopt
from (values\n${JOBS.map((j) => ` (${q(j.ref)},${q(j.title)},${q(j.department)},${q(j.location)},${q(j.countryCode)},${q(j.contractType)},${q(j.level)},${qn(j.salaryRangeMin)},${qn(j.salaryRangeMax)},${q(j.status)},${q(j.openedAt)},${q(j.closedAt)},${q(j.targetCloseAt)},${q(emp(j.hiringManager))},${q(emp(j.recruiter))},${q(j.summary)},${arr(j.responsibilities)},${arr(j.requirements)},${arr(j.perks)},${arr(j.publishedChannels)},${qn(j.applicationsCount)},${!!j.remoteAllowed},${qn(j.cooptationBonus)})`).join(',\n')}
) as v(ref,title,department,location,cc,ct,lvl,smin,smax,status,opened,closed,target,hm,rec,summary,resp,req,perks,channels,appc,remote,coopt)
where not exists (select 1 from atlas_people.m5_jobs x where x.ref = v.ref);\n\n`;

sql += `insert into atlas_people.m5_candidates (id, tenant_id, anon_ref, first_name, last_name, email, current_role_label, current_company, location, country_code, expected_salary_min, expected_salary_max, availability, years_experience, skills, tags, source, referrer_employee_id, rgpd_consent, rgpd_consent_at, rgpd_retention_until)
select gen_random_uuid(), '${TENANT}', v.aref, v.fn, v.ln, v.email, v.role, v.company, v.location, v.cc, v.smin, v.smax, v.avail, v.yexp, v.skills, v.tags, v.source, v.refemp::uuid, v.consent, v.consat::timestamptz, v.retuntil::date
from (values\n${CANDIDATES.map((c) => ` (${q(c.anonRef)},${q(c.firstName)},${q(c.lastName)},${q(c.email)},${q(c.currentRole)},${q(c.currentCompany)},${q(c.location)},${q(c.countryCode)},${qn(c.expectedSalaryMin)},${qn(c.expectedSalaryMax)},${q(c.availability)},${qn(c.yearsExperience)},${arr(c.skills)},${arr(c.tags)},${q(c.source)},${q(emp(c.referrerEmployeeId))},${!!c.rgpdConsent},${q(c.rgpdConsentAt)},${q(c.rgpdRetentionUntil)})`).join(',\n')}
) as v(aref,fn,ln,email,role,company,location,cc,smin,smax,avail,yexp,skills,tags,source,refemp,consent,consat,retuntil)
where not exists (select 1 from atlas_people.m5_candidates x where x.anon_ref = v.aref);\n\n`;

sql += `insert into atlas_people.m5_applications (id, tenant_id, ref, candidate_id, job_id, stage, stage_entered_at, applied_at, score, last_activity_at, rejection_reason_code)
select gen_random_uuid(), '${TENANT}', v.ref, c.id, j.id, v.stage::atlas_people.m5_app_stage, v.entered::timestamptz, v.applied::timestamptz, v.score, v.lastact::timestamptz, v.rej
from (values\n${APPLICATIONS.map((a) => ` (${q(a.ref)},${q(candRefOf.get(a.candidateId) ?? a.candidateId)},${q(jobRefOf.get(a.jobId) ?? a.jobId)},${q(a.stage)},${q(a.stageEnteredAt)},${q(a.appliedAt)},${qn(a.score)},${q(a.lastActivityAt)},${q(a.rejectionReasonCode)})`).join(',\n')}
) as v(ref,cand_ref,job_ref,stage,entered,applied,score,lastact,rej)
join atlas_people.m5_candidates c on c.anon_ref = v.cand_ref
join atlas_people.m5_jobs j on j.ref = v.job_ref
where not exists (select 1 from atlas_people.m5_applications x where x.ref = v.ref);\n\n`;

sql += `insert into atlas_people.m5_interviews (id, tenant_id, ref, application_id, type, mode, scheduled_at, duration_min, location, participants, status)
select gen_random_uuid(), '${TENANT}', v.ref, a.id, v.typ::atlas_people.m5_interview_type, v.mode::atlas_people.m5_interview_mode, v.sched::timestamptz, v.dur, v.location, v.parts::jsonb, v.status::atlas_people.m5_interview_status
from (values\n${INTERVIEWS.map((i) => {
  const parts = (i.participants ?? []).map((p) => ({ ...p, employeeId: p.employeeId ? emp(p.employeeId) : undefined }));
  return ` (${q(i.ref)},${q(appRefOf.get(i.applicationId) ?? i.applicationId)},${q(i.type)},${q(i.mode)},${q(i.scheduledAt)},${qn(i.durationMin)},${q(i.location)},${js(parts)},${q(i.status)})`;
}).join(',\n')}
) as v(ref,app_ref,typ,mode,sched,dur,location,parts,status)
join atlas_people.m5_applications a on a.ref = v.app_ref
where not exists (select 1 from atlas_people.m5_interviews x where x.ref = v.ref);\n\n`;

sql += `insert into atlas_people.m5_offers (id, tenant_id, ref, application_id, status, contract_type, base_salary, allowances_total, total_package, start_date, draft_at, sent_at, accepted_at, declined_at, declined_reason, valid_until, signature_workflow)
select gen_random_uuid(), '${TENANT}', v.ref, a.id, v.status::atlas_people.m5_offer_status, v.ct::atlas_people.m5_contract_type, v.base, v.allow, v.pkg, v.start::date, v.draft::timestamptz, v.sent::timestamptz, v.acc::timestamptz, v.dec::timestamptz, v.decr, v.valid::date, v.sig
from (values\n${OFFERS.map((o) => ` (${q(o.ref)},${q(appRefOf.get(o.applicationId) ?? o.applicationId)},${q(o.status)},${q(o.contractType)},${qn(o.baseSalary)},${qn(o.allowancesTotal)},${qn(o.totalPackage)},${q(o.startDate)},${q(o.draftAt)},${q(o.sentAt)},${q(o.acceptedAt)},${q(o.declinedAt)},${q(o.declinedReason)},${q(o.validUntil)},${q(o.signatureWorkflow)})`).join(',\n')}
) as v(ref,app_ref,status,ct,base,allow,pkg,start,draft,sent,acc,dec,decr,valid,sig)
join atlas_people.m5_applications a on a.ref = v.app_ref
where not exists (select 1 from atlas_people.m5_offers x where x.ref = v.ref);\n\n`;

sql += `insert into atlas_people.m5_referrals (id, tenant_id, ref, referrer_employee_id, candidate_id, job_id, status, submitted_at, bonus_amount)
select gen_random_uuid(), '${TENANT}', v.ref, v.refer::uuid, c.id, j.id, v.status::atlas_people.m5_referral_status, v.sub::timestamptz, v.bonus
from (values\n${REFERRALS.map((r) => ` (${q(r.ref)},${q(emp(r.referrerEmployeeId))},${q(candRefOf.get(r.candidateId) ?? r.candidateId)},${q(jobRefOf.get(r.jobId) ?? r.jobId)},${q(r.status)},${q(r.submittedAt)},${qn(r.bonusAmount)})`).join(',\n')}
) as v(ref,refer,cand_ref,job_ref,status,sub,bonus)
join atlas_people.m5_candidates c on c.anon_ref = v.cand_ref
join atlas_people.m5_jobs j on j.ref = v.job_ref
where not exists (select 1 from atlas_people.m5_referrals x where x.ref = v.ref);\n`;

writeFileSync(new URL('../supabase/seeds/m5_recrutement_seed.sql', import.meta.url), sql);
console.log(`OK — jobs=${JOBS.length} candidates=${CANDIDATES.length} applications=${APPLICATIONS.length} interviews=${INTERVIEWS.length} offers=${OFFERS.length} referrals=${REFERRALS.length}`);
