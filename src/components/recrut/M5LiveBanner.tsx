/**
 * M5LiveBanner — bandeau live Supabase pour cockpit Recrutement.
 */
import { useEffect, useState } from 'react';
import { Briefcase, Activity as ActivityIcon, CalendarClock, Mail, Users as UsersIcon } from 'lucide-react';
import { LiveDataBanner } from '../common/LiveDataBanner';
import { fetchM5Live, type M5LiveKpis } from '../../lib/m5/supabaseLive';

export function M5LiveBanner() {
  const [data, setData] = useState<M5LiveKpis | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchM5Live().then((res) => { if (!cancelled && res) setData(res); });
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  return (
    <LiveDataBanner
      title="Pipeline vivant — Sprint M5"
      subtitle="Tenant démo · atlas_people"
      stats={[
        { icon: Briefcase, label: 'Postes ouverts', value: String(data.jobsOpen), sub: `${data.jobsTotal} total`, to: '/recrutement/postes' },
        { icon: ActivityIcon, label: 'Candidatures actives', value: String(data.applicationsActive), sub: `${data.candidatesPool} viviers`, to: '/recrutement/pipeline' },
        { icon: CalendarClock, label: 'Entretiens prévus', value: String(data.interviewsPlanned), sub: 'planifiés', to: '/recrutement/entretiens' },
        { icon: Mail, label: 'Offres en attente', value: String(data.offersPending), sub: `${data.offersAccepted} acceptées`, to: '/recrutement/offres', tone: data.offersPending > 0 ? 'warn' : 'default' },
        { icon: UsersIcon, label: 'Cooptations', value: String(data.referrals), sub: 'pool actif', to: '/recrutement/cooptation' },
      ]}
    />
  );
}
