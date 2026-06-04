/**
 * Atlas People — Welcome Cockpit (modèle Cockpit R&C / Atlas Studio).
 *
 * Page d'accueil post-login, intro vivante :
 *   • En-tête tenant compact (nom + pays + devise + démo + Période + alertes)
 *   • Hero Grand Hotel — "Cockpit RH" en deux mots stylisés
 *   • Sous-titre déroulant — pitch fonctionnel
 *   • 4 KPI cards (Effectif · Coût employeur · Couverture conformité · Engagement)
 *     avec areagraph mini interne et fond gradient amber
 *   • 6 accès rapides en grille (Cockpit · Collaborateurs · Paie · Carrières · Formation · Reporting)
 *   • Footer signature
 *
 * Light theme premium · amber-deep · typographie cahier (Grand Hotel + Dosis + JetBrains Mono).
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, Users, Briefcase, Route as RouteIcon, GraduationCap, BarChart3,
  AlertTriangle, Sparkles, ArrowUpRight, Calendar, ExternalLink, LogIn,
  Inbox, Settings2,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { Money } from '../lib/money';
import { computePayslip, getRegime } from '../lib/payroll';
import { TENANT_CURRENCY } from '../data/countries';
import { EMPLOYEES, employeeName } from '../data/mock';

const fmtCompact = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.0', '')} Mds`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return String(Math.round(n));
};

interface QuickAccess {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: 'amber' | 'emerald' | 'rose' | 'blue' | 'violet' | 'indigo';
}

const QUICK: QuickAccess[] = [
  { to: '/cockpit-360', label: 'Le Cockpit',     icon: Home,           tone: 'amber'   },
  { to: '/collaborateurs', label: 'Collaborateurs', icon: Users,        tone: 'emerald' },
  { to: '/paie',         label: 'Paie & Bulletins', icon: Briefcase,    tone: 'blue'    },
  { to: '/hr/queue',     label: 'File d\'attente', icon: Inbox,         tone: 'rose'    },
  { to: '/formation',    label: 'Formation',      icon: GraduationCap,  tone: 'violet'  },
  { to: '/carrieres',    label: 'Carrières',      icon: RouteIcon,      tone: 'indigo'  },
];

const ADMIN_QUICK: QuickAccess[] = [
  { to: '/admin',        label: 'Admin Atlas Studio',  icon: Settings2,  tone: 'amber'   },
  { to: '/objectifs',    label: 'Reporting & OKR',     icon: BarChart3,  tone: 'indigo'  },
];

const TONE_BG: Record<QuickAccess['tone'], string> = {
  amber:   'bg-gradient-to-br from-amber/[0.10] via-amber/[0.04] to-transparent text-amber-deep',
  emerald: 'bg-gradient-to-br from-emerald-500/[0.10] via-emerald-500/[0.04] to-transparent text-emerald-600',
  blue:    'bg-gradient-to-br from-blue-500/[0.10] via-blue-500/[0.04] to-transparent text-blue-600',
  violet:  'bg-gradient-to-br from-violet-500/[0.10] via-violet-500/[0.04] to-transparent text-violet-600',
  rose:    'bg-gradient-to-br from-rose-500/[0.10] via-rose-500/[0.04] to-transparent text-rose-600',
  indigo:  'bg-gradient-to-br from-indigo-500/[0.10] via-indigo-500/[0.04] to-transparent text-indigo-600',
};

/** Mini sparkline SVG sans dépendance — 8 points légèrement bruités, déterministe. */
function MiniSpark({ tone, seed }: { tone: 'amber' | 'rose' | 'emerald' | 'indigo'; seed: number }) {
  const W = 200, H = 36;
  const pts = Array.from({ length: 16 }, (_, i) => {
    const x = (i / 15) * W;
    // Pseudo-random déterministe basé sur seed + i
    const noise = Math.sin(seed * 1.7 + i * 0.6) * 4 + Math.cos(seed * 0.3 + i * 1.2) * 3;
    const y = H * 0.5 + noise + (i / 15) * 6;
    return [x, Math.max(2, Math.min(H - 2, y))] as [number, number];
  });
  const d = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
  const dFill = `${d} L${W},${H} L0,${H} Z`;
  const color = tone === 'amber' ? '#C97E12' : tone === 'rose' ? '#E11D48' : tone === 'emerald' ? '#16A34A' : '#4F46E5';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" preserveAspectRatio="none" height={H}>
      <path d={dFill} fill={color} fillOpacity="0.08" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Cockpit Welcome page (route /accueil).
 * Au modèle Atlas Studio CR — pas Atlas People CockpitPage (qui reste sur /).
 */
export function WelcomeCockpitPage() {
  const k = useMemo(() => {
    let employerCost = Money.zero(TENANT_CURRENCY);
    let net = Money.zero(TENANT_CURRENCY);
    for (const e of EMPLOYEES) {
      const regime = getRegime(e.countryCode);
      const { result } = computePayslip(
        {
          baseSalary: e.baseSalary,
          taxableAllowances: e.taxableAllowances,
          nonTaxableAllowances: e.nonTaxableAllowances,
          fiscalParts: e.fiscalParts,
          otherDeductions: e.otherDeductions,
        },
        regime,
        employeeName(e),
      );
      employerCost = employerCost.add(Money.fromJSON({ units: result.employerCostUnits, currency: TENANT_CURRENCY }));
      net = net.add(Money.fromJSON({ units: result.netToPayUnits, currency: TENANT_CURRENCY }));
    }
    const active = EMPLOYEES.filter((e) => e.status === 'active').length;
    const retention = Math.round((1 - EMPLOYEES.filter((e) => e.retentionAttention >= 55).length / EMPLOYEES.length) * 100);
    return {
      effectif: EMPLOYEES.length,
      activeRatio: Math.round((active / EMPLOYEES.length) * 100),
      employerCost: employerCost.toInt(),
      net: net.toInt(),
      retention,
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-amber/[0.02] via-surface to-surface text-ink">

      {/* ───────── 1. Header tenant compact ───────── */}
      <header className="border-b border-line bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3.5">
          <Link to="/accueil" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-deep to-amber text-surface shadow-sm">
              <Home size={16} />
            </span>
            <div>
              <p className="text-[14px] font-bold leading-tight text-ink">Atlas Démo SARL</p>
              <p className="text-[10px] font-medium leading-tight text-ink-500">
                Cocody · Abidjan · CI · FCFA <span className="mx-1 text-ink-300">·</span> <span className="text-amber-deep">démo</span>
              </p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/landing"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-semibold text-ink-500 transition-colors hover:border-amber-deep/30 hover:text-amber-deep">
              <ExternalLink size={10} /> Landing publique
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-semibold text-ink-500">
              <Calendar size={11} /> Période <strong className="ml-0.5 text-ink">Avril 2026</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-50/40 px-3 py-1 text-[11px] font-semibold text-rose-700">
              <AlertTriangle size={11} className="text-rose-500" /> 12 alertes
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-50/40 px-3 py-1 text-[11px] font-semibold text-violet-700">
              <Sparkles size={11} className="text-violet-500" /> PROPH3T HR
            </span>
            <Link to="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-1.5 text-[12px] font-bold text-surface transition-shadow hover:shadow-lg">
              <LogIn size={13} /> Entrer dans l'app
            </Link>
          </div>
        </div>
      </header>

      {/* ───────── 2. Hero centré ───────── */}
      <section className="mx-auto max-w-7xl px-6 pb-6 pt-16 text-center">
        <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Bienvenue · Juin 2026
        </p>
        <h1 className="font-display leading-[1.02] tracking-tight">
          <span className="text-[64px] text-ink sm:text-[88px]">Cockpit </span>
          <span className="text-[64px] text-amber-deep sm:text-[88px]">RH</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[14px] font-medium leading-relaxed text-ink-500">
          Pilotage de vos <strong className="text-ink">collaborateurs</strong>, de la <strong className="text-ink">paie déterministe</strong>,
          des <strong className="text-ink">carrières</strong>, de la <strong className="text-ink">formation FDFP</strong> et de la <strong className="text-ink">conformité OHADA · SYSCOHADA</strong>.
        </p>
      </section>

      {/* ───────── 3. 4 KPI cards (style CockpitCR) ───────── */}
      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Effectif total"
            value={String(k.effectif)}
            unit="collaborateurs"
            sub={`${k.activeRatio}% actifs YTD`}
            tone="amber"
            seed={1}
          />
          <KpiCard
            label="Coût employeur"
            value={`${fmtCompact(k.employerCost)} FCFA`}
            unit="mensuel"
            sub={`Net ${fmtCompact(k.net)} · -2.1% vs M-1`}
            tone="rose"
            seed={2}
          />
          <KpiCard
            label="Conformité globale"
            value="94"
            unit="/ 100"
            sub="DUER · AT · RPS · FDFP"
            tone="emerald"
            seed={3}
          />
          <KpiCard
            label="Engagement"
            value={`${k.retention}%`}
            unit="rétention 12m"
            sub="9.1 / 10 pulse moyen"
            tone="indigo"
            seed={4}
          />
        </div>
      </section>

      {/* ───────── 4. 6 accès rapides (opérationnels) ───────── */}
      <section className="mx-auto max-w-7xl px-6 pb-10">
        <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-ink-400">Accès rapide</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.to}
                to={q.to}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-6 text-center transition-all hover:-translate-y-0.5 hover:border-amber-deep/30 hover:shadow-md"
              >
                <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-line/60', TONE_BG[q.tone])}>
                  <Icon size={20} />
                </span>
                <span className="text-[13px] font-semibold text-ink transition-colors group-hover:text-amber-deep">
                  {q.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ───────── 4b. 2 accès admin (méta) ───────── */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-ink-400">Espace administration</p>
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          {ADMIN_QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.to}
                to={q.to}
                className="group flex items-center gap-4 rounded-2xl border border-line bg-gradient-to-br from-amber/[0.04] to-transparent px-5 py-5 text-left transition-all hover:-translate-y-0.5 hover:border-amber-deep/30 hover:shadow-md"
              >
                <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 ring-line/60', TONE_BG[q.tone])}>
                  <Icon size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink transition-colors group-hover:text-amber-deep">{q.label}</p>
                  <p className="text-[11px] font-medium text-ink-500">
                    {q.to === '/admin' ? 'Console méta · utilisateurs · tenant · paramètres' : 'Indicateurs cycle · KPI stratégiques'}
                  </p>
                </div>
                <ArrowUpRight size={16} className="shrink-0 text-ink-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ───────── 5. Footer signature ───────── */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6">
          <p className="text-[11px] font-medium text-ink-400">
            Atlas People · Atlas Studio · OHADA — 17 États · SYSCOHADA révisé 2017 · Tenant démo Côte d'Ivoire (XOF)
          </p>
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <Link to="/landing" className="inline-flex items-center gap-1 text-ink-500 hover:text-amber-deep">
              <ExternalLink size={11} /> Landing publique
            </Link>
            <span className="text-ink-300">·</span>
            <Link to="/" className="inline-flex items-center gap-1 text-ink-500 hover:text-amber-deep">
              <LogIn size={11} /> Entrer dans l'app
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  sub: string;
  tone: 'amber' | 'rose' | 'emerald' | 'indigo';
  seed: number;
}

function KpiCard({ label, value, unit, sub, tone, seed }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="mono text-[34px] font-bold leading-none text-ink">{value}</span>
        <span className="text-[12px] font-medium text-ink-500">{unit}</span>
      </div>
      <p className="mt-1 text-[11px] font-medium text-ink-500">{sub}</p>
      <MiniSpark tone={tone} seed={seed} />
    </div>
  );
}
