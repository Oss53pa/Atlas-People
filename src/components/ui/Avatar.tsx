import { cn } from '../../lib/cn';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

// Palette dérivée déterministiquement du nom pour un rendu stable.
const palettes = [
  'from-amber-soft/60 to-amber/30 text-amber-deep',
  'from-info/25 to-info/10 text-info',
  'from-ok/25 to-ok/10 text-ok',
  'from-fuchsia-400/30 to-fuchsia-400/10 text-fuchsia-600',
  'from-sky-400/30 to-sky-400/10 text-sky-600',
];

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palettes.length;
  const sizes = {
    xs: 'h-7 w-7 text-[10px]',
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
  };
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold tracking-wide ring-1 ring-black/5',
        palettes[idx],
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
