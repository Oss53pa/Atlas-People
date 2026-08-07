import { useEffect, useMemo } from 'react';
import { CalendarOff, CalendarClock, Clock, AlertTriangle, Lock, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { ReportingSubNav } from '../../components/mss/ReportingSubNav';
import { HBars } from '../../components/mss/charts';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { ABSENCE_CAUSES, overtimeByMember, timeStats } from '../../lib/mss/reporting';
import { isBackendConfigured, useMssReportingLive } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

export function ReportingTimePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);

  const ot = overtimeByMember(team);
  const t = timeStats(team);
  const topOt = ot[0];

  const { data: ctx } = useSessionContext();
  const { data: live } = useMssReportingLive(ctx?.tenantId);
  const showLive = isBackendConfigured && !!live;
  const liveTag = <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500"><Wifi size={12} /> Live DB</span>;

  return (
    <div className="animate-fade-up space-y-5">
      <ReportingSubNav />
      <h1 className="text-2xl font-semibold text-ink">Analyse temps / absences / heures sup</h1>

      <Card>
        <CardHeader title="Absentéisme — décomposition par motif" action={<CalendarOff size={16} className="text-ink-400" />} />
        <div className="space-y-2">
          {ABSENCE_CAUSES.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="w-56 shrink-0 text-[12px] font-medium text-ink-600">{c.label}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface2"><div className="h-full rounded-full bg-info/70" style={{ width: `${c.pct}%` }} /></div>
              <span className="mono w-12 text-right text-[12px] font-semibold text-ink-700">{c.pct}%</span>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-ink-400"><Lock size={12} /> Aucune nature médicale détaillée (catégories agrégées uniquement).</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Congés" action={showLive ? liveTag : <CalendarClock size={16} className="text-ink-400" />} />
          <div className="space-y-1 text-sm font-medium text-ink-700">
            {showLive ? (
              <>
                <p>Demandes approuvées : <span className="mono font-semibold text-ink">{live.leaveApproved.toLocaleString('fr-FR')}</span></p>
                <p>Jours approuvés (cumul) : <span className="mono font-semibold text-ink">{Math.round(live.leaveDays).toLocaleString('fr-FR')} j</span></p>
                <p className="text-warn">Péremption à venir : {t.leaveExpiring} j (chez {t.expiringPeople} membre(s))</p>
              </>
            ) : (
              <>
                <p>Solde équipe : <span className="mono font-semibold text-ink">{t.leaveBalance} j</span> disponibles</p>
                <p>Pris ce trimestre : <span className="mono font-semibold text-ink">{t.leaveTakenQ} j</span></p>
                <p className="text-warn">Péremption à venir : {t.leaveExpiring} j (chez {t.expiringPeople} membre(s))</p>
              </>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Anomalies pointage" action={<AlertTriangle size={16} className="text-ink-400" />} />
          <div className="space-y-1 text-sm font-medium text-ink-700">
            <p>Ce mois : <span className="mono font-semibold text-ink">{t.clockAnomalies}</span> <span className="text-[12px] font-semibold text-ok">▼ {t.anomaliesDelta} vs mois préc.</span></p>
            <p className="text-[12px] text-ink-500">Top types : oublis de sortie, pointages hors site.</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Heures supplémentaires par membre" subtitle={`Cumul${showLive ? ' (live) ' : ' année '}: ${showLive ? Math.round(live.overtimeHours).toLocaleString('fr-FR') : t.otTotal}h équipe · cible max ${t.otTarget.toLocaleString('fr-FR')}h · ${t.otPaidPct}% payées / ${t.otRecupPct}% récupérées`} action={showLive ? liveTag : <Clock size={16} className="text-ink-400" />} />
        <HBars data={ot.map((o) => ({ label: o.name, value: o.hours }))} unit="h" />
        {topOt && topOt.pct >= 35 && (
          <p className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-warn"><AlertTriangle size={13} /> {topOt.name} concentre {topOt.pct}% des HS de l’équipe.</p>
        )}
        <div className="mt-2"><StatusPill tone="info" dot={false}>Données agrégées — pilotage de charge</StatusPill></div>
      </Card>
    </div>
  );
}
