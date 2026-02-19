/**
 * MapPage — full-bleed weather map with radar & satellite WMS overlays.
 *
 * Owns layer toggle state and composes WeatherMap + MapLayerControl.
 * Overlays are served directly by EC GeoMet WMS.
 * Supports pre-cached time-based animation for flicker-free playback.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WeatherMap from '../components/map/WeatherMap';
import MapLayerControl from '../components/map/MapLayerControl';
import AnimationBar from '../components/map/AnimationBar';
import {
  EC_GEOMET_WMS_URL,
  EC_LAYERS,
  EC_WMS_PARAMS,
  RADAR_PRODUCTS,
  RADAR_PRODUCT_MAP,
  SATELLITE_PRODUCTS,
  SATELLITE_PRODUCT_MAP,
  IEM_HRRR_WMS_URL,
} from '../services/ecGeometLayers';
import type { RadarProductId, SatelliteProductId } from '../services/ecGeometLayers';
import { useWmsAnimation, HRRR_TIMELINE_KEY } from '../hooks/useWmsAnimation';
import { useWeatherStore } from '../store/weatherStore';
import type { MapLayerDefinition, MapLayerId, WmsOverlayDef } from '../types/map';
import './MapPage.css';

/** Default layer definitions */
const DEFAULT_LAYERS: MapLayerDefinition[] = [
  { id: 'radar', label: 'Radar', active: true, available: true, color: '#00e5ff' },
  { id: 'satellite', label: 'Satellite', active: false, available: true, color: '#e040fb' },
  { id: 'lightning', label: 'Lightning', active: false, available: true, color: '#ffea00' },
  { id: 'hrrr', label: 'HRRR', active: false, available: true, color: '#ff6d00' },
];

