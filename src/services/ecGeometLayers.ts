/**
 * Environment Canada GeoMet WMS layer definitions.
 *
 * EC's MSC GeoMet provides free, open WMS tile layers for weather data
 * including radar composites and satellite imagery. No API key required.
 *
 * Base WMS URL: https://geo.weather.gc.ca/geomet
 * Docs: https://eccc-msc.github.io/open-data/msc-geomet/wms_en/
 */

/** Base WMS endpoint for GeoMet-Weather */
export const EC_GEOMET_WMS_URL = 'https://geo.weather.gc.ca/geomet';

/* ------------------------------------------------------------------ */
/*  Radar products                                                     */
/* ------------------------------------------------------------------ */

/** Identifier for each selectable radar product */
export type RadarProductId = 'rain' | 'snow' | 'precipType';

/** A single radar product option */
export interface RadarProduct {
  id: RadarProductId;
  /** Short label for the UI pill */
  label: string;
  /** WMS layer name on EC GeoMet */
  wmsLayer: string;
}

/**
 * Selectable radar products — all 1 km composites, updated every 6 min.
 *
 *  rain       — RADAR_1KM_RRAI  (precipitation rate, mm/hr)
 *  snow       — RADAR_1KM_RSNO  (precipitation rate, cm/hr)
 *  precipType — Radar_1km_SfcPrecipType (rain / snow / mixed depiction)
 */
export const RADAR_PRODUCTS: RadarProduct[] = [
  { id: 'rain',       label: 'Rain',        wmsLayer: 'RADAR_1KM_RRAI' },
  { id: 'snow',       label: 'Snow',        wmsLayer: 'RADAR_1KM_RSNO' },
  { id: 'precipType', label: 'Precip Type', wmsLayer: 'Radar_1km_SfcPrecipType' },
];

/** Convenience lookup: product id → WMS layer name */
export const RADAR_PRODUCT_MAP = Object.fromEntries(
  RADAR_PRODUCTS.map((p) => [p.id, p.wmsLayer]),
) as Record<RadarProductId, string>;

/* ------------------------------------------------------------------ */
/*  Satellite products                                                 */
/* ------------------------------------------------------------------ */

/** Identifier for each selectable satellite product */
export type SatelliteProductId = 'visIR' | 'natural' | 'cloudType' | 'sandwich';

/** A single satellite product option */
export interface SatelliteProduct {
  id: SatelliteProductId;
  /** Short label for the UI pill */
  label: string;
  /** WMS layer name on EC GeoMet */
  wmsLayer: string;
}

/**
 * Selectable satellite products — all GOES-East, 1 km, updated every 10 min.
 *
 *  visIR     — DayVis-NightIR   (auto day/night composite, works 24/7)
 *  natural   — NaturalColor     (true-color daytime, excellent detail)
 *  cloudType — DayCloudType-NightMicrophysics (cloud classification RGB)
 *  sandwich  — VisibleIRSandwich-NightMicrophysicsIR (3D storm vis)
 */
export const SATELLITE_PRODUCTS: SatelliteProduct[] = [
  { id: 'visIR',     label: 'Vis / IR',      wmsLayer: 'GOES-East_1km_DayVis-NightIR' },
  { id: 'natural',   label: 'Natural Color',  wmsLayer: 'GOES-East_1km_NaturalColor' },
  { id: 'cloudType', label: 'Cloud Type',     wmsLayer: 'GOES-East_1km_DayCloudType-NightMicrophysics' },
  { id: 'sandwich',  label: 'IR Sandwich',    wmsLayer: 'GOES-East_1km_VisibleIRSandwich-NightMicrophysicsIR' },
];

/** Convenience lookup: satellite product id → WMS layer name */
export const SATELLITE_PRODUCT_MAP = Object.fromEntries(
  SATELLITE_PRODUCTS.map((p) => [p.id, p.wmsLayer]),
) as Record<SatelliteProductId, string>;

/* ------------------------------------------------------------------ */
/*  Other layers                                                       */
/* ------------------------------------------------------------------ */

export const EC_LAYERS = {
  radar: 'RADAR_1KM_RRAI',
  satellite: 'GOES-East_1km_DayVis-NightIR',
  lightning: 'Lightning_2.5km_Density',
} as const;

/** WMS params shared by all EC GeoMet overlay requests */
export const EC_WMS_PARAMS = {
  format: 'image/png',
  transparent: true,
  version: '1.3.0',
} as const;

/* ------------------------------------------------------------------ */
/*  HRRR forecast (IEM WMS)                                            */
/* ------------------------------------------------------------------ */

