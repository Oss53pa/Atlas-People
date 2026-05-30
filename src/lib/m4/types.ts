/**
 * M4 ADMIN RH — types du module Administration du personnel (OHADA/SYSCOHADA).
 * Cycle administratif complet : contrats, avenants, événements, période d'essai,
 * départs, disciplinaire, certificats, représentation, obligations, expatriés.
 * Tous les actes juridiquement opposables sont signés (ADVIST) et tracés (SHA-256).
 */

// ─────────────────────────────────────────────────────────── Contrats
export type ContractTypeCode =
  | 'CDI' | 'CDD' | 'CDD_CHANTIER' | 'CDD_SAISON' | 'CDD_REMP'
  | 'APPR' | 'STAGE' | 'INTERIM' | 'MANDAT' | 'TPS_PART' | 'EXPAT';

export type ContractStatus =
  | 'draft' | 'validated_n1' | 'signed_employer' | 'pending_employee'
  | 'signed_both' | 'active' | 'terminated' | 'archived' | 'suspended';

export interface ContractAllowance { label: string; amount: number }
export interface ContractSignature { party: 'employer' | 'employee'; name: string; at?: string }

export interface EmploymentContract {
  id: string;
  ref: string;                  // CTR-…-00042
  employeeId: string;
  type: ContractTypeCode;
  convention: string;
  status: ContractStatus;
  societe: string;
  etablissement: string;
  signedAt?: string;
  hireDate: string;
  effectiveDate: string;
  endDate?: string;             // CDD
  probationMonths?: number;
  probationConfirmedAt?: string;
  fonction: string;
  service: string;
  classification: string;
  coefficient?: number;
  baseSalary: number;
  allowances: ContractAllowance[];
  workTime: string;             // 'Plein temps' | 'Temps partiel'
  weeklyHours: number;
  workplace: string;
  teletravail?: string;
  clauses: string[];
  advistHash?: string;
  signatures: ContractSignature[];
}

// ─────────────────────────────────────────────────────────── Avenants
export type AmendmentSensitivity = 'low' | 'medium' | 'high';
export type AmendmentStatus = 'draft' | 'validated' | 'signed_employer' | 'signed_employee' | 'active';

export interface AmendmentTypeRef {
  code: string;
  label: string;
  categoryCode: string;
  sensitivity: AmendmentSensitivity;
  payrollImpact: boolean;
}

export interface ContractAmendment {
  id: string;
  ref: string;                  // AV-2026-0042
  employeeId: string;
  contractId: string;
  typeCode: string;
  typeLabel: string;
  categoryCode: string;
  objet: string;
  effectiveDate: string;
  signedAt?: string;
  status: AmendmentStatus;
  sensitivity: AmendmentSensitivity;
  before?: string;
  after?: string;
  payrollDelta?: number;        // FCFA delta sur le brut mensuel
}

// ─────────────────────────────────────────────────────── Événements admin
export type AdminEventCategory =
  | 'EMBAUCHE' | 'MOBILITE' | 'SUSPENSION' | 'REPRISE'
  | 'FIN_CARRIERE' | 'EXCEPTIONNELS' | 'ADMIN';

export interface AdminEvent {
  id: string;
  ref: string;                  // EVT-…-00876
  employeeId: string;
  category: AdminEventCategory;
  type: string;
  date: string;
  recordedBy: string;
  status: 'done' | 'pending' | 'scheduled';
  detail?: string;
  impacts?: string[];           // ex. 'Parts fiscales 2 → 2,5 (M3)'
  documents?: string[];
  auto?: boolean;
}

// ─────────────────────────────────────────────────────── Période d'essai
export type ProbationDecision = 'pending' | 'confirmation' | 'prolongation' | 'rupture';

export interface ProbationPeriod {
  id: string;
  employeeId: string;
  contractType: ContractTypeCode;
  category: string;             // Cadre / Maîtrise / Employé / Ouvrier
  durationMonths: number;
  startDate: string;
  endDate: string;
  intermediateEvalDate?: string;
  intermediateEvalDone?: boolean;
  decision: ProbationDecision;
  decisionNotifiedAt?: string;
  document?: string;
}

// ─────────────────────────────────────────────────────────── Départs
export type DepartureTypeCode =
  | 'demission' | 'licenciement_perso' | 'licenciement_eco' | 'rupture_conv'
  | 'fin_cdd' | 'retraite' | 'deces' | 'rupture_essai';

export type DepartureStatus = 'initiated' | 'notice' | 'handover' | 'stc_pending' | 'documents' | 'executed';

export interface DepartureDocument { name: string; status: 'pending' | 'generated' | 'signed' }
export interface DepartureStep { label: string; done: boolean; date?: string }

export interface Departure {
  id: string;
  ref: string;
  employeeId: string;
  type: DepartureTypeCode;
  initiatedAt: string;
  noticeStart?: string;
  noticeEnd?: string;
  effectiveDate: string;
  status: DepartureStatus;
  stcAmount?: number;           // solde de tout compte (lien M3)
  reason?: string;
  documents: DepartureDocument[];
  steps: DepartureStep[];
}

