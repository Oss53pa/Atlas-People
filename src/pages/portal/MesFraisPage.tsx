import { useEffect, useMemo, useState } from 'react';
import { ReceiptText, ScanLine, Sparkles, Plus, Trash2, Send, Wallet, Clock, CheckCircle2, ShieldCheck, FileText, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/overlays';
import { EmptyState } from '../../components/ui/feedback';
import { useToast } from '../../components/ui/Toast';
import { useSurface } from '../../store/useSurface';
import { useExpenses, reportTotal, type ExpenseReport, type ExpenseReportStatus, type ExpenseLine } from '../../store/useExpenses';
import { EXPENSE_CATEGORIES, categoryByCode, checkPolicy } from '../../lib/expenses/policy';
import { Money } from '../../lib/money';
import { employeeById, employeeCurrency } from '../../data/mock';
import { cn } from '../../lib/cn';
import { useMyExpenseClaims, useSubmitExpenseClaim, isBackendConfigured } from '../../lib/portal/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const SELF_ID = 'e2';
const SELF_CUR = employeeCurrency(employeeById(SELF_ID)!);
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
const fmt = (n: number) => Money.of(n, SELF_CUR).format();

const STATUS_TONE: Record<ExpenseReportStatus, 'ok' | 'warn' | 'danger' | 'info' | 'neutral'> = {
  draft: 'neutral', submitted: 'warn', manager_approved: 'info', finance_approved: 'info', reimbursed: 'ok', refused: 'danger',
};
const STATUS_LABEL: Record<ExpenseReportStatus, string> = {
  draft: 'Brouillon', submitted: 'Soumise', manager_approved: 'Validée manager', finance_approved: 'Validée finance', reimbursed: 'Remboursée', refused: 'Refusée',
};
const WORKFLOW: ExpenseReportStatus[] = ['submitted', 'manager_approved', 'finance_approved', 'reimbursed'];

// Live claim statuses (Supabase expense_claims) → tone + libellé
const CLAIM_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'info' | 'neutral'> = {
  submitted: 'warn', manager_approved: 'info', finance_approved: 'info', reimbursed: 'ok', refused: 'danger',
};
const CLAIM_LABEL: Record<string, string> = {
  submitted: 'Soumise', manager_approved: 'Validée manager', finance_approved: 'Validée finance', reimbursed: 'Remboursée', refused: 'Refusée',
};

const TABS = [
  { key: 'new', label: 'Nouvelle note' },
  { key: 'open', label: 'En cours' },
  { key: 'history', label: 'Historique' },
  { key: 'policy', label: 'Plafonds' },
];

export function MesFraisPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);
  const { toast } = useToast();
  const { data: ctx } = useSessionContext();
  const { data: liveClaims } = useMyExpenseClaims(ctx?.tenantId, ctx?.employeeId);
  const submitClaim = useSubmitExpenseClaim();
  const hasLive = isBackendConfigured && !!liveClaims && liveClaims.length > 0;
  const { byEmployee, create, submit } = useExpenses();
  const reports = byEmployee(SELF_ID);
  const [tab, setTab] = useState('new');
  const [detail, setDetail] = useState<ExpenseReport | null>(null);

  // --- Nouvelle note : composition de lignes ---
  const [title, setTitle] = useState('');
  const [mission, setMission] = useState('');
  const [lines, setLines] = useState<ExpenseLine[]>([]);
  const [category, setCategory] = useState('transport');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState(0);
  const [hasReceipt, setHasReceipt] = useState(false);
  const [scanned, setScanned] = useState<string | null>(null);

  const draftTotal = useMemo(() => lines.reduce((s, l) => s + l.amount, 0), [lines]);
  const policy = checkPolicy(category, amount);

  const open = reports.filter((r) => ['draft', 'submitted', 'manager_approved', 'finance_approved'].includes(r.status));
  const history = reports.filter((r) => ['reimbursed', 'refused'].includes(r.status));
  const pendingTotal = open.filter((r) => r.status !== 'draft').reduce((s, r) => s + reportTotal(r), 0);
  const ytdTotal = reports.filter((r) => r.status === 'reimbursed').reduce((s, r) => s + reportTotal(r), 0);

  // Live claims (Supabase) — répartis en cours / historique.
  const liveOpen = (liveClaims ?? []).filter((c) => ['submitted', 'manager_approved', 'finance_approved'].includes(c.status));
  const liveHistory = (liveClaims ?? []).filter((c) => ['reimbursed', 'refused'].includes(c.status));

  const runOcr = () => {
    setCategory('carburant'); setLabel('Total Énergies'); setAmount(18_500); setHasReceipt(true);
    setScanned('Total Énergies · 18 500 FCFA · 27/05/2026');
    toast({ variant: 'success', title: 'OCR Proph3t', description: 'Justificatif analysé — champs pré-remplis.' });
  };

  const addLine = () => {
    if (!label || amount <= 0) return;
    setLines((ls) => [...ls, { id: `nl${Date.now()}`, category, label, amount, date: '2026-05-28', hasReceipt }]);
    setLabel(''); setAmount(0); setHasReceipt(false); setScanned(null);
  };

  const saveReport = async (andSubmit: boolean) => {
    if (lines.length === 0 || !title) { toast({ variant: 'info', title: 'Note incomplète', description: 'Ajoutez un objet et au moins une ligne.' }); return; }
    const ref = `NDF-2026-${String(110 + reports.length).padStart(4, '0')}`;
    const report: ExpenseReport = {
      id: `nf${Date.now()}`, reference: ref, employeeId: SELF_ID, title, mission: mission || undefined,
      status: andSubmit ? 'submitted' : 'draft', createdAt: '2026-05-28', submittedAt: andSubmit ? '2026-05-28' : undefined,
      approver: 'Valentina Okou', lines,
    };
    // Live : persiste la note soumise côté Supabase (montant composé + catégorie principale).
    if (andSubmit && isBackendConfigured && ctx) {
      const primaryCategory = lines[0]?.category ?? category;
      try {
        await submitClaim.mutateAsync({ amount: draftTotal, category: primaryCategory });
      } catch (e) {
        toast({ variant: 'error', title: "Échec de la soumission", description: e instanceof Error ? e.message : 'Erreur inconnue.' });
        return;
      }
    } else {
      create(report);
    }
    toast({ variant: 'success', title: andSubmit ? 'Note soumise' : 'Brouillon enregistré', description: `${ref} · ${fmt(draftTotal)} FCFA` });
    setTitle(''); setMission(''); setLines([]); setTab('open');
  };

  return (
    <div className="animate-fade-up space-y-5">
      {detail && <ReportModal report={detail} onClose={() => setDetail(null)} onSubmit={() => { submit(detail.id); toast({ variant: 'success', title: 'Note soumise', description: detail.reference }); setDetail(null); }} />}

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
          Mes notes de frais
          {hasLive && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={11} className="text-emerald-500" /> Live DB</span>}
        </h1>
        <p className="text-sm font-medium text-ink-500">Remboursement sur Mobile Money · contrôle de politique automatique · justificatifs conservés 5 ans.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="En attente" value={`${(pendingTotal / 1000).toFixed(0)} k`} unit="XOF" mono icon={Clock} tone="amber" />
        <StatCard label="Notes ouvertes" value={String(open.length)} unit="en cours" icon={ReceiptText} />
        <StatCard label="Remboursé 2026" value={`${(ytdTotal / 1000).toFixed(0)} k`} unit="XOF" mono icon={Wallet} />
        <StatCard label="Délai moyen" value="13" unit="jours" icon={CheckCircle2} />
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {/* NOUVELLE NOTE */}
      {tab === 'new' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
          <Card>
            <CardHeader title="Composer la note" subtitle="Objet, mission et lignes de dépense" />
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Objet de la note</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Mission Bouaké" className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Mission / contexte (optionnel)</label>
                <input value={mission} onChange={(e) => setMission(e.target.value)} placeholder="Ex. Audit agence régionale" className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none" />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-line bg-surface2 p-3.5">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-ink-400">Ajouter une ligne</p>
              <Button variant="outline" size="sm" className="mb-3 w-full" onClick={runOcr}><ScanLine size={14} /> Scanner le justificatif (OCR)</Button>
              {scanned && <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber/[0.08] px-3 py-2 text-[11px] font-semibold text-amber-deep"><Sparkles size={12} /> {scanned}</p>}
              <div className="grid grid-cols-2 gap-2">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                  {EXPENSE_CATEGORIES.map((c) => (<option key={c.code} value={c.code}>{c.label}</option>))}
                </select>
                <input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Montant" className="mono h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
              </div>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Libellé (ex. Hôtel Ran — 2 nuits)" className="mt-2 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none" />
              <label className="mt-2 flex items-center gap-2 text-[12px] font-medium text-ink-700"><input type="checkbox" checked={hasReceipt} onChange={(e) => setHasReceipt(e.target.checked)} className="h-4 w-4 accent-amber" /> Justificatif joint</label>
              {amount > 0 && (
                <p className={cn('mt-2 text-[11px] font-semibold', policy.withinPolicy ? 'text-ok' : 'text-danger')}>{policy.message}</p>
              )}
              <Button size="sm" className="mt-3 w-full" onClick={addLine} disabled={!label || amount <= 0}><Plus size={14} /> Ajouter la ligne</Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Lignes de la note" action={<span className="mono text-sm font-bold text-amber-deep">{fmt(draftTotal)} FCFA</span>} />
            {lines.length === 0 ? (
              <EmptyState icon={ReceiptText} title="Aucune ligne" description="Ajoutez des dépenses via le formulaire à gauche." />
            ) : (
              <div className="space-y-1.5">
                {lines.map((l) => {
                  const pol = checkPolicy(l.category, l.amount);
                  return (
                    <div key={l.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><ReceiptText size={14} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{l.label}</p>
                        <p className="text-[11px] font-medium text-ink-400">{categoryByCode(l.category).label}{!l.hasReceipt && ' · sans justificatif'}{!pol.withinPolicy && ' · hors plafond'}</p>
                      </div>
                      <span className="mono text-sm font-bold text-ink">{fmt(l.amount)}</span>
                      <button onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))} className="rounded-lg p-1.5 text-ink-400 hover:bg-danger/10 hover:text-danger"><Trash2 size={14} /></button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => saveReport(false)} disabled={lines.length === 0}>Enregistrer brouillon</Button>
              <Button size="sm" className="flex-1" onClick={() => saveReport(true)} disabled={lines.length === 0}><Send size={14} /> Soumettre</Button>
            </div>
          </Card>
        </div>
      )}

      {/* EN COURS */}
      {tab === 'open' && (
        <div className="space-y-2">
          {hasLive && (
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600"><Wifi size={13} className="text-emerald-500" /> Live DB · {liveClaims!.length} note(s)</p>
          )}
          {hasLive ? (
            liveOpen.length === 0
              ? <Card><EmptyState icon={ReceiptText} title="Aucune note en cours" description="Vos notes soumises apparaîtront ici." /></Card>
              : liveOpen.map((c) => <ClaimRow key={c.id} claim={c} />)
          ) : open.length === 0 ? (
            <Card><EmptyState icon={ReceiptText} title="Aucune note en cours" description="Créez une note via l'onglet « Nouvelle note »." /></Card>
          ) : open.map((r) => <ReportRow key={r.id} report={r} onOpen={() => setDetail(r)} onSubmit={() => { submit(r.id); toast({ variant: 'success', title: 'Note soumise', description: r.reference }); }} />)}
        </div>
      )}

      {/* HISTORIQUE */}
      {tab === 'history' && (
        <div className="space-y-2">
          {hasLive ? (
            liveHistory.length === 0
              ? <Card><EmptyState icon={FileText} title="Historique vide" description="Vos notes remboursées apparaîtront ici." /></Card>
              : liveHistory.map((c) => <ClaimRow key={c.id} claim={c} />)
          ) : history.length === 0 ? (
            <Card><EmptyState icon={FileText} title="Historique vide" description="Vos notes remboursées apparaîtront ici." /></Card>
          ) : history.map((r) => <ReportRow key={r.id} report={r} onOpen={() => setDetail(r)} />)}
        </div>
      )}

      {/* PLAFONDS */}
      {tab === 'policy' && (
        <Card>
          <CardHeader title="Plafonds de remboursement" subtitle="Politique de frais — au-delà, validation de niveau supérieur" action={<ShieldCheck size={16} className="text-ink-400" />} />
          <div className="overflow-hidden rounded-xl border border-line">
            <div className="grid grid-cols-[2fr_1fr_1.4fr] gap-3 border-b border-line bg-surface2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-400"><span>Catégorie</span><span className="text-right">Plafond</span><span className="text-right">Justificatif</span></div>
            <div className="divide-y divide-line">
              {EXPENSE_CATEGORIES.map((c) => (
                <div key={c.code} className="grid grid-cols-[2fr_1fr_1.4fr] items-center gap-3 px-4 py-2.5">
                  <span className="text-sm font-semibold text-ink">{c.label}</span>
                  <span className="mono text-right text-sm font-semibold text-ink">{fmt(c.cap)}</span>
                  <span className="text-right text-[11px] font-medium text-ink-400">obligatoire &gt; {fmt(10_000)}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 flex items-start gap-2 text-[12px] font-medium text-ink-700"><Sparkles size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Proph3t vérifie chaque ligne contre la politique en temps réel — le contrôle est déterministe, jamais estimé.</p>
        </Card>
      )}
    </div>
  );
}

function ReportRow({ report, onOpen, onSubmit }: { report: ExpenseReport; onOpen: () => void; onSubmit?: () => void }) {
  const total = reportTotal(report);
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><ReceiptText size={16} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-ink">{report.title}</p><span className="mono text-[10px] font-bold text-ink-400">{report.reference}</span></div>
          <p className="text-[11px] font-medium text-ink-400">{report.lines.length} ligne(s) · {report.mission ?? 'Frais courants'} · créée le {frDate(report.createdAt)}</p>
        </div>
        <span className="mono text-sm font-bold text-ink">{fmt(total)} FCFA</span>
        <StatusPill tone={STATUS_TONE[report.status]} dot={false}>{STATUS_LABEL[report.status]}</StatusPill>
        {report.status === 'draft' && onSubmit && <Button variant="outline" size="sm" onClick={onSubmit}><Send size={14} /> Soumettre</Button>}
        <Button variant="ghost" size="sm" onClick={onOpen}>Détail</Button>
      </div>
    </Card>
  );
}

function ClaimRow({ claim }: { claim: import('../../lib/portal/supabaseLive').ExpenseClaimRow }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600"><ReceiptText size={16} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-ink">{categoryByCode(claim.category).label}</p>
            <span className="mono inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600"><Wifi size={10} /> Live DB</span>
          </div>
          <p className="text-[11px] font-medium text-ink-400">{frDate(claim.created_at.slice(0, 10))}</p>
        </div>
        <span className="mono text-sm font-bold text-ink">{fmt(claim.amount)} FCFA</span>
        <StatusPill tone={CLAIM_TONE[claim.status] ?? 'neutral'} dot={false}>{CLAIM_LABEL[claim.status] ?? claim.status}</StatusPill>
      </div>
    </Card>
  );
}

function ReportModal({ report, onClose, onSubmit }: { report: ExpenseReport; onClose: () => void; onSubmit: () => void }) {
  const total = reportTotal(report);
  const stepIdx = WORKFLOW.indexOf(report.status === 'refused' ? 'submitted' : report.status);
  return (
    <Modal open onClose={onClose} title={report.title} footer={report.status === 'draft' ? <Button onClick={onSubmit}><Send size={14} /> Soumettre la note</Button> : <Button variant="outline" onClick={onClose}>Fermer</Button>}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><p className="mono text-[11px] font-bold text-ink-400">{report.reference}</p><p className="text-[12px] font-medium text-ink-500">{report.mission ?? 'Frais courants'}</p></div>
          <StatusPill tone={STATUS_TONE[report.status]} dot={false}>{STATUS_LABEL[report.status]}</StatusPill>
        </div>

        {report.status !== 'draft' && report.status !== 'refused' && (
          <div className="flex items-center gap-1">
            {WORKFLOW.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-center">
                  <div className={cn('h-1.5 flex-1 rounded-full', i <= stepIdx ? 'bg-ok' : 'bg-line')} />
                </div>
                <span className={cn('text-[9px] font-bold uppercase tracking-wide', i <= stepIdx ? 'text-ok' : 'text-ink-300')}>{STATUS_LABEL[s].replace('Validée ', '')}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          {report.lines.map((l) => {
            const pol = checkPolicy(l.category, l.amount);
            return (
              <div key={l.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{l.label}</p><p className="text-[11px] font-medium text-ink-400">{categoryByCode(l.category).label} · {frDate(l.date)}{!l.hasReceipt && ' · sans justificatif'}</p></div>
                {!pol.withinPolicy && <StatusPill tone="danger" dot={false}>Hors plafond</StatusPill>}
                <span className="mono text-sm font-bold text-ink">{fmt(l.amount)}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between rounded-xl border border-amber/30 bg-amber/[0.06] px-4 py-3">
          <span className="text-sm font-bold text-ink">Total à rembourser</span>
          <span className="mono text-base font-bold text-amber-deep">{fmt(total)} FCFA</span>
        </div>
        {report.reimbursedAt && <p className="text-[12px] font-medium text-ok">Remboursé le {frDate(report.reimbursedAt)} sur Mobile Money.</p>}
      </div>
    </Modal>
  );
}
