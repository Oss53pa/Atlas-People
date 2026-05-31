import { BarChart3, Download, TrendingUp, Clock, DollarSign, Users } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { APPLICATIONS, JOBS, OFFERS, kpis } from '../../lib/m5/mock';
import { PIPELINE_STAGES } from '../../lib/m5/referentiels';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

export function ReportingRecrutPage() {
  const { toast } = useToast();
  const k = kpis();
  const total = APPLICATIONS.length;
  const funnel = PIPELINE_STAGES.map(s => ({
    ...s,
    count: APPLICATIONS.filter(a => a.stage === s.code).length,
    pct: Math.round((APPLICATIONS.filter(a => a.stage === s.code).length / Math.max(1, total)) * 100),
  }));

  // Sum cumulé en pipeline (sourced..offer) pour ratio entonnoir global
  const inPipe = APPLICATIONS.filter(a => ['sourced','applied','screening','interview','assessment','offer'].includes(a.stage)).length;

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Reporting recrutement</h1>
          <p className="text-sm font-medium text-ink-500">Entonnoir, time-to-fill, cost-per-hire, ROI canaux · exports comités</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Export', description: 'Rapport Q2 2026 généré' })}><Download size={14} /> Export trimestriel</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Time-to-fill médian" value={`${k.timeToFillJoursMedian} j`} unit="cible 45 j" icon={Clock} mono />
        <StatCard label="Cost per hire" value={fmt(k.costPerHire)} unit="moyen" icon={DollarSign} mono />
        <StatCard label="Taux d'acceptation" value={`${k.acceptanceRate} %`} unit="offres" icon={TrendingUp} />
        <StatCard label="Candidatures 12 mois" value={String(total * 6)} unit="reçues" icon={Users} />
      </div>

      <Card>
        <CardHeader title="Entonnoir de conversion" subtitle="9 étapes — du sourcing à l'embauche" action={<BarChart3 size={16} className="text-amber-deep" />} />
        <div className="space-y-1.5">
          {funnel.map((s) => (
            <div key={s.code} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-[11px] font-bold uppercase tracking-wider text-ink-500">{s.label}</span>
              <div className="flex-1">
                <div className="h-6 overflow-hidden rounded-md bg-surface2">
                  <div className="flex h-full items-center justify-end rounded-md bg-gradient-to-r from-amber/30 to-amber/60 px-2 transition-all"
                       style={{ width: `${Math.max(5, s.pct)}%` }}>
                    <span className="mono text-[10px] font-bold text-ink">{s.count}</span>
                  </div>
                </div>
              </div>
              <span className="mono w-10 shrink-0 text-right text-[11px] font-bold text-amber-deep">{s.pct}%</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] font-medium text-ink-400">Total candidatures actuelles : {total} · En pipeline actif : {inPipe} · Embauchés : {funnel.find(f=>f.code==='hired')?.count ?? 0}</p>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="Performance par poste" subtitle="Postes ouverts ou récemment pourvus" />
          <table className="w-full text-sm">
            <thead><tr className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="py-1 text-left">Poste</th>
              <th className="py-1 text-right">Cand.</th>
              <th className="py-1 text-right">Jours ouverts</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {JOBS.filter(j => j.status === 'open' || j.status === 'closed_filled').slice(0, 6).map((j) => {
                const days = Math.round((new Date(j.closedAt ?? '2026-05-30').getTime() - new Date(j.openedAt).getTime()) / 86_400_000);
                return (
                  <tr key={j.id}>
                    <td className="py-1.5 text-[12px] font-semibold text-ink">{j.title.slice(0, 35)}</td>
                    <td className="py-1.5 text-right mono text-[11px] text-ink-700">{j.applicationsCount}</td>
                    <td className="py-1.5 text-right mono text-[11px] font-bold text-amber-deep">{days} j</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader title="Offres" subtitle="Cycle de signature" />
          <div className="space-y-1">
            {['sent', 'negotiating', 'accepted', 'declined', 'expired'].map(s => (
              <div key={s} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5 text-[12px]">
                <span className="font-medium text-ink-700">{s}</span>
                <span className="mono font-bold text-ink">{OFFERS.filter(o => o.status === s).length}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Exports comités" subtitle="Rapports périodiques pour direction & RH" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {['Rapport recrutement mensuel', 'Bilan trimestriel CSE', 'ROI canaux annuel', 'Diversité & parité', 'Cooptation enveloppe', 'Time-to-fill par poste'].map((r) => (
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
