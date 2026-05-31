import { useParams, Link } from 'react-router-dom';
import { Star, CheckCircle2, FileSignature, MessageSquare, TrendingUp, Eye, Grid3x3 } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { EvalSubNav } from '../../components/eval/EvalSubNav';
import { evaluationByEmployee, feedbacksByEval, devPlanByEmployee, boxOfEmployee } from '../../lib/m8/mock';
import { STATUS_META, BOX_LABELS, EVAL_WIZARD_STEPS, DEV_CATEGORIES } from '../../lib/m8/referentiels';
import { employeeById, employeeName, matricule } from '../../data/mock';
import { cn } from '../../lib/cn';

export function EvaluationDetailPage() {
  const { employeeId = '' } = useParams();
  const emp = employeeById(employeeId);
  const ev = evaluationByEmployee(employeeId);
  const { toast } = useToast();

  if (!emp || !ev) {
    return (
      <div className="animate-fade-up space-y-4">
        <EvalSubNav />
        <Card><p className="py-10 text-center text-sm font-medium text-ink-400">Évaluation introuvable.</p></Card>
      </div>
    );
  }
  const mgr = employeeById(ev.managerEmployeeId);
  const fb = feedbacksByEval(ev.id);
  const box = boxOfEmployee(emp.id);
  const dp = devPlanByEmployee(emp.id);
  const sm = STATUS_META[ev.status];

  return (
    <div className="animate-fade-up space-y-4">
      <EvalSubNav />
      <Link to="/evaluations/liste" className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber-deep hover:underline">← Toutes les évaluations</Link>

      <Card className="glass-amber">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar name={employeeName(emp)} size="lg" />
            <div>
              <h1 className="text-xl font-bold text-ink">{employeeName(emp)}</h1>
              <p className="mono mt-0.5 text-[11px] font-medium text-amber-deep">{matricule(emp)} · {ev.ref}</p>
              <p className="mt-1 text-[13px] font-semibold text-ink-700">{emp.role} · {emp.department}</p>
              <p className="mt-0.5 text-[11px] font-medium text-ink-500">Manager · {mgr ? employeeName(mgr) : '—'}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <StatusPill tone={sm.tone} dot>{sm.label}</StatusPill>
                {ev.overallScore && <span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">Score {ev.overallScore.toFixed(1)}/5</span>}
                {box && <span className="mono rounded-md bg-info/10 px-2 py-0.5 text-[11px] font-bold text-info">9-box {box.box}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!ev.signedAt && <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Signature ADVIST', description: 'Signature envoyée au collaborateur' })}><FileSignature size={14} /> Signer</Button>}
          </div>
        </div>
      </Card>

      {/* Workflow */}
      <Card>
        <CardHeader title="Workflow d'évaluation" subtitle={`7 étapes · statut actuel : ${sm.label}`} />
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {EVAL_WIZARD_STEPS.map((s, i) => {
            const isDone =
              (i === 0 && !!ev.autoSubmittedAt) ||
              (i === 1 && !!ev.managerSubmittedAt) ||
              (i === 2 && fb.filter(f => f.role !== 'self' && f.role !== 'manager' && f.status === 'submitted').length > 0) ||
              (i === 3 && !!ev.calibrationApprovedAt) ||
              (i === 4 && !!ev.sharedAt) ||
              (i === 5 && !!ev.signedAt) ||
              (i === 6 && !!dp);
            return (
              <li key={s} className={cn('rounded-xl border px-3 py-2', isDone ? 'border-ok/40 bg-ok/[0.05]' : 'border-line bg-surface2/40')}>
                <div className="flex items-center gap-1.5">
                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold', isDone ? 'bg-ok/20 text-ok' : 'bg-ink/[0.06] text-ink-400')}>{isDone ? <CheckCircle2 size={11} /> : i + 1}</span>
                  <p className="text-[11px] font-bold text-ink">{s}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      {/* Scores par dimension */}
      <Card>
        <CardHeader title="Scores par dimension" subtitle="Auto-éval / Manager / Final pondéré" action={<TrendingUp size={16} className="text-amber-deep" />} />
        <table className="w-full text-sm">
          <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            <th className="px-3 py-2 text-left">Dimension</th>
            <th className="px-3 py-2 text-right">Poids</th>
            <th className="px-3 py-2 text-right">Auto</th>
            <th className="px-3 py-2 text-right">Manager</th>
            <th className="px-3 py-2 text-right">Final</th>
          </tr></thead>
          <tbody className="divide-y divide-line">
            {ev.scores.map((s, i) => (
              <tr key={i}>
                <td className="px-3 py-2 text-[12px] font-semibold text-ink">{s.dimension}</td>
                <td className="px-3 py-2 mono text-right text-[11px]">{s.weight}%</td>
                <td className="px-3 py-2 mono text-right text-[11px] text-ink-700">{s.autoScore?.toFixed(1) ?? '—'}</td>
                <td className="px-3 py-2 mono text-right text-[11px] text-ink-700">{s.managerScore?.toFixed(1) ?? '—'}</td>
                <td className="px-3 py-2 mono text-right text-[12px] font-bold text-amber-deep">{s.finalScore?.toFixed(1) ?? '—'}</td>
              </tr>
            ))}
            <tr className="bg-amber/[0.04]">
              <td colSpan={4} className="px-3 py-2 text-right text-[12px] font-bold text-ink">Score global pondéré</td>
              <td className="px-3 py-2 mono text-right text-[14px] font-bold text-amber-deep">{ev.overallScore?.toFixed(1) ?? '—'}/5</td>
            </tr>
          </tbody>
        </table>
      </Card>

      {/* Feedback 360 + 9-box */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title={`Feedback 360° (${fb.length} contributeurs)`} action={<Eye size={16} className="text-amber-deep" />} />
          <ul className="space-y-1">
            {fb.map((f) => {
              const participant = f.participantEmployeeId ? employeeById(f.participantEmployeeId) : null;
              return (
                <li key={f.id} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5 text-[12px]">
                  <div className="flex items-center gap-2">
                    {participant && <Avatar name={employeeName(participant)} size="xs" />}
                    <div>
                      <p className="font-semibold text-ink">{f.role === 'self' ? 'Auto-évaluation' : f.role === 'manager' ? 'Manager' : f.role === 'peer' ? 'Pair' : f.role === 'cross' ? 'Transverse' : 'Direct'}</p>
                      <p className="text-[10px] font-medium text-ink-500">{f.role === 'self' ? employeeName(emp) : participant ? employeeName(participant) : 'Anonyme'}</p>
                    </div>
                  </div>
                  <StatusPill tone={f.status === 'submitted' ? 'ok' : f.status === 'in_progress' ? 'amber' : f.status === 'declined' ? 'danger' : 'neutral'} dot={false}>{f.status}</StatusPill>
                </li>
              );
            })}
          </ul>
        </Card>

        {box && (
          <Card>
            <CardHeader title="Positionnement 9-box" subtitle="Performance × potentiel" action={<Grid3x3 size={16} className="text-amber-deep" />} />
            <div className="rounded-xl border border-line bg-surface2/40 p-4">
              <p className={cn('text-2xl font-bold',
                BOX_LABELS[box.box].tone === 'ok' ? 'text-ok' :
                BOX_LABELS[box.box].tone === 'amber' ? 'text-amber-deep' :
                BOX_LABELS[box.box].tone === 'warn' ? 'text-warn' :
                BOX_LABELS[box.box].tone === 'danger' ? 'text-danger' : 'text-info')}>
                {box.box} · {BOX_LABELS[box.box].label}
              </p>
              <p className="mt-2 text-[12px] font-medium text-ink-700">{BOX_LABELS[box.box].hint}</p>
              <p className="mt-2 text-[11px] font-medium text-ink-500">Performance · {box.performance} · Potentiel · {box.potential}</p>
              <p className="mt-2 text-[10px] font-medium text-ink-400">{box.rationale}</p>
            </div>
            <div className="mt-3"><Link to="/evaluations/talent-grid"><Button variant="outline" size="sm">Voir grille complète</Button></Link></div>
          </Card>
        )}
      </div>

      {/* Commentaires */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="Forces & axes" />
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ok">Forces</p>
          <p className="rounded-lg bg-ok/[0.06] px-3 py-2 text-[12px] font-medium text-ink-700">{ev.strengths}</p>
          <p className="mt-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-deep">Axes de développement</p>
          <p className="rounded-lg bg-amber/[0.06] px-3 py-2 text-[12px] font-medium text-ink-700">{ev.developmentAreas}</p>
        </Card>
        <Card>
          <CardHeader title="Commentaires" action={<MessageSquare size={16} className="text-ink-400" />} />
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-deep">Manager</p>
          <p className="rounded-lg bg-surface2/40 px-3 py-2 text-[12px] font-medium text-ink-700">{ev.managerComments}</p>
          <p className="mt-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-deep">Collaborateur</p>
          <p className="rounded-lg bg-surface2/40 px-3 py-2 text-[12px] font-medium text-ink-700">{ev.employeeComments}</p>
        </Card>
      </div>

      {/* Plan de développement */}
      {dp && (
        <Card>
          <CardHeader title="Plan de développement" subtitle={`${dp.actions.length} actions · revue ${dp.reviewDate}`} action={<Link to="/evaluations/plans-dev" className="text-[11px] font-semibold text-amber-deep hover:underline">Tous →</Link>} />
          <ul className="space-y-1.5">
            {dp.actions.map((a) => (
              <li key={a.id} className="rounded-xl bg-surface2/40 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold text-ink">{a.title}</p>
                  <StatusPill tone={a.status === 'completed' ? 'ok' : a.status === 'in_progress' ? 'amber' : 'neutral'} dot={false}>{a.status}</StatusPill>
                </div>
                <p className="mt-0.5 text-[10px] font-medium text-ink-500">{DEV_CATEGORIES[a.category].label} · échéance {a.deadline}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="flex items-start gap-1.5 text-[10px] font-medium text-ink-400">
        <Star size={11} className="mt-0.5 shrink-0 text-amber-deep" />
        Sources de l'évaluation : OKR M7 (35 %), compétences M9 (25 %), comportements/valeurs (20 %), leadership (10 %), culture (10 %). Signature ADVIST · audit chaîné SHA-256.
      </p>
    </div>
  );
}
