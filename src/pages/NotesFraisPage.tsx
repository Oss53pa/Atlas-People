import { useMemo, useState } from 'react';
import {
  ReceiptText,
  ScanLine,
  Check,
  X,
  Sparkles,
  Car,
  AlertTriangle,
  Clock,
  Wallet,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatCard } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Money } from '../lib/money';
import { checkPolicy, EXPENSE_CATEGORIES, categoryByCode } from '../lib/expenses/policy';
import { detectAnomalies, ANOMALY_LABEL } from '../lib/expenses/anomalies';
import { EXPENSE_CLAIMS, employeeById, employeeName, type ExpenseClaim } from '../data/mock';
import { TENANT_CURRENCY } from '../data/countries';
import { cn } from '../lib/cn';

const BENEFITS = [
  { employeeId: 'e1', kind: 'Voiture de fonction', monthlyValue: 120_000 },
  { employeeId: 'e14', kind: 'Logement', monthlyValue: 200_000 },
  { employeeId: 'e2', kind: 'Carburant', monthlyValue: 45_000 },
];

export function NotesFraisPage() {
  const [claims, setClaims] = useState<ExpenseClaim[]>(EXPENSE_CLAIMS);
  const [category, setCategory] = useState('transport');
  const [amount, setAmount] = useState(0);
  const [hasReceipt, setHasReceipt] = useState(false);
  const [scanned, setScanned] = useState<string | null>(null);

  const anomalies = useMemo(() => detectAnomalies(claims), [claims]);
  const policy = checkPolicy(category, amount);

  const totalReimburse = Money.sum(
    claims.filter((c) => c.status !== 'refused').map((c) => Money.of(c.amount, TENANT_CURRENCY)),
    TENANT_CURRENCY,
  );
  const pendingCount = claims.filter((c) => c.status === 'pending').length;
  const anomalyCount = [...anomalies.keys()].length;
  const taxableBenefits = Money.sum(BENEFITS.map((b) => Money.of(b.monthlyValue, TENANT_CURRENCY)), TENANT_CURRENCY);

  const decide = (id: string, status: 'approved' | 'refused') =>
    setClaims((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));

  const runOcr = () => {
    // OCR simulé (Proph3t) : pré-remplissage depuis le justificatif.
    setCategory('carburant');
    setAmount(18_500);
    setHasReceipt(true);
    setScanned('Total Énergies · 18 500 FCFA · 24/05/2026');
  };

  return (
    <div className="animate-fade-up space-y-6">
      <SectionHeader
        eyebrow="Bloc A · M4"
        title="Notes de frais & avantages"
        description="Per diem, déplacement, carburant — contrôle automatique de la politique, OCR des justificatifs et détection d'anomalies."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="À rembourser" value={`${(totalReimburse.toInt() / 1000).toFixed(0)} k`} unit="XOF" mono icon={Wallet} tone="amber" />
        <StatCard label="En attente" value={String(pendingCount)} unit="notes" icon={Clock} />
        <StatCard label="Anomalies" value={String(anomalyCount)} unit="détectées" icon={AlertTriangle} tone="amber" />
        <StatCard label="Avantages imposables" value={`${(taxableBenefits.toInt() / 1000).toFixed(0)} k`} unit="→ M3" mono icon={Car} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Formulaire */}
        <Card>
          <CardHeader title="Nouvelle note de frais" subtitle="Mobile-first · OCR du justificatif" />
          <Button variant="outline" size="sm" className="mb-3 w-full" onClick={runOcr}>
            <ScanLine size={14} /> Scanner le justificatif (OCR)
          </Button>
          {scanned && (
            <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber/[0.08] px-3 py-2 text-[11px] font-semibold text-amber-deep">
              <Sparkles size={12} /> Extrait : {scanned}
            </p>
          )}
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Catégorie</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mb-3 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
            {EXPENSE_CATEGORIES.map((c) => (<option key={c.code} value={c.code}>{c.label}</option>))}
          </select>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Montant (XOF)</label>
          <input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} placeholder="0" className="mono mb-3 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />

          <div className={cn('rounded-2xl border p-3.5', policy.withinPolicy ? 'border-ok/25 bg-ok/[0.06]' : 'border-danger/30 bg-danger/[0.06]')}>
            <p className={cn('text-sm font-bold', policy.withinPolicy ? 'text-ok' : 'text-danger')}>
              {policy.withinPolicy ? 'Conforme à la politique' : 'Hors politique'}
            </p>
            <p className="mt-0.5 text-[12px] font-medium text-ink-700">{policy.message}</p>
            {policy.requiresReceipt && !hasReceipt && (
              <p className="mt-1 text-[11px] font-semibold text-warn">Justificatif obligatoire au-delà de 10 000 FCFA.</p>
            )}
          </div>
          <Button className="mt-3 w-full" disabled={amount <= 0 || (policy.requiresReceipt && !hasReceipt)}>
            <ReceiptText size={14} /> Soumettre la note
          </Button>
        </Card>

        {/* Liste */}
        <Card className="lg:col-span-2" inset={false}>
          <div className="p-5 pb-3">
            <CardHeader title="Notes de frais" subtitle="Contrôle de politique & anomalies" className="mb-0" />
          </div>
          <div className="divide-y divide-line">
            {claims.map((c) => {
              const emp = employeeById(c.employeeId);
              if (!emp) return null;
              const cat = categoryByCode(c.category);
              const pol = checkPolicy(c.category, c.amount);
              const anos = anomalies.get(c.id) ?? [];
              return (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={employeeName(emp)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-bold text-ink">{employeeName(emp)}</p>
                      {!pol.withinPolicy && <StatusPill tone="danger" dot={false}>Hors plafond</StatusPill>}
                      {anos.map((a) => (
                        <StatusPill key={a} tone="warn" dot={false}>{ANOMALY_LABEL[a]}</StatusPill>
                      ))}
                    </div>
                    <p className="text-[11px] font-medium text-ink-400">
                      {cat.label} · {new Date(c.date).toLocaleDateString('fr-FR')}{c.hasReceipt ? '' : ' · sans justificatif'}
                    </p>
                  </div>
                  <span className="mono text-sm font-bold text-ink">{Money.of(c.amount, TENANT_CURRENCY).format()}</span>
                  {c.status === 'pending' ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => decide(c.id, 'approved')} className="rounded-lg bg-ok/12 p-2 text-ok hover:bg-ok/20"><Check size={15} /></button>
                      <button onClick={() => decide(c.id, 'refused')} className="rounded-lg bg-danger/10 p-2 text-danger hover:bg-danger/20"><X size={15} /></button>
                    </div>
                  ) : (
                    <StatusPill tone={c.status === 'approved' ? 'ok' : 'danger'}>{c.status === 'approved' ? 'Validé' : 'Refusé'}</StatusPill>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Avantages en nature */}
      <Card>
        <CardHeader
          title="Avantages en nature"
          subtitle="Valorisation imposable reportée en paie (M3)"
          action={<StatusPill tone="amber" dot={false}>Reporté → base imposable</StatusPill>}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BENEFITS.map((b, i) => {
            const emp = employeeById(b.employeeId);
            return (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-surface2 p-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><Car size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{b.kind}</p>
                  <p className="truncate text-[11px] font-medium text-ink-400">{emp ? employeeName(emp) : '—'}</p>
                </div>
                <span className="mono text-sm font-bold text-amber-deep">{Money.of(b.monthlyValue, TENANT_CURRENCY).format()}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
