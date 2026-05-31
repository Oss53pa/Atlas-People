import { useMemo, useState } from 'react';
import {
  ShieldCheck, AlertTriangle, Search, FileSearch, Lock, Activity,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import {
  AUDIT_ENTRIES, FRAUD_ALERTS, FRAUD_KIND_LABEL, auditKpis,
} from '../../lib/m5/assessments';
import type { AuditSeverity, FraudAlert } from '../../lib/m5/types';
import { cn } from '../../lib/cn';

const SEV_META: Record<AuditSeverity, { tone: 'ok' | 'amber' | 'warn' | 'danger' | 'neutral'; label: string }> = {
  INFO:     { tone: 'neutral', label: 'Info' },
  WARNING:  { tone: 'warn',    label: 'Warning' },
  CRITICAL: { tone: 'danger',  label: 'Critique' },
};

const ALERT_STATUS_META: Record<FraudAlert['status'], { tone: 'ok' | 'amber' | 'warn' | 'danger' | 'neutral'; label: string }> = {
  open:      { tone: 'danger',  label: 'Ouverte' },
  reviewing: { tone: 'amber',   label: 'En revue' },
  cleared:   { tone: 'ok',      label: 'Levée' },
  confirmed: { tone: 'danger',  label: 'Confirmée' },
};

export function AuditRecrutPage() {
  const { toast } = useToast();
  const k = useMemo(() => auditKpis(), []);
  const [q, setQ] = useState('');

  const entries = useMemo(() => AUDIT_ENTRIES.filter((e) =>
    !q || `${e.actor} ${e.action} ${e.detail}`.toLowerCase().includes(q.toLowerCase())
  ), [q]);

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Audit & anti-fraude</h1>
          <p className="text-sm font-medium text-ink-500">Chaîne SHA-256 · ~80 actions tracées · détection de patterns suspects · preuve contentieux</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Intégrité', description: 'Chaîne d\'audit M5 vérifiée — intègre' })}><ShieldCheck size={14} /> Vérifier l'intégrité</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Événements tracés" value={String(k.entries)} unit="audit log" icon={Activity} />
        <StatCard label="Alertes ouvertes" value={String(k.alertes)} unit="anti-fraude" icon={AlertTriangle} tone={k.alertes ? 'amber' : 'default'} />
        <StatCard label="Critiques" value={String(k.critiques)} unit="à traiter" icon={Lock} tone={k.critiques ? 'amber' : 'default'} />
        <StatCard label="Chaîne SHA-256" value={k.chainOk ? 'Intègre' : 'Rompue'} unit="vérifiée" icon={ShieldCheck} />
      </div>

      {/* Alertes anti-fraude */}
      <Card className="border-warn/25">
        <CardHeader title="Alertes anti-fraude" subtitle="Cooptation abusive · conflits d'intérêt · biais · doublons" action={<AlertTriangle size={16} className="text-warn" />} />
        <div className="space-y-2">
          {FRAUD_ALERTS.map((a) => {
            const sm = SEV_META[a.severity];
            const st = ALERT_STATUS_META[a.status];
            return (
              <div key={a.id} className="flex items-start gap-3 rounded-xl border border-line bg-surface2/30 px-3 py-2.5">
                <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  sm.tone === 'danger' ? 'bg-danger/15 text-danger' : sm.tone === 'warn' ? 'bg-amber/15 text-amber-deep' : 'bg-ink/[0.06] text-ink-400')}>
                  <AlertTriangle size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">{FRAUD_KIND_LABEL[a.kind]} <span className="ml-1 text-[10px] font-medium text-ink-400">· détecté le {a.detectedAt}</span></p>
                  <p className="text-[12px] font-medium text-ink-700">{a.message}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusPill tone={sm.tone} dot={false}>{sm.label}</StatusPill>
                  <StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Journal d'audit */}
      <Card inset={false}>
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
          <CardHeader title="Journal d'audit chaîné" subtitle="Chaque entrée référence le hash de la précédente (immuable)" className="mb-0" />
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 w-56 rounded-lg border border-line bg-surface2 pl-8 pr-2 text-[13px] font-medium text-ink focus:border-amber/40 focus:outline-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Horodatage</th><th className="px-3 py-2 text-left">Acteur</th>
              <th className="px-3 py-2 text-left">Action</th><th className="px-3 py-2 text-left">Détail</th>
              <th className="px-3 py-2 text-center">Sévérité</th><th className="px-3 py-2 text-right">Hash</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {entries.map((e) => {
                const sm = SEV_META[e.severity];
                return (
                  <tr key={e.id} className="text-[11px] hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 mono font-medium text-ink-700">{e.at.replace('T', ' ').slice(0, 16)}</td>
                    <td className="px-3 py-2 font-medium text-ink-700">{e.actor}</td>
                    <td className="px-3 py-2 mono font-bold text-amber-deep">{e.action}</td>
                    <td className="px-3 py-2 font-medium text-ink-500">{e.detail}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={sm.tone} dot={false}>{sm.label}</StatusPill></td>
                    <td className="px-3 py-2 text-right mono text-ink-400">{e.hash}…</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3"><Button variant="ghost" size="sm" onClick={() => toast({ variant: 'success', title: 'Export', description: 'Export audit M5 pour contrôle généré' })}><FileSearch size={14} /> Exporter pour contrôle</Button></div>
      </Card>

      <p className="text-[11px] font-medium text-ink-400">Audit M5 · chaîne SHA-256 immuable · R12 (audit chaîné) · R14 (anti-collusion cooptation) · R6 (détection biais) · conservation RGPD.</p>
    </div>
  );
}
