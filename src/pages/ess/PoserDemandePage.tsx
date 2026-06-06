import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowLeftCircle, ShieldCheck, ShieldAlert, Paperclip, Check, Send } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { FormField, Select, TextInput } from '../../components/ui/FormField';
import { Switch } from '../../components/ui/controls';
import { useToast } from '../../components/ui/Toast';
import { TimeSubNav } from '../../components/m2/TimeSubNav';
import { useTimeOff } from '../../store/useTimeOff';
import { computeSelfLeaveBalance } from '../../lib/m2/selfBalance';
import { countLeaveDays } from '../../lib/m2/leaveEngine';
import { LEAVE_CATALOG, leaveTypeByCode, COUNT_UNIT_LABEL } from '../../lib/m2/leaveTypes';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';
import { useSubmitLeaveRequest } from '../../lib/ess/supabaseLive';
import { useAuth } from '../../lib/auth';
import { isBackendConfigured } from '../../lib/supabase';

const DEMO_EMP_ID = 'e1000001-0000-0000-0000-000000000002';

const SELF_ID = 'e2';
const TODAY = '2026-05-28';
// Types ouverts à la demande employé (la délégation est en E2.7 ; flux automatiques exclus)
const SELECTABLE = LEAVE_CATALOG.filter((t) => t.approvalCircuit !== 'automatic');

type Check = { status: 'ok' | 'warn' | 'block'; message: string };

