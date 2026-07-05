import { useEffect, useState } from 'react';
import { Target, ClipboardCheck, MessagesSquare, CalendarClock, Sparkles, TrendingUp, Star, ChevronRight, Wifi } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { ProgressBar } from '../../components/charts/ProgressBar';
import { useToast } from '../../components/ui/Toast';
import { useSurface } from '../../store/useSurface';
import { cn } from '../../lib/cn';
import { useMyObjectives, isBackendConfigured } from '../../lib/portal/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');

const TABS = [
  { key: 'objectives', label: 'Mes objectifs' },
  { key: 'review', label: 'Mon évaluation' },
  { key: 'interviews', label: 'Mes entretiens' },
  { key: 'feedback', label: 'Feedback 360' },
];

interface Objective { id: string; title: string; keyResult: string; progress: number; weight: number; due: string; status: 'on_track' | 'at_risk' | 'done' }
const OBJECTIVES: Objective[] = [
  { id: 'o1', title: 'Digitaliser les dossiers agence', keyResult: '100% des dossiers papier numérisés', progress: 78, weight: 30, due: '2026-06-30', status: 'on_track' },
  { id: 'o2', title: 'Réduire le délai de traitement', keyResult: 'Passer de 8j à 4j de délai moyen', progress: 55, weight: 25, due: '2026-07-31', status: 'at_risk' },
  { id: 'o3', title: 'Former 2 collègues au nouvel outil', keyResult: '2 collègues autonomes', progress: 100, weight: 20, due: '2026-04-30', status: 'done' },
  { id: 'o4', title: 'Satisfaction interne', keyResult: 'Score NPS interne ≥ 8/10', progress: 62, weight: 25, due: '2026-08-31', status: 'on_track' },
];
const OBJ_TONE = { on_track: 'ok', at_risk: 'warn', done: 'info' } as const;
const OBJ_LABEL = { on_track: 'En bonne voie', at_risk: 'À risque', done: 'Atteint' };

const REVIEWS = [
  { id: 'r1', period: 'Revue mi-année 2026', date: '2026-06-15', status: 'upcoming', rating: null as number | null, manager: 'Valentina Okou' },
  { id: 'r2', period: 'Évaluation annuelle 2025', date: '2025-12-10', status: 'done', rating: 4, manager: 'Valentina Okou' },
  { id: 'r3', period: 'Période d\'essai', date: '2025-04-02', status: 'done', rating: 4, manager: 'Valentina Okou' },
];

const INTERVIEWS = [
  { id: 'i1', type: 'Entretien individuel mensuel', date: '2026-06-03', mode: 'À venir', tone: 'amber' as const },
  { id: 'i2', type: 'Entretien professionnel (bilan 2 ans)', date: '2026-09-15', mode: 'Planifié', tone: 'info' as const },
  { id: 'i3', type: 'Entretien individuel mensuel', date: '2026-05-06', mode: 'Réalisé', tone: 'ok' as const },
];

const FEEDBACK = [
  { id: 'f1', from: 'Pair · Équipe agence', tone: 'Collaboration', text: 'Très disponible pour aider l\'équipe, communication claire.', date: '2026-05-10' },
  { id: 'f2', from: 'Manager', tone: 'Rigueur', text: 'Dossiers toujours bien préparés, fiable sur les délais.', date: '2026-04-22' },
  { id: 'f3', from: 'Client interne · Paie', tone: 'Réactivité', text: 'Réponses rapides sur les demandes de pièces.', date: '2026-04-05' },
];

