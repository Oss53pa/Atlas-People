import { cn } from '../../lib/cn';

type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'amber';

const tones: Record<Tone, string> = {
  ok: 'bg-ok/10 text-ok border-ok/20',
  warn: 'bg-warn/12 text-warn border-warn/25',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-info/10 text-info border-info/20',
  amber: 'bg-amber/12 text-amber-deep border-amber/30',
  neutral: 'bg-ink/[0.04] text-ink-500 border-line',
};

export function StatusPill({
  children,
  tone = 'neutral',
  dot = true,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
