/**
 * M11 FORMATION — référentiels (catégories, modalités, Kirkpatrick, FDFP, ROI).
 */
import type {
  LearningModality, LearningCategory, LearningLevel, LearningProvider,
  CourseStatus, PlanStatus, PlanItemStatus, PlanOrigin,
  SessionStatus, SessionDeliveryMode, RegistrationStatus,
  KirkpatrickLevel, KirkpatrickStatus,
  CertificationStatus, FdfpDeclarationStatus,
} from './types';

// ─────────────────── Modalités
export const MODALITY_META: Record<LearningModality, { label: string; description: string; icon: string }> = {
  e_learning:         { label: 'E-learning',         description: 'Auto-formation asynchrone (LMS, MOOC)',         icon: 'monitor' },
  classroom:          { label: 'Présentiel',         description: 'Salle de cours animée par formateur',           icon: 'users' },
  blended:            { label: 'Blended',            description: 'Mixte présentiel + e-learning + classes virtuelles', icon: 'layers' },
  workshop:           { label: 'Atelier',            description: 'Pratique intensive avec livrables',             icon: 'hammer' },
  coaching:           { label: 'Coaching',           description: 'Accompagnement individuel par coach certifié',  icon: 'compass' },
  mentoring:          { label: 'Mentoring',          description: 'Transmission par mentor interne expérimenté',  icon: 'graduation-cap' },
  conference:         { label: 'Conférence',         description: 'Séminaire / keynote externe',                   icon: 'mic' },
  certification_prep: { label: 'Préparation cert.',  description: 'Bootcamp de préparation à examen externe',      icon: 'badge-check' },
};

// ─────────────────── Catégories
export const CATEGORY_META: Record<LearningCategory, { label: string; color: string }> = {
  leadership:  { label: 'Leadership',         color: 'amber'   },
  management:  { label: 'Management',         color: 'emerald' },
  technical:   { label: 'Technique',          color: 'sky'     },
  business:    { label: 'Business',           color: 'violet'  },
  language:    { label: 'Langues',            color: 'fuchsia' },
  compliance:  { label: 'Conformité',         color: 'rose'    },
  safety:      { label: 'Sécurité (HSE)',     color: 'red'     },
  product:     { label: 'Produit',            color: 'indigo'  },
  sales:       { label: 'Commercial',         color: 'amber'   },
  soft_skills: { label: 'Soft skills',        color: 'teal'    },
  digital:     { label: 'Digital',            color: 'cyan'    },
  finance:     { label: 'Finance',            color: 'emerald' },
};

// ─────────────────── Niveaux
export const LEVEL_META: Record<LearningLevel, { label: string; order: number }> = {
  beginner:     { label: 'Débutant',     order: 1 },
  intermediate: { label: 'Intermédiaire', order: 2 },
  advanced:     { label: 'Avancé',       order: 3 },
  expert:       { label: 'Expert',       order: 4 },
};

// ─────────────────── Provider
export const PROVIDER_META: Record<LearningProvider, { label: string; description: string }> = {
  internal: { label: 'Interne',  description: 'Formateur interne, IP propriétaire' },
  external: { label: 'Externe',  description: 'Cabinet / consultant externe' },
  mooc:     { label: 'MOOC',     description: 'Plateforme MOOC (Coursera, edX, OpenClassrooms, Udemy)' },
};

// ─────────────────── Status courses
export const COURSE_STATUS_META: Record<CourseStatus, { label: string; tone: 'neutral' | 'success' | 'warn' | 'danger' }> = {
  draft:    { label: 'Brouillon',  tone: 'neutral' },
  active:   { label: 'Actif',      tone: 'success' },
  paused:   { label: 'En pause',   tone: 'warn'    },
  archived: { label: 'Archivé',    tone: 'neutral' },
};

