import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, UserCheck, LogOut, Plus, ArrowRight, Zap, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { RecruitmentSubNav } from '../../components/mss/RecruitmentSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam, scopedTeamIds, MANAGER_ID } from '../../lib/mss/scope';
import { recruitmentRequests, candidatePipeline, newcomers, leavers, frDate } from '../../lib/mss/recruit';
import { employeeName } from '../../data/mock';
import { isBackendConfigured, useTeamJobs, useTeamApplications } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';
import { mockEmpId } from '../../lib/m1/roster';

export function TeamRecruitmentDashboardPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);

  const { data: ctx } = useSessionContext();
  const { data: liveJobs } = useTeamJobs(ctx?.tenantId ?? undefined);
  const { data: liveApps } = useTeamApplications(ctx?.tenantId ?? undefined);
  const hasLive = isBackendConfigured && !!liveJobs && liveJobs.length > 0;

  const reqs = recruitmentRequests();
  const instruction = reqs.filter((r) => r.status === 'instruction').length;
  const sourcing = reqs.filter((r) => r.status === 'sourcing' || r.status === 'validated').length;
  const filled = reqs.filter((r) => r.status === 'filled');
  const pipe = candidatePipeline();
  const news = newcomers(team);
  const lvs = leavers(team);

  // ── Périmètre live : postes du manager (hiring_manager ∈ équipe OU = manager),
  //    fallback = tout le tenant (démo restreinte).
  const teamIds = useMemo(() => scopedTeamIds(depth, employees), [depth, employees]);
  const inScope = (hmId: string | null | undefined) => {
    if (!hmId) return false;
    const eid = mockEmpId(hmId);
    return teamIds.has(eid) || eid === MANAGER_ID;
  };
  const scopedJobs = useMemo(() => {
    if (!hasLive) return [];
    const mine = liveJobs!.filter((j) => inScope(j.hiring_manager_id));
    return mine.length > 0 ? mine : liveJobs!;
  }, [hasLive, liveJobs, teamIds]);
  const scopedApps = useMemo(() => {
    const apps = liveApps ?? [];
    const mine = apps.filter((a) => inScope(a.job_hiring_manager_id));
    return mine.length > 0 ? mine : apps;
  }, [liveApps, teamIds]);

  const liveOpenCount = scopedJobs.filter((j) => j.status !== 'filled' && j.status !== 'closed').length;
  const liveTotalApps = scopedJobs.reduce((s, j) => s + (j.applications_count ?? 0), 0);
  const liveFilledCount = scopedJobs.filter((j) => j.status === 'filled').length;
  const pipeByStage = scopedApps.reduce((acc, a) => { acc[a.stage] = (acc[a.stage] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const pipeStages = Object.entries(pipeByStage).sort((a, b) => b[1] - a[1]);

  return (
    <div className="animate-fade-up space-y-5">
      <RecruitmentSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Recrutement & intégration</h1>
        {hasLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>
        )}
      </div>

      <Card>
        <CardHeader title="Mes demandes de recrutement" action={<Briefcase size={16} className="text-ink-400" />} />
        {hasLive ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface2 px-3 py-3"><p className="mono text-2xl font-semibold text-ink">{liveOpenCount}</p><p className="text-[11px] font-medium text-ink-500">Postes ouverts</p></div>
            <div className="rounded-xl bg-surface2 px-3 py-3"><p className="mono text-2xl font-semibold text-ink">{liveTotalApps}</p><p className="text-[11px] font-medium text-ink-500">Candidatures reçues</p></div>
            <div className="rounded-xl bg-ok/[0.07] px-3 py-3"><p className="mono text-2xl font-semibold text-ok">{liveFilledCount}</p><p className="text-[11px] font-medium text-ink-500">Pourvues récemment</p></div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-surface2 px-3 py-3"><p className="mono text-2xl font-semibold text-ink">{instruction}</p><p className="text-[11px] font-medium text-ink-500">En instruction RH</p></div>
              <div className="rounded-xl bg-surface2 px-3 py-3"><p className="mono text-2xl font-semibold text-ink">{sourcing}</p><p className="text-[11px] font-medium text-ink-500">Validées / en sourcing</p></div>
              <div className="rounded-xl bg-ok/[0.07] px-3 py-3"><p className="mono text-2xl font-semibold text-ok">{filled.length}</p><p className="text-[11px] font-medium text-ink-500">Pourvues récemment</p></div>
            </div>
            {filled[0]?.filledBy && <p className="mt-2 text-[12px] font-medium text-ink-500">Dernière : {filled[0].filledBy}</p>}
          </>
        )}
        <div className="mt-3"><Link to="/team/recrutement/besoins"><Button variant="outline" size="sm"><Plus size={14} /> Nouvelle demande</Button></Link></div>
      </Card>

      <Card>
        <CardHeader title={hasLive ? 'Pipeline candidats' : `Mes candidats — ${pipe.position}`} action={<Users size={16} className="text-ink-400" />} />
        {hasLive ? (
          <div className="flex flex-wrap gap-2 text-[12px] font-medium text-ink-700">
            {pipeStages.length > 0 ? pipeStages.map(([stage, n]) => (
              <StatusPill key={stage} tone="neutral" dot={false}>{n} · {stage}</StatusPill>
            )) : <span className="text-[12px] font-medium text-ink-400">Aucune candidature en pipeline.</span>}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 text-[12px] font-medium text-ink-700">
            <StatusPill tone="neutral" dot={false}>{pipe.candidates.filter((c) => c.stage === 'preselected').length} en présélection RH</StatusPill>
            <StatusPill tone="info" dot={false}>{pipe.candidates.filter((c) => c.stage === 'tomeet').length} à rencontrer</StatusPill>
            <StatusPill tone="amber" dot={false}>{pipe.candidates.filter((c) => c.awaitingDecision).length} en attente de ma décision</StatusPill>
          </div>
        )}
        <div className="mt-3"><Link to="/team/recrutement/candidats"><Button variant="ghost" size="sm">Voir le pipeline <ArrowRight size={14} /></Button></Link></div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Mes nouveaux entrants" action={<UserCheck size={16} className="text-ink-400" />} />
          {news.length === 0 ? <p className="py-3 text-center text-sm font-medium text-ink-400">Aucun nouvel entrant.</p> : (
            <div className="space-y-2">
              {news.map((n) => (
                <div key={n.emp.id} className="rounded-xl bg-surface2 px-3 py-2.5">
                  <p className="text-sm font-semibold text-ink">{employeeName(n.emp)} — J+{n.jPlus}, onboarding {n.progress}%</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-deep"><Zap size={12} /> Premier 1:1 à programmer</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3"><Link to="/team/recrutement/integration"><Button variant="ghost" size="sm">Voir intégration <ArrowRight size={14} /></Button></Link></div>
        </Card>

        <Card>
          <CardHeader title="Mes sortants" action={<LogOut size={16} className="text-ink-400" />} />
          {lvs.length === 0 ? <p className="py-3 text-center text-sm font-medium text-ink-400">Aucun départ en cours.</p> : (
            <div className="space-y-2">
              {lvs.map((l) => (
                <div key={l.emp.id} className="rounded-xl bg-surface2 px-3 py-2.5">
                  <p className="text-sm font-semibold text-ink">{employeeName(l.emp)} — départ {frDate(l.departDate)}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-deep"><Zap size={12} /> Compétences à transférer</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3"><Link to="/team/recrutement/sortants"><Button variant="ghost" size="sm">Voir transition <ArrowRight size={14} /></Button></Link></div>
        </Card>
      </div>
    </div>
  );
}
