/**
 * DashboardSnippet — rendu inline simple d'un dashboard dans le visualiseur.
 * Pour le sprint 1, on affiche une carte avec compteurs déduits de ReportData.
 * Le rendu PDF/PPTX reste un placeholder (le standard tolère le dégradé).
 */
import { LayoutDashboard } from 'lucide-react';
import type { ReportData, Palette } from '../../engine/reportBlocks';
import { DASHBOARD_CATALOG } from './reportData';

interface DashboardSnippetProps {
  dashboardId: string;
  title?: string;
  data: ReportData;
  palette: Palette;
}

export function DashboardSnippet({ dashboardId, title, data, palette }: DashboardSnippetProps) {
  const meta = DASHBOARD_CATALOG.find((d) => d.id === dashboardId);
  const label = title ?? meta?.name ?? dashboardId;

  // Quelques stats résumées selon l'ID du dashboard
  const stats: Array<{ label: string; value: string }> = (() => {
    switch (dashboardId) {
      case 'cockpit-drh':
        return [
          { label: 'Effectif', value: String((data.effectifsByDept ?? []).reduce((s, e) => s + e.count, 0)) },
          { label: 'Conformité', value: data.conformiteScores?.global ? `${data.conformiteScores.global}/100` : '—' },
          { label: 'OKR on-track', value: data.okrCascade ? String(data.okrCascade.reduce((s, l) => s + l.onTrack, 0)) : '—' },
        ];
      case 'm9-honeycomb':
        return [
          { label: 'Compétences', value: data.skillsGap ? String(data.skillsGap.length) : '—' },
          { label: 'Gap', value: data.skillsGap ? String(data.skillsGap.reduce((s, k) => s + k.gap, 0)) : '—' },
        ];
      case 'm10-succession':
        return [
          { label: 'Postes clés', value: data.successionByRole ? String(data.successionByRole.length) : '—' },
          { label: 'Ready Now', value: data.successionByRole ? String(data.successionByRole.reduce((s, r) => s + r.readyNow, 0)) : '—' },
        ];
      case 'm11-formation':
        return [
          { label: 'Parcours', value: data.parcoursCompletion ? String(data.parcoursCompletion.length) : '—' },
          { label: 'Accès', value: data.formationKPIs?.accessRate ? `${Math.round(data.formationKPIs.accessRate * 100)}%` : '—' },
          { label: 'FDFP', value: data.formationKPIs?.fdfpRecuperable ? `${(data.formationKPIs.fdfpRecuperable / 1_000_000).toFixed(1)}M` : '—' },
        ];
      case 'm12-conformite':
        return [
          { label: 'Score', value: data.conformiteScores ? `${data.conformiteScores.global}/100` : '—' },
          { label: 'DUER critique', value: data.duerRisks ? String(data.duerRisks.filter((r) => r.level === 'Critique').reduce((s, r) => s + r.count, 0)) : '—' },
          { label: 'AT', value: data.workIncidents ? String(data.workIncidents.reduce((s, i) => s + i.count, 0)) : '—' },
        ];
      default:
        return [{ label: 'Dashboard', value: '—' }];
    }
  })();

  return (
    <div className="my-2 rounded-md border p-3" style={{ borderColor: '#e5e7eb', background: '#fafafa' }}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <LayoutDashboard size={11} style={{ color: palette.accent }} />
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: palette.secondary }}>{label}</p>
        </div>
        <span className="text-[8px] font-bold uppercase" style={{ color: '#9ca3af' }}>{meta?.cat ?? '—'}</span>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
        {stats.map((s) => (
          <div key={s.label} className="rounded bg-white p-1.5">
            <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>{s.label}</p>
            <p className="mono text-[14px] font-bold leading-tight" style={{ color: palette.primary }}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
