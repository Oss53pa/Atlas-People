import { useMemo, useState } from 'react';
import { Search, FileText, Download } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { PayslipModal } from '../../components/payroll/PayslipModal';
import { usePayrollCycle } from '../../store/usePayrollCycle';
import { computePayslip, getRegime } from '../../lib/payroll';
import { EMPLOYEES, employeeById, employeeName, type EmployeeRecord } from '../../data/mock';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

export function BulletinsPage() {
  const { cycle, statuses } = usePayrollCycle();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EMPLOYEES.filter((e) => !q || `${employeeName(e)} ${e.role}`.toLowerCase().includes(q));
  }, [query]);

  const computationFor = (emp: EmployeeRecord) => computePayslip(
    { baseSalary: emp.baseSalary, taxableAllowances: emp.taxableAllowances, nonTaxableAllowances: emp.nonTaxableAllowances, fiscalParts: emp.fiscalParts, otherDeductions: emp.otherDeductions },
    getRegime(emp.countryCode), employeeName(emp),
  );

  const selected = open ? employeeById(open) : undefined;

  return (
    <div className="animate-fade-up space-y-5">
      {selected && <PayslipModal employee={selected} computation={computationFor(selected)} period={cycle.label} onClose={() => setOpen(null)} />}
      <PaieSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Bulletins</h1>
          <p className="text-sm font-medium text-ink-500">Cycle {cycle.label} · consultation & archivage (conservation 10 ans)</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un bulletin…"
            className="h-10 w-64 rounded-xl border border-line bg-surface2 pl-9 pr-3 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none" />
        </div>
      </div>

      <Card inset={false}>
        <div className="divide-y divide-line">
          {list.map((e) => {
            const comp = computationFor(e);
            const net = Money.fromJSON({ units: comp.result.netToPayUnits, currency: 'XOF' }).toInt();
            return (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><FileText size={16} /></span>
                <Avatar name={employeeName(e)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{employeeName(e)}</p>
                  <p className="text-[11px] font-medium text-ink-400">{e.role} · bulletin {cycle.label}</p>
                </div>
                <span className="mono text-sm font-bold text-ink">{fmt(net)} FCFA</span>
                {['seized', 'locked'].includes(statuses[e.id]) ? <StatusPill tone="ok" dot={false}>Calculé</StatusPill> : <StatusPill tone="neutral" dot={false}>Brouillon</StatusPill>}
                <Button variant="outline" size="sm" onClick={() => setOpen(e.id)}><FileText size={14} /> Voir</Button>
                <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'success', title: 'Téléchargement', description: `Bulletin ${employeeName(e)} ${cycle.label}.pdf` })}><Download size={14} /></Button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
