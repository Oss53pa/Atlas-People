/**
 * M12 CONFORMITÉ & SST — données de démonstration.
 * 14 risques DUER · 3 enquêtes RPS · 8 incidents AT/MP · registre 14 entrées
 * · 18 déclarations sociales · 24 visites médicales · 11 habilitations
 * · 6 audits + 22 findings · 4 inspections du travail · KPIs agrégés.
 */
import { EMPLOYEES } from '../../data/mock';
import type {
  RiskAssessment, RpsSurvey, WorkIncident, RegisterEntry, SocialDeclaration,
  MedicalVisit, Authorization, EpiAssignment, Audit, LaborInspection,
  ConformiteKPI,
} from './types';
import { computeRiskLevel, COMPLIANCE_THRESHOLDS } from './referentiels';

const TODAY = '2026-05-31';

// ────────────── DUER (14 risques)
const mkRisk = (
  id: string, ref: string, unite: string, countryCode: string,
  category: RiskAssessment['category'], hazard: string,
  p: RiskAssessment['probability'], s: RiskAssessment['severity'],
  controls: string[], exposed: number, lastReview: string,
  actions: RiskAssessment['actions'] = [],
): RiskAssessment => ({
  id, ref, unite, countryCode, category, hazard,
  probability: p, severity: s, level: computeRiskLevel(p, s),
  controls, exposedEmployeeCount: exposed,
  lastReviewAt: lastReview,
  nextReviewDue: new Date(new Date(lastReview).getTime() + 365 * 86_400_000).toISOString().slice(0, 10),
  createdAt: '2024-01-15', updatedAt: lastReview, actions,
});

export const RISKS: RiskAssessment[] = [
  mkRisk('rsk-001', 'RSK-2026-001', 'Open space Tech (Plateau)', 'CI', 'tms', 'TMS écran prolongé > 6 h/j', 4, 2,
    ['Postes ergonomiques · écrans 27"', 'Pause active toutes les 90 min (alerte LMS)', 'Étirements collectifs hebdo'], 8, '2026-04-12'),
  mkRisk('rsk-002', 'RSK-2026-002', 'Open space Tech (Plateau)', 'CI', 'electrique', 'Multiprises surchargées', 3, 3,
    ['Audit annuel installations', 'PRA électrique', 'EPI cadenassage'], 8, '2026-02-08',
    [{ description: 'Remplacer multiprises non conformes étage 4', ownerEmployeeId: 'e8', dueDate: '2026-06-30', status: 'in_progress' }]),
  mkRisk('rsk-003', 'RSK-2026-003', 'Espace clientèle Sénégal', 'SN', 'incendie_explosion', 'Issues de secours obstruées par cartons archives', 2, 4,
    ['Évacuation des cartons sous 30 j', 'Exercice incendie semestriel', '6 extincteurs CO₂ + eau'], 12, '2026-03-22',
    [{ description: 'Évacuer cartons & ajouter signalétique BAES', ownerEmployeeId: 'e9', dueDate: '2026-06-15', status: 'todo' }]),
  mkRisk('rsk-004', 'RSK-2026-004', 'Bureau Direction', 'CI', 'psychosocial', 'Stress lié à objectifs trimestriels élevés', 3, 3,
    ['1-1 mensuel obligatoire', 'Cellule d\'écoute externe', 'Enquête RPS semestrielle'], 14, '2026-05-08'),
  mkRisk('rsk-005', 'RSK-2026-005', 'Salle serveurs', 'CI', 'electrique', 'Tension 400V triphasée — risque arc électrique', 2, 4,
    ['Habilitation BS-BE obligatoire', 'EPI isolant', 'Procédure de consignation'], 2, '2025-12-05'),
  mkRisk('rsk-006', 'RSK-2026-006', 'Flotte commerciale', 'CI', 'routier', 'Conduite intensive régionale (> 30 000 km/an)', 4, 3,
    ['Permis valide vérifié', 'Formation éco-conduite annuelle', 'GPS + alertes vitesse'], 4, '2026-01-18',
    [{ description: 'Formation éco-conduite Q3', ownerEmployeeId: 'e13', dueDate: '2026-09-30', status: 'todo' }]),
  mkRisk('rsk-007', 'RSK-2026-007', 'Espaces communs', 'CI', 'biologique', 'Risque transmission virale (espaces partagés)', 2, 2,
    ['Gel hydroalcoolique', 'Aération naturelle', 'Politique télétravail si symptômes'], 14, '2026-04-30'),
  mkRisk('rsk-008', 'RSK-2026-008', 'Open space Sénégal', 'SN', 'tms', 'Postes mal réglés — douleurs cervicales reportées', 3, 2,
    ['Audit ergonomique', 'Sièges réglables', 'Formation gestes & postures'], 6, '2026-02-14'),
  mkRisk('rsk-009', 'RSK-2026-009', 'Stockage matériel IT', 'CI', 'chute_hauteur', 'Rangement en hauteur sans escabeau sécurisé', 2, 3,
    ['Achat escabeau norme EN 131', 'Procédure rangement', 'Formation manutention'], 3, '2025-11-22'),
  mkRisk('rsk-010', 'RSK-2026-010', 'Cuisine d\'étage', 'CI', 'incendie_explosion', 'Plaque induction — brûlures', 2, 1,
    ['Plaques à arrêt auto', 'Trousse 1er secours visible', 'Hotte aspirante'], 14, '2026-03-15'),
  mkRisk('rsk-011', 'RSK-2026-011', 'Plateforme cloud', 'CI', 'cyber', 'Compromission identifiants (phishing)', 4, 4,
    ['MFA généralisé', 'Formation sensibilisation cyber annuelle', 'Politique mots de passe'], 14, '2026-05-10',
    [{ description: 'Audit pentest annuel', ownerEmployeeId: 'e8', dueDate: '2026-09-15', status: 'in_progress' }]),
  mkRisk('rsk-012', 'RSK-2026-012', 'Open space Tech', 'CI', 'psychosocial', 'Surcharge cognitive · multi-réunions > 4 h/j', 3, 2,
    ['Plages no-meeting matin', 'Limite 4 réunions/j', '1-1 mensuel'], 8, '2026-04-25'),
  mkRisk('rsk-013', 'RSK-2026-013', 'Sites clients', 'CI', 'routier', 'Déplacement clients zones rurales', 3, 4,
    ['Co-voiturage interdit en zone à risque', 'Véhicule récent vérifié', 'Briefing sécurité avant déplacement'], 5, '2026-02-28'),
  mkRisk('rsk-014', 'RSK-2026-014', 'Espace bureautique', 'CI', 'environnemental', 'Climatisation excessive — qualité air', 2, 2,
    ['Maintenance trimestrielle clim', 'Capteurs CO₂', 'Aération naturelle quotidienne'], 14, '2026-03-08'),
];

