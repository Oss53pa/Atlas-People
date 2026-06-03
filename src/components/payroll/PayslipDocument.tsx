/**
 * Template officiel du bulletin de paie (imprimable / PDF via window.print).
 * Trois modèles de présentation au choix, tous alimentés par le MÊME moteur
 * déterministe (lib/payroll) — aucun chiffre n'est saisi en dur :
 *   - 'standard'  : présentation OHADA d'origine (Gains / Retenues).
 *   - 'clarifie'  : modèle « fiche de paie clarifiée » (part salarié + part employeur).
 *   - 'classique' : modèle bulletin de salaire classique (taux & cotisations patronales).
 */
import { ShieldCheck } from 'lucide-react';
import { Money } from '../../lib/money';
import type { PayslipComputation } from '../../lib/payroll';
import type { PayslipLine } from '../../lib/payroll/types';
import { matricule, mobileMoney, type EmployeeRecord } from '../../data/mock';
import { countryByCode } from '../../data/countries';

export type PayslipTemplate = 'standard' | 'clarifie' | 'classique';

export const PAYSLIP_TEMPLATES: { key: PayslipTemplate; label: string }[] = [
  { key: 'standard', label: 'Standard OHADA' },
  { key: 'clarifie', label: 'Clarifié' },
  { key: 'classique', label: 'Classique' },
];

