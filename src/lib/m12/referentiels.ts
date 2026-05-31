/**
 * M12 CONFORMITÉ & SST — référentiels.
 * Méta UI · catalogue déclarations sociales OHADA · périodicités visites médicales
 * · politiques de conservation légales · seuils & SLA.
 */
import type {
  RiskCategory, RiskLevel, RpsSurveyStatus, IncidentType, IncidentSeverity,
  IncidentStatus, DeclarationKind, DeclarationStatus, DeclarationFrequency,
  MedicalVisitKind, MedicalAptitude, AuthorizationKind, AuditScope, AuditStatus,
  FindingSeverity, FindingStatus, InspectionOutcome, DocumentClass, RetentionPolicy,
} from './types';

// ───────────────────────── DUER
export const RISK_CATEGORY_META: Record<RiskCategory, { label: string; icon: string }> = {
  physique:          { label: 'Risque physique',         icon: 'zap' },
  chimique:          { label: 'Risque chimique',         icon: 'flask-conical' },
  biologique:        { label: 'Risque biologique',       icon: 'bug' },
  mecanique:         { label: 'Risque mécanique',        icon: 'cog' },
  electrique:        { label: 'Risque électrique',       icon: 'zap-off' },
  incendie_explosion:{ label: 'Incendie / explosion',    icon: 'flame' },
  chute_hauteur:     { label: 'Chute de hauteur',        icon: 'arrow-down' },
  tms:               { label: 'TMS (troubles musculo.)', icon: 'activity' },
  psychosocial:      { label: 'Psychosocial',            icon: 'brain' },
  routier:           { label: 'Routier / trajet',        icon: 'car' },
  environnemental:   { label: 'Environnemental',         icon: 'leaf' },
  cyber:             { label: 'Cyber',                   icon: 'shield' },
};

export const RISK_LEVEL_META: Record<RiskLevel, { label: string; tone: 'success' | 'info' | 'warn' | 'danger'; color: string }> = {
  acceptable: { label: 'Acceptable', tone: 'success', color: 'emerald' },
  modere:     { label: 'Modéré',     tone: 'info',    color: 'sky' },
  eleve:      { label: 'Élevé',      tone: 'warn',    color: 'amber' },
  critique:   { label: 'Critique',   tone: 'danger',  color: 'rose' },
};

/** Calcul niveau à partir de probabilité × sévérité. */
export function computeRiskLevel(p: number, s: number): RiskLevel {
  const score = p * s;
  if (score >= 12) return 'critique';
  if (score >= 8) return 'eleve';
  if (score >= 4) return 'modere';
  return 'acceptable';
}

// ───────────────────────── RPS
export const RPS_STATUS_META: Record<RpsSurveyStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'warn' }> = {
  draft:    { label: 'Brouillon', tone: 'neutral' },
  open:     { label: 'Ouverte',   tone: 'info'    },
  closed:   { label: 'Clôturée',  tone: 'warn'    },
  analyzed: { label: 'Analysée',  tone: 'success' },
};

export const RPS_FRAMEWORKS = [
  { code: 'WHO-5',    label: 'WHO-5 Wellbeing Index',  description: '5 items, score 0-100 — dépistage standard OMS.' },
  { code: 'Karasek',  label: 'Karasek Job Strain',     description: 'Demande × autonomie × support — détection job strain.' },
  { code: 'COPSOQ',   label: 'COPSOQ III',             description: 'Questionnaire psychosocial danois — référence académique.' },
  { code: 'Maslach',  label: 'Maslach Burnout Inv.',   description: 'Épuisement émotionnel · dépersonnalisation · accomplissement.' },
];

// ───────────────────────── AT / MP
export const INCIDENT_TYPE_META: Record<IncidentType, { label: string; description: string }> = {
  AT:             { label: 'Accident du travail',     description: 'Survenu pendant les heures de travail au temps et lieu de travail.' },
  AT_trajet:      { label: 'Accident de trajet',      description: 'Entre domicile et lieu de travail, par itinéraire normal.' },
  MP:             { label: 'Maladie professionnelle', description: 'Affection consécutive à l\'exposition au risque (tableaux MP OHADA).' },
  presquAccident: { label: 'Presqu\'accident',         description: 'Sans dommage corporel mais qui aurait pu en causer.' },
};

export const INCIDENT_SEVERITY_META: Record<IncidentSeverity, { label: string; tone: 'success' | 'info' | 'warn' | 'danger' }> = {
  sans_arret:   { label: 'Sans arrêt',     tone: 'success' },
  leger:        { label: 'Léger',          tone: 'info'    },
  grave:        { label: 'Grave',          tone: 'warn'    },
  tres_grave:   { label: 'Très grave',     tone: 'danger'  },
  mortel:       { label: 'Mortel',         tone: 'danger'  },
};

