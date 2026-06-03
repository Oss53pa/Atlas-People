/**
 * M10LiveBanner — bandeau live Supabase pour cockpit Carrières.
 */
import { useEffect, useState } from 'react';
import { Crown, Network, Sparkles, Users, ArrowUp } from 'lucide-react';
import { LiveDataBanner } from '../common/LiveDataBanner';
import { fetchM10Live, type M10LiveKpis } from '../../lib/m10/supabaseLive';

const fmtCompact = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return String(Math.round(n));
};

export function M10LiveBanner() {
  const [data, setData] = useState<M10LiveKpis | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchM10Live().then((res) => { if (!cancelled && res) setData(res); });
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  const coverage = data.criticalRoles === 0 ? 0 : Math.round((data.successionCovered / data.criticalRoles) * 100);

  return (
    <LiveDataBanner
      title="Succession vivante — M10 Carrières"
      subtitle="Tenant démo · atlas_people"
      stats={[
        { icon: Crown, label: 'Postes clés', value: String(data.criticalRoles), sub: `${coverage}% couverts`, to: '/carrieres/postes-cles',
          tone: coverage < 60 ? 'warn' : 'success' },
        { icon: Network, label: 'Successeurs', value: String(data.successorsTotal), sub: `${data.successorsReadyNow} ready_now`, to: '/carrieres/succession' },
        { icon: Sparkles, label: 'Talent pools', value: String(data.talentPools), sub: `${fmtCompact(data.poolsBudget)} FCFA`, to: '/carrieres/hauts-potentiels' },
        { icon: Users, label: 'Mentorat actif', value: String(data.mentoratPairs), sub: 'paires en cours', to: '/carrieres/mentorat' },
        { icon: ArrowUp, label: 'Promotions', value: String(data.promotionsApproved), sub: `${data.promotionsPending} en attente`, to: '/carrieres/promotions',
          tone: data.promotionsPending > 0 ? 'warn' : 'default' },
      ]}
    />
  );
}
