/**
 * Client for fetching visible satellite passes via our Cloudflare Worker proxy.
 * The worker queries N2YO.com for ISS, Hubble, Tiangong, etc.
 */
import type { SatellitePassesResponse } from '../types/darksky';

function getApiBaseUrl(): string {
  const fromEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    ?.VITE_API_BASE_URL;
  return (fromEnv && fromEnv.trim().length > 0 ? fromEnv : '/api/v1').replace(/\/$/, '');
}

/**
 * Fetch upcoming bright/visible satellite passes for a location.
 */
export async function fetchSatellitePasses(
  lat: number,
  lon: number,
): Promise<SatellitePassesResponse> {
  const apiBase = getApiBaseUrl();
  const url = new URL(`${apiBase}/satellites/passes`, window.location.origin);
  url.searchParams.set('lat', lat.toFixed(4));
  url.searchParams.set('lon', lon.toFixed(4));

  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Satellite passes API returned ${res.status}`);
  }
  return (await res.json()) as SatellitePassesResponse;
}
