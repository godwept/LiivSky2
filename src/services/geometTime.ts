/**
 * Utilities for parsing WMS time dimensions.
 *
 * Supports two server formats:
 *
 * 1. **EC GeoMet interval format** (ISO 8601 interval):
 *    `"2026-02-18T14:00:00Z/2026-02-19T14:00:00Z/PT1H"`
 *
 * 2. **UCAR ncWMS list format** (comma-separated ISO timestamps):
 *    `"2026-02-18T00:00:00.000Z,2026-02-18T01:00:00.000Z,..."`
 *
 * The correct format is detected automatically.
 */

import { EC_GEOMET_WMS_URL } from './ecGeometLayers';

/** Parsed time dimension for a WMS layer */
export interface WmsTimeDimension {
  /** All available timestamps (ISO 8601 UTC) */
  times: string[];
  /** The server-advertised default time */
  defaultTime: string;
}

/**
 * Fetch the time dimension for a WMS layer.
 *
 * @param layerName  WMS layer name to query
 * @param wmsUrl     Base WMS URL (defaults to EC GeoMet)
 */
export async function fetchTimeDimension(
  layerName: string,
  wmsUrl: string = EC_GEOMET_WMS_URL,
): Promise<WmsTimeDimension> {
  const capUrl = `${wmsUrl}?service=WMS&version=1.3.0&request=GetCapabilities&layer=${encodeURIComponent(layerName)}`;
  const resp = await fetch(capUrl);
  if (!resp.ok) throw new Error(`GetCapabilities failed: ${resp.status}`);

  const xml = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  // Find the <Dimension name="time" ...> element
  const dims = doc.querySelectorAll('Dimension');
  let dimEl: Element | null = null;
  dims.forEach((el) => {
    if (el.getAttribute('name') === 'time') dimEl = el;
  });

  if (!dimEl) throw new Error(`No time dimension for layer ${layerName}`);

  const defaultTime = (dimEl as Element).getAttribute('default') ?? '';
  const intervalStr = (dimEl as Element).textContent?.trim() ?? '';

  const times = expandTimeDimension(intervalStr);
  return { times, defaultTime };
}

/**
 * Parse the WMS Dimension content into an array of ISO timestamp strings.
 *
 * Handles:
 *   - ISO 8601 interval: `start/end/step`
 *   - Comma-separated list: `t1,t2,t3,...`
 *   - Mixed: both styles may appear separated by commas
 */
export function expandTimeDimension(dimensionStr: string): string[] {
  if (!dimensionStr) return [];

  const results: string[] = [];

  // Each segment may be an interval or a single timestamp
  const segments = dimensionStr.split(',').map((s) => s.trim()).filter(Boolean);

  for (const seg of segments) {
    if (seg.includes('/')) {
      // ISO 8601 interval: start/end/step
      const expanded = expandInterval(seg);
      results.push(...expanded);
    } else {
      // Single ISO timestamp
      results.push(seg);
    }
  }

  // Deduplicate while preserving order
  return [...new Set(results)];
}

/**
 * Expand an ISO 8601 time interval `start/end/step` into individual timestamps.
 * Step format supported: PT(n)H, PT(n)M, PT(n)S, P(n)D.
 */
function expandInterval(interval: string): string[] {
  const parts = interval.split('/');
  if (parts.length !== 3) return [interval]; // fallback: treat as single value

  const start = new Date(parts[0]!);
  const end = new Date(parts[1]!);
  const stepMs = parseDuration(parts[2]!);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || stepMs <= 0) {
    return parts[0] ? [parts[0]] : [];
  }

  const times: string[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += stepMs) {
    times.push(new Date(t).toISOString().replace('.000Z', 'Z'));
  }
  return times;
}

/** Parse an ISO 8601 duration string (PT(n)H, PT(n)M, PT(n)S, P(n)D) → ms */
function parseDuration(dur: string): number {
  // Days: P(n)D
  const dayMatch = dur.match(/^P(\d+)D$/i);
  if (dayMatch) return parseInt(dayMatch[1]!, 10) * 86400000;

  // Time components: PT(n)H(m)M(s)S
  const match = dur.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return 0;
  const hours   = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}
