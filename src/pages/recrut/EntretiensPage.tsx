import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Video, Phone, MapPin, Star, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { scorecardsByApp } from '../../lib/m5/mock';
import { useM5Data } from '../../lib/m5/dataLive';
import { INTERVIEW_TYPES, RECOMMENDATION_META, SCORECARD_TEMPLATES } from '../../lib/m5/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

export function EntretiensPage() {
  const m5 = useM5Data();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'upcoming' | 'completed' | 'all'>('upcoming');

  const list = useMemo(() => {
    const now = new Date('2026-05-30').getTime();
    return m5.interviews.filter((i) => {
      if (filter === 'upcoming') return i.status === 'planned' && new Date(i.scheduledAt).getTime() >= now - 86_400_000;
      if (filter === 'completed') return i.status === 'completed';
      return true;
    }).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }, [filter, m5.interviews]);

  const planned = m5.interviews.filter((i) => i.status === 'planned').length;
  const completed = m5.interviews.filter((i) => i.status === 'completed').length;
  const noShows = m5.interviews.filter((i) => i.status === 'no_show').length;

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Entretiens</h1>
          <p className="text-sm font-medium text-ink-500">Planification · scorecards · panel · {INTERVIEW_TYPES.length} types · {SCORECARD_TEMPLATES.length} grilles</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Entretien', description: 'Planification entretien' })}>+ Programmer</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Planifiés" value={String(planned)} unit="à venir" icon={CalendarClock} tone="amber" />
        <StatCard label="Terminés" value={String(completed)} unit="historique" icon={CheckCircle2} />
        <StatCard label="No-show" value={String(noShows)} unit="absents" icon={XCircle} tone={noShows ? 'amber' : 'default'} />
        <StatCard label="Scorecards" value={String(scorecardsByApp('a02').length + scorecardsByApp('a07').length + scorecardsByApp('a09').length + scorecardsByApp('a13').length + scorecardsByApp('a01').length)} unit="soumises" icon={Star} />
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1 w-fit text-[12px] font-semibold">
        {(['upcoming', 'completed', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('rounded-md px-3 py-1', filter === f ? 'bg-amber/12 text-amber-deep' : 'text-ink-500')}>
            {f === 'upcoming' ? 'À venir' : f === 'completed' ? 'Terminés' : 'Tous'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {list.map((i) => {
          const ap = m5.applications.find((a) => a.id === i.applicationId);
          const cand = ap && m5.candidateById(ap.candidateId);
          const job = ap && m5.jobById(ap.jobId);
          const t = INTERVIEW_TYPES.find((it) => it.code === i.type);
          if (!cand || !job) return null;
          const cards = scorecardsByApp(ap.id).filter((s) => s.interviewId === i.id);
          const Mode = i.mode === 'visio' ? Video : i.mode === 'phone' ? Phone : MapPin;
          return (
            <Card key={i.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar name={`${cand.firstName} ${cand.lastName}`} size="sm" />
                  <div>
                    <p className="text-[13px] font-bold text-ink">{cand.firstName} {cand.lastName} <span className="ml-2 text-[11px] font-medium text-ink-500">→ {job.title}</span></p>
                    <p className="mt-0.5 text-[11px] font-medium text-ink-500">{t?.label} · {i.durationMin} min · <Mode size={10} className="inline" /> {i.mode}</p>
                    <p className="text-[10px] font-medium text-ink-400">{i.participants.map((p) => p.employeeId ? employeeName(employeeById(p.employeeId)!) : p.externalName).join(' · ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="mono text-[12px] font-bold text-amber-deep">{new Date(i.scheduledAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  <StatusPill tone={i.status === 'completed' ? 'ok' : i.status === 'no_show' ? 'danger' : i.status === 'cancelled' ? 'neutral' : 'amber'} dot={false}>{i.status}</StatusPill>
                </div>
              </div>
              {cards.length > 0 && (
                <div className="mt-3 space-y-1">
                  {cards.map((s) => {
                    const r = RECOMMENDATION_META[s.recommendation];
                    return (
                      <div key={s.id} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5 text-[11px]">
                        <span className="flex items-center gap-1.5 font-medium text-ink-700"><Star size={11} className="text-amber-deep" /> {employeeName(employeeById(s.interviewerEmployeeId)!)} · scorecard {s.overall.toFixed(1)}/5</span>
                        <StatusPill tone={r.tone} dot={false}>{r.label}</StatusPill>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Link to={`/recrutement/candidats/${cand.id}`}><Button variant="outline" size="sm">Profil candidat <ArrowUpRight size={12} /></Button></Link>
                {i.status === 'planned' && <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'success', title: 'Scorecard', description: `Grille ${SCORECARD_TEMPLATES.find(t => t.code === 'TECH')?.label} ouverte` })}><Star size={12} /> Saisir scorecard</Button>}
                {i.status === 'planned' && <Button variant="ghost" size="sm">Reprogrammer</Button>}
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Grilles d'évaluation (scorecard templates)" subtitle={`${SCORECARD_TEMPLATES.length} grilles disponibles`} />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {SCORECARD_TEMPLATES.map((t) => (
            <div key={t.code} className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[12px] font-bold text-ink">{t.label}</p>
              <ul className="mt-1 space-y-0.5 text-[11px] font-medium text-ink-500">
                {t.criteria.map((c) => <li key={c}>• {c}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
