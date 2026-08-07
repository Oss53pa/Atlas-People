/**
 * InterfaceClientPage — les accès portail ouverts à vos clients.
 *
 * Un accès client n'est pas un booléen : il a un cycle de vie (non activé →
 * invité → actif → révoqué), un périmètre de consultation, et laisse une
 * trace. Les transitions écrites ici sont journalisées par la base
 * (trigger log_portal_transition), donc « qui a eu accès à quoi, et quand »
 * reste répondable après coup.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink, Plus, Loader2, AlertCircle, Send, CheckCircle2, Ban,
  Mail, Clock, Eye, ShieldCheck, History, ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';
import { PRODUCT_META } from '../../app/nav';
import {
  fetchPortals, fetchClients, fetchPortalAccess, createPortal, setPortalStatus,
  formatDate, PORTAL_LABEL, cabinetLive,
  type ClientPortal, type Client, type PortalStatus, type PortalAccess,
} from '../../lib/cabinet';

const STATUS_CLS: Record<PortalStatus, string> = {
  non_active: 'bg-slate-100 text-slate-700',
  invite:     'bg-amber-100 text-amber-700',
  actif:      'bg-emerald-100 text-emerald-700',
  revoque:    'bg-rose-100 text-rose-700',
};

/** Transitions proposées — miroir du cycle de vie porté par la base. */
const TRANSITIONS: Record<PortalStatus, Array<{ to: PortalStatus; label: string; icon: typeof Send }>> = {
  non_active: [{ to: 'invite', label: 'Inviter', icon: Send }],
  invite:     [{ to: 'actif', label: 'Activer', icon: CheckCircle2 }, { to: 'revoque', label: 'Révoquer', icon: Ban }],
  actif:      [{ to: 'revoque', label: 'Révoquer', icon: Ban }],
  revoque:    [{ to: 'invite', label: 'Réinviter', icon: Send }],
};

