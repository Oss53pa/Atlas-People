import { useMemo, useState } from 'react';
import {
  CalendarPlus,
  Check,
  X,
  Clock,
  ShieldCheck,
  ShieldX,
  CalendarDays,
  AlarmClock,
} from 'lucide-react';
import { PropheticHint } from '../components/ui/feedback';
import { Card, CardHeader } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatusPill } from '../components/ui/StatusPill';
import { Avatar } from '../components/ui/Avatar';
import { ProgressBar } from '../components/charts/ProgressBar';
import { Money } from '../lib/money';
import { workingDaysBetween } from '../lib/time/workingDays';
import { timeRulesFor, accruedAnnualLeave, LEAVE_TYPES } from '../lib/time/leaveRules';
import { computeOvertime } from '../lib/time/overtime';
import { holidaysFor } from '../lib/time/holidays';
import { ComplianceGuard } from '../lib/compliance/ComplianceGuard';
import { useAppStore } from '../store/useAppStore';
import { countryByCode, currencyOf } from '../data/countries';
import { EMPLOYEES, employeeById, employeeName, LEAVE_REQUESTS, type LeaveRequest } from '../data/mock';
import { cn } from '../lib/cn';

type Tab = 'conges' | 'hsup' | 'calendrier';

export function TempsAbsencesPage() {
  const activeCountry = useAppStore((s) => s.activeCountry);
  const country = countryByCode(activeCountry);
  const roster = EMPLOYEES.filter((e) => e.countryCode === activeCountry);
  const [tab, setTab] = useState<Tab>('conges');

  return (
    <div className="animate-fade-up space-y-6">
      <SectionHeader
        eyebrow="Bloc A · M2"
        title="Temps & absences"
        description={`Congés, pointage et heures supplémentaires dans le respect strict du droit du travail · ${country.flag} ${country.name}`}
      />

      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === 'conges'} onClick={() => setTab('conges')} icon={CalendarPlus}>
          Congés
        </TabButton>
        <TabButton active={tab === 'hsup'} onClick={() => setTab('hsup')} icon={Clock}>
          Heures supplémentaires
        </TabButton>
        <TabButton active={tab === 'calendrier'} onClick={() => setTab('calendrier')} icon={CalendarDays}>
          Calendrier & fériés
        </TabButton>
      </div>

      {tab === 'conges' && <CongesTab country={activeCountry} roster={roster} />}
      {tab === 'hsup' && <HeuresSupTab country={activeCountry} roster={roster} />}
      {tab === 'calendrier' && <CalendrierTab country={activeCountry} roster={roster} />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof Clock; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all',
        active ? 'border-amber bg-amber text-night' : 'border-line bg-surface text-ink-500 hover:text-ink',
      )}
    >
      <Icon size={15} className={active ? 'text-amber' : 'text-ink-400'} /> {children}
    </button>
  );
}

