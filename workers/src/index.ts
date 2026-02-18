import { ecProvider } from './providers/ec';
import { twnProvider } from './providers/twn';
import { reverseGeocode, searchGeocode } from './services/geocode';
import type { Env, TemperatureUnit, WeatherProvider } from './types';
import { toFiniteNumber } from './utils/geo';
import { errorResponse, jsonResponse, preflightResponse, withCache } from './utils/http';

const DEFAULT_PROVIDER: WeatherProvider = 'ec';
const DEFAULT_UNIT: TemperatureUnit = 'C';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return preflightResponse(env);
    }

    if (request.method !== 'GET') {
      return errorResponse(405, 'method_not_allowed', 'Only GET is supported.', undefined, env);
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === '/api/v1/geocode/search') {
        return await handleGeocodeSearch(url, env);
      }

      if (url.pathname === '/api/v1/geocode/reverse') {
        return await handleGeocodeReverse(url, env);
      }

      if (url.pathname === '/api/v1/weather/home') {
        return await handleWeatherHome(url, env);
      }

      return errorResponse(404, 'not_found', 'Endpoint not found.', undefined, env);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown worker error.';
      return errorResponse(500, 'internal_error', 'Unexpected worker error.', message, env);
    }
  },
};

async function handleGeocodeSearch(url: URL, env: Env): Promise<Response> {
  const query = (url.searchParams.get('q') ?? '').trim();
  if (query.length < 2) {
    return errorResponse(400, 'invalid_query', 'Query parameter q must be at least 2 characters.', undefined, env);
  }

  const results = await searchGeocode(query);
  return withCache(jsonResponse({ results }, { status: 200 }, env), 3600);
}

async function handleGeocodeReverse(url: URL, env: Env): Promise<Response> {
  const lat = toFiniteNumber(url.searchParams.get('lat'));
  const lon = toFiniteNumber(url.searchParams.get('lon'));

  if (lat === null || lon === null) {
    return errorResponse(400, 'invalid_coordinates', 'lat and lon must both be valid numbers.', undefined, env);
  }

  const result = await reverseGeocode(lat, lon);
  return withCache(jsonResponse({ result }, { status: 200 }, env), 86400);
}

async function handleWeatherHome(url: URL, env: Env): Promise<Response> {
  const lat = toFiniteNumber(url.searchParams.get('lat'));
  const lon = toFiniteNumber(url.searchParams.get('lon'));

  if (lat === null || lon === null) {
    return errorResponse(400, 'invalid_coordinates', 'lat and lon must both be valid numbers.', undefined, env);
  }

  const providerParam = (url.searchParams.get('provider') ?? DEFAULT_PROVIDER).toLowerCase();
  const provider = toProvider(providerParam);
  if (!provider) {
    return errorResponse(400, 'invalid_provider', 'provider must be ec or twn.', undefined, env);
  }

  const unitParam = (url.searchParams.get('unit') ?? DEFAULT_UNIT).toUpperCase();
  const unit = toUnit(unitParam);
  if (!unit) {
    return errorResponse(400, 'invalid_unit', 'unit must be C or F.', undefined, env);
  }

  try {
    const adapter = provider === 'ec' ? ecProvider : twnProvider;
    const data = await adapter.getHomeWeather({ lat, lon, unit });
    const cacheSeconds = provider === 'twn' ? 60 : 300;
    return withCache(jsonResponse(data, { status: 200 }, env), cacheSeconds);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Provider request failed.';
    return errorResponse(502, 'upstream_error', 'Weather provider request failed.', message, env);
  }
}

function toProvider(value: string): WeatherProvider | null {
  if (value === 'ec' || value === 'twn') {
    return value;
  }

  return null;
}

function toUnit(value: string): TemperatureUnit | null {
  if (value === 'C' || value === 'F') {
    return value;
  }

  return null;
}
