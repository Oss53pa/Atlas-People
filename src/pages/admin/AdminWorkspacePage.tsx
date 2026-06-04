/**
 * Admin Atlas Studio Console — /admin (HORS AppLayout).
 *
 * Workspace de l'administrateur de l'application qui accède DEPUIS Atlas Studio
 * (méta-app), pas depuis Atlas People directement.
 *
 * Sections :
 *   1. Setup entreprise (tenant config : raison sociale, pays, régime, devise…)
 *   2. Utilisateurs (création + rôles + accès aux espaces)
 *   3. Paramètres app (devises, langues, OHADA, RGPD, sécurité)
 *   4. Audit & sécurité (logs SHA-256, sessions actives, MFA)
 *
 * Bouton large "Ouvrir Atlas People →" pour lancer le SIRH après setup.
 *
 * Style Atlas Studio : palette neutre + accent teal/ink (différenciation visuelle
 * volontaire avec Atlas People amber-deep pour signaler que c'est une couche au-dessus).
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings2, Users, Building2, Shield, ScrollText, ArrowRight,
  Plus, Search, MoreVertical, CheckCircle2, AlertCircle,
  ExternalLink, ChevronRight, Lock, Globe, Coins, FileText,
  Key, ChevronDown, Inbox, Home, LayoutGrid, Compass,
} from 'lucide-react';
import { cn } from '../../lib/cn';

type AdminTab = 'tenant' | 'users' | 'settings' | 'security';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'drh' | 'hr_agent' | 'manager' | 'employee' | 'payroll' | 'compliance';
  spaces: string[];
  status: 'active' | 'invited' | 'suspended';
  lastSeen?: string;
  mfa: boolean;
}

const ROLE_META: Record<UserRow['role'], { label: string; color: string }> = {
  admin:      { label: 'Admin Atlas',   color: 'bg-rose-100 text-rose-700' },
  drh:        { label: 'DRH',           color: 'bg-amber-100 text-amber-700' },
  hr_agent:   { label: 'Agent HR',      color: 'bg-blue-100 text-blue-700' },
  payroll:    { label: 'Paie',          color: 'bg-violet-100 text-violet-700' },
  compliance: { label: 'Conformité',    color: 'bg-emerald-100 text-emerald-700' },
  manager:    { label: 'Manager',       color: 'bg-indigo-100 text-indigo-700' },
  employee:   { label: 'Collaborateur', color: 'bg-slate-100 text-slate-700' },
};

const USERS: UserRow[] = [
  { id: 'u1', name: 'Valentina Okou',    email: 'valentina@atlasdemo.ci',  role: 'drh',        spaces: ['Back-office', 'MSS', 'ESS'], status: 'active',    lastSeen: 'il y a 12 min', mfa: true },
  { id: 'u2', name: 'Mariam Touré',      email: 'mariam@atlasdemo.ci',     role: 'hr_agent',   spaces: ['Back-office', 'ESS'],         status: 'active',    lastSeen: 'il y a 2 h',    mfa: true },
  { id: 'u3', name: 'Pamela Atokouna',   email: 'admin@atlasstudio.org',   role: 'admin',      spaces: ['Atlas Studio', 'Tous'],       status: 'active',    lastSeen: 'maintenant',    mfa: true },
  { id: 'u4', name: 'Jean-Baptiste Koffi', email: 'jb.koffi@atlasdemo.ci', role: 'manager',    spaces: ['MSS', 'ESS'],                  status: 'active',    lastSeen: 'il y a 1 j',    mfa: false },
  { id: 'u5', name: 'Sékou Camara',      email: 'sekou@atlasdemo.ci',      role: 'payroll',    spaces: ['Back-office', 'ESS'],         status: 'active',    lastSeen: 'il y a 3 h',    mfa: true },
  { id: 'u6', name: 'Marie-Claude Ouattara', email: 'mc.ouattara@atlasdemo.ci', role: 'compliance', spaces: ['Back-office', 'ESS'],   status: 'active',    lastSeen: 'il y a 6 h',    mfa: true },
  { id: 'u7', name: 'Aïcha Diop',         email: 'aicha.diop@atlasdemo.ci',role: 'employee',   spaces: ['ESS'],                         status: 'active',    lastSeen: 'il y a 30 min', mfa: false },
  { id: 'u8', name: 'Fatou Diallo',       email: 'fatou.d@atlasdemo.ci',   role: 'employee',   spaces: ['ESS'],                         status: 'invited',   mfa: false },
];

const STATUS_META: Record<UserRow['status'], { label: string; tone: string }> = {
  active:    { label: 'Actif',    tone: 'bg-emerald-100 text-emerald-700' },
  invited:   { label: 'Invité',   tone: 'bg-amber-100 text-amber-700' },
  suspended: { label: 'Suspendu', tone: 'bg-rose-100 text-rose-700' },
};

const TABS: { key: AdminTab; label: string; icon: typeof Building2 }[] = [
  { key: 'tenant',   label: 'Entreprise',        icon: Building2 },
  { key: 'users',    label: 'Utilisateurs',      icon: Users },
  { key: 'settings', label: 'Paramètres app',    icon: Settings2 },
  { key: 'security', label: 'Sécurité & audit',  icon: Shield },
];

interface Workspace {
  key: string;
  to: string;
  label: string;
  sub: string;
  icon: typeof Building2;
  external?: boolean; // hors AppLayout (page meta)
}
const WORKSPACES: Workspace[] = [
  { key: 'admin',   to: '/admin',    label: 'Console Admin',    sub: 'Atlas Studio · vous êtes ici',   icon: Settings2, external: true  },
  { key: 'app',     to: '/',         label: 'Atlas People',     sub: 'Le SIRH · sidebar + 14 modules', icon: LayoutGrid                    },
  { key: 'cockpit', to: '/cockpit-360', label: 'Cockpit DRH 360°', sub: 'Vue synthèse 8 onglets',     icon: Compass                       },
  { key: 'queue',   to: '/hr/queue', label: 'File d\'attente',  sub: 'Back-office agent HR + DRH',      icon: Inbox                         },
  { key: 'welcome', to: '/accueil',  label: 'Démo accueil',     sub: 'Welcome cockpit hors-app',        icon: Home,      external: true     },
  { key: 'landing', to: '/landing',  label: 'Landing publique', sub: 'Page commerciale',                icon: ExternalLink, external: true  },
];

export function AdminWorkspacePage() {
  const [tab, setTab] = useState<AdminTab>('users');
  const [search, setSearch] = useState('');
  const [wsOpen, setWsOpen] = useState(false);
  const wsRef = useRef<HTMLDivElement>(null);

  // Click outside → close workspaces dropdown
  useEffect(() => {
    if (!wsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) setWsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [wsOpen]);

  const filtered = USERS.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ───────── Header Atlas Studio Console ───────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-slate-900 text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3.5">
          <Link to="/admin" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 ring-1 ring-teal-400/40">
              <Settings2 size={16} />
            </span>
            <div>
              <p className="font-display text-[18px] leading-none text-white">Atlas Studio</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] leading-tight text-teal-300">Console Admin</p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {/* Workspace switcher dropdown */}
            <div className="relative" ref={wsRef}>
              <button
                type="button"
                onClick={() => setWsOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={wsOpen}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-bold transition-colors',
                  wsOpen
                    ? 'border-teal-400/60 bg-teal-500/15 text-teal-200'
                    : 'border-white/15 bg-white/[0.06] text-white/80 hover:border-teal-400/40 hover:bg-white/[0.10] hover:text-white'
                )}
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Workspaces</span>
                <ChevronDown size={12} className={cn('transition-transform', wsOpen && 'rotate-180')} />
              </button>
              {wsOpen && (
                <div role="menu" className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5">
                  <p className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Workspaces Atlas People
                  </p>
                  <ul className="divide-y divide-slate-100">
                    {WORKSPACES.map((w) => {
                      const Icon = w.icon;
                      const isCurrent = w.key === 'admin';
                      return (
                        <li key={w.key}>
                          <Link
                            to={w.to}
                            onClick={() => setWsOpen(false)}
                            className={cn(
                              'flex items-start gap-3 px-4 py-3 transition-colors',
                              isCurrent ? 'bg-teal-50' : 'hover:bg-slate-50'
                            )}
                          >
                            <span className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                              isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                            )}>
                              <Icon size={16} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={cn('text-[13px] font-bold', isCurrent ? 'text-teal-900' : 'text-slate-900')}>
                                  {w.label}
                                </span>
                                {w.external && !isCurrent && (
                                  <ExternalLink size={10} className="text-slate-400" />
                                )}
                                {isCurrent && (
                                  <span className="rounded-full bg-teal-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">Actif</span>
                                )}
                              </div>
                              <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{w.sub}</p>
                            </div>
                            {!isCurrent && <ChevronRight size={13} className="mt-2 shrink-0 text-slate-400" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5">
                    <p className="text-[10px] font-medium leading-relaxed text-slate-500">
                      Le rôle admin est attribué via le compte tenant <strong>depuis Atlas Studio</strong>.
                      Vous accédez ici aux autres espaces de l'application.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1 text-[11px] font-semibold text-white/80 ring-1 ring-white/10">
              <Globe size={11} /> Tenant <strong className="ml-0.5 text-white">atlas-demo</strong>
            </span>
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30 md:inline-flex">
              <CheckCircle2 size={11} /> Système OK
            </span>
            <div className="hidden h-6 w-px bg-white/10 sm:block" />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-3.5 py-1.5 text-[12px] font-bold text-white shadow-sm transition-shadow hover:shadow-lg"
            >
              <ExternalLink size={13} /> Ouvrir Atlas People
            </Link>
          </div>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-12">
        <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-700">Atlas Studio · Console méta-admin</p>
            <h1 className="mt-2 font-display text-[44px] leading-tight tracking-tight text-slate-900 sm:text-[56px]">
              Configurer votre <span className="text-teal-700">SIRH Atlas People</span>
            </h1>
            <p className="mt-4 max-w-2xl text-[14px] font-medium leading-relaxed text-slate-600">
              Créez et gérez les comptes utilisateurs, configurez l'entreprise pilote,
              ajustez les paramètres OHADA · SYSCOHADA, surveillez la sécurité et l'audit.
              L'admin Atlas Studio accède aux contrôles méta — Atlas People démarre lorsque le setup est validé.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-[14px] font-bold text-white shadow-sm transition-shadow hover:shadow-lg"
              >
                <ArrowRight size={16} /> Lancer Atlas People
              </Link>
              <button
                type="button"
                onClick={() => setTab('users')}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-[14px] font-bold text-slate-900 transition-colors hover:border-teal-500/40 hover:bg-teal-50/40"
              >
                <Plus size={14} /> Créer un utilisateur
              </button>
            </div>
          </div>
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Statut global</p>
            <div className="grid grid-cols-2 gap-3">
              <SmallStat label="Utilisateurs" value={USERS.filter((u) => u.status === 'active').length} unit={`/ ${USERS.length}`} />
              <SmallStat label="Invitations" value={USERS.filter((u) => u.status === 'invited').length} unit="en attente" />
              <SmallStat label="MFA activé" value={USERS.filter((u) => u.mfa).length} unit={`/ ${USERS.length}`} tone="success" />
              <SmallStat label="Sessions live" value={4} unit="actives" />
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Tabs ───────── */}
      <section className="mx-auto max-w-7xl px-6">
        <nav className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors',
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </nav>
      </section>

      {/* ───────── Tab panels ───────── */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        {tab === 'tenant' && <TenantPanel />}
        {tab === 'users' && (
          <UsersPanel
            users={filtered}
            search={search}
            onSearch={setSearch}
          />
        )}
        {tab === 'settings' && <SettingsPanel />}
        {tab === 'security' && <SecurityPanel />}
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6">
          <p className="text-[11px] font-medium text-slate-500">
            Atlas Studio · Console méta-admin · OHADA 17 États · Données chiffrées au repos &amp; en transit
          </p>
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <Link to="/landing" className="inline-flex items-center gap-1 text-slate-500 hover:text-teal-700"><ExternalLink size={11} /> Landing publique</Link>
            <span className="text-slate-300">·</span>
            <Link to="/accueil" className="inline-flex items-center gap-1 text-slate-500 hover:text-teal-700"><ExternalLink size={11} /> Démo accueil</Link>
            <span className="text-slate-300">·</span>
            <Link to="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-teal-700">
              <ExternalLink size={11} /> Atlas People
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
 * Panneaux
 * ────────────────────────────────────────────────────────────────── */

function TenantPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <PanelCard title="Identité de l'entreprise" subtitle="Données SYSCOHADA · OHADA · pour bulletins, contrats, déclarations" icon={Building2}>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ['Raison sociale', 'Atlas Démo SARL'],
            ['Pays / Régime', 'Côte d\'Ivoire · UEMOA / OHADA'],
            ['Devise', 'FCFA — XOF'],
            ['NIF / Numéro CI', '24-0817-A'],
            ['CNPS', '230-5188-44'],
            ['Adresse siège', 'Cocody · Riviera 3 · Abidjan'],
            ['Convention collective', 'Commerce CCI-CI'],
            ['Effectif déclaré', '14 collaborateurs'],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 px-3 py-2.5">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k}</dt>
              <dd className="mt-0.5 text-[13px] font-semibold text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
      </PanelCard>
      <PanelCard title="Activation modules" subtitle="14 modules disponibles" icon={CheckCircle2}>
        <ul className="space-y-1.5">
          {['M1 Collaborateurs', 'M2 Temps & absences', 'M3 Paie déterministe', 'M4 Frais', 'M5 Recrutement', 'M6 Onboarding', 'M7 OKR', 'M8 Évaluations', 'M9 Compétences', 'M10 Carrières', 'M11 Formation', 'M12 Conformité', 'M13 Cockpit DRH', 'Self-service ESS'].map((m, i) => (
            <li key={m} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5">
              <span className="text-[12px] font-semibold text-slate-700">{m}</span>
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', i < 12 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                {i < 12 ? <><CheckCircle2 size={10} /> Activé</> : <><AlertCircle size={10} /> Bêta</>}
              </span>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  );
}

interface UsersPanelProps { users: UserRow[]; search: string; onSearch: (s: string) => void }

function UsersPanel({ users, search, onSearch }: UsersPanelProps) {
  return (
    <PanelCard
      title="Utilisateurs Atlas People"
      subtitle={`${users.length} comptes · MFA activé sur ${users.filter((u) => u.mfa).length}`}
      icon={Users}
      action={
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-1.5 text-[12px] font-bold text-white shadow-sm transition-shadow hover:shadow-lg"
        >
          <Plus size={13} /> Nouvel utilisateur
        </button>
      }
    >
      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Rechercher un utilisateur (nom, email)…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2.5 text-left">Utilisateur</th>
              <th className="px-3 py-2.5 text-left">Rôle</th>
              <th className="px-3 py-2.5 text-left">Espaces autorisés</th>
              <th className="px-3 py-2.5 text-center">MFA</th>
              <th className="px-3 py-2.5 text-center">Statut</th>
              <th className="px-3 py-2.5 text-left">Dernière session</th>
              <th className="px-3 py-2.5 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/60">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-700">
                      {u.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-900">{u.name}</p>
                      <p className="mono truncate text-[10px] font-medium text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <span className={cn('inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold', ROLE_META[u.role].color)}>
                    {ROLE_META[u.role].label}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {u.spaces.map((s) => (
                      <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  {u.mfa ? <Lock size={13} className="mx-auto text-emerald-600" /> : <Lock size={13} className="mx-auto text-slate-300" />}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold', STATUS_META[u.status].tone)}>
                    {STATUS_META[u.status].label}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-[11px] font-medium text-slate-500">{u.lastSeen ?? '—'}</td>
                <td className="px-3 py-2.5 text-right">
                  <button type="button" aria-label="Plus d'actions" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                    <MoreVertical size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PanelCard>
  );
}

function SettingsPanel() {
  const settings = [
    { icon: Globe,    title: 'Pays & Régimes',    desc: 'Côte d\'Ivoire · Sénégal · Cameroun · 14 régimes OHADA UEMOA + CEMAC', cta: 'Configurer' },
    { icon: Coins,    title: 'Devise & Format',   desc: 'FCFA XOF · format français · pas de décimale pour les francs CFA',     cta: 'Modifier' },
    { icon: FileText, title: 'Modèles documents', desc: 'Bulletins de paie · contrats · attestations · avenants · sortie',      cta: 'Éditer' },
    { icon: Key,      title: 'Clés API & SSO',    desc: 'Atlas Studio Core SSO · Supabase keys · webhooks · OAuth2',             cta: 'Gérer' },
    { icon: Shield,   title: 'RGPD & DPO',        desc: 'Politique conservation · droit accès · droit oubli · DPO contact',     cta: 'Réglages' },
    { icon: Settings2,title: 'Préférences UI',    desc: 'Thème · langues · accessibilité · notifications par défaut',            cta: 'Personnaliser' },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {settings.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-200/60">
              <Icon size={18} />
            </span>
            <h3 className="mt-3 text-[14px] font-bold text-slate-900">{s.title}</h3>
            <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-500">{s.desc}</p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold text-teal-700 hover:text-teal-900"
            >
              {s.cta} <ChevronRight size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SecurityPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <PanelCard title="Audit chain SHA-256" subtitle="Journal d'événements chaîné — 9 modules" icon={ScrollText}>
        <ul className="space-y-1.5 text-[12px]">
          {[
            { time: '14:32', actor: 'Pamela Atokouna', action: 'Création utilisateur Fatou Diallo · espace ESS', mod: 'admin' },
            { time: '14:25', actor: 'Valentina Okou',  action: 'Approbation note de frais 412 850 FCFA', mod: 'M4' },
            { time: '13:58', actor: 'Mariam Touré',    action: 'Validation PDC-2026-003 · signature ADVIST', mod: 'M9' },
            { time: '13:42', actor: 'Sékou Camara',    action: 'Clôture cycle paie avril 2026 · 14 bulletins', mod: 'M3' },
            { time: '13:15', actor: 'Système',         action: 'Détection P5_DOUBLES_PAIEMENTS — INV-2026-0044', mod: 'M11' },
            { time: '12:50', actor: 'Valentina Okou',  action: 'Connexion · MFA TOTP · IP 196.x.x.x · Abidjan', mod: 'auth' },
          ].map((e, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2">
              <span className="mono mt-0.5 shrink-0 text-[11px] font-bold text-slate-500">{e.time}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{e.action}</p>
                <p className="text-[10px] font-medium text-slate-500">{e.actor} · <span className="mono">{e.mod}</span></p>
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>
      <PanelCard title="Sécurité du tenant" subtitle="Posture globale" icon={Shield}>
        <div className="space-y-3 text-[12px]">
          <SecRow icon={Lock} label="MFA collaborateurs" value="6 / 8" tone="warn" />
          <SecRow icon={Lock} label="MFA admins/DRH" value="3 / 3" tone="success" />
          <SecRow icon={Key} label="Rotation clés API" value="Q-1 (à faire)" tone="warn" />
          <SecRow icon={Shield} label="RGPD conformité" value="100 %" tone="success" />
          <SecRow icon={ScrollText} label="Audit chain valide" value="✓ vérifiée" tone="success" />
        </div>
      </PanelCard>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
 * Sub-components
 * ────────────────────────────────────────────────────────────────── */

interface SmallStatProps { label: string; value: number | string; unit: string; tone?: 'default' | 'success' }
function SmallStat({ label, value, unit, tone = 'default' }: SmallStatProps) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn('mono text-[20px] font-bold leading-none', tone === 'success' ? 'text-emerald-700' : 'text-slate-900')}>{value}</span>
        <span className="text-[10px] font-medium text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

interface PanelCardProps { title: string; subtitle?: string; icon: typeof Building2; children: React.ReactNode; action?: React.ReactNode }
function PanelCard({ title, subtitle, icon: Icon, children, action }: PanelCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-200/60">
            <Icon size={18} />
          </span>
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-[11px] font-medium text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

interface SecRowProps { icon: typeof Lock; label: string; value: string; tone: 'success' | 'warn' | 'danger' }
function SecRow({ icon: Icon, label, value, tone }: SecRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
      <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
        <Icon size={13} className={tone === 'success' ? 'text-emerald-600' : tone === 'warn' ? 'text-amber-600' : 'text-rose-600'} />
        {label}
      </span>
      <span className={cn('mono text-[11px] font-bold', tone === 'success' ? 'text-emerald-700' : tone === 'warn' ? 'text-amber-700' : 'text-rose-700')}>{value}</span>
    </div>
  );
}
