/**
 * ProphtetPanel — analyseur narratif PROPH3T (rule-based déterministe).
 *
 * Cahier des charges Atlas People : PROPH3T est l'IA souveraine Ollama de
 * l'organisation. Pour les données CONFIDENTIELLES (paie/légal), aucun
 * appel LLM ne peut sortir du périmètre — donc ce composant produit une
 * synthèse 100% déterministe en français, alignée sur les règles métier,
 * sans dépendance réseau.
 *
 * 3 contextes supportés :
 *   • whatif-scenario : interprète un Δ coût employeur (mensuel + annuel + %)
 *   • cockpit-alerts  : trie et raconte les alertes consolidées du Cockpit 360°
 *   • okr-cascade     : diagnose la santé d'un cycle OKR (atteinte + risques)
 */
import { useMemo } from 'react';
import { Sparkles, AlertCircle, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader } from './ui/Card';
import { StatusPill } from './ui/StatusPill';
import { Brand } from './ui/Brand';
import { cn } from '../lib/cn';

// ───────── Types contextes
export type ProphtetContext =
  | { kind: 'whatif-scenario'; data: WhatIfScenarioCtx }
  | { kind: 'cockpit-alerts'; data: CockpitAlertsCtx }
  | { kind: 'okr-cascade'; data: OkrCascadeCtx };

export interface WhatIfScenarioCtx {
  /** Δ coût employeur mensuel (FCFA, signé) */
  deltaMonthly: number;
  /** Δ % vs baseline */
  deltaPct: number;
  /** Δ effectif (signé) */
  deltaHeadcount: number;
  /** Δ charges sociales */
  deltaCharges: number;
  /** Nombre d'embauches simulées */
  hiresCount: number;
  /** Nombre de suppressions */
  removalsCount: number;
  /** Δ % augmentation générale */
  increasePct: number;
}

