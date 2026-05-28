import { useEffect, useMemo } from 'react';
import { Megaphone, Info, ShieldCheck, Eye } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/feedback';
import { TeamTimeSubNav } from '../../components/m2/TeamTimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useDelegation } from '../../store/useDelegation';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { employeeName, employeeById } from '../../data/mock';

const MONTH = '2026-05';
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
const fmtH = (n: number) => `${Math.round(n * 10) / 10}h`;

export function TeamDelegationCoveragePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const credits = useDelegation((s) => s.credits);
  const usage = useDelegation((s) => s.usage);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const teamIds = useMemo(() => new Set(team.map((e) => e.id)), [team]);

  const mandated = credits.filter((c) => teamIds.has(c.employeeId) && c.month === MONTH);

  return (
    <div className="animate-fade-up space-y-5">
      <TeamTimeSubNav />
      <h1 className="text-2xl font-semibold text-ink">Délégations syndicales — couverture</h1>

      <Card className="border-info/25 bg-info/[0.04]">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Info size={15} className="mt-0.5 shrink-0 text-info" /> Vous voyez uniquement l'<strong>usage du crédit d'heures</strong> (pour organiser la couverture de poste). Vous ne voyez <strong>jamais</strong> le contenu des activités syndicales — protection légale (R6). La consultation de cette page est elle-même tracée vis-à-vis du mandaté.</p>
      </Card>

      {mandated.length > 0 ? (
        <div className="space-y-4">
          {mandated.map((c) => {
            const emp = employeeById(c.employeeId);
            const pct = Math.min(100, Math.round((c.usedHours / c.monthlyQuota) * 100));
            const remaining = Math.round((c.monthlyQuota - c.usedHours) * 10) / 10;
            const myUsage = usage.filter((u) => u.employeeId === c.employeeId && u.date.slice(0, 7) === MONTH).sort((a, b) => (a.date < b.date ? -1 : 1));
            return (
              <Card key={c.id}>
                <CardHeader
                  title={emp ? employeeName(emp) : '—'}
                  subtitle={c.mandateType}
                  action={<StatusPill tone={remaining <= 2 ? 'warn' : 'info'} dot={false}>reste {fmtH(remaining)}</StatusPill>}
                />
                <div className="flex items-center gap-3">
                  {emp && <Avatar name={employeeName(emp)} size="sm" />}
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-ink-500">
                      <span>Crédit utilisé ce mois</span>
                      <span className="mono text-ink">{fmtH(c.usedHours)} / {fmtH(c.monthlyQuota)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-ink/[0.06]">
                      <div className={`h-full rounded-full ${pct >= 90 ? 'bg-warn' : 'bg-info'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Créneaux déclarés (sans contenu)</p>
                  {myUsage.map((u) => (
                    <div key={u.id} className="flex items-center justify-between rounded-lg bg-surface2 px-3 py-1.5 text-[12px] font-medium">
                      <span className="text-ink-700">{frDate(u.date)}</span>
                      <span className="mono text-ink-500">{fmtH(u.hours)} · {u.location === 'internal' ? 'sur site' : 'externe'}</span>
                    </div>
                  ))}
                  {myUsage.length === 0 && <p className="text-[12px] font-medium text-ink-400">Aucun usage déclaré ce mois.</p>}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card><EmptyState icon={Megaphone} title="Aucun mandaté dans votre périmètre" description="Aucun membre de votre équipe ne détient de mandat syndical actif ce mois." /></Card>
      )}

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Pas de bouton « valider » : la délégation est un droit, pas une demande. <Eye size={13} className="mt-0.5 shrink-0 text-amber-deep" /> Seuls les créneaux servent à réorganiser la couverture de poste.</p>
      </Card>
    </div>
  );
}
