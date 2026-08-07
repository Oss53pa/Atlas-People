import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Star, BookOpen, Check, X, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/overlays';
import { useToast } from '../../components/ui/Toast';
import { DevelopmentSubNav } from '../../components/mss/DevelopmentSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { teamTrainings, type TeamTraining } from '../../lib/mss/dev';
import { employeeName } from '../../data/mock';
import { isBackendConfigured, useTeamTrainingRequests, useDecideTrainingRequest } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

type Tab = 'upcoming' | 'inprogress' | 'done' | 'overdue';
const TAB_LABEL: Record<Tab, string> = { upcoming: 'À venir', inprogress: 'En cours', done: 'Terminées', overdue: 'En retard' };

function Bar({ pct }: { pct: number }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]"><div className="h-full rounded-full bg-info" style={{ width: `${pct}%` }} /></div>;
}

const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');

export function TeamTrainingsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const all = teamTrainings(team);
  const [tab, setTab] = useState<Tab>('inprogress');
  const [feedback, setFeedback] = useState<TeamTraining | null>(null);

  const { data: ctx } = useSessionContext();
  const { data: liveRequests } = useTeamTrainingRequests(ctx?.tenantId);
  const decideTraining = useDecideTrainingRequest();
  const hasLive = isBackendConfigured && Boolean(ctx?.tenantId);

  const counts = (t: Tab) => all.filter((x) => x.status === t).length;
  const shown = all.filter((x) => x.status === tab);

  const handleDecide = (registrationId: string, decision: 'approved' | 'cancelled', empName: string, courseTitle: string) => {
    if (!ctx?.tenantId) return;
    decideTraining.mutate(
      { registrationId, decision, tenantId: ctx.tenantId },
      {
        onSuccess: () => toast({ variant: decision === 'approved' ? 'success' : 'info', title: decision === 'approved' ? 'Formation approuvée' : 'Formation refusée', description: `${empName} — ${courseTitle || 'Formation'}` }),
        onError: () => toast({ variant: 'error', title: 'Erreur', description: 'La décision n\'a pas pu être enregistrée.' }),
      }
    );
  };

  return (
    <div className="animate-fade-up space-y-5">
      <DevelopmentSubNav />
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-ink">Formations dans mon équipe</h1>
        {hasLive && <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>}
      </div>

      {hasLive && (liveRequests ?? []).length > 0 && (
        <Card>
          <CardHeader title="Demandes en attente de validation" subtitle={`${(liveRequests ?? []).length} demande(s) à traiter`} action={<BookOpen size={16} className="text-info" />} />
          <div className="space-y-2">
            {(liveRequests ?? []).map((r) => {
              const empName = [r.employee_first_name, r.employee_last_name].filter(Boolean).join(' ') || r.employee_id;
              const courseTitle = r.course_title ?? 'Formation';
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface2 px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={empName} size="xs" />
                    <div>
                      <p className="text-sm font-semibold text-ink">{empName} — {courseTitle}</p>
                      <p className="text-[11px] font-medium text-ink-400">Demandé le {frDate(r.requested_at)}{r.allocated_cost ? ` · ${r.allocated_cost.toLocaleString('fr-FR')} FCFA` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" onClick={() => handleDecide(r.id, 'approved', empName, courseTitle)} disabled={decideTraining.isPending}><Check size={13} /> Approuver</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDecide(r.id, 'cancelled', empName, courseTitle)} disabled={decideTraining.isPending}><X size={13} /> Refuser</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-3 py-1.5 text-[12px] font-semibold transition ${tab === t ? 'bg-info/12 text-info' : 'bg-surface2 text-ink-500 hover:text-ink'}`}>{TAB_LABEL[t]} ({counts(t)})</button>
        ))}
      </div>

      <Card>
        {shown.length === 0 ? <p className="py-6 text-center text-sm font-medium text-ink-400">Aucune formation dans cet état.</p> : (
          <div className="space-y-2">
            {shown.map((t) => (
              <div key={t.emp.id} className={`rounded-xl px-3 py-2.5 ${t.status === 'overdue' ? 'bg-warn/[0.06]' : 'bg-surface2'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5"><Avatar name={employeeName(t.emp)} size="xs" />
                    <div>
                      <p className="text-sm font-semibold text-ink">{employeeName(t.emp)} — {t.title}</p>
                      <p className="text-[11px] font-medium text-ink-400">{t.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.status === 'overdue' && <Button variant="outline" size="sm" onClick={() => toast({ variant: 'warning', title: 'Relance envoyée', description: `${employeeName(t.emp)} relancé(e) pour « ${t.title} ».` })}><AlertTriangle size={12} /> Relancer</Button>}
                    {t.feedbackPending && <Button size="sm" onClick={() => setFeedback(t)}><Star size={12} /> Donner mon retour</Button>}
                    {t.status === 'inprogress' && <StatusPill tone="info" dot={false}>{t.progress}%</StatusPill>}
                    {t.status === 'done' && <StatusPill tone="ok" dot={false}>Terminée</StatusPill>}
                  </div>
                </div>
                {t.status === 'inprogress' && <div className="mt-2"><Bar pct={t.progress} /></div>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={feedback !== null} onClose={() => setFeedback(null)} title={feedback ? `Mon retour — ${feedback.title}` : ''} footer={<>
        <Button variant="ghost" size="sm" onClick={() => setFeedback(null)}>Annuler</Button>
        <Button size="sm" onClick={() => { toast({ variant: 'success', title: 'Retour enregistré', description: feedback ? `Votre retour sur « ${feedback.title} » est enregistré.` : '' }); setFeedback(null); }}>Enregistrer</Button>
      </>}>
        <div className="space-y-3 text-[12px] font-medium text-ink-700">
          <p className="text-ink-500">Évaluez l'utilité observée de la formation pour {feedback && employeeName(feedback.emp)} :</p>
          {['Compétence acquise et observable ?', 'Application en situation de travail ?', 'Recommanderiez-vous à d\'autres N-1 ?'].map((q) => (
            <label key={q} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2">{q}
              <select className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] outline-none"><option>Oui</option><option>Partiellement</option><option>Non</option></select>
            </label>
          ))}
          <label className="block"><span className="text-[12px] font-semibold text-ink-500">Commentaire</span>
            <textarea rows={2} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" placeholder="Observation terrain…" /></label>
        </div>
      </Modal>
    </div>
  );
}
