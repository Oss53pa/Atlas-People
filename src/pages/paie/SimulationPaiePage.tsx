import { useMemo, useState } from 'react';
import { FlaskConical, RotateCcw, UserSearch, AlertTriangle, ShieldCheck, ArrowRight, Cpu, ArrowDownToLine, ArrowUpFromLine, Target } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { computeM3Bulletin } from '../../lib/m3/engine';
import { REGIMES } from '../../lib/payroll/regimes';
import { employeeName, type EmployeeRecord } from '../../data/mock';
import { useRoster } from '../../lib/m1/roster';
import { Money, type Currency } from '../../lib/money';
import type { PayrollVariables, BulletinRow, BulletinViewer } from '../../lib/m3/types';
import { cn } from '../../lib/cn';

interface SimState {
  countryCode: string;
  baseSalary: number;
  taxableAllowances: number;
  nonTaxableAllowances: number;
  fiscalParts: number;
  hs15: number;
  hs50: number;
  avance: number;
  joursOuvrables: number;
  joursTravailles: number;
  applyProrata: boolean;
}

const DEFAULT_SIM: SimState = {
  countryCode: 'CI', baseSalary: 350_000, taxableAllowances: 50_000, nonTaxableAllowances: 30_000,
  fiscalParts: 1, hs15: 0, hs50: 0, avance: 0, joursOuvrables: 22, joursTravailles: 22, applyProrata: false,
};

const fmtC = (n: number, c: Currency) => Money.of(Math.round(n), c).format();

/** Sens du calcul : descendant = du salaire de base vers le net ; remontant = du net cible vers le salaire de base. */
type SimDirection = 'down' | 'up';

function buildBulletin(s: SimState): BulletinViewer {
  const emp: EmployeeRecord = {
    id: 'SIM', firstName: 'Profil', lastName: 'simulé', role: 'Simulation', department: '—',
    countryCode: s.countryCode, email: '', contractType: 'CDI', hireDate: '2020-01-01', status: 'active',
    baseSalary: Math.max(0, s.baseSalary), taxableAllowances: Math.max(0, s.taxableAllowances),
    nonTaxableAllowances: Math.max(0, s.nonTaxableAllowances), fiscalParts: Math.max(1, s.fiscalParts),
    retentionAttention: 0,
  };
  const v: PayrollVariables = {
    joursOuvrables: Math.max(1, s.joursOuvrables), joursTravailles: Math.max(0, s.joursTravailles),
    applyProrata: s.applyProrata, hs15: Math.max(0, s.hs15), hs50: Math.max(0, s.hs50),
    primes: [], retenues: [], ndf: [], avance: Math.max(0, s.avance), notes: '',
  };
  return computeM3Bulletin(emp, v);
}

/** Net à payer obtenu pour un salaire de base donné (les autres paramètres restent constants). */
function netForBase(s: SimState, base: number): number {
  return buildBulletin({ ...s, baseSalary: Math.max(0, Math.round(base)) }).netAPayer;
}

/**
 * Inversion « net → salaire de base » : le moteur est monotone croissant
 * (plus de base ⇒ plus de net), donc une recherche dichotomique converge.
 * On reste 100 % déterministe — c'est le même moteur que le sens descendant.
 */
function solveBaseForNet(s: SimState, targetNet: number): { base: number; reached: number; exact: boolean } {
  if (targetNet <= 0) return { base: 0, reached: netForBase(s, 0), exact: netForBase(s, 0) === 0 };
  let lo = 0;
  let hi = Math.max(targetNet * 2, 500_000);
  // élargit la borne haute tant que le net atteignable reste sous la cible
  for (let g = 0; g < 40 && netForBase(s, hi) < targetNet; g++) hi *= 2;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const net = netForBase(s, mid);
    if (net < targetNet) lo = mid;
    else hi = mid;
    if (hi - lo <= 1) break;
  }
  const base = Math.round(hi); // borne haute = plus petit base atteignant la cible
  const reached = netForBase(s, base);
  return { base, reached, exact: Math.abs(reached - targetNet) <= 1 };
}

