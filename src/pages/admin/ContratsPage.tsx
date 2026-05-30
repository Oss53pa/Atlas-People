import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSignature, Search, AlertTriangle, ArrowUpRight, CheckCircle2, Filter, Plus } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { AdminRhSubNav } from '../../components/admin/AdminRhSubNav';
import { CONTRACTS, ALERTS } from '../../lib/m4/mock';
import { CONTRACT_TYPES, CONTRACT_STATUS_META, CONTRACT_WIZARD_STEPS, CONTRACT_SURVEILLANCE_THRESHOLDS } from '../../lib/m4/referentiels';
import { employeeById, employeeName, EMPLOYEES } from '../../data/mock';
import type { ContractTypeCode, ContractStatus } from '../../lib/m4/types';
import { cn } from '../../lib/cn';

export function ContratsPage() {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [typeF, setTypeF] = useState<'all' | ContractTypeCode>('all');
  const [statF, setStatF] = useState<'all' | ContractStatus>('all');
  const [wizard, setWizard] = useState(false);

  const list = useMemo(() => CONTRACTS.filter((c) => {
    const emp = employeeById(c.employeeId);
    if (!emp) return false;
    if (typeF !== 'all' && c.type !== typeF) return false;
    if (statF !== 'all' && c.status !== statF) return false;
    if (q && !(`${employeeName(emp)} ${c.ref} ${c.fonction}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [q, typeF, statF]);

  const cddAlerts = ALERTS.filter((a) => a.kind === 'cdd');
  const probAlerts = ALERTS.filter((a) => a.kind === 'probation');

  return (
    <div className="animate-fade-up space-y-5">
      <AdminRhSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Contrats</h1>
          <p className="text-sm font-medium text-ink-500">{CONTRACTS.length} contrats · 11 types · signature ADVIST OHADA · bibliothèque modèles par pays/CCN</p>
        </div>
        <Button size="sm" onClick={() => setWizard(true)}><Plus size={14} /> Nouveau contrat</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Actifs" value={String(CONTRACTS.filter(c=>c.status==='active').length)} unit="signés 2 parties" icon={CheckCircle2} />
        <StatCard label="CDD à surveiller" value={String(cddAlerts.length)} unit={`J-${CONTRACT_SURVEILLANCE_THRESHOLDS.cdd_end.join('/')}`} icon={AlertTriangle} tone={cddAlerts.length ? 'amber' : 'default'} />
        <StatCard label="Période d'essai" value={String(probAlerts.length)} unit="décision proche" icon={AlertTriangle} tone={probAlerts.length ? 'amber' : 'default'} />
        <StatCard label="Types de contrat" value="11" unit="OHADA" icon={FileSignature} />
      </div>

      {(cddAlerts.length > 0 || probAlerts.length > 0) && (
        <Card className="border-warn/30">
          <CardHeader title="Surveillance contrats" subtitle="Fin CDD · fin période d'essai · permis expat" action={<AlertTriangle size={16} className="text-warn" />} />
          <div className="space-y-1.5">
            {[...cddAlerts, ...probAlerts].map((a) => {
              const emp = employeeById(a.employeeId)!;
              return (
                <Link key={a.id} to={`/collaborateurs/${a.employeeId}`} className="flex items-center gap-2.5 rounded-xl bg-surface2/40 px-3 py-2 hover:bg-amber/[0.06]">
                  <Avatar name={employeeName(emp)} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{employeeName(emp)} · {emp.role}</p>
                    <p className="truncate text-[11px] font-medium text-ink-500">{a.message}</p>
                  </div>
                  <StatusPill tone={a.severity === 'danger' ? 'danger' : 'warn'} dot={false}>{`J-${a.daysLeft}`}</StatusPill>
                </Link>
              );
            })}
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
            <select value={typeF} onChange={(e) => setTypeF(e.target.value as typeof typeF)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
              <option value="all">Tous types</option>
              {CONTRACT_TYPES.map(t => <option key={t.code} value={t.code}>{t.short}</option>)}
            </select>
            <select value={statF} onChange={(e) => setStatF(e.target.value as typeof statF)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
              <option value="all">Tous statuts</option>
              {Object.entries(CONTRACT_STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <span className="text-[11px] font-semibold text-ink-400">{list.length}/{CONTRACTS.length} contrats</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Référence</th><th className="px-3 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Société</th>
              <th className="px-3 py-2 text-left">Signé le</th><th className="px-3 py-2 text-left">Fin</th>
              <th className="px-3 py-2 text-center">Statut</th><th className="px-3 py-2 text-right" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {list.map((c) => {
                const emp = employeeById(c.employeeId)!;
                const meta = CONTRACT_STATUS_META[c.status];
                return (
                  <tr key={c.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 mono text-[11px] font-bold text-amber-deep">{c.ref}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={employeeName(emp)} size="xs" /><span className="text-[12px] font-semibold text-ink">{employeeName(emp)}</span></div></td>
                    <td className="px-3 py-2"><span className="rounded-md bg-amber/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-deep">{c.type}</span></td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-500">{c.societe}</td>
                    <td className="px-3 py-2 mono text-[11px] font-medium text-ink-700">{c.signedAt ?? '—'}</td>
                    <td className="px-3 py-2 mono text-[11px] font-medium text-ink-700">{c.endDate ?? '—'}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={meta.tone} dot={false}>{meta.label}</StatusPill></td>
                    <td className="px-3 py-2 text-right"><Link to={`/collaborateurs/${c.employeeId}`}><Button variant="ghost" size="sm">Dossier <ArrowUpRight size={12} /></Button></Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {wizard && (
        <Card className="border-amber/40">
          <CardHeader title="Wizard nouveau contrat — 10 étapes" subtitle="ADVIST · DocJourney · audit chaîné" action={<Button variant="ghost" size="sm" onClick={() => setWizard(false)}>Fermer</Button>} />
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {CONTRACT_WIZARD_STEPS.map((s, i) => (
              <li key={s} className={cn('rounded-xl border px-3 py-2.5', i === 0 ? 'border-amber/40 bg-amber/[0.06]' : 'border-line bg-surface2/40')}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Étape {i + 1}</p>
                <p className="mt-0.5 text-[12px] font-semibold text-ink">{s}</p>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex items-center gap-2"><Filter size={12} className="text-ink-400" /><p className="text-[11px] font-medium text-ink-500">Sélectionner le collaborateur cible parmi les {EMPLOYEES.length} pour commencer.</p></div>
          <div className="mt-2 flex gap-2"><Button size="sm" onClick={() => { setWizard(false); toast({ variant: 'success', title: 'Wizard', description: 'Contrat en brouillon créé (étape 1/10)' }); }}>Démarrer le wizard</Button></div>
        </Card>
      )}
    </div>
  );
}
