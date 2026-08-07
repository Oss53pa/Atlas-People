/**
 * Simulateur What-if stratégique DRH — calculs déterministes.
 * Variables : augmentation générale (%), embauches additionnelles, suppressions,
 * modification parts fiscales globale, changement de pays/régime.
 * Sortie : masse salariale projetée, coût annuel, charges, Δ net.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Calculator, TrendingUp, TrendingDown, Users, Wallet,
  RotateCcw, Save, AlertTriangle, ArrowLeft, Building2, UserPlus, UserMinus,
  Printer,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { Money } from '../lib/money';
import { computePayslip, getRegime } from '../lib/payroll';
import { TENANT_CURRENCY } from '../data/countries';
import { employeeName, type EmployeeRecord } from '../data/mock';
import { useRoster } from '../lib/m1/roster';
import { useWhatIfScenarios } from '../store/useWhatIfScenarios';
import { useToast } from '../components/ui/Toast';
import { ProphtetPanel } from '../components/ProphtetPanel';
import { cn } from '../lib/cn';

const fmt = (n: number): string => new Intl.NumberFormat('fr-FR').format(Math.round(n));
const fmtCompact = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} Mds`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return String(Math.round(n));
};

interface Hire {
  id: string;
  role: string;
  countryCode: string;
  baseSalary: number;
  taxableAllowances: number;
  fiscalParts: number;
}

interface ComputedTotals {
  base: number;
  net: number;
  employerCost: number;
  charges: number;
  headcount: number;
}

function computeForRoster(roster: EmployeeRecord[]): ComputedTotals {
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
    base: base.toInt(),
    net: netInt,
    employerCost: employerInt,
    charges: employerInt - netInt,
    headcount: roster.length,
  };
}

export function WhatIfSimulatorPage() {
  const roster = useRoster();
  // — Paramètres de simulation
  const [increasePct, setIncreasePct] = useState(0);        // augmentation générale (-10 à +30 %)
  const [extraFiscalParts, setExtraFiscalParts] = useState(0); // ajout/retrait global de parts
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set()); // suppressions
  const [hires, setHires] = useState<Hire[]>([
    { id: 'h1', role: 'Senior Developer', countryCode: 'CI', baseSalary: 1_100_000, taxableAllowances: 100_000, fiscalParts: 2 },
  ]);
  const [saveName, setSaveName] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const { scenarios, saveScenario } = useWhatIfScenarios();
  const toast = useToast();

  // — Roster baseline & roster simulé
  const baseline = useMemo(() => computeForRoster(roster), [roster]);

  const simulatedRoster = useMemo<EmployeeRecord[]>(() => {
    const remaining: EmployeeRecord[] = roster
      .filter((e) => !removedIds.has(e.id))
      .map((e) => ({
        ...e,
        baseSalary: Math.round(e.baseSalary * (1 + increasePct / 100)),
        taxableAllowances: Math.round(e.taxableAllowances * (1 + increasePct / 100)),
        fiscalParts: Math.max(0.5, e.fiscalParts + extraFiscalParts),
      }));
    const newHires: EmployeeRecord[] = hires.map((h, i) => ({
      id: `sim-h-${h.id}`,
      firstName: 'Nouveau',
      lastName: `#${i + 1}`,
      role: h.role,
      department: 'Simulation',
      countryCode: h.countryCode,
      email: `sim-${i}@atlas.demo`,
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
  }, [increasePct, extraFiscalParts, removedIds, hires, roster]);

  const simulated = useMemo(() => computeForRoster(simulatedRoster), [simulatedRoster]);

  // — Deltas
  const delta = {
    headcount: simulated.headcount - baseline.headcount,
    base: simulated.base - baseline.base,
    net: simulated.net - baseline.net,
    employerCost: simulated.employerCost - baseline.employerCost,
    charges: simulated.charges - baseline.charges,
  };
  const pctChange = baseline.employerCost === 0 ? 0 : (delta.employerCost / baseline.employerCost) * 100;
  const annualImpact = delta.employerCost * 12;

  // — Présence de mutations
  const hasMutations = increasePct !== 0 || extraFiscalParts !== 0 || removedIds.size > 0 || hires.length > 0;

  const reset = () => {
    setIncreasePct(0);
    setExtraFiscalParts(0);
    setRemovedIds(new Set());
    setHires([]);
  };

  const toggleRemove = (id: string) => {
    const next = new Set(removedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRemovedIds(next);
  };

  const addHire = () => {
    setHires([...hires, {
      id: `h${hires.length + 1}-${Date.now()}`,
      role: 'Nouveau poste',
      countryCode: 'CI',
      baseSalary: 800_000,
      taxableAllowances: 50_000,
      fiscalParts: 1,
    }]);
  };

  const removeHire = (id: string) => setHires(hires.filter((h) => h.id !== id));
  const updateHire = (id: string, patch: Partial<Hire>) =>
    setHires(hires.map((h) => h.id === id ? { ...h, ...patch } : h));

  // — Présets stratégiques
  const presets = [
    { name: 'Augmentation générale +5 %', apply: () => { reset(); setIncreasePct(5); } },
    { name: 'Vague d\'embauche x3', apply: () => { reset(); setHires(Array.from({ length: 3 }, (_, i) => ({
      id: `pre-h${i}`,
      role: ['Senior Developer', 'Product Manager', 'Customer Success'][i % 3],
      countryCode: i % 2 === 0 ? 'CI' : 'SN',
      baseSalary: 950_000,
      taxableAllowances: 80_000,
      fiscalParts: 1.5,
    }))); } },
    { name: 'Plan d\'austérité -5 % + 2 départs', apply: () => {
      reset();
      setIncreasePct(-5);
      setRemovedIds(new Set([roster[roster.length - 1].id, roster[roster.length - 2].id]));
    } },
    { name: 'Réforme fiscale +0,5 parts', apply: () => { reset(); setExtraFiscalParts(0.5); } },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <div className="print-header" data-print-date={new Date().toISOString().slice(0, 10)}>Simulateur stratégique DRH</div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">Simulation what-if · M13</p>
          <h1 className="font-display text-3xl text-ink">Simulateur stratégique DRH</h1>
          <p className="mt-1 text-sm font-medium text-ink-500">
            Calcul déterministe · moteur paie identique production · impact masse salariale + charges + net
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/"><Button variant="outline" size="sm"><ArrowLeft size={14} /> Cockpit</Button></Link>
          <Link to="/whatif/compare"><Button variant="outline" size="sm">Comparer ({scenarios.length}) →</Button></Link>
          <Button variant="outline" size="sm" onClick={reset}><RotateCcw size={14} /> Réinitialiser</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={14} /> PDF</Button>
        </div>
      </div>

      {/* PRÉSETS */}
      <Card>
        <CardHeader title="Présets stratégiques" subtitle="Scénarios pré-configurés en un clic" action={<Sparkles size={16} className="text-amber-deep" />} />
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button key={p.name} onClick={p.apply}
              className="rounded-full border border-amber-deep/40 bg-amber-deep/[0.06] px-3 py-1.5 text-[11px] font-semibold text-amber-deep transition-colors hover:bg-amber-deep/12">
              {p.name}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        {/* CONTRÔLES */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Augmentation générale" subtitle="Applique un Δ % sur salaire de base + indemnités taxables" action={<TrendingUp size={16} className="text-amber-deep" />} />
            <input type="range" min={-10} max={30} step={0.5} value={increasePct}
              onChange={(e) => setIncreasePct(parseFloat(e.target.value))}
              className="w-full accent-amber-deep" />
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[11px] font-medium text-ink-500">-10 %</span>
              <span className={cn('mono text-[28px] font-bold',
                increasePct > 0 ? 'text-emerald-600' : increasePct < 0 ? 'text-rose-600' : 'text-ink')}>
                {increasePct > 0 ? '+' : ''}{increasePct.toFixed(1)} %
              </span>
              <span className="text-[11px] font-medium text-ink-500">+30 %</span>
            </div>
          </Card>

          <Card>
            <CardHeader title="Modification parts fiscales (Δ global)" subtitle="Réforme fiscale ou changement de situation familiale" action={<Calculator size={16} className="text-amber-deep" />} />
            <input type="range" min={-2} max={2} step={0.5} value={extraFiscalParts}
              onChange={(e) => setExtraFiscalParts(parseFloat(e.target.value))}
              className="w-full accent-amber-deep" />
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[11px] font-medium text-ink-500">-2 parts</span>
              <span className={cn('mono text-[28px] font-bold',
                extraFiscalParts > 0 ? 'text-emerald-600' : extraFiscalParts < 0 ? 'text-rose-600' : 'text-ink')}>
                {extraFiscalParts > 0 ? '+' : ''}{extraFiscalParts.toFixed(1)}
              </span>
              <span className="text-[11px] font-medium text-ink-500">+2 parts</span>
            </div>
          </Card>

          <Card>
            <CardHeader title="Suppressions de poste" subtitle={`${removedIds.size} collab(s) retiré(s) — coût employeur économisé`} action={<UserMinus size={16} className="text-amber-deep" />} />
            <div className="max-h-[200px] space-y-1 overflow-y-auto">
              {roster.map((e) => {
                const removed = removedIds.has(e.id);
                return (
                  <label key={e.id} className={cn('flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors',
                    removed ? 'bg-rose-50' : 'hover:bg-amber/[0.04]')}>
                    <input type="checkbox" checked={removed} onChange={() => toggleRemove(e.id)}
                      className="accent-rose-500" />
                    <span className={cn('flex-1 text-[12px] font-medium', removed ? 'text-rose-600 line-through' : 'text-ink-700')}>
                      {employeeName(e)}
                    </span>
                    <span className="mono text-[10px] font-bold text-ink-500">{fmtCompact(e.baseSalary)}</span>
                  </label>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title={`Embauches simulées (${hires.length})`} subtitle="Postes à créer · coût ajouté à la masse" action={<UserPlus size={16} className="text-amber-deep" />} />
            <div className="space-y-2">
              {hires.map((h) => (
                <div key={h.id} className="rounded-xl border border-line p-2">
                  <div className="flex items-center gap-2">
                    <input value={h.role} onChange={(e) => updateHire(h.id, { role: e.target.value })}
                      className="flex-1 rounded-lg border border-line px-2 py-1 text-[12px] font-medium text-ink focus:border-amber-deep focus:outline-none" />
                    <select value={h.countryCode} onChange={(e) => updateHire(h.id, { countryCode: e.target.value })}
                      className="rounded-lg border border-line bg-surface px-2 py-1 text-[11px] font-bold text-ink">
                      <option value="CI">CI</option>
                      <option value="SN">SN</option>
                    </select>
                    <button onClick={() => removeHire(h.id)} className="rounded p-1 text-ink-400 hover:bg-rose-50 hover:text-rose-600">
                      <UserMinus size={14} />
                    </button>
                  </div>
                  <div className="mt-1 grid grid-cols-3 gap-1">
                    <label className="block">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Base</span>
                      <input type="number" value={h.baseSalary} onChange={(e) => updateHire(h.id, { baseSalary: parseInt(e.target.value) || 0 })}
                        className="mono w-full rounded border border-line px-1 py-0.5 text-[11px] font-bold text-ink focus:border-amber-deep focus:outline-none" />
                    </label>
                    <label className="block">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Indem. tax.</span>
                      <input type="number" value={h.taxableAllowances} onChange={(e) => updateHire(h.id, { taxableAllowances: parseInt(e.target.value) || 0 })}
                        className="mono w-full rounded border border-line px-1 py-0.5 text-[11px] font-bold text-ink focus:border-amber-deep focus:outline-none" />
                    </label>
                    <label className="block">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Parts</span>
                      <input type="number" step={0.5} value={h.fiscalParts} onChange={(e) => updateHire(h.id, { fiscalParts: parseFloat(e.target.value) || 1 })}
                        className="mono w-full rounded border border-line px-1 py-0.5 text-[11px] font-bold text-ink focus:border-amber-deep focus:outline-none" />
                    </label>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addHire}><UserPlus size={14} /> Ajouter une embauche</Button>
            </div>
          </Card>
        </div>

        {/* RÉSULTATS */}
        <div className="space-y-4">
          <Card className={cn('border-2',
            Math.abs(pctChange) < 1 ? 'border-line' :
            pctChange > 5 ? 'border-rose-300 bg-rose-50/30' :
            pctChange < -5 ? 'border-emerald-300 bg-emerald-50/30' :
            'border-amber-300 bg-amber-50/30')}>
            <CardHeader title="Impact mensuel" subtitle="Coût employeur consolidé tenant" action={<Wallet size={16} className="text-amber-deep" />} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Baseline</p>
                <p className="mono mt-1 text-[16px] font-bold text-ink-700">{fmtCompact(baseline.employerCost)} FCFA</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Simulation</p>
                <p className="mono mt-1 text-[16px] font-bold text-ink">{fmtCompact(simulated.employerCost)} FCFA</p>
              </div>
              <div className="col-span-2 mt-2 rounded-xl bg-surface2/40 p-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Δ mensuel</span>
                  <span className={cn('mono text-[28px] font-bold',
                    delta.employerCost > 0 ? 'text-rose-600' : delta.employerCost < 0 ? 'text-emerald-600' : 'text-ink')}>
                    {delta.employerCost > 0 ? '+' : ''}{fmtCompact(delta.employerCost)}
                  </span>
                  <span className="mono text-[12px] font-bold text-ink-500">FCFA</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn('mono text-[18px] font-bold',
                    pctChange > 0 ? 'text-rose-600' : pctChange < 0 ? 'text-emerald-600' : 'text-ink')}>
                    {pctChange > 0 ? '+' : ''}{pctChange.toFixed(2)} %
                  </span>
                  {pctChange > 0 ? <TrendingUp size={16} className="text-rose-600" /> : pctChange < 0 ? <TrendingDown size={16} className="text-emerald-600" /> : null}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Impact annuel projeté" subtitle="Δ mensuel × 12 — non actualisé" action={<TrendingUp size={16} className="text-amber-deep" />} />
            <div className="rounded-2xl border-2 border-amber-deep/30 bg-gradient-to-br from-amber-50/40 to-surface p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">Impact 12 mois</p>
              <p className={cn('mono mt-1 text-[36px] font-bold leading-none',
                annualImpact > 0 ? 'text-rose-600' : annualImpact < 0 ? 'text-emerald-600' : 'text-ink')}>
                {annualImpact > 0 ? '+' : ''}{fmtCompact(annualImpact)} FCFA
              </p>
              <p className="mt-1 text-[11px] font-medium text-ink-500">
                {annualImpact > 0 ? 'Surcoût' : annualImpact < 0 ? 'Économie' : 'Neutre'} sur l'année
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Détail comparatif" subtitle="Baseline vs Simulation par poste" />
            <table className="w-full text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-3 py-2 text-left">Poste</th>
                <th className="px-3 py-2 text-right">Baseline</th>
                <th className="px-3 py-2 text-right">Simulation</th>
                <th className="px-3 py-2 text-right">Δ</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {[
                  { label: 'Effectif', icon: Users, b: baseline.headcount, s: simulated.headcount, format: (n: number) => String(n) },
                  { label: 'Masse salariale (base)', icon: Wallet, b: baseline.base, s: simulated.base, format: fmtCompact },
                  { label: 'Net à payer cumulé', icon: Wallet, b: baseline.net, s: simulated.net, format: fmtCompact },
                  { label: 'Coût employeur total', icon: Building2, b: baseline.employerCost, s: simulated.employerCost, format: fmtCompact },
                  { label: 'Charges (cotisations)', icon: Calculator, b: baseline.charges, s: simulated.charges, format: fmtCompact },
                ].map((row, i) => {
                  const Icon = row.icon;
                  const d = row.s - row.b;
                  const positive = d > 0;
                  return (
                    <tr key={i} className="hover:bg-amber/[0.03]">
                      <td className="px-3 py-2"><div className="flex items-center gap-2 text-[12px] font-semibold text-ink"><Icon size={12} className="text-amber-deep" />{row.label}</div></td>
                      <td className="px-3 py-2 mono text-right text-[11px] text-ink-700">{row.format(row.b)}</td>
                      <td className="px-3 py-2 mono text-right text-[12px] font-bold text-ink">{row.format(row.s)}</td>
                      <td className={cn('px-3 py-2 mono text-right text-[11px] font-bold',
                        d === 0 ? 'text-ink-500' :
                        row.label === 'Effectif' ? (d > 0 ? 'text-emerald-600' : 'text-rose-600') :
                        (positive ? 'text-rose-600' : 'text-emerald-600'))}>
                        {d > 0 ? '+' : ''}{row.format(d)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-amber/[0.05]">
                  <td className="px-3 py-2 text-[12px] font-bold text-ink">Variation %</td>
                  <td colSpan={2} />
                  <td className={cn('px-3 py-2 mono text-right text-[14px] font-bold',
                    pctChange > 0 ? 'text-rose-600' : pctChange < 0 ? 'text-emerald-600' : 'text-ink')}>
                    {pctChange > 0 ? '+' : ''}{pctChange.toFixed(2)} %
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          {Math.abs(pctChange) > 10 && (
            <Card className="border-warn/30 bg-warn/[0.05]">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
                <div>
                  <p className="text-[12px] font-bold text-ink">Impact significatif détecté</p>
                  <p className="mt-1 text-[11px] font-medium text-ink-700">
                    La simulation modifie la masse salariale de plus de 10 %. {pctChange > 0
                      ? `Surcoût annuel projeté : ${fmtCompact(annualImpact)} FCFA — validation Comex + DAF requise avant déploiement.`
                      : `Économie annuelle projetée : ${fmtCompact(Math.abs(annualImpact))} FCFA — vérifier les impacts RH (turnover, climat) avant exécution.`}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {hasMutations && (
            <ProphtetPanel context={{
              kind: 'whatif-scenario',
              data: {
                deltaMonthly: delta.employerCost,
                deltaPct: pctChange,
                deltaHeadcount: delta.headcount,
                deltaCharges: delta.charges,
                hiresCount: hires.length,
                removalsCount: removedIds.size,
                increasePct,
              },
            }} />
          )}

          <Card>
            <CardHeader title="Sauvegarder ce scénario" subtitle="Persistance locale · réutilisable dans le comparateur" action={<Save size={16} className="text-amber-deep" />} />
            <div className="space-y-2">
              <input value={saveName} onChange={(e) => setSaveName(e.target.value)}
                placeholder="Nom du scénario (ex. « +5 % général Q3 »)"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-semibold text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none" />
              <textarea value={saveNotes} onChange={(e) => setSaveNotes(e.target.value)}
                placeholder="Notes (contexte stratégique, raison, hypothèses…)"
                rows={2}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-medium text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none" />
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-ink-500">{scenarios.length} scénario(s) déjà sauvegardé(s)</p>
                <Button size="sm" disabled={!saveName.trim() || !hasMutations}
                  onClick={() => {
                    if (!saveName.trim()) return;
                    saveScenario({
                      name: saveName.trim(),
                      notes: saveNotes.trim() || undefined,
                      authorName: 'Valentina Okou',
                      increasePct,
                      extraFiscalParts,
                      removedIds: Array.from(removedIds),
                      hires,
                    });
                    toast.toast({ variant: 'success', title: `Scénario « ${saveName.trim()} » sauvegardé` });
                    setSaveName('');
                    setSaveNotes('');
                  }}>
                  <Save size={14} /> Sauvegarder
                </Button>
              </div>
              {!hasMutations && <p className="text-[10px] font-medium italic text-ink-500">Modifiez au moins un paramètre pour activer la sauvegarde.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Hypothèses & limites" subtitle="Méthodologie de calcul" />
            <ul className="space-y-1 text-[11px] font-medium text-ink-700">
              <li>• Moteur paie déterministe identique à la production · double vérification.</li>
              <li>• Régimes pris en compte : <strong>CI (UEMOA XOF)</strong> + <strong>SN (UEMOA XOF)</strong> — extensible aux 14 OHADA.</li>
              <li>• Projection annuelle = Δ mensuel × 12 (sans actualisation, sans inflation).</li>
              <li>• Indemnités non taxables conservées identiques à la baseline.</li>
              <li>• Retenues diverses (avances, prêts) conservées.</li>
              <li>• Charges employeurs incluent CNPS/IPRES selon régime ; pas de coût de recrutement ni d'onboarding.</li>
              <li>• Le scénario n'est pas persisté tant que <strong>Sauvegarder scénario</strong> n'est pas activé.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
