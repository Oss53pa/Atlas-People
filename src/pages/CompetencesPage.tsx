/**
 * M9 COMPÉTENCES — Cockpit premium refondu.
 * Visualisation Honeycomb hexagonale groupée par famille avec halos & gradients.
 * Niveau Workday Skills Cloud / Lattice — light theme amber-deep.
 */
import { useMemo, useState } from 'react';
import {
  Network, AlertTriangle, TrendingUp, Sparkles, Users, Search, Award, Eye,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatCard } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { Brand } from '../components/ui/Brand';
import { CompetencesSubNav } from '../components/competences/CompetencesSubNav';
import { SKILLS } from '../data/mock';
import { cn } from '../lib/cn';

// ──────── Helpers
function riskLevel(s: { holders: number; projectedGap: number }): 'critical' | 'risk' | 'healthy' {
  if (s.holders <= 1) return 'critical';
  if (s.projectedGap >= 2) return 'risk';
  return 'healthy';
}

// Palette par domaine (cohérent design Atlas amber-deep)
const DOMAIN_PALETTE: Record<string, { bg: string; border: string; label: string }> = {
  Technologie:    { bg: '#F0F9FF', border: '#0EA5E9', label: 'Technologie' },
  Finance:        { bg: '#ECFDF5', border: '#059669', label: 'Finance' },
  'Soft skills':  { bg: '#FFF7ED', border: '#D97706', label: 'Soft skills' },
  Conformité:     { bg: '#FFF1F2', border: '#E11D48', label: 'Conformité' },
  Data:           { bg: '#F5F3FF', border: '#7C3AED', label: 'Data' },
};

const RISK_COLORS: Record<'critical' | 'risk' | 'healthy', { fill: string; ring: string; halo: string; label: string }> = {
  critical: { fill: '#FEE2E2', ring: '#DC2626', halo: 'rgba(220, 38, 38, 0.15)', label: 'Critique' },
  risk:     { fill: '#FEF3C7', ring: '#D97706', halo: 'rgba(217, 119, 6, 0.12)',  label: 'À surveiller' },
  healthy:  { fill: '#D1FAE5', ring: '#059669', halo: 'rgba(5, 150, 105, 0.10)',  label: 'Saine' },
};

