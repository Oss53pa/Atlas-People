import { cn } from '../../lib/cn';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

/** Onglets horizontaux (DS §3.9.1) — soulignement ambre sur l'actif. */
export function Tabs({ tabs, value, onChange }: { tabs: TabItem[]; value: string; onChange: (k: string) => void }) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-line">
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
              active ? 'border-amber text-ink' : 'border-transparent text-ink-500 hover:text-ink',
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', active ? 'bg-amber/15 text-amber-deep' : 'bg-ink/[0.06] text-ink-400')}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
