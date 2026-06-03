/**
 * M9 COMPÉTENCES enrichi — Workday Skills Cloud-level.
 * 7 pages : Cartographie · Taxonomie · Gap analysis · SPOF · Heatmap
 * · Référentiel métiers · Paramètres.
 */
import { useMemo, useState } from 'react';
import {
  Grid3x3, BookOpen, AlertTriangle, ShieldAlert, Sparkles, Briefcase, Settings,
  Search, Filter, TrendingUp, TrendingDown, CheckCircle2, Eye, Users,
  Award, Network,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { CompetencesSubNav } from '../../components/competences/CompetencesSubNav';
import { EMPLOYEES, employeeName, SKILLS } from '../../data/mock';
import { cn } from '../../lib/cn';

// ────────── seed compétences × employés (cartographie matricielle)
type SkillLevel = 0 | 1 | 2 | 3 | 4 | 5;
interface SkillMatrixCell { employeeId: string; skillName: string; level: SkillLevel; targetLevel?: SkillLevel; certified?: boolean; lastAssessedAt?: string }

// Seed déterministe : chaque collab est noté sur chaque skill par un hash de leur id + skill
const SKILL_MATRIX: SkillMatrixCell[] = (() => {
  const out: SkillMatrixCell[] = [];
  for (const e of EMPLOYEES) {
    for (const s of SKILLS) {
      const seed = (e.id.charCodeAt(e.id.length - 1) + s.name.length + s.holders) % 6;
      // Affecte un niveau proche du avgLevel de la skill, perturbé par le hash
      const baseLevel = Math.min(5, Math.max(0, Math.round(s.avgLevel + (seed - 2.5) / 2)));
      // 60% des cellules seedées
      if (seed % 3 === 0 || (e.department === 'Technologie' && s.domain === 'Technologie')) {
        const targetLevel = Math.min(5, baseLevel + (s.projectedGap > 0 ? 1 : 0)) as SkillLevel;
        out.push({
          employeeId: e.id,
          skillName: s.name,
          level: baseLevel as SkillLevel,
          targetLevel,
          certified: baseLevel >= 4 && seed === 3,
          lastAssessedAt: '2026-04-15',
        });
      }
    }
  }
  return out;
})();

// ────────── Taxonomie 6 familles métiers Atlas
const SKILL_FAMILIES = [
  { code: 'TECH',  label: 'Technique',          color: 'sky',     count: SKILLS.filter((s) => s.domain === 'Technologie').length, examples: ['React/TypeScript', 'Infrastructure cloud', 'Sécurité applicative'] },
  { code: 'DATA',  label: 'Data & Analytique',  color: 'cyan',    count: SKILLS.filter((s) => s.domain === 'Data').length,        examples: ['Analyse de données', 'SQL avancé', 'Python ML'] },
  { code: 'FIN',   label: 'Finance',            color: 'emerald', count: SKILLS.filter((s) => s.domain === 'Finance').length,     examples: ['Paie SYSCOHADA', 'Contrôle de gestion', 'IFRS'] },
  { code: 'COMP',  label: 'Conformité',         color: 'rose',    count: SKILLS.filter((s) => s.domain === 'Conformité').length,  examples: ['OHADA droit travail', 'RGPD', 'Sapin 2'] },
  { code: 'SOFT',  label: 'Soft skills',        color: 'amber',   count: SKILLS.filter((s) => s.domain === 'Soft skills').length, examples: ['Management équipe', 'Négociation', 'Communication'] },
  { code: 'BIZ',   label: 'Business / Métier',  color: 'violet',  count: 0, examples: ['Stratégie produit', 'Marketing digital', 'Customer success'] },
];

// ────────── Référentiel métiers (job catalog)
interface JobRequirement {
  role: string;
  family: string;
  level: 'junior' | 'confirme' | 'senior' | 'lead' | 'manager' | 'director';
  requiredSkills: { name: string; minLevel: SkillLevel; critical: boolean }[];
}
const JOB_CATALOG: JobRequirement[] = [
  { role: 'Lead Developer', family: 'TECH', level: 'lead',
    requiredSkills: [
      { name: 'React / TypeScript', minLevel: 4, critical: true },
      { name: 'Infrastructure cloud', minLevel: 3, critical: true },
      { name: 'Sécurité applicative', minLevel: 3, critical: false },
      { name: 'Management d’équipe', minLevel: 3, critical: true },
    ] },
  { role: 'DevOps Engineer', family: 'TECH', level: 'senior',
    requiredSkills: [
      { name: 'Infrastructure cloud', minLevel: 4, critical: true },
      { name: 'Sécurité applicative', minLevel: 4, critical: true },
    ] },
  { role: 'Data Analyst', family: 'DATA', level: 'confirme',
    requiredSkills: [
      { name: 'Analyse de données', minLevel: 3, critical: true },
    ] },
  { role: 'Directrice Financière', family: 'FIN', level: 'director',
    requiredSkills: [
      { name: 'Paie SYSCOHADA', minLevel: 4, critical: true },
      { name: 'Contrôle de gestion', minLevel: 4, critical: true },
      { name: 'Conformité OHADA', minLevel: 3, critical: true },
      { name: 'Management d’équipe', minLevel: 4, critical: true },
    ] },
  { role: 'Commercial Senior', family: 'BIZ', level: 'senior',
    requiredSkills: [
      { name: 'Négociation commerciale', minLevel: 4, critical: true },
    ] },
  { role: 'Product Manager', family: 'TECH', level: 'senior',
    requiredSkills: [
      { name: 'Design produit', minLevel: 3, critical: true },
      { name: 'Analyse de données', minLevel: 3, critical: false },
    ] },
];

const LEVEL_LABEL: Record<SkillLevel, string> = { 0: '—', 1: 'Notion', 2: 'Pratique', 3: 'Maîtrise', 4: 'Expert', 5: 'Référent' };
const LEVEL_COLOR: Record<SkillLevel, string> = {
  0: 'bg-line',
  1: 'bg-amber-200',
  2: 'bg-amber-400',
  3: 'bg-sky-400',
  4: 'bg-emerald-400',
  5: 'bg-emerald-600',
};

/* ═══════════════════════════════ 1. CARTOGRAPHIE ═══════════════════════════════ */
export function CartographieCompetencesPage() {
  const [q, setQ] = useState('');
  const [domainFilter, setDomainFilter] = useState<'all' | string>('all');
  const filteredSkills = useMemo(() => SKILLS.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (domainFilter !== 'all' && s.domain !== domainFilter) return false;
    return true;
  }), [q, domainFilter]);

  return (
    <div className="animate-fade-up space-y-5">
      <CompetencesSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Cartographie compétences × collaborateurs</h1>
        <p className="text-sm font-medium text-ink-500">Matrice complète · {SKILL_MATRIX.length} cellules évaluées · {SKILLS.length} compétences × {EMPLOYEES.length} collab</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une compétence…"
              className="w-full rounded-xl border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none" />
          </div>
          <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink">
            <option value="all">Tous domaines</option>
            {Array.from(new Set(SKILLS.map((s) => s.domain))).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </Card>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="sticky left-0 z-10 bg-surface2 px-3 py-2 text-left">Compétence</th>
                {EMPLOYEES.map((e) => (
                  <th key={e.id} className="px-1 py-2 text-center font-bold" title={employeeName(e)}>
                    <div className="flex flex-col items-center gap-1">
                      <Avatar name={employeeName(e)} size="xs" />
                      <span className="mono text-[9px] text-ink-500">{e.firstName.slice(0, 3)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredSkills.map((s) => (
                <tr key={s.name} className="hover:bg-amber/[0.03]">
                  <td className="sticky left-0 z-10 bg-surface px-3 py-2"><p className="text-[12px] font-semibold text-ink">{s.name}</p><p className="text-[10px] font-medium text-ink-500">{s.domain}</p></td>
                  {EMPLOYEES.map((e) => {
                    const cell = SKILL_MATRIX.find((c) => c.employeeId === e.id && c.skillName === s.name);
                    if (!cell) return <td key={e.id} className="px-1 py-2 text-center"><div className="mx-auto h-7 w-7 rounded bg-line opacity-30" /></td>;
                    return (
                      <td key={e.id} className="px-1 py-2 text-center" title={`${employeeName(e)} : ${LEVEL_LABEL[cell.level]} (${cell.level}/5)`}>
                        <div className={cn('mx-auto flex h-7 w-7 items-center justify-center rounded text-[10px] font-bold text-white', LEVEL_COLOR[cell.level])}>
                          {cell.level}
                          {cell.certified && <Award size={8} className="ml-0.5" />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">Légende</p>
          <div className="flex flex-wrap gap-2">
            {([0, 1, 2, 3, 4, 5] as const).map((l) => (
              <span key={l} className="flex items-center gap-1 text-[11px]">
                <span className={cn('h-4 w-4 rounded text-center mono text-[9px] font-bold text-white', LEVEL_COLOR[l])}>{l}</span>
                <span className="text-ink-500">{LEVEL_LABEL[l]}</span>
              </span>
            ))}
            <span className="flex items-center gap-1 text-[11px] text-ink-500"><Award size={10} className="text-emerald-600" /> Certifié</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 2. TAXONOMIE ═══════════════════════════════ */
export function TaxonomieCompetencesPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <CompetencesSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Taxonomie des compétences — 6 familles Atlas</h1>
        <p className="text-sm font-medium text-ink-500">Référentiel structuré · alignement RH/Formation/Carrières · standard transverse 14 OHADA</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {SKILL_FAMILIES.map((f) => (
          <Card key={f.code}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="mono text-[10px] font-bold uppercase tracking-wider text-amber-deep">Famille {f.code}</p>
                <h3 className="text-[15px] font-semibold text-ink">{f.label}</h3>
                <p className="text-[11px] font-medium text-ink-500">{f.count} compétence(s) référencée(s)</p>
              </div>
              <span className={cn('mono rounded-full px-3 py-1 text-[12px] font-bold',
                f.color === 'sky'     ? 'bg-sky-100 text-sky-700' :
                f.color === 'cyan'    ? 'bg-cyan-100 text-cyan-700' :
                f.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                f.color === 'rose'    ? 'bg-rose-100 text-rose-700' :
                f.color === 'amber'   ? 'bg-amber-100 text-amber-700' :
                                        'bg-violet-100 text-violet-700')}>
                {f.count}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Exemples</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {f.examples.map((ex) => <StatusPill key={ex} tone="neutral" dot={false}>{ex}</StatusPill>)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Méthode Atlas — gouvernance taxonomie" subtitle="Révision annuelle COMEX · ajustement trimestriel équipes" action={<Network size={16} className="text-amber-deep" />} />
        <ul className="space-y-1.5 text-[12px] font-medium text-ink-700">
          <li>• Chaque <strong>nouvelle compétence</strong> proposée par un manager → revue mensuelle Chargé Performance.</li>
          <li>• <strong>Validation Comex</strong> annuelle des familles + sous-familles.</li>
          <li>• Alignement avec <strong>O*NET</strong> et <strong>ESCO</strong> (référentiels internationaux) quand applicable.</li>
          <li>• Compétences <strong>obsolètes</strong> archivées (mais conservées dans l'historique des évaluations).</li>
          <li>• Mapping vers <strong>M11 Formation</strong> : chaque compétence pointe vers ≥ 1 parcours de développement.</li>
        </ul>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 3. GAP ANALYSIS ═══════════════════════════════ */
export function GapAnalysisPage() {
  // Compute employee-vs-required gap per job role
  const employeeGaps = useMemo(() => {
    return EMPLOYEES.map((e) => {
      // Match role to closest JOB_CATALOG entry
      const job = JOB_CATALOG.find((j) => e.role.toLowerCase().includes(j.role.toLowerCase().split(' ')[0]))
                 ?? JOB_CATALOG.find((j) => j.family === 'TECH' && e.department === 'Technologie')
                 ?? JOB_CATALOG[0];
      const gaps = job.requiredSkills.map((req) => {
        const owned = SKILL_MATRIX.find((c) => c.employeeId === e.id && c.skillName === req.name);
        const actual = owned?.level ?? 0;
        return { ...req, actual, gap: req.minLevel - actual };
      });
      const totalGap = gaps.reduce((s, g) => s + Math.max(0, g.gap), 0);
      const criticalGaps = gaps.filter((g) => g.critical && g.gap > 0).length;
      return { emp: e, job, gaps, totalGap, criticalGaps };
    });
  }, []);

  return (
    <div className="animate-fade-up space-y-5">
      <CompetencesSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Gap analysis — compétences requises vs réelles</h1>
        <p className="text-sm font-medium text-ink-500">Pour chaque collaborateur : écart entre niveau attendu de son poste et niveau évalué</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Collab. avec gap" value={String(employeeGaps.filter((eg) => eg.totalGap > 0).length)} unit="à équiper" icon={AlertTriangle} tone="amber" />
        <StatCard label="Gaps critiques" value={String(employeeGaps.reduce((s, eg) => s + eg.criticalGaps, 0))} unit="poste-clé" icon={ShieldAlert} tone="amber" />
        <StatCard label="Gap moyen" value={(employeeGaps.reduce((s, eg) => s + eg.totalGap, 0) / employeeGaps.length).toFixed(1)} unit="niveau" icon={TrendingDown} />
        <StatCard label="Couverture" value={`${Math.round(((employeeGaps.length - employeeGaps.filter((eg) => eg.criticalGaps > 0).length) / employeeGaps.length) * 100)} %`} unit="postes OK" icon={CheckCircle2} />
      </div>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Poste rattaché</th>
              <th className="px-3 py-2 text-center">Skills requises</th>
              <th className="px-3 py-2 text-center">Gaps</th>
              <th className="px-3 py-2 text-center">Gaps critiques</th>
              <th className="px-3 py-2 text-left">Détail</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {employeeGaps.map((eg) => (
                <tr key={eg.emp.id} className={cn('hover:bg-amber/[0.03]', eg.criticalGaps > 0 && 'bg-rose-50/30')}>
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={employeeName(eg.emp)} size="xs" /><div><p className="text-[12px] font-semibold text-ink">{employeeName(eg.emp)}</p><p className="text-[10px] font-medium text-ink-500">{eg.emp.role}</p></div></div></td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{eg.job.role} <span className="text-ink-500">({eg.job.level})</span></td>
                  <td className="px-3 py-2 mono text-center text-[11px]">{eg.job.requiredSkills.length}</td>
                  <td className="px-3 py-2 mono text-center text-[11px] font-bold">{eg.totalGap}</td>
                  <td className="px-3 py-2 text-center"><StatusPill tone={eg.criticalGaps === 0 ? 'success' : eg.criticalGaps > 1 ? 'danger' : 'warn'} dot={false}>{eg.criticalGaps}</StatusPill></td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {eg.gaps.filter((g) => g.gap > 0).slice(0, 3).map((g) => (
                        <StatusPill key={g.name} tone={g.critical ? 'danger' : 'warn'} dot={false}>
                          {g.name.split(' ')[0]} −{g.gap}
                        </StatusPill>
                      ))}
                      {eg.gaps.filter((g) => g.gap > 0).length > 3 && <span className="text-[10px] text-ink-500">+{eg.gaps.filter((g) => g.gap > 0).length - 3}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 4. SPOF (Single Point of Failure) ═══════════════════════════════ */
export function SpofPage() {
  const spofs = SKILLS.map((s) => {
    const holders = SKILL_MATRIX.filter((c) => c.skillName === s.name && c.level >= 3);
    return { skill: s, holders, count: holders.length };
  }).filter((s) => s.count <= 1).sort((a, b) => a.count - b.count);

  return (
    <div className="animate-fade-up space-y-5">
      <CompetencesSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Compétences critiques — Single Point of Failure</h1>
        <p className="text-sm font-medium text-ink-500">Compétences avec ≤ 1 collaborateur de niveau Maîtrise+ · risque bus factor</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="SPOF identifiés" value={String(spofs.length)} unit="compétences à risque" icon={ShieldAlert} tone="amber" />
        <StatCard label="SPOF zéro détenteur" value={String(spofs.filter((s) => s.count === 0).length)} unit="compétence orpheline" icon={AlertTriangle} tone={spofs.filter((s) => s.count === 0).length > 0 ? 'amber' : 'default'} />
        <StatCard label="SPOF 1 détenteur" value={String(spofs.filter((s) => s.count === 1).length)} unit="bus factor 1" icon={Users} />
        <StatCard label="Plan de mitigation" value="0" unit="en cours" icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader title="Plan de mitigation recommandé" subtitle="Atlas — méthodologie 3 actions par SPOF" action={<Sparkles size={16} className="text-amber-deep" />} />
        <ul className="space-y-1.5 text-[12px] font-medium text-ink-700">
          <li>1. <strong>Identifier un binôme</strong> de niveau 1-2 à monter en niveau 3+ via M11 Formation (12-18 mois).</li>
          <li>2. <strong>Documenter le savoir</strong> dans une knowledge base (runbooks, vidéos, pair programming).</li>
          <li>3. <strong>Diversifier l'externe</strong> : contrat de support tiers en backup pour compétences critiques.</li>
        </ul>
      </Card>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Compétence</th>
              <th className="px-3 py-2 text-center">Domaine</th>
              <th className="px-3 py-2 text-center">Détenteur(s) niveau 3+</th>
              <th className="px-3 py-2 text-left">Qui</th>
              <th className="px-3 py-2 text-center">Gap projeté 18 m</th>
              <th className="px-3 py-2 text-center">Sévérité</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {spofs.map((s) => {
                const holders = s.holders.map((h) => EMPLOYEES.find((e) => e.id === h.employeeId)).filter(Boolean) as typeof EMPLOYEES;
                const sev = s.count === 0 ? 'critical' : s.skill.projectedGap >= 2 ? 'high' : 'medium';
                return (
                  <tr key={s.skill.name} className="hover:bg-amber/[0.03]">
                    <td className="px-3 py-2 text-[12px] font-semibold text-ink">{s.skill.name}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone="neutral" dot={false}>{s.skill.domain}</StatusPill></td>
                    <td className="px-3 py-2 mono text-center text-[14px] font-bold text-amber-deep">{s.count}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {holders.length === 0 ? <span className="text-[11px] italic text-rose-600">Aucun détenteur</span> :
                          holders.map((h) => <span key={h.id} className="flex items-center gap-1 text-[11px] text-ink-700"><Avatar name={employeeName(h)} size="xs" />{employeeName(h)}</span>)}
                      </div>
                    </td>
                    <td className="px-3 py-2 mono text-center text-[11px]">+{s.skill.projectedGap}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={sev === 'critical' ? 'danger' : sev === 'high' ? 'warn' : 'info'} dot={false}>{sev}</StatusPill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 5. HEATMAP ═══════════════════════════════ */
export function HeatmapCompetencesPage() {
  const departmentSkillAvg = useMemo(() => {
    const depts = Array.from(new Set(EMPLOYEES.map((e) => e.department)));
    return depts.map((dept) => {
      const cells = SKILLS.map((s) => {
        const empsInDept = EMPLOYEES.filter((e) => e.department === dept);
        const matches = SKILL_MATRIX.filter((c) => empsInDept.some((e) => e.id === c.employeeId) && c.skillName === s.name);
        const avg = matches.length === 0 ? 0 : matches.reduce((sum, c) => sum + c.level, 0) / matches.length;
        return { skill: s.name, avg, count: matches.length };
      });
      return { dept, cells };
    });
  }, []);

  return (
    <div className="animate-fade-up space-y-5">
      <CompetencesSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Heatmap compétences × départements</h1>
        <p className="text-sm font-medium text-ink-500">Niveau moyen par croisement · identifier zones fortes/faibles instantanément</p>
      </div>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="sticky left-0 z-10 bg-surface2 px-3 py-2 text-left">Compétence</th>
              {departmentSkillAvg.map((d) => (
                <th key={d.dept} className="px-3 py-2 text-center" title={d.dept}>
                  <span className="text-[10px] font-bold">{d.dept.length > 12 ? d.dept.slice(0, 12) + '…' : d.dept}</span>
                </th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-line">
              {SKILLS.map((s) => (
                <tr key={s.name} className="hover:bg-amber/[0.03]">
                  <td className="sticky left-0 z-10 bg-surface px-3 py-2"><p className="text-[12px] font-semibold text-ink">{s.name}</p><p className="text-[10px] font-medium text-ink-500">{s.domain}</p></td>
                  {departmentSkillAvg.map((d) => {
                    const cell = d.cells.find((c) => c.skill === s.name);
                    if (!cell || cell.count === 0) return <td key={d.dept} className="px-3 py-2 text-center text-[10px] text-ink-300">—</td>;
                    const intensity = cell.avg / 5;
                    return (
                      <td key={d.dept} className="p-1 text-center">
                        <div className="mx-auto flex h-12 w-full max-w-[80px] flex-col items-center justify-center rounded text-white"
                          style={{ backgroundColor: `rgba(201, 126, 18, ${0.15 + intensity * 0.75})` }}>
                          <span className="mono text-[14px] font-bold">{cell.avg.toFixed(1)}</span>
                          <span className="text-[8px] opacity-75">{cell.count} collab</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">Intensité couleur = niveau moyen 0-5</p>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 6. RÉFÉRENTIEL MÉTIERS ═══════════════════════════════ */
export function ReferentielMetiersPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <CompetencesSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Référentiel métiers — job catalog</h1>
        <p className="text-sm font-medium text-ink-500">{JOB_CATALOG.length} métiers cartographiés · compétences requises · niveaux cibles · criticité</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {JOB_CATALOG.map((j) => (
          <Card key={j.role}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="mono text-[10px] font-bold uppercase tracking-wider text-amber-deep">{j.family} · {j.level}</p>
                <h3 className="text-[14px] font-semibold text-ink">{j.role}</h3>
                <p className="text-[11px] font-medium text-ink-500">{j.requiredSkills.length} compétences requises · {j.requiredSkills.filter((s) => s.critical).length} critiques</p>
              </div>
              <Briefcase size={20} className="text-amber-deep" />
            </div>
            <table className="mt-3 w-full text-sm">
              <thead><tr className="border-y border-line bg-surface2/40 text-[9px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-2 py-1 text-left">Compétence</th>
                <th className="px-2 py-1 text-center">Min</th>
                <th className="px-2 py-1 text-center">Critique</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {j.requiredSkills.map((s) => (
                  <tr key={s.name}>
                    <td className="px-2 py-1 text-[11px] font-medium text-ink-700">{s.name}</td>
                    <td className="px-2 py-1 text-center"><span className={cn('mono inline-block h-5 w-5 rounded text-center text-[10px] font-bold text-white', LEVEL_COLOR[s.minLevel])}>{s.minLevel}</span></td>
                    <td className="px-2 py-1 text-center">{s.critical ? <CheckCircle2 size={12} className="mx-auto text-rose-600" /> : <span className="text-ink-400">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════ 7. PARAMÈTRES ═══════════════════════════════ */
export function ParametresCompetencesPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <CompetencesSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Paramètres Compétences</h1>
        <p className="text-sm font-medium text-ink-500">Échelle niveaux · familles · gouvernance · intégrations</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Échelle de niveaux Atlas" subtitle="6 niveaux 0-5 standardisés" action={<Eye size={16} className="text-amber-deep" />} />
          <ul className="space-y-1">
            {([0, 1, 2, 3, 4, 5] as const).map((l) => (
              <li key={l} className="flex items-center gap-3 rounded-lg bg-surface2/40 px-3 py-2">
                <span className={cn('mono flex h-6 w-6 items-center justify-center rounded text-[12px] font-bold text-white', LEVEL_COLOR[l])}>{l}</span>
                <span className="flex-1 text-[12px] font-semibold text-ink">{LEVEL_LABEL[l]}</span>
                <span className="text-[10px] font-medium italic text-ink-500">
                  {l === 0 && 'Non concerné'}
                  {l === 1 && 'Concepts de base, supervisé'}
                  {l === 2 && 'Autonome sur tâches simples'}
                  {l === 3 && 'Autonome sur tâches complexes'}
                  {l === 4 && 'Référent interne · forme les autres'}
                  {l === 5 && 'Référent marché · publications · conférences'}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Intégrations cross-modules" subtitle="Flux de données automatiques" action={<Network size={16} className="text-amber-deep" />} />
          <ul className="space-y-1.5">
            {[
              { from: 'M9', to: 'M8 Évaluations', desc: 'Dimension 2 (25 % du score) alimentée par cartographie' },
              { from: 'M9', to: 'M10 Carrières', desc: 'Cartographie compétences nourrit les trajectoires' },
              { from: 'M11', to: 'M9', desc: 'Formations terminées → uplift compétences automatique' },
              { from: 'M5', to: 'M9', desc: 'Job catalog M9 alimente les besoins poste pour scoring candidat' },
              { from: 'M7', to: 'M9', desc: 'OKR techniques contribuent à monter le niveau compétence' },
            ].map((i, idx) => (
              <li key={idx} className="rounded-lg bg-surface2/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  <StatusPill tone="info" dot={false}>{i.from}</StatusPill>
                  <span className="text-[10px] text-ink-400">→</span>
                  <StatusPill tone="success" dot={false}>{i.to}</StatusPill>
                </div>
                <p className="mt-1 text-[11px] font-medium text-ink-700">{i.desc}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Filtres & menus rapides" subtitle="Configuration tenant" action={<Filter size={16} className="text-amber-deep" />} />
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Réeval. cadence</p>
              <p className="mono mt-1 text-[16px] font-bold text-ink">12 mois</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">SPOF seuil</p>
              <p className="mono mt-1 text-[16px] font-bold text-ink">≤ 1 détenteur</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Niveau Maîtrise</p>
              <p className="mono mt-1 text-[16px] font-bold text-ink">≥ 3/5</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Certif. expire</p>
              <p className="mono mt-1 text-[16px] font-bold text-ink">90 jours</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Gouvernance compétences" subtitle="Process de révision" />
          <ul className="space-y-1.5 text-[11px] font-medium text-ink-700">
            <li>• <strong>Validation manager</strong> trimestrielle (niveau collaborateur vs auto-déclaration).</li>
            <li>• <strong>Audit Chargé Performance</strong> semestriel (cohérence familles + détection skill drift).</li>
            <li>• <strong>Approbation Comex</strong> annuelle (ajout/retrait familles, ajustement référentiel métiers).</li>
            <li>• <strong>Pulse 360°</strong> peer-validated niveaux pour collab seniors (niveau ≥ 4).</li>
            <li>• <strong>Conservation 5 ans</strong> historique évaluations compétences (alignement OHADA paie).</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
