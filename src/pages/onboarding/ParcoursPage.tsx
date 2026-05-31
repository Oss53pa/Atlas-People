import { Library, ListChecks, Calendar, Users } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { TEMPLATES, TASK_LIBRARY, MILESTONES, TASK_CATEGORY_META, MILESTONE_META } from '../../lib/m6/referentiels';

export function ParcoursPage() {
  const { toast } = useToast();
  const totalTasks = TASK_LIBRARY.length;

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Templates de parcours</h1>
          <p className="text-sm font-medium text-ink-500">{TEMPLATES.length} templates · 30/60/90 jours · {totalTasks} tâches référence</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Template', description: 'Wizard nouveau template' })}><Library size={14} /> Nouveau template</Button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {TEMPLATES.map((t) => (
          <Card key={t.code}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] font-bold text-ink">{t.label}</p>
                <p className="mono mt-0.5 text-[11px] font-medium text-amber-deep">{t.code}</p>
              </div>
              <StatusPill tone={t.active ? 'ok' : 'neutral'} dot={false}>{t.active ? 'Actif' : 'Brouillon'}</StatusPill>
            </div>
            <p className="mt-2 text-[12px] font-medium text-ink-700">{t.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold">
              <span className="rounded-md bg-info/10 px-2 py-1 text-info"><Users size={9} className="inline" /> {t.appliesTo}</span>
              <span className="rounded-md bg-amber/12 px-2 py-1 text-amber-deep"><Calendar size={9} className="inline" /> {t.durationDays} jours</span>
              <span className="rounded-md bg-ink/[0.06] px-2 py-1 text-ink-700"><ListChecks size={9} className="inline" /> {t.taskCount} tâches</span>
            </div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => toast({ variant: 'info', title: 'Template', description: t.label })}>Voir détail →</Button>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Bibliothèque de tâches" subtitle={`${totalTasks} tâches référence réparties sur 6 milestones`} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {MILESTONES.map((m) => {
            const count = TASK_LIBRARY.filter((t) => t.milestone === m.code).length;
            const meta = MILESTONE_META[m.code];
            return (
              <div key={m.code} className="rounded-xl border border-line bg-surface2/40 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">{meta.label}</p>
                <p className="mono mt-0.5 text-lg font-bold text-ink">{count}</p>
                <p className="text-[10px] font-medium text-ink-400">tâches</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-400">Catégories de tâches</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(TASK_CATEGORY_META).map(([code, m]) => {
            const c = TASK_LIBRARY.filter((t) => t.category === code).length;
            return <span key={code} className="rounded-md bg-amber/10 px-2 py-1 text-[11px] font-semibold text-amber-deep">{m.label} · {c}</span>;
          })}
        </div>
      </Card>
    </div>
  );
}
