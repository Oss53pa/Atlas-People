/**
 * M11 FORMATION — données de démonstration.
 * Catalogue 26 formations · Plan 2026 (28 items) · 18 sessions · 110 inscriptions
 * · Kirkpatrick L1-L4 · 14 certifications · 4 déclarations FDFP/3FPT · uplift compétences.
 */
import { EMPLOYEES } from '../../data/mock';
import type {
  Course, TrainingPlan, PlanItem, TrainingSession, Registration,
  KirkpatrickEvaluation, Certification, FdfpDeclaration, RoiCalculation,
  SkillUpliftEntry, FormationKPI,
} from './types';
import { TRAINING_THRESHOLDS } from './referentiels';

const TODAY = '2026-05-31';
const ymd = (s: string) => s;

// ───────────────────────── CATALOGUE (26 formations) ─────────────────────────
export const COURSES: Course[] = [
  // Leadership
  { id: 'crs-001', ref: 'FRM-2026-0001', title: 'Leadership Excellence — niveau Directeur', modality: 'blended', provider: 'external', providerName: 'Cegos Africa',
    category: 'leadership', level: 'expert', language: 'FR', durationHours: 40, costPerHead: 1_250_000,
    summary: 'Programme intensif pour DG/Directeurs — vision, influence, prise de décision.',
    objectives: [{ text: 'Définir une vision stratégique mobilisatrice', skillCode: 'LEAD-VIS', targetLevel: 5 }, { text: 'Conduire une transformation organisationnelle', skillCode: 'LEAD-CHG', targetLevel: 4 }],
    prerequisites: ['5 ans en position de direction'], fdfpEligible: true, status: 'active', kirkpatrickLevels: 4,
    createdAt: '2025-11-12', updatedAt: '2026-01-08', tags: ['comex', 'dirigeants'] },

  { id: 'crs-002', ref: 'FRM-2026-0002', title: 'Manager Coach — niveau 1', modality: 'classroom', provider: 'external', providerName: 'Institut RH Dakar',
    category: 'management', level: 'intermediate', language: 'FR', durationHours: 21, costPerHead: 480_000, costPerSession: 5_500_000, minParticipants: 8, maxParticipants: 14,
    summary: 'Postures de coach, feedback, écoute active, conduite d\'entretien.',
    objectives: [{ text: 'Mener un 1-1 efficace', skillCode: 'MGR-1O1', targetLevel: 3 }, { text: 'Délivrer un feedback constructif', skillCode: 'MGR-FBK', targetLevel: 3 }],
    fdfpEligible: true, status: 'active', kirkpatrickLevels: 3,
    createdAt: '2025-09-04', updatedAt: '2025-12-20', tags: ['management', 'cycle-mgr'] },

  { id: 'crs-003', ref: 'FRM-2026-0003', title: 'TypeScript avancé & patterns', modality: 'e_learning', provider: 'mooc', providerName: 'OpenClassrooms',
    category: 'technical', level: 'advanced', language: 'FR', durationHours: 28, costPerHead: 180_000,
    summary: 'Génériques avancés, type-level programming, performance compilateur.',
    objectives: [{ text: 'Maîtriser les types conditionnels', skillCode: 'TECH-TS', targetLevel: 4 }],
    prerequisites: ['TypeScript intermédiaire'], fdfpEligible: true, status: 'active', kirkpatrickLevels: 2,
    createdAt: '2025-08-22', updatedAt: '2026-02-14', tags: ['tech', 'frontend'] },

  { id: 'crs-004', ref: 'FRM-2026-0004', title: 'AWS Solutions Architect — Associate (préparation)', modality: 'certification_prep', provider: 'external', providerName: 'CloudGuru',
    category: 'technical', level: 'advanced', language: 'EN', durationHours: 60, costPerHead: 520_000,
    summary: 'Préparation à la certification AWS SAA-C03 + examen blanc.',
    objectives: [{ text: 'Architecturer une solution AWS sécurisée', skillCode: 'CLD-AWS', targetLevel: 4 }],
    certificationCode: 'AWS-SAA-C03', fdfpEligible: true, status: 'active', kirkpatrickLevels: 4,
    createdAt: '2025-10-15', updatedAt: '2026-03-01', tags: ['cloud', 'cert'] },

  { id: 'crs-005', ref: 'FRM-2026-0005', title: 'Négociation commerciale haute valeur', modality: 'workshop', provider: 'external', providerName: 'Mercuri Africa',
    category: 'sales', level: 'advanced', language: 'FR', durationHours: 14, costPerHead: 380_000, costPerSession: 4_200_000, maxParticipants: 12,
    summary: 'Négocier des deals enterprise — méthode SPIN + closing.',
    objectives: [{ text: 'Augmenter le panier moyen', skillCode: 'COM-NEG', targetLevel: 4 }],
    fdfpEligible: true, status: 'active', kirkpatrickLevels: 4,
    createdAt: '2025-12-01', updatedAt: '2026-01-15', tags: ['sales', 'commercial'] },

  { id: 'crs-006', ref: 'FRM-2026-0006', title: 'Anglais professionnel B2 → C1', modality: 'blended', provider: 'external', providerName: 'British Council Abidjan',
    category: 'language', level: 'intermediate', language: 'EN', durationHours: 80, costPerHead: 650_000,
    summary: '6 mois de progression vers C1, e-learning + classes virtuelles.',
    objectives: [{ text: 'Animer une réunion en anglais', skillCode: 'LNG-EN', targetLevel: 4 }],
    fdfpEligible: true, status: 'active', kirkpatrickLevels: 2,
    createdAt: '2025-09-12', updatedAt: '2026-01-20', tags: ['langues'] },

  { id: 'crs-007', ref: 'FRM-2026-0007', title: 'RGPD & protection des données — niveau opérationnel', modality: 'e_learning', provider: 'internal', providerName: 'DPO Atlas',
    category: 'compliance', level: 'beginner', language: 'FR', durationHours: 4, costPerHead: 0,
    summary: 'Obligations RGPD/loi 2013-450 CI — cas pratiques RH/IT/Sales.',
    objectives: [{ text: 'Identifier une donnée personnelle sensible', skillCode: 'COMP-RGPD', targetLevel: 2 }],
    fdfpEligible: false, status: 'active', kirkpatrickLevels: 2,
    createdAt: '2025-06-15', updatedAt: '2026-02-28', tags: ['conformité', 'obligatoire'] },

  { id: 'crs-008', ref: 'FRM-2026-0008', title: 'Anti-corruption & lutte anti-blanchiment', modality: 'e_learning', provider: 'external', providerName: 'EthixPro',
    category: 'compliance', level: 'beginner', language: 'FR', durationHours: 3, costPerHead: 35_000,
    summary: 'Loi Sapin 2 + UEMOA — détection des risques.',
    objectives: [{ text: 'Signaler une situation à risque', skillCode: 'COMP-AC', targetLevel: 2 }],
    fdfpEligible: false, status: 'active', kirkpatrickLevels: 2,
    createdAt: '2025-07-01', updatedAt: '2026-01-10', tags: ['conformité', 'obligatoire'] },

  { id: 'crs-009', ref: 'FRM-2026-0009', title: 'Habilitation électrique BS-BE manœuvre', modality: 'classroom', provider: 'external', providerName: 'INSPCT Côte d\'Ivoire',
    category: 'safety', level: 'beginner', language: 'FR', durationHours: 14, costPerHead: 220_000, maxParticipants: 10,
    summary: 'Habilitation NFC 18-510 — opérations simples sur installations.',
    objectives: [{ text: 'Sécuriser une zone d\'intervention', skillCode: 'SAFE-ELEC', targetLevel: 2 }],
    certificationCode: 'HAB-BS-BE', fdfpEligible: true, status: 'active', kirkpatrickLevels: 2,
    createdAt: '2025-04-20', updatedAt: '2025-11-05', tags: ['HSE', 'obligatoire'] },

  { id: 'crs-010', ref: 'FRM-2026-0010', title: 'Secourisme du travail (SST)', modality: 'classroom', provider: 'external', providerName: 'Croix-Rouge CI',
    category: 'safety', level: 'beginner', language: 'FR', durationHours: 14, costPerHead: 95_000, maxParticipants: 10,
    summary: 'Devenir Sauveteur Secouriste du Travail — certifié 2 ans.',
    objectives: [{ text: 'Réaliser les gestes de premiers secours', skillCode: 'SAFE-SST', targetLevel: 3 }],
    certificationCode: 'SST', fdfpEligible: true, status: 'active', kirkpatrickLevels: 2,
    createdAt: '2025-05-12', updatedAt: '2025-12-01', tags: ['HSE', 'obligatoire'] },

  { id: 'crs-011', ref: 'FRM-2026-0011', title: 'Product Discovery (Continuous Discovery Habits)', modality: 'workshop', provider: 'external', providerName: 'Product School',
    category: 'product', level: 'advanced', language: 'EN', durationHours: 21, costPerHead: 720_000, maxParticipants: 12,
    summary: 'Méthodes Teresa Torres — interviews, opportunity solution trees.',
    objectives: [{ text: 'Conduire un cycle de discovery hebdo', skillCode: 'PRD-DISC', targetLevel: 4 }],
    fdfpEligible: true, status: 'active', kirkpatrickLevels: 3,
    createdAt: '2025-11-22', updatedAt: '2026-02-05', tags: ['produit'] },

  { id: 'crs-012', ref: 'FRM-2026-0012', title: 'Design thinking — atelier 2 jours', modality: 'workshop', provider: 'external', providerName: 'Strate Africa',
    category: 'soft_skills', level: 'intermediate', language: 'FR', durationHours: 14, costPerHead: 280_000, costPerSession: 3_200_000,
    summary: 'Cadrage problème, idéation, prototypage rapide.',
    objectives: [{ text: 'Animer un atelier d\'idéation', skillCode: 'SS-DT', targetLevel: 3 }],
    fdfpEligible: true, status: 'active', kirkpatrickLevels: 2,
    createdAt: '2025-08-30', updatedAt: '2026-01-25', tags: ['innovation'] },

  { id: 'crs-013', ref: 'FRM-2026-0013', title: 'Excel avancé — TCD, Power Query, modélisation', modality: 'e_learning', provider: 'mooc', providerName: 'Udemy',
    category: 'digital', level: 'intermediate', language: 'FR', durationHours: 16, costPerHead: 45_000,
    summary: 'Maîtrise des fonctions analytiques + intégration de sources.',
    objectives: [{ text: 'Concevoir un tableau de bord dynamique', skillCode: 'DIG-XL', targetLevel: 3 }],
    fdfpEligible: true, status: 'active', kirkpatrickLevels: 2,
    createdAt: '2025-07-18', updatedAt: '2026-01-08', tags: ['digital'] },

  { id: 'crs-014', ref: 'FRM-2026-0014', title: 'IFRS — états financiers consolidés', modality: 'classroom', provider: 'external', providerName: 'OEC Abidjan',
    category: 'finance', level: 'advanced', language: 'FR', durationHours: 21, costPerHead: 580_000,
    summary: 'Application IFRS aux groupes OHADA — méthodes & retraitements.',
    objectives: [{ text: 'Produire des comptes consolidés IFRS', skillCode: 'FIN-IFRS', targetLevel: 4 }],
    fdfpEligible: true, status: 'active', kirkpatrickLevels: 2,
    createdAt: '2025-10-05', updatedAt: '2026-02-10', tags: ['finance', 'comptabilité'] },

  { id: 'crs-015', ref: 'FRM-2026-0015', title: 'Sécurité informatique — sensibilisation tous publics', modality: 'e_learning', provider: 'internal', providerName: 'CISO Atlas',
    category: 'compliance', level: 'beginner', language: 'FR', durationHours: 2, costPerHead: 0,
    summary: 'Phishing, mots de passe, données sensibles, signalement.',
    objectives: [{ text: 'Identifier un email de phishing', skillCode: 'COMP-SEC', targetLevel: 2 }],
    fdfpEligible: false, status: 'active', kirkpatrickLevels: 2,
    createdAt: '2025-06-01', updatedAt: '2026-03-15', tags: ['sécurité', 'obligatoire'] },

  { id: 'crs-016', ref: 'FRM-2026-0016', title: 'Devenir Scrum Master — préparation PSM I', modality: 'certification_prep', provider: 'external', providerName: 'Scrum.org partner',
    category: 'product', level: 'intermediate', language: 'EN', durationHours: 16, costPerHead: 320_000,
    summary: 'Cadre Scrum + examen blanc + voucher PSM I inclus.',
    objectives: [{ text: 'Animer les cérémonies Scrum', skillCode: 'PRD-SCM', targetLevel: 3 }],
    certificationCode: 'PSM-I', fdfpEligible: true, status: 'active', kirkpatrickLevels: 4,
    createdAt: '2025-11-08', updatedAt: '2026-02-20', tags: ['agile', 'cert'] },

  { id: 'crs-017', ref: 'FRM-2026-0017', title: 'DevOps & CI/CD avec GitHub Actions', modality: 'blended', provider: 'external', providerName: 'OpenClassrooms',
    category: 'technical', level: 'advanced', language: 'FR', durationHours: 35, costPerHead: 420_000,
    summary: 'Pipeline complet, sécurité, infrastructure as code (Terraform).',
    objectives: [{ text: 'Déployer en continu une appli', skillCode: 'TECH-DEVOPS', targetLevel: 4 }],
    fdfpEligible: true, status: 'active', kirkpatrickLevels: 3,
    createdAt: '2025-09-30', updatedAt: '2026-02-28', tags: ['devops', 'cloud'] },

  { id: 'crs-018', ref: 'FRM-2026-0018', title: 'Communication d\'impact (storytelling exécutif)', modality: 'workshop', provider: 'external', providerName: 'Vision Africa',
    category: 'soft_skills', level: 'advanced', language: 'FR', durationHours: 14, costPerHead: 380_000,
    summary: 'Storytelling pour décideurs, pitch produit, prise de parole.',
    objectives: [{ text: 'Pitcher un produit en 5 minutes', skillCode: 'SS-COMM', targetLevel: 4 }],
    fdfpEligible: true, status: 'active', kirkpatrickLevels: 3,
    createdAt: '2025-12-15', updatedAt: '2026-02-25', tags: ['communication'] },

  { id: 'crs-019', ref: 'FRM-2026-0019', title: 'Gestion de projet — PMP préparation', modality: 'certification_prep', provider: 'external', providerName: 'PMI ATPP',
    category: 'management', level: 'advanced', language: 'EN', durationHours: 35, costPerHead: 980_000,
    summary: 'Préparation complète à l\'examen PMP 2026 + examen blanc.',
    objectives: [{ text: 'Maîtriser le PMBOK 7', skillCode: 'MGR-PMP', targetLevel: 4 }],
    certificationCode: 'PMP', fdfpEligible: true, status: 'active', kirkpatrickLevels: 4,
    createdAt: '2025-08-12', updatedAt: '2026-02-18', tags: ['management', 'cert'] },

  { id: 'crs-020', ref: 'FRM-2026-0020', title: 'Onboarding Atlas — produit & valeurs', modality: 'e_learning', provider: 'internal', providerName: 'L&D Atlas',
    category: 'business', level: 'beginner', language: 'FR', durationHours: 6, costPerHead: 0,
    summary: 'Tour d\'horizon Atlas Studio + vision + valeurs + organisation.',
    objectives: [{ text: 'Comprendre le marché Atlas', skillCode: 'BIZ-ATLAS', targetLevel: 2 }],
    fdfpEligible: false, status: 'active', kirkpatrickLevels: 1,
    createdAt: '2025-05-10', updatedAt: '2026-04-12', tags: ['onboarding', 'obligatoire'] },

  { id: 'crs-021', ref: 'FRM-2026-0021', title: 'Coaching individuel exécutif', modality: 'coaching', provider: 'external', providerName: 'Talentyz',
    category: 'leadership', level: 'expert', language: 'FR', durationHours: 12, costPerHead: 950_000,
    summary: '6 séances de 2h, coach ICF certifié — pour comité de direction.',
    objectives: [{ text: 'Développer son agilité émotionnelle', skillCode: 'LEAD-EQ', targetLevel: 5 }],
    fdfpEligible: false, status: 'active', kirkpatrickLevels: 4,
    createdAt: '2025-11-30', updatedAt: '2026-01-22', tags: ['coaching', 'comex'] },

  { id: 'crs-022', ref: 'FRM-2026-0022', title: 'Cybersécurité — fondamentaux SOC', modality: 'blended', provider: 'external', providerName: 'INPRES',
    category: 'technical', level: 'intermediate', language: 'FR', durationHours: 28, costPerHead: 480_000,
    summary: 'Concepts SOC, SIEM, détection & réponse aux incidents.',
    objectives: [{ text: 'Trier un incident de sécurité', skillCode: 'SEC-SOC', targetLevel: 3 }],
    fdfpEligible: true, status: 'active', kirkpatrickLevels: 3,
    createdAt: '2025-10-22', updatedAt: '2026-02-08', tags: ['sécurité'] },

  { id: 'crs-023', ref: 'FRM-2026-0023', title: 'OHADA — droit du travail & contentieux RH', modality: 'classroom', provider: 'external', providerName: 'ERSUMA',
    category: 'compliance', level: 'advanced', language: 'FR', durationHours: 21, costPerHead: 520_000,
    summary: 'Code du travail OHADA + jurisprudences récentes + contentieux.',
    objectives: [{ text: 'Sécuriser une procédure disciplinaire', skillCode: 'COMP-OHADA', targetLevel: 4 }],
    fdfpEligible: true, status: 'active', kirkpatrickLevels: 2,
    createdAt: '2025-09-18', updatedAt: '2026-02-15', tags: ['conformité', 'droit'] },

  { id: 'crs-024', ref: 'FRM-2026-0024', title: 'Vente consultative B2B', modality: 'classroom', provider: 'external', providerName: 'Mercuri Africa',
    category: 'sales', level: 'intermediate', language: 'FR', durationHours: 21, costPerHead: 360_000, maxParticipants: 12,
    summary: 'Approche consultative, qualification BANT, démos engageantes.',
    objectives: [{ text: 'Conduire un cycle de vente complet', skillCode: 'COM-CONS', targetLevel: 3 }],
    fdfpEligible: true, status: 'active', kirkpatrickLevels: 3,
    createdAt: '2025-10-08', updatedAt: '2026-01-30', tags: ['sales'] },

  { id: 'crs-025', ref: 'FRM-2026-0025', title: 'Mentorat — devenir mentor interne', modality: 'mentoring', provider: 'internal', providerName: 'L&D Atlas',
    category: 'soft_skills', level: 'intermediate', language: 'FR', durationHours: 8, costPerHead: 0,
    summary: 'Formation à la posture de mentor + cadre du programme Atlas.',
    objectives: [{ text: 'Mener une relation mentorale efficace', skillCode: 'SS-MENT', targetLevel: 3 }],
    fdfpEligible: false, status: 'active', kirkpatrickLevels: 3,
    createdAt: '2025-12-08', updatedAt: '2026-02-22', tags: ['mentorat', 'soft'] },

  { id: 'crs-026', ref: 'FRM-2026-0026', title: 'Data Analytics avec Python', modality: 'e_learning', provider: 'mooc', providerName: 'Coursera',
    category: 'digital', level: 'intermediate', language: 'EN', durationHours: 40, costPerHead: 280_000,
    summary: 'Pandas, NumPy, visualisation, premiers modèles ML.',
    objectives: [{ text: 'Réaliser une analyse exploratoire', skillCode: 'DIG-PY', targetLevel: 3 }],
    fdfpEligible: true, status: 'active', kirkpatrickLevels: 2,
    createdAt: '2025-11-15', updatedAt: '2026-03-05', tags: ['data', 'digital'] },
];

