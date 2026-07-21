import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Receipt, Inbox, CalendarX, Mail, HeartPulse, Award, ArrowRight, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { DailySubNav } from '../../components/mss/DailySubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { useManagerBadges } from '../../lib/mss/badges';
import { scopedTeam } from '../../lib/mss/scope';
import { climateMetrics, climateSignals, managerMail, schedulingConflicts } from '../../lib/mss/daily';
import { isBackendConfigured, useTeamExpenseClaims, useTeamServiceRequests } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

export function TeamDailyDashboardPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const badges = useManagerBadges();
  const m = climateMetrics(team);
  const signals = climateSignals().filter((s) => !s.treated).length;
  const mail = managerMail();
  const unreadMail = mail.filter((x) => !x.read).length;
  const actionMail = mail.filter((x) => x.actionRequired).length;
  const conflicts = schedulingConflicts(team).length;
  const enough = team.length >= 5;

  const { data: ctx } = useSessionContext();
  const { data: liveExpenses } = useTeamExpenseClaims(ctx?.tenantId);
  const { data: liveRequests } = useTeamServiceRequests(ctx?.tenantId);
  const hasLive = isBackendConfigured && Boolean(ctx?.tenantId);

  const expensesCount = hasLive ? (liveExpenses ?? []).length : badges.expensesToValidate;
  const requestsCount = hasLive ? (liveRequests ?? []).filter(r => r.status === 'pending').length : badges.teamRequests;

  const Row = ({ to, icon: Icon, label, count, tone }: { to: string; icon: typeof Zap; label: string; count: number; tone: 'amber' | 'info' | 'ok' }) => (
    <Link to={to} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2.5 transition-colors hover:bg-ink/[0.04]">
      <span className="flex items-center gap-2 text-sm font-semibold text-ink"><Icon size={15} className="text-ink-400" /> {label}</span>
      <span className="flex items-center gap-2"><StatusPill tone={count > 0 ? tone : 'ok'} dot={false}>{count}</StatusPill><ArrowRight size={14} className="text-ink-300" /></span>
    </Link>
  );

  return (
    <div className="animate-fade-up space-y-5">
      <DailySubNav />
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-ink">Vie quotidienne managériale</h1>
        {hasLive && <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>}
      </div>

      <Card className="glass-amber">
        <CardHeader title="À valider maintenant" action={<Zap size={16} className="text-amber-deep" />} />
        <div className="space-y-2">
          <Row to="/team/quotidien/ndf-a-valider" icon={Receipt} label="Notes de frais" count={expensesCount} tone="amber" />
          <Row to="/team/quotidien/demandes-equipe" icon={Inbox} label="Demandes équipe" count={requestsCount} tone="amber" />
          <Row to="/team/quotidien/conflits-planning" icon={CalendarX} label="Conflits planning" count={conflicts} tone="amber" />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Courrier managérial" action={<Mail size={16} className="text-ink-400" />} />
          <p className="text-sm font-medium text-ink-700">{unreadMail} non lu(s){actionMail > 0 ? ` · ${actionMail} action(s) requise(s)` : ''}.</p>
          <div className="mt-3"><Link to="/team/quotidien/courrier-manager"><Button variant="ghost" size="sm">Ouvrir le courrier <ArrowRight size={14} /></Button></Link></div>
        </Card>

        <Card>
          <CardHeader title="Climat équipe" action={<HeartPulse size={16} className="text-ink-400" />} />
          {enough ? (
            <p className="text-sm font-medium text-ink-700">Engagement {m.engagement}/10 (▲ {m.engagementDelta}) · {signals} signalement(s) en cours · participation {m.participation}%.</p>
          ) : (
            <p className="text-sm font-medium text-ink-400">Indicateurs masqués (périmètre &lt; 5 personnes).</p>
          )}
          <div className="mt-3"><Link to="/team/quotidien/climat"><Button variant="ghost" size="sm">Voir le climat <ArrowRight size={14} /></Button></Link></div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Reconnaissance" action={<Award size={16} className="text-ink-400" />} />
        <p className="text-sm font-medium text-ink-700">Valorisez un membre de votre équipe en quelques secondes.</p>
        <div className="mt-3"><Link to="/team/quotidien/reconnaissance"><Button size="sm"><Award size={14} /> Envoyer une reconnaissance</Button></Link></div>
      </Card>
    </div>
  );
}
