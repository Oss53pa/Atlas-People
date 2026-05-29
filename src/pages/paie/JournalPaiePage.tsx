import { Fragment, useMemo, useState } from 'react';
import { BookOpen, Download, FileSpreadsheet } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { usePayrollCycle } from '../../store/usePayrollCycle';
import { cycleBulletins, cycleTotals, fullRecapByRubrique, RECAP_SECTIONS } from '../../lib/m3/cycle';
import { employeeName } from '../../data/mock';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';
import { cn } from '../../lib/cn';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();
const TABS = [{ key: 'collectif', label: 'Journal collectif' }, { key: 'recap', label: 'Récap par rubrique' }];
const SECTION_LABEL: Record<string, string> = {
  Gains: 'Gains', Cotisations: 'Cotisations salariales', Retenues: 'Retenues diverses', Patronal: 'Charges patronales',
};

export function JournalPaiePage() {
  const { cycle, variables, statuses, prevNet } = usePayrollCycle();
  const { toast } = useToast();
  const [tab, setTab] = useState('collectif');
  const rows = useMemo(() => cycleBulletins(variables, statuses, prevNet), [variables, statuses, prevNet]);
  const totals = useMemo(() => cycleTotals(rows), [rows]);
  const recap = useMemo(() => fullRecapByRubrique(rows), [rows]);
  const recapBySection = useMemo(
    () => RECAP_SECTIONS.map((s) => ({ section: s, items: recap.filter((r) => r.section === s) })).filter((g) => g.items.length > 0),
    [recap],
  );
  const usedCount = recap.filter((r) => r.count > 0).length;

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
          <div className="p-5 pb-2"><CardHeader title="Récapitulatif par rubrique" subtitle={`Grille complète du régime · ${usedCount}/${recap.length} rubriques mouvementées · les rubriques paramétrées non utilisées apparaissent à 0`} className="mb-0" action={<BookOpen size={16} className="text-ink-400" />} /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2.5 text-left">Rubrique</th>
                <th className="px-3 py-2.5 text-right">Occurrences</th>
                <th className="px-3 py-2.5 text-right">Total cycle</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {recapBySection.map((g) => {
                  const sectionTotal = g.items.reduce((s, r) => s + r.total, 0);
                  return (
                    <Fragment key={g.section}>
                      <tr className="bg-surface2/60">
                        <td colSpan={3} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">{SECTION_LABEL[g.section]} · {g.items.length} rubriques</td>
                      </tr>
                      {g.items.map((r) => (
                        <tr key={r.code} className={cn('hover:bg-ink/[0.02]', r.count === 0 && 'opacity-55')}>
                          <td className="px-4 py-2">
                            <span className="mono text-[10px] font-bold text-ink-400">{r.code}</span> <span className="text-[13px] font-semibold text-ink">{r.label}</span>
                            {r.count === 0 && <span className="ml-2 rounded-md bg-surface2 px-1.5 py-0.5 text-[10px] font-semibold text-ink-400">paramétrée · non mouvementée</span>}
                          </td>
                          <td className="mono px-3 py-2 text-right text-ink-500">{r.count}</td>
                          <td className={cn('mono px-3 py-2 text-right font-semibold', r.count === 0 ? 'text-ink-300' : r.total < 0 ? 'text-danger' : 'text-ink')}>{fmt(r.total)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-line text-[12px] font-bold text-ink">
                        <td className="px-4 py-1.5 text-right uppercase tracking-wider text-ink-400">Sous-total {SECTION_LABEL[g.section]}</td>
                        <td />
                        <td className={cn('mono px-3 py-1.5 text-right', sectionTotal < 0 ? 'text-danger' : 'text-ink')}>{fmt(sectionTotal)}</td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3"><Button variant="ghost" size="sm" onClick={() => toast({ variant: 'success', title: 'Livre de paie', description: 'Livre de paie légal.pdf généré.' })}><Download size={14} /> Télécharger le livre de paie</Button></div>
        </Card>
      )}
    </div>
  );
}
