import { Link } from 'react-router-dom';
import { GraduationCap, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { useM6Data } from '../../lib/m6/dataLive';
import { MANDATORY_TRAININGS } from '../../lib/m6/referentiels';
import { employeeById, employeeName } from '../../data/mock';

export function FormationsPage() {
  const m6 = useM6Data();
  const completed = m6.trainings.filter((t) => t.status === 'completed').length;
  const inProgress = m6.trainings.filter((t) => t.status === 'in_progress').length;
  const total = m6.trainings.length;

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />

      <div>
        <h1 className="text-2xl font-semibold text-ink">Formations obligatoires</h1>
        <p className="text-sm font-medium text-ink-500">{MANDATORY_TRAININGS.length} formations onboarding · sécurité, RGPD, OHADA, produit</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Formations catalogue" value={String(MANDATORY_TRAININGS.length)} unit="obligatoires" icon={GraduationCap} />
        <StatCard label="Complétées (toutes)" value={`${Math.round(completed/total*100)} %`} unit={`${completed}/${total}`} icon={CheckCircle2} />
        <StatCard label="En cours" value={String(inProgress)} unit="actifs" icon={Clock} tone="amber" />
        <StatCard label="Heures cumulées" value={`${MANDATORY_TRAININGS.reduce((s,t)=>s+t.durationHours,0)} h`} unit="par parcours" icon={GraduationCap} />
      </div>

      <Card>
        <CardHeader title="Catalogue des formations obligatoires" />
        <table className="w-full text-sm">
          <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            <th className="px-3 py-2 text-left">Code</th>
            <th className="px-3 py-2 text-left">Formation</th>
            <th className="px-3 py-2 text-left">Durée</th>
            <th className="px-3 py-2 text-left">Format</th>
            <th className="px-3 py-2 text-right">Taux complétion</th>
          </tr></thead>
          <tbody className="divide-y divide-line">
            {MANDATORY_TRAININGS.map((t) => {
              const allComps = m6.trainings.filter((c) => c.trainingCode === t.code);
              const compl = allComps.filter((c) => c.status === 'completed').length;
              const pct = Math.round((compl / Math.max(1, allComps.length)) * 100);
              return (
                <tr key={t.code}>
                  <td className="px-3 py-2 mono text-[11px] font-bold text-amber-deep">{t.code}</td>
                  <td className="px-3 py-2 text-[12px] font-semibold text-ink">{t.label}</td>
                  <td className="px-3 py-2 mono text-[11px] text-ink-700">{t.durationHours} h</td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{t.format}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-ink/[0.06]">
                        <div className="h-full rounded-full bg-amber" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="mono text-[10px] font-bold text-amber-deep">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Suivi par collaborateur" subtitle="Formations onboarding en cours" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-center">Formations validées</th>
              <th className="px-3 py-2 text-center">Score moyen</th>
              <th className="px-3 py-2 text-center">État</th>
              <th className="px-3 py-2 text-right" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {m6.journeys.filter(j => j.status === 'in_progress').map((j) => {
                const emp = employeeById(j.employeeId);
                if (!emp) return null;
                const comps = m6.trainings.filter((c) => c.journeyId === j.id);
                const done = comps.filter((c) => c.status === 'completed');
                const avgScore = done.length ? Math.round(done.reduce((s,c)=>s+(c.score??0),0) / done.length) : 0;
                const allDone = done.length === MANDATORY_TRAININGS.length;
                return (
                  <tr key={j.id}>
                    <td className="px-4 py-2 text-[13px] font-semibold text-ink">{employeeName(emp)}</td>
                    <td className="px-3 py-2 mono text-center text-[11px] font-bold text-ink">{done.length}/{MANDATORY_TRAININGS.length}</td>
                    <td className="px-3 py-2 mono text-center text-[11px] font-bold text-amber-deep">{avgScore || '—'}{avgScore ? '%' : ''}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={allDone ? 'ok' : 'amber'} dot={false}>{allDone ? 'Complet' : 'En cours'}</StatusPill></td>
                    <td className="px-3 py-2 text-right"><Link to={`/onboarding/arrivants/${emp.id}`}><Button variant="ghost" size="sm">Parcours <ArrowUpRight size={12} /></Button></Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
