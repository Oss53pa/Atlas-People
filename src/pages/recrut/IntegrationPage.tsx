import { Link } from 'react-router-dom';
import { Rocket, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { useM5Data } from '../../lib/m5/dataLive';

export function IntegrationPage() {
  const m5 = useM5Data();
  const { toast } = useToast();
  const accepted = m5.offers.filter((o) => o.status === 'accepted');
  const hiredApps = m5.applications.filter((a) => a.stage === 'hired');

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Intégration & passage M6</h1>
          <p className="text-sm font-medium text-ink-500">Candidats embauchés · création contrat (M4) · démarrage onboarding (M6) · ouverture dossier paie (M3)</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Handoff', description: 'Handoff vers onboarding lancé' })}><Rocket size={14} /> Lancer onboarding</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Offres acceptées" value={String(accepted.length)} unit="à intégrer" icon={CheckCircle2} />
        <StatCard label="Hires confirmés" value={String(hiredApps.length)} unit="closed" icon={Rocket} />
        <StatCard label="En onboarding" value="3" unit="cours" icon={Rocket} tone="amber" />
        <StatCard label="J-7 démarrages" value="1" unit="cette sem." icon={Rocket} />
      </div>

      <Card>
        <CardHeader title="Pipeline d'intégration" subtitle="Étapes du handoff Recrutement → Admin RH → Onboarding → Paie" />
        <ol className="grid grid-cols-1 gap-2 lg:grid-cols-5">
          {[
            { n: 1, label: 'Offre acceptée', detail: 'M5 → notification' },
            { n: 2, label: 'Création contrat', detail: 'M4 wizard contrat' },
            { n: 3, label: 'Signature ADVIST', detail: 'employeur + employé' },
            { n: 4, label: 'Dossier paie', detail: 'M3 paramétrage' },
            { n: 5, label: 'Onboarding 90 j', detail: 'M6 parcours' },
          ].map((s) => (
            <li key={s.n} className="rounded-xl border border-line bg-surface2/40 p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber/15 text-[11px] font-bold text-amber-deep">{s.n}</span>
                <p className="text-[12px] font-bold text-ink">{s.label}</p>
              </div>
              <p className="mt-1 text-[10px] font-medium text-ink-500">{s.detail}</p>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <CardHeader title="Candidats à intégrer" subtitle="Offres acceptées · contrats à créer dans M4" />
        {accepted.length === 0 ? <p className="py-3 text-center text-[12px] font-medium text-ink-400">Aucune offre acceptée en attente d'intégration.</p>
          : accepted.map((o) => {
            const ap = m5.applications.find((a) => a.id === o.applicationId);
            const cand = ap && m5.candidateById(ap.candidateId);
            const job = ap && m5.jobById(ap.jobId);
            if (!cand || !job) return null;
            return (
              <div key={o.id} className="rounded-xl border border-ok/25 bg-ok/[0.05] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={`${cand.firstName} ${cand.lastName}`} size="sm" />
                    <div>
                      <p className="text-[13px] font-bold text-ink">{cand.firstName} {cand.lastName} <span className="ml-2 text-[11px] font-medium text-ink-500">→ {job.title}</span></p>
                      <p className="text-[11px] font-medium text-ink-500">Démarrage prévu : <b>{o.startDate}</b> · {o.contractType}</p>
                    </div>
                  </div>
                  <StatusPill tone="ok" dot>Acceptée</StatusPill>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Link to="/collaborateurs/nouveau"><Button variant="outline" size="sm">Créer contrat (M4) <ExternalLink size={12} /></Button></Link>
                  <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'success', title: 'Onboarding M6', description: 'Parcours 90 jours créé' })}><Rocket size={12} /> Lancer onboarding</Button>
                  <Link to={`/recrutement/candidats/${cand.id}`}><Button variant="ghost" size="sm">Profil <ArrowRight size={12} /></Button></Link>
                </div>
              </div>
            );
          })}
      </Card>

      <p className="text-[11px] font-medium text-ink-400">L'intégration déclenche automatiquement : création dossier collaborateur (M1), génération contrat (M4), DPAE auprès de la CNPS/IPRES, programmation visite médicale (M12), paramétrage dossier paie (M3) et parcours onboarding 90 jours (M6).</p>
    </div>
  );
}