export const courseById = (id: string): Course | undefined => COURSES.find((c) => c.id === id);

// ───────────────────────── PLAN 2026 ─────────────────────────
const planItems: PlanItem[] = [
  { id: 'pi-01', courseId: 'crs-001', targetEmployeeIds: ['e1', 'e14'], origin: 'strategic', priority: 'high', forecastQuarter: 'Q2', forecastCost: 2_500_000, status: 'in_progress', rationale: 'Préparation Comex 2027' },
  { id: 'pi-02', courseId: 'crs-002', targetEmployeeIds: ['e2', 'e3', 'e8', 'e13'], origin: 'career_path', priority: 'high', forecastQuarter: 'Q2', forecastCost: 1_920_000, status: 'scheduled', rationale: 'Trajectoire Manager' },
  { id: 'pi-03', courseId: 'crs-003', targetEmployeeIds: ['e2', 'e5', 'e8'], origin: 'evaluation', priority: 'medium', forecastQuarter: 'Q1', forecastCost: 540_000, realisedCost: 540_000, status: 'completed' },
  { id: 'pi-04', courseId: 'crs-004', targetEmployeeIds: ['e8', 'e10'], origin: 'okr', priority: 'high', forecastQuarter: 'Q3', forecastCost: 1_040_000, status: 'planned', rationale: 'KR migration cloud' },
  { id: 'pi-05', courseId: 'crs-005', targetEmployeeIds: ['e4', 'e11', 'e13'], origin: 'okr', priority: 'high', forecastQuarter: 'Q2', forecastCost: 1_140_000, status: 'in_progress', rationale: 'KR uplift conversion' },
  { id: 'pi-06', courseId: 'crs-006', targetEmployeeIds: ['e3', 'e5', 'e10', 'e14'], origin: 'individual_request', priority: 'medium', forecastQuarter: 'Q1', forecastCost: 2_600_000, realisedCost: 1_950_000, status: 'in_progress' },
  { id: 'pi-07', courseId: 'crs-007', targetEmployeeIds: EMPLOYEES.map((e) => e.id), origin: 'legal', priority: 'critical', forecastQuarter: 'Q1', forecastCost: 0, realisedCost: 0, status: 'completed', rationale: 'Obligation annuelle RGPD' },
  { id: 'pi-08', courseId: 'crs-008', targetEmployeeIds: EMPLOYEES.map((e) => e.id), origin: 'legal', priority: 'critical', forecastQuarter: 'Q1', forecastCost: 490_000, realisedCost: 490_000, status: 'completed' },
  { id: 'pi-09', courseId: 'crs-009', targetEmployeeIds: ['e8', 'e12'], origin: 'legal', priority: 'high', forecastQuarter: 'Q3', forecastCost: 440_000, status: 'planned' },
  { id: 'pi-10', courseId: 'crs-010', targetEmployeeIds: ['e6', 'e9', 'e12', 'e11'], origin: 'legal', priority: 'high', forecastQuarter: 'Q2', forecastCost: 380_000, status: 'scheduled' },
  { id: 'pi-11', courseId: 'crs-011', targetEmployeeIds: ['e14', 'e5'], origin: 'strategic', priority: 'high', forecastQuarter: 'Q2', forecastCost: 1_440_000, status: 'in_progress' },
  { id: 'pi-12', courseId: 'crs-012', targetEmployeeIds: ['e2', 'e5', 'e10', 'e14'], origin: 'okr', priority: 'medium', forecastQuarter: 'Q1', forecastCost: 1_120_000, realisedCost: 1_120_000, status: 'completed' },
  { id: 'pi-13', courseId: 'crs-013', targetEmployeeIds: ['e6', 'e1', 'e3', 'e9'], origin: 'evaluation', priority: 'low', forecastQuarter: 'Q2', forecastCost: 180_000, status: 'in_progress' },
  { id: 'pi-14', courseId: 'crs-014', targetEmployeeIds: ['e1', 'e6'], origin: 'strategic', priority: 'high', forecastQuarter: 'Q3', forecastCost: 1_160_000, status: 'planned' },
  { id: 'pi-15', courseId: 'crs-015', targetEmployeeIds: EMPLOYEES.map((e) => e.id), origin: 'legal', priority: 'critical', forecastQuarter: 'Q1', forecastCost: 0, realisedCost: 0, status: 'completed' },
  { id: 'pi-16', courseId: 'crs-016', targetEmployeeIds: ['e10', 'e2', 'e14'], origin: 'evaluation', priority: 'medium', forecastQuarter: 'Q2', forecastCost: 960_000, status: 'in_progress' },
  { id: 'pi-17', courseId: 'crs-017', targetEmployeeIds: ['e8', 'e10'], origin: 'okr', priority: 'high', forecastQuarter: 'Q3', forecastCost: 840_000, status: 'planned' },
  { id: 'pi-18', courseId: 'crs-018', targetEmployeeIds: ['e1', 'e3', 'e13', 'e14'], origin: 'strategic', priority: 'medium', forecastQuarter: 'Q2', forecastCost: 1_520_000, status: 'scheduled' },
  { id: 'pi-19', courseId: 'crs-019', targetEmployeeIds: ['e14'], origin: 'career_path', priority: 'medium', forecastQuarter: 'Q3', forecastCost: 980_000, status: 'planned' },
  { id: 'pi-20', courseId: 'crs-020', targetEmployeeIds: ['e11'], origin: 'legal', priority: 'critical', forecastQuarter: 'Q1', forecastCost: 0, realisedCost: 0, status: 'completed' },
  { id: 'pi-21', courseId: 'crs-021', targetEmployeeIds: ['e1', 'e14'], origin: 'strategic', priority: 'high', forecastQuarter: 'Q2', forecastCost: 1_900_000, status: 'in_progress', rationale: 'Coaching exécutif' },
  { id: 'pi-22', courseId: 'crs-022', targetEmployeeIds: ['e8'], origin: 'strategic', priority: 'high', forecastQuarter: 'Q3', forecastCost: 480_000, status: 'planned', rationale: 'Renfort cybersécurité' },
  { id: 'pi-23', courseId: 'crs-023', targetEmployeeIds: ['e3', 'e7'], origin: 'legal', priority: 'high', forecastQuarter: 'Q2', forecastCost: 1_040_000, status: 'scheduled' },
  { id: 'pi-24', courseId: 'crs-024', targetEmployeeIds: ['e4', 'e11'], origin: 'evaluation', priority: 'medium', forecastQuarter: 'Q1', forecastCost: 720_000, realisedCost: 720_000, status: 'completed' },
  { id: 'pi-25', courseId: 'crs-025', targetEmployeeIds: ['e1', 'e8', 'e14'], origin: 'strategic', priority: 'medium', forecastQuarter: 'Q1', forecastCost: 0, realisedCost: 0, status: 'completed' },
  { id: 'pi-26', courseId: 'crs-026', targetEmployeeIds: ['e10', 'e6'], origin: 'individual_request', priority: 'low', forecastQuarter: 'Q3', forecastCost: 560_000, status: 'planned' },
  { id: 'pi-27', courseId: 'crs-002', targetEmployeeIds: ['e7'], origin: 'evaluation', priority: 'medium', forecastQuarter: 'Q4', forecastCost: 480_000, status: 'planned' },
  { id: 'pi-28', courseId: 'crs-018', targetEmployeeIds: ['e4'], origin: 'individual_request', priority: 'low', forecastQuarter: 'Q4', forecastCost: 380_000, status: 'planned' },
];

