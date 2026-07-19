import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, Outlet } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { PortalLayout } from './components/layout/PortalLayout';
import { ManagerLayout } from './components/layout/ManagerLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { ALL_MODULES } from './app/nav';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lz = (factory: () => Promise<any>, name: string) =>
  lazy(async () => ({ default: (await factory())[name] }));

function PageLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber/20 border-t-amber" />
    </div>
  );
}

function SuspenseOutlet() {
  return <Suspense fallback={<PageLoader />}><Outlet /></Suspense>;
}

function SSORedirect() {
  useEffect(() => { window.location.replace('https://atlas-studio.org/portal'); }, []);
  return null;
}

// ── Lazy pages ────────────────────────────────────────────────────────

// Top-level
const CockpitPage            = lz(() => import('./pages/CockpitPage'),            'CockpitPage');
const UnifiedCockpitDRHPage  = lz(() => import('./pages/UnifiedCockpitPage'),     'UnifiedCockpitDRHPage');
const LandingPage            = lz(() => import('./pages/LandingPage'),            'LandingPage');
const WelcomeCockpitPage     = lz(() => import('./pages/WelcomeCockpitPage'),     'WelcomeCockpitPage');
const AdminWorkspacePage     = lz(() => import('./pages/admin/AdminWorkspacePage'),'AdminWorkspacePage');
const BackOfficeQueuePage    = lz(() => import('./pages/backoffice/BackOfficeQueuePage'), 'BackOfficeQueuePage');
const ReportsPage            = lz(() => import('./pages/Reports'),                'ReportsPage');
const WhatIfSimulatorPage    = lz(() => import('./pages/WhatIfSimulatorPage'),    'WhatIfSimulatorPage');
const WhatIfComparePage      = lz(() => import('./pages/WhatIfComparePage'),      'WhatIfComparePage');
const SSOAuthPage            = lz(() => import('./pages/SSOAuthPage'),            'SSOAuthPage');
const JournalAuditPage       = lz(() => import('./pages/JournalAuditPage'),       'JournalAuditPage');
const SelfServicePage        = lz(() => import('./pages/SelfServicePage'),        'SelfServicePage');

// Collaborateurs
const CollaborateursPage     = lz(() => import('./pages/CollaborateursPage'),     'CollaborateursPage');
const EmployeeDossierPage    = lz(() => import('./pages/EmployeeDossierPage'),    'EmployeeDossierPage');
const AmendmentDossierPage   = lz(() => import('./pages/AmendmentDossierPage'),   'AmendmentDossierPage');
const ExitDossierPage        = lz(() => import('./pages/ExitDossierPage'),        'ExitDossierPage');
const NewEmployeeWizard      = lz(() => import('./pages/NewEmployeeWizard'),      'NewEmployeeWizard');
const ImportEmployeesWizard  = lz(() => import('./pages/ImportEmployeesWizard'),  'ImportEmployeesWizard');
const DemandesModifPage      = lz(() => import('./pages/DemandesModifPage'),      'DemandesModifPage');
const TempsAbsencesPage      = lz(() => import('./pages/TempsAbsencesPage'),      'TempsAbsencesPage');
const ParametresPage         = lz(() => import('./pages/ParametresPage'),         'ParametresPage');
const RubriquesPage          = lz(() => import('./pages/RubriquesPage'),          'RubriquesPage');
const NotesFraisPage         = lz(() => import('./pages/NotesFraisPage'),         'NotesFraisPage');
const CompetencesPage        = lz(() => import('./pages/CompetencesPage'),        'CompetencesPage');

// M3 Paie
const CockpitPaiePage        = lz(() => import('./pages/paie/CockpitPaiePage'),        'CockpitPaiePage');
const CyclesPage             = lz(() => import('./pages/paie/CyclesPage'),             'CyclesPage');
const DossierPaiePage        = lz(() => import('./pages/paie/DossierPaiePage'),        'DossierPaiePage');
const SaisieVariablesPage    = lz(() => import('./pages/paie/SaisieVariablesPage'),    'SaisieVariablesPage');
const CalculPage             = lz(() => import('./pages/paie/CalculPage'),             'CalculPage');
const ValidationPaiePage     = lz(() => import('./pages/paie/ValidationPaiePage'),     'ValidationPaiePage');
const JournalPaiePage        = lz(() => import('./pages/paie/JournalPaiePage'),        'JournalPaiePage');
const VirementsPage          = lz(() => import('./pages/paie/VirementsPage'),          'VirementsPage');
const BulletinsPage          = lz(() => import('./pages/paie/BulletinsPage'),          'BulletinsPage');
const DeclarationsPage       = lz(() => import('./pages/paie/DeclarationsPage'),       'DeclarationsPage');
const ComptabilitePage       = lz(() => import('./pages/paie/ComptabilitePage'),       'ComptabilitePage');
const RegularisationsPage    = lz(() => import('./pages/paie/RegularisationsPage'),    'RegularisationsPage');
const ModelesPage            = lz(() => import('./pages/paie/ModelesPage'),            'ModelesPage');
const ReferentielsPage       = lz(() => import('./pages/paie/ReferentielsPage'),       'ReferentielsPage');
const ReportingPaiePage      = lz(() => import('./pages/paie/ReportingPaiePage'),      'ReportingPaiePage');
const AuditPaiePage          = lz(() => import('./pages/paie/AuditPaiePage'),          'AuditPaiePage');
const ParametresPaiePage     = lz(() => import('./pages/paie/ParametresPaiePage'),     'ParametresPaiePage');
const SimulationPaiePage     = lz(() => import('./pages/paie/SimulationPaiePage'),     'SimulationPaiePage');
const ConfigurationPaiePage  = lz(() => import('./pages/paie/ConfigurationPaiePage'),  'ConfigurationPaiePage');
const RegimesParametresPage  = lz(() => import('./pages/payroll/RegimesParametresPage'), 'RegimesParametresPage');

