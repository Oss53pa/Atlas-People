import { useEffect, useMemo } from 'react';
import { Users, TrendingUp, MapPin } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { ReportingSubNav } from '../../components/mss/ReportingSubNav';
import { HBars, VBars } from '../../components/mss/charts';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { ageBands, seniorityBands, siteSplit, headcountTrend } from '../../lib/mss/reporting';

export function ReportingHeadcountPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);

  const ages = ageBands(team).map((b) => ({ label: b.label, value: b.count }));
  const sen = seniorityBands(team).map((b) => ({ label: b.label, value: b.count }));
  const sites = siteSplit(team);
  const trend = headcountTrend(team);

  return (
    <div className="animate-fade-up space-y-5">
      <ReportingSubNav />
      <h1 className="text-2xl font-semibold text-ink">Analyse effectif</h1>

      <Card>
        <CardHeader title="Évolution de l’effectif (12 mois)" action={<TrendingUp size={16} className="text-ink-400" />} />
        <VBars data={trend.map((t) => ({ label: t.month, value: t.value }))} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Pyramide des âges" action={<Users size={16} className="text-ink-400" />} />
          <HBars data={ages} />
        </Card>
        <Card>
          <CardHeader title="Pyramide d’ancienneté" action={<Users size={16} className="text-ink-400" />} />
          <HBars data={sen} color="bg-amber/60" />
        </Card>
      </div>

      <Card>
        <CardHeader title="Répartition par site" action={<MapPin size={16} className="text-ink-400" />} />
        <div className="space-y-2">
          {sites.map((s) => (
            <div key={s.label} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
              <span>{s.label}</span><span className="mono font-semibold text-ink">{s.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
