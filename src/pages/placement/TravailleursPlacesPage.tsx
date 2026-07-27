import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Building2,
  CalendarClock, CheckCircle2, AlertCircle, Clock,
  ChevronRight, FileSignature, Users, BarChart2,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuthStore } from '../../lib/auth';
import { supabase, isBackendConfigured } from '../../lib/supabase';

interface TravailleurRow {
  id: string;
  nom: string;
  poste: string;
  siteClient: string;
  pays: string;
  debutMission: string;
  finMission: string;
  status: 'en_mission' | 'disponible' | 'fin_mission';
}

const MOCK_TRAVAILLEURS: TravailleurRow[] = [
  { id: 't1', nom: 'Kofi Mensah',      poste: 'Technicien SI',     siteClient: 'TechCorp Abidjan',     pays: 'CI', debutMission: '01/02/2026', finMission: '31/07/2026', status: 'en_mission' },
  { id: 't2', nom: 'Aminata Diallo',   poste: 'Assistante RH',     siteClient: 'OHADA Manufacturing',  pays: 'CI', debutMission: '15/01/2026', finMission: '14/07/2026', status: 'en_mission' },
  { id: 't3', nom: 'Ibrahima Sow',     poste: 'Opérateur logistique', siteClient: 'Dakar Distribution', pays: 'SN', debutMission: '01/03/2026', finMission: '28/02/2027', status: 'en_mission' },
  { id: 't4', nom: 'Cécile Ndoumbe',   poste: 'Comptable',          siteClient: 'Groupe Soleil CM',    pays: 'CM', debutMission: '—',          finMission: '—',          status: 'disponible' },
  { id: 't5', nom: 'Youssouf Traoré',  poste: 'Magasinier',         siteClient: 'BTP Lomé Constructions', pays: 'TG', debutMission: '01/11/2025', finMission: '30/04/2026', status: 'fin_mission' },
  { id: 't6', nom: 'Nathalie Kouamé',  poste: 'Secrétaire de direction', siteClient: 'PanAfrica Holding SN', pays: 'SN', debutMission: '01/04/2026', finMission: '31/03/2027', status: 'en_mission' },
];

