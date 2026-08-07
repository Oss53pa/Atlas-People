import { useState } from 'react';
import {
  Plus, Search, CheckCircle2, Clock, Send, Banknote,
  ChevronRight, Download, Filter,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';
import { PRODUCT_META } from '../../app/nav';

type PFStatut = 'draft' | 'validée' | 'envoyée' | 'payée';

interface PrefactureRow {
  id: string;
  client: string;
  pays: string;
  collab: number;
  periode: string;
  montantHT: number;
  statut: PFStatut;
}

const MOCK_PF: PrefactureRow[] = [
  { id: 'pf1', client: 'TechCorp Abidjan',       pays: 'CI', collab: 87,  periode: 'Juillet 2026', montantHT: 1_240_000, statut: 'envoyée' },
  { id: 'pf2', client: 'OHADA Manufacturing',    pays: 'CI', collab: 245, periode: 'Juillet 2026', montantHT: 2_890_000, statut: 'validée' },
  { id: 'pf3', client: 'PanAfrica Holding SN',   pays: 'SN', collab: 134, periode: 'Juillet 2026', montantHT: 1_680_000, statut: 'draft' },
  { id: 'pf4', client: 'Dakar Distribution',     pays: 'SN', collab: 31,  periode: 'Juin 2026',    montantHT: 390_000,   statut: 'payée' },
  { id: 'pf5', client: 'Groupe Soleil CM',       pays: 'CM', collab: 62,  periode: 'Juin 2026',    montantHT: 780_000,   statut: 'payée' },
  { id: 'pf6', client: 'BTP Lomé Constructions', pays: 'TG', collab: 110, periode: 'Mai 2026',     montantHT: 1_150_000, statut: 'payée' },
];

const STATUT_META: Record<PFStatut, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  draft:   { label: 'Brouillon', icon: Clock,        cls: 'bg-slate-100 text-slate-600' },
  validée: { label: 'Validée',   icon: CheckCircle2, cls: 'bg-amber-100 text-amber-700' },
  envoyée: { label: 'Envoyée',   icon: Send,         cls: 'bg-blue-100 text-blue-700' },
  payée:   { label: 'Payée',     icon: Banknote,     cls: 'bg-emerald-100 text-emerald-700' },
};

const FLAG: Record<string, string> = { CI: '🇨🇮', SN: '🇸🇳', CM: '🇨🇲', TG: '🇹🇬' };

export function PrefacturationPage() {
  const [search, setSearch] = useState('');
  const { tenantType } = useAuth();
  const product = PRODUCT_META[tenantType];

  const filtered = MOCK_PF.filter(
    (r) =>
      !search ||
      r.client.toLowerCase().includes(search.toLowerCase()) ||
      r.periode.toLowerCase().includes(search.toLowerCase()),
  );

  const totalHT       = MOCK_PF.reduce((s, r) => s + r.montantHT, 0);
  const totalEnvoyées = MOCK_PF.filter((r) => r.statut === 'envoyée').reduce((s, r) => s + r.montantHT, 0);
  const totalPayées   = MOCK_PF.filter((r) => r.statut === 'payée').reduce((s, r) => s + r.montantHT, 0);
  const nbDraft       = MOCK_PF.filter((r) => r.statut === 'draft').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em]', product.accentClass)}>
            {product.name}
          </p>
          <h1 className="mt-1 font-display text-[32px] leading-tight tracking-tight text-ink">
            Préfacturation
          </h1>
          <p className="mt-1 text-[14px] font-medium text-ink-500">
            Honoraires cabinet · {MOCK_PF.length} lignes sur 3 périodes
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-2.5 text-[13px] font-bold text-surface shadow-sm hover:shadow-lg"
        >
          <Plus size={15} /> Nouvelle préfacture
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total HT (toutes périodes)', value: totalHT.toLocaleString('fr-FR') + ' XOF', cls: '' },
          { label: 'Envoyées en attente',         value: totalEnvoyées.toLocaleString('fr-FR') + ' XOF', cls: 'text-blue-600' },
          { label: 'Encaissées',                  value: totalPayées.toLocaleString('fr-FR') + ' XOF',   cls: 'text-emerald-600' },
          { label: 'Brouillons à valider',        value: `${nbDraft}`,                                   cls: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{s.label}</p>
            <p className={cn('mono mt-1 text-[15px] font-bold leading-tight', s.cls || 'text-ink')}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search size={15} className="shrink-0 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (client, période)…"
            className="flex-1 bg-transparent text-[13px] font-medium text-ink placeholder:text-ink-400 focus:outline-none"
          />
          <button type="button" className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] font-semibold text-ink-500 hover:bg-surface2">
            <Filter size={12} /> Filtrer
          </button>
          <button type="button" className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] font-semibold text-ink-500 hover:bg-surface2">
            <Download size={12} /> Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-line bg-surface2/40 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-center">Pays</th>
                <th className="px-4 py-3 text-center">Collab.</th>
                <th className="px-4 py-3 text-left">Période</th>
                <th className="px-4 py-3 text-right">Montant HT</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((r) => {
                const s = STATUT_META[r.statut];
                const StatusIcon = s.icon;
                return (
                  <tr key={r.id} className="group hover:bg-surface2/40">
                    <td className="px-4 py-3 text-[13px] font-semibold text-ink">{r.client}</td>
                    <td className="px-4 py-3 text-center text-[13px]">{FLAG[r.pays] ?? r.pays}</td>
                    <td className="mono px-4 py-3 text-center text-[13px] font-medium text-ink">{r.collab}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-ink-500">{r.periode}</td>
                    <td className="mono px-4 py-3 text-right text-[13px] font-semibold text-ink">
                      {r.montantHT.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold', s.cls)}>
                        <StatusIcon size={10} /> {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-ink-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface2 hover:text-ink">
                        Détail <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-line px-4 py-3">
          <p className="text-[11px] font-medium text-ink-400">
            Données démo · Préfactures réelles depuis <span className="mono">atlas_people.prefactures</span>
          </p>
        </div>
      </div>
    </div>
  );
}
