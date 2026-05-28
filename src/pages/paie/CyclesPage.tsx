import { Link } from 'react-router-dom';
import { CalendarRange, Plus, Lock, ArrowRight } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { usePayrollCycle } from '../../store/usePayrollCycle';
import { EMPLOYEES } from '../../data/mock';

const HISTORY = [
  { period: 'Avril 2026', status: 'closed', net: '14,2 M', collab: 14 },
  { period: 'Mars 2026', status: 'closed', net: '13,9 M', collab: 14 },
  { period: 'Février 2026', status: 'closed', net: '13,7 M', collab: 13 },
];

export function CyclesPage() {
  const { cycle } = usePayrollCycle();
  const { toast } = useToast();
  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Cycles de paie</h1>
          <p className="text-sm font-medium text-ink-500">{cycle.companyLabel} · un cycle mensuel en 7 étapes</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Ouverture de cycle', description: 'Le cycle de juin 2026 pourra être ouvert après clôture de mai.' })}><Plus size={14} /> Ouvrir un cycle</Button>
      </div>

      <Card>
        <CardHeader title="Cycle en cours" action={<StatusPill tone="amber" dot={false}>Saisie</StatusPill>} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><CalendarRange size={20} /></span>
            <div>
              <p className="text-base font-bold text-ink">{cycle.label}</p>
              <p className="text-[12px] font-medium text-ink-400">{EMPLOYEES.length} collaborateurs · clôture saisie {new Date(`${cycle.deadlineSaisie}T00:00:00`).toLocaleDateString('fr-FR')} · paie {new Date(`${cycle.payDate}T00:00:00`).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          <Link to="/paie/saisie"><Button size="sm">Ouvrir le cycle <ArrowRight size={14} /></Button></Link>
        </div>
      </Card>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Historique des cycles" subtitle="Cycles clôturés (immuables)" className="mb-0" /></div>
        <div className="divide-y divide-line">
          {HISTORY.map((h) => (
            <div key={h.period} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface2 text-ink-400"><Lock size={15} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{h.period}</p>
                <p className="text-[11px] font-medium text-ink-400">{h.collab} bulletins · net {h.net} FCFA</p>
              </div>
              <StatusPill tone="ok" dot={false}>Clôturé</StatusPill>
              <Button variant="ghost" size="sm">Consulter</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
