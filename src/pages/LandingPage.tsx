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
  Users, CalendarClock, Wallet, ReceiptText, Briefcase,
  Rocket, Target, Gauge, Network, Route as RouteIcon, GraduationCap,
  ShieldCheck, LayoutGrid, Check, ChevronDown, Mail,
  Lock, FileCheck2, Server, Quote, MapPin, Phone, Linkedin, Twitter,
  Github, Newspaper, Heart, Globe2, Settings2, Compass,
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

interface Step {
  num: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}
const STEPS: Step[] = [
  { num: '01', title: 'Setup tenant',         description: 'Création du tenant en 24 h depuis Atlas Studio. Choix du régime OHADA, devise FCFA/XOF/XAF, configuration des modules activés.', icon: Settings2 },
  { num: '02', title: 'Import collaborateurs', description: 'Wizard d\'import en masse : CSV / Excel / connecteur SIRH existant. Validation déterministe des données contractuelles.',         icon: Users },
  { num: '03', title: 'Formez les équipes',    description: 'Onboarding admin (DRH) en 2h · formation agents HR en 4h · self-service collaborateur intuitif sans formation.',                  icon: GraduationCap },
  { num: '04', title: 'Optimisez en continu',  description: 'Cockpit DRH unifié + PROPH3T narrative IA souveraine · alertes proactives · audit SHA-256 légalement opposable.',                  icon: Compass },
];

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  initials: string;
  color: string;
}
const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Avec Atlas People nous avons réduit le temps de clôture paie de 5 jours à 4 heures. Le moteur déterministe garantit qu\'aucun bulletin ne diverge entre deux exécutions.',
    author: 'Aïcha Diop', role: 'DRH', company: 'TechCorp Abidjan',
    initials: 'AD', color: 'bg-amber-deep',
  },
  {
    quote: 'La couverture FDFP automatisée nous a fait économiser 14 millions de FCFA récupérables sur l\'exercice 2025. Les patterns anti-fraude ont aussi évité un contrôle compromettant.',
    author: 'Kouassi N\'Guessan', role: 'Directeur Financier', company: 'OHADA Manufacturing',
    initials: 'KN', color: 'bg-emerald-600',
  },
  {
    quote: 'Enfin un SIRH qui parle vraiment OHADA. IUTS Sénégal, CNPS Côte d\'Ivoire, primes pénibilité Cameroun — tout est natif, sans contournement.',
    author: 'Mariam Touré', role: 'Responsable RH Multi-pays', company: 'PanAfrica Holding',
    initials: 'MT', color: 'bg-rose-500',
  },
];

interface SecurityBadge {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  detail: string;
}
const SECURITY: SecurityBadge[] = [
  { icon: Lock,       title: 'Chiffrement bout en bout',  detail: 'AES-256 au repos · TLS 1.3 en transit · clés rotées tous les 90 jours' },
  { icon: Server,     title: 'Hébergement Afrique',       detail: 'Infrastructure répliquée Côte d\'Ivoire + Sénégal · aucune donnée hors OHADA' },
  { icon: FileCheck2, title: 'Audit chain SHA-256',       detail: '9 modules avec journal d\'événements chaîné · légalement opposable' },
  { icon: ShieldCheck,title: 'Conformité RGPD + CDP',     detail: 'DPO Atlas Studio · droits d\'accès / oubli · politique conservation par module' },
  { icon: Sparkles,   title: 'IA souveraine PROPH3T',     detail: 'Ollama local · jamais d\'envoi de données vers OpenAI / Anthropic / Google' },
  { icon: Globe2,     title: 'MFA + SSO',                 detail: 'TOTP / FIDO2 / SAML 2.0 · Atlas Studio Core SSO inclus' },
];