// ────────────── RPS (3 enquêtes)
export const RPS_SURVEYS: RpsSurvey[] = [
  { id: 'rps-001', ref: 'RPS-2026-001', title: 'WHO-5 Bien-être Q2 2026', countryCode: 'CI', scope: 'company',
    scopeLabel: 'Atlas People — global', status: 'analyzed', openedAt: '2026-04-15', closedAt: '2026-04-29',
    targetRespondents: 14, respondents: 12, averageWellbeingScore: 68, burnoutRiskPct: 17,
    listeningCellTriggered: false,
    insights: ['12/14 répondants (86 %)', 'Score bien-être 68/100 — en hausse +4 pts vs Q1', 'Risque burnout 17 % — vigilance équipe Tech'] },
  { id: 'rps-002', ref: 'RPS-2026-002', title: 'Karasek Job Strain équipe Tech', countryCode: 'CI', scope: 'team',
    scopeLabel: 'Équipe Technologie', status: 'closed', openedAt: '2026-05-10', closedAt: '2026-05-25',
    targetRespondents: 8, respondents: 7, averageWellbeingScore: 58, burnoutRiskPct: 28,
    listeningCellTriggered: true,
    insights: ['28 % à risque — au-dessus du seuil 20 %', 'Cellule d\'écoute déclenchée le 26/05', 'Origine identifiée : sprint long Q2'] },
  { id: 'rps-003', ref: 'RPS-2026-003', title: 'Pulse hebdo Q3 2026', countryCode: 'SN', scope: 'BU',
    scopeLabel: 'BU Sénégal', status: 'open', openedAt: '2026-05-29', targetRespondents: 5, respondents: 2,
    listeningCellTriggered: false },
];

