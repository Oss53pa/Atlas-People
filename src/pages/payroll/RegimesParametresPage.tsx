/**
 * RegimesParametresPage — paramétrage des régimes de paie OHADA par tenant.
 *
 * Chaque tenant peut configurer ses propres taux pour chacun des 14 pays OHADA :
 * • Cotisations sociales (CNPS, IPRES, etc.) avec taux salarié + patronal + plafond
 * • Barème IRPP/ITS progressif (tranches + taux marginal)
 * • Taxes patronales (FDFP, 3FPT, TA, etc.)
 *
 * En mode démo, les données sont issues des régimes statiques compilés.
 * En mode Supabase, save/read vers atlas_people.payroll_regime_configs.
 */
import { useState, useEffect } from 'react';
import {
  Globe, Plus, Trash2, Save, ChevronDown, ChevronRight, Info,
  CheckCircle, AlertTriangle, RefreshCw, Settings2, Lock,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../lib/cn';
import { COUNTRIES } from '../../data/countries';
import { getRegime, REGIMES } from '../../lib/payroll/regimes';
import type { Regime, Contribution, TaxBracket, EmployerTax } from '../../lib/payroll/types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

// ── Helpers ───────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

function bpsToPercent(bps: number): string { return (bps / 100).toFixed(2); }
function percentToBps(s: string): number { return Math.round(parseFloat(s || '0') * 100); }

// ── Types état local ──────────────────────────────────────────────────

interface LocalContrib extends Omit<Contribution, 'accounts'> {
  _id: string;
  accountEmployee: string;
  accountEmployer: string;
}

interface LocalBracket extends TaxBracket { _id: string }

interface LocalEmpTax extends EmployerTax { _id: string }

interface LocalRegime {
  countryCode: string;
  countryName: string;
  zone: 'UEMOA' | 'CEMAC';
  currency: 'XOF' | 'XAF';
  socialFund: string;
  version: string;
  effectiveFrom: string;
  incomeTaxCode: string;
  incomeTaxLabel: string;
  abatementBps: number;
  contributions: LocalContrib[];
  brackets: LocalBracket[];
  employerTaxes: LocalEmpTax[];
  _dirty: boolean;
  _saved: boolean;
}

function fromRegime(r: Regime): LocalRegime {
  return {
    countryCode: r.countryCode,
    countryName: r.countryName,
    zone: r.zone,
    currency: r.currency,
    socialFund: r.socialFund,
    version: r.version,
    effectiveFrom: r.effectiveFrom,
    incomeTaxCode: r.incomeTax.code,
    incomeTaxLabel: r.incomeTax.label,
    abatementBps: r.incomeTax.abatementBps ?? 0,
    contributions: r.contributions.map((c) => ({
      ...c, _id: uid(),
      accountEmployee: c.accounts.employee ?? '',
      accountEmployer: c.accounts.employer ?? '',
    })),
    brackets: r.incomeTax.brackets.map((b) => ({ ...b, _id: uid() })),
    employerTaxes: r.employerTaxes.map((t) => ({ ...t, _id: uid() })),
    _dirty: false,
    _saved: false,
  };
}

function blankRegime(countryCode: string): LocalRegime {
  const meta = COUNTRIES.find((c) => c.code === countryCode);
  return {
    countryCode,
    countryName: meta?.name ?? countryCode,
    zone: meta?.zone ?? 'UEMOA',
    currency: meta?.currency ?? 'XOF',
    socialFund: meta?.socialFund ?? 'CNSS',
    version: '1.0',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    incomeTaxCode: 'IRPP',
    incomeTaxLabel: 'IRPP / ITS',
    abatementBps: 0,
    contributions: [],
    brackets: [],
    employerTaxes: [],
    _dirty: true,
    _saved: false,
  };
}

// ── Composant principal ───────────────────────────────────────────────

export function RegimesParametresPage() {
  const { tenantId } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>('CI');
  const [regimes, setRegimes] = useState<Record<string, LocalRegime>>({});
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'contributions' | 'brackets' | 'employer_taxes'>('contributions');

  // Charge les régimes statiques par défaut
  useEffect(() => {
    const init: Record<string, LocalRegime> = {};
    for (const code of Object.keys(REGIMES)) {
      init[code] = fromRegime(getRegime(code));
    }
    setRegimes(init);
  }, []);

  // ── Helpers local state ──────────────────────────────────────────────

  const currentRegime = selected ? regimes[selected] : null;

  const updateRegime = (patch: Partial<LocalRegime>) => {
    if (!selected) return;
    setRegimes((prev) => ({
      ...prev,
      [selected]: { ...prev[selected], ...patch, _dirty: true },
    }));
  };

  const addCountry = (code: string) => {
    if (regimes[code]) { setSelected(code); return; }
    let local: LocalRegime;
    try { local = fromRegime(getRegime(code)); } catch { local = blankRegime(code); }
    setRegimes((prev) => ({ ...prev, [code]: { ...local, _dirty: true } }));
    setSelected(code);
  };

  // ── Contributions ────────────────────────────────────────────────────

  const addContrib = () => {
    if (!currentRegime) return;
    const c: LocalContrib = {
      _id: uid(), code: '', label: '', base: 'gross', ceiling: undefined,
      employeeBps: 0, employerBps: 0, accountEmployee: '431', accountEmployer: '664',
    };
    updateRegime({ contributions: [...currentRegime.contributions, c] });
  };
  const updateContrib = (id: string, patch: Partial<LocalContrib>) => {
    if (!currentRegime) return;
    updateRegime({
      contributions: currentRegime.contributions.map((c) => c._id === id ? { ...c, ...patch } : c),
    });
  };
  const removeContrib = (id: string) => {
    if (!currentRegime) return;
    updateRegime({ contributions: currentRegime.contributions.filter((c) => c._id !== id) });
  };

  // ── Tranches IRPP ────────────────────────────────────────────────────

  const addBracket = () => {
    if (!currentRegime) return;
    const b: LocalBracket = { _id: uid(), upTo: null, bps: 0 };
    updateRegime({ brackets: [...currentRegime.brackets, b] });
  };
  const updateBracket = (id: string, patch: Partial<LocalBracket>) => {
    if (!currentRegime) return;
    updateRegime({
      brackets: currentRegime.brackets.map((b) => b._id === id ? { ...b, ...patch } : b),
    });
  };
  const removeBracket = (id: string) => {
    if (!currentRegime) return;
    updateRegime({ brackets: currentRegime.brackets.filter((b) => b._id !== id) });
  };

  // ── Taxes patronales ─────────────────────────────────────────────────

  const addEmpTax = () => {
    if (!currentRegime) return;
    const t: LocalEmpTax = { _id: uid(), code: '', label: '', bps: 0, account: '637' };
    updateRegime({ employerTaxes: [...currentRegime.employerTaxes, t] });
  };
  const updateEmpTax = (id: string, patch: Partial<LocalEmpTax>) => {
    if (!currentRegime) return;
    updateRegime({
      employerTaxes: currentRegime.employerTaxes.map((t) => t._id === id ? { ...t, ...patch } : t),
    });
  };
  const removeEmpTax = (id: string) => {
    if (!currentRegime) return;
    updateRegime({ employerTaxes: currentRegime.employerTaxes.filter((t) => t._id !== id) });
  };

  // ── Sauvegarde Supabase ──────────────────────────────────────────────

  const saveRegime = async () => {
    if (!currentRegime || !tenantId) return;
    setSaving(true);
    try {
      if (!supabase) {
        // Mode démo : juste marquer saved
        updateRegime({ _dirty: false, _saved: true });
        toast({ variant: 'success', title: 'Régime sauvegardé (mode démo)', description: `${currentRegime.countryName} · version ${currentRegime.version}` });
        return;
      }

      // Upsert enveloppe
      const { data: cfg, error: e1 } = await supabase.schema('atlas_people')
        .from('payroll_regime_configs')
        .upsert({
          tenant_id: tenantId,
          country_code: currentRegime.countryCode,
          country_name: currentRegime.countryName,
          zone: currentRegime.zone,
          currency: currentRegime.currency,
          social_fund: currentRegime.socialFund,
          version: currentRegime.version,
          effective_from: currentRegime.effectiveFrom,
          income_tax_code: currentRegime.incomeTaxCode,
          income_tax_label: currentRegime.incomeTaxLabel,
          abatement_bps: currentRegime.abatementBps,
          is_active: true,
        }, { onConflict: 'tenant_id,country_code' })
        .select('id').single();

      if (e1 || !cfg) throw e1 ?? new Error('Upsert régime échoué');
      const regimeId = (cfg as { id: string }).id;

      // Replace contributions (delete + insert)
      await supabase.schema('atlas_people')
        .from('payroll_contributions').delete().eq('regime_id', regimeId);
      if (currentRegime.contributions.length > 0) {
        await supabase.schema('atlas_people').from('payroll_contributions').insert(
          currentRegime.contributions.map((c, i) => ({
            regime_id: regimeId, sort_order: i + 1,
            code: c.code, label: c.label, base_type: c.base,
            ceiling: c.ceiling ? c.ceiling * 100 : null,
            employee_bps: c.employeeBps, employer_bps: c.employerBps,
            account_employee: c.accountEmployee || null,
            account_employer: c.accountEmployer || null,
          })),
        );
      }

      // Replace brackets
      await supabase.schema('atlas_people')
        .from('payroll_tax_brackets').delete().eq('regime_id', regimeId);
      if (currentRegime.brackets.length > 0) {
        await supabase.schema('atlas_people').from('payroll_tax_brackets').insert(
          currentRegime.brackets.map((b, i) => ({
            regime_id: regimeId, sort_order: i + 1,
            up_to: b.upTo ? b.upTo * 100 : null,
            rate_bps: b.bps,
          })),
        );
      }

      // Replace employer taxes
      await supabase.schema('atlas_people')
        .from('payroll_employer_taxes').delete().eq('regime_id', regimeId);
      if (currentRegime.employerTaxes.length > 0) {
        await supabase.schema('atlas_people').from('payroll_employer_taxes').insert(
          currentRegime.employerTaxes.map((t, i) => ({
            regime_id: regimeId, sort_order: i + 1,
            code: t.code, label: t.label, rate_bps: t.bps, account: t.account || null,
          })),
        );
      }

      updateRegime({ _dirty: false, _saved: true });
      toast({ variant: 'success', title: 'Régime sauvegardé', description: `${currentRegime.countryName} · v${currentRegime.version}` });
    } catch (err) {
      toast({ variant: 'error', title: 'Erreur de sauvegarde', description: String(err) });
    } finally { setSaving(false); }
  };

  const configuredCodes = Object.keys(regimes);
  const unconfiguredCountries = COUNTRIES.filter((c) => !configuredCodes.includes(c.code));

  return (
    <div className="animate-fade-up space-y-6">
      {/* En-tête */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-deep">M3 · Paie</p>
        <h1 className="font-display text-3xl text-ink">Régimes de paie OHADA</h1>
        <p className="mt-1 text-sm font-medium text-ink-500">
          Configurez les taux de cotisations, barèmes d'impôt et taxes patronales par pays pour votre entreprise.
          Le moteur de paie utilise ces paramètres en priorité sur les valeurs par défaut.
        </p>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-6">
        {/* ── Sidebar pays ─────────────────────────────────── */}
        <div className="space-y-3">
          <Card>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
              Pays configurés ({configuredCodes.length})
            </p>
            <div className="space-y-1">
              {COUNTRIES.filter((c) => configuredCodes.includes(c.code)).map((c) => {
                const r = regimes[c.code];
                return (
                  <button key={c.code} onClick={() => setSelected(c.code)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors',
                      selected === c.code
                        ? 'bg-amber/[0.1] text-amber-deep'
                        : 'hover:bg-canvas text-ink',
                    )}>
                    <span className="text-base">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[12px] font-bold">{c.name}</p>
                      <p className="text-[10px] text-ink-500">{c.socialFund}</p>
                    </div>
                    {r?._dirty && <span className="h-2 w-2 rounded-full bg-amber-deep" />}
                    {r?._saved && !r._dirty && <CheckCircle size={12} className="text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {unconfiguredCountries.length > 0 && (
            <Card>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                Ajouter un pays ({unconfiguredCountries.length})
              </p>
              <div className="max-h-56 overflow-y-auto space-y-1 no-scrollbar">
                {unconfiguredCountries.map((c) => (
                  <button key={c.code} onClick={() => addCountry(c.code)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-left hover:bg-canvas text-ink-500 hover:text-ink transition-colors">
                    <span className="text-base">{c.flag}</span>
                    <span className="text-[12px] font-medium">{c.name}</span>
                    <Plus size={11} className="ml-auto" />
                  </button>
                ))}
              </div>
            </Card>
          )}

          <div className="rounded-xl border border-amber/30 bg-amber/[0.04] p-3 text-[11px] text-ink-500">
            <div className="flex items-start gap-2">
              <Info size={13} className="mt-0.5 shrink-0 text-amber-deep" />
              <p>Les valeurs sont indicatives et doivent être <strong className="text-ink">validées par un expert-comptable OHADA</strong> avant usage en production.</p>
            </div>
          </div>
        </div>

        {/* ── Éditeur régime ───────────────────────────────── */}
        {currentRegime ? (
          <div className="space-y-4">
            {/* Header régime */}
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {COUNTRIES.find((c) => c.code === currentRegime.countryCode)?.flag}
                  </span>
                  <div>
                    <h2 className="font-display text-xl text-ink">{currentRegime.countryName}</h2>
                    <p className="text-[12px] text-ink-500">{currentRegime.zone} · {currentRegime.currency} · {currentRegime.socialFund}</p>
                  </div>
                  {currentRegime._dirty
                    ? <StatusPill tone="amber" dot>Modifications non sauvegardées</StatusPill>
                    : currentRegime._saved
                    ? <StatusPill tone="green" dot>Sauvegardé</StatusPill>
                    : <StatusPill tone="gray" dot>Par défaut (statique)</StatusPill>
                  }
                </div>
                <Button size="sm" onClick={saveRegime} disabled={saving || !currentRegime._dirty}>
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                  {saving ? 'Sauvegarde…' : 'Sauvegarder'}
                </Button>
              </div>

              {/* Identité régime */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <FormField label="Code impôt" value={currentRegime.incomeTaxCode}
                  onChange={(v) => updateRegime({ incomeTaxCode: v })} />
                <FormField label="Libellé impôt" value={currentRegime.incomeTaxLabel}
                  onChange={(v) => updateRegime({ incomeTaxLabel: v })} />
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Abattement frais pro
                  </label>
                  <div className="flex items-center gap-1">
                    <input type="number" step="0.01" min="0" max="100"
                      value={bpsToPercent(currentRegime.abatementBps)}
                      onChange={(e) => updateRegime({ abatementBps: percentToBps(e.target.value) })}
                      className="w-24 rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none" />
                    <span className="text-[13px] text-ink-500">%</span>
                  </div>
                </div>
                <FormField label="Caisse sociale" value={currentRegime.socialFund}
                  onChange={(v) => updateRegime({ socialFund: v })} />
                <FormField label="Version" value={currentRegime.version}
                  onChange={(v) => updateRegime({ version: v })} />
                <FormField label="Applicable depuis" value={currentRegime.effectiveFrom}
                  type="date" onChange={(v) => updateRegime({ effectiveFrom: v })} />
              </div>
            </Card>

            {/* Onglets sections */}
            <div className="flex gap-1 rounded-xl border border-line bg-surface p-1">
              {([
                ['contributions', `Cotisations (${currentRegime.contributions.length})`],
                ['brackets', `Barème IRPP (${currentRegime.brackets.length} tranches)`],
                ['employer_taxes', `Taxes patronales (${currentRegime.employerTaxes.length})`],
              ] as const).map(([id, label]) => (
                <button key={id} onClick={() => setActiveSection(id)}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-[12px] font-bold transition-colors',
                    activeSection === id
                      ? 'bg-amber-deep text-white shadow-sm'
                      : 'text-ink-500 hover:text-ink',
                  )}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── Cotisations sociales ── */}
            {activeSection === 'contributions' && (
              <Card>
                <CardHeader title="Cotisations sociales" subtitle="CNPS / IPRES / CSS / CNSS…"
                  action={<button onClick={addContrib} className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-deep hover:underline"><Plus size={12} /> Ajouter</button>} />
                {currentRegime.contributions.length === 0 ? (
                  <EmptyState label="Aucune cotisation" onAdd={addContrib} />
                ) : (
                  <div className="space-y-3">
                    {currentRegime.contributions.map((c, i) => (
                      <div key={c._id} className="rounded-xl border border-line/60 bg-canvas p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Cotisation {i + 1}</span>
                          <button onClick={() => removeContrib(c._id)} className="text-ink-400 hover:text-rose-600"><Trash2 size={13} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <FormField label="Code" value={c.code} onChange={(v) => updateContrib(c._id, { code: v })} />
                          <FormField label="Libellé" value={c.label} onChange={(v) => updateContrib(c._id, { label: v })} className="sm:col-span-2" />
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-500">Assiette</label>
                            <select value={c.base} onChange={(e) => updateContrib(c._id, { base: e.target.value as 'gross' | 'capped' })}
                              className="w-full rounded-xl border border-line bg-surface px-2 py-1.5 text-[12px] font-medium text-ink focus:border-amber-deep focus:outline-none">
                              <option value="gross">Brut total</option>
                              <option value="capped">Plafonnée</option>
                            </select>
                          </div>
                          {c.base === 'capped' && (
                            <FormField label="Plafond (FCFA/mois)" value={String(c.ceiling ?? '')}
                              type="number" onChange={(v) => updateContrib(c._id, { ceiling: v ? parseInt(v) : undefined })} />
                          )}
                          <TauxField label="Taux salarié (%)" value={c.employeeBps}
                            onChange={(v) => updateContrib(c._id, { employeeBps: v })} />
                          <TauxField label="Taux patronal (%)" value={c.employerBps}
                            onChange={(v) => updateContrib(c._id, { employerBps: v })} />
                          <FormField label="Cpt. salarié (SYSCOHADA)" value={c.accountEmployee}
                            onChange={(v) => updateContrib(c._id, { accountEmployee: v })} />
                          <FormField label="Cpt. employeur (SYSCOHADA)" value={c.accountEmployer}
                            onChange={(v) => updateContrib(c._id, { accountEmployer: v })} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* ── Barème IRPP ── */}
            {activeSection === 'brackets' && (
              <Card>
                <CardHeader title={`Barème ${currentRegime.incomeTaxLabel}`} subtitle="Tranches progressives mensuelles"
                  action={<button onClick={addBracket} className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-deep hover:underline"><Plus size={12} /> Ajouter tranche</button>} />
                {currentRegime.brackets.length === 0 ? (
                  <EmptyState label="Aucune tranche" onAdd={addBracket} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-line text-left text-[10px] font-bold uppercase tracking-wider text-ink-500">
                          <th className="pb-2 pr-4">#</th>
                          <th className="pb-2 pr-4">Revenu jusqu'à (FCFA)</th>
                          <th className="pb-2 pr-4">Taux marginal (%)</th>
                          <th className="pb-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {currentRegime.brackets.map((b, i) => (
                          <tr key={b._id} className="border-b border-line/60">
                            <td className="py-2 pr-4 text-ink-500">{i + 1}</td>
                            <td className="py-2 pr-4">
                              {b.upTo === null ? (
                                <span className="rounded bg-amber/[0.1] px-2 py-0.5 text-[11px] font-bold text-amber-deep">
                                  Tranche supérieure (∞)
                                </span>
                              ) : (
                                <input type="number" value={b.upTo ?? ''}
                                  onChange={(e) => updateBracket(b._id, { upTo: e.target.value ? parseInt(e.target.value) : null })}
                                  className="w-40 rounded-lg border border-line bg-surface px-2 py-1 text-[12px] font-medium text-ink focus:border-amber-deep focus:outline-none" />
                              )}
                            </td>
                            <td className="py-2 pr-4">
                              <div className="flex items-center gap-1">
                                <input type="number" step="0.01" min="0" max="100"
                                  value={bpsToPercent(b.bps)}
                                  onChange={(e) => updateBracket(b._id, { bps: percentToBps(e.target.value) })}
                                  className="w-24 rounded-lg border border-line bg-surface px-2 py-1 text-[12px] font-medium text-ink focus:border-amber-deep focus:outline-none" />
                                <span className="text-ink-500">%</span>
                              </div>
                            </td>
                            <td className="py-2 text-right">
                              <div className="flex items-center gap-1 justify-end">
                                {b.upTo !== null && (
                                  <button onClick={() => updateBracket(b._id, { upTo: null })}
                                    className="text-[10px] text-amber-deep hover:underline">→ ∞</button>
                                )}
                                <button onClick={() => removeBracket(b._id)} className="text-ink-400 hover:text-rose-600">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {/* ── Taxes patronales ── */}
            {activeSection === 'employer_taxes' && (
              <Card>
                <CardHeader title="Taxes patronales" subtitle="FDFP / 3FPT / TA / CFCE…"
                  action={<button onClick={addEmpTax} className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-deep hover:underline"><Plus size={12} /> Ajouter</button>} />
                {currentRegime.employerTaxes.length === 0 ? (
                  <EmptyState label="Aucune taxe patronale" onAdd={addEmpTax} />
                ) : (
                  <div className="space-y-2">
                    {currentRegime.employerTaxes.map((t, i) => (
                      <div key={t._id} className="flex items-end gap-2 rounded-xl border border-line/60 bg-canvas p-3">
                        <FormField label="Code" value={t.code} onChange={(v) => updateEmpTax(t._id, { code: v })} className="w-24" />
                        <FormField label="Libellé" value={t.label} onChange={(v) => updateEmpTax(t._id, { label: v })} className="flex-1" />
                        <TauxField label="Taux (%)" value={t.bps} onChange={(v) => updateEmpTax(t._id, { bps: v })} />
                        <FormField label="Compte SYSCOHADA" value={t.account} onChange={(v) => updateEmpTax(t._id, { account: v })} className="w-32" />
                        <button onClick={() => removeEmpTax(t._id)} className="mb-2 text-ink-400 hover:text-rose-600"><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        ) : (
          <Card className="flex items-center justify-center py-24 text-center">
            <div>
              <Globe size={36} className="mx-auto mb-3 text-ink-300" />
              <p className="font-bold text-ink">Sélectionnez un pays</p>
              <p className="mt-1 text-[12px] text-ink-500">ou ajoutez un nouveau régime depuis la liste des pays OHADA.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Petits composants utilitaires ────────────────────────────────────

function FormField({ label, value, onChange, type = 'text', className }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none" />
    </label>
  );
}

function TauxField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
      <div className="flex items-center gap-1">
        <input type="number" step="0.01" min="0" max="100"
          value={bpsToPercent(value)}
          onChange={(e) => onChange(percentToBps(e.target.value))}
          className="w-20 rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none" />
        <span className="text-[12px] text-ink-500">%</span>
      </div>
    </label>
  );
}

function EmptyState({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <p className="text-[12px] font-medium text-ink-500">{label}</p>
      <button onClick={onAdd}
        className="inline-flex items-center gap-1 rounded-xl border border-dashed border-amber-deep/40 px-4 py-2 text-[12px] font-bold text-amber-deep hover:bg-amber/[0.04]">
        <Plus size={12} /> Ajouter
      </button>
    </div>
  );
}