const STATUS_META: Record<TravailleurRow['status'], { label: string; icon: typeof CheckCircle2; cls: string }> = {
  en_mission:  { label: 'En mission',  icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  disponible:  { label: 'Disponible',  icon: Clock,        cls: 'bg-blue-100 text-blue-700' },
  fin_mission: { label: 'Fin mission', icon: AlertCircle,  cls: 'bg-slate-100 text-slate-500' },
};

const FLAG: Record<string, string> = { CI: '🇨🇮', SN: '🇸🇳', CM: '🇨🇲', TG: '🇹🇬', BJ: '🇧🇯', BF: '🇧🇫' };

function fmtDate(d: string | null): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function mapDbWorker(row: Record<string, unknown>): TravailleurRow {
  return {
    id:           row.id as string,
    nom:          row.nom as string,
    poste:        (row.poste as string) ?? '—',
    siteClient:   (row.site_client as string) ?? '—',
    pays:         (row.pays as string) ?? 'CI',
    debutMission: fmtDate(row.debut_mission as string | null),
    finMission:   fmtDate(row.fin_mission as string | null),
    status:       (row.status as TravailleurRow['status']) ?? 'disponible',
  };
}

export function TravailleursPlacesPage() {
  const [search, setSearch] = useState('');
  const [realWorkers, setRealWorkers] = useState<TravailleurRow[] | null>(null);
  const tenantId = useAuthStore((s) => s.tenantId);

  useEffect(() => {
    if (!supabase || !isBackendConfigured || !tenantId) return;
    supabase
      .schema('atlas_people')
      .from('workers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nom')
      .then(({ data }) => {
        if (data && data.length > 0) setRealWorkers(data.map(mapDbWorker));
      });
  }, [tenantId]);

  const displayWorkers = realWorkers ?? MOCK_TRAVAILLEURS;
  const isLive = isBackendConfigured && realWorkers !== null;

  const filtered = displayWorkers.filter((t) =>
    !search ||
    t.nom.toLowerCase().includes(search.toLowerCase()) ||
    t.siteClient.toLowerCase().includes(search.toLowerCase()) ||
    t.poste.toLowerCase().includes(search.toLowerCase())
  );

  const enMission = displayWorkers.filter((t) => t.status === 'en_mission').length;
  const disponibles = displayWorkers.filter((t) => t.status === 'disponible').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-600">
            Atlas People Placement
          </p>
          <h1 className="mt-1 font-display text-[32px] leading-tight tracking-tight text-ink">
            Travailleurs placés
          </h1>
          <p className="mt-1 text-[14px] font-medium text-ink-500">
            {enMission} en mission · {disponibles} disponibles
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-2.5 text-[13px] font-bold text-surface shadow-sm transition-shadow hover:shadow-lg"
        >
          <Plus size={15} /> Nouveau travailleur
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'En mission',    value: enMission },
          { label: 'Disponibles',   value: disponibles },
          { label: 'Fins de mission < 30 j', value: 1 },
          { label: 'Sites actifs',  value: [...new Set(displayWorkers.filter(t => t.status === 'en_mission').map(t => t.siteClient))].length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{s.label}</p>
            <p className="mono mt-1 text-[28px] font-bold leading-none text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div className="rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search size={15} className="shrink-0 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, poste, site)…"
            className="flex-1 bg-transparent text-[13px] font-medium text-ink placeholder:text-ink-400 focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface2/40 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Travailleur</th>
                <th className="px-4 py-3 text-left">Poste</th>
                <th className="px-4 py-3 text-left">Site client</th>
                <th className="px-4 py-3 text-center">Pays</th>
                <th className="px-4 py-3 text-left">Période mission</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((t) => {
                const s = STATUS_META[t.status];
                const StatusIcon = s.icon;
                return (
                  <tr key={t.id} className="group hover:bg-surface2/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[12px] font-bold text-rose-700">
                          {t.nom.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                        </span>
                        <span className="text-[13px] font-semibold text-ink">{t.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium text-ink-500">{t.poste}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink">
                        <Building2 size={12} className="text-ink-400" /> {t.siteClient}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[13px]">{FLAG[t.pays] ?? t.pays}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-500">
                        <CalendarClock size={11} className="text-ink-400" />
                        {t.debutMission} → {t.finMission}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold', s.cls)}>
                        <StatusIcon size={10} /> {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/travailleurs-places/${t.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-ink-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface2 hover:text-ink"
                      >
                        Détail <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-line px-4 py-3">
          {isLive ? (
            <p className="text-[11px] font-medium text-emerald-600">
              <CheckCircle2 size={10} className="mr-1 inline" /> Données live · <span className="mono">atlas_people.workers</span>
            </p>
          ) : (
            <p className="text-[11px] font-medium text-ink-400">
              Données démo · <span className="mono">atlas_people.workers</span>
            </p>
          )}
        </div>
      </div>
      {/* Accès rapide modules Placement */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Contrats de mission', desc: 'CTM et suivi signatures',         to: '/contrats-mission', icon: FileSignature },
          { label: 'Sites & entreprises', desc: 'Clients et sites d\'affectation',  to: '/sites-clients',    icon: Building2 },
          { label: 'Administration RH',   desc: 'Dossiers et conformité dossiers',  to: '/admin-personnel',  icon: Users },
          { label: 'Rapport agence',      desc: 'KPIs et honoraires consolidés',    to: '/rapport-agence',   icon: BarChart2 },
        ].map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-md"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <card.icon size={16} />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[13px] font-bold text-ink">{card.label}</p>
              <p className="truncate text-[11px] font-medium text-ink-400">{card.desc}</p>
            </div>
            <ChevronRight size={14} className="shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-500" />
          </Link>
        ))}
      </div>
    </div>
  );
}
