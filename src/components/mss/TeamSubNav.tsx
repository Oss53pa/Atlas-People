import { NavLink } from 'react-router-dom';
import { Users, GitBranch, ArrowLeftRight } from 'lucide-react';
import { useDirectory } from '../../store/useDirectory';
import { maxChainDepth } from '../../lib/mss/scope';
import { cn } from '../../lib/cn';

/** Sous-navigation de la section Mon équipe (MSS, M2). « Mes managers » n'apparaît
 *  que pour un manager de managers (N2+). */
export function TeamSubNav() {
  const employees = useDirectory((s) => s.employees);
  const isN2plus = maxChainDepth(employees) >= 2;

  const items = [
    { to: '/team/equipe', label: 'Annuaire', icon: Users, end: true },
    { to: '/team/equipe/mouvements', label: 'Mouvements', icon: ArrowLeftRight, end: false },
    ...(isN2plus ? [{ to: '/team/equipe/annuaire-managers', label: 'Mes managers', icon: GitBranch, end: false }] : []),
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5">
      {items.map((it) => {
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
