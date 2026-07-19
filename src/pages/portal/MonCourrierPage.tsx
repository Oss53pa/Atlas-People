import { useEffect, useMemo, useState } from 'react';
import { Mail, FileSignature, Check, CalendarCheck, Archive, Download, ShieldCheck, Lock, Wifi } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { Drawer } from '../../components/ui/overlays';
import { EmptyState } from '../../components/ui/feedback';
import { useToast } from '../../components/ui/Toast';
import { useSurface } from '../../store/useSurface';
import { useCorrespondence, type Correspondence } from '../../store/useCorrespondence';
import { cn } from '../../lib/cn';
import {
  isBackendConfigured,
  useMyCorrespondence,
  useMarkCorrespondenceRead,
  useAcknowledgeCorrespondence,
  useSignCorrespondence,
  useArchiveCorrespondence,
  type CorrespondenceRow,
} from '../../lib/portal/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'amber' | 'neutral'> = { unread: 'amber', action_required: 'amber', read: 'neutral', signed: 'ok', acknowledged: 'ok', archived: 'neutral' };
const STATUS_LABEL: Record<string, string> = { unread: 'Non lu', action_required: 'Action requise', read: 'Lu', signed: 'Signé', acknowledged: 'Accusé', archived: 'Archivé' };

const CORR_TYPE_LABEL: Record<string, string> = {
  warning: 'Avertissement', notice: 'Notification', convocation: 'Convocation', contract: 'Contrat',
  amendment: 'Avenant', certificate: 'Attestation', payslip: 'Bulletin de paie', decision: 'Décision',
  information: 'Information', summons: 'Convocation',
};
const SENDER_LABEL: Record<string, string> = {
  hr: 'Ressources Humaines', drh: 'DRH', manager: 'Manager', direction: 'Direction',
  occupational_doctor: 'Médecine du travail', payroll: 'Paie', system: 'Système',
};
const corrTypeLabel = (t: string) => CORR_TYPE_LABEL[t] ?? t;
const senderLabel = (s: string) => SENDER_LABEL[s] ?? s;

const TABS = [{ key: 'inbox', label: 'Boîte de réception' }, { key: 'action', label: 'À traiter' }, { key: 'archived', label: 'Archives' }];

function rank(c: Correspondence): number {
  if (c.status === 'action_required') return 0;
  if (c.status === 'unread') return 1;
  return 2;
}

function rankLive(c: CorrespondenceRow): number {
  if (c.status === 'action_required') return 0;
  if (c.status === 'unread') return 1;
  return 2;
}

