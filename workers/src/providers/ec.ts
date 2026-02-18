import type {
  AlertItem,
  DailyItem,
  HomeWeatherResponse,
  HourlyItem,
  TemperatureUnit,
} from '../types';
import { haversineKm } from '../utils/geo';
import type { HomeWeatherRequest, WeatherProviderAdapter } from './types';

const CITYPAGE_ITEMS_URL = 'https://api.weather.gc.ca/collections/citypageweather-realtime/items';

type LocalizedValue<T> = T | { en?: T; fr?: T };

interface CityPageFeatureCollection {
  features?: CityPageFeature[];
}

interface CityPageFeature {
  geometry?: {
    coordinates?: number[];
  };
  properties?: {
    name?: LocalizedValue<string>;
    region?: LocalizedValue<string>;
    lastUpdated?: string;
    currentConditions?: {
      condition?: LocalizedValue<string>;
      iconCode?: { value?: number | string };
      relativeHumidity?: { value?: LocalizedValue<number> };
      wind?: {
        speed?: { value?: LocalizedValue<number> };
      };
      pressure?: {
        value?: LocalizedValue<number>;
        tendency?: LocalizedValue<string>;
      };
      temperature?: { value?: LocalizedValue<number> };
      windChill?: { value?: LocalizedValue<number> };
    };
    riseSet?: {
      sunrise?: LocalizedValue<string>;
      sunset?: LocalizedValue<string>;
    };
    hourlyForecastGroup?: {
      hourlyForecasts?: Array<{
        timestamp?: string;
        iconCode?: { value?: number | string };
        condition?: LocalizedValue<string>;
        temperature?: { value?: LocalizedValue<number> };
        lop?: { value?: LocalizedValue<number> };
      }>;
    };
    forecastGroup?: {
      forecasts?: Array<{
        period?: {
          textForecastName?: LocalizedValue<string>;
        };
        temperatures?: {
          temperature?: Array<{
            class?: LocalizedValue<string>;
            value?: LocalizedValue<number>;
          }>;
        };
        abbreviatedForecast?: {
          icon?: { value?: number | string };
          textSummary?: LocalizedValue<string>;
        };
        textSummary?: LocalizedValue<string>;
      }>;
    };
    warnings?: Array<{
      title?: LocalizedValue<string>;
      description?: LocalizedValue<string>;
      severity?: LocalizedValue<string>;
    }>;
  };
}

type HourlyForecastEntry = NonNullable<
  NonNullable<NonNullable<CityPageFeature['properties']>['hourlyForecastGroup']>['hourlyForecasts']
>[number];

type DailyForecastEntry = NonNullable<
  NonNullable<NonNullable<CityPageFeature['properties']>['forecastGroup']>['forecasts']
>[number];

type WarningEntry = NonNullable<NonNullable<CityPageFeature['properties']>['warnings']>[number];

export const ecProvider: WeatherProviderAdapter = {
  async getHomeWeather(request: HomeWeatherRequest): Promise<HomeWeatherResponse> {
    const feature = await fetchNearestFeature(request.lat, request.lon);
    const properties = feature.properties;
    if (!properties) {
      throw new Error('Environment Canada response did not include feature properties.');
    }

    const locationLat = feature.geometry?.coordinates?.[1] ?? request.lat;
    const locationLon = feature.geometry?.coordinates?.[0] ?? request.lon;

    const name = readLocalized(properties.name, 'Unknown');
    const region = readLocalized(properties.region, '');
    const locationName = [name, region].filter(Boolean).join(', ');

    const currentTempC = readNumeric(properties.currentConditions?.temperature?.value, 0);
    const feelsLikeC = readNumeric(properties.currentConditions?.windChill?.value, currentTempC);

    const current = {
      temperature: convertTemp(currentTempC, request.unit),
      feelsLike: convertTemp(feelsLikeC, request.unit),
      condition: readLocalized(properties.currentConditions?.condition, 'Unknown'),
      icon: toIcon(properties.currentConditions?.iconCode?.value),
      humidity: readNumeric(properties.currentConditions?.relativeHumidity?.value, 0),
      windKph: readNumeric(properties.currentConditions?.wind?.speed?.value, 0),
      pressureKpa: readNumeric(properties.currentConditions?.pressure?.value, 0),
      pressureTrend: toPressureTrend(readLocalized(properties.currentConditions?.pressure?.tendency, '')),
      visibilityKm: 10,
      uvIndex: 0,
      sunrise: readLocalized(properties.riseSet?.sunrise, ''),
      sunset: readLocalized(properties.riseSet?.sunset, ''),
    };

    const hourly = normalizeHourly(properties.hourlyForecastGroup?.hourlyForecasts ?? [], request.unit);
    const daily = normalizeDaily(properties.forecastGroup?.forecasts ?? [], request.unit);
    const alerts = normalizeAlerts(properties.warnings ?? []);

    return {
      provider: 'ec',
      location: {
        name: locationName || 'Unknown',
        lat: locationLat,
        lon: locationLon,
      },
      current,
      hourly,
      daily,
      alerts,
      updatedAt: properties.lastUpdated ?? new Date().toISOString(),
    };
  },
};

