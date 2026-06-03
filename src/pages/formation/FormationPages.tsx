/**
 * M11 FORMATION — 12 pages consolidées.
 * Cockpit · Catalogue · Plan annuel · Sessions · Inscriptions · Évaluations Kirkpatrick
 * · Certifications · ROI · Compétences · FDFP · Reporting · Paramètres.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, BookOpen, ClipboardList, CalendarDays, UserCheck, Gauge,
  Award, Coins, Network, Landmark, BarChart3, Settings,
  ArrowUpRight, AlertTriangle, CheckCircle2, Filter, Search,
  Sparkles, TrendingUp, Clock, Users as UsersIcon, Layers, Video, Building2,
  Download,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { FormationSubNav } from '../../components/formation/FormationSubNav';
import { M11LiveBanner } from '../../components/formation/M11LiveBanner';
import {
  COURSES, PLAN_2026, SESSIONS, REGISTRATIONS, KIRKPATRICK_EVALS,
  CERTIFICATIONS, FDFP_DECLARATIONS, ROI_CALCULATIONS, SKILL_UPLIFTS,
  FORMATION_KPI, courseById, sessionById, registrationsBySession,
  registrationsByEmployee, certificationsExpiringSoon, kirkpatrickBySession,
} from '../../lib/m11/mock';
import {
  MODALITY_META, CATEGORY_META, LEVEL_META, PROVIDER_META, COURSE_STATUS_META,
  PLAN_STATUS_META, PLAN_ITEM_STATUS_META, PLAN_ORIGIN_META,
  SESSION_STATUS_META, DELIVERY_MODE_META, REGISTRATION_STATUS_META,
  KIRKPATRICK_META, KIRKPATRICK_STATUS_META, CERTIFICATION_STATUS_META,
  FDFP_STATUS_META, TRAINING_FUND_REGIMES, TRAINING_BEST_PRACTICES,
  ROI_METHODS, TRAINING_THRESHOLDS,
} from '../../lib/m11/referentiels';
import { EMPLOYEES, employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

// ─────────── helpers locaux
const fmt = (n: number, currency = 'FCFA'): string =>
  `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} ${currency}`;
const fmtCompact = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return String(Math.round(n));
};
const pct = (v: number, total: number): number => total === 0 ? 0 : Math.round((v / total) * 100);

/* ═══════════════════════════════ 1. COCKPIT ═══════════════════════════════ */
export function CockpitFormationPage() {
  const k = FORMATION_KPI;
  const upcomingSessions = SESSIONS.filter((s) => s.status === 'scheduled' || s.status === 'open_registration')
    .sort((a, b) => a.days[0].date.localeCompare(b.days[0].date)).slice(0, 5);
  const expiring = certificationsExpiringSoon();
  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <M11LiveBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Formation & Développement</h1>
          <p className="text-sm font-medium text-ink-500">Catalogue · plan annuel · sessions · ROI · FDFP/3FPT · certifications</p>
        </div>
        <div className="flex gap-2">
          <Link to="/formation/plan"><Button variant="outline" size="sm"><ClipboardList size={14} /> Plan 2026</Button></Link>
          <Link to="/formation/sessions"><Button size="sm"><CalendarDays size={14} /> Sessions</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Bénéficiaires YTD" value={String(k.beneficiairesYTD)} unit={`/ ${EMPLOYEES.length} collab`} icon={UsersIcon} />
        <StatCard label="Taux d'accès" value={`${Math.round(k.tauxAcces * 100)} %`} unit={`cible ${Math.round(TRAINING_THRESHOLDS.ACCESS_RATE_TARGET * 100)} %`} icon={CheckCircle2}
          tone={k.tauxAcces >= TRAINING_THRESHOLDS.ACCESS_RATE_TARGET ? 'default' : 'amber'} />
        <StatCard label="Heures / collab" value={String(k.heuresMoyennesParCollab)} unit={`cible ${TRAINING_THRESHOLDS.HOURS_PER_EMPLOYEE_TARGET} h`} icon={Clock} />
        <StatCard label="Budget consommé" value={`${pct(k.budgetConsomme, k.budgetTotal)} %`} unit={fmt(k.budgetConsomme)} icon={Coins} />
        <StatCard label="Satisfaction L1" value={`${k.satisfactionMoyenneL1} / 5`} unit={`cible ${TRAINING_THRESHOLDS.REACTION_TARGET}`} icon={Sparkles}
          tone={k.satisfactionMoyenneL1 >= TRAINING_THRESHOLDS.REACTION_TARGET ? 'default' : 'amber'} />
        <StatCard label="Acquis L2" value={`${k.acquisMoyenL2} / 100`} unit={`seuil ${TRAINING_THRESHOLDS.LEARNING_PASS_THRESHOLD}`} icon={Gauge} />
        <StatCard label="ROI moyen" value={`${k.roiMoyen}×`} unit={`cible ${TRAINING_THRESHOLDS.ROI_TARGET}×`} icon={TrendingUp} />
        <StatCard label="FDFP récupérable" value={fmtCompact(k.fdfpRecuperableYTD)} unit="YTD" icon={Landmark} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card inset={false}>
          <div className="p-5 pb-2"><CardHeader title="Sessions à venir (30 j)" subtitle={`${upcomingSessions.length} programmées`} className="mb-0" /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Formation</th>
                <th className="px-3 py-2 text-center">Modalité</th>
                <th className="px-3 py-2 text-center">Inscrits</th>
                <th className="px-3 py-2 text-right" />
              </tr></thead>
              <tbody className="divide-y divide-line">
                {upcomingSessions.map((s) => {
                  const c = courseById(s.courseId);
                  const dm = DELIVERY_MODE_META[s.deliveryMode];
                  return (
                    <tr key={s.id} className="hover:bg-amber/[0.03]">
                      <td className="px-4 py-2 mono text-[12px] font-bold text-ink">{s.days[0].date}</td>
                      <td className="px-3 py-2"><p className="text-[13px] font-semibold text-ink">{c?.title}</p><p className="text-[10px] font-medium text-ink-500">{s.location ?? s.meetingUrl} · {s.totalHours} h</p></td>
                      <td className="px-3 py-2 text-center"><StatusPill tone="neutral" dot={false}>{dm.label}</StatusPill></td>
                      <td className="px-3 py-2 mono text-center text-[12px]"><span className={cn('font-bold', s.registeredCount >= s.capacity ? 'text-warn' : 'text-ink')}>{s.registeredCount}</span><span className="text-ink-500"> / {s.capacity}</span></td>
                      <td className="px-3 py-2 text-right"><Link to="/formation/sessions"><Button variant="ghost" size="sm">Détail <ArrowUpRight size={12} /></Button></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-3">
          {expiring.length > 0 && (
            <Card className="border-warn/25">
              <CardHeader title="Certifications à renouveler" subtitle={`< ${TRAINING_THRESHOLDS.CERT_EXPIRATION_ALERT_DAYS} j`} action={<AlertTriangle size={16} className="text-warn" />} />
              <ul className="space-y-1">
                {expiring.slice(0, 5).map((c) => {
                  const emp = employeeById(c.employeeId);
                  const course = courseById(c.courseId);
                  return (
                    <li key={c.id} className="flex items-center justify-between rounded-lg bg-warn/[0.05] px-3 py-1.5">
                      <span className="text-[12px] font-semibold text-ink">{emp ? employeeName(emp) : '—'} · {course?.certificationCode}</span>
                      <span className="mono text-[10px] font-bold text-warn">{c.expiresAt ?? 'à valider'}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader title="Transfert L3 — comportement" subtitle="Mesure 90 j post-formation" action={<Network size={16} className="text-amber-deep" />} />
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="mono text-3xl font-bold text-ink">{Math.round(k.transfertL3 * 100)} %</span>
                <span className="text-[11px] font-medium text-ink-500">vs cible {Math.round(TRAINING_THRESHOLDS.TRANSFER_TARGET * 100)} %</span>
              </div>
              <div className="h-2 rounded-full bg-line">
                <div className="h-full rounded-full bg-amber-deep" style={{ width: `${Math.min(100, k.transfertL3 * 100)}%` }} />
              </div>
              <p className="text-[11px] font-medium text-ink-500">Pratiques nouvelles appliquées au poste, validation manager.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ 2. CATALOGUE ═══════════════════════════════ */
export function CataloguePage() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'all' | string>('all');
  const [mod, setMod] = useState<'all' | string>('all');

  const filtered = useMemo(() => COURSES.filter((c) => {
    if (q && !c.title.toLowerCase().includes(q.toLowerCase()) && !c.providerName.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat !== 'all' && c.category !== cat) return false;
    if (mod !== 'all' && c.modality !== mod) return false;
    return true;
  }), [q, cat, mod]);

  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Catalogue formations</h1>
          <p className="text-sm font-medium text-ink-500">{COURSES.length} parcours · {COURSES.filter((c) => c.fdfpEligible).length} imputables FDFP</p>
        </div>
        <Button size="sm"><BookOpen size={14} /> Nouvelle formation</Button>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher titre, organisme…"
              className="w-full rounded-xl border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink">
            <option value="all">Toutes catégories</option>
            {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={mod} onChange={(e) => setMod(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink">
            <option value="all">Toutes modalités</option>
            {Object.entries(MODALITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <Button variant="outline" size="sm"><Filter size={14} /> Filtres</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const m = MODALITY_META[c.modality];
          const cm = CATEGORY_META[c.category];
          const lv = LEVEL_META[c.level];
          const pv = PROVIDER_META[c.provider];
          const st = COURSE_STATUS_META[c.status];
          return (
            <Card key={c.id} className="transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="mono text-[10px] font-bold uppercase tracking-wider text-ink-400">{c.ref}</p>
                  <h3 className="mt-0.5 text-[14px] font-semibold leading-tight text-ink">{c.title}</h3>
                  <p className="mt-1 text-[11px] font-medium text-ink-500">{pv.label} · {c.providerName}</p>
                </div>
                <StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <StatusPill tone="neutral" dot={false}>{m.label}</StatusPill>
                <StatusPill tone="info" dot={false}>{cm.label}</StatusPill>
                <StatusPill tone="neutral" dot={false}>Niveau {lv.label}</StatusPill>
                {c.fdfpEligible && <StatusPill tone="success" dot={false}>FDFP ✓</StatusPill>}
                {c.certificationCode && <StatusPill tone="warn" dot={false}>{c.certificationCode}</StatusPill>}
              </div>
              <p className="mt-3 line-clamp-2 text-[12px] font-medium text-ink-700">{c.summary}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-surface2/40 p-2 text-center">
                <div><p className="mono text-[14px] font-bold text-ink">{c.durationHours}h</p><p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">durée</p></div>
                <div><p className="mono text-[14px] font-bold text-ink">{fmtCompact(c.costPerHead)}</p><p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">/ pers</p></div>
                <div><p className="mono text-[14px] font-bold text-ink">K{c.kirkpatrickLevels}</p><p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">évaluation</p></div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════ 3. PLAN ANNUEL ═══════════════════════════════ */
export function PlanFormationPage() {
  const p = PLAN_2026;
  const consumedPct = pct(p.budgetConsumed, p.budgetEnvelope);
  const byQuarter = ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => ({
    q, items: p.items.filter((it) => it.forecastQuarter === q),
    cost: p.items.filter((it) => it.forecastQuarter === q).reduce((s, it) => s + it.forecastCost, 0),
  }));
  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Plan de formation {p.year}</h1>
          <p className="text-sm font-medium text-ink-500">{p.ref} · {p.scopeLabel} · {p.items.length} actions planifiées</p>
        </div>
        <div className="flex gap-2">
          <StatusPill tone={PLAN_STATUS_META[p.status].tone} dot={false}>{PLAN_STATUS_META[p.status].label}</StatusPill>
          <Button variant="outline" size="sm"><Download size={14} /> Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Budget enveloppe" value={fmtCompact(p.budgetEnvelope)} unit="FCFA approuvé" icon={Coins} />
        <StatCard label="Budget consommé" value={`${consumedPct} %`} unit={fmt(p.budgetConsumed)} icon={TrendingUp} tone={consumedPct > 90 ? 'amber' : 'default'} />
        <StatCard label="Bénéficiaires" value={String(p.beneficiariesForecast)} unit="distincts" icon={UsersIcon} />
        <StatCard label="FDFP estimé" value={fmtCompact(p.fdfpRebateForecast)} unit="récupérable" icon={Landmark} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {byQuarter.map((q) => (
          <Card key={q.q}>
            <CardHeader title={`Trimestre ${q.q}`} subtitle={`${q.items.length} action(s) · ${fmtCompact(q.cost)} FCFA`} />
            <ul className="space-y-1">
              {q.items.slice(0, 5).map((it) => {
                const c = courseById(it.courseId);
                const st = PLAN_ITEM_STATUS_META[it.status];
                return (
                  <li key={it.id} className="flex items-center justify-between rounded-lg bg-surface2/40 px-2 py-1.5">
                    <span className="truncate text-[11px] font-semibold text-ink">{c?.title}</span>
                    <StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill>
                  </li>
                );
              })}
              {q.items.length > 5 && <li className="text-center text-[10px] font-medium text-ink-500">+{q.items.length - 5} autres</li>}
            </ul>
          </Card>
        ))}
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Détail des actions" subtitle={`${p.items.length} entrées`} className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Formation</th>
              <th className="px-3 py-2 text-center">Origine</th>
              <th className="px-3 py-2 text-center">Q</th>
              <th className="px-3 py-2 text-center">Priorité</th>
              <th className="px-3 py-2 text-center">Bénéficiaires</th>
              <th className="px-3 py-2 text-right">Coût prév.</th>
              <th className="px-3 py-2 text-right">Coût réel</th>
              <th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {p.items.map((it) => {
                const c = courseById(it.courseId);
                const st = PLAN_ITEM_STATUS_META[it.status];
                const og = PLAN_ORIGIN_META[it.origin];
                return (
                  <tr key={it.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2"><p className="text-[12px] font-semibold text-ink">{c?.title}</p><p className="text-[10px] font-medium text-ink-500">{c?.ref} · {c?.providerName}</p></td>
                    <td className="px-3 py-2 text-center"><StatusPill tone="neutral" dot={false}>{og.label}</StatusPill></td>
                    <td className="px-3 py-2 mono text-center text-[11px] font-bold">{it.forecastQuarter}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={it.priority === 'critical' ? 'danger' : it.priority === 'high' ? 'warn' : 'neutral'} dot={false}>{it.priority}</StatusPill></td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{it.targetEmployeeIds.length}</td>
                    <td className="px-3 py-2 mono text-right text-[11px]">{fmtCompact(it.forecastCost)}</td>
                    <td className="px-3 py-2 mono text-right text-[11px]">{it.realisedCost != null ? fmtCompact(it.realisedCost) : '—'}</td>
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

/* ═══════════════════════════════ 4. SESSIONS ═══════════════════════════════ */
export function SessionsPage() {
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'scheduled'>('all');
  const list = useMemo(() => SESSIONS.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'open') return s.status === 'open_registration';
    if (filter === 'scheduled') return s.status === 'scheduled';
    return s.status === filter;
  }).sort((a, b) => a.days[0].date.localeCompare(b.days[0].date)), [filter]);

  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Sessions de formation</h1>
          <p className="text-sm font-medium text-ink-500">{SESSIONS.length} sessions au calendrier</p>
        </div>
        <Button size="sm"><CalendarDays size={14} /> Programmer</Button>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all',         label: `Toutes (${SESSIONS.length})` },
            { key: 'open',        label: `Inscriptions ouvertes (${SESSIONS.filter((s) => s.status === 'open_registration').length})` },
            { key: 'scheduled',   label: `Programmées (${SESSIONS.filter((s) => s.status === 'scheduled').length})` },
            { key: 'in_progress', label: `En cours (${SESSIONS.filter((s) => s.status === 'in_progress').length})` },
            { key: 'completed',   label: `Terminées (${SESSIONS.filter((s) => s.status === 'completed').length})` },
          ].map((b) => (
            <button key={b.key} onClick={() => setFilter(b.key as typeof filter)}
              className={cn('rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors',
                filter === b.key ? 'border-amber-deep bg-amber/12 text-amber-deep' : 'border-line bg-surface text-ink-500 hover:bg-amber/[0.04]')}>
              {b.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {list.map((s) => {
          const c = courseById(s.courseId);
          const st = SESSION_STATUS_META[s.status];
          const dm = DELIVERY_MODE_META[s.deliveryMode];
          const fillPct = pct(s.registeredCount, s.capacity);
          return (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="mono text-[10px] font-bold uppercase tracking-wider text-ink-400">{s.ref}</p>
                  <h3 className="mt-0.5 text-[14px] font-semibold leading-tight text-ink">{c?.title}</h3>
                  <p className="mt-1 text-[11px] font-medium text-ink-500">{c?.providerName} · {s.totalHours} h</p>
                </div>
                <StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-medium text-ink-700">
                <div className="flex items-center gap-1.5"><CalendarDays size={12} className="text-ink-400" />{s.days[0].date} → {s.days[s.days.length - 1].date}</div>
                <div className="flex items-center gap-1.5">{s.deliveryMode === 'on_site' ? <Building2 size={12} className="text-ink-400" /> : s.deliveryMode === 'remote' ? <Video size={12} className="text-ink-400" /> : <Layers size={12} className="text-ink-400" />}{dm.label}</div>
                <div className="col-span-2 truncate text-ink-500">{s.location ?? s.meetingUrl}</div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-ink-500">
                  <span>INSCRITS</span>
                  <span className="mono text-ink">{s.registeredCount}/{s.capacity}{s.waitlistCount > 0 && <span className="text-warn"> (+{s.waitlistCount} attente)</span>}</span>
                </div>
                <div className="h-2 rounded-full bg-line">
                  <div className={cn('h-full rounded-full', fillPct >= 100 ? 'bg-warn' : 'bg-amber-deep')} style={{ width: `${Math.min(100, fillPct)}%` }} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-ink-500">
                <span className="mono">Coût: <span className="font-bold text-ink-700">{fmtCompact(s.costTotal)} FCFA</span></span>
                {s.averageReactionScore && <span>L1: <span className="mono font-bold text-amber-deep">{s.averageReactionScore}/5</span></span>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════ 5. INSCRIPTIONS ═══════════════════════════════ */
export function InscriptionsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'attended'>('all');
  const list = useMemo(() => REGISTRATIONS.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.status === 'requested' || r.status === 'waitlisted';
    if (filter === 'attended') return r.status === 'attended' || r.status === 'completed' || r.status === 'partial';
    return true;
  }), [filter]);

  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Inscriptions</h1>
          <p className="text-sm font-medium text-ink-500">{REGISTRATIONS.length} inscriptions enregistrées</p>
        </div>
        <Button size="sm"><UserCheck size={14} /> Inscrire un collab.</Button>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all',      label: `Toutes (${REGISTRATIONS.length})` },
            { key: 'pending',  label: `À valider (${REGISTRATIONS.filter((r) => r.status === 'requested' || r.status === 'waitlisted').length})` },
            { key: 'attended', label: `Présents (${REGISTRATIONS.filter((r) => r.status === 'attended' || r.status === 'completed' || r.status === 'partial').length})` },
          ].map((b) => (
            <button key={b.key} onClick={() => setFilter(b.key as typeof filter)}
              className={cn('rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors',
                filter === b.key ? 'border-amber-deep bg-amber/12 text-amber-deep' : 'border-line bg-surface text-ink-500 hover:bg-amber/[0.04]')}>
              {b.label}
            </button>
          ))}
        </div>
      </Card>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Réf</th>
              <th className="px-3 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Formation</th>
              <th className="px-3 py-2 text-center">Statut</th>
              <th className="px-3 py-2 text-center">Heures</th>
              <th className="px-3 py-2 text-center">L2</th>
              <th className="px-3 py-2 text-center">L1</th>
              <th className="px-3 py-2 text-right">Coût</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {list.slice(0, 80).map((r) => {
                const emp = employeeById(r.employeeId);
                const s = sessionById(r.sessionId);
                const c = s ? courseById(s.courseId) : undefined;
                const st = REGISTRATION_STATUS_META[r.status];
                return (
                  <tr key={r.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 mono text-[10px] font-bold text-ink-500">{r.ref}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={emp ? employeeName(emp) : '?'} size="xs" /><span className="text-[12px] font-medium text-ink-700">{emp ? employeeName(emp) : '—'}</span></div></td>
                    <td className="px-3 py-2"><p className="text-[12px] font-semibold text-ink">{c?.title}</p><p className="text-[10px] font-medium text-ink-500">{s?.ref}</p></td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill></td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{r.attendedHours ?? '—'}</td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{r.learningScore ?? '—'}</td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{r.reactionScore ? `${r.reactionScore}/5` : '—'}</td>
                    <td className="px-3 py-2 mono text-right text-[11px]">{fmtCompact(r.allocatedCost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {list.length > 80 && <p className="px-4 py-2 text-center text-[10px] font-medium text-ink-500">{list.length - 80} inscriptions supplémentaires…</p>}
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 6. ÉVALUATIONS KIRKPATRICK ═══════════════════════════════ */
export function EvaluationsKirkpatrickPage() {
  const byLevel = ([1, 2, 3, 4] as const).map((lv) => ({
    level: lv,
    meta: KIRKPATRICK_META[lv],
    evals: KIRKPATRICK_EVALS.filter((k) => k.level === lv),
  }));
  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Évaluations Kirkpatrick</h1>
          <p className="text-sm font-medium text-ink-500">4 niveaux · Réaction (L1) → Apprentissage (L2) → Comportement (L3) → Résultats (L4)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {byLevel.map(({ level, meta, evals }) => (
          <Card key={level} inset={false}>
            <div className="p-5 pb-2">
              <CardHeader title={meta.label} subtitle={meta.subtitle} className="mb-0"
                action={<span className="mono text-[10px] font-bold text-ink-400">{meta.format}</span>} />
              <p className="mt-2 text-[11px] font-medium text-ink-500">Trigger: J+{meta.triggerDays} · Métrique: {meta.metric}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                  <th className="px-4 py-2 text-left">Session</th>
                  <th className="px-3 py-2 text-center">Répondants</th>
                  <th className="px-3 py-2 text-center">Score</th>
                  <th className="px-3 py-2 text-center">Statut</th>
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {evals.map((e) => {
                    const s = sessionById(e.sessionId);
                    const c = s ? courseById(s.courseId) : undefined;
                    const st = KIRKPATRICK_STATUS_META[e.status];
                    return (
                      <tr key={e.id} className="hover:bg-amber/[0.03]">
                        <td className="px-4 py-2"><p className="text-[11px] font-semibold text-ink">{c?.title}</p><p className="text-[10px] font-medium text-ink-500">{s?.ref}</p></td>
                        <td className="px-3 py-2 mono text-center text-[11px]">{e.respondents}/{e.targetRespondents}</td>
                        <td className="px-3 py-2 mono text-center text-[12px] font-bold text-amber-deep">{e.aggregateScore != null ? (level === 2 || level === 4 ? `${e.aggregateScore}` : `${e.aggregateScore}`) : '—'}</td>
                        <td className="px-3 py-2 text-center"><StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill></td>
                      </tr>
                    );
                  })}
                  {evals.length === 0 && <tr><td colSpan={4} className="px-4 py-4 text-center text-[11px] font-medium text-ink-500">Aucune évaluation à ce niveau.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════ 7. CERTIFICATIONS ═══════════════════════════════ */
export function CertificationsPage() {
  const expiring = certificationsExpiringSoon();
  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Certifications</h1>
          <p className="text-sm font-medium text-ink-500">{CERTIFICATIONS.length} certifications enregistrées · {expiring.length} à renouveler &lt; {TRAINING_THRESHOLDS.CERT_EXPIRATION_ALERT_DAYS} j</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Actives" value={String(CERTIFICATIONS.filter((c) => c.status === 'active').length)} unit="en cours" icon={Award} />
        <StatCard label="À renouveler" value={String(CERTIFICATIONS.filter((c) => c.status === 'pending_renewal').length)} unit="action requise" icon={AlertTriangle} tone="amber" />
        <StatCard label="Expirées" value={String(CERTIFICATIONS.filter((c) => c.status === 'expired').length)} unit="à traiter" icon={AlertTriangle} />
        <StatCard label="HSE / Sécurité" value={String(CERTIFICATIONS.filter((c) => {
          const co = courseById(c.courseId);
          return co?.category === 'safety';
        }).length)} unit="opérations" icon={CheckCircle2} />
      </div>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Réf</th>
              <th className="px-3 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Certification</th>
              <th className="px-3 py-2 text-left">Organisme</th>
              <th className="px-3 py-2 text-center">Délivrée</th>
              <th className="px-3 py-2 text-center">Expire</th>
              <th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {CERTIFICATIONS.map((cert) => {
                const emp = employeeById(cert.employeeId);
                const c = courseById(cert.courseId);
                const st = CERTIFICATION_STATUS_META[cert.status];
                return (
                  <tr key={cert.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 mono text-[10px] font-bold text-ink-500">{cert.ref}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={emp ? employeeName(emp) : '?'} size="xs" /><span className="text-[12px] font-medium text-ink-700">{emp ? employeeName(emp) : '—'}</span></div></td>
                    <td className="px-3 py-2"><p className="text-[12px] font-semibold text-ink">{c?.title}</p><p className="mono text-[10px] font-bold text-ink-500">{cert.certificateCode}</p></td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{cert.issuer}</td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{cert.issuedAt}</td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{cert.expiresAt ?? '—'}</td>
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

/* ═══════════════════════════════ 8. ROI ═══════════════════════════════ */
export function RoiPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">ROI Formation</h1>
          <p className="text-sm font-medium text-ink-500">Méthodes : Phillips · Kirkpatrick L4 · Δ productivité · Réduction turnover</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {ROI_CALCULATIONS.map((r) => {
          const s = sessionById(r.sessionId);
          const c = s ? courseById(s.courseId) : undefined;
          const positive = r.roi.roi >= TRAINING_THRESHOLDS.ROI_TARGET;
          return (
            <Card key={r.sessionId}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="mono text-[10px] font-bold uppercase tracking-wider text-ink-400">{s?.ref}</p>
                  <h3 className="mt-0.5 text-[14px] font-semibold leading-tight text-ink">{c?.title}</h3>
                  <p className="mt-1 text-[11px] font-medium text-ink-500">{c?.providerName} · {s?.attendedCount ?? s?.registeredCount} bénéficiaires</p>
                </div>
                <StatusPill tone={positive ? 'success' : 'warn'} dot={false}>{r.roi.method}</StatusPill>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-surface2/40 p-3 text-center">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Coût</p>
                  <p className="mono text-[16px] font-bold text-ink">{fmtCompact(r.roi.totalCost)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Gain 12 m</p>
                  <p className="mono text-[16px] font-bold text-emerald-600">{fmtCompact(r.roi.estimatedGain12m)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">ROI</p>
                  <p className={cn('mono text-[16px] font-bold', positive ? 'text-emerald-600' : 'text-warn')}>{r.roi.roi}×</p>
                </div>
              </div>
              <p className="mt-3 text-[12px] font-medium italic text-ink-700">« {r.narrative} »</p>
              {r.roi.paybackMonths && <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">Payback : {r.roi.paybackMonths} mois</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════ 9. COMPÉTENCES (UPLIFT) ═══════════════════════════════ */
export function CompetencesFormationPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Compétences acquises</h1>
          <p className="text-sm font-medium text-ink-500">Uplift compétences post-formation (mesure pré/post) · {SKILL_UPLIFTS.length} entrées</p>
        </div>
      </div>

      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Compétence</th>
              <th className="px-3 py-2 text-left">Formation</th>
              <th className="px-3 py-2 text-center">Avant</th>
              <th className="px-3 py-2 text-center">Après</th>
              <th className="px-3 py-2 text-center">Δ</th>
              <th className="px-3 py-2 text-right">Date</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {SKILL_UPLIFTS.map((u, i) => {
                const emp = employeeById(u.employeeId);
                const s = sessionById(u.acquiredViaSessionId);
                const c = s ? courseById(s.courseId) : undefined;
                const delta = u.postLevel - u.preLevel;
                return (
                  <tr key={i} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar name={emp ? employeeName(emp) : '?'} size="xs" /><span className="text-[12px] font-medium text-ink-700">{emp ? employeeName(emp) : '—'}</span></div></td>
                    <td className="px-3 py-2"><p className="mono text-[11px] font-bold text-ink">{u.skillCode}</p></td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{c?.title}</td>
                    <td className="px-3 py-2 mono text-center text-[11px] text-ink-500">{u.preLevel}/5</td>
                    <td className="px-3 py-2 mono text-center text-[12px] font-bold text-ink">{u.postLevel}/5</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={delta > 0 ? 'success' : 'neutral'} dot={false}>+{delta}</StatusPill></td>
                    <td className="px-3 py-2 mono text-right text-[11px]">{u.acquiredAt}</td>
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

/* ═══════════════════════════════ 10. FDFP / FONDS ═══════════════════════════════ */
export function FdfpPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">FDFP / Fonds de formation</h1>
          <p className="text-sm font-medium text-ink-500">Déclarations & régimes de financement formation OHADA</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Déclarations 2026" value={String(FDFP_DECLARATIONS.filter((d) => d.year === 2026).length)} unit="trimestrielles" icon={Landmark} />
        <StatCard label="Coût déclaré YTD" value={fmtCompact(FDFP_DECLARATIONS.filter((d) => d.year === 2026).reduce((s, d) => s + d.costDeclared, 0))} unit="FCFA" icon={Coins} />
        <StatCard label="Récupérable estimé" value={fmtCompact(FDFP_DECLARATIONS.filter((d) => d.year === 2026).reduce((s, d) => s + d.rebateExpected, 0))} unit="FCFA" icon={TrendingUp} />
        <StatCard label="Encaissé YTD" value={fmtCompact(FDFP_DECLARATIONS.filter((d) => d.year === 2026).reduce((s, d) => s + (d.rebateReceived ?? 0), 0))} unit="FCFA" icon={CheckCircle2} />
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Déclarations trimestrielles" subtitle={`${FDFP_DECLARATIONS.length} dossiers`} className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Réf</th>
              <th className="px-3 py-2 text-center">Pays / Période</th>
              <th className="px-3 py-2 text-center">Sessions</th>
              <th className="px-3 py-2 text-center">Heures</th>
              <th className="px-3 py-2 text-center">Bénéf.</th>
              <th className="px-3 py-2 text-right">Coût déclaré</th>
              <th className="px-3 py-2 text-right">Récupérable</th>
              <th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {FDFP_DECLARATIONS.map((d) => {
                const st = FDFP_STATUS_META[d.status];
                return (
                  <tr key={d.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 mono text-[11px] font-bold text-ink">{d.ref}</td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{d.countryCode} · {d.year}-Q{d.quarter}</td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{d.sessionsCount}</td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{d.hoursTotal}</td>
                    <td className="px-3 py-2 mono text-center text-[11px]">{d.beneficiariesCount}</td>
                    <td className="px-3 py-2 mono text-right text-[11px]">{fmtCompact(d.costDeclared)}</td>
                    <td className="px-3 py-2 mono text-right text-[11px] font-bold text-emerald-600">{fmtCompact(d.rebateReceived ?? d.rebateExpected)}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Régimes de financement OHADA" subtitle={`${TRAINING_FUND_REGIMES.length} pays référencés`} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Pays</th>
              <th className="px-3 py-2 text-left">Organisme</th>
              <th className="px-3 py-2 text-center">Taux</th>
              <th className="px-3 py-2 text-center">Imputable max</th>
              <th className="px-3 py-2 text-left">Notes</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {TRAINING_FUND_REGIMES.map((r) => (
                <tr key={r.countryCode} className="hover:bg-amber/[0.03]">
                  <td className="px-4 py-2 text-[12px] font-semibold text-ink">{r.country} <span className="mono text-[10px] font-bold text-ink-400">({r.countryCode})</span></td>
                  <td className="px-3 py-2 text-[11px] font-bold text-amber-deep">{r.agency}</td>
                  <td className="px-3 py-2 mono text-center text-[11px]">{r.ratePct} %</td>
                  <td className="px-3 py-2 mono text-center text-[11px] font-bold">{r.rebateMaxPct} %</td>
                  <td className="px-3 py-2 text-[10px] font-medium text-ink-500">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 11. REPORTING ═══════════════════════════════ */
export function ReportingFormationPage() {
  const k = FORMATION_KPI;

  const byCategory = Object.keys(CATEGORY_META).map((cat) => {
    const items = PLAN_2026.items.filter((it) => courseById(it.courseId)?.category === cat);
    const cost = items.reduce((s, it) => s + it.forecastCost, 0);
    return { cat, label: CATEGORY_META[cat as keyof typeof CATEGORY_META].label, count: items.length, cost };
  }).filter((c) => c.count > 0).sort((a, b) => b.cost - a.cost);

  const byEmployee = EMPLOYEES.map((e) => {
    const regs = registrationsByEmployee(e.id).filter((r) => ['attended', 'completed', 'partial'].includes(r.status));
    const hours = regs.reduce((s, r) => s + (r.attendedHours ?? 0), 0);
    return { id: e.id, name: employeeName(e), hours, formations: regs.length };
  }).sort((a, b) => b.hours - a.hours);

  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Reporting Formation</h1>
          <p className="text-sm font-medium text-ink-500">Tableaux de bord exécutifs · répartition catégories · top collaborateurs</p>
        </div>
        <Button variant="outline" size="sm"><Download size={14} /> Export Excel</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Répartition budget par catégorie" subtitle={`Plan ${PLAN_2026.year}`} />
          <div className="space-y-2">
            {byCategory.map((c) => {
              const maxCost = byCategory[0].cost;
              return (
                <div key={c.cat}>
                  <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-ink">
                    <span>{c.label} <span className="text-ink-500">({c.count})</span></span>
                    <span className="mono text-ink-700">{fmtCompact(c.cost)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-line">
                    <div className="h-full rounded-full bg-amber-deep" style={{ width: `${pct(c.cost, maxCost)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Top collaborateurs" subtitle="Heures de formation réalisées YTD" />
          <ul className="space-y-1.5">
            {byEmployee.slice(0, 8).map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-xl bg-surface2/40 px-3 py-2">
                <Avatar name={e.name} size="xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-ink">{e.name}</p>
                  <p className="text-[10px] font-medium text-ink-500">{e.formations} formation(s)</p>
                </div>
                <p className="mono text-[14px] font-bold text-amber-deep">{e.hours}h</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Atteinte des cibles" subtitle="Indicateurs clés vs benchmarks" />
          <ul className="space-y-2">
            {[
              { label: 'Taux d\'accès', val: k.tauxAcces * 100, target: TRAINING_THRESHOLDS.ACCESS_RATE_TARGET * 100, suffix: '%' },
              { label: 'Heures / collab', val: k.heuresMoyennesParCollab, target: TRAINING_THRESHOLDS.HOURS_PER_EMPLOYEE_TARGET, suffix: 'h' },
              { label: 'Satisfaction L1', val: k.satisfactionMoyenneL1, target: TRAINING_THRESHOLDS.REACTION_TARGET, suffix: '/5' },
              { label: 'Acquis L2', val: k.acquisMoyenL2, target: TRAINING_THRESHOLDS.LEARNING_PASS_THRESHOLD, suffix: '/100' },
              { label: 'Transfert L3', val: k.transfertL3 * 100, target: TRAINING_THRESHOLDS.TRANSFER_TARGET * 100, suffix: '%' },
              { label: 'ROI', val: k.roiMoyen, target: TRAINING_THRESHOLDS.ROI_TARGET, suffix: '×' },
            ].map((it) => {
              const ratio = Math.min(100, (it.val / it.target) * 100);
              const ok = it.val >= it.target;
              return (
                <li key={it.label}>
                  <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-ink">
                    <span>{it.label}</span>
                    <span className="mono">{Math.round(it.val * 10) / 10}{it.suffix} <span className="text-ink-500">/ {it.target}{it.suffix}</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-line">
                    <div className={cn('h-full rounded-full', ok ? 'bg-emerald-500' : 'bg-warn')} style={{ width: `${ratio}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Bonnes pratiques Atlas" subtitle="Recommandations 2026" action={<Sparkles size={16} className="text-amber-deep" />} />
          <ul className="list-disc space-y-1 pl-5">
            {TRAINING_BEST_PRACTICES.map((p, i) => <li key={i} className="text-[12px] font-medium text-ink-700">{p}</li>)}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ 12. PARAMÈTRES ═══════════════════════════════ */
export function ParametresFormationPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <FormationSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Paramètres Formation</h1>
          <p className="text-sm font-medium text-ink-500">Référentiels, seuils, méthodes ROI, règles d'imputation FDFP</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Modalités pédagogiques" subtitle={`${Object.keys(MODALITY_META).length} formats`} />
          <ul className="space-y-1">
            {Object.entries(MODALITY_META).map(([k, v]) => (
              <li key={k} className="flex items-start gap-3 rounded-lg bg-surface2/40 px-3 py-1.5">
                <span className="mono mt-0.5 text-[10px] font-bold uppercase text-ink-500">{k}</span>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-ink">{v.label}</p>
                  <p className="text-[10px] font-medium text-ink-500">{v.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Catégories du catalogue" subtitle={`${Object.keys(CATEGORY_META).length} catégories`} />
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              <StatusPill key={k} tone="neutral" dot={false}>{v.label}</StatusPill>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Évaluation Kirkpatrick — paramétrage" subtitle="4 niveaux activables par formation" action={<Gauge size={16} className="text-amber-deep" />} />
          <ul className="space-y-2">
            {([1, 2, 3, 4] as const).map((lv) => {
              const m = KIRKPATRICK_META[lv];
              return (
                <li key={lv} className="rounded-xl bg-surface2/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-ink">{m.label}</p>
                    <span className="mono text-[10px] font-bold text-ink-500">J+{m.triggerDays}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-medium text-ink-500">{m.subtitle}</p>
                  <p className="mt-1 text-[10px] font-medium text-ink-700">{m.format} · {m.metric}</p>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Méthodes ROI disponibles" subtitle="Sélectionnables par session" action={<TrendingUp size={16} className="text-amber-deep" />} />
          <ul className="space-y-1.5">
            {ROI_METHODS.map((m) => (
              <li key={m.code} className="rounded-xl bg-surface2/40 px-3 py-2">
                <p className="text-[12px] font-semibold text-ink">{m.label}</p>
                <p className="text-[10px] font-medium text-ink-500">{m.description}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Seuils & SLA" subtitle="Configuration globale du module" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Alerte cert.</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">{TRAINING_THRESHOLDS.CERT_EXPIRATION_ALERT_DAYS} j</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Seuil DG</p>
              <p className="mono mt-1 text-[14px] font-bold text-ink">{fmtCompact(TRAINING_THRESHOLDS.PLAN_VALIDATION_DG_AMOUNT)}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Promo file</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">{TRAINING_THRESHOLDS.WAITLIST_AUTO_PROMOTE_DAYS} j</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Cible L1</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">{TRAINING_THRESHOLDS.REACTION_TARGET}/5</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Seuil L2</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">{TRAINING_THRESHOLDS.LEARNING_PASS_THRESHOLD}/100</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Cible L3</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">{Math.round(TRAINING_THRESHOLDS.TRANSFER_TARGET * 100)} %</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">ROI cible</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">{TRAINING_THRESHOLDS.ROI_TARGET}×</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">H/collab</p>
              <p className="mono mt-1 text-[18px] font-bold text-ink">{TRAINING_THRESHOLDS.HOURS_PER_EMPLOYEE_TARGET} h</p>
            </div>
          </div>
        </Card>
      </div>

      {/* anti-tsc unused — helpers utilisés dans pages dépendantes */}
      <span className="hidden">{registrationsBySession.name}{kirkpatrickBySession.name}</span>
    </div>
  );
}
