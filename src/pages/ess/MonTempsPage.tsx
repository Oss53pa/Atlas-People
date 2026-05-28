import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarPlus, Fingerprint, ArrowRight, Plane, AlertTriangle, Clock,
  Wallet, CalendarDays, Sparkles, RefreshCw, FileWarning,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { ProgressBar } from '../../components/charts/ProgressBar';
import { TimeSubNav } from '../../components/m2/TimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useTimeOff } from '../../store/useTimeOff';
import { useClocking } from '../../store/useClocking';
import { computeSelfLeaveBalance } from '../../lib/m2/selfBalance';
import { holidaySet } from '../../lib/m2/holidays';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

const SELF_ID = 'e2';
const TODAY = '2026-05-28';

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'info'> = {
  pending: 'warn', approved: 'ok', refused: 'danger', info_requested: 'info',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente', approved: 'Approuvée', refused: 'Refusée', info_requested: 'Info demandée',
};

function frDate(d: string) { return new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }); }
function isoAddDays(iso: string, n: number) { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

export function MonTempsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);

  const employee = employeeById(SELF_ID)!;
  const requests = useTimeOff((s) => s.requests).filter((r) => r.employeeId === SELF_ID);
  const clockings = useClocking((s) => s.clockings).filter((c) => c.employeeId === SELF_ID);
  const balance = useMemo(() => computeSelfLeaveBalance(employee, requests), [employee, requests]);

  const inProgress = requests.filter((r) => r.status === 'pending' || r.status === 'info_requested');
  const onLeaveToday = requests.find((r) => r.status === 'approved' && r.start <= TODAY && r.end >= TODAY);
  const fer = holidaySet(employee.countryCode);
  const hour = new Date().getHours();
  const greeting = hour < 18 ? 'Bonjour' : 'Bonsoir';

  // Statut du jour (ancré sur la date démo)
  const todayDate = new Date(`${TODAY}T00:00:00`);
  const isWeekend = todayDate.getDay() === 0 || todayDate.getDay() === 6;
  const todayHoliday = [...fer].includes(TODAY);
  const statut = onLeaveToday ? `Vous êtes en congé jusqu'au ${new Date(`${onLeaveToday.end}T00:00:00`).toLocaleDateString('fr-FR')}`
    : todayHoliday ? 'Aujourd\'hui est férié'
    : isWeekend ? 'Repos hebdomadaire'
    : 'Vous travaillez aujourd\'hui — 08:00–17:00';

  // Pointage du jour (date réelle du device)
  const realToday = new Date().toISOString().slice(0, 10);
  const todayClockings = clockings.filter((c) => c.at.slice(0, 10) === realToday).sort((a, b) => a.at.localeCompare(b.at));
  const lastClocking = clockings.slice().sort((a, b) => b.at.localeCompare(a.at))[0];
  const nextAction = todayClockings.length === 0 || todayClockings[todayClockings.length - 1].type === 'out' ? 'in' : 'out';
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Mini planning 7 jours
  const week = Array.from({ length: 7 }, (_, i) => {
    const iso = isoAddDays(TODAY, i);
    const d = new Date(`${iso}T00:00:00`);
    const we = d.getDay() === 0 || d.getDay() === 6;
    const holi = [...fer].includes(iso);
    const leave = requests.find((r) => r.status === 'approved' && r.start <= iso && r.end >= iso);
    const label = leave ? 'Congé' : holi ? 'Férié' : we ? 'Repos' : '08:00–17:00';
    const tone: 'ok' | 'neutral' | 'amber' | 'info' = leave ? 'amber' : holi ? 'info' : we ? 'neutral' : 'ok';
    return { iso, label, tone, isToday: i === 0 };
  });

  const peremptionSoon = balance.available >= 5;

  return (
    <div className="animate-fade-up space-y-5">
      <TimeSubNav />

      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-deep">Mon temps · Espace employé</p>
        <h1 className="text-2xl font-semibold text-ink">{greeting} {employee.firstName}</h1>
        <p className="flex items-center gap-1.5 text-sm font-medium text-ink-500" aria-live="polite">
          {new Date(`${TODAY}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · <span className="font-semibold text-ink-700">{statut}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Colonne gauche */}
        <div className="space-y-5">
          {/* Soldes */}
          <Card>
            <CardHeader title="Mes soldes de congés" subtitle="Congés payés" action={<Wallet size={16} className="text-ink-400" />} />
            <div className="flex items-end justify-between">
              <div>
                <p className="mono text-3xl font-semibold text-amber-deep">{balance.available} j</p>
                <p className="text-[11px] font-medium text-ink-400">disponibles</p>
              </div>
              <div className="text-right text-[11px] font-medium text-ink-400">
                <p>Acquis <span className="mono font-semibold text-ink">{balance.acquired}</span></p>
                <p>Pris <span className="mono font-semibold text-ink">{balance.taken}</span></p>
                <p>En cours <span className="mono font-semibold text-ink">{balance.pending}</span></p>
              </div>
            </div>
            <div className="mt-3"><ProgressBar value={balance.taken} max={balance.acquired} tone="amber" /></div>
            {balance.majorations.length > 0 && <p className="mt-2 text-[11px] font-medium text-ink-400">{balance.majorations.join(' · ')}</p>}
            {peremptionSoon && <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-warn"><AlertTriangle size={12} /> {balance.available} j à poser avant péremption.</p>}
            <Link to="/me/time/leave"><Button variant="ghost" size="sm" className="mt-2">Voir le détail <ArrowRight size={14} /></Button></Link>
          </Card>

          {/* Demandes en cours */}
          <Card>
            <CardHeader title="Mes demandes en cours" subtitle={`${inProgress.length} en attente`} action={<Link to="/me/time/leave/request/new"><Button variant="outline" size="sm"><CalendarPlus size={14} /> Nouvelle</Button></Link>} />
            {inProgress.length > 0 ? (
              <div className="space-y-1.5">
                {inProgress.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{r.label}{r.offline && <span className="ml-1.5 text-[10px] font-bold text-warn">hors-ligne</span>}</p>
                      <p className="text-[11px] font-medium text-ink-400">{new Date(`${r.start}T00:00:00`).toLocaleDateString('fr-FR')} → {new Date(`${r.end}T00:00:00`).toLocaleDateString('fr-FR')} · {r.countedDays} j</p>
                    </div>
                    <StatusPill tone={STATUS_TONE[r.status]} dot={false}>{STATUS_LABEL[r.status]}</StatusPill>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm font-medium text-ink-400">Aucune demande en cours.</p>}
          </Card>

          {/* Pointage du jour */}
          <Card>
            <CardHeader title="Mon pointage du jour" subtitle={lastClocking ? `Dernier : ${lastClocking.type === 'in' ? 'entrée' : 'sortie'} à ${fmtTime(lastClocking.at)}` : 'Aucun pointage'} action={<Fingerprint size={16} className="text-ink-400" />} />
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink-500">{todayClockings.length === 0 ? 'Pas encore pointé aujourd\'hui.' : `Entrée pointée à ${fmtTime(todayClockings[0].at)}`}</p>
              <Link to="/me/time/clocking"><Button size="sm">{nextAction === 'in' ? 'Pointer mon entrée' : 'Pointer ma sortie'}</Button></Link>
            </div>
          </Card>
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          {/* Planning */}
          <Card>
            <CardHeader title="Mon planning" subtitle="7 jours" action={<CalendarDays size={16} className="text-ink-400" />} />
            <div className="space-y-1">
              {week.map((d) => (
                <div key={d.iso} className={cn('flex items-center justify-between rounded-lg px-2.5 py-1.5', d.isToday && 'bg-amber/[0.06]')}>
                  <span className={cn('text-sm font-semibold', d.isToday ? 'text-ink' : 'text-ink-700')}>{frDate(d.iso)}{d.isToday && ' · auj.'}</span>
                  <StatusPill tone={d.tone} dot={false}>{d.label}</StatusPill>
                </div>
              ))}
            </div>
            <Link to="/me/time/planning"><Button variant="ghost" size="sm" className="mt-2">Planning complet <ArrowRight size={14} /></Button></Link>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader title="Actions rapides" />
            <div className="space-y-1.5">
              <QuickLink to="/me/time/leave/request/new" icon={CalendarPlus} label="Poser un congé" />
              <QuickLink to="/me/time/leave/request/new" icon={Plane} label="Déclarer une absence" />
              <QuickLink to="/me/time/clocking" icon={FileWarning} label="Signaler un oubli de pointage" />
              <QuickLink to="/me/time/overtime" icon={Clock} label="Déclarer des heures supplémentaires" />
            </div>
          </Card>

          {/* Alertes */}
          {(peremptionSoon || inProgress.length > 0) && (
            <Card className="glass-amber">
              <CardHeader title="Mes alertes" className="mb-2" action={<Sparkles size={14} className="text-amber-deep" />} />
              <div className="space-y-1.5 text-[12px] font-medium text-ink-700">
                {peremptionSoon && <p className="flex items-center gap-1.5"><AlertTriangle size={13} className="text-warn" /> {balance.available} jours de congés à poser avant péremption.</p>}
                {inProgress.map((r) => <p key={r.id} className="flex items-center gap-1.5"><RefreshCw size={13} className="text-info" /> Demande « {r.label} » en attente de validation.</p>)}
              </div>
            </Card>
          )}
        </div>
      </div>

      <p className="px-2 text-center text-[11px] font-medium text-ink-400">Espace employé · vos données uniquement · {employeeName(employee)}</p>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: typeof Clock; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5 transition-colors hover:bg-amber/[0.05]">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><Icon size={15} /></span>
      <span className="flex-1 text-sm font-semibold text-ink">{label}</span>
      <ArrowRight size={15} className="text-ink-400" />
    </Link>
  );
}
