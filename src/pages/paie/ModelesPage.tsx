import { Library, Plus, GitBranch } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';

const MODELES = [
  { code: 'MOD_CADRE_B_CI', libelle: 'Cadre B — CCN Commerce CI', parent: 'Base Atlas CI', rubriques: 9, population: 4 },
  { code: 'MOD_EMPLOYE_CI', libelle: 'Employé administratif CI', parent: 'Base Atlas CI', rubriques: 7, population: 6 },
  { code: 'MOD_TERRAIN_CI', libelle: 'Personnel terrain (HS + panier)', parent: 'MOD_EMPLOYE_CI', rubriques: 10, population: 2 },
  { code: 'MOD_EXPAT_CI', libelle: 'Expatrié (package complet)', parent: 'Base Atlas CI', rubriques: 14, population: 0 },
];

export function ModelesPage() {
  const { toast } = useToast();
  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Modèles de paie</h1>
          <p className="text-sm font-medium text-ink-500">Assemblages de rubriques paramétrables · héritage + dérogations · application en masse</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Nouveau modèle', description: 'Wizard de création (depuis bibliothèque Atlas ou vierge).' })}><Plus size={14} /> Nouveau modèle</Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MODELES.map((m) => (
          <Card key={m.code} className="card-hover">
            <CardHeader title={m.libelle} subtitle={m.code} action={<Library size={16} className="text-amber-deep" />} />
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink-500">
              <GitBranch size={13} className="text-ink-400" /> hérite de <span className="font-semibold text-ink">{m.parent}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[12px] font-medium text-ink-400">{m.rubriques} rubriques · {m.population} collaborateur(s)</span>
              <div className="flex gap-2">
                <StatusPill tone="ok" dot={false}>Actif</StatusPill>
                <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'success', title: 'Application', description: `${m.libelle} appliqué à la sélection.` })}>Appliquer</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