// ────────────── Incidents AT/MP
export const INCIDENTS: WorkIncident[] = [
  { id: 'inc-001', ref: 'INC-2026-001', employeeId: 'e9', type: 'AT', severity: 'leger',
    occurredAt: '2026-03-12', declaredAt: '2026-03-13', countryCode: 'SN', unite: 'Espace clientèle',
    location: 'Almadies, Dakar', description: 'Chute glissade — escalier intérieur', workdaysLost: 5,
    thirdPartyInvolved: false, rootCause: 'Sol mouillé sans signalétique',
    correctiveActions: ['Tapis antidérapant escalier', 'Panneau « sol mouillé » obligatoire'],
    status: 'closed', cnpsRef: 'IPRES-2026-0042', declaredWithinSLA: true },

  { id: 'inc-002', ref: 'INC-2026-002', employeeId: 'e12', type: 'AT_trajet', severity: 'leger',
    occurredAt: '2026-02-28', declaredAt: '2026-03-01', countryCode: 'CI', unite: 'Trajet domicile-travail',
    location: 'Marcory-Plateau', description: 'Accident de la circulation — pas de tiers identifié', workdaysLost: 3,
    thirdPartyInvolved: false,
    correctiveActions: ['Rappel formation éco-conduite à passer'],
    status: 'closed', cnpsRef: 'CNPS-CI-2026-0118', declaredWithinSLA: true },

  { id: 'inc-003', ref: 'INC-2026-003', employeeId: 'e4', type: 'AT', severity: 'sans_arret',
    occurredAt: '2026-04-22', declaredAt: '2026-04-23', countryCode: 'CI', unite: 'Bureau',
    location: 'Plateau, Abidjan', description: 'Choc tête contre placard ouvert', workdaysLost: 0,
    thirdPartyInvolved: false, rootCause: 'Placard mal positionné en hauteur',
    correctiveActions: ['Repositionner placard à 1,80 m mini'],
    status: 'closed', cnpsRef: 'CNPS-CI-2026-0152', declaredWithinSLA: true },

  { id: 'inc-004', ref: 'INC-2026-004', employeeId: 'e6', type: 'MP', severity: 'grave',
    occurredAt: '2026-01-15', declaredAt: '2026-02-12', countryCode: 'CI', unite: 'Comptabilité',
    location: 'Bureau Plateau', description: 'Syndrome canal carpien — saisie comptable répétée', workdaysLost: 30,
    thirdPartyInvolved: false, rootCause: 'Saisie répétée > 6 h/j sans pause',
    correctiveActions: ['Souris ergonomique', 'Pause obligatoire toutes les 60 min', 'Aménagement temps de travail'],
    status: 'cnps_filed', cnpsRef: 'CNPS-CI-MP-2026-008', declaredWithinSLA: false },

  { id: 'inc-005', ref: 'INC-2026-005', employeeId: 'e2', type: 'presquAccident', severity: 'sans_arret',
    occurredAt: '2026-05-08', declaredAt: '2026-05-09', countryCode: 'CI', unite: 'Salle serveurs',
    location: 'DC Plateau', description: 'Étincelle multiprise — sans dommage', workdaysLost: 0,
    thirdPartyInvolved: false, rootCause: 'Multiprise surchargée (issue déjà DUER rsk-002)',
    correctiveActions: ['Remplacement immédiat', 'Audit prévu (DUER rsk-002)'],
    status: 'closed', declaredWithinSLA: true },

  { id: 'inc-006', ref: 'INC-2026-006', employeeId: 'e11', type: 'AT', severity: 'leger',
    occurredAt: '2026-05-18', declaredAt: '2026-05-19', countryCode: 'SN', unite: 'Visite client',
    location: 'Dakar Centre', description: 'Faux mouvement port lourd dossier client', workdaysLost: 2,
    thirdPartyInvolved: false, correctiveActions: ['Formation gestes et postures', 'Chariot léger pour transport documents'],
    status: 'investigation', declaredWithinSLA: true },

  { id: 'inc-007', ref: 'INC-2026-007', employeeId: 'e8', type: 'AT_trajet', severity: 'leger',
    occurredAt: '2026-04-04', declaredAt: '2026-04-05', countryCode: 'CI', unite: 'Trajet',
    location: 'Cocody-Plateau', description: 'Accident moto — choc latéral véhicule', workdaysLost: 7,
    thirdPartyInvolved: true, correctiveActions: ['Constat amiable transmis assureur', 'Suivi médical 30 j'],
    status: 'cnps_filed', cnpsRef: 'CNPS-CI-2026-0188', declaredWithinSLA: true },

  { id: 'inc-008', ref: 'INC-2026-008', employeeId: 'e14', type: 'presquAccident', severity: 'sans_arret',
    occurredAt: '2026-05-25', declaredAt: '2026-05-26', countryCode: 'CI', unite: 'Bureau',
    location: 'Salle réunion B', description: 'Chaise cassée — risque chute', workdaysLost: 0,
    thirdPartyInvolved: false, correctiveActions: ['Retrait immédiat mobilier vétuste', 'Audit mobilier annuel à prévoir'],
    status: 'closed', declaredWithinSLA: true },
];

// ────────────── Registre du personnel OHADA
export const REGISTER_ENTRIES: RegisterEntry[] = EMPLOYEES.map((e, i) => ({
  id: `reg-${i + 1}`,
  matricule: i + 1,
  employeeId: e.id,
  countryCode: e.countryCode,
  entryDate: e.hireDate,
  exitDate: e.status === 'notice' ? '2026-07-31' : undefined,
  exitReason: e.status === 'notice' ? 'Démission' : undefined,
  inspectionVisas: i < 3 ? [{ date: '2025-11-12', inspector: 'Inspection du travail Abidjan', comment: 'Registre à jour, signature originale présente.' }] : [],
}));

