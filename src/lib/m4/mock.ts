/**
 * M4 ADMIN RH — données démo seedées sur EMPLOYEES.
 * Une vie administrative complète par collaborateur : contrat, avenants,
 * événements, période d'essai, pièces, mandats, expatriation, audit.
 */
import { EMPLOYEES, employeeName, matricule, type EmployeeRecord } from '../../data/mock';
import { AMENDMENT_TYPES, DPAE_ORGANISMS, MANDATORY_DISPLAYS, MANDATORY_REGISTERS } from './referentiels';
import type {
  EmploymentContract, ContractAmendment, AdminEvent, ProbationPeriod, Departure,
  DisciplinaryProcedure, GeneratedCertificate, RepresentationMandate, RepresentationElection,
  ExpatFile, AdminPiece, Courrier, MedicalEvent, Habilitation, AdminAuditEntry, AdminAlert,
  DpaeRecord, LegalObligationItem,
} from './types';

// ───────────────────────────────────────── helpers
const TODAY = new Date('2026-05-30');
function ymd(d: Date) { return d.toISOString().slice(0, 10); }
function plusDays(d: string, days: number) { const x = new Date(d); x.setDate(x.getDate() + days); return ymd(x); }
function diffDays(a: string, b = ymd(TODAY)) { return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000); }
function societeForCountry(c: string) { return c === 'SN' ? 'Atlas Studio Sénégal SUARL' : 'Atlas Studio CI SARL'; }
function conventionForCountry(c: string) { return c === 'SN' ? 'CCN Commerce Sénégal 2019' : 'CCN Commerce Côte d\'Ivoire 2018'; }
function siteForDept(d: string) { return d === 'Technologie' ? 'Plateau Innovation' : d === 'Finance' ? 'Direction Générale Cocody' : d === 'Ventes' ? 'Showroom Marcory' : 'Siège Plateau'; }
function classifFromRole(r: string) {
  const x = r.toLowerCase();
  if (x.includes('dir') || x.includes('lead') || x.includes('manager') || x.includes('senior')) return 'Cadre B · Échelon 3';
  if (x.includes('responsable')) return 'Cadre A · Échelon 2';
  if (x.includes('comptable') || x.includes('chargée') || x.includes('chargé')) return 'Maîtrise · Échelon 2';
  if (x.includes('support')) return 'Employé · Échelon 2';
  return 'Maîtrise · Échelon 1';
}
function categoryFromRole(r: string): 'cadre' | 'maitrise' | 'employe' | 'ouvrier' {
  const x = r.toLowerCase();
  if (x.includes('dir') || x.includes('lead') || x.includes('manager') || x.includes('senior')) return 'cadre';
  if (x.includes('responsable')) return 'cadre';
  if (x.includes('comptable') || x.includes('chargé')) return 'maitrise';
  if (x.includes('support')) return 'employe';
  return 'maitrise';
}

// ───────────────────────────────────────── CONTRATS
export function buildContract(e: EmployeeRecord): EmploymentContract {
  const isCDD = e.contractType === 'CDD';
  const probationCfg = e.countryCode === 'CI'
    ? { cadre: 3, maitrise: 2, employe: 1, ouvrier: 0.27 }
    : { cadre: 6, maitrise: 3, employe: 1, ouvrier: 0.27 };
  const cat = categoryFromRole(e.role);
  const probationMonths = isCDD ? 1 : probationCfg[cat];
  const ann = e.hireDate.slice(2, 4);
  const num = e.id.replace('e', '').padStart(5, '0');
  return {
    id: `ctr-${e.id}`,
    ref: `CTR-AP-${ann}-${num}`,
    employeeId: e.id,
    type: isCDD ? 'CDD' : 'CDI',
    convention: conventionForCountry(e.countryCode),
    status: e.status === 'leave' ? 'suspended' : e.status === 'notice' ? 'terminated' : 'active',
    societe: societeForCountry(e.countryCode),
    etablissement: siteForDept(e.department),
    signedAt: e.hireDate,
    hireDate: e.hireDate,
    effectiveDate: e.hireDate,
    endDate: e.cddEnd,
    probationMonths,
    probationConfirmedAt: plusDays(e.hireDate, Math.round(probationMonths * 30)),
    fonction: e.role,
    service: e.department,
    classification: classifFromRole(e.role),
    coefficient: cat === 'cadre' ? 540 : cat === 'maitrise' ? 350 : 220,
    baseSalary: e.baseSalary,
    allowances: [
      { label: 'Indemnité de transport', amount: e.nonTaxableAllowances },
      { label: 'Indemnité de fonction', amount: Math.round(e.taxableAllowances * 0.6) },
    ],
    workTime: 'Plein temps',
    weeklyHours: 40,
    workplace: siteForDept(e.department),
    teletravail: e.department === 'Technologie' ? '2 jours / semaine' : undefined,
    clauses: [
      'Clause de confidentialité',
      ...(cat === 'cadre' ? ['Clause de non-concurrence (12 mois post-départ, indemnité 30 %)', 'Clause de mobilité géographique', 'Clause de dédit-formation'] : []),
      'Clause d\'exclusivité',
    ],
    advistHash: `${e.id}f3d92e740a4f72`,
    signatures: [
      { party: 'employer', name: 'Cheick Diallo (DG)', at: e.hireDate },
      { party: 'employee', name: employeeName(e), at: e.hireDate },
    ],
  };
}

