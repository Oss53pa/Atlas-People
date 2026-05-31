import { Settings, KanbanSquare, Star, Megaphone, FileSignature, Mail } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { PIPELINE_STAGES, SCORECARD_TEMPLATES, SOURCING_DEFAULTS, REJECTION_REASONS, INTERVIEW_TYPES, SLA } from '../../lib/m5/referentiels';

export function ParametresRecrutPage() {
  const { toast } = useToast();

  const sections = [
    { title: 'Pipeline & étapes', count: PIPELINE_STAGES.length, hint: '9 stages standard, configurable', icon: KanbanSquare },
    { title: 'Grilles d\'évaluation', count: SCORECARD_TEMPLATES.length, hint: '5 templates · scorecards', icon: Star },
    { title: 'Canaux sourcing', count: SOURCING_DEFAULTS.length, hint: 'Jobboards · écoles · cooptation', icon: Megaphone },
    { title: 'Motifs de refus', count: REJECTION_REASONS.length, hint: 'Catégories : fit / comp / candidat / process', icon: FileSignature },
    { title: 'Types d\'entretien', count: INTERVIEW_TYPES.length, hint: 'Phone screen, manager, tech, culture, final', icon: Mail },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div>
        <h1 className="text-2xl font-semibold text-ink">Paramètres Recrutement</h1>
        <p className="text-sm font-medium text-ink-500">Pipelines · scorecards · canaux · modèles courriers · SLA · intégrations</p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><Icon size={18} /></span>
                  <div>
                    <p className="text-[13px] font-bold text-ink">{s.title}</p>
                    <p className="text-[11px] font-medium text-ink-500">{s.hint}</p>
                  </div>
                </div>
                <span className="mono rounded-md bg-amber/12 px-2 py-1 text-[11px] font-bold text-amber-deep">{s.count}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="SLA recrutement" subtitle="Cibles internes par étape" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Sla label="Screening" value={`${SLA.screeningDays} j`} />
          <Sla label="1er entretien" value={`${SLA.firstInterviewDays} j`} />
          <Sla label="Offre → hire" value={`${SLA.offerToHireDays} j`} />
          <Sla label="Time-to-fill total" value={`${SLA.totalTimeToFillDays} j`} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Intégrations" subtitle="Composants externes" />
        <ul className="space-y-2">
          <li className="flex items-center justify-between rounded-xl bg-surface2/40 px-3 py-2.5">
            <div><p className="text-[13px] font-bold text-ink">ADVIST · Signature des offres</p>
              <p className="text-[11px] font-medium text-ink-500">Offres acceptées signées électroniquement (valeur juridique OHADA)</p></div>
            <StatusPill tone="ok" dot>Connecté</StatusPill>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-surface2/40 px-3 py-2.5">
            <div><p className="text-[13px] font-bold text-ink">PROPH3T (Ollama) · matching candidats</p>
              <p className="text-[11px] font-medium text-ink-500">Scoring CV / poste · suggestion de candidats vivier · jamais de décision automatisée</p></div>
            <StatusPill tone="ok" dot>Connecté</StatusPill>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-surface2/40 px-3 py-2.5">
            <div><p className="text-[13px] font-bold text-ink">Site carrière Atlas</p>
              <p className="text-[11px] font-medium text-ink-500">Publication offres + collecte candidatures (consentement RGPD intégré)</p></div>
            <StatusPill tone="ok" dot>Connecté</StatusPill>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-surface2/40 px-3 py-2.5">
            <div><p className="text-[13px] font-bold text-ink">Calendrier (Google Workspace)</p>
              <p className="text-[11px] font-medium text-ink-500">Planification entretiens · invitations panel · Meet auto-link</p></div>
            <StatusPill tone="ok" dot>Connecté</StatusPill>
          </li>
        </ul>
      </Card>

      <Card>
        <CardHeader title="Modèles d'emails candidat" subtitle="Templates DocJourney" />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {['Accusé de réception candidature', 'Invitation phone screen', 'Confirmation entretien (visio)', 'Confirmation entretien (présentiel)', 'Refus standard', 'Refus motivé', 'Offre — envoi', 'Relance offre', 'Bienvenue (welcome)', 'Demande de références'].map((m) => (
            <button key={m} onClick={() => toast({ variant: 'info', title: 'Modèle', description: `${m} ouvert dans DocJourney` })}
              className="rounded-xl border border-line bg-surface2/40 px-3 py-2 text-left text-[12px] font-medium text-ink-700 hover:border-amber/40 hover:bg-amber/[0.04]">
              {m}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'info', title: 'Réinitialiser', description: 'Référentiels rechargés' })}>Recharger défauts</Button>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Sauvegardé', description: 'Paramètres M5 enregistrés' })}><Settings size={14} /> Enregistrer</Button>
      </div>
    </div>
  );
}

function Sla({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface2/40 p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mono mt-0.5 text-base font-bold text-amber-deep">{value}</p>
    </div>
  );
}
