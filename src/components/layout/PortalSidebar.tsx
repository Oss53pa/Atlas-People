import { NavLink } from 'react-router-dom';
import {
  X, ShieldCheck, Home, User, Wallet, CalendarClock, Target, GraduationCap,
  ReceiptText, Inbox, Mail, HeartPulse, Settings, Rocket, FolderOpen, AlertTriangle,
} from 'lucide-react';
import { Brand } from '../ui/Brand';
import { useAppStore } from '../../store/useAppStore';
import { useCorrespondence } from '../../store/useCorrespondence';
import { cn } from '../../lib/cn';

const SELF_ID = 'e2';

interface Item { label: string; to?: string; icon: typeof Home; end?: boolean; soon?: boolean; badgeKey?: 'courrier' }

const ITEMS: Item[] = [
  { label: 'Accueil', to: '/espace', icon: Home, end: true },
  { label: 'Mon profil', to: '/espace/profil', icon: User },
  { label: 'Ma paie', to: '/espace/paie', icon: Wallet },
  { label: 'Mon temps', to: '/me/time', icon: CalendarClock },
  { label: 'Ma performance', to: '/espace/performance', icon: Target },
  { label: 'Mon développement', to: '/espace/developpement', icon: GraduationCap },
  { label: 'Mes notes de frais', to: '/espace/frais', icon: ReceiptText },
  { label: 'Mes documents', to: '/espace/documents', icon: FolderOpen },
  { label: 'Mes demandes', to: '/espace/demandes', icon: Inbox },
  { label: 'Mon courrier', to: '/espace/courrier', icon: Mail, badgeKey: 'courrier' },
  { label: 'Mes sanctions', to: '/espace/sanctions', icon: AlertTriangle },
  { label: 'Mon suivi santé', to: '/espace/sante', icon: HeartPulse },
  { label: 'Mon intégration', to: '/espace/onboarding', icon: Rocket },
  { label: 'Mes paramètres', to: '/espace/parametres', icon: Settings },
];

/** Barre latérale du PORTAIL COLLABORATEUR. Aucun élément du back-office
 *  (ni Cockpit DRH, ni Collaborateurs, ni Paie & déclarations…). Navigation 100% « moi ». */
export function PortalSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const unread = useCorrespondence((s) => s.items.filter((c) => c.employeeId === SELF_ID && (c.status === 'unread' || c.status === 'action_required')).length);

  return (
    <>
      <div className={cn('fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity lg:hidden', sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0')} onClick={() => setSidebarOpen(false)} />
      <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-line bg-surface/80 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between px-5 pt-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/15">
              <svg viewBox="0 0 64 64" className="h-5 w-5"><path d="M32 14 L50 50 H41 L32 31 L23 50 H14 Z" fill="#C97E12" /></svg>
            </div>
            <div className="leading-tight">
              <Brand name="Atlas People" className="block text-[22px] text-ink" />
              <span className="-mt-1 block text-[11px] font-bold uppercase tracking-wider text-amber-deep">Portail collaborateur</span>
            </div>
          </div>
          <button className="rounded-lg p-1.5 text-ink-400 hover:bg-ink/5 lg:hidden" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>

        <nav className="mt-6 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 no-scrollbar">
          {ITEMS.map((it) => {
            const Icon = it.icon;
            const badge = it.badgeKey === 'courrier' && unread > 0 ? unread : null;
            if (it.soon || !it.to) {
              return (
                <div key={it.label} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink-300">
                  <Icon size={18} strokeWidth={2.1} className="text-ink-300" />
                  <span className="flex-1 truncate">{it.label}</span>
                  <span className="rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-400">bientôt</span>
                </div>
              );
            }
            return (
              <NavLink key={it.label} to={it.to} end={it.end} onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => cn('group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all', isActive ? 'bg-amber/12 text-ink ring-1 ring-inset ring-amber/30' : 'text-ink-700 hover:bg-ink/[0.04]')}>
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={2.1} className={cn(isActive ? 'text-amber' : 'text-ink-400 group-hover:text-ink')} />
                    <span className="flex-1 truncate">{it.label}</span>
                    {badge && <span className="rounded-full bg-amber px-1.5 text-[10px] font-bold text-night">{badge}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-line px-4 py-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-ok/[0.06] px-3 py-2.5">
            <ShieldCheck size={18} className="shrink-0 text-ok" strokeWidth={2.2} />
            <div className="leading-tight">
              <p className="text-[12px] font-semibold text-ink">Mes données protégées</p>
              <p className="text-[10px] font-medium text-ink-400">Vos données uniquement · souverain</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
