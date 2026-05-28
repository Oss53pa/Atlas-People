import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, UserPlus, UserMinus, TrendingUp, Shuffle, ChevronRight } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { TeamSubNav } from '../../components/mss/TeamSubNav';
import { useSurface } from '../../store/useSurface';
import { useManagerScope } from '../../store/useManagerScope';
import { useDirectory } from '../../store/useDirectory';
import { scopedTeam, DEPTH_LABEL } from '../../lib/mss/scope';
import { employeeName, employeeCareer, type EmployeeRecord } from '../../data/mock';

const TODAY = '2026-05-28';
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
const monthsBetween = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24 * 30.4);

interface Movement { e: EmployeeRecord; date: string; label: string }

/** EQ.3 — Mouvements récents de l'équipe (cf. 03_MON_EQUIPE). Arrivées,
 *  départs, promotions, mobilités — sur le périmètre courant (R8). */
export function TeamMovementsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const depth = useManagerScope((s) => s.depth);
  const employees = useDirectory((s) => s.employees);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);

  const arrivals = useMemo<Movement[]>(() =>
    team.filter((e) => monthsBetween(e.hireDate, TODAY) <= 18)
      .map((e) => ({ e, date: e.hireDate, label: `Arrivée · ${e.role}` }))
      .sort((a, b) => (a.date < b.date ? 1 : -1)), [team]);

  const departures = useMemo<Movement[]>(() =>
    team.filter((e) => e.status === 'notice')
      .map((e) => ({ e, date: TODAY, label: `Préavis de sortie · ${e.role}` })), [team]);

  const promotions = useMemo<Movement[]>(() =>
    team.flatMap((e) => employeeCareer(e).filter((s) => s.type === 'promotion' || s.type === 'mobility')
      .map((s) => ({ e, date: s.date, label: `${s.type === 'promotion' ? 'Promotion' : 'Mobilité'} · ${s.title.replace(/^.*· /, '')}` })))
      .sort((a, b) => (a.date < b.date ? 1 : -1)), [team]);

  const sections: { title: string; subtitle: string; icon: typeof UserPlus; tone: 'ok' | 'danger' | 'info'; items: Movement[] }[] = [
    { title: 'Arrivées récentes', subtitle: '18 derniers mois', icon: UserPlus, tone: 'ok', items: arrivals },
    { title: 'Départs & préavis', subtitle: 'Sorties en cours', icon: UserMinus, tone: 'danger', items: departures },
    { title: 'Promotions & mobilités', subtitle: 'Évolutions internes', icon: TrendingUp, tone: 'info', items: promotions },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-info">Mon équipe · {DEPTH_LABEL[depth]}</p>
        <h1 className="text-2xl font-semibold text-ink">Mouvements récents</h1>
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
                    <Link key={`${m.e.id}-${i}`} to={`/team/equipe/${m.e.id}`} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2 transition-colors hover:bg-info/[0.06]">
                      <Avatar name={employeeName(m.e)} size="xs" />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{employeeName(m.e)}</p><p className="truncate text-[11px] font-medium text-ink-400">{m.label}</p></div>
                      <span className="shrink-0 text-[11px] font-medium text-ink-400">{frDate(m.date)}</span>
                      <ChevronRight size={15} className="text-ink-400" />
                    </Link>
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
