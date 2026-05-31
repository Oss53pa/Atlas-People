import { useMemo, useState } from 'react';
import { SlidersHorizontal, Plus, ShieldCheck, ListOrdered, Percent, Save, GripVertical } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { Modal } from '../../components/ui/overlays';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { RUBRIQUES_CI, type Rubrique, type RubriqueType } from '../../lib/m3/referentiels';
import { cn } from '../../lib/cn';

const TYPE_TONE: Record<RubriqueType, 'ok' | 'amber' | 'danger' | 'info' | 'neutral'> = {
  gain: 'ok', retenue: 'danger', cotisation_emp: 'info', cotisation_pat: 'amber', info: 'neutral',
};
const TONE_DOT: Record<'ok' | 'amber' | 'danger' | 'info' | 'neutral', string> = {
  ok: 'bg-ok', amber: 'bg-amber', danger: 'bg-danger', info: 'bg-info', neutral: 'bg-ink-300',
};
const TYPE_LABEL: Record<RubriqueType, string> = {
  gain: 'Gain', retenue: 'Retenue', cotisation_emp: 'Cot. salariale', cotisation_pat: 'Cot. patronale', info: 'Info',
};
const TYPE_OPTIONS: RubriqueType[] = ['gain', 'retenue', 'cotisation_emp', 'cotisation_pat', 'info'];

type CalcMode = 'fixed' | 'rate' | 'bareme' | 'formula';
interface RubriqueConfig extends Rubrique { active: boolean; order: number; calcMode: CalcMode }

const CALC_LABEL: Record<CalcMode, string> = {
  fixed: 'Montant fixe', rate: 'Taux × base', bareme: 'Barème', formula: 'Formule',
};

const seedConfig = (): RubriqueConfig[] =>
  RUBRIQUES_CI.map((r, i) => ({
    ...r, active: r.status === 'published', order: (i + 1) * 10,
    calcMode: r.type === 'gain' ? 'fixed' : r.type === 'info' ? 'formula' : 'rate',
  }));

const TABS = [{ key: 'rubriques', label: 'Rubriques' }, { key: 'regles', label: 'Règles de calcul' }];

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} aria-label={label}
      className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', on ? 'bg-amber-deep' : 'bg-ink-300/40')}>
      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', on ? 'left-[18px]' : 'left-0.5')} />
    </button>
  );
}

