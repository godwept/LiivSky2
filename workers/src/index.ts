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

      if (url.pathname === '/api/v1/satellites/passes') {
        return await handleSatellitePasses(url, env);
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

// ======== Satellite passes (N2YO) ========

/** Well-known bright/large satellites to query for visual passes. */
const TRACKED_SATS = [
  { id: 25544, name: 'ISS' },
  { id: 20580, name: 'Hubble' },
  { id: 54216, name: 'Tiangong' },
  { id: 27386, name: 'Envisat' },
  { id: 25078, name: 'Iridium 8' },
  { id: 43226, name: 'Rocket Body (Falcon 9)' },
  { id: 28654, name: 'NOAA 18' },
  { id: 33591, name: 'NOAA 19' },
  { id: 28376, name: 'Lacrosse 5' },
  { id: 39084, name: 'Cosmos 2486' },
  { id: 40258, name: 'Yaogan 22' },
  { id: 37820, name: 'Tiangong 1 DEB' },
  { id: 44420, name: 'CZ-5B Rocket Body' },
  { id: 57320, name: 'Starlink-5001' },
];

interface N2YoPass {
  startUTC: number;
  startAz: number;
  startAzCompass: string;
  endAz: number;
  endAzCompass: string;
  maxEl: number;
  duration: number;
  mag: number;
}

interface N2YoResponse {
  info?: { satid: number; satname: string; passescount: number };
  passes?: N2YoPass[];
}

async function handleSatellitePasses(url: URL, env: Env): Promise<Response> {
  const lat = toFiniteNumber(url.searchParams.get('lat'));
  const lon = toFiniteNumber(url.searchParams.get('lon'));

  if (lat === null || lon === null) {
    return errorResponse(400, 'invalid_coordinates', 'lat and lon must both be valid numbers.', undefined, env);
  }

  if (!env.N2YO_API_KEY) {
    return errorResponse(500, 'config_error', 'N2YO API key is not configured.', undefined, env);
  }

  const alt = 0; // metres above sea level — default
  const days = 10; // look ahead
  const minVisibility = 60; // minimum seconds visible

  const allPasses: Array<{
    satName: string;
    satId: number;
    startUTC: number;
    maxEl: number;
    duration: number;
    startAz: string;
    startAzCompass: number;
    endAz: string;
    endAzCompass: number;
    mag: number;
  }> = [];

  // Fetch passes for each tracked satellite in parallel
  try {
    await Promise.allSettled(
      TRACKED_SATS.map(async (sat) => {
        const apiUrl = `https://api.n2yo.com/rest/v1/satellite/visualpasses/${sat.id}/${lat}/${lon}/${alt}/${days}/${minVisibility}?apiKey=${env.N2YO_API_KEY}`;
        const res = await fetch(apiUrl);
        if (!res.ok) return;
        const text = await res.text();
        let data: N2YoResponse;
        try {
          data = JSON.parse(text) as N2YoResponse;
        } catch {
          return; // non-JSON response, skip
        }
        if (!data.passes || !Array.isArray(data.passes)) return;
        const satName = data.info?.satname ?? sat.name;
        for (const p of data.passes) {
          allPasses.push({
            satName,
            satId: sat.id,
            startUTC: p.startUTC,
            maxEl: p.maxEl,
            duration: p.duration,
            startAz: p.startAzCompass ?? '',
            startAzCompass: p.startAz ?? 0,
            endAz: p.endAzCompass ?? '',
            endAzCompass: p.endAz ?? 0,
            mag: typeof p.mag === 'number' ? p.mag : 0,
          });
        }
      }),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown N2YO fetch error';
    return errorResponse(502, 'upstream_error', 'Failed to fetch satellite passes.', msg, env);
  }

  // Sort by time, keep all returned passes (N2YO already filters to visible)
  const passes = allPasses
    .sort((a, b) => a.startUTC - b.startUTC)
    .slice(0, 20);

  return withCache(jsonResponse({ passes }, { status: 200 }, env), 1800);
}