export function PoserDemandePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenantId } = useAuth();
  const submitToDb = useSubmitLeaveRequest();
  const employee = employeeById(SELF_ID)!;
  const requests = useTimeOff((s) => s.requests).filter((r) => r.employeeId === SELF_ID);
  const requestLeave = useTimeOff((s) => s.requestLeave);
  const balance = useMemo(() => computeSelfLeaveBalance(employee, requests), [employee, requests]);

  const [step, setStep] = useState(1);
  const [code, setCode] = useState('CP');
  const [start, setStart] = useState('2026-06-22');
  const [end, setEnd] = useState('2026-06-26');
  const [halfStart, setHalfStart] = useState(false);
  const [halfEnd, setHalfEnd] = useState(false);
  const [reason, setReason] = useState('');
  const [hasDoc, setHasDoc] = useState(false);

  const type = leaveTypeByCode(code)!;
  const counted = useMemo(
    () => (start && end && start <= end ? countLeaveDays(start, end, type.countUnit, { countryCode: employee.countryCode, halfDayStart: halfStart, halfDayEnd: halfEnd }) : 0),
    [start, end, type.countUnit, employee.countryCode, halfStart, halfEnd],
  );
  const consumes = type.consumesPaidBalance;
  const soldeAfter = consumes ? Math.round((balance.available - counted) * 10) / 10 : balance.available;

  // ComplianceGuard (déterministe)
  const checks: Check[] = useMemo(() => {
    const out: Check[] = [];
    if (start > end) out.push({ status: 'block', message: 'La date de fin précède la date de début.' });
    if (counted <= 0 && start <= end) out.push({ status: 'block', message: 'Aucun jour décompté (week-ends / fériés uniquement).' });
    if (consumes && counted > balance.available) out.push({ status: 'block', message: `Solde insuffisant : ${counted} j demandés, ${balance.available} j disponibles.` });
    const overlap = requests.some((r) => r.status !== 'refused' && r.start <= end && r.end >= start);
    if (overlap) out.push({ status: 'block', message: 'Chevauchement avec une demande déjà posée sur cette période.' });
    const daysUntil = Math.round((Date.parse(`${start}T00:00:00`) - Date.parse(`${TODAY}T00:00:00`)) / 86_400_000);
    if (type.noticeDays > 0 && daysUntil < type.noticeDays) out.push({ status: 'warn', message: `Délai de prévenance de ${type.noticeDays} j non respecté (${daysUntil} j) — à justifier en cas d'urgence.` });
    if (type.justificationRequired && !hasDoc) out.push({ status: 'warn', message: 'Un justificatif est requis pour ce type de demande.' });
    if (out.length === 0) out.push({ status: 'ok', message: 'Demande conforme. Prête à être envoyée.' });
    return out;
  }, [start, end, counted, consumes, balance.available, requests, type, hasDoc]);

  const blocking = checks.some((c) => c.status === 'block');

  const submit = async () => {
    if (blocking) return;
    // Toujours écrire dans le store local (optimistic)
    requestLeave({
      id: `to_${Date.now()}`, employeeId: SELF_ID, code, label: type.label,
      start, end, countedDays: counted, status: 'pending', reason: reason || undefined,
      approver: employee.manager ?? 'Valentina Okou', surface: 'ess', createdAt: TODAY,
    });
    // En plus : persistance Supabase si backend configuré
    if (isBackendConfigured && tenantId) {
      try {
        await submitToDb.mutateAsync({
          tenantId, employeeId: DEMO_EMP_ID,
          leaveTypeCode: code, startDate: start, endDate: end,
          countedDays: counted, reason: reason || undefined,
        });
      } catch {
        // Echec silencieux — le store local garantit la cohérence UI
      }
    }
    toast({ variant: 'success', title: 'Demande envoyée', description: `${type.label} · ${counted} j · transmise à ${employee.manager ?? 'votre manager'} pour validation.` });
    navigate('/me/time');
  };

  const canNext = step === 1 ? !!code : step === 2 ? !blocking : true;

  return (
    <div className="animate-fade-up space-y-5">
      <TimeSubNav />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Poser une demande</h1>
        <Link to="/me/time"><Button variant="ghost" size="sm"><ArrowLeft size={14} /> Retour</Button></Link>
      </div>

      {/* Contexte "moi" — PAS un sélecteur (règle dure ESS) */}
      <Card className="border-amber/25 bg-amber/[0.04]">
        <div className="flex items-center gap-3">
          <Avatar name={employeeName(employee)} size="sm" />
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Pour</p>
            <p className="text-sm font-bold text-ink">Moi — {employeeName(employee)}</p>
          </div>
          <StatusPill tone="amber" dot={false}>Espace employé</StatusPill>
        </div>
        <p className="mt-2 text-[11px] font-medium text-ink-400">Décompte automatique des jours ouvrés (hors week-ends et jours fériés). Vous ne pouvez poser que pour vous-même.</p>
      </Card>

      {/* Stepper */}
      <div className="flex gap-2">
        {['Type', 'Dates & durée', 'Justificatif & envoi'].map((s, i) => (
          <div key={s} className={cn('flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold', step === i + 1 ? 'border-amber/40 bg-amber/12 text-amber-deep' : step > i + 1 ? 'border-ok/25 text-ok' : 'border-line text-ink-400')}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink/[0.05] text-[11px] font-bold">{step > i + 1 ? <Check size={12} /> : i + 1}</span>
            <span className="hidden sm:block">{s}</span>
          </div>
        ))}
      </div>

      {/* Étape 1 — Type */}
      {step === 1 && (
        <Card>
          <CardHeader title="Type de demande" subtitle="Choisissez la nature de votre absence" />
          <FormField label="Type" required>
            <Select value={code} onChange={(e) => setCode(e.target.value)}>
              {SELECTABLE.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
            </Select>
          </FormField>
          <div className="mt-3 rounded-xl bg-surface2 p-3 text-[12px] font-medium text-ink-700">
            <p>Décompte en <span className="font-bold">{COUNT_UNIT_LABEL[type.countUnit]}</span> · {type.consumesPaidBalance ? 'consomme le solde de congés payés' : 'ne consomme pas le solde CP'}.</p>
            <p className="mt-0.5">{type.justificationRequired ? 'Justificatif requis.' : 'Aucun justificatif requis.'} Délai de prévenance : {type.noticeDays} j. Validé par : {type.approvalCircuit === 'hr' ? 'RH' : type.approvalCircuit === 'manager_hr' ? 'manager + RH' : 'manager'}.</p>
            {type.linkedM1Event && <p className="mt-0.5 text-amber-deep">Congé lié à un événement familial — un justificatif (acte) sera demandé.</p>}
          </div>
        </Card>
      )}

      {/* Étape 2 — Dates & durée */}
      {step === 2 && (
        <Card>
          <CardHeader title="Dates et durée" subtitle="Décompte automatique" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Du" required><TextInput type="date" value={start} onChange={(e) => setStart(e.target.value)} /></FormField>
            <FormField label="Au" required><TextInput type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></FormField>
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            <Switch checked={halfStart} onChange={setHalfStart} label="Demi-journée (1er jour)" />
            <Switch checked={halfEnd} onChange={setHalfEnd} label="Demi-journée (dernier jour)" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-amber/30 bg-amber/[0.06] p-4 text-center">
              <p className="mono text-2xl font-semibold text-amber-deep">{counted} j</p>
              <p className="text-[11px] font-medium text-ink-400">jours décomptés</p>
            </div>
            <div className={cn('rounded-2xl border p-4 text-center', soldeAfter < 0 ? 'border-danger/30 bg-danger/[0.06]' : 'border-line bg-surface2')}>
              <p className={cn('mono text-2xl font-semibold', soldeAfter < 0 ? 'text-danger' : 'text-ink')}>{consumes ? `${soldeAfter} j` : '—'}</p>
              <p className="text-[11px] font-medium text-ink-400">{consumes ? 'solde après pose' : 'ne consomme pas le solde'}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {checks.map((c, i) => (
              <div key={i} className={cn('flex items-start gap-2.5 rounded-xl border p-3', c.status === 'block' ? 'border-danger/30 bg-danger/[0.06]' : c.status === 'warn' ? 'border-warn/30 bg-warn/[0.06]' : 'border-ok/25 bg-ok/[0.05]')}>
                {c.status === 'ok' ? <ShieldCheck size={16} className="mt-0.5 shrink-0 text-ok" /> : <ShieldAlert size={16} className={cn('mt-0.5 shrink-0', c.status === 'block' ? 'text-danger' : 'text-warn')} />}
                <p className={cn('text-[12px] font-semibold', c.status === 'block' ? 'text-danger' : c.status === 'warn' ? 'text-warn' : 'text-ok')}>{c.message}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Étape 3 — Justificatif & envoi */}
      {step === 3 && (
        <Card>
          <CardHeader title="Justificatif et envoi" subtitle="Dernière étape" />
          <FormField label="Motif / commentaire" hint={type.justificationRequired ? 'Recommandé.' : 'Optionnel.'}>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none focus:ring-2 focus:ring-amber/15" placeholder="Précisez si nécessaire…" />
          </FormField>
          {type.justificationRequired && (
            <Button variant={hasDoc ? 'outline' : 'outline'} size="sm" className="mt-3" onClick={() => setHasDoc((v) => !v)}>
              {hasDoc ? <><Check size={14} /> Justificatif joint</> : <><Paperclip size={14} /> Joindre un justificatif</>}
            </Button>
          )}
          <div className="mt-4 rounded-2xl border border-line bg-surface2 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Récapitulatif</p>
            <div className="mt-2 space-y-1 text-sm">
              <Row label="Type" value={type.label} />
              <Row label="Période" value={`${new Date(`${start}T00:00:00`).toLocaleDateString('fr-FR')} → ${new Date(`${end}T00:00:00`).toLocaleDateString('fr-FR')}`} />
              <Row label="Jours décomptés" value={`${counted} j`} />
              {consumes && <Row label="Solde après pose" value={`${soldeAfter} j`} />}
              <Row label="Validé par" value={employee.manager ?? 'Valentina Okou'} />
            </div>
          </div>
          {blocking && <p className="mt-3 text-[11px] font-semibold text-danger">Corrigez les points bloquants (étape 2) avant l'envoi.</p>}
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" disabled={step === 1} onClick={() => setStep((s) => s - 1)}><ArrowLeftCircle size={14} /> Précédent</Button>
        {step < 3 ? (
          <Button size="sm" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Suivant <ArrowRight size={14} /></Button>
        ) : (
          <Button size="sm" disabled={blocking} onClick={submit}><Send size={14} /> Envoyer la demande</Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="font-medium text-ink-500">{label}</span><span className="font-semibold text-ink">{value}</span></div>;
}
