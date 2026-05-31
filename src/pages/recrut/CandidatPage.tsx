import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Mail, Phone, MapPin, Briefcase, Calendar, Star, MessageSquare,
  CheckCircle2, ArrowUpRight, Download, Shield, Gift,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import {
  APPLICATIONS, REFERRALS,
  candidateById, jobById, stageMeta, rejectionLabel, scorecardsByApp, interviewsByApp, offerByApp,
} from '../../lib/m5/mock';
import { RECOMMENDATION_META, INTERVIEW_TYPES } from '../../lib/m5/referentiels';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

const TABS = [
  { id: 'profile', label: 'Profil' },
  { id: 'applications', label: 'Candidatures' },
  { id: 'interviews', label: 'Entretiens' },
  { id: 'scorecards', label: 'Scorecards' },
  { id: 'offers', label: 'Offres' },
  { id: 'rgpd', label: 'RGPD' },
] as const;
type TabId = typeof TABS[number]['id'];

export function CandidatPage() {
  const { id = '' } = useParams();
  const cand = candidateById(id);
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('profile');

  if (!cand) {
    return (
      <div className="animate-fade-up space-y-4">
        <RecrutSubNav />
        <Card><p className="py-10 text-center text-sm font-medium text-ink-400">Candidat introuvable.</p></Card>
      </div>
    );
  }

  const apps = APPLICATIONS.filter((a) => a.candidateId === cand.id);
  const intvs = apps.flatMap((a) => interviewsByApp(a.id));
  const cards = apps.flatMap((a) => scorecardsByApp(a.id));
  const myOffers = apps.map((a) => offerByApp(a.id)).filter(Boolean);
  const referral = REFERRALS.find((r) => r.candidateId === cand.id);

  return (
    <div className="animate-fade-up space-y-4">
      <RecrutSubNav />

      <Link to="/recrutement/candidatures" className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber-deep hover:underline">
        ← Pipeline
      </Link>

      {/* HEADER */}
      <Card className="glass-amber">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar name={`${cand.firstName} ${cand.lastName}`} size="lg" />
            <div>
              <h1 className="text-xl font-bold text-ink">{cand.firstName} {cand.lastName}</h1>
              <p className="mono mt-0.5 text-[11px] font-medium text-amber-deep">{cand.anonRef}</p>
              <p className="mt-1 text-[13px] font-semibold text-ink-700">{cand.currentRole} <span className="text-ink-400">@</span> {cand.currentCompany}</p>
              <p className="mt-0.5 text-[11px] font-medium text-ink-500">
                <MapPin size={11} className="inline" /> {cand.location} · {cand.countryCode} · {cand.yearsExperience} ans d'exp.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {cand.tags.map((t) => <span key={t} className="rounded-md bg-amber/12 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-deep">{t}</span>)}
                {referral && <span className="flex items-center gap-1 rounded-md bg-ok/10 px-2 py-0.5 text-[10px] font-bold uppercase text-ok"><Gift size={9} /> Coopté</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={`mailto:${cand.email}`}><Button variant="ghost" size="sm"><Mail size={13} /></Button></a>
            {cand.phone && <a href={`tel:${cand.phone}`}><Button variant="ghost" size="sm"><Phone size={13} /></Button></a>}
            <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'CV', description: 'CV téléchargé' })}><Download size={13} /> CV</Button>
            <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Entretien', description: 'Planification entretien…' })}>+ Entretien</Button>
          </div>
        </div>
      </Card>

      {/* TABS */}
      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5 no-scrollbar">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-colors',
              tab === t.id ? 'bg-amber/12 text-amber-deep ring-1 ring-amber/30' : 'text-ink-500 hover:bg-ink/[0.04] hover:text-ink')}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'profile' && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Card>
            <CardHeader title="Coordonnées" />
            <KV label="Email" value={cand.email} />
            {cand.phone && <KV label="Téléphone" value={cand.phone} />}
            <KV label="Localisation" value={`${cand.location} · ${cand.countryCode}`} />
            <KV label="Disponibilité" value={cand.availability} />
            <KV label="Source" value={cand.source} />
            {referral && <KV label="Coopté par" value={employeeName(employeeById(referral.referrerEmployeeId)!)} />}
          </Card>
          <Card>
            <CardHeader title="Profil professionnel" action={<Briefcase size={16} className="text-ink-400" />} />
            <KV label="Rôle actuel" value={cand.currentRole ?? '—'} />
            <KV label="Entreprise" value={cand.currentCompany ?? '—'} />
            <KV label="Expérience" value={`${cand.yearsExperience} ans`} />
            <KV label="Prétention salariale" value={`${fmt(cand.expectedSalaryMin ?? 0)} – ${fmt(cand.expectedSalaryMax ?? 0)}`} mono />
            <div className="mt-3"><p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Compétences</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {cand.skills.map((s) => <span key={s} className="rounded-md bg-info/10 px-2 py-0.5 text-[11px] font-semibold text-info">{s}</span>)}
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'applications' && (
        <Card inset={false}>
          <div className="p-5 pb-2"><CardHeader title="Candidatures" subtitle={`${apps.length} candidatures sur Atlas`} className="mb-0" /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 text-left">Réf.</th><th className="px-3 py-2 text-left">Poste</th>
                <th className="px-3 py-2 text-center">Score</th><th className="px-3 py-2 text-center">Étape</th>
                <th className="px-3 py-2 text-left">Refus</th><th className="px-3 py-2 text-right" />
              </tr></thead>
              <tbody className="divide-y divide-line">
                {apps.map((a) => {
                  const job = jobById(a.jobId)!;
                  const m = stageMeta(a.stage);
                  return (
                    <tr key={a.id}>
                      <td className="px-4 py-2 mono text-[11px] font-bold text-amber-deep">{a.ref}</td>
                      <td className="px-3 py-2"><p className="text-[12px] font-semibold text-ink">{job.title}</p><p className="text-[10px] font-medium text-ink-400">{job.ref}</p></td>
                      <td className="px-3 py-2 text-center"><span className="mono text-[12px] font-bold text-ink">{a.score ?? '—'}</span></td>
                      <td className="px-3 py-2 text-center"><StatusPill tone={m.tone} dot={false}>{m.label}</StatusPill></td>
                      <td className="px-3 py-2 text-[11px] font-medium text-ink-500">{rejectionLabel(a.rejectionReasonCode)}</td>
                      <td className="px-3 py-2 text-right"><Link to={`/recrutement/postes/${job.id}`}><Button variant="ghost" size="sm">Poste <ArrowUpRight size={12} /></Button></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'interviews' && (
        <Card>
          <CardHeader title="Entretiens" subtitle={`${intvs.length} entretien(s)`} action={<Calendar size={16} className="text-ink-400" />} />
          {intvs.length === 0 ? <p className="py-3 text-center text-[12px] font-medium text-ink-400">Aucun entretien.</p>
            : <div className="space-y-1.5">
                {intvs.map((i) => {
                  const t = INTERVIEW_TYPES.find((it) => it.code === i.type);
                  return (
                    <div key={i.id} className="rounded-xl bg-surface2/40 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] font-bold text-ink">{t?.label}</p>
                        <StatusPill tone={i.status === 'completed' ? 'ok' : i.status === 'no_show' ? 'danger' : i.status === 'cancelled' ? 'neutral' : 'amber'} dot={false}>{i.status}</StatusPill>
                      </div>
                      <p className="mt-0.5 text-[10px] font-medium text-ink-500">{new Date(i.scheduledAt).toLocaleString('fr-FR')} · {i.durationMin} min · {i.mode}</p>
                    </div>
                  );
                })}
              </div>}
        </Card>
      )}

      {tab === 'scorecards' && (
        <div className="space-y-3">
          {cards.length === 0 ? <Card><p className="py-3 text-center text-[12px] font-medium text-ink-400">Pas de scorecard.</p></Card>
            : cards.map((s) => {
              const r = RECOMMENDATION_META[s.recommendation];
              const reviewer = employeeById(s.interviewerEmployeeId);
              return (
                <Card key={s.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Star size={14} className="text-amber-deep" /><p className="text-[13px] font-bold text-ink">{reviewer ? employeeName(reviewer) : 'Interviewer'}</p></div>
                    <div className="flex items-center gap-2">
                      <span className="mono rounded-md bg-amber/12 px-2 py-0.5 text-[11px] font-bold text-amber-deep">{s.overall.toFixed(1)}/5</span>
                      <StatusPill tone={r.tone} dot={false}>{r.label}</StatusPill>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {s.criteria.map((c, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5 text-[12px]">
                        <span className="font-medium text-ink-700">{c.name}</span>
                        <span className="mono font-bold text-ink">{c.score}/5</span>
                      </div>
                    ))}
                  </div>
                  {s.strengths && <p className="mt-2 rounded-lg bg-ok/[0.06] px-3 py-1.5 text-[11px] font-medium text-ink-700"><CheckCircle2 size={11} className="inline text-ok" /> {s.strengths}</p>}
                  {s.concerns && <p className="mt-1 rounded-lg bg-warn/[0.06] px-3 py-1.5 text-[11px] font-medium text-ink-700"><MessageSquare size={11} className="inline text-warn" /> {s.concerns}</p>}
                </Card>
              );
            })}
        </div>
      )}

      {tab === 'offers' && (
        <div className="space-y-3">
          {myOffers.length === 0 ? <Card><p className="py-3 text-center text-[12px] font-medium text-ink-400">Aucune offre.</p></Card>
            : myOffers.map((o) => o && (
              <Card key={o.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-ink">{o.ref}</p>
                    <p className="text-[11px] font-medium text-ink-500">Démarrage {o.startDate} · valide jusqu'au {o.validUntil}</p>
                  </div>
                  <StatusPill tone={o.status === 'accepted' ? 'ok' : o.status === 'declined' ? 'danger' : 'amber'} dot={false}>{o.status}</StatusPill>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <Mini label="Salaire base" value={fmt(o.baseSalary)} />
                  <Mini label="Indemnités" value={fmt(o.allowancesTotal)} />
                  <Mini label="Package annuel" value={fmt(o.totalPackage)} />
                </div>
                <p className="mt-2 text-[11px] font-medium text-ink-500">Workflow : {o.signatureWorkflow ?? 'non démarré'}</p>
              </Card>
            ))}
        </div>
      )}

      {tab === 'rgpd' && (
        <Card>
          <CardHeader title="Consentement RGPD" subtitle="Article 7 RGPD · conservation contrôlée" action={<Shield size={16} className="text-amber-deep" />} />
          <KV label="Consentement" value={cand.rgpdConsent ? 'Oui, recueilli' : 'Non'} />
          <KV label="Date de consentement" value={cand.rgpdConsentAt} />
          <KV label="Conservation jusqu'au" value={cand.rgpdRetentionUntil} />
          <p className="mt-3 rounded-xl bg-info/[0.06] px-3 py-2 text-[11px] font-medium text-ink-700">
            Le candidat peut exercer son droit à l'effacement à tout moment. Anonymisation automatique 2 ans après le dernier événement de candidature.
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Anonymisation', description: 'Anonymisation initiée — SLA 30 jours' })}>Anonymiser</Button>
            <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'success', title: 'Export', description: 'Export RGPD des données candidat généré' })}><Download size={13} /> Export données</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</span>
      <span className={cn('truncate text-right text-[13px] font-semibold text-ink', mono && 'mono')}>{value}</span>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface2/40 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mono mt-0.5 text-sm font-bold text-amber-deep">{value}</p>
    </div>
  );
}
