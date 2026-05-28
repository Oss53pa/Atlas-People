import { Money } from '../../lib/money';
import { cn } from '../../lib/cn';

/** Affichage monétaire en JetBrains Mono (doc transverse §1). */
export function MoneyDisplay({
  money,
  withCurrency = true,
  className,
}: {
  money: Money;
  withCurrency?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('mono', money.isNegative() && 'text-danger', className)}>
      {withCurrency ? money.formatWithCurrency() : money.format()}
    </span>
  );
}

/** Champ de saisie monétaire (entier, Mono). */
export function MoneyInput({
  value,
  onChange,
  placeholder = '0',
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onChange(Math.max(0, Math.round(Number(e.target.value) || 0)))}
      className={cn(
        'mono h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none focus:ring-2 focus:ring-amber/15',
        className,
      )}
    />
  );
}
