import { NavLink } from 'react-router-dom';
import { Settings, Bell, UserCog, Eye, Layers, FileText } from 'lucide-react';
import { cn } from '../../lib/cn';

const ITEMS = [
  { to: '/team/parametres', label: 'Index', icon: Settings, end: true },
  { to: '/team/parametres/notifications', label: 'Notifications', icon: Bell, end: false },
  { to: '/team/parametres/delegations', label: 'Délégations', icon: UserCog, end: false },
  { to: '/team/parametres/vue-equipe', label: 'Vue équipe', icon: Eye, end: false },
  { to: '/team/parametres/profondeur', label: 'Profondeur', icon: Layers, end: false },
  { to: '/team/parametres/modeles', label: 'Modèles', icon: FileText, end: false },
];

/** Sous-navigation de la section Paramètres manager (MSS, M10). */
export function SettingsSubNav() {
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
