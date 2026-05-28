/** M9 — Ma pratique managériale. Données déterministes de démo (méta : le manager
 *  lui-même). Règles dures : feedback ascendant anonymisé (seuil de réponses),
 *  score d'efficacité visible manager + N+1 + RH (jamais les N-1), verbatims non
 *  ré-identifiables. Aucune donnée individuelle de N-1 exposée nominativement. */

export const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');

// ============================== PRA.1 — Vue d'ensemble ==============================
export const PRACTICE_OVERVIEW = {
  effectiveness: 4.1,
  ritualRegularity: 78,
  oneOnOneCoverage: 80,
  recognitionsSent: 7,
  recognitionsTarget: 12,
  strengths: ['Leadership & vision', 'Disponibilité', 'Capacité à fédérer'],
  improvements: ['Régularité des 1:1', 'Reconnaissance plus systématique', 'Déléguer davantage'],
  managerPath: 'Parcours Manager : non démarré',
};

// ============================== PRA.2 — Rituels ==============================
export type Cadence = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
export const CADENCE_LABEL: Record<Cadence, string> = { weekly: 'Hebdomadaire', biweekly: 'Bi-hebdo', monthly: 'Mensuelle', quarterly: 'Trimestrielle' };
export interface Ritual { id: string; name: string; cadence: Cadence; detail: string; status: 'ontrack' | 'late' | 'due'; meta?: string }
export const RITUALS: Ritual[] = [
  { id: 'r1', name: '1:1 hebdomadaire avec chaque N-1', cadence: 'weekly', detail: 'Cible 1/sem/N-1 · réalisé ce mois 16/20 (80%)', status: 'late', meta: 'En retard : 2 collaborateurs (>14j)' },
  { id: 'r2', name: 'Point équipe hebdomadaire', cadence: 'weekly', detail: 'Jour : vendredi · dernière 24/05 · prochaine 31/05', status: 'ontrack' },
  { id: 'r3', name: 'Revue OKR mensuelle', cadence: 'monthly', detail: 'Dernière 26/04', status: 'due', meta: 'Prochaine en retard (J-3)' },
  { id: 'r4', name: 'Skip-level meeting trimestriel', cadence: 'quarterly', detail: 'Échange avec mes N-2 sans intermédiaire · dernière 15/02', status: 'due', meta: 'Mai : à programmer' },
  { id: 'r5', name: 'Comité de direction', cadence: 'monthly', detail: 'Si invité · prochaine 05/06', status: 'ontrack' },
];
export const RITUAL_STATUS_META: Record<Ritual['status'], { label: string; tone: 'ok' | 'warn' | 'danger' }> = {
  ontrack: { label: 'À jour', tone: 'ok' },
  late: { label: 'À surveiller', tone: 'warn' },
  due: { label: 'En retard', tone: 'danger' },
};
export const RITUAL_CATALOG = ['1:1 individuel', 'Point équipe', 'Revue OKR', 'Skip-level', 'Comité de direction', 'Rétrospective'];

// ============================== PRA.3 — Feedback reçu ==============================
export interface FeedbackAxis { label: string; score: number }
export const FEEDBACK_ASCENDING = {
  global: 4.1, responses: 5, totalReports: 5,
  axes: [
    { label: 'Vision & sens', score: 4.5 },
    { label: 'Disponibilité', score: 4.3 },
    { label: 'Soutien & confiance', score: 4.2 },
    { label: 'Reconnaissance', score: 3.4 },
    { label: 'Délégation', score: 3.2 },
    { label: 'Communication', score: 4.0 },
    { label: 'Feedback constructif', score: 3.8 },
  ] as FeedbackAxis[],
  verbatims: [
    'Très inspirant, donne envie de se dépasser.',
    'Pourrait reconnaître plus souvent les efforts.',
    'Délègue parfois trop tardivement.',
    'Toujours disponible quand on en a besoin.',
  ],
};
export const FEEDBACK_DESCENDING = {
  date: '2026-05-15', score: 4.2,
  summary: 'Excellente capacité à fédérer l’équipe et à porter la vision. Axe de progrès : structurer davantage les rituels de revue de performance.',
};
export const FEEDBACK_LATERAL = { count: 3, summary: 'Bon collaborateur transverse, force de proposition en comité.' };
export interface ImprovementAxis { id: string; title: string; action: string; deadline: string }
export const IMPROVEMENT_PLAN: ImprovementAxis[] = [
  { id: 'i1', title: 'Augmenter la reconnaissance', action: 'Atteindre 12 reconnaissances/trimestre', deadline: 'Q3 2026' },
  { id: 'i2', title: 'Mieux déléguer', action: 'Formation « Délégation efficace »', deadline: '30/06/2026' },
];

// ============================== PRA.4 — Formations manager ==============================
export const MANAGER_TRAININGS = {
  inProgress: [{ label: 'Parcours Manager 1ère année', progress: 60 }],
  recommended: ['Délégation efficace (1 j, présentiel)', 'Reconnaissance et motivation d’équipe (1 j)', 'Conduire des entretiens difficiles (2 j)', 'Coaching d’équipe (3 j)'],
};

// ============================== PRA.5 — Parcours ==============================
export const MANAGER_CAREER = {
  managingSince: '02/06/2022', years: 4, totalManaged: 23, managerialPromotions: 1,
  timeline: [
    { year: '2022', event: 'Première équipe (5 personnes, Commerce Yopougon)' },
    { year: '2023', event: 'Élargissement (8 personnes)' },
    { year: '2024', event: 'Promotion senior manager' },
    { year: '2024', event: 'Prise en charge Cosmos Angré (10 personnes)' },
    { year: '2025', event: 'Équipe stabilisée (12 personnes)' },
    { year: '2026', event: 'Aujourd’hui' },
  ],
  trainingsDone: 4,
  mentor: 'Marie SAMAKÉ (DRH) — depuis 2023',
};

// ============================== PRA.6 — Ressources ==============================
export const RESOURCE_CATEGORIES = ['Conduite d’entretiens', 'Communication', 'Conflits', 'Évaluation et feedback', 'Délégation', 'Reconnaissance', 'Recrutement', 'Conduite du changement'];
export const TOP_RESOURCES = [
  { label: 'Guide : Conduire un 1:1 efficace', kind: 'PDF' },
  { label: 'Modèle : Trame entretien d’évaluation', kind: 'Modèle' },
  { label: 'Vidéo : Donner un feedback constructif (15 min)', kind: 'Vidéo' },
];

// ============================== PRA.7 — Efficacité ==============================
export const EFFECTIVENESS = {
  global: 4.1,
  components: [
    { label: 'Feedback ascendant (N-1)', score: 4.1, weight: 40 },
    { label: 'Feedback N+1', score: 4.2, weight: 30 },
    { label: 'KPI équipe', score: 4.0, weight: 30 },
  ],
  history: [{ year: '2024', score: 3.5 }, { year: '2025', score: 3.8 }, { year: '2026', score: 4.1 }],
  percentileLevel: 70,
  rankDepartment: 'Top 3',
};