async function fetchNearestFeature(lat: number, lon: number): Promise<CityPageFeature> {
  const searchRadii = [1, 2.5, 5, 10, 20];

  for (const radius of searchRadii) {
    const url = new URL(CITYPAGE_ITEMS_URL);
    url.searchParams.set('f', 'json');
    url.searchParams.set('limit', '80');
    url.searchParams.set('bbox', `${lon - radius},${lat - radius},${lon + radius},${lat + radius}`);

    const collection = await fetchCitypage(url.toString());
    const nearest = pickNearest(collection.features ?? [], lat, lon);
    if (nearest) {
      return nearest;
    }
  }

  const fallbackUrl = new URL(CITYPAGE_ITEMS_URL);
  fallbackUrl.searchParams.set('f', 'json');
  fallbackUrl.searchParams.set('limit', '300');
  const fallbackCollection = await fetchCitypage(fallbackUrl.toString());
  const nearestFallback = pickNearest(fallbackCollection.features ?? [], lat, lon);
  if (!nearestFallback) {
    throw new Error('No Environment Canada citypage weather features were found.');
  }

  return nearestFallback;
}

async function fetchCitypage(url: string): Promise<CityPageFeatureCollection> {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'LiivSky2-Worker/0.1 (+https://liivsky2.pages.dev)',
    },
  });

  if (!response.ok) {
    throw new Error(`Environment Canada request failed with status ${response.status}`);
  }

  return (await response.json()) as CityPageFeatureCollection;
}

function pickNearest(features: CityPageFeature[], lat: number, lon: number): CityPageFeature | null {
  let best: { feature: CityPageFeature; distanceKm: number } | null = null;

  for (const feature of features) {
    const featureLat = feature.geometry?.coordinates?.[1];
    const featureLon = feature.geometry?.coordinates?.[0];
    if (typeof featureLat !== 'number' || typeof featureLon !== 'number') {
      continue;
    }

    const distanceKm = haversineKm(lat, lon, featureLat, featureLon);
    if (!best || distanceKm < best.distanceKm) {
      best = { feature, distanceKm };
    }
  }

  return best?.feature ?? null;
}

function normalizeHourly(hourlyForecasts: HourlyForecastEntry[], unit: TemperatureUnit): HourlyItem[] {
  return (hourlyForecasts ?? []).slice(0, 24).map((hourly) => {
    const tempC = readNumeric(hourly.temperature?.value, 0);

    return {
      time: hourly.timestamp ?? new Date().toISOString(),
      temp: convertTemp(tempC, unit),
      icon: toIcon(hourly.iconCode?.value),
      precipChance: clampPercent(readNumeric(hourly.lop?.value, 0)),
    };
  });
}

