import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Gauge, ClipboardList, MessageSquare, TrendingUp, Scale, Sparkles,
  ArrowUpRight, AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { EvalSubNav } from '../../components/eval/EvalSubNav';
import { M8LiveBanner } from '../../components/eval/M8LiveBanner';
import {
  EVALUATIONS, CYCLES, CALIBRATIONS, TALENT_BOXES, DEV_PLANS, activeCycle, kpis,
} from '../../lib/m8/mock';
import { STATUS_META, BOX_LABELS } from '../../lib/m8/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

export function CockpitEvalPage() {
  const k = useMemo(() => kpis(), []);
  const recent = [...EVALUATIONS].sort((a, b) => (b.managerSubmittedAt ?? '').localeCompare(a.managerSubmittedAt ?? '')).slice(0, 6);
  const upcomingCalibrations = CALIBRATIONS.filter((c) => c.status === 'planned').slice(0, 4);
  const topTalents = TALENT_BOXES.filter((t) => t.box === 'A3' || t.box === 'A2').slice(0, 5);
  const atRisk = EVALUATIONS.filter((e) => e.performanceRating === 'low').slice(0, 5);

  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <M8LiveBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Évaluations</h1>
          <p className="text-sm font-medium text-ink-500">Cycle <b className="text-amber-deep">{activeCycle.label}</b> · {activeCycle.startDate} → {activeCycle.endDate} · calibration {activeCycle.calibrationDate}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/evaluations/cycles"><Button variant="outline" size="sm">Cycles</Button></Link>
          <Link to="/evaluations/calibration"><Button size="sm"><Scale size={14} /> Calibration</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Cycles actifs" value={String(k.cyclesActifs)} unit="en cours" icon={Gauge} />
        <StatCard label="Évaluations" value={String(k.evaluationsActives)} unit={`${k.completionPct} % terminées`} icon={ClipboardList} />
        <StatCard label="Auto-éval soumises" value={`${k.autoEvalSubmittedPct} %`} unit="collaborateurs" icon={MessageSquare} />
        <StatCard label="Manager soumises" value={`${k.managerEvalSubmittedPct} %`} unit="encadrants" icon={MessageSquare} />
        <StatCard label="Score moyen" value={`${k.scoresMoyens.toFixed(1)}/5`} unit="cycle" icon={TrendingUp} mono />
        <StatCard label="Hauts potentiels" value={`${k.hautPotentielPct} %`} unit="9-box A1/A2/A3" icon={Sparkles} />
        <StatCard label="Bas performance" value={`${k.bas_perfPct} %`} unit="à surveiller" icon={AlertTriangle} tone={k.bas_perfPct > 10 ? 'amber' : 'default'} />
        <StatCard label="Plans dev actifs" value={String(k.plansDevActifs)} unit="en cours" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Évaluations en cours */}
        <Card inset={false}>
          <div className="flex items-center justify-between p-5 pb-2">
            <CardHeader title="Évaluations récentes" subtitle={`${EVALUATIONS.length} sur le cycle actif`} className="mb-0" />
            <Link to="/evaluations/liste" className="text-[12px] font-semibold text-amber-deep hover:underline">Toutes →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 text-left">Collaborateur</th>
                <th className="px-3 py-2 text-left">Manager</th>
                <th className="px-3 py-2 text-center">Statut</th>
                <th className="px-3 py-2 text-right">Score</th>
                <th className="px-3 py-2 text-right" />
              </tr></thead>
              <tbody className="divide-y divide-line">
                {recent.map((ev) => {
                  const emp = employeeById(ev.employeeId);
                  const mgr = employeeById(ev.managerEmployeeId);
                  const sm = STATUS_META[ev.status];
                  if (!emp) return null;
                  return (
                    <tr key={ev.id} className="hover:bg-amber/[0.03]">
                      <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar name={employeeName(emp)} size="xs" /><div><p className="text-[13px] font-semibold text-ink">{employeeName(emp)}</p><p className="text-[10px] font-medium text-ink-400">{emp.role}</p></div></div></td>
                      <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{mgr ? employeeName(mgr) : '—'}</td>
                      <td className="px-3 py-2 text-center"><StatusPill tone={sm.tone} dot={false}>{sm.label}</StatusPill></td>
                      <td className="px-3 py-2 text-right mono text-[12px] font-bold text-amber-deep">{ev.overallScore?.toFixed(1) ?? '—'}</td>
                      <td className="px-3 py-2 text-right"><Link to={`/evaluations/eval/${emp.id}`}><Button variant="ghost" size="sm">Détail <ArrowUpRight size={12} /></Button></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardHeader title="Calibrations à venir" subtitle="Commissions RH" action={<Scale size={16} className="text-amber-deep" />} />
            {upcomingCalibrations.map((c) => (
              <Link key={c.id} to="/evaluations/calibration" className="flex items-center gap-2 rounded-xl bg-surface2/40 px-3 py-2 hover:bg-amber/[0.06] mb-1.5">
                <span className="mono shrink-0 rounded-md bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">{c.scheduledAt}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-ink">{c.scopeLabel}</p>
                  <p className="truncate text-[10px] font-medium text-ink-500">{c.evaluationsCount} évaluations · {c.participantsEmployeeIds.length} participants</p>
                </div>
              </Link>
            ))}
          </Card>

          <Card>
            <CardHeader title="Top talents (A3 + A2)" subtitle="9-box · à fidéliser" action={<Link to="/evaluations/talent-grid" className="text-[11px] font-semibold text-amber-deep hover:underline">9-box →</Link>} />
            <div className="space-y-1.5">
              {topTalents.map((t) => {
                const emp = employeeById(t.employeeId);
                if (!emp) return null;
                const box = BOX_LABELS[t.box];
                return (
                  <Link key={t.evaluationId} to={`/evaluations/eval/${emp.id}`} className="flex items-center gap-2 rounded-xl bg-surface2/40 px-3 py-2 hover:bg-amber/[0.06]">
                    <Avatar name={employeeName(emp)} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-ink">{employeeName(emp)}</p>
                      <p className="truncate text-[10px] font-medium text-ink-500">{box.label}</p>
                    </div>
                    <span className={cn('mono shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold',
                      box.tone === 'ok' ? 'bg-ok/15 text-ok' : box.tone === 'amber' ? 'bg-amber/15 text-amber-deep' : 'bg-info/15 text-info')}>{t.box}</span>
                  </Link>
                );
              })}
              {topTalents.length === 0 && <p className="text-center text-[12px] text-ink-400 py-2">Aucun top talent positionné.</p>}
            </div>
          </Card>

          {atRisk.length > 0 && (
            <Card className="border-warn/25">
              <CardHeader title="Bas performance" subtitle="Plan d'amélioration requis" action={<AlertTriangle size={16} className="text-warn" />} />
              <div className="space-y-1">
                {atRisk.map((ev) => {
                  const emp = employeeById(ev.employeeId)!;
                  return (
                    <div key={ev.id} className="flex items-center justify-between rounded-lg bg-warn/[0.05] px-3 py-1.5 text-[12px]">
                      <span className="font-medium text-ink-700">{employeeName(emp)}</span>
                      <span className="mono text-[11px] font-bold text-warn">{ev.overallScore?.toFixed(1)}/5</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader title="Plans de développement" subtitle={`${DEV_PLANS.length} plans actifs · suite directe des évaluations`} action={<Link to="/evaluations/plans-dev" className="text-[11px] font-semibold text-amber-deep hover:underline">Tous →</Link>} />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {DEV_PLANS.slice(0, 6).map((p) => {
            const emp = employeeById(p.employeeId)!;
            const inProgress = p.actions.filter((a) => a.status === 'in_progress').length;
            const total = p.actions.length;
            return (
              <div key={p.id} className="rounded-xl border border-line bg-surface2/40 p-3">
                <p className="text-[13px] font-bold text-ink">{employeeName(emp)}</p>
                <p className="mt-0.5 text-[10px] font-medium text-ink-500">{emp.role} · {total} actions · {inProgress} en cours</p>
                <p className="mt-1 text-[11px] font-medium text-ink-700">→ {p.actions[0]?.title}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-[11px] font-medium text-ink-400">M8 Évaluations · {CYCLES.length} cycles · {EVALUATIONS.length} évaluations · {CALIBRATIONS.length} commissions · 9-box performance × potentiel · plans dev liés OKR (M7) / compétences (M9) / formations (M11).</p>
    </div>
  );
}
