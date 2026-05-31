import { Shield, AlertTriangle, CheckCircle2, Trash2, Download } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { CANDIDATES } from '../../lib/m5/mock';
import { RGPD } from '../../lib/m5/referentiels';

export function RgpdPage() {
  const { toast } = useToast();
  const consented = CANDIDATES.filter(c => c.rgpdConsent).length;
  const total = CANDIDATES.length;
  const expiringSoon = CANDIDATES.filter(c => {
    const days = (new Date(c.rgpdRetentionUntil).getTime() - new Date('2026-05-30').getTime()) / 86_400_000;
    return days <= 90 && days >= 0;
  });
  const expired = CANDIDATES.filter(c => new Date(c.rgpdRetentionUntil) < new Date('2026-05-30'));

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div>
        <h1 className="text-2xl font-semibold text-ink">RGPD candidats</h1>
        <p className="text-sm font-medium text-ink-500">Consentement art. 7 · conservation {RGPD.retentionYears} ans · droit à l'effacement SLA {RGPD.rightToErasureDays} jours</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Candidats consentants" value={`${consented}/${total}`} unit={`${Math.round(consented/total*100)} %`} icon={CheckCircle2} />
        <StatCard label="Conservation expire" value={String(expiringSoon.length)} unit="≤ 90 jours" icon={AlertTriangle} tone={expiringSoon.length ? 'amber' : 'default'} />
        <StatCard label="À anonymiser" value={String(expired.length)} unit="dépassés" icon={Trash2} tone={expired.length ? 'amber' : 'default'} />
        <StatCard label="Demandes effacement" value="0" unit="en cours" icon={Shield} />
      </div>

      <Card>
        <CardHeader title="Principes RGPD appliqués" subtitle="Article 7 (consentement) · article 17 (effacement) · article 20 (portabilité)" action={<Shield size={16} className="text-amber-deep" />} />
        <ul className="grid grid-cols-1 gap-1.5 text-[12px] font-medium text-ink-700 md:grid-cols-2">
          {[
            'Consentement explicite recueilli avant traitement',
            'Information claire sur les finalités et durée',
            `Conservation maximale ${RGPD.retentionYears} ans (candidatures non retenues)`,
            `Anonymisation automatique au-delà de ${RGPD.anonymizationAfterDays} jours`,
            `Droit à l'effacement : SLA ${RGPD.rightToErasureDays} jours`,
            'Droit d\'accès et de rectification gratuit',
            'Portabilité (export JSON structuré)',
            'Chiffrement au repos et en transit',
            'Pas de profilage automatisé sans information',
            'Cookies de tracking carrière : opt-in explicite',
          ].map((p) => <li key={p} className="flex items-start gap-2 rounded-lg bg-ok/[0.06] px-3 py-1.5"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-ok" /> {p}</li>)}
        </ul>
      </Card>

      <Card inset={false}>
        <div className="flex items-center justify-between p-5 pb-2">
          <CardHeader title="Échéances de conservation" subtitle={`Conservation ${RGPD.retentionYears} ans (cron quotidien)`} className="mb-0" />
          <Button size="sm" variant="outline" onClick={() => toast({ variant: 'success', title: 'Anonymisation', description: `${expired.length} candidats anonymisés` })}><Trash2 size={13} /> Anonymiser ({expired.length})</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Référence</th><th className="px-3 py-2 text-left">Consenti le</th>
              <th className="px-3 py-2 text-left">Conservation jusqu'au</th><th className="px-3 py-2 text-center">État</th>
              <th className="px-3 py-2 text-right" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {CANDIDATES.slice(0, 15).map((c) => {
                const days = Math.round((new Date(c.rgpdRetentionUntil).getTime() - new Date('2026-05-30').getTime()) / 86_400_000);
                const status = days < 0 ? 'expired' : days < 90 ? 'expiring' : 'ok';
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-2 mono text-[11px] font-bold text-amber-deep">{c.anonRef}</td>
                    <td className="px-3 py-2 mono text-[11px] font-medium text-ink-700">{c.rgpdConsentAt}</td>
                    <td className="px-3 py-2 mono text-[11px] font-medium text-ink-700">{c.rgpdRetentionUntil} {days >= 0 ? `(J-${days})` : `(+${Math.abs(days)} j)`}</td>
                    <td className="px-3 py-2 text-center">
                      {status === 'expired' ? <StatusPill tone="danger" dot={false}>Anonymiser</StatusPill>
                        : status === 'expiring' ? <StatusPill tone="warn" dot={false}>Bientôt</StatusPill>
                        : <StatusPill tone="ok" dot={false}>OK</StatusPill>}
                    </td>
                    <td className="px-3 py-2 text-right"><Button variant="ghost" size="sm"><Download size={12} /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
