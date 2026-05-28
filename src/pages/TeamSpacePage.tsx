import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarCheck, Inbox, Plane, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatCard } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useDirectory } from '../store/useDirectory';
import { LEAVE_REQUESTS, employeeName, employeeById } from '../data/mock';
import { DEMO_USER } from '../app/spaces';

const TODAY = '2026-05-28';

/** Espace Manager (MSS) — landing "Mon équipe". Périmètre strictement limité aux
 *  N-1. Aucune donnée sensible (rémunération/famille/médical) — règles dures M1. */
export function TeamSpacePage() {
  const employees = useDirectory((s) => s.employees);

  const team = useMemo(() => {
    const managed = employees.filter((e) => e.manager === DEMO_USER.name);
    if (managed.length) return managed;
    const hr = employees.filter((e) => e.department === 'Ressources Humaines' && e.id !== 'e0');
    return (hr.length ? hr : employees.slice(0, 6));
  }, [employees]);

  const teamIds = new Set(team.map((e) => e.id));
  const teamRequests = LEAVE_REQUESTS.filter((r) => teamIds.has(r.employeeId));
  const pending = teamRequests.filter((r) => r.status === 'pending');
  const onLeaveToday = teamRequests.filter((r) => r.status === 'approved' && r.start <= TODAY && r.end >= TODAY);
  const onLeaveIds = new Set(onLeaveToday.map((r) => r.employeeId));
  const presentCount = team.length - onLeaveIds.size;

  return (
    <div className="animate-fade-up space-y-6">
      <SectionHeader
        eyebrow="Espace Manager · MSS"
        title="Mon équipe"
        description={`Pilotage de votre équipe (${team.length} collaborateur${team.length > 1 ? 's' : ''}). Validation et suivi du temps — sans accès aux données sensibles (rémunération, famille, médical).`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Effectif équipe" value={String(team.length)} unit="pers." icon={Users} />
        <StatCard label="Présents aujourd'hui" value={String(presentCount)} unit={`/ ${team.length}`} icon={CalendarCheck} tone="amber" />
        <StatCard label="En congé aujourd'hui" value={String(onLeaveIds.size)} unit="absents" icon={Plane} />
        <StatCard label="Demandes à valider" value={String(pending.length)} unit="en attente" icon={Inbox} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Demandes à valider */}
        <Card className="lg:col-span-2" inset={false}>
          <div className="p-5 pb-3">
            <CardHeader
              title="Demandes à valider"
              subtitle="Congés & absences de l'équipe"
              className="mb-0"
              action={<Link to="/team/time/approvals"><Button variant="ghost" size="sm">Ouvrir <ArrowRight size={14} /></Button></Link>}
            />
          </div>
          {pending.length > 0 ? (
            <div className="divide-y divide-line">
              {pending.map((r) => {
                const emp = employeeById(r.employeeId);
                if (!emp) return null;
                const cat = motiveLabel(r.type);
                return (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={employeeName(emp)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{employeeName(emp)}</p>
                      <p className="text-[11px] font-medium text-ink-400">
                        {cat} · du {new Date(`${r.start}T00:00:00`).toLocaleDateString('fr-FR')} au {new Date(`${r.end}T00:00:00`).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <StatusPill tone="warn" dot={false}>À valider</StatusPill>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-5 pb-5 text-sm font-medium text-ink-400">Aucune demande en attente.</p>
          )}
        </Card>

        {/* Présence du jour */}
        <Card>
          <CardHeader title="Présence du jour" subtitle={new Date(`${TODAY}T00:00:00`).toLocaleDateString('fr-FR')} action={<ShieldCheck size={16} className="text-ink-400" />} />
          <div className="space-y-1.5">
            {team.map((e) => {
              const absent = onLeaveIds.has(e.id);
              return (
                <div key={e.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                  <Avatar name={employeeName(e)} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{employeeName(e)}</p>
                    <p className="truncate text-[11px] font-medium text-ink-400">{e.role}</p>
                  </div>
                  <StatusPill tone={absent ? 'warn' : 'ok'} dot>{absent ? 'En congé' : 'Présent'}</StatusPill>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function motiveLabel(code: string): string {
  return code === 'annual' ? 'Congé payé' : code === 'sick' ? 'Maladie' : code === 'family' ? 'Spécial familial' : 'Absence';
}
