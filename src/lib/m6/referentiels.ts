/**
 * M6 ONBOARDING — référentiels du module Intégration.
 * Milestones, catégories de tâches, templates par profil, formations
 * obligatoires, documents de bienvenue, questions pulse.
 */
import type {
  MilestoneCode, OnboardingMilestone, OnboardingTemplate, TaskCategory,
  MandatoryTraining, WelcomeDocument, OwnerRole,
} from './types';

// ─────────────────────────────────────── Milestones 30/60/90
export const MILESTONES: OnboardingMilestone[] = [
  { code: 'PRE_J7', label: 'Avant arrivée (J-7)',     daysFromHire: -7, required: true },
  { code: 'J0',     label: "Jour d'accueil (J0)",     daysFromHire: 0,  required: true },
  { code: 'J7',     label: 'Semaine 1 (J+7)',         daysFromHire: 7,  required: true },
  { code: 'J30',    label: 'Mois 1 (J+30)',           daysFromHire: 30, required: true },
  { code: 'J60',    label: 'Mois 2 (J+60)',           daysFromHire: 60, required: true },
  { code: 'J90',    label: 'Fin onboarding (J+90)',   daysFromHire: 90, required: true },
];

export const MILESTONE_META: Record<MilestoneCode, { label: string; tone: 'amber' | 'info' | 'ok' | 'warn' | 'neutral' }> = {
  PRE_J7: { label: 'Avant arrivée', tone: 'amber' },
  J0:     { label: 'Jour 0',        tone: 'info' },
  J7:     { label: 'Semaine 1',     tone: 'info' },
  J30:    { label: 'Mois 1',        tone: 'amber' },
  J60:    { label: 'Mois 2',        tone: 'amber' },
  J90:    { label: 'Fin (J+90)',    tone: 'ok' },
};

// ─────────────────────────────────────── Catégories de tâches
export const TASK_CATEGORY_META: Record<TaskCategory, { label: string; tone: 'ok' | 'amber' | 'info' | 'warn' | 'neutral'; icon: string }> = {
  ADMIN:     { label: 'Administratif',     tone: 'amber',   icon: 'FileSignature' },
  IT:        { label: 'IT & équipement',   tone: 'info',    icon: 'Laptop' },
  WORKSPACE: { label: "Poste de travail",  tone: 'neutral', icon: 'MapPin' },
  FORMATION: { label: 'Formations',        tone: 'info',    icon: 'GraduationCap' },
  BUDDY:     { label: 'Buddy / mentor',    tone: 'ok',      icon: 'Users' },
  TEAM:      { label: 'Équipe & rituels',  tone: 'ok',      icon: 'Users' },
  BUSINESS:  { label: 'Business / projets',tone: 'amber',   icon: 'Target' },
  CULTURE:   { label: 'Culture Atlas',     tone: 'neutral', icon: 'Sparkles' },
};

export const OWNER_LABEL: Record<OwnerRole, string> = {
  rh:       'RH',
  manager:  'Manager',
  it:       'IT',
  office:   'Office',
  buddy:    'Buddy',
  newcomer: 'Nouveau collaborateur',
};

// ─────────────────────────────────────── Templates de parcours
export const TEMPLATES: OnboardingTemplate[] = [
  { code: 'STD_CADRE',     label: 'Standard Cadre',         description: 'Parcours 90 jours pour tout cadre Atlas',                     appliesTo: 'Tous cadres',           durationDays: 90, taskCount: 38, active: true },
  { code: 'TECH',          label: 'Tech / Engineering',     description: 'Parcours dédié Tech : env dev, code review, on-call',         appliesTo: 'Tech',                  durationDays: 90, taskCount: 44, active: true },
  { code: 'COMMERCIAL',    label: 'Commercial',             description: 'Parcours commercial : produit, CRM, accompagnement terrain',  appliesTo: 'Ventes',                durationDays: 90, taskCount: 40, active: true },
  { code: 'MANAGER',       label: 'Manager / Lead',         description: 'Parcours manager : équipe, OKRs, rituels, RH 360°',           appliesTo: 'Manager / Director',    durationDays: 90, taskCount: 46, active: true },
  { code: 'STAGE',         label: 'Stage / Apprenti',       description: "Parcours light pour stagiaire ou apprenti",                     appliesTo: 'STAGE / APPR',         durationDays: 30, taskCount: 22, active: true },
];

