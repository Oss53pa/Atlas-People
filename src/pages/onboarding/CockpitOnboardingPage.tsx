import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, MessageSquareHeart, Rocket, TrendingUp, AlertTriangle,
  Calendar, Sparkles, ArrowUpRight, Clock,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { M6LiveBanner } from '../../components/onboarding/M6LiveBanner';
import { TASKS, BUDDIES, kpis, templateMeta } from '../../lib/m6/mock';
import { useM6Data } from '../../lib/m6/dataLive';
import { MILESTONE_META } from '../../lib/m6/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';
import { useRoster } from '../../lib/m1/roster';

export function CockpitOnboardingPage() {
  const k = useMemo(() => kpis(), []);
  const roster = useRoster();
  const m6 = useM6Data();
  const journeys = m6.journeys;

  const active = useMemo(() => journeys.filter((j) => j.status === 'in_progress')
    .sort((a, b) => a.hireDate.localeCompare(b.hireDate)), [journeys]);

  const upcoming = useMemo(() => journeys.filter((j) => {
    const d = (new Date(j.hireDate).getTime() - new Date('2026-05-31').getTime()) / 86_400_000;
    return d > 0 && d <= 14;
  }), [journeys]);

  const lateTasks = useMemo(() => TASKS.filter((t) => {
    if (t.status === 'completed' || t.status === 'skipped') return false;
    return (new Date(t.dueDate).getTime() - new Date('2026-05-31').getTime()) / 86_400_000 < 0;
  }).slice(0, 8), []);

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />
      <M6LiveBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Onboarding</h1>
          <p className="text-sm font-medium text-ink-500">Parcours 30/60/90 jours · buddy · pulse · NPS · {roster.length} collaborateurs suivis</p>
        </div>
        <div className="flex gap-2">
          <Link to="/onboarding/arrivants"><Button variant="outline" size="sm"><Users size={14} /> Tous les arrivants</Button></Link>
          <Link to="/onboarding/parcours"><Button size="sm"><Rocket size={14} /> Nouveau parcours</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Arrivants actifs" value={String(k.arrivantsActifs)} unit="en parcours" icon={Rocket} />
        <StatCard label="Prochains J-7" value={String(k.prochainsJ7)} unit="à préparer" icon={Calendar} tone="amber" />
        <StatCard label="Complétion moyenne" value={`${k.completionMoyenne} %`} unit="tâches" icon={TrendingUp} />
        <StatCard label="NPS J+90" value={String(k.npsJ90)} unit="cible ≥ 50" icon={MessageSquareHeart} tone={k.npsJ90 >= 50 ? 'default' : 'amber'} />
        <StatCard label="Tâches en retard" value={String(k.tachesEnRetard)} unit="à débloquer" icon={AlertTriangle} tone={k.tachesEnRetard ? 'amber' : 'default'} />
        <StatCard label="Pulses à collecter" value={String(k.pulsesPendings)} unit="surveys" icon={MessageSquareHeart} />
        <StatCard label="Buddy actifs" value={String(k.buddyPairings)} unit="pairings" icon={Users} />
        <StatCard label="Time-to-productivity" value={`${k.timeToProductivityJours} j`} unit="cible" icon={Clock} mono />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Arrivants en cours */}
        <Card inset={false}>
          <div className="flex items-center justify-between p-5 pb-2">
            <CardHeader title="Arrivants en cours" subtitle={`${active.length} parcours actifs · progression`} className="mb-0" />
            <Link to="/onboarding/arrivants" className="text-[12px] font-semibold text-amber-deep hover:underline">Tous →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 text-left">Collaborateur</th>
                <th className="px-3 py-2 text-left">Embauche</th>
                <th className="px-3 py-2 text-left">Template</th>
                <th className="px-3 py-2 text-left">Buddy</th>
                <th className="px-3 py-2 text-center">Progression</th>
                <th className="px-3 py-2 text-right" />
              </tr></thead>
              <tbody className="divide-y divide-line">
                {active.map((j) => {
                  const emp = employeeById(j.employeeId);
                  const buddy = j.buddyEmployeeId ? employeeById(j.buddyEmployeeId) : null;
                  const t = templateMeta(j.templateCode);
                  if (!emp) return null;
                  return (
                    <tr key={j.id} className="hover:bg-amber/[0.03]">
                      <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar name={employeeName(emp)} size="xs" /><div><p className="text-[13px] font-semibold text-ink">{employeeName(emp)}</p><p className="text-[11px] font-medium text-ink-500">{emp.role}</p></div></div></td>
                      <td className="px-3 py-2 mono text-[11px] font-medium text-ink-700">{j.hireDate}</td>
                      <td className="px-3 py-2"><span className="rounded-md bg-info/10 px-2 py-0.5 text-[10px] font-bold uppercase text-info">{t?.label ?? j.templateCode}</span></td>
                      <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{buddy ? employeeName(buddy) : '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-ink/[0.06]">
                            <div className="h-full rounded-full bg-amber" style={{ width: `${j.progressPct}%` }} />
                          </div>
                          <span className="mono text-[11px] font-bold text-ink">{j.progressPct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right"><Link to={`/onboarding/arrivants/${emp.id}`}><Button variant="ghost" size="sm">Parcours <ArrowUpRight size={12} /></Button></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Prochains J-7 + alertes */}
        <div className="space-y-3">
          <Card>
            <CardHeader title="Prochaines arrivées" subtitle="J-14 à J-0" action={<Calendar size={16} className="text-amber-deep" />} />
            {upcoming.length === 0 ? <p className="rounded-xl bg-surface2/40 px-3 py-3 text-center text-[12px] font-medium text-ink-400">Aucune arrivée planifiée sous 14 jours.</p>
              : <div className="space-y-1.5">
                  {upcoming.map((j) => {
                    const emp = employeeById(j.employeeId)!;
                    const d = Math.round((new Date(j.hireDate).getTime() - new Date('2026-05-31').getTime()) / 86_400_000);
                    return (
                      <Link key={j.id} to={`/onboarding/arrivants/${emp.id}`} className="flex items-center gap-2 rounded-xl bg-surface2/40 px-3 py-2 hover:bg-amber/[0.06]">
                        <span className="mono shrink-0 rounded-md bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">J-{d}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-ink">{employeeName(emp)}</p>
                          <p className="truncate text-[10px] font-medium text-ink-500">{emp.role} · {emp.department}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>}
          </Card>

          {lateTasks.length > 0 && (
            <Card className="border-warn/25">
              <CardHeader title="Tâches en retard" subtitle="Action requise" action={<AlertTriangle size={16} className="text-warn" />} />
              <div className="space-y-1">
                {lateTasks.map((t) => {
                  const j = m6.journeyById(t.journeyId);
                  const emp = j && employeeById(j.employeeId);
                  if (!emp) return null;
                  return (
                    <Link key={t.id} to={`/onboarding/arrivants/${emp.id}`} className="block rounded-lg bg-surface2/40 px-3 py-1.5 hover:bg-amber/[0.06]">
                      <p className="truncate text-[12px] font-semibold text-ink">{t.title}</p>
                      <p className="text-[10px] font-medium text-warn">{employeeName(emp)} · échéance {t.dueDate}</p>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Activité récente */}
        <Card>
          <CardHeader title="Activité récente" subtitle="Progression onboarding" action={<Sparkles size={16} className="text-amber-deep" />} />
          <div className="space-y-1.5">
            {TASKS.filter(t => t.status === 'completed').sort((a,b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')).slice(0, 6).map((t) => {
              const j = m6.journeyById(t.journeyId)!;
              const emp = employeeById(j.employeeId)!;
              const m = MILESTONE_META[t.milestone];
              return (
                <div key={t.id} className="rounded-lg bg-surface2/40 px-3 py-2">
                  <p className="text-[12px] font-semibold text-ink">{t.title}</p>
                  <p className="text-[10px] font-medium text-ink-500">{employeeName(emp)} · <span className={cn(m.tone === 'ok' ? 'text-ok' : m.tone === 'amber' ? 'text-amber-deep' : 'text-info')}>{m.label}</span> · {t.completedAt}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Buddy program */}
        <Card>
          <CardHeader title="Programme buddy" subtitle={`${BUDDIES.filter(b => b.status === 'active').length} pairings actifs`} action={<Link to="/onboarding/buddy" className="text-[11px] font-semibold text-amber-deep hover:underline">Tous →</Link>} />
          <div className="space-y-1.5">
            {BUDDIES.filter(b => b.status === 'active').slice(0, 5).map((b) => {
              const newc = employeeById(b.newcomerEmployeeId)!;
              const bud = employeeById(b.buddyEmployeeId)!;
              return (
                <div key={b.id} className="flex items-center gap-2 rounded-xl bg-surface2/40 px-3 py-2">
                  <Avatar name={employeeName(newc)} size="xs" />
                  <span className="text-[10px] font-bold text-ink-400">→</span>
                  <Avatar name={employeeName(bud)} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-ink">{employeeName(newc)} avec <b>{employeeName(bud)}</b></p>
                    <p className="truncate text-[10px] font-medium text-ink-500">{b.weeklyHours} h/sem · depuis {b.startedAt}</p>
                  </div>
                  <StatusPill tone="ok" dot={false}>{b.status}</StatusPill>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <p className="text-[11px] font-medium text-ink-400">M6 Onboarding · parcours 30/60/90 j · {journeys.length} parcours suivis (actifs + complétés) · {TASKS.length} tâches générées · intégrations M5 (handoff hire) ↔ M4 (validation PE) ↔ M11 (formations) ↔ M1 (dossier).</p>
    </div>
  );
}
