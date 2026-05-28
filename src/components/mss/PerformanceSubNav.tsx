import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, ClipboardCheck, MessageSquare, Scale, Radar, Award } from 'lucide-react';
import { cn } from '../../lib/cn';

const ITEMS = [
  { to: '/team/performance', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/team/performance/objectifs', label: 'Objectifs', icon: Target, end: false },
  { to: '/team/performance/evaluations', label: 'Évaluations', icon: ClipboardCheck, end: false },
  { to: '/team/performance/1-1', label: 'Mes 1:1', icon: MessageSquare, end: false },
  { to: '/team/performance/calibration', label: 'Calibration', icon: Scale, end: false },
  { to: '/team/performance/feedback-360', label: 'Feedback 360°', icon: Radar, end: false },
  { to: '/team/performance/reconnaissance', label: 'Reconnaissance', icon: Award, end: false },
];

/** Sous-navigation de la section Performance équipe (MSS, M4). */
export function PerformanceSubNav() {
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
