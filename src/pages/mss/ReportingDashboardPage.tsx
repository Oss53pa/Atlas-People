import { useEffect, useMemo } from 'react';
import { Users, RefreshCw, CalendarOff, Clock, Wallet, GraduationCap, Target, HeartPulse, Lock } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { ReportingSubNav } from '../../components/mss/ReportingSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { kpiSummary, fcfa } from '../../lib/mss/reporting';

export function ReportingDashboardPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const k = kpiSummary(team);

  const Block = ({ icon: Icon, title, children }: { icon: typeof Users; title: string; children: React.ReactNode }) => (
    <Card>
      <CardHeader title={title} action={<Icon size={16} className="text-ink-400" />} />
      <div className="space-y-1 text-sm font-medium text-ink-700">{children}</div>
    </Card>
  );
  const Line = ({ children, className }: { children: React.ReactNode; className?: string }) => <p className={`flex flex-wrap items-baseline gap-x-2 ${className ?? ''}`}>{children}</p>;
  const Big = ({ children }: { children: React.ReactNode }) => <span className="mono text-lg font-semibold text-ink">{children}</span>;

  return (
    <div className="animate-fade-up space-y-5">
      <ReportingSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Reporting &amp; pilotage</h1>
        <StatusPill tone="info" dot={false}>Période : Mai 2026</StatusPill>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Block icon={Users} title="Effectif">
          <Line><Big>{k.total}</Big> personnes <span className="text-[12px] font-semibold text-ok">▲ +{k.deltaHeadcount} vs mois préc.</span></Line>
          <Line>H/F : <Big>{k.men}/{k.women}</Big> ({k.pctMen}% / {k.pctWomen}%)</Line>
          <Line>Ancienneté moy. : <Big>{k.avgSeniority}</Big> ans · Âge moyen : <Big>{k.avgAge}</Big> ans</Line>
        </Block>

        <Block icon={RefreshCw} title="Turn-over">
          <Line><Big>{k.departures12m}</Big> départ(s) sur 12 mois</Line>
          <Line>Taux annuel projeté : <Big>{k.turnoverRate}%</Big></Line>
          <Line className="text-ink-500">Vs entreprise : {k.companyTurnover}% {k.turnoverRate > k.companyTurnover ? '(légèrement au-dessus)' : '(sous la moyenne)'}</Line>
        </Block>

        <Block icon={CalendarOff} title="Absentéisme">
          <Line>Mois : <Big>{k.absMonth}%</Big> <span className="text-[12px] font-semibold text-ok">▼ {k.absDelta} vs T-1</span></Line>
          <Line>Année cumul : <Big>{k.absYear}%</Big></Line>
          <Line className="text-ink-500">Vs entreprise : {k.companyAbs}% (équipe meilleure)</Line>
        </Block>

        <Block icon={Clock} title="Temps">
          <Line>Masse horaire travaillée : <Big>{k.hoursWorked.toLocaleString('fr-FR')}h</Big> ce mois</Line>
          <Line>HS cumul année : <Big>{k.otYear}h</Big> / {k.otTarget.toLocaleString('fr-FR')}h cible</Line>
          <Line>Récupération dispo. : <Big>{k.recupAvailable}h</Big></Line>
        </Block>

        <Block icon={Wallet} title="Masse salariale (agrégée)">
          {k.payrollMasked ? (
            <p className="flex items-center gap-2 text-[13px] font-medium text-ink-400"><Lock size={14} /> Masquée : périmètre &lt; 5 personnes (ré-identification).</p>
          ) : (
            <>
              <Line><Big>{fcfa(k.payrollMonth)}</Big> ce mois</Line>
              <Line>Budget : {fcfa(k.payrollBudget)} <span className={`text-[12px] font-semibold ${k.payrollDeltaPct > 0 ? 'text-warn' : 'text-ok'}`}>{k.payrollDeltaPct > 0 ? '▲ +' : '▼ '}{k.payrollDeltaPct}%</span></Line>
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-400"><Lock size={12} /> Aucune répartition individuelle visible.</p>
            </>
          )}
        </Block>

        <Block icon={GraduationCap} title="Formation">
          <Line>Budget : <Big>{fcfa(k.trainingSpent)}</Big> / {fcfa(k.trainingBudget)} ({Math.round((k.trainingSpent / k.trainingBudget) * 100)}%)</Line>
          <Line>Heures cumul année : <Big>{k.trainingHours}h</Big></Line>
        </Block>

        <Block icon={Target} title="Performance">
          <Line>OKR avancement global : <Big>{k.okrGlobal}%</Big></Line>
          <Line>Promotions internes (12 mois) : <Big>{k.promotions}</Big> · Mobilités : <Big>{k.mobilities}</Big></Line>
        </Block>

        <Block icon={HeartPulse} title="Climat">
          <Line>Engagement : <Big>{k.engagement}/10</Big> · Satisfaction : <Big>{k.satisfaction}/5</Big></Line>
          <Line>Alertes RPS : <StatusPill tone={k.rpsAlerts > 0 ? 'warn' : 'ok'} dot={false}>{k.rpsAlerts}</StatusPill></Line>
        </Block>
      </div>

      <Card>
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-500"><Lock size={14} className="mt-0.5 shrink-0 text-info" /> Toutes les statistiques sont agrégées. Aucune donnée individuelle n’est affichée ; les indicateurs sont masqués sous le seuil de 5 personnes.</p>
      </Card>
    </div>
  );
}
