import { useEffect, useMemo } from 'react';
import { Check, AlertTriangle, UserPlus, ShieldAlert, Briefcase } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { DevelopmentSubNav } from '../../components/mss/DevelopmentSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { successionPlan, MATURITY_META } from '../../lib/mss/dev';
import { employeeName } from '../../data/mock';

export function TeamSuccessionPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const positions = successionPlan(team);
  const covered = positions.filter((p) => p.successors.length >= p.needed).length;
  const coverPct = positions.length ? Math.round((covered / positions.length) * 100) : 0;

  return (
    <div className="animate-fade-up space-y-5">
      <DevelopmentSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Plan de succession</h1>
        <p className="text-sm font-medium text-ink-500">Couverture des postes critiques : {covered}/{positions.length} ({coverPct}%)</p>
      </div>

      <div className="space-y-4">
        {positions.map((p) => {
          const enough = p.successors.length >= p.needed;
          return (
            <Card key={p.id} className={enough ? '' : 'border-warn/25'}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-bold text-ink"><Briefcase size={15} className="text-ink-400" /> {p.title}</p>
                {p.successors.length === 0 ? <StatusPill tone="danger" dot={false}>Aucun successeur</StatusPill>
                  : enough ? <StatusPill tone="ok" dot={false}><Check size={12} /> {p.successors.length} identifié(s)</StatusPill>
                  : <StatusPill tone="warn" dot={false}><AlertTriangle size={12} /> {p.successors.length}/{p.needed} (besoin {p.needed})</StatusPill>}
              </div>

              {p.successors.length > 0 && (
                <div className="mt-3 space-y-2">
                  {p.successors.map((s, i) => (
                    <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface2 px-3 py-2.5">
                      <div className="flex items-center gap-2.5"><Avatar name={employeeName(s.emp)} size="xs" />
                        <div><p className="text-sm font-semibold text-ink">{employeeName(s.emp)}</p><p className="text-[11px] font-medium text-ink-400">{s.plan}</p></div>
                      </div>
                      <StatusPill tone={MATURITY_META[s.maturity].tone} dot={false}>{MATURITY_META[s.maturity].label}</StatusPill>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Identifier un successeur', description: `Sélection d'un successeur pour « ${p.title} ».` })}><UserPlus size={13} /> Identifier un successeur</Button>
                {p.successors.length === 0 && <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'info', title: 'Demande de recrutement', description: `Demande transmise à la RH pour « ${p.title} ».` })}>Demander recrutement</Button>}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Le successeur n'est <strong>jamais informé directement par le système</strong> qu'il est identifié comme tel. Visible uniquement par vous, la RH/DRH et la DG. Toute action est tracée (audit fort). Il est recommandé d'en parler en 1:1.</p>
      </Card>
    </div>
  );
}
