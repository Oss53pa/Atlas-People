/**
 * LiveDataBanner — bandeau « données vivantes » réutilisable.
 *
 * Affiche un panneau compact (1 ligne sur ≥ md) au-dessus d'un cockpit avec :
 *   • pulse animé (état live)
 *   • 3-6 stats avec navigation deeplink
 *   • s'efface si offline (mode démo sans Supabase)
 */
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { StatusPill } from '../ui/StatusPill';
import { cn } from '../../lib/cn';

export interface LiveDataStat {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sub: string;
  to: string;
  tone?: 'default' | 'danger' | 'success' | 'warn';
  pill?: string;
}

interface LiveDataBannerProps {
  title: string;
  subtitle: string;
  stats: LiveDataStat[];
}

export function LiveDataBanner({ title, subtitle, stats }: LiveDataBannerProps) {
  return (
    <Card className="border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.04] via-amber/[0.03] to-transparent">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 pr-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <Activity size={14} className="text-emerald-600" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{title}</p>
            <p className="text-[10px] font-medium text-ink-500">{subtitle}</p>
          </div>
        </div>

        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="group flex min-w-[150px] flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 transition-shadow hover:shadow-sm hover:border-amber-deep/40"
          >
            <s.icon size={14} className="shrink-0 text-amber-deep" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{s.label}</p>
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    'mono text-[14px] font-bold leading-none',
                    s.tone === 'danger' ? 'text-rose-600' :
                    s.tone === 'success' ? 'text-emerald-600' :
                    s.tone === 'warn' ? 'text-amber-deep' :
                    'text-ink',
                  )}
                >
                  {s.value}
                </span>
                {s.pill && <StatusPill tone={s.tone === 'danger' ? 'danger' : 'neutral'} dot={false} className="text-[9px]">{s.pill}</StatusPill>}
              </div>
              <p className="truncate text-[10px] font-medium text-ink-500">{s.sub}</p>
            </div>
            <ArrowUpRight size={12} className="ml-auto shrink-0 text-ink-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
