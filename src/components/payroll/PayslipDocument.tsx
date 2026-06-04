/**
 * Template officiel du bulletin de paie (imprimable / PDF via window.print).
 *
 * Design refait : épuré, monochrome, dense, type DOCUMENT LÉGAL plutôt que
 * card premium. Garanti 1 page A4 portrait à l'impression grâce à :
 *   • Police 8-10pt à l'écran, 7-9pt à l'impression
 *   • Tableau unique central avec sections (gains / cotisations / impôts / taxes)
 *   • Bandeau net à payer sobre, pas de gradient amber agressif
 *   • Récap 6 cases ligne unique
 *   • Footer 2 lignes denses
 *
 * Trois modèles de présentation au choix, tous alimentés par le MÊME moteur
 * déterministe (lib/payroll) — aucun chiffre n'est saisi en dur.
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
  const netImposable = M(result.grossTaxableUnits).subtract(M(result.totalEmployeeContributionUnits));
  const employeurCost = M(result.employerCostUnits);
  const auditHash = pseudoHash(`${matricule(employee)}|${period}|${result.netToPayUnits}`);
  const templateLabel = PAYSLIP_TEMPLATES.find((t) => t.key === template)?.label ?? '';
  const bulletinRef = `BUL-${period.replace(/[^A-Z0-9]/gi, '').slice(0, 6)}-${matricule(employee).slice(-3)}`;

  return (
    <div className="payslip-print mx-auto w-full max-w-[760px] bg-white px-6 py-5 text-[11px] leading-snug text-ink">

      {/* ═══ EN-TÊTE — Identité société + référence bulletin ═══ */}
      <header className="flex items-start justify-between gap-4 border-b-2 border-ink pb-2">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-deep/10 ring-1 ring-amber-deep/20">
            <svg viewBox="0 0 64 64" className="h-5 w-5">
              <path d="M32 14 L50 50 H41 L32 31 L23 50 H14 Z" fill="#C97E12" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold uppercase leading-tight tracking-wide text-ink">{tenantName}</p>
            <p className="text-[10px] font-medium leading-tight text-ink-700">{country.name} · {country.socialFund}</p>
            <p className="text-[9px] font-medium leading-tight text-ink-500">NCC ——— · RCCM ——— · BP ———, {country.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-deep">Bulletin de paie</p>
          <p className="font-mono text-[16px] font-extrabold leading-tight text-ink">{period}</p>
          <p className="mono text-[9px] font-medium text-ink-500">N° {bulletinRef}</p>
          <p className="text-[8px] font-semibold uppercase tracking-wider text-ink-400">Modèle : {templateLabel} · {currency}</p>
        </div>
      </header>

      {/* ═══ IDENTITÉ SALARIÉ — bloc compact 2 colonnes ═══ */}
      <section className="grid grid-cols-2 gap-x-6 gap-y-0.5 border-b border-ink/30 py-2 text-[10px]">
        <IdRow label="Matricule"      value={matricule(employee)} mono />
        <IdRow label="Date d'embauche" value={new Date(employee.hireDate).toLocaleDateString('fr-FR')} />
        <IdRow label="Nom &amp; prénom" value={`${employee.lastName} ${employee.firstName}`} />
        <IdRow label="Type de contrat" value={employee.contractType} />
        <IdRow label="Emploi"          value={employee.role} />
        <IdRow label="Parts fiscales"  value={String(employee.fiscalParts)} mono />
        <IdRow label="Département"     value={employee.department} />
        <IdRow label="Régime / Pays"   value={`${country.socialFund} · ${employee.countryCode}`} />
      </section>

      {/* ═══ TABLEAU DES RUBRIQUES — selon modèle ═══ */}
      {template === 'standard'  && <StandardTable  earnings={earnings} combos={combos} fmt={fmt} M={M} totalGains={totalGains} totalRetenues={totalRetenues} />}
      {template === 'clarifie'  && <ClarifieTable  earnings={earnings} combos={combos} fmt={fmt} M={M} totalGains={totalGains} totalRetenues={totalRetenues} totalPatronal={totalPatronal} />}
      {template === 'classique' && <ClassiqueTable earnings={earnings} combos={combos} fmt={fmt} M={M} totalGains={totalGains} totalRetenues={totalRetenues} totalPatronal={totalPatronal} />}

      {/* ═══ NET À PAYER — bandeau sobre ═══ */}
      <section className="mt-3 flex items-center justify-between border-y-[1.5px] border-amber-deep bg-amber-deep/[0.05] px-4 py-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-deep">Net à payer</p>
          <p className="text-[10px] font-medium text-ink-700">Versé sur Mobile Money {mobileMoney(employee)}</p>
        </div>
        <p className="mono text-[22px] font-extrabold leading-none text-amber-deep">
          {M(result.netToPayUnits).formatWithCurrency()}
        </p>
      </section>

      {/* ═══ RÉCAP — 6 cases en ligne ═══ */}
      <section className="mt-2 grid grid-cols-3 gap-x-3 gap-y-0.5 border-b border-ink/15 py-2 text-[10px] sm:grid-cols-6">
        <RecapItem label="Net imposable"    value={netImposable.format()} />
        <RecapItem label="Total gains"      value={totalGains.format()} />
        <RecapItem label="Total retenues"   value={totalRetenues.format()} tone="danger" />
        <RecapItem label="Charges patron."  value={totalPatronal.format()} />
        <RecapItem label="Coût employeur"   value={employeurCost.format()} tone="accent" />
        <RecapItem label="Heures travail."  value="173,33 h" mono />
      </section>

      {/* ═══ CHARGES PATRONALES (info) — affichage standard uniquement ═══ */}
      {template === 'standard' && combos.some((r) => r.patAmount != null) && (
        <section className="mt-2 border-b border-ink/15 pb-2">
          <p className="mb-0.5 text-[8px] font-bold uppercase tracking-wider text-ink-500">
            Charges patronales (information employeur)
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0 text-[10px] sm:grid-cols-3">
            {combos.filter((r) => r.patAmount != null).map((r) => (
              <div key={`pat-${r.code}`} className="flex items-baseline justify-between border-b border-dotted border-ink/15 py-0.5">
                <span className="truncate text-ink-700">{r.patLabel ?? r.label}</span>
                <span className="mono font-semibold text-ink">{fmt(r.patAmount!)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ FOOTER — intégrité + mention légale ═══ */}
      <footer className="mt-2 flex flex-col gap-1 text-[8.5px] text-ink-500">
        <div className="flex items-center justify-between border-t border-ink/30 pt-1.5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-bold ${verification.ok ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'}`}>
              <ShieldCheck size={10} /> {verification.ok ? 'Double vérification OK' : 'Écart détecté'}
            </span>
            <span className="text-ink-600">Écriture comptable {accounting.balanced ? 'équilibrée' : 'déséquilibrée'}</span>
          </div>
          <span className="mono">Empreinte audit · <span className="font-semibold text-ink-700">{auditHash}</span></span>
        </div>
        <p className="leading-snug">
          Bulletin établi conformément au régime {country.socialFund} ({country.name}). À conserver sans limitation de durée.
          Document généré par <span className="font-bold text-amber-deep">Atlas People</span> · Atlas Studio · OHADA 17 États.
        </p>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
 * Modèle 1 — STANDARD OHADA (Gains / Retenues séparées)
 * ══════════════════════════════════════════════════════════════════ */
function StandardTable({ earnings, combos, fmt, M, totalGains, totalRetenues }: TableProps) {
  const retenues = combos.filter((r) => r.empAmount != null);
  return (
    <table className="payslip-table mt-2 w-full border-collapse text-[10px]">
      <thead>
        <tr className="border-y border-ink text-left text-[8px] font-bold uppercase tracking-wider text-ink-700">
          <th className="w-[42%] py-1">Désignation</th>
          <th className="py-1 text-right">Base</th>
          <th className="py-1 text-right">Taux</th>
          <th className="py-1 text-right">Gains</th>
          <th className="py-1 text-right">Retenues</th>
        </tr>
      </thead>
      <tbody>
        <SectionHeader colSpan={5} title="Gains" />
        {earnings.map((l) => (
          <tr key={l.code} className="border-b border-dotted border-ink/15">
            <td className="py-0.5 font-medium text-ink">{l.label}</td>
            <td className="py-0.5 text-right mono text-ink-700">{M(l.baseUnits).format()}</td>
            <td className="py-0.5 text-right text-ink-400">—</td>
            <td className="py-0.5 text-right mono font-semibold text-ink">+ {M(l.amountUnits).format()}</td>
            <td className="py-0.5 text-right text-ink-400">—</td>
          </tr>
        ))}
        <SectionHeader colSpan={5} title="Cotisations &amp; impôts (part salariale)" />
        {retenues.map((r) => (
          <tr key={r.code} className="border-b border-dotted border-ink/15">
            <td className="py-0.5 font-medium text-ink">{r.label}</td>
            <td className="py-0.5 text-right mono text-ink-700">{r.base != null ? fmt(r.base) : '—'}</td>
            <td className="py-0.5 text-right mono text-ink-500">{r.empRate != null ? `${r.empRate.toFixed(2)}%` : '—'}</td>
            <td className="py-0.5 text-right text-ink-400">—</td>
            <td className="py-0.5 text-right mono font-semibold text-danger">− {fmt(r.empAmount!)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-ink text-[10.5px] font-bold">
          <td className="py-1" colSpan={3}>Totaux</td>
          <td className="py-1 text-right mono text-ink">{totalGains.format()}</td>
          <td className="py-1 text-right mono text-danger">{totalRetenues.format()}</td>
        </tr>
      </tfoot>
    </table>
  );
}

/* ══════════════════════════════════════════════════════════════════
 * Modèle 2 — CLARIFIÉ (part salarié + part employeur côte à côte)
 * ══════════════════════════════════════════════════════════════════ */
function ClarifieTable({ earnings, combos, fmt, M, totalGains, totalRetenues, totalPatronal }: TableProps) {
  return (
    <table className="payslip-table mt-2 w-full border-collapse text-[9.5px]">
      <thead>
        <tr className="border-y border-ink text-left text-[7.5px] font-bold uppercase tracking-wider text-ink-700">
          <th className="w-[34%] py-1">Désignation</th>
          <th className="py-1 text-right">Base</th>
          <th className="py-1 text-right">Taux sal.</th>
          <th className="py-1 text-right text-ok">Gain</th>
          <th className="py-1 text-right text-danger">Retenue</th>
          <th className="py-1 text-right text-ink-500">Part employeur</th>
        </tr>
      </thead>
      <tbody>
        <SectionHeader colSpan={6} title="Gains" />
        {earnings.map((l) => (
          <tr key={l.code} className="border-b border-dotted border-ink/15">
            <td className="py-0.5 font-medium text-ink">{l.label}</td>
            <td className="py-0.5 text-right mono text-ink-700">{M(l.baseUnits).format()}</td>
            <td className="py-0.5 text-right text-ink-400">—</td>
            <td className="py-0.5 text-right mono font-semibold text-ink">+ {M(l.amountUnits).format()}</td>
            <td className="py-0.5 text-right text-ink-400">—</td>
            <td className="py-0.5 text-right text-ink-400">—</td>
          </tr>
        ))}
        <SectionHeader colSpan={6} title="Cotisations sociales (CNPS · santé · prestations familiales)" />
        {combos.map((r) => (
          <tr key={r.code} className="border-b border-dotted border-ink/15">
            <td className="py-0.5 font-medium text-ink">{r.label}</td>
            <td className="py-0.5 text-right mono text-ink-700">{r.base != null ? fmt(r.base) : '—'}</td>
            <td className="py-0.5 text-right mono text-ink-500">{r.empRate != null ? `${r.empRate.toFixed(2)}%` : '—'}</td>
            <td className="py-0.5 text-right text-ink-400">—</td>
            <td className="py-0.5 text-right mono font-semibold text-danger">{r.empAmount != null ? `− ${fmt(r.empAmount)}` : '—'}</td>
            <td className="py-0.5 text-right mono text-ink-700">{r.patAmount != null ? fmt(r.patAmount) : '—'}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-ink text-[10px] font-bold">
          <td className="py-1" colSpan={3}>Totaux</td>
          <td className="py-1 text-right mono text-ink">{totalGains.format()}</td>
          <td className="py-1 text-right mono text-danger">{totalRetenues.format()}</td>
          <td className="py-1 text-right mono text-ink-700">{totalPatronal!.format()}</td>
        </tr>
      </tfoot>
    </table>
  );
}

/* ══════════════════════════════════════════════════════════════════
 * Modèle 3 — CLASSIQUE (taux & cotisations patronales détaillées)
 * ══════════════════════════════════════════════════════════════════ */
function ClassiqueTable({ earnings, combos, fmt, M, totalGains, totalRetenues, totalPatronal }: TableProps) {
  return (
    <table className="payslip-table mt-2 w-full border-collapse text-[9.5px]">
      <thead>
        <tr className="border-y border-ink text-left text-[7.5px] font-bold uppercase tracking-wider text-ink-700">
          <th className="w-[30%] py-1">Rubriques</th>
          <th className="py-1 text-right">Base</th>
          <th className="py-1 text-right">Taux sal.</th>
          <th className="py-1 text-right">Mont. sal.</th>
          <th className="py-1 text-right">Taux pat.</th>
          <th className="py-1 text-right">Cot. patronales</th>
        </tr>
      </thead>
      <tbody>
        <SectionHeader colSpan={6} title="Gains" />
        {earnings.map((l) => (
          <tr key={l.code} className="border-b border-dotted border-ink/15">
            <td className="py-0.5 font-medium text-ink">{l.label}</td>
            <td className="py-0.5 text-right mono text-ink-700">{M(l.baseUnits).format()}</td>
            <td className="py-0.5 text-right text-ink-400">—</td>
            <td className="py-0.5 text-right mono font-semibold text-ink">+ {M(l.amountUnits).format()}</td>
            <td className="py-0.5 text-right text-ink-400">—</td>
            <td className="py-0.5 text-right text-ink-400">—</td>
          </tr>
        ))}
        <SectionHeader colSpan={6} title="Cotisations &amp; taxes patronales" />
        {combos.map((r) => (
          <tr key={r.code} className="border-b border-dotted border-ink/15">
            <td className="py-0.5 font-medium text-ink">{r.label}</td>
            <td className="py-0.5 text-right mono text-ink-700">{r.base != null ? fmt(r.base) : '—'}</td>
            <td className="py-0.5 text-right mono text-ink-500">{r.empRate != null ? `${r.empRate.toFixed(2)}%` : '—'}</td>
            <td className="py-0.5 text-right mono font-semibold text-danger">{r.empAmount != null ? `− ${fmt(r.empAmount)}` : '—'}</td>
            <td className="py-0.5 text-right mono text-ink-500">{r.patRate != null ? `${r.patRate.toFixed(2)}%` : '—'}</td>
            <td className="py-0.5 text-right mono text-ink-700">{r.patAmount != null ? fmt(r.patAmount) : '—'}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-ink text-[10px] font-bold">
          <td className="py-1">Totaux</td>
          <td className="py-1" colSpan={2} />
          <td className="py-1 text-right mono text-danger">{totalRetenues.format()}</td>
          <td className="py-1 text-right mono text-ink-500">brut {totalGains.format()}</td>
          <td className="py-1 text-right mono text-ink-700">{totalPatronal!.format()}</td>
        </tr>
      </tfoot>
    </table>
  );
}

/* ══════════════════════════════════════════════════════════════════
 * Sub-components
 * ══════════════════════════════════════════════════════════════════ */

function SectionHeader({ colSpan, title }: { colSpan: number; title: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="bg-ink/[0.04] px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-ink-700"
        dangerouslySetInnerHTML={{ __html: title }} />
    </tr>
  );
}

function IdRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dotted border-ink/10 py-0.5">
      <span className="text-[8.5px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
      <span className={`text-[10px] font-semibold text-ink ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function RecapItem({ label, value, tone, mono }: { label: string; value: string; tone?: 'danger' | 'accent'; mono?: boolean }) {
  const valueCls = tone === 'danger' ? 'text-danger' : tone === 'accent' ? 'text-amber-deep' : 'text-ink';
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-dotted border-ink/10 py-0.5">
      <span className="text-[8px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
      <span className={`text-[10px] font-bold ${mono ? 'font-mono' : 'font-mono'} ${valueCls}`}>{value}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
 * Helpers (inchangés — moteur déterministe partagé)
 * ══════════════════════════════════════════════════════════════════ */

interface ComboRow {
  code: string;
  label: string;
  patLabel?: string;
  base?: number;
  empRate?: number;
  empAmount?: number;
  patRate?: number;
  patAmount?: number;
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

function pseudoHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}
