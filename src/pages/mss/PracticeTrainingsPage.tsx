import { useEffect } from 'react';
import { GraduationCap, Sparkles, BookOpen, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { PracticeSubNav } from '../../components/mss/PracticeSubNav';
import { useSurface } from '../../store/useSurface';
import { MANAGER_TRAININGS } from '../../lib/mss/practice';
import { isBackendConfigured, empUuid, useManagerOwnPractice } from '../../lib/mss/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const TRAINING_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'info' | 'neutral'> = {
  requested: 'warn', approved: 'info', confirmed: 'info', attended: 'ok', completed: 'ok', cancelled: 'danger',
};
const TRAINING_LABEL: Record<string, string> = {
  requested: 'Demandée', approved: 'Approuvée', confirmed: 'Confirmée', attended: 'Suivie', completed: 'Terminée', cancelled: 'Annulée',
};

export function PracticeTrainingsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  const { data: ctx } = useSessionContext();
  const { data: live } = useManagerOwnPractice(ctx?.tenantId, ctx?.employeeId ?? empUuid('e1'));
  const liveTrainings = isBackendConfigured && live && live.trainings.length > 0 ? live.trainings : null;

  return (
    <div className="animate-fade-up space-y-5">
      <PracticeSubNav />
      <h1 className="text-2xl font-semibold text-ink">Mes formations manager</h1>

      {liveTrainings && (
        <Card>
          <CardHeader
            title="Mes formations"
            subtitle={`${liveTrainings.length} inscription(s) · Live DB`}
            action={<Wifi size={13} className="text-emerald-500" />}
          />
          <div className="space-y-2">
            {liveTrainings.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{t.course_title || 'Formation'}</p>
                  {t.requested_at && <p className="text-[11px] font-medium text-ink-400">Demandée le {new Date(t.requested_at).toLocaleDateString('fr-FR')}</p>}
                </div>
                <StatusPill tone={TRAINING_TONE[t.status] ?? 'neutral'} dot={false}>{TRAINING_LABEL[t.status] ?? t.status}</StatusPill>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="En cours" action={<GraduationCap size={16} className="text-ink-400" />} />
        <div className="space-y-2">
          {MANAGER_TRAININGS.inProgress.map((t) => (
            <div key={t.label} className="rounded-xl bg-surface2 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">{t.label}</span>
                <span className="mono text-[12px] font-semibold text-info">{t.progress}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-info" style={{ width: `${t.progress}%` }} /></div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="glass-amber">
        <CardHeader title="Recommandées (Proph3t, selon mon feedback)" action={<Sparkles size={16} className="text-amber-deep" />} />
        <ul className="space-y-1.5 text-sm font-medium text-ink-700">
          {MANAGER_TRAININGS.recommended.map((r) => <li key={r} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-deep" /> {r}</li>)}
        </ul>
      </Card>

      <Card>
        <p className="flex items-center gap-2 text-sm font-medium text-ink-700"><BookOpen size={15} className="text-ink-400" /> Catalogue complet management</p>
        <div className="mt-3"><Button variant="ghost" size="sm">Voir tout le catalogue management</Button></div>
      </Card>
    </div>
  );
}
