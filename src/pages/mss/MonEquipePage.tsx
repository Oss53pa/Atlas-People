import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List, Network, Search, ChevronRight, Plane } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { StatusPill } from '../../components/ui/StatusPill';
import { TeamSubNav } from '../../components/mss/TeamSubNav';
import { useSurface } from '../../store/useSurface';
import { useManagerScope } from '../../store/useManagerScope';
import { useDirectory } from '../../store/useDirectory';
import { scopedTeam, managementChain, reportsOf, DEPTH_LABEL, MANAGER_ID } from '../../lib/mss/scope';
import { employeeLeaveBalance, employeeName, matricule, type EmployeeRecord } from '../../data/mock';
import { cn } from '../../lib/cn';

type ViewMode = 'list' | 'cards' | 'org';

const STATUS_META: Record<EmployeeRecord['status'], { label: string; tone: 'ok' | 'info' | 'warn' | 'danger' }> = {
  active: { label: 'Actif', tone: 'ok' },
  onboarding: { label: 'Intégration', tone: 'info' },
  leave: { label: 'Absent', tone: 'warn' },
  notice: { label: 'Préavis', tone: 'danger' },
};

/** EQ.1 — Annuaire managérial (cf. 03_MON_EQUIPE). Périmètre strict (R8),
 *  jamais de rémunération individuelle (R2). Vues Liste / Cartes / Organigramme. */
export function MonEquipePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const depth = useManagerScope((s) => s.depth);
  const employees = useDirectory((s) => s.employees);
  const [view, setView] = useState<ViewMode>('list');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EmployeeRecord['status']>('all');

  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return team.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (!q) return true;
      return `${employeeName(e)} ${e.role} ${e.department}`.toLowerCase().includes(q);
    });
  }, [team, query, statusFilter]);

  const VIEWS: { mode: ViewMode; label: string; icon: typeof List }[] = [
    { mode: 'list', label: 'Liste', icon: List },
    { mode: 'cards', label: 'Cartes', icon: LayoutGrid },
    { mode: 'org', label: 'Organigramme', icon: Network },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-info">Mon équipe · {DEPTH_LABEL[depth]}</p>
        <h1 className="text-2xl font-semibold text-ink">Annuaire</h1>
        <p className="mt-1 text-sm font-medium text-ink-500">{team.length} collaborateurs dans mon périmètre · données managériales uniquement (aucune rémunération individuelle).</p>
      </div>

      <TeamSubNav />

      {/* Barre d'outils : recherche, filtre statut, bascule de vue */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher dans mon périmètre…"
              className="w-full rounded-xl border border-line bg-surface2 py-2 pl-9 pr-3 text-sm font-medium text-ink outline-none transition-colors placeholder:text-ink-400 focus:border-info/40 focus:bg-surface"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-xl border border-line bg-surface2 px-3 py-2 text-sm font-semibold text-ink-700 outline-none focus:border-info/40"
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actif</option>
            <option value="onboarding">Intégration</option>
            <option value="leave">Absent</option>
            <option value="notice">Préavis</option>
          </select>
        </div>
        <div className="flex shrink-0 gap-1 rounded-xl border border-line bg-surface2 p-1">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            return (
              <button key={v.mode} onClick={() => setView(v.mode)}
                className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                  view === v.mode ? 'bg-info/12 text-info ring-1 ring-info/30' : 'text-ink-500 hover:text-ink')}>
                <Icon size={14} /> {v.label}
              </button>
            );
          })}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="py-12 text-center text-sm font-medium text-ink-400">Aucun collaborateur ne correspond à votre recherche.</Card>
      ) : view === 'list' ? (
        <TeamList team={filtered} employees={employees} />
      ) : view === 'cards' ? (
        <TeamCards team={filtered} employees={employees} />
      ) : (
        <TeamOrg employees={employees} depth={depth} query={query} statusFilter={statusFilter} />
      )}

      <p className="px-2 text-center text-[11px] font-medium text-ink-400">
        Recherche limitée à mon périmètre managérial (R8) · colonne rémunération volontairement absente (R2).
      </p>
    </div>
  );
}

