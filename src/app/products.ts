/**
 * Catalogue produit Atlas People — correspondance slug public ↔ mode de tenant.
 *
 * Les 5 produits commercialisés (Core, Conseil, Payroll, 360, Placement) sont
 * un seul logiciel décliné en 5 modes de workspace (`TenantType`). Ce module
 * porte la table de correspondance utilisée par :
 *   • la landing publique  → construire les liens « Se connecter » par produit
 *   • la page de connexion → afficher le produit visé et router après login
 */
import type { TenantType } from '../store/useAppStore';

/** Slug public d'un produit, utilisé dans les URL (`/login?produit=payroll`). */
export const PRODUCT_SLUG: Record<TenantType, string> = {
  entreprise: 'core',
  cabinet_complet: 'conseil',
  cabinet_paie: 'payroll',
  cabinet_mixte: '360',
  cabinet_agence: 'placement',
};

/**
 * Alias acceptés en entrée. On tolère les anciennes clés du catalogue Atlas
 * Studio (`atlas-people-core`…) pour que les liens déjà diffusés continuent
 * d'ouvrir la bonne connexion, ainsi que les `TenantType` bruts.
 */
const SLUG_ALIASES: Record<string, TenantType> = {
  core: 'entreprise',
  conseil: 'cabinet_complet',
  payroll: 'cabinet_paie',
  '360': 'cabinet_mixte',
  placement: 'cabinet_agence',
  'atlas-people-core': 'entreprise',
  'atlas-people-conseil': 'cabinet_complet',
  'atlas-payroll': 'cabinet_paie',
  'atlas-people-360': 'cabinet_mixte',
  'atlas-people-placement': 'cabinet_agence',
  entreprise: 'entreprise',
  cabinet_complet: 'cabinet_complet',
  cabinet_paie: 'cabinet_paie',
  cabinet_mixte: 'cabinet_mixte',
  cabinet_agence: 'cabinet_agence',
};

/** Résout un slug d'URL en mode de tenant, ou null si inconnu. */
export function tenantTypeFromSlug(slug: string | null | undefined): TenantType | null {
  if (!slug) return null;
  return SLUG_ALIASES[slug.trim().toLowerCase()] ?? null;
}

/**
 * Route d'accueil du produit une fois connecté.
 * Aligné sur `HomeDispatch` (App.tsx) : les cabinets entrent par leur
 * portefeuille clients, l'agence par ses travailleurs placés.
 */
export const PRODUCT_HOME: Record<TenantType, string> = {
  entreprise: '/',
  cabinet_complet: '/clients',
  cabinet_paie: '/clients',
  cabinet_mixte: '/clients',
  cabinet_agence: '/travailleurs-places',
};

/** Lien de connexion ciblant un produit précis. */
export function loginPathForProduct(tenantType: TenantType): string {
  return `/login?produit=${PRODUCT_SLUG[tenantType]}`;
}
