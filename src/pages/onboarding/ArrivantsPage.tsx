import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, ArrowUpRight, Rocket } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { JOURNEYS, templateMeta } from '../../lib/m6/mock';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';
import { useRoster } from '../../lib/m1/roster';

export function ArrivantsPage() {
  const roster = useRoster();
  const [q, setQ] = useState('');
  const [statF, setStatF] = useState<'all' | 'planned' | 'in_progress' | 'completed'>('all');

  const list = useMemo(() => JOURNEYS.filter((j) => {
    if (statF !== 'all' && j.status !== statF) return false;
    const emp = employeeById(j.employeeId);
    if (!emp) return false;
    if (q && !`${employeeName(emp)} ${emp.role} ${j.ref}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.hireDate.localeCompare(a.hireDate)), [q, statF]);

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Arrivants & parcours</h1>
          <p className="text-sm font-medium text-ink-500">{roster.length} collaborateurs · {JOURNEYS.filter(j=>j.status==='in_progress').length} en cours d'onboarding</p>
        </div>
        <Button size="sm"><Rocket size={14} /> Nouveau parcours</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total parcours" value={String(JOURNEYS.length)} unit="historique" icon={Users} />
        <StatCard label="Actifs" value={String(JOURNEYS.filter(j=>j.status==='in_progress').length)} unit="en cours" icon={Rocket} tone="amber" />
        <StatCard label="Planifiés" value={String(JOURNEYS.filter(j=>j.status==='planned').length)} unit="à démarrer" icon={Rocket} />
        <StatCard label="Complétés" value={String(JOURNEYS.filter(j=>j.status==='completed').length)} unit="archivés" icon={Users} />
      </div>

      <Card inset={false}>
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-60 rounded-lg border border-line bg-surface2 pl-8 pr-2 text-[13px] font-medium text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <select value={statF} onChange={(e) => setStatF(e.target.value as typeof statF)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
              <option value="all">Tous statuts</option>
              <option value="planned">Planifiés</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Complétés</option>
            </select>
          </div>
          <span className="text-[11px] font-semibold text-ink-400">{list.length}/{JOURNEYS.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Réf.</th>
              <th className="px-3 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Embauche</th>
              <th className="px-3 py-2 text-left">Template</th>
              <th className="px-3 py-2 text-center">Progression</th>
              <th className="px-3 py-2 text-center">NPS</th>
              <th className="px-3 py-2 text-center">Statut</th>
              <th className="px-3 py-2 text-right" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {list.map((j) => {
                const emp = employeeById(j.employeeId);
                if (!emp) return null;
                const t = templateMeta(j.templateCode);
                const tone = j.status === 'completed' ? 'ok' : j.status === 'in_progress' ? 'amber' : j.status === 'failed' ? 'danger' : 'neutral';
                return (
                  <tr key={j.id} className={cn('hover:bg-amber/[0.03]', j.status === 'completed' && 'opacity-70')}>
                    <td className="px-4 py-2 mono text-[11px] font-bold text-amber-deep">{j.ref}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={employeeName(emp)} size="xs" /><div><p className="text-[12px] font-semibold text-ink">{employeeName(emp)}</p><p className="text-[10px] font-medium text-ink-400">{emp.role}</p></div></div></td>
                    <td className="px-3 py-2 mono text-[11px] font-medium text-ink-700">{j.hireDate}</td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{t?.label ?? j.templateCode}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-ink/[0.06]">
                          <div className="h-full rounded-full bg-amber" style={{ width: `${j.progressPct}%` }} />
                        </div>
                        <span className="mono text-[10px] font-bold text-ink">{j.progressPct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center mono text-[11px] font-bold">{j.nps ?? '—'}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={tone} dot={false}>{j.status}</StatusPill></td>
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
