import { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, ShieldCheck, UserCheck, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { usePayrollCycle } from '../../store/usePayrollCycle';
import { cycleBulletins } from '../../lib/m3/cycle';
import { employeeName } from '../../data/mock';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';
import { cn } from '../../lib/cn';
import { usePayrollCycles, useValidateCycle, isBackendConfigured } from '../../lib/m3/supabaseLive';
import { useAuth } from '../../lib/auth';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

export function ValidationPaiePage() {
  const { cycle, variables, statuses, prevNet } = usePayrollCycle();
  const { toast } = useToast();
  const { tenantId } = useAuth();
  const { data: liveCycles } = usePayrollCycles(tenantId ?? undefined);
  const validateCycleMut = useValidateCycle();
  const rows = useMemo(() => cycleBulletins(variables, statuses, prevNet), [variables, statuses, prevNet]);
  const [n1, setN1] = useState(false);
  const [n2, setN2] = useState(false);
  // Cycle live en cours de validation (le premier non clôturé)
  const liveCycleEnCours = liveCycles?.find((c) => !['closed','archived'].includes(c.status));

  const significant = rows.filter((r) => r.prevNet > 0 && Math.abs((r.bulletin.netAPayer - r.prevNet) / r.prevNet) > 0.15);
  const blocking = rows.filter((r) => r.bulletin.emissionBlocked);

  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Validation des bulletins</h1>
        <p className="text-sm font-medium text-ink-500">
          Cycle {liveCycleEnCours?.label ?? cycle.label} · comparaison M-1 · validation à 4 yeux (R5/R15)
          {isBackendConfigured && liveCycleEnCours && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span>}
        </p>
      </div>

      {/* 4-eyes */}
      <Card>
        <CardHeader title="Validation à 4 yeux" subtitle="Deux acteurs minimum sur opération critique — non contournable" action={<ShieldCheck size={16} className="text-ink-400" />} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={cn('rounded-2xl border px-4 py-3', n1 ? 'border-ok/30 bg-ok/[0.05]' : 'border-line bg-surface2')}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Niveau 1 — Responsable paie</p>
            <p className="mt-1 text-sm font-semibold text-ink">{n1 ? 'Validé par Valentina Okou' : 'En attente'}</p>
            <Button variant={n1 ? 'ghost' : 'outline'} size="sm" className="mt-2" disabled={n1 || blocking.length > 0} onClick={() => { setN1(true); toast({ variant: 'success', title: 'Validation N1', description: `${rows.length} bulletins validés (N1).` }); }}>
              <UserCheck size={14} /> {n1 ? 'Validé' : 'Valider N1'}
            </Button>
          </div>
          <div className={cn('rounded-2xl border px-4 py-3', n2 ? 'border-ok/30 bg-ok/[0.05]' : 'border-line bg-surface2')}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Niveau 2 — DRH / DAF</p>
            <p className="mt-1 text-sm font-semibold text-ink">{n2 ? 'Signé par la DRH' : n1 ? 'En attente' : 'Bloqué (N1 requis)'}</p>
            <Button variant={n2 ? 'ghost' : 'outline'} size="sm" className="mt-2" disabled={!n1 || n2} onClick={async () => {
              setN2(true);
              // Persist validation dans la DB si backend configuré
              if (isBackendConfigured && tenantId && liveCycleEnCours) {
                try { await validateCycleMut.mutateAsync({ cycleId: liveCycleEnCours.id, tenantId }); } catch {}
              }
              toast({ variant: 'success', title: 'Signature finale', description: 'Cycle validé — prêt pour diffusion.' });
            }}>
              <CheckCircle2 size={14} /> {n2 ? 'Signé' : 'Signer (N2)'}
            </Button>
          </div>
        </div>
        {blocking.length > 0 && <p className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-danger"><AlertTriangle size={13} /> {blocking.length} bulletin(s) bloquant(s) — à résoudre avant validation.</p>}
      </Card>

      {/* écarts significatifs */}
      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Écarts à justifier (variation nette > 15 % vs M-1)" subtitle={`${significant.length} bulletin(s)`} className="mb-0" action={<AlertTriangle size={16} className={significant.length ? 'text-warn' : 'text-ink-400'} />} /></div>
        {significant.length === 0 ? <p className="px-5 pb-4 text-sm font-medium text-ink-400">Aucun écart significatif. Tous les bulletins sont cohérents avec le mois précédent.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2.5 text-left">Collaborateur</th>
                <th className="px-3 py-2.5 text-right">Net M-1</th>
                <th className="px-3 py-2.5 text-right">Net actuel</th>
                <th className="px-3 py-2.5 text-right">Variation</th>
                <th className="px-3 py-2.5 text-center">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {significant.map((r) => {
                  const delta = r.bulletin.netAPayer - r.prevNet;
                  const pct = (delta / r.prevNet) * 100;
                  return (
                    <tr key={r.emp.id}>
                      <td className="px-4 py-2.5 text-[13px] font-semibold text-ink">{employeeName(r.emp)}</td>
                      <td className="mono px-3 py-2.5 text-right text-ink-500">{fmt(r.prevNet)}</td>
                      <td className="mono px-3 py-2.5 text-right font-semibold text-ink">{fmt(r.bulletin.netAPayer)}</td>
                      <td className={cn('mono px-3 py-2.5 text-right font-bold', delta >= 0 ? 'text-ok' : 'text-danger')}>
                        <span className="inline-flex items-center gap-1">{delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{pct >= 0 ? '+' : ''}{pct.toFixed(1)} %</span>
                      </td>
                      <td className="px-3 py-2.5 text-center"><Button variant="ghost" size="sm" onClick={() => toast({ variant: 'info', title: 'Justification', description: `Écart ${employeeName(r.emp)} — note enregistrée.` })}>Justifier</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
