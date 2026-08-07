import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronDown, Target, ArrowRight, Sparkles, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { PerformanceSubNav } from '../../components/mss/PerformanceSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam, scopedTeamIds } from '../../lib/mss/scope';
import { memberOkr, OKR_STATUS_META } from '../../lib/mss/perf';
import { employeeName } from '../../data/mock';
import { isBackendConfigured, useTeamObjectives, type TeamObjectiveRow } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';
import { mockEmpId } from '../../lib/m1/roster';

/** final_score : ≤ 1 => fraction (×100), sinon déjà un pourcentage. */
function scorePct(v: number | null): number {
  if (v == null) return 0;
  const n = Number(v);
  return Math.round(n <= 1 ? n * 100 : n);
}

const MY_OKR = [
  { title: 'Augmenter le CA département de 15%', progress: 67 },
  { title: 'Améliorer la satisfaction client (NPS)', progress: 54 },
  { title: 'Réduire le turn-over équipe à < 8%', progress: 80 },
];

function Bar({ pct, tone = 'info' }: { pct: number; tone?: 'info' | 'ok' | 'warn' | 'danger' }) {
  const c = tone === 'ok' ? 'bg-ok' : tone === 'warn' ? 'bg-warn' : tone === 'danger' ? 'bg-danger' : 'bg-info';
  return <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]"><div className={`h-full rounded-full ${c}`} style={{ width: `${Math.min(100, pct)}%` }} /></div>;
}

export function TeamOKRPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const teamIds = useMemo(() => scopedTeamIds(depth, employees), [depth, employees]);

  const { data: ctx } = useSessionContext();
  const { data: liveObjectives } = useTeamObjectives(ctx?.tenantId ?? undefined);
  const liveObj = useMemo<TeamObjectiveRow[] | null>(() => {
    if (!isBackendConfigured || !liveObjectives || liveObjectives.length === 0) return null;
    const scoped = liveObjectives.filter((r) => r.owner_id == null || teamIds.has(mockEmpId(r.owner_id)));
    return scoped.length > 0 ? scoped : null;
  }, [liveObjectives, teamIds]);

  return (
    <div className="animate-fade-up space-y-5">
      <PerformanceSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Objectifs — cascade d'alignement</h1>
        <div className="flex items-center gap-2">
          {liveObj && <StatusPill tone="ok" dot={false}><span className="inline-flex items-center gap-1"><Wifi size={12} /> Live DB</span></StatusPill>}
          <Button size="sm"><Target size={14} /> Cascader un objectif</Button>
        </div>
      </div>

      {liveObj && (
        <Card>
          <CardHeader title="Objectifs d'équipe (live)" subtitle={`${liveObj.length} objectif(s) · périmètre managérial`} action={<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Supabase</span>} />
          <div className="space-y-3">
            {liveObj.map((o) => {
              const pct = scorePct(o.final_score);
              const owner = `${o.employee_first_name ?? ''} ${o.employee_last_name ?? ''}`.trim();
              return (
                <div key={o.id}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[13px] font-semibold">
                    <span className="min-w-0 truncate text-ink">{o.title}</span>
                    <span className="mono text-ink-500">{o.final_score != null ? `${pct}%` : '—'}</span>
                  </div>
                  <Bar pct={pct} tone={pct >= 75 ? 'ok' : pct >= 45 ? 'info' : 'warn'} />
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-ink-400">
                    {owner ? <span>{owner}</span> : o.team_label ? <span>{o.team_label}</span> : <span>Objectif d'équipe</span>}
                    <StatusPill tone="info" dot={false}>{o.status}</StatusPill>
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Niveaux supérieurs (lecture seule) */}
      <Card className="bg-surface2/60">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-500">
          <Building2 size={15} className="text-ink-400" /> Objectifs entreprise & BU
          <StatusPill tone="info" dot={false}>lecture seule</StatusPill>
        </div>
        <div className="mt-1 flex justify-center"><ChevronDown size={16} className="text-ink-300" /></div>
      </Card>

      {/* Mes objectifs managériaux */}
      <Card>
        <CardHeader title="Mes objectifs (managériaux)" subtitle="Cascadent vers mes N-1" action={<Target size={16} className="text-info" />} />
        <div className="space-y-3">
          {MY_OKR.map((o) => (
            <div key={o.title}>
              <div className="mb-1 flex items-center justify-between text-[13px] font-semibold"><span className="text-ink">{o.title}</span><span className="mono text-ink-500">{o.progress}%</span></div>
              <Bar pct={o.progress} tone={o.progress >= 75 ? 'ok' : o.progress >= 45 ? 'info' : 'warn'} />
            </div>
          ))}
        </div>
      </Card>

      <p className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-400"><ChevronDown size={14} /> Cascadent vers mes {team.length} collaborateur(s)</p>

      {/* Cascade par membre */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {team.map((e) => {
          const m = memberOkr(e);
          return (
            <Card key={e.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={employeeName(e)} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-ink">{employeeName(e)}</p>
                    <p className="text-[11px] font-medium text-ink-400">Aligné sur : {m.alignedOn}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="mono text-lg font-semibold text-ink">{m.progress}%</p>
                  <p className="text-[10px] font-medium text-ink-400">avancement</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {m.objectives.map((o, i) => (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-[12px] font-medium">
                      <span className="min-w-0 truncate text-ink-700">{o.title}</span>
                      <StatusPill tone={OKR_STATUS_META[o.status].tone} dot={false}>{o.progress}%</StatusPill>
                    </div>
                    <Bar pct={o.progress} tone={OKR_STATUS_META[o.status].tone === 'danger' ? 'danger' : OKR_STATUS_META[o.status].tone === 'warn' ? 'warn' : OKR_STATUS_META[o.status].tone === 'ok' ? 'ok' : 'info'} />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <Link to={`/team/equipe/${e.id}`}><Button variant="ghost" size="sm">Voir détail <ArrowRight size={13} /></Button></Link>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Sparkles size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Proph3t peut proposer une décomposition d'un objectif en sous-objectifs et indicateurs clés (KR) pour chaque membre — vous validez ou ajustez avant de cascader. Les révisions sont historisées.</p>
      </Card>
    </div>
  );
}
