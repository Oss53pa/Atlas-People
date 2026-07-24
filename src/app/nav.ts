import {
  LayoutDashboard,
  LayoutGrid,
  Users,
  CalendarClock,
  Wallet,
  ReceiptText,
  Target,
  Rocket,
  Crosshair,
  Gauge,
  Network,
  Route,
  GraduationCap,
  ShieldCheck,
  Smartphone,
  FileSignature,
  Activity,
  Coins,
  Briefcase,
  BarChart2,
  ExternalLink,
  UserCog,
  Files,
  FileCheck2,
  UserCheck,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import type { TenantType } from '../store/useAppStore';

export interface NavModule {
  code: string;
  path: string;
  label: string;
  icon: LucideIcon;
  /** false = affiché dans la sidebar mais non-navigable (bientôt) */
  ready: boolean;
}

export interface NavGroup {
  bloc: string;
  label: string;
  modules: NavModule[];
}

// ── Méta-produit : nom commercial + couleur d'accent ─────────────────────

export const PRODUCT_META: Record<TenantType, {
  name: string;
  sub: string;
  accentClass: string;
  iconBg: string;
}> = {
  entreprise:      { name: 'Atlas People Core',      sub: 'SIRH Entreprise',            accentClass: 'text-amber-deep', iconBg: 'bg-amber/15' },
  cabinet_complet: { name: 'Atlas People Conseil',   sub: 'Cabinet RH · multi-clients', accentClass: 'text-teal-600',   iconBg: 'bg-teal-100' },
  cabinet_paie:    { name: 'Atlas Payroll',          sub: 'Bureau de paie',             accentClass: 'text-blue-600',   iconBg: 'bg-blue-100' },
  cabinet_mixte:   { name: 'Atlas People 360',       sub: 'Structure mixte',            accentClass: 'text-violet-600', iconBg: 'bg-violet-100' },
  cabinet_agence:  { name: 'Atlas People Placement', sub: 'Agence · mise à disposition',accentClass: 'text-rose-600',   iconBg: 'bg-rose-100' },
};

// ── Bibliothèque de modules ───────────────────────────────────────────────

const M: Record<string, NavModule> = {
  // ── Pilotage
  cockpit:     { code: 'M13',   path: '/',                    label: 'Cockpit DRH',           icon: LayoutDashboard, ready: true  },
  vue360:      { code: 'C360',  path: '/cockpit-360',         label: 'Vue 360°',              icon: LayoutGrid,      ready: true  },
  // ── Bloc A — Socle
  collabs:     { code: 'M1',    path: '/collaborateurs',      label: 'Collaborateurs',        icon: Users,           ready: true  },
  temps:       { code: 'M2',    path: '/temps',               label: 'Temps & absences',      icon: CalendarClock,   ready: true  },
  paie:        { code: 'M3',    path: '/paie',                label: 'Paie & déclarations',   icon: Wallet,          ready: true  },
  actes:       { code: 'ADM',   path: '/hr/actes',            label: 'Actes & conformité',    icon: FileSignature,   ready: true  },
  frais:       { code: 'M4',    path: '/frais',               label: 'Notes de frais',        icon: ReceiptText,     ready: true  },
  // ── Bloc B — Attirer
  recrut:      { code: 'M5',    path: '/recrutement',         label: 'Recrutement',           icon: Target,          ready: true  },
  onboard:     { code: 'M6',    path: '/onboarding',          label: 'Onboarding',            icon: Rocket,          ready: true  },
  // ── Bloc C — Performance
  perf:        { code: 'PERF',  path: '/performance',         label: 'Performance (cockpit)', icon: Activity,        ready: true  },
  bonus:       { code: 'BONUS', path: '/bonus',               label: 'Bonus & primes',        icon: Coins,           ready: true  },
  okr:         { code: 'M7',    path: '/objectifs',           label: 'Objectifs (OKR)',       icon: Crosshair,       ready: true  },
  eval:        { code: 'M8',    path: '/evaluations',         label: 'Évaluations',           icon: Gauge,           ready: true  },
  competences: { code: 'M9',    path: '/competences',         label: 'Compétences',           icon: Network,         ready: true  },
  carrieres:   { code: 'M10',   path: '/carrieres',           label: 'Carrières & succession',icon: Route,           ready: true  },
  formation:   { code: 'M11',   path: '/formation',           label: 'Formation',             icon: GraduationCap,   ready: true  },
  // ── Bloc D — Protéger
  conformite:  { code: 'M12',   path: '/conformite',          label: 'Conformité & SST',      icon: ShieldCheck,     ready: true  },
  // ── Espaces personnels
  ess:         { code: 'SS',    path: '/moi',                 label: 'Espace employé (ESS)',  icon: Smartphone,      ready: true  },
  mss:         { code: 'MSS',   path: '/team',                label: 'Espace manager (MSS)',  icon: UserCog,         ready: true  },
  // ── Cabinet — Clients
  clients:     { code: 'CLI',   path: '/clients',             label: 'Portefeuille clients',  icon: Briefcase,       ready: true  },
  prefact:     { code: 'PFACT', path: '/prefacturation',      label: 'Préfacturation',        icon: ReceiptText,     ready: false },
  rapportCab:  { code: 'RCAB',  path: '/rapport-cabinet',    label: 'Rapport cabinet',       icon: BarChart2,       ready: false },
  ifClient:    { code: 'IFC',   path: '/interface-client',   label: 'Interface client',      icon: ExternalLink,    ready: false },
  // ── Atlas Payroll spécifique
  bulLot:      { code: 'BLOT',  path: '/bulletins-lot',      label: 'Bulletins en lot',      icon: Files,           ready: false },
  dsn:         { code: 'DSN',   path: '/dsn-consolidee',     label: 'DSN consolidée',        icon: FileCheck2,      ready: false },
  // ── Atlas People Placement spécifique
  travPlaces:  { code: 'TPLC',  path: '/travailleurs-places',label: 'Travailleurs placés',   icon: UserCheck,       ready: true  },
  adminPerso:  { code: 'APERS', path: '/admin-personnel',    label: 'Administration RH',     icon: Users,           ready: false },
  contratMis:  { code: 'CMIS',  path: '/contrats-mission',   label: 'Contrats de mission',   icon: FileSignature,   ready: false },
  sites:       { code: 'SITES', path: '/sites-clients',      label: 'Sites & entreprises',   icon: Building2,       ready: false },
  rapportAge:  { code: 'RAGE',  path: '/rapport-agence',    label: 'Rapport agence',        icon: BarChart2,       ready: false },
};

// ── Navigation par produit ────────────────────────────────────────────────

function navCore(): NavGroup[] {
  return [
    { bloc: 'home', label: 'Pilotage',
      modules: [M.cockpit, M.vue360] },
    { bloc: 'A', label: 'Socle & Administration',
      modules: [M.collabs, M.temps, M.paie, M.actes, M.frais] },
    { bloc: 'B', label: 'Attirer & Intégrer',
      modules: [M.recrut, M.onboard] },
    { bloc: 'C', label: 'Performance & Talents',
      modules: [M.perf, M.bonus, M.okr, M.eval, M.competences, M.carrieres, M.formation] },
    { bloc: 'D', label: 'Protéger',
      modules: [M.conformite] },
    { bloc: 'self', label: 'Mon espace',
      modules: [M.mss, M.ess] },
  ];
}

function navConseil(): NavGroup[] {
  return [
    { bloc: 'clients', label: 'Portefeuille',
      modules: [M.clients] },
    { bloc: 'A', label: 'Socle & Administration',
      modules: [M.collabs, M.temps, M.paie, M.actes, M.frais] },
    { bloc: 'B', label: 'Attirer & Intégrer',
      modules: [M.recrut, M.onboard] },
    { bloc: 'C', label: 'Performance & Talents',
      modules: [M.eval, M.competences, M.formation] },
    { bloc: 'D', label: 'Protéger',
      modules: [M.conformite] },
    { bloc: 'cabinet', label: 'Cabinet',
      modules: [M.prefact, M.rapportCab] },
    { bloc: 'portails', label: 'Portails',
      modules: [M.ifClient, M.mss, M.ess] },
  ];
}

function navPayroll(): NavGroup[] {
  return [
    { bloc: 'clients', label: 'Portefeuille',
      modules: [M.clients] },
    { bloc: 'paie', label: 'Paie & Temps',
      modules: [M.temps, M.paie, M.bulLot, M.dsn] },
    { bloc: 'cabinet', label: 'Cabinet',
      modules: [M.prefact, M.rapportCab] },
    { bloc: 'portails', label: 'Portails',
      modules: [M.ifClient, M.mss, M.ess] },
  ];
}

function nav360(): NavGroup[] {
  return [
    { bloc: 'equipe', label: 'Mon équipe',
      modules: [M.cockpit, M.collabs, M.temps, M.paie, M.actes, M.frais, M.recrut, M.eval, M.competences, M.formation, M.conformite] },
    { bloc: 'clients', label: 'Mes clients',
      modules: [M.clients, M.prefact, M.rapportCab, M.ifClient] },
    { bloc: 'portails', label: 'Portails',
      modules: [M.mss, M.ess] },
  ];
}

function navPlacement(): NavGroup[] {
  return [
    { bloc: 'placement', label: 'Travailleurs placés',
      modules: [M.travPlaces, M.adminPerso, M.contratMis, M.sites] },
    { bloc: 'paie', label: 'Paie & Temps',
      modules: [M.temps, M.paie] },
    { bloc: 'D', label: 'Protéger',
      modules: [M.conformite] },
    { bloc: 'cabinet', label: 'Cabinet',
      modules: [M.prefact, M.rapportAge] },
    { bloc: 'portails', label: 'Portails',
      modules: [M.ifClient, M.mss, M.ess] },
  ];
}

export function getNav(tenantType: TenantType): NavGroup[] {
  switch (tenantType) {
    case 'cabinet_complet': return navConseil();
    case 'cabinet_paie':    return navPayroll();
    case 'cabinet_mixte':   return nav360();
    case 'cabinet_agence':  return navPlacement();
    default:                return navCore();
  }
}

// Rétrocompatibilité
export const NAV = navCore();

// Modules uniques de tous les produits — utilisé par App.tsx pour enregistrer
// les routes React Router (fallback ComingSoonPage pour les ready:false).
function allUniqueModules(): NavModule[] {
  const all = [navCore(), navConseil(), navPayroll(), nav360(), navPlacement()]
    .flatMap((n) => n.flatMap((g) => g.modules));
  const seen = new Set<string>();
  return all.filter((m) => { if (seen.has(m.code)) return false; seen.add(m.code); return true; });
}
export const ALL_MODULES = allUniqueModules();
