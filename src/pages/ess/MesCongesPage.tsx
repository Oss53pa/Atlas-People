import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Wallet, RefreshCw, Stethoscope, Download, Plane, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { ProgressBar } from '../../components/charts/ProgressBar';
import { EmptyState } from '../../components/ui/feedback';
import { TimeSubNav } from '../../components/m2/TimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useTimeOff } from '../../store/useTimeOff';
import { computeSelfLeaveBalance } from '../../lib/m2/selfBalance';
import { leaveTypeByCode } from '../../lib/m2/leaveTypes';
import { employeeById } from '../../data/mock';
import { cn } from '../../lib/cn';
import { useMyLeaveRequests, isBackendConfigured } from '../../lib/ess/supabaseLive';
import { useMyLeaveBalances } from '../../lib/portal/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const SELF_ID = 'e2';
const STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'info'> = { pending: 'warn', approved: 'ok', refused: 'danger', info_requested: 'info' };
const STATUS_LABEL: Record<string, string> = { pending: 'En attente', approved: 'Approuvée', refused: 'Refusée', info_requested: 'Info demandée' };

const TABS = [
  { key: 'balances', label: 'Mes soldes' },
  { key: 'history', label: 'Mon historique' },
  { key: 'calendar', label: 'Mon calendrier' },
];

