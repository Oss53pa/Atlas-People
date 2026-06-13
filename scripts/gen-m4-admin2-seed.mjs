// Génère supabase/seeds/m4_admin2_seed.sql depuis les datasets mock M4 admin
// (disciplinaire, mandats, élections, période d'essai). Usage : npx tsx scripts/gen-m4-admin2-seed.mjs
// Purge + reseed (tables vides). FK employé par uuid (e1000001-…-NN).
import { DISCIPLINARY, MANDATES, ELECTIONS, PROBATIONS } from '../src/lib/m4/mock.ts';
import { writeFileSync } from 'node:fs';

const TENANT = '11111111-1111-1111-1111-111111111111';
const emp = (eid) => eid == null ? null : `e1000001-0000-0000-0000-${String(parseInt(String(eid).slice(1), 10)).padStart(12, '0')}`;
const q = (s) => s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`;
const qn = (n) => n == null ? 'null' : String(n);
const js = (v) => v == null ? `'{}'::jsonb` : `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const plusDays = (iso, d) => { const dt = new Date(iso); dt.setDate(dt.getDate() + d); return dt.toISOString().slice(0, 10); };

// Mappings vers les enums/colonnes DB.
const DISC_STATUS = { open: 'opened', convocation: 'interview_scheduled', hearing: 'interview_done', sanctioned: 'sanction_notified', appealed: 'contested', closed: 'closed', archived: 'closed' };
const CT_MAP = (t) => (t === 'CDD_CHANTIER' ? 'CDD_CHANT' : t);
const DEC_MAP = { pending: 'pending', confirmation: 'confirmed', prolongation: 'extended', rupture: 'terminated' };
// Statut DB élection (planned/candidacies/voting/counted/proclaimed/carence) — phase mock conservée dans results.
const ELEC_STATUS = { planned: 'planned', candidacies: 'candidacies', voting: 'voting', results: 'counted', closed: 'proclaimed' };

let sql = `-- Seed M4 Admin (2e lot) — disciplinaire / mandats / élections / période d'essai.\n-- Généré depuis src/lib/m4/mock.ts. Purge + reseed du tenant démo.\n\n`;

// ── Disciplinaire ─────────────────────────────────────────────
sql += `delete from atlas_people.m4_disciplinary_cases where tenant_id='${TENANT}';\n`;
sql += `insert into atlas_people.m4_disciplinary_cases (id, tenant_id, employee_id, case_number, opened_at, facts_date, facts_description, prescription_deadline, proposed_qualification, final_qualification, envisaged_sanction, final_sanction, conservatory_suspension, status, protected_category, effacement_date)\nvalues\n${DISCIPLINARY.map((d) => `(gen_random_uuid(), '${TENANT}', ${q(emp(d.employeeId))}, ${q(d.ref)}, ${q(d.openedAt)}, ${q(d.openedAt)}, ${q(d.motif)}, ${q(plusDays(d.openedAt, 60))}, ${q(d.faute)}, ${q(d.faute)}, ${q(d.sanction)}, ${q(d.sanction)}, false, ${q(DISC_STATUS[d.status] ?? 'opened')}::atlas_people.m4_discipline_status, false, ${q(d.effacementDate)})`).join(',\n')};\n\n`;

// ── Mandats de représentation ─────────────────────────────────
sql += `delete from atlas_people.m4_representation_mandates where tenant_id='${TENANT}';\n`;
sql += `insert into atlas_people.m4_representation_mandates (id, tenant_id, employee_id, type, mode, start_date, end_date, delegation_hours, protected_until, status)\nvalues\n${MANDATES.map((m) => `(gen_random_uuid(), '${TENANT}', ${q(emp(m.employeeId))}, ${q(m.type)}, ${q(m.mode)}, ${q(m.start)}, ${q(m.end)}, ${qn(m.delegationHours)}, ${q(m.protectedUntil)}, ${q(m.status)})`).join(',\n')};\n\n`;

// ── Élections (instance/societe/seats portés en JSONB results) ─
sql += `delete from atlas_people.m4_representation_elections where tenant_id='${TENANT}';\n`;
sql += `insert into atlas_people.m4_representation_elections (id, tenant_id, instance_id, scrutin_date, status, turnout_pct, results)\nvalues\n${ELECTIONS.map((e) => `(gen_random_uuid(), '${TENANT}', null, ${q(e.scheduledDate)}, ${q(ELEC_STATUS[e.phase] ?? 'planned')}, ${qn(e.turnout)}, ${js({ instance: e.instance, societe: e.societe, seats: e.seats, phase: e.phase })})`).join(',\n')};\n\n`;

// ── Période d'essai ───────────────────────────────────────────
sql += `delete from atlas_people.m4_probation_periods where tenant_id='${TENANT}';\n`;
sql += `insert into atlas_people.m4_probation_periods (id, tenant_id, employee_id, contract_type, category, duration_months, start_date, end_date, decision, decision_notified_at)\nvalues\n${PROBATIONS.map((p) => `(gen_random_uuid(), '${TENANT}', ${q(emp(p.employeeId))}, ${q(CT_MAP(p.contractType))}::atlas_people.m4_contract_type, ${q(p.category)}, ${Math.max(1, Math.round(p.durationMonths))}, ${q(p.startDate)}, ${q(p.endDate)}, ${q(DEC_MAP[p.decision] ?? 'pending')}::atlas_people.m4_probation_decision, ${q(p.decisionNotifiedAt)})`).join(',\n')};\n\n`;

sql += `select (select count(*) from atlas_people.m4_disciplinary_cases where tenant_id='${TENANT}') as disc,
       (select count(*) from atlas_people.m4_representation_mandates where tenant_id='${TENANT}') as mandates,
       (select count(*) from atlas_people.m4_representation_elections where tenant_id='${TENANT}') as elections,
       (select count(*) from atlas_people.m4_probation_periods where tenant_id='${TENANT}') as probations;\n`;

writeFileSync(new URL('../supabase/seeds/m4_admin2_seed.sql', import.meta.url), sql);
console.log(`OK — disciplinary=${DISCIPLINARY.length} mandates=${MANDATES.length} elections=${ELECTIONS.length} probations=${PROBATIONS.length}`);
