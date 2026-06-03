import { useMemo } from 'react';
import { Network, AlertTriangle, TrendingUp, Sparkles, Users } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatCard } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { ProgressBar } from '../components/charts/ProgressBar';
import { Brand } from '../components/ui/Brand';
import { CompetencesSubNav } from '../components/competences/CompetencesSubNav';
import { SKILLS } from '../data/mock';

function riskColor(s: { holders: number; projectedGap: number }): string {
  if (s.holders <= 1) return '#D6483B';
  if (s.projectedGap >= 2) return '#EF9F27';
  return '#1B9E6B';
}

export function CompetencesPage() {
  const spof = SKILLS.filter((s) => s.holders <= 1);
  const avgCoverage = Math.round((SKILLS.reduce((s, x) => s + x.holders, 0) / SKILLS.length) * 25);
  const gaps = [...SKILLS].filter((s) => s.projectedGap > 0).sort((a, b) => b.projectedGap - a.projectedGap);

  // Positions du graphe (constellation autour de l'organisation).
  const nodes = useMemo(() => {
    const cx = 250;
    const cy = 180;
    const R = 135;
    return SKILLS.map((s, i) => {
      const angle = (i / SKILLS.length) * Math.PI * 2 - Math.PI / 2;
      return {
        ...s,
        x: cx + R * Math.cos(angle),
        y: cy + R * Math.sin(angle),
        r: 7 + s.holders * 3,
        cx,
        cy,
      };
    });
  }, []);

  return (
    <div className="animate-fade-up space-y-6">
      <CompetencesSubNav />
      <SectionHeader
        eyebrow="Bloc C · M9"
        title="Graphe de compétences"
        description="Référentiel vivant et auto-alimenté : qui sait quoi, à quel niveau, avec quelle preuve — et où se cachent les fragilités."
        action={<StatusPill tone="amber" dot={false}>Graphe vivant</StatusPill>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Compétences" value={String(SKILLS.length)} unit="suivies" icon={Network} />
        <StatCard label="Single points of failure" value={String(spof.length)} unit="à sécuriser" icon={AlertTriangle} tone="amber" />
        <StatCard label="Couverture moyenne" value={`${avgCoverage}`} unit="%" delta={4} icon={Users} />
        <StatCard label="Manques projetés" value={String(gaps.length)} unit="18 mois" icon={TrendingUp} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Constellation */}
        <Card className="lg:col-span-2">
          <CardHeader title="Cartographie des compétences" subtitle="Taille = détenteurs · couleur = risque" />
          <div className="overflow-x-auto">
            <svg viewBox="0 0 500 360" className="h-auto w-full min-w-[460px]">
              {/* liens */}
              {nodes.map((n) => (
                <line
                  key={`l-${n.name}`}
                  x1={n.cx}
                  y1={n.cy}
                  x2={n.x}
                  y2={n.y}
                  stroke="rgba(23,21,15,0.10)"
                  strokeWidth={1}
                />
              ))}
              {/* centre */}
              <circle cx={250} cy={180} r={30} fill="#EF9F27" />
              <text x={250} y={177} textAnchor="middle" fill="#3B1F00" style={{ fontSize: 10, fontWeight: 700 }}>
                Atlas
              </text>
              <text x={250} y={189} textAnchor="middle" fill="#5A3A00" style={{ fontSize: 9 }}>
                Demo
              </text>
              {/* noeuds */}
              {nodes.map((n) => (
                <g key={n.name}>
                  <circle cx={n.x} cy={n.y} r={n.r} fill={riskColor(n)} opacity={0.9}>
                    <title>{`${n.name} — ${n.holders} détenteur(s), niveau ${n.avgLevel}/4`}</title>
                  </circle>
                  <text
                    x={n.x}
                    y={n.y + n.r + 12}
                    textAnchor="middle"
                    className="fill-ink-700"
                    style={{ fontSize: 9.5, fontWeight: 600 }}
                  >
                    {n.name.length > 16 ? `${n.name.slice(0, 15)}…` : n.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-[11px] font-semibold text-ink-500">
            <Legend color="#D6483B" label="SPOF (1 détenteur)" />
            <Legend color="#EF9F27" label="Pénurie projetée" />
            <Legend color="#1B9E6B" label="Couverture saine" />
          </div>
        </Card>

        {/* SPOF */}
        <Card>
          <CardHeader
            title="Points de fragilité"
            subtitle="Single points of failure"
            action={<AlertTriangle size={16} className="text-danger" />}
          />
          <div className="space-y-2.5">
            {spof.map((s) => (
              <div key={s.name} className="rounded-2xl border border-danger/20 bg-danger/[0.05] p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-ink">{s.name}</p>
                  <StatusPill tone="danger" dot={false}>
                    1 détenteur
                  </StatusPill>
                </div>
                <p className="mt-1 text-[11px] font-medium text-ink-500">{s.domain} · niveau {s.avgLevel}/4</p>
                <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold text-amber-deep">
                  <Sparkles size={12} className="mt-0.5 shrink-0" /> Plan de transfert de compétence recommandé
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Projection des manques */}
      <Card>
        <CardHeader
          title="Projection des manques de compétences — 12 à 18 mois"
          subtitle="Anticipation stratégique (formation prioritaire vs recrutement)"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/25 bg-amber/[0.08] px-3 py-1 text-[11px] font-bold text-amber-deep">
              <Sparkles size={12} /> <Brand name="Proph3t" />
            </span>
          }
        />
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          {gaps.map((s) => (
            <div key={s.name}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-bold text-ink">{s.name}</span>
                <span className="mono text-xs font-bold text-amber-deep">+{s.projectedGap} besoin(s)</span>
              </div>
              <ProgressBar value={s.projectedGap} max={3} tone={s.projectedGap >= 2 ? 'danger' : 'amber'} showLabel={false} />
              <p className="mt-1 text-[11px] font-medium text-ink-400">
                {s.domain} · {s.holders} détenteur(s) actuel(s)
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}
