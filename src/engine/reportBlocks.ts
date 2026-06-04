/**
 * Atlas People — Reporting Engine (REPORTING_STANDARD.md v1.0 conforme).
 *
 * Cœur normatif :
 *   - Types Block / ReportConfig / ReportData / ReportDoc
 *   - PALETTES (10 palettes : cockpit, atlas, graphite, ardoise, marine, foret,
 *     sable, bordeaux, acier, aubergine)
 *   - DEFAULT_CONFIG
 *   - buildPDFFromBlocks (jspdf + autotable + couverture + TOC + headers/footers)
 *   - buildPPTXFromBlocks (pptxgenjs 16:9)
 *
 * ReportData est adaptée au domaine RH Atlas People (effectifs / paie / formation /
 * carrières / conformité), mais le squelette est agnostique : il suffit de remplacer
 * `ReportData` + les `case` de résolution table/dashboard pour un autre domaine.
 *
 * Les builders sont PURS : entrée = (config, data, orgName), sortie = document.
 * Aucun accès réseau / base / hook.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import PptxGenJS from 'pptxgenjs';

/* ══════════════════════════════════════════════════════════════════
 * 1) TYPES BLOCS (normatifs, verbatim du standard §5.1)
 * ══════════════════════════════════════════════════════════════════ */

export type BlockType =
  | 'h1' | 'h2' | 'h3' | 'paragraph' | 'kpi'
  | 'table' | 'dashboard' | 'pageBreak' | 'image' | 'spacer';

export interface BlockBase {
  id: string;
  type: BlockType;
  inToc?: boolean;
}

export interface BlockH extends BlockBase { type: 'h1' | 'h2' | 'h3'; text: string }
export interface BlockParagraph extends BlockBase { type: 'paragraph'; text: string; auto?: boolean }
export interface BlockKpi extends BlockBase { type: 'kpi'; items: Array<{ label: string; value: string; subValue?: string }> }
export interface BlockTable extends BlockBase { type: 'table'; title?: string; source: string; limit?: number }
export interface BlockDashboard extends BlockBase { type: 'dashboard'; dashboardId: string; title?: string }
export interface BlockPageBreak extends BlockBase { type: 'pageBreak' }
export interface BlockImage extends BlockBase { type: 'image'; dataUrl: string; caption?: string }
export interface BlockSpacer extends BlockBase { type: 'spacer'; height?: number }

export type Block =
  | BlockH | BlockParagraph | BlockKpi | BlockTable
  | BlockDashboard | BlockPageBreak | BlockImage | BlockSpacer;

/* ══════════════════════════════════════════════════════════════════
 * 2) CONFIG (normatif §5.2)
 * ══════════════════════════════════════════════════════════════════ */

export type PaletteKey =
  | 'cockpit' | 'atlas' | 'graphite' | 'ardoise' | 'marine'
  | 'foret'   | 'sable' | 'bordeaux' | 'acier'   | 'aubergine';

export interface ReportConfig {
  identity: {
    title: string;
    subtitle: string;
    period: string;
    periodFrom?: string;
    periodTo?: string;
    author: string;
    confidentiality: 'public' | 'interne' | 'confidentiel' | 'strict';
    logoDataUrl?: string;
    coverBgColor?: string;
    coverBgImageUrl?: string;
    coverBgOpacity?: number;
    titleColor?: string;
    subtitleColor?: string;
    coverStyle?: 'classic' | 'modern' | 'banner';
  };
  format: 'A4_portrait' | 'A4_landscape' | 'pptx';
  palette: PaletteKey;
  options: {
    includeCover: boolean;
    includeTOC: boolean;
    includeFooter: boolean;
    includePageNumbers: boolean;
  };
  blocks: Block[];
  recipients: string[];
}

export const DEFAULT_CONFIG = (period: string): ReportConfig => ({
  identity: {
    title: 'Rapport mensuel RH',
    subtitle: 'Synthèse Atlas People',
    period,
    author: 'Direction RH',
    confidentiality: 'interne',
    coverStyle: 'modern',
  },
  format: 'A4_portrait',
  palette: 'atlas',
  options: {
    includeCover: true,
    includeTOC: true,
    includeFooter: true,
    includePageNumbers: true,
  },
  blocks: [],
  recipients: [],
});