export const CONTRACTS: EmploymentContract[] = EMPLOYEES.map(buildContract);
export function contractOf(empId: string) { return CONTRACTS.find((c) => c.employeeId === empId); }

// ───────────────────────────────────────── AVENANTS — quelques avenants par seniorité
export function buildAmendments(e: EmployeeRecord): ContractAmendment[] {
  const hire = new Date(e.hireDate);
  const yearsHere = Math.floor((TODAY.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 365));
  const c = contractOf(e.id)!;
  const out: ContractAmendment[] = [];

  if (yearsHere >= 2) {
    const d = plusDays(e.hireDate, 365 * 2 + 30);
    out.push({
      id: `av-${e.id}-1`, ref: `AV-${d.slice(0,4)}-${e.id.slice(1).padStart(4,'0')}-01`,
      employeeId: e.id, contractId: c.id, typeCode: 'REM_AUG_BASE', typeLabel: 'Augmentation salaire base',
      categoryCode: 'REMUNERATION', objet: 'Augmentation +12 % (évaluation annuelle)',
      effectiveDate: d, signedAt: d, status: 'active', sensitivity: 'medium',
      before: `${Math.round(e.baseSalary * 0.88).toLocaleString('fr-FR')} FCFA`,
      after: `${e.baseSalary.toLocaleString('fr-FR')} FCFA`,
      payrollDelta: Math.round(e.baseSalary * 0.12),
    });
  }
  if (yearsHere >= 1 && e.department === 'Technologie') {
    const d = plusDays(e.hireDate, 365 * 1 + 90);
    out.push({
      id: `av-${e.id}-2`, ref: `AV-${d.slice(0,4)}-${e.id.slice(1).padStart(4,'0')}-02`,
      employeeId: e.id, contractId: c.id, typeCode: 'LIEU_TELETRAVAIL', typeLabel: 'Télétravail',
      categoryCode: 'LIEU', objet: 'Activation télétravail 2 j/semaine',
      effectiveDate: d, signedAt: d, status: 'active', sensitivity: 'medium', payrollDelta: 0,
    });
  }
  if (yearsHere >= 3 && (e.role.includes('Lead') || e.role.includes('Senior') || e.role.includes('Manager'))) {
    const d = plusDays(e.hireDate, 365 * 3);
    out.push({
      id: `av-${e.id}-3`, ref: `AV-${d.slice(0,4)}-${e.id.slice(1).padStart(4,'0')}-03`,
      employeeId: e.id, contractId: c.id, typeCode: 'FCT_PROMOTION', typeLabel: 'Promotion / changement fonction',
      categoryCode: 'FONCTION', objet: `Promotion : ${e.role}`,
      effectiveDate: d, signedAt: d, status: 'active', sensitivity: 'medium', payrollDelta: 80_000,
    });
  }
  return out;
}
export const AMENDMENTS: ContractAmendment[] = EMPLOYEES.flatMap(buildAmendments);
export function amendmentsOf(empId: string) { return AMENDMENTS.filter((a) => a.employeeId === empId); }

// Helper to lookup amendment type ref
export function amendmentTypeOf(code: string) { return AMENDMENT_TYPES.find((t) => t.code === code); }

