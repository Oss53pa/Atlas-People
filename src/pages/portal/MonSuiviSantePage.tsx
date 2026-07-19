import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, CalendarClock, ShieldCheck, Syringe, FileWarning, Lock, Plane, Download, CalendarCheck, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { useSurface } from '../../store/useSurface';
import { employeeById, employeeMedicalFollowup, employeeVaccinations } from '../../data/mock';
import { cn } from '../../lib/cn';
import { useMyMedical, isBackendConfigured } from '../../lib/portal/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
const frDay = (d: string) => new Date(d + 'T00:00').toLocaleDateString('fr-FR');

const VISIT_TYPE_LABEL: Record<string, string> = { hiring: 'Visite d\'embauche', periodic: 'Visite périodique', return: 'Visite de reprise', on_request: 'Visite à la demande', pre_return: 'Visite de pré-reprise', enhanced_followup: 'Suivi renforcé', other: 'Autre visite' };
const VISIT_STATUS_LABEL: Record<string, string> = { scheduled: 'Planifiée', completed: 'Réalisée', postponed: 'Reportée', missed: 'Manquée', cancelled: 'Annulée' };
const VISIT_STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'amber' | 'neutral'> = { scheduled: 'amber', completed: 'ok', postponed: 'warn', missed: 'danger', cancelled: 'neutral' };
const CONCLUSION_LABEL: Record<string, string> = { fit: 'Apte', fit_with_restrictions: 'Apte avec restrictions', temporarily_unfit: 'Inapte temporaire', permanently_unfit: 'Inapte définitif', to_review: 'À revoir' };
const VACC_STATUS_LABEL: Record<string, string> = { up_to_date: 'À jour', recall_due_soon: 'À renouveler', expired: 'Périmé', in_progress: 'En cours' };
const VACC_STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'info'> = { up_to_date: 'ok', recall_due_soon: 'warn', expired: 'danger', in_progress: 'info' };
const liveIndicator = (
  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500"><Wifi size={13} className="text-emerald-500" /> Live DB</span>
);
const TABS = [
  { key: 'overview', label: 'Vue d\'ensemble' },
  { key: 'rdv', label: 'Mes RDV' },
  { key: 'aptitude', label: 'Aptitude' },
  { key: 'vaccins', label: 'Vaccinations' },
  { key: 'arrets', label: 'Arrêts de travail' },
];

const APT_TONE: Record<string, 'ok' | 'warn' | 'danger'> = { fit: 'ok', fit_with_restrictions: 'warn', temporarily_unfit: 'danger', permanently_unfit: 'danger', pending_opinion: 'warn' };

