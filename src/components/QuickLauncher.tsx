/**
 * Quick Launcher global — Cmd/Ctrl+K palette.
 * Indexe toutes les routes des 12 modules + actions rapides + raccourcis collaborateurs.
 * Recherche fuzzy + navigation clavier (↑↓ Enter Esc).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, Hash, Users, Wallet, CalendarClock, ReceiptText,
  FileSignature, Target, Rocket, Crosshair, Gauge, Network, Route,
  GraduationCap, ShieldCheck, Smartphone, LayoutDashboard, LayoutGrid,
  Plus, Star, type LucideIcon,
} from 'lucide-react';
import { EMPLOYEES, employeeName } from '../data/mock';
import { cn } from '../lib/cn';

interface Entry {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: LucideIcon;
  path: string;
  keywords?: string[];
}

const MODULE_ENTRIES: Entry[] = [
  // Pilotage
  { id: 'pi-0', label: 'Accueil',      group: 'Pilotage', icon: LayoutDashboard, path: '/accueil', hint: 'Welcome cockpit — Hero + 4 KPI + accès rapides', keywords: ['home','welcome','bienvenue','dashboard'] },
  { id: 'pi-1', label: 'Cockpit DRH',  group: 'Pilotage', icon: LayoutDashboard, path: '/', hint: 'Vue classique M13' },
  { id: 'pi-2', label: 'Vue 360° unifiée', group: 'Pilotage', icon: LayoutGrid, path: '/cockpit-360', hint: 'Synthèse cross-modules' },
  { id: 'pi-5', label: 'Landing publique', group: 'Pilotage', icon: LayoutDashboard, path: '/landing', hint: 'Page commerciale Atlas Studio', keywords: ['site','public','marketing','landing'] },
  { id: 'pi-3', label: 'Simulateur What-if', group: 'Pilotage', icon: Star, path: '/whatif', hint: 'Augmentation · embauches · réformes', keywords: ['simulation','scenario','prevision'] },
  { id: 'pi-4', label: 'Comparateur scénarios A vs B', group: 'Pilotage', icon: Star, path: '/whatif/compare', hint: 'Side-by-side delta financier', keywords: ['compare','versus','arbitrage'] },

  // M1 Collaborateurs
  { id: 'm1-1', label: 'Liste des collaborateurs', group: 'M1 Collaborateurs', icon: Users, path: '/collaborateurs' },
  { id: 'm1-2', label: 'Nouveau collaborateur', group: 'M1 Collaborateurs', icon: Plus, path: '/collaborateurs/nouveau', hint: 'Wizard 10 étapes', keywords: ['create','nouveau','embaucher'] },
  { id: 'm1-3', label: 'Import en masse', group: 'M1 Collaborateurs', icon: Plus, path: '/collaborateurs/import' },
  { id: 'm1-4', label: 'Demandes de modification', group: 'M1 Collaborateurs', icon: Users, path: '/collaborateurs/demandes' },

  // M2 Temps
  { id: 'm2-1', label: 'Temps & absences (équipe)', group: 'M2 Temps', icon: CalendarClock, path: '/temps' },

  // M3 Paie
  { id: 'm3-1', label: 'Cockpit paie', group: 'M3 Paie', icon: Wallet, path: '/paie' },

  // M4 Notes de frais
  { id: 'm4-1', label: 'Notes de frais', group: 'M4 Frais', icon: ReceiptText, path: '/frais' },

  // ADM
  { id: 'adm-1', label: 'Actes & conformité', group: 'Admin RH', icon: FileSignature, path: '/hr/actes' },

  // M5 Recrutement
  { id: 'm5-1',  label: 'Cockpit recrutement', group: 'M5 Recrutement', icon: Target, path: '/recrutement' },
  { id: 'm5-2',  label: 'Besoins',     group: 'M5 Recrutement', icon: Target, path: '/recrutement/besoins' },
  { id: 'm5-3',  label: 'Postes',      group: 'M5 Recrutement', icon: Target, path: '/recrutement/postes' },
  { id: 'm5-4',  label: 'Pipeline candidatures', group: 'M5 Recrutement', icon: Target, path: '/recrutement/candidatures', keywords: ['kanban'] },
  { id: 'm5-5',  label: 'Vivier',      group: 'M5 Recrutement', icon: Target, path: '/recrutement/vivier' },
  { id: 'm5-6',  label: 'Entretiens',  group: 'M5 Recrutement', icon: Target, path: '/recrutement/entretiens' },
  { id: 'm5-7',  label: 'Offres',      group: 'M5 Recrutement', icon: Target, path: '/recrutement/offres' },
  { id: 'm5-8',  label: 'Sourcing',    group: 'M5 Recrutement', icon: Target, path: '/recrutement/sourcing' },
  { id: 'm5-9',  label: 'Cooptation',  group: 'M5 Recrutement', icon: Target, path: '/recrutement/cooptation' },
  { id: 'm5-10', label: 'Intégration', group: 'M5 Recrutement', icon: Target, path: '/recrutement/integration' },
  { id: 'm5-11', label: 'Reporting',   group: 'M5 Recrutement', icon: Target, path: '/recrutement/reporting' },
  { id: 'm5-12', label: 'RGPD',        group: 'M5 Recrutement', icon: Target, path: '/recrutement/rgpd' },
  { id: 'm5-13', label: 'Paramètres',  group: 'M5 Recrutement', icon: Target, path: '/recrutement/parametres' },

  // M6 Onboarding
  { id: 'm6-1', label: 'Cockpit onboarding', group: 'M6 Onboarding', icon: Rocket, path: '/onboarding' },

  // M7 OKR
  { id: 'm7-1',  label: 'Cockpit OKR',          group: 'M7 OKR', icon: Crosshair, path: '/objectifs' },
  { id: 'm7-2',  label: 'Cycles',               group: 'M7 OKR', icon: Crosshair, path: '/objectifs/cycles' },
  { id: 'm7-3',  label: 'OKR entreprise',       group: 'M7 OKR', icon: Crosshair, path: '/objectifs/entreprise' },
  { id: 'm7-4',  label: 'OKR département',      group: 'M7 OKR', icon: Crosshair, path: '/objectifs/departement' },
  { id: 'm7-5',  label: 'OKR équipe',           group: 'M7 OKR', icon: Crosshair, path: '/objectifs/equipe' },
  { id: 'm7-6',  label: 'OKR individuels',      group: 'M7 OKR', icon: Crosshair, path: '/objectifs/individuel' },
  { id: 'm7-7',  label: 'Key Results',          group: 'M7 OKR', icon: Crosshair, path: '/objectifs/key-results' },
  { id: 'm7-8',  label: 'Check-ins',            group: 'M7 OKR', icon: Crosshair, path: '/objectifs/check-ins' },
  { id: 'm7-9',  label: 'Alignement (cascade)', group: 'M7 OKR', icon: Crosshair, path: '/objectifs/alignement' },
  { id: 'm7-10', label: 'Méthodologie CRAFT/FAST', group: 'M7 OKR', icon: Crosshair, path: '/objectifs/methodologie', keywords: ['anti-pattern'] },
  { id: 'm7-11', label: 'Notation & Confidence',   group: 'M7 OKR', icon: Crosshair, path: '/objectifs/notation' },
  { id: 'm7-12', label: 'Rétrospective',           group: 'M7 OKR', icon: Crosshair, path: '/objectifs/retrospective' },
  { id: 'm7-13', label: 'Gouvernance Comité OKR',  group: 'M7 OKR', icon: Crosshair, path: '/objectifs/gouvernance' },
  { id: 'm7-14', label: 'Intégration M3/M8',       group: 'M7 OKR', icon: Crosshair, path: '/objectifs/integration', keywords: ['paie variable','prime'] },
  { id: 'm7-15', label: 'Audit SHA-256',           group: 'M7 OKR', icon: Crosshair, path: '/objectifs/audit', keywords: ['anti-fraude','sandbagging'] },
  { id: 'm7-16', label: 'Revue',                   group: 'M7 OKR', icon: Crosshair, path: '/objectifs/revue' },
  { id: 'm7-17', label: 'Reporting OKR',           group: 'M7 OKR', icon: Crosshair, path: '/objectifs/reporting' },
  { id: 'm7-18', label: 'Paramètres OKR',          group: 'M7 OKR', icon: Crosshair, path: '/objectifs/parametres' },

  // M8 Évaluations
  { id: 'm8-1', label: 'Cockpit évaluations', group: 'M8 Évaluations', icon: Gauge, path: '/evaluations' },

  // M9 Compétences
  { id: 'm9-1', label: 'Cartographie compétences', group: 'M9 Compétences', icon: Network, path: '/competences' },

  // M10 Carrières
  { id: 'm10-1',  label: 'Cockpit carrières',     group: 'M10 Carrières', icon: Route, path: '/carrieres' },
  { id: 'm10-2',  label: 'Filières',              group: 'M10 Carrières', icon: Route, path: '/carrieres/filieres' },
  { id: 'm10-3',  label: 'Trajectoires',          group: 'M10 Carrières', icon: Route, path: '/carrieres/trajectoires' },
  { id: 'm10-4',  label: 'Postes clés',           group: 'M10 Carrières', icon: Route, path: '/carrieres/postes-cles' },
  { id: 'm10-5',  label: 'Succession',            group: 'M10 Carrières', icon: Route, path: '/carrieres/succession' },
  { id: 'm10-6',  label: 'Hauts potentiels',      group: 'M10 Carrières', icon: Route, path: '/carrieres/hauts-potentiels' },
  { id: 'm10-7',  label: 'Mentorat',              group: 'M10 Carrières', icon: Route, path: '/carrieres/mentorat' },
  { id: 'm10-8',  label: 'Cartographie compétences', group: 'M10 Carrières', icon: Route, path: '/carrieres/cartographie' },
  { id: 'm10-9',  label: 'Mobilité interne',      group: 'M10 Carrières', icon: Route, path: '/carrieres/mobilite' },
  { id: 'm10-10', label: 'Reporting carrières',   group: 'M10 Carrières', icon: Route, path: '/carrieres/reporting' },
  { id: 'm10-11', label: 'Paramètres carrières',  group: 'M10 Carrières', icon: Route, path: '/carrieres/parametres' },

  // M11 Formation
  { id: 'm11-1',  label: 'Cockpit formation',     group: 'M11 Formation', icon: GraduationCap, path: '/formation' },
  { id: 'm11-2',  label: 'Catalogue',             group: 'M11 Formation', icon: GraduationCap, path: '/formation/catalogue' },
  { id: 'm11-3',  label: 'Plan annuel',           group: 'M11 Formation', icon: GraduationCap, path: '/formation/plan' },
  { id: 'm11-4',  label: 'Sessions',              group: 'M11 Formation', icon: GraduationCap, path: '/formation/sessions' },
  { id: 'm11-5',  label: 'Inscriptions',          group: 'M11 Formation', icon: GraduationCap, path: '/formation/inscriptions' },
  { id: 'm11-6',  label: 'Évaluations Kirkpatrick', group: 'M11 Formation', icon: GraduationCap, path: '/formation/evaluations', keywords: ['L1','L2','L3','L4'] },
  { id: 'm11-7',  label: 'Certifications',        group: 'M11 Formation', icon: GraduationCap, path: '/formation/certifications' },
  { id: 'm11-8',  label: 'ROI',                   group: 'M11 Formation', icon: GraduationCap, path: '/formation/roi' },
  { id: 'm11-9',  label: 'Compétences acquises',  group: 'M11 Formation', icon: GraduationCap, path: '/formation/competences' },
  { id: 'm11-10', label: 'FDFP / 3FPT',           group: 'M11 Formation', icon: GraduationCap, path: '/formation/fdfp', keywords: ['fonds formation','remboursement'] },
  { id: 'm11-11', label: 'Reporting formation',   group: 'M11 Formation', icon: GraduationCap, path: '/formation/reporting' },
  { id: 'm11-12', label: 'Paramètres formation',  group: 'M11 Formation', icon: GraduationCap, path: '/formation/parametres' },

  // M12 Conformité
  { id: 'm12-1',  label: 'Cockpit conformité',    group: 'M12 Conformité & SST', icon: ShieldCheck, path: '/conformite' },
  { id: 'm12-2',  label: 'DUER',                  group: 'M12 Conformité & SST', icon: ShieldCheck, path: '/conformite/duer', keywords: ['risques','document unique'] },
  { id: 'm12-3',  label: 'RPS — Risques psychosociaux', group: 'M12 Conformité & SST', icon: ShieldCheck, path: '/conformite/rps', keywords: ['burnout','wellbeing'] },
  { id: 'm12-4',  label: 'AT / MP',               group: 'M12 Conformité & SST', icon: ShieldCheck, path: '/conformite/at-mp', keywords: ['accident travail','maladie pro'] },
  { id: 'm12-5',  label: 'Registre du personnel', group: 'M12 Conformité & SST', icon: ShieldCheck, path: '/conformite/registre' },
  { id: 'm12-6',  label: 'Déclarations sociales', group: 'M12 Conformité & SST', icon: ShieldCheck, path: '/conformite/declarations', keywords: ['CNPS','IPRES','CNSS'] },
  { id: 'm12-7',  label: 'Visites médicales',     group: 'M12 Conformité & SST', icon: ShieldCheck, path: '/conformite/visites' },
  { id: 'm12-8',  label: 'Habilitations & EPI',   group: 'M12 Conformité & SST', icon: ShieldCheck, path: '/conformite/habilitations' },
  { id: 'm12-9',  label: 'Audits internes',       group: 'M12 Conformité & SST', icon: ShieldCheck, path: '/conformite/audits', keywords: ['RGPD','Sapin','ISO'] },
  { id: 'm12-10', label: 'Inspections du travail', group: 'M12 Conformité & SST', icon: ShieldCheck, path: '/conformite/inspections' },
  { id: 'm12-11', label: 'Conservation légale',   group: 'M12 Conformité & SST', icon: ShieldCheck, path: '/conformite/conservation' },
  { id: 'm12-12', label: 'Paramètres conformité', group: 'M12 Conformité & SST', icon: ShieldCheck, path: '/conformite/parametres' },

  // Self-service
  { id: 'ss-1', label: 'Espace employé (ESS)', group: 'Mon espace', icon: Smartphone, path: '/moi' },
  { id: 'ss-2', label: 'Portail collaborateur', group: 'Mon espace', icon: Smartphone, path: '/espace' },

  // Paramètres globaux
  { id: 'set-1', label: 'Paramètres globaux', group: 'Paramètres', icon: Hash, path: '/parametres' },
];

function fuzzyMatch(query: string, target: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return 100 - t.indexOf(q);
  // fuzzy : chaque char de q présent dans t dans l'ordre
  let qi = 0;
  let lastIdx = -1;
  let score = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      score += lastIdx === -1 ? 10 : 5 - Math.min(4, i - lastIdx);
      lastIdx = i;
      qi++;
    }
  }
  return qi === q.length ? score : 0;
}

interface Result {
  entry: Entry;
  score: number;
}

export function QuickLauncher() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Build employee entries (dynamic)
  const employeeEntries: Entry[] = useMemo(() =>
    EMPLOYEES.map((e) => ({
      id: `emp-${e.id}`,
      label: employeeName(e),
      hint: `${e.role} · ${e.department}`,
      group: 'Collaborateurs',
      icon: Users,
      path: `/collaborateurs`,
      keywords: [e.email, e.countryCode, e.department, e.role],
    })),
  []);

  const allEntries = useMemo(() => [...MODULE_ENTRIES, ...employeeEntries], [employeeEntries]);

  const results: Result[] = useMemo(() => {
    if (!query.trim()) {
      // par défaut, montre les entrées Pilotage + suggestions
      return MODULE_ENTRIES.filter((e) => e.group === 'Pilotage' || e.id.endsWith('-1')).slice(0, 12).map((e) => ({ entry: e, score: 1 }));
    }
    const out: Result[] = [];
    for (const e of allEntries) {
      const labelScore = fuzzyMatch(query, e.label);
      const hintScore = e.hint ? fuzzyMatch(query, e.hint) : 0;
      const groupScore = fuzzyMatch(query, e.group) * 0.4;
      const kwScore = (e.keywords ?? []).reduce((max, k) => Math.max(max, fuzzyMatch(query, k)), 0) * 0.8;
      const score = Math.max(labelScore, hintScore * 0.7, groupScore, kwScore);
      if (score > 0) out.push({ entry: e, score });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 30);
  }, [query, allEntries]);

  // Group results by .group
  const grouped = useMemo(() => {
    const map: Record<string, Result[]> = {};
    for (const r of results) {
      if (!map[r.entry.group]) map[r.entry.group] = [];
      map[r.entry.group].push(r);
    }
    return Object.entries(map);
  }, [results]);

  // Reset activeIdx when query changes
  useEffect(() => { setActiveIdx(0); }, [query]);

  // Open via Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const flatList = useMemo(() => results.map((r) => r.entry), [results]);

  const go = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flatList.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = flatList[activeIdx];
      if (target) go(target.path);
    }
  }, [flatList, activeIdx, go]);

  if (!open) return null;

  let renderedIdx = -1;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center p-4 pt-[10vh]"
      onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search size={18} className="text-amber-deep" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher une page, un collaborateur, une action…"
            className="flex-1 bg-transparent text-[14px] font-medium text-ink placeholder:text-ink-400 focus:outline-none"
          />
          <kbd className="hidden mono rounded border border-line bg-surface2 px-1.5 py-0.5 text-[10px] font-bold text-ink-500 md:inline-block">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12px] font-medium text-ink-500">
              Aucun résultat pour « {query} ».
            </p>
          ) : grouped.map(([group, items]) => (
            <div key={group}>
              <p className="mono px-3 pb-1 pt-2 text-[9px] font-bold uppercase tracking-wider text-ink-400">{group}</p>
              {items.map((r) => {
                renderedIdx++;
                const isActive = renderedIdx === activeIdx;
                const Icon = r.entry.icon;
                return (
                  <button
                    key={r.entry.id}
                    onClick={() => go(r.entry.path)}
                    onMouseEnter={() => setActiveIdx(flatList.indexOf(r.entry))}
                    className={cn('group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                      isActive ? 'bg-amber/12 text-ink' : 'text-ink-700 hover:bg-amber/[0.06]')}>
                    <Icon size={16} className={cn(isActive ? 'text-amber-deep' : 'text-ink-400')} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{r.entry.label}</p>
                      {r.entry.hint && <p className="truncate text-[10px] font-medium text-ink-500">{r.entry.hint}</p>}
                    </div>
                    <ArrowRight size={14} className={cn('shrink-0 transition-opacity', isActive ? 'opacity-100 text-amber-deep' : 'opacity-0')} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line bg-surface2/40 px-4 py-2 text-[10px] font-medium text-ink-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="mono rounded border border-line bg-surface px-1 py-0.5 font-bold">↑↓</kbd> naviguer</span>
            <span className="flex items-center gap-1"><kbd className="mono rounded border border-line bg-surface px-1 py-0.5 font-bold">↵</kbd> ouvrir</span>
            <span className="flex items-center gap-1"><kbd className="mono rounded border border-line bg-surface px-1 py-0.5 font-bold">ESC</kbd> fermer</span>
          </div>
          <span className="flex items-center gap-1"><Star size={10} /> {allEntries.length} entrées indexées</span>
        </div>
      </div>
    </div>
  );
}
