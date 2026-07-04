import { useEffect, useMemo, useState } from 'react';
import { Plus, Send, MessageCircle, Star, Inbox, Wifi } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { Modal, Drawer } from '../../components/ui/overlays';
import { EmptyState } from '../../components/ui/feedback';
import { FormField, Select, TextInput } from '../../components/ui/FormField';
import { useToast } from '../../components/ui/Toast';
import { useSurface } from '../../store/useSurface';
import { useServiceRequests, type RequestCategory } from '../../store/useServiceRequests';
import { cn } from '../../lib/cn';
import { useMyServiceRequests, useCreateServiceRequest, isBackendConfigured } from '../../lib/ess/serviceRequestsLive';
import { useSessionContext } from '../../lib/useSession';

const SELF_ID = 'e2';
const TODAY = '2026-05-28';

const CATEGORY_LABEL: Record<RequestCategory, string> = {
  document: 'Documents', remuneration: 'Rémunération', time: 'Temps & congés', career: 'Carrière & formation', administrative: 'Administratif', rgpd: 'Vie privée (RGPD)',
};
const TYPES: { code: string; label: string; category: RequestCategory }[] = [
  { code: 'DOC-ATT-TRAV', label: 'Attestation de travail', category: 'document' },
  { code: 'DOC-ATT-SAL', label: 'Attestation de salaire', category: 'document' },
  { code: 'DOC-ATT-VOY', label: 'Attestation pour voyage', category: 'document' },
  { code: 'DOC-BULLETIN', label: 'Duplicata de bulletin', category: 'document' },
  { code: 'REM-PRET', label: 'Demande de prêt employeur', category: 'remuneration' },
  { code: 'REM-AVANCE', label: 'Avance sur salaire', category: 'remuneration' },
  { code: 'TPS-INFO-SOLDE', label: 'Question sur mon solde de congés', category: 'time' },
  { code: 'TPS-REGUL-POINT', label: 'Régularisation de pointage', category: 'time' },
  { code: 'CAR-RDV-DEVEL', label: 'RDV de développement', category: 'career' },
  { code: 'CAR-MOBILITE', label: 'Souhait de mobilité interne', category: 'career' },
  { code: 'ADM-RDV-RH', label: 'RDV avec mon référent RH', category: 'administrative' },
  { code: 'ADM-QUESTION', label: 'Question générale', category: 'administrative' },
  { code: 'RGPD-EXPORT', label: 'Export de mes données', category: 'rgpd' },
];

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'info' | 'neutral'> = { submitted: 'warn', in_progress: 'warn', info_requested: 'info', resolved: 'ok', closed: 'neutral', refused: 'danger' };
const STATUS_LABEL: Record<string, string> = { submitted: 'Soumise', in_progress: 'En cours', info_requested: 'Action requise', resolved: 'Résolue', closed: 'Fermée', refused: 'Refusée' };

const TABS = [{ key: 'open', label: 'En cours' }, { key: 'action', label: 'Action requise' }, { key: 'resolved', label: 'Résolues' }, { key: 'all', label: 'Toutes' }];