// ───────────────────────────────────────── ÉVÉNEMENTS ADMIN
export function buildEvents(e: EmployeeRecord): AdminEvent[] {
  const out: AdminEvent[] = [];
  const baseRef = (n: number) => `EVT-AP-${e.id}-${String(n).padStart(4, '0')}`;

  // Embauche initiale (toujours)
  out.push({ id: `evt-${e.id}-1`, ref: baseRef(1), employeeId: e.id, category: 'EMBAUCHE', type: 'Embauche initiale',
    date: e.hireDate, recordedBy: 'Marie Samaké (Assistant RH)', status: 'done',
    detail: `${e.contractType} · ${e.role}`, documents: ['Contrat de travail', 'DPAE déposée', 'Visite médicale programmée'], auto: false });

  // Changement adresse (auto via portail)
  out.push({ id: `evt-${e.id}-2`, ref: baseRef(2), employeeId: e.id, category: 'ADMIN', type: 'Changement adresse',
    date: plusDays(e.hireDate, 800), recordedBy: 'Auto (portail employé)', status: 'done', auto: true });

  // Cas particuliers
  if (e.id === 'e9') {
    out.push({ id: `evt-${e.id}-3`, ref: baseRef(3), employeeId: e.id, category: 'SUSPENSION', type: 'Congé maternité',
      date: '2026-04-15', recordedBy: 'Chargé adm RH', status: 'done',
      detail: '14 semaines · reprise prévue 22/07/2026', impacts: ['Compteurs M2 suspendus', 'Paie M3 en pause', 'CNPS allocations'] });
  }
  if (e.id === 'e2') {
    out.push({ id: `evt-${e.id}-3`, ref: baseRef(3), employeeId: e.id, category: 'ADMIN', type: 'Naissance enfant',
      date: '2024-03-02', recordedBy: 'Assistant RH', status: 'done',
      detail: 'Kalil N\'Guessan · acte de naissance joint',
      impacts: ['Ajout ayant droit (M1)', 'Parts fiscales 2 → 2,5 (M3)', 'Congé paternité 10 j possible (M2)', 'Allocations familiales CNPS'],
      documents: ['Notification CNPS', 'Attestation employeur mutuelle'] });
  }
  if (e.id === 'e7') {
    out.push({ id: `evt-${e.id}-3`, ref: baseRef(3), employeeId: e.id, category: 'MOBILITE', type: 'Changement service',
      date: '2025-09-01', recordedBy: 'Chargé adm RH', status: 'done',
      detail: 'Affectation pôle Talent Acquisition' });
  }
  return out;
}
export const EVENTS: AdminEvent[] = EMPLOYEES.flatMap(buildEvents);
export function eventsOf(empId: string) { return EVENTS.filter((e) => e.employeeId === empId); }

// ───────────────────────────────────────── PÉRIODE D'ESSAI
export function buildProbation(e: EmployeeRecord): ProbationPeriod {
  const cat = categoryFromRole(e.role);
  const months = e.countryCode === 'CI'
    ? { cadre: 3, maitrise: 2, employe: 1, ouvrier: 0.27 }[cat]
    : { cadre: 6, maitrise: 3, employe: 1, ouvrier: 0.27 }[cat];
  const start = e.hireDate;
  const end = e.probationEnd ?? plusDays(start, Math.round(months * 30));
  const active = !!e.probationEnd && new Date(end) > TODAY;
  return {
    id: `pe-${e.id}`, employeeId: e.id,
    contractType: contractOf(e.id)!.type, category: cat[0].toUpperCase() + cat.slice(1),
    durationMonths: months, startDate: start, endDate: end,
    intermediateEvalDate: active ? plusDays(start, Math.round(months * 30 * 0.6)) : undefined,
    intermediateEvalDone: !active,
    decision: active ? 'pending' : 'confirmation',
    decisionNotifiedAt: active ? undefined : plusDays(end, -3),
    document: active ? undefined : `Lettre_Confirmation_PE_${e.lastName}_${start.replace(/-/g, '')}.pdf`,
  };
}
export const PROBATIONS: ProbationPeriod[] = EMPLOYEES.map(buildProbation);
export function probationOf(empId: string) { return PROBATIONS.find((p) => p.employeeId === empId); }

