import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, Bell, Sparkles, Home } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Avatar } from '../ui/Avatar';
import { Brand } from '../ui/Brand';
import { CountrySwitcher } from './CountrySwitcher';
import { SpaceSwitcher } from './SpaceSwitcher';
import { NotificationsDrawer, useNotifications } from './NotificationsDrawer';

export function Topbar() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const notifications = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const count = notifications.length;

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

        <button className="flex items-center gap-2.5 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-3 transition-colors hover:border-amber/40">
          <Avatar name="Valentina Okou" size="sm" />
          <div className="hidden text-left leading-tight lg:block">
            <p className="text-sm font-bold text-ink">Valentina Okou</p>
            <p className="text-[11px] font-medium text-ink-400">DRH · Atlas Demo</p>
          </div>
        </button>
      </div>

      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} notifications={notifications} />
    </header>
  );
}
