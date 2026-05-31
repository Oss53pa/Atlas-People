/**
 * M5 RECRUTEMENT — Besoins de recrutement (amont du pipeline ATS).
 * Point d'entrée du processus : un besoin validé (RRH → DAF → DRH → DG si seuil)
 * débouche sur la création d'une ou plusieurs offres. Réf. spec doc 02.
 */
import type { RecruitmentNeed, NeedValidationStep } from './types';
import { NEED_DG_THRESHOLD } from './referentiels';

const vstep = (
  role: NeedValidationStep['role'], name: string, required: boolean,
  decision: NeedValidationStep['decision'], slaDays: number, decidedAt?: string, comment?: string,
): NeedValidationStep => ({ role, validatorName: name, required, decision, slaDays, decidedAt, comment });

export const RECRUITMENT_NEEDS: RecruitmentNeed[] = [
  {
    id: 'need-001', ref: 'BES-2026-0245', type: 'CREATION', volume: 1, urgency: 'urgent',
    status: 'pending_daf',
    title: 'Chef de Projet Commercial', department: 'Ventes', hiringManagerId: 'e4',
    category: 'Cadre B', echelon: '3', contractType: 'CDI', location: 'Marcory, Abidjan', countryCode: 'CI',
    remotePolicy: 'Hybride 2 j/sem',
    experienceMin: 3, experienceMax: 7, educationMin: 'Bac+5',
    salaryMin: 800_000, salaryMax: 1_100_000, salaryMedian: 950_000, allowancesMonthly: 370_000,
    employerCostMonthly: 1_677_200, recruitmentCost: 1_300_000, budgetYear1: 23_400_000, budgetEnvelope: 'DC-2026',
    idealStartDate: '2026-08-01', latestStartDate: '2026-10-01', forecastStartDate: '2026-12-01',
    createdAt: '2026-05-28', createdById: 'e4',
    motivation: 'Croissance du portefeuille grands comptes UEMOA, besoin de structurer le pilotage commercial.',
    validations: [
      vstep('RRH', 'Fatou Diop', true, 'approved', 3, '2026-05-29', 'Profil cohérent avec la cible.'),
      vstep('DAF', 'Awa Koné', true, 'pending', 3),
      vstep('DRH', 'Fatou Diop', true, 'pending', 3),
      vstep('DG', 'Cheick Diallo', false, 'pending', 5),
    ],
    plannedChannels: ['CAREER_SITE', 'LINKEDIN', 'COOPTATION', 'INDEED'],
  },
  {
    id: 'need-002', ref: 'BES-2026-0246', type: 'REMPLACEMENT', volume: 1, urgency: 'critique',
    status: 'approved',
    title: 'Chargée de recrutement', department: 'Ressources Humaines', hiringManagerId: 'e3',
    category: 'Cadre A', echelon: '2', contractType: 'CDI', location: 'Dakar', countryCode: 'SN',
    replacesEmployeeId: 'e7',
    experienceMin: 2, experienceMax: 5, educationMin: 'Bac+4',
    salaryMin: 550_000, salaryMax: 750_000, salaryMedian: 640_000, allowancesMonthly: 90_000,
    employerCostMonthly: 883_300, recruitmentCost: 700_000, budgetYear1: 11_300_000, budgetEnvelope: 'RH-2026',
    idealStartDate: '2026-06-15', latestStartDate: '2026-07-15', forecastStartDate: '2026-07-01',
    createdAt: '2026-05-22', createdById: 'e3',
    motivation: 'Remplacement suite fin de CDD d\'Aminata Sow (10/06). Continuité de l\'activité sourcing.',
    validations: [
      vstep('RRH', 'Fatou Diop', true, 'approved', 1, '2026-05-23'),
      vstep('DRH', 'Fatou Diop', true, 'approved', 1, '2026-05-24', 'Urgent — départ imminent.'),
      vstep('DG', 'Cheick Diallo', false, 'pending', 3),
    ],
    plannedChannels: ['CAREER_SITE', 'LINKEDIN', 'SENJOB'],
    createdOfferIds: [],
  },
  {
    id: 'need-003', ref: 'BES-2026-0251', type: 'RENFORT', volume: 3, urgency: 'standard',
    status: 'pending_rrh',
    title: 'Customer Success Manager', department: 'Ventes', hiringManagerId: 'e4',
    category: 'Cadre A', echelon: '1', contractType: 'CDI', location: 'Abidjan / Dakar', countryCode: 'CI',
    remotePolicy: 'Hybride',
    experienceMin: 2, experienceMax: 6, educationMin: 'Bac+3',
    salaryMin: 600_000, salaryMax: 850_000, salaryMedian: 720_000, allowancesMonthly: 110_000,
    employerCostMonthly: 1_004_300, recruitmentCost: 900_000, budgetYear1: 41_000_000, budgetEnvelope: 'DC-2026',
    idealStartDate: '2026-09-01', latestStartDate: '2026-11-01',
    createdAt: '2026-05-30', createdById: 'e4',
    motivation: 'Montée en charge du portefeuille clients SaaS — 3 CSM pour couvrir UEMOA + CEMAC.',
    businessCase: 'Objectif : réduire le churn de 18 % à 10 % et porter le NRR à 115 %. ROI estimé +120M FCFA/an.',
    validations: [
      vstep('RRH', 'Fatou Diop', true, 'pending', 3),
      vstep('DAF', 'Awa Koné', true, 'pending', 3),
      vstep('DRH', 'Fatou Diop', true, 'pending', 3),
      vstep('DG', 'Cheick Diallo', true, 'pending', 5, undefined, 'Requise : coût annuel > seuil 50M.'),
    ],
    plannedChannels: ['CAREER_SITE', 'LINKEDIN', 'WTTJ', 'COOPTATION'],
  },
  {
    id: 'need-004', ref: 'BES-2026-0238', type: 'PROJET', volume: 2, urgency: 'urgent',
    status: 'in_progress',
    title: 'Data Analyst (mission Cockpit DRH)', department: 'Technologie', hiringManagerId: 'e2',
    category: 'Cadre A', echelon: '2', contractType: 'CDD', location: 'Plateau Innovation, Abidjan', countryCode: 'CI',
    experienceMin: 1, experienceMax: 4, educationMin: 'Bac+5',
    salaryMin: 700_000, salaryMax: 900_000, salaryMedian: 800_000, allowancesMonthly: 95_000,
    employerCostMonthly: 1_082_950, recruitmentCost: 600_000, budgetYear1: 13_600_000, budgetEnvelope: 'TECH-2026',
    idealStartDate: '2026-07-01', latestStartDate: '2026-08-15', forecastStartDate: '2026-07-15',
    createdAt: '2026-05-05', createdById: 'e2',
    motivation: 'Projet analytique 12 mois — dashboards prédictifs RH. CDD de mission.',
    validations: [
      vstep('RRH', 'Fatou Diop', true, 'approved', 1, '2026-05-06'),
      vstep('DRH', 'Fatou Diop', true, 'approved', 1, '2026-05-07'),
    ],
    plannedChannels: ['CAREER_SITE', 'LINKEDIN', 'INPHB', 'ESATIC'],
    createdOfferIds: ['job-005'],
  },
  {
    id: 'need-005', ref: 'BES-2026-0210', type: 'TRANSFORMATION', volume: 1, urgency: 'standard',
    status: 'rejected',
    title: 'Responsable Marketing Digital', department: 'Ventes', hiringManagerId: 'e13',
    category: 'Cadre B', echelon: '2', contractType: 'CDI', location: 'Dakar', countryCode: 'SN',
    suppressedPositions: ['Marketing Lead (poste actuel)'],
    experienceMin: 5, experienceMax: 9, educationMin: 'Bac+5',
    salaryMin: 950_000, salaryMax: 1_300_000, salaryMedian: 1_120_000, allowancesMonthly: 150_000,
    employerCostMonthly: 1_535_700, recruitmentCost: 1_100_000, budgetYear1: 19_500_000, budgetEnvelope: 'DC-2026',
    idealStartDate: '2026-09-15', latestStartDate: '2026-12-01',
    createdAt: '2026-04-18', createdById: 'e13',
    motivation: 'Transformation du poste Marketing Lead en Responsable Marketing Digital (montée en compétences data).',
    validations: [
      vstep('RRH', 'Fatou Diop', true, 'approved', 3, '2026-04-20'),
      vstep('DAF', 'Awa Koné', true, 'rejected', 3, '2026-04-24', 'Budget DC déjà engagé sur 2 renforts ; à réétudier T3.'),
      vstep('DRH', 'Fatou Diop', true, 'pending', 3),
    ],
    plannedChannels: ['CAREER_SITE', 'LINKEDIN'],
  },
];

