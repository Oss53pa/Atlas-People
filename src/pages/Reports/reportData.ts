/**
 * Atlas People — Catalogue Reporting (REPORTING_STANDARD §7).
 *
 * Déclare les sources de tables, les dashboards, les modèles rapides et les helpers
 * pour le domaine RH multi-pays OHADA.
 */
import type { Block, ReportData } from '../../engine/reportBlocks';

/* ──────────────────── 7.1 TABLE_CATALOG (16 sources RH) ──────────────────── */

export interface TableSource { v: string; label: string; cat: string; desc: string }

export const TABLE_CATALOG: TableSource[] = [
  // M1 Effectifs
  { v: 'effectifs_dept',    label: 'Effectifs par département', cat: 'Effectifs',   desc: 'Headcount + ratio actifs YTD par département' },
  { v: 'effectifs_country', label: 'Répartition par pays',      cat: 'Effectifs',   desc: 'Effectifs et part par pays OHADA' },
  // M3 Paie
  { v: 'payroll_cycles',    label: 'Cycles de paie',            cat: 'Paie',        desc: 'Brut · net · coût employeur par période · statut' },
  // M2 Temps
  { v: 'absence_type',      label: 'Absences par type',         cat: 'Temps',       desc: 'Jours et coût par type de congé / absence' },
  // M5 Recrut.
  { v: 'recruitment_pipeline', label: 'Pipeline recrutement',   cat: 'Recrutement', desc: 'Candidats par étape + taux de conversion' },
  // M6 Onboard.
  { v: 'onboarding_pulse',  label: 'Pulse onboarding 30/60/90', cat: 'Onboarding',  desc: 'Complétion et score moyen par jalon' },
  // M7 OKR
  { v: 'okr_cascade',       label: 'Cascade OKR',               cat: 'Performance', desc: 'On track · à risque · terminés par niveau' },
  // M8 Évals
  { v: 'evaluations_class', label: 'Classes évaluations',       cat: 'Évaluations', desc: 'Répartition des collaborateurs par classe (A/B/C)' },
  // M9 Compétences
  { v: 'skills_gap',        label: 'Gap compétences (top 10)',  cat: 'Compétences', desc: 'Détenteurs · requis · écart' },
  { v: 'certifications_expiring', label: 'Certifs à renouveler', cat: 'Compétences', desc: 'Échéance < 90 j par collaborateur' },
  // M10 Carrières
  { v: 'succession',        label: 'Succession postes clés',    cat: 'Carrières',   desc: 'Ready Now · 18m · 3y par poste' },
  { v: 'promotions',        label: 'Promotions',                cat: 'Carrières',   desc: 'Nombre + budget par période' },
  // M11 Formation
  { v: 'formation_parcours', label: 'Parcours de formation',    cat: 'Formation',   desc: 'Inscrits · terminés · taux' },
  // M12 Conformité
  { v: 'duer_risks',        label: 'Risques DUER',              cat: 'Conformité',  desc: 'Risques par unité × niveau' },
  { v: 'work_incidents',    label: 'AT / Maladies pro',         cat: 'Conformité',  desc: 'Incidents par période × sévérité' },
  // Audit anti-discrim
  { v: 'parity',            label: 'Parité (anti-discrim)',     cat: 'Audit',       desc: 'Ratio vs seuil par axe (genre · âge · ancienneté)' },
];

/* ──────────────────── 7.2 DASHBOARD_CATALOG ──────────────────── */

export interface DashboardSource { id: string; name: string; cat: string; desc: string }

export const DASHBOARD_CATALOG: DashboardSource[] = [
  { id: 'cockpit-drh',    name: 'Cockpit DRH 360°',     cat: 'Pilotage',     desc: 'Vue synthèse 8 onglets cross-modules' },
  { id: 'm9-honeycomb',   name: 'Compétences Honeycomb', cat: 'Compétences', desc: 'Swimlanes par famille' },
  { id: 'm10-succession', name: 'Carto succession',     cat: 'Carrières',    desc: 'Bench strength + ready_now visuel' },
  { id: 'm11-formation',  name: 'Formation overview',   cat: 'Formation',    desc: 'Parcours + PIF + LMS' },
  { id: 'm12-conformite', name: 'Conformité posture',   cat: 'Conformité',   desc: 'DUER · AT · RPS · déclarations' },
];

