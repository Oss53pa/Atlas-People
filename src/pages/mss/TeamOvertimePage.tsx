import { useEffect, useMemo } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/feedback';
import { useToast } from '../../components/ui/Toast';
import { TeamTimeSubNav } from '../../components/m2/TeamTimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useOvertime } from '../../store/useOvertime';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { employeeName, employeeById } from '../../data/mock';

const fmtH = (n: number) => `${Math.floor(n)}h${n % 1 ? String(Math.round((n % 1) * 60)).padStart(2, '0') : '00'}`;
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
const CAT: Record<string, string> = { overtime: 'Heures sup', night: 'Nuit', sunday: 'Dimanche', holiday: 'Férié' };

export function TeamOvertimePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const records = useOvertime((s) => s.records);
  const decide = useOvertime((s) => s.decide);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const teamIds = useMemo(() => new Set(team.map((e) => e.id)), [team]);

  const pending = records.filter((r) => teamIds.has(r.employeeId) && r.status === 'pending').sort((a, b) => (a.date < b.date ? 1 : -1));

  const act = (id: string, status: 'validated' | 'refused', who: string, h: number, adjust?: number) => {
    decide(id, status, adjust);
    toast({
      variant: status === 'validated' ? 'success' : 'warning',
      title: status === 'validated' ? (adjust != null ? 'Heures sup ajustées & validées' : 'Heures sup validées') : 'Heures sup refusées',
      description: `${who} · ${fmtH(adjust ?? h)} — l'employé est informé (transparence).`,
    });
  };

  return (
    <div className="animate-fade-up space-y-5">
      <TeamTimeSubNav />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Valider les heures supplémentaires</h1>
        <StatusPill tone={pending.length ? 'amber' : 'ok'} dot={false}>{pending.length} à valider</StatusPill>
      </div>

      {pending.length > 0 ? (
        <div className="space-y-3">
          {pending.map((r) => {
            const emp = employeeById(r.employeeId); if (!emp) return null;
            return (
              <Card key={r.id}>
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar name={employeeName(emp)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{employeeName(emp)} · <span className="mono text-amber-deep">{fmtH(r.overtimeHours)}</span> {r.category === 'night' ? '(nuit)' : `(+${r.ratePct}%)`}</p>
                    <p className="text-[11px] font-medium text-ink-400">{frDate(r.date)} · {CAT[r.category]} · prévu {fmtH(r.plannedHours)} / pointé {fmtH(r.workedHours)} · {r.source === 'auto' ? 'auto-détectée' : 'déclarée'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => act(r.id, 'validated', employeeName(emp), r.overtimeHours)} className="rounded-lg bg-ok/12 px-2.5 py-2 text-[12px] font-bold text-ok hover:bg-ok/20"><Check size={14} className="inline" /> Valider</button>
                    <button onClick={() => act(r.id, 'validated', employeeName(emp), r.overtimeHours, Math.max(0, Math.round((r.overtimeHours - 0.5) * 10) / 10))} className="rounded-lg bg-amber/12 px-2.5 py-2 text-[12px] font-bold text-amber-deep hover:bg-amber/20">Ajuster −0,5h</button>
                    <button onClick={() => act(r.id, 'refused', employeeName(emp), r.overtimeHours)} className="rounded-lg bg-danger/10 px-2.5 py-2 text-[12px] font-bold text-danger hover:bg-danger/20"><X size={14} className="inline" /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card><EmptyState icon={Clock} title="Aucune heure sup à valider" description="Les heures supplémentaires de l'équipe en attente apparaîtront ici." /></Card>
      )}

      <Card className="glass-amber">
        <p className="text-[12px] font-medium text-ink-700">Le calcul des majorations est déterministe : vous autorisez ou ajustez le volume validé. Une heure sup n'est jamais payée sans votre validation, et tout ajustement est visible par l'employé.</p>
      </Card>
    </div>
  );
}
