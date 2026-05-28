import { useEffect, useState } from 'react';
import { GraduationCap, BookOpen, Award, Route, Sparkles, PlayCircle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { StatCard } from '../../components/ui/StatCard';
import { ProgressBar } from '../../components/charts/ProgressBar';
import { useToast } from '../../components/ui/Toast';
import { useSurface } from '../../store/useSurface';
import { cn } from '../../lib/cn';

const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');

const TABS = [
  { key: 'trainings', label: 'Mes formations' },
  { key: 'catalog', label: 'Catalogue' },
  { key: 'skills', label: 'Mes compétences' },
  { key: 'path', label: 'Parcours & souhaits' },
];

interface Training { id: string; title: string; org: string; status: 'in_progress' | 'done' | 'planned'; progress: number; date: string; hours: number }
const TRAININGS: Training[] = [
  { id: 't1', title: 'Excel avancé — tableaux croisés', org: 'Atlas Academy', status: 'in_progress', progress: 60, date: '2026-05-20', hours: 14 },
  { id: 't2', title: 'Sécurité des données (RGPD)', org: 'Atlas Academy', status: 'done', progress: 100, date: '2026-03-12', hours: 6 },
  { id: 't3', title: 'Communication professionnelle', org: 'Institut CI', status: 'planned', progress: 0, date: '2026-07-08', hours: 21 },
];
const T_TONE = { in_progress: 'warn', done: 'ok', planned: 'info' } as const;
const T_LABEL = { in_progress: 'En cours', done: 'Terminée', planned: 'Planifiée' };

const CATALOG = [
  { id: 'c1', title: 'Management d\'équipe — niveau 1', cat: 'Leadership', hours: 28, rating: 4.7 },
  { id: 'c2', title: 'Comptabilité OHADA — bases', cat: 'Finance', hours: 35, rating: 4.5 },
  { id: 'c3', title: 'Power BI pour RH', cat: 'Data', hours: 18, rating: 4.8 },
  { id: 'c4', title: 'Gestion du temps & priorités', cat: 'Efficacité', hours: 7, rating: 4.6 },
];

interface Skill { name: string; level: number; target: number }
const SKILLS: Skill[] = [
  { name: 'Gestion documentaire', level: 4, target: 4 },
  { name: 'Outils bureautiques', level: 3, target: 4 },
  { name: 'Relation client interne', level: 4, target: 5 },
  { name: 'Analyse de données', level: 2, target: 4 },
  { name: 'Réglementation sociale', level: 3, target: 4 },
];

const CERTS = [
  { id: 'k1', title: 'Attestation RGPD', issued: '2026-03-12', valid: '2028-03-12' },
  { id: 'k2', title: 'Habilitation outil paie', issued: '2025-09-01', valid: '2027-09-01' },
];

export function MonDeveloppementPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);
  const { toast } = useToast();
  const [tab, setTab] = useState('trainings');

  const totalHours = TRAININGS.reduce((s, t) => s + (t.status === 'done' ? t.hours : 0), 0);
  const inProgress = TRAININGS.filter((t) => t.status === 'in_progress').length;

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Mon développement</h1>
        <p className="text-sm font-medium text-ink-500">Formations, compétences et parcours d'évolution.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Heures 2026" value={String(totalHours)} unit="h validées" icon={Clock} tone="amber" />
        <StatCard label="En cours" value={String(inProgress)} unit="formation(s)" icon={PlayCircle} />
        <StatCard label="Certifications" value={String(CERTS.length)} unit="actives" icon={Award} />
        <StatCard label="Compétences" value={String(SKILLS.length)} unit="suivies" icon={GraduationCap} />
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {/* MES FORMATIONS */}
      {tab === 'trainings' && (
        <div className="space-y-2">
          {TRAININGS.map((t) => (
            <Card key={t.id}>
              <div className="flex flex-wrap items-start gap-3">
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', t.status === 'done' ? 'bg-ok/12 text-ok' : 'bg-amber/12 text-amber-deep')}>{t.status === 'done' ? <CheckCircle2 size={16} /> : <BookOpen size={16} />}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-ink">{t.title}</p><StatusPill tone={T_TONE[t.status]} dot={false}>{T_LABEL[t.status]}</StatusPill></div>
                  <p className="mt-0.5 text-[12px] font-medium text-ink-400">{t.org} · {t.hours} h · {frDate(t.date)}</p>
                  {t.status === 'in_progress' && <div className="mt-2 flex items-center gap-3"><ProgressBar value={t.progress} className="flex-1" /><span className="mono text-sm font-bold text-ink">{t.progress}%</span></div>}
                </div>
                {t.status === 'in_progress' && <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Reprise du module', description: t.title })}><PlayCircle size={14} /> Continuer</Button>}
                {t.status === 'done' && <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'success', title: 'Attestation', description: `${t.title}.pdf` })}>Attestation</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CATALOGUE */}
      {tab === 'catalog' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CATALOG.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between">
                <span className="rounded-md bg-amber/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-deep">{c.cat}</span>
                <span className="mono text-[11px] font-bold text-ink-400">★ {c.rating}</span>
              </div>
              <p className="mt-2 text-sm font-bold text-ink">{c.title}</p>
              <p className="text-[11px] font-medium text-ink-400">{c.hours} h · e-learning + présentiel</p>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => toast({ variant: 'success', title: 'Demande envoyée', description: `Inscription à « ${c.title} » transmise à votre manager.` })}>Demander l'inscription</Button>
            </Card>
          ))}
        </div>
      )}

      {/* COMPETENCES */}
      {tab === 'skills' && (
        <div className="space-y-5">
          <Card>
            <CardHeader title="Référentiel de compétences" subtitle="Niveau actuel vs. niveau cible (1 → 5)" />
            <div className="space-y-3">
              {SKILLS.map((s) => (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between"><span className="text-sm font-semibold text-ink">{s.name}</span><span className="mono text-[11px] font-bold text-ink-400">{s.level}/5 → cible {s.target}</span></div>
                  <div className="relative"><ProgressBar value={s.level} max={5} tone={s.level >= s.target ? 'ok' : 'amber'} /></div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Mes certifications" action={<Award size={16} className="text-ink-400" />} />
            <div className="space-y-1.5">
              {CERTS.map((k) => (
                <div key={k.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ok/12 text-ok"><Award size={15} /></span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{k.title}</p><p className="text-[11px] font-medium text-ink-400">Obtenue {frDate(k.issued)} · valable jusqu'au {frDate(k.valid)}</p></div>
                  <StatusPill tone="ok" dot={false}>Valide</StatusPill>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* PARCOURS */}
      {tab === 'path' && (
        <div className="space-y-5">
          <Card className="glass-amber">
            <CardHeader title="Mon projet d'évolution" action={<Route size={16} className="text-amber-deep" />} />
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
              <span className="rounded-lg bg-surface px-3 py-1.5">Gestionnaire administratif</span>
              <ChevronRight size={16} className="text-ink-300" />
              <span className="rounded-lg bg-amber/15 px-3 py-1.5 text-amber-deep">Chargé RH (cible)</span>
              <ChevronRight size={16} className="text-ink-300" />
              <span className="rounded-lg bg-surface px-3 py-1.5 text-ink-400">Responsable RH</span>
            </div>
            <p className="mt-3 text-[12px] font-medium text-ink-700">Compétences à développer : analyse de données, réglementation sociale, management niveau 1.</p>
          </Card>
          <Card>
            <CardHeader title="Mes souhaits de formation" subtitle="Partagés avec mon manager pour le plan de développement" />
            <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Sparkles size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Proph3t suggère « Power BI pour RH » et « Management d'équipe — niveau 1 » au regard de votre projet d'évolution.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => toast({ variant: 'success', title: 'Souhait enregistré', description: 'Vos souhaits seront discutés lors de l\'entretien professionnel.' })}>Exprimer un souhait</Button>
          </Card>
        </div>
      )}
    </div>
  );
}
