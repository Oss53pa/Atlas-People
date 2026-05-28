import { useEffect, useMemo, useState } from 'react';
import { UserCog, Plus, AlertTriangle, ShieldCheck, History, X } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Modal } from '../../components/ui/overlays';
import { EmptyState } from '../../components/ui/feedback';
import { useToast } from '../../components/ui/Toast';
import { SettingsSubNav } from '../../components/mss/SettingsSubNav';
import { useSurface } from '../../store/useSurface';
import {
  SEED_DELEGATIONS, DELEGATION_HISTORY, DELEGATION_SCOPE, DELEGATION_REASONS, DELEGATE_SUGGESTIONS,
  DELEGATION_STATUS_META, MAX_DELEGATION_DAYS, daysBetween, frDate, type Delegation,
} from '../../lib/mss/settings';

export function SettingsDelegationsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);
  const { toast } = useToast();

  const [list, setList] = useState<Delegation[]>(SEED_DELEGATIONS);
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('2026-07-15');
  const [to, setTo] = useState('2026-07-31');
  const [reason, setReason] = useState(DELEGATION_REASONS[0]);
  const [delegate, setDelegate] = useState(DELEGATE_SUGGESTIONS[0].name);
  const [scope, setScope] = useState<Set<string>>(new Set(DELEGATION_SCOPE.filter((s) => !s.recommendedOff).map((s) => s.key)));
  const [message, setMessage] = useState('');

  const duration = useMemo(() => daysBetween(from, to) + 1, [from, to]);
  const tooLong = duration > MAX_DELEGATION_DAYS;
  const invalid = duration <= 0 || tooLong;

  const toggleScope = (k: string) => setScope((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const submit = () => {
    setList((l) => [...l, {
      id: `dg${Date.now()}`, from, to, toRelation: DELEGATE_SUGGESTIONS.find((d) => d.name === delegate)?.relation ?? 'Pair manager',
      reason, scope: [...scope], status: 'pending', message: message.trim() || undefined,
    }]);
    setOpen(false); setMessage('');
    toast({ variant: 'success', title: 'Demande envoyée', description: `${delegate} doit accepter la délégation. Vos N-1 seront notifiés.` });
  };
  const revoke = (id: string) => {
    setList((l) => l.map((d) => (d.id === id ? { ...d, status: 'revoked' } : d)));
    toast({ variant: 'info', title: 'Délégation révoquée', description: 'Le délégué est notifié. Retour automatique au titulaire.' });
  };

  const active = list.filter((d) => d.status === 'active');
  const scheduled = list.filter((d) => d.status === 'pending' || d.status === 'accepted');

  const DelegationCard = ({ d }: { d: Delegation }) => {
    const meta = DELEGATION_STATUS_META[d.status];
    return (
      <Card className="border-line">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-ink">Du {frDate(d.from)} au {frDate(d.to)} <span className="font-medium text-ink-500">({d.reason})</span></p>
            <p className="mt-0.5 text-[13px] font-medium text-ink-600">Délégué à : {d.toRelation}</p>
          </div>
          <StatusPill tone={meta.tone} dot={false}>{meta.label}</StatusPill>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DELEGATION_SCOPE.map((s) => (
            <span key={s.key} className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${d.scope.includes(s.key) ? 'bg-info/12 text-info' : 'bg-surface2 text-ink-300 line-through'}`}>{s.label}</span>
          ))}
        </div>
        {d.message && <p className="mt-2 rounded-xl bg-surface2 px-3 py-2 text-[12px] font-medium text-ink-600">{d.message}</p>}
        {d.status !== 'revoked' && (
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => revoke(d.id)}><X size={13} /> Révoquer</Button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="animate-fade-up space-y-5">
      <SettingsSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Délégations temporaires</h1>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Nouvelle délégation</Button>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-ink-400">Active</p>
        {active.length === 0 ? <Card><EmptyState icon={UserCog} title="Aucune délégation active" description="Aucune délégation n’est active actuellement." /></Card> : active.map((d) => <DelegationCard key={d.id} d={d} />)}
      </div>

      {scheduled.length > 0 && (
        <div className="space-y-3">
          <p className="text-[12px] font-bold uppercase tracking-wider text-ink-400">Programmées</p>
          {scheduled.map((d) => <DelegationCard key={d.id} d={d} />)}
        </div>
      )}

      <Card>
        <CardHeader title="Historique" action={<History size={16} className="text-ink-400" />} />
        <div className="space-y-2">
          {DELEGATION_HISTORY.map((h, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2 text-[13px] font-medium text-ink-700">
              <span>{h.period} — {h.who}</span><span className="text-ink-400">{h.reason}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-info" /> Audit fort : chaque action du délégué est tracée avec « délégué par vous » (decided_by + delegated_by + hash SHA-256). Délégué obligatoirement manager de niveau équivalent ou supérieur ; maximum {MAX_DELEGATION_DAYS} jours.</p>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle délégation" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Annuler</Button><Button size="sm" onClick={submit} disabled={invalid}>Envoyer la demande</Button></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[12px] font-semibold text-ink-500">Du</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" /></label>
            <label className="block"><span className="text-[12px] font-semibold text-ink-500">Au</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" /></label>
          </div>
          {tooLong && <p className="flex items-center gap-1.5 text-[12px] font-semibold text-danger"><AlertTriangle size={13} /> Durée {duration} j &gt; {MAX_DELEGATION_DAYS} j maximum. Au-delà : changement de manager formel via la RH.</p>}

          <div>
            <span className="text-[12px] font-semibold text-ink-500">Motif</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {DELEGATION_REASONS.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-surface2 px-3 py-1.5 text-sm font-medium text-ink-700">
                  <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-info" /> {r}
                </label>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-[12px] font-semibold text-ink-500">Délégué (manager de niveau ≥)</span>
            <select value={delegate} onChange={(e) => setDelegate(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30">
              {DELEGATE_SUGGESTIONS.map((d) => <option key={d.id} value={d.name}>{d.name} — {d.relation}</option>)}
            </select>
          </label>

          <div>
            <span className="text-[12px] font-semibold text-ink-500">Portée de la délégation</span>
            <div className="mt-1.5 space-y-1.5">
              {DELEGATION_SCOPE.map((s) => (
                <label key={s.key} className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
                  <input type="checkbox" checked={scope.has(s.key)} onChange={() => toggleScope(s.key)} className="accent-info" /> {s.label}
                  {s.recommendedOff && <span className="ml-auto text-[11px] font-semibold text-warn">recommandé : non délégué</span>}
                </label>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-[12px] font-semibold text-ink-500">Message au délégué (optionnel)</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" />
          </label>

          <p className="flex items-start gap-1.5 text-[11px] font-medium text-ink-500"><AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-deep" /> La délégation devra être acceptée par le délégué. Toutes ses actions seront tracées en votre nom.</p>
        </div>
      </Modal>
    </div>
  );
}
