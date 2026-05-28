import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Inbox, CalendarRange, Fingerprint, Clock, Plane, Gauge, Megaphone } from 'lucide-react';
import { cn } from '../../lib/cn';

const ITEMS = [
  { to: '/team/temps', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/team/temps/a-valider', label: 'À valider', icon: Inbox, end: false },
  { to: '/team/temps/planning', label: 'Planning', icon: CalendarRange, end: false },
  { to: '/team/temps/anomalies', label: 'Anomalies', icon: Fingerprint, end: false },
  { to: '/team/temps/heures-sup', label: 'Heures sup', icon: Clock, end: false },
  { to: '/team/temps/absences', label: 'Absences', icon: Plane, end: false },
  { to: '/team/temps/compteurs', label: 'Compteurs', icon: Gauge, end: false },
  { to: '/team/temps/delegation', label: 'Délégations', icon: Megaphone, end: false },
];

/** Sous-navigation de la section Temps de l'Espace Manager (MSS). */
export function TeamTimeSubNav() {
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
