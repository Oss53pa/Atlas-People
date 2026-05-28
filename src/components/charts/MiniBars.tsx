import { cn } from '../../lib/cn';

/** Histogramme compact (SVG pur), barres arrondies, mise en avant ambre. */
export function MiniBars({
  data,
  height = 120,
  highlightIndex,
  className,
}: {
  data: { label: string; value: number }[];
  height?: number;
  highlightIndex?: number;
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value)) || 1;
  return (
    <div className={cn('flex items-end gap-2', className)} style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max(6, (d.value / max) * (height - 22));
        const active = i === highlightIndex;
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn(
                'w-full rounded-t-md transition-all duration-500',
                active ? 'bg-gradient-to-t from-amber to-highlight' : 'bg-ink/[0.10]',
              )}
              style={{ height: h }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="text-[10px] font-semibold text-ink-400">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
