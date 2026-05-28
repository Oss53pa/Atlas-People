import { Check, Minus } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Interrupteur (DS §3.3.10). */
export function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn('flex items-center justify-between gap-3', disabled && 'opacity-50')}>
      {(label || hint) && (
        <span className="leading-tight">
          {label && <span className="block text-sm font-semibold text-ink">{label}</span>}
          {hint && <span className="block text-[11px] font-medium text-ink-400">{hint}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-amber' : 'bg-ink/15')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </button>
    </label>
  );
}

/** Case à cocher (DS §3.3.8). */
export function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
          checked || indeterminate ? 'border-amber bg-amber text-night' : 'border-line bg-surface',
        )}
      >
        {indeterminate ? <Minus size={13} /> : checked ? <Check size={13} /> : null}
      </button>
      {(label || hint) && (
        <span className="leading-tight">
          {label && <span className="block text-sm font-semibold text-ink-700">{label}</span>}
          {hint && <span className="block text-[11px] font-medium text-ink-400">{hint}</span>}
        </span>
      )}
    </label>
  );
}

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

/** Groupe radio (DS §3.3.9) — variantes inline / card. */
export function RadioGroup({
  options,
  value,
  onChange,
  variant = 'inline',
}: {
  options: RadioOption[];
  value: string;
  onChange: (v: string) => void;
  variant?: 'inline' | 'card';
}) {
  return (
    <div role="radiogroup" className={cn(variant === 'card' ? 'grid gap-2' : 'flex flex-col gap-3')}>
      {options.map((o) => {
        const active = o.value === value;
        if (variant === 'card') {
          return (
            <button
              key={o.value}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={cn('flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all', active ? 'border-amber/50 bg-amber/[0.06]' : 'border-line hover:border-amber/30')}
            >
              <Dot active={active} />
              <span>
                <span className="block text-sm font-semibold text-ink">{o.label}</span>
                {o.description && <span className="block text-[12px] font-medium text-ink-400">{o.description}</span>}
              </span>
            </button>
          );
        }
        return (
          <button key={o.value} role="radio" aria-checked={active} onClick={() => onChange(o.value)} className="flex items-center gap-2.5 text-left">
            <Dot active={active} />
            <span className="text-sm font-semibold text-ink-700">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Dot({ active }: { active: boolean }) {
  return (
    <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-amber' : 'border-line')}>
      {active && <span className="h-2 w-2 rounded-full bg-amber" />}
    </span>
  );
}
