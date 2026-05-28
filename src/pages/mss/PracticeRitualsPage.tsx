import { useEffect, useState } from 'react';
import { Repeat, Plus, AlertTriangle, Check, Sparkles } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Modal } from '../../components/ui/overlays';
import { useToast } from '../../components/ui/Toast';
import { PracticeSubNav } from '../../components/mss/PracticeSubNav';
import { useSurface } from '../../store/useSurface';
import { RITUALS, RITUAL_STATUS_META, CADENCE_LABEL, RITUAL_CATALOG, PRACTICE_OVERVIEW, type Cadence } from '../../lib/mss/practice';

const CADENCES: Cadence[] = ['weekly', 'biweekly', 'monthly', 'quarterly'];

export function PracticeRitualsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(RITUAL_CATALOG[0]);
  const [cadence, setCadence] = useState<Cadence>('weekly');
  const [done, setDone] = useState<Set<string>>(new Set());

  const markDone = (id: string) => {
    setDone((s) => new Set(s).add(id));
    toast({ variant: 'success', title: 'Rituel marqué réalisé', description: 'L’occurrence est enregistrée dans votre suivi.' });
  };
  const add = () => { setOpen(false); toast({ variant: 'success', title: 'Rituel ajouté', description: `${name} (${CADENCE_LABEL[cadence]}) configuré avec rappels.` }); };

  return (
    <div className="animate-fade-up space-y-5">
      <PracticeSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Mes rituels managériaux</h1>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Ajouter un rituel</Button>
      </div>

      <Card><p className="text-sm font-medium text-ink-700">Régularité globale : <span className="mono font-semibold text-ink">{PRACTICE_OVERVIEW.ritualRegularity}%</span></p></Card>

      {RITUALS.map((r) => {
        const meta = RITUAL_STATUS_META[done.has(r.id) ? 'ontrack' : r.status];
        return (
          <Card key={r.id} className={r.status !== 'ontrack' && !done.has(r.id) ? 'border-warn/25' : undefined}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-ink"><Repeat size={15} className="text-info" /> {r.name}</p>
                <p className="mt-1 text-[13px] font-medium text-ink-600">Cadence : {CADENCE_LABEL[r.cadence]} · {r.detail}</p>
                {r.meta && !done.has(r.id) && <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-warn"><AlertTriangle size={12} /> {r.meta}</p>}
              </div>
              <StatusPill tone={meta.tone} dot={false}>{meta.label}</StatusPill>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => markDone(r.id)} disabled={done.has(r.id)}><Check size={13} /> {done.has(r.id) ? 'Réalisé' : 'Marquer réalisé'}</Button>
            </div>
          </Card>
        );
      })}

      <Card className="glass-amber">
        <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-amber-deep"><Sparkles size={14} /> Proph3t</p>
        <p className="mt-1 text-[13px] font-medium text-ink-700">La revue OKR et le skip-level sont régulièrement reportés : programmez-les pour sécuriser votre régularité.</p>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un rituel" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Annuler</Button><Button size="sm" onClick={add}>Configurer</Button></>}>
        <div className="space-y-3">
          <label className="block">
            <span className="text-[12px] font-semibold text-ink-500">Type de rituel</span>
            <select value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30">
              {RITUAL_CATALOG.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <div>
            <span className="text-[12px] font-semibold text-ink-500">Cadence</span>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {CADENCES.map((c) => (
                <label key={c} className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
                  <input type="radio" name="cad" checked={cadence === c} onChange={() => setCadence(c)} className="accent-info" /> {CADENCE_LABEL[c]}
                </label>
              ))}
            </div>
          </div>
          <StatusPill tone="info" dot={false}>Rappels J-1 et le jour même</StatusPill>
        </div>
      </Modal>
    </div>
  );
}
