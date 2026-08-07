import { useEffect, useState } from 'react';
import { Rocket, CheckCircle2, Circle, Clock, FileSignature, Laptop, Users, BookOpen, ShieldCheck, Sparkles, DoorOpen, Wifi, Flag } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { ProgressBar } from '../../components/charts/ProgressBar';
import { useToast } from '../../components/ui/Toast';
import { useSurface } from '../../store/useSurface';
import { cn } from '../../lib/cn';
import { isBackendConfigured, useMyOnboarding, useCompleteOnboardingTask } from '../../lib/portal/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');

const JALON_LABEL: Record<string, string> = { J0: 'Jour J', J7: 'Semaine 1', J30: 'Mois 1', J60: 'Mois 2', J90: 'Mois 3', FIN_ESSAI: "Fin de période d'essai", CUSTOM: 'Autre' };
const JALON_ORDER = ['J0', 'J7', 'J30', 'J60', 'J90', 'FIN_ESSAI', 'CUSTOM'];
const OWNER_LABEL: Record<string, string> = { employee: 'Moi', manager: 'Mon manager', rh: 'RH', it: 'IT', buddy: 'Parrain', admin: 'Admin' };
const TASK_STATUS_LABEL: Record<string, string> = { todo: 'À faire', in_progress: 'En cours', done: 'Fait', skipped: 'Ignorée', blocked: 'Bloquée' };
const TASK_STATUS_TONE: Record<string, 'ok' | 'warn' | 'info' | 'danger' | 'neutral'> = { done: 'ok', in_progress: 'info', todo: 'warn', skipped: 'neutral', blocked: 'danger' };
const JALON_STATUS_LABEL: Record<string, string> = { pending: 'En attente', validated: 'Validé', overdue: 'En retard', skipped: 'Ignoré' };
const JALON_STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'neutral'> = { validated: 'ok', pending: 'warn', overdue: 'danger', skipped: 'neutral' };

const TABS = [
  { key: 'journey', label: 'Mon parcours' },
  { key: 'tasks', label: 'Mes tâches' },
  { key: 'team', label: 'Mon équipe' },
  { key: 'offboarding', label: 'Départ' },
];

interface Phase { id: string; label: string; icon: typeof Rocket; when: string; done: boolean }
const PHASES: Phase[] = [
  { id: 'p1', label: 'Pré-embauche — documents & contrat', icon: FileSignature, when: 'J-7', done: true },
  { id: 'p2', label: 'Premier jour — accueil & matériel', icon: Laptop, when: 'J0', done: true },
  { id: 'p3', label: 'Première semaine — équipe & outils', icon: Users, when: 'S1', done: true },
  { id: 'p4', label: 'Premier mois — formations clés', icon: BookOpen, when: 'M1', done: true },
  { id: 'p5', label: 'Fin de période d\'essai — bilan', icon: ShieldCheck, when: 'M3', done: true },
];

interface OnbTask { id: string; label: string; owner: string; done: boolean; due: string }
const TASKS_INIT: OnbTask[] = [
  { id: 'a1', label: 'Signer le contrat de travail', owner: 'Moi', done: true, due: '2025-03-25' },
  { id: 'a2', label: 'Fournir pièces d\'identité & RIB Mobile Money', owner: 'Moi', done: true, due: '2025-03-26' },
  { id: 'a3', label: 'Récupérer badge & matériel informatique', owner: 'IT', done: true, due: '2025-04-01' },
  { id: 'a4', label: 'Compléter le profil RH en ligne', owner: 'Moi', done: true, due: '2025-04-03' },
  { id: 'a5', label: 'Suivre la formation sécurité & RGPD', owner: 'Moi', done: true, due: '2025-04-10' },
  { id: 'a6', label: 'Entretien de fin de période d\'essai', owner: 'Manager', done: true, due: '2025-06-30' },
];

const BUDDIES = [
  { name: 'Valentina Okou', role: 'Manager direct', tag: 'Manager' },
  { name: 'Awa Traoré', role: 'Référente / marraine', tag: 'Buddy' },
  { name: 'Service RH', role: 'Support administratif', tag: 'RH' },
];

