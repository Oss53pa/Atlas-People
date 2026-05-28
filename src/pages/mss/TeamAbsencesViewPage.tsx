import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Plus, Stethoscope, Megaphone, GraduationCap, ShieldCheck } from 'lucide-react';
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
import { scopedTeam } from '../../lib/mss/scope';
import { leaveTypeByCode } from '../../lib/m2/leaveTypes';
import { employeeName, employeeById } from '../../data/mock';

const TODAY = '2026-05-28';
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
function isoAdd(iso: string, n: number) { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

function categoryLabel(code: string): string {
  const cat = leaveTypeByCode(code)?.category;
  return cat === 'health' ? 'Absence santé' : cat === 'special_family' ? 'Congé spécial' : cat === 'delegation' ? 'Délégation' : cat === 'parenthood' ? 'Parentalité' : 'Congé payé';
}
function catIcon(code: string) { const c = leaveTypeByCode(code)?.category; return c === 'health' ? Stethoscope : c === 'delegation' ? Megaphone : c === 'parenthood' ? GraduationCap : Plane; }
function isHealth(code: string) { return leaveTypeByCode(code)?.category === 'health'; }

const TABS = [{ key: 'week', label: 'Cette semaine' }, { key: 'month', label: 'Ce mois' }, { key: 'year', label: 'Cette année' }];

export function TeamAbsencesViewPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const employees = useDirectory((s) => s.employees);
  const allRequests = useTimeOff((s) => s.requests);
  const depth = useManagerScope((s) => s.depth);
  const team = useMemo(() => scopedTeam(depth, employees), [depth, employees]);
  const teamIds = useMemo(() => new Set(team.map((e) => e.id)), [team]);
  const [tab, setTab] = useState('week');

  const horizon = tab === 'week' ? isoAdd(TODAY, 7) : tab === 'month' ? isoAdd(TODAY, 31) : isoAdd(TODAY, 365);
  const lookback = tab === 'week' ? isoAdd(TODAY, -7) : tab === 'month' ? isoAdd(TODAY, -31) : isoAdd(TODAY, -365);

  const reqs = allRequests.filter((r) => teamIds.has(r.employeeId) && r.status !== 'refused');
  const enCours = reqs.filter((r) => r.start <= TODAY && r.end >= TODAY);
  const prochaines = reqs.filter((r) => r.start > TODAY && r.start <= horizon).sort((a, b) => (a.start < b.start ? -1 : 1));
  const recentes = reqs.filter((r) => r.end < TODAY && r.end >= lookback).sort((a, b) => (a.end < b.end ? 1 : -1));

  return (
    <div className="animate-fade-up space-y-5">
      <TeamTimeSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Absences de l'équipe</h1>
        <Link to="/team/temps/absence/new"><Button size="sm"><Plus size={14} /> Saisir une absence</Button></Link>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <Section title="En cours" requests={enCours} emptyLabel="Personne absent actuellement." showReturn />
      <Section title="Prochaines" requests={prochaines} emptyLabel="Aucune absence planifiée sur la période." />
      <Section title="Récentes" requests={recentes} emptyLabel="Aucune absence récente." done />

      <Card className="glass-amber">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Motifs catégoriels uniquement : aucune nature médicale n'est affichée. La saisie manager est réservée aux cas exceptionnels (mission, régularisation, absence constatée) — un arrêt maladie ne peut être saisi que par le médecin / déclaré par le collaborateur.</p>
      </Card>
    </div>
  );
}

function Section({ title, requests, emptyLabel, showReturn, done }: { title: string; requests: ReturnType<typeof useTimeOff.getState>['requests']; emptyLabel: string; showReturn?: boolean; done?: boolean }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={`${requests.length} absence(s)`} action={<Plane size={16} className="text-ink-400" />} />
      {requests.length > 0 ? (
        <div className="space-y-1.5">
          {requests.map((r) => {
            const emp = employeeById(r.employeeId); const Icon = catIcon(r.code);
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                <Avatar name={emp ? employeeName(emp) : '—'} size="xs" />
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10 text-info"><Icon size={14} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{emp ? employeeName(emp) : '—'}</p>
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
