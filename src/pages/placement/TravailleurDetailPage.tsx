import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import {
  ArrowLeft, Users, CheckCircle2, AlertCircle, Clock,
  Building2, MapPin, CalendarClock, FileSignature,
  BarChart2, ChevronRight, CalendarDays, Timer,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { supabase, isBackendConfigured } from '../../lib/supabase';

interface WorkerRow {
  id: string;
  nom: string;
  poste: string;
  siteClient: string;
  pays: string;
  debutMission: string;
  finMission: string;
  status: 'en_mission' | 'disponible' | 'fin_mission';
}

const MOCK_WORKERS: WorkerRow[] = [
  { id: 't1', nom: 'Kofi Mensah',        poste: 'Technicien SI',           siteClient: 'TechCorp Abidjan',        pays: 'CI', debutMission: '01/02/2026', finMission: '31/07/2026', status: 'en_mission' },
  { id: 't2', nom: 'Aminata Diallo',     poste: 'Assistante RH',           siteClient: 'OHADA Manufacturing',     pays: 'CI', debutMission: '15/01/2026', finMission: '14/07/2026', status: 'en_mission' },
  { id: 't3', nom: 'Ibrahima Sow',       poste: 'Opérateur logistique',    siteClient: 'Dakar Distribution',      pays: 'SN', debutMission: '01/03/2026', finMission: '28/02/2027', status: 'en_mission' },
  { id: 't4', nom: 'Cécile Ndoumbe',    poste: 'Comptable',               siteClient: '—',                       pays: 'CM', debutMission: '—',          finMission: '—',          status: 'disponible' },
  { id: 't5', nom: 'Youssouf Traoré',   poste: 'Magasinier',              siteClient: 'BTP Lomé Constructions',  pays: 'TG', debutMission: '01/11/2025', finMission: '30/04/2026', status: 'fin_mission' },
  { id: 't6', nom: 'Nathalie Kouamé',   poste: 'Secrétaire de direction', siteClient: 'PanAfrica Holding SN',    pays: 'SN', debutMission: '01/04/2026', finMission: '31/03/2027', status: 'en_mission' },
];

const FLAG: Record<string, string> = { CI: '🇨🇮', SN: '🇸🇳', CM: '🇨🇲', TG: '🇹🇬', BJ: '🇧🇯', BF: '🇧🇫' };

const STATUS_META: Record<WorkerRow['status'], { label: string; icon: typeof CheckCircle2; cls: string }> = {
  en_mission:  { label: 'En mission',  icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  disponible:  { label: 'Disponible',  icon: Clock,        cls: 'bg-blue-100 text-blue-700' },
  fin_mission: { label: 'Fin mission', icon: AlertCircle,  cls: 'bg-slate-100 text-slate-500' },
};

const MOCK_ACTIVITY = [
  { id: 'a1', date: '24/07/2026', label: 'Pointage semaine 30 validé',      type: 'temps' },
  { id: 'a2', date: '21/07/2026', label: 'Bulletin juin transmis',           type: 'paie' },
  { id: 'a3', date: '15/07/2026', label: 'Renouvellement CTM signé',         type: 'contrat' },
  { id: 'a4', date: '01/07/2026', label: 'Début période de mission Q3',      type: 'mission' },
];

const ACT_COLOR: Record<string, string> = {
  temps:   'bg-teal-500',
  paie:    'bg-blue-500',
  contrat: 'bg-violet-500',
  mission: 'bg-rose-500',
};

function daysUntil(dateFr: string): number | null {
  if (!dateFr || dateFr === '—') return null;
  const [d, m, y] = dateFr.split('/').map(Number);
  const target = new Date(y, m - 1, d);
  return Math.ceil((target.getTime() - Date.now()) / 86_400_000);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fmtDate(d: string | null): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export function TravailleurDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [dbWorker, setDbWorker] = useState<WorkerRow | null | 'loading'>('loading');

  useEffect(() => {
    if (!id || !supabase || !isBackendConfigured || !UUID_RE.test(id)) {
      setDbWorker(null);
      return;
    }
    supabase
      .schema('atlas_people')
      .from('workers')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDbWorker({
            id:           data.id as string,
            nom:          data.nom as string,
            poste:        (data.poste as string) ?? '—',
            siteClient:   (data.site_client as string) ?? '—',
            pays:         (data.pays as string) ?? 'CI',
            debutMission: fmtDate(data.debut_mission as string | null),
            finMission:   fmtDate(data.fin_mission as string | null),
            status:       (data.status as WorkerRow['status']) ?? 'disponible',
          });
        } else {
          setDbWorker(null);
        }
      });
  }, [id]);

  const worker = dbWorker === 'loading'
    ? MOCK_WORKERS.find((w) => w.id === id) ?? null
    : dbWorker ?? MOCK_WORKERS.find((w) => w.id === id) ?? null;

  if (!worker) return <Navigate to="/travailleurs-places" replace />;

  const s = STATUS_META[worker.status];
  const StatusIcon = s.icon;
  const remainingDays = daysUntil(worker.finMission);
  const initials = worker.nom.split(' ').map((p) => p[0]).slice(0, 2).join('');

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <Link
          to="/travailleurs-places"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-400 transition-colors hover:text-ink"
        >
          <ArrowLeft size={13} /> Travailleurs placés
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-[18px] font-bold text-rose-700 shadow-sm">
              {initials}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-600">
                Atlas People Placement
              </p>
              <h1 className="font-display text-[28px] leading-tight tracking-tight text-ink">
                {worker.nom}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold', s.cls)}>
                  <StatusIcon size={10} /> {s.label}
                </span>
                <span className="text-[12px] font-medium text-ink-400">
                  {FLAG[worker.pays] ?? worker.pays} · {worker.poste}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-1.5">
            <Building2 size={12} className="text-ink-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Site client</p>
          </div>
          <p className="mt-1 text-[16px] font-bold leading-tight text-ink">{worker.siteClient}</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={12} className="text-ink-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Début mission</p>
          </div>
          <p className="mt-1 text-[16px] font-bold leading-tight text-ink">{worker.debutMission}</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-1.5">
            <CalendarClock size={12} className="text-ink-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Fin de mission</p>
          </div>
          <p className="mt-1 text-[16px] font-bold leading-tight text-ink">{worker.finMission}</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-1.5">
            <Timer size={12} className="text-ink-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Jours restants</p>
          </div>
          {remainingDays !== null ? (
            <p className={cn(
              'mt-1 text-[20px] font-bold leading-tight',
              remainingDays < 0 ? 'text-slate-400' : remainingDays < 30 ? 'text-amber-600' : 'text-ink'
            )}>
              {remainingDays < 0 ? 'Terminé' : remainingDays}
              {remainingDays >= 0 && <span className="ml-1 text-[11px] font-medium text-ink-400">j</span>}
            </p>
          ) : (
            <p className="mt-1 text-[16px] font-bold text-ink-300">—</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Infos mission + actions */}
        <div className="space-y-4 lg:col-span-2">
          {/* Détails mission */}
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">Détails mission</p>
            <div className="space-y-2.5">
              {[
                { icon: Users,        value: worker.nom,                              label: 'Nom complet' },
                { icon: Building2,    value: worker.siteClient,                       label: 'Site client' },
                { icon: MapPin,       value: FLAG[worker.pays] ? `${FLAG[worker.pays]} ${worker.pays}` : worker.pays, label: 'Pays' },
                { icon: CalendarClock,value: `${worker.debutMission} → ${worker.finMission}`, label: 'Période' },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-2.5">
                  <row.icon size={13} className="mt-0.5 shrink-0 text-ink-300" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{row.label}</p>
                    <p className="text-[13px] font-medium text-ink-600">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Contrat de mission', to: '/contrats-mission', icon: FileSignature },
              { label: 'Administration RH',  to: '/admin-personnel',  icon: Users },
              { label: 'Rapport agence',     to: '/rapport-agence',   icon: BarChart2 },
            ].map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="group flex items-center gap-2.5 rounded-2xl border border-line bg-surface p-3.5 transition-shadow hover:shadow-md"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50">
                  <a.icon size={14} className="text-rose-600" />
                </span>
                <span className="flex-1 text-[12px] font-bold text-ink">{a.label}</span>
                <ChevronRight size={13} className="text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-500" />
              </Link>
            ))}
          </div>
        </div>

        {/* Activité */}
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-ink-400">
            Activité récente
          </p>
          <ol className="relative space-y-4 border-l border-line pl-5">
            {MOCK_ACTIVITY.map((a) => (
              <li key={a.id} className="relative">
                <span className={cn('absolute -left-[23px] flex h-3 w-3 items-center justify-center rounded-full', ACT_COLOR[a.type])} />
                <p className="text-[12px] font-semibold text-ink">{a.label}</p>
                <p className="text-[11px] font-medium text-ink-400">{a.date}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[11px] font-medium text-ink-400">
            Activité réelle depuis <span className="mono">atlas_people.audit_log</span>
          </p>
        </div>
      </div>
    </div>
  );
}