// ────────────── Déclarations sociales (18)
export const DECLARATIONS: SocialDeclaration[] = [
  // CNPS CI mensuelles (8 dernières)
  ...['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04'].map((p, i): SocialDeclaration => ({
    id: `dec-cnps-${p}`, ref: `CNPS-CI-${p}`, kind: 'CNPS_CI', countryCode: 'CI', period: p, frequency: 'monthly',
    status: i < 6 ? 'paid' : 'submitted', dueDate: `${p.split('-')[0]}-${(parseInt(p.split('-')[1]) + 1).toString().padStart(2, '0')}-15`,
    submittedAt: `${p.split('-')[0]}-${(parseInt(p.split('-')[1]) + 1).toString().padStart(2, '0')}-12`,
    paidAt: i < 6 ? `${p.split('-')[0]}-${(parseInt(p.split('-')[1]) + 1).toString().padStart(2, '0')}-14` : undefined,
    amountDeclared: 1_850_000 + (i * 12_000), headcount: 11,
  })),
  // CNPS CI 2026-05 due le 2026-06-15 → en cours
  { id: 'dec-cnps-2026-05', ref: 'CNPS-CI-2026-05', kind: 'CNPS_CI', countryCode: 'CI', period: '2026-05',
    frequency: 'monthly', status: 'draft', dueDate: '2026-06-15', amountDeclared: 1_920_000, headcount: 11 },

  // IPRES SN mensuelles (4)
  ...['2026-01', '2026-02', '2026-03', '2026-04'].map((p, i): SocialDeclaration => ({
    id: `dec-ipres-${p}`, ref: `IPRES-SN-${p}`, kind: 'IPRES_SN', countryCode: 'SN', period: p, frequency: 'monthly',
    status: i < 3 ? 'paid' : 'submitted', dueDate: `${p.split('-')[0]}-${(parseInt(p.split('-')[1]) + 1).toString().padStart(2, '0')}-15`,
    submittedAt: `${p.split('-')[0]}-${(parseInt(p.split('-')[1]) + 1).toString().padStart(2, '0')}-10`,
    paidAt: i < 3 ? `${p.split('-')[0]}-${(parseInt(p.split('-')[1]) + 1).toString().padStart(2, '0')}-14` : undefined,
    amountDeclared: 480_000 + (i * 8_000), headcount: 3,
  })),
  // IPRES SN 2026-05 → en cours
  { id: 'dec-ipres-2026-05', ref: 'IPRES-SN-2026-05', kind: 'IPRES_SN', countryCode: 'SN', period: '2026-05',
    frequency: 'monthly', status: 'draft', dueDate: '2026-06-15', amountDeclared: 510_000, headcount: 3 },

  // DGI IRPP CI trimestriel
  { id: 'dec-dgi-q1', ref: 'DGI-CI-2026-Q1', kind: 'DGI', countryCode: 'CI', period: '2026-Q1', frequency: 'quarterly',
    status: 'paid', dueDate: '2026-04-15', submittedAt: '2026-04-10', paidAt: '2026-04-14',
    amountDeclared: 4_280_000, headcount: 11 },

  // CMU CI mensuelle
  { id: 'dec-cnam-2026-04', ref: 'CNAM-CI-2026-04', kind: 'CNAM', countryCode: 'CI', period: '2026-04', frequency: 'monthly',
    status: 'submitted', dueDate: '2026-05-15', submittedAt: '2026-05-12',
    amountDeclared: 285_000, headcount: 11 },

  // DISA CI annuelle
  { id: 'dec-disa-2025', ref: 'DISA-CI-2025', kind: 'DISA', countryCode: 'CI', period: '2025', frequency: 'annual',
    status: 'overdue', dueDate: '2026-03-31',
    amountDeclared: 0, headcount: 14, penalty: 250_000 },
];

// ────────────── Visites médicales (24)
export const MEDICAL_VISITS: MedicalVisit[] = [
  // Embauches (les plus anciens collab)
  ...EMPLOYEES.slice(0, 6).map((e, i): MedicalVisit => ({
    id: `mv-emb-${e.id}`, ref: `MED-EMB-${i + 1}`, employeeId: e.id, kind: 'embauche',
    scheduledAt: e.hireDate, performedAt: e.hireDate, practitioner: 'Dr. K. Bamba',
    aptitude: 'apte', nextVisitDue: '2026-12-31',
  })),
  // Périodiques en cours / à programmer
  ...EMPLOYEES.slice(0, 10).map((e, i): MedicalVisit => ({
    id: `mv-per-${e.id}`, ref: `MED-PER-${i + 1}`, employeeId: e.id, kind: 'periodique',
    scheduledAt: i % 2 === 0 ? '2026-06-15' : '2026-07-20',
    performedAt: i < 4 ? '2026-04-12' : undefined,
    practitioner: i < 4 ? 'Dr. K. Bamba' : undefined,
    aptitude: i < 4 ? (i === 2 ? 'apte_amenagement' : 'apte') : undefined,
    restrictions: i === 2 ? ['Travail debout limité à 4 h/j'] : undefined,
    nextVisitDue: i < 4 ? '2028-04-12' : undefined,
  })),
  // Reprise post-AT pour incident 1
  { id: 'mv-rep-001', ref: 'MED-REP-001', employeeId: 'e9', kind: 'reprise',
    scheduledAt: '2026-03-22', performedAt: '2026-03-22', practitioner: 'Dr. K. Bamba',
    aptitude: 'apte', notes: 'Reprise post chute, douleurs résiduelles cheville.' },
  // Surveillance renforcée pour exposés (DevOps salle serveurs)
  { id: 'mv-srv-001', ref: 'MED-SRV-001', employeeId: 'e8', kind: 'surveillance_renforcee',
    scheduledAt: '2026-04-08', performedAt: '2026-04-08', practitioner: 'Dr. K. Bamba',
    aptitude: 'apte', nextVisitDue: '2027-04-08' },
  { id: 'mv-srv-002', ref: 'MED-SRV-002', employeeId: 'e2', kind: 'surveillance_renforcee',
    scheduledAt: '2026-04-08', performedAt: '2026-04-08', practitioner: 'Dr. K. Bamba',
    aptitude: 'apte', nextVisitDue: '2027-04-08' },
  // Reprise post-MP canal carpien
  { id: 'mv-rep-002', ref: 'MED-REP-002', employeeId: 'e6', kind: 'reprise',
    scheduledAt: '2026-02-15', performedAt: '2026-02-15', practitioner: 'Dr. K. Bamba',
    aptitude: 'apte_amenagement', restrictions: ['Saisie limitée à 4 h/j avec pauses'],
    notes: 'Reprise post-MP canal carpien.' },
];

