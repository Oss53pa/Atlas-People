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
  type LucideIcon,
} from 'lucide-react';

export interface NavModule {
  code: string; // M1..M13
  path: string;
  label: string;
  icon: LucideIcon;
  /** Implémenté en profondeur dans cette phase ? */
  ready: boolean;
}

export interface NavGroup {
  bloc: string;
  label: string;
  modules: NavModule[];
}

export const NAV: NavGroup[] = [
  {
    bloc: 'home',
    label: 'Pilotage',
    modules: [
      { code: 'M13',  path: '/',            label: 'Cockpit DRH',  icon: LayoutDashboard, ready: true },
      { code: 'C360', path: '/cockpit-360', label: 'Vue 360°',     icon: LayoutGrid,      ready: true },
    ],
  },
  {
    bloc: 'A',
    label: 'Socle & Administration',
    modules: [
      { code: 'M1', path: '/collaborateurs', label: 'Collaborateurs', icon: Users, ready: true },
      { code: 'M2', path: '/temps', label: 'Temps & absences', icon: CalendarClock, ready: true },
      { code: 'M3', path: '/paie', label: 'Paie & déclarations', icon: Wallet, ready: true },
      { code: 'ADM', path: '/hr/actes', label: 'Actes & conformité', icon: FileSignature, ready: true },
      { code: 'M4', path: '/frais', label: 'Notes de frais', icon: ReceiptText, ready: true },
    ],
  },
  {
    bloc: 'B',
    label: 'Attirer & Intégrer',
    modules: [
      { code: 'M5', path: '/recrutement', label: 'Recrutement', icon: Target, ready: true },
      { code: 'M6', path: '/onboarding', label: 'Onboarding', icon: Rocket, ready: true },
    ],
  },
  {
    bloc: 'C',
    label: 'Performance & Talents',
    modules: [
      { code: 'PERF', path: '/performance', label: 'Performance (cockpit)', icon: Activity, ready: true },
      { code: 'BONUS', path: '/bonus', label: 'Bonus & primes', icon: Coins, ready: true },
      { code: 'M7', path: '/objectifs', label: 'Objectifs (OKR)', icon: Crosshair, ready: true },
      { code: 'M8', path: '/evaluations', label: 'Évaluations', icon: Gauge, ready: true },
      { code: 'M9', path: '/competences', label: 'Compétences', icon: Network, ready: true },
      { code: 'M10', path: '/carrieres', label: 'Carrières & succession', icon: Route, ready: true },
      { code: 'M11', path: '/formation', label: 'Formation', icon: GraduationCap, ready: true },
    ],
  },
  {
    bloc: 'D',
    label: 'Protéger',
    modules: [
      { code: 'M12', path: '/conformite', label: 'Conformité & SST', icon: ShieldCheck, ready: true },
    ],
  },
  {
    bloc: 'self',
    label: 'Mon espace',
    modules: [
      { code: 'SS', path: '/moi', label: 'Espace employé', icon: Smartphone, ready: true },
    ],
  },
];

export const ALL_MODULES = NAV.flatMap((g) => g.modules);
