import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Plane, Inbox, ReceiptText, CalendarClock, ArrowRight,
  CheckCircle2, AlertTriangle, Target, ChevronRight, Wifi,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { useSurface } from '../../store/useSurface';
import { useManagerScope } from '../../store/useManagerScope';
import { useDirectory } from '../../store/useDirectory';
import { useTimeOff } from '../../store/useTimeOff';
import { useManagerBadges } from '../../lib/mss/badges';
import { scopedTeam, depthCounts, DEPTH_LABEL, useManagerId } from '../../lib/mss/scope';
import { leaveTypeByCode } from '../../lib/m2/leaveTypes';
import { employeeById, employeeName } from '../../data/mock';
import { isBackendConfigured, useTeamDirectory, useAllLeaveRequests, useMssTeamStats, dirName } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const TODAY = new Date().toISOString().slice(0, 10);
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');

function categoryLabel(code: string): string {
  const cat = leaveTypeByCode(code)?.category;
  return cat === 'health' ? 'Absence maladie' : cat === 'special_family' ? 'Congé spécial' : cat === 'delegation' ? 'Délégation' : cat === 'parenthood' ? 'Parentalité' : 'Congé';
}

/** M1 — Accueil manager (cf. 02_ACCUEIL). Hub transverse : périmètre, files à
 *  valider, présence équipe, actions rapides. Aucune donnée sensible (R2-R7). */