/* ──────────────────── 7.4 Helpers normatifs ──────────────────── */

export function uid() { return Math.random().toString(36).substring(2, 11); }

/**
 * Retire les sections (entre 2 pageBreak) dont aucun bloc table/dashboard n'a de
 * données. Évite les sections vides dans les rapports auto-générés.
 */
export function filterConditionalBlocks(blocks: Block[], data: ReportData): Block[] {
  const sections: Block[][] = [[]];
  for (const b of blocks) {
    if (b.type === 'pageBreak') { sections.push([b]); sections.push([]); }
    else sections[sections.length - 1].push(b);
  }
  const out: Block[] = [];
  for (const section of sections) {
    const tables = section.filter((b) => b.type === 'table') as Array<Block & { source: string }>;
    if (tables.length === 0) { out.push(...section); continue; }
    const hasData = tables.some((t) => {
      switch (t.source) {
        case 'effectifs_dept': return !!data.effectifsByDept?.length;
        case 'effectifs_country': return !!data.effectifsByCountry?.length;
        case 'payroll_cycles': return !!data.payrollCycles?.length;
        case 'absence_type': return !!data.absenceByType?.length;
        case 'recruitment_pipeline': return !!data.recruitmentPipeline?.length;
        case 'onboarding_pulse': return !!data.onboardingPulse?.length;
        case 'okr_cascade': return !!data.okrCascade?.length;
        case 'evaluations_class': return !!data.evaluationsByClass?.length;
        case 'skills_gap': return !!data.skillsGap?.length;
        case 'certifications_expiring': return !!data.certificationsExpiring?.length;
        case 'succession': return !!data.successionByRole?.length;
        case 'promotions': return !!data.promotionsByPeriod?.length;
        case 'formation_parcours': return !!data.parcoursCompletion?.length;
        case 'duer_risks': return !!data.duerRisks?.length;
        case 'work_incidents': return !!data.workIncidents?.length;
        case 'parity': return !!data.parityByAxis?.length;
        default: return true; // unknown source → keep (graceful)
      }
    });
    if (hasData) out.push(...section);
  }
  return out;
}

/** Pré-calcule les KPIs formatés en chaînes prêtes pour les blocs `kpi`. */
export function computeKPIs(data: ReportData): Record<string, string> {
  const fmtN = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
  const totalEffectif = (data.effectifsByDept ?? []).reduce((s, e) => s + e.count, 0);
  const totalCost = data.totalCost?.employerCost ?? 0;
  const fdfpRecuperable = data.formationKPIs?.fdfpRecuperable ?? 0;
  const conformiteGlobal = data.conformiteScores?.global ?? 0;
  return {
    effectif:       String(totalEffectif),
    coutEmployeur:  `${fmtN(totalCost)} FCFA`,
    coutParEmployee: data.totalCost?.perEmployee ? `${fmtN(data.totalCost.perEmployee)} FCFA` : '—',
    accesFormation: data.formationKPIs?.accessRate ? `${Math.round(data.formationKPIs.accessRate * 100)} %` : '—',
    heuresFormation: data.formationKPIs?.hoursPerEmployee ? `${data.formationKPIs.hoursPerEmployee} h` : '—',
    fdfp:           `${fmtN(fdfpRecuperable)} FCFA`,
    conformite:     `${conformiteGlobal} / 100`,
    incidentsAT:    data.workIncidents ? String(data.workIncidents.reduce((s, i) => s + i.count, 0)) : '—',
    onTrackOKR:     data.okrCascade ? String(data.okrCascade.reduce((s, l) => s + l.onTrack, 0)) : '—',
  };
}

