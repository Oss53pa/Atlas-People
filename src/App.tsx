import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { CockpitPage } from './pages/CockpitPage';
import { UnifiedCockpitDRHPage } from './pages/UnifiedCockpitPage';
import { LandingPage } from './pages/LandingPage';
import { WelcomeCockpitPage } from './pages/WelcomeCockpitPage';
import { AdminWorkspacePage } from './pages/admin/AdminWorkspacePage';
import { BackOfficeQueuePage } from './pages/backoffice/BackOfficeQueuePage';
import { ReportsPage } from './pages/Reports';
import { WhatIfSimulatorPage } from './pages/WhatIfSimulatorPage';
import { WhatIfComparePage } from './pages/WhatIfComparePage';
import {
  CycleAnnuelEvalPage, GrilleEvaluationPage, CalibrationEvalPage,
  NotationFinalePage, EquiteEvalPage, AuditEvalPage,
} from './pages/eval/EvalEnrichmentPages';
import {
  CartographieCompetencesPage, TaxonomieCompetencesPage, GapAnalysisPage,
  SpofPage, HeatmapCompetencesPage, ReferentielMetiersPage, ParametresCompetencesPage,
} from './pages/competences/CompetencesEnrichmentPages';
import {
  AuditM9Page, AutoEvalCompetencesPage, ManagerEvalCompetencesPage, PdcPage, TalentsMobilitePage,
} from './pages/competences/CompetencesSprint1Pages';
import {
  JobArchitecturePage, TalentReviewPage, TalentPoolsPage, PromotionsPage, AlumniPage, AuditM10Page,
} from './pages/carrieres/CarrieresSprint1Pages';
import {
  CareerFrameworksPage, CareerPathsIndividualsPage, SuccessionEnrichedPage,
  MentoratSponsorshipPage, ExpatriationPage,
} from './pages/carrieres/CarrieresSprint2Pages';
import {
  ParcoursFormationPage, PifPage, ModalitesPage, LmsPage, FormateursPage, AuditM11Page,
} from './pages/formation/FormationSprint1Pages';
import { CollaborateursPage } from './pages/CollaborateursPage';
import { EmployeeDossierPage } from './pages/EmployeeDossierPage';
import { AmendmentDossierPage } from './pages/AmendmentDossierPage';
import { ExitDossierPage } from './pages/ExitDossierPage';
import { NewEmployeeWizard } from './pages/NewEmployeeWizard';
import { ImportEmployeesWizard } from './pages/ImportEmployeesWizard';
import { ParametresPage } from './pages/ParametresPage';
import { DemandesModifPage } from './pages/DemandesModifPage';
import { TempsAbsencesPage } from './pages/TempsAbsencesPage';
import { RubriquesPage } from './pages/RubriquesPage';
import { NotesFraisPage } from './pages/NotesFraisPage';
import { CompetencesPage } from './pages/CompetencesPage';
// M12 Conformité & SST — enrichi
import {
  CockpitConformitePage, DuerPage, RpsPage, AtMpPage, RegistrePage,
  DeclarationsPage as DeclarationsConformitePage, VisitesMedicalesPage, HabilitationsPage, AuditsPage,
  InspectionsPage as InspectionsConformitePage, ConservationPage, ParametresConformitePage,
} from './pages/conformite/ConformitePages';
import { ConformitePage as LegacyComplianceGuard } from './pages/ConformitePage';
import { JournalAuditPage } from './pages/JournalAuditPage';
import { SelfServicePage } from './pages/SelfServicePage';
import { MonTempsPage } from './pages/ess/MonTempsPage';
import { MesCongesPage } from './pages/ess/MesCongesPage';
import { PoserDemandePage } from './pages/ess/PoserDemandePage';
import { MonPointagePage } from './pages/ess/MonPointagePage';
import { PortalLayout } from './components/layout/PortalLayout';
import { PortalHomePage } from './pages/portal/PortalHomePage';
import { MonProfilPage } from './pages/portal/MonProfilPage';
import { MaPaiePage } from './pages/portal/MaPaiePage';
import { MesDemandesPage } from './pages/portal/MesDemandesPage';
import { MonCourrierPage } from './pages/portal/MonCourrierPage';
import { MesFraisPage } from './pages/portal/MesFraisPage';
import { MaPerformancePage } from './pages/portal/MaPerformancePage';
import { MonDeveloppementPage } from './pages/portal/MonDeveloppementPage';
import { MonSuiviSantePage } from './pages/portal/MonSuiviSantePage';
import { MonOnboardingPage } from './pages/portal/MonOnboardingPage';
import { MesParametresPage } from './pages/portal/MesParametresPage';
import { MesDocumentsPage } from './pages/portal/MesDocumentsPage';
import { MesSanctionsPage } from './pages/portal/MesSanctionsPage';
import { MonPlanningPage } from './pages/ess/MonPlanningPage';
import { MesHeuresSupPage } from './pages/ess/MesHeuresSupPage';
import { MesDelegationPage } from './pages/ess/MesDelegationPage';
import { ManagerLayout } from './components/layout/ManagerLayout';
import { ManagerHomePage } from './pages/mss/ManagerHomePage';
import { TeamDashboardPage } from './pages/mss/TeamDashboardPage';
import { TeamApprovalsPage } from './pages/mss/TeamApprovalsPage';
import { TeamPlanningPage } from './pages/mss/TeamPlanningPage';
import { TeamAttendancePage } from './pages/mss/TeamAttendancePage';
import { TeamOvertimePage } from './pages/mss/TeamOvertimePage';
import { TeamAbsencePage } from './pages/mss/TeamAbsencePage';
import { TeamAbsencesViewPage } from './pages/mss/TeamAbsencesViewPage';
import { TeamCountersPage } from './pages/mss/TeamCountersPage';
import { TeamDelegationCoveragePage } from './pages/mss/TeamDelegationCoveragePage';
import { TeamPerformanceDashboardPage } from './pages/mss/TeamPerformanceDashboardPage';
import { TeamOKRPage } from './pages/mss/TeamOKRPage';
import { TeamEvaluationsPage } from './pages/mss/TeamEvaluationsPage';
import { TeamOneOnOnePage } from './pages/mss/TeamOneOnOnePage';
import { TeamCalibrationPage } from './pages/mss/TeamCalibrationPage';
import { TeamFeedback360Page } from './pages/mss/TeamFeedback360Page';
import { TeamRecognitionPage } from './pages/mss/TeamRecognitionPage';
import { TeamDevDashboardPage } from './pages/mss/TeamDevDashboardPage';
import { TeamSkillsMatrixPage } from './pages/mss/TeamSkillsMatrixPage';
import { TeamWishesPage } from './pages/mss/TeamWishesPage';
import { TeamTrainingValidationsPage } from './pages/mss/TeamTrainingValidationsPage';
import { TeamTrainingsPage } from './pages/mss/TeamTrainingsPage';
import { TeamDevPlanPage } from './pages/mss/TeamDevPlanPage';
import { TeamMobilityPage } from './pages/mss/TeamMobilityPage';
import { TeamSuccessionPage } from './pages/mss/TeamSuccessionPage';
import { TeamMentoringPage } from './pages/mss/TeamMentoringPage';
import { TeamRecruitmentDashboardPage } from './pages/mss/TeamRecruitmentDashboardPage';
import { TeamRecruitmentRequestsPage } from './pages/mss/TeamRecruitmentRequestsPage';
import { TeamCandidatesPage } from './pages/mss/TeamCandidatesPage';
import { TeamNewcomersPage } from './pages/mss/TeamNewcomersPage';
import { TeamLeaversPage } from './pages/mss/TeamLeaversPage';
import { TeamDailyDashboardPage } from './pages/mss/TeamDailyDashboardPage';
import { TeamExpenseValidationsPage } from './pages/mss/TeamExpenseValidationsPage';
import { TeamRequestsPage } from './pages/mss/TeamRequestsPage';
import { ManagerCorrespondencePage } from './pages/mss/ManagerCorrespondencePage';
import { TeamClimatePage } from './pages/mss/TeamClimatePage';
import { SchedulingConflictsPage } from './pages/mss/SchedulingConflictsPage';
import { MonEquipePage } from './pages/mss/MonEquipePage';
import { Vue360Page } from './pages/mss/Vue360Page';
import { TeamMovementsPage } from './pages/mss/TeamMovementsPage';
import { ManagerTeamPage } from './pages/mss/ManagerTeamPage';
// M8 Reporting & pilotage
import { ReportingDashboardPage } from './pages/mss/ReportingDashboardPage';
import { ReportingHeadcountPage } from './pages/mss/ReportingHeadcountPage';
import { ReportingTimePage } from './pages/mss/ReportingTimePage';
import { ReportingPayrollPage } from './pages/mss/ReportingPayrollPage';
import { ReportingTrainingPage } from './pages/mss/ReportingTrainingPage';
import { ReportingPerformancePage } from './pages/mss/ReportingPerformancePage';
import { ReportingClimatePage } from './pages/mss/ReportingClimatePage';
import { ReportingDashboardsPage } from './pages/mss/ReportingDashboardsPage';
import { ReportingExportsPage } from './pages/mss/ReportingExportsPage';
// M9 Ma pratique managériale
import { PracticeOverviewPage } from './pages/mss/PracticeOverviewPage';
import { PracticeRitualsPage } from './pages/mss/PracticeRitualsPage';
import { PracticeFeedbackPage } from './pages/mss/PracticeFeedbackPage';
import { PracticeTrainingsPage } from './pages/mss/PracticeTrainingsPage';
import { PracticeCareerPage } from './pages/mss/PracticeCareerPage';
import { PracticeResourcesPage } from './pages/mss/PracticeResourcesPage';
import { PracticeEffectivenessPage } from './pages/mss/PracticeEffectivenessPage';
// M10 Paramètres manager
import { SettingsIndexPage } from './pages/mss/SettingsIndexPage';
import { SettingsNotificationsPage } from './pages/mss/SettingsNotificationsPage';
import { SettingsDelegationsPage } from './pages/mss/SettingsDelegationsPage';
import { SettingsTeamViewPage } from './pages/mss/SettingsTeamViewPage';
import { SettingsDepthPage } from './pages/mss/SettingsDepthPage';
import { SettingsTemplatesPage } from './pages/mss/SettingsTemplatesPage';
// M3 PAIE (back-office)
import { CockpitPaiePage } from './pages/paie/CockpitPaiePage';
import { CyclesPage } from './pages/paie/CyclesPage';
import { DossierPaiePage } from './pages/paie/DossierPaiePage';
import { SaisieVariablesPage } from './pages/paie/SaisieVariablesPage';
import { CalculPage } from './pages/paie/CalculPage';
import { ValidationPaiePage } from './pages/paie/ValidationPaiePage';
import { JournalPaiePage } from './pages/paie/JournalPaiePage';
import { VirementsPage } from './pages/paie/VirementsPage';
import { BulletinsPage } from './pages/paie/BulletinsPage';
import { DeclarationsPage } from './pages/paie/DeclarationsPage';
import { ComptabilitePage } from './pages/paie/ComptabilitePage';
import { RegularisationsPage } from './pages/paie/RegularisationsPage';
import { ModelesPage } from './pages/paie/ModelesPage';
import { ReferentielsPage } from './pages/paie/ReferentielsPage';
import { ReportingPaiePage } from './pages/paie/ReportingPaiePage';
import { AuditPaiePage } from './pages/paie/AuditPaiePage';
import { ParametresPaiePage } from './pages/paie/ParametresPaiePage';
import { SimulationPaiePage } from './pages/paie/SimulationPaiePage';
import { ConfigurationPaiePage } from './pages/paie/ConfigurationPaiePage';
// Module « Actes & conformité » (back-office Administration RH OHADA)
import { CockpitAdminRhPage } from './pages/admin/CockpitAdminRhPage';
import { ContratsPage as ContratsAdminPage } from './pages/admin/ContratsPage';
import { PeriodeEssaiPage } from './pages/admin/PeriodeEssaiPage';
import { DisciplinairePage } from './pages/admin/DisciplinairePage';
import { CertificatsPage } from './pages/admin/CertificatsPage';
import { RepresentationPage } from './pages/admin/RepresentationPage';
import { ObligationsPage } from './pages/admin/ObligationsPage';
import { ExpatriesPage } from './pages/admin/ExpatriesPage';
import { ParametresAdminPage } from './pages/admin/ParametresAdminPage';
// M5 RECRUTEMENT (back-office ATS)
import { CockpitRecrutPage } from './pages/recrut/CockpitRecrutPage';
import { BesoinsPage } from './pages/recrut/BesoinsPage';
import { BesoinDetailPage } from './pages/recrut/BesoinDetailPage';
import { PostesPage } from './pages/recrut/PostesPage';
import { PosteDetailPage } from './pages/recrut/PosteDetailPage';
import { CandidaturesPage } from './pages/recrut/CandidaturesPage';
import { CandidatPage } from './pages/recrut/CandidatPage';
import { VivierPage } from './pages/recrut/VivierPage';
import { EntretiensPage } from './pages/recrut/EntretiensPage';
import { OffresPage } from './pages/recrut/OffresPage';
import { SourcingPage } from './pages/recrut/SourcingPage';
import { CooptationPage } from './pages/recrut/CooptationPage';
import { IntegrationPage } from './pages/recrut/IntegrationPage';
import { ReportingRecrutPage } from './pages/recrut/ReportingRecrutPage';
import { RgpdPage } from './pages/recrut/RgpdPage';
import { ParametresRecrutPage } from './pages/recrut/ParametresRecrutPage';
import { TestsPage } from './pages/recrut/TestsPage';
import { MarqueEmployeurPage } from './pages/recrut/MarqueEmployeurPage';
import { AuditRecrutPage } from './pages/recrut/AuditRecrutPage';
// M6 ONBOARDING (back-office Intégration)
import { CockpitOnboardingPage } from './pages/onboarding/CockpitOnboardingPage';
import { ArrivantsPage } from './pages/onboarding/ArrivantsPage';
import { ArrivantDetailPage } from './pages/onboarding/ArrivantDetailPage';
import { ParcoursPage } from './pages/onboarding/ParcoursPage';
import { TachesPage } from './pages/onboarding/TachesPage';
import { BuddyPage } from './pages/onboarding/BuddyPage';
import { FormationsPage } from './pages/onboarding/FormationsPage';
import { DocumentsPage } from './pages/onboarding/DocumentsPage';
import { PulsePage } from './pages/onboarding/PulsePage';
import { ValidationPePage } from './pages/onboarding/ValidationPePage';
import { ReportingOnboardingPage } from './pages/onboarding/ReportingOnboardingPage';
import { ParametresOnboardingPage } from './pages/onboarding/ParametresOnboardingPage';
import { PreBoardingPage } from './pages/onboarding/PreBoardingPage';
import { MobiliteInternePage } from './pages/onboarding/MobiliteInternePage';
import { OnboardingExpatPage } from './pages/onboarding/OnboardingExpatPage';
import { Feedback360Page } from './pages/onboarding/Feedback360Page';
import { AuditM6Page } from './pages/onboarding/AuditM6Page';
// M8 ÉVALUATIONS
import { CockpitEvalPage } from './pages/eval/CockpitEvalPage';
import { TalentGridPage } from './pages/eval/TalentGridPage';
import { EvaluationDetailPage } from './pages/eval/EvaluationDetailPage';
import {
  CyclesEvalPage, CampagnesPage, EvaluationsListPage, Feedback360EvalPage,
  CalibrationPage, PlansDevPage, OneOnOnePage, ReportingEvalPage, ParametresEvalPage,
} from './pages/eval/OtherEvalPages';
// M10 CARRIÈRES & SUCCESSION
import {
  CockpitCarrieresPage, FilieresPage, TrajectoiresPage, PostesClesPage, SuccessionPage,
  HautsPotentielsPage, MentoratPage, CartographiePage, MobiliteCarrieresPage,
  ReportingCarrieresPage, ParametresCarrieresPage,
} from './pages/carrieres/CarrieresPages';
// M11 Formation
import {
  CockpitFormationPage, CataloguePage, PlanFormationPage, SessionsPage,
  InscriptionsPage, EvaluationsKirkpatrickPage, CertificationsPage, RoiPage,
  CompetencesFormationPage, FdfpPage, ReportingFormationPage, ParametresFormationPage,
} from './pages/formation/FormationPages';
// M7 OKR (back-office Objectifs & Key Results)
import { CockpitOkrPage } from './pages/okr/CockpitOkrPage';
import { CyclesOkrPage } from './pages/okr/CyclesOkrPage';
import { ObjectifsEntreprisePage, ObjectifsDepartementPage, ObjectifsEquipePage, ObjectifsIndividuelPage } from './pages/okr/ObjectifsLevelPage';
import { KeyResultsPage } from './pages/okr/KeyResultsPage';
import { CheckInsPage } from './pages/okr/CheckInsPage';
import { AlignementPage } from './pages/okr/AlignementPage';
import { RevuePage } from './pages/okr/RevuePage';
import { ReportingOkrPage } from './pages/okr/ReportingOkrPage';
import { ParametresOkrPage } from './pages/okr/ParametresOkrPage';
import {
  MethodologieOkrPage, NotationOkrPage, RetrospectiveOkrPage,
  GouvernanceOkrPage, IntegrationOkrPage, AuditOkrPage,
} from './pages/okr/OkrEnrichmentPages';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { ALL_MODULES } from './app/nav';