export function ManagerHomePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const managerId = useManagerId();
  const depth = useManagerScope((s) => s.depth);
  const employees = useDirectory((s) => s.employees);
  const badges = useManagerBadges();
  const allRequests = useTimeOff((s) => s.requests);

  // Live layer
  const { data: ctx } = useSessionContext();
  const { data: liveDir } = useTeamDirectory(ctx?.tenantId);
  const { data: rawLeaves } = useAllLeaveRequests(ctx?.tenantId);
  const { data: liveStats } = useMssTeamStats(ctx?.tenantId);
  const hasLive = isBackendConfigured && Boolean(ctx?.tenantId);

  // Mock path
  const manager = employeeById(managerId) ?? employeeById('e1')!;
  const team = useMemo(() => scopedTeam(depth, employees, managerId), [depth, employees, managerId]);
  const counts = useMemo(() => depthCounts(employees, managerId), [employees, managerId]);
  const teamIds = useMemo(() => new Set(team.map((e) => e.id)), [team]);
  const requests = allRequests.filter((r) => teamIds.has(r.employeeId));
  const onLeaveToday = requests.filter((r) => r.status === 'approved' && r.start <= TODAY && r.end >= TODAY);
  const onLeaveIds = new Set(onLeaveToday.map((r) => r.employeeId));
  const present = team.length - onLeaveIds.size;
  const pending = requests.filter((r) => r.status === 'pending');

  // Live-derived values
  const liveApprovedToday = hasLive ? (rawLeaves ?? []).filter(r => r.status === 'approved' && r.start_date <= TODAY && r.end_date >= TODAY) : [];
  const livePendingLeaves = hasLive ? (rawLeaves ?? []).filter(r => r.status === 'pending') : [];
  const liveOnLeaveIds = new Set(liveApprovedToday.map(r => r.employee_id));
  const liveTeamSize = hasLive ? (liveStats?.teamSize ?? team.length) : team.length;
  const livePresent = hasLive ? liveTeamSize - liveOnLeaveIds.size : present;
  const liveNameOf = (eid: string) => { const d = (liveDir ?? []).find(e => e.id === eid); return d ? dirName(d) : '—'; };

  const displayPresent = hasLive ? livePresent : present;
  const displayAbsent = hasLive ? liveOnLeaveIds.size : onLeaveIds.size;
  const displayTeamSize = hasLive ? liveTeamSize : team.length;
  const displayPendingLeaves = hasLive ? (liveStats?.pendingApprovals ?? badges.timeToValidate) : badges.timeToValidate;
  const totalToValidate = displayPendingLeaves + badges.expensesToValidate + badges.teamRequests;

  return (
    <div className="animate-fade-up space-y-5">
      {/* Bandeau héros */}
      <Card className="border-info/20 bg-gradient-to-br from-info/[0.06] to-transparent">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-info">Portail manager · {DEPTH_LABEL[depth]}</p>
            <h1 className="mt-0.5 text-2xl font-semibold text-ink">Bonjour {manager.firstName}</h1>
            <p className="mt-1 text-sm font-medium text-ink-500">
              {displayTeamSize} collaborateurs dans mon périmètre{!hasLive ? ` · N-1 : ${counts.n1}${counts.n2 > 0 ? ` · N-2 : ${counts.n2}` : ''}${counts.n3plus > 0 ? ` · N-3+ : ${counts.n3plus}` : ''}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasLive && <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>}
            <Link to="/team/temps/a-valider"><Button variant="primary" size="sm">Valider en lot <ArrowRight size={14} /></Button></Link>
            <Link to="/team/equipe"><Button variant="outline" size="sm">Mon équipe</Button></Link>
          </div>
        </div>
      </Card>

      {/* StatCards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Présents" value={String(displayPresent)} unit={`/ ${displayTeamSize}`} icon={Users} />
        <StatCard label="Congés à valider" value={String(displayPendingLeaves)} unit="demandes" icon={Inbox} tone={displayPendingLeaves ? 'amber' : undefined} />
        <StatCard label="NDF à valider" value={String(badges.expensesToValidate)} unit="notes" icon={ReceiptText} tone={badges.expensesToValidate ? 'amber' : undefined} />
        <StatCard label="Demandes équipe" value={String(badges.teamRequests)} unit="sollicitations" icon={CalendarClock} tone={badges.teamRequests ? 'amber' : undefined} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* File de validation */}
        <Card>
          <CardHeader title="À valider aujourd'hui" subtitle={`${totalToValidate} action(s) en attente`} action={<Link to="/team/temps/a-valider"><Button variant="outline" size="sm">Traiter <ArrowRight size={14} /></Button></Link>} />
          {totalToValidate > 0 ? (
            <div className="space-y-1.5">
              <Link to="/team/temps/a-valider" className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5 transition-colors hover:bg-info/[0.06]">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><Inbox size={16} /></span>
                <div className="flex-1"><p className="text-sm font-semibold text-ink">Congés & absences</p><p className="text-[11px] font-medium text-ink-400">{displayPendingLeaves} demande(s)</p></div>
                <ChevronRight size={16} className="text-ink-400" />
              </Link>
              <Link to="/team/quotidien/ndf-a-valider" className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5 transition-colors hover:bg-info/[0.06]">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><ReceiptText size={16} /></span>
                <div className="flex-1"><p className="text-sm font-semibold text-ink">Notes de frais</p><p className="text-[11px] font-medium text-ink-400">{badges.expensesToValidate} note(s)</p></div>
                <ChevronRight size={16} className="text-ink-400" />
              </Link>
              <Link to="/team/quotidien/demandes-equipe" className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5 transition-colors hover:bg-info/[0.06]">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><CalendarClock size={16} /></span>
                <div className="flex-1"><p className="text-sm font-semibold text-ink">Demandes équipe</p><p className="text-[11px] font-medium text-ink-400">{badges.teamRequests} sollicitation(s)</p></div>
                <ChevronRight size={16} className="text-ink-400" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-ok/[0.06] px-3 py-3 text-sm font-medium text-ink-700"><CheckCircle2 size={16} className="text-ok" /> Tout est à jour — aucune action en attente.</div>
          )}
        </Card>

        {/* Présence du jour */}
        <Card>
          <CardHeader title="Présence aujourd'hui" subtitle={`${displayPresent} présents · ${displayAbsent} absents`} action={<Users size={16} className="text-ink-400" />} />
          <div className="space-y-1.5">
            {hasLive ? (
              (liveDir ?? []).map((d) => {
                const leave = liveApprovedToday.find(r => r.employee_id === d.id);
                return (
                  <div key={d.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                    <Avatar name={dirName(d)} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{dirName(d)}</p>
                      <p className="truncate text-[11px] font-medium text-ink-400">{d.role_title ?? d.department ?? ''}</p>
                    </div>
                    {leave ? <StatusPill tone="warn" dot={false}>{categoryLabel(leave.leave_type_code)}</StatusPill> : <StatusPill tone="ok" dot>Présent</StatusPill>}
                  </div>
                );
              })
            ) : (
              team.map((e) => {
                const leave = onLeaveToday.find((r) => r.employeeId === e.id);
                return (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                    <Avatar name={employeeName(e)} size="xs" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{employeeName(e)}</p><p className="truncate text-[11px] font-medium text-ink-400">{e.role}</p></div>
                    {leave ? <StatusPill tone="warn" dot={false}>{categoryLabel(leave.code)}</StatusPill> : <StatusPill tone="ok" dot>Présent</StatusPill>}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Demandes en attente */}
        <Card>
          <CardHeader title="Demandes en attente" subtitle="Congés & absences de l'équipe" action={<Plane size={16} className="text-ink-400" />} />
          {(hasLive ? livePendingLeaves.length > 0 : pending.length > 0) ? (
            <div className="space-y-1.5">
              {hasLive ? (
                livePendingLeaves.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2">
                    <span className="text-sm font-semibold text-ink">{liveNameOf(r.employee_id)}</span>
                    <span className="text-[11px] font-medium text-ink-400">{categoryLabel(r.leave_type_code)} · {frDate(r.start_date)} → {frDate(r.end_date)}{r.counted_days ? ` · ${r.counted_days} j` : ''}</span>
                  </div>
                ))
              ) : (
                pending.slice(0, 5).map((r) => {
                  const emp = employeeById(r.employeeId);
                  return (
                    <div key={r.id} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2">
                      <span className="text-sm font-semibold text-ink">{emp ? employeeName(emp) : '—'}</span>
                      <span className="text-[11px] font-medium text-ink-400">{categoryLabel(r.code)} · {frDate(r.start)} → {frDate(r.end)} · {r.countedDays} j</span>
                    </div>
                  );
                })
              )}
            </div>
          ) : <p className="text-sm font-medium text-ink-400">Aucune demande en attente.</p>}
        </Card>

        {/* Pilotage rapide */}
        <Card>
          <CardHeader title="Pilotage rapide" subtitle="Objectifs & alertes managériales" action={<Target size={16} className="text-ink-400" />} />
          <div className="space-y-1.5">
            <Link to="/team/performance" className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5 transition-colors hover:bg-info/[0.06]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info"><Target size={16} /></span>
              <div className="flex-1"><p className="text-sm font-semibold text-ink">Objectifs équipe</p><p className="text-[11px] font-medium text-ink-400">Avancement OKR cascadés</p></div>
              <ChevronRight size={16} className="text-ink-400" />
            </Link>
            <Link to="/team/temps/anomalies" className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5 transition-colors hover:bg-info/[0.06]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warn/12 text-warn"><AlertTriangle size={16} /></span>
              <div className="flex-1"><p className="text-sm font-semibold text-ink">Anomalies pointage</p><p className="text-[11px] font-medium text-ink-400">À analyser</p></div>
              <ChevronRight size={16} className="text-ink-400" />
            </Link>
            <Link to="/team/reporting" className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5 transition-colors hover:bg-info/[0.06]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info"><Users size={16} /></span>
              <div className="flex-1"><p className="text-sm font-semibold text-ink">Reporting & pilotage</p><p className="text-[11px] font-medium text-ink-400">KPI · masse salariale agrégée</p></div>
              <ChevronRight size={16} className="text-ink-400" />
            </Link>
          </div>
        </Card>
      </div>

      <p className="px-2 text-center text-[11px] font-medium text-ink-400">
        Périmètre managérial strict · aucune rémunération individuelle, aucune donnée familiale ou médicale · actions tracées (source_surface = mss).
      </p>
    </div>
  );
}
