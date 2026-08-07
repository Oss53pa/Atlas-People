// Génère supabase/seeds/m8_evaluations_seed.sql depuis src/lib/m8/mock.ts.
// Usage : npx tsx scripts/gen-m8-seed.mjs
// Modèle DB = 5 dimensions fixes (okr/competences/comportements/evolution/developpement)
// + note_finale + classe (A-E). Les 5 ScoreRow mock (OKR/COMP/BEHAVIOR/LEADERSHIP/CULTURE)
// sont mappés dim1..dim5. Purge + reseed des évaluations du cycle annuel 2026.
import { EVALUATIONS } from '../src/lib/m8/mock.ts';
import { writeFileSync } from 'node:fs';

const TENANT = '11111111-1111-1111-1111-111111111111';
const CYCLE = '22222222-0000-0000-0008-100000000001'; // m8_cycles annuel 2026 (existant)
const emp = (eid) => eid == null ? null : `e1000001-0000-0000-0000-${String(parseInt(String(eid).slice(1), 10)).padStart(12, '0')}`;
const q = (s) => s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`;
const qn = (n) => n == null ? 'null' : String(n);

const SMAP = { auto_in_progress: 'draft', auto_submitted: 'auto_submitted', manager_submitted: 'manager_review', calibration: 'calibrated', shared: 'entretien_pending', signed: 'signed', closed: 'closed' };
const CLASSE = { outstanding: 'A', exceeds: 'B', meets: 'C', low: 'D' };

let sql = `-- Seed M8 Évaluations (tenant démo) — généré depuis src/lib/m8/mock.ts.\n-- 5 dimensions fixes ; classe A-E dérivée de performanceRating. Purge + reseed.\n\n`;
sql += `delete from atlas_people.m8_evaluations where tenant_id='${TENANT}' and cycle_id='${CYCLE}';\n`;
sql += `insert into atlas_people.m8_evaluations (id, tenant_id, cycle_id, employee_id, manager_id, ref, status, score_dim1_okr, score_dim2_competences, score_dim3_comportements, score_dim4_evolution, score_dim5_developpement, weight_dim1, weight_dim2, weight_dim3, weight_dim4, weight_dim5, note_finale, classe, auto_submitted_at, manager_submitted_at, calibrated_at, signed_at, modifications_count, override_by_director, override_by_drh)\nvalues\n`;

sql += EVALUATIONS.map((e) => {
  const s = e.scores;
  const dim = (i) => qn(s[i]?.finalScore);
  const w = (i) => qn(s[i]?.weight);
  return `(gen_random_uuid(), '${TENANT}', '${CYCLE}', ${q(emp(e.employeeId))}, ${q(emp(e.managerEmployeeId))}, ${q(e.ref)}, ${q(SMAP[e.status] ?? 'draft')}::atlas_people.m8_eval_status, ${dim(0)}, ${dim(1)}, ${dim(2)}, ${dim(3)}, ${dim(4)}, ${w(0)}, ${w(1)}, ${w(2)}, ${w(3)}, ${w(4)}, ${qn(e.overallScore)}, ${q(CLASSE[e.performanceRating] ?? 'C')}::atlas_people.m8_classe_finale, ${q(e.autoSubmittedAt)}, ${q(e.managerSubmittedAt)}, ${q(e.calibrationApprovedAt)}, ${q(e.signedAt)}, 0, false, false)`;
}).join(',\n') + ';\n\n';

sql += `select count(*) as evals, count(*) filter (where signed_at is not null) as signed, count(distinct classe) as classes from atlas_people.m8_evaluations where tenant_id='${TENANT}' and cycle_id='${CYCLE}';\n`;

writeFileSync(new URL('../supabase/seeds/m8_evaluations_seed.sql', import.meta.url), sql);
console.log(`OK — evaluations=${EVALUATIONS.length}`);
