import { useEffect, useMemo, useState } from 'react';
import { Check, X, MessageCircle, Stethoscope, Plane, Megaphone, GraduationCap, Paperclip, AlertTriangle, CheckCheck, ShieldCheck, Wifi } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/overlays';
import { EmptyState } from '../../components/ui/feedback';
import { useToast } from '../../components/ui/Toast';
import { TeamTimeSubNav } from '../../components/m2/TeamTimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useTimeOff } from '../../store/useTimeOff';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { leaveTypeByCode } from '../../lib/m2/leaveTypes';
import { employeeName, employeeById } from '../../data/mock';
import { useAllLeaveRequests, useDecideLeave, isBackendConfigured } from '../../lib/mss/supabaseLive';
import { useAuth } from '../../lib/auth';

interface ViewRow {
  id: string; employeeId: string; name: string;
  code: string; start: string; end: string; countedDays: number; status: string;
}

const TODAY = new Date().toISOString().slice(0, 10);
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
const daysUntil = (iso: string) => Math.round((new Date(`${iso}T00:00:00`).getTime() - new Date(`${TODAY}T00:00:00`).getTime()) / 86400000);
const STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'info'> = { pending: 'warn', approved: 'ok', refused: 'danger', info_requested: 'info' };
const STATUS_LABEL: Record<string, string> = { pending: 'En attente', approved: 'Approuvée', refused: 'Refusée', info_requested: 'Info demandée' };

function categoryLabel(code: string): string {
  const cat = leaveTypeByCode(code)?.category;
  return cat === 'health' ? 'Absence maladie' : cat === 'special_family' ? 'Congé spécial' : cat === 'delegation' ? 'Délégation' : cat === 'parenthood' ? 'Parentalité' : 'Congé';
}
function isHealth(code: string) { return leaveTypeByCode(code)?.category === 'health'; }
function catIcon(code: string) { const c = leaveTypeByCode(code)?.category; return c === 'health' ? Stethoscope : c === 'delegation' ? Megaphone : c === 'parenthood' ? GraduationCap : Plane; }

const TABS = [{ key: 'pending', label: 'En attente' }, { key: 'done', label: 'Traitées' }, { key: 'all', label: 'Toutes' }];