export function MesCongesPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);

  const [tab, setTab] = useState('balances');
  const { data: ctx } = useSessionContext();
  const { data: liveRequests } = useMyLeaveRequests(ctx?.tenantId, ctx?.employeeId);
  const { data: liveBalances } = useMyLeaveBalances(ctx?.tenantId, ctx?.employeeId);
  const employee = employeeById(SELF_ID)!;
  const mockRequests = useTimeOff((s) => s.requests).filter((r) => r.employeeId === SELF_ID);
  const requests = mockRequests;
  const balance = useMemo(() => computeSelfLeaveBalance(employee, requests), [employee, requests]);

  // Soldes live (S4) — pilotent les cartes CP / Récupération si présents.
  const balancesLive = isBackendConfigured && liveBalances && liveBalances.length > 0;
  const cpRow = liveBalances?.find((b) => b.counter_type === 'CP');
  const recupRow = liveBalances?.find((b) => b.counter_type === 'RECUP');

  const sickDays = requests.filter((r) => r.code === 'MAL').reduce((s, r) => s + r.countedDays, 0);
  const history = requests.slice().sort((a, b) => (a.start < b.start ? 1 : -1));

  return (
    <div className="animate-fade-up space-y-5">
      <TimeSubNav />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Mes congés et absences</h1>
        <Link to="/me/time/leave/request/new"><Button size="sm"><CalendarPlus size={14} /> Demander</Button></Link>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {/* SOLDES */}
      {tab === 'balances' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Congés payés" action={balancesLive && cpRow ? <Wifi size={13} className="text-emerald-500" /> : <Wallet size={16} className="text-ink-400" />} subtitle={balancesLive && cpRow ? 'Live DB' : undefined} />
            <p className="mono text-3xl font-semibold text-amber-deep">{balancesLive && cpRow ? cpRow.available : balance.available} j</p>
            <p className="text-[11px] font-medium text-ink-400">disponibles</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Mini label="Acquis" value={balancesLive && cpRow ? cpRow.acquired : balance.acquired} />
              <Mini label="Pris" value={balancesLive && cpRow ? cpRow.taken : balance.taken} />
              <Mini label="En cours" value={balancesLive && cpRow ? cpRow.pending : balance.pending} />
            </div>
            <div className="mt-3"><ProgressBar value={balancesLive && cpRow ? cpRow.taken : balance.taken} max={balancesLive && cpRow ? cpRow.acquired : balance.acquired} tone="amber" /></div>
            <div className="mt-3 space-y-1 text-[12px] font-medium text-ink-500">
              <p>Vous gagnez <span className="mono font-semibold text-ink">{balance.monthlyRate}</span> jours par mois travaillé.</p>
              {balance.majorations.map((m) => <p key={m}>{m}</p>)}
            </div>
            <details className="mt-2"><summary className="cursor-pointer text-[11px] font-bold text-amber-deep">Comment c'est calculé ?</summary><p className="mt-1 text-[11px] font-medium text-ink-400">Acquisition mensuelle ({balance.monthlyRate} j) sur l'année + majorations (ancienneté, enfants à charge), moins les jours pris et les demandes en cours.</p></details>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader title="Récupération" action={balancesLive && recupRow ? <Wifi size={13} className="text-emerald-500" /> : <RefreshCw size={16} className="text-ink-400" />} subtitle={balancesLive && recupRow ? 'Live DB' : undefined} />
              <p className="mono text-2xl font-semibold text-ink">{balancesLive && recupRow ? recupRow.available : 0} h</p>
              <p className="text-[11px] font-medium text-ink-400">à récupérer (issues d'heures supplémentaires converties)</p>
            </Card>
            <Card>
              <CardHeader title="Compteur maladie" subtitle="12 mois glissants · sans détail médical" action={<Stethoscope size={16} className="text-ink-400" />} />
              <p className="mono text-2xl font-semibold text-ink">{sickDays} j</p>
              <p className="text-[11px] font-medium text-ink-400">jours d'absence maladie (information opérationnelle)</p>
            </Card>
          </div>
        </div>
      )}

      {/* HISTORIQUE */}
      {tab === 'history' && (
        <Card inset={false}>
          <div className="flex items-center justify-between p-5 pb-3">
            <CardHeader title="Mon historique" subtitle={isBackendConfigured && liveRequests ? `${liveRequests.length} demande(s) · Live DB` : `${history.length} demande(s)`} action={isBackendConfigured && liveRequests ? <Wifi size={13} className="text-emerald-500" /> : undefined} className="mb-0" />
            <Button variant="ghost" size="sm"><Download size={14} /> Exporter (PDF)</Button>
          </div>
          {/* Live history from DB */}
          {isBackendConfigured && liveRequests && liveRequests.length > 0 ? (
            <div className="divide-y divide-line">
              {liveRequests.map((r) => {
                const cat = leaveTypeByCode(r.leave_type_code)?.category;
                return (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', cat === 'health' ? 'bg-info/12 text-info' : 'bg-amber/12 text-amber-deep')}>
                      {cat === 'health' ? <Stethoscope size={16} /> : <Plane size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{r.leave_type_code} — {r.counted_days} j</p>
                      <p className="text-[11px] font-medium text-ink-400">{new Date(r.start_date + 'T00:00').toLocaleDateString('fr-FR')} → {new Date(r.end_date + 'T00:00').toLocaleDateString('fr-FR')}</p>
                    </div>
                    <StatusPill tone={STATUS_TONE[r.status] ?? 'neutral'} dot={false}>{STATUS_LABEL[r.status] ?? r.status}</StatusPill>
                  </div>
                );
              })}
            </div>
          ) : history.length > 0 ? (
            <div className="divide-y divide-line">
              {history.map((r) => {
                const cat = leaveTypeByCode(r.code)?.category;
                return (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', cat === 'health' ? 'bg-info/12 text-info' : 'bg-amber/12 text-amber-deep')}>
                      {cat === 'health' ? <Stethoscope size={16} /> : <Plane size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{r.label}</p>
                      <p className="text-[11px] font-medium text-ink-400">{new Date(`${r.start}T00:00:00`).toLocaleDateString('fr-FR')} → {new Date(`${r.end}T00:00:00`).toLocaleDateString('fr-FR')} · {r.countedDays} j{r.approver ? ` · ${r.approver}` : ''}</p>
                    </div>
                    <StatusPill tone={STATUS_TONE[r.status]} dot={false}>{STATUS_LABEL[r.status]}</StatusPill>
                  </div>
                );
              })}
            </div>
          ) : <div className="p-5"><EmptyState icon={CalendarPlus} title="Aucune demande" description="Vos congés et absences passés apparaîtront ici." /></div>}
        </Card>
      )}

      {/* CALENDRIER (vue liste accessible) */}
      {tab === 'calendar' && (
        <Card>
          <CardHeader title="Mon calendrier" subtitle="Congés, absences et fériés à venir" />
          {history.filter((r) => r.status !== 'refused').length > 0 ? (
            <div className="space-y-1.5">
              {history.filter((r) => r.status !== 'refused').map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                  <span className="mono text-[11px] font-bold text-ink-500 w-28 shrink-0">{new Date(`${r.start}T00:00:00`).toLocaleDateString('fr-FR')}</span>
                  <span className="flex-1 truncate text-sm font-semibold text-ink">{r.label}</span>
                  <StatusPill tone={STATUS_TONE[r.status]} dot={false}>{STATUS_LABEL[r.status]}</StatusPill>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={CalendarPlus} title="Rien de planifié" description="Vos congés validés apparaîtront sur votre calendrier." />}
        </Card>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface2 px-2 py-2">
      <p className="mono text-base font-semibold text-ink">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
    </div>
  );
}
