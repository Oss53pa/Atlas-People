import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Sparkles, Calculator, BookOpen, ChevronDown, Send, Loader2, FileText, SlidersHorizontal } from 'lucide-react';
import { PayslipModal } from '../components/payroll/PayslipModal';
import { Brand } from '../components/ui/Brand';
import { Card, CardHeader } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatusPill } from '../components/ui/StatusPill';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Money } from '../lib/money';
import { computePayslip, getRegime, type PayslipLine } from '../lib/payroll';
import { postRunToFna } from '../lib/fna/postToFna';
import type { FnaPostResult } from '../lib/fna/types';
import { useAppStore } from '../store/useAppStore';
import { countryByCode } from '../data/countries';
import { employeeName } from '../data/mock';
import { cn } from '../lib/cn';
import { useRoster } from '../lib/m1/roster';

const PERIOD = 'Mai 2026';

export function PaiePage() {
  const activeCountry = useAppStore((s) => s.activeCountry);
  const country = countryByCode(activeCountry);
  const liveRoster = useRoster();
  const roster = liveRoster.filter((e) => e.countryCode === activeCountry);
  const [selectedId, setSelectedId] = useState(roster[0]?.id);
  const [showEmployer, setShowEmployer] = useState(false);
  const [fnaStatus, setFnaStatus] = useState<FnaPostResult | null>(null);
  const [fnaPosting, setFnaPosting] = useState(false);
  const [showBulletin, setShowBulletin] = useState(false);

  async function handlePostToFna() {
    setFnaPosting(true);
    setFnaStatus(null);
    const res = await postRunToFna(`${PERIOD}-${activeCountry}`);
    setFnaStatus(res);
    setFnaPosting(false);
  }

  const employee = roster.find((e) => e.id === selectedId) ?? roster[0];

  const computation = useMemo(() => {
    if (!employee || !country.configured) return null;
    const regime = getRegime(employee.countryCode);
    return computePayslip(
      {
        baseSalary: employee.baseSalary,
        taxableAllowances: employee.taxableAllowances,
        nonTaxableAllowances: employee.nonTaxableAllowances,
        fiscalParts: employee.fiscalParts,
        otherDeductions: employee.otherDeductions,
      },
      regime,
      employeeName(employee),
    );
  }, [employee, country.configured]);

  if (!country.configured) {
    return (
      <div className="animate-fade-up">
        <SectionHeader eyebrow="Bloc A · M3" title="Paie & déclarations" />
        <Card className="text-center">
          <p className="text-sm font-semibold text-ink">
            Le régime de paie de {country.name} n'est pas encore configuré.
          </p>
          <p className="mt-1 text-sm font-medium text-ink-400">
            Un module versionné par pays est requis ({country.socialFund}).
          </p>
        </Card>
      </div>
    );
  }

  if (!employee || !computation) return null;

  const { result, verification, accounting, emissionBlocked } = computation;
  const M = (u: string) => Money.fromJSON({ units: u, currency: result.currency });
  const net = M(result.netToPayUnits);

  const earnings = result.lines.filter((l) => l.kind === 'earning');
  const employeeContrib = result.lines.filter((l) => l.kind === 'employee_contribution');
  const taxLines = result.lines.filter((l) => l.kind === 'tax');
  const deductionLines = result.lines.filter((l) => l.kind === 'deduction');
  const employerLines = result.lines.filter(
    (l) => l.kind === 'employer_contribution' || l.kind === 'employer_tax',
  );

  return (
    <div className="animate-fade-up space-y-6">
      {showBulletin && (
        <PayslipModal
          employee={employee}
          computation={computation}
          period={PERIOD}
          onClose={() => setShowBulletin(false)}
        />
      )}
      <SectionHeader
        eyebrow="Bloc A · M3 — cœur dur"
        title="Paie & déclarations"
        description={`Paie SYSCOHADA en TypeScript pur · double vérification indépendante · ${country.flag} ${country.name} (${country.socialFund})`}
        action={
          <>
            <Link to="/paie/rubriques">
              <Button variant="outline" size="sm">
                <SlidersHorizontal size={14} /> Rubriques
              </Button>
            </Link>
            <Button size="sm" disabled={emissionBlocked}>
              <Calculator size={14} /> Lancer la campagne · {PERIOD}
            </Button>
          </>
        }
      />

      {/* Bandeau vérification */}
      <div
        className={cn(
          'flex items-center gap-3 rounded-2xl border px-4 py-3',
          emissionBlocked ? 'border-danger/30 bg-danger/[0.06]' : 'border-ok/25 bg-ok/[0.06]',
        )}
      >
        {emissionBlocked ? <ShieldAlert className="text-danger" size={20} /> : <ShieldCheck className="text-ok" size={20} />}
        <div className="flex-1">
          <p className={cn('text-sm font-bold', emissionBlocked ? 'text-danger' : 'text-ok')}>
            {emissionBlocked ? 'Émission bloquée — écart détecté' : 'Double vérification réussie — émission autorisée'}
          </p>
          <p className="text-[11px] font-medium text-ink-500">
            PayrollEngine + PayrollVerifier (implémentations indépendantes) · écriture comptable {accounting.balanced ? 'équilibrée' : 'déséquilibrée'}
          </p>
        </div>
        {verification.discrepancies.length > 0 && (
          <span className="mono text-xs font-bold text-danger">{verification.discrepancies.length} écart(s)</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Bulletin */}
        <div className="space-y-4 lg:col-span-2">
          {/* Sélecteur collaborateur */}
          <Card inset={false} className="overflow-hidden p-3">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              {roster.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2 transition-all',
                    e.id === employee.id ? 'border-amber/40 bg-amber/10' : 'border-line hover:bg-ink/[0.03]',
                  )}
                >
                  <Avatar name={employeeName(e)} size="xs" />
                  <span className="whitespace-nowrap text-xs font-bold text-ink">{employeeName(e)}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <Avatar name={employeeName(employee)} size="md" />
                <div>
                  <p className="text-base font-bold text-ink">{employeeName(employee)}</p>
                  <p className="text-xs font-medium text-ink-400">
                    {employee.role} · Bulletin {PERIOD}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowBulletin(true)}>
                  <FileText size={14} /> Voir le bulletin
                </Button>
                <span className="mono rounded-lg bg-ink/[0.05] px-2.5 py-1 text-[11px] font-bold text-ink-500">
                  v{result.regimeVersion}
                </span>
              </div>
            </div>

            <LineGroup title="Gains" lines={earnings} currency={result.currency} />
            <LineGroup title="Cotisations sociales (part salariale)" lines={employeeContrib} currency={result.currency} />
            <LineGroup title="Impôt sur le revenu" lines={taxLines} currency={result.currency} />
            <LineGroup title="Retenues diverses" lines={deductionLines} currency={result.currency} />

            {/* Net */}
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber/25 bg-amber/[0.10] px-5 py-4">
              <span className="text-sm font-bold uppercase tracking-wider text-ink-700">Net à payer</span>
              <span className="mono text-2xl font-semibold text-amber-deep">{net.formatWithCurrency()}</span>
            </div>

            {/* Vue employeur */}
            <button
              onClick={() => setShowEmployer((v) => !v)}
              className="mt-4 flex w-full items-center justify-between rounded-xl border border-line bg-surface2 px-4 py-2.5 text-sm font-bold text-ink-700 hover:border-amber/30"
            >
              <span>Vue employeur — charges patronales & coût total</span>
              <ChevronDown size={16} className={cn('transition-transform', showEmployer && 'rotate-180')} />
            </button>
            {showEmployer && (
              <div className="mt-3 animate-fade-up">
                <LineGroup title="Charges patronales & taxes" lines={employerLines} currency={result.currency} />
                <div className="mt-2 flex items-center justify-between rounded-xl bg-amber/[0.08] px-4 py-3">
                  <span className="text-sm font-bold text-ink">Coût total employeur</span>
                  <span className="mono text-lg font-bold text-amber-deep">
                    {M(result.employerCostUnits).formatWithCurrency()}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Explicabilité + Comptabilité */}
        <div className="space-y-4">
          <Card className="glass-amber">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber/20 text-amber-deep">
                <Sparkles size={16} />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">Pourquoi ce montant ?</p>
                <p className="text-[10px] font-semibold tracking-wider text-amber-deep"><Brand name="Proph3t" /> · explicabilité</p>
              </div>
            </div>
            <p className="text-sm font-medium leading-relaxed text-ink-700">{explain(result)}</p>
            <p className="mt-3 border-t border-amber/20 pt-3 text-[11px] font-medium text-ink-500">
              Le moteur calcule ; l'IA n'interprète que votre question — jamais le chiffre.
            </p>
          </Card>

          <Card>
            <CardHeader
              title="Écritures comptables"
              subtitle="Déversement Atlas FNA · SYSCOHADA"
              action={
                <StatusPill tone={accounting.balanced ? 'ok' : 'danger'}>
                  {accounting.balanced ? 'Équilibré' : 'Déséquilibré'}
                </StatusPill>
              }
            />
            <div className="space-y-1.5">
              {accounting.lines.map((l, i) => {
                const debit = M(l.debitUnits);
                const credit = M(l.creditUnits);
                return (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-surface2 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="mono rounded bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-ink-500">
                        {l.account}
                      </span>
                      <span className="text-xs font-semibold text-ink-700">{l.label}</span>
                    </div>
                    <span className={cn('mono text-xs font-bold', debit.isZero() ? 'text-info' : 'text-ink')}>
                      {debit.isZero() ? credit.format() : debit.format()}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-ink-500">
                <BookOpen size={13} /> Σ débit = Σ crédit
              </span>
              <span className="mono text-ink">{M(accounting.totalDebitUnits).format()}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              disabled={!accounting.balanced || emissionBlocked || fnaPosting}
              onClick={handlePostToFna}
            >
              {fnaPosting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Déverser dans Atlas FNA
            </Button>
            {fnaStatus && (
              <p
                className={cn(
                  'mt-2 rounded-lg px-3 py-2 text-[11px] font-semibold',
                  fnaStatus.status === 'error'
                    ? 'bg-danger/[0.08] text-danger'
                    : fnaStatus.status === 'duplicate'
                      ? 'bg-warn/[0.10] text-warn'
                      : 'bg-ok/[0.08] text-ok',
                )}
              >
                {fnaStatus.message ??
                  (fnaStatus.status === 'posted'
                    ? `Déversé dans Atlas FNA · réf ${fnaStatus.reference}`
                    : fnaStatus.status)}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function LineGroup({ title, lines, currency }: { title: string; lines: PayslipLine[]; currency: 'XOF' | 'XAF' }) {
  if (lines.length === 0) return null;
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-400">{title}</p>
      <div className="space-y-0.5">
        {lines.map((l) => {
          const amount = Money.fromJSON({ units: l.amountUnits, currency });
          const negative = amount.isNegative();
          return (
            <div key={l.code} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink-700">{l.label}</span>
                {l.rateBps != null && (
                  <span className="mono rounded bg-ink/[0.05] px-1.5 py-0.5 text-[10px] font-bold text-ink-400">
                    {(l.rateBps / 100).toFixed(2)}%
                  </span>
                )}
              </div>
              <span className={cn('mono text-sm font-semibold', negative ? 'text-danger' : 'text-ink')}>
                {negative ? '−' : ''}
                {Money.fromJSON({ units: l.amountUnits, currency }).format().replace('-', '')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function explain(result: ReturnType<typeof computePayslip>['result']): string {
  const c = result.currency;
  const gross = Money.fromJSON({ units: result.grossTotalUnits, currency: c });
  const contrib = Money.fromJSON({ units: result.totalEmployeeContributionUnits, currency: c });
  const tax = Money.fromJSON({ units: result.incomeTaxUnits, currency: c });
  const net = Money.fromJSON({ units: result.netToPayUnits, currency: c });
  return `Sur un brut de ${gross.format()} FCFA, ${contrib.format()} FCFA partent en cotisations sociales (caisses) et ${tax.format()} FCFA en impôt sur le revenu, calculé au barème progressif après abattement. Il vous reste ${net.format()} FCFA net. Aucun changement de barème ce mois-ci.`;
}
