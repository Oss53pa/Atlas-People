import { useMemo, useState } from 'react';
import { MessageSquare, Plus, TrendingUp, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { OkrSubNav } from '../../components/okr/OkrSubNav';
import { useM7Data } from '../../lib/m7/dataLive';
import { useSubmitCheckIn, isBackendConfigured } from '../../lib/m7/supabaseLive';
import { CONFIDENCE_META, LEVEL_META } from '../../lib/m7/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

export function CheckInsPage() {
  const m7 = useM7Data();
  const { toast } = useToast();
  const submitCheckIn = useSubmitCheckIn();
  const [week, setWeek] = useState<'all' | string>('2026-W21');
  const [showForm, setShowForm] = useState(false);
  const [selectedObjId, setSelectedObjId] = useState('');
  const [selectedKrId, setSelectedKrId] = useState('');
  const [reportedValue, setReportedValue] = useState('');
  const [confidence, setConfidence] = useState(7);
  const [blockers, setBlockers] = useState('');
  const [nextStep, setNextStep] = useState('');

  const weeks = Array.from(new Set(m7.checkins.map((c) => c.weekOf))).sort();
  const list = useMemo(() => m7.checkins.filter((c) => week === 'all' || c.weekOf === week).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)), [week, m7]);

  const activeObjs = m7.objectives.filter((o) => o.cycleId === m7.activeCycle.id);
  const krsForObj = selectedObjId ? m7.krsByObjective(selectedObjId) : [];

  const handleSubmit = async () => {
    if (!isBackendConfigured) {
      setShowForm(false);
      toast({ variant: 'success', title: 'Check-in soumis', description: 'Mode démo — aucune persistance.' });
      return;
    }
    if (!selectedKrId || reportedValue === '') {
      toast({ variant: 'error', title: 'Champs requis', description: 'Sélectionnez un Key Result et saisissez la valeur reportée.' });
      return;
    }
    try {
      await submitCheckIn.mutateAsync({
        keyResultId: selectedKrId,
        reportedValue: Number(reportedValue),
        confidence,
        blockers: blockers.trim() || undefined,
        nextStep: nextStep.trim() || undefined,
      });
      setShowForm(false);
      setSelectedObjId('');
      setSelectedKrId('');
      setReportedValue('');
      setBlockers('');
      setNextStep('');
      setConfidence(7);
      toast({ variant: 'success', title: 'Check-in soumis', description: `Valeur reportée · confiance ${confidence}/10 · audit SHA-256` });
    } catch (e) {
      toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
    }
  };

  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Check-ins</h1>
          <p className="text-sm font-medium text-ink-500">Mises à jour hebdomadaires · confidence · highlights / blockers</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}><Plus size={14} /> {showForm ? 'Annuler' : 'Soumettre check-in'}</Button>
      </div>

      {showForm && (
        <Card className="border-amber/40">
          <CardHeader
            title="Soumettre un check-in"
            subtitle="Mise à jour hebdomadaire · confiance 1-10 · audit SHA-256"
            action={isBackendConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span> : undefined}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Objectif</label>
              <select
                value={selectedObjId}
                onChange={(e) => { setSelectedObjId(e.target.value); setSelectedKrId(''); }}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none"
              >
                <option value="">— choisir —</option>
                {activeObjs.map((o) => <option key={o.id} value={o.id}>{o.ref} · {o.title.slice(0, 50)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Key Result</label>
              <select
                value={selectedKrId}
                onChange={(e) => setSelectedKrId(e.target.value)}
                disabled={!selectedObjId}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none disabled:opacity-50"
              >
                <option value="">— choisir —</option>
                {krsForObj.map((k) => <option key={k.id} value={k.id}>{k.ref} · {k.title.slice(0, 45)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Valeur reportée</label>
              <input
                type="number"
                value={reportedValue}
                onChange={(e) => setReportedValue(e.target.value)}
                placeholder="ex. 75"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Confiance (1-10)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={1} max={10} value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="flex-1 accent-amber-deep"
                />
                <span className={cn('mono w-8 shrink-0 text-center text-sm font-bold', confidence >= 7 ? 'text-ok' : confidence >= 4 ? 'text-amber-deep' : 'text-danger')}>
                  {confidence}
                </span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Blockers (optionnel)</label>
              <input
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="Dépendance, risque…"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Prochaine action (optionnel)</label>
              <input
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                placeholder="Ce que je fais cette semaine…"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={submitCheckIn.isPending || (isBackendConfigured ? (!selectedKrId || reportedValue === '') : false)}
              onClick={handleSubmit}
            >
              {submitCheckIn.isPending ? 'Envoi…' : 'Soumettre le check-in'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Check-ins cycle" value={String(m7.checkins.length)} unit="cumul" icon={MessageSquare} />
        <StatCard label="Cette semaine (W21)" value={String(m7.checkins.filter(c=>c.weekOf==='2026-W21').length)} unit="soumis" icon={MessageSquare} />
        <StatCard label="On track" value={String(m7.checkins.filter(c=>c.confidence==='green').length)} unit="green" icon={TrendingUp} />
        <StatCard label="Avec blocker" value={String(m7.checkins.filter(c=>c.blockers).length)} unit="à débloquer" icon={MessageSquare} tone="amber" />
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1 w-fit text-[12px] font-semibold">
        <button onClick={() => setWeek('all')} className={cn('rounded-md px-3 py-1', week === 'all' ? 'bg-amber/12 text-amber-deep' : 'text-ink-500')}>Toutes</button>
        {weeks.reverse().map((w) => (
          <button key={w} onClick={() => setWeek(w)} className={cn('mono rounded-md px-3 py-1', week === w ? 'bg-amber/12 text-amber-deep' : 'text-ink-500')}>{w}</button>
        ))}
      </div>

      <div className="space-y-2">
        {list.map((c) => {
          const o = m7.objectiveById(c.objectiveId);
          const author = employeeById(c.authorEmployeeId);
          const conf = CONFIDENCE_META[c.confidence];
          if (!o) return null;
          return (
            <Card key={c.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {author && <Avatar name={employeeName(author)} size="sm" />}
                  <div>
                    <p className="text-[13px] font-bold text-ink">{o.title}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-ink-500">{author ? employeeName(author) : '—'} · <span className="mono">{c.weekOf}</span> · {c.submittedAt} · <span className="rounded-md bg-amber/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-deep">{LEVEL_META[o.level].label}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">+{Math.round(c.progressDelta * 100)} pts</span>
                  <StatusPill tone={conf.tone} dot={false}>{conf.label}</StatusPill>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <p className="rounded-lg bg-ok/[0.06] px-3 py-1.5 text-[12px] font-medium text-ink-700"><b>Highlights :</b> {c.highlights}</p>
                {c.blockers && <p className="rounded-lg bg-warn/[0.06] px-3 py-1.5 text-[12px] font-medium text-ink-700"><b>Blockers :</b> {c.blockers}</p>}
                {c.nextSteps && <p className="rounded-lg bg-info/[0.06] px-3 py-1.5 text-[12px] font-medium text-ink-700"><b>Prochaines actions :</b> {c.nextSteps}</p>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
