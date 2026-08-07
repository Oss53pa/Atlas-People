import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Wallet, ShieldCheck, Sparkles, TrendingUp, Landmark, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { PayslipModal } from '../../components/payroll/PayslipModal';
import { useToast } from '../../components/ui/Toast';
import { Money } from '../../lib/money';
import { computePayslip, getRegime } from '../../lib/payroll';
import { useSurface } from '../../store/useSurface';
import { useCorrespondence } from '../../store/useCorrespondence';
import { employeeById, employeeName, mobileMoney, employeeCompensation, employeeCurrency } from '../../data/mock';
import { useMyBulletins, isBackendConfigured } from '../../lib/ess/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const STATUS_LABEL_BUL: Record<string, string> = {
  calculated: 'Calculé', validated_n1: 'Validé N+1', validated_n2: 'Validé N+2',
  signed: 'Signé', diffused: 'Diffusé', closed: 'Clôturé', draft: 'Brouillon',
};
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai'];
const TABS = [
  { key: 'bulletins', label: 'Mes bulletins' },
  { key: 'history', label: 'Historique' },
  { key: 'cumul', label: 'Cumul annuel' },
  { key: 'attestations', label: 'Attestations' },
  { key: 'cotisations', label: 'Cotisations' },
];

export function MaPaiePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);

  const { toast } = useToast();
  const { data: ctx } = useSessionContext();
  const SELF_ID = ctx?.employeeId ?? 'e2';
  const employee = employeeById(SELF_ID)!;
  const regime = getRegime(employee.countryCode);
  const computation = useMemo(() => computePayslip({ baseSalary: employee.baseSalary, taxableAllowances: employee.taxableAllowances, nonTaxableAllowances: employee.nonTaxableAllowances, fiscalParts: employee.fiscalParts, otherDeductions: employee.otherDeductions }, regime, employeeName(employee)), [employee, regime]);
  const cur = employeeCurrency(employee);
  const gross = Money.fromJSON({ units: computation.result.grossTotalUnits, currency: cur }).toInt();
  const contrib = Money.fromJSON({ units: computation.result.totalEmployeeContributionUnits, currency: cur }).toInt();
  const net = Money.fromJSON({ units: computation.result.netToPayUnits, currency: cur }).toInt();
  const months = MONTHS.length;

  const [tab, setTab] = useState('bulletins');
  const [showSlip, setShowSlip] = useState<string | null>(null);
  const { data: liveBulletins } = useMyBulletins(ctx?.tenantId, ctx?.employeeId);

  const attestations = useCorrespondence((s) => s.items).filter((c) => c.employeeId === SELF_ID && (c.type.startsWith('CUR-ATT') || c.typeLabel.toLowerCase().includes('attestation')));
  const compLines = employeeCompensation(employee);
  const fmtMoney = (n: number) => Money.of(n, cur).format();

  return (
    <div className="animate-fade-up space-y-5">
      {showSlip && <PayslipModal employee={employee} computation={computation} period={showSlip} onClose={() => setShowSlip(null)} />}

      <div>
        <h1 className="text-2xl font-semibold text-ink">Ma paie</h1>
        <p className="text-sm font-medium text-ink-500">
          Net du mois : <span className="mono font-bold text-amber-deep">{fmtMoney(net)} FCFA</span> · prochain versement 25 mai 2026 · Mobile Money {mobileMoney(employee)}
          {isBackendConfigured && liveBulletins && liveBulletins.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              <Wifi size={9} /> {liveBulletins.length} bulletins en DB
            </span>
          )}
        </p>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {/* BULLETINS LIVE */}
      {tab === 'bulletins' && isBackendConfigured && liveBulletins && liveBulletins.length > 0 && (
        <div className="space-y-2">
          {liveBulletins.map((b) => (
            <Card key={b.id}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><FileText size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{b.cycle_label ?? b.cycle_period}</p>
                  <p className="text-[11px] font-medium text-ink-400">
                    Net : <span className="mono font-bold text-ink">{fmt(b.net_a_payer)} FCFA</span> · Brut : {fmt(b.brut_total)} · N° {b.numero}
                  </p>
                </div>
                <StatusPill tone={b.status === 'diffused' || b.status === 'closed' ? 'ok' : 'amber'} dot={false}>
                  {STATUS_LABEL_BUL[b.status] ?? b.status}
                </StatusPill>
                <Button size="sm" variant="ghost" onClick={() => setShowSlip(b.cycle_label ?? b.cycle_period ?? 'Bulletin')}><Download size={14} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* BULLETINS MOCK (fallback ou si onglet bulletins sans live) */}
      {tab === 'bulletins' && (!isBackendConfigured || !liveBulletins || liveBulletins.length === 0) && (
        <div className="space-y-2">
          {MONTHS.slice().reverse().map((m, i) => {
            const monthNet = net - i * 4000;
            const period = `${m} 2026`;
            return (
              <Card key={m}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><FileText size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{period}</p>
                    <p className="text-[11px] font-medium text-ink-400">Net <span className="mono font-semibold text-ink">{fmt(monthNet)} FCFA</span> · versé le 25/{String(5 - i).padStart(2, '0')}/2026 · {mobileMoney(employee)}</p>
                  </div>
                  <StatusPill tone="ok" dot={false}>Versé</StatusPill>
                  <Button variant="outline" size="sm" onClick={() => setShowSlip(period)}><FileText size={14} /> Voir</Button>
                  <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'success', title: 'Téléchargement', description: `Bulletin ${period}.pdf (officiel, signé).` })}><Download size={14} /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* HISTORIQUE */}
      {tab === 'history' && (
        <Card>
          <CardHeader title="Mon historique de rémunération" subtitle="Composantes actuelles" action={<TrendingUp size={16} className="text-ink-400" />} />
          <div className="overflow-hidden rounded-xl border border-line">
            <div className="grid grid-cols-[0.7fr_1.8fr_1.2fr_1fr] gap-3 border-b border-line bg-surface2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-400"><span>Code</span><span>Composante</span><span>Catégorie</span><span className="text-right">Montant</span></div>
            <div className="divide-y divide-line">
              {compLines.map((l) => (
                <div key={l.code} className="grid grid-cols-[0.7fr_1.8fr_1.2fr_1fr] items-center gap-3 px-4 py-2.5">
                  <span className="mono text-[11px] font-bold text-ink-500">{l.code}</span>
                  <span className="text-sm font-semibold text-ink">{l.label}</span>
                  <span className="text-[11px] font-medium text-ink-400">{l.category}</span>
                  <span className="mono text-right text-sm font-semibold text-ink">{fmtMoney(l.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* CUMUL ANNUEL */}
      {tab === 'cumul' && (
        <Card>
          <CardHeader title="Mon cumul annuel" subtitle={`Janvier → Mai 2026 (${months} mois)`} action={<Wallet size={16} className="text-ink-400" />} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Brut cumulé" value={fmtMoney(gross * months)} />
            <Stat label="Cotisations" value={`−${fmtMoney(contrib * months)}`} />
            <Stat label="Net cumulé" value={fmtMoney(net * months)} accent />
            <Stat label="Coût employeur" value={fmtMoney(Money.fromJSON({ units: computation.result.employerCostUnits, currency: cur }).toInt() * months)} />
          </div>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => toast({ variant: 'success', title: 'Récapitulatif annuel', description: 'Récap 2026.pdf généré.' })}><Download size={14} /> Télécharger le récap annuel</Button>
        </Card>
      )}

      {/* ATTESTATIONS */}
      {tab === 'attestations' && (
        <Card>
          <CardHeader title="Mes attestations" subtitle="Délivrées & demandes" action={<Link to="/espace/demandes"><Button variant="outline" size="sm">+ Demander une attestation</Button></Link>} />
          {attestations.length > 0 ? (
            <div className="space-y-1.5">
              {attestations.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><FileText size={14} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{a.subject}</p><p className="text-[11px] font-medium text-ink-400">{a.senderName} · {new Date(`${a.deliveredAt}T00:00:00`).toLocaleDateString('fr-FR')}</p></div>
                  <Link to="/espace/courrier"><Button variant="ghost" size="sm">Voir</Button></Link>
                </div>
              ))}
            </div>
          ) : <p className="text-sm font-medium text-ink-400">Aucune attestation délivrée. Demandez-en une via « Mes demandes ».</p>}
        </Card>
      )}

      {/* COTISATIONS */}
      {tab === 'cotisations' && (
        <Card>
          <CardHeader title="Mes cotisations sociales" subtitle={`Cumul ${months} mois`} action={<Landmark size={16} className="text-ink-400" />} />
          <div className="space-y-2">
            <Coti label="CNPS Retraite" sub="6,30% · part salariale" amount={fmt(Math.round(gross * 0.063 * months))} />
            <Coti label="CMU" sub="1,00%" amount={fmt(Math.round(gross * 0.01 * months))} />
            <Coti label="IUTS (impôt)" sub="Barème CGI Côte d'Ivoire" amount={fmt(Math.round(contrib * 0.6 * months))} />
          </div>
          <p className="mt-3 flex items-start gap-2 text-[12px] font-medium text-ink-700"><Sparkles size={14} className="mt-0.5 shrink-0 text-amber-deep" /> Proph3t peut expliquer le barème IUTS et estimer l'impact d'un changement de charges familiales — pédagogie uniquement, jamais de calcul de paie.</p>
        </Card>
      )}

      <Card className="glass-amber">
        <p className="flex items-center gap-2 text-[12px] font-medium text-ink-700"><ShieldCheck size={14} className="shrink-0 text-ok" /> Données strictement confidentielles : votre manager n'a jamais accès à votre rémunération. Bulletins officiels signés, conservés 5 ans.</p>
      </Card>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border px-3 py-3 text-center ${accent ? 'border-amber/30 bg-amber/[0.06]' : 'border-line bg-surface2'}`}>
      <p className={`mono text-base font-semibold ${accent ? 'text-amber-deep' : 'text-ink'}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
    </div>
  );
}

function Coti({ label, sub, amount }: { label: string; sub: string; amount: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2.5">
      <div><p className="text-sm font-semibold text-ink">{label}</p><p className="text-[11px] font-medium text-ink-400">{sub}</p></div>
      <span className="mono text-sm font-bold text-ink">{amount} FCFA</span>
    </div>
  );
}
