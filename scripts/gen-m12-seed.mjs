// Génère supabase/seeds/m12_conformite_seed.sql depuis les datasets mock M12.
// Usage : npx tsx scripts/gen-m12-seed.mjs
import { RISKS, INCIDENTS, RPS_SURVEYS, DECLARATIONS, AUTHORIZATIONS } from '../src/lib/m12/mock.ts';
import { writeFileSync } from 'node:fs';

const TENANT = '11111111-1111-1111-1111-111111111111';
const uuid = (eid) => `e1000001-0000-0000-0000-${String(parseInt(eid.slice(1), 10)).padStart(12, '0')}`;
// Le mock calcule parfois mois+1 sans report (ex. « 2025-13-15 ») : on normalise.
const normDate = (s) => {
  if (s == null) return s;
  const m = /^(\d{4})-(\d{2})(-\d{2}.*)?$/.exec(String(s));
  if (!m) return s;
  let [y, mo] = [Number(m[1]), Number(m[2])];
  while (mo > 12) { mo -= 12; y += 1; }
  return `${y}-${String(mo).padStart(2, '0')}${m[3] ?? ''}`;
};
const q = (s) => s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`;
const arr = (a) => a && a.length ? `array[${a.map(q).join(',')}]::text[]` : `'{}'::text[]`;
const js = (v) => v == null ? `'[]'::jsonb` : `${q(JSON.stringify(v))}::jsonb`;

let sql = `-- Seed M12 Conformité & SST (tenant démo) — généré depuis src/lib/m12/mock.ts.\n-- Idempotent : upsert par ref.\n\n`;

for (const r of RISKS) {
  sql += `insert into atlas_people.m12_risks (id, tenant_id, ref, unite, country_code, category, hazard, probability, severity, level, controls, actions, exposed_employee_count, last_review_at)\nselect gen_random_uuid(), '${TENANT}', ${q(r.ref)}, ${q(r.unite)}, ${q(r.countryCode)}, ${q(r.category)}::atlas_people.m12_risk_category, ${q(r.hazard)}, ${r.probability}, ${r.severity}, ${q(r.level)}::atlas_people.m12_risk_level, ${arr(r.controls)}, ${js((r.actions ?? []).map(a => ({ ...a, ownerEmployeeId: a.ownerEmployeeId ? uuid(a.ownerEmployeeId) : null })))}, ${r.exposedEmployeeCount ?? 0}, ${q(r.lastReviewAt)}\nwhere not exists (select 1 from atlas_people.m12_risks where ref = ${q(r.ref)});\n\n`;
}
for (const i of INCIDENTS) {
  sql += `insert into atlas_people.m12_work_incidents (id, tenant_id, ref, employee_id, type, severity, occurred_at, declared_at, country_code, unite, location, description, workdays_lost, third_party_involved, root_cause, corrective_actions, status, cnps_ref, declared_within_sla)\nselect gen_random_uuid(), '${TENANT}', ${q(i.ref)}, '${uuid(i.employeeId)}', ${q(i.type)}::atlas_people.m12_incident_type, ${q(i.severity)}::atlas_people.m12_incident_severity, ${q(i.occurredAt)}::timestamptz, ${q(i.declaredAt)}::timestamptz, ${q(i.countryCode)}, ${q(i.unite)}, ${q(i.location)}, ${q(i.description)}, ${i.workdaysLost ?? 0}, ${!!i.thirdPartyInvolved}, ${q(i.rootCause)}, ${arr(i.correctiveActions)}, ${q(i.status)}::atlas_people.m12_incident_status, ${q(i.cnpsRef)}, ${!!i.declaredWithinSLA}\nwhere not exists (select 1 from atlas_people.m12_work_incidents where ref = ${q(i.ref)});\n\n`;
}
for (const s of RPS_SURVEYS) {
  sql += `insert into atlas_people.m12_rps_surveys (id, tenant_id, ref, title, country_code, scope, scope_label, status, framework, opened_at, closed_at, target_respondents, respondents, average_wellbeing_score, burnout_risk_pct, listening_cell_triggered, insights)\nselect gen_random_uuid(), '${TENANT}', ${q(s.ref)}, ${q(s.title)}, ${q(s.countryCode)}, ${q(s.scope)}, ${q(s.scopeLabel)}, ${q(s.status)}::atlas_people.m12_rps_status, ${q(s.framework)}, ${s.openedAt ? q(s.openedAt) + '::timestamptz' : 'null'}, ${s.closedAt ? q(s.closedAt) + '::timestamptz' : 'null'}, ${s.targetRespondents ?? 0}, ${s.respondents ?? 0}, ${s.averageWellbeingScore ?? 'null'}, ${s.burnoutRiskPct ?? 'null'}, ${!!s.listeningCellTriggered}, ${arr(s.insights)}\nwhere not exists (select 1 from atlas_people.m12_rps_surveys where ref = ${q(s.ref)});\n\n`;
}
for (const d of DECLARATIONS) {
  sql += `insert into atlas_people.m12_social_declarations (id, tenant_id, ref, kind, country_code, period, frequency, status, due_date, submitted_at, paid_at, amount_declared, penalty, headcount)\nselect gen_random_uuid(), '${TENANT}', ${q(d.ref)}, ${q(d.kind)}::atlas_people.m12_declaration_kind, ${q(d.countryCode)}, ${q(d.period)}, ${q(d.frequency)}::atlas_people.m12_declaration_frequency, ${q(d.status)}::atlas_people.m12_declaration_status, ${q(normDate(d.dueDate))}, ${d.submittedAt ? q(normDate(d.submittedAt)) + '::timestamptz' : 'null'}, ${d.paidAt ? q(normDate(d.paidAt)) + '::timestamptz' : 'null'}, ${d.amountDeclared ?? 'null'}, ${d.penalty ?? 'null'}, ${d.headcount ?? 'null'}\nwhere not exists (select 1 from atlas_people.m12_social_declarations where ref = ${q(d.ref)});\n\n`;
}
for (const a of AUTHORIZATIONS) {
  sql += `insert into atlas_people.m12_authorizations (id, tenant_id, ref, employee_id, kind, level, issued_at, expires_at, status, issuing_authority)\nselect gen_random_uuid(), '${TENANT}', ${q(a.ref)}, '${uuid(a.employeeId)}', ${q(a.kind)}::atlas_people.m12_auth_kind, ${q(a.level)}, ${q(a.issuedAt)}, ${q(a.expiresAt)}, ${q(a.status)}::atlas_people.m12_auth_status, ${q(a.issuingAuthority)}\nwhere not exists (select 1 from atlas_people.m12_authorizations where ref = ${q(a.ref)});\n\n`;
}

writeFileSync(new URL('../supabase/seeds/m12_conformite_seed.sql', import.meta.url), sql);
console.log(`OK — risks=${RISKS.length} incidents=${INCIDENTS.length} rps=${RPS_SURVEYS.length} decl=${DECLARATIONS.length} auth=${AUTHORIZATIONS.length}`);
