import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  LogOut,
  CalendarClock,
  Calculator,
  Landmark,
  PackageCheck,
  Scale,
  FileSignature,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Save,
  X,
  Car,
  Home,
  Smartphone,
  Laptop,
  CreditCard,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { Avatar } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { FormField, Select, TextInput } from '../components/ui/FormField';
import { Switch } from '../components/ui/controls';
import { useToast } from '../components/ui/Toast';
import { Money, type Currency } from '../lib/money';
import { computePayslip, getRegime } from '../lib/payroll';
import { ComplianceGuard } from '../lib/compliance/ComplianceGuard';
import { countryByCode } from '../data/countries';
import { useDirectory } from '../store/useDirectory';
import { useUpdateEmployee, useOffboardEmployee, isBackendConfigured } from '../lib/m1/supabaseLive';
import { useCreateDeparture } from '../lib/m4/supabaseLive';
import { useEvents } from '../store/useEvents';
import {
  employeeName,
  matricule,
  employeeLeaveBalance,
  employeeBenefitsInKind,
  employeeLoans,
  employeeAdvances,
  employeeProtectedUntil,
} from '../data/mock';
import { cn } from '../lib/cn';

interface Motive {
  code: string; label: string; initiator: string;
  severance?: boolean; cddPremium?: boolean; retirement?: boolean;
  dismissal?: boolean; redirectM12?: boolean; requiresM12?: boolean; isDeath?: boolean; transfer?: boolean;
}
const MOTIVES: Motive[] = [
  { code: 'resignation', label: 'Démission', initiator: 'Employé' },
  { code: 'mutual', label: 'Rupture conventionnelle', initiator: 'Mutuel', severance: true },
  { code: 'cdd_end', label: 'Fin de CDD', initiator: 'Système', cddPremium: true },
  { code: 'trial_employer', label: "Fin de période d'essai (employeur)", initiator: 'Employeur' },
  { code: 'trial_employee', label: "Fin de période d'essai (employé)", initiator: 'Employé' },
  { code: 'economic', label: 'Licenciement économique', initiator: 'Employeur', severance: true, dismissal: true },
  { code: 'personal_non_disc', label: 'Licenciement (motif personnel non disciplinaire)', initiator: 'Employeur', severance: true, dismissal: true },
  { code: 'dismissal_for_cause', label: 'Licenciement pour faute (disciplinaire)', initiator: 'Employeur', dismissal: true, redirectM12: true },
  { code: 'retirement', label: 'Retraite (départ à la)', initiator: 'Employé', retirement: true },
  { code: 'forced_retirement', label: 'Mise à la retraite', initiator: 'Employeur', severance: true },
  { code: 'death', label: 'Décès', initiator: 'Système', isDeath: true },
  { code: 'disability', label: 'Invalidité définitive', initiator: 'M12', severance: true },
  { code: 'intra_group', label: 'Transfert intra-groupe', initiator: 'Mutuel', transfer: true },
  { code: 'job_abandonment', label: 'Abandon de poste', initiator: 'Employeur', requiresM12: true },
  { code: 'incompatible_after_mobility', label: 'Incompatibilité après mobilité', initiator: 'Mutuel' },
];

const MOTIVE_TO_M4_TYPE: Record<string, string> = {
  resignation: 'DEMISSION',
  mutual: 'RUPT_CONV',
  cdd_end: 'FIN_CDD',
  trial_employer: 'RUPT_ESSAI',
  trial_employee: 'RUPT_ESSAI',
  economic: 'LICEN_ECO',
  personal_non_disc: 'LICEN_PERSO',
  dismissal_for_cause: 'LICEN_FAUTE',
  retirement: 'RETRAITE',
  forced_retirement: 'RETRAITE',
  death: 'DECES',
  job_abandonment: 'ABANDON_POSTE',
};

const PHASES = [
  { key: 'initiation', label: 'Initiation', tone: 'neutral' as const },
  { key: 'notification', label: 'Notification', tone: 'info' as const },
  { key: 'notice_period', label: 'Préavis en cours', tone: 'amber' as const },
  { key: 'pre_effect', label: 'Préparatifs', tone: 'amber' as const },
  { key: 'effect', label: 'Sortie effective', tone: 'ok' as const },
  { key: 'settlement', label: 'Solde versé', tone: 'ok' as const },
  { key: 'archived', label: 'Archivé', tone: 'neutral' as const },
];

