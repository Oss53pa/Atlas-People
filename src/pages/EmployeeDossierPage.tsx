import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Mail,
  MapPin,
  CalendarDays,
  Briefcase,
  GraduationCap,
  Clock,
  FileStack,
  History,
  Sparkles,
  Smartphone,
  Download,
  BellRing,
  Pencil,
  Wallet,
  Phone,
  Lock,
  Users,
  Globe,
  Languages,
  HeartHandshake,
  Car,
  Landmark,
  CreditCard,
  AlertTriangle,
  Award,
  Shield,
  Building2,
  Stethoscope,
  Syringe,
  MessageSquare,
  Cpu,
  ShieldCheck,
  Fingerprint,
  CalendarClock,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Brand } from '../components/ui/Brand';
import { StatusPill } from '../components/ui/StatusPill';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { EmptyState, PropheticHint } from '../components/ui/feedback';
import { ProgressBar } from '../components/charts/ProgressBar';
import { RadialGauge } from '../components/charts/RadialGauge';
import { PayslipModal } from '../components/payroll/PayslipModal';
import { Timeline, type TimelineItem } from '../components/ui/Timeline';
import { DossierActions } from '../components/employee/DossierActions';
import { EditDrawer, type EditSection } from '../components/employee/EditDrawer';
import { FamilyTreeView } from '../components/employee/FamilyTreeView';
import { Money } from '../lib/money';
import { computePayslip, getRegime } from '../lib/payroll';
import { DEFAULT_PAY_COMPONENTS, SYSTEM_TYPE_LABEL } from '../lib/m1/payComponents';
import { countryByCode } from '../data/countries';
import { useDirectory } from '../store/useDirectory';
import { useEvents } from '../store/useEvents';
import {
  employeeName,
  matricule,
  mobileMoney,
  employeeTimeline,
  employeeLeaveBalance,
  employeeDocuments,
  employeeSkillSet,
  employeeAlerts,
  employeeFamily,
  employeeBeneficiaries,
  employeeNationalities,
  employeeLanguages,
  employeeCompensation,
  employeeBenefitsInKind,
  employeeLoans,
  employeeAdvances,
  employeeMonthlyDebt,
  employeeMemberships,
  employeeMandates,
  employeeProtectedUntil,
  employeeAuthorizations,
  employeeCertifications,
  employeeEducationLevel,
  employeeDiplomas,
  employeeCareer,
  employeeMedicalFollowup,
  employeeVaccinations,
  employeeCommunicationPrefs,
  employeeConsents,
  employeeSystemMeta,
  type EmployeeRecord,
  type FamilyMember,
} from '../data/mock';
import { URGENCY_TONE } from '../lib/alerts';
import { cn } from '../lib/cn';

const STATUS: Record<EmployeeRecord['status'], { label: string; tone: 'ok' | 'info' | 'warn' | 'danger' }> = {
  active: { label: 'Actif', tone: 'ok' },
  onboarding: { label: 'Onboarding', tone: 'info' },
  leave: { label: 'En congé', tone: 'warn' },
  notice: { label: 'Préavis', tone: 'danger' },
};

const PERIOD = 'Mai 2026';

/** Format date ISO (YYYY-MM-DD) en fr-FR sans décalage de fuseau. */
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');

const EVENT_TONE: Record<string, TimelineItem['tone']> = {
  hire: 'ok', return: 'ok', training: 'info', evaluation: 'neutral',
  raise: 'amber', promotion: 'amber', salary_change: 'amber', amendment: 'amber',
  mobility: 'danger', exit: 'danger', suspension: 'danger',
};

// Rôle de l'utilisateur courant (démo). Le manager ne voit pas la rémunération.
const CURRENT_ROLE: 'drh' | 'manager' = 'drh';

