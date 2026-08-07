import { Link } from 'react-router-dom';
import { Grid3x3 } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { EvalSubNav } from '../../components/eval/EvalSubNav';
import { useM8Data } from '../../lib/m8/dataLive';
import { BOX_LABELS, CALIBRATION_DISTRIBUTION } from '../../lib/m8/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import type { TalentBoxKey } from '../../lib/m8/types';
import { cn } from '../../lib/cn';

// 9-box grid layout: rows = potential (haut en haut), cols = performance (faible à gauche)
const ROWS: { code: 'A' | 'B' | 'C'; label: string }[] = [
  { code: 'A', label: 'Haut potentiel' },
  { code: 'B', label: 'Potentiel moyen' },
  { code: 'C', label: 'Faible potentiel' },
];
const COLS: { code: 1 | 2 | 3; label: string }[] = [
  { code: 1, label: 'Faible perf.' },
  { code: 2, label: 'Performe' },
  { code: 3, label: 'Dépasse perf.' },
];

export function TalentGridPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Talent Grid · 9-box</h1>
        <p className="text-sm font-medium text-ink-500">Performance × potentiel · positionnement calibré commission RH · distribution recommandée</p>
      </div>

      <Card>
        <CardHeader title="Grille 9-box" subtitle="X = performance (gauche faible → droite forte) · Y = potentiel (bas faible → haut élevé)" action={<Grid3x3 size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-2 text-sm">
          <div></div>
          {COLS.map((c) => (
            <div key={c.code} className="rounded-md bg-surface2/40 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-ink-500">{c.label}</div>
          ))}
          {ROWS.map((r) => (
            <Box key={r.code} row={r.code} />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Distribution recommandée" subtitle="Cibles de calibration" />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-5">
          {CALIBRATION_DISTRIBUTION.map((d) => (
            <div key={d.label} className="rounded-xl border border-line bg-surface2/40 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">{d.label}</p>
              <p className="mono mt-1 text-lg font-bold text-ink">{d.target}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Box({ row }: { row: 'A' | 'B' | 'C' }) {
  const m8 = useM8Data();
  return (
    <>
      <div className="flex items-center justify-end pr-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">{row === 'A' ? 'Haut potentiel' : row === 'B' ? 'Potentiel moyen' : 'Faible potentiel'}</div>
      {COLS.map((c) => {
        const key = `${row}${c.code}` as TalentBoxKey;
        const meta = BOX_LABELS[key];
        const occupants = m8.talentBoxes.filter((t) => t.box === key);
        return (
          <div key={key} className={cn('rounded-xl border p-3 min-h-[160px]',
            meta.tone === 'ok' ? 'border-ok/30 bg-ok/[0.04]' :
            meta.tone === 'amber' ? 'border-amber/30 bg-amber/[0.04]' :
            meta.tone === 'warn' ? 'border-warn/30 bg-warn/[0.05]' :
            meta.tone === 'danger' ? 'border-danger/30 bg-danger/[0.05]' :
            meta.tone === 'info' ? 'border-info/30 bg-info/[0.04]' : 'border-line bg-surface2/30')}>
            <div className="flex items-center justify-between">
              <span className="mono rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-ink-700">{key}</span>
              <span className="mono text-[10px] font-bold text-amber-deep">{occupants.length}</span>
            </div>
            <p className="mt-1 text-[12px] font-bold text-ink">{meta.label}</p>
            <p className="mt-0.5 text-[10px] font-medium text-ink-500">{meta.hint}</p>
            <div className="mt-2 space-y-1">
              {occupants.slice(0, 4).map((t) => {
                const emp = employeeById(t.employeeId);
                if (!emp) return null;
                return (
                  <Link key={t.evaluationId} to={`/evaluations/eval/${emp.id}`} className="flex items-center gap-1.5 rounded-md bg-surface px-1.5 py-1 hover:bg-amber/[0.06]">
                    <Avatar name={employeeName(emp)} size="xs" />
                    <span className="truncate text-[10px] font-semibold text-ink">{emp.lastName} {emp.firstName.slice(0, 1)}.</span>
                  </Link>
                );
              })}
              {occupants.length > 4 && <p className="text-[10px] font-medium text-ink-400">+ {occupants.length - 4}</p>}
            </div>
          </div>
        );
      })}
    </>
  );
}
