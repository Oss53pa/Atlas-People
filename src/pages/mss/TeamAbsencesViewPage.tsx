import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Plus, Stethoscope, Megaphone, GraduationCap, ShieldCheck, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/feedback';
import { TeamTimeSubNav } from '../../components/m2/TeamTimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useTimeOff } from '../../store/useTimeOff';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeam, useManagerId } from '../../lib/mss/scope';
import { leaveTypeByCode } from '../../lib/m2/leaveTypes';
import { employeeName, employeeById } from '../../data/mock';
import { isBackendConfigured, useAllLeaveRequests, useTeamDirectory, dirName, type MssApprovalRow } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const TODAY = new Date().toISOString().slice(0, 10);
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
function isoAdd(iso: string, n: number) { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

function categoryLabel(code: string): string {
  const cat = leaveTypeByCode(code)?.category;
  return cat === 'health' ? 'Absence santé' : cat === 'special_family' ? 'Congé spécial' : cat === 'delegation' ? 'Délégation' : cat === 'parenthood' ? 'Parentalité' : 'Congé payé';
}
function catIcon(code: string) { const c = leaveTypeByCode(code)?.category; return c === 'health' ? Stethoscope : c === 'delegation' ? Megaphone : c === 'parenthood' ? GraduationCap : Plane; }
function isHealth(code: string) { return leaveTypeByCode(code)?.category === 'health'; }

const TABS = [{ key: 'week', label: 'Cette semaine' }, { key: 'month', label: 'Ce mois' }, { key: 'year', label: 'Cette année' }];

type SectionReq = { id: string; employeeId: string; start: string; end: string; code: string; status: string; countedDays: number };

const adaptLeaf = (r: MssApprovalRow): SectionReq => ({
  id: r.id, employeeId: r.employee_id, start: r.start_date, end: r.end_date,
  code: r.leave_type_code, status: r.status, countedDays: r.counted_days ?? 0,
});

export function TeamAbsencesViewPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const managerId = useManagerId();
  const employees = useDirectory((s) => s.employees);
  const allRequests = useTimeOff((s) => s.requests);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees, managerId), [depth, employees, managerId]);
  const teamIds = useMemo(() => new Set(team.map((e) => e.id)), [team]);
  const [tab, setTab] = useState('week');

  // Live layer
  const { data: ctx } = useSessionContext();
  const { data: rawLeaves } = useAllLeaveRequests(ctx?.tenantId);
  const { data: liveDir } = useTeamDirectory(ctx?.tenantId);
  const hasLive = isBackendConfigured && Boolean(ctx?.tenantId);

  const nameMap = useMemo(() => {
    if (!liveDir) return undefined;
    return new Map(liveDir.map(d => [d.id, dirName(d)]));
  }, [liveDir]);

  const horizon = tab === 'week' ? isoAdd(TODAY, 7) : tab === 'month' ? isoAdd(TODAY, 31) : isoAdd(TODAY, 365);
  const lookback = tab === 'week' ? isoAdd(TODAY, -7) : tab === 'month' ? isoAdd(TODAY, -31) : isoAdd(TODAY, -365);

  // Mock path
  const mockReqs = allRequests.filter((r) => teamIds.has(r.employeeId) && r.status !== 'refused');
  const mockEnCours = mockReqs.filter((r) => r.start <= TODAY && r.end >= TODAY);
  const mockProchaines = mockReqs.filter((r) => r.start > TODAY && r.start <= horizon).sort((a, b) => (a.start < b.start ? -1 : 1));
  const mockRecentes = mockReqs.filter((r) => r.end < TODAY && r.end >= lookback).sort((a, b) => (a.end < b.end ? 1 : -1));

  // Live path
  const liveReqs = hasLive ? (rawLeaves ?? []).filter(r => r.status !== 'refused') : [];
  const liveEnCours: SectionReq[] = liveReqs.filter(r => r.start_date <= TODAY && r.end_date >= TODAY).map(adaptLeaf);
  const liveProchaines: SectionReq[] = liveReqs.filter(r => r.start_date > TODAY && r.start_date <= horizon).sort((a, b) => a.start_date < b.start_date ? -1 : 1).map(adaptLeaf);
  const liveRecentes: SectionReq[] = liveReqs.filter(r => r.end_date < TODAY && r.end_date >= lookback).sort((a, b) => a.end_date < b.end_date ? 1 : -1).map(adaptLeaf);

  const enCours = hasLive ? liveEnCours : (mockEnCours as unknown as SectionReq[]);
  const prochaines = hasLive ? liveProchaines : (mockProchaines as unknown as SectionReq[]);
  const recentes = hasLive ? liveRecentes : (mockRecentes as unknown as SectionReq[]);

  return (
    <div className="animate-fade-up space-y-5">
      <TeamTimeSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-ink">Absences de l'équipe</h1>
          {hasLive && <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>}
        </div>
        <Link to="/team/temps/absence/new"><Button size="sm"><Plus size={14} /> Saisir une absence</Button></Link>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <Section title="En cours" requests={enCours} emptyLabel="Personne absent actuellement." showReturn nameMap={nameMap} />
      <Section title="Prochaines" requests={prochaines} emptyLabel="Aucune absence planifiée sur la période." nameMap={nameMap} />
      <Section title="Récentes" requests={recentes} emptyLabel="Aucune absence récente." done nameMap={nameMap} />

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Motifs catégoriels uniquement : aucune nature médicale n'est affichée. La saisie manager est réservée aux cas exceptionnels (mission, régularisation, absence constatée) — un arrêt maladie ne peut être saisi que par le médecin / déclaré par le collaborateur.</p>
      </Card>
    </div>
  );
}

function Section({ title, requests, emptyLabel, showReturn, done, nameMap }: { title: string; requests: SectionReq[]; emptyLabel: string; showReturn?: boolean; done?: boolean; nameMap?: Map<string, string> }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={`${requests.length} absence(s)`} action={<Plane size={16} className="text-ink-400" />} />
      {requests.length > 0 ? (
        <div className="space-y-1.5">
          {requests.map((r) => {
            const emp = nameMap ? undefined : employeeById(r.employeeId);
            const displayName = nameMap ? (nameMap.get(r.employeeId) ?? '—') : (emp ? employeeName(emp) : '—');
            const Icon = catIcon(r.code);
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                <Avatar name={displayName} size="xs" />
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10 text-info"><Icon size={14} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                  <p className="truncate text-[11px] font-medium text-ink-400">{categoryLabel(r.code)} · {frDate(r.start)} → {frDate(r.end)}{isHealth(r.code) ? ' · détail médical confidentiel' : ''}</p>
                </div>
                {done ? <StatusPill tone="ok" dot={false}>{r.countedDays} j</StatusPill>
                  : showReturn ? <span className="text-[11px] font-semibold text-ink-500">retour {frDate(isoAdd(r.end, 1))}</span>
                  : <StatusPill tone={r.status === 'approved' ? 'ok' : 'warn'} dot={false}>{r.status === 'approved' ? 'Approuvé' : 'En attente'}</StatusPill>}
              </div>
            );
          })}
        </div>
      ) : <EmptyState icon={Plane} title="Rien à afficher" description={emptyLabel} />}
    </Card>
  );
}
