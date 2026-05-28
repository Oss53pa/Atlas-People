import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Inbox, Mail, HeartPulse, CalendarX, Award } from 'lucide-react';
import { cn } from '../../lib/cn';

const ITEMS = [
  { to: '/team/quotidien', label: 'Vue d’ensemble', icon: LayoutDashboard, end: true },
  { to: '/team/quotidien/ndf-a-valider', label: 'Notes de frais', icon: Receipt, end: false },
  { to: '/team/quotidien/demandes-equipe', label: 'Demandes équipe', icon: Inbox, end: false },
  { to: '/team/quotidien/courrier-manager', label: 'Courrier', icon: Mail, end: false },
  { to: '/team/quotidien/climat', label: 'Climat', icon: HeartPulse, end: false },
  { to: '/team/quotidien/conflits-planning', label: 'Conflits planning', icon: CalendarX, end: false },
  { to: '/team/quotidien/reconnaissance', label: 'Reconnaissance', icon: Award, end: false },
];

/** Sous-navigation de la section Vie quotidienne managériale (MSS, M7). */
export function DailySubNav() {
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
