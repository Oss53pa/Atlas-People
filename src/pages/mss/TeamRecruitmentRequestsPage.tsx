import { useEffect, useMemo, useState } from 'react';
import { Plus, FileText, Zap, MessageSquare, Sparkles, ShieldCheck, Briefcase, Users, CalendarClock, Wifi } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/overlays';
import { EmptyState } from '../../components/ui/feedback';
import { useToast } from '../../components/ui/Toast';
import { RecruitmentSubNav } from '../../components/mss/RecruitmentSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeamIds } from '../../lib/mss/scope';
import { recruitmentRequests, REQUEST_STATUS_META, REQUEST_TYPES, REQUEST_URGENCY, frDate, daysSince } from '../../lib/mss/recruit';
import { isBackendConfigured, useTeamJobs } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';
import { mockEmpId } from '../../lib/m1/roster';

const frDateT = (d: string) => new Date(d).toLocaleDateString('fr-FR');
const JOB_STATUS_TONE: Record<string, 'ok' | 'amber' | 'info' | 'neutral'> = { open: 'info', sourcing: 'info', filled: 'ok', closed: 'neutral', on_hold: 'amber' };

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'instruction', label: 'En instruction' },
  { key: 'sourcing', label: 'En sourcing' },
  { key: 'filled', label: 'Pourvues' },
];

export function TeamRecruitmentRequestsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const reqs = recruitmentRequests();

  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const { data: ctx } = useSessionContext();
  const { data: liveJobs } = useTeamJobs(ctx?.tenantId ?? undefined);
  const hasLive = isBackendConfigured && !!liveJobs && liveJobs.length > 0;

  const teamIds = useMemo(() => scopedTeamIds(depth, employees), [depth, employees]);
  const scopedJobs = useMemo(() => {
    if (!hasLive) return [];
    const inScope = (hmId: string | null) => {
      if (!hmId) return false;
      const eid = mockEmpId(hmId);
      return teamIds.has(eid) || eid === (ctx?.employeeId ?? 'e1');
    };
    const mine = liveJobs!.filter((j) => inScope(j.hiring_manager_id));
    return mine.length > 0 ? mine : liveJobs!;
  }, [hasLive, liveJobs, teamIds]);

  const [tab, setTab] = useState('all');
  const [wizard, setWizard] = useState(false);
  const [type, setType] = useState(REQUEST_TYPES[0].key);
  const [urgency, setUrgency] = useState(REQUEST_URGENCY[0].key);
  const [title, setTitle] = useState('');

  const shown = reqs.filter((r) => tab === 'all' ? true
    : tab === 'sourcing' ? (r.status === 'sourcing' || r.status === 'validated') : r.status === tab);

  const submit = () => {
    setWizard(false);
    toast({ variant: 'success', title: 'Demande transmise à la RH', description: `${title || 'Nouveau besoin'} — la RH instruit et lance le sourcing. Vous serez notifié(e).` });
    setTitle('');
  };

  return (
    <div className="animate-fade-up space-y-5">
      <RecruitmentSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Mes demandes de recrutement</h1>
        <div className="flex items-center gap-2">
          {hasLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>
          )}
          <Button size="sm" onClick={() => setWizard(true)}><Plus size={14} /> Nouvelle demande</Button>
        </div>
      </div>
      {!hasLive && <Tabs tabs={TABS} value={tab} onChange={setTab} />}

      {hasLive ? (
        <div className="space-y-3">
          {scopedJobs.map((j) => (
            <Card key={j.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink"><Briefcase size={15} className="text-ink-400" /> {j.ref} — {j.title}</p>
                  {j.department && <p className="mt-1 text-[12px] font-medium text-ink-500">Département : {j.department}</p>}
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-medium text-ink-400">
                    <span className="inline-flex items-center gap-1"><Users size={12} /> {j.applications_count ?? 0} candidature(s)</span>
                    {j.opened_at && <span>Ouvert le {frDateT(j.opened_at)}</span>}
                    {j.target_close_at && <span className="inline-flex items-center gap-1"><CalendarClock size={12} /> Clôture {frDate(j.target_close_at)}</span>}
                  </div>
                </div>
                <StatusPill tone={JOB_STATUS_TONE[j.status] ?? 'neutral'} dot={false}>{j.status}</StatusPill>
              </div>
            </Card>
          ))}
          {scopedJobs.length === 0 && <Card><EmptyState icon={Briefcase} title="Aucun poste ouvert" description="Aucune demande de recrutement en cours." /></Card>}
        </div>
      ) : (
      <div className="space-y-3">
        {shown.map((r) => {
          const meta = REQUEST_STATUS_META[r.status];
          return (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink"><FileText size={15} className="text-ink-400" /> {r.ref} — {r.title}</p>
                  <p className="mt-1 text-[12px] font-medium text-ink-500">Type : {r.type} · Site : {r.site}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-ink-400">Soumise : {frDate(r.submittedAt)} · Référent RH : {r.referent} · {r.status === 'instruction' ? `En instruction (J+${daysSince(r.submittedAt)})` : ''}</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-400"><MessageSquare size={12} /> {r.messages} message(s) avec la RH</p>
                  {r.filledBy && <p className="mt-1 text-[12px] font-semibold text-ok">Pourvue par {r.filledBy}</p>}
                </div>
                <StatusPill tone={meta.tone} dot={false}>{meta.label}</StatusPill>
              </div>
              {r.actionRequired && (
                <p className="mt-2 flex items-center gap-1.5 rounded-xl bg-amber/[0.08] px-3 py-2 text-[12px] font-semibold text-amber-deep"><Zap size={13} /> Action requise : {r.actionRequired}</p>
              )}
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Détail de la demande', description: `${r.ref} — conversation et historique des statuts.` })}>Voir détail</Button>
                {r.actionRequired && <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Réponse transmise', description: 'Vos précisions ont été envoyées à la RH.' })}>Répondre</Button>}
              </div>
            </Card>
          );
        })}
      </div>
      )}

      <Modal open={wizard} onClose={() => setWizard(false)} title="Nouvelle demande de recrutement" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setWizard(false)}>Annuler</Button>
          <Button size="sm" onClick={submit}>Envoyer à la RH</Button>
        </>}>
        <div className="space-y-4">
          <label className="block">
            <span className="text-[12px] font-semibold text-ink-500">Intitulé du poste</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" placeholder="Ex. Chargé clientèle Senior" />
          </label>
          <div>
            <span className="text-[12px] font-semibold text-ink-500">Type de besoin</span>
            <div className="mt-1.5 space-y-1.5">
              {REQUEST_TYPES.map((t) => (
                <label key={t.key} className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
                  <input type="radio" name="rtype" checked={type === t.key} onChange={() => setType(t.key)} className="accent-info" /> {t.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[12px] font-semibold text-ink-500">Urgence</span>
            <div className="mt-1.5 space-y-1.5">
              {REQUEST_URGENCY.map((u) => (
                <label key={u.key} className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
                  <input type="radio" name="rurg" checked={urgency === u.key} onChange={() => setUrgency(u.key)} className="accent-info" /> {u.label}
                </label>
              ))}
            </div>
          </div>
          <p className="flex items-start gap-2 rounded-xl bg-amber/[0.07] px-3 py-2 text-[12px] font-medium text-ink-700"><Sparkles size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Estimation Proph3t : ce profil correspond à 8 candidats internes potentiels (mobilité). Marché externe : prévoir 3 mois.</p>
          <p className="flex items-start gap-2 text-[11px] font-medium text-ink-500"><ShieldCheck size={13} className="mt-0.5 shrink-0 text-info" /> Vous exprimez un besoin : la RH instruit, valide budgétairement et lance le sourcing. La fourchette de classification est indicative — la RH décide des montants.</p>
        </div>
      </Modal>
    </div>
  );
}
