import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/** Champ de formulaire : label + contrôle + aide + erreur (doc transverse §6). */
export function FormField({
  label,
  required,
  error,
  hint,
  htmlFor,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        {label}
        {required && <span className="text-amber-deep"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] font-medium text-ink-400">{hint}</p>}
      {error && (
        <p className="mt-1 text-[11px] font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const controlCls =
  'h-10 w-full rounded-xl border bg-surface px-3 text-sm font-medium text-ink placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-amber/15 disabled:cursor-not-allowed disabled:bg-surface2';

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <input ref={ref} className={cn(controlCls, invalid ? 'border-danger/50' : 'border-line focus:border-amber/40', className)} {...props} />
  ),
);
TextInput.displayName = 'TextInput';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(controlCls, 'border-line font-semibold focus:border-amber/40', className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