// ─────────────────── Plan
export const PLAN_STATUS_META: Record<PlanStatus, { label: string; tone: 'neutral' | 'info' | 'warn' | 'success' }> = {
  draft:         { label: 'Brouillon',          tone: 'neutral' },
  pending_drh:   { label: 'Validation DRH',     tone: 'info'    },
  pending_daf:   { label: 'Validation DAF',     tone: 'info'    },
  pending_dg:    { label: 'Validation DG',      tone: 'warn'    },
  approved:      { label: 'Approuvé',           tone: 'success' },
  in_execution:  { label: 'En exécution',       tone: 'info'    },
  closed:        { label: 'Clôturé',            tone: 'neutral' },
};

export const PLAN_ITEM_STATUS_META: Record<PlanItemStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'warn' | 'danger' }> = {
  planned:     { label: 'Planifié',     tone: 'neutral' },
  scheduled:   { label: 'Programmé',    tone: 'info'    },
  in_progress: { label: 'En cours',     tone: 'info'    },
  completed:   { label: 'Terminé',      tone: 'success' },
  cancelled:   { label: 'Annulé',       tone: 'danger'  },
  postponed:   { label: 'Reporté',      tone: 'warn'    },
};

export const PLAN_ORIGIN_META: Record<PlanOrigin, { label: string; description: string }> = {
  evaluation:         { label: 'Évaluation annuelle', description: 'Issu d\'un plan de développement (M8)' },
  okr:                { label: 'Objectif OKR',        description: 'Soutien à un Objectif Key Result (M7)' },
  career_path:        { label: 'Trajectoire',         description: 'Pré-requis trajectoire de carrière (M10)' },
  legal:              { label: 'Obligation légale',   description: 'HSE, anti-corruption, RGPD, etc.' },
  strategic:          { label: 'Plan stratégique',    description: 'Priorité COMEX / transformation' },
  individual_request: { label: 'Demande individuelle', description: 'Initiative du collaborateur' },
};

// ─────────────────── Sessions
export const SESSION_STATUS_META: Record<SessionStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'warn' | 'danger' }> = {
  scheduled:           { label: 'Programmée',          tone: 'neutral' },
  open_registration:   { label: 'Inscriptions ouvertes', tone: 'info'  },
  closed_registration: { label: 'Inscriptions closes', tone: 'warn'    },
  in_progress:         { label: 'En cours',            tone: 'info'    },
  completed:           { label: 'Terminée',            tone: 'success' },
  cancelled:           { label: 'Annulée',             tone: 'danger'  },
};

export const DELIVERY_MODE_META: Record<SessionDeliveryMode, { label: string; icon: string }> = {
  on_site: { label: 'Sur site',  icon: 'building' },
  remote:  { label: 'Distanciel', icon: 'video' },
  hybrid:  { label: 'Hybride',   icon: 'layers' },
};

// ─────────────────── Inscriptions
export const REGISTRATION_STATUS_META: Record<RegistrationStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'warn' | 'danger' }> = {
  requested:   { label: 'Demandé',           tone: 'neutral' },
  waitlisted:  { label: 'Liste d\'attente',  tone: 'warn'    },
  approved:    { label: 'Approuvé',          tone: 'info'    },
  confirmed:   { label: 'Confirmé',          tone: 'info'    },
  attended:    { label: 'Présent',           tone: 'success' },
  partial:     { label: 'Partiel',           tone: 'warn'    },
  no_show:     { label: 'Absent',            tone: 'danger'  },
  completed:   { label: 'Terminé',           tone: 'success' },
  failed:      { label: 'Échec',             tone: 'danger'  },
  cancelled:   { label: 'Annulé',            tone: 'neutral' },
};

