import { useMemo, useState } from 'react';
import { Library, Plus, GitBranch, Eye, X, ChevronRight } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { cn } from '../../lib/cn';

type Kind = 'gain' | 'cot_sal' | 'impot' | 'cot_pat';
type Origin = 'herite' | 'derogation' | 'ajout';

interface Rubrique {
  code: string;
  label: string;
  kind: Kind;
  detail: string;
  origin: Origin;
}

const KIND_LABEL: Record<Kind, string> = {
  gain: 'Gains',
  cot_sal: 'Cotisations salariales',
  impot: 'Impôts & contributions',
  cot_pat: 'Cotisations patronales',
};
const KIND_ORDER: Kind[] = ['gain', 'cot_sal', 'impot', 'cot_pat'];

const ORIGIN_META: Record<Origin, { label: string; tone: 'neutral' | 'warn' | 'info' }> = {
  herite: { label: 'Hérité', tone: 'neutral' },
  derogation: { label: 'Dérogation', tone: 'warn' },
  ajout: { label: 'Ajout', tone: 'info' },
};

const r = (code: string, label: string, kind: Kind, detail: string, origin: Origin): Rubrique => ({ code, label, kind, detail, origin });

interface Modele {
  code: string;
  libelle: string;
  parent: string;
  population: number;
  rubriques: Rubrique[];
}

const MODELES: Modele[] = [
  {
    code: 'MOD_CADRE_B_CI', libelle: 'Cadre B — CCN Commerce CI', parent: 'Base Atlas CI', population: 4,
    rubriques: [
      r('SAL_BASE', 'Salaire de base', 'gain', 'Mensuel contractuel', 'herite'),
      r('SURSAL', 'Sursalaire', 'gain', 'Barème cadre majoré', 'derogation'),
      r('IND_FONCTION', 'Indemnité de fonction', 'gain', 'Forfait cadre', 'ajout'),
      r('PRIME_RESP', 'Prime de responsabilité', 'gain', 'Forfait', 'ajout'),
      r('PRIME_ANC', 'Prime d’ancienneté', 'gain', 'Barème légal', 'ajout'),
      r('CNPS_RET_SAL', 'CNPS Retraite (salariale)', 'cot_sal', '6,30 %', 'herite'),
      r('CMU_SAL', 'CMU (salariale)', 'cot_sal', '1 000 F / personne', 'herite'),
      r('ITS', 'Impôt sur salaires (ITS/IGR)', 'impot', 'Barème progressif', 'herite'),
      r('CNPS_RET_PAT', 'CNPS Retraite (patronale)', 'cot_pat', '7,70 %', 'herite'),
    ],
  },
  {
    code: 'MOD_EMPLOYE_CI', libelle: 'Employé administratif CI', parent: 'Base Atlas CI', population: 6,
    rubriques: [
      r('SAL_BASE', 'Salaire de base', 'gain', 'Mensuel contractuel', 'herite'),
      r('SURSAL', 'Sursalaire', 'gain', 'Au-delà du minimum conventionnel', 'herite'),
      r('CNPS_RET_SAL', 'CNPS Retraite (salariale)', 'cot_sal', '6,30 %', 'herite'),
      r('CMU_SAL', 'CMU (salariale)', 'cot_sal', '1 000 F / personne', 'herite'),
      r('ITS', 'Impôt sur salaires (ITS/IGR)', 'impot', 'Barème progressif', 'herite'),
      r('CNPS_RET_PAT', 'CNPS Retraite (patronale)', 'cot_pat', '7,70 %', 'herite'),
      r('CNPS_PF', 'Prestations familiales (patronale)', 'cot_pat', '5,75 %', 'herite'),
    ],
  },
  {
    code: 'MOD_TERRAIN_CI', libelle: 'Personnel terrain (HS + panier)', parent: 'MOD_EMPLOYE_CI', population: 2,
    rubriques: [
      r('SAL_BASE', 'Salaire de base', 'gain', 'Mensuel contractuel', 'herite'),
      r('SURSAL', 'Sursalaire', 'gain', 'Au-delà du minimum conventionnel', 'herite'),
      r('HS_115', 'Heures supplémentaires +15 %', 'gain', 'Décompte M2 (8 premières h)', 'ajout'),
      r('PRIME_PANIER', 'Prime de panier', 'gain', 'Indemnité repas chantier', 'ajout'),
      r('PRIME_SALISSURE', 'Prime de salissure', 'gain', 'Forfait terrain', 'ajout'),
      r('CNPS_RET_SAL', 'CNPS Retraite (salariale)', 'cot_sal', '6,30 %', 'herite'),
      r('CMU_SAL', 'CMU (salariale)', 'cot_sal', '1 000 F / personne', 'herite'),
      r('ITS', 'Impôt sur salaires (ITS/IGR)', 'impot', 'Barème progressif', 'herite'),
      r('CNPS_RET_PAT', 'CNPS Retraite (patronale)', 'cot_pat', '7,70 %', 'herite'),
      r('CNPS_PF', 'Prestations familiales (patronale)', 'cot_pat', '5,75 %', 'herite'),
    ],
  },
  {
    code: 'MOD_EXPAT_CI', libelle: 'Expatrié (package complet)', parent: 'Base Atlas CI', population: 0,
    rubriques: [
      r('SAL_BASE', 'Salaire de base', 'gain', 'Mensuel contractuel', 'herite'),
      r('SURSAL', 'Sursalaire', 'gain', 'Barème expatrié', 'derogation'),
      r('IND_EXPAT', 'Indemnité d’expatriation', 'gain', 'Package mobilité internationale', 'ajout'),
      r('IND_LOGEMENT', 'Indemnité de logement', 'gain', 'Avantage en nature', 'ajout'),
      r('IND_TRANSPORT', 'Indemnité de transport', 'gain', 'Forfait', 'ajout'),
      r('IND_FONCTION', 'Indemnité de fonction', 'gain', 'Forfait cadre', 'ajout'),
      r('PRIME_RESP', 'Prime de responsabilité', 'gain', 'Forfait', 'ajout'),
      r('CNPS_RET_SAL', 'CNPS Retraite (salariale)', 'cot_sal', '6,30 % (plafonné)', 'derogation'),
      r('CMU_SAL', 'CMU (salariale)', 'cot_sal', '1 000 F / personne', 'herite'),
      r('ITS', 'Impôt sur salaires (ITS/IGR)', 'impot', 'Barème progressif', 'herite'),
      r('CNPS_RET_PAT', 'CNPS Retraite (patronale)', 'cot_pat', '7,70 %', 'herite'),
      r('CNPS_PF', 'Prestations familiales (patronale)', 'cot_pat', '5,75 %', 'herite'),
      r('CNPS_AT', 'Accident du travail (patronale)', 'cot_pat', '3,00 %', 'ajout'),
      r('FDFP', 'FDFP — taxe formation (patronale)', 'cot_pat', '1,20 %', 'ajout'),
    ],
  },
];

