import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Target, Building2, MessageSquare, GitBranch, TrendingUp, AlertTriangle,
  Sparkles, CalendarRange,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { OkrSubNav } from '../../components/okr/OkrSubNav';
import {
  OBJECTIVES, KEY_RESULTS, CHECKINS, OKR_CYCLES, activeCycle, kpis, krsByObjective,
} from '../../lib/m7/mock';
import { LEVEL_META, CONFIDENCE_META } from '../../lib/m7/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

export function CockpitOkrPage() {
  const k = useMemo(() => kpis(), []);
  const companyOkrs = OBJECTIVES.filter((o) => o.level === 'company' && o.cycleId === activeCycle.id);
  const recentCheckIns = [...CHECKINS].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 6);
  const atRisk = OBJECTIVES.filter((o) => o.confidence !== 'green' && o.status === 'active');

  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Objectifs (OKR)</h1>
          <p className="text-sm font-medium text-ink-500">Cycle actif <b className="text-amber-deep">{activeCycle.label}</b> · {activeCycle.startDate} → {activeCycle.endDate} · cadence {activeCycle.checkInCadence}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/objectifs/cycles"><Button variant="outline" size="sm"><CalendarRange size={14} /> Cycles</Button></Link>
          <Link to="/objectifs/entreprise"><Button size="sm"><Building2 size={14} /> Vue entreprise</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Cycles actifs" value={String(k.cyclesActifs)} unit="trimestres" icon={CalendarRange} />
        <StatCard label="Objectifs actifs" value={String(k.objectifsActifs)} unit="tous niveaux" icon={Target} />
        <StatCard label="Key Results" value={String(k.krsActifs)} unit="suivis" icon={Target} />
        <StatCard label="Progression moyenne" value={`${Math.round(k.progressionMoyenne * 100)} %`} unit="cycle Q2" icon={TrendingUp} />
        <StatCard label="On track (green)" value={`${k.confidenceGreenPct} %`} unit="confidence" icon={Sparkles} tone={k.confidenceGreenPct >= 60 ? 'default' : 'amber'} />
        <StatCard label="Check-ins en retard" value={String(k.checkInsEnRetard)} unit="cette sem." icon={MessageSquare} tone={k.checkInsEnRetard ? 'amber' : 'default'} />
        <StatCard label="Alignement cascade" value={`${k.alignementCoveragePct} %`} unit="liés à parent" icon={GitBranch} />
        <StatCard label="Score moyen clôture" value={k.scoreMoyenCloture.toFixed(2)} unit="cycle précédent" icon={TrendingUp} mono />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Objectifs entreprise */}
        <Card inset={false}>
          <div className="flex items-center justify-between p-5 pb-2">
            <CardHeader title="Objectifs entreprise" subtitle={`${companyOkrs.length} OKR top-down · cliquer pour cascade`} className="mb-0" />
            <Link to="/objectifs/alignement" className="text-[12px] font-semibold text-amber-deep hover:underline">Cascade →</Link>
          </div>
          <div className="space-y-2 px-5 pb-5">
            {companyOkrs.map((o) => {
              const owner = o.ownerEmployeeId ? employeeById(o.ownerEmployeeId) : null;
              const krs = krsByObjective(o.id);
              const conf = CONFIDENCE_META[o.confidence];
              return (
                <div key={o.id} className="rounded-xl border border-line bg-surface2/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="mono text-[10px] font-bold text-amber-deep">{o.ref} · {LEVEL_META[o.level].label}</p>
                      <p className="mt-0.5 text-[13px] font-bold text-ink">{o.title}</p>
                      {owner && <p className="mt-0.5 text-[11px] font-medium text-ink-500">Owner : {employeeName(owner)}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill tone={conf.tone} dot>{conf.label}</StatusPill>
                      <span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">{Math.round(o.progress * 100)} %</span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                    <div className="h-full rounded-full bg-amber" style={{ width: `${Math.round(o.progress * 100)}%` }} />
                  </div>
                  <p className="mt-1.5 text-[10px] font-medium text-ink-400">{krs.length} Key Results · {krs.filter((kr) => kr.confidence === 'green').length} on track</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Check-ins + à risque */}
        <div className="space-y-3">
          <Card>
            <CardHeader title="Check-ins récents" subtitle="Dernières mises à jour" action={<MessageSquare size={16} className="text-amber-deep" />} />
            <div className="space-y-1.5">
              {recentCheckIns.map((c) => {
                const author = employeeById(c.authorEmployeeId);
                const o = OBJECTIVES.find((x) => x.id === c.objectiveId);
                const conf = CONFIDENCE_META[c.confidence];
                return (
                  <div key={c.id} className="rounded-lg bg-surface2/40 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12px] font-semibold text-ink">{o?.title.slice(0, 32)}</p>
                      <StatusPill tone={conf.tone} dot={false}>{conf.label}</StatusPill>
                    </div>
                    <p className="mt-0.5 text-[10px] font-medium text-ink-500">{author ? employeeName(author) : c.authorEmployeeId} · {c.weekOf} · +{Math.round(c.progressDelta * 100)} pts</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {atRisk.length > 0 && (
            <Card className="border-warn/25">
              <CardHeader title="OKRs à risque" subtitle={`${atRisk.length} confidence amber/red`} action={<AlertTriangle size={16} className="text-warn" />} />
              <div className="space-y-1">
                {atRisk.slice(0, 5).map((o) => {
                  const conf = CONFIDENCE_META[o.confidence];
                  return (
                    <div key={o.id} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5">
                      <p className="truncate text-[12px] font-medium text-ink-700">{o.title.slice(0, 38)}</p>
                      <StatusPill tone={conf.tone} dot={false}>{conf.label}</StatusPill>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Distribution par niveau */}
      <Card>
        <CardHeader title="Répartition par niveau" subtitle="Cascade Entreprise → Département → Équipe → Individuel" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['company','department','team','individual'] as const).map((lv) => {
            const items = OBJECTIVES.filter((o) => o.level === lv && o.cycleId === activeCycle.id);
            const meta = LEVEL_META[lv];
            const avgProg = items.length ? items.reduce((s, o) => s + o.progress, 0) / items.length : 0;
            return (
              <Link key={lv} to={`/objectifs/${lv === 'company' ? 'entreprise' : lv === 'department' ? 'departement' : lv === 'team' ? 'equipe' : 'individuel'}`}
                className="rounded-xl border border-line bg-surface2/40 p-3 hover:border-amber/40 hover:bg-amber/[0.04]">
                <p className={cn('text-[11px] font-bold uppercase tracking-wider', meta.tone === 'ok' ? 'text-ok' : meta.tone === 'amber' ? 'text-amber-deep' : meta.tone === 'info' ? 'text-info' : 'text-ink-500')}>{meta.label}</p>
                <p className="mono mt-0.5 text-2xl font-bold text-ink">{items.length}</p>
                <p className="text-[10px] font-medium text-ink-400">{Math.round(avgProg * 100)} % avg · cliquer →</p>
              </Link>
            );
          })}
        </div>
      </Card>

      <p className="text-[11px] font-medium text-ink-400">M7 OKR · méthodologie Doerr · cascade {OBJECTIVES.length} objectifs · {KEY_RESULTS.length} Key Results · {CHECKINS.length} check-ins · {OKR_CYCLES.length} cycles suivis · cible scoring 0.7 en clôture (atteinte excellente).</p>
    </div>
  );
}