export const INCIDENT_STATUS_META: Record<IncidentStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'danger' }> = {
  declare:        { label: 'Déclaré',         tone: 'info'    },
  investigation:  { label: 'Investigation',   tone: 'info'    },
  cnps_filed:     { label: 'Dossier CNPS',    tone: 'info'    },
  closed:         { label: 'Clôturé',         tone: 'success' },
  litige:         { label: 'Litige',          tone: 'danger'  },
};

// ───────────────────────── Déclarations sociales
export const DECLARATION_KIND_META: Record<DeclarationKind, { label: string; authority: string; countryCode: string; legalBasis: string }> = {
  CNPS_CI:     { label: 'CNPS Côte d\'Ivoire',  authority: 'CNPS',     countryCode: 'CI', legalBasis: 'Loi 99-477' },
  IPRES_SN:    { label: 'IPRES Sénégal',         authority: 'IPRES',    countryCode: 'SN', legalBasis: 'Loi 2002-08 + Code Sécu' },
  CNSS_BJ:     { label: 'CNSS Bénin',            authority: 'CNSS',     countryCode: 'BJ', legalBasis: 'Loi 98-019' },
  CNSS_BF:     { label: 'CNSS Burkina Faso',     authority: 'CNSS',     countryCode: 'BF', legalBasis: 'Loi 022-2006' },
  CNSS_TG:     { label: 'CNSS Togo',             authority: 'CNSS',     countryCode: 'TG', legalBasis: 'Code Sécu togolais' },
  CNSS_NE:     { label: 'CNSS Niger',            authority: 'CNSS',     countryCode: 'NE', legalBasis: 'Loi 2003-34' },
  INPS_ML:     { label: 'INPS Mali',             authority: 'INPS',     countryCode: 'ML', legalBasis: 'Loi 99-046' },
  INSS_GW:     { label: 'INSS Guinée-Bissau',    authority: 'INSS',     countryCode: 'GW', legalBasis: 'Code SS' },
  CNPS_CM:     { label: 'CNPS Cameroun',         authority: 'CNPS',     countryCode: 'CM', legalBasis: 'Loi 92-007' },
  CNSS_GA:     { label: 'CNSS Gabon',            authority: 'CNSS',     countryCode: 'GA', legalBasis: 'Code SS gabonais' },
  CNSS_CG:     { label: 'CNSS Congo',            authority: 'CNSS',     countryCode: 'CG', legalBasis: 'Loi 4-86' },
  CNSS_CF:     { label: 'CNSS Centrafrique',     authority: 'CNSS',     countryCode: 'CF', legalBasis: 'Code SS RCA' },
  CNPS_TD:     { label: 'CNPS Tchad',            authority: 'CNPS',     countryCode: 'TD', legalBasis: 'Loi 008-PR-2006' },
  INSESO_GQ:   { label: 'INSESO Guinée Équat.',  authority: 'INSESO',   countryCode: 'GQ', legalBasis: 'Loi SS GQ' },
  DGI:         { label: 'IRPP / Taxe sur salaires', authority: 'DGI',   countryCode: '*',  legalBasis: 'CGI' },
  DISA:        { label: 'DISA',                  authority: 'CNPS',     countryCode: 'CI', legalBasis: 'Décret CI' },
  CNAM:        { label: 'CMU / CNAM',            authority: 'CNAM',     countryCode: 'CI', legalBasis: 'Loi CMU' },
};

export const DECLARATION_STATUS_META: Record<DeclarationStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'danger' }> = {
  draft:     { label: 'Brouillon', tone: 'neutral' },
  submitted: { label: 'Soumise',   tone: 'info'    },
  paid:      { label: 'Payée',     tone: 'success' },
  overdue:   { label: 'En retard', tone: 'danger'  },
  rejected:  { label: 'Rejetée',   tone: 'danger'  },
};

export const DECLARATION_FREQUENCY_META: Record<DeclarationFrequency, { label: string; cadence: string }> = {
  monthly:   { label: 'Mensuelle',    cadence: 'avant le 15 du mois M+1' },
  quarterly: { label: 'Trimestrielle', cadence: 'avant le 15 du mois suivant le trimestre' },
  annual:    { label: 'Annuelle',     cadence: 'avant le 31 mars année N+1' },
};

