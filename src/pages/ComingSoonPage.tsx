import { Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { NavModule } from '../app/nav';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';

const DETAILS: Record<string, { phase: string; pitch: string; ia: string[] }> = {
  M2: {
    phase: 'Phase 2',
    pitch: 'Congés légaux propres à chaque pays, pointage, plannings et heures supplémentaires plafonnées.',
    ia: ['Blocage des heures sup. illégales avant validation', 'Prévision des pics d’absentéisme', 'Optimisation des plannings'],
  },
  M4: {
    phase: 'Phase 2',
    pitch: 'Per diem, voiture de fonction, logement, carburant — pratiques locales et contrôle de politique.',
    ia: ['OCR des justificatifs', 'Détection d’anomalies', 'Contrôle automatique de la politique de frais'],
  },
  M5: {
    phase: 'Phase 4',
    pitch: 'Matching candidat-poste par compétences réelles, pas par mots-clés du CV.',
    ia: ['Matching sémantique', 'Détection de biais dans les annonces', 'Prédiction de réussite candidat'],
  },
  M6: {
    phase: 'Phase 4',
    pitch: 'Intégration orchestrée dès avant J1, parcours 90 jours ; sortie conforme OHADA.',
    ia: ['Parcours personnalisé', 'Génération des documents de fin de contrat conformes au droit national'],
  },
  M7: {
    phase: 'Phase 3',
    pitch: 'Cascade automatique et traçable des objectifs, du stratégique à l’individuel.',
    ia: ['Détection des objectifs en souffrance avant échec', 'Suggestion de réalignement'],
  },
  M8: {
    phase: 'Phase 3',
    pitch: 'Évaluation continue, 360° simplifié, découplage optionnel performance / rémunération.',
    ia: ['Synthèse des feedbacks (Ollama local)', 'Alerte sur biais d’évaluation', 'Neutralisation de l’effet de récence'],
  },
  M10: {
    phase: 'Phase 3',
    pitch: 'Chemins de carrière lisibles, plans de succession auto-construits, mobilité interne prioritaire.',
    ia: ['Recommandation de trajectoires', 'Identification des successeurs', 'Plan de développement personnalisé'],
  },
  M11: {
    phase: 'Phase 3',
    pitch: 'Formation recommandée sur la base des lacunes du graphe et de la stratégie (FDFP & équivalents).',
    ia: ['Recommandation ciblée', 'Mesure d’impact réel sur la compétence'],
  },
};

export function ComingSoonPage({ module }: { module?: NavModule }) {
  const d = module ? DETAILS[module.code] : undefined;

  return (
    <div className="animate-fade-up">
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink">
        <ArrowLeft size={15} /> Cockpit
      </Link>

      <div className="glass mx-auto max-w-2xl overflow-hidden p-0">
        <div className="surface-night px-8 py-10 text-center">
          {module && (
            <span className="mono mb-3 inline-block rounded-full bg-amber/15 px-3 py-1 text-xs font-bold text-amber-deep">
              {module.code}
            </span>
          )}
          <h1 className="text-3xl font-semibold text-ink">{module?.label ?? 'Module'}</h1>
          {d && <p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-relaxed text-ink-500">{d.pitch}</p>}
        </div>

        <div className="p-8">
          <div className="mb-5 flex items-center justify-between">
            <StatusPill tone="amber" dot={false}>
              {d?.phase ?? 'Roadmap'}
            </StatusPill>
            <span className="text-xs font-semibold text-ink-400">Fondation prête · UI en cours</span>
          </div>

          {d && (
            <>
              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                <Sparkles size={15} className="text-amber-deep" /> Capacités d’intelligence prévues
              </p>
              <ul className="space-y-2">
                {d.ia.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 rounded-xl bg-surface2 px-3.5 py-2.5 text-sm font-medium text-ink-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-7 flex justify-center">
            <Link to="/">
              <Button variant="outline">Retour au Cockpit DRH</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