// ─────────────────────────────────────────────────────── Disciplinaire
export type FauteLevel = 'simple' | 'grave' | 'lourde';
export type SanctionType =
  | 'avertissement' | 'blame' | 'mise_a_pied' | 'retrogradation' | 'licenciement_faute';

export type DisciplinaryStatus =
  | 'open' | 'convocation' | 'hearing' | 'sanctioned' | 'appealed' | 'closed' | 'archived';

export interface DisciplinaryProcedure {
  id: string;
  ref: string;
  employeeId: string;
  motif: string;
  faute: FauteLevel;
  openedAt: string;
  convocationAt?: string;
  hearingAt?: string;
  sanction?: SanctionType;
  sanctionNotifiedAt?: string;
  effacementDate?: string;      // 3 ans (sauf récidive)
  status: DisciplinaryStatus;
  appeal?: boolean;
  steps: { label: string; date?: string; done: boolean; legalDelay?: string }[];
}

// ─────────────────────────────────────────────────────── Certificats
export type CertificateCategory = 'certificat' | 'attestation' | 'lettre';
export interface CertificateTypeRef {
  code: string;
  label: string;
  category: CertificateCategory;
  requiresSignature: boolean;   // signature DRH ADVIST
}
export interface GeneratedCertificate {
  id: string;
  ref: string;
  employeeId: string;
  typeCode: string;
  typeLabel: string;
  category: CertificateCategory;
  generatedAt: string;
  status: 'draft' | 'generated' | 'signed' | 'delivered';
  signedBy?: string;
}

// ─────────────────────────────────────────────────── Représentation
export interface RepresentationMandate {
  id: string;
  employeeId: string;
  type: string;                 // Délégué du personnel, CSE, Délégué syndical, Réf. harcèlement
  mode: 'elu' | 'designe';
  start: string;
  end?: string;
  protectedUntil?: string;
  delegationHours?: number;
  status: 'active' | 'ended';
}

export interface RepresentationElection {
  id: string;
  instance: string;             // DP / CSE
  societe: string;
  scheduledDate: string;
  phase: 'planned' | 'candidacies' | 'voting' | 'results' | 'closed';
  seats: number;
  turnout?: number;
}

// ─────────────────────────────────────────────────── Obligations légales
export interface DpaeRecord {
  id: string;
  employeeId: string;
  countryCode: string;
  organism: string;            // CNPS, IPRES/CSS, CNSS…
  filedAt?: string;
  receiptRef?: string;
  status: 'pending' | 'filed' | 'received';
  deadline: string;
}
export interface LegalObligationItem {
  id: string;
  kind: 'register' | 'display' | 'declaration';
  label: string;
  scope: string;               // société / établissement
  status: 'ok' | 'due' | 'overdue';
  lastUpdate?: string;
  nextDue?: string;
}

// ─────────────────────────────────────────────────────────── Expatriés
export interface ExpatPermitDoc { label: string; ref?: string; expiry: string }
export interface ExpatFile {
  id: string;
  employeeId: string;
  originCountry: string;
  hostCountry: string;
  missionType: string;          // Contrat local / Détachement / Mise à disposition
  missionStart: string;
  missionEnd: string;
  visa?: ExpatPermitDoc;
  workPermit?: ExpatPermitDoc;
  residenceCard?: ExpatPermitDoc;
  package: { label: string; value: string }[];
  surSalairePct?: number;
}

// ─────────────────────────────────────────────────── Pièces / divers
export interface AdminPiece {
  id: string;
  employeeId: string;
  name: string;
  category: string;            // Contrat / Avenant / Diplôme / ID / Médical / Sanction / Certificat / Visa / Autre
  date: string;
  signed: boolean | null;      // null = N/A
  restricted?: boolean;
}
export interface Courrier {
  id: string;
  employeeId: string;
  direction: 'out' | 'in';
  objet: string;
  date: string;
  channel: 'email' | 'portal' | 'postal';
  status: string;
}
export interface MedicalEvent {
  id: string;
  employeeId: string;
  type: string;
  date: string;
  aptitude: 'Apte' | 'Apte avec réserves' | 'Inapte' | 'Programmée';
  hasDoc: boolean;
}
export interface Habilitation {
  id: string;
  employeeId: string;
  label: string;
  obtainedAt?: string;
  expiry?: string;
  status: 'valid' | 'expiring' | 'expired' | 'na';
}
export interface AdminAuditEntry {
  id: string;
  employeeId?: string;
  at: string;
  actor: string;
  action: string;              // admin.avenant.signed …
  detail: string;
  hash: string;
}

// ─────────────────────────────────────────────────── Alertes / KPIs
export type AlertSeverity = 'info' | 'warn' | 'danger';
export interface AdminAlert {
  id: string;
  employeeId: string;
  severity: AlertSeverity;
  kind: 'cdd' | 'probation' | 'expat' | 'mandate' | 'habilitation' | 'medical' | 'disciplinary';
  message: string;
  dueDate: string;
  daysLeft: number;
}
