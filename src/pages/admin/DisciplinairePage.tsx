import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gavel, Lock, AlertTriangle, ShieldCheck, ArrowUpRight, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { AdminRhSubNav } from '../../components/admin/AdminRhSubNav';
import { useM4AdminData } from '../../lib/m4/dataLive';
import { useCreateDisciplinaryCase, isBackendConfigured } from '../../lib/m4/supabaseLive';
import { useEmployees } from '../../lib/m1/supabaseLive';
import { useAuth } from '../../lib/auth';
import { SANCTION_SCALE, DISCIPLINARY_PROCEDURE_STEPS, DISCIPLINARY_RECOURS, FAUTE_META } from '../../lib/m4/referentiels';
import { employeeById, employeeName } from '../../data/mock';

export function DisciplinairePage() {
  const { toast } = useToast();
  const { tenantId } = useAuth();
  const { disciplinary: DISCIPLINARY } = useM4AdminData();
  const createCase = useCreateDisciplinaryCase();
  const { data: liveEmps } = useEmployees(tenantId ?? undefined);
  const [showForm, setShowForm] = useState(false);
  const [discEmpId, setDiscEmpId] = useState('');
  const [discFacts, setDiscFacts] = useState('');
  const [discDate, setDiscDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="animate-fade-up space-y-5">
      <AdminRhSubNav />

      <Card className="border-danger/30 bg-danger/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/15 text-danger"><Lock size={18} /></span>
            <div>
              <h1 className="text-xl font-bold text-danger">Procédures disciplinaires</h1>
              <p className="text-[12px] font-medium text-ink-500">Accès STRICTEMENT restreint — DRH + Juriste social · toute consultation tracée</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Gavel size={14} /> {showForm ? 'Annuler' : 'Initier une procédure'}
          </Button>
        </div>
      </Card>

      {showForm && (
        <Card className="border-danger/30">
          <CardHeader
            title="Ouverture de procédure disciplinaire"
            subtitle="4-eyes DRH + Juriste social · audit SHA-256"
            action={isBackendConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span> : undefined}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Collaborateur</label>
              {isBackendConfigured && liveEmps && liveEmps.length > 0 ? (
                <select
                  value={discEmpId}
                  onChange={(e) => setDiscEmpId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-danger/40 focus:outline-none"
                >
                  <option value="">— choisir —</option>
                  {liveEmps.map((e) => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-[12px] font-medium text-ink-500">Authentification requise pour sélectionner un collaborateur.</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Date des faits</label>
              <input
                type="date"
                value={discDate}
                onChange={(e) => setDiscDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-danger/40 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Description des faits</label>
              <textarea
                value={discFacts}
                onChange={(e) => setDiscFacts(e.target.value)}
                rows={2}
                placeholder="Décrire les faits reprochés…"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink focus:border-danger/40 focus:outline-none resize-none"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={createCase.isPending || (isBackendConfigured ? (!discEmpId || !discFacts.trim()) : false)}
              onClick={async () => {
                if (!isBackendConfigured) {
                  setShowForm(false);
                  toast({ variant: 'info', title: 'Procédure', description: 'Ouverture procédure (mode démo — 4-eyes DRH+Juriste)' });
                  return;
                }
                try {
                  await createCase.mutateAsync({ employeeId: discEmpId, factsDate: discDate, factsDescription: discFacts.trim() });
                  setShowForm(false);
                  setDiscEmpId('');
                  setDiscFacts('');
                  setDiscDate(new Date().toISOString().slice(0, 10));
                  toast({ variant: 'success', title: 'Procédure ouverte', description: 'Dossier créé — délai de prescription calculé automatiquement.' });
                } catch (e) {
                  toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
                }
              }}
            >
              {createCase.isPending ? 'Enregistrement…' : 'Ouvrir la procédure'}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Actives" value={String(DISCIPLINARY.filter(d=>d.status!=='closed').length)} unit="en cours" icon={Gavel} tone="amber" />
        <StatCard label="Historique" value={String(DISCIPLINARY.length)} unit="procédures" icon={ShieldCheck} />
        <StatCard label="Échelle sanctions" value={String(SANCTION_SCALE.length)} unit="niveaux" icon={AlertTriangle} />
        <StatCard label="Étapes OHADA" value={String(DISCIPLINARY_PROCEDURE_STEPS.length)} unit="procédure" icon={Lock} />
      </div>

      <Card>
        <CardHeader title="Procédure OHADA" subtitle="Délais légaux stricts — non-respect = nullité" />
        <ol className="space-y-1.5">
          {DISCIPLINARY_PROCEDURE_STEPS.map((s, i) => (
            <li key={s.code} className="flex items-center gap-2 rounded-lg bg-surface2/40 px-3 py-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber/15 text-[11px] font-bold text-amber-deep">{i + 1}</span>
              <span className="flex-1 text-[13px] font-semibold text-ink">{s.label}</span>
              <span className="text-[11px] font-medium text-warn">{s.legalDelay}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[11px] font-medium text-ink-400">Voies de recours mentionnées systématiquement dans la notification : {DISCIPLINARY_RECOURS.join(' · ')}.</p>
      </Card>

      <Card>
        <CardHeader title="Échelle des sanctions (10 niveaux)" subtitle="Mineure → Maximum · proportionnalité requise" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">#</th><th className="px-3 py-2 text-left">Sanction</th>
              <th className="px-3 py-2 text-left">Gravité</th><th className="px-3 py-2 text-center">Entretien</th>
              <th className="px-3 py-2 text-right">Effacement</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {SANCTION_SCALE.map((s) => (
                <tr key={s.rank}>
                  <td className="px-3 py-2 mono text-[11px] font-bold text-amber-deep">{s.rank}</td>
                  <td className="px-3 py-2 text-[12px] font-semibold text-ink">{s.label}</td>
                  <td className="px-3 py-2"><span className="rounded-md bg-ink/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase">{s.severity}</span></td>
                  <td className="px-3 py-2 text-center text-[12px]">{s.needsHearing ? '✅' : '—'}</td>
                  <td className="px-3 py-2 text-right text-[12px] font-medium">{s.retentionYears === 0 ? 'non inscrit' : `${s.retentionYears} ans`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Qualification de la faute" subtitle="Faute simple / grave / lourde" />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {Object.entries(FAUTE_META).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="text-[12px] font-bold text-ink">{v.label}</p>
              <p className="mt-1 text-[11px] font-medium text-ink-500">{v.preavis}</p>
              <p className="mt-0.5 text-[11px] font-medium text-ink-500">{v.indemnite}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Procédures actives & historique" subtitle="Effacement automatique 3 ans (avert./blâme), 5 ans (mise à pied), 30 ans (licenciement faute)" />
        {DISCIPLINARY.length === 0 ? <p className="py-4 text-center text-[13px] font-medium text-ink-400">Aucune procédure dans le périmètre.</p>
          : DISCIPLINARY.map((d) => {
            const emp = employeeById(d.employeeId)!;
            return (
              <div key={d.id} className="rounded-xl border border-line bg-surface2/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2"><Avatar name={employeeName(emp)} size="sm" /><div>
                    <p className="text-[13px] font-bold text-ink">{employeeName(emp)} · {emp.role}</p>
                    <p className="text-[11px] font-medium text-ink-500">{d.ref} · Ouverte le {d.openedAt} · Faute {d.faute}</p>
                  </div></div>
                  <div className="flex items-center gap-2">
                    {d.sanction && <StatusPill tone="warn" dot={false}>{SANCTION_SCALE.find(s => s.code === d.sanction)?.label ?? d.sanction}</StatusPill>}
                    <StatusPill tone={d.status === 'closed' ? 'ok' : 'amber'} dot={false}>{d.status === 'closed' ? 'Clos' : d.status}</StatusPill>
                  </div>
                </div>
                <p className="mt-2 text-[12px] font-medium text-ink-700">Motif : {d.motif}</p>
                {d.effacementDate && <p className="mt-1 text-[11px] font-medium text-ink-400">Effacement automatique : {d.effacementDate}</p>}
                <div className="mt-2"><Link to={`/collaborateurs/${emp.id}`}><Button variant="ghost" size="sm">Ouvrir dossier (onglet Disciplinaire) <ArrowUpRight size={12} /></Button></Link></div>
              </div>
            );
          })}
      </Card>
    </div>
  );
}