// ───────────────────────────────────────── DÉPARTS (e13 démission en préavis)
export const DEPARTURES: Departure[] = [
  {
    id: 'dep-e13', ref: 'DEP-2026-0013', employeeId: 'e13', type: 'demission',
    initiatedAt: '2026-05-02',
    noticeStart: '2026-05-02', noticeEnd: '2026-08-01', effectiveDate: '2026-08-01',
    status: 'notice', reason: 'Opportunité externe',
    stcAmount: 1_485_000,
    documents: [
      { name: 'Certificat de travail', status: 'pending' },
      { name: 'Attestation employeur', status: 'pending' },
      { name: 'Reçu pour solde de tout compte', status: 'pending' },
      { name: 'Attestation CNPS (fin d\'affiliation)', status: 'pending' },
      { name: 'Attestation IRPP année en cours', status: 'pending' },
    ],
    steps: [
      { label: 'Notification reçue', done: true, date: '2026-05-02' },
      { label: 'Accusé de réception (LRAR)', done: true, date: '2026-05-04' },
      { label: 'Préavis (3 mois cadre)', done: false },
      { label: 'Entretien départ', done: false },
      { label: 'Liquidation compteurs (M2/M3)', done: false },
      { label: 'STC + documents légaux', done: false },
      { label: 'Restitution matériel & accès', done: false },
      { label: 'Sortie effective + archivage 30 ans', done: false },
    ],
  },
];
export function departureOf(empId: string) { return DEPARTURES.find((d) => d.employeeId === empId); }

// ───────────────────────────────────────── DISCIPLINAIRE (un cas historique)
export const DISCIPLINARY: DisciplinaryProcedure[] = [
  {
    id: 'disc-e10', ref: 'DISC-2024-0010', employeeId: 'e10', motif: 'Retards répétés non justifiés (5 occurrences sur 30 j)',
    faute: 'simple', openedAt: '2024-03-04',
    convocationAt: '2024-03-08', hearingAt: '2024-03-15',
    sanction: 'avertissement', sanctionNotifiedAt: '2024-03-22',
    effacementDate: '2027-03-22', status: 'closed',
    steps: [
      { label: 'Constatation des faits', done: true, date: '2024-03-04', legalDelay: 'Prescription 2 mois' },
      { label: 'Instruction confidentielle', done: true, date: '2024-03-06' },
      { label: 'Convocation (LRAR)', done: true, date: '2024-03-08', legalDelay: 'Min 5 j ouvrés avant entretien' },
      { label: 'Entretien préalable (PV)', done: true, date: '2024-03-15' },
      { label: 'Délai de réflexion', done: true, date: '2024-03-20', legalDelay: 'Min 1 j franc' },
      { label: 'Notification écrite motivée', done: true, date: '2024-03-22' },
    ],
  },
];
export function disciplinaryOf(empId: string) { return DISCIPLINARY.filter((d) => d.employeeId === empId); }

// ───────────────────────────────────────── CERTIFICATS
export const CERTIFICATES: GeneratedCertificate[] = EMPLOYEES.flatMap<GeneratedCertificate>((e) => ([
  { id: `cert-${e.id}-1`, ref: `ATT-${e.hireDate.slice(0,4)}-${e.id}-001`, employeeId: e.id,
    typeCode: 'ATT_PRESENCE', typeLabel: 'Attestation de présence', category: 'attestation',
    generatedAt: plusDays(e.hireDate, 60), status: 'delivered' },
  ...(e.status === 'notice' ? [{
    id: `cert-${e.id}-2`, ref: `CERT-2026-${e.id}-002`, employeeId: e.id,
    typeCode: 'CERT_TRAVAIL', typeLabel: 'Certificat de travail', category: 'certificat' as const,
    generatedAt: '2026-07-15', status: 'draft' as const,
  }] : []),
]));
export function certificatesOf(empId: string) { return CERTIFICATES.filter((c) => c.employeeId === empId); }

// ───────────────────────────────────────── REPRÉSENTATION
export const MANDATES: RepresentationMandate[] = [
  { id: 'mnd-e1-1', employeeId: 'e1', type: 'Délégué du personnel', mode: 'elu',
    start: '2023-12-04', end: '2025-12-04', protectedUntil: '2026-06-04', delegationHours: 15, status: 'ended' },
  { id: 'mnd-e3-1', employeeId: 'e3', type: 'Référent harcèlement', mode: 'designe',
    start: '2024-03-01', protectedUntil: '2027-03-01', delegationHours: 0, status: 'active' },
  { id: 'mnd-e6-1', employeeId: 'e6', type: 'Délégué du personnel', mode: 'elu',
    start: '2025-12-04', end: '2027-12-04', protectedUntil: '2028-06-04', delegationHours: 15, status: 'active' },
];
export function mandatesOf(empId: string) { return MANDATES.filter((m) => m.employeeId === empId); }