/* ──────────────────── 7.3 QUICK_TEMPLATES (5 modèles RH) ──────────────────── */

export const QUICK_TEMPLATES: Record<string, (data?: ReportData) => Block[]> = {
  monthly_drh: (data?: ReportData) => {
    const k = data ? computeKPIs(data) : {} as Record<string, string>;
    return [
      { id: uid(), type: 'h1', text: '1. Synthèse exécutive', inToc: true },
      { id: uid(), type: 'kpi', items: [
        { label: 'Effectif total', value: k.effectif ?? '—' },
        { label: 'Coût employeur', value: k.coutEmployeur ?? '—', subValue: 'mensuel' },
        { label: 'Conformité', value: k.conformite ?? '—' },
        { label: 'Accès formation', value: k.accesFormation ?? '—' },
      ]},
      { id: uid(), type: 'paragraph', text: 'Cette synthèse présente l\'activité RH consolidée du mois écoulé : effectifs, paie, performance, conformité.' },
      { id: uid(), type: 'pageBreak' },
      { id: uid(), type: 'h1', text: '2. Effectifs', inToc: true },
      { id: uid(), type: 'table', source: 'effectifs_dept' },
      { id: uid(), type: 'table', source: 'effectifs_country' },
      { id: uid(), type: 'pageBreak' },
      { id: uid(), type: 'h1', text: '3. Paie', inToc: true },
      { id: uid(), type: 'table', source: 'payroll_cycles' },
      { id: uid(), type: 'pageBreak' },
      { id: uid(), type: 'h1', text: '4. Formation', inToc: true },
      { id: uid(), type: 'table', source: 'formation_parcours' },
      { id: uid(), type: 'pageBreak' },
      { id: uid(), type: 'h1', text: '5. Conformité & SST', inToc: true },
      { id: uid(), type: 'table', source: 'duer_risks' },
      { id: uid(), type: 'table', source: 'work_incidents' },
    ];
  },

  bilan_social: (data?: ReportData) => {
    const k = data ? computeKPIs(data) : {} as Record<string, string>;
    return [
      { id: uid(), type: 'h1', text: 'Bilan social annuel', inToc: true },
      { id: uid(), type: 'paragraph', text: 'Bilan social conforme aux exigences OHADA / Code du travail national.' },
      { id: uid(), type: 'kpi', items: [
        { label: 'Effectif', value: k.effectif ?? '—' },
        { label: 'Coût total', value: k.coutEmployeur ?? '—' },
        { label: 'Incidents AT', value: k.incidentsAT ?? '—' },
        { label: 'Heures formation', value: k.heuresFormation ?? '—' },
      ]},
      { id: uid(), type: 'pageBreak' },
      { id: uid(), type: 'h2', text: 'Effectifs et structure' },
      { id: uid(), type: 'table', source: 'effectifs_dept' },
      { id: uid(), type: 'h2', text: 'Politique salariale' },
      { id: uid(), type: 'table', source: 'payroll_cycles' },
      { id: uid(), type: 'pageBreak' },
      { id: uid(), type: 'h2', text: 'Conditions de travail' },
      { id: uid(), type: 'table', source: 'absence_type' },
      { id: uid(), type: 'table', source: 'work_incidents' },
      { id: uid(), type: 'pageBreak' },
      { id: uid(), type: 'h2', text: 'Carrières et promotions' },
      { id: uid(), type: 'table', source: 'promotions' },
      { id: uid(), type: 'table', source: 'succession' },
    ];
  },

  audit_ohada: (data?: ReportData) => [
    { id: uid(), type: 'h1', text: 'Audit RH OHADA', inToc: true },
    { id: uid(), type: 'paragraph', text: 'Audit conformité OHADA · SYSCOHADA révisé · audit chain SHA-256.' },
    { id: uid(), type: 'h2', text: 'Conformité globale' },
    { id: uid(), type: 'kpi', items: [
      { label: 'Score conformité', value: data?.conformiteScores?.global ? `${data.conformiteScores.global}/100` : '—' },
      { label: 'DUER', value: data?.conformiteScores?.duer ? `${data.conformiteScores.duer}/100` : '—' },
      { label: 'RPS', value: data?.conformiteScores?.rps ? `${data.conformiteScores.rps}/100` : '—' },
      { label: 'Déclarations', value: data?.conformiteScores?.declarations ? `${data.conformiteScores.declarations}/100` : '—' },
    ]},
    { id: uid(), type: 'pageBreak' },
    { id: uid(), type: 'h2', text: 'Parité et anti-discrimination' },
    { id: uid(), type: 'table', source: 'parity' },
    { id: uid(), type: 'pageBreak' },
    { id: uid(), type: 'h2', text: 'Risques DUER et incidents' },
    { id: uid(), type: 'table', source: 'duer_risks' },
    { id: uid(), type: 'table', source: 'work_incidents' },
  ],

  formation_fdfp: (data?: ReportData) => [
    { id: uid(), type: 'h1', text: 'Rapport Formation FDFP', inToc: true },
    { id: uid(), type: 'paragraph', text: 'Rapport annuel Formation conforme FDFP (Côte d\'Ivoire) / 3FPT (Sénégal) / FNFP (Cameroun).' },
    { id: uid(), type: 'kpi', items: [
      { label: 'Bénéficiaires YTD', value: data?.formationKPIs?.beneficiariesYTD ? String(data.formationKPIs.beneficiariesYTD) : '—' },
      { label: 'Taux d\'accès', value: data?.formationKPIs?.accessRate ? `${Math.round(data.formationKPIs.accessRate * 100)} %` : '—' },
      { label: 'Heures / collab', value: data?.formationKPIs?.hoursPerEmployee ? `${data.formationKPIs.hoursPerEmployee} h` : '—' },
      { label: 'FDFP récupérable', value: data?.formationKPIs?.fdfpRecuperable ? `${data.formationKPIs.fdfpRecuperable.toLocaleString('fr-FR')} FCFA` : '—' },
    ]},
    { id: uid(), type: 'pageBreak' },
    { id: uid(), type: 'h2', text: 'Parcours de formation' },
    { id: uid(), type: 'table', source: 'formation_parcours' },
    { id: uid(), type: 'h2', text: 'Certifications' },
    { id: uid(), type: 'table', source: 'certifications_expiring' },
  ],

  parite_genre: (data?: ReportData) => [
    { id: uid(), type: 'h1', text: 'Rapport Parité & Diversité', inToc: true },
    { id: uid(), type: 'paragraph', text: 'Audit annuel sur les axes de non-discrimination : genre, âge, ancienneté, origine.' },
    { id: uid(), type: 'h2', text: 'Indicateurs de parité' },
    { id: uid(), type: 'table', source: 'parity' },
    { id: uid(), type: 'h2', text: 'Promotions et évolution' },
    { id: uid(), type: 'table', source: 'promotions' },
    { id: uid(), type: 'table', source: 'succession' },
  ],
};

export const QUICK_TEMPLATE_META: Record<keyof typeof QUICK_TEMPLATES, { label: string; desc: string }> = {
  monthly_drh:    { label: 'Rapport mensuel DRH',  desc: 'Synthèse exécutive · effectifs · paie · formation · conformité' },
  bilan_social:   { label: 'Bilan social annuel',  desc: 'Document légal OHADA · effectifs · salaires · conditions · carrières' },
  audit_ohada:    { label: 'Audit RH OHADA',       desc: 'Conformité globale · parité · DUER · audit SHA-256' },
  formation_fdfp: { label: 'Rapport Formation FDFP', desc: 'KPIs · parcours · certifs · FDFP / 3FPT / FNFP' },
  parite_genre:   { label: 'Parité & Diversité',   desc: 'Anti-discrimination · genre · âge · ancienneté · promotions' },
};
