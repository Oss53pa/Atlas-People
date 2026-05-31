/**
 * M12 CONFORMITÉ & SST — types du module Compliance + Santé Sécurité Travail.
 * Couvre OHADA (14 pays UEMOA + CEMAC) :
 * • DUER (Document Unique d'Évaluation des Risques)
 * • RPS (Risques psychosociaux) · enquêtes & cellule d'écoute
 * • Accidents du Travail (AT) & Maladies Professionnelles (MP)
 * • Registre du personnel (obligatoire OHADA)
 * • Déclarations sociales multi-pays (CNPS-CI / IPRES-SN / CNSS-CM-BF-NE / CNSS-GA-CG-TD)
 * • Visites médicales (embauche · périodique · reprise · spéciale)
 * • Habilitations & EPI
 * • Audits internes (RGPD · Sapin 2 · ISO · OHADA droit du travail)
 * • Inspections du travail
 * • Conservation légale (contrats 30 ans · paie 10 ans · disciplinaire 3 ans · DUER 5 ans glissants)
 */

// ───────────────────────── DUER — Document Unique
export type RiskCategory =
  | 'physique' | 'chimique' | 'biologique' | 'mecanique' | 'electrique'
  | 'incendie_explosion' | 'chute_hauteur' | 'tms' | 'psychosocial'
  | 'routier' | 'environnemental' | 'cyber';

export type RiskProbability = 1 | 2 | 3 | 4;     // rare → fréquent
export type RiskSeverity = 1 | 2 | 3 | 4;        // bénin → mortel
export type RiskLevel = 'acceptable' | 'modere' | 'eleve' | 'critique';

export interface RiskAssessment {
  id: string;
  ref: string;                          // RSK-2026-001
  unite: string;                        // unité de travail (ex. Open space tech)
  countryCode: string;
  category: RiskCategory;
  hazard: string;                       // ex. « TMS écran prolongé »
  probability: RiskProbability;
  severity: RiskSeverity;
  level: RiskLevel;                     // calculé P×S
  /** Mesures de prévention en place. */
  controls: string[];
  /** Plan d'actions correctives. */
  actions: { description: string; ownerEmployeeId: string; dueDate: string; status: 'todo' | 'in_progress' | 'done' }[];
  exposedEmployeeCount: number;
  lastReviewAt: string;
  nextReviewDue: string;                // DUER doit être révisé ≥ 1 fois/an
  createdAt: string;
  updatedAt: string;
}

// ───────────────────────── RPS — Risques psychosociaux
export type RpsSurveyStatus = 'draft' | 'open' | 'closed' | 'analyzed';
export interface RpsSurvey {
  id: string;
  ref: string;                          // RPS-2026-001
  title: string;
  countryCode: string;
  scope: 'company' | 'BU' | 'team';
  scopeLabel: string;
  status: RpsSurveyStatus;
  openedAt: string;
  closedAt?: string;
  targetRespondents: number;
  respondents: number;
  /** Score WHO-5 ou Karasek (selon enquête). */
  averageWellbeingScore?: number;       // /100
  burnoutRiskPct?: number;              // % de répondants à risque
  /** Cellule d'écoute déclenchée ? */
  listeningCellTriggered: boolean;
  insights?: string[];
}

// ───────────────────────── Accidents du Travail & Maladies Pro
export type IncidentType = 'AT' | 'MP' | 'AT_trajet' | 'presquAccident';
export type IncidentSeverity = 'sans_arret' | 'leger' | 'grave' | 'tres_grave' | 'mortel';
export type IncidentStatus = 'declare' | 'investigation' | 'cnps_filed' | 'closed' | 'litige';

export interface WorkIncident {
  id: string;
  ref: string;                          // INC-2026-001
  employeeId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  occurredAt: string;
  declaredAt: string;
  countryCode: string;
  unite: string;
  location: string;
  description: string;
  /** Jours d'arrêt prescrits. */
  workdaysLost: number;
  /** Tiers responsable identifié. */
  thirdPartyInvolved: boolean;
  /** Cause racine identifiée. */
  rootCause?: string;
  correctiveActions: string[];
  status: IncidentStatus;
  cnpsRef?: string;                     // référence dossier CNPS/IPRES
  /** Déclaration sous 48 h (OHADA) ? */
  declaredWithinSLA: boolean;
}

// ───────────────────────── Registre du personnel OHADA
export interface RegisterEntry {
  id: string;
  /** Numéro d'ordre dans le registre. */
  matricule: number;
  employeeId: string;
  countryCode: string;
  /** Date d'entrée et sortie consignées. */
  entryDate: string;
  exitDate?: string;
  exitReason?: string;
  /** Tampons / signatures inspection. */
  inspectionVisas: { date: string; inspector: string; comment?: string }[];
}

// ───────────────────────── Déclarations sociales
export type DeclarationKind =
  | 'CNPS_CI' | 'IPRES_SN' | 'CNSS_BJ' | 'CNSS_BF' | 'CNSS_TG' | 'CNSS_NE' | 'INPS_ML'
  | 'INSS_GW' | 'CNPS_CM' | 'CNSS_GA' | 'CNSS_CG' | 'CNSS_CF' | 'CNPS_TD' | 'INSESO_GQ'
  | 'DGI' | 'DISA' | 'CNAM';
export type DeclarationStatus = 'draft' | 'submitted' | 'paid' | 'overdue' | 'rejected';
export type DeclarationFrequency = 'monthly' | 'quarterly' | 'annual';

