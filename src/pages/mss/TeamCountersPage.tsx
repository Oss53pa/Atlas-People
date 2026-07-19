import { useEffect, useMemo } from 'react';
import { Gauge, Plane, Clock, RefreshCw, AlertTriangle, Sparkles, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { TeamTimeSubNav } from '../../components/m2/TeamTimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useOvertime } from '../../store/useOvertime';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam, useManagerId } from '../../lib/mss/scope';
import { employeeName, employeeLeaveBalance, type EmployeeRecord } from '../../data/mock';
import { isBackendConfigured, useTeamDirectory, useTeamLeaveBalances, useTeamOvertime, dirName } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const MONTH = new Date().toISOString().slice(0, 7);
const HS_MONTH_LIMIT = 20;
const fmtH = (n: number) => `${Math.round(n * 10) / 10}h`;

type Counters = { id: string; name: string; cpDisp: number; cpPeremp: number; perempIn: number; hsMonth: number; hsCumul: number; recup: number };

export function TeamCountersPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const managerId = useManagerId();
  const employees = useDirectory((s) => s.employees);
  const records = useOvertime((s) => s.records);
  const depth = useManagerScope((s) => s.depth);
  const mockTeam = useMemo(() => scopedTeam(depth, employees, managerId), [depth, employees, managerId]);

  // Live layer
  const { data: ctx } = useSessionContext();
  const { data: liveDir } = useTeamDirectory(ctx?.tenantId);
  const { data: liveBalances } = useTeamLeaveBalances(ctx?.tenantId);
  const { data: liveOvertimes } = useTeamOvertime(ctx?.tenantId, 'all');
  const hasLive = isBackendConfigured && Boolean(ctx?.tenantId);

  // Mock rows
  const mockRows: Counters[] = mockTeam.map((e: EmployeeRecord, i) => {
    const bal = employeeLeaveBalance(e);
    const cpPeremp = i % 3 === 0 ? 5 : i % 3 === 2 ? 8 : 0;
    const perempIn = cpPeremp ? (i % 3 === 0 ? 3 : 8) : 0;
    const hs = records.filter((r) => r.employeeId === e.id && r.status !== 'refused');
    const hsMonth = Math.round(hs.filter((r) => r.date.slice(0, 7) === MONTH).reduce((s, r) => s + r.overtimeHours, 0) * 10) / 10;
    const hsCumul = Math.round((hsMonth + (i * 3.5) % 14) * 10) / 10;
    const recup = (i % 4) * 2;
    return { id: e.id, name: employeeName(e), cpDisp: bal.remaining, cpPeremp, perempIn, hsMonth, hsCumul, recup };
  });

  // Live rows
  const liveRows: Counters[] = hasLive ? (liveDir ?? []).map((d) => {
    const bal = (liveBalances ?? []).find(b => b.employee_id === d.id && b.leave_type_code === 'CP');
    const cpDisp = bal?.remaining ?? 0;
    const hs = (liveOvertimes ?? []).filter(r => r.employee_id === d.id);
    const hsMonth = Math.round(hs.filter(r => r.work_date.slice(0, 7) === MONTH).reduce((s, r) => s + r.hours, 0) * 10) / 10;
    const hsCumul = Math.round(hs.reduce((s, r) => s + r.hours, 0) * 10) / 10;
    return { id: d.id, name: dirName(d), cpDisp, cpPeremp: 0, perempIn: 0, hsMonth, hsCumul, recup: 0 };
  }) : [];

  const rows = hasLive ? liveRows : mockRows;

  const totalCp = rows.reduce((s, r) => s + r.cpDisp, 0);
  const avgCp = rows.length ? Math.round((totalCp / rows.length) * 10) / 10 : 0;
  const hsYear = Math.round(rows.reduce((s, r) => s + r.hsCumul, 0) * 10) / 10;
  const avgHs = rows.length ? Math.round((hsYear / rows.length) * 10) / 10 : 0;
  const recupTotal = rows.reduce((s, r) => s + r.recup, 0);

  const alerts = rows.flatMap((r) => {
    const a: { label: string; tone: 'warn' | 'danger' }[] = [];
    if (r.cpPeremp > 0) a.push({ label: `${r.name} : ${r.cpPeremp} j de CP périment dans ${r.perempIn} j`, tone: 'warn' });
    if (r.hsMonth > HS_MONTH_LIMIT) a.push({ label: `${r.name} : ${fmtH(r.hsMonth)} HS ce mois (> ${HS_MONTH_LIMIT}h)`, tone: 'danger' });
    return a;
  });

  return (
    <div className="animate-fade-up space-y-5">
      <TeamTimeSubNav />
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-ink">Compteurs de l'équipe</h1>
        {hasLive && <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="CP disponibles" value={String(totalCp)} unit="j cumul" icon={Plane} tone="amber" />
        <StatCard label="Moyenne CP" value={String(avgCp)} unit="j / pers." icon={Gauge} />
        <StatCard label="HS cumul année" value={fmtH(hsYear)} unit={`moy ${fmtH(avgHs)}`} icon={Clock} tone="amber" />
        <StatCard label="Récupération" value={fmtH(recupTotal)} unit="disponible" icon={RefreshCw} />
      </div>

      <Card inset={false}>
        <div className="p-5 pb-3"><CardHeader title="Détail par membre" subtitle="CP, péremption, heures sup, récupération" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2.5 text-left">Membre</th>
                <th className="px-3 py-2.5 text-right">CP disp.</th>
                <th className="px-3 py-2.5 text-right">CP péremp.</th>
                <th className="px-3 py-2.5 text-right">HS mois</th>
                <th className="px-3 py-2.5 text-right">HS cumul</th>
                <th className="px-3 py-2.5 text-right">Récup.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><Avatar name={r.name} size="xs" /><span className="text-[13px] font-semibold text-ink">{r.name}</span></div></td>
                  <td className="mono px-3 py-2.5 text-right font-semibold text-ink">{r.cpDisp} j</td>
                  <td className={`mono px-3 py-2.5 text-right ${r.cpPeremp > 0 ? 'font-semibold text-warn' : 'text-ink-400'}`}>{r.cpPeremp ? `${r.cpPeremp} j (J-${r.perempIn})` : '0'}</td>
                  <td className={`mono px-3 py-2.5 text-right ${r.hsMonth > HS_MONTH_LIMIT ? 'font-semibold text-danger' : 'text-ink-500'}`}>{fmtH(r.hsMonth)}</td>
                  <td className="mono px-3 py-2.5 text-right text-ink-500">{fmtH(r.hsCumul)}</td>
                  <td className="mono px-3 py-2.5 text-right text-ink-500">{fmtH(r.recup)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {alerts.length > 0 && (
        <Card className="border-warn/25">
          <CardHeader title="Alertes compteurs" action={<AlertTriangle size={16} className="text-warn" />} />
          <div className="space-y-1.5">
            {alerts.map((a, i) => (
              <div key={i} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium ${a.tone === 'danger' ? 'bg-danger/[0.06] text-danger' : 'bg-warn/[0.06] text-ink-700'}`}>
                <AlertTriangle size={13} className={a.tone === 'danger' ? 'text-danger' : 'text-warn'} /> {a.label}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Sparkles size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Proph3t peut suggérer des actions (inviter à poser les CP qui périment, planifier un point HS, absorber les récupérations dans le planning) — vous restez décideur. Les compteurs individuels ne sont jamais convertis en montants ; la rémunération relève du back-office.</p>
      </Card>
    </div>
  );
}