/** Chaîne d'héritage d'un modèle (du modèle vers la racine Base Atlas CI). */
function inheritanceChain(model: Modele): string[] {
  const chain = [model.libelle];
  let parentCode = model.parent;
  const guard = new Set<string>([model.code]);
  while (parentCode && !guard.has(parentCode)) {
    guard.add(parentCode);
    const parent = MODELES.find((m) => m.code === parentCode);
    if (parent) { chain.push(parent.libelle); parentCode = parent.parent; }
    else { chain.push(parentCode); break; }
  }
  return chain.reverse();
}

export function ModelesPage() {
  const { toast } = useToast();
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const preview = MODELES.find((m) => m.code === previewCode) ?? null;

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
              <span className="text-[12px] font-medium text-ink-400">{m.rubriques.length} rubriques · {m.population} collaborateur(s)</span>
              <div className="flex gap-2">
                <StatusPill tone="ok" dot={false}>Actif</StatusPill>
                <Button variant="outline" size="sm" onClick={() => setPreviewCode(m.code)}><Eye size={14} /> Aperçu</Button>
                <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'success', title: 'Application', description: `${m.libelle} appliqué à la sélection.` })}>Appliquer</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {preview && <PreviewModal model={preview} onClose={() => setPreviewCode(null)} />}
    </div>
  );
}

function PreviewModal({ model, onClose }: { model: Modele; onClose: () => void }) {
  const chain = useMemo(() => inheritanceChain(model), [model]);
  const counts = useMemo(() => ({
    herite: model.rubriques.filter((x) => x.origin === 'herite').length,
    derogation: model.rubriques.filter((x) => x.origin === 'derogation').length,
    ajout: model.rubriques.filter((x) => x.origin === 'ajout').length,
  }), [model]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-surface shadow-float sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Library size={16} className="text-amber-deep" />
              <h2 className="truncate text-base font-bold text-ink">{model.libelle}</h2>
            </div>
            <p className="mono mt-0.5 text-[11px] font-semibold text-ink-400">{model.code} · {model.rubriques.length} rubriques</p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-ink/5"><X size={18} /></button>
        </div>

        {/* Chaîne d'héritage + compteurs */}
        <div className="border-b border-line bg-surface2 px-5 py-3">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">Chaîne d'héritage</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {chain.map((node, i) => (
              <span key={node} className="flex items-center gap-1.5">
                <span className={cn('rounded-lg px-2 py-1 text-[11px] font-bold', i === chain.length - 1 ? 'bg-amber/15 text-amber-deep' : 'bg-ink/[0.05] text-ink-600')}>{node}</span>
                {i < chain.length - 1 && <ChevronRight size={13} className="text-ink-400" />}
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill tone="neutral" dot={false}>{counts.herite} hérité(s)</StatusPill>
            <StatusPill tone="warn" dot={false}>{counts.derogation} dérogation(s)</StatusPill>
            <StatusPill tone="info" dot={false}>{counts.ajout} ajout(s)</StatusPill>
          </div>
        </div>

        {/* Rubriques groupées */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {KIND_ORDER.map((kind) => {
            const rows = model.rubriques.filter((x) => x.kind === kind);
            if (rows.length === 0) return null;
            return (
              <div key={kind} className="mb-4 last:mb-0">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">{KIND_LABEL[kind]}</p>
                <div className="space-y-1.5">
                  {rows.map((rub) => {
                    const om = ORIGIN_META[rub.origin];
                    return (
                      <div key={rub.code} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                        <span className="mono rounded bg-ink/[0.05] px-1.5 py-0.5 text-[10px] font-bold text-ink-500">{rub.code}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-ink">{rub.label}</p>
                          <p className="truncate text-[11px] font-medium text-ink-400">{rub.detail}</p>
                        </div>
                        <StatusPill tone={om.tone} dot={false}>{om.label}</StatusPill>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pied */}
        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">
          <p className="text-[11px] font-medium text-ink-400">Aperçu en lecture seule · les dérogations priment sur l'héritage.</p>
          <Button size="sm" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}
