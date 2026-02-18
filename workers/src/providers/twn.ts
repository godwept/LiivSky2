import type { AlertItem, DailyItem, HomeWeatherResponse, HourlyItem, TemperatureUnit } from '../types';
import { reverseGeocode } from '../services/geocode';
import type { HomeWeatherRequest, WeatherProviderAdapter } from './types';

const TWN_API_BASE = 'https://weatherapi.pelmorex.com/api/v1';

interface TwnResponseDisplay {
  unit?: {
    pressure?: string;
  };
}

interface TwnObservationResponse {
  observation?: {
    time?: {
      local?: string;
      utc?: string;
    };
    weatherCode?: {
      icon?: number;
      text?: string;
    };
    temperature?: number;
    feelsLike?: number;
    relativeHumidity?: number;
    wind?: {
      speed?: number;
    };
    pressure?: {
      value?: number;
      trendKey?: number;
    };
    visibility?: number;
  };
  display?: TwnResponseDisplay;
}

interface TwnHourlyItem {
  time?: {
    local?: string;
    utc?: string;
  };
  weatherCode?: {
    icon?: number;
  };
  temperature?: {
    value?: number;
  };
  pop?: number;
}

interface TwnHourlyResponse {
  hourly?: TwnHourlyItem[];
  generatedTimestamp?: {
    local?: string;
    utc?: string;
  };
}

interface TwnLongtermPeriod {
  weatherCode?: {
    icon?: number;
    text?: string;
  };
  temperature?: {
    value?: number;
  };
}

interface TwnLongtermItem {
  time?: {
    local?: string;
    utc?: string;
  };
  maxTemperature?: number | null;
  minTemperature?: number | null;
  day?: TwnLongtermPeriod;
  night?: TwnLongtermPeriod;
}

interface TwnLongtermResponse {
  longTerm?: TwnLongtermItem[];
}

export const twnProvider: WeatherProviderAdapter = {
  async getHomeWeather(request: HomeWeatherRequest): Promise<HomeWeatherResponse> {
    const query = new URLSearchParams({
      locale: 'en-CA',
      lat: String(request.lat),
      long: String(request.lon),
      unit: 'metric',
    });

    const [observationResponse, hourlyResponse, longtermResponse, locationName] = await Promise.all([
      fetchTwnJson<TwnObservationResponse>(`${TWN_API_BASE}/observation?${query.toString()}`),
      fetchTwnJson<TwnHourlyResponse>(`${TWN_API_BASE}/hourly?${query.toString()}`),
      fetchTwnJson<TwnLongtermResponse>(`${TWN_API_BASE}/longterm?${query.toString()}&count=8&offset=0`),
      resolveLocationName(request.lat, request.lon),
    ]);

    const observation = observationResponse.observation;
    if (!observation) {
      throw new Error('Weather Network observation payload missing observation data.');
    }

    const pressureUnit = observationResponse.display?.unit?.pressure?.toLowerCase() ?? 'kpa';
    const pressureRaw = toFinite(observation.pressure?.value, 0);
    const pressureKpa = pressureUnit === 'kpa' ? pressureRaw : pressureRaw / 10;

    const currentTempC = toFinite(observation.temperature, 0);
    const feelsLikeC = toFinite(observation.feelsLike, currentTempC);
    const updatedAt =
      normalizeTimestamp(hourlyResponse.generatedTimestamp?.utc) ??
      normalizeTimestamp(hourlyResponse.generatedTimestamp?.local) ??
      normalizeTimestamp(observation.time?.utc) ??
      normalizeTimestamp(observation.time?.local) ??
      new Date().toISOString();

    const current = {
      temperature: convertTemp(currentTempC, request.unit),
      feelsLike: convertTemp(feelsLikeC, request.unit),
      condition: observation.weatherCode?.text?.trim() || 'Unknown',
      icon: toIcon(observation.weatherCode?.icon),
      humidity: clampPercent(toFinite(observation.relativeHumidity, 0)),
      windKph: toFinite(observation.wind?.speed, 0),
      pressureKpa: Number(pressureKpa.toFixed(1)),
      pressureTrend: toPressureTrend(observation.pressure?.trendKey),
      visibilityKm: toFinite(observation.visibility, 10),
      uvIndex: 0,
    };

    const hourly = normalizeHourly(hourlyResponse.hourly ?? [], request.unit);
    const daily = normalizeDaily(longtermResponse.longTerm ?? [], request.unit);
    const alerts: AlertItem[] = [];

    return {
      provider: 'twn',
      location: {
        name: locationName,
        lat: request.lat,
        lon: request.lon,
      },
      current,
      hourly,
      daily,
      alerts,
      updatedAt,
    };
  },
};

