import { useEffect, useState } from 'react';
import { Columns3, Save, Lock, LayoutGrid } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { SettingsSubNav } from '../../components/mss/SettingsSubNav';
import { useSurface } from '../../store/useSurface';
import { TEAM_VIEW_COLUMNS } from '../../lib/mss/settings';

const DEFAULT_VIEWS = [
  { key: 'cards', label: 'Cartes (galerie)' },
  { key: 'table', label: 'Tableau dense' },
  { key: 'org', label: 'Organigramme' },
];
const SORTS = [
  { key: 'name', label: 'Nom (A→Z)' },
  { key: 'role', label: 'Poste' },
  { key: 'site', label: 'Site' },
  { key: 'seniority', label: 'Ancienneté' },
  { key: 'attention', label: 'Points d’attention d’abord' },
];
const PLANNING_VIEWS = [
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
];

export function SettingsTeamViewPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);
  const { toast } = useToast();

  const [view, setView] = useState('cards');
  const [sort, setSort] = useState('name');
  const [planning, setPlanning] = useState('week');
  const [cols, setCols] = useState<Set<string>>(new Set(TEAM_VIEW_COLUMNS.filter((c) => c.on).map((c) => c.key)));

  const toggle = (k: string) => setCols((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const save = () => toast({ variant: 'success', title: 'Vue enregistrée', description: 'Votre vue équipe par défaut est mise à jour.' });

  return (
    <div className="animate-fade-up space-y-5">
      <SettingsSubNav />
      <h1 className="text-2xl font-semibold text-ink">Vue équipe par défaut</h1>

      <Card className="border-warn/25">
        <p className="flex items-start gap-2 text-[12px] font-semibold text-warn"><Lock size={14} className="mt-0.5 shrink-0" /> Les salaires individuels ne sont jamais affichables dans la vue équipe (règle de confidentialité R12).</p>
      </Card>

      <Card>
        <CardHeader title="Affichage par défaut" action={<LayoutGrid size={16} className="text-ink-400" />} />
        <div className="space-y-1.5">
          {DEFAULT_VIEWS.map((v) => (
            <label key={v.key} className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
              <input type="radio" name="view" checked={view === v.key} onChange={() => setView(v.key)} className="accent-info" /> {v.label}
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Tri par défaut" />
        <div className="flex flex-wrap gap-1.5">
          {SORTS.map((s) => (
            <label key={s.key} className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-surface2 px-3 py-1.5 text-sm font-medium text-ink-700">
              <input type="radio" name="sort" checked={sort === s.key} onChange={() => setSort(s.key)} className="accent-info" /> {s.label}
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Colonnes affichées" action={<Columns3 size={16} className="text-ink-400" />} />
        <div className="grid gap-1.5 sm:grid-cols-2">
          {TEAM_VIEW_COLUMNS.map((c) => (
            <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
              <input type="checkbox" checked={cols.has(c.key)} onChange={() => toggle(c.key)} className="accent-info" /> {c.label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-[12px] font-medium text-ink-500">Aucune colonne salaire / rémunération individuelle n’est proposée.</p>
      </Card>

      <Card>
        <CardHeader title="Planning équipe" />
        <div className="flex flex-wrap gap-1.5">
          {PLANNING_VIEWS.map((p) => (
            <label key={p.key} className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-surface2 px-3 py-1.5 text-sm font-medium text-ink-700">
              <input type="radio" name="planning" checked={planning === p.key} onChange={() => setPlanning(p.key)} className="accent-info" /> {p.label}
            </label>
          ))}
        </div>
        <div className="mt-2"><StatusPill tone="neutral" dot={false}>Affecte la vue par défaut de /team/planning</StatusPill></div>
      </Card>

      <div className="flex justify-end"><Button size="sm" onClick={save}><Save size={14} /> Enregistrer</Button></div>
    </div>
  );
}