const totalForecast = planItems.reduce((s, it) => s + it.forecastCost, 0);
const totalRealised = planItems.reduce((s, it) => s + (it.realisedCost ?? 0), 0);

export const PLAN_2026: TrainingPlan = {
  id: 'pln-2026',
  ref: 'PLN-2026',
  year: 2026,
  scope: 'company',
  scopeLabel: 'Atlas People — Groupe',
  status: 'in_execution',
  budgetEnvelope: 28_500_000,
  budgetConsumed: totalRealised,
  fdfpRebateForecast: Math.round(totalForecast * 0.42),    // imputabilité estimée
  beneficiariesForecast: new Set(planItems.flatMap((it) => it.targetEmployeeIds)).size,
  hoursForecast: planItems.reduce((s, it) => s + (courseById(it.courseId)?.durationHours ?? 0) * it.targetEmployeeIds.length, 0),
  items: planItems,
  approvedById: 'e1',
  approvedAt: '2025-12-15',
  createdAt: '2025-11-02',
  createdById: 'e3',
};

export const PLANS: TrainingPlan[] = [PLAN_2026];

// ───────────────────────── SESSIONS ─────────────────────────
const sessionDays = (start: string, days: number): { date: string; startTime: string; endTime: string }[] => {
  const out: { date: string; startTime: string; endTime: string }[] = [];
  const [Y, M, D] = start.split('-').map((n) => parseInt(n, 10));
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(Y, M - 1, D + i));
    const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    out.push({ date: iso, startTime: '09:00', endTime: '17:00' });
  }
  return out;
};

