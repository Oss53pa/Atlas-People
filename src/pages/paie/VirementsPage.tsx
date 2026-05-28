import { useMemo, useState } from 'react';
import { Banknote, Smartphone, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { usePayrollCycle } from '../../store/usePayrollCycle';
import { cycleBulletins, cycleTotals } from '../../lib/m3/cycle';
import { employeeName, mobileMoney } from '../../data/mock';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

export function VirementsPage() {
  const { cycle, variables, statuses, prevNet } = usePayrollCycle();
  const { toast } = useToast();
  const rows = useMemo(() => cycleBulletins(variables, statuses, prevNet), [variables, statuses, prevNet]);
  const totals = useMemo(() => cycleTotals(rows), [rows]);
  const [drh, setDrh] = useState(false);
  const [tres, setTres] = useState(false);

  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Ordres de virement</h1>
        <p className="text-sm font-medium text-ink-500">Cycle {cycle.label} · Mobile Money + banques · validation DRH puis Trésorier (R5/R12)</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total à virer" value={`${(totals.net / 1e6).toFixed(1)} M`} unit="XOF" mono icon={Banknote} tone="amber" />
        <StatCard label="Bénéficiaires" value={String(rows.length)} unit="collab." icon={CheckCircle2} />
        <StatCard label="Mobile Money" value={String(rows.length)} unit="virements" icon={Smartphone} />
        <StatCard label="Virements bancaires" value="0" unit="ce mois" icon={Building2} />
      </div>

      <Card>
        <CardHeader title="Validation de l'ordre de virement" subtitle="Irréversible une fois exécuté (annulation = ordre inverse documenté)" action={<ShieldCheck size={16} className="text-ink-400" />} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={`rounded-2xl border px-4 py-3 ${drh ? 'border-ok/30 bg-ok/[0.05]' : 'border-line bg-surface2'}`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">1 — DRH</p>
            <Button variant={drh ? 'ghost' : 'outline'} size="sm" className="mt-2" disabled={drh} onClick={() => { setDrh(true); toast({ variant: 'success', title: 'Validé DRH' }); }}>{drh ? 'Validé' : 'Valider (DRH)'}</Button>
          </div>
          <div className={`rounded-2xl border px-4 py-3 ${tres ? 'border-ok/30 bg-ok/[0.05]' : 'border-line bg-surface2'}`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">2 — Trésorier</p>
            <Button variant={tres ? 'ghost' : 'outline'} size="sm" className="mt-2" disabled={!drh || tres} onClick={() => { setTres(true); toast({ variant: 'success', title: 'Virements exécutés', description: `${rows.length} bénéficiaires · ${fmt(totals.net)} FCFA` }); }}>{tres ? 'Exécuté' : 'Valider & exécuter'}</Button>
          </div>
        </div>
      </Card>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Détail des virements" className="mb-0" /></div>
        <div className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.emp.id} className="flex items-center gap-3 px-5 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><Smartphone size={14} /></span>
              <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink">{employeeName(r.emp)}</p><p className="text-[11px] font-medium text-ink-400">Mobile Money {mobileMoney(r.emp)}</p></div>
              <span className="mono text-sm font-bold text-ink">{fmt(r.bulletin.netAPayer)} FCFA</span>
              <StatusPill tone={tres ? 'ok' : 'neutral'} dot={false}>{tres ? 'Exécuté' : 'En attente'}</StatusPill>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
