import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Plus, List, Network, Inbox, MoreVertical, Eye, FileSignature, LogOut,
  ArrowUp, ArrowDown, Clock, ShieldAlert, AlertTriangle, X, Upload, Settings, Wifi,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatusPill } from '../components/ui/StatusPill';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { OrgChart } from '../components/OrgChart';
import { countryByCode } from '../data/countries';
import { DEPARTMENTS, employeeName, employeeAlerts, employeeProtectedUntil, type EmployeeRecord } from '../data/mock';
import { useDirectory } from '../store/useDirectory';
import { useRequests } from '../store/useRequests';
import { cn } from '../lib/cn';
import { useEmployees, useEmployeeStats, isBackendConfigured } from '../lib/m1/supabaseLive';
import { useAuth } from '../lib/auth';

const STATUS: Record<EmployeeRecord['status'], { label: string; tone: 'ok' | 'info' | 'warn' | 'danger' }> = {
  active: { label: 'Actif', tone: 'ok' },
  onboarding: { label: 'Onboarding', tone: 'info' },
  leave: { label: 'En congé', tone: 'warn' },
  notice: { label: 'Préavis', tone: 'danger' },
};
const STATUS_KEYS = Object.keys(STATUS) as EmployeeRecord['status'][];

type SortField = 'name' | 'role' | 'seniority' | 'status';

function seniority(e: EmployeeRecord): { months: number; label: string } {
  const hire = new Date(e.hireDate);
  const now = new Date('2026-05-28');
  const months = Math.max(0, (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth()));
  const y = Math.floor(months / 12);
  const m = months % 12;
  return { months, label: y > 0 ? `${y}a${m > 0 ? ` ${m}m` : ''}` : `${m}m` };
}