export const SESSIONS: TrainingSession[] = [
  { id: 'ses-01', ref: 'SES-2026-001', courseId: 'crs-002', planId: 'pln-2026', status: 'open_registration', deliveryMode: 'on_site',
    location: 'Plateau, Abidjan — Salle Akwaba', trainers: [{ type: 'external', externalName: 'Léa Mondésir', organization: 'Institut RH Dakar', hourlyRate: 95_000 }],
    days: sessionDays('2026-06-15', 3), totalHours: 21, capacity: 14, registeredCount: 11, waitlistCount: 2,
    costTotal: 5_500_000, countryCode: 'CI' },

  { id: 'ses-02', ref: 'SES-2026-002', courseId: 'crs-005', planId: 'pln-2026', status: 'open_registration', deliveryMode: 'on_site',
    location: 'Almadies, Dakar', trainers: [{ type: 'external', externalName: 'Thierno Bâ', organization: 'Mercuri Africa', hourlyRate: 120_000 }],
    days: sessionDays('2026-06-22', 2), totalHours: 14, capacity: 12, registeredCount: 8, waitlistCount: 0, costTotal: 4_200_000, countryCode: 'SN' },

  { id: 'ses-03', ref: 'SES-2026-003', courseId: 'crs-003', planId: 'pln-2026', status: 'completed', deliveryMode: 'remote',
    meetingUrl: 'https://meet.atlas.io/ts-adv', trainers: [{ type: 'external', externalName: 'OpenClassrooms (asynchrone)', organization: 'OpenClassrooms' }],
    days: sessionDays('2026-02-03', 1), totalHours: 28, capacity: 50, registeredCount: 12, waitlistCount: 0, attendedCount: 11,
    completionRate: 0.92, averageScore: 82, averageReactionScore: 4.4, costTotal: 2_160_000, countryCode: 'CI' },

  { id: 'ses-04', ref: 'SES-2026-004', courseId: 'crs-006', planId: 'pln-2026', status: 'in_progress', deliveryMode: 'hybrid',
    location: 'British Council Abidjan', trainers: [{ type: 'external', externalName: 'Sarah O\'Connor', organization: 'British Council', hourlyRate: 75_000 }],
    days: sessionDays('2026-03-10', 1), totalHours: 80, capacity: 20, registeredCount: 14, waitlistCount: 0, costTotal: 9_100_000, countryCode: 'CI',
    averageReactionScore: 4.5 },

  { id: 'ses-05', ref: 'SES-2026-005', courseId: 'crs-001', planId: 'pln-2026', status: 'in_progress', deliveryMode: 'hybrid',
    location: 'Cocody, Abidjan + classes virtuelles', trainers: [{ type: 'external', externalName: 'Dr. Mamadou Cissé', organization: 'Cegos Africa', hourlyRate: 250_000 }],
    days: sessionDays('2026-04-08', 5), totalHours: 40, capacity: 8, registeredCount: 2, waitlistCount: 0, costTotal: 2_500_000, countryCode: 'CI' },

  { id: 'ses-06', ref: 'SES-2026-006', courseId: 'crs-010', planId: 'pln-2026', status: 'scheduled', deliveryMode: 'on_site',
    location: 'Centre Croix-Rouge, Abidjan', trainers: [{ type: 'external', externalName: 'Croix-Rouge CI', organization: 'Croix-Rouge CI' }],
    days: sessionDays('2026-06-29', 2), totalHours: 14, capacity: 10, registeredCount: 4, waitlistCount: 0, costTotal: 380_000, countryCode: 'CI' },

  { id: 'ses-07', ref: 'SES-2026-007', courseId: 'crs-007', planId: 'pln-2026', status: 'completed', deliveryMode: 'remote',
    meetingUrl: 'https://lms.atlas.io/rgpd', trainers: [{ type: 'internal', employeeId: 'e3' }],
    days: sessionDays('2026-01-15', 1), totalHours: 4, capacity: 200, registeredCount: 14, waitlistCount: 0, attendedCount: 14,
    completionRate: 1.0, averageScore: 88, averageReactionScore: 4.1, costTotal: 0, countryCode: 'CI' },

  { id: 'ses-08', ref: 'SES-2026-008', courseId: 'crs-015', planId: 'pln-2026', status: 'completed', deliveryMode: 'remote',
    meetingUrl: 'https://lms.atlas.io/cyber-sens', trainers: [{ type: 'internal', employeeId: 'e8' }],
    days: sessionDays('2026-02-10', 1), totalHours: 2, capacity: 200, registeredCount: 14, waitlistCount: 0, attendedCount: 14,
    completionRate: 1.0, averageScore: 91, averageReactionScore: 4.3, costTotal: 0, countryCode: 'CI' },

  { id: 'ses-09', ref: 'SES-2026-009', courseId: 'crs-008', planId: 'pln-2026', status: 'completed', deliveryMode: 'remote',
    meetingUrl: 'https://ethixpro.com/ac', trainers: [{ type: 'external', externalName: 'EthixPro', organization: 'EthixPro' }],
    days: sessionDays('2026-01-22', 1), totalHours: 3, capacity: 100, registeredCount: 14, waitlistCount: 0, attendedCount: 14,
    completionRate: 1.0, averageScore: 85, averageReactionScore: 4.0, costTotal: 490_000, countryCode: 'CI' },

  { id: 'ses-10', ref: 'SES-2026-010', courseId: 'crs-012', planId: 'pln-2026', status: 'completed', deliveryMode: 'on_site',
    location: 'Strate Africa, Plateau', trainers: [{ type: 'external', externalName: 'Yasmine Diallo', organization: 'Strate Africa', hourlyRate: 110_000 }],
    days: sessionDays('2026-03-04', 2), totalHours: 14, capacity: 10, registeredCount: 8, waitlistCount: 0, attendedCount: 8,
    completionRate: 1.0, averageScore: 78, averageReactionScore: 4.6, costTotal: 3_200_000, countryCode: 'CI' },

  { id: 'ses-11', ref: 'SES-2026-011', courseId: 'crs-024', planId: 'pln-2026', status: 'completed', deliveryMode: 'on_site',
    location: 'Sicap Liberté, Dakar', trainers: [{ type: 'external', externalName: 'Aliou Dia', organization: 'Mercuri Africa', hourlyRate: 110_000 }],
    days: sessionDays('2026-02-17', 3), totalHours: 21, capacity: 12, registeredCount: 6, waitlistCount: 0, attendedCount: 5,
    completionRate: 0.83, averageScore: 73, averageReactionScore: 4.2, costTotal: 2_160_000, countryCode: 'SN' },

  { id: 'ses-12', ref: 'SES-2026-012', courseId: 'crs-011', planId: 'pln-2026', status: 'in_progress', deliveryMode: 'remote',
    meetingUrl: 'https://meet.product.school/atlas', trainers: [{ type: 'external', externalName: 'Jordan Peng', organization: 'Product School', hourlyRate: 180_000 }],
    days: sessionDays('2026-05-12', 3), totalHours: 21, capacity: 12, registeredCount: 2, waitlistCount: 0, costTotal: 1_440_000, countryCode: 'CI' },

  { id: 'ses-13', ref: 'SES-2026-013', courseId: 'crs-021', planId: 'pln-2026', status: 'in_progress', deliveryMode: 'on_site',
    location: 'Coaching résidentiel', trainers: [{ type: 'external', externalName: 'Aïssata Touré (ICF)', organization: 'Talentyz' }],
    days: sessionDays('2026-04-15', 1), totalHours: 12, capacity: 1, registeredCount: 1, waitlistCount: 0, costTotal: 950_000, countryCode: 'CI' },

  { id: 'ses-14', ref: 'SES-2026-014', courseId: 'crs-018', planId: 'pln-2026', status: 'scheduled', deliveryMode: 'on_site',
    location: 'Marcory, Abidjan', trainers: [{ type: 'external', externalName: 'Vision Africa', organization: 'Vision Africa', hourlyRate: 120_000 }],
    days: sessionDays('2026-07-08', 2), totalHours: 14, capacity: 12, registeredCount: 4, waitlistCount: 0, costTotal: 1_520_000, countryCode: 'CI' },

  { id: 'ses-15', ref: 'SES-2026-015', courseId: 'crs-013', planId: 'pln-2026', status: 'in_progress', deliveryMode: 'remote',
    meetingUrl: 'https://udemy.com/excel-adv', trainers: [{ type: 'external', externalName: 'Udemy', organization: 'Udemy' }],
    days: sessionDays('2026-05-01', 1), totalHours: 16, capacity: 100, registeredCount: 4, waitlistCount: 0, costTotal: 180_000, countryCode: 'CI' },

  { id: 'ses-16', ref: 'SES-2026-016', courseId: 'crs-020', planId: 'pln-2026', status: 'completed', deliveryMode: 'remote',
    meetingUrl: 'https://lms.atlas.io/onboarding', trainers: [{ type: 'internal', employeeId: 'e3' }],
    days: sessionDays('2026-01-08', 1), totalHours: 6, capacity: 200, registeredCount: 1, waitlistCount: 0, attendedCount: 1,
    completionRate: 1.0, averageScore: 95, averageReactionScore: 4.7, costTotal: 0, countryCode: 'SN' },

  { id: 'ses-17', ref: 'SES-2026-017', courseId: 'crs-025', planId: 'pln-2026', status: 'completed', deliveryMode: 'on_site',
    location: 'Locaux Atlas Abidjan', trainers: [{ type: 'internal', employeeId: 'e1' }],
    days: sessionDays('2026-03-18', 1), totalHours: 8, capacity: 15, registeredCount: 3, waitlistCount: 0, attendedCount: 3,
    completionRate: 1.0, averageScore: 88, averageReactionScore: 4.5, costTotal: 0, countryCode: 'CI' },

  { id: 'ses-18', ref: 'SES-2026-018', courseId: 'crs-016', planId: 'pln-2026', status: 'in_progress', deliveryMode: 'remote',
    meetingUrl: 'https://scrum.org/psm1', trainers: [{ type: 'external', externalName: 'Mickael Brun', organization: 'Scrum.org partner', hourlyRate: 130_000 }],
    days: sessionDays('2026-05-20', 2), totalHours: 16, capacity: 20, registeredCount: 3, waitlistCount: 0, costTotal: 960_000, countryCode: 'CI' },
];

