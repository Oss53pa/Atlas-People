import { useMemo } from 'react';
import { BarChart3, Wallet, Building2, Banknote, TrendingUp } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { ProgressBar } from '../../components/charts/ProgressBar';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { usePayrollCycle } from '../../store/usePayrollCycle';
import { cycleBulletins, cycleTotals } from '../../lib/m3/cycle';
import { DEPARTMENTS } from '../../data/mock';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();
const M = (n: number) => `${(n / 1e6).toFixed(2)} M`;
const EVOLUTION = [
  { m: 'Déc', v: 13.1 }, { m: 'Jan', v: 13.4 }, { m: 'Fév', v: 13.7 }, { m: 'Mar', v: 13.9 }, { m: 'Avr', v: 14.2 },
];

export function ReportingPaiePage() {
  const { cycle, variables, statuses, prevNet } = usePayrollCycle();
  const rows = useMemo(() => cycleBulletins(variables, statuses, prevNet), [variables, statuses, prevNet]);
  const totals = useMemo(() => cycleTotals(rows), [rows]);
  const byDept = useMemo(() => DEPARTMENTS.map((d) => ({
    dept: d, total: rows.filter((r) => r.emp.department === d).reduce((s, r) => s + r.bulletin.brutTotal, 0),
  })).sort((a, b) => b.total - a.total), [rows]);
  const maxDept = Math.max(1, ...byDept.map((d) => d.total));
  const budgetAnnuel = 180_000_000;
  const realiseAnnuel = totals.coutEmployeur * 5;

  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Reporting paie</h1>
        <p className="text-sm font-medium text-ink-500">Cycle {cycle.label} · masse salariale, budget vs réalisé, évolution</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Masse brute" value={M(totals.brut)} unit="XOF" mono icon={Wallet} tone="amber" />
        <StatCard label="Masse chargée" value={M(totals.coutEmployeur)} unit="XOF" mono icon={Building2} />
        <StatCard label="Net versé" value={M(totals.net)} unit="XOF" mono icon={Banknote} />
        <StatCard label="Taux de charge" value={`${Math.round((totals.patronal / Math.max(1, totals.brut)) * 100)}`} unit="%" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Masse brute par département" action={<BarChart3 size={16} className="text-ink-400" />} />
          <div className="space-y-2.5">
            {byDept.map((d) => (
              <div key={d.dept}>
                <div className="mb-1 flex items-center justify-between text-[12px]"><span className="font-semibold text-ink">{d.dept}</span><span className="mono font-bold text-ink-700">{fmt(d.total)}</span></div>
                <ProgressBar value={(d.total / maxDept) * 100} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Évolution masse chargée (M FCFA)" subtitle="6 derniers mois" action={<TrendingUp size={16} className="text-ink-400" />} />
          <div className="flex h-40 items-end gap-2">
            {[...EVOLUTION, { m: 'Mai', v: totals.coutEmployeur / 1e6 }].map((e, i, arr) => {
              const max = Math.max(...arr.map((x) => x.v));
              return (
                <div key={e.m} className="flex flex-1 flex-col items-center gap-1">
                  <div className={`w-full rounded-t-lg ${i === arr.length - 1 ? 'bg-amber' : 'bg-amber/30'}`} style={{ height: `${(e.v / max) * 100}%` }} />
                  <span className="text-[10px] font-semibold text-ink-400">{e.m}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Budget vs réalisé (annuel projeté)" subtitle="Atlas Studio CI · 2026" />
        <div className="space-y-3">
          <div><div className="mb-1 flex justify-between text-[12px] font-semibold"><span className="text-ink-500">Budget annuel</span><span className="mono text-ink">{fmt(budgetAnnuel)}</span></div><ProgressBar value={100} tone="info" /></div>
          <div><div className="mb-1 flex justify-between text-[12px] font-semibold"><span className="text-ink-500">Réalisé projeté</span><span className="mono text-ink">{fmt(realiseAnnuel)}</span></div><ProgressBar value={Math.min(100, (realiseAnnuel / budgetAnnuel) * 100)} tone={realiseAnnuel > budgetAnnuel ? 'danger' : 'ok'} /></div>
          <p className="text-[12px] font-medium text-ink-500">Écart : <span className={`mono font-bold ${realiseAnnuel > budgetAnnuel ? 'text-danger' : 'text-ok'}`}>{fmt(realiseAnnuel - budgetAnnuel)}</span> ({Math.round(((realiseAnnuel - budgetAnnuel) / budgetAnnuel) * 100)} %)</p>
        </div>
      </Card>
    </div>
  );
}
