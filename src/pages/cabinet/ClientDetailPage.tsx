/**
 * ClientDetailPage — la fiche complète d'une entreprise cliente.
 *
 * Quatre plans, dans cet ordre parce que c'est l'ordre des questions que
 * l'on se pose devant un client :
 *   1. QUI — le mandant, son identité légale et son représentant ;
 *   2. QUOI — le mandat : nature, périmètre, durée, sortie ;
 *   3. COMBIEN — les conditions financières qui rendent la facturation
 *      calculable, et non arbitraire ;
 *   4. OÙ EN EST-ON — préfactures émises et accès portail du client.
 *
 * Tout provient de la base ; il n'y a plus aucune donnée de démonstration
 * sur cet écran.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Users, ShieldCheck, CheckCircle2, AlertCircle, Clock,
  ChevronRight, ReceiptText, ExternalLink, Mail, MapPin, CalendarDays, Layers,
  FileSignature, Scale, Landmark, Wallet, Percent, Timer, Loader2, Globe,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';
import { PRODUCT_META } from '../../app/nav';
import {
  fetchClient, fetchContracts, fetchPrefactures, fetchPortals,
  formatAmount, formatDate, MANDATE_LABEL, BILLING_LABEL, PERIOD_LABEL,
  PREFACTURE_LABEL, PORTAL_LABEL, cabinetLive,
  type Client, type ClientContract, type PrefactureWithClient, type ClientPortal,
  type PrefactureStatus, type ContractStatus,
} from '../../lib/cabinet';

const STATUS_META = {
  actif:      { label: 'Actif',      icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  en_attente: { label: 'En attente', icon: Clock,        cls: 'bg-amber-100 text-amber-700' },
  suspendu:   { label: 'Suspendu',   icon: AlertCircle,  cls: 'bg-rose-100 text-rose-700' },
} as const;

const CONTRACT_CLS: Record<ContractStatus, string> = {
  brouillon: 'bg-slate-100 text-slate-700',
  actif:     'bg-emerald-100 text-emerald-700',
  suspendu:  'bg-amber-100 text-amber-700',
  resilie:   'bg-rose-100 text-rose-700',
};

const PREFACTURE_CLS: Record<PrefactureStatus, string> = {
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

function confColor(n: number) {
  if (n >= 90) return 'text-emerald-600';
  if (n >= 75) return 'text-amber-600';
  return 'text-rose-600';
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tenantType } = useAuth();
  const product = PRODUCT_META[tenantType];

  const [client, setClient] = useState<Client | null | 'loading'>('loading');
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [prefactures, setPrefactures] = useState<PrefactureWithClient[]>([]);
  const [portals, setPortals] = useState<ClientPortal[]>([]);

  const load = useCallback(async () => {
    if (!id || !cabinetLive) { setClient(null); return; }
    const c = await fetchClient(id);
    setClient(c);
    if (!c) return;
    const [ct, pf, po] = await Promise.all([
      fetchContracts(id), fetchPrefactures(id), fetchPortals(id),
    ]);
    setContracts(ct); setPrefactures(pf); setPortals(po);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (client === 'loading') {
    return <div className="flex min-h-[300px] items-center justify-center"><Loader2 size={22} className="animate-spin text-ink-400" /></div>;
  }
  if (!client) return <Navigate to="/clients" replace />;

  const s = STATUS_META[client.status] ?? STATUS_META.actif;
  const StatusIcon = s.icon;
  const mandat = contracts.find((c) => c.status === 'actif') ?? contracts[0] ?? null;
  const encaisse = prefactures.filter((p) => p.status === 'payee').reduce((t, p) => t + p.total_amount, 0);
  const enAttente = prefactures.filter((p) => p.status === 'validee' || p.status === 'envoyee')
    .reduce((t, p) => t + p.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <Link to="/clients" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-400 transition-colors hover:text-ink">
          <ArrowLeft size={13} /> Portefeuille clients
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface2 shadow-sm">
              <Building2 size={22} className="text-ink-400" />
            </div>
            <div>
              <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em]', product.accentClass)}>{product.name}</p>
              <h1 className="font-display text-[28px] leading-tight tracking-tight text-ink">{client.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold', s.cls)}>
                  <StatusIcon size={10} /> {s.label}
                </span>
                <span className="text-[12px] font-medium text-ink-400">
                  {FLAG[client.pays] ?? client.pays} · {client.ville ?? '—'} · {client.secteur ?? '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Users,       label: 'Effectif géré',  value: String(client.effectif) },
          { icon: Layers,      label: 'Modules actifs', value: String(client.modules.length) },
          { icon: ShieldCheck, label: 'Conformité RH',  value: `${client.conformite}%`, accent: confColor(client.conformite) },
          { icon: Wallet,      label: 'Encaissé',       value: formatAmount(encaisse, mandat?.currency ?? 'XOF') },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-1.5">
              <k.icon size={12} className="text-ink-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{k.label}</p>
            </div>
            <p className={cn('mt-1 text-[18px] font-bold leading-tight', k.accent ?? 'text-ink')}>{k.value}</p>
          </div>
        ))}
      </div>

      {!mandat && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <p className="text-[13px] font-bold text-amber-900">Aucun mandat enregistré</p>
            <p className="mt-0.5 text-[12px] font-medium text-amber-800">
              Sans mandat actif, aucune préfacture ne peut être générée : les conditions de facturation
              (forfait, prix unitaire, minimum, TVA) sont inconnues.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {mandat && (
            <>
              {/* 1. LE MANDANT */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Le mandant</p>
                  <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold', CONTRACT_CLS[mandat.status])}>
                    {mandat.status}
                  </span>
                </div>
                <p className="text-[15px] font-bold text-ink">{mandat.mandant_raison_sociale}</p>
                <p className="text-[12px] font-medium text-ink-400">{mandat.mandant_forme_juridique ?? '—'}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: Landmark, label: 'RCCM', value: mandat.mandant_rccm },
                    { icon: Scale,    label: 'Identifiant fiscal (NIF)', value: mandat.mandant_nif },
                    { icon: MapPin,   label: 'Siège social', value: mandat.mandant_siege },
                    { icon: Users,    label: 'Représentant légal',
                      value: mandat.mandant_representant
                        ? `${mandat.mandant_representant}${mandat.mandant_qualite ? ` · ${mandat.mandant_qualite}` : ''}`
                        : null },
                  ].map((f) => (
                    <div key={f.label} className="flex items-start gap-2.5">
                      <f.icon size={13} className="mt-0.5 shrink-0 text-ink-300" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{f.label}</p>
                        <p className="text-[13px] font-medium text-ink-700">{f.value ?? '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-line pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Mandataire (cabinet)</p>
                  <p className="mt-1 text-[13px] font-medium text-ink-700">
                    {mandat.mandataire_signataire ?? '—'}
                    {mandat.mandataire_qualite ? ` · ${mandat.mandataire_qualite}` : ''}
                  </p>
                </div>
              </div>

              {/* 2. LE CONTRAT */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <FileSignature size={14} className="text-ink-400" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Le contrat</p>
                  <span className="mono ml-auto text-[12px] font-bold text-ink">{mandat.reference}</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Nature du mandat', value: MANDATE_LABEL[mandat.mandate_type] },
                    { label: 'Signé le',         value: formatDate(mandat.signed_on) },
                    { label: 'Prise d\'effet',   value: formatDate(mandat.effective_from) },
                    { label: 'Échéance',         value: mandat.effective_to ? formatDate(mandat.effective_to) : 'Indéterminée' },
                    { label: 'Préavis',          value: `${mandat.notice_days} jours` },
                    { label: 'Reconduction',     value: mandat.tacit_renewal ? 'Tacite' : 'Expresse' },
                  ].map((f) => (
                    <div key={f.label}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{f.label}</p>
                      <p className="text-[13px] font-semibold text-ink">{f.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-line pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    Périmètre confié · {mandat.scope_modules.length} module(s)
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {mandat.scope_modules.map((m) => (
                      <span key={m} className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface2 px-2.5 py-1 text-[11px] font-semibold text-ink">
                        <CheckCircle2 size={10} className="text-emerald-500" /> {m}
                      </span>
                    ))}
                    {mandat.scope_modules.length === 0 && <span className="text-[12px] text-ink-400">—</span>}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  {mandat.confidentiality && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface2 px-2.5 py-1 text-[11px] font-semibold text-ink-700">
                      <ShieldCheck size={11} className="text-emerald-600" /> Clause de confidentialité
                    </span>
                  )}
                  {mandat.data_protection && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface2 px-2.5 py-1 text-[11px] font-semibold text-ink-700">
                      <ShieldCheck size={11} className="text-emerald-600" /> Protection des données
                    </span>
                  )}
                  {mandat.sla_hours && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface2 px-2.5 py-1 text-[11px] font-semibold text-ink-700">
                      <Timer size={11} className="text-blue-600" /> SLA {mandat.sla_hours} h
                    </span>
                  )}
                  {mandat.payroll_cutoff_day && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface2 px-2.5 py-1 text-[11px] font-semibold text-ink-700">
                      <CalendarDays size={11} className="text-ink-400" /> Clôture paie le {mandat.payroll_cutoff_day}
                    </span>
                  )}
                </div>

                {mandat.notes && (
                  <p className="mt-4 rounded-xl bg-surface2/60 px-3 py-2.5 text-[12px] font-medium leading-relaxed text-ink-700">
                    {mandat.notes}
                  </p>
                )}
              </div>

              {/* 3. LES CONDITIONS FINANCIÈRES */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Wallet size={14} className="text-ink-400" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Conditions financières</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Wallet,  label: 'Mode de facturation', value: BILLING_LABEL[mandat.billing_mode] },
                    { icon: Wallet,  label: 'Forfait',             value: formatAmount(mandat.forfait_amount, mandat.currency) },
                    { icon: Users,   label: 'Prix unitaire',       value: formatAmount(mandat.unit_amount, mandat.currency) },
                    { icon: Wallet,  label: 'Minimum contractuel', value: formatAmount(mandat.minimum_amount, mandat.currency) },
                    { icon: CalendarDays, label: 'Périodicité',    value: `${PERIOD_LABEL[mandat.billing_period]} · le ${mandat.billing_day}` },
                    { icon: Clock,   label: 'Délai de paiement',   value: `${mandat.payment_terms_days} jours` },
                    { icon: Percent, label: 'TVA',                 value: `${mandat.tax_rate} %` },
                    { icon: Percent, label: 'Pénalités de retard',  value: `${mandat.late_penalty_rate} %` },
                    { icon: Globe,   label: 'Devise',              value: mandat.currency },
                  ].map((f) => (
                    <div key={f.label} className="rounded-xl border border-line bg-surface2/40 px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{f.label}</p>
                      <p className="mono mt-0.5 text-[13px] font-bold text-ink">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 4. PRÉFACTURES */}
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                Préfactures · {prefactures.length}
              </p>
              <span className="text-[11px] font-semibold text-ink-500">
                En attente : <span className="mono font-bold">{formatAmount(enAttente, mandat?.currency ?? 'XOF')}</span>
              </span>
            </div>
            <div className="divide-y divide-line/60">
              {prefactures.map((p) => (
                <Link key={p.id} to={`/prefacturation/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-ink/[0.02]">
                  <ReceiptText size={14} className="shrink-0 text-ink-300" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-ink">{p.period_label}</p>
                    <p className="mono text-[11px] text-ink-400">{p.reference}</p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', PREFACTURE_CLS[p.status])}>
                    {PREFACTURE_LABEL[p.status]}
                  </span>
                  <span className="mono w-32 text-right text-[13px] font-bold text-ink">
                    {formatAmount(p.total_amount, p.currency)}
                  </span>
                  <ChevronRight size={13} className="text-ink-300" />
                </Link>
              ))}
              {prefactures.length === 0 && (
                <p className="px-5 py-8 text-center text-[13px] font-medium text-ink-400">
                  Aucune préfacture émise pour ce client.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">Contact RH</p>
            <div className="space-y-2.5">
              {[
                { icon: Users,  value: client.contact },
                { icon: Mail,   value: client.email },
                { icon: MapPin, value: client.ville ? `${client.ville}, ${client.pays}` : client.pays },
                { icon: Globe,  value: client.secteur },
                { icon: CalendarDays, value: client.depuis ? `Client depuis ${client.depuis}` : null },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[13px] font-medium text-ink-500">
                  <row.icon size={13} className="shrink-0 text-ink-300" />
                  {row.value ?? '—'}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Accès portail</p>
              <Link to="/interface-client" className="text-[11px] font-bold text-amber-deep hover:underline">Gérer</Link>
            </div>
            <div className="space-y-2.5">
              {portals.map((p) => (
                <div key={p.id} className="rounded-xl border border-line bg-surface2/40 px-3 py-2.5">
                  <p className="text-[12px] font-bold text-ink">{p.contact_name}</p>
                  <p className="text-[11px] font-medium text-ink-400">{p.contact_email}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-ink-500">{PORTAL_LABEL[p.status]}</span>
                    <span className="text-[10px] font-medium text-ink-400">
                      {p.last_access_at ? formatDate(p.last_access_at) : '—'}
                    </span>
                  </div>
                </div>
              ))}
              {portals.length === 0 && (
                <p className="text-[12px] font-medium text-ink-400">Aucun accès ouvert pour ce client.</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            {[
              { label: 'Préfacturation',   to: '/prefacturation',   icon: ReceiptText },
              { label: 'Interface client', to: '/interface-client', icon: ExternalLink },
            ].map((a) => (
              <Link key={a.label} to={a.to}
                className="group flex items-center gap-2.5 rounded-2xl border border-line bg-surface p-3.5 transition-shadow hover:shadow-md">
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', product.iconBg)}>
                  <a.icon size={14} className={product.accentClass} />
                </span>
                <span className="flex-1 text-[12px] font-bold text-ink">{a.label}</span>
                <ChevronRight size={13} className="text-ink-300 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