export const ELECTIONS: RepresentationElection[] = [
  { id: 'el-2025', instance: 'DP', societe: 'Atlas Studio CI SARL', scheduledDate: '2025-11-15', phase: 'closed', seats: 4, turnout: 78 },
  { id: 'el-2027', instance: 'CSE', societe: 'Atlas Studio CI SARL', scheduledDate: '2027-06-15', phase: 'planned', seats: 3 },
];

// ───────────────────────────────────────── EXPATRIÉS (e10 Modeste Yapo, depuis CM)
export const EXPATS: ExpatFile[] = [
  {
    id: 'expat-e10', employeeId: 'e10', originCountry: 'CM', hostCountry: 'CI',
    missionType: 'Contrat local', missionStart: '2024-06-01', missionEnd: '2027-05-31',
    visa: { label: 'Visa de travail D-1', expiry: '2026-06-30' },
    workPermit: { label: 'Permis de travail', ref: 'PT-2024-1245', expiry: '2026-12-31' },
    residenceCard: { label: 'Carte de séjour', expiry: '2027-05-31' },
    package: [
      { label: 'Logement de fonction', value: 'Villa Cocody (1 500 000 FCFA / mois)' },
      { label: 'Scolarité enfants', value: 'Lycée Français A. Camus' },
      { label: 'Voyages annuels', value: '2 A/R Cameroun / personne' },
      { label: 'Assurance santé internationale', value: 'MSH International Premium' },
    ],
    surSalairePct: 25,
  },
];
export function expatOf(empId: string) { return EXPATS.find((e) => e.employeeId === empId); }

// ───────────────────────────────────────── PIÈCES COFFRE-FORT
export function piecesOf(empId: string): AdminPiece[] {
  const e = EMPLOYEES.find((x) => x.id === empId)!;
  const av = amendmentsOf(empId);
  return [
    { id: `pc-${empId}-1`, employeeId: empId, name: `Contrat_${e.contractType}_${e.lastName}_${e.hireDate.replace(/-/g,'')}.pdf`, category: 'Contrat', date: e.hireDate, signed: true },
    { id: `pc-${empId}-2`, employeeId: empId, name: `Carte_Identite_${e.lastName}.pdf`, category: 'ID', date: e.hireDate, signed: null },
    { id: `pc-${empId}-3`, employeeId: empId, name: `Diplome_principal_${e.lastName}.pdf`, category: 'Diplôme', date: plusDays(e.hireDate, -180), signed: null },
    { id: `pc-${empId}-4`, employeeId: empId, name: `Cert_Aptitude_${e.lastName}.pdf`, category: 'Médical', date: plusDays(e.hireDate, 5), signed: true, restricted: true },
    ...av.map((a, i) => ({ id: `pc-${empId}-av-${i}`, employeeId: empId, name: `${a.ref}_${a.typeLabel}.pdf`, category: 'Avenant', date: a.signedAt ?? a.effectiveDate, signed: true })),
  ];
}

// ───────────────────────────────────────── COURRIERS
export function courriersOf(empId: string): Courrier[] {
  const av = amendmentsOf(empId);
  return [
    ...av.map((a, i) => ({ id: `cr-${empId}-out-${i}`, employeeId: empId, direction: 'out' as const, objet: `Notification ${a.typeLabel}`, date: a.signedAt ?? a.effectiveDate, channel: 'portal' as const, status: 'Lu' })),
    { id: `cr-${empId}-in-1`, employeeId: empId, direction: 'in', objet: 'Demande attestation salaire', date: '2024-02-28', channel: 'email', status: 'Traité' },
  ];
}

// ───────────────────────────────────────── MÉDICAL
export function medicalOf(empId: string): MedicalEvent[] {
  const e = EMPLOYEES.find((x) => x.id === empId)!;
  const hire = new Date(e.hireDate);
  const out: MedicalEvent[] = [{ id: `med-${empId}-h`, employeeId: empId, type: 'Visite d\'embauche', date: plusDays(e.hireDate, 3), aptitude: 'Apte', hasDoc: true }];
  for (let y = 1; y <= Math.min(7, TODAY.getFullYear() - hire.getFullYear()); y++) {
    const d = plusDays(e.hireDate, 365 * y);
    out.push({ id: `med-${empId}-${y}`, employeeId: empId, type: 'Visite annuelle', date: d, aptitude: 'Apte', hasDoc: true });
  }
  if (e.medicalVisit) out.push({ id: `med-${empId}-next`, employeeId: empId, type: 'Visite annuelle', date: e.medicalVisit, aptitude: 'Programmée', hasDoc: false });
  return out;
}

