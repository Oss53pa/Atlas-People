import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Check, X, Info, RefreshCw, ShieldAlert, AlertTriangle, Wifi } from 'lucide-react';
import { Card } from '../../components/ui/Card';
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
import { trainingValidations, fmtFCFA, type TrainingRequest } from '../../lib/mss/dev';
import { employeeName } from '../../data/mock';
import { isBackendConfigured, useTeamTrainingRequests, useDecideTrainingRequest } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';
import { mockEmpId } from '../../lib/m1/roster';

const frDate = (d: string) => new Date(d).toLocaleDateString('fr-FR');

type Decision = 'approve' | 'refuse' | 'info' | 'alt';

export function TeamTrainingValidationsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const teamIds = useMemo(() => new Set(team.map((e) => e.id)), [team]);

  // ── Branche LIVE — demandes de formation en attente de validation manager ──
  const { data: ctx } = useSessionContext();
  const { data: liveRequests } = useTeamTrainingRequests(ctx?.tenantId);
  const decideLive = useDecideTrainingRequest();
  const liveScoped = useMemo(
    () => (liveRequests ?? []).filter((r) => teamIds.has(mockEmpId(r.employee_id))),
    [liveRequests, teamIds],
  );
  const hasLive = isBackendConfigured && liveScoped.length > 0;
  const [busyId, setBusyId] = useState<string | null>(null);

  const decideLiveRequest = async (id: string, decision: 'approved' | 'cancelled', who: string, title: string) => {
    if (!ctx?.tenantId) return;
    setBusyId(id);
    try {
      await decideLive.mutateAsync({ registrationId: id, decision, tenantId: ctx.tenantId });
      toast({
        variant: decision === 'approved' ? 'success' : 'warning',
        title: decision === 'approved' ? 'Validée et envoyée à la RH (budget)' : 'Refusée — décision transmise',
        description: `${who} · ${title} · décision tracée individuellement (audit).`,
      });
    } catch (e) {
      toast({ variant: 'error', title: 'Échec de la décision', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
    } finally {
      setBusyId(null);
    }
  };

  const [decided, setDecided] = useState<Record<string, string>>({});
  const [active, setActive] = useState<TrainingRequest | null>(null);
  const [decision, setDecision] = useState<Decision>('approve');
  const [comment, setComment] = useState('');

  const requests = trainingValidations(team).filter((r) => !decided[r.id]);

  const open = (r: TrainingRequest) => { setActive(r); setDecision('approve'); setComment(''); };
  const refuseInvalid = decision === 'refuse' && comment.trim().length < 20;
  const submit = () => {
    if (!active) return;
    const labels: Record<Decision, { v: 'success' | 'info' | 'warning'; t: string }> = {
      approve: { v: 'success', t: 'Validée et envoyée à la RH (budget)' },
      refuse: { v: 'warning', t: 'Refusée — motif transmis' },
      info: { v: 'info', t: 'Information complémentaire demandée' },
      alt: { v: 'info', t: 'Session alternative proposée' },
    };
    const l = labels[decision];
    toast({ variant: l.v, title: l.t, description: `${employeeName(active.emp)} · ${active.title} · décision tracée individuellement (audit).` });
    setDecided((d) => ({ ...d, [active.id]: decision }));
    setActive(null);
  };

  return (
    <div className="animate-fade-up space-y-5">
      <DevelopmentSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Formations à valider</h1>
        <div className="flex items-center gap-2">
          {hasLive && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-ok/[0.1] px-2 py-1 text-[11px] font-semibold text-ok"><Wifi size={11} /> Live DB</span>
          )}
          <StatusPill tone={(hasLive ? liveScoped.length : requests.length) > 0 ? 'warn' : 'ok'} dot={false}>{hasLive ? liveScoped.length : requests.length} en attente</StatusPill>
        </div>
      </div>

      {hasLive ? (
        <div className="space-y-3">
          {liveScoped.map((r) => {
            const who = `${r.employee_first_name ?? ''} ${r.employee_last_name ?? ''}`.trim() || '—';
            const title = r.course_title || 'Formation';
            return (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5"><Avatar name={who} size="sm" />
                    <div>
                      <p className="text-sm font-bold text-ink">{who} — {title}</p>
                      <p className="text-[11px] font-medium text-ink-400">Demande du {frDate(r.requested_at)}{r.allocated_cost != null ? ` · ${r.allocated_cost.toLocaleString('fr-FR')} FCFA` : ''}</p>
                    </div>
                  </div>
                  <StatusPill tone="warn" dot={false}>En attente</StatusPill>
                </div>
                <div className="mt-3 flex justify-end gap-1.5">
                  <Button size="sm" variant="ghost" disabled={busyId === r.id} onClick={() => decideLiveRequest(r.id, 'cancelled', who, title)}><X size={14} /> Refuser</Button>
                  <Button size="sm" disabled={busyId === r.id} onClick={() => decideLiveRequest(r.id, 'approved', who, title)}><Check size={14} /> Approuver</Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : requests.length === 0 ? (
        <Card><p className="py-6 text-center text-sm font-medium text-ink-400">Aucune demande de formation en attente.</p></Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2.5"><Avatar name={employeeName(r.emp)} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-ink">{employeeName(r.emp)} — {r.title}</p>
                    <p className="text-[11px] font-medium text-ink-400">{r.inCatalog ? 'Catalogue' : 'Hors catalogue'} · Session {r.session} · {fmtFCFA(r.cost)}</p>
                  </div>
                </div>
                {!r.inCatalog && <span className="inline-flex items-center gap-1 rounded-lg bg-warn/[0.1] px-2 py-1 text-[11px] font-semibold text-warn"><AlertTriangle size={11} /> Double validation requise</span>}
              </div>

              <p className="mt-3 rounded-xl bg-surface2 px-3 py-2 text-[12px] font-medium text-ink-600"><span className="font-semibold text-ink">Justification :</span> {r.justification}</p>

              <div className="mt-3 grid grid-cols-1 gap-1.5 text-[12px] font-medium sm:grid-cols-2">
                <span className="flex items-center gap-1.5">{r.alignedWish ? <Check size={13} className="text-ok" /> : <X size={13} className="text-ink-300" />} Aligné souhait déclaré</span>
                <span className="flex items-center gap-1.5">{r.alignedTarget ? <Check size={13} className="text-ok" /> : <X size={13} className="text-ink-300" />} Aligné cible poste</span>
                <span className="flex items-center gap-1.5"><Check size={13} className="text-ok" /> Charge équipe absorbable</span>
                <span className="flex items-center gap-1.5"><Check size={13} className="text-ok" /> Budget formation restant OK</span>
              </div>

              <div className="mt-3 flex justify-end"><Button size="sm" onClick={() => open(r)}><ClipboardCheck size={14} /> Statuer</Button></div>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-warn/25">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldAlert size={14} className="mt-0.5 shrink-0 text-warn" /> Votre validation est <strong>managériale</strong> (pertinence, charge). Le budget et la logistique restent décidés par la RH, qui peut refuser même après votre accord. Chaque décision est auditée individuellement.</p>
      </Card>

      <Modal open={active !== null} onClose={() => setActive(null)} title={active ? `Statuer — ${employeeName(active.emp)} · ${active.title}` : ''} footer={<>
        <Button variant="ghost" size="sm" onClick={() => setActive(null)}>Annuler</Button>
        <Button size="sm" disabled={refuseInvalid} onClick={submit}>Confirmer</Button>
      </>}>
        <div className="space-y-3">
          {([['approve', 'Valider et envoyer à la RH', Check], ['alt', 'Proposer une session alternative', RefreshCw], ['info', 'Demander une information', Info], ['refuse', 'Refuser (motif obligatoire)', X]] as const).map(([key, label, Icon]) => (
            <label key={key} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium ${decision === key ? 'border-info bg-info/[0.06] text-info' : 'border-line bg-surface2 text-ink-700'}`}>
              <input type="radio" name="decision" checked={decision === key} onChange={() => setDecision(key)} className="accent-info" /> <Icon size={14} /> {label}
            </label>
          ))}
          <label className="block"><span className="text-[12px] font-semibold text-ink-500">{decision === 'refuse' ? 'Motif (obligatoire, ≥ 20 caractères)' : 'Commentaire (optionnel)'}</span>
            <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" placeholder={decision === 'refuse' ? 'Expliquez la raison du refus…' : 'Précisions éventuelles…'} />
            {decision === 'refuse' && <span className="mt-0.5 block text-right text-[10px] font-medium text-ink-400">{comment.trim().length}/20 caractères minimum</span>}
          </label>
        </div>
      </Modal>
    </div>
  );
}
