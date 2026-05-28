import { cn } from '../../lib/cn';

/**
 * Grille de points façon "Attendance Report" : chaque point porte une
 * intensité 0..1 mappée sur une rampe ambre. Idéal pour assiduité / heatmap.
 */
export function DotMatrix({
  data,
  cols = 14,
  dotSize = 11,
  gap = 6,
  className,
}: {
  data: number[]; // valeurs 0..1
  cols?: number;
  dotSize?: number;
  gap?: number;
  className?: string;
}) {
  const color = (v: number) => {
    if (v <= 0) return 'rgba(23,21,15,0.08)';
    if (v < 0.34) return 'rgba(246,188,91,0.45)';
    if (v < 0.67) return 'rgba(239,159,39,0.7)';
    return '#EF9F27';
  };

  return (
    <div
      className={cn('grid', className)}
      style={{ gridTemplateColumns: `repeat(${cols}, ${dotSize}px)`, gap }}
    >
      {data.map((v, i) => (
        <span
          key={i}
          className="rounded-full transition-colors"
          style={{ width: dotSize, height: dotSize, background: color(v) }}
        />
      ))}
    </div>
  );
}
