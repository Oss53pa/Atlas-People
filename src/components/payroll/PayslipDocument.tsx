/**
 * Template officiel du bulletin de paie (imprimable / PDF via window.print).
 * Présentation conforme aux usages SYSCOHADA / droit du travail local.
 * Les chiffres proviennent exclusivement du moteur déterministe.
 */
import { ShieldCheck } from 'lucide-react';
import { Money } from '../../lib/money';
import type { PayslipComputation } from '../../lib/payroll';
import { matricule, mobileMoney, type EmployeeRecord } from '../../data/mock';
import { countryByCode } from '../../data/countries';

export function PayslipDocument({
  employee,
  computation,
  period,
  tenantName = 'Atlas Demo SA',
}: {
  employee: EmployeeRecord;
  computation: PayslipComputation;
  period: string;
  tenantName?: string;
}) {
  const { result, verification, accounting } = computation;
  const currency = result.currency;
  const M = (u: string) => Money.fromJSON({ units: u, currency });
  const country = countryByCode(employee.countryCode);

  const earnings = result.lines.filter((l) => l.kind === 'earning');
  const retenues = result.lines.filter(
    (l) => l.kind === 'employee_contribution' || l.kind === 'tax' || l.kind === 'deduction',
  );
  const employerLines = result.lines.filter(
    (l) => l.kind === 'employer_contribution' || l.kind === 'employer_tax',
  );

  const totalGains = M(result.grossTotalUnits);
  const totalRetenues = totalGains.subtract(M(result.netToPayUnits));
  const auditHash = pseudoHash(`${matricule(employee)}|${period}|${result.netToPayUnits}`);

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

      {/* Tableau des rubriques */}
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
          {retenues.map((l) => (
            <tr key={l.code}>
              <td className="py-1.5 font-semibold text-ink">{l.label}</td>
              <td className="py-1.5 text-right font-mono text-ink-500">{M(l.baseUnits).format()}</td>
              <td className="py-1.5 text-right font-mono text-ink-400">
                {l.rateBps != null ? `${(l.rateBps / 100).toFixed(2)}%` : '—'}
              </td>
              <td className="py-1.5 text-right text-ink-400">—</td>
              <td className="py-1.5 text-right font-mono font-semibold text-danger">
                {M(l.amountUnits).format().replace('-', '')}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink text-[12px] font-bold">
            <td className="py-2" colSpan={3}>
              Totaux
            </td>
            <td className="py-2 text-right font-mono">{totalGains.format()}</td>
            <td className="py-2 text-right font-mono text-danger">{totalRetenues.format()}</td>
          </tr>
        </tfoot>
      </table>

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
        <Recap label="Total charges patronales" value={M(result.totalEmployerContributionUnits).add(M(result.totalEmployerTaxUnits)).format()} />
        <Recap label="Coût total employeur" value={M(result.employerCostUnits).format()} accent />
      </div>

      {/* Charges patronales (détail) */}
      {employerLines.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            Charges patronales (information)
          </p>
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {employerLines.map((l) => (
              <div key={l.code} className="flex justify-between border-b border-line py-1 text-[11px]">
                <span className="text-ink-500">{l.label}</span>
                <span className="font-mono text-ink-700">{M(l.amountUnits).format()}</span>
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
