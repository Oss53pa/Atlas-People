import { BarChart2, Users, TrendingUp, ShieldCheck, Download, Globe } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';
import { PRODUCT_META } from '../../app/nav';

interface ClientKPI {
  id: string;
  name: string;
  pays: string;
  collab: number;
  modules: number;
  conformite: number;
  masseSalariale: number;
  statut: 'actif' | 'en_attente' | 'suspendu';
}

const MOCK_KPI: ClientKPI[] = [
  { id: 'c1', name: 'TechCorp Abidjan',       pays: 'CI', collab: 87,  modules: 5, conformite: 94, masseSalariale: 18_700_000, statut: 'actif' },
  { id: 'c2', name: 'OHADA Manufacturing',    pays: 'CI', collab: 245, modules: 3, conformite: 88, masseSalariale: 52_400_000, statut: 'actif' },
  { id: 'c3', name: 'PanAfrica Holding SN',   pays: 'SN', collab: 134, modules: 4, conformite: 97, masseSalariale: 28_600_000, statut: 'actif' },
  { id: 'c4', name: 'Groupe Soleil CM',       pays: 'CM', collab: 62,  modules: 1, conformite: 72, masseSalariale: 11_200_000, statut: 'en_attente' },
  { id: 'c5', name: 'Dakar Distribution',     pays: 'SN', collab: 31,  modules: 2, conformite: 91, masseSalariale:  5_600_000, statut: 'actif' },
  { id: 'c6', name: 'BTP Lomé Constructions', pays: 'TG', collab: 110, modules: 1, conformite: 61, masseSalariale: 19_800_000, statut: 'suspendu' },
];

const FLAG: Record<string, string> = { CI: '🇨🇮', SN: '🇸🇳', CM: '🇨🇲', TG: '🇹🇬' };

function confColor(n: number) {
  if (n >= 90) return 'text-emerald-600';
  if (n >= 75) return 'text-amber-600';
  return 'text-rose-600';
}

function ConfBar({ value }: { value: number }) {
  const color = value >= 90 ? 'bg-emerald-500' : value >= 75 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface2">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn('mono text-[12px] font-bold', confColor(value))}>{value}%</span>
    </div>
  );
}

export function RapportCabinetPage() {
  const { tenantType } = useAuth();
  const product = PRODUCT_META[tenantType];

  const actifs      = MOCK_KPI.filter((c) => c.statut === 'actif');
  const totalCollab = MOCK_KPI.reduce((s, c) => s + c.collab, 0);
  const totalMS     = MOCK_KPI.reduce((s, c) => s + c.masseSalariale, 0);
  const avgConf     = Math.round(actifs.reduce((s, c) => s + c.conformite, 0) / actifs.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em]', product.accentClass)}>
            {product.name}
          </p>
          <h1 className="mt-1 font-display text-[32px] leading-tight tracking-tight text-ink">
            Rapport cabinet
          </h1>
          <p className="mt-1 text-[14px] font-medium text-ink-500">
            Vue consolidée · {MOCK_KPI.length} clients · juillet 2026
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
          { icon: Users,      label: 'Clients actifs',         value: `${actifs.length} / ${MOCK_KPI.length}`, accent: '' },
          { icon: Users,      label: 'Collaborateurs gérés',   value: totalCollab.toLocaleString('fr-FR'),     accent: '' },
          { icon: TrendingUp, label: 'Masse salariale (M XOF)', value: (totalMS / 1_000_000).toFixed(1) + ' M', accent: '' },
          { icon: ShieldCheck,label: 'Conformité moyenne',     value: `${avgConf}%`,                           accent: confColor(avgConf) },
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

      <div className="rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="flex items-center gap-2 text-[12px] font-bold text-ink">
            <BarChart2 size={14} className="text-ink-400" /> Détail par client
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-400">
            <Globe size={12} />
            {[...new Set(MOCK_KPI.map((c) => c.pays))].length} pays OHADA
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-line bg-surface2/40 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-center">Pays</th>
                <th className="px-4 py-3 text-center">Collaborateurs</th>
                <th className="px-4 py-3 text-center">Modules</th>
                <th className="px-4 py-3 text-right">Masse sal. (M XOF)</th>
                <th className="px-4 py-3 text-left">Conformité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {MOCK_KPI.map((c) => (
                <tr key={c.id} className="hover:bg-surface2/40">
                  <td className="px-4 py-3">
                    <span className="text-[13px] font-semibold text-ink">{c.name}</span>
                    {c.statut !== 'actif' && (
                      <span className={cn(
                        'ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase',
                        c.statut === 'en_attente' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700',
                      )}>
                        {c.statut}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-[13px]">{FLAG[c.pays] ?? c.pays}</td>
                  <td className="mono px-4 py-3 text-center text-[13px] font-medium text-ink">{c.collab}</td>
                  <td className="px-4 py-3 text-center text-[13px] font-medium text-ink-500">{c.modules}</td>
                  <td className="mono px-4 py-3 text-right text-[12px] font-medium text-ink-500">
                    {(c.masseSalariale / 1_000_000).toFixed(2)}
                  </td>
                  <td className="px-4 py-3"><ConfBar value={c.conformite} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-line px-4 py-3">
          <p className="text-[11px] font-medium text-ink-400">
            Données démo · Rapport réel depuis <span className="mono">atlas_people.rapport_cabinet_view</span>
          </p>
        </div>
      </div>
    </div>
  );
}
