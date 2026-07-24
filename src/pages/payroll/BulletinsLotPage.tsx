import { useState } from 'react';
import { Files, PlayCircle, CheckCircle2, Clock, AlertCircle, ChevronDown, Download } from 'lucide-react';
import { cn } from '../../lib/cn';

type LotStatut = 'à_générer' | 'en_cours' | 'généré' | 'erreur';

interface LotRow {
  id: string;
  client: string;
  pays: string;
  collab: number;
  statut: LotStatut;
  generatedAt?: string;
}

const LOTS: LotRow[] = [
  { id: 'l1', client: 'TechCorp Abidjan',       pays: 'CI', collab: 87,  statut: 'généré',     generatedAt: '23/07/2026 14:32' },
  { id: 'l2', client: 'OHADA Manufacturing',    pays: 'CI', collab: 245, statut: 'généré',     generatedAt: '23/07/2026 15:01' },
  { id: 'l3', client: 'PanAfrica Holding SN',   pays: 'SN', collab: 134, statut: 'à_générer' },
  { id: 'l4', client: 'Dakar Distribution',     pays: 'SN', collab: 31,  statut: 'à_générer' },
  { id: 'l5', client: 'Groupe Soleil CM',       pays: 'CM', collab: 62,  statut: 'erreur' },
  { id: 'l6', client: 'BTP Lomé Constructions', pays: 'TG', collab: 110, statut: 'à_générer' },
];

const STATUT_META: Record<LotStatut, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  à_générer: { label: 'À générer', icon: Clock,        cls: 'bg-slate-100 text-slate-600' },
  en_cours:  { label: 'En cours',  icon: Clock,        cls: 'bg-blue-100 text-blue-700' },
  généré:    { label: 'Généré',    icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  erreur:    { label: 'Erreur',    icon: AlertCircle,  cls: 'bg-rose-100 text-rose-700' },
};

const PERIODES = ['Juillet 2026', 'Juin 2026', 'Mai 2026', 'Avril 2026'];
const FLAG: Record<string, string> = { CI: '🇨🇮', SN: '🇸🇳', CM: '🇨🇲', TG: '🇹🇬' };

export function BulletinsLotPage() {
  const [periode, setPeriode]       = useState('Juillet 2026');
  const [periodeOpen, setPeriodeOpen] = useState(false);

  const àGenerer = LOTS.filter((l) => l.statut === 'à_générer' || l.statut === 'erreur');
  const generés  = LOTS.filter((l) => l.statut === 'généré');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
            Atlas Payroll
          </p>
          <h1 className="mt-1 font-display text-[32px] leading-tight tracking-tight text-ink">
            Bulletins en lot
          </h1>
          <p className="mt-1 text-[14px] font-medium text-ink-500">
            Génération groupée par client · {LOTS.reduce((s, l) => s + l.collab, 0)} collaborateurs
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPeriodeOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5 text-[13px] font-bold text-ink shadow-sm hover:border-blue-300"
          >
            {periode} <ChevronDown size={14} />
          </button>
          {periodeOpen && (
            <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
              {PERIODES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPeriode(p); setPeriodeOpen(false); }}
                  className={cn(
                    'flex w-full px-4 py-2.5 text-left text-[13px] font-semibold hover:bg-surface2',
                    p === periode ? 'text-blue-600' : 'text-ink-500',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total collaborateurs', value: LOTS.reduce((s, l) => s + l.collab, 0) },
          { label: 'Bulletins générés',    value: generés.reduce((s, l) => s + l.collab, 0) },
          { label: 'Restants',             value: àGenerer.reduce((s, l) => s + l.collab, 0) },
          { label: 'Lots en erreur',       value: LOTS.filter((l) => l.statut === 'erreur').length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{s.label}</p>
            <p className="mono mt-1 text-[28px] font-bold leading-none text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {àGenerer.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
          <div>
            <p className="text-[13px] font-bold text-blue-800">
              {àGenerer.length} lot{àGenerer.length > 1 ? 's' : ''} en attente —{' '}
              {àGenerer.reduce((s, l) => s + l.collab, 0)} collaborateurs
            </p>
            <p className="text-[12px] font-medium text-blue-600">Période : {periode}</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <PlayCircle size={15} /> Générer tous
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface shadow-sm">
        <div className="border-b border-line px-4 py-3">
          <p className="flex items-center gap-2 text-[12px] font-bold text-ink">
            <Files size={14} className="text-ink-400" /> Lots — {periode}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-line bg-surface2/40 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-center">Pays</th>
                <th className="px-4 py-3 text-center">Collaborateurs</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-left">Généré le</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {LOTS.map((l) => {
                const s = STATUT_META[l.statut];
                const StatusIcon = s.icon;
                return (
                  <tr key={l.id} className="group hover:bg-surface2/40">
                    <td className="px-4 py-3 text-[13px] font-semibold text-ink">{l.client}</td>
                    <td className="px-4 py-3 text-center text-[13px]">{FLAG[l.pays] ?? l.pays}</td>
                    <td className="mono px-4 py-3 text-center text-[13px] font-medium text-ink">{l.collab}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold', s.cls)}>
                        <StatusIcon size={10} /> {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-medium text-ink-400">
                      {l.generatedAt ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(l.statut === 'à_générer' || l.statut === 'erreur') && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-blue-100"
                        >
                          <PlayCircle size={11} /> Générer
                        </button>
                      )}
                      {l.statut === 'généré' && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold text-ink-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface2"
                        >
                          <Download size={11} /> Télécharger
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-4 py-3">
          <p className="text-[11px] font-medium text-ink-400">
            Données démo · Bulletins réels depuis <span className="mono">atlas_people.payslips</span>
          </p>
        </div>
      </div>
    </div>
  );
}
