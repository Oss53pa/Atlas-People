import { useEffect, useMemo } from 'react';
import { Target, ClipboardList, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { ReportingSubNav } from '../../components/mss/ReportingSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { OKR_DISTRIBUTION, evalDistribution } from '../../lib/mss/reporting';

const TONE_BAR: Record<string, string> = { ok: 'bg-ok', info: 'bg-info', warn: 'bg-warn', danger: 'bg-danger' };

export function ReportingPerformancePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);

  const evals = evalDistribution(team);
  const maxEval = Math.max(1, ...evals.map((e) => e.count));
  const recognized = Math.ceil(team.length / 2);

  return (
    <div className="animate-fade-up space-y-5">
      <ReportingSubNav />
      <h1 className="text-2xl font-semibold text-ink">KPI performance</h1>

      <Card>
        <CardHeader title="Objectifs (OKR) — distribution" subtitle="Avancement global équipe : 62%" action={<Target size={16} className="text-ink-400" />} />
        <div className="space-y-2">
          {OKR_DISTRIBUTION.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-[12px] font-medium text-ink-600">{d.label}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface2"><div className={`h-full rounded-full ${TONE_BAR[d.tone]}`} style={{ width: `${d.pct}%` }} /></div>
              <span className="mono w-10 text-right text-[12px] font-semibold text-ink-700">{d.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Évaluations — dernière campagne" action={<ClipboardList size={16} className="text-ink-400" />} />
        <div className="flex h-32 items-end gap-3">
          {evals.map((e) => (
            <div key={e.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="mono text-[11px] font-semibold text-ink">{e.count}</span>
              <div className="flex w-full items-end justify-center" style={{ height: '100%' }}>
                <div className="w-full max-w-[36px] rounded-t-lg bg-info/70" style={{ height: `${(e.count / maxEval) * 100}%` }} />
              </div>
              <span className="text-center text-[10px] font-semibold text-ink-400">{e.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Promotions / mobilités" action={<TrendingUp size={16} className="text-ink-400" />} />
          <div className="space-y-1 text-sm font-medium text-ink-700">
            <p>Promotions internes (12 mois) : <span className="mono font-semibold text-ink">1</span></p>
            <p>Mobilités internes (12 mois) : <span className="mono font-semibold text-ink">2</span></p>
            <p>Taux de promotion : <span className="mono font-semibold text-ink">8%</span></p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Reconnaissance" action={<Award size={16} className="text-ink-400" />} />
          <div className="space-y-1 text-sm font-medium text-ink-700">
            <p>Reconnaissances envoyées (trimestre) : <span className="mono font-semibold text-ink">7</span></p>
            <p>Couverture équipe : <span className="mono font-semibold text-ink">{recognized}/{team.length}</span> ({team.length ? Math.round((recognized / team.length) * 100) : 0}%)</p>
            {recognized < team.length && <p className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-deep"><AlertTriangle size={13} /> Cible : 1/membre/trimestre minimum.</p>}
          </div>
          <div className="mt-2"><StatusPill tone="info" dot={false}>Agrégat équipe</StatusPill></div>
        </Card>
      </div>
    </div>
  );
}
