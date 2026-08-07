/**
 * PrefactureDetailPage — le détail d'une préfacture (`/prefacturation/:id`).
 *
 * Ce que cet écran doit permettre : justifier chaque franc facturé. Il
 * expose donc les lignes de calcul, le mandat dont elles découlent, et le
 * cycle de vie du document. Les transitions proposées sont exactement
 * celles que la base accepterait (cf. guard_prefacture_status) : un bouton
 * voué à l'échec serait un piège.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import {
  ArrowLeft, ReceiptText, Building2, FileSignature, CheckCircle2, Send,
  Wallet, Ban, Loader2, AlertCircle, CalendarDays, Users, Clock,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import {
  fetchPrefacture, fetchPrefactureLines, fetchContracts, setPrefactureStatus,
  nextPrefactureStatus, canCancelPrefacture, formatAmount, formatDate,
  PREFACTURE_LABEL, MANDATE_LABEL, BILLING_LABEL, cabinetLive,
  type PrefactureWithClient, type PrefactureLine, type ClientContract, type PrefactureStatus,
} from '../../lib/cabinet';

const STATUS_CLS: Record<PrefactureStatus, string> = {
  brouillon: 'bg-slate-100 text-slate-700',
  validee:   'bg-amber-100 text-amber-700',
  envoyee:   'bg-blue-100 text-blue-700',
  payee:     'bg-emerald-100 text-emerald-700',
  annulee:   'bg-rose-100 text-rose-700',
};

const NEXT_ACTION: Record<string, { label: string; icon: typeof Send }> = {
  validee: { label: 'Valider la préfacture', icon: CheckCircle2 },
  envoyee: { label: 'Marquer comme envoyée', icon: Send },
  payee:   { label: 'Enregistrer l\'encaissement', icon: Wallet },
};

const KIND_LABEL: Record<PrefactureLine['kind'], string> = {
  abonnement:   'Forfait',
  collaborateur:'Au collaborateur',
  bulletin:     'Au bulletin',
  prestation:   'Prestation',
  remise:       'Remise',
};

export function PrefactureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [prefacture, setPrefacture] = useState<PrefactureWithClient | null | 'loading'>('loading');
  const [lines, setLines] = useState<PrefactureLine[]>([]);
  const [contract, setContract] = useState<ClientContract | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState('');

  const load = useCallback(async () => {
    if (!id || !cabinetLive) { setPrefacture(null); return; }
    try {
      const p = await fetchPrefacture(id);
      setPrefacture(p);
      if (!p) return;
      setLines(await fetchPrefactureLines(p.id));
      const contracts = await fetchContracts(p.client_id);
      setContract(contracts.find((c) => c.id === p.contract_id) ?? contracts[0] ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chargement impossible');
      setPrefacture(null);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const advance = async (status: PrefactureStatus) => {
    if (!prefacture || prefacture === 'loading') return;
    setBusy(true); setError(null);
    try {
      await setPrefactureStatus(prefacture.id, status, status === 'payee' ? paymentRef : undefined);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action impossible');
    } finally {
      setBusy(false);
    }
  };

  if (prefacture === 'loading') {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-ink-400" />
      </div>
    );
  }
  if (!prefacture) return <Navigate to="/prefacturation" replace />;

  const next = nextPrefactureStatus(prefacture.status);
  const action = next ? NEXT_ACTION[next] : null;
  const ActionIcon = action?.icon;
  const enRetard = prefacture.status === 'envoyee' && prefacture.due_on
    && new Date(prefacture.due_on) < new Date();

  return (
    <div className="space-y-6">
      <div>
        <Link to="/prefacturation" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-400 transition-colors hover:text-ink">
          <ArrowLeft size={13} /> Préfacturation
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface2 shadow-sm">
              <ReceiptText size={22} className="text-ink-400" />
            </div>
            <div>
              <p className="mono text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">
                {prefacture.reference}
              </p>
              <h1 className="font-display text-[28px] leading-tight tracking-tight text-ink">
                {prefacture.client?.name ?? 'Client supprimé'}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold', STATUS_CLS[prefacture.status])}>
                  {PREFACTURE_LABEL[prefacture.status]}
                </span>
                <span className="text-[12px] font-medium text-ink-400">{prefacture.period_label}</span>
                {enRetard && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                    <Clock size={10} /> Échéance dépassée
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {next === 'payee' && (
              <input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Référence de paiement"
                className="rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none"
              />
            )}
            {action && next && ActionIcon && (
              <button
                type="button" disabled={busy}
                onClick={() => advance(next)}
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[13px] font-bold text-surface transition-shadow hover:shadow-lg disabled:opacity-60"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <ActionIcon size={14} />}
                {action.label}
              </button>
            )}
            {canCancelPrefacture(prefacture.status) && (
              <button
                type="button" disabled={busy}
                onClick={() => advance('annulee')}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-[13px] font-bold text-rose-600 transition-colors hover:border-rose-300 disabled:opacity-60"
              >
                <Ban size={14} /> Annuler
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] px-4 py-3">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-600" />
          <p className="text-[13px] font-medium text-rose-700">{error}</p>
        </div>
      )}

      {/* Montants */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total HT', value: formatAmount(prefacture.subtotal_amount, prefacture.currency), icon: ReceiptText },
          { label: `TVA ${prefacture.tax_rate}%`, value: formatAmount(prefacture.tax_amount, prefacture.currency), icon: ReceiptText },
          { label: 'Total TTC', value: formatAmount(prefacture.total_amount, prefacture.currency), icon: Wallet, strong: true },
          { label: 'Effectif facturé', value: `${prefacture.headcount}`, icon: Users },
        ].map((k) => (
          <div key={k.label} className={cn('rounded-2xl border bg-surface p-4 shadow-sm', k.strong ? 'border-ink/20' : 'border-line')}>
            <div className="flex items-center gap-1.5">
              <k.icon size={12} className="text-ink-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{k.label}</p>
            </div>
            <p className={cn('mono mt-1 font-bold leading-tight text-ink', k.strong ? 'text-[20px]' : 'text-[17px]')}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Lignes de calcul */}
        <div className="space-y-4 lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            <div className="border-b border-line px-5 py-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                Détail du calcul · {lines.length} ligne(s)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    <th className="px-5 py-2.5 text-left">Libellé</th>
                    <th className="px-3 py-2.5 text-left">Base</th>
                    <th className="px-3 py-2.5 text-right">Quantité</th>
                    <th className="px-3 py-2.5 text-right">Prix unitaire</th>
                    <th className="px-5 py-2.5 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b border-line/60 last:border-0">
                      <td className="px-5 py-3 text-[13px] font-semibold text-ink">{l.label}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-bold text-ink-500">
                          {KIND_LABEL[l.kind]}
                        </span>
                      </td>
                      <td className="mono px-3 py-3 text-right text-[13px] text-ink-700">{l.quantity}</td>
                      <td className="mono px-3 py-3 text-right text-[13px] text-ink-700">
                        {formatAmount(l.unit_amount, prefacture.currency)}
                      </td>
                      <td className="mono px-5 py-3 text-right text-[13px] font-bold text-ink">
                        {formatAmount(l.amount, prefacture.currency)}
                      </td>
                    </tr>
                  ))}
                  {lines.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-[13px] font-medium text-ink-400">
                      Aucune ligne — la préfacture est vide.
                    </td></tr>
                  )}
                </tbody>
                <tfoot className="bg-surface2/40">
                  <tr className="border-t border-line">
                    <td colSpan={4} className="px-5 py-2.5 text-right text-[12px] font-bold text-ink-500">Total HT</td>
                    <td className="mono px-5 py-2.5 text-right text-[13px] font-bold text-ink">{formatAmount(prefacture.subtotal_amount, prefacture.currency)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-5 py-2.5 text-right text-[12px] font-bold text-ink-500">TVA {prefacture.tax_rate}%</td>
                    <td className="mono px-5 py-2.5 text-right text-[13px] font-bold text-ink">{formatAmount(prefacture.tax_amount, prefacture.currency)}</td>
                  </tr>
                  <tr className="border-t border-line">
                    <td colSpan={4} className="px-5 py-3 text-right text-[13px] font-bold text-ink">Total TTC</td>
                    <td className="mono px-5 py-3 text-right text-[15px] font-bold text-ink">{formatAmount(prefacture.total_amount, prefacture.currency)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="border-t border-line px-5 py-2.5 text-[11px] font-medium text-ink-400">
              Le total est recalculé par la base à chaque modification de ligne — il ne peut pas diverger du détail.
            </p>
          </div>

          {/* Mandat d'origine */}
          {contract && (
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Conditions appliquées</p>
                <Link to={`/clients/${prefacture.client_id}`} className="inline-flex items-center gap-1 text-[12px] font-bold text-amber-deep hover:underline">
                  <FileSignature size={12} /> {contract.reference}
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Mandat', value: MANDATE_LABEL[contract.mandate_type] },
                  { label: 'Facturation', value: BILLING_LABEL[contract.billing_mode] },
                  { label: 'Forfait', value: formatAmount(contract.forfait_amount, contract.currency) },
                  { label: 'Prix unitaire', value: formatAmount(contract.unit_amount, contract.currency) },
                  { label: 'Minimum contractuel', value: formatAmount(contract.minimum_amount, contract.currency) },
                  { label: 'Délai de paiement', value: `${contract.payment_terms_days} jours` },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{f.label}</p>
                    <p className="text-[13px] font-semibold text-ink">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cycle de vie */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-ink-400">Cycle de vie</p>
            <ol className="relative space-y-4 border-l border-line pl-5">
              {[
                { label: 'Créée', date: prefacture.created_at, done: true },
                { label: 'Validée', date: prefacture.validated_at, done: Boolean(prefacture.validated_at) },
                { label: 'Envoyée au client', date: prefacture.sent_at, done: Boolean(prefacture.sent_at) },
                { label: 'Encaissée', date: prefacture.paid_at, done: Boolean(prefacture.paid_at) },
              ].map((s) => (
                <li key={s.label} className="relative">
                  <span className={cn('absolute -left-[23px] flex h-3 w-3 rounded-full',
                    s.done ? 'bg-emerald-500' : 'bg-line')} />
                  <p className={cn('text-[12px] font-semibold', s.done ? 'text-ink' : 'text-ink-400')}>{s.label}</p>
                  <p className="text-[11px] font-medium text-ink-400">{s.done ? formatDate(s.date) : 'En attente'}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">Échéancier</p>
            <div className="space-y-2.5">
              {[
                { icon: CalendarDays, label: 'Période', value: `${formatDate(prefacture.period_start)} → ${formatDate(prefacture.period_end)}` },
                { icon: CalendarDays, label: 'Émission', value: formatDate(prefacture.issued_on) },
                { icon: Clock, label: 'Échéance', value: formatDate(prefacture.due_on) },
                { icon: Wallet, label: 'Référence paiement', value: prefacture.payment_reference ?? '—' },
              ].map((r) => (
                <div key={r.label} className="flex items-start gap-2.5">
                  <r.icon size={13} className="mt-0.5 shrink-0 text-ink-300" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{r.label}</p>
                    <p className="text-[13px] font-medium text-ink-700">{r.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to={`/clients/${prefacture.client_id}`}
            className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <Building2 size={15} className="text-ink-400" />
            <span className="flex-1 text-[13px] font-bold text-ink">Fiche client & mandat</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
