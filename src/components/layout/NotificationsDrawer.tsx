import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Inbox, ShieldAlert, Sparkles, type LucideIcon } from 'lucide-react';
import { Drawer } from '../ui/overlays';
import { Brand } from '../ui/Brand';
import { useDirectory } from '../../store/useDirectory';
import { useRequests } from '../../store/useRequests';
import { employeeAlerts, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

type Tone = 'danger' | 'warn' | 'info' | 'amber';

export interface Notif {
  id: string;
  kind: 'expiry' | 'request' | 'compliance' | 'prophet';
  icon: LucideIcon;
  title: string;
  body: string;
  link?: string;
  tone: Tone;
}

const TONE_DOT: Record<Tone, string> = { danger: 'bg-danger', warn: 'bg-warn', info: 'bg-info', amber: 'bg-amber' };

/** Notifications dérivées de l'état réel (alertes d'expiration, demandes…). */
export function useNotifications(): Notif[] {
  const employees = useDirectory((s) => s.employees);
  const requests = useRequests((s) => s.requests);

  return useMemo(() => {
    const list: Notif[] = [];
    for (const e of employees) {
      for (const a of employeeAlerts(e)) {
        list.push({
          id: `exp-${e.id}-${a.label}`,
          kind: 'expiry',
          icon: CalendarClock,
          title: `${a.label} — ${employeeName(e)}`,
          body: `Échéance le ${new Date(`${a.date}T00:00:00`).toLocaleDateString('fr-FR')} · ${a.daysLeft <= 0 ? 'expiré' : `J-${a.daysLeft}`}`,
          link: `/collaborateurs/${e.id}`,
          tone: a.urgency === 'critical' ? 'danger' : a.urgency === 'soon' ? 'warn' : 'info',
        });
      }
    }
    for (const r of requests.filter((x) => x.status === 'pending')) {
      const emp = employees.find((x) => x.id === r.employeeId);
      list.push({
        id: `req-${r.id}`,
        kind: 'request',
        icon: Inbox,
        title: 'Demande de modification',
        body: `${emp ? employeeName(emp) : 'Collaborateur'} · ${r.fieldLabel}`,
        link: '/collaborateurs/demandes',
        tone: 'info',
      });
    }
    list.push({
      id: 'cmp-1',
      kind: 'compliance',
      icon: ShieldAlert,
      title: 'Conformité — heures supplémentaires',
      body: 'Une demande dépassant le plafond légal a été bloquée.',
      link: '/conformite',
      tone: 'warn',
    });
    list.push({
      id: 'prophet-1',
      kind: 'prophet',
      icon: Sparkles,
      title: 'Suggestion Proph3t',
      body: 'Pic d’absentéisme anticipé autour des ponts de mai.',
      link: '/temps',
      tone: 'amber',
    });
    return list;
  }, [employees, requests]);
}

export function NotificationsDrawer({ open, onClose, notifications }: { open: boolean; onClose: () => void; notifications: Notif[] }) {
  const navigate = useNavigate();
  const [read, setRead] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread' | 'expiry' | 'request'>('all');

  const shown = notifications.filter((n) => {
    if (filter === 'unread') return !read.has(n.id);
    if (filter === 'expiry') return n.kind === 'expiry';
    if (filter === 'request') return n.kind === 'request';
    return true;
  });

  const openNotif = (n: Notif) => {
    setRead((s) => new Set(s).add(n.id));
    if (n.link) {
      navigate(n.link);
      onClose();
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Notifications" side="right">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {([['all', 'Toutes'], ['unread', 'Non lues'], ['expiry', 'Échéances'], ['request', 'Demandes']] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn('rounded-full border px-3 py-1 text-xs font-semibold transition-all', filter === k ? 'border-amber/40 bg-amber/12 text-amber-deep' : 'border-line text-ink-500 hover:text-ink')}
          >
            {label}
          </button>
        ))}
        <button onClick={() => setRead(new Set(notifications.map((n) => n.id)))} className="ml-auto text-xs font-semibold text-ink-400 hover:text-ink">
          Tout marquer lu
        </button>
      </div>
      <div className="space-y-2">
        {shown.length === 0 && <p className="py-8 text-center text-sm font-medium text-ink-400">Rien à signaler.</p>}
        {shown.map((n) => {
          const isRead = read.has(n.id);
          return (
            <button
              key={n.id}
              onClick={() => openNotif(n)}
              className={cn('flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors', isRead ? 'border-line bg-surface' : 'border-line bg-surface2 hover:bg-amber/[0.05]')}
            >
              <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', isRead ? 'bg-ink/15' : TONE_DOT[n.tone])} />
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.05] text-ink-500">
                <n.icon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {n.kind === 'prophet' ? <Brand name="Proph3t" className="mr-1 text-amber-deep" /> : null}
                  {n.kind === 'prophet' ? n.title.replace('Suggestion Proph3t', 'suggère') : n.title}
                </p>
                <p className="text-[12px] font-medium text-ink-500">{n.body}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Drawer>
  );
}