/* ══════════════════════════════════════════════════════════════════
 * 3) PALETTES (§5.3) — 10 palettes incluant la marque Atlas People
 * ══════════════════════════════════════════════════════════════════ */

export interface Palette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  danger: string;
  neutral: string;
  tableHeader: string;
  tableHeaderText: string;
  chartColors: string[];
}

export const PALETTES: Record<PaletteKey, Palette> = {
  cockpit: {
    name: 'Cockpit (par défaut)',
    primary: '#171717', secondary: '#404040', accent: '#7FA88E',
    success: '#7FA88E', danger: '#C97A5A', neutral: '#737373',
    tableHeader: '#171717', tableHeaderText: '#FAFAFA',
    chartColors: ['#7FA88E','#C97A5A','#5E8772','#D4A574','#737373','#B5C4A8','#A3A3A3'],
  },
  atlas: {
    name: 'Atlas People (amber-deep marque)',
    primary: '#1A1A1A', secondary: '#525252', accent: '#C97E12',
    success: '#16A34A', danger: '#DC2626', neutral: '#6B7280',
    tableHeader: '#C97E12', tableHeaderText: '#FFFFFF',
    chartColors: ['#C97E12','#16A34A','#3B82F6','#7C3AED','#DC2626','#0EA5E9','#F59E0B'],
  },
  graphite: {
    name: 'Graphite',
    primary: '#1F2937', secondary: '#4B5563', accent: '#6B7280',
    success: '#10B981', danger: '#EF4444', neutral: '#9CA3AF',
    tableHeader: '#1F2937', tableHeaderText: '#F9FAFB',
    chartColors: ['#374151','#6B7280','#9CA3AF','#10B981','#3B82F6','#F59E0B','#EF4444'],
  },
  ardoise: {
    name: 'Ardoise (slate)',
    primary: '#0F172A', secondary: '#334155', accent: '#0EA5E9',
    success: '#10B981', danger: '#F43F5E', neutral: '#64748B',
    tableHeader: '#0F172A', tableHeaderText: '#F1F5F9',
    chartColors: ['#0EA5E9','#0F172A','#334155','#10B981','#F43F5E','#8B5CF6','#F59E0B'],
  },
  marine: {
    name: 'Marine',
    primary: '#0C4A6E', secondary: '#075985', accent: '#0EA5E9',
    success: '#10B981', danger: '#DC2626', neutral: '#64748B',
    tableHeader: '#0C4A6E', tableHeaderText: '#E0F2FE',
    chartColors: ['#0C4A6E','#0EA5E9','#7DD3FC','#10B981','#DC2626','#F59E0B','#A78BFA'],
  },
  foret: {
    name: 'Forêt',
    primary: '#14532D', secondary: '#15803D', accent: '#16A34A',
    success: '#22C55E', danger: '#DC2626', neutral: '#6B7280',
    tableHeader: '#14532D', tableHeaderText: '#DCFCE7',
    chartColors: ['#14532D','#16A34A','#65A30D','#84CC16','#DC2626','#0EA5E9','#F59E0B'],
  },
  sable: {
    name: 'Sable',
    primary: '#78350F', secondary: '#92400E', accent: '#D97706',
    success: '#16A34A', danger: '#B91C1C', neutral: '#92400E',
    tableHeader: '#78350F', tableHeaderText: '#FEF3C7',
    chartColors: ['#78350F','#D97706','#F59E0B','#FCD34D','#16A34A','#0EA5E9','#7C3AED'],
  },
  bordeaux: {
    name: 'Bordeaux',
    primary: '#7F1D1D', secondary: '#991B1B', accent: '#DC2626',
    success: '#16A34A', danger: '#B91C1C', neutral: '#737373',
    tableHeader: '#7F1D1D', tableHeaderText: '#FEE2E2',
    chartColors: ['#7F1D1D','#DC2626','#F87171','#FCA5A5','#16A34A','#3B82F6','#7C3AED'],
  },
  acier: {
    name: 'Acier',
    primary: '#1E40AF', secondary: '#1D4ED8', accent: '#3B82F6',
    success: '#10B981', danger: '#DC2626', neutral: '#6B7280',
    tableHeader: '#1E40AF', tableHeaderText: '#DBEAFE',
    chartColors: ['#1E40AF','#3B82F6','#60A5FA','#93C5FD','#10B981','#DC2626','#F59E0B'],
  },
  aubergine: {
    name: 'Aubergine',
    primary: '#581C87', secondary: '#6B21A8', accent: '#9333EA',
    success: '#16A34A', danger: '#DC2626', neutral: '#6B7280',
    tableHeader: '#581C87', tableHeaderText: '#F3E8FF',
    chartColors: ['#581C87','#9333EA','#C084FC','#E9D5FF','#16A34A','#0EA5E9','#F59E0B'],
  },
};

