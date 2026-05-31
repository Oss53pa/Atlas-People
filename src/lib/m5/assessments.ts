/**
 * M5 RECRUTEMENT — Tests & assessments (doc 08), Marque employeur (doc 13),
 * Audit & conformité (doc 16). Données démo seedées.
 */
import type {
  RecruitmentTest, TestPassation, TestCategory,
  CareerSiteSection, Testimonial, EmployerBrandKPI,
  AuditEntry, FraudAlert,
} from './types';

// ───────────────────────────────────────── Tests
export const TEST_CATEGORY_META: Record<TestCategory, { label: string; tone: 'ok' | 'amber' | 'info' | 'warn' | 'neutral' | 'danger' }> = {
  technique:      { label: 'Technique',         tone: 'info'    },
  psychometrique: { label: 'Psychométrique',    tone: 'amber'   },
  cognitif:       { label: 'Cognitif',          tone: 'ok'      },
  mise_situation: { label: 'Mise en situation', tone: 'warn'    },
  langue:         { label: 'Langue',            tone: 'neutral' },
  assessment:     { label: 'Assessment center', tone: 'danger'  },
};

export const RECRUITMENT_TESTS: RecruitmentTest[] = [
  { id: 'test-001', name: 'Test technique Backend (Node/Go)', category: 'technique', description: 'Algorithmie, API REST, SQL, concurrence — exécution sandbox.', durationMin: 90, questionsCount: 12, scoring: 'hybrid', maxScore: 100, passingScore: 60, proctoring: true, copyPasteDisabled: true, tabSwitchDetection: true, passations: 45, avgScore: 68, active: true },
  { id: 'test-002', name: 'Logique numérique', category: 'cognitif', description: 'Raisonnement numérique et séries logiques chronométrées.', durationMin: 30, questionsCount: 25, scoring: 'auto', maxScore: 100, passingScore: 55, proctoring: false, copyPasteDisabled: true, tabSwitchDetection: true, passations: 128, avgScore: 72, active: true },
  { id: 'test-003', name: 'Big Five — personnalité', category: 'psychometrique', description: 'Inventaire de personnalité (OCEAN), profil comportemental.', durationMin: 25, questionsCount: 50, scoring: 'auto', maxScore: 100, passingScore: 0, proctoring: false, copyPasteDisabled: false, tabSwitchDetection: false, passations: 89, active: true },
  { id: 'test-004', name: 'Cas commercial B2B', category: 'mise_situation', description: 'Étude de cas : qualification, négociation, closing grands comptes.', durationMin: 120, questionsCount: 4, scoring: 'manual', maxScore: 100, passingScore: 60, proctoring: false, copyPasteDisabled: false, tabSwitchDetection: false, passations: 23, avgScore: 65, active: true },
  { id: 'test-005', name: 'TOEIC interne EN', category: 'langue', description: 'Compréhension écrite/orale anglais professionnel.', durationMin: 40, questionsCount: 60, scoring: 'auto', maxScore: 990, passingScore: 70, proctoring: true, copyPasteDisabled: true, tabSwitchDetection: true, passations: 67, avgScore: 75, active: true },
  { id: 'test-006', name: 'Assessment center Manager', category: 'assessment', description: 'Journée complète : in-basket, jeu de rôle, présentation, panel.', durationMin: 360, questionsCount: 6, scoring: 'manual', maxScore: 100, passingScore: 65, proctoring: false, copyPasteDisabled: false, tabSwitchDetection: false, passations: 12, avgScore: 71, active: true },
  { id: 'test-007', name: 'Design challenge (Figma)', category: 'technique', description: 'Exercice produit : wireframes + parcours + justification.', durationMin: 120, questionsCount: 3, scoring: 'manual', maxScore: 100, passingScore: 60, proctoring: false, copyPasteDisabled: false, tabSwitchDetection: false, passations: 18, avgScore: 70, active: false },
];

export const testById = (id: string) => RECRUITMENT_TESTS.find((t) => t.id === id);

export const TEST_PASSATIONS: TestPassation[] = [
  { id: 'pas-001', testId: 'test-001', candidateId: 'c02', applicationId: 'a02', status: 'scored',      invitedAt: '2026-05-20', submittedAt: '2026-05-21', score: 82, passed: true },
  { id: 'pas-002', testId: 'test-001', candidateId: 'c14', status: 'scored',      invitedAt: '2026-05-22', submittedAt: '2026-05-23', score: 54, passed: false, flags: ['Changement d\'onglet ×3'] },
  { id: 'pas-003', testId: 'test-002', candidateId: 'c07', status: 'submitted',   invitedAt: '2026-05-26', submittedAt: '2026-05-27' },
  { id: 'pas-004', testId: 'test-005', candidateId: 'c10', status: 'in_progress', invitedAt: '2026-05-28' },
  { id: 'pas-005', testId: 'test-004', candidateId: 'c28', status: 'invited',     invitedAt: '2026-05-29' },
  { id: 'pas-006', testId: 'test-003', candidateId: 'c02', status: 'scored',      invitedAt: '2026-05-19', submittedAt: '2026-05-19', score: 100, passed: true },
];

export interface TestKPI { catalogue: number; actifs: number; passations: number; enCours: number; flagged: number }
export function testKpis(): TestKPI {
  return {
    catalogue: RECRUITMENT_TESTS.length,
    actifs: RECRUITMENT_TESTS.filter((t) => t.active).length,
    passations: RECRUITMENT_TESTS.reduce((s, t) => s + t.passations, 0),
    enCours: TEST_PASSATIONS.filter((p) => p.status === 'invited' || p.status === 'in_progress').length,
    flagged: TEST_PASSATIONS.filter((p) => p.flags?.length).length,
  };
}

