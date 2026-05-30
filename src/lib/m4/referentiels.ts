/**
 * M4 ADMIN RH — référentiels du module.
 * Catalogue des types de contrats, avenants, événements, départs, sanctions,
 * certificats, mandats, obligations, etc. Versionné, lecture seule côté UI.
 * Source : docs 02-14 du cahier M4 Admin RH OHADA/SYSCOHADA.
 */
import type {
  ContractTypeCode, ContractStatus, AmendmentTypeRef, AdminEventCategory,
  DepartureTypeCode, SanctionType, FauteLevel, CertificateTypeRef,
} from './types';

// ─────────────────────────────────────────────────────── Contrats
export interface ContractTypeRef { code: ContractTypeCode; label: string; short: string; hasEnd: boolean }
export const CONTRACT_TYPES: ContractTypeRef[] = [
  { code: 'CDI', label: 'Contrat à durée indéterminée', short: 'CDI', hasEnd: false },
  { code: 'CDD', label: 'Contrat à durée déterminée', short: 'CDD', hasEnd: true },
  { code: 'CDD_CHANTIER', label: 'CDD de chantier / opération', short: 'CDD-CH', hasEnd: true },
  { code: 'CDD_SAISON', label: 'CDD saisonnier', short: 'CDD-S', hasEnd: true },
  { code: 'CDD_REMP', label: 'CDD de remplacement', short: 'CDD-R', hasEnd: true },
  { code: 'APPR', label: "Contrat d'apprentissage", short: 'APPR', hasEnd: true },
  { code: 'STAGE', label: 'Convention de stage', short: 'STAGE', hasEnd: true },
  { code: 'INTERIM', label: 'Mise à disposition (intérim)', short: 'INT', hasEnd: true },
  { code: 'MANDAT', label: 'Mandataire social', short: 'MAND', hasEnd: false },
  { code: 'TPS_PART', label: 'Temps partiel', short: 'TP', hasEnd: false },
  { code: 'EXPAT', label: 'Contrat expatrié', short: 'EXPAT', hasEnd: true },
];

export const CONTRACT_STATUS_META: Record<ContractStatus, { label: string; tone: 'ok' | 'warn' | 'amber' | 'neutral' | 'danger' }> = {
  draft:               { label: 'Brouillon',          tone: 'neutral' },
  validated_n1:        { label: 'Validé RRH',         tone: 'amber'   },
  signed_employer:     { label: 'Signé employeur',    tone: 'amber'   },
  pending_employee:    { label: 'Attente employé',    tone: 'warn'    },
  signed_both:         { label: 'Signé 2 parties',    tone: 'ok'      },
  active:              { label: 'Actif',              tone: 'ok'      },
  suspended:           { label: 'Suspendu',           tone: 'warn'    },
  terminated:          { label: 'Terminé',            tone: 'neutral' },
  archived:            { label: 'Archivé',            tone: 'neutral' },
};

export const CONTRACT_WIZARD_STEPS = [
  'Collaborateur cible',
  'Type & modèle',
  'Données contrat',
  'Clauses particulières',
  'Revue & PDF',
  'Workflow (Chargé → RRH → DRH)',
  'Signature ADVIST employeur',
  'Envoi signature employé',
  'Signature employé',
  'Activation + déclarations + M3',
] as const;

// Alertes de surveillance contrats
export const CONTRACT_SURVEILLANCE_THRESHOLDS = {
  cdd_end:           [60, 30, 14, 7],
  probation_end:     [30, 14, 7, 3],
  mandate_end:       [90, 30],
  expat_permit_end:  [90, 60, 30],
  unsigned:          [7, 14],
} as const;

// ─────────────────────────────────────────────── Avenants — 7 catégories
export interface AmendmentCategoryRef { code: string; label: string; defaultSensitivity: 'low' | 'medium' | 'high' }
export const AMENDMENT_CATEGORIES: AmendmentCategoryRef[] = [
  { code: 'REMUNERATION',  label: 'Rémunération',         defaultSensitivity: 'medium' },
  { code: 'FONCTION',      label: 'Fonction',             defaultSensitivity: 'medium' },
  { code: 'LIEU',          label: 'Lieu de travail',      defaultSensitivity: 'medium' },
  { code: 'TEMPS',         label: 'Temps de travail',     defaultSensitivity: 'medium' },
  { code: 'CONTRACTUEL',   label: 'Contractuel',          defaultSensitivity: 'medium' },
  { code: 'CLAUSES',       label: 'Clauses',              defaultSensitivity: 'medium' },
  { code: 'DIVERS',        label: 'Divers',               defaultSensitivity: 'low'    },
];

