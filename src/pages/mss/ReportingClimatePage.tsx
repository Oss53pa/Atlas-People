import { useEffect, useMemo } from 'react';
import { HeartPulse, Smile, ShieldAlert, Activity, Lock } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { ReportingSubNav } from '../../components/mss/ReportingSubNav';
import { VBars } from '../../components/mss/charts';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { climateMetrics, climateTrend } from '../../lib/mss/daily';

export function ReportingClimatePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const enough = team.length >= 5;
  const m = climateMetrics(team);
  const trend = climateTrend();

  return (
    <div className="animate-fade-up space-y-5">
      <ReportingSubNav />
      <h1 className="text-2xl font-semibold text-ink">Indicateurs RH / Climat</h1>

      {!enough ? (
        <Card><p className="flex items-center gap-2 py-3 text-sm font-medium text-ink-500"><Lock size={15} className="text-ink-400" /> Indicateurs masqués : périmètre &lt; 5 personnes (seuil d’anonymisation des sondages).</p></Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Engagement" action={<HeartPulse size={16} className="text-ink-400" />} />
              <p className="mono text-2xl font-semibold text-ink">{m.engagement}/10</p>
              <p className="text-[12px] font-semibold text-ok">▲ +{m.engagementDelta} sur 6 mois · vs entreprise 7,7 (équivalent)</p>
            </Card>
            <Card>
              <CardHeader title="Satisfaction" action={<Smile size={16} className="text-ink-400" />} />
              <p className="mono text-2xl font-semibold text-ink">{m.satisfaction}/5</p>
              <p className="text-[12px] font-medium text-ink-600">Top + : ambiance équipe, sens du travail.</p>
              <p className="text-[12px] font-medium text-ink-600">Top − : charge de travail, reconnaissance.</p>
            </Card>
          </div>

          <Card>
            <CardHeader title="Évolution de l’engagement (6 mois)" subtitle={`Participation dernier sondage : ${m.participation}%`} action={<HeartPulse size={16} className="text-ink-400" />} />
            <VBars data={trend.map((t) => ({ label: t.month, value: t.value }))} suffix="/10" />
          </Card>
        </>
      )}

      <Card>
        <CardHeader title="RPS (risques psychosociaux)" action={<ShieldAlert size={16} className="text-ink-400" />} />
        <div className="space-y-1 text-sm font-medium text-ink-700">
          <p>Alertes actives : <StatusPill tone="ok" dot={false}>0</StatusPill></p>
          <p>Alertes 12 mois : 2 (toutes résolues)</p>
          <p className="text-[12px] text-ink-500">Cas par catégorie (anonymisé) : Stress (1), Conflit relationnel (1).</p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Absentéisme lié au climat" action={<Activity size={16} className="text-ink-400" />} />
        <p className="text-sm font-medium text-ink-700">Corrélation absentéisme / sondages : <span className="font-semibold text-ink">modérée</span>.</p>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-ink-400"><Lock size={12} /> Analyse croisée agrégée, jamais individuelle.</p>
      </Card>
    </div>
  );
}
