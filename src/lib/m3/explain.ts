/**
 * M3 — Explication step-by-step du calcul d'un bulletin (doc 06 §2, doc 04 §10).
 * Reconstitue les étapes déterministes à partir des MÊMES valeurs que le moteur
 * (computePayslip) — aucune ré-estimation. Sert la transparence : Proph3t
 * EXPLIQUE, ne calcule jamais. Le détail IRPP est ventilé par tranche.
 */
import { computePayslip } from '../payroll';
import { getRegime } from '../payroll/regimes';
import { m3PayrollInput, m3ProRata } from './engine';
import { currencyOf } from '../../data/countries';
import { Money, type Currency } from '../money';
import type { EmployeeRecord } from '../../data/mock';
import type { PayrollVariables } from './types';

export interface ExplainRow { label: string; value: string; sub?: boolean }
export interface ExplainStep { n: number; title: string; note?: string; rows: ExplainRow[] }

const round = (n: number) => Math.round(n);

export function explainBulletin(emp: EmployeeRecord, v: PayrollVariables): ExplainStep[] {
  const cur: Currency = currencyOf(emp.countryCode);
  const regime = getRegime(emp.countryCode);
  const input = m3PayrollInput(emp, v);
  const proRata = m3ProRata(v);
  const { result } = computePayslip(input, regime);
  const num = (u: string) => Number(BigInt(u));
  const fmt = (n: number) => `${Money.of(round(n), cur).format()} FCFA`;
  const pct = (bps: number) => `${(bps / 100).toLocaleString('fr-FR')} %`;

  const grossTaxable = num(result.grossTaxableUnits);
  const grossTotal = num(result.grossTotalUnits);
  const employeeContrib = num(result.totalEmployeeContributionUnits);
  const incomeTax = num(result.incomeTaxUnits);
  const otherDeductions = num(result.totalOtherDeductionsUnits);
  const net = num(result.netToPayUnits);
  const employerCost = num(result.employerCostUnits);

  // Reconstitution déterministe des intermédiaires fiscaux (cf. PayrollEngine).
  const afterSocial = Math.max(0, grossTaxable - employeeContrib);
  const abatement = regime.incomeTax.abatementBps ? round((afterSocial * regime.incomeTax.abatementBps) / 10000) : 0;
  const netTaxable = Math.max(0, afterSocial - abatement);
  const parts = Math.max(1, Math.round(emp.fiscalParts));
  const perPart = round(netTaxable / parts);

  // Ventilation IRPP par tranche (sur le revenu par part, puis × parts).
  const trancheRows: ExplainRow[] = [];
  let prev = 0;
  let taxPerPart = 0;
  for (const b of regime.incomeTax.brackets) {
    const upper = b.upTo ?? Number.MAX_SAFE_INTEGER;
    const sliceTop = Math.min(perPart, upper);
    const slice = sliceTop - prev;
    if (slice > 0 && b.bps > 0) {
      const t = round((slice * b.bps) / 10000);
      taxPerPart += t;
      trancheRows.push({ label: `Tranche ${fmt(prev)} → ${b.upTo === null ? '∞' : fmt(upper)} · ${pct(b.bps)}`, value: fmt(t), sub: true });
    } else if (slice > 0) {
      trancheRows.push({ label: `Tranche ${fmt(prev)} → ${fmt(upper)} · 0 %`, value: fmt(0), sub: true });
    }
    prev = upper;
    if (perPart <= upper) break;
  }

  const gains = result.lines.filter((l) => l.kind === 'earning');
  const cotis = result.lines.filter((l) => l.kind === 'employee_contribution');
  const patronal = result.lines.filter((l) => l.kind === 'employer_contribution' || l.kind === 'employer_tax');

  return [
    {
      n: 1, title: 'Contexte & prorata',
      note: `Profil ${emp.countryCode} · ${parts} part(s) fiscale(s) · arrondi HALF_EVEN, franc entier.`,
      rows: [
        { label: 'Salaire de base (élément fixe)', value: fmt(emp.baseSalary) },
        { label: `Prorata appliqué (${v.joursTravailles}/${v.joursOuvrables} j)`, value: `${Math.round(proRata * 100)} %` },
        { label: 'Salaire base proratisé', value: fmt(round(emp.baseSalary * proRata)) },
      ],
    },
    {
      n: 2, title: 'Gains → Brut total',
      rows: [...gains.map((g) => ({ label: g.label, value: fmt(num(g.amountUnits)) })),
        { label: 'BRUT TOTAL', value: fmt(grossTotal) }],
    },
    {
      n: 3, title: 'Bases de cotisation',
      note: 'Base CNPS plafonnée par rubrique ; base imposable après cotisations & abattement.',
      rows: [
        { label: 'Brut social / imposable', value: fmt(grossTaxable) },
        { label: 'Cotisations salariales déductibles', value: `- ${fmt(employeeContrib)}`, sub: true },
        { label: `Abattement frais pro (${regime.incomeTax.abatementBps ? pct(regime.incomeTax.abatementBps) : '0 %'})`, value: `- ${fmt(abatement)}`, sub: true },
        { label: 'Net imposable', value: fmt(netTaxable) },
      ],
    },
    {
      n: 4, title: 'Cotisations sociales (part salariale)',
      rows: cotis.filter((c) => c.code !== regime.incomeTax.code).map((c) => ({
        label: `${c.label}${c.rateBps ? ` (${pct(c.rateBps)})` : ''}`, value: fmt(num(c.amountUnits)),
      })),
    },
    {
      n: 5, title: `${regime.incomeTax.label} — barème progressif`,
      note: `Quotient familial : net imposable ${fmt(netTaxable)} ÷ ${parts} part(s) = ${fmt(perPart)} par part, barème appliqué puis × ${parts}.`,
      rows: [
        ...trancheRows,
        { label: `Impôt par part`, value: fmt(taxPerPart), sub: true },
        { label: `IRPP total (× ${parts} parts)`, value: fmt(incomeTax) },
      ],
    },
    {
      n: 6, title: 'Retenues diverses',
      rows: otherDeductions > 0
        ? result.lines.filter((l) => l.kind === 'deduction').map((d) => ({ label: d.label, value: fmt(Math.abs(num(d.amountUnits))) }))
        : [{ label: 'Aucune retenue ce mois', value: fmt(0) }],
    },
    {
      n: 7, title: 'Net à payer',
      note: 'Brut − cotisations − impôt − retenues.',
      rows: [
        { label: 'Brut total', value: fmt(grossTotal), sub: true },
        { label: 'Cotisations & impôts', value: `- ${fmt(employeeContrib + incomeTax)}`, sub: true },
        { label: 'Retenues diverses', value: `- ${fmt(otherDeductions)}`, sub: true },
        { label: 'NET À PAYER', value: fmt(net) },
      ],
    },
    {
      n: 8, title: 'Charges patronales & coût employeur',
      rows: [
        ...patronal.map((p) => ({ label: `${p.label}${p.rateBps ? ` (${pct(p.rateBps)})` : ''}`, value: fmt(num(p.amountUnits)), sub: true })),
        { label: 'COÛT EMPLOYEUR TOTAL', value: fmt(employerCost) },
      ],
    },
  ];
}