export const AMENDMENT_TYPES: AmendmentTypeRef[] = [
  // Rémunération
  { code: 'REM_AUG_BASE',     label: 'Augmentation salaire base',          categoryCode: 'REMUNERATION', sensitivity: 'medium', payrollImpact: true  },
  { code: 'REM_DIM_BASE',     label: 'Diminution salaire base',            categoryCode: 'REMUNERATION', sensitivity: 'high',   payrollImpact: true  },
  { code: 'REM_INDEMN',       label: 'Modification indemnités fixes',      categoryCode: 'REMUNERATION', sensitivity: 'medium', payrollImpact: true  },
  { code: 'REM_PRIMES',       label: 'Modification primes contractuelles', categoryCode: 'REMUNERATION', sensitivity: 'medium', payrollImpact: true  },
  { code: 'REM_MODE',         label: 'Mode rémunération (fixe ↔ variable)',categoryCode: 'REMUNERATION', sensitivity: 'high',   payrollImpact: true  },
  { code: 'REM_PRIME_EXCEPT', label: 'Octroi prime exceptionnelle',         categoryCode: 'REMUNERATION', sensitivity: 'low',    payrollImpact: true  },
  { code: 'REM_PARTICIPATION',label: 'Participation / intéressement',       categoryCode: 'REMUNERATION', sensitivity: 'medium', payrollImpact: true  },
  // Fonction
  { code: 'FCT_PROMOTION',    label: 'Promotion / changement fonction',     categoryCode: 'FONCTION',     sensitivity: 'medium', payrollImpact: true  },
  { code: 'FCT_CLASSIF',      label: 'Classification / coefficient CCN',    categoryCode: 'FONCTION',     sensitivity: 'medium', payrollImpact: true  },
  { code: 'FCT_SERVICE',      label: 'Changement service / département',    categoryCode: 'FONCTION',     sensitivity: 'low',    payrollImpact: false },
  { code: 'FCT_MANAGER',      label: 'Changement manager hiérarchique',     categoryCode: 'FONCTION',     sensitivity: 'low',    payrollImpact: false },
  { code: 'FCT_RESP',         label: 'Élargissement responsabilités',       categoryCode: 'FONCTION',     sensitivity: 'medium', payrollImpact: false },
  // Lieu
  { code: 'LIEU_MOBILITE',    label: 'Mobilité géographique',               categoryCode: 'LIEU',         sensitivity: 'high',   payrollImpact: false },
  { code: 'LIEU_INTL',        label: 'Mobilité internationale',             categoryCode: 'LIEU',         sensitivity: 'high',   payrollImpact: true  },
  { code: 'LIEU_TELETRAVAIL', label: 'Télétravail',                         categoryCode: 'LIEU',         sensitivity: 'medium', payrollImpact: false },
  { code: 'LIEU_NOMADE',      label: 'Travail nomade / itinérant',          categoryCode: 'LIEU',         sensitivity: 'medium', payrollImpact: false },
  // Temps
  { code: 'TPS_PLEIN_PART',   label: 'Plein temps → temps partiel',         categoryCode: 'TEMPS',        sensitivity: 'high',   payrollImpact: true  },
  { code: 'TPS_PART_PLEIN',   label: 'Temps partiel → plein temps',         categoryCode: 'TEMPS',        sensitivity: 'medium', payrollImpact: true  },
  { code: 'TPS_REPART',       label: 'Répartition horaire',                 categoryCode: 'TEMPS',        sensitivity: 'medium', payrollImpact: false },
  { code: 'TPS_FORFAIT',      label: 'Forfait jours',                       categoryCode: 'TEMPS',        sensitivity: 'medium', payrollImpact: true  },
  { code: 'TPS_ANNUALISE',    label: 'Annualisation du temps',              categoryCode: 'TEMPS',        sensitivity: 'medium', payrollImpact: true  },
  // Contractuel
  { code: 'CTR_CDD_CDI',      label: 'Passage CDD → CDI',                   categoryCode: 'CONTRACTUEL',  sensitivity: 'medium', payrollImpact: false },
  { code: 'CTR_CDD_RENEW',    label: 'Renouvellement CDD',                  categoryCode: 'CONTRACTUEL',  sensitivity: 'medium', payrollImpact: false },
  { code: 'CTR_ESSAI',        label: "Modification durée période d'essai", categoryCode: 'CONTRACTUEL',  sensitivity: 'medium', payrollImpact: false },
  { code: 'CTR_PROLONG',      label: 'Prolongation contrat',                categoryCode: 'CONTRACTUEL',  sensitivity: 'medium', payrollImpact: false },
  // Clauses
  { code: 'CL_NON_CONC',      label: 'Clause non-concurrence',              categoryCode: 'CLAUSES',      sensitivity: 'high',   payrollImpact: true  },
  { code: 'CL_CONFI',         label: 'Clause confidentialité',              categoryCode: 'CLAUSES',      sensitivity: 'medium', payrollImpact: false },
  { code: 'CL_DEDIT',         label: 'Clause dédit-formation',              categoryCode: 'CLAUSES',      sensitivity: 'medium', payrollImpact: false },
  { code: 'CL_MOBILITE',      label: 'Clause mobilité',                     categoryCode: 'CLAUSES',      sensitivity: 'medium', payrollImpact: false },
  { code: 'CL_LEVEE',         label: "Levée d'une clause",                  categoryCode: 'CLAUSES',      sensitivity: 'medium', payrollImpact: false },
  // Divers
  { code: 'DIV_REGUL',        label: 'Régularisation administrative',       categoryCode: 'DIVERS',       sensitivity: 'low',    payrollImpact: false },
  { code: 'DIV_COLLECTIF',    label: "Avenant collectif",                   categoryCode: 'DIVERS',       sensitivity: 'medium', payrollImpact: true  },
  { code: 'DIV_DETACH',       label: 'Détachement / mise à disposition',    categoryCode: 'DIVERS',       sensitivity: 'high',   payrollImpact: true  },
  { code: 'DIV_PARTIEL',      label: 'Suspension partielle (activité)',     categoryCode: 'DIVERS',       sensitivity: 'high',   payrollImpact: true  },
];

