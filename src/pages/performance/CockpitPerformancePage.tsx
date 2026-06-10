import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gauge, Building2, Users, ShieldAlert, TrendingUp, AlertTriangle,
  Scale, Layers, UserCircle2, CheckCircle2, Clock, Coins,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';
import {
  PERF_CONFIG, PERF_EMPLOYES, PERF_TODAY,
  computeAllEmployes, computeArbitrages, computeDepartements, computeEmploye, computeGlobal,
  type EmployeCalc, type ObjectifCalc,
} from '../../lib/perf/mock';

type Audience = 'employe' | 'manager' | 'rh' | 'direction';

const AUDIENCES: { key: Audience; label: string; icon: typeof Gauge }[] = [
  { key: 'employe', label: 'Employé', icon: UserCircle2 },
  { key: 'manager', label: 'Manager', icon: Users },
  { key: 'rh', label: 'RH', icon: ShieldAlert },
  { key: 'direction', label: 'Direction', icon: Building2 },
];

const pct = (n: number) => `${Math.round(n)} %`;
const toneForPct = (n: number): 'ok' | 'amber' | 'danger' => (n >= 85 ? 'ok' : n >= 60 ? 'amber' : 'danger');

function ScoreBar({ value, tone = 'amber' }: { value: number; tone?: 'amber' | 'ok' | 'danger' }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
      <div
        className={cn('h-full rounded-full', tone === 'ok' ? 'bg-ok' : tone === 'danger' ? 'bg-danger' : 'bg-amber')}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/** Carte objectif : atteinte + écart auto/validé (R4) + flag arbitrage. */
function ObjectifCard({ o }: { o: ObjectifCalc }) {
  return (
    <div className="rounded-xl border border-line bg-surface2/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-ink">{o.objectif.libelle}</p>
          <p className="mt-0.5 text-[11px] font-medium text-ink-500">
            poids {o.objectif.poids} % · {o.objectif.estCollectif ? 'collectif' : 'individuel'} · {o.objectif.actions.length} actions
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {o.arbitrage && <StatusPill tone="danger" dot={false}>arbitrage</StatusPill>}
          <span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">{pct(o.pctValide)}</span>
        </div>
      </div>
      <div className="mt-2"><ScoreBar value={o.pctValide} tone={toneForPct(o.pctValide)} /></div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-ink-400">
        <span>auto {pct(o.pctAuto)} · validé {pct(o.pctValide)}</span>
        <span className={cn(o.ecart > PERF_CONFIG.seuilArbitrage ? 'text-danger font-bold' : '')}>écart {Math.round(o.ecart)} pts</span>
      </div>
    </div>
  );
}

function EmployeeRow({ e }: { e: EmployeCalc }) {
  const emp = employeeById(e.employeId);
  return (
    <div className="rounded-lg border border-line bg-surface2/40 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-ink">{emp ? employeeName(emp) : e.employeId}</p>
          <p className="text-[10px] font-medium text-ink-400">{emp?.role} · {e.departement}</p>
        </div>
        <div className="flex items-center gap-2">
          {e.actionsEnRetard.length > 0 && <StatusPill tone="warn" dot={false}>{e.actionsEnRetard.length} retard</StatusPill>}
          {e.ecartMax > PERF_CONFIG.seuilArbitrage && <StatusPill tone="danger" dot={false}>écart {Math.round(e.ecartMax)}</StatusPill>}
          <span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[12px] font-bold text-amber-deep">{pct(e.scoreValide)}</span>
        </div>
      </div>
      <div className="mt-2"><ScoreBar value={e.scoreValide} tone={toneForPct(e.scoreValide)} /></div>
    </div>
  );
}

export function CockpitPerformancePage() {
  const [audience, setAudience] = useState<Audience>('direction');
  const [employeId, setEmployeId] = useState('e5');
  const [managerId, setManagerId] = useState('e2');

  const all = useMemo(() => computeAllEmployes(), []);
  const depts = useMemo(() => computeDepartements(), []);
  const global = useMemo(() => computeGlobal(), []);
  const arbitrages = useMemo(() => computeArbitrages(), []);
  const retardsTotal = all.reduce((s, e) => s + e.actionsEnRetard.length, 0);

  const selectedEmp = useMemo(
    () => computeEmploye(PERF_EMPLOYES.find((e) => e.employeId === employeId) ?? PERF_EMPLOYES[0]),
    [employeId],
  );
  const team = all.filter((e) => e.managerId === managerId);
  const managers = [...new Set(PERF_EMPLOYES.map((e) => e.managerId).filter(Boolean))] as string[];

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Performance — Cockpit</h1>
          <p className="text-sm font-medium text-ink-500">
            Campagne <b className="text-amber-deep">2026 · S1</b> en clôture · au {PERF_TODAY} · couche officielle = <b>validée manager</b> (R4)
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-line bg-surface2/40 p-1">
          {AUDIENCES.map((a) => (
            <button
              key={a.key}
              onClick={() => setAudience(a.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition',
                audience === a.key ? 'bg-amber text-white shadow-sm' : 'text-ink-500 hover:text-ink',
              )}
            >
              <a.icon size={14} /> {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber/25 bg-amber/[0.04] px-4 py-2.5 text-[11px] font-medium text-ink-600">
        <Scale size={13} className="mr-1 inline text-amber-deep" />
        Tous les pourcentages sont <b>dérivés des actions par le moteur</b> (jamais saisis, R1) et calculés en deux passes
        auto / validé (§6.7). Seule la couche validée remonte et fait foi.
      </div>

      {/* ───────────────── DIRECTION ───────────────── */}
      {audience === 'direction' && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Atteinte globale (validée)" value={pct(global.pctValide)} unit="entreprise" icon={TrendingUp} tone="amber" mono />
            <StatCard label="Atteinte globale (auto)" value={pct(global.pctAuto)} unit="temps réel" icon={Gauge} mono />
            <StatCard label="Départements" value={String(depts.length)} unit="consolidés" icon={Layers} />
            <StatCard label="Écarts à arbitrer" value={String(arbitrages.length)} unit="objectifs" icon={AlertTriangle} tone={arbitrages.length ? 'amber' : 'default'} />
          </div>
          <Card>
            <CardHeader title="Atteinte par département vs poids entreprise" subtitle="Remontée pondérée employé → département → global (§6.6)" />
            <div className="space-y-2">
              {depts.map((d) => (
                <div key={d.departement} className="rounded-xl border border-line bg-surface2/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-bold text-ink">{d.departement}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-ink-400">poids {d.poids} % · {d.effectif} pers.</span>
                      <span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[12px] font-bold text-amber-deep">{pct(d.pctValide)}</span>
                    </div>
                  </div>
                  <div className="mt-2"><ScoreBar value={d.pctValide} tone={toneForPct(d.pctValide)} /></div>
                </div>
              ))}
            </div>
          </Card>

          {/* Accroche bonus (§9) : score validé → SCORE du moteur Bonus M3 */}
          <Link to="/bonus" className="block">
            <Card className="border-amber/30 transition hover:border-amber/50 hover:bg-amber/[0.04]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><Coins size={20} /></span>
                  <div>
                    <p className="text-[13px] font-bold text-ink">Accroche bonus M3 →</p>
                    <p className="text-[11px] font-medium text-ink-500">Le score validé alimente la variable <b className="mono">SCORE</b> du moteur bonus (§9). Simuler la répartition de l'enveloppe →</p>
                  </div>
                </div>
                <StatusPill tone="amber" dot={false}>Simulation</StatusPill>
              </div>
            </Card>
          </Link>
        </>
      )}

      {/* ───────────────── RH ───────────────── */}
      {audience === 'rh' && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Effectif évalué" value={String(all.length)} unit="campagne S1" icon={Users} />
            <StatCard label="Score moyen (validé)" value={pct(all.reduce((s, e) => s + e.scoreValide, 0) / all.length)} unit="tenant" icon={TrendingUp} mono />
            <StatCard label="Arbitrages ouverts" value={String(arbitrages.length)} unit="écart > seuil" icon={Scale} tone={arbitrages.length ? 'amber' : 'default'} />
            <StatCard label="Actions en retard" value={String(retardsTotal)} unit="alertes" icon={Clock} tone={retardsTotal ? 'amber' : 'default'} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Card>
              <CardHeader title="Distribution des scores (validés)" subtitle="Tous les employés de la campagne" />
              <div className="space-y-1.5">
                {[...all].sort((a, b) => b.scoreValide - a.scoreValide).map((e) => <EmployeeRow key={e.employeId} e={e} />)}
              </div>
            </Card>
            <Card className={arbitrages.length ? 'border-warn/25' : undefined}>
              <CardHeader title="Écarts à arbitrer" subtitle={`${arbitrages.length} objectif(s) · |auto − validé| > ${PERF_CONFIG.seuilArbitrage}`} action={<AlertTriangle size={16} className="text-warn" />} />
              <div className="space-y-1.5">
                {arbitrages.length === 0 && <p className="text-[12px] font-medium text-ink-400">Aucun écart au-delà du seuil.</p>}
                {arbitrages.map((a, i) => {
                  const emp = employeeById(a.employeId);
                  return (
                    <div key={i} className="rounded-lg bg-surface2/40 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[12px] font-semibold text-ink">{emp ? employeeName(emp) : a.employeId}</p>
                        <StatusPill tone="danger" dot={false}>écart {Math.round(a.ecart)} pts</StatusPill>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] font-medium text-ink-500">{a.objectif.libelle}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ───────────────── MANAGER ───────────────── */}
      {audience === 'manager' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Manager :</span>
            {managers.map((m) => {
              const emp = employeeById(m);
              return (
                <button key={m} onClick={() => setManagerId(m)}
                  className={cn('rounded-lg px-3 py-1 text-[12px] font-semibold', managerId === m ? 'bg-amber text-white' : 'border border-line bg-surface2/40 text-ink-500')}>
                  {emp ? employeeName(emp) : m}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Équipe" value={String(team.length)} unit="collaborateurs" icon={Users} />
            <StatCard label="Atteinte équipe (validée)" value={pct(team.length ? team.reduce((s, e) => s + e.scoreValide, 0) / team.length : 0)} unit="moyenne" icon={TrendingUp} mono tone="amber" />
            <StatCard label="Écarts à arbitrer" value={String(team.filter((e) => e.ecartMax > PERF_CONFIG.seuilArbitrage).length)} unit="dans l'équipe" icon={Scale} />
            <StatCard label="Actions en retard" value={String(team.reduce((s, e) => s + e.actionsEnRetard.length, 0))} unit="à relancer" icon={Clock} />
          </div>
          <Card>
            <CardHeader title="Vue équipe consolidée" subtitle="Score validé · écart auto/validé · retards" />
            <div className="space-y-1.5">
              {team.map((e) => <EmployeeRow key={e.employeId} e={e} />)}
              {team.length === 0 && <p className="text-[12px] font-medium text-ink-400">Aucun collaborateur rattaché.</p>}
            </div>
          </Card>
        </>
      )}

      {/* ───────────────── EMPLOYÉ ───────────────── */}
      {audience === 'employe' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Collaborateur :</span>
            {PERF_EMPLOYES.map((e) => {
              const emp = employeeById(e.employeId);
              return (
                <button key={e.employeId} onClick={() => setEmployeId(e.employeId)}
                  className={cn('rounded-lg px-3 py-1 text-[12px] font-semibold', employeId === e.employeId ? 'bg-amber text-white' : 'border border-line bg-surface2/40 text-ink-500')}>
                  {emp ? employeeName(emp) : e.employeId}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Score S1 (validé)" value={pct(selectedEmp.scoreValide)} unit="officiel" icon={CheckCircle2} mono tone="amber" />
            <StatCard label="Score S1 (auto)" value={pct(selectedEmp.scoreAuto)} unit="auto-évaluation" icon={Gauge} mono />
            <StatCard label="Objectifs" value={String(selectedEmp.objectifs.length)} unit="suivis" icon={Layers} />
            <StatCard label="Actions en retard" value={String(selectedEmp.actionsEnRetard.length)} unit="échéance dépassée" icon={Clock} tone={selectedEmp.actionsEnRetard.length ? 'amber' : 'default'} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Objectifs & atteinte" subtitle="Dérivée des plans d'action (R1) · écart auto/validé" />
              <div className="space-y-2">
                {selectedEmp.objectifs.map((o) => <ObjectifCard key={o.objectif.id} o={o} />)}
              </div>
            </Card>
            <Card className={selectedEmp.actionsEnRetard.length ? 'border-warn/25' : undefined}>
              <CardHeader title="Actions en retard" subtitle="échéance < aujourd'hui & non réalisée (§5.3)" action={<AlertTriangle size={16} className="text-warn" />} />
              <div className="space-y-1.5">
                {selectedEmp.actionsEnRetard.length === 0 && <p className="text-[12px] font-medium text-ink-400">Aucune action en retard. 👌</p>}
                {selectedEmp.actionsEnRetard.map(({ action, objectif }) => (
                  <div key={action.id} className="rounded-lg bg-surface2/40 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12px] font-semibold text-ink">{action.libelle}</p>
                      <StatusPill tone="warn" dot={false}>échéance {action.dateEcheance}</StatusPill>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] font-medium text-ink-500">{objectif.libelle} · statut {action.statut}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      <p className="text-[11px] font-medium text-ink-400">
        Moteur Performance M7/M8 · {all.length} fiches employé · {depts.length} départements · calcul §6 déterministe (src/engine/performance) ·
        couche validée = seule remontée (R4) · score validé exposé en lecture seule à M3 (§9).
      </p>
    </div>
  );
}
