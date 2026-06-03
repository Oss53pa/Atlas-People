/**
 * M8LiveBanner — bandeau live Supabase pour cockpit Évaluations.
 */
import { useEffect, useState } from 'react';
import { Gauge, Scale, Sparkles, AlertTriangle, Brain } from 'lucide-react';
import { LiveDataBanner } from '../common/LiveDataBanner';
import { fetchM8Live, type M8LiveKpis } from '../../lib/m8/supabaseLive';

export function M8LiveBanner() {
  const [data, setData] = useState<M8LiveKpis | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchM8Live().then((res) => { if (!cancelled && res) setData(res); });
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  return (
    <LiveDataBanner
      title="Cycle vivant — M8 Évaluations"
      subtitle="Tenant démo · atlas_people"
      stats={[
        { icon: Gauge, label: 'Évaluations', value: String(data.evalTotal), sub: `${data.evalSigned} signées · ${data.evalCalibrated} calibrées`, to: '/evaluations' },
        { icon: Sparkles, label: 'Note moyenne', value: `${data.avgFinalScore}/5`, sub: `${data.classA} classe A`, to: '/evaluations/calibration',
          tone: data.avgFinalScore >= 3.5 ? 'success' : 'warn' },
        { icon: Scale, label: 'Sous-performance', value: String(data.classC), sub: 'classe C · plan dev', to: '/evaluations/calibration', tone: data.classC > 0 ? 'warn' : 'default' },
        { icon: Brain, label: 'Plans dev actifs', value: String(data.devPlansActive), sub: `${data.feedback360Count} 360°`, to: '/evaluations/dev-plans' },
        { icon: AlertTriangle, label: 'Bias alerts', value: String(data.biasAlertsOpen), sub: 'non résolus', to: '/evaluations/calibration', tone: data.biasAlertsOpen > 0 ? 'danger' : 'success' },
      ]}
    />
  );
}
