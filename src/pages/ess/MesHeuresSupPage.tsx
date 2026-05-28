import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Plus, Wallet, RefreshCw, Sparkles } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { FormField, TextInput, Select } from '../../components/ui/FormField';
import { useToast } from '../../components/ui/Toast';
import { TimeSubNav } from '../../components/m2/TimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useOvertime } from '../../store/useOvertime';
import { cn } from '../../lib/cn';

const SELF_ID = 'e2';
const round1 = (n: number) => Math.round(n * 10) / 10;
const fmtH = (n: number) => `${Math.floor(n)}h${n % 1 ? String(Math.round((n % 1) * 60)).padStart(2, '0') : '00'}`;

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'neutral'> = { validated: 'ok', pending: 'warn', detected: 'neutral' };
const STATUS_LABEL: Record<string, string> = { validated: 'Validée', pending: 'En attente', detected: 'Détectée' };
const CAT_LABEL: Record<string, string> = { overtime: 'Heures sup', night: 'Nuit', sunday: 'Dimanche', holiday: 'Férié' };

export function MesHeuresSupPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);

  const { toast } = useToast();
  const records = useOvertime((s) => s.records).filter((r) => r.employeeId === SELF_ID);
  const declare = useOvertime((s) => s.declare);
  const setPreference = useOvertime((s) => s.setPreference);

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('2026-05-26');
  const [hours, setHours] = useState('1');
  const [rate, setRate] = useState('15');
  const [motif, setMotif] = useState('Surcroît d\'activité');

  const detected = round1(records.reduce((s, r) => s + r.overtimeHours, 0));
  const validated = round1(records.filter((r) => r.status === 'validated').reduce((s, r) => s + r.overtimeHours, 0));
  const pending = round1(records.filter((r) => r.status === 'pending').reduce((s, r) => s + r.overtimeHours, 0));

  const byRate = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records) { const key = r.category === 'night' ? 'Nuit' : r.category === 'sunday' ? 'Dimanche' : r.category === 'holiday' ? 'Férié' : `+${r.ratePct}%`; map.set(key, round1((map.get(key) ?? 0) + r.overtimeHours)); }
    return [...map.entries()];
  }, [records]);

  const submit = () => {
    const h = Number(hours);
    if (!h || h <= 0) return;
    declare({ id: `ot_${Date.now()}`, employeeId: SELF_ID, date, plannedHours: 8, workedHours: round1(8 + h), overtimeHours: round1(h), ratePct: Number(rate), category: 'overtime', status: 'pending', source: 'declared' });
    toast({ variant: 'success', title: 'Heures sup déclarées', description: `${fmtH(h)} le ${new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR')} — en attente de validation.` });
    setOpen(false);
  };

  return (
    <div className="animate-fade-up space-y-5">
      <TimeSubNav />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Mes heures supplémentaires</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}><Plus size={14} /> Déclarer</Button>
          <Link to="/me/time"><Button variant="ghost" size="sm"><ArrowLeft size={14} /> Retour</Button></Link>
        </div>
      </div>

      {/* Synthèse */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Détectées (mois)" value={fmtH(detected)} tone="neutral" icon={Clock} />
        <Stat label="Validées" value={fmtH(validated)} tone="ok" icon={Clock} />
        <Stat label="En attente" value={fmtH(pending)} tone="warn" icon={Clock} />
      </div>

      <Card>
        <CardHeader title="Répartition par taux" subtitle="Majorations déterministes" />
        <div className="flex flex-wrap gap-2">
          {byRate.map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface2 px-3 py-1.5 text-sm font-semibold text-ink">{k} <span className="mono text-amber-deep">{fmtH(v)}</span></span>
          ))}
        </div>
      </Card>

      {/* Déclaration */}
      {open && (
        <Card className="border-amber/25">
          <CardHeader title="Déclarer des heures supplémentaires" subtitle="Validation requise par le manager" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
            <FormField label="Heures"><TextInput type="number" value={hours} onChange={(e) => setHours(e.target.value)} /></FormField>
            <FormField label="Majoration"><Select value={rate} onChange={(e) => setRate(e.target.value)}><option value="15">+15%</option><option value="50">+50%</option></Select></FormField>
          </div>
          <FormField label="Motif" className="mt-3"><TextInput value={motif} onChange={(e) => setMotif(e.target.value)} /></FormField>
          <Button size="sm" className="mt-3" onClick={submit}>Soumettre</Button>
        </Card>
      )}

      {/* Liste détaillée */}
      <Card inset={false}>
        <div className="p-5 pb-3"><CardHeader title="Détail" subtitle="Pointages réels vs prévu" className="mb-0" /></div>
        <div className="divide-y divide-line">
          {records.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="mono w-24 shrink-0 text-[12px] font-bold text-ink-500">{new Date(`${r.date}T00:00:00`).toLocaleDateString('fr-FR')}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{CAT_LABEL[r.category]} · <span className="mono text-amber-deep">{fmtH(r.overtimeHours)}</span> {r.category === 'night' ? '' : `(+${r.ratePct}%)`}</p>
                <p className="text-[11px] font-medium text-ink-400">Prévu {fmtH(r.plannedHours)} · pointé {fmtH(r.workedHours)} · {r.source === 'auto' ? 'auto-détectée' : 'déclarée'}</p>
              </div>
              {r.status === 'validated' && (
                <div className="flex rounded-lg border border-line p-0.5">
                  <button onClick={() => setPreference(r.id, 'pay')} className={cn('flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold', r.preference === 'pay' ? 'bg-amber/12 text-amber-deep' : 'text-ink-400')}><Wallet size={12} /> Payer</button>
                  <button onClick={() => setPreference(r.id, 'recovery')} className={cn('flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold', r.preference === 'recovery' ? 'bg-amber/12 text-amber-deep' : 'text-ink-400')}><RefreshCw size={12} /> Récup.</button>
                </div>
              )}
              <StatusPill tone={STATUS_TONE[r.status]} dot={false}>{STATUS_LABEL[r.status]}</StatusPill>
            </div>
          ))}
        </div>
      </Card>

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Sparkles size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Calcul 100% déterministe : vos heures sup sont reconstituées à partir de vos pointages réels comparés à votre planning. Une heure sup n'est jamais payée sans validation.</p>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone, icon: Icon }: { label: string; value: string; tone: 'ok' | 'warn' | 'neutral'; icon: typeof Clock }) {
  const c = tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : 'text-ink';
  return (
    <div className="rounded-2xl border border-line bg-surface2 p-4 text-center">
      <Icon size={16} className="mx-auto mb-1 text-ink-400" />
      <p className={cn('mono text-xl font-semibold', c)}>{value}</p>
      <p className="text-[11px] font-medium text-ink-400">{label}</p>
    </div>
  );
}
