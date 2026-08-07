/**
 * PrefacturationPage — honoraires du cabinet, période par période.
 *
 * Les montants viennent de `atlas_people.prefactures` : ils ne sont jamais
 * saisis à la main mais calculés depuis les conditions du mandat, ce qui
 * rend chaque ligne justifiable devant le client.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ReceiptText, Plus, Search, Loader2, AlertCircle, ChevronRight,
  Wallet, Send, FileText, CheckCircle2,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';
import { PRODUCT_META } from '../../app/nav';
import {
  fetchPrefactures, fetchClients, generatePrefacture, formatAmount, formatDate,
  PREFACTURE_LABEL, humanizeCabinetError, cabinetLive,
  type PrefactureWithClient, type Client, type PrefactureStatus,
} from '../../lib/cabinet';

const STATUS_CLS: Record<PrefactureStatus, string> = {
  brouillon: 'bg-slate-100 text-slate-700',
  validee:   'bg-amber-100 text-amber-700',
  envoyee:   'bg-blue-100 text-blue-700',
  payee:     'bg-emerald-100 text-emerald-700',
  annulee:   'bg-rose-100 text-rose-700',
};

const FLAG: Record<string, string> = {
  CI: '🇨🇮', SN: '🇸🇳', CM: '🇨🇲', TG: '🇹🇬', BJ: '🇧🇯', ML: '🇲🇱',
  BF: '🇧🇫', NE: '🇳🇪', GA: '🇬🇦', CG: '🇨🇬', TD: '🇹🇩',
};

function moisCourant(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function PrefacturationPage() {
  const { tenantType } = useAuth();
  const product = PRODUCT_META[tenantType];

  const [rows, setRows] = useState<PrefactureWithClient[] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ clientId: '', period: moisCourant() });

  const load = useCallback(async () => {
    if (!cabinetLive) { setRows([]); return; }
    try {
      const [p, c] = await Promise.all([fetchPrefactures(), fetchClients()]);
      setRows(p); setClients(c);
    } catch (e) {
      setError(e instanceof Error ? humanizeCabinetError(e.message) : 'Chargement impossible');
      setRows([]);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totaux = useMemo(() => {
    const list = rows ?? [];
    const sum = (f: (p: PrefactureWithClient) => boolean) =>
      list.filter(f).reduce((s, p) => s + p.total_amount, 0);
    return {
      total:     sum((p) => p.status !== 'annulee'),
      enAttente: sum((p) => p.status === 'validee' || p.status === 'envoyee'),
      encaisse:  sum((p) => p.status === 'payee'),
      brouillons: list.filter((p) => p.status === 'brouillon').length,
      periodes:  new Set(list.map((p) => p.period_label)).size,
      devise:    list[0]?.currency ?? 'XOF',
    };
  }, [rows]);

  const filtered = (rows ?? []).filter((p) =>
    !search
    || p.client?.name.toLowerCase().includes(search.toLowerCase())
    || p.period_label.toLowerCase().includes(search.toLowerCase())
    || p.reference.toLowerCase().includes(search.toLowerCase()));

  const handleGenerate = async () => {
    if (!form.clientId) return;
    setBusy(true); setError(null);
    try {
      await generatePrefacture(form.clientId, form.period);
      setCreating(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Génération impossible');
    } finally {
      setBusy(false);
    }
  };

  if (rows === null) {
    return <div className="flex min-h-[300px] items-center justify-center"><Loader2 size={22} className="animate-spin text-ink-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em]', product.accentClass)}>{product.name}</p>
          <h1 className="font-display text-[28px] leading-tight tracking-tight text-ink">Préfacturation</h1>
          <p className="mt-1 text-[13px] font-medium text-ink-500">
            Honoraires cabinet · {rows.length} ligne(s) sur {totaux.periodes} période(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[13px] font-bold text-surface transition-shadow hover:shadow-lg"
        >
          <Plus size={15} /> Nouvelle préfacture
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] px-4 py-3">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-600" />
          <p className="text-[13px] font-medium text-rose-700">{error}</p>
        </div>
      )}

      {creating && (
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Générer une préfacture</p>
          <p className="mt-1 text-[12px] font-medium text-ink-500">
            Le montant est calculé depuis les conditions du mandat actif — forfait, prix unitaire, minimum et TVA.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">Client</span>
              <select
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                className="min-w-[16rem] rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none"
              >
                <option value="">— Sélectionner —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">Période</span>
              <input
                type="date" value={form.period}
                onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                className="rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none"
              />
            </label>
            <button
              type="button" disabled={busy || !form.clientId}
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[13px] font-bold text-surface disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <ReceiptText size={14} />} Générer
            </button>
          </div>
          {clients.length === 0 && (
            <p className="mt-3 text-[12px] font-medium text-amber-700">
              Aucun client dans ce workspace — commencez par en créer un depuis le portefeuille.
            </p>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total (toutes périodes)', value: formatAmount(totaux.total, totaux.devise), icon: ReceiptText },
          { label: 'Envoyées en attente', value: formatAmount(totaux.enAttente, totaux.devise), icon: Send, cls: 'text-blue-600' },
          { label: 'Encaissées', value: formatAmount(totaux.encaisse, totaux.devise), icon: Wallet, cls: 'text-emerald-600' },
          { label: 'Brouillons à valider', value: String(totaux.brouillons), icon: FileText },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-1.5">
              <k.icon size={12} className="text-ink-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{k.label}</p>
            </div>
            <p className={cn('mono mt-1 text-[17px] font-bold leading-tight', k.cls ?? 'text-ink')}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-3 border-b border-line px-5 py-3">
          <Search size={15} className="text-ink-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (client, période, référence)…"
            className="flex-1 bg-transparent text-[13px] font-medium text-ink placeholder:text-ink-400 focus:outline-none"
          />
          <span className="text-[11px] font-semibold text-ink-400">{filtered.length} résultat(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-5 py-2.5 text-left">Client</th>
                <th className="px-3 py-2.5 text-left">Référence</th>
                <th className="px-3 py-2.5 text-left">Pays</th>
                <th className="px-3 py-2.5 text-right">Collab.</th>
                <th className="px-3 py-2.5 text-left">Période</th>
                <th className="px-3 py-2.5 text-right">Montant TTC</th>
                <th className="px-3 py-2.5 text-left">Statut</th>
                <th className="px-5 py-2.5 text-left">Échéance</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-line/60 last:border-0 hover:bg-ink/[0.02]">
                  <td className="px-5 py-3 text-[13px] font-bold text-ink">{p.client?.name ?? '—'}</td>
                  <td className="mono px-3 py-3 text-[12px] text-ink-500">{p.reference}</td>
                  <td className="px-3 py-3 text-[12px]">{FLAG[p.client?.pays ?? ''] ?? ''} {p.client?.pays}</td>
                  <td className="mono px-3 py-3 text-right text-[13px] text-ink-700">{p.headcount}</td>
                  <td className="px-3 py-3 text-[13px] font-medium text-ink-500">{p.period_label}</td>
                  <td className="mono px-3 py-3 text-right text-[13px] font-bold text-ink">
                    {formatAmount(p.total_amount, p.currency)}
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold', STATUS_CLS[p.status])}>
                      {PREFACTURE_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12px] font-medium text-ink-500">{formatDate(p.due_on)}</td>
                  <td className="px-3 py-3">
                    <Link to={`/prefacturation/${p.id}`} className="inline-flex items-center gap-1 text-[12px] font-bold text-amber-deep hover:underline">
                      Détail <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <ReceiptText size={26} className="mx-auto text-ink-300" />
                    <p className="mt-3 text-[14px] font-bold text-ink">
                      {rows.length === 0 ? 'Aucune préfacture' : 'Aucun résultat'}
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-ink-400">
                      {rows.length === 0
                        ? 'Générez la première préfacture d\'un client disposant d\'un mandat actif.'
                        : 'Affinez votre recherche.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="border-t border-line px-5 py-2.5 text-[11px] font-medium text-ink-400">
          <CheckCircle2 size={11} className="mr-1 inline text-emerald-500" />
          Données réelles · <span className="mono">atlas_people.prefactures</span>
        </p>
      </div>
    </div>
  );
}
