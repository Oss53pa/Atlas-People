import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { QuickLauncher } from '../QuickLauncher';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas bg-canvas-glow">
      <Sidebar />
      <div className="lg:pl-[252px]">
        <Topbar />
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <QuickLauncher />
    </div>
  );
}
