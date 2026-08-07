import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gauge, ThumbsUp, Target, ArrowRight, Sparkles, Wifi, Award } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { PracticeSubNav } from '../../components/mss/PracticeSubNav';
import { useSurface } from '../../store/useSurface';
import { PRACTICE_OVERVIEW as o } from '../../lib/mss/practice';
import { isBackendConfigured, empUuid, useManagerOwnPractice } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const EVAL_STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon', in_progress: 'En cours', submitted: 'Soumise', validated: 'Validée', closed: 'Clôturée',
};

export function PracticeOverviewPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { data: ctx } = useSessionContext();
  const { data: live } = useManagerOwnPractice(ctx?.tenantId, ctx?.employeeId ?? empUuid('e1'));
  const showLive = isBackendConfigured && live && (live.evaluation !== null || live.trainings.length > 0);

  return (
    <div className="animate-fade-up space-y-5">
      <PracticeSubNav />
      <h1 className="text-2xl font-semibold text-ink">Ma pratique managériale</h1>

      {showLive && (
        <Card>
          <CardHeader
            title="Mon développement (live)"
            subtitle="Ma propre évaluation et mes formations"
            action={<Wifi size={13} className="text-emerald-500" />}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface2 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Ma note finale</p>
              <p className="mono mt-1 text-2xl font-semibold text-ink">{live!.evaluation?.note_finale != null ? `${live!.evaluation.note_finale}/5` : '—'}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Ma classe</p>
              <div className="mt-1.5 flex items-center gap-2">
                {live!.evaluation?.classe ? (
                  <StatusPill tone="amber" dot={false}><Award size={12} /> {live!.evaluation.classe}</StatusPill>
                ) : <span className="mono text-2xl font-semibold text-ink-400">—</span>}
                {live!.evaluation?.status && <span className="text-[11px] font-medium text-ink-400">{EVAL_STATUS_LABEL[live!.evaluation.status] ?? live!.evaluation.status}</span>}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface2 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Mes formations</p>
              <p className="mono mt-1 text-2xl font-semibold text-ink">{live!.trainings.length}</p>
              <p className="text-[11px] text-ink-400">inscription(s)</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Efficacité managériale</p><p className="mono mt-1 text-2xl font-semibold text-ink">{o.effectiveness}/5</p><p className="text-[11px] text-ink-400">Feedback 360 + KPI équipe</p></Card>
        <Card><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Régularité rituels</p><p className="mono mt-1 text-2xl font-semibold text-ink">{o.ritualRegularity}%</p></Card>
        <Card><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Couverture 1:1 (mois)</p><p className="mono mt-1 text-2xl font-semibold text-ink">{o.oneOnOneCoverage}%</p></Card>
        <Card><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Reconnaissances (trim.)</p><p className="mono mt-1 text-2xl font-semibold text-ink">{o.recognitionsSent}<span className="text-base text-ink-400">/{o.recognitionsTarget}</span></p></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Mes points forts" action={<ThumbsUp size={16} className="text-ink-400" />} />
          <ul className="space-y-1.5 text-sm font-medium text-ink-700">
            {o.strengths.map((s) => <li key={s} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ok" /> {s}</li>)}
          </ul>
        </Card>
        <Card className="glass-amber">
          <CardHeader title="Mes axes de progrès" action={<Target size={16} className="text-amber-deep" />} />
          <ul className="space-y-1.5 text-sm font-medium text-ink-700">
            {o.improvements.map((s) => <li key={s} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-deep" /> {s}</li>)}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Mon développement manager" action={<Sparkles size={16} className="text-ink-400" />} />
        <p className="text-sm font-medium text-ink-700">{o.managerPath}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/team/ma-pratique/formations"><Button variant="ghost" size="sm">Voir parcours recommandés <ArrowRight size={14} /></Button></Link>
          <Link to="/team/ma-pratique/efficacite"><Button variant="ghost" size="sm"><Gauge size={14} /> Mon score d’efficacité</Button></Link>
        </div>
      </Card>
    </div>
  );
}
