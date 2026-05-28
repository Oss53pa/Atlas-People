import { useEffect, useMemo, useState } from 'react';
import { HeartPulse, ShieldAlert, Sparkles, AlertTriangle, Lock } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Modal } from '../../components/ui/overlays';
import { useToast } from '../../components/ui/Toast';
import { DailySubNav } from '../../components/mss/DailySubNav';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam } from '../../lib/mss/scope';
import { climateMetrics, climateTrend, climateSignals, SIGNAL_ACTIONS, CLIMATE_SUGGESTIONS, frDate, type ClimateSignal } from '../../lib/mss/daily';

export function TeamClimatePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const m = climateMetrics(team);
  const trend = climateTrend();
  const signals = climateSignals();
  const enoughForSurvey = team.length >= 5;

  const [treat, setTreat] = useState<ClimateSignal | null>(null);
  const [action, setAction] = useState(SIGNAL_ACTIONS[0].key);
  const [plan, setPlan] = useState('');

  const maxTrend = Math.max(...trend.map((t) => t.value));

  const submitTreat = () => {
    setTreat(null);
    if (action === 'escalate') toast({ variant: 'info', title: 'Signalement escaladé à la RH', description: 'Transmis à la RH (+ médecin du travail si RPS sévère). Anonymat préservé.' });
    else toast({ variant: 'success', title: 'Plan d’action enregistré', description: 'Le signalement est suivi. L’auteur reste anonyme et non ré-identifiable.' });
    setPlan('');
  };

  return (
    <div className="animate-fade-up space-y-5">
      <DailySubNav />
      <h1 className="text-2xl font-semibold text-ink">Climat équipe</h1>

      {!enoughForSurvey ? (
        <Card><p className="flex items-center gap-2 py-3 text-sm font-medium text-ink-500"><Lock size={15} className="text-ink-400" /> Indicateurs masqués : votre périmètre compte moins de 5 personnes (seuil d’anonymisation des sondages).</p></Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Card><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Engagement</p><p className="mono mt-1 text-2xl font-semibold text-ink">{m.engagement}/10</p><p className="text-[11px] font-semibold text-ok">▲ {m.engagementDelta} vs T-1</p></Card>
            <Card><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Satisfaction</p><p className="mono mt-1 text-2xl font-semibold text-ink">{m.satisfaction}/5</p></Card>
            <Card><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">NPS interne</p><p className="mono mt-1 text-2xl font-semibold text-ink">+{m.nps}</p></Card>
            <Card><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Charge perçue</p><p className="mt-2"><StatusPill tone={m.workloadOk ? 'ok' : 'warn'} dot={false}>{m.workloadOk ? 'OK' : 'Sous tension'}</StatusPill></p></Card>
          </div>

          <Card>
            <CardHeader title="Évolution de l’engagement sur 6 mois" subtitle={`Participation dernier sondage flash : ${m.participation}%`} action={<HeartPulse size={16} className="text-ink-400" />} />
            <div className="flex h-32 items-end gap-3">
              {trend.map((t) => (
                <div key={t.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full items-end justify-center" style={{ height: '100%' }}>
                    <div className="w-7 rounded-t-lg bg-info/70" style={{ height: `${(t.value / maxTrend) * 100}%` }} title={`${t.value}/10`} />
                  </div>
                  <span className="text-[10px] font-semibold text-ink-400">{t.month}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <Card>
        <CardHeader title="Alertes RPS" action={<ShieldAlert size={16} className="text-ink-400" />} />
        <p className="text-sm font-medium text-ink-500">Aucune alerte active. Dernière alerte : 02/03/2026 (résolue). Les alertes RPS sévères sont escaladées automatiquement à la RH et au médecin du travail.</p>
      </Card>

      <Card className={signals.length ? 'border-warn/25' : undefined}>
        <CardHeader title="Signalements en cours" action={<StatusPill tone={signals.length ? 'warn' : 'ok'} dot={false}>{signals.length} à traiter</StatusPill>} />
        {signals.length === 0 ? <p className="py-2 text-sm font-medium text-ink-400">Aucun signalement en cours.</p> : (
          <div className="space-y-2">
            {signals.map((s) => (
              <div key={s.id} className="rounded-xl bg-surface2 px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">{s.anonymous && <Lock size={13} className="text-ink-400" />} {s.category}</p>
                  <span className="text-[11px] font-medium text-ink-400">Reçu le {frDate(s.receivedAt)}</span>
                </div>
                <p className="mt-1 text-[12px] font-medium text-ink-600">{s.content}</p>
                <div className="mt-2"><Button size="sm" onClick={() => { setTreat(s); setAction(SIGNAL_ACTIONS[0].key); }}>Voir et traiter</Button></div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="glass-amber">
        <p className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-amber-deep"><Sparkles size={14} /> Actions recommandées Proph3t</p>
        <ul className="space-y-1.5 text-[12px] font-medium text-ink-700">
          {CLIMATE_SUGGESTIONS.map((s, i) => <li key={i} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-deep" /> {s}</li>)}
        </ul>
      </Card>

      <Modal open={treat !== null} onClose={() => setTreat(null)} title={`Signalement — ${treat?.category ?? ''}`} size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setTreat(null)}>Annuler</Button>
          <Button size="sm" onClick={submitTreat}>{action === 'escalate' ? 'Escalader' : 'Enregistrer le plan d’action'}</Button>
        </>}>
        {treat && (
          <div className="space-y-3">
            <p className="flex items-start gap-2 rounded-xl bg-amber/[0.07] px-3 py-2 text-[12px] font-medium text-ink-700"><Lock size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Confidentialité : l’auteur est anonyme et non ré-identifiable. Traitez la situation au niveau de l’équipe, sans citer nominativement le signalement.</p>
            <p className="rounded-xl bg-surface2 px-3 py-2 text-[13px] font-medium text-ink-700">{treat.content}</p>
            <div>
              <span className="text-[12px] font-semibold text-ink-500">Action</span>
              <div className="mt-1.5 space-y-1.5">
                {SIGNAL_ACTIONS.map((a) => (
                  <label key={a.key} className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
                    <input type="radio" name="sigact" checked={action === a.key} onChange={() => setAction(a.key)} className="accent-info" /> {a.label}
                  </label>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="text-[12px] font-semibold text-ink-500">Plan d’action</span>
              <textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" placeholder="Décrivez les mesures prévues…" />
            </label>
            {action === 'escalate' && <p className="flex items-center gap-1.5 text-[11px] font-medium text-warn"><AlertTriangle size={12} /> Cas grave : transmission à la RH (et médecin du travail si RPS).</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
