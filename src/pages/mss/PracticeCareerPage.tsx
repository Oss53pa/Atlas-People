import { useEffect } from 'react';
import { Route, GraduationCap, UserCheck } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { PracticeSubNav } from '../../components/mss/PracticeSubNav';
import { useSurface } from '../../store/useSurface';
import { MANAGER_CAREER as c } from '../../lib/mss/practice';

export function PracticeCareerPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  return (
    <div className="animate-fade-up space-y-5">
      <PracticeSubNav />
      <h1 className="text-2xl font-semibold text-ink">Mon parcours managérial</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">J’encadre depuis</p><p className="mono mt-1 text-2xl font-semibold text-ink">{c.years} ans</p><p className="text-[11px] text-ink-400">Depuis le {c.managingSince}</p></Card>
        <Card><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Personnes managées (cumul)</p><p className="mono mt-1 text-2xl font-semibold text-ink">{c.totalManaged}</p></Card>
        <Card><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Promotions managériales</p><p className="mono mt-1 text-2xl font-semibold text-ink">{c.managerialPromotions}</p></Card>
      </div>

      <Card>
        <CardHeader title="Timeline" action={<Route size={16} className="text-ink-400" />} />
        <ol className="relative space-y-4 border-l border-line pl-5">
          {c.timeline.map((t, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[1.45rem] top-1 h-2.5 w-2.5 rounded-full bg-info ring-4 ring-info/15" />
              <p className="text-[12px] font-bold text-info">{t.year}</p>
              <p className="text-sm font-medium text-ink-700">{t.event}</p>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <CardHeader title="Développement managérial" action={<GraduationCap size={16} className="text-ink-400" />} />
        <div className="space-y-1 text-sm font-medium text-ink-700">
          <p>Formations suivies : <span className="mono font-semibold text-ink">{c.trainingsDone}</span></p>
          <p className="flex items-center gap-2"><UserCheck size={14} className="text-ink-400" /> Mentor : {c.mentor}</p>
        </div>
      </Card>
    </div>
  );
}
