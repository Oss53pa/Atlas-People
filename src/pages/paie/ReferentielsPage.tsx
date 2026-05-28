import { useState } from 'react';
import { Settings, Plus, ShieldCheck, FlaskConical } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { RUBRIQUES_CI, BAREMES_CI, CONVENTIONS_CI, PROFILS_CI, SOCIETES } from '../../lib/m3/referentiels';
import { Money } from '../../lib/money';

const TABS = [
  { key: 'rubriques', label: `Rubriques (${RUBRIQUES_CI.length})` },
  { key: 'baremes', label: `Barèmes (${BAREMES_CI.length})` },
  { key: 'conventions', label: `Conventions (${CONVENTIONS_CI.length})` },
  { key: 'profils', label: `Profils (${PROFILS_CI.length})` },
  { key: 'societes', label: `Sociétés (${SOCIETES.length})` },
];
const TYPE_TONE: Record<string, 'ok' | 'amber' | 'danger' | 'info' | 'neutral'> = {
  gain: 'ok', retenue: 'danger', cotisation_emp: 'info', cotisation_pat: 'amber', info: 'neutral',
};
const TYPE_LABEL: Record<string, string> = { gain: 'Gain', retenue: 'Retenue', cotisation_emp: 'Cot. emp', cotisation_pat: 'Cot. pat', info: 'Info' };
const fmtN = (n: number) => Money.of(Math.round(n), 'XOF').format();

export function ReferentielsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState('rubriques');

  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Référentiels paie</h1>
          <p className="text-sm font-medium text-ink-500">Catalogue versionné · modification 4-eyes · barèmes pays signés DRH</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Nouveau', description: 'Création soumise au workflow de validation (4-eyes).' })}><Plus size={14} /> Nouveau</Button>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'rubriques' && (
        <Card inset={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2.5 text-left">Code</th><th className="px-3 py-2.5 text-left">Libellé</th>
                <th className="px-3 py-2.5 text-left">Type</th><th className="px-3 py-2.5 text-left">Bases</th>
                <th className="px-3 py-2.5 text-center">Pays</th><th className="px-3 py-2.5 text-center">V</th><th className="px-3 py-2.5 text-center">Statut</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {RUBRIQUES_CI.map((r) => (
                  <tr key={r.code} className="hover:bg-ink/[0.02]">
                    <td className="mono px-4 py-2 text-[11px] font-bold text-ink-500">{r.code}</td>
                    <td className="px-3 py-2 text-[13px] font-semibold text-ink">{r.libelle}</td>
                    <td className="px-3 py-2"><StatusPill tone={TYPE_TONE[r.type]} dot={false}>{TYPE_LABEL[r.type]}</StatusPill></td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-400">{[r.baseCnps && 'CNPS', r.baseIrpp && 'IRPP'].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="px-3 py-2 text-center text-[11px] font-medium text-ink-500">{r.pays}</td>
                    <td className="mono px-3 py-2 text-center text-[11px] text-ink-400">{r.version}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone="ok" dot={false}>Publiée</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'baremes' && (
        <div className="space-y-3">
          {BAREMES_CI.map((b) => (
            <Card key={b.code}>
              <CardHeader title={b.libelle} subtitle={`${b.code} · ${b.pays} · v${b.version}${b.reference ? ` · ${b.reference}` : ''}`}
                action={<div className="flex items-center gap-2"><StatusPill tone="amber" dot={false}>Signé DRH</StatusPill><Button variant="ghost" size="sm" onClick={() => toast({ variant: 'info', title: 'Sandbox', description: `Test ${b.code}` })}><FlaskConical size={13} /> Tester</Button></div>} />
              {b.type === 'valeur' && <p className="mono text-lg font-bold text-ink">{b.unit === '%' ? `${b.value} %` : `${fmtN(b.value ?? 0)} ${b.unit}`}</p>}
              {b.tranches && (
                <div className="overflow-hidden rounded-xl border border-line">
                  <div className="grid grid-cols-3 gap-2 border-b border-line bg-surface2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-400"><span>Tranche min</span><span>Tranche max</span><span className="text-right">Taux</span></div>
                  <div className="divide-y divide-line">
                    {b.tranches.map((t, i) => (
                      <div key={i} className="grid grid-cols-3 gap-2 px-4 py-1.5 text-[12px] font-medium text-ink-700">
                        <span className="mono">{b.unit === '%' && b.type === 'tranches' ? `${t.min} an${t.min > 1 ? 's' : ''}` : fmtN(t.min)}</span>
                        <span className="mono">{t.max === null ? '∞' : (b.unit === '%' && b.type === 'tranches' ? `${t.max} ans` : fmtN(t.max))}</span>
                        <span className="mono text-right font-bold text-amber-deep">{t.taux} %</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === 'conventions' && (
        <div className="space-y-2">
          {CONVENTIONS_CI.map((c) => (
            <Card key={c.code}><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><Settings size={16} /></span><div className="flex-1"><p className="text-sm font-bold text-ink">{c.libelle}</p><p className="text-[11px] font-medium text-ink-400">{c.code} · {c.secteur} · {c.pays} · v{c.version}</p></div><StatusPill tone="ok" dot={false}>Active</StatusPill></div></Card>
          ))}
        </div>
      )}

      {tab === 'profils' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PROFILS_CI.map((p) => (
            <Card key={p.code}><p className="text-sm font-bold text-ink">{p.libelle}</p><p className="mt-0.5 text-[11px] font-medium text-ink-400">{p.code} · {p.convention}</p><div className="mt-2 flex items-center justify-between"><span className="text-[12px] font-medium text-ink-500">{p.population} collaborateur(s)</span><StatusPill tone="amber" dot={false}>Actif</StatusPill></div></Card>
          ))}
        </div>
      )}

      {tab === 'societes' && (
        <Card inset={false}>
          <div className="divide-y divide-line">
            {SOCIETES.map((s) => (
              <div key={s.code} className="flex items-center gap-3 px-5 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><ShieldCheck size={16} /></span><div className="flex-1"><p className="text-sm font-bold text-ink">{s.raison}</p><p className="text-[11px] font-medium text-ink-400">{s.code} · {s.pays} · {s.rccm} · {s.effectif} collab.</p></div><StatusPill tone={s.status === 'active' ? 'ok' : 'warn'} dot={false}>{s.status === 'active' ? 'Active' : 'Pré-prod'}</StatusPill></div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
