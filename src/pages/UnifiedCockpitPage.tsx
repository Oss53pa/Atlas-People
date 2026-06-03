/**
 * M13 Cockpit DRH unifié — Vue 360° agrégée de tous les modules.
 * Pull KPIs de M1 · M2 · M3 · M5 · M6 · M7 · M8 · M10 · M11 · M12.
 * Destination DG / DRH / Comex — synthèse stratégique en une page.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Wallet, Target, Gauge, GraduationCap, ShieldCheck, Briefcase,
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, Clock, CheckCircle2,
  ArrowUpRight, Route, Network, Activity, Brain, Crown, Heart, Printer,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { StatusPill } from '../components/ui/StatusPill';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Money } from '../lib/money';
import { computePayslip, getRegime } from '../lib/payroll';
import { TENANT_CURRENCY } from '../data/countries';
import { EMPLOYEES, employeeName, employeeById } from '../data/mock';
import { kpis as recrutKpis } from '../lib/m5/mock';
import { ProphtetPanel, type CockpitAlert } from '../components/ProphtetPanel';
import { CONFORMITE_KPI } from '../lib/m12/mock';
import { FORMATION_KPI, certificationsExpiringSoon } from '../lib/m11/mock';
import { CRITICAL_ROLES, HIGH_POTS, kpis as carrieresKpis } from '../lib/m10/mock';
import { BENCH_STRENGTH_META } from '../lib/m10/referentiels';
import { OBJECTIVES } from '../lib/m7/mock';
import { kpis as evalKpis } from '../lib/m8/mock';
import { COMPLIANCE_THRESHOLDS } from '../lib/m12/referentiels';
import { TRAINING_THRESHOLDS } from '../lib/m11/referentiels';
import { cn } from '../lib/cn';

const fmt = (n: number): string => new Intl.NumberFormat('fr-FR').format(Math.round(n));
const fmtCompact = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.0', '')} Mds`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return String(Math.round(n));
};

interface KpiTile {
  label: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  tone?: 'default' | 'success' | 'warn' | 'danger';
  link?: string;
}

function KpiTileView({ tile, icon: Icon }: { tile: KpiTile; icon: React.ComponentType<{ size: number; className?: string }> }) {
  const toneCls = tile.tone === 'success' ? 'border-emerald-300/40 bg-emerald-50/30' :
                  tile.tone === 'warn' ? 'border-amber-300/40 bg-amber-50/30' :
                  tile.tone === 'danger' ? 'border-rose-300/40 bg-rose-50/30' :
                  'border-line bg-surface2/30';
  const inner = (
    <div className={cn('rounded-xl border p-3 transition-colors hover:bg-amber/[0.03]', toneCls)}>
      <div className="flex items-center gap-1.5">
        <Icon size={12} className="text-amber-deep" />
        <p className="text-[9px] font-bold uppercase tracking-wider text-ink-500">{tile.label}</p>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="mono text-[20px] font-bold leading-none text-ink">{tile.value}</p>
        {tile.unit && <p className="text-[10px] font-medium text-ink-500">{tile.unit}</p>}
      </div>
      {tile.trend && (
        <div className="mt-1 flex items-center gap-0.5 text-[10px] font-bold">
          {tile.trend === 'up' && <TrendingUp size={10} className="text-emerald-600" />}
          {tile.trend === 'down' && <TrendingDown size={10} className="text-rose-600" />}
          <span className={cn(tile.trend === 'up' ? 'text-emerald-600' : tile.trend === 'down' ? 'text-rose-600' : 'text-ink-500')}>{tile.trend === 'up' ? '+' : tile.trend === 'down' ? '−' : '='}</span>
        </div>
      )}
    </div>
  );
  return tile.link ? <Link to={tile.link} className="block">{inner}</Link> : inner;
}

interface SectionBlock {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  cta: { to: string; label: string };
  tiles: { tile: KpiTile; icon: React.ComponentType<{ size: number; className?: string }> }[];
  alert?: string;
}

export function UnifiedCockpitDRHPage() {
  // — M1 Effectif
  const headcount = EMPLOYEES.length;
  const active = EMPLOYEES.filter((e) => e.status === 'active').length;
  const leave = EMPLOYEES.filter((e) => e.status === 'leave').length;
  const notice = EMPLOYEES.filter((e) => e.status === 'notice').length;

  // — M3 Paie déterministe
  const payroll = useMemo(() => {
    let employerCost = Money.zero(TENANT_CURRENCY);
    let net = Money.zero(TENANT_CURRENCY);
    for (const e of EMPLOYEES) {
      const regime = getRegime(e.countryCode);
      const { result } = computePayslip({
        baseSalary: e.baseSalary,
        taxableAllowances: e.taxableAllowances,
        nonTaxableAllowances: e.nonTaxableAllowances,
        fiscalParts: e.fiscalParts,
        otherDeductions: e.otherDeductions,
      }, regime, employeeName(e));
      employerCost = employerCost.add(Money.fromJSON({ units: result.employerCostUnits, currency: TENANT_CURRENCY }));
      net = net.add(Money.fromJSON({ units: result.netToPayUnits, currency: TENANT_CURRENCY }));
    }
    return { employerCost, net };
  }, []);

  const k7 = useMemo(() => {
    const total = OBJECTIVES.length;
    const completed = OBJECTIVES.filter((o) => o.status === 'completed').length;
    const atRisk = OBJECTIVES.filter((o) => o.progress < 0.4 && o.status === 'active').length;
    const avgProgress = OBJECTIVES.reduce((s, o) => s + (o.progress ?? 0), 0) / Math.max(1, total);
    return { total, completed, atRisk, avgProgress: Math.round(avgProgress * 100) };
  }, []);

  const k5 = useMemo(() => recrutKpis(), []);
  const k8 = useMemo(() => evalKpis(), []);
  const k10 = useMemo(() => carrieresKpis(), []);
  const k11 = FORMATION_KPI;
  const k12 = CONFORMITE_KPI;

  const benchWeakRoles = CRITICAL_ROLES.filter((r) => r.benchStrength === 'weak' || r.benchStrength === 'none');
  const expiringCerts = certificationsExpiringSoon();

  const sections: SectionBlock[] = [
    {
      title: 'Effectif & Cycle de vie',
      subtitle: `M1 · M4 · ${headcount} collaborateurs · 2 pays (CI · SN)`,
      icon: Users,
      cta: { to: '/collaborateurs', label: 'Ouvrir M1' },
      tiles: [
        { tile: { label: 'Effectif total', value: String(headcount), unit: 'collab', link: '/collaborateurs' }, icon: Users },
        { tile: { label: 'Actifs', value: String(active), unit: 'au travail', tone: 'success' }, icon: CheckCircle2 },
        { tile: { label: 'En congé', value: String(leave), unit: 'longue absence' }, icon: Clock },
        { tile: { label: 'En préavis', value: String(notice), unit: 'sorties à venir', tone: notice > 0 ? 'warn' : 'default' }, icon: TrendingDown },
      ],
    },
    {
      title: 'Paie & Coût employeur',
      subtitle: 'M3 · masse salariale calculée par le moteur déterministe',
      icon: Wallet,
      cta: { to: '/paie', label: 'Ouvrir M3' },
      tiles: [
        { tile: { label: 'Coût employeur mensuel', value: fmtCompact(payroll.employerCost.toInt()), unit: 'FCFA' }, icon: Wallet },
        { tile: { label: 'Net à payer', value: fmtCompact(payroll.net.toInt()), unit: 'FCFA' }, icon: TrendingUp },
        { tile: { label: 'Coût annuel projeté', value: fmtCompact(payroll.employerCost.toInt() * 12), unit: 'FCFA' }, icon: Activity },
        { tile: { label: 'Charges sociales', value: `${Math.round(((payroll.employerCost.toInt() - payroll.net.toInt()) / payroll.employerCost.toInt()) * 100)} %`, unit: 'sur brut' }, icon: ShieldCheck },
      ],
    },
    {
      title: 'Recrutement',
      subtitle: 'M5 · ATS · pipeline · time-to-fill',
      icon: Target,
      cta: { to: '/recrutement', label: 'Ouvrir M5' },
      tiles: [
        { tile: { label: 'Postes ouverts', value: String(k5.postesOuverts), unit: 'à pourvoir', link: '/recrutement/postes' }, icon: Briefcase },
        { tile: { label: 'Candidatures actives', value: String(k5.candidaturesEnCours), unit: 'en pipeline' }, icon: Activity },
        { tile: { label: 'Time-to-fill', value: `${k5.timeToFillJoursMedian} j`, unit: 'médian', tone: k5.timeToFillJoursMedian > 45 ? 'warn' : 'success' }, icon: Clock },
        { tile: { label: 'Embauches mois', value: String(k5.embauchesMoisCourant), unit: 'YTD' }, icon: CheckCircle2 },
      ],
    },
    {
      title: 'Performance OKR',
      subtitle: 'M7 · cascade 4 niveaux · check-ins hebdo',
      icon: Target,
      cta: { to: '/objectifs', label: 'Ouvrir M7' },
      tiles: [
        { tile: { label: 'OKR actifs', value: String(k7.total - k7.completed), unit: `/ ${k7.total} total`, link: '/objectifs' }, icon: Target },
        { tile: { label: 'Progression moyenne', value: `${k7.avgProgress} %`, unit: 'cycle Q2' }, icon: TrendingUp },
        { tile: { label: 'OKR à risque', value: String(k7.atRisk), unit: 'confidence < 4', tone: k7.atRisk > 0 ? 'warn' : 'default', link: '/objectifs/notation' }, icon: AlertTriangle },
        { tile: { label: 'OKR terminés', value: String(k7.completed), unit: 'cycle clos', tone: 'success' }, icon: CheckCircle2 },
      ],
    },
    {
      title: 'Évaluations & 9-box',
      subtitle: 'M8 · cycles annuels · talents · plans de développement',
      icon: Gauge,
      cta: { to: '/evaluations', label: 'Ouvrir M8' },
      tiles: [
        { tile: { label: 'Évaluations actives', value: String(k8.evaluationsActives), unit: `${k8.completionPct} % complets` }, icon: Gauge },
        { tile: { label: 'Hauts potentiels', value: `${k8.hautPotentielPct} %`, unit: '9-box A3', tone: 'success', link: '/evaluations/9-box' }, icon: Sparkles },
        { tile: { label: 'Sous-perform.', value: `${k8.bas_perfPct} %`, unit: 'plan dev', tone: k8.bas_perfPct > 10 ? 'warn' : 'default' }, icon: TrendingDown },
        { tile: { label: 'Plans dev actifs', value: String(k8.plansDevActifs), unit: 'en cours' }, icon: Brain },
      ],
    },
    {
      title: 'Carrières & Succession',
      subtitle: 'M10 · postes clés · hauts potentiels · mentorat',
      icon: Route,
      cta: { to: '/carrieres', label: 'Ouvrir M10' },
      tiles: [
        { tile: { label: 'Postes clés', value: String(k10.postesCleses), unit: 'critiques' }, icon: Crown },
        { tile: { label: 'Bench strength', value: `${k10.benchStrengthPct} %`, unit: 'couverts', tone: k10.benchStrengthPct < 60 ? 'warn' : 'success' }, icon: Network },
        { tile: { label: 'Hauts potentiels', value: String(k10.hautsPotentielsCount), unit: 'programmes' }, icon: Sparkles },
        { tile: { label: 'Mentorats actifs', value: String(k10.mentorshipActifs), unit: 'pairings' }, icon: Heart },
      ],
      alert: benchWeakRoles.length > 0 ? `${benchWeakRoles.length} poste(s) clé(s) à bench faible` : undefined,
    },
    {
      title: 'Formation & Développement',
      subtitle: 'M11 · catalogue · Kirkpatrick · FDFP/3FPT · ROI',
      icon: GraduationCap,
      cta: { to: '/formation', label: 'Ouvrir M11' },
      tiles: [
        { tile: { label: 'Taux d\'accès', value: `${Math.round(k11.tauxAcces * 100)} %`, unit: `cible ${Math.round(TRAINING_THRESHOLDS.ACCESS_RATE_TARGET * 100)} %`,
            tone: k11.tauxAcces >= TRAINING_THRESHOLDS.ACCESS_RATE_TARGET ? 'success' : 'warn' }, icon: GraduationCap },
        { tile: { label: 'Heures / collab', value: String(k11.heuresMoyennesParCollab), unit: `cible ${TRAINING_THRESHOLDS.HOURS_PER_EMPLOYEE_TARGET} h` }, icon: Clock },
        { tile: { label: 'Satisfaction L1', value: `${k11.satisfactionMoyenneL1}/5`, unit: 'Kirkpatrick' }, icon: Sparkles },
        { tile: { label: 'FDFP récupérable', value: fmtCompact(k11.fdfpRecuperableYTD), unit: 'YTD', tone: 'success', link: '/formation/fdfp' }, icon: Wallet },
      ],
      alert: expiringCerts.length > 0 ? `${expiringCerts.length} certification(s) à renouveler < 90 j` : undefined,
    },
    {
      title: 'Conformité & SST',
      subtitle: 'M12 · DUER · AT/MP · déclarations sociales · audits',
      icon: ShieldCheck,
      cta: { to: '/conformite', label: 'Ouvrir M12' },
      tiles: [
        { tile: { label: 'Score conformité', value: `${k12.conformityScoreGlobal}/100`, unit: `cible ${COMPLIANCE_THRESHOLDS.CONFORMITY_SCORE_TARGET}`,
            tone: k12.conformityScoreGlobal >= COMPLIANCE_THRESHOLDS.CONFORMITY_SCORE_TARGET ? 'success' : 'warn' }, icon: ShieldCheck },
        { tile: { label: 'AT ouverts', value: String(k12.atOpenCount), unit: `TF ${k12.atFrequencyRate}`,
            tone: k12.atOpenCount > 0 ? 'warn' : 'default' }, icon: Activity },
        { tile: { label: 'Déclarations en retard', value: String(k12.declarationsOverdue), unit: 'pénalités',
            tone: k12.declarationsOverdue > 0 ? 'danger' : 'default', link: '/conformite/declarations' }, icon: AlertTriangle },
        { tile: { label: 'Risque burnout (RPS)', value: `${k12.rpsBurnoutRiskPct} %`,
            unit: `J-${k12.rpsLastSurveyDaysAgo}`, tone: k12.rpsBurnoutRiskPct >= COMPLIANCE_THRESHOLDS.RPS_BURNOUT_ALERT_PCT ? 'warn' : 'default' }, icon: Brain },
      ],
      alert: k12.duerRisksCritical > 0 ? `${k12.duerRisksCritical} risque(s) DUER à traiter` : undefined,
    },
  ];

  // Liste des top alertes consolidées
  const consolidatedAlerts = [
    ...(k12.declarationsOverdue > 0 ? [{ icon: AlertTriangle, label: `${k12.declarationsOverdue} déclaration(s) sociale(s) en retard`, link: '/conformite/declarations', tone: 'danger' as const }] : []),
    ...(k12.duerRisksCritical > 0 ? [{ icon: ShieldCheck, label: `${k12.duerRisksCritical} risque(s) DUER critiques/élevés`, link: '/conformite/duer', tone: 'warn' as const }] : []),
    ...(benchWeakRoles.length > 0 ? [{ icon: Crown, label: `${benchWeakRoles.length} poste(s) clé(s) à bench faible`, link: '/carrieres/succession', tone: 'warn' as const }] : []),
    ...(expiringCerts.length > 0 ? [{ icon: GraduationCap, label: `${expiringCerts.length} certification(s) à renouveler < 90 j`, link: '/formation/certifications', tone: 'warn' as const }] : []),
    ...(k7.atRisk > 0 ? [{ icon: Target, label: `${k7.atRisk} OKR à risque (confidence < 4)`, link: '/objectifs/notation', tone: 'warn' as const }] : []),
    ...(k12.atOpenCount > 0 ? [{ icon: Activity, label: `${k12.atOpenCount} accident(s) du travail en investigation`, link: '/conformite/at-mp', tone: 'warn' as const }] : []),
    ...(notice > 0 ? [{ icon: TrendingDown, label: `${notice} sortie(s) en préavis`, link: '/collaborateurs', tone: 'warn' as const }] : []),
  ];

  // PROPH3T : alertes mappées vers les types/domaines/sévérités du moteur narratif
  const prophtetAlerts: CockpitAlert[] = [
    ...(k12.declarationsOverdue > 0 ? [{ label: `${k12.declarationsOverdue} déclaration(s) sociale(s) en retard`, domain: 'declarations' as const, severity: 'critical' as const }] : []),
    ...(k12.duerRisksCritical > 0   ? [{ label: `${k12.duerRisksCritical} risque(s) DUER critiques/élevés`,        domain: 'duer'         as const, severity: 'high'     as const }] : []),
    ...(benchWeakRoles.length > 0   ? [{ label: `${benchWeakRoles.length} poste(s) clé(s) à bench faible`,         domain: 'bench'        as const, severity: 'high'     as const }] : []),
    ...(expiringCerts.length > 0    ? [{ label: `${expiringCerts.length} certification(s) à renouveler < 90 j`,    domain: 'cert'         as const, severity: 'medium'   as const }] : []),
    ...(k7.atRisk > 0               ? [{ label: `${k7.atRisk} OKR à risque (confidence < 4)`,                      domain: 'okr'          as const, severity: 'high'     as const }] : []),
    ...(k12.atOpenCount > 0         ? [{ label: `${k12.atOpenCount} accident(s) du travail en investigation`,     domain: 'at'           as const, severity: 'critical' as const }] : []),
    ...(notice > 0                  ? [{ label: `${notice} sortie(s) en préavis`,                                  domain: 'departure'    as const, severity: 'medium'   as const }] : []),
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <div className="print-header" data-print-date={new Date().toISOString().slice(0, 10)}>Cockpit DRH 360°</div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Cockpit DRH 360°</h1>
          <p className="mt-1 text-sm font-medium text-ink-500">
            Synthèse cross-modules · {sections.length} blocs · destination DG &amp; Comex · données déterministes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/"><Button variant="outline" size="sm">Vue classique</Button></Link>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={14} /> PDF</Button>
          <Link to="/conformite"><Button size="sm"><ShieldCheck size={14} /> Conformité</Button></Link>
        </div>
      </div>

      {/* SCORE GLOBAL DRH (composite) */}
      <Card className="border-amber-deep/30 bg-gradient-to-br from-amber-50/40 to-surface">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_1fr_1fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">Index DRH composite</p>
            <p className="mono mt-1 text-[40px] font-bold leading-none text-ink">
              {Math.round((k12.conformityScoreGlobal + k7.avgProgress + Math.round(k11.tauxAcces * 100) + k10.benchStrengthPct + Math.min(100, k8.topTalents != null ? 70 + k8.topTalents : 70)) / 5)}
              <span className="text-[18px] text-ink-500"> /100</span>
            </p>
            <p className="mt-1 text-[11px] font-medium text-ink-500">Conformité · OKR · Formation · Bench · Talents</p>
          </div>
          <KpiTileView tile={{ label: 'Conformité', value: `${k12.conformityScoreGlobal}/100`, tone: k12.conformityScoreGlobal >= 85 ? 'success' : 'warn' }} icon={ShieldCheck} />
          <KpiTileView tile={{ label: 'OKR progression', value: `${k7.avgProgress} %` }} icon={Target} />
          <KpiTileView tile={{ label: 'Formation accès', value: `${Math.round(k11.tauxAcces * 100)} %`, tone: k11.tauxAcces >= 0.7 ? 'success' : 'warn' }} icon={GraduationCap} />
          <KpiTileView tile={{ label: 'Bench strength', value: `${k10.benchStrengthPct} %`, tone: k10.benchStrengthPct < 60 ? 'warn' : 'success' }} icon={Network} />
        </div>
      </Card>

      {/* ALERTES CONSOLIDÉES */}
      {consolidatedAlerts.length > 0 && (
        <Card className="border-warn/25">
          <CardHeader title="Alertes consolidées" subtitle={`${consolidatedAlerts.length} actions à arbitrer`} action={<AlertTriangle size={16} className="text-warn" />} />
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {consolidatedAlerts.map((a, i) => {
              const Icon = a.icon;
              return (
                <Link key={i} to={a.link} className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors',
                  a.tone === 'danger' ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50' :
                  'border-amber-200 bg-amber-50/40 hover:bg-amber-50')}>
                  <Icon size={14} className={a.tone === 'danger' ? 'text-rose-600' : 'text-amber-700'} />
                  <span className="flex-1 text-[12px] font-semibold text-ink">{a.label}</span>
                  <ArrowUpRight size={12} className="text-ink-400" />
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* PROPH3T narrative */}
      <ProphtetPanel context={{
        kind: 'cockpit-alerts',
        data: {
          alerts: prophtetAlerts,
          conformityScore: k12.conformityScoreGlobal,
          rpsBurnoutPct: k12.rpsBurnoutRiskPct,
        },
      }} />

      {/* 8 SECTIONS MODULES */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sections.map((s) => {
          const SecIcon = s.icon;
          return (
            <Card key={s.title} inset={false}>
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-amber/12 p-2 text-amber-deep"><SecIcon size={18} /></span>
                    <div>
                      <h2 className="text-[14px] font-semibold leading-tight text-ink">{s.title}</h2>
                      <p className="mt-0.5 text-[11px] font-medium text-ink-500">{s.subtitle}</p>
                    </div>
                  </div>
                  <Link to={s.cta.to}><Button variant="ghost" size="sm">{s.cta.label} <ArrowUpRight size={12} /></Button></Link>
                </div>
              </div>
              <div className="border-t border-line px-5 py-3">
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {s.tiles.map((t, i) => <KpiTileView key={i} tile={t.tile} icon={t.icon} />)}
                </div>
                {s.alert && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-2 text-[11px] font-semibold text-amber-deep">
                    <AlertTriangle size={12} /> {s.alert}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* TOP HAUTS POTENTIELS — focus rétention */}
      <Card>
        <CardHeader title="Top hauts potentiels — focus rétention" subtitle={`${HIGH_POTS.length} collaborateurs dans les programmes Atlas`} action={<Sparkles size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {HIGH_POTS.slice(0, 6).map((h) => {
            const emp = employeeById(h.employeeId);
            if (!emp) return null;
            return (
              <Link key={h.employeeId} to="/carrieres/hauts-potentiels" className="flex items-center gap-3 rounded-xl bg-surface2/40 px-3 py-2 transition-colors hover:bg-amber/[0.06]">
                <Avatar name={employeeName(emp)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-ink">{employeeName(emp)}</p>
                  <p className="truncate text-[10px] font-medium text-ink-500">{emp.role} · {emp.department}</p>
                </div>
                <StatusPill tone="success" dot={false}>{h.program.replace('_', ' ')}</StatusPill>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* POSTES À RISQUE — focus succession */}
      {benchWeakRoles.length > 0 && (
        <Card className="border-warn/25">
          <CardHeader title="Postes clés à risque de succession" subtitle={`${benchWeakRoles.length} postes critiques sans bench solide`} action={<Crown size={16} className="text-warn" />} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 text-left">Poste</th>
                <th className="px-3 py-2 text-left">Titulaire</th>
                <th className="px-3 py-2 text-center">Bench</th>
                <th className="px-3 py-2 text-right" />
              </tr></thead>
              <tbody className="divide-y divide-line">
                {benchWeakRoles.map((r) => {
                  const holder = employeeById(r.currentHolderEmployeeId);
                  const bench = BENCH_STRENGTH_META[r.benchStrength];
                  return (
                    <tr key={r.id} className="hover:bg-amber/[0.03]">
                      <td className="px-4 py-2"><p className="text-[12px] font-semibold text-ink">{r.title}</p><p className="text-[10px] font-medium text-ink-500">{r.department} · criticité {r.criticality}</p></td>
                      <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={holder ? employeeName(holder) : '?'} size="xs" /><span className="text-[12px] font-medium text-ink-700">{holder ? employeeName(holder) : '—'}</span></div></td>
                      <td className="px-3 py-2 text-center"><StatusPill tone={bench.tone} dot={false}>{bench.label}</StatusPill></td>
                      <td className="px-3 py-2 text-right"><Link to="/carrieres/succession"><Button variant="ghost" size="sm">Plan <ArrowUpRight size={12} /></Button></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
