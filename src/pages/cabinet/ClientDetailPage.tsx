import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Globe, Users, ShieldCheck,
  CheckCircle2, AlertCircle, Clock, ChevronRight,
  ReceiptText, ExternalLink, BarChart2, Mail, MapPin,
  CalendarDays, Layers,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';
import { PRODUCT_META } from '../../app/nav';
import { MOCK_CLIENTS, FLAG, type ClientRow } from '../../data/mockClients';
import { supabase, isBackendConfigured } from '../../lib/supabase';

const STATUS_META = {
  actif:      { label: 'Actif',      icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  en_attente: { label: 'En attente', icon: Clock,        cls: 'bg-amber-100 text-amber-700' },
  suspendu:   { label: 'Suspendu',   icon: AlertCircle,  cls: 'bg-rose-100 text-rose-700' },
} as const;

const MOCK_ACTIVITY = [
  { id: 'a1', date: '23/07/2026', label: 'Paie juillet générée',              type: 'paie' },
  { id: 'a2', date: '22/07/2026', label: 'Onboarding · 2 nouveaux entrants', type: 'rh' },
  { id: 'a3', date: '18/07/2026', label: 'Évaluations Q2 clôturées',         type: 'eval' },
  { id: 'a4', date: '10/07/2026', label: 'Préfacture juin validée',           type: 'facturation' },
  { id: 'a5', date: '05/07/2026', label: 'DSN juin transmise',               type: 'dsn' },
];

const ACT_COLOR: Record<string, string> = {
  paie:       'bg-blue-500',
  rh:         'bg-emerald-500',
  eval:       'bg-violet-500',
  facturation:'bg-amber-500',
  dsn:        'bg-teal-500',
};

function confColor(n: number) {
  if (n >= 90) return 'text-emerald-600';
  if (n >= 75) return 'text-amber-600';
  return 'text-rose-600';
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tenantType } = useAuth();
  const product = PRODUCT_META[tenantType];

  const [dbClient, setDbClient] = useState<ClientRow | null | 'loading'>('loading');

  useEffect(() => {
    if (!id || !supabase || !isBackendConfigured || !UUID_RE.test(id)) {
      setDbClient(null);
      return;
    }
    supabase
      .schema('atlas_people')
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDbClient({
            id: data.id as string,
            name: data.name as string,
            pays: (data.pays as string) ?? '',
            effectif: (data.effectif as number) ?? 0,
            status: (data.status as ClientRow['status']) ?? 'actif',
            modules: (data.modules as string[]) ?? [],
            lastSync: data.updated_at ? new Date(data.updated_at as string).toLocaleDateString('fr-FR') : '—',
            contact: (data.contact as string) ?? '—',
            email: (data.email as string) ?? '—',
            secteur: (data.secteur as string) ?? '—',
            ville: (data.ville as string) ?? '—',
            depuis: (data.depuis as string) ?? '—',
            conformite: (data.conformite as number) ?? 0,
          });
        } else {
          setDbClient(null);
        }
      });
  }, [id]);

  const client = dbClient === 'loading'
    ? MOCK_CLIENTS.find((c) => c.id === id) ?? null
    : dbClient ?? MOCK_CLIENTS.find((c) => c.id === id) ?? null;

  if (!client) return <Navigate to="/clients" replace />;

  const s = STATUS_META[client.status];
  const StatusIcon = s.icon;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <Link
          to="/clients"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-400 transition-colors hover:text-ink"
        >
          <ArrowLeft size={13} /> Portefeuille clients
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface2 shadow-sm">
              <Building2 size={22} className="text-ink-400" />
            </div>
            <div>
              <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em]', product.accentClass)}>
                {product.name}
              </p>
              <h1 className="font-display text-[28px] leading-tight tracking-tight text-ink">
                {client.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold', s.cls)}>
                  <StatusIcon size={10} /> {s.label}
                </span>
                <span className="text-[12px] font-medium text-ink-400">
                  {FLAG[client.pays] ?? client.pays} · {client.ville} · {client.secteur}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Users,      label: 'Effectif géré',       value: client.effectif.toString(),          accent: '' },
          { icon: Layers,     label: 'Modules actifs',       value: client.modules.length.toString(),    accent: '' },
          { icon: ShieldCheck,label: 'Conformité RH',        value: `${client.conformite}%`,             accent: confColor(client.conformite) },
          { icon: CalendarDays,label: 'Client depuis',       value: client.depuis,                       accent: '' },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-1.5">
              <k.icon size={12} className="text-ink-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{k.label}</p>
            </div>
            <p className={cn('mt-1 text-[20px] font-bold leading-tight', k.accent || 'text-ink')}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Infos + modules */}
        <div className="space-y-4 lg:col-span-2">
          {/* Infos contact */}
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">Contact RH</p>
            <div className="space-y-2.5">
              {[
                { icon: Users,   value: client.contact },
                { icon: Mail,    value: client.email },
                { icon: MapPin,  value: `${client.ville}, ${client.pays}` },
                { icon: Globe,   value: client.secteur },
              ].map((row) => (
                <div key={row.value} className="flex items-center gap-2.5 text-[13px] font-medium text-ink-500">
                  <row.icon size={13} className="shrink-0 text-ink-300" />
                  {row.value}
                </div>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">
              Modules actifs · {client.modules.length}
            </p>
            <div className="flex flex-wrap gap-2">
              {client.modules.map((m) => (
                <span key={m} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface2 px-3 py-1.5 text-[12px] font-semibold text-ink">
                  <CheckCircle2 size={11} className="text-emerald-500" /> {m}
                </span>
              ))}
            </div>
          </div>

          {/* Accès rapide */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Préfacturation',   to: '/prefacturation',   icon: ReceiptText },
              { label: 'Interface client', to: '/interface-client', icon: ExternalLink },
              { label: 'Rapport cabinet',  to: '/rapport-cabinet',  icon: BarChart2 },
            ].map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="group flex items-center gap-2.5 rounded-2xl border border-line bg-surface p-3.5 transition-shadow hover:shadow-md"
              >
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', product.iconBg)}>
                  <a.icon size={14} className={product.accentClass} />
                </span>
                <span className="flex-1 text-[12px] font-bold text-ink">{a.label}</span>
                <ChevronRight size={13} className="text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-500" />
              </Link>
            ))}
          </div>
        </div>

        {/* Activité récente */}
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
