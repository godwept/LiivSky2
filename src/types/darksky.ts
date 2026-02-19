/**
 * Types for the Dark Sky / Astronomy forecast feature.
 * Based on the 7Timer! ASTRO API response format.
 *
 * @see https://www.7timer.info/doc.php?lang=en#api
 */

/**
 * Cloud cover scale (1–9) from the 7Timer API.
 * 1 = 0–6%, 9 = 94–100%.
 */
export type CloudCoverValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Astronomical seeing scale (1–8).
 * 1 = <0.5" (excellent), 8 = >2.5" (poor).
 */
export type SeeingValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Atmospheric transparency scale (1–8).
 * 1 = <0.3 mag/airmass (excellent), 8 = >1 mag/airmass (poor).
 */
export type TransparencyValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Lifted index values from the 7Timer API */
export type LiftedIndexValue = -10 | -6 | -4 | -1 | 2 | 6 | 10 | 15;

/** 10m wind speed scale (1–8) */
export type WindSpeedValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Precipitation type from the 7Timer API */
export type PrecipType = 'snow' | 'rain' | 'frzr' | 'icep' | 'none';

/** A single 3-hourly forecast timestep from the ASTRO product */
export interface AstroTimestep {
  /** Hours offset from forecast init time */
  timepoint: number;
  /** Cloud cover (1–9 scale) */
  cloudcover: CloudCoverValue;
  /** Astronomical seeing (1–8 scale) */
  seeing: SeeingValue;
  /** Atmospheric transparency (1–8 scale) */
  transparency: TransparencyValue;
  /** Atmospheric instability / lifted index */
  lifted_index: LiftedIndexValue;
  /** 2m relative humidity (-4 to 16 scale) */
  rh2m: number;
  /** 10m wind direction */
  wind10m: {
    direction: string;
    speed: WindSpeedValue;
  };
  /** 2m temperature in °C */
  temp2m: number;
  /** Precipitation type */
  prec_type: PrecipType;
}

/** Raw 7Timer ASTRO API response */
export interface AstroApiResponse {
  /** Forecast product identifier */
  product: string;
  /** Forecast initialization time (YYYYMMDDHH format) */
  init: string;
  /** Array of 3-hourly forecast data */
  dataseries: AstroTimestep[];
}

/** Processed astronomy forecast entry for display */
export interface DarkSkyForecastItem {
  /** Date/time label */
  timeLabel: string;
  /** ISO date string */
  dateTime: string;
  /** Cloud cover percentage (0–100) */
  cloudCoverPct: number;
  /** Cloud cover description */
  cloudCoverLabel: string;
  /** Seeing quality rating description */
  seeingLabel: string;
  /** Seeing numeric value (1 = best, 8 = worst) */
  seeingValue: number;
  /** Transparency quality rating description */
  transparencyLabel: string;
  /** Transparency numeric value (1 = best, 8 = worst) */
  transparencyValue: number;
  /** Overall stargazing score (0–100, higher = better) */
  stargazingScore: number;
  /** Temperature in °C */
  temp: number;
  /** Wind speed label */
  windLabel: string;
  /** Wind direction */
  windDirection: string;
  /** Humidity percentage estimate */
  humidityPct: number;
  /** Precipitation type */
  precipType: PrecipType;
  /** Lifted index category */
  stabilityLabel: string;
}

/** Complete dark sky forecast data for display */
export interface DarkSkyForecast {
  /** Location latitude */
  lat: number;
  /** Location longitude */
  lon: number;
  /** Forecast init time as Date */
  initTime: string;
  /** 3-hourly forecast items */
  items: DarkSkyForecastItem[];
}
