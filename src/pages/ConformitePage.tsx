import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldX, Clock, Scale, FileLock2 } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatusPill } from '../components/ui/StatusPill';
import { Button } from '../components/ui/Button';
import { ComplianceGuard, type ComplianceCheck } from '../lib/compliance/ComplianceGuard';
import { useAppStore } from '../store/useAppStore';
import { countryByCode } from '../data/countries';
import { cn } from '../lib/cn';

export function ConformitePage() {
  const activeCountry = useAppStore((s) => s.activeCountry);
  const country = countryByCode(activeCountry);

  const [overtime, setOvertime] = useState(18);
  const [seniority, setSeniority] = useState(40);
  const [noticeDays, setNoticeDays] = useState(30);

  const overtimeCheck = ComplianceGuard.checkOvertime({ countryCode: activeCountry, weeklyOvertimeHours: overtime });
  const dismissalCheck = ComplianceGuard.checkDismissalNotice({
    countryCode: activeCountry,
    seniorityMonths: seniority,
    noticeDaysGiven: noticeDays,
  });

  return (
    <div className="animate-fade-up space-y-6">
      <SectionHeader
        eyebrow="Bloc D · M12"
        title="Conformité & SST"
        description="La conformité comme bouclier actif : le système refuse l'infraction au droit national avant qu'elle ne soit commise."
        action={
          <>
            <Link to="/audit">
              <Button variant="outline" size="sm">
                <FileLock2 size={14} /> Journal d'audit
              </Button>
            </Link>
            <StatusPill tone="ok" dot={false}>
              {country.flag} {country.name}
            </StatusPill>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Heures supplémentaires */}
        <Card>
          <CardHeader
            title="Garde-fou — heures supplémentaires"
            subtitle="Plafond hebdomadaire légal"
            action={<Clock size={16} className="text-ink-400" />}
          />
          <label className="mb-1 flex items-center justify-between text-sm font-semibold text-ink-700">
            <span>Heures sup. demandées / semaine</span>
            <span className="mono text-amber-deep">{overtime} h</span>
          </label>
          <input
            type="range"
            min={0}
            max={30}
            value={overtime}
            onChange={(e) => setOvertime(+e.target.value)}
            className="mb-4 w-full accent-amber"
          />
          <VerdictBox check={overtimeCheck} />
        </Card>

        {/* Préavis licenciement */}
        <Card>
          <CardHeader
            title="Garde-fou — préavis de licenciement"
            subtitle="Conformité OHADA / droit national"
            action={<Scale size={16} className="text-ink-400" />}
          />
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-ink-700">
                Ancienneté <span className="mono text-ink-500">{seniority} mois</span>
              </label>
              <input type="range" min={0} max={180} value={seniority} onChange={(e) => setSeniority(+e.target.value)} className="w-full accent-amber" />
            </div>
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-ink-700">
                Préavis accordé <span className="mono text-ink-500">{noticeDays} j</span>
              </label>
              <input type="range" min={0} max={120} value={noticeDays} onChange={(e) => setNoticeDays(+e.target.value)} className="w-full accent-amber" />
            </div>
          </div>
          <VerdictBox check={dismissalCheck} />
        </Card>
      </div>

      {/* Journal des décisions */}
      <Card>
        <CardHeader
          title="Journal de conformité"
          subtitle="Traçabilité juridique chaînée (SHA-256)"
          action={<FileLock2 size={16} className="text-ink-400" />}
        />
        <div className="space-y-2">
          {[
            { action: 'Heures sup. bloquées', detail: 'Demande 22h/sem refusée — plafond légal', tone: 'danger' as const, time: 'il y a 2 h' },
            { action: 'Licenciement validé', detail: 'Préavis 90j conforme (ancienneté 11 ans)', tone: 'ok' as const, time: 'hier' },
            { action: 'Accident du travail déclaré', detail: 'Déclaration CNPS générée automatiquement', tone: 'warn' as const, time: 'il y a 3 j' },
            { action: 'Document unique mis à jour', detail: 'Évaluation des risques — atelier production', tone: 'info' as const, time: 'il y a 5 j' },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-surface2 px-4 py-3">
              <span
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  row.tone === 'danger' && 'bg-danger',
                  row.tone === 'ok' && 'bg-ok',
                  row.tone === 'warn' && 'bg-warn',
                  row.tone === 'info' && 'bg-info',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{row.action}</p>
                <p className="truncate text-[11px] font-medium text-ink-400">{row.detail}</p>
              </div>
              <span className="shrink-0 text-[11px] font-semibold text-ink-400">{row.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function VerdictBox({ check }: { check: ComplianceCheck }) {
  const blocked = check.verdict === 'block';
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border p-4',
        blocked ? 'border-danger/30 bg-danger/[0.06]' : 'border-ok/25 bg-ok/[0.06]',
      )}
    >
      {blocked ? (
        <ShieldX className="mt-0.5 shrink-0 text-danger" size={22} />
      ) : (
        <ShieldCheck className="mt-0.5 shrink-0 text-ok" size={22} />
      )}
      <div>
        <p className={cn('text-sm font-bold', blocked ? 'text-danger' : 'text-ok')}>
          {blocked ? 'Action bloquée par le système' : 'Action conforme — autorisée'}
        </p>
        <p className="mt-0.5 text-sm font-medium text-ink-700">{check.message}</p>
        {check.legalBasis && (
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            Base légale · {check.legalBasis}
          </p>
        )}
      </div>
    </div>
  );
}