export interface CockpitAlert {
  label: string;
  domain: 'declarations' | 'duer' | 'bench' | 'cert' | 'okr' | 'at' | 'departure';
  severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface CockpitAlertsCtx {
  alerts: CockpitAlert[];
  conformityScore: number;
  rpsBurnoutPct: number;
}

export interface OkrCascadeCtx {
  cycleLabel: string;
  totalObjectives: number;
  completed: number;
  atRisk: number;
  avgProgress: number;          // 0-100
  avgConfidence?: number;       // 1-10
}

// ───────── Helpers
const fmtFcfa = (n: number): string => {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)} Mds FCFA`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)} M FCFA`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)} k FCFA`;
  return `${sign}${Math.round(abs)} FCFA`;
};

interface NarrativeBlock {
  tone: 'success' | 'info' | 'warn' | 'danger';
  title: string;
  body: string[];
  recommendations: string[];
}

// ───────── Générateurs narratifs déterministes
function analyzeWhatIf(d: WhatIfScenarioCtx): NarrativeBlock[] {
  const blocks: NarrativeBlock[] = [];
  const annual = d.deltaMonthly * 12;

  // Block 1 — lecture financière
  if (Math.abs(d.deltaPct) < 0.5) {
    blocks.push({
      tone: 'info',
      title: 'Impact financier négligeable',
      body: [
        `Le scénario ne modifie la masse salariale que de ${d.deltaPct.toFixed(2)} %, soit ${fmtFcfa(annual)} sur 12 mois.`,
        'Cette variation reste sous le seuil de matérialité opérationnelle (1 %).',
      ],
      recommendations: ['Décision déléguable au niveau DAF sans alerter le Comex.'],
    });
  } else if (d.deltaPct > 10) {
    blocks.push({
      tone: 'danger',
      title: 'Surcoût majeur identifié',
      body: [
        `La simulation augmente le coût employeur de ${d.deltaPct.toFixed(2)} % (${fmtFcfa(d.deltaMonthly)}/mois, ${fmtFcfa(annual)}/an).`,
        'Ce niveau dépasse le seuil critique Atlas (10 %) au-delà duquel l\'arbitrage Comex est requis.',
        d.deltaCharges > 0 ? `Les charges sociales seules s'alourdissent de ${fmtFcfa(d.deltaCharges)}/mois.` : '',
      ].filter(Boolean),
      recommendations: [
        'Présentation Comex avant exécution.',
        'Vérifier la couverture par l\'enveloppe budgétaire annuelle approuvée.',
        'Modéliser l\'impact trésorerie M+1 → M+3 avant arbitrage final.',
      ],
    });
  } else if (d.deltaPct > 5) {
    blocks.push({
      tone: 'warn',
      title: 'Investissement significatif',
      body: [
        `Hausse de la masse salariale de ${d.deltaPct.toFixed(2)} % (${fmtFcfa(annual)}/an).`,
        'Investissement notable mais maîtrisable — validation DAF + DRH conjointe recommandée.',
      ],
      recommendations: ['Construire un dossier ROI à 12 mois avant déclenchement.'],
    });
  } else if (d.deltaPct > 0) {
    blocks.push({
      tone: 'info',
      title: 'Coût marginal positif',
      body: [
        `Hausse contrôlée de ${d.deltaPct.toFixed(2)} % (${fmtFcfa(annual)}/an).`,
        'Décision opérationnelle dans le cadre du budget RH 2026.',
      ],
      recommendations: ['Tracer la décision dans le journal d\'audit RH.'],
    });
  } else if (d.deltaPct < -10) {
    blocks.push({
      tone: 'danger',
      title: 'Coupe budgétaire majeure',
      body: [
        `Économie de ${d.deltaPct.toFixed(2)} % (${fmtFcfa(Math.abs(annual))}/an).`,
        'Ce niveau d\'économie a un impact RH systémique — risques élevés sur climat, engagement et image employeur.',
      ],
      recommendations: [
        'Plan d\'accompagnement RH obligatoire (cellule d\'écoute, communication interne).',
        'Analyser le coût caché : turnover post-coupe, perte de productivité, recruitments futurs.',
        'Soumettre au CSE / représentation du personnel si plus de 5 collaborateurs concernés.',
      ],
    });
  } else if (d.deltaPct < 0) {
    blocks.push({
      tone: 'success',
      title: 'Optimisation budgétaire',
      body: [
        `Économie de ${Math.abs(d.deltaPct).toFixed(2)} % (${fmtFcfa(Math.abs(annual))}/an).`,
        'Marge dégagée sans impact significatif sur l\'effectif (≤ 10 %).',
      ],
      recommendations: ['Réallouer la marge vers Formation (M11) ou Recrutement (M5) pour rester pro-croissance.'],
    });
  }

  // Block 2 — lecture RH
  if (d.removalsCount > 0 && d.hiresCount > 0) {
    blocks.push({
      tone: 'info',
      title: 'Restructuration nette',
      body: [
        `${d.removalsCount} départ(s) couplé(s) à ${d.hiresCount} embauche(s) — variation effectif ${d.deltaHeadcount >= 0 ? '+' : ''}${d.deltaHeadcount}.`,
        'Restructuration équilibrée : opportunité de réajuster la pyramide de compétences.',
      ],
      recommendations: [
        'Activer M10 Carrières → vérifier que les départs ne créent pas de trou dans les postes clés.',
        'Aligner les embauches sur les compétences manquantes identifiées (M9 cartographie).',
      ],
    });
  } else if (d.removalsCount > 2) {
    blocks.push({
      tone: 'warn',
      title: 'Plan de départs significatif',
      body: [
        `${d.removalsCount} suppressions de poste — équivalent ${Math.round((d.removalsCount / 14) * 100)} % de l\'effectif Atlas.`,
        'Au-delà de 2 départs concomitants, la procédure OHADA exige une consultation des représentants du personnel.',
      ],
      recommendations: [
        'Activer M4 ADM > Départs > module disciplinaire / économique selon le motif.',
        'Préparer les avenants et certificats de travail (chaîne ADVIST).',
        'Planifier les déclarations CNPS/IPRES de sortie.',
      ],
    });
  } else if (d.hiresCount > 3) {
    blocks.push({
      tone: 'info',
      title: 'Plan d\'embauche soutenu',
      body: [
        `${d.hiresCount} embauches simulées.`,
        'Coût caché à anticiper : ~1 mois de salaire en onboarding + équipement la première année par embauche.',
      ],
      recommendations: [
        'Activer M5 Recrutement → ouvrir les postes en cascade.',
        'Activer M6 Onboarding → vérifier la capacité buddies + budget welcome book.',
        'Allouer l\'onboarding au plan formation M11 (formation produit + valeurs).',
      ],
    });
  }

  // Block 3 — lecture stratégique
  if (d.increasePct >= 5) {
    blocks.push({
      tone: 'warn',
      title: 'Augmentation générale ≥ 5 %',
      body: [
        `Une augmentation générale de ${d.increasePct.toFixed(1)} % est appliquée.`,
        'Au-delà de 5 %, vérifier l\'alignement avec l\'inflation locale (Côte d\'Ivoire ≈ 3-4 % · Sénégal ≈ 3-5 % en 2026) et la position concurrentielle salariale.',
      ],
      recommendations: [
        'Cross-check avec les benchmarks Atlas-Studio Compensation Studies.',
        'S\'assurer que les déclarations CNPS et IRPP reflètent la nouvelle masse.',
        'Préparer une communication interne expliquant la décision.',
      ],
    });
  } else if (d.increasePct <= -5) {
    blocks.push({
      tone: 'danger',
      title: 'Baisse salariale collective',
      body: [
        `Baisse appliquée de ${Math.abs(d.increasePct).toFixed(1)} %.`,
        'Toute baisse salariale unilatérale est interdite en OHADA sans avenant signé par chaque collaborateur (R12 inscrite dans M4).',
      ],
      recommendations: [
        'Activer M4 ADM > Avenants pour chaque collaborateur concerné.',
        'Soumettre la procédure à l\'inspection du travail.',
        'Évaluer le risque contentieux prudhomal cas par cas.',
      ],
    });
  }

  return blocks;
}

