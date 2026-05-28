import { useEffect, useMemo } from 'react';
import { Fingerprint, AlertTriangle } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { TeamTimeSubNav } from '../../components/m2/TeamTimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useTimeOff } from '../../store/useTimeOff';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { employeeName } from '../../data/mock';

const TODAY = '2026-05-28';

/** Présence d'équipe (semaine). Données déterministes dérivées du périmètre.
 *  Pas de données sensibles. La correction effective des pointages = back-office. */
export function TeamAttendancePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const requests = useTimeOff((s) => s.requests).filter((r) => r.status === 'approved');

  const rows = team.map((e, i) => {
    const onLeave = requests.some((r) => r.employeeId === e.id && r.start <= TODAY && r.end >= TODAY);
    const planned = 40;
    const worked = onLeave ? 32 : 38 + (i % 3);
    const lateDays = i % 4 === 0 ? 1 : 0;
    const anomaly = i % 5 === 0;
    return { e, planned, worked, gap: worked - planned, lateDays, anomaly, onLeave };
  });
  const anomalies = rows.filter((r) => r.anomaly);

  return (
    <div className="animate-fade-up space-y-5">
      <TeamTimeSubNav />
      <h1 className="text-2xl font-semibold text-ink">Temps de mon équipe</h1>

      <Card inset={false}>
        <div className="p-5 pb-3"><CardHeader title="Présence — semaine en cours" subtitle="Prévu vs pointé" className="mb-0" action={<Fingerprint size={16} className="text-ink-400" />} /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2.5 text-left">Membre</th>
                <th className="px-3 py-2.5 text-right">Prévu</th>
                <th className="px-3 py-2.5 text-right">Pointé</th>
                <th className="px-3 py-2.5 text-right">Écart</th>
                <th className="px-3 py-2.5 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.e.id}>
                  <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><Avatar name={employeeName(r.e)} size="xs" /><span className="text-[13px] font-semibold text-ink">{employeeName(r.e)}</span></div></td>
                  <td className="mono px-3 py-2.5 text-right text-ink-500">{r.planned}h</td>
                  <td className="mono px-3 py-2.5 text-right font-semibold text-ink">{r.worked}h</td>
                  <td className={`mono px-3 py-2.5 text-right font-semibold ${r.gap < 0 ? 'text-danger' : r.gap > 0 ? 'text-ok' : 'text-ink-400'}`}>{r.gap > 0 ? '+' : ''}{r.gap}h</td>
                  <td className="px-3 py-2.5 text-center">{r.onLeave ? <StatusPill tone="warn" dot={false}>En congé</StatusPill> : r.anomaly ? <StatusPill tone="danger" dot={false}>Anomalie</StatusPill> : r.lateDays ? <StatusPill tone="warn" dot={false}>{r.lateDays} retard</StatusPill> : <StatusPill tone="ok" dot={false}>À l'heure</StatusPill>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-warn/25">
        <CardHeader title="Anomalies de pointage" subtitle="La correction effective relève du back-office RH" action={<AlertTriangle size={16} className="text-warn" />} />
        {anomalies.length > 0 ? (
          <div className="space-y-1.5">
            {anomalies.map((r) => (
              <div key={r.e.id} className="flex items-center justify-between rounded-xl bg-warn/[0.06] px-3 py-2.5">
                <span className="text-sm font-semibold text-ink">{employeeName(r.e)}</span>
                <span className="text-[11px] font-medium text-ink-500">Entrée sans sortie détectée · à régulariser</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm font-medium text-ink-400">Aucune anomalie cette semaine.</p>}
      </Card>
    </div>
  );
}