export const AMENDMENT_WIZARD_STEPS = [
  'Identification',
  'Modifications & impact paie',
  "Texte de l'avenant",
  'Workflow validation',
  'Signature & activation',
] as const;

export const SENSITIVITY_META: Record<'low' | 'medium' | 'high', { label: string; tone: 'ok' | 'amber' | 'danger' }> = {
  low:    { label: 'Faible',  tone: 'ok'     },
  medium: { label: 'Moyenne', tone: 'amber'  },
  high:   { label: 'Élevée',  tone: 'danger' },
};

// ─────────────────────────────────── Événements admin — 7 catégories
export interface EventCategoryRef { code: AdminEventCategory; label: string; tone: 'ok' | 'amber' | 'info' | 'warn' | 'danger' | 'neutral' }
export const EVENT_CATEGORIES: EventCategoryRef[] = [
  { code: 'EMBAUCHE',       label: 'Embauche',           tone: 'ok'      },
  { code: 'MOBILITE',       label: 'Mobilité',           tone: 'info'    },
  { code: 'SUSPENSION',     label: 'Suspension',         tone: 'amber'   },
  { code: 'REPRISE',        label: 'Reprise',            tone: 'info'    },
  { code: 'FIN_CARRIERE',   label: 'Fin de carrière',    tone: 'danger'  },
  { code: 'EXCEPTIONNELS',  label: 'Exceptionnels',      tone: 'amber'   },
  { code: 'ADMIN',          label: 'Administratifs purs',tone: 'neutral' },
];

export const EVENT_TYPES_BY_CATEGORY: Record<AdminEventCategory, string[]> = {
  EMBAUCHE: ['Embauche initiale', 'Réembauche après ancien départ', 'Transfert intra-groupe'],
  MOBILITE: ['Changement fonction', 'Changement service', 'Changement site', 'Promotion', 'Mobilité internationale', 'Détachement / mise à disposition'],
  SUSPENSION: ['Congé maternité', 'Congé paternité', 'Congé parental', 'Congé sabbatique', 'Congé sans solde', 'Mise à pied conservatoire', 'Maladie longue durée', 'Formation longue durée', 'Mandat syndical temps plein'],
  REPRISE: ['Reprise après congé maternité', 'Reprise après congé long', 'Reprise après maladie', 'Reprise après mise à pied'],
  FIN_CARRIERE: ['Démission', 'Licenciement', 'Rupture conventionnelle', 'Fin CDD', 'Retraite', 'Décès'],
  EXCEPTIONNELS: ['Médaille du travail (10 ans)', 'Médaille du travail (20 ans)', 'Médaille du travail (30 ans)', 'Médaille du travail (40 ans)', 'Distinction interne', 'Mécénat', 'Détachement humanitaire'],
  ADMIN: ['Changement adresse', 'Changement téléphone', 'Changement RIB', 'Mariage', 'Divorce / PACS', 'Naissance enfant', 'Décès ayant droit', 'Nouveau diplôme', 'Nouvelle pièce identité', 'Nouveau passeport', 'Changement nationalité', 'Demande logement social'],
};