// ───────────────────────── Visites médicales
export const VISIT_KIND_META: Record<MedicalVisitKind, { label: string; cadenceMonths: number; description: string }> = {
  embauche:                 { label: 'Embauche',                cadenceMonths: 0,  description: 'Obligatoire avant prise de poste (OHADA).' },
  periodique:               { label: 'Périodique',              cadenceMonths: 24, description: 'Tous les 2 ans pour adulte sans risque particulier.' },
  reprise:                  { label: 'Reprise',                 cadenceMonths: 0,  description: 'Après arrêt > 30 j ou AT/MP / congé mat.' },
  surveillance_renforcee:   { label: 'Surveillance renforcée',  cadenceMonths: 12, description: 'Annuelle pour exposés à risques (chimie, bruit, nuit).' },
  preretraite:              { label: 'Pré-retraite',            cadenceMonths: 0,  description: 'Bilan dans les 12 mois avant départ.' },
};

export const APTITUDE_META: Record<MedicalAptitude, { label: string; tone: 'success' | 'info' | 'warn' | 'danger' }> = {
  apte:               { label: 'Apte',                tone: 'success' },
  apte_amenagement:   { label: 'Apte aménagé',        tone: 'info'    },
  inapte_temporaire:  { label: 'Inapte temp.',        tone: 'warn'    },
  inapte_definitif:   { label: 'Inapte définitif',    tone: 'danger'  },
  a_revoir:           { label: 'À revoir',            tone: 'warn'    },
};

// ───────────────────────── Habilitations
export const AUTH_KIND_META: Record<AuthorizationKind, { label: string; basis: string }> = {
  electrique:       { label: 'Habilitation électrique', basis: 'NFC 18-510' },
  chimique:         { label: 'Manipulation chimique',   basis: 'Fiches données sécurité' },
  travaux_hauteur:  { label: 'Travaux en hauteur',      basis: 'Décret travaux dangereux' },
  cariste:          { label: 'CACES cariste',           basis: 'Recommandation R-389' },
  soudure:          { label: 'Soudure',                 basis: 'Qualif. AWS/EN' },
  permis_feu:       { label: 'Permis de feu',           basis: 'Procédure incendie interne' },
  conduite:         { label: 'Permis de conduire',      basis: 'Code de la route' },
};

// ───────────────────────── Audits
export const AUDIT_SCOPE_META: Record<AuditScope, { label: string; standard: string }> = {
  RGPD:                { label: 'RGPD / Loi 2013-450 CI', standard: 'Règlement UE 2016/679' },
  Sapin2:              { label: 'Anti-corruption Sapin 2', standard: 'Loi 2016-1691' },
  ISO27001:            { label: 'Sécurité ISO 27001',     standard: 'ISO/IEC 27001:2022' },
  ISO9001:             { label: 'Qualité ISO 9001',       standard: 'ISO 9001:2015' },
  OHADA_droit_travail: { label: 'Droit du travail OHADA', standard: 'Acte uniforme + Codes nationaux' },
  paie:                { label: 'Audit paie',             standard: 'Procédures internes + CGI' },
  temps:               { label: 'Audit temps & présence', standard: 'Code du travail' },
  recrutement:         { label: 'Audit recrutement',      standard: 'RGPD + non-discrimination' },
  general:             { label: 'Audit général',          standard: 'Référentiel interne' },
};

export const AUDIT_STATUS_META: Record<AuditStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'danger' }> = {
  planned:     { label: 'Planifié',   tone: 'neutral' },
  in_progress: { label: 'En cours',   tone: 'info'    },
  completed:   { label: 'Terminé',    tone: 'success' },
  overdue:     { label: 'En retard',  tone: 'danger'  },
};

export const FINDING_SEVERITY_META: Record<FindingSeverity, { label: string; tone: 'success' | 'warn' | 'danger'; weight: number }> = {
  critical:    { label: 'Critique',    tone: 'danger',  weight: 4 },
  major:       { label: 'Majeur',      tone: 'danger',  weight: 3 },
  minor:       { label: 'Mineur',      tone: 'warn',    weight: 2 },
  observation: { label: 'Observation', tone: 'success', weight: 1 },
};

export const FINDING_STATUS_META: Record<FindingStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'warn' }> = {
  open:           { label: 'Ouvert',       tone: 'warn'    },
  in_remediation: { label: 'En remédiation', tone: 'info'  },
  closed:         { label: 'Clôturé',      tone: 'success' },
  accepted_risk:  { label: 'Risque accepté', tone: 'neutral' },
};

// ───────────────────────── Inspections du travail
export const INSPECTION_OUTCOME_META: Record<InspectionOutcome, { label: string; tone: 'success' | 'info' | 'warn' | 'danger' }> = {
  conforme:       { label: 'Conforme',          tone: 'success' },
  observations:   { label: 'Observations',      tone: 'info'    },
  mise_en_demeure:{ label: 'Mise en demeure',   tone: 'warn'    },
  PV:             { label: 'Procès-verbal',     tone: 'danger'  },
};

