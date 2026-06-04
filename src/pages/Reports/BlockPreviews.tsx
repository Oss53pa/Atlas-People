/**
 * BlockPreviews — rendu écran FIDÈLE au PDF de chaque type de bloc.
 * Utilisé par renderPages dans le visualiseur A4.
 */
import type { Block, ReportData, Palette } from '../../engine/reportBlocks';
import { TABLE_CATALOG } from './reportData';

const fmtN = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

/* ──────────────────────────────────────────────────────────────
 * Résolution table → données (miroir de engine.resolveTable)
 * ────────────────────────────────────────────────────────────── */
export function resolveTablePreview(
  source: string,
  data: ReportData,
  limit?: number,
): { head: string[]; body: (string | number)[][]; title?: string } {
  const empty = { head: ['—'], body: [['Aucune donnée']] as (string | number)[][] };
  switch (source) {
    case 'effectifs_dept':
      return data.effectifsByDept
        ? { head: ['Département', 'Effectif', '% actifs YTD'],
            body: data.effectifsByDept.map((r) => [r.dept, r.count, `${Math.round(r.activeRatio * 100)} %`]) }
        : empty;
    case 'effectifs_country':
      return data.effectifsByCountry
        ? { head: ['Pays', 'Effectif', 'Part'],
            body: data.effectifsByCountry.map((r) => [r.country, r.count, `${r.share.toFixed(1)} %`]) }
        : empty;
    case 'payroll_cycles':
      return data.payrollCycles
        ? { head: ['Période', 'Brut', 'Net', 'Coût employeur', 'Statut'],
            body: data.payrollCycles.map((r) => [r.period, fmtN(r.gross), fmtN(r.net), fmtN(r.employerCost), r.status]) }
        : empty;
    case 'absence_type':
      return data.absenceByType
        ? { head: ['Type', 'Jours', 'Coût'],
            body: data.absenceByType.map((r) => [r.type, r.days, fmtN(r.cost)]) }
        : empty;
    case 'recruitment_pipeline':
      return data.recruitmentPipeline
        ? { head: ['Étape', 'Candidats', 'Conv. %'],
            body: data.recruitmentPipeline.map((r) => [r.stage, r.count, `${(r.convRate * 100).toFixed(1)} %`]) }
        : empty;
    case 'onboarding_pulse':
      return data.onboardingPulse
        ? { head: ['Jalon', 'Complétion %', 'Score moyen'],
            body: data.onboardingPulse.map((r) => [r.jalon, `${r.complete} %`, r.avg_score.toFixed(1)]) }
        : empty;
    case 'okr_cascade':
      return data.okrCascade
        ? { head: ['Niveau', 'Total', 'On track', 'À risque', 'Terminés'],
            body: data.okrCascade.map((r) => [r.level, r.total, r.onTrack, r.atRisk, r.completed]) }
        : empty;
    case 'evaluations_class':
      return data.evaluationsByClass
        ? { head: ['Classe', 'Effectif', 'Part'],
            body: data.evaluationsByClass.map((r) => [r.classe, r.count, `${r.share.toFixed(1)} %`]) }
        : empty;
    case 'skills_gap':
      return data.skillsGap
        ? { head: ['Compétence', 'Détenteurs', 'Requis', 'Gap'],
            body: data.skillsGap.slice(0, limit ?? 10).map((r) => [r.skill, r.holders, r.required, r.gap]) }
        : empty;
    case 'certifications_expiring':
      return data.certificationsExpiring
        ? { head: ['Collaborateur', 'Certification', 'Échéance'],
            body: data.certificationsExpiring.map((r) => [r.employee, r.cert, r.expiry]) }
        : empty;
    case 'succession':
      return data.successionByRole
        ? { head: ['Poste', 'Ready Now', 'Ready 18m', 'Ready 3y'],
            body: data.successionByRole.map((r) => [r.role, r.readyNow, r.ready18m, r.ready3y]) }
        : empty;
    case 'promotions':
      return data.promotionsByPeriod
        ? { head: ['Période', 'Promotions', 'Budget'],
            body: data.promotionsByPeriod.map((r) => [r.period, r.count, fmtN(r.budget)]) }
        : empty;
    case 'formation_parcours':
      return data.parcoursCompletion
        ? { head: ['Parcours', 'Inscrits', 'Terminés', 'Taux %'],
            body: data.parcoursCompletion.map((r) => [r.parcours, r.enrolled, r.completed, `${r.rate.toFixed(1)} %`]) }
        : empty;
    case 'duer_risks':
      return data.duerRisks
        ? { head: ['Unité', 'Niveau', 'Nb'],
            body: data.duerRisks.map((r) => [r.unit, r.level, r.count]) }
        : empty;
    case 'work_incidents':
      return data.workIncidents
        ? { head: ['Période', 'Nombre', 'Sévérité'],
            body: data.workIncidents.map((r) => [r.period, r.count, r.severity]) }
        : empty;
    case 'parity':
      return data.parityByAxis
        ? { head: ['Axe', 'Observé', 'Seuil', 'Statut'],
            body: data.parityByAxis.map((r) => [r.axis, r.ratio.toFixed(2), r.threshold.toFixed(2), r.status]) }
        : empty;
    default:
      return empty;
  }
}

