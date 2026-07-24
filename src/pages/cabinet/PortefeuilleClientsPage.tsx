/**
 * Portefeuille clients — page d'accueil des modes cabinet.
 * Atlas People Conseil / Atlas Payroll / Atlas People 360 / Atlas People Placement
 *
 * Stub v1 : liste factice de clients avec statut, accès rapide.
 * Prochaine étape : données réelles depuis atlas_people.clients.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Search, Plus, ChevronRight,
  CheckCircle2, AlertCircle, Clock, Users,
  Building2, Globe, MoreVertical,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';
import { PRODUCT_META } from '../../app/nav';

interface ClientRow {
  id: string;
  name: string;
  pays: string;
  effectif: number;
  status: 'actif' | 'en_attente' | 'suspendu';
  modules: string[];
  lastSync: string;
}

const MOCK_CLIENTS: ClientRow[] = [
  { id: 'c1', name: 'TechCorp Abidjan',       pays: 'CI', effectif: 87,  status: 'actif',      modules: ['RH', 'Paie', 'Formation'],  lastSync: 'il y a 2 h' },
  { id: 'c2', name: 'OHADA Manufacturing',    pays: 'CI', effectif: 245, status: 'actif',      modules: ['Paie', 'Temps'],            lastSync: 'il y a 4 h' },
  { id: 'c3', name: 'PanAfrica Holding SN',   pays: 'SN', effectif: 134, status: 'actif',      modules: ['RH', 'Paie', 'OKR'],        lastSync: 'il y a 1 j' },
  { id: 'c4', name: 'Groupe Soleil CM',       pays: 'CM', effectif: 62,  status: 'en_attente', modules: ['Paie'],                     lastSync: 'en attente' },
  { id: 'c5', name: 'Dakar Distribution',     pays: 'SN', effectif: 31,  status: 'actif',      modules: ['RH', 'Paie'],               lastSync: 'il y a 6 h' },
  { id: 'c6', name: 'BTP Lomé Constructions', pays: 'TG', effectif: 110, status: 'suspendu',   modules: ['Paie'],                     lastSync: 'il y a 5 j' },
];

const STATUS_META: Record<ClientRow['status'], { label: string; icon: typeof CheckCircle2; cls: string }> = {
  actif:      { label: 'Actif',      icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  en_attente: { label: 'En attente', icon: Clock,        cls: 'bg-amber-100 text-amber-700' },
  suspendu:   { label: 'Suspendu',   icon: AlertCircle,  cls: 'bg-rose-100 text-rose-700' },
};

const FLAG: Record<string, string> = { CI: '🇨🇮', SN: '🇸🇳', CM: '🇨🇲', TG: '🇹🇬', BJ: '🇧🇯', BF: '🇧🇫' };

export function PortefeuilleClientsPage() {
  const [search, setSearch] = useState('');
  const { tenantType } = useAuth();
  const product = PRODUCT_META[tenantType];

  const filtered = MOCK_CLIENTS.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.pays.toLowerCase().includes(search.toLowerCase())
  );

  const totalEffectif = MOCK_CLIENTS.reduce((s, c) => s + c.effectif, 0);
  const actifs = MOCK_CLIENTS.filter((c) => c.status === 'actif').length;

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
          { label: 'Clients actifs',    value: actifs,                          unit: `/ ${MOCK_CLIENTS.length}` },
          { label: 'Collaborateurs',    value: totalEffectif.toLocaleString('fr-FR'), unit: 'gérés' },
          { label: 'Pays couverts',     value: [...new Set(MOCK_CLIENTS.map(c => c.pays))].length, unit: 'OHADA' },
          { label: 'En attente',        value: MOCK_CLIENTS.filter(c => c.status === 'en_attente').length, unit: 'clients' },
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
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface2 text-[13px] font-bold text-ink-500">
                          <Building2 size={16} />
                        </span>
                        <span className="text-[13px] font-semibold text-ink">{c.name}</span>
                      </div>
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
                    <td className="px-4 py-3">
                      <button type="button" className="rounded-lg p-1 text-ink-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface2 hover:text-ink-500">
                        <MoreVertical size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-line px-4 py-3">
          <p className="text-[11px] font-medium text-ink-400">
            Données démo · Les clients réels seront chargés depuis <span className="mono">atlas_people.clients</span>
          </p>
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
