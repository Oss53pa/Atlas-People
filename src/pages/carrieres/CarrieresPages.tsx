/**
 * M10 CARRIÈRES & SUCCESSION — 11 pages consolidées.
 * Cockpit, Filières, Trajectoires, Postes clés, Succession, Hauts potentiels,
 * Mentorat, Cartographie, Mobilité interne, Reporting, Paramètres.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Route, TrendingUp, Crown, Network, Sparkles, Users, Map, Briefcase,
  BarChart3, Settings, ArrowUpRight, AlertTriangle, CheckCircle2, Star,
  ArrowLeftRight, Download,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { CarrieresSubNav } from '../../components/carrieres/CarrieresSubNav';
import { M10LiveBanner } from '../../components/carrieres/M10LiveBanner';
import {
  FILIERES, TRAJECTORIES, CRITICAL_ROLES, HIGH_POTS, MENTORSHIPS,
  OPPORTUNITIES, SKILLS_MAPPING, kpis, filiereByCode, successorsOf,
} from '../../lib/m10/mock';
import {
  PATH_TYPE_META, READINESS_META, HIGH_POT_PROGRAMS, BENCH_STRENGTH_META,
  CAREER_LEVELS, PROGRAM_TONES, RETENTION_BENCHMARKS, CAREER_ACTIONS,
} from '../../lib/m10/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import { useRoster } from '../../lib/m1/roster';
import { cn } from '../../lib/cn';

/* ─────────────────────────────────────── 1. COCKPIT */
export function CockpitCarrieresPage() {
  const k = useMemo(() => kpis(), []);
  const weakRoles = CRITICAL_ROLES.filter((r) => r.benchStrength === 'weak' || r.benchStrength === 'none');
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <M10LiveBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Carrières & Succession</h1>
          <p className="text-sm font-medium text-ink-500">Filières · trajectoires · plans de succession · hauts potentiels · mentorat</p>
        </div>
        <div className="flex gap-2">
          <Link to="/carrieres/succession"><Button variant="outline" size="sm"><Network size={14} /> Succession</Button></Link>
          <Link to="/carrieres/hauts-potentiels"><Button size="sm"><Sparkles size={14} /> Hauts potentiels</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Filières actives" value={String(k.filieresActives)} unit="catalogue" icon={Route} />
        <StatCard label="Postes clés" value={String(k.postesCleses)} unit="critiques" icon={Crown} />
        <StatCard label="Bench strength" value={`${k.benchStrengthPct} %`} unit="postes couverts" icon={Network} tone={k.benchStrengthPct < 60 ? 'amber' : 'default'} />
        <StatCard label="Succession coverage" value={`${k.successionCoveragePct} %`} unit="ready_now + 1-2y" icon={CheckCircle2} />
        <StatCard label="Hauts potentiels" value={String(k.hautsPotentielsCount)} unit="programmes actifs" icon={Sparkles} />
        <StatCard label="Mentorat actif" value={String(k.mentorshipActifs)} unit="pairings" icon={Users} />
        <StatCard label="Opportunités ouvertes" value={String(k.opportunitesOuvertes)} unit="internes" icon={Briefcase} />
        <StatCard label="Rétention top talents" value={`${k.retentionTopTalentsPct} %`} unit="12 mois" icon={Star} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card inset={false}>
          <div className="p-5 pb-2"><CardHeader title="Postes clés" subtitle={`${CRITICAL_ROLES.length} postes · cliquer pour succession`} className="mb-0" /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 text-left">Poste</th>
                <th className="px-3 py-2 text-left">Titulaire</th>
                <th className="px-3 py-2 text-center">Successeurs</th>
                <th className="px-3 py-2 text-center">Bench</th>
                <th className="px-3 py-2 text-right" />
              </tr></thead>
              <tbody className="divide-y divide-line">
                {CRITICAL_ROLES.map((r) => {
                  const holder = employeeById(r.currentHolderEmployeeId);
                  const bench = BENCH_STRENGTH_META[r.benchStrength];
                  return (
                    <tr key={r.id} className="hover:bg-amber/[0.03]">
                      <td className="px-4 py-2"><p className="text-[13px] font-semibold text-ink">{r.title}</p><p className="text-[10px] font-medium text-ink-500">{r.department} · criticité {r.criticality}</p></td>
                      <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar name={holder ? employeeName(holder) : '?'} size="xs" /><span className="text-[12px] font-medium text-ink-700">{holder ? employeeName(holder) : '—'}</span></div></td>
                      <td className="px-3 py-2 mono text-center text-[12px] font-bold">{r.successorsCount}</td>
                      <td className="px-3 py-2 text-center"><StatusPill tone={bench.tone} dot={false}>{bench.label}</StatusPill></td>
                      <td className="px-3 py-2 text-right"><Link to="/carrieres/succession"><Button variant="ghost" size="sm">Plan <ArrowUpRight size={12} /></Button></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-3">
          {weakRoles.length > 0 && (
            <Card className="border-warn/25">
              <CardHeader title="Postes critiques à risque" subtitle="Bench faible ou absent" action={<AlertTriangle size={16} className="text-warn" />} />
              <ul className="space-y-1">
                {weakRoles.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-lg bg-warn/[0.05] px-3 py-1.5">
                    <span className="text-[12px] font-semibold text-ink">{r.title}</span>
                    <StatusPill tone={BENCH_STRENGTH_META[r.benchStrength].tone} dot={false}>{BENCH_STRENGTH_META[r.benchStrength].label}</StatusPill>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card>
            <CardHeader title="Top hauts potentiels" subtitle="Programmes actifs" action={<Sparkles size={16} className="text-amber-deep" />} />
            <div className="space-y-1.5">
              {HIGH_POTS.slice(0, 5).map((h) => {
                const emp = employeeById(h.employeeId);
                if (!emp) return null;
                return (
                  <Link key={h.employeeId} to="/carrieres/hauts-potentiels" className="flex items-center gap-2 rounded-xl bg-surface2/40 px-3 py-2 hover:bg-amber/[0.06]">
                    <Avatar name={employeeName(emp)} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-ink">{employeeName(emp)}</p>
                      <p className="truncate text-[10px] font-medium text-ink-500">{HIGH_POT_PROGRAMS[h.program].label}</p>
                    </div>
                    <StatusPill tone={PROGRAM_TONES[h.program]} dot={false}>{h.status}</StatusPill>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── 2. FILIÈRES */
export function FilieresPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Filières métier</h1>
        <p className="text-sm font-medium text-ink-500">{FILIERES.length} filières · niveaux 1-7 · vertical / horizontal / expert</p>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {FILIERES.map((f) => {
          const meta = PATH_TYPE_META[f.type];
          return (
            <Card key={f.code}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="mono text-[11px] font-bold text-amber-deep">{f.code} · {f.department}</p>
                  <p className="mt-0.5 text-[15px] font-bold text-ink">{f.label}</p>
                  <p className="text-[11px] font-medium text-ink-500">{f.description}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-md bg-info/10 px-2 py-1 text-[10px] font-bold uppercase text-info">{meta.label}</span>
                  <p className="mono mt-1 text-[11px] font-bold text-amber-deep">{f.activeEmployeesCount} collab.</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-400">Niveaux (1 → 7)</p>
                <ol className="space-y-1">
                  {f.levels.map((l) => (
                    <li key={l.level} className="flex items-center gap-2 rounded-lg bg-surface2/40 px-3 py-1.5 text-[11px]">
                      <span className="mono w-5 shrink-0 text-center font-bold text-amber-deep">{l.level}</span>
                      <span className="flex-1 font-semibold text-ink">{l.title}</span>
                      <span className="text-[10px] font-medium text-ink-500">{l.scope} · ≥ {l.minYearsExperience} ans</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── 3. TRAJECTOIRES */
export function TrajectoiresPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Trajectoires individuelles</h1>
        <p className="text-sm font-medium text-ink-500">{TRAJECTORIES.length} trajectoires · niveau actuel · prochain step · readiness</p>
      </div>
      <Card inset={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Filière</th>
              <th className="px-3 py-2 text-center">Niveau</th>
              <th className="px-3 py-2 text-left">Prochain step</th>
              <th className="px-3 py-2 text-right">Readiness</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {TRAJECTORIES.map((t) => {
                const emp = employeeById(t.employeeId);
                const f = filiereByCode(t.filiereCode);
                if (!emp) return null;
                return (
                  <tr key={t.id}>
                    <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar name={employeeName(emp)} size="xs" /><div><p className="text-[13px] font-semibold text-ink">{employeeName(emp)}</p><p className="text-[10px] text-ink-500">{emp.role}</p></div></div></td>
                    <td className="px-3 py-2"><p className="text-[12px] font-semibold text-ink">{f?.label ?? t.filiereCode}</p><p className="text-[10px] text-ink-500">{f?.department}</p></td>
                    <td className="px-3 py-2 text-center"><span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">L{t.currentLevel}</span></td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{t.nextStepTarget ?? '—'}<p className="text-[10px] text-ink-400">{t.nextStepETA ?? ''}</p></td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-ink/[0.06]"><div className="h-full rounded-full bg-amber" style={{ width: `${t.readinessPct}%` }} /></div>
                        <span className="mono text-[10px] font-bold text-amber-deep">{t.readinessPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────── 4. POSTES CLÉS */
export function PostesClesPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Postes clés</h1>
        <p className="text-sm font-medium text-ink-500">{CRITICAL_ROLES.length} postes critiques identifiés · bench strength suivi</p>
      </div>
      <div className="space-y-3">
        {CRITICAL_ROLES.map((r) => {
          const holder = employeeById(r.currentHolderEmployeeId);
          const bench = BENCH_STRENGTH_META[r.benchStrength];
          return (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="mono text-[11px] font-bold text-amber-deep">{r.ref}</p>
                  <p className="mt-0.5 text-[15px] font-bold text-ink">{r.title}</p>
                  <p className="text-[11px] font-medium text-ink-500">{r.department} · criticité <b>{r.criticality}</b></p>
                </div>
                <div className="flex items-center gap-2">
                  {holder && <div className="flex items-center gap-2"><Avatar name={employeeName(holder)} size="xs" /><span className="text-[12px] font-semibold text-ink">{employeeName(holder)}</span></div>}
                  <StatusPill tone={bench.tone} dot>{bench.label}</StatusPill>
                </div>
              </div>
              <p className="mt-2 text-[11px] font-medium text-ink-500">{r.successorsCount} successeur(s) identifié(s) · {bench.hint}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── 5. SUCCESSION */
export function SuccessionPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Plans de succession</h1>
        <p className="text-sm font-medium text-ink-500">Postes clés × successeurs · readiness ready_now / 1-2 ans / 3-5 ans</p>
      </div>
      <div className="space-y-3">
        {CRITICAL_ROLES.map((r) => {
          const holder = employeeById(r.currentHolderEmployeeId);
          const succs = successorsOf(r.id);
          const bench = BENCH_STRENGTH_META[r.benchStrength];
          return (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[15px] font-bold text-ink">{r.title}</p>
                  <p className="text-[11px] font-medium text-ink-500">{r.department} · titulaire actuel {holder ? employeeName(holder) : '—'}</p>
                </div>
                <StatusPill tone={bench.tone} dot>{bench.label}</StatusPill>
              </div>
              {succs.length === 0 ? (
                <p className="mt-2 rounded-xl bg-danger/[0.06] px-3 py-3 text-center text-[12px] font-bold text-danger">⚠ Aucun successeur identifié · plan d'action urgent</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {succs.map((s) => {
                    const cand = employeeById(s.candidateEmployeeId);
                    const r2 = READINESS_META[s.readiness];
                    if (!cand) return null;
                    return (
                      <div key={s.id} className="rounded-xl border border-line bg-surface2/40 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><Avatar name={employeeName(cand)} size="sm" /><div>
                            <p className="text-[13px] font-bold text-ink">{employeeName(cand)}</p>
                            <p className="text-[10px] font-medium text-ink-500">{cand.role} · {cand.department}</p>
                          </div></div>
                          <StatusPill tone={r2.tone} dot>{r2.label}</StatusPill>
                        </div>
                        {s.developmentActions && (
                          <div className="mt-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">Plan de développement</p>
                            <ul className="mt-1 space-y-0.5">
                              {s.developmentActions.map((a, i) => <li key={i} className="text-[11px] font-medium text-ink-700">• {a}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── 6. HAUTS POTENTIELS */
export function HautsPotentielsPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Pool hauts potentiels</h1>
        <p className="text-sm font-medium text-ink-500">{HIGH_POTS.length} collaborateurs · 4 programmes · mentor associé</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(Object.keys(HIGH_POT_PROGRAMS) as Array<keyof typeof HIGH_POT_PROGRAMS>).map((p) => {
          const meta = HIGH_POT_PROGRAMS[p];
          const count = HIGH_POTS.filter((h) => h.program === p).length;
          return (
            <div key={p} className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-deep">{meta.label}</p>
              <p className="mono mt-0.5 text-2xl font-bold text-ink">{count}</p>
              <p className="text-[10px] font-medium text-ink-500">{meta.durationMonths} mois</p>
              <p className="mt-1 text-[10px] font-medium text-ink-400">{meta.targets}</p>
            </div>
          );
        })}
      </div>
      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Collaborateurs en programme" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Programme</th>
              <th className="px-3 py-2 text-left">Mentor</th>
              <th className="px-3 py-2 text-left">Échéance</th>
              <th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {HIGH_POTS.map((h) => {
                const emp = employeeById(h.employeeId);
                const mentor = h.mentorEmployeeId ? employeeById(h.mentorEmployeeId) : null;
                if (!emp) return null;
                const meta = HIGH_POT_PROGRAMS[h.program];
                return (
                  <tr key={h.employeeId}>
                    <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar name={employeeName(emp)} size="xs" /><div><p className="text-[12px] font-semibold text-ink">{employeeName(emp)}</p><p className="text-[10px] text-ink-500">{emp.role}</p></div></div></td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{meta.label}</td>
                    <td className="px-3 py-2 text-[11px]">{mentor ? employeeName(mentor) : '—'}</td>
                    <td className="px-3 py-2 mono text-[11px]">{h.graduationTarget}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={h.status === 'graduated' ? 'ok' : h.status === 'churned' ? 'danger' : h.status === 'in_progress' ? 'amber' : 'info'} dot={false}>{h.status}</StatusPill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────── 7. MENTORAT */
export function MentoratPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Mentorat</h1>
        <p className="text-sm font-medium text-ink-500">{MENTORSHIPS.length} pairings · senior accompagne junior/montant</p>
      </div>
      <div className="space-y-3">
        {MENTORSHIPS.map((m) => {
          const mentor = employeeById(m.mentorEmployeeId);
          const mentee = employeeById(m.menteeEmployeeId);
          if (!mentor || !mentee) return null;
          return (
            <Card key={m.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Avatar name={employeeName(mentor)} size="sm" />
                  <span className="text-ink-400">→</span>
                  <Avatar name={employeeName(mentee)} size="sm" />
                  <div>
                    <p className="text-[13px] font-bold text-ink">{employeeName(mentor)} <span className="text-[11px] font-medium text-ink-500">mentore</span> {employeeName(mentee)}</p>
                    <p className="text-[11px] font-medium text-ink-500">{mentor.role} → {mentee.role} · Focus : <b>{m.focus}</b> · cadence {m.cadence}</p>
                  </div>
                </div>
                <StatusPill tone={m.status === 'active' ? 'ok' : m.status === 'completed' ? 'neutral' : 'amber'} dot={m.status === 'active'}>{m.status}</StatusPill>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── 8. CARTOGRAPHIE */
export function CartographiePage() {
  const roster = useRoster();
  const [empF, setEmpF] = useState<'all' | string>('all');
  const list = useMemo(() => SKILLS_MAPPING.filter((s) => empF === 'all' || s.employeeId === empF), [empF]);
  const total = list.length;
  const certified = list.filter((s) => s.certified).length;
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Cartographie compétences</h1>
        <p className="text-sm font-medium text-ink-500">{SKILLS_MAPPING.length} entrées · tech · leadership · business · soft · niveau 1-5 · certifications</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Entrées" value={String(total)} unit="compétences mappées" icon={Map} />
        <StatCard label="Certifiées" value={`${Math.round((certified/Math.max(1,total))*100)} %`} unit={`${certified}/${total}`} icon={CheckCircle2} />
        <StatCard label="Catégories" value="4" unit="tech/lead/business/soft" icon={Map} />
        <StatCard label="Collaborateurs" value={String(roster.length)} unit="dans la cartographie" icon={Users} />
      </div>
      <Card inset={false}>
        <div className="flex items-center justify-between p-4 pb-2">
          <select value={empF} onChange={(e) => setEmpF(e.target.value)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
            <option value="all">Tous collaborateurs</option>
            {roster.map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}
          </select>
          <span className="text-[11px] font-semibold text-ink-400">{list.length} entrées</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Collaborateur</th>
              <th className="px-3 py-2 text-left">Compétence</th>
              <th className="px-3 py-2 text-left">Catégorie</th>
              <th className="px-3 py-2 text-center">Niveau</th>
              <th className="px-3 py-2 text-center">Certifié</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {list.slice(0, 60).map((s, i) => {
                const emp = employeeById(s.employeeId)!;
                return (
                  <tr key={i}>
                    <td className="px-4 py-2 text-[12px] font-semibold text-ink">{employeeName(emp)}</td>
                    <td className="px-3 py-2 text-[12px] font-medium text-ink-700">{s.skillLabel}</td>
                    <td className="px-3 py-2"><span className="rounded-md bg-amber/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-deep">{s.category}</span></td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-0.5">
                        {[1,2,3,4,5].map((n) => <span key={n} className={cn('h-2 w-3 rounded-sm', n <= s.level ? 'bg-amber' : 'bg-ink/[0.08]')} />)}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">{s.certified ? <CheckCircle2 size={14} className="inline text-ok" /> : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────── 9. MOBILITÉ INTERNE */
export function MobiliteCarrieresPage() {
  const { toast } = useToast();
  const open = OPPORTUNITIES.filter((o) => o.status === 'open');
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Mobilité interne</h1>
          <p className="text-sm font-medium text-ink-500">{OPPORTUNITIES.length} opportunités · promotions / mobilités / missions / détachements</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Opportunité', description: 'Publier nouvelle opportunité' })}><ArrowLeftRight size={14} /> Publier opportunité</Button>
      </div>
      <div className="space-y-3">
        {OPPORTUNITIES.map((o) => (
          <Card key={o.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="mono text-[11px] font-bold text-amber-deep">{o.ref}</p>
                <p className="mt-0.5 text-[14px] font-bold text-ink">{o.title}</p>
                <p className="text-[11px] font-medium text-ink-500">{o.department} · type <b>{o.type}</b> · clôture {o.closingDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">{o.applicationsCount} cand.</span>
                <StatusPill tone={o.status === 'open' ? 'ok' : o.status === 'filled' ? 'amber' : 'neutral'} dot={o.status === 'open'}>{o.status}</StatusPill>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-[11px] font-medium text-ink-400">{open.length} opportunités ouvertes · les acceptations déclenchent un avenant M4 · cascade automatique vers M6 onboarding mobilité interne.</p>
    </div>
  );
}

/* ─────────────────────────────────────── 10. REPORTING */
export function ReportingCarrieresPage() {
  const { toast } = useToast();
  const k = kpis();
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Reporting Carrières</h1>
          <p className="text-sm font-medium text-ink-500">Bench strength · succession coverage · rétention · promotions / mobilités</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Export', description: 'Rapport Talent Review généré' })}><Download size={14} /> Talent Review</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Bench strength" value={`${k.benchStrengthPct} %`} unit="postes couverts" icon={Network} />
        <StatCard label="Succession coverage" value={`${k.successionCoveragePct} %`} unit="ready_now + 1-2y" icon={CheckCircle2} />
        <StatCard label="Promotions 12 m" value={String(k.promotionsLast12m)} unit="effectuées" icon={TrendingUp} />
        <StatCard label="Mobilités 12 m" value={String(k.mobilitesLast12m)} unit="internes" icon={ArrowLeftRight} />
      </div>
      <Card>
        <CardHeader title="Bench strength par poste clé" subtitle="Distribution actuelle" action={<BarChart3 size={16} className="text-amber-deep" />} />
        <div className="space-y-1.5">
          {(['strong','adequate','weak','none'] as const).map((s) => {
            const count = CRITICAL_ROLES.filter((r) => r.benchStrength === s).length;
            const pct = Math.round((count / CRITICAL_ROLES.length) * 100);
            const meta = BENCH_STRENGTH_META[s];
            return (
              <div key={s} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[11px] font-bold uppercase tracking-wider text-ink-500">{meta.label}</span>
                <div className="flex-1 h-6 overflow-hidden rounded-md bg-surface2"><div className={`h-full rounded-md ${meta.tone === 'ok' ? 'bg-ok' : meta.tone === 'info' ? 'bg-info' : meta.tone === 'amber' ? 'bg-amber' : 'bg-danger'}`} style={{ width: `${Math.max(5, pct)}%` }} /></div>
                <span className="mono w-10 shrink-0 text-right text-[11px] font-bold text-amber-deep">{count}</span>
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <CardHeader title="Benchmarks rétention" subtitle="Cibles par bucket 9-box" />
        <ul className="space-y-1">
          {RETENTION_BENCHMARKS.map((b) => (
            <li key={b.bucket} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5 text-[12px]">
              <span className="font-medium text-ink-700">{b.bucket}</span>
              <span className="mono rounded-md bg-amber/12 px-1.5 py-0.5 text-[11px] font-bold text-amber-deep">{b.target}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────── 11. PARAMÈTRES */
export function ParametresCarrieresPage() {
  const { toast } = useToast();
  return (
    <div className="animate-fade-up space-y-5">
      <CarrieresSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Paramètres Carrières</h1>
        <p className="text-sm font-medium text-ink-500">Filières · niveaux 1-7 · programmes hauts potentiels · actions de développement</p>
      </div>
      <Card>
        <CardHeader title="Niveaux de carrière" subtitle="Échelle commune 1-7" />
        <table className="w-full text-sm">
          <thead><tr className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
            <th className="py-1 text-left">Niveau</th>
            <th className="py-1 text-left">Titre par défaut</th>
            <th className="py-1 text-left">Scope</th>
            <th className="py-1 text-right">Min expérience</th>
          </tr></thead>
          <tbody className="divide-y divide-line">
            {CAREER_LEVELS.map((l) => (
              <tr key={l.level}>
                <td className="py-1.5 mono text-[11px] font-bold text-amber-deep">L{l.level}</td>
                <td className="py-1.5 text-[12px] font-semibold text-ink">{l.title}</td>
                <td className="py-1.5 text-[11px] text-ink-700">{l.scope}</td>
                <td className="py-1.5 mono text-right text-[11px] text-ink-700">{l.minYears} ans</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <CardHeader title="Programmes hauts potentiels" />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {(Object.keys(HIGH_POT_PROGRAMS) as Array<keyof typeof HIGH_POT_PROGRAMS>).map((p) => {
            const meta = HIGH_POT_PROGRAMS[p];
            return (
              <div key={p} className="rounded-xl border border-line bg-surface2/40 p-3">
                <p className="text-[13px] font-bold text-ink">{meta.label} <span className="ml-2 text-[10px] font-medium text-ink-500">{meta.durationMonths} mois</span></p>
                <p className="mt-1 text-[11px] font-medium text-ink-500">{meta.targets}</p>
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <CardHeader title="Actions de développement standard" />
        <div className="flex flex-wrap gap-1.5">
          {CAREER_ACTIONS.map((a) => <span key={a} className="rounded-md bg-amber/12 px-2 py-1 text-[11px] font-semibold text-amber-deep">{a}</span>)}
        </div>
      </Card>
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Sauvegardé', description: 'Paramètres M10 enregistrés' })}><Settings size={14} /> Enregistrer</Button>
      </div>
    </div>
  );
}
