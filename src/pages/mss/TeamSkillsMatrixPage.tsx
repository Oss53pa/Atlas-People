import { useEffect, useMemo } from 'react';
import { Grid3x3, Sparkles, AlertTriangle, ShieldAlert, Wifi, BadgeCheck } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { DevelopmentSubNav } from '../../components/mss/DevelopmentSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { skillsMatrix, skillCoverage, type SkillRow } from '../../lib/mss/dev';
import { employeeName, type EmployeeRecord } from '../../data/mock';
import { isBackendConfigured, useTeamSkillMatrix, type TeamSkillMatrixRow } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';
import { mockEmpId } from '../../lib/m1/roster';

function cellTone(level: number, target: number): string {
  if (level >= target) return 'bg-ok/12 text-ok';
  if (level >= target - 1) return 'bg-warn/12 text-warn';
  return 'bg-danger/12 text-danger';
}

export function TeamSkillsMatrixPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const teamIds = useMemo(() => new Set(team.map((e) => e.id)), [team]);
  const groups = skillsMatrix(team);

  const initials = (e: EmployeeRecord) => employeeName(e).split(' ').map((w) => w[0]).slice(0, 2).join('');

  // ── Branche LIVE — matrice compétences équipe (regroupée par collaborateur) ──
  const { data: ctx } = useSessionContext();
  const { data: liveMatrix } = useTeamSkillMatrix(ctx?.tenantId);
  const liveScoped = useMemo(
    () => (liveMatrix ?? []).filter((r) => teamIds.has(mockEmpId(r.employee_id))),
    [liveMatrix, teamIds],
  );
  const hasLive = isBackendConfigured && liveScoped.length > 0;
  const liveByEmployee = useMemo(() => {
    const map = new Map<string, { name: string; rows: TeamSkillMatrixRow[] }>();
    for (const r of liveScoped) {
      const name = `${r.employee_first_name ?? ''} ${r.employee_last_name ?? ''}`.trim() || '—';
      const g = map.get(r.employee_id) ?? { name, rows: [] };
      g.rows.push(r);
      map.set(r.employee_id, g);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [liveScoped]);

  if (hasLive) {
    return (
      <div className="animate-fade-up space-y-5">
        <DevelopmentSubNav />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-ink">Matrice compétences équipe</h1>
          <span className="inline-flex items-center gap-1 rounded-lg bg-ok/[0.1] px-2 py-1 text-[11px] font-semibold text-ok"><Wifi size={11} /> Live DB</span>
        </div>

        {liveByEmployee.map((emp) => (
          <Card key={emp.name} inset={false}>
            <div className="flex items-center gap-2.5 p-5 pb-3">
              <Avatar name={emp.name} size="sm" />
              <p className="text-sm font-bold text-ink">{emp.name}</p>
            </div>
            <div className="divide-y divide-line border-t border-line">
              {emp.rows.map((row) => {
                const target = row.target_level ?? row.level;
                const pct = target > 0 ? Math.min(100, Math.round((row.level / target) * 100)) : 100;
                const tone = row.level >= target ? 'bg-ok' : row.level >= target - 1 ? 'bg-warn' : 'bg-danger';
                return (
                  <div key={row.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5">
                    <span className="min-w-[9rem] flex-1 text-[13px] font-semibold text-ink">{row.skill_name || 'Compétence'}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-surface2">
                        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="mono text-[12px] font-bold text-ink-500">{row.level}/{row.target_level ?? '—'}</span>
                    </div>
                    {row.certified && <StatusPill tone="ok" dot={false}><BadgeCheck size={11} /> Certifié</StatusPill>}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

        <Card>
          <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldAlert size={14} className="mt-0.5 shrink-0 text-info" /> Les niveaux affichés combinent auto-évaluation du collaborateur et validation managériale. Aucune donnée de rémunération n'est exposée dans cette matrice.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <DevelopmentSubNav />
      <h1 className="text-2xl font-semibold text-ink">Matrice compétences équipe</h1>

      {groups.map((g) => (
        <Card key={g.category} inset={false}>
          <div className="p-5 pb-3"><CardHeader title={g.category} className="mb-0" /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                  <th className="px-4 py-2.5 text-left">Compétence</th>
                  {team.map((e) => <th key={e.id} className="px-2 py-2.5 text-center" title={employeeName(e)}>{initials(e)}</th>)}
                  <th className="px-2 py-2.5 text-center">Cible</th>
                  <th className="px-3 py-2.5 text-center">Couv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {g.rows.map((row: SkillRow) => {
                  const cov = skillCoverage(row, team);
                  return (
                    <tr key={row.name}>
                      <td className="px-4 py-2 text-[13px] font-semibold text-ink">{row.name}</td>
                      {team.map((e) => {
                        const lvl = row.levels[e.id] ?? 0;
                        return <td key={e.id} className="px-2 py-2 text-center"><span className={`mono inline-block w-9 rounded-md py-0.5 text-[11px] font-bold ${cellTone(lvl, row.target)}`}>{lvl}/5</span></td>;
                      })}
                      <td className="px-2 py-2 text-center mono text-[12px] font-semibold text-ink-500">{row.target}/5</td>
                      <td className={`px-3 py-2 text-center mono text-[12px] font-bold ${cov >= 80 ? 'text-ok' : cov >= 60 ? 'text-warn' : 'text-danger'}`}>{cov}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      <Card className="glass-amber">
        <p className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-amber-deep"><Sparkles size={14} /> Analyse Proph3t</p>
        <ul className="space-y-1.5 text-[12px] font-medium text-ink-700">
          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ok" /> Force collective : Prospection commerciale (plusieurs experts).</li>
          <li className="flex items-start gap-2"><AlertTriangle size={13} className="mt-0.5 shrink-0 text-warn" /> Risque : compétence portée par une seule personne (5/5 unique) — perte de capacité en cas de départ.</li>
          <li className="flex items-start gap-2"><Grid3x3 size={13} className="mt-0.5 shrink-0 text-info" /> Suggestion : former les profils proches de la cible sur « Gestion grands comptes ».</li>
        </ul>
      </Card>

      <Card>
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldAlert size={14} className="mt-0.5 shrink-0 text-info" /> Les niveaux affichés combinent auto-évaluation du collaborateur et validation managériale. Aucune donnée de rémunération n'est exposée dans cette matrice.</p>
      </Card>
    </div>
  );
}
