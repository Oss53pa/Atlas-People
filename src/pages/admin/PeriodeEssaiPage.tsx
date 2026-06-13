import { Link } from 'react-router-dom';
import { Hourglass, AlertTriangle, CheckCircle2, ArrowUpRight, MapPin } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { AdminRhSubNav } from '../../components/admin/AdminRhSubNav';
import { ALERTS } from '../../lib/m4/mock';
import { useM4AdminData } from '../../lib/m4/dataLive';
import { PROBATION_LEGAL, PROBATION_ALERT_THRESHOLDS } from '../../lib/m4/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import { useRoster } from '../../lib/m1/roster';

export function PeriodeEssaiPage() {
  const roster = useRoster();
  const { probations: PROBATIONS } = useM4AdminData();
  const inProgress = PROBATIONS.filter((p) => p.decision === 'pending');
  const confirmed = PROBATIONS.filter((p) => p.decision !== 'pending');
  const probationAlerts = ALERTS.filter((a) => a.kind === 'probation');

  return (
    <div className="animate-fade-up space-y-5">
      <AdminRhSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Période d'essai</h1>
          <p className="text-sm font-medium text-ink-500">Durées légales par pays · alertes J-{PROBATION_ALERT_THRESHOLDS.join('/')} · décision avant échéance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="En cours" value={String(inProgress.length)} unit="à surveiller" icon={Hourglass} tone={inProgress.length ? 'amber' : 'default'} />
        <StatCard label="Confirmées (hist.)" value={String(confirmed.length)} unit="archivées" icon={CheckCircle2} />
        <StatCard label="Alertes" value={String(probationAlerts.length)} unit="décision proche" icon={AlertTriangle} tone={probationAlerts.length ? 'amber' : 'default'} />
        <StatCard label="Pays référencés" value={String(PROBATION_LEGAL.length)} unit="UEMOA + CEMAC" icon={MapPin} />
      </div>

      {inProgress.length > 0 && (
        <Card>
          <CardHeader title="Périodes d'essai en cours" subtitle="Évaluation intermédiaire + décision avant fin" action={<Hourglass size={16} className="text-amber-deep" />} />
          <div className="space-y-2">
            {inProgress.map((p) => {
              const emp = employeeById(p.employeeId)!;
              const alert = probationAlerts.find((a) => a.employeeId === p.employeeId);
              return (
                <div key={p.id} className="rounded-xl border border-warn/25 bg-warn/[0.05] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><Avatar name={employeeName(emp)} size="sm" /><div>
                      <p className="text-[13px] font-bold text-ink">{employeeName(emp)} · {emp.role}</p>
                      <p className="text-[11px] font-medium text-ink-500">{p.contractType} · {p.category} · {p.durationMonths} mois · {emp.countryCode}</p>
                    </div></div>
                    {alert && <StatusPill tone={alert.severity === 'danger' ? 'danger' : 'warn'} dot={false}>{`J-${alert.daysLeft}`}</StatusPill>}
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-[12px] font-medium text-ink-700 md:grid-cols-3">
                    <span>📅 Début : <b>{p.startDate}</b></span>
                    <span>📅 Fin théorique : <b>{p.endDate}</b></span>
                    {p.intermediateEvalDate && <span>⏳ Évaluation intermédiaire : <b>{p.intermediateEvalDate}</b></span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Link to={`/collaborateurs/${emp.id}`}><Button variant="outline" size="sm">Ouvrir dossier <ArrowUpRight size={12} /></Button></Link>
                    <Button variant="ghost" size="sm">Évaluer</Button>
                    <Button variant="ghost" size="sm">Décider</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Durées légales par pays" subtitle="14 régimes UEMOA/CEMAC · renouvellement 1 fois max · CDD = 1 j/semaine plafond 1 mois" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Pays</th><th className="px-3 py-2 text-left">Cadre</th>
              <th className="px-3 py-2 text-left">Maîtrise</th><th className="px-3 py-2 text-left">Employé</th>
              <th className="px-3 py-2 text-left">Ouvrier</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {PROBATION_LEGAL.map((r) => (
                <tr key={r.countryCode}>
                  <td className="px-3 py-2 mono text-[11px] font-bold text-amber-deep">{r.countryCode}</td>
                  <td className="px-3 py-2 text-[12px] font-semibold text-ink">{r.cadre}</td>
                  <td className="px-3 py-2 text-[12px] font-medium text-ink-700">{r.maitrise}</td>
                  <td className="px-3 py-2 text-[12px] font-medium text-ink-700">{r.employe}</td>
                  <td className="px-3 py-2 text-[12px] font-medium text-ink-700">{r.ouvrier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-[11px] font-medium text-ink-400">Alertes générées automatiquement à J-{PROBATION_ALERT_THRESHOLDS.join(', J-')} de la fin. Décision finale (confirmation / prolongation / rupture) notifiée au moins 5 jours avant la fin légale. Documents générés via DocJourney, signés DRH via ADVIST. Suivi pour les {roster.filter(e => e.probationEnd).length} collaborateur(s) en essai sur le périmètre.</p>
    </div>
  );
}
