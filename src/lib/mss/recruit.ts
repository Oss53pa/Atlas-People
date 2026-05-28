import type { EmployeeRecord } from '../../data/mock';

/** M6 — dérivations déterministes Recrutement & intégration (démo, sans backend).
 *  Règles dures honorées : aucune donnée salariale candidat (négociation = RH),
 *  pas de communication directe candidat, recommandation manager → décision RH/DRH,
 *  audit fort sur consultation des profils. */

const TODAY = '2026-05-28';
function hash(id: string): number { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return h; }
function isoAddDays(iso: string, n: number) { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
export const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
export const daysSince = (iso: string) => Math.round((new Date(`${TODAY}T00:00:00`).getTime() - new Date(`${iso}T00:00:00`).getTime()) / 86400000);
export const daysUntil = (iso: string) => -daysSince(iso);

// --- REC.2 Demandes de recrutement --------------------------------------------
export type RequestStatus = 'draft' | 'instruction' | 'validated' | 'sourcing' | 'filled';
export const REQUEST_STATUS_META: Record<RequestStatus, { label: string; tone: 'neutral' | 'warn' | 'info' | 'ok' }> = {
  draft: { label: 'Brouillon', tone: 'neutral' },
  instruction: { label: 'En instruction RH', tone: 'warn' },
  validated: { label: 'Validée', tone: 'info' },
  sourcing: { label: 'En sourcing', tone: 'info' },
  filled: { label: 'Pourvue', tone: 'ok' },
};
export interface RecruitmentRequest {
  id: string; ref: string; title: string; type: string; site: string;
  submittedAt: string; referent: string; status: RequestStatus;
  messages: number; actionRequired?: string; filledBy?: string;
}
export function recruitmentRequests(): RecruitmentRequest[] {
  return [
    { id: 'dr-0124', ref: 'DR-2026-0124', title: 'Chargé clientèle Senior', type: 'Remplacement (départ Yao Kouassi)', site: 'Cosmos Yopougon', submittedAt: '2026-05-02', referent: 'Marie Samaké', status: 'instruction', messages: 3 },
    { id: 'dr-0145', ref: 'DR-2026-0145', title: 'Renfort temporaire pic d’activité', type: 'CDD 6 mois', site: 'Cosmos Yopougon', submittedAt: '2026-05-18', referent: 'Marie Samaké', status: 'instruction', messages: 1, actionRequired: 'Répondre aux questions RH' },
    { id: 'dr-0102', ref: 'DR-2026-0102', title: 'Commercial terrain zone Sud', type: 'Création de poste', site: 'Cosmos Marcory', submittedAt: '2026-04-14', referent: 'Marie Samaké', status: 'sourcing', messages: 5 },
    { id: 'dr-0078', ref: 'DR-2026-0078', title: 'Chargée clientèle', type: 'Remplacement', site: 'Cosmos Yopougon', submittedAt: '2026-03-20', referent: 'Marie Samaké', status: 'filled', messages: 7, filledBy: 'Fatou Sarr (entrée 23/05)' },
  ];
}
export const REQUEST_TYPES = [
  { key: 'replacement', label: 'Remplacement (départ d’un membre)' },
  { key: 'creation', label: 'Création de poste (besoin nouveau)' },
  { key: 'temp', label: 'Renfort temporaire (CDD)' },
  { key: 'alt', label: 'Alternance / Stage' },
];
export const REQUEST_URGENCY = [
  { key: 'normal', label: 'Normale (3 mois)' },
  { key: 'important', label: 'Importante (6 semaines)' },
  { key: 'urgent', label: 'Urgente (3 semaines) — à justifier' },
];

// --- REC.3 Candidats en cours -------------------------------------------------
export type Stage = 'preselected' | 'tomeet' | 'met' | 'decision';
export const STAGE_META: Record<Stage, { label: string }> = {
  preselected: { label: 'Présélectionnés' }, tomeet: { label: 'À rencontrer' },
  met: { label: 'Rencontrés' }, decision: { label: 'Décision finale' },
};
export interface Candidate {
  id: string; alias: string; stage: Stage; experience: number; interviewScore?: number;
  hrNote: string; managerEvalDone: boolean; awaitingDecision: boolean;
}
export function candidatePipeline(): { position: string; candidates: Candidate[] } {
  const mk = (i: number, stage: Stage, extra: Partial<Candidate> = {}): Candidate => {
    const h = hash('cand' + i);
    return {
      id: `cand-${i}`, alias: `Candidat ${String.fromCharCode(65 + i)}`, stage,
      experience: 4 + (h % 8), hrNote: 'Profil solide, valeurs alignées', managerEvalDone: false, awaitingDecision: false, ...extra,
    };
  };
  return {
    position: 'Chargé clientèle Senior',
    candidates: [
      mk(0, 'preselected'), mk(1, 'preselected'), mk(2, 'preselected'),
      mk(3, 'tomeet'), mk(4, 'tomeet'),
      mk(5, 'met', { interviewScore: 4 }),
      mk(6, 'decision', { interviewScore: 4, awaitingDecision: true }),
    ],
  };
}
export const CANDIDATE_DECISIONS = [
  { key: 'hire', label: 'Recruter (envoyer à RH pour proposition d’embauche)' },
  { key: 'reject', label: 'Refuser (motif obligatoire)' },
  { key: 'second', label: 'Demander un 2e entretien' },
];

// --- REC.4 Nouveaux entrants --------------------------------------------------
export interface OnboardingStep { label: string; owner: string; done: boolean; action: boolean }
export interface Newcomer {
  emp: EmployeeRecord; entryDate: string; jPlus: number; role: string; site: string;
  probationEnd: string; progress: number; steps: OnboardingStep[]; firstOneOnOneDone: boolean;
}
function onboardingSteps(h: number): OnboardingStep[] {
  const base: OnboardingStep[] = [
    { label: 'Documents administratifs', owner: 'RH', done: true, action: false },
    { label: 'Accès SI', owner: 'IT', done: true, action: false },
    { label: 'Visite du site', owner: 'moi', done: true, action: false },
    { label: 'Présentation équipe', owner: 'moi', done: true, action: false },
    { label: 'Formations obligatoires', owner: 'RH', done: h % 2 === 0, action: false },
    { label: 'Premier 1:1', owner: 'moi', done: false, action: true },
    { label: 'Définition premiers objectifs', owner: 'moi', done: false, action: true },
    { label: 'Entretien mi-période d’essai', owner: 'moi', done: false, action: false },
  ];
  return base;
}
export function newcomers(team: EmployeeRecord[]): Newcomer[] {
  return team.filter((e) => e.status === 'onboarding').map((e) => {
    const h = hash(e.id);
    const entryDate = e.hireDate && daysSince(e.hireDate) < 90 ? e.hireDate : isoAddDays(TODAY, -(3 + (h % 20)));
    const steps = onboardingSteps(h);
    const progress = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
    return {
      emp: e, entryDate, jPlus: daysSince(entryDate), role: e.role,
      site: 'Cosmos Yopougon', probationEnd: e.probationEnd ?? isoAddDays(entryDate, 90),
      progress, steps, firstOneOnOneDone: false,
    };
  });
}
export const PROBATION_AXES = ['Maîtrise du poste', 'Intégration équipe', 'Engagement', 'Potentiel'];
export const PROBATION_DECISIONS = [
  { key: 'confirm', label: 'Valider l’embauche définitive' },
  { key: 'extend', label: 'Prolonger la période d’essai' },
  { key: 'break', label: 'Rupture de la période d’essai (motif obligatoire)' },
];

// --- REC.5 Sortants -----------------------------------------------------------
export interface TransitionStep { label: string; done: boolean }
export interface DossierTransfer { client: string; to: string; status: 'done' | 'inprogress' | 'todo' }
export interface Leaver {
  emp: EmployeeRecord; departDate: string; jUntil: number; reason: string; noticeFrom: string;
  steps: TransitionStep[]; dossiers: DossierTransfer[]; replacementRef?: string;
}
export function leavers(team: EmployeeRecord[]): Leaver[] {
  return team.filter((e) => e.status === 'notice').map((e) => {
    const h = hash(e.id);
    const departDate = e.cddEnd ?? isoAddDays(TODAY, 20 + (h % 30));
    return {
      emp: e, departDate, jUntil: daysUntil(departDate), reason: 'Démission', noticeFrom: isoAddDays(departDate, -30),
      steps: [
        { label: 'Annonce équipe', done: true },
        { label: 'Transfert dossiers en cours', done: false },
        { label: 'Documentation des process', done: false },
        { label: 'Entretien de sortie', done: false },
        { label: 'Restitution matériel', done: false },
      ],
      dossiers: [
        { client: 'Client A', to: 'Awa', status: 'inprogress' },
        { client: 'Client B', to: 'Ibrahim', status: 'inprogress' },
        { client: 'Client C', to: '— à attribuer', status: 'todo' },
      ],
      replacementRef: 'DR-2026-0124',
    };
  });
}
