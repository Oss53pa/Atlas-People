import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, CalendarClock, Mail, TrendingUp, Clock, Gift, ArrowUpRight,
  Sparkles, Target, AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { M5LiveBanner } from '../../components/recrut/M5LiveBanner';
import {
  JOBS, APPLICATIONS, INTERVIEWS, OFFERS, ACTIVITY, REFERRALS, SOURCING_CHANNELS,
  candidateById, jobById, stageMeta, kpis,
} from '../../lib/m5/mock';
import { JOB_STATUS_META, ACTIVE_STAGES, SLA } from '../../lib/m5/referentiels';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';
import { cn } from '../../lib/cn';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

export function CockpitRecrutPage() {
  const k = useMemo(() => kpis(), []);
  const openJobs = JOBS.filter((j) => j.status === 'open');

  // Entretiens jour
  const todayIv = useMemo(() => {
    const today = '2026-05-30';
    return INTERVIEWS.filter((i) => i.scheduledAt.slice(0, 10) === today && i.status === 'planned')
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }, []);

  // Offres en attente
  const pendingOffers = OFFERS.filter((o) => o.status === 'sent' || o.status === 'negotiating');

  // SLA breaches
  const slaBreaches = APPLICATIONS.filter((a) => {
    if (!ACTIVE_STAGES.includes(a.stage)) return false;
    const days = Math.round((new Date('2026-05-30').getTime() - new Date(a.stageEnteredAt).getTime()) / 86_400_000);
    return (a.stage === 'screening' && days > SLA.screeningDays) || (a.stage === 'offer' && days > SLA.offerToHireDays);
  });

  // Top sources by hires
  const topChannels = [...SOURCING_CHANNELS]
    .filter((c) => c.applications12m > 0)
    .sort((a, b) => b.hires12m - a.hires12m).slice(0, 5);

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />
      <M5LiveBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Recrutement</h1>
          <p className="text-sm font-medium text-ink-500">ATS Atlas · {openJobs.length} postes ouverts · pipeline · cooptation · intégration M6</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/recrutement/postes"><Button variant="outline" size="sm"><Briefcase size={14} /> Nouveau poste</Button></Link>
          <Link to="/recrutement/candidatures"><Button size="sm"><Users size={14} /> Pipeline</Button></Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Postes ouverts" value={String(k.postesOuverts)} unit="à pourvoir" icon={Briefcase} />
        <StatCard label="Candidatures actives" value={String(k.candidaturesEnCours)} unit="en pipeline" icon={Users} />
        <StatCard label="Entretiens 7 j" value={String(k.entretiensSemaine)} unit="planifiés" icon={CalendarClock} tone="amber" />
        <StatCard label="Offres en attente" value={String(k.offresEnAttente)} unit="signature" icon={Mail} tone="amber" />
        <StatCard label="Embauches mois" value={String(k.embauchesMoisCourant)} unit="hires" icon={TrendingUp} />
        <StatCard label="Time-to-fill" value={`${k.timeToFillJoursMedian} j`} unit={`SLA ${SLA.totalTimeToFillDays} j`} icon={Clock} mono />
        <StatCard label="Taux acceptation" value={`${k.acceptanceRate} %`} unit="offres" icon={Target} />
        <StatCard label="Cost per hire" value={`${(k.costPerHire / 1000).toFixed(0)} k`} unit="FCFA" icon={TrendingUp} mono />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Postes ouverts */}
        <Card inset={false}>
          <div className="flex items-center justify-between p-5 pb-2">
            <CardHeader title="Postes en cours" subtitle={`${openJobs.length} ouverts · cliquer pour voir le pipeline`} className="mb-0" />
            <Link to="/recrutement/postes" className="text-[12px] font-semibold text-amber-deep hover:underline">Tous les postes →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 text-left">Réf.</th>
                <th className="px-3 py-2 text-left">Poste</th>
                <th className="px-3 py-2 text-center">Candidatures</th>
                <th className="px-3 py-2 text-left">Ouvert depuis</th>
                <th className="px-3 py-2 text-center">Statut</th>
                <th className="px-3 py-2 text-right" />
              </tr></thead>
              <tbody className="divide-y divide-line">
                {openJobs.map((j) => {
                  const meta = JOB_STATUS_META[j.status];
                  const days = Math.round((new Date('2026-05-30').getTime() - new Date(j.openedAt).getTime()) / 86_400_000);
                  return (
                    <tr key={j.id} className="hover:bg-amber/[0.03]">
                      <td className="px-4 py-2 mono text-[11px] font-bold text-amber-deep">{j.ref}</td>
                      <td className="px-3 py-2"><p className="text-[13px] font-semibold text-ink">{j.title}</p><p className="text-[11px] font-medium text-ink-500">{j.department} · {j.location}</p></td>
                      <td className="px-3 py-2 text-center"><span className="mono text-[12px] font-bold text-ink">{j.applicationsCount}</span></td>
                      <td className="px-3 py-2 text-[12px] font-medium text-ink-700">{days} jours</td>
                      <td className="px-3 py-2 text-center"><StatusPill tone={meta.tone} dot={false}>{meta.label}</StatusPill></td>
                      <td className="px-3 py-2 text-right"><Link to={`/recrutement/postes/${j.id}`}><Button variant="ghost" size="sm">Pipeline <ArrowUpRight size={12} /></Button></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Aujourd'hui & alertes */}
        <div className="space-y-3">
          <Card>
            <CardHeader title="Entretiens du jour" subtitle="30 mai 2026" action={<CalendarClock size={16} className="text-amber-deep" />} />
            {todayIv.length === 0 ? <p className="rounded-xl bg-surface2/40 px-3 py-3 text-center text-[12px] font-medium text-ink-400">Aucun entretien aujourd'hui.</p>
              : <div className="space-y-1.5">
                  {todayIv.map((i) => {
                    const ap = APPLICATIONS.find((a) => a.id === i.applicationId);
                    const cand = ap && candidateById(ap.candidateId);
                    const job = ap && jobById(ap.jobId);
                    if (!cand || !job) return null;
                    return (
                      <Link key={i.id} to="/recrutement/entretiens" className="flex items-center gap-2 rounded-xl bg-surface2/40 px-3 py-2 hover:bg-amber/[0.06]">
                        <span className="mono shrink-0 text-[11px] font-bold text-amber-deep">{new Date(i.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-ink">{cand.firstName} {cand.lastName}</p>
                          <p className="truncate text-[10px] font-medium text-ink-500">{job.title.slice(0, 30)} · {i.type}</p>
                        </div>
                        <StatusPill tone="amber" dot={false}>{i.mode}</StatusPill>
                      </Link>
                    );
                  })}
                </div>}
          </Card>

          {pendingOffers.length > 0 && (
            <Card className="border-amber/25">
              <CardHeader title="Offres en attente" subtitle={`${pendingOffers.length} offre(s) · validité contrôlée`} action={<Mail size={16} className="text-amber-deep" />} />
              <div className="space-y-1.5">
                {pendingOffers.map((o) => {
                  const ap = APPLICATIONS.find((a) => a.id === o.applicationId);
                  const cand = ap && candidateById(ap.candidateId);
                  if (!cand) return null;
                  return (
                    <Link key={o.id} to={`/recrutement/offres`} className="flex items-center gap-2 rounded-xl bg-surface2/40 px-3 py-2 hover:bg-amber/[0.06]">
                      <Avatar name={`${cand.firstName} ${cand.lastName}`} size="xs" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-ink">{cand.firstName} {cand.lastName}</p>
                        <p className="truncate text-[10px] font-medium text-ink-500">{fmt(o.baseSalary)} · valide jusqu'au {o.validUntil}</p>
                      </div>
                      <StatusPill tone={o.status === 'negotiating' ? 'warn' : 'amber'} dot={false}>{o.status}</StatusPill>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}

          {slaBreaches.length > 0 && (
            <Card className="border-warn/25">
              <CardHeader title="SLA dépassés" subtitle="Screening ou offre trop long" action={<AlertTriangle size={16} className="text-warn" />} />
              <div className="space-y-1">
                {slaBreaches.slice(0, 4).map((a) => {
                  const cand = candidateById(a.candidateId)!;
                  return (
                    <div key={a.id} className="flex items-center gap-2 text-[11px] font-medium text-warn">
                      <AlertTriangle size={11} /> {cand.firstName} {cand.lastName} · {stageMeta(a.stage).label}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Activité récente */}
        <Card>
          <CardHeader title="Activité récente" subtitle="Mouvements pipeline · scorecards · offres" action={<Sparkles size={16} className="text-amber-deep" />} />
          <div className="space-y-1.5">
            {ACTIVITY.slice(0, 8).map((e) => (
              <div key={e.id} className="rounded-lg bg-surface2/40 px-3 py-2">
                <p className="text-[12px] font-semibold text-ink">{e.detail}</p>
                <p className="text-[10px] font-medium text-ink-400">{e.actor} · {e.at.slice(0, 16).replace('T', ' ')}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Top canaux */}
        <Card>
          <CardHeader title="Top canaux 12 mois" subtitle="ROI sources · hires obtenus" action={<Link to="/recrutement/sourcing" className="text-[11px] font-semibold text-amber-deep hover:underline">Tous →</Link>} />
          <table className="w-full text-sm">
            <thead><tr className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="py-1 text-left">Canal</th>
              <th className="py-1 text-right">Cand.</th>
              <th className="py-1 text-right">Hires</th>
              <th className="py-1 text-right">Coût/hire</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {topChannels.map((c) => (
                <tr key={c.code}>
                  <td className="py-1.5 text-[12px] font-semibold text-ink">{c.name}</td>
                  <td className="mono py-1.5 text-right text-[12px] text-ink-700">{c.applications12m}</td>
                  <td className="mono py-1.5 text-right text-[12px] font-bold text-ok">{c.hires12m}</td>
                  <td className="mono py-1.5 text-right text-[12px] text-ink-700">{c.hires12m ? fmt(Math.round(c.cost12m / c.hires12m)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Cooptation */}
      <Card>
        <CardHeader title="Cooptation active" subtitle={`${REFERRALS.filter(r => r.status !== 'paid' && r.status !== 'rejected').length} candidats cooptés en cours · prime jusqu'à ${fmt(600_000)}`} action={<Gift size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {REFERRALS.slice(0, 4).map((r) => {
            const cand = candidateById(r.candidateId)!;
            const job = jobById(r.jobId)!;
            return (
              <div key={r.id} className="rounded-xl bg-surface2/40 px-3 py-2">
                <p className="text-[12px] font-semibold text-ink">{cand.firstName} {cand.lastName} <span className="ml-2 text-[10px] font-medium text-ink-500">→ {job.title.slice(0, 35)}</span></p>
                <p className="text-[10px] font-medium text-ink-400">Prime {fmt(r.bonusAmount)} · <span className={cn(r.status === 'in_pipeline' && 'text-amber-deep', r.status === 'submitted' && 'text-info')}>{r.status}</span></p>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-[11px] font-medium text-ink-400">M5 Recrutement · ATS complet · pipeline 9 stages · {JOBS.length} postes · {APPLICATIONS.length} candidatures · {SOURCING_CHANNELS.length} canaux · RGPD conservation 2 ans · intégration M4 contrat & M6 onboarding.</p>
    </div>
  );
}