// ────────────── Habilitations
export const AUTHORIZATIONS: Authorization[] = [
  { id: 'aut-001', ref: 'AUT-BS-001', employeeId: 'e8', kind: 'electrique', level: 'BS-BE manœuvre',
    issuedAt: '2024-09-10', expiresAt: '2027-09-10', status: 'active', issuingAuthority: 'INSPCT CI' },
  { id: 'aut-002', ref: 'AUT-BS-002', employeeId: 'e12', kind: 'electrique', level: 'BS-BE manœuvre',
    issuedAt: '2024-09-10', expiresAt: '2027-09-10', status: 'active', issuingAuthority: 'INSPCT CI' },
  { id: 'aut-003', ref: 'AUT-PF-001', employeeId: 'e12', kind: 'permis_feu', level: 'Permis feu général',
    issuedAt: '2025-04-20', expiresAt: '2026-08-20', status: 'pending_renewal', issuingAuthority: 'SDIS / interne' },
  { id: 'aut-004', ref: 'AUT-CON-001', employeeId: 'e4', kind: 'conduite', level: 'B + transport',
    issuedAt: '2010-06-15', expiresAt: '2030-06-15', status: 'active', issuingAuthority: 'État CI' },
  { id: 'aut-005', ref: 'AUT-CON-002', employeeId: 'e11', kind: 'conduite', level: 'B',
    issuedAt: '2018-09-10', expiresAt: '2028-09-10', status: 'active', issuingAuthority: 'État SN' },
  { id: 'aut-006', ref: 'AUT-CON-003', employeeId: 'e13', kind: 'conduite', level: 'B',
    issuedAt: '2015-03-22', expiresAt: '2026-08-22', status: 'pending_renewal', issuingAuthority: 'État SN' },
  { id: 'aut-007', ref: 'AUT-CHIM-001', employeeId: 'e9', kind: 'chimique', level: 'Produits ménagers ERP',
    issuedAt: '2025-06-10', expiresAt: '2027-06-10', status: 'active', issuingAuthority: 'Formation interne' },
  { id: 'aut-008', ref: 'AUT-CACES-001', employeeId: 'e12', kind: 'cariste', level: 'CACES 1A',
    issuedAt: '2024-03-15', expiresAt: '2029-03-15', status: 'active', issuingAuthority: 'INSPCT CI' },
  { id: 'aut-009', ref: 'AUT-PF-002', employeeId: 'e8', kind: 'permis_feu', level: 'Permis feu général',
    issuedAt: '2025-04-20', expiresAt: '2027-04-20', status: 'active', issuingAuthority: 'SDIS / interne' },
  { id: 'aut-010', ref: 'AUT-HAUT-001', employeeId: 'e8', kind: 'travaux_hauteur', level: 'Travaux hauteur < 5 m',
    issuedAt: '2023-11-08', expiresAt: '2026-07-08', status: 'pending_renewal', issuingAuthority: 'INSPCT CI' },
  { id: 'aut-011', ref: 'AUT-CON-004', employeeId: 'e1', kind: 'conduite', level: 'B',
    issuedAt: '2005-04-12', expiresAt: '2026-09-12', status: 'pending_renewal', issuingAuthority: 'État CI' },
];

// ────────────── EPI
export const EPI_ASSIGNMENTS: EpiAssignment[] = [
  { id: 'epi-001', employeeId: 'e12', category: 'gants', modelLabel: 'Gants isolants NF EN 60903', size: 'L',
    issuedAt: '2025-06-10', renewalDue: '2026-12-10', acknowledgedByEmployee: true },
  { id: 'epi-002', employeeId: 'e12', category: 'chaussures', modelLabel: 'Chaussures S3 SRC', size: '43',
    issuedAt: '2025-06-10', renewalDue: '2027-06-10', acknowledgedByEmployee: true },
  { id: 'epi-003', employeeId: 'e8', category: 'gants', modelLabel: 'Gants isolants NF EN 60903', size: 'M',
    issuedAt: '2025-06-10', renewalDue: '2026-12-10', acknowledgedByEmployee: true },
  { id: 'epi-004', employeeId: 'e9', category: 'gants', modelLabel: 'Gants nitrile manipulation', size: 'M',
    issuedAt: '2025-08-15', renewalDue: '2026-08-15', acknowledgedByEmployee: true },
  { id: 'epi-005', employeeId: 'e6', category: 'lunettes', modelLabel: 'Lunettes anti-fatigue écran filtre', size: 'std',
    issuedAt: '2026-02-20', renewalDue: '2029-02-20', acknowledgedByEmployee: true },
];

