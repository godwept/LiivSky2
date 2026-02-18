/**
 * Core weather data types used across the dashboard.
 * These will evolve as real API integrations are added.
 */

/** Temperature unit preference */
export type TemperatureUnit = 'C' | 'F';

/** Props for the main temperature gauge component */
export interface TemperatureGaugeData {
  /** Current temperature reading */
  current: number;
  /** Feels-like temperature */
  feelsLike: number;
  /** Today's forecasted low */
  low: number;
  /** Today's forecasted high */
  high: number;
  /** Gauge scale minimum (extreme low) */
  min: number;
  /** Gauge scale maximum (extreme high) */
  max: number;
  /** Display unit */
  unit: TemperatureUnit;
}

/** A single weather metric for display in a card */
export interface WeatherMetric {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Numeric value */
  value: number;
  /** Unit string for display (e.g., '%', '°F', 'UV') */
  unitLabel: string;
  /** Icon identifier */
  icon: string;
  /** Optional accent color */
  color?: string;
}

/** A single hour in the hourly forecast */
export interface HourlyForecastItem {
  /** Hour label (e.g., '2PM') */
  time: string;
  /** Temperature for this hour */
  temp: number;
  /** Icon identifier for conditions */
  icon: string;
  /** Precipitation probability as percentage */
  precipChance: number;
}

/** A single day in the daily forecast */
export interface DailyForecastItem {
  /** Day label (e.g., 'Mon', 'Tue') */
  day: string;
  /** High temperature */
  high: number;
  /** Low temperature */
  low: number;
  /** Icon identifier for conditions */
  icon: string;
  /** Optional daytime narrative forecast */
  daySummary?: string;
  /** Optional nighttime narrative forecast */
  nightSummary?: string;
}

/** Navigation tab definition */
export interface NavTab {
  /** Unique route/identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon identifier */
  icon: string;
}

/** Data for the glassmorphic conditions card */
export interface ConditionsCardData {
  /** Current weather condition label (e.g., 'Partly Cloudy') */
  condition: string;
  /** Icon identifier for condition */
  conditionIcon: string;
  /** Wind speed */
  windSpeed: number;
  /** Wind direction label (e.g., 'NW') */
  windDirection: string;
  /** Wind unit label */
  windUnit: string;
  /** Humidity percentage */
  humidity: number;
  /** UV index */
  uvIndex: number;
  /** Precipitation probability percentage */
  precipChance: number;
  /** Feels-like temperature */
  feelsLike: number;
  /** Temperature unit */
  tempUnit: string;
  /** Sunrise time string (e.g., '6:42 AM') */
  sunrise: string;
  /** Sunset time string (e.g., '8:15 PM') */
  sunset: string;
  /** Moon phase label (e.g., 'Waxing Crescent') */
  moonPhase: string;
  /** Moon illumination percentage (0–100) */
  moonIllumination: number;
  /** Source update timestamp display text */
  sourceUpdatedAt?: string;
}
