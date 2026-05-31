import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Wallet, BarChart3, History, FileText, Layers, HandCoins, Repeat, Users,
  CreditCard, FlaskConical, ShieldCheck, ArrowUpRight, ArrowDownRight, Plus, TrendingUp,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/charts/ProgressBar';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { PayslipModal } from '../../components/payroll/PayslipModal';
import { usePayrollCycle } from '../../store/usePayrollCycle';
import { computeM3Bulletin, m3PayrollInput, mergeModel } from '../../lib/m3/engine';
import { computePayslip, getRegime } from '../../lib/payroll';
import { employeeById, employeeName, matricule, mobileMoney, type EmployeeRecord } from '../../data/mock';
import { currencyOf } from '../../data/countries';
import { Money } from '../../lib/money';
import type { PayrollVariables } from '../../lib/m3/types';
import { cn } from '../../lib/cn';

const fullMonth: PayrollVariables = { joursOuvrables: 22, joursTravailles: 22, applyProrata: true, hs15: 0, hs50: 0, primes: [], retenues: [], ndf: [], avance: 0, notes: '' };
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai'];

const TABS = [
  { key: 'synthese', label: 'Synthèse', icon: Wallet },
  { key: 'fixes', label: 'Éléments fixes', icon: Layers },
  { key: 'variables', label: 'Variables du mois', icon: BarChart3 },
  { key: 'historique', label: 'Historique salarial', icon: History },
  { key: 'bulletins', label: 'Bulletins', icon: FileText },
  { key: 'cumuls', label: 'Cumuls annuels', icon: TrendingUp },
  { key: 'avances', label: 'Avances & prêts', icon: HandCoins },
  { key: 'retenues', label: 'Retenues récurrentes', icon: Repeat },
  { key: 'fiscaux', label: 'Ayants droit fiscaux', icon: Users },
  { key: 'versement', label: 'Versement', icon: CreditCard },
  { key: 'simulations', label: 'Simulations', icon: FlaskConical },
  { key: 'audit', label: 'Audit', icon: ShieldCheck },
] as const;

