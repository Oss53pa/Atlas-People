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