/**
 * Iowa Environmental Mesonet WMS for NOAA HRRR model — simulated
 * composite reflectivity (dBZ).  Free, no API key required.
 *
 * Individual layers per forecast minute:
 *   refd_0000 (F+0:00 analysis) … refd_1080 (F+18:00)
 *   15-min steps from 0–18 h, then 60-min steps 18–36 h.
 *
 * Coverage: CONUS (24°N–50°N, 126°W–66°W).
 */
export const IEM_HRRR_WMS_URL =
  'https://mesonet.agron.iastate.edu/cgi-bin/wms/hrrr/refd.cgi';

/**
 * HRRR forecast layer names — hourly from +0 h to +18 h (19 frames).
 *
 * We use hourly steps to keep the frame count reasonable for
 * pre-caching.  The 15-min detail layers exist on IEM if finer
 * resolution is ever needed.
 */
export const HRRR_FORECAST_LAYERS: string[] = Array.from(
  { length: 19 },
  (_, i) => `refd_${String(i * 60).padStart(4, '0')}`,
);

/** Convert a HRRR layer name like `refd_0120` to a label like `+2 h`. */
export function hrrrLayerLabel(layerName: string): string {
  const match = layerName.match(/^refd_(\d+)$/);
  if (!match) return layerName;
  const mins = parseInt(match[1]!, 10);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `+${h} h` : `+${h} h ${m} m`;
}

/* ------------------------------------------------------------------ */
/*  NWP Model WMS layers (EC GeoMet)                                   */
/* ------------------------------------------------------------------ */

/** Identifier for a model map parameter */
export type ModelMapParamId =
  | 'temperature'
  | 'precipitation'
  | 'wind'
  | 'pressure'
  | 'humidity'
  | 'clouds';

/** Identifier for a model available as WMS */
export type ModelMapModelId = 'hrdps' | 'rdps' | 'gdps' | 'gfs' | 'nam' | 'hrrr';

/** Metadata for a selectable model-map parameter */
export interface ModelMapParam {
  id: ModelMapParamId;
  label: string;
  unit: string;
}

/** A single WMS model definition */
export interface ModelMapDef {
  id: ModelMapModelId;
  label: string;
  description: string;
  resolution: string;
  color: string;
  /** Human-readable provider name shown in the hero */
  provider: string;
  /** WMS base URL for GetCapabilities and tile requests */
  wmsUrl: string;
  /**
   * Extra WMS parameters per product, e.g. `ELEVATION` for ncWMS
   * height-above-ground layers.  Spread directly into tile requests.
   */
  extraParams?: Partial<Record<ModelMapParamId, Record<string, string>>>;
  /** WMS layer name keyed by product parameter */
  layers: Record<ModelMapParamId, string>;
}

/** Parameters available for model maps */
export const MODEL_MAP_PARAMS: ModelMapParam[] = [
  { id: 'temperature', label: 'Temperature',   unit: '°C' },
  { id: 'precipitation', label: 'Precipitation', unit: 'mm' },
  { id: 'wind',        label: 'Wind Speed',    unit: 'km/h' },
  { id: 'pressure',    label: 'Pressure',      unit: 'hPa' },
  { id: 'humidity',    label: 'Humidity',       unit: '%' },
  { id: 'clouds',      label: 'Cloud Cover',   unit: '%' },
];

/**
 * EC GeoMet WMS model layer catalog.
 *
 * Layer names follow the convention `MODEL.DOMAIN_PARAM`:
 *   - HRDPS: `HRDPS.CONTINENTAL_*`  (2.5 km, 48 h)
 *   - RDPS:  `RDPS.ETA_*`           (10 km, 84 h)
 *   - GDPS:  `GDPS.ETA_*`           (15 km, 240 h)
 *
 * All support the WMS TIME dimension for forecast valid times.
 * @see https://eccc-msc.github.io/open-data/msc-geomet/wms_en/
 */
/* Base URLs for UCAR THREDDS ncWMS model endpoints (free, no key required) */
export const UCAR_GFS_WMS_URL =
  'https://thredds.ucar.edu/thredds/wms/grib/NCEP/GFS/Global_0p25deg/Best';
export const UCAR_NAM_WMS_URL =
  'https://thredds.ucar.edu/thredds/wms/grib/NCEP/NAM/CONUS_12km/Best';
export const UCAR_HRRR_WMS_URL =
  'https://thredds.ucar.edu/thredds/wms/grib/NCEP/HRRR/CONUS_2p5km/Best';

