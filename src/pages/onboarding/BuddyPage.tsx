import { Link } from 'react-router-dom';
import { Rocket, Users, Star, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { BUDDIES } from '../../lib/m6/mock';
import { employeeById, employeeName } from '../../data/mock';

export function BuddyPage() {
  const { toast } = useToast();
  const active = BUDDIES.filter((b) => b.status === 'active');
  const completed = BUDDIES.filter((b) => b.status === 'completed');
  const avgSat = completed.length ? completed.reduce((s, b) => s + (b.satisfactionScore ?? 0), 0) / completed.length : 0;

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Programme buddy</h1>
          <p className="text-sm font-medium text-ink-500">Appairage senior ↔ nouvel arrivant · 1,5 h/semaine dédiée · 90 jours</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Buddy', description: 'Wizard appairage buddy' })}><Rocket size={14} /> Nouveau pairing</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pairings actifs" value={String(active.length)} unit="en cours" icon={Users} />
        <StatCard label="Complétés" value={String(completed.length)} unit="historique" icon={Users} />
        <StatCard label="Satisfaction moy." value={`${avgSat.toFixed(1)}/5`} unit="newcomers" icon={Star} />
        <StatCard label="Heures dédiées" value={`${(active.reduce((s,b)=>s+b.weeklyHours,0)).toFixed(1)} h/sem`} unit="cumul actif" icon={Rocket} />
      </div>

      <Card>
        <CardHeader title="Politique buddy Atlas" subtitle="Cadre du programme" />
        <ul className="grid grid-cols-1 gap-1.5 text-[12px] font-medium text-ink-700 md:grid-cols-2">
          {[
            'Buddy ≠ manager (rôle pair, sans lien hiérarchique)',
            '1,5 h dédiées par semaine pendant 90 jours',
            'Critères : ≥ 1 an d\'ancienneté, volontariat, formation buddy',
            'Reconnaissance : prime trimestrielle 50 000 FCFA / pairing',
            'Évaluation 360° du buddy à J+90 (satisfaction newcomer)',
            'Possibilité de changement si fit insuffisant (à J+30)',
          ].map((l) => <li key={l} className="rounded-lg bg-surface2/40 px-3 py-1.5">• {l}</li>)}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Pairings actifs" subtitle={`${active.length} buddy-newcomer en cours`} />
        <div className="space-y-2">
          {active.map((b) => {
            const newc = employeeById(b.newcomerEmployeeId);
            const bud = employeeById(b.buddyEmployeeId);
            if (!newc || !bud) return null;
            return (
              <div key={b.id} className="rounded-xl border border-line bg-surface2/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar name={employeeName(newc)} size="sm" />
                    <span className="text-ink-400">→</span>
                    <Avatar name={employeeName(bud)} size="sm" />
                    <div>
                      <p className="text-[13px] font-bold text-ink">{employeeName(newc)} <span className="ml-1 text-[11px] font-medium text-ink-500">accompagné·e par <b>{employeeName(bud)}</b></span></p>
                      <p className="text-[11px] font-medium text-ink-500">{newc.role} · {bud.role} ({bud.department}) · {b.weeklyHours} h/sem · depuis {b.startedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone="ok" dot>actif</StatusPill>
                    <Link to={`/onboarding/arrivants/${newc.id}`}><Button variant="ghost" size="sm">Parcours <ArrowUpRight size={12} /></Button></Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {completed.length > 0 && (
        <Card>
          <CardHeader title="Historique pairings" subtitle="Avec satisfaction newcomers" />
          <table className="w-full text-sm">
            <thead><tr className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="py-1 text-left">Newcomer</th>
              <th className="py-1 text-left">Buddy</th>
              <th className="py-1 text-right">Note</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {completed.slice(0,8).map((b) => {
                const newc = employeeById(b.newcomerEmployeeId)!;
                const bud = employeeById(b.buddyEmployeeId)!;
                return (
                  <tr key={b.id}>
                    <td className="py-1.5 text-[12px] font-semibold text-ink">{employeeName(newc)}</td>
                    <td className="py-1.5 text-[12px] font-medium text-ink-700">{employeeName(bud)}</td>
                    <td className="py-1.5 text-right mono text-[11px] font-bold text-amber-deep">{b.satisfactionScore?.toFixed(1) ?? '—'}/5</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
