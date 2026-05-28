import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SPACES, spacesForRoles, DEMO_USER, type SurfaceKey } from '../../app/spaces';
import { useSurface } from '../../store/useSurface';
import { cn } from '../../lib/cn';

const TONE_DOT: Record<'ok' | 'info' | 'amber', string> = {
  ok: 'bg-ok',
  info: 'bg-info',
  amber: 'bg-amber',
};

/** Sélecteur d'espace (TopBar). Visible uniquement si l'utilisateur a accès à
 *  plusieurs espaces. Le changement d'espace change le contexte complet. */
export function SpaceSwitcher() {
  const navigate = useNavigate();
  const surface = useSurface((s) => s.surface);
  const setSurface = useSurface((s) => s.setSurface);
  const [open, setOpen] = useState(false);

  const available = spacesForRoles(DEMO_USER.roles);
  if (available.length < 2) return null; // employé simple : pas de sélecteur

  const current = SPACES[surface];

  const choose = (key: SurfaceKey) => {
    setSurface(key);
    setOpen(false);
    navigate(SPACES[key].landing);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-line bg-surface py-1.5 pl-2.5 pr-2 transition-colors hover:border-amber/40"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={cn('h-2 w-2 shrink-0 rounded-full', TONE_DOT[current.tone])} />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[13px] font-bold text-ink">{current.label}</span>
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-400">{current.sub}</span>
        </span>
        <ChevronDown size={15} className="text-ink-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute left-0 z-50 mt-1.5 w-60 overflow-hidden rounded-2xl border border-line bg-surface shadow-float">
            <p className="border-b border-line px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-400">Changer d'espace</p>
            {available.map((key) => {
              const sp = SPACES[key];
              const Icon = sp.icon;
              const active = key === surface;
              return (
                <button
                  key={key}
                  role="menuitem"
                  onClick={() => choose(key)}
                  className={cn('flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-ink/[0.04]', active && 'bg-amber/[0.06]')}
                >
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', active ? 'bg-amber/15 text-amber-deep' : 'bg-ink/[0.05] text-ink-500')}>
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink">{sp.label}</span>
                    <span className="block text-[11px] font-medium text-ink-400">{sp.sub}</span>
                  </span>
                  {active && <Check size={15} className="text-amber-deep" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
