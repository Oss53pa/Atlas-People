import { Link } from 'react-router-dom';
import { Globe2, AlertTriangle, Plane, Briefcase, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { AdminRhSubNav } from '../../components/admin/AdminRhSubNav';
import { EXPATS, ALERTS } from '../../lib/m4/mock';
import { EXPAT_MOBILITY_TYPES, EXPAT_PACKAGE_COMPONENTS, EXPAT_RENEWAL_THRESHOLDS } from '../../lib/m4/referentiels';
import { employeeById, employeeName } from '../../data/mock';

export function ExpatriesPage() {
  const { toast } = useToast();
  const expatAlerts = ALERTS.filter(a => a.kind === 'expat');

  return (
    <div className="animate-fade-up space-y-5">
      <AdminRhSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Expatriés & mobilité internationale</h1>
          <p className="text-sm font-medium text-ink-500">Permis · visas · package · renouvellements automatiques J-{EXPAT_RENEWAL_THRESHOLDS.join('/')}</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Mobilité', description: 'Wizard mobilité internationale' })}><Plane size={14} /> Initier une mobilité</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Missions actives" value={String(EXPATS.length)} unit="expatriés" icon={Globe2} />
        <StatCard label="Renouvellements" value={String(expatAlerts.length)} unit="à initier" icon={AlertTriangle} tone={expatAlerts.length ? 'amber' : 'default'} />
        <StatCard label="Types de mobilité" value={String(EXPAT_MOBILITY_TYPES.length)} unit="catalogue" icon={Plane} />
        <StatCard label="Composants package" value={String(EXPAT_PACKAGE_COMPONENTS.length)} unit="référentiel" icon={Briefcase} />
      </div>

      {expatAlerts.length > 0 && (
        <Card className="border-warn/30">
          <CardHeader title="Alertes renouvellement" subtitle={`J-${EXPAT_RENEWAL_THRESHOLDS.join(' / J-')}`} action={<AlertTriangle size={16} className="text-warn" />} />
          <div className="space-y-1.5">
            {expatAlerts.map((a) => {
              const emp = employeeById(a.employeeId)!;
              return (
                <Link key={a.id} to={`/collaborateurs/${a.employeeId}`} className="flex items-center gap-2.5 rounded-xl bg-surface2/40 px-3 py-2 hover:bg-amber/[0.06]">
                  <Avatar name={employeeName(emp)} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{employeeName(emp)}</p>
                    <p className="truncate text-[11px] font-medium text-ink-500">{a.message}</p>
                  </div>
                  <StatusPill tone={a.severity === 'danger' ? 'danger' : 'warn'} dot={false}>{`J-${a.daysLeft}`}</StatusPill>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Missions expatriées" subtitle="Suivi individuel · package · documents légaux" />
        {EXPATS.length === 0 ? <p className="py-4 text-center text-[13px] font-medium text-ink-400">Aucun expatrié dans le périmètre.</p>
          : <div className="space-y-3">
              {EXPATS.map((x) => {
                const emp = employeeById(x.employeeId)!;
                return (
                  <div key={x.id} className="rounded-xl border border-line bg-surface2/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={employeeName(emp)} size="sm" />
                        <div>
                          <p className="text-[13px] font-bold text-ink">{employeeName(emp)} · {emp.role}</p>
                          <p className="text-[11px] font-medium text-ink-500">{x.originCountry} → {x.hostCountry} · {x.missionType} · {x.missionStart} → {x.missionEnd}</p>
                        </div>
                      </div>
                      <Link to={`/collaborateurs/${emp.id}`}><Button variant="ghost" size="sm">Dossier <ArrowUpRight size={12} /></Button></Link>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                      {x.visa && <DocBox label={x.visa.label} expiry={x.visa.expiry} />}
                      {x.workPermit && <DocBox label={x.workPermit.label} expiry={x.workPermit.expiry} docRef={x.workPermit.ref} />}
                      {x.residenceCard && <DocBox label={x.residenceCard.label} expiry={x.residenceCard.expiry} />}
                    </div>
                    <div className="mt-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-400">Package</p>
                      <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                        {x.package.map((p, i) => (
                          <div key={i} className="rounded-lg bg-surface px-3 py-1.5 text-[11px] font-medium text-ink-700"><b>{p.label}</b> : {p.value}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>}
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="Types de mobilité" subtitle="6 modalités OHADA" />
          <ul className="space-y-1 text-[12px] font-medium text-ink-700">
            {EXPAT_MOBILITY_TYPES.map((t) => <li key={t} className="rounded-lg bg-surface2/40 px-3 py-1.5">• {t}</li>)}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Composants du package" subtitle="Catalogue référentiel" />
          <ul className="grid grid-cols-1 gap-1 text-[11px] font-medium text-ink-700 md:grid-cols-2">
            {EXPAT_PACKAGE_COMPONENTS.map((c) => <li key={c} className="truncate rounded-lg bg-surface2/40 px-3 py-1.5">• {c}</li>)}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function DocBox({ label, expiry, docRef }: { label: string; expiry: string; docRef?: string }) {
  const days = Math.round((new Date(expiry).getTime() - new Date('2026-05-30').getTime()) / 86_400_000);
  const tone = days < 30 ? 'danger' : days < 90 ? 'warn' : 'ok';
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      {docRef && <p className="mono text-[11px] font-medium text-ink-500">{docRef}</p>}
      <p className="mt-1 flex items-center justify-between text-[12px] font-semibold text-ink">
        <span>Expire {expiry}</span>
        <StatusPill tone={tone} dot={false}>{days >= 0 ? `J-${days}` : `+${Math.abs(days)} j`}</StatusPill>
      </p>
    </div>
  );
}
