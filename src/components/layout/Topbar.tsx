import { useState } from 'react';
import { Menu, Search, Bell, Sparkles } from 'lucide-react';
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

      {/* Sélecteur d'espace (ESS / MSS / Back-office RH) */}
      <SpaceSwitcher />

      {/* Recherche */}
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          placeholder="Rechercher un collaborateur, un bulletin, une compétence…"
          className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm font-medium text-ink placeholder:text-ink-400 focus:border-amber/40 focus:outline-none focus:ring-2 focus:ring-amber/15"
        />
      </div>

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
