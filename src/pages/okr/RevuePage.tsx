import { ClipboardCheck, Star } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { OkrSubNav } from '../../components/okr/OkrSubNav';
import { useM7Data } from '../../lib/m7/dataLive';
import { LEVEL_META, SCORING_GRID } from '../../lib/m7/referentiels';

export function RevuePage() {
  const m7 = useM7Data();
  const { toast } = useToast();
  const lastClosed = m7.cycles.find((c) => c.status === 'closed');
  const closedObjectives = lastClosed ? m7.objectives.filter((o) => o.cycleId === lastClosed.id) : [];
  const cycleProgress = (new Date('2026-05-31').getTime() - new Date(m7.activeCycle.startDate).getTime()) / (new Date(m7.activeCycle.endDate).getTime() - new Date(m7.activeCycle.startDate).getTime());
  const reviewDue = new Date(m7.activeCycle.endDate) > new Date('2026-05-31') && cycleProgress > 0.85;

  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Revue de cycle</h1>
          <p className="text-sm font-medium text-ink-500">Rétrospective · scoring 0.0-1.0 · carry-over · décisions next cycle</p>
        </div>
        <Button size="sm" disabled={!reviewDue} onClick={() => toast({ variant: 'success', title: 'Revue lancée', description: `Préparation revue ${m7.activeCycle.label}` })}><ClipboardCheck size={14} /> Lancer la revue {m7.activeCycle.label}</Button>
      </div>

      <Card className={reviewDue ? 'border-amber/40' : ''}>
        <CardHeader title={`Cycle actif · ${m7.activeCycle.label}`} subtitle={`${Math.round(cycleProgress * 100)} % du cycle écoulé · revue prévue ${m7.activeCycle.reviewDate ?? '—'}`} />
        <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]">
          <div className="h-full rounded-full bg-amber" style={{ width: `${Math.round(cycleProgress * 100)}%` }} />
        </div>
        <p className="mt-2 text-[11px] font-medium text-ink-500">{reviewDue ? '⚠ La revue de fin de cycle approche — préparez les rétrospectifs.' : 'La revue sera disponible à 85 % du cycle.'}</p>
      </Card>

      <Card>
        <CardHeader title="Échelle de scoring" subtitle="Méthodologie Doerr — atteinte 0.7 = excellent" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SCORING_GRID.map((g) => (
            <div key={g.range} className={`rounded-xl border p-3 ${g.tone === 'ok' ? 'border-ok/30 bg-ok/[0.05]' : g.tone === 'amber' ? 'border-amber/30 bg-amber/[0.05]' : 'border-danger/30 bg-danger/[0.05]'}`}>
              <p className="mono text-[11px] font-bold text-amber-deep">{g.range}</p>
              <p className="mt-0.5 text-[12px] font-bold text-ink">{g.label}</p>
              <p className="mt-0.5 text-[10px] font-medium text-ink-500">{g.hint}</p>
            </div>
          ))}
        </div>
      </Card>

      {lastClosed && (
        <Card>
          <CardHeader title={`Rétrospectif · ${lastClosed.label}`} subtitle={`${closedObjectives.length} OKRs · score moyen ${closedObjectives.length ? (closedObjectives.reduce((s,o) => s + (o.finalScore ?? o.progress), 0) / closedObjectives.length).toFixed(2) : '—'}`} />
          <table className="w-full text-sm">
            <thead><tr className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="py-1 text-left">Objectif</th>
              <th className="py-1 text-left">Niveau</th>
              <th className="py-1 text-right">Score</th>
              <th className="py-1 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {closedObjectives.length === 0 ? (
                <tr><td colSpan={4} className="py-2 text-center text-[12px] text-ink-400">Pas de rétrospectif disponible.</td></tr>
              ) : closedObjectives.map((o) => (
                <tr key={o.id}>
                  <td className="py-1.5 text-[12px] font-semibold text-ink truncate max-w-[420px]">{o.title}</td>
                  <td className="py-1.5"><StatusPill tone={LEVEL_META[o.level].tone === 'amber' ? 'amber' : LEVEL_META[o.level].tone === 'info' ? 'info' : LEVEL_META[o.level].tone === 'ok' ? 'ok' : 'neutral'} dot={false}>{LEVEL_META[o.level].label}</StatusPill></td>
                  <td className="py-1.5 mono text-right text-[11px] font-bold text-amber-deep">{(o.finalScore ?? o.progress).toFixed(2)}</td>
                  <td className="py-1.5 text-center"><StatusPill tone={o.status === 'completed' ? 'ok' : 'amber'} dot={false}>{o.status}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card>
        <CardHeader title="Checklist de revue de cycle" action={<Star size={16} className="text-amber-deep" />} />
        <ul className="space-y-1.5">
          {[
            '✅ Scorer chaque OKR (0.0-1.0) en commission',
            '🗒️ Rétrospective : qu\'est-ce qui a marché / pas marché ?',
            '🔄 Carry-over : OKRs reportés au cycle suivant ?',
            '🎯 Lessons learned partagées all-hands',
            '🚀 Définir top-down les OKRs entreprise du prochain cycle',
            '🤝 Cascade : aligner Département → Équipe → Individuel sous 2 semaines',
            '📊 Reporting bilan envoyé au comité de direction',
          ].map((l) => <li key={l} className="rounded-lg bg-surface2/40 px-3 py-1.5 text-[12px] font-medium text-ink-700">{l}</li>)}
        </ul>
      </Card>
    </div>
  );
}
