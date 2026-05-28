import { useEffect, useState } from 'react';
import { Rocket, CheckCircle2, Circle, Clock, FileSignature, Laptop, Users, BookOpen, ShieldCheck, Sparkles, DoorOpen } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { ProgressBar } from '../../components/charts/ProgressBar';
import { useToast } from '../../components/ui/Toast';
import { useSurface } from '../../store/useSurface';
import { cn } from '../../lib/cn';

const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');

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

  const doneCount = tasks.filter((t) => t.done).length;
  const pct = Math.round((doneCount / tasks.length) * 100);

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
