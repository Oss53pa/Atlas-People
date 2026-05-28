import { useEffect, useMemo } from 'react';
import { Grid3x3, Sparkles, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { DevelopmentSubNav } from '../../components/mss/DevelopmentSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { skillsMatrix, skillCoverage, type SkillRow } from '../../lib/mss/dev';
import { employeeName, type EmployeeRecord } from '../../data/mock';

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
  const groups = skillsMatrix(team);

  const initials = (e: EmployeeRecord) => employeeName(e).split(' ').map((w) => w[0]).slice(0, 2).join('');

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
