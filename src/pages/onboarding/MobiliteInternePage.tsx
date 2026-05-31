import { ArrowLeftRight, CheckCircle2, ExternalLink, Users } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { TEMPLATES, INTERNAL_MOBILITY_RULES, INTERNAL_MOBILITY_GRID } from '../../lib/m6/referentiels';
import { Link } from 'react-router-dom';

export function MobiliteInternePage() {
  const { toast } = useToast();
  const internalTemplates = TEMPLATES.filter((t) => t.family === 'interne');

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Onboarding interne · mobilité</h1>
          <p className="text-sm font-medium text-ink-500">6 parcours allégés · déclenché par avenant M4 · pas de période d'essai sauf reconversion</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Mobilité', description: 'Wizard initiation parcours mobilité (lien avenant M4)' })}>
          <ArrowLeftRight size={14} /> Initier une mobilité
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Parcours mobilité" value={String(internalTemplates.length)} unit="types" icon={ArrowLeftRight} />
        <StatCard label="Durée typique" value="15 → 90 j" unit="vs 90 j externe" icon={Users} />
        <StatCard label="Grille évaluation" value={`${INTERNAL_MOBILITY_GRID.length} dim.`} unit="pondérée" icon={CheckCircle2} />
        <StatCard label="Filet sécurité" value="3-6 mois" unit="retour ancien poste" icon={ArrowLeftRight} />
      </div>

      <Card>
        <CardHeader title="6 types de mobilité interne" subtitle="Parcours allégé vs onboarding externe · déclenché automatiquement par avenant M4" />
        <table className="w-full text-sm">
          <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            <th className="px-3 py-2 text-left">Code</th>
            <th className="px-3 py-2 text-left">Type</th>
            <th className="px-3 py-2 text-left">Durée</th>
            <th className="px-3 py-2 text-left">Description</th>
            <th className="px-3 py-2 text-center">Période d'essai ?</th>
          </tr></thead>
          <tbody className="divide-y divide-line">
            {internalTemplates.map((t) => (
              <tr key={t.code}>
                <td className="px-3 py-2 mono text-[11px] font-bold text-amber-deep">{t.code}</td>
                <td className="px-3 py-2 text-[12px] font-semibold text-ink">{t.label}</td>
                <td className="px-3 py-2 mono text-[11px] font-medium text-ink-700">{t.durationDays} j</td>
                <td className="px-3 py-2 text-[11px] font-medium text-ink-500">{t.description}</td>
                <td className="px-3 py-2 text-center">
                  {t.code === 'ONB-INTERNE-RECONV'
                    ? <StatusPill tone="amber" dot={false}>Reconversion uniquement</StatusPill>
                    : <span className="text-[11px] text-ink-400">Bilan de mutation</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="Différences vs externe" subtitle="Parcours allégé" />
          <ul className="space-y-1 text-[12px] font-medium text-ink-700">
            <li className="rounded-lg bg-surface2/40 px-3 py-1.5">✅ Email & équipement conservés</li>
            <li className="rounded-lg bg-surface2/40 px-3 py-1.5">✅ Pas de signatures chartes (sauf changement majeur)</li>
            <li className="rounded-lg bg-surface2/40 px-3 py-1.5">✅ Pas de welcome book — kit symbolique</li>
            <li className="rounded-lg bg-surface2/40 px-3 py-1.5">✅ Formations obligatoires uniquement si recertification due</li>
            <li className="rounded-lg bg-surface2/40 px-3 py-1.5">✅ Pré-boarding admin allégé (accès complémentaires, badge si changement site)</li>
            <li className="rounded-lg bg-surface2/40 px-3 py-1.5">✅ Buddy recommandé (pas obligatoire)</li>
            <li className="rounded-lg bg-surface2/40 px-3 py-1.5">✅ Pas de période d'essai juridique sauf reconversion</li>
            <li className="rounded-lg bg-surface2/40 px-3 py-1.5">📌 <b>Filet sécurité</b> : droit retour ancien poste (3-6 mois)</li>
          </ul>
        </Card>

        <Card>
          <CardHeader title="Grille d'évaluation mobilité" subtitle="Points J+15 · J+30 · J+60 (J+90 option)" />
          <table className="w-full text-sm">
            <thead><tr className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="py-1 text-left">Dimension</th>
              <th className="py-1 text-right">Poids</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {INTERNAL_MOBILITY_GRID.map((d) => (
                <tr key={d.dim}>
                  <td className="py-1.5 text-[12px] font-medium text-ink-700">{d.dim}</td>
                  <td className="py-1.5 mono text-right text-[11px] font-bold text-amber-deep">{d.weight} %</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] font-medium text-ink-500">
            Si promotion management 1ʳᵉ fois → formation management 40 h / 3 mois + mentorat senior + éval 360° J+90.
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Déclencheur · lien M4 Avenant" />
        <div className="rounded-xl border border-info/30 bg-info/[0.05] p-3">
          <p className="text-[12px] font-medium text-ink-700">
            <b>Avenant M4 signé via ADVIST</b> → Edge Function <code className="rounded bg-ink/[0.06] px-1 py-0.5 mono text-[10px]">init-internal-mobility-onboarding(avenantId)</code> → cascade automatique :
          </p>
          <ul className="mt-2 grid grid-cols-1 gap-1 md:grid-cols-2">
            {[
              'M1 — poste / manager / site / organigramme',
              'M3 — paramètres paie (nouvelle classification)',
              'M6 — parcours mobilité activé',
              'Trombinoscope · annuaire mis à jour',
            ].map((s) => (
              <li key={s} className="text-[11px] font-medium text-ink-700"><CheckCircle2 size={11} className="inline text-ok" /> {s}</li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <Link to="/hr/actes/avenants"><Button variant="outline" size="sm">Voir avenants M4 <ExternalLink size={12} /></Button></Link>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Règles du module" />
        <ul className="space-y-1 text-[11px] font-medium text-ink-700">
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">📌 Déclenchement uniquement sur avenant M4 validé&nbsp;: <b>{INTERNAL_MOBILITY_RULES.declencheurAvenantM4 ? 'oui' : 'non'}</b></li>
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">📌 Pas de signatures chartes hors changement majeur</li>
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">📌 Pas de welcome book — kit symbolique uniquement</li>
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">📌 Pas de période d'essai juridique (sauf reconversion)</li>
          <li className="rounded-lg bg-surface2/40 px-3 py-1.5">📌 Filet sécurité : {INTERNAL_MOBILITY_RULES.filetSecuriteRetourAncienPoste} · nouvel avenant M4 · sans pénalité</li>
        </ul>
      </Card>
    </div>
  );
}
