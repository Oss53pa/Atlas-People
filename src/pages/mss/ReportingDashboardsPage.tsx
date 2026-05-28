import { useEffect, useState } from 'react';
import { LayoutGrid, Plus, BarChart3, LineChart, Gauge, Hash, Trash2 } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Modal } from '../../components/ui/overlays';
import { EmptyState } from '../../components/ui/feedback';
import { useToast } from '../../components/ui/Toast';
import { ReportingSubNav } from '../../components/mss/ReportingSubNav';
import { useSurface } from '../../store/useSurface';

const WIDGETS = [
  { key: 'line', label: 'Graphique courbe', icon: LineChart },
  { key: 'bar', label: 'Graphique barres', icon: BarChart3 },
  { key: 'gauge', label: 'Jauge', icon: Gauge },
  { key: 'kpi', label: 'KPI card', icon: Hash },
];
const METRICS = ['Effectif', 'Absentéisme', 'Heures supplémentaires', 'Avancement OKR', 'Engagement', 'Budget formation', 'Masse salariale (agrégée)'];

interface Widget { id: string; type: string; metric: string }
interface Dashboard { id: string; name: string; widgets: Widget[] }

export function ReportingDashboardsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);
  const { toast } = useToast();

  const [dashboards, setDashboards] = useState<Dashboard[]>([
    { id: 'd1', name: 'Comité mensuel', widgets: [{ id: 'w1', type: 'kpi', metric: 'Effectif' }, { id: 'w2', type: 'line', metric: 'Engagement' }, { id: 'w3', type: 'bar', metric: 'Heures supplémentaires' }] },
  ]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('kpi');
  const [metric, setMetric] = useState(METRICS[0]);

  const create = () => {
    setDashboards((d) => [...d, { id: `d${Date.now()}`, name: name.trim() || 'Nouveau dashboard', widgets: [{ id: `w${Date.now()}`, type, metric }] }]);
    setOpen(false); setName('');
    toast({ variant: 'success', title: 'Dashboard créé', description: 'Votre tableau de bord personnalisé est enregistré.' });
  };
  const remove = (id: string) => setDashboards((d) => d.filter((x) => x.id !== id));

  return (
    <div className="animate-fade-up space-y-5">
      <ReportingSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Mes dashboards personnalisés</h1>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Nouveau dashboard</Button>
      </div>

      {dashboards.length === 0 ? (
        <Card><EmptyState icon={LayoutGrid} title="Aucun dashboard" description="Composez votre premier tableau de bord avec les indicateurs de votre choix." /></Card>
      ) : dashboards.map((d) => (
        <Card key={d.id}>
          <CardHeader title={d.name} action={<Button variant="ghost" size="icon" onClick={() => remove(d.id)} aria-label="Supprimer"><Trash2 size={15} className="text-ink-400" /></Button>} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {d.widgets.map((w) => {
              const W = WIDGETS.find((x) => x.key === w.type) ?? WIDGETS[0];
              const Icon = W.icon;
              return (
                <div key={w.id} className="rounded-xl bg-surface2 p-4">
                  <p className="flex items-center gap-2 text-[12px] font-semibold text-ink-500"><Icon size={14} className="text-info" /> {W.label}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{w.metric}</p>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <Card>
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-500"><LayoutGrid size={14} className="mt-0.5 shrink-0 text-info" /> Les dashboards partagés conservent les règles de confidentialité : chaque manager voit les données de son propre périmètre.</p>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau dashboard" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Annuler</Button><Button size="sm" onClick={create}>Créer</Button></>}>
        <div className="space-y-3">
          <label className="block">
            <span className="text-[12px] font-semibold text-ink-500">Nom du dashboard</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" placeholder="Ex. Comité mensuel" />
          </label>
          <div>
            <span className="text-[12px] font-semibold text-ink-500">Premier widget</span>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {WIDGETS.map((w) => {
                const Icon = w.icon;
                return (
                  <label key={w.key} className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
                    <input type="radio" name="wtype" checked={type === w.key} onChange={() => setType(w.key)} className="accent-info" /> <Icon size={14} /> {w.label}
                  </label>
                );
              })}
            </div>
          </div>
          <label className="block">
            <span className="text-[12px] font-semibold text-ink-500">Indicateur</span>
            <select value={metric} onChange={(e) => setMetric(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30">
              {METRICS.map((mm) => <option key={mm} value={mm}>{mm}</option>)}
            </select>
          </label>
          <StatusPill tone="info" dot={false}>Données agrégées uniquement</StatusPill>
        </div>
      </Modal>
    </div>
  );
}
