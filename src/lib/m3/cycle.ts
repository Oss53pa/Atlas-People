/**
 * M3 — agrégats du cycle : calcule tous les bulletins du cycle (déterministe)
 * pour le cockpit, le journal, le calcul et la validation.
 */
import { EMPLOYEES, type EmployeeRecord } from '../../data/mock';
import { computeM3Bulletin } from './engine';
import { getRegime } from '../payroll/regimes';
import type { BulletinViewer, PayrollVariables, SaisieStatus } from './types';

export interface CycleBulletin {
  emp: EmployeeRecord;
  status: SaisieStatus;
  bulletin: BulletinViewer;
  prevNet: number;
}

export function cycleBulletins(
  variables: Record<string, PayrollVariables>,
  statuses: Record<string, SaisieStatus>,
  prevNet: Record<string, number>,
): CycleBulletin[] {
  return EMPLOYEES.map((emp) => ({
    emp,
    status: statuses[emp.id],
    bulletin: computeM3Bulletin(emp, variables[emp.id]),
    prevNet: prevNet[emp.id] ?? 0,
  }));
}

export interface CycleTotals {
  brut: number; net: number; cotisationsEmp: number; patronal: number; coutEmployeur: number;
  anomalies: number; blocking: number;
}

export function cycleTotals(rows: CycleBulletin[]): CycleTotals {
  return rows.reduce<CycleTotals>((t, r) => ({
    brut: t.brut + r.bulletin.brutTotal,
    net: t.net + r.bulletin.netAPayer,
    cotisationsEmp: t.cotisationsEmp + r.bulletin.totalCotisationsEmp,
    patronal: t.patronal + r.bulletin.totalPatronal,
    coutEmployeur: t.coutEmployeur + r.bulletin.coutEmployeur,
    anomalies: t.anomalies + r.bulletin.anomalies.length,
    blocking: t.blocking + (r.bulletin.emissionBlocked ? 1 : 0),
  }), { brut: 0, net: 0, cotisationsEmp: 0, patronal: 0, coutEmployeur: 0, anomalies: 0, blocking: 0 });
}

/** Récap par rubrique pour le journal de paie collectif. */
export interface RubriqueRecap { code: string; label: string; section: string; total: number; count: number; configured?: boolean }
export function recapByRubrique(rows: CycleBulletin[]): RubriqueRecap[] {
  const map = new Map<string, RubriqueRecap>();
  for (const r of rows) {
    const all = [
      ...r.bulletin.gains.map((l) => ({ ...l, section: 'Gains' })),
      ...r.bulletin.cotisationsEmp.map((l) => ({ ...l, section: 'Cotisations' })),
      ...r.bulletin.retenues.map((l) => ({ ...l, section: 'Retenues' })),
      ...r.bulletin.patronal.map((l) => ({ ...l, section: 'Patronal' })),
    ];
    for (const l of all) {
      const ex = map.get(l.code) ?? { code: l.code, label: l.label, section: l.section, total: 0, count: 0 };
      ex.total += l.montant; ex.count += 1;
      map.set(l.code, ex);
    }
  }
  return [...map.values()].sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
}

/** Ordre d'affichage des sections du livre de paie légal. */
export const RECAP_SECTIONS = ['Gains', 'Cotisations', 'Retenues', 'Patronal'] as const;
export type RecapSection = (typeof RECAP_SECTIONS)[number];

/**
 * Récap EXHAUSTIF : toutes les rubriques légalement attendues pour les régimes
 * présents dans le cycle (gains standards, cotisations salariales + IRPP,
 * charges & taxes patronales), fusionnées avec les montants réels. Les rubriques
 * paramétrées mais non mouvementées sur le cycle apparaissent à 0 (`count: 0`),
 * afin que le journal montre l'intégralité de la grille — pas seulement les
 * rubriques effectivement utilisées.
 */