export const sessionById = (id: string): TrainingSession | undefined => SESSIONS.find((s) => s.id === id);

// ───────────────────────── REGISTRATIONS ─────────────────────────
type R = Omit<Registration, 'ref'> & { ref?: string };
const reg = (
  id: string, sessionId: string, employeeId: string,
  status: Registration['status'], requestedAt: string,
  opts: Partial<R> = {},
): Registration => {
  const session = sessionById(sessionId)!;
  const course = courseById(session.courseId)!;
  return {
    id,
    ref: `REG-2026-${id.replace('reg-', '').padStart(4, '0')}`,
    sessionId, employeeId, status, requestedAt,
    approvedAt: opts.approvedAt,
    approvedById: opts.approvedById,
    confirmedAt: opts.confirmedAt,
    attendedHours: opts.attendedHours,
    learningScore: opts.learningScore,
    reactionScore: opts.reactionScore,
    reactionComment: opts.reactionComment,
    certificateId: opts.certificateId,
    cancelledAt: opts.cancelledAt,
    cancelledReason: opts.cancelledReason,
    allocatedCost: opts.allocatedCost ?? Math.round(session.costTotal / Math.max(1, session.registeredCount)) ?? course.costPerHead,
  };
};

export const REGISTRATIONS: Registration[] = [
  // Session 1 — Manager Coach (Abidjan)
  reg('reg-001', 'ses-01', 'e2', 'confirmed', '2026-04-20', { approvedAt: '2026-04-22', approvedById: 'e1', confirmedAt: '2026-04-25' }),
  reg('reg-002', 'ses-01', 'e3', 'confirmed', '2026-04-21', { approvedAt: '2026-04-22', approvedById: 'e1', confirmedAt: '2026-04-25' }),
  reg('reg-003', 'ses-01', 'e8', 'confirmed', '2026-04-20', { approvedAt: '2026-04-22', approvedById: 'e1', confirmedAt: '2026-04-25' }),
  reg('reg-004', 'ses-01', 'e13', 'confirmed', '2026-04-21', { approvedAt: '2026-04-22', approvedById: 'e1', confirmedAt: '2026-04-25' }),
  reg('reg-005', 'ses-01', 'e4', 'waitlisted', '2026-05-05'),
  reg('reg-006', 'ses-01', 'e10', 'waitlisted', '2026-05-08'),

  // Session 2 — Négociation
  reg('reg-010', 'ses-02', 'e4', 'confirmed', '2026-04-15', { approvedAt: '2026-04-18', approvedById: 'e13', confirmedAt: '2026-04-20' }),
  reg('reg-011', 'ses-02', 'e11', 'confirmed', '2026-04-15', { approvedAt: '2026-04-18', approvedById: 'e13', confirmedAt: '2026-04-20' }),
  reg('reg-012', 'ses-02', 'e13', 'confirmed', '2026-04-15', { approvedAt: '2026-04-18', approvedById: 'e1', confirmedAt: '2026-04-20' }),

  // Session 3 — TypeScript (terminé)
  reg('reg-020', 'ses-03', 'e2', 'completed', '2026-01-20', { approvedAt: '2026-01-22', approvedById: 'e1', confirmedAt: '2026-01-25', attendedHours: 28, learningScore: 87, reactionScore: 5, reactionComment: 'Excellent, niveau attendu.' }),
  reg('reg-021', 'ses-03', 'e5', 'completed', '2026-01-20', { approvedAt: '2026-01-22', approvedById: 'e2', confirmedAt: '2026-01-25', attendedHours: 28, learningScore: 79, reactionScore: 4 }),
  reg('reg-022', 'ses-03', 'e8', 'completed', '2026-01-21', { approvedAt: '2026-01-22', approvedById: 'e2', confirmedAt: '2026-01-25', attendedHours: 28, learningScore: 81, reactionScore: 4 }),
  reg('reg-023', 'ses-03', 'e10', 'completed', '2026-01-22', { approvedAt: '2026-01-23', approvedById: 'e2', confirmedAt: '2026-01-25', attendedHours: 24, learningScore: 70, reactionScore: 4 }),
  reg('reg-024', 'ses-03', 'e14', 'partial', '2026-01-23', { approvedAt: '2026-01-23', approvedById: 'e1', confirmedAt: '2026-01-25', attendedHours: 14, reactionScore: 3 }),

  // Session 4 — Anglais (en cours)
  reg('reg-030', 'ses-04', 'e3', 'attended', '2026-02-12', { approvedAt: '2026-02-14', approvedById: 'e1', confirmedAt: '2026-02-20', attendedHours: 42, reactionScore: 5 }),
  reg('reg-031', 'ses-04', 'e5', 'attended', '2026-02-12', { approvedAt: '2026-02-14', approvedById: 'e2', confirmedAt: '2026-02-20', attendedHours: 38, reactionScore: 4 }),
  reg('reg-032', 'ses-04', 'e10', 'attended', '2026-02-15', { approvedAt: '2026-02-16', approvedById: 'e2', confirmedAt: '2026-02-22', attendedHours: 40, reactionScore: 4 }),
  reg('reg-033', 'ses-04', 'e14', 'attended', '2026-02-12', { approvedAt: '2026-02-14', approvedById: 'e1', confirmedAt: '2026-02-20', attendedHours: 36, reactionScore: 5 }),

  // Session 5 — Leadership Exec
  reg('reg-040', 'ses-05', 'e1', 'confirmed', '2026-03-10', { approvedAt: '2026-03-12', approvedById: 'e1', confirmedAt: '2026-03-20', attendedHours: 24, reactionScore: 5 }),
  reg('reg-041', 'ses-05', 'e14', 'confirmed', '2026-03-10', { approvedAt: '2026-03-12', approvedById: 'e1', confirmedAt: '2026-03-20', attendedHours: 20, reactionScore: 4 }),

  // Session 6 — SST
  reg('reg-050', 'ses-06', 'e6', 'approved', '2026-05-20', { approvedAt: '2026-05-22', approvedById: 'e3' }),
  reg('reg-051', 'ses-06', 'e9', 'approved', '2026-05-20', { approvedAt: '2026-05-22', approvedById: 'e3' }),
  reg('reg-052', 'ses-06', 'e12', 'approved', '2026-05-22', { approvedAt: '2026-05-23', approvedById: 'e3' }),
  reg('reg-053', 'ses-06', 'e11', 'requested', '2026-05-28'),

  // Session 7 — RGPD (terminé) — tous les collab
  ...EMPLOYEES.map((e, i) =>
    reg(`reg-1${(i + 1).toString().padStart(2, '0')}`, 'ses-07', e.id, 'completed', '2026-01-10',
      { approvedAt: '2026-01-12', approvedById: 'e3', confirmedAt: '2026-01-13', attendedHours: 4, learningScore: 80 + ((i * 7) % 20), reactionScore: 4 + ((i % 2)) }),
  ),

  // Session 8 — Cybersécurité sens. (terminé)
  ...EMPLOYEES.map((e, i) =>
    reg(`reg-2${(i + 1).toString().padStart(2, '0')}`, 'ses-08', e.id, 'completed', '2026-02-05',
      { approvedAt: '2026-02-06', approvedById: 'e3', confirmedAt: '2026-02-08', attendedHours: 2, learningScore: 85 + ((i * 3) % 12), reactionScore: 4 + ((i + 1) % 2) }),
  ),

  // Session 9 — Anti-corruption (terminé)
  ...EMPLOYEES.map((e, i) =>
    reg(`reg-3${(i + 1).toString().padStart(2, '0')}`, 'ses-09', e.id, 'completed', '2026-01-18',
      { approvedAt: '2026-01-19', approvedById: 'e3', confirmedAt: '2026-01-21', attendedHours: 3, learningScore: 78 + ((i * 5) % 18), reactionScore: 4 }),
  ),

  // Session 10 — Design thinking (terminé)
  reg('reg-060', 'ses-10', 'e2', 'completed', '2026-02-20', { approvedAt: '2026-02-22', approvedById: 'e1', confirmedAt: '2026-02-25', attendedHours: 14, learningScore: 80, reactionScore: 5 }),
  reg('reg-061', 'ses-10', 'e5', 'completed', '2026-02-20', { approvedAt: '2026-02-22', approvedById: 'e2', confirmedAt: '2026-02-25', attendedHours: 14, learningScore: 76, reactionScore: 5 }),
  reg('reg-062', 'ses-10', 'e10', 'completed', '2026-02-21', { approvedAt: '2026-02-22', approvedById: 'e2', confirmedAt: '2026-02-25', attendedHours: 14, learningScore: 73, reactionScore: 4 }),
  reg('reg-063', 'ses-10', 'e14', 'completed', '2026-02-21', { approvedAt: '2026-02-22', approvedById: 'e1', confirmedAt: '2026-02-25', attendedHours: 14, learningScore: 84, reactionScore: 5 }),
  reg('reg-064', 'ses-10', 'e11', 'no_show', '2026-02-23', { approvedAt: '2026-02-24', approvedById: 'e4', cancelledAt: '2026-03-04', cancelledReason: 'Conflit client urgent' }),

  // Session 11 — Vente consultative (terminé)
  reg('reg-070', 'ses-11', 'e4', 'completed', '2026-02-01', { approvedAt: '2026-02-04', approvedById: 'e13', confirmedAt: '2026-02-10', attendedHours: 21, learningScore: 72, reactionScore: 4 }),
  reg('reg-071', 'ses-11', 'e11', 'completed', '2026-02-01', { approvedAt: '2026-02-04', approvedById: 'e4', confirmedAt: '2026-02-10', attendedHours: 21, learningScore: 74, reactionScore: 5 }),
  reg('reg-072', 'ses-11', 'e13', 'partial', '2026-02-02', { approvedAt: '2026-02-04', approvedById: 'e1', confirmedAt: '2026-02-10', attendedHours: 14, reactionScore: 3 }),

  // Session 12 — Product discovery (en cours)
  reg('reg-080', 'ses-12', 'e14', 'attended', '2026-04-25', { approvedAt: '2026-04-28', approvedById: 'e1', confirmedAt: '2026-05-05', attendedHours: 14 }),
  reg('reg-081', 'ses-12', 'e5', 'attended', '2026-04-25', { approvedAt: '2026-04-28', approvedById: 'e2', confirmedAt: '2026-05-05', attendedHours: 14 }),

  // Session 13 — Coaching exécutif (en cours)
  reg('reg-090', 'ses-13', 'e1', 'attended', '2026-04-01', { approvedAt: '2026-04-05', approvedById: 'e1', confirmedAt: '2026-04-12', attendedHours: 6 }),

  // Session 14 — Storytelling exécutif (programmé)
  reg('reg-100', 'ses-14', 'e1', 'approved', '2026-05-25', { approvedAt: '2026-05-27', approvedById: 'e3' }),
  reg('reg-101', 'ses-14', 'e3', 'approved', '2026-05-25', { approvedAt: '2026-05-27', approvedById: 'e1' }),
  reg('reg-102', 'ses-14', 'e13', 'approved', '2026-05-26', { approvedAt: '2026-05-28', approvedById: 'e1' }),
  reg('reg-103', 'ses-14', 'e14', 'approved', '2026-05-26', { approvedAt: '2026-05-28', approvedById: 'e1' }),

  // Session 15 — Excel avancé (en cours)
  reg('reg-110', 'ses-15', 'e1', 'attended', '2026-04-22', { approvedAt: '2026-04-23', approvedById: 'e1', attendedHours: 8 }),
  reg('reg-111', 'ses-15', 'e3', 'attended', '2026-04-22', { approvedAt: '2026-04-23', approvedById: 'e1', attendedHours: 6 }),
  reg('reg-112', 'ses-15', 'e6', 'attended', '2026-04-22', { approvedAt: '2026-04-23', approvedById: 'e1', attendedHours: 10 }),
  reg('reg-113', 'ses-15', 'e9', 'attended', '2026-04-23', { approvedAt: '2026-04-24', approvedById: 'e3', attendedHours: 4 }),

  // Session 16 — Onboarding Atlas (terminé)
  reg('reg-120', 'ses-16', 'e11', 'completed', '2026-01-05', { approvedAt: '2026-01-06', approvedById: 'e3', confirmedAt: '2026-01-08', attendedHours: 6, learningScore: 95, reactionScore: 5, reactionComment: 'Accueil parfait, organisation impeccable.' }),

  // Session 17 — Mentors internes
  reg('reg-130', 'ses-17', 'e1', 'completed', '2026-03-12', { approvedAt: '2026-03-13', approvedById: 'e3', confirmedAt: '2026-03-15', attendedHours: 8, learningScore: 90, reactionScore: 5 }),
  reg('reg-131', 'ses-17', 'e8', 'completed', '2026-03-12', { approvedAt: '2026-03-13', approvedById: 'e2', confirmedAt: '2026-03-15', attendedHours: 8, learningScore: 86, reactionScore: 4 }),
  reg('reg-132', 'ses-17', 'e14', 'completed', '2026-03-12', { approvedAt: '2026-03-13', approvedById: 'e1', confirmedAt: '2026-03-15', attendedHours: 8, learningScore: 88, reactionScore: 5 }),

  // Session 18 — Scrum Master (en cours)
  reg('reg-140', 'ses-18', 'e10', 'attended', '2026-05-10', { approvedAt: '2026-05-12', approvedById: 'e2', confirmedAt: '2026-05-18', attendedHours: 8 }),
  reg('reg-141', 'ses-18', 'e2', 'attended', '2026-05-10', { approvedAt: '2026-05-12', approvedById: 'e1', confirmedAt: '2026-05-18', attendedHours: 8 }),
  reg('reg-142', 'ses-18', 'e14', 'attended', '2026-05-10', { approvedAt: '2026-05-12', approvedById: 'e1', confirmedAt: '2026-05-18', attendedHours: 8 }),
];