// M4 Admin RH
const CockpitAdminRhPage    = lz(() => import('./pages/admin/CockpitAdminRhPage'),  'CockpitAdminRhPage');
const ContratsAdminPage     = lz(() => import('./pages/admin/ContratsPage'),        'ContratsPage');
const PeriodeEssaiPage      = lz(() => import('./pages/admin/PeriodeEssaiPage'),    'PeriodeEssaiPage');
const DisciplinairePage     = lz(() => import('./pages/admin/DisciplinairePage'),   'DisciplinairePage');
const CertificatsPage       = lz(() => import('./pages/admin/CertificatsPage'),     'CertificatsPage');
const RepresentationPage    = lz(() => import('./pages/admin/RepresentationPage'),  'RepresentationPage');
const ObligationsPage       = lz(() => import('./pages/admin/ObligationsPage'),     'ObligationsPage');
const ExpatriesPage         = lz(() => import('./pages/admin/ExpatriesPage'),       'ExpatriesPage');
const ParametresAdminPage   = lz(() => import('./pages/admin/ParametresAdminPage'), 'ParametresAdminPage');

// M5 Recrutement
const CockpitRecrutPage      = lz(() => import('./pages/recrut/CockpitRecrutPage'),      'CockpitRecrutPage');
const BesoinsPage            = lz(() => import('./pages/recrut/BesoinsPage'),            'BesoinsPage');
const BesoinDetailPage       = lz(() => import('./pages/recrut/BesoinDetailPage'),       'BesoinDetailPage');
const PostesPage             = lz(() => import('./pages/recrut/PostesPage'),             'PostesPage');
const PosteDetailPage        = lz(() => import('./pages/recrut/PosteDetailPage'),        'PosteDetailPage');
const CandidaturesPage       = lz(() => import('./pages/recrut/CandidaturesPage'),       'CandidaturesPage');
const CandidatPage           = lz(() => import('./pages/recrut/CandidatPage'),           'CandidatPage');
const VivierPage             = lz(() => import('./pages/recrut/VivierPage'),             'VivierPage');
const EntretiensPage         = lz(() => import('./pages/recrut/EntretiensPage'),         'EntretiensPage');
const OffresPage             = lz(() => import('./pages/recrut/OffresPage'),             'OffresPage');
const SourcingPage           = lz(() => import('./pages/recrut/SourcingPage'),           'SourcingPage');
const CooptationPage         = lz(() => import('./pages/recrut/CooptationPage'),         'CooptationPage');
const IntegrationPage        = lz(() => import('./pages/recrut/IntegrationPage'),        'IntegrationPage');
const ReportingRecrutPage    = lz(() => import('./pages/recrut/ReportingRecrutPage'),    'ReportingRecrutPage');
const RgpdPage               = lz(() => import('./pages/recrut/RgpdPage'),               'RgpdPage');
const ParametresRecrutPage   = lz(() => import('./pages/recrut/ParametresRecrutPage'),   'ParametresRecrutPage');
const TestsPage              = lz(() => import('./pages/recrut/TestsPage'),              'TestsPage');
const MarqueEmployeurPage    = lz(() => import('./pages/recrut/MarqueEmployeurPage'),    'MarqueEmployeurPage');
const AuditRecrutPage        = lz(() => import('./pages/recrut/AuditRecrutPage'),        'AuditRecrutPage');

// M6 Onboarding
const CockpitOnboardingPage    = lz(() => import('./pages/onboarding/CockpitOnboardingPage'),    'CockpitOnboardingPage');
const ArrivantsPage            = lz(() => import('./pages/onboarding/ArrivantsPage'),            'ArrivantsPage');
const ArrivantDetailPage       = lz(() => import('./pages/onboarding/ArrivantDetailPage'),       'ArrivantDetailPage');
const ParcoursPage             = lz(() => import('./pages/onboarding/ParcoursPage'),             'ParcoursPage');
const TachesPage               = lz(() => import('./pages/onboarding/TachesPage'),               'TachesPage');
const BuddyPage                = lz(() => import('./pages/onboarding/BuddyPage'),                'BuddyPage');
const FormationsPage           = lz(() => import('./pages/onboarding/FormationsPage'),           'FormationsPage');
const DocumentsPage            = lz(() => import('./pages/onboarding/DocumentsPage'),            'DocumentsPage');
const PulsePage                = lz(() => import('./pages/onboarding/PulsePage'),                'PulsePage');
const ValidationPePage         = lz(() => import('./pages/onboarding/ValidationPePage'),         'ValidationPePage');
const ReportingOnboardingPage  = lz(() => import('./pages/onboarding/ReportingOnboardingPage'),  'ReportingOnboardingPage');
const ParametresOnboardingPage = lz(() => import('./pages/onboarding/ParametresOnboardingPage'), 'ParametresOnboardingPage');
const PreBoardingPage          = lz(() => import('./pages/onboarding/PreBoardingPage'),          'PreBoardingPage');
const MobiliteInternePage      = lz(() => import('./pages/onboarding/MobiliteInternePage'),      'MobiliteInternePage');
const OnboardingExpatPage      = lz(() => import('./pages/onboarding/OnboardingExpatPage'),      'OnboardingExpatPage');
const Feedback360Page          = lz(() => import('./pages/onboarding/Feedback360Page'),          'Feedback360Page');
const AuditM6Page              = lz(() => import('./pages/onboarding/AuditM6Page'),              'AuditM6Page');

