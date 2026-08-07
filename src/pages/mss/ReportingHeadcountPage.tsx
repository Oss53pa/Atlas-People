import { useEffect, useMemo } from 'react';
import { Users, TrendingUp, MapPin, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { ReportingSubNav } from '../../components/mss/ReportingSubNav';
import { HBars, VBars } from '../../components/mss/charts';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { ageBands, seniorityBands, siteSplit, headcountTrend } from '../../lib/mss/reporting';
import { isBackendConfigured, useTeamDirectory } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const TODAY = new Date().toISOString().slice(0, 10);

function ageBandsLive(dir: { birth_date: string | null }[]) {
  const bands = [{ label: '< 25', min: 0, max: 24 }, { label: '25–34', min: 25, max: 34 }, { label: '35–44', min: 35, max: 44 }, { label: '45–54', min: 45, max: 54 }, { label: '55+', min: 55, max: 200 }];
  return bands.map(b => ({
    label: b.label,
    value: dir.filter(d => {
      if (!d.birth_date) return false;
      const age = Math.floor((new Date(TODAY).getTime() - new Date(d.birth_date).getTime()) / (365.25 * 86400000));
      return age >= b.min && age <= b.max;
    }).length,
  }));
}

function seniorityBandsLive(dir: { hire_date: string | null }[]) {
  const bands = [{ label: '< 1 an', min: 0, max: 0.99 }, { label: '1–3 ans', min: 1, max: 2.99 }, { label: '3–7 ans', min: 3, max: 6.99 }, { label: '7–15 ans', min: 7, max: 14.99 }, { label: '15+ ans', min: 15, max: 999 }];
  return bands.map(b => ({
    label: b.label,
    value: dir.filter(d => {
      if (!d.hire_date) return false;
      const years = (new Date(TODAY).getTime() - new Date(d.hire_date).getTime()) / (365.25 * 86400000);
      return years >= b.min && years <= b.max;
    }).length,
  }));
}

function siteSplitLive(dir: { site: string | null }[]) {
  const counts: Record<string, number> = {};
  dir.forEach(d => { const s = d.site ?? 'Non renseigné'; counts[s] = (counts[s] ?? 0) + 1; });
  return Object.entries(counts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

function headcountTrendLive(dir: { hire_date: string | null; status: string }[]) {
  const months: { label: string; value: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(TODAY);
    d.setMonth(d.getMonth() - i);
    const cutoff = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    const value = dir.filter(emp => emp.hire_date && emp.hire_date <= cutoff).length;
    months.push({ label, value });
  }
  return months;
}

export function ReportingHeadcountPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const mockTeam = useMemo(() => scopedTeam(depth, employees), [depth, employees]);

  const { data: ctx } = useSessionContext();
  const { data: liveDir } = useTeamDirectory(ctx?.tenantId);
  const hasLive = isBackendConfigured && Boolean(ctx?.tenantId);

  const ages = hasLive ? ageBandsLive(liveDir ?? []) : ageBands(mockTeam).map(b => ({ label: b.label, value: b.count }));
  const sen = hasLive ? seniorityBandsLive(liveDir ?? []) : seniorityBands(mockTeam).map(b => ({ label: b.label, value: b.count }));
  const sites = hasLive ? siteSplitLive(liveDir ?? []) : siteSplit(mockTeam);
  const trend = hasLive ? headcountTrendLive(liveDir ?? []) : headcountTrend(mockTeam).map(t => ({ label: t.month, value: t.value }));

  return (
    <div className="animate-fade-up space-y-5">
      <ReportingSubNav />
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-ink">Analyse effectif</h1>
        {hasLive && <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>}
      </div>

      <Card>
        <CardHeader title="Évolution de l'effectif (12 mois)" action={<TrendingUp size={16} className="text-ink-400" />} />
        <VBars data={trend} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Pyramide des âges" action={<Users size={16} className="text-ink-400" />} />
          <HBars data={ages} />
        </Card>
        <Card>
          <CardHeader title="Pyramide d'ancienneté" action={<Users size={16} className="text-ink-400" />} />
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
