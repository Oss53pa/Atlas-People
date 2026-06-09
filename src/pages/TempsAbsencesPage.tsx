import { useMemo, useState } from 'react';
import {
  Check,
  X,
  Clock,
  ShieldCheck,
  ShieldX,
  CalendarDays,
  AlarmClock,
  Fingerprint,
  Gauge,
  Plane,
  RefreshCw,
  AlertTriangle,
  TableProperties,
  LogIn,
  LogOut,
  Coffee,
  WifiOff,
  Wifi,
} from 'lucide-react';
import { PropheticHint } from '../components/ui/feedback';
import { Card, CardHeader } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatusPill } from '../components/ui/StatusPill';
import { StatCard } from '../components/ui/StatCard';
import { Avatar } from '../components/ui/Avatar';
import { ProgressBar } from '../components/charts/ProgressBar';
import { Money } from '../lib/money';
import { workingDaysBetween } from '../lib/time/workingDays';
import { timeRulesFor } from '../lib/time/leaveRules';
import { computeOvertime } from '../lib/time/overtime';
import { holidaysFor } from '../lib/time/holidays';
import { ComplianceGuard } from '../lib/compliance/ComplianceGuard';
import { LEAVE_CATALOG, CATEGORY_LABEL, leaveTypeByCode, type LeaveCategory } from '../lib/m2/leaveTypes';
import { computeSelfLeaveBalance } from '../lib/m2/selfBalance';
import { buildFleetDecompte, monthBounds, type MonthDecompte } from '../lib/m2/timesheet';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../lib/auth';
import {
  useM2TimeStats, isBackendConfigured,
  useM2LeavesLive, useM2ClockingsLive, useM2OvertimeLive,
  useM2DecideLeave, useM2DecideOvertime,
} from '../lib/m2/supabaseLive';
import { useTimeOff, type TimeOffRequest } from '../store/useTimeOff';
import { useClocking, type ClockingType, type Clocking } from '../store/useClocking';
import { useOvertime, type OvertimeRecord } from '../store/useOvertime';
import { countryByCode, currencyOf } from '../data/countries';
import { EMPLOYEES, employeeById, employeeName } from '../data/mock';
import { cn } from '../lib/cn';

type Tab = 'synthese' | 'conges' | 'pointage' | 'hsup' | 'compteurs' | 'calendrier';

const MONTHS = ['2026-04', '2026-05', '2026-06'];
const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

export function TempsAbsencesPage() {
  const activeCountry = useAppStore((s) => s.activeCountry);
  const country = countryByCode(activeCountry);
  const roster = EMPLOYEES.filter((e) => e.countryCode === activeCountry);
  const [tab, setTab] = useState<Tab>('synthese');
  const [month, setMonth] = useState('2026-05');

  const { tenantId } = useAuth();
  const { data: liveStats } = useM2TimeStats(tenantId ?? undefined);
  const showLive = isBackendConfigured && !!liveStats && (liveStats.totalLeaves > 0 || liveStats.clockings > 0);

  return (
    <div className="animate-fade-up space-y-6">
      <SectionHeader
        eyebrow="Bloc A · M2"
        title="Temps & absences"
        description={`Congés, pointage et heures supplémentaires dans le respect strict du droit du travail · ${country.flag} ${country.name}`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <TabButton active={tab === 'synthese'} onClick={() => setTab('synthese')} icon={TableProperties}>Synthèse</TabButton>
        <TabButton active={tab === 'conges'} onClick={() => setTab('conges')} icon={Plane}>Congés</TabButton>
        <TabButton active={tab === 'pointage'} onClick={() => setTab('pointage')} icon={Fingerprint}>Pointage</TabButton>
        <TabButton active={tab === 'hsup'} onClick={() => setTab('hsup')} icon={Clock}>Heures supp.</TabButton>
        <TabButton active={tab === 'compteurs'} onClick={() => setTab('compteurs')} icon={Gauge}>Compteurs</TabButton>
        <TabButton active={tab === 'calendrier'} onClick={() => setTab('calendrier')} icon={CalendarDays}>Calendrier</TabButton>

        <div className="ml-auto flex items-center gap-2">
          {showLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600" title="Données synchronisées avec la base">
              <Wifi size={11} /> {liveStats!.totalLeaves} congé(s) · {liveStats!.clockings} pointage(s) en DB
            </span>
          )}
          {(tab === 'synthese' || tab === 'pointage' || tab === 'calendrier') && (
            <MonthSelect month={month} onChange={setMonth} />
          )}
        </div>
      </div>

      {tab === 'synthese' && <SyntheseTab country={activeCountry} roster={roster} month={month} />}
      {tab === 'conges' && <CongesTab country={activeCountry} roster={roster} />}
      {tab === 'pointage' && <PointageTab country={activeCountry} roster={roster} month={month} />}
      {tab === 'hsup' && <HeuresSupTab country={activeCountry} roster={roster} />}
      {tab === 'compteurs' && <CompteursTab country={activeCountry} roster={roster} />}
      {tab === 'calendrier' && <CalendrierTab country={activeCountry} roster={roster} month={month} />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof Clock; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all',
        active ? 'border-amber bg-amber text-night' : 'border-line bg-surface text-ink-500 hover:text-ink',
      )}
    >
      <Icon size={15} className={active ? 'text-amber' : 'text-ink-400'} /> {children}
    </button>
  );
}

