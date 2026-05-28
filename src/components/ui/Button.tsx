import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'icon';
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-amber text-night font-semibold hover:bg-amber-soft shadow-[0_8px_24px_-8px_rgba(239,159,39,0.55)]',
  ghost: 'text-ink-500 hover:text-ink hover:bg-ink/5',
  outline: 'border border-line text-ink-700 hover:border-amber/50 hover:text-ink bg-surface',
  danger: 'bg-danger/10 text-danger hover:bg-danger/18 border border-danger/20',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  icon: 'h-9 w-9 justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium tracking-wide transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
