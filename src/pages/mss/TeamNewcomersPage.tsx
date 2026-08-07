import { useEffect, useMemo, useState } from 'react';
import { UserCheck, Check, Play, Circle, Zap, Target, AlertTriangle, ShieldAlert, Wifi } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/overlays';
import { EmptyState } from '../../components/ui/feedback';
import { useToast } from '../../components/ui/Toast';
import { RecruitmentSubNav } from '../../components/mss/RecruitmentSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { newcomers, PROBATION_AXES, PROBATION_DECISIONS, frDate, daysUntil, type Newcomer } from '../../lib/mss/recruit';
import { employeeName } from '../../data/mock';
import { isBackendConfigured, useTeamDirectory, dirName } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const TODAY = new Date().toISOString().slice(0, 10);
const monthsBetween = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24 * 30.4);

export function TeamNewcomersPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const mockTeam = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const mockNews = newcomers(mockTeam);

  const { data: ctx } = useSessionContext();
  const { data: liveDir } = useTeamDirectory(ctx?.tenantId);
  const hasLive = isBackendConfigured && Boolean(ctx?.tenantId);

  const liveNews = useMemo(() => (liveDir ?? []).filter(d =>
    d.status === 'onboarding' || (d.hire_date && monthsBetween(d.hire_date, TODAY) <= 3)
  ), [liveDir]);

  const [probation, setProbation] = useState<Newcomer | null>(null);
  const [decision, setDecision] = useState(PROBATION_DECISIONS[0].key);
  const [synthese, setSynthese] = useState('');

  const submitProbation = () => {
    if (decision === 'break' && synthese.trim().length < 20) return;
    const name = probation ? employeeName(probation.emp) : '';
    setProbation(null);
    toast({ variant: 'info', title: 'Recommandation transmise à la RH/DRH', description: `${name} — la RH prend la décision formelle et envoie le courrier officiel.` });
    setSynthese('');
  };

  return (
    <div className="animate-fade-up space-y-5">
      <RecruitmentSubNav />
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-ink">Mes nouveaux entrants</h1>
        {hasLive && <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>}
      </div>

      {hasLive ? (
        liveNews.length === 0 ? (
          <Card><EmptyState icon={UserCheck} title="Aucun nouvel entrant" description="Aucune intégration en cours dans votre périmètre." /></Card>
        ) : liveNews.map((d) => {
          const jPlus = d.hire_date ? Math.floor((new Date(TODAY).getTime() - new Date(d.hire_date).getTime()) / 86400000) : 0;
          return (
            <Card key={d.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={dirName(d)} size="md" />
                  <div>
                    <p className="text-sm font-bold text-ink">{dirName(d)}{d.hire_date ? ` — entrée le ${frDate(d.hire_date)} (J+${jPlus})` : ''}</p>
                    <p className="text-[12px] font-medium text-ink-500">{d.role_title ?? '—'} · {d.site ?? '—'}</p>
                  </div>
                </div>
                <StatusPill tone="info" dot={false}>Intégration</StatusPill>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: '1:1 programmé', description: `Premier 1:1 avec ${dirName(d)} planifié.` })}><Play size={13} /> Programmer 1er 1:1</Button>
                <Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Objectifs', description: 'Définition des premiers objectifs (semaine 2-4).' })}><Target size={13} /> Définir ses premiers objectifs</Button>
              </div>
            </Card>
          );
        })
      ) : (
        mockNews.length === 0 ? (
          <Card><EmptyState icon={UserCheck} title="Aucun nouvel entrant" description="Aucune intégration en cours dans votre périmètre." /></Card>
        ) : mockNews.map((n) => {
          const probaIn = daysUntil(n.probationEnd);
          return (
            <Card key={n.emp.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={employeeName(n.emp)} size="md" />
                  <div>
                    <p className="text-sm font-bold text-ink">{employeeName(n.emp)} — entrée le {frDate(n.entryDate)} (J+{n.jPlus})</p>
                    <p className="text-[12px] font-medium text-ink-500">{n.role} · {n.site}</p>
                    <p className="text-[11px] font-medium text-ink-400">Période d'essai jusqu'au {frDate(n.probationEnd)}</p>
                  </div>
                </div>
                <StatusPill tone={n.progress >= 80 ? 'ok' : 'info'} dot={false}>Onboarding {n.progress}%</StatusPill>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface2"><div className="h-full rounded-full bg-info" style={{ width: `${n.progress}%` }} /></div>
              <ul className="mt-3 space-y-1.5">
                {n.steps.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px] font-medium text-ink-700">
                    {s.done ? <Check size={14} className="text-ok" /> : s.action ? <Zap size={14} className="text-amber-deep" /> : <Circle size={13} className="text-ink-300" />}
                    <span className={s.done ? 'text-ink-500' : ''}>{s.label}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-300">({s.owner})</span>
                    {s.action && <StatusPill tone="amber" dot={false}>à faire</StatusPill>}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: '1:1 programmé', description: `Premier 1:1 avec ${employeeName(n.emp)} planifié.` })}><Play size={13} /> Programmer 1er 1:1</Button>
                <Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Objectifs', description: 'Définition des premiers objectifs (semaine 2-4).' })}><Target size={13} /> Définir ses premiers objectifs</Button>
              </div>
              {probaIn <= 14 && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-warn/[0.08] px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-warn"><AlertTriangle size={13} /> Décision fin de période d'essai avant le {frDate(n.probationEnd)} (J-{probaIn}).</p>
                  <Button size="sm" onClick={() => { setProbation(n); setDecision(PROBATION_DECISIONS[0].key); }}>Statuer</Button>
                </div>
              )}
            </Card>
          );
        })
      )}

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Votre recommandation de fin de période d'essai est transmise à la RH/DRH pour décision formelle. Vous ne prononcez pas la décision.</p>
      </Card>

      <Modal open={probation !== null} onClose={() => setProbation(null)} title={`Fin de période d'essai — ${probation ? employeeName(probation.emp) : ''}`} size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setProbation(null)}>Annuler</Button>
          <Button size="sm" onClick={submitProbation} disabled={decision === 'break' && synthese.trim().length < 20}>Soumettre à la RH</Button>
        </>}>
        <div className="space-y-4">
          <label className="block">
            <span className="text-[12px] font-semibold text-ink-500">Synthèse de la période d'essai</span>
            <textarea value={synthese} onChange={(e) => setSynthese(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" placeholder="Bilan global…" />
          </label>
          <div>
            <span className="text-[12px] font-semibold text-ink-500">Évaluation par axes</span>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
              {PROBATION_AXES.map((a) => (
                <div key={a} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2 text-[12px] font-medium text-ink-700">{a}<select className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px]"><option>3/5</option><option>4/5</option><option>5/5</option><option>2/5</option></select></div>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[12px] font-semibold text-ink-500">Ma recommandation</span>
            <div className="mt-1.5 space-y-1.5">
              {PROBATION_DECISIONS.map((d) => (
                <label key={d.key} className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
                  <input type="radio" name="proba" checked={decision === d.key} onChange={() => setDecision(d.key)} className="accent-info" /> {d.label}
                </label>
              ))}
            </div>
            {decision === 'break' && <span className={`mt-1 block text-[11px] font-medium ${synthese.trim().length < 20 ? 'text-danger' : 'text-ok'}`}>Motif obligatoire dans la synthèse : {synthese.trim().length}/20</span>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
