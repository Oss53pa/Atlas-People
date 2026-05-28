import { cn } from '../../lib/cn';

/** Petits graphiques inline pour le reporting MSS (sans dépendance externe). */

export function HBars({ data, unit, color = 'bg-info/70' }: { data: { label: string; value: number }[]; unit?: string; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-[12px] font-medium text-ink-600" title={d.label}>{d.label}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface2">
            <div className={cn('h-full rounded-full', color)} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="mono w-16 shrink-0 text-right text-[12px] font-semibold text-ink-700">{d.value}{unit ?? ''}</span>
        </div>
      ))}
    </div>
  );
}

export function VBars({ data, suffix }: { data: { label: string; value: number }[]; suffix?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-32 items-end gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full items-end justify-center" style={{ height: '100%' }}>
            <div className="w-full max-w-[28px] rounded-t-lg bg-info/70" style={{ height: `${(d.value / max) * 100}%` }} title={`${d.value}${suffix ?? ''}`} />
          </div>
          <span className="text-[10px] font-semibold text-ink-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Barre de répartition empilée (distribution en %). */
export function StackBar({ segments }: { segments: { label: string; pct: number; className: string }[] }) {
  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface2">
        {segments.map((s) => <div key={s.label} className={s.className} style={{ width: `${s.pct}%` }} title={`${s.label} ${s.pct}%`} />)}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-[11px] font-medium text-ink-600">
            <span className={cn('h-2.5 w-2.5 rounded-sm', s.className)} /> {s.label} <span className="mono font-semibold text-ink">{s.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Jauge de budget (consommé / engagé / disponible). */
export function BudgetGauge({ spent, engaged, total }: { spent: number; engaged: number; total: number }) {
  const sp = total ? (spent / total) * 100 : 0;
  const en = total ? (engaged / total) * 100 : 0;
  return (
    <div className="h-4 w-full overflow-hidden rounded-full bg-surface2">
      <div className="flex h-full">
        <div className="h-full bg-info" style={{ width: `${sp}%` }} title={`Consommé ${Math.round(sp)}%`} />
        <div className="h-full bg-amber/60" style={{ width: `${en}%` }} title={`Engagé ${Math.round(en)}%`} />
      </div>
    </div>
  );
}
