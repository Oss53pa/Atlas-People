import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Layers, Check } from 'lucide-react';
import { useManagerScope } from '../../store/useManagerScope';
import { useDirectory } from '../../store/useDirectory';
import { maxChainDepth, scopedTeam, DEPTH_LABEL, DEPTH_SUBLABEL, type ManagerDepth } from '../../lib/mss/scope';
import { cn } from '../../lib/cn';

const OPTIONS: ManagerDepth[] = ['direct', 'department', 'all'];

/** Sélecteur de profondeur de vue (01_FONDATION §0.3). Pour un manager N1 pur,
 *  un seul choix : affiché en lecture comme contexte. */
export function DepthSelector() {
  const depth = useManagerScope((s) => s.depth);
  const setDepth = useManagerScope((s) => s.setDepth);
  const employees = useDirectory((s) => s.employees);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const deepest = maxChainDepth(employees);
  const available: ManagerDepth[] = deepest <= 1 ? ['direct'] : deepest === 2 ? ['direct', 'department'] : OPTIONS;
  const single = available.length === 1;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const count = scopedTeam(depth, employees).length;

  return (
    <div ref={ref} className="relative px-3">
      <button
        onClick={() => !single && setOpen((o) => !o)}
        className={cn('flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-left transition-colors', single ? 'cursor-default' : 'hover:border-info/40')}
      >
        <Layers size={15} className="shrink-0 text-info" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[12px] font-bold text-ink">{DEPTH_LABEL[depth]}</p>
          <p className="truncate text-[10px] font-medium text-ink-400">{DEPTH_SUBLABEL[depth]} · {count} pers.</p>
        </div>
        {!single && <ChevronDown size={14} className={cn('shrink-0 text-ink-400 transition-transform', open && 'rotate-180')} />}
      </button>

      {open && !single && (
        <div className="absolute left-3 right-3 z-50 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-lg shadow-ink/10">
          {available.map((opt) => {
            const n = scopedTeam(opt, employees).length;
            const active = opt === depth;
            return (
              <button key={opt} onClick={() => { setDepth(opt); setOpen(false); }}
                className={cn('flex w-full items-center gap-2 px-3 py-2 text-left transition-colors', active ? 'bg-info/10' : 'hover:bg-ink/[0.04]')}>
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">{active && <Check size={13} className="text-info" />}</span>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-[12px] font-bold text-ink">{DEPTH_LABEL[opt]}</p>
                  <p className="truncate text-[10px] font-medium text-ink-400">{DEPTH_SUBLABEL[opt]} · {n} pers.</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