export const EVENT_AUTO_DETECTORS = [
  "Anniversaires d'embauche (médaille du travail)",
  "Fins de CDD (J-60 avant)",
  "Fins de période d'essai (J-30 avant)",
  "Renouvellements expatriés (J-90 avant)",
  "Visites médicales annuelles (J-30 avant)",
  "Retours de congés longs",
];

// ─────────────────────────────── Période d'essai — 14 pays OHADA
export interface ProbationLegalRow { countryCode: string; cadre: string; maitrise: string; employe: string; ouvrier: string }
export const PROBATION_LEGAL: ProbationLegalRow[] = [
  { countryCode: 'CI', cadre: '3 mois', maitrise: '2 mois', employe: '1 mois', ouvrier: '8 jours'  },
  { countryCode: 'SN', cadre: '6 mois', maitrise: '3 mois', employe: '1 mois', ouvrier: '8 jours'  },
  { countryCode: 'ML', cadre: '6 mois', maitrise: '3 mois', employe: '1 mois', ouvrier: '15 jours' },
  { countryCode: 'BF', cadre: '3 mois', maitrise: '2 mois', employe: '1 mois', ouvrier: '8 jours'  },
  { countryCode: 'BJ', cadre: '3 mois', maitrise: '2 mois', employe: '1 mois', ouvrier: '8 jours'  },
  { countryCode: 'TG', cadre: '6 mois', maitrise: '3 mois', employe: '1 mois', ouvrier: '8 jours'  },
  { countryCode: 'NE', cadre: '3 mois', maitrise: '2 mois', employe: '1 mois', ouvrier: '8 jours'  },
  { countryCode: 'GW', cadre: '90 jours', maitrise: '45 jours', employe: '30 jours', ouvrier: '7 jours' },
  { countryCode: 'CM', cadre: '6 mois', maitrise: '4 mois', employe: '2 mois', ouvrier: '15 jours' },
  { countryCode: 'GA', cadre: '6 mois', maitrise: '3 mois', employe: '1 mois', ouvrier: '15 jours' },
  { countryCode: 'CG', cadre: '6 mois', maitrise: '3 mois', employe: '1 mois', ouvrier: '15 jours' },
  { countryCode: 'CF', cadre: '6 mois', maitrise: '3 mois', employe: '1 mois', ouvrier: '8 jours'  },
  { countryCode: 'TD', cadre: '6 mois', maitrise: '3 mois', employe: '1 mois', ouvrier: '15 jours' },
  { countryCode: 'GQ', cadre: '6 mois (lég.)', maitrise: '4 mois', employe: '2 mois', ouvrier: '15 jours' },
];

export const PROBATION_ALERT_THRESHOLDS = [30, 21, 14, 7, 3] as const;

// ─────────────────────────────────────────────────────── Départs
export interface DepartureTypeRef { code: DepartureTypeCode; label: string; initiative: string; preavis: string; indemnite: string }
export const DEPARTURE_TYPES: DepartureTypeRef[] = [
  { code: 'demission',           label: 'Démission',                       initiative: 'Salarié',         preavis: 'Oui (selon CCN)', indemnite: 'Aucune' },
  { code: 'licenciement_perso',  label: 'Licenciement motif personnel',    initiative: 'Employeur',       preavis: 'Oui',             indemnite: 'Selon ancienneté' },
  { code: 'licenciement_eco',    label: 'Licenciement économique',         initiative: 'Employeur',       preavis: 'Oui',             indemnite: 'Majorée' },
  { code: 'rupture_conv',        label: 'Rupture conventionnelle',         initiative: 'Mutuelle',        preavis: 'Néant',           indemnite: 'Négociée (min légal)' },
  { code: 'fin_cdd',             label: 'Fin de CDD',                      initiative: 'Terme',           preavis: 'Néant',           indemnite: 'Prime précarité' },
  { code: 'rupture_essai',       label: "Rupture période d'essai",         initiative: "L'un ou l'autre", preavis: 'Court',           indemnite: 'Aucune' },
  { code: 'retraite',            label: 'Retraite',                        initiative: 'Salarié',         preavis: 'Oui (adouci)',    indemnite: 'Indemnité fin de carrière' },
  { code: 'deces',               label: 'Décès',                           initiative: 'Force majeure',   preavis: 'Néant',           indemnite: 'Capital décès' },
];

