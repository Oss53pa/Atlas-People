import { useMemo } from 'react';
import { Landmark, FileCheck2, Send } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { usePayrollCycle } from '../../store/usePayrollCycle';
import { cycleBulletins, recapByRubrique } from '../../lib/m3/cycle';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

export function DeclarationsPage() {
  const { cycle, variables, statuses, prevNet } = usePayrollCycle();
  const { toast } = useToast();
  const recap = useMemo(() => recapByRubrique(cycleBulletins(variables, statuses, prevNet)), [variables, statuses, prevNet]);
  const sum = (codes: string[]) => recap.filter((r) => codes.some((c) => r.code.startsWith(c))).reduce((s, r) => s + Math.abs(r.total), 0);

  const cnps = sum(['CNPS_RET', 'CNPS_PF', 'CNPS_AT']);
  const igr = sum(['IGR']);
  const fdfp = sum(['FDFP']);

  const decls = [
    { code: 'COTIS_CNPS', org: 'CNPS', label: 'Cotisations sociales mensuelles', period: cycle.label, base: cnps, periodicite: 'Mensuelle', status: 'generated' as const },
    { code: 'DAS_ITS', org: 'DGI', label: 'Déclaration ITS / IRPP', period: cycle.label, base: igr, periodicite: 'Mensuelle', status: 'generated' as const },
    { code: 'FDFP_FC', org: 'FDFP', label: 'Formation continue FDFP', period: cycle.label, base: fdfp, periodicite: 'Mensuelle', status: 'generated' as const },
    { code: 'DISA_CNPS', org: 'CNPS', label: 'DISA — déclaration annuelle des salaires', period: '2026', base: 0, periodicite: 'Annuelle', status: 'pending' as const },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Déclarations sociales & fiscales</h1>
        <p className="text-sm font-medium text-ink-500">Cycle {cycle.label} · CNPS, DGI, FDFP (Côte d'Ivoire) · dépôt horodaté + accusé conservé (R13)</p>
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Déclarations du cycle" className="mb-0" action={<Landmark size={16} className="text-ink-400" />} /></div>
        <div className="divide-y divide-line">
          {decls.map((d) => (
            <div key={d.code} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><FileCheck2 size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{d.label}</p>
                <p className="text-[11px] font-medium text-ink-400">{d.org} · {d.code} · {d.periodicite} · {d.period}</p>
              </div>
              <span className="mono text-sm font-bold text-ink">{fmt(d.base)} FCFA</span>
              <StatusPill tone={d.status === 'generated' ? 'amber' : 'neutral'} dot={false}>{d.status === 'generated' ? 'Générée' : 'À venir'}</StatusPill>
              <Button variant="outline" size="sm" disabled={d.status !== 'generated'} onClick={() => toast({ variant: 'success', title: 'Dépôt', description: `${d.code} déposée — accusé conservé.` })}><Send size={13} /> Déposer</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
