export type WeatherProvider = 'ec' | 'twn';
export type TemperatureUnit = 'C' | 'F';

export interface LocationSummary {
  name: string;
  lat: number;
  lon: number;
}

export interface CurrentConditions {
  temperature: number;
  feelsLike: number;
  condition: string;
  icon: string;
  humidity: number;
  windKph: number;
  pressureKpa: number;
  pressureTrend: 'rising' | 'falling' | 'steady';
  visibilityKm: number;
  uvIndex: number;
  sunrise?: string;
  sunset?: string;
}

export interface HourlyItem {
  time: string;
  temp: number;
  icon: string;
  precipChance: number;
}

export interface DailyItem {
  day: string;
  high: number;
  low: number;
  icon: string;
  daySummary?: string;
  nightSummary?: string;
}

export interface AlertItem {
  title: string;
  severity?: string;
  description?: string;
}

export interface HomeWeatherResponse {
  provider: WeatherProvider;
  location: LocationSummary;
  current: CurrentConditions;
  hourly: HourlyItem[];
  daily: DailyItem[];
  alerts: AlertItem[];
  updatedAt: string;
}

export interface GeocodeResult {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  region?: string;
}

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface Env {
  CORS_ORIGIN?: string;
  TWN_API_KEY?: string;
}
