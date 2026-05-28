import { useEffect, useMemo, useState } from 'react';
import { Route, Lock, Send, Sparkles, Briefcase, ShieldAlert } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/overlays';
import { useToast } from '../../components/ui/Toast';
import { DevelopmentSubNav } from '../../components/mss/DevelopmentSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { mobilityApplications, mobilityMatches, type MobilityMatch } from '../../lib/mss/dev';
import { employeeName } from '../../data/mock';

type Tab = 'applications' | 'opportunities' | 'openings';

export function TeamMobilityPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const [tab, setTab] = useState<Tab>('applications');
  const [propose, setPropose] = useState<MobilityMatch | null>(null);

  const apps = mobilityApplications(team);
  const matches = mobilityMatches(team);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'applications', label: `Candidatures de mon équipe (${apps.visible.length})` },
    { key: 'opportunities', label: `Opportunités à proposer (${matches.length})` },
    { key: 'openings', label: 'Postes ouverts (mon périmètre)' },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <DevelopmentSubNav />
      <h1 className="text-2xl font-semibold text-ink">Mobilité interne</h1>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-xl px-3 py-1.5 text-[12px] font-semibold transition ${tab === t.key ? 'bg-info/12 text-info' : 'bg-surface2 text-ink-500 hover:text-ink'}`}>{t.label}</button>)}
      </div>

      {tab === 'applications' && (
        <Card>
          <CardHeader title="Candidatures de mon équipe" action={<Route size={16} className="text-ink-400" />} />
          <p className="mb-3 flex items-start gap-2 rounded-xl bg-info/[0.06] px-3 py-2 text-[12px] font-medium text-ink-700"><ShieldAlert size={13} className="mt-0.5 shrink-0 text-info" /> Selon la politique tenant, certaines candidatures restent confidentielles tant qu'elles sont en instruction.</p>
          <div className="space-y-2">
            {apps.visible.map((a) => (
              <div key={a.emp.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface2 px-3 py-2.5">
                <div className="flex items-center gap-2.5"><Avatar name={employeeName(a.emp)} size="xs" />
                  <div><p className="text-sm font-semibold text-ink">{employeeName(a.emp)} → {a.position}</p><p className="text-[11px] font-medium text-ink-400">Mode transparent · le collaborateur a choisi de m'informer</p></div>
                </div>
                <div className="flex items-center gap-2"><StatusPill tone="info" dot={false}>{a.status}</StatusPill><Button variant="ghost" size="sm" onClick={() => toast({ variant: 'info', title: 'Avis manager', description: 'Vous serez sollicité par la RH si un avis est requis.' })}>Donner mon avis</Button></div>
              </div>
            ))}
            {apps.confidential > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-[12px] font-medium text-ink-400"><Lock size={14} /> {apps.confidential} candidature(s) confidentielle(s) — vous serez informé si le candidat la rend transparente.</div>
            )}
          </div>
        </Card>
      )}

      {tab === 'opportunities' && (
        <Card>
          <CardHeader title="Opportunités à proposer" subtitle="Suggestions Proph3t — postes ouverts matchant votre équipe" action={<Sparkles size={16} className="text-info" />} />
          <div className="space-y-2">
            {matches.map((m) => (
              <div key={m.emp.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface2 px-3 py-2.5">
                <div className="flex items-center gap-2.5"><Avatar name={employeeName(m.emp)} size="xs" />
                  <div><p className="text-sm font-semibold text-ink">{m.position}</p><p className="text-[11px] font-medium text-ink-400">{employeeName(m.emp)} · matching {m.score}%</p></div>
                </div>
                <Button size="sm" onClick={() => setPropose(m)}><Send size={13} /> Proposer</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'openings' && (
        <Card>
          <CardHeader title="Postes ouverts dans mon périmètre" action={<Briefcase size={16} className="text-ink-400" />} />
          <div className="rounded-xl bg-surface2 px-3 py-2.5">
            <p className="text-sm font-semibold text-ink">Chargé de clientèle Senior — Cosmos Yopougon</p>
            <p className="text-[11px] font-medium text-ink-400">3 candidatures internes en cours</p>
          </div>
        </Card>
      )}

      <Modal open={propose !== null} onClose={() => setPropose(null)} title={propose ? `Proposer une opportunité — ${employeeName(propose.emp)}` : ''} footer={<>
        <Button variant="ghost" size="sm" onClick={() => setPropose(null)}>Annuler</Button>
        <Button size="sm" onClick={() => { toast({ variant: 'success', title: 'Proposition envoyée', description: propose ? `${employeeName(propose.emp)} reçoit la proposition (non contraignante).` : '' }); setPropose(null); }}><Send size={13} /> Envoyer</Button>
      </>}>
        <div className="space-y-3">
          <div className="rounded-xl bg-surface2 px-3 py-2 text-[12px] font-medium text-ink-600"><span className="font-semibold text-ink">Poste :</span> {propose?.position}</div>
          <label className="block"><span className="text-[12px] font-semibold text-ink-500">Message personnel</span>
            <textarea rows={3} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" placeholder="Pourquoi vous pensez à cette personne…" /></label>
          <label className="flex items-center gap-2 text-[12px] font-medium text-ink-700"><input type="checkbox" defaultChecked className="h-4 w-4 rounded border-line accent-info" /> Inclure le détail du poste</label>
          <label className="flex items-center gap-2 text-[12px] font-medium text-ink-700"><input type="checkbox" defaultChecked className="h-4 w-4 rounded border-line accent-info" /> Préciser que c'est une proposition (pas une obligation)</label>
          <p className="flex items-start gap-2 rounded-xl bg-warn/[0.06] px-3 py-2 text-[11px] font-medium text-ink-700"><ShieldAlert size={13} className="mt-0.5 shrink-0 text-warn" /> Le collaborateur reçoit la proposition en courrier officiel mais reste libre de candidater ou non. La décision finale lui appartient.</p>
        </div>
      </Modal>
    </div>
  );
}