export function MonCourrierPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);

  const { toast } = useToast();
  const { data: ctx } = useSessionContext();
  const SELF_ID = ctx?.employeeId ?? 'e2';
  const items = useCorrespondence((s) => s.items).filter((c) => c.employeeId === SELF_ID);
  const markRead = useCorrespondence((s) => s.markRead);
  const sign = useCorrespondence((s) => s.sign);
  const acknowledge = useCorrespondence((s) => s.acknowledge);
  const confirmAttendance = useCorrespondence((s) => s.confirmAttendance);
  const archive = useCorrespondence((s) => s.archive);

  const { data: liveItems } = useMyCorrespondence(ctx?.tenantId, ctx?.employeeId);
  const markReadLive = useMarkCorrespondenceRead();
  const acknowledgeLive = useAcknowledgeCorrespondence();
  const signLive = useSignCorrespondence();
  const archiveLive = useArchiveCorrespondence();

  const [tab, setTab] = useState('inbox');
  const [openId, setOpenId] = useState<string | null>(null);

  const isLive = isBackendConfigured && !!liveItems && liveItems.length > 0;

  const shownLive = useMemo(() => (liveItems ?? []).filter((c) =>
    tab === 'archived' ? c.status === 'archived'
      : tab === 'action' ? c.status === 'action_required'
      : c.status !== 'archived',
  ).sort((a, b) => rankLive(a) - rankLive(b) || (a.delivered_at < b.delivered_at ? 1 : -1)), [liveItems, tab]);

  const shown = useMemo(() => items.filter((c) =>
    tab === 'archived' ? c.status === 'archived'
      : tab === 'action' ? c.status === 'action_required'
      : c.status !== 'archived',
  ).sort((a, b) => rank(a) - rank(b) || (a.deliveredAt < b.deliveredAt ? 1 : -1)), [items, tab]);

  const open = (id: string) => { markRead(id); setOpenId(id); };
  const detail = items.find((c) => c.id === openId) ?? null;

  // ── Live variant ─────────────────────────────────────────────────────
  const openLive = (row: CorrespondenceRow) => {
    if (row.status === 'unread' || row.status === 'action_required') {
      markReadLive.mutate(row.id, {
        onError: (e) => toast({ variant: 'error', title: 'Erreur', description: (e as Error).message }),
      });
    }
    setOpenId(row.id);
  };
  const detailLive = (liveItems ?? []).find((c) => c.id === openId) ?? null;

  if (isLive) {
    return (
      <div className="animate-fade-up space-y-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
            Mon courrier
            <Wifi size={13} className="text-emerald-500" />
          </h1>
          <p className="text-sm font-medium text-ink-500">Correspondance officielle — preuve de lecture & de signature · Live DB</p>
        </div>
        <Tabs tabs={TABS} value={tab} onChange={setTab} />

        {shownLive.length > 0 ? (
          <div className="space-y-2">
            {shownLive.map((c) => {
              const unread = c.status === 'unread' || c.status === 'action_required';
              const locked = c.confidentiality_level && c.confidentiality_level !== 'normal';
              return (
                <button key={c.id} onClick={() => openLive(c)} className="w-full text-left">
                  <Card className={cn('card-hover cursor-pointer', c.status === 'action_required' && 'border-amber/30')}>
                    <div className="flex items-center gap-3">
                      <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', unread ? 'bg-amber' : 'bg-transparent')} />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.05] text-ink-500">{c.requires_signature ? <FileSignature size={16} /> : <Mail size={16} />}</span>
                      <div className="min-w-0 flex-1">
                        <p className={cn('flex items-center gap-1.5 truncate text-sm', unread ? 'font-bold text-ink' : 'font-semibold text-ink-700')}>
                          {locked && <Lock size={12} className="shrink-0 text-ink-400" />}
                          {c.subject}
                        </p>
                        <p className="truncate text-[11px] font-medium text-ink-400">{corrTypeLabel(c.correspondence_type)} · {senderLabel(c.sender_type)} · {frDate(c.delivered_at.slice(0, 10))}</p>
                      </div>
                      <StatusPill tone={STATUS_TONE[c.status] ?? 'neutral'} dot={false}>{STATUS_LABEL[c.status] ?? c.status}</StatusPill>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        ) : <Card><EmptyState icon={Mail} title="Aucun courrier" description="Votre correspondance officielle apparaîtra ici." /></Card>}

        <Drawer open={!!detailLive} onClose={() => setOpenId(null)} title={detailLive ? corrTypeLabel(detailLive.correspondence_type) : undefined}>
          {detailLive && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">{detailLive.subject}</h2>
                <p className="text-[11px] font-medium text-ink-400">{senderLabel(detailLive.sender_type)} · {frDate(detailLive.delivered_at.slice(0, 10))}</p>
                <div className="mt-1"><StatusPill tone={STATUS_TONE[detailLive.status] ?? 'neutral'} dot={false}>{STATUS_LABEL[detailLive.status] ?? detailLive.status}</StatusPill></div>
              </div>
              <div className="rounded-2xl border border-line bg-surface2 p-4 text-sm font-medium leading-relaxed text-ink-700">{detailLive.body}</div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Téléchargement', description: `${detailLive.subject}.pdf` })}><Download size={14} /> Télécharger</Button>
                {detailLive.requires_signature && detailLive.status !== 'signed' && (
                  <Button size="sm" onClick={() => signLive.mutate(detailLive.id, {
                    onSuccess: () => toast({ variant: 'success', title: 'Document signé', description: 'Signature électronique ADVIST horodatée.' }),
                    onError: (e) => toast({ variant: 'error', title: 'Erreur', description: (e as Error).message }),
                  })}><FileSignature size={14} /> Signer (ADVIST)</Button>
                )}
                {detailLive.requires_acknowledgment && detailLive.status !== 'acknowledged' && (
                  <Button size="sm" onClick={() => acknowledgeLive.mutate(detailLive.id, {
                    onSuccess: () => toast({ variant: 'success', title: 'Accusé de réception', description: 'Horodaté et tracé.' }),
                    onError: (e) => toast({ variant: 'error', title: 'Erreur', description: (e as Error).message }),
                  })}><Check size={14} /> Accuser réception</Button>
                )}
                {detailLive.requires_attendance_confirmation && !detailLive.attendance_confirmed_at && (
                  <Button size="sm" onClick={() => acknowledgeLive.mutate(detailLive.id, {
                    onSuccess: () => toast({ variant: 'success', title: 'Présence confirmée', description: 'L\'expéditeur est informé.' }),
                    onError: (e) => toast({ variant: 'error', title: 'Erreur', description: (e as Error).message }),
                  })}><CalendarCheck size={14} /> Confirmer ma présence</Button>
                )}
                {detailLive.status !== 'archived' && (
                  <Button variant="ghost" size="sm" onClick={() => archiveLive.mutate(detailLive.id, {
                    onSuccess: () => { setOpenId(null); toast({ variant: 'info', title: 'Archivé', description: 'Déplacé vers vos archives.' }); },
                    onError: (e) => toast({ variant: 'error', title: 'Erreur', description: (e as Error).message }),
                  })}><Archive size={14} /> Archiver</Button>
                )}
              </div>

              {(detailLive.signed_at || detailLive.acknowledged_at || detailLive.attendance_confirmed_at || detailLive.first_read_at) && (
                <div className="rounded-xl border border-ok/25 bg-ok/[0.05] p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ok"><ShieldCheck size={12} /> Traçabilité</p>
                  <div className="space-y-0.5 text-[12px] font-medium text-ink-700">
                    {detailLive.first_read_at && <p>Lu le {new Date(detailLive.first_read_at).toLocaleString('fr-FR')}</p>}
                    {detailLive.signed_at && <p>Signé le {new Date(detailLive.signed_at).toLocaleString('fr-FR')} (ADVIST)</p>}
                    {detailLive.acknowledged_at && <p>Accusé de réception le {new Date(detailLive.acknowledged_at).toLocaleString('fr-FR')}</p>}
                    {detailLive.attendance_confirmed_at && <p>Présence confirmée le {new Date(detailLive.attendance_confirmed_at).toLocaleString('fr-FR')}</p>}
                  </div>
                </div>
              )}
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-400"><Lock size={11} /> Courrier officiel conservé selon les durées légales — non supprimable.</p>
            </div>
          )}
        </Drawer>
      </div>
    );
  }

  // ── Fallback : rendu store/mock (hors-ligne) ─────────────────────────
  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Mon courrier</h1>
        <p className="text-sm font-medium text-ink-500">Correspondance officielle — preuve de lecture & de signature</p>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {shown.length > 0 ? (
        <div className="space-y-2">
          {shown.map((c) => {
            const unread = c.status === 'unread' || c.status === 'action_required';
            return (
              <button key={c.id} onClick={() => open(c.id)} className="w-full text-left">
                <Card className={cn('card-hover cursor-pointer', c.status === 'action_required' && 'border-amber/30')}>
                  <div className="flex items-center gap-3">
                    <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', unread ? 'bg-amber' : 'bg-transparent')} />
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.05] text-ink-500">{c.requiresSignature ? <FileSignature size={16} /> : <Mail size={16} />}</span>
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate text-sm', unread ? 'font-bold text-ink' : 'font-semibold text-ink-700')}>{c.subject}</p>
                      <p className="truncate text-[11px] font-medium text-ink-400">{c.typeLabel} · {c.senderName} · {frDate(c.deliveredAt)}</p>
                    </div>
                    <StatusPill tone={STATUS_TONE[c.status]} dot={false}>{STATUS_LABEL[c.status]}</StatusPill>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      ) : <Card><EmptyState icon={Mail} title="Aucun courrier" description="Votre correspondance officielle apparaîtra ici." /></Card>}

      <Drawer open={!!detail} onClose={() => setOpenId(null)} title={detail?.typeLabel}>
        {detail && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">{detail.subject}</h2>
              <p className="text-[11px] font-medium text-ink-400">{detail.senderName} · {frDate(detail.deliveredAt)} · {detail.reference}</p>
              <div className="mt-1"><StatusPill tone={STATUS_TONE[detail.status]} dot={false}>{STATUS_LABEL[detail.status]}</StatusPill></div>
            </div>
            <div className="rounded-2xl border border-line bg-surface2 p-4 text-sm font-medium leading-relaxed text-ink-700">{detail.body}</div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Téléchargement', description: `${detail.reference}.pdf` })}><Download size={14} /> Télécharger</Button>
              {detail.requiresSignature && detail.status !== 'signed' && (
                <Button size="sm" onClick={() => { sign(detail.id); toast({ variant: 'success', title: 'Document signé', description: 'Signature électronique ADVIST horodatée.' }); }}><FileSignature size={14} /> Signer (ADVIST)</Button>
              )}
              {detail.requiresAcknowledgment && detail.status !== 'acknowledged' && (
                <Button size="sm" onClick={() => { acknowledge(detail.id); toast({ variant: 'success', title: 'Accusé de réception', description: 'Horodaté et tracé.' }); }}><Check size={14} /> Accuser réception</Button>
              )}
              {detail.requiresAttendance && detail.status !== 'acknowledged' && (
                <Button size="sm" onClick={() => { confirmAttendance(detail.id); toast({ variant: 'success', title: 'Présence confirmée', description: 'L\'expéditeur est informé.' }); }}><CalendarCheck size={14} /> Confirmer ma présence</Button>
              )}
              {detail.status !== 'archived' && (
                <Button variant="ghost" size="sm" onClick={() => { archive(detail.id); setOpenId(null); toast({ variant: 'info', title: 'Archivé', description: 'Déplacé vers vos archives.' }); }}><Archive size={14} /> Archiver</Button>
              )}
            </div>

            {(detail.signedAt || detail.acknowledgedAt || detail.attendanceConfirmedAt || detail.firstReadAt) && (
              <div className="rounded-xl border border-ok/25 bg-ok/[0.05] p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ok"><ShieldCheck size={12} /> Traçabilité</p>
                <div className="space-y-0.5 text-[12px] font-medium text-ink-700">
                  {detail.firstReadAt && <p>Lu le {new Date(detail.firstReadAt).toLocaleString('fr-FR')}</p>}
                  {detail.signedAt && <p>Signé le {new Date(detail.signedAt).toLocaleString('fr-FR')} (ADVIST)</p>}
                  {detail.acknowledgedAt && <p>Accusé de réception le {new Date(detail.acknowledgedAt).toLocaleString('fr-FR')}</p>}
                  {detail.attendanceConfirmedAt && <p>Présence confirmée le {new Date(detail.attendanceConfirmedAt).toLocaleString('fr-FR')}</p>}
                </div>
              </div>
            )}
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-400"><Lock size={11} /> Courrier officiel conservé selon les durées légales — non supprimable.</p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
