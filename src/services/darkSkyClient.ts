/**
 * Service for fetching dark sky / astronomy forecast data from 7Timer!
 *
 * Uses the ASTRO product which provides cloud cover, seeing, transparency,
 * and other parameters critical for stargazing and astronomy.
 *
 * API: http://www.7timer.info/bin/api.pl?lon={lon}&lat={lat}&product=astro&output=json
 * No auth required. Free and open.
 *
 * @see https://www.7timer.info/doc.php?lang=en
 */
import type {
  AstroApiResponse,
  AstroTimestep,
  DarkSkyForecast,
  DarkSkyForecastItem,
  CloudCoverValue,
  SeeingValue,
  TransparencyValue,
  WindSpeedValue,
  LiftedIndexValue,
} from '../types/darksky';

const API_BASE = 'https://www.7timer.info/bin/api.pl';

/**
 * 7Timer uses -9999 as a sentinel "no data" value for numeric fields.
 * Any timestep containing sentinel values must be discarded.
 */
const SENTINEL = -9999;

/** Cloud cover value → approximate percentage midpoint */
const CLOUD_COVER_PCT: Record<CloudCoverValue, number> = {
  1: 3, 2: 12, 3: 25, 4: 37, 5: 50, 6: 62, 7: 75, 8: 87, 9: 97,
};

/** Cloud cover value → human label */
const CLOUD_COVER_LABEL: Record<CloudCoverValue, string> = {
  1: 'Clear', 2: 'Mostly Clear', 3: 'Partly Clear',
  4: 'Partly Cloudy', 5: 'Half Cloudy', 6: 'Mostly Cloudy',
  7: 'Cloudy', 8: 'Very Cloudy', 9: 'Overcast',
};

/** Seeing value → human label */
const SEEING_LABEL: Record<SeeingValue, string> = {
  1: 'Superb (<0.5″)', 2: 'Excellent (0.5–0.75″)', 3: 'Very Good (0.75–1″)',
  4: 'Good (1–1.25″)', 5: 'Average (1.25–1.5″)', 6: 'Below Avg (1.5–2″)',
  7: 'Poor (2–2.5″)', 8: 'Very Poor (>2.5″)',
};

/** Transparency value → human label */
const TRANSPARENCY_LABEL: Record<TransparencyValue, string> = {
  1: 'Superb (<0.3)', 2: 'Excellent (0.3–0.4)', 3: 'Very Good (0.4–0.5)',
  4: 'Good (0.5–0.6)', 5: 'Average (0.6–0.7)', 6: 'Below Avg (0.7–0.85)',
  7: 'Poor (0.85–1)', 8: 'Very Poor (>1)',
};

/** Wind speed value → human label */
const WIND_LABEL: Record<WindSpeedValue, string> = {
  1: 'Calm', 2: 'Light', 3: 'Moderate', 4: 'Fresh',
  5: 'Strong', 6: 'Gale', 7: 'Storm', 8: 'Hurricane',
};

/** Lifted index → stability label */
function stabilityLabel(li: LiftedIndexValue): string {
  if (li <= -6) return 'Very Unstable';
  if (li <= -4) return 'Unstable';
  if (li <= -1) return 'Slightly Unstable';
  if (li <= 2) return 'Neutral';
  if (li <= 6) return 'Stable';
  return 'Very Stable';
}

/** Humidity code → approximate percentage (7Timer astro uses -4 to 16 scale) */
function humidityPct(rh2m: number): number {
  // Scale: -4 → 0-5%, each +1 → +5%, 16 → 100%
  return Math.max(0, Math.min(100, (rh2m + 4) * 5));
}

/**
 * Compute an overall stargazing quality score (0–100).
 *
 * Weights:
 *  - Cloud cover: 45% (most important — you need clear skies)
 *  - Transparency: 25% (affects limiting magnitude)
 *  - Seeing: 20% (affects resolution)
 *  - Humidity & wind: 10% (comfort and dew risk)
 */
