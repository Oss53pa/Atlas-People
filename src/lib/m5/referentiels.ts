/**
 * M5 RECRUTEMENT — référentiels du module ATS.
 * Pipeline, canaux, motifs refus, critères scorecard, RGPD.
 */
import type { ApplicationStage, ChannelType, InterviewType, RecommendationLevel, JobLevel, JobStatus } from './types';

// ───────────────────────────────────────── Pipeline (9 stages)
export interface PipelineStageRef {
  code: ApplicationStage;
  label: string;
  tone: 'ok' | 'amber' | 'info' | 'warn' | 'danger' | 'neutral';
  group: 'in_progress' | 'final';
  order: number;
}
export const PIPELINE_STAGES: PipelineStageRef[] = [
  { code: 'sourced',    label: 'Sourcé',          tone: 'neutral', group: 'in_progress', order: 1 },
  { code: 'applied',    label: 'Candidaté',       tone: 'info',    group: 'in_progress', order: 2 },
  { code: 'screening',  label: 'Pré-qualif.',     tone: 'info',    group: 'in_progress', order: 3 },
  { code: 'interview',  label: 'Entretiens',      tone: 'amber',   group: 'in_progress', order: 4 },
  { code: 'assessment', label: 'Test technique',  tone: 'amber',   group: 'in_progress', order: 5 },
  { code: 'offer',      label: 'Offre',           tone: 'warn',    group: 'in_progress', order: 6 },
  { code: 'hired',      label: 'Embauché',        tone: 'ok',      group: 'final',       order: 7 },
  { code: 'rejected',   label: 'Refusé',          tone: 'danger',  group: 'final',       order: 8 },
  { code: 'withdrawn',  label: 'Retiré',          tone: 'neutral', group: 'final',       order: 9 },
];

export const ACTIVE_STAGES: ApplicationStage[] = ['sourced','applied','screening','interview','assessment','offer'];

// ───────────────────────────────────────── Statuts postes
export const JOB_STATUS_META: Record<JobStatus, { label: string; tone: 'ok' | 'amber' | 'neutral' | 'warn' | 'danger' }> = {
  draft:             { label: 'Brouillon',   tone: 'neutral' },
  open:              { label: 'Ouvert',      tone: 'ok'      },
  on_hold:           { label: 'En pause',    tone: 'warn'    },
  closed_filled:     { label: 'Pourvu',      tone: 'neutral' },
  closed_cancelled:  { label: 'Annulé',      tone: 'danger'  },
};

export const JOB_LEVEL_LABEL: Record<JobLevel, string> = {
  junior:     'Junior',
  confirme:   'Confirmé',
  senior:     'Senior',
  lead:       'Lead',
  manager:    'Manager',
  director:   'Directeur',
};

// ───────────────────────────────────────── Entretiens
export interface InterviewTypeRef { code: InterviewType; label: string; defaultDuration: number }
export const INTERVIEW_TYPES: InterviewTypeRef[] = [
  { code: 'phone_screen', label: 'Pré-qualification téléphonique', defaultDuration: 30 },
  { code: 'manager',      label: 'Entretien manager',              defaultDuration: 60 },
  { code: 'team',         label: 'Entretien équipe',               defaultDuration: 45 },
  { code: 'tech',         label: 'Entretien technique',            defaultDuration: 90 },
  { code: 'culture',      label: 'Entretien culture / valeurs',    defaultDuration: 45 },
  { code: 'final',        label: 'Entretien final / décision',     defaultDuration: 60 },
  { code: 'reference',    label: 'Prise de références',            defaultDuration: 30 },
];

// ───────────────────────────────────────── Recommandation
export const RECOMMENDATION_META: Record<RecommendationLevel, { label: string; tone: 'ok' | 'amber' | 'warn' | 'danger' | 'neutral'; score: number }> = {
  strong_yes: { label: 'OUI fortement', tone: 'ok',      score: 5 },
  yes:        { label: 'Oui',           tone: 'ok',      score: 4 },
  maybe:      { label: 'Mitigé',        tone: 'amber',   score: 3 },
  no:         { label: 'Non',           tone: 'warn',    score: 2 },
  strong_no:  { label: 'NON fortement', tone: 'danger',  score: 1 },
};

