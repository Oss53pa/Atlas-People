import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Banknote,
  HeartPulse,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Scale,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatusPill } from '../components/ui/StatusPill';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { AreaTrend } from '../components/charts/AreaTrend';
import { DonutChart } from '../components/charts/DonutChart';
import { RadialGauge } from '../components/charts/RadialGauge';
import { DotMatrix } from '../components/charts/DotMatrix';
import { ProgressBar } from '../components/charts/ProgressBar';
import { Money } from '../lib/money';
import { computePayslip, getRegime } from '../lib/payroll';
import { TENANT_CURRENCY } from '../data/countries';
import {
  EMPLOYEES,
  HEADCOUNT_BY_DEPT,
  CLIMATE_TREND,
  ATTENDANCE_MATRIX,
  employeeName,
  type EmployeeRecord,
} from '../data/mock';

// Action de soin proposée selon le signal (jamais punitif — cahier §10).
function careAction(e: EmployeeRecord): string {
  if (e.retentionAttention >= 70) return 'Entretien carrière prioritaire + revue de charge';
  if (e.retentionAttention >= 55) return 'Proposer une mobilité interne ou un projet clé';
  return 'Point informel manager + plan de développement';
}

export function CockpitPage() {
  // Masse salariale calculée par le moteur déterministe (tenant XOF : CI + SN).
  const totals = useMemo(() => {
    let employerCost = Money.zero(TENANT_CURRENCY);
    let net = Money.zero(TENANT_CURRENCY);
    for (const e of EMPLOYEES) {
      const regime = getRegime(e.countryCode);
      const { result } = computePayslip(
        {
          baseSalary: e.baseSalary,
          taxableAllowances: e.taxableAllowances,
          nonTaxableAllowances: e.nonTaxableAllowances,
          fiscalParts: e.fiscalParts,
          otherDeductions: e.otherDeductions,
        },
        regime,
        employeeName(e),
      );
      employerCost = employerCost.add(Money.fromJSON({ units: result.employerCostUnits, currency: TENANT_CURRENCY }));
      net = net.add(Money.fromJSON({ units: result.netToPayUnits, currency: TENANT_CURRENCY }));
    }
    return { employerCost, net };
  }, []);

  const costMillions = totals.employerCost.toInt() / 1_000_000;

  // Projection masse salariale 18 mois (réel passé + projection +3%/mois).
  const projection = useMemo(() => {
    const months = ['Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep'];
    return months.map((label, i) => {
      const factor = Math.pow(1.03, i - 2);
      const v = +(costMillions * factor).toFixed(1);
      return i <= 2 ? { label, reel: v, projection: v } : { label, reel: null, projection: v };
    });
  }, [costMillions]);

  const attention = EMPLOYEES.filter((e) => e.retentionAttention >= 45).sort(
    (a, b) => b.retentionAttention - a.retentionAttention,
  );

  // Équité salariale : salaire de base moyen par département (surveillance écart).
  const equity = HEADCOUNT_BY_DEPT.map((d) => {
    const list = EMPLOYEES.filter((e) =>
      d.label === 'RH' ? e.department === 'Ressources Humaines' : e.department === d.label,
    );
    const avg = list.reduce((s, e) => s + e.baseSalary, 0) / (list.length || 1);
    return { dept: d.label, avg, color: d.color };
  });
  const maxAvg = Math.max(...equity.map((e) => e.avg));

  return (
    <div className="animate-fade-up space-y-6">
      <SectionHeader
        eyebrow="Cockpit DRH · M13"
        title="Bonjour Valentina"
        description="Vue d'intelligence en temps réel — masse salariale projetée, équité surveillée, climat social et signaux de rétention orientés soin."
        action={
          <>
            <Link to="/cockpit-360">
              <Button variant="outline" size="sm">
                <ArrowUpRight size={14} /> Vue 360°
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              Exporter
            </Button>
            <Link to="/whatif">
              <Button size="sm">
                <Sparkles size={14} /> Simulation what-if
              </Button>
            </Link>
          </>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Effectif" value={String(EMPLOYEES.length)} unit="collab." delta={7} icon={Users} />
        <StatCard
          label="Masse salariale"
          value={`${costMillions.toFixed(1)} M`}
          unit="XOF/mois"
          delta={3}
          icon={Banknote}
          mono
          tone="amber"
        />
        <StatCard label="Climat social" value="78" unit="/100" delta={2} icon={HeartPulse} />
        <StatCard
          label="Attention rétention"
          value={String(attention.filter((e) => e.retentionAttention >= 55).length)}
          unit="à soigner"
          delta={-1}
          icon={ShieldAlert}
          tone="amber"
        />
      </div>

      {/* Masse salariale projetée + Assiduité */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Masse salariale projetée — 18 mois"
            subtitle="Coût employeur total (moteur déterministe · double vérification)"
            action={
              <div className="text-right">
                <p className="mono text-lg font-bold text-ink">{totals.employerCost.formatWithCurrency()}</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-ok">
                  <TrendingUp size={12} /> projection +3 %/mois
                </span>
              </div>
            }
          />
          <AreaTrend
            data={projection}
            xKey="label"
            height={250}
            formatter={(v) => `${v} M XOF`}
            series={[
              { key: 'reel', label: 'Réel', color: 'amber' },
              { key: 'projection', label: 'Projection', color: 'info' },
            ]}
          />
        </Card>

        <Card className="surface-night border-0" inset={false}>
          <div className="flex items-start justify-between p-5 pb-0">
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Assiduité</h3>
              <p className="mt-0.5 text-xs font-medium text-ink-400">6 dernières semaines</p>
            </div>
            <span className="rounded-xl bg-amber/15 p-1.5 text-amber-deep">
              <ArrowUpRight size={16} />
            </span>
          </div>
          <div className="flex items-center justify-between px-5 pt-4">
            <RadialGauge value={94} max={100} size={120} thickness={11} label="présence" centerValue="94%" />
            <div className="space-y-2 text-right">
              <div>
                <p className="mono text-2xl font-semibold text-ink">12,4</p>
                <p className="text-[11px] font-medium text-ink-400">jours congés moy.</p>
              </div>
              <div>
                <p className="mono text-2xl font-semibold text-amber-deep">3</p>
                <p className="text-[11px] font-medium text-ink-400">absences à valider</p>
              </div>
            </div>
          </div>
          <div className="px-5 pb-5 pt-5">
            <DotMatrix data={ATTENDANCE_MATRIX} cols={14} />
          </div>
        </Card>
      </div>

      {/* Composition + Climat + Équité */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Composition de l'effectif" subtitle="Par département" />
          <DonutChart segments={HEADCOUNT_BY_DEPT} size={170} centerTop={String(EMPLOYEES.length)} centerBottom="Effectif" />
        </Card>

        <Card>
          <CardHeader
            title="Climat social"
            subtitle="Écoute continue · Ollama local"
            action={<StatusPill tone="ok">+5 pts</StatusPill>}
          />
          <div className="mb-2 flex items-end gap-2">
            <span className="mono text-4xl font-bold text-ink">78</span>
            <span className="pb-1 text-sm font-semibold text-ink-400">/ 100</span>
          </div>
          <AreaTrend
            data={CLIMATE_TREND}
            height={140}
            series={[{ key: 'value', label: 'Indice', color: 'ok' }]}
          />
        </Card>

        <Card>
          <CardHeader
            title="Équité salariale"
            subtitle="Surveillance continue des écarts"
            action={<Scale size={16} className="text-ink-400" />}
          />
          <div className="space-y-3.5">
            {equity.map((e) => (
              <div key={e.dept}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink-700">{e.dept}</span>
                  <span className="mono font-semibold text-ink-500">
                    {Money.of(Math.round(e.avg), TENANT_CURRENCY).format()}
                  </span>
                </div>
                <ProgressBar value={e.avg} max={maxAvg} tone="amber" />
              </div>
            ))}
            <p className="pt-1 text-[11px] font-medium text-ink-400">
              Aucun écart H/F significatif détecté ce mois-ci.
            </p>
          </div>
        </Card>
      </div>

      {/* Signaux de rétention (orientés soin) */}
      <Card>
        <CardHeader
          title="Signaux de rétention — orientés soin"
          subtitle="Prédiction éthique : anticiper pour accompagner, jamais pour sanctionner"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/25 bg-ok/[0.08] px-3 py-1 text-[11px] font-bold text-ok">
              <Sparkles size={12} /> Agrégé · anonymisable
            </span>
          }
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {attention.map((e) => {
            const tone = e.retentionAttention >= 70 ? 'danger' : e.retentionAttention >= 55 ? 'warn' : 'info';
            return (
              <div
                key={e.id}
                className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface2 p-3.5 card-hover"
              >
                <Avatar name={employeeName(e)} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-ink">{employeeName(e)}</p>
                    <span className="mono shrink-0 text-xs font-bold text-ink-500">{e.retentionAttention}/100</span>
                  </div>
                  <p className="truncate text-[11px] font-medium text-ink-400">{e.role} · {e.department}</p>
                  <div className="mt-1.5">
                    <ProgressBar value={e.retentionAttention} tone={tone} />
                  </div>
                  <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold text-amber-deep">
                    <Sparkles size={12} className="mt-0.5 shrink-0" /> {careAction(e)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
