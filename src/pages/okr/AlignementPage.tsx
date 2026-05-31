import { GitBranch, Building2, Users, User } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { OkrSubNav } from '../../components/okr/OkrSubNav';
import { OBJECTIVES, activeCycle, childObjectives } from '../../lib/m7/mock';
import { CONFIDENCE_META, LEVEL_META } from '../../lib/m7/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';
import type { Objective } from '../../lib/m7/types';

const LEVEL_ICON = { company: Building2, department: Users, team: Users, individual: User } as const;

function Node({ o, depth }: { o: Objective; depth: number }) {
  const children = childObjectives(o.id);
  const meta = LEVEL_META[o.level];
  const conf = CONFIDENCE_META[o.confidence];
  const Icon = LEVEL_ICON[o.level];
  const owner = o.ownerEmployeeId ? employeeById(o.ownerEmployeeId) : null;
  return (
    <div>
      <div className={cn('rounded-xl border border-line bg-surface2/40 p-3', depth === 0 && 'border-amber/30 bg-amber/[0.05]')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <Icon size={16} className={cn(
              meta.tone === 'amber' ? 'text-amber-deep' :
              meta.tone === 'info'  ? 'text-info' :
              meta.tone === 'ok'    ? 'text-ok' : 'text-ink-500',
            )} />
            <div className="min-w-0 flex-1">
              <p className={cn('text-[10px] font-bold uppercase tracking-wider', meta.tone === 'amber' ? 'text-amber-deep' : meta.tone === 'info' ? 'text-info' : meta.tone === 'ok' ? 'text-ok' : 'text-ink-500')}>{meta.label}</p>
              <p className="mt-0.5 truncate text-[13px] font-bold text-ink">{o.title}</p>
              {(owner || o.ownerTeam) && <p className="mt-0.5 text-[11px] font-medium text-ink-500">{owner ? employeeName(owner) : o.ownerTeam}</p>}
            </div>
          </div>
          <div className="text-right">
            <StatusPill tone={conf.tone} dot={false}>{conf.label}</StatusPill>
            <p className="mono mt-1 text-[14px] font-bold text-amber-deep">{Math.round(o.progress * 100)}%</p>
          </div>
        </div>
      </div>
      {children.length > 0 && (
        <div className="ml-6 mt-2 space-y-2 border-l-2 border-line pl-4">
          {children.map((c) => <Node key={c.id} o={c} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

export function AlignementPage() {
  const roots = OBJECTIVES.filter((o) => o.level === 'company' && o.cycleId === activeCycle.id);
  const orphans = OBJECTIVES.filter((o) => o.level !== 'company' && !o.parentObjectiveId && o.cycleId === activeCycle.id);
  const totalLinked = OBJECTIVES.filter((o) => o.level !== 'company' && o.parentObjectiveId && o.cycleId === activeCycle.id).length;
  const totalNonCompany = OBJECTIVES.filter((o) => o.level !== 'company' && o.cycleId === activeCycle.id).length;
  const alignPct = totalNonCompany ? Math.round((totalLinked / totalNonCompany) * 100) : 0;

  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Alignement de la cascade</h1>
        <p className="text-sm font-medium text-ink-500">Cascade Entreprise → Département → Équipe → Individuel · cible ≥ 80 % d'alignement</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Coverage cascade" value={`${alignPct} %`} unit="cible ≥ 80 %" icon={GitBranch} tone={alignPct >= 80 ? 'default' : 'amber'} />
        <StatCard label="OKRs alignés" value={String(totalLinked)} unit={`/${totalNonCompany}`} icon={GitBranch} />
        <StatCard label="Orphelins" value={String(orphans.length)} unit="sans parent" icon={GitBranch} tone={orphans.length ? 'amber' : 'default'} />
        <StatCard label="Branches racines" value={String(roots.length)} unit="OKR entreprise" icon={Building2} />
      </div>

      <Card>
        <CardHeader title="Vue cascade" subtitle="Cliquer sur un nœud pour ouvrir l'OKR" />
        <div className="space-y-3">
          {roots.map((r) => <Node key={r.id} o={r} depth={0} />)}
        </div>
      </Card>

      {orphans.length > 0 && (
        <Card className="border-warn/25">
          <CardHeader title="Objectifs orphelins" subtitle="À rattacher à un OKR parent pour améliorer l'alignement" />
          <ul className="space-y-1">
            {orphans.map((o) => {
              const owner = o.ownerEmployeeId ? employeeById(o.ownerEmployeeId) : null;
              return (
                <li key={o.id} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5">
                  <div>
                    <p className="text-[12px] font-semibold text-ink">{o.title}</p>
                    <p className="text-[10px] font-medium text-ink-500">{LEVEL_META[o.level].label}{owner ? ` · ${employeeName(owner)}` : o.ownerTeam ? ` · ${o.ownerTeam}` : ''}</p>
                  </div>
                  <span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">{Math.round(o.progress * 100)}%</span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
