import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, Fingerprint, CalendarRange, Clock, Megaphone } from 'lucide-react';
import { useDelegation } from '../../store/useDelegation';
import { cn } from '../../lib/cn';

const SELF_ID = 'e2';

const BASE_ITEMS = [
  { to: '/me/time', label: 'Accueil', icon: Home, end: true },
  { to: '/me/time/leave', label: 'Congés', icon: CalendarDays, end: false },
  { to: '/me/time/clocking', label: 'Pointage', icon: Fingerprint, end: false },
  { to: '/me/time/planning', label: 'Planning', icon: CalendarRange, end: false },
  { to: '/me/time/overtime', label: 'Heures sup', icon: Clock, end: false },
];

/** Sous-navigation de la section Temps (ESS). La Délégation n'apparaît que pour
 *  les employés titulaires d'un mandat (règle dure E2.7). */
export function TimeSubNav() {
  const hasMandate = useDelegation((s) => s.hasMandate(SELF_ID));
  const items = hasMandate
    ? [...BASE_ITEMS, { to: '/me/time/delegation', label: 'Délégation', icon: Megaphone, end: false }]
    : BASE_ITEMS;
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) => cn(
              'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
              isActive ? 'bg-amber/12 text-amber-deep ring-1 ring-amber/30' : 'text-ink-500 hover:bg-ink/[0.04] hover:text-ink',
            )}
          >
            <Icon size={15} /> {it.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
