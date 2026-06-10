import { Link } from 'react-router-dom';
import { BadgeCheck, CheckCircle2, ArrowUpRight, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { JOURNEYS, tasksByJourney } from '../../lib/m6/mock';
import { employeeById, employeeName } from '../../data/mock';
import { useRoster } from '../../lib/m1/roster';

const TODAY = new Date('2026-05-31');

export function ValidationPePage() {
  const { toast } = useToast();
  const roster = useRoster();

  // Parcours J+60 à J+90 ou e11 (en cours)
  const ready = JOURNEYS.filter((j) => {
    if (j.status !== 'in_progress') return false;
    const d = Math.round((TODAY.getTime() - new Date(j.hireDate).getTime()) / 86_400_000);
    return d >= 60;
  });

  // Probation officielle d'après EmployeeRecord
  const probationActive = roster.filter(e => e.probationEnd);

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />

      <div>
        <h1 className="text-2xl font-semibold text-ink">Validation de la période d'essai</h1>
        <p className="text-sm font-medium text-ink-500">Handoff M6 → M4 · décision confirmation / prolongation / rupture · ADVIST</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Parcours à valider" value={String(ready.length)} unit="≥ J+60" icon={BadgeCheck} tone={ready.length ? 'amber' : 'default'} />
        <StatCard label="Confirmés ce trimestre" value={String(JOURNEYS.filter(j => j.status === 'completed').length)} unit="historique" icon={CheckCircle2} />
        <StatCard label="Périodes d'essai actives" value={String(probationActive.length)} unit="suivies M4" icon={BadgeCheck} />
        <StatCard label="Délai légal" value="3 j avant fin" unit="notification" icon={AlertTriangle} />
      </div>

      <Card>
        <CardHeader title="Décisions à prendre" subtitle="3 décisions possibles · délai légal de notification respecté" />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <Decision label="Confirmation" hint="Embauche définitive · contrat actif" tone="ok" />
          <Decision label="Prolongation" hint="1 prolongation max, durée ≤ durée initiale" tone="amber" />
          <Decision label="Rupture" hint="Initiée par l'employeur ou l'employé" tone="danger" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Parcours arrivés à terme" subtitle="Décision attendue dans M4 Admin RH (onglet Période d'essai)" />
        {ready.length === 0 ? <p className="rounded-xl bg-surface2/40 px-3 py-3 text-center text-[12px] font-medium text-ink-400">Aucun parcours à valider pour l'instant.</p>
          : <div className="space-y-2">
              {ready.map((j) => {
                const emp = employeeById(j.employeeId);
                if (!emp) return null;
                const tasks = tasksByJourney(j.id);
                const blockingDone = tasks.filter(t => t.blocking && t.status === 'completed').length;
                const blockingTotal = tasks.filter(t => t.blocking).length;
                const ready4Validation = blockingDone === blockingTotal;
                return (
                  <div key={j.id} className="rounded-xl border border-line bg-surface2/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar name={employeeName(emp)} size="sm" />
                        <div>
                          <p className="text-[13px] font-bold text-ink">{employeeName(emp)} · {emp.role}</p>
                          <p className="text-[11px] font-medium text-ink-500">Embauche {j.hireDate} · progression {j.progressPct} % · tâches bloquantes {blockingDone}/{blockingTotal}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill tone={ready4Validation ? 'ok' : 'amber'} dot>{ready4Validation ? 'Prêt' : 'En cours'}</StatusPill>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link to={`/hr/actes/periode-essai`}><Button variant="outline" size="sm">Onglet M4 PE <ExternalLink size={12} /></Button></Link>
                      <Link to={`/onboarding/arrivants/${emp.id}`}><Button variant="ghost" size="sm">Parcours détail <ArrowUpRight size={12} /></Button></Link>
                      <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Validation initiée', description: `Lettre confirmation pour ${employeeName(emp)} (ADVIST)` })}>Confirmer</Button>
                    </div>
                  </div>
                );
              })}
            </div>}
      </Card>

      <p className="text-[11px] font-medium text-ink-400">La décision finale de période d'essai est portée par le module M4 Admin RH (onglet Période d'essai) · génération automatique de la lettre via DocJourney · signature DRH ADVIST · notification employé · clôture du parcours M6.</p>
    </div>
  );
}

function Decision({ label, hint, tone }: { label: string; hint: string; tone: 'ok' | 'amber' | 'danger' }) {
  return (
    <div className="rounded-xl border border-line bg-surface2/40 p-3">
      <p className={tone === 'ok' ? 'text-[13px] font-bold text-ok' : tone === 'amber' ? 'text-[13px] font-bold text-amber-deep' : 'text-[13px] font-bold text-danger'}>{label}</p>
      <p className="mt-1 text-[11px] font-medium text-ink-500">{hint}</p>
    </div>
  );
}
