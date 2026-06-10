/**
 * Atlas People — Reports (REPORTING_STANDARD §10 — 3 colonnes).
 *
 * Layout conforme : Éditeur replié | Visualiseur A4 | Récapitulatif replié.
 * Orchestrateur < 500 LOC ; toute logique dans Reports/ et engine/.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, FileType, Save, Sparkles, Palette as PaletteIcon,
  FileDown, Trash2, Plus, Library, ChevronLeft, ChevronRight, History,
  Send, FolderOpen, Wand2, Eraser, BookText,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { useToast } from '../components/ui/Toast';
import { cn } from '../lib/cn';
import { safeLocalStorage } from '../lib/safeStorage';
import {
  DEFAULT_CONFIG, PALETTES, buildPDFFromBlocks, buildPPTXFromBlocks,
  type ReportConfig, type ReportData, type PaletteKey, type Block, type ReportDoc,
} from '../engine/reportBlocks';
import {
  QUICK_TEMPLATES, QUICK_TEMPLATE_META, TABLE_CATALOG,
  filterConditionalBlocks, computeKPIs,
} from './Reports/reportData';
import { renderPages } from './Reports/renderPages';
import {
  SaveModal, LoadModal, SendModal, CatalogModal, JournalModal, LogoUpload,
  appendJournal,
} from './Reports/Modals';
import { autoCommentReport, clearAutoComments } from '../engine/proph3/reportCommentator';
import { employeeName, type EmployeeRecord } from '../data/mock';
import { useRoster } from '../lib/m1/roster';
import { computePayslip, getRegime } from '../lib/payroll';
import { Money } from '../lib/money';
import { TENANT_CURRENCY } from '../data/countries';

const PERIOD = 'Avril 2026';
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const STORAGE_KEY = 'atlas-reports-config';
const COL_PREFS_KEY = 'atlas-reports-cols';

function buildAtlasReportData(roster: EmployeeRecord[]): ReportData {
  const byDept: Record<string, { count: number; active: number }> = {};
  roster.forEach((e) => {
    if (!byDept[e.department]) byDept[e.department] = { count: 0, active: 0 };
    byDept[e.department].count += 1;
    if (e.status === 'active') byDept[e.department].active += 1;
  });

  let gross = 0, net = 0, employerCost = 0;
  for (const e of roster) {
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
    effectifsByDept: Object.entries(byDept).map(([dept, v]) => ({ dept, count: v.count, activeRatio: v.active / v.count })),
    effectifsByCountry: [
      { country: 'Côte d\'Ivoire', count: roster.filter((e) => e.countryCode === 'CI').length, share: 70 },
      { country: 'Sénégal', count: roster.filter((e) => e.countryCode === 'SN').length, share: 30 },
    ],
    payrollCycles: [
      { period: 'Avril 2026', gross, net, employerCost, status: 'Calculé' },
      { period: 'Mars 2026',   gross: gross * 0.98, net: net * 0.98, employerCost: employerCost * 0.98, status: 'Validé' },
      { period: 'Février 2026',gross: gross * 0.97, net: net * 0.97, employerCost: employerCost * 0.97, status: 'Payé'   },
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
      { jalon: 'J+7', complete: 100, avg_score: 8.4 },
      { jalon: 'J+30', complete: 90, avg_score: 8.1 },
      { jalon: 'J+60', complete: 75, avg_score: 8.5 },
      { jalon: 'J+90', complete: 60, avg_score: 8.7 },
    ],
    okrCascade: [
      { level: 'Entreprise', total: 5, onTrack: 4, atRisk: 1, completed: 0 },
      { level: 'Département', total: 18, onTrack: 13, atRisk: 3, completed: 2 },
      { level: 'Individuel',  total: 42, onTrack: 31, atRisk: 7, completed: 4 },
    ],
    evaluationsByClass: [
      { classe: 'A — Excellence', count: 3, share: 21 },
      { classe: 'B — Conforme',   count: 9, share: 64 },
      { classe: 'C — À développer', count: 2, share: 15 },
    ],
    skillsGap: [
      { skill: 'IFRS', holders: 2, required: 5, gap: 3 },
      { skill: 'Négociation B2B', holders: 4, required: 6, gap: 2 },
      { skill: 'IA générative',   holders: 1, required: 3, gap: 2 },
      { skill: 'SCRUM Master',    holders: 2, required: 3, gap: 1 },
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
    formationKPIs: { beneficiariesYTD: 12, accessRate: 0.86, hoursPerEmployee: 32, budgetConsumed: 8_500_000, fdfpRecuperable: 2_400_000 },
    parcoursCompletion: [
      { parcours: 'Commercial B2B Senior', enrolled: 2, completed: 0, rate: 47.5 },
      { parcours: 'Manager 1ère ligne',    enrolled: 2, completed: 1, rate: 64 },
      { parcours: 'IFRS Praticien',        enrolled: 1, completed: 0, rate: 85 },
      { parcours: 'HSE socle',             enrolled: 2, completed: 1, rate: 87.5 },
      { parcours: 'Data & IA appliquée',   enrolled: 1, completed: 0, rate: 60 },
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
    totalCost: { employerCost, net, charges: employerCost - net, perEmployee: employerCost / (roster.length || 1) },
  };
}

export function ReportsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ReportConfig>(() =>
    safeLocalStorage.getJSON<ReportConfig>(STORAGE_KEY, DEFAULT_CONFIG(PERIOD)));
  const [docId, setDocId] = useState<number | undefined>(undefined);
  const [exporting, setExporting] = useState<'pdf' | 'pptx' | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [colPrefs, setColPrefs] = useState(() =>
    safeLocalStorage.getJSON(COL_PREFS_KEY, { left: true, right: true }));
  const [modal, setModal] = useState<'save' | 'load' | 'send' | 'catalog' | 'journal' | null>(null);

  const roster = useRoster();
  const data = useMemo(() => buildAtlasReportData(roster), [roster]);
  const palette = PALETTES[config.palette];

  const persist = (c: ReportConfig) => { setConfig(c); safeLocalStorage.setJSON(STORAGE_KEY, c); };
  const setIdentity = (patch: Partial<ReportConfig['identity']>) => persist({ ...config, identity: { ...config.identity, ...patch } });
  const setOption = (k: keyof ReportConfig['options'], v: boolean) => persist({ ...config, options: { ...config.options, [k]: v } });
  const setBlocks = (blocks: Block[]) => persist({ ...config, blocks });
  const toggleCol = (side: 'left' | 'right') => {
    const next = { ...colPrefs, [side]: !colPrefs[side] };
    setColPrefs(next); safeLocalStorage.setJSON(COL_PREFS_KEY, next);
  };

  // Operations sur les blocs
  const moveBlock = (from: number, to: number) => {
    const next = [...config.blocks];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setBlocks(next);
  };
  const deleteBlock = (id: string) => setBlocks(config.blocks.filter((b) => b.id !== id));
  const editBlock = (id: string) => {
    const b = config.blocks.find((x) => x.id === id);
    if (!b) return;
    if (b.type === 'h1' || b.type === 'h2' || b.type === 'h3' || b.type === 'paragraph') {
      const v = prompt('Texte :', (b as { text: string }).text);
      if (v != null) setBlocks(config.blocks.map((x) => x.id === id ? { ...x, text: v, ...(x.type === 'paragraph' ? { auto: false } : {}) } as Block : x));
    }
  };
  const insertAtIdx = (idx: number, block: Block) => {
    const next = [...config.blocks];
    next.splice(idx, 0, block);
    setBlocks(next);
  };

  // Templates
  const applyTemplate = (key: keyof typeof QUICK_TEMPLATES) => {
    const blocks = filterConditionalBlocks(QUICK_TEMPLATES[key](data), data);
    setBlocks(blocks);
    toast({ variant: 'success', title: 'Modèle appliqué', description: QUICK_TEMPLATE_META[key].label });
  };
  const clearBlocks = () => setBlocks([]);

  // PROPH3T
  const autoComment = () => {
    const r = autoCommentReport(config.blocks, data, { tenantId: TENANT_ID, context: 'RH OHADA' });
    setBlocks(r.blocks);
    toast({ variant: 'success', title: 'Commentaires PROPH3T générés', description: `${r.count} paragraphe(s) ajouté(s).` });
  };
  const clearAuto = () => {
    const r = clearAutoComments(config.blocks);
    setBlocks(r.blocks);
    toast({ variant: 'info', title: 'Commentaires IA retirés', description: `${r.count} paragraphe(s) supprimé(s).` });
  };

  // Export
  const exportPDF = () => {
    setExporting('pdf');
    try {
      const doc = buildPDFFromBlocks(config, data, 'Atlas Démo SA', 'Côte d\'Ivoire · OHADA');
      const filename = `${config.identity.title.replace(/\s+/g, '_')}_${config.identity.period}.pdf`;
      doc.save(filename);
      appendJournal({ title: config.identity.title, format: 'PDF' });
      toast({ variant: 'success', title: 'PDF généré', description: filename });
    } catch (e) {
      toast({ variant: 'error', title: 'Erreur PDF', description: String(e) });
    } finally { setExporting(null); }
  };
  const exportPPTX = async () => {
    setExporting('pptx');
    try {
      const blob = await buildPPTXFromBlocks(config, data, 'Atlas Démo SA');
      const filename = `${config.identity.title.replace(/\s+/g, '_')}_${config.identity.period}.pptx`;
      saveAs(blob, filename);
      appendJournal({ title: config.identity.title, format: 'PPTX' });
      toast({ variant: 'success', title: 'PPTX généré', description: filename });
    } catch (e) {
      toast({ variant: 'error', title: 'Erreur PPTX', description: String(e) });
    } finally { setExporting(null); }
  };

  const k = computeKPIs(data);
  const gridCols = `${colPrefs.left ? '300px' : '40px'}_1fr_${colPrefs.right ? '260px' : '40px'}`;

  return (
    <div className="animate-fade-up space-y-4">
      {/* En-tête */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-deep">Pilotage</p>
          <h1 className="font-display text-3xl text-ink">Reporting RH</h1>
          <p className="mt-1 text-sm font-medium text-ink-500">
            Conforme REPORTING_STANDARD v1.0 · {config.blocks.length} blocs · {config.recipients.length} destinataire(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/cockpit-360"><Button variant="outline" size="sm"><ArrowLeft size={13} /> Cockpit</Button></Link>
          <Button variant="outline" size="sm" onClick={() => setModal('journal')}><History size={13} /> Journal</Button>
          <Button variant="outline" size="sm" onClick={() => setModal('load')}><FolderOpen size={13} /> Charger</Button>
          <Button variant="outline" size="sm" onClick={() => setModal('send')}><Send size={13} /> Diffuser</Button>
          <Button variant="outline" size="sm" onClick={() => setModal('save')}><Save size={13} /> Sauvegarder</Button>
          <Button variant="outline" size="sm" disabled={exporting === 'pptx' || !config.blocks.length} onClick={exportPPTX}>
            <FileType size={13} /> {exporting === 'pptx' ? '…' : 'PPTX'}
          </Button>
          <Button size="sm" disabled={exporting === 'pdf' || !config.blocks.length} onClick={exportPDF}>
            <FileDown size={13} /> {exporting === 'pdf' ? '…' : 'PDF'}
          </Button>
        </div>
      </div>

      {/* 3 COLONNES */}
      <div className="grid gap-3" style={{ gridTemplateColumns: gridCols }}>

        {/* ────────── COLONNE GAUCHE : Éditeur (repliable) ────────── */}
        <aside className="no-print space-y-3">
          <button
            type="button"
            onClick={() => toggleCol('left')}
            className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-2 py-1.5 text-[11px] font-bold text-ink-500 hover:text-amber-deep"
          >
            {colPrefs.left ? <><ChevronLeft size={13} /> Replier l'éditeur</> : <ChevronRight size={13} />}
          </button>
          {colPrefs.left && (
            <>
              <Card>
                <CardHeader title="Identité" action={<FileText size={15} className="text-amber-deep" />} />
                <div className="space-y-2">
                  <Field label="Titre"     value={config.identity.title}    onChange={(v) => setIdentity({ title: v })} />
                  <Field label="Sous-titre" value={config.identity.subtitle} onChange={(v) => setIdentity({ subtitle: v })} />
                  <Field label="Période"   value={config.identity.period}   onChange={(v) => setIdentity({ period: v })} />
                  <Field label="Auteur"    value={config.identity.author}   onChange={(v) => setIdentity({ author: v })} />
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
                  <LogoUpload label="Logo entreprise" value={config.identity.logoDataUrl} onChange={(d) => setIdentity({ logoDataUrl: d })} />
                  <LogoUpload label="Image couverture (fond)" value={config.identity.coverBgImageUrl} onChange={(d) => setIdentity({ coverBgImageUrl: d })} />
                </div>
              </Card>

              <Card>
                <CardHeader title="Format & options" action={<BookText size={15} className="text-amber-deep" />} />
                <div className="grid grid-cols-3 gap-1.5">
                  {(['A4_portrait', 'A4_landscape', 'pptx'] as const).map((f) => (
                    <button key={f} type="button" onClick={() => persist({ ...config, format: f })}
                      className={cn('rounded-lg border px-2 py-1.5 text-[10px] font-bold transition-colors',
                        config.format === f ? 'border-amber-deep bg-amber/[0.08] text-amber-deep' : 'border-line text-ink-500 hover:border-amber-deep/40')}>
                      {f === 'A4_portrait' ? 'A4 ↕' : f === 'A4_landscape' ? 'A4 ↔' : 'PPTX'}
                    </button>
                  ))}
                </div>
                <div className="mt-3 space-y-1 text-[12px]">
                  {([['includeCover','Couverture'],['includeTOC','Sommaire'],['includeFooter','Pied de page'],['includePageNumbers','Numérotation']] as const).map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={config.options[k]} onChange={(e) => setOption(k, e.target.checked)} className="accent-amber-deep" />
                      <span className="font-medium text-ink-700">{label}</span>
                    </label>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader title="Palette (10)" action={<PaletteIcon size={15} className="text-amber-deep" />} />
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(PALETTES) as PaletteKey[]).map((key) => {
                    const p = PALETTES[key];
                    return (
                      <button key={key} type="button" onClick={() => persist({ ...config, palette: key })}
                        className={cn('flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors',
                          config.palette === key ? 'border-amber-deep bg-amber/[0.06]' : 'border-line hover:border-amber-deep/40')}>
                        <span className="flex h-5 w-5 shrink-0 rounded-md border border-line/60" style={{ background: p.accent }} />
                        <span className="truncate text-[11px] font-semibold text-ink">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <CardHeader title="Modèles rapides (5)" action={<Sparkles size={15} className="text-amber-deep" />} />
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
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <button onClick={() => setModal('catalog')} className="inline-flex items-center justify-center gap-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-[11px] font-bold text-amber-deep hover:bg-amber/[0.04]">
                    <Library size={11} /> Catalogue
                  </button>
                  <button onClick={clearBlocks} disabled={!config.blocks.length} className="inline-flex items-center justify-center gap-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-[11px] font-bold text-ink-500 disabled:opacity-50 hover:border-rose-500/40 hover:text-rose-600">
                    <Trash2 size={11} /> Vider
                  </button>
                </div>
              </Card>

              <Card className="border-violet-500/25 bg-violet-500/[0.04]">
                <CardHeader title="PROPH3T (IA souveraine)" subtitle="Auto-commentaire des sections" action={<Wand2 size={15} className="text-violet-600" />} />
                <div className="grid grid-cols-2 gap-1.5">
                  <Button variant="outline" size="sm" onClick={autoComment} disabled={!config.blocks.length}>
                    <Wand2 size={11} /> Générer
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAuto} disabled={!config.blocks.length}>
                    <Eraser size={11} /> Effacer IA
                  </Button>
                </div>
                <p className="mt-2 text-[10px] font-medium text-ink-500">
                  Ollama local · jamais d'envoi externe. Préserve les paragraphes manuels.
                </p>
              </Card>
            </>
          )}
        </aside>

        {/* ────────── COLONNE CENTRE : Visualiseur A4 ────────── */}
        <section className="report-print-area min-w-0">
          {config.blocks.length === 0 && !config.options.includeCover ? (
            <Card className="text-center">
              <div className="flex flex-col items-center gap-2 py-16">
                <FileText size={36} className="text-ink-300" />
                <p className="text-sm font-bold text-ink">Aucun bloc dans ce rapport</p>
                <p className="max-w-md text-[12px] font-medium text-ink-500">
                  Appliquez un <strong className="text-amber-deep">modèle rapide</strong> à gauche pour démarrer,
                  ou cliquez sur <strong className="text-amber-deep">Catalogue</strong> pour ajouter un bloc individuel.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {renderPages({
                config, data, palette,
                orgName: 'Atlas Démo SARL',
                orgSub: 'Cocody · Abidjan · CI · CNPS',
                ops: {
                  onMoveBlock: moveBlock,
                  onDeleteBlock: deleteBlock,
                  onEditBlock: editBlock,
                  onInsertAt: (idx) => { setInsertAt(idx); setModal('catalog'); },
                },
              })}
            </div>
          )}
        </section>

        {/* ────────── COLONNE DROITE : Récapitulatif (repliable) ────────── */}
        <aside className="no-print space-y-3">
          <button
            type="button"
            onClick={() => toggleCol('right')}
            className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-2 py-1.5 text-[11px] font-bold text-ink-500 hover:text-amber-deep"
          >
            {colPrefs.right ? <><ChevronRight size={13} /> Replier le récap</> : <ChevronLeft size={13} />}
          </button>
          {colPrefs.right && (
            <>
              <Card>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">KPIs (live)</p>
                <div className="space-y-1.5 text-[11px]">
                  {([
                    ['Effectif', k.effectif], ['Coût employeur', k.coutEmployeur],
                    ['Conformité', k.conformite], ['Accès formation', k.accesFormation],
                    ['Heures formation', k.heuresFormation], ['FDFP', k.fdfp],
                    ['Incidents AT', k.incidentsAT], ['OKR on-track', k.onTrackOKR],
                  ] as const).map(([label, val]) => (
                    <div key={label} className="flex items-baseline justify-between border-b border-dotted border-line/60 py-0.5">
                      <span className="text-ink-500">{label}</span>
                      <span className="mono font-bold text-ink">{val ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">Sources ({TABLE_CATALOG.length})</p>
                <div className="max-h-56 overflow-y-auto pr-1 no-scrollbar text-[11px]">
                  {TABLE_CATALOG.map((s) => (
                    <div key={s.v} className="border-b border-line/60 py-1">
                      <p className="font-semibold text-ink">{s.label}</p>
                      <p className="text-[9px] text-ink-500">{s.cat}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">Statut</p>
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-500">Blocs</span>
                    <StatusPill tone="amber" dot={false}>{config.blocks.length}</StatusPill>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-500">Format</span>
                    <span className="mono font-bold text-ink">{config.format}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-500">Palette</span>
                    <span className="font-bold text-ink">{palette.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-500">Tenant</span>
                    <span className="mono text-[9px] text-ink-700">{TENANT_ID.slice(0, 8)}…</span>
                  </div>
                </div>
              </Card>
            </>
          )}
        </aside>
      </div>

      {/* MODALES */}
      <SaveModal open={modal === 'save'} onClose={() => setModal(null)}
        config={config} tenantId={TENANT_ID} author={config.identity.author} existingDocId={docId}
        onSaved={(id) => setDocId(id)} />
      <LoadModal open={modal === 'load'} onClose={() => setModal(null)} tenantId={TENANT_ID}
        onLoad={(doc: ReportDoc, c) => { persist(c); setDocId(doc.id); }} />
      <SendModal open={modal === 'send'} onClose={() => setModal(null)} config={config}
        onChange={(recipients) => persist({ ...config, recipients })} />
      <CatalogModal open={modal === 'catalog'} onClose={() => { setModal(null); setInsertAt(null); }}
        onInsert={(b) => {
          if (insertAt != null) insertAtIdx(insertAt, b);
          else setBlocks([...config.blocks, b]);
          setInsertAt(null);
        }} />
      <JournalModal open={modal === 'journal'} onClose={() => setModal(null)} />
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
