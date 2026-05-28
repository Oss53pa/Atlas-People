import type { EmployeeRecord } from '../../data/mock';

/** M5 — dérivations déterministes du développement équipe (démo).
 *  Confidentialité honorée : souhaits privés exclus, candidatures discrètes
 *  masquées, successeurs non nominatifs côté intéressé. Aucun montant salarial
 *  individuel — seul le budget formation (collectif) est affiché. */

const TODAY = '2026-05-28';
function hash(id: string): number { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return h; }
function isoAddDays(iso: string, n: number) { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
export const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
export const fmtFCFA = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

// --- DEV.2 Matrice compétences -------------------------------------------------
export interface SkillRow { name: string; category: string; target: number; levels: Record<string, number> }
const SKILLS_METIER = ['Négociation comm.', 'Gestion grands comptes', 'Prospection commerciale', 'Closing'];
const SKILLS_TRANSVERSE = ['Anglais professionnel', 'Excel avancé', 'Gestion de projet', 'Communication'];
const SKILL_TARGET: Record<string, number> = {
  'Négociation comm.': 4, 'Gestion grands comptes': 4, 'Prospection commerciale': 3, 'Closing': 4,
  'Anglais professionnel': 3, 'Excel avancé': 3, 'Gestion de projet': 3, 'Communication': 4,
};
function levelFor(empId: string, skill: string): number {
  const h = hash(empId + '|' + skill);
  return 1 + (h % 5);
}
export function skillsMatrix(team: EmployeeRecord[]): { category: string; rows: SkillRow[] }[] {
  const build = (names: string[], category: string): SkillRow[] => names.map((name) => ({
    name, category, target: SKILL_TARGET[name] ?? 3,
    levels: Object.fromEntries(team.map((e) => [e.id, levelFor(e.id, name)])),
  }));
  return [
    { category: 'Compétences métier — Commerce', rows: build(SKILLS_METIER, 'métier') },
    { category: 'Compétences transverses', rows: build(SKILLS_TRANSVERSE, 'transverse') },
  ];
}
export function skillCoverage(row: SkillRow, team: EmployeeRecord[]): number {
  if (!team.length) return 0;
  const ok = team.filter((e) => (row.levels[e.id] ?? 0) >= row.target).length;
  return Math.round((ok / team.length) * 100);
}

// --- DEV.3 Souhaits de développement -------------------------------------------
export interface Wish { theme: string; priority: 'haute' | 'moyenne' | 'basse'; horizon: string; visible: boolean }
const THEMES = ['Management', 'Anglais pro', 'Excel avancé', 'Gestion projet Agile', 'Prise de parole', 'Data analyse'];
export function memberWishes(e: EmployeeRecord): Wish[] {
  const h = hash(e.id);
  const n = 1 + (h % 3);
  return Array.from({ length: n }, (_, i) => {
    const hh = hash(e.id + 'w' + i);
    return {
      theme: THEMES[(h + i) % THEMES.length],
      priority: (['haute', 'moyenne', 'basse'] as const)[hh % 3],
      horizon: `${6 + (hh % 12)} mois`,
      visible: hh % 5 !== 0, // ~20% privés
    };
  }).filter((w) => w.visible);
}

// --- DEV.4 Formations à valider ------------------------------------------------
export interface TrainingRequest { id: string; emp: EmployeeRecord; title: string; inCatalog: boolean; cost: number; session: string; justification: string; alignedWish: boolean; alignedTarget: boolean }
const TRAININGS = ['Scrum Master Certified', 'Vente complexe B2B', 'Excel avancé', 'Leadership opérationnel', 'Anglais des affaires'];
export function trainingValidations(team: EmployeeRecord[]): TrainingRequest[] {
  return team.filter((e) => hash(e.id) % 2 === 0).map((e) => {
    const h = hash(e.id);
    const inCatalog = h % 3 !== 0;
    return {
      id: `tr-${e.id}`, emp: e,
      title: TRAININGS[h % TRAININGS.length],
      inCatalog,
      cost: inCatalog ? 250000 : 450000,
      session: `${frDate(isoAddDays(TODAY, 13 + (h % 20)))} (${inCatalog ? 'présentiel' : 'hors catalogue'})`,
      justification: 'Aligner l\'équipe sur la méthodologie cible et combler un écart prioritaire.',
      alignedWish: h % 2 === 0,
      alignedTarget: h % 3 !== 0,
    };
  });
}

// --- DEV.5 Formations en cours -------------------------------------------------
export interface TeamTraining { emp: EmployeeRecord; title: string; status: 'upcoming' | 'inprogress' | 'done' | 'overdue'; progress: number; detail: string; feedbackPending: boolean }
const COURSES = ['Parcours Manager 1ère année', 'Excel avancé', 'Sécurité incendie (obligatoire)', 'Communication non-violente', 'Négociation avancée'];
export function teamTrainings(team: EmployeeRecord[]): TeamTraining[] {
  return team.map((e) => {
    const h = hash(e.id);
    const st = (['inprogress', 'inprogress', 'done', 'upcoming', 'overdue'] as const)[h % 5];
    const progress = st === 'done' ? 100 : st === 'upcoming' ? 0 : 30 + (h % 60);
    return {
      emp: e, title: COURSES[h % COURSES.length], status: st, progress,
      detail: st === 'overdue' ? `Échéance dépassée (J-${1 + (h % 5)})` : st === 'done' ? `Terminée · note ${(35 + (h % 15)) / 10}/5` : `Module en cours`,
      feedbackPending: st === 'done' && h % 2 === 0,
    };
  });
}

// --- DEV.6 Budget formation ----------------------------------------------------
export const DEV_BUDGET = { allocated: 4000000, consumed: 1850000, programmed: 1200000 };
export const budgetAvailable = DEV_BUDGET.allocated - DEV_BUDGET.consumed - DEV_BUDGET.programmed;

// --- DEV.7 Mobilité interne ----------------------------------------------------
export interface MobilityApplication { emp: EmployeeRecord; position: string; status: string; transparent: boolean }
export interface MobilityMatch { emp: EmployeeRecord; position: string; score: number }
const POSITIONS = ['Manager commercial Cosmos Angré', 'Responsable parcours client', 'Chargé de clientèle Senior'];
export function mobilityApplications(team: EmployeeRecord[]): { visible: MobilityApplication[]; confidential: number } {
  const apps = team.filter((e) => hash(e.id) % 4 === 0).map((e) => {
    const h = hash(e.id);
    return { emp: e, position: POSITIONS[h % POSITIONS.length], status: 'En instruction RH', transparent: h % 2 === 0 };
  });
  return { visible: apps.filter((a) => a.transparent), confidential: apps.filter((a) => !a.transparent).length };
}
export function mobilityMatches(team: EmployeeRecord[]): MobilityMatch[] {
  return team.map((e) => {
    const h = hash(e.id);
    return { emp: e, position: POSITIONS[h % POSITIONS.length], score: 70 + (h % 25) };
  }).filter((m) => m.score >= 75).slice(0, 4);
}

// --- DEV.8 Plan de succession --------------------------------------------------
export type Maturity = 'ready' | 't6' | 't12';
export const MATURITY_META: Record<Maturity, { label: string; tone: 'ok' | 'info' | 'warn' }> = {
  ready: { label: 'Prêt maintenant', tone: 'ok' },
  t6: { label: 'Prêt à T+6 mois', tone: 'info' },
  t12: { label: 'Prêt à T+12 mois', tone: 'warn' },
};
export interface SuccessionPosition { id: string; title: string; critical: boolean; successors: { emp: EmployeeRecord; maturity: Maturity; plan: string }[]; needed: number }
export function successionPlan(team: EmployeeRecord[]): SuccessionPosition[] {
  if (!team.length) return [];
  const pick = (n: number) => team[n % team.length];
  return [
    { id: 'sp-self', title: 'Mon poste — Manager commercial', critical: true, needed: 2,
      successors: [{ emp: pick(0), maturity: 'ready', plan: 'Parcours Manager terminé en T+3 mois' }] },
    { id: 'sp-1', title: `Responsable équipe (${team[0] ? team[0].id : ''})`, critical: true, needed: 1,
      successors: [
        { emp: pick(1), maturity: 't6', plan: 'Formation manager requise' },
        { emp: pick(2), maturity: 't12', plan: 'Compétences à développer' },
      ] },
    { id: 'sp-2', title: 'Chargé de clientèle Senior', critical: true, needed: 1, successors: [] },
  ];
}

// --- DEV.9 Mentorat ------------------------------------------------------------
export interface MentoringRel { mentor: EmployeeRecord; mentee: EmployeeRecord; skill: string; started: string; cadence: string; sessions: number; total: number }
const MENTOR_SKILLS = ['Négociation', 'Closing', 'Grands comptes', 'Reporting'];
export function mentoringRelations(team: EmployeeRecord[]): MentoringRel[] {
  if (team.length < 2) return [];
  const rels: MentoringRel[] = [];
  for (let i = 0; i + 1 < team.length; i += 2) {
    const h = hash(team[i].id);
    rels.push({
      mentor: team[i], mentee: team[i + 1],
      skill: MENTOR_SKILLS[h % MENTOR_SKILLS.length],
      started: isoAddDays(TODAY, -(20 + (h % 40))),
      cadence: h % 2 === 0 ? 'bi-hebdo' : 'hebdo',
      sessions: 1 + (h % 6), total: 8,
    });
  }
  return rels;
}
