import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileSignature, Hourglass, Gavel, Stamp, Users, Landmark, Globe2, Settings,
} from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Sous-navigation du module « Actes & conformité » (back-office Administration RH).
 * Périmètre RECENTRÉ : uniquement les actes/obligations qui n'existent PAS déjà
 * dans le module Collaborateurs (dossier 360°, avenants, départs y vivent déjà).
 */
const ITEMS = [
  { to: '/hr/actes', label: 'Cockpit', icon: LayoutDashboard, end: true },
  { to: '/hr/actes/contrats', label: 'Contrats', icon: FileSignature, end: false },
  { to: '/hr/actes/periode-essai', label: "Période d'essai", icon: Hourglass, end: false },
  { to: '/hr/actes/disciplinaire', label: 'Disciplinaire', icon: Gavel, end: false },
  { to: '/hr/actes/certificats', label: 'Certificats', icon: Stamp, end: false },
  { to: '/hr/actes/representation', label: 'Représentation', icon: Users, end: false },
  { to: '/hr/actes/obligations', label: 'Obligations légales', icon: Landmark, end: false },
  { to: '/hr/actes/expatries', label: 'Expatriés', icon: Globe2, end: false },
  { to: '/hr/actes/parametres', label: 'Paramètres', icon: Settings, end: false },
] as const;

export function AdminRhSubNav() {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5 no-scrollbar">
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
  );
}
