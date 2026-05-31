/**
 * M5 RECRUTEMENT — données démo seedées.
 * 8 postes (4 ouverts, 1 en pause, 1 brouillon, 2 fermés), ~30 candidats avec
 * applications réparties sur tout le pipeline, entretiens prévus cette semaine,
 * scorecards, offres actives, cooptations.
 */
import { PIPELINE_STAGES, SOURCING_DEFAULTS, INTERVIEW_TYPES, REJECTION_REASONS } from './referentiels';
import type {
  JobPosting, Candidate, Application, ApplicationStage, Interview, Scorecard,
  Offer, SourcingChannel, Referral, ActivityEvent, RecrutKPI,
} from './types';

const TODAY = new Date('2026-05-30');
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const plusDays = (s: string, n: number) => { const d = new Date(s); d.setDate(d.getDate() + n); return ymd(d); };
const plusHours = (s: string, n: number) => { const d = new Date(s); d.setHours(d.getHours() + n); return d.toISOString(); };
const diffDays = (a: string, b = ymd(TODAY)) => Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);

// ───────────────────────────────────────── POSTES (8)
export const JOBS: JobPosting[] = [
  {
    id: 'job-001', ref: 'JOB-2026-0001', title: 'Senior Backend Engineer (Node/Go)',
    department: 'Technologie', location: 'Plateau Innovation, Abidjan', countryCode: 'CI',
    contractType: 'CDI', level: 'senior', salaryRangeMin: 1_400_000, salaryRangeMax: 1_900_000,
    status: 'open', openedAt: '2026-04-12', targetCloseAt: '2026-06-30',
    hiringManager: 'e2', recruiter: 'e7',
    summary: 'Renforcement de l\'équipe back-end · architecture distribuée · scale Atlas Studio',
    responsibilities: ['Concevoir et faire évoluer les services backend', 'Participer aux revues d\'architecture', 'Coacher les juniors', 'Astreintes ponctuelles'],
    requirements: ['5+ ans Node.js / Go', 'Postgres avancé', 'Distribué (queues, caches)', 'Anglais professionnel'],
    perks: ['Télétravail 2 j/sem', 'Formation 5 % du salaire', 'Mutuelle premium', 'Coopération internationale'],
    publishedChannels: ['LINKEDIN', 'WTTJ', 'EMPLOI_CI', 'COOPTATION'],
    applicationsCount: 47, remoteAllowed: true, cooptationBonus: 350_000,
  },
  {
    id: 'job-002', ref: 'JOB-2026-0002', title: 'Product Designer Senior',
    department: 'Technologie', location: 'Plateau Innovation, Abidjan', countryCode: 'CI',
    contractType: 'CDI', level: 'senior', salaryRangeMin: 1_100_000, salaryRangeMax: 1_500_000,
    status: 'open', openedAt: '2026-04-25', targetCloseAt: '2026-07-15',
    hiringManager: 'e5', recruiter: 'e7',
    summary: 'Designer produit confirmé pour piloter le design system Atlas',
    responsibilities: ['Piloter design system', 'UX research / wireframes', 'Prototypage haute fidélité', 'Collaborer Engineering'],
    requirements: ['5+ ans en SaaS', 'Figma expert', 'UX research méthodes', 'Portfolio solide'],
    perks: ['Télétravail 2 j/sem', 'Conférences design', 'Hardware premium'],
    publishedChannels: ['LINKEDIN', 'WTTJ', 'COOPTATION'],
    applicationsCount: 28, remoteAllowed: true, cooptationBonus: 300_000,
  },
  {
    id: 'job-003', ref: 'JOB-2026-0003', title: 'Commercial Comptes Stratégiques',
    department: 'Ventes', location: 'Marcory, Abidjan', countryCode: 'CI',
    contractType: 'CDI', level: 'senior', salaryRangeMin: 900_000, salaryRangeMax: 1_300_000,
    status: 'open', openedAt: '2026-05-02', targetCloseAt: '2026-07-30',
    hiringManager: 'e4', recruiter: 'e7',
    summary: 'Account Executive pour clients Tier 1 UEMOA · objectif 800M FCFA pipeline',
    responsibilities: ['Gestion grands comptes', 'Pipeline et closing', 'Présentations C-level', 'Voyages UEMOA'],
    requirements: ['7+ ans BtoB SaaS', 'Réseau Afrique francophone', 'Anglais courant', 'Permis B'],
    perks: ['Commissions déplafonnées', 'Véhicule de fonction', 'Mutuelle premium'],
    publishedChannels: ['LINKEDIN', 'COOPTATION', 'AGENCY_LOCAL'],
    applicationsCount: 19, remoteAllowed: false, cooptationBonus: 500_000,
  },
  {
    id: 'job-004', ref: 'JOB-2026-0004', title: 'Chargé(e) de paie SN',
    department: 'Finance', location: 'Dakar Plateau', countryCode: 'SN',
    contractType: 'CDI', level: 'confirme', salaryRangeMin: 750_000, salaryRangeMax: 1_000_000,
    status: 'open', openedAt: '2026-05-08', targetCloseAt: '2026-07-22',
    hiringManager: 'e3', recruiter: 'e7',
    summary: 'Production paie filiale Sénégal · 60 paies / mois · CCN Commerce SN',
    responsibilities: ['Saisie variables paie', 'Génération bulletins', 'DSN équivalents IPRES', 'Réponses collaborateurs'],
    requirements: ['3+ ans paie Sénégal', 'CCN Commerce SN', 'Sage Paie ou équivalent'],
    perks: ['Mutuelle', 'Tickets restaurant', 'Formation FDFP'],
    publishedChannels: ['LINKEDIN', 'SENJOB', 'ANPE_LIKE'],
    applicationsCount: 14, remoteAllowed: false, cooptationBonus: 200_000,
  },
  {
    id: 'job-005', ref: 'JOB-2026-0005', title: 'Data Engineer',
    department: 'Technologie', location: 'Plateau Innovation, Abidjan', countryCode: 'CI',
    contractType: 'CDI', level: 'confirme', salaryRangeMin: 1_100_000, salaryRangeMax: 1_500_000,
    status: 'on_hold', openedAt: '2026-03-20', targetCloseAt: '2026-06-01',
    hiringManager: 'e2', recruiter: 'e7',
    summary: 'Pipeline data Atlas — temporairement en pause (validation budget)',
    responsibilities: ['Pipelines Airflow/Spark', 'Modélisation data warehouse', 'Qualité données'],
    requirements: ['3+ ans data engineering', 'Python / SQL avancé', 'Cloud (GCP ou AWS)'],
    perks: ['Télétravail 2 j', 'Mutuelle premium'],
    publishedChannels: ['LINKEDIN'],
    applicationsCount: 22, remoteAllowed: true,
  },
  {
    id: 'job-006', ref: 'JOB-2026-0006', title: 'DRH Adjoint(e)',
    department: 'Ressources Humaines', location: 'Direction Générale Cocody', countryCode: 'CI',
    contractType: 'CDI', level: 'manager', salaryRangeMin: 1_600_000, salaryRangeMax: 2_200_000,
    status: 'draft', openedAt: '2026-05-25',
    hiringManager: 'e1', recruiter: 'e7',
    summary: 'Bras droit DRH · pilotage paie/admin RH/disciplinaire',
    responsibilities: ['Pilotage opérationnel équipe RH', 'Conformité OHADA', 'Relations sociales'],
    requirements: ['10+ ans RH', 'Maîtrise OHADA', 'Master RH ou Droit social'],
    perks: ['Package complet', 'Bonus annuel'],
    publishedChannels: [],
    applicationsCount: 0, remoteAllowed: false,
  },
  {
    id: 'job-007', ref: 'JOB-2026-0007', title: 'Office Manager (remplacement congé mat.)',
    department: 'Opérations', location: 'Dakar Plateau', countryCode: 'SN',
    contractType: 'CDD', level: 'confirme', salaryRangeMin: 480_000, salaryRangeMax: 600_000,
    status: 'closed_filled', openedAt: '2026-02-10', closedAt: '2026-04-15', targetCloseAt: '2026-04-15',
    hiringManager: 'e3', recruiter: 'e7',
    summary: 'CDD 8 mois remplacement Khady Ndiaye (congé maternité)',
    responsibilities: ['Coordination bureau Dakar', 'Achats fournitures', 'Accueil'],
    requirements: ['2+ ans office management', 'Bilingue FR/EN'],
    perks: ['Tickets restaurant'],
    publishedChannels: ['LINKEDIN', 'SENJOB'],
    applicationsCount: 36, remoteAllowed: false,
  },
  {
    id: 'job-008', ref: 'JOB-2026-0008', title: 'Stagiaire Marketing Digital',
    department: 'Ventes', location: 'Plateau Innovation, Abidjan', countryCode: 'CI',
    contractType: 'STAGE', level: 'junior', salaryRangeMin: 120_000, salaryRangeMax: 150_000,
    status: 'open', openedAt: '2026-05-15', targetCloseAt: '2026-06-30',
    hiringManager: 'e13', recruiter: 'e7',
    summary: 'Stage 6 mois · contenu, growth, SEO',
    responsibilities: ['Création contenus social media', 'SEO articles blog', 'Reporting Google Analytics'],
    requirements: ['Bac+3 marketing / digital', 'Curiosité, écriture', 'Adobe ou Figma'],
    perks: ['Indemnité de stage', 'Coopté CDI possible'],
    publishedChannels: ['INPHB', 'ESATIC', 'CAREER_SITE'],
    applicationsCount: 52, remoteAllowed: false,
  },
];

