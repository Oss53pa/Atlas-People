/**
 * M12LiveBanner — bandeau live Supabase pour cockpit Conformité & SST.
 */
import { useEffect, useState } from 'react';
import { ShieldAlert, Activity, Brain, Landmark, BadgeCheck } from 'lucide-react';
import { LiveDataBanner } from '../common/LiveDataBanner';
import { fetchM12Live, type M12LiveKpis } from '../../lib/m12/supabaseLive';

export function M12LiveBanner() {
  const [data, setData] = useState<M12LiveKpis | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchM12Live().then((res) => { if (!cancelled && res) setData(res); });
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  return (
    <LiveDataBanner
      title="Conformité vivante — M12 DUER · AT · RPS"
      subtitle="Tenant démo · atlas_people"
      stats={[
        { icon: ShieldAlert, label: 'DUER critique', value: String(data.duerCritical), sub: `${data.duerEleve} élevés / ${data.duerRisksTotal}`, to: '/conformite/duer',
          tone: data.duerCritical > 0 ? 'danger' : data.duerEleve > 0 ? 'warn' : 'success' },
        { icon: Activity, label: 'AT/MP ouverts', value: String(data.atIncidentsOpen), sub: `${data.atSevere} graves+`, to: '/conformite/at-mp',
          tone: data.atSevere > 0 ? 'danger' : data.atIncidentsOpen > 0 ? 'warn' : 'success' },
        { icon: Brain, label: 'RPS burnout', value: `${data.rpsBurnoutAvg}%`, sub: `${data.rpsSurveysActive} surveys actives`, to: '/conformite/rps',
          tone: data.rpsBurnoutAvg >= 25 ? 'danger' : data.rpsBurnoutAvg >= 15 ? 'warn' : 'success' },
        { icon: Landmark, label: 'Déclarations', value: String(data.declarationsOverdue), sub: `${data.declarationsPaid} payées · retards`, to: '/conformite/declarations',
          tone: data.declarationsOverdue > 0 ? 'danger' : 'success' },
        { icon: BadgeCheck, label: 'Habilitations 90j', value: String(data.authorizationsExpiring90d), sub: 'à renouveler', to: '/conformite/habilitations',
          tone: data.authorizationsExpiring90d > 0 ? 'warn' : 'default' },
      ]}
    />
  );
}
