import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Users, Landmark, Building2, CalendarClock, AlertTriangle, ArrowRight, PencilLine, Calculator, CheckCircle2, Banknote, Sparkles } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { ProgressBar } from '../../components/charts/ProgressBar';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { usePayrollCycle } from '../../store/usePayrollCycle';
import { cycleBulletins, cycleTotals } from '../../lib/m3/cycle';
import { EMPLOYEES } from '../../data/mock';

const PHASES = [
  { key: 'preparation', label: 'Préparation' },
  { key: 'calculation', label: 'Calcul' },
  { key: 'validation', label: 'Validation' },
  { key: 'diffusion', label: 'Diffusion' },
  { key: 'payment', label: 'Virements' },
  { key: 'closed', label: 'Clôture' },
];
const kfmt = (n: number) => `${(Math.round(n) / 1_000_000).toFixed(1)} M`;

export function CockpitPaiePage() {
  const { cycle, variables, statuses, prevNet } = usePayrollCycle();
  const rows = useMemo(() => cycleBulletins(variables, statuses, prevNet), [variables, statuses, prevNet]);
  const totals = useMemo(() => cycleTotals(rows), [rows]);
  const seized = EMPLOYEES.filter((e) => ['seized', 'locked'].includes(statuses[e.id])).length;
  const pct = Math.round((seized / EMPLOYEES.length) * 100);
  const phaseIdx = PHASES.findIndex((p) => p.key === cycle.phase);
  const alerts = rows.filter((r) => r.bulletin.anomalies.length > 0);

  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-deep">Module M3 · Paie & déclarations</p>
          <h1 className="text-2xl font-semibold text-ink">Cockpit paie</h1>
          <p className="text-sm font-medium text-ink-500">Cycle {cycle.label} · {cycle.companyLabel} · paie le {new Date(`${cycle.payDate}T00:00:00`).toLocaleDateString('fr-FR')}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/paie/saisie"><Button size="sm"><PencilLine size={14} /> Saisie variables</Button></Link>
          <Link to="/paie/calcul"><Button variant="outline" size="sm"><Calculator size={14} /> Calculer</Button></Link>
        </div>
      </div>

      {/* étapes du cycle */}
      <Card>
        <CardHeader title="Cycle en cours" subtitle={`Étape ${PHASES[phaseIdx]?.label ?? '—'} · ${seized}/${EMPLOYEES.length} collaborateurs saisis`} action={<StatusPill tone="amber" dot={false}>{cycle.label}</StatusPill>} />
        <div className="flex items-center gap-1">
          {PHASES.map((p, i) => (
            <div key={p.key} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-center">
                <div className={`h-1.5 flex-1 rounded-full ${i <= phaseIdx ? 'bg-amber' : 'bg-line'}`} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${i <= phaseIdx ? 'text-amber-deep' : 'text-ink-300'}`}>{p.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={pct} className="flex-1" />
          <span className="mono text-sm font-bold text-ink">{pct}%</span>
        </div>
      </Card>

      {/* KPI masse salariale */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Masse brute" value={kfmt(totals.brut)} unit="XOF" mono icon={Wallet} tone="amber" />
        <StatCard label="Net à payer" value={kfmt(totals.net)} unit="XOF" mono icon={Banknote} />
        <StatCard label="Coût employeur" value={kfmt(totals.coutEmployeur)} unit="XOF" mono icon={Building2} />
        <StatCard label="Effectif paie" value={String(EMPLOYEES.length)} unit="collab." icon={Users} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Avancement de la saisie" action={<Link to="/paie/saisie"><Button variant="ghost" size="sm">Ouvrir <ArrowRight size={13} /></Button></Link>} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(['seized', 'prefilled', 'to_seize', 'anomaly', 'locked'] as const).map((st) => {
              const n = EMPLOYEES.filter((e) => statuses[e.id] === st).length;
              const meta: Record<string, { label: string; tone: 'ok' | 'amber' | 'neutral' | 'warn' }> = {
                seized: { label: 'Saisis', tone: 'ok' }, prefilled: { label: 'Pré-remplis', tone: 'amber' },
                to_seize: { label: 'À saisir', tone: 'neutral' }, anomaly: { label: 'Anomalies', tone: 'warn' }, locked: { label: 'Verrouillés', tone: 'ok' },
              };
              return (
                <div key={st} className="rounded-xl border border-line bg-surface2 px-3 py-2.5">
                  <p className="mono text-xl font-bold text-ink">{n}</p>
                  <StatusPill tone={meta[st].tone} dot={false}>{meta[st].label}</StatusPill>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Alertes pré-paie" action={<AlertTriangle size={16} className={alerts.length ? 'text-warn' : 'text-ink-400'} />} />
          {alerts.length === 0 ? <p className="text-sm font-medium text-ink-400">Aucune anomalie détectée.</p> : (
            <div className="space-y-1.5">
              {alerts.slice(0, 5).map((a) => (
                <Link key={a.emp.id} to="/paie/saisie" className="block rounded-xl bg-warn/[0.06] px-3 py-2">
                  <p className="text-[13px] font-semibold text-ink">{a.emp.firstName} {a.emp.lastName}</p>
                  <p className="text-[11px] font-medium text-warn">{a.bulletin.anomalies[0].message}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link to="/paie/declarations"><Card className="card-hover"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><Landmark size={18} /></span><div><p className="text-sm font-bold text-ink">Déclarations sociales</p><p className="text-[11px] font-medium text-ink-400">CNPS · DGI · FDFP</p></div></div></Card></Link>
        <Link to="/paie/virements"><Card className="card-hover"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><Banknote size={18} /></span><div><p className="text-sm font-bold text-ink">Ordres de virement</p><p className="text-[11px] font-medium text-ink-400">Mobile Money · banques</p></div></div></Card></Link>
        <Link to="/paie/validation"><Card className="card-hover"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><CheckCircle2 size={18} /></span><div><p className="text-sm font-bold text-ink">Validation 4-eyes</p><p className="text-[11px] font-medium text-ink-400">{totals.blocking} bloquant(s)</p></div></div></Card></Link>
      </div>

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Sparkles size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Calculs 100 % déterministes (Money entier, jamais de LLM) · audit chaîné SHA-256 · cycle clôturé immuable · séparation des pouvoirs 4-eyes. <CalendarClock size={13} className="ml-1 inline text-ink-400" /> Clôture saisie {new Date(`${cycle.deadlineSaisie}T00:00:00`).toLocaleDateString('fr-FR')}.</p>
      </Card>
    </div>
  );
}
