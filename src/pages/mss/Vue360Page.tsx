import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, MessageSquare, Target, GraduationCap, Calendar, Inbox, History,
  User, EyeOff, ShieldCheck, ChevronDown, Plane, Award, BadgeCheck, MoreHorizontal,
  Sparkles, TrendingUp,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { StatusPill } from '../../components/ui/StatusPill';
import { useSurface } from '../../store/useSurface';
import { useDirectory } from '../../store/useDirectory';
import { useTimeOff } from '../../store/useTimeOff';
import { useServiceRequests } from '../../store/useServiceRequests';
import { isInScope, reportsOf } from '../../lib/mss/scope';
import { leaveTypeByCode } from '../../lib/m2/leaveTypes';
import {
  employeeById, employeeName, matricule, employeeLeaveBalance, employeeTimeline,
  employeeCareer, employeeSkillSet, employeeAuthorizations, employeeCertifications,
  employeeMedicalFollowup, managerIdOf, type EmployeeRecord,
} from '../../data/mock';
import { cn } from '../../lib/cn';

const TODAY = '2026-05-28';
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');

/** Catégorie d'absence sans jamais exposer la nature médicale (R5/R7). */
function absenceLabel(code: string): string {
  const cat = leaveTypeByCode(code)?.category;
  return cat === 'health' ? 'Absence santé' : cat === 'special_family' ? 'Congé spécial' : cat === 'parenthood' ? 'Parentalité' : cat === 'delegation' ? 'Délégation' : 'Congé payé';
}

/** Indicateurs RH déterministes (démo) — jamais de calcul LLM. */
function perf(e: EmployeeRecord) {
  const seed = e.id.charCodeAt(1) + (e.id.charCodeAt(2) || 0);
  return {
    okr: 45 + (seed % 50),
    objectives: 3 + (seed % 3),
    lastOneOnOne: `2026-0${(seed % 4) + 1}-${10 + (seed % 15)}`,
    rating: ['À développer', 'Conforme', 'Solide', 'Excellence'][seed % 4],
  };
}

