/**
 * Atlas People — Reports (REPORTING_STANDARD §12).
 *
 * Orchestrateur < 500 LOC. Compose un ReportConfig, prévisualise (zone
 * `.report-print-area`), exporte PDF (jspdf) / PPTX (pptxgenjs).
 *
 * Version sprint 1 — éditeur simplifié (identité + palette + format + templates).
 * Le visualiseur 3 colonnes drag&drop viendra dans un sprint suivant.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, FileType, Printer, Save, Eye, Sparkles,
  Palette as PaletteIcon, FileDown, Trash2, Plus, Library,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { useToast } from '../components/ui/Toast';
import { cn } from '../lib/cn';
import {
  DEFAULT_CONFIG, PALETTES, buildPDFFromBlocks, buildPPTXFromBlocks,
  type ReportConfig, type ReportData, type PaletteKey, type Block,
} from '../engine/reportBlocks';
import {
  QUICK_TEMPLATES, QUICK_TEMPLATE_META, TABLE_CATALOG, computeKPIs,
  filterConditionalBlocks,
} from './Reports/reportData';
import { EMPLOYEES, employeeName } from '../data/mock';
import { computePayslip, getRegime } from '../lib/payroll';
import { Money } from '../lib/money';
import { TENANT_CURRENCY } from '../data/countries';
import { safeLocalStorage } from '../lib/safeStorage';

const PERIOD = 'Avril 2026';

function buildAtlasReportData(): ReportData {
  // Effectifs par dept
  const byDept: Record<string, { count: number; active: number }> = {};
  EMPLOYEES.forEach((e) => {
    if (!byDept[e.department]) byDept[e.department] = { count: 0, active: 0 };
    byDept[e.department].count += 1;
    if (e.status === 'active') byDept[e.department].active += 1;
  });

  // Paie déterministe (1 mois courant)
  let gross = 0, net = 0, employerCost = 0;
  for (const e of EMPLOYEES) {
    const regime = getRegime(e.countryCode);
    const { result } = computePayslip({
      baseSalary: e.baseSalary, taxableAllowances: e.taxableAllowances,
      nonTaxableAllowances: e.nonTaxableAllowances, fiscalParts: e.fiscalParts,
      otherDeductions: e.otherDeductions,
    }, regime, employeeName(e));
    employerCost += Money.fromJSON({ units: result.employerCostUnits, currency: TENANT_CURRENCY }).toInt();
    net += Money.fromJSON({ units: result.netToPayUnits, currency: TENANT_CURRENCY }).toInt();
    gross += Money.fromJSON({ units: result.grossTotalUnits, currency: TENANT_CURRENCY }).toInt();
  }

  return {
    effectifsByDept: Object.entries(byDept).map(([dept, v]) => ({
      dept, count: v.count, activeRatio: v.active / v.count,
    })),
    effectifsByCountry: [
      { country: 'Côte d\'Ivoire', count: EMPLOYEES.filter((e) => e.countryCode === 'CI').length, share: 70 },
      { country: 'Sénégal', count: EMPLOYEES.filter((e) => e.countryCode === 'SN').length, share: 30 },
    ],
    payrollCycles: [
      { period: 'Avril 2026', gross, net, employerCost, status: 'Calculé' },
      { period: 'Mars 2026', gross: gross * 0.98, net: net * 0.98, employerCost: employerCost * 0.98, status: 'Validé' },
      { period: 'Février 2026', gross: gross * 0.97, net: net * 0.97, employerCost: employerCost * 0.97, status: 'Payé' },
    ],
    absenceByType: [
      { type: 'Congés payés', days: 124, cost: 6_200_000 },
      { type: 'Maladie', days: 38, cost: 1_900_000 },
      { type: 'Maternité', days: 90, cost: 4_500_000 },
      { type: 'Formation', days: 56, cost: 0 },
    ],
    recruitmentPipeline: [
      { stage: 'Sourcés', count: 124, convRate: 0.42 },
      { stage: 'Présélectionnés', count: 52, convRate: 0.31 },
      { stage: 'Entretiens', count: 16, convRate: 0.50 },
      { stage: 'Offres', count: 8, convRate: 0.75 },
      { stage: 'Embauches', count: 6, convRate: 1.00 },
    ],
    onboardingPulse: [
      { jalon: 'J+7',  complete: 100, avg_score: 8.4 },
      { jalon: 'J+30', complete: 90,  avg_score: 8.1 },
      { jalon: 'J+60', complete: 75,  avg_score: 8.5 },
      { jalon: 'J+90', complete: 60,  avg_score: 8.7 },
    ],
    okrCascade: [
      { level: 'Entreprise', total: 5, onTrack: 4, atRisk: 1, completed: 0 },
      { level: 'Département', total: 18, onTrack: 13, atRisk: 3, completed: 2 },
      { level: 'Individuel', total: 42, onTrack: 31, atRisk: 7, completed: 4 },
    ],
    evaluationsByClass: [
      { classe: 'A — Excellence', count: 3, share: 21 },
      { classe: 'B — Conforme',   count: 9, share: 64 },
      { classe: 'C — À développer', count: 2, share: 15 },
    ],
    skillsGap: [
      { skill: 'IFRS', holders: 2, required: 5, gap: 3 },
      { skill: 'Négociation B2B', holders: 4, required: 6, gap: 2 },
      { skill: 'IA générative', holders: 1, required: 3, gap: 2 },
      { skill: 'SCRUM Master', holders: 2, required: 3, gap: 1 },
    ],
    certificationsExpiring: [
      { employee: 'Aïcha Diop', cert: 'PRINCE2 Practitioner', expiry: '2026-04-20' },
      { employee: 'Jean-Baptiste Koffi', cert: 'SPIN Selling', expiry: '2026-05-15' },
    ],
    successionByRole: [
      { role: 'Directeur Financier', readyNow: 0, ready18m: 1, ready3y: 1 },
      { role: 'Directeur Commercial', readyNow: 1, ready18m: 1, ready3y: 0 },
      { role: 'Architecte Cloud', readyNow: 0, ready18m: 0, ready3y: 1 },
      { role: 'DRH', readyNow: 0, ready18m: 1, ready3y: 0 },
    ],
    promotionsByPeriod: [
      { period: 'Q1 2026', count: 3, budget: 1_120_000 },
      { period: 'Q4 2025', count: 5, budget: 1_850_000 },
    ],
    formationKPIs: {
      beneficiariesYTD: 12, accessRate: 0.86, hoursPerEmployee: 32,
      budgetConsumed: 8_500_000, fdfpRecuperable: 2_400_000,
    },
    parcoursCompletion: [
      { parcours: 'Commercial B2B Senior', enrolled: 2, completed: 0, rate: 47.5 },
      { parcours: 'Manager 1ère ligne', enrolled: 2, completed: 1, rate: 64 },
      { parcours: 'IFRS Praticien', enrolled: 1, completed: 0, rate: 85 },
      { parcours: 'HSE socle', enrolled: 2, completed: 1, rate: 87.5 },
      { parcours: 'Data & IA appliquée', enrolled: 1, completed: 0, rate: 60 },
    ],
    conformiteScores: { global: 94, duer: 92, rps: 88, atmp: 96, declarations: 100 },
    duerRisks: [
      { unit: 'Site industriel', level: 'Critique', count: 0 },
      { unit: 'Site industriel', level: 'Élevé', count: 2 },
      { unit: 'Bureaux', level: 'Modéré', count: 8 },
    ],
    workIncidents: [
      { period: 'Avril 2026', count: 1, severity: 'Léger' },
      { period: 'Mars 2026', count: 0, severity: '—' },
    ],
    parityByAxis: [
      { axis: 'Genre (femmes/hommes notations)', ratio: 0.62, threshold: 0.80, status: '⚠ Sous-noté' },
      { axis: 'Âge (45+ vs <35)', ratio: 0.71, threshold: 0.80, status: '⚠ Biais détecté' },
      { axis: 'Ancienneté (5+ ans)', ratio: 0.92, threshold: 0.80, status: '✓ Conforme' },
    ],
    formationKPIs2: undefined,
    totalCost: { employerCost, net, charges: employerCost - net, perEmployee: employerCost / EMPLOYEES.length },
  } as ReportData;
}

const STORAGE_KEY = 'atlas-reports-config';

export function ReportsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ReportConfig>(() =>
    safeLocalStorage.getJSON<ReportConfig>(STORAGE_KEY, DEFAULT_CONFIG(PERIOD)),
  );
  const [exporting, setExporting] = useState<'pdf' | 'pptx' | null>(null);

  const data = useMemo(() => buildAtlasReportData(), []);
  const palette = PALETTES[config.palette];

  const setIdentity = (patch: Partial<ReportConfig['identity']>) => {
    setConfig((c) => ({ ...c, identity: { ...c.identity, ...patch } }));
  };
  const setOption = (key: keyof ReportConfig['options'], value: boolean) => {
    setConfig((c) => ({ ...c, options: { ...c.options, [key]: value } }));
  };
  const applyTemplate = (key: keyof typeof QUICK_TEMPLATES) => {
    const blocks = filterConditionalBlocks(QUICK_TEMPLATES[key](data), data);
    setConfig((c) => ({ ...c, blocks }));
    toast({ variant: 'success', title: 'Modèle appliqué', description: QUICK_TEMPLATE_META[key].label });
  };
  const clearBlocks = () => {
    setConfig((c) => ({ ...c, blocks: [] }));
    toast({ variant: 'info', title: 'Rapport vidé', description: 'Tous les blocs ont été retirés.' });
  };
  const save = () => {
    safeLocalStorage.setJSON(STORAGE_KEY, config);
    toast({ variant: 'success', title: 'Rapport sauvegardé', description: 'Conservé localement (Supabase à venir).' });
  };

  const exportPDF = () => {
    setExporting('pdf');
    try {
      const doc = buildPDFFromBlocks(config, data, 'Atlas Démo SA', 'Côte d\'Ivoire · OHADA');
      doc.save(`${config.identity.title.replace(/\s+/g, '_')}_${config.identity.period}.pdf`);
      toast({ variant: 'success', title: 'PDF généré', description: 'Téléchargement en cours.' });
    } catch (e) {
      toast({ variant: 'error', title: 'Erreur export PDF', description: String(e) });
    } finally { setExporting(null); }
  };
  const exportPPTX = async () => {
    setExporting('pptx');
    try {
      const blob = await buildPPTXFromBlocks(config, data, 'Atlas Démo SA');
      saveAs(blob, `${config.identity.title.replace(/\s+/g, '_')}_${config.identity.period}.pptx`);
      toast({ variant: 'success', title: 'PPTX généré', description: 'Téléchargement en cours.' });
    } catch (e) {
      toast({ variant: 'error', title: 'Erreur export PPTX', description: String(e) });
    } finally { setExporting(null); }
  };

  const k = computeKPIs(data);

  return (
    <div className="animate-fade-up space-y-5">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-deep">Pilotage</p>
          <h1 className="font-display text-3xl text-ink">Reporting RH</h1>
          <p className="mt-1 text-sm font-medium text-ink-500">
            Composez · prévisualisez · exportez (PDF / PPTX) · {config.blocks.length} bloc{config.blocks.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/cockpit-360"><Button variant="outline" size="sm"><ArrowLeft size={13} /> Cockpit DRH</Button></Link>
          <Button variant="outline" size="sm" onClick={save}><Save size={13} /> Sauvegarder</Button>
          <Button variant="outline" size="sm" disabled={exporting === 'pptx' || !config.blocks.length} onClick={exportPPTX}>
            <FileType size={13} /> {exporting === 'pptx' ? '…' : 'PPTX'}
          </Button>
          <Button size="sm" disabled={exporting === 'pdf' || !config.blocks.length} onClick={exportPDF}>
            <FileDown size={13} /> {exporting === 'pdf' ? '…' : 'PDF'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* ────────── COLONNE GAUCHE — Éditeur ────────── */}
        <aside className="no-print space-y-3">
          {/* Identité */}
          <Card>
            <CardHeader title="Identité" subtitle="Couverture du rapport" action={<FileText size={15} className="text-amber-deep" />} />
            <div className="space-y-2">
              <Field label="Titre" value={config.identity.title}    onChange={(v) => setIdentity({ title: v })} />
              <Field label="Sous-titre" value={config.identity.subtitle} onChange={(v) => setIdentity({ subtitle: v })} />
              <Field label="Période" value={config.identity.period}   onChange={(v) => setIdentity({ period: v })} />
              <Field label="Auteur"  value={config.identity.author}   onChange={(v) => setIdentity({ author: v })} />
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-500">Confidentialité</span>
                <select value={config.identity.confidentiality}
                  onChange={(e) => setIdentity({ confidentiality: e.target.value as ReportConfig['identity']['confidentiality'] })}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none">
                  <option value="public">Public</option>
                  <option value="interne">Interne</option>
                  <option value="confidentiel">Confidentiel</option>
                  <option value="strict">Strict</option>
                </select>
              </label>
            </div>
          </Card>

          {/* Format & options */}
          <Card>
            <CardHeader title="Format de sortie" action={<Printer size={15} className="text-amber-deep" />} />
            <div className="grid grid-cols-3 gap-1.5">
              {(['A4_portrait', 'A4_landscape', 'pptx'] as const).map((f) => (
                <button key={f} type="button" onClick={() => setConfig((c) => ({ ...c, format: f }))}
                  className={cn('rounded-lg border px-2 py-1.5 text-[10px] font-bold transition-colors',
                    config.format === f ? 'border-amber-deep bg-amber/[0.08] text-amber-deep' : 'border-line text-ink-500 hover:border-amber-deep/40')}>
                  {f === 'A4_portrait' ? 'A4 ↕' : f === 'A4_landscape' ? 'A4 ↔' : 'PPTX'}
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 text-[12px]">
              {([
                ['includeCover', 'Couverture'],
                ['includeTOC', 'Sommaire'],
                ['includeFooter', 'Pied de page'],
                ['includePageNumbers', 'Numérotation'],
              ] as const).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={config.options[k]} onChange={(e) => setOption(k, e.target.checked)} className="accent-amber-deep" />
                  <span className="font-medium text-ink-700">{label}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Palette */}
          <Card>
            <CardHeader title="Palette" action={<PaletteIcon size={15} className="text-amber-deep" />} />
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(PALETTES) as PaletteKey[]).map((key) => {
                const p = PALETTES[key];
                return (
                  <button key={key} type="button" onClick={() => setConfig((c) => ({ ...c, palette: key }))}
                    className={cn('flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors',
                      config.palette === key ? 'border-amber-deep bg-amber/[0.06]' : 'border-line hover:border-amber-deep/40')}>
                    <span className="flex h-5 w-5 shrink-0 rounded-md border border-line/60" style={{ background: p.accent }} />
                    <span className="truncate text-[11px] font-semibold text-ink">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Templates */}
          <Card>
            <CardHeader title="Modèles rapides" subtitle="5 templates RH OHADA" action={<Sparkles size={15} className="text-amber-deep" />} />
            <div className="space-y-1.5">
              {(Object.keys(QUICK_TEMPLATES) as (keyof typeof QUICK_TEMPLATES)[]).map((k) => {
                const meta = QUICK_TEMPLATE_META[k];
                return (
                  <button key={k} type="button" onClick={() => applyTemplate(k)}
                    className="group flex w-full items-start gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-amber-deep/40 hover:bg-amber/[0.04]">
                    <Plus size={13} className="mt-0.5 shrink-0 text-amber-deep" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-ink group-hover:text-amber-deep">{meta.label}</p>
                      <p className="mt-0.5 text-[10px] font-medium leading-snug text-ink-500">{meta.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {config.blocks.length > 0 && (
              <button type="button" onClick={clearBlocks}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1.5 text-[11px] font-bold text-ink-500 transition-colors hover:border-rose-500/40 hover:text-rose-600">
                <Trash2 size={11} /> Vider le rapport
              </button>
            )}
          </Card>

          {/* Catalogue sources */}
          <Card>
            <CardHeader title="Sources disponibles" subtitle={`${TABLE_CATALOG.length} sources de tables`} action={<Library size={15} className="text-amber-deep" />} />
            <div className="max-h-48 overflow-y-auto pr-1 no-scrollbar">
              {TABLE_CATALOG.map((s) => (
                <div key={s.v} className="border-b border-line/60 py-1.5 text-[11px]">
                  <p className="font-semibold text-ink">{s.label}</p>
                  <p className="text-[10px] text-ink-500">{s.cat} · {s.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        {/* ────────── COLONNE DROITE — Visualiseur A4 ────────── */}
        <section className="report-print-area">
          <Card inset={false}>
            <div className="p-5 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">Aperçu A4</h2>
                  <p className="text-[11px] font-medium text-ink-500">Format {config.format.replace('_', ' ')} · Palette {palette.name}</p>
                </div>
                <StatusPill tone="amber" dot={false}>{config.blocks.length} blocs</StatusPill>
              </div>
            </div>

            {/* KPIs récapitulatif */}
            <div className="border-t border-line px-5 py-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">KPIs récap (live)</p>
              <div className="grid grid-cols-2 gap-2 text-[12px] md:grid-cols-4">
                {[
                  ['Effectif', k.effectif],
                  ['Coût employeur', k.coutEmployeur],
                  ['Conformité', k.conformite],
                  ['Accès formation', k.accesFormation],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-surface2 px-2 py-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
                    <p className="mono text-[14px] font-bold text-ink">{value ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Liste des blocs */}
            <div className="border-t border-line px-5 py-4">
              {config.blocks.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <FileText size={32} className="text-ink-300" />
                  <p className="text-sm font-semibold text-ink">Aucun bloc dans ce rapport</p>
                  <p className="text-[11px] font-medium text-ink-500">Appliquez un modèle rapide à gauche pour démarrer.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {config.blocks.map((b, i) => <BlockRow key={b.id} index={i} block={b} />)}
                </div>
              )}
            </div>

            <div className="border-t border-line bg-surface2/40 px-5 py-3">
              <p className="text-[10px] font-medium text-ink-500">
                <Eye size={11} className="mr-0.5 inline" /> Le rendu final (PDF/PPTX) intègre couverture, sommaire automatique,
                en-têtes/pieds et pagination. Cliquez sur <strong className="text-amber-deep">PDF</strong> ou <strong className="text-amber-deep">PPTX</strong> pour générer.
              </p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

interface FieldProps { label: string; value: string; onChange: (v: string) => void }
function Field({ label, value, onChange }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none" />
    </label>
  );
}

function BlockRow({ index, block }: { index: number; block: Block }) {
  const meta: Record<Block['type'], { label: string; icon: string; color: string }> = {
    h1: { label: 'Titre H1', icon: 'H1', color: 'bg-amber/12 text-amber-deep' },
    h2: { label: 'Titre H2', icon: 'H2', color: 'bg-amber/12 text-amber-deep' },
    h3: { label: 'Titre H3', icon: 'H3', color: 'bg-amber/12 text-amber-deep' },
    paragraph: { label: 'Paragraphe', icon: '¶', color: 'bg-ink/[0.06] text-ink-700' },
    kpi: { label: 'KPIs', icon: '#', color: 'bg-emerald-500/[0.10] text-emerald-700' },
    table: { label: 'Tableau', icon: '⊞', color: 'bg-blue-500/[0.10] text-blue-700' },
    dashboard: { label: 'Dashboard', icon: '◧', color: 'bg-violet-500/[0.10] text-violet-700' },
    pageBreak: { label: '— Saut de page —', icon: '↵', color: 'bg-rose-500/[0.06] text-rose-600' },
    image: { label: 'Image', icon: '🖼', color: 'bg-slate-500/[0.10] text-slate-700' },
    spacer: { label: 'Espace', icon: '↕', color: 'bg-slate-500/[0.05] text-slate-500' },
  };
  const m = meta[block.type];
  const title = block.type === 'h1' || block.type === 'h2' || block.type === 'h3'
    ? (block as { text: string }).text
    : block.type === 'paragraph'
      ? (block as { text: string }).text.slice(0, 100)
      : block.type === 'kpi'
        ? `${(block as { items: unknown[] }).items.length} KPIs`
        : block.type === 'table'
          ? `Source : ${(block as { source: string }).source}`
          : m.label;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2 py-1.5">
      <span className="mono text-[10px] font-bold text-ink-400">{String(index + 1).padStart(2, '0')}</span>
      <span className={cn('flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold', m.color)}>{m.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-ink">{m.label}</p>
        <p className="truncate text-[10px] font-medium text-ink-500">{title}</p>
      </div>
    </div>
  );
}
