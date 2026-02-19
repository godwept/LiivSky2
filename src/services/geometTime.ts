/**
 * Utilities for parsing EC GeoMet WMS time dimensions.
 *
 * EC GeoMet advertises time as an ISO 8601 interval string in GetCapabilities:
 *   "2026-02-18T14:00:00Z/2026-02-18T17:00:00Z/PT6M"
 *
 * This module fetches the current time range for a given layer and expands it
 * into an array of ISO timestamp strings usable as the WMS TIME parameter.
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
 * Fetch the time dimension for a given EC GeoMet WMS layer.
 * Uses a layer-specific GetCapabilities request (small XML payload).
 */
export async function fetchTimeDimension(
  layerName: string,
): Promise<WmsTimeDimension> {
  const url = `${EC_GEOMET_WMS_URL}?service=WMS&version=1.3.0&request=GetCapabilities&layer=${encodeURIComponent(layerName)}`;
  const resp = await fetch(url);
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

  const times = expandInterval(intervalStr);
  return { times, defaultTime };
}

/**
 * Expand an ISO 8601 time interval string into individual timestamps.
 *
 * Format: "start/end/step"  e.g. "2026-02-18T14:00:00Z/2026-02-18T17:00:00Z/PT6M"
 * Step is an ISO 8601 duration — we support PTnM (minutes) and PTnH (hours).
 */
function expandInterval(interval: string): string[] {
  const parts = interval.split('/');
  if (parts.length !== 3) return [interval]; // fallback: single value

  const start = new Date(parts[0]);
  const end = new Date(parts[1]);
  const stepMs = parseDuration(parts[2]);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || stepMs <= 0) {
    return [interval];
  }

  const times: string[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += stepMs) {
    times.push(new Date(t).toISOString().replace('.000Z', 'Z'));
  }
  return times;
}

/** Parse an ISO 8601 duration (PTnM, PTnH, PTnS) into milliseconds */
function parseDuration(dur: string): number {
  const match = dur.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}
