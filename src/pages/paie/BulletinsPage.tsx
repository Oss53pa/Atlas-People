import { useMemo, useState } from 'react';
import { Search, FileText, Download, Wifi, ChevronDown } from 'lucide-react';
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
import { usePayrollBulletins, usePayrollCycles, isBackendConfigured } from '../../lib/m3/supabaseLive';
import { useAuth } from '../../lib/auth';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

const STATUS_TONE_B: Record<string, 'ok' | 'amber' | 'neutral' | 'warn'> = {
  calculated: 'amber', validated_n1: 'warn', validated_n2: 'warn',
  signed: 'ok', diffused: 'ok', closed: 'neutral', draft: 'neutral',
};

export function BulletinsPage() {
  const { cycle, statuses } = usePayrollCycle();
  const { toast } = useToast();
  const { tenantId } = useAuth();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>(undefined);
  const { data: liveCycles } = usePayrollCycles(tenantId ?? undefined);
  const { data: liveBulletins, isLoading: loadingBulletins } = usePayrollBulletins(tenantId ?? undefined, selectedCycleId);

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
          <p className="text-sm font-medium text-ink-500">
            {isBackendConfigured && liveBulletins ? (
              <><span className="inline-flex items-center gap-1 text-emerald-600 font-bold"><Wifi size={10} /> {liveBulletins.length} bulletins en DB</span> · conservation 10 ans</>
            ) : `Cycle ${cycle.label} · consultation & archivage (conservation 10 ans)`}
          </p>
        </div>
        <div className="flex gap-2">
          {isBackendConfigured && liveCycles && liveCycles.length > 0 && (
            <div className="relative">
              <select value={selectedCycleId ?? ''} onChange={(e) => setSelectedCycleId(e.target.value || undefined)}
                className="h-10 rounded-xl border border-line bg-surface2 px-3 pr-8 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none appearance-none">
                <option value="">Tous les cycles</option>
                {liveCycles.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-400" />
            </div>
          )}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un bulletin…"
              className="h-10 w-52 rounded-xl border border-line bg-surface2 pl-9 pr-3 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none" />
          </div>
        </div>
      </div>

      {/* LIVE bulletins */}
      {isBackendConfigured && liveBulletins && liveBulletins.length > 0 ? (
        <Card inset={false}>
          <div className="divide-y divide-line">
            {liveBulletins
              .filter((b) => !query || `${b.employee_first_name} ${b.employee_last_name}`.toLowerCase().includes(query.toLowerCase()))
              .map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><FileText size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{b.employee_first_name} {b.employee_last_name}</p>
                    <p className="text-[11px] font-medium text-ink-400">{b.employee_department} · {b.numero}</p>
                  </div>
                  <span className="mono text-sm font-bold text-ink">{fmt(b.net_a_payer)} FCFA</span>
                  <StatusPill tone={STATUS_TONE_B[b.status] ?? 'neutral'} dot={false}>{b.status}</StatusPill>
                  <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'success', title: 'Téléchargement', description: `${b.numero}.pdf` })}><Download size={14} /></Button>
                </div>
              ))}
          </div>
        </Card>
      ) : (

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
      )}
    </div>
  );
}
