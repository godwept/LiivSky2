/**
 * Region presets for the Models page map viewer.
 *
 * Each region defines a display label, map center, and initial zoom level.
 * The "local" region is a special case — its center is replaced at runtime
 * with the user's current lat/lon from the Zustand weather store.
 */

/** A map region preset. */
export interface ModelRegion {
  id: string;
  /** Short display label for the region picker pill */
  label: string;
  /** [lat, lon] map center point */
  center: [number, number];
  /** Leaflet zoom level */
  zoom: number;
}

/** All available region presets, ordered for display. */
export const MODEL_REGIONS: ModelRegion[] = [
  { id: 'north_america', label: 'N. America', center: [48, -97],   zoom: 3 },
  { id: 'canada',        label: 'Canada',     center: [60, -96],   zoom: 3 },
  { id: 'conus',         label: 'CONUS',      center: [38, -96],   zoom: 4 },
  { id: 'tropics',       label: 'Tropics',    center: [20, -70],   zoom: 3 },
  { id: 'northeast',     label: 'Northeast',  center: [43, -74],   zoom: 6 },
  { id: 'southeast',     label: 'Southeast',  center: [32, -83],   zoom: 6 },
  { id: 'great_lakes',   label: 'Gr. Lakes',  center: [45, -84],   zoom: 6 },
  { id: 'prairies',      label: 'Prairies',   center: [52, -105],  zoom: 6 },
  { id: 'bc_pacific',    label: 'BC/Pacific', center: [54, -123],  zoom: 5 },
  {
    id: 'local',
    label: 'Local',
    // center is overridden at runtime with the user's location
    center: [0, 0],
    zoom: 8,
  },
];

/** Default region to use on first load. */
export const DEFAULT_REGION_ID = 'canada';
