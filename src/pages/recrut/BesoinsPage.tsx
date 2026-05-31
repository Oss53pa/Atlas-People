import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Search, Plus, ArrowUpRight, Wallet, Hourglass, CheckCircle2, Users,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { RECRUITMENT_NEEDS, needKpis } from '../../lib/m5/needs';
import { NEED_TYPES, NEED_STATUS_META, NEED_URGENCY_META } from '../../lib/m5/referentiels';
import type { NeedType, NeedStatus } from '../../lib/m5/types';
import { employeeById, employeeName } from '../../data/mock';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();
const fmtM = (n: number) => `${(n / 1e6).toFixed(1)} M`;

export function BesoinsPage() {
  const { toast } = useToast();
  const k = useMemo(() => needKpis(), []);
  const [q, setQ] = useState('');
  const [typeF, setTypeF] = useState<'all' | NeedType>('all');
  const [statF, setStatF] = useState<'all' | NeedStatus>('all');

  const list = useMemo(() => RECRUITMENT_NEEDS.filter((n) => {
    if (typeF !== 'all' && n.type !== typeF) return false;
    if (statF !== 'all' && n.status !== statF) return false;
    const mgr = employeeById(n.hiringManagerId);
    if (q && !(`${n.ref} ${n.title} ${n.department} ${mgr ? employeeName(mgr) : ''}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [q, typeF, statF]);

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Besoins de recrutement</h1>
          <p className="text-sm font-medium text-ink-500">Point d'entrée du processus · 5 types · workflow RRH → DAF → DRH → DG · validation budget</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Wizard', description: 'Wizard nouveau besoin (6 étapes) lancé' })}><Plus size={14} /> Nouveau besoin</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Besoins" value={String(k.total)} unit="actifs" icon={ClipboardList} />
        <StatCard label="En validation" value={String(k.enAttente)} unit="workflow" icon={Hourglass} tone={k.enAttente ? 'amber' : 'default'} />
        <StatCard label="Approuvés" value={String(k.approuves)} unit="prêts à publier" icon={CheckCircle2} />
        <StatCard label="Postes demandés" value={String(k.postesDemandes)} unit="à pourvoir" icon={Users} />
        <StatCard label="Budget engagé" value={fmtM(k.budgetTotal)} unit="FCFA an 1" icon={Wallet} mono />
      </div>

      <Card>
        <CardHeader title="Typologie des besoins" subtitle="5 types · validation DAF requise selon le type" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {NEED_TYPES.map((t) => {
            const count = RECRUITMENT_NEEDS.filter((n) => n.type === t.code).length;
            return (
              <button key={t.code} onClick={() => setTypeF((c) => (c === t.code ? 'all' : t.code))}
                className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${typeF === t.code ? 'border-amber/50 bg-amber/[0.08]' : 'border-line bg-surface2/40 hover:bg-amber/[0.04]'}`}>
                <p className="text-[12px] font-bold text-ink">{t.label}</p>
                <p className="mt-0.5 text-[10px] font-medium text-ink-400">{count} · {t.dafRequired ? 'DAF requis' : 'DAF allégé'}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card inset={false}>
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-56 rounded-lg border border-line bg-surface2 pl-8 pr-2 text-[13px] font-medium text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <select value={statF} onChange={(e) => setStatF(e.target.value as typeof statF)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
              <option value="all">Tous statuts</option>
              {Object.entries(NEED_STATUS_META).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
            </select>
          </div>
          <span className="text-[11px] font-semibold text-ink-400">{list.length}/{RECRUITMENT_NEEDS.length} besoins</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Réf.</th><th className="px-3 py-2 text-left">Poste</th>
              <th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-center">Vol.</th>
              <th className="px-3 py-2 text-left">Manager</th><th className="px-3 py-2 text-center">Urgence</th>
              <th className="px-3 py-2 text-right">Budget an 1</th><th className="px-3 py-2 text-center">Statut</th>
              <th className="px-3 py-2 text-right" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {list.map((n) => {
                const mgr = employeeById(n.hiringManagerId);
                const sm = NEED_STATUS_META[n.status];
                const um = NEED_URGENCY_META[n.urgency];
                const tl = NEED_TYPES.find((t) => t.code === n.type)?.label ?? n.type;
                return (
                  <tr key={n.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 mono text-[11px] font-bold text-amber-deep">{n.ref}</td>
                    <td className="px-3 py-2"><p className="text-[13px] font-semibold text-ink">{n.title}</p><p className="text-[11px] font-medium text-ink-500">{n.department} · {n.location}</p></td>
                    <td className="px-3 py-2"><span className="rounded-md bg-ink/[0.06] px-2 py-0.5 text-[10px] font-bold text-ink-700">{tl}</span></td>
                    <td className="px-3 py-2 text-center mono text-[12px] font-bold text-ink">{n.volume}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2">{mgr && <Avatar name={employeeName(mgr)} size="xs" />}<span className="text-[12px] font-medium text-ink-700">{mgr ? employeeName(mgr) : '—'}</span></div></td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={um.tone} dot={false}>{um.label}</StatusPill></td>
                    <td className="px-3 py-2 text-right mono text-[12px] text-ink-700">{fmt(n.budgetYear1)}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={sm.tone} dot={false}>{sm.label}</StatusPill></td>
                    <td className="px-3 py-2 text-right"><Link to={`/recrutement/besoins/${n.id}`}><Button variant="ghost" size="sm">Détail <ArrowUpRight size={12} /></Button></Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-[11px] font-medium text-ink-400">Règle dure : pas d'offre sans besoin validé · validation DAF obligatoire (budget) · DG si coût annuel &gt; 50M FCFA · audit chaîné.</p>
    </div>
  );
}