/* ══════════════════════════════════════════════════════════════════
 * 4) REPORT DATA — domaine RH Atlas People (adaptation §5.4)
 *    Frontière entre le squelette agnostique et le métier RH.
 * ══════════════════════════════════════════════════════════════════ */

export interface ReportRow { label: string; value: number | string; sub?: string }

export interface ReportData {
  // Effectifs (M1)
  effectifsByDept?: Array<{ dept: string; count: number; activeRatio: number }>;
  effectifsByCountry?: Array<{ country: string; count: number; share: number }>;
  effectifsByContract?: Array<{ type: string; count: number; share: number }>;

  // Paie (M3)
  payrollCycles?: Array<{ period: string; gross: number; net: number; employerCost: number; status: string }>;
  payrollByCountry?: Array<{ country: string; gross: number; net: number; charges: number }>;

  // Temps & absences (M2)
  absenceByType?: Array<{ type: string; days: number; cost: number }>;
  attendanceMatrix?: Array<{ dept: string; presentRate: number; absRate: number }>;

  // Recrutement (M5)
  recruitmentPipeline?: Array<{ stage: string; count: number; convRate: number }>;
  timeToFill?: Array<{ role: string; days: number; target: number }>;

  // Onboarding (M6)
  onboardingPulse?: Array<{ jalon: string; complete: number; avg_score: number }>;

  // OKR (M7)
  okrCascade?: Array<{ level: string; total: number; onTrack: number; atRisk: number; completed: number }>;

  // Évaluations (M8)
  evaluationsByClass?: Array<{ classe: string; count: number; share: number }>;
  performanceBoxes?: Array<{ box: string; count: number }>;

  // Compétences (M9)
  skillsGap?: Array<{ skill: string; holders: number; required: number; gap: number }>;
  certificationsExpiring?: Array<{ employee: string; cert: string; expiry: string }>;

  // Carrières (M10)
  successionByRole?: Array<{ role: string; readyNow: number; ready18m: number; ready3y: number }>;
  promotionsByPeriod?: Array<{ period: string; count: number; budget: number }>;

  // Formation (M11)
  formationKPIs?: { beneficiariesYTD: number; accessRate: number; hoursPerEmployee: number; budgetConsumed: number; fdfpRecuperable: number };
  parcoursCompletion?: Array<{ parcours: string; enrolled: number; completed: number; rate: number }>;

  // Conformité & SST (M12)
  conformiteScores?: { global: number; duer: number; rps: number; atmp: number; declarations: number };
  duerRisks?: Array<{ unit: string; level: string; count: number }>;
  workIncidents?: Array<{ period: string; count: number; severity: string }>;

  // Anti-discrim (M9 patterns + audit)
  parityByAxis?: Array<{ axis: string; ratio: number; threshold: number; status: string }>;

  // Coût employeur global
  totalCost?: { employerCost: number; net: number; charges: number; perEmployee: number };
}

/* ══════════════════════════════════════════════════════════════════
 * 5) DOCUMENT PERSISTÉ (§5.5)
 * ══════════════════════════════════════════════════════════════════ */

export interface ReportDoc {
  id?: number;
  tenantId: string;
  title: string;
  type: string;
  author: string;
  status: 'draft' | 'review' | 'approved' | 'diffused';
  createdAt: number;
  updatedAt: number;
  content?: string;
}

