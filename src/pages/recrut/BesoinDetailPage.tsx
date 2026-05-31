import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Wallet, CalendarClock, CheckCircle2, XCircle, Clock, Megaphone,
  Briefcase, Sparkles, ShieldCheck, FileText,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { needById, needRequiresDG } from '../../lib/m5/needs';
import { NEED_TYPES, NEED_STATUS_META, NEED_URGENCY_META, SOURCING_DEFAULTS, EMPLOYER_CHARGES_RATE } from '../../lib/m5/referentiels';
import type { NeedValidationStep } from '../../lib/m5/types';
import { employeeById, employeeName } from '../../data/mock';
import { TENANT_CURRENCY } from '../../data/countries';
import { Money } from '../../lib/money';
import { cn } from '../../lib/cn';

const fmt = (n: number) => Money.of(Math.round(n), TENANT_CURRENCY).format();

const DECISION_META: Record<NeedValidationStep['decision'], { label: string; tone: 'ok' | 'amber' | 'warn' | 'danger' | 'neutral'; icon: typeof CheckCircle2 }> = {
  pending:               { label: 'En attente',             tone: 'neutral', icon: Clock },
  approved:              { label: 'Approuvé',               tone: 'ok',      icon: CheckCircle2 },
  approved_with_changes: { label: 'Approuvé avec réserves', tone: 'amber',   icon: CheckCircle2 },
  info_requested:        { label: 'Précisions demandées',   tone: 'warn',    icon: Clock },
  rejected:              { label: 'Refusé',                 tone: 'danger',  icon: XCircle },
};

