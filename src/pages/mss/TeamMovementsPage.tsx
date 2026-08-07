import { useEffect, useMemo } from 'react';
import { ArrowLeftRight, UserPlus, UserMinus, TrendingUp, Shuffle, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { TeamSubNav } from '../../components/mss/TeamSubNav';
import { useSurface } from '../../store/useSurface';
import { useManagerScope } from '../../store/useManagerScope';
import { useDirectory } from '../../store/useDirectory';
import { scopedTeam, DEPTH_LABEL } from '../../lib/mss/scope';
import { employeeName, employeeCareer } from '../../data/mock';
import { isBackendConfigured, useTeamDirectory, dirName } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const TODAY = new Date().toISOString().slice(0, 10);
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
const monthsBetween = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24 * 30.4);

interface Movement { id: string; name: string; date: string; label: string }

export function TeamMovementsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const depth = useManagerScope((s) => s.depth);
  const employees = useDirectory((s) => s.employees);
  const mockTeam = useMemo(() => scopedTeam(depth, employees), [depth, employees]);

  const { data: ctx } = useSessionContext();
  const { data: liveDir } = useTeamDirectory(ctx?.tenantId);
  const hasLive = isBackendConfigured && Boolean(ctx?.tenantId);

  const arrivals = useMemo<Movement[]>(() => {
    if (hasLive) return (liveDir ?? [])
      .filter(d => d.hire_date && monthsBetween(d.hire_date, TODAY) <= 18)
      .map(d => ({ id: d.id, name: dirName(d), date: d.hire_date!, label: `Arrivée · ${d.role_title ?? d.department ?? ''}` }))
      .sort((a, b) => a.date < b.date ? 1 : -1);
    return mockTeam
      .filter(e => monthsBetween(e.hireDate, TODAY) <= 18)
      .map(e => ({ id: e.id, name: employeeName(e), date: e.hireDate, label: `Arrivée · ${e.role}` }))
      .sort((a, b) => a.date < b.date ? 1 : -1);
  }, [hasLive, liveDir, mockTeam]);

  const departures = useMemo<Movement[]>(() => {
    if (hasLive) return (liveDir ?? [])
      .filter(d => d.status === 'notice')
      .map(d => ({ id: d.id, name: dirName(d), date: TODAY, label: `Préavis de sortie · ${d.role_title ?? ''}` }));
    return mockTeam
      .filter(e => e.status === 'notice')
      .map(e => ({ id: e.id, name: employeeName(e), date: TODAY, label: `Préavis de sortie · ${e.role}` }));
  }, [hasLive, liveDir, mockTeam]);

  const promotions = useMemo<Movement[]>(() => {
    if (hasLive) return [];
    return mockTeam.flatMap(e => employeeCareer(e)
      .filter(s => s.type === 'promotion' || s.type === 'mobility')
      .map(s => ({ id: e.id, name: employeeName(e), date: s.date, label: `${s.type === 'promotion' ? 'Promotion' : 'Mobilité'} · ${s.title.replace(/^.*· /, '')}` })))
      .sort((a, b) => a.date < b.date ? 1 : -1);
  }, [hasLive, mockTeam]);

  const sections: { title: string; subtitle: string; icon: typeof UserPlus; items: Movement[] }[] = [
    { title: 'Arrivées récentes', subtitle: '18 derniers mois', icon: UserPlus, items: arrivals },
    { title: 'Départs & préavis', subtitle: 'Sorties en cours', icon: UserMinus, items: departures },
    { title: 'Promotions & mobilités', subtitle: hasLive ? 'Non disponibles en live' : 'Évolutions internes', icon: TrendingUp, items: promotions },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-info">Mon équipe · {DEPTH_LABEL[depth]}</p>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-ink">Mouvements récents</h1>
          {hasLive && <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>}
        </div>
        <p className="mt-1 text-sm font-medium text-ink-500">Arrivées, départs et évolutions de carrière sur mon périmètre.</p>
      </div>

      <TeamSubNav />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <Card key={sec.title}>
              <CardHeader title={sec.title} subtitle={sec.subtitle} action={<Icon size={16} className="text-ink-400" />} />
              {sec.items.length > 0 ? (
                <div className="space-y-1.5">
                  {sec.items.map((m, i) => (
                    <div key={`${m.id}-${i}`} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                      <Avatar name={m.name} size="xs" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
                        <p className="truncate text-[11px] font-medium text-ink-400">{m.label}</p>
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-ink-400">{frDate(m.date)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-ink/[0.02] px-3 py-3 text-sm font-medium text-ink-400"><Shuffle size={15} /> Aucun mouvement sur cette période.</div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-ink-400"><ArrowLeftRight size={13} /> Mouvements limités à mon périmètre managérial (R8).</div>
    </div>
  );
}