// ──────── Composant Hexagone
function Hexagon({
  cx, cy, size, fill, ring, opacity = 1,
}: { cx: number; cy: number; size: number; fill: string; ring: string; opacity?: number }) {
  // Hexagone pointe-en-haut, 6 sommets autour de cx,cy
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`;
  }).join(' ');
  return <polygon points={points} fill={fill} stroke={ring} strokeWidth={2} opacity={opacity} />;
}

export function CompetencesPage() {
  const [selectedSkill, setSelectedSkill] = useState<typeof SKILLS[number] | null>(null);
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => SKILLS.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (domainFilter && s.domain !== domainFilter) return false;
    return true;
  }), [q, domainFilter]);

  // Groupe par domaine pour le honeycomb
  const byDomain = useMemo(() => {
    const map = new Map<string, typeof SKILLS>();
    for (const s of filtered) {
      const arr = map.get(s.domain) ?? [];
      arr.push(s);
      map.set(s.domain, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // KPIs
  const spof = SKILLS.filter((s) => s.holders <= 1);
  const avgCoverage = Math.round((SKILLS.reduce((s, x) => s + x.holders, 0) / SKILLS.length) * 25);
  const gaps = SKILLS.filter((s) => s.projectedGap > 0).sort((a, b) => b.projectedGap - a.projectedGap);
  const experts = SKILLS.filter((s) => s.avgLevel >= 3.5).length;

  return (
    <div className="animate-fade-up space-y-6">
      <CompetencesSubNav />
      <SectionHeader
        eyebrow="Bloc C · M9"
        title="Skills Cloud Atlas"
        description="Visualisation hexagonale par famille · taille = détenteurs · couleur = risque · hover pour détail · cliquer pour focus."
        action={<StatusPill tone="amber" dot={false}>Cartographie vivante</StatusPill>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Compétences suivies" value={String(SKILLS.length)} unit="référentiel" icon={Network} />
        <StatCard label="Single points of failure" value={String(spof.length)} unit="à sécuriser" icon={AlertTriangle} tone="amber" />
        <StatCard label="Couverture moyenne" value={`${avgCoverage}`} unit="%" delta={4} icon={Users} />
        <StatCard label="Experts identifiés" value={String(experts)} unit="niveau ≥ 3,5" icon={Award} />
      </div>

      {/* HONEYCOMB premium hero */}
      <Card inset={false} className="overflow-hidden">
        <div className="border-b border-line bg-gradient-to-br from-amber-50/40 to-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-ink">Honeycomb des compétences</h2>
              <p className="mt-0.5 text-[12px] font-medium text-ink-500">
                {filtered.length} compétences groupées en {byDomain.length} familles · alvéoles sized by détenteurs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…"
                  className="h-9 w-48 rounded-xl border border-line bg-surface pl-8 pr-3 text-[12px] font-medium text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Filtre par famille */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button onClick={() => setDomainFilter(null)}
              className={cn('rounded-full border px-3 py-1 text-[11px] font-bold transition-all',
                domainFilter === null
                  ? 'border-amber-deep bg-amber-deep text-white shadow'
                  : 'border-line bg-surface text-ink-500 hover:border-amber-deep/40')}>
              Tous
            </button>
            {Object.entries(DOMAIN_PALETTE).map(([dom, pal]) => (
              <button key={dom} onClick={() => setDomainFilter(domainFilter === dom ? null : dom)}
                className={cn('rounded-full border px-3 py-1 text-[11px] font-bold transition-all',
                  domainFilter === dom
                    ? 'text-white shadow'
                    : 'bg-surface text-ink-500 hover:bg-surface2/60')}
                style={domainFilter === dom
                  ? { backgroundColor: pal.border, borderColor: pal.border }
                  : { borderColor: pal.border, color: pal.border }}>
                {pal.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.6fr_1fr]">
          {/* Honeycomb SVG */}
          <div className="p-5 lg:border-r lg:border-line">
            <svg viewBox="0 0 700 460" className="h-auto w-full">
              {/* Grille de fond légère */}
              <defs>
                <radialGradient id="bgGlow" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="rgba(217, 119, 6, 0.04)" />
                  <stop offset="100%" stopColor="rgba(217, 119, 6, 0)" />
                </radialGradient>
                <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                  <feOffset dx="0" dy="1" result="offsetblur" />
                  <feComponentTransfer><feFuncA type="linear" slope="0.25" /></feComponentTransfer>
                  <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect width="700" height="460" fill="url(#bgGlow)" />

              {/* Honeycomb : pour chaque famille, on positionne un cluster */}
              {byDomain.map(([domain, skills], domIdx) => {
                const pal = DOMAIN_PALETTE[domain] ?? { bg: '#F5F5F4', border: '#78716C', label: domain };
                // Cluster center
                const clusterAngle = (domIdx / byDomain.length) * Math.PI * 2 - Math.PI / 2;
                const clusterRadius = byDomain.length === 1 ? 0 : 160;
                const clusterCx = 350 + clusterRadius * Math.cos(clusterAngle);
                const clusterCy = 230 + clusterRadius * Math.sin(clusterAngle);

                // Halo famille en arrière-plan
                const haloR = 30 + skills.length * 22;

                return (
                  <g key={domain}>
                    {/* Halo de famille */}
                    <circle cx={clusterCx} cy={clusterCy} r={haloR}
                      fill={pal.border} opacity={0.05} />
                    <circle cx={clusterCx} cy={clusterCy} r={haloR}
                      fill="none" stroke={pal.border} strokeWidth={1} strokeDasharray="3 4" opacity={0.3} />

                    {/* Label famille */}
                    <text x={clusterCx} y={clusterCy - haloR - 8} textAnchor="middle"
                      fill={pal.border} style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em' }}>
                      {pal.label.toUpperCase()}
                    </text>

                    {/* Hexagones des skills */}
                    {skills.map((s, sIdx) => {
                      const risk = riskLevel(s);
                      const riskCol = RISK_COLORS[risk];
                      const hexSize = 16 + s.holders * 5;          // taille = détenteurs
                      const skillAngle = skills.length === 1 ? 0 : (sIdx / skills.length) * Math.PI * 2;
                      const r = skills.length === 1 ? 0 : 24 + skills.length * 4;
                      const hx = clusterCx + r * Math.cos(skillAngle);
                      const hy = clusterCy + r * Math.sin(skillAngle);
                      const isSelected = selectedSkill?.name === s.name;
                      const isFamilyDimmed = domainFilter && domainFilter !== domain;

                      return (
                        <g key={s.name} className="cursor-pointer transition-opacity"
                          opacity={isFamilyDimmed ? 0.2 : 1}
                          onMouseEnter={() => setSelectedSkill(s)}
                          onMouseLeave={() => setSelectedSkill(null)}
                          onClick={() => setSelectedSkill(s)}>
                          {/* Halo de risque */}
                          {isSelected && (
                            <Hexagon cx={hx} cy={hy} size={hexSize + 8} fill={riskCol.halo} ring="transparent" />
                          )}
                          {/* Hexagone principal */}
                          <Hexagon cx={hx} cy={hy} size={hexSize}
                            fill={riskCol.fill} ring={riskCol.ring}
                            opacity={isSelected ? 1 : 0.92} />
                          {/* Label compétence — uniquement si hex assez grand */}
                          {hexSize >= 22 && (
                            <text x={hx} y={hy - 2} textAnchor="middle"
                              fill="#1F1F1F" style={{ fontSize: 8.5, fontWeight: 700, pointerEvents: 'none' }}>
                              {s.name.split(' ').slice(0, 2).join(' ').slice(0, 14)}
                            </text>
                          )}
                          {hexSize >= 22 && (
                            <text x={hx} y={hy + 9} textAnchor="middle"
                              fill={riskCol.ring} style={{ fontSize: 8, fontWeight: 700, pointerEvents: 'none' }}>
                              {s.holders} · L{s.avgLevel.toFixed(1)}
                            </text>
                          )}
                          {/* Title fallback */}
                          <title>{`${s.name} — ${s.holders} détenteur(s) · niveau ${s.avgLevel}/4 · risque ${riskCol.label.toLowerCase()}`}</title>
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Centre Atlas — discret */}
              <circle cx={350} cy={230} r={28} fill="#FFFFFF" stroke="#D97706" strokeWidth={2} filter="url(#softShadow)" />
              <text x={350} y={228} textAnchor="middle" fill="#D97706" style={{ fontFamily: '"Grand Hotel", cursive', fontSize: 16 }}>Atlas</text>
              <text x={350} y={240} textAnchor="middle" fill="#78716C" style={{ fontSize: 7, letterSpacing: '0.2em', fontWeight: 700 }}>PEOPLE</text>
            </svg>

            {/* Légende */}
            <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-[11px] font-semibold text-ink-500">
              {(['critical', 'risk', 'healthy'] as const).map((k) => {
                const c = RISK_COLORS[k];
                return (
                  <span key={k} className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <Hexagon cx={7} cy={7} size={6} fill={c.fill} ring={c.ring} />
                    </svg>
                    <span>{c.label}</span>
                  </span>
                );
              })}
              <span className="ml-auto text-[10px] font-medium italic text-ink-400">
                Taille hexagone ∝ détenteurs · cliquer pour épingler la sélection
              </span>
            </div>
          </div>

          {/* Panneau détail */}
          <div className="p-5">
            {selectedSkill ? (
              <SkillDetail skill={selectedSkill} />
            ) : (
              <SkillsInsights spof={spof} experts={experts} totalGaps={gaps.length} />
            )}
          </div>
        </div>
      </Card>

      {/* SPOF + projection — section bas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-rose-200">
          <CardHeader
            title="Points de fragilité critiques"
            subtitle={`${spof.length} compétence(s) à 1 détenteur — bus factor critique`}
            action={<AlertTriangle size={16} className="text-rose-600" />}
          />
          <div className="space-y-2">
            {spof.map((s) => (
              <div key={s.name}
                className="group flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/40 p-3 transition-colors hover:bg-rose-50/70 cursor-pointer"
                onClick={() => setSelectedSkill(s)}>
                <div className="rounded-lg bg-rose-100 p-2">
                  <AlertTriangle size={14} className="text-rose-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-ink">{s.name}</p>
                  <p className="text-[10px] font-medium text-ink-500">{s.domain} · niveau {s.avgLevel}/4 moyen</p>
                </div>
                <StatusPill tone="danger" dot={false}>1 détenteur</StatusPill>
              </div>
            ))}
            {spof.length === 0 && <p className="rounded-xl bg-emerald-50 px-3 py-3 text-[12px] font-medium italic text-emerald-700">Aucun point critique — toutes les compétences ont ≥ 2 détenteurs.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Projection 18 mois"
            subtitle="Manques anticipés — formation prioritaire vs recrutement"
            action={<span className="inline-flex items-center gap-1.5 rounded-full border border-amber/25 bg-amber/[0.08] px-3 py-1 text-[11px] font-bold text-amber-deep"><Sparkles size={12} /> <Brand name="Proph3t" /></span>}
          />
          <div className="space-y-2">
            {gaps.map((s) => {
              const pct = Math.min(100, (s.projectedGap / 3) * 100);
              return (
                <div key={s.name}
                  className="cursor-pointer rounded-xl border border-line bg-surface p-3 transition-colors hover:bg-amber/[0.04]"
                  onClick={() => setSelectedSkill(s)}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-ink">{s.name}</span>
                    <span className="mono rounded-full bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">+{s.projectedGap} besoin(s)</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                    <div className={cn('h-full rounded-full transition-all',
                      s.projectedGap >= 2 ? 'bg-rose-500' : 'bg-amber-500')}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] font-medium text-ink-500">
                    {s.domain} · {s.holders} détenteur(s) actuels · {s.projectedGap >= 2 ? 'Recrutement urgent recommandé' : 'Plan formation suffisant'}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ──────── Sous-composants détail ──────── */

function SkillDetail({ skill }: { skill: typeof SKILLS[number] }) {
  const risk = riskLevel(skill);
  const riskCol = RISK_COLORS[risk];
  const pal = DOMAIN_PALETTE[skill.domain] ?? { bg: '#F5F5F4', border: '#78716C', label: skill.domain };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <Hexagon cx={28} cy={28} size={22} fill={riskCol.fill} ring={riskCol.ring} />
        </svg>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: pal.border }}>
              {pal.label}
            </span>
            <StatusPill tone={risk === 'critical' ? 'danger' : risk === 'risk' ? 'warn' : 'success'} dot={false}>
              {riskCol.label}
            </StatusPill>
          </div>
          <h3 className="mt-1 text-[16px] font-semibold leading-tight text-ink">{skill.name}</h3>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-surface2/60 p-3 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Détenteurs</p>
          <p className="mono mt-1 text-[24px] font-bold text-ink">{skill.holders}</p>
        </div>
        <div className="rounded-xl bg-surface2/60 p-3 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Niveau moyen</p>
          <p className="mono mt-1 text-[24px] font-bold text-ink">{skill.avgLevel.toFixed(1)}<span className="text-[12px] text-ink-500">/4</span></p>
        </div>
        <div className="rounded-xl bg-surface2/60 p-3 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Manque 18 m</p>
          <p className={cn('mono mt-1 text-[24px] font-bold',
            skill.projectedGap === 0 ? 'text-emerald-600' :
            skill.projectedGap === 1 ? 'text-amber-700' : 'text-rose-600')}>
            {skill.projectedGap > 0 ? `+${skill.projectedGap}` : '0'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface2/40 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Diagnostic Proph3t</p>
        <p className="mt-1 text-[11px] font-medium text-ink-700">
          {risk === 'critical' && '🔴 Compétence à risque critique — un seul détenteur, transfert urgent recommandé. Identifier un binôme et lancer un plan de mentorat sous 30 jours.'}
          {risk === 'risk' && '🟠 Pénurie anticipée sous 18 mois. Combinaison formation interne + recrutement externe à planifier dès le prochain comité M9.'}
          {risk === 'healthy' && '🟢 Couverture saine. Continuer le suivi périodique et capitaliser sur les experts internes pour mentorer la prochaine génération.'}
        </p>
      </div>

      <div className="rounded-xl border border-amber-deep/20 bg-amber/[0.04] p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">Actions recommandées</p>
        <ul className="mt-1 space-y-0.5 text-[11px] font-medium text-ink-700">
          {risk === 'critical' && (<>
            <li>→ Identifier 2 binômes mentees sous 30 jours (M9 PDC)</li>
            <li>→ Documenter savoir critique (runbooks · vidéos · pairs sessions)</li>
            <li>→ Évaluer contrat externe en backup (consultant tiers)</li>
          </>)}
          {risk === 'risk' && (<>
            <li>→ Plan formation M11 (3-6 mois)</li>
            <li>→ Ouvrir poste M5 — sourcing prioritaire</li>
            <li>→ Mentorat M10 par expert interne</li>
          </>)}
          {risk === 'healthy' && (<>
            <li>→ Maintenir suivi trimestriel</li>
            <li>→ Identifier candidats experts (niveau 5) pour mentorat externe</li>
            <li>→ Capitaliser dans la knowledge base interne</li>
          </>)}
        </ul>
      </div>
    </div>
  );
}

function SkillsInsights({ spof, experts, totalGaps }: { spof: typeof SKILLS; experts: number; totalGaps: number }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-amber-deep" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">Lecture rapide</p>
        </div>
        <h3 className="mt-1 font-display text-xl leading-tight text-ink">L'écosystème en un coup d'œil</h3>
      </div>

      <div className="space-y-2">
        <InsightRow icon={AlertTriangle} tone="danger" title={`${spof.length} compétences critiques`} body={`SPOF · 1 détenteur unique. Bus factor élevé. Plans de transfert à activer.`} />
        <InsightRow icon={TrendingUp} tone="warn" title={`${totalGaps} pénuries anticipées`} body={`Projection 18 mois — combinaison recrutement & formation à orchestrer dès Q3.`} />
        <InsightRow icon={Award} tone="success" title={`${experts} experts identifiés`} body={`Niveau ≥ 3,5/4. Pool référent à valoriser via mentorat et conférences externes.`} />
      </div>

      <div className="mt-auto rounded-xl bg-gradient-to-br from-amber-50/40 to-surface p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">Astuce</p>
        <p className="mt-1 text-[11px] font-medium italic text-ink-700">
          Survolez ou cliquez un hexagone pour voir le détail · filtrez par famille pour zoomer · sélection persistante au clic.
        </p>
      </div>
    </div>
  );
}

function InsightRow({ icon: Icon, tone, title, body }: { icon: typeof AlertTriangle; tone: 'danger' | 'warn' | 'success'; title: string; body: string }) {
  const cls = tone === 'danger' ? 'border-rose-200 bg-rose-50/30 text-rose-700' :
              tone === 'warn'   ? 'border-amber-200 bg-amber-50/30 text-amber-700' :
                                  'border-emerald-200 bg-emerald-50/30 text-emerald-700';
  return (
    <div className={cn('flex items-start gap-2 rounded-xl border p-2.5', cls)}>
      <Icon size={14} className="mt-0.5 shrink-0" />
      <div>
        <p className="text-[12px] font-bold text-ink">{title}</p>
        <p className="text-[10px] font-medium text-ink-700">{body}</p>
      </div>
    </div>
  );
}
