/**
 * RapportCabinetPage — vue consolidée du portefeuille.
 *
 * Alimentée par `atlas_people.rapport_cabinet_view`, qui joint pour chaque
 * client son mandat actif, sa facturation et ses portails. La vue est en
 * SECURITY INVOKER : elle ne peut pas devenir une fuite entre workspaces.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2, Users, Wallet, ShieldCheck, Loader2, AlertCircle,
  ChevronRight, Building2, FileSignature, ExternalLink,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';
import { PRODUCT_META } from '../../app/nav';
import {
  fetchRapportCabinet, formatAmount, formatDate, MANDATE_LABEL, cabinetLive,
  type RapportCabinetRow,
} from '../../lib/cabinet';

const FLAG: Record<string, string> = {
  CI: '🇨🇮', SN: '🇸🇳', CM: '🇨🇲', TG: '🇹🇬', BJ: '🇧🇯', ML: '🇲🇱',
  BF: '🇧🇫', NE: '🇳🇪', GA: '🇬🇦', CG: '🇨🇬', TD: '🇹🇩',
};

function confColor(n: number) {
  if (n >= 90) return 'text-emerald-600';
  if (n >= 75) return 'text-amber-600';
  return 'text-rose-600';
}

export function RapportCabinetPage() {
  const { tenantType } = useAuth();
  const product = PRODUCT_META[tenantType];

  const [rows, setRows] = useState<RapportCabinetRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cabinetLive) { setRows([]); return; }
    fetchRapportCabinet()
      .then(setRows)
      .catch((e) => { setError(e instanceof Error ? e.message : 'Chargement impossible'); setRows([]); });
  }, []);

  const totaux = useMemo(() => {
    const list = rows ?? [];
    return {
      clients: list.length,
      actifs: list.filter((r) => r.status === 'actif').length,
      collaborateurs: list.reduce((s, r) => s + (r.effectif ?? 0), 0),
      facture: list.reduce((s, r) => s + Number(r.total_facture ?? 0), 0),
      encaisse: list.reduce((s, r) => s + Number(r.total_encaisse ?? 0), 0),
      attente: list.reduce((s, r) => s + Number(r.total_en_attente ?? 0), 0),
      conformite: list.length
        ? Math.round(list.reduce((s, r) => s + (r.conformite ?? 0), 0) / list.length)
        : 0,
      devise: list.find((r) => r.currency)?.currency ?? 'XOF',
      pays: new Set(list.map((r) => r.pays)).size,
    };
  }, [rows]);

  if (rows === null) {
    return <div className="flex min-h-[300px] items-center justify-center"><Loader2 size={22} className="animate-spin text-ink-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em]', product.accentClass)}>{product.name}</p>
          <h1 className="font-display text-[28px] leading-tight tracking-tight text-ink">Rapport cabinet</h1>
          <p className="mt-1 text-[13px] font-medium text-ink-500">
            Vue consolidée · {totaux.clients} client(s) · {totaux.pays} pays OHADA
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] px-4 py-3">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-600" />
          <p className="text-[13px] font-medium text-rose-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Users,       label: 'Clients actifs',      value: `${totaux.actifs} / ${totaux.clients}` },
          { icon: Users,       label: 'Collaborateurs gérés', value: String(totaux.collaborateurs) },
          { icon: Wallet,      label: 'Facturé',              value: formatAmount(totaux.facture, totaux.devise) },
          { icon: ShieldCheck, label: 'Conformité moyenne',   value: `${totaux.conformite}%`, cls: confColor(totaux.conformite) },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-1.5">
              <k.icon size={12} className="text-ink-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{k.label}</p>
            </div>
            <p className={cn('mono mt-1 text-[18px] font-bold leading-tight', k.cls ?? 'text-ink')}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Encaissé</p>
          <p className="mono mt-1 text-[20px] font-bold text-emerald-800">{formatAmount(totaux.encaisse, totaux.devise)}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">En attente de règlement</p>
          <p className="mono mt-1 text-[20px] font-bold text-amber-800">{formatAmount(totaux.attente, totaux.devise)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
          <BarChart2 size={14} className="text-ink-400" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Détail par client</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-5 py-2.5 text-left">Client</th>
                <th className="px-3 py-2.5 text-left">Pays</th>
                <th className="px-3 py-2.5 text-right">Collab.</th>
                <th className="px-3 py-2.5 text-left">Mandat</th>
                <th className="px-3 py-2.5 text-right">Facturé</th>
                <th className="px-3 py-2.5 text-right">Encaissé</th>
                <th className="px-3 py-2.5 text-left">Portail</th>
                <th className="px-3 py-2.5 text-right">Conformité</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.client_id} className="border-b border-line/60 last:border-0 hover:bg-ink/[0.02]">
                  <td className="px-5 py-3">
                    <p className="text-[13px] font-bold text-ink">{r.client_name}</p>
                    <p className="text-[11px] font-medium text-ink-400">{r.prefactures_count} préfacture(s)</p>
                  </td>
                  <td className="px-3 py-3 text-[12px]">{FLAG[r.pays] ?? ''} {r.pays}</td>
                  <td className="mono px-3 py-3 text-right text-[13px] text-ink-700">{r.effectif}</td>
                  <td className="px-3 py-3">
                    {r.contract_reference ? (
                      <>
                        <p className="text-[12px] font-semibold text-ink">{r.mandate_type ? MANDATE_LABEL[r.mandate_type] : '—'}</p>
                        <p className="mono text-[10px] text-ink-400">{r.contract_reference}</p>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                        <FileSignature size={10} /> Aucun mandat
                      </span>
                    )}
                  </td>
                  <td className="mono px-3 py-3 text-right text-[13px] font-bold text-ink">
                    {formatAmount(Number(r.total_facture ?? 0), r.currency ?? totaux.devise)}
                  </td>
                  <td className="mono px-3 py-3 text-right text-[13px] text-emerald-700">
                    {formatAmount(Number(r.total_encaisse ?? 0), r.currency ?? totaux.devise)}
                  </td>
                  <td className="px-3 py-3">
                    {r.portails_actifs ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <ExternalLink size={10} /> {r.portails_actifs} actif(s)
                      </span>
                    ) : <span className="text-[11px] font-medium text-ink-400">—</span>}
                    <p className="text-[10px] font-medium text-ink-400">{formatDate(r.dernier_acces)}</p>
                  </td>
                  <td className={cn('mono px-3 py-3 text-right text-[13px] font-bold', confColor(r.conformite))}>
                    {r.conformite}%
                  </td>
                  <td className="px-5 py-3">
                    <Link to={`/clients/${r.client_id}`} className="inline-flex items-center gap-1 text-[12px] font-bold text-amber-deep hover:underline">
                      Fiche <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <Building2 size={26} className="mx-auto text-ink-300" />
                    <p className="mt-3 text-[14px] font-bold text-ink">Aucun client dans ce workspace</p>
                    <p className="mt-1 text-[12px] font-medium text-ink-400">
                      Le rapport se remplit dès le premier client enregistré.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="border-t border-line px-5 py-2.5 text-[11px] font-medium text-ink-400">
          Données réelles · <span className="mono">atlas_people.rapport_cabinet_view</span>
        </p>
      </div>
    </div>
  );
}
