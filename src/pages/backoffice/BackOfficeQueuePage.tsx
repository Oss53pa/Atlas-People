/**
 * Back-office RH — File d'attente consolidée (Queue).
 *
 * Workspace Agent HR / DRH : agrège TOUTES les demandes en attente cross-modules :
 *   • M1 — Modifications dossier collaborateur (téléphone, RIB, situation famille…)
 *   • M2 — Congés, heures sup, délégations
 *   • M4 — Notes de frais en validation
 *   • M5 — Entretiens à valider · offres en cours
 *   • M9 — PDC à signer · certifications à financer
 *   • M11 — PIF à valider · convocations à émettre
 *
 * Vue back-office orientée action : tri par ancienneté, filtres par catégorie,
 * actions de masse (approuver / demander info / réassigner).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox, AlertTriangle, CheckCircle2, Clock, Mail, FileSignature,
  Users, Wallet, Briefcase, GraduationCap, ChevronRight, Filter, Search,
  ArrowUpRight, ArrowDownAZ, UserCog,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { StatCard } from '../../components/ui/StatCard';
import { cn } from '../../lib/cn';

// ──────────────────────────────────────────────────────────────────────────
// Données mock — demandes consolidées cross-modules.
// En production : fetch agrégé sur les vues atlas_people.{m1_requests,m2_leave,
// m4_expenses,m5_pipeline_items,m9_pdc_pending,m11_pif_pending}.
// ──────────────────────────────────────────────────────────────────────────

type QueueCategory = 'm1' | 'm2' | 'm4' | 'm5' | 'm9' | 'm11';

interface QueueItem {
  id: string;
  category: QueueCategory;
  type: string;
  collaboratorName: string;
  collaboratorRole: string;
  createdAt: string; // ISO date (J-N pour ancienneté)
  priority: 'urgent' | 'normal' | 'faible';
  status: 'submitted' | 'info_requested' | 'in_progress';
  assignedTo?: string;
  amount?: number; // pour frais & PIF
  detail?: string;
}

const CATEGORIES: Record<QueueCategory, { label: string; icon: typeof Inbox; tone: string; module: string }> = {
  m1:  { label: 'Dossier',     icon: UserCog,        tone: 'bg-blue-500/[0.10] text-blue-600',       module: 'M1 Collaborateurs' },
  m2:  { label: 'Temps',       icon: Clock,          tone: 'bg-emerald-500/[0.10] text-emerald-600', module: 'M2 Congés & temps' },
  m4:  { label: 'Frais',       icon: Wallet,         tone: 'bg-amber-500/[0.10] text-amber-deep',    module: 'M4 Notes de frais' },
  m5:  { label: 'Recrut.',     icon: Briefcase,      tone: 'bg-violet-500/[0.10] text-violet-600',   module: 'M5 Recrutement' },
  m9:  { label: 'PDC',         icon: FileSignature,  tone: 'bg-rose-500/[0.10] text-rose-600',       module: 'M9 Compétences' },
  m11: { label: 'PIF',         icon: GraduationCap,  tone: 'bg-indigo-500/[0.10] text-indigo-600',   module: 'M11 Formation' },
};

const PRIORITY_META: Record<QueueItem['priority'], { label: string; tone: 'danger' | 'warn' | 'neutral' }> = {
  urgent: { label: 'Urgent',  tone: 'danger' },
  normal: { label: 'Normal',  tone: 'warn'   },
  faible: { label: 'Faible',  tone: 'neutral'},
};

const STATUS_META: Record<QueueItem['status'], { label: string; tone: 'warn' | 'info' | 'neutral' }> = {
  submitted: { label: 'À traiter', tone: 'warn' },
  info_requested: { label: 'Info demandée', tone: 'info' },
  in_progress: { label: 'En cours', tone: 'neutral' },
};

const TODAY = new Date('2026-06-03');

const ITEMS: QueueItem[] = [
  // M1 — modifications de dossier
  { id: 'q-1',  category: 'm1',  type: 'Changement de RIB',                  collaboratorName: 'Aïcha Diop',         collaboratorRole: 'Comptable senior',            createdAt: '2026-06-01', priority: 'normal', status: 'submitted',      assignedTo: 'Mariam Touré' },
  { id: 'q-2',  category: 'm1',  type: 'Mise à jour situation familiale',    collaboratorName: 'Kouassi N\'Guessan', collaboratorRole: 'Chef de projet',              createdAt: '2026-05-29', priority: 'normal', status: 'info_requested', assignedTo: 'Mariam Touré' },
  { id: 'q-3',  category: 'm1',  type: 'Demande d\'attestation de salaire',  collaboratorName: 'Fatou Diallo',       collaboratorRole: 'Data analyst',                createdAt: '2026-06-02', priority: 'normal', status: 'submitted' },

  // M2 — congés + heures sup
  { id: 'q-4',  category: 'm2',  type: 'Congé payé 5 jours',                 collaboratorName: 'Jean-Baptiste Koffi', collaboratorRole: 'Commercial B2B senior',      createdAt: '2026-06-02', priority: 'urgent', status: 'submitted',      assignedTo: 'Valentina Okou' },
  { id: 'q-5',  category: 'm2',  type: 'Heures sup 12h (avril)',             collaboratorName: 'Marie-Claude Ouattara', collaboratorRole: 'Production',              createdAt: '2026-05-28', priority: 'normal', status: 'in_progress' },
  { id: 'q-6',  category: 'm2',  type: 'Délégation pouvoir signature',       collaboratorName: 'Pierre Bamba',       collaboratorRole: 'Directeur opérationnel',      createdAt: '2026-05-30', priority: 'urgent', status: 'submitted' },

  // M4 — notes de frais
  { id: 'q-7',  category: 'm4',  type: 'Note de frais Q2 — 412 850 FCFA',    collaboratorName: 'Aïcha Diop',         collaboratorRole: 'Comptable senior',            createdAt: '2026-05-31', priority: 'normal', status: 'submitted',      amount: 412850 },
  { id: 'q-8',  category: 'm4',  type: 'Per diem mission Dakar — 280 000 FCFA', collaboratorName: 'Jean-Baptiste Koffi', collaboratorRole: 'Commercial B2B senior',   createdAt: '2026-06-01', priority: 'urgent', status: 'submitted',      amount: 280000 },

  // M5 — recrutement
  { id: 'q-9',  category: 'm5',  type: 'Validation offre — Account Manager', collaboratorName: 'Cabinet RH externe', collaboratorRole: 'Candidat externe',            createdAt: '2026-05-27', priority: 'urgent', status: 'in_progress',    assignedTo: 'Mariam Touré' },
  { id: 'q-10', category: 'm5',  type: 'Scorecard entretien 3 — IT Architect', collaboratorName: 'Olu Adeyemi',       collaboratorRole: 'Candidat senior',             createdAt: '2026-06-02', priority: 'normal', status: 'submitted' },

  // M9 — PDC + certifs
  { id: 'q-11', category: 'm9',  type: 'PDC à signer — PDC-2026-003',         collaboratorName: 'Sékou Camara',       collaboratorRole: 'Comptable senior',            createdAt: '2026-05-25', priority: 'normal', status: 'info_requested' },
  { id: 'q-12', category: 'm9',  type: 'Demande certification IFRS Praticien', collaboratorName: 'Sékou Camara',      collaboratorRole: 'Comptable senior',            createdAt: '2026-06-01', priority: 'normal', status: 'submitted',      amount: 1900000 },

  // M11 — PIF + convocations
  { id: 'q-13', category: 'm11', type: 'PIF-2026-0003 à valider DRH',         collaboratorName: 'Sékou Camara',       collaboratorRole: 'Comptable senior',            createdAt: '2026-05-26', priority: 'urgent', status: 'submitted',      amount: 3000000 },
  { id: 'q-14', category: 'm11', type: 'Convocation session HSE manquante',   collaboratorName: 'Atelier production', collaboratorRole: 'Site Yopougon',               createdAt: '2026-05-30', priority: 'faible', status: 'submitted' },
];

const fmt = (n: number): string => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`;
const daysAgo = (iso: string): number => Math.round((TODAY.getTime() - new Date(iso).getTime()) / 86_400_000);

export function BackOfficeQueuePage() {
  const [filterCat, setFilterCat] = useState<'all' | QueueCategory>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | QueueItem['priority']>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'age' | 'priority'>('age');

  const filtered = useMemo(() => {
    let list = [...ITEMS];
    if (filterCat !== 'all') list = list.filter((i) => i.category === filterCat);
    if (filterPriority !== 'all') list = list.filter((i) => i.priority === filterPriority);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((i) => i.type.toLowerCase().includes(s) || i.collaboratorName.toLowerCase().includes(s));
    }
    if (sort === 'age') {
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } else {
      const order = { urgent: 0, normal: 1, faible: 2 };
      list.sort((a, b) => order[a.priority] - order[b.priority]);
    }
    return list;
  }, [filterCat, filterPriority, search, sort]);

  // KPIs
  const k = useMemo(() => ({
    total: ITEMS.length,
    urgent: ITEMS.filter((i) => i.priority === 'urgent').length,
    overdue: ITEMS.filter((i) => daysAgo(i.createdAt) >= 5).length,
    pending: ITEMS.filter((i) => i.status === 'submitted').length,
  }), []);

  const categoryStats = useMemo(() => {
    const counts: Record<QueueCategory, number> = { m1: 0, m2: 0, m4: 0, m5: 0, m9: 0, m11: 0 };
    ITEMS.forEach((i) => { counts[i.category] += 1; });
    return counts;
  }, []);

  return (
    <div className="animate-fade-up space-y-5">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-deep">Back-office RH</p>
          <h1 className="font-display text-3xl text-ink">File d'attente</h1>
          <p className="mt-1 text-sm font-medium text-ink-500">
            Demandes consolidées · agent HR &amp; DRH · {filtered.length} sur {ITEMS.length} affichées
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/collaborateurs/demandes"><Button variant="outline" size="sm">Vue M1 dossier</Button></Link>
          <Link to="/temps"><Button variant="outline" size="sm">Vue M2 temps</Button></Link>
          <Link to="/admin"><Button size="sm"><UserCog size={14} /> Admin Studio</Button></Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Demandes ouvertes" value={String(k.total)} unit="à arbitrer" icon={Inbox} />
        <StatCard label="Urgent" value={String(k.urgent)} unit="prio haute" icon={AlertTriangle} tone={k.urgent > 0 ? 'amber' : 'default'} />
        <StatCard label="≥ 5 jours" value={String(k.overdue)} unit="anciennes" icon={Clock} tone={k.overdue > 0 ? 'amber' : 'default'} />
        <StatCard label="À traiter" value={String(k.pending)} unit="non assignées" icon={Mail} />
      </div>

      {/* Pills catégories — onglets compacts */}
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Catégories</span>
          <button
            type="button"
            onClick={() => setFilterCat('all')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors',
              filterCat === 'all' ? 'bg-amber/12 text-amber-deep ring-1 ring-amber/30' : 'border border-line bg-surface text-ink-500 hover:text-ink'
            )}
          >
            Toutes <span className="mono">{ITEMS.length}</span>
          </button>
          {(Object.keys(CATEGORIES) as QueueCategory[]).map((cat) => {
            const meta = CATEGORIES[cat];
            const Icon = meta.icon;
            const isActive = filterCat === cat;
            const count = categoryStats[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCat(cat)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors',
                  isActive ? 'bg-amber/12 text-amber-deep ring-1 ring-amber/30' : 'border border-line bg-surface text-ink-500 hover:text-ink'
                )}
              >
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-md', meta.tone)}><Icon size={11} /></span>
                {meta.label}
                <span className="mono">{count}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Toolbar filtres */}
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher type, collaborateur…"
              className="w-full rounded-xl border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none"
            />
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as 'all' | QueueItem['priority'])}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink"
          >
            <option value="all">Toutes priorités</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
            <option value="faible">Faible</option>
          </select>
          <button
            type="button"
            onClick={() => setSort((s) => (s === 'age' ? 'priority' : 'age'))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink-500 transition-colors hover:border-amber/40"
          >
            <ArrowDownAZ size={14} /> Trier · {sort === 'age' ? 'Ancienneté' : 'Priorité'}
          </button>
          <Button variant="outline" size="sm"><Filter size={14} /> Filtres avancés</Button>
        </div>
      </Card>

      {/* Liste */}
      <Card inset={false}>
        <div className="p-5 pb-2">
          <CardHeader title="Demandes en attente" subtitle={`${filtered.length} ${filtered.length > 1 ? 'éléments' : 'élément'} affichés`} className="mb-0" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 text-left">Catégorie</th>
                <th className="px-3 py-2 text-left">Type / Collaborateur</th>
                <th className="px-3 py-2 text-center">Ancienneté</th>
                <th className="px-3 py-2 text-center">Priorité</th>
                <th className="px-3 py-2 text-center">Statut</th>
                <th className="px-3 py-2 text-left">Assigné</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((q) => {
                const meta = CATEGORIES[q.category];
                const Icon = meta.icon;
                const age = daysAgo(q.createdAt);
                const ageStr = age === 0 ? 'auj.' : age === 1 ? 'hier' : `J-${age}`;
                const ageTone = age >= 5 ? 'text-rose-600' : age >= 3 ? 'text-amber-deep' : 'text-ink-500';
                return (
                  <tr key={q.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2.5">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold', meta.tone)}>
                        <Icon size={11} /> {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={q.collaboratorName} size="xs" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-ink">{q.type}</p>
                          <p className="truncate text-[10px] font-medium text-ink-500">
                            {q.collaboratorName} · {q.collaboratorRole}
                            {q.amount && <span className="mono ml-1 text-amber-deep">· {fmt(q.amount)}</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={cn('px-3 py-2.5 mono text-center text-[11px] font-bold', ageTone)}>{ageStr}</td>
                    <td className="px-3 py-2.5 text-center">
                      <StatusPill tone={PRIORITY_META[q.priority].tone} dot={false}>{PRIORITY_META[q.priority].label}</StatusPill>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <StatusPill tone={STATUS_META[q.status].tone} dot={false}>{STATUS_META[q.status].label}</StatusPill>
                    </td>
                    <td className="px-3 py-2.5">
                      {q.assignedTo ? (
                        <span className="text-[11px] font-semibold text-ink-700">{q.assignedTo}</span>
                      ) : (
                        <span className="text-[11px] font-medium italic text-ink-400">Non assignée</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Button variant="ghost" size="sm">Traiter <ChevronRight size={12} /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <CheckCircle2 size={32} className="text-emerald-500" />
              <p className="text-sm font-semibold text-ink">Aucune demande ne correspond aux filtres</p>
              <p className="text-[11px] font-medium text-ink-500">Excellente nouvelle — la file d'attente est sous contrôle.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Note opérationnelle */}
      <Card className="border-info/25 bg-info/[0.04]">
        <div className="flex items-start gap-3">
          <Users size={18} className="mt-0.5 shrink-0 text-info" />
          <div>
            <p className="text-sm font-bold text-ink">File d'attente cross-modules</p>
            <p className="mt-1 text-[12px] font-medium text-ink-500">
              Cette queue agrège <strong>6 modules</strong> (M1 dossier · M2 temps · M4 frais · M5 recrutement · M9 PDC · M11 PIF).
              Les agents HR traitent les demandes de leur périmètre, le DRH arbitre les escalades. Chaque action met à jour l'audit
              SHA-256 du module source. La réassignation est tracée (champ <code className="rounded bg-surface2 px-1.5 py-0.5 text-[10px] font-bold text-amber-deep">assigned_by</code>).
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
              <Link to="/notifications" className="inline-flex items-center gap-1 text-info hover:underline"><Mail size={11} /> Centre de notifications</Link>
              <span className="text-ink-300">·</span>
              <Link to="/audit" className="inline-flex items-center gap-1 text-info hover:underline"><ArrowUpRight size={11} /> Audit (SHA-256)</Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