function normalizeDaily(forecasts: DailyForecastEntry[], unit: TemperatureUnit): DailyItem[] {
  const grouped = new Map<
    string,
    {
      day: string;
      highC?: number;
      lowC?: number;
      icon?: string;
      daySummary?: string;
      nightSummary?: string;
    }
  >();

  for (const forecast of forecasts ?? []) {
    const periodName = readLocalized(forecast.period?.textForecastName, 'Day').trim() || 'Day';
    const isNight = isNightPeriod(periodName);
    const dayKey = dayKeyFromPeriod(periodName);
    const textSummary = readLocalized(forecast.textSummary, '').trim();
    const abbreviatedSummary = readLocalized(forecast.abbreviatedForecast?.textSummary, '').trim();
    const icon = toIcon(forecast.abbreviatedForecast?.icon?.value);
    const { highC, lowC } = extractPeriodTemps(forecast);

    const existing = grouped.get(dayKey);
    const dayItem = existing ?? {
      day: dayLabelFromKey(dayKey),
    };

    if (!isNight) {
      dayItem.icon = dayItem.icon ?? icon;
      dayItem.daySummary = dayItem.daySummary ?? (textSummary || abbreviatedSummary);
      if (Number.isFinite(highC)) {
        dayItem.highC = highC;
      }
      if (Number.isFinite(lowC) && dayItem.lowC === undefined) {
        dayItem.lowC = lowC;
      }
    } else {
      dayItem.nightSummary = dayItem.nightSummary ?? (textSummary || abbreviatedSummary);
      if (Number.isFinite(lowC)) {
        dayItem.lowC = lowC;
      }
      if (Number.isFinite(highC) && dayItem.highC === undefined) {
        dayItem.highC = highC;
      }
      if (!dayItem.icon) {
        dayItem.icon = icon;
      }
    }

    grouped.set(dayKey, dayItem);
  }

  return Array.from(grouped.values())
    .map((item) => {
      let highC = item.highC;
      let lowC = item.lowC;

      if (!Number.isFinite(highC) && Number.isFinite(lowC)) {
        highC = lowC;
      }

      if (!Number.isFinite(lowC) && Number.isFinite(highC)) {
        lowC = highC;
      }

      if (!Number.isFinite(highC)) {
        highC = 0;
      }

      if (!Number.isFinite(lowC)) {
        lowC = 0;
      }

      const resolvedHighC: number = typeof highC === 'number' && Number.isFinite(highC) ? highC : 0;
      const resolvedLowC: number = typeof lowC === 'number' && Number.isFinite(lowC) ? lowC : 0;

      return {
        day: item.day,
        high: convertTemp(resolvedHighC, unit),
        low: convertTemp(resolvedLowC, unit),
        icon: item.icon ?? 'na',
        daySummary: item.daySummary,
        nightSummary: item.nightSummary,
      };
    })
    .slice(0, 8);
}

function extractPeriodTemps(forecast: DailyForecastEntry): { highC: number; lowC: number } {
  const temps = forecast.temperatures?.temperature ?? [];
  let highC = Number.NaN;
  let lowC = Number.NaN;

  for (const tempEntry of temps) {
    const className = readLocalized(tempEntry.class, '').toLowerCase();
    const value = readNumeric(tempEntry.value, Number.NaN);

    if (className === 'high') {
      highC = value;
    }

    if (className === 'low') {
      lowC = value;
    }
  }

  return { highC, lowC };
}

function isNightPeriod(periodName: string): boolean {
  const value = periodName.toLowerCase();
  return value.includes('tonight') || value.includes('night') || value.includes('overnight') || value.includes('evening');
}

function dayKeyFromPeriod(periodName: string): string {
  const value = periodName.trim().toLowerCase();

  if (value === 'tonight') {
    return 'today';
  }

  if (value.endsWith(' night')) {
    return value.slice(0, -' night'.length).trim() || value;
  }

  return value;
}

function dayLabelFromKey(dayKey: string): string {
  if (dayKey === 'today') {
    return 'Today';
  }

  return dayKey
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeAlerts(warnings: WarningEntry[]): AlertItem[] {
  return (warnings ?? [])
    .map((warning) => ({
      title: readLocalized(warning.title, '').trim(),
      severity: readLocalized(warning.severity, '').trim() || undefined,
      description: readLocalized(warning.description, '').trim() || undefined,
    }))
    .filter((warning) => warning.title.length > 0);
}

function toIcon(iconCode: number | string | undefined): string {
  if (typeof iconCode === 'number' || typeof iconCode === 'string') {
    return String(iconCode);
  }

  return 'na';
}

function convertTemp(valueC: number, unit: TemperatureUnit): number {
  if (unit === 'F') {
    return Math.round((valueC * 9) / 5 + 32);
  }

  return Math.round(valueC);
}

function readLocalized<T>(value: LocalizedValue<T> | undefined, fallback: T): T {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === 'object' && value !== null) {
    if ('en' in value && value.en !== undefined) {
      return value.en;
    }

    if ('fr' in value && value.fr !== undefined) {
      return value.fr;
    }
  }

  return value as T;
}

function readNumeric(value: LocalizedValue<number> | undefined, fallback: number): number {
  const localized = readLocalized(value, fallback);
  return Number.isFinite(localized) ? localized : fallback;
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

function toPressureTrend(value: string): 'rising' | 'falling' | 'steady' {
  const normalized = value.toLowerCase();

  if (
    normalized.includes('rise') ||
    normalized.includes('rising') ||
    normalized.includes('hausse') ||
    normalized.includes('up')
  ) {
    return 'rising';
  }

  if (
    normalized.includes('fall') ||
    normalized.includes('falling') ||
    normalized.includes('baisse') ||
    normalized.includes('down')
  ) {
    return 'falling';
  }

  return 'steady';
}
