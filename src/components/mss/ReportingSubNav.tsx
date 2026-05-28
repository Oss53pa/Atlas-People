import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, Wallet, GraduationCap, Target, HeartPulse, LayoutGrid, Download } from 'lucide-react';
import { cn } from '../../lib/cn';

const ITEMS = [
  { to: '/team/reporting', label: 'KPI synthétiques', icon: LayoutDashboard, end: true },
  { to: '/team/reporting/effectif', label: 'Effectif', icon: Users, end: false },
  { to: '/team/reporting/temps', label: 'Temps', icon: Clock, end: false },
  { to: '/team/reporting/masse-salariale', label: 'Masse salariale', icon: Wallet, end: false },
  { to: '/team/reporting/formation', label: 'Formation', icon: GraduationCap, end: false },
  { to: '/team/reporting/performance', label: 'Performance', icon: Target, end: false },
  { to: '/team/reporting/climat', label: 'Climat', icon: HeartPulse, end: false },
  { to: '/team/reporting/dashboards', label: 'Mes dashboards', icon: LayoutGrid, end: false },
  { to: '/team/reporting/exports', label: 'Exports', icon: Download, end: false },
];

/** Sous-navigation de la section Reporting & pilotage (MSS, M8). */
export function ReportingSubNav() {
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
