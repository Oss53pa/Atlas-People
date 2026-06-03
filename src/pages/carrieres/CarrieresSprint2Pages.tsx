/**
 * M10 CARRIÈRES — Sprint 2 selon spec officielle CARRIERE.zip.
 * 5 pages : Career Frameworks dual-track · Parcours individuels · Succession enrichi
 * · Mentorat & Sponsorship · Expatriation.
 */
import { useState } from 'react';
import {
  Network, Crown, Award, Users, Heart, Globe, Sparkles, ArrowRight,
  ArrowUpRight, AlertTriangle, CheckCircle2, ArrowRightLeft, FileSignature,
  TrendingUp, Calendar, MapPin, Shield, Compass,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { CarrieresSubNav } from '../../components/carrieres/CarrieresSubNav';
import { EMPLOYEES, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

/* ═══════════════ 1. CAREER FRAMEWORKS — DUAL TRACK ═══════════════ */
export function CareerFrameworksPage() {
  const frameworks = [
    { track: 'Management', icon: Crown, color: 'amber', levels: [
        { code: 'P3', name: 'Team Lead',           span: '3-5 collab' },
        { code: 'P5', name: 'Engineering Manager', span: '8-15 collab' },
        { code: 'P6', name: 'Senior Manager',      span: '15-30 collab' },
        { code: 'P7', name: 'Director',            span: '30-80 collab' },
        { code: 'P8', name: 'VP / Head of',        span: 'BU complète' },
        { code: 'P9', name: 'SVP / CXO',           span: 'Comex' },
      ] },
    { track: 'Expert',     icon: Award, color: 'sky', levels: [
        { code: 'P3', name: 'Senior IC',           span: 'Référent équipe' },
        { code: 'P5', name: 'Principal',           span: 'Tech lead transverse' },
        { code: 'P6', name: 'Staff Engineer',      span: 'Architecture BU' },
        { code: 'P7', name: 'Senior Staff',        span: 'Architecture transverse' },
        { code: 'P8', name: 'Principal Eng',       span: 'Architecture groupe' },
        { code: 'P9', name: 'Fellow',              span: 'Référent marché' },
      ] },
    { track: 'Specialist', icon: Compass, color: 'emerald', levels: [
        { code: 'P3', name: 'Specialist',          span: 'Domaine de niche' },
        { code: 'P5', name: 'Senior Specialist',   span: 'Garant domaine' },
        { code: 'P6', name: 'Expert',              span: 'Multi-domaine' },
        { code: 'P7', name: 'Distinguished',       span: 'Référent national' },
      ] },
  ];
  const transitions = [
    { from: 'Expert P5', to: 'Management P5', reason: 'Souhait management',          process: 'Évaluation 90 j + bootcamp manager' },
    { from: 'Management P5', to: 'Expert P5', reason: 'Retour technique',            process: 'Pas de perte salariale · accompagné par mentor expert' },
    { from: 'Specialist P5', to: 'Expert P5', reason: 'Élargissement périmètre',     process: 'Évaluation compétences cross-domaine' },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Career Frameworks — dual-track</h1>
        <p className="text-sm font-medium text-ink-500">3 trajectoires distinctes · pas de plafond pour les experts · transitions encadrées</p>
      </div>

      <Card>
        <CardHeader title="Pourquoi le dual-track ?" subtitle="Atlas refuse le piège du « tout le monde doit devenir manager pour évoluer »" action={<Network size={16} className="text-amber-deep" />} />
        <ul className="space-y-1.5 text-[12px] font-medium text-ink-700">
          <li>• <strong>Expert Track</strong> : monter en expertise technique sans encadrer · même salaire que Management équivalent</li>
          <li>• <strong>Management Track</strong> : leadership · pilotage humain · budget</li>
          <li>• <strong>Specialist Track</strong> : profondeur dans domaine de niche (juridique, R&amp;D pure, etc.)</li>
          <li>• <strong>Transitions latérales</strong> autorisées et accompagnées tous les 18 mois si souhait</li>
        </ul>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {frameworks.map((fw) => {
          const Icon = fw.icon;
          return (
            <Card key={fw.track}>
              <div className="flex items-center gap-3">
                <span className={cn('rounded-xl p-2',
                  fw.color === 'amber'   ? 'bg-amber-100 text-amber-700' :
                  fw.color === 'sky'     ? 'bg-sky-100 text-sky-700' :
                                           'bg-emerald-100 text-emerald-700')}><Icon size={18} /></span>
                <div>
                  <h3 className="text-[14px] font-bold text-ink">{fw.track} Track</h3>
                  <p className="text-[10px] font-medium text-ink-500">{fw.levels.length} niveaux structurés</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {fw.levels.map((l) => (
                  <li key={l.code} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5">
                    <span className="text-[11px] font-semibold text-ink"><span className="mono text-amber-deep">{l.code}</span> · {l.name}</span>
                    <span className="text-[10px] font-medium italic text-ink-500">{l.span}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Track switch — transitions encadrées" subtitle="Toutes les 18 mois · sur demande collab ou suggestion manager · validée Comité Carrières" action={<ArrowRightLeft size={16} className="text-amber-deep" />} />
        <ul className="space-y-2">
          {transitions.map((t, i) => (
            <li key={i} className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-ink">
                <StatusPill tone="info" dot={false}>{t.from}</StatusPill>
                <ArrowRight size={12} className="text-amber-deep" />
                <StatusPill tone="success" dot={false}>{t.to}</StatusPill>
              </div>
              <p className="mt-1 text-[11px] font-medium italic text-ink-500">Raison : {t.reason}</p>
              <p className="mt-1 text-[11px] font-medium text-ink-700">→ {t.process}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ═══════════════ 2. PARCOURS INDIVIDUELS ═══════════════ */
export function CareerPathsIndividualsPage() {
  const me = EMPLOYEES[3];
  const sections = [
    { num: 1, title: 'Aspirations & moteurs',            content: 'Évoluer vers leadership commercial régional · valoriser mes 8 ans expérience CI · explorer dimension internationale' },
    { num: 2, title: 'Forces actuelles',                 content: 'Négociation enterprise (4/5) · résilience marché OHADA · relation client haut niveau · ramp-up rapide' },
    { num: 3, title: 'Compétences à acquérir',           content: 'Management équipe (2→4) · Data analytics commerciale (1→3) · Anglais B2 (acquis) → C1 · Stratégie produit' },
    { num: 4, title: 'Prochain rôle souhaité (12-18 mois)', content: 'Sales Lead régional CI · pilotage équipe 4-6 commerciaux · responsabilité ARR 800 M FCFA' },
    { num: 5, title: 'Horizon 3-5 ans',                  content: 'Director Sales Afrique francophone OU VP Sales OHADA · M5+ certain · localisation potentielle Dakar ou Paris' },
    { num: 6, title: 'Mobilité acceptée',                content: 'CI ✓ · SN ✓ · Maghreb ✓ · Europe possible (12 mois projet) · USA non' },
    { num: 7, title: 'Engagement mutuel',                content: 'Atlas s\'engage : PDC accompagné · sponsor Comex · mobilité financée. Ibrahim s\'engage : 24 mois min · livraison ARR cible · mentorat 1 junior' },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Parcours individuel — co-construction</h1>
          <p className="text-sm font-medium text-ink-500">7 sections structurées · révisé annuellement · signature ADVIST mutuelle (collab + DRH)</p>
        </div>
        <Button size="sm"><FileSignature size={14} /> Signer le parcours</Button>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={employeeName(me)} size="md" />
          <div className="flex-1">
            <p className="text-[14px] font-bold text-ink">{employeeName(me)} · Parcours 2026</p>
            <p className="text-[11px] font-medium text-ink-500">{me.role} · Bineta Gueye (Marketing Lead) · co-construit le 14 nov. · à signer ADVIST avant 31 déc.</p>
          </div>
          <StatusPill tone="info" dot={false}>Co-construit, à signer</StatusPill>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.num}>
            <div className="flex items-start gap-3">
              <span className="mono flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-deep text-[13px] font-bold text-white">{s.num}</span>
              <div>
                <p className="text-[13px] font-bold text-ink">{s.title}</p>
                <p className="mt-1 text-[12px] font-medium italic text-ink-700">{s.content}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Engagements mutuels — règles d'or" subtitle="Le parcours est un contrat moral entre collab et entreprise" action={<Sparkles size={16} className="text-amber-deep" />} />
        <ul className="grid grid-cols-1 gap-1.5 text-[12px] font-medium text-ink-700 md:grid-cols-2">
          <li className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" /><span><strong>Confidentiel</strong> : visible owner + manager + DRH uniquement</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" /><span><strong>Pas opposable</strong> : déclaration d'intention, pas garantie de promotion</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" /><span><strong>Révisable</strong> à tout moment (vie perso, opportunité, ré-orientation)</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" /><span><strong>Audité</strong> chaque cycle évaluation (M8) pour cohérence</span></li>
        </ul>
      </Card>
    </div>
  );
}

/* ═══════════════ 3. SUCCESSION ENRICHIE ═══════════════ */
export function SuccessionEnrichedPage() {
  const criticalRoles = [
    { role: 'CFO',             holder: EMPLOYEES[0],  criticality: 'critical' as const, successors: 3, ready: 1, in_18m: 2, ready_3y: 0, lastReview: '2026-11' },
    { role: 'CTO',             holder: EMPLOYEES[1],  criticality: 'critical' as const, successors: 2, ready: 0, in_18m: 1, ready_3y: 1, lastReview: '2026-11' },
    { role: 'DRH',             holder: EMPLOYEES[2],  criticality: 'critical' as const, successors: 4, ready: 2, in_18m: 1, ready_3y: 1, lastReview: '2026-11' },
    { role: 'Lead Product',    holder: EMPLOYEES[13], criticality: 'high' as const,     successors: 2, ready: 0, in_18m: 2, ready_3y: 0, lastReview: '2026-10' },
    { role: 'Marketing Lead',  holder: EMPLOYEES[12], criticality: 'high' as const,     successors: 1, ready: 0, in_18m: 1, ready_3y: 0, lastReview: '2026-09' },
    { role: 'DevOps Lead',     holder: EMPLOYEES[7],  criticality: 'high' as const,     successors: 1, ready: 0, in_18m: 0, ready_3y: 1, lastReview: '2026-08' },
    { role: 'Customer Success Lead', holder: EMPLOYEES[10], criticality: 'medium' as const, successors: 0, ready: 0, in_18m: 0, ready_3y: 0, lastReview: 'Jamais' },
  ];
  const risks = [
    { role: 'Customer Success Lead', risk: 'Succession orpheline · 0 successeur · poste critical-medium', action: 'Identifier 2 successeurs sous 30 j' },
    { role: 'DevOps Lead',           risk: 'Seul successeur · expert unique · cumul SPOF compétences',     action: 'Recruter binôme DevOps senior Q1 2027' },
    { role: 'CTO',                   risk: '0 successeur Ready Now · poste sensitive top secret',         action: 'Coaching exécutif Kouadio + sponsoring CXO externe' },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Plans Succession enrichis</h1>
        <p className="text-sm font-medium text-ink-500">Politique Atlas : <strong>3+ successeurs</strong> par poste critique · revue trimestrielle · transitions documentées</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Postes critiques" value={String(criticalRoles.length)} unit="suivis" icon={Crown} />
        <StatCard label="Politique 3+ respectée" value={`${criticalRoles.filter((r) => r.successors >= 3).length}/${criticalRoles.length}`} unit="postes conformes" icon={CheckCircle2} tone={criticalRoles.filter((r) => r.successors >= 3).length < criticalRoles.length ? 'amber' : 'default'} />
        <StatCard label="Postes orphelins" value={String(criticalRoles.filter((r) => r.successors === 0).length)} unit="critique" icon={AlertTriangle} tone="amber" />
        <StatCard label="Successeurs Ready Now" value={String(criticalRoles.reduce((s, r) => s + r.ready, 0))} unit="disponibilité immédiate" icon={Sparkles} />
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Plans succession par poste critique" subtitle="Ready Now · 18 mois · 3 ans · dernier review" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Poste</th>
              <th className="px-3 py-2 text-left">Titulaire</th>
              <th className="px-3 py-2 text-center">Criticité</th>
              <th className="px-3 py-2 text-center">Total</th>
              <th className="px-3 py-2 text-center">Ready Now</th>
              <th className="px-3 py-2 text-center">18 mois</th>
              <th className="px-3 py-2 text-center">3 ans</th>
              <th className="px-3 py-2 text-center">Dernier review</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {criticalRoles.map((r) => (
                <tr key={r.role} className={cn('hover:bg-amber/[0.03]', r.successors === 0 && 'bg-rose-50/30')}>
                  <td className="px-3 py-2 text-[12px] font-semibold text-ink">{r.role}</td>
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={employeeName(r.holder)} size="xs" /><span className="text-[11px] font-medium text-ink-700">{employeeName(r.holder)}</span></div></td>
                  <td className="px-3 py-2 text-center"><StatusPill tone={r.criticality === 'critical' ? 'danger' : r.criticality === 'high' ? 'warn' : 'info'} dot={false}>{r.criticality}</StatusPill></td>
                  <td className="px-3 py-2 mono text-center text-[12px] font-bold">{r.successors}</td>
                  <td className="px-3 py-2 mono text-center text-[11px] text-emerald-600">{r.ready}</td>
                  <td className="px-3 py-2 mono text-center text-[11px] text-amber-700">{r.in_18m}</td>
                  <td className="px-3 py-2 mono text-center text-[11px] text-sky-700">{r.ready_3y}</td>
                  <td className="px-3 py-2 mono text-center text-[10px] text-ink-500">{r.lastReview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-warn/30 bg-warn/[0.05]">
        <CardHeader title={`${risks.length} risques succession à traiter`} subtitle="Plans d'action 30/60/90 jours" action={<AlertTriangle size={16} className="text-warn" />} />
        <ul className="space-y-2">
          {risks.map((r, i) => (
            <li key={i} className="rounded-xl bg-surface p-3">
              <p className="text-[12px] font-bold text-ink">{r.role}</p>
              <p className="mt-0.5 text-[11px] font-medium italic text-rose-600">{r.risk}</p>
              <p className="mt-1 text-[11px] font-semibold text-amber-deep">→ {r.action}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ═══════════════ 4. MENTORAT & SPONSORSHIP ═══════════════ */
export function MentoratSponsorshipPage() {
  const programs = [
    { type: 'Mentorat formel',          icon: Heart,        color: 'emerald',
      desc: '12 mois · 1 senior mentor + 1 mentee · 24 sessions hebdo · accord signé', count: 8 },
    { type: 'Sponsorship cross-direction', icon: Award,    color: 'amber',
      desc: 'Sponsor exécutif s\'engage à promouvoir publiquement et défendre · 18 mois', count: 4 },
    { type: 'Reverse mentoring',        icon: ArrowRightLeft, color: 'sky',
      desc: 'Junior mentore senior · digital/diversité/nouvelles génération · 6 mois', count: 6 },
  ];
  const pairs = [
    { mentor: EMPLOYEES[0],  mentee: EMPLOYEES[3],  program: 'Mentorat formel',     focus: 'Leadership commercial · cycle vente enterprise', startDate: '2026-06-15', sessions: 18 },
    { mentor: EMPLOYEES[1],  mentee: EMPLOYEES[10], program: 'Mentorat formel',     focus: 'Stack technique cloud + scale-up tooling',         startDate: '2026-09-01', sessions: 11 },
    { mentor: EMPLOYEES[13], mentee: EMPLOYEES[5],  program: 'Sponsorship',         focus: 'Préparation passage à Director Finance · CFO succession', startDate: '2026-05-10', sessions: 6 },
    { mentor: EMPLOYEES[2],  mentee: EMPLOYEES[7],  program: 'Sponsorship',         focus: 'Visibilité Comex · réseau africain · positionnement', startDate: '2026-08-01', sessions: 4 },
    { mentor: EMPLOYEES[10], mentee: EMPLOYEES[0],  program: 'Reverse',             focus: 'Tools digitaux gestion budget + Excel avancé',     startDate: '2026-10-01', sessions: 3 },
    { mentor: EMPLOYEES[8],  mentee: EMPLOYEES[12], program: 'Reverse',             focus: 'Diversité &amp; équité H/F en entreprise',         startDate: '2026-09-15', sessions: 4 },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Mentorat &amp; Sponsorship</h1>
        <p className="text-sm font-medium text-ink-500">3 programmes formels distincts · 18 paires actives · KPI rétention HiPo · participation pools obligatoire</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {programs.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.type}>
              <div className="flex items-center gap-3">
                <span className={cn('rounded-xl p-2',
                  p.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                  p.color === 'amber'   ? 'bg-amber-100 text-amber-700' :
                                          'bg-sky-100 text-sky-700')}><Icon size={18} /></span>
                <div>
                  <h3 className="text-[13px] font-bold text-ink">{p.type}</h3>
                  <p className="text-[10px] font-medium text-ink-500">{p.count} paires actives</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] font-medium italic text-ink-700">{p.desc}</p>
            </Card>
          );
        })}
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Paires actives" subtitle={`${pairs.length} relations en cours · sessions hebdomadaires`} className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Mentor / Sponsor</th>
              <th className="px-3 py-2 text-left">Mentee / Sponsoré</th>
              <th className="px-3 py-2 text-center">Programme</th>
              <th className="px-3 py-2 text-left">Focus</th>
              <th className="px-3 py-2 text-center">Démarré</th>
              <th className="px-3 py-2 text-center">Sessions</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {pairs.map((p, i) => (
                <tr key={i} className="hover:bg-amber/[0.03]">
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={employeeName(p.mentor)} size="xs" /><span className="text-[11px] font-semibold text-ink">{employeeName(p.mentor)}</span></div></td>
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={employeeName(p.mentee)} size="xs" /><span className="text-[11px] font-medium text-ink-700">{employeeName(p.mentee)}</span></div></td>
                  <td className="px-3 py-2 text-center"><StatusPill tone={p.program === 'Sponsorship' ? 'warn' : p.program === 'Reverse' ? 'info' : 'success'} dot={false}>{p.program}</StatusPill></td>
                  <td className="px-3 py-2 text-[11px] font-medium italic text-ink-700">{p.focus}</td>
                  <td className="px-3 py-2 mono text-center text-[10px]">{p.startDate}</td>
                  <td className="px-3 py-2 mono text-center text-[12px] font-bold text-amber-deep">{p.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Politique Atlas — programmes obligatoires" subtitle="Cadre formel · sortie HiPo si non engagement" action={<Shield size={16} className="text-amber-deep" />} />
        <ul className="space-y-1.5 text-[12px] font-medium text-ink-700">
          <li>• <strong>HiPo</strong> doivent être mentees ≥ 1 programme actif (mentorat OU sponsorship) — sinon retrait pool</li>
          <li>• <strong>Top 30 collab P5+</strong> tenus de mentore ≥ 1 junior · valorisé dans évaluation annuelle (dimension 5 dev)</li>
          <li>• <strong>Reverse mentoring</strong> recommandé pour tous P7+ (lutte contre le gap générationnel et digital)</li>
          <li>• <strong>Sponsorship</strong> exclusif Comité Carrières · ne peut pas être demandé · attribution discrétionnaire</li>
          <li>• <strong>Audit annuel</strong> : taux engagement programmes · qualité accords · KPI rétention HiPo</li>
        </ul>
      </Card>
    </div>
  );
}

/* ═══════════════ 5. EXPATRIATION ═══════════════ */
export function ExpatriationPage() {
  const expats = [
    { collab: EMPLOYEES[1], from: 'CI', to: 'France',   role: 'Tech Lead Paris HQ',    startDate: '2026-09-01', endDate: '2027-09-01', package_total: 12500000, status: 'in_progress' as const, monthly_1on1: 3 },
    { collab: EMPLOYEES[4], from: 'SN', to: 'CI',       role: 'Lead Designer Abidjan', startDate: '2027-01-15', endDate: '2027-12-31', package_total: 8400000,  status: 'preparation' as const, monthly_1on1: 0 },
    { collab: EMPLOYEES[2], from: 'CI', to: 'Maroc',    role: 'Mission DRH 6 mois',    startDate: '2027-03-01', endDate: '2027-09-01', package_total: 6300000,  status: 'candidature' as const, monthly_1on1: 0 },
  ];
  const packageComponents = [
    { label: 'Indemnité expatriation',     pct: 25, desc: '+25 % salaire base · couvre dépaysement / éloignement' },
    { label: 'Logement',                    pct: 30, desc: 'Loyer + caution + meubles ou allocation forfaitaire' },
    { label: 'Scolarité enfants',           pct: 15, desc: 'École internationale ou française · 100 % prise en charge' },
    { label: 'Voyages retour',              pct: 8,  desc: '2 voyages A/R famille par an · classe Premium economy' },
    { label: 'Assurance santé internationale', pct: 6, desc: 'Couverture famille complète · médecins privés' },
    { label: 'Cours de langue',             pct: 4,  desc: '300 h · conjoint + collaborateur' },
    { label: 'Cost-of-living adjustment',   pct: 12, desc: 'Index Mercer COL différentiel pays d\'accueil' },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Expatriation &amp; Mobilité internationale</h1>
          <p className="text-sm font-medium text-ink-500">{expats.length} expatriations actives · packages structurés · 1-1 mensuels obligatoires · retours documentés</p>
        </div>
        <Button size="sm"><Globe size={14} /> Nouvelle candidature</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Expatriations actives" value={String(expats.filter((e) => e.status === 'in_progress').length)} unit="en cours" icon={Globe} />
        <StatCard label="En préparation" value={String(expats.filter((e) => e.status === 'preparation' || e.status === 'candidature').length)} unit="démarrage 2027" icon={MapPin} />
        <StatCard label="Budget annuel" value="27 M" unit="FCFA packages" icon={Award} />
        <StatCard label="Taux retour" value="87 %" unit="post-mission · cible 85+" icon={TrendingUp} tone="default" />
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Expatriations en cours" subtitle="1-1 mensuels obligatoires entre collab + DRH + manager local" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-center">De → Vers</th>
              <th className="px-3 py-2 text-left">Rôle</th>
              <th className="px-3 py-2 text-center">Période</th>
              <th className="px-3 py-2 text-right">Package total</th>
              <th className="px-3 py-2 text-center">1-1 réalisés</th>
              <th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {expats.map((e, i) => (
                <tr key={i} className="hover:bg-amber/[0.03]">
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={employeeName(e.collab)} size="xs" /><span className="text-[12px] font-semibold text-ink">{employeeName(e.collab)}</span></div></td>
                  <td className="px-3 py-2 mono text-center text-[11px] font-bold">{e.from} → {e.to}</td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{e.role}</td>
                  <td className="px-3 py-2 mono text-center text-[10px] text-ink-500">{e.startDate} → {e.endDate}</td>
                  <td className="px-3 py-2 mono text-right text-[12px] font-bold text-amber-deep">{(e.package_total / 1_000_000).toFixed(1)} M</td>
                  <td className="px-3 py-2 mono text-center text-[12px]">{e.monthly_1on1}</td>
                  <td className="px-3 py-2 text-center"><StatusPill tone={e.status === 'in_progress' ? 'success' : e.status === 'preparation' ? 'info' : 'warn'} dot={false}>{e.status}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Composition d'un package d'expatriation" subtitle="Standard Atlas · 7 composantes · % du salaire base" action={<Award size={16} className="text-amber-deep" />} />
        <ul className="space-y-1.5">
          {packageComponents.map((c, i) => (
            <li key={i} className="rounded-xl bg-surface2/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-ink">{c.label}</p>
                <span className="mono text-[14px] font-bold text-amber-deep">{c.pct} %</span>
              </div>
              <p className="text-[10px] font-medium italic text-ink-500">{c.desc}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Politique retours post-expatriation" subtitle="Réintégration garantie · valorisation expérience internationale" action={<ArrowUpRight size={16} className="text-amber-deep" />} />
        <ul className="space-y-1.5 text-[12px] font-medium text-ink-700">
          <li>• <strong>Retour anticipé 6 mois</strong> : DRH organise rencontres internes pour identifier rôle de retour</li>
          <li>• <strong>Réintégration garantie</strong> : poste équivalent ou supérieur · jamais inférieur</li>
          <li>• <strong>Sas de réintégration 90 j</strong> : période d'adaptation avec mentor expat-returner</li>
          <li>• <strong>Valorisation expérience</strong> : passage au grade supérieur typique post 12+ mois expat</li>
          <li>• <strong>Clause retour bénéficiaire</strong> : 2 ans engagement Atlas post-retour ou remboursement package</li>
        </ul>
      </Card>
    </div>
  );
}
