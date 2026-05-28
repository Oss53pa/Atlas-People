import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Megaphone, Shield, Plus, Lock } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { ProgressBar } from '../../components/charts/ProgressBar';
import { EmptyState } from '../../components/ui/feedback';
import { FormField, TextInput, Select } from '../../components/ui/FormField';
import { useToast } from '../../components/ui/Toast';
import { TimeSubNav } from '../../components/m2/TimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useDelegation } from '../../store/useDelegation';

const SELF_ID = 'e2';
const fmtH = (n: number) => `${Math.floor(n)}h${n % 1 ? String(Math.round((n % 1) * 60)).padStart(2, '0') : '00'}`;
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');

export function MesDelegationPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);

  const { toast } = useToast();
  const credits = useDelegation((s) => s.credits).filter((c) => c.employeeId === SELF_ID);
  const usage = useDelegation((s) => s.usage).filter((u) => u.employeeId === SELF_ID);
  const declare = useDelegation((s) => s.declare);

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('2026-05-27');
  const [hours, setHours] = useState('2');
  const [location, setLocation] = useState<'internal' | 'external'>('internal');
  const [note, setNote] = useState('');

  const mandateType = credits[0]?.mandateType ?? 'Délégué du personnel';

  const submit = () => {
    const h = Number(hours);
    if (!h || h <= 0) return;
    declare({ id: `du_${Date.now()}`, employeeId: SELF_ID, mandateType, date, hours: h, location, note: note || undefined });
    toast({ variant: 'success', title: 'Bon de délégation enregistré', description: `${fmtH(h)} le ${frDate(date)} — votre manager est informé (sans accord requis).` });
    setOpen(false);
  };

  if (credits.length === 0) {
    return (
      <div className="animate-fade-up space-y-5">
        <TimeSubNav />
        <Card><EmptyState icon={Megaphone} title="Aucun mandat actif" description="Cette page est réservée aux titulaires d'un mandat de représentation du personnel." /></Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <TimeSubNav />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Mes heures de délégation</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}><Plus size={14} /> Bon de délégation</Button>
          <Link to="/me/time"><Button variant="ghost" size="sm"><ArrowLeft size={14} /> Retour</Button></Link>
        </div>
      </div>

      {/* Bandeau "droit, pas faveur" */}
      <Card className="border-warn/25 bg-warn/[0.05]">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700">
          <Shield size={15} className="mt-0.5 shrink-0 text-warn" />
          Les heures de délégation sont un <span className="font-bold">droit</span> : vous <span className="font-bold">déclarez</span> leur usage (bon de délégation), vous ne demandez pas d'autorisation. Elles sont rémunérées comme temps de travail et ne consomment pas vos congés.
        </p>
      </Card>

      {/* Crédits par mandat */}
      {credits.map((c) => {
        const remaining = Math.round((c.monthlyQuota - c.usedHours) * 10) / 10;
        return (
          <Card key={c.id}>
            <CardHeader title={c.mandateType} subtitle={`Crédit mensuel · ${c.month}`} action={c.protectedUntil ? <StatusPill tone="warn" dot={false}><Shield size={11} /> Protégé jusqu'au {frDate(c.protectedUntil)}</StatusPill> : undefined} />
            <div className="flex items-end justify-between">
              <div><p className="mono text-3xl font-semibold text-amber-deep">{fmtH(remaining)}</p><p className="text-[11px] font-medium text-ink-400">restantes ce mois</p></div>
              <div className="text-right text-[11px] font-medium text-ink-400"><p>Crédit <span className="mono font-semibold text-ink">{fmtH(c.monthlyQuota)}</span></p><p>Utilisées <span className="mono font-semibold text-ink">{fmtH(c.usedHours)}</span></p></div>
            </div>
            <div className="mt-3"><ProgressBar value={c.usedHours} max={c.monthlyQuota} tone="amber" /></div>
            {c.usedHours > c.monthlyQuota && <p className="mt-2 text-[11px] font-semibold text-warn">Dépassement du crédit mensuel — possible dans les cas exceptionnels prévus par la loi, à justifier.</p>}
          </Card>
        );
      })}

      {/* Bon de délégation */}
      {open && (
        <Card className="border-amber/25">
          <CardHeader title="Bon de délégation" subtitle="Déclaration d'usage — pas une demande d'autorisation" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
            <FormField label="Heures"><TextInput type="number" value={hours} onChange={(e) => setHours(e.target.value)} /></FormField>
            <FormField label="Lieu"><Select value={location} onChange={(e) => setLocation(e.target.value as 'internal' | 'external')}><option value="internal">Interne</option><option value="external">Externe</option></Select></FormField>
          </div>
          <FormField label="Objet (facultatif)" hint="L'employeur ne peut exiger le détail des activités de représentation." className="mt-3">
            <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optionnel" />
          </FormField>
          <Button size="sm" className="mt-3" onClick={submit}>Enregistrer le bon</Button>
        </Card>
      )}

      {/* Historique */}
      <Card inset={false}>
        <div className="p-5 pb-3"><CardHeader title="Historique d'usage" subtitle={`${usage.length} déclaration(s)`} className="mb-0" /></div>
        <div className="divide-y divide-line">
          {usage.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><Megaphone size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{fmtH(u.hours)} · {u.location === 'internal' ? 'Interne' : 'Externe'}</p>
                <p className="text-[11px] font-medium text-ink-400">{frDate(u.date)} · {u.mandateType}</p>
              </div>
              <StatusPill tone="ok" dot={false}>Déclarée</StatusPill>
            </div>
          ))}
        </div>
      </Card>

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Lock size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Confidentialité : votre manager voit que vous utilisez des heures de délégation (organisation du travail) mais jamais l'objet ni le contenu de vos activités de représentation. Ces heures ne peuvent jamais motiver une sanction.</p>
      </Card>
    </div>
  );
}
