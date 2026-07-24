import { useState } from 'react';
import {
  Users, Search, CheckCircle2, AlertCircle, XCircle, FileSignature,
  Wallet, CalendarClock, Stethoscope,
} from 'lucide-react';
import { cn } from '../../lib/cn';

type DocStatut = 'ok' | 'expiré' | 'manquant';

interface WorkerHR {
  id: string;
  nom: string;
  poste: string;
  siteClient: string;
  contrat: DocStatut;
  fichesPaie: DocStatut;
  conges: DocStatut;
  visite: DocStatut;
}

const WORKERS: WorkerHR[] = [
  { id: 'w1', nom: 'Kofi Mensah',      poste: 'Technicien SI',          siteClient: 'TechCorp Abidjan',        contrat: 'ok',      fichesPaie: 'ok',      conges: 'ok',      visite: 'ok' },
  { id: 'w2', nom: 'Aminata Diallo',   poste: 'Assistante RH',          siteClient: 'OHADA Manufacturing',     contrat: 'ok',      fichesPaie: 'ok',      conges: 'manquant',visite: 'expiré' },
  { id: 'w3', nom: 'Ibrahima Sow',     poste: 'Opérateur logistique',   siteClient: 'Dakar Distribution',      contrat: 'ok',      fichesPaie: 'ok',      conges: 'ok',      visite: 'ok' },
  { id: 'w4', nom: 'Nathalie Kouamé',  poste: 'Secrétaire de direction',siteClient: 'PanAfrica Holding SN',    contrat: 'expiré',  fichesPaie: 'manquant',conges: 'manquant',visite: 'manquant' },
  { id: 'w5', nom: 'Youssouf Traoré',  poste: 'Magasinier',             siteClient: 'BTP Lomé Constructions',  contrat: 'expiré',  fichesPaie: 'ok',      conges: 'ok',      visite: 'expiré' },
  { id: 'w6', nom: 'Cécile Ndoumbe',   poste: 'Comptable',              siteClient: '—',                       contrat: 'manquant',fichesPaie: 'manquant',conges: 'manquant',visite: 'ok' },
];

const DOC_META: Record<DocStatut, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  ok:       { icon: CheckCircle2, cls: 'text-emerald-500', label: 'OK' },
  expiré:   { icon: AlertCircle,  cls: 'text-amber-500',   label: 'Expiré' },
  manquant: { icon: XCircle,      cls: 'text-rose-500',    label: 'Manquant' },
};

function DocChip({ statut, label }: { statut: DocStatut; label: string }) {
  const m = DOC_META[statut];
  const Icon = m.icon;
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold">
      <Icon size={13} className={m.cls} />
      <span className={cn('hidden sm:inline', statut !== 'ok' ? m.cls : 'text-ink-400')}>{label}</span>
    </span>
  );
}

function conformiteScore(w: WorkerHR): number {
  const docs = [w.contrat, w.fichesPaie, w.conges, w.visite];
  return Math.round((docs.filter((d) => d === 'ok').length / docs.length) * 100);
}

export function AdminPersonnelPlacementPage() {
  const [search, setSearch] = useState('');

  const filtered = WORKERS.filter(
    (w) =>
      !search ||
      w.nom.toLowerCase().includes(search.toLowerCase()) ||
      w.siteClient.toLowerCase().includes(search.toLowerCase()),
  );

  const complets   = WORKERS.filter((w) => conformiteScore(w) === 100).length;
  const incomplets = WORKERS.filter((w) => conformiteScore(w) < 100).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-600">
            Atlas People Placement
          </p>
          <h1 className="mt-1 font-display text-[32px] leading-tight tracking-tight text-ink">
            Administration RH
          </h1>
          <p className="mt-1 text-[14px] font-medium text-ink-500">
            Dossiers travailleurs placés · {complets} complets · {incomplets} incomplets
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Dossiers complets',     value: complets },
          { label: 'Contrats à régulariser', value: WORKERS.filter((w) => w.contrat !== 'ok').length },
          { label: 'Visites médicales',      value: WORKERS.filter((w) => w.visite !== 'ok').length },
          { label: 'Fiches de paie manquantes', value: WORKERS.filter((w) => w.fichesPaie === 'manquant').length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{s.label}</p>
            <p className="mono mt-1 text-[28px] font-bold leading-none text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search size={15} className="shrink-0 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (travailleur, site)…"
            className="flex-1 bg-transparent text-[13px] font-medium text-ink placeholder:text-ink-400 focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-line bg-surface2/40 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Travailleur</th>
                <th className="px-4 py-3 text-left">Site client</th>
                <th className="px-4 py-3 text-center">
                  <span className="flex items-center justify-center gap-1"><FileSignature size={11} /> Contrat</span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="flex items-center justify-center gap-1"><Wallet size={11} /> Fiches paie</span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="flex items-center justify-center gap-1"><CalendarClock size={11} /> Congés</span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="flex items-center justify-center gap-1"><Stethoscope size={11} /> Visite méd.</span>
                </th>
                <th className="px-4 py-3 text-center">Conformité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((w) => {
                const score = conformiteScore(w);
                return (
                  <tr key={w.id} className="group hover:bg-surface2/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700">
                          {w.nom.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                        </span>
                        <div className="leading-tight">
                          <p className="text-[13px] font-semibold text-ink">{w.nom}</p>
                          <p className="text-[11px] font-medium text-ink-400">{w.poste}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-medium text-ink-500">{w.siteClient}</td>
                    <td className="px-4 py-3 text-center"><DocChip statut={w.contrat}    label={DOC_META[w.contrat].label} /></td>
                    <td className="px-4 py-3 text-center"><DocChip statut={w.fichesPaie} label={DOC_META[w.fichesPaie].label} /></td>
                    <td className="px-4 py-3 text-center"><DocChip statut={w.conges}     label={DOC_META[w.conges].label} /></td>
                    <td className="px-4 py-3 text-center"><DocChip statut={w.visite}     label={DOC_META[w.visite].label} /></td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-surface2">
                          <div
                            className={cn('h-full rounded-full', score === 100 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-rose-500')}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className={cn('mono text-[12px] font-bold', score === 100 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600')}>
                          {score}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-line px-4 py-3">
          <p className="flex items-center gap-2 text-[11px] font-medium text-ink-400">
            <Users size={12} /> Données démo · Dossiers réels depuis <span className="mono">atlas_people.workers</span>
          </p>
        </div>
      </div>
    </div>
  );
}
