import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Repeat, MessageSquareHeart, GraduationCap, Route, BookOpen, Gauge } from 'lucide-react';
import { cn } from '../../lib/cn';

const ITEMS = [
  { to: '/team/ma-pratique', label: 'Vue d’ensemble', icon: LayoutDashboard, end: true },
  { to: '/team/ma-pratique/rituels', label: 'Mes rituels', icon: Repeat, end: false },
  { to: '/team/ma-pratique/feedback', label: 'Feedback reçu', icon: MessageSquareHeart, end: false },
  { to: '/team/ma-pratique/formations', label: 'Formations manager', icon: GraduationCap, end: false },
  { to: '/team/ma-pratique/parcours', label: 'Mon parcours', icon: Route, end: false },
  { to: '/team/ma-pratique/ressources', label: 'Ressources', icon: BookOpen, end: false },
  { to: '/team/ma-pratique/efficacite', label: 'Efficacité', icon: Gauge, end: false },
];

/** Sous-navigation de la section Ma pratique managériale (MSS, M9). */
export function PracticeSubNav() {
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