export interface ReportTemplate {
  id?: number;
  tenantId: string;
  name: string;
  author: string;
  config: string;
  createdAt: number;
  updatedAt: number;
}

/* ══════════════════════════════════════════════════════════════════
 * 6) BUILDER PDF (§6)
 * ══════════════════════════════════════════════════════════════════ */

const MM_A4_PORTRAIT = { w: 210, h: 297 } as const;
const MM_A4_LANDSCAPE = { w: 297, h: 210 } as const;
const MARGIN = 14;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

interface ResolvedTable { head: string[]; body: (string | number)[][]; title?: string }

function resolveTable(block: BlockTable, data: ReportData): ResolvedTable {
  const empty: ResolvedTable = { head: ['—'], body: [['Aucune donnée disponible pour cette source']], title: block.title };
  switch (block.source) {
    case 'effectifs_dept':
      if (!data.effectifsByDept) return empty;
      return {
        title: block.title ?? 'Effectifs par département',
        head: ['Département', 'Effectif', '% actifs YTD'],
        body: data.effectifsByDept.map((r) => [r.dept, r.count, `${Math.round(r.activeRatio * 100)} %`]),
      };
    case 'effectifs_country':
      if (!data.effectifsByCountry) return empty;
      return {
        title: block.title ?? 'Répartition par pays',
        head: ['Pays', 'Effectif', 'Part'],
        body: data.effectifsByCountry.map((r) => [r.country, r.count, `${r.share.toFixed(1)} %`]),
      };
    case 'payroll_cycles':
      if (!data.payrollCycles) return empty;
      return {
        title: block.title ?? 'Cycles de paie',
        head: ['Période', 'Brut (FCFA)', 'Net (FCFA)', 'Coût employeur', 'Statut'],
        body: data.payrollCycles.map((r) => [r.period, fmtN(r.gross), fmtN(r.net), fmtN(r.employerCost), r.status]),
      };
    case 'absence_type':
      if (!data.absenceByType) return empty;
      return {
        title: block.title ?? 'Absences par type',
        head: ['Type', 'Jours', 'Coût (FCFA)'],
        body: data.absenceByType.map((r) => [r.type, r.days, fmtN(r.cost)]),
      };
    case 'recruitment_pipeline':
      if (!data.recruitmentPipeline) return empty;
      return {
        title: block.title ?? 'Pipeline recrutement',
        head: ['Étape', 'Candidats', 'Conv. %'],
        body: data.recruitmentPipeline.map((r) => [r.stage, r.count, `${(r.convRate * 100).toFixed(1)} %`]),
      };
    case 'okr_cascade':
      if (!data.okrCascade) return empty;
      return {
        title: block.title ?? 'Cascade OKR',
        head: ['Niveau', 'Total', 'On track', 'À risque', 'Terminés'],
        body: data.okrCascade.map((r) => [r.level, r.total, r.onTrack, r.atRisk, r.completed]),
      };
    case 'evaluations_class':
      if (!data.evaluationsByClass) return empty;
      return {
        title: block.title ?? 'Évaluations — classes',
        head: ['Classe', 'Effectif', 'Part'],
        body: data.evaluationsByClass.map((r) => [r.classe, r.count, `${r.share.toFixed(1)} %`]),
      };
    case 'skills_gap':
      if (!data.skillsGap) return empty;
      return {
        title: block.title ?? 'Gap compétences (top 10)',
        head: ['Compétence', 'Détenteurs', 'Requis', 'Gap'],
        body: data.skillsGap.slice(0, block.limit ?? 10).map((r) => [r.skill, r.holders, r.required, r.gap]),
      };
    case 'succession':
      if (!data.successionByRole) return empty;
      return {
        title: block.title ?? 'Succession par poste clé',
        head: ['Poste', 'Ready Now', 'Ready 18m', 'Ready 3y'],
        body: data.successionByRole.map((r) => [r.role, r.readyNow, r.ready18m, r.ready3y]),
      };
    case 'formation_parcours':
      if (!data.parcoursCompletion) return empty;
      return {
        title: block.title ?? 'Parcours de formation',
        head: ['Parcours', 'Inscrits', 'Terminés', 'Taux %'],
        body: data.parcoursCompletion.map((r) => [r.parcours, r.enrolled, r.completed, `${r.rate.toFixed(1)} %`]),
      };
    case 'duer_risks':
      if (!data.duerRisks) return empty;
      return {
        title: block.title ?? 'Risques DUER',
        head: ['Unité', 'Niveau', 'Nb risques'],
        body: data.duerRisks.map((r) => [r.unit, r.level, r.count]),
      };
    case 'work_incidents':
      if (!data.workIncidents) return empty;
      return {
        title: block.title ?? 'Accidents du travail / Maladies pro',
        head: ['Période', 'Nombre', 'Sévérité'],
        body: data.workIncidents.map((r) => [r.period, r.count, r.severity]),
      };
    case 'parity':
      if (!data.parityByAxis) return empty;
      return {
        title: block.title ?? 'Parité (axes de non-discrimination)',
        head: ['Axe', 'Ratio observé', 'Seuil', 'Statut'],
        body: data.parityByAxis.map((r) => [r.axis, r.ratio.toFixed(2), r.threshold.toFixed(2), r.status]),
      };
    case 'promotions':
      if (!data.promotionsByPeriod) return empty;
      return {
        title: block.title ?? 'Promotions',
        head: ['Période', 'Promotions', 'Budget (FCFA)'],
        body: data.promotionsByPeriod.map((r) => [r.period, r.count, fmtN(r.budget)]),
      };
    case 'certifications_expiring':
      if (!data.certificationsExpiring) return empty;
      return {
        title: block.title ?? 'Certifications à renouveler (< 90 j)',
        head: ['Collaborateur', 'Certification', 'Échéance'],
        body: data.certificationsExpiring.map((r) => [r.employee, r.cert, r.expiry]),
      };
    case 'onboarding_pulse':
      if (!data.onboardingPulse) return empty;
      return {
        title: block.title ?? 'Pulse onboarding 30/60/90',
        head: ['Jalon', 'Complétion %', 'Score moyen'],
        body: data.onboardingPulse.map((r) => [r.jalon, `${r.complete} %`, r.avg_score.toFixed(1)]),
      };
    default:
      return empty;
  }
}