export default function MapPage() {
  const lat = useWeatherStore((s) => s.lat);
  const lon = useWeatherStore((s) => s.lon);

  const [layers, setLayers] = useState<MapLayerDefinition[]>(DEFAULT_LAYERS);
  const [radarProduct, setRadarProduct] = useState<RadarProductId>('rain');
  const [satelliteProduct, setSatelliteProduct] = useState<SatelliteProductId>('visIR');

  /** Toggle a layer on/off */
  const handleToggle = useCallback((id: MapLayerId) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, active: !l.active } : l)),
    );
  }, []);

  /** Is the radar layer currently active? */
  const radarActive = layers.find((l) => l.id === 'radar')?.active ?? false;
  const satelliteActive = layers.find((l) => l.id === 'satellite')?.active ?? false;
  const lightningActive = layers.find((l) => l.id === 'lightning')?.active ?? false;
  const hrrrActive = layers.find((l) => l.id === 'hrrr')?.active ?? false;

  /**
   * Build list of active EC WMS layer names for the animation hook.
   * HRRR is handled separately via the hrrrActive flag.
   */
  const activeWmsLayerNames = useMemo<string[]>(() => {
    const names: string[] = [];
    if (radarActive) names.push(RADAR_PRODUCT_MAP[radarProduct]);
    if (satelliteActive) names.push(SATELLITE_PRODUCT_MAP[satelliteProduct]);
    if (lightningActive) names.push(EC_LAYERS.lightning);
    return names;
  }, [radarActive, satelliteActive, lightningActive, radarProduct, satelliteProduct]);

  /** Animation state & controls */
  const [animState, animControls] = useWmsAnimation(
    activeWmsLayerNames,
    hrrrActive,
  );

  /* ---- Cache tracking ---- */
  const [cacheReady, setCacheReady] = useState(false);
  const [cacheProgress, setCacheProgress] = useState(0);
  const cacheRef = useRef<Record<string, { loaded: number; total: number }>>({});

  /**
   * Stable key that changes only when the *set* of overlay IDs changes
   * (not on every animation frame tick).
   */
  const overlayIdKey = useMemo(
    () =>
      layers
        .filter((l) => l.active && l.available)
        .map((l) => l.id)
        .join(','),
    [layers],
  );

  /**
   * When overlays are added or removed, prune stale cache entries and
   * re-derive readiness from the survivors.  This avoids the old bug
   * where a blanket reset wiped still-valid satellite cache data when
   * only radar was toggled off — leaving the UI stuck at 0 %.
   */
  useEffect(() => {
    const currentIds = new Set(overlayIdKey.split(',').filter(Boolean));

    // Remove entries for overlays that no longer exist
    for (const key of Object.keys(cacheRef.current)) {
      if (!currentIds.has(key)) {
        delete cacheRef.current[key];
      }
    }

    // Re-derive from surviving entries
    const all = Object.values(cacheRef.current);
    const totalAll = all.reduce((s, x) => s + x.total, 0);
    const loadedAll = all.reduce((s, x) => s + x.loaded, 0);
    setCacheProgress(totalAll > 0 ? loadedAll / totalAll : 0);
    setCacheReady(loadedAll >= totalAll && totalAll > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayIdKey]);

  const handleCacheStatus = useCallback(
    (overlayId: string, loaded: number, total: number) => {
      cacheRef.current[overlayId] = { loaded, total };
      const all = Object.values(cacheRef.current);
      const totalAll = all.reduce((s, x) => s + x.total, 0);
      const loadedAll = all.reduce((s, x) => s + x.loaded, 0);
      setCacheProgress(totalAll > 0 ? loadedAll / totalAll : 0);
      setCacheReady(loadedAll >= totalAll && totalAll > 0);
    },
    [],
  );

  /** Build WMS overlay array from active layers, injecting time + allTimes */
  const overlays = useMemo<WmsOverlayDef[]>(() => {
    return layers
      .filter((l) => l.active && l.available)
      .map((l): WmsOverlayDef | null => {
        if (l.id === 'radar') {
          const wmsLayer = RADAR_PRODUCT_MAP[radarProduct];
          return {
            id: `radar-${radarProduct}`,
            url: EC_GEOMET_WMS_URL,
            layers: wmsLayer,
            opacity: 0.6,
            format: EC_WMS_PARAMS.format,
            transparent: EC_WMS_PARAMS.transparent,
            time: animState.layerTimes[wmsLayer],
            allTimes: animState.layerAllTimes[wmsLayer],
          };
        }
        if (l.id === 'satellite') {
          const wmsLayer = SATELLITE_PRODUCT_MAP[satelliteProduct];
          return {
            id: `satellite-${satelliteProduct}`,
            url: EC_GEOMET_WMS_URL,
            layers: wmsLayer,
            opacity: 0.5,
            format: EC_WMS_PARAMS.format,
            transparent: EC_WMS_PARAMS.transparent,
            time: animState.layerTimes[wmsLayer],
            allTimes: animState.layerAllTimes[wmsLayer],
          };
        }
        if (l.id === 'lightning') {
          const wmsLayer = EC_LAYERS.lightning;
          return {
            id: l.id,
            url: EC_GEOMET_WMS_URL,
            layers: wmsLayer,
            opacity: 0.8,
            format: EC_WMS_PARAMS.format,
            transparent: EC_WMS_PARAMS.transparent,
            time: animState.layerTimes[wmsLayer],
            allTimes: animState.layerAllTimes[wmsLayer],
          };
        }
        if (l.id === 'hrrr') {
          // HRRR forecast mode: allTimes = layer names, time = current layer.
          // `layers` must stay STABLE — per-frame names live in allTimes/time.
          // Changing `layers` would tear down the pre-cache on every frame.
          const currentLayer = animState.layerTimes[HRRR_TIMELINE_KEY] ?? 'refd_0000';
          return {
            id: 'hrrr',
            url: IEM_HRRR_WMS_URL,
            layers: 'refd_0000',
            opacity: 0.6,
            format: 'image/png',
            transparent: true,
            time: currentLayer,
            allTimes: animState.layerAllTimes[HRRR_TIMELINE_KEY],
            forecastMode: true,
            attribution: '<a href="https://mesonet.agron.iastate.edu/">IEM</a> HRRR',
          };
        }
        return null;
      })
      .filter((o): o is WmsOverlayDef => o !== null);
  }, [layers, radarProduct, satelliteProduct, animState.layerTimes, animState.layerAllTimes]);

  return (
    <div className="map-page">
      <WeatherMap
        lat={lat}
        lon={lon}
        overlays={overlays}
        onCacheStatus={handleCacheStatus}
      />
      <MapLayerControl
        layers={layers}
        onToggle={handleToggle}
        radarActive={radarActive}
        radarProducts={RADAR_PRODUCTS}
        selectedRadarProduct={radarProduct}
        onRadarProductChange={setRadarProduct}
        satelliteActive={satelliteActive}
        satelliteProducts={SATELLITE_PRODUCTS}
        selectedSatelliteProduct={satelliteProduct}
        onSatelliteProductChange={setSatelliteProduct}
      />
      {(activeWmsLayerNames.length > 0 || hrrrActive) && (
        <AnimationBar
          state={animState}
          controls={animControls}
          cacheReady={cacheReady}
          cacheProgress={cacheProgress}
        />
      )}
    </div>
  );
}
