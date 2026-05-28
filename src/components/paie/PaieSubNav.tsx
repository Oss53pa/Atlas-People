import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarRange, PencilLine, Calculator, CheckCircle2, BookOpen,
  Banknote, FileText, Landmark, Layers, RefreshCw, BarChart3, ShieldCheck, Settings, Library,
} from 'lucide-react';
import { cn } from '../../lib/cn';

const ITEMS = [
  { to: '/paie', label: 'Cockpit', icon: LayoutDashboard, end: true },
  { to: '/paie/cycle', label: 'Cycles', icon: CalendarRange, end: false },
  { to: '/paie/saisie', label: 'Saisie', icon: PencilLine, end: false },
  { to: '/paie/calcul', label: 'Calcul', icon: Calculator, end: false },
  { to: '/paie/validation', label: 'Validation', icon: CheckCircle2, end: false },
  { to: '/paie/journal', label: 'Journal', icon: BookOpen, end: false },
  { to: '/paie/virements', label: 'Virements', icon: Banknote, end: false },
  { to: '/paie/bulletins', label: 'Bulletins', icon: FileText, end: false },
  { to: '/paie/declarations', label: 'Déclarations', icon: Landmark, end: false },
  { to: '/paie/comptabilite', label: 'Comptabilité', icon: Layers, end: false },
  { to: '/paie/regularisations', label: 'Régularisations', icon: RefreshCw, end: false },
  { to: '/paie/modeles', label: 'Modèles', icon: Library, end: false },
  { to: '/paie/referentiels', label: 'Référentiels', icon: Settings, end: false },
  { to: '/paie/reporting', label: 'Reporting', icon: BarChart3, end: false },
  { to: '/paie/audit', label: 'Audit', icon: ShieldCheck, end: false },
];

/** Sous-navigation du module M3 Paie (back-office). */
export function PaieSubNav() {
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
