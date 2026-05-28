import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Route, Network, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { DevelopmentSubNav } from '../../components/mss/DevelopmentSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { skillsMatrix, skillCoverage, trainingValidations, teamTrainings, mobilityApplications, mobilityMatches, successionPlan, memberWishes, DEV_BUDGET, budgetAvailable, fmtFCFA } from '../../lib/mss/dev';

function Bar({ pct, tone = 'info' }: { pct: number; tone?: 'info' | 'ok' | 'warn' | 'danger' }) {
  const c = tone === 'ok' ? 'bg-ok' : tone === 'warn' ? 'bg-warn' : tone === 'danger' ? 'bg-danger' : 'bg-info';
  return <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]"><div className={`h-full rounded-full ${c}`} style={{ width: `${Math.min(100, pct)}%` }} /></div>;
}

export function TeamDevDashboardPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);

  const matrix = skillsMatrix(team);
  const allRows = matrix.flatMap((g) => g.rows);
  const avgCoverage = allRows.length ? Math.round(allRows.reduce((s, r) => s + skillCoverage(r, team), 0) / allRows.length) : 0;
  const gaps = allRows.filter((r) => skillCoverage(r, team) < 70);

  const toValidate = trainingValidations(team);
  const trainings = teamTrainings(team);
  const ongoing = trainings.filter((t) => t.status === 'inprogress');

  const mob = mobilityApplications(team);
  const matches = mobilityMatches(team);

  const succ = successionPlan(team);
  const covered = succ.filter((p) => p.successors.length >= p.needed).length;

  const wishes = team.flatMap(memberWishes);
  const consumedPct = Math.round((DEV_BUDGET.consumed / DEV_BUDGET.allocated) * 100);

  return (
    <div className="animate-fade-up space-y-5">
      <DevelopmentSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Développement équipe</h1>
        <p className="text-sm font-medium text-ink-500">{team.length} collaborateur(s) · montée en compétences, formations, mobilité, succession</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Compétences" subtitle={`Couverture moyenne vs cible : ${avgCoverage}%`} action={<Link to="/team/developpement/competences"><Button variant="outline" size="sm">Matrice <ArrowRight size={14} /></Button></Link>} />
          <Bar pct={avgCoverage} tone={avgCoverage >= 80 ? 'ok' : 'warn'} />
          {gaps.length > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-warn/[0.06] px-3 py-2 text-[12px] font-medium text-ink-700">
              <AlertTriangle size={13} className="text-warn" /> {gaps.length} écart(s) critique(s) : {gaps.map((g) => g.name).join(', ')}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Formations" subtitle={`Budget consommé ${consumedPct}%`} action={<Link to="/team/developpement/formations-en-cours"><Button variant="outline" size="sm">Détails <ArrowRight size={14} /></Button></Link>} />
          <div className="space-y-2 text-[12px] font-medium text-ink-600">
            <p className="flex items-center justify-between">À valider <StatusPill tone={toValidate.length > 0 ? 'warn' : 'ok'} dot={false}>{toValidate.length}</StatusPill></p>
            <p className="flex items-center justify-between">En cours <span className="mono text-ink">{ongoing.length}</span></p>
            <div className="pt-1"><Bar pct={consumedPct} tone="info" /><p className="mt-1 text-[11px] text-ink-400">{fmtFCFA(DEV_BUDGET.consumed)} / {fmtFCFA(DEV_BUDGET.allocated)} · dispo {fmtFCFA(budgetAvailable)}</p></div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Mobilité interne" action={<Route size={16} className="text-ink-400" />} />
          <div className="space-y-1.5 text-[12px] font-medium text-ink-600">
            <p className="flex items-center justify-between">Candidatures de mes N-1 <span className="mono text-ink">{mob.visible.length} + {mob.confidential} masquée(s)</span></p>
            <p className="flex items-center justify-between">Opportunités matching <span className="mono text-ink">{matches.length}</span></p>
            <Link to="/team/developpement/mobilite" className="inline-flex items-center gap-1 text-info hover:underline">Voir la mobilité <ArrowRight size={12} /></Link>
          </div>
        </Card>

        <Card>
          <CardHeader title="Succession" subtitle={`Postes critiques couverts : ${covered}/${succ.length}`} action={<Link to="/team/developpement/succession"><Button variant="outline" size="sm"><Network size={14} /> Plan</Button></Link>} />
          <Bar pct={succ.length ? Math.round((covered / succ.length) * 100) : 0} tone={covered === succ.length ? 'ok' : 'warn'} />
          {succ.some((p) => p.successors.length < p.needed) && (
            <p className="mt-3 flex items-center gap-2 text-[12px] font-medium text-warn"><AlertTriangle size={13} /> Au moins un poste critique sous-couvert.</p>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Souhaits de développement (déclarés par mes N-1)" subtitle={`${wishes.length} souhait(s) visibles`} action={<Link to="/team/developpement/souhaits"><Button variant="ghost" size="sm">Voir <ArrowRight size={13} /></Button></Link>} />
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(wishes.reduce<Record<string, number>>((acc, w) => { acc[w.theme] = (acc[w.theme] ?? 0) + 1; return acc; }, {}))
            .sort((a, b) => b[1] - a[1]).slice(0, 6)
            .map(([theme, n]) => <span key={theme} className="rounded-lg bg-info/[0.08] px-2 py-1 text-[11px] font-semibold text-info">{theme} ({n})</span>)}
        </div>
      </Card>

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Sparkles size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Proph3t croise écarts de compétences, souhaits déclarés et budget pour proposer un plan de développement — vous arbitrez avant soumission à la RH. Les souhaits privés des N-1 et les successeurs identifiés ne sont jamais révélés aux intéressés par le système.</p>
      </Card>
    </div>
  );
}