/** Source de données M2 : live Supabase si dispo, sinon stores Zustand (démo).
 *  Les listes live sont déjà mappées sur les shapes des stores. */
function useM2Live(): {
  tenantId: string | undefined;
  live: boolean;
  requests: TimeOffRequest[];
  clockings: Clocking[];
  overtime: OvertimeRecord[];
} {
  const { tenantId } = useAuth();
  const tid = tenantId ?? undefined;
  const storeReq = useTimeOff((s) => s.requests);
  const storeClk = useClocking((s) => s.clockings);
  const storeOt = useOvertime((s) => s.records);
  const { data: liveReq } = useM2LeavesLive(tid);
  const { data: liveClk } = useM2ClockingsLive(tid);
  const { data: liveOt } = useM2OvertimeLive(tid);
  const hasLive = isBackendConfigured && !!((liveReq?.length ?? 0) || (liveClk?.length ?? 0) || (liveOt?.length ?? 0));
  return {
    tenantId: tid,
    live: hasLive,
    requests: isBackendConfigured && liveReq && liveReq.length ? liveReq : storeReq,
    clockings: isBackendConfigured && liveClk && liveClk.length ? liveClk : storeClk,
    overtime: isBackendConfigured && liveOt && liveOt.length ? liveOt : storeOt,
  };
}

