import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShieldCheck, Calendar, Vote, ArrowUpRight, Plus, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { AdminRhSubNav } from '../../components/admin/AdminRhSubNav';
import { useToast } from '../../components/ui/Toast';
import { useM4AdminData } from '../../lib/m4/dataLive';
import { useCreateRepresentationMandate, isBackendConfigured } from '../../lib/m4/supabaseLive';
import { useEmployees } from '../../lib/m1/supabaseLive';
import { useAuth } from '../../lib/auth';
import { MANDATE_TYPES, ELECTION_PHASES } from '../../lib/m4/referentiels';
import { employeeById, employeeName } from '../../data/mock';

export function RepresentationPage() {
  const { toast } = useToast();
  const { tenantId } = useAuth();
  const { mandates: MANDATES, elections: ELECTIONS } = useM4AdminData();
  const createMandate = useCreateRepresentationMandate();
  const { data: liveEmps } = useEmployees(tenantId ?? undefined);
  const [showForm, setShowForm] = useState(false);
  const [mEmpId, setMEmpId] = useState('');
  const [mType, setMType] = useState(MANDATE_TYPES[0]?.code ?? 'DP_TITULAIRE');
  const [mMode, setMMode] = useState<'elu' | 'designe'>('elu');
  const [mStart, setMStart] = useState(new Date().toISOString().slice(0, 10));
  const [mEnd, setMEnd] = useState('');
  const [mHours, setMHours] = useState('');
  return (
    <div className="animate-fade-up space-y-5">
      <AdminRhSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Représentation du personnel</h1>
          <p className="text-sm font-medium text-ink-500">DP · CSE · CHSCT · délégué syndical · 11 phases d'élection · statut protégé enforcé</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}><Plus size={14} /> {showForm ? 'Fermer' : 'Nouveau mandat'}</Button>
      </div>

      {showForm && (
        <Card className="border-amber/40">
          <CardHeader
            title="Enregistrer un mandat de représentation"
            subtitle="Statut protégé activé automatiquement jusqu'à la fin du mandat"
            action={isBackendConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><Wifi size={9} /> Live</span> : undefined}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Représentant</label>
              {isBackendConfigured && liveEmps && liveEmps.length > 0 ? (
                <select value={mEmpId} onChange={(e) => setMEmpId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                  <option value="">— choisir —</option>
                  {liveEmps.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              ) : (
                <p className="text-[12px] font-medium text-ink-500">Authentification requise.</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Type de mandat</label>
              <select value={mType} onChange={(e) => setMType(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                {MANDATE_TYPES.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Mode de désignation</label>
              <select value={mMode} onChange={(e) => setMMode(e.target.value as 'elu' | 'designe')}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                <option value="elu">Élu</option>
                <option value="designe">Désigné</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Début de mandat</label>
              <input type="date" value={mStart} onChange={(e) => setMStart(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Fin de mandat (optionnel)</label>
              <input type="date" value={mEnd} onChange={(e) => setMEnd(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Heures de délégation/mois</label>
              <input type="number" value={mHours} onChange={(e) => setMHours(e.target.value)} min={0} placeholder="ex. 15"
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={createMandate.isPending || (isBackendConfigured ? !mEmpId : false)}
              onClick={async () => {
                if (!isBackendConfigured) {
                  setShowForm(false);
                  toast({ variant: 'info', title: 'Mandat', description: 'Mandat enregistré (mode démo)' });
                  return;
                }
                try {
                  await createMandate.mutateAsync({ employeeId: mEmpId, type: mType, mode: mMode, startDate: mStart, endDate: mEnd || undefined, delegationHours: mHours ? Number(mHours) : undefined });
                  setShowForm(false);
                  setMEmpId('');
                  setMHours('');
                  toast({ variant: 'success', title: 'Mandat créé', description: `Mandat ${mType} enregistré · statut protégé activé` });
                } catch (e) {
                  toast({ variant: 'error', title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
                }
              }}
            >{createMandate.isPending ? 'Enregistrement…' : 'Enregistrer le mandat'}</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Mandats actifs" value={String(MANDATES.filter(m=>m.status==='active').length)} unit="en cours" icon={Users} />
        <StatCard label="Types de mandats" value={String(MANDATE_TYPES.length)} unit="catalogue" icon={Vote} />
        <StatCard label="Élections" value={String(ELECTIONS.length)} unit="cycles" icon={Calendar} />
        <StatCard label="Statut protégé" value={String(MANDATES.filter(m=>m.protectedUntil).length)} unit="techn. enforced" icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="Mandats actifs" subtitle="DP/CSE/référents · heures de délégation" />
          {MANDATES.filter(m => m.status === 'active').length === 0 ? <p className="py-4 text-center text-[13px] font-medium text-ink-400">Aucun mandat actif.</p>
            : MANDATES.filter(m => m.status === 'active').map((m) => {
              const emp = employeeById(m.employeeId)!;
              return (
                <div key={m.id} className="rounded-xl border border-amber/25 bg-amber/[0.05] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><Avatar name={employeeName(emp)} size="sm" /><div>
                      <p className="text-[13px] font-bold text-ink">{employeeName(emp)}</p>
                      <p className="text-[11px] font-medium text-ink-500">{m.type} · {m.mode === 'elu' ? 'élu' : 'désigné'}</p>
                    </div></div>
                    <Link to={`/collaborateurs/${emp.id}`}><Button variant="ghost" size="sm">Dossier <ArrowUpRight size={12} /></Button></Link>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] font-medium text-ink-700">
                    <span>Début : <b>{m.start}</b></span>
                    {m.end && <span>Fin : <b>{m.end}</b></span>}
                    {m.delegationHours ? <span>Heures délég. : <b>{m.delegationHours} h/mois</b></span> : null}
                    {m.protectedUntil && <span className="text-warn"><ShieldCheck size={11} className="inline" /> Protégé jusqu'au {m.protectedUntil}</span>}
                  </div>
                </div>
              );
            })}
        </Card>

        <Card>
          <CardHeader title="Élections" subtitle="Cycles électoraux planifiés / passés" />
          {ELECTIONS.map((e) => (
            <div key={e.id} className="rounded-xl border border-line bg-surface2/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-ink">{e.instance} · {e.societe}</p>
                <StatusPill tone={e.phase === 'closed' ? 'ok' : 'amber'} dot={false}>{e.phase}</StatusPill>
              </div>
              <p className="mt-1 text-[11px] font-medium text-ink-700">Date prévue : <b>{e.scheduledDate}</b> · {e.seats} sièges {e.turnout ? `· participation ${e.turnout} %` : ''}</p>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <CardHeader title="Phases d'élection (référentiel)" subtitle="11 étapes — du lancement à la prise de fonctions" />
        <ol className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {ELECTION_PHASES.map((p, i) => (
            <li key={p.code} className="flex items-center gap-2 rounded-lg bg-surface2/40 px-3 py-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber/15 text-[11px] font-bold text-amber-deep">{i + 1}</span>
              <span className="flex-1 text-[12px] font-semibold text-ink">{p.label}</span>
              <span className="mono text-[10px] font-bold text-ink-400">{p.day}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <CardHeader title="Types de mandats" subtitle="Seuils · durée terme · règles" />
        <table className="w-full text-sm">
          <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            <th className="px-3 py-2 text-left">Code</th><th className="px-3 py-2 text-left">Libellé</th>
            <th className="px-3 py-2 text-left">Seuil</th><th className="px-3 py-2 text-right">Terme</th>
          </tr></thead>
          <tbody className="divide-y divide-line">
            {MANDATE_TYPES.map((m) => (
              <tr key={m.code}>
                <td className="px-3 py-2 mono text-[11px] font-bold text-amber-deep">{m.code}</td>
                <td className="px-3 py-2 text-[12px] font-semibold text-ink">{m.label}</td>
                <td className="px-3 py-2 text-[12px] font-medium text-ink-700">{m.threshold}</td>
                <td className="px-3 py-2 text-right mono text-[12px] font-medium text-ink-700">{m.termYears > 0 ? `${m.termYears} ans` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
