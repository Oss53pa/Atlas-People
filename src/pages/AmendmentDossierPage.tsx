import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileSignature,
  LayoutDashboard,
  Pencil,
  Scale,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Coins,
  ArrowRight,
  Save,
  X,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { Avatar } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { EmptyState } from '../components/ui/feedback';
import { FormField, Select, TextInput } from '../components/ui/FormField';
import { MoneyInput } from '../components/ui/MoneyDisplay';
import { Checkbox } from '../components/ui/controls';
import { useToast } from '../components/ui/Toast';
import { Money, type Currency } from '../lib/money';
import { computePayslip, getRegime } from '../lib/payroll';
import { ComplianceGuard } from '../lib/compliance/ComplianceGuard';
import { countryByCode } from '../data/countries';
import { useDirectory } from '../store/useDirectory';
import { useEvents } from '../store/useEvents';
import { employeeName, matricule, employeeProtectedUntil } from '../data/mock';
import { cn } from '../lib/cn';

/** Les 12 types d'avenant pris en charge (P1.9 §2.4). Multi-sélection possible. */
const AMENDMENT_TYPES = [
  { code: 'salary', label: 'Modification du salaire' },
  { code: 'allowances', label: 'Primes / indemnités' },
  { code: 'promotion', label: 'Promotion' },
  { code: 'mobility', label: 'Mobilité interne' },
  { code: 'worktime', label: 'Durée du travail' },
  { code: 'classification', label: 'Classification' },
  { code: 'cdd_renewal', label: 'Renouvellement CDD' },
  { code: 'transform', label: 'Transformation de contrat' },
  { code: 'benefit', label: 'Avantage en nature' },
  { code: 'loan', label: 'Avantage financier / prêt' },
  { code: 'clause', label: 'Clause contractuelle' },
  { code: 'multi', label: 'Multi-modifications' },
] as const;

/** Phases du workflow d'un avenant (P1.9 §2.5.2). */
const PHASES = [
  { key: 'draft', label: 'Brouillon', tone: 'neutral' as const },
  { key: 'compliance_check', label: 'Vérification conformité', tone: 'info' as const },
  { key: 'pending_validation', label: 'Validation DRH', tone: 'amber' as const },
  { key: 'pending_employee_acceptance', label: 'Acceptation employé', tone: 'info' as const },
  { key: 'pending_signature', label: 'Signature électronique', tone: 'amber' as const },
  { key: 'signed_pending_effect', label: 'Signé — attente d’effet', tone: 'ok' as const },
  { key: 'effective', label: 'En vigueur', tone: 'ok' as const },
];

const SALARY_MOTIVES = ['Augmentation annuelle', 'Promotion', 'Réorganisation', 'Alignement marché', 'Reconnaissance performance', 'Régularisation', 'Diminution (accord)', 'Autre'];

type Check = { status: 'ok' | 'warn' | 'block'; label: string; detail: string; basis?: string };