export const DEPARTURE_DOCUMENTS = [
  'Certificat de travail',
  'Attestation employeur',
  'Reçu pour solde de tout compte',
  'Attestation CNPS (fin d\'affiliation)',
  'Attestation IRPP année en cours',
  'Attestation Pôle Emploi équivalent',
  'Lettre de recommandation (optionnelle)',
];

export const DEPARTURE_WIZARD_STEPS = [
  'Identification',
  'Calcul préavis',
  'Indemnités',
  'Justification & contexte',
  'Checklist sortie',
  'Récapitulatif & validation',
  'Soumission workflow',
] as const;

// Préavis CI par catégorie (mois)
export const NOTICE_RULES_CI = { cadre: 3, employe: 1, ouvrier: 0.27 /* ~8j */ };
// Indemnité licenciement CI (% par année d'ancienneté)
export const SEVERANCE_PCT_CI = [
  { upTo: 5, pct: 30 },
  { upTo: 10, pct: 35 },
  { upTo: 999, pct: 40 },
];

// ─────────────────────────────────────────────── Disciplinaire (OHADA)
export interface SanctionLevelRef { rank: number; code: SanctionType | 'rappel_oral' | 'mise_pied_long' | 'mutation'; label: string; severity: 'minor' | 'moderate' | 'severe' | 'major'; needsHearing: boolean; retentionYears: number }
export const SANCTION_SCALE: SanctionLevelRef[] = [
  { rank: 1,  code: 'rappel_oral',         label: 'Rappel à l\'ordre (verbal)',    severity: 'minor',    needsHearing: false, retentionYears: 0  },
  { rank: 2,  code: 'avertissement',       label: 'Avertissement écrit',           severity: 'minor',    needsHearing: false, retentionYears: 3  },
  { rank: 3,  code: 'blame',               label: 'Blâme écrit',                   severity: 'moderate', needsHearing: true,  retentionYears: 3  },
  { rank: 4,  code: 'mise_a_pied',         label: 'Mise à pied disciplinaire 1-3 j', severity: 'moderate', needsHearing: true, retentionYears: 5 },
  { rank: 5,  code: 'mise_pied_long',      label: 'Mise à pied disciplinaire 4-8 j', severity: 'severe',   needsHearing: true, retentionYears: 5 },
  { rank: 6,  code: 'retrogradation',      label: 'Rétrogradation',                severity: 'severe',   needsHearing: true,  retentionYears: 10 },
  { rank: 7,  code: 'mutation',            label: 'Mutation disciplinaire',        severity: 'severe',   needsHearing: true,  retentionYears: 10 },
  { rank: 8,  code: 'licenciement_faute',  label: 'Licenciement faute simple',     severity: 'major',    needsHearing: true,  retentionYears: 30 },
  { rank: 9,  code: 'licenciement_faute',  label: 'Licenciement faute grave',      severity: 'major',    needsHearing: true,  retentionYears: 30 },
  { rank: 10, code: 'licenciement_faute',  label: 'Licenciement faute lourde',     severity: 'major',    needsHearing: true,  retentionYears: 30 },
];

export const FAUTE_META: Record<FauteLevel, { label: string; preavis: string; indemnite: string }> = {
  simple: { label: 'Faute simple', preavis: 'Avec préavis', indemnite: 'Avec indemnité licenciement' },
  grave:  { label: 'Faute grave',  preavis: 'Immédiat sans préavis', indemnite: 'Indemnité maintenue' },
  lourde: { label: 'Faute lourde', preavis: 'Immédiat sans préavis', indemnite: 'Sans indemnité (perte ICP)' },
};

