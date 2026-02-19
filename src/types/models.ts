/**
 * Types for the Weather Models feature.
 * Used by the ModelsPage to display forecast model comparisons.
 */

/** Supported forecast model identifiers */
export type ModelId = 'gfs' | 'ecmwf' | 'hrdps' | 'rdps' | 'gdps' | 'nam';

/** Metadata describing a forecast model */
export interface ModelInfo {
  /** Unique model identifier */
  id: ModelId;
  /** Display name */
  label: string;
  /** Short description */
  description: string;
  /** Spatial resolution label */
  resolution: string;
  /** Provider / organization */
  provider: string;
  /** Accent color for chart rendering */
  color: string;
}

/** Forecast parameter that can be displayed */
export type ModelParameter =
  | 'temperature_2m'
  | 'precipitation'
  | 'wind_speed_10m'
  | 'relative_humidity_2m'
  | 'surface_pressure'
  | 'cloud_cover';

/** Label mapping for model parameters */
export interface ParameterInfo {
  id: ModelParameter;
  label: string;
  unit: string;
  color: string;
}

/** A single timestep from a model forecast */
export interface ModelTimestep {
  /** ISO 8601 timestamp */
  time: string;
  /** Value for the selected parameter */
  value: number;
}

/** Forecast data for a single model */
export interface ModelForecast {
  /** Model identifier */
  modelId: ModelId;
  /** The parameter being shown */
  parameter: ModelParameter;
  /** Hourly timestep data */
  data: ModelTimestep[];
}

/** Complete response from the model comparison service */
export interface ModelComparisonData {
  /** Latitude of the query point */
  lat: number;
  /** Longitude of the query point */
  lon: number;
  /** Forecasts keyed by model ID */
  forecasts: ModelForecast[];
}