// ───────────────────────────────────────── HABILITATIONS
export function habilitationsOf(empId: string): Habilitation[] {
  const e = EMPLOYEES.find((x) => x.id === empId)!;
  const out: Habilitation[] = [
    { id: `hab-${empId}-1`, employeeId: empId, label: 'Permis de conduire B', obtainedAt: '2014-06-12', expiry: '2034-06-12', status: 'valid' },
  ];
  if (e.department === 'Finance' || e.role.includes('Compta')) {
    out.push({ id: `hab-${empId}-2`, employeeId: empId, label: 'Habilitation finance & contrôle interne', obtainedAt: '2024-03-20', expiry: '2026-06-15', status: 'expiring' });
  }
  if (e.role.includes('DevOps') || e.role.includes('Manager')) {
    out.push({ id: `hab-${empId}-2`, employeeId: empId, label: 'Compliance OHADA', obtainedAt: '2024-04-10', expiry: '2027-04-10', status: 'valid' });
  }
  return out;
}

// ───────────────────────────────────────── AUDIT (par dossier)
export function auditOf(empId: string): AdminAuditEntry[] {
  const av = amendmentsOf(empId);
  const c = contractOf(empId)!;
  const out: AdminAuditEntry[] = [
    { id: `au-${empId}-1`, employeeId: empId, at: c.hireDate + 'T09:00:00Z', actor: 'Marie Samaké', action: 'admin.dossier.created',    detail: 'Création dossier', hash: 'a8f3d92e740a4f72' },
    { id: `au-${empId}-2`, employeeId: empId, at: c.hireDate + 'T09:15:00Z', actor: 'Cheick Diallo', action: 'admin.contract.signed_employer', detail: c.ref, hash: 'b21e7a3450f1e2d4' },
  ];
  av.forEach((a, i) => {
    out.push({ id: `au-${empId}-av-${i}-c`, employeeId: empId, at: `${a.signedAt ?? a.effectiveDate}T10:00:00Z`, actor: 'Fatou Diop', action: 'admin.amendment.created',    detail: a.ref, hash: `c${i}10a4f` });
    out.push({ id: `au-${empId}-av-${i}-s`, employeeId: empId, at: `${a.signedAt ?? a.effectiveDate}T11:00:00Z`, actor: 'Cheick Diallo', action: 'admin.amendment.signed_employer', detail: a.ref, hash: `d${i}43e2c` });
  });
  out.push({ id: `au-${empId}-v`, employeeId: empId, at: '2026-05-28T14:32:00Z', actor: 'Marie Samaké', action: 'admin.synthese.viewed', detail: 'Onglet Synthèse', hash: 'e9f72b1c' });
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

// ───────────────────────────────────────── ALERTES TRANSVERSES (Cockpit)
export function buildAlerts(): AdminAlert[] {
  const alerts: AdminAlert[] = [];
  for (const e of EMPLOYEES) {
    // CDD
    if (e.cddEnd) {
      const d = diffDays(e.cddEnd);
      if (d <= 60 && d >= 0) {
        alerts.push({ id: `al-cdd-${e.id}`, employeeId: e.id, severity: d <= 14 ? 'danger' : d <= 30 ? 'warn' : 'info',
          kind: 'cdd', message: `Fin de CDD dans ${d} jour(s)`, dueDate: e.cddEnd, daysLeft: d });
      }
    }
    // Période d'essai
    if (e.probationEnd) {
      const d = diffDays(e.probationEnd);
      if (d <= 30 && d >= 0) {
        alerts.push({ id: `al-pe-${e.id}`, employeeId: e.id, severity: d <= 7 ? 'danger' : d <= 14 ? 'warn' : 'info',
          kind: 'probation', message: `Fin de période d'essai dans ${d} jour(s) — décision requise`, dueDate: e.probationEnd, daysLeft: d });
      }
    }
    // Visite médicale
    if (e.medicalVisit) {
      const d = diffDays(e.medicalVisit);
      if (d <= 60 && d >= -30) {
        alerts.push({ id: `al-med-${e.id}`, employeeId: e.id, severity: d <= 7 ? 'warn' : 'info',
          kind: 'medical', message: `Visite médicale ${d >= 0 ? 'dans ' + d : 'en retard ' + Math.abs(d)} jour(s)`, dueDate: e.medicalVisit, daysLeft: d });
      }
    }
    // Habilitation finance qui expire
    const habs = habilitationsOf(e.id);
    for (const h of habs) {
      if (h.expiry && h.status === 'expiring') {
        const d = diffDays(h.expiry);
        alerts.push({ id: `al-hab-${e.id}-${h.id}`, employeeId: e.id, severity: d <= 14 ? 'danger' : 'warn',
          kind: 'habilitation', message: `${h.label} expire dans ${d} jour(s)`, dueDate: h.expiry, daysLeft: d });
      }
    }
  }
  // Expat
  for (const x of EXPATS) {
    if (x.visa) {
      const d = diffDays(x.visa.expiry);
      if (d <= 90 && d >= 0) {
        alerts.push({ id: `al-visa-${x.employeeId}`, employeeId: x.employeeId, severity: d <= 30 ? 'danger' : d <= 60 ? 'warn' : 'info',
          kind: 'expat', message: `${x.visa.label} expire dans ${d} jour(s) — renouvellement à initier`, dueDate: x.visa.expiry, daysLeft: d });
      }
    }
  }
  // Mandat
  for (const m of MANDATES) {
    if (m.end) {
      const d = diffDays(m.end);
      if (d <= 90 && d >= 0 && m.status === 'active') {
        alerts.push({ id: `al-mnd-${m.id}`, employeeId: m.employeeId, severity: d <= 30 ? 'warn' : 'info',
          kind: 'mandate', message: `${m.type} : fin de mandat dans ${d} jour(s)`, dueDate: m.end, daysLeft: d });
      }
    }
  }
  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}
export const ALERTS = buildAlerts();

// ───────────────────────────────────────── DPAE
export function buildDpae(): DpaeRecord[] {
  return EMPLOYEES.map((e) => ({
    id: `dpae-${e.id}`, employeeId: e.id, countryCode: e.countryCode,
    organism: DPAE_ORGANISMS.find((o) => o.countryCode === e.countryCode)?.organism ?? 'Organisme',
    filedAt: plusDays(e.hireDate, -1),
    receiptRef: `DPAE-${e.hireDate.slice(0,4)}-${e.id}`,
    status: 'received' as const,
    deadline: plusDays(e.hireDate, -1),
  }));
}
export const DPAE_RECORDS = buildDpae();

// ───────────────────────────────────────── OBLIGATIONS LÉGALES (état société)
export const LEGAL_OBLIGATIONS: LegalObligationItem[] = [
  ...MANDATORY_REGISTERS.map((r, i) => ({
    id: `reg-${i}`, kind: 'register' as const, label: r, scope: 'Atlas Studio CI SARL',
    status: (i % 5 === 0 ? 'due' : 'ok') as 'ok' | 'due' | 'overdue',
    lastUpdate: '2026-05-15', nextDue: '2026-12-31',
  })),
  ...MANDATORY_DISPLAYS.map((d, i) => ({
    id: `disp-${i}`, kind: 'display' as const, label: d, scope: 'Tous établissements',
    status: (i === 8 ? 'overdue' : 'ok') as 'ok' | 'due' | 'overdue',
    lastUpdate: '2026-01-10',
  })),
];

// ─────────────────────────────────────────── helpers Cockpit
export function cockpitKPIs() {
  return {
    contratsActifs: CONTRACTS.filter((c) => c.status === 'active').length,
    cddActifs: CONTRACTS.filter((c) => c.type === 'CDD' && c.status === 'active').length,
    avenantsAn: AMENDMENTS.length,
    procedureDisc: DISCIPLINARY.filter((d) => d.status !== 'closed' && d.status !== 'archived').length,
    departsCours: DEPARTURES.filter((d) => d.status !== 'executed').length,
    mandatsActifs: MANDATES.filter((m) => m.status === 'active').length,
    expatActifs: EXPATS.length,
    alertesCritiques: ALERTS.filter((a) => a.severity === 'danger').length,
  };
}

// ───────────────────────────────────────── divers utils export
export function matriculeAdmin(e: EmployeeRecord) { return matricule(e); }
