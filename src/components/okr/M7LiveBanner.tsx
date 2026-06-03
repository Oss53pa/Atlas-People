/**
 * M7LiveBanner — bandeau live Supabase pour cockpit OKR.
 */
import { useEffect, useState } from 'react';
import { Target, GitBranch, MessageSquare, Sparkles, AlertTriangle } from 'lucide-react';
import { LiveDataBanner } from '../common/LiveDataBanner';
import { fetchM7Live, type M7LiveKpis } from '../../lib/m7/supabaseLive';

export function M7LiveBanner() {
  const [data, setData] = useState<M7LiveKpis | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchM7Live().then((res) => { if (!cancelled && res) setData(res); });
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  return (
    <LiveDataBanner
      title="Cascade vivante — M7 OKR"
      subtitle="Tenant démo · atlas_people"
      stats={[
        { icon: Target, label: 'Objectifs', value: String(data.objectivesActive), sub: `${data.objectivesCompleted} terminés / ${data.objectivesTotal}`, to: '/objectifs' },
        { icon: GitBranch, label: 'Key Results', value: String(data.krsTotal), sub: `score moy ${data.krsAvgScore}`, to: '/objectifs/key-results' },
        { icon: AlertTriangle, label: 'KR à risque', value: String(data.krsAtRisk), sub: 'confidence < 4', to: '/objectifs/key-results', tone: data.krsAtRisk > 0 ? 'warn' : 'success' },
        { icon: MessageSquare, label: 'Check-ins 30j', value: String(data.checkInsLast30d), sub: 'cadence active', to: '/objectifs/notation' },
        { icon: Sparkles, label: 'Confiance moy', value: `${data.avgConfidence}/5`, sub: 'KR + check-ins', to: '/objectifs',
          tone: data.avgConfidence >= 4 ? 'success' : 'warn' },
      ]}
    />
  );
}
