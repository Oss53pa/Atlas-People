import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface Crumb {
  label: string;
  to?: string;
}

/** Fil d'Ariane (DS §2.5) — dernier segment non cliquable. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-[13px] font-semibold">
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {c.to && !last ? (
              <Link to={c.to} className="text-ink-500 transition-colors hover:text-ink">
                {c.label}
              </Link>
            ) : (
              <span className={cn(last ? 'text-ink' : 'text-ink-500')}>{c.label}</span>
            )}
            {!last && <ChevronRight size={14} className="text-ink-400" />}
          </span>
        );
      })}
    </nav>
  );
}
