import { useMemo, useState } from 'react';
import { Search, Plus, Repeat, Lock, ArrowLeft, Coins, TrendingDown } from 'lucide-react';
import { Modal } from '../ui/overlays';
import { Button } from '../ui/Button';
import { StatusPill } from '../ui/StatusPill';
import { pickableRubriques, lockedRubriques, resolveRubriqueAmount } from '../../lib/m3/rubriques';
import { currencyOf } from '../../data/countries';
import { Money } from '../../lib/money';
import type { Rubrique } from '../../lib/m3/referentiels';
import type { PrimePonctuelle, RetenueExceptionnelle, RubriqueCalc, RubriqueCalcMode } from '../../lib/m3/types';
import { cn } from '../../lib/cn';

export interface RubriquePick {
  kind: 'gain' | 'retenue';
  target: 'month' | 'model';
  line: PrimePonctuelle | RetenueExceptionnelle;
}

const MODES: { id: RubriqueCalcMode; label: string; hint: string }[] = [
  { id: 'fixed', label: 'Montant fixe', hint: 'Saisie manuelle' },
  { id: 'base_rate', label: 'Base × Taux', hint: 'base × taux %' },
  { id: 'qty_rate', label: 'Qté × Taux', hint: 'quantité × unitaire' },
];

/**
 * Sélecteur de rubrique catalogue (doc 02). Le gestionnaire pioche une rubrique
 * (gain ou retenue), choisit son mode de calcul, et l'ajoute soit au mois courant,
 * soit au MODÈLE du salarié (récurrent, ré-appliqué chaque cycle).
 * Les cotisations/impôts sont verrouillés (calculés par le moteur déterministe).
 */