function MemberMeta({ e, employees }: { e: EmployeeRecord; employees: EmployeeRecord[] }) {
  const subordinates = reportsOf(e.id, employees).length;
  const balance = employeeLeaveBalance(e);
  return (
    <>
      {subordinates > 0 && <StatusPill tone="info" dot={false}>{subordinates} N-1</StatusPill>}
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-400"><Plane size={12} /> {balance.remaining} j CP</span>
    </>
  );
}

function TeamList({ team, employees }: { team: EmployeeRecord[]; employees: EmployeeRecord[] }) {
  return (
    <Card className="divide-y divide-line/70 !p-0">
      {team.map((e) => {
        const st = STATUS_META[e.status];
        return (
          <Link key={e.id} to={`/team/equipe/${e.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-info/[0.04]">
            <Avatar name={employeeName(e)} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{employeeName(e)}</p>
              <p className="truncate text-[11px] font-medium text-ink-400">{e.role} · {e.department} · {matricule(e)}</p>
            </div>
            <div className="hidden items-center gap-3 sm:flex"><MemberMeta e={e} employees={employees} /></div>
            <StatusPill tone={st.tone} dot>{st.label}</StatusPill>
            <ChevronRight size={16} className="text-ink-400" />
          </Link>
        );
      })}
    </Card>
  );
}

function TeamCards({ team, employees }: { team: EmployeeRecord[]; employees: EmployeeRecord[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {team.map((e) => {
        const st = STATUS_META[e.status];
        return (
          <Link key={e.id} to={`/team/equipe/${e.id}`} className="group rounded-2xl border border-line bg-surface p-4 transition-all hover:border-info/30 hover:shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar name={employeeName(e)} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{employeeName(e)}</p>
                <p className="truncate text-[11px] font-medium text-ink-400">{e.role}</p>
              </div>
              <StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill>
            </div>
            <p className="mt-3 text-[11px] font-medium text-ink-400">{e.department} · {matricule(e)}</p>
            <div className="mt-3 flex items-center gap-3 border-t border-line/70 pt-3"><MemberMeta e={e} employees={employees} /></div>
          </Link>
        );
      })}
    </div>
  );
}

function TeamOrg({ employees, depth, query, statusFilter }: { employees: EmployeeRecord[]; depth: ReturnType<typeof useManagerScope.getState>['depth']; query: string; statusFilter: 'all' | EmployeeRecord['status'] }) {
  const chain = useMemo(() => managementChain(MANAGER_ID, employees), [employees]);
  const manager = employees.find((e) => e.id === MANAGER_ID)!;
  const q = query.trim().toLowerCase();
  const limit = depth === 'direct' ? 1 : depth === 'department' ? 2 : 99;

  return (
    <Card className="space-y-1.5">
      <div className="flex items-center gap-3 rounded-xl bg-info/[0.06] px-3 py-2.5 ring-1 ring-info/20">
        <Avatar name={employeeName(manager)} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{employeeName(manager)} <span className="text-[11px] font-medium text-info">(vous)</span></p>
          <p className="truncate text-[11px] font-medium text-ink-400">{manager.role}</p>
        </div>
      </div>
      {chain.filter((n) => n.depth <= limit).filter((n) => {
        if (statusFilter !== 'all' && n.employee.status !== statusFilter) return false;
        if (!q) return true;
        return `${employeeName(n.employee)} ${n.employee.role}`.toLowerCase().includes(q);
      }).map((n) => {
        const e = n.employee;
        const st = STATUS_META[e.status];
        const subordinates = reportsOf(e.id, employees).length;
        return (
          <Link key={e.id} to={`/team/equipe/${e.id}`}
            style={{ marginLeft: `${n.depth * 1.5}rem` }}
            className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2 transition-colors hover:bg-info/[0.06]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">N-{n.depth}</span>
            <Avatar name={employeeName(e)} size="xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{employeeName(e)}</p>
              <p className="truncate text-[11px] font-medium text-ink-400">{e.role}{subordinates > 0 ? ` · encadre ${subordinates}` : ''}</p>
            </div>
            <StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill>
          </Link>
        );
      })}
    </Card>
  );
}
