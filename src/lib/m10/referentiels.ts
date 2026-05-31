/**
 * M10 CARRIÈRES & SUCCESSION — référentiels du module.
 * Filières métier, niveaux, programmes hauts potentiels, échelles de readiness.
 */
import type { CareerPathType, SuccessorReadiness, HighPotProgram } from './types';

export const PATH_TYPE_META: Record<CareerPathType, { label: string; hint: string; icon: string }> = {
  vertical:   { label: 'Vertical (management)', hint: 'Évolution hiérarchique : équipe → département → entreprise', icon: 'TrendingUp' },
  horizontal: { label: 'Horizontal (transverse)', hint: 'Mobilité entre métiers / fonctions',                       icon: 'ArrowLeftRight' },
  expert:     { label: 'Expert (IC)',            hint: 'Filière individual contributor · expertise approfondie',     icon: 'Star' },
};

export const READINESS_META: Record<SuccessorReadiness, { label: string; tone: 'ok' | 'amber' | 'neutral'; hint: string }> = {
  ready_now:   { label: 'Ready Now',     tone: 'ok',      hint: 'Prêt immédiatement · plan de prise de fonction' },
  '1_2_years': { label: '1-2 ans',       tone: 'amber',   hint: 'Prêt dans 1 à 2 ans · plan de développement actif' },
  '3_5_years': { label: '3-5 ans',       tone: 'neutral', hint: 'Potentiel long terme · à développer significativement' },
};

export const HIGH_POT_PROGRAMS: Record<HighPotProgram, { label: string; durationMonths: number; targets: string }> = {
  leadership_excellence: { label: 'Leadership Excellence',   durationMonths: 18, targets: 'Futurs directeurs & C-level · 360° · coaching exécutif · projet stratégique' },
  expert_track:          { label: 'Expert Track',            durationMonths: 24, targets: 'Spécialistes IC · certifications · publications · conférences' },
  next_managers:         { label: 'Next Managers',           durationMonths: 12, targets: 'Premiers pas managériaux · formation 40h · mentor senior · première équipe' },
  global_mobility:       { label: 'Global Mobility (UEMOA)', durationMonths: 24, targets: 'Préparation mobilité multi-pays · langues · culture · réseau' },
};

export const BENCH_STRENGTH_META = {
  strong:   { label: 'Solide',     tone: 'ok'      as const, hint: '≥ 2 successeurs ready_now ou 1_2_years' },
  adequate: { label: 'Adéquate',   tone: 'info'    as const, hint: '1 successeur ready_now ou 2 en 1-2 ans' },
  weak:     { label: 'Fragile',    tone: 'amber'   as const, hint: 'Aucun ready_now · 1 successeur en 1-2 ans' },
  none:     { label: 'Critique',   tone: 'danger'  as const, hint: 'Aucun successeur identifié · risque opérationnel' },
};

export const CAREER_LEVELS = [
  { level: 1, title: 'Junior',                 scope: 'Individuel',  minYears: 0 },
  { level: 2, title: 'Confirmé',               scope: 'Individuel',  minYears: 2 },
  { level: 3, title: 'Senior',                 scope: 'Individuel',  minYears: 5 },
  { level: 4, title: 'Lead / Référent',        scope: 'Équipe',      minYears: 7 },
  { level: 5, title: 'Manager / Principal',    scope: 'Équipe',      minYears: 9 },
  { level: 6, title: 'Director / Distinguished', scope: 'Département', minYears: 12 },
  { level: 7, title: 'VP / Fellow',            scope: 'Entreprise',  minYears: 15 },
];

export const PROGRAM_TONES: Record<HighPotProgram, 'ok' | 'amber' | 'info' | 'warn'> = {
  leadership_excellence: 'amber',
  expert_track:          'ok',
  next_managers:         'info',
  global_mobility:       'warn',
};

export const RETENTION_BENCHMARKS = [
  { bucket: 'Top talents (A3/B3)',  target: '> 95 %' },
  { bucket: 'High performers (A2/B2)', target: '> 90 %' },
  { bucket: 'Core (C2/C3)',          target: '> 85 %' },
  { bucket: 'Bas perf (C1)',         target: '< 50 % (intentionnel)' },
];

export const CAREER_ACTIONS = [
  'Formation certifiante (M11)',
  'Coaching exécutif',
  'Mentorat (interne ou externe)',
  'Mission cross-fonctionnelle',
  'Stretch assignment',
  'Mobilité interne (M4 avenant)',
  'Expatriation (M6 expat)',
  'Conférence / publication',
  'Programme MBA / Executive Education',
];
