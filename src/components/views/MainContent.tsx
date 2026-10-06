import React from "react";
import DashboardView from "./DashboardView";
import DatasetExplorerView from "./DatasetExplorerView";
import DataIntegrationView from "./DataIntegrationView";
import DataQualityView from "./DataQualityView";
import DataCleaningView from "./DataCleaningView";
import StatisticsView from "./StatisticsView";
import EDAView from "./EDAView";
import StatisticalAnalysisView from "./StatisticalAnalysisView";
import FeatureEngineeringView from "./FeatureEngineeringView";
import TemporalAnalyticsView from "./TemporalAnalyticsView";
import CohortAnalyticsView from "./CohortAnalyticsView";
import AnomalyAnalysisView from "./AnomalyAnalysisView";
import EducationalInsightsView from "./EducationalInsightsView";
import DigitalTwinView from "./DigitalTwinView";
import InterventionSimulatorView from "./InterventionSimulatorView";
import MLModelHubView from "./MLModelHubView";
import AboutView from "./AboutView";

interface MainContentProps {
  activePage?: string;
  setActivePage?: (page: string) => void;
}

export default function MainContent({ activePage, setActivePage }: MainContentProps) {
  switch (activePage) {
    case "dashboard":
      return <DashboardView setActivePage={setActivePage} />;
    case "dataset_explorer":
      return <DatasetExplorerView />;
    case "data_integration":
      return <DataIntegrationView />;
    case "data_quality":
      return <DataQualityView />;
    case "data_cleaning":
      return <DataCleaningView />;
    case "statistics":
      return <StatisticsView />;
    case "eda":
      return <EDAView />;
    case "statistical_analysis":
      return <StatisticalAnalysisView />;
    case "features":
      return <FeatureEngineeringView />;
    case "temporal":
      return <TemporalAnalyticsView />;
    case "cohorts":
      return <CohortAnalyticsView />;
    case "anomalies":
      return <AnomalyAnalysisView />;
    case "educational_insights":
      return <EducationalInsightsView />;
    case "digital_twin":
      return <DigitalTwinView />;
    case "intervention_simulator":
      return <InterventionSimulatorView />;
    case "ml_hub":
      return <MLModelHubView />;
    case "about":
      return <AboutView />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-2xl font-bold text-foreground">Coming Soon</h2>
          <p className="text-muted-foreground mt-2">The {activePage} module is under development.</p>
        </div>
      );
  }
}
