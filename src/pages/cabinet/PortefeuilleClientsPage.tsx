/**
 * PortefeuilleClientsPage — les entreprises clientes du cabinet.
 *
 * Données réelles : afficher des clients de démonstration ici rendait le
 * drill-down mensonger, puisque leur fiche n'existait dans aucune base.
 * Un workspace neuf affiche donc un état vide et la marche à suivre.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Plus, Search, Loader2, AlertCircle, ChevronRight,
  Users, ShieldCheck, CheckCircle2, Clock, FileSignature,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';
import { PRODUCT_META } from '../../app/nav';
import {
  fetchClients, fetchContracts, createClient, cabinetLive,
  type Client, type ClientContract,
} from '../../lib/cabinet';

const STATUS_META = {
  actif:      { label: 'Actif',      icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  en_attente: { label: 'En attente', icon: Clock,        cls: 'bg-amber-100 text-amber-700' },
  suspendu:   { label: 'Suspendu',   icon: AlertCircle,  cls: 'bg-rose-100 text-rose-700' },
} as const;

const FLAG: Record<string, string> = {
  CI: '🇨🇮', SN: '🇸🇳', CM: '🇨🇲', TG: '🇹🇬', BJ: '🇧🇯', ML: '🇲🇱',
  BF: '🇧🇫', NE: '🇳🇪', GA: '🇬🇦', CG: '🇨🇬', TD: '🇹🇩',
};

const PAYS = ['CI', 'SN', 'CM', 'TG', 'BJ', 'ML', 'BF', 'NE', 'GA', 'CG', 'TD'];

function confColor(n: number) {
  if (n >= 90) return 'text-emerald-600';
  if (n >= 75) return 'text-amber-600';
  return 'text-rose-600';
}

export function PortefeuilleClientsPage() {
  const { tenantType } = useAuth();
  const product = PRODUCT_META[tenantType];

  const [clients, setClients] = useState<Client[] | null>(null);
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', pays: 'CI', effectif: 0, contact: '', email: '', secteur: '', ville: '' });

  const load = useCallback(async () => {
    if (!cabinetLive) { setClients([]); return; }
    try {
      const [c, ct] = await Promise.all([fetchClients(), fetchContracts()]);
      setClients(c); setContracts(ct);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chargement impossible');
      setClients([]);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const mandatOf = (clientId: string) =>
    contracts.find((c) => c.client_id === clientId && c.status === 'actif') ?? null;

  const totaux = useMemo(() => {
    const list = clients ?? [];
    return {
      actifs: list.filter((c) => c.status === 'actif').length,
      collaborateurs: list.reduce((s, c) => s + c.effectif, 0),
      pays: new Set(list.map((c) => c.pays)).size,
      enAttente: list.filter((c) => c.status === 'en_attente').length,
    };
  }, [clients]);

  const filtered = (clients ?? []).filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.pays.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setBusy(true); setError(null);
    try {
      await createClient({ ...form, effectif: Number(form.effectif) || 0 });
      setForm({ name: '', pays: 'CI', effectif: 0, contact: '', email: '', secteur: '', ville: '' });
      setCreating(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Création impossible');
    } finally { setBusy(false); }
  };

  if (clients === null) {
    return <div className="flex min-h-[300px] items-center justify-center"><Loader2 size={22} className="animate-spin text-ink-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em]', product.accentClass)}>{product.name}</p>
          <h1 className="font-display text-[28px] leading-tight tracking-tight text-ink">Portefeuille clients</h1>
          <p className="mt-1 text-[13px] font-medium text-ink-500">
            {totaux.actifs} client(s) actif(s) · {totaux.collaborateurs} collaborateur(s) géré(s)
          </p>
        </div>
        <button type="button" onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[13px] font-bold text-surface transition-shadow hover:shadow-lg">
          <Plus size={15} /> Ajouter un client
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
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Nouvelle entreprise cliente</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { k: 'name' as const,    label: 'Raison sociale', ph: 'TechCorp Abidjan' },
              { k: 'contact' as const, label: 'Contact RH',     ph: 'Kofi Mensah' },
              { k: 'email' as const,   label: 'Email',          ph: 'drh@techcorp.ci' },
              { k: 'secteur' as const, label: 'Secteur',        ph: 'Technologie' },
              { k: 'ville' as const,   label: 'Ville',          ph: 'Abidjan' },
            ].map((f) => (
              <label key={f.k} className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">{f.label}</span>
                <input value={form[f.k]} onChange={(e) => setForm((s) => ({ ...s, [f.k]: e.target.value }))}
                  placeholder={f.ph}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none" />
              </label>
            ))}
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">Pays</span>
              <select value={form.pays} onChange={(e) => setForm((s) => ({ ...s, pays: e.target.value }))}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none">
                {PAYS.map((p) => <option key={p} value={p}>{FLAG[p]} {p}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">Effectif</span>
              <input type="number" min={0} value={form.effectif}
                onChange={(e) => setForm((s) => ({ ...s, effectif: Number(e.target.value) }))}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none" />
            </label>
          </div>
          <button type="button" disabled={busy || !form.name.trim()} onClick={handleCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[13px] font-bold text-surface disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Building2 size={14} />} Enregistrer le client
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Users,       label: 'Clients actifs',       value: `${totaux.actifs} / ${clients.length}` },
          { icon: Users,       label: 'Collaborateurs',       value: String(totaux.collaborateurs) },
          { icon: ShieldCheck, label: 'Pays couverts',        value: String(totaux.pays) },
          { icon: Clock,       label: 'En attente',           value: String(totaux.enAttente) },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-1.5">
              <k.icon size={12} className="text-ink-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{k.label}</p>
            </div>
            <p className="mono mt-1 text-[20px] font-bold leading-tight text-ink">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-3 border-b border-line px-5 py-3">
          <Search size={15} className="text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client (nom, pays)…"
            className="flex-1 bg-transparent text-[13px] font-medium text-ink placeholder:text-ink-400 focus:outline-none" />
          <span className="text-[11px] font-semibold text-ink-400">{filtered.length} résultat(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-5 py-2.5 text-left">Client</th>
                <th className="px-3 py-2.5 text-left">Pays</th>
                <th className="px-3 py-2.5 text-right">Effectif</th>
                <th className="px-3 py-2.5 text-left">Mandat</th>
                <th className="px-3 py-2.5 text-left">Modules</th>
                <th className="px-3 py-2.5 text-left">Statut</th>
                <th className="px-3 py-2.5 text-right">Conformité</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const st = STATUS_META[c.status] ?? STATUS_META.actif;
                const StatusIcon = st.icon;
                const mandat = mandatOf(c.id);
                return (
                  <tr key={c.id} className="border-b border-line/60 last:border-0 hover:bg-ink/[0.02]">
                    <td className="px-5 py-3">
                      <Link to={`/clients/${c.id}`} className="text-[13px] font-bold text-ink hover:text-amber-deep">{c.name}</Link>
                      <p className="text-[11px] font-medium text-ink-400">{c.secteur ?? '—'} · {c.ville ?? '—'}</p>
                    </td>
                    <td className="px-3 py-3 text-[12px]">{FLAG[c.pays] ?? ''} {c.pays}</td>
                    <td className="mono px-3 py-3 text-right text-[13px] text-ink-700">{c.effectif}</td>
                    <td className="px-3 py-3">
                      {mandat ? (
                        <span className="mono text-[11px] font-semibold text-ink-600">{mandat.reference}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                          <FileSignature size={10} /> Aucun
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.modules.slice(0, 3).map((m) => (
                          <span key={m} className="rounded bg-surface2 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">{m}</span>
                        ))}
                        {c.modules.length > 3 && (
                          <span className="text-[10px] font-semibold text-ink-400">+{c.modules.length - 3}</span>
                        )}
                        {c.modules.length === 0 && <span className="text-[11px] text-ink-400">—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold', st.cls)}>
                        <StatusIcon size={10} /> {st.label}
                      </span>
                    </td>
                    <td className={cn('mono px-3 py-3 text-right text-[13px] font-bold', confColor(c.conformite))}>
                      {c.conformite}%
                    </td>
                    <td className="px-5 py-3">
                      <Link to={`/clients/${c.id}`} className="inline-flex items-center gap-1 text-[12px] font-bold text-amber-deep hover:underline">
                        Fiche <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <Building2 size={26} className="mx-auto text-ink-300" />
                    <p className="mt-3 text-[14px] font-bold text-ink">
                      {clients.length === 0 ? 'Aucun client dans ce workspace' : 'Aucun résultat'}
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-ink-400">
                      {clients.length === 0
                        ? 'Ajoutez votre première entreprise cliente, puis enregistrez son mandat pour pouvoir la facturer.'
                        : 'Affinez votre recherche.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="border-t border-line px-5 py-2.5 text-[11px] font-medium text-ink-400">
          Données réelles · <span className="mono">atlas_people.clients</span>
        </p>
      </div>
    </div>
  );
}
