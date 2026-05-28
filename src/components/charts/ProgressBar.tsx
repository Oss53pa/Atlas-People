import { cn } from '../../lib/cn';

export function ProgressBar({
  value,
  max = 100,
  tone = 'amber',
  showLabel = false,
  className,
}: {
  value: number;
  max?: number;
  tone?: 'amber' | 'ok' | 'info' | 'danger' | 'warn';
  showLabel?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tones: Record<string, string> = {
    amber: 'from-amber-soft to-amber',
    ok: 'from-emerald-400 to-ok',
    info: 'from-sky-400 to-info',
    danger: 'from-red-400 to-danger',
    warn: 'from-amber-soft to-warn',
  };
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/[0.07]">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', tones[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="mono w-9 text-right text-[11px] font-semibold text-ink-500">{Math.round(pct)}%</span>}
    </div>
  );
}
