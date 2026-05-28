import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Trash2, Sparkles, Lock, FileDown, Printer, CheckCircle2, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Zap, Circle, ShieldCheck, PencilLine,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { PaieSubNav } from '../../components/paie/PaieSubNav';
import { PayslipModal } from '../../components/payroll/PayslipModal';
import { usePayrollCycle } from '../../store/usePayrollCycle';
import { computeM3Bulletin, m3PayrollInput } from '../../lib/m3/engine';
import { computePayslip, getRegime } from '../../lib/payroll';
import { EMPLOYEES, employeeById, employeeName, matricule } from '../../data/mock';
import { currencyOf } from '../../data/countries';
import { Money } from '../../lib/money';
import type { SaisieStatus, PayrollVariables, BulletinRow } from '../../lib/m3/types';
import { cn } from '../../lib/cn';

const STATUS_META: Record<SaisieStatus, { label: string; tone: 'ok' | 'amber' | 'neutral' | 'warn' | 'danger'; icon: typeof Circle }> = {
  to_seize: { label: 'À saisir', tone: 'neutral', icon: Circle },
  prefilled: { label: 'Pré-rempli', tone: 'amber', icon: Zap },
  seized: { label: 'Saisi', tone: 'ok', icon: CheckCircle2 },
  anomaly: { label: 'Anomalie', tone: 'warn', icon: AlertTriangle },
  locked: { label: 'Verrouillé', tone: 'ok', icon: Lock },
};

const TABS = ['Temps', 'Heures sup.', 'Primes', 'Retenues', 'NDF', 'Avances', 'Notes'] as const;
type Tab = typeof TABS[number];

