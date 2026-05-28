import {
  LayoutDashboard,
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
      { code: 'M13', path: '/', label: 'Cockpit DRH', icon: LayoutDashboard, ready: true },
    ],
  },
  {
    bloc: 'A',
    label: 'Socle & Administration',
    modules: [
      { code: 'M1', path: '/collaborateurs', label: 'Collaborateurs', icon: Users, ready: true },
      { code: 'M2', path: '/temps', label: 'Temps & absences', icon: CalendarClock, ready: true },
      { code: 'M3', path: '/paie', label: 'Paie & déclarations', icon: Wallet, ready: true },
      { code: 'M4', path: '/frais', label: 'Notes de frais', icon: ReceiptText, ready: true },
    ],
  },
  {
    bloc: 'B',
    label: 'Attirer & Intégrer',
    modules: [
      { code: 'M5', path: '/recrutement', label: 'Recrutement', icon: Target, ready: false },
      { code: 'M6', path: '/onboarding', label: 'Onboarding', icon: Rocket, ready: false },
    ],
  },
  {
    bloc: 'C',
    label: 'Performance & Talents',
    modules: [
      { code: 'M7', path: '/objectifs', label: 'Objectifs (OKR)', icon: Crosshair, ready: false },
      { code: 'M8', path: '/evaluations', label: 'Évaluations', icon: Gauge, ready: false },
      { code: 'M9', path: '/competences', label: 'Compétences', icon: Network, ready: true },
      { code: 'M10', path: '/carrieres', label: 'Carrières & succession', icon: Route, ready: false },
      { code: 'M11', path: '/formation', label: 'Formation', icon: GraduationCap, ready: false },
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
