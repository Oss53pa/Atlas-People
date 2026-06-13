import { BarChart3, Download, Target, GitBranch, MessageSquare } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { OkrSubNav } from '../../components/okr/OkrSubNav';
import { useM7Data } from '../../lib/m7/dataLive';
import { LEVEL_META, CONFIDENCE_META } from '../../lib/m7/referentiels';

export function ReportingOkrPage() {
  const m7 = useM7Data();
  const { toast } = useToast();
  const k = m7.kpis();
  const confDist = (['green','amber','red'] as const).map((c) => ({
    code: c, label: CONFIDENCE_META[c].label, count: m7.objectives.filter((o) => o.confidence === c && o.status === 'active').length,
  }));

  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Reporting OKR</h1>
          <p className="text-sm font-medium text-ink-500">Distribution · alignement · check-in coverage · bilan trimestriel</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Export', description: 'Rapport Q2 2026 généré' })}><Download size={14} /> Export trimestriel</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Progression moyenne" value={`${Math.round(k.progressionMoyenne * 100)} %`} unit="actifs" icon={Target} />
        <StatCard label="On track" value={`${k.confidenceGreenPct} %`} unit="green" icon={Target} />
        <StatCard label="Coverage cascade" value={`${k.alignementCoveragePct} %`} unit="cible ≥ 80 %" icon={GitBranch} />
        <StatCard label="Check-ins en retard" value={String(k.checkInsEnRetard)} unit="cette sem." icon={MessageSquare} tone={k.checkInsEnRetard ? 'amber' : 'default'} />
      </div>

      <Card>
        <CardHeader title="Répartition par niveau" subtitle="Cycle actif Q2 2026" action={<BarChart3 size={16} className="text-amber-deep" />} />
        <div className="space-y-1.5">
          {(['company','department','team','individual'] as const).map((lv) => {
            const items = m7.objectives.filter((o) => o.level === lv && o.status === 'active');
            const avg = items.length ? items.reduce((s, o) => s + o.progress, 0) / items.length : 0;
            return (
              <div key={lv} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-[11px] font-bold uppercase tracking-wider text-ink-500">{LEVEL_META[lv].label}</span>
                <div className="flex-1">
                  <div className="h-6 overflow-hidden rounded-md bg-surface2"><div className="flex h-full items-center justify-end rounded-md bg-gradient-to-r from-amber/30 to-amber/60 px-2" style={{ width: `${Math.max(5, avg * 100)}%` }}><span className="mono text-[10px] font-bold text-ink">{items.length}</span></div></div>
                </div>
                <span className="mono w-12 shrink-0 text-right text-[11px] font-bold text-amber-deep">{Math.round(avg * 100)}%</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="Distribution confidence" />
          <div className="space-y-2">
            {confDist.map((c) => {
              const total = confDist.reduce((s,x) => s + x.count, 0);
              const pct = total ? (c.count / total) * 100 : 0;
              return (
                <div key={c.code} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-wider text-ink-500">{c.label}</span>
                  <div className="flex-1 h-6 overflow-hidden rounded-md bg-surface2"><div className={`h-full rounded-md ${c.code === 'green' ? 'bg-ok' : c.code === 'amber' ? 'bg-amber' : 'bg-danger'}`} style={{ width: `${Math.max(5, pct)}%` }} /></div>
                  <span className="mono w-10 shrink-0 text-right text-[11px] font-bold text-amber-deep">{c.count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Statistiques cycle" />
          <ul className="space-y-1 text-[12px] font-medium text-ink-700">
            <li className="flex justify-between rounded-lg bg-surface2/40 px-3 py-1.5"><span>Total objectifs actifs</span><span className="mono font-bold text-ink">{m7.objectives.filter(o=>o.status==='active').length}</span></li>
            <li className="flex justify-between rounded-lg bg-surface2/40 px-3 py-1.5"><span>Total Key Results</span><span className="mono font-bold text-ink">{m7.keyResults.length}</span></li>
            <li className="flex justify-between rounded-lg bg-surface2/40 px-3 py-1.5"><span>Check-ins soumis</span><span className="mono font-bold text-ink">{m7.checkins.length}</span></li>
            <li className="flex justify-between rounded-lg bg-surface2/40 px-3 py-1.5"><span>OKRs alignés (cascade)</span><span className="mono font-bold text-ink">{m7.objectives.filter(o=>o.parentObjectiveId).length}</span></li>
            <li className="flex justify-between rounded-lg bg-surface2/40 px-3 py-1.5"><span>Score moyen dernier cycle</span><span className="mono font-bold text-amber-deep">{k.scoreMoyenCloture.toFixed(2)}</span></li>
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Exports" subtitle="Rapports pour direction & équipes" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {['Rapport trimestriel direction', 'Bilan cycle (rétrospectif)', 'OKR all-hands', 'Cascade map (image)', 'Compteurs check-ins par owner', 'OKR carry-over template'].map((r) => (
            <button key={r} onClick={() => toast({ variant: 'success', title: 'Export', description: `${r} généré` })}
              className="flex items-center justify-between rounded-xl border border-line bg-surface2/40 px-3 py-2 text-[12px] font-medium text-ink-700 hover:border-amber/40 hover:bg-amber/[0.04]">
              <span>{r}</span><Download size={12} className="text-ink-400" />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