const NAV = [
  { key: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
  { key: 'motive', label: 'Motif & qualification', icon: LogOut },
  { key: 'notice', label: 'Préavis & délais', icon: CalendarClock },
  { key: 'stc', label: 'Solde de tout compte', icon: Calculator },
  { key: 'engagements', label: 'Engagements & clauses', icon: Landmark },
  { key: 'restitutions', label: 'Restitutions', icon: PackageCheck },
  { key: 'compliance', label: 'Conformité', icon: Scale },
  { key: 'validation', label: 'Validation', icon: FileSignature },
];

type StcLine = { label: string; amount: number; ref?: string };

const ITEM_ICON: Record<string, typeof Car> = { vehicle: Car, housing: Home, phone: Smartphone, laptop: Laptop, badge: CreditCard };

export function ExitDossierPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const employee = useDirectory((s) => (id ? s.employees.find((e) => e.id === id) : undefined));
  const updateEmployee = useDirectory((s) => s.updateEmployee);
  const updateLive = useUpdateEmployee();
  const offboardLive = useOffboardEmployee();
  const createDeparture = useCreateDeparture();

  /** Persiste le passage en préavis (live audité, sinon Zustand). */
  const persistNotice = async () => {
    if (!isBackendConfigured) { updateEmployee(employee!.id, { status: 'notice' }); return; }
    try { await updateLive.mutateAsync({ id: employee!.id, patch: { status: 'notice' }, action: 'employee.exit_notice' }); }
    catch (e) { toast({ variant: 'error', title: 'Échec', description: e instanceof Error ? e.message : 'Erreur.' }); }
  };

  /** Offboarding final (statut offboarded + date de sortie, live audité). */
  const finalizeOffboard = async () => {
    if (!isBackendConfigured) return; // démo : pas de statut 'offboarded' côté EmployeeRecord
    try { await offboardLive.mutateAsync({ id: employee!.id, exitDate: effectiveDate, reason: motive.label }); }
    catch (e) { toast({ variant: 'error', title: 'Échec', description: e instanceof Error ? e.message : 'Erreur.' }); }
  };
  const append = useEvents((s) => s.append);

  const [departureId, setDepartureId] = useState<string | null>(null);
  const [section, setSection] = useState('overview');
  const [motiveCode, setMotiveCode] = useState('resignation');
  const [subMotive, setSubMotive] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('2026-07-31');
  const [noticeDispensed, setNoticeDispensed] = useState(false);
  const [compensationPaid, setCompensationPaid] = useState(true);
  const [nonCompeteMaintained, setNonCompeteMaintained] = useState(false);
  const [phase, setPhase] = useState('initiation');

  if (!employee) {
    return (
      <div className="animate-fade-up">
        <Link to="/collaborateurs" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink">
          <ArrowLeft size={15} /> Collaborateurs
        </Link>
        <Card><div className="p-6 text-center text-sm font-medium text-ink-400">Collaborateur introuvable.</div></Card>
      </div>
    );
  }

  const country = countryByCode(employee.countryCode);
  const cur = country.currency as Currency;
  const regime = getRegime(employee.countryCode);
  const name = employeeName(employee);
  const fmt = (n: number) => Money.of(Math.round(n), cur).format();
  const protectedUntil = employeeProtectedUntil(employee);
  const motive = MOTIVES.find((m) => m.code === motiveCode)!;
  const reference = `EXIT-2026-${String(parseInt(employee.id.replace(/\D/g, ''), 10) || 1).padStart(4, '0')}`;

  const hire = new Date(employee.hireDate);
  const effDate = new Date(`${effectiveDate}T00:00:00`);
  const seniorityMonths = Math.max(0, (effDate.getFullYear() - hire.getFullYear()) * 12 + (effDate.getMonth() - hire.getMonth()));
  const seniorityYears = Math.floor(seniorityMonths / 12);
  const noticeDays = ComplianceGuard.requiredNoticeDays(seniorityMonths);

  const base = employee.baseSalary;
  const leave = employeeLeaveBalance(employee);
  const loans = employeeLoans(employee);
  const advances = employeeAdvances(employee);
  const benefits = employeeBenefitsInKind(employee);

  // Ratio net/brut mensuel (déterministe) pour estimer les retenues du STC.
  const monthly = useMemo(
    () => computePayslip({ baseSalary: base, taxableAllowances: employee.taxableAllowances, nonTaxableAllowances: employee.nonTaxableAllowances, fiscalParts: employee.fiscalParts, otherDeductions: employee.otherDeductions }, regime, name),
    [base, employee, regime, name],
  );
  const grossM = Money.fromJSON({ units: monthly.result.grossTotalUnits, currency: cur }).toInt();
  const netM = Money.fromJSON({ units: monthly.result.netToPayUnits, currency: cur }).toInt();
  const netRatio = grossM > 0 ? netM / grossM : 0.82;

  // --- Moteur Solde de tout compte (déterministe) ---
  const severanceFactor = Math.min(seniorityYears, 5) * 0.30 + Math.max(0, Math.min(seniorityYears - 5, 5)) * 0.35 + Math.max(0, seniorityYears - 10) * 0.40;
  const daysInEffMonth = new Date(effDate.getFullYear(), effDate.getMonth() + 1, 0).getDate();
  const proRataSalary = Math.round((base * effDate.getDate()) / daysInEffMonth);
  const iccp = Math.round((leave.remaining * base) / 30);
  const noticeComp = Math.round((base * noticeDays) / 30);
  const nonCompeteMonthly = Math.round(base * 0.30);

  const stc = useMemo(() => {
    const credits: StcLine[] = [];
    const debits: StcLine[] = [];
    credits.push({ label: 'Salaire du mois (prorata)', amount: proRataSalary, ref: `${effDate.getDate()}/${daysInEffMonth} j` });
    if (noticeDispensed && compensationPaid) credits.push({ label: 'Indemnité compensatrice de préavis', amount: noticeComp, ref: `${noticeDays} j` });
    else if (!noticeDispensed) credits.push({ label: 'Salaire pendant le préavis', amount: noticeComp, ref: `${noticeDays} j` });
    if (leave.remaining > 0) credits.push({ label: 'Indemnité compensatrice de congés payés', amount: iccp, ref: `${leave.remaining} j` });
    if (motive.severance) credits.push({ label: 'Indemnité de licenciement', amount: Math.round(base * severanceFactor), ref: `${seniorityYears} an(s)` });
    if (motive.retirement) credits.push({ label: 'Indemnité de départ à la retraite', amount: Math.round(base * Math.max(severanceFactor, 1)), ref: `${seniorityYears} an(s)` });
    if (motive.cddPremium) credits.push({ label: 'Prime de précarité (fin CDD)', amount: Math.round(0.03 * base * seniorityMonths), ref: '3% du brut' });
    if (nonCompeteMaintained) credits.push({ label: 'Indemnité de non-concurrence (1er versement)', amount: nonCompeteMonthly, ref: 'mensuelle' });

    loans.forEach((l) => debits.push({ label: `Solde prêt — ${l.purpose}`, amount: l.remainingBalance, ref: l.reference }));
    advances.forEach((a) => debits.push({ label: `Avance — ${a.motive}`, amount: a.monthlyDeduction, ref: a.reference }));

    const totalCredits = credits.reduce((s, l) => s + l.amount, 0);
    const totalDebits = debits.reduce((s, l) => s + l.amount, 0);
    const grossBase = totalCredits - totalDebits;
    const estimatedDeductions = Math.round(grossBase * (1 - netRatio));
    const net = grossBase - estimatedDeductions;
    return { credits, debits, totalCredits, totalDebits, grossBase, estimatedDeductions, net };
  }, [proRataSalary, daysInEffMonth, noticeDispensed, compensationPaid, noticeComp, noticeDays, leave.remaining, iccp, motive, base, severanceFactor, seniorityYears, seniorityMonths, nonCompeteMaintained, nonCompeteMonthly, loans, advances, netRatio, effDate]);

  // --- ComplianceGuard ---
  type Check = { status: 'ok' | 'warn' | 'block'; label: string; detail: string; basis?: string };
  const checks: Check[] = useMemo(() => {
    const out: Check[] = [];
    if (motive.redirectM12) out.push({ status: 'block', label: 'Procédure disciplinaire requise', detail: 'Un licenciement pour faute relève du module disciplinaire (M12) : convocation, entretien préalable, délais légaux et voies de recours.', basis: `Code du travail ${employee.countryCode}` });
    if (motive.requiresM12) out.push({ status: 'block', label: 'Mise en demeure préalable requise', detail: "L'abandon de poste nécessite une procédure de mise en demeure formelle (M12) avant d'initier la sortie." });
    if (protectedUntil && motive.dismissal) out.push({ status: 'block', label: 'Salarié protégé', detail: `Mandat actif jusqu'au ${new Date(`${protectedUntil}T00:00:00`).toLocaleDateString('fr-FR')} — autorisation préalable de l'inspection du travail obligatoire.` });
    if (motive.dismissal && !motive.redirectM12) {
      const c = ComplianceGuard.checkDismissalNotice({ countryCode: employee.countryCode, seniorityMonths, noticeDaysGiven: noticeDispensed ? noticeDays : noticeDays });
      out.push(c.verdict === 'allow' ? { status: 'ok', label: 'Préavis conforme', detail: c.message, basis: c.legalBasis } : { status: 'block', label: 'Préavis insuffisant', detail: c.message, basis: c.legalBasis });
    } else {
      out.push({ status: 'ok', label: 'Préavis conforme', detail: `Préavis retenu de ${noticeDays} j cohérent avec l'ancienneté (${seniorityYears} an(s)).` });
    }
    if (noticeDispensed && !compensationPaid) out.push({ status: 'warn', label: 'Dispense de préavis non payée', detail: 'Une dispense de préavis non indemnisée est fréquemment source de contentieux.' });
    out.push({ status: 'ok', label: 'Versement du STC dans les délais', detail: 'Le solde de tout compte est versé sous les délais légaux suivant la date d’effet.' });
    out.push({ status: stc.net >= 0 ? 'ok' : 'warn', label: 'Cohérence du solde', detail: stc.net >= 0 ? 'Solde net positif.' : 'Solde net négatif après débits — à clarifier avec l’employé.' });
    return out;
  }, [motive, protectedUntil, employee.countryCode, seniorityMonths, seniorityYears, noticeDays, noticeDispensed, compensationPaid, stc.net]);

  const blocking = checks.some((c) => c.status === 'block');
  const phaseIdx = PHASES.findIndex((p) => p.key === phase);
  const currentPhase = PHASES[phaseIdx];

  const restitutions = useMemo(() => {
    const items: { type: string; label: string; ref: string }[] = [];
    benefits.forEach((b) => {
      if (b.type === 'vehicle') items.push({ type: 'vehicle', label: b.label, ref: 'Fleet manager' });
      else if (b.type === 'housing') items.push({ type: 'housing', label: b.label, ref: 'Facility management' });
      else items.push({ type: 'phone', label: b.label, ref: 'IT' });
    });
    items.push({ type: 'laptop', label: 'Ordinateur portable', ref: 'IT' });
    items.push({ type: 'badge', label: "Badge d'accès", ref: 'Sécurité' });
    return items;
  }, [benefits]);

  const applyEffective = () => {
    void persistNotice();
    append({ employeeId: employee.id, type: 'exit', date: effectiveDate, label: `${reference} — ${motive.label}` });
    toast({ variant: 'warning', title: 'Sortie effective', description: `${reference} · ${motive.label} · effet ${effDate.toLocaleDateString('fr-FR')}.` });
  };

  const advance = () => {
    if (motive.redirectM12 || motive.requiresM12) return;
    if (phase === 'initiation') {
      setPhase('notification');
      // Création du dossier départ dans m4_departures (non-bloquant)
      if (isBackendConfigured && employee && !departureId) {
        void createDeparture.mutateAsync({
          employeeId: employee.id,
          type: MOTIVE_TO_M4_TYPE[motiveCode] ?? 'DEMISSION',
          initiative: motive.initiator === 'Employé' ? 'salarie' : motive.initiator === 'Employeur' ? 'employeur' : 'mutuelle',
          reason: subMotive || undefined,
        }).then(({ id: depId }) => setDepartureId(depId)).catch(() => { /* non-bloquant */ });
      }
      return;
    }
    if (phase === 'notification') { void persistNotice(); setPhase('notice_period'); return; }
    if (phase === 'notice_period') { setPhase('pre_effect'); return; }
    if (phase === 'pre_effect') { if (!blocking) { setPhase('effect'); applyEffective(); } return; }
    if (phase === 'effect') { setPhase('settlement'); toast({ variant: 'success', title: 'Solde de tout compte versé', description: `${fmt(stc.net)} FCFA · reçu signé.` }); return; }
    if (phase === 'settlement') { void finalizeOffboard(); setPhase('archived'); navigate(`/collaborateurs/${employee.id}`); return; }
  };

  const advanceLabel = (): string => {
    switch (phase) {
      case 'initiation': return "Notifier l'employé";
      case 'notification': return 'Démarrer le préavis';
      case 'notice_period': return 'Passer aux préparatifs';
      case 'pre_effect': return blocking ? 'Conformité bloquante' : "Acter la sortie (date d'effet)";
      case 'effect': return 'Verser le solde de tout compte';
      case 'settlement': return 'Archiver le dossier';
      default: return 'Clôturé';
    }
  };
  const advanceDisabled = motive.redirectM12 || motive.requiresM12 || (phase === 'pre_effect' && blocking) || phase === 'archived';

  return (
    <div className="animate-fade-up space-y-5">
      <Breadcrumb items={[{ label: 'People', to: '/' }, { label: 'Collaborateurs', to: '/collaborateurs' }, { label: name, to: `/collaborateurs/${employee.id}` }, { label: 'Sortie' }]} />

      {/* Header dossier — ton sobre */}
      <Card className="surface-night border-0 overflow-hidden" inset={false}>
        <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={name} size="lg" />
            <div>
              <h1 className="text-xl font-semibold text-ink">Dossier de sortie — {name}</h1>
              <p className="text-sm font-medium text-ink-500">{employee.role} · {employee.department} · ancienneté {seniorityYears} an{seniorityYears > 1 ? 's' : ''}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="mono rounded-full bg-amber/15 px-2.5 py-1 text-[11px] font-bold text-amber-deep">{reference}</span>
                <span className="mono rounded-full bg-ink/[0.05] px-2.5 py-1 text-[11px] font-semibold text-ink-700">{matricule(employee)}</span>
                <StatusPill tone={currentPhase.tone} dot={false}>{currentPhase.label}</StatusPill>
                <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.05] px-2.5 py-1 text-[11px] font-semibold text-ink-700">Effet {effDate.toLocaleDateString('fr-FR')}</span>
                {protectedUntil && <StatusPill tone="warn" dot={false}>Salarié protégé</StatusPill>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Brouillon sauvegardé', description: `${reference} enregistré.` })}><Save size={14} /> Sauvegarder</Button>
            <Link to={`/collaborateurs/${employee.id}`}><Button variant="ghost" size="sm"><X size={14} /> Annuler</Button></Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        <Card className="h-fit" inset={false}>
          <nav className="flex flex-row flex-wrap gap-1 p-2 lg:flex-col">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = section === n.key;
              return (
                <button key={n.key} onClick={() => setSection(n.key)}
                  className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors', active ? 'bg-amber/12 text-amber-deep ring-1 ring-amber/30' : 'text-ink-500 hover:bg-ink/[0.04] hover:text-ink')}>
                  <Icon size={16} /> {n.label}
                </button>
              );
            })}
          </nav>
        </Card>

        <div className="space-y-5">
          {/* VUE D'ENSEMBLE */}
          {section === 'overview' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader title="Synthèse du dossier" subtitle="Départ accompagné avec dignité" />
                <div className="space-y-2 text-sm">
                  <Row label="Motif" value={motive.label} />
                  <Row label="Initiateur" value={motive.initiator} />
                  <Row label="Date d'effet" value={effDate.toLocaleDateString('fr-FR')} />
                  <Row label="Préavis (OHADA)" value={`${noticeDays} jours`} />
                  <Row label="Solde de tout compte estimé" value={`${fmt(stc.net)} FCFA`} />
                </div>
              </Card>
              <Card>
                <CardHeader title="Indicateurs clés" subtitle="À traiter" />
                <div className="grid grid-cols-2 gap-3">
                  <Mini label="Engagements en cours" value={String(loans.length + advances.length)} />
                  <Mini label="Congés non pris" value={`${leave.remaining} j`} />
                  <Mini label="Biens à restituer" value={String(restitutions.length)} />
                  <Mini label="Ancienneté" value={`${seniorityYears} an${seniorityYears > 1 ? 's' : ''}`} />
                </div>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader title="Workflow du dossier" subtitle="7 phases" />
                <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PHASES.map((p, i) => (
                    <li key={p.key} className="flex items-center gap-3">
                      <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', i < phaseIdx ? 'bg-ok/15 text-ok' : i === phaseIdx ? 'bg-amber/15 text-amber-deep' : 'bg-ink/[0.05] text-ink-400')}>
                        {i < phaseIdx ? <CheckCircle2 size={14} /> : i + 1}
                      </span>
                      <span className={cn('text-sm', i === phaseIdx ? 'font-bold text-ink' : 'font-medium text-ink-500')}>{p.label}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          )}

          {/* MOTIF */}
          {section === 'motive' && (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Motif & qualification" subtitle="Vocabulaire neutre — les droits de l'employé sont préservés" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Motif de la sortie" required>
                    <Select value={motiveCode} onChange={(e) => setMotiveCode(e.target.value)}>
                      {MOTIVES.map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Sous-motif / précisions">
                    <TextInput value={subMotive} onChange={(e) => setSubMotive(e.target.value)} placeholder="ex. suppression de poste" />
                  </FormField>
                  <FormField label="Date d'effet visée" required>
                    <TextInput type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
                  </FormField>
                  <FormField label="Initiateur"><TextInput value={motive.initiator} disabled /></FormField>
                </div>
              </Card>

              {(protectedUntil || motive.redirectM12 || motive.requiresM12 || motive.isDeath) && (
                <Card className="border-warn/30">
                  <CardHeader title="Statut spécial — vigilance" subtitle="Procédure adaptée requise" action={<ShieldAlert size={16} className="text-warn" />} />
                  <div className="space-y-2">
                    {motive.redirectM12 && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/[0.06] p-3">
                        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-danger" />
                        <div>
                          <p className="text-sm font-bold text-danger">Licenciement pour faute — redirection M12</p>
                          <p className="text-[12px] font-medium text-ink-700">La procédure disciplinaire (convocation, entretien préalable, délais, voies de recours) est pilotée par le module disciplinaire. Atlas People en garantit la conformité.</p>
                          <Button variant="outline" size="sm" className="mt-2" onClick={() => toast({ variant: 'info', title: 'Module disciplinaire (M12)', description: 'Procédure disciplinaire à engager — P12.9.' })}>Aller au module disciplinaire (M12)</Button>
                        </div>
                      </div>
                    )}
                    {motive.requiresM12 && <p className="flex items-start gap-2 text-[12px] font-medium text-warn"><ShieldAlert size={14} className="mt-0.5 shrink-0" /> L'abandon de poste nécessite une mise en demeure préalable formelle (M12) avant d'initier la sortie.</p>}
                    {protectedUntil && <p className="flex items-start gap-2 text-[12px] font-medium text-warn"><ShieldAlert size={14} className="mt-0.5 shrink-0" /> Salarié protégé jusqu'au {new Date(`${protectedUntil}T00:00:00`).toLocaleDateString('fr-FR')} — autorisation de l'inspection du travail requise pour un licenciement.</p>}
                    {motive.isDeath && <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldAlert size={14} className="mt-0.5 shrink-0 text-info" /> Procédure respectueuse : pas de préavis ; les soldes et le capital décès sont versés aux bénéficiaires désignés.</p>}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* PRÉAVIS */}
          {section === 'notice' && (
            <Card>
              <CardHeader title="Préavis & délais" subtitle="Calcul OHADA déterministe" action={<StatusPill tone="info" dot={false}>{noticeDays} jours</StatusPill>} />
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <Row label="Préavis légal (ancienneté)" value={`${noticeDays} jours`} />
                <Row label="Ancienneté reconnue" value={`${seniorityYears} an(s) ${seniorityMonths % 12} mois`} />
                <Row label="Date d'effet" value={effDate.toLocaleDateString('fr-FR')} />
                <Row label="Salaire de référence" value={`${fmt(base)} FCFA`} />
              </div>
              <div className="mt-4 space-y-3 border-t border-line pt-4">
                <Switch checked={noticeDispensed} onChange={setNoticeDispensed} label="Dispense de préavis" />
                {noticeDispensed && (
                  <Switch checked={compensationPaid} onChange={setCompensationPaid} label="Préavis payé mais non travaillé (indemnité compensatrice)" />
                )}
              </div>
            </Card>
          )}

          {/* SOLDE DE TOUT COMPTE */}
          {section === 'stc' && (
            <Card>
              <CardHeader title="Solde de tout compte" subtitle="Calcul déterministe · pur TypeScript" action={<StatusPill tone={stc.net >= 0 ? 'ok' : 'warn'}>{stc.net >= 0 ? 'Cohérent' : 'À clarifier'}</StatusPill>} />
              <div className="overflow-hidden rounded-xl border border-line">
                <div className="bg-ok/[0.05] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-ok">Crédits — à payer</div>
                <div className="divide-y divide-line">
                  {stc.credits.map((l) => (
                    <div key={l.label} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm font-semibold text-ink-700">{l.label}{l.ref && <span className="ml-1.5 text-[11px] font-medium text-ink-400">({l.ref})</span>}</span>
                      <span className="mono text-sm font-semibold text-ok">+{fmt(l.amount)}</span>
                    </div>
                  ))}
                </div>
                {stc.debits.length > 0 && (
                  <>
                    <div className="bg-danger/[0.05] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-danger">Débits — à retenir</div>
                    <div className="divide-y divide-line">
                      {stc.debits.map((l) => (
                        <div key={l.label} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-sm font-semibold text-ink-700">{l.label}{l.ref && <span className="ml-1.5 text-[11px] font-medium text-ink-400">({l.ref})</span>}</span>
                          <span className="mono text-sm font-semibold text-danger">−{fmt(l.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div className="divide-y divide-line border-t border-line bg-surface2">
                  <RowMono label="Base brute (crédits − débits)" value={fmt(stc.grossBase)} />
                  <RowMono label="Cotisations & impôts estimés" value={`−${fmt(stc.estimatedDeductions)}`} />
                </div>
                <div className="flex items-center justify-between bg-amber/[0.06] px-4 py-3">
                  <span className="text-sm font-bold text-ink">Solde net à verser</span>
                  <span className="mono text-2xl font-semibold text-amber-deep">{fmt(stc.net)}</span>
                </div>
              </div>
              <p className="mt-3 text-[11px] font-medium text-ink-400">Estimation déterministe (ratio net/brut {Math.round(netRatio * 100)}%). Le calcul officiel applique les exonérations propres à chaque indemnité.</p>
            </Card>
          )}

          {/* ENGAGEMENTS & CLAUSES */}
          {section === 'engagements' && (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Engagements financiers à solder" subtitle="Prêts, avances — remboursement anticipé" action={<Landmark size={16} className="text-ink-400" />} />
                {(loans.length + advances.length) > 0 ? (
                  <div className="space-y-1.5">
                    {loans.map((l) => (
                      <div key={l.reference} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2.5">
                        <div><p className="text-sm font-semibold text-ink">{l.purpose}</p><p className="mono text-[11px] font-medium text-ink-400">{l.reference} · remboursement anticipé</p></div>
                        <span className="mono text-sm font-bold text-danger">−{fmt(l.remainingBalance)}</span>
                      </div>
                    ))}
                    {advances.map((a) => (
                      <div key={a.reference} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2.5">
                        <div><p className="text-sm font-semibold text-ink">{a.motive}</p><p className="mono text-[11px] font-medium text-ink-400">{a.reference}</p></div>
                        <span className="mono text-sm font-bold text-danger">−{fmt(a.monthlyDeduction)}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm font-medium text-ink-400">Aucun engagement financier en cours.</p>}
              </Card>
              <Card>
                <CardHeader title="Clause de non-concurrence" subtitle="Décision dans le délai contractuel" action={<Scale size={16} className="text-ink-400" />} />
                <Switch checked={nonCompeteMaintained} onChange={setNonCompeteMaintained} label="Maintenir la clause de non-concurrence" hint={`Coût de maintien : ${fmt(nonCompeteMonthly)} FCFA/mois d'indemnité compensatrice.`} />
                <p className="mt-3 text-[11px] font-medium text-ink-400">Les clauses de propriété intellectuelle et de confidentialité (NDA) demeurent applicables après le départ et sont rappelées dans la lettre de fin de contrat.</p>
              </Card>
            </div>
          )}

          {/* RESTITUTIONS */}
          {section === 'restitutions' && (
            <Card>
              <CardHeader title="Restitutions matérielles" subtitle="Inventaire & états des lieux" action={<PackageCheck size={16} className="text-ink-400" />} />
              <div className="space-y-1.5">
                {restitutions.map((r, i) => {
                  const Icon = ITEM_ICON[r.type] ?? PackageCheck;
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><Icon size={15} /></span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{r.label}</p><p className="text-[11px] font-medium text-ink-400">Réception : {r.ref} · le {effDate.toLocaleDateString('fr-FR')}</p></div>
                      <StatusPill tone="neutral" dot={false}>à restituer</StatusPill>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] font-medium text-ink-400">Les états des lieux (véhicule, logement) sont contradictoires et signés ; toute dégradation à charge de l'employé est portée au solde de tout compte.</p>
            </Card>
          )}

          {/* CONFORMITÉ */}
          {section === 'compliance' && (
            <Card>
              <CardHeader title="ComplianceGuard" subtitle="Conformité OHADA / SYSCOHADA — l'avancement est bloqué si une règle est enfreinte"
                action={<StatusPill tone={blocking ? 'danger' : checks.some((c) => c.status === 'warn') ? 'warn' : 'ok'}>{blocking ? 'Bloquant' : checks.some((c) => c.status === 'warn') ? 'Avertissements' : 'Conforme'}</StatusPill>} />
              <div className="space-y-2">
                {checks.map((c) => (
                  <div key={c.label} className={cn('flex items-start gap-3 rounded-xl border p-3', c.status === 'block' ? 'border-danger/30 bg-danger/[0.06]' : c.status === 'warn' ? 'border-warn/30 bg-warn/[0.06]' : 'border-ok/25 bg-ok/[0.05]')}>
                    {c.status === 'ok' ? <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ok" /> : <ShieldAlert size={18} className={cn('mt-0.5 shrink-0', c.status === 'block' ? 'text-danger' : 'text-warn')} />}
                    <div className="min-w-0">
                      <p className={cn('text-sm font-bold', c.status === 'block' ? 'text-danger' : c.status === 'warn' ? 'text-warn' : 'text-ok')}>{c.label}</p>
                      <p className="text-[12px] font-medium text-ink-700">{c.detail}</p>
                      {c.basis && <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">{c.basis}</p>}
                    </div>
                  </div>
                ))}
              </div>
              {blocking && <p className="mt-3 text-[11px] font-semibold text-danger">Un contrôle bloquant doit être résolu (ou la procédure déplacée vers M12) avant la sortie effective.</p>}
            </Card>
          )}

          {/* VALIDATION */}
          {section === 'validation' && (
            <Card>
              <CardHeader title="Étape de validation" subtitle="Workflow de sortie" action={<StatusPill tone={currentPhase.tone} dot={false}>{currentPhase.label}</StatusPill>} />
              <ol className="space-y-2">
                {PHASES.map((p, i) => (
                  <li key={p.key} className="flex items-center gap-3">
                    <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', i < phaseIdx ? 'bg-ok/15 text-ok' : i === phaseIdx ? 'bg-amber/15 text-amber-deep' : 'bg-ink/[0.05] text-ink-400')}>
                      {i < phaseIdx ? <CheckCircle2 size={14} /> : i + 1}
                    </span>
                    <span className={cn('text-sm', i === phaseIdx ? 'font-bold text-ink' : 'font-medium text-ink-500')}>{p.label}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                <p className="text-[12px] font-medium text-ink-500">
                  {motive.redirectM12 ? 'Procédure disciplinaire à finaliser dans M12 avant toute sortie.' : phase === 'archived' ? 'Dossier clôturé.' : `Solde net estimé : ${fmt(stc.net)} FCFA.`}
                </p>
                <Button size="sm" disabled={advanceDisabled} onClick={advance}>{advanceLabel()} <ArrowRight size={14} /></Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-ink-500">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

function RowMono({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm font-semibold text-ink-700">{label}</span>
      <span className="mono text-sm font-bold text-ink">{value}</span>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface2 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mono mt-0.5 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}