// ─────────────────────────────────────── Tâches standard par milestone
// Une bibliothèque de référence, utilisée pour générer le mock par parcours.
export interface TaskBlueprint {
  title: string;
  category: TaskCategory;
  milestone: MilestoneCode;
  ownerRole: OwnerRole;
  blocking?: boolean;
}
export const TASK_LIBRARY: TaskBlueprint[] = [
  // PRE-J7 — préparation
  { title: 'Signature contrat ADVIST',                 category: 'ADMIN', milestone: 'PRE_J7', ownerRole: 'rh', blocking: true },
  { title: 'Dépôt DPAE auprès organisme social',       category: 'ADMIN', milestone: 'PRE_J7', ownerRole: 'rh', blocking: true },
  { title: 'Création comptes IT (email, Slack)',       category: 'IT',    milestone: 'PRE_J7', ownerRole: 'it', blocking: true },
  { title: 'Préparation équipement (laptop, casque)',  category: 'IT',    milestone: 'PRE_J7', ownerRole: 'it' },
  { title: 'Attribution bureau & badge',               category: 'WORKSPACE', milestone: 'PRE_J7', ownerRole: 'office' },
  { title: 'Envoi welcome pack au domicile',           category: 'CULTURE', milestone: 'PRE_J7', ownerRole: 'rh' },
  { title: 'Désignation buddy',                        category: 'BUDDY',   milestone: 'PRE_J7', ownerRole: 'manager' },
  { title: 'Programmation entretiens 1-1 stakeholders', category: 'TEAM',  milestone: 'PRE_J7', ownerRole: 'manager' },

  // J0 — accueil
  { title: 'Visite des locaux & présentation équipe',  category: 'TEAM',    milestone: 'J0', ownerRole: 'manager' },
  { title: 'Remise badge + équipement IT',             category: 'IT',      milestone: 'J0', ownerRole: 'it', blocking: true },
  { title: 'Signature charte IT & RGPD',               category: 'ADMIN',   milestone: 'J0', ownerRole: 'newcomer', blocking: true },
  { title: 'Formation sécurité incendie',              category: 'FORMATION', milestone: 'J0', ownerRole: 'office', blocking: true },
  { title: 'Photo professionnelle',                    category: 'ADMIN',   milestone: 'J0', ownerRole: 'newcomer' },
  { title: 'Petit-déjeuner d\'accueil',                 category: 'CULTURE', milestone: 'J0', ownerRole: 'rh' },
  { title: 'Première rencontre buddy',                 category: 'BUDDY',   milestone: 'J0', ownerRole: 'buddy' },

  // J7 — première semaine
  { title: 'Setup environnement de travail complet',   category: 'IT',      milestone: 'J7', ownerRole: 'newcomer' },
  { title: 'Formation RGPD',                            category: 'FORMATION', milestone: 'J7', ownerRole: 'newcomer', blocking: true },
  { title: 'Formation anti-corruption OHADA',          category: 'FORMATION', milestone: 'J7', ownerRole: 'newcomer', blocking: true },
  { title: 'Présentation produit Atlas',               category: 'BUSINESS', milestone: 'J7', ownerRole: 'manager' },
  { title: '3 premiers entretiens 1-1 (key people)',   category: 'TEAM',     milestone: 'J7', ownerRole: 'newcomer' },
  { title: 'Définition objectifs 30/60/90',            category: 'BUSINESS', milestone: 'J7', ownerRole: 'manager', blocking: true },
  { title: 'Pulse J+7',                                 category: 'CULTURE', milestone: 'J7', ownerRole: 'newcomer' },

  // J30 — fin mois 1
  { title: 'Point manager 30 jours',                   category: 'BUSINESS', milestone: 'J30', ownerRole: 'manager' },
  { title: 'Compléter formations e-learning produit',  category: 'FORMATION', milestone: 'J30', ownerRole: 'newcomer' },
  { title: 'Premier livrable concret',                 category: 'BUSINESS', milestone: 'J30', ownerRole: 'newcomer' },
  { title: '1-1 buddy hebdomadaire continu',           category: 'BUDDY',    milestone: 'J30', ownerRole: 'buddy' },
  { title: 'Pulse J+30',                                category: 'CULTURE', milestone: 'J30', ownerRole: 'newcomer' },

  // J60 — fin mois 2
  { title: 'Évaluation intermédiaire période d\'essai',category: 'ADMIN',    milestone: 'J60', ownerRole: 'manager', blocking: true },
  { title: 'Revue compétences acquises',               category: 'BUSINESS', milestone: 'J60', ownerRole: 'manager' },
  { title: 'Pulse J+60',                                category: 'CULTURE', milestone: 'J60', ownerRole: 'newcomer' },

  // J90 — clôture
  { title: 'Décision période d\'essai (lien M4)',      category: 'ADMIN',    milestone: 'J90', ownerRole: 'manager', blocking: true },
  { title: 'Bilan onboarding manager',                 category: 'BUSINESS', milestone: 'J90', ownerRole: 'manager' },
  { title: 'Pulse final J+90 + NPS',                   category: 'CULTURE',  milestone: 'J90', ownerRole: 'newcomer', blocking: true },
  { title: 'Transition vers parcours collaborateur',    category: 'CULTURE', milestone: 'J90', ownerRole: 'rh' },
];

