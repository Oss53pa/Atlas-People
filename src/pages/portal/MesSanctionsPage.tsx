/**
 * Mes sanctions — espace collaborateur (/espace/sanctions).
 *
 * Vue TRANSPARENTE OHADA + RGPD : l'employé voit ses propres sanctions avec :
 *   - Date, type, motif, statut (active / prescrite / contestée / annulée)
 *   - Droit de contestation (10 / 15 / 30 jours selon type)
 *   - Prescription automatique selon barème OHADA
 *   - PDF DocJourney signé téléchargeable
 *   - Compteur "actives" vs "prescrites" (effacées du dossier)
 *
 * Workflow employé :
 *   1. Notification → "Convocation à entretien préalable"
 *   2. Entretien mené par RH (date + observateur facultatif)
 *   3. Décision notifiée → apparaît ici
 *   4. Droit de réponse (bouton "Contester")
 *   5. Prescription automatique → badge "Effacée"
 *
 * RLS : l'employé ne voit QUE ses sanctions, pas celles des autres.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, FileSignature, CalendarClock, ShieldCheck, Download,
  MessageSquareWarning, ArrowLeft, Scale, Clock, CheckCircle2,
  XCircle, Sparkles, BookOpen,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { cn } from '../../lib/cn';

type SanctionType = 'observation' | 'avertissement' | 'blame' | 'mise_a_pied' | 'retrogradation';
type SanctionStatus = 'notified' | 'contested' | 'confirmed' | 'cancelled' | 'prescribed';

interface SanctionMeta {
  label: string;
  severity: 1 | 2 | 3 | 4 | 5;
  prescriptionMonths: number;
  contestationDays: number;
  description: string;
}

const TYPE_META: Record<SanctionType, SanctionMeta> = {
  observation:     { label: 'Observation orale', severity: 1, prescriptionMonths: 12, contestationDays: 7,  description: 'Rappel verbal · pas de trace formelle au dossier' },
  avertissement:   { label: 'Avertissement',     severity: 2, prescriptionMonths: 24, contestationDays: 10, description: 'Notification écrite · sans incidence salariale' },
  blame:           { label: 'Blâme',             severity: 3, prescriptionMonths: 36, contestationDays: 15, description: 'Notification formelle · noté au dossier' },
  mise_a_pied:     { label: 'Mise à pied',       severity: 4, prescriptionMonths: 60, contestationDays: 30, description: 'Suspension temporaire 1 à 8 jours · sans rémunération' },
  retrogradation:  { label: 'Rétrogradation',    severity: 5, prescriptionMonths: 999, contestationDays: 60, description: 'Changement de fonction · permanent · contestable au tribunal du travail' },
};

const STATUS_META: Record<SanctionStatus, { label: string; tone: 'warn' | 'info' | 'danger' | 'success' | 'neutral' }> = {
  notified:   { label: 'Notifiée',    tone: 'warn'   },
  contested:  { label: 'Contestée',   tone: 'info'   },
  confirmed:  { label: 'Confirmée',   tone: 'danger' },
  cancelled:  { label: 'Annulée',     tone: 'success'},
  prescribed: { label: 'Prescrite',   tone: 'neutral'},
};

interface Sanction {
  id: string;
  reference: string;
  type: SanctionType;
  status: SanctionStatus;
  notifiedAt: string;
  prescribedAt: string;
  motif: string;
  facts: string;
  decisionBy: string;
  hearingDate: string;
  documentUrl: string;
  contestationDeadline?: string;
  contestationFiledAt?: string;
}

const TODAY = new Date('2026-06-04');
const addMonths = (iso: string, m: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + m);
  return d.toISOString().slice(0, 10);
};

const RAW: Omit<Sanction, 'prescribedAt'>[] = [
  {
    id: 's-1', reference: 'SANC-2025-DEC-042',
    type: 'avertissement', status: 'notified',
    notifiedAt: '2025-12-05',
    motif: 'Retards répétés (4 retards > 30 min sur le mois de novembre 2025)',
    facts: 'Constatations établies par le pointage électronique (badges 03, 12, 19, 26 novembre). Vous avez été convoqué à un entretien préalable le 28 novembre 2025 et avez reconnu les faits sans justification médicale ou personnelle particulière.',
    decisionBy: 'Valentina Okou · DRH',
    hearingDate: '2025-11-28',
    documentUrl: '#sanc-2025-dec-042',
    contestationDeadline: '2025-12-15',
  },
  {
    id: 's-2', reference: 'SANC-2024-MAR-018',
    type: 'observation', status: 'prescribed',
    notifiedAt: '2024-03-15',
    motif: 'Oubli de signaler une absence de courte durée',
    facts: 'Absence non signalée le 12 mars 2024 (1 jour). Rappel oral effectué par le manager direct.',
    decisionBy: 'Marc-André Koné · Manager',
    hearingDate: '2024-03-14',
    documentUrl: '#sanc-2024-mar-018',
  },
];

const SANCTIONS: Sanction[] = RAW.map((s) => {
  const meta = TYPE_META[s.type];
  const prescribedAt = addMonths(s.notifiedAt, meta.prescriptionMonths);
  // Calcul prescription automatique
  const status: SanctionStatus = s.status === 'notified' && prescribedAt <= TODAY.toISOString().slice(0, 10)
    ? 'prescribed'
    : s.status;
  return { ...s, status, prescribedAt };
});

const fr = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
const daysUntil = (iso: string) => Math.ceil((new Date(`${iso}T00:00:00`).getTime() - TODAY.getTime()) / 86_400_000);

export function MesSanctionsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'prescribed'>('active');

  const filtered = useMemo(() => {
    if (filter === 'all') return SANCTIONS;
    if (filter === 'prescribed') return SANCTIONS.filter((s) => s.status === 'prescribed' || s.status === 'cancelled');
    return SANCTIONS.filter((s) => s.status !== 'prescribed' && s.status !== 'cancelled');
  }, [filter]);

  const k = useMemo(() => ({
    active: SANCTIONS.filter((s) => s.status === 'notified' || s.status === 'confirmed').length,
    contested: SANCTIONS.filter((s) => s.status === 'contested').length,
    prescribed: SANCTIONS.filter((s) => s.status === 'prescribed' || s.status === 'cancelled').length,
    total: SANCTIONS.length,
  }), []);

  return (
    <div className="animate-fade-up space-y-5">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-deep">Mon espace · Disciplinaire</p>
          <h1 className="font-display text-2xl text-ink">Mes sanctions</h1>
          <p className="mt-0.5 text-[12px] font-medium text-ink-500">
            Transparence OHADA · prescription automatique · droit de contestation garanti
          </p>
        </div>
        <Link to="/espace"><Button variant="outline" size="sm"><ArrowLeft size={13} /> Retour à l'accueil</Button></Link>
      </div>

      {/* Note pédagogique RGPD */}
      <Card className="border-info/25 bg-info/[0.04]">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-info" />
          <div>
            <p className="text-sm font-bold text-ink">Vos droits face à une sanction disciplinaire</p>
            <p className="mt-0.5 text-[12px] font-medium leading-relaxed text-ink-700">
              Vous avez le droit (<strong>art. 81 Code du travail OHADA</strong>) : (1) d'être convoqué à un entretien préalable
              avec un préavis de 5 jours ouvrés, (2) de vous faire assister par un délégué du personnel,
              (3) de contester la sanction dans les délais légaux ci-dessous, (4) d'obtenir la prescription
              automatique après les durées définies par le Code OHADA.
            </p>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Sanctions actives"   value={String(k.active)}     unit="à votre dossier" icon={AlertTriangle} tone={k.active > 0 ? 'amber' : 'default'} />
        <StatCard label="En contestation"     value={String(k.contested)}  unit="droit de réponse" icon={MessageSquareWarning} />
        <StatCard label="Prescrites"          value={String(k.prescribed)} unit="effacées du dossier" icon={CheckCircle2} />
        <StatCard label="Total historique"    value={String(k.total)}      unit="depuis embauche" icon={BookOpen} />
      </div>

      {/* Pills filtres */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          { key: 'active',     label: 'Actives',     count: k.active + k.contested },
          { key: 'prescribed', label: 'Prescrites',  count: k.prescribed },
          { key: 'all',        label: 'Toutes',      count: k.total },
        ] as const).map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setFilter(p.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors',
              filter === p.key
                ? 'bg-amber/12 text-amber-deep ring-1 ring-amber/30'
                : 'border border-line bg-surface text-ink-500 hover:text-ink'
            )}
          >
            {p.label} <span className="mono">{p.count}</span>
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <Card className="text-center">
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <CheckCircle2 size={32} className="text-emerald-500" />
            <p className="text-sm font-bold text-ink">Aucune sanction dans cette catégorie</p>
            <p className="text-[11px] font-medium text-ink-500">Votre dossier disciplinaire est à jour.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => <SanctionCard key={s.id} sanction={s} />)}
        </div>
      )}

      {/* Réf. juridique */}
      <Card>
        <CardHeader title="Barème légal des sanctions · OHADA" subtitle="Prescription automatique selon le Code du travail" action={<Scale size={16} className="text-amber-deep" />} />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-line text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="py-2 text-left">Type</th>
                <th className="py-2 text-left">Description</th>
                <th className="py-2 text-center">Délai contest.</th>
                <th className="py-2 text-right">Prescription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(Object.entries(TYPE_META) as [SanctionType, SanctionMeta][]).map(([key, m]) => (
                <tr key={key}>
                  <td className="py-2 font-semibold text-ink">{m.label}</td>
                  <td className="py-2 text-[11px] font-medium text-ink-500">{m.description}</td>
                  <td className="py-2 text-center mono text-[11px] font-bold text-ink">{m.contestationDays} j</td>
                  <td className="py-2 text-right mono text-[11px] font-bold text-ink-700">
                    {m.prescriptionMonths >= 999 ? 'Permanente' : `${m.prescriptionMonths} mois`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[10px] font-medium text-ink-500">
          <Sparkles size={10} className="-mb-0.5 mr-0.5 inline text-amber-deep" />
          Source : OHADA Code du travail uniforme · adapté Côte d'Ivoire (Loi n° 2015-532 · titre VI chapitre III).
        </p>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * SanctionCard — une sanction = une carte dépliable avec actions
 * ─────────────────────────────────────────────────────────────── */

function SanctionCard({ sanction: s }: { sanction: Sanction }) {
  const meta = TYPE_META[s.type];
  const status = STATUS_META[s.status];
  const isActive = s.status === 'notified' || s.status === 'confirmed';
  const canContest = s.status === 'notified' && s.contestationDeadline && daysUntil(s.contestationDeadline) > 0;
  const daysToPrescription = daysUntil(s.prescribedAt);

  // Indicateur visuel sévérité
  const sevStars = '◆'.repeat(meta.severity) + '◇'.repeat(5 - meta.severity);

  return (
    <Card className={cn(isActive && 'border-amber/30 bg-amber/[0.02]', s.status === 'prescribed' && 'border-line opacity-80')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            isActive ? 'bg-amber/15 text-amber-deep' :
            s.status === 'contested' ? 'bg-info/15 text-info' :
            s.status === 'cancelled' ? 'bg-emerald-500/15 text-emerald-600' :
            'bg-ink/[0.05] text-ink-500'
          )}>
            <FileSignature size={20} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-bold text-ink">{meta.label}</h3>
              <StatusPill tone={status.tone} dot>{status.label}</StatusPill>
              <span className="mono text-[10px] font-bold tracking-widest text-amber-deep">{sevStars}</span>
            </div>
            <p className="mt-0.5 mono text-[10px] font-bold text-ink-500">{s.reference}</p>
            <p className="mt-1 text-[12px] font-semibold leading-snug text-ink">{s.motif}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Notifiée le</p>
          <p className="mono text-[12px] font-bold text-ink">{fr(s.notifiedAt)}</p>
        </div>
      </div>

      {/* Faits + procédure */}
      <div className="mt-3 rounded-xl bg-surface2/40 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Faits reprochés</p>
        <p className="mt-1 text-[12px] font-medium leading-relaxed text-ink-700">{s.facts}</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-3">
          <div><span className="text-ink-400">Entretien :</span> <span className="font-semibold text-ink">{fr(s.hearingDate)}</span></div>
          <div><span className="text-ink-400">Décidée par :</span> <span className="font-semibold text-ink">{s.decisionBy}</span></div>
          <div><span className="text-ink-400">Prescription :</span> <span className="font-semibold text-ink">{fr(s.prescribedAt)}</span></div>
        </div>
      </div>

      {/* Échéances + actions */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-[11px]">
          {canContest && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-info/[0.08] px-2.5 py-1 font-semibold text-info">
              <Clock size={11} /> Contestation possible jusqu'au <strong className="mx-1">{fr(s.contestationDeadline!)}</strong> ({daysUntil(s.contestationDeadline!)} j)
            </span>
          )}
          {isActive && daysToPrescription > 0 && daysToPrescription < 365 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/[0.10] px-2.5 py-1 font-semibold text-amber-deep">
              <CalendarClock size={11} /> Prescription dans {daysToPrescription} j
            </span>
          )}
          {s.status === 'prescribed' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/[0.10] px-2.5 py-1 font-semibold text-emerald-700">
              <CheckCircle2 size={11} /> Effacée du dossier · {fr(s.prescribedAt)}
            </span>
          )}
          {s.status === 'cancelled' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/[0.10] px-2.5 py-1 font-semibold text-emerald-700">
              <XCircle size={11} /> Annulée suite à votre contestation
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {canContest && (
            <Button size="sm" variant="outline"><MessageSquareWarning size={13} /> Contester</Button>
          )}
          <Button size="sm" variant="outline"><Download size={13} /> Notification PDF</Button>
        </div>
      </div>
    </Card>
  );
}
