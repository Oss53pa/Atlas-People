import { useState } from 'react';
import { Building2, Plus, Search, Users, CheckCircle2, Clock, AlertCircle, MoreVertical } from 'lucide-react';
import { cn } from '../../lib/cn';

type SiteStatut = 'actif' | 'en_cours' | 'inactif';

interface SiteRow {
  id: string;
  nom: string;
  entreprise: string;
  ville: string;
  pays: string;
  travailleurs: number;
  contactNom: string;
  contactEmail: string;
  statut: SiteStatut;
}

const SITES: SiteRow[] = [
  { id: 's1', nom: 'TechCorp — Siège Plateau',       entreprise: 'TechCorp Abidjan',        ville: 'Abidjan', pays: 'CI', travailleurs: 3,  contactNom: 'Kofi Mensah',     contactEmail: 'drh@techcorp.ci',         statut: 'actif' },
  { id: 's2', nom: 'OHADA Mfg — Zone Ind. Yopougon', entreprise: 'OHADA Manufacturing',     ville: 'Abidjan', pays: 'CI', travailleurs: 1,  contactNom: 'Fatou Diallo',    contactEmail: 'fatou@ohada-mfg.ci',      statut: 'actif' },
  { id: 's3', nom: 'Dakar Distribution — Entrepôt',  entreprise: 'Dakar Distribution',      ville: 'Dakar',   pays: 'SN', travailleurs: 1,  contactNom: 'Amadou Ba',       contactEmail: 'amdou.ba@dakardist.sn',   statut: 'actif' },
  { id: 's4', nom: 'PanAfrica SN — Bureau Dakar',    entreprise: 'PanAfrica Holding SN',    ville: 'Dakar',   pays: 'SN', travailleurs: 1,  contactNom: 'Ibrahima Diop',   contactEmail: 'ibrahima@panafrica.sn',   statut: 'en_cours' },
  { id: 's5', nom: 'BTP Lomé — Chantier Lomé Nord',  entreprise: 'BTP Lomé Constructions',  ville: 'Lomé',    pays: 'TG', travailleurs: 0,  contactNom: 'Sékou Agbéko',    contactEmail: 'rh@btplome.tg',           statut: 'inactif' },
  { id: 's6', nom: 'Groupe Soleil — Douala',         entreprise: 'Groupe Soleil CM',        ville: 'Douala',  pays: 'CM', travailleurs: 0,  contactNom: 'Jean-Paul Nkolo', contactEmail: 'jp.nkolo@groupesoleil.cm', statut: 'en_cours' },
];

const STATUT_META: Record<SiteStatut, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  actif:    { label: 'Actif',    icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  en_cours: { label: 'En cours', icon: Clock,        cls: 'bg-amber-100 text-amber-700' },
  inactif:  { label: 'Inactif',  icon: AlertCircle,  cls: 'bg-slate-100 text-slate-500' },
};

const FLAG: Record<string, string> = { CI: '🇨🇮', SN: '🇸🇳', CM: '🇨🇲', TG: '🇹🇬' };

export function SitesClientsPage() {
  const [search, setSearch] = useState('');

  const filtered = SITES.filter(
    (s) =>
      !search ||
      s.nom.toLowerCase().includes(search.toLowerCase()) ||
      s.entreprise.toLowerCase().includes(search.toLowerCase()) ||
      s.ville.toLowerCase().includes(search.toLowerCase()),
  );

  const actifs = SITES.filter((s) => s.statut === 'actif').length;
  const totalWorkers = SITES.reduce((sum, s) => sum + s.travailleurs, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-600">
            Atlas People Placement
          </p>
          <h1 className="mt-1 font-display text-[32px] leading-tight tracking-tight text-ink">
            Sites & entreprises
          </h1>
          <p className="mt-1 text-[14px] font-medium text-ink-500">
            {actifs} sites actifs · {totalWorkers} travailleurs placés
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-2.5 text-[13px] font-bold text-surface shadow-sm hover:shadow-lg"
        >
          <Plus size={15} /> Nouveau site
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Sites actifs',         value: actifs },
          { label: 'Sites en cours',       value: SITES.filter((s) => s.statut === 'en_cours').length },
          { label: 'Travailleurs placés',  value: totalWorkers },
          { label: 'Entreprises clientes', value: new Set(SITES.map((s) => s.entreprise)).size },
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
            placeholder="Rechercher (site, entreprise, ville)…"
            className="flex-1 bg-transparent text-[13px] font-medium text-ink placeholder:text-ink-400 focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-line bg-surface2/40 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Site</th>
                <th className="px-4 py-3 text-left">Entreprise</th>
                <th className="px-4 py-3 text-left">Ville</th>
                <th className="px-4 py-3 text-center">Pays</th>
                <th className="px-4 py-3 text-center">Travailleurs</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((s) => {
                const meta = STATUT_META[s.statut];
                const StatusIcon = meta.icon;
                return (
                  <tr key={s.id} className="group hover:bg-surface2/40">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                        <Building2 size={13} className="shrink-0 text-ink-300" /> {s.nom}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium text-ink-500">{s.entreprise}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-ink-500">{s.ville}</td>
                    <td className="px-4 py-3 text-center text-[13px]">{FLAG[s.pays] ?? s.pays}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink">
                        <Users size={11} className="text-ink-400" /> {s.travailleurs}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] font-semibold text-ink">{s.contactNom}</p>
                      <p className="text-[11px] font-medium text-ink-400">{s.contactEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold', meta.cls)}>
                        <StatusIcon size={10} /> {meta.label}
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
            Données démo · Sites réels depuis <span className="mono">atlas_people.client_sites</span>
          </p>
        </div>
      </div>
    </div>
  );
}
