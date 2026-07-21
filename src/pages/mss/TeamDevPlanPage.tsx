import { useEffect } from 'react';
import { CalendarRange, Send, Sparkles, TrendingUp, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { DevelopmentSubNav } from '../../components/mss/DevelopmentSubNav';
import { useSurface } from '../../store/useSurface';
import { DEV_BUDGET, budgetAvailable, fmtFCFA } from '../../lib/mss/dev';
import { isBackendConfigured } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const PRIORITIES = [
  { n: 1, title: 'Combler l\'écart « Grands comptes » (3 personnes)', action: 'Formation interne 2 j + mentorat expert', cost: 0, impact: 'Couverture 60% → 100%' },
  { n: 2, title: 'Anglais professionnel (4 personnes)', action: 'Cours collectif hebdomadaire (3 mois)', cost: 600000, impact: 'Couverture 60% → 80%' },
  { n: 3, title: 'Parcours Manager pour 2 talents', action: 'Un parcours en cours, un second à proposer', cost: 1200000, impact: 'Vivier succession renforcé' },
];

export function TeamDevPlanPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);
  const { toast } = useToast();

  const { data: ctx } = useSessionContext();
  const hasLive = isBackendConfigured && Boolean(ctx?.tenantId);

  const consumedPct = Math.round((DEV_BUDGET.consumed / DEV_BUDGET.allocated) * 100);
  const programmedPct = Math.round((DEV_BUDGET.programmed / DEV_BUDGET.allocated) * 100);

  return (
    <div className="animate-fade-up space-y-5">
      <DevelopmentSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-ink">Plan de développement équipe — 2026</h1>
          {hasLive && <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>}
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Plan soumis à la RH', description: 'Le plan de développement équipe est transmis pour validation budgétaire.' })}><Send size={14} /> Soumettre à la RH</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard icon={CalendarRange} label="Budget alloué" value={fmtFCFA(DEV_BUDGET.allocated)} tone="amber" />
        <StatCard icon={TrendingUp} label="Consommé" value={fmtFCFA(DEV_BUDGET.consumed)} unit={`${consumedPct}%`} />
        <StatCard icon={CalendarRange} label="Programmé" value={fmtFCFA(DEV_BUDGET.programmed)} unit={`${programmedPct}%`} />
        <StatCard icon={TrendingUp} label="Disponible" value={fmtFCFA(budgetAvailable)} tone="amber" />
      </div>

      <Card>
        <CardHeader title="Priorités identifiées" subtitle="Proph3t + arbitrage manager" action={<Sparkles size={16} className="text-info" />} />
        <div className="space-y-3">
          {PRIORITIES.map((p) => (
            <div key={p.n} className="rounded-xl bg-surface2 px-4 py-3">
              <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-info/12 text-[12px] font-bold text-info">{p.n}</span><p className="text-sm font-bold text-ink">{p.title}</p></div>
              <div className="mt-2 grid grid-cols-1 gap-1 text-[12px] font-medium text-ink-600 sm:grid-cols-3">
                <p><span className="text-ink-400">Action :</span> {p.action}</p>
                <p><span className="text-ink-400">Coût :</span> {p.cost === 0 ? 'Interne (0)' : fmtFCFA(p.cost)}</p>
                <p><span className="text-ink-400">Impact :</span> {p.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Actions individuelles" subtitle="Vue membre × formation × période" action={<CalendarRange size={16} className="text-ink-400" />} />
        <p className="text-sm font-medium text-ink-400">La planification détaillée par membre se construit à partir des écarts de compétences et des souhaits validés. Soumettez le plan pour que la RH confirme le budget et la logistique.</p>
      </Card>
    </div>
  );
}
