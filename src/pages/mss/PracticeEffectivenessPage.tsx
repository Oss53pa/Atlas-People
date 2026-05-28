import { useEffect } from 'react';
import { Gauge, TrendingUp, Trophy, Lock } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { PracticeSubNav } from '../../components/mss/PracticeSubNav';
import { useSurface } from '../../store/useSurface';
import { EFFECTIVENESS as e } from '../../lib/mss/practice';

export function PracticeEffectivenessPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const pct = (e.global / 5) * 100;
  const maxHist = Math.max(...e.history.map((h) => h.score));

  return (
    <div className="animate-fade-up space-y-5">
      <PracticeSubNav />
      <h1 className="text-2xl font-semibold text-ink">Mon score d’efficacité managériale</h1>

      <Card>
        <CardHeader title="Score global" action={<Gauge size={16} className="text-ink-400" />} />
        <p className="mono text-3xl font-semibold text-ink">{e.global}/5</p>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-surface2"><div className="h-full rounded-full bg-info" style={{ width: `${pct}%` }} /></div>
        <p className="mt-1 text-[12px] font-semibold text-ok">Très bon</p>
      </Card>

      <Card>
        <CardHeader title="Composantes" />
        <div className="space-y-2">
          {e.components.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="w-52 shrink-0 text-[12px] font-medium text-ink-600">{c.label} <span className="text-ink-400">(poids {c.weight}%)</span></span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface2"><div className="h-full rounded-full bg-info/70" style={{ width: `${(c.score / 5) * 100}%` }} /></div>
              <span className="mono w-10 text-right text-[12px] font-semibold text-ink-700">{c.score}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Évolution" action={<TrendingUp size={16} className="text-ink-400" />} />
          <div className="flex h-28 items-end gap-3">
            {e.history.map((h) => (
              <div key={h.year} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="mono text-[11px] font-semibold text-ink">{h.score}</span>
                <div className="flex w-full items-end justify-center" style={{ height: '100%' }}>
                  <div className="w-9 rounded-t-lg bg-info/70" style={{ height: `${(h.score / maxHist) * 100}%` }} />
                </div>
                <span className="text-[10px] font-semibold text-ink-400">{h.year}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12px] font-semibold text-ok">Progression : +0,3 vs année précédente</p>
        </Card>
        <Card>
          <CardHeader title="Positionnement (anonymisé)" action={<Trophy size={16} className="text-ink-400" />} />
          <div className="space-y-1 text-sm font-medium text-ink-700">
            <p>Vs managers de mon niveau : <span className="mono font-semibold text-ink">{e.percentileLevel}e percentile</span></p>
            <p>Vs managers du département : <span className="font-semibold text-ink">{e.rankDepartment}</span></p>
          </div>
        </Card>
      </div>

      <Card>
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-500"><Lock size={14} className="mt-0.5 shrink-0 text-info" /> Visible par vous-même, votre N+1 et la RH/DRH. Vos N-1 n’y ont pas accès (sauf via le feedback 360 partagé).</p>
      </Card>
    </div>
  );
}
