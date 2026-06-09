import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Users } from 'lucide-react';
import { ManagerSidebar } from './ManagerSidebar';
import { SpaceSwitcher } from './SpaceSwitcher';
import { Avatar } from '../ui/Avatar';
import { useAppStore } from '../../store/useAppStore';
import { useSurface } from '../../store/useSurface';
import { useManagerScope } from '../../store/useManagerScope';
import { useDirectory } from '../../store/useDirectory';
import { scopedTeam, DEPTH_LABEL, MANAGER_ID } from '../../lib/mss/scope';
import { employeeById, employeeName } from '../../data/mock';

/** Coquille du PORTAIL MANAGER (MSS) — distincte du back-office (R1).
 *  Header contextuel : manager + nombre de collaborateurs + profondeur de vue. */
export function ManagerLayout() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const setSurface = useSurface((s) => s.setSurface);
  const depth = useManagerScope((s) => s.depth);
  const employees = useDirectory((s) => s.employees);

  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const manager = employeeById(MANAGER_ID)!;
  const teamCount = scopedTeam(depth, employees).length;
  const greeting = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir';

  return (
    <div className="min-h-screen bg-canvas bg-canvas-glow">
      <ManagerSidebar />
      <div className="lg:pl-[252px]">
        <header className="app-header-safe sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur-xl lg:px-7">
          <button onClick={toggleSidebar} className="rounded-xl p-2 text-ink-500 hover:bg-ink/5 lg:hidden" aria-label="Menu"><Menu size={20} /></button>
          <div className="flex-1 leading-tight">
            <p className="text-sm font-semibold text-ink">{greeting} {manager.firstName}</p>
            <p className="hidden items-center gap-1.5 text-[11px] font-medium text-ink-400 sm:flex">
              <Users size={12} className="text-info" /> {DEPTH_LABEL[depth]} · {teamCount} collaborateurs
            </p>
          </div>
          <SpaceSwitcher />
          <button className="flex items-center gap-2.5 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-3 transition-colors hover:border-info/40">
            <Avatar name={employeeName(manager)} size="sm" />
            <div className="hidden text-left leading-tight lg:block">
              <p className="text-sm font-bold text-ink">{employeeName(manager)}</p>
              <p className="text-[11px] font-medium text-ink-400">{manager.role}</p>
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