const TABS = [
  { key: 'synthese', label: 'Synthèse', icon: User },
  { key: 'parcours', label: 'Parcours', icon: History },
  { key: 'performance', label: 'Performance', icon: Target },
  { key: 'developpement', label: 'Développement', icon: GraduationCap },
  { key: 'temps', label: 'Temps & absences', icon: Calendar },
  { key: 'demandes', label: 'Demandes', icon: Inbox },
  { key: 'historique', label: 'Historique', icon: History },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const STATUS_META: Record<EmployeeRecord['status'], { label: string; tone: 'ok' | 'info' | 'warn' | 'danger' }> = {
  active: { label: 'Actif', tone: 'ok' },
  onboarding: { label: 'Intégration', tone: 'info' },
  leave: { label: 'Absent', tone: 'warn' },
  notice: { label: 'Préavis', tone: 'danger' },
};

/** EQ.2 — Vue 360° collaborateur (cf. 03_MON_EQUIPE). Périmètre strict (R8) :
 *  hors cascade → accès refusé. Aucune donnée rémunération/famille/médicale (R2-R7). */
export function Vue360Page() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { id = '' } = useParams();
  const employees = useDirectory((s) => s.employees);
  const [tab, setTab] = useState<TabKey>('synthese');
  const [actionsOpen, setActionsOpen] = useState(false);

  const e = employeeById(id);
  const inScope = e ? isInScope(id, 'all', employees) : false;

  if (!e || !inScope) {
    return (
      <div className="animate-fade-up space-y-5">
        <Link to="/team/equipe" className="inline-flex items-center gap-1.5 text-sm font-semibold text-info hover:underline"><ArrowLeft size={15} /> Retour à l'annuaire</Link>
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger"><EyeOff size={26} /></span>
          <p className="text-sm font-semibold text-ink">Collaborateur hors de votre périmètre</p>
          <p className="max-w-md text-sm font-medium text-ink-500">Vous ne pouvez consulter que les membres de votre cascade managériale (R8). Cet accès n'est pas autorisé.</p>
        </Card>
      </div>
    );
  }

  const st = STATUS_META[e.status];
  const mgrId = managerIdOf(e);
  const mgr = mgrId ? employeeById(mgrId) : undefined;
  const subordinates = reportsOf(e.id, employees);

  return (
    <div className="animate-fade-up space-y-5">
      <Link to="/team/equipe" className="inline-flex items-center gap-1.5 text-sm font-semibold text-info hover:underline"><ArrowLeft size={15} /> Retour à l'annuaire</Link>

      {/* En-tête identité */}
      <Card className="border-info/20 bg-gradient-to-br from-info/[0.06] to-transparent">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={employeeName(e)} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-ink">{employeeName(e)}</h1>
                <StatusPill tone={st.tone} dot>{st.label}</StatusPill>
              </div>
              <p className="mt-0.5 text-sm font-medium text-ink-500">{e.role} · {e.department}</p>
              <p className="mt-0.5 text-[11px] font-medium text-ink-400">
                {matricule(e)} · {e.contractType} · entré le {frDate(e.hireDate)}{mgr ? ` · rattaché à ${employeeName(mgr)}` : ''}{subordinates.length > 0 ? ` · encadre ${subordinates.length}` : ''}
              </p>
            </div>
          </div>
          <div className="relative shrink-0">
            <Button variant="primary" size="sm" onClick={() => setActionsOpen((o) => !o)}>Actions <ChevronDown size={14} /></Button>
            {actionsOpen && (
              <div className="absolute right-0 z-10 mt-1.5 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-lg" onMouseLeave={() => setActionsOpen(false)}>
                {[
                  { icon: MessageSquare, label: 'Lancer un 1:1' },
                  { icon: Sparkles, label: 'Donner du feedback' },
                  { icon: Target, label: 'Définir un objectif' },
                  { icon: GraduationCap, label: 'Proposer une formation' },
                ].map((a) => {
                  const Icon = a.icon;
                  return (
                    <button key={a.label} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-ink-700 transition-colors hover:bg-info/[0.06]">
                      <Icon size={15} className="text-info" /> {a.label}
                    </button>
                  );
                })}
                <div className="my-1 border-t border-line/70" />
                <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-ink-500 transition-colors hover:bg-ink/[0.04]">
                  <MoreHorizontal size={15} /> Escalader vers les RH
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Onglets */}
      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                tab === t.key ? 'bg-info/12 text-info ring-1 ring-info/30' : 'text-ink-500 hover:bg-ink/[0.04] hover:text-ink')}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </nav>

      {tab === 'synthese' && <SyntheseTab e={e} />}
      {tab === 'parcours' && <ParcoursTab e={e} />}
      {tab === 'performance' && <PerformanceTab e={e} />}
      {tab === 'developpement' && <DeveloppementTab e={e} />}
      {tab === 'temps' && <TempsTab e={e} />}
      {tab === 'demandes' && <DemandesTab e={e} />}
      {tab === 'historique' && <HistoriqueTab e={e} />}

      <p className="px-2 text-center text-[11px] font-medium text-ink-400">
        Vue managériale · périmètre strict (R8) · aucune rémunération, donnée familiale ou médicale (R2-R7) · consultation tracée (source_surface = mss).
      </p>
    </div>
  );
}

/** Bandeau permanent listant ce que le manager NE voit PAS (R2-R7, transparence). */
function PrivacyPanel() {
  const items = ['Rémunération & bulletins de paie', 'Coordonnées de versement (Mobile Money / RIB)', 'Situation familiale & personnes à charge', 'Nature médicale des absences & diagnostics', 'Dossier disciplinaire & vie privée'];
  return (
    <Card className="border-ink/10 bg-ink/[0.02]">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink/[0.06] text-ink-400"><EyeOff size={16} /></span>
        <div>
          <p className="text-sm font-semibold text-ink">Informations non-visibles pour le manager</p>
          <p className="mt-0.5 text-[11px] font-medium text-ink-400">Conformément au périmètre managérial strict, ces données ne vous sont jamais accessibles :</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {items.map((it) => <li key={it} className="rounded-full bg-ink/[0.04] px-2.5 py-1 text-[11px] font-semibold text-ink-500">{it}</li>)}
          </ul>
        </div>
      </div>
    </Card>
  );
}

