/**
 * PROPH3T — Auto-commentaire des sections de rapport.
 *
 * Contrat normatif REPORTING_STANDARD §9 :
 *   - Parcourt les blocs, insère un paragraphe de commentaire sous chaque H1/H2/H3
 *   - Les commentaires générés sont MARQUÉS (block.auto = true) pour pouvoir
 *     être retirés sans toucher au texte rédigé manuellement
 *   - NE DOIT PAS écraser un paragraphe rédigé manuellement
 *
 * Logique 100% déterministe (pas de LLM externe). Les commentaires sont
 * générés via règles métier RH à partir de ReportData.
 */
import type { Block, ReportData } from '../reportBlocks';

/** Génère un commentaire selon le titre de la section. */
function commentForHeading(text: string, data: ReportData): string | null {
  const t = text.toLowerCase();

  // Section Effectifs
  if (/effectif/i.test(t)) {
    if (!data.effectifsByDept?.length) return null; // [] passait le garde → crash sur top.dept
    const total = data.effectifsByDept.reduce((s, e) => s + e.count, 0);
    const top = [...data.effectifsByDept].sort((a, b) => b.count - a.count)[0];
    const avgActive = data.effectifsByDept.reduce((s, e) => s + e.activeRatio, 0) / data.effectifsByDept.length;
    return `L'entreprise compte ${total} collaborateurs répartis sur ${data.effectifsByDept.length} départements. Le département ${top.dept} concentre le plus d'effectifs (${top.count}). Le taux d'activité moyen YTD s'établit à ${Math.round(avgActive * 100)} %.`;
  }

  // Section Paie
  if (/paie|salaire|rémunération/i.test(t)) {
    if (!data.payrollCycles?.length) return null;
    const last = data.payrollCycles[0];
    const ratio = last.net && last.gross ? (last.net / last.gross) : 0;
    return `Sur la dernière période (${last.period}), la masse salariale brute s'élève à ${formatM(last.gross)} FCFA pour un net distribué de ${formatM(last.net)} FCFA (${Math.round(ratio * 100)} % du brut). Le coût employeur total atteint ${formatM(last.employerCost)} FCFA.`;
  }

  // Section Conformité / SST
  if (/conformité|sst|duer|risque/i.test(t)) {
    if (!data.conformiteScores) return null;
    const c = data.conformiteScores;
    const status = c.global >= 90 ? 'excellent' : c.global >= 75 ? 'satisfaisant' : 'à renforcer';
    return `Score de conformité globale : ${c.global}/100 (statut ${status}). Détail : DUER ${c.duer}/100, RPS ${c.rps}/100, AT/MP ${c.atmp}/100, Déclarations sociales ${c.declarations}/100. ${c.declarations < 100 ? 'Attention : déclarations sociales incomplètes — risque de pénalités.' : ''}`;
  }

  // Section Formation
  if (/formation|fdfp|3fpt/i.test(t)) {
    if (!data.formationKPIs) return null;
    const k = data.formationKPIs;
    return `${k.beneficiariesYTD} collaborateurs ont bénéficié d'une formation depuis le début de l'année, soit un taux d'accès de ${Math.round(k.accessRate * 100)} %. Volume moyen : ${k.hoursPerEmployee} heures par collaborateur. ${formatM(k.fdfpRecuperable)} FCFA récupérables au titre du FDFP/3FPT cette période.`;
  }

  // Section Recrutement
  if (/recrut|candid/i.test(t)) {
    if (!data.recruitmentPipeline?.length) return null;
    const top = data.recruitmentPipeline[0];
    const hires = data.recruitmentPipeline[data.recruitmentPipeline.length - 1].count;
    return `Pipeline actif : ${top.count} candidats sourcés, ${hires} embauches finalisées. Le funnel se resserre progressivement à chaque étape ; les écarts de conversion les plus marqués méritent une revue qualitative.`;
  }

  // Section Carrières / Succession
  if (/carrière|succession|promotion/i.test(t)) {
    if (!data.successionByRole?.length) return null;
    const readyNow = data.successionByRole.reduce((s, r) => s + r.readyNow, 0);
    const total = data.successionByRole.length;
    const covered = data.successionByRole.filter((r) => r.readyNow > 0 || r.ready18m > 0).length;
    return `${total} postes clés sous suivi succession. ${covered} disposent d'un successeur ready_now ou ready_18m (couverture ${Math.round((covered / total) * 100)} %), dont ${readyNow} successeurs immédiatement opérationnels.`;
  }

  // Section Évaluations
  if (/évaluation|performance|9-box|talent/i.test(t)) {
    if (!data.evaluationsByClass?.length) return null;
    const classA = data.evaluationsByClass.find((c) => c.classe.startsWith('A'));
    const classC = data.evaluationsByClass.find((c) => c.classe.startsWith('C'));
    return `Répartition des évaluations : ${classA?.share ?? 0} % en classe A (excellence), ${classC?.share ?? 0} % en classe C (à développer). ${classC && classC.share > 20 ? 'Vigilance : forte proportion C — revoir les plans de développement.' : 'Distribution équilibrée.'}`;
  }

  // Section Parité / Anti-discrimination
  if (/parité|discrim|égalité|diversité/i.test(t)) {
    if (!data.parityByAxis?.length) return null;
    const breaches = data.parityByAxis.filter((p) => p.ratio < p.threshold);
    if (breaches.length === 0) return 'Aucun écart de parité détecté sur les axes audités. Tous les ratios observés respectent le seuil de 0.80.';
    return `${breaches.length} axe(s) de non-discrimination en alerte : ${breaches.map((b) => b.axis).join(', ')}. Un audit approfondi des pratiques d'évaluation et de promotion est recommandé.`;
  }

  // Section Synthèse / Exécutive
  if (/synthèse|exécutive|résumé/i.test(t)) {
    const eff = (data.effectifsByDept ?? []).reduce((s, e) => s + e.count, 0);
    return `Cette synthèse présente les principaux indicateurs RH consolidés du tenant. Effectif total : ${eff} collaborateurs. Les sections suivantes détaillent l'évolution mensuelle par domaine — paie, formation, conformité, carrières.`;
  }

  return null;
}

