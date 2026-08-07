import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareHeart, ArrowUpRight, TrendingUp, Plus, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { useM6Data } from '../../lib/m6/dataLive';
import { useSubmitPulseFeedback, isBackendConfigured } from '../../lib/m6/supabaseLive';
import { PULSE_QUESTIONS } from '../../lib/m6/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

export function PulsePage() {
  const { toast } = useToast();
  const m6 = useM6Data();
  const submitPulse = useSubmitPulseFeedback();
  const [milestone, setMilestone] = useState<'J7' | 'J30' | 'J60' | 'J90'>('J90');
  const [showForm, setShowForm] = useState(false);
  const [formArrivantId, setFormArrivantId] = useState('');
  const [formScore, setFormScore] = useState<'happy' | 'neutral' | 'unhappy'>('happy');
  const [formComment, setFormComment] = useState('');

  const handleSubmitPulse = async () => {
    if (!isBackendConfigured) {
      setShowForm(false);
      toast({ variant: 'success', title: 'Pulse enregistré', description: 'Mode démo — aucune persistance.' });
      return;
    }
    if (!formArrivantId) {
      toast({ variant: 'error', title: 'Champ requis', description: 'Sélectionnez un arrivant.' });
      return;
    }
    try {
      await submitPulse.mutateAsync({ arrivantId: formArrivantId, jalonKind: milestone, score: formScore, comment: formComment.trim() || undefined });
      setShowForm(false);
      setFormArrivantId('');
      setFormComment('');
      setFormScore('happy');
      toast({ variant: 'success', title: 'Pulse soumis', description: `${milestone} · ${formScore} · audit SHA-256` });
    } catch (e) {
      toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
    }
  };

  const filtered = useMemo(() => m6.pulses.filter((p) => p.milestone === milestone), [milestone, m6]);
  const avgOverall = filtered.length ? filtered.reduce((s, p) => s + p.overallScore, 0) / filtered.length : 0;
  const npsScores = m6.pulses.filter(p => p.milestone === 'J90' && typeof p.npsScore === 'number').map(p => p.npsScore!);
  const avgNps = npsScores.length ? Math.round(npsScores.reduce((s, n) => s + n, 0) / npsScores.length) : 0;

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Pulse feedback</h1>
          <p className="text-sm font-medium text-ink-500">Surveys J+7 / J+30 / J+60 / J+90 · NPS final · suivi continu</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}><Plus size={14} /> {showForm ? 'Annuler' : 'Enregistrer un pulse'}</Button>
      </div>

      {showForm && (
        <Card className="border-amber/40">
          <CardHeader
            title="Enregistrer un pulse"
            subtitle={`Jalon ${milestone} · score happy / neutral / unhappy · audit SHA-256`}
            action={isBackendConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span> : undefined}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Arrivant (ID)</label>
              <input
                value={formArrivantId}
                onChange={(e) => setFormArrivantId(e.target.value)}
                placeholder="UUID arrivant…"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-mono text-ink focus:border-amber/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Score</label>
              <select value={formScore} onChange={(e) => setFormScore(e.target.value as typeof formScore)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                <option value="happy">😊 Happy</option>
                <option value="neutral">😐 Neutral</option>
                <option value="unhappy">😟 Unhappy</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Commentaire (optionnel)</label>
              <input
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder="Feedback libre…"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={submitPulse.isPending || (isBackendConfigured ? !formArrivantId : false)} onClick={handleSubmitPulse}>
              {submitPulse.isPending ? 'Envoi…' : 'Soumettre le pulse'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pulses collectés" value={String(m6.pulses.length)} unit="cumul" icon={MessageSquareHeart} />
        <StatCard label="Score moyen" value={`${avgOverall.toFixed(1)}/5`} unit={`milestone ${milestone}`} icon={TrendingUp} />
        <StatCard label="NPS J+90" value={String(avgNps)} unit="cible ≥ 50" icon={MessageSquareHeart} tone={avgNps >= 50 ? 'default' : 'amber'} />
        <StatCard label="Couverture" value={`${Math.round(m6.pulses.length / Math.max(1, m6.journeys.length * 4) * 100)} %`} unit="vs attendus" icon={MessageSquareHeart} />
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1 w-fit text-[12px] font-semibold">
        {(['J7', 'J30', 'J60', 'J90'] as const).map((m) => (
          <button key={m} onClick={() => setMilestone(m)}
            className={cn('rounded-md px-3 py-1', milestone === m ? 'bg-amber/12 text-amber-deep' : 'text-ink-500')}>
            {m}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader title={`Questions du pulse ${milestone}`} subtitle="Questions Likert 1-5" />
        <ul className="space-y-1">
          {PULSE_QUESTIONS[milestone].map((q, i) => (
            <li key={i} className="rounded-lg bg-surface2/40 px-3 py-1.5 text-[12px] font-medium text-ink-700">{i + 1}. {q}</li>
          ))}
        </ul>
      </Card>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title={`Retours ${milestone}`} subtitle={`${filtered.length} retours`} className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Soumis le</th>
              <th className="px-3 py-2 text-center">Score global</th>
              <th className="px-3 py-2 text-center">NPS</th>
              <th className="px-3 py-2 text-left">Commentaire</th>
              <th className="px-3 py-2 text-right" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {filtered.map((p) => {
                const j = m6.journeys.find((jj) => jj.id === p.journeyId);
                const emp = j && employeeById(j.employeeId);
                if (!emp) return null;
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar name={employeeName(emp)} size="xs" /><span className="text-[12px] font-semibold text-ink">{employeeName(emp)}</span></div></td>
                    <td className="px-3 py-2 mono text-[11px] font-medium text-ink-700">{p.submittedAt}</td>
                    <td className="px-3 py-2 mono text-center text-[12px] font-bold text-amber-deep">{p.overallScore.toFixed(1)}/5</td>
                    <td className="px-3 py-2 mono text-center text-[12px] font-bold">{p.npsScore ?? '—'}</td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-500 truncate max-w-[280px]">{p.freeText ?? '—'}</td>
                    <td className="px-3 py-2 text-right"><Link to={`/onboarding/arrivants/${emp.id}`}><Button variant="ghost" size="sm">Parcours <ArrowUpRight size={12} /></Button></Link></td>
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
