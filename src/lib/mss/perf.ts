import type { EmployeeRecord } from '../../data/mock';

/** M4 — dérivations déterministes de performance (démo). Aucune donnée sensible :
 *  pas de montants salariaux, recommandations Oui/Non uniquement. Tout est dérivé
 *  d'un hash stable de l'id collaborateur pour rester déterministe et indépendant
 *  de l'ordre d'affichage. */

const TODAY = '2026-05-28';
function hash(id: string): number { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return h; }
function isoAddDays(iso: string, n: number) { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
export const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
export function daysBetween(a: string, b: string) { return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86400000); }

export type OkrStatus = 'achieved' | 'ahead' | 'ontrack' | 'atrisk' | 'low';
export const OKR_STATUS_META: Record<OkrStatus, { label: string; tone: 'ok' | 'info' | 'warn' | 'danger' }> = {
  achieved: { label: 'Atteint', tone: 'ok' },
  ahead: { label: 'En avance', tone: 'ok' },
  ontrack: { label: 'En cours', tone: 'info' },
  atrisk: { label: 'En risque', tone: 'warn' },
  low: { label: 'Bas', tone: 'danger' },
};
function statusFor(pct: number): OkrStatus {
  if (pct >= 100) return 'achieved';
  if (pct >= 75) return 'ahead';
  if (pct >= 45) return 'ontrack';
  if (pct >= 25) return 'atrisk';
  return 'low';
}

export interface Okr { title: string; alignedOn: string; progress: number; status: OkrStatus }
export interface MemberOkr { progress: number; alignedOn: string; objectives: Okr[] }

const OBJ_TITLES = [
  'Augmenter le CA du segment', 'Lancer 3 nouvelles offres', 'Améliorer le NPS client',
  'Réduire le délai de traitement', 'Fiabiliser le reporting mensuel', 'Former 2 référents internes',
  'Optimiser la couverture de poste', 'Déployer le nouveau process qualité',
];
const ALIGN = ['+15% CA département', 'NPS +10 pts', 'Turn-over < 8%'];

export function memberOkr(e: EmployeeRecord): MemberOkr {
  const h = hash(e.id);
  const n = 2 + (h % 2); // 2 ou 3 objectifs
  const objectives: Okr[] = Array.from({ length: n }, (_, i) => {
    const p = ((h >> (i * 3)) % 11) * 9 + (i * 7); // 0..~100
    const progress = Math.max(8, Math.min(100, p));
    return {
      title: OBJ_TITLES[(h + i) % OBJ_TITLES.length],
      alignedOn: ALIGN[(h + i) % ALIGN.length],
      progress,
      status: statusFor(progress),
    };
  });
  const progress = Math.round(objectives.reduce((s, o) => s + o.progress, 0) / objectives.length);
  return { progress, alignedOn: ALIGN[h % ALIGN.length], objectives };
}

export interface EvalState { autoEval: boolean; autoEvalDate?: string; managerDrafted: boolean; interviewDate?: string; signed: boolean; status: 'pending' | 'inprogress' | 'done' }
export function memberEval(e: EmployeeRecord): EvalState {
  const h = hash(e.id);
  const autoEval = h % 5 !== 0; // ~80%
  const managerDrafted = autoEval && h % 3 === 0;
  const signed = managerDrafted && h % 7 === 0;
  return {
    autoEval,
    autoEvalDate: autoEval ? isoAddDays('2026-05-10', h % 15) : undefined,
    managerDrafted,
    interviewDate: autoEval ? isoAddDays('2026-06-08', h % 12) : undefined,
    signed,
    status: signed ? 'done' : autoEval ? 'inprogress' : 'pending',
  };
}

export interface OneOnOne { lastDate: string; daysSince: number; nextDate?: string; prepared: boolean; overdue: boolean }
export function memberOneOnOne(e: EmployeeRecord): OneOnOne {
  const h = hash(e.id);
  const daysSince = 3 + (h % 22);
  const lastDate = isoAddDays(TODAY, -daysSince);
  const overdue = daysSince > 10; // cadence hebdomadaire
  const nextDate = overdue ? undefined : isoAddDays(TODAY, (h % 4));
  return { lastDate, daysSince, nextDate, prepared: h % 2 === 0, overdue };
}

export interface Recognition360 { sent: number; received: number; score: number }
export function member360(e: EmployeeRecord): Recognition360 {
  const h = hash(e.id);
  const sent = 4 + (h % 3);
  return { sent, received: sent - (h % 2), score: Math.round((37 + (h % 9)) ) / 10 }; // 3.7..4.6
}

export interface RecogStat { count: number; lastDate?: string; lastBadge?: string; lastMessage?: string }
export const BADGES = [
  { key: 'reactivity', label: 'Réactivité', emoji: '🚀' },
  { key: 'excellence', label: 'Excellence', emoji: '💎' },
  { key: 'collaboration', label: 'Collaboration', emoji: '🤝' },
  { key: 'performance', label: 'Performance', emoji: '🎯' },
  { key: 'innovation', label: 'Innovation', emoji: '🌟' },
  { key: 'learning', label: 'Apprentissage', emoji: '📚' },
];
export function memberRecognition(e: EmployeeRecord): RecogStat {
  const h = hash(e.id);
  const count = h % 3; // 0,1,2
  if (count === 0) return { count: 0 };
  const b = BADGES[h % BADGES.length];
  return { count, lastDate: isoAddDays(TODAY, -(h % 20)), lastBadge: `${b.emoji} ${b.label}`, lastMessage: 'Contribution remarquée ce trimestre.' };
}
