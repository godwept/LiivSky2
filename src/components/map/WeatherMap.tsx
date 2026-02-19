/**
 * Core Leaflet map component for the weather map page.
 *
 * Renders a full-bleed dark-themed base map with optional WMS overlays
 * (radar, satellite) passed via props.  Supports pre-cached animation
 * frames for flicker-free playback.
 */
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './WeatherMap.css';
import type { WmsOverlayDef } from '../../types/map';

/** CartoDB Dark Matter — dark base tiles, free, no key */
const BASE_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const BASE_ATTRIBUTION =
  '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>';
const EC_ATTRIBUTION =
  '<a href="https://eccc-msc.github.io/open-data/">EC GeoMet</a>';
const IEM_ATTRIBUTION =
  '<a href="https://mesonet.agron.iastate.edu/">IEM</a> HRRR';

/**
 * Use 512 px tiles instead of default 256 px.
 * At a typical viewport this means ~4 tiles instead of ~16 per frame,
 * reducing total requests by ~4× and drastically speeding up cache time.
 */
const TILE_SIZE = 512;

export interface WeatherMapProps {
  lat: number;
  lon: number;
  zoom?: number;
  overlays?: WmsOverlayDef[];
  /** Reports per-overlay cache status during pre-loading */
  onCacheStatus?: (overlayId: string, loaded: number, total: number) => void;
}

/**
 * Inner helper: re-centers the map when coords change.
 */
function RecenterOnChange({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom(), { animate: true });
  }, [lat, lon, map]);
  return null;
}

/**
 * Pre-caches all animation frames as separate Leaflet WMS tile layers
 * and toggles opacity to switch between them — instant, flicker-free.
 *
 * While frames are loading, a "static" layer (without explicit TIME)
 * remains visible so the user always sees radar/satellite data.
 * Once all frame layers report 'load', the static layer is atomically
 * swapped out and frame-toggling begins.
 *
 * Supports two modes:
 *   • **Time mode** (EC radar/satellite) — each frame shares the same
 *     WMS layer name but uses a different TIME param.
 *   • **Forecast mode** (HRRR) — `overlay.forecastMode` is true.
 *     Each frame uses a *different WMS layer name* (entry from
 *     `allTimes`) and no TIME param at all.
 */
