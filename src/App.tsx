import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { CockpitPage } from './pages/CockpitPage';
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
import { ConformitePage } from './pages/ConformitePage';
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
import { ComingSoonPage } from './pages/ComingSoonPage';
import { ALL_MODULES } from './app/nav';

const READY: Record<string, JSX.Element> = {
  '/': <CockpitPage />,
  '/collaborateurs': <CollaborateursPage />,
  '/temps': <TempsAbsencesPage />,
  '/frais': <NotesFraisPage />,
  '/paie': <CockpitPaiePage />,
  '/competences': <CompetencesPage />,
  '/conformite': <ConformitePage />,
  '/moi': <SelfServicePage />,
};

function App() {
  return (
    <Routes>
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