export const registrationsBySession = (sessionId: string): Registration[] =>
  REGISTRATIONS.filter((r) => r.sessionId === sessionId);
export const registrationsByEmployee = (employeeId: string): Registration[] =>
  REGISTRATIONS.filter((r) => r.employeeId === employeeId);

// ───────────────────────── KIRKPATRICK ─────────────────────────
export const KIRKPATRICK_EVALS: KirkpatrickEvaluation[] = [
  { id: 'kp-001', sessionId: 'ses-03', level: 1, triggerDays: 1,  status: 'completed', launchedAt: '2026-02-04', closedAt: '2026-02-11', targetRespondents: 12, respondents: 11, aggregateScore: 4.4 },
  { id: 'kp-002', sessionId: 'ses-03', level: 2, triggerDays: 7,  status: 'completed', launchedAt: '2026-02-10', closedAt: '2026-02-17', targetRespondents: 11, respondents: 11, aggregateScore: 82 },
  { id: 'kp-003', sessionId: 'ses-03', level: 3, triggerDays: 90, status: 'in_progress', launchedAt: '2026-05-04', targetRespondents: 11, respondents: 7, aggregateScore: 3.8 },
  { id: 'kp-004', sessionId: 'ses-03', level: 4, triggerDays: 180, status: 'pending', targetRespondents: 11, respondents: 0 },

  { id: 'kp-010', sessionId: 'ses-07', level: 1, triggerDays: 1,  status: 'completed', launchedAt: '2026-01-16', closedAt: '2026-01-22', targetRespondents: 14, respondents: 14, aggregateScore: 4.1 },
  { id: 'kp-011', sessionId: 'ses-07', level: 2, triggerDays: 7,  status: 'completed', launchedAt: '2026-01-22', closedAt: '2026-01-29', targetRespondents: 14, respondents: 14, aggregateScore: 88 },

  { id: 'kp-020', sessionId: 'ses-08', level: 1, triggerDays: 1,  status: 'completed', launchedAt: '2026-02-11', closedAt: '2026-02-18', targetRespondents: 14, respondents: 14, aggregateScore: 4.3 },
  { id: 'kp-021', sessionId: 'ses-08', level: 2, triggerDays: 7,  status: 'completed', launchedAt: '2026-02-17', closedAt: '2026-02-24', targetRespondents: 14, respondents: 14, aggregateScore: 91 },

  { id: 'kp-030', sessionId: 'ses-09', level: 1, triggerDays: 1,  status: 'completed', launchedAt: '2026-01-23', closedAt: '2026-01-30', targetRespondents: 14, respondents: 14, aggregateScore: 4.0 },
  { id: 'kp-031', sessionId: 'ses-09', level: 2, triggerDays: 7,  status: 'completed', launchedAt: '2026-01-29', closedAt: '2026-02-05', targetRespondents: 14, respondents: 14, aggregateScore: 85 },

  { id: 'kp-040', sessionId: 'ses-10', level: 1, triggerDays: 1,  status: 'completed', launchedAt: '2026-03-06', closedAt: '2026-03-13', targetRespondents: 8, respondents: 8, aggregateScore: 4.6 },
  { id: 'kp-041', sessionId: 'ses-10', level: 2, triggerDays: 7,  status: 'completed', launchedAt: '2026-03-12', closedAt: '2026-03-19', targetRespondents: 8, respondents: 8, aggregateScore: 78 },

  { id: 'kp-050', sessionId: 'ses-11', level: 1, triggerDays: 1,  status: 'completed', launchedAt: '2026-02-21', closedAt: '2026-02-28', targetRespondents: 6, respondents: 5, aggregateScore: 4.2 },
  { id: 'kp-051', sessionId: 'ses-11', level: 2, triggerDays: 7,  status: 'completed', launchedAt: '2026-02-27', closedAt: '2026-03-06', targetRespondents: 6, respondents: 5, aggregateScore: 73 },
  { id: 'kp-052', sessionId: 'ses-11', level: 3, triggerDays: 90, status: 'in_progress', launchedAt: '2026-05-22', targetRespondents: 5, respondents: 3, aggregateScore: 4.0 },
  { id: 'kp-053', sessionId: 'ses-11', level: 4, triggerDays: 180, status: 'pending', targetRespondents: 5, respondents: 0 },

  { id: 'kp-060', sessionId: 'ses-16', level: 1, triggerDays: 1, status: 'completed', launchedAt: '2026-01-09', closedAt: '2026-01-16', targetRespondents: 1, respondents: 1, aggregateScore: 4.7 },

  { id: 'kp-070', sessionId: 'ses-17', level: 1, triggerDays: 1, status: 'completed', launchedAt: '2026-03-19', closedAt: '2026-03-26', targetRespondents: 3, respondents: 3, aggregateScore: 4.5 },
  { id: 'kp-071', sessionId: 'ses-17', level: 3, triggerDays: 90, status: 'pending', targetRespondents: 3, respondents: 0 },
];