// M7 OKR
const CockpitOkrPage          = lz(() => import('./pages/okr/CockpitOkrPage'),          'CockpitOkrPage');
const CyclesOkrPage           = lz(() => import('./pages/okr/CyclesOkrPage'),           'CyclesOkrPage');
const ObjectifsEntreprisePage = lz(() => import('./pages/okr/ObjectifsLevelPage'),      'ObjectifsEntreprisePage');
const ObjectifsDepartementPage= lz(() => import('./pages/okr/ObjectifsLevelPage'),      'ObjectifsDepartementPage');
const ObjectifsEquipePage     = lz(() => import('./pages/okr/ObjectifsLevelPage'),      'ObjectifsEquipePage');
const ObjectifsIndividuelPage = lz(() => import('./pages/okr/ObjectifsLevelPage'),      'ObjectifsIndividuelPage');
const KeyResultsPage          = lz(() => import('./pages/okr/KeyResultsPage'),          'KeyResultsPage');
const CheckInsPage            = lz(() => import('./pages/okr/CheckInsPage'),            'CheckInsPage');
const AlignementPage          = lz(() => import('./pages/okr/AlignementPage'),          'AlignementPage');
const RevuePage               = lz(() => import('./pages/okr/RevuePage'),               'RevuePage');
const ReportingOkrPage        = lz(() => import('./pages/okr/ReportingOkrPage'),        'ReportingOkrPage');
const ParametresOkrPage       = lz(() => import('./pages/okr/ParametresOkrPage'),       'ParametresOkrPage');
const MethodologieOkrPage     = lz(() => import('./pages/okr/OkrEnrichmentPages'),      'MethodologieOkrPage');
const NotationOkrPage         = lz(() => import('./pages/okr/OkrEnrichmentPages'),      'NotationOkrPage');
const RetrospectiveOkrPage    = lz(() => import('./pages/okr/OkrEnrichmentPages'),      'RetrospectiveOkrPage');
const GouvernanceOkrPage      = lz(() => import('./pages/okr/OkrEnrichmentPages'),      'GouvernanceOkrPage');
const IntegrationOkrPage      = lz(() => import('./pages/okr/OkrEnrichmentPages'),      'IntegrationOkrPage');
const AuditOkrPage            = lz(() => import('./pages/okr/OkrEnrichmentPages'),      'AuditOkrPage');

// M8 Évaluations
const CockpitEvalPage       = lz(() => import('./pages/eval/CockpitEvalPage'),       'CockpitEvalPage');
const TalentGridPage        = lz(() => import('./pages/eval/TalentGridPage'),        'TalentGridPage');
const EvaluationDetailPage  = lz(() => import('./pages/eval/EvaluationDetailPage'),  'EvaluationDetailPage');
const CyclesEvalPage        = lz(() => import('./pages/eval/OtherEvalPages'),        'CyclesEvalPage');
const CampagnesPage         = lz(() => import('./pages/eval/OtherEvalPages'),        'CampagnesPage');
const EvaluationsListPage   = lz(() => import('./pages/eval/OtherEvalPages'),        'EvaluationsListPage');
const Feedback360EvalPage   = lz(() => import('./pages/eval/OtherEvalPages'),        'Feedback360EvalPage');
const CalibrationPage       = lz(() => import('./pages/eval/OtherEvalPages'),        'CalibrationPage');
const PlansDevPage          = lz(() => import('./pages/eval/OtherEvalPages'),        'PlansDevPage');
const OneOnOnePage          = lz(() => import('./pages/eval/OtherEvalPages'),        'OneOnOnePage');
const ReportingEvalPage     = lz(() => import('./pages/eval/OtherEvalPages'),        'ReportingEvalPage');
const ParametresEvalPage    = lz(() => import('./pages/eval/OtherEvalPages'),        'ParametresEvalPage');
const CycleAnnuelEvalPage   = lz(() => import('./pages/eval/EvalEnrichmentPages'),   'CycleAnnuelEvalPage');
const GrilleEvaluationPage  = lz(() => import('./pages/eval/EvalEnrichmentPages'),   'GrilleEvaluationPage');
const CalibrationEvalPage   = lz(() => import('./pages/eval/EvalEnrichmentPages'),   'CalibrationEvalPage');
const NotationFinalePage    = lz(() => import('./pages/eval/EvalEnrichmentPages'),   'NotationFinalePage');
const EquiteEvalPage        = lz(() => import('./pages/eval/EvalEnrichmentPages'),   'EquiteEvalPage');
const AuditEvalPage         = lz(() => import('./pages/eval/EvalEnrichmentPages'),   'AuditEvalPage');

