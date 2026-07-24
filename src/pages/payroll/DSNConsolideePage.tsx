import { useState } from 'react';
import { FileCheck2, PlayCircle, CheckCircle2, Clock, AlertCircle, ChevronDown, Download } from 'lucide-react';
import { cn } from '../../lib/cn';

type DSNStatut = 'à_transmettre' | 'en_validation' | 'transmise' | 'erreur';

interface DSNRow {
  id: string;
  client: string;
  pays: string;
  collab: number;
  statut: DSNStatut;
  transmiseAt?: string;
  organisme: string;
}

const DSNS: DSNRow[] = [
  { id: 'd1', client: 'TechCorp Abidjan',       pays: 'CI', collab: 87,  statut: 'transmise',      transmiseAt: '05/07/2026',  organisme: 'CNPS Côte d\'Ivoire' },
  { id: 'd2', client: 'OHADA Manufacturing',    pays: 'CI', collab: 245, statut: 'transmise',      transmiseAt: '05/07/2026',  organisme: 'CNPS Côte d\'Ivoire' },
  { id: 'd3', client: 'PanAfrica Holding SN',   pays: 'SN', collab: 134, statut: 'à_transmettre',  organisme: 'IPRES Sénégal' },
  { id: 'd4', client: 'Dakar Distribution',     pays: 'SN', collab: 31,  statut: 'en_validation',  organisme: 'IPRES Sénégal' },
  { id: 'd5', client: 'Groupe Soleil CM',       pays: 'CM', collab: 62,  statut: 'erreur',          organisme: 'CNPS Cameroun' },
  { id: 'd6', client: 'BTP Lomé Constructions', pays: 'TG', collab: 110, statut: 'à_transmettre',  organisme: 'CNSS Togo' },
];

const STATUT_META: Record<DSNStatut, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  à_transmettre: { label: 'À transmettre',  icon: Clock,        cls: 'bg-slate-100 text-slate-600' },
  en_validation: { label: 'En validation',  icon: Clock,        cls: 'bg-amber-100 text-amber-700' },
  transmise:     { label: 'Transmise',      icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  erreur:        { label: 'Erreur',         icon: AlertCircle,  cls: 'bg-rose-100 text-rose-700' },
};

const PERIODES = ['Juin 2026', 'Mai 2026', 'Avril 2026', 'Mars 2026'];
const FLAG: Record<string, string> = { CI: '🇨🇮', SN: '🇸🇳', CM: '🇨🇲', TG: '🇹🇬' };

export function DSNConsolideePage() {
  const [periode, setPeriode]       = useState('Juin 2026');
  const [periodeOpen, setPeriodeOpen] = useState(false);

  const àTransmettre = DSNS.filter((d) => d.statut === 'à_transmettre' || d.statut === 'erreur');
  const transmises   = DSNS.filter((d) => d.statut === 'transmise');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
            Atlas Payroll
          </p>
          <h1 className="mt-1 font-display text-[32px] leading-tight tracking-tight text-ink">
            DSN consolidée
          </h1>
          <p className="mt-1 text-[14px] font-medium text-ink-500">
            Déclarations sociales multi-clients · {DSNS.length} organismes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setPeriodeOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5 text-[13px] font-bold text-ink shadow-sm hover:border-blue-300"
            >
              {periode} <ChevronDown size={14} />
            </button>
            {periodeOpen && (
              <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
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
          <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5 text-[13px] font-bold text-ink-500 shadow-sm hover:shadow">
            <Download size={14} /> Exporter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Transmises',         value: transmises.length },
          { label: 'Collab. couverts',   value: transmises.reduce((s, d) => s + d.collab, 0) },
          { label: 'En attente',         value: àTransmettre.length },
          { label: 'Erreurs',            value: DSNS.filter((d) => d.statut === 'erreur').length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{s.label}</p>
            <p className="mono mt-1 text-[28px] font-bold leading-none text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {àTransmettre.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
          <div>
            <p className="text-[13px] font-bold text-blue-800">
              {àTransmettre.length} DSN à transmettre — {àTransmettre.reduce((s, d) => s + d.collab, 0)} collaborateurs
            </p>
            <p className="text-[12px] font-medium text-blue-600">Période : {periode}</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <PlayCircle size={15} /> Transmettre toutes
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface shadow-sm">
        <div className="border-b border-line px-4 py-3">
          <p className="flex items-center gap-2 text-[12px] font-bold text-ink">
            <FileCheck2 size={14} className="text-ink-400" /> DSN par client — {periode}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-line bg-surface2/40 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-center">Pays</th>
                <th className="px-4 py-3 text-center">Collaborateurs</th>
                <th className="px-4 py-3 text-left">Organisme</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-left">Transmise le</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {DSNS.map((d) => {
                const s = STATUT_META[d.statut];
                const StatusIcon = s.icon;
                return (
                  <tr key={d.id} className="group hover:bg-surface2/40">
                    <td className="px-4 py-3 text-[13px] font-semibold text-ink">{d.client}</td>
                    <td className="px-4 py-3 text-center text-[13px]">{FLAG[d.pays] ?? d.pays}</td>
                    <td className="mono px-4 py-3 text-center text-[13px] font-medium text-ink">{d.collab}</td>
                    <td className="px-4 py-3 text-[12px] font-medium text-ink-500">{d.organisme}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold', s.cls)}>
                        <StatusIcon size={10} /> {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-medium text-ink-400">
                      {d.transmiseAt ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(d.statut === 'à_transmettre' || d.statut === 'erreur') && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-blue-100"
                        >
                          <PlayCircle size={11} /> Transmettre
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
            Données démo · DSN réelles depuis <span className="mono">atlas_people.dsn_declarations</span>
          </p>
        </div>
      </div>
    </div>
  );
}
