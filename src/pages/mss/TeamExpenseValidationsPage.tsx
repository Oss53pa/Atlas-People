import { useEffect, useMemo, useState } from 'react';
import { Check, X, MessageCircle, CheckCheck, Paperclip, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/overlays';
import { EmptyState } from '../../components/ui/feedback';
import { useToast } from '../../components/ui/Toast';
import { DailySubNav } from '../../components/mss/DailySubNav';
import { useSurface } from '../../store/useSurface';
import { useExpenses, reportTotal, type ExpenseReport } from '../../store/useExpenses';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeamIds } from '../../lib/mss/scope';
import { checkPolicy, categoryByCode } from '../../lib/expenses/policy';
import { employeeName, employeeById } from '../../data/mock';

const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

export function TeamExpenseValidationsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const reports = useExpenses((s) => s.reports);
  const managerDecide = useExpenses((s) => s.managerDecide);
  const depth = useManagerScope((s) => s.depth);
  const teamIds = useMemo(() => scopedTeamIds(depth, employees), [depth, employees]);

  const pending = reports.filter((r) => teamIds.has(r.employeeId) && r.status === 'submitted');
  const total = pending.reduce((s, r) => s + reportTotal(r), 0);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchOpen, setBatchOpen] = useState(false);
  const [refuseId, setRefuseId] = useState<string | null>(null);
  const [refuseMotif, setRefuseMotif] = useState('');

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = pending.length > 0 && pending.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(pending.map((r) => r.id)));

  const validate = (r: ExpenseReport) => {
    const emp = employeeById(r.employeeId);
    managerDecide(r.id, 'manager_approved');
    toast({ variant: 'success', title: 'NDF validée', description: `${emp ? employeeName(emp) : ''} · ${r.reference} — transmise à la finance pour remboursement.` });
  };

  const runBatch = () => {
    const ids = [...selected];
    ids.forEach((id) => managerDecide(id, 'manager_approved'));
    setBatchOpen(false);
    setSelected(new Set());
    toast({ variant: 'success', title: `${ids.length} NDF validée(s)`, description: 'Chaque décision est journalisée séparément (R15) — transmises à la finance.' });
  };

  const confirmRefuse = () => {
    if (!refuseId || refuseMotif.trim().length < 20) return;
    const r = reports.find((x) => x.id === refuseId);
    const emp = r && employeeById(r.employeeId);
    managerDecide(refuseId, 'refused');
    setRefuseId(null);
    setRefuseMotif('');
    toast({ variant: 'warning', title: 'NDF refusée', description: `${emp ? employeeName(emp) : ''} — motif communiqué au collaborateur.` });
  };

  return (
    <div className="animate-fade-up space-y-5">
      <DailySubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Notes de frais à valider</h1>
        <div className="flex items-center gap-2">
          {selected.size > 0 && <Button size="sm" onClick={() => setBatchOpen(true)}><CheckCheck size={14} /> Valider en lot ({selected.size})</Button>}
          <StatusPill tone={pending.length > 0 ? 'amber' : 'ok'} dot={false}>{pending.length} en attente · {fcfa(total)}</StatusPill>
        </div>
      </div>

      {pending.length > 0 && (
        <label className="flex w-fit cursor-pointer items-center gap-2 text-[12px] font-semibold text-ink-500">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-line accent-info" /> Tout sélectionner ({pending.length})
        </label>
      )}

      {pending.length === 0 ? (
        <Card><EmptyState icon={Check} title="Rien à valider" description="Aucune note de frais en attente de votre validation." /></Card>
      ) : (
        <div className="space-y-3">
          {pending.map((r) => {
            const emp = employeeById(r.employeeId); if (!emp) return null;
            const breaches = r.lines.filter((l) => !checkPolicy(l.category, l.amount).withinPolicy);
            const missingReceipt = r.lines.some((l) => checkPolicy(l.category, l.amount).requiresReceipt && !l.hasReceipt);
            return (
              <Card key={r.id} className={selected.has(r.id) ? 'ring-1 ring-info/40' : undefined}>
                <div className="flex flex-wrap items-start gap-3">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="mt-1 h-4 w-4 shrink-0 rounded border-line accent-info" />
                  <Avatar name={employeeName(emp)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-ink">{r.reference} — {employeeName(emp)}</p>
                      <StatusPill tone="amber" dot={false}>{fcfa(reportTotal(r))}</StatusPill>
                    </div>
                    <p className="mt-0.5 text-[12px] font-medium text-ink-500">{r.title}{r.mission ? ` · ${r.mission}` : ''}</p>
                    <ul className="mt-1.5 space-y-0.5 text-[12px] font-medium text-ink-600">
                      {r.lines.map((l) => (
                        <li key={l.id} className="flex items-center justify-between">
                          <span>{categoryByCode(l.category).label} — {l.label}</span>
                          <span className="mono">{fcfa(l.amount)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] font-medium">
                      <span className={`inline-flex items-center gap-1 ${missingReceipt ? 'text-warn' : 'text-ink-400'}`}><Paperclip size={11} /> {missingReceipt ? 'Justificatif manquant' : 'Justificatifs joints'}</span>
                      {breaches.length > 0 ? <span className="inline-flex items-center gap-1 text-warn"><AlertTriangle size={11} /> {breaches.length} dépassement(s) de plafond</span> : <span className="inline-flex items-center gap-1 text-ok"><Check size={11} /> Conformité plafonds OK</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => validate(r)} className="rounded-lg bg-ok/12 p-2 text-ok hover:bg-ok/20" title="Valider"><Check size={16} /></button>
                    <button onClick={() => { setRefuseId(r.id); setRefuseMotif(''); }} className="rounded-lg bg-danger/10 p-2 text-danger hover:bg-danger/20" title="Refuser"><X size={16} /></button>
                    <button onClick={() => toast({ variant: 'info', title: 'Précisions demandées', description: `${employeeName(emp)} — le collaborateur est invité à compléter sa NDF.` })} className="rounded-lg bg-info/10 p-2 text-info hover:bg-info/20" title="Demander info"><MessageCircle size={16} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={batchOpen} onClose={() => setBatchOpen(false)} title={`Valider ${selected.size} note(s) de frais`}
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setBatchOpen(false)}>Annuler</Button>
          <Button size="sm" onClick={runBatch}><CheckCheck size={14} /> Valider tout</Button>
        </>}>
        <p className="flex items-start gap-2 rounded-xl bg-info/[0.06] px-3 py-2 text-[12px] font-medium text-ink-600"><ShieldCheck size={13} className="mt-0.5 shrink-0 text-info" /> Chaque décision est journalisée séparément (R15) : un enregistrement d’audit distinct par NDF, avec votre identité de décideur. Les NDF validées partent en validation finance.</p>
      </Modal>

      <Modal open={refuseId !== null} onClose={() => setRefuseId(null)} title="Refuser la note de frais"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setRefuseId(null)}>Annuler</Button>
          <Button variant="danger" size="sm" onClick={confirmRefuse} disabled={refuseMotif.trim().length < 20}>Confirmer le refus</Button>
        </>}>
        <label className="block">
          <span className="text-[12px] font-semibold text-ink-500">Motif du refus (obligatoire, transmis au collaborateur)</span>
          <textarea value={refuseMotif} onChange={(e) => setRefuseMotif(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-danger/30" placeholder="Expliquez le motif (justificatif manquant, dépassement non justifié…)." />
          <span className={`mt-1 block text-[11px] font-medium ${refuseMotif.trim().length < 20 ? 'text-danger' : 'text-ok'}`}>{refuseMotif.trim().length}/20 caractères minimum</span>
        </label>
      </Modal>
    </div>
  );
}