const formatM = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

/**
 * Parcourt les blocs et insère un paragraphe `auto: true` sous chaque H1/H2/H3
 * qui n'a pas déjà un paragraphe juste en-dessous.
 */
export function autoCommentReport(
  blocks: Block[],
  data: ReportData,
  _opts: { tenantId?: string; context?: string } = {},
): { blocks: Block[]; count: number } {
  const out: Block[] = [];
  let count = 0;

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    out.push(b);

    if (b.type === 'h1' || b.type === 'h2' || b.type === 'h3') {
      // Vérifie qu'on n'écrase pas un paragraphe manuel existant
      const next = blocks[i + 1];
      const alreadyHasManualPara = next?.type === 'paragraph' && !next.auto;
      if (alreadyHasManualPara) continue;

      // Si un paragraphe auto existe déjà juste après, on l'écrase (regénération)
      const alreadyHasAutoPara = next?.type === 'paragraph' && next.auto;

      const comment = commentForHeading(b.text, data);
      if (!comment) continue;

      // Id déterministe (position) — pas de Math.random : un rapport recalculé
      // doit être structurellement identique (hash/diff/content persisté stables).
      const para: Block = { id: `auto-${i}`, type: 'paragraph', text: comment, auto: true };
      if (alreadyHasAutoPara) {
        out.push(para);
        i += 1; // skip le vieil auto
      } else {
        out.push(para);
      }
      count += 1;
    }
  }

  return { blocks: out, count };
}

/**
 * Retire UNIQUEMENT les paragraphes générés par l'IA (auto: true).
 * Préserve les paragraphes rédigés manuellement.
 */
export function clearAutoComments(blocks: Block[]): { blocks: Block[]; count: number } {
  let count = 0;
  const out = blocks.filter((b) => {
    if (b.type === 'paragraph' && b.auto) { count += 1; return false; }
    return true;
  });
  return { blocks: out, count };
}
