import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ShieldAlert, Send, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField, Select, TextInput } from '../../components/ui/FormField';
import { useToast } from '../../components/ui/Toast';
import { TeamTimeSubNav } from '../../components/m2/TeamTimeSubNav';
import { useSurface } from '../../store/useSurface';
import { useTimeOff } from '../../store/useTimeOff';
import { useDirectory } from '../../store/useDirectory';
import { teamMembers } from '../../lib/m2/team';
import { countLeaveDays } from '../../lib/m2/leaveEngine';
import { LEAVE_CATALOG, leaveTypeByCode } from '../../lib/m2/leaveTypes';
import { employeeName, employeeById } from '../../data/mock';
import { isBackendConfigured, useTeamDirectory, dirName } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const TODAY = new Date().toISOString().slice(0, 10);
const SELECTABLE = LEAVE_CATALOG.filter((t) => t.approvalCircuit !== 'automatic');

export function TeamAbsencePage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const employees = useDirectory((s) => s.employees);
  const requestLeave = useTimeOff((s) => s.requestLeave);
  const mockTeam = useMemo(() => teamMembers(employees), [employees]);

  const { data: ctx } = useSessionContext();
  const { data: liveDir } = useTeamDirectory(ctx?.tenantId);
  const hasLive = isBackendConfigured && Boolean(ctx?.tenantId);
  const liveTeam = liveDir ?? [];

  const [memberId, setMemberId] = useState('');
  const [code, setCode] = useState('PERM');
  const [start, setStart] = useState(TODAY);
  const [end, setEnd] = useState(TODAY);
  const [reason, setReason] = useState('');

  // Initialize memberId when team data loads
  useEffect(() => {
    if (!memberId) {
      if (hasLive && liveTeam.length > 0) setMemberId(liveTeam[0].id);
      else if (!hasLive && mockTeam.length > 0) setMemberId(mockTeam[0].id);
    }
  }, [hasLive, liveTeam, mockTeam, memberId]);

  const type = leaveTypeByCode(code)!;
  const mockMember = !hasLive ? employeeById(memberId) : undefined;
  const liveMember = hasLive ? liveTeam.find(d => d.id === memberId) : undefined;

  const memberCountryCode = mockMember?.countryCode ?? 'CI';
  const counted = start <= end ? countLeaveDays(start, end, type.countUnit, { countryCode: memberCountryCode }) : 0;
  const managerLabel = ctx?.email?.split('@')[0] ?? 'Manager';

  const submit = () => {
    const empLabel = hasLive ? (liveMember ? dirName(liveMember) : memberId) : (mockMember ? employeeName(mockMember) : memberId);
    if (!memberId) return;
    requestLeave({ id: `to_${Date.now()}`, employeeId: memberId, code, label: type.label, start, end, countedDays: counted, status: 'approved', reason: reason || undefined, approver: managerLabel, surface: 'mss', createdAt: TODAY });
    toast({ variant: 'success', title: 'Absence saisie', description: `${type.label} pour ${empLabel} — saisie par ${managerLabel}. L'employé est notifié.` });
    navigate('/team/temps');
  };

  return (
    <div className="animate-fade-up space-y-5">
      <TeamTimeSubNav />
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-ink">Saisir une absence pour un membre</h1>
        {hasLive && <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/[0.10] px-2.5 py-1 text-[11px] font-semibold text-ok"><Wifi size={12} /> Live DB</span>}
      </div>

      <Card className="border-info/25 bg-info/[0.04]">
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700">
          <ShieldAlert size={15} className="mt-0.5 shrink-0 text-info" />
          Sélecteur <span className="font-bold">limité à votre équipe</span>. Toute saisie est tracée (<span className="mono">source_surface = mss</span>, « saisie par {managerLabel} ») et notifiée à l'employé concerné, qui peut la contester.
        </p>
      </Card>

      <Card>
        <CardHeader title="Absence constatée / posée pour un membre" subtitle="Employé injoignable, terrain sans accès, etc." action={<UserPlus size={16} className="text-ink-400" />} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Membre de l'équipe" required>
            <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              {hasLive
                ? liveTeam.map((d) => <option key={d.id} value={d.id}>{dirName(d)}{d.role_title ? ` · ${d.role_title}` : ''}</option>)
                : mockTeam.map((m) => <option key={m.id} value={m.id}>{employeeName(m)} · {m.role}</option>)
              }
            </Select>
          </FormField>
          <FormField label="Type" required>
            <Select value={code} onChange={(e) => setCode(e.target.value)}>
              {SELECTABLE.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Du" required><TextInput type="date" value={start} onChange={(e) => setStart(e.target.value)} /></FormField>
          <FormField label="Au" required><TextInput type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></FormField>
        </div>
        <FormField label="Motif / contexte" className="mt-3" hint="Ex. employé injoignable, absence constatée sur le terrain.">
          <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Contexte de la saisie" />
        </FormField>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-surface2 px-3 py-2.5">
          <span className="text-sm font-medium text-ink-500">Jours décomptés</span>
          <span className="mono text-lg font-semibold text-amber-deep">{counted} j</span>
        </div>
        <Button className="mt-4" disabled={!memberId || start > end} onClick={submit}><Send size={14} /> Enregistrer l'absence</Button>
      </Card>
    </div>
  );
}
