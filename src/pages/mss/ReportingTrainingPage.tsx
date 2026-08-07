import { useEffect, useMemo } from 'react';
import { GraduationCap, Wallet, Clock, Star, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { ReportingSubNav } from '../../components/mss/ReportingSubNav';
import { HBars, BudgetGauge, StackBar } from '../../components/mss/charts';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { TRAINING_CATEGORIES, trainingByMember, fcfa } from '../../lib/mss/reporting';
import { isBackendConfigured, useMssReportingLive } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const CAT_COLORS = ['bg-info', 'bg-info/60', 'bg-amber/70', 'bg-ink-300'];

export function ReportingTrainingPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);

  const budget = 4_000_000, spent = 1_850_000, engaged = 1_200_000;
  const byMember = trainingByMember(team);
  const totalHours = byMember.reduce((s, m) => s + m.hours, 0);
  const avg = team.length ? Math.round(totalHours / team.length) : 0;

  const { data: ctx } = useSessionContext();
  const { data: live } = useMssReportingLive(ctx?.tenantId);
  const showLive = isBackendConfigured && !!live;
  const liveHours = showLive ? Math.round(live.trainingHours) : totalHours;
  const liveAvg = showLive && team.length ? Math.round(liveHours / team.length) : avg;

  return (
    <div className="animate-fade-up space-y-5">
      <ReportingSubNav />
      <h1 className="text-2xl font-semibold text-ink">Analyse formation</h1>

      <Card>
        <CardHeader title="Budget formation" action={<Wallet size={16} className="text-ink-400" />} />
        <BudgetGauge spent={spent} engaged={engaged} total={budget} />
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-medium text-ink-700 sm:grid-cols-4">
          <p>Alloué : <span className="mono font-semibold text-ink">{fcfa(budget)}</span></p>
          <p>Consommé : <span className="mono font-semibold text-info">{fcfa(spent)}</span></p>
          <p>Engagé : <span className="mono font-semibold text-amber-deep">{fcfa(engaged)}</span></p>
          <p>Disponible : <span className="mono font-semibold text-ink">{fcfa(budget - spent - engaged)}</span></p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Heures de formation" action={showLive ? <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500"><Wifi size={12} /> Live DB</span> : <Clock size={16} className="text-ink-400" />} />
          <div className="space-y-1 text-sm font-medium text-ink-700">
            {showLive && <p>Formations validées : <span className="mono font-semibold text-ink">{live.trainingCount.toLocaleString('fr-FR')}</span></p>}
            <p>Total équipe : <span className="mono font-semibold text-ink">{liveHours.toLocaleString('fr-FR')}h</span></p>
            <p>Moyenne par membre : <span className="mono font-semibold text-ink">{liveAvg}h</span></p>
            <p className={liveAvg < 21 ? 'text-warn' : 'text-ok'}>Cible : 21h/membre/an {liveAvg < 21 ? '(sous l’objectif)' : '(atteinte)'}</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Satisfaction" action={<Star size={16} className="text-ink-400" />} />
          <div className="space-y-1 text-sm font-medium text-ink-700">
            <p>Note moyenne post-formation : <span className="mono font-semibold text-ink">4,2/5</span></p>
            <p>Recommandation aux pairs : <span className="mono font-semibold text-ink">87%</span></p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Répartition par catégorie" action={<GraduationCap size={16} className="text-ink-400" />} />
        <StackBar segments={TRAINING_CATEGORIES.map((c, i) => ({ label: c.label, pct: c.count, className: CAT_COLORS[i] }))} />
      </Card>

      <Card>
        <CardHeader title="Heures suivies par membre" action={<GraduationCap size={16} className="text-ink-400" />} />
        <HBars data={byMember.map((m) => ({ label: m.name, value: m.hours }))} unit="h" />
      </Card>
    </div>
  );
}
