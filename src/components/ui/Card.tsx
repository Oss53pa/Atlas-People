import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'amber' | 'flush';
  hover?: boolean;
  inset?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, inset = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        variant === 'amber' ? 'glass-amber' : variant === 'flush' ? 'rounded-2xl' : 'glass',
        hover && 'card-hover cursor-default',
        inset && 'p-5',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div>
        <h3 className="text-[15px] font-semibold tracking-wide text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs font-medium text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