export const kirkpatrickBySession = (sessionId: string): KirkpatrickEvaluation[] =>
  KIRKPATRICK_EVALS.filter((k) => k.sessionId === sessionId).sort((a, b) => a.level - b.level);

// ───────────────────────── CERTIFICATIONS ─────────────────────────
export const CERTIFICATIONS: Certification[] = [
  { id: 'cert-001', ref: 'CERT-2026-001', employeeId: 'e2', courseId: 'crs-016', certificateCode: 'PSM-I-2025-A4827', issuedAt: '2025-09-12', issuer: 'Scrum.org', status: 'active', validatedById: 'e1' },
  { id: 'cert-002', ref: 'CERT-2026-002', employeeId: 'e10', courseId: 'crs-016', certificateCode: 'PSM-I-2025-B1156', issuedAt: '2025-11-20', issuer: 'Scrum.org', status: 'active', validatedById: 'e1' },
  { id: 'cert-003', ref: 'CERT-2026-003', employeeId: 'e8', courseId: 'crs-004', certificateCode: 'AWS-SAA-C03-7765', issuedAt: '2025-06-04', expiresAt: '2028-06-04', issuer: 'AWS', status: 'active', validatedById: 'e1' },
  { id: 'cert-004', ref: 'CERT-2026-004', employeeId: 'e6', courseId: 'crs-009', certificateCode: 'HAB-BS-BE-CI-2024-1188', issuedAt: '2024-09-10', expiresAt: '2027-09-10', issuer: 'INSPCT', status: 'active' },
  { id: 'cert-005', ref: 'CERT-2026-005', employeeId: 'e12', courseId: 'crs-009', certificateCode: 'HAB-BS-BE-CI-2024-1192', issuedAt: '2024-09-10', expiresAt: '2027-09-10', issuer: 'INSPCT', status: 'active' },
  { id: 'cert-006', ref: 'CERT-2026-006', employeeId: 'e9', courseId: 'crs-010', certificateCode: 'SST-CRX-2024-882', issuedAt: '2024-07-15', expiresAt: '2026-07-15', issuer: 'Croix-Rouge CI', status: 'pending_renewal' },
  { id: 'cert-007', ref: 'CERT-2026-007', employeeId: 'e12', courseId: 'crs-010', certificateCode: 'SST-CRX-2024-883', issuedAt: '2024-07-15', expiresAt: '2026-07-15', issuer: 'Croix-Rouge CI', status: 'pending_renewal' },
  { id: 'cert-008', ref: 'CERT-2026-008', employeeId: 'e14', courseId: 'crs-019', certificateCode: 'PMP-2024-882491', issuedAt: '2024-12-04', expiresAt: '2027-12-04', issuer: 'PMI', status: 'active' },
  { id: 'cert-009', ref: 'CERT-2026-009', employeeId: 'e6', courseId: 'crs-014', certificateCode: 'IFRS-OEC-2025-A45', issuedAt: '2025-10-22', issuer: 'OEC Abidjan', status: 'active' },
  { id: 'cert-010', ref: 'CERT-2026-010', employeeId: 'e1', courseId: 'crs-019', certificateCode: 'PMP-2023-991122', issuedAt: '2023-05-18', expiresAt: '2026-05-18', issuer: 'PMI', status: 'expired' },
  { id: 'cert-011', ref: 'CERT-2026-011', employeeId: 'e3', courseId: 'crs-023', certificateCode: 'OHADA-ERSUMA-2025-1042', issuedAt: '2025-04-08', issuer: 'ERSUMA', status: 'active' },
  { id: 'cert-012', ref: 'CERT-2026-012', employeeId: 'e5', courseId: 'crs-016', certificateCode: 'PSM-I-2024-D7741', issuedAt: '2024-08-19', issuer: 'Scrum.org', status: 'active' },
  { id: 'cert-013', ref: 'CERT-2026-013', employeeId: 'e11', courseId: 'crs-024', certificateCode: 'VC-MA-2026-001', issuedAt: '2026-03-12', issuer: 'Mercuri Africa', status: 'active', validatedById: 'e13' },
  { id: 'cert-014', ref: 'CERT-2026-014', employeeId: 'e4', courseId: 'crs-024', certificateCode: 'VC-MA-2026-002', issuedAt: '2026-03-12', issuer: 'Mercuri Africa', status: 'active', validatedById: 'e13' },
];

export const certificationsByEmployee = (employeeId: string): Certification[] =>
  CERTIFICATIONS.filter((c) => c.employeeId === employeeId);

