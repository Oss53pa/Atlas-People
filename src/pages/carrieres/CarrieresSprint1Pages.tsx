/**
 * M10 CARRIÈRES — Sprint 1 selon spec officielle CARRIERE.zip.
 * 6 pages : Job Architecture · Talent Review · Talent Pools · Promotions
 * · Alumni & Boomerang · Audit M10.
 */
import { useMemo, useState } from 'react';
import {
  Building2, Grid3x3, Sparkles, Award, TrendingUp, Users, ArrowUpRight,
  Crown, Heart, Network, Lock, Shield, ShieldAlert, AlertCircle,
  CheckCircle2, AlertTriangle, Briefcase, Eye, Calendar, ArrowRight,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { CarrieresSubNav } from '../../components/carrieres/CarrieresSubNav';
import { employeeName } from '../../data/mock';
import { useRoster } from '../../lib/m1/roster';
import { cn } from '../../lib/cn';

/* ═══════════════ 1. JOB ARCHITECTURE ═══════════════ */
export function JobArchitecturePage() {
  const families = [
    { code: 'TECH-ENG',  label: 'Engineering',          tracks: ['Management', 'Expert', 'Specialist'], count: 32 },
    { code: 'TECH-PROD', label: 'Product',              tracks: ['Management', 'Expert'],               count: 14 },
    { code: 'COMMERCIAL',label: 'Commercial',           tracks: ['Management', 'Expert'],               count: 24 },
    { code: 'MARKETING', label: 'Marketing',            tracks: ['Management', 'Expert'],               count: 12 },
    { code: 'CS',        label: 'Customer Success',     tracks: ['Management', 'Expert'],               count: 10 },
    { code: 'OPS',       label: 'Operations',           tracks: ['Management', 'Expert'],               count: 18 },
    { code: 'FIN',       label: 'Finance & Compta',     tracks: ['Management', 'Expert'],               count: 14 },
    { code: 'RH',        label: 'Ressources Humaines',  tracks: ['Management', 'Expert'],               count: 10 },
    { code: 'LEGAL',     label: 'Juridique & Compliance', tracks: ['Management', 'Expert'],             count: 6 },
  ];
  const levels = [
    { code: 'P1', name: 'Trainee',                 grades: ['P1a','P1b'],         band: '350k - 500k' },
    { code: 'P2', name: 'Junior',                  grades: ['P2a','P2b','P2c'],   band: '500k - 750k' },
    { code: 'P3', name: 'Confirmé',                grades: ['P3a','P3b','P3c'],   band: '750k - 1,1M' },
    { code: 'P4', name: 'Senior',                  grades: ['P4a','P4b','P4c'],   band: '1,1M - 1,6M' },
    { code: 'P5', name: 'Lead / Principal',        grades: ['P5a','P5b','P5c'],   band: '1,6M - 2,2M' },
    { code: 'P6', name: 'Staff / Manager',         grades: ['P6a','P6b','P6c'],   band: '2,2M - 3,0M' },
    { code: 'P7', name: 'Senior Staff / Director', grades: ['P7a','P7b','P7c'],   band: '3,0M - 4,0M' },
    { code: 'P8', name: 'Principal / VP',          grades: ['P8a','P8b'],         band: '4,0M - 5,5M' },
    { code: 'P9', name: 'Fellow / SVP',            grades: ['P9'],                band: '5,5M+' },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Job Architecture — 9 familles · 9 niveaux · 27 grades</h1>
        <p className="text-sm font-medium text-ink-500">Référentiel commun · dual-track Management + Expert · ~135 échelons salariaux · révision annuelle Comex</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Familles métier" value={String(families.length)} unit="catalog vivant" icon={Briefcase} />
        <StatCard label="Niveaux" value={String(levels.length)} unit="P1 → P9" icon={Building2} />
        <StatCard label="Grades" value="27" unit="P1a → P9" icon={Grid3x3} />
        <StatCard label="Postes mappés" value={String(families.reduce((s, f) => s + f.count, 0))} unit="catalogue" icon={Users} />
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Échelle de niveaux" subtitle="9 niveaux × 3 tracks (Management · Expert · Specialist) · bandes salariales FCFA" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Nom du niveau</th>
              <th className="px-3 py-2 text-left">Grades</th>
              <th className="px-3 py-2 text-right">Bande salariale (FCFA / mois)</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {levels.map((l) => (
                <tr key={l.code} className="hover:bg-amber/[0.03]">
                  <td className="px-3 py-2 mono text-[12px] font-bold text-amber-deep">{l.code}</td>
                  <td className="px-3 py-2 text-[12px] font-semibold text-ink">{l.name}</td>
                  <td className="px-3 py-2"><div className="flex flex-wrap gap-1">{l.grades.map((g) => <StatusPill key={g} tone="neutral" dot={false}>{g}</StatusPill>)}</div></td>
                  <td className="px-3 py-2 mono text-right text-[11px] font-bold">{l.band}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="9 familles métier" subtitle="Tracks disponibles par famille — dual-track standard" action={<Network size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {families.map((f) => (
            <div key={f.code} className="rounded-xl bg-surface2/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-ink">{f.label}</p>
                <span className="mono text-[10px] font-bold text-amber-deep">{f.code}</span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-ink-500">{f.count} postes</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {f.tracks.map((t) => <StatusPill key={t} tone={t === 'Management' ? 'info' : t === 'Expert' ? 'success' : 'warn'} dot={false}>{t}</StatusPill>)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════ 2. TALENT REVIEW ═══════════════ */
export function TalentReviewPage() {
  const workshops = [
    { level: 'Direction Tech',     date: '2026-11-26', duration: '3h', participants: 6,  candidates: 22, hipoFlagged: 3 },
    { level: 'Direction Commercial', date: '2026-11-27', duration: '3h', participants: 5,  candidates: 18, hipoFlagged: 2 },
    { level: 'Direction Finance',  date: '2026-11-28', duration: '2h', participants: 4,  candidates: 14, hipoFlagged: 1 },
    { level: 'Comex (entreprise)', date: '2026-12-08', duration: '5h', participants: 8,  candidates: 12, hipoFlagged: 6 },
  ];
  const nineBox = [
    [{ label: 'A1 Talent à risque',  count: 0, tone: 'danger' },  { label: 'A2 Top Talent confirmé', count: 1, tone: 'warn' },   { label: 'A3 Top Talent',         count: 3, tone: 'success' }],
    [{ label: 'B1 Effort requis',    count: 1, tone: 'warn' },    { label: 'B2 Core',               count: 5, tone: 'info' },    { label: 'B3 High Potential',     count: 2, tone: 'success' }],
    [{ label: 'C1 Underperformer',   count: 1, tone: 'danger' },  { label: 'C2 Solid contributor',  count: 1, tone: 'info' },    { label: 'C3 Expert technique',   count: 0, tone: 'neutral' }],
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Talent Review annuel</h1>
          <p className="text-sm font-medium text-ink-500">Workshops Comex + Directions · 9-box enriched · identification HiPo · plans succession</p>
        </div>
        <Button size="sm"><Calendar size={14} /> Planifier workshop</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Workshops planifiés" value={String(workshops.length)} unit="cycle 2026" icon={Calendar} />
        <StatCard label="Candidats revus" value={String(workshops.reduce((s, w) => s + w.candidates, 0))} unit="couverture 100 %" icon={Users} />
        <StatCard label="HiPo identifiés" value={String(workshops.reduce((s, w) => s + w.hipoFlagged, 0))} unit="6 % effectif" icon={Sparkles} />
        <StatCard label="Top Talents (A3)" value="3" unit="zone élite" icon={Crown} />
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="9-box enriched — distribution actuelle" subtitle="Performance × Potentiel · cliquer chaque case pour voir les profils" className="mb-0" /></div>
        <div className="grid grid-cols-3 gap-2 p-5 pt-0">
          {nineBox.map((row, ri) =>
            row.map((cell, ci) => (
              <div key={`${ri}-${ci}`} className={cn('rounded-xl border-2 p-3 text-center transition-colors hover:scale-105',
                cell.tone === 'success' ? 'border-emerald-300 bg-emerald-50/40' :
                cell.tone === 'info'    ? 'border-sky-300 bg-sky-50/40' :
                cell.tone === 'warn'    ? 'border-amber-300 bg-amber-50/40' :
                cell.tone === 'danger'  ? 'border-rose-300 bg-rose-50/40' :
                                          'border-line bg-surface2/40')}>
                <p className="mono text-[28px] font-bold text-ink">{cell.count}</p>
                <p className="mt-1 text-[11px] font-semibold text-ink">{cell.label}</p>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-line p-3 text-[10px] font-medium text-ink-500">
          ↓ Performance · → Potentiel · Top Talents (A3) = HiPo + Hi-Perf · Underperformers (C1) = plan accompagnement
        </div>
      </Card>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Workshops Talent Review" subtitle={`${workshops.length} sessions programmées · 2 niveaux (direction + Comex)`} className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Workshop</th>
              <th className="px-3 py-2 text-center">Date</th>
              <th className="px-3 py-2 text-center">Durée</th>
              <th className="px-3 py-2 text-center">Participants</th>
              <th className="px-3 py-2 text-center">Candidats</th>
              <th className="px-3 py-2 text-center">HiPo flag</th>
              <th className="px-3 py-2 text-right" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {workshops.map((w, i) => (
                <tr key={i} className="hover:bg-amber/[0.03]">
                  <td className="px-3 py-2 text-[12px] font-semibold text-ink">{w.level}</td>
                  <td className="px-3 py-2 mono text-center text-[11px]">{w.date}</td>
                  <td className="px-3 py-2 mono text-center text-[11px]">{w.duration}</td>
                  <td className="px-3 py-2 mono text-center text-[11px]">{w.participants}</td>
                  <td className="px-3 py-2 mono text-center text-[11px]">{w.candidates}</td>
                  <td className="px-3 py-2 text-center"><StatusPill tone={w.hipoFlagged >= 3 ? 'success' : 'info'} dot={false}>{w.hipoFlagged}</StatusPill></td>
                  <td className="px-3 py-2 text-right"><Button variant="ghost" size="sm">Dossier <ArrowUpRight size={12} /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════ 3. TALENT POOLS ═══════════════ */
export function TalentPoolsPage() {
  const pools = [
    { code: 'HIPO',        label: 'Hauts Potentiels',  members: 6, color: 'emerald', desc: 'Performance + potentiel élevés · prochaine génération leaders',
      programmes: ['Leadership Excellence (18 mois)', 'Mentorat dirigeant', 'Mission cross-direction'] },
    { code: 'FUTURS_L',    label: 'Futurs Leaders',    members: 8, color: 'sky',     desc: 'Potentiel managérial confirmé · feeder pool',
      programmes: ['Next Managers Program (12 mois)', 'Shadowing Directeur', 'Coaching 360°'] },
    { code: 'EXPERTS',     label: 'Experts Référents', members: 4, color: 'amber',   desc: 'Niveau 5 sur compétences critiques · garants techniques',
      programmes: ['Expert Track (24 mois)', 'Conférences externes', 'Brevets / publications'] },
    { code: 'SUCCESSEURS', label: 'Successeurs identifiés', members: 12, color: 'violet', desc: 'Successeurs nominés sur postes critiques',
      programmes: ['Plan succession individuel', 'Shadowing 6 mois', 'Mission stratégique 90 j'] },
    { code: 'DIVERSITE',   label: 'Diversité & Inclusion', members: 5, color: 'rose',  desc: 'Programmes spécifiques équité représentation',
      programmes: ['Mentoring inversé', 'Réseau diversité', 'Visibilité Comex'] },
    { code: 'JEUNES',      label: 'Jeunes Talents',    members: 7, color: 'cyan',    desc: '< 30 ans · sortie école · onboarding accéléré',
      programmes: ['Graduate Program (18 mois)', 'Rotation 3 BU', 'Buddy senior'] },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Talent Pools structurés</h1>
        <p className="text-sm font-medium text-ink-500">{pools.length} pools dédiés · budget alloué par programme · membership renouvelée annuellement post talent review</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pools actifs" value={String(pools.length)} unit="programmes structurés" icon={Users} />
        <StatCard label="Membres uniques" value={String(pools.reduce((s, p) => s + p.members, 0))} unit="≈ 42 % effectif" icon={Sparkles} />
        <StatCard label="Programmes" value={String(pools.reduce((s, p) => s + p.programmes.length, 0))} unit="parcours dédiés" icon={TrendingUp} />
        <StatCard label="Investissement annuel" value="48 M" unit="FCFA budget pools" icon={Award} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pools.map((p) => (
          <Card key={p.code}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="mono text-[10px] font-bold uppercase tracking-wider text-amber-deep">{p.code}</p>
                <h3 className="text-[14px] font-semibold text-ink">{p.label}</h3>
              </div>
              <span className={cn('mono rounded-full px-3 py-1 text-[14px] font-bold',
                p.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                p.color === 'sky'     ? 'bg-sky-100 text-sky-700' :
                p.color === 'amber'   ? 'bg-amber-100 text-amber-700' :
                p.color === 'violet'  ? 'bg-violet-100 text-violet-700' :
                p.color === 'rose'    ? 'bg-rose-100 text-rose-700' :
                                        'bg-cyan-100 text-cyan-700')}>
                {p.members}
              </span>
            </div>
            <p className="mt-2 text-[11px] font-medium italic text-ink-500">{p.desc}</p>
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Programmes dédiés</p>
              <ul className="mt-1 space-y-0.5">
                {p.programmes.map((prg, i) => <li key={i} className="text-[11px] font-medium text-ink-700">→ {prg}</li>)}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ 4. PROMOTIONS ═══════════════ */
export function PromotionsPage() {
  const roster = useRoster();
  const promos = [
    { ref: 'PRO-2026-0008', emp: roster[1], from: 'Lead Developer (P5b)', to: 'Staff Engineer (P6a)', amount: 320000, status: 'comite_pending' as const, manager: roster[0] },
    { ref: 'PRO-2026-0007', emp: roster[3], from: 'Commercial Senior (P4c)', to: 'Sales Lead (P5a)', amount: 280000, status: 'validated' as const, manager: roster[12] },
    { ref: 'PRO-2026-0006', emp: roster[10], from: 'Customer Success (P3b)', to: 'CS Senior (P4a)', amount: 180000, status: 'comite_approved' as const, manager: roster[3] },
    { ref: 'PRO-2026-0005', emp: roster[7], from: 'DevOps Engineer (P4b)', to: 'Senior DevOps (P5a)', amount: 260000, status: 'communicated' as const, manager: roster[1] },
    { ref: 'PRO-2026-0004', emp: roster[5], from: 'Comptable (P2c)', to: 'Senior Accountant (P3a)', amount: 150000, status: 'contested' as const, manager: roster[0] },
  ];
  const statusMeta = {
    comite_pending:   { label: 'Comité en attente',     tone: 'warn' as const },
    comite_approved:  { label: 'Approuvée comité',      tone: 'info' as const },
    validated:        { label: 'Validée',               tone: 'success' as const },
    communicated:     { label: 'Communiquée',           tone: 'success' as const },
    contested:        { label: 'Contestée',             tone: 'danger' as const },
  };
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Promotions — process Comité Carrières</h1>
          <p className="text-sm font-medium text-ink-500">Workflow structuré · proposition manager → Comité Carrières → validation Comex → communication → contestation possible</p>
        </div>
        <Button size="sm"><TrendingUp size={14} /> Nouvelle promotion</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Promotions cycle N" value={String(promos.length)} unit="≈ 8 % effectif" icon={TrendingUp} />
        <StatCard label="En attente comité" value={String(promos.filter((p) => p.status === 'comite_pending').length)} unit="à arbitrer" icon={AlertTriangle} tone="amber" />
        <StatCard label="Contestations" value={String(promos.filter((p) => p.status === 'contested').length)} unit="à traiter" icon={ShieldAlert} tone="amber" />
        <StatCard label="Impact masse salariale" value="14,5 M" unit="FCFA / an" icon={Award} />
      </div>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Réf</th>
              <th className="px-3 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">De → Vers</th>
              <th className="px-3 py-2 text-right">Aug. salaire / mois</th>
              <th className="px-3 py-2 text-left">Manager proposant</th>
              <th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {promos.map((p) => {
                const m = statusMeta[p.status];
                return (
                  <tr key={p.ref} className="hover:bg-amber/[0.03]">
                    <td className="px-3 py-2 mono text-[10px] font-bold text-ink-500">{p.ref}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={employeeName(p.emp)} size="xs" /><span className="text-[12px] font-semibold text-ink">{employeeName(p.emp)}</span></div></td>
                    <td className="px-3 py-2"><p className="text-[11px] font-medium text-ink-500">{p.from}</p><p className="text-[11px] font-semibold text-amber-deep">→ {p.to}</p></td>
                    <td className="px-3 py-2 mono text-right text-[12px] font-bold text-emerald-600">+{Math.round(p.amount / 1000)}k</td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{employeeName(p.manager)}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={m.tone} dot={false}>{m.label}</StatusPill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Workflow Comité Carrières" subtitle="6 étapes structurées · garde-fous anti-favoritisme" action={<Crown size={16} className="text-amber-deep" />} />
        <ol className="space-y-2 text-[12px] font-medium text-ink-700">
          <li className="flex items-start gap-3 rounded-xl bg-surface2/40 p-3"><span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-deep text-[11px] font-bold text-white">1</span><span><strong>Manager propose</strong> : dossier (3 ans perf · compétences · ambition · impact). Pas d'auto-promotion.</span></li>
          <li className="flex items-start gap-3 rounded-xl bg-surface2/40 p-3"><span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-deep text-[11px] font-bold text-white">2</span><span><strong>Directeur valide</strong> : alignement stratégie + budget direction + cohérence niveau.</span></li>
          <li className="flex items-start gap-3 rounded-xl bg-surface2/40 p-3"><span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-deep text-[11px] font-bold text-white">3</span><span><strong>Comité Carrières</strong> (DG + DRH + Directeurs) : 4 critères évaluation · vote majorité 2/3 · trace décisions.</span></li>
          <li className="flex items-start gap-3 rounded-xl bg-surface2/40 p-3"><span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-deep text-[11px] font-bold text-white">4</span><span><strong>Validation Comex</strong> finale + signature ADVIST.</span></li>
          <li className="flex items-start gap-3 rounded-xl bg-surface2/40 p-3"><span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-deep text-[11px] font-bold text-white">5</span><span><strong>Communication</strong> annonce officielle + push M3 paie (avenant M4 auto-généré).</span></li>
          <li className="flex items-start gap-3 rounded-xl bg-surface2/40 p-3"><span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-deep text-[11px] font-bold text-white">6</span><span><strong>Contestation</strong> possible (3 mois) : médiation DRH + DG si nécessaire.</span></li>
        </ol>
      </Card>
    </div>
  );
}

/* ═══════════════ 5. ALUMNI & BOOMERANG ═══════════════ */
export function AlumniPage() {
  const alumni = [
    { name: 'Sylvain Achi',      role: 'Ex Senior Dev',  exitYear: 2023, currentCompany: 'Wave Mobile', boomerangCandidate: true,  reason: 'Démission · meilleure opportunité' },
    { name: 'Aïssata Touré',     role: 'Ex Lead Product', exitYear: 2024, currentCompany: 'Jumia',        boomerangCandidate: true,  reason: 'Mobilité internationale' },
    { name: 'Patrick Ngomo',     role: 'Ex DevOps',       exitYear: 2024, currentCompany: 'Andela',       boomerangCandidate: true,  reason: 'Démission' },
    { name: 'Mariem Diakité',    role: 'Ex CSM Senior',   exitYear: 2022, currentCompany: 'BMS Bank',     boomerangCandidate: false, reason: 'Fin de CDD' },
    { name: 'Karim Sangaré',     role: 'Ex Comptable',    exitYear: 2025, currentCompany: 'PwC',          boomerangCandidate: true,  reason: 'Évolution carrière externe' },
    { name: 'Fatoumata Cissé',   role: 'Ex Marketing',    exitYear: 2023, currentCompany: 'Orange',       boomerangCandidate: false, reason: 'Reconversion' },
  ];
  const boomerangs = alumni.filter((a) => a.boomerangCandidate);
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Alumni Network &amp; Boomerang Hires</h1>
          <p className="text-sm font-medium text-ink-500">Réseau ex-collaborateurs entretenu · candidats boomerang prioritaires en recrutement · politique d'invitation événements</p>
        </div>
        <Button size="sm"><Heart size={14} /> Inviter événement</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Alumni connus" value={String(alumni.length)} unit="dans la base" icon={Users} />
        <StatCard label="Candidats boomerang" value={String(boomerangs.length)} unit="re-recrutables" icon={Heart} tone="default" />
        <StatCard label="Boomerang hires N-2" value="2" unit="réintégrations" icon={ArrowRight} />
        <StatCard label="Économie recrutement" value="3,8 M" unit="FCFA évités N-1" icon={Award} />
      </div>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Alumni</th>
              <th className="px-3 py-2 text-left">Rôle Atlas</th>
              <th className="px-3 py-2 text-center">Sortie</th>
              <th className="px-3 py-2 text-left">Actuellement</th>
              <th className="px-3 py-2 text-left">Raison du départ</th>
              <th className="px-3 py-2 text-center">Boomerang ?</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {alumni.map((a, i) => (
                <tr key={i} className="hover:bg-amber/[0.03]">
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={a.name} size="xs" /><span className="text-[12px] font-semibold text-ink">{a.name}</span></div></td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{a.role}</td>
                  <td className="px-3 py-2 mono text-center text-[11px]">{a.exitYear}</td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{a.currentCompany}</td>
                  <td className="px-3 py-2 text-[10px] italic text-ink-500">{a.reason}</td>
                  <td className="px-3 py-2 text-center">
                    {a.boomerangCandidate
                      ? <StatusPill tone="success" dot={false}>Candidat ✓</StatusPill>
                      : <StatusPill tone="neutral" dot={false}>Non prioritaire</StatusPill>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Politique Alumni Atlas" subtitle="Maintenir le lien post-départ — opportunité business + recrutement" action={<Heart size={16} className="text-amber-deep" />} />
        <ul className="space-y-1.5 text-[12px] font-medium text-ink-700">
          <li>• <strong>Exit interview structuré</strong> obligatoire (M4) : raison départ classifiée · prochain rôle · accord opt-in alumni.</li>
          <li>• <strong>Invitation événements</strong> : afterworks trimestriels, événements clients clés, anniversaire entreprise.</li>
          <li>• <strong>Newsletter alumni</strong> mensuelle : actualités, nouveaux postes ouverts, success stories.</li>
          <li>• <strong>Programme boomerang</strong> : ex-collab considérés en priorité s'ils postulent · onboarding accéléré (M6 buddy).</li>
          <li>• <strong>Statistiques RH</strong> : suivre % boomerang dans embauches · KPI Atlas cible 5-8 %.</li>
          <li>• <strong>Anti-noir-liste</strong> : politique stricte · interdire blacklist sauf cas disciplinaires graves documentés.</li>
        </ul>
      </Card>
    </div>
  );
}

/* ═══════════════ 6. AUDIT M10 ═══════════════ */
export function AuditM10Page() {
  const events = [
    { at: '2026-12-08 14:30', actor: 'Comex',          action: 'promotion.validated',        detail: 'Kouadio NG. : Lead Dev P5b → Staff P6a', sensitivity: 'sensible' as const, hash: 'b8a1…7c92' },
    { at: '2026-12-08 11:00', actor: 'Comité Carrières', action: 'comite.session_closed',    detail: 'Session 8 promos revues · 6 approuvées', sensitivity: 'sensible' as const, hash: 'c4f3…0e21' },
    { at: '2026-11-28 16:00', actor: 'System',         action: 'talent_review.dossier_published', detail: 'Workshop Comex 9-box · 12 dossiers diffusés', sensitivity: 'top_secret' as const, hash: '7e29…b315' },
    { at: '2026-11-22 09:15', actor: 'System',         action: 'anti_discrim.glass_ceiling_detected', detail: 'Plafond verre genre P5+ : 18 % F vs 52 % H', sensitivity: 'sensible' as const, hash: 'a02f…d544' },
    { at: '2026-11-15 03:30', actor: 'System (cron)',  action: 'audit.chain_integrity_verified', detail: 'Chaîne SHA-256 vérifiée · 3 521 entrées intègres', sensitivity: 'interne' as const, hash: 'f1c8…092a' },
  ];
  const patterns = [
    { code: 'P1', name: 'Promotion sans critères',       desc: 'Promo accordée hors framework / sans dossier solide', sev: 'high' as const, count: 0 },
    { code: 'P2', name: 'Court-circuit Comité Carrières', desc: 'Décision unilatérale sans passage en comité', sev: 'high' as const, count: 1 },
    { code: 'P3', name: 'Plafond verre genre',           desc: 'Sous-représentation persistante femmes niveaux P5+', sev: 'high' as const, count: 1 },
    { code: 'P4', name: 'Plafond verre âge',             desc: 'Promotions concentrées sur tranche âge spécifique', sev: 'medium' as const, count: 0 },
    { code: 'P5', name: 'Népotisme',                     desc: 'Lien familial / personnel suspect entre manager et promu', sev: 'high' as const, count: 0 },
    { code: 'P6', name: 'Favoritisme HiPo',              desc: 'Mêmes profils HiPo cycle après cycle sans renouvellement', sev: 'medium' as const, count: 1 },
    { code: 'P7', name: 'HiPo non révisé',                desc: 'Statut HiPo non re-validé annuellement', sev: 'medium' as const, count: 2 },
    { code: 'P8', name: 'Succession orpheline',          desc: 'Poste critique sans aucun successeur identifié', sev: 'high' as const, count: 1 },
    { code: 'P9', name: 'Mobilité hors framework',       desc: 'Mobilité accordée sans matching ou hors politique', sev: 'medium' as const, count: 0 },
    { code: 'P10', name: 'Fuite confidentielle HiPo',    desc: 'Diffusion non autorisée dossier talent review', sev: 'high' as const, count: 0 },
    { code: 'P11', name: 'Promotion express',            desc: 'Promotion < 18 mois d\'ancienneté niveau précédent', sev: 'medium' as const, count: 1 },
    { code: 'P12', name: 'Comité non quorum',             desc: 'Session comité tenue sans quorum 2/3', sev: 'medium' as const, count: 0 },
  ];
  const sensitivityMeta = {
    public:     { label: 'Public',     tone: 'success' as const },
    interne:    { label: 'Interne',    tone: 'info' as const },
    sensible:   { label: 'Sensible',   tone: 'warn' as const },
    top_secret: { label: 'Top Secret', tone: 'danger' as const },
  };
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Audit M10 — chaîne SHA-256 &amp; anti-fraude carrière</h1>
          <p className="text-sm font-medium text-ink-500">Traçabilité ~80 actions · 12 patterns · classification 4 niveaux · anti-discrimination active · conservation 10 ans</p>
        </div>
        <StatusPill tone="success" dot={false}>Chaîne intègre</StatusPill>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Entrées audit YTD" value="3 521" unit="80 actions tracées" icon={Lock} />
        <StatCard label="Vérifications" value="365" unit="quotidiennes" icon={CheckCircle2} />
        <StatCard label="Patterns surveillés" value={String(patterns.length)} unit="suspicious + biais" icon={Eye} />
        <StatCard label="Alertes ouvertes" value={String(patterns.reduce((s, p) => s + p.count, 0))} unit="à investiguer" icon={ShieldAlert} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card inset={false}>
          <div className="p-5 pb-2"><CardHeader title="Timeline audit récente" subtitle="Chaîne SHA-256 · 4 niveaux confidentialité (public · interne · sensible · top secret)" className="mb-0" /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 text-left">Quand</th>
                <th className="px-3 py-2 text-left">Acteur</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Détail</th>
                <th className="px-3 py-2 text-center">Confidentialité</th>
                <th className="px-3 py-2 text-right">Hash</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {events.map((e, i) => {
                  const s = sensitivityMeta[e.sensitivity];
                  return (
                    <tr key={i} className="hover:bg-amber/[0.03]">
                      <td className="px-4 py-2 mono text-[10px] font-bold text-ink-500">{e.at}</td>
                      <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{e.actor}</td>
                      <td className="px-3 py-2"><StatusPill tone="neutral" dot={false}>{e.action}</StatusPill></td>
                      <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{e.detail}</td>
                      <td className="px-3 py-2 text-center"><StatusPill tone={s.tone} dot={false}>{s.label}</StatusPill></td>
                      <td className="px-3 py-2 mono text-right text-[10px] font-bold text-amber-deep">{e.hash}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="12 patterns anti-fraude carrière" subtitle="Détection cron quotidienne" action={<Shield size={16} className="text-amber-deep" />} />
          <ul className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {patterns.map((p) => (
              <li key={p.code} className="rounded-lg bg-surface2/40 px-3 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="mono text-[10px] font-bold text-amber-deep">{p.code} · {p.name}</span>
                  <div className="flex items-center gap-1">
                    {p.count > 0 && <span className="mono rounded-full bg-amber/12 px-1.5 text-[10px] font-bold text-amber-deep">{p.count}</span>}
                    <StatusPill tone={p.sev === 'high' ? 'danger' : 'warn'} dot={false}>{p.sev}</StatusPill>
                  </div>
                </div>
                <p className="text-[10px] font-medium italic text-ink-500">{p.desc}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="border-warn/30 bg-warn/[0.05]">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-warn" />
          <div>
            <p className="text-[12px] font-bold text-ink">Alerte P3 — Plafond verre genre niveaux P5+</p>
            <p className="mt-1 text-[11px] font-medium text-ink-700">
              Détection automatique : sur les niveaux P5+ (Lead/Principal+), répartition <strong>18 % F vs 52 % H</strong>. Écart &gt; 30 pts.
              Recommandation : <strong>plan diversité 18 mois</strong> · revue intentionnelle pipeline promotion · sponsorship inversé · audit critères évaluation potentiel.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
