import { useEffect, useMemo, useState } from 'react';
import { Inbox, Calendar, MessageSquare, ArrowUpRight, Clock, Check, Wifi } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/overlays';
import { EmptyState } from '../../components/ui/feedback';
import { useToast } from '../../components/ui/Toast';
import { DailySubNav } from '../../components/mss/DailySubNav';
import { useSurface } from '../../store/useSurface';
import { useServiceRequests, type ServiceRequest } from '../../store/useServiceRequests';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeamIds } from '../../lib/mss/scope';
import { employeeName, employeeById } from '../../data/mock';
import { isBackendConfigured, useTeamServiceRequests } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';
import { mockEmpId } from '../../lib/m1/roster';

const TODAY = '2026-05-28';
const daysSince = (iso: string) => Math.round((new Date(`${TODAY}T00:00:00`).getTime() - new Date(`${iso}T00:00:00`).getTime()) / 86400000);
const CAT_LABEL: Record<string, string> = { career: 'RDV de carrière', time: 'Question temps', document: 'Document', remuneration: 'Rémunération', administrative: 'Administratif', rgpd: 'RGPD' };
const frDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');
const URGENCY_TONE: Record<string, 'danger' | 'amber' | 'info'> = { high: 'danger', urgent: 'danger', medium: 'amber', normal: 'info', low: 'info' };
const SR_STATUS_TONE: Record<string, 'ok' | 'amber' | 'info' | 'danger'> = { submitted: 'amber', in_progress: 'info', info_requested: 'info', resolved: 'ok', closed: 'ok', refused: 'danger' };

export function TeamRequestsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const allRequests = useServiceRequests((s) => s.requests);
  const depth = useManagerScope((s) => s.depth);
  const teamIds = useMemo(() => scopedTeamIds(depth, employees), [depth, employees]);

  // ── Couche LIVE : demandes RH de l'équipe lues en base Supabase. ──
  const { data: ctx } = useSessionContext();
  const { data: liveRequests } = useTeamServiceRequests(ctx?.tenantId);
  const liveTeamRequests = useMemo(
    () => (liveRequests ?? []).filter((r) => teamIds.has(mockEmpId(r.requester_employee_id))),
    [liveRequests, teamIds],
  );
  const useLive = isBackendConfigured && liveTeamRequests.length > 0;

  // Sollicitations destinées au manager (carrière / temps), hors files dédiées.
  const requests = allRequests.filter((r) => teamIds.has(r.employeeId) && (r.category === 'career' || r.category === 'time')
    && (r.status === 'submitted' || r.status === 'in_progress' || r.status === 'info_requested'));

  const [replyTo, setReplyTo] = useState<ServiceRequest | null>(null);
  const [reply, setReply] = useState('');

  const sendReply = () => {
    if (!replyTo || reply.trim().length === 0) return;
    const emp = employeeById(replyTo.employeeId);
    setReplyTo(null);
    setReply('');
    toast({ variant: 'success', title: 'Réponse envoyée', description: `${emp ? employeeName(emp) : ''} — votre réponse est ajoutée au fil de la demande.` });
  };

  const escalate = (r: ServiceRequest) => {
    const emp = employeeById(r.employeeId);
    toast({ variant: 'info', title: 'Transférée à la RH', description: `${emp ? employeeName(emp) : ''} · ${CAT_LABEL[r.category]} — escaladée au référent RH.` });
  };

  // ── Rendu LIVE (base Supabase) : demandes RH de l'équipe en lecture. ──
  if (useLive) {
    return (
      <div className="animate-fade-up space-y-5">
        <DailySubNav />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink">Demandes de mon équipe</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600"><Wifi size={12} className="text-emerald-500" /> Live DB</span>
          </div>
          <StatusPill tone={liveTeamRequests.length > 0 ? 'amber' : 'ok'} dot={false}>{liveTeamRequests.length} sollicitation(s)</StatusPill>
        </div>

        <div className="space-y-3">
          {liveTeamRequests.map((r) => {
            const name = `${r.employee_first_name ?? ''} ${r.employee_last_name ?? ''}`.trim()
              || (() => { const emp = employeeById(mockEmpId(r.requester_employee_id)); return emp ? employeeName(emp) : '—'; })();
            return (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar name={name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-ink">{name}</p>
                      <StatusPill tone="info" dot={false}>{r.reference}</StatusPill>
                      <StatusPill tone={URGENCY_TONE[r.urgency] ?? 'info'} dot={false}>{r.urgency}</StatusPill>
                      <StatusPill tone={SR_STATUS_TONE[r.status] ?? 'neutral'} dot={false}>{r.status}</StatusPill>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-400"><Clock size={11} /> {frDate(r.created_at)}</span>
                    </div>
                    <p className="mt-1 text-[13px] font-semibold text-ink">{r.subject}</p>
                    <p className="mt-0.5 text-[12px] font-medium text-ink-500">{r.request_type_code}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <DailySubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Demandes de mon équipe</h1>
        <StatusPill tone={requests.length > 0 ? 'amber' : 'ok'} dot={false}>{requests.length} action(s) requise(s)</StatusPill>
      </div>

      {requests.length === 0 ? (
        <Card><EmptyState icon={Inbox} title="Aucune sollicitation" description="Aucune demande de vos N-1 en attente de réponse." /></Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const emp = employeeById(r.employeeId); if (!emp) return null;
            const age = daysSince(r.createdAt);
            return (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar name={employeeName(emp)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-ink">{employeeName(emp)}</p>
                      <StatusPill tone="info" dot={false}>{CAT_LABEL[r.category]}</StatusPill>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-400"><Clock size={11} /> il y a {age} j · SLA {Math.round(r.slaHours / 24)} j</span>
                    </div>
                    <p className="mt-1 text-[13px] font-semibold text-ink">{r.subject}</p>
                    <p className="mt-0.5 text-[12px] font-medium text-ink-500">{r.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setReplyTo(r); setReply(''); }}><MessageSquare size={13} /> Répondre</Button>
                  <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Créneau proposé', description: `${employeeName(emp)} — proposition de créneau envoyée.` })}><Calendar size={13} /> Proposer un créneau</Button>
                  <Button variant="ghost" size="sm" onClick={() => escalate(r)}><ArrowUpRight size={13} /> Transférer à RH</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={replyTo !== null} onClose={() => setReplyTo(null)} title="Répondre à la demande"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>Annuler</Button>
          <Button size="sm" onClick={sendReply} disabled={reply.trim().length === 0}><Check size={14} /> Envoyer</Button>
        </>}>
        <label className="block">
          <span className="text-[12px] font-semibold text-ink-500">Votre réponse (ajoutée au fil, tracée)</span>
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" placeholder="Votre message au collaborateur…" />
        </label>
      </Modal>
    </div>
  );
}
