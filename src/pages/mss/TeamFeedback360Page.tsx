import { useEffect, useMemo, useState } from 'react';
import { Radar, Send, Users, Sparkles, ShieldCheck, ThumbsUp, ArrowUpRight, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/overlays';
import { useToast } from '../../components/ui/Toast';
import { PerformanceSubNav } from '../../components/mss/PerformanceSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { member360 } from '../../lib/mss/perf';
import { employeeName, type EmployeeRecord } from '../../data/mock';
import { isBackendConfigured, useTeamDirectory, dirName } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

type Tab = 'launch' | 'team' | 'self';

const FORCES = ['Sens du collectif', 'Fiabilité des livrables', 'Communication claire', 'Esprit d\'initiative', 'Orientation client'];
const AXES = ['Déléguer davantage', 'Prioriser les urgences', 'Documenter les process', 'Prise de parole en réunion', 'Gestion du temps'];

function hashPick<T>(id: string, arr: T[], salt = 0): T { let h = salt; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return arr[h % arr.length]; }

export function TeamFeedback360Page() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const mockTeam = useMemo(() => scopedTeam(depth, employees), [depth, employees]);

  const { data: ctx } = useSessionContext();
  const { data: liveDir } = useTeamDirectory(ctx?.tenantId);
  const hasLive = isBackendConfigured && Boolean(ctx?.tenantId);

  const [tab, setTab] = useState<Tab>('team');
  const [launch, setLaunch] = useState<{ id: string; name: string } | null>(null);

  const displayTeam: { id: string; name: string }[] = hasLive
    ? (liveDir ?? []).map(d => ({ id: d.id, name: dirName(d) }))
    : mockTeam.map(e => ({ id: e.id, name: employeeName(e) }));

  const mockRows = mockTeam.map((e) => ({ e, f: member360(e) }));
  const totalReceived = mockRows.reduce((s, r) => s + r.f.received, 0);
  const totalRequested = mockRows.reduce((s, r) => s + r.f.sent, 0);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'launch', label: 'À lancer' },
    { key: 'team', label: 'Reçus par mes N-1' },
    { key: 'self', label: 'Mon propre 360°' },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <PerformanceSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink">Feedback 360°</h1>
            {hasLive && <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>}
          </div>
          <p className="text-sm font-medium text-ink-500">{totalRequested} demandes lancées · {totalReceived} retours reçus · pairs, N-1 et auto-évaluation</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-xl px-3 py-1.5 text-[12px] font-semibold transition ${tab === t.key ? 'bg-info/12 text-info' : 'bg-surface2 text-ink-500 hover:text-ink'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'launch' && (
        <Card>
          <CardHeader title="Lancer une campagne 360°" subtitle="Sélectionnez les répondants — anonymat garanti à partir de 3 retours" action={<Radar size={16} className="text-info" />} />
          <div className="space-y-1.5">
            {displayTeam.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2">
                <div className="flex items-center gap-2.5"><Avatar name={m.name} size="xs" /><span className="text-sm font-semibold text-ink">{m.name}</span></div>
                <Button size="sm" variant="outline" onClick={() => setLaunch(m)}><Send size={13} /> Lancer un 360°</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'team' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {mockRows.map(({ e, f }) => {
            const force = hashPick(e.id, FORCES);
            const axe = hashPick(e.id, AXES, 7);
            const consensual = f.received >= 3;
            return (
              <Card key={e.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={employeeName(e)} size="sm" />
                    <div>
                      <p className="text-sm font-bold text-ink">{employeeName(e)}</p>
                      <p className="text-[11px] font-medium text-ink-400">{f.received}/{f.sent} retours · {consensual ? 'synthèse anonymisée' : 'en attente d\'anonymat'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="mono text-lg font-semibold text-ink">{f.score.toFixed(1)}</p>
                    <p className="text-[10px] font-medium text-ink-400">/5 moyenne</p>
                  </div>
                </div>
                {consensual ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-start gap-2 rounded-xl bg-ok/[0.06] px-3 py-2 text-[12px] font-medium text-ink-700"><ThumbsUp size={13} className="mt-0.5 shrink-0 text-ok" /> <span><span className="font-semibold text-ink">Force consensuelle :</span> {force}</span></div>
                    <div className="flex items-start gap-2 rounded-xl bg-warn/[0.06] px-3 py-2 text-[12px] font-medium text-ink-700"><ArrowUpRight size={13} className="mt-0.5 shrink-0 text-warn" /> <span><span className="font-semibold text-ink">Axe de progrès :</span> {axe}</span></div>
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl bg-surface2 px-3 py-2 text-[12px] font-medium text-ink-400">Synthèse masquée tant que moins de 3 retours reçus (anonymat).</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'self' && (
        <Card>
          <CardHeader title="Mon propre feedback 360°" subtitle="Retours de mes pairs, de ma hiérarchie et de mes N-1" action={<Users size={16} className="text-ink-400" />} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[['Pairs', 5, 4.2], ['Hiérarchie', 1, 4.5], ['N-1', mockTeam.length, 4.1]].map(([src, n, sc]) => (
              <div key={src as string} className="rounded-xl bg-surface2 px-3 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{src}</p>
                <p className="mono mt-1 text-xl font-semibold text-ink">{sc}</p>
                <p className="text-[10px] font-medium text-ink-400">{n} retour(s)</p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-2 rounded-xl bg-ok/[0.06] px-3 py-2 text-[12px] font-medium text-ink-700"><ThumbsUp size={13} className="mt-0.5 shrink-0 text-ok" /> <span><span className="font-semibold text-ink">Force consensuelle :</span> Disponibilité et soutien de l'équipe.</span></div>
            <div className="flex items-start gap-2 rounded-xl bg-warn/[0.06] px-3 py-2 text-[12px] font-medium text-ink-700"><ArrowUpRight size={13} className="mt-0.5 shrink-0 text-warn" /> <span><span className="font-semibold text-ink">Axe de progrès :</span> Clarifier les priorités trimestrielles.</span></div>
          </div>
        </Card>
      )}

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Les retours sont <strong>anonymisés</strong> : aucune synthèse n'est affichée en dessous de 3 répondants. Le 360° nourrit le développement, jamais directement la rémunération.</p>
      </Card>

      <Modal open={launch !== null} onClose={() => setLaunch(null)} title={launch ? `Lancer un 360° — ${launch.name}` : ''} footer={<>
        <Button variant="ghost" size="sm" onClick={() => setLaunch(null)}>Annuler</Button>
        <Button size="sm" onClick={() => { toast({ variant: 'success', title: 'Campagne 360° lancée', description: launch ? `Les répondants de ${launch.name} sont invités.` : '' }); setLaunch(null); }}><Send size={13} /> Lancer</Button>
      </>}>
        <div className="space-y-3 text-[12px] font-medium text-ink-700">
          <p className="flex items-center gap-1.5 rounded-xl bg-info/[0.06] px-3 py-2"><Sparkles size={14} className="text-info" /> Proph3t suggère un panel équilibré de répondants (pairs, transverses, N-1).</p>
          <div>
            <p className="text-[12px] font-semibold text-ink-500">Répondants suggérés</p>
            <div className="mt-1 space-y-1">
              {['2 pairs de l\'équipe', '1 collaborateur transverse', 'Sa hiérarchie (moi)', '1 client interne'].map((r, i) => (
                <label key={r} className="flex items-center gap-2 text-[12px] font-medium text-ink-700"><input type="checkbox" defaultChecked={i < 3} className="h-4 w-4 rounded border-line accent-info" /> {r}</label>
              ))}
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-400"><ShieldCheck size={12} /> Anonymat garanti à partir de 3 retours reçus.</p>
        </div>
      </Modal>
    </div>
  );
}
