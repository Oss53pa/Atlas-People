import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSignature, CalendarClock, Hourglass, Gavel, Users, Globe2, Stamp, Landmark,
  AlertTriangle, ArrowUpRight, ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { AdminRhSubNav } from '../../components/admin/AdminRhSubNav';
import { ALERTS, CONTRACTS, DISCIPLINARY, EXPATS, MANDATES, cockpitKPIs } from '../../lib/m4/mock';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';
import { useRoster } from '../../lib/m1/roster';

const KIND_ICON = { cdd: FileSignature, probation: Hourglass, expat: Globe2, mandate: Users, habilitation: Stamp, medical: ShieldCheck, disciplinary: Gavel } as const;

export function CockpitAdminRhPage() {
  const kpi = useMemo(() => cockpitKPIs(), []);
  const roster = useRoster();
  const [filter, setFilter] = useState<'all' | 'danger' | 'warn'>('all');
  const alerts = useMemo(() => (filter === 'all' ? ALERTS : ALERTS.filter((a) => a.severity === filter)), [filter]);

  const upcoming = useMemo(
    () => ALERTS.slice(0, 10).map((a) => ({
      date: a.dueDate,
      label: `${a.message} · ${employeeById(a.employeeId)?.lastName ?? ''}`,
      href: `/collaborateurs/${a.employeeId}`,
    })),
    [],
  );

  const probationCount = roster.filter((e) => e.probationEnd).length;

  const quickAccess = [
    { to: '/hr/actes/contrats', label: 'Contrats', count: CONTRACTS.length, icon: FileSignature },
    { to: '/hr/actes/periode-essai', label: "Période d'essai", count: probationCount, icon: Hourglass },
    { to: '/hr/actes/disciplinaire', label: 'Disciplinaire', count: DISCIPLINARY.length, icon: Gavel },
    { to: '/hr/actes/certificats', label: 'Certificats', count: 30, icon: Stamp },
    { to: '/hr/actes/representation', label: 'Représentation', count: MANDATES.filter((m) => m.status === 'active').length, icon: Users },
    { to: '/hr/actes/obligations', label: 'Obligations légales', count: 14, icon: Landmark },
    { to: '/hr/actes/expatries', label: 'Expatriés', count: EXPATS.length, icon: Globe2 },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <AdminRhSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Actes & conformité</h1>
          <p className="text-sm font-medium text-ink-500">Actes contractuels, disciplinaire, représentation & obligations légales OHADA · 14 régimes UEMOA/CEMAC</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/hr/actes/contrats"><Button variant="outline" size="sm"><FileSignature size={14} /> Contrats</Button></Link>
          <Link to="/hr/actes/certificats"><Button size="sm"><Stamp size={14} /> Générer un document</Button></Link>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-line bg-surface2/50 px-3 py-2 text-[11px] font-medium text-ink-500">
        <ArrowUpRight size={13} className="mt-0.5 shrink-0 text-amber-deep" />
        Le dossier 360°, les avenants et les départs se gèrent dans <Link to="/collaborateurs" className="font-semibold text-amber-deep hover:underline">Collaborateurs</Link>. Ce module couvre les actes & obligations transverses.
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Contrats actifs" value={String(kpi.contratsActifs)} unit="signés ADVIST" icon={FileSignature} />
        <StatCard label="CDD à surveiller" value={String(kpi.cddActifs)} unit="échéances" icon={CalendarClock} tone="amber" />
        <StatCard label="Procédures disciplinaires" value={String(kpi.procedureDisc)} unit="actives" icon={Gavel} tone={kpi.procedureDisc ? 'amber' : 'default'} />
        <StatCard label="Mandats actifs" value={String(kpi.mandatsActifs)} unit="DP/CSE/référents" icon={Users} />
        <StatCard label="Expatriés" value={String(kpi.expatActifs)} unit="missions" icon={Globe2} />
        <StatCard label="Périodes d'essai" value={String(probationCount)} unit="en cours" icon={Hourglass} />
        <StatCard label="Alertes critiques" value={String(kpi.alertesCritiques)} unit="à traiter" icon={AlertTriangle} tone={kpi.alertesCritiques ? 'amber' : 'default'} />
        <StatCard label="Conformité OHADA" value="96" unit="/ 100" icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card inset={false}>
          <div className="flex items-center justify-between p-5 pb-2">
            <CardHeader title="Alertes prioritaires" subtitle={`${ALERTS.length} actives · ouvre le dossier collaborateur`} className="mb-0" />
            <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1 text-[12px] font-semibold">
              {(['all', 'danger', 'warn'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn('rounded-md px-2 py-0.5', filter === f ? 'bg-amber/12 text-amber-deep' : 'text-ink-500')}>
                  {f === 'all' ? 'Toutes' : f === 'danger' ? 'Critiques' : 'À surveiller'}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-line">
            {alerts.length === 0 ? (
              <p className="px-5 py-6 text-center text-[13px] font-medium text-ink-400">Aucune alerte sur ce filtre.</p>
            ) : alerts.slice(0, 12).map((a) => {
              const emp = employeeById(a.employeeId)!;
              const KIcon = KIND_ICON[a.kind];
              const tone = a.severity === 'danger' ? 'danger' : a.severity === 'warn' ? 'warn' : 'amber';
              return (
                <Link key={a.id} to={`/collaborateurs/${a.employeeId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-amber/[0.04]">
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    tone === 'danger' ? 'bg-danger/12 text-danger' : tone === 'warn' ? 'bg-warn/15 text-warn' : 'bg-amber/12 text-amber-deep')}>
                    <KIcon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{employeeName(emp)} · {emp.role}</p>
                    <p className="truncate text-[11px] font-medium text-ink-500">{a.message}</p>
                  </div>
                  <StatusPill tone={tone} dot={false}>{a.daysLeft >= 0 ? `J-${a.daysLeft}` : `+${Math.abs(a.daysLeft)} j`}</StatusPill>
                  <ArrowUpRight size={14} className="text-ink-300" />
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="90 prochains jours" subtitle="Détection auto (cron)" action={<CalendarClock size={16} className="text-ink-400" />} />
          <div className="space-y-1.5">
            {upcoming.slice(0, 10).map((u, i) => (
              <Link key={i} to={u.href} className="flex items-center gap-2 rounded-xl bg-surface2/60 px-3 py-2 hover:bg-amber/[0.06]">
                <span className="mono shrink-0 text-[11px] font-bold text-amber-deep">{u.date.slice(8, 10)}/{u.date.slice(5, 7)}</span>
                <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink-700">{u.label}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Espaces du module" subtitle="Périmètre Actes & conformité" action={<ShieldCheck size={16} className="text-ok" />} />
        <div className="grid grid-cols-2 gap-2 text-[13px] font-semibold sm:grid-cols-3 lg:grid-cols-4">
          {quickAccess.map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.to} to={q.to} className="flex items-center gap-2 rounded-xl border border-line bg-surface2/40 px-3 py-2.5 transition-colors hover:border-amber/40 hover:bg-amber/[0.06]">
                <Icon size={14} className="text-amber-deep" />
                <span className="flex-1 truncate text-ink">{q.label}</span>
                <span className="mono text-[11px] font-bold text-ink-400">{q.count}</span>
              </Link>
            );
          })}
        </div>
      </Card>

      <p className="text-[11px] font-medium text-ink-400">Module « Actes & conformité » · audit chaîné SHA-256 · signature ADVIST OHADA · multi-pays UEMOA/CEMAC.</p>
    </div>
  );
}
