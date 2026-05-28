import { useEffect, useMemo } from 'react';
import { Users2, ArrowRight, Sparkles, Repeat } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { DevelopmentSubNav } from '../../components/mss/DevelopmentSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { mentoringRelations, frDate } from '../../lib/mss/dev';
import { employeeName } from '../../data/mock';

export function TeamMentoringPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const rels = mentoringRelations(team);

  return (
    <div className="animate-fade-up space-y-5">
      <DevelopmentSubNav />
      <h1 className="text-2xl font-semibold text-ink">Mentorat</h1>

      <Card>
        <CardHeader title="Relations actives" subtitle={`${rels.length} binôme(s)`} action={<Users2 size={16} className="text-ink-400" />} />
        {rels.length === 0 ? <p className="py-4 text-center text-sm font-medium text-ink-400">Aucune relation de mentorat active.</p> : (
          <div className="space-y-2">
            {rels.map((r, i) => (
              <div key={i} className="rounded-xl bg-surface2 px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Avatar name={employeeName(r.mentor)} size="xs" /> {employeeName(r.mentor)}
                    <ArrowRight size={14} className="text-ink-300" />
                    <Avatar name={employeeName(r.mentee)} size="xs" /> {employeeName(r.mentee)}
                    <StatusPill tone="info" dot={false}>{r.skill}</StatusPill>
                  </div>
                  <span className="text-[11px] font-medium text-ink-400">{r.sessions}/{r.total} séances · {r.cadence}</span>
                </div>
                <p className="mt-1 text-[11px] font-medium text-ink-400">Démarré le {frDate(r.started)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="glass-amber">
        <p className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-amber-deep"><Sparkles size={14} /> Suggestions Proph3t</p>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-[12px] font-medium text-ink-700">
            <span>Un expert « grands comptes » pourrait mentorer un profil proche de la cible.</span>
            <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Relation créée', description: 'Binôme de mentorat proposé aux deux membres.' })}>Créer relation</Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-[12px] font-medium text-ink-700">
            <span className="flex items-center gap-1.5"><Repeat size={13} className="text-info" /> Reverse mentoring : un profil digital natif pourrait mentorer un senior sur les réseaux pro.</span>
            <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Relation créée', description: 'Binôme de reverse mentoring proposé.' })}>Créer relation</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
