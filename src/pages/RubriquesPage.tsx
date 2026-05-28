import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Plus, Trash2, ShieldCheck, Check } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatusPill } from '../components/ui/StatusPill';
import { Button } from '../components/ui/Button';
import {
  DEFAULT_PAY_COMPONENTS,
  SYSTEM_TYPE_LABEL,
  CALC_MODE_LABEL,
  canDelete,
  type PayComponent,
  type SystemType,
  type CalcMode,
} from '../lib/m1/payComponents';
import { cn } from '../lib/cn';

const TYPE_TONE: Record<SystemType, 'ok' | 'info' | 'danger' | 'warn' | 'amber' | 'neutral'> = {
  gain: 'ok',
  social_contribution: 'info',
  tax: 'danger',
  deduction: 'warn',
  benefit_in_kind: 'amber',
  employer_contribution: 'neutral',
};

export function RubriquesPage() {
  const [components, setComponents] = useState<PayComponent[]>(DEFAULT_PAY_COMPONENTS);
  const [form, setForm] = useState({ code: '', label: '', systemType: 'gain' as SystemType, calcMode: 'fixed' as CalcMode, taxable: true, subjectToSocial: true });

  const legal = components.filter((c) => c.isLegal);
  const custom = components.filter((c) => !c.isLegal);

  const addComponent = () => {
    if (!form.code || !form.label) return;
    setComponents((cs) => [
      ...cs,
      {
        id: `pc-${Date.now()}`,
        code: form.code.toUpperCase().replace(/\s+/g, '_'),
        label: form.label,
        systemType: form.systemType,
        isLegal: false,
        calcMode: form.calcMode,
        calcBase: 'custom',
        taxable: form.taxable,
        subjectToSocial: form.subjectToSocial,
        active: true,
      },
    ]);
    setForm({ code: '', label: '', systemType: 'gain', calcMode: 'fixed', taxable: true, subjectToSocial: true });
  };

  const remove = (c: PayComponent) => {
    if (!canDelete(c)) return; // garde-fou : rubrique légale non supprimable
    setComponents((cs) => cs.filter((x) => x.id !== c.id));
  };

  return (
    <div className="animate-fade-up space-y-6">
      <Link to="/paie" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink">
        <ArrowLeft size={15} /> Paie
      </Link>

      <SectionHeader
        eyebrow="M1 · §4 — Rémunération"
        title="Rubriques de paie"
        description="100 % configurables pour vos rubriques maison — verrouillées pour les rubriques légales du régime-pays (garde-fou conformité)."
      />

      <div className="flex items-center gap-3 rounded-2xl border border-ok/25 bg-ok/[0.06] px-4 py-3">
        <ShieldCheck className="shrink-0 text-ok" size={20} />
        <p className="text-sm font-medium text-ink-700">
          Les rubriques <span className="font-bold">légales</span> (CNPS, IGR…) sont fournies par le régime et ne peuvent être ni
          supprimées ni dé-câblées. Le verrou est aussi appliqué en base (trigger Postgres).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Formulaire */}
        <Card>
          <CardHeader title="Nouvelle rubrique maison" subtitle="Prime, panier, indemnité…" />
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Code</label>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="PRIME_X" className="mono mb-3 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold uppercase text-ink focus:border-amber/40 focus:outline-none" />
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Libellé</label>
          <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Prime exceptionnelle" className="mb-3 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Type</label>
          <select value={form.systemType} onChange={(e) => setForm({ ...form, systemType: e.target.value as SystemType })} className="mb-3 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
            {(['gain', 'deduction', 'benefit_in_kind'] as SystemType[]).map((t) => (
              <option key={t} value={t}>{SYSTEM_TYPE_LABEL[t]}</option>
            ))}
          </select>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Mode de calcul</label>
          <select value={form.calcMode} onChange={(e) => setForm({ ...form, calcMode: e.target.value as CalcMode })} className="mb-3 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
            {(['fixed', 'percentage', 'formula'] as CalcMode[]).map((m) => (
              <option key={m} value={m}>{CALC_MODE_LABEL[m]}</option>
            ))}
          </select>
          <div className="mb-4 flex flex-wrap gap-4">
            <CheckRow label="Imposable" checked={form.taxable} onChange={(v) => setForm({ ...form, taxable: v })} />
            <CheckRow label="Soumis à cotisations" checked={form.subjectToSocial} onChange={(v) => setForm({ ...form, subjectToSocial: v })} />
          </div>
          <Button className="w-full" disabled={!form.code || !form.label} onClick={addComponent}>
            <Plus size={14} /> Créer la rubrique
          </Button>
        </Card>

        {/* Listes */}
        <div className="space-y-4 lg:col-span-2">
          <Card inset={false}>
            <div className="p-5 pb-2">
              <CardHeader title="Rubriques légales" subtitle="Régime-pays · verrouillées" className="mb-0" action={<Lock size={16} className="text-ink-400" />} />
            </div>
            <div className="divide-y divide-line">
              {legal.map((c) => (
                <ComponentRow key={c.id} c={c} onDelete={remove} />
              ))}
            </div>
          </Card>

          <Card inset={false}>
            <div className="p-5 pb-2">
              <CardHeader title="Rubriques de l'entreprise" subtitle={`${custom.length} configurables`} className="mb-0" />
            </div>
            <div className="divide-y divide-line">
              {custom.map((c) => (
                <ComponentRow key={c.id} c={c} onDelete={remove} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ComponentRow({ c, onDelete }: { c: PayComponent; onDelete: (c: PayComponent) => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', c.isLegal ? 'bg-ink/[0.06] text-ink-500' : 'bg-amber/12 text-amber-deep')}>
        {c.isLegal ? <Lock size={15} /> : <Check size={15} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mono rounded bg-ink/[0.05] px-1.5 py-0.5 text-[10px] font-bold text-ink-500">{c.code}</span>
          <p className="truncate text-sm font-bold text-ink">{c.label}</p>
          {c.isLegal && <StatusPill tone="neutral" dot={false}>Légale · verrouillée</StatusPill>}
        </div>
        <p className="mt-0.5 text-[11px] font-medium text-ink-400">
          {CALC_MODE_LABEL[c.calcMode]} · {c.taxable ? 'Imposable' : 'Non imposable'} · {c.subjectToSocial ? 'Cotisable' : 'Non cotisable'}
        </p>
      </div>
      <StatusPill tone={TYPE_TONE[c.systemType]} dot={false}>{SYSTEM_TYPE_LABEL[c.systemType]}</StatusPill>
      <button
        onClick={() => onDelete(c)}
        disabled={c.isLegal}
        title={c.isLegal ? 'Rubrique légale — non supprimable' : 'Supprimer'}
        className={cn('rounded-lg p-2', c.isLegal ? 'cursor-not-allowed text-ink-400/40' : 'text-danger hover:bg-danger/10')}
      >
        {c.isLegal ? <Lock size={15} /> : <Trash2 size={15} />}
      </button>
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center gap-2 text-sm font-semibold text-ink-700">
      <span className={cn('flex h-5 w-5 items-center justify-center rounded-md border', checked ? 'border-amber bg-amber text-night' : 'border-line bg-surface')}>
        {checked && <Check size={13} />}
      </span>
      {label}
    </button>
  );
}
