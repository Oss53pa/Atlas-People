import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { EmptyState } from '../../components/ui/feedback';
import { useToast } from '../../components/ui/Toast';
import { DailySubNav } from '../../components/mss/DailySubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { schedulingConflicts } from '../../lib/mss/daily';

export function SchedulingConflictsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const conflicts = schedulingConflicts(team);

  const [choice, setChoice] = useState<Record<string, number>>({});
  const [comment, setComment] = useState<Record<string, string>>({});
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const arbitrate = (id: string) => {
    setResolved((s) => new Set(s).add(id));
    toast({ variant: 'success', title: 'Conflit arbitré', description: 'Décision enregistrée et tracée (ComplianceGuard). Les personnes concernées sont notifiées.' });
  };

  const open = conflicts.filter((c) => !resolved.has(c.id));

  return (
    <div className="animate-fade-up space-y-5">
      <DailySubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Conflits planning à arbitrer</h1>
        <StatusPill tone={open.length > 0 ? 'warn' : 'ok'} dot={false}>{open.length} conflit(s)</StatusPill>
      </div>

      {open.length === 0 ? (
        <Card><EmptyState icon={Check} title="Aucun conflit" description="Aucun conflit de planning détecté par ComplianceGuard." /></Card>
      ) : open.map((c) => (
        <Card key={c.id} className="border-warn/25">
          <p className="flex items-center gap-2 text-sm font-bold text-ink"><AlertTriangle size={15} className="text-warn" /> {c.title}</p>
          <div className="mt-2 space-y-1 text-[13px] font-medium text-ink-700">
            <p>{c.request}</p>
            <p className="text-warn">Conséquence : {c.consequence}</p>
            <p>Besoin : {c.need} · {c.available}</p>
          </div>
          <div className="mt-3 space-y-1.5">
            {c.options.map((o, i) => (
              <label key={i} className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
                <input type="radio" name={`conf-${c.id}`} checked={choice[c.id] === i} onChange={() => setChoice((s) => ({ ...s, [c.id]: i }))} className="accent-info" /> {o}
              </label>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="text-[12px] font-semibold text-ink-500">Commentaire</span>
            <textarea value={comment[c.id] ?? ''} onChange={(e) => setComment((s) => ({ ...s, [c.id]: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" placeholder="Justification de l’arbitrage…" />
          </label>
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={() => arbitrate(c.id)} disabled={choice[c.id] === undefined}>Arbitrer</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
