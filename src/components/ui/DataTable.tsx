import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  sortable?: boolean;
  /** Valeur brute pour le tri (par défaut row[key]). */
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
  className?: string;
}

/** Tableau de données générique (tri client, lignes cliquables). */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  empty,
  gridTemplate,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  /** grille CSS, ex: '2fr 1fr 1fr' ; défaut = colonnes égales. */
  gridTemplate?: string;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const template = gridTemplate ?? `repeat(${columns.length}, minmax(0, 1fr))`;

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const val = (r: T) => col.sortValue?.(r) ?? ((r as Record<string, unknown>)[col.key] as string | number);
    return [...rows].sort((a, b) => (val(a) > val(b) ? sort.dir : val(a) < val(b) ? -sort.dir : 0));
  }, [rows, sort, columns]);

  const toggleSort = (c: Column<T>) =>
    c.sortable && setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 }));

  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="overflow-hidden">
      <div className="hidden gap-4 border-b border-line px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400 lg:grid" style={{ gridTemplateColumns: template }}>
        {columns.map((c) => (
          <button
            key={c.key}
            onClick={() => toggleSort(c)}
            className={cn('flex items-center gap-1', c.align === 'right' && 'justify-end', c.sortable ? 'hover:text-ink' : 'cursor-default')}
          >
            {c.header}
            {c.sortable && <ArrowUpDown size={11} className={cn(sort?.key === c.key ? 'text-amber-deep' : 'text-ink-400/50')} />}
          </button>
        ))}
      </div>
      <div className="divide-y divide-line">
        {sorted.map((row) => (
          <button
            key={row.id}
            onClick={() => onRowClick?.(row)}
            className={cn('grid w-full grid-cols-1 items-center gap-3 px-5 py-3.5 text-left lg:grid', onRowClick && 'transition-colors hover:bg-amber/[0.04]')}
            style={{ gridTemplateColumns: template }}
          >
            {columns.map((c) => (
              <div key={c.key} className={cn(c.align === 'right' && 'lg:text-right', c.className)}>
                {c.render(row)}
              </div>
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}
