import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { countryByCode, COUNTRIES } from '../../data/countries';
import { cn } from '../../lib/cn';

export function CountrySwitcher() {
  const { tenant, activeCountry, setActiveCountry } = useAppStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = countryByCode(activeCountry);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const tenantCountries = COUNTRIES.filter((c) => tenant.countries.includes(c.code));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-amber/40"
      >
        <span className="text-base leading-none">{active.flag}</span>
        <span className="hidden sm:inline">{active.name}</span>
        <span className="mono rounded-md bg-amber/12 px-1.5 py-0.5 text-[10px] font-bold text-amber-deep">
          {active.currency}
        </span>
        <ChevronDown size={15} className={cn('text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 origin-top-right animate-fade-up rounded-2xl border border-line bg-surface p-2 shadow-float">
          <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            <Globe size={12} /> Pays d'affectation · {tenant.name}
          </div>
          {tenantCountries.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setActiveCountry(c.code);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
                c.code === activeCountry ? 'bg-amber/[0.10]' : 'hover:bg-ink/[0.04]',
              )}
            >
              <span className="text-lg">{c.flag}</span>
              <div className="flex-1 leading-tight">
                <p className="text-sm font-semibold text-ink">{c.name}</p>
                <p className="text-[11px] font-medium text-ink-400">
                  {c.zone} · {c.socialFund}
                </p>
              </div>
              <span className="mono text-[11px] font-bold text-ink-500">{c.currency}</span>
              {c.code === activeCountry && <Check size={15} className="text-amber-deep" />}
            </button>
          ))}
          <div className="mt-1 border-t border-line px-2.5 pt-2 text-[10px] font-medium text-ink-400">
            XOF (UEMOA) et XAF (CEMAC) ne se mélangent jamais dans un calcul.
          </div>
        </div>
      )}
    </div>
  );
}
