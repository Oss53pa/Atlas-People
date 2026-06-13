// Génère supabase/seeds/m6_sub_seed.sql : tâches / jalons / pulses / welcome-book
// pour les 3 arrivants RÉELS (m6_arrivants), à parité-template.
// Usage : npx tsx scripts/gen-m6-sub-seed.mjs
import { MILESTONES, TASK_LIBRARY, WELCOME_DOCS, PULSE_QUESTIONS } from '../src/lib/m6/referentiels.ts';
import { writeFileSync } from 'node:fs';

const TENANT = '11111111-1111-1111-1111-111111111111';
const TODAY = new Date('2026-06-13');
const q = (s) => s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`;
const plusDays = (iso, d) => { const t = new Date(iso); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };
const diffDays = (iso) => Math.round((TODAY.getTime() - new Date(iso).getTime()) / 86_400_000);

// Arrivants réels : eNN → { uuid, start, status }
const ARRIVANTS = [
  { eid: 'e7',  uuid: '66666666-0000-0002-0000-000000000003', start: '2024-04-10', status: 'completed' },
  { eid: 'e11', uuid: '66666666-0000-0002-0000-000000000001', start: '2026-01-08', status: 'active' },
  { eid: 'e12', uuid: '66666666-0000-0002-0000-000000000002', start: '2026-04-15', status: 'active' },
];

const MILE_KIND = { PRE_J7: 'CUSTOM', J0: 'J0', J7: 'J7', J30: 'J30', J60: 'J60', J90: 'J90' };
const OWNER_MAP = { rh: 'rh', manager: 'manager', it: 'it', office: 'admin', buddy: 'buddy', newcomer: 'employee' };
const milestoneDay = (code) => MILESTONES.find((m) => m.code === code).daysFromHire;

let sql = `-- Seed M6 sous-données (tâches/jalons/pulses/welcome) — 3 arrivants réels, parité-template.\n-- Généré depuis src/lib/m6/referentiels.ts.\n\n`;
for (const a of ARRIVANTS) {
  sql += `delete from atlas_people.m6_tasks where tenant_id='${TENANT}' and arrivant_id='${a.uuid}';\n`;
  sql += `delete from atlas_people.m6_jalons where tenant_id='${TENANT}' and arrivant_id='${a.uuid}';\n`;
  sql += `delete from atlas_people.m6_pulses where tenant_id='${TENANT}' and arrivant_id='${a.uuid}';\n`;
  sql += `delete from atlas_people.m6_welcome_book where tenant_id='${TENANT}' and arrivant_id='${a.uuid}';\n`;
}
sql += '\n';

// ── Tâches ───────────────────────────────────────────────────
const taskRows = [];
for (const a of ARRIVANTS) {
  const elapsed = diffDays(a.start);
  TASK_LIBRARY.forEach((t, idx) => {
    const md = milestoneDay(t.milestone);
    const due = plusDays(a.start, md);
    let st;
    if (a.status === 'completed') st = 'done';
    else if (elapsed >= md) st = (idx % 6 === 0) ? 'in_progress' : 'done';
    else if (elapsed >= md - 2) st = 'in_progress';
    else st = 'todo';
    const completedAt = st === 'done' ? plusDays(due, -1) : null;
    taskRows.push(`(gen_random_uuid(), '${TENANT}', '${a.uuid}', ${q(MILE_KIND[t.milestone])}::atlas_people.m6_jalon_kind, ${q(OWNER_MAP[t.ownerRole] ?? 'rh')}::atlas_people.m6_task_owner, ${q(t.title)}, null, ${q(due)}, ${q(st)}::atlas_people.m6_task_status, ${q(completedAt)}, ${!!t.blocking})`);
  });
}
sql += `insert into atlas_people.m6_tasks (id, tenant_id, arrivant_id, jalon_kind, owner, title, description, due_date, status, completed_at, required)\nvalues\n${taskRows.join(',\n')};\n\n`;

// ── Jalons (J0..J90 + FIN_ESSAI) ─────────────────────────────
const jalonRows = [];
for (const a of ARRIVANTS) {
  const elapsed = diffDays(a.start);
  for (const m of MILESTONES) {
    if (m.code === 'PRE_J7') continue;
    const due = plusDays(a.start, m.daysFromHire);
    const passed = elapsed >= m.daysFromHire;
    const st = a.status === 'completed' || passed ? 'validated' : 'pending';
    const validatedAt = st === 'validated' ? `${due}T17:00:00Z` : null;
    jalonRows.push(`(gen_random_uuid(), '${TENANT}', '${a.uuid}', ${q(MILE_KIND[m.code])}::atlas_people.m6_jalon_kind, ${q(due)}, ${q(validatedAt)}, ${q(st)})`);
  }
  // FIN_ESSAI à J+90
  const finDue = plusDays(a.start, 90);
  const finSt = a.status === 'completed' ? 'validated' : 'pending';
  jalonRows.push(`(gen_random_uuid(), '${TENANT}', '${a.uuid}', 'FIN_ESSAI'::atlas_people.m6_jalon_kind, ${q(finDue)}, ${q(finSt === 'validated' ? finDue + 'T17:00:00Z' : null)}, ${q(finSt)})`);
}
sql += `insert into atlas_people.m6_jalons (id, tenant_id, arrivant_id, kind, due_date, validated_at, status)\nvalues\n${jalonRows.join(',\n')};\n\n`;

// ── Pulses (J7/J30/J60/J90) ──────────────────────────────────
const pulseRows = [];
for (const a of ARRIVANTS) {
  const elapsed = diffDays(a.start);
  const seed = parseInt(a.eid.slice(1), 10);
  for (const m of ['J7', 'J30', 'J60', 'J90']) {
    const target = m === 'J7' ? 7 : m === 'J30' ? 30 : m === 'J60' ? 60 : 90;
    if (elapsed < target) continue;
    const overall = 3.5 + (seed % 3) * 0.3;
    const score = overall >= 4 ? 'happy' : overall >= 3 ? 'neutral' : 'unhappy';
    const trig = `${plusDays(a.start, target)}T09:00:00Z`;
    const sub = `${plusDays(a.start, target + 1)}T10:00:00Z`;
    const comment = m === 'J90' ? 'Onboarding très structuré, buddy disponible. À améliorer : plus de rencontres transverses.' : null;
    pulseRows.push(`(gen_random_uuid(), '${TENANT}', '${a.uuid}', ${q(trig)}, ${q(sub)}, ${q(m)}::atlas_people.m6_jalon_kind, ${q(score)}::atlas_people.m6_pulse_score, ${q(comment)})`);
  }
}
sql += `insert into atlas_people.m6_pulses (id, tenant_id, arrivant_id, triggered_at, submitted_at, jalon_kind, score, comment)\nvalues\n${pulseRows.join(',\n')};\n\n`;

// ── Welcome book ─────────────────────────────────────────────
const wbRows = [];
for (const a of ARRIVANTS) {
  WELCOME_DOCS.forEach((d, i) => {
    const sent = plusDays(a.start, -3);
    const rs = a.status === 'completed' ? (d.signatureRequired ? 'signed' : 'read')
      : d.signatureRequired ? 'signed' : (i % 4 === 0 ? 'sent' : 'read');
    const readAt = rs === 'sent' ? null : `${plusDays(sent, 4)}T12:00:00Z`;
    wbRows.push(`(gen_random_uuid(), '${TENANT}', '${a.uuid}', ${q(d.code)}, null, ${q(readAt)}, ${q(rs)})`);
  });
}
sql += `insert into atlas_people.m6_welcome_book (id, tenant_id, arrivant_id, doc_kind, url, read_at, read_status)\nvalues\n${wbRows.join(',\n')};\n\n`;

sql += `select (select count(*) from atlas_people.m6_tasks where tenant_id='${TENANT}') tasks,
       (select count(*) from atlas_people.m6_jalons where tenant_id='${TENANT}') jalons,
       (select count(*) from atlas_people.m6_pulses where tenant_id='${TENANT}') pulses,
       (select count(*) from atlas_people.m6_welcome_book where tenant_id='${TENANT}') welcome;\n`;

writeFileSync(new URL('../supabase/seeds/m6_sub_seed.sql', import.meta.url), sql);
console.log(`OK — tasks=${taskRows.length} jalons=${jalonRows.length} pulses=${pulseRows.length} welcome=${wbRows.length}`);