const fmtN = (n: number): string => new Intl.NumberFormat('fr-FR').format(Math.round(n));

export function buildPDFFromBlocks(
  config: ReportConfig,
  data: ReportData,
  orgName: string,
  orgSub?: string,
): jsPDF {
  const isLand = config.format === 'A4_landscape';
  const PAGE = isLand ? MM_A4_LANDSCAPE : MM_A4_PORTRAIT;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: isLand ? 'landscape' : 'portrait' });
  const palette = PALETTES[config.palette] ?? PALETTES.cockpit;
  const tocEntries: Array<{ level: 1 | 2 | 3; text: string; page: number }> = [];

  /* ------- Header / Footer ------- */
  const drawHeaderFooter = (pageNumber: number, totalPages: number) => {
    if (!config.options.includeFooter && !config.options.includePageNumbers) return;
    doc.setDrawColor(220);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, PAGE.h - 12, PAGE.w - MARGIN, PAGE.h - 12);
    doc.setFontSize(7);
    doc.setTextColor(120);
    if (config.options.includeFooter) {
      doc.text(`${orgName} · ${config.identity.title} · ${config.identity.period}`, MARGIN, PAGE.h - 7);
      const conf = (config.identity.confidentiality ?? 'interne').toUpperCase();
      doc.text(conf, PAGE.w / 2, PAGE.h - 7, { align: 'center' });
    }
    if (config.options.includePageNumbers) {
      doc.text(`Page ${pageNumber} / ${totalPages}`, PAGE.w - MARGIN, PAGE.h - 7, { align: 'right' });
    }
  };

  /* ------- Couverture ------- */
  if (config.options.includeCover) {
    const [pr, pg, pb] = hexToRgb(config.identity.coverBgColor ?? palette.primary);
    doc.setFillColor(pr, pg, pb);
    doc.rect(0, 0, PAGE.w, PAGE.h, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(orgName, MARGIN, MARGIN + 6);
    if (orgSub) {
      doc.setFontSize(8);
      doc.text(orgSub, MARGIN, MARGIN + 12);
    }

    const titleY = PAGE.h / 2 - 10;
    doc.setFontSize(28);
    const [tr, tg, tb] = hexToRgb(config.identity.titleColor ?? '#FFFFFF');
    doc.setTextColor(tr, tg, tb);
    doc.text(config.identity.title, MARGIN, titleY);
    doc.setFontSize(14);
    const [sr, sg, sb] = hexToRgb(config.identity.subtitleColor ?? '#E5E7EB');
    doc.setTextColor(sr, sg, sb);
    doc.text(config.identity.subtitle, MARGIN, titleY + 12);

    doc.setFontSize(10);
    doc.setTextColor(220);
    doc.text(`Période : ${config.identity.period}`, MARGIN, PAGE.h - 30);
    doc.text(`Auteur : ${config.identity.author}`, MARGIN, PAGE.h - 24);
    doc.text(`Confidentialité : ${config.identity.confidentiality}`, MARGIN, PAGE.h - 18);

    doc.addPage();
  }

  /* ------- Table des matières (placeholder) ------- */
  const tocPage = config.options.includeTOC ? doc.getNumberOfPages() : -1;
  if (config.options.includeTOC) {
    doc.setTextColor(0);
    doc.setFontSize(16);
    doc.text('Sommaire', MARGIN, MARGIN + 8);
    doc.addPage();
  }

  /* ------- Contenu (blocks) ------- */
  let cursorY = MARGIN;
  const ensureSpace = (h: number) => {
    if (cursorY + h > PAGE.h - 18) {
      drawHeaderFooter(doc.getNumberOfPages(), 0);
      doc.addPage();
      cursorY = MARGIN;
    }
  };

  for (const block of config.blocks) {
    switch (block.type) {
      case 'pageBreak':
        drawHeaderFooter(doc.getNumberOfPages(), 0);
        doc.addPage();
        cursorY = MARGIN;
        break;

      case 'h1':
      case 'h2':
      case 'h3': {
        const sizes = { h1: 18, h2: 14, h3: 12 };
        const lvls = { h1: 1, h2: 2, h3: 3 } as const;
        const lvl = lvls[block.type];
        ensureSpace(sizes[block.type] + 4);
        const [r, g, b] = hexToRgb(palette.primary);
        doc.setTextColor(r, g, b);
        doc.setFontSize(sizes[block.type]);
        doc.text(block.text, MARGIN, cursorY);
        cursorY += sizes[block.type] / 2 + 2;
        if (block.inToc !== false) {
          tocEntries.push({ level: lvl, text: block.text, page: doc.getNumberOfPages() });
        }
        break;
      }

      case 'paragraph': {
        ensureSpace(12);
        doc.setFontSize(10);
        doc.setTextColor(60);
        const lines = doc.splitTextToSize(block.text, PAGE.w - 2 * MARGIN);
        for (const line of lines) {
          ensureSpace(5);
          doc.text(line, MARGIN, cursorY);
          cursorY += 4.5;
        }
        cursorY += 2;
        break;
      }

      case 'kpi': {
        const cols = Math.min(4, block.items.length);
        const cellW = (PAGE.w - 2 * MARGIN) / cols;
        const rows = Math.ceil(block.items.length / cols);
        ensureSpace(rows * 18 + 4);
        block.items.forEach((it, i) => {
          const col = i % cols, row = Math.floor(i / cols);
          const x = MARGIN + col * cellW;
          const y = cursorY + row * 18;
          doc.setDrawColor(230);
          doc.setLineWidth(0.2);
          doc.rect(x, y, cellW - 2, 16);
          doc.setFontSize(7);
          doc.setTextColor(120);
          doc.text(it.label.toUpperCase(), x + 2, y + 5);
          doc.setFontSize(13);
          const [r, g, b] = hexToRgb(palette.accent);
          doc.setTextColor(r, g, b);
          doc.text(it.value, x + 2, y + 11);
          if (it.subValue) {
            doc.setFontSize(7);
            doc.setTextColor(140);
            doc.text(it.subValue, x + 2, y + 14.5);
          }
        });
        cursorY += rows * 18 + 4;
        break;
      }

      case 'table': {
        const t = resolveTable(block, data);
        ensureSpace(14);
        if (t.title) {
          const [r, g, b] = hexToRgb(palette.secondary);
          doc.setFontSize(11);
          doc.setTextColor(r, g, b);
          doc.text(t.title, MARGIN, cursorY);
          cursorY += 5;
        }
        autoTable(doc, {
          startY: cursorY,
          head: [t.head],
          body: t.body,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 1.5 },
          headStyles: {
            fillColor: hexToRgb(palette.tableHeader),
            textColor: hexToRgb(palette.tableHeaderText),
            fontStyle: 'bold',
            fontSize: 8,
          },
          alternateRowStyles: { fillColor: [248, 248, 248] },
          margin: { left: MARGIN, right: MARGIN },
          didDrawPage: () => { /* handled globally */ },
        });
        // @ts-expect-error : autotable patch lastAutoTable
        cursorY = (doc.lastAutoTable?.finalY ?? cursorY) + 5;
        break;
      }

      case 'dashboard':
        ensureSpace(60);
        doc.setDrawColor(200);
        doc.setLineWidth(0.3);
        doc.rect(MARGIN, cursorY, PAGE.w - 2 * MARGIN, 55);
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(`[Dashboard : ${block.title ?? block.dashboardId}]`, PAGE.w / 2, cursorY + 28, { align: 'center' });
        cursorY += 60;
        break;

      case 'image':
        if (block.dataUrl) {
          try {
            const w = PAGE.w - 2 * MARGIN;
            const h = w * 0.5;
            ensureSpace(h + 8);
            doc.addImage(block.dataUrl, 'PNG', MARGIN, cursorY, w, h);
            cursorY += h + 2;
            if (block.caption) {
              doc.setFontSize(8);
              doc.setTextColor(120);
              doc.text(block.caption, MARGIN, cursorY);
              cursorY += 5;
            }
          } catch {
            // image invalide → skip
          }
        }
        break;

      case 'spacer':
        cursorY += block.height ?? 6;
        break;
    }
  }

  /* ------- Remplir la TOC ------- */
  if (config.options.includeTOC && tocEntries.length > 0) {
    doc.setPage(tocPage + 1);
    doc.setFontSize(9);
    doc.setTextColor(60);
    let tocY = MARGIN + 18;
    for (const e of tocEntries) {
      const indent = (e.level - 1) * 6;
      doc.text(e.text, MARGIN + indent, tocY);
      doc.text(String(e.page), PAGE.w - MARGIN, tocY, { align: 'right' });
      tocY += 5;
      if (tocY > PAGE.h - 16) break;
    }
  }

  /* ------- Header/footer sur toutes les pages ------- */
  const total = doc.getNumberOfPages();
  for (let p = (config.options.includeCover ? 2 : 1); p <= total; p++) {
    doc.setPage(p);
    drawHeaderFooter(p, total);
  }

  return doc;
}

