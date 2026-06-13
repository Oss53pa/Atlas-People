import { useMemo } from 'react';
import { Building2, Users, User, Target } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { OkrSubNav } from '../../components/okr/OkrSubNav';
import { useM7Data } from '../../lib/m7/dataLive';
import { LEVEL_META, CONFIDENCE_META, KR_TYPE_META } from '../../lib/m7/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import type { OkrLevel, KeyResult } from '../../lib/m7/types';
import { cn } from '../../lib/cn';

function fmtKr(k: KeyResult) {
  if (k.type === 'binary') return k.currentValue ? 'Réalisé' : 'Non réalisé';
  if (k.type === 'currency') return `${(k.currentValue / 1e6).toFixed(1)} / ${(k.targetValue / 1e6).toFixed(1)} M FCFA`;
  if (k.type === 'percent') return `${k.currentValue} / ${k.targetValue} %`;
  return `${k.currentValue} / ${k.targetValue}${k.unit ? ' ' + k.unit : ''}`;
}

export function ObjectifsLevelPage({ level }: { level: OkrLevel }) {
  const m7 = useM7Data();
  const { toast } = useToast();
  const items = useMemo(() => m7.objectives.filter((o) => o.level === level && o.cycleId === m7.activeCycle.id), [level, m7]);
  const meta = LEVEL_META[level];
  const Icon = level === 'company' ? Building2 : level === 'individual' ? User : Users;
  const avgProg = items.length ? Math.round((items.reduce((s, o) => s + o.progress, 0) / items.length) * 100) : 0;

  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Objectifs · {meta.label}</h1>
          <p className="text-sm font-medium text-ink-500">{items.length} OKRs sur cycle <b className="text-amber-deep">{m7.activeCycle.label}</b></p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Objectif', description: `Nouveau OKR ${meta.label}` })}>+ Nouveau</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={`OKRs ${meta.label}`} value={String(items.length)} unit="actifs" icon={Icon} />
        <StatCard label="Progression moyenne" value={`${avgProg} %`} unit="cycle Q2" icon={Target} />
        <StatCard label="On track" value={String(items.filter(o => o.confidence === 'green').length)} unit="green" icon={Target} />
        <StatCard label="À risque" value={String(items.filter(o => o.confidence !== 'green').length)} unit="amber/red" icon={Target} tone={items.some(o=>o.confidence==='red') ? 'amber' : 'default'} />
      </div>

      <div className="space-y-3">
        {items.map((o) => {
          const owner = o.ownerEmployeeId ? employeeById(o.ownerEmployeeId) : null;
          const parent = o.parentObjectiveId ? m7.objectiveById(o.parentObjectiveId) : null;
          const krs = m7.krsByObjective(o.id);
          const conf = CONFIDENCE_META[o.confidence];
          return (
            <Card key={o.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="mono text-[11px] font-bold text-amber-deep">{o.ref}</span>
                    {parent && <span className="rounded-md bg-info/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-info">aligné → {parent.title.slice(0, 30)}</span>}
                  </div>
                  <p className="mt-1 text-[14px] font-bold text-ink">{o.title}</p>
                  {o.description && <p className="mt-0.5 text-[11px] font-medium text-ink-500">{o.description}</p>}
                  {owner && <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-ink-700"><Avatar name={employeeName(owner)} size="xs" /> Owner · {employeeName(owner)} · {owner.role}</div>}
                  {!owner && o.ownerTeam && <p className="mt-1 text-[11px] font-medium text-ink-700">Owner équipe : <b>{o.ownerTeam}</b></p>}
                </div>
                <div className="text-right">
                  <StatusPill tone={conf.tone} dot>{conf.label}</StatusPill>
                  <p className="mono mt-1 text-2xl font-bold text-amber-deep">{Math.round(o.progress * 100)}<span className="text-[12px] font-medium text-ink-400">%</span></p>
                </div>
              </div>

              <div className="mt-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-400">Key Results ({krs.length})</p>
                <ul className="space-y-1.5">
                  {krs.map((k) => {
                    const krProg = (k.currentValue - k.startValue) / Math.max(0.0001, k.targetValue - k.startValue);
                    const krConf = CONFIDENCE_META[k.confidence];
                    const krOwner = k.ownerEmployeeId ? employeeById(k.ownerEmployeeId) : null;
                    return (
                      <li key={k.id} className="rounded-lg bg-surface2/40 px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-ink">{k.title}</p>
                            <p className="mono mt-0.5 text-[10px] font-medium text-amber-deep">{fmtKr(k)} · {KR_TYPE_META[k.type].label}{krOwner ? ` · ${employeeName(krOwner).split(' ')[0]}` : ''}</p>
                          </div>
                          <div className="text-right">
                            <span className={cn('mono rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                              krConf.tone === 'ok' ? 'bg-ok/15 text-ok' : krConf.tone === 'amber' ? 'bg-amber/15 text-amber-deep' : 'bg-danger/15 text-danger')}>{Math.round(Math.max(0, Math.min(1, krProg)) * 100)} %</span>
                          </div>
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink/[0.06]">
                          <div className={cn('h-full rounded-full', krConf.tone === 'ok' ? 'bg-ok' : krConf.tone === 'amber' ? 'bg-amber' : 'bg-danger')} style={{ width: `${Math.round(Math.max(0, Math.min(1, krProg)) * 100)}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>
          );
        })}
        {items.length === 0 && <Card><p className="py-6 text-center text-[13px] font-medium text-ink-400">Aucun objectif {meta.label} sur ce cycle.</p></Card>}
      </div>
    </div>
  );
}

export function ObjectifsEntreprisePage()  { return <ObjectifsLevelPage level="company" />; }
export function ObjectifsDepartementPage() { return <ObjectifsLevelPage level="department" />; }
export function ObjectifsEquipePage()      { return <ObjectifsLevelPage level="team" />; }
export function ObjectifsIndividuelPage()  { return <ObjectifsLevelPage level="individual" />; }
