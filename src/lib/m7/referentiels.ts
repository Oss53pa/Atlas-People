/**
 * M7 OKR — référentiels du module Objectifs & Key Results.
 * Cycles, échelles, cadences, types KR.
 */
import type { ConfidenceLevel, KrType, OkrLevel } from './types';

// ─────────────────────────────────────── Levels (cascade)
export const LEVEL_META: Record<OkrLevel, { label: string; tone: 'amber' | 'info' | 'ok' | 'neutral'; order: number }> = {
  company:    { label: 'Entreprise',    tone: 'amber',   order: 1 },
  department: { label: 'Département',   tone: 'info',    order: 2 },
  team:       { label: 'Équipe',        tone: 'ok',      order: 3 },
  individual: { label: 'Individuel',    tone: 'neutral', order: 4 },
};

// ─────────────────────────────────────── Confidence
export const CONFIDENCE_META: Record<ConfidenceLevel, { label: string; tone: 'ok' | 'amber' | 'danger'; hint: string }> = {
  green:  { label: 'On track',  tone: 'ok',     hint: 'Progression conforme — atteinte probable ≥ 70 %' },
  amber:  { label: 'À risque',  tone: 'amber',  hint: 'Vigilance — actions correctrices à engager' },
  red:    { label: 'En retard', tone: 'danger', hint: "À débloquer — atteinte improbable sans réajustement" },
};

// ─────────────────────────────────────── KR types
export const KR_TYPE_META: Record<KrType, { label: string; hint: string; suffix?: string }> = {
  numeric:    { label: 'Numérique',          hint: 'ex. 50 → 100 (nb actions)' },
  percent:    { label: 'Pourcentage',        hint: '0 → 100 %', suffix: '%' },
  binary:     { label: 'Binaire (0/1)',      hint: 'Réalisé ou non' },
  milestone:  { label: 'Jalons',             hint: '3-5 jalons à valider en séquence' },
  currency:   { label: 'Montant (FCFA)',     hint: 'ex. CA, économies, levée de fonds', suffix: 'FCFA' },
};

// ─────────────────────────────────────── Méthodologie scoring
export const SCORING_GRID = [
  { range: '0.0 – 0.3', label: 'Sous-atteinte',     tone: 'danger' as const, hint: 'Objectif raté, à analyser' },
  { range: '0.4 – 0.6', label: 'Atteinte partielle', tone: 'amber'  as const, hint: 'En progression, à pousser' },
  { range: '0.7 – 0.9', label: 'Excellente',          tone: 'ok'     as const, hint: 'Cible atteinte — sweet spot' },
  { range: '1.0',        label: 'Dépassée',           tone: 'amber'  as const, hint: 'Pas assez ambitieux ?' },
];

// ─────────────────────────────────────── Cycles
export const CYCLES = [
  { id: 'cyc-2026-q2', ref: 'OKR-2026-Q2', label: 'Q2 2026', startDate: '2026-04-01', endDate: '2026-06-30', status: 'active'  as const, checkInCadence: 'weekly'  as const, reviewDate: '2026-07-05' },
  { id: 'cyc-2026-q1', ref: 'OKR-2026-Q1', label: 'Q1 2026', startDate: '2026-01-01', endDate: '2026-03-31', status: 'closed'  as const, checkInCadence: 'weekly'  as const, reviewDate: '2026-04-05' },
  { id: 'cyc-2026-q3', ref: 'OKR-2026-Q3', label: 'Q3 2026', startDate: '2026-07-01', endDate: '2026-09-30', status: 'planned' as const, checkInCadence: 'weekly'  as const },
  { id: 'cyc-2025-q4', ref: 'OKR-2025-Q4', label: 'Q4 2025', startDate: '2025-10-01', endDate: '2025-12-31', status: 'closed'  as const, checkInCadence: 'biweekly' as const, reviewDate: '2026-01-05' },
];

// ─────────────────────────────────────── Cadences
export const CHECKIN_CADENCES = [
  { code: 'weekly',   label: 'Hebdomadaire', hint: 'Toutes les semaines (lundi/vendredi)' },
  { code: 'biweekly', label: 'Bi-mensuelle', hint: 'Toutes les 2 semaines' },
] as const;

// ─────────────────────────────────────── Bonnes pratiques
export const BEST_PRACTICES = [
  '3 à 5 objectifs maximum par personne / équipe',
  '2 à 5 Key Results par objectif',
  'KR mesurables, datés, ambitieux (target stretch 0.7)',
  'Cascade : aligner ≥ 80 % des OKRs équipe vers un OKR entreprise',
  'Check-in hebdomadaire — moins de 10 min',
  'Confidence honnête : amber/red préférable à green forcé',
  'Revue de cycle systématique : retrospectif + scoring + carry-over',
  'OKR ≠ liste de tâches : focus impact, pas activité',
];

// ─────────────────────────────────────── Templates par fonction
export interface ObjectiveTemplate { code: string; level: OkrLevel; title: string; krs: string[]; appliesTo: string }
export const OBJECTIVE_TEMPLATES: ObjectiveTemplate[] = [
  { code: 'GROW_REVENUE', level: 'company', title: 'Accélérer la croissance du chiffre d\'affaires',
    krs: ['Atteindre 850 M FCFA de revenu Q', 'Acquérir 12 nouveaux comptes Tier 1', 'Activer 2 nouveaux pays (présence commerciale)'], appliesTo: 'Direction' },
  { code: 'CUSTOMER_NPS', level: 'department', title: 'Faire passer Atlas en référence customer-loved',
    krs: ['Porter le NPS de 32 → 55', 'Réduire le churn de 18 % → 8 %', 'Augmenter le NRR à 115 %'], appliesTo: 'Customer Success' },
  { code: 'TECH_VELOCITY', level: 'team', title: 'Doubler la vélocité de livraison produit',
    krs: ['Réduire le lead-time PR < 36 h', 'Passer à 95 % de coverage tests', 'Déployer 3x par semaine en prod'], appliesTo: 'Engineering' },
  { code: 'HR_RECRUT', level: 'department', title: 'Industrialiser le recrutement Tech',
    krs: ['Embaucher 8 ingénieurs senior', 'Time-to-fill ≤ 40 j', 'NPS candidat 60+'], appliesTo: 'RH' },
];

// ─────────────────────────────────────── Color helpers
export function confidenceFromProgress(progress: number, expected: number): ConfidenceLevel {
  if (progress >= expected * 0.9) return 'green';
  if (progress >= expected * 0.6) return 'amber';
  return 'red';
}
