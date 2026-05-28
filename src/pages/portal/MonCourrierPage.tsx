import { useEffect, useMemo, useState } from 'react';
import { Mail, FileSignature, Check, CalendarCheck, Archive, Download, ShieldCheck, Lock } from 'lucide-react';
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

const SELF_ID = 'e2';
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'amber' | 'neutral'> = { unread: 'amber', action_required: 'amber', read: 'neutral', signed: 'ok', acknowledged: 'ok', archived: 'neutral' };
const STATUS_LABEL: Record<string, string> = { unread: 'Non lu', action_required: 'Action requise', read: 'Lu', signed: 'Signé', acknowledged: 'Accusé', archived: 'Archivé' };

const TABS = [{ key: 'inbox', label: 'Boîte de réception' }, { key: 'action', label: 'À traiter' }, { key: 'archived', label: 'Archives' }];

function rank(c: Correspondence): number {
  if (c.status === 'action_required') return 0;
  if (c.status === 'unread') return 1;
  return 2;
}

export function MonCourrierPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);

  const { toast } = useToast();
  const items = useCorrespondence((s) => s.items).filter((c) => c.employeeId === SELF_ID);
  const markRead = useCorrespondence((s) => s.markRead);
  const sign = useCorrespondence((s) => s.sign);
  const acknowledge = useCorrespondence((s) => s.acknowledge);
  const confirmAttendance = useCorrespondence((s) => s.confirmAttendance);
  const archive = useCorrespondence((s) => s.archive);

  const [tab, setTab] = useState('inbox');
  const [openId, setOpenId] = useState<string | null>(null);

  const shown = useMemo(() => items.filter((c) =>
    tab === 'archived' ? c.status === 'archived'
      : tab === 'action' ? c.status === 'action_required'
      : c.status !== 'archived',
  ).sort((a, b) => rank(a) - rank(b) || (a.deliveredAt < b.deliveredAt ? 1 : -1)), [items, tab]);

  const open = (id: string) => { markRead(id); setOpenId(id); };
  const detail = items.find((c) => c.id === openId) ?? null;

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
