import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, ShieldX, FileLock2, Link2 } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatusPill } from '../components/ui/StatusPill';
import { Button } from '../components/ui/Button';
import { DataTable, type Column } from '../components/ui/DataTable';
import { SkeletonLoader } from '../components/ui/feedback';
import { chainHash, verifyChain, GENESIS_HASH, type AuditEvent } from '../lib/audit';
import { cn } from '../lib/cn';

type Row = AuditEvent & { id: string };

const ACTION_LABEL: Record<string, string> = {
  salary_change: 'Modification de salaire',
  rib_change: 'Modification RIB / Mobile Money',
  payroll_post_fna: 'Déversement comptable Atlas FNA',
  disciplinary_action: 'Action disciplinaire',
  dismissal_notice: 'Vérification préavis licenciement',
  document_access: 'Accès document confidentiel',
  role_change: 'Changement de rôle',
  mobility: 'Mobilité interne',
};

// Opérations sensibles (brut, non encore chaîné).
const RAW = [
  { action: 'salary_change', actorId: 'Valentina Okou', entity: 'employee', entityId: 'e1', at: '2026-05-26 14:12' },
  { action: 'rib_change', actorId: 'Valentina Okou', entity: 'employee', entityId: 'e2', at: '2026-05-26 15:40' },
  { action: 'payroll_post_fna', actorId: 'système', entity: 'payroll_run', entityId: 'run-2026-05-CI', at: '2026-05-27 08:05' },
  { action: 'dismissal_notice', actorId: 'Fatou Diop', entity: 'employee', entityId: 'e13', at: '2026-05-27 09:22' },
  { action: 'document_access', actorId: 'Valentina Okou', entity: 'document', entityId: 'doc-441', at: '2026-05-27 10:01' },
  { action: 'role_change', actorId: 'Valentina Okou', entity: 'employee', entityId: 'e7', at: '2026-05-27 10:30' },
  { action: 'mobility', actorId: 'Fatou Diop', entity: 'employee', entityId: 'e10', at: '2026-05-27 11:15' },
];

async function buildChain(): Promise<Row[]> {
  let prev = GENESIS_HASH;
  const out: Row[] = [];
  for (let i = 0; i < RAW.length; i++) {
    // On hashe EXACTEMENT la ligne sans son propre hash (ce que verifyChain reconstruit).
    const row = { ...RAW[i], previousHash: prev, id: String(i) };
    const hash = await chainHash(prev, row);
    out.push({ ...row, hash });
    prev = hash;
  }
  return out;
}

export function JournalAuditPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [result, setResult] = useState<{ ok: boolean; tampered?: number } | null>(null);

  useEffect(() => {
    buildChain().then(setRows);
  }, []);

  const verify = async () => {
    if (!rows) return;
    const ok = await verifyChain(rows);
    setResult({ ok });
  };

  const simulateTamper = async () => {
    if (!rows) return;
    const idx = 2; // on altère la 3e écriture
    const tampered: Row[] = rows.map((r, i) => (i === idx ? { ...r, actorId: 'inconnu (altéré)' } : r));
    const ok = await verifyChain(tampered);
    setResult({ ok, tampered: idx });
  };

  const columns: Column<Row>[] = [
    { key: 'at', header: 'Horodatage', sortable: true, render: (r) => <span className="mono text-[12px] text-ink-500">{r.at}</span> },
    { key: 'actorId', header: 'Acteur', render: (r) => <span className="text-sm font-semibold text-ink">{r.actorId}</span> },
    { key: 'action', header: 'Action', render: (r) => <span className="text-sm font-medium text-ink-700">{ACTION_LABEL[r.action] ?? r.action}</span> },
    { key: 'entityId', header: 'Entité', render: (r) => <span className="mono text-[11px] text-ink-500">{r.entity}/{r.entityId}</span> },
    { key: 'hash', header: 'Hash chaîné', align: 'right', render: (r) => <span className="mono text-[11px] text-amber-deep" title={`prev: ${r.previousHash.slice(0, 12)}…`}>{r.hash.slice(0, 14)}…</span> },
  ];

  return (
    <div className="animate-fade-up space-y-6">
      <Link to="/conformite" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink">
        <ArrowLeft size={15} /> Conformité
      </Link>

      <SectionHeader
        eyebrow="M1 · P1.14 — DRH"
        title="Journal d'audit"
        description="Traçabilité non répudiable des opérations sensibles. Chaque écriture porte le hash SHA-256 de la précédente — toute altération rompt la chaîne."
        action={
          <>
            <Button variant="outline" size="sm" onClick={simulateTamper}>Simuler une altération</Button>
            <Button size="sm" onClick={verify}><Link2 size={14} /> Vérifier la chaîne</Button>
          </>
        }
      />

      {result && (
        <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3', result.ok ? 'border-ok/25 bg-ok/[0.06]' : 'border-danger/30 bg-danger/[0.06]')}>
          {result.ok ? <ShieldCheck className="text-ok" size={20} /> : <ShieldX className="text-danger" size={20} />}
          <div>
            <p className={cn('text-sm font-semibold', result.ok ? 'text-ok' : 'text-danger')}>
              {result.ok ? 'Chaîne intègre — aucune altération détectée' : `Rupture de chaîne détectée à l'écriture #${(result.tampered ?? 0) + 1}`}
            </p>
            <p className="text-[11px] font-medium text-ink-500">
              {result.ok ? 'Les hash recalculés correspondent.' : 'Le hash recalculé ne correspond plus — opération falsifiée ou supprimée.'}
            </p>
          </div>
        </div>
      )}

      <Card inset={false}>
        <div className="p-5 pb-2">
          <CardHeader title="Opérations sensibles" subtitle="Journal chaîné SHA-256" className="mb-0" action={<FileLock2 size={16} className="text-ink-400" />} />
        </div>
        {rows ? (
          <DataTable columns={columns} rows={rows} gridTemplate="1fr 1.2fr 1.6fr 1.2fr 1.2fr" />
        ) : (
          <div className="p-5"><SkeletonLoader rows={6} /></div>
        )}
        <div className="flex items-center gap-2 border-t border-line px-5 py-3 text-[11px] font-medium text-ink-400">
          <StatusPill tone="neutral" dot={false}>Genesis</StatusPill>
          <span className="mono">{GENESIS_HASH.slice(0, 16)}…</span>
        </div>
      </Card>
    </div>
  );
}
