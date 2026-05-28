import { useEffect, useMemo } from 'react';
import { LogOut, Check, Play, Circle, ArrowRight, AlertTriangle, FileText } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/feedback';
import { useToast } from '../../components/ui/Toast';
import { RecruitmentSubNav } from '../../components/mss/RecruitmentSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { leavers, frDate } from '../../lib/mss/recruit';
import { employeeName } from '../../data/mock';

const DOSSIER_TONE = { done: 'ok', inprogress: 'info', todo: 'warn' } as const;
const DOSSIER_LABEL = { done: 'Transféré', inprogress: 'En cours', todo: 'À attribuer' } as const;

export function TeamLeaversPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const lvs = leavers(team);

  return (
    <div className="animate-fade-up space-y-5">
      <RecruitmentSubNav />
      <h1 className="text-2xl font-semibold text-ink">Mes sortants</h1>

      {lvs.length === 0 ? (
        <Card><EmptyState icon={LogOut} title="Aucun sortant" description="Aucun départ en cours dans votre périmètre." /></Card>
      ) : lvs.map((l) => (
        <Card key={l.emp.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={employeeName(l.emp)} size="md" />
              <div>
                <p className="text-sm font-bold text-ink">{employeeName(l.emp)} — départ {frDate(l.departDate)} (J-{l.jUntil})</p>
                <p className="text-[12px] font-medium text-ink-500">Motif : {l.reason} · Préavis depuis le {frDate(l.noticeFrom)}</p>
              </div>
            </div>
            <StatusPill tone="warn" dot={false}>Transition en cours</StatusPill>
          </div>

          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Étapes de transition</p>
              <ul className="mt-2 space-y-1.5">
                {l.steps.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px] font-medium text-ink-700">
                    {s.done ? <Check size={14} className="text-ok" /> : i === 1 ? <Play size={13} className="text-info" /> : <Circle size={13} className="text-ink-300" />}
                    <span className={s.done ? 'text-ink-500' : ''}>{s.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Transfert des dossiers</p>
              <div className="mt-2 space-y-1.5">
                {l.dossiers.map((d, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2 text-[12px] font-medium text-ink-700">
                    <span className="flex items-center gap-1.5">{d.client} <ArrowRight size={12} className="text-ink-300" /> {d.to}</span>
                    <StatusPill tone={DOSSIER_TONE[d.status]} dot={false}>{DOSSIER_LABEL[d.status]}</StatusPill>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-amber/[0.07] px-3 py-2 text-[12px] font-semibold text-amber-deep"><AlertTriangle size={13} /> Notes de capitalisation à recueillir avant le départ.</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Attribution des dossiers', description: 'Répartissez les dossiers clients restants entre les membres de l’équipe.' })}>Attribuer dossiers</Button>
            <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Entretien de sortie programmé', description: `Dernier échange formel avec ${employeeName(l.emp)} planifié.` })}>Programmer entretien sortie</Button>
            {l.replacementRef && <StatusPill tone="info" dot={false}><FileText size={12} /> Remplaçant demandé : {l.replacementRef}</StatusPill>}
          </div>
        </Card>
      ))}
    </div>
  );
}
