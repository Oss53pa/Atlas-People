import { useMemo, useState } from 'react';
import { Stamp, Search, CheckCircle2, FileText, Sparkles, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { AdminRhSubNav } from '../../components/admin/AdminRhSubNav';
import { useM4AdminData } from '../../lib/m4/dataLive';
import { useGenerateHrDocument, isBackendConfigured } from '../../lib/m4/supabaseLive';
import { useEmployees } from '../../lib/m1/supabaseLive';
import { useAuth } from '../../lib/auth';
import { CERTIFICATE_TYPES } from '../../lib/m4/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import type { CertificateCategory } from '../../lib/m4/types';
import { cn } from '../../lib/cn';
import { useRoster } from '../../lib/m1/roster';

const CAT_LABEL: Record<CertificateCategory, string> = { certificat: 'Certificats légaux', attestation: 'Attestations', lettre: 'Courriers RH' };

export function CertificatsPage() {
  const { toast } = useToast();
  const { tenantId } = useAuth();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'all' | CertificateCategory>('all');
  const [pickedType, setPickedType] = useState<string | null>(null);
  const [genEmpId, setGenEmpId] = useState('');
  const roster = useRoster();
  const { certificates: CERTIFICATES } = useM4AdminData();
  const generateDoc = useGenerateHrDocument();
  const { data: liveEmps } = useEmployees(tenantId ?? undefined);

  const types = useMemo(() => CERTIFICATE_TYPES.filter((t) => {
    if (cat !== 'all' && t.category !== cat) return false;
    if (q && !`${t.label} ${t.code}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, cat]);

  return (
    <div className="animate-fade-up space-y-5">
      <AdminRhSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Certificats & attestations</h1>
          <p className="text-sm font-medium text-ink-500">Bibliothèque {CERTIFICATE_TYPES.length}+ documents · génération DocJourney · signature DRH ADVIST · 2FA</p>
        </div>
        <Button size="sm" onClick={() => { setPickedType(CERTIFICATE_TYPES[0]?.code ?? null); }}><Stamp size={14} /> Générer un document</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Modèles" value={String(CERTIFICATE_TYPES.length)} unit="bibliothèque" icon={FileText} />
        <StatCard label="Légaux obligatoires" value={String(CERTIFICATE_TYPES.filter(t=>t.requiresSignature).length)} unit="signature DRH" icon={CheckCircle2} />
        <StatCard label="Émis (cumul)" value={String(CERTIFICATES.length)} unit="historique" icon={Stamp} />
        <StatCard label="À signer" value={String(CERTIFICATES.filter(c=>c.status==='draft' || c.status==='generated').length)} unit="DRH ADVIST" icon={Sparkles} tone="amber" />
      </div>

      <Card>
        <CardHeader title="Bibliothèque de modèles" subtitle="Cliquer pour pré-remplir et générer · cherche par code ou libellé" />
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un modèle…" className="h-9 w-56 rounded-lg border border-line bg-surface2 pl-8 pr-2 text-[13px] font-medium text-ink focus:border-amber/40 focus:outline-none" />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1 text-[12px] font-semibold">
            {(['all','certificat','attestation','lettre'] as const).map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn('rounded-md px-2 py-0.5', cat === c ? 'bg-amber/12 text-amber-deep' : 'text-ink-500')}>
                {c === 'all' ? 'Tous' : CAT_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((t) => (
            <button key={t.code} onClick={() => setPickedType(t.code)}
              className={cn('rounded-xl border px-3 py-2.5 text-left transition-colors',
                pickedType === t.code ? 'border-amber/50 bg-amber/[0.08]' : 'border-line bg-surface2/40 hover:bg-amber/[0.04]')}>
              <p className="text-[12px] font-semibold text-ink">{t.label}</p>
              <p className="mt-0.5 mono text-[10px] font-medium text-ink-400">{t.code} · {CAT_LABEL[t.category]}</p>
              {t.requiresSignature && <span className="mt-1 inline-block rounded-md bg-amber/12 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-deep">Signature DRH</span>}
            </button>
          ))}
        </div>
        {pickedType && (
          <div className="mt-3 rounded-xl border border-amber/40 bg-amber/[0.06] p-3 space-y-2">
            <p className="text-[12px] font-bold text-ink">
              Génération : {CERTIFICATE_TYPES.find(t => t.code === pickedType)?.label}
              {isBackendConfigured && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span>}
            </p>
            {isBackendConfigured && liveEmps && liveEmps.length > 0 ? (
              <select
                value={genEmpId}
                onChange={(e) => setGenEmpId(e.target.value)}
                className="h-9 w-full max-w-xs rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none"
              >
                <option value="">— choisir un collaborateur —</option>
                {liveEmps.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
              </select>
            ) : (
              <p className="text-[11px] font-medium text-ink-500">Sélectionner un collaborateur parmi les {roster.length} pour pré-remplir, valider, signer ADVIST puis livrer.</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={generateDoc.isPending || (isBackendConfigured ? !genEmpId : false)}
                onClick={async () => {
                  if (!isBackendConfigured) {
                    toast({ variant: 'success', title: 'Brouillon', description: `${CERTIFICATE_TYPES.find(t => t.code === pickedType)?.label} prêt à signer (mode démo)` });
                    setPickedType(null);
                    return;
                  }
                  try {
                    await generateDoc.mutateAsync({ docType: pickedType, employeeId: genEmpId });
                    setPickedType(null);
                    setGenEmpId('');
                    toast({ variant: 'success', title: 'Document généré', description: `${CERTIFICATE_TYPES.find(t => t.code === pickedType)?.label} — en attente de signature DRH` });
                  } catch (e) {
                    toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
                  }
                }}
              >
                {generateDoc.isPending ? 'Génération…' : 'Démarrer la génération'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setPickedType(null); setGenEmpId(''); }}>Annuler</Button>
            </div>
          </div>
        )}
      </Card>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Documents émis (historique)" subtitle={`${CERTIFICATES.length} documents · audit chaîné`} className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Réf.</th>
              <th className="px-3 py-2 text-left">Collab.</th><th className="px-3 py-2 text-left">Document</th>
              <th className="px-3 py-2 text-center">Catégorie</th><th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {CERTIFICATES.slice(0, 30).map((c) => {
                const emp = employeeById(c.employeeId)!;
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-2 mono text-[11px] font-medium text-ink-700">{c.generatedAt}</td>
                    <td className="px-3 py-2 mono text-[11px] font-bold text-amber-deep">{c.ref}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-1.5"><Avatar name={employeeName(emp)} size="xs" /><span className="text-[12px] font-semibold text-ink">{employeeName(emp)}</span></div></td>
                    <td className="px-3 py-2 text-[12px] font-medium text-ink-700">{c.typeLabel}</td>
                    <td className="px-3 py-2 text-center text-[11px] font-medium text-ink-500">{CAT_LABEL[c.category]}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={c.status === 'delivered' ? 'ok' : c.status === 'signed' ? 'ok' : 'amber'} dot={false}>{c.status}</StatusPill></td>
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
