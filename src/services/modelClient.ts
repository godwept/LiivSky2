/**
 * Service for fetching forecast model comparison data from Open-Meteo.
 *
 * Open-Meteo provides a unified JSON API for many NWP models with no auth,
 * CORS enabled, and fast response times. Each model has its own endpoint.
 *
 * @see https://open-meteo.com/en/docs
 */
import type {
  ModelId,
  ModelParameter,
  ModelForecast,
  ModelComparisonData,
  ModelInfo,
  ParameterInfo,
} from '../types/models';

/** Catalog of available forecast models */
export const MODEL_CATALOG: ModelInfo[] = [
  {
    id: 'gfs',
    label: 'GFS',
    description: 'Global Forecast System (NOAA)',
    resolution: '0.25°',
    provider: 'NOAA',
    color: '#42a5f5',
  },
  {
    id: 'ecmwf',
    label: 'ECMWF IFS',
    description: 'Integrated Forecasting System',
    resolution: '0.25°',
    provider: 'ECMWF',
    color: '#ef5350',
  },
  {
    id: 'hrdps',
    label: 'HRDPS',
    description: 'High Resolution Deterministic (Canada)',
    resolution: '2.5 km',
    provider: 'ECCC',
    color: '#66bb6a',
  },
  {
    id: 'rdps',
    label: 'RDPS',
    description: 'Regional Deterministic (Canada)',
    resolution: '10 km',
    provider: 'ECCC',
    color: '#ffa726',
  },
  {
    id: 'gdps',
    label: 'GDPS',
    description: 'Global Deterministic (Canada)',
    resolution: '15 km',
    provider: 'ECCC',
    color: '#ab47bc',
  },
  {
    id: 'nam',
    label: 'NAM',
    description: 'North American Mesoscale (NOAA)',
    resolution: '12 km',
    provider: 'NOAA',
    color: '#26c6da',
  },
];

/** Available parameters for model comparison */
export const PARAMETER_CATALOG: ParameterInfo[] = [
  { id: 'temperature_2m', label: 'Temperature', unit: '°C', color: '#ff7043' },
  { id: 'precipitation', label: 'Precipitation', unit: 'mm', color: '#42a5f5' },
  { id: 'wind_speed_10m', label: 'Wind Speed', unit: 'km/h', color: '#66bb6a' },
  { id: 'relative_humidity_2m', label: 'Humidity', unit: '%', color: '#ab47bc' },
  { id: 'surface_pressure', label: 'Pressure', unit: 'hPa', color: '#ffa726' },
  { id: 'cloud_cover', label: 'Cloud Cover', unit: '%', color: '#78909c' },
];

/**
 * Map model IDs to their Open-Meteo API endpoint paths and model param values.
 * Open-Meteo uses different base paths for different model families.
 */
const MODEL_API_MAP: Record<ModelId, { url: string; modelParam?: string }> = {
  gfs: { url: 'https://api.open-meteo.com/v1/gfs' },
  ecmwf: { url: 'https://api.open-meteo.com/v1/ecmwf' },
  hrdps: { url: 'https://api.open-meteo.com/v1/gem', modelParam: 'gem_hrdps_continental' },
  rdps: { url: 'https://api.open-meteo.com/v1/gem', modelParam: 'gem_regional' },
  gdps: { url: 'https://api.open-meteo.com/v1/gem', modelParam: 'gem_global' },
  nam: { url: 'https://api.open-meteo.com/v1/forecast', modelParam: 'nam_conus' },
};

/**
 * Fetch forecast data for a single model and parameter from Open-Meteo.
 */
async function fetchSingleModel(
  modelId: ModelId,
  parameter: ModelParameter,
  lat: number,
  lon: number,
): Promise<ModelForecast> {
  const config = MODEL_API_MAP[modelId];
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly: parameter,
    timezone: 'auto',
    forecast_days: '5',
  });

  if (config.modelParam) {
    params.set('models', config.modelParam);
  }

  const res = await fetch(`${config.url}?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`Open-Meteo ${modelId} returned ${res.status}`);
  }

  const json = await res.json() as {
    hourly?: { time?: string[]; [key: string]: unknown };
  };

  const times = json.hourly?.time ?? [];
  const values = (json.hourly?.[parameter] ?? []) as (number | null)[];

  const data = times.map((time: string, i: number) => ({
    time,
    value: values[i] ?? 0,
  }));

  return { modelId, parameter, data };
}

/**
 * Fetch comparison data for multiple models at a given location.
 * Requests run in parallel for speed.
 */
export async function fetchModelComparison(
  modelIds: ModelId[],
  parameter: ModelParameter,
  lat: number,
  lon: number,
): Promise<ModelComparisonData> {
  const forecasts = await Promise.allSettled(
    modelIds.map((id) => fetchSingleModel(id, parameter, lat, lon)),
  );

  const successful = forecasts
    .filter((r): r is PromiseFulfilledResult<ModelForecast> => r.status === 'fulfilled')
    .map((r) => r.value);

  return { lat, lon, forecasts: successful };
}