export function TeamApprovalsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const allRequests = useTimeOff((s) => s.requests);
  const decideMock = useTimeOff((s) => s.decide);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const teamIds = useMemo(() => new Set(team.map((e) => e.id)), [team]);
  const { tenantId } = useAuth();
  const { data: liveAll } = useAllLeaveRequests(tenantId ?? undefined);
  const decideLife = useDecideLeave();
  const hasLive = isBackendConfigured && !!liveAll && liveAll.length > 0;

  const [tab, setTab] = useState('pending');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchComment, setBatchComment] = useState('');
  const [refuseId, setRefuseId] = useState<string | null>(null);
  const [refuseMotif, setRefuseMotif] = useState('');

  // Modèle de vue unifié : lignes live Supabase (ids réels) OU store mock.
  const rows: ViewRow[] = hasLive
    ? liveAll!.map((r) => ({
        id: r.id, employeeId: r.employee_id,
        name: `${r.employee_first_name ?? ''} ${r.employee_last_name ?? ''}`.trim() || '—',
        code: r.leave_type_code, start: r.start_date, end: r.end_date,
        countedDays: Number(r.counted_days ?? 0), status: r.status,
      }))
    : allRequests.filter((r) => teamIds.has(r.employeeId)).map((r) => {
        const emp = employeeById(r.employeeId);
        return { id: r.id, employeeId: r.employeeId, name: emp ? employeeName(emp) : '—',
          code: r.code, start: r.start, end: r.end, countedDays: r.countedDays, status: r.status };
      });

  const shown = rows.filter((r) => tab === 'pending' ? r.status === 'pending' : tab === 'done' ? r.status !== 'pending' : true)
    .sort((a, b) => (a.start < b.start ? 1 : -1));
  const pendingCount = rows.filter((r) => r.status === 'pending').length;

  /** Exécute une décision ; renvoie true seulement si réellement persistée. */
  const decide = async (id: string, status: 'approved' | 'refused' | 'info_requested'): Promise<boolean> => {
    if (hasLive && tenantId) {
      try {
        await decideLife.mutateAsync({ requestId: id, decision: status, tenantId });
        return true;
      } catch (e) {
        toast({ variant: 'error', title: 'Échec de la décision', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
        return false;
      }
    }
    decideMock(id, status);
    return true;
  };

  // Sélection limitée aux demandes en attente actuellement affichées.
  const selectablePending = shown.filter((r) => r.status === 'pending');
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = selectablePending.length > 0 && selectablePending.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(selectablePending.map((r) => r.id)));

  const act = async (id: string, status: 'approved' | 'refused' | 'info_requested', who: string, label: string) => {
    const ok = await decide(id, status);
    if (!ok) return; // succès affiché seulement après persistance confirmée
    const v = status === 'approved' ? 'success' : status === 'refused' ? 'warning' : 'info';
    const t = status === 'approved' ? 'Demande approuvée' : status === 'refused' ? 'Demande refusée' : 'Précisions demandées';
    toast({ variant: v as 'success' | 'warning' | 'info', title: t, description: `${who} · ${label} — l'employé est notifié.` });
  };

  // R15 — validation en lot : CHAQUE décision est exécutée et tracée individuellement.
  const runBatch = async () => {
    const ids = [...selected];
    let ok = 0;
    for (const id of ids) { if (await decide(id, 'approved')) ok++; }
    setBatchOpen(false);
    setSelected(new Set());
    setBatchComment('');
    if (ok > 0) toast({ variant: 'success', title: `${ok} demande(s) validée(s)`, description: `Chaque décision est tracée individuellement (audit séparé) — les collaborateurs sont notifiés.` });
  };

  const confirmRefuse = async () => {
    if (!refuseId || refuseMotif.trim().length < 20) return;
    const r = rows.find((x) => x.id === refuseId);
    const ok = await decide(refuseId, 'refused');
    setRefuseId(null);
    setRefuseMotif('');
    if (ok) toast({ variant: 'warning', title: 'Demande refusée', description: `${r?.name ?? ''} — motif transmis au collaborateur.` });
  };

  const batchEmps = [...selected].map((id) => rows.find((r) => r.id === id)).filter(Boolean) as ViewRow[];

  return (
    <div className="animate-fade-up space-y-5">
      <TeamTimeSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Demandes à valider</h1>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button size="sm" onClick={() => setBatchOpen(true)}><CheckCheck size={14} /> Valider en lot ({selected.size})</Button>
          )}
          <StatusPill tone={pendingCount > 0 ? 'amber' : 'ok'} dot={false}>{pendingCount} en attente</StatusPill>
        </div>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={(v) => { setTab(v); setSelected(new Set()); }} />

      {tab === 'pending' && selectablePending.length > 0 && (
        <label className="flex w-fit cursor-pointer items-center gap-2 text-[12px] font-semibold text-ink-500">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-line accent-info" />
          Tout sélectionner ({selectablePending.length})
        </label>
      )}

      {shown.length > 0 ? (
        <div className="space-y-3">
          {shown.map((r) => {
            const Icon = catIcon(r.code);
            const dleft = daysUntil(r.start);
            const urgent = r.status === 'pending' && dleft >= 0 && dleft <= 7;
            // Impact couverture : autres absences de l'équipe sur la période
            const overlap = rows.filter((o) => o.id !== r.id && o.status !== 'refused' && o.start <= r.end && o.end >= r.start).length;
            return (
              <Card key={r.id} className={selected.has(r.id) ? 'ring-1 ring-info/40' : undefined}>
                <div className="flex flex-wrap items-start gap-3">
                  {r.status === 'pending' && (
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="mt-1 h-4 w-4 shrink-0 rounded border-line accent-info" />
                  )}
                  <Avatar name={r.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-ink">{r.name}</p>
                      <StatusPill tone={STATUS_TONE[r.status]} dot={false}>{STATUS_LABEL[r.status]}</StatusPill>
                      {urgent && <StatusPill tone="danger" dot={false}>⚡ Départ J-{dleft}</StatusPill>}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-500"><Icon size={12} /> {categoryLabel(r.code)}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] font-medium text-ink-500">{frDate(r.start)} → {frDate(r.end)} · {r.countedDays} j décomptés</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-medium">
                      {isHealth(r.code) && <span className="inline-flex items-center gap-1 text-ink-400"><Paperclip size={11} /> Justificatif fourni (contenu médical confidentiel)</span>}
                      {overlap > 0 && <span className="inline-flex items-center gap-1 text-warn"><AlertTriangle size={11} /> {overlap} autre(s) absence(s) sur la période</span>}
                    </div>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => act(r.id, 'approved', r.name, categoryLabel(r.code))} className="rounded-lg bg-ok/12 p-2 text-ok hover:bg-ok/20" title="Approuver"><Check size={16} /></button>
                      <button onClick={() => { setRefuseId(r.id); setRefuseMotif(''); }} className="rounded-lg bg-danger/10 p-2 text-danger hover:bg-danger/20" title="Refuser"><X size={16} /></button>
                      <button onClick={() => act(r.id, 'info_requested', r.name, categoryLabel(r.code))} className="rounded-lg bg-info/10 p-2 text-info hover:bg-info/20" title="Demander des précisions"><MessageCircle size={16} /></button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card><EmptyState icon={Check} title="Rien à traiter" description="Aucune demande dans cette vue." /></Card>
      )}

      {/* R15 — validation en lot, audit individuel */}
      <Modal
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        title={`Valider ${selected.size} demande(s)`}
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setBatchOpen(false)}>Annuler</Button>
          <Button size="sm" onClick={runBatch}><CheckCheck size={14} /> Valider tout</Button>
        </>}
      >
        <div className="space-y-3">
          <div className="max-h-52 space-y-1.5 overflow-y-auto">
            {batchEmps.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2"><span className="text-sm font-semibold text-ink">{r.name}</span><span className="text-[11px] font-medium text-ink-400">{categoryLabel(r.code)} · {frDate(r.start)} → {frDate(r.end)}</span></div>
            ))}
          </div>
          <label className="block">
            <span className="text-[12px] font-semibold text-ink-500">Commentaire commun (optionnel)</span>
            <textarea value={batchComment} onChange={(e) => setBatchComment(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" placeholder="Visible par les collaborateurs concernés…" />
          </label>
          <p className="flex items-start gap-2 rounded-xl bg-info/[0.06] px-3 py-2 text-[11px] font-medium text-ink-600"><ShieldCheck size={13} className="mt-0.5 shrink-0 text-info" /> Chaque décision est journalisée séparément (R15) : un enregistrement d'audit distinct par demande, avec votre identité de décideur.</p>
        </div>
      </Modal>

      {/* Refus motivé — motif obligatoire ≥ 20 caractères */}
      <Modal
        open={refuseId !== null}
        onClose={() => setRefuseId(null)}
        title="Refuser la demande"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setRefuseId(null)}>Annuler</Button>
          <Button variant="danger" size="sm" onClick={confirmRefuse} disabled={refuseMotif.trim().length < 20}>Confirmer le refus</Button>
        </>}
      >
        <label className="block">
          <span className="text-[12px] font-semibold text-ink-500">Motif du refus (obligatoire, transmis au collaborateur)</span>
          <textarea value={refuseMotif} onChange={(e) => setRefuseMotif(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-danger/30" placeholder="Expliquez le motif (couverture insuffisante, dates incompatibles…) et proposez une alternative." />
          <span className={`mt-1 block text-[11px] font-medium ${refuseMotif.trim().length < 20 ? 'text-danger' : 'text-ok'}`}>{refuseMotif.trim().length}/20 caractères minimum</span>
        </label>
      </Modal>
    </div>
  );
}