// ────────────── Audits (6 + 22 findings)
export const AUDITS: Audit[] = [
  { id: 'aud-001', ref: 'AUD-2026-001', scope: 'RGPD', title: 'Audit RGPD annuel — traitement RH',
    leadAuditorEmployeeId: 'e3', countryCode: 'CI', status: 'completed',
    plannedAt: '2026-02-15', startedAt: '2026-02-18', completedAt: '2026-03-22', conformityScore: 87,
    findings: [
      { id: 'fnd-101', ref: 'FND-AUD001-001', severity: 'major', domain: 'Consentement candidats', description: 'Mention RGPD absente du portail candidats v1.', recommendation: 'Ajouter checkbox consentement + politique vie privée.', ownerEmployeeId: 'e3', dueDate: '2026-04-15', status: 'closed', closedAt: '2026-03-30' },
      { id: 'fnd-102', ref: 'FND-AUD001-002', severity: 'minor', domain: 'Conservation CV', description: 'CV non purgés à 2 ans pour 12 candidats.', recommendation: 'Activer job de purge mensuel.', ownerEmployeeId: 'e3', dueDate: '2026-05-30', status: 'closed', closedAt: '2026-05-12' },
      { id: 'fnd-103', ref: 'FND-AUD001-003', severity: 'observation', domain: 'Documentation', description: 'Registre des traitements (article 30) à actualiser.', recommendation: 'Mise à jour annuelle + revue DPO.', ownerEmployeeId: 'e3', dueDate: '2026-06-30', status: 'in_remediation' },
      { id: 'fnd-104', ref: 'FND-AUD001-004', severity: 'major', domain: 'Sécurité données', description: 'Logs d\'accès dossier paie incomplets.', recommendation: 'Activer audit_log RLS Supabase + revue mensuelle.', ownerEmployeeId: 'e8', dueDate: '2026-04-30', status: 'closed', closedAt: '2026-04-25' },
    ] },

  { id: 'aud-002', ref: 'AUD-2026-002', scope: 'Sapin2', title: 'Audit anti-corruption UEMOA',
    leadAuditorEmployeeId: 'e1', externalAuditor: 'EthixPro', countryCode: 'CI', status: 'completed',
    plannedAt: '2026-01-20', startedAt: '2026-01-25', completedAt: '2026-02-14', conformityScore: 92,
    findings: [
      { id: 'fnd-201', ref: 'FND-AUD002-001', severity: 'minor', domain: 'Cadeaux & invitations', description: 'Registre incomplet sur 3 mois.', recommendation: 'Formulaire en ligne obligatoire.', ownerEmployeeId: 'e1', dueDate: '2026-04-30', status: 'closed', closedAt: '2026-04-12' },
      { id: 'fnd-202', ref: 'FND-AUD002-002', severity: 'observation', domain: 'Formation', description: 'Taux complétion formation 89 %.', recommendation: 'Relance trimestrielle.', ownerEmployeeId: 'e3', dueDate: '2026-09-30', status: 'in_remediation' },
    ] },

  { id: 'aud-003', ref: 'AUD-2026-003', scope: 'OHADA_droit_travail', title: 'Conformité droit du travail OHADA',
    leadAuditorEmployeeId: 'e3', externalAuditor: 'Cabinet ERSUMA', countryCode: '*', status: 'completed',
    plannedAt: '2026-03-01', startedAt: '2026-03-05', completedAt: '2026-04-08', conformityScore: 81,
    findings: [
      { id: 'fnd-301', ref: 'FND-AUD003-001', severity: 'major', domain: 'Période d\'essai', description: 'Durée période d\'essai non visée par avenant pour 2 CDI.', recommendation: 'Avenants à régulariser sous 30 j.', ownerEmployeeId: 'e3', dueDate: '2026-05-08', status: 'closed', closedAt: '2026-04-28' },
      { id: 'fnd-302', ref: 'FND-AUD003-002', severity: 'critical', domain: 'Heures sup.', description: 'Dépassement plafond 15 h/sem détecté sur 1 collab Q1.', recommendation: 'Régularisation rémunération + plan de charge revu.', ownerEmployeeId: 'e1', dueDate: '2026-05-08', status: 'closed', closedAt: '2026-05-02', evidence: 'Avenant + virement de régularisation' },
      { id: 'fnd-303', ref: 'FND-AUD003-003', severity: 'minor', domain: 'Affichages obligatoires', description: 'Convention collective non affichée site Dakar.', recommendation: 'Affichage immédiat.', ownerEmployeeId: 'e9', dueDate: '2026-04-30', status: 'closed', closedAt: '2026-04-15' },
      { id: 'fnd-304', ref: 'FND-AUD003-004', severity: 'major', domain: 'Registre du personnel', description: 'Visa inspection manquant sur 11 entrées.', recommendation: 'Soumettre registre à l\'inspection.', ownerEmployeeId: 'e3', dueDate: '2026-06-30', status: 'in_remediation' },
    ] },

  { id: 'aud-004', ref: 'AUD-2026-004', scope: 'paie', title: 'Audit paie annuel (cycle 2025)',
    leadAuditorEmployeeId: 'e1', externalAuditor: 'OEC Abidjan', countryCode: 'CI', status: 'completed',
    plannedAt: '2026-02-01', startedAt: '2026-02-05', completedAt: '2026-03-15', conformityScore: 95,
    findings: [
      { id: 'fnd-401', ref: 'FND-AUD004-001', severity: 'observation', domain: 'Détermination IRPP', description: 'Méthode quotient familial conforme.', recommendation: 'Documenter en référentiel public.', ownerEmployeeId: 'e6', dueDate: '2026-06-30', status: 'in_remediation' },
      { id: 'fnd-402', ref: 'FND-AUD004-002', severity: 'minor', domain: 'Indemnités licenciement', description: 'Barème ancienneté à actualiser pour Sénégal.', recommendation: 'Mise à jour table 2026.', ownerEmployeeId: 'e3', dueDate: '2026-04-30', status: 'closed', closedAt: '2026-04-20' },
    ] },

  { id: 'aud-005', ref: 'AUD-2026-005', scope: 'ISO27001', title: 'Audit ISO 27001 préparatoire',
    leadAuditorEmployeeId: 'e8', externalAuditor: 'BSI Africa', countryCode: 'CI', status: 'in_progress',
    plannedAt: '2026-05-01', startedAt: '2026-05-12',
    findings: [
      { id: 'fnd-501', ref: 'FND-AUD005-001', severity: 'major', domain: 'Annex A.9 Contrôle d\'accès', description: 'Comptes orphelins détectés (2 collab partis).', recommendation: 'Process JML automatisé.', ownerEmployeeId: 'e8', dueDate: '2026-06-30', status: 'in_remediation' },
      { id: 'fnd-502', ref: 'FND-AUD005-002', severity: 'critical', domain: 'Annex A.18 Conformité', description: 'Politique de classification absente.', recommendation: 'Rédaction + diffusion sous 30 j.', ownerEmployeeId: 'e8', dueDate: '2026-06-15', status: 'in_remediation' },
      { id: 'fnd-503', ref: 'FND-AUD005-003', severity: 'minor', domain: 'Annex A.6 Organisation', description: 'Rôles SSI à formaliser.', recommendation: 'Note de service + organigramme.', ownerEmployeeId: 'e8', dueDate: '2026-07-31', status: 'open' },
    ] },

  { id: 'aud-006', ref: 'AUD-2026-006', scope: 'recrutement', title: 'Audit non-discrimination recrutement',
    leadAuditorEmployeeId: 'e3', countryCode: 'CI', status: 'planned',
    plannedAt: '2026-09-15',
    findings: [] },
];