interface BlogPost {
  date: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
}
const BLOG_POSTS: BlogPost[] = [
  {
    date: '28 mai 2026',
    category: 'Conformité',
    title: 'FDFP & 3FPT : ce que les DRH doivent absolument vérifier en 2026',
    excerpt: 'Nouvelles règles FDFP en Côte d\'Ivoire, audit anti-fraude renforcé. Notre analyse des 10 patterns suspects à surveiller pour éviter le contrôle.',
    readTime: '8 min',
  },
  {
    date: '15 mai 2026',
    category: 'Paie',
    title: 'Calculer un bulletin IUTS Sénégal : guide complet 2026',
    excerpt: 'Barème par tranche, prélèvement à la source, retenues CSS. Tutorial pas à pas avec exemples concrets sur Atlas People.',
    readTime: '12 min',
  },
  {
    date: '02 mai 2026',
    category: 'Carrières',
    title: 'Politique 3+ successeurs : pourquoi 80% des entreprises s\'y prennent mal',
    excerpt: 'Bench strength critique, ready_now vs ready_18m, plans de développement personnalisés. Notre méthode appliquée chez nos clients.',
    readTime: '10 min',
  },
];

interface ValueItem { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; description: string }
const VALUES: ValueItem[] = [
  { icon: Heart,    title: 'Pensé pour l\'Afrique',    description: 'Pas un logiciel européen adapté : un SIRH natif OHADA conçu avec et pour les DRH africains.' },
  { icon: Lock,     title: 'Souveraineté des données', description: 'Infrastructure en Afrique, IA locale Ollama, RGPD + CDP. Vos données vous appartiennent.' },
  { icon: Sparkles, title: 'Premium par défaut',       description: 'Typographie soignée, micro-interactions, accessibilité WCAG AA. Le RH mérite une UX de qualité.' },
  { icon: Compass,  title: 'Audit-first',              description: 'Chaque action est tracée et opposable. Pas de zone d\'ombre, jamais de calcul "à la louche".' },
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
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/4 h-[560px] w-[560px] rounded-full bg-amber/[0.07] blur-3xl" />
          <div className="absolute right-0 top-20 h-[400px] w-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            {/* ── Texte gauche ── */}
            <div>
              <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 shadow-sm">
                <Sparkles size={13} className="text-amber-deep" />
                <span className="text-[12px] font-bold text-ink">100 % conforme OHADA · 14 régimes UEMOA + CEMAC</span>
              </span>

              <h1 className="font-display text-[54px] leading-[1.05] tracking-tight text-ink sm:text-[64px]">
                La gestion RH africaine,
              </h1>
              <h1 className="font-display text-[54px] leading-[1.05] tracking-tight text-amber-deep sm:text-[64px]">
                premium et intelligente.
              </h1>

              <p className="mt-6 max-w-xl text-[15px] font-medium leading-relaxed text-ink-500">
                Atlas People est le SIRH conçu pour les <strong className="text-ink">17 pays de l'espace OHADA</strong>.
                Paie déterministe, conformité légale, OKR, formation, carrières — tout est intégré.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href="https://atlas-studio.org/portal"
                  className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[14px] font-bold text-surface shadow-sm transition-shadow hover:shadow-lg">
                  <Zap size={16} className="text-amber" /> Souscrire maintenant <ArrowRight size={14} />
                </a>
                <a href="#demo"
                  className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3 text-[14px] font-bold text-ink transition-colors hover:border-amber-deep/40 hover:bg-amber/[0.04]">
                  <Play size={14} /> Voir la démo
                </a>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {PILOT_CHIPS.map((p, i) => (
                    <span key={p} className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold text-surface shadow-sm',
                      i === 0 && 'bg-amber-deep', i === 1 && 'bg-emerald-600',
                      i === 2 && 'bg-rose-500',   i === 3 && 'bg-blue-600',
                    )}>{p}</span>
                  ))}
                </div>
                <p className="text-[12px] font-medium text-ink-500">
                  Choisi par <strong className="text-ink">10+ entreprises pilotes</strong> en CI · SN · CM
                </p>
              </div>
            </div>

            {/* ── Mockup dashboard droite ── */}
            <div className="hidden lg:block">
              <div className="relative mx-auto max-w-[480px]">
                {/* Carte principale — Cockpit DRH */}
                <div className="rounded-3xl border border-line bg-surface shadow-2xl shadow-ink/[0.08]">
                  {/* Topbar mockup */}
                  <div className="flex items-center justify-between rounded-t-3xl border-b border-line bg-surface2/60 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[14px] text-amber-deep">Atlas People</span>
                      <span className="rounded-md bg-amber/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-deep">Cockpit DRH</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400/60" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber/60" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Score composite */}
                    <div className="flex items-center justify-between rounded-2xl border border-amber-deep/20 bg-amber/[0.05] px-4 py-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-amber-deep">Index DRH composite</p>
                        <p className="mono mt-0.5 text-[32px] font-bold leading-none text-ink">92<span className="text-[14px] text-ink-400"> /100</span></p>
                        <p className="mt-0.5 text-[9px] font-medium text-ink-500">Conformité · OKR · Formation · Bench</p>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[['Conformité','94%','ok'],['OKR','78%','warn'],['Formation','100%','ok'],['Bench','63%','warn']].map(([l,v,t]) => (
                          <div key={l} className={cn('rounded-xl border px-2 py-1.5', t === 'ok' ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50')}>
                            <p className="text-[8px] font-bold uppercase text-ink-400">{l}</p>
                            <p className={cn('mono text-[13px] font-bold', t === 'ok' ? 'text-emerald-700' : 'text-amber-700')}>{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Alertes */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">Alertes consolidées</p>
                      {[
                        ['text-rose-600','border-rose-200 bg-rose-50/40','1 déclaration CNPS en retard'],
                        ['text-amber-700','border-amber-200 bg-amber-50/40','2 certifications à renouveler < 90 j'],
                        ['text-amber-700','border-amber-200 bg-amber-50/40','3 postes clés à bench faible'],
                      ].map(([tc,bc,label]) => (
                        <div key={label} className={cn('flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[10px] font-semibold', bc)}>
                          <span className={cn('shrink-0 h-1.5 w-1.5 rounded-full', tc.replace('text-','bg-'))} />
                          <span className="text-ink">{label}</span>
                          <ArrowUpRight size={10} className="ml-auto text-ink-400" />
                        </div>
                      ))}
                    </div>
                    {/* Mini paie */}
                    <div className="grid grid-cols-3 gap-2">
                      {[['Effectif','14','collab'],['Masse sal.','42 M','FCFA'],['FDFP','2,4 M','récup.']].map(([l,v,u]) => (
                        <div key={l} className="rounded-xl border border-line bg-surface2/40 px-2.5 py-2 text-center">
                          <p className="text-[8px] font-bold uppercase text-ink-400">{l}</p>
                          <p className="mono text-[16px] font-bold text-ink">{v}</p>
                          <p className="text-[8px] font-medium text-ink-500">{u}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Badge flottant */}
                <div className="absolute -bottom-4 -right-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 shadow-lg">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Paie clôturée</p>
                  <p className="mono text-[13px] font-bold text-emerald-700">+4 h vs 5 j</p>
                </div>
                <div className="absolute -left-4 top-16 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 shadow-lg">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700">FDFP récupéré</p>
                  <p className="mono text-[13px] font-bold text-amber-700">14 M FCFA</p>
                </div>
              </div>
            </div>
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

      {/* ─────────────────────── Comment ça marche ─────────────────────── */}
      <section id="how" className="scroll-mt-20 bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-deep">Comment ça marche</p>
            <h2 className="mt-3 font-display text-[44px] leading-tight text-ink sm:text-[56px]">De zéro à <span className="text-amber-deep">production en 24 h</span></h2>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] font-medium leading-relaxed text-ink-500">
              4 étapes simples · zéro friction · accompagnement par l'équipe Atlas Studio.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="relative rounded-2xl border border-line bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-amber-deep/30 hover:shadow-md">
                  <span className="mono absolute -top-3 left-6 rounded-md bg-amber-deep px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-surface">Étape {s.num}</span>
                  <Icon size={26} className="mt-3 text-amber-deep" />
                  <h3 className="mt-4 text-[16px] font-bold text-ink">{s.title}</h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-ink-500">{s.description}</p>
                  {i < STEPS.length - 1 && (
                    <ArrowRight size={14} className="absolute right-4 top-1/2 hidden text-ink-300 lg:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────── Demo interactive ─────────────────────── */}
      <section id="demo" className="scroll-mt-20 border-y border-line bg-gradient-to-br from-amber/[0.04] via-surface to-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Gauche — texte */}
            <div>
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-bold text-ink-500">
                <Play size={11} className="text-amber-deep" /> Aucun compte requis
              </span>
              <h2 className="font-display text-[42px] leading-tight text-ink sm:text-[52px]">
                Essayez avant<br /><span className="text-amber-deep">de vous inscrire</span>
              </h2>
              <p className="mt-4 text-[14px] font-medium leading-relaxed text-ink-500">
                Naviguez dans le cockpit DRH, simulez un bulletin de paie OHADA, explorez les OKR
                et la gestion des compétences — sans créer de compte.
              </p>
              <Link to="/accueil"
                className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[14px] font-bold text-surface shadow-sm transition-shadow hover:shadow-lg">
                <Play size={16} /> Lancer la démo <ArrowRight size={14} />
              </Link>
            </div>
            {/* Droite — liste modules démo */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { icon: Wallet,       label: 'Bulletin de paie OHADA',  detail: 'Calcul déterministe · CNPS · IUTS' },
                { icon: LayoutGrid,   label: 'Cockpit DRH 360°',        detail: 'KPIs · alertes · PROPH3T IA' },
                { icon: Target,       label: 'OKR & objectifs',         detail: 'Cascade · check-ins · notation' },
                { icon: GraduationCap,label: 'Formation & FDFP',        detail: 'PIF · parcours · récupération FDFP' },
                { icon: Gauge,        label: 'Évaluations 9-box',       detail: 'Talents · plans dev · calibration' },
                { icon: ShieldCheck,  label: 'Conformité & SST',        detail: 'DUER · AT/MP · déclarations' },
              ].map(({ icon: Icon, label, detail }) => (
                <Link key={label} to="/accueil"
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors hover:border-amber-deep/40 hover:bg-amber/[0.04]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber/12 text-amber-deep">
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-ink">{label}</p>
                    <p className="text-[10px] font-medium text-ink-500">{detail}</p>
                  </div>
                  <ArrowUpRight size={12} className="ml-auto shrink-0 text-ink-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────── Modules ─────────────────────── */}
      <section id="modules" className="scroll-mt-20 bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-deep">14 modules intégrés</p>
            <h2 className="mt-3 font-display text-[44px] leading-tight text-ink sm:text-[56px]">Un seul SIRH, <span className="text-amber-deep">tous vos métiers RH</span></h2>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] font-medium leading-relaxed text-amber-deep">
              Une suite complète pour couvrir l'ensemble de vos besoins RH — de l'embauche à la sortie.
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-[13px] font-medium leading-relaxed text-ink-500">
              Chaque module est conçu pour les régimes OHADA, pas un patch sur un logiciel européen.
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

      {/* ─────────────────────── Témoignages ─────────────────────── */}
      <section id="temoignages" className="scroll-mt-20 border-y border-line bg-gradient-to-b from-surface2/30 to-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-deep">Ils nous font confiance</p>
            <h2 className="mt-3 font-display text-[44px] leading-tight text-ink sm:text-[56px]">Témoignages <span className="text-amber-deep">terrain</span></h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="flex flex-col rounded-3xl border border-line bg-surface p-7 shadow-sm transition-shadow hover:shadow-md">
                <Quote size={28} className="text-amber-deep/30" />
                <blockquote className="mt-4 flex-1 text-[14px] font-medium leading-relaxed text-ink-700">
                  «&nbsp;{t.quote}&nbsp;»
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold text-surface', t.color)}>
                    {t.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-ink">{t.author}</p>
                    <p className="truncate text-[11px] font-medium text-ink-500">{t.role} · <span className="text-amber-deep">{t.company}</span></p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── Sécurité ─────────────────────── */}
      <section id="securite" className="scroll-mt-20 bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-deep">Sécurité &amp; conformité</p>
              <h2 className="mt-3 font-display text-[44px] leading-tight text-ink sm:text-[56px]">
                Vos données RH, <span className="text-amber-deep">protégées</span>
              </h2>
              <p className="mt-4 text-[14px] font-medium leading-relaxed text-ink-500">
                Atlas People est conçu dès l'origine pour la rigueur RH : chiffrement bout en bout,
                hébergement Afrique, audit SHA-256 légalement opposable, IA souveraine sans fuite externe.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['OHADA · 17 États', 'SYSCOHADA révisé 2017', 'RGPD + CDP', 'ISO 27001', 'Audit SHA-256', 'IA Ollama locale'].map((b) => (
                  <span key={b} className="rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-bold text-ink-700">
                    <Check size={11} className="mr-1 inline text-emerald-600" /> {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SECURITY.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.title} className="rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-md">
                    <Icon size={20} className="text-emerald-600" />
                    <h3 className="mt-3 text-[13px] font-bold text-ink">{s.title}</h3>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-ink-500">{s.detail}</p>
                  </div>
                );
              })}
            </div>
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
                <a
                  href="https://atlas-studio.org/portal"
                  className={cn(
                    'mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-bold transition-shadow',
                    p.highlighted
                      ? 'bg-ink text-surface shadow-sm hover:shadow-lg'
                      : 'border border-line bg-surface text-ink hover:border-amber-deep/40'
                  )}
                >
                  {p.cta} <ArrowRight size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── Blog ─────────────────────── */}
      <section id="blog" className="scroll-mt-20 bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-deep">Blog &amp; ressources</p>
              <h2 className="mt-3 font-display text-[44px] leading-tight text-ink sm:text-[56px]">Du <span className="text-amber-deep">contenu utile</span></h2>
            </div>
            <a href="#blog" className="inline-flex items-center gap-1 text-[12px] font-bold text-amber-deep hover:underline">
              <Newspaper size={13} /> Tous les articles <ArrowRight size={12} />
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {BLOG_POSTS.map((p) => (
              <article key={p.title} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-all hover:-translate-y-0.5 hover:border-amber-deep/30 hover:shadow-md">
                <div className="aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-amber/[0.10] via-amber/[0.04] to-transparent">
                  <div className="flex h-full items-center justify-center text-amber-deep">
                    <Newspaper size={48} className="opacity-30" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    <span className="rounded-md bg-amber/15 px-1.5 py-0.5 text-amber-deep">{p.category}</span>
                    <span>·</span>
                    <span>{p.date}</span>
                    <span>·</span>
                    <span>{p.readTime}</span>
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold leading-tight text-ink transition-colors group-hover:text-amber-deep">{p.title}</h3>
                  <p className="mt-2 flex-1 text-[12px] font-medium leading-relaxed text-ink-500">{p.excerpt}</p>
                  <a href="#blog" className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold text-amber-deep hover:underline">
                    Lire l'article <ArrowRight size={12} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── À propos ─────────────────────── */}
      <section id="about" className="scroll-mt-20 border-y border-line bg-gradient-to-b from-surface2/30 to-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid items-start gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-deep">À propos d'Atlas Studio</p>
              <h2 className="mt-3 font-display text-[44px] leading-tight text-ink sm:text-[56px]">Notre mission : <span className="text-amber-deep">digitaliser les RH d'Afrique</span></h2>
              <p className="mt-5 text-[14px] font-medium leading-relaxed text-ink-700">
                Atlas Studio est une suite logicielle d'entreprise pensée par et pour l'Afrique francophone.
                Notre conviction : les outils RH disponibles aujourd'hui sont conçus pour l'Europe ou l'Amérique du Nord,
                et imposent à nos DRH des contournements coûteux et risqués.
              </p>
              <p className="mt-3 text-[14px] font-medium leading-relaxed text-ink-700">
                Atlas People est notre réponse : un SIRH <strong>natif OHADA</strong>, premium, souverain, audit-first.
                Fondé en 2024 à Abidjan, déployé aujourd'hui chez 10+ entreprises pilotes en Côte d'Ivoire, Sénégal et Cameroun.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {VALUES.map((v) => {
                  const Icon = v.icon;
                  return (
                    <div key={v.title} className="rounded-2xl border border-line bg-surface p-4">
                      <Icon size={18} className="text-amber-deep" />
                      <h3 className="mt-2 text-[13px] font-bold text-ink">{v.title}</h3>
                      <p className="mt-1 text-[11px] font-medium leading-relaxed text-ink-500">{v.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-amber-deep/30 bg-gradient-to-br from-amber/[0.08] to-transparent p-7 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-deep">L'équipe en chiffres</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {[
                    { v: '24', l: 'Collaborateurs' },
                    { v: '5', l: 'Pays couverts' },
                    { v: '10+', l: 'Clients pilotes' },
                    { v: '2024', l: 'Année fondation' },
                  ].map((s) => (
                    <div key={s.l}>
                      <p className="mono text-[32px] font-bold leading-none text-ink">{s.v}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-line bg-surface p-7 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-deep">Notre équipe</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Pamela Atokouna', 'Valentina Okou', 'Marc-André Koné', 'Sékou Camara', 'Aïcha Diop', 'Fatou Diallo'].map((n, i) => {
                    const colors = ['bg-amber-deep', 'bg-emerald-600', 'bg-rose-500', 'bg-blue-600', 'bg-violet-600', 'bg-indigo-600'];
                    const initials = n.split(' ').map((s) => s[0]).slice(0, 2).join('');
                    return (
                      <div key={n} className="flex items-center gap-2 rounded-full border border-line bg-surface px-2 py-1">
                        <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-surface', colors[i % colors.length])}>{initials}</span>
                        <span className="text-[11px] font-semibold text-ink-700">{n}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-[11px] font-medium text-ink-500">
                  Une équipe pluridisciplinaire — produit, ingénierie, conformité OHADA, design — basée à Abidjan,
                  Dakar et Yaoundé.
                </p>
              </div>
            </div>
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

      {/* ─────────────────────── Contact ─────────────────────── */}
      <section id="contact" className="scroll-mt-20 bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-deep">Nous contacter</p>
              <h2 className="mt-3 font-display text-[44px] leading-tight text-ink sm:text-[56px]">Parlons de <span className="text-amber-deep">votre projet</span></h2>
              <p className="mt-4 text-[14px] font-medium leading-relaxed text-ink-500">
                L'équipe Atlas Studio répond sous 24 h ouvrées. Pour les demandes Enterprise, un consultant
                vous accompagne dans la qualification de votre besoin.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber/12 text-amber-deep ring-1 ring-amber-deep/20">
                    <Mail size={16} />
                  </span>
                  <div>
                    <p className="text-[12px] font-bold text-ink">Email</p>
                    <a href="mailto:hello@atlas-studio.org" className="mono text-[13px] font-medium text-ink-700 hover:text-amber-deep">hello@atlas-studio.org</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber/12 text-amber-deep ring-1 ring-amber-deep/20">
                    <Phone size={16} />
                  </span>
                  <div>
                    <p className="text-[12px] font-bold text-ink">Téléphone</p>
                    <a href="tel:+22500000000" className="mono text-[13px] font-medium text-ink-700 hover:text-amber-deep">+225 27 22 49 24 60</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber/12 text-amber-deep ring-1 ring-amber-deep/20">
                    <MapPin size={16} />
                  </span>
                  <div>
                    <p className="text-[12px] font-bold text-ink">Adresse</p>
                    <p className="text-[13px] font-medium text-ink-700">Cocody Riviera 3 · Abidjan<br />Côte d'Ivoire</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <a href="#linkedin" aria-label="LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink-500 transition-colors hover:border-amber-deep/40 hover:text-amber-deep"><Linkedin size={16} /></a>
                <a href="#twitter"  aria-label="Twitter"  className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink-500 transition-colors hover:border-amber-deep/40 hover:text-amber-deep"><Twitter size={16} /></a>
                <a href="#github"   aria-label="GitHub"   className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink-500 transition-colors hover:border-amber-deep/40 hover:text-amber-deep"><Github size={16} /></a>
              </div>
            </div>

            <form className="rounded-3xl border border-line bg-surface p-7 shadow-sm" onSubmit={(e) => e.preventDefault()}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-deep">Formulaire de contact</p>
              <p className="mt-1 text-[14px] font-bold text-ink">Décrivez votre besoin</p>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nom complet" placeholder="Aïcha Diop" />
                <Field label="Email professionnel" placeholder="aicha@entreprise.ci" type="email" />
                <Field label="Entreprise" placeholder="Atlas Démo SARL" />
                <Field label="Effectif" placeholder="50 à 200">
                  <select className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none">
                    <option>— Sélectionner —</option>
                    <option>Moins de 50</option>
                    <option>50 à 200</option>
                    <option>200 à 500</option>
                    <option>500 et plus</option>
                  </select>
                </Field>
              </div>

              <Field label="Pays OHADA" placeholder="Côte d'Ivoire" className="mt-4">
                <select className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none">
                  <option>— Sélectionner —</option>
                  <optgroup label="UEMOA / XOF">
                    <option>Côte d'Ivoire</option>
                    <option>Sénégal</option>
                    <option>Mali</option>
                    <option>Burkina Faso</option>
                    <option>Bénin</option>
                    <option>Togo</option>
                    <option>Niger</option>
                    <option>Guinée-Bissau</option>
                  </optgroup>
                  <optgroup label="CEMAC / XAF">
                    <option>Cameroun</option>
                    <option>Gabon</option>
                    <option>Congo</option>
                    <option>Tchad</option>
                    <option>Centrafrique</option>
                    <option>Guinée Équatoriale</option>
                  </optgroup>
                </select>
              </Field>

              <Field label="Votre message" className="mt-4">
                <textarea
                  rows={4}
                  placeholder="Décrivez votre besoin (modules d'intérêt, calendrier, contraintes spécifiques…)"
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none"
                />
              </Field>

              <button type="submit" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[14px] font-bold text-surface shadow-sm transition-shadow hover:shadow-lg">
                <Mail size={16} /> Envoyer ma demande
              </button>
              <p className="mt-3 text-[10px] font-medium leading-relaxed text-ink-500">
                En soumettant ce formulaire, vous acceptez notre <a href="#privacy" className="font-bold text-amber-deep hover:underline">politique de confidentialité</a>.
                Vos données restent en Afrique (Côte d'Ivoire / Sénégal).
              </p>
            </form>
          </div>
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
            <a href="https://atlas-studio.org/portal"
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3 text-[14px] font-bold text-ink transition-colors hover:border-amber-deep/40 hover:bg-amber/[0.04]">
              <Zap size={14} /> Démarrer un tenant
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────────────── Footer enrichi ─────────────────────── */}
      <footer className="border-t border-line bg-ink text-surface">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            {/* Brand block */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[26px] leading-none text-amber">Atlas Studio</span>
                <span className="text-white/40">/</span>
                <span className="font-display text-[22px] leading-none text-surface">Atlas People</span>
              </div>
              <p className="mt-3 max-w-sm text-[12px] font-medium leading-relaxed text-white/60">
                Le SIRH premium natif OHADA. Conçu en Afrique, pour l'Afrique. Hébergé en Afrique.
              </p>
              <div className="mt-5 flex gap-2">
                <a href="#linkedin" aria-label="LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/70 transition-colors hover:bg-amber/15 hover:text-amber"><Linkedin size={14} /></a>
                <a href="#twitter"  aria-label="Twitter"  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/70 transition-colors hover:bg-amber/15 hover:text-amber"><Twitter size={14} /></a>
                <a href="#github"   aria-label="GitHub"   className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/70 transition-colors hover:bg-amber/15 hover:text-amber"><Github size={14} /></a>
              </div>
            </div>

            {/* Produit */}
            <FooterCol title="Produit" items={[
              { label: 'Modules', href: '#modules' },
              { label: 'Tarifs', href: '#tarifs' },
              { label: 'Comment ça marche', href: '#how' },
              { label: 'Sécurité', href: '#securite' },
              { label: 'Voir la démo', href: '/accueil' },
            ]} />

            {/* Entreprise */}
            <FooterCol title="Entreprise" items={[
              { label: 'À propos', href: '#about' },
              { label: 'Témoignages', href: '#temoignages' },
              { label: 'Blog', href: '#blog' },
              { label: 'Contact', href: '#contact' },
              { label: 'Carrières', href: '#careers' },
            ]} />

            {/* Légal & ressources */}
            <FooterCol title="Légal &amp; ressources" items={[
              { label: 'FAQ', href: '#faq' },
              { label: 'Confidentialité', href: '#privacy' },
              { label: 'CGU', href: '#terms' },
              { label: 'Mentions légales', href: '#legal' },
              { label: 'API documentation', href: '#api' },
            ]} />
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
            <p className="text-[11px] font-medium text-white/50">
              © 2026 Atlas Studio · Atlas People — SIRH OHADA · 17 États · Conforme SYSCOHADA révisé 2017
            </p>
            <div className="flex gap-4 text-[11px] font-medium text-white/50">
              <Link to="/landing" className="hover:text-amber">Landing</Link>
              <span className="text-white/20">·</span>
              <Link to="/accueil" className="hover:text-amber">Démo</Link>
              <span className="text-white/20">·</span>
              <Link to="/admin" className="hover:text-amber">Admin</Link>
              <span className="text-white/20">·</span>
              <Link to="/" className="hover:text-amber">App</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Composants auxiliaires
 * ────────────────────────────────────────────────────────── */

interface FieldProps {
  label: string;
  placeholder?: string;
  type?: string;
  className?: string;
  children?: React.ReactNode;
}
function Field({ label, placeholder, type = 'text', className, children }: FieldProps) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
      {children ?? (
        <input
          type={type}
          placeholder={placeholder}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none"
        />
      )}
    </label>
  );
}

interface FooterColProps {
  title: string;
  items: { label: string; href: string }[];
}
function FooterCol({ title, items }: FooterColProps) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber" dangerouslySetInnerHTML={{ __html: title }} />
      <ul className="mt-4 space-y-2.5">
        {items.map((it) => {
          const isInternal = it.href.startsWith('/');
          return (
            <li key={it.label}>
              {isInternal ? (
                <Link to={it.href} className="text-[12px] font-semibold text-white/70 transition-colors hover:text-amber">{it.label}</Link>
              ) : (
                <a href={it.href} className="text-[12px] font-semibold text-white/70 transition-colors hover:text-amber">{it.label}</a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* Accordion FAQ (état local par row). */
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