export function EmployeeDossierPage() {
  const { id } = useParams();
  const employees = useDirectory((s) => s.employees);
  const allEvents = useEvents((s) => s.events);
  const employee = id ? employees.find((e) => e.id === id) : undefined;
  const [showBulletin, setShowBulletin] = useState(false);
  const [editSection, setEditSection] = useState<EditSection | null>(null);
  const [tab, setTab] = useState('identity');
  const [integrityChecked, setIntegrityChecked] = useState(false);

  if (!employee) {
    return (
      <div className="animate-fade-up">
        <Link to="/collaborateurs" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink">
          <ArrowLeft size={15} /> Collaborateurs
        </Link>
        <Card><EmptyState title="Collaborateur introuvable." description="Cette fiche n'existe pas ou a été archivée." /></Card>
      </div>
    );
  }

  const country = countryByCode(employee.countryCode);
  const cur = country.currency;
  const regime = getRegime(employee.countryCode);
  const computation = computePayslip(
    { baseSalary: employee.baseSalary, taxableAllowances: employee.taxableAllowances, nonTaxableAllowances: employee.nonTaxableAllowances, fiscalParts: employee.fiscalParts, otherDeductions: employee.otherDeductions },
    regime, employeeName(employee),
  );
  const st = STATUS[employee.status];
  const leave = employeeLeaveBalance(employee);
  const skills = employeeSkillSet(employee);
  const docs = employeeDocuments(employee);
  const alerts = employeeAlerts(employee);
  const seniority = Math.floor((Date.now() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
  const employeeEvents = allEvents.filter((e) => e.employeeId === employee.id);
  const amendmentEvents = employeeEvents.filter((e) => ['amendment', 'promotion', 'salary_change', 'mobility'].includes(e.type));
  const mergedTimeline: TimelineItem[] = [
    ...employeeEvents.map((e) => ({ date: e.date, label: e.label, type: e.type })),
    ...employeeTimeline(employee).map((t) => ({ date: t.date, label: t.label, type: t.type })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1)).map((x) => ({ date: x.date, title: x.label, tone: EVENT_TONE[x.type] ?? 'neutral' }));
  const legalRubrics = DEFAULT_PAY_COMPONENTS.filter((c) => !c.countryCode || c.countryCode === employee.countryCode);
  const family = employeeFamily(employee);
  const beneficiaries = employeeBeneficiaries(employee);
  const nationalities = employeeNationalities(employee);
  const languages = employeeLanguages(employee);
  const spouses = family.filter((m) => m.type === 'spouse');
  const children = family.filter((m) => m.type === 'child');
  const ascendants = family.filter((m) => m.type === 'ascendant');
  const compLines = employeeCompensation(employee);
  const benefits = employeeBenefitsInKind(employee);
  const loans = employeeLoans(employee);
  const advances = employeeAdvances(employee);
  const monthlyDebt = employeeMonthlyDebt(employee);
  const memberships = employeeMemberships(employee);
  const mandates = employeeMandates(employee);
  const protectedUntil = employeeProtectedUntil(employee);
  const authorizations = employeeAuthorizations(employee);
  const certifications = employeeCertifications(employee);
  const diplomas = employeeDiplomas(employee);
  const educationLevel = employeeEducationLevel(employee);
  const career = employeeCareer(employee);
  const repMandates = mandates.filter((m) => m.category === 'staff_representation');
  const extMandates = mandates.filter((m) => m.category === 'external');
  const medical = employeeMedicalFollowup(employee);
  const vaccinations = employeeVaccinations(employee);
  const commPrefs = employeeCommunicationPrefs(employee);
  const consents = employeeConsents(employee);
  const sysMeta = employeeSystemMeta(employee);
  const proCount = memberships.length + mandates.length + authorizations.length + certifications.length;
  const netInt = Money.fromJSON({ units: computation.result.netToPayUnits, currency: cur }).toInt();
  const debtRatio = netInt > 0 ? Math.round((monthlyDebt / netInt) * 100) : 0;
  const brutMensuel = compLines.filter((l) => l.code !== 'I-13M').reduce((s, l) => s + l.amount, 0);

  const tabs = [
    { key: 'identity', label: 'Identité' },
    { key: 'family', label: 'Famille', count: family.length },
    { key: 'contract', label: 'Contrat' },
    ...(CURRENT_ROLE === 'drh' ? [{ key: 'compensation', label: 'Rémunération' }] : []),
    ...(CURRENT_ROLE === 'drh' ? [{ key: 'benefits', label: 'Avantages & prêts', count: benefits.length + loans.length + advances.length }] : []),
    { key: 'professional', label: 'Profil pro', count: proCount },
    { key: 'documents', label: 'Documents', count: docs.length },
    { key: 'skills', label: 'Compétences', count: skills.length },
    { key: 'history', label: 'Historique', count: mergedTimeline.length },
    ...(CURRENT_ROLE === 'drh' ? [{ key: 'system', label: 'Système & audit' }] : []),
  ];

  return (
    <div className="animate-fade-up space-y-5">
      {showBulletin && <PayslipModal employee={employee} computation={computation} period={PERIOD} onClose={() => setShowBulletin(false)} />}
      {editSection && <EditDrawer employee={employee} section={editSection} onClose={() => setEditSection(null)} />}

      <Breadcrumb items={[{ label: 'People', to: '/' }, { label: 'Collaborateurs', to: '/collaborateurs' }, { label: employeeName(employee) }]} />

      {/* Hero */}
      <Card className="surface-night border-0 overflow-hidden" inset={false}>
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={employeeName(employee)} size="lg" />
            <div>
              <h1 className="text-2xl font-semibold text-ink">{employeeName(employee)}</h1>
              <p className="text-sm font-medium text-ink-500">{employee.role} · {employee.department}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusPill tone={st.tone}>{st.label}</StatusPill>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.05] px-2.5 py-1 text-[11px] font-semibold text-ink-700">{country.flag} {country.name}</span>
                <span className="mono rounded-full bg-amber/15 px-2.5 py-1 text-[11px] font-bold text-amber-deep">{matricule(employee)}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.05] px-2.5 py-1 text-[11px] font-semibold text-ink-700"><Clock size={11} /> {seniority} an{seniority > 1 ? 's' : ''}</span>
                {protectedUntil && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-warn/30 bg-warn/[0.12] px-2.5 py-1 text-[11px] font-bold text-warn">
                    <Shield size={11} /> Statut protégé jusqu'au {new Date(`${protectedUntil}T00:00:00`).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBulletin(true)}><FileText size={14} /> Bulletin</Button>
            <DossierActions employee={employee} />
            <Link to="/moi"><Button size="sm"><Smartphone size={14} /> Espace employé</Button></Link>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {/* ---- IDENTITÉ ---- */}
      {tab === 'identity' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader title="État civil & coordonnées" subtitle="Dossier vivant" action={<Button variant="ghost" size="sm" onClick={() => setEditSection('identity')}><Pencil size={14} /> Modifier</Button>} />
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <Info icon={Mail} label="Email" value={employee.email} />
                <Info icon={Phone} label="Téléphone" value={employee.phone ?? '—'} />
                <Info icon={MapPin} label="Adresse" value={employee.address ?? '—'} />
                <Info icon={CalendarDays} label="Date d'embauche" value={new Date(employee.hireDate).toLocaleDateString('fr-FR')} />
              </div>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setEditSection('contact')}><Pencil size={13} /> Modifier les coordonnées</Button>
            </Card>

            <Card>
              <CardHeader title="Versement du salaire" subtitle="Donnée sensible · audit fort" action={<StatusPill tone="amber" dot={false}><Lock size={11} /> Sensible</StatusPill>} />
              <div className="flex items-center justify-between">
                <Info icon={Wallet} label="Mobile Money" value={employee.mobileMoneyNumber ?? mobileMoney(employee)} />
                <Button variant="outline" size="sm" onClick={() => setEditSection('payment')}><Pencil size={13} /> Modifier</Button>
              </div>
              <p className="mt-3 text-[11px] font-medium text-ink-400">Toute modification est tracée en audit et notifiée à l'employé.</p>
            </Card>

            <Card>
              <CardHeader title="Pays & régime social" action={<Briefcase size={16} className="text-ink-400" />} />
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <Info icon={MapPin} label="Pays d'affectation" value={`${country.flag} ${country.name}`} />
                <Info icon={Briefcase} label="Régime" value={`${regime.socialFund} · v${regime.version}`} />
                <Info icon={Wallet} label="Devise" value={`${country.currency} (FCFA)`} />
                <Info icon={Briefcase} label="Manager (N+1)" value={employee.manager ?? '—'} />
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Card>
                <CardHeader title="Nationalités" action={<Globe size={16} className="text-ink-400" />} />
                <div className="flex flex-wrap gap-2">
                  {nationalities.map((n) => (
                    <span key={n.code} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface2 px-2.5 py-1 text-xs font-semibold text-ink">
                      {countryByCode(n.code).flag} {countryByCode(n.code).name}
                      {n.primary && <span className="rounded-full bg-amber/15 px-1.5 text-[9px] font-bold text-amber-deep">principale</span>}
                    </span>
                  ))}
                </div>
              </Card>
              <Card>
                <CardHeader title="Langues parlées" action={<Languages size={16} className="text-ink-400" />} />
                <div className="space-y-1.5">
                  {languages.map((l) => (
                    <div key={l.label} className="flex items-center justify-between rounded-lg bg-surface2 px-3 py-1.5">
                      <span className="text-sm font-semibold text-ink">{l.label}</span>
                      <span className="text-[11px] font-semibold text-ink-400">{l.level}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <div className="space-y-5">
            {alerts.length > 0 && (
              <Card>
                <CardHeader title="Alertes" subtitle="J-60 / J-30 / J-7" action={<BellRing size={16} className="text-amber-deep" />} />
                <div className="space-y-2">
                  {alerts.map((a) => (
                    <div key={a.label} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${a.urgency === 'critical' ? 'bg-danger' : a.urgency === 'soon' ? 'bg-warn' : 'bg-info'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{a.label}</p>
                        <p className="text-[11px] font-medium text-ink-400">{new Date(`${a.date}T00:00:00`).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <StatusPill tone={URGENCY_TONE[a.urgency]} dot={false}>{a.daysLeft <= 0 ? 'Expiré' : `J-${a.daysLeft}`}</StatusPill>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            <Card>
              <CardHeader title="Congés & absences" action={<Clock size={16} className="text-ink-400" />} />
              <div className="flex items-center justify-between">
                <RadialGauge value={leave.remaining} max={leave.acquired} size={120} thickness={11} centerValue={`${leave.remaining}j`} label="restants" tone="ok" />
                <div className="space-y-2 text-right">
                  <div><p className="mono text-xl font-semibold text-ink">{leave.acquired}</p><p className="text-[11px] font-medium text-ink-400">acquis</p></div>
                  <div><p className="mono text-xl font-semibold text-warn">{leave.taken}</p><p className="text-[11px] font-medium text-ink-400">pris</p></div>
                </div>
              </div>
            </Card>
            <Card className="glass-amber">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-deep"><Sparkles size={12} /> Attention rétention</span>
                <span className="mono text-xs font-bold text-ink-500">{employee.retentionAttention}/100</span>
              </div>
              <ProgressBar value={employee.retentionAttention} tone={employee.retentionAttention >= 70 ? 'danger' : employee.retentionAttention >= 55 ? 'warn' : 'info'} />
              <p className="mt-2 text-[11px] font-medium text-ink-500">Signal agrégé orienté soin — jamais exposé comme score punitif.</p>
            </Card>

            {/* Préférences de communication (S — vue compacte RH) */}
            <Card>
              <CardHeader title="Communication" subtitle="Préférences & consentements" action={<MessageSquare size={16} className="text-ink-400" />} />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="font-medium text-ink-500">Langue</span><span className="font-semibold text-ink">{commPrefs.language}</span></div>
                <div className="flex items-center justify-between"><span className="font-medium text-ink-500">Canal principal</span><span className="font-semibold text-ink">{commPrefs.mainChannel}</span></div>
                <div className="flex items-center justify-between"><span className="font-medium text-ink-500">Droit à la déconnexion</span><StatusPill tone={commPrefs.disconnection === 'enabled' ? 'ok' : 'neutral'} dot={false}>{commPrefs.disconnectionLabel}</StatusPill></div>
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Consentements RGPD/CDP</p>
                <div className="flex flex-wrap gap-1.5">
                  {consents.map((c) => (
                    <span key={c.code} className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', c.granted ? 'bg-ok/12 text-ok' : 'bg-ink/[0.05] text-ink-400')}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', c.granted ? 'bg-ok' : 'bg-ink-400')} /> {c.label}
                    </span>
                  ))}
                </div>
              </div>
              {commPrefs.customized && <p className="mt-2 text-[11px] font-medium text-ink-400">Préférences personnalisées par l'employé.</p>}
            </Card>
          </div>
        </div>
      )}

      {/* ---- FAMILLE ---- */}
      {tab === 'family' && (
        <div className="space-y-5">
          <Card>
            <CardHeader title="Composition familiale" subtitle="Arbre des ayants droit" action={<Users size={16} className="text-ink-400" />} />
            {family.length > 0 ? (
              <FamilyTreeView employee={employeeName(employee)} members={family} />
            ) : (
              <EmptyState icon={Users} title="Aucun membre déclaré" description="Conjoint, enfants, ascendants à charge apparaîtront ici." />
            )}
          </Card>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <FamilyCard title="Conjoint(s)" members={spouses} icon={HeartHandshake} />
            <FamilyCard title="Enfants" members={children} icon={Users} />
            <FamilyCard title="Ascendants à charge" members={ascendants} icon={Users} />
            <Card>
              <CardHeader title="Bénéficiaires (capital décès)" subtitle="Quote-part · signature requise" action={<HeartHandshake size={16} className="text-ink-400" />} />
              {beneficiaries.length > 0 ? (
                <div className="space-y-1.5">
                  {beneficiaries.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg bg-surface2 px-3 py-2">
                      <span className="text-sm font-semibold text-ink">{b.name}</span>
                      <span className="mono text-sm font-bold text-amber-deep">{b.share} %</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-line pt-2 text-xs font-bold">
                    <span className="text-ink-500">Total</span>
                    <span className="mono text-ink">{beneficiaries.reduce((s, b) => s + b.share, 0)} %</span>
                  </div>
                </div>
              ) : (
                <EmptyState icon={HeartHandshake} title="Aucun bénéficiaire désigné" description="À défaut, les règles de succession légales OHADA s'appliquent." />
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ---- CONTRAT ---- */}
      {tab === 'contract' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Contrat actuel — version 1" subtitle="Toute modification crée un avenant daté" action={<StatusPill tone={employee.contractType === 'CDI' ? 'ok' : 'warn'} dot={false}>{employee.contractType}</StatusPill>} />
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <Info icon={FileText} label="Type de contrat" value={employee.contractType} />
              <Info icon={CalendarDays} label="Date d'entrée" value={new Date(employee.hireDate).toLocaleDateString('fr-FR')} />
              <Info icon={Briefcase} label="Poste" value={employee.role} />
              <Info icon={Briefcase} label="Département" value={employee.department} />
              <Info icon={Briefcase} label="Manager (N+1)" value={employee.manager ?? '—'} />
              <Info icon={Clock} label="Durée hebdomadaire" value="40 h · Temps plein" />
              <Info icon={CalendarDays} label="Parts fiscales" value={String(employee.fiscalParts)} />
              <Info icon={MapPin} label="Lieu de travail" value="Siège" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Avenants" subtitle="Historique contractuel" action={<Link to={`/collaborateurs/${employee.id}/avenant`}><Button variant="ghost" size="sm"><FileText size={14} /> Nouvel avenant</Button></Link>} />
            {amendmentEvents.length > 0 ? (
              <Timeline items={amendmentEvents.map((e) => ({ date: e.date, title: e.label, tone: EVENT_TONE[e.type] ?? 'amber' }))} />
            ) : (
              <EmptyState icon={FileText} title="Aucun avenant" description="Le contrat initial est toujours en vigueur. Créez un avenant versionné (effet daté, diff paie, ComplianceGuard)." />
            )}
          </Card>
        </div>
      )}

      {/* ---- RÉMUNÉRATION ---- */}
      {tab === 'compensation' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="glass-amber lg:col-span-1">
              <CardHeader title="Rémunération actuelle" subtitle={`Effet ${new Date(employee.hireDate).toLocaleDateString('fr-FR')}`} />
              <p className="mono text-3xl font-semibold text-ink">{Money.of(employee.baseSalary, cur).format()}</p>
              <p className="text-sm font-semibold text-ink-400">FCFA / mois — base</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowBulletin(true)}><FileText size={14} /> Voir le bulletin</Button>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title="Synthèse paie" subtitle="Calcul déterministe · double vérification" action={<StatusPill tone={computation.verification.ok ? 'ok' : 'danger'}>{computation.verification.ok ? 'Vérifié' : 'Écart'}</StatusPill>} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Money3 label="Brut total" units={computation.result.grossTotalUnits} currency={cur} />
                <Money3 label="Cotisations" units={computation.result.totalEmployeeContributionUnits} currency={cur} />
                <Money3 label="Net à payer" units={computation.result.netToPayUnits} currency={cur} accent />
                <Money3 label="Coût employeur" units={computation.result.employerCostUnits} currency={cur} />
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Composantes de la rémunération" subtitle={`${compLines.length} lignes · brut ${Money.of(brutMensuel, cur).format()} FCFA/mois`} />
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="hidden grid-cols-[0.7fr_1.6fr_1.2fr_1.4fr_1fr] gap-3 border-b border-line bg-surface2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-400 sm:grid">
                <span>Code</span><span>Composante</span><span>Catégorie</span><span>Fiscalité</span><span className="text-right">Montant</span>
              </div>
              <div className="divide-y divide-line">
                {compLines.map((l) => (
                  <div key={l.code} className="grid grid-cols-1 items-center gap-1 px-4 py-2.5 sm:grid-cols-[0.7fr_1.6fr_1.2fr_1.4fr_1fr] sm:gap-3">
                    <span className="mono text-[11px] font-bold text-ink-500">{l.code}</span>
                    <span className="text-sm font-semibold text-ink">{l.label}</span>
                    <span className="text-[11px] font-medium text-ink-400">{l.category}</span>
                    <span className="text-[11px] font-medium text-ink-400">{l.fiscal}</span>
                    <span className="mono text-right text-sm font-semibold text-ink">{Money.of(l.amount, cur).format()}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Historique salarial" subtitle="Versionné par date d'effet (jamais d'écrasement)" />
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-3 border-b border-line bg-surface2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <span>Date d'effet</span><span>Motif</span><span className="text-right">Salaire de base</span>
              </div>
              <div className="grid grid-cols-[1fr_1.4fr_1fr] items-center gap-3 px-4 py-3 text-sm">
                <span className="font-semibold text-ink">{new Date(employee.hireDate).toLocaleDateString('fr-FR')}</span>
                <span className="font-medium text-ink-700">Embauche · Contrat v1</span>
                <span className="mono text-right font-semibold text-ink">{Money.of(employee.baseSalary, cur).format()}</span>
              </div>
              {amendmentEvents.filter((e) => e.type === 'salary_change' || e.type === 'promotion').map((e) => (
                <div key={e.id} className="grid grid-cols-[1fr_1.4fr_1fr] items-center gap-3 border-t border-line px-4 py-3 text-sm">
                  <span className="font-semibold text-ink">{new Date(e.date).toLocaleDateString('fr-FR')}</span>
                  <span className="font-medium text-ink-700">{e.label}</span>
                  <span className="mono text-right font-semibold text-amber-deep">avenant</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Rubriques affectées" subtitle={`Régime ${regime.socialFund}`} />
              <div className="space-y-1.5">
                {legalRubrics.map((r) => (
                  <div key={r.id} className="flex items-center gap-2.5 rounded-xl bg-surface2 px-3 py-2">
                    <span className="mono rounded bg-ink/[0.05] px-1.5 py-0.5 text-[10px] font-bold text-ink-500">{r.code}</span>
                    <span className="flex-1 text-sm font-semibold text-ink">{r.label}</span>
                    <StatusPill tone="neutral" dot={false}>{SYSTEM_TYPE_LABEL[r.systemType]}</StatusPill>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Avantages en nature" />
              <EmptyState icon={Wallet} title="Aucun avantage en nature" description="Voiture, logement, carburant… s'afficheront ici une fois ajoutés." />
            </Card>
          </div>
        </div>
      )}

      {/* ---- AVANTAGES & PRÊTS ---- */}
      {tab === 'benefits' && (
        <div className="space-y-5">
          <Card className={debtRatio > 33 ? 'border-danger/30' : ''}>
            <CardHeader title="Endettement total" subtitle="Engagements financiers en cours" action={debtRatio > 33 ? <StatusPill tone="danger">{debtRatio}% du net</StatusPill> : <StatusPill tone="ok">{debtRatio}% du net</StatusPill>} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Money3 label="Charge mensuelle" units={String(monthlyDebt)} currency={cur} accent={debtRatio > 33} />
              <Money3 label="Prêts en cours" units={String(loans.reduce((s, l) => s + l.remainingBalance, 0))} currency={cur} />
              <div className="rounded-xl border border-line bg-surface2 px-3 py-2.5"><p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Engagements</p><p className="mono text-sm font-semibold text-ink">{loans.length + advances.length}</p></div>
              <div className="rounded-xl border border-line bg-surface2 px-3 py-2.5"><p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Ratio net</p><p className={cn('mono text-sm font-semibold', debtRatio > 33 ? 'text-danger' : 'text-ok')}>{debtRatio}%</p></div>
            </div>
            {debtRatio > 33 && <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-danger"><AlertTriangle size={13} /> Au-delà du seuil prudentiel de 33% du net — toute nouvelle demande de prêt sera signalée.</p>}
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Avantages en nature" subtitle="Valorisés · reportés en base imposable" action={<Car size={16} className="text-ink-400" />} />
              {benefits.length > 0 ? (
                <div className="space-y-1.5">
                  {benefits.map((b) => (
                    <div key={b.type} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep">{b.type === 'vehicle' ? <Car size={15} /> : b.type === 'housing' ? <Landmark size={15} /> : <CreditCard size={15} />}</span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{b.label}</p><p className="text-[11px] font-medium text-ink-400">{b.taxable ? 'Imposable' : 'Non imposable'}</p></div>
                      <span className="mono text-sm font-bold text-amber-deep">{Money.of(b.monthlyValue, cur).format()}</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon={Car} title="Aucun avantage en nature" description="Véhicule, logement, téléphone… s'afficheront ici." />}
            </Card>

            <Card>
              <CardHeader title="Prêts en cours" subtitle="Échéancier & solde" action={<Landmark size={16} className="text-ink-400" />} />
              {loans.length > 0 ? (
                <div className="space-y-3">
                  {loans.map((l) => (
                    <div key={l.reference} className="rounded-2xl border border-line bg-surface2 p-3.5">
                      <div className="flex items-center justify-between">
                        <div><p className="text-sm font-bold text-ink">{l.purpose}</p><p className="mono text-[11px] font-medium text-ink-400">{l.reference}</p></div>
                        <span className="mono text-sm font-bold text-ink">{Money.of(l.monthlyInstallment, cur).format()}/mois</span>
                      </div>
                      <div className="mt-2"><ProgressBar value={l.totalAmount - l.remainingBalance} max={l.totalAmount} tone="amber" /></div>
                      <p className="mt-1.5 text-[11px] font-medium text-ink-400">Solde restant <span className="mono font-semibold text-ink">{Money.of(l.remainingBalance, cur).format()} FCFA</span> · {l.installmentsRemaining} échéances</p>
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon={Landmark} title="Aucun prêt en cours" description="Les prêts employeur (logement, véhicule, études…) s'afficheront ici." />}
            </Card>

            <Card>
              <CardHeader title="Avances & acomptes" subtitle="Retenues sur paie" action={<Wallet size={16} className="text-ink-400" />} />
              {advances.length > 0 ? (
                <div className="space-y-1.5">
                  {advances.map((a) => (
                    <div key={a.reference} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2.5">
                      <div><p className="text-sm font-semibold text-ink">{a.motive}</p><p className="mono text-[11px] font-medium text-ink-400">{a.reference}</p></div>
                      <span className="mono text-sm font-bold text-danger">−{Money.of(a.monthlyDeduction, cur).format()}</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon={Wallet} title="Aucune avance" description="Avances et acomptes en cours s'afficheront ici." />}
            </Card>

            <Card>
              <CardHeader title="Cartes & cautions" subtitle="Moyens de paiement pro" action={<CreditCard size={16} className="text-ink-400" />} />
              <EmptyState icon={CreditCard} title="Aucune carte / caution" description="Cartes de paiement professionnelles et cautions employeur s'afficheront ici." />
            </Card>
          </div>
        </div>
      )}

      {/* ---- PROFIL PROFESSIONNEL ---- */}
      {tab === 'professional' && (
        <div className="space-y-5">
          {/* Synthèse ancienneté & formation */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Ancienneté</p>
              <p className="mono mt-1 text-2xl font-semibold text-ink">{seniority} an{seniority > 1 ? 's' : ''}</p>
              <p className="text-[11px] font-medium text-ink-400">depuis le {new Date(employee.hireDate).toLocaleDateString('fr-FR')}</p>
            </Card>
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Niveau d'études</p>
              <p className="mt-1 text-sm font-bold text-ink">{educationLevel}</p>
              <p className="text-[11px] font-medium text-ink-400">{diplomas.length} diplôme{diplomas.length > 1 ? 's' : ''}</p>
            </Card>
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Habilitations</p>
              <p className="mono mt-1 text-2xl font-semibold text-ink">{authorizations.filter((a) => a.status === 'active').length}<span className="text-sm text-ink-400">/{authorizations.length}</span></p>
              <p className="text-[11px] font-medium text-ink-400">actives</p>
            </Card>
            <Card className={protectedUntil ? 'border-warn/30' : ''}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Statut</p>
              {protectedUntil ? (
                <>
                  <p className="mt-1 flex items-center gap-1 text-sm font-bold text-warn"><Shield size={14} /> Protégé</p>
                  <p className="text-[11px] font-medium text-ink-400">jusqu'au {new Date(`${protectedUntil}T00:00:00`).toLocaleDateString('fr-FR')}</p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm font-bold text-ink">Standard</p>
                  <p className="text-[11px] font-medium text-ink-400">aucun mandat protecteur</p>
                </>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Affiliations professionnelles */}
            <Card>
              <CardHeader title="Affiliations professionnelles" subtitle="Ordres & associations" action={<Building2 size={16} className="text-ink-400" />} />
              {memberships.length > 0 ? (
                <div className="space-y-1.5">
                  {memberships.map((m) => (
                    <div key={m.organization} className="flex items-start gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><Building2 size={15} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{m.organization}</p>
                        <p className="text-[11px] font-medium text-ink-400">{m.type}</p>
                      </div>
                      <StatusPill tone={m.linkToJob === 'mandatory' ? 'danger' : m.linkToJob === 'recommended' ? 'amber' : 'neutral'} dot={false}>
                        {m.linkToJob === 'mandatory' ? 'Obligatoire' : m.linkToJob === 'recommended' ? 'Recommandée' : 'Personnelle'}
                      </StatusPill>
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon={Building2} title="Aucune affiliation" description="Ordres professionnels et associations liés au poste s'afficheront ici." />}
            </Card>

            {/* Mandats */}
            <Card>
              <CardHeader title="Mandats de représentation" subtitle="Protection du salarié" action={<Shield size={16} className="text-ink-400" />} />
              {repMandates.length > 0 ? (
                <div className="space-y-3">
                  {repMandates.map((m) => (
                    <div key={m.type} className="rounded-2xl border border-warn/25 bg-warn/[0.05] p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-ink">{m.type}</p>
                        <StatusPill tone={m.status === 'active' ? 'ok' : 'neutral'} dot={false}>{m.status === 'active' ? 'En cours' : 'Échu'}</StatusPill>
                      </div>
                      <p className="mt-1 text-[11px] font-medium text-ink-400">
                        Mandat du {new Date(`${m.start}T00:00:00`).toLocaleDateString('fr-FR')} au {new Date(`${m.end}T00:00:00`).toLocaleDateString('fr-FR')}
                      </p>
                      {m.protectionEnd && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-warn">
                          <Shield size={12} /> Protection contre le licenciement jusqu'au {new Date(`${m.protectionEnd}T00:00:00`).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon={Shield} title="Aucun mandat représentatif" description="Délégué du personnel, CSE, comité SST… s'afficheront ici." />}
              {extMandates.length > 0 && (
                <div className="mt-3 border-t border-line pt-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Mandats externes</p>
                  <div className="space-y-1.5">
                    {extMandates.map((m) => (
                      <div key={m.type} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">{m.type}</p>
                          <p className="text-[11px] font-medium text-ink-400">jusqu'au {new Date(`${m.end}T00:00:00`).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <StatusPill tone="neutral" dot={false}>Externe</StatusPill>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Habilitations */}
            <Card>
              <CardHeader title="Habilitations & autorisations" subtitle="Sécurité · validité réglementaire" action={<Award size={16} className="text-ink-400" />} />
              {authorizations.length > 0 ? (
                <div className="space-y-1.5">
                  {authorizations.map((a) => (
                    <div key={a.code} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5', a.status === 'expired' ? 'bg-danger/[0.05]' : 'bg-surface2')}>
                      <span className={cn('mono rounded px-1.5 py-0.5 text-[10px] font-bold', a.status === 'expired' ? 'bg-danger/12 text-danger' : 'bg-ink/[0.05] text-ink-500')}>{a.code}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{a.label}</p>
                        <p className="text-[11px] font-medium text-ink-400">{a.category} · expire le {new Date(`${a.expiry}T00:00:00`).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <StatusPill tone={a.status === 'expired' ? 'danger' : 'ok'} dot={false}>{a.status === 'expired' ? 'Expirée' : 'Valide'}</StatusPill>
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon={Award} title="Aucune habilitation" description="Habilitations électriques, CACES, SST… s'afficheront ici." />}
            </Card>

            {/* Certifications */}
            <Card>
              <CardHeader title="Certifications" subtitle="Reconnaissances professionnelles" action={<Award size={16} className="text-ink-400" />} />
              {certifications.length > 0 ? (
                <div className="space-y-1.5">
                  {certifications.map((c) => (
                    <div key={c.label} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><Award size={15} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{c.label}</p>
                        <p className="text-[11px] font-medium text-ink-400">{c.certifier}{c.expiry ? ` · valide jusqu'au ${new Date(`${c.expiry}T00:00:00`).toLocaleDateString('fr-FR')}` : ' · sans expiration'}</p>
                      </div>
                      <StatusPill tone="ok" dot={false}>{c.status === 'active' ? 'Valide' : c.status}</StatusPill>
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon={Award} title="Aucune certification" description="PMP, AWS, certifications métier… s'afficheront ici." />}
            </Card>
          </div>

          {/* Suivi médical professionnel (R) — métadonnées seulement */}
          <Card>
            <CardHeader title="Suivi médical professionnel" subtitle="Métadonnées — aucune donnée médicale" action={<StatusPill tone="neutral" dot={false}>Sans nature</StatusPill>} />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  <Info icon={Stethoscope} label="Médecin référent" value={medical.doctor} />
                  <Info icon={Building2} label="Service de santé" value={medical.service} />
                  <Info icon={CalendarDays} label="Dernière visite" value={`${frDate(medical.lastVisit)} · ${medical.lastVisitType}`} />
                  <Info icon={CalendarClock} label="Prochaine visite due" value={frDate(medical.nextVisit)} />
                </div>
                <div className="rounded-2xl border border-line bg-surface2 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Aptitude au poste</span>
                    <StatusPill tone={medical.aptitude === 'fit' ? 'ok' : medical.aptitude === 'fit_with_restrictions' ? 'warn' : 'danger'} dot={false}>{medical.aptitudeLabel}</StatusPill>
                  </div>
                  {medical.restrictions.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {medical.restrictions.map((r) => (
                        <li key={r} className="flex items-center gap-1.5 text-[12px] font-medium text-ink-700"><span className="h-1.5 w-1.5 rounded-full bg-warn" /> {r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-[12px] font-medium text-ink-400">Aucune restriction opérationnelle.</p>
                  )}
                  {medical.validUntil && <p className="mt-2 text-[11px] font-medium text-ink-400">Valable jusqu'au {frDate(medical.validUntil)}</p>}
                </div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-400"><Syringe size={12} /> Vaccinations obligatoires</p>
                <div className="space-y-1.5">
                  {vaccinations.map((v) => (
                    <div key={v.label} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', v.status === 'expired' ? 'bg-danger/12 text-danger' : v.status === 'recall_due_soon' ? 'bg-warn/12 text-warn' : 'bg-ok/12 text-ok')}><Syringe size={15} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{v.label}{v.obligatory && <span className="ml-1.5 text-[10px] font-bold text-amber-deep">obligatoire</span>}</p>
                        <p className="text-[11px] font-medium text-ink-400">{v.nextRecall ? `Rappel le ${frDate(v.nextRecall)}` : 'Sans rappel'}</p>
                      </div>
                      <StatusPill tone={v.status === 'expired' ? 'danger' : v.status === 'recall_due_soon' ? 'warn' : 'ok'} dot={false}>{v.status === 'expired' ? 'Périmé' : v.status === 'recall_due_soon' ? 'À renouveler' : 'À jour'}</StatusPill>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-ink/[0.03] px-3 py-2 text-[11px] font-medium text-ink-400">
              <Lock size={12} /> Aucune information médicale détaillée n'est accessible ici. Le suivi médical confidentiel relève exclusivement du médecin du travail (M12).
            </p>
          </Card>

          {/* Parcours académique */}
          <Card>
            <CardHeader title="Parcours académique" subtitle={educationLevel} action={<GraduationCap size={16} className="text-ink-400" />} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {diplomas.map((d) => (
                <div key={d.title} className="flex items-start gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><GraduationCap size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{d.title}</p>
                    <p className="flex items-center gap-1 text-[11px] font-medium text-ink-400"><Building2 size={11} /> {d.institution} · {d.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Parcours interne */}
          <Card>
            <CardHeader title="Parcours interne" subtitle="Embauche, promotions, mobilités" action={<Briefcase size={16} className="text-ink-400" />} />
            <Timeline items={career.map((s) => ({ date: s.date, title: s.title, tone: s.type === 'initial_hiring' ? 'ok' : s.type === 'promotion' ? 'amber' : 'danger' }))} />
          </Card>
        </div>
      )}

      {/* ---- DOCUMENTS ---- */}
      {tab === 'documents' && (
        <Card>
          <CardHeader title="Documents" subtitle="Coffre du collaborateur" action={<FileStack size={16} className="text-ink-400" />} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {docs.map((d) => (
              <div key={d.name} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><FileText size={14} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{d.name}</p>
                  <p className="text-[11px] font-medium text-ink-400">{d.kind} · {new Date(d.date).toLocaleDateString('fr-FR')}</p>
                </div>
                <Download size={15} className="shrink-0 text-ink-400" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ---- COMPÉTENCES ---- */}
      {tab === 'skills' && (
        <Card>
          <CardHeader title="Compétences" subtitle="Graphe vivant — niveau & preuve" action={<GraduationCap size={16} className="text-ink-400" />} />
          <div className="grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2">
            {skills.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex items-center justify-between text-xs"><span className="font-semibold text-ink-700">{s.name}</span><span className="mono font-semibold text-ink-500">{s.level}/5</span></div>
                <ProgressBar value={s.level} max={5} tone="amber" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ---- HISTORIQUE ---- */}
      {tab === 'history' && (
        <Card>
          <CardHeader title="Historique du dossier" subtitle="Trajectoire accompagnée — timeline immuable" action={<History size={16} className="text-ink-400" />} />
          <Timeline items={mergedTimeline} />
          <PropheticHint className="mt-4">détecte une trajectoire stable ; piste de mobilité interne à explorer au prochain entretien.</PropheticHint>
        </Card>
      )}

      {/* ---- SYSTÈME & AUDIT (T — DRH/Compliance) ---- */}
      {tab === 'system' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Métadonnées du dossier" subtitle="Cycle de vie · rattachement juridique" action={<StatusPill tone={sysMeta.lifecycleTone} dot={false}>{sysMeta.lifecycleLabel}</StatusPill>} />
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <Info icon={Cpu} label="Statut technique" value={sysMeta.lifecycleLabel} />
              <Info icon={Fingerprint} label="N° fiscal entité" value={sysMeta.fiscalNumber} />
              <Info icon={CalendarDays} label="Fiche créée le" value={`${frDate(sysMeta.createdAt)} · ${sysMeta.createdBy}`} />
              <Info icon={History} label="Dernière modification" value={frDate(sysMeta.lastModified)} />
              <Info icon={Pencil} label="Modifications" value={`${sysMeta.modificationCount} au total`} />
              <Info icon={FileText} label="Contrat signé le" value={frDate(sysMeta.contractSignedAt)} />
              <Info icon={CalendarDays} label="Entrée effective" value={frDate(sysMeta.effectiveEntry)} />
              <Info icon={CalendarClock} label="Date de sortie" value={sysMeta.exitDate ? frDate(sysMeta.exitDate) : '—'} />
              <Info icon={Building2} label="Entité juridique" value={sysMeta.legalEntity} />
              <Info icon={MapPin} label="Filiale / site" value={sysMeta.branch} />
              <Info icon={Users} label="Référent RH" value={sysMeta.hrReferent} />
              <Info icon={Users} label="Référent RH backup" value={sysMeta.hrBackup} />
            </div>
            <p className="mt-3 text-[11px] font-medium text-ink-400">
              Anonymisation programmée : {sysMeta.anonymizationDue ? frDate(sysMeta.anonymizationDue) : 'non applicable (dossier actif)'}. Conservation selon le cadre légal du pays d'enregistrement.
            </p>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader title="Audit & intégrité" subtitle="Chaîne SHA-256 immuable" action={<ShieldCheck size={16} className="text-ink-400" />} />
              <p className="text-[12px] font-medium text-ink-500">Toute action sur ce dossier produit une entrée d'audit chaînée. Aucune entrée ne peut être modifiée ou supprimée sans rompre la chaîne.</p>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setIntegrityChecked(true)}>
                <ShieldCheck size={14} /> Vérifier l'intégrité de la chaîne
              </Button>
              {integrityChecked && (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-ok/25 bg-ok/[0.06] p-3">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ok" />
                  <div>
                    <p className="text-sm font-semibold text-ok">Chaîne intègre</p>
                    <p className="text-[12px] font-medium text-ink-700">Aucune rupture détectée sur les {sysMeta.modificationCount} entrées du dossier.</p>
                  </div>
                </div>
              )}
              <Link to="/audit" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-deep hover:underline">
                <FileStack size={14} /> Voir le journal d'audit complet
              </Link>
            </Card>
            <Card>
              <CardHeader title="Souveraineté des données" action={<Lock size={16} className="text-ink-400" />} />
              <p className="text-[12px] font-medium text-ink-500">Aucune donnée nominative ne quitte l'infrastructure du tenant. Les traitements <Brand name="Proph3t" /> s'exécutent en local (Ollama) — le free-tier est interdit pour tout traitement nominatif M1.</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function FamilyCard({ title, members, icon: Icon }: { title: string; members: FamilyMember[]; icon: typeof Users }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={`${members.length} déclaré(s)`} action={<Icon size={16} className="text-ink-400" />} />
      {members.length > 0 ? (
        <div className="space-y-1.5">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg bg-surface2 px-3 py-2">
              <Avatar name={m.name} size="xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
                <p className="truncate text-[11px] font-medium text-ink-400">{m.relation}</p>
              </div>
              {m.fiscalDependent && <StatusPill tone="amber" dot={false}>À charge</StatusPill>}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-3 text-sm font-medium text-ink-400">Aucun élément.</p>
      )}
    </Card>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.05] text-ink-500"><Icon size={15} /></span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
        <p className="text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

function Money3({ label, units, currency, accent }: { label: string; units: string; currency: import('../lib/money').Currency; accent?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${accent ? 'border-amber/30 bg-amber/[0.06]' : 'border-line bg-surface2'}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className={`mono text-sm font-semibold ${accent ? 'text-amber-deep' : 'text-ink'}`}>{Money.fromJSON({ units, currency }).format()}</p>
    </div>
  );
}