/** Aptitude OPÉRATIONNELLE uniquement — jamais de nature médicale (R7). */
function AptitudePanel({ e }: { e: EmployeeRecord }) {
  const m = employeeMedicalFollowup(e);
  return (
    <Card>
      <CardHeader title="Aptitude opérationnelle" subtitle="Restrictions de poste — sans nature médicale" action={<ShieldCheck size={16} className="text-info" />} />
      <div className="flex items-center gap-2">
        <StatusPill tone={m.restrictions.length ? 'warn' : 'ok'} dot>{m.aptitudeLabel}</StatusPill>
        {m.validUntil && <span className="text-[11px] font-medium text-ink-400">valide jusqu'au {frDate(m.validUntil)}</span>}
      </div>
      {m.restrictions.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {m.restrictions.map((r) => (
            <li key={r} className="flex items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700"><ShieldCheck size={14} className="text-info" /> {r}</li>
          ))}
        </ul>
      ) : <p className="mt-3 text-sm font-medium text-ink-400">Aucune restriction de poste — aptitude pleine et entière.</p>}
    </Card>
  );
}

function SyntheseTab({ e }: { e: EmployeeRecord }) {
  const bal = employeeLeaveBalance(e);
  const p = perf(e);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Repères clés" subtitle="Synthèse managériale" action={<User size={16} className="text-ink-400" />} />
          <dl className="grid grid-cols-2 gap-3">
            {[
              ['Solde congés', `${bal.remaining} j`],
              ['Avancement OKR', `${p.okr}%`],
              ['Dernier 1:1', frDate(p.lastOneOnOne)],
              ['Appréciation', p.rating],
              ['Ancienneté', `${new Date(TODAY).getFullYear() - new Date(e.hireDate).getFullYear()} ans`],
              ['Contrat', e.contractType],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-surface2 px-3 py-2.5">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{k}</dt>
                <dd className="mt-0.5 text-sm font-bold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <AptitudePanel e={e} />
      </div>
      <PrivacyPanel />
    </div>
  );
}

function ParcoursTab({ e }: { e: EmployeeRecord }) {
  const steps = employeeCareer(e);
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Parcours dans l'entreprise" subtitle="Étapes de carrière internes" action={<TrendingUp size={16} className="text-ink-400" />} />
        <ol className="relative space-y-4 border-l border-line pl-5">
          {steps.map((s, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[1.45rem] top-1 h-2.5 w-2.5 rounded-full bg-info ring-4 ring-info/15" />
              <p className="text-sm font-semibold text-ink">{s.title}</p>
              <p className="text-[11px] font-medium text-ink-400">{frDate(s.date)} · {s.type === 'promotion' ? 'Promotion' : s.type === 'mobility' ? 'Mobilité' : 'Embauche'}</p>
            </li>
          ))}
        </ol>
      </Card>
      <PrivacyPanel />
    </div>
  );
}

function PerformanceTab({ e }: { e: EmployeeRecord }) {
  const p = perf(e);
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Performance & objectifs" subtitle="OKR cascadés et appréciation" action={<Target size={16} className="text-ink-400" />} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface2 px-3 py-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Avancement OKR</p><p className="mt-1 text-2xl font-bold text-ink">{p.okr}%</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]"><div className="h-full rounded-full bg-info" style={{ width: `${p.okr}%` }} /></div>
          </div>
          <div className="rounded-xl bg-surface2 px-3 py-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Objectifs actifs</p><p className="mt-1 text-2xl font-bold text-ink">{p.objectives}</p></div>
          <div className="rounded-xl bg-surface2 px-3 py-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Appréciation</p><p className="mt-1 text-lg font-bold text-ink">{p.rating}</p></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/team/performance"><Button variant="outline" size="sm"><Target size={14} /> Objectifs équipe</Button></Link>
          <Button variant="outline" size="sm"><MessageSquare size={14} /> Planifier un 1:1</Button>
        </div>
      </Card>
      <PrivacyPanel />
    </div>
  );
}

