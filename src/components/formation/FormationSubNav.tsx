import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, ClipboardList, CalendarDays, UserCheck, Gauge,
  Award, Coins, Network, Landmark, BarChart3, Settings, ChevronLeft, ChevronRight,
  Route, FileSignature, Layers, Monitor, Users, Shield,
} from 'lucide-react';
import { cn } from '../../lib/cn';

const ITEMS = [
  { to: '/formation',                label: 'Cockpit',         icon: LayoutDashboard, end: true  },
  { to: '/formation/catalogue',      label: 'Catalogue',       icon: BookOpen,         end: false },
  { to: '/formation/plan',           label: 'Plan annuel',     icon: ClipboardList,    end: false },
  { to: '/formation/sessions',       label: 'Sessions',        icon: CalendarDays,     end: false },
  { to: '/formation/inscriptions',   label: 'Inscriptions',    icon: UserCheck,        end: false },
  { to: '/formation/evaluations',    label: 'Évaluations',     icon: Gauge,            end: false },
  { to: '/formation/certifications', label: 'Certifications',  icon: Award,            end: false },
  { to: '/formation/roi',            label: 'ROI',             icon: Coins,            end: false },
  { to: '/formation/competences',    label: 'Compétences',     icon: Network,          end: false },
  { to: '/formation/fdfp',           label: 'FDFP / Fonds',    icon: Landmark,         end: false },
  { to: '/formation/parcours',       label: 'Parcours',        icon: Route,            end: false },
  { to: '/formation/pif',            label: 'PIF',             icon: FileSignature,    end: false },
  { to: '/formation/modalites',      label: 'Modalités',       icon: Layers,           end: false },
  { to: '/formation/lms',            label: 'LMS digital',     icon: Monitor,          end: false },
  { to: '/formation/formateurs',     label: 'Formateurs',      icon: Users,            end: false },
  { to: '/formation/audit',          label: 'Audit M11',       icon: Shield,           end: false },
  { to: '/formation/reporting',      label: 'Reporting',       icon: BarChart3,        end: false },
  { to: '/formation/parametres',     label: 'Paramètres',      icon: Settings,         end: false },
];

export function FormationSubNav() {
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
