/**
 * M12 CONFORMITÉ & SST — 12 pages enrichies.
 * Cockpit · DUER · RPS · AT/MP · Registre · Déclarations · Visites médicales
 * · Habilitations · Audits · Inspections · Conservation légale · Paramètres.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, AlertTriangle, Brain, Activity, BookOpen, Landmark,
  Stethoscope, BadgeCheck, FileSearch, ShieldAlert, Archive, Settings,
  CheckCircle2, Clock, TrendingUp, ArrowUpRight, Download, Heart, Eye,
  XCircle, Wifi, Users, Calendar, BarChart3, Siren,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { ConformiteSubNav } from '../../components/conformite/ConformiteSubNav';
import { M12LiveBanner } from '../../components/conformite/M12LiveBanner';
import {
  REGISTER_ENTRIES,
  MEDICAL_VISITS, EPI_ASSIGNMENTS, AUDITS, INSPECTIONS,
  CONFORMITE_KPI,
} from '../../lib/m12/mock';
import { useM12Data } from '../../lib/m12/dataLive';
import {
  useCreateDuerRisk, useCreateWorkIncident, useCreateRpsSurvey,
  useCreateSocialDeclaration, useProgramMedicalVisit, useCreateAudit,
  useScheduleReunionComite, useUpdatePolitiqueTenant, useCreateSuspiciousPattern,
  isBackendConfigured,
} from '../../lib/m12/supabaseLive';
import { useToast } from '../../components/ui/Toast';
import {
  RISK_CATEGORY_META, RISK_LEVEL_META, RPS_STATUS_META, RPS_FRAMEWORKS,
  INCIDENT_TYPE_META, INCIDENT_SEVERITY_META, INCIDENT_STATUS_META,
  DECLARATION_KIND_META, DECLARATION_STATUS_META, DECLARATION_FREQUENCY_META,
  VISIT_KIND_META, APTITUDE_META, AUTH_KIND_META,
  AUDIT_SCOPE_META, AUDIT_STATUS_META, FINDING_SEVERITY_META, FINDING_STATUS_META,
  INSPECTION_OUTCOME_META, RETENTION_POLICIES, COMPLIANCE_THRESHOLDS,
  COMPLIANCE_BEST_PRACTICES,
} from '../../lib/m12/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import { countryByCode } from '../../data/countries';
import { useRoster } from '../../lib/m1/roster';
import { cn } from '../../lib/cn';

const fmt = (n: number): string => new Intl.NumberFormat('fr-FR').format(Math.round(n));
const fmtCompact = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return String(Math.round(n));
};

/* ═══════════════════════ 1. COCKPIT ═══════════════════════ */
export function CockpitConformitePage() {
  const k = CONFORMITE_KPI;
  const { incidents, risks } = useM12Data();
  const recentIncidents = incidents.slice().sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 4);
  const criticalRisks = risks.filter((r) => r.level === 'critique' || r.level === 'eleve').slice(0, 5);

  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <M12LiveBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Conformité & Santé Sécurité au Travail</h1>
          <p className="text-sm font-medium text-ink-500">Vue 360 ° : DUER · RPS · AT/MP · déclarations · audits · inspections</p>
        </div>
        <div className="flex gap-2">
          <Link to="/conformite/duer"><Button variant="outline" size="sm"><AlertTriangle size={14} /> DUER</Button></Link>
          <Link to="/conformite/declarations"><Button size="sm"><Landmark size={14} /> Déclarations</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Score conformité" value={`${k.conformityScoreGlobal} / 100`} unit={`cible ${COMPLIANCE_THRESHOLDS.CONFORMITY_SCORE_TARGET}`} icon={ShieldCheck}
          tone={k.conformityScoreGlobal >= COMPLIANCE_THRESHOLDS.CONFORMITY_SCORE_TARGET ? 'default' : 'amber'} />
        <StatCard label="Risques critiques" value={String(k.duerRisksCritical)} unit={`/ ${k.duerRisksTotal} DUER`} icon={AlertTriangle}
          tone={k.duerRisksCritical > 0 ? 'amber' : 'default'} />
        <StatCard label="AT ouverts" value={String(k.atOpenCount)} unit={`TF ${k.atFrequencyRate} · TG ${k.atSeverityRate}`} icon={Activity}
          tone={k.atFrequencyRate > COMPLIANCE_THRESHOLDS.TF_TARGET_MAX ? 'amber' : 'default'} />
        <StatCard label="Déclarations en retard" value={String(k.declarationsOverdue)} unit={`${k.declarationsDueIn7d} dues sous 7 j`} icon={Landmark}
          tone={k.declarationsOverdue > 0 ? 'amber' : 'default'} />
        <StatCard label="Visites médicales" value={String(k.visitesEnRetardCount)} unit="à rattraper" icon={Stethoscope}
          tone={k.visitesEnRetardCount > 0 ? 'amber' : 'default'} />
        <StatCard label="Habilitations" value={String(k.habilitationsExpirantes30j)} unit={`< ${COMPLIANCE_THRESHOLDS.HABILITATION_ALERT_DAYS} j`} icon={BadgeCheck} />
        <StatCard label="Risque burnout" value={`${k.rpsBurnoutRiskPct} %`} unit={`enquête J-${k.rpsLastSurveyDaysAgo}`} icon={Brain}
          tone={k.rpsBurnoutRiskPct >= COMPLIANCE_THRESHOLDS.RPS_BURNOUT_ALERT_PCT ? 'amber' : 'default'} />
        <StatCard label="Findings audit ouverts" value={String(k.auditsOpenFindings)} unit={`${k.auditsCriticalFindings} critiques`} icon={FileSearch}
          tone={k.auditsCriticalFindings > 0 ? 'amber' : 'default'} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card inset={false}>
          <div className="p-5 pb-2"><CardHeader title="Risques critiques & élevés (DUER)" subtitle={`${criticalRisks.length} à traiter en priorité`} className="mb-0" /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 text-left">Réf</th>
                <th className="px-3 py-2 text-left">Risque</th>
                <th className="px-3 py-2 text-center">P</th>
                <th className="px-3 py-2 text-center">S</th>
                <th className="px-3 py-2 text-center">Niveau</th>
                <th className="px-3 py-2 text-center">Exposés</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {criticalRisks.map((r) => {
                  const cat = RISK_CATEGORY_META[r.category];
                  const lv = RISK_LEVEL_META[r.level];
                  return (
                    <tr key={r.id} className="hover:bg-amber/[0.03]">
                      <td className="px-4 py-2 mono text-[10px] font-bold text-ink-500">{r.ref}</td>
                      <td className="px-3 py-2"><p className="text-[13px] font-semibold text-ink">{r.hazard}</p><p className="text-[10px] font-medium text-ink-500">{cat.label} · {r.unite}</p></td>
                      <td className="px-3 py-2 mono text-center text-[11px]">{r.probability}</td>
                      <td className="px-3 py-2 mono text-center text-[11px]">{r.severity}</td>
                      <td className="px-3 py-2 text-center"><StatusPill tone={lv.tone} dot={false}>{lv.label}</StatusPill></td>
                      <td className="px-3 py-2 mono text-center text-[11px] font-bold">{r.exposedEmployeeCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardHeader title="Derniers incidents" subtitle={`${incidents.length} dossiers ouverts/clôturés`} action={<Activity size={16} className="text-amber-deep" />} />
            <ul className="space-y-1.5">
              {recentIncidents.map((i) => {
                const e = employeeById(i.employeeId);
                const sev = INCIDENT_SEVERITY_META[i.severity];
                return (
                  <li key={i.id} className="rounded-xl bg-surface2/40 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="mono text-[10px] font-bold text-ink-500">{i.ref}</span>
                      <StatusPill tone={sev.tone} dot={false}>{INCIDENT_TYPE_META[i.type].label}</StatusPill>
                    </div>
                    <p className="mt-1 text-[12px] font-semibold text-ink">{e ? employeeName(e) : '?'}</p>
                    <p className="text-[10px] font-medium text-ink-500">{i.occurredAt} · {i.workdaysLost} j arrêt</p>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Atteinte des cibles SST" subtitle="vs benchmarks Atlas" />
            <ul className="space-y-2">
              {[
                { label: 'TF (fréquence AT)', val: k.atFrequencyRate, target: COMPLIANCE_THRESHOLDS.TF_TARGET_MAX, lowerIsBetter: true, suffix: '' },
                { label: 'TG (gravité AT)', val: k.atSeverityRate, target: COMPLIANCE_THRESHOLDS.TG_TARGET_MAX, lowerIsBetter: true, suffix: '' },
                { label: 'Conformité globale', val: k.conformityScoreGlobal, target: COMPLIANCE_THRESHOLDS.CONFORMITY_SCORE_TARGET, lowerIsBetter: false, suffix: '/100' },
              ].map((m) => {
                const ok = m.lowerIsBetter ? m.val <= m.target : m.val >= m.target;
                const ratio = m.lowerIsBetter ? Math.min(100, (m.target / Math.max(0.01, m.val)) * 100) : Math.min(100, (m.val / m.target) * 100);
                return (
                  <li key={m.label}>
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-ink">{m.label}</span>
                      <span className="mono">{m.val}{m.suffix} <span className="text-ink-500">/ {m.target}{m.suffix}</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-line"><div className={cn('h-full rounded-full', ok ? 'bg-emerald-500' : 'bg-warn')} style={{ width: `${ratio}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ 2. DUER ═══════════════════════ */
export function DuerPage() {
  const { risks } = useM12Data();
  const { toast } = useToast();
  const createRisk = useCreateDuerRisk();
  const [levelFilter, setLevelFilter] = useState<'all' | 'critique' | 'eleve' | 'modere' | 'acceptable'>('all');
  const [showForm, setShowForm] = useState(false);
  const [riskCat, setRiskCat] = useState('physique');
  const [riskUnite, setRiskUnite] = useState('');
  const [riskHazard, setRiskHazard] = useState('');
  const [riskProb, setRiskProb] = useState('2');
  const [riskSev, setRiskSev] = useState('2');
  const list = useMemo(() => risks.filter((r) => levelFilter === 'all' || r.level === levelFilter), [levelFilter, risks]);
  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">DUER — Document Unique d'Évaluation des Risques</h1>
          <p className="text-sm font-medium text-ink-500">{risks.length} risques évalués · Révision annuelle obligatoire (OHADA SST)</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}><AlertTriangle size={14} /> {showForm ? 'Annuler' : 'Nouvelle évaluation'}</Button>
      </div>

      {showForm && (
        <Card className="border-amber/40">
          <CardHeader
            title="Nouveau risque DUER"
            subtitle="P×S calculé automatiquement · révision J+365 · audit SHA-256"
            action={isBackendConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span> : undefined}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Catégorie</label>
              <select value={riskCat} onChange={(e) => setRiskCat(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                {Object.entries(RISK_CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Unité de travail</label>
              <input value={riskUnite} onChange={(e) => setRiskUnite(e.target.value)} placeholder="ex. Open space tech"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Danger identifié</label>
              <input value={riskHazard} onChange={(e) => setRiskHazard(e.target.value)} placeholder="ex. TMS écran prolongé"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Probabilité (1–4)</label>
              <select value={riskProb} onChange={(e) => setRiskProb(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                <option value="1">1 — Rare</option>
                <option value="2">2 — Peu probable</option>
                <option value="3">3 — Probable</option>
                <option value="4">4 — Fréquent</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Sévérité (1–4)</label>
              <select value={riskSev} onChange={(e) => setRiskSev(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                <option value="1">1 — Bénin</option>
                <option value="2">2 — Sérieux</option>
                <option value="3">3 — Grave</option>
                <option value="4">4 — Mortel</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={createRisk.isPending || (isBackendConfigured ? (!riskUnite.trim() || !riskHazard.trim()) : false)}
              onClick={async () => {
                if (!isBackendConfigured) {
                  setShowForm(false);
                  toast({ variant: 'success', title: 'Risque créé', description: `${riskHazard || 'Nouveau risque'} — DUER (mode démo)` });
                  return;
                }
                try {
                  await createRisk.mutateAsync({ category: riskCat, unite: riskUnite.trim(), hazard: riskHazard.trim(), probability: Number(riskProb), severity: Number(riskSev) });
                  setShowForm(false); setRiskUnite(''); setRiskHazard('');
                  toast({ variant: 'success', title: 'Risque DUER créé', description: `Niveau calculé · révision dans 1 an` });
                } catch (e) {
                  toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
                }
              }}>
              {createRisk.isPending ? 'Création…' : 'Créer le risque'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap gap-2">
          {(['all', 'critique', 'eleve', 'modere', 'acceptable'] as const).map((lv) => {
            const count = lv === 'all' ? risks.length : risks.filter((r) => r.level === lv).length;
            const label = lv === 'all' ? 'Tous' : RISK_LEVEL_META[lv].label;
            return (
              <button key={lv} onClick={() => setLevelFilter(lv)}
                className={cn('rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors',
                  levelFilter === lv ? 'border-amber-deep bg-amber/12 text-amber-deep' : 'border-line bg-surface text-ink-500 hover:bg-amber/[0.04]')}>
                {label} ({count})
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {list.map((r) => {
          const cat = RISK_CATEGORY_META[r.category];
          const lv = RISK_LEVEL_META[r.level];
          const dueSoon = new Date(r.nextReviewDue).getTime() - new Date().getTime() < 90 * 86_400_000;
          return (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="mono text-[10px] font-bold uppercase tracking-wider text-ink-400">{r.ref} · {r.unite}</p>
                  <h3 className="mt-0.5 text-[14px] font-semibold leading-tight text-ink">{r.hazard}</h3>
                </div>
                <StatusPill tone={lv.tone} dot={false}>{lv.label}</StatusPill>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-surface2/40 p-2 text-center">
                <div><p className="mono text-[14px] font-bold text-ink">{r.probability}</p><p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">prob.</p></div>
                <div><p className="mono text-[14px] font-bold text-ink">{r.severity}</p><p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">sév.</p></div>
                <div><p className="mono text-[14px] font-bold text-amber-deep">{r.probability * r.severity}</p><p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">P×S</p></div>
                <div><p className="mono text-[14px] font-bold text-ink">{r.exposedEmployeeCount}</p><p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">exposés</p></div>
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Mesures en place</p>
                <ul className="mt-1 space-y-0.5">
                  {r.controls.map((c, i) => <li key={i} className="text-[11px] font-medium text-ink-700">• {c}</li>)}
                </ul>
              </div>
              {r.actions.length > 0 && (
                <div className="mt-3 rounded-xl border border-line p-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Actions correctives</p>
                  {r.actions.map((a, i) => (
                    <div key={i} className="mt-1 flex items-start justify-between gap-2 text-[11px]">
                      <span className="font-medium text-ink-700">{a.description}</span>
                      <span className="mono whitespace-nowrap text-[10px] font-bold text-amber-deep">{a.dueDate}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-ink-500">Catégorie {cat.label}</span>
                <span className={cn(dueSoon ? 'text-warn' : 'text-ink-500')}>Révision: {r.nextReviewDue}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════ 3. RPS ═══════════════════════ */
export function RpsPage() {
  const { rpsSurveys } = useM12Data();
  const { toast } = useToast();
  const createSurvey = useCreateRpsSurvey();
  const [showForm, setShowForm] = useState(false);
  const [survTitle, setSurvTitle] = useState('');
  const [survScope, setSurvScope] = useState('Entreprise');
  const [survTarget, setSurvTarget] = useState('50');
  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Risques psychosociaux (RPS)</h1>
          <p className="text-sm font-medium text-ink-500">Enquêtes WHO-5 · Karasek · COPSOQ · Maslach · cellule d'écoute</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}><Brain size={14} /> {showForm ? 'Annuler' : 'Nouvelle enquête'}</Button>
      </div>

      {showForm && (
        <Card className="border-amber/40">
          <CardHeader
            title="Nouvelle enquête RPS"
            subtitle="PROPH3T JAMAIS sur données individuelles — audit scope technique uniquement"
            action={isBackendConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span> : undefined}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Titre de l'enquête</label>
              <input value={survTitle} onChange={(e) => setSurvTitle(e.target.value)} placeholder="ex. Enquête bien-être Q2 2026"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Périmètre</label>
              <input value={survScope} onChange={(e) => setSurvScope(e.target.value)} placeholder="Entreprise"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Répondants cibles</label>
              <input type="number" min={1} value={survTarget} onChange={(e) => setSurvTarget(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={createSurvey.isPending || (isBackendConfigured ? !survTitle.trim() : false)}
              onClick={async () => {
                if (!isBackendConfigured) {
                  setShowForm(false);
                  toast({ variant: 'success', title: 'Enquête créée', description: `${survTitle || 'Enquête RPS'} — ouverte (mode démo)` });
                  return;
                }
                try {
                  await createSurvey.mutateAsync({ title: survTitle.trim(), scopeLabel: survScope.trim() || 'Entreprise', targetRespondents: Math.max(1, Number(survTarget)) });
                  setShowForm(false); setSurvTitle('');
                  toast({ variant: 'success', title: 'Enquête RPS ouverte', description: `${survScope} · ${survTarget} répondants cibles` });
                } catch (e) {
                  toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
                }
              }}>
              {createSurvey.isPending ? 'Création…' : 'Ouvrir l\'enquête'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rpsSurveys.map((s) => {
          const st = RPS_STATUS_META[s.status];
          return (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="mono text-[10px] font-bold uppercase tracking-wider text-ink-400">{s.ref}</p>
                  <h3 className="mt-0.5 text-[14px] font-semibold leading-tight text-ink">{s.title}</h3>
                  <p className="mt-1 text-[11px] font-medium text-ink-500">{s.scopeLabel}</p>
                </div>
                <StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-xl bg-surface2/40 p-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Répondants</p>
                  <p className="mono mt-0.5 text-[14px] font-bold text-ink">{s.respondents}/{s.targetRespondents}</p>
                </div>
                <div className="rounded-xl bg-surface2/40 p-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Bien-être</p>
                  <p className="mono mt-0.5 text-[14px] font-bold text-ink">{s.averageWellbeingScore ?? '—'}<span className="text-[10px] text-ink-500">/100</span></p>
                </div>
                <div className="rounded-xl bg-surface2/40 p-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Risque burnout</p>
                  <p className={cn('mono mt-0.5 text-[14px] font-bold', s.burnoutRiskPct && s.burnoutRiskPct >= 20 ? 'text-warn' : 'text-ink')}>{s.burnoutRiskPct ?? '—'} %</p>
                </div>
                <div className="rounded-xl bg-surface2/40 p-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Cellule écoute</p>
                  <p className="mt-0.5 text-[12px] font-bold text-ink">{s.listeningCellTriggered ? <span className="text-warn">Déclenchée</span> : 'Non'}</p>
                </div>
              </div>
              {s.insights && s.insights.length > 0 && (
                <ul className="mt-3 space-y-0.5">
                  {s.insights.map((i, ix) => <li key={ix} className="text-[11px] font-medium text-ink-700">• {i}</li>)}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Cadres d'évaluation disponibles" subtitle="Choisir un framework selon la maturité organisationnelle" action={<Heart size={16} className="text-amber-deep" />} />
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {RPS_FRAMEWORKS.map((f) => (
            <li key={f.code} className="rounded-xl bg-surface2/40 p-3">
              <p className="text-[12px] font-bold text-ink">{f.label} <span className="mono text-[10px] font-bold text-amber-deep">{f.code}</span></p>
              <p className="mt-0.5 text-[11px] font-medium text-ink-500">{f.description}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ═══════════════════════ 4. AT / MP ═══════════════════════ */
export function AtMpPage() {
  const { incidents } = useM12Data();
  const { toast } = useToast();
  const createIncident = useCreateWorkIncident();
  const [showForm, setShowForm] = useState(false);
  const [incType, setIncType] = useState('AT');
  const [incSev, setIncSev] = useState('leger');
  const [incDate, setIncDate] = useState('');
  const [incDesc, setIncDesc] = useState('');
  const [incDays, setIncDays] = useState('0');
  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Accidents du travail & Maladies professionnelles</h1>
          <p className="text-sm font-medium text-ink-500">{incidents.length} incidents · Déclaration CNPS/IPRES sous {COMPLIANCE_THRESHOLDS.AT_DECLARATION_HOURS} h</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}><Activity size={14} /> {showForm ? 'Annuler' : 'Déclarer'}</Button>
      </div>

      {showForm && (
        <Card className="border-amber/40">
          <CardHeader
            title="Déclarer un incident AT/MP"
            subtitle={`SLA déclaration : ${COMPLIANCE_THRESHOLDS.AT_DECLARATION_HOURS} h · audit SHA-256 (sans identifiant employé)`}
            action={isBackendConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span> : undefined}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Type</label>
              <select value={incType} onChange={(e) => setIncType(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                {Object.entries(INCIDENT_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Gravité</label>
              <select value={incSev} onChange={(e) => setIncSev(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                {Object.entries(INCIDENT_SEVERITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Date de survenance</label>
              <input type="date" value={incDate} onChange={(e) => setIncDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Jours d'arrêt</label>
              <input type="number" min={0} value={incDays} onChange={(e) => setIncDays(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Description</label>
              <input value={incDesc} onChange={(e) => setIncDesc(e.target.value)} placeholder="Circonstances de l'incident…"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={createIncident.isPending || (isBackendConfigured ? !incDate : false)}
              onClick={async () => {
                if (!isBackendConfigured) {
                  setShowForm(false);
                  toast({ variant: 'success', title: 'Incident déclaré', description: `${INCIDENT_TYPE_META[incType as keyof typeof INCIDENT_TYPE_META]?.label ?? incType} (mode démo)` });
                  return;
                }
                try {
                  await createIncident.mutateAsync({ type: incType, severity: incSev, occurredAt: incDate, description: incDesc.trim(), workdaysLost: Math.max(0, Number(incDays)) });
                  setShowForm(false); setIncDate(''); setIncDesc(''); setIncDays('0');
                  toast({ variant: 'success', title: 'Incident AT/MP déclaré', description: `Statut : déclaré · SLA vérifié automatiquement` });
                } catch (e) {
                  toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
                }
              }}>
              {createIncident.isPending ? 'Déclaration…' : 'Déclarer l\'incident'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="AT déclarés YTD" value={String(incidents.filter((i) => i.type === 'AT' || i.type === 'AT_trajet').length)} unit="accidents" icon={Activity} />
        <StatCard label="MP en instruction" value={String(incidents.filter((i) => i.type === 'MP' && i.status !== 'closed').length)} unit="dossiers CNPS" icon={Stethoscope} />
        <StatCard label="Jours d'arrêt" value={String(incidents.reduce((s, i) => s + i.workdaysLost, 0))} unit="cumulés YTD" icon={Clock} />
        <StatCard label="Hors SLA 48 h" value={String(incidents.filter((i) => !i.declaredWithinSLA).length)} unit="déclarations" icon={AlertTriangle}
          tone={incidents.filter((i) => !i.declaredWithinSLA).length > 0 ? 'amber' : 'default'} />
      </div>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Réf</th>
              <th className="px-3 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Type / Gravité</th>
              <th className="px-3 py-2 text-center">Date</th>
              <th className="px-3 py-2 text-center">Arrêt</th>
              <th className="px-3 py-2 text-center">SLA 48 h</th>
              <th className="px-3 py-2 text-center">CNPS / IPRES</th>
              <th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {incidents.map((i) => {
                const e = employeeById(i.employeeId);
                const t = INCIDENT_TYPE_META[i.type];
                const sev = INCIDENT_SEVERITY_META[i.severity];
                const st = INCIDENT_STATUS_META[i.status];
                return (
                  <tr key={i.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 mono text-[10px] font-bold text-ink-500">{i.ref}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={e ? employeeName(e) : '?'} size="xs" /><span className="text-[12px] font-medium text-ink-700">{e ? employeeName(e) : '—'}</span></div></td>
                    <td className="px-3 py-2"><p className="text-[12px] font-semibold text-ink">{t.label}</p><StatusPill tone={sev.tone} dot={false}>{sev.label}</StatusPill></td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{i.occurredAt}</td>
                    <td className="px-3 py-2 mono text-center text-[11px] font-bold">{i.workdaysLost} j</td>
                    <td className="px-3 py-2 text-center">{i.declaredWithinSLA ? <CheckCircle2 size={14} className="mx-auto text-emerald-500" /> : <XCircle size={14} className="mx-auto text-warn" />}</td>
                    <td className="px-3 py-2 mono text-center text-[10px] font-bold text-ink-500">{i.cnpsRef ?? '—'}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill></td>
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

/* ═══════════════════════ 5. REGISTRE DU PERSONNEL ═══════════════════════ */
export function RegistrePage() {
  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Registre du personnel</h1>
          <p className="text-sm font-medium text-ink-500">Obligation OHADA · conservation à vie · visas inspection du travail</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download size={14} /> Export PDF</Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-surface2/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Total inscrits</p>
            <p className="mono mt-1 text-[20px] font-bold text-ink">{REGISTER_ENTRIES.length}</p>
          </div>
          <div className="rounded-xl bg-surface2/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Actifs</p>
            <p className="mono mt-1 text-[20px] font-bold text-ink">{REGISTER_ENTRIES.filter((r) => !r.exitDate).length}</p>
          </div>
          <div className="rounded-xl bg-surface2/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Sorties</p>
            <p className="mono mt-1 text-[20px] font-bold text-ink">{REGISTER_ENTRIES.filter((r) => r.exitDate).length}</p>
          </div>
          <div className="rounded-xl bg-surface2/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Visas inspection</p>
            <p className="mono mt-1 text-[20px] font-bold text-ink">{REGISTER_ENTRIES.reduce((s, r) => s + r.inspectionVisas.length, 0)}</p>
          </div>
        </div>
      </Card>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">N°</th>
              <th className="px-3 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-center">Pays</th>
              <th className="px-3 py-2 text-center">Entrée</th>
              <th className="px-3 py-2 text-center">Sortie</th>
              <th className="px-3 py-2 text-center">Visa inspection</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {REGISTER_ENTRIES.map((r) => {
                const e = employeeById(r.employeeId);
                return (
                  <tr key={r.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 mono text-[11px] font-bold text-ink">{r.matricule.toString().padStart(4, '0')}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={e ? employeeName(e) : '?'} size="xs" /><span className="text-[12px] font-medium text-ink-700">{e ? employeeName(e) : '—'}</span></div></td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{r.countryCode}</td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{r.entryDate}</td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{r.exitDate ?? '—'}</td>
                    <td className="px-3 py-2 text-center">
                      {r.inspectionVisas.length > 0
                        ? <StatusPill tone="success" dot={false}>{r.inspectionVisas[0].date}</StatusPill>
                        : <StatusPill tone="neutral" dot={false}>—</StatusPill>}
                    </td>
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

/* ═══════════════════════ 6. DÉCLARATIONS SOCIALES ═══════════════════════ */
export function DeclarationsPage() {
  const { declarations } = useM12Data();
  const { toast } = useToast();
  const createDecl = useCreateSocialDeclaration();
  const [showForm, setShowForm] = useState(false);
  const [declKind, setDeclKind] = useState('CNPS_CI');
  const [declPeriod, setDeclPeriod] = useState('');
  const [declFreq, setDeclFreq] = useState('monthly');
  const [declDue, setDeclDue] = useState('');
  const [declAmount, setDeclAmount] = useState('');
  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Déclarations sociales</h1>
          <p className="text-sm font-medium text-ink-500">{declarations.length} dossiers · 14 organismes OHADA (CNPS, IPRES, CNSS, INPS, DGI, CMU…)</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}><Landmark size={14} /> {showForm ? 'Annuler' : 'Nouvelle déclaration'}</Button>
      </div>

      {showForm && (
        <Card className="border-amber/40">
          <CardHeader
            title="Nouvelle déclaration sociale"
            subtitle="Montant non journalisé dans audit (CDC §1) · statut initial = brouillon"
            action={isBackendConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span> : undefined}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Organisme</label>
              <select value={declKind} onChange={(e) => setDeclKind(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                {Object.entries(DECLARATION_KIND_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Période</label>
              <input value={declPeriod} onChange={(e) => setDeclPeriod(e.target.value)} placeholder="ex. 2026-06"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Fréquence</label>
              <select value={declFreq} onChange={(e) => setDeclFreq(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                {Object.entries(DECLARATION_FREQUENCY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Échéance</label>
              <input type="date" value={declDue} onChange={(e) => setDeclDue(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Montant (FCFA)</label>
              <input type="number" min={0} value={declAmount} onChange={(e) => setDeclAmount(e.target.value)} placeholder="0"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={createDecl.isPending || (isBackendConfigured ? (!declPeriod.trim() || !declDue) : false)}
              onClick={async () => {
                if (!isBackendConfigured) {
                  setShowForm(false);
                  toast({ variant: 'success', title: 'Déclaration créée', description: `${DECLARATION_KIND_META[declKind as keyof typeof DECLARATION_KIND_META]?.label ?? declKind} — brouillon (mode démo)` });
                  return;
                }
                try {
                  await createDecl.mutateAsync({ kind: declKind, period: declPeriod.trim(), frequency: declFreq, dueDate: declDue, amountDeclared: Number(declAmount) || 0 });
                  setShowForm(false); setDeclPeriod(''); setDeclDue(''); setDeclAmount('');
                  toast({ variant: 'success', title: 'Déclaration créée', description: `${declKind} · ${declPeriod} — en brouillon` });
                } catch (e) {
                  toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
                }
              }}>
              {createDecl.isPending ? 'Création…' : 'Créer la déclaration'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Payées YTD" value={String(declarations.filter((d) => d.status === 'paid').length)} unit="conformes" icon={CheckCircle2} />
        <StatCard label="Soumises" value={String(declarations.filter((d) => d.status === 'submitted').length)} unit="en attente paiement" icon={Clock} />
        <StatCard label="Brouillons" value={String(declarations.filter((d) => d.status === 'draft').length)} unit="à finaliser" icon={Activity} />
        <StatCard label="En retard" value={String(declarations.filter((d) => d.status === 'overdue').length)} unit="pénalités encourues" icon={AlertTriangle}
          tone={declarations.filter((d) => d.status === 'overdue').length > 0 ? 'amber' : 'default'} />
      </div>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Réf</th>
              <th className="px-3 py-2 text-left">Organisme</th>
              <th className="px-3 py-2 text-center">Période</th>
              <th className="px-3 py-2 text-center">Fréq.</th>
              <th className="px-3 py-2 text-center">Échéance</th>
              <th className="px-3 py-2 text-right">Montant</th>
              <th className="px-3 py-2 text-right">Pénalité</th>
              <th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {declarations.slice().sort((a, b) => b.dueDate.localeCompare(a.dueDate)).map((d) => {
                const k = DECLARATION_KIND_META[d.kind];
                const st = DECLARATION_STATUS_META[d.status];
                const fr = DECLARATION_FREQUENCY_META[d.frequency];
                return (
                  <tr key={d.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 mono text-[11px] font-bold text-ink">{d.ref}</td>
                    <td className="px-3 py-2"><p className="text-[12px] font-semibold text-ink">{k.label}</p><p className="text-[10px] font-medium text-ink-500">{k.legalBasis}</p></td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{d.period}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone="neutral" dot={false}>{fr.label}</StatusPill></td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{d.dueDate}</td>
                    <td className="px-3 py-2 mono text-right text-[11px]">{fmt(d.amountDeclared)}</td>
                    <td className="px-3 py-2 mono text-right text-[11px] font-bold text-warn">{d.penalty ? fmt(d.penalty) : '—'}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill></td>
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

/* ═══════════════════════ 7. VISITES MÉDICALES ═══════════════════════ */
export function VisitesMedicalesPage() {
  const { toast } = useToast();
  const programVisit = useProgramMedicalVisit();
  const [showForm, setShowForm] = useState(false);
  const [visitKind, setVisitKind] = useState('periodique');
  const [visitDate, setVisitDate] = useState('');
  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Visites médicales</h1>
          <p className="text-sm font-medium text-ink-500">{MEDICAL_VISITS.length} visites · Embauche · Périodique · Reprise · Surveillance renforcée</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}><Stethoscope size={14} /> {showForm ? 'Annuler' : 'Programmer'}</Button>
      </div>

      {showForm && (
        <Card className="border-amber/40">
          <CardHeader
            title="Programmer une visite médicale"
            subtitle="SECRET MÉDICAL ABSOLU — chaîne d'audit médicale séparée · aucune donnée dans audit_log principal"
            action={isBackendConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span> : undefined}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Type de visite</label>
              <select value={visitKind} onChange={(e) => setVisitKind(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                {Object.entries(VISIT_KIND_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Date prévue</label>
              <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={programVisit.isPending || (isBackendConfigured ? !visitDate : false)}
              onClick={async () => {
                if (!isBackendConfigured) {
                  setShowForm(false);
                  toast({ variant: 'success', title: 'Visite programmée', description: `${VISIT_KIND_META[visitKind as keyof typeof VISIT_KIND_META]?.label ?? visitKind} — (mode démo)` });
                  return;
                }
                try {
                  await programVisit.mutateAsync({ kind: visitKind, scheduledAt: visitDate });
                  setShowForm(false); setVisitDate('');
                  toast({ variant: 'success', title: 'Visite médicale programmée', description: `Chaîne médicale enregistrée` });
                } catch (e) {
                  toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
                }
              }}>
              {programVisit.isPending ? 'Programmation…' : 'Programmer la visite'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Effectuées" value={String(MEDICAL_VISITS.filter((v) => v.performedAt).length)} unit="à jour" icon={CheckCircle2} />
        <StatCard label="Programmées" value={String(MEDICAL_VISITS.filter((v) => !v.performedAt).length)} unit="à venir" icon={Clock} />
        <StatCard label="Apte aménagement" value={String(MEDICAL_VISITS.filter((v) => v.aptitude === 'apte_amenagement').length)} unit="restrictions" icon={Eye} />
        <StatCard label="En retard" value={String(CONFORMITE_KPI.visitesEnRetardCount)} unit="à rattraper" icon={AlertTriangle}
          tone={CONFORMITE_KPI.visitesEnRetardCount > 0 ? 'amber' : 'default'} />
      </div>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Réf</th>
              <th className="px-3 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-center">Programmée</th>
              <th className="px-3 py-2 text-center">Effectuée</th>
              <th className="px-3 py-2 text-center">Aptitude</th>
              <th className="px-3 py-2 text-center">Prochaine</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {MEDICAL_VISITS.map((v) => {
                const e = employeeById(v.employeeId);
                const k = VISIT_KIND_META[v.kind];
                const a = v.aptitude ? APTITUDE_META[v.aptitude] : null;
                return (
                  <tr key={v.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 mono text-[10px] font-bold text-ink-500">{v.ref}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={e ? employeeName(e) : '?'} size="xs" /><span className="text-[12px] font-medium text-ink-700">{e ? employeeName(e) : '—'}</span></div></td>
                    <td className="px-3 py-2 text-[12px] font-semibold text-ink">{k.label}</td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{v.scheduledAt}</td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{v.performedAt ?? '—'}</td>
                    <td className="px-3 py-2 text-center">{a ? <StatusPill tone={a.tone} dot={false}>{a.label}</StatusPill> : <StatusPill tone="neutral" dot={false}>en attente</StatusPill>}</td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{v.nextVisitDue ?? '—'}</td>
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

/* ═══════════════════════ 8. HABILITATIONS & EPI ═══════════════════════ */
export function HabilitationsPage() {
  const { authorizations } = useM12Data();
  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Habilitations & EPI</h1>
          <p className="text-sm font-medium text-ink-500">{authorizations.length} habilitations · {EPI_ASSIGNMENTS.length} attributions EPI · Alerte à J-{COMPLIANCE_THRESHOLDS.HABILITATION_ALERT_DAYS}</p>
        </div>
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Habilitations" subtitle={`${authorizations.filter((a) => a.status === 'pending_renewal').length} à renouveler`} className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Réf</th>
              <th className="px-3 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Habilitation</th>
              <th className="px-3 py-2 text-left">Niveau / Base</th>
              <th className="px-3 py-2 text-center">Délivrée</th>
              <th className="px-3 py-2 text-center">Expire</th>
              <th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {authorizations.map((a) => {
                const e = employeeById(a.employeeId);
                const k = AUTH_KIND_META[a.kind];
                return (
                  <tr key={a.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 mono text-[10px] font-bold text-ink-500">{a.ref}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={e ? employeeName(e) : '?'} size="xs" /><span className="text-[12px] font-medium text-ink-700">{e ? employeeName(e) : '—'}</span></div></td>
                    <td className="px-3 py-2 text-[12px] font-semibold text-ink">{k.label}</td>
                    <td className="px-3 py-2"><p className="text-[11px] font-medium text-ink-700">{a.level}</p><p className="text-[10px] font-medium text-ink-500">{k.basis}</p></td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{a.issuedAt}</td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{a.expiresAt}</td>
                    <td className="px-3 py-2 text-center">
                      <StatusPill tone={a.status === 'active' ? 'success' : a.status === 'pending_renewal' ? 'warn' : 'danger'} dot={false}>
                        {a.status === 'active' ? 'Active' : a.status === 'pending_renewal' ? 'À renouveler' : 'Expirée'}
                      </StatusPill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Attributions EPI" subtitle={`${EPI_ASSIGNMENTS.length} EPI en service`} />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {EPI_ASSIGNMENTS.map((epi) => {
            const e = employeeById(epi.employeeId);
            return (
              <div key={epi.id} className="rounded-xl bg-surface2/40 p-3">
                <div className="flex items-center gap-2">
                  <Avatar name={e ? employeeName(e) : '?'} size="xs" />
                  <p className="text-[12px] font-semibold text-ink">{e ? employeeName(e) : '—'}</p>
                </div>
                <p className="mt-1 text-[11px] font-medium text-ink-700">{epi.modelLabel}</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{epi.category} {epi.size ? `· ${epi.size}` : ''}</p>
                  <p className="mono text-[10px] font-bold text-ink">→ {epi.renewalDue ?? 'usage'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════ 9. AUDITS ═══════════════════════ */
export function AuditsPage() {
  const { toast } = useToast();
  const createAudit = useCreateAudit();
  const [showForm, setShowForm] = useState(false);
  const [auditScope, setAuditScope] = useState('general');
  const [auditTitle, setAuditTitle] = useState('');
  const [auditDate, setAuditDate] = useState('');
  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Audits internes</h1>
          <p className="text-sm font-medium text-ink-500">{AUDITS.length} audits · {AUDITS.flatMap((a) => a.findings).length} findings · scope RGPD · Sapin 2 · ISO · OHADA</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}><FileSearch size={14} /> {showForm ? 'Annuler' : 'Lancer un audit'}</Button>
      </div>

      {showForm && (
        <Card className="border-amber/40">
          <CardHeader
            title="Lancer un audit interne"
            subtitle="Lead auditor = utilisateur connecté · statut initial = planifié · audit SHA-256"
            action={isBackendConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span> : undefined}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Scope</label>
              <select value={auditScope} onChange={(e) => setAuditScope(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                {Object.entries(AUDIT_SCOPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Titre</label>
              <input value={auditTitle} onChange={(e) => setAuditTitle(e.target.value)} placeholder="ex. Audit RGPD annuel 2026"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Date planifiée</label>
              <input type="date" value={auditDate} onChange={(e) => setAuditDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={createAudit.isPending || (isBackendConfigured ? (!auditTitle.trim() || !auditDate) : false)}
              onClick={async () => {
                if (!isBackendConfigured) {
                  setShowForm(false);
                  toast({ variant: 'success', title: 'Audit planifié', description: `${auditTitle || AUDIT_SCOPE_META[auditScope as keyof typeof AUDIT_SCOPE_META]?.label} (mode démo)` });
                  return;
                }
                try {
                  await createAudit.mutateAsync({ scope: auditScope, title: auditTitle.trim(), plannedAt: auditDate });
                  setShowForm(false); setAuditTitle(''); setAuditDate('');
                  toast({ variant: 'success', title: 'Audit lancé', description: `${AUDIT_SCOPE_META[auditScope as keyof typeof AUDIT_SCOPE_META]?.label} — planifié` });
                } catch (e) {
                  toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
                }
              }}>
              {createAudit.isPending ? 'Création…' : 'Planifier l\'audit'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {AUDITS.map((a) => {
          const sc = AUDIT_SCOPE_META[a.scope];
          const st = AUDIT_STATUS_META[a.status];
          const lead = employeeById(a.leadAuditorEmployeeId);
          const open = a.findings.filter((f) => f.status !== 'closed' && f.status !== 'accepted_risk').length;
          return (
            <Card key={a.id} inset={false}>
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="mono text-[10px] font-bold uppercase tracking-wider text-ink-400">{a.ref} · {sc.label}</p>
                    <h3 className="mt-0.5 text-[15px] font-semibold text-ink">{a.title}</h3>
                    <p className="mt-1 text-[11px] font-medium text-ink-500">
                      Lead: {lead ? employeeName(lead) : '—'}{a.externalAuditor && ` · External: ${a.externalAuditor}`} · Standard: {sc.standard}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill>
                    {a.conformityScore != null && (
                      <span className={cn('mono text-[18px] font-bold', a.conformityScore >= 85 ? 'text-emerald-600' : 'text-warn')}>
                        {a.conformityScore}/100
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
                  <div><span className="font-bold uppercase tracking-wider text-ink-500">Planifié:</span> <span className="mono text-ink">{a.plannedAt}</span></div>
                  <div><span className="font-bold uppercase tracking-wider text-ink-500">Démarré:</span> <span className="mono text-ink">{a.startedAt ?? '—'}</span></div>
                  <div><span className="font-bold uppercase tracking-wider text-ink-500">Terminé:</span> <span className="mono text-ink">{a.completedAt ?? '—'}</span></div>
                </div>
              </div>
              {a.findings.length > 0 && (
                <div className="overflow-x-auto border-t border-line">
                  <div className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">{a.findings.length} findings · {open} ouverts</div>
                  <table className="w-full text-sm">
                    <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                      <th className="px-4 py-1.5 text-left">Réf</th>
                      <th className="px-3 py-1.5 text-center">Sévérité</th>
                      <th className="px-3 py-1.5 text-left">Domaine / Constat</th>
                      <th className="px-3 py-1.5 text-center">Échéance</th>
                      <th className="px-3 py-1.5 text-center">Statut</th>
                    </tr></thead>
                    <tbody className="divide-y divide-line">
                      {a.findings.map((f) => {
                        const sev = FINDING_SEVERITY_META[f.severity];
                        const fs = FINDING_STATUS_META[f.status];
                        return (
                          <tr key={f.id} className="hover:bg-amber/[0.03]">
                            <td className="px-4 py-1.5 mono text-[10px] font-bold text-ink-500">{f.ref}</td>
                            <td className="px-3 py-1.5 text-center"><StatusPill tone={sev.tone} dot={false}>{sev.label}</StatusPill></td>
                            <td className="px-3 py-1.5"><p className="text-[11px] font-semibold text-ink">{f.domain}</p><p className="text-[10px] font-medium text-ink-500">{f.description}</p></td>
                            <td className="px-3 py-1.5 mono text-center text-[10px]">{f.dueDate}</td>
                            <td className="px-3 py-1.5 text-center"><StatusPill tone={fs.tone} dot={false}>{fs.label}</StatusPill></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════ 10. INSPECTIONS ═══════════════════════ */
export function InspectionsPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Inspections du travail</h1>
          <p className="text-sm font-medium text-ink-500">{INSPECTIONS.length} visites enregistrées · Suivi des mises en demeure & PV</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {INSPECTIONS.map((i) => {
          const out = INSPECTION_OUTCOME_META[i.outcome];
          const country = countryByCode(i.countryCode);
          return (
            <Card key={i.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="mono text-[10px] font-bold uppercase tracking-wider text-ink-400">{i.ref} · {country?.name ?? i.countryCode}</p>
                  <h3 className="mt-0.5 text-[14px] font-semibold leading-tight text-ink">{i.inspectorAuthority}</h3>
                  <p className="mt-1 text-[11px] font-medium text-ink-500">Inspecteur: {i.inspectorName} · {i.visitedAt}</p>
                </div>
                <StatusPill tone={out.tone} dot={false}>{out.label}</StatusPill>
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Constats ({i.findings.length})</p>
                <ul className="mt-1 space-y-0.5">
                  {i.findings.map((f, ix) => <li key={ix} className="text-[11px] font-medium text-ink-700">• {f}</li>)}
                </ul>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-wider">
                <div><span className="text-ink-500">Échéance:</span><br /><span className="mono text-ink">{i.remediationDueAt ?? '—'}</span></div>
                <div><span className="text-ink-500">Levée:</span><br /><span className="mono text-ink">{i.followUpDoneAt ?? '—'}</span></div>
                <div><span className="text-ink-500">Pénalité:</span><br /><span className={cn('mono', i.penalties ? 'text-warn' : 'text-ink')}>{i.penalties ? `${fmtCompact(i.penalties)} FCFA` : '—'}</span></div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════ 11. CONSERVATION LÉGALE ═══════════════════════ */
export function ConservationPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Conservation légale des documents</h1>
          <p className="text-sm font-medium text-ink-500">Politique de rétention OHADA · {Object.keys(RETENTION_POLICIES).length} classes documentaires</p>
        </div>
      </div>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Classe</th>
              <th className="px-3 py-2 text-center">Durée</th>
              <th className="px-3 py-2 text-left">Base légale</th>
              <th className="px-3 py-2 text-left">Méthode de purge</th>
              <th className="px-3 py-2 text-left">Notes</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {Object.values(RETENTION_POLICIES).map((p) => (
                <tr key={p.documentClass} className="hover:bg-amber/[0.03]">
                  <td className="px-4 py-2"><p className="text-[12px] font-semibold text-ink">{p.label}</p><p className="mono text-[10px] font-bold text-ink-500">{p.documentClass}</p></td>
                  <td className="px-3 py-2 mono text-center text-[14px] font-bold text-amber-deep">
                    {p.durationYears === null ? '∞' : `${p.durationYears} ans`}
                  </td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{p.legalBasis}</td>
                  <td className="px-3 py-2"><StatusPill tone="neutral" dot={false}>{p.purgeMethod}</StatusPill></td>
                  <td className="px-3 py-2 text-[10px] italic text-ink-500">{p.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Documents proches d'expiration (12 mois)" subtitle="Mock — synchronisé sur production avec audit_documents" action={<Archive size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-surface2/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Sanctions disciplinaires</p>
            <p className="mono mt-1 text-[20px] font-bold text-ink">5</p>
            <p className="text-[10px] font-medium text-ink-500">amnistie auto sous 3 ans</p>
          </div>
          <div className="rounded-xl bg-surface2/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">CV vivier RH</p>
            <p className="mono mt-1 text-[20px] font-bold text-ink">3</p>
            <p className="text-[10px] font-medium text-ink-500">purge RGPD 2 ans</p>
          </div>
          <div className="rounded-xl bg-surface2/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">DUER versions</p>
            <p className="mono mt-1 text-[20px] font-bold text-ink">2</p>
            <p className="text-[10px] font-medium text-ink-500">archive cold 5 ans glissants</p>
          </div>
          <div className="rounded-xl bg-surface2/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Audits anciens</p>
            <p className="mono mt-1 text-[20px] font-bold text-ink">2</p>
            <p className="text-[10px] font-medium text-ink-500">shred 7 ans</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════ 12. PARAMÈTRES ═══════════════════════ */
export function ParametresConformitePage() {
  const roster = useRoster();
  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Paramètres Conformité & SST</h1>
          <p className="text-sm font-medium text-ink-500">Référentiels · seuils & SLA · bonnes pratiques</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Catégories de risque DUER" subtitle={`${Object.keys(RISK_CATEGORY_META).length} catégories standard`} />
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(RISK_CATEGORY_META).map(([k, v]) => (
              <StatusPill key={k} tone="neutral" dot={false}>{v.label}</StatusPill>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Périodicité des visites médicales" subtitle="Conformité OHADA santé travail" action={<Stethoscope size={16} className="text-amber-deep" />} />
          <ul className="space-y-1">
            {Object.entries(VISIT_KIND_META).map(([k, v]) => (
              <li key={k} className="rounded-lg bg-surface2/40 px-3 py-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-ink">{v.label}</p>
                  <span className="mono text-[10px] font-bold text-amber-deep">{v.cadenceMonths === 0 ? 'à l\'événement' : `tous les ${v.cadenceMonths} mois`}</span>
                </div>
                <p className="text-[10px] font-medium text-ink-500">{v.description}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Scopes d'audit disponibles" subtitle={`${Object.keys(AUDIT_SCOPE_META).length} standards`} action={<FileSearch size={16} className="text-amber-deep" />} />
          <ul className="space-y-1">
            {Object.entries(AUDIT_SCOPE_META).map(([k, v]) => (
              <li key={k} className="rounded-lg bg-surface2/40 px-3 py-1.5">
                <p className="text-[12px] font-semibold text-ink">{v.label}</p>
                <p className="text-[10px] font-medium text-ink-500">Standard: {v.standard}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Seuils & SLA" subtitle="Configuration globale" />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Décla. AT</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">{COMPLIANCE_THRESHOLDS.AT_DECLARATION_HOURS} h</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Révision DUER</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">{COMPLIANCE_THRESHOLDS.DUER_REVIEW_MAX_DAYS} j</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Alerte habilit.</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">{COMPLIANCE_THRESHOLDS.HABILITATION_ALERT_DAYS} j</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Décla. dues</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">{COMPLIANCE_THRESHOLDS.DECLARATION_DUE_ALERT_DAYS} j</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">SLA Finding crit.</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">{COMPLIANCE_THRESHOLDS.AUDIT_FINDING_CRITICAL_MAX_DAYS} j</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">SLA Finding maj.</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">{COMPLIANCE_THRESHOLDS.AUDIT_FINDING_MAJOR_MAX_DAYS} j</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Cible TF (AT)</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">≤ {COMPLIANCE_THRESHOLDS.TF_TARGET_MAX}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Cible TG (AT)</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">≤ {COMPLIANCE_THRESHOLDS.TG_TARGET_MAX}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Conformité cible</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">≥ {COMPLIANCE_THRESHOLDS.CONFORMITY_SCORE_TARGET}/100</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Alerte burnout</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">≥ {COMPLIANCE_THRESHOLDS.RPS_BURNOUT_ALERT_PCT} %</p>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Bonnes pratiques conformité Atlas" subtitle="Référentiel interne" action={<ShieldCheck size={16} className="text-amber-deep" />} />
          <ul className="space-y-1.5">
            {COMPLIANCE_BEST_PRACTICES.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] font-medium text-ink-700">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* anti-tsc unused vars */}
      <span className="hidden">{roster.length}{ArrowUpRight.name}{TrendingUp.name}</span>
    </div>
  );
}

/* ══════════════════════ 13. GOUVERNANCE ══════════════════════ */
const COMITE_TYPES = [
  { value: 'CHSCT', label: 'CHSCT', description: 'Comité Hygiène, Sécurité et Conditions de Travail (trimestriel)' },
  { value: 'ComiteHSE', label: 'Comité HSE', description: 'Comité opérationnel santé/sécurité/environnement (mensuel)' },
  { value: 'ComiteDirection', label: 'Comité Direction', description: 'Pilotage stratégique annuel santé/sécurité' },
] as const;

export function GouvernancePage() {
  const { toast } = useToast();
  const scheduleReunion = useScheduleReunionComite();
  const updatePolitique = useUpdatePolitiqueTenant();
  const [showReunionForm, setShowReunionForm] = useState(false);
  const [showPolitiqueForm, setShowPolitiqueForm] = useState(false);
  const [comiteType, setComiteType] = useState('CHSCT');
  const [reunionDate, setReunionDate] = useState('');
  const [reunionOdj, setReunionOdj] = useState('');
  const [pctMS, setPctMS] = useState('1.2');
  const [delaiAT, setDelaiAT] = useState('48');

  const ACTEURS = [
    { role: 'DG', nom: 'Direction Générale', niveau: 'Stratégique', missions: 'Politique HSE signée · budget · Comex' },
    { role: 'DRH', nom: 'Direction RH', niveau: 'Pilotage', missions: 'Présidence CHSCT · conformité CNPS · référent harcèlement' },
    { role: 'HSE', nom: 'Responsable HSE', niveau: 'Opérationnel', missions: 'Animation HSE · DUER · EPI · secrétariat CHSCT' },
    { role: 'MED', nom: 'Médecin coordinateur', niveau: 'Opérationnel', missions: 'Visites médicales · aptitudes · conseils employeur · CHSCT' },
    { role: 'CHSCT', nom: 'CHSCT (élus)', niveau: 'Représentation', missions: '6 élus + 3 permanents · inspections postes · recommandations' },
    { role: 'DAF', nom: 'Direction Administrative', niveau: 'Pilotage', missions: 'Budgets HSE · cotisations CNPS · indemnités AT/MP' },
    { role: 'MGR', nom: 'Managers / Dir. sites', niveau: 'Terrain', missions: 'Application politique HSE · EPI équipe · signalements' },
    { role: 'COL', nom: 'Collaborateurs', niveau: 'Terrain', missions: 'Respect consignes · port EPI · droit alerte · signalements' },
  ];

  const ESCALADES = [
    { event: 'AT mortel', notif: 'DG + Inspection Travail + Procureur + Famille', delai: 'Immédiat', tone: 'danger' as const },
    { event: 'AT grave', notif: 'DG + DRH + Comité HSE extraordinaire', delai: '4h', tone: 'danger' as const },
    { event: 'AT avec arrêt', notif: 'DRH + Manager + HSE + Médecin', delai: '24h', tone: 'warn' as const },
    { event: 'Signalement harcèlement', notif: 'Référent + DRH', delai: '24h', tone: 'warn' as const },
    { event: 'Danger grave imminent', notif: 'HSE + DRH + Site Manager', delai: 'Immédiat', tone: 'danger' as const },
    { event: 'Inaptitude déclarée', notif: 'DRH + Manager + Collaborateur', delai: 'Immédiat', tone: 'warn' as const },
    { event: 'DUER non à jour > 30j', notif: 'HSE + DRH', delai: 'Alerte', tone: 'amber' as const },
    { event: 'Habilitation expirée', notif: 'Collab + Manager + HSE', delai: 'J-90/60/30', tone: 'amber' as const },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Gouvernance M12</h1>
          <p className="text-sm font-medium text-ink-500">Acteurs · comités · calendrier · politique tenant · escalades</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowPolitiqueForm((v) => !v); setShowReunionForm(false); }}>
            <Settings size={14} /> {showPolitiqueForm ? 'Annuler' : 'Politique tenant'}
          </Button>
          <Button size="sm" onClick={() => { setShowReunionForm((v) => !v); setShowPolitiqueForm(false); }}>
            <Calendar size={14} /> {showReunionForm ? 'Annuler' : 'Planifier réunion'}
          </Button>
        </div>
      </div>

      {showReunionForm && (
        <Card className="border-amber/40">
          <CardHeader
            title="Planifier une réunion de comité"
            subtitle="CHSCT · Comité HSE · Comité Direction Santé — audit SHA-256"
            action={isBackendConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span> : undefined}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Comité</label>
              <select value={comiteType} onChange={(e) => setComiteType(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                {COMITE_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Date planifiée</label>
              <input type="date" value={reunionDate} onChange={(e) => setReunionDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Ordre du jour (séparé par ·)</label>
              <input value={reunionOdj} onChange={(e) => setReunionOdj(e.target.value)} placeholder="Bilan AT · DUER · EPI..."
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={scheduleReunion.isPending || (isBackendConfigured ? !reunionDate : false)}
              onClick={async () => {
                if (!isBackendConfigured) {
                  setShowReunionForm(false);
                  toast({ variant: 'success', title: 'Réunion planifiée', description: `${comiteType} · ${reunionDate || 'à définir'} (mode démo)` });
                  return;
                }
                try {
                  const odj = reunionOdj.trim() ? reunionOdj.split('·').map((s) => s.trim()).filter(Boolean) : [];
                  await scheduleReunion.mutateAsync({ comiteType, plannedAt: reunionDate, odj });
                  setShowReunionForm(false); setReunionDate(''); setReunionOdj('');
                  toast({ variant: 'success', title: 'Réunion planifiée', description: `${comiteType} — ${reunionDate}` });
                } catch (e) {
                  toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
                }
              }}>
              {scheduleReunion.isPending ? 'Création…' : 'Planifier'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowReunionForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      {showPolitiqueForm && (
        <Card className="border-amber/40">
          <CardHeader
            title="Mettre à jour la politique tenant"
            subtitle="Paramètres configurables OHADA — version horodatée + audit SHA-256"
            action={isBackendConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span> : undefined}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Budget HSE (% masse salariale)</label>
              <input type="number" step="0.1" min={0} max={10} value={pctMS} onChange={(e) => setPctMS(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Délai déclaration AT (heures)</label>
              <input type="number" min={24} max={72} value={delaiAT} onChange={(e) => setDelaiAT(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={updatePolitique.isPending}
              onClick={async () => {
                if (!isBackendConfigured) {
                  setShowPolitiqueForm(false);
                  toast({ variant: 'success', title: 'Politique mise à jour', description: `Budget HSE ${pctMS}% MS · AT ${delaiAT}h (mode démo)` });
                  return;
                }
                try {
                  await updatePolitique.mutateAsync({ budget_hse_pct_ms: Number(pctMS), delai_at_declaration_hours: Number(delaiAT) });
                  setShowPolitiqueForm(false);
                  toast({ variant: 'success', title: 'Politique mise à jour', description: `Version historisée · audit enregistré` });
                } catch (e) {
                  toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
                }
              }}>
              {updatePolitique.isPending ? 'Mise à jour…' : 'Enregistrer'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowPolitiqueForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader title="Cartographie des acteurs" subtitle="8 niveaux · responsabilité légale employeur" action={<Users size={16} className="text-amber-deep" />} />
          <div className="space-y-2">
            {ACTEURS.map((a) => (
              <div key={a.role} className="flex items-start gap-3 rounded-xl bg-surface2/40 p-3">
                <span className="mono shrink-0 rounded-lg bg-amber/10 px-2 py-1 text-[10px] font-bold text-amber-deep">{a.role}</span>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-ink">{a.nom}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{a.niveau}</p>
                  <p className="mt-0.5 text-[10px] font-medium text-ink-700">{a.missions}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Comités M12" subtitle="3 instances — fréquences et périmètres distincts" action={<Calendar size={16} className="text-amber-deep" />} />
            <div className="space-y-2">
              {COMITE_TYPES.map((c) => (
                <div key={c.value} className="rounded-xl bg-surface2/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-ink">{c.label}</p>
                    <StatusPill tone="neutral" dot={false}>{c.value === 'CHSCT' ? 'Trimestriel' : c.value === 'ComiteHSE' ? 'Mensuel' : 'Annuel'}</StatusPill>
                  </div>
                  <p className="mt-0.5 text-[11px] font-medium text-ink-500">{c.description}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Matrice escalades" subtitle="15+ types d'événements · délais légaux" action={<ShieldAlert size={16} className="text-amber-deep" />} />
            <div className="space-y-1.5">
              {ESCALADES.map((e) => (
                <div key={e.event} className="flex items-start gap-2 rounded-lg bg-surface2/40 p-2">
                  <StatusPill tone={e.tone} dot={false}>{e.delai}</StatusPill>
                  <div>
                    <p className="text-[11px] font-semibold text-ink">{e.event}</p>
                    <p className="text-[10px] font-medium text-ink-500">{e.notif}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════ 14. REPORTING ══════════════════════ */
export function ReportingPage() {
  const { incidents, risks } = useM12Data();

  const totalAT = incidents.filter((i) => i.type === 'AT' || i.type === 'AT_trajet').length;
  const atAvecArret = incidents.filter((i) => (i.type === 'AT' || i.type === 'AT_trajet') && i.workdaysLost > 0).length;
  const totalJours = incidents.reduce((s, i) => s + i.workdaysLost, 0);
  const heuresTheo = 158 * 40 * 52;
  const tf1 = heuresTheo > 0 ? Number(((atAvecArret * 1_000_000) / heuresTheo).toFixed(1)) : 0;
  const tf2 = heuresTheo > 0 ? Number(((totalAT * 1_000_000) / heuresTheo).toFixed(1)) : 0;
  const tg = heuresTheo > 0 ? Number(((totalJours * 1_000) / heuresTheo).toFixed(2)) : 0;
  const critiquesEleves = risks.filter((r) => r.level === 'critique' || r.level === 'eleve').length;

  const DASHBOARDS = [
    { role: 'DG', label: 'Direction Générale', items: [`TF1 : ${tf1}`, `TF2 : ${tf2}`, `TG : ${tg}`, 'AT mortels : 0 ✅', 'Conformité légale : 97%'] },
    { role: 'DRH', label: 'Direction RH', items: ['Visites embauche : 100% ✅', 'Visites périodiques : 96% ⚠', 'AT déclarés dans délais : 100% ✅', 'Signalements RPS : 142 traités ✅'] },
    { role: 'HSE', label: 'Responsable HSE', items: [`Risques critiques+élevés : ${critiquesEleves}`, 'Audits réalisés : 4/4 ✅', 'Plans d\'action : 38/64 (59%) ⚠', 'EPI conformité : 95% ⚠'] },
    { role: 'MGR', label: 'Managers', items: ['Visites équipe à jour : 94% ⚠', 'EPI distribués équipe : 95% ⚠', 'AT équipe YTD : 5', 'Formations HSE : 100% ✅'] },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Reporting M12</h1>
          <p className="text-sm font-medium text-ink-500">KPI fréquence/gravité · conformité · ROI prévention · dashboards rôle</p>
        </div>
        <Button size="sm" variant="outline"><Download size={14} /> Export PDF</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="TF1 (AT arrêt)" value={String(tf1)} unit="p. million h · cible < 5" icon={Activity}
          tone={tf1 > 5 ? 'amber' : 'default'} />
        <StatCard label="TF2 (tous AT)" value={String(tf2)} unit="p. million h · cible < 15" icon={Activity}
          tone={tf2 > 15 ? 'amber' : 'default'} />
        <StatCard label="TG (gravité)" value={String(tg)} unit="j perdus / 1000 h" icon={TrendingUp} />
        <StatCard label="Jours d'arrêt" value={String(totalJours)} unit="cumulés YTD" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {DASHBOARDS.map((d) => (
          <Card key={d.role}>
            <CardHeader title={d.label} subtitle={`Dashboard rôle ${d.role}`} action={<BarChart3 size={16} className="text-amber-deep" />} />
            <ul className="space-y-1.5">
              {d.items.map((item, i) => {
                const warn = item.includes('⚠');
                const ok = item.includes('✅');
                return (
                  <li key={i} className="flex items-center gap-2 rounded-lg bg-surface2/40 px-3 py-2">
                    {ok ? <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
                       : warn ? <AlertTriangle size={13} className="shrink-0 text-warn" />
                       : <TrendingUp size={13} className="shrink-0 text-ink-400" />}
                    <span className="text-[12px] font-medium text-ink">{item}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="ROI Prévention" subtitle="1 FCFA prévention = 3-5 FCFA économisés" action={<TrendingUp size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-emerald-500/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Budget HSE</p>
            <p className="mono mt-1 text-[18px] font-bold text-emerald-700">45 M FCFA</p>
            <p className="text-[10px] font-medium text-emerald-600">1,2% masse salariale</p>
          </div>
          <div className="rounded-xl bg-amber/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">Cotisations AT/MP</p>
            <p className="mono mt-1 text-[18px] font-bold text-ink">95 M FCFA</p>
            <p className="text-[10px] font-medium text-ink-500">taux CNPS 3,2%</p>
          </div>
          <div className="rounded-xl bg-surface2/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Économies mesurées</p>
            <p className="mono mt-1 text-[18px] font-bold text-ink">~56 M</p>
            <p className="text-[10px] font-medium text-ink-500">AT évités + absentéisme</p>
          </div>
          <div className="rounded-xl bg-surface2/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">ROI brut</p>
            <p className="mono mt-1 text-[18px] font-bold text-ink">× 1,5 – 3</p>
            <p className="text-[10px] font-medium text-ink-500">avec gains indirects</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Reporting CNPS annuel" subtitle="DAS · DAR · subrogations · taux AT/MP" action={<Landmark size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            { label: 'DAS 2027', val: '✅ soumise', mono: false },
            { label: 'DAR 2027', val: '☐ avant 28/02', mono: false },
            { label: 'Cotisations 2027', val: '645 M FCFA', mono: true },
            { label: 'Subrogations', val: '6,3 M récupérés', mono: true },
            { label: 'Taux AT/MP 2028', val: '3,5% ⚠ (+0,3pts)', mono: false },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{item.label}</p>
              <p className={cn('mt-1 text-[13px] font-bold text-ink', item.mono ? 'mono' : '')}>{item.val}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════ 15. ALERTES ANTI-FRAUDE ══════════════════════ */
const PATTERNS_META: Record<string, { label: string; severity: 'critical' | 'high' | 'medium'; penal: boolean; cnps: boolean }> = {
  at_late_declaration:          { label: 'AT non déclaré 48h', severity: 'critical', penal: true, cnps: true },
  duer_outdated:                { label: 'DUER non à jour > 12 mois', severity: 'high', penal: false, cnps: false },
  epi_missing:                  { label: 'EPI non distribués (postes obligatoires)', severity: 'high', penal: false, cnps: false },
  faute_inexcusable_potentielle: { label: 'Faute inexcusable potentielle', severity: 'critical', penal: true, cnps: false },
  mp_under_reporting:           { label: 'Sous-déclaration MP suspectée', severity: 'critical', penal: true, cnps: true },
  illegal_medical_access:       { label: 'Accès illégal dossier médical', severity: 'critical', penal: true, cnps: false },
  secret_medical_breach:        { label: 'Violation secret médical', severity: 'critical', penal: true, cnps: false },
  cnps_refacturation_suspecte:  { label: 'Refacturations CNPS suspectes', severity: 'critical', penal: true, cnps: true },
  rps_signalement_untreated:    { label: 'Signalements RPS non traités > 30j', severity: 'high', penal: false, cnps: false },
  harcelement_etouffe:          { label: 'Harcèlement classé sans investigation', severity: 'critical', penal: true, cnps: false },
  inaptitude_licenciement_rapide: { label: 'Inaptitude → licenciement sans reclassement', severity: 'critical', penal: true, cnps: false },
  cnps_fraude_document:         { label: 'Documents CNPS frauduleux', severity: 'critical', penal: true, cnps: true },
};

export function AlertesConformitePage() {
  const { toast } = useToast();
  const createPattern = useCreateSuspiciousPattern();
  const [showForm, setShowForm] = useState(false);
  const [patternCode, setPatternCode] = useState('at_late_declaration');
  const [severityOverride, setSeverityOverride] = useState<'critical' | 'high' | 'medium' | 'low'>('critical');

  return (
    <div className="animate-fade-up space-y-5">
      <ConformiteSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Alertes anti-fraude M12</h1>
          <p className="text-sm font-medium text-ink-500">12 patterns suspects · Pénal · CNPS · RGPD · Faute inexcusable</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Siren size={14} /> {showForm ? 'Annuler' : 'Signaler un pattern'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-warn/40">
          <CardHeader
            title="Signaler un pattern suspect"
            subtitle="Juriste + DG notifiés automatiquement si critique · audit SHA-256"
            action={isBackendConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span> : undefined}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Pattern</label>
              <select value={patternCode} onChange={(e) => {
                setPatternCode(e.target.value);
                setSeverityOverride(PATTERNS_META[e.target.value]?.severity ?? 'high');
              }}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                {Object.entries(PATTERNS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Sévérité</label>
              <select value={severityOverride} onChange={(e) => setSeverityOverride(e.target.value as 'critical' | 'high' | 'medium' | 'low')}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                <option value="critical">Critique — pénal / RGPD</option>
                <option value="high">Élevée — faute inexcusable</option>
                <option value="medium">Moyenne — non-conformité</option>
                <option value="low">Basse — observation</option>
              </select>
            </div>
          </div>
          {PATTERNS_META[patternCode]?.penal && (
            <div className="mt-2 rounded-xl border border-warn/30 bg-warn/5 px-3 py-2 text-[11px] font-semibold text-warn">
              ⚠ Implication pénale potentielle — juriste et DG seront notifiés automatiquement.
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="danger" disabled={createPattern.isPending}
              onClick={async () => {
                const meta = PATTERNS_META[patternCode];
                if (!isBackendConfigured) {
                  setShowForm(false);
                  toast({ variant: 'success', title: 'Pattern signalé', description: `${meta?.label ?? patternCode} — ouvert (mode démo)` });
                  return;
                }
                try {
                  await createPattern.mutateAsync({
                    patternCode, severity: severityOverride,
                    penaImplications: meta?.penal ?? false,
                    cnpsImplications: meta?.cnps ?? false,
                  });
                  setShowForm(false);
                  toast({ variant: 'success', title: 'Pattern signalé', description: `Enquête ouverte · ${severityOverride === 'critical' ? 'Juriste + DG notifiés' : 'équipe RH notifiée'}` });
                } catch (e) {
                  toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
                }
              }}>
              {createPattern.isPending ? 'Signalement…' : 'Signaler'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(PATTERNS_META).map(([code, meta], idx) => (
          <Card key={code}>
            <div className="flex items-start gap-3">
              <span className="mono shrink-0 rounded-lg bg-surface2 px-2 py-1 text-[10px] font-bold text-ink-500">P{String(idx + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink">{meta.label}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <StatusPill tone={meta.severity === 'critical' ? 'danger' : meta.severity === 'high' ? 'warn' : 'amber'} dot={false}>
                    {meta.severity === 'critical' ? 'Critique' : meta.severity === 'high' ? 'Élevée' : 'Moyenne'}
                  </StatusPill>
                  {meta.penal && <StatusPill tone="danger" dot={false}>Pénal</StatusPill>}
                  {meta.cnps && <StatusPill tone="warn" dot={false}>CNPS</StatusPill>}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Règles de détection automatique" subtitle="Déclenchées sur événements en base — EF cron quotidien" action={<ShieldCheck size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {[
            { rule: 'AT déclaré CNPS > 48h après survenance', ef: 'detect-at-late-declaration', trigger: 'INSERT m12_work_incidents' },
            { rule: 'DUER dernière version > 12 mois', ef: 'detect-duer-outdated', trigger: 'CRON quotidien 04h00' },
            { rule: 'Postes obligatoires sans EPI assigné', ef: 'detect-epi-missing', trigger: 'CRON quotidien 04h15' },
            { rule: 'Accès dossier médical hors rôle autorisé', ef: 'detect-illegal-medical-access', trigger: 'INSERT m12_medical_access_log' },
            { rule: 'Signalements RPS sans investigation > 30j', ef: 'detect-rps-untreated', trigger: 'CRON quotidien 05h00' },
            { rule: 'Inaptitude → décision < 30j sans reclassement', ef: 'detect-inaptitude-risk', trigger: 'UPDATE m12_medical_visits' },
          ].map((r) => (
            <div key={r.ef} className="rounded-xl bg-surface2/40 p-3">
              <p className="text-[12px] font-semibold text-ink">{r.rule}</p>
              <div className="mt-1 flex gap-1">
                <span className="mono text-[10px] font-bold text-amber-deep">{r.ef}</span>
              </div>
              <p className="mt-0.5 text-[10px] font-medium text-ink-500">{r.trigger}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
