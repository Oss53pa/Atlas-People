import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Fingerprint, MapPin, WifiOff, CheckCircle2, AlertTriangle, FileWarning } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Switch } from '../../components/ui/controls';
import { useToast } from '../../components/ui/Toast';
import { TimeSubNav } from '../../components/m2/TimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useClocking, type Clocking } from '../../store/useClocking';
import { cn } from '../../lib/cn';

const SELF_ID = 'e2';

function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
function fmtDay(iso: string) { return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }); }

/** Minutes travaillées sur un ensemble de pointages (paires in/out, + en cours). */
function workedMinutes(clockings: Clocking[], nowMs: number): number {
  const asc = clockings.slice().sort((a, b) => a.at.localeCompare(b.at));
  let total = 0; let lastIn: number | null = null;
  for (const c of asc) {
    if (c.type === 'in') lastIn = Date.parse(c.at);
    else if (c.type === 'out' && lastIn != null) { total += Date.parse(c.at) - lastIn; lastIn = null; }
  }
  if (lastIn != null) total += nowMs - lastIn;
  return Math.max(0, Math.round(total / 60000));
}
function hhmm(min: number) { return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`; }

export function MonPointagePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);

  const { toast } = useToast();
  const clockings = useClocking((s) => s.clockings).filter((c) => c.employeeId === SELF_ID);
  const clock = useClocking((s) => s.clock);

  const [now, setNow] = useState(Date.now());
  const [offline, setOffline] = useState(false);
  const [shareGeo, setShareGeo] = useState(true);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const realToday = new Date().toISOString().slice(0, 10);
  const todayClockings = useMemo(() => clockings.filter((c) => c.at.slice(0, 10) === realToday).sort((a, b) => a.at.localeCompare(b.at)), [clockings, realToday]);
  const nextAction: 'in' | 'out' = todayClockings.length === 0 || todayClockings[todayClockings.length - 1].type === 'out' ? 'in' : 'out';
  const workedToday = workedMinutes(todayClockings, now);

  // Historique groupé par jour (hors aujourd'hui)
  const byDay = useMemo(() => {
    const map = new Map<string, Clocking[]>();
    for (const c of clockings) { const d = c.at.slice(0, 10); if (d === realToday) continue; if (!map.has(d)) map.set(d, []); map.get(d)!.push(c); }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [clockings, realToday]);

  const doClock = () => {
    const c: Clocking = {
      id: `ck_${Date.now()}`, employeeId: SELF_ID, type: nextAction,
      at: new Date().toISOString(),
      geo: shareGeo ? { lat: 5.336, lng: -4.027 } : undefined,
      offline, verification: 'ok',
    };
    clock(c);
    toast({
      variant: offline ? 'warning' : 'success',
      title: nextAction === 'in' ? 'Entrée pointée' : 'Sortie pointée',
      description: offline ? 'Enregistré localement — sera synchronisé à la reconnexion.' : `${fmtTime(c.at)}${shareGeo ? ' · position capturée' : ''}.`,
    });
  };

  return (
    <div className="animate-fade-up space-y-5">
      <TimeSubNav />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Mon pointage</h1>
        <Link to="/me/time"><Button variant="ghost" size="sm"><ArrowLeft size={14} /> Retour</Button></Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Bloc pointage */}
        <Card className="text-center">
          <p className="mono text-5xl font-semibold tracking-tight text-ink">{new Date(now).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
          <p className="text-sm font-medium text-ink-500">{new Date(now).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <Button size="md" className="mt-5 h-14 w-full text-base" onClick={doClock}>
            <Fingerprint size={20} /> {nextAction === 'in' ? 'Pointer mon entrée' : 'Pointer ma sortie'}
          </Button>
          {todayClockings.length > 0 && (
            <p className="mt-3 text-[12px] font-medium text-ink-400">
              Dernier : {todayClockings[todayClockings.length - 1].type === 'in' ? 'entrée' : 'sortie'} à {fmtTime(todayClockings[todayClockings.length - 1].at)}
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-5 border-t border-line pt-4 text-left">
            <Switch checked={shareGeo} onChange={setShareGeo} label="Partager ma position" />
            <Switch checked={offline} onChange={setOffline} label="Mode hors-ligne" />
          </div>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-ink-400">
            <MapPin size={11} /> Position capturée au pointage uniquement (consentement CONS-11) — aucun suivi continu.
          </p>
        </Card>

        {/* Récap du jour */}
        <Card>
          <CardHeader title="Aujourd'hui" subtitle={`Temps travaillé : ${hhmm(workedToday)}`} action={<StatusPill tone={todayClockings.length ? 'ok' : 'neutral'} dot>{todayClockings.length ? 'En poste' : 'Non pointé'}</StatusPill>} />
          {todayClockings.length > 0 ? (
            <div className="space-y-1.5">
              {todayClockings.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', c.type === 'in' ? 'bg-ok/12 text-ok' : 'bg-ink/[0.06] text-ink-500')}>
                    {c.offline ? <WifiOff size={15} /> : <CheckCircle2 size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{c.type === 'in' ? 'Entrée' : 'Sortie'} · {fmtTime(c.at)}</p>
                    <p className="text-[11px] font-medium text-ink-400">{c.geo ? 'Position capturée' : 'Sans géolocalisation'}{c.offline ? ' · hors-ligne (à synchroniser)' : ''}</p>
                  </div>
                  {c.verification === 'to_verify' && <StatusPill tone="warn" dot={false}>À vérifier</StatusPill>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm font-medium text-ink-400">Aucun pointage aujourd'hui.</p>}
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => toast({ variant: 'info', title: 'Régularisation', description: 'Votre signalement sera transmis pour validation (manager/RH).' })}>
            <FileWarning size={14} /> Signaler un oubli / une erreur
          </Button>
        </Card>
      </div>

      {/* Historique */}
      <Card inset={false}>
        <div className="p-5 pb-3"><CardHeader title="Mes pointages" subtitle="Jours précédents" className="mb-0" /></div>
        <div className="divide-y divide-line">
          {byDay.map(([day, items]) => {
            const asc = items.slice().sort((a, b) => a.at.localeCompare(b.at));
            const ins = asc.filter((c) => c.type === 'in');
            const outs = asc.filter((c) => c.type === 'out');
            const anomaly = ins.length !== outs.length;
            const total = workedMinutes(asc, Date.parse(`${day}T23:59:59`));
            return (
              <div key={day} className="flex items-center gap-3 px-5 py-3">
                <span className="mono w-28 shrink-0 text-[12px] font-bold text-ink-500">{fmtDay(day)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{asc.map((c) => `${c.type === 'in' ? '↓' : '↑'}${fmtTime(c.at)}`).join('  ')}</p>
                  <p className="text-[11px] font-medium text-ink-400">{hhmm(total)} travaillées</p>
                </div>
                {anomaly && <StatusPill tone="warn" dot={false}><AlertTriangle size={11} /> Anomalie</StatusPill>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
