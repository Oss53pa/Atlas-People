import { BarChart2, Users, TrendingUp, MapPin, Download, Globe } from 'lucide-react';
import { cn } from '../../lib/cn';

interface SiteKPI {
  id: string;
  nom: string;
  entreprise: string;
  pays: string;
  travailleurs: number;
  missionsActives: number;
  finsMission30j: number;
  honoraires: number;
}

const MOCK: SiteKPI[] = [
  { id: 'k1', nom: 'TechCorp — Siège Plateau',       entreprise: 'TechCorp Abidjan',       pays: 'CI', travailleurs: 3,  missionsActives: 3,  finsMission30j: 1, honoraires: 1_240_000 },
  { id: 'k2', nom: 'OHADA Mfg — Zone Ind. Yopougon', entreprise: 'OHADA Manufacturing',    pays: 'CI', travailleurs: 1,  missionsActives: 1,  finsMission30j: 0, honoraires:   890_000 },
  { id: 'k3', nom: 'Dakar Distribution — Entrepôt',  entreprise: 'Dakar Distribution',     pays: 'SN', travailleurs: 1,  missionsActives: 1,  finsMission30j: 0, honoraires:   390_000 },
  { id: 'k4', nom: 'PanAfrica SN — Bureau Dakar',    entreprise: 'PanAfrica Holding SN',   pays: 'SN', travailleurs: 1,  missionsActives: 1,  finsMission30j: 0, honoraires:   420_000 },
  { id: 'k5', nom: 'BTP Lomé — Chantier Lomé Nord',  entreprise: 'BTP Lomé Constructions', pays: 'TG', travailleurs: 0,  missionsActives: 0,  finsMission30j: 0, honoraires:         0 },
  { id: 'k6', nom: 'Groupe Soleil — Douala',         entreprise: 'Groupe Soleil CM',       pays: 'CM', travailleurs: 0,  missionsActives: 0,  finsMission30j: 0, honoraires:         0 },
];

const FLAG: Record<string, string> = { CI: '🇨🇮', SN: '🇸🇳', CM: '🇨🇲', TG: '🇹🇬' };

export function RapportAgencePage() {
  const totalTrav     = MOCK.reduce((s, k) => s + k.travailleurs, 0);
  const totalHonor    = MOCK.reduce((s, k) => s + k.honoraires, 0);
  const sitesActifs   = MOCK.filter((k) => k.missionsActives > 0).length;
  const finsMission   = MOCK.reduce((s, k) => s + k.finsMission30j, 0);

  const maxHonor = Math.max(...MOCK.map((k) => k.honoraires), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-600">
            Atlas People Placement
          </p>
          <h1 className="mt-1 font-display text-[32px] leading-tight tracking-tight text-ink">
            Rapport agence
          </h1>
          <p className="mt-1 text-[14px] font-medium text-ink-500">
            Vue consolidée · {MOCK.length} sites · juillet 2026
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5 text-[13px] font-bold text-ink-500 shadow-sm hover:shadow"
        >
          <Download size={15} /> Exporter PDF
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Users,      label: 'Travailleurs placés',   value: `${totalTrav}`, accent: '' },
          { icon: MapPin,     label: 'Sites actifs',           value: `${sitesActifs} / ${MOCK.length}`, accent: '' },
          { icon: TrendingUp, label: 'Honoraires (XOF)',       value: (totalHonor / 1_000_000).toFixed(2) + ' M', accent: '' },
          { icon: BarChart2,  label: 'Fins de mission < 30 j', value: `${finsMission}`, accent: finsMission > 0 ? 'text-amber-600' : '' },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <k.icon size={13} className="text-ink-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{k.label}</p>
            </div>
            <p className={cn('mono mt-1 text-[22px] font-bold leading-tight', k.accent || 'text-ink')}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Barchart honoraires */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <p className="mb-4 flex items-center gap-2 text-[12px] font-bold text-ink">
          <TrendingUp size={14} className="text-ink-400" /> Honoraires par site (XOF)
        </p>
        <div className="space-y-3">
          {MOCK.filter((k) => k.honoraires > 0).map((k) => (
            <div key={k.id} className="flex items-center gap-3">
              <p className="w-[180px] shrink-0 truncate text-[12px] font-semibold text-ink-500" title={k.nom}>
                {k.entreprise}
              </p>
              <div className="flex-1 overflow-hidden rounded-full bg-surface2" style={{ height: 8 }}>
                <div
                  className="h-full rounded-full bg-rose-400 transition-all"
                  style={{ width: `${(k.honoraires / maxHonor) * 100}%` }}
                />
              </div>
              <p className="mono w-[96px] shrink-0 text-right text-[12px] font-bold text-ink">
                {k.honoraires.toLocaleString('fr-FR')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Table détail */}
      <div className="rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="flex items-center gap-2 text-[12px] font-bold text-ink">
            <BarChart2 size={14} className="text-ink-400" /> Détail par site
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-400">
            <Globe size={12} />
            {[...new Set(MOCK.map((k) => k.pays))].length} pays
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-line bg-surface2/40 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Site</th>
                <th className="px-4 py-3 text-center">Pays</th>
                <th className="px-4 py-3 text-center">Trav. placés</th>
                <th className="px-4 py-3 text-center">Missions actives</th>
                <th className="px-4 py-3 text-center">Fins &lt; 30 j</th>
                <th className="px-4 py-3 text-right">Honoraires (XOF)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {MOCK.map((k) => (
                <tr key={k.id} className="hover:bg-surface2/40">
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-semibold text-ink">{k.nom}</p>
                    <p className="text-[11px] font-medium text-ink-400">{k.entreprise}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-[13px]">{FLAG[k.pays] ?? k.pays}</td>
                  <td className="mono px-4 py-3 text-center text-[13px] font-medium text-ink">{k.travailleurs}</td>
                  <td className="mono px-4 py-3 text-center text-[13px] font-medium text-ink">{k.missionsActives}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('mono text-[13px] font-bold', k.finsMission30j > 0 ? 'text-amber-600' : 'text-ink-400')}>
                      {k.finsMission30j}
                    </span>
                  </td>
                  <td className="mono px-4 py-3 text-right text-[13px] font-semibold text-ink">
                    {k.honoraires > 0 ? k.honoraires.toLocaleString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-line px-4 py-3">
          <p className="text-[11px] font-medium text-ink-400">
            Données démo · Rapport réel depuis <span className="mono">atlas_people.rapport_agence_view</span>
          </p>
        </div>
      </div>
    </div>
  );
}
