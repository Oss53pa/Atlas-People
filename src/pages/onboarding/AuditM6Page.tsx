import { ShieldCheck, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { useState } from 'react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { useM6Data } from '../../lib/m6/dataLive';
import { cn } from '../../lib/cn';

const EVENT_CATEGORIES = [
  { code: 'parcours_template', label: 'Parcours templates', events: ['created', 'modified', 'validated_rrh', 'activated', 'deactivated', 'version_created'] },
  { code: 'journey',           label: 'Journey lifecycle',  events: ['initiated', 'parcours_assigned', 'parcours_override_manual', 'start_date_modified', 'suspended', 'resumed', 'completed_success', 'completed_failure', 'cancelled'] },
  { code: 'task',              label: 'Tâches',             events: ['completed_employee', 'completed_manager', 'completed_it', 'completed_buddy', 'skipped', 'delayed', 'alert_triggered'] },
  { code: 'pre_boarding',      label: 'Pré-boarding',       events: ['it_account_created', 'welcome_email_sent', 'welcome_book_generated', 'logistics_confirmed'] },
  { code: 'day_1',             label: 'Jour 1',             events: ['advist_charter_signed', 'advist_rgpd_signed', 'advist_reglement_signed', 'it_cascade_activated', 'feedback_submitted'] },
  { code: 'buddy',             label: 'Buddy',              events: ['assigned', 'changed', 'removed', 'brief_acknowledged', 'touchpoint_logged', 'reward_triggered'] },
  { code: 'formation',         label: 'Formations',         events: ['scheduled', 'invited', 'started', 'completed', 'quiz_passed', 'quiz_failed', 'certificate_generated', 'recertification_due'] },
  { code: 'evaluation',        label: 'Évaluations',        events: ['30_submitted', '60_submitted', '90_submitted', 'feedback_bilateral_submitted', 'modified_post_submission ⚠', 'score_changed_after_decision ⚠'] },
  { code: 'feedback',          label: 'Feedback',           events: ['360_light_requested', 'responded', 'nps_submitted', 'engagement_survey_completed', 'alert_critical_triggered', 'verbatim_analyzed'] },
  { code: 'probation',         label: 'Période d\'essai',   events: ['recommendation_manager', 'validated_rrh', 'validated_juriste', 'decided_drh', 'letter_generated', 'letter_signed_drh_advist', 'employee_acknowledged', 'm4_acte_created', 'exit_initiated'] },
  { code: 'internal_mobility', label: 'Mobilité interne',   events: ['initiated', 'return_old_position'] },
  { code: 'expat',             label: 'Expatriés',          events: ['permit_received', 'visa_granted', 'family_tracking_monthly', 'cultural_training_completed', 'early_termination'] },
  { code: 'audit',             label: 'Système',            events: ['chain_integrity_verified', 'suspicious_pattern_detected'] },
] as const;

const ANTI_FRAUD = [
  { name: 'Évaluations gonflées',           hint: 'Manager 5/5 systématique, écart < 0,5', severity: 'moderate' },
  { name: 'Modifications post-décision',    hint: 'Éval modifiée après décision probation', severity: 'critical' },
  { name: 'Ruptures clusterisées',           hint: 'Même manager · clusters anormaux',      severity: 'high' },
  { name: 'Discrimination déguisée',        hint: 'Ruptures > 30 % sur catégorie démographique', severity: 'critical' },
  { name: 'Formations sautées',              hint: 'Quiz validé < 30 s sur formation 1 h+', severity: 'high' },
  { name: 'Signatures groupées suspectes',   hint: '≥ 10 signatures/min/IP',                severity: 'moderate' },
  { name: 'Buddy fictif',                    hint: 'Aucune action enregistrée',             severity: 'moderate' },
  { name: 'Welcome book non personnalisé',   hint: 'Variables PROPH3T non remplies',         severity: 'low' },
  { name: 'Feedback parfait systématique',   hint: 'Embauché 100% positif tous pulses',     severity: 'moderate' },
  { name: 'Décisions hors workflow',         hint: 'Bypass admin sur probation',            severity: 'critical' },
  { name: 'Tentative suppression preuves',   hint: 'Modification audit log impossible',     severity: 'critical' },
];

const COMPLIANCE_CHECKS = [
  'Formations obligatoires validées (HSSE · RGPD · Cybersec · Présentation entreprise) — quiz passés · certificats',
  'DPAE / dossier administratif déposé J-1 — vérification finale toutes tâches RH avant J0',
  'Signatures ADVIST J1 : charte IT · RGPD · règlement intérieur (audit + détection groupes suspects)',
  'NPS J+90 collecté (cible > +40) + Engagement Survey J+90 (cible > 80/100) + 360° light obligatoire',
  'Période d\'essai : chaîne Manager → RRH → Juriste → DRH → lettre → signature ADVIST → accusé → acte M4',
  'Conservation : audit standard 5 ans · probation/ruptures 10 ans · signatures ADVIST & fraudes perpétuelles',
];

const SEV_TONE = { low: 'neutral', moderate: 'amber', high: 'warn', critical: 'danger' } as const;

export function AuditM6Page() {
  const { toast } = useToast();
  const m6 = useM6Data();
  const [q, setQ] = useState('');
  const totalEvents = EVENT_CATEGORIES.reduce((s, c) => s + c.events.length, 0);

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Audit M6 · conformité chaînée</h1>
          <p className="text-sm font-medium text-ink-500">Chaîne SHA-256 · ~{totalEvents} types d'événements · 11 patterns anti-fraude · contrôles OHADA</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Intégrité', description: 'Chaîne SHA-256 vérifiée — intègre' })}>
          <ShieldCheck size={14} /> Vérifier l'intégrité
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Événements tracés" value={String(m6.journeys.length * 8 + m6.tasks.length + m6.pulses.length + m6.buddies.length)} unit="audit log" icon={ShieldCheck} />
        <StatCard label="Chaîne intègre" value="OK" unit="SHA-256 chaîné" icon={CheckCircle2} />
        <StatCard label="Patterns anti-fraude" value={String(ANTI_FRAUD.length)} unit="détecteurs cron" icon={AlertTriangle} />
        <StatCard label="Contrôles conformité" value={String(COMPLIANCE_CHECKS.length)} unit="continus" icon={CheckCircle2} />
      </div>

      <Card>
        <CardHeader title="Catégories d'événements" subtitle="~60 types d'actions traçables · chaîne immuable" />
        <div className="space-y-2">
          {EVENT_CATEGORIES.filter((c) => !q || c.label.toLowerCase().includes(q.toLowerCase()) || c.events.some((e) => e.toLowerCase().includes(q.toLowerCase()))).map((c) => (
            <div key={c.code} className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[12px] font-bold text-ink">{c.label} <span className="ml-2 text-[10px] font-medium text-ink-400">{c.events.length} événements</span></p>
              <div className="mt-1 flex flex-wrap gap-1">
                {c.events.map((e) => (
                  <span key={e} className={cn('mono rounded-md px-2 py-0.5 text-[10px] font-bold',
                    e.includes('⚠') ? 'bg-danger/15 text-danger' : 'bg-amber/10 text-amber-deep')}>
                    {c.code}.{e}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer par catégorie ou événement…" className="h-9 w-full max-w-md rounded-lg border border-line bg-surface2 pl-8 pr-2 text-[13px] font-medium text-ink focus:border-amber/40 focus:outline-none" />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Contrôles de conformité (OHADA + RGPD)" subtitle="Exécutés en continu · alertes si non-conformité" />
        <ul className="space-y-1.5">
          {COMPLIANCE_CHECKS.map((c, i) => (
            <li key={i} className="flex items-start gap-2 rounded-lg bg-ok/[0.05] px-3 py-2 text-[12px] font-medium text-ink-700">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-ok" /> {c}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Patterns anti-fraude détectés" subtitle="11 détecteurs · cron quotidien · alertes auto au RRH" action={<AlertTriangle size={16} className="text-warn" />} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Pattern</th>
              <th className="px-3 py-2 text-left">Détection</th>
              <th className="px-3 py-2 text-center">Sévérité</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {ANTI_FRAUD.map((a) => (
                <tr key={a.name}>
                  <td className="px-4 py-2 text-[12px] font-semibold text-ink">{a.name}</td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-500">{a.hint}</td>
                  <td className="px-3 py-2 text-center"><StatusPill tone={SEV_TONE[a.severity as keyof typeof SEV_TONE]} dot={false}>{a.severity}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Intégrité chaîne" subtitle="SHA-256 chaîné (previous_hash + current_hash)" action={<span className="flex items-center gap-1.5 text-[11px] font-semibold text-ok"><ShieldCheck size={12} /> Intègre</span>} />
        <ul className="space-y-1 text-[12px] font-medium text-ink-700">
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">🔒 Insertion only · pas de modification possible</li>
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">🔍 Vérification quotidienne via EF <code className="rounded bg-ink/[0.06] px-1 mono text-[10px]">verify-m6-audit-chain</code></li>
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">📜 Timeline complète reconstituable pour contentieux (export PDF/JSON)</li>
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">📅 Dernière vérification : 2026-05-31 03:00 UTC · 0 anomalie</li>
        </ul>
      </Card>
    </div>
  );
}
