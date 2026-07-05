import { useEffect, useMemo } from 'react';
import { Fingerprint, AlertTriangle, Wifi } from 'lucide-react';
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
import { isBackendConfigured, useTeamClockings } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';
import { mockEmpId } from '../../lib/m1/roster';

const TODAY = '2026-05-28';

const clockingLabel = (t: string): string => {
  const k = t.toLowerCase();
  return k === 'in' || k === 'entry' ? 'Entrée' : k === 'out' || k === 'exit' ? 'Sortie' : t;
};
const VERIF_TONE: Record<string, 'ok' | 'warn' | 'danger'> = { verified: 'ok', pending: 'warn', flagged: 'danger', unverified: 'warn' };

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

  // ── LIVE : derniers pointages Supabase scopés à l'équipe. ──
  const teamIds = useMemo(() => new Set(team.map((e) => e.id)), [team]);
  const { data: ctx } = useSessionContext();
  const { data: liveClockings } = useTeamClockings(ctx?.tenantId);
  const liveScoped = useMemo(
    () => (liveClockings ?? []).filter((c) => teamIds.has(mockEmpId(c.employee_id))),
    [liveClockings, teamIds],
  );
  const hasLive = isBackendConfigured && liveScoped.length > 0;

  return (
    <div className="animate-fade-up space-y-5">
      <TeamTimeSubNav />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-ink">Temps de mon équipe</h1>
        {hasLive && <StatusPill tone="ok" dot={false}><Wifi size={12} className="inline" /> Live DB</StatusPill>}
      </div>

      {hasLive && (
        <Card inset={false}>
          <div className="p-5 pb-3"><CardHeader title="Derniers pointages — équipe" subtitle="Flux temps réel (Supabase)" className="mb-0" action={<Fingerprint size={16} className="text-ink-400" />} /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                  <th className="px-4 py-2.5 text-left">Membre</th>
                  <th className="px-3 py-2.5 text-left">Type</th>
                  <th className="px-3 py-2.5 text-left">Horodatage</th>
                  <th className="px-3 py-2.5 text-left">Méthode</th>
                  <th className="px-3 py-2.5 text-center">Vérification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {liveScoped.map((c) => {
                  const who = `${c.employee_first_name ?? ''} ${c.employee_last_name ?? ''}`.trim() || '—';
                  return (
                    <tr key={c.id}>
                      <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><Avatar name={who} size="xs" /><span className="text-[13px] font-semibold text-ink">{who}</span></div></td>
                      <td className="px-3 py-2.5 text-[13px] font-semibold text-ink-700">{clockingLabel(c.clocking_type)}</td>
                      <td className="mono px-3 py-2.5 text-[12px] text-ink-500">{new Date(c.clocked_at).toLocaleString('fr-FR')}</td>
                      <td className="px-3 py-2.5 text-[12px] text-ink-400">{c.method}</td>
                      <td className="px-3 py-2.5 text-center"><StatusPill tone={VERIF_TONE[c.verification_status] ?? 'warn'} dot={false}>{c.verification_status}</StatusPill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
