/**
 * Catalogue produit Atlas People — source unique des 5 formules.
 *
 * Les 5 produits commercialisés (Core, Conseil, Payroll, 360, Placement) sont
 * un seul logiciel décliné en 5 modes de workspace (`TenantType`). Ce module
 * porte la fiche commerciale de chaque formule et la table de correspondance
 * utilisée par :
 *   • la landing publique       → cartes des formules
 *   • la sous-landing produit   → /produits/<slug> (connexion ou souscription)
 *   • la page de connexion      → produit visé et routage après login
 */
import { Building2, Briefcase, Wallet, LayoutGrid, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TenantType } from '../store/useAppStore';

export interface Product {
  /** Slug public, utilisé dans les URL (`/produits/payroll`). */
  slug: string;
  /** Mode de workspace correspondant. */
  tenantType: TenantType;
  icon: LucideIcon;
  productName: string;
  /** Libellé du mode (badge). */
  mode: string;
  label: string;
  sub: string;
  /** Description courte — carte de la landing. */
  description: string;
  /** Accroche longue — hero de la sous-landing. */
  pitch: string;
  tags: string[];
  /** Ce que la formule apporte concrètement. */
  highlights: string[];
  /** À qui elle s'adresse. */
  forWho: string[];
  /** Repère tarifaire affiché sur la sous-landing. */
  pricing: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  accentBtn: string;
}

