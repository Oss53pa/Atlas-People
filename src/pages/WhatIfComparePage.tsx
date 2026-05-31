/**
 * Comparateur de scénarios What-if — A vs B side-by-side.
 * Charge 2 scénarios persistés et calcule l'impact comparé sur la masse salariale.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Save, Trash2, ArrowRightLeft, AlertTriangle,
  TrendingUp, TrendingDown, Wallet, Calculator, Building2, Users, Calendar,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { Money } from '../lib/money';
import { computePayslip, getRegime } from '../lib/payroll';
import { TENANT_CURRENCY } from '../data/countries';
import { EMPLOYEES, employeeName, type EmployeeRecord } from '../data/mock';
import { useWhatIfScenarios, type WhatIfScenario } from '../store/useWhatIfScenarios';
import { cn } from '../lib/cn';

const fmt = (n: number): string => new Intl.NumberFormat('fr-FR').format(Math.round(n));
const fmtCompact = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} Mds`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return String(Math.round(n));
};

interface Totals {
  headcount: number;
  base: number;
  net: number;
  employerCost: number;
  charges: number;
}

function rosterFor(sc: WhatIfScenario | null): EmployeeRecord[] {
  if (!sc) return EMPLOYEES;
  const removed = new Set(sc.removedIds);
  const remaining: EmployeeRecord[] = EMPLOYEES
    .filter((e) => !removed.has(e.id))
    .map((e) => ({
      ...e,
      baseSalary: Math.round(e.baseSalary * (1 + sc.increasePct / 100)),
      taxableAllowances: Math.round(e.taxableAllowances * (1 + sc.increasePct / 100)),
      fiscalParts: Math.max(0.5, e.fiscalParts + sc.extraFiscalParts),
    }));
  const newHires: EmployeeRecord[] = sc.hires.map((h, i) => ({
    id: `sim-${sc.id}-h${i}`,
    firstName: 'Nouveau',
    lastName: `#${i + 1}`,
    role: h.role,
    department: 'Simulation',
    countryCode: h.countryCode,
    email: `sim-${sc.id}-${i}@atlas.demo`,
    contractType: 'CDI' as const,
    hireDate: '2026-07-01',
    status: 'onboarding' as const,
    baseSalary: h.baseSalary,
    taxableAllowances: h.taxableAllowances,
    nonTaxableAllowances: 50_000,
    fiscalParts: h.fiscalParts,
    retentionAttention: 5,
  }));
  return [...remaining, ...newHires];
}

function totalsFor(roster: EmployeeRecord[]): Totals {
  let base = Money.zero(TENANT_CURRENCY);
  let net = Money.zero(TENANT_CURRENCY);
  let employerCost = Money.zero(TENANT_CURRENCY);
  for (const e of roster) {
    const regime = getRegime(e.countryCode);
    const { result } = computePayslip({
      baseSalary: e.baseSalary,
      taxableAllowances: e.taxableAllowances,
      nonTaxableAllowances: e.nonTaxableAllowances,
      fiscalParts: e.fiscalParts,
      otherDeductions: e.otherDeductions,
    }, regime, employeeName(e));
    base = base.add(Money.fromJSON({ units: BigInt(e.baseSalary), currency: TENANT_CURRENCY }));
    net = net.add(Money.fromJSON({ units: result.netToPayUnits, currency: TENANT_CURRENCY }));
    employerCost = employerCost.add(Money.fromJSON({ units: result.employerCostUnits, currency: TENANT_CURRENCY }));
  }
  const employerInt = employerCost.toInt();
  const netInt = net.toInt();
  return {
    headcount: roster.length,
    base: base.toInt(),
    net: netInt,
    employerCost: employerInt,
    charges: employerInt - netInt,
  };
}

function describe(sc: WhatIfScenario | null): string {
  if (!sc) return 'Baseline (état actuel sans modification)';
  const parts: string[] = [];
  if (sc.increasePct !== 0) parts.push(`Δ salaire ${sc.increasePct > 0 ? '+' : ''}${sc.increasePct} %`);
  if (sc.extraFiscalParts !== 0) parts.push(`${sc.extraFiscalParts > 0 ? '+' : ''}${sc.extraFiscalParts} part(s)`);
  if (sc.removedIds.length) parts.push(`-${sc.removedIds.length} dép.`);
  if (sc.hires.length) parts.push(`+${sc.hires.length} embauche(s)`);
  return parts.length ? parts.join(' · ') : 'Aucune mutation';
}

export function WhatIfComparePage() {
  const { scenarios, selectedAId, selectedBId, selectForCompare, deleteScenario } = useWhatIfScenarios();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const scA = scenarios.find((s) => s.id === selectedAId) ?? null;
  const scB = scenarios.find((s) => s.id === selectedBId) ?? null;

  const totA = useMemo(() => totalsFor(rosterFor(scA)), [scA]);
  const totB = useMemo(() => totalsFor(rosterFor(scB)), [scB]);
  const baseline = useMemo(() => totalsFor(EMPLOYEES), []);

  const delta = {
    headcount: totB.headcount - totA.headcount,
    base: totB.base - totA.base,
    net: totB.net - totA.net,
    employerCost: totB.employerCost - totA.employerCost,
    charges: totB.charges - totA.charges,
  };
  const pctChange = totA.employerCost === 0 ? 0 : (delta.employerCost / totA.employerCost) * 100;

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">Comparateur · M13</p>
          <h1 className="font-display text-3xl text-ink">Comparer 2 scénarios</h1>
          <p className="mt-1 text-sm font-medium text-ink-500">
            {scenarios.length} scénario(s) sauvegardé(s) · sélectionner A et B pour comparer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/whatif"><Button variant="outline" size="sm"><ArrowLeft size={14} /> Simulateur</Button></Link>
        </div>
      </div>

      {/* SCENARIO LIBRARY */}
      <Card>
        <CardHeader title="Bibliothèque de scénarios" subtitle={`${scenarios.length} scénario(s)`} action={<Save size={16} className="text-amber-deep" />} />
        {scenarios.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface2/40 p-6 text-center">
            <p className="text-[13px] font-semibold text-ink">Aucun scénario sauvegardé</p>
            <p className="mt-1 text-[11px] font-medium text-ink-500">Allez dans le simulateur et cliquez sur « Sauvegarder scénario ».</p>
            <Link to="/whatif" className="mt-3 inline-block"><Button size="sm">Ouvrir le simulateur</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-3 py-2 text-left">Nom</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-center">Créé le</th>
                <th className="px-3 py-2 text-center">A</th>
                <th className="px-3 py-2 text-center">B</th>
                <th className="px-3 py-2 text-right" />
              </tr></thead>
              <tbody className="divide-y divide-line">
                {scenarios.map((sc) => {
                  const isA = selectedAId === sc.id;
                  const isB = selectedBId === sc.id;
                  return (
                    <tr key={sc.id} className={cn('hover:bg-amber/[0.03]', (isA || isB) && 'bg-amber/[0.04]')}>
                      <td className="px-3 py-2">
                        <p className="text-[13px] font-semibold text-ink">{sc.name}</p>
                        {sc.notes && <p className="text-[10px] font-medium italic text-ink-500">{sc.notes}</p>}
                      </td>
                      <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{describe(sc)}</td>
                      <td className="px-3 py-2 mono text-center text-[10px] text-ink-500">{sc.createdAt.slice(0, 16).replace('T', ' ')}</td>
                      <td className="px-3 py-2 text-center">
                        <input type="radio" name="slotA" checked={isA} onChange={() => selectForCompare('A', sc.id)} className="accent-amber-deep" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="radio" name="slotB" checked={isB} onChange={() => selectForCompare('B', sc.id)} className="accent-amber-deep" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {confirmDeleteId === sc.id ? (
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>Annuler</Button>
                            <Button size="sm" onClick={() => { deleteScenario(sc.id); setConfirmDeleteId(null); }}>
                              <Trash2 size={12} /> Confirmer
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(sc.id)}>
                            <Trash2 size={12} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <button onClick={() => selectForCompare('A', null)}
            className="rounded-full border border-line bg-surface px-2 py-1 font-semibold text-ink-500 hover:bg-amber/[0.04]">
            A = baseline
          </button>
          <button onClick={() => selectForCompare('B', null)}
            className="rounded-full border border-line bg-surface px-2 py-1 font-semibold text-ink-500 hover:bg-amber/[0.04]">
            B = baseline
          </button>
        </div>
      </Card>

      {/* COMPARAISON SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_60px_1fr]">
        {/* Scénario A */}
        <Card className={cn('border-2', scA ? 'border-sky-300/40' : 'border-line')}>
          <div className="flex items-center gap-2">
            <span className="mono flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-[14px] font-bold text-sky-700">A</span>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-ink">{scA?.name ?? 'Baseline'}</p>
              <p className="text-[10px] font-medium text-ink-500">{describe(scA)}</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="rounded-xl bg-surface2/40 p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Coût employeur / mois</p>
              <p className="mono mt-1 text-[24px] font-bold text-ink">{fmtCompact(totA.employerCost)} FCFA</p>
              <p className="text-[10px] font-medium text-ink-500">{totA.headcount} collab(s) · {fmtCompact(totA.employerCost * 12)} / an</p>
            </div>
            <ul className="space-y-1 text-[11px]">
              <li className="flex items-center justify-between"><span className="text-ink-500">Effectif</span><span className="mono font-bold">{totA.headcount}</span></li>
              <li className="flex items-center justify-between"><span className="text-ink-500">Masse base</span><span className="mono font-bold">{fmtCompact(totA.base)}</span></li>
              <li className="flex items-center justify-between"><span className="text-ink-500">Net cumulé</span><span className="mono font-bold">{fmtCompact(totA.net)}</span></li>
              <li className="flex items-center justify-between"><span className="text-ink-500">Charges</span><span className="mono font-bold">{fmtCompact(totA.charges)}</span></li>
            </ul>
            <p className="text-[9px] font-medium italic text-ink-500">
              vs baseline réelle : {totA.employerCost - baseline.employerCost > 0 ? '+' : ''}{fmtCompact(totA.employerCost - baseline.employerCost)} FCFA
            </p>
          </div>
        </Card>

        {/* Flèche */}
        <div className="flex items-center justify-center">
          <div className="rounded-full border border-amber-deep/30 bg-amber/[0.06] p-3 text-amber-deep">
            <ArrowRightLeft size={20} />
          </div>
        </div>

        {/* Scénario B */}
        <Card className={cn('border-2', scB ? 'border-emerald-300/40' : 'border-line')}>
          <div className="flex items-center gap-2">
            <span className="mono flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-[14px] font-bold text-emerald-700">B</span>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-ink">{scB?.name ?? 'Baseline'}</p>
              <p className="text-[10px] font-medium text-ink-500">{describe(scB)}</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="rounded-xl bg-surface2/40 p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Coût employeur / mois</p>
              <p className="mono mt-1 text-[24px] font-bold text-ink">{fmtCompact(totB.employerCost)} FCFA</p>
              <p className="text-[10px] font-medium text-ink-500">{totB.headcount} collab(s) · {fmtCompact(totB.employerCost * 12)} / an</p>
            </div>
            <ul className="space-y-1 text-[11px]">
              <li className="flex items-center justify-between"><span className="text-ink-500">Effectif</span><span className="mono font-bold">{totB.headcount}</span></li>
              <li className="flex items-center justify-between"><span className="text-ink-500">Masse base</span><span className="mono font-bold">{fmtCompact(totB.base)}</span></li>
              <li className="flex items-center justify-between"><span className="text-ink-500">Net cumulé</span><span className="mono font-bold">{fmtCompact(totB.net)}</span></li>
              <li className="flex items-center justify-between"><span className="text-ink-500">Charges</span><span className="mono font-bold">{fmtCompact(totB.charges)}</span></li>
            </ul>
            <p className="text-[9px] font-medium italic text-ink-500">
              vs baseline réelle : {totB.employerCost - baseline.employerCost > 0 ? '+' : ''}{fmtCompact(totB.employerCost - baseline.employerCost)} FCFA
            </p>
          </div>
        </Card>
      </div>

      {/* DELTA B − A */}
      <Card className={cn('border-2',
        Math.abs(pctChange) < 1 ? 'border-line' :
        pctChange > 5 ? 'border-rose-300 bg-rose-50/30' :
        pctChange < -5 ? 'border-emerald-300 bg-emerald-50/30' :
        'border-amber-300 bg-amber-50/30')}>
        <CardHeader title="Δ B − A (impact net du passage)" subtitle="Si A est l'option de départ, voici ce que B coûte/économise en plus" action={<Calculator size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Δ mensuel</p>
            <p className={cn('mono mt-1 text-[28px] font-bold',
              delta.employerCost > 0 ? 'text-rose-600' : delta.employerCost < 0 ? 'text-emerald-600' : 'text-ink')}>
              {delta.employerCost > 0 ? '+' : ''}{fmtCompact(delta.employerCost)}
            </p>
            <p className="text-[10px] font-medium text-ink-500">FCFA / mois</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Δ annuel projeté</p>
            <p className={cn('mono mt-1 text-[28px] font-bold',
              delta.employerCost > 0 ? 'text-rose-600' : delta.employerCost < 0 ? 'text-emerald-600' : 'text-ink')}>
              {delta.employerCost > 0 ? '+' : ''}{fmtCompact(delta.employerCost * 12)}
            </p>
            <p className="text-[10px] font-medium text-ink-500">FCFA / an</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Variation %</p>
            <p className={cn('mono mt-1 text-[28px] font-bold flex items-center gap-2',
              pctChange > 0 ? 'text-rose-600' : pctChange < 0 ? 'text-emerald-600' : 'text-ink')}>
              {pctChange > 0 ? '+' : ''}{pctChange.toFixed(2)} %
              {pctChange > 0 ? <TrendingUp size={18} /> : pctChange < 0 ? <TrendingDown size={18} /> : null}
            </p>
            <p className="text-[10px] font-medium text-ink-500">vs scénario A</p>
          </div>
        </div>

        <table className="mt-4 w-full text-sm">
          <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            <th className="px-3 py-2 text-left">Indicateur</th>
            <th className="px-3 py-2 text-right">A</th>
            <th className="px-3 py-2 text-right">B</th>
            <th className="px-3 py-2 text-right">Δ B−A</th>
            <th className="px-3 py-2 text-right">Δ %</th>
          </tr></thead>
          <tbody className="divide-y divide-line">
            {[
              { label: 'Effectif', icon: Users, a: totA.headcount, b: totB.headcount, fmt: (n: number) => String(n) },
              { label: 'Masse salariale (base)', icon: Wallet, a: totA.base, b: totB.base, fmt: fmtCompact },
              { label: 'Net cumulé', icon: Wallet, a: totA.net, b: totB.net, fmt: fmtCompact },
              { label: 'Coût employeur', icon: Building2, a: totA.employerCost, b: totB.employerCost, fmt: fmtCompact },
              { label: 'Charges', icon: Calculator, a: totA.charges, b: totB.charges, fmt: fmtCompact },
            ].map((row, i) => {
              const Icon = row.icon;
              const d = row.b - row.a;
              const pct = row.a === 0 ? 0 : (d / row.a) * 100;
              const positive = d > 0;
              const isHeadcount = row.label === 'Effectif';
              return (
                <tr key={i} className="hover:bg-amber/[0.03]">
                  <td className="px-3 py-2"><div className="flex items-center gap-2 text-[12px] font-semibold text-ink"><Icon size={12} className="text-amber-deep" />{row.label}</div></td>
                  <td className="px-3 py-2 mono text-right text-[11px] text-ink-700">{row.fmt(row.a)}</td>
                  <td className="px-3 py-2 mono text-right text-[11px] font-bold text-ink">{row.fmt(row.b)}</td>
                  <td className={cn('px-3 py-2 mono text-right text-[11px] font-bold',
                    d === 0 ? 'text-ink-500' :
                    isHeadcount ? (d > 0 ? 'text-emerald-600' : 'text-rose-600') :
                    (positive ? 'text-rose-600' : 'text-emerald-600'))}>
                    {d > 0 ? '+' : ''}{row.fmt(d)}
                  </td>
                  <td className={cn('px-3 py-2 mono text-right text-[10px] font-bold',
                    pct === 0 ? 'text-ink-500' :
                    isHeadcount ? (pct > 0 ? 'text-emerald-600' : 'text-rose-600') :
                    (positive ? 'text-rose-600' : 'text-emerald-600'))}>
                    {pct > 0 ? '+' : ''}{pct.toFixed(1)} %
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {Math.abs(pctChange) > 10 && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-warn/30 bg-warn/[0.05] p-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
            <p className="text-[11px] font-semibold text-ink-700">
              Écart B vs A &gt; 10 % — validation Comex + DAF requise avant arbitrage.
            </p>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Aide à la décision" subtitle="Lecture du delta — méthode Atlas" action={<Calendar size={16} className="text-amber-deep" />} />
        <ul className="space-y-1 text-[11px] font-medium text-ink-700">
          <li><StatusPill tone="success" dot={false}>Δ &lt; 0</StatusPill> — B économise par rapport à A. Vérifier impacts RH (climat, turnover) avant exécution.</li>
          <li><StatusPill tone="warn" dot={false}>0 &lt; Δ &lt; 5 %</StatusPill> — coût marginal. Décision opérationnelle (DAF + DRH).</li>
          <li><StatusPill tone="danger" dot={false}>Δ &gt; 5 %</StatusPill> — investissement majeur. Validation Comex requise · planifier sur 12 mois.</li>
          <li><StatusPill tone="info" dot={false}>Headcount Δ</StatusPill> — chaque embauche coûte aussi en onboarding/équipement (≈ 1 mois salaire en supplément la 1<sup>re</sup> année).</li>
        </ul>
      </Card>
    </div>
  );
}