// M9 Compétences
const CartographieCompetencesPage  = lz(() => import('./pages/competences/CompetencesEnrichmentPages'), 'CartographieCompetencesPage');
const TaxonomieCompetencesPage     = lz(() => import('./pages/competences/CompetencesEnrichmentPages'), 'TaxonomieCompetencesPage');
const GapAnalysisPage              = lz(() => import('./pages/competences/CompetencesEnrichmentPages'), 'GapAnalysisPage');
const SpofPage                     = lz(() => import('./pages/competences/CompetencesEnrichmentPages'), 'SpofPage');
const HeatmapCompetencesPage       = lz(() => import('./pages/competences/CompetencesEnrichmentPages'), 'HeatmapCompetencesPage');
const ReferentielMetiersPage       = lz(() => import('./pages/competences/CompetencesEnrichmentPages'), 'ReferentielMetiersPage');
const ParametresCompetencesPage    = lz(() => import('./pages/competences/CompetencesEnrichmentPages'), 'ParametresCompetencesPage');
const AuditM9Page                  = lz(() => import('./pages/competences/CompetencesSprint1Pages'),    'AuditM9Page');
const AutoEvalCompetencesPage      = lz(() => import('./pages/competences/CompetencesSprint1Pages'),    'AutoEvalCompetencesPage');
const ManagerEvalCompetencesPage   = lz(() => import('./pages/competences/CompetencesSprint1Pages'),    'ManagerEvalCompetencesPage');
const PdcPage                      = lz(() => import('./pages/competences/CompetencesSprint1Pages'),    'PdcPage');
const TalentsMobilitePage          = lz(() => import('./pages/competences/CompetencesSprint1Pages'),    'TalentsMobilitePage');
const ReadinessPage                = lz(() => import('./pages/competences/ReadinessPage'),              'ReadinessPage');

// M10 Carrières
const CockpitCarrieresPage    = lz(() => import('./pages/carrieres/CarrieresPages'),      'CockpitCarrieresPage');
const FilieresPage            = lz(() => import('./pages/carrieres/CarrieresPages'),      'FilieresPage');
const TrajectoiresPage        = lz(() => import('./pages/carrieres/CarrieresPages'),      'TrajectoiresPage');
const PostesClesPage          = lz(() => import('./pages/carrieres/CarrieresPages'),      'PostesClesPage');
const SuccessionPage          = lz(() => import('./pages/carrieres/CarrieresPages'),      'SuccessionPage');
const HautsPotentielsPage     = lz(() => import('./pages/carrieres/CarrieresPages'),      'HautsPotentielsPage');
const MentoratPage            = lz(() => import('./pages/carrieres/CarrieresPages'),      'MentoratPage');
const CartographiePage        = lz(() => import('./pages/carrieres/CarrieresPages'),      'CartographiePage');
const MobiliteCarrieresPage   = lz(() => import('./pages/carrieres/CarrieresPages'),      'MobiliteCarrieresPage');
const ReportingCarrieresPage  = lz(() => import('./pages/carrieres/CarrieresPages'),      'ReportingCarrieresPage');
const ParametresCarrieresPage = lz(() => import('./pages/carrieres/CarrieresPages'),      'ParametresCarrieresPage');
const JobArchitecturePage     = lz(() => import('./pages/carrieres/CarrieresSprint1Pages'),'JobArchitecturePage');
const TalentReviewPage        = lz(() => import('./pages/carrieres/CarrieresSprint1Pages'),'TalentReviewPage');
const TalentPoolsPage         = lz(() => import('./pages/carrieres/CarrieresSprint1Pages'),'TalentPoolsPage');
const PromotionsPage          = lz(() => import('./pages/carrieres/CarrieresSprint1Pages'),'PromotionsPage');
const AlumniPage              = lz(() => import('./pages/carrieres/CarrieresSprint1Pages'),'AlumniPage');
const AuditM10Page            = lz(() => import('./pages/carrieres/CarrieresSprint1Pages'),'AuditM10Page');
const CareerFrameworksPage    = lz(() => import('./pages/carrieres/CarrieresSprint2Pages'),'CareerFrameworksPage');
const CareerPathsIndividualsPage = lz(() => import('./pages/carrieres/CarrieresSprint2Pages'),'CareerPathsIndividualsPage');
const SuccessionEnrichedPage  = lz(() => import('./pages/carrieres/CarrieresSprint2Pages'),'SuccessionEnrichedPage');
const MentoratSponsorshipPage = lz(() => import('./pages/carrieres/CarrieresSprint2Pages'),'MentoratSponsorshipPage');
const ExpatriationPage        = lz(() => import('./pages/carrieres/CarrieresSprint2Pages'),'ExpatriationPage');