export const jobById = (id: string) => JOBS.find((j) => j.id === id);

// ───────────────────────────────────────── CANDIDATS (32)
function candidate(
  id: string, firstName: string, lastName: string, role: string, company: string,
  yearsExp: number, country: 'CI' | 'SN' | 'ML' | 'BF', source: string,
  skills: string[], opts: Partial<Candidate> = {},
): Candidate {
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mail.demo`;
  return {
    id, anonRef: `CDT-2026-${id.replace('c', '').padStart(4, '0')}`,
    firstName, lastName, email, currentRole: role, currentCompany: company,
    location: country === 'CI' ? 'Abidjan' : country === 'SN' ? 'Dakar' : country === 'ML' ? 'Bamako' : 'Ouagadougou',
    countryCode: country,
    expectedSalaryMin: 800_000 + yearsExp * 80_000,
    expectedSalaryMax: 1_100_000 + yearsExp * 100_000,
    availability: yearsExp >= 5 ? '2 mois (préavis)' : '1 mois',
    yearsExperience: yearsExp, skills, tags: [],
    source, rgpdConsent: true,
    rgpdConsentAt: '2026-04-10', rgpdRetentionUntil: '2028-04-10',
    ...opts,
  };
}

export const CANDIDATES: Candidate[] = [
  // Backend senior (job-001)
  candidate('c01', 'Aïcha', 'Bamba', 'Senior Backend', 'Wave', 6, 'CI', 'LINKEDIN', ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'AWS'], { tags: ['top-tier'] }),
  candidate('c02', 'Ousmane', 'Tall', 'Lead Backend', 'Orange CI', 8, 'CI', 'COOPTATION', ['Go', 'Kafka', 'gRPC', 'Kubernetes'], { referrerEmployeeId: 'e2', tags: ['cooptation'] }),
  candidate('c03', 'Émilie', 'Kouassi', 'Senior Engineer', 'Jumia', 5, 'CI', 'WTTJ', ['Node.js', 'NestJS', 'TypeORM', 'GCP']),
  candidate('c04', 'Yannick', 'Kouadio', 'Backend Engineer', 'MTN', 4, 'CI', 'LINKEDIN', ['Java', 'Spring Boot', 'PostgreSQL']),
  candidate('c05', 'Mariama', 'Sarr', 'Software Engineer', 'Yengo', 5, 'SN', 'LINKEDIN', ['Node.js', 'TypeScript', 'MongoDB']),
  candidate('c06', 'Hervé', 'Yapo', 'Tech Lead', 'Sama Money', 9, 'CI', 'AGENCY_LOCAL', ['Go', 'Distributed systems', 'AWS', 'Architecture']),

  // Product Designer (job-002)
  candidate('c07', 'Aminata', 'Diop', 'Senior Designer', 'Wave', 6, 'SN', 'LINKEDIN', ['Figma', 'Design systems', 'UX research'], { tags: ['top-tier'] }),
  candidate('c08', 'Pierre', 'Achiepo', 'Product Designer', 'Jumia', 4, 'CI', 'WTTJ', ['Figma', 'Prototyping', 'User testing']),
  candidate('c09', 'Salimata', 'Touré', 'UX Lead', 'Free Sénégal', 7, 'SN', 'LINKEDIN', ['Design systems', 'UX strategy', 'Workshops']),
  candidate('c10', 'Désiré', 'Bah', 'UI/UX Designer', 'Onepoint', 5, 'CI', 'COOPTATION', ['Figma', 'Webflow', 'Prototyping'], { referrerEmployeeId: 'e5' }),

  // Commercial (job-003)
  candidate('c11', 'Karim', 'Touré', 'Account Manager Senior', 'Orange B2B', 8, 'CI', 'LINKEDIN', ['BtoB SaaS', 'Closing', 'Comptes stratégiques']),
  candidate('c12', 'Sylvie', 'N\'Guessan', 'Sales Manager', 'Atlantique Bank', 9, 'CI', 'AGENCY_LOCAL', ['BtoB', 'Banque', 'Closing C-level']),
  candidate('c13', 'Adama', 'Coulibaly', 'Key Account Director', 'Société Générale', 11, 'CI', 'LINKEDIN', ['Grands comptes', 'Pipeline', 'CRM Salesforce'], { tags: ['top-tier'] }),
  candidate('c14', 'Mireille', 'Konaté', 'Account Executive', 'Wave', 6, 'ML', 'LINKEDIN', ['SaaS', 'PME', 'Closing']),

  // Paie SN (job-004)
  candidate('c15', 'Awa', 'Ndour', 'Gestionnaire paie', 'Sonatel', 4, 'SN', 'SENJOB', ['Sage Paie', 'IPRES', 'CSS']),
  candidate('c16', 'Modibo', 'Sow', 'Payroll Specialist', 'Diamond Bank', 5, 'SN', 'ANPE_LIKE', ['Paie SN', 'IPRES', 'DSN']),
  candidate('c17', 'Fatim', 'Faye', 'Chargée paie', 'Free', 3, 'SN', 'LINKEDIN', ['Paie multi-pays', 'Sage', 'Excel avancé']),

  // Stagiaire Marketing (job-008)
  candidate('c18', 'Ange', 'Tagro', 'Étudiante M2 Marketing', 'INP-HB', 0, 'CI', 'INPHB', ['Social media', 'SEO', 'Canva']),
  candidate('c19', 'Brice', 'Konan', 'Étudiant Bac+4', 'ESATIC', 0, 'CI', 'ESATIC', ['Adobe', 'Vidéo', 'Copywriting']),
  candidate('c20', 'Aurélie', 'Adou', 'Stagiaire fin d\'études', 'INP-HB', 0, 'CI', 'INPHB', ['SEO', 'Google Analytics', 'WordPress']),
  candidate('c21', 'Aboubacar', 'Sidibé', 'Étudiant marketing digital', 'Atlantique UNI', 0, 'CI', 'CAREER_SITE', ['Social ads', 'Figma']),

  // Office Manager (job-007, closed)
  candidate('c22', 'Khadija', 'Diallo', 'Office Manager', 'KPMG', 5, 'SN', 'SENJOB', ['Coordination', 'Achats', 'Bilingue'], { tags: ['hired'] }),
  candidate('c23', 'Astou', 'Sène', 'Assistante direction', 'Sonatel', 4, 'SN', 'LINKEDIN', ['Administration', 'EN']),
  candidate('c24', 'Cheikh', 'Mbaye', 'Office Coordinator', 'Wave', 3, 'SN', 'LINKEDIN', ['Office', 'Bilingue']),

  // Data Engineer (job-005, on hold)
  candidate('c25', 'Bakary', 'Camara', 'Data Engineer', 'BCEAO', 4, 'CI', 'LINKEDIN', ['Python', 'Airflow', 'BigQuery']),
  candidate('c26', 'Aïssata', 'Soumah', 'Data Engineer', 'Jumia', 3, 'CI', 'LINKEDIN', ['Spark', 'Snowflake', 'dbt']),

  // Vivier hors-poste
  candidate('c27', 'Rahmatou', 'Barry', 'Senior PM', 'Ecobank', 8, 'CI', 'LINKEDIN', ['Product', 'Stratégie', 'Scrum'], { tags: ['vivier-future-leaders'] }),
  candidate('c28', 'Joël', 'Boudou', 'CTO', 'Healthtech', 12, 'CI', 'COOPTATION', ['Tech leadership', 'Architecture'], { referrerEmployeeId: 'e1', tags: ['vivier-top-tech'] }),
  candidate('c29', 'Maïmouna', 'Niang', 'Head of People', 'Yengo', 9, 'SN', 'LINKEDIN', ['RH stratégie', 'Internationale'], { tags: ['vivier-future-leaders'] }),
  candidate('c30', 'Christian', 'N\'Guessan', 'Designer Lead', 'Vodacom', 8, 'CI', 'WTTJ', ['Design systems', 'Leadership'], { tags: ['vivier-design'] }),
  candidate('c31', 'Sophie', 'Adjéi', 'Marketing Director', 'Total', 10, 'CI', 'LINKEDIN', ['B2B Marketing', 'Stratégie'], { tags: ['vivier-future-leaders'] }),
  candidate('c32', 'Ibrahima', 'Ba', 'CFO', 'Fintech YC', 14, 'SN', 'COOPTATION', ['Finance', 'Fundraising'], { referrerEmployeeId: 'e1', tags: ['vivier-c-level'] }),
];
export const candidateById = (id: string) => CANDIDATES.find((c) => c.id === id);

// ───────────────────────────────────────── APPLICATIONS
type App = Application;
function app(id: string, candidateId: string, jobId: string, stage: ApplicationStage, daysAgo: number, score?: number, extra: Partial<App> = {}): App {
  const stageEnteredAt = plusDays(ymd(TODAY), -daysAgo);
  return {
    id, ref: `APP-2026-${id.replace('a', '').padStart(4, '0')}`,
    candidateId, jobId, stage, stageEnteredAt,
    appliedAt: plusDays(stageEnteredAt, -Math.max(2, daysAgo * 2)),
    score, lastActivityAt: plusDays(stageEnteredAt, 1), ...extra,
  };
}

export const APPLICATIONS: Application[] = [
  // job-001 Backend Senior — pipeline complet
  app('a01', 'c01', 'job-001', 'interview',  8,  85),
  app('a02', 'c02', 'job-001', 'offer',      3,  92),   // cooptation Ousmane Tall
  app('a03', 'c03', 'job-001', 'screening',  12, 72),
  app('a04', 'c04', 'job-001', 'applied',    2,  64),
  app('a05', 'c05', 'job-001', 'rejected',   20, 58, { rejectionReasonCode: 'EXPERIENCE' }),
  app('a06', 'c06', 'job-001', 'interview',  6,  88),

  // job-002 Product Designer
  app('a07', 'c07', 'job-002', 'assessment', 5,  90, { notes: 'Excellente posture · cas Atlas DS' }),
  app('a08', 'c08', 'job-002', 'interview',  10, 75),
  app('a09', 'c09', 'job-002', 'offer',      2,  88),
  app('a10', 'c10', 'job-002', 'screening',  6,  70),

  // job-003 Commercial
  app('a11', 'c11', 'job-003', 'interview',  9,  82),
  app('a12', 'c12', 'job-003', 'screening',  4,  78),
  app('a13', 'c13', 'job-003', 'assessment', 7,  91, { notes: 'Top tier — réseau exceptionnel' }),
  app('a14', 'c14', 'job-003', 'applied',    1,  65),

  // job-004 Paie SN
  app('a15', 'c15', 'job-004', 'interview',  5,  78),
  app('a16', 'c16', 'job-004', 'screening',  3,  70),
  app('a17', 'c17', 'job-004', 'applied',    1,  62),

  // job-005 Data Engineer (on hold)
  app('a18', 'c25', 'job-005', 'sourced',    14, 68),
  app('a19', 'c26', 'job-005', 'sourced',    10, 66),

  // job-007 Office Manager — clôturé, embauchée Khadija
  app('a20', 'c22', 'job-007', 'hired',      45, 80, { hiredAt: '2026-04-15' }),
  app('a21', 'c23', 'job-007', 'rejected',   60, 65, { rejectionReasonCode: 'CULTURE_FIT' }),
  app('a22', 'c24', 'job-007', 'rejected',   55, 62, { rejectionReasonCode: 'OTHER_OFFER' }),

  // job-008 Stage Marketing
  app('a23', 'c18', 'job-008', 'interview',  4,  76),
  app('a24', 'c19', 'job-008', 'applied',    1,  70),
  app('a25', 'c20', 'job-008', 'screening',  3,  74),
  app('a26', 'c21', 'job-008', 'applied',    1,  68),
];
export const appById = (id: string) => APPLICATIONS.find((a) => a.id === id);
export const applicationsByJob = (jobId: string) => APPLICATIONS.filter((a) => a.jobId === jobId);
export const applicationsByCandidate = (cid: string) => APPLICATIONS.filter((a) => a.candidateId === cid);

// ───────────────────────────────────────── ENTRETIENS
function iv(id: string, applicationId: string, type: Interview['type'], hoursAhead: number, status: Interview['status'] = 'planned', mode: Interview['mode'] = 'visio'): Interview {
  const t = INTERVIEW_TYPES.find((i) => i.code === type)!;
  return {
    id, ref: `INT-2026-${id.replace('i', '').padStart(4, '0')}`,
    applicationId, type, mode, scheduledAt: plusHours(TODAY.toISOString(), hoursAhead),
    durationMin: t.defaultDuration,
    location: mode === 'visio' ? 'Google Meet' : 'Plateau Innovation',
    participants: [
      { employeeId: 'e7', role: 'Recruteur' },
      { employeeId: 'e2', role: 'Hiring manager' },
    ],
    status,
  };
}

export const INTERVIEWS: Interview[] = [
  // Today & this week
  iv('i01', 'a01', 'manager', 4),
  iv('i02', 'a06', 'tech', 26),
  iv('i03', 'a08', 'team', 50),
  iv('i04', 'a11', 'manager', 28),
  iv('i05', 'a15', 'phone_screen', 6, 'planned', 'phone'),
  iv('i06', 'a23', 'manager', 72),

  // Recent past (completed)
  iv('i07', 'a02', 'final', -72, 'completed'),
  iv('i08', 'a02', 'tech', -120, 'completed'),
  iv('i09', 'a01', 'phone_screen', -160, 'completed'),
  iv('i10', 'a07', 'tech', -48, 'completed'),
  iv('i11', 'a09', 'final', -24, 'completed'),
  iv('i12', 'a13', 'culture', -96, 'completed'),

  // No-show
  iv('i13', 'a04', 'phone_screen', -200, 'no_show'),
];
export const interviewById = (id: string) => INTERVIEWS.find((i) => i.id === id);
export const interviewsByApp = (appId: string) => INTERVIEWS.filter((i) => i.applicationId === appId);

// ───────────────────────────────────────── SCORECARDS
function sc(id: string, interviewId: string, applicationId: string, interviewerEmployeeId: string, rec: Scorecard['recommendation'], overall: number, criteria: Scorecard['criteria'], strengths?: string, concerns?: string): Scorecard {
  const submittedAt = plusDays(ymd(TODAY), -2);
  return { id, interviewId, applicationId, interviewerEmployeeId, submittedAt: submittedAt + 'T17:00:00Z', criteria, overall, recommendation: rec, strengths, concerns };
}

export const SCORECARDS: Scorecard[] = [
  sc('s01', 'i08', 'a02', 'e2', 'strong_yes', 4.8,
    [{ name: 'Compétences techniques', score: 5 }, { name: 'Résolution de problèmes', score: 5 }, { name: 'Architecture', score: 5 }, { name: 'Communication', score: 4 }],
    'Excellent niveau Go · vision distribuée · culture Atlas alignée',
    'Disponibilité 2 mois préavis'),
  sc('s02', 'i07', 'a02', 'e1', 'strong_yes', 4.5,
    [{ name: 'Vision', score: 5 }, { name: 'Leadership', score: 4 }, { name: 'Culture fit', score: 5 }, { name: 'Motivation', score: 5 }],
    'Top tier · candidat à fidéliser', undefined),
  sc('s03', 'i10', 'a07', 'e5', 'yes', 4.2,
    [{ name: 'Figma expert', score: 5 }, { name: 'Design systems', score: 4 }, { name: 'UX research', score: 4 }, { name: 'Communication', score: 4 }],
    'Portfolio solide · cas Atlas DS très propre', 'Salary cap proche du max'),
  sc('s04', 'i11', 'a09', 'e1', 'yes', 4.0,
    [{ name: 'UX strategy', score: 4 }, { name: 'Workshops', score: 5 }, { name: 'Culture fit', score: 4 }, { name: 'Vision', score: 3 }],
    'Forte en facilitation', 'Vision produit à renforcer'),
  sc('s05', 'i12', 'a13', 'e1', 'strong_yes', 4.9,
    [{ name: 'Compte stratégique', score: 5 }, { name: 'Closing C-level', score: 5 }, { name: 'Réseau', score: 5 }, { name: 'Culture', score: 4 }],
    'Réseau exceptionnel UEMOA · closer prouvé', undefined),
];
export const scorecardsByApp = (appId: string) => SCORECARDS.filter((s) => s.applicationId === appId);

// ───────────────────────────────────────── OFFRES
export const OFFERS: Offer[] = [
  {
    id: 'off-01', ref: 'OFF-2026-0001', applicationId: 'a02', status: 'sent',
    contractType: 'CDI', baseSalary: 1_750_000, allowancesTotal: 250_000, totalPackage: (1_750_000 + 250_000) * 12,
    startDate: '2026-08-01', draftAt: '2026-05-25', sentAt: '2026-05-27',
    validUntil: '2026-06-10', signatureWorkflow: 'advist_employee_pending',
  },
  {
    id: 'off-02', ref: 'OFF-2026-0002', applicationId: 'a09', status: 'negotiating',
    contractType: 'CDI', baseSalary: 1_400_000, allowancesTotal: 150_000, totalPackage: (1_400_000 + 150_000) * 12,
    startDate: '2026-07-15', draftAt: '2026-05-22', sentAt: '2026-05-24',
    validUntil: '2026-06-07',
  },
  {
    id: 'off-03', ref: 'OFF-2025-0042', applicationId: 'a20', status: 'accepted',
    contractType: 'CDD', baseSalary: 560_000, allowancesTotal: 80_000, totalPackage: (560_000 + 80_000) * 8,
    startDate: '2026-04-15', draftAt: '2026-04-05', sentAt: '2026-04-07', acceptedAt: '2026-04-09',
    validUntil: '2026-04-20', signatureWorkflow: 'advist_signed_both',
  },
];
export const offerByApp = (appId: string) => OFFERS.find((o) => o.applicationId === appId);

// ───────────────────────────────────────── CANAUX SOURCING (perfs 12 mois)
export const SOURCING_CHANNELS: SourcingChannel[] = SOURCING_DEFAULTS.map((c) => {
  const apps12m = APPLICATIONS.filter((a) => CANDIDATES.find((cc) => cc.id === a.candidateId)?.source === c.code).length * 6;
  const hires12m = c.code === 'LINKEDIN' ? 3 : c.code === 'COOPTATION' ? 4 : c.code === 'WTTJ' ? 1 : c.code === 'SENJOB' ? 1 : c.code === 'INPHB' ? 2 : 0;
  const cost12m = c.code === 'LINKEDIN' ? 4_800_000 : c.code === 'WTTJ' ? 2_400_000 : c.code === 'INDEED' ? 600_000
    : c.code === 'EMPLOI_CI' ? 200_000 : c.code === 'SENJOB' ? 200_000 : c.code === 'JOBAAZ' ? 150_000
    : c.code === 'AGENCY_LOCAL' ? 3_000_000 : c.code === 'COOPTATION' ? 2_000_000 : c.code === 'JOB_FAIR' ? 800_000 : 0;
  return { code: c.code, name: c.label, type: c.type, cost12m, applications12m: apps12m, hires12m, active: true };
});

// ───────────────────────────────────────── COOPTATION
export const REFERRALS: Referral[] = [
  { id: 'r01', ref: 'REF-2026-001', referrerEmployeeId: 'e2', candidateId: 'c02', jobId: 'job-001', status: 'in_pipeline', submittedAt: '2026-04-20', bonusAmount: 350_000 },
  { id: 'r02', ref: 'REF-2026-002', referrerEmployeeId: 'e5', candidateId: 'c10', jobId: 'job-002', status: 'in_pipeline', submittedAt: '2026-05-05', bonusAmount: 300_000 },
  { id: 'r03', ref: 'REF-2026-003', referrerEmployeeId: 'e1', candidateId: 'c28', jobId: 'job-001', status: 'submitted', submittedAt: '2026-05-15', bonusAmount: 350_000 },
  { id: 'r04', ref: 'REF-2025-014', referrerEmployeeId: 'e1', candidateId: 'c32', jobId: 'job-006', status: 'submitted', submittedAt: '2026-05-28', bonusAmount: 600_000 },
];

// ───────────────────────────────────────── ACTIVITÉ
export const ACTIVITY: ActivityEvent[] = [
  { id: 'ev01', at: '2026-05-28T14:32:00Z', actor: 'Aminata Sow', kind: 'offer_sent',         applicationId: 'a02', candidateId: 'c02', jobId: 'job-001', detail: 'Offre envoyée à Ousmane Tall · 1 750 000 FCFA' },
  { id: 'ev02', at: '2026-05-28T11:05:00Z', actor: 'Awa Koné',     kind: 'scorecard_submitted', applicationId: 'a13', detail: 'Scorecard culture · NON fortement ? Non, OUI fortement' },
  { id: 'ev03', at: '2026-05-27T16:18:00Z', actor: 'Aminata Sow', kind: 'interview_scheduled', applicationId: 'a01', detail: 'Manager interview programmé demain 10h' },
  { id: 'ev04', at: '2026-05-27T10:00:00Z', actor: 'Aminata Sow', kind: 'stage_changed',       applicationId: 'a07', detail: 'Aminata Diop : interview → assessment' },
  { id: 'ev05', at: '2026-05-26T15:42:00Z', actor: 'Kouadio N\'Guessan', kind: 'scorecard_submitted', applicationId: 'a02', detail: 'Scorecard tech · OUI fortement (4.8/5)' },
  { id: 'ev06', at: '2026-05-26T09:15:00Z', actor: 'Aminata Sow', kind: 'application_created', candidateId: 'c14', jobId: 'job-003', detail: 'Nouvelle candidature spontanée' },
  { id: 'ev07', at: '2026-05-25T17:30:00Z', actor: 'Aminata Sow', kind: 'rejected',            applicationId: 'a05', detail: 'Candidature refusée — expérience insuffisante' },
];

// ───────────────────────────────────────── KPIs
export function kpis(): RecrutKPI {
  const openJobs = JOBS.filter((j) => j.status === 'open');
  const inProgressApps = APPLICATIONS.filter((a) => ['sourced','applied','screening','interview','assessment','offer'].includes(a.stage));
  // entretiens cette semaine (7 jours autour de TODAY)
  const interviewsThisWeek = INTERVIEWS.filter((i) => {
    const d = new Date(i.scheduledAt);
    const diff = Math.abs(d.getTime() - TODAY.getTime()) / 86_400_000;
    return diff <= 7 && i.status === 'planned';
  }).length;
  const pendingOffers = OFFERS.filter((o) => o.status === 'sent' || o.status === 'negotiating').length;
  const hiredThisMonth = APPLICATIONS.filter((a) => a.stage === 'hired').length;
  // time-to-fill : closed_filled jobs avg
  const closed = JOBS.filter((j) => j.status === 'closed_filled' && j.closedAt);
  const ttfDays = closed.length ? Math.round(closed.reduce((s, j) => s + diffDays(j.closedAt!, j.openedAt), 0) / closed.length) : 0;
  const acceptedOffers = OFFERS.filter((o) => o.status === 'accepted').length;
  const totalOffersSent = OFFERS.filter((o) => o.status !== 'draft').length;
  return {
    postesOuverts: openJobs.length,
    candidaturesEnCours: inProgressApps.length,
    entretiensSemaine: interviewsThisWeek,
    offresEnAttente: pendingOffers,
    embauchesMoisCourant: hiredThisMonth,
    timeToFillJoursMedian: ttfDays || 38,
    acceptanceRate: totalOffersSent ? Math.round((acceptedOffers / totalOffersSent) * 100) : 0,
    costPerHire: 850_000,
  };
}

// ───────────────────────────────────────── Vivier (talent pool)
export function poolEntries() {
  return CANDIDATES.filter((c) => c.tags.some((t) => t.startsWith('vivier'))).map((c) => ({
    id: `pool-${c.id}`, candidateId: c.id,
    pools: c.tags.filter((t) => t.startsWith('vivier')),
    lastContactAt: plusDays(ymd(TODAY), -Math.floor(Math.random() * 60 + 10)),
    nextFollowupAt: plusDays(ymd(TODAY), 30),
    ownerEmployeeId: 'e7',
  }));
}

// ───────────────────────────────────────── stage helper
export function stageMeta(stage: ApplicationStage) {
  return PIPELINE_STAGES.find((s) => s.code === stage)!;
}

// ───────────────────────────────────────── rejection helper
export function rejectionLabel(code?: string) {
  if (!code) return '—';
  return REJECTION_REASONS.find((r) => r.code === code)?.label ?? code;
}
