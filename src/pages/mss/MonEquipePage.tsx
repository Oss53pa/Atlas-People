import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List, Network, Search, ChevronRight, Plane, Wifi } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { StatusPill } from '../../components/ui/StatusPill';
import { TeamSubNav } from '../../components/mss/TeamSubNav';
import { useSurface } from '../../store/useSurface';
import { useManagerScope } from '../../store/useManagerScope';
import { useDirectory } from '../../store/useDirectory';
import { scopedTeam, managementChain, reportsOf, DEPTH_LABEL, useManagerId } from '../../lib/mss/scope';
import { employeeLeaveBalance, employeeName, matricule } from '../../data/mock';
import { isBackendConfigured, useTeamDirectory, useTeamLeaveBalances, dirName } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';
import { cn } from '../../lib/cn';

type ViewMode = 'list' | 'cards' | 'org';

type DisplayMember = {
  id: string;
  managerId: string | null;
  name: string;
  role: string;
  department: string;
  status: 'active' | 'onboarding' | 'leave' | 'notice';
  matricule: string;
  subordinateCount: number;
  cpRemaining: number;
};

const STATUS_META: Record<DisplayMember['status'], { label: string; tone: 'ok' | 'info' | 'warn' | 'danger' }> = {
  active: { label: 'Actif', tone: 'ok' },
  onboarding: { label: 'Intégration', tone: 'info' },
  leave: { label: 'Absent', tone: 'warn' },
  notice: { label: 'Préavis', tone: 'danger' },
};

function buildOrgChain(managerId: string | null, members: DisplayMember[]): { member: DisplayMember; depth: number }[] {
  if (!managerId) return [];
  const result: { member: DisplayMember; depth: number }[] = [];
  const visit = (parentId: string, depth: number) => {
    members.filter(m => m.managerId === parentId).forEach(m => {
      result.push({ member: m, depth });
      visit(m.id, depth + 1);
    });
  };
  visit(managerId, 1);
  return result;
}

/** EQ.1 — Annuaire managérial (cf. 03_MON_EQUIPE). Périmètre strict (R8),
 *  jamais de rémunération individuelle (R2). Vues Liste / Cartes / Organigramme. */
export function MonEquipePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const managerId = useManagerId();
  const depth = useManagerScope((s) => s.depth);
  const employees = useDirectory((s) => s.employees);
  const [view, setView] = useState<ViewMode>('list');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DisplayMember['status']>('all');

  // Live layer
  const { data: ctx } = useSessionContext();
  const { data: liveDir } = useTeamDirectory(ctx?.tenantId);
  const { data: liveBalances } = useTeamLeaveBalances(ctx?.tenantId);
  const hasLive = isBackendConfigured && Boolean(ctx?.tenantId);

  // Mock path → normalized
  const mockTeam = useMemo(() => scopedTeam(depth, employees, managerId), [depth, employees, managerId]);
  const mockDisplay: DisplayMember[] = useMemo(() => mockTeam.map(e => ({
    id: e.id,
    managerId: (employees.find(x => reportsOf(x.id, employees).some(r => r.id === e.id)))?.id ?? null,
    name: employeeName(e),
    role: e.role,
    department: e.department,
    status: e.status,
    matricule: matricule(e),
    subordinateCount: reportsOf(e.id, employees).length,
    cpRemaining: employeeLeaveBalance(e).remaining,
  })), [mockTeam, employees]);

  // Live path → normalized
  const liveDisplay: DisplayMember[] = useMemo(() => {
    if (!hasLive || !liveDir) return [];
    return liveDir.map(d => ({
      id: d.id,
      managerId: d.manager_id,
      name: dirName(d),
      role: d.role_title ?? '',
      department: d.department ?? '',
      status: (['active', 'onboarding', 'leave', 'notice'].includes(d.status) ? d.status : 'active') as DisplayMember['status'],
      matricule: d.employee_number ?? '',
      subordinateCount: liveDir.filter(x => x.manager_id === d.id).length,
      cpRemaining: (liveBalances ?? []).find(b => b.employee_id === d.id && b.leave_type_code === 'CP')?.remaining ?? 0,
    }));
  }, [hasLive, liveDir, liveBalances]);

  const allMembers = hasLive ? liveDisplay : mockDisplay;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allMembers.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (!q) return true;
      return `${m.name} ${m.role} ${m.department}`.toLowerCase().includes(q);
    });
  }, [allMembers, query, statusFilter]);

  const VIEWS: { mode: ViewMode; label: string; icon: typeof List }[] = [
    { mode: 'list', label: 'Liste', icon: List },
    { mode: 'cards', label: 'Cartes', icon: LayoutGrid },
    { mode: 'org', label: 'Organigramme', icon: Network },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-info">Mon équipe · {DEPTH_LABEL[depth]}</p>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-ink">Annuaire</h1>
          {hasLive && <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>}
        </div>
        <p className="mt-1 text-sm font-medium text-ink-500">{allMembers.length} collaborateurs dans mon périmètre · données managériales uniquement (aucune rémunération individuelle).</p>
      </div>

      <TeamSubNav />

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
        <TeamList team={filtered} />
      ) : view === 'cards' ? (
        <TeamCards team={filtered} />
      ) : (
        <TeamOrg members={allMembers} managerId={hasLive ? (ctx?.employeeId ?? null) : managerId} query={query} statusFilter={statusFilter} />
      )}

      <p className="px-2 text-center text-[11px] font-medium text-ink-400">
        Recherche limitée à mon périmètre managérial (R8) · colonne rémunération volontairement absente (R2).
      </p>
    </div>
  );
}

