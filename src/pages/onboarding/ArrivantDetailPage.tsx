import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Rocket, CheckCircle2, Clock,
  GraduationCap, FileText, MessageSquareHeart, ExternalLink,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { templateMeta } from '../../lib/m6/mock';
import { useM6Data } from '../../lib/m6/dataLive';
import { MILESTONES, MILESTONE_META, TASK_CATEGORY_META, MANDATORY_TRAININGS, WELCOME_DOCS, OWNER_LABEL } from '../../lib/m6/referentiels';
import { employeeById, employeeName, matricule } from '../../data/mock';
import type { MilestoneCode } from '../../lib/m6/types';
import { cn } from '../../lib/cn';

export function ArrivantDetailPage() {
  const { employeeId = '' } = useParams();
  const m6 = useM6Data();
  const emp = employeeById(employeeId);
  const journey = m6.journeyByEmployee(employeeId);
  const { toast } = useToast();

  const tasks = useMemo(() => journey ? m6.tasksByJourney(journey.id) : [], [journey, m6]);
  const pulses = useMemo(() => journey ? m6.pulsesByJourney(journey.id) : [], [journey, m6]);
  const trainings = useMemo(() => journey ? m6.trainingsByJourney(journey.id) : [], [journey, m6]);
  const docs = useMemo(() => journey ? m6.docsByJourney(journey.id) : [], [journey, m6]);

  if (!emp || !journey) {
    return (
      <div className="animate-fade-up space-y-4">
        <OnboardingSubNav />
        <Card><p className="py-10 text-center text-sm font-medium text-ink-400">Parcours introuvable.</p></Card>
      </div>
    );
  }

  const tpl = templateMeta(journey.templateCode);
  const buddy = journey.buddyEmployeeId ? employeeById(journey.buddyEmployeeId) : null;
  const manager = employeeById(journey.managerEmployeeId);
  const hrLead = employeeById(journey.hrLeadEmployeeId);
  const journeyDays = Math.round((new Date('2026-05-31').getTime() - new Date(journey.hireDate).getTime()) / 86_400_000);

  return (
    <div className="animate-fade-up space-y-4">
      <OnboardingSubNav />

      <Link to="/onboarding/arrivants" className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber-deep hover:underline">
        ← Tous les arrivants
      </Link>

      {/* HEADER */}
      <Card className="glass-amber">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar name={employeeName(emp)} size="lg" />
            <div>
              <h1 className="text-xl font-bold text-ink">{employeeName(emp)}</h1>
              <p className="mono mt-0.5 text-[11px] font-medium text-amber-deep">{matricule(emp)} · {journey.ref}</p>
              <p className="mt-1 text-[13px] font-semibold text-ink-700">{emp.role} · {emp.department}</p>
              <p className="mt-0.5 text-[11px] font-medium text-ink-500">
                Embauche {journey.hireDate} · {journeyDays >= 0 ? `J+${journeyDays}` : `J${journeyDays}`} · template {tpl?.label}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <StatusPill tone={journey.status === 'completed' ? 'ok' : journey.status === 'in_progress' ? 'amber' : 'neutral'} dot>{journey.status}</StatusPill>
                <span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">{journey.progressPct} %</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/collaborateurs/${emp.id}`}><Button variant="ghost" size="sm"><ExternalLink size={13} /> M1</Button></Link>
            {journeyDays >= 60 && <Link to="/onboarding/validation"><Button size="sm" variant="outline">Valider la PE</Button></Link>}
          </div>
        </div>
      </Card>

      {/* Équipe d'accompagnement */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Manager</p>
          {manager ? <div className="mt-1 flex items-center gap-2"><Avatar name={employeeName(manager)} size="xs" /><p className="text-[13px] font-semibold text-ink">{employeeName(manager)}</p></div> : <p className="text-[12px] text-ink-400">—</p>}
        </Card>
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Buddy</p>
          {buddy ? <div className="mt-1 flex items-center gap-2"><Avatar name={employeeName(buddy)} size="xs" /><p className="text-[13px] font-semibold text-ink">{employeeName(buddy)}</p></div> : <p className="text-[12px] text-ink-400">—</p>}
        </Card>
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">RH lead</p>
          {hrLead ? <div className="mt-1 flex items-center gap-2"><Avatar name={employeeName(hrLead)} size="xs" /><p className="text-[13px] font-semibold text-ink">{employeeName(hrLead)}</p></div> : <p className="text-[12px] text-ink-400">—</p>}
        </Card>
      </div>

      {/* TIMELINE 30/60/90 */}
      <Card>
        <CardHeader title="Timeline 30/60/90" subtitle={`${tasks.filter(t=>t.status==='completed').length}/${tasks.length} tâches complétées`} action={<Rocket size={16} className="text-amber-deep" />} />
        <div className="space-y-3">
          {MILESTONES.map((m) => {
            const ms = MILESTONE_META[m.code as MilestoneCode];
            const list = m6.tasksByMilestone(journey.id, m.code as MilestoneCode);
            const done = list.filter((t) => t.status === 'completed').length;
            const reached = journeyDays >= m.daysFromHire;
            return (
              <div key={m.code} className={cn('rounded-xl border p-3', reached ? 'border-amber/30 bg-amber/[0.04]' : 'border-line bg-surface2/30')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold',
                      ms.tone === 'ok' ? 'bg-ok/20 text-ok' : ms.tone === 'amber' ? 'bg-amber/20 text-amber-deep' : ms.tone === 'info' ? 'bg-info/20 text-info' : 'bg-ink/[0.06] text-ink-500')}>
                      {reached ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                    </span>
                    <div>
                      <p className="text-[13px] font-bold text-ink">{m.label}</p>
                      <p className="text-[11px] font-medium text-ink-500">{list.length === 0 ? 'Aucune tâche' : `${done}/${list.length} complétées`}</p>
                    </div>
                  </div>
                  <span className="mono text-[10px] font-bold text-ink-400">{m.daysFromHire >= 0 ? `J+${m.daysFromHire}` : `J${m.daysFromHire}`}</span>
                </div>
                {list.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {list.map((t) => {
                      const cat = TASK_CATEGORY_META[t.category];
                      const owner = t.ownerEmployeeId ? employeeById(t.ownerEmployeeId) : null;
                      return (
                        <li key={t.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-[12px]">
                          <span className={cn('mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full',
                            t.status === 'completed' ? 'bg-ok' : t.status === 'in_progress' ? 'bg-amber' : t.status === 'blocked' ? 'bg-danger' : 'bg-ink-300')} />
                          <span className="flex-1 truncate font-medium text-ink-700">{t.title}</span>
                          {t.blocking && <span className="rounded-md bg-warn/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-warn">bloquant</span>}
                          <span className="rounded-md bg-amber/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-deep">{cat.label}</span>
                          <span className="text-[10px] font-medium text-ink-400">{owner ? employeeName(owner).split(' ')[0] : OWNER_LABEL[t.ownerRole]}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Formations */}
        <Card>
          <CardHeader title="Formations obligatoires" subtitle={`${trainings.filter(t=>t.status==='completed').length}/${trainings.length} validées`} action={<GraduationCap size={16} className="text-amber-deep" />} />
          <ul className="space-y-1">
            {trainings.map((t) => {
              const tr = MANDATORY_TRAININGS.find((x) => x.code === t.trainingCode)!;
              return (
                <li key={t.id} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5 text-[12px]">
                  <div className="flex-1">
                    <p className="font-medium text-ink-700">{tr.label}</p>
                    <p className="text-[10px] font-medium text-ink-400">{tr.durationHours} h · {tr.format}</p>
                  </div>
                  <StatusPill tone={t.status === 'completed' ? 'ok' : t.status === 'in_progress' ? 'amber' : t.status === 'overdue' ? 'danger' : 'neutral'} dot={false}>{t.status}</StatusPill>
                  {t.score && <span className="mono ml-2 text-[11px] font-bold text-amber-deep">{t.score} %</span>}
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader title="Welcome pack" subtitle={`${docs.filter(d=>d.status==='signed'||d.status==='read').length}/${docs.length} traités`} action={<FileText size={16} className="text-amber-deep" />} />
          <ul className="space-y-1">
            {docs.map((d) => {
              const doc = WELCOME_DOCS.find((x) => x.code === d.docCode)!;
              return (
                <li key={d.id} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5 text-[12px]">
                  <span className="flex-1 font-medium text-ink-700">{doc.label}</span>
                  {doc.signatureRequired && <span className="rounded-md bg-amber/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-deep">signature</span>}
                  <StatusPill tone={d.status === 'signed' ? 'ok' : d.status === 'read' ? 'amber' : 'neutral'} dot={false}>{d.status}</StatusPill>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Pulses */}
      <Card>
        <CardHeader title="Pulse feedback" subtitle={`${pulses.length}/4 retours collectés`} action={<MessageSquareHeart size={16} className="text-amber-deep" />} />
        {pulses.length === 0 ? <p className="rounded-xl bg-surface2/40 px-3 py-3 text-center text-[12px] font-medium text-ink-400">Pas encore de pulse collecté.</p>
          : <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
              {pulses.map((p) => (
                <div key={p.id} className="rounded-xl border border-line bg-surface2/40 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">{p.milestone}</p>
                  <p className="mono mt-0.5 text-lg font-bold text-ink">{p.overallScore.toFixed(1)}/5</p>
                  {p.npsScore !== undefined && <p className="mono mt-0.5 text-[11px] font-bold text-amber-deep">NPS {p.npsScore}</p>}
                  <p className="text-[10px] font-medium text-ink-400">{p.submittedAt}</p>
                </div>
              ))}
            </div>}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Pulse', description: 'Pulse envoyé au collaborateur' })}>Envoyer un pulse</Button>
        <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'info', title: 'Note', description: 'Note ajoutée au parcours' })}>+ Note interne</Button>
      </div>
    </div>
  );
}
