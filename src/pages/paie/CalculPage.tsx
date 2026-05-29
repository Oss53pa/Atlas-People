import { useMemo, useState } from 'react';
import { Calculator, Play, CheckCircle2, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { ProgressBar } from '../../components/charts/ProgressBar';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { ExplainCalculModal } from '../../components/paie/ExplainCalculModal';
import { usePayrollCycle } from '../../store/usePayrollCycle';
import { cycleBulletins, cycleTotals } from '../../lib/m3/cycle';
import { employeeById, employeeName } from '../../data/mock';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

export function CalculPage() {
  const { cycle, variables, statuses, prevNet, setPhase } = usePayrollCycle();
  const { toast } = useToast();
  const [ran, setRan] = useState(false);
  const [explainId, setExplainId] = useState<string | null>(null);
  const rows = useMemo(() => cycleBulletins(variables, statuses, prevNet), [variables, statuses, prevNet]);
  const explainEmp = explainId ? employeeById(explainId) : undefined;
  const totals = useMemo(() => cycleTotals(rows), [rows]);
  const anomalies = rows.filter((r) => r.bulletin.anomalies.length > 0);

  const launch = () => {
    setRan(true);
    setPhase('validation');
    toast({ variant: 'success', title: 'Calcul terminé', description: `${rows.length} bulletins calculés · ${totals.blocking} bloquant(s).` });
  };

  return (
    <div className="animate-fade-up space-y-5">
      {explainEmp && <ExplainCalculModal emp={explainEmp} variables={variables[explainEmp.id]} onClose={() => setExplainId(null)} />}
      <PaieSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Calcul de paie</h1>
          <p className="text-sm font-medium text-ink-500">Cycle {cycle.label} · moteur déterministe (Money entier, jamais de LLM)</p>
        </div>
        <Button size="sm" onClick={launch}><Play size={14} /> Lancer le calcul</Button>
      </div>

      <Card className="glass-amber">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber/15 text-amber-deep"><Cpu size={20} /></span>
            <div>
              <p className="text-sm font-bold text-ink">{ran ? 'Calcul terminé' : 'Prêt à calculer'}</p>
              <p className="text-[12px] font-medium text-ink-500">{rows.length} collaborateurs · {ran ? '100' : '0'} % traité</p>
            </div>
          </div>
          <ProgressBar value={ran ? 100 : 0} className="w-56" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Bulletins" value={String(rows.length)} unit="calculés" icon={Calculator} tone="amber" />
        <StatCard label="Masse brute" value={`${(totals.brut / 1e6).toFixed(1)} M`} unit="XOF" mono icon={CheckCircle2} />
        <StatCard label="Anomalies" value={String(totals.anomalies)} unit="détectées" icon={AlertTriangle} tone={totals.anomalies ? 'amber' : 'default'} />
        <StatCard label="Bloquants" value={String(totals.blocking)} unit="à résoudre" icon={ShieldCheck} />
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Résultats par collaborateur" subtitle="Brut · cotisations · net · anomalies" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2.5 text-left">Collaborateur</th>
              <th className="px-3 py-2.5 text-right">Brut</th>
              <th className="px-3 py-2.5 text-right">Cotisations</th>
              <th className="px-3 py-2.5 text-right">Net</th>
              <th className="px-3 py-2.5 text-center">État</th>
              <th className="px-3 py-2.5 text-right" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.emp.id}>
                  <td className="px-4 py-2.5"><p className="text-[13px] font-semibold text-ink">{employeeName(r.emp)}</p><p className="text-[11px] text-ink-400">{r.emp.role}</p></td>
                  <td className="mono px-3 py-2.5 text-right text-ink-700">{fmt(r.bulletin.brutTotal)}</td>
                  <td className="mono px-3 py-2.5 text-right text-danger">-{fmt(r.bulletin.totalCotisationsEmp + r.bulletin.totalRetenues)}</td>
                  <td className="mono px-3 py-2.5 text-right font-bold text-ink">{fmt(r.bulletin.netAPayer)}</td>
                  <td className="px-3 py-2.5 text-center">{r.bulletin.emissionBlocked ? <StatusPill tone="danger" dot={false}>Bloqué</StatusPill> : r.bulletin.anomalies.length ? <StatusPill tone="warn" dot={false}>Anomalie</StatusPill> : <StatusPill tone="ok" dot={false}>OK</StatusPill>}</td>
                  <td className="px-3 py-2.5 text-right"><Button variant="ghost" size="sm" onClick={() => setExplainId(r.emp.id)}>Expliquer</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {anomalies.length > 0 && (
        <Card className="border-warn/25">
          <CardHeader title="Anomalies détectées" action={<AlertTriangle size={16} className="text-warn" />} />
          <div className="space-y-1.5">
            {anomalies.map((a) => (
              <div key={a.emp.id} className="rounded-xl bg-warn/[0.06] px-3 py-2">
                <p className="text-[13px] font-semibold text-ink">{employeeName(a.emp)}</p>
                {a.bulletin.anomalies.map((an) => <p key={an.code} className="text-[11px] font-medium text-warn">{an.message}{an.blocking ? ' (bloquant)' : ''}</p>)}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
