/**
 * AQUACAST Unified Flood Data Architecture
 * Strongly typed contract for flood intelligence snapshots, observations,
 * regional impact metrics, forecasts, and provenance.
 */

export type FloodSeverity = "severe" | "moderate" | "low";

/**
 * Data classification tier ensuring honesty:
 * - observed: Directly measured or sensor-derived data.
 * - derived: Modeled estimate (e.g. population/infrastructure exposure derived from census + inundation overlay).
 * - forecast: Predictive hydrological model output (e.g. GloFAS 72h river discharge outlook).
 * - benchmark: Curated public benchmark snapshot from historic event (CWC / GloFAS).
 * - unavailable: Explicitly unmonitored or sensor blackout.
 */
export type DataTier = "observed" | "derived" | "forecast" | "benchmark" | "unavailable";

export type TrendDirection = "rising" | "stable" | "receding";

export interface InfrastructureExposure {
  roadsKm: number | null;
  healthcareFacilities: number | null;
  schools: number | null;
  drinkingWaterSources: number | null;
}

export interface StateFloodInfo {
  name: string;
  severity: FloodSeverity;
  floodedAreaKm2: number;
  forecastSeverity: FloodSeverity;
  populationExposed: number | null;
  croplandAreaKm2: number | null;
  criticalInfrastructure: InfrastructureExposure | null;
  primaryRiverBasins: string[];
  alertLevel: "Emergency" | "Warning" | "Watch" | "Normal";
  trend7d: TrendDirection;
  dataTier: DataTier;
  confidence: "High" | "Medium" | "Low" | "Preliminary";
  lastUpdated: string;
  notes?: string;
}

export interface TrendPoint {
  date: string;
  day: string;
  floodedAreaKm2: number; // in km²
  floodedAreaThousandKm2: number; // in thousands of km² (for chart readability)
  riverDischargeIndex: number; // standardized index (1.0 = normal monsoon flow)
  dataTier: DataTier;
}

export interface ForecastItem {
  region: string;
  level: "Very high" | "High" | "Moderate" | "Low";
  severity: FloodSeverity;
  expectedPeak: string;
  confidence: "High" | "Moderate" | "Preliminary";
  details: string;
  projectedAreaDeltaPct: number;
}

export interface BasinHydrology {
  basinName: string;
  currentDischargeM3s: number | null;
  warningDischargeM3s: number | null;
  dangerDischargeM3s: number | null;
  status: "Above Danger" | "Above Warning" | "Normal" | "Unavailable";
  stationName: string;
}

export interface SourceAttribution {
  name: string;
  provider: string;
  license: string;
  methodology: string;
  disclaimer: string;
}

export interface FloodSnapshotSummary {
  totalSeverelyFloodedKm2: number;
  totalModeratelyFloodedKm2: number;
  totalLowOrNormalKm2: number;
  normalAreaPercentage: number;
  totalPopulationExposed: number;
  totalCroplandFloodedKm2: number;
  change7dPct: number;
}

export interface FloodSnapshot {
  id: string;
  title: string;
  scenarioName: "monsoon_peak" | "recession" | "unavailable";
  observationDate: string;
  timestamp: string;
  status: "ready" | "loading" | "error" | "unavailable";
  errorMessage?: string;
  geographicCoverage: string;
  sourceAttribution: SourceAttribution;
  summary: FloodSnapshotSummary;
  states: Record<string, StateFloodInfo>;
  topAffectedStates: StateFloodInfo[];
  trend: TrendPoint[];
  forecast: ForecastItem[];
  riverBasins: BasinHydrology[];
  keyInsights: string[];
  dataLimitations: string[];
}

