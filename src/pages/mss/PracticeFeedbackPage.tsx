import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Users, Lock, Target } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { PracticeSubNav } from '../../components/mss/PracticeSubNav';
import { useSurface } from '../../store/useSurface';
import { FEEDBACK_ASCENDING, FEEDBACK_DESCENDING, FEEDBACK_LATERAL, IMPROVEMENT_PLAN, frDate } from '../../lib/mss/practice';

const TABS = [
  { key: 'asc', label: 'Ascendant (N-1)' },
  { key: 'desc', label: 'Descendant (N+1)' },
  { key: 'lat', label: 'Latéral (pairs)' },
];

export function PracticeFeedbackPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);
  const [tab, setTab] = useState('asc');

  const a = FEEDBACK_ASCENDING;
  const maxAxis = 5;

  return (
    <div className="animate-fade-up space-y-5">
      <PracticeSubNav />
      <h1 className="text-2xl font-semibold text-ink">Feedback reçu sur ma posture</h1>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'asc' && (
        <Card>
          <CardHeader title="Ascendant — anonymisé" subtitle={`Note globale ${a.global}/5 · ${a.responses} réponses sur ${a.totalReports} N-1`} action={<ArrowUp size={16} className="text-ink-400" />} />
          <div className="space-y-2">
            {a.axes.map((ax) => (
              <div key={ax.label} className="flex items-center gap-3">
                <span className="w-44 shrink-0 text-[12px] font-medium text-ink-600">{ax.label}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface2"><div className={`h-full rounded-full ${ax.score < 3.6 ? 'bg-warn' : 'bg-info/70'}`} style={{ width: `${(ax.score / maxAxis) * 100}%` }} /></div>
                <span className="mono w-10 text-right text-[12px] font-semibold text-ink-700">{ax.score}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] font-semibold text-ink-500">Verbatims (anonymisés)</p>
          <ul className="mt-1 space-y-1.5 text-[13px] font-medium italic text-ink-700">
            {a.verbatims.map((v, i) => <li key={i} className="rounded-xl bg-surface2 px-3 py-2">« {v} »</li>)}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-ink-400"><Lock size={12} /> Anonymisé selon la politique tenant (seuil minimal de réponses pour affichage).</p>
        </Card>
      )}

      {tab === 'desc' && (
        <Card>
          <CardHeader title="Descendant — de mon N+1" subtitle={`Dernier feedback : ${frDate(FEEDBACK_DESCENDING.date)}`} action={<ArrowDown size={16} className="text-ink-400" />} />
          <p className="text-sm font-medium text-ink-700">Note efficacité managériale : <span className="mono font-semibold text-ink">{FEEDBACK_DESCENDING.score}/5</span></p>
          <p className="mt-2 rounded-xl bg-surface2 px-3 py-2 text-[13px] font-medium text-ink-700">{FEEDBACK_DESCENDING.summary}</p>
        </Card>
      )}

      {tab === 'lat' && (
        <Card>
          <CardHeader title="Latéral — pairs managers" subtitle={`${FEEDBACK_LATERAL.count} retours reçus`} action={<Users size={16} className="text-ink-400" />} />
          <p className="rounded-xl bg-surface2 px-3 py-2 text-[13px] font-medium text-ink-700">{FEEDBACK_LATERAL.summary}</p>
        </Card>
      )}

      <Card>
        <CardHeader title="Mon plan d’amélioration managériale" action={<Target size={16} className="text-ink-400" />} />
        <div className="space-y-2">
          {IMPROVEMENT_PLAN.map((p) => (
            <div key={p.id} className="rounded-xl bg-surface2 px-3 py-2.5">
              <p className="text-sm font-bold text-ink">{p.title}</p>
              <p className="mt-0.5 text-[13px] font-medium text-ink-700">{p.action}</p>
              <div className="mt-1"><StatusPill tone="info" dot={false}>Échéance : {p.deadline}</StatusPill></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
