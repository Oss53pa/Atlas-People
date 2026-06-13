import { Link } from 'react-router-dom';
import { Users, ShieldCheck, Calendar, Vote, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { AdminRhSubNav } from '../../components/admin/AdminRhSubNav';
import { useM4AdminData } from '../../lib/m4/dataLive';
import { MANDATE_TYPES, ELECTION_PHASES } from '../../lib/m4/referentiels';
import { employeeById, employeeName } from '../../data/mock';

export function RepresentationPage() {
  const { mandates: MANDATES, elections: ELECTIONS } = useM4AdminData();
  return (
    <div className="animate-fade-up space-y-5">
      <AdminRhSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Représentation du personnel</h1>
          <p className="text-sm font-medium text-ink-500">DP · CSE · CHSCT · délégué syndical · 11 phases d'élection · statut protégé enforcé</p>
        </div>
      </div>

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
