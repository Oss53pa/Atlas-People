import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, AlertTriangle, ArrowUpRight, Calendar, Mail, Package } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { useM6Data } from '../../lib/m6/dataLive';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

const PRE_BOARDING_JALONS = [
  { day: 'J-30', label: 'Activation journey', detail: 'Acceptation offre M5 → parcours assigné · notification IT/Manager/RH' },
  { day: 'J-25', label: 'Vérifications M1 + stock IT', detail: 'RH vérifie données · IT vérifie stock matériel' },
  { day: 'J-20', label: 'Commande matériel manquant', detail: 'Coordination RH ↔ Manager ↔ IT' },
  { day: 'J-15', label: 'Buddy désigné + plan intégration', detail: 'Manager désigne buddy · PC standard préparé · poste/casier attribué' },
  { day: 'J-12', label: 'Brief buddy par Manager', detail: 'Alerte si buddy non désigné' },
  { day: 'J-10', label: 'Périphériques + lecture profil buddy', detail: 'Buddy lit profil du futur arrivant' },
  { day: 'J-7',  label: 'Comptes SI standards · annonce équipe', detail: 'AD · email · M365 · SSO · Slack · annonce Manager · formations programmées · kit + cartes de visite' },
  { day: 'J-5',  label: 'Comptes SI métier · clé · parking', detail: 'Salesforce · SAP · clé bureau · casier · place parking' },
  { day: 'J-3',  label: 'Welcome email + welcome book', detail: 'Email envoyé · welcome book personnalisé PROPH3T · badge · VPN · bureau aménagé · contact buddy' },
  { day: 'J-2',  label: 'Relances + alertes', detail: 'Relance acteurs en retard · alerte si arrivant n\'a pas confirmé' },
  { day: 'J-1',  label: 'Dossier J1 prêt · vérification finale', detail: 'Programme visite buddy · revue Manager · DPAE déposée' },
  { day: 'J0',   label: 'Tout doit être prêt à minuit', detail: 'Bascule automatique vers la phase Jour 1' },
] as const;

const RACI = [
  { actor: 'IT',                hint: 'Matériel · comptes SI · VPN · MDM',                                                  count: 8  },
  { actor: 'Services Généraux', hint: 'Poste · casier · badge · kit · parking',                                              count: 6  },
  { actor: 'Manager',           hint: 'Buddy · plan intégration · annonce équipe · brief J1 · 1er livrable',                  count: 7  },
  { actor: 'RH',                hint: 'Activation · coordination · formations obligatoires · welcome email/book · dossier',   count: 9  },
  { actor: 'Buddy',             hint: 'Désignation accusée · lecture profil · contact email · visite site · café virtuel',    count: 5  },
] as const;

const TODAY = new Date('2026-05-31');