export function PayslipDocument({
  employee,
  computation,
  period,
  tenantName = 'Atlas Demo SA',
  template = 'standard',
}: {
  employee: EmployeeRecord;
  computation: PayslipComputation;
  period: string;
  tenantName?: string;
  template?: PayslipTemplate;
}) {
  const { result, verification, accounting } = computation;
  const currency = result.currency;
  const M = (u: string) => Money.fromJSON({ units: u, currency });
  const fmt = (n: number) => Money.of(Math.round(n), currency).format();
  const country = countryByCode(employee.countryCode);

  const earnings = result.lines.filter((l) => l.kind === 'earning');
  const combos = combinedRows(result.lines);

  const totalGains = M(result.grossTotalUnits);
  const totalRetenues = totalGains.subtract(M(result.netToPayUnits));
  const totalPatronal = M(result.totalEmployerContributionUnits).add(M(result.totalEmployerTaxUnits));
  const auditHash = pseudoHash(`${matricule(employee)}|${period}|${result.netToPayUnits}`);
  const templateLabel = PAYSLIP_TEMPLATES.find((t) => t.key === template)?.label ?? '';

  return (
    <div className="payslip-print mx-auto w-full max-w-[780px] bg-white p-7 text-ink sm:p-9">
      {/* En-tête */}
      <div className="flex items-start justify-between border-b-2 border-ink pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber/15">
            <svg viewBox="0 0 64 64" className="h-6 w-6">
              <path d="M32 14 L50 50 H41 L32 31 L23 50 H14 Z" fill="#C97E12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold leading-tight text-ink">{tenantName}</p>
            <p className="text-[11px] font-medium text-ink-500">
              {country.name} · {country.socialFund}
            </p>
            <p className="text-[11px] font-medium text-ink-400">NCC / RCCM : —— · BP ——, {country.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-deep">Bulletin de paie</p>
          <p className="text-xl font-extrabold text-ink">{period}</p>
          <p className="text-[11px] font-medium text-ink-500">Devise : {currency} (FCFA)</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Modèle : {templateLabel}</p>
        </div>
      </div>

      {/* Identité salarié */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-b border-line py-4 sm:grid-cols-4">
        <Field label="Matricule" value={matricule(employee)} mono />
        <Field label="Nom & prénom" value={`${employee.lastName} ${employee.firstName}`} />
        <Field label="Emploi" value={employee.role} />
        <Field label="Département" value={employee.department} />
        <Field label="Date d'embauche" value={new Date(employee.hireDate).toLocaleDateString('fr-FR')} />
        <Field label="Type de contrat" value={employee.contractType} />
        <Field label="Parts fiscales" value={String(employee.fiscalParts)} mono />
        <Field label="Régime / Pays" value={`${country.socialFund} · ${employee.countryCode}`} />
      </div>

      {/* Tableau des rubriques (selon le modèle) */}
      {template === 'standard' && <StandardTable earnings={earnings} combos={combos} fmt={fmt} M={M} totalGains={totalGains} totalRetenues={totalRetenues} />}
      {template === 'clarifie' && <ClarifieTable earnings={earnings} combos={combos} fmt={fmt} M={M} totalGains={totalGains} totalRetenues={totalRetenues} totalPatronal={totalPatronal} />}
      {template === 'classique' && <ClassiqueTable earnings={earnings} combos={combos} fmt={fmt} M={M} totalGains={totalGains} totalRetenues={totalRetenues} totalPatronal={totalPatronal} />}

      {/* Net à payer */}
      <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row">
        <div className="flex flex-1 items-center justify-between rounded-2xl border border-amber/25 bg-amber/[0.10] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-deep">Net à payer</p>
            <p className="text-[11px] font-medium text-ink-500">Versé sur Mobile Money {mobileMoney(employee)}</p>
          </div>
          <p className="font-mono text-2xl font-semibold text-amber-deep">{M(result.netToPayUnits).formatWithCurrency()}</p>
        </div>
      </div>

      {/* Récap secondaire */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Recap label="Net imposable" value={M(result.grossTaxableUnits).subtract(M(result.totalEmployeeContributionUnits)).format()} />
        <Recap label="Total charges patronales" value={totalPatronal.format()} />
        <Recap label="Coût total employeur" value={M(result.employerCostUnits).format()} accent />
      </div>

      {/* Charges patronales (détail) — uniquement en modèle standard (intégrées au tableau sinon) */}
      {template === 'standard' && combos.some((r) => r.patAmount != null) && (
        <div className="mt-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            Charges patronales (information)
          </p>
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {combos.filter((r) => r.patAmount != null).map((r) => (
              <div key={`pat-${r.code}`} className="flex justify-between border-b border-line py-1 text-[11px]">
                <span className="text-ink-500">{r.patLabel ?? r.label}</span>
                <span className="font-mono text-ink-700">{fmt(r.patAmount!)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pied de page légal + intégrité */}
      <div className="mt-6 flex flex-col gap-3 border-t border-line pt-4 text-[10px] text-ink-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-ok/10 px-2 py-0.5 font-bold text-ok">
            <ShieldCheck size={11} /> {verification.ok ? 'Double vérification OK' : 'Écart détecté'}
          </span>
          <span>Écriture comptable {accounting.balanced ? 'équilibrée' : 'déséquilibrée'}</span>
        </div>
        <div className="font-mono">Empreinte audit : {auditHash}…</div>
      </div>
      <p className="mt-2 text-[10px] font-medium text-ink-400">
        Bulletin établi conformément au régime {country.socialFund} ({country.name}). À conserver sans limitation de durée.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modèle 1 — Standard OHADA (Gains / Retenues)                        */
/* ------------------------------------------------------------------ */
function StandardTable({ earnings, combos, fmt, M, totalGains, totalRetenues }: TableProps) {
  const retenues = combos.filter((r) => r.empAmount != null);
  return (
    <table className="mt-4 w-full border-collapse text-[12px]">
      <thead>
        <tr className="border-b border-ink text-left text-[10px] font-bold uppercase tracking-wider text-ink-500">
          <th className="py-2">Désignation</th>
          <th className="py-2 text-right">Base</th>
          <th className="py-2 text-right">Taux</th>
          <th className="py-2 text-right">Gains</th>
          <th className="py-2 text-right">Retenues</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {earnings.map((l) => (
          <tr key={l.code}>
            <td className="py-1.5 font-semibold text-ink">{l.label}</td>
            <td className="py-1.5 text-right font-mono text-ink-500">{M(l.baseUnits).format()}</td>
            <td className="py-1.5 text-right text-ink-400">—</td>
            <td className="py-1.5 text-right font-mono font-semibold text-ink">{M(l.amountUnits).format()}</td>
            <td className="py-1.5 text-right text-ink-400">—</td>
          </tr>
        ))}
        {retenues.map((r) => (
          <tr key={r.code}>
            <td className="py-1.5 font-semibold text-ink">{r.label}</td>
            <td className="py-1.5 text-right font-mono text-ink-500">{r.base != null ? fmt(r.base) : '—'}</td>
            <td className="py-1.5 text-right font-mono text-ink-400">{r.empRate != null ? `${r.empRate.toFixed(2)}%` : '—'}</td>
            <td className="py-1.5 text-right text-ink-400">—</td>
            <td className="py-1.5 text-right font-mono font-semibold text-danger">{fmt(r.empAmount!)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-ink text-[12px] font-bold">
          <td className="py-2" colSpan={3}>Totaux</td>
          <td className="py-2 text-right font-mono">{totalGains.format()}</td>
          <td className="py-2 text-right font-mono text-danger">{totalRetenues.format()}</td>
        </tr>
      </tfoot>
    </table>
  );
}

/* ------------------------------------------------------------------ */
/* Modèle 2 — Fiche de paie clarifiée (part salarié + part employeur)  */
/* ------------------------------------------------------------------ */
function ClarifieTable({ earnings, combos, fmt, M, totalGains, totalRetenues, totalPatronal }: TableProps) {
  return (
    <table className="mt-4 w-full border-collapse text-[11.5px]">
      <thead>
        <tr className="border-b border-ink text-left text-[9.5px] font-bold uppercase tracking-wider text-ink-500">
          <th className="py-2">Désignation</th>
          <th className="py-2 text-right">Base</th>
          <th className="py-2 text-right">Taux sal.</th>
          <th className="py-2 text-right text-ok">Gain</th>
          <th className="py-2 text-right text-danger">Retenue</th>
          <th className="py-2 text-right text-ink-400">Part employeur</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {earnings.map((l) => (
          <tr key={l.code}>
            <td className="py-1.5 font-semibold text-ink">{l.label}</td>
            <td className="py-1.5 text-right font-mono text-ink-500">{M(l.baseUnits).format()}</td>
            <td className="py-1.5 text-right text-ink-400">—</td>
            <td className="py-1.5 text-right font-mono font-semibold text-ink">{M(l.amountUnits).format()}</td>
            <td className="py-1.5 text-right text-ink-400">—</td>
            <td className="py-1.5 text-right text-ink-400">—</td>
          </tr>
        ))}
        {combos.map((r) => (
          <tr key={r.code} className={r.empAmount == null ? 'text-ink-500' : ''}>
            <td className="py-1.5 font-semibold text-ink">{r.label}</td>
            <td className="py-1.5 text-right font-mono text-ink-500">{r.base != null ? fmt(r.base) : '—'}</td>
            <td className="py-1.5 text-right font-mono text-ink-400">{r.empRate != null ? `${r.empRate.toFixed(2)}%` : '—'}</td>
            <td className="py-1.5 text-right text-ink-400">—</td>
            <td className="py-1.5 text-right font-mono font-semibold text-danger">{r.empAmount != null ? fmt(r.empAmount) : '—'}</td>
            <td className="py-1.5 text-right font-mono text-ink-600">{r.patAmount != null ? fmt(r.patAmount) : '—'}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-ink text-[12px] font-bold">
          <td className="py-2" colSpan={3}>Totaux</td>
          <td className="py-2 text-right font-mono">{totalGains.format()}</td>
          <td className="py-2 text-right font-mono text-danger">{totalRetenues.format()}</td>
          <td className="py-2 text-right font-mono text-ink-600">{totalPatronal!.format()}</td>
        </tr>
      </tfoot>
    </table>
  );
}

/* ------------------------------------------------------------------ */
/* Modèle 3 — Bulletin de salaire classique (taux & cotisations pat.)  */
/* ------------------------------------------------------------------ */
function ClassiqueTable({ earnings, combos, fmt, M, totalGains, totalRetenues, totalPatronal }: TableProps) {
  return (
    <table className="mt-4 w-full border-collapse text-[11.5px]">
      <thead>
        <tr className="border-b border-ink text-left text-[9.5px] font-bold uppercase tracking-wider text-ink-500">
          <th className="py-2">Rubriques</th>
          <th className="py-2 text-right">Base</th>
          <th className="py-2 text-right">Taux sal.</th>
          <th className="py-2 text-right">Montant sal.</th>
          <th className="py-2 text-right">Taux pat.</th>
          <th className="py-2 text-right">Cot. patronales</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {earnings.map((l) => (
          <tr key={l.code}>
            <td className="py-1.5 font-semibold text-ink">{l.label}</td>
            <td className="py-1.5 text-right font-mono text-ink-500">{M(l.baseUnits).format()}</td>
            <td className="py-1.5 text-right text-ink-400">—</td>
            <td className="py-1.5 text-right font-mono font-semibold text-ink">{M(l.amountUnits).format()}</td>
            <td className="py-1.5 text-right text-ink-400">—</td>
            <td className="py-1.5 text-right text-ink-400">—</td>
          </tr>
        ))}
        {combos.map((r) => (
          <tr key={r.code}>
            <td className="py-1.5 font-semibold text-ink">{r.label}</td>
            <td className="py-1.5 text-right font-mono text-ink-500">{r.base != null ? fmt(r.base) : '—'}</td>
            <td className="py-1.5 text-right font-mono text-ink-400">{r.empRate != null ? `${r.empRate.toFixed(2)}%` : '—'}</td>
            <td className="py-1.5 text-right font-mono font-semibold text-danger">{r.empAmount != null ? fmt(r.empAmount) : '—'}</td>
            <td className="py-1.5 text-right font-mono text-ink-400">{r.patRate != null ? `${r.patRate.toFixed(2)}%` : '—'}</td>
            <td className="py-1.5 text-right font-mono text-ink-600">{r.patAmount != null ? fmt(r.patAmount) : '—'}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-ink text-[12px] font-bold">
          <td className="py-2">Totaux</td>
          <td className="py-2" colSpan={2} />
          <td className="py-2 text-right font-mono text-danger">{totalRetenues.format()}</td>
          <td className="py-2 text-right font-mono text-ink-400">brut {totalGains.format()}</td>
          <td className="py-2 text-right font-mono text-ink-600">{totalPatronal!.format()}</td>
        </tr>
      </tfoot>
    </table>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

interface ComboRow {
  code: string;
  label: string;
  patLabel?: string;
  base?: number;
  empRate?: number;
  empAmount?: number; // magnitude positive de la retenue salariale
  patRate?: number;
  patAmount?: number; // part patronale (positive)
}

interface TableProps {
  earnings: PayslipLine[];
  combos: ComboRow[];
  fmt: (n: number) => string;
  M: (u: string) => Money;
  totalGains: Money;
  totalRetenues: Money;
  totalPatronal?: Money;
}

/**
 * Apparie les lignes salariales (cotisations, impôt, retenues diverses) avec
 * leur contrepartie patronale (`${code}_PAT`). Les taxes purement patronales
 * (FDFP…) et cotisations sans part salariale apparaissent en lignes patronales
 * seules. Tout est dérivé des lignes signées du moteur — aucun recalcul.
 */
function combinedRows(lines: PayslipLine[]): ComboRow[] {
  const num = (u: string) => Number(BigInt(u));
  const baseOf = (l: PayslipLine) =>
    l.kind === 'employer_contribution' && l.code.endsWith('_PAT') ? l.code.slice(0, -4) : l.code;

  const employerLines = lines.filter((l) => l.kind === 'employer_contribution' || l.kind === 'employer_tax');
  const employerByBase = new Map<string, PayslipLine>();
  for (const l of employerLines) employerByBase.set(baseOf(l), l);

  const rows: ComboRow[] = [];
  const pairedBases = new Set<string>();

  for (const l of lines) {
    if (l.kind !== 'employee_contribution' && l.kind !== 'tax' && l.kind !== 'deduction') continue;
    const pat = employerByBase.get(l.code);
    if (pat) pairedBases.add(l.code);
    rows.push({
      code: l.code,
      label: l.label,
      patLabel: pat?.label.replace(' (part patronale)', ''),
      base: l.baseUnits ? num(l.baseUnits) : undefined,
      empRate: l.rateBps ? l.rateBps / 100 : undefined,
      empAmount: Math.abs(num(l.amountUnits)),
      patRate: pat?.rateBps ? pat.rateBps / 100 : undefined,
      patAmount: pat ? num(pat.amountUnits) : undefined,
    });
  }

  // Lignes patronales sans contrepartie salariale (taxes FDFP, cotisations 100 % employeur).
  for (const l of employerLines) {
    const base = baseOf(l);
    if (pairedBases.has(base)) continue;
    rows.push({
      code: `${l.code}__patonly`,
      label: l.label.replace(' (part patronale)', ''),
      base: l.baseUnits ? num(l.baseUnits) : undefined,
      patRate: l.rateBps ? l.rateBps / 100 : undefined,
      patAmount: num(l.amountUnits),
    });
  }

  return rows;
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className={`text-[12px] font-semibold text-ink ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function Recap({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${accent ? 'border-amber/30 bg-amber/[0.06]' : 'border-line bg-surface2'}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className={`font-mono text-sm font-bold ${accent ? 'text-amber-deep' : 'text-ink'}`}>{value} FCFA</p>
    </div>
  );
}

function pseudoHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}
