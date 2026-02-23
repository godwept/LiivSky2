/**
 * Types for the interactive weather map feature.
 */

/** Available overlay layer identifiers */
export type MapLayerId = 'radar' | 'satellite' | 'hrrr' | 'lightning';

/** Metadata for a single map overlay layer */
export interface MapLayerDefinition {
  /** Unique layer identifier */
  id: MapLayerId;
  /** Display label shown in layer control */
  label: string;
  /** Whether the layer is currently toggled on */
  active: boolean;
  /** Whether the layer is available (false = placeholder/coming soon) */
  available: boolean;
  /** Accent color for the toggle indicator */
  color: string;
}

/**
 * WMS overlay descriptor passed to WeatherMap.
 * Each entry becomes a `<WMSTileLayer>` in the Leaflet map.
 */
export interface WmsOverlayDef {
  /** Unique key (used as React key) */
  id: string;
  /** WMS base URL (e.g. EC GeoMet endpoint) */
  url: string;
  /** WMS layer name */
  layers: string;
  /** Layer opacity 0–1 */
  opacity?: number;
  /** Image format */
  format?: string;
  /** Whether tiles use transparency */
  transparent?: boolean;
  /** WMS TIME parameter (ISO 8601 UTC timestamp) for temporal animation */
  time?: string;
  /** All available timestamps for pre-caching animation frames */
  allTimes?: string[];
  /**
   * Forecast-layer mode (e.g. HRRR).
   * When true, `allTimes` contains WMS *layer names* instead of TIME values.
   * Each animation frame swaps the layer name rather than the TIME param.
   */
  forecastMode?: boolean;
  /**
   * Extra WMS query parameters appended to every tile request.
   * Used for e.g. `ELEVATION=2` in UCAR ncWMS height-above-ground layers.
   */
  extraParams?: Record<string, string>;
  /** Attribution text for the overlay source */
  attribution?: string;
}
