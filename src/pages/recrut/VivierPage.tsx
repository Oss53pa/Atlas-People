import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, ArrowUpRight, Tag, Phone, Mail } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { StatCard } from '../../components/ui/StatCard';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { CANDIDATES, poolEntries } from '../../lib/m5/mock';

export function VivierPage() {
  const [q, setQ] = useState('');
  const [pool, setPool] = useState<'all' | string>('all');

  const entries = useMemo(() => poolEntries(), []);
  const allPools = useMemo(() => Array.from(new Set(entries.flatMap(e => e.pools))).sort(), [entries]);

  const filtered = useMemo(() => entries.filter((e) => {
    if (pool !== 'all' && !e.pools.includes(pool)) return false;
    const c = CANDIDATES.find((cc) => cc.id === e.candidateId)!;
    if (q && !`${c.firstName} ${c.lastName} ${c.currentRole} ${c.currentCompany} ${c.skills.join(' ')}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [entries, pool, q]);

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Vivier talents</h1>
          <p className="text-sm font-medium text-ink-500">{entries.length} talents en vivier · pools thématiques · suivi long terme · RGPD conservation 2 ans</p>
        </div>
        <Button size="sm">+ Ajouter au vivier</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Talents vivier" value={String(entries.length)} unit="suivis" icon={Users} />
        <StatCard label="Pools actifs" value={String(allPools.length)} unit="catégories" icon={Tag} />
        <StatCard label="À recontacter" value={String(entries.length)} unit="ce trimestre" icon={Phone} tone="amber" />
        <StatCard label="Bases CV" value={String(CANDIDATES.length)} unit="dont vivier" icon={Mail} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Recherche compétences, nom, entreprise…" className="h-9 w-80 rounded-lg border border-line bg-surface2 pl-8 pr-2 text-[13px] font-medium text-ink focus:border-amber/40 focus:outline-none" />
        </div>
        <select value={pool} onChange={(e) => setPool(e.target.value)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
          <option value="all">Tous les pools</option>
          {allPools.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-[11px] font-semibold text-ink-400">{filtered.length} talents</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((e) => {
          const c = CANDIDATES.find((cc) => cc.id === e.candidateId)!;
          return (
            <Card key={e.id}>
              <div className="flex items-start gap-2">
                <Avatar name={`${c.firstName} ${c.lastName}`} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-ink">{c.firstName} {c.lastName}</p>
                  <p className="truncate text-[11px] font-medium text-ink-500">{c.currentRole} @ {c.currentCompany}</p>
                  <p className="truncate text-[10px] font-medium text-ink-400">{c.location} · {c.yearsExperience} ans</p>
                </div>
                <Link to={`/recrutement/candidats/${c.id}`}><Button variant="ghost" size="sm"><ArrowUpRight size={12} /></Button></Link>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {e.pools.map((p) => <span key={p} className="rounded-md bg-amber/12 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-deep">{p.replace('vivier-', '')}</span>)}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.skills.slice(0, 4).map((s) => <span key={s} className="rounded-md bg-info/10 px-1.5 py-0.5 text-[10px] font-medium text-info">{s}</span>)}
              </div>
              <p className="mt-2 text-[10px] font-medium text-ink-400">Dernier contact · {e.lastContactAt} · Prochain suivi {e.nextFollowupAt}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