// ─────────────────────────────────────── Formations obligatoires
export const MANDATORY_TRAININGS: MandatoryTraining[] = [
  { code: 'SAFETY',      label: 'Sécurité incendie & évacuation',   durationHours: 1, format: 'classroom', required: true },
  { code: 'RGPD',        label: 'RGPD & protection données',         durationHours: 2, format: 'elearning', required: true },
  { code: 'OHADA_ETHIC', label: 'Conduite éthique & anti-corruption OHADA', durationHours: 2, format: 'elearning', required: true },
  { code: 'PRODUCT',     label: 'Produit Atlas — fondamentaux',      durationHours: 4, format: 'mixed',     required: true },
  { code: 'HARASSMENT',  label: 'Prévention harcèlement',            durationHours: 1, format: 'elearning', required: true },
  { code: 'COMPLIANCE',  label: 'Compliance & secret professionnel', durationHours: 1, format: 'elearning', required: true },
  { code: 'IT_SECURITY', label: 'Sécurité IT — sensibilisation',     durationHours: 1, format: 'elearning', required: true },
];

// ─────────────────────────────────────── Welcome pack — documents
export const WELCOME_DOCS: WelcomeDocument[] = [
  { code: 'LIVRET',        label: "Livret d'accueil Atlas",       category: 'livret',      signatureRequired: false },
  { code: 'CHARTE_IT',     label: 'Charte informatique',          category: 'charte',      signatureRequired: true  },
  { code: 'CHARTE_RGPD',   label: 'Charte protection des données', category: 'charte',     signatureRequired: true  },
  { code: 'REGLEMENT',     label: 'Règlement intérieur',          category: 'process',     signatureRequired: true  },
  { code: 'ORGANIGRAMME',  label: 'Organigramme Atlas',           category: 'organigramme',signatureRequired: false },
  { code: 'GUIDE_OUTILS',  label: 'Guide outils internes',        category: 'guide',       signatureRequired: false },
  { code: 'GUIDE_ESPACE',  label: "Guide Mon Espace (portail)",   category: 'guide',       signatureRequired: false },
  { code: 'CODE_VALEURS',  label: 'Code & valeurs Atlas',         category: 'guide',       signatureRequired: false },
  { code: 'ETHIQUE',       label: 'Code éthique OHADA',           category: 'charte',      signatureRequired: true  },
];

// ─────────────────────────────────────── Questions pulse
export const PULSE_QUESTIONS = {
  J7: [
    "Ma première semaine s'est bien passée",
    "J'ai eu un accueil chaleureux",
    "Mes accès et équipements étaient prêts",
    "Mon buddy est disponible et présent",
  ],
  J30: [
    "Je comprends mon rôle et mes responsabilités",
    "J'ai les ressources pour réussir",
    "Le manager me donne du feedback constructif",
    "Je suis aligné·e avec la culture Atlas",
  ],
  J60: [
    "Je progresse vers mes objectifs",
    "Je collabore efficacement avec l'équipe",
    "J'ai eu une évaluation intermédiaire claire",
    "Je me projette à 1 an chez Atlas",
  ],
  J90: [
    "Mon parcours d'intégration a été à la hauteur",
    "Je me sens pleinement intégré·e",
    "Je recommanderais Atlas comme employeur",
    "L'onboarding m'a permis d'être productif·ve rapidement",
  ],
} as const;

// ─────────────────────────────────────── SLA & KPIs
export const ONBOARDING_SLA = {
  preJ7Deadline: 7,             // tâches PRE_J7 complétées avant arrivée
  blockingTaskMaxDelay: 3,      // jours de retard max sur une tâche bloquante
  pulseSubmissionDeadline: 5,   // jours après le jalon pour répondre au pulse
  npsTargetMin: 50,             // NPS minimum acceptable
  completionTargetPct: 90,      // % tâches complétées en fin d'onboarding
  timeToProductivityTargetDays: 60,
};
