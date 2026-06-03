/**
 * M9 COMPÉTENCES — Cockpit Skills Cloud premium v2.
 * Swimlanes par famille + grille hexagonale tile + panneau détail sticky.
 * Modèle Workday/Lattice — aucune bulle qui déborde, alignement aéré.
 */
import { useMemo, useState } from 'react';
import {
  Network, AlertTriangle, TrendingUp, Sparkles, Users, Search, Award, Eye,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatCard } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { Brand } from '../components/ui/Brand';
import { CompetencesSubNav } from '../components/competences/CompetencesSubNav';
import { M9LiveBanner } from '../components/competences/M9LiveBanner';
import { SKILLS } from '../data/mock';
import { cn } from '../lib/cn';

// ──────── Helpers
function riskLevel(s: { holders: number; projectedGap: number }): 'critical' | 'risk' | 'healthy' {
  if (s.holders <= 1) return 'critical';
  if (s.projectedGap >= 2) return 'risk';
  return 'healthy';
}

const DOMAIN_PALETTE: Record<string, { tint: string; border: string; chip: string; label: string }> = {
  Technologie:   { tint: 'bg-sky-50/60',     border: 'border-sky-300',     chip: 'bg-sky-100 text-sky-700',         label: 'Technologie' },
  Finance:       { tint: 'bg-emerald-50/60', border: 'border-emerald-300', chip: 'bg-emerald-100 text-emerald-700', label: 'Finance' },
  'Soft skills': { tint: 'bg-amber-50/60',   border: 'border-amber-300',   chip: 'bg-amber-100 text-amber-800',     label: 'Soft skills' },
  Conformité:    { tint: 'bg-rose-50/60',    border: 'border-rose-300',    chip: 'bg-rose-100 text-rose-700',       label: 'Conformité' },
  Data:          { tint: 'bg-violet-50/60',  border: 'border-violet-300',  chip: 'bg-violet-100 text-violet-700',   label: 'Data' },
};

const RISK_META: Record<'critical' | 'risk' | 'healthy', { fill: string; ring: string; ringDark: string; label: string; pillTone: 'success' | 'warn' | 'danger' }> = {
  critical: { fill: '#FEE2E2', ring: '#DC2626', ringDark: '#991B1B', label: 'Critique',     pillTone: 'danger'  },
  risk:     { fill: '#FEF3C7', ring: '#D97706', ringDark: '#92400E', label: 'À surveiller', pillTone: 'warn'    },
  healthy:  { fill: '#D1FAE5', ring: '#059669', ringDark: '#065F46', label: 'Saine',        pillTone: 'success' },
};