export function ConfigurationPaiePage() {
  const { toast } = useToast();
  const [tab, setTab] = useState('rubriques');
  const [list, setList] = useState<RubriqueConfig[]>(seedConfig);
  const [filter, setFilter] = useState<'all' | RubriqueType>('all');
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  // form pour nouvelle rubrique
  const [nCode, setNCode] = useState('');
  const [nLib, setNLib] = useState('');
  const [nType, setNType] = useState<RubriqueType>('gain');

  // règles de calcul (paramétrage tenant)
  const [rounding, setRounding] = useState<'half_even' | 'half_up'>('half_even');
  const [prorataMode, setProrataMode] = useState<'calendar' | 'worked'>('worked');
  const [smigGuard, setSmigGuard] = useState(true);
  const [quotaGuard, setQuotaGuard] = useState(true);

  const filtered = useMemo(
    () => list.filter((r) => filter === 'all' || r.type === filter).sort((a, b) => a.order - b.order),
    [list, filter],
  );
  const stats = useMemo(() => ({
    total: list.length,
    active: list.filter((r) => r.active).length,
    draft: list.filter((r) => r.status === 'draft').length,
  }), [list]);

  const patch = (code: string, p: Partial<RubriqueConfig>) => {
    setList((l) => l.map((r) => (r.code === code ? { ...r, ...p } : r)));
    setDirty(true);
  };
  const move = (code: string, dir: -1 | 1) => {
    setList((l) => {
      const sorted = [...l].sort((a, b) => a.order - b.order);
      const i = sorted.findIndex((r) => r.code === code);
      const j = i + dir;
      if (j < 0 || j >= sorted.length) return l;
      const oi = sorted[i].order; sorted[i].order = sorted[j].order; sorted[j].order = oi;
      return [...sorted];
    });
    setDirty(true);
  };
  const addRubrique = () => {
    const code = nCode.trim().toUpperCase();
    const libelle = nLib.trim();
    if (!code || !libelle) return;
    setList((l) => [...l, {
      code, libelle, category: 'PERSO', type: nType, pays: 'CI', version: 1,
      baseCnps: nType === 'gain', baseIrpp: nType === 'gain', status: 'draft',
      active: false, order: (l.length + 1) * 10, calcMode: nType === 'gain' ? 'fixed' : 'rate',
    }]);
    setOpen(false); setNCode(''); setNLib(''); setNType('gain'); setDirty(true);
    toast({ variant: 'success', title: 'Rubrique créée (brouillon)', description: `${code} — soumise au workflow de validation 4-eyes avant publication.` });
  };
  const save = () => {
    setDirty(false);
    toast({ variant: 'success', title: 'Paramétrage soumis', description: 'Modifications envoyées en validation 4-eyes (responsable paie + DRH). Versionné et audité.' });
  };

  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Configuration de la paie</h1>
          <p className="text-sm font-medium text-ink-500">Paramétrage des rubriques, assujettissements et règles de calcul · workflow 4-eyes</p>
        </div>
        <div className="flex gap-2">
          {tab === 'rubriques' && <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Rubrique</Button>}
          <Button size="sm" onClick={save} disabled={!dirty}><Save size={14} /> Soumettre</Button>
        </div>
      </div>

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Toute modification du paramétrage est versionnée, soumise à double validation (4-eyes) et auditée. Les rubriques en brouillon n'impactent jamais un calcul tant qu'elles ne sont pas publiées.</p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Rubriques" value={String(stats.total)} unit="paramétrées" icon={SlidersHorizontal} tone="amber" />
        <StatCard label="Actives" value={String(stats.active)} unit="publiées" icon={ShieldCheck} />
        <StatCard label="Brouillons" value={String(stats.draft)} unit="en attente 4-eyes" icon={ListOrdered} />
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'rubriques' && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {(['all', ...TYPE_OPTIONS] as const).map((t) => (
              <button key={t} onClick={() => setFilter(t)}
                className={cn('rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-colors',
                  filter === t ? 'bg-amber/12 text-amber-deep ring-1 ring-amber/30' : 'bg-surface2 text-ink-500 hover:text-ink')}>
                {t === 'all' ? `Toutes (${list.length})` : `${TYPE_LABEL[t]} (${list.filter((r) => r.type === t).length})`}
              </button>
            ))}
          </div>

          <Card inset={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead><tr className="border-b border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                  <th className="px-2 py-2.5 text-center">Ordre</th>
                  <th className="px-3 py-2.5 text-left">Code / Libellé</th>
                  <th className="px-3 py-2.5 text-left">Type</th>
                  <th className="px-3 py-2.5 text-left">Calcul</th>
                  <th className="px-2 py-2.5 text-center">Base CNPS</th>
                  <th className="px-2 py-2.5 text-center">Base IRPP</th>
                  <th className="px-2 py-2.5 text-center">Active</th>
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((r) => (
                    <tr key={r.code} className={cn('hover:bg-ink/[0.02]', !r.active && 'opacity-60')}>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-0.5 text-ink-300">
                          <GripVertical size={13} />
                          <div className="flex flex-col">
                            <button onClick={() => move(r.code, -1)} className="text-[9px] leading-none hover:text-ink" aria-label="Monter">▲</button>
                            <button onClick={() => move(r.code, 1)} className="text-[9px] leading-none hover:text-ink" aria-label="Descendre">▼</button>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 shrink-0 rounded-full', TONE_DOT[TYPE_TONE[r.type]])} title={TYPE_LABEL[r.type]} />
                          <div className="min-w-0">
                            <p className="mono text-[11px] font-bold text-ink-500">{r.code}</p>
                            <p className="text-[13px] font-semibold text-ink">{r.libelle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <select value={r.type} onChange={(e) => patch(r.code, { type: e.target.value as RubriqueType })}
                          className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] font-medium text-ink outline-none focus:ring-2 focus:ring-amber/30">
                          {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={r.calcMode} onChange={(e) => patch(r.code, { calcMode: e.target.value as CalcMode })}
                          className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] font-medium text-ink outline-none focus:ring-2 focus:ring-amber/30">
                          {(Object.keys(CALC_LABEL) as CalcMode[]).map((m) => <option key={m} value={m}>{CALC_LABEL[m]}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2"><div className="flex justify-center"><Toggle on={r.baseCnps} onClick={() => patch(r.code, { baseCnps: !r.baseCnps })} label={`${r.code} base CNPS`} /></div></td>
                      <td className="px-2 py-2"><div className="flex justify-center"><Toggle on={r.baseIrpp} onClick={() => patch(r.code, { baseIrpp: !r.baseIrpp })} label={`${r.code} base IRPP`} /></div></td>
                      <td className="px-2 py-2">
                        <div className="flex flex-col items-center gap-1">
                          <Toggle on={r.active} onClick={() => patch(r.code, { active: !r.active, status: !r.active ? 'published' : 'draft' })} label={`${r.code} active`} />
                          <StatusPill tone={r.active ? 'ok' : 'neutral'} dot={false}>{r.active ? 'Publiée' : 'Brouillon'}</StatusPill>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-[11px] font-medium text-ink-400">Astuce : l'ordre détermine la séquence d'affichage sur le bulletin et le journal. Le type pilote la section (gain, retenue, cotisation) et l'imputation comptable SYSCOHADA.</p>
        </>
      )}

      {tab === 'regles' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Arrondi & devise" action={<Percent size={16} className="text-ink-400" />} />
            <div className="space-y-1.5">
              {([['half_even', 'HALF_EVEN (arrondi bancaire)'], ['half_up', 'HALF_UP (arrondi commercial)']] as const).map(([k, lbl]) => (
                <label key={k} className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-[13px] font-medium text-ink-700">
                  <input type="radio" name="rounding" checked={rounding === k} onChange={() => { setRounding(k); setDirty(true); }} className="accent-amber-deep" /> {lbl}
                </label>
              ))}
              <p className="px-1 pt-1 text-[11px] font-medium text-ink-400">Devise : XOF (FCFA) · précision 0 décimale (franc entier).</p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Prorata temporis" action={<ListOrdered size={16} className="text-ink-400" />} />
            <div className="space-y-1.5">
              {([['worked', 'Jours travaillés / jours ouvrables'], ['calendar', 'Jours calendaires (30e)']] as const).map(([k, lbl]) => (
                <label key={k} className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-[13px] font-medium text-ink-700">
                  <input type="radio" name="prorata" checked={prorataMode === k} onChange={() => { setProrataMode(k); setDirty(true); }} className="accent-amber-deep" /> {lbl}
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Contrôles bloquants (garde-fous)" action={<ShieldCheck size={16} className="text-ink-400" />} />
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2">
                <div><p className="text-[13px] font-semibold text-ink">Plancher SMIG</p><p className="text-[11px] font-medium text-ink-400">Bloque tout net &lt; SMIG pays (à temps plein)</p></div>
                <Toggle on={smigGuard} onClick={() => { setSmigGuard(!smigGuard); setDirty(true); }} label="Garde SMIG" />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2">
                <div><p className="text-[13px] font-semibold text-ink">Quotité saisissable</p><p className="text-[11px] font-medium text-ink-400">Bloque retenues &gt; 33 % du brut</p></div>
                <Toggle on={quotaGuard} onClick={() => { setQuotaGuard(!quotaGuard); setDirty(true); }} label="Garde quotité" />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Ordre des sections du bulletin" action={<ListOrdered size={16} className="text-ink-400" />} />
            <ol className="space-y-1.5">
              {['Gains', 'Cotisations salariales', 'Impôt sur le revenu', 'Retenues diverses', 'Charges patronales'].map((s, i) => (
                <li key={s} className="flex items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-[13px] font-semibold text-ink">
                  <span className="mono flex h-5 w-5 items-center justify-center rounded-md bg-amber/15 text-[11px] text-amber-deep">{i + 1}</span> {s}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle rubrique" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Annuler</Button><Button size="sm" onClick={addRubrique} disabled={!nCode.trim() || !nLib.trim()}>Créer en brouillon</Button></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-semibold text-ink-500">Code</span>
              <input value={nCode} onChange={(e) => setNCode(e.target.value)} placeholder="R900_PRIME_PERSO"
                className="mono mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-amber/30" />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-ink-500">Type</span>
              <select value={nType} onChange={(e) => setNType(e.target.value as RubriqueType)}
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-amber/30">
                {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-[11px] font-semibold text-ink-500">Libellé</span>
            <input value={nLib} onChange={(e) => setNLib(e.target.value)} placeholder="Prime de performance trimestrielle"
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-amber/30" />
          </label>
          <p className="flex items-center gap-1.5 rounded-xl bg-surface2 px-3 py-2 text-[11px] font-medium text-ink-500"><ShieldCheck size={12} className="text-amber-deep" /> Créée en brouillon : sans impact sur les calculs jusqu'à publication validée 4-eyes.</p>
        </div>
      </Modal>
    </div>
  );
}
