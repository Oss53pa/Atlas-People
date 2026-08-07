import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Send, Sparkles, Wifi } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { TeamTimeSubNav } from '../../components/m2/TeamTimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useTimeOff } from '../../store/useTimeOff';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam, useManagerId } from '../../lib/mss/scope';
import { holidaySet } from '../../lib/m2/holidays';
import { employeeName } from '../../data/mock';
import { isBackendConfigured, useAllLeaveRequests, useTeamDirectory, dirName } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';
import { cn } from '../../lib/cn';

const TODAY = new Date().toISOString().slice(0, 10);
const MIN_COVERAGE = 3;
function isoAdd(iso: string, n: number) { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function dow(iso: string) { return new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }); }

type PlanMember = { id: string; name: string };
type PlanLeave = { employeeId: string; start: string; end: string };
type Cell = { kind: 'A' | 'B' | 'rest' | 'leave' | 'holiday' };

export function TeamPlanningPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const managerId = useManagerId();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const mockTeam = useMemo(() => scopedTeam(depth, employees, managerId), [depth, employees, managerId]);
  const mockRequests = useTimeOff((s) => s.requests).filter((r) => r.status === 'approved');
  const [offset, setOffset] = useState(0);

  // Live layer
  const { data: ctx } = useSessionContext();
  const { data: rawLeaves } = useAllLeaveRequests(ctx?.tenantId);
  const { data: liveDir } = useTeamDirectory(ctx?.tenantId);
  const hasLive = isBackendConfigured && Boolean(ctx?.tenantId);

  // Normalized planning data
  const planTeam: PlanMember[] = hasLive
    ? (liveDir ?? []).map(d => ({ id: d.id, name: dirName(d) }))
    : mockTeam.map(e => ({ id: e.id, name: employeeName(e) }));

  const planLeaves: PlanLeave[] = hasLive
    ? (rawLeaves ?? []).filter(r => r.status === 'approved').map(r => ({ employeeId: r.employee_id, start: r.start_date, end: r.end_date }))
    : mockRequests.map(r => ({ employeeId: r.employeeId, start: r.start, end: r.end }));

  const weekStart = isoAdd(TODAY, offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => isoAdd(weekStart, i));
  const fer = holidaySet('CI');

  const cellFor = (mi: number, iso: string, di: number): Cell => {
    if ([...fer].includes(iso)) return { kind: 'holiday' };
    if (planLeaves.some(r => r.employeeId === planTeam[mi].id && r.start <= iso && r.end >= iso)) return { kind: 'leave' };
    if (new Date(`${iso}T00:00:00`).getDay() === 0) return { kind: 'rest' };
    return { kind: (mi + di) % 2 === 0 ? 'A' : 'B' };
  };

  const coverage = days.map((iso, di) => planTeam.reduce((n, _, mi) => { const c = cellFor(mi, iso, di); return n + (c.kind === 'A' || c.kind === 'B' ? 1 : 0); }, 0));

  const CELL: Record<Cell['kind'], { label: string; cls: string }> = {
    A: { label: '06–14', cls: 'bg-ok/10 text-ok' },
    B: { label: '14–22', cls: 'bg-amber/12 text-amber-deep' },
    rest: { label: 'Repos', cls: 'bg-ink/[0.04] text-ink-400' },
    leave: { label: 'Congé', cls: 'bg-warn/12 text-warn' },
    holiday: { label: 'Férié', cls: 'bg-info/12 text-info' },
  };

  return (
    <div className="animate-fade-up space-y-5">
      <TeamTimeSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-ink">Planning de mon équipe</h1>
          {hasLive && <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>}
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Planning publié', description: `Semaine du ${new Date(`${weekStart}T00:00:00`).toLocaleDateString('fr-FR')} — les membres sont notifiés.` })}><Send size={14} /> Publier</Button>
      </div>

      <Card inset={false}>
        <div className="flex items-center justify-between p-4">
          <button onClick={() => setOffset((o) => o - 1)} className="rounded-lg p-2 text-ink-500 hover:bg-ink/5"><ChevronLeft size={18} /></button>
          <p className="text-sm font-bold text-ink">Semaine du {new Date(`${weekStart}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
          <button onClick={() => setOffset((o) => o + 1)} className="rounded-lg p-2 text-ink-500 hover:bg-ink/5"><ChevronRight size={18} /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2.5 text-left">Membre</th>
                {days.map((iso) => <th key={iso} className="px-2 py-2.5 text-center">{dow(iso)}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {planTeam.map((m, mi) => (
                <tr key={m.id}>
                  <td className="px-4 py-2 text-left text-[13px] font-semibold text-ink">{m.name}</td>
                  {days.map((iso, di) => { const c = CELL[cellFor(mi, iso, di).kind]; return <td key={iso} className="px-2 py-2 text-center"><span className={cn('mono inline-block w-full rounded-md px-1 py-1 text-[11px] font-bold', c.cls)}>{c.label}</span></td>; })}
                </tr>
              ))}
              <tr className="border-t-2 border-line bg-surface2">
                <td className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-ink-400">Couverture</td>
                {coverage.map((n, i) => <td key={i} className="px-2 py-2 text-center"><StatusPill tone={n >= MIN_COVERAGE ? 'ok' : 'danger'} dot={false}>{n}</StatusPill></td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Sparkles size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Proph3t peut proposer une affectation optimisée (couverture, repos légal, habilitations, équité des shifts pénibles) — vous validez ou ajustez. ComplianceGuard bloque tout repos insuffisant ou agent non habilité.</p>
      </Card>
    </div>
  );
}
