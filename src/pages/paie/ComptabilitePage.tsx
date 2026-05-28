import { useMemo } from 'react';
import { Layers, Send, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { usePayrollCycle } from '../../store/usePayrollCycle';
import { cycleBulletins, cycleTotals } from '../../lib/m3/cycle';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

export function ComptabilitePage() {
  const { cycle, variables, statuses, prevNet } = usePayrollCycle();
  const { toast } = useToast();
  const totals = useMemo(() => cycleTotals(cycleBulletins(variables, statuses, prevNet)), [variables, statuses, prevNet]);

  // OD de paie SYSCOHADA (schéma simplifié, équilibré).
  const lines = [
    { account: '661100', label: 'Rémunérations du personnel (brut)', debit: totals.brut, credit: 0 },
    { account: '664000', label: 'Charges sociales patronales', debit: totals.patronal, credit: 0 },
    { account: '431000', label: 'Sécurité sociale (CNPS)', debit: 0, credit: Math.round(totals.cotisationsEmp * 0.45) + totals.patronal },
    { account: '447000', label: 'État, impôts sur salaires (ITS/IRPP)', debit: 0, credit: Math.round(totals.cotisationsEmp * 0.55) },
    { account: '421000', label: 'Personnel — rémunérations dues (net)', debit: 0, credit: totals.net },
  ];
  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const balanced = totalDebit === totalCredit;

  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">OD comptables</h1>
          <p className="text-sm font-medium text-ink-500">Cycle {cycle.label} · journal PAIE · plan SYSCOHADA · export Atlas Finance</p>
        </div>
        <Button size="sm" disabled={!balanced} onClick={() => toast({ variant: 'success', title: 'Export', description: 'OD de paie exportée vers Atlas Finance.' })}><Send size={14} /> Exporter vers Atlas Finance</Button>
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title={`Écriture OD — Paie ${cycle.label}`} subtitle="Schéma SYSCOHADA" className="mb-0" action={<Layers size={16} className="text-ink-400" />} /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2.5 text-left">Compte</th><th className="px-3 py-2.5 text-left">Libellé</th>
              <th className="px-3 py-2.5 text-right">Débit</th><th className="px-3 py-2.5 text-right">Crédit</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {lines.map((l) => (
                <tr key={l.account}>
                  <td className="mono px-4 py-2 text-[12px] font-bold text-ink-500">{l.account}</td>
                  <td className="px-3 py-2 text-[13px] font-medium text-ink">{l.label}</td>
                  <td className="mono px-3 py-2 text-right text-ink-700">{l.debit ? fmt(l.debit) : '—'}</td>
                  <td className="mono px-3 py-2 text-right text-ink-700">{l.credit ? fmt(l.credit) : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="border-t-2 border-line bg-amber/[0.05] text-[13px] font-bold text-ink">
              <td className="px-4 py-2.5" colSpan={2}>TOTAUX</td>
              <td className="mono px-3 py-2.5 text-right">{fmt(totalDebit)}</td>
              <td className="mono px-3 py-2.5 text-right">{fmt(totalCredit)}</td>
            </tr></tfoot>
          </table>
        </div>
        <div className="px-5 py-3">
          <StatusPill tone={balanced ? 'ok' : 'danger'} dot={false}>{balanced ? <><CheckCircle2 size={12} className="mr-1 inline" />Écriture équilibrée</> : 'Déséquilibrée'}</StatusPill>
        </div>
      </Card>
    </div>
  );
}
