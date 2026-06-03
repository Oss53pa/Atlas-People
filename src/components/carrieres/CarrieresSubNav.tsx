import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Route, TrendingUp, Crown, Network, Sparkles, Users,
  Map, Briefcase, BarChart3, Settings, ChevronLeft, ChevronRight,
  Building2, Grid3x3, Award, Heart, Shield, Compass, Globe,
} from 'lucide-react';
import { cn } from '../../lib/cn';

const ITEMS = [
  { to: '/carrieres',                label: 'Cockpit',         icon: LayoutDashboard, end: true  },
  { to: '/carrieres/filieres',       label: 'Filières',        icon: Route,           end: false },
  { to: '/carrieres/trajectoires',   label: 'Trajectoires',    icon: TrendingUp,      end: false },
  { to: '/carrieres/postes-cles',    label: 'Postes clés',     icon: Crown,           end: false },
  { to: '/carrieres/succession',     label: 'Succession',      icon: Network,         end: false },
  { to: '/carrieres/hauts-potentiels', label: 'Hauts potentiels', icon: Sparkles,     end: false },
  { to: '/carrieres/mentorat',       label: 'Mentorat',        icon: Users,           end: false },
  { to: '/carrieres/cartographie',   label: 'Cartographie',    icon: Map,             end: false },
  { to: '/carrieres/mobilite',       label: 'Mobilité interne', icon: Briefcase,      end: false },
  { to: '/carrieres/job-architecture', label: 'Job architecture', icon: Building2,    end: false },
  { to: '/carrieres/talent-review',  label: 'Talent Review',   icon: Grid3x3,         end: false },
  { to: '/carrieres/talent-pools',   label: 'Talent Pools',    icon: Award,           end: false },
  { to: '/carrieres/promotions',     label: 'Promotions',      icon: TrendingUp,      end: false },
  { to: '/carrieres/frameworks',     label: 'Frameworks',      icon: Compass,         end: false },
  { to: '/carrieres/parcours',       label: 'Parcours indiv.', icon: Route,           end: false },
  { to: '/carrieres/succession-plus', label: 'Succession+',    icon: Network,         end: false },
  { to: '/carrieres/mentorat-pro',   label: 'Mentorat & Sponsor.', icon: Heart,       end: false },
  { to: '/carrieres/expatriation',   label: 'Expatriation',    icon: Globe,           end: false },
  { to: '/carrieres/alumni',         label: 'Alumni',          icon: Heart,           end: false },
  { to: '/carrieres/audit',          label: 'Audit M10',       icon: Shield,          end: false },
  { to: '/carrieres/reporting',      label: 'Reporting',       icon: BarChart3,       end: false },
  { to: '/carrieres/parametres',     label: 'Paramètres',      icon: Settings,        end: false },
];

export function CarrieresSubNav() {
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