async function fetchTwnJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'LiivSky2-Worker/0.1 (+https://liivsky2.pages.dev)',
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Weather Network request failed (${response.status}): ${body.slice(0, 200)}`);
  }

  return (await response.json()) as T;
}

async function resolveLocationName(lat: number, lon: number): Promise<string> {
  try {
    const result = await reverseGeocode(lat, lon);
    if (result.name?.trim()) {
      return result.name;
    }
  } catch {
  }

  return `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
}

function normalizeHourly(items: TwnHourlyItem[], unit: TemperatureUnit): HourlyItem[] {
  return items.slice(0, 24).map((item) => {
    const tempC = toFinite(item.temperature?.value, 0);

    return {
      time: normalizeTimestamp(item.time?.local) ?? normalizeTimestamp(item.time?.utc) ?? new Date().toISOString(),
      temp: convertTemp(tempC, unit),
      icon: toIcon(item.weatherCode?.icon),
      precipChance: clampPercent(toFinite(item.pop, 0)),
    };
  });
}

function normalizeDaily(items: TwnLongtermItem[], unit: TemperatureUnit): DailyItem[] {
  return items.slice(0, 8).map((item) => {
    const dayTemp = toFinite(item.day?.temperature?.value, Number.NaN);
    const nightTemp = toFinite(item.night?.temperature?.value, Number.NaN);
    const maxTemp = toFinite(item.maxTemperature ?? undefined, Number.NaN);
    const minTemp = toFinite(item.minTemperature ?? undefined, Number.NaN);

    const highC = Number.isFinite(maxTemp)
      ? maxTemp
      : Number.isFinite(dayTemp)
        ? dayTemp
        : Number.isFinite(nightTemp)
          ? nightTemp
          : 0;

    const lowC = Number.isFinite(minTemp)
      ? minTemp
      : Number.isFinite(nightTemp)
        ? nightTemp
        : Number.isFinite(dayTemp)
          ? dayTemp
          : 0;

    return {
      day: normalizeTimestamp(item.time?.local) ?? normalizeTimestamp(item.time?.utc) ?? new Date().toISOString(),
      high: convertTemp(highC, unit),
      low: convertTemp(lowC, unit),
      icon: toIcon(item.day?.weatherCode?.icon ?? item.night?.weatherCode?.icon),
      daySummary: item.day?.weatherCode?.text,
      nightSummary: item.night?.weatherCode?.text,
    };
  });
}

function toFinite(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clampPercent(value: number): number {
  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return Math.round(value);
}

function toIcon(icon: number | undefined): string {
  return typeof icon === 'number' ? String(icon) : 'na';
}

function convertTemp(valueC: number, unit: TemperatureUnit): number {
  if (unit === 'F') {
    return Math.round((valueC * 9) / 5 + 32);
  }

  return Math.round(valueC);
}

function normalizeTimestamp(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const hasTimezone = /z$|[+-]\d{2}:?\d{2}$/i.test(value);
  if (!hasTimezone) {
    const localDate = new Date(value);
    return Number.isNaN(localDate.getTime()) ? null : value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function toPressureTrend(trendKey: number | undefined): 'rising' | 'falling' | 'steady' {
  if (trendKey === 1) {
    return 'falling';
  }

  if (trendKey === 3) {
    return 'rising';
  }

  return 'steady';
}
