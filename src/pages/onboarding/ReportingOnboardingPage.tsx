import { BarChart3, TrendingUp, Download, Clock, MessageSquareHeart } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { JOURNEYS, TASKS, PULSES, kpis } from '../../lib/m6/mock';
import { MILESTONES, MILESTONE_META, ONBOARDING_SLA } from '../../lib/m6/referentiels';

export function ReportingOnboardingPage() {
  const { toast } = useToast();
  const k = kpis();

  // Drop-off / complétion par milestone
  const totalActive = JOURNEYS.filter(j => j.status === 'in_progress' || j.status === 'completed').length;
  const byMilestone = MILESTONES.map((m) => {
    const reached = JOURNEYS.filter((j) => {
      const days = Math.round((new Date('2026-05-31').getTime() - new Date(j.hireDate).getTime()) / 86_400_000);
      return days >= m.daysFromHire;
    }).length;
    return { code: m.code, label: MILESTONE_META[m.code].label, reached, pct: Math.round((reached / Math.max(1, totalActive)) * 100) };
  });

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Reporting onboarding</h1>
          <p className="text-sm font-medium text-ink-500">Complétion, time-to-productivity, NPS, drop-off · exports comités RH</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Export', description: 'Rapport trimestriel généré' })}><Download size={14} /> Export trimestriel</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Complétion moyenne" value={`${k.completionMoyenne} %`} unit={`cible ${ONBOARDING_SLA.completionTargetPct} %`} icon={TrendingUp} />
        <StatCard label="NPS J+90" value={String(k.npsJ90)} unit={`cible ≥ ${ONBOARDING_SLA.npsTargetMin}`} icon={MessageSquareHeart} />
        <StatCard label="Time-to-productivity" value={`${k.timeToProductivityJours} j`} unit="cible" icon={Clock} mono />
        <StatCard label="Pulses collectés" value={String(PULSES.length)} unit={`sur ${JOURNEYS.length * 4} attendus`} icon={MessageSquareHeart} />
      </div>

      <Card>
        <CardHeader title="Progression par milestone" subtitle={`${totalActive} parcours pris en compte`} action={<BarChart3 size={16} className="text-amber-deep" />} />
        <div className="space-y-1.5">
          {byMilestone.map((m) => (
            <div key={m.code} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-[11px] font-bold uppercase tracking-wider text-ink-500">{m.label}</span>
              <div className="flex-1">
                <div className="h-6 overflow-hidden rounded-md bg-surface2">
                  <div className="flex h-full items-center justify-end rounded-md bg-gradient-to-r from-amber/30 to-amber/60 px-2"
                       style={{ width: `${Math.max(5, m.pct)}%` }}>
                    <span className="mono text-[10px] font-bold text-ink">{m.reached}</span>
                  </div>
                </div>
              </div>
              <span className="mono w-10 shrink-0 text-right text-[11px] font-bold text-amber-deep">{m.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="NPS par parcours complété" subtitle="Distribution score recommandation" />
          <table className="w-full text-sm">
            <thead><tr className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="py-1 text-left">Bucket NPS</th>
              <th className="py-1 text-right">Nb</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {[
                { label: 'Promoteurs (≥ 70)', filter: (n: number) => n >= 70 },
                { label: 'Passifs (40-69)', filter: (n: number) => n >= 40 && n < 70 },
                { label: 'Détracteurs (< 40)', filter: (n: number) => n < 40 },
              ].map((b) => {
                const count = JOURNEYS.filter(j => typeof j.nps === 'number' && b.filter(j.nps)).length;
                return (
                  <tr key={b.label}>
                    <td className="py-1.5 text-[12px] font-medium text-ink-700">{b.label}</td>
                    <td className="py-1.5 text-right mono text-[11px] font-bold text-amber-deep">{count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader title="Tâches en retard par catégorie" subtitle="Identifier les zones à risque" />
          <table className="w-full text-sm">
            <thead><tr className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="py-1 text-left">Catégorie</th>
              <th className="py-1 text-right">Retard</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {['ADMIN','IT','WORKSPACE','FORMATION','BUDDY','TEAM','BUSINESS','CULTURE'].map((c) => {
                const late = TASKS.filter((t) => t.category === c && t.status !== 'completed' && new Date(t.dueDate) < new Date('2026-05-31')).length;
                return (
                  <tr key={c}>
                    <td className="py-1.5 text-[12px] font-medium text-ink-700">{c}</td>
                    <td className={`py-1.5 text-right mono text-[11px] font-bold ${late > 5 ? 'text-warn' : 'text-ink'}`}>{late}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <Card>
        <CardHeader title="Exports comités RH" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {['Rapport onboarding mensuel', 'Bilan trimestriel CSE', 'NPS annuel', 'Time-to-productivity', 'Drop-off & rétention', 'Évaluation programme buddy'].map((r) => (
            <button key={r} onClick={() => toast({ variant: 'success', title: 'Export', description: `${r} généré` })} className="flex items-center justify-between rounded-xl border border-line bg-surface2/40 px-3 py-2 text-[12px] font-medium text-ink-700 hover:border-amber/40 hover:bg-amber/[0.04]">
              <span>{r}</span>
              <Download size={12} className="text-ink-400" />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