function MonthSelect({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  return (
    <select
      value={month}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-xl border border-line bg-surface px-3 text-sm font-semibold capitalize text-ink focus:border-amber/40 focus:outline-none"
    >
      {MONTHS.map((m) => (
        <option key={m} value={m} className="capitalize">{monthLabel(m)}</option>
      ))}
    </select>
  );
}

// ============================================================
//  Onglet Synthèse — agrégation & décompte (alimente la paie M3)
// ============================================================
function SyntheseTab({ country, roster, month }: { country: string; roster: typeof EMPLOYEES; month: string }) {
  const { requests, clockings, overtime } = useM2Live();

  const fleet = useMemo(
    () => buildFleetDecompte(roster.map((e) => e.id), month, country, { clockings, requests, overtime }),
    [roster, month, country, clockings, requests, overtime],
  );
  const cur = currencyOf(country);
  const { totals, rows } = fleet;
  const presenceRate = totals.workingDays > 0 ? Math.round((totals.workedDays / totals.workingDays) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Effectif décompté" value={String(totals.headcount)} unit="pers." icon={Gauge} />
        <StatCard label="Jours travaillés" value={String(totals.workedDays)} unit={`/ ${totals.workingDays} ouvrés`} icon={TableProperties} tone="amber" mono />
        <StatCard label="Jours d'absence" value={String(totals.absenceDays)} unit="décomptés" icon={Plane} mono />
        <StatCard label="HS validées" value={`${totals.hsValidatedHours}h`} unit="à reporter" icon={Clock} tone="amber" mono />
      </div>

      <Card inset={false}>
        <div className="flex items-center justify-between gap-3 p-5 pb-3">
          <CardHeader title="Décompte par collaborateur" subtitle={`${monthLabel(month)} · jours ouvrés − absences = jours payables`} className="mb-0" />
          <div className="flex items-center gap-2">
            <StatusPill tone={presenceRate >= 90 ? 'ok' : 'warn'} dot>{presenceRate}% présence</StatusPill>
            {totals.anomalies > 0 && <StatusPill tone="danger">{totals.anomalies} anomalie(s)</StatusPill>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2.5 text-left">Collaborateur</th>
                <th className="px-3 py-2.5 text-right">Jours ouvrés</th>
                <th className="px-3 py-2.5 text-right">Absences</th>
                <th className="px-3 py-2.5 text-right">Travaillés</th>
                <th className="px-3 py-2.5 text-right">HS valid.</th>
                <th className="px-3 py-2.5 text-right">Pointés</th>
                <th className="px-3 py-2.5 text-right">Anomalies</th>
                <th className="px-3 py-2.5 text-left">En attente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const emp = employeeById(r.employeeId);
                if (!emp) return null;
                const pending = r.pendingAbsenceDays > 0 || r.hsPendingHours > 0;
                return (
                  <tr key={r.employeeId} className="hover:bg-surface2/60">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={employeeName(emp)} size="xs" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-ink">{employeeName(emp)}</p>
                          <p className="truncate text-[10px] font-medium text-ink-400">{emp.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="mono px-3 py-2.5 text-right text-ink-500">{r.workingDays}</td>
                    <td className={cn('mono px-3 py-2.5 text-right', r.absenceDays > 0 ? 'font-semibold text-ink' : 'text-ink-400')}>{r.absenceDays || '—'}</td>
                    <td className="mono px-3 py-2.5 text-right font-bold text-ink">{r.workedDays}</td>
                    <td className={cn('mono px-3 py-2.5 text-right', r.hsValidatedHours > 0 ? 'font-semibold text-amber-deep' : 'text-ink-400')}>{r.hsValidatedHours ? `${r.hsValidatedHours}h` : '—'}</td>
                    <td className="mono px-3 py-2.5 text-right text-ink-500">{r.pointedDays || '—'}</td>
                    <td className={cn('mono px-3 py-2.5 text-right', r.anomalies > 0 ? 'font-bold text-danger' : 'text-ink-400')}>{r.anomalies || '—'}</td>
                    <td className="px-3 py-2.5">
                      {pending ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warn">
                          <AlarmClock size={12} />
                          {[r.pendingAbsenceDays > 0 ? `${r.pendingAbsenceDays}j abs.` : null, r.hsPendingHours > 0 ? `${r.hsPendingHours}h HS` : null].filter(Boolean).join(' · ')}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-ink-400">À jour</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-amber-deep" />
          Décompte déterministe prêt pour le cycle de paie ({cur}). Les jours travaillés et les heures sup validées sont
          transmis tels quels à la paie (M3) — aucun montant n'est calculé ici, et toute correction de pointage reste
          tracée. Les lignes « en attente » doivent être traitées avant clôture.
        </p>
      </Card>
    </div>
  );
}

// ============================================================
//  Onglet Congés — console de traitement RH (moteur M2 riche)
// ============================================================
function CongesTab({ country, roster }: { country: string; roster: typeof EMPLOYEES }) {
  const m2 = useM2Live();
  const requests = m2.requests;
  const storeDecide = useTimeOff((s) => s.decide);
  const decideLeave = useM2DecideLeave();
  const decide = (id: string, status: 'approved' | 'refused') => {
    if (m2.live && m2.tenantId) decideLeave.mutate({ requestId: id, decision: status, tenantId: m2.tenantId });
    else storeDecide(id, status);
  };
  const [filter, setFilter] = useState<'pending' | 'treated' | 'all'>('pending');

  const rosterIds = useMemo(() => new Set(roster.map((e) => e.id)), [roster]);
  const scoped = useMemo(() => requests.filter((r) => rosterIds.has(r.employeeId)), [requests, rosterIds]);

  const pendingCount = scoped.filter((r) => r.status === 'pending' || r.status === 'info_requested').length;
  const approvedCount = scoped.filter((r) => r.status === 'approved').length;
  const refusedCount = scoped.filter((r) => r.status === 'refused').length;

  const balanceFor = (empId: string) => {
    const emp = employeeById(empId);
    if (!emp) return { available: 0, acquired: 0 };
    const bal = computeSelfLeaveBalance(emp, scoped.filter((r) => r.employeeId === empId));
    return { available: bal.available, acquired: bal.acquired };
  };

  const overlapsFor = (r: TimeOffRequest) =>
    scoped.filter((o) => o.id !== r.id && o.employeeId !== r.employeeId && o.status !== 'refused' && o.start <= r.end && o.end >= r.start).length;

  const shown = scoped
    .filter((r) => (filter === 'pending' ? r.status === 'pending' || r.status === 'info_requested' : filter === 'treated' ? r.status === 'approved' || r.status === 'refused' : true))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const isPending = (s: TimeOffRequest['status']) => s === 'pending' || s === 'info_requested';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile icon={Clock} tone="warn" label="En attente de traitement" value={pendingCount} />
        <StatTile icon={ShieldCheck} tone="ok" label="Validés" value={approvedCount} />
        <StatTile icon={ShieldX} tone="danger" label="Refusés" value={refusedCount} />
      </div>

      <Card>
        <CardHeader
          title="File de validation"
          subtitle="Manager → RH · traitez les demandes posées par les collaborateurs"
          action={
            <div className="flex items-center gap-1.5">
              {(['pending', 'treated', 'all'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors',
                    filter === f ? 'bg-amber text-night' : 'bg-surface2 text-ink-500 hover:text-ink',
                  )}
                >
                  {f === 'pending' ? 'En attente' : f === 'treated' ? 'Traitées' : 'Toutes'}
                </button>
              ))}
            </div>
          }
        />
        {shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <ShieldCheck className="text-ok" size={28} />
            <p className="text-sm font-semibold text-ink-500">
              {filter === 'pending' ? 'Aucune demande en attente — tout est traité.' : 'Aucune demande sur ce filtre.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {shown.map((r) => {
              const emp = employeeById(r.employeeId);
              if (!emp) return null;
              const def = leaveTypeByCode(r.code);
              const { available, acquired } = balanceFor(r.employeeId);
              const consumes = def?.consumesPaidBalance ?? false;
              const insufficient = consumes && r.countedDays > available;
              const overlaps = isPending(r.status) ? overlapsFor(r) : 0;
              return (
                <div key={r.id} className="rounded-2xl border border-line bg-surface2 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={employeeName(emp)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-ink">{employeeName(emp)}</p>
                        <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[10px] font-bold text-ink-500">{def ? CATEGORY_LABEL[def.category] : 'Autre'}</span>
                        {r.status === 'info_requested' && <StatusPill tone="info">Info demandée</StatusPill>}
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium text-ink-400">
                        {r.label} · {new Date(`${r.start}T00:00:00`).toLocaleDateString('fr-FR')} → {new Date(`${r.end}T00:00:00`).toLocaleDateString('fr-FR')} · {r.countedDays}j
                      </p>
                    </div>
                    {isPending(r.status) ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => decide(r.id, 'approved')} className="inline-flex items-center gap-1 rounded-lg bg-ok/12 px-2.5 py-2 text-xs font-bold text-ok hover:bg-ok/20"><Check size={14} /> Valider</button>
                        <button onClick={() => decide(r.id, 'refused')} className="inline-flex items-center gap-1 rounded-lg bg-danger/10 px-2.5 py-2 text-xs font-bold text-danger hover:bg-danger/20"><X size={14} /> Refuser</button>
                      </div>
                    ) : (
                      <StatusPill tone={r.status === 'approved' ? 'ok' : 'danger'}>{r.status === 'approved' ? 'Validé' : 'Refusé'}</StatusPill>
                    )}
                  </div>
                  {isPending(r.status) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-2.5 text-[11px] font-medium">
                      {consumes && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-ink-400">Solde CP</span>
                          <span className={cn('mono font-bold', insufficient ? 'text-danger' : 'text-ink')}>{available}j</span>
                          <ProgressBar className="w-24" value={Math.max(0, available)} max={Math.max(acquired, 1)} tone={insufficient ? 'danger' : 'ok'} />
                        </span>
                      )}
                      {!consumes && def && (
                        <span className="inline-flex items-center gap-1 text-ink-400">Type non décompté du solde CP{def.justificationRequired ? ' · justificatif requis' : ''}</span>
                      )}
                      {insufficient && (
                        <span className="inline-flex items-center gap-1 font-bold text-danger"><ShieldX size={12} /> Solde insuffisant — dérogation requise</span>
                      )}
                      {overlaps > 0 && (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-deep"><CalendarDays size={12} /> {overlaps} chevauchement(s) d'équipe</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatTile({ icon: Icon, tone, label, value }: { icon: typeof Clock; tone: 'warn' | 'ok' | 'danger'; label: string; value: number }) {
  const toneCls = tone === 'ok' ? 'text-ok' : tone === 'danger' ? 'text-danger' : 'text-amber-deep';
  return (
    <Card className="flex items-center gap-3">
      <div className={cn('grid h-10 w-10 place-items-center rounded-xl bg-surface2', toneCls)}>
        <Icon size={18} />
      </div>
      <div>
        <p className="mono text-2xl font-bold text-ink">{value}</p>
        <p className="text-[11px] font-semibold text-ink-400">{label}</p>
      </div>
    </Card>
  );
}

// ============================================================
//  Onglet Pointage — audit RH des présences
// ============================================================
const CLOCK_META: Record<ClockingType, { label: string; icon: typeof LogIn; cls: string }> = {
  in: { label: 'Entrée', icon: LogIn, cls: 'text-ok' },
  out: { label: 'Sortie', icon: LogOut, cls: 'text-ink-500' },
  break_start: { label: 'Début pause', icon: Coffee, cls: 'text-amber-deep' },
  break_end: { label: 'Fin pause', icon: Coffee, cls: 'text-amber-deep' },
};

function PointageTab({ country, roster, month }: { country: string; roster: typeof EMPLOYEES; month: string }) {
  const { requests, clockings, overtime } = useM2Live();
  const rosterIds = useMemo(() => new Set(roster.map((e) => e.id)), [roster]);

  const fleet = useMemo(
    () => buildFleetDecompte(roster.map((e) => e.id), month, country, { clockings, requests, overtime }),
    [roster, month, country, clockings, requests, overtime],
  );

  const monthClockings = useMemo(
    () => clockings
      .filter((c) => rosterIds.has(c.employeeId) && c.at.slice(0, 7) === month)
      .sort((a, b) => (a.at < b.at ? 1 : -1)),
    [clockings, rosterIds, month],
  );

  const totalPointed = fleet.totals.workingDays; // référence ouvrés
  const pointedDays = fleet.rows.reduce((s, r) => s + r.pointedDays, 0);
  const anomalies = fleet.totals.anomalies;
  const offline = monthClockings.filter((c) => c.offline).length;
  const withData = fleet.rows.filter((r) => r.clockCount > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pointages du mois" value={String(monthClockings.length)} unit="enreg." icon={Fingerprint} tone="amber" />
        <StatCard label="Jours pointés" value={String(pointedDays)} unit={`/ ${totalPointed} ouvrés`} icon={CalendarDays} mono />
        <StatCard label="Anomalies" value={String(anomalies)} unit="à corriger" icon={AlertTriangle} mono />
        <StatCard label="Hors-ligne" value={String(offline)} unit="à synchro" icon={WifiOff} mono />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card inset={false}>
          <div className="p-5 pb-3"><CardHeader title="Présence par collaborateur" subtitle={`${monthLabel(month)} · jours pointés & anomalies`} className="mb-0" /></div>
          {withData.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
              <Fingerprint className="text-ink-300" size={26} />
              <p className="text-sm font-semibold text-ink-500">Aucun pointage enregistré sur {monthLabel(month)}.</p>
              <p className="text-[11px] font-medium text-ink-400">Les collaborateurs pointent depuis leur espace (badgeuse / mobile).</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[440px] text-sm">
                <thead>
                  <tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    <th className="px-4 py-2.5 text-left">Membre</th>
                    <th className="px-3 py-2.5 text-right">Pointages</th>
                    <th className="px-3 py-2.5 text-right">Jours</th>
                    <th className="px-3 py-2.5 text-right">Anomalies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {withData.map((r) => {
                    const emp = employeeById(r.employeeId)!;
                    return (
                      <tr key={r.employeeId}>
                        <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><Avatar name={employeeName(emp)} size="xs" /><span className="text-[13px] font-semibold text-ink">{employeeName(emp)}</span></div></td>
                        <td className="mono px-3 py-2.5 text-right text-ink-500">{r.clockCount}</td>
                        <td className="mono px-3 py-2.5 text-right font-semibold text-ink">{r.pointedDays}</td>
                        <td className={cn('mono px-3 py-2.5 text-right', r.anomalies > 0 ? 'font-bold text-danger' : 'text-ink-400')}>{r.anomalies || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Journal des pointages" subtitle="Horodatage d'origine · audit RH" action={<Fingerprint size={16} className="text-ink-400" />} />
          {monthClockings.length === 0 ? (
            <p className="py-6 text-center text-sm font-medium text-ink-400">Rien à afficher sur {monthLabel(month)}.</p>
          ) : (
            <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
              {monthClockings.slice(0, 40).map((c) => {
                const emp = employeeById(c.employeeId);
                const meta = CLOCK_META[c.type];
                const Icon = meta.icon;
                const d = new Date(c.at);
                return (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                    <Icon size={15} className={meta.cls} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{emp ? employeeName(emp) : c.employeeId} <span className="font-medium text-ink-400">· {meta.label}</span></p>
                      <p className="mono text-[10px] font-medium text-ink-400">{d.toLocaleDateString('fr-FR')} · {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {c.offline && <WifiOff size={13} className="text-warn" />}
                    {c.verification === 'to_verify' && <StatusPill tone="danger">à vérifier</StatusPill>}
                  </div>
                );
              })}
            </div>
          )}
          <PropheticHint className="mt-3">la correction d'un pointage est tracée (audit SHA-256) et relève du back-office RH.</PropheticHint>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
//  Onglet Heures supplémentaires — simulateur + file de validation
// ============================================================
function HeuresSupTab({ country, roster }: { country: string; roster: typeof EMPLOYEES }) {
  const m2 = useM2Live();
  const records = m2.overtime;
  const storeDecide = useOvertime((s) => s.decide);
  const decideOt = useM2DecideOvertime();
  const decide = (id: string, status: 'validated' | 'refused') => {
    if (m2.live && m2.tenantId) decideOt.mutate({ recordId: id, decision: status, tenantId: m2.tenantId });
    else storeDecide(id, status);
  };
  const [empId, setEmpId] = useState(roster[0]?.id ?? '');
  const [hours, setHours] = useState(6);
  const employee = employeeById(empId) ?? roster[0];
  const rules = timeRulesFor(country);
  const cur = currencyOf(country);
  const rosterIds = useMemo(() => new Set(roster.map((e) => e.id)), [roster]);

  const check = ComplianceGuard.checkOvertime({ countryCode: country, weeklyOvertimeHours: hours });
  const blocked = check.verdict === 'block';
  const calc = employee && !blocked ? computeOvertime(employee.baseSalary, hours, country, cur) : null;

  const pending = records.filter((r) => rosterIds.has(r.employeeId) && (r.status === 'pending' || r.status === 'detected'));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Simulateur de majorations" subtitle={`Durée légale : ${rules.weeklyHours}h/sem · plafond appliqué`} />
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Collaborateur</label>
        <select value={empId} onChange={(e) => setEmpId(e.target.value)} className="mb-4 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
          {roster.map((e) => (<option key={e.id} value={e.id}>{employeeName(e)}</option>))}
        </select>
        <label className="mb-1 flex items-center justify-between text-sm font-semibold text-ink-700">
          <span>Heures sup. / semaine</span>
          <span className="mono text-amber-deep">{hours} h</span>
        </label>
        <input type="range" min={0} max={30} value={hours} onChange={(e) => setHours(+e.target.value)} className="w-full accent-amber" />
        <div className={cn('mt-4 flex items-start gap-3 rounded-2xl border p-4', blocked ? 'border-danger/30 bg-danger/[0.06]' : 'border-ok/25 bg-ok/[0.06]')}>
          {blocked ? <ShieldX className="mt-0.5 shrink-0 text-danger" size={20} /> : <ShieldCheck className="mt-0.5 shrink-0 text-ok" size={20} />}
          <div>
            <p className={cn('text-sm font-bold', blocked ? 'text-danger' : 'text-ok')}>
              {blocked ? 'Validation bloquée — dépassement légal' : 'Heures supplémentaires conformes'}
            </p>
            <p className="text-sm font-medium text-ink-700">{check.message}</p>
          </div>
        </div>
        {calc && (
          <>
            <div className="mt-3 space-y-2">
              {calc.lines.map((l, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-surface2 px-3.5 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-ink">{l.hours}h majorées</p>
                    <p className="text-[11px] font-medium text-ink-400">+{l.majorationBps / 100}% du taux horaire</p>
                  </div>
                  <span className="mono text-sm font-bold text-ink">{Money.fromJSON({ units: l.amountUnits, currency: cur }).format()}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-amber/[0.08] px-4 py-3">
              <span className="text-sm font-bold text-ink">Total simulé (reporté en paie)</span>
              <span className="mono text-lg font-bold text-amber-deep">{Money.fromJSON({ units: calc.totalUnits, currency: cur }).formatWithCurrency()}</span>
            </div>
          </>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Heures sup à valider"
          subtitle="Détectées (pointages vs planning) ou déclarées"
          action={<StatusPill tone={pending.length > 0 ? 'warn' : 'ok'} dot={false}>{pending.length} en attente</StatusPill>}
        />
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <ShieldCheck className="text-ok" size={26} />
            <p className="text-sm font-semibold text-ink-500">Aucune heure sup en attente.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => {
              const emp = employeeById(r.employeeId);
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface2 p-3">
                  <Avatar name={emp ? employeeName(emp) : r.employeeId} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{emp ? employeeName(emp) : r.employeeId}</p>
                    <p className="text-[11px] font-medium text-ink-400">
                      {new Date(`${r.date}T00:00:00`).toLocaleDateString('fr-FR')} · <span className="mono">{r.overtimeHours}h</span> à +{r.ratePct}%
                      {r.category !== 'overtime' && <span className="ml-1 rounded bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-500">{r.category}</span>}
                      {r.source === 'declared' && <span className="ml-1 text-ink-400">· déclarée</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => decide(r.id, 'validated')} className="inline-flex items-center gap-1 rounded-lg bg-ok/12 px-2.5 py-2 text-xs font-bold text-ok hover:bg-ok/20"><Check size={14} /> Valider</button>
                    <button onClick={() => decide(r.id, 'refused')} className="rounded-lg bg-danger/10 p-2 text-danger hover:bg-danger/20"><X size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================
//  Onglet Compteurs — soldes CP / HS / récupération (effectif pays)
// ============================================================
const HS_MONTH_LIMIT = 20;
const fmtH = (n: number) => `${Math.round(n * 10) / 10}h`;

function CompteursTab({ country, roster }: { country: string; roster: typeof EMPLOYEES }) {
  const { requests, overtime: records } = useM2Live();

  const rows = roster.map((e, i) => {
    const bal = computeSelfLeaveBalance(e, requests.filter((r) => r.employeeId === e.id));
    const cpPeremp = i % 3 === 0 ? 5 : i % 3 === 2 ? 3 : 0;
    const perempIn = cpPeremp ? (i % 3 === 0 ? 3 : 8) : 0;
    const hs = records.filter((r) => r.employeeId === e.id && r.status === 'validated');
    const hsMonth = Math.round(hs.filter((r) => r.date.slice(0, 7) === '2026-05').reduce((s, r) => s + r.overtimeHours, 0) * 10) / 10;
    const hsCumul = Math.round((hs.reduce((s, r) => s + r.overtimeHours, 0) + ((i * 3.5) % 14)) * 10) / 10;
    const recup = (i % 4) * 2;
    return { e, cpDisp: bal.available, cpAcquired: bal.acquired, cpPending: bal.pending, cpPeremp, perempIn, hsMonth, hsCumul, recup };
  });

  const totalCp = Math.round(rows.reduce((s, r) => s + r.cpDisp, 0) * 10) / 10;
  const avgCp = rows.length ? Math.round((totalCp / rows.length) * 10) / 10 : 0;
  const hsYear = Math.round(rows.reduce((s, r) => s + r.hsCumul, 0) * 10) / 10;
  const recupTotal = rows.reduce((s, r) => s + r.recup, 0);

  const alerts = rows.flatMap((r) => {
    const a: { label: string; tone: 'warn' | 'danger' }[] = [];
    if (r.cpPeremp > 0) a.push({ label: `${employeeName(r.e)} : ${r.cpPeremp} j de CP périment dans ${r.perempIn} j`, tone: 'warn' });
    if (r.hsMonth > HS_MONTH_LIMIT) a.push({ label: `${employeeName(r.e)} : ${fmtH(r.hsMonth)} HS ce mois (> ${HS_MONTH_LIMIT}h)`, tone: 'danger' });
    return a;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="CP disponibles" value={String(totalCp)} unit="j cumul" icon={Plane} tone="amber" mono />
        <StatCard label="Moyenne CP" value={String(avgCp)} unit="j / pers." icon={Gauge} mono />
        <StatCard label="HS validées" value={fmtH(hsYear)} unit="cumul" icon={Clock} tone="amber" mono />
        <StatCard label="Récupération" value={fmtH(recupTotal)} unit="disponible" icon={RefreshCw} mono />
      </div>

      <Card inset={false}>
        <div className="p-5 pb-3"><CardHeader title="Détail par collaborateur" subtitle="CP (acquis − pris − en cours), péremption, heures sup, récupération" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2.5 text-left">Collaborateur</th>
                <th className="px-3 py-2.5 text-right">CP disp.</th>
                <th className="px-3 py-2.5 text-right">CP en cours</th>
                <th className="px-3 py-2.5 text-right">CP péremp.</th>
                <th className="px-3 py-2.5 text-right">HS cumul</th>
                <th className="px-3 py-2.5 text-right">Récup.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.e.id}>
                  <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><Avatar name={employeeName(r.e)} size="xs" /><span className="text-[13px] font-semibold text-ink">{employeeName(r.e)}</span></div></td>
                  <td className="mono px-3 py-2.5 text-right font-semibold text-ink">{r.cpDisp} j</td>
                  <td className={cn('mono px-3 py-2.5 text-right', r.cpPending > 0 ? 'text-warn' : 'text-ink-400')}>{r.cpPending ? `${r.cpPending} j` : '—'}</td>
                  <td className={cn('mono px-3 py-2.5 text-right', r.cpPeremp > 0 ? 'font-semibold text-warn' : 'text-ink-400')}>{r.cpPeremp ? `${r.cpPeremp} j (J-${r.perempIn})` : '—'}</td>
                  <td className="mono px-3 py-2.5 text-right text-ink-500">{fmtH(r.hsCumul)}</td>
                  <td className="mono px-3 py-2.5 text-right text-ink-500">{fmtH(r.recup)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {alerts.length > 0 && (
        <Card className="border-warn/25">
          <CardHeader title="Alertes compteurs" action={<AlertTriangle size={16} className="text-warn" />} />
          <div className="space-y-1.5">
            {alerts.map((a, i) => (
              <div key={i} className={cn('flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium', a.tone === 'danger' ? 'bg-danger/[0.06] text-danger' : 'bg-warn/[0.06] text-ink-700')}>
                <AlertTriangle size={13} className={a.tone === 'danger' ? 'text-danger' : 'text-warn'} /> {a.label}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><RefreshCw size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Les compteurs individuels ne sont jamais convertis en montants : la rémunération relève du back-office paie. Proph3t peut suggérer d'inviter à poser les CP qui périment ou d'absorber les récupérations dans le planning — vous restez décideur.</p>
      </Card>
    </div>
  );
}

// ============================================================
//  Onglet Calendrier — couverture d'équipe & jours fériés
// ============================================================
function CalendrierTab({ country, roster, month }: { country: string; roster: typeof EMPLOYEES; month: string }) {
  const { requests } = useM2Live();
  const holidays = holidaysFor(country);
  const rosterIds = useMemo(() => new Set(roster.map((e) => e.id)), [roster]);
  const [y, m] = month.split('-').map(Number);
  const year = y;
  const monthIdx = m - 1;
  const daysInMonth = monthBounds(month).days;
  const firstWeekday = (new Date(year, monthIdx, 1).getDay() + 6) % 7; // lundi=0

  const absencesByDay = useMemo(() => {
    const map: Record<number, number> = {};
    for (const r of requests) {
      if (!rosterIds.has(r.employeeId) || r.status === 'refused') continue;
      const s = new Date(`${r.start}T00:00:00`);
      const e = new Date(`${r.end}T00:00:00`);
      const cur = new Date(s);
      while (cur <= e) {
        if (cur.getFullYear() === year && cur.getMonth() === monthIdx) {
          map[cur.getDate()] = (map[cur.getDate()] ?? 0) + 1;
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [requests, rosterIds, year, monthIdx]);

  const monthPrefix = month;
  const holidayDays = new Set(
    holidays.filter((h) => h.date.startsWith(monthPrefix)).map((h) => Number(h.date.slice(8, 10))),
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title={<span className="capitalize">Calendrier d'équipe — {monthLabel(month)}</span>} subtitle="Détection de conflits (≥ 2 absents)" />
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
            <div key={d} className="pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-400">{d}</div>
          ))}
          {Array.from({ length: firstWeekday }).map((_, i) => (<div key={`pad-${i}`} />))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const weekday = (firstWeekday + day - 1) % 7;
            const isWeekend = weekday >= 5;
            const isHol = holidayDays.has(day);
            const absents = absencesByDay[day] ?? 0;
            const conflict = absents >= 2;
            return (
              <div
                key={day}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center rounded-lg border text-xs font-semibold',
                  isHol ? 'border-info/30 bg-info/10 text-info' : isWeekend ? 'border-transparent bg-ink/[0.03] text-ink-400' : 'border-line bg-surface text-ink',
                  conflict && 'border-danger/40 bg-danger/[0.08] text-danger',
                )}
                title={isHol ? 'Jour férié' : absents ? `${absents} absent(s)` : ''}
              >
                {day}
                {absents > 0 && !isHol && (
                  <span className={cn('mono text-[9px] font-bold', conflict ? 'text-danger' : 'text-amber-deep')}>{absents}●</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Jours fériés" subtitle={`${countryByCode(country).name} · ${year}`} action={<AlarmClock size={16} className="text-ink-400" />} />
        <div className="space-y-1.5">
          {holidays.map((h) => (
            <div key={h.date} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2.5">
              <span className="text-sm font-semibold text-ink">{h.label}</span>
              <span className="mono text-[11px] font-bold text-ink-500">{new Date(`${h.date}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
            </div>
          ))}
        </div>
        <PropheticHint className="mt-3">anticipe un pic d'absentéisme autour des ponts de mai.</PropheticHint>
      </Card>
    </div>
  );
}