// ─────────────────── Kirkpatrick
export const KIRKPATRICK_META: Record<KirkpatrickLevel, { label: string; subtitle: string; triggerDays: number; format: string; metric: string }> = {
  1: { label: 'Niveau 1 — Réaction',     subtitle: 'Satisfaction à chaud',                 triggerDays: 1,  format: 'Questionnaire 8 items, 1-5', metric: 'Score moyen / 5' },
  2: { label: 'Niveau 2 — Apprentissage', subtitle: 'Acquis (connaissances/compétences)',  triggerDays: 7,  format: 'Quiz / mise en situation',    metric: 'Score / 100' },
  3: { label: 'Niveau 3 — Comportement',  subtitle: 'Transfert au poste',                  triggerDays: 90, format: 'Auto-éval + manager 360°',   metric: 'Taux confirmé / 5' },
  4: { label: 'Niveau 4 — Résultats',     subtitle: 'Impact business',                     triggerDays: 180, format: 'Indicateurs métier (avant/après)', metric: 'ROI / Δ KPI' },
};

export const KIRKPATRICK_STATUS_META: Record<KirkpatrickStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'danger' }> = {
  pending:     { label: 'À lancer',     tone: 'neutral' },
  in_progress: { label: 'En cours',     tone: 'info'    },
  completed:   { label: 'Clôturée',     tone: 'success' },
  expired:     { label: 'Expirée',      tone: 'danger'  },
};

// ─────────────────── Certifications
export const CERTIFICATION_STATUS_META: Record<CertificationStatus, { label: string; tone: 'neutral' | 'success' | 'warn' | 'danger' }> = {
  active:           { label: 'Active',            tone: 'success' },
  expired:          { label: 'Expirée',           tone: 'danger'  },
  revoked:          { label: 'Révoquée',          tone: 'danger'  },
  pending_renewal:  { label: 'À renouveler',      tone: 'warn'    },
};

// ─────────────────── FDFP / régimes OHADA
export const FDFP_STATUS_META: Record<FdfpDeclarationStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'danger' }> = {
  draft:        { label: 'Brouillon',       tone: 'neutral' },
  submitted:    { label: 'Soumis',          tone: 'info'    },
  under_review: { label: 'En instruction',  tone: 'info'    },
  approved:     { label: 'Approuvé',        tone: 'success' },
  reimbursed:   { label: 'Remboursé',       tone: 'success' },
  rejected:     { label: 'Rejeté',          tone: 'danger'  },
};

/**
 * Régimes de financement de la formation par pays OHADA.
 * Taxe d'apprentissage + formation continue.
 */
export const TRAINING_FUND_REGIMES: { countryCode: string; country: string; agency: string; taxBase: string; ratePct: number; rebateMaxPct: number; notes: string }[] = [
  { countryCode: 'CI', country: 'Côte d\'Ivoire', agency: 'FDFP',     taxBase: 'Masse salariale brute', ratePct: 1.2, rebateMaxPct: 60, notes: 'Taxe apprentissage 0,4 % + FPC 0,8 %. Imputable sur agrément.' },
  { countryCode: 'SN', country: 'Sénégal',        agency: '3FPT',     taxBase: 'Masse salariale brute', ratePct: 3.0, rebateMaxPct: 50, notes: 'CFCE 3 % redistribué partiellement (réforme 3FPT).' },
  { countryCode: 'BJ', country: 'Bénin',          agency: 'FODEFCA',  taxBase: 'Masse salariale brute', ratePct: 4.0, rebateMaxPct: 40, notes: 'VPS / TVPS 4 % avec quote-part formation.' },
  { countryCode: 'BF', country: 'Burkina Faso',   agency: 'FAFPA',    taxBase: 'Masse salariale brute', ratePct: 4.0, rebateMaxPct: 35, notes: 'TPA 4 % — agrément FAFPA pour imputation.' },
  { countryCode: 'TG', country: 'Togo',           agency: 'FNAFPP',   taxBase: 'Masse salariale brute', ratePct: 2.0, rebateMaxPct: 30, notes: 'Taxe apprentissage 2 %.' },
  { countryCode: 'NE', country: 'Niger',          agency: 'FAFPCA',   taxBase: 'Masse salariale brute', ratePct: 2.0, rebateMaxPct: 30, notes: 'TFP 2 %.' },
  { countryCode: 'ML', country: 'Mali',           agency: 'FAFPA',    taxBase: 'Masse salariale brute', ratePct: 2.0, rebateMaxPct: 35, notes: 'TFP 2 % — convention de financement.' },
  { countryCode: 'GW', country: 'Guinée-Bissau',  agency: 'INEFP',    taxBase: 'Masse salariale brute', ratePct: 1.0, rebateMaxPct: 25, notes: 'Régime simplifié.' },
  { countryCode: 'CM', country: 'Cameroun',       agency: 'FNE',      taxBase: 'Masse salariale brute', ratePct: 1.5, rebateMaxPct: 40, notes: 'Crédit formation FNE.' },
  { countryCode: 'GA', country: 'Gabon',          agency: 'FIR',      taxBase: 'Masse salariale brute', ratePct: 0.5, rebateMaxPct: 30, notes: 'Fonds d\'Insertion et de Réinsertion.' },
  { countryCode: 'CG', country: 'Congo',          agency: 'FONEA',    taxBase: 'Masse salariale brute', ratePct: 1.0, rebateMaxPct: 30, notes: 'Fonds national d\'emploi et apprentissage.' },
  { countryCode: 'CF', country: 'Centrafrique',   agency: 'ACFPE',    taxBase: 'Masse salariale brute', ratePct: 1.0, rebateMaxPct: 25, notes: 'Régime ACFPE.' },
  { countryCode: 'TD', country: 'Tchad',          agency: 'ONAPE',    taxBase: 'Masse salariale brute', ratePct: 0.5, rebateMaxPct: 25, notes: 'ONAPE — appui formation.' },
  { countryCode: 'GQ', country: 'Guinée Équat.',  agency: 'INPYDE',   taxBase: 'Masse salariale brute', ratePct: 1.0, rebateMaxPct: 30, notes: 'Régime INPYDE.' },
];

