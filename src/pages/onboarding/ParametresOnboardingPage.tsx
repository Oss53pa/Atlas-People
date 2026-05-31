import { Settings, Library, GraduationCap, FileText, MessageSquareHeart, Rocket } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { TEMPLATES, MANDATORY_TRAININGS, WELCOME_DOCS, TASK_LIBRARY, ONBOARDING_SLA } from '../../lib/m6/referentiels';

export function ParametresOnboardingPage() {
  const { toast } = useToast();

  const sections = [
    { title: 'Templates parcours', count: TEMPLATES.length, hint: '90 jours par défaut, modifiables', icon: Library },
    { title: 'Bibliothèque tâches', count: TASK_LIBRARY.length, hint: 'Réparties sur 6 milestones · 8 catégories', icon: Rocket },
    { title: 'Formations obligatoires', count: MANDATORY_TRAININGS.length, hint: 'Sécurité, RGPD, OHADA, produit', icon: GraduationCap },
    { title: 'Welcome pack', count: WELCOME_DOCS.length, hint: 'Documents standards · signature ADVIST', icon: FileText },
    { title: 'Questions pulse', count: 16, hint: '4 questions × 4 jalons (J7/J30/J60/J90)', icon: MessageSquareHeart },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />

      <div>
        <h1 className="text-2xl font-semibold text-ink">Paramètres Onboarding</h1>
        <p className="text-sm font-medium text-ink-500">Templates · tâches · formations · welcome pack · pulses · SLA · intégrations</p>
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
        <CardHeader title="SLA onboarding" subtitle="Cibles internes" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Sla label="Préparation J-7" value={`${ONBOARDING_SLA.preJ7Deadline} j`} />
          <Sla label="Retard max bloquant" value={`${ONBOARDING_SLA.blockingTaskMaxDelay} j`} />
          <Sla label="Réponse pulse" value={`${ONBOARDING_SLA.pulseSubmissionDeadline} j`} />
          <Sla label="NPS cible" value={`≥ ${ONBOARDING_SLA.npsTargetMin}`} />
          <Sla label="Complétion cible" value={`${ONBOARDING_SLA.completionTargetPct} %`} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Intégrations" subtitle="Composants externes" />
        <ul className="space-y-2">
          <li className="flex items-center justify-between rounded-xl bg-surface2/40 px-3 py-2.5">
            <div><p className="text-[13px] font-bold text-ink">M5 Recrutement</p><p className="text-[11px] font-medium text-ink-500">Hire accepté → handoff automatique vers parcours onboarding</p></div>
            <StatusPill tone="ok" dot>Connecté</StatusPill>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-surface2/40 px-3 py-2.5">
            <div><p className="text-[13px] font-bold text-ink">M4 Admin RH — Période d'essai</p><p className="text-[11px] font-medium text-ink-500">Fin J+90 → décision PE (confirmation / prolongation / rupture)</p></div>
            <StatusPill tone="ok" dot>Connecté</StatusPill>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-surface2/40 px-3 py-2.5">
            <div><p className="text-[13px] font-bold text-ink">ADVIST · Signatures chartes</p><p className="text-[11px] font-medium text-ink-500">Charte IT, RGPD, règlement intérieur — valeur juridique OHADA</p></div>
            <StatusPill tone="ok" dot>Connecté</StatusPill>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-surface2/40 px-3 py-2.5">
            <div><p className="text-[13px] font-bold text-ink">DocJourney · Welcome pack templates</p><p className="text-[11px] font-medium text-ink-500">Génération livret, charte, organigramme — versionnés FR/EN</p></div>
            <StatusPill tone="ok" dot>Connecté</StatusPill>
          </li>
        </ul>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'info', title: 'Réinitialiser', description: 'Templates rechargés' })}>Recharger défauts</Button>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Sauvegardé', description: 'Paramètres M6 enregistrés' })}><Settings size={14} /> Enregistrer</Button>
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