const READY: Record<string, JSX.Element> = {
  '/': <CockpitPage />,
  '/collaborateurs': <CollaborateursPage />,
  '/temps': <TempsAbsencesPage />,
  '/frais': <NotesFraisPage />,
  '/paie': <CockpitPaiePage />,
  '/hr/actes': <CockpitAdminRhPage />,
  '/recrutement': <CockpitRecrutPage />,
  '/onboarding': <CockpitOnboardingPage />,
  '/objectifs': <CockpitOkrPage />,
  '/evaluations': <CockpitEvalPage />,
  '/carrieres': <CockpitCarrieresPage />,
  '/formation': <CockpitFormationPage />,
  '/competences': <CompetencesPage />,
  '/conformite': <CockpitConformitePage />,
  '/moi': <SelfServicePage />,
  '/cockpit-360': <UnifiedCockpitDRHPage />,
  // '/accueil' est désormais hors AppLayout (route directe ci-dessous)
};

function App() {
  return (
    <Routes>
      {/* Pages "marketing/welcome" hors AppLayout (sans sidebar / sans topbar) */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/accueil" element={<WelcomeCockpitPage />} />
      {/* Console méta-admin Atlas Studio — hors AppLayout */}
      <Route path="/admin" element={<AdminWorkspacePage />} />

      <Route element={<AppLayout />}>
        {ALL_MODULES.map((m) => (
          <Route
            key={m.code}
            path={m.path}
            element={READY[m.path] ?? <ComingSoonPage module={m} />}
          />
        ))}
        <Route path="/collaborateurs/nouveau" element={<NewEmployeeWizard />} />
        <Route path="/collaborateurs/import" element={<ImportEmployeesWizard />} />
        <Route path="/collaborateurs/demandes" element={<DemandesModifPage />} />
        <Route path="/parametres" element={<ParametresPage />} />
        <Route path="/collaborateurs/:id/avenant" element={<AmendmentDossierPage />} />
        <Route path="/collaborateurs/:id/sortie" element={<ExitDossierPage />} />
        <Route path="/collaborateurs/:id" element={<EmployeeDossierPage />} />
        <Route path="/paie/rubriques" element={<RubriquesPage />} />
        {/* M3 PAIE — back-office */}
        <Route path="/paie/cycle" element={<CyclesPage />} />
        <Route path="/paie/dossier/:employeeId" element={<DossierPaiePage />} />
        <Route path="/paie/saisie" element={<SaisieVariablesPage />} />
        <Route path="/paie/saisie/:employeeId" element={<SaisieVariablesPage />} />
        <Route path="/paie/calcul" element={<CalculPage />} />
        <Route path="/paie/simulation" element={<SimulationPaiePage />} />
        <Route path="/paie/validation" element={<ValidationPaiePage />} />
        <Route path="/paie/journal" element={<JournalPaiePage />} />
        <Route path="/paie/virements" element={<VirementsPage />} />
        <Route path="/paie/bulletins" element={<BulletinsPage />} />
        <Route path="/paie/declarations" element={<DeclarationsPage />} />
        <Route path="/paie/comptabilite" element={<ComptabilitePage />} />
        <Route path="/paie/regularisations" element={<RegularisationsPage />} />
        <Route path="/paie/modeles" element={<ModelesPage />} />
        <Route path="/paie/referentiels" element={<ReferentielsPage />} />
        <Route path="/paie/configuration" element={<ConfigurationPaiePage />} />
        <Route path="/paie/reporting" element={<ReportingPaiePage />} />
        <Route path="/paie/audit" element={<AuditPaiePage />} />
        <Route path="/paie/parametres" element={<ParametresPaiePage />} />
        <Route path="/audit" element={<JournalAuditPage />} />
        {/* M4 ADMIN RH — back-office Administration du personnel OHADA */}
        <Route path="/hr/actes/contrats" element={<ContratsAdminPage />} />
        <Route path="/hr/actes/periode-essai" element={<PeriodeEssaiPage />} />
        <Route path="/hr/actes/disciplinaire" element={<DisciplinairePage />} />
        <Route path="/hr/actes/certificats" element={<CertificatsPage />} />
        <Route path="/hr/actes/representation" element={<RepresentationPage />} />
        <Route path="/hr/actes/obligations" element={<ObligationsPage />} />
        <Route path="/hr/actes/expatries" element={<ExpatriesPage />} />
        <Route path="/hr/actes/parametres" element={<ParametresAdminPage />} />
        {/* M5 RECRUTEMENT — back-office ATS */}
        <Route path="/recrutement/besoins" element={<BesoinsPage />} />
        <Route path="/recrutement/besoins/:besoinId" element={<BesoinDetailPage />} />
        <Route path="/recrutement/postes" element={<PostesPage />} />
        <Route path="/recrutement/postes/:id" element={<PosteDetailPage />} />
        <Route path="/recrutement/candidatures" element={<CandidaturesPage />} />
        <Route path="/recrutement/candidats/:id" element={<CandidatPage />} />
        <Route path="/recrutement/vivier" element={<VivierPage />} />
        <Route path="/recrutement/entretiens" element={<EntretiensPage />} />
        <Route path="/recrutement/tests" element={<TestsPage />} />
        <Route path="/recrutement/offres" element={<OffresPage />} />
        <Route path="/recrutement/sourcing" element={<SourcingPage />} />
        <Route path="/recrutement/marque-employeur" element={<MarqueEmployeurPage />} />
        <Route path="/recrutement/cooptation" element={<CooptationPage />} />
        <Route path="/recrutement/integration" element={<IntegrationPage />} />
        <Route path="/recrutement/reporting" element={<ReportingRecrutPage />} />
        <Route path="/recrutement/rgpd" element={<RgpdPage />} />
        <Route path="/recrutement/audit" element={<AuditRecrutPage />} />
        <Route path="/recrutement/parametres" element={<ParametresRecrutPage />} />
        {/* M6 ONBOARDING — back-office Intégration */}
        <Route path="/onboarding/arrivants" element={<ArrivantsPage />} />
        <Route path="/onboarding/arrivants/:employeeId" element={<ArrivantDetailPage />} />
        <Route path="/onboarding/parcours" element={<ParcoursPage />} />
        <Route path="/onboarding/taches" element={<TachesPage />} />
        <Route path="/onboarding/buddy" element={<BuddyPage />} />
        <Route path="/onboarding/formations" element={<FormationsPage />} />
        <Route path="/onboarding/documents" element={<DocumentsPage />} />
        <Route path="/onboarding/pulse" element={<PulsePage />} />
        <Route path="/onboarding/validation" element={<ValidationPePage />} />
        <Route path="/onboarding/reporting" element={<ReportingOnboardingPage />} />
        <Route path="/onboarding/parametres" element={<ParametresOnboardingPage />} />
        <Route path="/onboarding/preboarding" element={<PreBoardingPage />} />
        <Route path="/onboarding/mobilite-interne" element={<MobiliteInternePage />} />
        <Route path="/onboarding/expat" element={<OnboardingExpatPage />} />
        <Route path="/onboarding/feedback-360" element={<Feedback360Page />} />
        <Route path="/onboarding/audit" element={<AuditM6Page />} />
        {/* M7 OKR */}
        <Route path="/objectifs/cycles" element={<CyclesOkrPage />} />
        <Route path="/objectifs/entreprise" element={<ObjectifsEntreprisePage />} />
        <Route path="/objectifs/departement" element={<ObjectifsDepartementPage />} />
        <Route path="/objectifs/equipe" element={<ObjectifsEquipePage />} />
        <Route path="/objectifs/individuel" element={<ObjectifsIndividuelPage />} />
        <Route path="/objectifs/key-results" element={<KeyResultsPage />} />
        <Route path="/objectifs/check-ins" element={<CheckInsPage />} />
        <Route path="/objectifs/alignement" element={<AlignementPage />} />
        <Route path="/objectifs/revue" element={<RevuePage />} />
        <Route path="/objectifs/reporting" element={<ReportingOkrPage />} />
        <Route path="/objectifs/parametres" element={<ParametresOkrPage />} />
        {/* M8 Évaluations */}
        <Route path="/evaluations/cycles" element={<CyclesEvalPage />} />
        <Route path="/evaluations/campagnes" element={<CampagnesPage />} />
        <Route path="/evaluations/liste" element={<EvaluationsListPage />} />
        <Route path="/evaluations/eval/:employeeId" element={<EvaluationDetailPage />} />
        <Route path="/evaluations/360" element={<Feedback360EvalPage />} />
        <Route path="/evaluations/calibration" element={<CalibrationPage />} />
        <Route path="/evaluations/talent-grid" element={<TalentGridPage />} />
        <Route path="/evaluations/plans-dev" element={<PlansDevPage />} />
        <Route path="/evaluations/1-1" element={<OneOnOnePage />} />
        <Route path="/evaluations/reporting" element={<ReportingEvalPage />} />
        <Route path="/evaluations/parametres" element={<ParametresEvalPage />} />
        {/* M10 Carrières & Succession */}
        <Route path="/carrieres/filieres" element={<FilieresPage />} />
        <Route path="/carrieres/trajectoires" element={<TrajectoiresPage />} />
        <Route path="/carrieres/postes-cles" element={<PostesClesPage />} />
        <Route path="/carrieres/succession" element={<SuccessionPage />} />
        <Route path="/carrieres/hauts-potentiels" element={<HautsPotentielsPage />} />
        <Route path="/carrieres/mentorat" element={<MentoratPage />} />
        <Route path="/carrieres/cartographie" element={<CartographiePage />} />
        <Route path="/carrieres/mobilite" element={<MobiliteCarrieresPage />} />
        <Route path="/carrieres/reporting" element={<ReportingCarrieresPage />} />
        <Route path="/carrieres/parametres" element={<ParametresCarrieresPage />} />
        <Route path="/formation/catalogue" element={<CataloguePage />} />
        <Route path="/formation/plan" element={<PlanFormationPage />} />
        <Route path="/formation/sessions" element={<SessionsPage />} />
        <Route path="/formation/inscriptions" element={<InscriptionsPage />} />
        <Route path="/formation/evaluations" element={<EvaluationsKirkpatrickPage />} />
        <Route path="/formation/certifications" element={<CertificationsPage />} />
        <Route path="/formation/roi" element={<RoiPage />} />
        <Route path="/formation/competences" element={<CompetencesFormationPage />} />
        <Route path="/formation/fdfp" element={<FdfpPage />} />
        <Route path="/formation/reporting" element={<ReportingFormationPage />} />
        <Route path="/formation/parametres" element={<ParametresFormationPage />} />
        <Route path="/conformite/duer" element={<DuerPage />} />
        <Route path="/conformite/rps" element={<RpsPage />} />
        <Route path="/conformite/at-mp" element={<AtMpPage />} />
        <Route path="/conformite/registre" element={<RegistrePage />} />
        <Route path="/conformite/declarations" element={<DeclarationsConformitePage />} />
        <Route path="/conformite/visites" element={<VisitesMedicalesPage />} />
        <Route path="/conformite/habilitations" element={<HabilitationsPage />} />
        <Route path="/conformite/audits" element={<AuditsPage />} />
        <Route path="/conformite/inspections" element={<InspectionsConformitePage />} />
        <Route path="/conformite/conservation" element={<ConservationPage />} />
        <Route path="/conformite/parametres" element={<ParametresConformitePage />} />
        <Route path="/conformite/legacy-guard" element={<LegacyComplianceGuard />} />
        <Route path="/objectifs/methodologie" element={<MethodologieOkrPage />} />
        <Route path="/objectifs/notation" element={<NotationOkrPage />} />
        <Route path="/objectifs/retrospective" element={<RetrospectiveOkrPage />} />
        <Route path="/objectifs/gouvernance" element={<GouvernanceOkrPage />} />
        <Route path="/objectifs/integration" element={<IntegrationOkrPage />} />
        <Route path="/objectifs/audit" element={<AuditOkrPage />} />
        {/* /cockpit-360 désormais wiré via READY (ligne ~258) */}
        {/* /accueil + /landing sont hors AppLayout (déclarés tout en haut) */}
        {/* Back-office Queue — agents HR + DRH */}
        <Route path="/hr/queue" element={<BackOfficeQueuePage />} />
        {/* Module Reporting (REPORTING_STANDARD.md v1.0) */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/whatif" element={<WhatIfSimulatorPage />} />
        <Route path="/whatif/compare" element={<WhatIfComparePage />} />
        <Route path="/evaluations/cycle-annuel" element={<CycleAnnuelEvalPage />} />
        <Route path="/evaluations/grille" element={<GrilleEvaluationPage />} />
        <Route path="/evaluations/calibration" element={<CalibrationEvalPage />} />
        <Route path="/evaluations/notation" element={<NotationFinalePage />} />
        <Route path="/evaluations/equite" element={<EquiteEvalPage />} />
        <Route path="/evaluations/audit" element={<AuditEvalPage />} />
        <Route path="/competences/cartographie" element={<CartographieCompetencesPage />} />
        <Route path="/competences/taxonomie" element={<TaxonomieCompetencesPage />} />
        <Route path="/competences/gap" element={<GapAnalysisPage />} />
        <Route path="/competences/spof" element={<SpofPage />} />
        <Route path="/competences/heatmap" element={<HeatmapCompetencesPage />} />
        <Route path="/competences/metiers" element={<ReferentielMetiersPage />} />
        <Route path="/competences/parametres" element={<ParametresCompetencesPage />} />
        <Route path="/competences/auto-eval" element={<AutoEvalCompetencesPage />} />
        <Route path="/competences/manager-eval" element={<ManagerEvalCompetencesPage />} />
        <Route path="/competences/pdc" element={<PdcPage />} />
        <Route path="/competences/mobilite" element={<TalentsMobilitePage />} />
        <Route path="/competences/audit" element={<AuditM9Page />} />
        <Route path="/carrieres/job-architecture" element={<JobArchitecturePage />} />
        <Route path="/carrieres/talent-review" element={<TalentReviewPage />} />
        <Route path="/carrieres/talent-pools" element={<TalentPoolsPage />} />
        <Route path="/carrieres/promotions" element={<PromotionsPage />} />
        <Route path="/carrieres/alumni" element={<AlumniPage />} />
        <Route path="/carrieres/audit" element={<AuditM10Page />} />
        <Route path="/carrieres/frameworks" element={<CareerFrameworksPage />} />
        <Route path="/carrieres/parcours" element={<CareerPathsIndividualsPage />} />
        <Route path="/carrieres/succession-plus" element={<SuccessionEnrichedPage />} />
        <Route path="/carrieres/mentorat-pro" element={<MentoratSponsorshipPage />} />
        <Route path="/carrieres/expatriation" element={<ExpatriationPage />} />
        <Route path="/formation/parcours" element={<ParcoursFormationPage />} />
        <Route path="/formation/pif" element={<PifPage />} />
        <Route path="/formation/modalites" element={<ModalitesPage />} />
        <Route path="/formation/lms" element={<LmsPage />} />
        <Route path="/formation/formateurs" element={<FormateursPage />} />
        <Route path="/formation/audit" element={<AuditM11Page />} />
        <Route path="*" element={<ComingSoonPage />} />
      </Route>

      {/* PORTAIL COLLABORATEUR — coquille séparée (aucun élément du back-office) */}
      <Route element={<PortalLayout />}>
        <Route path="/espace" element={<PortalHomePage />} />
        <Route path="/espace/profil" element={<MonProfilPage />} />
        <Route path="/espace/paie" element={<MaPaiePage />} />
        <Route path="/espace/demandes" element={<MesDemandesPage />} />
        <Route path="/espace/courrier" element={<MonCourrierPage />} />
        <Route path="/espace/frais" element={<MesFraisPage />} />
        <Route path="/espace/performance" element={<MaPerformancePage />} />
        <Route path="/espace/developpement" element={<MonDeveloppementPage />} />
        <Route path="/espace/sante" element={<MonSuiviSantePage />} />
        <Route path="/espace/onboarding" element={<MonOnboardingPage />} />
        <Route path="/espace/parametres" element={<MesParametresPage />} />
        <Route path="/espace/documents" element={<MesDocumentsPage />} />
        <Route path="/espace/sanctions" element={<MesSanctionsPage />} />
        <Route path="/me/time" element={<MonTempsPage />} />
        <Route path="/me/time/leave" element={<MesCongesPage />} />
        <Route path="/me/time/leave/request/new" element={<PoserDemandePage />} />
        <Route path="/me/time/clocking" element={<MonPointagePage />} />
        <Route path="/me/time/planning" element={<MonPlanningPage />} />
        <Route path="/me/time/overtime" element={<MesHeuresSupPage />} />
        <Route path="/me/time/delegation" element={<MesDelegationPage />} />
      </Route>

      {/* PORTAIL MANAGER (MSS) — coquille séparée, périmètre managérial strict (R1) */}
      <Route element={<ManagerLayout />}>
        <Route path="/team" element={<ManagerHomePage />} />
        <Route path="/team/equipe" element={<MonEquipePage />} />
        <Route path="/team/equipe/mouvements" element={<TeamMovementsPage />} />
        <Route path="/team/equipe/annuaire-managers" element={<ManagerTeamPage />} />
        <Route path="/team/equipe/:id" element={<Vue360Page />} />
        <Route path="/team/temps" element={<TeamDashboardPage />} />
        <Route path="/team/temps/a-valider" element={<TeamApprovalsPage />} />
        <Route path="/team/temps/planning" element={<TeamPlanningPage />} />
        <Route path="/team/temps/anomalies" element={<TeamAttendancePage />} />
        <Route path="/team/temps/heures-sup" element={<TeamOvertimePage />} />
        <Route path="/team/temps/absences" element={<TeamAbsencesViewPage />} />
        <Route path="/team/temps/compteurs" element={<TeamCountersPage />} />
        <Route path="/team/temps/delegation" element={<TeamDelegationCoveragePage />} />
        <Route path="/team/temps/absence/new" element={<TeamAbsencePage />} />
        <Route path="/team/performance" element={<TeamPerformanceDashboardPage />} />
        <Route path="/team/performance/objectifs" element={<TeamOKRPage />} />
        <Route path="/team/performance/evaluations" element={<TeamEvaluationsPage />} />
        <Route path="/team/performance/1-1" element={<TeamOneOnOnePage />} />
        <Route path="/team/performance/calibration" element={<TeamCalibrationPage />} />
        <Route path="/team/performance/feedback-360" element={<TeamFeedback360Page />} />
        <Route path="/team/performance/reconnaissance" element={<TeamRecognitionPage />} />
        <Route path="/team/developpement" element={<TeamDevDashboardPage />} />
        <Route path="/team/developpement/competences" element={<TeamSkillsMatrixPage />} />
        <Route path="/team/developpement/souhaits" element={<TeamWishesPage />} />
        <Route path="/team/developpement/formations-a-valider" element={<TeamTrainingValidationsPage />} />
        <Route path="/team/developpement/formations-en-cours" element={<TeamTrainingsPage />} />
        <Route path="/team/developpement/plan-equipe" element={<TeamDevPlanPage />} />
        <Route path="/team/developpement/mobilite" element={<TeamMobilityPage />} />
        <Route path="/team/developpement/succession" element={<TeamSuccessionPage />} />
        <Route path="/team/developpement/mentorat" element={<TeamMentoringPage />} />
        <Route path="/team/recrutement" element={<TeamRecruitmentDashboardPage />} />
        <Route path="/team/recrutement/besoins" element={<TeamRecruitmentRequestsPage />} />
        <Route path="/team/recrutement/candidats" element={<TeamCandidatesPage />} />
        <Route path="/team/recrutement/integration" element={<TeamNewcomersPage />} />
        <Route path="/team/recrutement/sortants" element={<TeamLeaversPage />} />
        <Route path="/team/quotidien" element={<TeamDailyDashboardPage />} />
        <Route path="/team/quotidien/ndf-a-valider" element={<TeamExpenseValidationsPage />} />
        <Route path="/team/quotidien/demandes-equipe" element={<TeamRequestsPage />} />
        <Route path="/team/quotidien/courrier-manager" element={<ManagerCorrespondencePage />} />
        <Route path="/team/quotidien/climat" element={<TeamClimatePage />} />
        <Route path="/team/quotidien/conflits-planning" element={<SchedulingConflictsPage />} />
        <Route path="/team/quotidien/reconnaissance" element={<TeamRecognitionPage />} />
        {/* M8 Reporting & pilotage */}
        <Route path="/team/reporting" element={<ReportingDashboardPage />} />
        <Route path="/team/reporting/effectif" element={<ReportingHeadcountPage />} />
        <Route path="/team/reporting/temps" element={<ReportingTimePage />} />
        <Route path="/team/reporting/masse-salariale" element={<ReportingPayrollPage />} />
        <Route path="/team/reporting/formation" element={<ReportingTrainingPage />} />
        <Route path="/team/reporting/performance" element={<ReportingPerformancePage />} />
        <Route path="/team/reporting/climat" element={<ReportingClimatePage />} />
        <Route path="/team/reporting/dashboards" element={<ReportingDashboardsPage />} />
        <Route path="/team/reporting/exports" element={<ReportingExportsPage />} />
        {/* M9 Ma pratique managériale */}
        <Route path="/team/ma-pratique" element={<PracticeOverviewPage />} />
        <Route path="/team/ma-pratique/rituels" element={<PracticeRitualsPage />} />
        <Route path="/team/ma-pratique/feedback" element={<PracticeFeedbackPage />} />
        <Route path="/team/ma-pratique/formations" element={<PracticeTrainingsPage />} />
        <Route path="/team/ma-pratique/parcours" element={<PracticeCareerPage />} />
        <Route path="/team/ma-pratique/ressources" element={<PracticeResourcesPage />} />
        <Route path="/team/ma-pratique/efficacite" element={<PracticeEffectivenessPage />} />
        {/* M10 Paramètres manager */}
        <Route path="/team/parametres" element={<SettingsIndexPage />} />
        <Route path="/team/parametres/notifications" element={<SettingsNotificationsPage />} />
        <Route path="/team/parametres/delegations" element={<SettingsDelegationsPage />} />
        <Route path="/team/parametres/vue-equipe" element={<SettingsTeamViewPage />} />
        <Route path="/team/parametres/profondeur" element={<SettingsDepthPage />} />
        <Route path="/team/parametres/modeles" element={<SettingsTemplatesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
