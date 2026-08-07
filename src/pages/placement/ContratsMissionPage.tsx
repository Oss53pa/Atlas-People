import { useState } from 'react';
import {
  Plus, Search, CheckCircle2, Clock, AlertCircle, XCircle, MoreVertical,
} from 'lucide-react';
import { cn } from '../../lib/cn';

type ContratStatut = 'actif' | 'en_cours_signature' | 'expiré' | 'résilié';

interface ContratRow {
  id: string;
  ref: string;
  travailleur: string;
  poste: string;
  siteClient: string;
  debut: string;
  fin: string;
  statut: ContratStatut;
}

const CONTRATS: ContratRow[] = [
  { id: 'ct1', ref: 'CTM-2026-001', travailleur: 'Kofi Mensah',       poste: 'Technicien SI',           siteClient: 'TechCorp Abidjan',        debut: '01/02/2026', fin: '31/07/2026', statut: 'actif' },
  { id: 'ct2', ref: 'CTM-2026-002', travailleur: 'Aminata Diallo',    poste: 'Assistante RH',           siteClient: 'OHADA Manufacturing',     debut: '15/01/2026', fin: '14/07/2026', statut: 'actif' },
  { id: 'ct3', ref: 'CTM-2026-003', travailleur: 'Ibrahima Sow',      poste: 'Opérateur logistique',    siteClient: 'Dakar Distribution',      debut: '01/03/2026', fin: '28/02/2027', statut: 'actif' },
  { id: 'ct4', ref: 'CTM-2026-004', travailleur: 'Nathalie Kouamé',   poste: 'Secrétaire de direction', siteClient: 'PanAfrica Holding SN',    debut: '01/04/2026', fin: '31/03/2027', statut: 'en_cours_signature' },
  { id: 'ct5', ref: 'CTM-2025-018', travailleur: 'Youssouf Traoré',   poste: 'Magasinier',              siteClient: 'BTP Lomé Constructions',  debut: '01/11/2025', fin: '30/04/2026', statut: 'expiré' },
  { id: 'ct6', ref: 'CTM-2025-012', travailleur: 'Cécile Ndoumbe',    poste: 'Comptable',               siteClient: '—',                       debut: '—',          fin: '—',          statut: 'résilié' },
];

const STATUT_META: Record<ContratStatut, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  actif:              { label: 'Actif',     icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  en_cours_signature: { label: 'Signature', icon: Clock,        cls: 'bg-amber-100 text-amber-700' },
  expiré:             { label: 'Expiré',    icon: AlertCircle,  cls: 'bg-slate-100 text-slate-500' },
  résilié:            { label: 'Résilié',   icon: XCircle,      cls: 'bg-rose-100 text-rose-700' },
};

export function ContratsMissionPage() {
  const [search, setSearch] = useState('');

  const filtered = CONTRATS.filter(
    (c) =>
      !search ||
      c.travailleur.toLowerCase().includes(search.toLowerCase()) ||
      c.ref.toLowerCase().includes(search.toLowerCase()) ||
      c.siteClient.toLowerCase().includes(search.toLowerCase()),
  );

  const actifs = CONTRATS.filter((c) => c.statut === 'actif').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-600">
            Atlas People Placement
          </p>
          <h1 className="mt-1 font-display text-[32px] leading-tight tracking-tight text-ink">
            Contrats de mission
          </h1>
          <p className="mt-1 text-[14px] font-medium text-ink-500">
            {actifs} actifs · {CONTRATS.length} contrats au total
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-2.5 text-[13px] font-bold text-surface shadow-sm hover:shadow-lg"
        >
          <Plus size={15} /> Nouveau contrat
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Contrats actifs',    value: actifs },
          { label: 'En signature',       value: CONTRATS.filter((c) => c.statut === 'en_cours_signature').length },
          { label: 'Expirés',            value: CONTRATS.filter((c) => c.statut === 'expiré').length },
          { label: 'Total',              value: CONTRATS.length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{s.label}</p>
            <p className="mono mt-1 text-[28px] font-bold leading-none text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search size={15} className="shrink-0 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (travailleur, référence, site)…"
            className="flex-1 bg-transparent text-[13px] font-medium text-ink placeholder:text-ink-400 focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="border-b border-line bg-surface2/40 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Référence</th>
                <th className="px-4 py-3 text-left">Travailleur</th>
                <th className="px-4 py-3 text-left">Poste</th>
                <th className="px-4 py-3 text-left">Site client</th>
                <th className="px-4 py-3 text-left">Période</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((c) => {
                const s = STATUT_META[c.statut];
                const StatusIcon = s.icon;
                return (
                  <tr key={c.id} className="group hover:bg-surface2/40">
                    <td className="mono px-4 py-3 text-[12px] font-bold text-ink-400">{c.ref}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-ink">{c.travailleur}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-ink-500">{c.poste}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-ink-500">{c.siteClient}</td>
                    <td className="px-4 py-3 text-[12px] font-medium text-ink-400">
                      {c.debut} → {c.fin}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold', s.cls)}>
                        <StatusIcon size={10} /> {s.label}
                      </span>
                    </td>
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

        <div className="border-t border-line px-4 py-3">
          <p className="text-[11px] font-medium text-ink-400">
            Données démo · Contrats réels depuis <span className="mono">atlas_people.mission_contracts</span>
          </p>
        </div>
      </div>
    </div>
  );
}