const NAV = [
  { key: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
  { key: 'modification', label: 'Modification', icon: Pencil },
  { key: 'impact', label: 'Impact paie', icon: Coins },
  { key: 'compliance', label: 'Conformité', icon: Scale },
  { key: 'validation', label: 'Validation', icon: FileSignature },
];

export function AmendmentDossierPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const employee = useDirectory((s) => (id ? s.employees.find((e) => e.id === id) : undefined));
  const updateEmployee = useDirectory((s) => s.updateEmployee);
  const append = useEvents((s) => s.append);

  const [section, setSection] = useState('overview');
  const [types, setTypes] = useState<string[]>(['salary']);
  const [effectiveDate, setEffectiveDate] = useState('2026-07-01');
  const [newSalary, setNewSalary] = useState(0);
  const [extraPrime, setExtraPrime] = useState(0);
  const [motive, setMotive] = useState(SALARY_MOTIVES[0]);
  const [newJob, setNewJob] = useState('');
  const [justification, setJustification] = useState('');
  const [reductionAck, setReductionAck] = useState(false);
  const [phase, setPhase] = useState('draft');

  if (!employee) {
    return (
      <div className="animate-fade-up">
        <Link to="/collaborateurs" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink">
          <ArrowLeft size={15} /> Collaborateurs
        </Link>
        <Card><EmptyState title="Collaborateur introuvable." description="Impossible de créer un avenant pour cette fiche." /></Card>
      </div>
    );
  }

  const country = countryByCode(employee.countryCode);
  const cur = country.currency as Currency;
  const regime = getRegime(employee.countryCode);
  const protectedUntil = employeeProtectedUntil(employee);
  const base = employee.baseSalary;
  const effectiveSalary = newSalary > 0 ? newSalary : base;
  const isReduction = newSalary > 0 && newSalary < base;
  const variationPct = base > 0 ? Math.round(((effectiveSalary - base) / base) * 1000) / 10 : 0;
  const reference = `AVE-2026-${String(parseInt(employee.id.replace(/\D/g, ''), 10) || 1).padStart(4, '0')}`;

  const fmt = (n: number) => Money.of(n, cur).format();
  const name = employeeName(employee);

  const before = useMemo(
    () => computePayslip({ baseSalary: base, taxableAllowances: employee.taxableAllowances, nonTaxableAllowances: employee.nonTaxableAllowances, fiscalParts: employee.fiscalParts, otherDeductions: employee.otherDeductions }, regime, name),
    [base, employee, regime, name],
  );
  const after = useMemo(
    () => computePayslip({ baseSalary: effectiveSalary, taxableAllowances: employee.taxableAllowances + extraPrime, nonTaxableAllowances: employee.nonTaxableAllowances, fiscalParts: employee.fiscalParts, otherDeductions: employee.otherDeductions }, regime, name),
    [effectiveSalary, extraPrime, employee, regime, name],
  );

  const intOf = (units: string) => Money.fromJSON({ units, currency: cur }).toInt();
  const hasChange = newSalary > 0 || extraPrime > 0 || newJob.trim().length > 0;

  // ---- ComplianceGuard (déterministe) ----
  const checks: Check[] = useMemo(() => {
    const out: Check[] = [];
    const floor = ComplianceGuard.checkSalaryFloor({ countryCode: employee.countryCode, monthlySalary: effectiveSalary });
    out.push(floor.verdict === 'allow'
      ? { status: 'ok', label: 'SMIG respecté', detail: floor.message, basis: floor.legalBasis }
      : { status: 'block', label: 'SMIG non respecté', detail: floor.message, basis: floor.legalBasis });
    if (Math.abs(variationPct) > 30) out.push({ status: 'warn', label: 'Variation salariale > 30%', detail: `Variation de ${variationPct > 0 ? '+' : ''}${variationPct}% — justification renforcée recommandée.` });
    if (isReduction) out.push(reductionAck
      ? { status: 'ok', label: 'Diminution acceptée', detail: "L'accord écrit de l'employé est confirmé." }
      : { status: 'block', label: 'Diminution sans accord', detail: "Une diminution de salaire requiert l'accord écrit de l'employé." });
    if (protectedUntil) out.push({ status: 'warn', label: 'Salarié protégé', detail: `Mandat actif jusqu'au ${new Date(`${protectedUntil}T00:00:00`).toLocaleDateString('fr-FR')} — procédure renforcée applicable.` });
    out.push({ status: 'ok', label: 'Classification cohérente', detail: 'Le nouveau positionnement reste cohérent avec la grille conventionnelle.' });
    return out;
  }, [effectiveSalary, variationPct, isReduction, reductionAck, protectedUntil, employee.countryCode]);

  const blocking = checks.some((c) => c.status === 'block');
  const phaseIdx = PHASES.findIndex((p) => p.key === phase);
  const currentPhase = PHASES[phaseIdx];

  const applyEffective = () => {
    if (newSalary > 0) updateEmployee(employee.id, { baseSalary: newSalary });
    const evType = types.includes('promotion') ? 'promotion' : newSalary > 0 ? 'salary_change' : 'amendment';
    append({ employeeId: employee.id, type: evType, date: effectiveDate, label: `${reference} — ${typeLabels(types)}${newSalary > 0 ? ` (${fmt(newSalary)})` : ''}` });
    toast({ variant: 'success', title: 'Avenant en vigueur', description: `${reference} appliqué · effet ${new Date(effectiveDate).toLocaleDateString('fr-FR')}.` });
    navigate(`/collaborateurs/${employee.id}`);
  };

  const advance = () => {
    if (phase === 'draft') { setPhase('compliance_check'); setSection('compliance'); return; }
    if (phase === 'compliance_check') { if (!blocking) setPhase('pending_validation'); return; }
    if (phase === 'pending_validation') { setPhase('pending_employee_acceptance'); return; }
    if (phase === 'pending_employee_acceptance') { setPhase('pending_signature'); return; }
    if (phase === 'pending_signature') { setPhase('signed_pending_effect'); return; }
    if (phase === 'signed_pending_effect') { setPhase('effective'); applyEffective(); return; }
  };

  const advanceLabel = (): string => {
    switch (phase) {
      case 'draft': return 'Soumettre — lancer la conformité';
      case 'compliance_check': return blocking ? 'Conformité bloquante' : 'Soumettre à validation DRH';
      case 'pending_validation': return 'Valider (DRH)';
      case 'pending_employee_acceptance': return "Acceptation de l'employé";
      case 'pending_signature': return 'Signer électroniquement (ADVIST)';
      case 'signed_pending_effect': return "Appliquer à la date d'effet";
      default: return 'Terminé';
    }
  };
  const advanceDisabled = (phase === 'draft' && !hasChange) || (phase === 'compliance_check' && blocking) || phase === 'effective';

  const toggleType = (code: string) =>
    setTypes((t) => (t.includes(code) ? t.filter((x) => x !== code) : [...t, code]));

  return (
    <div className="animate-fade-up space-y-5">
      <Breadcrumb items={[{ label: 'People', to: '/' }, { label: 'Collaborateurs', to: '/collaborateurs' }, { label: name, to: `/collaborateurs/${employee.id}` }, { label: 'Nouvel avenant' }]} />

      {/* Header dossier */}
      <Card className="surface-night border-0 overflow-hidden" inset={false}>
        <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={name} size="lg" />
            <div>
              <h1 className="text-xl font-semibold text-ink">Avenant — {name}</h1>
              <p className="text-sm font-medium text-ink-500">{employee.role} · {employee.department} · {country.flag} {country.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="mono rounded-full bg-amber/15 px-2.5 py-1 text-[11px] font-bold text-amber-deep">{reference}</span>
                <span className="mono rounded-full bg-ink/[0.05] px-2.5 py-1 text-[11px] font-semibold text-ink-700">{matricule(employee)}</span>
                <StatusPill tone={currentPhase.tone} dot={false}>{currentPhase.label}</StatusPill>
                <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.05] px-2.5 py-1 text-[11px] font-semibold text-ink-700">Effet {new Date(`${effectiveDate}T00:00:00`).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Brouillon sauvegardé', description: `${reference} enregistré.` })}><Save size={14} /> Sauvegarder</Button>
            <Link to={`/collaborateurs/${employee.id}`}><Button variant="ghost" size="sm"><X size={14} /> Annuler</Button></Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
        {/* Sidebar onglets verticale */}
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
          {/* ---- VUE D'ENSEMBLE ---- */}
          {section === 'overview' && (
            <>
              <Card>
                <CardHeader title="Type d'avenant" subtitle="Sélectionnez une ou plusieurs modifications structurelles" />
                <div className="flex flex-wrap gap-2">
                  {AMENDMENT_TYPES.map((t) => {
                    const active = types.includes(t.code);
                    return (
                      <button key={t.code} onClick={() => toggleType(t.code)}
                        className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors', active ? 'border-amber/40 bg-amber/12 text-amber-deep' : 'border-line bg-surface text-ink-500 hover:border-amber/30')}>
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </Card>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Synthèse" subtitle={`Version contractuelle visée · v${(parseInt(employee.id.replace(/\D/g, ''), 10) % 4) + 2}`} />
                  <div className="space-y-2 text-sm">
                    <Row label="Type" value={typeLabels(types)} />
                    <Row label="Date d'effet" value={new Date(`${effectiveDate}T00:00:00`).toLocaleDateString('fr-FR')} />
                    <Row label="Salaire actuel" value={`${fmt(base)} FCFA`} />
                    <Row label="Salaire visé" value={newSalary > 0 ? `${fmt(newSalary)} FCFA (${variationPct > 0 ? '+' : ''}${variationPct}%)` : 'inchangé'} />
                  </div>
                  <FormField label="Date d'effet" className="mt-3" required>
                    <TextInput type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
                  </FormField>
                </Card>
                <Card>
                  <CardHeader title="Prochaines étapes" subtitle="Workflow de validation" />
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
                </Card>
              </div>
            </>
          )}

          {/* ---- MODIFICATION ---- */}
          {section === 'modification' && (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Salaire de base" subtitle={`Actuel : ${fmt(base)} FCFA / mois`} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Nouveau salaire de base (FCFA)">
                    <MoneyInput value={newSalary} onChange={setNewSalary} />
                  </FormField>
                  <FormField label="Motif" required>
                    <Select value={motive} onChange={(e) => setMotive(e.target.value)}>
                      {SALARY_MOTIVES.map((m) => <option key={m}>{m}</option>)}
                    </Select>
                  </FormField>
                </div>
                {newSalary > 0 && (
                  <div className={cn('mt-3 rounded-xl border px-3 py-2.5 text-sm font-semibold', variationPct >= 0 ? 'border-ok/25 bg-ok/[0.06] text-ok' : 'border-danger/25 bg-danger/[0.06] text-danger')}>
                    Variation : {variationPct > 0 ? '+' : ''}{fmt(newSalary - base)} FCFA ({variationPct > 0 ? '+' : ''}{variationPct}%)
                  </div>
                )}
                {isReduction && (
                  <div className="mt-3">
                    <Checkbox checked={reductionAck} onChange={setReductionAck} label="Cette diminution a été acceptée par écrit par l'employé" hint="Obligatoire : une baisse de salaire requiert l'accord de l'employé." />
                  </div>
                )}
              </Card>
              <Card>
                <CardHeader title="Primes & indemnités" subtitle="Ajout d'une composante structurelle" />
                <FormField label="Nouvelle prime de fonction (FCFA / mois)" hint="Créée avec la date d'effet de l'avenant (versionnement, jamais d'écrasement).">
                  <MoneyInput value={extraPrime} onChange={setExtraPrime} />
                </FormField>
              </Card>
              <Card>
                <CardHeader title="Poste & justification" subtitle="Promotion / changement de poste (optionnel)" />
                <FormField label="Nouvel intitulé de poste (optionnel)">
                  <TextInput value={newJob} onChange={(e) => setNewJob(e.target.value)} placeholder={employee.role} />
                </FormField>
                <FormField label="Justification détaillée" className="mt-3">
                  <textarea value={justification} onChange={(e) => setJustification(e.target.value)} rows={3}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none focus:ring-2 focus:ring-amber/15"
                    placeholder="Contexte de l'avenant…" />
                </FormField>
              </Card>
            </div>
          )}

          {/* ---- IMPACT PAIE (diff Avant/Après/Δ) ---- */}
          {section === 'impact' && (
            <Card>
              <CardHeader title="Impact sur la paie" subtitle="Calcul déterministe · double vérification" action={<StatusPill tone={after.verification.ok ? 'ok' : 'danger'}>{after.verification.ok ? 'Vérifié' : 'Écart'}</StatusPill>} />
              <div className="overflow-hidden rounded-xl border border-line">
                <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 border-b border-line bg-surface2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                  <span>Élément</span><span className="text-right">Avant</span><span className="text-right">Après</span><span className="text-right">Δ</span>
                </div>
                <div className="divide-y divide-line">
                  <DiffRow label="Brut total" before={intOf(before.result.grossTotalUnits)} after={intOf(after.result.grossTotalUnits)} fmt={fmt} />
                  <DiffRow label="Cotisations salariales" before={intOf(before.result.totalEmployeeContributionUnits)} after={intOf(after.result.totalEmployeeContributionUnits)} fmt={fmt} invert />
                  <DiffRow label="Net à payer" before={intOf(before.result.netToPayUnits)} after={intOf(after.result.netToPayUnits)} fmt={fmt} accent />
                  <DiffRow label="Coût employeur" before={intOf(before.result.employerCostUnits)} after={intOf(after.result.employerCostUnits)} fmt={fmt} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-amber/30 bg-amber/[0.06] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Nouveau net mensuel</p>
                  <p className="mono mt-1 text-2xl font-semibold text-amber-deep">{fmt(intOf(after.result.netToPayUnits))}</p>
                  <p className="text-[11px] font-medium text-ink-500">soit {fmt(intOf(after.result.netToPayUnits) - intOf(before.result.netToPayUnits))} FCFA / mois</p>
                </div>
                <div className="rounded-2xl border border-line bg-surface2 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Coût employeur annuel (×12)</p>
                  <p className="mono mt-1 text-2xl font-semibold text-ink">{fmt(intOf(after.result.employerCostUnits) * 12)}</p>
                  <p className="text-[11px] font-medium text-ink-500">Δ {fmt((intOf(after.result.employerCostUnits) - intOf(before.result.employerCostUnits)) * 12)} / an</p>
                </div>
              </div>
            </Card>
          )}

          {/* ---- CONFORMITÉ ---- */}
          {section === 'compliance' && (
            <Card>
              <CardHeader title="ComplianceGuard" subtitle="La conformité comme bouclier actif — l'avancement est bloqué si une règle est enfreinte"
                action={<StatusPill tone={blocking ? 'danger' : checks.some((c) => c.status === 'warn') ? 'warn' : 'ok'}>{blocking ? 'Bloquant' : checks.some((c) => c.status === 'warn') ? 'Avertissements' : 'Conforme'}</StatusPill>} />
              <div className="space-y-2">
                {checks.map((c) => (
                  <div key={c.label} className={cn('flex items-start gap-3 rounded-xl border p-3',
                    c.status === 'block' ? 'border-danger/30 bg-danger/[0.06]' : c.status === 'warn' ? 'border-warn/30 bg-warn/[0.06]' : 'border-ok/25 bg-ok/[0.05]')}>
                    {c.status === 'block' ? <ShieldAlert size={18} className="mt-0.5 shrink-0 text-danger" /> : c.status === 'warn' ? <ShieldAlert size={18} className="mt-0.5 shrink-0 text-warn" /> : <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ok" />}
                    <div className="min-w-0">
                      <p className={cn('text-sm font-bold', c.status === 'block' ? 'text-danger' : c.status === 'warn' ? 'text-warn' : 'text-ok')}>{c.label}</p>
                      <p className="text-[12px] font-medium text-ink-700">{c.detail}</p>
                      {c.basis && <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">{c.basis}</p>}
                    </div>
                  </div>
                ))}
              </div>
              {blocking && <p className="mt-3 text-[11px] font-semibold text-danger">Un contrôle bloquant doit être résolu avant de soumettre l'avenant à validation.</p>}
            </Card>
          )}

          {/* ---- VALIDATION ---- */}
          {section === 'validation' && (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Étape de validation" subtitle="Workflow de signature contractuelle" action={<StatusPill tone={currentPhase.tone} dot={false}>{currentPhase.label}</StatusPill>} />
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
                    {phase === 'effective' ? 'Avenant en vigueur — nouvelle version contractuelle active.' : `Acteur attendu : ${actorFor(phase)}.`}
                  </p>
                  <Button size="sm" disabled={advanceDisabled} onClick={advance}>
                    {advanceLabel()} <ArrowRight size={14} />
                  </Button>
                </div>
              </Card>
              <Card>
                <CardHeader title="Documents générés" subtitle="Projet d'avenant & pièces" />
                <div className="space-y-1.5">
                  {[`Projet d'avenant ${reference}.pdf`, 'Tableau Avant / Après.pdf', "Tableau d'impact paie.pdf"].map((d) => (
                    <div key={d} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><FileSignature size={14} /></span>
                      <p className="flex-1 truncate text-sm font-semibold text-ink">{d}</p>
                      <StatusPill tone="neutral" dot={false}>généré</StatusPill>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function typeLabels(codes: string[]): string {
  const labels = codes.map((c) => AMENDMENT_TYPES.find((t) => t.code === c)?.label ?? c);
  return labels.length ? labels.join(' + ') : 'Aucun type';
}

function actorFor(phase: string): string {
  switch (phase) {
    case 'compliance_check': return 'RH (résolution conformité)';
    case 'pending_validation': return 'DRH';
    case 'pending_employee_acceptance': return "l'employé (self-service)";
    case 'pending_signature': return 'employeur + employé (ADVIST)';
    case 'signed_pending_effect': return 'système (à la date d\'effet)';
    default: return 'RH';
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-ink-500">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

function DiffRow({ label, before, after, fmt, accent, invert }: { label: string; before: number; after: number; fmt: (n: number) => string; accent?: boolean; invert?: boolean }) {
  const delta = after - before;
  const pct = before > 0 ? Math.round((delta / before) * 1000) / 10 : 0;
  // invert : pour les cotisations, une hausse est "neutre/défavorable" — on garde le code couleur sur le signe.
  const positive = invert ? delta <= 0 : delta >= 0;
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-2 px-4 py-2.5">
      <span className={cn('text-sm', accent ? 'font-bold text-ink' : 'font-semibold text-ink-700')}>{label}</span>
      <span className="mono text-right text-sm font-medium text-ink-500">{fmt(before)}</span>
      <span className={cn('mono text-right text-sm', accent ? 'font-bold text-amber-deep' : 'font-semibold text-ink')}>{fmt(after)}</span>
      <span className={cn('mono text-right text-sm font-semibold', delta === 0 ? 'text-ink-400' : positive ? 'text-ok' : 'text-danger')}>
        {delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${fmt(delta)}${before > 0 ? ` (${delta > 0 ? '+' : ''}${pct}%)` : ''}`}
      </span>
    </div>
  );
}
