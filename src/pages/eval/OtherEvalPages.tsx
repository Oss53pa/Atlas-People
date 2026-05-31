/**
 * M8 Évaluations — pages secondaires (Cycles, Campagnes, Liste, 360, Calibration, PlansDev, OneOnOne, Reporting, Paramètres).
 * Pages compactes, format cohérent avec M7/M6.
 */
import { Link } from 'react-router-dom';
import {
  CalendarRange, Megaphone, ClipboardList, Eye, Scale, TrendingUp, MessageSquare,
  Settings, Plus, ArrowUpRight, Star, CheckCircle2, Clock,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { EvalSubNav } from '../../components/eval/EvalSubNav';
import {
  CYCLES, EVALUATIONS, CALIBRATIONS, FEEDBACK_360, DEV_PLANS, ONE_ON_ONES,
  activeCycle, kpis,
} from '../../lib/m8/mock';
import {
  STATUS_META, CYCLE_TYPE_META, BOX_LABELS, DEV_CATEGORIES, EVAL_DIMENSIONS,
  SCORE_SCALE, ATLAS_VALUES, CALIBRATION_DISTRIBUTION, SLA,
} from '../../lib/m8/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import { useMemo, useState } from 'react';
import { cn } from '../../lib/cn';

/* ─────────────────────────────────────── CYCLES */
export function CyclesEvalPage() {
  const { toast } = useToast();
  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Cycles d'évaluation</h1>
          <p className="text-sm font-medium text-ink-500">{CYCLES.length} cycles · annuel / mid-year / probatoire / 360°</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Cycle', description: 'Wizard nouveau cycle' })}><Plus size={14} /> Nouveau cycle</Button>
      </div>
      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Tous les cycles" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Réf.</th>
              <th className="px-3 py-2 text-left">Cycle</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Période</th>
              <th className="px-3 py-2 text-center">Participants</th>
              <th className="px-3 py-2 text-right">Complétion</th>
              <th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {CYCLES.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 mono text-[11px] font-bold text-amber-deep">{c.ref}</td>
                  <td className="px-3 py-2 text-[12px] font-semibold text-ink">{c.label}</td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{CYCLE_TYPE_META[c.type].label}</td>
                  <td className="px-3 py-2 mono text-[11px] text-ink-700">{c.startDate} → {c.endDate}</td>
                  <td className="px-3 py-2 mono text-center text-[12px] font-bold">{c.participantsCount}</td>
                  <td className="px-3 py-2 mono text-right text-[11px] font-bold text-amber-deep">{c.completionPct} %</td>
                  <td className="px-3 py-2 text-center"><StatusPill tone={c.status === 'in_progress' ? 'amber' : c.status === 'closed' ? 'neutral' : c.status === 'calibration' ? 'warn' : 'info'} dot={c.status === 'in_progress'}>{c.status}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <CardHeader title="Types de cycle disponibles" />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(CYCLE_TYPE_META).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[12px] font-bold text-ink">{v.label}</p>
              <p className="mt-0.5 text-[10px] font-medium text-ink-500">{v.hint}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────── CAMPAGNES */
export function CampagnesPage() {
  const { toast } = useToast();
  const k = kpis();
  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Campagnes d'évaluation</h1>
          <p className="text-sm font-medium text-ink-500">Lancement · suivi de complétion · relances · SLA auto-éval {SLA.autoEvalDays} j</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Campagne', description: 'Campagne envoyée à tous les collaborateurs' })}><Megaphone size={14} /> Lancer une campagne</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Cycle actif" value={activeCycle.label} unit={activeCycle.status} icon={CalendarRange} />
        <StatCard label="Participants" value={String(activeCycle.participantsCount)} unit="collaborateurs" icon={ClipboardList} />
        <StatCard label="Auto-éval soumises" value={`${k.autoEvalSubmittedPct} %`} unit={`SLA ${SLA.autoEvalDays} j`} icon={MessageSquare} />
        <StatCard label="Manager soumises" value={`${k.managerEvalSubmittedPct} %`} unit={`SLA ${SLA.managerEvalDays} j`} icon={MessageSquare} />
      </div>
      <Card>
        <CardHeader title="Calendrier de la campagne" subtitle={`Cycle ${activeCycle.label}`} />
        <ol className="space-y-1.5">
          {[
            { date: activeCycle.startDate, label: 'Lancement campagne · communication all-hands' },
            { date: activeCycle.autoEvalDeadline, label: `Deadline auto-évaluation (SLA ${SLA.autoEvalDays} j)` },
            { date: activeCycle.managerEvalDeadline, label: `Deadline évaluation manager (SLA ${SLA.managerEvalDays} j)` },
            { date: activeCycle.calibrationDate ?? '—', label: 'Commission de calibration' },
            { date: activeCycle.endDate, label: 'Restitution + signature collaborateur' },
          ].map((j, i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg bg-surface2/40 px-3 py-2">
              <span className="mono shrink-0 rounded-md bg-amber/15 px-2 py-0.5 text-[11px] font-bold text-amber-deep">{j.date}</span>
              <span className="text-[12px] font-semibold text-ink">{j.label}</span>
            </li>
          ))}
        </ol>
      </Card>
      <Card>
        <CardHeader title="Actions en masse" />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Relance', description: 'Relance envoyée aux retardataires' })}>Relancer auto-éval</Button>
          <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Rappel', description: 'Rappel envoyé aux managers' })}>Rappel managers</Button>
          <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'info', title: 'Export', description: 'Liste retardataires exportée' })}>Exporter retardataires</Button>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────── LISTE ÉVALUATIONS */
export function EvaluationsListPage() {
  const [q, setQ] = useState('');
  const [statF, setStatF] = useState<'all' | string>('all');
  const list = useMemo(() => EVALUATIONS.filter((ev) => {
    if (statF !== 'all' && ev.status !== statF) return false;
    const emp = employeeById(ev.employeeId);
    if (q && !`${emp ? employeeName(emp) : ''} ${ev.ref}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, statF]);

  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Toutes les évaluations</h1>
        <p className="text-sm font-medium text-ink-500">{EVALUATIONS.length} évaluations sur cycle actif</p>
      </div>
      <Card inset={false}>
        <div className="flex flex-wrap items-center gap-2 p-4 pb-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-60 rounded-lg border border-line bg-surface2 px-2 text-[13px] font-medium text-ink focus:border-amber/40 focus:outline-none" />
          <select value={statF} onChange={(e) => setStatF(e.target.value)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
            <option value="all">Tous statuts</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span className="text-[11px] font-semibold text-ink-400 ml-auto">{list.length} évaluations</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Réf.</th>
              <th className="px-3 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Manager</th>
              <th className="px-3 py-2 text-center">Statut</th>
              <th className="px-3 py-2 text-right">Score</th>
              <th className="px-3 py-2 text-center">9-box</th>
              <th className="px-3 py-2 text-right" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {list.map((ev) => {
                const emp = employeeById(ev.employeeId);
                const mgr = employeeById(ev.managerEmployeeId);
                if (!emp) return null;
                const sm = STATUS_META[ev.status];
                return (
                  <tr key={ev.id}>
                    <td className="px-4 py-2 mono text-[11px] font-bold text-amber-deep">{ev.ref}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={employeeName(emp)} size="xs" /><span className="text-[12px] font-semibold text-ink">{employeeName(emp)}</span></div></td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{mgr ? employeeName(mgr) : '—'}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={sm.tone} dot={false}>{sm.label}</StatusPill></td>
                    <td className="px-3 py-2 mono text-right text-[12px] font-bold text-amber-deep">{ev.overallScore?.toFixed(1) ?? '—'}</td>
                    <td className="px-3 py-2 text-center"><span className="mono text-[10px] font-bold text-info">{ev.performanceRating}</span></td>
                    <td className="px-3 py-2 text-right"><Link to={`/evaluations/eval/${emp.id}`}><Button variant="ghost" size="sm">Détail <ArrowUpRight size={12} /></Button></Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────── 360° */
export function Feedback360EvalPage() {
  const submitted = FEEDBACK_360.filter((f) => f.status === 'submitted').length;
  const invited = FEEDBACK_360.filter((f) => f.status === 'invited').length;
  const inProgress = FEEDBACK_360.filter((f) => f.status === 'in_progress').length;
  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Feedback 360° (cycle évaluation)</h1>
        <p className="text-sm font-medium text-ink-500">Multi-acteurs : self · manager · pairs · directs · transverses</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Feedbacks envoyés" value={String(FEEDBACK_360.length)} unit="contributeurs" icon={Eye} />
        <StatCard label="Soumis" value={String(submitted)} unit={`${Math.round((submitted/FEEDBACK_360.length)*100)} %`} icon={CheckCircle2} />
        <StatCard label="En cours" value={String(inProgress)} unit="à relancer" icon={Clock} tone="amber" />
        <StatCard label="Invités" value={String(invited)} unit="non démarré" icon={Eye} />
      </div>
      <Card>
        <CardHeader title="Méthodologie" />
        <ul className="space-y-1 text-[12px] font-medium text-ink-700">
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">• Self · auto-évaluation (1 par évaluation)</li>
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">• Manager · perspective hiérarchique directe</li>
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">• 2 pairs · anonymisés côté collaborateur</li>
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">• 1 transverse · vision cross-département (J+90 cycle annuel)</li>
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">• Si manager : 2 directs reports anonymisés en plus</li>
        </ul>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────── CALIBRATION */
export function CalibrationPage() {
  const { toast } = useToast();
  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Calibration · commissions RH</h1>
          <p className="text-sm font-medium text-ink-500">Sessions multi-managers · distribution recommandée · décisions consignées</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Commission', description: 'Nouvelle session de calibration' })}><Scale size={14} /> Programmer une commission</Button>
      </div>
      <Card>
        <CardHeader title="Distribution recommandée" subtitle="Cibles de calibration · cycle Q2 2026" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {CALIBRATION_DISTRIBUTION.map((d) => (
            <div key={d.label} className="rounded-xl border border-line bg-surface2/40 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">{d.label}</p>
              <p className="mono mt-1 text-lg font-bold text-ink">{d.target}</p>
            </div>
          ))}
        </div>
      </Card>
      <div className="space-y-3">
        {CALIBRATIONS.map((c) => {
          const fac = employeeById(c.facilitatorEmployeeId);
          return (
            <Card key={c.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="mono text-[11px] font-bold text-amber-deep">{c.ref}</p>
                  <p className="mt-0.5 text-[13px] font-bold text-ink">{c.scopeLabel}</p>
                  <p className="text-[11px] font-medium text-ink-500">Facilitateur : {fac ? employeeName(fac) : '—'} · {c.evaluationsCount} évaluations · {c.participantsEmployeeIds.length} participants</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">{c.scheduledAt}</span>
                  <StatusPill tone={c.status === 'closed' ? 'ok' : c.status === 'in_progress' ? 'amber' : 'info'} dot={c.status !== 'closed'}>{c.status}</StatusPill>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── PLANS DEV */
export function PlansDevPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Plans de développement</h1>
        <p className="text-sm font-medium text-ink-500">{DEV_PLANS.length} plans actifs · suite de l'évaluation · alimentent M9 compétences & M11 formation</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Plans actifs" value={String(DEV_PLANS.length)} unit="en cours" icon={TrendingUp} />
        <StatCard label="Actions cumulées" value={String(DEV_PLANS.reduce((s, p) => s + p.actions.length, 0))} unit="à réaliser" icon={CheckCircle2} />
        <StatCard label="Catégories disponibles" value={String(Object.keys(DEV_CATEGORIES).length)} unit="référentiel" icon={Settings} />
        <StatCard label="Échéance moyenne" value="2026-12" unit="fin d'année" icon={Clock} />
      </div>
      <div className="space-y-3">
        {DEV_PLANS.map((p) => {
          const emp = employeeById(p.employeeId)!;
          return (
            <Card key={p.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={employeeName(emp)} size="sm" />
                  <div>
                    <p className="text-[13px] font-bold text-ink">{employeeName(emp)}</p>
                    <p className="mono text-[10px] font-medium text-amber-deep">{p.ref} · {p.actions.length} actions · revue {p.reviewDate}</p>
                  </div>
                </div>
                <StatusPill tone={p.status === 'completed' ? 'ok' : p.status === 'in_progress' ? 'amber' : p.status === 'agreed' ? 'info' : 'neutral'} dot={p.status === 'in_progress'}>{p.status}</StatusPill>
              </div>
              <ul className="mt-2 space-y-1">
                {p.actions.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5">
                    <div>
                      <p className="text-[12px] font-semibold text-ink">{a.title}</p>
                      <p className="text-[10px] font-medium text-ink-500">{DEV_CATEGORIES[a.category].label} · échéance {a.deadline}</p>
                    </div>
                    <StatusPill tone={a.status === 'completed' ? 'ok' : a.status === 'in_progress' ? 'amber' : 'neutral'} dot={false}>{a.status}</StatusPill>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── 1-1 */
export function OneOnOnePage() {
  const planned = ONE_ON_ONES.filter((o) => o.status === 'planned');
  const completed = ONE_ON_ONES.filter((o) => o.status === 'completed');
  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Rituels 1-1</h1>
        <p className="text-sm font-medium text-ink-500">Manager ↔ collaborateur · cadence {SLA.oneOnOneDefaultCadence} · agenda type</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="1-1 planifiés" value={String(planned.length)} unit="à venir" icon={MessageSquare} />
        <StatCard label="1-1 terminés" value={String(completed.length)} unit="cycle" icon={CheckCircle2} />
        <StatCard label="Cadence par défaut" value="Bi-mensuel" unit="30 min" icon={Clock} />
        <StatCard label="Couverture" value="100 %" unit="managers" icon={Star} />
      </div>
      <Card>
        <CardHeader title="Agenda type 1-1" />
        <ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
          {['Météo & énergie · 5 min', 'Revue progrès · 10 min', 'Blockers & demandes · 5 min', 'Feedback bilatéral · 5 min', 'Plan de dev · 5 min'].map((a) => (
            <li key={a} className="rounded-lg bg-surface2/40 px-3 py-1.5 text-[12px] font-medium text-ink-700">{a}</li>
          ))}
        </ul>
      </Card>
      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Sessions 1-1" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Manager</th>
              <th className="px-3 py-2 text-left">Durée</th>
              <th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {ONE_ON_ONES.slice(0, 20).map((o) => {
                const emp = employeeById(o.employeeId)!;
                const mgr = employeeById(o.managerEmployeeId)!;
                return (
                  <tr key={o.id}>
                    <td className="px-4 py-2 mono text-[11px] font-medium text-ink-700">{o.scheduledAt.slice(0, 10)}</td>
                    <td className="px-3 py-2 text-[12px] font-semibold text-ink">{employeeName(emp)}</td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{employeeName(mgr)}</td>
                    <td className="px-3 py-2 text-[11px]">{o.durationMin} min</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={o.status === 'completed' ? 'ok' : o.status === 'planned' ? 'amber' : 'neutral'} dot={false}>{o.status}</StatusPill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────── REPORTING */
export function ReportingEvalPage() {
  const { toast } = useToast();
  const k = kpis();
  const dist = SCORE_SCALE.map((s) => ({
    ...s,
    count: EVALUATIONS.filter((ev) => ev.overallScore !== undefined && Math.round(ev.overallScore!) === s.value).length,
  }));
  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Reporting évaluations</h1>
          <p className="text-sm font-medium text-ink-500">Distribution · biais détectés · couverture · exports</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Export', description: 'Rapport trimestriel généré' })}>Export</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Score moyen" value={`${k.scoresMoyens.toFixed(1)}/5`} unit="global" icon={TrendingUp} />
        <StatCard label="Complétion" value={`${k.completionPct} %`} unit="terminées" icon={CheckCircle2} />
        <StatCard label="Hauts potentiels" value={`${k.hautPotentielPct} %`} unit="A1+A2+A3" icon={Star} />
        <StatCard label="Bas performance" value={`${k.bas_perfPct} %`} unit="C1+B1" icon={Clock} />
      </div>
      <Card>
        <CardHeader title="Distribution des scores" />
        <div className="space-y-1.5">
          {dist.map((d) => {
            const pct = Math.round((d.count / Math.max(1, EVALUATIONS.length)) * 100);
            return (
              <div key={d.value} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-wider text-ink-500">{d.value} · {d.label}</span>
                <div className="flex-1 h-6 overflow-hidden rounded-md bg-surface2"><div className={`h-full rounded-md ${d.tone === 'ok' ? 'bg-ok' : d.tone === 'amber' ? 'bg-amber' : d.tone === 'info' ? 'bg-info' : d.tone === 'warn' ? 'bg-warn' : 'bg-danger'}`} style={{ width: `${Math.max(5, pct)}%` }} /></div>
                <span className="mono w-10 shrink-0 text-right text-[11px] font-bold text-amber-deep">{d.count}</span>
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <CardHeader title="Répartition 9-box" />
        <div className="grid grid-cols-3 gap-2 max-w-md">
          {(Object.keys(BOX_LABELS) as Array<keyof typeof BOX_LABELS>).map((k) => {
            const meta = BOX_LABELS[k];
            const c = EVALUATIONS.filter((ev) => {
              const pot = ev.potentialRating;
              const perf = ev.performanceRating;
              const row = pot === 'high' || pot === 'top' ? 'A' : pot === 'core' ? 'B' : 'C';
              const col = perf === 'low' ? 1 : perf === 'meets' ? 2 : 3;
              return `${row}${col}` === k;
            }).length;
            return (
              <div key={k} className={cn('rounded-xl border p-2 text-center', meta.tone === 'ok' ? 'border-ok/30 bg-ok/[0.04]' : meta.tone === 'amber' ? 'border-amber/30 bg-amber/[0.04]' : meta.tone === 'danger' ? 'border-danger/30 bg-danger/[0.05]' : meta.tone === 'warn' ? 'border-warn/30 bg-warn/[0.05]' : 'border-line bg-surface2/30')}>
                <p className="mono text-[11px] font-bold text-ink-700">{k}</p>
                <p className="mono mt-0.5 text-lg font-bold text-amber-deep">{c}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────── PARAMÈTRES */
export function ParametresEvalPage() {
  const { toast } = useToast();
  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Paramètres Évaluations</h1>
        <p className="text-sm font-medium text-ink-500">Cycles · dimensions · échelles · 9-box · valeurs Atlas · SLA</p>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="Dimensions évaluées" subtitle="Somme des poids = 100 %" />
          <table className="w-full text-sm">
            <thead><tr className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="py-1 text-left">Dimension</th>
              <th className="py-1 text-right">Poids</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {EVAL_DIMENSIONS.map((d) => (
                <tr key={d.code}>
                  <td className="py-1.5 text-[12px] font-semibold text-ink">{d.label}<p className="text-[10px] text-ink-500">{d.hint}</p></td>
                  <td className="py-1.5 mono text-right text-[11px] font-bold text-amber-deep">{d.weight} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <CardHeader title="Échelle de notation" />
          <ul className="space-y-1">
            {SCORE_SCALE.map((s) => (
              <li key={s.value} className="flex items-center gap-2 rounded-lg bg-surface2/40 px-3 py-1.5 text-[12px]">
                <span className={`mono shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${s.tone === 'ok' ? 'bg-ok/15 text-ok' : s.tone === 'amber' ? 'bg-amber/15 text-amber-deep' : s.tone === 'warn' ? 'bg-warn/15 text-warn' : s.tone === 'danger' ? 'bg-danger/15 text-danger' : 'bg-info/15 text-info'}`}>{s.value}</span>
                <span className="flex-1 font-semibold text-ink">{s.label}</span>
                <span className="text-[10px] text-ink-500">{s.hint}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card>
        <CardHeader title="Valeurs Atlas (axes comportement)" />
        <div className="flex flex-wrap gap-1.5">
          {ATLAS_VALUES.map((v) => <span key={v} className="rounded-md bg-amber/12 px-2 py-1 text-[11px] font-semibold text-amber-deep">{v}</span>)}
        </div>
      </Card>
      <Card>
        <CardHeader title="SLA" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Mini label="Auto-éval" value={`${SLA.autoEvalDays} j`} />
          <Mini label="Manager" value={`${SLA.managerEvalDays} j`} />
          <Mini label="Restitution" value={`${SLA.shareWithinDays} j`} />
          <Mini label="Signature" value={`${SLA.signWithinDays} j`} />
        </div>
      </Card>
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Sauvegardé', description: 'Paramètres M8 enregistrés' })}><Settings size={14} /> Enregistrer</Button>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface2/40 p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mono mt-0.5 text-base font-bold text-amber-deep">{value}</p>
    </div>
  );
}