export function fullRecapByRubrique(rows: CycleBulletin[]): RubriqueRecap[] {
  const map = new Map<string, RubriqueRecap>();
  const seed = (code: string, label: string, section: RecapSection) => {
    if (!map.has(code)) map.set(code, { code, label, section, total: 0, count: 0, configured: true });
  };

  // 1) Rubriques de gains standards émises par le moteur.
  seed('SAL_BASE', 'Salaire de base', 'Gains');
  seed('PRIME_IMP', 'Primes imposables', 'Gains');
  seed('IND_TRANSP', 'Indemnités non imposables', 'Gains');

  // 2) Grille des régimes présents (cotisations salariales/patronales, IRPP, taxes patronales).
  const regimeCodes = [...new Set(rows.map((r) => r.emp.countryCode))];
  for (const cc of regimeCodes) {
    let regime;
    try { regime = getRegime(cc); } catch { continue; }
    for (const c of regime.contributions) {
      if (c.employeeBps > 0) seed(c.code, c.label, 'Cotisations');
      if (c.employerBps > 0) seed(`${c.code}_PAT`, `${c.label} (part patronale)`, 'Patronal');
    }
    seed(regime.incomeTax.code, regime.incomeTax.label, 'Cotisations');
    for (const t of regime.employerTaxes) seed(t.code, t.label, 'Patronal');
  }

  // 3) Fusion des montants réels (et ajout des rubriques ponctuelles : avances, oppositions…).
  for (const r of rows) {
    const all = [
      ...r.bulletin.gains.map((l) => ({ ...l, section: 'Gains' as RecapSection })),
      ...r.bulletin.cotisationsEmp.map((l) => ({ ...l, section: 'Cotisations' as RecapSection })),
      ...r.bulletin.retenues.map((l) => ({ ...l, section: 'Retenues' as RecapSection })),
      ...r.bulletin.patronal.map((l) => ({ ...l, section: 'Patronal' as RecapSection })),
    ];
    for (const l of all) {
      const ex = map.get(l.code) ?? { code: l.code, label: l.label, section: l.section, total: 0, count: 0, configured: false };
      ex.total += l.montant; ex.count += 1;
      if (ex.label === l.code) ex.label = l.label;
      map.set(l.code, ex);
    }
  }

  const order: Record<string, number> = { Gains: 0, Cotisations: 1, Retenues: 2, Patronal: 3 };
  return [...map.values()].sort((a, b) =>
    order[a.section] - order[b.section] || Math.abs(b.total) - Math.abs(a.total) || a.code.localeCompare(b.code),
  );
}

/* ------------------------------------------------------------------ */
/* Modèle « Livre de paie » horizontal (1 colonne par salarié)         */
/* ------------------------------------------------------------------ */

const SECTION_ORDER: Record<string, number> = { Gains: 0, Cotisations: 1, Retenues: 2, Patronal: 3 };

export interface LivreRow {
  code: string;
  label: string;
  section: string;                 // Gains | Cotisations | Retenues | Patronal | Synthèse
  emphasis?: boolean;              // ligne d'agrégat (brut, net…) en gras
  amounts: Record<string, number>; // empId -> montant (signé tel quel)
  total: number;
}

export interface LivreDePaie {
  emps: EmployeeRecord[];
  lignes: LivreRow[];
}

/**
 * Construit le livre de paie horizontal : une colonne par collaborateur, une
 * ligne par rubrique mouvementée (union sur le cycle), suivie des agrégats de
 * synthèse (brut, net imposable, net à payer). 100 % dérivé des bulletins du
 * moteur déterministe.
 */
