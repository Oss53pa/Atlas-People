import { useEffect, useState } from 'react';
import { Mail, Zap, Check, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/overlays';
import { useToast } from '../../components/ui/Toast';
import { DailySubNav } from '../../components/mss/DailySubNav';
import { useSurface } from '../../store/useSurface';
import { managerMail, MAIL_KIND_META, frDate, type ManagerMail } from '../../lib/mss/daily';

const TABS = [
  { key: 'unread', label: 'Non lus' },
  { key: 'action', label: 'Action requise' },
  { key: 'all', label: 'Tous' },
];

export function ManagerCorrespondencePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const mail = managerMail();
  const [tab, setTab] = useState('unread');
  const [open, setOpen] = useState<ManagerMail | null>(null);

  const shown = mail.filter((m) => tab === 'unread' ? !m.read : tab === 'action' ? !!m.actionRequired : true);

  return (
    <div className="animate-fade-up space-y-5">
      <DailySubNav />
      <h1 className="text-2xl font-semibold text-ink">Mon courrier managérial</h1>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <div className="space-y-2">
        {shown.map((m) => {
          const meta = MAIL_KIND_META[m.kind];
          return (
            <Card key={m.id} className="card-hover cursor-pointer" >
              <button className="flex w-full items-start gap-3 text-left" onClick={() => setOpen(m)}>
                {!m.read ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-info" /> : <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink-300" />}
                <Mail size={16} className="mt-0.5 shrink-0 text-ink-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={meta.tone} dot={false}>{meta.label}</StatusPill>
                    <p className={`text-sm ${m.read ? 'font-medium text-ink-600' : 'font-bold text-ink'}`}>{m.subject}</p>
                  </div>
                  <p className="mt-0.5 text-[12px] font-medium text-ink-500">{m.from} · {frDate(m.date)}</p>
                  {m.actionRequired && <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-deep"><Zap size={12} /> {m.actionRequired}</p>}
                </div>
              </button>
            </Card>
          );
        })}
      </div>

      <Card>
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-info" /> Boîte officielle managériale, distincte de votre courrier employé. Audit chaîné SHA-256, accusé de réception et conservation identiques au courrier officiel.</p>
      </Card>

      <Modal open={open !== null} onClose={() => setOpen(null)} title={open?.subject} size="lg"
        footer={open?.actionRequired ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(null)}>Fermer</Button>
            <Button size="sm" onClick={() => { setOpen(null); toast({ variant: 'success', title: 'Présence confirmée', description: 'Votre confirmation a été enregistrée et un accusé de réception émis.' }); }}><Check size={14} /> Confirmer ma présence</Button>
          </>
        ) : (
          <Button size="sm" onClick={() => { setOpen(null); toast({ variant: 'info', title: 'Accusé de réception', description: 'Lecture enregistrée (audit chaîné).' }); }}>Accuser réception</Button>
        )}>
        {open && (
          <div className="space-y-2">
            <p className="text-[12px] font-medium text-ink-500">{open.from} · {frDate(open.date)}</p>
            <p className="text-sm font-medium text-ink-700">{open.body}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