export const needById = (id: string) => RECRUITMENT_NEEDS.find((n) => n.id === id);

/** Le besoin requiert-il la validation DG (coût annuel au-dessus du seuil) ? */
export const needRequiresDG = (n: RecruitmentNeed) => n.budgetYear1 > NEED_DG_THRESHOLD;

export interface NeedKPI {
  total: number; enAttente: number; approuves: number; enRecrutement: number;
  postesDemandes: number; budgetTotal: number;
}
export function needKpis(): NeedKPI {
  const pending: RecruitmentNeed['status'][] = ['pending_rrh', 'pending_daf', 'pending_drh', 'pending_dg'];
  return {
    total: RECRUITMENT_NEEDS.length,
    enAttente: RECRUITMENT_NEEDS.filter((n) => pending.includes(n.status)).length,
    approuves: RECRUITMENT_NEEDS.filter((n) => n.status === 'approved').length,
    enRecrutement: RECRUITMENT_NEEDS.filter((n) => n.status === 'in_progress').length,
    postesDemandes: RECRUITMENT_NEEDS
      .filter((n) => !['rejected', 'cancelled', 'closed_no_hire'].includes(n.status))
      .reduce((s, n) => s + n.volume, 0),
    budgetTotal: RECRUITMENT_NEEDS
      .filter((n) => ['approved', 'in_progress', 'hired'].includes(n.status))
      .reduce((s, n) => s + n.budgetYear1, 0),
  };
}
