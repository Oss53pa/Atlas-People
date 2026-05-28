/**
 * M3 PAIE — moteur de bulletin temps réel.
 * Déterministe : dérive un PayrollInput à partir du dossier + variables du mois,
 * délègue au coeur lib/payroll (computePayslip), puis structure le bulletin pour
 * la sidebar live. Détecte les anomalies bloquantes (doc 04 §4.5 / §6).
 */
import { computePayslip } from '../payroll';
import { getRegime } from '../payroll/regimes';
import { ComplianceGuard } from '../compliance/ComplianceGuard';
import type { EmployeeRecord } from '../../data/mock';
import { currencyOf } from '../../data/countries';
import type { PayrollInput } from '../payroll/types';
import type { BulletinViewer, BulletinRow, BulletinAnomaly, PayrollVariables } from './types';

const round = (n: number) => Math.round(n);

/** Taux horaire de référence = salaire base / (jours ouvrables × 8h). */
export function tauxHoraire(baseSalary: number, joursOuvrables: number): number {
  return baseSalary / (Math.max(1, joursOuvrables) * 8);
}

/** Prorata de paie applicable (jours travaillés / ouvrables). */
export function m3ProRata(v: PayrollVariables): number {
  return v.applyProrata && v.joursOuvrables > 0 ? Math.min(1, v.joursTravailles / v.joursOuvrables) : 1;
}

/**
 * Dérive l'entrée déterministe (PayrollInput) du collaborateur depuis ses
 * variables du mois. Utilisée par le bulletin live ET l'aperçu imprimable —
 * un seul point de vérité pour le calcul.
 */
export function m3PayrollInput(emp: EmployeeRecord, v: PayrollVariables): PayrollInput {
  const proRataPct = m3ProRata(v);
  const baseSalary = round(emp.baseSalary * proRataPct);
  const th = tauxHoraire(emp.baseSalary, v.joursOuvrables);
  const hsValue = round(th * 1.15 * v.hs15) + round(th * 1.5 * v.hs50);

  const primesTaxable = v.primes.filter((p) => p.taxable).reduce((s, p) => s + p.amount, 0);
  const primesNonTax = v.primes.filter((p) => !p.taxable).reduce((s, p) => s + p.amount, 0);
  const ndfTaxable = v.ndf.filter((n) => n.taxable).reduce((s, n) => s + n.amount, 0);
  const ndfNonTax = v.ndf.filter((n) => !n.taxable).reduce((s, n) => s + n.amount, 0);

  const taxableAllowances = round(emp.taxableAllowances * proRataPct) + hsValue + primesTaxable + ndfTaxable;
  const nonTaxableAllowances = round(emp.nonTaxableAllowances * proRataPct) + primesNonTax + ndfNonTax;

  const otherDeductions = [
    ...(emp.otherDeductions ?? []),
    ...v.retenues.map((r) => ({ code: r.code, label: r.label, amount: r.amount, account: r.account ?? '427000' })),
    ...(v.avance > 0 ? [{ code: 'X300_AVANCE', label: 'Avance sur salaire', amount: v.avance, account: '421000' }] : []),
  ];

  return { baseSalary, taxableAllowances, nonTaxableAllowances, fiscalParts: emp.fiscalParts, otherDeductions };
}

/** Recalcule le bulletin d'un collaborateur pour ses variables du mois. */
export function computeM3Bulletin(emp: EmployeeRecord, v: PayrollVariables): BulletinViewer {
  const currency = currencyOf(emp.countryCode);
  const regime = getRegime(emp.countryCode);
  const proRataPct = m3ProRata(v);

  const { result } = computePayslip(m3PayrollInput(emp, v), regime);

  const num = (u: string) => Number(BigInt(u));

  // Structuration des lignes par section (à partir des lignes signées du coeur).
  const gains: BulletinRow[] = [];
  const cotisationsEmp: BulletinRow[] = [];
  const retenues: BulletinRow[] = [];
  const patronal: BulletinRow[] = [];

  for (const l of result.lines) {
    const row: BulletinRow = {
      code: l.code, label: l.label, base: l.baseUnits ? num(l.baseUnits) : undefined,
      taux: l.rateBps ? l.rateBps / 100 : undefined, montant: num(l.amountUnits),
    };
    if (l.kind === 'earning') gains.push(row);
    else if (l.kind === 'employee_contribution' || l.kind === 'tax') cotisationsEmp.push(row);
    else if (l.kind === 'deduction') retenues.push(row);
    else patronal.push(row);
  }

  const brutTotal = num(result.grossTotalUnits);
  const baseCnps = num(result.grossTaxableUnits);
  const baseIrpp = num(result.grossTaxableUnits) - num(result.totalEmployeeContributionUnits);
  const totalCotisationsEmp = num(result.totalEmployeeContributionUnits) + num(result.incomeTaxUnits);
  const totalRetenues = num(result.totalOtherDeductionsUnits);
  const netAPayer = num(result.netToPayUnits);
  const totalPatronal = num(result.totalEmployerContributionUnits) + num(result.totalEmployerTaxUnits);
  const coutEmployeur = num(result.employerCostUnits);

  // --- Détection d'anomalies temps réel ---
  const anomalies: BulletinAnomaly[] = [];
  const smig = ComplianceGuard.monthlySmig(emp.countryCode);
  if (netAPayer < 0) anomalies.push({ severity: 'danger', code: 'NET_NEGATIF', message: 'Net à payer négatif.', blocking: true });
  else if (netAPayer < smig && proRataPct >= 1) anomalies.push({ severity: 'danger', code: 'NET_SOUS_SMIG', message: `Net (${netAPayer.toLocaleString('fr-FR')}) inférieur au SMIG ${emp.countryCode} (${smig.toLocaleString('fr-FR')}).`, blocking: true });
  if (totalCotisationsEmp + totalRetenues > brutTotal) anomalies.push({ severity: 'danger', code: 'COTIS_SUP_BRUT', message: 'Retenues totales supérieures au brut.', blocking: true });
  if (brutTotal > 0 && totalRetenues > brutTotal * 0.33) anomalies.push({ severity: 'danger', code: 'QUOTITE', message: 'Retenues > 33 % du brut (quotité saisissable dépassée).', blocking: true });
  if (v.joursTravailles > v.joursOuvrables) anomalies.push({ severity: 'danger', code: 'JOURS_INCOHERENTS', message: 'Jours travaillés supérieurs aux jours ouvrables.', blocking: true });

  return {
    currency, proRataPct,
    gains, cotisationsEmp, retenues, patronal,
    brutTotal, baseCnps, baseIrpp, totalCotisationsEmp, totalRetenues, netAPayer, totalPatronal, coutEmployeur,
    anomalies, emissionBlocked: anomalies.some((a) => a.blocking),
  };
}