// M11 Formation
const CockpitFormationPage    = lz(() => import('./pages/formation/FormationPages'),       'CockpitFormationPage');
const CataloguePage           = lz(() => import('./pages/formation/FormationPages'),       'CataloguePage');
const PlanFormationPage       = lz(() => import('./pages/formation/FormationPages'),       'PlanFormationPage');
const SessionsPage            = lz(() => import('./pages/formation/FormationPages'),       'SessionsPage');
const InscriptionsPage        = lz(() => import('./pages/formation/FormationPages'),       'InscriptionsPage');
const EvaluationsKirkpatrickPage = lz(() => import('./pages/formation/FormationPages'),    'EvaluationsKirkpatrickPage');
const CertificationsPage      = lz(() => import('./pages/formation/FormationPages'),       'CertificationsPage');
const RoiPage                 = lz(() => import('./pages/formation/FormationPages'),       'RoiPage');
const CompetencesFormationPage= lz(() => import('./pages/formation/FormationPages'),       'CompetencesFormationPage');
const FdfpPage                = lz(() => import('./pages/formation/FormationPages'),       'FdfpPage');
const ReportingFormationPage  = lz(() => import('./pages/formation/FormationPages'),       'ReportingFormationPage');
const ParametresFormationPage = lz(() => import('./pages/formation/FormationPages'),       'ParametresFormationPage');
const ParcoursFormationPage   = lz(() => import('./pages/formation/FormationSprint1Pages'),'ParcoursFormationPage');
const PifPage                 = lz(() => import('./pages/formation/FormationSprint1Pages'),'PifPage');
const ModalitesPage           = lz(() => import('./pages/formation/FormationSprint1Pages'),'ModalitesPage');
const LmsPage                 = lz(() => import('./pages/formation/FormationSprint1Pages'),'LmsPage');
const FormateursPage          = lz(() => import('./pages/formation/FormationSprint1Pages'),'FormateursPage');
const AuditM11Page            = lz(() => import('./pages/formation/FormationSprint1Pages'),'AuditM11Page');

// M12 Conformité
const CockpitConformitePage     = lz(() => import('./pages/conformite/ConformitePages'), 'CockpitConformitePage');
const DuerPage                  = lz(() => import('./pages/conformite/ConformitePages'), 'DuerPage');
const RpsPage                   = lz(() => import('./pages/conformite/ConformitePages'), 'RpsPage');
const AtMpPage                  = lz(() => import('./pages/conformite/ConformitePages'), 'AtMpPage');
const RegistrePage              = lz(() => import('./pages/conformite/ConformitePages'), 'RegistrePage');
const DeclarationsConformitePage= lz(() => import('./pages/conformite/ConformitePages'), 'DeclarationsPage');
const VisitesMedicalesPage      = lz(() => import('./pages/conformite/ConformitePages'), 'VisitesMedicalesPage');
const HabilitationsPage         = lz(() => import('./pages/conformite/ConformitePages'), 'HabilitationsPage');
const AuditsPage                = lz(() => import('./pages/conformite/ConformitePages'), 'AuditsPage');
const InspectionsConformitePage = lz(() => import('./pages/conformite/ConformitePages'), 'InspectionsPage');
const ConservationPage          = lz(() => import('./pages/conformite/ConformitePages'), 'ConservationPage');
const ParametresConformitePage  = lz(() => import('./pages/conformite/ConformitePages'), 'ParametresConformitePage');
const GouvernancePage           = lz(() => import('./pages/conformite/ConformitePages'), 'GouvernancePage');
const ReportingPage             = lz(() => import('./pages/conformite/ConformitePages'), 'ReportingPage');
const AlertesConformitePage     = lz(() => import('./pages/conformite/ConformitePages'), 'AlertesConformitePage');

// Performance & Bonus
const CockpitPerformancePage = lz(() => import('./pages/performance/CockpitPerformancePage'), 'CockpitPerformancePage');
const CockpitBonusPage       = lz(() => import('./pages/bonus/CockpitBonusPage'),             'CockpitBonusPage');

// Portail collaborateur
const PortalHomePage       = lz(() => import('./pages/portal/PortalHomePage'),       'PortalHomePage');
const MonProfilPage        = lz(() => import('./pages/portal/MonProfilPage'),        'MonProfilPage');
const MaPaiePage           = lz(() => import('./pages/portal/MaPaiePage'),           'MaPaiePage');
const MesDemandesPage      = lz(() => import('./pages/portal/MesDemandesPage'),      'MesDemandesPage');
const MonCourrierPage      = lz(() => import('./pages/portal/MonCourrierPage'),      'MonCourrierPage');
const MesFraisPage         = lz(() => import('./pages/portal/MesFraisPage'),         'MesFraisPage');
const MaPerformancePage    = lz(() => import('./pages/portal/MaPerformancePage'),    'MaPerformancePage');
const MonDeveloppementPage = lz(() => import('./pages/portal/MonDeveloppementPage'), 'MonDeveloppementPage');
const MonSuiviSantePage    = lz(() => import('./pages/portal/MonSuiviSantePage'),    'MonSuiviSantePage');
const MonOnboardingPage    = lz(() => import('./pages/portal/MonOnboardingPage'),    'MonOnboardingPage');
const MesParametresPage    = lz(() => import('./pages/portal/MesParametresPage'),    'MesParametresPage');
const MesDocumentsPage     = lz(() => import('./pages/portal/MesDocumentsPage'),     'MesDocumentsPage');
const MesSanctionsPage     = lz(() => import('./pages/portal/MesSanctionsPage'),     'MesSanctionsPage');