export function MesDemandesPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);

  const { toast } = useToast();
  const { data: ctx } = useSessionContext();
  const { data: liveRequests } = useMyServiceRequests(ctx?.tenantId, ctx?.employeeId);
  const createLive = useCreateServiceRequest();
  const mockRequests = useServiceRequests((s) => s.requests).filter((r) => r.employeeId === SELF_ID);
  const requests = mockRequests;
  const create = useServiceRequests((s) => s.create);
  const addMessage = useServiceRequests((s) => s.addMessage);
  const rate = useServiceRequests((s) => s.rate);

  const [tab, setTab] = useState('open');
  const [newOpen, setNewOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  // Nouveau ticket
  const [category, setCategory] = useState<RequestCategory>('document');
  const [typeCode, setTypeCode] = useState('DOC-ATT-TRAV');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'important' | 'urgent'>('normal');
  const typesInCat = TYPES.filter((t) => t.category === category);

  const shown = useMemo(() => requests.filter((r) =>
    tab === 'open' ? ['submitted', 'in_progress', 'info_requested'].includes(r.status)
      : tab === 'action' ? r.status === 'info_requested'
      : tab === 'resolved' ? ['resolved', 'closed', 'refused'].includes(r.status) : true,
  ).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [requests, tab]);

  const detail = requests.find((r) => r.id === detailId) ?? null;

  const submitNew = async () => {
    const type = TYPES.find((t) => t.code === typeCode)!;
    if (isBackendConfigured) {
      // Live : Supabase source de vérité, identité résolue depuis la session.
      if (!ctx) {
        toast({ variant: 'error', title: 'Session requise', description: 'Connectez-vous pour envoyer une demande.' });
        return;
      }
      try {
        await createLive.mutateAsync({
          tenantId: ctx.tenantId, employeeId: ctx.employeeId,
          typeCode, subject: subject || type.label,
          description: description || subject || type.label,
          urgency,
        });
      } catch (e) {
        toast({ variant: 'error', title: "Échec de l'envoi", description: e instanceof Error ? e.message : 'Erreur inconnue.' });
        return;
      }
    } else {
      // Démo local : store Zustand.
      const seq = String(143 + mockRequests.length).padStart(4, '0');
      create({
        id: `req_${Date.now()}`, reference: `REQ-2026-${seq}`, employeeId: SELF_ID, typeCode, typeLabel: type.label, category,
        subject: subject || type.label, description, urgency, status: 'submitted', referent: 'Valentina Okou', createdAt: TODAY, slaHours: 48,
        messages: [{ id: `m_${Date.now()}`, author: 'employee', authorName: 'Moi', content: description || subject, at: new Date().toISOString() }],
      });
    }
    toast({ variant: 'success', title: 'Demande envoyée', description: `${type.label} — transmise à Valentina Okou.` });
    setNewOpen(false); setSubject(''); setDescription('');
  };

  const sendReply = () => {
    if (!detail || !reply.trim()) return;
    addMessage(detail.id, { id: `m_${Date.now()}`, author: 'employee', authorName: 'Moi', content: reply.trim(), at: new Date().toISOString() });
    setReply('');
  };

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Mes demandes</h1>
          <p className="text-sm font-medium text-ink-500">
            Vos sollicitations auprès des RH
            {isBackendConfigured && liveRequests && liveRequests.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> {liveRequests.length} en DB</span>
            )}
          </p>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)}><Plus size={14} /> Nouvelle demande</Button>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {shown.length > 0 ? (
        <div className="space-y-3">
          {shown.map((r) => (
            <button key={r.id} onClick={() => setDetailId(r.id)} className="w-full text-left">
              <Card className="card-hover cursor-pointer">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="mono rounded-md bg-ink/[0.05] px-1.5 py-0.5 text-[11px] font-bold text-ink-500">{r.reference}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{r.typeLabel}</p>
                    <p className="truncate text-[11px] font-medium text-ink-400">{r.subject} · {CATEGORY_LABEL[r.category]} · {r.referent}</p>
                  </div>
                  {r.actionRequired && r.status === 'info_requested' && <StatusPill tone="info" dot={false}><MessageCircle size={11} /> Action requise</StatusPill>}
                  <StatusPill tone={STATUS_TONE[r.status]} dot={false}>{STATUS_LABEL[r.status]}</StatusPill>
                </div>
              </Card>
            </button>
          ))}
        </div>
      ) : <Card><EmptyState icon={Inbox} title="Aucune demande" description="Vos demandes RH apparaîtront ici." /></Card>}

      {/* Nouvelle demande */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Nouvelle demande"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewOpen(false)}>Annuler</Button><Button size="sm" onClick={submitNew}><Send size={14} /> Envoyer</Button></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Catégorie" required>
              <Select value={category} onChange={(e) => { const c = e.target.value as RequestCategory; setCategory(c); setTypeCode(TYPES.find((t) => t.category === c)!.code); }}>
                {(Object.keys(CATEGORY_LABEL) as RequestCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </Select>
            </FormField>
            <FormField label="Type" required>
              <Select value={typeCode} onChange={(e) => setTypeCode(e.target.value)}>
                {typesInCat.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Sujet"><TextInput value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Résumé en quelques mots" /></FormField>
          <FormField label="Description" required>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none focus:ring-2 focus:ring-amber/15" placeholder="Détaillez votre demande…" />
          </FormField>
          <FormField label="Urgence">
            <Select value={urgency} onChange={(e) => setUrgency(e.target.value as 'normal' | 'important' | 'urgent')}>
              <option value="normal">Normale</option><option value="important">Importante</option><option value="urgent">Urgente</option>
            </Select>
          </FormField>
          <p className="text-[11px] font-medium text-ink-400">Sera traitée par votre référent RH : Valentina Okou.</p>
        </div>
      </Modal>

      {/* Détail */}
      <Drawer open={!!detail} onClose={() => setDetailId(null)} title={detail ? `${detail.reference} · ${detail.typeLabel}` : ''}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusPill tone={STATUS_TONE[detail.status]} dot={false}>{STATUS_LABEL[detail.status]}</StatusPill>
              <span className="text-[11px] font-medium text-ink-400">Soumise le {new Date(`${detail.createdAt}T00:00:00`).toLocaleDateString('fr-FR')} · {detail.referent}</span>
            </div>
            {detail.actionRequired && detail.status === 'info_requested' && (
              <div className="rounded-xl border border-info/30 bg-info/[0.06] p-3 text-[12px] font-semibold text-info"><MessageCircle size={13} className="mr-1 inline" /> {detail.actionRequired}</div>
            )}
            <div className="space-y-2">
              {detail.messages.map((m) => (
                <div key={m.id} className={cn('rounded-2xl px-3 py-2', m.author === 'employee' ? 'ml-6 bg-amber/[0.08]' : 'mr-6 bg-surface2')}>
                  <p className="text-[11px] font-bold text-ink-500">{m.authorName} · {new Date(m.at).toLocaleDateString('fr-FR')}</p>
                  <p className="text-sm font-medium text-ink-700">{m.content}</p>
                </div>
              ))}
            </div>
            {['submitted', 'in_progress', 'info_requested'].includes(detail.status) && (
              <div className="flex items-end gap-2">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Répondre…" className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none" />
                <Button size="sm" disabled={!reply.trim()} onClick={sendReply}><Send size={14} /></Button>
              </div>
            )}
            {detail.status === 'resolved' && (
              <div className="rounded-xl border border-line bg-surface2 p-3">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-400">Cette résolution vous a-t-elle satisfait ?</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => { rate(detail.id, n); toast({ variant: 'success', title: 'Merci', description: 'Votre évaluation est enregistrée.' }); }}>
                      <Star size={20} className={cn(detail.satisfaction && n <= detail.satisfaction ? 'fill-amber text-amber' : 'text-ink-300')} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