export function PreBoardingPage() {
  const m6 = useM6Data();
  const upcoming = useMemo(() => m6.journeys.filter((j) => {
    const d = Math.round((new Date(j.hireDate).getTime() - TODAY.getTime()) / 86_400_000);
    return d > -1 && d <= 30;
  }).sort((a, b) => a.hireDate.localeCompare(b.hireDate)), [m6]);

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Pré-boarding (J-30 → J0)</h1>
        <p className="text-sm font-medium text-ink-500">12 jalons · RACI clair · welcome email & book personnalisés PROPH3T · règle « tout prêt à minuit »</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Arrivants J-30 à J0" value={String(upcoming.length)} unit="en pré-boarding" icon={Clock} tone="amber" />
        <StatCard label="Jalons par parcours" value={String(PRE_BOARDING_JALONS.length)} unit="checkpoints" icon={Calendar} />
        <StatCard label="Acteurs RACI" value={String(RACI.length)} unit="impliqués" icon={CheckCircle2} />
        <StatCard label="Welcome email" value="J-3" unit="auto · PROPH3T" icon={Mail} />
      </div>

      <Card>
        <CardHeader title="Timeline pré-boarding" subtitle="12 jalons standards · alertes auto si retard" />
        <div className="space-y-1.5">
          {PRE_BOARDING_JALONS.map((j, i) => (
            <div key={j.day} className={cn('flex items-start gap-3 rounded-xl border p-3', i === 0 ? 'border-amber/30 bg-amber/[0.04]' : 'border-line bg-surface2/30')}>
              <span className="mono shrink-0 rounded-md bg-amber/15 px-2 py-0.5 text-[11px] font-bold text-amber-deep">{j.day}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-ink">{j.label}</p>
                <p className="mt-0.5 text-[11px] font-medium text-ink-500">{j.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="RACI · responsables par acteur" subtitle="Qui fait quoi en pré-boarding" />
          <ul className="space-y-1.5">
            {RACI.map((r) => (
              <li key={r.actor} className="flex items-center justify-between rounded-xl bg-surface2/40 px-3 py-2">
                <div>
                  <p className="text-[13px] font-bold text-ink">{r.actor}</p>
                  <p className="text-[10px] font-medium text-ink-500">{r.hint}</p>
                </div>
                <span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">{r.count} tâches</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Communications type" action={<Mail size={16} className="text-amber-deep" />} />
          <ul className="space-y-1.5 text-[12px] font-medium text-ink-700">
            <li className="rounded-lg bg-surface2/40 px-3 py-2"><b>Welcome email · J-3</b><br /><span className="text-[11px] text-ink-500">Date/heure/lieu · programme J1 · infos buddy · documents à apporter · tenue · parking · wifi</span></li>
            <li className="rounded-lg bg-surface2/40 px-3 py-2"><b>Welcome book PDF interactif · J-3</b><br /><span className="text-[11px] text-ink-500">Personnalisé PROPH3T · 10-15 pages · histoire · métier · valeurs · équipe · FAQ · organigramme · glossaire</span></li>
            <li className="rounded-lg bg-surface2/40 px-3 py-2"><b>Annonce équipe · J-7</b><br /><span className="text-[11px] text-ink-500">Le Manager présente le nouveau membre au reste de l'équipe</span></li>
            <li className="rounded-lg bg-surface2/40 px-3 py-2"><b>Brief buddy · J-10</b><br /><span className="text-[11px] text-ink-500">Manager brief le buddy sur son rôle et plan de visite</span></li>
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Arrivants en pré-boarding" subtitle={`${upcoming.length} à préparer dans les 30 jours`} action={<Package size={16} className="text-amber-deep" />} />
        {upcoming.length === 0 ? (
          <p className="rounded-xl bg-surface2/40 px-3 py-4 text-center text-[12px] font-medium text-ink-400">Aucune arrivée planifiée sous 30 jours.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((j) => {
              const emp = employeeById(j.employeeId);
              if (!emp) return null;
              const days = Math.round((new Date(j.hireDate).getTime() - TODAY.getTime()) / 86_400_000);
              const tasks = m6.tasksByJourney(j.id).filter((t) => t.milestone === 'PRE_J7');
              const done = tasks.filter((t) => t.status === 'completed').length;
              const overdue = tasks.filter((t) => t.status !== 'completed' && new Date(t.dueDate) < TODAY).length;
              const ready = days < 0 ? done === tasks.length : true;
              return (
                <div key={j.id} className="rounded-xl border border-line bg-surface2/30 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={employeeName(emp)} size="sm" />
                      <div>
                        <p className="text-[13px] font-bold text-ink">{employeeName(emp)} · {emp.role}</p>
                        <p className="text-[11px] font-medium text-ink-500">Arrivée {j.hireDate} · {days >= 0 ? `J-${days}` : `J+${Math.abs(days)}`} · tâches PRE {done}/{tasks.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {overdue > 0 && <StatusPill tone="danger" dot={false}>{overdue} retard</StatusPill>}
                      <StatusPill tone={ready ? 'ok' : 'amber'} dot={!ready}>{ready ? 'Prêt' : 'À compléter'}</StatusPill>
                      <Link to={`/onboarding/arrivants/${emp.id}`}><Button variant="ghost" size="sm">Parcours <ArrowUpRight size={12} /></Button></Link>
                    </div>
                  </div>
                  {overdue > 0 && (
                    <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-warn">
                      <AlertTriangle size={11} /> {overdue} tâche(s) bloquante(s) en retard — relance acteurs
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <p className="text-[11px] font-medium text-ink-400">
        Règle dure : <b>tout doit être prêt à J0 minuit</b>. Une tâche bloquante non terminée déclenche une alerte au RRH et à l'IT lead.
        Sources : sourcing M5 → handoff M6 J-30. Suivi automatique cron quotidien.
      </p>
    </div>
  );
}
