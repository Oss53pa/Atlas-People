import { NavLink } from 'react-router-dom';
import {
  X, ShieldCheck, Home, Users, CalendarClock, Target, GraduationCap,
  Briefcase, Plane, BarChart3, Brain, Settings,
} from 'lucide-react';
import { Brand } from '../ui/Brand';
import { DepthSelector } from '../mss/DepthSelector';
import { useAppStore } from '../../store/useAppStore';
import { useManagerBadges } from '../../lib/mss/badges';
import { cn } from '../../lib/cn';

type BadgeKey = 'time' | 'quotidien';

interface Item { label: string; to: string; icon: typeof Home; end?: boolean; badge?: BadgeKey }

const ITEMS: Item[] = [
  { label: 'Accueil', to: '/team', icon: Home, end: true },
  { label: 'Mon équipe', to: '/team/equipe', icon: Users },
  { label: 'Temps & absences', to: '/team/temps', icon: CalendarClock, badge: 'time' },
  { label: 'Performance', to: '/team/performance', icon: Target },
  { label: 'Développement', to: '/team/developpement', icon: GraduationCap },
  { label: 'Recrutement & intégration', to: '/team/recrutement', icon: Briefcase },
  { label: 'Vie quotidienne', to: '/team/quotidien', icon: Plane, badge: 'quotidien' },
  { label: 'Reporting & pilotage', to: '/team/reporting', icon: BarChart3 },
];

const META: Item[] = [{ label: 'Ma pratique', to: '/team/ma-pratique', icon: Brain }];
const FOOT: Item[] = [{ label: 'Mes paramètres', to: '/team/parametres', icon: Settings }];

/** Barre latérale du PORTAIL MANAGER (MSS). Aucun élément du back-office (R1).
 *  Sélecteur de profondeur en tête (N1/N2/N3+). Badges sur les files de validation. */
export function ManagerSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const badges = useManagerBadges();

  const badgeFor = (k?: BadgeKey): number | null => {
    if (k === 'time') return badges.timeToValidate || null;
    if (k === 'quotidien') return (badges.expensesToValidate + badges.teamRequests) || null;
    return null;
  };

  const renderItem = (it: Item) => {
    const Icon = it.icon;
    const badge = badgeFor(it.badge);
    return (
      <NavLink key={it.to} to={it.to} end={it.end} onClick={() => setSidebarOpen(false)}
        className={({ isActive }) => cn('group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all', isActive ? 'bg-info/12 text-ink ring-1 ring-inset ring-info/30' : 'text-ink-700 hover:bg-ink/[0.04]')}>
        {({ isActive }) => (
          <>
            <Icon size={18} strokeWidth={2.1} className={cn(isActive ? 'text-info' : 'text-ink-400 group-hover:text-ink')} />
            <span className="flex-1 truncate">{it.label}</span>
            {badge && <span className="rounded-full bg-amber px-1.5 text-[10px] font-bold text-night">{badge}</span>}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      <div className={cn('fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity lg:hidden', sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0')} onClick={() => setSidebarOpen(false)} />
      <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-line bg-surface/80 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between px-5 pt-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info/15">
              <svg viewBox="0 0 64 64" className="h-5 w-5"><path d="M32 14 L50 50 H41 L32 31 L23 50 H14 Z" fill="#2563EB" /></svg>
            </div>
            <div className="leading-tight">
              <Brand name="Atlas People" className="block text-[22px] text-ink" />
              <span className="-mt-1 block text-[11px] font-bold uppercase tracking-wider text-info">Portail manager</span>
            </div>
          </div>
          <button className="rounded-lg p-1.5 text-ink-400 hover:bg-ink/5 lg:hidden" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>

        <div className="mt-4">
          <DepthSelector />
        </div>

        <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 no-scrollbar">
          {ITEMS.map(renderItem)}
          <div className="my-2 border-t border-line" />
          {META.map(renderItem)}
          <div className="my-2 border-t border-line" />
          {FOOT.map(renderItem)}
        </nav>

        <div className="border-t border-line px-4 py-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-info/[0.06] px-3 py-2.5">
            <ShieldCheck size={18} className="shrink-0 text-info" strokeWidth={2.2} />
            <div className="leading-tight">
              <p className="text-[12px] font-semibold text-ink">Périmètre protégé</p>
              <p className="text-[10px] font-medium text-ink-400">Mon équipe · sans paie ni médical</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