// ───────────────────────────────────────── Canaux de sourcing
export interface ChannelDefaultRef { code: string; label: string; type: ChannelType }
export const SOURCING_DEFAULTS: ChannelDefaultRef[] = [
  // Jobboards
  { code: 'LINKEDIN',         label: 'LinkedIn Recruiter',     type: 'social'      },
  { code: 'INDEED',           label: 'Indeed',                 type: 'jobboard'    },
  { code: 'WTTJ',             label: 'Welcome to the Jungle',  type: 'jobboard'    },
  { code: 'JOBAAZ',           label: 'Jobaaz Afrique',         type: 'jobboard'    },
  { code: 'EMPLOI_CI',        label: 'Emploi.ci',              type: 'jobboard'    },
  { code: 'SENJOB',           label: 'SenJob',                 type: 'jobboard'    },
  { code: 'ANPE_LIKE',        label: 'ANPE / service emploi pays', type: 'jobboard' },
  // Écoles
  { code: 'INPHB',            label: 'INP-HB Yamoussoukro',    type: 'school'      },
  { code: 'ESATIC',           label: 'ESATIC Abidjan',         type: 'school'      },
  { code: 'UCAD',             label: 'UCAD Dakar',             type: 'school'      },
  { code: 'ESP',              label: 'ESP Dakar',              type: 'school'      },
  // Cooptation
  { code: 'COOPTATION',       label: 'Cooptation collaborateurs', type: 'cooptation' },
  // Agences
  { code: 'AGENCY_LOCAL',     label: 'Cabinet recrutement local', type: 'agency'   },
  // Événements
  { code: 'JOB_FAIR',         label: 'Salons & forums',        type: 'event'       },
  { code: 'MEETUP',           label: 'Meetups / hackathons',   type: 'event'       },
  // Direct
  { code: 'DIRECT',           label: 'Candidature spontanée',  type: 'direct'      },
  { code: 'CAREER_SITE',      label: 'Site carrière Atlas',    type: 'direct'      },
];

export const CHANNEL_TYPE_LABEL: Record<ChannelType, string> = {
  jobboard:   'Jobboard',
  social:     'Réseau social pro',
  school:     'École / université',
  cooptation: 'Cooptation',
  agency:     'Cabinet / agence',
  direct:     'Direct',
  event:      'Événement',
};

// ───────────────────────────────────────── Motifs de refus
export interface RejectionReasonRef { code: string; label: string; category: 'fit' | 'comp' | 'process' | 'candidate' }
export const REJECTION_REASONS: RejectionReasonRef[] = [
  { code: 'TECH_SKILLS',     label: 'Compétences techniques insuffisantes',  category: 'comp' },
  { code: 'EXPERIENCE',      label: 'Expérience insuffisante',               category: 'comp' },
  { code: 'CULTURE_FIT',     label: 'Fit culturel insuffisant',              category: 'fit'  },
  { code: 'COMMUNICATION',   label: 'Communication / posture',               category: 'fit'  },
  { code: 'OVERQUALIFIED',   label: 'Surqualifié·e',                          category: 'comp' },
  { code: 'SALARY_GAP',      label: 'Écart prétentions salariales',          category: 'candidate' },
  { code: 'LOCATION',        label: 'Localisation / mobilité',               category: 'candidate' },
  { code: 'AVAILABILITY',    label: 'Disponibilité incompatible',            category: 'candidate' },
  { code: 'OTHER_OFFER',     label: 'Autre offre acceptée',                  category: 'candidate' },
  { code: 'NO_SHOW',         label: 'No-show entretien',                     category: 'process' },
  { code: 'WITHDREW',        label: 'Candidat·e a retiré',                   category: 'candidate' },
  { code: 'POSITION_CLOSED', label: 'Poste fermé / annulé',                  category: 'process' },
  { code: 'OTHER',           label: 'Autre motif',                           category: 'process' },
];

// ───────────────────────────────────────── Scorecard critères
export interface ScorecardTemplate { code: string; label: string; criteria: string[] }
export const SCORECARD_TEMPLATES: ScorecardTemplate[] = [
  { code: 'TECH', label: 'Technique', criteria: ['Compétences techniques', 'Résolution de problèmes', 'Qualité du code / livrables', 'Connaissance domaine'] },
  { code: 'MGR',  label: 'Manager',   criteria: ['Vision / stratégie', 'Leadership', 'Décision', 'Communication', 'Coaching'] },
  { code: 'TEAM', label: 'Équipe',    criteria: ['Collaboration', 'Communication', 'Esprit d\'équipe', 'Culture fit'] },
  { code: 'CULT', label: 'Culture',   criteria: ['Valeurs Atlas', 'Motivation', 'Curiosité', 'Engagement'] },
  { code: 'FIN',  label: 'Final',     criteria: ['Synthèse globale', 'Niveau ciblé', 'Risques', 'Atouts différenciants'] },
];

// ───────────────────────────────────────── RGPD
export const RGPD = {
  retentionYears: 2,                    // conservation des candidatures non retenues
  consentRequired: true,
  rightToErasureDays: 30,               // SLA traitement demande
  anonymizationAfterDays: 730,
};

// ───────────────────────────────────────── Wizards
export const JOB_WIZARD_STEPS = [
  'Identification poste',
  'Description & responsabilités',
  'Exigences & critères',
  'Rémunération & avantages',
  'Pipeline & panel',
  'Diffusion (canaux)',
  'Revue & publication',
] as const;

export const APPLICATION_WIZARD_STEPS = [
  'Source & poste cible',
  'Identité candidat',
  'CV & pièces',
  'RGPD & consentement',
] as const;

// ───────────────────────────────────────── SLA & objectifs
export const SLA = {
  screeningDays: 5,         // de candidature → screening
  firstInterviewDays: 10,
  offerToHireDays: 7,
  totalTimeToFillDays: 45,  // SLA global
};
