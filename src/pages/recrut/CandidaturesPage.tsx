import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { KanbanSquare, Filter, Search } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { APPLICATIONS, JOBS, candidateById, jobById, stageMeta } from '../../lib/m5/mock';
import { ACTIVE_STAGES } from '../../lib/m5/referentiels';
import { cn } from '../../lib/cn';

export function CandidaturesPage() {
  const [jobF, setJobF] = useState<'all' | string>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => APPLICATIONS.filter((a) => {
    if (!ACTIVE_STAGES.includes(a.stage)) return false;
    if (jobF !== 'all' && a.jobId !== jobF) return false;
    if (q) {
      const c = candidateById(a.candidateId);
      const j = jobById(a.jobId);
      const text = `${c?.firstName} ${c?.lastName} ${c?.currentRole} ${j?.title}`.toLowerCase();
      if (!text.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [jobF, q]);

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Pipeline de candidatures</h1>
          <p className="text-sm font-medium text-ink-500">Kanban · {filtered.length} candidatures actives · cliquer pour ouvrir profil</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher candidat ou poste…" className="h-9 w-72 rounded-lg border border-line bg-surface2 pl-8 pr-2 text-[13px] font-medium text-ink focus:border-amber/40 focus:outline-none" />
          </div>
          <select value={jobF} onChange={(e) => setJobF(e.target.value)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
            <option value="all">Tous les postes</option>
            {JOBS.filter(j => j.status === 'open' || j.status === 'on_hold').map(j => <option key={j.id} value={j.id}>{j.title.slice(0, 40)}</option>)}
          </select>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-400"><Filter size={12} /> 6 colonnes</span>
        </div>
      </div>

      {/* KANBAN — 6 colonnes ACTIVE_STAGES */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ACTIVE_STAGES.map((s) => {
          const items = filtered.filter((a) => a.stage === s);
          const m = stageMeta(s);
          return (
            <div key={s} className="flex w-72 shrink-0 flex-col gap-2">
              <div className={cn('flex items-center justify-between rounded-xl px-3 py-2 text-[12px] font-bold uppercase tracking-wider',
                m.tone === 'ok' ? 'bg-ok/10 text-ok' : m.tone === 'amber' ? 'bg-amber/15 text-amber-deep' : m.tone === 'warn' ? 'bg-warn/10 text-warn' : m.tone === 'info' ? 'bg-info/10 text-info' : 'bg-ink/[0.06] text-ink-700')}>
                <span>{m.label}</span>
                <span className="mono">{items.length}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {items.map((a) => {
                  const cand = candidateById(a.candidateId);
                  const job = jobById(a.jobId);
                  if (!cand || !job) return null;
                  const days = Math.round((new Date('2026-05-30').getTime() - new Date(a.stageEnteredAt).getTime()) / 86_400_000);
                  return (
                    <Link key={a.id} to={`/recrutement/candidats/${cand.id}`}
                      className="rounded-xl border border-line bg-surface px-3 py-2 transition-colors hover:border-amber/40 hover:bg-amber/[0.04]">
                      <div className="flex items-center gap-2">
                        <Avatar name={`${cand.firstName} ${cand.lastName}`} size="xs" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-ink">{cand.firstName} {cand.lastName}</p>
                          <p className="truncate text-[10px] font-medium text-ink-400">{cand.currentRole}</p>
                        </div>
                        {a.score && <span className="mono shrink-0 rounded-md bg-amber/12 px-1.5 py-0.5 text-[10px] font-bold text-amber-deep">{a.score}</span>}
                      </div>
                      <p className="mt-1 truncate text-[10px] font-medium text-ink-500">→ {job.title}</p>
                      <p className="mt-0.5 flex items-center justify-between text-[9px] font-medium text-ink-400">
                        <span>{cand.source}</span>
                        <span>{days >= 7 ? <span className="font-bold text-warn">{days}j</span> : `${days}j`}</span>
                      </p>
                    </Link>
                  );
                })}
                {items.length === 0 && <p className="rounded-xl bg-surface2/30 px-3 py-3 text-center text-[11px] font-medium text-ink-400">—</p>}
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Étapes finales" subtitle="Embauchés / refusés / retirés (lecture)" action={<KanbanSquare size={16} className="text-ink-400" />} />
        <div className="grid grid-cols-3 gap-3">
          {(['hired', 'rejected', 'withdrawn'] as const).map((s) => {
            const items = APPLICATIONS.filter((a) => a.stage === s && (jobF === 'all' || a.jobId === jobF));
            const m = stageMeta(s);
            return (
              <div key={s} className="rounded-xl border border-line bg-surface2/30 p-3">
                <div className="flex items-center justify-between">
                  <p className={cn('text-[11px] font-bold uppercase tracking-wider', m.tone === 'ok' ? 'text-ok' : m.tone === 'danger' ? 'text-danger' : 'text-ink-500')}>{m.label}</p>
                  <span className="mono text-sm font-bold text-ink">{items.length}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-[11px] font-medium text-ink-400">
        Cards ordonnées par étape · drag&drop activable côté store (mock). Tout mouvement déclenche un audit événement {`{stage_changed}`}.
      </p>
    </div>
  );
}
