import { useMemo, useState } from 'react';
import { Target, Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { OkrSubNav } from '../../components/okr/OkrSubNav';
import { KEY_RESULTS, objectiveById } from '../../lib/m7/mock';
import { CONFIDENCE_META, KR_TYPE_META, LEVEL_META } from '../../lib/m7/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import type { ConfidenceLevel, KrType } from '../../lib/m7/types';
import { cn } from '../../lib/cn';

function krProgress(k: typeof KEY_RESULTS[number]) {
  return Math.max(0, Math.min(1, (k.currentValue - k.startValue) / Math.max(0.0001, k.targetValue - k.startValue)));
}

export function KeyResultsPage() {
  const [q, setQ] = useState('');
  const [confF, setConfF] = useState<'all' | ConfidenceLevel>('all');
  const [typeF, setTypeF] = useState<'all' | KrType>('all');

  const list = useMemo(() => KEY_RESULTS.filter((k) => {
    const o = objectiveById(k.objectiveId);
    if (!o || o.status !== 'active') return false;
    if (confF !== 'all' && k.confidence !== confF) return false;
    if (typeF !== 'all' && k.type !== typeF) return false;
    if (q && !`${k.title} ${o.title}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, confF, typeF]);

  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Key Results</h1>
        <p className="text-sm font-medium text-ink-500">{KEY_RESULTS.length} KRs sur cycle actif · mesurables · datés · pondérés</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="KRs actifs" value={String(KEY_RESULTS.length)} unit="suivis" icon={Target} />
        <StatCard label="On track" value={String(KEY_RESULTS.filter(k=>k.confidence==='green').length)} unit="green" icon={Target} />
        <StatCard label="À risque" value={String(KEY_RESULTS.filter(k=>k.confidence==='amber').length)} unit="amber" icon={Target} tone="amber" />
        <StatCard label="En retard" value={String(KEY_RESULTS.filter(k=>k.confidence==='red').length)} unit="red" icon={Target} />
      </div>

      <Card inset={false}>
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-60 rounded-lg border border-line bg-surface2 pl-8 pr-2 text-[13px] font-medium text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <select value={confF} onChange={(e) => setConfF(e.target.value as typeof confF)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
              <option value="all">Toutes confidences</option>
              {Object.entries(CONFIDENCE_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={typeF} onChange={(e) => setTypeF(e.target.value as typeof typeF)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
              <option value="all">Tous types</option>
              {Object.entries(KR_TYPE_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <span className="text-[11px] font-semibold text-ink-400">{list.length}/{KEY_RESULTS.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">KR</th>
              <th className="px-3 py-2 text-left">Objectif</th>
              <th className="px-3 py-2 text-left">Owner</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-right">Progression</th>
              <th className="px-3 py-2 text-center">Confidence</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {list.map((k) => {
                const o = objectiveById(k.objectiveId)!;
                const owner = k.ownerEmployeeId ? employeeById(k.ownerEmployeeId) : null;
                const conf = CONFIDENCE_META[k.confidence];
                const prog = krProgress(k);
                return (
                  <tr key={k.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2"><p className="text-[12px] font-semibold text-ink">{k.title}</p><p className="mono text-[10px] font-medium text-amber-deep">{k.ref}</p></td>
                    <td className="px-3 py-2"><span className="rounded-md bg-amber/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-deep">{LEVEL_META[o.level].label}</span><p className="mt-0.5 text-[11px] font-medium text-ink-700 truncate max-w-[280px]">{o.title}</p></td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{owner ? employeeName(owner) : '—'}</td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-500">{KR_TYPE_META[k.type].label}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-ink/[0.06]"><div className={cn('h-full rounded-full', conf.tone === 'ok' ? 'bg-ok' : conf.tone === 'amber' ? 'bg-amber' : 'bg-danger')} style={{ width: `${prog * 100}%` }} /></div>
                        <span className="mono text-[10px] font-bold text-amber-deep">{Math.round(prog * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={conf.tone} dot={false}>{conf.label}</StatusPill></td>
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