// ───────────────────────────────────────── Marque employeur
export const CAREER_SITE_SECTIONS: CareerSiteSection[] = [
  { key: 'hero',         label: 'Hero (bannière + CTA)',     enabled: true,  summary: 'Slogan « Construisons le futur RH de l\'Afrique » + bouton Voir les offres' },
  { key: 'about',        label: 'À propos',                  enabled: true,  summary: 'Mission, vision, présentation Atlas Studio' },
  { key: 'why',          label: 'Pourquoi nous rejoindre',   enabled: true,  summary: 'Avantages, culture, télétravail, formation 5 %' },
  { key: 'offers',       label: 'Offres ouvertes',           enabled: true,  summary: 'Liste filtrable des postes publiés' },
  { key: 'process',      label: 'Notre processus',           enabled: true,  summary: 'Étapes du recrutement (transparence candidat)' },
  { key: 'testimonials', label: 'Témoignages',               enabled: true,  summary: 'Citations & vidéos de collaborateurs' },
  { key: 'figures',      label: 'Chiffres clés',             enabled: false, summary: 'Effectif, croissance, diversité H/F' },
  { key: 'contact',      label: 'Contact & réseaux',         enabled: true,  summary: 'Formulaire + LinkedIn / Instagram' },
];

export const TESTIMONIALS: Testimonial[] = [
  { id: 'tm-01', employeeId: 'e5', authorName: 'Mariam Cissé', role: 'Designer Produit', quote: 'Ici on me fait confiance pour piloter le design system de bout en bout.', hasVideo: true },
  { id: 'tm-02', employeeId: 'e8', authorName: 'Serge Aké', role: 'DevOps Engineer', quote: 'La culture d\'ingénierie est exigeante et bienveillante à la fois.', hasVideo: false },
  { id: 'tm-03', employeeId: 'e11', authorName: 'Rokhaya Fall', role: 'Customer Success', quote: 'Onboarding au top, j\'étais opérationnelle en deux semaines.', hasVideo: true },
];

export function employerBrandKpis(): EmployerBrandKPI {
  return { visitorsMonth: 4820, visitorsDelta: 12, conversionRate: 6.4, glassdoorScore: 4.3, acceptanceRate: 83, spontaneousApps: 37 };
}

// ───────────────────────────────────────── Audit & conformité
export const AUDIT_ENTRIES: AuditEntry[] = [
  { id: 'au-01', at: '2026-05-29T09:12:00Z', actor: 'Aminata Sow',  action: 'recruitment.offer.published',      severity: 'INFO',     detail: 'Offre JOB-2026-0003 publiée (LinkedIn, Cooptation)', hash: '7a3f8b21d4e0' },
  { id: 'au-02', at: '2026-05-28T14:32:00Z', actor: 'Aminata Sow',  action: 'recruitment.offer.sent',           severity: 'INFO',     detail: 'Offre envoyée à Ousmane Tall · 1 750 000 FCFA',      hash: 'b81c0f9a2e44' },
  { id: 'au-03', at: '2026-05-28T11:00:00Z', actor: 'Système',      action: 'recruitment.bias.detected',        severity: 'WARNING',  detail: 'Écart de taux de passage screening H/F sur JOB-2026-0003', hash: 'c4e2a7d10b93' },
  { id: 'au-04', at: '2026-05-27T16:40:00Z', actor: 'Fatou Diop',   action: 'recruitment.need.validated',       severity: 'INFO',     detail: 'Besoin BES-2026-0246 validé (DRH)',                  hash: 'd9f1b3c80a52' },
  { id: 'au-05', at: '2026-05-26T10:05:00Z', actor: 'Système',      action: 'recruitment.candidate.anonymized', severity: 'INFO',     detail: '3 candidatures anonymisées (RGPD, +2 ans)',          hash: 'e2a8d47f1c60' },
  { id: 'au-06', at: '2026-05-25T08:20:00Z', actor: 'Awa Koné',     action: 'recruitment.cooptation.flagged',   severity: 'CRITICAL', detail: 'Cooptation REF-2025-014 — lien hiérarchique direct détecté', hash: 'f3b9e05a2d18' },
];

export const FRAUD_ALERTS: FraudAlert[] = [
  { id: 'fr-01', kind: 'cooptation_abusive',    severity: 'CRITICAL', message: 'Awa Koné a coopté un candidat (REF-2025-014) dont elle serait manager direct.', detectedAt: '2026-05-25', status: 'reviewing' },
  { id: 'fr-02', kind: 'biais_discrimination',  severity: 'WARNING',  message: 'Taux de passage screening H 18 % vs F 6 % sur JOB-2026-0003 — écart à investiguer.', detectedAt: '2026-05-28', status: 'open' },
  { id: 'fr-03', kind: 'doublon_candidat',      severity: 'INFO',     message: '2 profils candidats potentiellement identiques (même e-mail normalisé).', detectedAt: '2026-05-24', status: 'cleared' },
];

export const FRAUD_KIND_LABEL: Record<FraudAlert['kind'], string> = {
  cooptation_abusive:   'Cooptation abusive',
  conflit_interet:      'Conflit d\'intérêt',
  biais_discrimination: 'Biais / discrimination',
  offre_fictive:        'Offre fictive',
  doublon_candidat:     'Doublon candidat',
};

export interface AuditKPI { entries: number; alertes: number; critiques: number; chainOk: boolean }
export function auditKpis(): AuditKPI {
  return {
    entries: AUDIT_ENTRIES.length,
    alertes: FRAUD_ALERTS.filter((a) => a.status === 'open' || a.status === 'reviewing').length,
    critiques: FRAUD_ALERTS.filter((a) => a.severity === 'CRITICAL' && a.status !== 'cleared').length,
    chainOk: true,
  };
}