function WmsAnimatedLayer({
  overlay,
  onCacheStatus,
}: {
  overlay: WmsOverlayDef;
  onCacheStatus?: (overlayId: string, loaded: number, total: number) => void;
}) {
  const map = useMap();
  const frameLayersRef = useRef(new Map<string, L.TileLayer.WMS>());
  const staticLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const activeTimeRef = useRef('');
  const loadedTimesRef = useRef(new Set<string>());
  const currentTimeRef = useRef(overlay.time ?? '');
  const targetOpacityRef = useRef(overlay.opacity ?? 0.65);

  // Keep refs in sync with latest props
  currentTimeRef.current = overlay.time ?? '';
  targetOpacityRef.current = overlay.opacity ?? 0.65;

  const isForecast = overlay.forecastMode ?? false;
  const attrText = overlay.attribution ?? (isForecast ? IEM_ATTRIBUTION : EC_ATTRIBUTION);

  /* ---- 1. Static placeholder layer (visible until cache completes) ---- */
  useEffect(() => {
    // In forecast mode the static placeholder shows the first forecast layer
    const staticLayers = isForecast
      ? (overlay.allTimes?.[0] ?? overlay.layers)
      : overlay.layers;

    const layer = L.tileLayer.wms(overlay.url, {
      layers: staticLayers,
      format: (overlay.format ?? 'image/png') as string,
      transparent: overlay.transparent ?? true,
      opacity: overlay.opacity ?? 0.65,
      tileSize: TILE_SIZE,
      attribution: attrText,
    } as L.WMSOptions);
    layer.addTo(map);
    staticLayerRef.current = layer;

    return () => {
      map.removeLayer(layer);
      staticLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, overlay.url, overlay.layers, overlay.format, overlay.transparent, isForecast]);

  /* ---- 2. Pre-cache animation frames (staggered in batches) ---- */
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const allTimes = overlay.allTimes;
    if (!allTimes || allTimes.length === 0) return;

    // Tear down previous cache
    cancelledRef.current = true;
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    for (const l of frameLayersRef.current.values()) map.removeLayer(l);
    frameLayersRef.current.clear();
    loadedTimesRef.current.clear();
    activeTimeRef.current = '';
    cancelledRef.current = false;

    const total = allTimes.length;
    const BATCH_SIZE = 3;

    /** Create a single frame layer and wire its 'load' event */
    const addFrame = (key: string) => {
      // In forecast mode `key` is a WMS layer name; otherwise an ISO time string
      const wmsOpts: Record<string, unknown> = {
        layers: isForecast ? key : overlay.layers,
        format: (overlay.format ?? 'image/png') as string,
        transparent: overlay.transparent ?? true,
        opacity: 0,
        tileSize: TILE_SIZE,
        attribution: attrText,
      };
      if (!isForecast) {
        wmsOpts['time'] = key; // WMS TIME param
      }

      const layer = L.tileLayer.wms(overlay.url, wmsOpts as L.WMSOptions);

      layer.on('load', () => {
        loadedTimesRef.current.add(key);
        const loaded = loadedTimesRef.current.size;
        onCacheStatus?.(overlay.id, loaded, total);

        if (loaded >= total && staticLayerRef.current) {
          map.removeLayer(staticLayerRef.current);
          staticLayerRef.current = null;

          const now = currentTimeRef.current;
          if (now) {
            const curr = frameLayersRef.current.get(now);
            if (curr) curr.setOpacity(targetOpacityRef.current);
            activeTimeRef.current = now;
          }
        }
      });

      layer.addTo(map);
      frameLayersRef.current.set(key, layer);
    };

    let idx = 0;
    const scheduleBatch = () => {
      if (cancelledRef.current) return;
      const end = Math.min(idx + BATCH_SIZE, allTimes.length);
      for (; idx < end; idx++) addFrame(allTimes[idx]!);
      if (idx < allTimes.length) {
        batchTimerRef.current = setTimeout(scheduleBatch, 150);
      }
    };
    scheduleBatch();

    return () => {
      cancelledRef.current = true;
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
      for (const l of frameLayersRef.current.values()) map.removeLayer(l);
      frameLayersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, overlay.allTimes?.join(','), overlay.url, overlay.layers, isForecast]);

  /* ---- 3. Instant frame swap via opacity toggle ---- */
  useEffect(() => {
    if (!overlay.time || overlay.time === activeTimeRef.current) return;
    if (staticLayerRef.current) return;
    if (frameLayersRef.current.size === 0) return;

    // Hide previous frame
    const prev = frameLayersRef.current.get(activeTimeRef.current);
    if (prev) prev.setOpacity(0);

    // Show new frame
    const next = frameLayersRef.current.get(overlay.time);
    if (next) next.setOpacity(targetOpacityRef.current);

    activeTimeRef.current = overlay.time;
  }, [overlay.time, overlay.opacity]);

  return null; // All layers managed imperatively
}

export default function WeatherMap({
  lat,
  lon,
  zoom = 7,
  overlays = [],
  onCacheStatus,
}: WeatherMapProps) {
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={zoom}
      zoomControl={false}
      attributionControl={true}
      className="weather-map"
    >
      {/* Dark base layer */}
      <TileLayer url={BASE_TILE_URL} attribution={BASE_ATTRIBUTION} />

      {/* WMS overlays — each manages its own frame cache */}
      {overlays.map((o) => (
        <WmsAnimatedLayer
          key={o.id}
          overlay={o}
          onCacheStatus={onCacheStatus}
        />
      ))}

      <RecenterOnChange lat={lat} lon={lon} />
    </MapContainer>
  );
}
