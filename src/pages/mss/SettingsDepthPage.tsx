import { useEffect, useMemo } from 'react';
import { Layers, Info } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { SettingsSubNav } from '../../components/mss/SettingsSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { DEPTH_LABEL, DEPTH_SUBLABEL, depthCounts, type ManagerDepth } from '../../lib/mss/scope';

const OPTIONS: ManagerDepth[] = ['direct', 'department', 'all'];

export function SettingsDepthPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);
  const { toast } = useToast();

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const setDepth = useManagerScope((s) => s.setDepth);
  const counts = useMemo(() => depthCounts(employees), [employees]);

  const countFor = (d: ManagerDepth) => d === 'direct' ? counts.n1 : d === 'department' ? counts.n1 + counts.n2 : counts.total;

  const choose = (d: ManagerDepth) => {
    setDepth(d);
    toast({ variant: 'success', title: 'Profondeur appliquée', description: `${DEPTH_LABEL[d]} · ${countFor(d)} collaborateurs visibles.` });
  };

  return (
    <div className="animate-fade-up space-y-5">
      <SettingsSubNav />
      <h1 className="text-2xl font-semibold text-ink">Profondeur de vue par défaut</h1>

      <Card>
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Info size={14} className="mt-0.5 shrink-0 text-info" /> Détermine le périmètre affiché par défaut dans tout le portail (équipe, reporting, validations). Vous pouvez toujours l’ajuster ponctuellement via le sélecteur de la barre latérale.</p>
      </Card>

      <div className="space-y-2.5">
        {OPTIONS.map((d) => (
          <Card key={d} className={`cursor-pointer transition ${depth === d ? 'border-info ring-1 ring-info/30' : 'border-line card-hover'}`} onClick={() => choose(d)}>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="radio" name="depth" checked={depth === d} onChange={() => choose(d)} className="mt-1 accent-info" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink"><Layers size={15} className="text-info" /> {DEPTH_LABEL[d]}</p>
                  <StatusPill tone={depth === d ? 'info' : 'neutral'} dot={false}>{countFor(d)} collaborateurs</StatusPill>
                </div>
                <p className="mt-0.5 text-[13px] font-medium text-ink-500">{DEPTH_SUBLABEL[d]}</p>
              </div>
            </label>
          </Card>
        ))}
      </div>

      <Card>
        <p className="text-[12px] font-medium text-ink-500">Répartition réelle de votre cascade : <span className="mono font-semibold text-ink">{counts.n1}</span> en N-1, <span className="mono font-semibold text-ink">{counts.n2}</span> en N-2, <span className="mono font-semibold text-ink">{counts.n3plus}</span> au-delà — total <span className="mono font-semibold text-ink">{counts.total}</span>.</p>
      </Card>
    </div>
  );
}
