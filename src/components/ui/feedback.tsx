import { type LucideIcon, Sparkles, WifiOff, Inbox } from 'lucide-react';
import { Brand } from './Brand';
import { cn } from '../../lib/cn';

/** État vide premium. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/[0.05] text-ink-400">
        <Icon size={22} />
      </span>
      <p className="text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm font-medium text-ink-400">{description}</p>}
      {action && <div className="mt-4 flex items-center gap-2">{action}</div>}
    </div>
  );
}

/** Squelette de chargement (lignes / blocs). */
export function SkeletonLoader({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="shimmer h-12 rounded-xl bg-ink/[0.05]" />
      ))}
    </div>
  );
}

/** Bandeau hors-ligne (PWA offline-first). */
export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-warn/30 bg-warn/[0.10] px-3.5 py-2 text-sm font-semibold text-warn">
      <WifiOff size={15} /> Hors-ligne — vos actions seront synchronisées au retour de connexion.
    </div>
  );
}

/** Suggestion / explication Proph3t (IA souveraine). */
export function PropheticHint({
  children,
  tone = 'amber',
  className,
}: {
  children: React.ReactNode;
  tone?: 'amber' | 'neutral';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl px-3.5 py-2.5',
        tone === 'amber' ? 'bg-amber/[0.07]' : 'bg-ink/[0.04]',
        className,
      )}
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber/20 text-amber-deep">
        <Sparkles size={12} />
      </span>
      <p className="text-[12px] font-medium leading-relaxed text-ink-700">
        <Brand name="Proph3t" className="mr-1 text-amber-deep" />
        {children}
      </p>
    </div>
  );
}
