/**
 * M6LiveBanner — bandeau live Supabase pour cockpit Onboarding.
 */
import { useEffect, useState } from 'react';
import { UserPlus, Flag, CheckCircle2, Heart, ListTodo } from 'lucide-react';
import { LiveDataBanner } from '../common/LiveDataBanner';
import { fetchM6Live, type M6LiveKpis } from '../../lib/m6/supabaseLive';

export function M6LiveBanner() {
  const [data, setData] = useState<M6LiveKpis | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchM6Live().then((res) => { if (!cancelled && res) setData(res); });
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  return (
    <LiveDataBanner
      title="Pulse vivant — Sprint M6"
      subtitle="Tenant démo · atlas_people · 30/60/90"
      stats={[
        { icon: UserPlus, label: 'Arrivants', value: String(data.arrivantsEnCours), sub: `${data.arrivantsTotal} total`, to: '/onboarding/arrivants' },
        { icon: Flag, label: 'Jalons en retard', value: String(data.jalonsOverdue), sub: `${data.jalonsCompleted} terminés`, to: '/onboarding/parcours', tone: data.jalonsOverdue > 0 ? 'danger' : 'success' },
        { icon: Heart, label: 'Pulse moyen', value: `${data.pulsesAvgScore}/10`, sub: `${data.pulsesCount} réponses`, to: '/onboarding/pulse',
          tone: data.pulsesAvgScore >= 8 ? 'success' : data.pulsesAvgScore >= 6 ? 'default' : 'warn' },
        { icon: ListTodo, label: 'Tâches ouvertes', value: String(data.tasksOpen), sub: 'à clôturer', to: '/onboarding/taches' },
        { icon: CheckCircle2, label: 'Jalons OK', value: String(data.jalonsCompleted), sub: 'validés', to: '/onboarding/parcours', tone: 'success' },
      ]}
    />
  );
}