export function MaPerformancePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);
  const { toast } = useToast();
  const [tab, setTab] = useState('objectives');
  const { data: ctx } = useSessionContext();
  const { data: liveObjectives } = useMyObjectives(ctx?.tenantId, ctx?.employeeId);
  const hasLiveObjectives = isBackendConfigured && !!liveObjectives && liveObjectives.length > 0;

  const globalProgress = Math.round(OBJECTIVES.reduce((s, o) => s + (o.progress * o.weight) / 100, 0));
  // Progression globale live : moyenne simple des objectifs (progress 0..1).
  const liveGlobalProgress = hasLiveObjectives
    ? Math.round((liveObjectives!.reduce((s, o) => s + o.progress, 0) / liveObjectives!.length) * 100)
    : 0;

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Ma performance</h1>
        <p className="text-sm font-medium text-ink-500">Objectifs, évaluations et entretiens — pilotés avec mon manager.</p>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {/* OBJECTIFS */}
      {tab === 'objectives' && (
        <div className="space-y-5">
          <Card className="glass-amber">
            <div className="flex items-center justify-between">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                  Progression globale{hasLiveObjectives ? ' (moyenne)' : ' (pondérée)'}
                  {hasLiveObjectives && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600"><Wifi size={9} className="text-emerald-500" /> Live DB</span>}
                </p>
                <p className="mono mt-1 text-3xl font-semibold text-amber-deep">{hasLiveObjectives ? liveGlobalProgress : globalProgress}%</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber/15 text-amber-deep"><Target size={22} /></span>
            </div>
            <ProgressBar value={hasLiveObjectives ? liveGlobalProgress : globalProgress} className="mt-3" />
          </Card>

          {hasLiveObjectives ? (
            <div className="space-y-2">
              {liveObjectives!.map((o) => {
                const pct = Math.round(o.progress * 100);
                return (
                  <Card key={o.id}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-ink">{o.title}</p>
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={10} className="text-emerald-500" /> Live DB</span>
                      </div>
                      {o.due_date && <p className="mt-0.5 text-[12px] font-medium text-ink-400">échéance {frDate(o.due_date)}</p>}
                      <div className="mt-2 flex items-center gap-3"><ProgressBar value={pct} tone={pct >= 100 ? 'info' : pct < 50 ? 'warn' : 'ok'} className="flex-1" /><span className="mono text-sm font-bold text-ink">{pct}%</span></div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {OBJECTIVES.map((o) => (
                <Card key={o.id}>
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-ink">{o.title}</p>
                        <StatusPill tone={OBJ_TONE[o.status]} dot={false}>{OBJ_LABEL[o.status]}</StatusPill>
                        <span className="rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-ink-400">poids {o.weight}%</span>
                      </div>
                      <p className="mt-0.5 text-[12px] font-medium text-ink-400">{o.keyResult} · échéance {frDate(o.due)}</p>
                      <div className="mt-2 flex items-center gap-3"><ProgressBar value={o.progress} tone={o.status === 'at_risk' ? 'warn' : o.status === 'done' ? 'info' : 'ok'} className="flex-1" /><span className="mono text-sm font-bold text-ink">{o.progress}%</span></div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Avancement mis à jour', description: `« ${o.title} » — partagé avec votre manager.` })}>Mettre à jour</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EVALUATION */}
      {tab === 'review' && (
        <div className="space-y-2">
          {REVIEWS.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><ClipboardCheck size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{r.period}</p>
                  <p className="text-[11px] font-medium text-ink-400">{frDate(r.date)} · évaluateur {r.manager}</p>
                </div>
                {r.rating != null && (
                  <div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className={cn(i < r.rating! ? 'fill-amber text-amber' : 'text-ink-200')} />)}</div>
                )}
                {r.status === 'upcoming'
                  ? <StatusPill tone="warn" dot={false}>À venir</StatusPill>
                  : <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'info', title: 'Compte rendu', description: `${r.period} — synthèse partagée.` })}>Voir <ChevronRight size={14} /></Button>}
              </div>
            </Card>
          ))}
          <Card className="border-info/25 bg-info/[0.05]">
            <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Sparkles size={14} className="mt-0.5 shrink-0 text-info" /> Votre auto-évaluation de mi-année est ouverte. Préparez-la avant l'entretien du 15/06.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => toast({ variant: 'success', title: 'Auto-évaluation', description: 'Formulaire ouvert.' })}>Démarrer mon auto-évaluation</Button>
          </Card>
        </div>
      )}

      {/* ENTRETIENS */}
      {tab === 'interviews' && (
        <div className="space-y-2">
          {INTERVIEWS.map((i) => (
            <Card key={i.id}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><CalendarClock size={16} /></span>
                <div className="min-w-0 flex-1"><p className="text-sm font-bold text-ink">{i.type}</p><p className="text-[11px] font-medium text-ink-400">{frDate(i.date)}</p></div>
                <StatusPill tone={i.tone} dot={false}>{i.mode}</StatusPill>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* FEEDBACK */}
      {tab === 'feedback' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEEDBACK.map((f) => (
            <Card key={f.id}>
              <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><MessagesSquare size={15} /></span><div><p className="text-sm font-bold text-ink">{f.from}</p><p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">{f.tone}</p></div></div>
              <p className="mt-2.5 text-[13px] font-medium leading-relaxed text-ink-700">« {f.text} »</p>
              <p className="mt-2 text-[11px] font-medium text-ink-400">{frDate(f.date)}</p>
            </Card>
          ))}
          <Card className="flex flex-col items-start justify-center sm:col-span-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink"><TrendingUp size={16} className="text-ok" /> Demander un feedback</p>
            <p className="mt-1 text-[12px] font-medium text-ink-400">Sollicitez un retour d'un collègue ou de votre manager sur une mission récente.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => toast({ variant: 'success', title: 'Demande envoyée', description: 'Le destinataire recevra une invitation à donner son feedback.' })}>Solliciter un feedback</Button>
          </Card>
        </div>
      )}
    </div>
  );
}