export function DossierPaiePage() {
  const { employeeId = 'e2' } = useParams();
  const { cycle, variables, models, prevNet } = usePayrollCycle();
  const { toast } = useToast();
  const [tab, setTab] = useState('synthese');
  const [preview, setPreview] = useState<string | null>(null);

  const emp = employeeById(employeeId);
  const cur = emp ? currencyOf(emp.countryCode) : 'XOF';
  const fmt = (n: number) => Money.of(Math.round(n), cur).format();

  const model = emp ? models[emp.id] : undefined;
  // Bulletins calculés intègrent le modèle récurrent du salarié (cohérent avec la Saisie).
  const baseline = useMemo(() => (emp ? computeM3Bulletin(emp, mergeModel(fullMonth, model)) : null), [emp, model]);
  const current = useMemo(() => (emp ? computeM3Bulletin(emp, mergeModel(variables[emp.id] ?? fullMonth, model)) : null), [emp, variables, model]);

  if (!emp || !baseline || !current) {
    return <div className="animate-fade-up space-y-4"><PaieSubNav /><Card><p className="py-10 text-center text-sm font-medium text-ink-400">Collaborateur introuvable.</p></Card></div>;
  }

  const brutTheorique = emp.baseSalary + emp.taxableAllowances + emp.nonTaxableAllowances;
  const seniority = 2026 - new Date(emp.hireDate).getFullYear();
  const computationFull = computePayslip(m3PayrollInput(emp, mergeModel(fullMonth, model)), getRegime(emp.countryCode), employeeName(emp));

  return (
    <div className="animate-fade-up space-y-4">
      {preview && <PayslipModal employee={emp} computation={computationFull} period={preview} onClose={() => setPreview(null)} />}
      <PaieSubNav />

      <Link to="/paie/bulletins" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink"><ArrowLeft size={15} /> Retour</Link>

      {/* Header collaborateur */}
      <Card className="glass-amber">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <Avatar name={employeeName(emp)} size="lg" />
            <div>
              <h1 className="text-xl font-semibold text-ink">{employeeName(emp)} <span className="mono text-[12px] font-medium text-ink-400">{matricule(emp)}</span></h1>
              <p className="text-sm font-medium text-ink-500">{emp.role} · {emp.department}</p>
              <p className="mt-0.5 text-[12px] font-medium text-ink-400">{emp.contractType} depuis {new Date(emp.hireDate).toLocaleDateString('fr-FR')} ({seniority} ans) · {cycle.companyLabel}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <StatusPill tone="ok" dot={false}>Actif</StatusPill>
                <span className="text-[11px] font-medium text-ink-400">Profil Cadre · {cur === 'XAF' ? 'CEMAC' : 'UEMOA'} {emp.countryCode}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Net mois précédent</p>
            <p className="mono text-lg font-bold text-amber-deep">{fmt(prevNet[emp.id] ?? baseline.netAPayer)} FCFA</p>
            <Link to={`/collaborateurs/${emp.id}`}><Button variant="ghost" size="sm" className="mt-1"><ArrowUpRight size={13} /> Dossier M1</Button></Link>
          </div>
        </div>
      </Card>

      {/* Onglets */}
      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5 no-scrollbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition-colors',
                tab === t.key ? 'bg-amber/12 text-amber-deep ring-1 ring-amber/30' : 'text-ink-500 hover:bg-ink/[0.04] hover:text-ink')}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </nav>

      {/* SYNTHÈSE */}
      {tab === 'synthese' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Rémunération de base" action={<Wallet size={16} className="text-ink-400" />} />
            <div className="space-y-1.5">
              <KV label="Salaire de base" value={fmt(emp.baseSalary)} />
              <KV label="Primes & indemnités imposables" value={fmt(emp.taxableAllowances)} />
              <KV label="Indemnités non imposables" value={fmt(emp.nonTaxableAllowances)} />
              <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-sm font-bold text-ink"><span>Brut mensuel théorique</span><span className="mono text-amber-deep">{fmt(brutTheorique)}</span></div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Statistiques" action={<BarChart3 size={16} className="text-ink-400" />} />
            <div className="space-y-1.5">
              <KV label="Ancienneté" value={`${seniority} ans`} />
              <KV label="Parts fiscales" value={String(emp.fiscalParts)} />
              <KV label="Net (mois plein)" value={`${fmt(baseline.netAPayer)} FCFA`} />
              <KV label="Coût employeur (mois plein)" value={`${fmt(baseline.coutEmployeur)} FCFA`} />
              <KV label="Cumul brut 2026 (proj.)" value={`${fmt(baseline.brutTotal * 5)} FCFA`} />
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Versement" action={<CreditCard size={16} className="text-ink-400" />} />
            <p className="text-sm font-semibold text-ink">{emp.countryCode === 'SN' || emp.countryCode === 'CI' ? 'Mobile Money' : 'Virement'} · {mobileMoney(emp)}</p>
            <p className="mt-1 text-[11px] font-medium text-warn">⚠ Données sensibles — modifications soumises à workflow renforcé (ré-auth + double notification).</p>
          </Card>
        </div>
      )}

      {/* ÉLÉMENTS FIXES */}
      {tab === 'fixes' && (
        <div className="space-y-4">
          <Card inset={false}>
            <div className="flex items-center justify-between p-5 pb-2"><CardHeader title="Gains récurrents" className="mb-0" /><Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Élément fixe', description: 'Soumis au workflow 4-eyes + signature DRH si sensible.' })}><Plus size={14} /> Ajouter</Button></div>
            <div className="divide-y divide-line">
              <FixedRow code="R001" label="Salaire de base" amount={fmt(emp.baseSalary)} since="à l'embauche" />
              {emp.taxableAllowances > 0 && <FixedRow code="R0xx" label="Primes & indemnités imposables" amount={fmt(emp.taxableAllowances)} since="—" />}
              {emp.nonTaxableAllowances > 0 && <FixedRow code="R051" label="Indemnité de transport (non imposable)" amount={fmt(emp.nonTaxableAllowances)} since="—" />}
              <FixedRow code="R010" label="Prime d'ancienneté" amount="⚡ Calculée" since="—" muted />
            </div>
          </Card>
          {(emp.otherDeductions ?? []).length > 0 && (
            <Card inset={false}>
              <div className="p-5 pb-2"><CardHeader title="Retenues récurrentes" className="mb-0" /></div>
              <div className="divide-y divide-line">
                {(emp.otherDeductions ?? []).map((d) => <FixedRow key={d.code} code={d.code} label={d.label} amount={`-${fmt(d.amount)}`} since="—" />)}
              </div>
            </Card>
          )}
          <Card>
            <CardHeader title="Paramètres généraux" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <KV label="Société paie" value={cycle.companyLabel} />
              <KV label="Pays / régime" value={`${emp.countryCode} (${cur})`} />
              <KV label="Parts fiscales" value={String(emp.fiscalParts)} />
              <KV label="Convention" value="CCN Commerce CI" />
            </div>
          </Card>
        </div>
      )}

      {/* VARIABLES DU MOIS */}
      {tab === 'variables' && (
        <Card>
          <CardHeader title={`Variables — Cycle ${cycle.label}`} subtitle="Vue lecture (saisie dans l'écran dédié)" action={<Link to="/paie/saisie"><Button variant="outline" size="sm"><ArrowUpRight size={13} /> Saisie</Button></Link>} />
          {(() => {
            const v = variables[emp.id] ?? fullMonth;
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
                  <KV label="Jours ouvrables" value={String(v.joursOuvrables)} />
                  <KV label="Jours travaillés" value={String(v.joursTravailles)} />
                  <KV label="HS 15 % / 50 %" value={`${v.hs15} h / ${v.hs50} h`} />
                </div>
                {model && (model.primes.length > 0 || model.retenues.length > 0) && (
                  <div className="rounded-xl border border-amber/25 bg-amber/[0.05] px-3 py-2 text-[12px] font-medium text-ink-700">
                    <b>Modèle récurrent (chaque mois) :</b> {[...model.primes, ...model.retenues].map((r) => `${r.label} ${fmt(r.amount)}`).join(' · ')}
                  </div>
                )}
                {v.primes.length > 0 && <div className="rounded-xl bg-surface2 px-3 py-2 text-[12px] font-medium text-ink-700"><b>Primes (ce mois) :</b> {v.primes.map((p) => `${p.label} ${fmt(p.amount)}`).join(' · ')}</div>}
                {v.ndf.length > 0 && <div className="rounded-xl bg-surface2 px-3 py-2 text-[12px] font-medium text-ink-700"><b>NDF :</b> {v.ndf.map((n) => `${n.ref} ${fmt(n.amount)}`).join(' · ')}</div>}
                {v.avance > 0 && <div className="rounded-xl bg-surface2 px-3 py-2 text-[12px] font-medium text-ink-700"><b>Avance :</b> -{fmt(v.avance)}</div>}
                <div className="rounded-xl border border-amber/30 bg-amber/[0.06] px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Aperçu bulletin estimé</p>
                  <div className="mt-1 grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-[10px] font-semibold uppercase text-ink-400">Brut</p><p className="mono text-sm font-bold text-ink">{fmt(current.brutTotal)}</p></div>
                    <div><p className="text-[10px] font-semibold uppercase text-ink-400">Net</p><p className="mono text-sm font-bold text-amber-deep">{fmt(current.netAPayer)}</p></div>
                    <div><p className="text-[10px] font-semibold uppercase text-ink-400">Coût empl.</p><p className="mono text-sm font-bold text-ink">{fmt(current.coutEmployeur)}</p></div>
                  </div>
                  <p className="mt-1.5 text-[10px] font-medium text-ink-400">⚠ Estimation — recalculée à la validation du cycle.</p>
                </div>
              </div>
            );
          })()}
        </Card>
      )}

      {/* HISTORIQUE SALARIAL */}
      {tab === 'historique' && (
        <Card>
          <CardHeader title="Historique salarial" subtitle="Évolutions depuis l'embauche" action={<History size={16} className="text-ink-400" />} />
          <ol className="relative space-y-4 border-l border-line pl-5">
            {salaryHistory(emp).map((s, i) => (
              <li key={i} className="relative">
                <span className={cn('absolute -left-[1.45rem] top-1 h-2.5 w-2.5 rounded-full ring-4', i === 0 ? 'bg-amber ring-amber/15' : 'bg-info ring-info/15')} />
                <p className="text-sm font-semibold text-ink">{s.label}</p>
                <p className="text-[12px] font-medium text-ink-500">{s.date} · salaire {fmt(s.salary)}{s.delta ? ` (${s.delta})` : ''}{s.avenant ? ` · ${s.avenant}` : ''}</p>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* BULLETINS */}
      {tab === 'bulletins' && (
        <Card inset={false}>
          <div className="p-5 pb-2"><CardHeader title="Bulletins 2026" className="mb-0" /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400"><th className="px-4 py-2.5 text-left">Période</th><th className="px-3 py-2.5 text-right">Brut</th><th className="px-3 py-2.5 text-right">Net à payer</th><th className="px-3 py-2.5 text-center">Statut</th><th className="px-3 py-2.5" /></tr></thead>
              <tbody className="divide-y divide-line">
                {MONTHS.slice().reverse().map((m, i) => {
                  const isCurrent = i === 0;
                  const net = isCurrent ? current.netAPayer : baseline.netAPayer - i * 4000;
                  const brut = isCurrent ? current.brutTotal : baseline.brutTotal;
                  return (
                    <tr key={m}>
                      <td className="px-4 py-2 text-[13px] font-semibold text-ink">{m} 2026</td>
                      <td className="mono px-3 py-2 text-right text-ink-700">{fmt(brut)}</td>
                      <td className="mono px-3 py-2 text-right font-bold text-ink">{fmt(net)}</td>
                      <td className="px-3 py-2 text-center">{isCurrent ? <StatusPill tone="warn" dot={false}>En cours</StatusPill> : <StatusPill tone="ok" dot={false}>Versé</StatusPill>}</td>
                      <td className="px-3 py-2 text-right"><Button variant="ghost" size="sm" onClick={() => setPreview(`${m} 2026`)}><FileText size={13} /> Voir</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CUMULS ANNUELS */}
      {tab === 'cumuls' && (
        <Card>
          <CardHeader title="Cumuls annuels 2026" subtitle={`Janvier → Mai (${MONTHS.length} mois)`} action={<TrendingUp size={16} className="text-ink-400" />} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Brut cumulé" value={fmt(baseline.brutTotal * MONTHS.length)} />
            <Stat label="Cotisations cumul" value={`-${fmt(baseline.totalCotisationsEmp * MONTHS.length)}`} />
            <Stat label="Net cumulé" value={fmt(baseline.netAPayer * MONTHS.length)} accent />
            <Stat label="Charges patron." value={fmt(baseline.totalPatronal * MONTHS.length)} />
          </div>
          <p className="mt-3 text-[12px] font-medium text-ink-500">Projection brut annuel : <span className="mono font-bold text-ink">{fmt(baseline.brutTotal * 12)} FCFA</span> · coût employeur annuel : <span className="mono font-bold text-ink">{fmt(baseline.coutEmployeur * 12)} FCFA</span>.</p>
        </Card>
      )}

      {/* AVANCES & PRÊTS */}
      {tab === 'avances' && (() => {
        const v = variables[emp.id] ?? fullMonth;
        const loan = (emp.otherDeductions ?? []).find((d) => /pr[êe]t|avance/i.test(d.label));
        const tiers = Math.round(baseline.netAPayer * 0.33);
        const engaged = (emp.otherDeductions ?? []).reduce((s, d) => s + d.amount, 0);
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Avances ponctuelles" action={<Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Avance' })}><Plus size={14} /> Avance</Button>} />
              {v.avance > 0 ? <div className="rounded-xl bg-surface2 px-3 py-2.5 text-sm"><b>{fmt(v.avance)} FCFA</b> — à déduire {cycle.label} · <StatusPill tone="ok" dot={false}>Approuvée DRH</StatusPill></div> : <p className="text-sm font-medium text-ink-400">Aucune avance en cours.</p>}
            </Card>
            <Card>
              <CardHeader title="Prêts échelonnés" action={<Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Prêt' })}><Plus size={14} /> Prêt</Button>} />
              {loan ? <div className="rounded-xl bg-surface2 px-3 py-2.5 text-sm"><b>{loan.label}</b> · mensualité {fmt(loan.amount)} · <StatusPill tone="amber" dot={false}>En cours</StatusPill></div> : <p className="text-sm font-medium text-ink-400">Aucun prêt en cours.</p>}
            </Card>
            <Card className="glass-amber">
              <CardHeader title="Capacité d'engagement" subtitle="Quotité saisissable 33 %" />
              <div className="space-y-2">
                <KV label="Net mensuel moyen" value={fmt(baseline.netAPayer)} />
                <KV label="Tiers saisissable (33 %)" value={fmt(tiers)} />
                <KV label="Engagements actuels" value={fmt(engaged)} />
                <div className="mt-1 flex items-center justify-between border-t border-line pt-2 text-sm font-bold text-ink"><span>Capacité disponible</span><span className="mono text-ok">{fmt(Math.max(0, tiers - engaged))}</span></div>
                <ProgressBar value={tiers ? Math.min(100, (engaged / tiers) * 100) : 0} tone={engaged > tiers ? 'danger' : 'ok'} />
              </div>
            </Card>
          </div>
        );
      })()}

      {/* RETENUES RÉCURRENTES */}
      {tab === 'retenues' && (
        <Card inset={false}>
          <div className="p-5 pb-2"><CardHeader title="Retenues récurrentes" className="mb-0" action={<Repeat size={16} className="text-ink-400" />} /></div>
          {(emp.otherDeductions ?? []).length > 0 ? (
            <div className="divide-y divide-line">{(emp.otherDeductions ?? []).map((d) => <FixedRow key={d.code} code={d.code} label={d.label} amount={`-${fmt(d.amount)}`} since="récurrent" />)}</div>
          ) : <p className="px-5 pb-4 text-sm font-medium text-ink-400">Aucune retenue récurrente (mutuelle, saisie-arrêt, pension).</p>}
        </Card>
      )}

      {/* AYANTS DROIT FISCAUX */}
      {tab === 'fiscaux' && (
        <Card>
          <CardHeader title="Ayants droit fiscaux" subtitle="Quotient familial (synchronisé depuis M1)" action={<Users size={16} className="text-ink-400" />} />
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            <KV label="Parts fiscales" value={String(emp.fiscalParts)} />
            <KV label="Régime IRPP" value="Standard" />
            <KV label="Pays" value={emp.countryCode} />
            <KV label="Personnes à charge" value={String(Math.max(0, Math.round((emp.fiscalParts - 1) * 2)))} />
          </div>
          <p className="mt-3 text-[12px] font-medium text-ink-400">Le calcul des parts suit la règle pays (quotient familial). Modifications via le portail employé (événement familial).</p>
        </Card>
      )}

      {/* VERSEMENT */}
      {tab === 'versement' && (
        <Card>
          <CardHeader title="Versement" subtitle="Données sensibles — affichage masqué partiel" action={<CreditCard size={16} className="text-ink-400" />} />
          <div className="space-y-1.5">
            <KV label="Mode principal" value={emp.countryCode === 'CI' || emp.countryCode === 'SN' ? 'Mobile Money 100 %' : 'Virement bancaire 100 %'} />
            <KV label="Compte" value={mobileMoney(emp)} />
            <KV label="Titulaire" value={employeeName(emp)} />
            <KV label="Fractionnement" value="Aucun" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Demande de modification', description: 'Le collaborateur recevra une demande via le portail (canal privilégié, traçabilité).' })}>Demander une modification (portail)</Button>
          </div>
          <p className="mt-2 text-[11px] font-medium text-warn">⚠ Modification d'urgence par RH : justificatif + validation DRH + double notification + effet paie suivante (jamais rétroactif).</p>
        </Card>
      )}

      {/* SIMULATIONS */}
      {tab === 'simulations' && <SimulationTab emp={emp} baseline={baseline} fmt={fmt} />}

      {/* AUDIT */}
      {tab === 'audit' && (
        <Card inset={false}>
          <div className="p-5 pb-2"><CardHeader title="Audit du dossier paie" subtitle="Chaîne SHA-256" className="mb-0" action={<ShieldCheck size={16} className="text-ink-400" />} /></div>
          <div className="divide-y divide-line">
            {[
              { at: '15/05 14:32', who: 'Marie Samaké', what: 'Création avance 100 000', h: 'a8f3…d92e' },
              { at: '15/05 14:30', who: 'Marie Samaké', what: 'Consultation dossier paie', h: 'b2e1…ff45' },
              { at: '12/05 09:15', who: 'Cheick Diallo', what: 'Validation prime exceptionnelle', h: 'c91a…0e7b' },
              { at: '01/03/2024', who: 'Cheick Diallo', what: 'Modification salaire +18 % · signé DRH', h: 'e74c…2b03' },
            ].map((l) => (
              <div key={l.h} className="flex items-center gap-3 px-5 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 text-ink-400"><ShieldCheck size={14} /></span>
                <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink">{l.what}</p><p className="text-[11px] font-medium text-ink-400">{l.at} · {l.who}</p></div>
                <span className="mono text-[11px] font-semibold text-ink-400">#{l.h}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// --- Simulateur interactif ---
function SimulationTab({ emp, baseline, fmt }: { emp: EmployeeRecord; baseline: ReturnType<typeof computeM3Bulletin>; fmt: (n: number) => string }) {
  const [pct, setPct] = useState(15);
  const [extraPrime, setExtraPrime] = useState(0);
  const simEmp = useMemo(() => ({ ...emp, baseSalary: Math.round(emp.baseSalary * (1 + pct / 100)) }), [emp, pct]);
  const sim = useMemo(() => computeM3Bulletin(simEmp, { ...fullMonth, primes: extraPrime > 0 ? [{ code: 'SIM', label: 'Prime simulée', amount: extraPrime, taxable: true }] : [] }), [simEmp, extraPrime]);

  const Diff = ({ label, a, b }: { label: string; a: number; b: number }) => {
    const d = b - a;
    return (
      <div className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2 text-[13px]">
        <span className="font-medium text-ink-500">{label}</span>
        <span className="flex items-center gap-2">
          <span className="mono text-ink-400">{fmt(a)}</span><span className="text-ink-300">→</span><span className="mono font-bold text-ink">{fmt(b)}</span>
          <span className={cn('mono inline-flex items-center gap-0.5 text-[12px] font-bold', d >= 0 ? 'text-ok' : 'text-danger')}>{d >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{d >= 0 ? '+' : ''}{fmt(d)}</span>
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="self-start">
        <CardHeader title="Nouvelle simulation" subtitle="Sans impact réel (isolée)" action={<FlaskConical size={16} className="text-amber-deep" />} />
        <div className="space-y-3">
          <div>
            <label className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-ink-400"><span>Augmentation salaire</span><span className="mono text-amber-deep">+{pct} %</span></label>
            <input type="range" min={0} max={50} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-full accent-amber" />
            <p className="mono mt-1 text-[12px] text-ink-500">{fmt(emp.baseSalary)} → {fmt(simEmp.baseSalary)}</p>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Prime supplémentaire</label>
            <input type="number" step={10000} value={extraPrime} onChange={(e) => setExtraPrime(Number(e.target.value))} className="mono h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />
          </div>
          <StatusPill tone="amber" dot={false}>Simulation — aucun bulletin officiel</StatusPill>
        </div>
      </Card>

      <Card>
        <CardHeader title="Impact estimé (mois plein)" subtitle="Réel actuel → simulé" />
        <div className="space-y-1.5">
          <Diff label="Salaire de base" a={emp.baseSalary} b={simEmp.baseSalary} />
          <Diff label="Brut total" a={baseline.brutTotal} b={sim.brutTotal} />
          <Diff label="Cotisations & impôts" a={baseline.totalCotisationsEmp} b={sim.totalCotisationsEmp} />
          <Diff label="Net à payer" a={baseline.netAPayer} b={sim.netAPayer} />
          <Diff label="Coût employeur total" a={baseline.coutEmployeur} b={sim.coutEmployeur} />
        </div>
        <p className="mt-3 text-[12px] font-medium text-ink-500">Surcoût employeur mensuel : <span className="mono font-bold text-amber-deep">+{fmt(sim.coutEmployeur - baseline.coutEmployeur)} FCFA</span> · annuel : <span className="mono font-bold text-ink">+{fmt((sim.coutEmployeur - baseline.coutEmployeur) * 12)} FCFA</span>.</p>
      </Card>
    </div>
  );
}

// --- helpers ---
function KV({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between text-[13px]"><span className="font-medium text-ink-500">{label}</span><span className="mono font-semibold text-ink">{value}</span></div>;
}
function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className={cn('rounded-2xl border px-3 py-3 text-center', accent ? 'border-amber/30 bg-amber/[0.06]' : 'border-line bg-surface2')}><p className={cn('mono text-base font-semibold', accent ? 'text-amber-deep' : 'text-ink')}>{value}</p><p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p></div>;
}
function FixedRow({ code, label, amount, since, muted }: { code: string; label: string; amount: string; since: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5">
      <span className="mono text-[11px] font-bold text-ink-400">{code}</span>
      <span className="flex-1 text-[13px] font-semibold text-ink">{label}</span>
      <span className="text-[11px] font-medium text-ink-400">{since}</span>
      <span className={cn('mono text-sm font-bold', muted ? 'text-amber-deep' : 'text-ink')}>{amount}</span>
    </div>
  );
}

/** Historique salarial synthétisé déterministe depuis l'embauche. */
function salaryHistory(emp: EmployeeRecord) {
  const hireYear = new Date(emp.hireDate).getFullYear();
  const cur = emp.baseSalary;
  const steps: { date: string; label: string; salary: number; delta?: string; avenant?: string }[] = [
    { date: new Date(emp.hireDate).toLocaleDateString('fr-FR'), label: 'Embauche', salary: Math.round(cur * 0.55) },
  ];
  if (2026 - hireYear >= 3) steps.push({ date: `15/03/${hireYear + 2}`, label: 'Promotion', salary: Math.round(cur * 0.78), delta: '+42 %', avenant: `AV-${hireYear + 2}-0023` });
  if (2026 - hireYear >= 5) steps.push({ date: '01/03/2024', label: 'Revue salariale annuelle', salary: cur, delta: '+18 %', avenant: 'AV-2024-0156' });
  steps.push({ date: "Aujourd'hui", label: 'Salaire de base actif', salary: cur });
  return steps.reverse();
}