export const DISCIPLINARY_PROCEDURE_STEPS = [
  { code: 'constatation',     label: 'Constatation des faits',                legalDelay: 'Prescription 2 mois' },
  { code: 'instruction',      label: 'Ouverture dossier (instruction)',       legalDelay: '5-15 jours' },
  { code: 'convocation',      label: 'Convocation entretien (LRAR / ADVIST)', legalDelay: 'Min 5 jours ouvrés avant entretien' },
  { code: 'entretien',        label: 'Entretien préalable (PV)',              legalDelay: 'Assistance possible' },
  { code: 'reflexion',        label: 'Délai de réflexion',                    legalDelay: 'Min 1 j franc, max 1 mois' },
  { code: 'notification',     label: 'Notification sanction',                 legalDelay: 'Écrit motivé LRAR/ADVIST' },
];

export const DISCIPLINARY_RECOURS = [
  'Recours hiérarchique (DG, réponse ≤ 1 mois)',
  'Saisine Inspection du Travail',
  'Conseil de prud\'hommes / juridiction OHADA',
];

// ─────────────────────────────────────────────────── Certificats
export const CERTIFICATE_TYPES: CertificateTypeRef[] = [
  // Légaux (signature DRH obligatoire)
  { code: 'CERT_TRAVAIL',     label: 'Certificat de travail',               category: 'certificat', requiresSignature: true  },
  { code: 'ATT_EMPLOYEUR',    label: 'Attestation employeur',               category: 'attestation', requiresSignature: true  },
  { code: 'RECU_STC',         label: 'Reçu pour solde de tout compte',      category: 'certificat', requiresSignature: true  },
  { code: 'ATT_CNPS_FIN',     label: 'Attestation CNPS (fin d\'affiliation)', category: 'attestation', requiresSignature: true  },
  { code: 'BULLETIN_SAL',     label: 'Bulletin de salaire mensuel',         category: 'certificat', requiresSignature: true  },
  // Attestations à la demande
  { code: 'ATT_SALAIRE',      label: 'Attestation de salaire',              category: 'attestation', requiresSignature: true  },
  { code: 'ATT_PRESENCE',     label: 'Attestation de présence',             category: 'attestation', requiresSignature: false },
  { code: 'ATT_EMP_GEN',      label: 'Attestation employeur générique',     category: 'attestation', requiresSignature: false },
  { code: 'ATT_ANCIENNETE',   label: "Attestation d'ancienneté",            category: 'attestation', requiresSignature: false },
  { code: 'ATT_REV_N1',       label: 'Attestation de revenus N-1',          category: 'attestation', requiresSignature: true  },
  { code: 'ATT_NON_LIC',      label: 'Attestation de non-licenciement',     category: 'attestation', requiresSignature: true  },
  { code: 'ATT_POSTE',        label: 'Attestation de poste actuel',         category: 'attestation', requiresSignature: false },
  { code: 'ATT_FCT',          label: 'Attestation de fonctions exercées',   category: 'attestation', requiresSignature: false },
  { code: 'CERT_MED_APT',     label: 'Certificat médical d\'aptitude',      category: 'certificat', requiresSignature: false },
  { code: 'ATT_STAGE',        label: 'Attestation de stage',                category: 'attestation', requiresSignature: false },
  { code: 'ATT_VISA',         label: 'Attestation pour visa',               category: 'attestation', requiresSignature: true  },
  { code: 'ATT_CONGE_PRIS',   label: 'Attestation de congé pris',           category: 'attestation', requiresSignature: false },
  { code: 'ATT_SOLDES_CP',    label: 'Attestation de soldes congés',        category: 'attestation', requiresSignature: false },
  { code: 'ATT_SCOL',         label: 'Attestation pour scolarité enfants',  category: 'attestation', requiresSignature: false },
  { code: 'ATT_PASSEPORT',    label: 'Attestation pour passeport diplomatique', category: 'attestation', requiresSignature: true  },
  // Courriers RH motivés
  { code: 'COUR_FELICIT',     label: 'Lettre de félicitations',             category: 'lettre',     requiresSignature: false },
  { code: 'COUR_RECADRAGE',   label: 'Lettre de recadrage non disciplinaire', category: 'lettre',   requiresSignature: false },
  { code: 'COUR_INFO_CHGT',   label: "Lettre d'information de changement",   category: 'lettre',     requiresSignature: false },
  { code: 'COUR_MOD_CONTRAT', label: "Lettre modification éléments contractuels", category: 'lettre', requiresSignature: true  },
  { code: 'COUR_REP_DEMANDE', label: 'Lettre de réponse à demande salarié', category: 'lettre',     requiresSignature: true  },
  { code: 'COUR_FIN_PE',      label: 'Lettre de fin de période d\'essai',   category: 'lettre',     requiresSignature: true  },
  { code: 'COUR_AUTOR_ABS',   label: "Lettre d'autorisation absence",       category: 'lettre',     requiresSignature: false },
  { code: 'COUR_MAT_MAD',     label: 'Lettre mise à disposition matériel',  category: 'lettre',     requiresSignature: false },
  { code: 'COUR_FIN_MAD',     label: 'Lettre fin de mise à disposition',    category: 'lettre',     requiresSignature: false },
  { code: 'COUR_REFERENCE',   label: 'Lettre de référence / recommandation',category: 'lettre',     requiresSignature: false },
];

