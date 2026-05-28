import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Check, Pencil, Send, ShieldAlert, CalendarClock } from 'lucide-react';
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
import { memberEval, frDate } from '../../lib/mss/perf';
import { employeeName, type EmployeeRecord } from '../../data/mock';

const DEADLINE = '2026-06-30';

export function TeamEvaluationsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const [edit, setEdit] = useState<EmployeeRecord | null>(null);

  const rows = team.map((e) => ({ e, ev: memberEval(e) }));
  const notSubmitted = rows.filter((r) => !r.ev.autoEval);

  return (
    <div className="animate-fade-up space-y-5">
      <PerformanceSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Campagne : Évaluation annuelle 2026</h1>
          <p className="text-sm font-medium text-ink-500">Période 01/05 → 30/06/2026 · échéance {frDate(DEADLINE)}</p>
        </div>
        {notSubmitted.length > 0 && <Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Relance envoyée', description: `${notSubmitted.length} collaborateur(s) relancé(s) pour leur auto-évaluation.` })}><Send size={14} /> Relancer ({notSubmitted.length})</Button>}
      </div>

      <Card inset={false}>
        <div className="p-5 pb-3"><CardHeader title="Avancement par membre" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2.5 text-left">Membre</th>
                <th className="px-3 py-2.5 text-center">Auto-éval</th>
                <th className="px-3 py-2.5 text-center">Mon éval</th>
                <th className="px-3 py-2.5 text-center">Entretien</th>
                <th className="px-3 py-2.5 text-center">Signée</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ e, ev }) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><Avatar name={employeeName(e)} size="xs" /><span className="text-[13px] font-semibold text-ink">{employeeName(e)}</span></div></td>
                  <td className="px-3 py-2.5 text-center">{ev.autoEval ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ok"><Check size={12} /> {ev.autoEvalDate && frDate(ev.autoEvalDate)}</span> : <span className="text-[11px] font-medium text-ink-400">Non soumise</span>}</td>
                  <td className="px-3 py-2.5 text-center">{ev.managerDrafted ? <StatusPill tone="ok" dot={false}>Rédigée</StatusPill> : ev.autoEval ? <StatusPill tone="warn" dot={false}>À rédiger</StatusPill> : <span className="text-ink-300">—</span>}</td>
                  <td className="px-3 py-2.5 text-center text-[11px] font-medium text-ink-500">{ev.interviewDate ? frDate(ev.interviewDate) : '—'}</td>
                  <td className="px-3 py-2.5 text-center">{ev.signed ? <Check size={14} className="mx-auto text-ok" /> : <span className="text-ink-300">—</span>}</td>
                  <td className="px-3 py-2.5 text-right">{ev.autoEval && !ev.signed && <Button variant="outline" size="sm" onClick={() => setEdit(e)}><Pencil size={13} /> {ev.managerDrafted ? 'Reprendre' : 'Rédiger'}</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-warn/25">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldAlert size={14} className="mt-0.5 shrink-0 text-warn" /> Règle dure : vous ne saisissez <strong>aucun montant salarial</strong>. Vous pouvez recommander une augmentation (Oui/Non) ; la RH/DRH décide les montants. La signature de l'employé vaut accusé de réception, jamais approbation forcée.</p>
      </Card>

      <Modal open={edit !== null} onClose={() => setEdit(null)} size="lg" title={edit ? `Évaluation annuelle 2026 — ${employeeName(edit)}` : ''} footer={<>
        <Button variant="ghost" size="sm" onClick={() => setEdit(null)}>Fermer</Button>
        <Button variant="outline" size="sm" onClick={() => { toast({ variant: 'success', title: 'Brouillon sauvegardé' }); }}>Sauvegarder brouillon</Button>
        <Button size="sm" onClick={() => { toast({ variant: 'success', title: 'Évaluation soumise', description: `${edit && employeeName(edit)} est notifié(e) — l'entretien peut être planifié.` }); setEdit(null); }}>Soumettre</Button>
      </>}>
        {edit && <EvalForm e={edit} />}
      </Modal>
    </div>
  );
}

const SECTIONS = ['Bilan de l\'année', 'Évaluation des objectifs', 'Compétences clés', 'Comportemental', 'Points forts', 'Axes de progrès', 'Recommandations', 'Synthèse', 'Note globale'];
const COMPORTEMENTAL = ['Leadership', 'Travail en équipe', 'Initiative', 'Adaptabilité'];

function EvalForm({ e }: { e: EmployeeRecord }) {
  const ev = memberEval(e);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-info/[0.06] px-3 py-2 text-[12px] font-medium text-ink-700">
        <span className="inline-flex items-center gap-1.5"><ClipboardCheck size={14} className="text-info" /> Auto-évaluation disponible {ev.autoEvalDate && `(${frDate(ev.autoEvalDate)})`}</span>
        <Button variant="ghost" size="sm">Lire son auto-éval</Button>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Progression : 4/9 sections</p>
      <div className="flex flex-wrap gap-1.5">
        {SECTIONS.map((s, i) => <span key={s} className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${i < 4 ? 'bg-ok/12 text-ok' : 'bg-ink/[0.05] text-ink-400'}`}>{i + 1}. {s}</span>)}
      </div>

      <label className="block"><span className="text-[12px] font-semibold text-ink-500">1. Bilan de l'année écoulée</span>
        <textarea rows={2} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" placeholder="Synthèse de l'année…" /></label>

      <div>
        <p className="text-[12px] font-semibold text-ink-500">4. Évaluation comportementale</p>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {COMPORTEMENTAL.map((c) => (
            <label key={c} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2 text-[12px] font-medium text-ink-700">{c}
              <select className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] outline-none"><option>5/5</option><option>4/5</option><option>3/5</option><option>2/5</option><option>1/5</option></select>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-warn/25 bg-warn/[0.05] p-3">
        <p className="text-[12px] font-semibold text-ink-700">7. Recommandations</p>
        <label className="mt-2 flex items-center justify-between text-[12px] font-medium text-ink-700">Augmentation salariale à envisager
          <select className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] outline-none"><option>Non</option><option>Oui</option></select>
        </label>
        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-warn"><ShieldAlert size={11} /> Sans montant — la RH/DRH décide.</p>
      </div>

      <label className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2 text-[12px] font-semibold text-ink-700">9. Note globale
        <select className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] outline-none"><option>4/5 — Très bonne performance</option><option>5/5 — Excellente</option><option>3/5 — Satisfaisante</option><option>2/5 — À améliorer</option></select>
      </label>

      <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-400"><CalendarClock size={12} /> Sauvegarde automatique du brouillon toutes les 30 s.</p>
    </div>
  );
}