// ESS
const MonTempsPage      = lz(() => import('./pages/ess/MonTempsPage'),      'MonTempsPage');
const MesCongesPage     = lz(() => import('./pages/ess/MesCongesPage'),     'MesCongesPage');
const PoserDemandePage  = lz(() => import('./pages/ess/PoserDemandePage'),  'PoserDemandePage');
const MonPointagePage   = lz(() => import('./pages/ess/MonPointagePage'),   'MonPointagePage');
const MonPlanningPage   = lz(() => import('./pages/ess/MonPlanningPage'),   'MonPlanningPage');
const MesHeuresSupPage  = lz(() => import('./pages/ess/MesHeuresSupPage'),  'MesHeuresSupPage');
const MesDelegationPage = lz(() => import('./pages/ess/MesDelegationPage'), 'MesDelegationPage');

// MSS — Portail manager
const ManagerHomePage                = lz(() => import('./pages/mss/ManagerHomePage'),                'ManagerHomePage');
const TeamDashboardPage              = lz(() => import('./pages/mss/TeamDashboardPage'),              'TeamDashboardPage');
const TeamApprovalsPage              = lz(() => import('./pages/mss/TeamApprovalsPage'),              'TeamApprovalsPage');
const TeamPlanningPage               = lz(() => import('./pages/mss/TeamPlanningPage'),               'TeamPlanningPage');
const TeamAttendancePage             = lz(() => import('./pages/mss/TeamAttendancePage'),             'TeamAttendancePage');
const TeamOvertimePage               = lz(() => import('./pages/mss/TeamOvertimePage'),               'TeamOvertimePage');
const TeamAbsencePage                = lz(() => import('./pages/mss/TeamAbsencePage'),                'TeamAbsencePage');
const TeamAbsencesViewPage           = lz(() => import('./pages/mss/TeamAbsencesViewPage'),           'TeamAbsencesViewPage');
const TeamCountersPage               = lz(() => import('./pages/mss/TeamCountersPage'),               'TeamCountersPage');
const TeamDelegationCoveragePage     = lz(() => import('./pages/mss/TeamDelegationCoveragePage'),     'TeamDelegationCoveragePage');
const TeamPerformanceDashboardPage   = lz(() => import('./pages/mss/TeamPerformanceDashboardPage'),   'TeamPerformanceDashboardPage');
const TeamOKRPage                    = lz(() => import('./pages/mss/TeamOKRPage'),                    'TeamOKRPage');
const TeamEvaluationsPage            = lz(() => import('./pages/mss/TeamEvaluationsPage'),            'TeamEvaluationsPage');
const TeamOneOnOnePage               = lz(() => import('./pages/mss/TeamOneOnOnePage'),               'TeamOneOnOnePage');
const TeamCalibrationPage            = lz(() => import('./pages/mss/TeamCalibrationPage'),            'TeamCalibrationPage');
const TeamFeedback360Page            = lz(() => import('./pages/mss/TeamFeedback360Page'),            'TeamFeedback360Page');
const TeamRecognitionPage            = lz(() => import('./pages/mss/TeamRecognitionPage'),            'TeamRecognitionPage');
const TeamDevDashboardPage           = lz(() => import('./pages/mss/TeamDevDashboardPage'),           'TeamDevDashboardPage');
const TeamSkillsMatrixPage           = lz(() => import('./pages/mss/TeamSkillsMatrixPage'),           'TeamSkillsMatrixPage');
const TeamWishesPage                 = lz(() => import('./pages/mss/TeamWishesPage'),                 'TeamWishesPage');
const TeamTrainingValidationsPage    = lz(() => import('./pages/mss/TeamTrainingValidationsPage'),    'TeamTrainingValidationsPage');
const TeamTrainingsPage              = lz(() => import('./pages/mss/TeamTrainingsPage'),              'TeamTrainingsPage');
const TeamDevPlanPage                = lz(() => import('./pages/mss/TeamDevPlanPage'),                'TeamDevPlanPage');
const TeamMobilityPage               = lz(() => import('./pages/mss/TeamMobilityPage'),               'TeamMobilityPage');
const TeamSuccessionPage             = lz(() => import('./pages/mss/TeamSuccessionPage'),             'TeamSuccessionPage');
const TeamMentoringPage              = lz(() => import('./pages/mss/TeamMentoringPage'),              'TeamMentoringPage');
const TeamRecruitmentDashboardPage   = lz(() => import('./pages/mss/TeamRecruitmentDashboardPage'),   'TeamRecruitmentDashboardPage');
const TeamRecruitmentRequestsPage    = lz(() => import('./pages/mss/TeamRecruitmentRequestsPage'),    'TeamRecruitmentRequestsPage');
const TeamCandidatesPage             = lz(() => import('./pages/mss/TeamCandidatesPage'),             'TeamCandidatesPage');
const TeamNewcomersPage              = lz(() => import('./pages/mss/TeamNewcomersPage'),              'TeamNewcomersPage');
const TeamLeaversPage                = lz(() => import('./pages/mss/TeamLeaversPage'),                'TeamLeaversPage');
const TeamDailyDashboardPage         = lz(() => import('./pages/mss/TeamDailyDashboardPage'),         'TeamDailyDashboardPage');
const TeamExpenseValidationsPage     = lz(() => import('./pages/mss/TeamExpenseValidationsPage'),     'TeamExpenseValidationsPage');
const TeamRequestsPage               = lz(() => import('./pages/mss/TeamRequestsPage'),               'TeamRequestsPage');
const ManagerCorrespondencePage      = lz(() => import('./pages/mss/ManagerCorrespondencePage'),      'ManagerCorrespondencePage');
const TeamClimatePage                = lz(() => import('./pages/mss/TeamClimatePage'),                'TeamClimatePage');
const SchedulingConflictsPage        = lz(() => import('./pages/mss/SchedulingConflictsPage'),        'SchedulingConflictsPage');
const MonEquipePage                  = lz(() => import('./pages/mss/MonEquipePage'),                  'MonEquipePage');
const Vue360Page                     = lz(() => import('./pages/mss/Vue360Page'),                     'Vue360Page');
const TeamMovementsPage              = lz(() => import('./pages/mss/TeamMovementsPage'),              'TeamMovementsPage');
const ManagerTeamPage                = lz(() => import('./pages/mss/ManagerTeamPage'),                'ManagerTeamPage');
const ReportingDashboardPage         = lz(() => import('./pages/mss/ReportingDashboardPage'),         'ReportingDashboardPage');
const ReportingHeadcountPage         = lz(() => import('./pages/mss/ReportingHeadcountPage'),         'ReportingHeadcountPage');
const ReportingTimePage              = lz(() => import('./pages/mss/ReportingTimePage'),              'ReportingTimePage');
const ReportingPayrollPage           = lz(() => import('./pages/mss/ReportingPayrollPage'),           'ReportingPayrollPage');
const ReportingTrainingPage          = lz(() => import('./pages/mss/ReportingTrainingPage'),          'ReportingTrainingPage');
const ReportingPerformancePage       = lz(() => import('./pages/mss/ReportingPerformancePage'),       'ReportingPerformancePage');
const ReportingClimatePage           = lz(() => import('./pages/mss/ReportingClimatePage'),           'ReportingClimatePage');
const ReportingDashboardsPage        = lz(() => import('./pages/mss/ReportingDashboardsPage'),        'ReportingDashboardsPage');
const ReportingExportsPage           = lz(() => import('./pages/mss/ReportingExportsPage'),           'ReportingExportsPage');
const PracticeOverviewPage           = lz(() => import('./pages/mss/PracticeOverviewPage'),           'PracticeOverviewPage');
const PracticeRitualsPage            = lz(() => import('./pages/mss/PracticeRitualsPage'),            'PracticeRitualsPage');
const PracticeFeedbackPage           = lz(() => import('./pages/mss/PracticeFeedbackPage'),           'PracticeFeedbackPage');
const PracticeTrainingsPage          = lz(() => import('./pages/mss/PracticeTrainingsPage'),          'PracticeTrainingsPage');
const PracticeCareerPage             = lz(() => import('./pages/mss/PracticeCareerPage'),             'PracticeCareerPage');
const PracticeResourcesPage          = lz(() => import('./pages/mss/PracticeResourcesPage'),          'PracticeResourcesPage');
const PracticeEffectivenessPage      = lz(() => import('./pages/mss/PracticeEffectivenessPage'),      'PracticeEffectivenessPage');
const SettingsIndexPage              = lz(() => import('./pages/mss/SettingsIndexPage'),              'SettingsIndexPage');
const SettingsNotificationsPage      = lz(() => import('./pages/mss/SettingsNotificationsPage'),      'SettingsNotificationsPage');
const SettingsDelegationsPage        = lz(() => import('./pages/mss/SettingsDelegationsPage'),        'SettingsDelegationsPage');
const SettingsTeamViewPage           = lz(() => import('./pages/mss/SettingsTeamViewPage'),           'SettingsTeamViewPage');
const SettingsDepthPage              = lz(() => import('./pages/mss/SettingsDepthPage'),              'SettingsDepthPage');
const SettingsTemplatesPage          = lz(() => import('./pages/mss/SettingsTemplatesPage'),          'SettingsTemplatesPage');

