/**
 * M11 FORMATION — Sprint 1 selon spec officielle formation.zip.
 * 6 pages : Parcours · PIF · Modalités · LMS · Formateurs · Audit M11.
 */
import { useState } from 'react';
import {
  Route, FileSignature, Layers, Monitor, Users as UsersIcon, Shield,
  GraduationCap, Award, AlertTriangle, AlertCircle, CheckCircle2,
  Calendar, Building2, Video, Hammer, Compass, Sparkles, Lock, Eye, Send,
  Award as Medal, TrendingUp, ArrowRight,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { FormationSubNav } from '../../components/formation/FormationSubNav';
import { EMPLOYEES, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

/* ═══════════════ 1. PARCOURS FORMATION ═══════════════ */
export function ParcoursFormationPage() {
  const parcours = [
    { code: 'CURS-TECH-DEV', label: 'Cursus métier Développeur', kind: 'metier' as const, duration_months: 18, modules: 7, enrolled: 8,
      target: 'Développeurs juniors → seniors', certifying: false,
      modules_list: ['TypeScript avancé', 'Architecture cloud', 'CI/CD & DevOps', 'Sécurité applicative', 'Performance', 'Tests automatisés', 'Leadership technique'] },
    { code: 'LEAD-MGR-1', label: 'Manager Coach niveau 1', kind: 'leadership' as const, duration_months: 12, modules: 5, enrolled: 6,
      target: 'Nouveaux managers (P5+)', certifying: true,
      modules_list: ['Postures de coach', 'Feedback efficace', '1-1 et conduite d\'entretien', 'Gestion conflits', 'Performance équipe'] },
    { code: 'CERTIF-AWS', label: 'Préparation AWS SAA-C03', kind: 'certifiant' as const, duration_months: 4, modules: 12, enrolled: 4,
      target: 'DevOps + Architects', certifying: true,
      modules_list: ['IAM & sécurité', 'EC2/VPC', 'S3 & stockage', 'RDS', 'Lambda', 'Networking', 'Monitoring', 'Cost optimization', 'High availability', 'Disaster recovery', 'Migration', 'Examen blanc'] },
    { code: 'OBLIG-HSE-2026', label: 'HSE obligatoire 2026', kind: 'obligatoire' as const, duration_months: 1, modules: 4, enrolled: 14,
      target: '100 % des collaborateurs', certifying: true,
      modules_list: ['Gestes & postures', 'Sécurité électrique', 'Prévention RPS', 'Premiers secours'] },
    { code: 'OBLIG-COMPLIANCE', label: 'RGPD + Anti-corruption 2026', kind: 'obligatoire' as const, duration_months: 1, modules: 3, enrolled: 14,
      target: '100 % des collaborateurs', certifying: true,
      modules_list: ['RGPD & loi 2013-450', 'Anti-corruption (Sapin 2)', 'Cybersécurité de base'] },
  ];
  const kindMeta = {
    metier:       { label: 'Métier',      color: 'sky',     icon: GraduationCap },
    leadership:   { label: 'Leadership',  color: 'amber',   icon: Compass },
    certifiant:   { label: 'Certifiant',  color: 'violet',  icon: Award },
    obligatoire:  { label: 'Obligatoire', color: 'rose',    icon: AlertTriangle },
  };
  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Parcours de formation</h1>
        <p className="text-sm font-medium text-ink-500">Cursus métier · Leadership · Certifications obligatoires · 100 % couverture HSE/Compliance</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Parcours actifs" value={String(parcours.length)} unit="catalogues" icon={Route} />
        <StatCard label="Inscrits cumulés" value={String(parcours.reduce((s, p) => s + p.enrolled, 0))} unit="parcours" icon={UsersIcon} />
        <StatCard label="Parcours certifiants" value={String(parcours.filter((p) => p.certifying).length)} unit="diplômants" icon={Medal} />
        <StatCard label="Couverture HSE+Compliance" value="100 %" unit="14/14 collab" icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {parcours.map((p) => {
          const meta = kindMeta[p.kind];
          const Icon = meta.icon;
          return (
            <Card key={p.code}>
              <div className="flex items-start gap-3">
                <span className={cn('rounded-xl p-2',
                  meta.color === 'sky' ? 'bg-sky-100 text-sky-700' :
                  meta.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                  meta.color === 'violet' ? 'bg-violet-100 text-violet-700' :
                                            'bg-rose-100 text-rose-700')}><Icon size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="mono text-[10px] font-bold uppercase tracking-wider text-amber-deep">{p.code}</p>
                  <h3 className="text-[14px] font-semibold leading-tight text-ink">{p.label}</h3>
                  <p className="mt-1 text-[11px] font-medium text-ink-500">{p.target}</p>
                </div>
                <StatusPill tone={p.kind === 'obligatoire' ? 'danger' : p.certifying ? 'success' : 'info'} dot={false}>
                  {meta.label}
                </StatusPill>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-surface2/40 p-2 text-center">
                <div><p className="mono text-[14px] font-bold text-ink">{p.duration_months} m</p><p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">durée</p></div>
                <div><p className="mono text-[14px] font-bold text-ink">{p.modules}</p><p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">modules</p></div>
                <div><p className="mono text-[14px] font-bold text-amber-deep">{p.enrolled}</p><p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">inscrits</p></div>
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Modules</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {p.modules_list.slice(0, 5).map((m, i) => (
                    <StatusPill key={i} tone="neutral" dot={false}>{m}</StatusPill>
                  ))}
                  {p.modules_list.length > 5 && (
                    <span className="text-[10px] font-medium text-ink-500">+{p.modules_list.length - 5}</span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════ 2. PIF — Plan Individuel Formation ═══════════════ */
export function PifPage() {
  const me = EMPLOYEES[3];
  const pif = {
    employee: me,
    year: 2026,
    co_constructed_with: EMPLOYEES[12],
    signed_employee: '2026-03-15',
    signed_manager: '2026-03-16',
    signed_drh: '2026-03-18',
    advist_hash: '8b3a7c…f192d4',
    budget_individual: 850_000,
    actions: [
      { kind: 'formation', label: 'Vente consultative B2B', duration: '21 h', start: '2026-Q2', cost: 360_000, status: 'completed' as const, completion_pct: 100 },
      { kind: 'certification', label: 'Préparation AWS SAA-C03', duration: '60 h', start: '2026-Q3', cost: 520_000, status: 'in_progress' as const, completion_pct: 45 },
      { kind: 'mentorat', label: 'Sponsorship Directeur Sales', duration: '12 mois', start: '2026-Q1', cost: 0, status: 'in_progress' as const, completion_pct: 50 },
      { kind: 'mission', label: 'Mission cross BU — Sénégal Q4', duration: '3 mois', start: '2026-Q4', cost: 0, status: 'planned' as const, completion_pct: 0 },
    ],
    competence_targets: [
      { name: 'Négociation commerciale', from: 3, to: 4 },
      { name: 'Management équipe', from: 2, to: 3 },
      { name: 'Anglais professionnel', from: 3, to: 4 },
    ],
  };
  const totalCost = pif.actions.reduce((s, a) => s + a.cost, 0);
  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Plan Individuel Formation (PIF)</h1>
          <p className="text-sm font-medium text-ink-500">Co-construit collab + manager · validé DRH · signé ADVIST · budget individuel suivi</p>
        </div>
        <Button size="sm"><FileSignature size={14} /> Nouveau PIF</Button>
      </div>

      <Card className="border-amber-deep/30 bg-gradient-to-br from-amber-50/30 to-surface">
        <div className="flex items-center gap-4">
          <Avatar name={employeeName(pif.employee)} size="md" />
          <div className="flex-1">
            <p className="text-[14px] font-bold text-ink">{employeeName(pif.employee)} · PIF {pif.year}</p>
            <p className="mt-0.5 text-[11px] font-medium text-ink-500">
              Co-construit avec {employeeName(pif.co_constructed_with)} · Budget {(pif.budget_individual / 1_000).toFixed(0)} k FCFA · Consommé {Math.round((totalCost / pif.budget_individual) * 100)} %
            </p>
          </div>
          <StatusPill tone="success" dot={false}>Signé ADVIST</StatusPill>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-medium">
          <div className="rounded-lg bg-surface2/40 p-2 text-center">
            <p className="font-bold uppercase tracking-wider text-ink-400">Signé collab</p>
            <p className="mono mt-0.5 text-ink">{pif.signed_employee}</p>
          </div>
          <div className="rounded-lg bg-surface2/40 p-2 text-center">
            <p className="font-bold uppercase tracking-wider text-ink-400">Signé manager</p>
            <p className="mono mt-0.5 text-ink">{pif.signed_manager}</p>
          </div>
          <div className="rounded-lg bg-surface2/40 p-2 text-center">
            <p className="font-bold uppercase tracking-wider text-ink-400">Signé DRH</p>
            <p className="mono mt-0.5 text-ink">{pif.signed_drh}</p>
          </div>
        </div>
        <p className="mt-2 mono text-[10px] font-bold text-amber-deep">Hash ADVIST : {pif.advist_hash}</p>
      </Card>

      <Card>
        <CardHeader title="4 actions PIF" subtitle="Formations · certifications · mentorat · missions" action={<Layers size={16} className="text-amber-deep" />} />
        <ul className="space-y-2">
          {pif.actions.map((a, i) => {
            const tone = a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'info' : 'neutral';
            return (
              <li key={i} className="rounded-xl border border-line bg-surface2/40 p-3">
                <div className="flex items-center gap-3">
                  <span className="mono rounded bg-amber-deep px-2 py-0.5 text-[10px] font-bold uppercase text-white">{a.kind}</span>
                  <p className="flex-1 text-[12px] font-semibold text-ink">{a.label}</p>
                  <StatusPill tone={tone} dot={false}>{a.status}</StatusPill>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[10px] font-medium text-ink-500">
                  <span>Durée: {a.duration}</span>
                  <span>Démarrage: {a.start}</span>
                  <span>Coût: {a.cost === 0 ? 'Interne' : `${(a.cost / 1_000).toFixed(0)} k`}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className={cn('h-full rounded-full', a.completion_pct === 100 ? 'bg-emerald-500' : 'bg-amber-deep')} style={{ width: `${a.completion_pct}%` }} />
                </div>
                <p className="mt-1 text-right text-[10px] font-bold text-amber-deep">{a.completion_pct} %</p>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Cibles compétences (uplift M9)" subtitle="Le PIF alimente la cartographie M9 · uplift mesuré post-formation" action={<TrendingUp size={16} className="text-amber-deep" />} />
        <ul className="space-y-2">
          {pif.competence_targets.map((c, i) => (
            <li key={i} className="rounded-xl bg-surface2/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold text-ink">{c.name}</p>
                <p className="mono text-[12px] font-bold text-amber-deep">{c.from}/5 → {c.to}/5</p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((lv) => (
                  <span key={lv} className={cn('h-2 flex-1 rounded',
                    lv <= c.from ? 'bg-emerald-500' : lv <= c.to ? 'bg-amber-deep/40 ring-1 ring-amber-deep' : 'bg-line')} />
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ═══════════════ 3. MODALITÉS PÉDAGOGIQUES ═══════════════ */
export function ModalitesPage() {
  const modalites = [
    { code: 'presentiel', label: 'Présentiel', icon: Building2, color: 'amber',
      desc: 'Sessions en salle physique avec formateur · interactions directes · meilleur pour soft skills', count: 8,
      best_for: ['Soft skills', 'Leadership', 'Workshops collaboratifs'],
      cost_avg: '320 000 FCFA/jour', kirkpatrick_l1_avg: 4.5 },
    { code: 'distanciel_sync', label: 'Distanciel synchrone', icon: Video, color: 'sky',
      desc: 'Classes virtuelles en direct (Zoom/Teams) · interactivité maintenue · économie déplacements', count: 12,
      best_for: ['Tech', 'Compliance', 'Onboarding distribué'],
      cost_avg: '180 000 FCFA/jour', kirkpatrick_l1_avg: 4.0 },
    { code: 'e_learning', label: 'E-learning asynchrone', icon: Monitor, color: 'violet',
      desc: 'Modules SCORM/xAPI auto-rythmés · gamification · LMS interne', count: 24,
      best_for: ['Compliance', 'Onboarding', 'Mise à niveau'],
      cost_avg: '85 000 FCFA/inscrit', kirkpatrick_l1_avg: 3.6 },
    { code: 'blended', label: 'Blended (mixte)', icon: Layers, color: 'emerald',
      desc: 'Combinaison e-learning préparatoire + présentiel approfondissement + suivi en ligne', count: 5,
      best_for: ['Cursus métier', 'Certifications longues', 'Leadership'],
      cost_avg: '480 000 FCFA/inscrit', kirkpatrick_l1_avg: 4.3 },
    { code: 'terrain', label: 'Formation terrain', icon: Hammer, color: 'rose',
      desc: 'Apprentissage par observation et pratique sur le poste · mentor désigné · shadowing', count: 6,
      best_for: ['Onboarding métier', 'Compétences techniques spécifiques'],
      cost_avg: 'Interne (temps mentor)', kirkpatrick_l1_avg: 4.4 },
    { code: 'self_learning', label: 'Self-learning', icon: Compass, color: 'cyan',
      desc: 'Auto-formation libre · MOOCs · livres · podcasts · forums · valorisée et remboursée', count: 18,
      best_for: ['Veille', 'Expertise pointue', 'Curiosité personnelle'],
      cost_avg: '40 000 FCFA/an/collab', kirkpatrick_l1_avg: 4.6 },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">6 modalités pédagogiques</h1>
        <p className="text-sm font-medium text-ink-500">Catalogue Atlas · critères de choix · KPI satisfaction L1 Kirkpatrick par modalité</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modalites.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.code}>
              <div className="flex items-start gap-3">
                <span className={cn('rounded-xl p-2',
                  m.color === 'amber'   ? 'bg-amber-100 text-amber-700' :
                  m.color === 'sky'     ? 'bg-sky-100 text-sky-700' :
                  m.color === 'violet'  ? 'bg-violet-100 text-violet-700' :
                  m.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                  m.color === 'rose'    ? 'bg-rose-100 text-rose-700' :
                                          'bg-cyan-100 text-cyan-700')}><Icon size={18} /></span>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold text-ink">{m.label}</h3>
                  <p className="mt-0.5 text-[10px] font-medium italic text-ink-500">{m.desc}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-surface2/40 p-2 text-center text-[10px]">
                <div><p className="font-bold uppercase tracking-wider text-ink-400">Sessions YTD</p><p className="mono mt-0.5 text-[14px] font-bold text-ink">{m.count}</p></div>
                <div><p className="font-bold uppercase tracking-wider text-ink-400">L1 satisfaction</p><p className="mono mt-0.5 text-[14px] font-bold text-emerald-600">{m.kirkpatrick_l1_avg.toFixed(1)}/5</p></div>
              </div>
              <p className="mt-2 text-[10px] font-medium text-ink-500"><strong>Coût moyen :</strong> {m.cost_avg}</p>
              <div className="mt-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Idéal pour</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.best_for.map((b, i) => <StatusPill key={i} tone="neutral" dot={false}>{b}</StatusPill>)}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Matrice de choix modalité" subtitle="Critères Atlas · à appliquer à chaque nouvelle formation" action={<Sparkles size={16} className="text-amber-deep" />} />
        <ul className="space-y-1 text-[12px] font-medium text-ink-700">
          <li>• <strong>Soft skills / Leadership</strong> → privilégier <strong>présentiel</strong> ou <strong>blended</strong> (interactions humaines)</li>
          <li>• <strong>Compliance obligatoire</strong> → <strong>e-learning</strong> (scalable · trace · répétable)</li>
          <li>• <strong>Tech / Cloud</strong> → <strong>blended</strong> ou <strong>distanciel sync</strong> (labs partagés)</li>
          <li>• <strong>Onboarding</strong> → <strong>terrain + e-learning</strong> combinés</li>
          <li>• <strong>Expertise pointue / veille</strong> → <strong>self-learning</strong> remboursé (MOOCs · livres · conférences)</li>
          <li>• <strong>Équipes distribuées</strong> → <strong>distanciel sync</strong> obligatoire (économie déplacement + temps)</li>
        </ul>
      </Card>
    </div>
  );
}

/* ═══════════════ 4. LMS DIGITAL ═══════════════ */
export function LmsPage() {
  const courses = [
    { title: 'TypeScript avancé', enrolled: 8, completed: 5, progress_avg: 73, gamification: 'Quiz + badges' },
    { title: 'RGPD opérationnel', enrolled: 14, completed: 14, progress_avg: 100, gamification: 'Quiz final certifiant' },
    { title: 'Anti-corruption Sapin 2', enrolled: 14, completed: 14, progress_avg: 100, gamification: 'Quiz final certifiant' },
    { title: 'Cybersécurité sensibilisation', enrolled: 14, completed: 14, progress_avg: 100, gamification: 'Quiz + simulation phishing' },
    { title: 'AWS SAA prep modules', enrolled: 4, completed: 1, progress_avg: 42, gamification: 'Lab AWS + examen blanc' },
  ];
  const badges = [
    { code: 'TS-EXPERT',     label: 'TypeScript Expert',     awarded: 2, color: 'sky' },
    { code: 'RGPD-2026',     label: 'RGPD 2026',             awarded: 14, color: 'rose' },
    { code: 'SAPIN-2026',    label: 'Sapin 2 — 2026',        awarded: 14, color: 'amber' },
    { code: 'CYBER-AWARE',   label: 'Cybersécurité Aware',    awarded: 14, color: 'violet' },
    { code: 'AWS-SAA-READY', label: 'AWS SAA — prêt examen', awarded: 0, color: 'emerald' },
    { code: 'CONTINUOUS',    label: 'Continuous Learner 10 h/mois', awarded: 6, color: 'cyan' },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">LMS Atlas — apprentissage digital</h1>
        <p className="text-sm font-medium text-ink-500">SCORM 1.2/2004 + xAPI · modules interactifs · gamification badges · certifications digitales</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Cours digitaux" value={String(courses.length)} unit="actifs" icon={Monitor} />
        <StatCard label="Inscriptions YTD" value={String(courses.reduce((s, c) => s + c.enrolled, 0))} unit="cumul" icon={UsersIcon} />
        <StatCard label="Taux complétion" value={`${Math.round(courses.reduce((s, c) => s + c.progress_avg, 0) / courses.length)} %`} unit="moyen" icon={CheckCircle2} />
        <StatCard label="Badges délivrés" value={String(badges.reduce((s, b) => s + b.awarded, 0))} unit="cumul" icon={Medal} />
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Cours LMS Atlas" subtitle="Progression collab + gamification" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Cours</th>
              <th className="px-3 py-2 text-center">Inscrits</th>
              <th className="px-3 py-2 text-center">Terminés</th>
              <th className="px-3 py-2 text-left">Progression</th>
              <th className="px-3 py-2 text-left">Gamification</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {courses.map((c, i) => (
                <tr key={i} className="hover:bg-amber/[0.03]">
                  <td className="px-3 py-2 text-[12px] font-semibold text-ink">{c.title}</td>
                  <td className="px-3 py-2 mono text-center text-[11px]">{c.enrolled}</td>
                  <td className="px-3 py-2 mono text-center text-[11px]">{c.completed}/{c.enrolled}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                        <div className={cn('h-full rounded-full', c.progress_avg === 100 ? 'bg-emerald-500' : 'bg-amber-deep')} style={{ width: `${c.progress_avg}%` }} />
                      </div>
                      <span className="mono text-[10px] font-bold text-amber-deep">{c.progress_avg} %</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[10px] font-medium italic text-ink-500">{c.gamification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Badges digitaux & certifications" subtitle="Reconnaissance digitale persistante · partageable LinkedIn" action={<Medal size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {badges.map((b) => (
            <div key={b.code} className="rounded-xl border border-line bg-surface2/40 p-3">
              <div className="flex items-center gap-2">
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-full text-white',
                  b.color === 'sky' ? 'bg-sky-500' :
                  b.color === 'rose' ? 'bg-rose-500' :
                  b.color === 'amber' ? 'bg-amber-500' :
                  b.color === 'violet' ? 'bg-violet-500' :
                  b.color === 'emerald' ? 'bg-emerald-500' :
                                          'bg-cyan-500')}>
                  <Medal size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="mono text-[9px] font-bold uppercase tracking-wider text-amber-deep">{b.code}</p>
                  <p className="truncate text-[11px] font-semibold text-ink">{b.label}</p>
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] font-medium text-ink-500">
                <span className="mono text-[14px] font-bold text-ink">{b.awarded}</span> attribué(s)
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Standards techniques LMS Atlas" subtitle="Compatibilité interop & traçabilité" />
        <ul className="space-y-1.5 text-[12px] font-medium text-ink-700">
          <li>• <strong>SCORM 1.2 / 2004</strong> : import packages standard du marché (Articulate · Captivate)</li>
          <li>• <strong>xAPI (Tin Can API)</strong> : tracking statements granulaires hors navigateur (mobile · simulations)</li>
          <li>• <strong>LRS embarqué</strong> : Learning Record Store interne · conservation 5 ans</li>
          <li>• <strong>Single Sign-On</strong> : SSO Supabase Auth · pas de mot de passe additionnel</li>
          <li>• <strong>Mobile-first</strong> : responsive 320px → 4K · mode hors-ligne (PWA) pour terrain</li>
        </ul>
      </Card>
    </div>
  );
}

/* ═══════════════ 5. FORMATEURS & ANIMATION ═══════════════ */
export function FormateursPage() {
  const formateurs = [
    { name: 'Léa Mondésir',  kind: 'externe' as const, organism: 'Institut RH Dakar',     specialty: 'Management Coach', sessions_ytd: 6, rating: 4.7, hourly_rate: 95_000 },
    { name: 'Dr. Mamadou Cissé', kind: 'externe' as const, organism: 'Cegos Africa',     specialty: 'Leadership Excellence', sessions_ytd: 4, rating: 4.9, hourly_rate: 250_000 },
    { name: 'Sarah O\'Connor', kind: 'externe' as const, organism: 'British Council',     specialty: 'Anglais professionnel', sessions_ytd: 12, rating: 4.5, hourly_rate: 75_000 },
    { name: 'Fatou Diop',    kind: 'interne' as const, organism: 'RH Atlas',              specialty: 'RGPD · Conformité OHADA', sessions_ytd: 8, rating: 4.4, hourly_rate: 0 },
    { name: 'Serge Aké',     kind: 'interne' as const, organism: 'DevOps Atlas',          specialty: 'Cybersécurité · AWS',   sessions_ytd: 5, rating: 4.6, hourly_rate: 0 },
    { name: 'Awa Koné',      kind: 'interne' as const, organism: 'DG Atlas',              specialty: 'Mentorat leaders',     sessions_ytd: 3, rating: 4.8, hourly_rate: 0 },
  ];
  const convocations = [
    { collab: EMPLOYEES[1], session: 'Manager Coach niveau 1', date: '2026-06-15', stage: 'J-15', sent: '2026-05-31', status: 'sent' as const },
    { collab: EMPLOYEES[3], session: 'Vente consultative B2B', date: '2026-06-12', stage: 'J-7',  sent: '2026-06-05', status: 'sent' as const },
    { collab: EMPLOYEES[7], session: 'AWS SAA prep — module 5', date: '2026-06-11', stage: 'J-1',  sent: '2026-06-10', status: 'sent' as const },
    { collab: EMPLOYEES[5], session: 'IFRS — états consolidés', date: '2026-07-08', stage: 'J-15', sent: '2026-06-23', status: 'pending' as const },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Pool de formateurs &amp; animation</h1>
        <p className="text-sm font-medium text-ink-500">Formateurs internes &amp; externes · convocations automatiques DocJourney J-15 / J-7 / J-1 · KPI satisfaction L1</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Formateurs actifs" value={String(formateurs.length)} unit="pool" icon={UsersIcon} />
        <StatCard label="Internes" value={String(formateurs.filter((f) => f.kind === 'interne').length)} unit="experts maison" icon={GraduationCap} />
        <StatCard label="Note moyenne L1" value={(formateurs.reduce((s, f) => s + f.rating, 0) / formateurs.length).toFixed(2)} unit="/5" icon={Award} />
        <StatCard label="Convocations en attente" value={String(convocations.filter((c) => c.status === 'pending').length)} unit="à envoyer" icon={Send} />
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Pool de formateurs" subtitle="Rotation interne valorisée · externes notés systématiquement" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Formateur</th>
              <th className="px-3 py-2 text-left">Organisme</th>
              <th className="px-3 py-2 text-left">Spécialité</th>
              <th className="px-3 py-2 text-center">Sessions YTD</th>
              <th className="px-3 py-2 text-center">Note L1</th>
              <th className="px-3 py-2 text-right">Taux horaire</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {formateurs.map((f, i) => (
                <tr key={i} className="hover:bg-amber/[0.03]">
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={f.name} size="xs" /><span className="text-[12px] font-semibold text-ink">{f.name}</span></div></td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{f.organism}</td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{f.specialty}</td>
                  <td className="px-3 py-2 text-center"><StatusPill tone={f.kind === 'interne' ? 'success' : 'info'} dot={false}>{f.kind}</StatusPill> <span className="mono ml-1 text-[11px] font-bold">{f.sessions_ytd}</span></td>
                  <td className="px-3 py-2 mono text-center text-[12px] font-bold text-amber-deep">{f.rating.toFixed(1)}</td>
                  <td className="px-3 py-2 mono text-right text-[11px]">{f.hourly_rate === 0 ? '—' : `${(f.hourly_rate / 1_000).toFixed(0)} k`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Convocations DocJourney" subtitle="Automatiques J-15 (info) · J-7 (rappel) · J-1 (logistique)" action={<Calendar size={16} className="text-amber-deep" />} />
        <ul className="space-y-2">
          {convocations.map((c, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-line bg-surface2/40 p-3">
              <Avatar name={employeeName(c.collab)} size="xs" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-ink">{employeeName(c.collab)}</p>
                <p className="text-[10px] font-medium text-ink-500">{c.session} · {c.date}</p>
              </div>
              <StatusPill tone={c.stage === 'J-1' ? 'warn' : c.stage === 'J-7' ? 'info' : 'neutral'} dot={false}>{c.stage}</StatusPill>
              <StatusPill tone={c.status === 'sent' ? 'success' : 'warn'} dot={false}>{c.status}</StatusPill>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ═══════════════ 6. AUDIT M11 ═══════════════ */
export function AuditM11Page() {
  const events = [
    { at: '2026-05-30 09:00', actor: 'System',         action: 'fdfp.declaration.submitted', detail: 'FDFP-CI-2026-Q2 soumise · 12,18 M FCFA déclarés', sensitivity: 'sensible' as const, hash: '4a8c…d29f' },
    { at: '2026-05-28 14:30', actor: 'Fatou Diop',    action: 'attendance.recorded',          detail: 'Session SES-2026-001 · 11 présents · 1 absent justifié', sensitivity: 'interne' as const, hash: '7c1b…0e5a' },
    { at: '2026-05-26 10:00', actor: 'System (cron)', action: 'compliance.expiration_alert',  detail: 'SST-CRX-2024-882 expire dans 47 j · alerte Khady Ndiaye', sensitivity: 'interne' as const, hash: 'b2f4…91a3' },
    { at: '2026-05-25 16:00', actor: 'System',        action: 'badge.awarded',                detail: '14 collaborateurs · badge RGPD 2026', sensitivity: 'public' as const, hash: 'e5d8…7240' },
    { at: '2026-05-22 11:15', actor: 'System',        action: 'pattern.suspicious_detected',  detail: 'P9 Évaluation N2 truquée · pass rate 100 % sur 3 sessions', sensitivity: 'sensible' as const, hash: '9a3e…f8b1' },
  ];
  const patterns = [
    { code: 'P1', name: 'Présences fictives',                   desc: 'Présences enregistrées sans collab présent', sev: 'critical' as const, count: 0, legal: 'Fraude FDFP' },
    { code: 'P2', name: 'Refacturations non justifiées',         desc: 'Factures prestataires sans session réelle',   sev: 'critical' as const, count: 0, legal: 'Pénal possible' },
    { code: 'P3', name: 'Formations fictives FDFP',              desc: 'Déclarations FDFP sans formation réelle',     sev: 'critical' as const, count: 0, legal: 'Pénal FDFP CI' },
    { code: 'P4', name: 'Certifications délivrées sans validation', desc: 'Certifs attribuées hors process',          sev: 'critical' as const, count: 0, legal: 'Disciplinaire' },
    { code: 'P5', name: 'Doubles paiements',                     desc: 'Même facture payée 2 fois',                   sev: 'high' as const,     count: 0, legal: 'Récupération' },
    { code: 'P6', name: 'Compliance non respectée',              desc: 'Certif obligatoire expirée > 30j',            sev: 'high' as const,     count: 2, legal: 'Risque inspection' },
    { code: 'P7', name: 'Sur-facturation prestataires',          desc: 'Tarifs supérieurs grille catalogue',         sev: 'medium' as const,   count: 1, legal: 'Renégociation' },
    { code: 'P8', name: 'Modifications post-validation',         desc: 'Inscriptions/évaluations modifiées post-Comité', sev: 'high' as const,  count: 0, legal: 'Disciplinaire' },
    { code: 'P9', name: 'Évaluations N2 truquées',               desc: 'Pass rate anormalement élevé',                sev: 'medium' as const,   count: 1, legal: 'Audit pédagogique' },
    { code: 'P10', name: 'No-shows non sanctionnés',             desc: 'Multiples no-shows sans action',              sev: 'medium' as const,   count: 0, legal: 'Process RH' },
  ];
  const sensitivityMeta = {
    public:    { label: 'Public',    tone: 'success' as const },
    interne:   { label: 'Interne',   tone: 'info' as const },
    sensible:  { label: 'Sensible',  tone: 'warn' as const },
    top_secret:{ label: 'Top Secret',tone: 'danger' as const },
  };
  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Audit M11 — chaîne SHA-256 &amp; anti-fraude FDFP</h1>
          <p className="text-sm font-medium text-ink-500">Traçabilité totale · 10 patterns dont 4 critiques pénal · conformité FDFP · 4 niveaux confidentialité</p>
        </div>
        <StatusPill tone="success" dot={false}>Chaîne intègre</StatusPill>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Entrées audit YTD" value="4 218" unit="actions tracées" icon={Lock} />
        <StatCard label="Vérifications" value="365" unit="quotidiennes" icon={CheckCircle2} />
        <StatCard label="Patterns surveillés" value={String(patterns.length)} unit="dont 4 critiques" icon={Eye} />
        <StatCard label="Alertes actives" value={String(patterns.reduce((s, p) => s + p.count, 0))} unit="à investiguer" icon={AlertTriangle} tone={patterns.reduce((s, p) => s + p.count, 0) > 0 ? 'amber' : 'default'} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card inset={false}>
          <div className="p-5 pb-2"><CardHeader title="Timeline audit récente" subtitle="Chaîne SHA-256 · 4 niveaux confidentialité" className="mb-0" /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 text-left">Quand</th>
                <th className="px-3 py-2 text-left">Acteur</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Détail</th>
                <th className="px-3 py-2 text-center">Conf.</th>
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
          <CardHeader title="10 patterns anti-fraude" subtitle="4 critiques pénal · 4 élevés · 2 moyens" action={<Shield size={16} className="text-amber-deep" />} />
          <ul className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {patterns.map((p) => (
              <li key={p.code} className="rounded-lg bg-surface2/40 px-3 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="mono text-[10px] font-bold text-amber-deep">{p.code} · {p.name}</span>
                  <div className="flex items-center gap-1">
                    {p.count > 0 && <span className="mono rounded-full bg-amber/12 px-1.5 text-[10px] font-bold text-amber-deep">{p.count}</span>}
                    <StatusPill tone={p.sev === 'critical' ? 'danger' : p.sev === 'high' ? 'warn' : 'info'} dot={false}>{p.sev}</StatusPill>
                  </div>
                </div>
                <p className="text-[10px] font-medium italic text-ink-500">{p.desc}</p>
                <p className="text-[9px] font-bold text-rose-600">→ {p.legal}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="border-warn/30 bg-warn/[0.05]">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-warn" />
          <div>
            <p className="text-[12px] font-bold text-ink">2 alertes P6 actives — Certifications obligatoires expirées</p>
            <p className="mt-1 text-[11px] font-medium text-ink-700">
              <strong>Khady Ndiaye</strong> (SST · expire 2026-07-15 · J-47) et <strong>Désiré Kouamé</strong> (SST · expire 2026-07-15 · J-47).
              Risque : <strong>inspection du travail</strong> + non-conformité M12 SST. Action : renouvellement Q3 obligatoire (session SES-2026-006).
            </p>
            <Button size="sm" variant="outline" className="mt-2"><ArrowRight size={12} /> Planifier renouvellement</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