export interface SocialDeclaration {
  id: string;
  ref: string;                          // CNPS-CI-2026-04
  kind: DeclarationKind;
  countryCode: string;
  period: string;                       // 2026-04 ou 2026-Q2
  frequency: DeclarationFrequency;
  status: DeclarationStatus;
  dueDate: string;
  submittedAt?: string;
  paidAt?: string;
  /** Montant déclaré (FCFA). */
  amountDeclared: number;
  /** Pénalité de retard (si applicable). */
  penalty?: number;
  /** Nb salariés concernés. */
  headcount: number;
}

// ───────────────────────── Visites médicales
export type MedicalVisitKind = 'embauche' | 'periodique' | 'reprise' | 'surveillance_renforcee' | 'preretraite';
export type MedicalAptitude = 'apte' | 'apte_amenagement' | 'inapte_temporaire' | 'inapte_definitif' | 'a_revoir';

export interface MedicalVisit {
  id: string;
  ref: string;
  employeeId: string;
  kind: MedicalVisitKind;
  scheduledAt: string;
  performedAt?: string;
  practitioner?: string;
  aptitude?: MedicalAptitude;
  restrictions?: string[];
  nextVisitDue?: string;                // périodicité
  notes?: string;                       // limité au médecin du travail (CONFIDENTIEL)
}

// ───────────────────────── Habilitations & EPI
export type AuthorizationKind = 'electrique' | 'chimique' | 'travaux_hauteur' | 'cariste' | 'soudure' | 'permis_feu' | 'conduite';
export interface Authorization {
  id: string;
  ref: string;
  employeeId: string;
  kind: AuthorizationKind;
  level: string;                        // ex. BS-BE manœuvre
  issuedAt: string;
  expiresAt: string;
  status: 'active' | 'pending_renewal' | 'expired';
  issuingAuthority: string;
}

export interface EpiAssignment {
  id: string;
  employeeId: string;
  category: 'chaussures' | 'casque' | 'gants' | 'lunettes' | 'masque' | 'harnais' | 'vetement' | 'bouchons';
  modelLabel: string;
  size?: string;
  issuedAt: string;
  /** Date du prochain renouvellement prévu. */
  renewalDue?: string;
  acknowledgedByEmployee: boolean;
}

// ───────────────────────── Audits internes
export type AuditScope = 'RGPD' | 'Sapin2' | 'ISO27001' | 'ISO9001' | 'OHADA_droit_travail' | 'paie' | 'temps' | 'recrutement' | 'general';
export type AuditStatus = 'planned' | 'in_progress' | 'completed' | 'overdue';
export type FindingSeverity = 'critical' | 'major' | 'minor' | 'observation';
export type FindingStatus = 'open' | 'in_remediation' | 'closed' | 'accepted_risk';

export interface AuditFinding {
  id: string;
  ref: string;                          // FND-2026-AUD01-003
  severity: FindingSeverity;
  domain: string;
  description: string;
  recommendation: string;
  ownerEmployeeId: string;
  dueDate: string;
  status: FindingStatus;
  closedAt?: string;
  evidence?: string;
}

export interface Audit {
  id: string;
  ref: string;                          // AUD-2026-001
  scope: AuditScope;
  title: string;
  leadAuditorEmployeeId: string;
  externalAuditor?: string;
  countryCode: string;
  status: AuditStatus;
  plannedAt: string;
  startedAt?: string;
  completedAt?: string;
  findings: AuditFinding[];
  /** Score global (0-100). */
  conformityScore?: number;
  reportUrl?: string;
}

// ───────────────────────── Inspections du travail
export type InspectionOutcome = 'conforme' | 'observations' | 'mise_en_demeure' | 'PV';
export interface LaborInspection {
  id: string;
  ref: string;
  countryCode: string;
  inspectorName: string;
  inspectorAuthority: string;
  visitedAt: string;
  outcome: InspectionOutcome;
  findings: string[];
  /** Pénalités encourues (FCFA). */
  penalties?: number;
  /** Date limite de mise en conformité. */
  remediationDueAt?: string;
  followUpDoneAt?: string;
}

// ───────────────────────── Conservation légale
export type DocumentClass =
  | 'contrat' | 'avenant' | 'paie' | 'cnps' | 'disciplinaire' | 'duer' | 'visite_medicale'
  | 'inspection' | 'audit' | 'declaration_sociale' | 'registre_personnel' | 'AT_MP';

export interface RetentionPolicy {
  documentClass: DocumentClass;
  label: string;
  /** Durée en années — `null` si conservation à vie. */
  durationYears: number | null;
  /** Base légale / source. */
  legalBasis: string;
  /** Méthode de purge. */
  purgeMethod: 'shred_pdf' | 'archive_cold' | 'anonymize' | 'destroy_certified';
  notes?: string;
}

// ───────────────────────── KPIs Cockpit
export interface ConformiteKPI {
  conformityScoreGlobal: number;        // 0-100
  duerRisksTotal: number;
  duerRisksCritical: number;
  duerNextReviewInDays: number;
  atFrequencyRate: number;              // TF = (nb AT × 1 000 000) / heures travaillées (mock)
  atSeverityRate: number;               // TG = (j arrêt × 1 000) / heures travaillées (mock)
  atOpenCount: number;
  declarationsDueIn7d: number;
  declarationsOverdue: number;
  visitesEnRetardCount: number;
  habilitationsExpirantes30j: number;
  rpsBurnoutRiskPct: number;            // dernière enquête
  rpsLastSurveyDaysAgo: number;
  auditsOpenFindings: number;
  auditsCriticalFindings: number;
  inspectionsOpenActions: number;
  retentionsExpiringYear: number;
}
