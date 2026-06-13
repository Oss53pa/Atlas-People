import { CalendarRange, Plus } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { OkrSubNav } from '../../components/okr/OkrSubNav';
import { useM7Data } from '../../lib/m7/dataLive';
import { CHECKIN_CADENCES, BEST_PRACTICES } from '../../lib/m7/referentiels';

export function CyclesOkrPage() {
  const m7 = useM7Data();
  const { toast } = useToast();
  const tone: Record<string, 'ok' | 'amber' | 'neutral' | 'warn'> = {
    active: 'ok', planned: 'amber', review: 'warn', closed: 'neutral',
  };
  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Cycles OKR</h1>
          <p className="text-sm font-medium text-ink-500">Trimestres / semestres · cadence check-in · revue clôture</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Cycle', description: 'Wizard nouveau cycle' })}><Plus size={14} /> Nouveau cycle</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Cycles total" value={String(m7.cycles.length)} unit="historique + futur" icon={CalendarRange} />
        <StatCard label="Actifs" value={String(m7.cycles.filter(c=>c.status==='active').length)} unit="en cours" icon={CalendarRange} tone="amber" />
        <StatCard label="Planifiés" value={String(m7.cycles.filter(c=>c.status==='planned').length)} unit="à démarrer" icon={CalendarRange} />
        <StatCard label="Clôturés" value={String(m7.cycles.filter(c=>c.status==='closed').length)} unit="archivés" icon={CalendarRange} />
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Tous les cycles" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Réf.</th>
              <th className="px-3 py-2 text-left">Période</th>
              <th className="px-3 py-2 text-left">Cadence</th>
              <th className="px-3 py-2 text-center">Objectifs</th>
              <th className="px-3 py-2 text-left">Revue</th>
              <th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {[...m7.cycles].sort((a,b)=>b.startDate.localeCompare(a.startDate)).map((c) => {
                const count = m7.objectives.filter((o) => o.cycleId === c.id).length;
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-2 mono text-[11px] font-bold text-amber-deep">{c.ref}</td>
                    <td className="px-3 py-2 text-[12px] font-semibold text-ink">{c.label} <span className="ml-2 text-[10px] font-medium text-ink-500">{c.startDate} → {c.endDate}</span></td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{c.checkInCadence}</td>
                    <td className="px-3 py-2 mono text-center text-[11px] font-bold text-ink">{count}</td>
                    <td className="px-3 py-2 mono text-[11px] font-medium text-ink-700">{c.reviewDate ?? '—'}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={tone[c.status] ?? 'neutral'} dot={c.status === 'active'}>{c.status}</StatusPill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="Cadences disponibles" />
          <ul className="space-y-1.5">
            {CHECKIN_CADENCES.map((c) => (
              <li key={c.code} className="rounded-lg bg-surface2/40 px-3 py-2"><p className="text-[12px] font-bold text-ink">{c.label}</p><p className="text-[10px] font-medium text-ink-500">{c.hint}</p></li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Bonnes pratiques OKR" />
          <ul className="space-y-1 text-[11px] font-medium text-ink-700">
            {BEST_PRACTICES.map((p) => <li key={p} className="rounded-lg bg-surface2/40 px-3 py-1.5">• {p}</li>)}
          </ul>
        </Card>
      </div>
    </div>
  );
}
