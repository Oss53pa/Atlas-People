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

// ─────────────────────────────────────── Templates de parcours — bibliothèque 20 standards (doc 02)
export type ParcoursFamily = 'cadre' | 'maitrise' | 'employe' | 'ops' | 'specifique' | 'interne';
export interface OnboardingTemplateRef extends OnboardingTemplate { family: ParcoursFamily; flags?: ('remote' | 'expat' | 'internal_mobility' | 'graduate')[] }
export const TEMPLATES: OnboardingTemplateRef[] = [
  // CADRES
  { code: 'ONB-CADRE-A-DIRECTION',  family: 'cadre',      label: 'Cadre A · Direction',           description: 'Direction/Comex · plan 100 j · présentation Comex J+90 · coaching exécutif',     appliesTo: 'Direction · essai 6 mois',   durationDays: 90,  taskCount: 52, active: true },
  { code: 'ONB-CADRE-B-CONFIRME',   family: 'cadre',      label: 'Cadre B · Confirmé',            description: 'Parcours le plus complet · 5 phases · 30/60/90 · scorecard complète',          appliesTo: 'Cadres / managers',           durationDays: 90,  taskCount: 105, active: true },
  { code: 'ONB-CADRE-C-JEUNE',      family: 'cadre',      label: 'Cadre C · Jeune diplômé',       description: 'Programme graduate · rotation 2 sem · réseautage promo · fondamentaux Atlas', appliesTo: 'Jeunes diplômés',             durationDays: 90,  taskCount: 88, active: true, flags: ['graduate'] },
  { code: 'ONB-CADRE-EXPAT',        family: 'cadre',      label: 'Cadre · Expatrié',              description: 'Pré-mobilité J-90 · permis travail · famille · culture · 6 mois',             appliesTo: 'Expatriés OHADA',             durationDays: 180, taskCount: 142, active: true, flags: ['expat'] },
  // MAÎTRISE
  { code: 'ONB-MAITRISE-TECH',      family: 'maitrise',   label: 'Maîtrise · Technique',          description: 'Formations techniques · évals 30/60',                                          appliesTo: 'Maîtrise technique',          durationDays: 60,  taskCount: 48, active: true },
  { code: 'ONB-MAITRISE-COMMERCIAL',family: 'maitrise',   label: 'Maîtrise · Commerciale',        description: 'Produit · CRM · accompagnement senior',                                          appliesTo: 'Maîtrise commerciale',        durationDays: 60,  taskCount: 44, active: true },
  { code: 'ONB-MAITRISE-ADMIN',     family: 'maitrise',   label: 'Maîtrise · Administrative',     description: 'Procédures internes · outils SIRH · process',                                    appliesTo: 'Maîtrise administrative',     durationDays: 60,  taskCount: 40, active: true },
  // EMPLOYÉS
  { code: 'ONB-EMPLOYE-BUREAU',     family: 'employe',    label: 'Employé · Bureau',              description: 'Accueil 30 j · outils · process',                                                appliesTo: 'Employés bureau',             durationDays: 30,  taskCount: 24, active: true },
  { code: 'ONB-EMPLOYE-COMMERCE',   family: 'employe',    label: 'Employé · Commerce',            description: 'Produits J+1→J+5 · accompagnement senior · 1er client J+10',                   appliesTo: 'Vendeurs / commerce',         durationDays: 30,  taskCount: 28, active: true },
  { code: 'ONB-EMPLOYE-OUVRIER',    family: 'employe',    label: 'Employé · Ouvrier',             description: 'HSSE · poste de travail · binôme atelier',                                       appliesTo: 'Ouvriers',                    durationDays: 30,  taskCount: 22, active: true },
  // OPS / TERRAIN
  { code: 'ONB-AGENT-SECURITE',     family: 'ops',        label: 'Agent · Sécurité',              description: 'HSSE J+1→J+7 · shadow J+5→J+15 · tests aptitude J+15',                          appliesTo: 'Agents sécurité',             durationDays: 30,  taskCount: 26, active: true },
  { code: 'ONB-AGENT-ENTRETIEN',    family: 'ops',        label: 'Agent · Entretien',             description: 'Sécurité produits · protocoles · binôme',                                        appliesTo: 'Agents entretien',            durationDays: 30,  taskCount: 18, active: true },
  { code: 'ONB-AGENT-MAINTENANCE',  family: 'ops',        label: 'Agent · Maintenance',           description: 'Habilitations · sécurité électrique · interventions',                            appliesTo: 'Agents maintenance',          durationDays: 30,  taskCount: 22, active: true },
  { code: 'ONB-MANAGER-CC',         family: 'ops',        label: 'Manager · Centre commercial',   description: 'Pilotage opérationnel · animations · sécurité site',                             appliesTo: 'Centres commerciaux',         durationDays: 60,  taskCount: 38, active: true },
  // SPÉCIFIQUES
  { code: 'ONB-TELETRAVAIL-FULL',   family: 'specifique', label: 'Télétravail · Full remote',     description: 'Livraison matériel · visite site 1-2 j · buddy virtuel · cafés virtuels',       appliesTo: 'Full remote',                 durationDays: 60,  taskCount: 32, active: true, flags: ['remote'] },
  { code: 'ONB-TELETRAVAIL-HYBRIDE',family: 'specifique', label: 'Télétravail · Hybride',         description: 'Mix présentiel/distance · rituels hybrides',                                     appliesTo: 'Hybride 2-3 j/sem',           durationDays: 60,  taskCount: 30, active: true, flags: ['remote'] },
  { code: 'ONB-ALTERNANT',          family: 'specifique', label: 'Alternant / Apprenti',           description: 'Tuteur · lien CFA · suivi double · contrats apprentissage',                     appliesTo: 'Alternance / apprentissage',  durationDays: 90,  taskCount: 26, active: true },
  { code: 'ONB-STAGIAIRE',          family: 'specifique', label: 'Stagiaire',                     description: 'Livrable rapport · éval fin stage · convention',                                  appliesTo: 'Stagiaires',                  durationDays: 30,  taskCount: 18, active: true },
  { code: 'ONB-CDD-COURT',          family: 'specifique', label: 'CDD court (< 3 mois)',           description: 'Onboarding allégé · focus opérationnel',                                          appliesTo: 'CDD courts',                  durationDays: 14,  taskCount: 12, active: true },
  // MOBILITÉ INTERNE
  { code: 'ONB-INTERNE-PROMOTION',  family: 'interne',    label: 'Mobilité · Promotion',          description: 'Évolution hiérarchique même service · 15-30 j',                                   appliesTo: 'Promotions internes',         durationDays: 30,  taskCount: 16, active: true, flags: ['internal_mobility'] },
  { code: 'ONB-INTERNE-MUTATION',   family: 'interne',    label: 'Mobilité · Mutation',           description: 'Changement service/direction · 30-45 j',                                          appliesTo: 'Mutations internes',          durationDays: 45,  taskCount: 22, active: true, flags: ['internal_mobility'] },
  { code: 'ONB-INTERNE-GEO',        family: 'interne',    label: 'Mobilité · Géographique',       description: 'Changement site sans changement métier · 15 j',                                  appliesTo: 'Mobilité site',               durationDays: 15,  taskCount: 10, active: true, flags: ['internal_mobility'] },
  { code: 'ONB-INTERNE-RECONV',     family: 'interne',    label: 'Mobilité · Reconversion',       description: 'Changement métier + service · ≈ onboarding externe',                               appliesTo: 'Reconversions',               durationDays: 60,  taskCount: 30, active: true, flags: ['internal_mobility'] },
  { code: 'ONB-INTERNE-RETOUR',     family: 'interne',    label: 'Mobilité · Retour longue absence', description: 'Après absence > 6 mois (sabbatique, parental, maladie, détachement)',         appliesTo: 'Retours absence longue',      durationDays: 30,  taskCount: 14, active: true, flags: ['internal_mobility'] },
  { code: 'ONB-INTERNE-DIRIGEANT',  family: 'interne',    label: 'Mobilité · Promotion dirigeant', description: 'Promotion direction · plan 100 j Comex · coaching 6 mois',                       appliesTo: 'Nouveaux dirigeants',          durationDays: 90,  taskCount: 38, active: true, flags: ['internal_mobility'] },
];

