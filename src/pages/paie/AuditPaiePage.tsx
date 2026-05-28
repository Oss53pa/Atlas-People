import { ShieldCheck, Link2, Lock, UserCheck } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { PaieSubNav } from '../../components/paie/PaieSubNav';

const LOG = [
  { at: '2026-05-18 14:32', actor: 'Marie Samaké', action: 'payroll_input.saved', detail: 'Prime exceptionnelle T1 — Kouadio N’Guessan (150 000)', hash: '7a3f…b18e' },
  { at: '2026-05-18 11:05', actor: 'Marie Samaké', action: 'payroll_input.saved', detail: 'NDF mission Bouaké intégrée (145 000)', hash: '9c21…44af' },
  { at: '2026-05-17 16:48', actor: 'Valentina Okou', action: 'cycle.preparation_started', detail: 'Ouverture saisie cycle Mai 2026', hash: 'd0e5…1f77' },
  { at: '2026-05-17 09:12', actor: 'Système', action: 'cycle.opened', detail: 'Cycle Mai 2026 ouvert · pré-remplissage 14 collaborateurs', hash: '0000…genesis' },
];

export function AuditPaiePage() {
  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Audit & sécurité paie</h1>
        <p className="text-sm font-medium text-ink-500">Chaîne SHA-256 immuable · séparation des pouvoirs · anti-fraude (R4/R5/R15)</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Intégrité chaîne" value="OK" unit="vérifiée" icon={Link2} tone="amber" />
        <StatCard label="Événements" value={String(LOG.length)} unit="ce cycle" icon={ShieldCheck} />
        <StatCard label="4-eyes" value="100" unit="% conformes" icon={UserCheck} />
        <StatCard label="Cycle clôturé" value="0" unit="modifiable" icon={Lock} />
      </div>

      <Card>
        <CardHeader title="Intégrité de la chaîne d'audit" subtitle="hash(n) = SHA-256(hash(n-1) || payload)" action={<StatusPill tone="ok" dot={false}>Chaîne intègre</StatusPill>} />
        <p className="text-[12px] font-medium text-ink-500">Toute tentative de modification d'une entrée passée casse la chaîne et déclenche une alerte critique (DRH + RSI + Compliance). Dernière vérification : aujourd'hui, aucune rupture détectée.</p>
      </Card>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Journal d'audit paie" className="mb-0" /></div>
        <div className="divide-y divide-line">
          {LOG.map((l) => (
            <div key={l.hash} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 text-ink-400"><ShieldCheck size={14} /></span>
              <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink"><span className="mono text-[11px] text-amber-deep">{l.action}</span> · {l.detail}</p><p className="text-[11px] font-medium text-ink-400">{l.at} · {l.actor}</p></div>
              <span className="mono text-[11px] font-semibold text-ink-400">#{l.hash}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
