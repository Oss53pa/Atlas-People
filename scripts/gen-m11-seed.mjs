// Génère supabase/seeds/m11_formation_seed.sql depuis les datasets mock M11.
// Usage : npx tsx scripts/gen-m11-seed.mjs
// Format compact : un INSERT multi-lignes par table ; les FK (course/plan/session)
// sont résolues PAR REF via jointure, robustes face aux lignes déjà en DB.
import { COURSES, PLANS, SESSIONS, REGISTRATIONS, CERTIFICATIONS, FDFP_DECLARATIONS } from '../src/lib/m11/mock.ts';
import { writeFileSync } from 'node:fs';

const TENANT = '11111111-1111-1111-1111-111111111111';
const emp = (eid) => eid == null ? null : `e1000001-0000-0000-0000-${String(parseInt(String(eid).slice(1), 10)).padStart(12, '0')}`;
const q = (s) => s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`;
const qn = (n) => n == null ? 'null' : String(n);
const arr = (a) => a && a.length ? `array[${a.map(q).join(',')}]::text[]` : `'{}'::text[]`;
const js = (v) => v == null ? `'[]'::jsonb` : `${q(JSON.stringify(v))}`;
const courseRefOf = new Map(COURSES.map((c) => [c.id, c.ref]));
const sessionRefOf = new Map(SESSIONS.map((s) => [s.id, s.ref]));
const PLAN_REF = PLANS[0].ref;

let sql = `-- Seed M11 Formation (tenant démo) — généré depuis src/lib/m11/mock.ts. Idempotent (upsert par ref).\n\n`;

// ── Courses
sql += `insert into atlas_people.m11_courses (id, tenant_id, ref, title, modality, provider, provider_name, category, level, language, duration_hours, cost_per_head, cost_per_session, min_participants, max_participants, summary, objectives, prerequisites, certification_code, fdfp_eligible, status, kirkpatrick_levels, tags)
select gen_random_uuid(), '${TENANT}', v.ref, v.title, v.modality::atlas_people.m11_modality, v.provider::atlas_people.m11_provider, v.provider_name, v.category::atlas_people.m11_category, v.level::atlas_people.m11_level, v.language, v.dh, v.cph, v.cps, v.minp, v.maxp, v.summary, v.objectives::jsonb, v.prereq, v.cert, v.fdfp, v.status::atlas_people.m11_course_status, v.kirk, v.tags
from (values\n${COURSES.map((c) => ` (${q(c.ref)},${q(c.title)},${q(c.modality)},${q(c.provider)},${q(c.providerName)},${q(c.category)},${q(c.level)},${q(c.language)},${qn(c.durationHours)},${qn(c.costPerHead)},${qn(c.costPerSession)},${qn(c.minParticipants)},${qn(c.maxParticipants)},${q(c.summary)},${js(c.objectives)},${arr(c.prerequisites)},${q(c.certificationCode)},${!!c.fdfpEligible},${q(c.status)},${qn(c.kirkpatrickLevels)},${arr(c.tags)})`).join(',\n')}
) as v(ref,title,modality,provider,provider_name,category,level,language,dh,cph,cps,minp,maxp,summary,objectives,prereq,cert,fdfp,status,kirk,tags)
where not exists (select 1 from atlas_people.m11_courses c where c.ref = v.ref);\n\n`;

// ── Plan + items
const p = PLANS[0];
sql += `insert into atlas_people.m11_training_plans (id, tenant_id, ref, year, scope, scope_label, status, budget_envelope, budget_consumed, fdfp_rebate_forecast, beneficiaries_forecast, hours_forecast, created_by)
select gen_random_uuid(), '${TENANT}', ${q(p.ref)}, ${qn(p.year)}, ${q(p.scope)}, ${q(p.scopeLabel)}, ${q(p.status)}::atlas_people.m11_plan_status, ${qn(p.budgetEnvelope)}, ${qn(p.budgetConsumed)}, ${qn(p.fdfpRebateForecast)}, ${qn(p.beneficiariesForecast)}, ${qn(p.hoursForecast)}, ${q(emp(p.createdById))}::uuid
where not exists (select 1 from atlas_people.m11_training_plans where ref = ${q(p.ref)});\n\n`;

sql += `insert into atlas_people.m11_plan_items (id, tenant_id, plan_id, course_id, target_employee_ids, target_teams, origin, priority, forecast_quarter, forecast_cost, realised_cost, status, rationale)
select gen_random_uuid(), '${TENANT}', pl.id, c.id, v.emps::uuid[], v.teams, v.origin::atlas_people.m11_plan_origin, v.priority, v.fq, v.fc, v.rc, v.status::atlas_people.m11_plan_item_status, v.rationale
from (values\n${p.items.map((it) => ` (${q(courseRefOf.get(it.courseId) ?? it.courseId)},${(it.targetEmployeeIds ?? []).length ? `array[${it.targetEmployeeIds.map((e) => q(emp(e))).join(',')}]` : `'{}'`},${arr(it.targetTeams)},${q(it.origin)},${q(it.priority)},${q(it.forecastQuarter)},${qn(it.forecastCost)},${qn(it.realisedCost)},${q(it.status)},${q(it.rationale)})`).join(',\n')}
) as v(course_ref,emps,teams,origin,priority,fq,fc,rc,status,rationale)
join atlas_people.m11_courses c on c.ref = v.course_ref
join atlas_people.m11_training_plans pl on pl.ref = ${q(PLAN_REF)}
where not exists (select 1 from atlas_people.m11_plan_items pi2 where pi2.plan_id = pl.id and pi2.course_id = c.id and pi2.forecast_quarter = v.fq);\n\n`;

// ── Sessions
sql += `insert into atlas_people.m11_training_sessions (id, tenant_id, ref, course_id, plan_id, status, delivery_mode, location, meeting_url, trainers, days, total_hours, capacity, registered_count, waitlist_count, attended_count, completion_rate, average_score, average_reaction_score, cost_total, country_code, fdfp_declaration_ref)
select gen_random_uuid(), '${TENANT}', v.ref, c.id, (select id from atlas_people.m11_training_plans where ref = ${q(PLAN_REF)}), v.status::atlas_people.m11_session_status, v.dm::atlas_people.m11_delivery_mode, v.location, v.murl, v.trainers::jsonb, v.days::jsonb, v.th, v.cap, v.regc, v.waitc, v.attc, v.compl, v.score, v.react, v.cost, v.cc, v.fdfpref
from (values\n${SESSIONS.map((s) => {
  const trainers = (s.trainers ?? []).map((t) => ({ ...t, employeeId: t.employeeId ? emp(t.employeeId) : undefined }));
  return ` (${q(s.ref)},${q(courseRefOf.get(s.courseId) ?? s.courseId)},${q(s.status)},${q(s.deliveryMode)},${q(s.location)},${q(s.meetingUrl)},${js(trainers)},${js(s.days)},${qn(s.totalHours)},${qn(s.capacity)},${qn(s.registeredCount)},${qn(s.waitlistCount)},${qn(s.attendedCount)},${qn(s.completionRate)},${qn(s.averageScore)},${qn(s.averageReactionScore)},${qn(s.costTotal)},${q(s.countryCode)},${q(s.fdfpDeclarationRef)})`;
}).join(',\n')}
) as v(ref,course_ref,status,dm,location,murl,trainers,days,th,cap,regc,waitc,attc,compl,score,react,cost,cc,fdfpref)
join atlas_people.m11_courses c on c.ref = v.course_ref
where not exists (select 1 from atlas_people.m11_training_sessions s2 where s2.ref = v.ref);\n\n`;

// ── Registrations
sql += `insert into atlas_people.m11_registrations (id, tenant_id, ref, session_id, employee_id, status, requested_at, approved_at, approved_by, confirmed_at, attended_hours, learning_score, reaction_score, reaction_comment, cancelled_at, cancelled_reason, allocated_cost)
select gen_random_uuid(), '${TENANT}', v.ref, s.id, v.emp::uuid, v.status::atlas_people.m11_registration_status, v.req::timestamptz, v.app::timestamptz, v.appby::uuid, v.conf::timestamptz, v.ah, v.ls, v.rs, v.rcom, v.canc::timestamptz, v.creas, v.cost
from (values\n${(() => {
  // Le mock contient des refs dupliquées (REG-2026-0100..0103 et 0110..0113
  // réutilisées sur 2 sessions) — contrainte unique (tenant_id, ref) en DB :
  // on renumérote les doublons de façon déterministe (+300, répété si besoin).
  const seen = new Set();
  return REGISTRATIONS.map((r) => {
    let ref = r.ref;
    while (seen.has(ref)) ref = ref.replace(/(\d+)$/, (d) => String(Number(d) + 300).padStart(d.length, '0'));
    seen.add(ref);
    return ` (${q(ref)},${q(sessionRefOf.get(r.sessionId) ?? r.sessionId)},${q(emp(r.employeeId))},${q(r.status)},${q(r.requestedAt)},${q(r.approvedAt)},${q(emp(r.approvedById))},${q(r.confirmedAt)},${qn(r.attendedHours)},${qn(r.learningScore)},${qn(r.reactionScore)},${q(r.reactionComment)},${q(r.cancelledAt)},${q(r.cancelledReason)},${qn(r.allocatedCost)})`;
  }).join(',\n');
})()}
) as v(ref,session_ref,emp,status,req,app,appby,conf,ah,ls,rs,rcom,canc,creas,cost)
join atlas_people.m11_training_sessions s on s.ref = v.session_ref
where not exists (select 1 from atlas_people.m11_registrations r2 where r2.ref = v.ref);\n\n`;

// ── Certifications + FDFP
sql += `insert into atlas_people.m11_certifications (id, tenant_id, ref, employee_id, course_id, certificate_code, issued_at, expires_at, issuer, status, pdf_url, validated_by)
select gen_random_uuid(), '${TENANT}', v.ref, v.emp::uuid, c.id, v.code, v.iss::date, v.exp::date, v.issuer, v.status::atlas_people.m11_certification_status, v.pdf, v.valby::uuid
from (values\n${CERTIFICATIONS.map((c) => ` (${q(c.ref)},${q(emp(c.employeeId))},${q(courseRefOf.get(c.courseId) ?? c.courseId)},${q(c.certificateCode)},${q(c.issuedAt)},${q(c.expiresAt)},${q(c.issuer)},${q(c.status)},${q(c.pdfUrl)},${q(emp(c.validatedById))})`).join(',\n')}
) as v(ref,emp,course_ref,code,iss,exp,issuer,status,pdf,valby)
join atlas_people.m11_courses c on c.ref = v.course_ref
where not exists (select 1 from atlas_people.m11_certifications c2 where c2.ref = v.ref);\n\n`;

sql += `insert into atlas_people.m11_fdfp_declarations (id, tenant_id, ref, country_code, year, quarter, status, sessions_count, hours_total, beneficiaries_count, cost_declared, rebate_expected, rebate_received, submitted_at, reimbursed_at, rejection_reason)
select gen_random_uuid(), '${TENANT}', v.ref, v.cc, v.yr, v.qt, v.status::atlas_people.m11_fdfp_status, v.sc, v.ht, v.bc, v.cd, v.re, v.rr, v.sub::timestamptz, v.reimb::timestamptz, v.rej
from (values\n${FDFP_DECLARATIONS.map((f) => ` (${q(f.ref)},${q(f.countryCode)},${qn(f.year)},${qn(f.quarter)},${q(f.status)},${qn(f.sessionsCount)},${qn(f.hoursTotal)},${qn(f.beneficiariesCount)},${qn(f.costDeclared)},${qn(f.rebateExpected)},${qn(f.rebateReceived)},${q(f.submittedAt)},${q(f.reimbursedAt)},${q(f.rejectionReason)})`).join(',\n')}
) as v(ref,cc,yr,qt,status,sc,ht,bc,cd,re,rr,sub,reimb,rej)
where not exists (select 1 from atlas_people.m11_fdfp_declarations f2 where f2.ref = v.ref);\n`;

writeFileSync(new URL('../supabase/seeds/m11_formation_seed.sql', import.meta.url), sql);
console.log(`OK — courses=${COURSES.length} items=${p.items.length} sessions=${SESSIONS.length} registrations=${REGISTRATIONS.length} certs=${CERTIFICATIONS.length} fdfp=${FDFP_DECLARATIONS.length}`);
