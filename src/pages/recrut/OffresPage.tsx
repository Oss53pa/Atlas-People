import { Link } from 'react-router-dom';
import { Mail, FileSignature, CheckCircle2, XCircle, Clock, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { APPLICATIONS, OFFERS, candidateById, jobById } from '../../lib/m5/mock';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

export function OffresPage() {
  const { toast } = useToast();

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Offres</h1>
          <p className="text-sm font-medium text-ink-500">Cycle de vie offre · négociation · signature ADVIST · validité automatique</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Offre', description: 'Wizard nouvelle offre' })}>+ Nouvelle offre</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Brouillons" value={String(OFFERS.filter(o=>o.status==='draft').length)} unit="à finaliser" icon={Mail} />
        <StatCard label="Envoyées" value={String(OFFERS.filter(o=>o.status==='sent').length)} unit="en attente" icon={Clock} tone="amber" />
        <StatCard label="Négociation" value={String(OFFERS.filter(o=>o.status==='negotiating').length)} unit="à closer" icon={AlertTriangle} tone="amber" />
        <StatCard label="Acceptées" value={String(OFFERS.filter(o=>o.status==='accepted').length)} unit="hires" icon={CheckCircle2} />
        <StatCard label="Refusées" value={String(OFFERS.filter(o=>o.status==='declined').length)} unit="lost" icon={XCircle} />
      </div>

      <div className="space-y-3">
        {OFFERS.map((o) => {
          const ap = APPLICATIONS.find((a) => a.id === o.applicationId);
          const cand = ap && candidateById(ap.candidateId);
          const job = ap && jobById(ap.jobId);
          if (!cand || !job) return null;
          const tone = o.status === 'accepted' ? 'ok' : o.status === 'declined' ? 'danger' : o.status === 'negotiating' ? 'warn' : 'amber';
          return (
            <Card key={o.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar name={`${cand.firstName} ${cand.lastName}`} size="sm" />
                  <div>
                    <p className="text-[13px] font-bold text-ink">{cand.firstName} {cand.lastName} <span className="ml-2 text-[11px] font-medium text-ink-500">→ {job.title}</span></p>
                    <p className="mono mt-0.5 text-[11px] font-medium text-ink-400">{o.ref} · démarrage {o.startDate} · valide jusqu'au {o.validUntil}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={tone} dot>{o.status}</StatusPill>
                  {o.signatureWorkflow && <span className="mono rounded-md bg-info/10 px-2 py-0.5 text-[10px] font-bold uppercase text-info"><FileSignature size={9} className="inline" /> {o.signatureWorkflow.replace('advist_', '')}</span>}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Mini label="Type contrat" value={o.contractType} />
                <Mini label="Salaire base" value={fmt(o.baseSalary)} />
                <Mini label="Indemnités" value={fmt(o.allowancesTotal)} />
                <Mini label="Package annuel" value={fmt(o.totalPackage)} mono />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Link to={`/recrutement/candidats/${cand.id}`}><Button variant="outline" size="sm">Profil <ArrowUpRight size={12} /></Button></Link>
                {o.status === 'sent' && <Button variant="ghost" size="sm">Relancer</Button>}
                {o.status === 'negotiating' && <Button variant="ghost" size="sm">Mettre à jour</Button>}
                {o.status === 'accepted' && <Link to="/recrutement/integration"><Button variant="ghost" size="sm">Vers intégration <ArrowUpRight size={12} /></Button></Link>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface2/40 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className={mono ? 'mono mt-0.5 text-[13px] font-bold text-amber-deep' : 'mt-0.5 text-[13px] font-bold text-ink'}>{value}</p>
    </div>
  );
}
