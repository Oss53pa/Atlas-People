import { useState } from 'react';
import { Eye, Users, Star, AlertTriangle, MessageSquare } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { cn } from '../../lib/cn';

type Jalon = 'J30' | 'J60' | 'J90';

const PARTICIPANTS: Record<Jalon, { label: string; roles: { who: string; anon: boolean; count: number }[] }> = {
  J30: { label: 'J+30', roles: [
    { who: 'Manager', anon: false, count: 1 },
    { who: 'Buddy',   anon: false, count: 1 },
  ]},
  J60: { label: 'J+60', roles: [
    { who: 'Manager', anon: false, count: 1 },
    { who: 'Buddy',   anon: false, count: 1 },
    { who: 'Peers',   anon: true,  count: 2 },
  ]},
  J90: { label: 'J+90', roles: [
    { who: 'Manager',    anon: false, count: 1 },
    { who: 'Buddy',      anon: false, count: 1 },
    { who: 'Peers',      anon: true,  count: 2 },
    { who: 'Transverse', anon: true,  count: 1 },
  ]},
};

const QUESTIONS_TYPE = {
  Buddy: [
    'Intégration équipe (1-5)',
    'Disponibilité / proactivité (4 niveaux)',
    'Progrès depuis J1 (4 niveaux)',
    'Pronostic validation période d\'essai (4 niveaux)',
    'Recommandations au manager (texte)',
    'Faits marquants (texte)',
  ],
  Peer: [
    'Durée collaboration (30 j+ / 15-30 j / < 15 j)',
    'Évaluation collaboration (1-5)',
    'Apport à l\'équipe (texte)',
    'Recommandation développement (texte)',
  ],
  Transverse: [
    'Fréquence interactions (4 niveaux)',
    'Qualité interactions (1-5)',
    'Compétences techniques (1-5)',
    'Compétences relationnelles (1-5)',
    'Recommandation intégration (3 niveaux)',
  ],
};

const ALERTS = [
  { label: 'NPS < 6',                       severity: 'danger' as const, action: 'Entretien RH ≤ 48 h' },
  { label: 'Score Manager ou Buddy < 3',    severity: 'danger' as const, action: 'Entretien RH ≤ 48 h' },
  { label: 'Verbatim négatif fort détecté', severity: 'warn'  as const,  action: 'Revue PROPH3T + alerte RRH' },
  { label: 'Engagement Survey < 50/100',    severity: 'warn'  as const,  action: 'Entretien RH ≤ 48 h' },
];

export function Feedback360Page() {
  const { toast } = useToast();
  const [jalon, setJalon] = useState<Jalon>('J90');
  const meta = PARTICIPANTS[jalon];
  const totalParticipants = meta.roles.reduce((s, r) => s + r.count, 0);

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Feedback 360° light</h1>
          <p className="text-sm font-medium text-ink-500">Collecte multi-acteurs (Manager + Buddy + Peers + Transverse) · vs pulse (autoévaluation) · panoramique J+90</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Campagne', description: `Campagne ${meta.label} envoyée à ${totalParticipants} évaluateurs` })}>
          Lancer campagne {meta.label}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Jalons" value="3" unit="J+30 / J+60 / J+90" icon={Eye} />
        <StatCard label="Participants J+90" value={String(meta.roles.reduce((s, r) => s + r.count, 0))} unit="évaluateurs" icon={Users} />
        <StatCard label="Score moyen 360°" value="4,2 / 5" unit="dernier panel" icon={Star} />
        <StatCard label="Alertes auto" value={String(ALERTS.length)} unit="seuils critiques" icon={AlertTriangle} tone="amber" />
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1 w-fit text-[12px] font-semibold">
        {(['J30','J60','J90'] as const).map((m) => (
          <button key={m} onClick={() => setJalon(m)} className={cn('mono rounded-md px-3 py-1', jalon === m ? 'bg-amber/12 text-amber-deep' : 'text-ink-500')}>
            {PARTICIPANTS[m].label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader title={`Participants au jalon ${meta.label}`} subtitle={`${totalParticipants} évaluateurs · anonymat différencié`} />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
          {meta.roles.map((r) => (
            <div key={r.who} className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[12px] font-bold text-ink">{r.who} <span className="ml-1 text-[10px] font-medium text-ink-400">× {r.count}</span></p>
              <StatusPill tone={r.anon ? 'amber' : 'ok'} dot={false}>{r.anon ? 'Anonyme' : 'Identifié'}</StatusPill>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {Object.entries(QUESTIONS_TYPE).map(([who, qs]) => (
          <Card key={who}>
            <CardHeader title={`Questions ${who}`} subtitle={`${qs.length} questions type`} />
            <ul className="space-y-1 text-[12px] font-medium text-ink-700">
              {qs.map((q, i) => <li key={i} className="rounded-lg bg-surface2/40 px-3 py-1.5">{i + 1}. {q}</li>)}
            </ul>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Échelle & consolidation" />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface2/40 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-deep">Échelles</p>
            <ul className="mt-1 space-y-0.5 text-[12px] font-medium text-ink-700">
              <li>• Likert 1-5 sur axes quantitatifs</li>
              <li>• Ordinale 3-4 niveaux sur questions qualifiées</li>
              <li>• TextArea libre pour verbatims (analyse PROPH3T)</li>
              <li>• Score 360° = moyenne pondérée</li>
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-surface2/40 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-deep">Confrontation auto vs entourage</p>
            <ul className="mt-1 space-y-0.5 text-[12px] font-medium text-ink-700">
              <li>• Score moyen 360° vs autoévaluation embauché (pulse)</li>
              <li>• Points forts unanimes (compteur de feedbacks concordants)</li>
              <li>• Points de développement mentionnés</li>
              <li>• Analyse verbatims PROPH3T (sentiment + thèmes récurrents)</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="border-warn/25">
        <CardHeader title="Alertes automatiques · seuils critiques" subtitle="Déclenchent entretien RH ≤ 48 h" action={<AlertTriangle size={16} className="text-warn" />} />
        <ul className="space-y-1">
          {ALERTS.map((a) => (
            <li key={a.label} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-2">
              <div>
                <p className="text-[12px] font-bold text-ink">{a.label}</p>
                <p className="text-[10px] font-medium text-ink-500">{a.action}</p>
              </div>
              <StatusPill tone={a.severity} dot={false}>{a.severity === 'danger' ? 'Critique' : 'À surveiller'}</StatusPill>
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-[11px] font-medium text-ink-400">
        Note : ceci est un <b>360° light</b> dédié onboarding (perspectives externes sur l'embauché). Le 360° complet (RH performance annuelle) reste dans le module <b>M8 Évaluations</b>.
        <MessageSquare size={11} className="ml-1 inline" /> Les verbatims sont analysés par PROPH3T (sentiment positif/neutre/négatif, thèmes récurrents).
      </p>
    </div>
  );
}