function DeveloppementTab({ e }: { e: EmployeeRecord }) {
  const skills = employeeSkillSet(e);
  const auths = employeeAuthorizations(e);
  const certs = employeeCertifications(e);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Compétences" subtitle="Niveau auto-évalué (1 à 5)" action={<GraduationCap size={16} className="text-ink-400" />} />
          <div className="space-y-2.5">
            {skills.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-ink">{s.name}</span><span className="text-[11px] font-bold text-ink-400">{s.level}/5</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]"><div className="h-full rounded-full bg-info" style={{ width: `${(s.level / 5) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Habilitations & certifications" subtitle="Validité opérationnelle" action={<Award size={16} className="text-ink-400" />} />
          <div className="space-y-1.5">
            {auths.map((a) => (
              <div key={a.code} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                <BadgeCheck size={15} className={a.status === 'active' ? 'text-ok' : 'text-danger'} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{a.label}</p><p className="text-[11px] font-medium text-ink-400">{a.category} · échéance {frDate(a.expiry)}</p></div>
                <StatusPill tone={a.status === 'active' ? 'ok' : 'danger'} dot={false}>{a.status === 'active' ? 'Valide' : 'Expirée'}</StatusPill>
              </div>
            ))}
            {certs.map((c) => (
              <div key={c.label} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                <Award size={15} className="text-info" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{c.label}</p><p className="text-[11px] font-medium text-ink-400">{c.certifier}{c.expiry ? ` · échéance ${frDate(c.expiry)}` : ''}</p></div>
              </div>
            ))}
            {auths.length === 0 && certs.length === 0 && <p className="text-sm font-medium text-ink-400">Aucune habilitation enregistrée.</p>}
          </div>
        </Card>
      </div>
      <PrivacyPanel />
    </div>
  );
}

function TempsTab({ e }: { e: EmployeeRecord }) {
  const all = useTimeOff((s) => s.requests);
  const bal = employeeLeaveBalance(e);
  const requests = useMemo(() => all.filter((r) => r.employeeId === e.id).sort((a, b) => (a.start < b.start ? 1 : -1)), [all, e.id]);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[['Acquis', bal.acquired], ['Pris', bal.taken], ['Solde', bal.remaining]].map(([k, v]) => (
          <div key={k as string} className="rounded-2xl border border-line bg-surface px-3 py-3 text-center"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{k}</p><p className="mt-1 text-2xl font-bold text-ink">{v} j</p></div>
        ))}
      </div>
      <Card>
        <CardHeader title="Congés & absences" subtitle="Sans nature médicale (R7)" action={<Plane size={16} className="text-ink-400" />} />
        {requests.length > 0 ? (
          <div className="space-y-1.5">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2">
                <div><p className="text-sm font-semibold text-ink">{absenceLabel(r.code)}</p><p className="text-[11px] font-medium text-ink-400">{frDate(r.start)} → {frDate(r.end)} · {r.countedDays} j</p></div>
                <StatusPill tone={r.status === 'approved' ? 'ok' : r.status === 'refused' ? 'danger' : 'warn'} dot={false}>{r.status === 'approved' ? 'Validé' : r.status === 'refused' ? 'Refusé' : 'En attente'}</StatusPill>
              </div>
            ))}
          </div>
        ) : <p className="text-sm font-medium text-ink-400">Aucune absence enregistrée.</p>}
      </Card>
      <PrivacyPanel />
    </div>
  );
}

function DemandesTab({ e }: { e: EmployeeRecord }) {
  const byEmployee = useServiceRequests((s) => s.byEmployee);
  // R6 : seules les demandes du ressort managérial (carrière, temps) sont visibles.
  const reqs = byEmployee(e.id).filter((r) => r.category === 'career' || r.category === 'time');
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Demandes en cours" subtitle="Sollicitations du ressort managérial" action={<Inbox size={16} className="text-ink-400" />} />
        {reqs.length > 0 ? (
          <div className="space-y-1.5">
            {reqs.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2">
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{r.typeLabel}</p><p className="text-[11px] font-medium text-ink-400">{r.reference} · {frDate(r.createdAt)}</p></div>
                <StatusPill tone={r.status === 'resolved' || r.status === 'closed' ? 'ok' : r.status === 'refused' ? 'danger' : 'warn'} dot={false}>{r.status === 'in_progress' ? 'En cours' : r.status === 'info_requested' ? 'Info demandée' : r.status === 'resolved' ? 'Résolue' : r.status === 'submitted' ? 'Soumise' : r.status}</StatusPill>
              </div>
            ))}
          </div>
        ) : <p className="text-sm font-medium text-ink-400">Aucune demande de votre ressort en cours.</p>}
      </Card>
      <PrivacyPanel />
    </div>
  );
}

function HistoriqueTab({ e }: { e: EmployeeRecord }) {
  const events = employeeTimeline(e);
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Historique des interactions" subtitle="Événements managériaux du dossier" action={<History size={16} className="text-ink-400" />} />
        <ol className="relative space-y-4 border-l border-line pl-5">
          {events.map((ev, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[1.45rem] top-1 h-2.5 w-2.5 rounded-full bg-info ring-4 ring-info/15" />
              <p className="text-sm font-semibold text-ink">{ev.label}</p>
              <p className="text-[11px] font-medium text-ink-400">{frDate(ev.date)}</p>
            </li>
          ))}
        </ol>
      </Card>
      <PrivacyPanel />
    </div>
  );
}
