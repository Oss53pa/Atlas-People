import { LayoutDashboard, Users, Smartphone, type LucideIcon } from 'lucide-react';

/**
 * Architecture des espaces (surfaces). Atlas People = un backend unique servant
 * TROIS espaces distincts (intention + ergonomie + permissions) :
 *  - ESS  (Employé)  : soi-même, desktop + mobile, jamais de sélecteur collaborateur.
 *  - MSS  (Manager)  : son équipe (N-1), responsive, données sensibles interdites.
 *  - Back-office RH  : tous les collaborateurs, desktop-first, sélecteur présent.
 */
export type SurfaceKey = 'ess' | 'mss' | 'backoffice';

export interface SpaceDef {
  key: SurfaceKey;
  label: string;
  sub: string;
  icon: LucideIcon;
  landing: string;   // route d'atterrissage dans l'app démo
  prefix: string;    // préfixe de route cible (cf. doc §7.1)
  tone: 'ok' | 'info' | 'amber';
}

export const SPACES: Record<SurfaceKey, SpaceDef> = {
  backoffice: { key: 'backoffice', label: 'Administration RH', sub: 'Back-office', icon: LayoutDashboard, landing: '/', prefix: '/hr', tone: 'amber' },
  mss: { key: 'mss', label: 'Mon équipe', sub: 'Manager', icon: Users, landing: '/team', prefix: '/team', tone: 'info' },
  ess: { key: 'ess', label: 'Mon espace', sub: 'Employé', icon: Smartphone, landing: '/espace', prefix: '/me', tone: 'ok' },
};

export type Role =
  | 'employee' | 'manager' | 'hr' | 'drh' | 'payroll'
  | 'compliance' | 'occupational_doctor' | 'admin' | 'security_admin';

const BACKOFFICE_ROLES: Role[] = ['hr', 'drh', 'payroll', 'compliance', 'occupational_doctor', 'admin', 'security_admin'];

/** Espaces accessibles selon les rôles (tout le monde a ESS). Ordre stable. */
export function spacesForRoles(roles: Role[]): SurfaceKey[] {
  const set = new Set<SurfaceKey>(['ess']);
  if (roles.includes('manager')) set.add('mss');
  if (roles.some((r) => BACKOFFICE_ROLES.includes(r))) set.add('backoffice');
  return (['backoffice', 'mss', 'ess'] as SurfaceKey[]).filter((k) => set.has(k));
}

/** Utilisateur connecté (démo) — DRH qui manage aussi une équipe → 3 espaces.
 *  En production : fourni par le SSO Atlas Studio Core. */
export const DEMO_USER = {
  name: 'Valentina Okou',
  title: 'DRH · Atlas Demo',
  roles: ['drh', 'manager', 'employee'] as Role[],
};
