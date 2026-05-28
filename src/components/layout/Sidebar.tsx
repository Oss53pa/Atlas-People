import { NavLink } from 'react-router-dom';
import { X, ShieldCheck } from 'lucide-react';
import { Brand } from '../ui/Brand';
import { NAV } from '../../app/nav';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/cn';

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity lg:hidden',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-line bg-surface/80 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 pt-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/15">
              <svg viewBox="0 0 64 64" className="h-5 w-5">
                <path d="M32 14 L50 50 H41 L32 31 L23 50 H14 Z" fill="#C97E12" />
              </svg>
            </div>
            <div className="leading-tight">
              <Brand name="Atlas People" className="block text-[22px] text-ink" />
              <Brand name="Atlas Studio" className="-mt-1 block text-[13px] text-amber-deep" />
            </div>
          </div>
          <button
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink/5 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 space-y-5 overflow-y-auto px-3 pb-4 no-scrollbar">
          {NAV.map((group) => (
            <div key={group.bloc}>
              {group.bloc !== 'home' && (
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">
                  {group.bloc === 'A' || group.bloc === 'B' || group.bloc === 'C' || group.bloc === 'D'
                    ? `Bloc ${group.bloc} · ${group.label}`
                    : group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.modules.map((m) => (
                  <NavLink
                    key={m.code}
                    to={m.path}
                    end={m.path === '/'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all',
                        isActive
                          ? 'bg-amber/12 text-ink ring-1 ring-inset ring-amber/30'
                          : 'text-ink-700 hover:bg-ink/[0.04]',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <m.icon
                          size={18}
                          strokeWidth={2.1}
                          className={cn(isActive ? 'text-amber' : 'text-ink-400 group-hover:text-ink')}
                        />
                        <span className="flex-1 truncate">{m.label}</span>
                        {!m.ready && (
                          <span className="rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-400">
                            bientôt
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer souveraineté */}
        <div className="border-t border-line px-4 py-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-ok/[0.06] px-3 py-2.5">
            <ShieldCheck size={18} className="shrink-0 text-ok" strokeWidth={2.2} />
            <div className="leading-tight">
              <p className="text-[12px] font-semibold text-ink">
                <Brand name="Proph3t" /> · Souverain
              </p>
              <p className="text-[10px] font-medium text-ink-400">Données sensibles en local</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
