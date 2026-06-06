import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Inbox, Plane, CalendarClock, AlertTriangle, ArrowRight, Stethoscope, Megaphone, GraduationCap, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { StatCard } from '../../components/ui/StatCard';
import { TeamTimeSubNav } from '../../components/m2/TeamTimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useTimeOff } from '../../store/useTimeOff';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { leaveTypeByCode } from '../../lib/m2/leaveTypes';
import { employeeName, employeeById } from '../../data/mock';
import { useMssTeamStats, usePendingApprovals, isBackendConfigured } from '../../lib/mss/supabaseLive';
import { useAuth } from '../../lib/auth';

const TODAY = '2026-05-28';
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
function isoAdd(iso: string, n: number) { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

/** Motif catégoriel (jamais de nature médicale exposée au manager). */
function categoryLabel(code: string): string {
  const cat = leaveTypeByCode(code)?.category;
  return cat === 'health' ? 'Absence maladie' : cat === 'special_family' ? 'Congé spécial' : cat === 'delegation' ? 'Délégation' : cat === 'parenthood' ? 'Parentalité' : 'Congé';
}
function categoryIcon(code: string) {
  const cat = leaveTypeByCode(code)?.category;
  return cat === 'health' ? Stethoscope : cat === 'delegation' ? Megaphone : cat === 'parenthood' ? GraduationCap : Plane;
}

export function TeamDashboardPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const teamIds = new Set(team.map((e) => e.id));
  const requests = useTimeOff((s) => s.requests).filter((r) => teamIds.has(r.employeeId));
  const { tenantId } = useAuth();
  const { data: liveStats } = useMssTeamStats(tenantId ?? undefined);
  const { data: livePending } = usePendingApprovals(tenantId ?? undefined);

  const pending = isBackendConfigured && livePending ? livePending : requests.filter((r) => r.status === 'pending');
  const onLeaveToday = requests.filter((r) => r.status === 'approved' && r.start <= TODAY && r.end >= TODAY);
  const onLeaveIds = new Set(onLeaveToday.map((r) => r.employeeId));
  const upcoming = requests.filter((r) => r.status === 'approved' && r.start > TODAY && r.start <= isoAdd(TODAY, 7));
  const teamSize = isBackendConfigured && liveStats ? liveStats.teamSize : team.length;
  const present = isBackendConfigured && liveStats ? liveStats.activeCount : team.length - onLeaveIds.size;

  return (
    <div className="animate-fade-up space-y-5">
      <TeamTimeSubNav />
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-info">Espace Manager · Temps de l'équipe</p>
        <h1 className="text-2xl font-semibold text-ink">Tableau de bord équipe</h1>
        <p className="text-sm font-medium text-ink-500">
          {new Date(`${TODAY}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {teamSize} collaborateurs
          {isBackendConfigured && liveStats && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span>}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Présents" value={String(present)} unit={`/ ${teamSize}`} icon={Users} tone="amber" />
        <StatCard label="En congé / absents" value={String(isBackendConfigured && liveStats ? liveStats.onLeaveCount : onLeaveIds.size)} unit="aujourd'hui" icon={Plane} />
        <StatCard label="À valider" value={String(isBackendConfigured && livePending ? livePending.length : pending.length)} unit="demandes" icon={Inbox} tone="amber" />
        <StatCard label="Congés à venir" value={String(upcoming.length)} unit="7 jours" icon={CalendarClock} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Présence du jour */}
        <Card>
          <CardHeader title="Présence aujourd'hui" subtitle="Motif catégoriel — sans détail" action={<Users size={16} className="text-ink-400" />} />
          <div className="space-y-1.5">
            {team.map((e) => {
              const leave = onLeaveToday.find((r) => r.employeeId === e.id);
              return (
                <div key={e.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                  <Avatar name={employeeName(e)} size="xs" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{employeeName(e)}</p><p className="truncate text-[11px] font-medium text-ink-400">{e.role}</p></div>
                  {leave ? <StatusPill tone="warn" dot={false}>{categoryLabel(leave.code)}</StatusPill> : <StatusPill tone="ok" dot>Présent</StatusPill>}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          {/* À valider */}
          <Card>
            <CardHeader title="À valider" subtitle={`${pending.length} demande(s)`} action={<Link to="/team/temps/a-valider"><Button variant="outline" size="sm">Traiter <ArrowRight size={14} /></Button></Link>} />
            {pending.length > 0 ? (
              <div className="space-y-1.5">
                {pending.slice(0, 4).map((r) => {
                  const emp = employeeById(r.employeeId); const Icon = categoryIcon(r.code);
                  return (
                    <div key={r.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><Icon size={15} /></span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{emp ? employeeName(emp) : '—'}</p><p className="text-[11px] font-medium text-ink-400">{categoryLabel(r.code)} · {frDate(r.start)} → {frDate(r.end)} · {r.countedDays} j</p></div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm font-medium text-ink-400">Aucune demande en attente.</p>}
          </Card>

          {/* Absences en cours */}
          <Card>
            <CardHeader title="Absences en cours" action={<Plane size={16} className="text-ink-400" />} />
            {onLeaveToday.length > 0 ? (
              <div className="space-y-1.5">
                {onLeaveToday.map((r) => {
                  const emp = employeeById(r.employeeId);
                  return <div key={r.id} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2"><span className="text-sm font-semibold text-ink">{emp ? employeeName(emp) : '—'}</span><span className="text-[11px] font-medium text-ink-400">{categoryLabel(r.code)} · retour {frDate(isoAdd(r.end, 1))}</span></div>;
                })}
              </div>
            ) : <p className="text-sm font-medium text-ink-400">Personne absent aujourd'hui.</p>}
          </Card>
        </div>
      </div>

      {/* Sous-effectif (illustratif) */}
      <Card className="border-warn/25">
        <CardHeader title="Alertes couverture" action={<AlertTriangle size={16} className="text-warn" />} />
        <div className="flex items-center justify-between rounded-xl bg-warn/[0.06] px-3 py-2.5">
          <p className="text-sm font-medium text-ink-700">Samedi 31 mai · 14h-22h : <span className="font-bold">2 agents prévus</span>, minimum 3 → sous-effectif</p>
          <Link to="/team/temps/planning"><Button variant="ghost" size="sm">Voir le planning <ArrowRight size={14} /></Button></Link>
        </div>
      </Card>
    </div>
  );
}