function analyzeCockpitAlerts(d: CockpitAlertsCtx): NarrativeBlock[] {
  const blocks: NarrativeBlock[] = [];
  const critical = d.alerts.filter((a) => a.severity === 'critical');
  const high = d.alerts.filter((a) => a.severity === 'high');

  // Block 1 — synthèse globale
  if (d.alerts.length === 0) {
    blocks.push({
      tone: 'success',
      title: 'Aucune alerte consolidée',
      body: ['Tous les indicateurs Atlas People sont au vert sur le périmètre suivi.'],
      recommendations: ['Maintenir la cadence des contrôles trimestriels et des audits annuels.'],
    });
    return blocks;
  }

  // Block 2 — alertes critiques
  if (critical.length > 0) {
    blocks.push({
      tone: 'danger',
      title: `${critical.length} alerte(s) critique(s) à traiter sous 24 h`,
      body: [
        critical.map((a) => `• ${a.label}`).join('\n'),
        'Ces signaux nécessitent une remédiation immédiate — risques juridiques ou financiers avérés.',
      ],
      recommendations: critical.map((a) => {
        if (a.domain === 'declarations') return 'Régulariser les déclarations CNPS/IPRES en retard — pénalités cumulées chaque mois.';
        if (a.domain === 'duer') return 'Mettre à jour le Document Unique sous 7 jours — exigence inspection du travail.';
        if (a.domain === 'at') return 'Finaliser l\'investigation accident du travail · déclarer à la CNPS sous 48 h ouvrées.';
        return `Traiter prioritairement : ${a.label}.`;
      }),
    });
  }

  // Block 3 — alertes priorité haute
  if (high.length > 0) {
    blocks.push({
      tone: 'warn',
      title: `${high.length} action(s) prioritaire(s) cette semaine`,
      body: [high.slice(0, 5).map((a) => `• ${a.label}`).join('\n')],
      recommendations: [
        'Bloquer 2 h dans l\'agenda DRH pour traiter ces points.',
        'Déléguer aux RRH BU les sujets locaux (visites médicales, habilitations).',
      ],
    });
  }

  // Block 4 — conformité globale
  if (d.conformityScore < 70) {
    blocks.push({
      tone: 'danger',
      title: `Score conformité ${d.conformityScore}/100 — alerte rouge`,
      body: ['Le score composite est sous le seuil Atlas critique (70). Risque d\'audit défavorable et d\'amendes administratives.'],
      recommendations: ['Plan de remédiation 30 jours avec DPO + DAF + DRH.'],
    });
  } else if (d.conformityScore < 85) {
    blocks.push({
      tone: 'warn',
      title: `Score conformité ${d.conformityScore}/100 — sous la cible`,
      body: [`La cible Atlas est 85+. Marge d'amélioration : ${85 - d.conformityScore} points.`],
      recommendations: ['Audit interne complémentaire sur les domaines en retard (DUER, déclarations sociales).'],
    });
  }

  // Block 5 — RPS burnout
  if (d.rpsBurnoutPct >= 20) {
    blocks.push({
      tone: 'danger',
      title: `Risque burnout ${d.rpsBurnoutPct}% — cellule d\'écoute requise`,
      body: ['Le seuil d\'alerte Atlas (20 %) est franchi. Déclencher la cellule d\'écoute externe et conduire des entretiens individuels.'],
      recommendations: [
        'Activer M12 Conformité > RPS > Cellule d\'écoute.',
        'Conduire des 1-1 individuels avec les collab à risque dans les 7 jours.',
        'Réviser les charges de travail et les délais des sprints en cours.',
      ],
    });
  }

  return blocks;
}

