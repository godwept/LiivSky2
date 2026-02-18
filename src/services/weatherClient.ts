import type {
  ConditionsCardData,
  DailyForecastItem,
  HourlyForecastItem,
  TemperatureGaugeData,
  WeatherMetric,
} from '../types';
import type { WeatherProvider, WeatherSnapshot } from '../store/weatherStore';

export type TemperatureUnit = 'C' | 'F';

interface WorkerLocation {
  name: string;
  lat: number;
  lon: number;
}

interface WorkerCurrent {
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

interface WorkerHourly {
  time: string;
  temp: number;
  icon: string;
  precipChance: number;
}

interface WorkerDaily {
  day: string;
  high: number;
  low: number;
  icon: string;
  daySummary?: string;
  nightSummary?: string;
}

interface WorkerHomeResponse {
  provider: WeatherProvider;
  location: WorkerLocation;
  current: WorkerCurrent;
  hourly: WorkerHourly[];
  daily: WorkerDaily[];
  alerts: unknown[];
  updatedAt: string;
}

interface HomeWeatherRequest {
  lat: number;
  lon: number;
  provider: WeatherProvider;
  unit: TemperatureUnit;
}

export interface GeocodeResult {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  region?: string;
}

function getApiBaseUrl(): string {
  const fromEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    ?.VITE_API_BASE_URL;
  return (fromEnv && fromEnv.trim().length > 0 ? fromEnv : '/api/v1').replace(/\/$/, '');
}

export async function fetchHomeWeather(request: HomeWeatherRequest): Promise<WorkerHomeResponse> {
  const apiBase = getApiBaseUrl();
  const url = new URL(`${apiBase}/weather/home`, window.location.origin);

  url.searchParams.set('lat', String(request.lat));
  url.searchParams.set('lon', String(request.lon));
  url.searchParams.set('provider', request.provider);
  url.searchParams.set('unit', request.unit);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Weather request failed (${response.status})`);
  }

  return (await response.json()) as WorkerHomeResponse;
}

export async function searchLocations(query: string): Promise<GeocodeResult[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) {
    return [];
  }

  const apiBase = getApiBaseUrl();
  const url = new URL(`${apiBase}/geocode/search`, window.location.origin);
  url.searchParams.set('q', normalizedQuery);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Location search failed (${response.status})`);
  }

  const payload = (await response.json()) as { results: GeocodeResult[] };
  return payload.results ?? [];
}

