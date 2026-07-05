import { useEffect, useMemo, useState } from 'react';
import { Users, Star, ShieldAlert, Zap, ClipboardCheck, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Modal } from '../../components/ui/overlays';
import { EmptyState } from '../../components/ui/feedback';
import { useToast } from '../../components/ui/Toast';
import { RecruitmentSubNav } from '../../components/mss/RecruitmentSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeamIds, MANAGER_ID } from '../../lib/mss/scope';
import { candidatePipeline, STAGE_META, CANDIDATE_DECISIONS, type Stage } from '../../lib/mss/recruit';
import { isBackendConfigured, useTeamApplications } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';
import { mockEmpId } from '../../lib/m1/roster';

const STAGES: Stage[] = ['preselected', 'tomeet', 'met', 'decision'];
const frDateT = (d: string) => new Date(d).toLocaleDateString('fr-FR');

export function TeamCandidatesPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const pipe = candidatePipeline();

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const { data: ctx } = useSessionContext();
  const { data: liveApps } = useTeamApplications(ctx?.tenantId ?? undefined);
  const hasLive = isBackendConfigured && !!liveApps && liveApps.length > 0;

  const teamIds = useMemo(() => scopedTeamIds(depth, employees), [depth, employees]);
  const scopedApps = useMemo(() => {
    if (!hasLive) return [];
    const inScope = (hmId: string | undefined) => {
      if (!hmId) return false;
      const eid = mockEmpId(hmId);
      return teamIds.has(eid) || eid === MANAGER_ID;
    };
    const mine = liveApps!.filter((a) => inScope(a.job_hiring_manager_id));
    return mine.length > 0 ? mine : liveApps!;
  }, [hasLive, liveApps, teamIds]);
  const focus = pipe.candidates.find((c) => c.awaitingDecision);
  const [decideOpen, setDecideOpen] = useState(false);
  const [decision, setDecision] = useState(CANDIDATE_DECISIONS[0].key);
  const [comment, setComment] = useState('');

  const statuer = () => {
    if (decision === 'reject' && comment.trim().length < 20) return;
    setDecideOpen(false);
    const v = decision === 'hire' ? 'success' : decision === 'reject' ? 'warning' : 'info';
    const t = decision === 'hire' ? 'Recrutement recommandé' : decision === 'reject' ? 'Candidat écarté' : 'Second entretien demandé';
    const d = decision === 'hire' ? 'Transmis à la RH pour proposition d’embauche (négociation salariale = RH).'
      : decision === 'reject' ? 'Motif transmis à la RH. Aucune communication directe au candidat.'
      : 'La RH organisera un nouvel entretien.';
    toast({ variant: v as 'success' | 'warning' | 'info', title: t, description: `${d} — consultation tracée (audit fort).` });
    setComment('');
  };

  return (
    <div className="animate-fade-up space-y-5">
      <RecruitmentSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">{hasLive ? 'Mes candidats' : `Mes candidats — ${pipe.position}`}</h1>
        {hasLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>
        )}
      </div>

      {hasLive ? (
        <Card>
          <CardHeader title="Candidats en pipeline" action={<Users size={16} className="text-ink-400" />} />
          {scopedApps.length === 0 ? (
            <EmptyState icon={Users} title="Aucun candidat" description="Aucune candidature dans le pipeline." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                    <th className="py-2 pr-3 font-bold">Candidat</th>
                    <th className="py-2 pr-3 font-bold">Poste</th>
                    <th className="py-2 pr-3 font-bold">Étape</th>
                    <th className="py-2 pr-3 font-bold">Score</th>
                    <th className="py-2 font-bold">Candidature</th>
                  </tr>
                </thead>
                <tbody>
                  {scopedApps.map((a) => {
                    const name = `${a.candidate_first_name ?? ''} ${a.candidate_last_name ?? ''}`.trim() || '—';
                    return (
                      <tr key={a.id} className="border-t border-line">
                        <td className="py-2.5 pr-3">
                          <p className="font-semibold text-ink">{name}</p>
                          {a.candidate_role && <p className="text-[11px] font-medium text-ink-400">{a.candidate_role}</p>}
                        </td>
                        <td className="py-2.5 pr-3 text-[12px] font-medium text-ink-600">{a.job_title ?? '—'}</td>
                        <td className="py-2.5 pr-3"><StatusPill tone="info" dot={false}>{a.stage}</StatusPill></td>
                        <td className="py-2.5 pr-3">
                          {a.score != null ? <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber-deep"><Star size={12} /> {a.score}</span> : <span className="text-[12px] text-ink-300">—</span>}
                        </td>
                        <td className="py-2.5 text-[12px] font-medium text-ink-500">{a.applied_at ? frDateT(a.applied_at) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (<>
      <Card>
        <CardHeader title="Pipeline du recrutement" action={<Users size={16} className="text-ink-400" />} />
        <div className="grid gap-3 sm:grid-cols-4">
          {STAGES.map((st) => {
            const list = pipe.candidates.filter((c) => c.stage === st);
            return (
              <div key={st} className="rounded-xl bg-surface2 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{STAGE_META[st].label} ({list.length})</p>
                <div className="mt-2 space-y-1.5">
                  {list.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg bg-surface px-2.5 py-1.5 text-[12px] font-semibold text-ink">
                      {c.alias}
                      {c.awaitingDecision && <Zap size={12} className="text-amber-deep" />}
                    </div>
                  ))}
                  {list.length === 0 && <p className="text-[11px] font-medium text-ink-300">—</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {focus && (
        <Card className="border-amber/25">
          <CardHeader title={`Focus ${focus.alias} (en attente de ma décision)`} action={<StatusPill tone="amber" dot={false}>Décision finale</StatusPill>} />
          <div className="space-y-2 text-[13px] font-medium text-ink-700">
            <p>• Profil anonymisé selon la politique de sourcing (nom visible uniquement si la RH l’a partagé).</p>
            <p>• Expérience : {focus.experience} ans · Compétences clés validées par la RH.</p>
            <p className="flex items-center gap-1.5">• Rencontre du 22/05 : score d’entretien <Star size={13} className="text-amber-deep" /> {focus.interviewScore}/5.</p>
            <p>• Évaluation RH : {focus.hrNote}.</p>
            <p className="flex items-center gap-1.5 text-amber-deep">• Évaluation managériale (mon entretien) : <Zap size={12} /> à compléter.</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Évaluation managériale', description: 'Grille structurée : compétences, adéquation culture/poste/équipe, points forts/vigilance.' })}><ClipboardCheck size={14} /> Compléter mon évaluation</Button>
            <Button size="sm" onClick={() => setDecideOpen(true)}>Statuer</Button>
          </div>
        </Card>
      )}

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Les données candidat restent sous responsabilité RH. Vous voyez uniquement ce que la RH a partagé. Aucun accès aux données salariales (négociation = RH). Pas de communication directe candidat. Toute consultation de profil est tracée (audit fort).</p>
      </Card>
      </>)}

      <Modal open={decideOpen} onClose={() => setDecideOpen(false)} title={`Décision finale — ${focus?.alias ?? ''}`}
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setDecideOpen(false)}>Annuler</Button>
          <Button size="sm" onClick={statuer} disabled={decision === 'reject' && comment.trim().length < 20}>Statuer</Button>
        </>}>
        <div className="space-y-3">
          {CANDIDATE_DECISIONS.map((d) => (
            <label key={d.key} className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
              <input type="radio" name="cdec" checked={decision === d.key} onChange={() => setDecision(d.key)} className="accent-info" /> {d.label}
            </label>
          ))}
          <label className="block">
            <span className="text-[12px] font-semibold text-ink-500">Commentaire {decision === 'reject' && '(motif obligatoire, min. 20 caractères)'}</span>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" placeholder="Votre appréciation…" />
            {decision === 'reject' && <span className={`mt-1 block text-[11px] font-medium ${comment.trim().length < 20 ? 'text-danger' : 'text-ok'}`}>{comment.trim().length}/20</span>}
          </label>
        </div>
      </Modal>
    </div>
  );
}