/* ══════════════════════════════════════════════════════════════════
 * 7) BUILDER PPTX (§6)
 * ══════════════════════════════════════════════════════════════════ */

export async function buildPPTXFromBlocks(
  config: ReportConfig,
  data: ReportData,
  orgName: string,
): Promise<Blob> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.333 × 7.5 inches (16:9)
  const palette = PALETTES[config.palette] ?? PALETTES.cockpit;

  /* ------- Couverture ------- */
  if (config.options.includeCover) {
    const slide = pptx.addSlide();
    slide.background = { color: (config.identity.coverBgColor ?? palette.primary).replace('#', '') };
    slide.addText(orgName, { x: 0.5, y: 0.3, w: 12, h: 0.4, fontSize: 12, color: 'FFFFFF' });
    slide.addText(config.identity.title, {
      x: 0.5, y: 2.5, w: 12, h: 1.5, fontSize: 36, color: (config.identity.titleColor ?? '#FFFFFF').replace('#', ''), bold: true,
    });
    slide.addText(config.identity.subtitle, {
      x: 0.5, y: 4.0, w: 12, h: 0.8, fontSize: 18, color: 'D1D5DB',
    });
    slide.addText(`Période : ${config.identity.period} · Auteur : ${config.identity.author}`, {
      x: 0.5, y: 6.8, w: 12, h: 0.4, fontSize: 10, color: 'D1D5DB',
    });
  }

  /* ------- Blocs ------- */
  let currentSlide = pptx.addSlide();
  let yCursor = 0.5;

  const newSlide = () => { currentSlide = pptx.addSlide(); yCursor = 0.5; };
  const ensureY = (h: number) => { if (yCursor + h > 7.0) newSlide(); };

  for (const block of config.blocks) {
    switch (block.type) {
      case 'pageBreak':
        newSlide();
        break;
      case 'h1':
      case 'h2':
      case 'h3': {
        const sizes = { h1: 28, h2: 22, h3: 18 };
        ensureY(0.7);
        currentSlide.addText(block.text, {
          x: 0.5, y: yCursor, w: 12, h: 0.6,
          fontSize: sizes[block.type], bold: true,
          color: palette.primary.replace('#', ''),
        });
        yCursor += 0.7;
        break;
      }
      case 'paragraph':
        ensureY(0.6);
        currentSlide.addText(block.text, {
          x: 0.5, y: yCursor, w: 12, h: 0.6,
          fontSize: 12, color: '525252',
        });
        yCursor += 0.7;
        break;
      case 'kpi': {
        ensureY(1.2);
        const cols = Math.min(4, block.items.length);
        const cellW = 12 / cols;
        block.items.forEach((it, i) => {
          const col = i % cols;
          const x = 0.5 + col * cellW;
          currentSlide.addText(
            [
              { text: it.label.toUpperCase() + '\n', options: { fontSize: 8, color: '737373' } },
              { text: it.value + '\n', options: { fontSize: 20, bold: true, color: palette.accent.replace('#', '') } },
              { text: it.subValue ?? '', options: { fontSize: 8, color: '9CA3AF' } },
            ],
            { x, y: yCursor, w: cellW - 0.2, h: 1.2 },
          );
        });
        yCursor += 1.3;
        break;
      }
      case 'table': {
        const t = resolveTable(block, data);
        ensureY(2.0);
        if (t.title) {
          currentSlide.addText(t.title, {
            x: 0.5, y: yCursor, w: 12, h: 0.4,
            fontSize: 14, bold: true, color: palette.secondary.replace('#', ''),
          });
          yCursor += 0.5;
        }
        const tableRows = [
          t.head.map((h) => ({ text: h, options: { bold: true, color: palette.tableHeaderText.replace('#', ''), fill: { color: palette.tableHeader.replace('#', '') } } })),
          ...t.body.map((row) => row.map((c) => ({ text: String(c) }))),
        ];
        currentSlide.addTable(tableRows as PptxGenJS.TableRow[], {
          x: 0.5, y: yCursor, w: 12,
          fontSize: 9, border: { type: 'solid', pt: 0.5, color: 'D4D4D4' },
        });
        yCursor += 0.5 + t.body.length * 0.3;
        break;
      }
      case 'dashboard':
        ensureY(3.5);
        currentSlide.addShape(pptx.ShapeType.rect, {
          x: 0.5, y: yCursor, w: 12, h: 3,
          line: { color: 'D4D4D4', width: 1 }, fill: { color: 'F5F5F5' },
        });
        currentSlide.addText(`[Dashboard : ${block.title ?? block.dashboardId}]`, {
          x: 0.5, y: yCursor + 1.3, w: 12, h: 0.4,
          fontSize: 12, align: 'center', color: '737373',
        });
        yCursor += 3.3;
        break;
      case 'image':
        if (block.dataUrl) {
          ensureY(3.5);
          try {
            currentSlide.addImage({ data: block.dataUrl, x: 0.5, y: yCursor, w: 12, h: 3 });
            yCursor += 3.2;
          } catch {
            // skip
          }
        }
        break;
      case 'spacer':
        yCursor += (block.height ?? 6) / 28.3; // 1mm ≈ 0.0394 in, mais on est en raw cm
        break;
    }
  }

  const out = await pptx.write({ outputType: 'blob' });
  return out as Blob;
}
