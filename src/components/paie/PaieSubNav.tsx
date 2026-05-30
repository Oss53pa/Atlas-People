import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarRange, PencilLine, Calculator, CheckCircle2, BookOpen,
  Banknote, FileText, Landmark, Layers, RefreshCw, BarChart3, ShieldCheck, Settings, Library,
  FlaskConical, SlidersHorizontal, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/cn';

const ITEMS = [
  { to: '/paie', label: 'Cockpit', icon: LayoutDashboard, end: true },
  { to: '/paie/cycle', label: 'Cycles', icon: CalendarRange, end: false },
  { to: '/paie/saisie', label: 'Saisie', icon: PencilLine, end: false },
  { to: '/paie/calcul', label: 'Calcul', icon: Calculator, end: false },
  { to: '/paie/simulation', label: 'Simulation', icon: FlaskConical, end: false },
  { to: '/paie/validation', label: 'Validation', icon: CheckCircle2, end: false },
  { to: '/paie/journal', label: 'Journal', icon: BookOpen, end: false },
  { to: '/paie/virements', label: 'Virements', icon: Banknote, end: false },
  { to: '/paie/bulletins', label: 'Bulletins', icon: FileText, end: false },
  { to: '/paie/declarations', label: 'Déclarations', icon: Landmark, end: false },
  { to: '/paie/comptabilite', label: 'Comptabilité', icon: Layers, end: false },
  { to: '/paie/regularisations', label: 'Régularisations', icon: RefreshCw, end: false },
  { to: '/paie/modeles', label: 'Modèles', icon: Library, end: false },
  { to: '/paie/referentiels', label: 'Référentiels', icon: Settings, end: false },
  { to: '/paie/configuration', label: 'Configuration', icon: SlidersHorizontal, end: false },
  { to: '/paie/reporting', label: 'Reporting', icon: BarChart3, end: false },
  { to: '/paie/audit', label: 'Audit', icon: ShieldCheck, end: false },
];

/** Sous-navigation du module M3 Paie (back-office) — défilable avec flèches latérales. */
export function PaieSubNav() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = scrollRef.current;
    if (!el) return;
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(220, el.clientWidth * 0.7), behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Flèche gauche + fondu */}
      {canLeft && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 rounded-l-2xl bg-gradient-to-r from-surface to-transparent" />
          <button type="button" aria-label="Défiler vers la gauche" onClick={() => scrollBy(-1)}
            className="absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full border border-line bg-surface p-1 text-ink-500 shadow-sm transition-colors hover:text-ink">
            <ChevronLeft size={16} />
          </button>
        </>
      )}

      <nav ref={scrollRef} onScroll={update}
        className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5 no-scrollbar scroll-smooth">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) => cn(
                'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors',
                isActive ? 'bg-amber/12 text-amber-deep ring-1 ring-amber/30' : 'text-ink-500 hover:bg-ink/[0.04] hover:text-ink',
              )}
            >
              <Icon size={15} /> {it.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Flèche droite + fondu */}
      {canRight && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 rounded-r-2xl bg-gradient-to-l from-surface to-transparent" />
          <button type="button" aria-label="Défiler vers la droite" onClick={() => scrollBy(1)}
            className="absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full border border-line bg-surface p-1 text-ink-500 shadow-sm transition-colors hover:text-ink">
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}
