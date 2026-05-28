import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, ArrowRight, Inbox } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatusPill } from '../components/ui/StatusPill';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/feedback';
import { useRequests } from '../store/useRequests';
import { useDirectory } from '../store/useDirectory';
import { employeeName } from '../data/mock';
import { cn } from '../lib/cn';

export function DemandesModifPage() {
  const { requests, decide } = useRequests();
  const employees = useDirectory((s) => s.employees);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const shown = requests.filter((r) => (filter === 'pending' ? r.status === 'pending' : true));
  const name = (id: string) => {
    const e = employees.find((x) => x.id === id);
    return e ? employeeName(e) : 'Collaborateur';
  };

  return (
    <div className="animate-fade-up">
      <Link to="/collaborateurs" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink">
        <ArrowLeft size={15} /> Collaborateurs
      </Link>

      <SectionHeader
        eyebrow="M1 · P1.8"
        title="Demandes de modification"
        description="Les changements proposés par les collaborateurs en self-service ne sont jamais écrits directement — ils passent par votre validation."
        action={
          <div className="flex rounded-xl border border-line bg-surface p-0.5">
            <Seg active={filter === 'pending'} onClick={() => setFilter('pending')}>En attente</Seg>
            <Seg active={filter === 'all'} onClick={() => setFilter('all')}>Toutes</Seg>
          </div>
        }
      />

      {shown.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title={`Aucune demande${filter === 'pending' ? ' en attente' : ''}.`}
            description="Les modifications proposées par les collaborateurs en self-service apparaîtront ici."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar name={name(r.employeeId)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{name(r.employeeId)}</p>
                  <p className="text-[11px] font-medium text-ink-400">{r.fieldLabel} · demandé le {new Date(r.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                {r.status === 'pending' ? (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => decide(r.id, 'approved')} className="inline-flex items-center gap-1 rounded-lg bg-ok/12 px-2.5 py-2 text-xs font-bold text-ok hover:bg-ok/20"><Check size={14} /> Approuver</button>
                    <button onClick={() => setRejectId(rejectId === r.id ? null : r.id)} className="inline-flex items-center gap-1 rounded-lg bg-danger/10 px-2.5 py-2 text-xs font-bold text-danger hover:bg-danger/20"><X size={14} /> Refuser</button>
                  </div>
                ) : (
                  <StatusPill tone={r.status === 'approved' ? 'ok' : 'danger'}>{r.status === 'approved' ? 'Approuvée' : 'Refusée'}</StatusPill>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-surface2 px-3.5 py-2.5 text-sm">
                <span className="font-semibold text-ink-400 line-through">{r.currentValue || '—'}</span>
                <ArrowRight size={14} className="text-amber-deep" />
                <span className="font-bold text-ink">{r.proposedValue}</span>
              </div>

              {r.status === 'rejected' && r.reason && (
                <p className="mt-2 text-[11px] font-medium text-danger">Motif : {r.reason}</p>
              )}

              {rejectId === r.id && r.status === 'pending' && (
                <div className="mt-3 flex items-center gap-2">
                  <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif du refus (obligatoire)" className="h-9 flex-1 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none" />
                  <Button variant="danger" size="sm" disabled={!reason} onClick={() => { decide(r.id, 'rejected', reason); setReason(''); setRejectId(null); }}>
                    Confirmer le refus
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Seg({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition-all', active ? 'bg-amber text-night' : 'text-ink-500 hover:text-ink')}>
      {children}
    </button>
  );
}
