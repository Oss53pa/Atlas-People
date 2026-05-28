import { useEffect, useMemo } from 'react';
import { Scale, Users, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { PerformanceSubNav } from '../../components/mss/PerformanceSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { employeeName } from '../../data/mock';

// Distribution cible (forced ranking indicatif) — pilotée par la DRH.
const DIST = [
  { label: 'Top performers (5/5)', pct: 13, tone: 'ok' as const },
  { label: 'Bons performers (4/5)', pct: 40, tone: 'ok' as const },
  { label: 'Performers (3/5)', pct: 37, tone: 'info' as const },
  { label: 'À améliorer (2/5)', pct: 8, tone: 'warn' as const },
  { label: 'En difficulté (1/5)', pct: 2, tone: 'danger' as const },
];

function noteFor(id: string): number { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return 2 + (h % 4); }

export function TeamCalibrationPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);

  return (
    <div className="animate-fade-up space-y-5">
      <PerformanceSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Calibration — campagne annuelle 2026</h1>
        <p className="text-sm font-medium text-ink-500">Session 20/06/2026 14h–17h · animée par la DRH</p>
      </div>

      <Card>
        <CardHeader title="Distribution proposée (Proph3t)" subtitle="Cohérence inter-équipes du département" action={<Scale size={16} className="text-info" />} />
        <div className="space-y-2">
          {DIST.map((d) => (
            <div key={d.label} className="flex items-center gap-2 text-[12px] font-medium">
              <span className="w-44 text-ink-600">{d.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/[0.06]"><div className={`h-full rounded-full ${d.tone === 'ok' ? 'bg-ok' : d.tone === 'info' ? 'bg-info' : d.tone === 'warn' ? 'bg-warn' : 'bg-danger'}`} style={{ width: `${d.pct}%` }} /></div>
              <span className="mono w-8 text-right text-ink-400">{d.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Mes évaluations préliminaires" subtitle={`${team.length} collaborateur(s)`} action={<Users size={16} className="text-ink-400" />} />
        <div className="space-y-1.5">
          {team.map((e) => {
            const note = noteFor(e.id);
            const flag = note <= 2;
            return (
              <div key={e.id} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2">
                <div className="flex items-center gap-2.5"><Avatar name={employeeName(e)} size="xs" /><span className="text-sm font-semibold text-ink">{employeeName(e)}</span></div>
                <div className="flex items-center gap-2">
                  {flag && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warn"><AlertTriangle size={11} /> à approfondir</span>}
                  <StatusPill tone={note >= 4 ? 'ok' : note === 3 ? 'info' : 'warn'} dot={false}>{note}/5</StatusPill>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-deep" /> La calibration ajuste la cohérence des notes entre managers pairs. Les décisions de promotion/augmentation s'y discutent <strong>sans montants</strong> — les montants relèvent de la RH/DRH.</p>
      </Card>
    </div>
  );
}