// ─────────────────── Bonnes pratiques
export const TRAINING_BEST_PRACTICES: string[] = [
  'Couvrir 100 % des collaborateurs sur 3 ans (taux d\'accès cible ≥ 70 %/an).',
  'Cibler 35 h/an/collaborateur (recommandation Atlas).',
  'Évaluer systématiquement L1 (réaction) ; L2 sur certifications ; L3/L4 sur stratégique.',
  'Maximiser l\'imputation FDFP/3FPT : 60 % d\'imputable visé.',
  'Mixer modalités : 30 % e-learning, 50 % présentiel/blended, 20 % coaching/mentoring.',
  'ROI cible ≥ 3 sur formations stratégiques (Phillips ou L4).',
  'Renouveler les certifications HSE/conformité 90 j avant expiration (alerte auto).',
];

// ─────────────────── Méthodes ROI
export const ROI_METHODS = [
  { code: 'Phillips',              label: 'Méthode Phillips (5 niveaux)',     description: 'L1→L5 ROI financier — référence corporate.' },
  { code: 'Kirkpatrick_L4',        label: 'Kirkpatrick Niveau 4',             description: 'Mesure d\'impact business agrégé.' },
  { code: 'Productivity_Delta',    label: 'Δ productivité',                   description: 'Avant/après sur KPIs métier mesurables.' },
  { code: 'Turnover_Reduction',    label: 'Réduction turnover',               description: 'Économie sur coût de remplacement.' },
] as const;

// ─────────────────── Seuils & SLA
export const TRAINING_THRESHOLDS = {
  CERT_EXPIRATION_ALERT_DAYS: 90,
  PLAN_VALIDATION_DG_AMOUNT: 30_000_000,    // FCFA — au-delà → DG
  WAITLIST_AUTO_PROMOTE_DAYS: 3,
  REACTION_TARGET: 4.2,                      // / 5
  LEARNING_PASS_THRESHOLD: 70,               // / 100
  TRANSFER_TARGET: 0.70,                     // 70 %
  ROI_TARGET: 3.0,
  ACCESS_RATE_TARGET: 0.70,
  HOURS_PER_EMPLOYEE_TARGET: 35,
};