// ────────────── Inspections du travail
export const INSPECTIONS: LaborInspection[] = [
  { id: 'ins-001', ref: 'INS-2025-018', countryCode: 'CI', inspectorName: 'M. Yao Adjoua',
    inspectorAuthority: 'Inspection du travail — district Plateau',
    visitedAt: '2025-11-12', outcome: 'observations',
    findings: ['Visites médicales de 2 collaborateurs en retard de plus de 6 mois', 'Affichage prudhomal à compléter'],
    remediationDueAt: '2026-01-12', followUpDoneAt: '2025-12-30' },

  { id: 'ins-002', ref: 'INS-2026-004', countryCode: 'CI', inspectorName: 'Mme. Sika Yapo',
    inspectorAuthority: 'Inspection du travail — district Plateau',
    visitedAt: '2026-03-18', outcome: 'conforme',
    findings: ['Registre du personnel à jour', 'Déclarations CNPS conformes'] },

  { id: 'ins-003', ref: 'INS-2026-007', countryCode: 'SN', inspectorName: 'M. Ousmane Sarr',
    inspectorAuthority: 'Inspection du travail — Dakar Nord',
    visitedAt: '2026-04-22', outcome: 'mise_en_demeure',
    findings: ['Convention collective Banque non affichée', 'Heures supplémentaires non comptabilisées correctement Q1 2026 pour 1 collaborateur'],
    penalties: 800_000, remediationDueAt: '2026-06-22' },

  { id: 'ins-004', ref: 'INS-2026-011', countryCode: 'CI', inspectorName: 'M. Yao Adjoua',
    inspectorAuthority: 'Inspection du travail — district Plateau',
    visitedAt: '2026-05-15', outcome: 'observations',
    findings: ['DUER unité « espace clientèle Sénégal » à actualiser (issue déjà DUER rsk-003)', 'Plan de formation à présenter au CSE'],
    remediationDueAt: '2026-07-15' },
];

