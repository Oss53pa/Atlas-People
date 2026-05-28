import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Grid3x3, Sparkles, ClipboardCheck, GraduationCap, CalendarRange, Route, Users2, Network } from 'lucide-react';
import { cn } from '../../lib/cn';

const ITEMS = [
  { to: '/team/developpement', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/team/developpement/competences', label: 'Matrice compétences', icon: Grid3x3, end: false },
  { to: '/team/developpement/souhaits', label: 'Souhaits N-1', icon: Sparkles, end: false },
  { to: '/team/developpement/formations-a-valider', label: 'Formations à valider', icon: ClipboardCheck, end: false },
  { to: '/team/developpement/formations-en-cours', label: 'Formations en cours', icon: GraduationCap, end: false },
  { to: '/team/developpement/plan-equipe', label: 'Plan équipe', icon: CalendarRange, end: false },
  { to: '/team/developpement/mobilite', label: 'Mobilité interne', icon: Route, end: false },
  { to: '/team/developpement/succession', label: 'Succession', icon: Network, end: false },
  { to: '/team/developpement/mentorat', label: 'Mentorat', icon: Users2, end: false },
];

/** Sous-navigation de la section Développement équipe (MSS, M5). */
export function DevelopmentSubNav() {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5">
      {ITEMS.map((it) => {
        const Icon = it.icon;
        return (
          <NavLink key={it.to} to={it.to} end={it.end}
            className={({ isActive }) => cn('flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors', isActive ? 'bg-info/12 text-info ring-1 ring-info/30' : 'text-ink-500 hover:bg-ink/[0.04] hover:text-ink')}>
            <Icon size={15} /> {it.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