export const certificationsExpiringSoon = (): Certification[] => {
  const today = new Date(TODAY).getTime();
  const horizon = today + TRAINING_THRESHOLDS.CERT_EXPIRATION_ALERT_DAYS * 86_400_000;
  return CERTIFICATIONS.filter((c) => {
    if (!c.expiresAt || c.status !== 'active') return c.status === 'pending_renewal';
    const t = new Date(c.expiresAt).getTime();
    return t > today && t < horizon;
  });
};

// ───────────────────────── ROI ─────────────────────────
export const ROI_CALCULATIONS: { sessionId: string; roi: RoiCalculation; narrative: string }[] = [
  { sessionId: 'ses-11',
    roi: { totalCost: 2_160_000, estimatedGain12m: 9_800_000, roi: 3.54, method: 'Phillips', paybackMonths: 4 },
    narrative: 'Hausse panier moyen +18 % sur les 3 commerciaux formés (Q1 2026 vs Q4 2025).' },
  { sessionId: 'ses-10',
    roi: { totalCost: 3_200_000, estimatedGain12m: 6_400_000, roi: 1.0, method: 'Productivity_Delta', paybackMonths: 12 },
    narrative: 'Réduction temps de cadrage produit -22 % sur les 4 PM/Designers.' },
  { sessionId: 'ses-13',
    roi: { totalCost: 950_000, estimatedGain12m: 4_750_000, roi: 4.0, method: 'Kirkpatrick_L4', paybackMonths: 3 },
    narrative: 'Décision stratégique « lancement Mali » accélérée de 3 mois.' },
  { sessionId: 'ses-03',
    roi: { totalCost: 2_160_000, estimatedGain12m: 7_800_000, roi: 2.61, method: 'Productivity_Delta', paybackMonths: 4 },
    narrative: 'Réduction bugs TS -38 %, accélération onboarding tech.' },
];

// ───────────────────────── FDFP DECLARATIONS ─────────────────────────
export const FDFP_DECLARATIONS: FdfpDeclaration[] = [
  { id: 'fdfp-001', ref: 'FDFP-CI-2026-Q1', countryCode: 'CI', year: 2026, quarter: 1, status: 'reimbursed',
    sessionsCount: 6, hoursTotal: 86, beneficiariesCount: 14, costDeclared: 3_140_000, rebateExpected: 1_884_000, rebateReceived: 1_884_000,
    submittedAt: '2026-04-08', reimbursedAt: '2026-05-20' },
  { id: 'fdfp-002', ref: 'FDFP-CI-2026-Q2', countryCode: 'CI', year: 2026, quarter: 2, status: 'under_review',
    sessionsCount: 4, hoursTotal: 95, beneficiariesCount: 17, costDeclared: 12_180_000, rebateExpected: 7_308_000,
    submittedAt: '2026-05-12' },
  { id: 'fdfp-003', ref: '3FPT-SN-2026-Q1', countryCode: 'SN', year: 2026, quarter: 1, status: 'submitted',
    sessionsCount: 2, hoursTotal: 35, beneficiariesCount: 9, costDeclared: 4_320_000, rebateExpected: 2_160_000,
    submittedAt: '2026-05-04' },
  { id: 'fdfp-004', ref: 'FDFP-CI-2025-Q4', countryCode: 'CI', year: 2025, quarter: 4, status: 'reimbursed',
    sessionsCount: 5, hoursTotal: 78, beneficiariesCount: 11, costDeclared: 2_640_000, rebateExpected: 1_584_000, rebateReceived: 1_584_000,
    submittedAt: '2026-01-20', reimbursedAt: '2026-03-08' },
];

// ───────────────────────── SKILL UPLIFT ─────────────────────────
export const SKILL_UPLIFTS: SkillUpliftEntry[] = [
  { employeeId: 'e2',  skillCode: 'TECH-TS',     preLevel: 3, postLevel: 4, acquiredViaSessionId: 'ses-03', acquiredAt: '2026-02-11' },
  { employeeId: 'e5',  skillCode: 'TECH-TS',     preLevel: 2, postLevel: 3, acquiredViaSessionId: 'ses-03', acquiredAt: '2026-02-11' },
  { employeeId: 'e8',  skillCode: 'TECH-TS',     preLevel: 3, postLevel: 4, acquiredViaSessionId: 'ses-03', acquiredAt: '2026-02-11' },
  { employeeId: 'e10', skillCode: 'TECH-TS',     preLevel: 2, postLevel: 3, acquiredViaSessionId: 'ses-03', acquiredAt: '2026-02-11' },
  { employeeId: 'e3',  skillCode: 'LNG-EN',      preLevel: 3, postLevel: 4, acquiredViaSessionId: 'ses-04', acquiredAt: ymd('2026-05-20') },
  { employeeId: 'e14', skillCode: 'LNG-EN',      preLevel: 3, postLevel: 4, acquiredViaSessionId: 'ses-04', acquiredAt: ymd('2026-05-20') },
  { employeeId: 'e4',  skillCode: 'COM-CONS',    preLevel: 2, postLevel: 3, acquiredViaSessionId: 'ses-11', acquiredAt: '2026-02-28' },
  { employeeId: 'e11', skillCode: 'COM-CONS',    preLevel: 1, postLevel: 3, acquiredViaSessionId: 'ses-11', acquiredAt: '2026-02-28' },
  { employeeId: 'e2',  skillCode: 'SS-DT',       preLevel: 2, postLevel: 3, acquiredViaSessionId: 'ses-10', acquiredAt: '2026-03-13' },
  { employeeId: 'e5',  skillCode: 'SS-DT',       preLevel: 3, postLevel: 4, acquiredViaSessionId: 'ses-10', acquiredAt: '2026-03-13' },
  { employeeId: 'e14', skillCode: 'SS-DT',       preLevel: 3, postLevel: 4, acquiredViaSessionId: 'ses-10', acquiredAt: '2026-03-13' },
  { employeeId: 'e1',  skillCode: 'LEAD-EQ',     preLevel: 3, postLevel: 4, acquiredViaSessionId: 'ses-13', acquiredAt: ymd('2026-05-20') },
];

// ───────────────────────── KPIs ─────────────────────────
const beneficiairesYTD = new Set(REGISTRATIONS.filter((r) => r.status === 'completed' || r.status === 'attended' || r.status === 'partial').map((r) => r.employeeId)).size;
const totalReactionScores = REGISTRATIONS.filter((r) => typeof r.reactionScore === 'number').map((r) => r.reactionScore!);
const avgReaction = totalReactionScores.length ? totalReactionScores.reduce((a, b) => a + b, 0) / totalReactionScores.length : 0;
const totalLearningScores = REGISTRATIONS.filter((r) => typeof r.learningScore === 'number').map((r) => r.learningScore!);
const avgLearning = totalLearningScores.length ? totalLearningScores.reduce((a, b) => a + b, 0) / totalLearningScores.length : 0;
const sumHours = REGISTRATIONS.filter((r) => typeof r.attendedHours === 'number').reduce((s, r) => s + (r.attendedHours ?? 0), 0);
const transferL3 = (() => {
  const l3 = KIRKPATRICK_EVALS.filter((k) => k.level === 3 && k.status === 'in_progress' && typeof k.aggregateScore === 'number');
  if (!l3.length) return 0;
  return l3.reduce((s, k) => s + (k.aggregateScore! / 5), 0) / l3.length;
})();
const avgRoi = ROI_CALCULATIONS.length ? ROI_CALCULATIONS.reduce((s, r) => s + r.roi.roi, 0) / ROI_CALCULATIONS.length : 0;
const upcomingSessions = SESSIONS.filter((s) => {
  const first = s.days[0]?.date;
  if (!first) return false;
  const t = new Date(first).getTime();
  return t > new Date(TODAY).getTime() && t < new Date(TODAY).getTime() + 30 * 86_400_000;
}).length;

export const FORMATION_KPI: FormationKPI = {
  beneficiairesYTD,
  tauxAcces: beneficiairesYTD / EMPLOYEES.length,
  heuresMoyennesParCollab: Math.round((sumHours / EMPLOYEES.length) * 10) / 10,
  budgetConsomme: PLAN_2026.budgetConsumed,
  budgetTotal: PLAN_2026.budgetEnvelope,
  satisfactionMoyenneL1: Math.round(avgReaction * 100) / 100,
  acquisMoyenL2: Math.round(avgLearning),
  transfertL3: Math.round(transferL3 * 100) / 100,
  roiMoyen: Math.round(avgRoi * 100) / 100,
  certificationsActives: CERTIFICATIONS.filter((c) => c.status === 'active').length,
  certificationsExpirantes30j: certificationsExpiringSoon().length,
  sessionsPlanifiees30j: upcomingSessions,
  fdfpRecuperableYTD: FDFP_DECLARATIONS.filter((d) => d.year === 2026).reduce((s, d) => s + d.rebateExpected, 0),
};
