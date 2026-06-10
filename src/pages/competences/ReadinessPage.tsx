import { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Target, ShieldAlert, Clock } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { CompetencesSubNav } from '../../components/competences/CompetencesSubNav';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';
import { COMP_ECHELLE, COMP_TODAY, COMP_READINESS, computeAllReadiness, computeReadiness } from '../../lib/comp/mock';
import type { Readiness } from '../../engine/competences';

const VERDICT_META: Record<Readiness, { label: string; tone: 'ok' | 'amber' | 'danger'; icon: typeof CheckCircle2 }> = {
  pret: { label: 'Prêt', tone: 'ok', icon: CheckCircle2 },
  pret_sous_conditions: { label: 'Prêt sous conditions', tone: 'amber', icon: AlertTriangle },
  pas_pret: { label: 'Pas prêt', tone: 'danger', icon: XCircle },
};

const STATUT_TONE = { acquis: 'ok', en_cours: 'amber', perime: 'danger' } as const;

export function ReadinessPage() {
  const [employeId, setEmployeId] = useState('e5');
  const all = useMemo(() => computeAllReadiness(), []);
  const selected = useMemo(
    () => computeReadiness(COMP_READINESS.find((e) => e.employeId === employeId) ?? COMP_READINESS[0]),
    [employeId],
  );
  const emp = employeeById(selected.employeId);
  const verdict = VERDICT_META[selected.readiness.verdict];

  const counts = all.reduce(
    (acc, r) => ({ ...acc, [r.readiness.verdict]: (acc[r.readiness.verdict] ?? 0) + 1 }),
    {} as Record<Readiness, number>,
  );

  return (
    <div className="animate-fade-up space-y-5">
      <CompetencesSubNav />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Readiness — accès au poste suivant</h1>
          <p className="text-sm font-medium text-ink-500">
            Triangulation employé / manager / RH → niveau retenu (R4) · écart vs poste cible · au {COMP_TODAY}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Collaborateurs suivis" value={String(all.length)} unit="trajectoires" icon={Target} />
        <StatCard label="Prêts" value={String(counts.pret ?? 0)} unit="accès direct" icon={CheckCircle2} tone="default" />
        <StatCard label="Sous conditions" value={String(counts.pret_sous_conditions ?? 0)} unit="écarts à combler" icon={AlertTriangle} tone="amber" />
        <StatCard label="Pas prêts" value={String(counts.pas_pret ?? 0)} unit="écart bloquant" icon={XCircle} tone={counts.pas_pret ? 'amber' : 'default'} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Collaborateur :</span>
        {COMP_READINESS.map((e) => {
          const m = employeeById(e.employeId);
          return (
            <button key={e.employeId} onClick={() => setEmployeId(e.employeId)}
              className={cn('rounded-lg px-3 py-1 text-[12px] font-semibold', employeId === e.employeId ? 'bg-amber text-white' : 'border border-line bg-surface2/40 text-ink-500')}>
              {m ? employeeName(m) : e.employeId}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Compétences : attendu vs retenu */}
        <Card>
          <CardHeader
            title={`${emp ? employeeName(emp) : selected.employeId} · ${selected.posteActuel} → ${selected.posteCible}`}
            subtitle="Niveau attendu (poste cible) vs niveau retenu (validé manager)"
          />
          <div className="space-y-2.5">
            {selected.evaluees.map(({ mock, evaluee }) => {
              const ecart = selected.ecartsByCompetence.get(mock.competenceId) ?? 0;
              const pctAttendu = (mock.niveauAttendu / COMP_ECHELLE.max) * 100;
              const pctRetenu = evaluee.pctMaitrise;
              return (
                <div key={mock.competenceId} className="rounded-xl border border-line bg-surface2/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-ink">{mock.libelle}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-ink-400">
                        criticité {mock.criticite}{mock.bloquante ? ' · bloquante' : ''} · attendu niv. {mock.niveauAttendu}/{COMP_ECHELLE.max}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusPill tone={STATUT_TONE[evaluee.statut]} dot={false}>{evaluee.statut}</StatusPill>
                      {ecart > 0 && <StatusPill tone={mock.bloquante ? 'danger' : 'amber'} dot={false}>écart {ecart}</StatusPill>}
                    </div>
                  </div>
                  {/* barre : retenu (plein) vs attendu (repère) */}
                  <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-ink/[0.06]">
                    <div className={cn('h-full rounded-full', ecart > 0 ? 'bg-amber' : 'bg-ok')} style={{ width: `${pctRetenu}%` }} />
                    <div className="absolute top-0 h-full w-0.5 bg-ink/60" style={{ left: `calc(${pctAttendu}% - 1px)` }} title={`attendu ${mock.niveauAttendu}`} />
                  </div>
                  <p className="mt-1.5 text-[10px] font-medium text-ink-400">
                    retenu niv. {evaluee.niveauRetenu}/{COMP_ECHELLE.max}
                    {evaluee.statut === 'perime' && ' · compétence périmée → comptée 0 (§5.5)'}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Verdict + conditions */}
        <div className="space-y-3">
          <Card className={cn(verdict.tone === 'danger' && 'border-danger/30', verdict.tone === 'amber' && 'border-warn/25')}>
            <CardHeader title="Verdict d'accès" subtitle="§5.4 — couverture pondérée par criticité" action={<verdict.icon size={18} className={cn(verdict.tone === 'ok' ? 'text-ok' : verdict.tone === 'amber' ? 'text-amber-deep' : 'text-danger')} />} />
            <div className="flex items-center gap-3">
              <StatusPill tone={verdict.tone} dot>{verdict.label}</StatusPill>
              <span className="mono text-2xl font-bold text-ink">{Math.round(selected.readiness.scoreCouverture)} %</span>
              <span className="text-[11px] font-medium text-ink-400">couverture</span>
            </div>
          </Card>

          <Card className={selected.readiness.conditions.length ? 'border-warn/25' : undefined}>
            <CardHeader title="Conditions restantes" subtitle={`${selected.readiness.conditions.length} écart(s) à combler`} action={<ShieldAlert size={16} className="text-warn" />} />
            <div className="space-y-1.5">
              {selected.readiness.conditions.length === 0 && <p className="text-[12px] font-medium text-ink-400">Aucune — accès direct. 🎯</p>}
              {selected.readiness.conditions.map((c) => (
                <div key={c.competenceId} className="rounded-lg bg-surface2/40 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12px] font-semibold text-ink">{c.libelle ?? c.competenceId}</p>
                    <StatusPill tone={c.bloquant ? 'danger' : 'amber'} dot={false}>
                      {c.bloquant ? 'bloquant' : 'à combler'} +{c.ecart}
                    </StatusPill>
                  </div>
                  <p className="mt-0.5 text-[10px] font-medium text-ink-500">attendu {c.niveauAttendu} · retenu {c.niveauRetenu} · alimente le PDC (M11)</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <p className="text-[11px] font-medium text-ink-400">
        <Clock size={11} className="mr-1 inline" />
        Moteur Compétences M9 · triangulation R4 · péremption §5.5 · verdict figé + chaîné SHA-256 (R7) · calcul déterministe (src/engine/competences).
      </p>
    </div>
  );
}
