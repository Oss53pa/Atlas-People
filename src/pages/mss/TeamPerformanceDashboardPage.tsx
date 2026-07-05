import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Target, Radar, Award, ArrowRight, AlertTriangle, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { PerformanceSubNav } from '../../components/mss/PerformanceSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam, scopedTeamIds } from '../../lib/mss/scope';
import { memberOkr, memberEval, memberOneOnOne, member360, memberRecognition, OKR_STATUS_META, type OkrStatus } from '../../lib/mss/perf';
import { employeeName } from '../../data/mock';
import { isBackendConfigured, useTeamEvaluations, useTeamObjectives } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';
import { mockEmpId } from '../../lib/m1/roster';

function Bar({ pct, tone = 'info' }: { pct: number; tone?: 'info' | 'ok' | 'warn' | 'danger' }) {
  const c = tone === 'ok' ? 'bg-ok' : tone === 'warn' ? 'bg-warn' : tone === 'danger' ? 'bg-danger' : 'bg-info';
  return <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]"><div className={`h-full rounded-full ${c}`} style={{ width: `${Math.min(100, pct)}%` }} /></div>;
}

export function TeamPerformanceDashboardPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const teamIds = useMemo(() => scopedTeamIds(depth, employees), [depth, employees]);

  const { data: ctx } = useSessionContext();
  const { data: liveEvals } = useTeamEvaluations(ctx?.tenantId ?? undefined);
  const { data: liveObjectives } = useTeamObjectives(ctx?.tenantId ?? undefined);

  // KPIs live (Supabase) — dérivés des évaluations & objectifs d'équipe, périmètre managérial.
  const live = useMemo(() => {
    if (!isBackendConfigured || !liveEvals || liveEvals.length === 0) return null;
    const scopedEvals = liveEvals.filter((r) => teamIds.has(mockEmpId(r.employee_id)));
    if (scopedEvals.length === 0) return null;
    const notes = scopedEvals.map((r) => r.note_finale).filter((n): n is number => n != null);
    const avgNote = notes.length ? notes.reduce((s, n) => s + n, 0) / notes.length : 0;
    const CLASSES = ['A', 'B', 'C', 'D', 'E'];
    const classDist = CLASSES.map((c) => ({ c, n: scopedEvals.filter((r) => r.classe === c).length }));
    const classified = classDist.reduce((s, d) => s + d.n, 0);
    const DONE = ['calibrated', 'entretien_pending', 'signed', 'closed'];
    const evaluated = scopedEvals.filter((r) => DONE.includes(r.status)).length;
    const pending = scopedEvals.length - evaluated;
    const scopedObj = (liveObjectives ?? []).filter((r) => r.owner_id == null || teamIds.has(mockEmpId(r.owner_id)));
    const OBJ_DONE = ['done', 'achieved', 'closed', 'validated'];
    const objDone = scopedObj.filter((r) => OBJ_DONE.includes(r.status)).length;
    return { total: scopedEvals.length, avgNote, classDist, classified, evaluated, pending, objTotal: scopedObj.length, objDone };
  }, [liveEvals, liveObjectives, teamIds]);

  const okrs = team.map(memberOkr);
  const okrAvg = okrs.length ? Math.round(okrs.reduce((s, o) => s + o.progress, 0) / okrs.length) : 0;
  const dist = (['achieved', 'ahead', 'ontrack', 'atrisk', 'low'] as OkrStatus[]).map((st) => ({
    st, n: okrs.flatMap((o) => o.objectives).filter((o) => o.status === st).length,
  }));
  const totalObj = dist.reduce((s, d) => s + d.n, 0) || 1;

  const evals = team.map((e) => ({ e, ev: memberEval(e) }));
  const autoEvalCount = evals.filter((x) => x.ev.autoEval).length;
  const draftedCount = evals.filter((x) => x.ev.managerDrafted).length;
  const signedCount = evals.filter((x) => x.ev.signed).length;
  const toWrite = evals.filter((x) => x.ev.autoEval && !x.ev.managerDrafted);

  const oneOnOnes = team.map((e) => ({ e, o: memberOneOnOne(e) }));
  const overdue = oneOnOnes.filter((x) => x.o.overdue);
  const regularity = oneOnOnes.length ? Math.round(((oneOnOnes.length - overdue.length) / oneOnOnes.length) * 100) : 0;

  const f360 = team.map(member360);
  const f360Received = f360.reduce((s, f) => s + f.received, 0);
  const recog = team.map(memberRecognition);
  const recogSent = recog.reduce((s, r) => s + r.count, 0);
  const covered = recog.filter((r) => r.count > 0).length;

  return (
    <div className="animate-fade-up space-y-5">
      <PerformanceSubNav />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-info">Campagne en cours · Évaluation annuelle 2026</p>
          <h1 className="text-2xl font-semibold text-ink">Performance de l'équipe</h1>
        </div>
        {live && (
          <StatusPill tone="ok" dot={false}><span className="inline-flex items-center gap-1"><Wifi size={12} /> Live DB</span></StatusPill>
        )}
      </div>

      {live && (
        <Card>
          <CardHeader title="Synthèse d'équipe (live)" subtitle={`${live.total} évaluation(s) · périmètre confidentiel`} action={<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Supabase</span>} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-surface2 px-3 py-2.5">
              <p className="mono text-xl font-semibold text-ink">{live.avgNote.toFixed(1)}<span className="text-[12px] font-medium text-ink-400">/5</span></p>
              <p className="text-[11px] font-medium text-ink-500">Note finale moyenne</p>
            </div>
            <div className="rounded-xl bg-surface2 px-3 py-2.5">
              <p className="mono text-xl font-semibold text-ok">{live.evaluated}</p>
              <p className="text-[11px] font-medium text-ink-500">Évaluées (calibrées+)</p>
            </div>
            <div className="rounded-xl bg-surface2 px-3 py-2.5">
              <p className="mono text-xl font-semibold text-warn">{live.pending}</p>
              <p className="text-[11px] font-medium text-ink-500">En cours / à traiter</p>
            </div>
            <div className="rounded-xl bg-surface2 px-3 py-2.5">
              <p className="mono text-xl font-semibold text-info">{live.objDone}<span className="text-[12px] font-medium text-ink-400">/{live.objTotal}</span></p>
              <p className="text-[11px] font-medium text-ink-500">Objectifs finalisés</p>
            </div>
          </div>
          {live.classified > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Distribution des classes (A–E)</p>
              <div className="space-y-1.5">
                {live.classDist.map((d) => (
                  <div key={d.c} className="flex items-center gap-2 text-[12px] font-medium">
                    <span className="w-4 text-ink-500">{d.c}</span>
                    <div className="flex-1"><Bar pct={Math.round((d.n / live.classified) * 100)} tone={d.c === 'A' || d.c === 'B' ? 'ok' : d.c === 'C' ? 'info' : d.c === 'D' ? 'warn' : 'danger'} /></div>
                    <span className="mono w-6 text-right text-ink-400">{d.n}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Objectifs (OKR) — 2026" subtitle={`Avancement global ${okrAvg}%`} action={<Link to="/team/performance/objectifs"><Button variant="outline" size="sm">Cascade <ArrowRight size={14} /></Button></Link>} />
          <Bar pct={okrAvg} tone={okrAvg >= 60 ? 'ok' : 'info'} />
          <div className="mt-3 space-y-1.5">
            {dist.map((d) => (
              <div key={d.st} className="flex items-center gap-2 text-[12px] font-medium">
                <span className="w-20 text-ink-500">{OKR_STATUS_META[d.st].label}</span>
                <div className="flex-1"><Bar pct={Math.round((d.n / totalObj) * 100)} tone={OKR_STATUS_META[d.st].tone} /></div>
                <span className="mono w-8 text-right text-ink-400">{Math.round((d.n / totalObj) * 100)}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Évaluations annuelles" subtitle="Échéance 30 juin" action={<Link to="/team/performance/evaluations"><Button variant="outline" size="sm">Piloter <ArrowRight size={14} /></Button></Link>} />
          <div className="space-y-2.5">
            {[['Auto-évaluations reçues', autoEvalCount], ['Évaluations rédigées', draftedCount], ['Évaluations signées', signedCount]].map(([label, n]) => (
              <div key={label as string}>
                <div className="mb-1 flex items-center justify-between text-[12px] font-medium text-ink-500"><span>{label}</span><span className="mono text-ink">{n as number}/{team.length}</span></div>
                <Bar pct={Math.round(((n as number) / team.length) * 100)} tone="info" />
              </div>
            ))}
          </div>
          {toWrite.length > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-warn/[0.06] px-3 py-2 text-[12px] font-medium text-ink-700">
              <AlertTriangle size={13} className="text-warn" /> {toWrite.length} évaluation(s) à rédiger (auto-éval disponible)
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Mes 1:1" subtitle={`Régularité ${regularity}% · cadence hebdomadaire`} action={<Link to="/team/performance/1-1"><Button variant="outline" size="sm">Voir <ArrowRight size={14} /></Button></Link>} />
          {overdue.length > 0 ? (
            <div className="space-y-1.5">
              {overdue.map((x) => (
                <div key={x.e.id} className="flex items-center justify-between rounded-xl bg-warn/[0.06] px-3 py-2 text-[12px] font-medium">
                  <span className="font-semibold text-ink">{employeeName(x.e)}</span>
                  <StatusPill tone="warn" dot={false}>En retard · J-{x.o.daysSince}</StatusPill>
                </div>
              ))}
            </div>
          ) : <p className="text-sm font-medium text-ink-400">Tous vos 1:1 sont à jour.</p>}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Feedback 360°" action={<Radar size={16} className="text-ink-400" />} />
            <p className="text-sm font-medium text-ink-500">{team.length} demandes lancées · <span className="font-bold text-ink">{f360Received}</span> retours reçus</p>
          </Card>
          <Card>
            <CardHeader title="Reconnaissance" subtitle={`Couverture ${covered}/${team.length} ce trimestre`} action={<Link to="/team/performance/reconnaissance"><Button variant="outline" size="sm"><Award size={14} /> Envoyer</Button></Link>} />
            <p className="text-sm font-medium text-ink-500"><span className="font-bold text-ink">{recogSent}</span> reconnaissance(s) envoyée(s) · cible 1/membre/trimestre</p>
          </Card>
        </div>
      </div>

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Target size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Proph3t peut proposer une décomposition d'objectifs, des sujets de 1:1 et une distribution de calibration — vous restez décideur. Aucun montant salarial n'est saisi ici : les recommandations sont en Oui/Non, la RH décide.</p>
      </Card>
    </div>
  );
}
