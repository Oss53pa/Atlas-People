import { cn } from '../../lib/cn';

export interface TimelineItem {
  date: string;
  title: string;
  subtitle?: string;
  tone?: 'ok' | 'info' | 'amber' | 'danger' | 'neutral';
}

const TONE: Record<NonNullable<TimelineItem['tone']>, string> = {
  ok: 'bg-ok',
  info: 'bg-info',
  amber: 'bg-amber',
  danger: 'bg-danger',
  neutral: 'bg-ink-400',
};

/** Frise chronologique (historiques immuables). */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <div className={cn('relative space-y-4 pl-5', className)}>
      <span className="absolute bottom-1.5 left-[5px] top-1.5 w-px bg-line" />
      {items.map((it, i) => (
        <div key={i} className="relative">
          <span className={cn('absolute -left-[15px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-surface', TONE[it.tone ?? 'neutral'])} />
          <p className="text-sm font-semibold text-ink">{it.title}</p>
          <p className="text-[11px] font-medium text-ink-400">
            {new Date(`${it.date}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            {it.subtitle ? ` · ${it.subtitle}` : ''}
          </p>
        </div>
      ))}
    </div>
  );
}
