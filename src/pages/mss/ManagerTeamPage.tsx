import { useEffect, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { GitBranch, Users, ChevronRight } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { StatusPill } from '../../components/ui/StatusPill';
import { TeamSubNav } from '../../components/mss/TeamSubNav';
import { useSurface } from '../../store/useSurface';
import { useManagerScope } from '../../store/useManagerScope';
import { useDirectory } from '../../store/useDirectory';
import { managementChain, reportsOf, maxChainDepth, useManagerId, DEPTH_LABEL } from '../../lib/mss/scope';
import { employeeName, employeeLeaveBalance, type EmployeeRecord } from '../../data/mock';

/** EQ.4 — Annuaire des managers (cf. 03_MON_EQUIPE). Réservé aux managers de
 *  managers (N2+). Liste les N-1 qui encadrent à leur tour, avec leur sous-équipe. */
export function ManagerTeamPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const managerId = useManagerId();
  const depth = useManagerScope((s) => s.depth);
  const employees = useDirectory((s) => s.employees);

  const isN2plus = maxChainDepth(employees, managerId) >= 2;
  // Managers intermédiaires = N-1 directs qui ont eux-mêmes des subordonnés.
  const subManagers = useMemo(() =>
    managementChain(managerId, employees)
      .filter((n) => n.depth === 1)
      .map((n) => ({ manager: n.employee, reports: reportsOf(n.employee.id, employees) }))
      .filter((g) => g.reports.length > 0), [employees, managerId]);

  if (!isN2plus) return <Navigate to="/team/equipe" replace />;

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-info">Mon équipe · {DEPTH_LABEL[depth]}</p>
        <h1 className="text-2xl font-semibold text-ink">Mes managers</h1>
        <p className="mt-1 text-sm font-medium text-ink-500">{subManagers.length} manager(s) de proximité dans mon périmètre, avec leur équipe directe.</p>
      </div>

      <TeamSubNav />

      <div className="space-y-5">
        {subManagers.map(({ manager, reports }) => (
          <Card key={manager.id}>
            <CardHeader
              title={employeeName(manager)}
              subtitle={`${manager.role} · ${reports.length} collaborateur(s) directs`}
              action={<Link to={`/team/equipe/${manager.id}`}><span className="inline-flex items-center gap-1 text-xs font-semibold text-info hover:underline">Vue 360° <ChevronRight size={13} /></span></Link>}
            />
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {reports.map((r) => <MemberRow key={r.id} e={r} />)}
            </div>
          </Card>
        ))}
        {subManagers.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-info/10 text-info"><GitBranch size={22} /></span>
            <p className="text-sm font-medium text-ink-500">Aucun manager de proximité dans votre périmètre actuel.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function MemberRow({ e }: { e: EmployeeRecord }) {
  const bal = employeeLeaveBalance(e);
  return (
    <Link to={`/team/equipe/${e.id}`} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2 transition-colors hover:bg-info/[0.06]">
      <Avatar name={employeeName(e)} size="xs" />
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{employeeName(e)}</p><p className="truncate text-[11px] font-medium text-ink-400">{e.role}</p></div>
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-400"><Users size={12} /> {bal.remaining} j</span>
      {e.status !== 'active' && <StatusPill tone={e.status === 'notice' ? 'danger' : e.status === 'leave' ? 'warn' : 'info'} dot={false}>{e.status === 'notice' ? 'Préavis' : e.status === 'leave' ? 'Absent' : 'Intégration'}</StatusPill>}
    </Link>
  );
}
