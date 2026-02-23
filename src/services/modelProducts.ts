/**
 * Product categories and parameters for the Models page.
 *
 * Links each displayable weather product to:
 *   - An EC GeoMet WMS map layer parameter (for the map view)
 *   - An Open-Meteo hourly variable (for the chart comparison)
 *
 * Products marked `comingSoon: true` will render as disabled pills until
 * the required WMS source is integrated in a later phase.
 */
import type { ModelMapParamId } from './ecGeometLayers';
import type { ModelParameter } from '../types/models';

/** Identifiers for the top-level product category tabs. */
export type ProductCategoryId =
  | 'surface'
  | 'precip'
  | 'upper_air'
  | 'moisture'
  | 'severe'
  | 'winter';

/** A top-level product category (tab). */
export interface ProductCategory {
  id: ProductCategoryId;
  /** Tab label */
  label: string;
}

/** A single selectable weather product/parameter. */
export interface ModelProduct {
  /** Unique product identifier */
  id: string;
  /** Display label */
  label: string;
  /** Parent category */
  categoryId: ProductCategoryId;
  /** Unit string shown in tooltips and charts */
  unit?: string;
  /**
   * EC GeoMet WMS parameter ID — present when this product can be
   * rendered as a map overlay via the existing EC model WMS.
   */
  mapParam?: ModelMapParamId;
  /**
   * Open-Meteo hourly variable ID — present when this product can
   * be shown in the chart comparison view.
   */
  chartParam?: ModelParameter;
  /**
   * When true, the product requires a future WMS source and is
   * displayed as a disabled "coming soon" pill.
   */
  comingSoon?: boolean;
}

/** Product category tab definitions. */
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 'surface',   label: 'Surface'   },
  { id: 'precip',    label: 'Precip'    },
  { id: 'upper_air', label: 'Upper Air' },
  { id: 'moisture',  label: 'Moisture'  },
  { id: 'severe',    label: 'Severe'    },
  { id: 'winter',    label: 'Winter'    },
];

/** All available products, grouped by category. */
export const MODEL_PRODUCTS: ModelProduct[] = [
  // ---- Surface ----
  {
    id: 'sfct',      label: '2m Temperature', categoryId: 'surface',
    unit: '°C',      mapParam: 'temperature', chartParam: 'temperature_2m',
  },
  {
    id: 'sfcwind',   label: 'Wind Speed',      categoryId: 'surface',
    unit: 'km/h',    mapParam: 'wind',         chartParam: 'wind_speed_10m',
  },
  {
    id: 'mslp',      label: 'MSLP',            categoryId: 'surface',
    unit: 'hPa',     mapParam: 'pressure',     chartParam: 'surface_pressure',
  },
  {
    id: 'clouds',    label: 'Cloud Cover',     categoryId: 'surface',
    unit: '%',       mapParam: 'clouds',       chartParam: 'cloud_cover',
  },
  { id: 'refl', label: 'Sim. Reflectivity', categoryId: 'surface', unit: 'dBZ', comingSoon: true },

  // ---- Precipitation ----
  {
    id: 'precip',    label: 'Precipitation',   categoryId: 'precip',
    unit: 'mm',      mapParam: 'precipitation', chartParam: 'precipitation',
  },
  { id: 'qpf6',       label: 'QPF 6h',            categoryId: 'precip', unit: 'mm',  comingSoon: true },
  { id: 'snowacc',    label: 'Snow Accum.',        categoryId: 'precip', unit: 'cm',  comingSoon: true },
  { id: 'preciptype', label: 'Precip Type',        categoryId: 'precip',              comingSoon: true },
  { id: 'frzrain',    label: 'Freezing Rain',      categoryId: 'precip', unit: 'mm',  comingSoon: true },

  // ---- Upper Air ----
  {
    id: 'rh2m',      label: 'Rel. Humidity',   categoryId: 'upper_air',
    unit: '%',       mapParam: 'humidity',     chartParam: 'relative_humidity_2m',
  },
  { id: '500mb',   label: '500mb Heights',         categoryId: 'upper_air', comingSoon: true },
  { id: '700mb',   label: '700mb Temp + RH',        categoryId: 'upper_air', comingSoon: true },
  { id: '850mb',   label: '850mb Temp',             categoryId: 'upper_air', comingSoon: true },
  { id: '250mb',   label: '250mb Jet Stream',       categoryId: 'upper_air', comingSoon: true },

  // ---- Moisture ----
  { id: 'pwat',  label: 'Precipitable Water', categoryId: 'moisture', unit: 'mm', comingSoon: true },
  { id: 'kidx',  label: 'K-Index',            categoryId: 'moisture',             comingSoon: true },
  { id: 'li',    label: 'Lifted Index',       categoryId: 'moisture',             comingSoon: true },

  // ---- Severe ----
  { id: 'cape',  label: 'CAPE',               categoryId: 'severe', unit: 'J/kg', comingSoon: true },
  { id: 'cin',   label: 'CIN',                categoryId: 'severe', unit: 'J/kg', comingSoon: true },
  { id: 'shear', label: '0–6km Shear',        categoryId: 'severe', unit: 'kt',   comingSoon: true },
  { id: 'srh',   label: 'Storm-Rel. Helicity',categoryId: 'severe', unit: 'm²/s²',comingSoon: true },
  { id: 'stp',   label: 'Sig. Tornado Param', categoryId: 'severe',               comingSoon: true },

  // ---- Winter ----
  { id: 'snowqpf',  label: 'Snow QPF',       categoryId: 'winter', unit: 'cm',  comingSoon: true },
  { id: 'iceaccum', label: 'Ice Accum.',     categoryId: 'winter', unit: 'mm',  comingSoon: true },
  { id: 'snowdepth',label: 'Snow Depth',     categoryId: 'winter', unit: 'cm',  comingSoon: true },
  { id: 'slr',      label: 'Snow-Liquid Ratio', categoryId: 'winter',            comingSoon: true },
];

/** Default product to select on first load. */
export const DEFAULT_PRODUCT_ID = 'sfct';
export const DEFAULT_CATEGORY_ID: ProductCategoryId = 'surface';
