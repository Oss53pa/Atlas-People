import { useEffect, useMemo } from 'react';
import { Wallet, Lock, TrendingUp, MapPin, Sparkles } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { ReportingSubNav } from '../../components/mss/ReportingSubNav';
import { StackBar, VBars } from '../../components/mss/charts';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { payrollAggregated, PAYROLL_NATURE, fcfa } from '../../lib/mss/reporting';

const NATURE_COLORS = ['bg-info', 'bg-info/60', 'bg-amber/70', 'bg-amber/40', 'bg-ink-300'];

export function ReportingPayrollPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const p = payrollAggregated(team);

  return (
    <div className="animate-fade-up space-y-5">
      <ReportingSubNav />
      <h1 className="text-2xl font-semibold text-ink">Masse salariale équipe (agrégée)</h1>
      <Card className="border-warn/25">
        <p className="flex items-start gap-2 text-[12px] font-semibold text-warn"><Lock size={14} className="mt-0.5 shrink-0" /> Aucune répartition individuelle — règle de confidentialité absolue (R12).</p>
      </Card>

      {p.masked ? (
        <Card><p className="flex items-center gap-2 py-3 text-sm font-medium text-ink-500"><Lock size={15} className="text-ink-400" /> Section masquée : votre périmètre compte moins de 5 personnes. Toute donnée serait ré-identifiable.</p></Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Masse mensuelle</p><p className="mono mt-1 text-xl font-semibold text-ink">{fcfa(p.month)}</p></Card>
            <Card><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Budget mois</p><p className="mono mt-1 text-xl font-semibold text-ink">{fcfa(p.budget)}</p></Card>
            <Card><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Écart</p><p className={`mono mt-1 text-xl font-semibold ${p.deltaPct > 0 ? 'text-warn' : 'text-ok'}`}>{p.deltaPct > 0 ? '+' : ''}{p.deltaPct}%</p></Card>
          </div>

          <Card>
            <CardHeader title="Décomposition par nature" action={<Wallet size={16} className="text-ink-400" />} />
            <StackBar segments={PAYROLL_NATURE.map((n, i) => ({ label: n.label, pct: n.pct, className: NATURE_COLORS[i] }))} />
          </Card>

          <Card>
            <CardHeader title="Évolution sur 12 mois" action={<TrendingUp size={16} className="text-ink-400" />} />
            <VBars data={p.trend.map((t) => ({ label: t.month, value: t.value }))} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Répartition par site (agrégée)" action={<MapPin size={16} className="text-ink-400" />} />
              <div className="space-y-2">
                {p.bySite.map((s) => (
                  <div key={s.label} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
                    <span>{s.label}</span><span className="mono font-semibold text-ink">{fcfa(s.amount)} ({s.pct}%)</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] font-medium text-ink-600">Coût moyen par ETP : <span className="mono font-semibold text-ink">{fcfa(p.costPerEtp)}</span> / mois <span className="text-ink-400">(pilotage global uniquement)</span></p>
            </Card>

            <Card className="glass-amber">
              <CardHeader title="Projection année" action={<Sparkles size={16} className="text-amber-deep" />} />
              <div className="space-y-1 text-sm font-medium text-ink-700">
                <p>Projection : <span className="mono font-semibold text-ink">{fcfa(p.projectionYear)}</span></p>
                <p>Budget annuel : <span className="mono font-semibold text-ink">{fcfa(p.budgetYear)}</span></p>
                <p className="text-warn">Écart projeté : +{p.projectionDeltaPct}%</p>
              </div>
              <p className="mt-2 text-[12px] font-bold uppercase tracking-wider text-amber-deep">Causes (Proph3t)</p>
              <ul className="mt-1 space-y-1 text-[12px] font-medium text-ink-700">
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-deep" /> HS supérieures au budget</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-deep" /> 1 promotion non budgétée</li>
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
