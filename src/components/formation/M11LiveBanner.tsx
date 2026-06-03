/**
 * M11LiveBanner — bandeau « données vivantes » au-dessus du cockpit M11.
 *
 * Lit l'agrégat Supabase si configuré (sinon ne s'affiche pas) :
 *   • 5 KPIs cl?s : parcours actifs · PIF signés · budget consommé · LMS completion · patterns critical
 *   • Lien direct vers les pages sprint 1 concernées
 *   • Stamp fraicheur (fetchedAt)
 *
 * Volontairement compact (1 ligne sur ≥ md), s'efface en mode démo offline.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Route, FileSignature, Coins, Monitor, ShieldAlert, ArrowUpRight,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { StatusPill } from '../ui/StatusPill';
import { cn } from '../../lib/cn';
import { fetchM11CockpitLive, type M11CockpitLive } from '../../lib/m11/supabaseLive';

const fmtCompact = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return String(Math.round(n));
};
const pct = (v: number): string => `${Math.round(v * 100)} %`;

export function M11LiveBanner() {
  const [data, setData] = useState<M11CockpitLive | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'offline'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetchM11CockpitLive().then((res) => {
      if (cancelled) return;
      if (res) { setData(res); setState('ready'); } else { setState('offline'); }
    });
    return () => { cancelled = true; };
  }, []);

  if (state === 'offline') return null;

  return (
    <Card className={cn('border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.04] via-amber/[0.03] to-transparent')}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 pr-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <Activity size={14} className="text-emerald-600" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Données vivantes — Sprint 1</p>
            <p className="text-[10px] font-medium text-ink-500">
              {state === 'loading' ? 'Lecture Supabase…' : 'Tenant démo · atlas_people'}
            </p>
          </div>
        </div>

        {state === 'ready' && data && (
          <>
            <LiveStat icon={Route} label="Parcours actifs" value={String(data.parcoursActifs)} sub={`${data.enrollmentsActifs}+${data.enrollmentsCompleted} inscrits`} to="/formation/parcours" />
            <LiveStat icon={FileSignature} label="PIF signés" value={pct(data.pifSignedRate)} sub={`${data.pifTotal} PIF total`} to="/formation/pif" />
            <LiveStat icon={Coins} label="Budget consommé" value={`${fmtCompact(data.budgetConsumed)}`} sub={`/ ${fmtCompact(data.budgetTotal)} FCFA`} to="/formation/pif" />
            <LiveStat icon={Monitor} label="Complétion LMS" value={pct(data.lmsCompletionRate)} sub={`${data.lmsLearners} apprenants · ${data.badgesAwardedYtd} badges`} to="/formation/lms" />
            <LiveStat icon={ShieldAlert}
              label="Patterns critiques"
              value={String(data.patternsCritical)}
              sub={`${data.patternsOpen} ouverts`}
              tone={data.patternsCritical > 0 ? 'danger' : 'success'}
              to="/formation/audit" />
          </>
        )}
      </div>
    </Card>
  );
}

interface LiveStatProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sub: string;
  to: string;
  tone?: 'default' | 'danger' | 'success';
}

function LiveStat({ icon: Icon, label, value, sub, to, tone = 'default' }: LiveStatProps) {
  const palette: Record<NonNullable<LiveStatProps['tone']>, string> = {
    default: 'text-ink',
    danger: 'text-rose-600',
    success: 'text-emerald-600',
  };
  return (
    <Link
      to={to}
      className="group flex min-w-[150px] flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 transition-shadow hover:shadow-sm hover:border-amber-deep/40"
    >
      <Icon size={14} className="shrink-0 text-amber-deep" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className={cn('mono text-[14px] font-bold leading-none', palette[tone])}>{value}</span>
          {tone === 'danger' && (
            <StatusPill tone="danger" dot={false} className="text-[9px]">P1+P3</StatusPill>
          )}
        </div>
        <p className="truncate text-[10px] font-medium text-ink-500">{sub}</p>
      </div>
      <ArrowUpRight size={12} className="ml-auto shrink-0 text-ink-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}