export async function reverseLocation(lat: number, lon: number): Promise<GeocodeResult> {
  const apiBase = getApiBaseUrl();
  const url = new URL(`${apiBase}/geocode/reverse`, window.location.origin);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Reverse geocode failed (${response.status})`);
  }

  const payload = (await response.json()) as { result: GeocodeResult };
  return payload.result;
}

export function mapHomeResponseToSnapshot(response: WorkerHomeResponse): WeatherSnapshot {
  const hourlyForecast = mapHourly(response.hourly);
  const dailyForecast = mapDaily(response.daily);
  const gaugeRange = selectGaugeRangeFromHourly(response.hourly, response.current.temperature);
  const moon = getMoonData(new Date(response.updatedAt));
  const pressureTrend = inferPressureTrend(
    response.location.lat,
    response.location.lon,
    response.current.pressureKpa,
    response.current.pressureTrend,
  );

  const gaugeScale = createDynamicGaugeScale(gaugeRange.low, gaugeRange.high, response.current.temperature);

  const temperature: TemperatureGaugeData = {
    current: response.current.temperature,
    feelsLike: response.current.feelsLike,
    low: gaugeRange.low,
    high: gaugeRange.high,
    min: gaugeScale.min,
    max: gaugeScale.max,
    unit: 'C',
  };

  const metrics: WeatherMetric[] = [
    {
      id: 'humidity',
      label: 'Humidity',
      value: response.current.humidity,
      unitLabel: '%',
      icon: 'humidity',
      color: '#4fc3f7',
    },
    {
      id: 'pressure',
      label: 'Pressure',
      value: Number(response.current.pressureKpa.toFixed(1)),
      unitLabel: 'kPa',
      icon: `pressure-${pressureTrend}`,
      color: '#ffd180',
    },
    {
      id: 'precip',
      label: 'Precip',
      value: hourlyForecast[0]?.precipChance ?? 0,
      unitLabel: '%',
      icon: 'precip',
      color: '#90caf9',
    },
    {
      id: 'wind',
      label: 'Wind',
      value: response.current.windKph,
      unitLabel: 'km/h',
      icon: 'wind',
      color: '#80cbc4',
    },
  ];

  const conditions: ConditionsCardData = {
    condition: response.current.condition,
    conditionIcon: mapIcon(response.current.icon),
    windSpeed: response.current.windKph,
    windDirection: '--',
    windUnit: 'km/h',
    humidity: response.current.humidity,
    uvIndex: response.current.uvIndex,
    precipChance: hourlyForecast[0]?.precipChance ?? 0,
    feelsLike: response.current.feelsLike,
    tempUnit: 'C',
    sunrise: formatLocalTime(response.current.sunrise),
    sunset: formatLocalTime(response.current.sunset),
    moonPhase: moon.phase,
    moonIllumination: moon.illumination,
    sourceUpdatedAt: formatSourceUpdatedAt(response.updatedAt),
  };

  return {
    location: response.location.name,
    temperature,
    metrics,
    conditions,
    hourlyForecast,
    dailyForecast,
  };
}

function createDynamicGaugeScale(low: number, high: number, current: number): { min: number; max: number } {
  const PADDING_C = 12;
  const MIN_SPAN_C = 28;
  const CLAMP_MIN_C = -50;
  const CLAMP_MAX_C = 50;

  const lowValue = Number.isFinite(low) ? low : current;
  const highValue = Number.isFinite(high) ? high : current;
  const dayLow = Math.min(lowValue, highValue);
  const dayHigh = Math.max(lowValue, highValue);

  let min = dayLow - PADDING_C;
  let max = dayHigh + PADDING_C;

  if (max - min < MIN_SPAN_C) {
    const midpoint = (min + max) / 2;
    min = midpoint - MIN_SPAN_C / 2;
    max = midpoint + MIN_SPAN_C / 2;
  }

  min = Math.max(min, CLAMP_MIN_C);
  max = Math.min(max, CLAMP_MAX_C);

  if (max <= min) {
    const center = Math.max(CLAMP_MIN_C, Math.min(CLAMP_MAX_C, current));
    min = Math.max(CLAMP_MIN_C, center - MIN_SPAN_C / 2);
    max = Math.min(CLAMP_MAX_C, center + MIN_SPAN_C / 2);
  }

  if (max - min < MIN_SPAN_C) {
    if (min <= CLAMP_MIN_C) {
      max = Math.min(CLAMP_MAX_C, min + MIN_SPAN_C);
    } else if (max >= CLAMP_MAX_C) {
      min = Math.max(CLAMP_MIN_C, max - MIN_SPAN_C);
    }
  }

  return {
    min,
    max,
  };
}

function mapHourly(hourly: WorkerHourly[]): HourlyForecastItem[] {
  return hourly.slice(0, 24).map((item) => ({
    time: formatHour(item.time),
    temp: Math.round(item.temp),
    icon: mapIcon(item.icon),
    precipChance: clampPercent(item.precipChance),
  }));
}

function mapDaily(daily: WorkerDaily[]): DailyForecastItem[] {
  return daily.slice(0, 7).map((item) => ({
    day: formatDay(item.day),
    high: Math.round(item.high),
    low: Math.round(item.low),
    icon: mapIcon(item.icon),
    daySummary: item.daySummary,
    nightSummary: item.nightSummary,
  }));
}

function selectGaugeRangeFromHourly(hourly: WorkerHourly[], fallbackTemp: number): { low: number; high: number } {
  const now = new Date();

  const todayValues = hourly
    .filter((item) => {
      const timestamp = new Date(item.time);
      return (
        !Number.isNaN(timestamp.getTime()) &&
        timestamp.getFullYear() === now.getFullYear() &&
        timestamp.getMonth() === now.getMonth() &&
        timestamp.getDate() === now.getDate()
      );
    })
    .map((item) => item.temp)
    .filter((value) => Number.isFinite(value));

  if (todayValues.length === 0) {
    return {
      low: Math.round(fallbackTemp),
      high: Math.round(fallbackTemp),
    };
  }

  return {
    low: Math.round(Math.min(...todayValues)),
    high: Math.round(Math.max(...todayValues)),
  };
}

function formatHour(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const hours = date.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const normalized = hours % 12 || 12;
  return `${normalized}${suffix}`;
}

function formatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  const dayNumber = date.getDate();
  return `${weekday} ${dayNumber}`;
}

function formatSourceUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function mapIcon(icon: string): string {
  const normalized = icon.toLowerCase();

  if (normalized.includes('rain') || normalized.includes('shower') || normalized.includes('drizzle')) {
    return 'rain';
  }

  if (normalized.includes('cloud') && !normalized.includes('partly')) {
    return 'cloudy';
  }

  if (normalized.includes('partly')) {
    return 'partly-cloudy';
  }

  if (normalized.includes('clear') || normalized.includes('sun')) {
    return 'clear';
  }

  const code = Number(normalized);
  if (!Number.isFinite(code)) {
    return 'partly-cloudy';
  }

  if ([10, 11, 12, 13, 80, 81, 82].includes(code)) {
    return 'rain';
  }

  if ([3, 4, 5, 6, 7, 8, 9, 30, 31].includes(code)) {
    return 'cloudy';
  }

  if ([0, 1, 32].includes(code)) {
    return 'clear';
  }

  return 'partly-cloudy';
}

function formatLocalTime(value?: string): string {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function inferPressureTrend(
  lat: number,
  lon: number,
  currentPressure: number,
  apiTrend?: 'rising' | 'falling' | 'steady',
): 'rising' | 'falling' | 'steady' {
  if (apiTrend && apiTrend !== 'steady') {
    return apiTrend;
  }

  const storageKey = `pressure:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  const previousRaw = window.localStorage.getItem(storageKey);
  window.localStorage.setItem(storageKey, String(currentPressure));

  if (!previousRaw) {
    return apiTrend ?? 'steady';
  }

  const previous = Number(previousRaw);
  if (!Number.isFinite(previous)) {
    return apiTrend ?? 'steady';
  }

  const delta = currentPressure - previous;
  if (delta >= 0.15) {
    return 'rising';
  }

  if (delta <= -0.15) {
    return 'falling';
  }

  return apiTrend ?? 'steady';
}

function getMoonData(date: Date): { phase: string; illumination: number } {
  const synodicMonth = 29.53058867;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const daysSinceKnown = (date.getTime() - knownNewMoon) / 86400000;
  const phaseAge = ((daysSinceKnown % synodicMonth) + synodicMonth) % synodicMonth;
  const phaseFraction = phaseAge / synodicMonth;
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * phaseFraction)) / 2) * 100);

  const phase =
    phaseFraction < 0.03 || phaseFraction >= 0.97 ? 'New Moon'
      : phaseFraction < 0.22 ? 'Waxing Crescent'
        : phaseFraction < 0.28 ? 'First Quarter'
          : phaseFraction < 0.47 ? 'Waxing Gibbous'
            : phaseFraction < 0.53 ? 'Full Moon'
              : phaseFraction < 0.72 ? 'Waning Gibbous'
                : phaseFraction < 0.78 ? 'Last Quarter'
                  : 'Waning Crescent';

  return { phase, illumination };
}

function clampPercent(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}