export function SimulationPaiePage() {
  const { toast } = useToast();
  const roster = useRoster();
  const [sim, setSim] = useState<SimState>(DEFAULT_SIM);
  const [direction, setDirection] = useState<SimDirection>('down');
  const [targetNet, setTargetNet] = useState(300_000);

  // En mode remontant, on reconstitue le salaire de base depuis le net cible.
  const solved = useMemo(
    () => (direction === 'up' ? solveBaseForNet(sim, targetNet) : null),
    [direction, sim, targetNet],
  );
  const effectiveSim = solved ? { ...sim, baseSalary: solved.base } : sim;
  const bulletin = useMemo(() => buildBulletin(effectiveSim), [effectiveSim]);
  const currency = bulletin.currency;
  const regime = REGIMES[sim.countryCode];

  const set = <K extends keyof SimState>(k: K, val: SimState[K]) => setSim((p) => ({ ...p, [k]: val }));
  const num = (k: keyof SimState) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, (Number(e.target.value) || 0) as never);

  const loadEmployee = (id: string) => {
    const emp = roster.find((e) => e.id === id);
    if (!emp) return;
    setSim((p) => ({
      ...p, countryCode: emp.countryCode, baseSalary: emp.baseSalary,
      taxableAllowances: emp.taxableAllowances, nonTaxableAllowances: emp.nonTaxableAllowances,
      fiscalParts: emp.fiscalParts,
    }));
    toast({ variant: 'info', title: 'Profil chargé', description: `${employeeName(emp)} — simulation (aucune donnée modifiée sur le dossier).` });
  };

  const Section = ({ title, rows, sign }: { title: string; rows: BulletinRow[]; sign?: '-' }) => (
    rows.length === 0 ? null : (
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-400">{title}</p>
        <div className="divide-y divide-line rounded-xl border border-line">
          {rows.map((r) => (
            <div key={r.code} className="flex items-center justify-between gap-2 px-3 py-1.5">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-ink">{r.label}</p>
                {(r.base !== undefined || r.taux !== undefined) && (
                  <p className="mono text-[10px] text-ink-400">{r.base !== undefined ? fmtC(r.base, currency) : ''}{r.taux !== undefined ? ` · ${r.taux} %` : ''}</p>
                )}
              </div>
              <span className={cn('mono shrink-0 text-[12px] font-semibold', sign === '-' ? 'text-danger' : 'text-ink-700')}>{sign === '-' ? '-' : ''}{fmtC(Math.abs(r.montant), currency)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  );

  const Field = ({ label, k, step }: { label: string; k: keyof SimState; step?: number }) => (
    <label className="block">
      <span className="text-[11px] font-semibold text-ink-500">{label}</span>
      <input type="number" step={step ?? 1000} value={sim[k] as number} onChange={num(k)}
        className="mono mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-amber/30" />
    </label>
  );

  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Simulation de paie</h1>
          <p className="text-sm font-medium text-ink-500">Bac à sable « what-if » · moteur déterministe · aucune écriture sur les dossiers</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSim(DEFAULT_SIM)}><RotateCcw size={14} /> Réinitialiser</Button>
      </div>

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Cpu size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Le simulateur utilise exactement le même moteur que la paie réelle (Money entier, jamais de LLM), dans les deux sens : <strong>du salaire de base vers le net</strong> (descendant) ou <strong>du net cible vers le salaire de base</strong> (remontant, par inversion déterministe). Idéal pour chiffrer une augmentation, un net garanti ou un recrutement avant engagement.</p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ENTRÉES */}
        <Card>
          <CardHeader title="Paramètres de simulation" action={<FlaskConical size={16} className="text-amber-deep" />} />
          <div className="space-y-3">
            {/* Sens du calcul : descendant (salaire → net) / remontant (net → salaire) */}
            <div>
              <span className="text-[11px] font-semibold text-ink-500">Sens du calcul</span>
              <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface2 p-1">
                <button type="button" onClick={() => setDirection('down')}
                  className={cn('flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition-colors',
                    direction === 'down' ? 'bg-amber-deep text-white shadow-sm' : 'text-ink-500 hover:text-ink')}>
                  <ArrowDownToLine size={13} /> Salaire → Net
                </button>
                <button type="button" onClick={() => setDirection('up')}
                  className={cn('flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition-colors',
                    direction === 'up' ? 'bg-amber-deep text-white shadow-sm' : 'text-ink-500 hover:text-ink')}>
                  <ArrowUpFromLine size={13} /> Net → Salaire
                </button>
              </div>
              <p className="mt-1 text-[10px] font-medium text-ink-400">
                {direction === 'down'
                  ? 'Descendant : saisissez le salaire de base, le moteur calcule le net à payer.'
                  : 'Remontant : saisissez le net cible, le moteur reconstitue le salaire de base brut.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] font-semibold text-ink-500">Pays / régime</span>
                <select value={sim.countryCode} onChange={(e) => set('countryCode', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-amber/30">
                  {Object.values(REGIMES).map((r) => <option key={r.countryCode} value={r.countryCode}>{r.countryName} ({r.socialFund})</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-ink-500">Charger un collaborateur</span>
                <select value="" onChange={(e) => e.target.value && loadEmployee(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-amber/30">
                  <option value="">— profil libre —</option>
                  {roster.map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}
                </select>
              </label>
            </div>
            {direction === 'down' ? (
              <Field label="Salaire de base" k="baseSalary" />
            ) : (
              <div className="space-y-2">
                <label className="block">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-500"><Target size={11} className="text-amber-deep" /> Net à payer cible</span>
                  <input type="number" step={1000} value={targetNet}
                    onChange={(e) => setTargetNet(Math.max(0, Number(e.target.value) || 0))}
                    className="mono mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-amber/30" />
                </label>
                {solved && (
                  <div className={cn('flex items-center justify-between rounded-xl px-3 py-2', solved.exact ? 'bg-amber/[0.08]' : 'bg-warn/[0.08]')}>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-deep"><ArrowUpFromLine size={12} /> Salaire de base reconstitué</span>
                    <span className="mono text-sm font-bold text-ink">{fmtC(solved.base, currency)}</span>
                  </div>
                )}
                {solved && !solved.exact && (
                  <p className="text-[10px] font-medium text-warn">Net atteignable le plus proche : {fmtC(solved.reached, currency)} (arrondis entiers du moteur).</p>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Primes imposables" k="taxableAllowances" />
              <Field label="Indemnités non imposables" k="nonTaxableAllowances" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Parts fiscales" k="fiscalParts" step={0.5} />
              <Field label="Heures sup. 15 %" k="hs15" step={1} />
              <Field label="Heures sup. 50 %" k="hs50" step={1} />
            </div>
            <Field label="Avance à déduire" k="avance" />
            <div className="rounded-xl bg-surface2 p-3">
              <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink-700">
                <input type="checkbox" checked={sim.applyProrata} onChange={(e) => set('applyProrata', e.target.checked)} className="accent-amber-deep" /> Appliquer le prorata (entrée/sortie en cours de mois)
              </label>
              {sim.applyProrata && (
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <Field label="Jours ouvrables" k="joursOuvrables" step={1} />
                  <Field label="Jours travaillés" k="joursTravailles" step={1} />
                </div>
              )}
            </div>
            {regime && <p className="text-[11px] font-medium text-ink-400">Régime {regime.countryName} · config v{regime.version} · en vigueur {regime.effectiveFrom}</p>}
          </div>
        </Card>

        {/* RÉSULTAT */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Brut total" value={fmtC(bulletin.brutTotal, currency)} mono icon={ArrowRight} tone="amber" />
            <StatCard label="Net à payer" value={fmtC(bulletin.netAPayer, currency)} mono icon={ShieldCheck} />
            <StatCard label="Net imposable" value={fmtC(bulletin.baseIrpp, currency)} mono icon={ArrowRight} />
            <StatCard label="Coût employeur" value={fmtC(bulletin.coutEmployeur, currency)} mono icon={UserSearch} />
          </div>

          {bulletin.anomalies.length > 0 && (
            <Card className="border-warn/25">
              <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-warn"><AlertTriangle size={13} /> Contrôles</p>
              <div className="space-y-1">
                {bulletin.anomalies.map((a) => (
                  <p key={a.code} className={cn('text-[12px] font-medium', a.severity === 'danger' ? 'text-danger' : 'text-warn')}>{a.message}{a.blocking ? ' (bloquant)' : ''}</p>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Bulletin simulé" subtitle={`${currency} · prorata ${(bulletin.proRataPct * 100).toFixed(0)} %`} className="mb-3"
              action={bulletin.emissionBlocked ? <StatusPill tone="danger" dot={false}>Non émissible</StatusPill> : <StatusPill tone="ok" dot={false}>Conforme</StatusPill>} />
            <div className="space-y-3">
              <Section title="Gains" rows={bulletin.gains} />
              <Section title="Cotisations salariales & impôt" rows={bulletin.cotisationsEmp} sign="-" />
              <Section title="Retenues diverses" rows={bulletin.retenues} sign="-" />
              <Section title="Charges patronales" rows={bulletin.patronal} />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-amber/[0.06] px-3 py-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-amber-deep">Net à payer</span>
              <span className="mono text-base font-bold text-ink">{fmtC(bulletin.netAPayer, currency)}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
