import { useState } from 'react';
import { Landmark, CheckCircle2, AlertTriangle, FileText, Megaphone, Plus, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { AdminRhSubNav } from '../../components/admin/AdminRhSubNav';
import { useToast } from '../../components/ui/Toast';
import { useM4AdminData } from '../../lib/m4/dataLive';
import { useFileDpae, isBackendConfigured } from '../../lib/m4/supabaseLive';
import { useEmployees } from '../../lib/m1/supabaseLive';
import { useAuth } from '../../lib/auth';
import { DPAE_ORGANISMS, MANDATORY_REGISTERS, MANDATORY_DISPLAYS, EXTERNAL_CONTROLS } from '../../lib/m4/referentiels';
import { employeeById, employeeName } from '../../data/mock';
import { COUNTRIES } from '../../data/countries';
import { cn } from '../../lib/cn';

export function ObligationsPage() {
  const { toast } = useToast();
  const { tenantId } = useAuth();
  const { dpae: DPAE_RECORDS, legalObligations: LEGAL_OBLIGATIONS } = useM4AdminData();
  const fileDpae = useFileDpae();
  const { data: liveEmps } = useEmployees(tenantId ?? undefined);
  const [showDpae, setShowDpae] = useState(false);
  const [dpaeEmpId, setDpaeEmpId] = useState('');
  const [dpaeCountry, setDpaeCountry] = useState('CI');
  const [dpaeHireDate, setDpaeHireDate] = useState(new Date().toISOString().slice(0, 10));
  const [dpaeOrganisme, setDpaeOrganisme] = useState('CNPS');
  const registers = LEGAL_OBLIGATIONS.filter(o => o.kind === 'register');
  const displays = LEGAL_OBLIGATIONS.filter(o => o.kind === 'display');
  const overdue = LEGAL_OBLIGATIONS.filter(o => o.status === 'overdue').length;

  return (
    <div className="animate-fade-up space-y-5">
      <AdminRhSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Obligations légales</h1>
          <p className="text-sm font-medium text-ink-500">DPAE par pays · {MANDATORY_REGISTERS.length} registres · {MANDATORY_DISPLAYS.length} affichages · contrôles externes</p>
        </div>
        <Button size="sm" onClick={() => setShowDpae((v) => !v)}><Plus size={14} /> Déposer une DPAE</Button>
      </div>

      {showDpae && (
        <Card className="border-amber/40">
          <CardHeader
            title="Déclaration préalable à l'embauche (DPAE)"
            subtitle="À déposer auprès de l'organisme social dans les délais légaux"
            action={isBackendConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span> : undefined}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Collaborateur</label>
              {isBackendConfigured && liveEmps && liveEmps.length > 0 ? (
                <select value={dpaeEmpId} onChange={(e) => setDpaeEmpId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                  <option value="">— choisir —</option>
                  {liveEmps.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              ) : (
                <p className="text-[12px] font-medium text-ink-500">Authentification requise.</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Pays</label>
              <select value={dpaeCountry} onChange={(e) => setDpaeCountry(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                {COUNTRIES.filter((c) => c.configured).map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Date d'embauche</label>
              <input type="date" value={dpaeHireDate} onChange={(e) => setDpaeHireDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Organisme</label>
              <input value={dpaeOrganisme} onChange={(e) => setDpaeOrganisme(e.target.value)}
                placeholder="CNPS, IPRES, CNSS…"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={fileDpae.isPending || (isBackendConfigured ? !dpaeEmpId : false)}
              onClick={async () => {
                if (!isBackendConfigured) {
                  setShowDpae(false);
                  toast({ variant: 'info', title: 'DPAE', description: 'DPAE enregistrée (mode démo)' });
                  return;
                }
                try {
                  await fileDpae.mutateAsync({ employeeId: dpaeEmpId, countryCode: dpaeCountry, hireDate: dpaeHireDate, organisme: dpaeOrganisme || 'CNPS' });
                  setShowDpae(false);
                  setDpaeEmpId('');
                  toast({ variant: 'success', title: 'DPAE créée', description: `Déclaration ${dpaeOrganisme || 'CNPS'} enregistrée en statut « à soumettre »` });
                } catch (e) {
                  toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
                }
              }}
            >{fileDpae.isPending ? 'Enregistrement…' : 'Créer la DPAE'}</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowDpae(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="DPAE déposées" value={String(DPAE_RECORDS.filter(d=>d.status==='received').length)} unit="à jour" icon={CheckCircle2} />
        <StatCard label="Registres" value={String(MANDATORY_REGISTERS.length)} unit="obligatoires" icon={FileText} />
        <StatCard label="Affichages" value={String(MANDATORY_DISPLAYS.length)} unit="à maintenir" icon={Megaphone} />
        <StatCard label="Retards" value={String(overdue)} unit="à régulariser" icon={AlertTriangle} tone={overdue ? 'amber' : 'default'} />
      </div>

      <Card>
        <CardHeader title="Organismes DPAE par pays" subtitle="Déclaration préalable à l'embauche · 14 régimes OHADA" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Pays</th><th className="px-3 py-2 text-left">Organisme(s) de référence</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {DPAE_ORGANISMS.map((o) => (
                <tr key={o.countryCode}>
                  <td className="px-3 py-2 mono text-[11px] font-bold text-amber-deep">{o.countryCode}</td>
                  <td className="px-3 py-2 text-[12px] font-medium text-ink-700">{o.organism}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="DPAE déposées" subtitle="Historique embauches · récépissés organismes" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Collab.</th><th className="px-3 py-2 text-left">Pays</th>
              <th className="px-3 py-2 text-left">Organisme</th><th className="px-3 py-2 text-left">Déposée</th>
              <th className="px-3 py-2 text-left">Récépissé</th><th className="px-3 py-2 text-center">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {DPAE_RECORDS.map((d) => {
                const emp = employeeById(d.employeeId)!;
                return (
                  <tr key={d.id}>
                    <td className="px-4 py-2 text-[12px] font-semibold text-ink">{employeeName(emp)}</td>
                    <td className="px-3 py-2 mono text-[11px] font-bold text-amber-deep">{d.countryCode}</td>
                    <td className="px-3 py-2 text-[12px] font-medium text-ink-700">{d.organism}</td>
                    <td className="px-3 py-2 mono text-[11px] font-medium text-ink-700">{d.filedAt}</td>
                    <td className="px-3 py-2 mono text-[11px] font-medium text-ink-500">{d.receiptRef}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone="ok" dot={false}>Reçue</StatusPill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="Registres légaux" subtitle="État de tenue · alertes périodiques" action={<FileText size={16} className="text-ink-400" />} />
          <ul className="space-y-1">
            {registers.map((r) => (
              <li key={r.id} className={cn('flex items-center justify-between rounded-lg px-3 py-1.5 text-[12px] font-medium',
                r.status === 'ok' ? 'bg-surface2/40' : r.status === 'due' ? 'bg-warn/[0.06] text-warn' : 'bg-danger/[0.06] text-danger')}>
                <span>{r.label}</span>
                <StatusPill tone={r.status === 'ok' ? 'ok' : r.status === 'due' ? 'warn' : 'danger'} dot={false}>{r.status === 'ok' ? 'À jour' : r.status === 'due' ? 'À mettre à jour' : 'En retard'}</StatusPill>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Affichages obligatoires" subtitle="Vérification mensuelle" action={<Megaphone size={16} className="text-ink-400" />} />
          <ul className="space-y-1">
            {displays.map((d) => (
              <li key={d.id} className={cn('flex items-center justify-between rounded-lg px-3 py-1.5 text-[12px] font-medium',
                d.status === 'ok' ? 'bg-surface2/40' : 'bg-danger/[0.06] text-danger')}>
                <span>{d.label}</span>
                <StatusPill tone={d.status === 'ok' ? 'ok' : d.status === 'due' ? 'warn' : 'danger'} dot={false}>{d.status === 'ok' ? 'Affiché' : d.status === 'due' ? 'À actualiser' : 'Manquant'}</StatusPill>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Contrôles externes" subtitle="Inspections / audits potentiels" action={<Landmark size={16} className="text-amber-deep" />} />
        <div className="flex flex-wrap gap-1.5">
          {EXTERNAL_CONTROLS.map((c) => <span key={c} className="rounded-md bg-amber/12 px-2 py-1 text-[11px] font-semibold text-amber-deep">{c}</span>)}
        </div>
      </Card>
    </div>
  );
}