export function RubriquePicker({ countryCode, baseSalary, onAdd, onClose }: {
  countryCode: string;
  baseSalary: number;
  onAdd: (p: RubriquePick) => void;
  onClose: () => void;
}) {
  const cur = currencyOf(countryCode);
  const fmt = (n: number) => Money.of(Math.round(n), cur).format();
  const all = useMemo(() => pickableRubriques(countryCode), [countryCode]);
  const locked = useMemo(() => lockedRubriques(countryCode), [countryCode]);

  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<Rubrique | null>(null);

  const [mode, setMode] = useState<RubriqueCalcMode>('fixed');
  const [amount, setAmount] = useState(50_000);
  const [base, setBase] = useState(baseSalary);
  const [rate, setRate] = useState(5);
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState(10_000);
  const [recurring, setRecurring] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((r) => !q || `${r.code} ${r.libelle} ${r.category}`.toLowerCase().includes(q));
  }, [all, query]);
  const gains = filtered.filter((r) => r.type === 'gain');
  const retenues = filtered.filter((r) => r.type === 'retenue');

  const calc: RubriqueCalc =
    mode === 'base_rate' ? { mode, base, rate } : mode === 'qty_rate' ? { mode, qty, unit } : { mode: 'fixed' };
  const resolved = resolveRubriqueAmount(calc, amount);

  const pick = (r: Rubrique) => { setSel(r); setMode('fixed'); setRecurring(false); setAmount(50_000); setBase(baseSalary); };

  const confirm = () => {
    if (!sel) return;
    const id = `${sel.code}__${Date.now()}`;
    const target: 'month' | 'model' = recurring ? 'model' : 'month';
    if (sel.type === 'gain') {
      const line: PrimePonctuelle = {
        code: id, label: sel.libelle, amount: resolved, taxable: sel.baseIrpp, baseCnps: sel.baseCnps,
        source: 'catalogue', rubriqueCode: sel.code, calc, recurring,
      };
      onAdd({ kind: 'gain', target, line });
    } else {
      const line: RetenueExceptionnelle = {
        code: id, label: sel.libelle, amount: resolved, account: '427000', rubriqueCode: sel.code, calc, recurring,
      };
      onAdd({ kind: 'retenue', target, line });
    }
    setSel(null);
    setQuery('');
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={sel ? `Configurer — ${sel.libelle}` : 'Ajouter une rubrique au bulletin'}
      footer={
        sel ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => setSel(null)}>Annuler</Button>
            <Button size="sm" onClick={confirm}><Plus size={14} /> {recurring ? 'Ajouter au modèle' : 'Ajouter ce mois'}</Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={onClose}>Fermer</Button>
        )
      }
    >
      {!sel ? (
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)} autoFocus
              placeholder="Rechercher une rubrique (code, libellé)…"
              className="h-10 w-full rounded-xl border border-line bg-surface2 pl-9 pr-3 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none"
            />
          </div>
          <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1">
            <RubriqueGroup title="Gains" icon={Coins} items={gains} onPick={pick} />
            <RubriqueGroup title="Retenues" icon={TrendingDown} items={retenues} onPick={pick} />
            {filtered.length === 0 && <p className="px-1 py-3 text-[13px] font-medium text-ink-400">Aucune rubrique ne correspond.</p>}
            <div className="border-t border-line pt-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <Lock size={11} /> Calculées automatiquement — non ajoutables
              </p>
              <div className="flex flex-wrap gap-1.5">
                {locked.map((r) => (
                  <span key={r.code} className="rounded-md bg-ink/[0.05] px-2 py-1 text-[11px] font-semibold text-ink-400">{r.libelle}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <button onClick={() => setSel(null)} className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-deep hover:underline">
            <ArrowLeft size={13} /> Retour au catalogue
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={sel.type === 'gain' ? 'ok' : 'danger'} dot={false}>{sel.type === 'gain' ? 'Gain' : 'Retenue'}</StatusPill>
            <span className="mono text-[11px] font-semibold text-ink-400">{sel.code}</span>
            {sel.type === 'gain' && <StatusPill tone={sel.baseIrpp ? 'amber' : 'neutral'} dot={false}>{sel.baseIrpp ? 'Imposable' : 'Non imposable'}</StatusPill>}
            {sel.type === 'gain' && sel.baseCnps && <StatusPill tone="neutral" dot={false}>Soumis CNPS</StatusPill>}
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-400">Mode de calcul</p>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((m) => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className={cn('rounded-xl border px-3 py-2 text-left transition-colors', mode === m.id ? 'border-amber/50 bg-amber/[0.08]' : 'border-line hover:bg-ink/[0.03]')}>
                  <p className="text-[12px] font-bold text-ink">{m.label}</p>
                  <p className="text-[10px] font-medium text-ink-400">{m.hint}</p>
                </button>
              ))}
            </div>
          </div>

          {mode === 'fixed' && <Labeled label="Montant (FCFA)"><Num value={amount} onChange={setAmount} step={5000} /></Labeled>}
          {mode === 'base_rate' && (
            <div className="grid grid-cols-2 gap-3">
              <Labeled label="Base (FCFA)"><Num value={base} onChange={setBase} step={5000} /></Labeled>
              <Labeled label="Taux (%)"><Num value={rate} onChange={setRate} step={0.5} /></Labeled>
            </div>
          )}
          {mode === 'qty_rate' && (
            <div className="grid grid-cols-2 gap-3">
              <Labeled label="Quantité"><Num value={qty} onChange={setQty} step={1} /></Labeled>
              <Labeled label="Montant unitaire (FCFA)"><Num value={unit} onChange={setUnit} step={1000} /></Labeled>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-surface2 px-4 py-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Montant calculé</span>
            <span className="mono text-base font-bold text-amber-deep">{fmt(resolved)}</span>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-3">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="mt-0.5 h-4 w-4 accent-amber" />
            <span>
              <span className="flex items-center gap-1.5 text-[13px] font-bold text-ink"><Repeat size={13} className="text-amber-deep" /> Rubrique récurrente (modèle du salarié)</span>
              <span className="mt-0.5 block text-[11px] font-medium text-ink-500">Ajoutée au modèle de paie : ré-appliquée automatiquement chaque cycle, sans ressaisie.</span>
            </span>
          </label>
        </div>
      )}
    </Modal>
  );
}

function RubriqueGroup({ title, icon: Icon, items, onPick }: {
  title: string; icon: typeof Coins; items: Rubrique[]; onPick: (r: Rubrique) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
        <Icon size={11} /> {title} ({items.length})
      </p>
      <div className="space-y-1">
        {items.map((r) => (
          <button key={r.code} onClick={() => onPick(r)}
            className="flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-amber/40 hover:bg-amber/[0.04]">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">{r.libelle}</p>
              <p className="mono truncate text-[10px] font-medium text-ink-400">{r.code} · {r.category}</p>
            </div>
            {r.type === 'gain' && (
              <span className={cn('rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase', r.baseIrpp ? 'bg-amber/12 text-amber-deep' : 'bg-ink/[0.06] text-ink-400')}>{r.baseIrpp ? 'imp.' : 'non imp.'}</span>
            )}
            <Plus size={14} className="shrink-0 text-ink-300" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</label>{children}</div>;
}
function Num({ value, onChange, step = 1 }: { value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
      className="mono h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
  );
}
