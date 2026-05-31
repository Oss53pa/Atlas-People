/**
 * M8 ÉVALUATIONS — référentiels du module.
 * Cycles, échelles, dimensions, 9-box, plans de développement.
 */
import type { EvalCycleType, EvaluationStatus, TalentBoxKey, DevPlanCategory } from './types';

// ─────────────────────────────────────── Types de cycles
export const CYCLE_TYPE_META: Record<EvalCycleType, { label: string; hint: string }> = {
  annuel:      { label: 'Annuel',         hint: 'Performance globale + plan développement · cycle Q1' },
  semestriel:  { label: 'Semestriel',     hint: 'Bilan mi-année · ajustement objectifs' },
  mid_year:    { label: 'Mid-year review', hint: 'Bilan intermédiaire léger · juin' },
  probatoire:  { label: "Période d'essai", hint: 'Évaluation pré-validation PE (lien M4)' },
  '360':       { label: 'Cycle 360°',     hint: 'Feedback multi-participants (manager + peers + reports + cross)' },
};

// ─────────────────────────────────────── Échelle de notation
export type ScoreTone = 'danger' | 'warn' | 'info' | 'ok' | 'amber';
export interface ScoreScaleRow { value: number; label: string; tone: ScoreTone; hint: string }
export const SCORE_SCALE: ScoreScaleRow[] = [
  { value: 1, label: 'Insuffisant',          tone: 'danger', hint: 'Sous-performance manifeste' },
  { value: 2, label: 'Améliorations attendues', tone: 'warn', hint: 'Sous les attentes · plan d\'action' },
  { value: 3, label: 'Attendu / solide',     tone: 'info',   hint: 'Atteint les attentes du rôle' },
  { value: 4, label: 'Dépasse les attentes', tone: 'ok',     hint: 'Au-dessus du rôle · contributions clés' },
  { value: 5, label: 'Outstanding',          tone: 'amber',  hint: 'Référence · impact exceptionnel' },
];

// ─────────────────────────────────────── Dimensions évaluées (somme = 100 %)
export const EVAL_DIMENSIONS = [
  { code: 'OKR',          label: 'Atteinte OKR',          weight: 35, hint: 'Cycle OKR M7 — score moyen pondéré' },
  { code: 'COMP',         label: 'Compétences techniques', weight: 25, hint: 'Skills cartographiés M9' },
  { code: 'BEHAVIOR',     label: 'Comportements / valeurs', weight: 20, hint: 'Valeurs Atlas · 7 axes' },
  { code: 'LEADERSHIP',   label: 'Leadership / influence', weight: 10, hint: 'Pour les rôles d\'encadrement (sinon 0)' },
  { code: 'CULTURE',      label: 'Culture & collaboration', weight: 10, hint: 'Esprit d\'équipe, transverse' },
];

// ─────────────────────────────────────── Statut évaluation
export const STATUS_META: Record<EvaluationStatus, { label: string; tone: 'neutral' | 'amber' | 'info' | 'ok' | 'warn' }> = {
  not_started:            { label: 'À démarrer',          tone: 'neutral' },
  auto_in_progress:       { label: 'Auto-éval en cours',  tone: 'amber'   },
  auto_submitted:         { label: 'Auto-éval soumise',    tone: 'info'   },
  manager_in_progress:    { label: 'Manager en cours',     tone: 'amber'  },
  manager_submitted:      { label: 'Manager soumise',      tone: 'info'   },
  feedback_360:           { label: '360° en cours',        tone: 'warn'   },
  calibration:            { label: 'En calibration',       tone: 'warn'   },
  shared:                 { label: 'Restituée',            tone: 'ok'     },
  signed:                 { label: 'Signée',               tone: 'ok'     },
  closed:                 { label: 'Clôturée',             tone: 'neutral'},
};

