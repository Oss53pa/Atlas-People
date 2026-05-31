import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Briefcase, MapPin, Calendar, Users, ArrowUpRight, Megaphone, Gift, Building2, DollarSign } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { applicationsByJob, candidateById, jobById, stageMeta } from '../../lib/m5/mock';
import { JOB_STATUS_META, JOB_LEVEL_LABEL, ACTIVE_STAGES } from '../../lib/m5/referentiels';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';
import { employeeById, employeeName } from '../../data/mock';
import type { ApplicationStage } from '../../lib/m5/types';
import { cn } from '../../lib/cn';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

export function PosteDetailPage() {
  const { id = '' } = useParams();
  const job = jobById(id);
  const apps = useMemo(() => applicationsByJob(id), [id]);

  if (!job) {
    return (
      <div className="animate-fade-up space-y-4">
        <RecrutSubNav />
        <Card><p className="py-10 text-center text-sm font-medium text-ink-400">Poste introuvable.</p></Card>
      </div>
    );
  }

  const stageMeta_ = JOB_STATUS_META[job.status];
  const hiringMgr = employeeById(job.hiringManager);
  const recruiter = employeeById(job.recruiter);
  const daysOpen = Math.round((new Date('2026-05-30').getTime() - new Date(job.openedAt).getTime()) / 86_400_000);
  const targetDays = job.targetCloseAt ? Math.round((new Date(job.targetCloseAt).getTime() - new Date(job.openedAt).getTime()) / 86_400_000) : 45;

  // Pipeline counts
  const counts = ACTIVE_STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = apps.filter((a) => a.stage === s).length; return acc;
  }, {});

  // Top candidates by score
  const top = [...apps]
    .filter((a) => ACTIVE_STAGES.includes(a.stage) && a.score)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 6);

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <Link to="/recrutement/postes" className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber-deep hover:underline">
        ← Tous les postes
      </Link>

      {/* HEADER POSTE */}
      <Card className="glass-amber">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-amber-deep" />
              <h1 className="text-xl font-bold text-ink">{job.title}</h1>
            </div>
            <p className="mono mt-0.5 text-[11px] font-medium text-ink-400">{job.ref}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-ink-700">
              <span><Building2 size={11} className="inline" /> {job.department}</span>
              <span><MapPin size={11} className="inline" /> {job.location}</span>
              <span>· {job.contractType} · {JOB_LEVEL_LABEL[job.level]}</span>
              <span>· <DollarSign size={11} className="inline" /> {fmt(job.salaryRangeMin)} – {fmt(job.salaryRangeMax)}</span>
              {job.remoteAllowed && <span>· Télétravail OK</span>}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusPill tone={stageMeta_.tone} dot>{stageMeta_.label}</StatusPill>
              <span className="rounded-md bg-ink/[0.06] px-2 py-0.5 text-[11px] font-medium text-ink-700"><Calendar size={10} className="inline" /> Ouvert depuis {daysOpen} j (cible {targetDays} j)</span>
              {hiringMgr && <span className="rounded-md bg-ink/[0.06] px-2 py-0.5 text-[11px] font-medium text-ink-700">HM · {employeeName(hiringMgr)}</span>}
              {recruiter && <span className="rounded-md bg-ink/[0.06] px-2 py-0.5 text-[11px] font-medium text-ink-700">Recruteur · {employeeName(recruiter)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Modifier</Button>
            <Button size="sm">+ Ajouter candidat</Button>
          </div>
        </div>
      </Card>

      {/* KPIs poste */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Candidatures" value={String(job.applicationsCount)} unit="reçues" icon={Users} />
        <StatCard label="Actives" value={String(apps.filter(a => ACTIVE_STAGES.includes(a.stage)).length)} unit="en pipeline" icon={Users} />
        <StatCard label="Embauchées" value={String(apps.filter(a => a.stage === 'hired').length)} unit="closed" icon={Briefcase} />
        <StatCard label="Cooptation" value={fmt(job.cooptationBonus ?? 0)} unit="prime" icon={Gift} mono />
      </div>

      {/* Pipeline visuel */}
      <Card>
        <CardHeader title="Pipeline" subtitle="Compteurs par étape · cliquer pour aller au Kanban" action={<Link to="/recrutement/candidatures" className="text-[11px] font-semibold text-amber-deep hover:underline">Kanban →</Link>} />
        <div className="flex flex-wrap gap-2">
          {ACTIVE_STAGES.map((s) => {
            const m = stageMeta(s);
            return (
              <div key={s} className="flex-1 min-w-[120px] rounded-xl border border-line bg-surface2/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{m.label}</p>
                <p className="mono mt-0.5 text-2xl font-bold text-amber-deep">{counts[s] ?? 0}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Description & exigences */}
        <Card>
          <CardHeader title="Description du poste" />
          <p className="text-[13px] font-medium text-ink-700">{job.summary}</p>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-amber-deep">Responsabilités</p>
          <ul className="mt-1 space-y-0.5 text-[12px] font-medium text-ink-700">
            {job.responsibilities.map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-amber-deep">Exigences</p>
          <ul className="mt-1 space-y-0.5 text-[12px] font-medium text-ink-700">
            {job.requirements.map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-amber-deep">Avantages</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {job.perks.map((p) => <span key={p} className="rounded-md bg-amber/12 px-2 py-1 text-[11px] font-semibold text-amber-deep">{p}</span>)}
          </div>
        </Card>

        {/* Top candidats */}
        <Card>
          <CardHeader title="Top candidats" subtitle="Triés par score · en pipeline actif" />
          <div className="space-y-1.5">
            {top.length === 0 ? <p className="py-2 text-center text-[12px] font-medium text-ink-400">Pas encore de candidats scorés.</p>
              : top.map((a) => {
                const cand = candidateById(a.candidateId);
                if (!cand) return null;
                const m = stageMeta(a.stage as ApplicationStage);
                return (
                  <Link key={a.id} to={`/recrutement/candidats/${cand.id}`} className="flex items-center gap-2 rounded-xl bg-surface2/40 px-3 py-2 hover:bg-amber/[0.06]">
                    <Avatar name={`${cand.firstName} ${cand.lastName}`} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-ink">{cand.firstName} {cand.lastName}</p>
                      <p className="truncate text-[10px] font-medium text-ink-400">{cand.currentRole} @ {cand.currentCompany}</p>
                    </div>
                    <span className="mono shrink-0 rounded-md bg-amber/12 px-1.5 py-0.5 text-[11px] font-bold text-amber-deep">{a.score}</span>
                    <StatusPill tone={m.tone} dot={false}>{m.label}</StatusPill>
                  </Link>
                );
              })}
          </div>
        </Card>
      </div>

      {/* Diffusion */}
      <Card>
        <CardHeader title="Diffusion" subtitle={`${job.publishedChannels.length} canaux actifs`} action={<Megaphone size={16} className="text-ink-400" />} />
        {job.publishedChannels.length === 0 ? <p className="rounded-xl bg-surface2 px-3 py-3 text-center text-[12px] font-medium text-ink-400">Aucun canal — poste en brouillon.</p>
          : <div className="flex flex-wrap gap-1.5">
              {job.publishedChannels.map((c) => <span key={c} className="rounded-md bg-info/10 px-2 py-1 text-[11px] font-semibold text-info">{c}</span>)}
            </div>}
      </Card>

      {/* Toutes candidatures */}
      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Toutes les candidatures" subtitle={`${apps.length} sur ce poste`} className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Réf.</th>
              <th className="px-3 py-2 text-left">Candidat</th>
              <th className="px-3 py-2 text-left">Source</th>
              <th className="px-3 py-2 text-center">Score</th>
              <th className="px-3 py-2 text-center">Étape</th>
              <th className="px-3 py-2 text-right" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {apps.map((a) => {
                const cand = candidateById(a.candidateId);
                if (!cand) return null;
                const m = stageMeta(a.stage);
                return (
                  <tr key={a.id} className={cn('hover:bg-amber/[0.03]', !ACTIVE_STAGES.includes(a.stage) && 'opacity-60')}>
                    <td className="px-4 py-2 mono text-[11px] font-bold text-amber-deep">{a.ref}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={`${cand.firstName} ${cand.lastName}`} size="xs" /><div><p className="text-[12px] font-semibold text-ink">{cand.firstName} {cand.lastName}</p><p className="text-[10px] font-medium text-ink-400">{cand.currentRole}</p></div></div></td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-500">{cand.source}</td>
                    <td className="px-3 py-2 text-center"><span className="mono text-[11px] font-bold text-ink">{a.score ?? '—'}</span></td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={m.tone} dot={false}>{m.label}</StatusPill></td>
                    <td className="px-3 py-2 text-right"><Link to={`/recrutement/candidats/${cand.id}`}><Button variant="ghost" size="sm">Profil <ArrowUpRight size={12} /></Button></Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
