import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, ChevronRight,
  CheckCircle2, AlertCircle, Clock, Users,
  Building2, Globe,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';
import { useAuthStore } from '../../lib/auth';
import { PRODUCT_META } from '../../app/nav';
import { MOCK_CLIENTS, FLAG, type ClientRow } from '../../data/mockClients';
import { supabase, isBackendConfigured } from '../../lib/supabase';

const STATUS_META = {
  actif:      { label: 'Actif',      icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  en_attente: { label: 'En attente', icon: Clock,        cls: 'bg-amber-100 text-amber-700' },
  suspendu:   { label: 'Suspendu',   icon: AlertCircle,  cls: 'bg-rose-100 text-rose-700' },
} as const;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'il y a < 1 h';
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

function mapDbClient(row: Record<string, unknown>): ClientRow {
  return {
    id:         row.id as string,
    name:       row.name as string,
    pays:       (row.pays as string) ?? '',
    effectif:   (row.effectif as number) ?? 0,
    status:     (row.status as ClientRow['status']) ?? 'actif',
    modules:    (row.modules as string[]) ?? [],
    lastSync:   row.updated_at ? relativeTime(row.updated_at as string) : '—',
    contact:    (row.contact as string) ?? '—',
    email:      (row.email as string) ?? '—',
    secteur:    (row.secteur as string) ?? '—',
    ville:      (row.ville as string) ?? '—',
    depuis:     (row.depuis as string) ?? '—',
    conformite: (row.conformite as number) ?? 0,
  };
}

export function PortefeuilleClientsPage() {
  const [search, setSearch] = useState('');
  const [realClients, setRealClients] = useState<ClientRow[] | null>(null);
  const { tenantType } = useAuth();
  const tenantId = useAuthStore((s) => s.tenantId);
  const product = PRODUCT_META[tenantType];

  useEffect(() => {
    if (!supabase || !isBackendConfigured || !tenantId) return;
    supabase
      .schema('atlas_people')
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name')
      .then(({ data }) => {
        if (data && data.length > 0) setRealClients(data.map(mapDbClient));
      });
  }, [tenantId]);

  const displayClients = realClients ?? MOCK_CLIENTS;
  const isLive = isBackendConfigured && realClients !== null;

  const filtered = displayClients.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.pays.toLowerCase().includes(search.toLowerCase())
  );

  const totalEffectif = displayClients.reduce((s, c) => s + c.effectif, 0);
  const actifs = displayClients.filter((c) => c.status === 'actif').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em]', product.accentClass)}>
            {product.name}
          </p>
          <h1 className="mt-1 font-display text-[32px] leading-tight tracking-tight text-ink">
            Portefeuille clients
          </h1>
          <p className="mt-1 text-[14px] font-medium text-ink-500">
            {actifs} clients actifs · {totalEffectif.toLocaleString('fr-FR')} collaborateurs gérés
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-2.5 text-[13px] font-bold text-surface shadow-sm transition-shadow hover:shadow-lg"
        >
          <Plus size={15} /> Ajouter un client
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Clients actifs',    value: actifs,                                          unit: `/ ${displayClients.length}` },
          { label: 'Collaborateurs',    value: totalEffectif.toLocaleString('fr-FR'),           unit: 'gérés' },
          { label: 'Pays couverts',     value: [...new Set(displayClients.map(c => c.pays))].length, unit: 'OHADA' },
          { label: 'En attente',        value: displayClients.filter(c => c.status === 'en_attente').length, unit: 'clients' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{s.label}</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="mono text-[24px] font-bold leading-none text-ink">{s.value}</span>
              <span className="text-[11px] font-medium text-ink-500">{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Liste clients */}
      <div className="rounded-2xl border border-line bg-surface shadow-sm">
        {/* Barre de recherche */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search size={15} className="shrink-0 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client (nom, pays)…"
            className="flex-1 bg-transparent text-[13px] font-medium text-ink placeholder:text-ink-400 focus:outline-none"
          />
          <span className="text-[11px] font-medium text-ink-400">{filtered.length} résultats</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface2/40 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Pays</th>
                <th className="px-4 py-3 text-center">Effectif</th>
                <th className="px-4 py-3 text-left">Modules actifs</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-left">Sync</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((c) => {
                const s = STATUS_META[c.status];
                const StatusIcon = s.icon;
                return (
                  <tr key={c.id} className="group hover:bg-surface2/40">
                    <td className="px-4 py-3">
                      <Link to={`/clients/${c.id}`} className="flex items-center gap-3 hover:underline">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface2 text-[13px] font-bold text-ink-500">
                          <Building2 size={16} />
                        </span>
                        <span className="text-[13px] font-semibold text-ink">{c.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500">
                        <span>{FLAG[c.pays] ?? <Globe size={12} />}</span> {c.pays}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink">
                        <Users size={12} className="text-ink-400" /> {c.effectif}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.modules.map((m) => (
                          <span key={m} className="rounded-md bg-surface2 px-2 py-0.5 text-[10px] font-semibold text-ink-500">
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold', s.cls)}>
                        <StatusIcon size={10} /> {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-medium text-ink-400">{c.lastSync}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/clients/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-ink-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface2 hover:text-ink"
                      >
                        Détail <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-line px-4 py-3">
          {isLive ? (
            <p className="text-[11px] font-medium text-emerald-600">
              <CheckCircle2 size={10} className="mr-1 inline" /> Données live · <span className="mono">atlas_people.clients</span>
            </p>
          ) : (
            <p className="text-[11px] font-medium text-ink-400">
              Données démo · <span className="mono">atlas_people.clients</span>
            </p>
          )}
        </div>
      </div>

      {/* Accès rapide modules cabinet */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Préfacturation',   desc: 'Honoraires et facturation clients',         to: '/prefacturation' },
          { label: 'Rapport cabinet',  desc: 'KPIs consolidés de tout le portefeuille',   to: '/rapport-cabinet' },
          { label: 'Interface client', desc: 'Portail lecture pour vos clients',          to: '/interface-client' },
        ].map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="group rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-ink">{card.label}</span>
              <ChevronRight size={14} className="text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-500" />
            </div>
            <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-ink-500">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