export function livreDePaie(rows: CycleBulletin[]): LivreDePaie {
  const emps = rows.map((r) => r.emp);

  // Métadonnées (label/section) des rubriques rencontrées, dans l'ordre légal.
  const meta = new Map<string, { label: string; section: string }>();
  for (const r of rows) {
    const sectioned = [
      ...r.bulletin.gains.map((l) => ({ l, section: 'Gains' })),
      ...r.bulletin.cotisationsEmp.map((l) => ({ l, section: 'Cotisations' })),
      ...r.bulletin.retenues.map((l) => ({ l, section: 'Retenues' })),
      ...r.bulletin.patronal.map((l) => ({ l, section: 'Patronal' })),
    ];
    for (const { l, section } of sectioned) if (!meta.has(l.code)) meta.set(l.code, { label: l.label, section });
  }
  const codes = [...meta.entries()].sort((a, b) => SECTION_ORDER[a[1].section] - SECTION_ORDER[b[1].section]);

  const amountFor = (r: CycleBulletin, code: string) => {
    const all = [...r.bulletin.gains, ...r.bulletin.cotisationsEmp, ...r.bulletin.retenues, ...r.bulletin.patronal];
    return all.find((l) => l.code === code)?.montant ?? 0;
  };

  const rubriqueRows: LivreRow[] = codes.map(([code, m]) => {
    const amounts: Record<string, number> = {};
    let total = 0;
    for (const r of rows) { const v = amountFor(r, code); amounts[r.emp.id] = v; total += v; }
    return { code, label: m.label, section: m.section, amounts, total };
  });

  const agg = (label: string, pick: (b: BulletinViewer) => number): LivreRow => {
    const amounts: Record<string, number> = {};
    let total = 0;
    for (const r of rows) { const v = pick(r.bulletin); amounts[r.emp.id] = v; total += v; }
    return { code: label, label, section: 'Synthèse', emphasis: true, amounts, total };
  };

  const synthese = [
    agg('Brut total', (b) => b.brutTotal),
    agg('Net imposable', (b) => b.baseIrpp),
    agg('Net à payer', (b) => b.netAPayer),
  ];

  return { emps, lignes: [...rubriqueRows, ...synthese] };
}

/* ------------------------------------------------------------------ */
/* Modèle « Journal de paie détaillé » par comptes                     */
/* ------------------------------------------------------------------ */

export interface JournalCompteCol { code: string; label: string; neg?: boolean }
export interface JournalCompteRow { emp: EmployeeRecord; values: number[] }
export interface JournalComptes {
  colonnes: JournalCompteCol[];
  lignes: JournalCompteRow[];
  totals: number[];
}

/** Colonnes du journal détaillé (comptes SYSCOHADA indicatifs). */
const JOURNAL_COLONNES: JournalCompteCol[] = [
  { code: '661', label: 'Salaire de base' },
  { code: '661', label: 'Salaire brut' },
  { code: '431', label: 'Cotisations sal.', neg: true },
  { code: '661', label: 'Salaire imposable' },
  { code: '447', label: 'Impôt / IRPP', neg: true },
  { code: '421', label: 'Retenues diverses', neg: true },
  { code: '422', label: 'Net à payer' },
  { code: '664', label: 'Charges patronales' },
  { code: '—', label: 'Coût employeur' },
];

/**
 * Journal de paie détaillé : une ligne par collaborateur, colonnes par comptes
 * (base, brut, cotisations, imposable, impôt, retenues, net, charges, coût).
 * Les valeurs sont reconstituées depuis les agrégats du bulletin déterministe.
 */
export function journalComptes(rows: CycleBulletin[]): JournalComptes {
  const valuesFor = (b: BulletinViewer): number[] => {
    const salaireBase = b.gains.find((l) => l.code === 'SAL_BASE')?.montant ?? 0;
    const cotisSociales = b.baseCnps - b.baseIrpp;          // = total cotisations salariales
    const impot = b.totalCotisationsEmp - cotisSociales;    // = IRPP seul
    return [salaireBase, b.brutTotal, cotisSociales, b.baseIrpp, impot, b.totalRetenues, b.netAPayer, b.totalPatronal, b.coutEmployeur];
  };
  const lignes = rows.map((r) => ({ emp: r.emp, values: valuesFor(r.bulletin) }));
  const totals = JOURNAL_COLONNES.map((_, i) => lignes.reduce((s, l) => s + l.values[i], 0));
  return { colonnes: JOURNAL_COLONNES, lignes, totals };
}