// ───────────────────────── Conservation légale OHADA
export const RETENTION_POLICIES: Record<DocumentClass, RetentionPolicy> = {
  contrat:             { documentClass: 'contrat',             label: 'Contrats & avenants',         durationYears: 30, legalBasis: 'Code travail OHADA + prescription 30 ans', purgeMethod: 'archive_cold' },
  avenant:             { documentClass: 'avenant',             label: 'Avenants',                    durationYears: 30, legalBasis: 'Aligné contrats',                            purgeMethod: 'archive_cold' },
  paie:                { documentClass: 'paie',                label: 'Bulletins de paie & journaux', durationYears: 10, legalBasis: 'Code travail + Code commerce',               purgeMethod: 'archive_cold', notes: 'Conservation employeur ≥ 5 ans · employé droit à 10 ans.' },
  cnps:                { documentClass: 'cnps',                label: 'Déclarations CNPS / IPRES',   durationYears: 10, legalBasis: 'Codes de Sécurité Sociale',                purgeMethod: 'archive_cold' },
  disciplinaire:       { documentClass: 'disciplinaire',       label: 'Sanctions disciplinaires',    durationYears: 3,  legalBasis: 'Code travail (effacement amnistie)',        purgeMethod: 'destroy_certified', notes: 'Effacement automatique sans nouvelle sanction.' },
  duer:                { documentClass: 'duer',                label: 'DUER & versions historiques', durationYears: 5,  legalBasis: 'Code travail SST',                           purgeMethod: 'archive_cold', notes: '5 dernières versions glissantes.' },
  visite_medicale:     { documentClass: 'visite_medicale',     label: 'Dossiers médicaux',           durationYears: 50, legalBasis: 'Secret médical · code santé',                purgeMethod: 'destroy_certified', notes: 'Médecin du travail uniquement.' },
  inspection:          { documentClass: 'inspection',          label: 'PV inspection du travail',    durationYears: 10, legalBasis: 'Procédure administrative',                  purgeMethod: 'archive_cold' },
  audit:               { documentClass: 'audit',               label: 'Rapports d\'audit',           durationYears: 7,  legalBasis: 'Référentiel interne + ISO',                purgeMethod: 'shred_pdf' },
  declaration_sociale: { documentClass: 'declaration_sociale', label: 'Déclarations sociales',       durationYears: 10, legalBasis: 'Code sécu + commerce',                       purgeMethod: 'archive_cold' },
  registre_personnel:  { documentClass: 'registre_personnel',  label: 'Registre du personnel',       durationYears: null, legalBasis: 'OHADA — conservation à vie',                purgeMethod: 'archive_cold' },
  AT_MP:               { documentClass: 'AT_MP',               label: 'Dossiers AT/MP',              durationYears: 30, legalBasis: 'Code SS + prescription accidents',           purgeMethod: 'archive_cold' },
};

// ───────────────────────── Seuils & SLA
export const COMPLIANCE_THRESHOLDS = {
  AT_DECLARATION_HOURS: 48,                   // SLA OHADA déclaration AT
  DUER_REVIEW_MAX_DAYS: 365,                  // révision annuelle obligatoire
  HABILITATION_ALERT_DAYS: 90,                // alerte avant expiration
  VISITE_PERIODIC_GRACE_DAYS: 30,             // dépassement toléré
  DECLARATION_DUE_ALERT_DAYS: 7,
  AUDIT_FINDING_CRITICAL_MAX_DAYS: 30,        // SLA traitement finding critique
  AUDIT_FINDING_MAJOR_MAX_DAYS: 90,
  CONFORMITY_SCORE_TARGET: 85,                // / 100
  RPS_BURNOUT_ALERT_PCT: 20,                  // % à risque
  TF_TARGET_MAX: 15,                          // Taux de fréquence cible (≤)
  TG_TARGET_MAX: 0.5,                         // Taux de gravité cible (≤)
};

// ───────────────────────── Bonnes pratiques
export const COMPLIANCE_BEST_PRACTICES: string[] = [
  'Mise à jour DUER au minimum 1 fois par an + à chaque nouveau poste/équipement.',
  'Déclarer tout AT sous 48 h ouvrées à la CNPS/IPRES locale.',
  'Visite médicale embauche AVANT prise effective de poste — sans exception.',
  'Conservation registre du personnel à vie · contrats 30 ans · paie 10 ans.',
  'Audit RGPD ≥ 1 fois/an sur traitement RH (article 30 RGPD).',
  'Enquête RPS ≥ 1 fois/an + cellule d\'écoute si burnout pct ≥ 20 %.',
  'Habilitations électriques renouvelées tous les 3 ans (NFC 18-510).',
  'Suivi 4 indicateurs SST : TF, TG, taux d\'absentéisme, taux de turnover.',
];
