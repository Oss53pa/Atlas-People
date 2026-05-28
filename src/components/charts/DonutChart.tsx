import { useId } from 'react';
import { cn } from '../../lib/cn';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/** Donut multi-segments avec total au centre (façon "Employee Composition"). */
export function DonutChart({
  segments,
  size = 180,
  thickness = 20,
  centerTop,
  centerBottom = 'Total',
  className,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerTop?: string;
  centerBottom?: string;
  className?: string;
}) {
  const id = useId();
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = 0.012 * c; // micro-séparation entre segments

  let acc = 0;
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(23,21,15,0.06)" strokeWidth={thickness} />
          {segments.map((seg, i) => {
            const frac = seg.value / total;
            const len = Math.max(0, frac * c - gap);
            const dashoffset = -acc;
            acc += frac * c;
            return (
              <circle
                key={`${id}-${i}`}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={dashoffset}
                style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.22,1,0.36,1)' }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="mono text-3xl font-bold leading-none text-ink">{centerTop ?? total}</span>
          <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{centerBottom}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {segments.map((seg, i) => (
          <div key={`leg-${id}-${i}`} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
            <span className="text-xs font-semibold text-ink-700">
              {seg.label} <span className="text-ink-400">{Math.round((seg.value / total) * 100)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
