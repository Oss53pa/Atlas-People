/**
 * M9LiveBanner — bandeau live Supabase pour cockpit Compétences.
 */
import { useEffect, useState } from 'react';
import { Network, FileSignature, Award, ShieldAlert, Scale } from 'lucide-react';
import { LiveDataBanner } from '../common/LiveDataBanner';
import { fetchM9Live, type M9LiveKpis } from '../../lib/m9/supabaseLive';

export function M9LiveBanner() {
  const [data, setData] = useState<M9LiveKpis | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchM9Live().then((res) => { if (!cancelled && res) setData(res); });
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  return (
    <LiveDataBanner
      title="Compétences vivantes — M9 PDC · Certifs · Anti-discrim"
      subtitle="Tenant démo · atlas_people"
      stats={[
        { icon: Network, label: 'Compétences', value: String(data.skillsTotal), sub: `${data.matrixEntries} évaluations`, to: '/competences' },
        { icon: FileSignature, label: 'PDC actifs', value: String(data.pdcTotal), sub: `${data.pdcSigned} signés · ${data.pdcActionsActive} actions`, to: '/competences/pdc' },
        { icon: Award, label: 'Certifications', value: String(data.certsObtained), sub: `${data.certsCatalog} catalogue`, to: '/competences/certifications',
          tone: 'success' },
        { icon: Scale, label: 'Anti-discrim', value: String(data.antiDiscrimOpen), sub: 'biais détectés', to: '/competences/anti-discrim',
          tone: data.antiDiscrimOpen > 0 ? 'danger' : 'success' },
        { icon: ShieldAlert, label: 'Patterns', value: String(data.patternsCritical), sub: 'P3/P5/P7 high+', to: '/competences/audit',
          tone: data.patternsCritical > 0 ? 'warn' : 'success' },
      ]}
    />
  );
}
