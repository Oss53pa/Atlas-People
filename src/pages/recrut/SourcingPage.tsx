import { Megaphone, TrendingUp, DollarSign, Users } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { SOURCING_CHANNELS } from '../../lib/m5/mock';
import { CHANNEL_TYPE_LABEL } from '../../lib/m5/referentiels';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';
import { cn } from '../../lib/cn';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

export function SourcingPage() {
  const channels = [...SOURCING_CHANNELS].sort((a, b) => b.hires12m - a.hires12m);
  const totalApps = channels.reduce((s, c) => s + c.applications12m, 0);
  const totalHires = channels.reduce((s, c) => s + c.hires12m, 0);
  const totalCost = channels.reduce((s, c) => s + c.cost12m, 0);
  const avgCph = totalHires ? Math.round(totalCost / totalHires) : 0;

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div>
        <h1 className="text-2xl font-semibold text-ink">Sourcing</h1>
        <p className="text-sm font-medium text-ink-500">{channels.length} canaux suivis · attribution candidatures · ROI 12 mois glissants</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Canaux actifs" value={String(channels.filter(c => c.active).length)} unit="sources" icon={Megaphone} />
        <StatCard label="Candidatures 12 m" value={String(totalApps)} unit="reçues" icon={Users} />
        <StatCard label="Hires 12 m" value={String(totalHires)} unit="embauches" icon={TrendingUp} />
        <StatCard label="Cost per hire moyen" value={fmt(avgCph)} unit="FCFA" icon={DollarSign} mono />
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Performance par canal" subtitle="Trié par hires obtenus · meilleur ROI en haut" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Canal</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-right">Coût 12 m</th>
              <th className="px-3 py-2 text-right">Cand.</th>
              <th className="px-3 py-2 text-right">Hires</th>
              <th className="px-3 py-2 text-right">Conv.</th>
              <th className="px-3 py-2 text-right">Coût / hire</th>
              <th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {channels.map((c) => {
                const conv = c.applications12m ? ((c.hires12m / c.applications12m) * 100).toFixed(1) : '—';
                const cph = c.hires12m ? c.cost12m / c.hires12m : null;
                const cphTone = !cph ? '' : cph < 500_000 ? 'text-ok' : cph < 1_500_000 ? 'text-amber-deep' : 'text-warn';
                return (
                  <tr key={c.code} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 text-[12px] font-semibold text-ink">{c.name}</td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-500">{CHANNEL_TYPE_LABEL[c.type]}</td>
                    <td className="px-3 py-2 mono text-right text-[11px] text-ink-700">{c.cost12m === 0 ? '—' : fmt(c.cost12m)}</td>
                    <td className="px-3 py-2 mono text-right text-[11px] text-ink-700">{c.applications12m}</td>
                    <td className="px-3 py-2 mono text-right text-[12px] font-bold text-ok">{c.hires12m}</td>
                    <td className="px-3 py-2 mono text-right text-[11px] text-ink-700">{conv}%</td>
                    <td className={cn('px-3 py-2 mono text-right text-[11px] font-bold', cphTone)}>{cph ? fmt(cph) : '—'}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={c.active ? 'ok' : 'neutral'} dot={false}>{c.active ? 'Actif' : 'Inactif'}</StatusPill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-[11px] font-medium text-ink-400">L'attribution est faite à l'enregistrement de la candidature (champ `source`). Les coûts incluent les abonnements jobboards, frais d'agence, primes de cooptation et coûts d'événements. Recommandation : maintenir un mix LinkedIn + cooptation + écoles pour optimiser le coût par hire moyen.</p>
    </div>
  );
}