function MemberMeta({ m }: { m: DisplayMember }) {
  return (
    <>
      {m.subordinateCount > 0 && <StatusPill tone="info" dot={false}>{m.subordinateCount} N-1</StatusPill>}
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-400"><Plane size={12} /> {m.cpRemaining} j CP</span>
    </>
  );
}

function TeamList({ team }: { team: DisplayMember[] }) {
  return (
    <Card className="divide-y divide-line/70 !p-0">
      {team.map((m) => {
        const st = STATUS_META[m.status];
        return (
          <Link key={m.id} to={`/team/equipe/${m.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-info/[0.04]">
            <Avatar name={m.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
              <p className="truncate text-[11px] font-medium text-ink-400">{m.role} · {m.department}{m.matricule ? ` · ${m.matricule}` : ''}</p>
            </div>
            <div className="hidden items-center gap-3 sm:flex"><MemberMeta m={m} /></div>
            <StatusPill tone={st.tone} dot>{st.label}</StatusPill>
            <ChevronRight size={16} className="text-ink-400" />
          </Link>
        );
      })}
    </Card>
  );
}

function TeamCards({ team }: { team: DisplayMember[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {team.map((m) => {
        const st = STATUS_META[m.status];
        return (
          <Link key={m.id} to={`/team/equipe/${m.id}`} className="group rounded-2xl border border-line bg-surface p-4 transition-all hover:border-info/30 hover:shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar name={m.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
                <p className="truncate text-[11px] font-medium text-ink-400">{m.role}</p>
              </div>
              <StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill>
            </div>
            <p className="mt-3 text-[11px] font-medium text-ink-400">{m.department}{m.matricule ? ` · ${m.matricule}` : ''}</p>
            <div className="mt-3 flex items-center gap-3 border-t border-line/70 pt-3"><MemberMeta m={m} /></div>
          </Link>
        );
      })}
    </div>
  );
}

function TeamOrg({ members, managerId, query, statusFilter }: { members: DisplayMember[]; managerId: string | null; query: string; statusFilter: 'all' | DisplayMember['status'] }) {
  const manager = members.find(m => m.id === managerId) ?? members[0];
  const chain = useMemo(() => buildOrgChain(managerId, members), [managerId, members]);
  const q = query.trim().toLowerCase();

  if (!manager) return null;

  return (
    <Card className="space-y-1.5">
      <div className="flex items-center gap-3 rounded-xl bg-info/[0.06] px-3 py-2.5 ring-1 ring-info/20">
        <Avatar name={manager.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{manager.name} <span className="text-[11px] font-medium text-info">(vous)</span></p>
          <p className="truncate text-[11px] font-medium text-ink-400">{manager.role}</p>
        </div>
      </div>
      {chain.filter((n) => {
        if (statusFilter !== 'all' && n.member.status !== statusFilter) return false;
        if (!q) return true;
        return `${n.member.name} ${n.member.role}`.toLowerCase().includes(q);
      }).map((n) => {
        const m = n.member;
        const st = STATUS_META[m.status];
        return (
          <Link key={m.id} to={`/team/equipe/${m.id}`}
            style={{ marginLeft: `${n.depth * 1.5}rem` }}
            className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2 transition-colors hover:bg-info/[0.06]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">N-{n.depth}</span>
            <Avatar name={m.name} size="xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
              <p className="truncate text-[11px] font-medium text-ink-400">{m.role}{m.subordinateCount > 0 ? ` · encadre ${m.subordinateCount}` : ''}</p>
            </div>
            <StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill>
          </Link>
        );
      })}
    </Card>
  );
}
