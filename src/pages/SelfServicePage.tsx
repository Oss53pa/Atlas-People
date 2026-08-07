import { useState } from 'react';
import {
  FileText,
  CalendarPlus,
  Wallet,
  Clock,
  ShieldCheck,
  ChevronRight,
  Download,
  Plane,
  Check,
  Pencil,
  X,
  Landmark,
  Award,
  Stethoscope,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { useRequests } from '../store/useRequests';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { StatusPill } from '../components/ui/StatusPill';
import { RadialGauge } from '../components/charts/RadialGauge';
import { Brand } from '../components/ui/Brand';
import { PayslipModal } from '../components/payroll/PayslipModal';
import { Money } from '../lib/money';
import { computePayslip, getRegime } from '../lib/payroll';
import { countryByCode } from '../data/countries';
import {
  employeeById,
  employeeName,
  mobileMoney,
  employeeLeaveBalance,
  employeeDocuments,
  employeeLoans,
  employeeAdvances,
  employeeMonthlyDebt,
  employeeAuthorizations,
  employeeCertifications,
  employeeMedicalFollowup,
  employeeVaccinations,
  employeeCommunicationPrefs,
  employeeConsents,
  employeeCurrency,
} from '../data/mock';
import { cn } from '../lib/cn';
import { useSessionContext } from '../lib/useSession';

const PERIOD = 'Mai 2026';

export function SelfServicePage() {
  const { data: ctx } = useSessionContext();
  const SELF_ID = ctx?.employeeId ?? 'e2';
  const employee = employeeById(SELF_ID)!;
  const country = countryByCode(employee.countryCode);
  const regime = getRegime(employee.countryCode);
  const computation = computePayslip(
    {
      baseSalary: employee.baseSalary,
      taxableAllowances: employee.taxableAllowances,
      nonTaxableAllowances: employee.nonTaxableAllowances,
      fiscalParts: employee.fiscalParts,
      otherDeductions: employee.otherDeductions,
    },
    regime,
    employeeName(employee),
  );
  const cur = employeeCurrency(employee);
  const net = Money.fromJSON({ units: computation.result.netToPayUnits, currency: cur });
  const netInt = net.toInt();
  const leave = employeeLeaveBalance(employee);
  const docs = employeeDocuments(employee).slice(0, 3);
  const loans = employeeLoans(employee);
  const advances = employeeAdvances(employee);
  const monthlyDebt = employeeMonthlyDebt(employee);
  const debtRatio = netInt > 0 ? Math.round((monthlyDebt / netInt) * 100) : 0;
  const authorizations = employeeAuthorizations(employee);
  const certifications = employeeCertifications(employee);
  const medical = employeeMedicalFollowup(employee);
  const vaccinations = employeeVaccinations(employee);
  const commPrefs = employeeCommunicationPrefs(employee);
  const consents = employeeConsents(employee);
  const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');

  const propose = useRequests((s) => s.propose);
  const [showBulletin, setShowBulletin] = useState(false);
  const [leaveForm, setLeaveForm] = useState(false);
  const [leaveSent, setLeaveSent] = useState(false);
  const [modifOpen, setModifOpen] = useState(false);
  const [modifField, setModifField] = useState('Téléphone principal');
  const [modifVal, setModifVal] = useState('');
  const [modifSent, setModifSent] = useState(false);

  const currentOf = (label: string) =>
    label === 'Email' ? employee.email : label === 'Numéro Mobile Money' ? mobileMoney(employee) : '—';

  const submitModif = () => {
    propose({ employeeId: employee.id, fieldLabel: modifField, currentValue: currentOf(modifField), proposedValue: modifVal });
    setModifSent(true);
    setModifVal('');
  };

  return (
    <div className="animate-fade-up space-y-5 pb-8">
      {showBulletin && (
        <PayslipModal employee={employee} computation={computation} period={PERIOD} onClose={() => setShowBulletin(false)} />
      )}

      {modifOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center" onClick={() => setModifOpen(false)}>
          <div className="w-full max-w-sm rounded-t-3xl bg-surface p-5 shadow-float sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-bold text-ink">Proposer une modification</p>
              <button onClick={() => setModifOpen(false)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink/5"><X size={18} /></button>
            </div>
            {modifSent ? (
              <div className="rounded-2xl border border-ok/25 bg-ok/[0.06] p-4 text-center">
                <Check className="mx-auto mb-1 text-ok" size={22} />
                <p className="text-sm font-bold text-ok">Demande envoyée</p>
                <p className="mt-0.5 text-[11px] font-medium text-ink-500">Votre demande sera examinée par les RH.</p>
                <Button size="sm" className="mt-3" onClick={() => setModifOpen(false)}>Fermer</Button>
              </div>
            ) : (
              <>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Information</label>
                <select value={modifField} onChange={(e) => setModifField(e.target.value)} className="mb-3 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none">
                  {['Téléphone principal', 'Email', 'Adresse', 'Numéro Mobile Money'].map((o) => <option key={o}>{o}</option>)}
                </select>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Valeur actuelle</label>
                <input disabled value={currentOf(modifField)} className="mb-3 h-10 w-full rounded-xl border border-line bg-surface2 px-3 text-sm font-medium text-ink-400" />
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Nouvelle valeur</label>
                <input value={modifVal} onChange={(e) => setModifVal(e.target.value)} className="mb-4 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
                <Button className="w-full" disabled={!modifVal} onClick={submitModif}>Soumettre la demande</Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-deep">Espace employé</p>
          <h1 className="text-2xl font-bold text-ink">Bonjour {employee.firstName}</h1>
          <p className="text-sm font-medium text-ink-500">{employee.role} · {country.flag} {country.name}</p>
        </div>
        <Avatar name={employeeName(employee)} size="lg" />
      </div>

      {/* Cartes — masonry responsive : 1 col (mobile) → 2 (tablette) → 3 (desktop) */}
      <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
      {/* Salaire / Mobile Money */}
      <Card className="surface-night border-0 overflow-hidden" inset={false}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-deep">Net du mois · {PERIOD}</span>
            <Wallet size={18} className="text-amber-deep" />
          </div>
          <p className="mono mt-2 text-3xl font-semibold text-ink">{net.formatWithCurrency()}</p>
          <p className="mt-1 text-[12px] font-medium text-ink-500">
            Versé sur Mobile Money {mobileMoney(employee)}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" className="flex-1" onClick={() => setShowBulletin(true)}>
              <FileText size={14} /> Mon bulletin
            </Button>
            <StatusPill tone="ok" dot={false}>
              <ShieldCheck size={12} /> Vérifié
            </StatusPill>
          </div>
        </div>
      </Card>

      {/* Congés */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-ink">
            <Clock size={16} className="text-ink-400" /> Mes congés
          </div>
          <span className="text-[11px] font-semibold text-ink-400">{leave.acquired} acquis · {leave.taken} pris</span>
        </div>
        <div className="mt-3 flex items-center gap-5">
          <RadialGauge value={leave.remaining} max={leave.acquired} size={104} thickness={10} centerValue={`${leave.remaining}j`} label="restants" tone="ok" />
          <div className="flex-1">
            {!leaveSent ? (
              <>
                <p className="mb-3 text-sm font-medium text-ink-500">
                  Il vous reste <span className="font-bold text-ink">{leave.remaining} jours</span> de congés payés.
                </p>
                {!leaveForm ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setLeaveForm(true)}>
                    <CalendarPlus size={14} /> Demander un congé
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" className="h-9 rounded-lg border border-line bg-surface px-2 text-xs font-medium text-ink focus:border-amber/40 focus:outline-none" />
                      <input type="date" className="h-9 rounded-lg border border-line bg-surface px-2 text-xs font-medium text-ink focus:border-amber/40 focus:outline-none" />
                    </div>
                    <Button size="sm" className="w-full" onClick={() => { setLeaveSent(true); setLeaveForm(false); }}>
                      <Plane size={14} /> Envoyer la demande
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-ok/25 bg-ok/[0.06] p-3">
                <p className="flex items-center gap-1.5 text-sm font-bold text-ok">
                  <Check size={15} /> Demande envoyée
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-ink-500">
                  En attente de validation de votre manager. Vous serez notifié.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-3">
        <QuickAction icon={FileText} label="Mes bulletins" hint="3 disponibles" onClick={() => setShowBulletin(true)} />
        <QuickAction icon={Wallet} label="Ma rémunération" hint="Détail & primes" onClick={() => setShowBulletin(true)} />
      </div>

      {/* Mes informations */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-ink">
            <Pencil size={16} className="text-ink-400" /> Mes informations
          </div>
          <button onClick={() => { setModifOpen(true); setModifSent(false); }} className="text-xs font-bold text-amber-deep hover:underline">
            Proposer une modification
          </button>
        </div>
        <div className="space-y-1.5">
          <InfoLine label="Email" value={employee.email} />
          <InfoLine label="Mobile Money" value={mobileMoney(employee)} />
        </div>
        <p className="mt-2 text-[11px] font-medium text-ink-400">
          Vos modifications sont soumises à validation RH — aucune écriture directe.
        </p>
      </Card>

      {/* Documents */}
      <Card>
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
          <FileText size={16} className="text-ink-400" /> Mes documents
        </div>
        <div className="space-y-1.5">
          {docs.map((d) => (
            <button key={d.name} className="flex w-full items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5 text-left transition-colors hover:bg-amber/[0.05]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep">
                <FileText size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{d.name}</p>
                <p className="text-[11px] font-medium text-ink-400">{d.kind} · {new Date(d.date).toLocaleDateString('fr-FR')}</p>
              </div>
              <Download size={15} className="shrink-0 text-ink-400" />
            </button>
          ))}
        </div>
      </Card>

      {/* Mes engagements financiers (paquet 2 — thème K) */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-ink"><Landmark size={16} className="text-ink-400" /> Mes engagements financiers</div>
          {(loans.length + advances.length) > 0 && <StatusPill tone={debtRatio > 33 ? 'danger' : 'ok'} dot={false}>{debtRatio}% du net</StatusPill>}
        </div>
        {(loans.length + advances.length) > 0 ? (
          <div className="space-y-1.5">
            {loans.map((l) => (
              <div key={l.reference} className="rounded-xl bg-surface2 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{l.purpose}</p>
                  <span className="mono text-sm font-bold text-ink">{Money.of(l.monthlyInstallment, cur).format()}/mois</span>
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-ink-400">Solde {Money.of(l.remainingBalance, cur).format()} FCFA · {l.installmentsRemaining} échéances</p>
              </div>
            ))}
            {advances.map((a) => (
              <div key={a.reference} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2.5">
                <p className="text-sm font-semibold text-ink">{a.motive}</p>
                <span className="mono text-sm font-bold text-danger">−{Money.of(a.monthlyDeduction, cur).format()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-medium text-ink-400">Aucun prêt ni avance en cours.</p>
        )}
        <Button variant="outline" size="sm" className="mt-3 w-full"><Landmark size={14} /> Demander un prêt</Button>
      </Card>

      {/* Mes habilitations & certifications (paquet 3 — thèmes N) */}
      {(authorizations.length + certifications.length) > 0 && (
        <Card>
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink"><Award size={16} className="text-ink-400" /> Mes habilitations & certifications</div>
          <div className="space-y-1.5">
            {authorizations.map((a) => (
              <div key={a.code} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                <span className="mono rounded bg-ink/[0.05] px-1.5 py-0.5 text-[10px] font-bold text-ink-500">{a.code}</span>
                <p className="flex-1 truncate text-sm font-semibold text-ink">{a.label}</p>
                <StatusPill tone={a.status === 'expired' ? 'danger' : 'ok'} dot={false}>{a.status === 'expired' ? 'Expirée' : 'Valide'}</StatusPill>
              </div>
            ))}
            {certifications.map((c) => (
              <div key={c.label} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><Award size={13} /></span>
                <p className="flex-1 truncate text-sm font-semibold text-ink">{c.label}</p>
                <StatusPill tone="ok" dot={false}>Valide</StatusPill>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mon suivi médical professionnel (paquet 4 — thème R) */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-ink"><Stethoscope size={16} className="text-ink-400" /> Mon suivi médical</div>
          <StatusPill tone="neutral" dot={false}>Sans nature</StatusPill>
        </div>
        <div className="space-y-1.5">
          <InfoLine label="Médecin référent" value={medical.doctor} />
          <InfoLine label="Prochaine visite" value={frDate(medical.nextVisit)} />
          <InfoLine label="Aptitude" value={medical.aptitudeLabel} />
        </div>
        <div className="mt-2 space-y-1">
          {vaccinations.map((v) => (
            <div key={v.label} className="flex items-center justify-between text-[12px]">
              <span className="font-medium text-ink-700">{v.label}</span>
              <span className={cn('font-semibold', v.status === 'expired' ? 'text-danger' : v.status === 'recall_due_soon' ? 'text-warn' : 'text-ok')}>
                {v.status === 'expired' ? 'Périmé' : v.status === 'recall_due_soon' ? 'À renouveler' : 'À jour'}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-ink-400"><Lock size={11} /> Votre dossier médical détaillé est confidentiel (médecin du travail).</p>
      </Card>

      {/* Mes préférences & consentements (paquet 4 — thème S) */}
      <Card>
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink"><MessageSquare size={16} className="text-ink-400" /> Mes préférences</div>
        <div className="space-y-1.5">
          <InfoLine label="Langue" value={commPrefs.language} />
          <InfoLine label="Droit à la déconnexion" value={commPrefs.disconnectionLabel} />
        </div>
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Mes consentements (RGPD/CDP)</p>
          <div className="space-y-1.5">
            {consents.map((c) => (
              <div key={c.code} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2">
                <span className="text-sm font-semibold text-ink">{c.label}</span>
                <StatusPill tone={c.granted ? 'ok' : 'neutral'} dot={false}>{c.granted ? 'Accordé' : 'Refusé'}</StatusPill>
              </div>
            ))}
          </div>
        </div>
      </Card>
      </div>

      <p className="px-2 text-center text-[11px] font-medium text-ink-400">
        Vos données restent sur l'infrastructure de confiance Atlas · <Brand name="Proph3t" /> souverain.
      </p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  hint: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-all card-hover',
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/12 text-amber-deep">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{label}</p>
        <p className="truncate text-[11px] font-medium text-ink-400">{hint}</p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-ink-400" />
    </button>
  );
}