// ─────────────────────────────────────── 9-box performance × potentiel
export const BOX_LABELS: Record<TalentBoxKey, { label: string; hint: string; tone: 'ok' | 'amber' | 'warn' | 'danger' | 'neutral' | 'info' }> = {
  // Haut potentiel
  A1: { label: 'Risk',          hint: 'Haut potentiel · faible perf · enquêter (mauvais fit poste ?)',     tone: 'amber'   },
  A2: { label: 'High potential', hint: 'Haut potentiel · performance attendue · à développer',              tone: 'ok'      },
  A3: { label: 'Top talent',    hint: 'Haut potentiel · haute perf · à fidéliser absolument',              tone: 'amber'   },
  // Core
  B1: { label: 'Inconsistent',   hint: 'Potentiel moyen · faible perf · plan amélioration',                tone: 'warn'    },
  B2: { label: 'Core player',   hint: 'Solide contributeur · à reconnaître',                                tone: 'info'    },
  B3: { label: 'High performer', hint: 'Solide contributeur · haute perf · expert métier',                 tone: 'ok'      },
  // Faible potentiel
  C1: { label: 'Underperformer', hint: 'PIP / sortie · plan de réussite ou décision',                       tone: 'danger'  },
  C2: { label: 'Effective',     hint: 'Effectif au poste · stable',                                          tone: 'neutral' },
  C3: { label: 'Specialist',    hint: 'Expert technique stable · pas d\'évolution managériale',             tone: 'ok'      },
};

export function boxKey(performance: 'low' | 'meets' | 'exceeds', potential: 'low' | 'core' | 'high'): TalentBoxKey {
  const row = potential === 'high' ? 'A' : potential === 'core' ? 'B' : 'C';
  const col = performance === 'low' ? 1 : performance === 'meets' ? 2 : 3;
  return `${row}${col}` as TalentBoxKey;
}

// ─────────────────────────────────────── Plans de développement
export const DEV_CATEGORIES: Record<DevPlanCategory, { label: string; icon: string }> = {
  formation:           { label: 'Formation',                 icon: 'GraduationCap' },
  mentorat:            { label: 'Mentorat',                  icon: 'Users' },
  coaching:            { label: 'Coaching exécutif',         icon: 'Sparkles' },
  mission_transverse:  { label: 'Mission transverse',        icon: 'Target' },
  'mobilité_interne':  { label: 'Mobilité interne',          icon: 'ArrowLeftRight' },
  lecture_certif:      { label: 'Lecture / certification',   icon: 'BookOpen' },
  shadow:              { label: 'Shadow / observation',      icon: 'Eye' },
  autre:               { label: 'Autre',                     icon: 'Plus' },
};

// ─────────────────────────────────────── Wizard étapes
export const EVAL_WIZARD_STEPS = [
  'Auto-évaluation collaborateur',
  'Évaluation manager',
  'Feedback 360° (optionnel)',
  'Calibration commission RH',
  'Restitution collaborateur',
  'Signature électronique',
  'Plan de développement',
] as const;

// ─────────────────────────────────────── SLA / cadences
export const SLA = {
  autoEvalDays: 14,             // délai auto-éval depuis lancement
  managerEvalDays: 21,
  calibrationGapDays: 7,
  shareWithinDays: 5,           // restitution dans les 5 j post-calibration
  signWithinDays: 14,
  oneOnOneDefaultCadence: 'biweekly' as const,
};

// ─────────────────────────────────────── Valeurs Atlas (7 axes comportement)
export const ATLAS_VALUES = [
  'Excellence opérationnelle',
  'Customer obsession',
  'Esprit d\'équipe / transverse',
  'Ownership / responsabilité',
  'Innovation / curiosité',
  'Intégrité / éthique OHADA',
  'Inclusivité / diversité',
];

// ─────────────────────────────────────── Échelle de calibration
export const CALIBRATION_DISTRIBUTION = [
  { label: 'Top talents (A3, B3)', target: '15-20 %' },
  { label: 'High performers (A2, B2)', target: '50-60 %' },
  { label: 'Core (C2, C3)', target: '15-20 %' },
  { label: 'À surveiller (B1, A1)', target: '5-10 %' },
  { label: 'PIP / sortie (C1)', target: '< 5 %' },
];
