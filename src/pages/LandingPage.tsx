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
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Play, Sparkles, Moon } from 'lucide-react';
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
