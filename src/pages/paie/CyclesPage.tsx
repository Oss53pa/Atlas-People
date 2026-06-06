/**
 * CyclesPage — liste des cycles de paie, live-first Supabase.
 */
import { Link } from 'react-router-dom';
import { CalendarRange, Plus, Lock, ArrowRight, Wifi, RefreshCw } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { usePayrollCycle } from '../../store/usePayrollCycle';
import { usePayrollCycles, isBackendConfigured } from '../../lib/m3/supabaseLive';
import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/cn';

const STATUS_LABEL: Record<string, { label: string; tone: 'amber' | 'ok' | 'neutral' | 'warn' }> = {
  open:        { label: 'Ouvert', tone: 'amber' },
  preparation: { label: 'Préparation', tone: 'amber' },
  calculation: { label: 'Calcul', tone: 'amber' },
  validation:  { label: 'Validation', tone: 'warn' },
  diffusion:   { label: 'Diffusion', tone: 'warn' },
  payment:     { label: 'Virements', tone: 'amber' },
  closed:      { label: 'Clôturé', tone: 'ok' },
  archived:    { label: 'Archivé', tone: 'neutral' },
};

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n / 1_000_000) * 1_000_000 / 1_000_000) + ' M';

export function CyclesPage() {
  const { cycle } = usePayrollCycle();
  const { tenantId } = useAuth();
  const { toast } = useToast();
  const { data: liveCycles, isLoading, refetch } = usePayrollCycles(tenantId ?? undefined);

  const cycles = liveCycles ?? [];
  const openCycles = cycles.filter((c) => !['closed', 'archived'].includes(c.status));
  const closedCycles = cycles.filter((c) => ['closed', 'archived'].includes(c.status));

  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Cycles de paie</h1>
          <p className="text-sm font-medium text-ink-500">
            {cycle.companyLabel} · un cycle mensuel en 7 étapes
            {isBackendConfigured && !isLoading && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                <Wifi size={9} /> {cycles.length} cycles en DB
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {isBackendConfigured && (
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw size={13} /> Rafraîchir
            </Button>
          )}
          <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Ouverture de cycle', description: 'Fonctionnalité disponible avec le module M3 complet.' })}>
            <Plus size={14} /> Ouvrir un cycle
          </Button>
        </div>
      </div>

      {/* Cycles actifs */}
      {openCycles.length > 0 ? (
        <div className="space-y-3">
          {openCycles.map((c) => {
            const st = STATUS_LABEL[c.status] ?? { label: c.status, tone: 'neutral' as const };
            return (
              <Card key={c.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber/12 text-amber-deep">
                      <CalendarRange size={20} />
                    </span>
                    <div>
                      <p className="text-base font-bold text-ink">{c.label}</p>
                      <p className="text-[12px] font-medium text-ink-400">
                        {c.headcount} collaborateurs · {c.country_code}
                        {c.pay_date && ` · paie le ${new Date(c.pay_date + 'T00:00').toLocaleDateString('fr-FR')}`}
                      </p>
                      {(c.total_brut > 0) && (
                        <p className="text-[11px] text-ink-500 mt-0.5">
                          Brut : {fmt(c.total_brut)} · Net : {fmt(c.total_net)} · Coût : {fmt(c.total_cout_employeur)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill>
                    <Link to="/paie/saisie">
                      <Button size="sm">Ouvrir le cycle <ArrowRight size={14} /></Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : !isBackendConfigured ? (
        <Card>
          <CardHeader title="Cycle en cours" action={<StatusPill tone="amber" dot={false}>Saisie</StatusPill>} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><CalendarRange size={20} /></span>
              <div>
                <p className="text-base font-bold text-ink">{cycle.label}</p>
                <p className="text-[12px] font-medium text-ink-400">14 collaborateurs · clôture saisie {new Date(`${cycle.deadlineSaisie}T00:00:00`).toLocaleDateString('fr-FR')} · paie {new Date(`${cycle.payDate}T00:00:00`).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <Link to="/paie/saisie"><Button size="sm">Ouvrir le cycle <ArrowRight size={14} /></Button></Link>
          </div>
        </Card>
      ) : null}

      {/* Historique clôturé */}
      {(closedCycles.length > 0 || !isBackendConfigured) && (
        <Card inset={false}>
          <div className="p-5 pb-2">
            <CardHeader title="Historique des cycles" subtitle="Cycles clôturés (immuables)" className="mb-0" />
          </div>
          <div className="divide-y divide-line">
            {isBackendConfigured ? closedCycles.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface2 text-ink-400"><Lock size={15} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{c.label}</p>
                  <p className="text-[11px] font-medium text-ink-400">
                    {c.headcount} bulletins{c.total_net > 0 ? ` · net ${fmt(c.total_net)} FCFA` : ''}
                  </p>
                </div>
                <StatusPill tone="ok" dot={false}>Clôturé</StatusPill>
                <Link to="/paie/bulletins"><Button variant="ghost" size="sm">Consulter</Button></Link>
              </div>
            )) : (
              [{ period: 'Mars 2026', net: '13,9 M', collab: 14 }, { period: 'Février 2026', net: '13,7 M', collab: 14 }].map((h) => (
                <div key={h.period} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface2 text-ink-400"><Lock size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{h.period}</p>
                    <p className="text-[11px] font-medium text-ink-400">{h.collab} bulletins · net {h.net} FCFA</p>
                  </div>
                  <StatusPill tone="ok" dot={false}>Clôturé</StatusPill>
                  <Button variant="ghost" size="sm">Consulter</Button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
