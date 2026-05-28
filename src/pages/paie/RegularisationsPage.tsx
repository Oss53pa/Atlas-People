import { RefreshCw, LogOut, Plus, FileText } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { Money } from '../../lib/money';

const fmt = (n: number) => Money.of(n, 'XOF').format();
const REGULS = [
  { ref: 'REG-2026-014', emp: 'Yao Brou', type: 'Rappel salarial', target: 'Mars 2026', amount: 45_000, status: 'validated' as const },
  { ref: 'REG-2026-013', emp: 'Mariam Cissé', type: 'Rétroactif (avenant)', target: 'Avril 2026', amount: 120_000, status: 'calculated' as const },
  { ref: 'REG-2026-012', emp: 'Désiré Kouamé', type: 'Trop-perçu', target: 'Mars 2026', amount: -30_000, status: 'created' as const },
];
const STC = [
  { ref: 'STC-2026-003', emp: 'Bineta Gueye', motif: 'Fin de CDI (démission)', date: '2026-05-31', net: 1_240_000, status: 'calculated' as const },
];
const TYPE_TONE: Record<string, 'ok' | 'amber' | 'info' | 'neutral'> = { validated: 'ok', calculated: 'amber', created: 'neutral' };
const TYPE_LABEL: Record<string, string> = { validated: 'Validée', calculated: 'Calculée', created: 'Créée' };

export function RegularisationsPage() {
  const { toast } = useToast();
  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Régularisations & STC</h1>
          <p className="text-sm font-medium text-ink-500">Rétroactifs, rappels, trop-perçus, soldes de tout compte — cycle de correction</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Nouvelle régularisation' })}><Plus size={14} /> Régularisation</Button>
      </div>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Régularisations" className="mb-0" action={<RefreshCw size={16} className="text-ink-400" />} /></div>
        <div className="divide-y divide-line">
          {REGULS.map((r) => (
            <div key={r.ref} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><RefreshCw size={15} /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-bold text-ink">{r.emp} <span className="mono text-[10px] font-medium text-ink-400">{r.ref}</span></p><p className="text-[11px] font-medium text-ink-400">{r.type} · période {r.target}</p></div>
              <span className={`mono text-sm font-bold ${r.amount < 0 ? 'text-danger' : 'text-ink'}`}>{r.amount < 0 ? '-' : '+'}{fmt(Math.abs(r.amount))}</span>
              <StatusPill tone={TYPE_TONE[r.status]} dot={false}>{TYPE_LABEL[r.status]}</StatusPill>
            </div>
          ))}
        </div>
      </Card>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Soldes de tout compte (STC)" className="mb-0" action={<LogOut size={16} className="text-ink-400" />} /></div>
        <div className="divide-y divide-line">
          {STC.map((s) => (
            <div key={s.ref} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-info/12 text-info"><FileText size={15} /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-bold text-ink">{s.emp} <span className="mono text-[10px] font-medium text-ink-400">{s.ref}</span></p><p className="text-[11px] font-medium text-ink-400">{s.motif} · effet {new Date(`${s.date}T00:00:00`).toLocaleDateString('fr-FR')}</p></div>
              <span className="mono text-sm font-bold text-ink">{fmt(s.net)} FCFA</span>
              <StatusPill tone="amber" dot={false}>Calculé</StatusPill>
              <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'STC', description: `${s.ref} — documents générés (certificat, attestation).` })}>Documents</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
