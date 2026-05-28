import { cn } from '../../lib/cn';

/**
 * Infobulle (DS §3.10.5) — apparition au hover/focus, CSS pur (group).
 * Pour le contenu purement décoratif ; sinon préférer un libellé visible.
 */
export function Tooltip({
  label,
  side = 'top',
  children,
  className,
}: {
  label: string;
  side?: 'top' | 'bottom';
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('group relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-[70] -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-ink opacity-0 shadow-float transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
        )}
      >
        {label}
      </span>
    </span>
  );
}