export function MonSuiviSantePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const { data: ctx } = useSessionContext();
  const SELF_ID = ctx?.employeeId ?? 'e2';
  const { data: liveMedical } = useMyMedical(ctx?.tenantId, ctx?.employeeId);
  const hasLive = isBackendConfigured && !!liveMedical;
  const employee = employeeById(SELF_ID)!;
  const medical = employeeMedicalFollowup(employee);
  const vaccinations = employeeVaccinations(employee);

  const liveUpcomingVisit = hasLive ? liveMedical!.visits.filter((v) => v.status === 'scheduled').slice(-1)[0] : undefined;
  const livePastVisits = hasLive ? liveMedical!.visits.filter((v) => v.status !== 'scheduled') : [];

  const sickLeaves = [
    { start: '2026-03-15', end: '2026-03-22', days: 8, type: 'Maladie ordinaire', justified: true },
    { start: '2026-01-02', end: '2026-01-04', days: 3, type: 'Maladie ordinaire', justified: true },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <h1 className="text-2xl font-semibold text-ink">Mon suivi santé</h1>
      <Card className="border-info/25 bg-info/[0.05]">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><Lock size={15} className="mt-0.5 shrink-0 text-info" /> <span><strong>Confidentialité médicale stricte.</strong> Votre dossier médical détaillé est accessible uniquement par le médecin du travail. Cette page présente les informations administratives et opérationnelles de votre suivi.</span></p>
      </Card>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Mon service référent" action={hasLive ? liveIndicator : <Stethoscope size={16} className="text-ink-400" />} />
            {hasLive ? (
              <>
                <p className="text-sm font-bold text-ink">{liveMedical!.service ?? 'Service médical du travail'}</p>
                <p className="text-[12px] font-medium text-ink-400">{liveMedical!.assignedAt ? `Rattaché depuis le ${frDay(liveMedical!.assignedAt.slice(0, 10))}` : 'Suivi médical du travail'}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-ink">{medical.doctor}</p>
                <p className="text-[12px] font-medium text-ink-400">{medical.service}</p>
              </>
            )}
            <Button variant="outline" size="sm" className="mt-3" onClick={() => toast({ variant: 'success', title: 'Demande de RDV envoyée', description: 'Le service médical vous proposera un créneau.' })}>Prendre RDV</Button>
          </Card>
          <Card>
            <CardHeader title="Mon prochain RDV" action={hasLive ? liveIndicator : <CalendarClock size={16} className="text-ink-400" />} />
            {hasLive ? (
              liveUpcomingVisit ? (
                <>
                  <p className="text-sm font-bold text-ink">{VISIT_TYPE_LABEL[liveUpcomingVisit.visit_type] ?? liveUpcomingVisit.visit_type}</p>
                  <p className="text-[12px] font-medium text-ink-400">{frDay(liveUpcomingVisit.scheduled_date)}</p>
                </>
              ) : <p className="text-sm font-medium text-ink-400">Aucun rendez-vous planifié.</p>
            ) : (
              <>
                <p className="text-sm font-bold text-ink">Visite médicale périodique</p>
                <p className="text-[12px] font-medium text-ink-400">{frDate(medical.nextVisit)}</p>
              </>
            )}
            <div className="mt-3 flex gap-2"><Link to="/espace/courrier"><Button variant="ghost" size="sm">Voir convocation</Button></Link><Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Présence confirmée' })}><CalendarCheck size={14} /> Confirmer</Button></div>
          </Card>
          <Card className={medical.aptitude === 'fit' ? '' : 'border-warn/30'}>
            <CardHeader title="Mon aptitude" action={<ShieldCheck size={16} className="text-ink-400" />} />
            <StatusPill tone={APT_TONE[medical.aptitude]} dot={false}>{medical.aptitudeLabel}</StatusPill>
            {medical.restrictions.length > 0 && <ul className="mt-2 space-y-1">{medical.restrictions.map((r) => <li key={r} className="flex items-center gap-1.5 text-[12px] font-medium text-ink-700"><span className="h-1.5 w-1.5 rounded-full bg-warn" /> {r}</li>)}</ul>}
            {medical.validUntil && <p className="mt-2 text-[11px] font-medium text-ink-400">Valable jusqu'au {frDate(medical.validUntil)}</p>}
          </Card>
          <Card>
            <CardHeader title="Actions rapides" />
            <div className="space-y-1.5">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setTab('arrets')}><FileWarning size={14} /> Déclarer un arrêt de travail</Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => toast({ variant: 'info', title: 'Déclaration AT', description: 'Formulaire de déclaration d\'accident du travail.' })}><Plane size={14} /> Déclarer un accident du travail</Button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'rdv' && (
        <Card>
          <CardHeader title="Mes rendez-vous médicaux" subtitle={hasLive ? 'Live DB' : undefined} action={hasLive ? liveIndicator : <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Demande de RDV envoyée' })}>+ Demander un RDV</Button>} />
          {hasLive ? (
            liveMedical!.visits.length > 0 ? (
              <div className="space-y-1.5">
                {liveUpcomingVisit && <RdvRow date={liveUpcomingVisit.scheduled_date} title={VISIT_TYPE_LABEL[liveUpcomingVisit.visit_type] ?? liveUpcomingVisit.visit_type} sub={VISIT_STATUS_LABEL[liveUpcomingVisit.status] ?? liveUpcomingVisit.status} upcoming />}
                {livePastVisits.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><CalendarClock size={15} /></span>
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{VISIT_TYPE_LABEL[v.visit_type] ?? v.visit_type}</p><p className="text-[11px] font-medium text-ink-400">{frDay((v.effective_date ?? v.scheduled_date))}{v.doctor_conclusion ? ` · ${CONCLUSION_LABEL[v.doctor_conclusion] ?? v.doctor_conclusion}` : ''}</p></div>
                    <StatusPill tone={VISIT_STATUS_TONE[v.status] ?? 'neutral'} dot={false}>{VISIT_STATUS_LABEL[v.status] ?? v.status}</StatusPill>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm font-medium text-ink-400">Aucun rendez-vous médical enregistré.</p>
          ) : (
            <div className="space-y-1.5">
              <RdvRow date={medical.nextVisit} title="Visite médicale périodique" sub={medical.doctor} upcoming />
              <RdvRow date={medical.lastVisit} title={medical.lastVisitType} sub="Aptitude délivrée : apte avec restrictions" />
            </div>
          )}
        </Card>
      )}

      {tab === 'aptitude' && (
        <Card>
          <CardHeader title="Mon aptitude & mes restrictions" subtitle="Catégoriel & opérationnel — jamais de nature médicale" action={<ShieldCheck size={16} className="text-ink-400" />} />
          <StatusPill tone={APT_TONE[medical.aptitude]} dot={false}>{medical.aptitudeLabel}</StatusPill>
          <div className="mt-3 space-y-2">
            <Row label="Émise le" value={frDate(medical.lastVisit)} />
            <Row label="Valable jusqu'au" value={medical.validUntil ? frDate(medical.validUntil) : '—'} />
            <Row label="Médecin" value={medical.doctor} />
          </div>
          {medical.restrictions.length > 0 && (
            <div className="mt-3"><p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-400">Restrictions opérationnelles</p><ul className="space-y-1">{medical.restrictions.map((r) => <li key={r} className="flex items-center gap-1.5 text-[12px] font-medium text-ink-700"><span className="h-1.5 w-1.5 rounded-full bg-warn" /> {r}</li>)}</ul></div>
          )}
          <Button variant="outline" size="sm" className="mt-3" onClick={() => toast({ variant: 'success', title: 'Attestation', description: 'Attestation d\'aptitude.pdf' })}><Download size={14} /> Télécharger l'attestation</Button>
        </Card>
      )}

      {tab === 'vaccins' && (
        <Card>
          <CardHeader title="Mes vaccinations professionnelles" action={hasLive ? liveIndicator : <Syringe size={16} className="text-ink-400" />} />
          {hasLive ? (
            liveMedical!.vaccinations.length > 0 ? (
              <div className="space-y-1.5">
                {liveMedical!.vaccinations.map((v) => (
                  <div key={v.id} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5', v.status === 'expired' ? 'bg-danger/[0.05]' : v.status === 'recall_due_soon' ? 'bg-warn/[0.05]' : 'bg-surface2')}>
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', v.status === 'expired' ? 'bg-danger/12 text-danger' : v.status === 'recall_due_soon' ? 'bg-warn/12 text-warn' : 'bg-ok/12 text-ok')}><Syringe size={15} /></span>
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{v.label ?? v.vaccination_id}{v.obligatory_for_position && <span className="ml-1.5 text-[10px] font-bold text-amber-deep">obligatoire</span>}</p><p className="text-[11px] font-medium text-ink-400">{v.next_recall_date ? `Rappel ${frDay(v.next_recall_date)}` : 'Sans rappel'}</p></div>
                    <StatusPill tone={VACC_STATUS_TONE[v.status] ?? 'neutral'} dot={false}>{VACC_STATUS_LABEL[v.status] ?? v.status}</StatusPill>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm font-medium text-ink-400">Aucune vaccination enregistrée.</p>
          ) : (
          <div className="space-y-1.5">
            {vaccinations.map((v) => (
              <div key={v.label} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5', v.status === 'expired' ? 'bg-danger/[0.05]' : v.status === 'recall_due_soon' ? 'bg-warn/[0.05]' : 'bg-surface2')}>
                <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', v.status === 'expired' ? 'bg-danger/12 text-danger' : v.status === 'recall_due_soon' ? 'bg-warn/12 text-warn' : 'bg-ok/12 text-ok')}><Syringe size={15} /></span>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{v.label}{v.obligatory && <span className="ml-1.5 text-[10px] font-bold text-amber-deep">obligatoire</span>}</p><p className="text-[11px] font-medium text-ink-400">{v.nextRecall ? `Rappel ${frDate(v.nextRecall)}` : 'Sans rappel'}</p></div>
                <StatusPill tone={v.status === 'expired' ? 'danger' : v.status === 'recall_due_soon' ? 'warn' : 'ok'} dot={false}>{v.status === 'expired' ? 'Périmé' : v.status === 'recall_due_soon' ? 'À renouveler' : 'À jour'}</StatusPill>
              </div>
            ))}
          </div>
          )}
        </Card>
      )}

      {tab === 'arrets' && (
        <Card>
          <CardHeader title="Mes arrêts de travail" subtitle="Dates & type — jamais de diagnostic" action={<Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Déclarer un arrêt', description: 'Le certificat est transmis au médecin et à la paie uniquement — jamais au manager.' })}>+ Déclarer un arrêt</Button>} />
          <div className="space-y-1.5">
            {sickLeaves.map((s) => (
              <div key={s.start} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/12 text-info"><Stethoscope size={15} /></span>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">Du {frDate(s.start)} au {frDate(s.end)} ({s.days} j)</p><p className="text-[11px] font-medium text-ink-400">{s.type}</p></div>
                <StatusPill tone="ok" dot={false}>Justificatif validé</StatusPill>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] font-medium text-ink-400">Jours d'arrêt 2026 : {sickLeaves.reduce((s, x) => s + x.days, 0)} j · indemnisation selon code du travail (cf. bulletin).</p>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="font-medium text-ink-500">{label}</span><span className="font-semibold text-ink">{value}</span></div>;
}
function RdvRow({ date, title, sub, upcoming }: { date: string; title: string; sub: string; upcoming?: boolean }) {
  return <div className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><CalendarClock size={15} /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{title}</p><p className="text-[11px] font-medium text-ink-400">{frDate(date)} · {sub}</p></div>{upcoming && <StatusPill tone="amber" dot={false}>À venir</StatusPill>}</div>;
}
