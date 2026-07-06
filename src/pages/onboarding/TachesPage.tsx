import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, Search, AlertTriangle, CheckCircle2, ArrowUpRight, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { useM6Data } from '../../lib/m6/dataLive';
import { useCompleteOnboardingTask, isBackendConfigured } from '../../lib/m6/supabaseLive';
import { TASK_CATEGORY_META, MILESTONE_META, OWNER_LABEL } from '../../lib/m6/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import type { TaskCategory, MilestoneCode, TaskStatus } from '../../lib/m6/types';
import { cn } from '../../lib/cn';

export function TachesPage() {
  const m6 = useM6Data();
  const { toast } = useToast();
  const completeTask = useCompleteOnboardingTask();
  const [q, setQ] = useState('');
  const [catF, setCatF] = useState<'all' | TaskCategory>('all');
  const [statF, setStatF] = useState<'all' | TaskStatus>('all');
  const [msF, setMsF] = useState<'all' | MilestoneCode>('all');

  const handleComplete = async (taskId: string) => {
    if (!isBackendConfigured) {
      toast({ variant: 'success', title: 'Tâche complétée', description: 'Mode démo — aucune persistance.' });
      return;
    }
    try {
      await completeTask.mutateAsync({ taskId });
      toast({ variant: 'success', title: 'Tâche complétée', description: 'Statut mis à jour · audit SHA-256' });
    } catch (e) {
      toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
    }
  };

  const list = useMemo(() => m6.tasks.filter((t) => {
    if (catF !== 'all' && t.category !== catF) return false;
    if (statF !== 'all' && t.status !== statF) return false;
    if (msF !== 'all' && t.milestone !== msF) return false;
    if (q) {
      const j = m6.journeys.find((x) => x.id === t.journeyId);
      const emp = j && employeeById(j.employeeId);
      if (!`${t.title} ${emp ? employeeName(emp) : ''}`.toLowerCase().includes(q.toLowerCase())) return false;
    }
    return true;
  }).slice(0, 200), [q, catF, statF, msF, m6]);

  const late = m6.tasks.filter((t) => {
    if (t.status === 'completed' || t.status === 'skipped') return false;
    return (new Date(t.dueDate).getTime() - new Date('2026-05-31').getTime()) / 86_400_000 < 0;
  }).length;

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Tâches d'onboarding</h1>
          <p className="text-sm font-medium text-ink-500">{m6.tasks.length} tâches actives toutes catégories · filtres par milestone, catégorie, statut</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total tâches" value={String(m6.tasks.length)} unit="actives + historique" icon={ListChecks} />
        <StatCard label="Complétées" value={String(m6.tasks.filter(t=>t.status==='completed').length)} unit={`${Math.round(m6.tasks.filter(t=>t.status==='completed').length/m6.tasks.length*100)} %`} icon={CheckCircle2} />
        <StatCard label="En cours" value={String(m6.tasks.filter(t=>t.status==='in_progress').length)} unit="à débloquer" icon={Clock} tone="amber" />
        <StatCard label="En retard" value={String(late)} unit="échéance dépassée" icon={AlertTriangle} tone={late ? 'amber' : 'default'} />
      </div>

      <Card inset={false}>
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-52 rounded-lg border border-line bg-surface2 pl-8 pr-2 text-[13px] font-medium text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <select value={catF} onChange={(e) => setCatF(e.target.value as typeof catF)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
              <option value="all">Toutes catégories</option>
              {Object.entries(TASK_CATEGORY_META).map(([c,m]) => <option key={c} value={c}>{m.label}</option>)}
            </select>
            <select value={msF} onChange={(e) => setMsF(e.target.value as typeof msF)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
              <option value="all">Tous milestones</option>
              {Object.entries(MILESTONE_META).map(([c,m]) => <option key={c} value={c}>{m.label}</option>)}
            </select>
            <select value={statF} onChange={(e) => setStatF(e.target.value as typeof statF)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
              <option value="all">Tous statuts</option>
              <option value="pending">Pending</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Complété</option>
              <option value="blocked">Bloqué</option>
              <option value="skipped">Passé</option>
            </select>
          </div>
          <span className="text-[11px] font-semibold text-ink-400">{list.length} tâches</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Tâche</th>
              <th className="px-3 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Milestone</th>
              <th className="px-3 py-2 text-left">Catégorie</th>
              <th className="px-3 py-2 text-left">Owner</th>
              <th className="px-3 py-2 text-left">Échéance</th>
              <th className="px-3 py-2 text-center">Statut</th>
              <th className="px-3 py-2 text-right" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {list.map((t) => {
                const j = m6.journeys.find((x) => x.id === t.journeyId);
                const emp = j && employeeById(j.employeeId);
                const cat = TASK_CATEGORY_META[t.category];
                const ms = MILESTONE_META[t.milestone];
                const overdue = t.status !== 'completed' && t.status !== 'skipped' && new Date(t.dueDate) < new Date('2026-05-31');
                return (
                  <tr key={t.id} className={cn('hover:bg-amber/[0.03]', overdue && 'bg-warn/[0.03]')}>
                    <td className="px-4 py-2 text-[12px] font-semibold text-ink">{t.title}{t.blocking && <span className="ml-2 rounded-md bg-warn/12 px-1.5 py-0.5 text-[9px] font-bold uppercase text-warn">bloquant</span>}</td>
                    <td className="px-3 py-2 text-[12px] font-medium text-ink-700">{emp ? employeeName(emp) : '—'}</td>
                    <td className="px-3 py-2 text-[11px] font-bold text-amber-deep">{ms.label}</td>
                    <td className="px-3 py-2"><span className="rounded-md bg-amber/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-deep">{cat.label}</span></td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-500">{OWNER_LABEL[t.ownerRole]}</td>
                    <td className="px-3 py-2 mono text-[11px] font-medium text-ink-700">{t.dueDate}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={t.status === 'completed' ? 'ok' : t.status === 'in_progress' ? 'amber' : t.status === 'blocked' ? 'danger' : 'neutral'} dot={false}>{t.status}</StatusPill></td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {t.status !== 'completed' && t.status !== 'skipped' && (
                          <Button variant="ghost" size="sm" disabled={completeTask.isPending} onClick={() => handleComplete(t.id)}>Compléter</Button>
                        )}
                        {emp && <Link to={`/onboarding/arrivants/${emp.id}`}><Button variant="ghost" size="sm">Parcours <ArrowUpRight size={12} /></Button></Link>}
                      </div>
                    </td>
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