function analyzeOkrCascade(d: OkrCascadeCtx): NarrativeBlock[] {
  const blocks: NarrativeBlock[] = [];
  const completionRate = d.totalObjectives > 0 ? (d.completed / d.totalObjectives) * 100 : 0;
  const atRiskPct = d.totalObjectives > 0 ? (d.atRisk / d.totalObjectives) * 100 : 0;

  // Block 1 — santé globale
  if (d.avgProgress >= 70) {
    blocks.push({
      tone: 'success',
      title: `Cycle ${d.cycleLabel} — performance solide`,
      body: [
        `Progression moyenne ${d.avgProgress}% — dans la zone OKR saine (70-89 %).`,
        `${d.completed} objectifs déjà terminés sur ${d.totalObjectives}.`,
      ],
      recommendations: ['Conserver la cadence des check-ins hebdomadaires.', 'Préparer la rétrospective de fin de cycle (M7 Rétro).'],
    });
  } else if (d.avgProgress >= 50) {
    blocks.push({
      tone: 'info',
      title: `Cycle ${d.cycleLabel} — progression intermédiaire`,
      body: [
        `Progression moyenne ${d.avgProgress}% — zone stretch normale.`,
        'Le paradoxe OKR de Doerr : 70 % = succès. Continuer sans accélération artificielle.',
      ],
      recommendations: ['Identifier les KR bloqués lors du prochain Comité OKR.'],
    });
  } else if (d.avgProgress >= 30) {
    blocks.push({
      tone: 'warn',
      title: `Cycle ${d.cycleLabel} — décrochage`,
      body: [`Progression ${d.avgProgress}% — sous la zone saine. ${d.atRisk} OKR à risque sur ${d.totalObjectives}.`],
      recommendations: [
        'Réunir le Comité OKR en urgence pour identifier les blocages systémiques.',
        'Vérifier les confidence levels par KR (M7 Notation).',
        'Envisager un re-scoping mid-cycle si pertinent.',
      ],
    });
  } else {
    blocks.push({
      tone: 'danger',
      title: `Cycle ${d.cycleLabel} — échec global`,
      body: [`Progression ${d.avgProgress}% — zone d'apprentissage critique. ${d.atRisk}/${d.totalObjectives} OKR à risque.`],
      recommendations: [
        'Analyse rétrospective approfondie indispensable.',
        'Questions à poser : sandbagging inverse ? ambition mal calibrée ? facteurs externes ?',
        'Renforcer la méthodologie CRAFT/FAST au prochain kickoff.',
      ],
    });
  }

  // Block 2 — confidence
  if (d.avgConfidence != null) {
    if (d.avgConfidence <= 3) {
      blocks.push({
        tone: 'danger',
        title: `Confidence moyenne ${d.avgConfidence}/10 — équipes pessimistes`,
        body: ['Les équipes anticipent une non-atteinte. Signal fort de désengagement ou de cibles irréalistes.'],
        recommendations: ['Sessions de re-cadrage 1-on-1 manager-collab.', 'Vérifier la charge réelle vs estimée.'],
      });
    } else if (d.avgConfidence >= 8 && d.avgProgress < 70) {
      blocks.push({
        tone: 'warn',
        title: 'Confidence élevée mais progression faible — décalage suspect',
        body: ['Risque de complaisance ou d\'auto-évaluation biaisée. Patterns anti-fraude PROPH3T à vérifier.'],
        recommendations: ['Audit M7 SHA-256 : examiner la fréquence des check-ins.'],
      });
    }
  }

  // Block 3 — taux d'achèvement
  if (completionRate > 80) {
    blocks.push({
      tone: 'warn',
      title: `${Math.round(completionRate)}% d\'OKR terminés — ambition possiblement insuffisante`,
      body: ['John Doerr : "If you hit 100%, you weren\'t ambitious enough." Un taux d\'achèvement > 80 % suggère du sandbagging.'],
      recommendations: ['Au prochain cycle : augmenter les cibles de 30 %.'],
    });
  }

  if (atRiskPct > 30) {
    blocks.push({
      tone: 'danger',
      title: `${Math.round(atRiskPct)} % d\'OKR à risque — alerte systémique`,
      body: ['Plus d\'un tiers du portefeuille est en danger. Problème de méthodologie ou de capacity planning.'],
      recommendations: ['Refonte du plan OKR avec le Sponsor exécutif.'],
    });
  }

  return blocks;
}