export function InterfaceClientPage() {
  const { tenantType } = useAuth();
  const product = PRODUCT_META[tenantType];

  const [portals, setPortals] = useState<ClientPortal[] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ client_id: '', contact_name: '', contact_email: '' });
  const [openLog, setOpenLog] = useState<string | null>(null);
  const [log, setLog] = useState<PortalAccess[]>([]);

  const load = useCallback(async () => {
    if (!cabinetLive) { setPortals([]); return; }
    try {
      const [p, c] = await Promise.all([fetchPortals(), fetchClients()]);
      setPortals(p); setClients(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chargement impossible');
      setPortals([]);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? '—';

  const transition = async (portal: ClientPortal, to: PortalStatus) => {
    setBusy(portal.id); setError(null);
    try {
      await setPortalStatus(portal.id, to);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action impossible');
    } finally { setBusy(null); }
  };

  const handleCreate = async () => {
    if (!form.client_id || !form.contact_name || !form.contact_email) return;
    setBusy('new'); setError(null);
    try {
      await createPortal(form);
      setForm({ client_id: '', contact_name: '', contact_email: '' });
      setCreating(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Création impossible');
    } finally { setBusy(null); }
  };

  const toggleLog = async (portalId: string) => {
    if (openLog === portalId) { setOpenLog(null); return; }
    setOpenLog(portalId);
    setLog(await fetchPortalAccess(portalId));
  };

  if (portals === null) {
    return <div className="flex min-h-[300px] items-center justify-center"><Loader2 size={22} className="animate-spin text-ink-400" /></div>;
  }

  const count = (s: PortalStatus) => portals.filter((p) => p.status === s).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em]', product.accentClass)}>{product.name}</p>
          <h1 className="font-display text-[28px] leading-tight tracking-tight text-ink">Interface client</h1>
          <p className="mt-1 text-[13px] font-medium text-ink-500">
            Portail lecture pour vos clients · {count('actif')} actif(s) · {count('invite')} en attente
          </p>
        </div>
        <button type="button" onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[13px] font-bold text-surface transition-shadow hover:shadow-lg">
          <Plus size={15} /> Inviter un client
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
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Nouvel accès portail</p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">Client</span>
              <select value={form.client_id} onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
                className="min-w-[14rem] rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none">
                <option value="">— Sélectionner —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">Contact RH</span>
              <input value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                placeholder="Kofi Mensah"
                className="rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">Email</span>
              <input type="email" value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                placeholder="drh@client.ci"
                className="rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none" />
            </label>
            <button type="button" disabled={busy === 'new'} onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[13px] font-bold text-surface disabled:opacity-50">
              {busy === 'new' ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Créer l'accès
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          { label: 'Portails actifs',     s: 'actif' as const,      icon: CheckCircle2, cls: 'text-emerald-600' },
          { label: 'Invitations en cours', s: 'invite' as const,     icon: Send,         cls: 'text-amber-600' },
          { label: 'Non activés',          s: 'non_active' as const, icon: Clock,        cls: 'text-ink' },
          { label: 'Révoqués',             s: 'revoque' as const,    icon: Ban,          cls: 'text-rose-600' },
        ]).map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-1.5">
              <k.icon size={12} className="text-ink-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{k.label}</p>
            </div>
            <p className={cn('mono mt-1 text-[20px] font-bold leading-tight', k.cls)}>{count(k.s)}</p>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="border-b border-line px-5 py-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Accès portail par client</p>
        </div>

        <div className="divide-y divide-line/60">
          {portals.map((p) => (
            <div key={p.id}>
              <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <Link to={`/clients/${p.client_id}`} className="text-[13px] font-bold text-ink hover:text-amber-deep">
                    {clientName(p.client_id)}
                  </Link>
                  <p className="text-[12px] font-medium text-ink-500">{p.contact_name} · {p.contact_email}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {[
                      { on: p.scope_payslips,   label: 'Bulletins' },
                      { on: p.scope_headcount,  label: 'Effectifs' },
                      { on: p.scope_compliance, label: 'Conformité' },
                      { on: p.scope_invoices,   label: 'Factures' },
                      { on: p.scope_documents,  label: 'Documents' },
                    ].filter((s) => s.on).map((s) => (
                      <span key={s.label} className="inline-flex items-center gap-1 rounded bg-surface2 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">
                        <Eye size={9} /> {s.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold', STATUS_CLS[p.status])}>
                    {PORTAL_LABEL[p.status]}
                  </span>
                  <p className="mt-1 text-[11px] font-medium text-ink-400">
                    Dernier accès : {formatDate(p.last_access_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {TRANSITIONS[p.status].map((t) => (
                    <button key={t.to} type="button" disabled={busy === p.id}
                      onClick={() => transition(p, t.to)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-bold transition-colors disabled:opacity-50',
                        t.to === 'revoque'
                          ? 'border-line text-rose-600 hover:border-rose-300'
                          : 'border-line text-ink hover:border-amber-deep/40',
                      )}>
                      {busy === p.id ? <Loader2 size={12} className="animate-spin" /> : <t.icon size={12} />}
                      {t.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => toggleLog(p.id)}
                    title="Journal des accès"
                    className="rounded-xl border border-line p-2 text-ink-400 transition-colors hover:text-ink">
                    <History size={13} />
                  </button>
                </div>
              </div>

              {openLog === p.id && (
                <div className="border-t border-line bg-surface2/40 px-5 py-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-400">Journal des accès</p>
                  <ul className="space-y-1.5">
                    {log.map((a) => (
                      <li key={a.id} className="flex items-center gap-2 text-[12px] font-medium text-ink-600">
                        <ChevronRight size={11} className="text-ink-300" />
                        <span className="mono text-ink-400">{formatDate(a.occurred_at)}</span>
                        <span className="font-bold text-ink">{a.action}</span>
                        <span className="text-ink-500">{a.detail}</span>
                      </li>
                    ))}
                    {log.length === 0 && <li className="text-[12px] text-ink-400">Aucun événement enregistré.</li>}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {portals.length === 0 && (
            <div className="px-5 py-12 text-center">
              <ExternalLink size={26} className="mx-auto text-ink-300" />
              <p className="mt-3 text-[14px] font-bold text-ink">Aucun accès portail</p>
              <p className="mt-1 text-[12px] font-medium text-ink-400">
                Invitez le contact RH d'un client pour lui ouvrir la consultation de ses données.
              </p>
            </div>
          )}
        </div>

        <p className="border-t border-line px-5 py-2.5 text-[11px] font-medium text-ink-400">
          <ShieldCheck size={11} className="mr-1 inline text-emerald-500" />
          Données réelles · <span className="mono">atlas_people.client_portals</span> · chaque transition est journalisée
        </p>
      </div>
    </div>
  );
}
