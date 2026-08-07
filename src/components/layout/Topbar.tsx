import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, Bell, Sparkles, Home, Briefcase, Coins, Network, UserCheck, Settings2, LogOut, ChevronDown } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../lib/auth';
import { Avatar } from '../ui/Avatar';
import { Brand } from '../ui/Brand';
import { CountrySwitcher } from './CountrySwitcher';
import { SpaceSwitcher } from './SpaceSwitcher';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { NotificationsDrawer, useNotifications } from './NotificationsDrawer';

export function Topbar() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const notifications = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const count = notifications.length;
  const { tenantType, signOut, user } = useAuth();
  const displayName = user?.email?.split('@')[0] ?? 'Utilisateur';
  const fullName = (user as { full_name?: string } | null)?.full_name ?? displayName;

  // Fermer le dropdown profil au clic extérieur
  const handleProfileKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setProfileOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur-xl lg:px-7">
      <button
        onClick={toggleSidebar}
        className="rounded-xl p-2 text-ink-500 hover:bg-ink/5 lg:hidden"
        aria-label="Menu"
      >
        <Menu size={20} />
      </button>

      {/* Accueil — Welcome Cockpit */}
      <Link
        to="/accueil"
        aria-label="Accueil — Cockpit RH"
        className="hidden items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 py-2 text-ink-500 transition-colors hover:border-amber/40 hover:text-amber-deep sm:inline-flex"
        title="Accueil"
      >
        <Home size={16} />
      </Link>

      {/* Sélecteur d'espace (ESS / MSS / Back-office RH) */}
      <SpaceSwitcher />

      {/* Sélecteur de workspace — visible dès que le compte en possède plusieurs */}
      <WorkspaceSwitcher />

      {/* Badge mode (cliquable → Admin > Mode de fonctionnement, masqué en mode Entreprise) */}
      {tenantType === 'cabinet_complet' && (
        <Link to="/admin?tab=tenant" className="hidden items-center gap-1.5 rounded-full border border-teal-300/70 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 transition-colors hover:bg-teal-100 sm:inline-flex">
          <Briefcase size={11} /> Atlas People Conseil
        </Link>
      )}
      {tenantType === 'cabinet_paie' && (
        <Link to="/admin?tab=tenant" className="hidden items-center gap-1.5 rounded-full border border-blue-300/70 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 transition-colors hover:bg-blue-100 sm:inline-flex">
          <Coins size={11} /> Atlas Payroll
        </Link>
      )}
      {tenantType === 'cabinet_mixte' && (
        <Link to="/admin?tab=tenant" className="hidden items-center gap-1.5 rounded-full border border-violet-300/70 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 transition-colors hover:bg-violet-100 sm:inline-flex">
          <Network size={11} /> Atlas People 360
        </Link>
      )}
      {tenantType === 'cabinet_agence' && (
        <Link to="/admin?tab=tenant" className="hidden items-center gap-1.5 rounded-full border border-rose-300/70 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 transition-colors hover:bg-rose-100 sm:inline-flex">
          <UserCheck size={11} /> Atlas People Placement
        </Link>
      )}

      {/* Quick Launcher (Cmd+K) */}
      <button
        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
        className="relative hidden max-w-md flex-1 items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink-400 transition-colors hover:border-amber/40 sm:flex"
        aria-label="Ouvrir la palette de commandes"
      >
        <Search size={16} className="text-ink-400" />
        <span className="flex-1 text-left">Rechercher pages, collaborateurs, actions…</span>
        <kbd className="mono rounded border border-line bg-surface2 px-1.5 py-0.5 text-[10px] font-bold text-ink-500">Ctrl K</kbd>
      </button>

      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-2.5">
        {/* Indicateur IA souveraine */}
        <span className="hidden items-center gap-1.5 rounded-full border border-ok/25 bg-ok/[0.08] px-3 py-1.5 text-[11px] font-semibold text-ok md:inline-flex">
          <Sparkles size={13} /> <Brand name="Proph3t" /> actif
        </span>

        <CountrySwitcher />

        <button
          onClick={() => setNotifOpen(true)}
          aria-label={`Notifications (${count})`}
          className="relative rounded-xl border border-line bg-surface p-2.5 text-ink-500 transition-colors hover:border-amber/40 hover:text-ink"
        >
          <Bell size={18} />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-bold text-night ring-2 ring-canvas">
              {count}
            </span>
          )}
        </button>

        {/* Profil dropdown */}
        <div className="relative" ref={profileRef} onKeyDown={handleProfileKeyDown}>
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            className="flex items-center gap-2.5 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-amber/40"
          >
            <Avatar name={fullName} size="sm" />
            <div className="hidden text-left leading-tight lg:block">
              <p className="text-sm font-bold text-ink">{fullName}</p>
              <p className="text-[11px] font-medium text-ink-400">{displayName}</p>
            </div>
            <ChevronDown size={12} className="text-ink-400" />
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl ring-1 ring-ink/5"
              onMouseLeave={() => setProfileOpen(false)}
            >
              <div className="border-b border-line px-4 py-3">
                <p className="text-[13px] font-bold text-ink">{fullName}</p>
                <p className="text-[11px] font-medium text-ink-400">{displayName}</p>
              </div>
              <ul className="py-1">
                <li>
                  <Link
                    to="/admin?tab=tenant"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-ink-500 transition-colors hover:bg-amber/[0.06] hover:text-ink"
                  >
                    <Settings2 size={14} /> Paramètres workspace
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); signOut(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    <LogOut size={14} /> Déconnexion
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} notifications={notifications} />
    </header>
  );
}