// ────────────── KPIs
const totalHoursWorkedYTD = 14 * 800;   // mock 800 h/collab YTD
const atOpen = INCIDENTS.filter((i) => i.status !== 'closed').length;
const atForRates = INCIDENTS.filter((i) => i.type === 'AT' || i.type === 'AT_trajet');
const workdaysLost = atForRates.reduce((s, i) => s + i.workdaysLost, 0);
const tf = totalHoursWorkedYTD > 0 ? (atForRates.length * 1_000_000) / totalHoursWorkedYTD : 0;
const tg = totalHoursWorkedYTD > 0 ? (workdaysLost * 8 * 1_000) / totalHoursWorkedYTD : 0;

const findingsAll = AUDITS.flatMap((a) => a.findings);
const findingsOpen = findingsAll.filter((f) => f.status !== 'closed' && f.status !== 'accepted_risk');
const findingsCritical = findingsOpen.filter((f) => f.severity === 'critical');

const now = new Date(TODAY).getTime();
const declarationsOverdue = DECLARATIONS.filter((d) => d.status === 'overdue').length;
const declarationsDueIn7d = DECLARATIONS.filter((d) => {
  if (d.status !== 'draft') return false;
  const t = new Date(d.dueDate).getTime();
  return t > now && t - now < COMPLIANCE_THRESHOLDS.DECLARATION_DUE_ALERT_DAYS * 86_400_000;
}).length;

const visitesEnRetard = MEDICAL_VISITS.filter((v) => {
  if (v.performedAt) return false;
  return new Date(v.scheduledAt).getTime() < now - COMPLIANCE_THRESHOLDS.VISITE_PERIODIC_GRACE_DAYS * 86_400_000;
}).length;

const habilitationsExpirantes = AUTHORIZATIONS.filter((a) => {
  if (a.status === 'expired') return true;
  const t = new Date(a.expiresAt).getTime();
  return t > now && t - now < COMPLIANCE_THRESHOLDS.HABILITATION_ALERT_DAYS * 86_400_000;
}).length;

const duerCritical = RISKS.filter((r) => r.level === 'critique' || r.level === 'eleve').length;
const duerNextReview = Math.min(...RISKS.map((r) => Math.round((new Date(r.nextReviewDue).getTime() - now) / 86_400_000)));

const lastRpsCompleted = RPS_SURVEYS.filter((r) => r.status === 'analyzed' || r.status === 'closed')
  .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''))[0];
const rpsDaysAgo = lastRpsCompleted?.closedAt
  ? Math.round((now - new Date(lastRpsCompleted.closedAt).getTime()) / 86_400_000)
  : 999;

// Score global pondéré
const auditScores = AUDITS.filter((a) => a.conformityScore != null).map((a) => a.conformityScore!);
const avgAuditScore = auditScores.length ? auditScores.reduce((a, b) => a + b, 0) / auditScores.length : 0;
const penalties = atOpen * 2 + findingsCritical.length * 5 + declarationsOverdue * 5 + visitesEnRetard * 1;
const conformityScoreGlobal = Math.max(0, Math.min(100, Math.round(avgAuditScore - penalties)));

const inspectionsOpenActions = INSPECTIONS.filter((i) => i.remediationDueAt && !i.followUpDoneAt).length;
const retentionsExpiringYear = 12;  // mock

export const CONFORMITE_KPI: ConformiteKPI = {
  conformityScoreGlobal,
  duerRisksTotal: RISKS.length,
  duerRisksCritical: duerCritical,
  duerNextReviewInDays: duerNextReview,
  atFrequencyRate: Math.round(tf * 10) / 10,
  atSeverityRate: Math.round(tg * 100) / 100,
  atOpenCount: atOpen,
  declarationsDueIn7d,
  declarationsOverdue,
  visitesEnRetardCount: visitesEnRetard,
  habilitationsExpirantes30j: habilitationsExpirantes,
  rpsBurnoutRiskPct: lastRpsCompleted?.burnoutRiskPct ?? 0,
  rpsLastSurveyDaysAgo: rpsDaysAgo,
  auditsOpenFindings: findingsOpen.length,
  auditsCriticalFindings: findingsCritical.length,
  inspectionsOpenActions,
  retentionsExpiringYear,
};

// Helpers
export const riskById = (id: string) => RISKS.find((r) => r.id === id);
export const incidentById = (id: string) => INCIDENTS.find((i) => i.id === id);
export const auditById = (id: string) => AUDITS.find((a) => a.id === id);
export const declarationsByCountry = (cc: string) => DECLARATIONS.filter((d) => d.countryCode === cc);
export const authorizationsByEmployee = (eid: string) => AUTHORIZATIONS.filter((a) => a.employeeId === eid);
export const medicalVisitsByEmployee = (eid: string) => MEDICAL_VISITS.filter((v) => v.employeeId === eid);
