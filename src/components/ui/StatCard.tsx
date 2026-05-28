import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/cn';

export function StatCard({
  label,
  value,
  unit,
  delta,
  icon: Icon,
  mono = false,
  tone = 'default',
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  icon?: LucideIcon;
  mono?: boolean;
  tone?: 'default' | 'amber';
  className?: string;
}) {
  const positive = (delta ?? 0) >= 0;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl p-5 card-hover',
        tone === 'amber' ? 'glass-amber' : 'glass',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">{label}</span>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber/12 text-amber-deep">
            <Icon size={16} strokeWidth={2.2} />
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end gap-1.5">
        <span className={cn('leading-none text-ink', mono ? 'mono text-2xl font-semibold' : 'text-3xl font-semibold tracking-tight')}>
          {value}
        </span>
        {unit && <span className="pb-0.5 text-sm font-semibold text-ink-400">{unit}</span>}
      </div>

      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-bold',
              positive ? 'bg-ok/12 text-ok' : 'bg-danger/12 text-danger',
            )}
          >
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {positive ? '+' : ''}
            {delta}%
          </span>
          <span className="text-[11px] font-medium text-ink-400">vs mois préc.</span>
        </div>
      )}
    </div>
  );
}
