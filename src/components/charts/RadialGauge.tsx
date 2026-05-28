import { useId } from 'react';
import { cn } from '../../lib/cn';

/** Anneau de progression radial premium (gradient ambre, cap arrondi). */
export function RadialGauge({
  value,
  max = 100,
  size = 160,
  thickness = 14,
  label,
  sublabel,
  centerValue,
  tone = 'amber',
  dark = false,
  className,
}: {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  label?: string;
  sublabel?: string;
  centerValue?: string;
  tone?: 'amber' | 'ok' | 'info' | 'danger';
  dark?: boolean;
  className?: string;
}) {
  const id = useId();
  const pct = Math.max(0, Math.min(1, value / max));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  const grad: Record<string, [string, string]> = {
    amber: ['#F6BC5B', '#EF9F27'],
    ok: ['#3FD0A0', '#1B9E6B'],
    info: ['#7FB6E8', '#3B82C4'],
    danger: ['#E8857B', '#D6483B'],
  };
  const [g0, g1] = grad[tone];

  return (
    <div className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={g0} />
            <stop offset="100%" stopColor={g1} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={dark ? 'rgba(255,255,255,0.12)' : 'rgba(23,21,15,0.07)'}
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#g-${id})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={cn('mono text-2xl font-bold leading-none', dark ? 'text-white' : 'text-ink')}>
          {centerValue ?? `${Math.round(pct * 100)}%`}
        </span>
        {label && (
          <span
            className={cn(
              'mt-1 text-[11px] font-semibold uppercase tracking-wider',
              dark ? 'text-white/50' : 'text-ink-400',
            )}
          >
            {label}
          </span>
        )}
        {sublabel && (
          <span className={cn('text-[11px] font-medium', dark ? 'text-white/40' : 'text-ink-500')}>{sublabel}</span>
        )}
      </div>
    </div>
  );
}