// ─────────────────────────────────────── Représentation du personnel
export interface MandateTypeRef { code: string; label: string; threshold: string; termYears: number }
export const MANDATE_TYPES: MandateTypeRef[] = [
  { code: 'DP',     label: 'Délégué du personnel',     threshold: 'Effectif ≥ 10',  termYears: 2 },
  { code: 'CSE',    label: 'Comité Social Économique (CSE)', threshold: 'Effectif ≥ 50',  termYears: 4 },
  { code: 'CHSCT',  label: 'CHSCT',                     threshold: 'Effectif ≥ 50',  termYears: 4 },
  { code: 'DS',     label: 'Délégué syndical',          threshold: 'Désigné par syndicat',    termYears: 4 },
  { code: 'REF_HAR',label: 'Référent harcèlement',      threshold: 'Désigné DRH',    termYears: 0 },
];

export const ELECTION_PHASES = [
  { code: 'launch',        label: 'Lancement processus',         day: 'J-270' },
  { code: 'inform',        label: 'Information du personnel',    day: 'J-90'  },
  { code: 'electoral_list',label: 'Constitution liste électorale', day: 'J-60' },
  { code: 'candidacies',   label: 'Recueil des candidatures',    day: 'J-45 à J-20' },
  { code: 'lists_final',   label: 'Affichage des listes définitives', day: 'J-15' },
  { code: 'campaign',      label: 'Campagne électorale',         day: 'J-15 à J-1' },
  { code: 'voting',        label: 'Scrutin',                     day: 'J-0' },
  { code: 'counting',      label: 'Dépouillement + PV',          day: 'J-0' },
  { code: 'results',       label: 'Proclamation résultats',      day: 'J+1' },
  { code: 'posting',       label: 'Affichage liste élus',        day: 'J+1 à J+7' },
  { code: 'start',         label: 'Prise de fonctions',          day: 'J+jour' },
] as const;

// ─────────────────────────────────────── Obligations légales — DPAE
export interface DpaeOrganismRef { countryCode: string; organism: string }
export const DPAE_ORGANISMS: DpaeOrganismRef[] = [
  { countryCode: 'CI', organism: 'CNPS-CI' },
  { countryCode: 'SN', organism: 'IPRES + CSS + IPM' },
  { countryCode: 'ML', organism: 'INPS (+ ANPE, AMO)' },
  { countryCode: 'BF', organism: 'CNSS (+ ONPE)' },
  { countryCode: 'BJ', organism: 'CNSS Bénin' },
  { countryCode: 'TG', organism: 'CNSS (+ ANPE)' },
  { countryCode: 'NE', organism: 'CNSS Niger' },
  { countryCode: 'GW', organism: 'INSS' },
  { countryCode: 'CM', organism: 'CNPS Cameroun (+ CFC, FNE)' },
  { countryCode: 'GA', organism: 'CNSS Gabon (+ CNAMGS)' },
  { countryCode: 'CG', organism: 'CNSS Congo' },
  { countryCode: 'CF', organism: 'OCSS RCA' },
  { countryCode: 'TD', organism: 'CNPS Tchad' },
  { countryCode: 'GQ', organism: 'INSESO' },
];

export const MANDATORY_REGISTERS = [
  'Registre unique du personnel (RUP)',
  'Registre des mouvements',
  'Registre AT/MP (accidents travail / maladies pro)',
  'Registre médecine du travail',
  'Registre repos hebdomadaire',
  'Registre des heures supplémentaires',
  'Registre des élections',
  'Registre des mandats',
  'Registre PV CSE/DP',
  'Registre accords entreprise',
  'Registre des sanctions disciplinaires',
  'Registre formation professionnelle',
  'Registre apprentissage',
  'Registre stagiaires',
  'Registre handicap (BOETH quota 6 %)',
];

