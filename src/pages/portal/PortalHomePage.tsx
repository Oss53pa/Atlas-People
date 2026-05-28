import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, CalendarPlus, Inbox, Mail, AlertTriangle, ArrowRight, Fingerprint, ReceiptText, FileSignature,
  CalendarClock, CalendarDays, Target, GraduationCap, Newspaper,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { ProgressBar } from '../../components/charts/ProgressBar';
import { Money } from '../../lib/money';
import { computePayslip, getRegime } from '../../lib/payroll';
import { computeSelfLeaveBalance } from '../../lib/m2/selfBalance';
import { holidaySet } from '../../lib/m2/holidays';
import { useSurface } from '../../store/useSurface';
import { useTimeOff } from '../../store/useTimeOff';
import { useServiceRequests } from '../../store/useServiceRequests';
import { useCorrespondence } from '../../store/useCorrespondence';
import { employeeById, employeeName, employeeCurrency } from '../../data/mock';

const SELF_ID = 'e2';
const TODAY = '2026-05-28';

export function PortalHomePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);

  const employee = employeeById(SELF_ID)!;
  const regime = getRegime(employee.countryCode);
  const computation = useMemo(() => computePayslip({ baseSalary: employee.baseSalary, taxableAllowances: employee.taxableAllowances, nonTaxableAllowances: employee.nonTaxableAllowances, fiscalParts: employee.fiscalParts, otherDeductions: employee.otherDeductions }, regime, employeeName(employee)), [employee, regime]);
  const net = Money.fromJSON({ units: computation.result.netToPayUnits, currency: employeeCurrency(employee) });

  const requests = useTimeOff((s) => s.requests).filter((r) => r.employeeId === SELF_ID);
  const balance = useMemo(() => computeSelfLeaveBalance(employee, requests), [employee, requests]);

  const tickets = useServiceRequests((s) => s.requests).filter((r) => r.employeeId === SELF_ID);
  const openTickets = tickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'refused');
  const actionTickets = tickets.filter((t) => t.status === 'info_requested');

  const mail = useCorrespondence((s) => s.items).filter((c) => c.employeeId === SELF_ID);
  const unreadMail = mail.filter((c) => c.status === 'unread');
  const toSign = mail.filter((c) => c.status === 'action_required' && c.requiresSignature);

  // Planning 7 jours (déterministe)
  const fer = holidaySet(employee.countryCode);
  const approved = requests.filter((r) => r.status === 'approved');
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${TODAY}T00:00:00`); d.setDate(d.getDate() + i); const iso = d.toISOString().slice(0, 10);
    const we = d.getDay() === 0 || d.getDay() === 6;
    const label = approved.some((r) => r.start <= iso && r.end >= iso) ? 'Congé' : [...fer].includes(iso) ? 'Férié' : we ? 'Repos' : '08–16';
    const tone: 'ok' | 'neutral' | 'amber' | 'info' = label === 'Congé' ? 'amber' : label === 'Férié' ? 'info' : we ? 'neutral' : 'ok';
    return { iso, day: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }), label, tone };
  });

  // Échéances à venir, objectifs, formations, actualités (M7/M11/comm — illustratif)
  const upcoming = [
    { date: '2026-06-01', label: 'Mes congés posés (1→5 juin)' },
    { date: '2026-06-12', label: 'Entretien d’évaluation annuel' },
    { date: '2026-06-25', label: 'Versement de mon salaire de juin' },
    { date: '2027-03-12', label: 'Prochaine visite médicale obligatoire' },
  ];
  const objectives = [
    { title: 'Augmenter le CA de mon segment', pct: 67 },
    { title: 'Lancer 3 nouvelles offres', pct: 33 },
    { title: 'Améliorer la satisfaction client', pct: 60 },
  ];
  const trainings = [
    { title: 'Excel avancé', status: 'En cours · 12 mai → 30 juin', pct: 40 },
    { title: 'Sécurité incendie', status: 'À venir · 15 juin', pct: 0 },
  ];
  const news = [
    { title: 'Nouvelle politique de congés d’été', date: '2026-05-25' },
    { title: 'Ouverture du Cosmos Angré', date: '2026-05-18' },
  ];

  const greeting = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir';
  const alerts = [
    ...toSign.map((c) => ({ label: `Document à signer : ${c.subject}`, to: '/espace/courrier' })),
    ...actionTickets.map((t) => ({ label: `Action requise sur ${t.reference} : ${t.actionRequired}`, to: '/espace/demandes' })),
    ...(balance.available >= 5 ? [{ label: `${balance.available} jours de congés à poser avant péremption`, to: '/me/time/leave' }] : []),
  ];

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-deep">Portail collaborateur</p>
        <h1 className="text-2xl font-semibold text-ink">{greeting} {employee.firstName}</h1>
        <p className="text-sm font-medium text-ink-500">{new Date(`${TODAY}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Vous travaillez aujourd'hui</p>
      </div>

      {alerts.length > 0 && (
        <Card className="glass-amber">
          <CardHeader title="Mes alertes du moment" className="mb-2" action={<AlertTriangle size={16} className="text-amber-deep" />} />
          <div className="space-y-1.5">
            {alerts.map((a, i) => (
              <Link key={i} to={a.to} className="flex items-center gap-2 rounded-lg bg-surface/60 px-3 py-2 text-[12px] font-semibold text-ink-700 hover:bg-surface">
                <AlertTriangle size={13} className="shrink-0 text-warn" /> <span className="flex-1">{a.label}</span> <ArrowRight size={13} className="text-ink-400" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Prochain versement */}
        <Card className="surface-night border-0" inset={false}>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-deep">Prochain versement</span>
              <Wallet size={18} className="text-amber-deep" />
            </div>
            <p className="mono mt-2 text-3xl font-semibold text-ink">{net.formatWithCurrency()}</p>
            <p className="mt-1 text-[12px] font-medium text-ink-500">Estimé · 25 juin 2026</p>
            <Link to="/espace/paie"><Button variant="outline" size="sm" className="mt-3">Voir mes bulletins <ArrowRight size={14} /></Button></Link>
          </div>
        </Card>

        {/* Congés */}
        <Card>
          <CardHeader title="Mes congés disponibles" action={<CalendarPlus size={16} className="text-ink-400" />} />
          <p className="mono text-3xl font-semibold text-amber-deep">{balance.available} j</p>
          <div className="mt-2"><ProgressBar value={balance.taken} max={balance.acquired} tone="amber" /></div>
          <Link to="/me/time/leave/request/new"><Button size="sm" className="mt-3"><CalendarPlus size={14} /> Poser un congé</Button></Link>
        </Card>

        {/* Courrier */}
        <Card className={toSign.length ? 'border-amber/30' : ''}>
          <CardHeader title="Mon courrier" subtitle={`${unreadMail.length} non lu(s)`} action={<Mail size={16} className="text-ink-400" />} />
          {toSign.length > 0 ? (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-warn"><FileSignature size={15} /> {toSign.length} document(s) à signer</p>
          ) : <p className="text-sm font-medium text-ink-400">Rien à signer.</p>}
          <Link to="/espace/courrier"><Button variant="outline" size="sm" className="mt-3">Ouvrir ma boîte <ArrowRight size={14} /></Button></Link>
        </Card>

        {/* Demandes */}
        <Card>
          <CardHeader title="Mes demandes en cours" subtitle={`${openTickets.length} ouverte(s)`} action={<Inbox size={16} className="text-ink-400" />} />
          {openTickets.slice(0, 2).map((t) => (
            <div key={t.id} className="mb-1.5 flex items-center justify-between rounded-lg bg-surface2 px-3 py-2">
              <span className="truncate text-sm font-semibold text-ink">{t.typeLabel}</span>
              <StatusPill tone={t.status === 'info_requested' ? 'info' : 'warn'} dot={false}>{t.status === 'info_requested' ? 'Action requise' : 'En cours'}</StatusPill>
            </div>
          ))}
          <Link to="/espace/demandes"><Button variant="ghost" size="sm" className="mt-1">Toutes mes demandes <ArrowRight size={14} /></Button></Link>
        </Card>

        {/* Actions rapides */}
        <Card className="lg:col-span-2">
          <CardHeader title="Actions rapides" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Quick to="/me/time/leave/request/new" icon={CalendarPlus} label="Poser un congé" />
            <Quick to="/me/time/clocking" icon={Fingerprint} label="Pointer" />
            <Quick to="/espace/demandes" icon={Inbox} label="Nouvelle demande" />
            <Quick to="/espace/frais" icon={ReceiptText} label="Note de frais" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Échéances à venir */}
        <Card>
          <CardHeader title="Mes échéances à venir" subtitle="30 jours" action={<CalendarClock size={16} className="text-ink-400" />} />
          <div className="space-y-2">
            {upcoming.map((e) => (
              <div key={e.label} className="flex items-center gap-3">
                <span className="mono w-20 shrink-0 text-[11px] font-bold text-ink-500">{new Date(`${e.date}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                <span className="text-[12px] font-medium text-ink-700">{e.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Planning 7 jours */}
        <Card>
          <CardHeader title="Mon planning" subtitle="7 jours" action={<CalendarDays size={16} className="text-ink-400" />} />
          <div className="space-y-1">
            {week.map((d) => (
              <div key={d.iso} className="flex items-center justify-between rounded-lg px-2 py-1">
                <span className="text-[12px] font-semibold text-ink-700">{d.day}</span>
                <StatusPill tone={d.tone} dot={false}>{d.label}</StatusPill>
              </div>
            ))}
          </div>
          <Link to="/me/time/planning"><Button variant="ghost" size="sm" className="mt-2">Planning complet <ArrowRight size={14} /></Button></Link>
        </Card>

        {/* Objectifs */}
        <Card>
          <CardHeader title="Mes objectifs (OKR)" subtitle="Mise à jour il y a 12 j" action={<Target size={16} className="text-ink-400" />} />
          <div className="space-y-2.5">
            {objectives.map((o) => (
              <div key={o.title}>
                <div className="mb-1 flex items-center justify-between text-[12px]"><span className="font-semibold text-ink-700">{o.title}</span><span className="mono font-semibold text-ink-500">{o.pct}%</span></div>
                <ProgressBar value={o.pct} max={100} tone="amber" />
              </div>
            ))}
          </div>
        </Card>

        {/* Formations */}
        <Card>
          <CardHeader title="Mes formations" action={<GraduationCap size={16} className="text-ink-400" />} />
          <div className="space-y-1.5">
            {trainings.map((t) => (
              <div key={t.title} className="rounded-xl bg-surface2 px-3 py-2">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold text-ink">{t.title}</p><span className="mono text-[11px] font-bold text-amber-deep">{t.pct}%</span></div>
                <p className="text-[11px] font-medium text-ink-400">{t.status}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Actualités RH */}
        <Card className="lg:col-span-2">
          <CardHeader title="Actualités RH" action={<Newspaper size={16} className="text-ink-400" />} />
          <div className="space-y-1.5">
            {news.map((n) => (
              <div key={n.title} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2.5">
                <span className="text-sm font-semibold text-ink">{n.title}</span>
                <span className="text-[11px] font-medium text-ink-400">{new Date(`${n.date}T00:00:00`).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Quick({ to, icon: Icon, label }: { to: string; icon: typeof Wallet; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface2 p-4 text-center transition-all card-hover">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><Icon size={18} /></span>
      <span className="text-[12px] font-semibold text-ink">{label}</span>
    </Link>
  );
}
