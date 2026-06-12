import { Link } from 'react-router-dom';
import { Gift, Users, DollarSign, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { useM5Data } from '../../lib/m5/dataLive';
import { employeeById, employeeName } from '../../data/mock';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

export function CooptationPage() {
  const m5 = useM5Data();
  const { toast } = useToast();
  const totalBonus = m5.referrals.reduce((s, r) => s + r.bonusAmount, 0);
  const inPipe = m5.referrals.filter(r => r.status === 'in_pipeline' || r.status === 'submitted');
  const hired = m5.referrals.filter(r => r.status === 'hired' || r.status === 'paid');

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Programme de cooptation</h1>
          <p className="text-sm font-medium text-ink-500">Primes selon poste · versement après période d'essai validée · suivi cooptants</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Cooptation', description: 'Formulaire cooptation envoyé' })}><Gift size={14} /> Coopter un talent</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="En pipeline" value={String(inPipe.length)} unit="actifs" icon={Users} tone="amber" />
        <StatCard label="Embauchés via cooptation" value={String(hired.length)} unit="12 mois" icon={CheckCircle2} />
        <StatCard label="Primes engagées" value={fmt(totalBonus)} unit="enveloppe" icon={DollarSign} mono />
        <StatCard label="Coût moyen / hire" value={fmt(Math.round(totalBonus / Math.max(1, m5.referrals.length)))} unit="cooptation" icon={DollarSign} mono />
      </div>

      <Card>
        <CardHeader title="Politique de cooptation Atlas" subtitle="Grille de primes par niveau de poste" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Bonus level="Junior / stage" amount={150_000} />
          <Bonus level="Confirmé" amount={250_000} />
          <Bonus level="Senior / Lead" amount={350_000} />
          <Bonus level="Manager / Director" amount={600_000} />
        </div>
        <p className="mt-3 text-[11px] font-medium text-ink-500">Versement : 50 % à la signature du contrat · 50 % après validation de la période d'essai. Anti-fraude : pas de cooptation d'un proche en lien hiérarchique direct.</p>
      </Card>

      <Card>
        <CardHeader title="Cooptations en cours" />
        <div className="space-y-2">
          {m5.referrals.map((r) => {
            const cand = m5.candidateById(r.candidateId)!;
            const job = m5.jobById(r.jobId)!;
            const ref = employeeById(r.referrerEmployeeId)!;
            return (
              <div key={r.id} className="rounded-xl border border-line bg-surface2/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={`${cand.firstName} ${cand.lastName}`} size="sm" />
                    <div>
                      <p className="text-[13px] font-bold text-ink">{cand.firstName} {cand.lastName} <span className="text-[11px] font-medium text-ink-500">→ {job.title}</span></p>
                      <p className="text-[11px] font-medium text-ink-500">Coopté par <b>{employeeName(ref)}</b> ({ref.role}) · {r.submittedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">{fmt(r.bonusAmount)}</span>
                    <StatusPill tone={r.status === 'hired' || r.status === 'paid' ? 'ok' : r.status === 'rejected' ? 'danger' : 'amber'} dot={false}>{r.status}</StatusPill>
                  </div>
                </div>
                <div className="mt-2"><Link to={`/recrutement/candidats/${cand.id}`}><Button variant="ghost" size="sm">Suivre la candidature <ArrowUpRight size={12} /></Button></Link></div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Bonus({ level, amount }: { level: string; amount: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface2/40 p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{level}</p>
      <p className="mono mt-1 text-base font-bold text-amber-deep">{fmt(amount)}</p>
    </div>
  );
}
