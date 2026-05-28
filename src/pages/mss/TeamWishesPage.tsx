import { useEffect, useMemo } from 'react';
import { Sparkles, MessageSquare, GraduationCap, Lock } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { DevelopmentSubNav } from '../../components/mss/DevelopmentSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { memberWishes, type Wish } from '../../lib/mss/dev';
import { employeeName } from '../../data/mock';

const PRIO_TONE: Record<Wish['priority'], 'danger' | 'warn' | 'info'> = { haute: 'danger', moyenne: 'warn', basse: 'info' };

export function TeamWishesPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);

  const rows = team.map((e) => ({ e, wishes: memberWishes(e) })).filter((r) => r.wishes.length > 0);
  const all = rows.flatMap((r) => r.wishes);
  const themes = Object.entries(all.reduce<Record<string, number>>((acc, w) => { acc[w.theme] = (acc[w.theme] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);

  return (
    <div className="animate-fade-up space-y-5">
      <DevelopmentSubNav />
      <h1 className="text-2xl font-semibold text-ink">Souhaits de développement déclarés</h1>

      <Card>
        <CardHeader title="Top thèmes" subtitle={`${all.length} souhait(s) visibles · agrégation des déclarations N-1`} action={<Sparkles size={16} className="text-info" />} />
        <div className="space-y-1.5">
          {themes.slice(0, 5).map(([theme, n]) => (
            <div key={theme} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2 text-[12px] font-medium">
              <span className="font-semibold text-ink">{theme}</span>
              <span className="flex items-center gap-2 text-ink-500">{n} personne(s) <span className="text-info">· Proph3t : parcours collectif possible</span></span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Détail par membre" action={<GraduationCap size={16} className="text-ink-400" />} />
        <div className="space-y-3">
          {rows.map(({ e, wishes }) => (
            <div key={e.id} className="rounded-xl bg-surface2 px-3 py-2.5">
              <div className="mb-2 flex items-center gap-2.5"><Avatar name={employeeName(e)} size="xs" /><span className="text-sm font-semibold text-ink">{employeeName(e)}</span><span className="text-[11px] font-medium text-ink-400">({wishes.length} souhait{wishes.length > 1 ? 's' : ''})</span></div>
              <div className="space-y-1.5">
                {wishes.map((w, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-[12px] font-medium">
                    <span className="flex items-center gap-2"><StatusPill tone={PRIO_TONE[w.priority]} dot={false}>{w.priority}</StatusPill> <span className="font-semibold text-ink">{w.theme}</span> <span className="text-ink-400">· horizon {w.horizon}</span></span>
                    <span className="flex gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Formation proposée', description: `Proposition « ${w.theme} » envoyée à ${employeeName(e)}.` })}><GraduationCap size={12} /> Proposer formation</Button>
                      <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'info', title: 'À aborder en 1:1', description: `« ${w.theme} » ajouté à l'ordre du jour du prochain 1:1.` })}><MessageSquare size={12} /> Discuter en 1:1</Button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Lock size={14} className="mt-0.5 shrink-0 text-ink-400" /> Seuls les souhaits que le collaborateur a choisi de rendre visibles à son manager apparaissent ici. Les souhaits marqués privés ne sont jamais exposés.</p>
      </Card>
    </div>
  );
}