export function MonOnboardingPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);
  const { toast } = useToast();
  const [tab, setTab] = useState('journey');
  const [tasks, setTasks] = useState(TASKS_INIT);

  const { data: ctx } = useSessionContext();
  const { data: liveData } = useMyOnboarding(ctx?.tenantId, ctx?.employeeId);
  const completeTask = useCompleteOnboardingTask();

  const doneCount = tasks.filter((t) => t.done).length;
  const pct = Math.round((doneCount / tasks.length) * 100);

  // Live branch — parcours réel branché Supabase (CDC portail S11).
  if (isBackendConfigured && liveData?.arrivant) {
    const { arrivant, tasks: liveTasks, jalons } = liveData;
    const groups = JALON_ORDER
      .map((kind) => ({ kind, items: liveTasks.filter((t) => (t.jalon_kind ?? 'CUSTOM') === kind) }))
      .filter((g) => g.items.length > 0);

    const markDone = (taskId: string) =>
      completeTask.mutate(taskId, {
        onSuccess: () => toast({ variant: 'success', title: 'Tâche complétée', description: 'Votre intégration a été mise à jour.' }),
        onError: (e) => toast({ variant: 'error', title: 'Action impossible', description: e instanceof Error ? e.message : 'Réessayez plus tard.' }),
      });

    return (
      <div className="animate-fade-up space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Mon intégration</h1>
            <p className="text-sm font-medium text-ink-500">
              En intégration depuis le {frDate(arrivant.start_date)}
              {arrivant.fin_essai_at ? ` · période d'essai jusqu'au ${frDate(arrivant.fin_essai_at.slice(0, 10))}` : ''}.
            </p>
          </div>
          <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
            <Wifi size={13} className="text-emerald-500" /> Live DB
          </span>
        </div>

        <Card className="glass-amber">
          <div className="flex items-center justify-between">
            <div><p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Progression de l'intégration</p><p className="mono mt-1 text-3xl font-semibold text-amber-deep">{arrivant.overall_completion_pct}%</p></div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber/15 text-amber-deep"><Rocket size={22} /></span>
          </div>
          <ProgressBar value={arrivant.overall_completion_pct} className="mt-3" />
          <p className="mt-2 text-[12px] font-medium text-ink-700">Bienvenue dans l'équipe — voici votre parcours d'intégration.</p>
        </Card>

        {jalons.length > 0 && (
          <Card>
            <CardHeader title="Mes jalons" subtitle="Étapes clés de mon intégration" action={<Flag size={16} className="text-ink-400" />} />
            <div className="space-y-1.5">
              {jalons.map((j) => (
                <div key={j.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                  <span className="rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-ink-500">{JALON_LABEL[j.kind] ?? j.kind}</span>
                  <span className="flex-1 truncate text-[12px] font-medium text-ink-400">Échéance {frDate(j.due_date.slice(0, 10))}{j.validated_at ? ` · validé le ${frDate(j.validated_at.slice(0, 10))}` : ''}</span>
                  <StatusPill tone={JALON_STATUS_TONE[j.status] ?? 'neutral'} dot={false}>{JALON_STATUS_LABEL[j.status] ?? j.status}</StatusPill>
                </div>
              ))}
            </div>
          </Card>
        )}

        {groups.map((g) => (
          <Card key={g.kind}>
            <CardHeader title={JALON_LABEL[g.kind] ?? g.kind} subtitle={`${g.items.filter((t) => t.status === 'done').length}/${g.items.length} tâche(s)`} />
            <div className="space-y-1.5">
              {g.items.map((t) => {
                const StatusIcon = t.status === 'done' ? CheckCircle2 : t.status === 'in_progress' ? Clock : Circle;
                const canComplete = t.owner === 'employee' && t.status !== 'done';
                return (
                  <div key={t.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                    <StatusIcon size={18} className={cn('shrink-0', t.status === 'done' ? 'text-ok' : t.status === 'in_progress' ? 'text-info' : 'text-ink-300')} />
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm font-semibold', t.status === 'done' ? 'text-ink-400 line-through' : 'text-ink')}>{t.title}</p>
                      <p className="text-[11px] font-medium text-ink-400">Responsable : {OWNER_LABEL[t.owner] ?? t.owner}{t.due_date ? ` · échéance ${frDate(t.due_date.slice(0, 10))}` : ''}{t.required ? ' · obligatoire' : ''}</p>
                    </div>
                    {canComplete ? (
                      <Button size="sm" variant="outline" disabled={completeTask.isPending} onClick={() => markDone(t.id)}>Marquer comme fait</Button>
                    ) : (
                      <StatusPill tone={TASK_STATUS_TONE[t.status] ?? 'neutral'} dot={false}>{TASK_STATUS_LABEL[t.status] ?? t.status}</StatusPill>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Mon intégration</h1>
        <p className="text-sm font-medium text-ink-500">Parcours d'onboarding · entrée le 1er avril 2025 · période d'essai validée.</p>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {/* PARCOURS */}
      {tab === 'journey' && (
        <div className="space-y-5">
          <Card className="glass-amber">
            <div className="flex items-center justify-between">
              <div><p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Progression de l'intégration</p><p className="mono mt-1 text-3xl font-semibold text-amber-deep">{pct}%</p></div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber/15 text-amber-deep"><Rocket size={22} /></span>
            </div>
            <ProgressBar value={pct} className="mt-3" />
            <p className="mt-2 text-[12px] font-medium text-ink-700">Intégration finalisée — bienvenue dans l'équipe.</p>
          </Card>

          <Card>
            <CardHeader title="Les étapes de mon parcours" />
            <ol className="relative space-y-4 pl-2">
              {PHASES.map((p, i) => {
                const Icon = p.icon;
                return (
                  <li key={p.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', p.done ? 'bg-ok/12 text-ok' : 'bg-ink/[0.06] text-ink-300')}><Icon size={16} /></span>
                      {i < PHASES.length - 1 && <span className={cn('mt-1 w-0.5 flex-1', p.done ? 'bg-ok/30' : 'bg-line')} />}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2"><p className="text-sm font-bold text-ink">{p.label}</p><span className="rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-ink-400">{p.when}</span></div>
                      <p className="mt-0.5 text-[11px] font-medium text-ink-400">{p.done ? 'Terminée' : 'À venir'}</p>
                    </div>
                    {p.done && <CheckCircle2 size={16} className="mt-1.5 shrink-0 text-ok" />}
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      )}

      {/* TACHES */}
      {tab === 'tasks' && (
        <Card>
          <CardHeader title="Ma check-list d'intégration" subtitle={`${doneCount}/${tasks.length} tâches complétées`} action={<ProgressBar value={pct} className="w-28" />} />
          <div className="space-y-1.5">
            {tasks.map((t) => (
              <button key={t.id} onClick={() => { setTasks((ts) => ts.map((x) => x.id === t.id ? { ...x, done: !x.done } : x)); toast({ variant: 'success', title: t.done ? 'Tâche rouverte' : 'Tâche complétée', description: t.label }); }}
                className="flex w-full items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5 text-left transition-colors hover:bg-ink/[0.04]">
                {t.done ? <CheckCircle2 size={18} className="shrink-0 text-ok" /> : <Circle size={18} className="shrink-0 text-ink-300" />}
                <div className="min-w-0 flex-1"><p className={cn('text-sm font-semibold', t.done ? 'text-ink-400 line-through' : 'text-ink')}>{t.label}</p><p className="text-[11px] font-medium text-ink-400">Responsable : {t.owner} · échéance {frDate(t.due)}</p></div>
                <StatusPill tone={t.done ? 'ok' : 'warn'} dot={false}>{t.done ? 'Fait' : 'À faire'}</StatusPill>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* EQUIPE */}
      {tab === 'team' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BUDDIES.map((b) => (
            <Card key={b.name}>
              <span className="rounded-md bg-amber/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-deep">{b.tag}</span>
              <p className="mt-2 text-sm font-bold text-ink">{b.name}</p>
              <p className="text-[12px] font-medium text-ink-400">{b.role}</p>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => toast({ variant: 'success', title: 'Message envoyé', description: `Votre message à ${b.name} a été transmis.` })}>Contacter</Button>
            </Card>
          ))}
          <Card className="border-info/25 bg-info/[0.05] sm:col-span-3">
            <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Sparkles size={14} className="mt-0.5 shrink-0 text-info" /> Proph3t répond à vos questions d'arrivée (congés, paie, outils) — pédagogie uniquement, données souveraines.</p>
          </Card>
        </div>
      )}

      {/* OFFBOARDING */}
      {tab === 'offboarding' && (
        <Card>
          <CardHeader title="Processus de départ" subtitle="Aucun départ en cours" action={<DoorOpen size={16} className="text-ink-400" />} />
          <div className="rounded-2xl border border-line bg-surface2 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink"><Clock size={15} className="text-ink-400" /> Vous êtes actuellement en poste.</p>
            <p className="mt-1 text-[12px] font-medium text-ink-400">En cas de départ (démission, fin de contrat, retraite), votre check-list de sortie, le solde de tout compte et les attestations apparaîtront ici. Le certificat de travail et l'attestation de fin de contrat sont délivrés automatiquement.</p>
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => toast({ variant: 'info', title: 'Demande de départ', description: 'Cette démarche ouvre un échange confidentiel avec les RH.' })}>Initier une démarche de départ</Button>
        </Card>
      )}
    </div>
  );
}