export function CollaborateursPage() {
  const navigate = useNavigate();
  const mockEmployees = useDirectory((s) => s.employees);
  const pendingRequests = useRequests((s) => s.requests.filter((r) => r.status === 'pending').length);
  const { tenantId } = useAuth();
  const { data: liveStats } = useEmployeeStats(tenantId ?? undefined);
  const { data: liveEmps } = useEmployees(tenantId ?? undefined);

  // Live-first : si backend actif et données DB disponibles, les convertir en EmployeeRecord
  const employees: EmployeeRecord[] = useMemo(() => {
    if (!isBackendConfigured || !liveEmps || liveEmps.length === 0) return mockEmployees;
    return liveEmps.map((e) => ({
      id: e.id,
      firstName: e.first_name,
      lastName: e.last_name,
      role: e.role_title ?? '',
      department: e.department ?? '',
      countryCode: e.country_code,
      email: e.email ?? '',
      contractType: (e.contract as 'CDI' | 'CDD' | 'Stage') ?? 'CDI',
      hireDate: e.hire_date ?? '',
      status: (e.status as EmployeeRecord['status']) ?? 'active',
      baseSalary: e.base_salary,
      taxableAllowances: e.taxable_allowances,
      nonTaxableAllowances: e.non_taxable_allowances,
      fiscalParts: Number(e.fiscal_parts),
      retentionAttention: 0,
    }));
  }, [liveEmps, mockEmployees]);
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState<string | null>(null);
  const [status, setStatus] = useState<EmployeeRecord['status'] | null>(null);
  const [view, setView] = useState<'list' | 'org'>('list');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const hasFilters = query.trim() !== '' || dept !== null || status !== null;

  const filtered = useMemo(() => {
    const rows = employees.filter((e) => {
      const matchQ = `${employeeName(e)} ${e.role} ${e.email} ${e.department}`.toLowerCase().includes(query.toLowerCase());
      const matchD = !dept || e.department === dept;
      const matchS = !status || e.status === status;
      return matchQ && matchD && matchS;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = employeeName(a).localeCompare(employeeName(b));
      else if (sortField === 'role') cmp = a.role.localeCompare(b.role);
      else if (sortField === 'seniority') cmp = seniority(a).months - seniority(b).months;
      else if (sortField === 'status') cmp = STATUS[a.status].label.localeCompare(STATUS[b.status].label);
      return cmp * dir;
    });
    return rows;
  }, [query, dept, status, employees, sortField, sortDir]);

  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(f); setSortDir('asc'); }
  };
  const reset = () => { setQuery(''); setDept(null); setStatus(null); };
  const openMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu({ id, x: r.right, y: r.bottom });
  };
  const menuEmp = menu ? employees.find((e) => e.id === menu.id) : undefined;

  return (
    <div className="animate-fade-up">
      <SectionHeader
        eyebrow="Bloc A · M1"
        title="Collaborateurs"
        description="Dossier vivant mis à jour par événements — chaque collaborateur relève du régime de son pays d'affectation."
        action={
          <>
            <div className="flex rounded-xl border border-line bg-surface p-0.5">
              <ToggleBtn active={view === 'list'} onClick={() => setView('list')} icon={List} label="Liste" />
              <ToggleBtn active={view === 'org'} onClick={() => setView('org')} icon={Network} label="Organigramme" />
            </div>
            <Link to="/collaborateurs/demandes">
              <Button variant="outline" size="sm">
                <Inbox size={15} /> Demandes{pendingRequests > 0 ? ` (${pendingRequests})` : ''}
              </Button>
            </Link>
            <Link to="/parametres"><Button variant="ghost" size="sm"><Settings size={15} /> Paramètres</Button></Link>
            <Link to="/collaborateurs/import"><Button variant="outline" size="sm"><Upload size={15} /> Importer</Button></Link>
            <Button size="sm" onClick={() => navigate('/collaborateurs/nouveau')}>
              <Plus size={15} /> Nouveau collaborateur
            </Button>
          </>
        }
      />

      {view === 'org' ? (
        <Card>
          <OrgChart />
        </Card>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom, matricule, poste…"
                className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm font-medium text-ink placeholder:text-ink-400 focus:border-amber/40 focus:outline-none focus:ring-2 focus:ring-amber/15"
              />
            </div>
            <select
              value={status ?? ''}
              onChange={(e) => setStatus((e.target.value || null) as EmployeeRecord['status'] | null)}
              className="h-10 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none"
            >
              <option value="">Tous statuts</option>
              {STATUS_KEYS.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
            </select>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Chip active={dept === null} onClick={() => setDept(null)}>Tous</Chip>
            {DEPARTMENTS.map((d) => (
              <Chip key={d} active={dept === d} onClick={() => setDept(d)}>{d}</Chip>
            ))}
            <span className="ml-auto flex items-center gap-3">
              <span className="text-[12px] font-semibold text-ink-400">
                {filtered.length} collaborateur{filtered.length > 1 ? 's' : ''}{hasFilters ? ' (filtré)' : ''}
              </span>
              {hasFilters && (
                <button onClick={reset} className="inline-flex items-center gap-1 text-[12px] font-bold text-amber-deep hover:underline">
                  <X size={13} /> Réinitialiser
                </button>
              )}
            </span>
          </div>

          <Card inset={false}>
            <div className="hidden grid-cols-[2.4fr_1.6fr_1fr_1fr_0.9fr_44px] gap-4 border-b border-line px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-400 lg:grid">
              <SortHead label="Collaborateur" field="name" sortField={sortField} sortDir={sortDir} onClick={toggleSort} />
              <SortHead label="Poste" field="role" sortField={sortField} sortDir={sortDir} onClick={toggleSort} />
              <span>Pays</span>
              <SortHead label="Statut" field="status" sortField={sortField} sortDir={sortDir} onClick={toggleSort} />
              <SortHead label="Ancienneté" field="seniority" sortField={sortField} sortDir={sortDir} onClick={toggleSort} />
              <span />
            </div>
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-ink">Aucun collaborateur ne correspond à ces filtres.</p>
                {hasFilters && <button onClick={reset} className="mt-2 text-[12px] font-bold text-amber-deep hover:underline">Réinitialiser les filtres</button>}
              </div>
            ) : (
              <div className="divide-y divide-line">
                {filtered.map((e) => {
                  const country = countryByCode(e.countryCode);
                  const st = STATUS[e.status];
                  const sen = seniority(e);
                  const alerts = employeeAlerts(e);
                  const urgent = alerts.some((a) => a.urgency === 'critical' || a.urgency === 'soon');
                  const isProtected = employeeProtectedUntil(e) !== null;
                  return (
                    <div
                      key={e.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/collaborateurs/${e.id}`)}
                      onKeyDown={(ev) => { if (ev.key === 'Enter') navigate(`/collaborateurs/${e.id}`); }}
                      className="grid w-full cursor-pointer grid-cols-1 items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-amber/[0.04] focus:bg-amber/[0.04] focus:outline-none lg:grid-cols-[2.4fr_1.6fr_1fr_1fr_0.9fr_44px]"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={employeeName(e)} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-bold text-ink">{employeeName(e)}</p>
                            {urgent && <AlertTriangle size={12} className="shrink-0 text-warn" aria-label="Document/échéance à traiter" />}
                            {isProtected && <ShieldAlert size={12} className="shrink-0 text-amber-deep" aria-label="Statut protégé" />}
                          </div>
                          <p className="truncate text-[11px] font-medium text-ink-400">{e.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 lg:block">
                        <p className="truncate text-sm font-semibold text-ink-700">{e.role}</p>
                        <p className="hidden text-[11px] font-medium text-ink-400 lg:block">{e.department}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{country.flag}</span>
                        <span className="text-sm font-semibold text-ink-700">{e.countryCode}</span>
                      </div>
                      <div><StatusPill tone={st.tone}>{st.label}</StatusPill></div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-ink-700"><Clock size={13} className="text-ink-400" /> {sen.label}</div>
                      <div className="flex justify-end">
                        <button
                          onClick={(ev) => openMenu(ev, e.id)}
                          aria-label="Actions"
                          className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink/[0.06] hover:text-ink"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Menu kebab (fixe — évite le clipping des cartes) */}
      {menu && menuEmp && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div className="fixed z-50 w-56 rounded-xl border border-line bg-surface p-1 shadow-float" style={{ top: menu.y + 4, left: Math.max(8, menu.x - 224) }}>
            <MenuItem icon={Eye} label="Voir la fiche" onClick={() => { navigate(`/collaborateurs/${menuEmp.id}`); setMenu(null); }} />
            <MenuItem icon={FileSignature} label="Créer un avenant" onClick={() => { navigate(`/collaborateurs/${menuEmp.id}/avenant`); setMenu(null); }} />
            <MenuItem icon={LogOut} label="Initier la sortie" onClick={() => { navigate(`/collaborateurs/${menuEmp.id}/sortie`); setMenu(null); }} />
            <MenuItem icon={Network} label="Voir dans l'organigramme" onClick={() => { setView('org'); setMenu(null); }} />
          </div>
        </>
      )}
    </div>
  );
}

function SortHead({ label, field, sortField, sortDir, onClick }: { label: string; field: SortField; sortField: SortField; sortDir: 'asc' | 'desc'; onClick: (f: SortField) => void }) {
  const active = sortField === field;
  return (
    <button onClick={() => onClick(field)} className={cn('inline-flex items-center gap-1 text-left uppercase tracking-wider transition-colors hover:text-ink', active ? 'text-amber-deep' : 'text-ink-400')}>
      {label}
      {active && (sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
    </button>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: typeof Eye; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-ink-700 transition-colors hover:bg-amber/[0.06] hover:text-ink">
      <Icon size={15} className="text-ink-400" /> {label}
    </button>
  );
}

function ToggleBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof List; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all',
        active ? 'bg-amber text-night' : 'text-ink-500 hover:text-ink',
      )}
    >
      <Icon size={14} className={active ? 'text-amber' : 'text-ink-400'} /> <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
        active ? 'border-amber/40 bg-amber/12 text-amber-deep' : 'border-line bg-surface text-ink-500 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
