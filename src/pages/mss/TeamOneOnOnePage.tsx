import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, CalendarClock, Check, ListChecks, Play, ClipboardList } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/overlays';
import { useToast } from '../../components/ui/Toast';
import { PerformanceSubNav } from '../../components/mss/PerformanceSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { memberOneOnOne, frDate } from '../../lib/mss/perf';
import { employeeName, type EmployeeRecord } from '../../data/mock';

const SUGGESTED = ['Revue avancement OKR', 'Souhaits de développement', 'Charge de travail', 'Feedback réciproque'];

export function TeamOneOnOnePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const [prep, setPrep] = useState<EmployeeRecord | null>(null);

  const rows = team.map((e) => ({ e, o: memberOneOnOne(e) }));
  const overdue = rows.filter((r) => r.o.overdue);
  const upcoming = rows.filter((r) => !r.o.overdue);

  return (
    <div className="animate-fade-up space-y-5">
      <PerformanceSubNav />
      <h1 className="text-2xl font-semibold text-ink">Mes 1:1 — cadence hebdomadaire</h1>

      {overdue.length > 0 && (
        <Card className="border-warn/25">
          <CardHeader title="En retard" subtitle={`${overdue.length} entretien(s)`} action={<CalendarClock size={16} className="text-warn" />} />
          <div className="space-y-1.5">
            {overdue.map(({ e, o }) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl bg-warn/[0.06] px-3 py-2">
                <div className="flex items-center gap-2.5"><Avatar name={employeeName(e)} size="xs" /><span className="text-sm font-semibold text-ink">{employeeName(e)}</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-ink-500">Dernier {frDate(o.lastDate)} · J-{o.daysSince}</span>
                  <Button size="sm" onClick={() => setPrep(e)}>Planifier</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Prochains" action={<MessageSquare size={16} className="text-ink-400" />} />
        {upcoming.length > 0 ? (
          <div className="space-y-2">
            {upcoming.map(({ e, o }) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface2 px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar name={employeeName(e)} size="xs" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{employeeName(e)}</p>
                    <p className="text-[11px] font-medium text-ink-400">{o.nextDate ? `Prévu ${frDate(o.nextDate)}` : 'À planifier'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {o.prepared ? <StatusPill tone="ok" dot={false}>Préparé</StatusPill> : <Button variant="outline" size="sm" onClick={() => setPrep(e)}><ClipboardList size={13} /> Préparer</Button>}
                  <Button size="sm" onClick={() => toast({ variant: 'info', title: `1:1 démarré avec ${employeeName(e)}`, description: 'Prise de notes et engagements activés.' })}><Play size={13} /> Démarrer</Button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm font-medium text-ink-400">Aucun 1:1 à venir.</p>}
      </Card>

      <Card>
        <CardHeader title="Suivi des engagements" subtitle="Tous mes 1:1" action={<ListChecks size={16} className="text-ink-400" />} />
        <div className="space-y-1.5 text-[12px] font-medium">
          <div className="flex items-center gap-2 rounded-lg bg-surface2 px-3 py-1.5"><Check size={13} className="text-ok" /> Transmettre les contacts CEMAC — <span className="text-ink-400">fait</span></div>
          <div className="flex items-center gap-2 rounded-lg bg-surface2 px-3 py-1.5"><CalendarClock size={13} className="text-warn" /> Préparer la formation interne — <span className="text-ink-400">en cours</span></div>
        </div>
      </Card>

      <Modal open={prep !== null} onClose={() => setPrep(null)} title={prep ? `Préparation 1:1 — ${employeeName(prep)}` : ''} footer={<>
        <Button variant="ghost" size="sm" onClick={() => setPrep(null)}>Annuler</Button>
        <Button size="sm" onClick={() => { toast({ variant: 'success', title: 'Préparation enregistrée', description: prep ? `1:1 avec ${employeeName(prep)} prêt.` : '' }); setPrep(null); }}>Enregistrer</Button>
      </>}>
        <div className="space-y-3">
          <div className="rounded-xl bg-surface2 px-3 py-2 text-[12px] font-medium text-ink-600">
            <p className="font-semibold text-ink">Données récentes</p>
            <p className="mt-1">Avancement OKR à jour · demandes de congés à traiter · aucune anomalie de pointage.</p>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-ink-500">Sujets suggérés</p>
            <div className="mt-1 space-y-1">
              {SUGGESTED.map((s, i) => <label key={s} className="flex items-center gap-2 text-[12px] font-medium text-ink-700"><input type="checkbox" defaultChecked={i < 2} className="h-4 w-4 rounded border-line accent-info" /> {s}</label>)}
            </div>
          </div>
          <label className="block"><span className="text-[12px] font-semibold text-ink-500">Mes notes de préparation (privées)</span>
            <textarea rows={3} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" placeholder="Notes confidentielles, non partagées avec le collaborateur." /></label>
        </div>
      </Modal>
    </div>
  );
}