export const PARCOURS_FAMILY_META: Record<ParcoursFamily, { label: string; tone: 'amber' | 'info' | 'ok' | 'neutral' }> = {
  cadre:       { label: 'Cadres',       tone: 'amber'   },
  maitrise:    { label: 'Maîtrise',     tone: 'info'    },
  employe:     { label: 'Employés',     tone: 'ok'      },
  ops:         { label: 'Ops / terrain',tone: 'neutral' },
  specifique:  { label: 'Spécifiques',  tone: 'info'    },
  interne:     { label: 'Mobilité interne', tone: 'amber' },
};

// ─────────────────────────────────────── Mobilité interne — sous-types & règles
export const INTERNAL_MOBILITY_RULES = {
  noChartesIfNoMajorChange: true,
  noWelcomeBook: true,
  noPeriodEssaiSaufReconv: true,
  emailConserve: true,
  equipmentConserve: true,
  managementFormation40h: true,
  filetSecuriteRetourAncienPoste: '3 à 6 mois (paramétrable tenant)',
  declencheurAvenantM4: true,
};
export const INTERNAL_MOBILITY_GRID = [
  { dim: 'Adaptation métier',          weight: 40 },
  { dim: 'Intégration équipe',         weight: 20 },
  { dim: 'Performance opérationnelle', weight: 25 },
  { dim: 'Satisfaction',               weight: 15 },
];