/* Ordre officiel : Core → Conseil → Payroll → 360 → Placement */
export const PRODUCTS: Product[] = [
  {
    slug: 'core',
    tenantType: 'entreprise',
    icon: Building2,
    productName: 'Atlas People Core',
    mode: 'Entreprise',
    label: 'Entreprise',
    sub: 'PME · ETI · Groupe multi-filiales',
    description: 'Vous gérez directement vos propres collaborateurs. Accès complet aux 14 modules RH, paie déterministe, ESS mobile.',
    pitch: 'Le SIRH complet pour gérer vos propres collaborateurs : dossier, temps, paie déterministe, talents et conformité OHADA dans un seul workspace.',
    tags: ['Auto-gestion RH', '14 modules', 'Multi-pays OHADA'],
    highlights: [
      'Les 14 modules RH ouverts : du dossier collaborateur à la conformité SST.',
      'Paie déterministe : à entrées identiques, le bulletin se reproduit à l\'identique.',
      'Espaces dédiés collaborateur (ESS) et manager (MSS), y compris sur mobile.',
      'Cockpit DRH unifié : effectif, masse salariale, absences et talents en temps réel.',
    ],
    forWho: [
      'PME et ETI qui internalisent leur RH et leur paie',
      'Groupes multi-filiales opérant dans plusieurs pays OHADA',
      'Directions RH qui veulent un cockpit unique plutôt que des tableurs',
    ],
    pricing: 'À partir de 8 000 FCFA / collaborateur / mois (Starter) · Business et Enterprise disponibles',
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-700',
    accentBorder: 'border-amber-200',
    accentBtn: 'bg-amber-deep text-white hover:opacity-90',
  },
  {
    slug: 'conseil',
    tenantType: 'cabinet_complet',
    icon: Briefcase,
    productName: 'Atlas People Conseil',
    mode: 'Cabinet complet',
    label: 'Cabinet RH & Conseil',
    sub: 'Externalisation RH complète',
    description: 'Votre cabinet prend en charge la gestion RH et administrative complète pour des entreprises clientes.',
    pitch: 'Pilotez la RH et la paie de vos entreprises clientes depuis un portefeuille unique, avec un périmètre étanche par client.',
    tags: ['Multi-clients', 'RH + Paie tiers', 'Reporting cabinet'],
    highlights: [
      'Portefeuille clients : chaque dossier isolé, basculement en un clic.',
      'RH et paie complètes pour le compte de tiers, sur les 14 régimes OHADA.',
      'Préfacturation des prestations et rapport cabinet consolidé.',
      'Interface client : vos clients consultent leurs indicateurs sans accéder au back-office.',
    ],
    forWho: [
      'Cabinets RH et cabinets de conseil en externalisation',
      'Experts-comptables qui ajoutent une offre RH complète',
      'Structures gérant plusieurs entités juridiques distinctes',
    ],
    pricing: 'Tarification par client géré — devis sous 24 h ouvrées',
    accentBg: 'bg-teal-50',
    accentText: 'text-teal-700',
    accentBorder: 'border-teal-200',
    accentBtn: 'bg-teal-600 text-white hover:opacity-90',
  },
  {
    slug: 'payroll',
    tenantType: 'cabinet_paie',
    icon: Wallet,
    productName: 'Atlas Payroll',
    mode: 'Cabinet paie',
    label: 'Bureau de paie',
    sub: 'Externalisation paie & admin',
    description: 'Votre bureau traite la paie pour des entreprises clientes. Bulletins en lot, DSN consolidée, 14 régimes OHADA.',
    pitch: 'Le poste de travail du bureau de paie : production en lot, contrôle avant émission et déclarations consolidées multi-clients.',
    tags: ['Paie multi-clients', 'Bulletins en lot', 'DSN consolidée'],
    highlights: [
      'Production des bulletins en lot sur tout un portefeuille client.',
      'DSN et déclarations consolidées, 14 régimes UEMOA + CEMAC.',
      'Contrôles bloquants avant émission : aucune anomalie ne passe en silence.',
      'Préfacturation et rapport cabinet pour suivre la rentabilité par client.',
    ],
    forWho: [
      'Bureaux et cabinets spécialisés en paie',
      'Prestataires d\'externalisation paie multi-pays',
      'Services paie mutualisés d\'un groupe',
    ],
    pricing: 'Tarification au bulletin produit — devis sous 24 h ouvrées',
    accentBg: 'bg-blue-50',
    accentText: 'text-blue-700',
    accentBorder: 'border-blue-200',
    accentBtn: 'bg-blue-600 text-white hover:opacity-90',
  },
  {
    slug: '360',
    tenantType: 'cabinet_mixte',
    icon: LayoutGrid,
    productName: 'Atlas People 360',
    mode: 'Cabinet mixte',
    label: 'Structure mixte',
    sub: 'RH interne + clients tiers',
    description: 'Vous gérez vos propres salariés ET des entreprises clientes. Deux périmètres distincts, un seul workspace Atlas People.',
    pitch: 'Vos salariés d\'un côté, vos clients de l\'autre : deux périmètres étanches, une seule connexion et un reporting commun.',
    tags: ['RH interne', 'Multi-clients', 'Double périmètre'],
    highlights: [
      'Périmètre « Mon équipe » : la RH complète de vos propres salariés.',
      'Périmètre « Mes clients » : portefeuille, préfacturation, rapport cabinet.',
      'Cloisonnement des données entre interne et clients, sans double saisie.',
      'Un seul abonnement, un seul workspace, deux métiers.',
    ],
    forWho: [
      'Cabinets qui emploient leurs propres équipes et servent des clients',
      'Structures en transition de la RH interne vers l\'offre de services',
      'Groupes avec un centre de services partagés facturé aux filiales',
    ],
    pricing: 'Forfait interne + tarification par client géré — devis sous 24 h ouvrées',
    accentBg: 'bg-violet-50',
    accentText: 'text-violet-700',
    accentBorder: 'border-violet-200',
    accentBtn: 'bg-violet-600 text-white hover:opacity-90',
  },
  {
    slug: 'placement',
    tenantType: 'cabinet_agence',
    icon: Users,
    productName: 'Atlas People Placement',
    mode: 'Agence MAD',
    label: 'Agence de mise à disposition',
    sub: 'Intérim · staffing · prêt de main-d\'œuvre',
    description: 'Vous êtes l\'employeur légal de travailleurs placés chez des entreprises clientes. RH, paie et conformité centralisées.',
    pitch: 'Vous employez, vos clients accueillent : suivi des travailleurs placés, contrats de mission et paie centralisée, site par site.',
    tags: ['Employeur légal', 'Travailleurs placés', 'Multi-sites clients'],
    highlights: [
      'Fiche travailleur placé : mission en cours, site d\'affectation, historique.',
      'Contrats de mission et administration du personnel centralisés.',
      'Paie et temps de tous les placés, quel que soit le site client.',
      'Conformité et rapport agence : vous restez l\'employeur légal, sans zone d\'ombre.',
    ],
    forWho: [
      'Agences d\'intérim et de mise à disposition de personnel',
      'Sociétés de staffing et de portage',
      'Prestataires opérant sur plusieurs sites clients',
    ],
    pricing: 'Tarification au travailleur placé — devis sous 24 h ouvrées',
    accentBg: 'bg-rose-50',
    accentText: 'text-rose-700',
    accentBorder: 'border-rose-200',
    accentBtn: 'bg-rose-600 text-white hover:opacity-90',
  },
];

/** Slug public d'un produit, indexé par mode de workspace. */
export const PRODUCT_SLUG: Record<TenantType, string> = PRODUCTS.reduce(
  (acc, p) => { acc[p.tenantType] = p.slug; return acc; },
  {} as Record<TenantType, string>,
);

/**
 * Alias acceptés en entrée. On tolère les anciennes clés du catalogue Atlas
 * Studio (`atlas-people-core`…) pour que les liens déjà diffusés ouvrent le bon
 * produit, ainsi que les `TenantType` bruts.
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

/** Résout un slug d'URL en fiche produit, ou null si inconnu. */
export function productFromSlug(slug: string | null | undefined): Product | null {
  const tenantType = tenantTypeFromSlug(slug);
  return tenantType ? (PRODUCTS.find((p) => p.tenantType === tenantType) ?? null) : null;
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

/** Sous-landing publique d'un produit. */
export function productPath(product: Product): string {
  return `/produits/${product.slug}`;
}

/** Lien de connexion ciblant un produit précis. */
export function loginPathForProduct(tenantType: TenantType): string {
  return `/login?produit=${PRODUCT_SLUG[tenantType]}`;
}
