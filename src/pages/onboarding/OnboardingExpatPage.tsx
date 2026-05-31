import { Globe2, FileSignature, Home, GraduationCap, Plane, Users, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { EXPAT_KPIS, EXPAT_ACTEURS, EXPAT_PHASES, EXPAT_RULES, TEMPLATES } from '../../lib/m6/referentiels';
import { Link } from 'react-router-dom';

const ICON = { PRE_J90: Plane, INIT_J30: Home, GROW_J90: GraduationCap, CONSO_J180: Users };

export function OnboardingExpatPage() {
  const { toast } = useToast();
  const expatTemplate = TEMPLATES.find((t) => t.code === 'ONB-CADRE-EXPAT');

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Onboarding expatrié</h1>
          <p className="text-sm font-medium text-ink-500">Parcours 180 j · pré-mobilité J-90 · permis travail OHADA · accompagnement famille · 7 KPIs</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Expat', description: 'Wizard nouveau expatrié — coordination cabinet relocation' })}>
          <Plane size={14} /> Initier un expat
        </Button>
      </div>

      <Card className="border-danger/30 bg-danger/[0.04]">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="shrink-0 text-danger" />
          <div>
            <p className="text-[13px] font-bold text-danger">Règle dure OHADA</p>
            <p className="mt-0.5 text-[12px] font-medium text-ink-700">Pas d'arrivée sans permis de travail validé. Lien M4 doc 12 — workflow contrôlé.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Durée parcours" value={`${expatTemplate?.durationDays ?? 180} j`} unit="vs 90 j standard" icon={Globe2} />
        <StatCard label="Phases" value={String(EXPAT_PHASES.length)} unit="pré-J90 → J+180" icon={Plane} />
        <StatCard label="Acteurs additionnels" value={String(EXPAT_ACTEURS.length)} unit="coordination" icon={Users} />
        <StatCard label="KPIs spécifiques" value={String(EXPAT_KPIS.length)} unit="suivis 6 mois" icon={Globe2} />
      </div>

      <Card>
        <CardHeader title="Phases du parcours expat" subtitle="Du pré-mobilité à la consolidation 6 mois" />
        <div className="space-y-2">
          {EXPAT_PHASES.map((p) => {
            const Icon = ICON[p.code as keyof typeof ICON] ?? Globe2;
            return (
              <div key={p.code} className="flex items-start gap-3 rounded-xl border border-line bg-surface2/40 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber/15 text-amber-deep"><Icon size={18} /></span>
                <div>
                  <p className="text-[13px] font-bold text-ink">{p.label}</p>
                  <p className="text-[11px] font-medium text-ink-500">{p.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="KPIs cibles expat" subtitle="Suivis sur 6 mois" />
          <ul className="space-y-1">
            {EXPAT_KPIS.map((k) => (
              <li key={k.label} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5 text-[12px]">
                <span className="font-medium text-ink-700">{k.label}</span>
                <span className="mono rounded-md bg-amber/12 px-1.5 py-0.5 text-[11px] font-bold text-amber-deep">{k.target}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Acteurs additionnels" subtitle="Au-delà du parcours standard" action={<Users size={16} className="text-amber-deep" />} />
          <ul className="space-y-1 text-[12px] font-medium text-ink-700">
            {EXPAT_ACTEURS.map((a) => <li key={a} className="rounded-lg bg-surface2/40 px-3 py-1.5">👤 {a}</li>)}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Cadre juridique OHADA · lien M4 Expatriés" action={<FileSignature size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {[
            `Permis de travail (Ministère Travail, ~60 j d'instruction · cible < ${EXPAT_RULES.permitTravailMaxDays} j)`,
            `Visa long séjour expat + conjoint + enfants (~60 j après permis · cible < ${EXPAT_RULES.visaFamilleMaxDays} j)`,
            'CNPS ou affiliation pays origine (convention bilatérale)',
            'Indemnités expatriation au contrat (cf. M3 paie & M4 contrat EXPAT)',
            `Logement définitif · cible < ${EXPAT_RULES.logementMaxDaysPostArrivee} j post-arrivée`,
            `École enfants inscrits · cible < ${EXPAT_RULES.ecoleMaxDaysPostArrivee} j post-arrivée`,
          ].map((r) => (
            <div key={r} className="rounded-lg bg-surface2/40 px-3 py-1.5 text-[11px] font-medium text-ink-700">📌 {r}</div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Link to="/hr/actes/expatries"><Button variant="outline" size="sm">Voir M4 Expatriés <ExternalLink size={12} /></Button></Link>
        </div>
      </Card>

      <Card>
        <CardHeader title="Accompagnement famille" subtitle="Facteur n°1 de succès / échec d'une mission expat" />
        <ul className="space-y-1.5 text-[12px] font-medium text-ink-700">
          {[
            '👨‍👩‍👧 Visa famille · scolarité enfants (écoles internationales/françaises/locales, inscription < 15 j post-arrivée)',
            '🏠 Logement définitif < 30 j post-arrivée (5-10 propositions cabinet relocation, visite virtuelle, caution entreprise)',
            '💳 Compte bancaire local · transport · véhicule',
            '👫 Suivi conjoint (recherche emploi, activités)',
            '📅 Point mensuel obligatoire avec Chargé mobilité — adaptation conjoint & enfants notés /5',
          ].map((l) => <li key={l} className="rounded-lg bg-surface2/40 px-3 py-1.5">{l}</li>)}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Formation culturelle & sociale" />
        <ul className="space-y-1 text-[12px] font-medium text-ink-700">
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">🎓 Formation culture locale 4 h (histoire, ethnies/langues, codes hiérarchie, communication, business)</li>
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">🗣️ Formation langue locale (ex. Dioula basique 8 h)</li>
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">👥 Réseau expatriés Atlas + groupes externes (Alliance française, parents d'élèves)</li>
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">🌍 Apéros mensuels · sorties culturelles · week-ends découverte</li>
        </ul>
      </Card>

      <Card className="border-warn/25">
        <CardHeader title="Rupture précoce — protocole rapatriement" action={<AlertTriangle size={16} className="text-warn" />} />
        <p className="text-[12px] font-medium text-ink-700">{EXPAT_RULES.earlyTerminationProtocole} · acte M4 · entretien sortie · désinscription écoles · indemnités contractuelles · rachat bail.</p>
        <Button size="sm" variant="ghost" className="mt-2" onClick={() => toast({ variant: 'info', title: 'Rapatriement', description: 'Workflow rapatriement initié — cabinet relocation prévenu' })}>
          Initier protocole rapatriement
        </Button>
      </Card>
    </div>
  );
}