interface BlockPreviewProps {
  block: Block;
  data: ReportData;
  palette: Palette;
}

export function BlockPreview({ block, data, palette }: BlockPreviewProps) {
  switch (block.type) {
    case 'h1':
      return <h1 className="my-2 text-[22px] font-bold leading-tight" style={{ color: palette.primary }}>{block.text}</h1>;
    case 'h2':
      return <h2 className="my-2 text-[17px] font-bold leading-tight" style={{ color: palette.primary }}>{block.text}</h2>;
    case 'h3':
      return <h3 className="my-1.5 text-[14px] font-bold leading-tight" style={{ color: palette.primary }}>{block.text}</h3>;
    case 'paragraph':
      return (
        <p className={`my-1.5 text-[11px] leading-relaxed ${block.auto ? 'italic' : ''}`} style={{ color: '#525252' }}>
          {block.auto && <span className="mr-1 inline-block rounded-sm px-1 text-[9px] font-bold uppercase" style={{ background: palette.accent + '20', color: palette.accent }}>IA</span>}
          {block.text}
        </p>
      );
    case 'kpi': {
      const cols = Math.min(4, block.items.length);
      return (
        <div className={`my-2 grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {block.items.map((it, i) => (
            <div key={i} className="rounded-md border p-2" style={{ borderColor: '#e5e7eb' }}>
              <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>{it.label}</p>
              <p className="mono text-[14px] font-bold leading-tight" style={{ color: palette.accent }}>{it.value}</p>
              {it.subValue && <p className="text-[8px] font-medium" style={{ color: '#9ca3af' }}>{it.subValue}</p>}
            </div>
          ))}
        </div>
      );
    }
    case 'table': {
      const t = resolveTablePreview(block.source, data, block.limit);
      return (
        <div className="my-2">
          {(block.title || t.title) && (
            <p className="mb-1 text-[11px] font-bold" style={{ color: palette.secondary }}>{block.title ?? t.title}</p>
          )}
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr style={{ background: palette.tableHeader, color: palette.tableHeaderText }}>
                {t.head.map((h, i) => <th key={i} className="border px-1.5 py-0.5 text-left font-bold" style={{ borderColor: '#e5e7eb' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {t.body.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                  {row.map((c, j) => <td key={j} className="border px-1.5 py-0.5" style={{ borderColor: '#e5e7eb' }}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'dashboard': {
      const meta = TABLE_CATALOG.find((s) => s.v === block.dashboardId);
      return (
        <div className="my-2 flex h-32 items-center justify-center rounded-md border-2 border-dashed" style={{ borderColor: '#d1d5db', background: '#f9fafb' }}>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Dashboard</p>
            <p className="text-[12px] font-bold" style={{ color: palette.primary }}>{block.title ?? meta?.label ?? block.dashboardId}</p>
          </div>
        </div>
      );
    }
    case 'pageBreak':
      return <div className="my-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: '#d1d5db' }}>
        <span className="flex-1 border-t border-dashed" /> Saut de page <span className="flex-1 border-t border-dashed" />
      </div>;
    case 'image':
      return block.dataUrl
        ? <img src={block.dataUrl} alt={block.caption ?? ''} className="my-2 max-h-40 w-full rounded-md border object-cover" style={{ borderColor: '#e5e7eb' }} />
        : <div className="my-2 flex h-32 items-center justify-center rounded-md border-2 border-dashed text-[10px]" style={{ borderColor: '#d1d5db' }}>[Image vide]</div>;
    case 'spacer':
      return <div style={{ height: (block.height ?? 6) + 'mm' }} />;
    default:
      return null;
  }
}
