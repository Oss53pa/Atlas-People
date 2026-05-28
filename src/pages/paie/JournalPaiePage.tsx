import { useMemo, useState } from 'react';
import { BookOpen, Download, FileSpreadsheet } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { usePayrollCycle } from '../../store/usePayrollCycle';
import { cycleBulletins, cycleTotals, recapByRubrique } from '../../lib/m3/cycle';
import { employeeName } from '../../data/mock';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';
import { cn } from '../../lib/cn';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();
const TABS = [{ key: 'collectif', label: 'Journal collectif' }, { key: 'recap', label: 'Récap par rubrique' }];

export function JournalPaiePage() {
  const { cycle, variables, statuses, prevNet } = usePayrollCycle();
  const { toast } = useToast();
  const [tab, setTab] = useState('collectif');
  const rows = useMemo(() => cycleBulletins(variables, statuses, prevNet), [variables, statuses, prevNet]);
  const totals = useMemo(() => cycleTotals(rows), [rows]);
  const recap = useMemo(() => recapByRubrique(rows), [rows]);

  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Journal de paie</h1>
          <p className="text-sm font-medium text-ink-500">Cycle {cycle.label} · {rows.length} bulletins · livre de paie légal</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Export', description: 'Livre de paie.xlsx généré.' })}><FileSpreadsheet size={14} /> Export Excel</Button>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'collectif' && (
        <Card inset={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2.5 text-left">Collaborateur</th>
                <th className="px-3 py-2.5 text-right">Brut</th>
                <th className="px-3 py-2.5 text-right">Cotis. emp.</th>
                <th className="px-3 py-2.5 text-right">Retenues</th>
                <th className="px-3 py-2.5 text-right">Net à payer</th>
                <th className="px-3 py-2.5 text-right">Coût employeur</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.emp.id} className="hover:bg-ink/[0.02]">
                    <td className="px-4 py-2 text-[13px] font-semibold text-ink">{employeeName(r.emp)}</td>
                    <td className="mono px-3 py-2 text-right text-ink-700">{fmt(r.bulletin.brutTotal)}</td>
                    <td className="mono px-3 py-2 text-right text-danger">-{fmt(r.bulletin.totalCotisationsEmp)}</td>
                    <td className="mono px-3 py-2 text-right text-danger">-{fmt(r.bulletin.totalRetenues)}</td>
                    <td className="mono px-3 py-2 text-right font-bold text-ink">{fmt(r.bulletin.netAPayer)}</td>
                    <td className="mono px-3 py-2 text-right text-ink-500">{fmt(r.bulletin.coutEmployeur)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t-2 border-line bg-amber/[0.05] text-[13px] font-bold text-ink">
                <td className="px-4 py-2.5">TOTAL ({rows.length})</td>
                <td className="mono px-3 py-2.5 text-right">{fmt(totals.brut)}</td>
                <td className="mono px-3 py-2.5 text-right text-danger">-{fmt(totals.cotisationsEmp)}</td>
                <td className="mono px-3 py-2.5 text-right" />
                <td className="mono px-3 py-2.5 text-right text-amber-deep">{fmt(totals.net)}</td>
                <td className="mono px-3 py-2.5 text-right">{fmt(totals.coutEmployeur)}</td>
              </tr></tfoot>
            </table>
          </div>
        </Card>
      )}

      {tab === 'recap' && (
        <Card inset={false}>
          <div className="p-5 pb-2"><CardHeader title="Récapitulatif par rubrique" subtitle="Cumul du cycle, toutes sections" className="mb-0" action={<BookOpen size={16} className="text-ink-400" />} /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2.5 text-left">Rubrique</th>
                <th className="px-3 py-2.5 text-left">Section</th>
                <th className="px-3 py-2.5 text-right">Occurrences</th>
                <th className="px-3 py-2.5 text-right">Total</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {recap.map((r) => (
                  <tr key={r.code}>
                    <td className="px-4 py-2"><span className="mono text-[10px] font-bold text-ink-400">{r.code}</span> <span className="text-[13px] font-semibold text-ink">{r.label}</span></td>
                    <td className="px-3 py-2 text-[12px] font-medium text-ink-500">{r.section}</td>
                    <td className="mono px-3 py-2 text-right text-ink-500">{r.count}</td>
                    <td className={cn('mono px-3 py-2 text-right font-semibold', r.total < 0 ? 'text-danger' : 'text-ink')}>{fmt(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3"><Button variant="ghost" size="sm" onClick={() => toast({ variant: 'success', title: 'Livre de paie', description: 'Livre de paie légal.pdf généré.' })}><Download size={14} /> Télécharger le livre de paie</Button></div>
        </Card>
      )}
    </div>
  );
}
