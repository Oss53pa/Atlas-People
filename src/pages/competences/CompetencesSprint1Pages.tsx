/**
 * M9 COMPÉTENCES — Sprint 1 selon spec officielle COMPETENCES SUITE.zip.
 * 5 pages : Auto-éval · Manager-éval · PDC · Talents/Mobilité · Audit M9.
 */
import { useMemo, useState } from 'react';
import {
  Shield, ClipboardCheck, ClipboardList, TrendingUp, ArrowRightLeft,
  Lock, ShieldAlert, AlertCircle, AlertTriangle, CheckCircle2, Sparkles,
  FileSignature, Target, Eye, Award, ArrowRight,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { CompetencesSubNav } from '../../components/competences/CompetencesSubNav';
import { EMPLOYEES, employeeName, SKILLS } from '../../data/mock';
import { cn } from '../../lib/cn';

/* ═══════════════ 1. AUDIT M9 ═══════════════ */
export function AuditM9Page() {
  const auditEvents = [
    { at: '2026-11-28 14:22', actor: 'Marie SAMAKÉ',  action: 'eval_auto.submitted',          detail: 'Auto-évaluation compétences soumise · 23 compétences notées', sensitivity: 'sensible' as const, hash: 'a7f3…2c81' },
    { at: '2026-11-28 11:15', actor: 'Kouadio NG.',   action: 'eval_manager.submitted',       detail: 'Évaluation manager M. SAMAKÉ · 21 compétences · 3 divergences', sensitivity: 'sensible' as const, hash: 'b14e…f902' },
    { at: '2026-11-27 16:30', actor: 'System',         action: 'gap.critical_detected',        detail: 'Gap critique : Sécurité applicative (Lvl 0 vs Lvl 4 requis)', sensitivity: 'interne' as const,  hash: 'c982…0a14' },
    { at: '2026-11-25 09:45', actor: 'Awa Koné',       action: 'pdc.signed_advist',            detail: 'PDC M. SAMAKÉ signé ADVIST · 6 actions sur 12 mois', sensitivity: 'sensible' as const, hash: 'd4b1…7e32' },
    { at: '2026-11-22 14:00', actor: 'System',         action: 'anti_discrim.pattern_detected', detail: 'Patron P5 - sous-évaluation systématique femmes équipe Tech', sensitivity: 'sensible' as const, hash: 'e21f…9d44' },
    { at: '2026-11-20 10:10', actor: 'Fatou Diop',     action: 'cartographie_poste.published', detail: 'Job profile « Lead Developer » v2 publié · 18 compétences', sensitivity: 'public' as const,   hash: 'f7c0…1b87' },
    { at: '2026-11-15 03:30', actor: 'System (cron)',  action: 'audit.chain_integrity_verified', detail: 'Chaîne SHA-256 vérifiée · 2 487 entrées intègres', sensitivity: 'interne' as const,   hash: '0892…6e15' },
  ];
  const patterns = [
    { code: 'P1', name: 'Inflation auto-évaluation systématique', desc: 'Collab note tout en N4-N5 sans preuves', sev: 'medium' as const, count: 2 },
    { code: 'P2', name: 'Modification niveau post-validation', desc: 'Niveau modifié APRÈS validation manager', sev: 'high' as const, count: 0 },
    { code: 'P3', name: 'Divergence chronique manager/auto-éval', desc: 'Écart >2 niveaux récurrent sur 3+ cycles', sev: 'high' as const, count: 1 },
    { code: 'P4', name: 'Évaluation sans preuves factuelles', desc: 'Manager note expertise sans justifications', sev: 'medium' as const, count: 4 },
    { code: 'P5', name: 'Discrimination par compétences', desc: 'Femmes/jeunes sous-évalués systématiquement', sev: 'high' as const, count: 1 },
    { code: 'P6', name: 'Manager noteur extrême', desc: 'Note moyenne >4,3 ou <2,5 systématiquement', sev: 'medium' as const, count: 0 },
    { code: 'P7', name: 'Gap critique non traité', desc: 'Critique non-conformité >12 mois sans PDC', sev: 'high' as const, count: 2 },
    { code: 'P8', name: 'Certification fictive', desc: 'Certification déclarée sans preuve attestation', sev: 'high' as const, count: 0 },
    { code: 'P9', name: 'Manipulation cartographie poste', desc: 'Niveaux requis modifiés pour favoriser candidat', sev: 'high' as const, count: 0 },
    { code: 'P10', name: 'Mobilité contournant matching', desc: 'Mobilité accordée malgré matching <40 %', sev: 'high' as const, count: 1 },
  ];
  const sensitivityMeta = {
    public:   { label: 'Public',   tone: 'success' as const },
    interne:  { label: 'Interne',  tone: 'info' as const },
    sensible: { label: 'Sensible', tone: 'warn' as const },
  };
  return (
    <div className="animate-fade-up space-y-5">
      <CompetencesSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Audit M9 — chaîne SHA-256 &amp; anti-fraude</h1>
          <p className="text-sm font-medium text-ink-500">Traçabilité totale · 10 patterns automatiques · classification RGPD · conservation 10 ans · vérif cron 03 h 30</p>
        </div>
        <StatusPill tone="success" dot={false}>Chaîne intègre</StatusPill>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Entrées audit YTD" value="2 487" unit="60 actions tracées" icon={Lock} />
        <StatCard label="Vérifications" value="365" unit="quotidiennes" icon={CheckCircle2} />
        <StatCard label="Patterns surveillés" value="10" unit="suspicious" icon={Eye} />
        <StatCard label="Alertes ouvertes" value="11" unit="à investiguer" icon={ShieldAlert} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card inset={false}>
          <div className="p-5 pb-2"><CardHeader title="Timeline audit récente" subtitle="Chaîne SHA-256 · classification RGPD par entrée" className="mb-0" /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 text-left">Quand</th>
                <th className="px-3 py-2 text-left">Acteur</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Détail</th>
                <th className="px-3 py-2 text-center">RGPD</th>
                <th className="px-3 py-2 text-right">Hash</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {auditEvents.map((e, i) => {
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
          <CardHeader title="10 patterns anti-fraude M9" subtitle="Détection cron quotidienne" action={<Shield size={16} className="text-amber-deep" />} />
          <ul className="space-y-1.5">
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

      <Card>
        <CardHeader title="Classification RGPD des données compétences" subtitle="3 niveaux de sensibilité — accès différencié" action={<Lock size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-3">
            <p className="text-[12px] font-bold text-ink">Public</p>
            <p className="mt-1 text-[10px] font-medium text-ink-500">Niveaux requis poste (job profiles publiés)</p>
            <p className="mt-2 text-[10px] font-bold text-emerald-700">Accessible : tous collaborateurs</p>
          </div>
          <div className="rounded-xl border-2 border-sky-300 bg-sky-50/40 p-3">
            <p className="text-[12px] font-bold text-ink">Interne</p>
            <p className="mt-1 text-[10px] font-medium text-ink-500">Niveaux acquis collaborateur</p>
            <p className="mt-2 text-[10px] font-bold text-sky-700">Accessible : manager + RH + intéressé</p>
          </div>
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-3">
            <p className="text-[12px] font-bold text-ink">Sensible</p>
            <p className="mt-1 text-[10px] font-medium text-ink-500">Verbatims auto-éval, raisons gap</p>
            <p className="mt-2 text-[10px] font-bold text-amber-700">Accessible : RH + intéressé uniquement</p>
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-amber/[0.06] px-3 py-2 text-[11px] font-medium italic text-ink-700">
          <strong>Conservation 10 ans</strong> minimum (contentieux compétences). Anonymisation automatique après expiration via EF <code className="mono rounded bg-ink/5 px-1">anonymize-after-retention-m9</code>.
        </p>
      </Card>
    </div>
  );
}

/* ═══════════════ 2. AUTO-ÉVALUATION COMPÉTENCES ═══════════════ */
export function AutoEvalCompetencesPage() {
  const me = EMPLOYEES[3]; // Ibrahim
  const myCompetences = SKILLS.slice(0, 6).map((s, i) => ({
    skill: s,
    autoLevel: Math.min(5, 2 + (i % 4)) as 0|1|2|3|4|5,
    targetLevel: 4 as const,
    preuves: i % 2 === 0 ? ['Projet X · réf #4521', 'Formation FRM-2026-' + (i + 10)] : [],
    aDevelopper: i === 1 || i === 3,
  }));
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="animate-fade-up space-y-5">
      <CompetencesSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Auto-évaluation compétences</h1>
          <p className="text-sm font-medium text-ink-500">Flow annuel · cycle 2026 · auto-réflexion + preuves + souhaits évolution</p>
        </div>
        {submitted
          ? <StatusPill tone="success" dot={false}>Soumise — En attente manager</StatusPill>
          : <Button size="sm" onClick={() => setSubmitted(true)}><CheckCircle2 size={14} /> Soumettre</Button>}
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={employeeName(me)} size="md" />
          <div className="flex-1">
            <p className="text-[14px] font-bold text-ink">{employeeName(me)}</p>
            <p className="text-[11px] font-medium text-ink-500">{me.role} · {me.department} · auto-éval ouverte du 1 oct. au 25 oct.</p>
          </div>
          <span className="mono text-[12px] font-bold text-amber-deep">{myCompetences.length} compétences</span>
        </div>
      </Card>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Mes compétences à auto-évaluer" subtitle="Glissez le niveau · ajoutez vos preuves · marquez celles à développer" className="mb-0" /></div>
        <div className="space-y-3 p-5 pt-0">
          {myCompetences.map((c) => (
            <div key={c.skill.name} className="rounded-xl border border-line p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-ink">{c.skill.name}</p>
                  <p className="text-[10px] font-medium text-ink-500">{c.skill.domain} · niveau requis poste : <strong>{c.targetLevel}/5</strong></p>
                </div>
                <div className="flex items-center gap-2">
                  {c.aDevelopper && <StatusPill tone="warn" dot={false}>À développer</StatusPill>}
                  <span className={cn('mono rounded-full px-3 py-1 text-[14px] font-bold',
                    c.autoLevel >= c.targetLevel ? 'bg-emerald-100 text-emerald-700' :
                    c.autoLevel === c.targetLevel - 1 ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700')}>{c.autoLevel}/5</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div key={lvl} className={cn('h-2 flex-1 rounded',
                    lvl <= c.autoLevel ? 'bg-amber-deep' : lvl <= c.targetLevel ? 'bg-amber-200' : 'bg-line')} />
                ))}
              </div>
              {c.preuves.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.preuves.map((p, i) => <StatusPill key={i} tone="info" dot={false}>📎 {p}</StatusPill>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Souhaits d'évolution" subtitle="3 questions ouvertes — vues uniquement par votre manager + RH" />
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Mes forces clés</label>
            <textarea defaultValue="Négociation commerciale avancée · capacité d'analyse marché OHADA · proximité client" rows={2}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12px] text-ink focus:border-amber-deep focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Axes de progrès souhaités</label>
            <textarea defaultValue="Renforcer mes compétences Data Analyse · acquérir CRM avancé · gestion comptes enterprise" rows={2}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12px] text-ink focus:border-amber-deep focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Aspirations 18-24 mois</label>
            <textarea defaultValue="Passer Senior+ · prendre lead un compte stratégique · explorer le poste de Sales Lead régional" rows={2}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12px] text-ink focus:border-amber-deep focus:outline-none" />
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════ 3. ÉVALUATION MANAGER COMPÉTENCES ═══════════════ */
export function ManagerEvalCompetencesPage() {
  const manager = EMPLOYEES[12];      // Bineta - Marketing Lead
  const reportee = EMPLOYEES[3];      // Ibrahim
  const data = [
    { skill: 'Négociation commerciale', auto: 4, manager: 4, divergence: 0, preuves: 'Closing 3 deals enterprise Q2' },
    { skill: 'Analyse de données',      auto: 3, manager: 1, divergence: 2, preuves: 'Aucun livrable analytique observé' },
    { skill: 'Management d’équipe',     auto: 2, manager: 3, divergence: 1, preuves: 'Mentore junior depuis 6 mois' },
    { skill: 'React / TypeScript',      auto: 1, manager: 1, divergence: 0, preuves: 'Hors périmètre poste' },
    { skill: 'Paie SYSCOHADA',          auto: 0, manager: 0, divergence: 0, preuves: '—' },
    { skill: 'Sécurité applicative',    auto: 2, manager: 1, divergence: 1, preuves: 'Sensibilisation seule (formation 2025)' },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <CompetencesSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Évaluation manager compétences</h1>
          <p className="text-sm font-medium text-ink-500">Factualisation par preuves · divergences avec auto-éval · alertes biais auto</p>
        </div>
        <Button size="sm"><FileSignature size={14} /> Valider l'évaluation</Button>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={employeeName(reportee)} size="md" />
            <div>
              <p className="text-[14px] font-bold text-ink">{employeeName(reportee)}</p>
              <p className="text-[11px] font-medium text-ink-500">Évalué par {employeeName(manager)} · cycle 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill tone="info" dot={false}>Auto-éval soumise le 25 oct.</StatusPill>
            <StatusPill tone="warn" dot={false}>3 divergences détectées</StatusPill>
          </div>
        </div>
      </Card>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Compétence</th>
              <th className="px-3 py-2 text-center">Auto</th>
              <th className="px-3 py-2 text-center">Manager</th>
              <th className="px-3 py-2 text-center">Δ</th>
              <th className="px-3 py-2 text-left">Preuves factuelles</th>
              <th className="px-3 py-2 text-center">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {data.map((r) => (
                <tr key={r.skill} className={cn('hover:bg-amber/[0.03]', r.divergence >= 2 && 'bg-rose-50/40')}>
                  <td className="px-3 py-2 text-[12px] font-semibold text-ink">{r.skill}</td>
                  <td className="px-3 py-2 mono text-center text-[12px] text-ink-700">{r.auto}/5</td>
                  <td className="px-3 py-2 mono text-center text-[14px] font-bold text-amber-deep">{r.manager}/5</td>
                  <td className="px-3 py-2 text-center">
                    {r.divergence === 0
                      ? <CheckCircle2 size={14} className="mx-auto text-emerald-500" />
                      : <span className={cn('mono inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold',
                          r.divergence >= 2 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>±{r.divergence}</span>}
                  </td>
                  <td className="px-3 py-2 text-[11px] italic text-ink-700">{r.preuves}</td>
                  <td className="px-3 py-2 text-center">
                    {r.divergence >= 2
                      ? <Button variant="outline" size="sm">Discuter</Button>
                      : <span className="text-[11px] text-ink-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-warn/30 bg-warn/[0.05]">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-warn" />
          <div>
            <p className="text-[12px] font-bold text-ink">Alerte biais détectée — pattern P3</p>
            <p className="mt-1 text-[11px] font-medium text-ink-700">
              Divergence chronique &gt; 2 niveaux sur la compétence <strong>Analyse de données</strong> : auto-éval Ibrahim = 3 vs manager = 1. Risque de sous-évaluation manager ou sur-évaluation auto.
              Recommandation : <strong>discussion 1-1</strong> dédiée + recueil de preuves factuelles avant validation finale.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════ 4. PDC (Plans Développement Compétences) ═══════════════ */
export function PdcPage() {
  const me = EMPLOYEES[3];
  const actions = [
    { kind: 'formation' as const, title: 'Data Analytics avec Python (FRM-2026-0026)', target: 'Analyse de données : 1 → 3', deadline: '2026-09-30', status: 'in_progress' as const, completion: 35 },
    { kind: 'mentorat' as const,  title: 'Mentorat Modeste Yapo (Data Analyst senior)', target: 'Analyse de données : pratique terrain', deadline: '2026-12-31', status: 'in_progress' as const, completion: 50 },
    { kind: 'mission' as const,   title: 'Mission cross : reporting commerciale Q3', target: 'Application réelle des acquis', deadline: '2026-09-30', status: 'planned' as const, completion: 0 },
    { kind: 'certification' as const, title: 'Salesforce Admin (objectif Q4)', target: 'CRM avancé', deadline: '2026-12-15', status: 'planned' as const, completion: 0 },
    { kind: 'coaching' as const,  title: 'Coaching prise de parole (6 séances)', target: 'Présenter en réunion direction', deadline: '2026-10-31', status: 'in_progress' as const, completion: 60 },
    { kind: 'mobilite' as const,  title: 'Shadowing rôle Sales Lead régional (1 semaine)', target: 'Évolution N+1', deadline: '2027-Q1', status: 'planned' as const, completion: 0 },
  ];
  const completionAvg = Math.round(actions.reduce((s, a) => s + a.completion, 0) / actions.length);
  const kindMeta = {
    formation:     { label: 'Formation',     icon: '🎓', color: 'sky-100 text-sky-700' },
    mentorat:      { label: 'Mentorat',      icon: '🧭', color: 'emerald-100 text-emerald-700' },
    mission:       { label: 'Mission',       icon: '🎯', color: 'amber-100 text-amber-700' },
    certification: { label: 'Certification', icon: '🏆', color: 'violet-100 text-violet-700' },
    coaching:      { label: 'Coaching',      icon: '🤝', color: 'rose-100 text-rose-700' },
    mobilite:      { label: 'Mobilité',      icon: '🔄', color: 'cyan-100 text-cyan-700' },
  };
  return (
    <div className="animate-fade-up space-y-5">
      <CompetencesSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Plan de Développement Compétences (PDC)</h1>
          <p className="text-sm font-medium text-ink-500">Co-construit collab + manager · 6 actions sur 12 mois · signature ADVIST</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">+ Action</Button>
          <Button size="sm"><FileSignature size={14} /> Signer ADVIST</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Actions actives" value={String(actions.length)} unit="sur 12 mois" icon={ClipboardCheck} />
        <StatCard label="Complétion" value={`${completionAvg} %`} unit="moyenne pondérée" icon={TrendingUp} />
        <StatCard label="Compétences ciblées" value="4" unit="dont 2 critiques" icon={Target} />
        <StatCard label="Statut PDC" value="Co-construit" unit="à signer" icon={FileSignature} tone="amber" />
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={employeeName(me)} size="md" />
          <div className="flex-1">
            <p className="text-[14px] font-bold text-ink">{employeeName(me)} · PDC 2026</p>
            <p className="text-[11px] font-medium text-ink-500">Cycle déc. 2025 → déc. 2026 · validé par Bineta Gueye (Marketing Lead) · à signer ADVIST avant 15 déc.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {actions.map((a, i) => {
          const meta = kindMeta[a.kind];
          return (
            <Card key={i}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', meta.color)}>{meta.icon} {meta.label}</span>
                    <StatusPill tone={a.status === 'in_progress' ? 'info' : 'neutral'} dot={false}>{a.status === 'in_progress' ? 'En cours' : 'Planifié'}</StatusPill>
                  </div>
                  <p className="mt-2 text-[13px] font-semibold text-ink">{a.title}</p>
                  <p className="text-[11px] font-medium italic text-ink-500">Cible : {a.target}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">Échéance : {a.deadline}</p>
                </div>
                <span className="mono text-[14px] font-bold text-amber-deep">{a.completion} %</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-amber-deep" style={{ width: `${a.completion}%` }} />
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Indicateurs de succès du PDC" subtitle="Mesurables à la clôture annuelle · alimentent évaluation N+1" action={<Sparkles size={16} className="text-amber-deep" />} />
        <ul className="space-y-1.5 text-[12px] font-medium text-ink-700">
          <li className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" /><span>Niveau <strong>Analyse de données</strong> atteint 3/5 (vs 1 actuel) — mesuré à l'évaluation 2026</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" /><span>Certification Salesforce Admin <strong>obtenue</strong> avant fin 2026</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" /><span>Réalisation d'<strong>au moins 1 présentation</strong> au Comex (suivi coaching)</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" /><span>Mentorat 12 sessions hebdo avec Modeste Yapo · <strong>compte-rendu écrit</strong></span></li>
        </ul>
      </Card>
    </div>
  );
}

/* ═══════════════ 5. TALENTS / MOBILITÉ INTERNE PROPH3T ═══════════════ */
export function TalentsMobilitePage() {
  const opportunities = [
    { post: 'Sales Lead régional CI', family: 'Commercial', level: 'senior', open: true },
    { post: 'Lead Product Marketing',  family: 'Marketing', level: 'lead', open: true },
    { post: 'Customer Success Lead',   family: 'Commercial', level: 'senior', open: true },
  ];
  const matches = [
    { post: opportunities[0], candidate: EMPLOYEES[3], match: 78, strengths: ['Négociation 4/5','Closing enterprise prouvé'], gaps: ['Management équipe (3/5 vs 4 req.)'] },
    { post: opportunities[0], candidate: EMPLOYEES[10], match: 62, strengths: ['Customer success excellence'], gaps: ['Expérience régionale faible','Négociation 3/5'] },
    { post: opportunities[1], candidate: EMPLOYEES[12], match: 91, strengths: ['Marketing lead actuel','5+ ans expérience'], gaps: ['Aucun gap majeur'] },
    { post: opportunities[2], candidate: EMPLOYEES[10], match: 85, strengths: ['CSM senior','NPS +60'], gaps: ['Encadrement équipe (1→3)'] },
  ];
  const referents = SKILLS.slice(0, 3).map((s, i) => ({
    skill: s.name,
    employee: EMPLOYEES[(i * 5 + 1) % EMPLOYEES.length],
    level: 5 as const,
  }));
  return (
    <div className="animate-fade-up space-y-5">
      <CompetencesSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Talents &amp; Mobilité interne</h1>
          <p className="text-sm font-medium text-ink-500">Matching auto compétences ↔ postes ouverts via PROPH3T · experts référents · clauses de retour</p>
        </div>
        <Button size="sm"><ArrowRightLeft size={14} /> Recalculer matching</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Postes ouverts" value={String(opportunities.length)} unit="mobilité interne" icon={Target} />
        <StatCard label="Candidatures matchées" value={String(matches.length)} unit="≥ 40 % minimum" icon={ArrowRightLeft} />
        <StatCard label="Match ≥ 80 %" value={String(matches.filter((m) => m.match >= 80).length)} unit="prioritaires" icon={CheckCircle2} tone="default" />
        <StatCard label="Experts référents" value={String(referents.length)} unit="niveau 5" icon={Award} />
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Top candidatures matchées" subtitle="Score PROPH3T basé skills × compétences requises poste" className="mb-0" /></div>
        <div className="space-y-3 p-5 pt-0">
          {matches.map((m, i) => (
            <div key={i} className="rounded-xl border border-line p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={employeeName(m.candidate)} size="sm" />
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{employeeName(m.candidate)} <ArrowRight size={12} className="inline text-amber-deep" /> <span className="text-amber-deep">{m.post.post}</span></p>
                    <p className="text-[11px] font-medium text-ink-500">{m.candidate.role} → {m.post.level} · {m.post.family}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn('mono text-[24px] font-bold leading-none',
                    m.match >= 80 ? 'text-emerald-600' :
                    m.match >= 60 ? 'text-amber-700' :
                                    'text-rose-600')}>{m.match} %</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">match</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Forces</p>
                  <ul className="mt-0.5 space-y-0.5">{m.strengths.map((s, j) => <li key={j} className="text-[11px] font-medium text-ink-700">✓ {s}</li>)}</ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Gaps à combler</p>
                  <ul className="mt-0.5 space-y-0.5">{m.gaps.map((g, j) => <li key={j} className="text-[11px] font-medium text-ink-700">– {g}</li>)}</ul>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm">Voir profil</Button>
                {m.match >= 40 && <Button size="sm">Initier candidature</Button>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Experts référents (niveau 5)" subtitle="Single-points-of-knowledge à protéger · former binôme prioritaire" action={<Award size={16} className="text-amber-deep" />} />
        <ul className="space-y-1.5">
          {referents.map((r) => (
            <li key={r.skill} className="flex items-center gap-3 rounded-xl bg-surface2/40 px-3 py-2">
              <Avatar name={employeeName(r.employee)} size="xs" />
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-ink">{employeeName(r.employee)}</p>
                <p className="text-[10px] font-medium text-ink-500">Référent : <strong>{r.skill}</strong></p>
              </div>
              <span className="mono rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-bold text-emerald-700">5/5</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Politique mobilité interne Atlas" subtitle="Cadre déterministe — éviter contournement matching" action={<AlertTriangle size={16} className="text-amber-deep" />} />
        <ul className="space-y-1.5 text-[11px] font-medium text-ink-700">
          <li>• <strong>Seuil match minimum 40 %</strong> pour qu'une candidature soit recevable.</li>
          <li>• <strong>Match ≥ 80 %</strong> : décision DRH + manager d'accueil suffit.</li>
          <li>• <strong>Match 60-79 %</strong> : exige PDC d'accompagnement signé ADVIST.</li>
          <li>• <strong>Match &lt; 60 %</strong> : exige validation Comex + clause retour 6 mois.</li>
          <li>• <strong>Patron P10</strong> : toute mobilité accordée &lt; 40 % déclenche alerte audit auto.</li>
        </ul>
      </Card>
    </div>
  );
}
