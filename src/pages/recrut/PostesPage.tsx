import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Search, Plus, ArrowUpRight, Calendar, MapPin } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { JOBS } from '../../lib/m5/mock';
import { JOB_STATUS_META, JOB_LEVEL_LABEL, JOB_WIZARD_STEPS } from '../../lib/m5/referentiels';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';
import type { JobStatus } from '../../lib/m5/types';
import { cn } from '../../lib/cn';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

export function PostesPage() {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [statF, setStatF] = useState<'all' | JobStatus>('all');
  const [wizard, setWizard] = useState(false);

  const list = useMemo(() => JOBS.filter((j) => {
    if (statF !== 'all' && j.status !== statF) return false;
    if (q && !`${j.title} ${j.ref} ${j.department}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.openedAt.localeCompare(a.openedAt)), [q, statF]);

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Postes</h1>
          <p className="text-sm font-medium text-ink-500">{JOBS.length} postes · multi-canal · ADVIST pour offres · SLA time-to-fill 45 jours</p>
        </div>
        <Button size="sm" onClick={() => setWizard(true)}><Plus size={14} /> Nouveau poste</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total" value={String(JOBS.length)} unit="postes" icon={Briefcase} />
        <StatCard label="Ouverts" value={String(JOBS.filter(j => j.status === 'open').length)} unit="à pourvoir" icon={Briefcase} tone="amber" />
        <StatCard label="En pause" value={String(JOBS.filter(j => j.status === 'on_hold').length)} unit="hold" icon={Briefcase} />
        <StatCard label="Pourvus 12 m" value={String(JOBS.filter(j => j.status === 'closed_filled').length)} unit="hires" icon={Briefcase} />
        <StatCard label="Brouillons" value={String(JOBS.filter(j => j.status === 'draft').length)} unit="à publier" icon={Briefcase} />
      </div>

      {wizard && (
        <Card className="border-amber/40">
          <CardHeader title="Wizard nouveau poste — 7 étapes" subtitle="Pipeline · canaux · panel d'entretien" action={<Button variant="ghost" size="sm" onClick={() => setWizard(false)}>Fermer</Button>} />
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {JOB_WIZARD_STEPS.map((s, i) => (
              <li key={s} className={cn('rounded-xl border px-3 py-2.5', i === 0 ? 'border-amber/40 bg-amber/[0.06]' : 'border-line bg-surface2/40')}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Étape {i + 1}</p>
                <p className="mt-0.5 text-[12px] font-semibold text-ink">{s}</p>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => { setWizard(false); toast({ variant: 'success', title: 'Brouillon', description: 'Poste créé en brouillon (étape 1/7)' }); }}>Démarrer le wizard</Button>
          </div>
        </Card>
      )}

      <Card inset={false}>
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-56 rounded-lg border border-line bg-surface2 pl-8 pr-2 text-[13px] font-medium text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <select value={statF} onChange={(e) => setStatF(e.target.value as typeof statF)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
              <option value="all">Tous statuts</option>
              {Object.entries(JOB_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <span className="text-[11px] font-semibold text-ink-400">{list.length}/{JOBS.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Réf.</th>
              <th className="px-3 py-2 text-left">Poste</th>
              <th className="px-3 py-2 text-left">Niveau</th>
              <th className="px-3 py-2 text-right">Salaire</th>
              <th className="px-3 py-2 text-center">Cand.</th>
              <th className="px-3 py-2 text-left">Ouvert</th>
              <th className="px-3 py-2 text-center">Statut</th>
              <th className="px-3 py-2 text-right" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {list.map((j) => {
                const meta = JOB_STATUS_META[j.status];
                return (
                  <tr key={j.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 mono text-[11px] font-bold text-amber-deep">{j.ref}</td>
                    <td className="px-3 py-2">
                      <p className="text-[13px] font-semibold text-ink">{j.title}</p>
                      <p className="flex items-center gap-2 text-[11px] font-medium text-ink-500">
                        <span><MapPin size={10} className="inline" /> {j.location}</span>
                        <span>· {j.contractType}</span>
                        <span>· {j.department}</span>
                      </p>
                    </td>
                    <td className="px-3 py-2 text-[12px] font-medium text-ink-700">{JOB_LEVEL_LABEL[j.level]}</td>
                    <td className="px-3 py-2 mono text-right text-[11px] text-ink-700">{fmt(j.salaryRangeMin)} – {fmt(j.salaryRangeMax)}</td>
                    <td className="px-3 py-2 mono text-center text-[12px] font-bold text-ink">{j.applicationsCount}</td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-700"><Calendar size={10} className="inline" /> {j.openedAt}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={meta.tone} dot={false}>{meta.label}</StatusPill></td>
                    <td className="px-3 py-2 text-right"><Link to={`/recrutement/postes/${j.id}`}><Button variant="ghost" size="sm">Pipeline <ArrowUpRight size={12} /></Button></Link></td>
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
