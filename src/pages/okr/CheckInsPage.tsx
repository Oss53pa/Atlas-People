import { useMemo, useState } from 'react';
import { MessageSquare, Plus, TrendingUp } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { OkrSubNav } from '../../components/okr/OkrSubNav';
import { CHECKINS, objectiveById } from '../../lib/m7/mock';
import { CONFIDENCE_META, LEVEL_META } from '../../lib/m7/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

export function CheckInsPage() {
  const { toast } = useToast();
  const [week, setWeek] = useState<'all' | string>('2026-W21');

  const weeks = Array.from(new Set(CHECKINS.map((c) => c.weekOf))).sort();
  const list = useMemo(() => CHECKINS.filter((c) => week === 'all' || c.weekOf === week).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)), [week]);

  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Check-ins</h1>
          <p className="text-sm font-medium text-ink-500">Mises à jour hebdomadaires · confidence · highlights / blockers</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Check-in', description: 'Formulaire ouvert' })}><Plus size={14} /> Soumettre check-in</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Check-ins cycle" value={String(CHECKINS.length)} unit="cumul" icon={MessageSquare} />
        <StatCard label="Cette semaine (W21)" value={String(CHECKINS.filter(c=>c.weekOf==='2026-W21').length)} unit="soumis" icon={MessageSquare} />
        <StatCard label="On track" value={String(CHECKINS.filter(c=>c.confidence==='green').length)} unit="green" icon={TrendingUp} />
        <StatCard label="Avec blocker" value={String(CHECKINS.filter(c=>c.blockers).length)} unit="à débloquer" icon={MessageSquare} tone="amber" />
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1 w-fit text-[12px] font-semibold">
        <button onClick={() => setWeek('all')} className={cn('rounded-md px-3 py-1', week === 'all' ? 'bg-amber/12 text-amber-deep' : 'text-ink-500')}>Toutes</button>
        {weeks.reverse().map((w) => (
          <button key={w} onClick={() => setWeek(w)} className={cn('mono rounded-md px-3 py-1', week === w ? 'bg-amber/12 text-amber-deep' : 'text-ink-500')}>{w}</button>
        ))}
      </div>

      <div className="space-y-2">
        {list.map((c) => {
          const o = objectiveById(c.objectiveId);
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