// ───────── Composant
export function ProphtetPanel({
  context,
  className,
  compact = false,
}: {
  context: ProphtetContext;
  className?: string;
  compact?: boolean;
}) {
  const blocks = useMemo<NarrativeBlock[]>(() => {
    switch (context.kind) {
      case 'whatif-scenario': return analyzeWhatIf(context.data);
      case 'cockpit-alerts':  return analyzeCockpitAlerts(context.data);
      case 'okr-cascade':     return analyzeOkrCascade(context.data);
    }
  }, [context]);

  const toneClasses: Record<NarrativeBlock['tone'], string> = {
    success: 'border-emerald-300/40 bg-emerald-50/40',
    info:    'border-sky-300/40 bg-sky-50/40',
    warn:    'border-amber-300/40 bg-amber-50/40',
    danger:  'border-rose-300/40 bg-rose-50/40',
  };
  const toneIconColor: Record<NarrativeBlock['tone'], string> = {
    success: 'text-emerald-600',
    info:    'text-sky-600',
    warn:    'text-amber-700',
    danger:  'text-rose-600',
  };

  return (
    <Card className={cn('border-amber-deep/30 bg-gradient-to-br from-amber-50/30 to-surface', className)}>
      <CardHeader
        title={<span className="flex items-center gap-2"><Brand name="Proph3t" /> — Analyse contextuelle</span>}
        subtitle="Synthèse rule-based déterministe · aucune donnée n'a quitté votre périmètre OHADA"
        action={<Sparkles size={16} className="text-amber-deep" />}
      />

      {blocks.length === 0 ? (
        <p className="rounded-xl bg-surface2/40 px-3 py-2 text-[12px] font-medium italic text-ink-500">
          PROPH3T n'identifie aucun signal saillant dans ce contexte — situation neutre.
        </p>
      ) : (
        <div className={cn('space-y-3', compact && 'space-y-2')}>
          {blocks.map((b, i) => (
            <div key={i} className={cn('rounded-xl border-2 p-3', toneClasses[b.tone])}>
              <div className="flex items-start gap-2">
                {b.tone === 'success' ? <TrendingUp size={16} className={cn('mt-0.5 shrink-0', toneIconColor[b.tone])} /> :
                 b.tone === 'danger'  ? <AlertCircle size={16} className={cn('mt-0.5 shrink-0', toneIconColor[b.tone])} /> :
                 b.tone === 'warn'    ? <AlertCircle size={16} className={cn('mt-0.5 shrink-0', toneIconColor[b.tone])} /> :
                                        <TrendingDown size={16} className={cn('mt-0.5 shrink-0', toneIconColor[b.tone])} />}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-ink">{b.title}</p>
                  <div className="mt-1 space-y-0.5">
                    {b.body.map((line, j) => (
                      <p key={j} className="whitespace-pre-line text-[11px] font-medium text-ink-700">{line}</p>
                    ))}
                  </div>
                  {b.recommendations.length > 0 && !compact && (
                    <div className="mt-2 rounded-lg border border-line bg-surface/80 p-2">
                      <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-deep">
                        <Lightbulb size={10} /> Recommandations Atlas
                      </p>
                      <ul className="space-y-0.5">
                        {b.recommendations.map((r, k) => (
                          <li key={k} className="text-[11px] font-medium text-ink-700">→ {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-2 text-[10px] font-medium italic text-ink-500">
        <Sparkles size={10} className="text-amber-deep" />
        PROPH3T applique les règles métier Atlas (OHADA · SST · OKR Doerr · politiques internes) — version 1.0 souveraine.
        <StatusPill tone="success" dot={false}>local-only</StatusPill>
      </p>
    </Card>
  );
}
