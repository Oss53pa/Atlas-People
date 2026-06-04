/**
 * Atlas People — Landing publique (modèle Atlas Studio FnA).
 *
 * Page d'accueil non-authentifiée :
 *   • Header navigation (Applications · Tarifs · Blog · À propos · FAQ · Contact)
 *   • Hero centré : badge + titre Grand Hotel + 2 CTAs + chips entreprises
 *   • Bandeau stats (collaborateurs · pays OHADA · conformité · disponibilité)
 *
 * Light theme premium · amber-deep · typographie cahier.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Zap, Play, Sparkles, Moon,
  Users, CalendarClock, Wallet, ReceiptText, FileSignature, Briefcase,
  Rocket, Target, Gauge, Network, Route as RouteIcon, GraduationCap,
  ShieldCheck, LayoutGrid, Check, ChevronDown, Mail,
} from 'lucide-react';
import { cn } from '../lib/cn';

const NAV_ITEMS = [
  { label: 'Modules', to: '/landing#modules' },
  { label: 'Tarifs', to: '/landing#tarifs' },
  { label: 'Blog', to: '/landing#blog' },
  { label: 'À propos', to: '/landing#about' },
  { label: 'FAQ', to: '/landing#faq' },
  { label: 'Contact', to: '/landing#contact' },
];

const PILOT_CHIPS = ['SG', 'CD', 'MK', 'PA']; // initiales de pilotes (factices)

const STATS = [
  { value: '10 k+', label: 'Collaborateurs gérés' },
  { value: '14', label: 'Régimes OHADA' },
  { value: '100 %', label: 'Conformité légale' },
  { value: '99.9 %', label: 'Disponibilité' },
];

interface ModuleCard {
  code: string;
  label: string;
  tagline: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const MODULES: ModuleCard[] = [
  { code: 'M1',  label: 'Collaborateurs',      tagline: 'Dossier 360° · cycle de vie · avenants · sortie',          icon: Users },
  { code: 'M2',  label: 'Temps & absences',    tagline: 'Congés OHADA · pointage · plannings · heures sup',        icon: CalendarClock },
  { code: 'M3',  label: 'Paie déterministe',   tagline: 'Calcul reproductible · bulletins · 14 régimes',           icon: Wallet },
  { code: 'M4',  label: 'Notes de frais',      tagline: 'Per diem · justificatifs · politique de frais',           icon: ReceiptText },
  { code: 'M5',  label: 'Recrutement',         tagline: 'ATS · pipeline · scorecards · cooptation',                icon: Briefcase },
  { code: 'M6',  label: 'Onboarding',          tagline: 'Parcours 30/60/90 · buddy · pulse NPS',                   icon: Rocket },
  { code: 'M7',  label: 'OKR',                 tagline: 'Cascade · check-ins · scoring · rétrospective',           icon: Target },
  { code: 'M8',  label: 'Évaluations',         tagline: '9-box · 360° · calibration · plans dev',                  icon: Gauge },
  { code: 'M9',  label: 'Compétences',         tagline: 'Cartographie · PDC · certifications · anti-discrim',      icon: Network },
  { code: 'M10', label: 'Carrières',           tagline: 'Trajectoires · succession · mentorat · expatriation',     icon: RouteIcon },
  { code: 'M11', label: 'Formation',           tagline: 'PIF · LMS · FDFP/3FPT · audit anti-fraude',               icon: GraduationCap },
  { code: 'M12', label: 'Conformité & SST',    tagline: 'DUER · AT/MP · RPS · déclarations sociales',              icon: ShieldCheck },
  { code: 'M13', label: 'Cockpit DRH',         tagline: 'Vue 360° unifiée · 8 onglets · What-if · PROPH3T',        icon: LayoutGrid },
  { code: 'ESS', label: 'Self-service ESS',    tagline: 'Espace collaborateur · mobile · congés · paie',           icon: Sparkles },
];

interface PricingPlan {
  name: string;
  price: string;
  unit: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

const PLANS: PricingPlan[] = [
  {
    name: 'Starter',
    price: '8 000',
    unit: 'FCFA / collab / mois',
    description: 'Idéal pour PME jusqu\'à 100 collaborateurs',
    features: [
      'M1 Dossier + M2 Temps + M3 Paie',
      'Self-service ESS mobile',
      'Conformité OHADA 1 pays',
      'Audit SHA-256 inclus',
      'Support email · jours ouvrés',
    ],
    cta: 'Commencer',
  },
  {
    name: 'Business',
    price: '14 000',
    unit: 'FCFA / collab / mois',
    description: 'Pour scale-up et groupes 100-500 collaborateurs',
    features: [
      'Tous les modules M1 → M12',
      'Cockpit DRH unifié + What-if',
      'Multi-pays OHADA (14 régimes)',
      'PROPH3T narrative IA souveraine',
      'FDFP automatisé · audit anti-fraude',
      'Support prioritaire · SLA 4h',
    ],
    highlighted: true,
    cta: 'Choisir Business',
  },
  {
    name: 'Enterprise',
    price: 'Sur devis',
    unit: '500+ collaborateurs',
    description: 'Grands comptes multi-filiales OHADA',
    features: [
      'Tous les modules + sandbox dédié',
      'SLA 99.99 % · DRP géo-redondé',
      'SSO Atlas Studio · MFA renforcée',
      'Customer Success Manager dédié',
      'Roadmap influencée · early access',
      'Audit RGPD + ISO 27001',
    ],
    cta: 'Nous contacter',
  },
];

interface FaqItem { q: string; a: string }
const FAQ: FaqItem[] = [
  {
    q: 'Atlas People couvre-t-il vraiment les 14 régimes OHADA ?',
    a: 'Oui — Atlas People couvre les 8 pays UEMOA (Bénin, Burkina, Côte d\'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, Togo) et les 6 pays CEMAC (Cameroun, Centrafrique, Tchad, Congo, Guinée Équatoriale, Gabon) — soit 14 régimes de paie/fiscalité distincts. Le moteur déterministe garantit que le bulletin se reproduit à l\'identique avec les mêmes entrées.',
  },
  {
    q: 'Vos données restent-elles en Afrique ?',
    a: 'Oui. L\'infrastructure de confiance Atlas Studio est répliquée en Côte d\'Ivoire et Sénégal. Aucune donnée RH ne quitte l\'espace OHADA. PROPH3T (notre couche IA) tourne en local Ollama — vos données ne sont jamais envoyées à OpenAI / Anthropic / Google.',
  },
  {
    q: 'Quelle est la différence avec un logiciel français ou européen ?',
    a: 'Atlas People est conçu dès l\'origine pour les spécificités OHADA : per diem, primes pénibilité, IUTS Sénégal, IRPP par tranche, CNPS, fonds 3FPT/FDFP, Mobile Money pour les versements. Les logiciels européens nécessitent des contournements (champs custom, plugins payants) qui cassent l\'audit légal.',
  },
  {
    q: 'Comment Atlas People se connecte à mon SIRH actuel ?',
    a: 'Atlas People expose une API REST + Webhooks + connecteurs prêts pour Sage Paie i7, Cegid Talents, ADP, Workday, BambooHR. Migration assistée incluse en Business et Enterprise (import collaborateurs, contrats, historique paie).',
  },
  {
    q: 'Le module Formation gère-t-il vraiment le FDFP ?',
    a: 'Oui — déclarations 3FPT (Sénégal), FDFP (Côte d\'Ivoire), FNFP (Cameroun) automatisées avec audit SHA-256 chaîné. Notre module détecte automatiquement 10 patterns suspects (présences fictives, refacturations, double paiements) pour vous protéger d\'un contrôle.',
  },
  {
    q: 'Combien de temps pour démarrer ?',
    a: 'Tenant Starter : 24 à 48 h après signature. Business : 5 jours ouvrés incluant import collaborateurs + paramétrage paie + formation administrateur. Enterprise : 4 à 8 semaines selon la complexité multi-filiales.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* ─────────────────────── Header ─────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          {/* Logo */}
          <Link to="/landing" className="flex items-baseline gap-2">
            <span className="font-display text-[26px] leading-none text-amber-deep">Atlas Studio</span>
            <span className="text-ink-400">/</span>
            <span className="font-display text-[22px] leading-none text-ink">Atlas People</span>
          </Link>

          {/* Nav */}
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV_ITEMS.map((it) => (
              <a key={it.label} href={it.to}
                className="text-[13px] font-semibold text-ink-500 transition-colors hover:text-amber-deep">
                {it.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button type="button" aria-label="Thème" className="hidden text-ink-400 transition-colors hover:text-ink sm:inline-flex">
              <Moon size={16} />
            </button>
            <Link to="/accueil"
              className="hidden items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-[13px] font-bold text-ink transition-colors hover:border-amber-deep/40 hover:text-amber-deep sm:inline-flex">
              Démo accueil
            </Link>
            <Link to="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-[13px] font-bold text-surface transition-shadow hover:shadow-lg">
              Mon espace <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────── Hero ─────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Halos décoratifs */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/4 h-[480px] w-[480px] rounded-full bg-amber/[0.06] blur-3xl" />
          <div className="absolute right-0 top-32 h-[360px] w-[360px] rounded-full bg-emerald-500/[0.04] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 shadow-sm">
            <Sparkles size={13} className="text-amber-deep" />
            <span className="text-[12px] font-bold text-ink">100 % conforme OHADA · 14 régimes UEMOA + CEMAC</span>
          </span>

          <h1 className="font-display text-[64px] leading-[1.04] tracking-tight text-ink sm:text-[78px]">
            La gestion RH africaine,
          </h1>
          <h1 className="mt-2 font-display text-[64px] leading-[1.04] tracking-tight text-amber-deep sm:text-[78px]">
            premium et intelligente.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-[15px] font-medium leading-relaxed text-ink-500">
            Atlas People est le SIRH conçu pour les <strong className="text-ink">17 pays de l'espace OHADA</strong>.
            Paie déterministe, conformité légale, OKR, formation, carrières — tout est intégré.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[14px] font-bold text-surface shadow-sm transition-shadow hover:shadow-lg">
              <Zap size={16} className="text-amber" /> Souscrire maintenant <ArrowRight size={14} />
            </Link>
            <a href="#demo"
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3 text-[14px] font-bold text-ink transition-colors hover:border-amber-deep/40 hover:bg-amber/[0.04]">
              <Play size={14} /> Voir la démo
            </a>
          </div>

          {/* Chips pilotes */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {PILOT_CHIPS.map((p, i) => (
                <span key={p}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface text-[11px] font-bold text-surface shadow-sm',
                    i === 0 && 'bg-amber-deep',
                    i === 1 && 'bg-emerald-600',
                    i === 2 && 'bg-rose-500',
                    i === 3 && 'bg-blue-600',
                  )}>
                  {p}
                </span>
              ))}
            </div>
            <p className="text-[13px] font-medium text-ink-500">
              Choisi par <strong className="text-ink">10+ entreprises pilotes</strong> en Côte d'Ivoire · Sénégal · Cameroun
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────── Bandeau stats ─────────────────────── */}
      <section className="border-y border-line bg-gradient-to-b from-surface to-surface2/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-12 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="mono text-[44px] font-bold leading-none text-ink">{s.value}</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────── Modules ─────────────────────── */}
      <section id="modules" className="scroll-mt-20 bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-deep">14 modules intégrés</p>
            <h2 className="mt-3 font-display text-[44px] leading-tight text-ink sm:text-[56px]">Un seul SIRH, <span className="text-amber-deep">tous vos métiers RH</span></h2>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] font-medium leading-relaxed text-ink-500">
              De l'embauche à la sortie · paie déterministe · OKR · formation FDFP · conformité SST · cockpit unifié.
              <strong className="text-ink"> Chaque module est conçu pour les régimes OHADA</strong>, pas un patch sur un logiciel européen.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.code} className="group rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-amber-deep/30 hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="mono rounded-md bg-amber/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-deep">{m.code}</span>
                    <Icon size={16} className="text-ink-400 transition-colors group-hover:text-amber-deep" />
                  </div>
                  <h3 className="mt-3 text-[14px] font-bold text-ink">{m.label}</h3>
                  <p className="mt-1 text-[11px] font-medium leading-relaxed text-ink-500">{m.tagline}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────── Tarifs ─────────────────────── */}
      <section id="tarifs" className="scroll-mt-20 border-y border-line bg-gradient-to-b from-surface2/30 to-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-deep">Tarifs simples · sans engagement</p>
            <h2 className="mt-3 font-display text-[44px] leading-tight text-ink sm:text-[56px]">Trois plans, <span className="text-amber-deep">aucune surprise</span></h2>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] font-medium leading-relaxed text-ink-500">
              Facturation au collaborateur · arrêt à tout moment · données exportables au format CSV / SQL.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={cn(
                  'rounded-3xl border bg-surface p-7 transition-all',
                  p.highlighted
                    ? 'border-amber-deep/40 shadow-lg ring-1 ring-amber-deep/20 lg:-translate-y-2'
                    : 'border-line shadow-sm hover:shadow-md'
                )}
              >
                {p.highlighted && (
                  <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-amber-deep px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-surface">
                    <Sparkles size={11} /> Recommandé
                  </span>
                )}
                <h3 className="text-[20px] font-bold text-ink">{p.name}</h3>
                <p className="mt-1 text-[12px] font-medium text-ink-500">{p.description}</p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="mono text-[40px] font-bold leading-none text-ink">{p.price}</span>
                  {p.price !== 'Sur devis' && <span className="text-[12px] font-medium text-ink-500">{p.unit}</span>}
                </div>
                {p.price === 'Sur devis' && <p className="mt-1 text-[12px] font-medium text-ink-500">{p.unit}</p>}
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] font-medium text-ink-700">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/admin"
                  className={cn(
                    'mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-bold transition-shadow',
                    p.highlighted
                      ? 'bg-ink text-surface shadow-sm hover:shadow-lg'
                      : 'border border-line bg-surface text-ink hover:border-amber-deep/40'
                  )}
                >
                  {p.cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── FAQ ─────────────────────── */}
      <section id="faq" className="scroll-mt-20 bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-deep">Questions fréquentes</p>
            <h2 className="mt-3 font-display text-[44px] leading-tight text-ink sm:text-[56px]">À savoir sur <span className="text-amber-deep">Atlas People</span></h2>
          </div>

          <div className="mt-12 divide-y divide-line rounded-3xl border border-line bg-surface">
            {FAQ.map((item, i) => <FaqRow key={i} q={item.q} a={item.a} />)}
          </div>

          <p className="mt-8 text-center text-[13px] font-medium text-ink-500">
            Une autre question ?{' '}
            <a href="#contact" className="inline-flex items-center gap-1 font-bold text-amber-deep hover:underline">
              <Mail size={12} /> Écrivez-nous
            </a>
          </p>
        </div>
      </section>

      {/* ─────────────────────── CTA final ─────────────────────── */}
      <section className="border-t border-line bg-gradient-to-br from-amber/[0.06] via-surface to-surface">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="font-display text-[44px] leading-tight tracking-tight text-ink sm:text-[56px]">
            Prêt à digitaliser <span className="text-amber-deep">vos RH ?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[14px] font-medium leading-relaxed text-ink-500">
            Démarrez en 24 h avec le tenant démo · ou contactez-nous pour un devis Enterprise.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/accueil"
              className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[14px] font-bold text-surface shadow-sm transition-shadow hover:shadow-lg">
              <Play size={16} /> Voir la démo en live
            </Link>
            <Link to="/admin"
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3 text-[14px] font-bold text-ink transition-colors hover:border-amber-deep/40 hover:bg-amber/[0.04]">
              <Zap size={14} /> Démarrer un tenant
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────── Footer minimal ─────────────────────── */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <p className="text-[12px] font-medium text-ink-400">
            © 2026 Atlas Studio · Atlas People — SIRH OHADA · 17 États
          </p>
          <div className="flex gap-5 text-[12px] font-semibold text-ink-500">
            <a href="#privacy" className="hover:text-amber-deep">Confidentialité</a>
            <a href="#terms" className="hover:text-amber-deep">CGU</a>
            <a href="#legal" className="hover:text-amber-deep">Mentions légales</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Accordion FAQ (état local par row).
 * ────────────────────────────────────────────────────────── */
function FaqRow({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className="group"
    >
      <summary className="flex cursor-pointer items-start justify-between gap-3 px-6 py-5 transition-colors hover:bg-amber/[0.04]">
        <span className="flex-1 text-[15px] font-semibold text-ink">{q}</span>
        <ChevronDown size={18} className={cn('mt-0.5 shrink-0 text-ink-400 transition-transform', open && 'rotate-180 text-amber-deep')} />
      </summary>
      <p className="px-6 pb-5 text-[13px] font-medium leading-relaxed text-ink-500">{a}</p>
    </details>
  );
}
