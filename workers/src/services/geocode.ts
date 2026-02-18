import type { GeocodeResult } from '../types';

interface NominatimSearchItem {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    country?: string;
    state?: string;
    province?: string;
  };
}

export async function searchGeocode(query: string): Promise<GeocodeResult[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '8');

  const response = await fetch(url.toString(), {
    headers: {
      'user-agent': 'LiivSky2-Worker/0.1 (+https://liivsky2.pages.dev)',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocode search failed with status ${response.status}`);
  }

  const payload = (await response.json()) as NominatimSearchItem[];
  return payload.map(toGeocodeResult);
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');

  const response = await fetch(url.toString(), {
    headers: {
      'user-agent': 'LiivSky2-Worker/0.1 (+https://liivsky2.pages.dev)',
    },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocode failed with status ${response.status}`);
  }

  const payload = (await response.json()) as NominatimSearchItem;
  return toGeocodeResult(payload);
}

function toGeocodeResult(item: NominatimSearchItem): GeocodeResult {
  return {
    name: item.display_name,
    lat: Number(item.lat),
    lon: Number(item.lon),
    country: item.address?.country,
    region: item.address?.state ?? item.address?.province,
  };
}
