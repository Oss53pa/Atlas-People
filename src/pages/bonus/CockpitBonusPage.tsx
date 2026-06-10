import { useMemo, useState } from 'react';
import {
  Wallet, Calculator, TrendingUp, AlertTriangle, Lock, Eye, Coins, SlidersHorizontal,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';
import type { ModeBonus } from '../../engine/bonus';
import { ENVELOPPE_DEFAUT, simulate } from '../../lib/bonus/mock';

const MODES: { key: ModeBonus; label: string; hint: string }[] = [
  { key: 'A_prorata', label: 'A — Prorata', hint: 'Σ = enveloppe (exact)' },
  { key: 'B_plafonnee', label: 'B — Plafonnée', hint: 'enveloppe = plafond, alerte si dépassement' },
  { key: 'C_libre', label: 'C — Libre', hint: 'enveloppe prévisionnelle' },
];

export function CockpitBonusPage() {
  const [montant, setMontant] = useState(ENVELOPPE_DEFAUT);
  const [mode, setMode] = useState<ModeBonus>('A_prorata');
  const [coef, setCoef] = useState(1);
  const [gated, setGated] = useState(false); // R6 : direction valide → affiché
  const [empSel, setEmpSel] = useState('e8');

  const sim = useMemo(() => simulate(montant, mode, coef), [montant, mode, coef]);
  const byId = useMemo(() => new Map(sim.result.lignes.map((l) => [l.employeId, l])), [sim]);
  const empLigne = byId.get(empSel);
  const empRow = sim.rows.find((r) => r.employeId === empSel);
  const emp = employeeById(empSel);

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Bonus — Simulation & pilotage</h1>
          <p className="text-sm font-medium text-ink-500">
            SCORE = score <b>validé</b> de la campagne (§9) · calcul déterministe <b>Money.ts</b> (zéro décimale, R5)
          </p>
        </div>
        <StatusPill tone={gated ? 'ok' : 'warn'} dot>
          {gated ? 'Enveloppe validée — affichée' : 'Non figé — masqué aux employés (R6)'}
        </StatusPill>
      </div>

      {/* Contrôles direction (what-if §8) */}
      <Card>
        <CardHeader title="Paramètres d'enveloppe (what-if)" subtitle="Ajustez sans rien figer ni afficher" action={<SlidersHorizontal size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Enveloppe (FCFA)</span>
            <input type="number" min={0} step={500_000} value={montant}
              onChange={(e) => setMontant(Math.max(0, Number(e.target.value)))}
              className="mono w-full rounded-lg border border-line bg-surface2/40 px-3 py-2 text-sm font-bold text-ink" />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Coefficient global ×{coef.toFixed(2)}</span>
            <input type="range" min={0.5} max={2} step={0.05} value={coef}
              onChange={(e) => setCoef(Number(e.target.value))} className="w-full accent-amber-deep" />
          </label>
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Mode d'articulation</span>
            <div className="flex flex-wrap gap-1">
              {MODES.map((m) => (
                <button key={m.key} onClick={() => setMode(m.key)} title={m.hint}
                  className={cn('rounded-lg px-2.5 py-1.5 text-[11px] font-semibold', mode === m.key ? 'bg-amber text-white' : 'border border-line bg-surface2/40 text-ink-500')}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Enveloppe" value={sim.result.enveloppe.format()} unit="FCFA" icon={Wallet} mono />
        <StatCard label="Total réparti" value={sim.result.total.format()} unit="FCFA" icon={Calculator} mono tone="amber" />
        {mode === 'B_plafonnee' ? (
          <StatCard label="Dépassement" value={sim.result.depassement ? 'OUI' : 'non'} unit={sim.result.depassement ? 'alerte' : 'dans l’enveloppe'} icon={AlertTriangle} tone={sim.result.depassement ? 'amber' : 'default'} />
        ) : (
          <StatCard label="Reliquat" value={sim.result.reliquat.format()} unit="FCFA non réparti" icon={Coins} mono tone={sim.result.reliquat.isZero() ? 'default' : 'amber'} />
        )}
        <StatCard label="Bénéficiaires" value={String(sim.result.lignes.length)} unit="employés" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Répartition */}
        <Card>
          <CardHeader title="Répartition simulée" subtitle={`Mode ${MODES.find((m) => m.key === mode)?.label} · ${MODES.find((m) => m.key === mode)?.hint}`} />
          <div className="space-y-1.5">
            {sim.rows
              .map((r) => ({ r, l: byId.get(r.employeId)! }))
              .sort((a, b) => b.l.final.toInt() - a.l.final.toInt())
              .map(({ r, l }) => {
                const e = employeeById(r.employeId);
                return (
                  <button key={r.employeId} onClick={() => setEmpSel(r.employeId)}
                    className={cn('w-full rounded-lg border px-3 py-2 text-left', empSel === r.employeId ? 'border-amber/40 bg-amber/[0.05]' : 'border-line bg-surface2/40')}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-ink">{e ? employeeName(e) : r.employeId}</p>
                        <p className="text-[10px] font-medium text-ink-400">SCORE validé {Math.round(r.scorePct)} % · brut {l.brut.format()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {l.borne && <StatusPill tone={l.borne === 'plafond' ? 'amber' : 'info'} dot={false}>{l.borne}</StatusPill>}
                        <span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[12px] font-bold text-amber-deep">{l.final.format()}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </Card>

        {/* Détail employé (vue gating) */}
        <div className="space-y-3">
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <CardHeader title="Vue employé" subtitle="Ce que voit le collaborateur" className="mb-0" />
              <button onClick={() => setGated((g) => !g)}
                className={cn('flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold', gated ? 'bg-ok/15 text-ok' : 'bg-warn/15 text-warn')}>
                {gated ? <Eye size={13} /> : <Lock size={13} />} {gated ? 'Validée' : 'Gating actif'}
              </button>
            </div>
            {!gated ? (
              <div className="rounded-xl border border-warn/25 bg-warn/[0.05] px-4 py-6 text-center">
                <Lock size={20} className="mx-auto mb-2 text-warn" />
                <p className="text-[12px] font-semibold text-ink">Bonus non communiqué</p>
                <p className="mt-1 text-[11px] font-medium text-ink-500">Aucun montant n'est affiché tant que la direction n'a pas validé l'enveloppe et la répartition (R6).</p>
              </div>
            ) : empLigne && empRow && (
              <div className="space-y-2.5">
                <div className="rounded-xl border border-line bg-surface2/40 p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{emp ? employeeName(emp) : empSel} · bonus</p>
                  <p className="mono mt-1 text-3xl font-bold text-amber-deep">{empLigne.final.formatWithCurrency()}</p>
                </div>
                <div className="space-y-1 rounded-xl border border-line bg-surface2/40 p-3 text-[11px] font-medium text-ink-600">
                  <Detail k="Score validé (SCORE)" v={`${Math.round(empRow.scorePct)} %`} />
                  <Detail k="Salaire mensuel" v={empRow.fiche.salaireMensuel.formatWithCurrency()} />
                  <Detail k="Formule" v={empRow.fiche.formuleDsl ?? `SCORE × ${empRow.fiche.formule.coef} × ${empRow.fiche.formule.base}`} />
                  <Detail k="Part brute" v={empLigne.brut.formatWithCurrency()} />
                  {empLigne.borne && <Detail k="Borne appliquée" v={empLigne.borne} />}
                  <Detail k="Montant final" v={empLigne.final.formatWithCurrency()} strong />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <p className="text-[11px] font-medium text-ink-400">
        Moteur Bonus M3 · formule DSL contrôlée (jamais d'eval, R2) · 3 modes A/B/C · réconciliation itérative des caps ·
        consomme le score validé (§9) · gating direction (R6) · injection paie via rpc_bonus_to_payroll (§12).
      </p>
    </div>
  );
}

function Detail({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-ink-400">{k}</span>
      <span className={cn('text-right', strong ? 'mono font-bold text-amber-deep' : 'font-semibold text-ink')}>{v}</span>
    </div>
  );
}
