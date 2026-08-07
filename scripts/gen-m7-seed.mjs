// Génère supabase/seeds/m7_okr_seed.sql depuis les datasets mock M7 (arbre OKR).
// Usage : npx tsx scripts/gen-m7-seed.mjs
// Purge + reseed les objectifs (4 existants divergents) et KR. Parent_id résolu
// en 2e passe par ref (les lignes parentes ne sont pas visibles dans le même INSERT).
import { OBJECTIVES, KEY_RESULTS } from '../src/lib/m7/mock.ts';
import { writeFileSync } from 'node:fs';

const TENANT = '11111111-1111-1111-1111-111111111111';
const CYCLE = '11111111-0000-0000-0007-100000000001'; // 2026-Q2 in_progress
const emp = (eid) => eid == null ? null : `e1000001-0000-0000-0000-${String(parseInt(String(eid).slice(1), 10)).padStart(12, '0')}`;
const q = (s) => s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`;
const qn = (n) => n == null ? 'null' : String(n);
const LEVEL = { company: 'entreprise', department: 'direction', team: 'equipe', individual: 'individuel' };
const KRTYPE = { numeric: 'numeric', percent: 'percentage', currency: 'currency', binary: 'binary', milestone: 'milestone' };
const CONF = { green: 5, amber: 3, red: 1 };
const refOf = new Map(OBJECTIVES.map((o) => [o.id, o.ref]));

let sql = `-- Seed M7 OKR (tenant démo) — généré depuis src/lib/m7/mock.ts.\n-- Purge + reseed (objectifs/KR). Niveaux : company->entreprise... ; KR percent->percentage ;\n-- confidence green/amber/red -> 5/3/1 ; status active -> in_progress. Check-ins gardés mock (modèle DB par-KR).\n\n`;
sql += `delete from atlas_people.m7_check_ins where tenant_id='${TENANT}';\n`;
sql += `delete from atlas_people.m7_key_results where tenant_id='${TENANT}';\n`;
sql += `delete from atlas_people.m7_objectives where tenant_id='${TENANT}';\n\n`;

sql += `insert into atlas_people.m7_objectives (id, tenant_id, cycle_id, ref, level, title, description, owner_id, team_label, status)
select gen_random_uuid(), '${TENANT}', '${CYCLE}', v.ref, v.level::atlas_people.m7_okr_level, v.title, v.descr, v.owner::uuid, v.team, v.status::atlas_people.m7_objective_status
from (values\n${OBJECTIVES.map((o) => ` (${q(o.ref)},${q(LEVEL[o.level])},${q(o.title)},${q(o.description)},${q(emp(o.ownerEmployeeId))},${q(o.ownerTeam)},${q(o.confidence === 'red' ? 'at_risk' : 'in_progress')})`).join(',\n')}
) as v(ref,level,title,descr,owner,team,status)
where not exists (select 1 from atlas_people.m7_objectives x where x.ref = v.ref and x.tenant_id='${TENANT}');\n\n`;

const childParent = OBJECTIVES.filter((o) => o.parentObjectiveId).map((o) => [o.ref, refOf.get(o.parentObjectiveId)]);
sql += `update atlas_people.m7_objectives o set parent_id = p.id
from atlas_people.m7_objectives p, (values\n${childParent.map(([c, pr]) => ` (${q(c)},${q(pr)})`).join(',\n')}
) as m(child_ref, parent_ref)
where o.ref = m.child_ref and p.ref = m.parent_ref and o.tenant_id='${TENANT}' and p.tenant_id='${TENANT}';\n\n`;

sql += `insert into atlas_people.m7_key_results (id, tenant_id, objective_id, ref, title, type, baseline, target, current_value, unit, weight_pct, confidence)
select gen_random_uuid(), '${TENANT}', o.id, v.ref, v.title, v.typ::atlas_people.m7_kr_type, v.base, v.target, v.cur, v.unit, v.w, v.conf
from (values\n${KEY_RESULTS.map((k) => ` (${q(refOf.get(k.objectiveId))},${q(k.ref)},${q(k.title)},${q(KRTYPE[k.type] ?? 'numeric')},${qn(k.startValue)},${qn(k.targetValue)},${qn(k.currentValue)},${q(k.unit)},${qn(k.weight)},${qn(CONF[k.confidence] ?? 3)})`).join(',\n')}
) as v(obj_ref,ref,title,typ,base,target,cur,unit,w,conf)
join atlas_people.m7_objectives o on o.ref = v.obj_ref and o.tenant_id='${TENANT}'
where not exists (select 1 from atlas_people.m7_key_results x where x.ref = v.ref and x.tenant_id='${TENANT}');\n`;

writeFileSync(new URL('../supabase/seeds/m7_okr_seed.sql', import.meta.url), sql);
console.log(`OK — objectives=${OBJECTIVES.length} key_results=${KEY_RESULTS.length} aligns=${childParent.length}`);
