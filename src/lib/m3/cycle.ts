/**
 * M3 — agrégats du cycle : calcule tous les bulletins du cycle (déterministe)
 * pour le cockpit, le journal, le calcul et la validation.
 */
import { EMPLOYEES, type EmployeeRecord } from '../../data/mock';
import { computeM3Bulletin } from './engine';
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
export interface RubriqueRecap { code: string; label: string; section: string; total: number; count: number }
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
