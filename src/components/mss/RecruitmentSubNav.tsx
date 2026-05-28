import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, UserCheck, LogOut } from 'lucide-react';
import { cn } from '../../lib/cn';

const ITEMS = [
  { to: '/team/recrutement', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/team/recrutement/besoins', label: 'Mes demandes', icon: FileText, end: false },
  { to: '/team/recrutement/candidats', label: 'Candidats en cours', icon: Users, end: false },
  { to: '/team/recrutement/integration', label: 'Nouveaux entrants', icon: UserCheck, end: false },
  { to: '/team/recrutement/sortants', label: 'Sortants', icon: LogOut, end: false },
];

/** Sous-navigation de la section Recrutement & intégration (MSS, M6). */
export function RecruitmentSubNav() {
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