function computeStargazingScore(ts: AstroTimestep): number {
  // Cloud cover: 1 (best) → 100, 9 (worst) → 0
  const cloudScore = ((9 - ts.cloudcover) / 8) * 100;
  // Transparency: 1 (best) → 100, 8 (worst) → 0
  const transScore = ((8 - ts.transparency) / 7) * 100;
  // Seeing: 1 (best) → 100, 8 (worst) → 0
  const seeingScore = ((8 - ts.seeing) / 7) * 100;
  // Comfort: low humidity + low wind = good
  const humScore = Math.max(0, 100 - humidityPct(ts.rh2m));
  const windScore = ((8 - ts.wind10m.speed) / 7) * 100;
  const comfortScore = (humScore + windScore) / 2;

  const raw =
    cloudScore * 0.45 +
    transScore * 0.25 +
    seeingScore * 0.20 +
    comfortScore * 0.10;

  // Clamp to valid range as a safety net against any unexpected API values.
  return Math.round(Math.max(0, Math.min(100, raw)));
}

/**
 * Parse the 7Timer init string (e.g. "2026021806") into a Date.
 */
function parseInitTime(init: string): Date {
  const year = parseInt(init.slice(0, 4), 10);
  const month = parseInt(init.slice(4, 6), 10) - 1;
  const day = parseInt(init.slice(6, 8), 10);
  const hour = parseInt(init.slice(8, 10), 10);
  return new Date(Date.UTC(year, month, day, hour));
}

/**
 * Process a raw ASTRO API timestep into a display-ready item.
 */
function processTimestep(ts: AstroTimestep, initDate: Date): DarkSkyForecastItem {
  const dt = new Date(initDate.getTime() + ts.timepoint * 3600_000);
  return {
    timeLabel: dt.toLocaleString(undefined, {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    dateTime: dt.toISOString(),
    cloudCoverPct: CLOUD_COVER_PCT[ts.cloudcover as CloudCoverValue] ?? 50,
    cloudCoverLabel: CLOUD_COVER_LABEL[ts.cloudcover as CloudCoverValue] ?? 'Unknown',
    seeingLabel: SEEING_LABEL[ts.seeing as SeeingValue] ?? 'Unknown',
    seeingValue: ts.seeing,
    transparencyLabel: TRANSPARENCY_LABEL[ts.transparency as TransparencyValue] ?? 'Unknown',
    transparencyValue: ts.transparency,
    stargazingScore: computeStargazingScore(ts),
    temp: ts.temp2m,
    windLabel: WIND_LABEL[ts.wind10m.speed as WindSpeedValue] ?? 'Unknown',
    windDirection: ts.wind10m.direction,
    humidityPct: humidityPct(ts.rh2m),
    precipType: ts.prec_type,
    stabilityLabel: stabilityLabel(ts.lifted_index as LiftedIndexValue),
  };
}

/**
 * Fetch the 7Timer ASTRO forecast for a given location.
 */
export async function fetchDarkSkyForecast(
  lat: number,
  lon: number,
): Promise<DarkSkyForecast> {
  const url = `${API_BASE}?lon=${lon.toFixed(3)}&lat=${lat.toFixed(3)}&product=astro&output=json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`7Timer API returned ${res.status}`);
  }
  const data = (await res.json()) as AstroApiResponse;
  const initDate = parseInitTime(data.init);

  // Filter out timesteps where 7Timer has emitted -9999 sentinel values.
  // These appear when model data is unavailable for that timepoint and
  // would otherwise produce wildly out-of-range scores.
  const validSeries = data.dataseries.filter(
    (ts) =>
      ts.seeing !== SENTINEL &&
      ts.transparency !== SENTINEL &&
      ts.rh2m !== SENTINEL &&
      ts.lifted_index !== SENTINEL,
  );

  const items = validSeries.map((ts) => processTimestep(ts, initDate));

  return {
    lat,
    lon,
    initTime: initDate.toISOString(),
    items,
  };
}