// ─────────────────────────────────────── Expat — règles OHADA & KPIs
export const EXPAT_RULES = {
  permitTravailMaxDays: 90,        // ministère Travail CI ~60 j d'instruction · cible < 90 j
  visaFamilleMaxDays: 60,
  logementMaxDaysPostArrivee: 30,
  ecoleMaxDaysPostArrivee: 15,
  noArrivalWithoutPermit: true,    // règle dure
  earlyTerminationProtocole: 'rapatriement + rachat bail + déménagement + indemnités contractuelles',
};
export const EXPAT_KPIS = [
  { label: 'Permis travail obtenu',         target: '< 90 j' },
  { label: 'Visas famille obtenus',         target: '< 60 j' },
  { label: 'Logement définitif',            target: '< 30 j post-arrivée' },
  { label: 'École enfants inscrits',        target: '< 15 j post-arrivée' },
  { label: 'Score adaptation expat & famille', target: '> 4 / 5 à 6 mois' },
  { label: 'Taux rupture < 1 an',           target: '< 5 %' },
  { label: 'Renouvellement contrat 3 ans',  target: '> 80 %' },
];
export const EXPAT_ACTEURS = [
  'Chargé mobilité internationale (coordination)',
  'Cabinet juridique / avocat (visas, permis)',
  'Cabinet relocation (logement, école, services)',
  'Formateur interculturel',
  'Mentor expat (autre expatrié installé 2+ ans, RDV mensuels 6 mois)',
  'Famille (conjoint, enfants)',
];
export const EXPAT_PHASES = [
  { code: 'PRE_J90',   label: 'Pré-mobilité (J-90 → J-1)',  detail: 'Décision · visa/permis · logement/école · déménagement' },
  { code: 'INIT_J30',  label: 'Phase 1 · intégration (J+1 → J+30)', detail: 'Accueil · papiers · réseau' },
  { code: 'GROW_J90',  label: 'Phase 2 · montée en compétence (J+31 → J+90)', detail: 'Prise en main · résultats' },
  { code: 'CONSO_J180',label: 'Phase 3 · consolidation (J+91 → J+180)', detail: 'Bilan 6 mois · validation essai · point famille' },
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