// ──────── Hexagone tile component (pointy-top, 110x126 viewBox)
function HexTile({
  skill, selected, onClick, onHover,
}: {
  skill: typeof SKILLS[number];
  selected: boolean;
  onClick: () => void;
  onHover: (s: typeof SKILLS[number] | null) => void;
}) {
  const risk = riskLevel(skill);
  const meta = RISK_META[risk];
  // Hexagone pointy-top : 6 sommets sur cercle de rayon 55 autour de (55, 60)
  const cx = 55, cy = 60, r = 50;
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(skill)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        'group relative shrink-0 transition-transform',
        selected ? 'scale-110 z-10' : 'hover:scale-105',
      )}
      style={{ width: 110, height: 126 }}
    >
      <svg viewBox="0 0 110 126" width="110" height="126" className="drop-shadow-sm">
        <defs>
          <linearGradient id={`grad-${skill.name.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={meta.fill} />
            <stop offset="100%" stopColor={meta.fill} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <polygon
          points={points}
          fill={`url(#grad-${skill.name.replace(/\s+/g, '-')})`}
          stroke={selected ? meta.ringDark : meta.ring}
          strokeWidth={selected ? 3 : 2}
        />
        {/* Indicateur taille (dot row) — visuel proportionnel aux détenteurs */}
        <g transform="translate(55, 38)">
          {Array.from({ length: Math.min(skill.holders, 5) }).map((_, i) => (
            <circle key={i} cx={(i - Math.min(skill.holders, 5) / 2 + 0.5) * 6} cy="0" r={2.2} fill={meta.ringDark} opacity={0.9} />
          ))}
        </g>
      </svg>
      {/* Label centré dans l'hexagone */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
        <p className="text-[10px] font-bold leading-tight text-ink" style={{ paddingTop: 14 }}>
          {skill.name.length > 14 ? `${skill.name.slice(0, 13)}…` : skill.name}
        </p>
        <p className="mono mt-0.5 text-[9px] font-bold" style={{ color: meta.ringDark }}>
          {skill.holders} · L{skill.avgLevel.toFixed(1)}
        </p>
      </div>
    </button>
  );
}

export function CompetencesPage() {
  const [selectedSkill, setSelectedSkill] = useState<typeof SKILLS[number] | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<typeof SKILLS[number] | null>(null);
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => SKILLS.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (domainFilter && s.domain !== domainFilter) return false;
    return true;
  }), [q, domainFilter]);

  const byDomain = useMemo(() => {
    const order = ['Technologie', 'Finance', 'Data', 'Conformité', 'Soft skills'];
    const map = new Map<string, typeof SKILLS>();
    for (const s of filtered) {
      const arr = map.get(s.domain) ?? [];
      arr.push(s);
      map.set(s.domain, arr);
    }
    return order.filter((d) => map.has(d)).map((d) => [d, map.get(d)!] as const);
  }, [filtered]);

  // KPIs (toujours sur SKILLS complet)
  const spof = SKILLS.filter((s) => s.holders <= 1);
  const avgCoverage = Math.round((SKILLS.reduce((s, x) => s + x.holders, 0) / SKILLS.length) * 25);
  const gaps = SKILLS.filter((s) => s.projectedGap > 0).sort((a, b) => b.projectedGap - a.projectedGap);
  const experts = SKILLS.filter((s) => s.avgLevel >= 3.5).length;

  // Panneau affiche : sélection persistante OU hover OU insights
  const panelSkill = selectedSkill ?? hoveredSkill;

  return (
    <div className="animate-fade-up space-y-6">
      <CompetencesSubNav />
      <M9LiveBanner />
      <SectionHeader
        eyebrow="Bloc C · M9"
        title="Skills Cloud Atlas"
        description="Swimlanes par famille · hexagones par compétence · taille des points = détenteurs · couleur = risque. Hover pour aperçu · clic pour épingler."
        action={<StatusPill tone="amber" dot={false}>Cartographie vivante</StatusPill>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Compétences suivies" value={String(SKILLS.length)} unit="référentiel" icon={Network} />
        <StatCard label="Single points of failure" value={String(spof.length)} unit="à sécuriser" icon={AlertTriangle} tone="amber" />
        <StatCard label="Couverture moyenne" value={`${avgCoverage}`} unit="%" delta={4} icon={Users} />
        <StatCard label="Experts identifiés" value={String(experts)} unit="niveau ≥ 3,5" icon={Award} />
      </div>

      {/* Hero swimlanes + panneau */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Card inset={false} className="overflow-hidden">
          {/* Header avec filtre + recherche */}
          <div className="border-b border-line bg-gradient-to-br from-amber-50/40 to-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-ink">Skills Cloud</h2>
                <p className="mt-0.5 text-[12px] font-medium text-ink-500">
                  {filtered.length} / {SKILLS.length} compétences · {byDomain.length} familles
                </p>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…"
                  className="h-9 w-56 rounded-xl border border-line bg-surface pl-8 pr-3 text-[12px] font-medium text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button onClick={() => setDomainFilter(null)}
                className={cn('rounded-full border px-3 py-1 text-[11px] font-bold transition-colors',
                  domainFilter === null
                    ? 'border-amber-deep bg-amber-deep text-white shadow-sm'
                    : 'border-line bg-surface text-ink-500 hover:border-amber-deep/40')}>
                Tous ({SKILLS.length})
              </button>
              {Object.entries(DOMAIN_PALETTE).map(([dom, pal]) => {
                const count = SKILLS.filter((s) => s.domain === dom).length;
                if (count === 0) return null;
                return (
                  <button key={dom} onClick={() => setDomainFilter(domainFilter === dom ? null : dom)}
                    className={cn('rounded-full border px-3 py-1 text-[11px] font-bold transition-colors',
                      domainFilter === dom ? `${pal.chip} border-transparent shadow-sm` : 'border-line bg-surface text-ink-500 hover:bg-surface2/60')}>
                    {pal.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Swimlanes */}
          <div className="space-y-2 p-4">
            {byDomain.length === 0 ? (
              <p className="rounded-xl bg-surface2/40 px-3 py-6 text-center text-[12px] font-medium italic text-ink-500">
                Aucune compétence ne correspond aux filtres.
              </p>
            ) : byDomain.map(([dom, skills]) => {
              const pal = DOMAIN_PALETTE[dom];
              return (
                <div key={dom} className={cn('rounded-2xl border-2 p-3', pal.border, pal.tint)}>
                  <div className="mb-2 flex items-center justify-between px-2">
                    <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', pal.chip)}>
                      {pal.label}
                    </span>
                    <span className="mono text-[10px] font-bold text-ink-500">
                      {skills.length} compétence(s) · {skills.reduce((s, x) => s + x.holders, 0)} détenteurs
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 px-1">
                    {skills.map((s) => (
                      <HexTile
                        key={s.name}
                        skill={s}
                        selected={selectedSkill?.name === s.name}
                        onClick={() => setSelectedSkill(selectedSkill?.name === s.name ? null : s)}
                        onHover={setHoveredSkill}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Légende */}
          <div className="flex flex-wrap items-center gap-4 border-t border-line bg-surface2/30 px-5 py-3 text-[11px] font-semibold text-ink-500">
            {(['critical', 'risk', 'healthy'] as const).map((k) => {
              const c = RISK_META[k];
              return (
                <span key={k} className="flex items-center gap-1.5">
                  <span className="block h-3 w-3 rounded-sm border-2" style={{ background: c.fill, borderColor: c.ring }} />
                  {c.label}
                </span>
              );
            })}
            <span className="ml-auto flex items-center gap-1 text-[10px] font-medium italic text-ink-400">
              <span className="flex items-center gap-0.5"><span className="inline-block h-1.5 w-1.5 rounded-full bg-ink-500" />·<span className="inline-block h-1.5 w-1.5 rounded-full bg-ink-500" />·<span className="inline-block h-1.5 w-1.5 rounded-full bg-ink-500" /></span>
              = nombre de détenteurs
            </span>
          </div>
        </Card>

        {/* Panneau sticky */}
        <Card className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          {panelSkill ? (
            <SkillDetail skill={panelSkill} pinned={selectedSkill?.name === panelSkill.name} />
          ) : (
            <SkillsInsights spof={spof} experts={experts} totalGaps={gaps.length} />
          )}
        </Card>
      </div>

      {/* SPOF + projection */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-rose-200">
          <CardHeader
            title="Points de fragilité critiques"
            subtitle={`${spof.length} compétence(s) à 1 détenteur — bus factor critique`}
            action={<AlertTriangle size={16} className="text-rose-600" />}
          />
          <div className="space-y-2">
            {spof.map((s) => (
              <button key={s.name}
                onClick={() => setSelectedSkill(s)}
                className="flex w-full items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/40 p-3 text-left transition-colors hover:bg-rose-50/80">
                <div className="rounded-lg bg-rose-100 p-2"><AlertTriangle size={14} className="text-rose-600" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-ink">{s.name}</p>
                  <p className="text-[10px] font-medium text-ink-500">{s.domain} · niveau {s.avgLevel.toFixed(1)}/4 moyen</p>
                </div>
                <StatusPill tone="danger" dot={false}>1 détenteur</StatusPill>
                <ChevronRight size={14} className="text-ink-400" />
              </button>
            ))}
            {spof.length === 0 && <p className="rounded-xl bg-emerald-50 px-3 py-3 text-[12px] font-medium italic text-emerald-700">Aucun point critique.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Projection 18 mois"
            subtitle="Manques anticipés"
            action={<span className="inline-flex items-center gap-1.5 rounded-full border border-amber/25 bg-amber/[0.08] px-3 py-1 text-[11px] font-bold text-amber-deep"><Sparkles size={12} /> <Brand name="Proph3t" /></span>}
          />
          <div className="space-y-2">
            {gaps.map((s) => {
              const pct = Math.min(100, (s.projectedGap / 3) * 100);
              return (
                <button key={s.name}
                  onClick={() => setSelectedSkill(s)}
                  className="w-full rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:bg-amber/[0.04]">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-ink">{s.name}</span>
                    <span className="mono rounded-full bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">+{s.projectedGap}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                    <div className={cn('h-full rounded-full transition-all', s.projectedGap >= 2 ? 'bg-rose-500' : 'bg-amber-500')} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] font-medium text-ink-500">
                    {s.domain} · {s.holders} détenteur(s) · {s.projectedGap >= 2 ? 'Recrutement urgent' : 'Formation suffisante'}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ──────── Panneau sticky ──────── */

function SkillDetail({ skill, pinned }: { skill: typeof SKILLS[number]; pinned: boolean }) {
  const risk = riskLevel(skill);
  const meta = RISK_META[risk];
  const pal = DOMAIN_PALETTE[skill.domain] ?? { tint: 'bg-stone-50', border: 'border-stone-300', chip: 'bg-stone-100 text-stone-700', label: skill.domain };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', pal.chip)}>
            {pal.label}
          </span>
          <StatusPill tone={meta.pillTone} dot={false}>{meta.label}</StatusPill>
        </div>
        {pinned && <span className="rounded-full bg-amber/12 px-2 py-0.5 text-[9px] font-bold text-amber-deep">ÉPINGLÉ</span>}
      </div>

      <h3 className="text-[18px] font-semibold leading-tight text-ink">{skill.name}</h3>

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
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-deep">
          <Sparkles size={11} /> Diagnostic Proph3t
        </p>
        <p className="mt-1 text-[11px] font-medium text-ink-700">
          {risk === 'critical' && '🔴 Compétence à risque critique — un seul détenteur, transfert urgent. Identifier un binôme et lancer mentorat sous 30 jours.'}
          {risk === 'risk' && '🟠 Pénurie anticipée sous 18 mois. Combinaison formation interne + recrutement à planifier dès Q3.'}
          {risk === 'healthy' && '🟢 Couverture saine. Capitaliser sur les experts internes pour mentorer la prochaine génération.'}
        </p>
      </div>

      <div className="rounded-xl border border-amber-deep/20 bg-amber/[0.04] p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">Actions recommandées</p>
        <ul className="mt-1 space-y-0.5 text-[11px] font-medium text-ink-700">
          {risk === 'critical' && (<>
            <li>→ Identifier 2 binômes mentees sous 30 jours (M9 PDC)</li>
            <li>→ Documenter savoir critique (runbooks · vidéos · pair sessions)</li>
            <li>→ Évaluer contrat externe en backup</li>
          </>)}
          {risk === 'risk' && (<>
            <li>→ Plan formation M11 (3-6 mois)</li>
            <li>→ Ouvrir poste M5 — sourcing prioritaire</li>
            <li>→ Mentorat M10 par expert interne</li>
          </>)}
          {risk === 'healthy' && (<>
            <li>→ Maintenir suivi trimestriel</li>
            <li>→ Identifier candidats experts pour mentorat externe</li>
            <li>→ Capitaliser dans la knowledge base</li>
          </>)}
        </ul>
      </div>
    </div>
  );
}

function SkillsInsights({ spof, experts, totalGaps }: { spof: typeof SKILLS; experts: number; totalGaps: number }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-amber-deep" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">Lecture rapide</p>
        </div>
        <h3 className="mt-1 font-display text-xl leading-tight text-ink">L'écosystème en un coup d'œil</h3>
        <p className="mt-1 text-[11px] font-medium italic text-ink-500">Hover ou clic sur un hexagone pour voir le détail.</p>
      </div>

      <div className="space-y-2">
        <InsightRow icon={AlertTriangle} tone="danger" title={`${spof.length} compétences critiques`} body="SPOF · 1 détenteur unique. Plans de transfert à activer." />
        <InsightRow icon={TrendingUp} tone="warn" title={`${totalGaps} pénuries anticipées`} body="Projection 18 mois — combinaison recrutement & formation." />
        <InsightRow icon={Award} tone="success" title={`${experts} experts identifiés`} body="Niveau ≥ 3,5/4. Pool référent à valoriser." />
      </div>

      <div className="mt-auto rounded-xl bg-gradient-to-br from-amber-50/40 to-surface p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">Comment lire le Skills Cloud</p>
        <ul className="mt-1 space-y-0.5 text-[11px] font-medium text-ink-700">
          <li>• <strong>Swimlane colorée</strong> = famille de compétences</li>
          <li>• <strong>Couleur hexagone</strong> = niveau de risque</li>
          <li>• <strong>Points sous le label</strong> = nombre de détenteurs (1-5)</li>
          <li>• <strong>Pill famille en haut</strong> = filtrer la vue</li>
        </ul>
      </div>
    </div>
  );
}

function InsightRow({ icon: Icon, tone, title, body }: { icon: typeof AlertTriangle; tone: 'danger' | 'warn' | 'success'; title: string; body: string }) {
  const cls = tone === 'danger' ? 'border-rose-200 bg-rose-50/30' :
              tone === 'warn'   ? 'border-amber-200 bg-amber-50/30' :
                                  'border-emerald-200 bg-emerald-50/30';
  const iconCls = tone === 'danger' ? 'text-rose-600' :
                  tone === 'warn'   ? 'text-amber-700' :
                                      'text-emerald-600';
  return (
    <div className={cn('flex items-start gap-2 rounded-xl border p-2.5', cls)}>
      <Icon size={14} className={cn('mt-0.5 shrink-0', iconCls)} />
      <div>
        <p className="text-[12px] font-bold text-ink">{title}</p>
        <p className="text-[10px] font-medium text-ink-700">{body}</p>
      </div>
    </div>
  );
}
