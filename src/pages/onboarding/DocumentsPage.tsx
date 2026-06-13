import { FileText, FileSignature, Download } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { OnboardingSubNav } from '../../components/onboarding/OnboardingSubNav';
import { useM6Data } from '../../lib/m6/dataLive';
import { WELCOME_DOCS } from '../../lib/m6/referentiels';

export function DocumentsPage() {
  const m6 = useM6Data();
  const total = m6.docs.length;
  const signed = m6.docs.filter((d) => d.status === 'signed').length;
  const pending = m6.docs.filter((d) => d.status === 'pending' || d.status === 'sent').length;

  return (
    <div className="animate-fade-up space-y-5">
      <OnboardingSubNav />

      <div>
        <h1 className="text-2xl font-semibold text-ink">Welcome pack & documents</h1>
        <p className="text-sm font-medium text-ink-500">{WELCOME_DOCS.length} documents standardisés · signature ADVIST pour les chartes</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Documents catalogue" value={String(WELCOME_DOCS.length)} unit="standards" icon={FileText} />
        <StatCard label="Avec signature requise" value={String(WELCOME_DOCS.filter(d=>d.signatureRequired).length)} unit="ADVIST" icon={FileSignature} />
        <StatCard label="Signés (toutes campagnes)" value={String(signed)} unit={`/${total}`} icon={FileSignature} />
        <StatCard label="À traiter" value={String(pending)} unit="en attente" icon={FileText} tone={pending ? 'amber' : 'default'} />
      </div>

      <Card>
        <CardHeader title="Catalogue welcome pack" subtitle="Documents envoyés à chaque arrivant" />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {WELCOME_DOCS.map((d) => (
            <div key={d.code} className="rounded-xl border border-line bg-surface2/40 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-bold text-ink">{d.label}</p>
                  <p className="mono mt-0.5 text-[10px] font-medium text-amber-deep">{d.code}</p>
                </div>
                {d.signatureRequired && <span className="rounded-md bg-amber/12 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-deep">signature</span>}
              </div>
              <p className="mt-1 text-[10px] font-medium text-ink-500">Catégorie : {d.category}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Suivi de diffusion" subtitle="Tous les envois (limité à 50 récents)" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Document</th>
              <th className="px-3 py-2 text-left">Parcours</th>
              <th className="px-3 py-2 text-left">Envoyé le</th>
              <th className="px-3 py-2 text-left">Signé le</th>
              <th className="px-3 py-2 text-center">Statut</th>
              <th className="px-3 py-2 text-right" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {m6.docs.filter(d => m6.journeys.find(j => j.id === d.journeyId)?.status === 'in_progress').slice(0, 30).map((d) => {
                const doc = WELCOME_DOCS.find((x) => x.code === d.docCode)!;
                const j = m6.journeys.find((jj) => jj.id === d.journeyId);
                return (
                  <tr key={d.id}>
                    <td className="px-4 py-2 text-[12px] font-semibold text-ink">{doc.label}</td>
                    <td className="px-3 py-2 mono text-[11px] font-bold text-amber-deep">{j?.ref}</td>
                    <td className="px-3 py-2 mono text-[11px] font-medium text-ink-700">{d.sentAt ?? '—'}</td>
                    <td className="px-3 py-2 mono text-[11px] font-medium text-ink-700">{d.signedAt ?? '—'}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={d.status === 'signed' ? 'ok' : d.status === 'read' ? 'amber' : 'neutral'} dot={false}>{d.status}</StatusPill></td>
                    <td className="px-3 py-2 text-right"><button className="rounded-lg p-1 text-ink-400 hover:bg-ink/[0.05] hover:text-ink"><Download size={13} /></button></td>
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