// ---------------- Onglet Congés (traitement RH) ----------------
function CongesTab({ country, roster }: { country: string; roster: typeof EMPLOYEES }) {
  const [requests, setRequests] = useState<LeaveRequest[]>(LEAVE_REQUESTS);
  const [filter, setFilter] = useState<'pending' | 'treated' | 'all'>('pending');

  const rosterIds = useMemo(() => new Set(roster.map((e) => e.id)), [roster]);
  const scoped = useMemo(() => requests.filter((r) => rosterIds.has(r.employeeId)), [requests, rosterIds]);

  const pendingCount = scoped.filter((r) => r.status === 'pending').length;
  const approvedCount = scoped.filter((r) => r.status === 'approved').length;
  const refusedCount = scoped.filter((r) => r.status === 'refused').length;

  const decide = (id: string, status: 'approved' | 'refused') =>
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));

  const balanceFor = (empId: string) => {
    const emp = employeeById(empId);
    if (!emp) return { accrued: 0, remaining: 0 };
    const accrued = accruedAnnualLeave(emp.hireDate, country);
    const taken = scoped
      .filter((r) => r.employeeId === empId && r.status === 'approved' && r.type === 'annual')
      .reduce((s, r) => s + workingDaysBetween(r.start, r.end, country), 0);
    return { accrued, remaining: Math.round((accrued - taken) * 10) / 10 };
  };

  const overlapsFor = (r: LeaveRequest) =>
    scoped.filter((o) => o.id !== r.id && o.status !== 'refused' && o.start <= r.end && o.end >= r.start).length;

  const shown = scoped.filter((r) =>
    filter === 'pending' ? r.status === 'pending' : filter === 'treated' ? r.status !== 'pending' : true,
  );

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
              const lt = LEAVE_TYPES.find((t) => t.code === r.type);
              const d = workingDaysBetween(r.start, r.end, country);
              const { accrued, remaining } = balanceFor(r.employeeId);
              const insufficient = r.type === 'annual' && d > remaining;
              const overlaps = r.status === 'pending' ? overlapsFor(r) : 0;
              return (
                <div key={r.id} className="rounded-2xl border border-line bg-surface2 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={employeeName(emp)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{employeeName(emp)}</p>
                      <p className="text-[11px] font-medium text-ink-400">
                        {lt?.label} · {new Date(r.start).toLocaleDateString('fr-FR')} → {new Date(r.end).toLocaleDateString('fr-FR')} · {d}j
                      </p>
                    </div>
                    {r.status === 'pending' ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => decide(r.id, 'approved')} className="inline-flex items-center gap-1 rounded-lg bg-ok/12 px-2.5 py-2 text-xs font-bold text-ok hover:bg-ok/20"><Check size={14} /> Valider</button>
                        <button onClick={() => decide(r.id, 'refused')} className="inline-flex items-center gap-1 rounded-lg bg-danger/10 px-2.5 py-2 text-xs font-bold text-danger hover:bg-danger/20"><X size={14} /> Refuser</button>
                      </div>
                    ) : (
                      <StatusPill tone={r.status === 'approved' ? 'ok' : 'danger'}>{r.status === 'approved' ? 'Validé' : 'Refusé'}</StatusPill>
                    )}
                  </div>
                  {r.status === 'pending' && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-2.5 text-[11px] font-medium">
                      {r.type === 'annual' && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-ink-400">Solde</span>
                          <span className={cn('mono font-bold', insufficient ? 'text-danger' : 'text-ink')}>{remaining}j</span>
                          <ProgressBar className="w-24" value={Math.max(0, remaining)} max={Math.max(accrued, 1)} tone={insufficient ? 'danger' : 'ok'} />
                        </span>
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

// ---------------- Onglet Heures sup ----------------
function HeuresSupTab({ country, roster }: { country: string; roster: typeof EMPLOYEES }) {
  const [empId, setEmpId] = useState(roster[0]?.id ?? '');
  const [hours, setHours] = useState(6);
  const employee = employeeById(empId) ?? roster[0];
  const rules = timeRulesFor(country);
  const cur = currencyOf(country);

  const check = ComplianceGuard.checkOvertime({ countryCode: country, weeklyOvertimeHours: hours });
  const blocked = check.verdict === 'block';
  const calc = employee && !blocked ? computeOvertime(employee.baseSalary, hours, country, cur) : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Déclarer des heures supplémentaires" subtitle={`Durée légale : ${rules.weeklyHours}h/sem · plafond appliqué`} />
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
      </Card>

      <Card>
        <CardHeader title="Calcul des majorations" subtitle="Reporté en paie (M3) · Money.ts" action={<Clock size={16} className="text-ink-400" />} />
        {blocked ? (
          <div className="flex h-full items-center justify-center py-8 text-center">
            <p className="text-sm font-medium text-ink-400">Réduisez les heures sous le plafond légal pour calculer la majoration.</p>
          </div>
        ) : calc ? (
          <>
            <div className="space-y-2">
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
              <span className="text-sm font-bold text-ink">Total à reporter en paie</span>
              <span className="mono text-lg font-bold text-amber-deep">{Money.fromJSON({ units: calc.totalUnits, currency: cur }).formatWithCurrency()}</span>
            </div>
          </>
        ) : null}
      </Card>
    </div>
  );
}

// ---------------- Onglet Calendrier ----------------
function CalendrierTab({ country, roster }: { country: string; roster: typeof EMPLOYEES }) {
  const holidays = holidaysFor(country);
  const rosterIds = new Set(roster.map((e) => e.id));
  const year = 2026;
  const month = 4; // Mai (0-indexé)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // lundi=0

  const absencesByDay = useMemo(() => {
    const map: Record<number, number> = {};
    for (const r of LEAVE_REQUESTS) {
      if (!rosterIds.has(r.employeeId) || r.status === 'refused') continue;
      const s = new Date(`${r.start}T00:00:00`);
      const e = new Date(`${r.end}T00:00:00`);
      const cur = new Date(s);
      while (cur <= e) {
        if (cur.getFullYear() === year && cur.getMonth() === month) {
          map[cur.getDate()] = (map[cur.getDate()] ?? 0) + 1;
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [rosterIds]);

  const holidayDays = new Set(
    holidays.filter((h) => h.date.startsWith('2026-05')).map((h) => Number(h.date.slice(8, 10))),
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Calendrier d'équipe — Mai 2026" subtitle="Détection de conflits (≥ 2 absents)" />
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
        <CardHeader title="Jours fériés" subtitle={`${countryByCode(country).name} · 2026`} action={<AlarmClock size={16} className="text-ink-400" />} />
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
