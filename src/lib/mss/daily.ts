import type { EmployeeRecord } from '../../data/mock';

/** M7 — dérivations déterministes Vie quotidienne managériale (démo).
 *  Règles dures : signalements anonymes non ré-identifiables (aucune donnée
 *  d'identification stockée côté manager), alertes RPS sévères escaladées,
 *  sondages agrégés au niveau équipe (seuil 5 personnes minimum). */

const TODAY = '2026-05-28';
export const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
export const daysSince = (iso: string) => Math.round((new Date(`${TODAY}T00:00:00`).getTime() - new Date(`${iso}T00:00:00`).getTime()) / 86400000);

// --- VQ.4 Courrier managérial -------------------------------------------------
export type MailKind = 'CONV' | 'COMM' | 'INSTR' | 'FORM' | 'DOC';
export const MAIL_KIND_META: Record<MailKind, { label: string; tone: 'amber' | 'info' | 'neutral' }> = {
  CONV: { label: 'Convocation', tone: 'amber' },
  COMM: { label: 'Communication', tone: 'info' },
  INSTR: { label: 'Instruction', tone: 'amber' },
  FORM: { label: 'Formation manager', tone: 'info' },
  DOC: { label: 'Référentiel', tone: 'neutral' },
};
export interface ManagerMail {
  id: string; kind: MailKind; subject: string; from: string; date: string;
  read: boolean; actionRequired?: string; body: string;
}
export function managerMail(): ManagerMail[] {
  return [
    { id: 'mc-1', kind: 'CONV', subject: 'Convocation Comité de direction', from: 'Direction Générale', date: '2026-05-25', read: false, actionRequired: 'Confirmer présence avant le 03/06', body: 'Vous êtes convié(e) au comité de direction du 05/06/2026 à 09h00 (salle Cosmos). Ordre du jour : revue trimestrielle des objectifs BU.' },
    { id: 'mc-2', kind: 'COMM', subject: 'Nouveaux objectifs trimestre BU', from: 'DRH', date: '2026-05-22', read: false, body: 'Les objectifs du trimestre pour la business unit Ventes ont été diffusés. Merci de les décliner auprès de vos équipes.' },
    { id: 'mc-3', kind: 'COMM', subject: 'Politique mobilité interne mise à jour', from: 'DRH', date: '2026-05-12', read: true, body: 'La politique de mobilité interne a été actualisée. Les candidatures discrètes sont désormais possibles via le portail.' },
    { id: 'mc-4', kind: 'INSTR', subject: 'Campagne d’évaluation annuelle lancée', from: 'DRH', date: '2026-05-05', read: true, body: 'La campagne d’évaluation annuelle est ouverte jusqu’au 30/06. Merci de planifier les entretiens de vos collaborateurs.' },
  ];
}

// --- VQ.5 Climat équipe -------------------------------------------------------
export interface ClimateMetrics { engagement: number; engagementDelta: number; satisfaction: number; nps: number; workloadOk: boolean; participation: number }
export function climateMetrics(team: EmployeeRecord[]): ClimateMetrics {
  // Agrégation simulée pondérée par l'attention rétention (jamais individuel, seuil 5+).
  if (team.length < 5) return { engagement: 0, engagementDelta: 0, satisfaction: 0, nps: 0, workloadOk: true, participation: 0 };
  const avgAttention = team.reduce((s, e) => s + e.retentionAttention, 0) / team.length;
  const engagement = Math.round((10 - avgAttention / 14) * 10) / 10;
  return { engagement, engagementDelta: 0.3, satisfaction: Math.round((engagement / 2) * 10) / 10, nps: 42, workloadOk: avgAttention < 45, participation: 78 };
}
export interface ClimateTrendPoint { month: string; value: number }
export function climateTrend(): ClimateTrendPoint[] {
  return [
    { month: 'Déc', value: 7.2 }, { month: 'Jan', value: 7.4 }, { month: 'Fév', value: 7.3 },
    { month: 'Mar', value: 7.5 }, { month: 'Avr', value: 7.5 }, { month: 'Mai', value: 7.8 },
  ];
}
export interface ClimateSignal {
  id: string; anonymous: boolean; category: string; receivedAt: string; content: string; treated: boolean; severe: boolean;
}
export function climateSignals(): ClimateSignal[] {
  return [
    { id: 'sig-0089', anonymous: true, category: 'Climat / Relations', receivedAt: '2026-05-26', treated: false, severe: false,
      content: 'Tensions entre 2 membres de l’équipe sur le partage des dossiers clients. Ambiance pesante depuis 2 semaines.' },
  ];
}
export const SIGNAL_ACTIONS = [
  { key: 'meeting', label: 'Aborder en réunion équipe (sans citer le signalement nominativement)' },
  { key: 'mediation', label: 'Proposer une médiation' },
  { key: 'escalate', label: 'Escalader à la RH (cas grave, harcèlement, etc.)' },
  { key: 'survey', label: 'Lancer un sondage flash ciblé' },
];
export const CLIMATE_SUGGESTIONS = [
  'Programmer un sondage flash sur la charge de travail.',
  'Organiser une réunion équipe sur les valeurs.',
];

// --- VQ.6 Conflits planning ---------------------------------------------------
export interface SchedulingConflict {
  id: string; title: string; request: string; consequence: string; need: string; available: string; options: string[];
}
export function schedulingConflicts(team: EmployeeRecord[]): SchedulingConflict[] {
  if (team.length < 2) return [];
  const a = team[0]; const b = team[1] ?? team[0];
  return [
    {
      id: 'conf-1', title: `Conflit demande ${a.firstName} vs couverture caisse`,
      request: `Demande de congé : ${a.firstName} ${a.lastName} du 01–05/06`,
      consequence: 'Caisse Yopougon en sous-effectif les 03/06 et 04/06',
      need: '3 personnes minimum', available: `2 disponibles ces 2 jours (${b.firstName} + Mariam)`,
      options: [
        `Refuser la demande de ${a.firstName} pour ces 2 dates`,
        `Valider ${a.firstName} et trouver un renfort externe`,
        `Repositionner ${b.firstName} ou Mariam sur la caisse`,
        'Demander une astreinte à un autre membre',
        'Valider sans solution (sous-effectif assumé)',
      ],
    },
  ];
}