export const MANDATORY_DISPLAYS = [
  'Convention collective applicable',
  'Règlement intérieur',
  'Coordonnées Inspection du Travail',
  'Coordonnées médecine du travail',
  'Liste des élus DP/CSE',
  'Horaires de travail',
  'Repos hebdomadaire',
  'Planning congés payés (annuel)',
  'Consignes sécurité incendie',
  'Droit de retrait (sécurité)',
  'Index égalité H/F',
  'Lutte discrimination/harcèlement',
  'Numéros d\'urgence',
  'Coordonnées DGT',
];

// ─────────────────────────────────────────────────────── Expatriés
export const EXPAT_MOBILITY_TYPES = [
  'Salarié étranger local',
  'Expatrié classique',
  'Détaché',
  'Impatrié',
  'Double salaire',
  "Voyageur d'affaires",
];

export const EXPAT_PACKAGE_COMPONENTS = [
  'Sursalaire / prime d\'expatriation (25-50 %)',
  'Indemnité logement (ou logement de fonction)',
  'Frais scolarité enfants',
  'Voyages annuels famille',
  "Indemnité d'éloignement / pénibilité",
  'Indemnité pouvoir d\'achat (IPA)',
  'Compensation fiscale (tax equalization)',
  'Frais déménagement (initial + retour)',
  'Bagages personnels',
  'Véhicule de fonction',
  'Connectivité internationale',
  'Assurance santé internationale',
];

export const EXPAT_RENEWAL_THRESHOLDS = [90, 60, 30] as const;

// ─────────────────────────────────────────────────── Reporting RH
export const HR_KPIS = [
  { code: 'effectif_inscrit',    label: 'Effectif inscrit' },
  { code: 'effectif_moyen_etp',  label: 'Effectif moyen ETP' },
  { code: 'turnover_12m',        label: 'Turn-over 12 mois' },
  { code: 'turnover_precoce',    label: 'Turn-over précoce (< 1 an)' },
  { code: 'turnover_volontaire', label: 'Turn-over volontaire' },
  { code: 'age_moyen',           label: 'Âge moyen' },
  { code: 'anciennete_moyenne',  label: 'Ancienneté moyenne' },
  { code: 'pct_femmes',          label: '% femmes' },
  { code: 'mvts_entrees',        label: 'Entrées' },
  { code: 'mvts_sorties',        label: 'Sorties' },
  { code: 'at_declares',         label: 'AT déclarés' },
  { code: 'sanctions_disc',      label: 'Sanctions disciplinaires' },
  { code: 'heures_formation',    label: 'Heures formation' },
  { code: 'index_egalite',       label: 'Index égalité H/F' },
  { code: 'taux_absenteisme',    label: "Taux d'absentéisme" },
  { code: 'taux_handicap',       label: 'Taux handicap (quota 6 %)' },
];

export const BILAN_SOCIAL_CHAPTERS = [
  '1. Emploi (effectif, mouvements, structure)',
  '2. Rémunérations et charges',
  '3. Conditions de santé et de sécurité',
  '4. Autres conditions de travail',
  '5. Formation (continue, apprentissage)',
  '6. Relations professionnelles',
  '7. Autres conditions de vie',
];

// ─────────────────────────────────────────── Conformité / Audit
export const CONFORMITY_CHECKS = [
  'Création contrat : type conforme, durée essai légale, mentions obligatoires, CCN citée, salaire ≥ SMIG, clauses interdites absentes',
  'Avenant : modification compatible, notification préalable si substantielle, délai d\'acceptation',
  'Disciplinaire : entretien préalable, délai prescription, proportionnalité, voies de recours',
  'Licenciement : convocation, délais, notification LRAR, préavis légal, indemnités correctes',
];

export const EXTERNAL_CONTROLS = [
  'Inspection du Travail',
  'CNPS / IPRES / INPS',
  'DGI / DGID',
  'FDFP',
  'Médecine du travail',
  'Inspection Hygiène-Sécurité',
  'Préfecture (étrangers)',
];

// Conservation légale (années)
export const RETENTION_YEARS = {
  contrat: 30,
  avenant: 30,
  bulletin_paie: 10,
  certificat_travail: 30,
  attestations: 10,
  sanction_avertissement: 3,
  sanction_blame: 3,
  sanction_mise_a_pied: 5,
  sanction_licenciement: 30,
  medical: 40,
  procedure_contentieuse: 30,
} as const;
