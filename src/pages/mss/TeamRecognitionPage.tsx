import { useEffect, useMemo, useState } from 'react';
import { Award, Send, Sparkles, Heart, TrendingUp } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/overlays';
import { useToast } from '../../components/ui/Toast';
import { PerformanceSubNav } from '../../components/mss/PerformanceSubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { memberRecognition, BADGES, frDate } from '../../lib/mss/perf';
import { employeeName, type EmployeeRecord } from '../../data/mock';

export function TeamRecognitionPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);

  const [send, setSend] = useState<EmployeeRecord | null>(null);
  const [badge, setBadge] = useState(BADGES[0].key);
  const [message, setMessage] = useState('');

  const rows = team.map((e) => ({ e, r: memberRecognition(e) }));
  const totalSent = rows.reduce((s, x) => s + x.r.count, 0);
  const covered = rows.filter((x) => x.r.count > 0).length;
  const uncovered = rows.filter((x) => x.r.count === 0);

  const openSender = (e: EmployeeRecord) => { setSend(e); setBadge(BADGES[0].key); setMessage(''); };
  const confirmSend = () => {
    const b = BADGES.find((x) => x.key === badge)!;
    toast({ variant: 'success', title: 'Reconnaissance envoyée', description: send ? `${b.emoji} ${b.label} → ${employeeName(send)}` : '' });
    setSend(null);
  };

  return (
    <div className="animate-fade-up space-y-5">
      <PerformanceSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Reconnaissance</h1>
          <p className="text-sm font-medium text-ink-500">Valorisez les contributions — cible 1 reconnaissance / membre / trimestre</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Award} label="Reconnaissances envoyées" value={`${totalSent}`} unit="ce trimestre" tone="amber" />
        <StatCard icon={Heart} label="Couverture équipe" value={`${covered}/${team.length}`} unit="membres valorisés" tone={covered === team.length ? 'amber' : 'default'} />
        <StatCard icon={TrendingUp} label="Cible trimestrielle" value="1/membre" unit="par trimestre" />
      </div>

      {uncovered.length > 0 && (
        <Card className="border-warn/25">
          <CardHeader title="À valoriser ce trimestre" subtitle={`${uncovered.length} membre(s) sans reconnaissance`} action={<Sparkles size={16} className="text-warn" />} />
          <div className="space-y-1.5">
            {uncovered.map((x) => (
              <div key={x.e.id} className="flex items-center justify-between rounded-xl bg-warn/[0.06] px-3 py-2">
                <div className="flex items-center gap-2.5"><Avatar name={employeeName(x.e)} size="xs" /><span className="text-sm font-semibold text-ink">{employeeName(x.e)}</span></div>
                <Button size="sm" onClick={() => openSender(x.e)}><Send size={13} /> Reconnaître</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Toute l'équipe" subtitle="Historique de reconnaissance par membre" action={<Award size={16} className="text-ink-400" />} />
        <div className="space-y-1.5">
          {rows.map(({ e, r }) => (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface2 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar name={employeeName(e)} size="xs" />
                <div>
                  <p className="text-sm font-semibold text-ink">{employeeName(e)}</p>
                  {r.count > 0 ? (
                    <p className="text-[11px] font-medium text-ink-400">{r.lastBadge} · {r.lastDate && frDate(r.lastDate)}</p>
                  ) : (
                    <p className="text-[11px] font-medium text-ink-400">Aucune reconnaissance ce trimestre</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.count > 0 && <StatusPill tone="ok" dot={false}>{r.count}×</StatusPill>}
                <Button variant="outline" size="sm" onClick={() => openSender(e)}><Send size={13} /> Reconnaître</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Sparkles size={14} className="mt-0.5 shrink-0 text-amber-deep" /> La reconnaissance est <strong>symbolique</strong> (badge + message) — aucun montant ni prime n'y est associé. Proph3t peut rappeler les membres non valorisés en fin de trimestre.</p>
      </Card>

      <Modal open={send !== null} onClose={() => setSend(null)} title={send ? `Reconnaître — ${employeeName(send)}` : ''} footer={<>
        <Button variant="ghost" size="sm" onClick={() => setSend(null)}>Annuler</Button>
        <Button size="sm" disabled={message.trim().length < 5} onClick={confirmSend}><Send size={13} /> Envoyer</Button>
      </>}>
        <div className="space-y-3">
          <div>
            <p className="text-[12px] font-semibold text-ink-500">Choisir un badge</p>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {BADGES.map((b) => (
                <button key={b.key} onClick={() => setBadge(b.key)} className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition ${badge === b.key ? 'border-info bg-info/[0.06] text-info' : 'border-line bg-surface2 text-ink-600 hover:text-ink'}`}>
                  <span className="text-lg">{b.emoji}</span>{b.label}
                </button>
              ))}
            </div>
          </div>
          <label className="block"><span className="text-[12px] font-semibold text-ink-500">Message personnalisé</span>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" placeholder="Décrivez la contribution reconnue…" />
            <span className="mt-0.5 block text-right text-[10px] font-medium text-ink-400">{message.trim().length}/5 caractères minimum</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
