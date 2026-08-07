import { Outlet, Link } from 'react-router-dom';
import { Menu, Mail } from 'lucide-react';
import { PortalSidebar } from './PortalSidebar';
import { SpaceSwitcher } from './SpaceSwitcher';
import { Avatar } from '../ui/Avatar';
import { useAppStore } from '../../store/useAppStore';
import { useCorrespondence } from '../../store/useCorrespondence';
import { employeeById, employeeName } from '../../data/mock';
import { useSessionContext } from '../../lib/useSession';

/** Coquille du PORTAIL COLLABORATEUR — distincte du back-office.
 *  Desktop d'abord, responsive mobile. Aucun élément du SIRH. */
export function PortalLayout() {
  const { data: ctx } = useSessionContext();
  const SELF_ID = ctx?.employeeId ?? 'e2';
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const employee = employeeById(SELF_ID) ?? employeeById('e2')!;
  const unread = useCorrespondence((s) => s.items.filter((c) => c.employeeId === SELF_ID && (c.status === 'unread' || c.status === 'action_required')).length);
  const greeting = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir';

  return (
    <div className="min-h-screen bg-canvas bg-canvas-glow">
      <PortalSidebar />
      <div className="lg:pl-[252px]">
        <header className="app-header-safe sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur-xl lg:px-7">
          <button onClick={toggleSidebar} className="rounded-xl p-2 text-ink-500 hover:bg-ink/5 lg:hidden" aria-label="Menu"><Menu size={20} /></button>
          <p className="flex-1 text-sm font-semibold text-ink">{greeting} {employee.firstName} <span aria-hidden>👋</span></p>
          <SpaceSwitcher />
          <Link to="/espace/courrier" aria-label={`Mon courrier (${unread})`} className="relative rounded-xl border border-line bg-surface p-2.5 text-ink-500 transition-colors hover:border-amber/40 hover:text-ink">
            <Mail size={18} />
            {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-bold text-night ring-2 ring-canvas">{unread}</span>}
          </Link>
          <button className="flex items-center gap-2.5 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-3 transition-colors hover:border-amber/40">
            <Avatar name={employeeName(employee)} size="sm" />
            <div className="hidden text-left leading-tight lg:block">
              <p className="text-sm font-bold text-ink">{employeeName(employee)}</p>
              <p className="text-[11px] font-medium text-ink-400">{employee.role}</p>
            </div>
          </button>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