export function SaisieVariablesPage() {
  const { cycle, variables, statuses, prevNet, setVariables, markReady, lock } = usePayrollCycle();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState('e2');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SaisieStatus>('all');
  const [tab, setTab] = useState<Tab>('Temps');
  const [preview, setPreview] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EMPLOYEES.filter((e) => {
      if (statusFilter !== 'all' && statuses[e.id] !== statusFilter) return false;
      if (!q) return true;
      return `${employeeName(e)} ${e.role}`.toLowerCase().includes(q);
    });
  }, [query, statusFilter, statuses]);

  const seizedCount = EMPLOYEES.filter((e) => statuses[e.id] === 'seized' || statuses[e.id] === 'locked').length;
  const pct = Math.round((seizedCount / EMPLOYEES.length) * 100);

  const emp = employeeById(selectedId)!;
  const v = variables[selectedId];
  const bulletin = useMemo(() => computeM3Bulletin(emp, v), [emp, v]);
  const cur = currencyOf(emp.countryCode);
  const fmt = (n: number) => Money.of(Math.round(n), cur).format();
  const netDelta = bulletin.netAPayer - (prevNet[selectedId] ?? bulletin.netAPayer);
  const netDeltaPct = prevNet[selectedId] ? (netDelta / prevNet[selectedId]) * 100 : 0;

  // Calcul officiel (même entrée déterministe) pour l'aperçu avant impression.
  const computation = useMemo(() => computePayslip(m3PayrollInput(emp, v), getRegime(emp.countryCode), employeeName(emp)), [emp, v]);

  const patch = (p: Partial<PayrollVariables>) => setVariables(selectedId, p);

  return (
    <div className="animate-fade-up space-y-4">
      {preview && <PayslipModal employee={emp} computation={computation} period={cycle.label} onClose={() => setPreview(false)} />}
      <PaieSubNav />

      {/* Bandeau cycle */}
      <Card className="glass-amber flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-semibold text-ink-700">
          <span className="text-base font-bold text-ink">Cycle {cycle.label}</span>
          <span className="text-ink-400">·</span><span>{cycle.companyLabel}</span>
          <span className="text-ink-400">·</span><StatusPill tone="amber" dot={false}>Étape Saisie</StatusPill>
          <span className="text-ink-400">·</span><span>clôture saisie {new Date(`${cycle.deadlineSaisie}T00:00:00`).toLocaleDateString('fr-FR')}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="mono text-sm font-bold text-amber-deep">{seizedCount}/{EMPLOYEES.length} saisis ({pct}%)</p>
            <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-ink/[0.08]"><div className="h-full rounded-full bg-amber" style={{ width: `${pct}%` }} /></div>
          </div>
          <Link to="/paie/calcul"><Button size="sm"><ArrowUpRight size={14} /> Calcul</Button></Link>
        </div>
      </Card>

      {/* Gauche : liste · Centre : BULLETIN (visualiseur) · Droite : PRÉPARATION (saisie) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[240px_1fr_420px]">
        {/* COLONNE GAUCHE — liste collaborateurs */}
        <Card className="!p-3 self-start">
          <div className="relative mb-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…"
              className="h-9 w-full rounded-lg border border-line bg-surface2 pl-8 pr-2 text-[13px] font-medium text-ink focus:border-amber/40 focus:outline-none" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="mb-2 h-9 w-full rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700 focus:border-amber/40 focus:outline-none">
            <option value="all">Tous statuts ({EMPLOYEES.length})</option>
            <option value="to_seize">À saisir</option>
            <option value="prefilled">Pré-rempli</option>
            <option value="seized">Saisi</option>
            <option value="anomaly">Anomalie</option>
            <option value="locked">Verrouillé</option>
          </select>
          <div className="max-h-[64vh] space-y-1 overflow-y-auto no-scrollbar">
            {list.map((e) => {
              const sm = STATUS_META[statuses[e.id]];
              const SIcon = sm.icon;
              const active = e.id === selectedId;
              return (
                <button key={e.id} onClick={() => setSelectedId(e.id)}
                  className={cn('flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors',
                    active ? 'bg-amber/12 ring-1 ring-inset ring-amber/30' : 'hover:bg-ink/[0.04]')}>
                  <Avatar name={employeeName(e)} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{e.lastName} {e.firstName}</p>
                    <p className="truncate text-[10px] font-medium text-ink-400">{e.role}</p>
                  </div>
                  <SIcon size={14} className={cn(
                    sm.tone === 'ok' ? 'text-ok' : sm.tone === 'amber' ? 'text-amber-deep' : sm.tone === 'warn' ? 'text-warn' : sm.tone === 'danger' ? 'text-danger' : 'text-ink-300')} />
                </button>
              );
            })}
          </div>
        </Card>

        {/* COLONNE CENTRE — VISUALISEUR BULLETIN TEMPS RÉEL */}
        <Card className="!p-0 self-start overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-surface2/60 px-5 py-3">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-amber-deep" />
              <p className="text-sm font-bold text-ink">Bulletin de paie — visualiseur temps réel</p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ok"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> recalcul live</span>
          </div>

          <div className="px-6 py-5">
            {/* En-tête employeur / salarié */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-deep">{cycle.companyLabel}</p>
                <p className="text-[11px] font-medium text-ink-400">Bulletin de paie · {cycle.label} · {cycle.countryCode}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-ink">{employeeName(emp)}</p>
                <p className="mono text-[11px] font-medium text-ink-400">{matricule(emp)} · {emp.role}</p>
              </div>
            </div>

            {/* GAINS */}
            <BlletSection title="Gains" rows={bulletin.gains} fmt={fmt} />
            <TotalRow label="BRUT TOTAL" value={fmt(bulletin.brutTotal)} cur={cur} strong />

            {/* BASES */}
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 rounded-xl bg-surface2 px-4 py-2.5 text-[11px] font-medium text-ink-500">
              <Recap label="Base CNPS" value={fmt(bulletin.baseCnps)} />
              <Recap label="Base imposable" value={fmt(bulletin.baseIrpp)} />
            </div>

            {/* COTISATIONS */}
            <BlletSection title="Cotisations & impôts (part salariale)" rows={bulletin.cotisationsEmp} fmt={fmt} />
            {bulletin.retenues.length > 0 && <BlletSection title="Retenues" rows={bulletin.retenues} fmt={fmt} />}

            {/* NET */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-amber/[0.10] px-4 py-3 text-lg font-bold text-amber-deep">
              <span>NET À PAYER</span><span className="mono">{fmt(bulletin.netAPayer)} FCFA</span>
            </div>

            {/* Patronal + coût employeur */}
            <BlletSection title="Charges patronales (information)" rows={bulletin.patronal} fmt={fmt} muted />
            <div className="mt-1 flex items-center justify-between border-t border-line pt-2 text-[13px] font-bold text-ink">
              <span>Coût employeur total</span><span className="mono">{fmt(bulletin.coutEmployeur)}</span>
            </div>

            {/* Comparaison M-1 */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface2 px-4 py-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">vs mois précédent</span>
              <span className={cn('mono flex items-center gap-1 text-[13px] font-bold', netDelta >= 0 ? 'text-ok' : 'text-danger')}>
                {netDelta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                Net {netDelta >= 0 ? '+' : ''}{fmt(netDelta)} ({netDeltaPct >= 0 ? '+' : ''}{netDeltaPct.toFixed(1)} %)
              </span>
            </div>
            {Math.abs(netDeltaPct) > 15 && <p className="mt-1.5 text-[11px] font-semibold text-warn">⚠ Variation &gt; 15 % — à justifier en validation.</p>}

            {/* Anomalies / indicateurs */}
            <div className="mt-3 space-y-1.5 border-t border-line pt-3">
              {bulletin.anomalies.length === 0 ? (
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ok"><ShieldCheck size={13} /> Cohérence OK · plafonds respectés · validation 4-eyes prête</p>
              ) : bulletin.anomalies.map((a) => (
                <p key={a.code} className={cn('flex items-start gap-1.5 text-[11px] font-semibold', a.severity === 'danger' ? 'text-danger' : a.severity === 'warn' ? 'text-warn' : 'text-info')}>
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {a.message}{a.blocking ? ' (bloquant)' : ''}
                </p>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              <Button size="sm" onClick={() => setPreview(true)}><Printer size={14} /> Aperçu avant impression</Button>
              <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Aperçu PDF', description: `Bulletin BROUILLON ${employeeName(emp)}.pdf` })}><FileDown size={14} /> Aperçu PDF</Button>
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-[10px] font-medium text-ink-400"><Sparkles size={11} className="mt-0.5 shrink-0 text-amber-deep" /> Calcul 100 % déterministe (Money entier) · Proph3t explique, ne calcule jamais.</p>
          </div>
        </Card>

        {/* COLONNE DROITE — PRÉPARATION DE LA PAIE (saisie variables) */}
        <div className="space-y-3 self-start">
          <Card className="!p-4">
            <div className="mb-2 flex items-center gap-1.5"><PencilLine size={14} className="text-amber-deep" /><p className="text-sm font-bold text-ink">Préparation de la paie</p></div>
            <div className="flex items-start gap-3 border-t border-line pt-3">
              <Avatar name={employeeName(emp)} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-ink">{employeeName(emp)}</p>
                <p className="truncate text-[11px] font-medium text-ink-500">{emp.department} · {cur === 'XAF' ? 'CEMAC' : 'UEMOA'}</p>
                <div className="mt-1"><StatusPill tone={STATUS_META[statuses[selectedId]].tone} dot={false}>{STATUS_META[statuses[selectedId]].label}</StatusPill></div>
              </div>
              <Link to={`/collaborateurs/${emp.id}`}><Button variant="ghost" size="sm"><ArrowUpRight size={13} /></Button></Link>
            </div>
            {(v.primes.length > 0 || v.ndf.length > 0 || v.avance > 0) && (
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                {v.ndf.map((n) => <span key={n.ref} className="rounded-md bg-info/10 px-2 py-1 text-info">NDF {fmt(n.amount)}</span>)}
                {v.primes.map((p) => <span key={p.code} className="rounded-md bg-amber/12 px-2 py-1 text-amber-deep">Prime {fmt(p.amount)}</span>)}
                {v.avance > 0 && <span className="rounded-md bg-danger/10 px-2 py-1 text-danger">Avance {fmt(v.avance)}</span>}
              </div>
            )}
          </Card>

          <nav className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1 no-scrollbar">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={cn('shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors',
                  tab === t ? 'bg-amber/12 text-amber-deep' : 'text-ink-500 hover:text-ink')}>{t}</button>
            ))}
          </nav>

          <Card className="!p-4">
            {tab === 'Temps' && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-ink">Temps & présence</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Jours ouvrables"><NumInput value={v.joursOuvrables} onChange={(n) => patch({ joursOuvrables: n })} /></Field>
                  <Field label="Jours travaillés"><NumInput value={v.joursTravailles} onChange={(n) => patch({ joursTravailles: n })} /></Field>
                </div>
                <label className="flex items-center gap-2 text-[13px] font-medium text-ink-700">
                  <input type="checkbox" checked={v.applyProrata} onChange={(e) => patch({ applyProrata: e.target.checked })} className="h-4 w-4 accent-amber" />
                  Appliquer le prorata
                </label>
                <div className="rounded-xl bg-surface2 px-3 py-2.5 text-[12px] font-medium text-ink-700">
                  Prorata : <span className="mono font-bold text-amber-deep">{Math.round(bulletin.proRataPct * 100)} %</span> ({v.joursTravailles}/{v.joursOuvrables} j)
                </div>
              </div>
            )}
            {tab === 'Heures sup.' && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-ink">Heures supplémentaires</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="HS 15 % (h)"><NumInput value={v.hs15} onChange={(n) => patch({ hs15: n })} /></Field>
                  <Field label="HS 50 % (h)"><NumInput value={v.hs50} onChange={(n) => patch({ hs50: n })} /></Field>
                </div>
                <p className="rounded-xl bg-surface2 px-3 py-2.5 text-[12px] font-medium text-ink-700">Taux horaire : <span className="mono font-bold text-ink">{fmt(emp.baseSalary / (v.joursOuvrables * 8))}</span>/h</p>
              </div>
            )}
            {tab === 'Primes' && (
              <ListEditor title="Primes & gains ponctuels" items={v.primes.map((p) => ({ id: p.code, label: p.label, amount: p.amount, sub: p.taxable ? 'imposable' : 'non imposable', tag: p.source }))}
                onAdd={() => patch({ primes: [...v.primes, { code: `R0_${Date.now()}`, label: 'Nouvelle prime', amount: 50_000, taxable: true, source: 'manual' }] })}
                onRemove={(id) => patch({ primes: v.primes.filter((p) => p.code !== id) })} fmt={fmt} addLabel="+ Prime" />
            )}
            {tab === 'Retenues' && (
              <ListEditor title="Retenues exceptionnelles" items={v.retenues.map((r) => ({ id: r.code, label: r.label, amount: r.amount, sub: 'retenue', tag: undefined }))}
                onAdd={() => patch({ retenues: [...v.retenues, { code: `X0_${Date.now()}`, label: 'Retenue exceptionnelle', amount: 20_000 }] })}
                onRemove={(id) => patch({ retenues: v.retenues.filter((r) => r.code !== id) })} fmt={fmt} addLabel="+ Retenue" warn="Justification + 4-eyes + notification employé requises." />
            )}
            {tab === 'NDF' && (
              <ListEditor title="NDF à intégrer en paie" items={v.ndf.map((n) => ({ id: n.ref, label: `${n.ref} · ${n.label}`, amount: n.amount, sub: n.taxable ? 'réintégré imposable' : 'remboursement non imposable', tag: undefined }))}
                onAdd={() => patch({ ndf: [...v.ndf, { ref: `NDF-${Date.now()}`, label: 'Mission', amount: 50_000, taxable: false }] })}
                onRemove={(id) => patch({ ndf: v.ndf.filter((n) => n.ref !== id) })} fmt={fmt} addLabel="+ NDF" />
            )}
            {tab === 'Avances' && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-ink">Avances & prêts</p>
                <Field label="Avance à déduire ce mois"><NumInput value={v.avance} onChange={(n) => patch({ avance: n })} step={5000} /></Field>
                {(emp.otherDeductions ?? []).length > 0 && (
                  <div className="rounded-xl bg-surface2 px-3 py-2.5 text-[12px] font-medium text-ink-700">
                    Récurrent : {(emp.otherDeductions ?? []).map((d) => `${d.label} ${fmt(d.amount)}`).join(' · ')}
                  </div>
                )}
              </div>
            )}
            {tab === 'Notes' && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-ink">Notes internes</p>
                <textarea value={v.notes} onChange={(e) => patch({ notes: e.target.value })} rows={5}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink focus:border-amber/40 focus:outline-none"
                  placeholder="Précisions, contexte, alerte validation…" />
              </div>
            )}
          </Card>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1" disabled={bulletin.emissionBlocked} onClick={() => { markReady(selectedId); toast({ variant: 'success', title: 'Marqué saisi', description: employeeName(emp) }); }}>
              <CheckCircle2 size={14} /> Marquer saisi
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { lock(selectedId); toast({ variant: 'success', title: 'Verrouillé', description: employeeName(emp) }); }}>
              <Lock size={14} /> Verrouiller
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</label>{children}</div>;
}
function NumInput({ value, onChange, step = 1 }: { value: number; onChange: (n: number) => void; step?: number }) {
  return <input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
    className="mono h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-ink focus:border-amber/40 focus:outline-none" />;
}
function Recap({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span>{label}</span><span className="mono">{value}</span></div>;
}
function TotalRow({ label, value, strong }: { label: string; value: string; cur: string; strong?: boolean }) {
  return <div className={cn('mt-1 flex items-center justify-between border-y border-line py-1.5', strong ? 'text-[13px] font-bold text-ink' : 'text-[12px] font-semibold text-ink-700')}><span>{label}</span><span className="mono">{value}</span></div>;
}
function BlletSection({ title, rows, fmt, muted }: { title: string; rows: BulletinRow[]; fmt: (n: number) => string; muted?: boolean }) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-400">{title}</p>
      <div className="space-y-0.5">
        {rows.map((r, i) => (
          <div key={`${r.code}-${i}`} className={cn('flex items-center justify-between text-[12px]', muted ? 'font-medium text-ink-400' : 'font-medium text-ink-700')}>
            <span className="truncate pr-2">{r.label}{r.taux ? ` (${r.taux}%)` : ''}</span>
            <span className={cn('mono shrink-0', !muted && r.montant < 0 ? 'text-danger' : muted ? 'text-ink-400' : 'text-ink')}>{fmt(r.montant)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
interface EditItem { id: string; label: string; amount: number; sub: string; tag?: string }
function ListEditor({ title, items, onAdd, onRemove, fmt, addLabel, warn }: {
  title: string; items: EditItem[]; onAdd: () => void; onRemove: (id: string) => void; fmt: (n: number) => string; addLabel: string; warn?: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-ink">{title}</p>
      {items.length === 0 ? <p className="text-[13px] font-medium text-ink-400">Aucun élément ce mois.</p> : (
        <div className="space-y-1.5">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-2 rounded-xl bg-surface2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{it.label}{it.tag ? <span className="ml-1.5 text-[10px] font-bold uppercase text-amber-deep">{it.tag}</span> : ''}</p>
                <p className="text-[11px] font-medium text-ink-400">{it.sub}</p>
              </div>
              <span className="mono text-[13px] font-bold text-ink">{fmt(it.amount)}</span>
              <button onClick={() => onRemove(it.id)} className="rounded-lg p-1.5 text-ink-400 hover:bg-danger/10 hover:text-danger"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
      {warn && <p className="flex items-start gap-1.5 text-[11px] font-medium text-warn"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {warn}</p>}
      <Button variant="outline" size="sm" onClick={onAdd}><Plus size={14} /> {addLabel}</Button>
    </div>
  );
}