// ── READY map (cockpit paths → lazy elements) ─────────────────────────

const READY: Record<string, JSX.Element> = {
  '/': <CockpitPage />,
  '/collaborateurs': <CollaborateursPage />,
  '/temps': <TempsAbsencesPage />,
  '/frais': <NotesFraisPage />,
  '/paie': <CockpitPaiePage />,
  '/hr/actes': <CockpitAdminRhPage />,
  '/recrutement': <CockpitRecrutPage />,
  '/onboarding': <CockpitOnboardingPage />,
  '/performance': <CockpitPerformancePage />,
  '/bonus': <CockpitBonusPage />,
  '/objectifs': <CockpitOkrPage />,
  '/evaluations': <CockpitEvalPage />,
  '/carrieres': <CockpitCarrieresPage />,
  '/formation': <CockpitFormationPage />,
  '/competences': <CompetencesPage />,
  '/conformite': <CockpitConformitePage />,
  '/moi': <SelfServicePage />,
  '/cockpit-360': <UnifiedCockpitDRHPage />,
};

function App() {
  return (
    <Routes>
      {/* Auth — hors layouts */}
      <Route path="/login" element={<SSORedirect />} />
      <Route path="/auth/invitation" element={<SSORedirect />} />
      <Route path="/auth" element={<Suspense fallback={<PageLoader />}><SSOAuthPage /></Suspense>} />
      <Route path="/landing" element={<Suspense fallback={<PageLoader />}><LandingPage /></Suspense>} />
      <Route path="/accueil" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><WelcomeCockpitPage /></Suspense></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireRole="super_admin"><Suspense fallback={<PageLoader />}><AdminWorkspacePage /></Suspense></ProtectedRoute>} />

      {/* BACK-OFFICE — AppLayout */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route element={<SuspenseOutlet />}>
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
          {/* M3 PAIE */}
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
          <Route path="/paie/regimes" element={<RegimesParametresPage />} />
          <Route path="/audit" element={<JournalAuditPage />} />
          {/* M4 Admin RH */}
          <Route path="/hr/actes/contrats" element={<ContratsAdminPage />} />
          <Route path="/hr/actes/periode-essai" element={<PeriodeEssaiPage />} />
          <Route path="/hr/actes/disciplinaire" element={<DisciplinairePage />} />
          <Route path="/hr/actes/certificats" element={<CertificatsPage />} />
          <Route path="/hr/actes/representation" element={<RepresentationPage />} />
          <Route path="/hr/actes/obligations" element={<ObligationsPage />} />
          <Route path="/hr/actes/expatries" element={<ExpatriesPage />} />
          <Route path="/hr/actes/parametres" element={<ParametresAdminPage />} />
          {/* M5 Recrutement */}
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
          {/* M6 Onboarding */}
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
          <Route path="/objectifs/methodologie" element={<MethodologieOkrPage />} />
          <Route path="/objectifs/notation" element={<NotationOkrPage />} />
          <Route path="/objectifs/retrospective" element={<RetrospectiveOkrPage />} />
          <Route path="/objectifs/gouvernance" element={<GouvernanceOkrPage />} />
          <Route path="/objectifs/integration" element={<IntegrationOkrPage />} />
          <Route path="/objectifs/audit" element={<AuditOkrPage />} />
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
          <Route path="/evaluations/cycle-annuel" element={<CycleAnnuelEvalPage />} />
          <Route path="/evaluations/grille" element={<GrilleEvaluationPage />} />
          <Route path="/evaluations/notation" element={<NotationFinalePage />} />
          <Route path="/evaluations/equite" element={<EquiteEvalPage />} />
          <Route path="/evaluations/audit" element={<AuditEvalPage />} />
          {/* M9 Compétences */}
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
          <Route path="/competences/readiness" element={<ReadinessPage />} />
          <Route path="/competences/audit" element={<AuditM9Page />} />
          {/* M10 Carrières */}
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
          {/* M11 Formation */}
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
          <Route path="/formation/parcours" element={<ParcoursFormationPage />} />
          <Route path="/formation/pif" element={<PifPage />} />
          <Route path="/formation/modalites" element={<ModalitesPage />} />
          <Route path="/formation/lms" element={<LmsPage />} />
          <Route path="/formation/formateurs" element={<FormateursPage />} />
          <Route path="/formation/audit" element={<AuditM11Page />} />
          {/* M12 Conformité */}
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
          <Route path="/conformite/gouvernance" element={<GouvernancePage />} />
          <Route path="/conformite/reporting" element={<ReportingPage />} />
          <Route path="/conformite/alertes" element={<AlertesConformitePage />} />
          <Route path="/conformite/parametres" element={<ParametresConformitePage />} />
          {/* Divers */}
          <Route path="/hr/queue" element={<BackOfficeQueuePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/whatif" element={<WhatIfSimulatorPage />} />
          <Route path="/whatif/compare" element={<WhatIfComparePage />} />
          <Route path="*" element={<ComingSoonPage />} />
        </Route>
      </Route>

      {/* PORTAIL COLLABORATEUR */}
      <Route element={<ProtectedRoute requireRole="employee"><PortalLayout /></ProtectedRoute>}>
        <Route element={<SuspenseOutlet />}>
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
      </Route>

      {/* PORTAIL MANAGER (MSS) */}
      <Route element={<ProtectedRoute requireRole="manager"><ManagerLayout /></ProtectedRoute>}>
        <Route element={<SuspenseOutlet />}>
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
          {/* M8 Reporting */}
          <Route path="/team/reporting" element={<ReportingDashboardPage />} />
          <Route path="/team/reporting/effectif" element={<ReportingHeadcountPage />} />
          <Route path="/team/reporting/temps" element={<ReportingTimePage />} />
          <Route path="/team/reporting/masse-salariale" element={<ReportingPayrollPage />} />
          <Route path="/team/reporting/formation" element={<ReportingTrainingPage />} />
          <Route path="/team/reporting/performance" element={<ReportingPerformancePage />} />
          <Route path="/team/reporting/climat" element={<ReportingClimatePage />} />
          <Route path="/team/reporting/dashboards" element={<ReportingDashboardsPage />} />
          <Route path="/team/reporting/exports" element={<ReportingExportsPage />} />
          {/* M9 Ma pratique */}
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
      </Route>
    </Routes>
  );
}

export default App;