export function BesoinDetailPage() {
  const { besoinId = '' } = useParams();
  const { toast } = useToast();
  const need = needById(besoinId);

  const nextStep = useMemo(
    () => need?.validations.find((v) => v.required && v.decision === 'pending'),
    [need],
  );

  if (!need) {
    return (
      <div className="animate-fade-up space-y-4">
        <RecrutSubNav />
        <Card><p className="py-10 text-center text-sm font-medium text-ink-400">Besoin introuvable. <Link to="/recrutement/besoins" className="text-amber-deep hover:underline">Retour à la liste</Link></p></Card>
      </div>
    );
  }

  const mgr = employeeById(need.hiringManagerId);
  const replaces = need.replacesEmployeeId ? employeeById(need.replacesEmployeeId) : undefined;
  const brutTotal = need.salaryMedian + need.allowancesMonthly;
  const chargesPatronales = Math.round(brutTotal * EMPLOYER_CHARGES_RATE);
  const sm = NEED_STATUS_META[need.status];
  const um = NEED_URGENCY_META[need.urgency];
  const typeLabel = NEED_TYPES.find((t) => t.code === need.type)?.label ?? need.type;

  return (
    <div className="animate-fade-up space-y-4">
      <RecrutSubNav />

      <Link to="/recrutement/besoins" className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-500 hover:text-ink"><ArrowLeft size={13} /> Tous les besoins</Link>

      {/* HEADER */}
      <Card className="glass-amber">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-ink">{need.title}</h1>
              <span className="mono text-[11px] font-bold text-amber-deep">{need.ref}</span>
            </div>
            <p className="text-[13px] font-semibold text-ink-700">{need.department} · {need.location} · {need.contractType}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <StatusPill tone={sm.tone} dot>{sm.label}</StatusPill>
              <span className="rounded-md bg-ink/[0.06] px-2 py-0.5 text-[11px] font-bold text-ink-700">{typeLabel}</span>
              <StatusPill tone={um.tone} dot={false}>Urgence {um.label.toLowerCase()}</StatusPill>
              <span className="text-[11px] font-medium text-ink-500">{need.volume} poste(s)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {need.status === 'approved' && (
              <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Offre', description: 'Création d\'offre depuis le besoin (wizard offre)' })}><Megaphone size={14} /> Créer l'offre</Button>
            )}
            {need.status === 'in_progress' && need.createdOfferIds?.length ? (
              <Link to={`/recrutement/postes/${need.createdOfferIds[0]}`}><Button variant="outline" size="sm"><Briefcase size={14} /> Voir l'offre</Button></Link>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Replacement / transformation context */}
      {(replaces || need.suppressedPositions?.length) && (
        <Card className="border-info/25">
          {replaces && <p className="text-[13px] font-medium text-ink-700">Remplacement de <b>{employeeName(replaces)}</b> ({replaces.role}, {replaces.department}).</p>}
          {need.suppressedPositions?.length ? <p className="text-[13px] font-medium text-ink-700">Postes supprimés : {need.suppressedPositions.join(', ')}.</p> : null}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Profil & poste */}
        <Card>
          <CardHeader title="Définition du poste & profil" action={<Briefcase size={16} className="text-amber-deep" />} />
          <KV label="Manager hiérarchique" value={mgr ? employeeName(mgr) : '—'} />
          <KV label="Classification" value={`${need.category}${need.echelon ? ` · échelon ${need.echelon}` : ''}`} />
          <KV label="Type de contrat" value={need.contractType} />
          <KV label="Localisation" value={need.location} />
          {need.remotePolicy && <KV label="Télétravail" value={need.remotePolicy} />}
          <KV label="Expérience" value={`${need.experienceMin}–${need.experienceMax} ans`} />
          <KV label="Formation min." value={need.educationMin} />
          <div className="mt-3 border-t border-line pt-3">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">Motivation / contexte</p>
            <p className="text-[13px] font-medium text-ink-700">{need.motivation}</p>
          </div>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader title="Rémunération & budget" action={<Wallet size={16} className="text-amber-deep" />} />
          <KV label="Fourchette salariale" value={`${fmt(need.salaryMin)} – ${fmt(need.salaryMax)}`} mono />
          <KV label="Médiane retenue" value={fmt(need.salaryMedian)} mono />
          <KV label="Indemnités / mois" value={fmt(need.allowancesMonthly)} mono />
          <KV label="Brut mensuel" value={fmt(brutTotal)} mono />
          <KV label={`Charges patronales (${Math.round(EMPLOYER_CHARGES_RATE * 100)} %)`} value={fmt(chargesPatronales)} mono />
          <KV label="Coût employeur / mois" value={fmt(need.employerCostMonthly)} mono />
          <div className="mt-2 flex items-center justify-between rounded-xl bg-amber/[0.06] px-3 py-2">
            <span className="text-[12px] font-bold uppercase tracking-wider text-amber-deep">Budget année 1</span>
            <span className="mono text-base font-bold text-ink">{fmt(need.budgetYear1)}</span>
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-ink-400">Coût recrutement estimé : {fmt(need.recruitmentCost)}{need.budgetEnvelope ? ` · enveloppe ${need.budgetEnvelope}` : ''}.</p>
          {needRequiresDG(need) && <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-deep"><ShieldCheck size={12} /> Validation DG requise (coût &gt; 50M FCFA).</p>}
        </Card>
      </div>

      {/* Workflow de validation */}
      <Card>
        <CardHeader title="Workflow de validation" subtitle="RRH → DAF → DRH → DG (si seuil) · SLA par étape" action={<ShieldCheck size={16} className="text-ink-400" />} />
        <ol className="space-y-2">
          {need.validations.map((v, i) => {
            const dm = DECISION_META[v.decision];
            const DIcon = dm.icon;
            return (
              <li key={i} className={cn('flex items-start gap-3 rounded-xl border px-3 py-2.5',
                v === nextStep ? 'border-amber/40 bg-amber/[0.05]' : 'border-line bg-surface2/30',
                !v.required && 'opacity-60')}>
                <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  dm.tone === 'ok' ? 'bg-ok/15 text-ok' : dm.tone === 'danger' ? 'bg-danger/15 text-danger' : dm.tone === 'amber' || dm.tone === 'warn' ? 'bg-amber/15 text-amber-deep' : 'bg-ink/[0.06] text-ink-400')}>
                  <DIcon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">{v.role} · {v.validatorName} {!v.required && <span className="ml-1 text-[10px] font-medium text-ink-400">(non requise)</span>}</p>
                  {v.comment && <p className="text-[12px] font-medium text-ink-500">{v.comment}</p>}
                  <p className="text-[10px] font-medium text-ink-400">SLA {v.slaDays} j{v.decidedAt ? ` · décidé le ${v.decidedAt}` : ''}</p>
                </div>
                <StatusPill tone={dm.tone} dot={false}>{dm.label}</StatusPill>
              </li>
            );
          })}
        </ol>
        {nextStep && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
            <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Validation', description: `${nextStep.role} a approuvé le besoin ${need.ref}` })}><CheckCircle2 size={14} /> Approuver ({nextStep.role})</Button>
            <Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Précisions', description: 'Demande de précisions envoyée au demandeur' })}>Demander précisions</Button>
            <Button variant="danger" size="sm" onClick={() => toast({ variant: 'error', title: 'Refus', description: 'Besoin refusé (motif requis)' })}><XCircle size={14} /> Refuser</Button>
          </div>
        )}
      </Card>

      {/* Calendrier + diffusion envisagée */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader title="Calendrier prévisionnel" action={<CalendarClock size={16} className="text-amber-deep" />} />
          <KV label="Prise de poste idéale" value={need.idealStartDate} />
          <KV label="Prise de poste au plus tard" value={need.latestStartDate} />
          {need.forecastStartDate && <KV label="Prévision réaliste" value={need.forecastStartDate} />}
          {need.forecastStartDate && need.forecastStartDate > need.idealStartDate && (
            <p className="mt-2 rounded-xl bg-warn/[0.06] px-3 py-2 text-[11px] font-semibold text-warn">⚠ Prévision ({need.forecastStartDate}) postérieure à la date idéale ({need.idealStartDate}) — anticiper ou accepter un préavis raccourci.</p>
          )}
        </Card>
        <Card>
          <CardHeader title="Diffusion envisagée" action={<Megaphone size={16} className="text-amber-deep" />} />
          <div className="flex flex-wrap gap-1.5">
            {need.plannedChannels.map((code) => {
              const ch = SOURCING_DEFAULTS.find((c) => c.code === code);
              return <span key={code} className="rounded-lg border border-line bg-surface2/50 px-2.5 py-1 text-[12px] font-semibold text-ink-700">{ch?.label ?? code}</span>;
            })}
          </div>
          {need.businessCase && (
            <div className="mt-3 border-t border-line pt-3">
              <p className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-deep"><Sparkles size={12} /> Business case</p>
              <p className="text-[13px] font-medium text-ink-700">{need.businessCase}</p>
            </div>
          )}
        </Card>
      </div>

      <p className="flex items-start gap-1.5 text-[10px] font-medium text-ink-400">
        <FileText size={11} className="mt-0.5 shrink-0 text-amber-deep" />
        Besoin de recrutement M5 · créé le {need.createdAt} · cohérence fourchette salariale vérifiée vs grille M3 · audit chaîné SHA-256.
      </p>
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