export const MODEL_MAP_DEFS: ModelMapDef[] = [
  /* ---- Environment Canada models (EC GeoMet) ---- */
  {
    id: 'hrdps',
    label: 'HRDPS',
    description: 'High Res Deterministic (Canada)',
    resolution: '2.5 km',
    color: '#66bb6a',
    provider: 'Environment Canada',
    wmsUrl: EC_GEOMET_WMS_URL,
    layers: {
      temperature:   'HRDPS.CONTINENTAL_TT',
      precipitation: 'HRDPS.CONTINENTAL_PR',
      wind:          'HRDPS.CONTINENTAL_WSPD',
      pressure:      'HRDPS.CONTINENTAL_PN',
      humidity:      'HRDPS.CONTINENTAL_HR',
      clouds:        'HRDPS.CONTINENTAL_NT',
    },
  },
  {
    id: 'rdps',
    label: 'RDPS',
    description: 'Regional Deterministic (Canada)',
    resolution: '10 km',
    color: '#ffa726',
    provider: 'Environment Canada',
    wmsUrl: EC_GEOMET_WMS_URL,
    layers: {
      temperature:   'RDPS.ETA_TT',
      precipitation: 'RDPS.ETA_PR',
      wind:          'RDPS.ETA_WSPD',
      pressure:      'RDPS.ETA_PN',
      humidity:      'RDPS.ETA_HR',
      clouds:        'RDPS.ETA_NT',
    },
  },
  {
    id: 'gdps',
    label: 'GDPS',
    description: 'Global Deterministic (Canada)',
    resolution: '15 km',
    color: '#ab47bc',
    provider: 'Environment Canada',
    wmsUrl: EC_GEOMET_WMS_URL,
    layers: {
      temperature:   'GDPS.ETA_TT',
      precipitation: 'GDPS.ETA_PR',
      wind:          'GDPS.ETA_WSPD',
      pressure:      'GDPS.ETA_PN',
      humidity:      'GDPS.ETA_HR',
      clouds:        'GDPS.ETA_NT',
    },
  },

  /* ---- NOAA models (UCAR THREDDS ncWMS) ---- */
  {
    id: 'gfs',
    label: 'GFS',
    description: 'Global Forecast System (NOAA)',
    resolution: '0.25°',
    color: '#42a5f5',
    provider: 'NOAA / NCEP',
    wmsUrl: UCAR_GFS_WMS_URL,
    extraParams: {
      temperature:   { ELEVATION: '2' },
      wind:          { ELEVATION: '10' },
      humidity:      { ELEVATION: '2' },
    },
    layers: {
      temperature:   'Temperature_height_above_ground',
      precipitation: 'Total_precipitation_surface_Mixed_intervals_Accumulation',
      wind:          'Wind_speed_height_above_ground',
      pressure:      'Pressure_reduced_to_MSL_msl',
      humidity:      'Relative_humidity_height_above_ground',
      clouds:        'Total_cloud_cover_entire_atmosphere_Mixed_intervals_Average',
    },
  },
  {
    id: 'nam',
    label: 'NAM',
    description: 'North American Mesoscale (NOAA)',
    resolution: '12 km',
    color: '#ef5350',
    provider: 'NOAA / NCEP',
    wmsUrl: UCAR_NAM_WMS_URL,
    extraParams: {
      temperature:   { ELEVATION: '2' },
      wind:          { ELEVATION: '10' },
      humidity:      { ELEVATION: '2' },
    },
    layers: {
      temperature:   'Temperature_height_above_ground',
      precipitation: 'Total_precipitation_surface_Mixed_intervals_Accumulation',
      wind:          'Wind_speed_height_above_ground',
      pressure:      'Pressure_reduced_to_MSL_msl',
      humidity:      'Relative_humidity_height_above_ground',
      clouds:        'Total_cloud_cover_entire_atmosphere_Mixed_intervals_Average',
    },
  },
  {
    id: 'hrrr',
    label: 'HRRR',
    description: 'High-Res Rapid Refresh (NOAA)',
    resolution: '3 km',
    color: '#ff7043',
    provider: 'NOAA / NCEP',
    wmsUrl: UCAR_HRRR_WMS_URL,
    extraParams: {
      temperature:   { ELEVATION: '2' },
      wind:          { ELEVATION: '10' },
      humidity:      { ELEVATION: '2' },
    },
    layers: {
      temperature:   'Temperature_height_above_ground',
      precipitation: 'Total_precipitation_surface_Mixed_intervals_Accumulation',
      wind:          'Wind_speed_height_above_ground',
      pressure:      'Pressure_reduced_to_MSL_msl',
      humidity:      'Relative_humidity_height_above_ground',
      clouds:        'Total_cloud_cover_entire_atmosphere_Mixed_intervals_Average',
    },
  },
];
