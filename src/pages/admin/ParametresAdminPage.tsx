import { Settings, FileSignature, Library, ShieldCheck, Globe2, Sparkles } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { AdminRhSubNav } from '../../components/admin/AdminRhSubNav';
import { AMENDMENT_TYPES, CERTIFICATE_TYPES, CONTRACT_TYPES, DEPARTURE_TYPES, MANDATE_TYPES, DPAE_ORGANISMS, EVENT_CATEGORIES, EVENT_TYPES_BY_CATEGORY } from '../../lib/m4/referentiels';

export function ParametresAdminPage() {
  const { toast } = useToast();

  const sections = [
    { title: 'Modèles de contrats',         count: CONTRACT_TYPES.length,       hint: 'DocJourney · par pays / CCN', icon: FileSignature },
    { title: "Catalogue d'avenants",        count: AMENDMENT_TYPES.length,      hint: '7 catégories · sensibilités', icon: Library },
    { title: 'Types d\'événements admin',    count: Object.values(EVENT_TYPES_BY_CATEGORY).reduce((s,a)=>s+a.length,0), hint: `${EVENT_CATEGORIES.length} catégories`, icon: Sparkles },
    { title: 'Types de départ',              count: DEPARTURE_TYPES.length,      hint: 'workflows OHADA', icon: Library },
    { title: 'Bibliothèque certificats',     count: CERTIFICATE_TYPES.length,    hint: 'légaux + attestations + lettres', icon: Library },
    { title: 'Types de mandats',             count: MANDATE_TYPES.length,        hint: 'DP/CSE/CHSCT/DS', icon: ShieldCheck },
    { title: 'Organismes DPAE',              count: DPAE_ORGANISMS.length,       hint: '14 pays UEMOA/CEMAC', icon: Globe2 },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <AdminRhSubNav />

      <div>
        <h1 className="text-2xl font-semibold text-ink">Paramètres Actes & conformité</h1>
        <p className="text-sm font-medium text-ink-500">Modèles · workflows · sensibilités · alertes · intégrations ADVIST / DocJourney / PROPH3T</p>
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
        <CardHeader title="Intégrations" subtitle="Composants externes du module" />
        <ul className="space-y-2">
          <li className="flex items-center justify-between rounded-xl bg-surface2/40 px-3 py-2.5">
            <div><p className="text-[13px] font-bold text-ink">ADVIST · Signature électronique qualifiée OHADA</p>
              <p className="text-[11px] font-medium text-ink-500">Tous les actes juridiquement opposables · preuve d'intégrité (hash + horodatage)</p></div>
            <StatusPill tone="ok" dot>Connecté</StatusPill>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-surface2/40 px-3 py-2.5">
            <div><p className="text-[13px] font-bold text-ink">DocJourney · Templates documents</p>
              <p className="text-[11px] font-medium text-ink-500">Versionnés · validés Juriste social par pays · multilingue FR/EN</p></div>
            <StatusPill tone="ok" dot>Connecté</StatusPill>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-surface2/40 px-3 py-2.5">
            <div><p className="text-[13px] font-bold text-ink">PROPH3T (Ollama, CONFIDENTIAL)</p>
              <p className="text-[11px] font-medium text-ink-500">Suggestion / OCR · ne décide jamais d'un acte juridique · validation humaine obligatoire</p></div>
            <StatusPill tone="ok" dot>Connecté</StatusPill>
          </li>
        </ul>
      </Card>

      <Card>
        <CardHeader title="Règles dures M4 (synthèse)" subtitle="Non négociables · enforcement RLS + audit" />
        <ol className="space-y-1 text-[12px] font-medium text-ink-700">
          {[
            'R1 — Tout acte signé ADVIST (valeur juridique OHADA)',
            'R2 — Validation 4-eyes obligatoire sur contrats, avenants sensibles, départs, disciplinaire',
            'R3 — Audit chaîné SHA-256 spécifique M4',
            'R4 — Conservation 30 ans des contrats après terminaison',
            'R5 — Conservation 10 ans des bulletins, attestations',
            'R6 — Effacement automatique sanctions 3 ans (sauf récidive)',
            'R7 — Disciplinaire = accès strict DRH + Juriste',
            'R8 — Manager opérationnel = vue dégradée (pas rémunération, pas sanctions)',
            'R9 — Aucune embauche sans DPAE déposée dans les délais',
            'R10 — Aucun licenciement sans procédure conforme OHADA documentée',
            'R11 — Représentants du personnel : statut protégé enforcé',
            'R12 — Sync M3 systématique pour tout avenant à impact rémunération',
            'R13 — PROPH3T = validation humaine + signature obligatoires',
            'R14 — Renouvellements expatriés : alertes J-90/60/30',
            'R15 — Bilan social annuel généré + archivé format légal',
          ].map((r) => <li key={r} className="rounded-lg bg-surface2/40 px-3 py-1.5">{r}</li>)}
        </ol>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'info', title: 'Réinitialiser', description: 'Référentiels rechargés depuis la version Atlas' })}>Recharger référentiels</Button>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Sauvegardé', description: 'Paramètres M4 enregistrés' })}><Settings size={14} /> Enregistrer</Button>
      </div>
    </div>
  );
}
