import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, Clock, Repeat, CalendarOff, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Modal } from '../../components/ui/overlays';
import { useToast } from '../../components/ui/Toast';
import { TimeSubNav } from '../../components/m2/TimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useTimeOff } from '../../store/useTimeOff';
import { holidaySet } from '../../lib/m2/holidays';
import { employeeById } from '../../data/mock';
import { cn } from '../../lib/cn';
import { isBackendConfigured, useMyPlanning } from '../../lib/portal/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const TODAY = '2026-05-28';

interface Day {
  iso: string;
  kind: 'work' | 'rest' | 'leave' | 'holiday';
  shift?: { team: string; label: string; start: string; end: string; site: string };
}

function isoAdd(iso: string, n: number) { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function frFull(iso: string) { return new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); }
function frShort(iso: string) { return new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }); }

const KIND: Record<Day['kind'], { label: string; tone: 'ok' | 'neutral' | 'amber' | 'info' }> = {
  work: { label: 'Travaillé', tone: 'ok' },
  rest: { label: 'Repos', tone: 'neutral' },
  leave: { label: 'Congé', tone: 'amber' },
  holiday: { label: 'Férié', tone: 'info' },
};

export function MonPlanningPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);

  const { toast } = useToast();
  const { data: ctx } = useSessionContext();
  const SELF_ID = ctx?.employeeId ?? 'e2';
  const employee = employeeById(SELF_ID)!;
  const requests = useTimeOff((s) => s.requests).filter((r) => r.employeeId === SELF_ID && r.status === 'approved');
  const fer = holidaySet(employee.countryCode);

  const [view, setView] = useState<'week' | 'list'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<Day | null>(null);
  const { data: livePlanning } = useMyPlanning(ctx?.tenantId, ctx?.employeeId);
  const planningLive = isBackendConfigured && livePlanning && livePlanning.length > 0 ? livePlanning : undefined;
  const PLAN_TONE: Record<string, 'ok' | 'neutral' | 'amber' | 'info'> = { confirmed: 'ok', planned: 'info', swapped: 'amber', absent: 'neutral' };
  const PLAN_LABEL: Record<string, string> = { confirmed: 'Confirmé', planned: 'Planifié', swapped: 'Échangé', absent: 'Absent' };

  const buildDay = (iso: string, i: number): Day => {
    const d = new Date(`${iso}T00:00:00`);
    const we = d.getDay() === 0 || d.getDay() === 6;
    if ([...fer].includes(iso)) return { iso, kind: 'holiday' };
    if (requests.some((r) => r.start <= iso && r.end >= iso)) return { iso, kind: 'leave' };
    if (we) return { iso, kind: 'rest' };
    const teamB = i % 2 === 0;
    return { iso, kind: 'work', shift: teamB
      ? { team: 'Équipe B', label: '14:00 – 22:00', start: '14:00', end: '22:00', site: 'Cosmos Yopougon' }
      : { team: 'Équipe A', label: '06:00 – 14:00', start: '06:00', end: '14:00', site: 'Cosmos Yopougon' } };
  };

  const weekStart = isoAdd(TODAY, weekOffset * 7);
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => buildDay(isoAdd(weekStart, i), weekOffset * 7 + i)), [weekStart, weekOffset, requests]);
  const list = useMemo(() => Array.from({ length: 14 }, (_, i) => buildDay(isoAdd(TODAY, i), i)), [requests]);

  return (
    <div className="animate-fade-up space-y-5">
      <TimeSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Mon planning</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-line bg-surface p-0.5">
            {(['week', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cn('rounded-lg px-3 py-1.5 text-sm font-semibold', view === v ? 'bg-amber/12 text-amber-deep' : 'text-ink-500')}>{v === 'week' ? 'Semaine' : 'Liste'}</button>
            ))}
          </div>
          <Link to="/me/time"><Button variant="ghost" size="sm"><ArrowLeft size={14} /> Retour</Button></Link>
        </div>
      </div>

      {planningLive && (
        <Card inset={false}>
          <div className="p-5 pb-3"><CardHeader title="Mon planning" subtitle={`${planningLive.length} jour(s) · Live DB`} action={<Wifi size={13} className="text-emerald-500" />} className="mb-0" /></div>
          <div className="divide-y divide-line">
            {planningLive.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className={cn('w-40 shrink-0 text-sm font-semibold', p.work_date === TODAY ? 'text-amber-deep' : 'text-ink')}>{frFull(p.work_date)}</span>
                <span className="flex-1" />
                <StatusPill tone={PLAN_TONE[p.status] ?? 'neutral'} dot={false}>{PLAN_LABEL[p.status] ?? p.status}</StatusPill>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!planningLive && view === 'week' && (
        <Card inset={false}>
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setWeekOffset((w) => w - 1)} className="rounded-lg p-2 text-ink-500 hover:bg-ink/5"><ChevronLeft size={18} /></button>
            <p className="text-sm font-bold text-ink">Semaine du {new Date(`${weekStart}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
            <button onClick={() => setWeekOffset((w) => w + 1)} className="rounded-lg p-2 text-ink-500 hover:bg-ink/5"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-1 gap-2 p-4 pt-0 sm:grid-cols-7">
            {week.map((d) => {
              const k = KIND[d.kind];
              return (
                <button key={d.iso} onClick={() => d.shift && setSelected(d)} className={cn('rounded-xl border p-3 text-left transition-colors', d.iso === TODAY ? 'border-amber/40 bg-amber/[0.06]' : 'border-line bg-surface2', d.shift && 'hover:border-amber/30')}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{frShort(d.iso)}</p>
                  <div className="mt-2"><StatusPill tone={k.tone} dot={false}>{k.label}</StatusPill></div>
                  {d.shift && <p className="mt-2 text-[12px] font-semibold text-ink">{d.shift.team}<br /><span className="mono text-[11px] font-medium text-ink-500">{d.shift.label}</span></p>}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {!planningLive && view === 'list' && (
        <Card inset={false}>
          <div className="p-5 pb-3"><CardHeader title="14 prochains jours" className="mb-0" /></div>
          <div className="divide-y divide-line">
            {list.map((d) => {
              const k = KIND[d.kind];
              return (
                <button key={d.iso} onClick={() => d.shift && setSelected(d)} className={cn('flex w-full items-center gap-3 px-5 py-3 text-left', d.shift && 'hover:bg-ink/[0.03]')}>
                  <span className={cn('w-40 shrink-0 text-sm font-semibold', d.iso === TODAY ? 'text-amber-deep' : 'text-ink')}>{frFull(d.iso)}</span>
                  <span className="flex-1">{d.shift ? <span className="text-sm font-medium text-ink-700">{d.shift.team} · <span className="mono">{d.shift.label}</span> · {d.shift.site}</span> : <span className="text-sm font-medium text-ink-400">—</span>}</span>
                  <StatusPill tone={k.tone} dot={false}>{k.label}</StatusPill>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Signaler une indisponibilité" subtitle="Préférence prise en compte par votre manager (sans garantie)" action={<CalendarOff size={16} className="text-ink-400" />} />
        <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Indisponibilité enregistrée', description: 'Votre contrainte est transmise au planificateur.' })}>
          <CalendarOff size={14} /> Déclarer une indisponibilité
        </Button>
      </Card>

      {/* Détail shift */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? frFull(selected.iso) : ''}
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Fermer</Button>
          <Button size="sm" onClick={() => { setSelected(null); toast({ variant: 'success', title: 'Échange proposé', description: 'Demande envoyée à l\'équipe ; le manager validera la couverture.' }); }}><Repeat size={14} /> Demander un échange</Button>
        </>}>
        {selected?.shift && (
          <div className="space-y-2 text-sm">
            <Row icon={Clock} label="Horaires" value={`${selected.shift.team} · ${selected.shift.label}`} />
            <Row icon={MapPin} label="Site" value={selected.shift.site} />
            <Row icon={Clock} label="Pause" value="30 min (à mi-poste)" />
            <p className="mt-2 text-[11px] font-medium text-ink-400">Un échange n'est effectif qu'après accord d'un collègue habilité et validation du manager (couverture garantie).</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink/[0.05] text-ink-500"><Icon size={15} /></span>
      <div><p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</p><p className="text-sm font-semibold text-ink">{value}</p></div>
    </div>
  );
}
