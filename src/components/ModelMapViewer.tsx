/**
 * ModelMapViewer — Leaflet map with animated NWP model WMS overlays.
 *
 * Fully controlled component: model, param, map center, and zoom are all
 * passed in from the parent (ModelsPage). Internal state is limited to
 * animation playback and tile-caching progress.
 *
 * The parent receives the current forecast time label via `onTimeChange`
 * so it can update the ModelHero without needing to share hook state.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WeatherMap from './map/WeatherMap';
import { useModelMapAnimation } from '../hooks/useModelMapAnimation';
import {
  MODEL_MAP_DEFS,
  MODEL_MAP_PARAMS,
} from '../services/ecGeometLayers';
import type { ModelMapModelId, ModelMapParamId } from '../services/ecGeometLayers';
import type { WmsOverlayDef } from '../types/map';
import './ModelMapViewer.css';

export interface ModelMapViewerProps {
  /** Currently active EC model identifier */
  model: ModelMapModelId;
  /** Currently active product/parameter identifier */
  param: ModelMapParamId;
  /** [lat, lon] to centre the map on (e.g. from a region preset) */
  mapCenter: [number, number];
  /** Leaflet zoom level */
  mapZoom: number;
  /** Called whenever the displayed forecast time label changes */
  onTimeChange?: (label: string) => void;
}

export default function ModelMapViewer({
  model,
  param,
  mapCenter,
  mapZoom,
  onTimeChange,
}: ModelMapViewerProps) {
  /* ---- Resolve WMS layer name ---- */
  const modelDef = MODEL_MAP_DEFS.find((m) => m.id === model)!;
  const wmsLayerName = modelDef.layers[param];

  /* ---- Animation state ---- */
  const [animState, animControls] = useModelMapAnimation(wmsLayerName, modelDef.wmsUrl);

  /* ---- Notify parent of time label changes ---- */
  useEffect(() => {
    if (onTimeChange) onTimeChange(animState.timeLabel);
  }, [animState.timeLabel, onTimeChange]);

  /* ---- Cache tracking ---- */
  const [cacheReady, setCacheReady] = useState(false);
  const [cacheProgress, setCacheProgress] = useState(0);
  const cacheRef = useRef<Record<string, { loaded: number; total: number }>>({});

  const handleCacheStatus = useCallback(
    (overlayId: string, loaded: number, total: number) => {
      cacheRef.current[overlayId] = { loaded, total };
      const entries = Object.values(cacheRef.current);
      const totalAll = entries.reduce((s, e) => s + e.total, 0);
      const loadedAll = entries.reduce((s, e) => s + e.loaded, 0);
      const progress = totalAll > 0 ? loadedAll / totalAll : 0;
      setCacheProgress(progress);
      setCacheReady(progress >= 1);
    },
    [],
  );

  /** Reset cache state when layer changes */
  useEffect(() => {
    cacheRef.current = {};
    setCacheReady(false);
    setCacheProgress(0);
  }, [wmsLayerName]);

  /* ---- Build overlay for WeatherMap ---- */
  const overlays = useMemo<WmsOverlayDef[]>(() => {
    if (!wmsLayerName || animState.allTimes.length === 0) return [];
    return [
      {
        id: `model-${model}-${param}`,
        url: EC_GEOMET_WMS_URL,
        layers: wmsLayerName,
        opacity: 0.7,
        format: 'image/png',
        transparent: true,
        time: animState.currentTime,
        allTimes: animState.allTimes,
        extraParams: modelDef.extraParams?.[param],
        attribution: modelDef.provider === 'Environment Canada'
          ? '<a href="https://eccc-msc.github.io/open-data/">EC GeoMet</a>'
          : `${modelDef.provider} · <a href="https://thredds.ucar.edu/">UCAR THREDDS</a>`,
      },
    ];
  }, [wmsLayerName, model, param, modelDef, animState.currentTime, animState.allTimes]);

  const busy = animState.loading || (!cacheReady && animState.allTimes.length > 0);

  return (
    <div className="model-map-viewer">
      {/* Map container */}
      <div className="model-map-container">
        <WeatherMap
          lat={mapCenter[0]}
          lon={mapCenter[1]}
          zoom={mapZoom}
          overlays={overlays}
          onCacheStatus={handleCacheStatus}
        />

        {/* Info chip (model name + resolution) */}
        <div className="model-map-info" style={{ borderLeftColor: modelDef.color }}>
          <span className="model-map-info__name">{modelDef.label}</span>
          <span className="model-map-info__detail">
            {MODEL_MAP_PARAMS.find((p) => p.id === param)?.label} · {modelDef.resolution}
          </span>
        </div>

        {/* Animation bar */}
        <div className="model-map-anim-bar">
          {/* Cache progress */}
          {busy && !animState.loading && (
            <div className="model-anim-cache">
              <div
                className="model-anim-cache__fill"
                style={{ width: `${Math.round(cacheProgress * 100)}%` }}
              />
            </div>
          )}

          {/* Step backward */}
          <button
            className="model-anim-btn"
            onClick={animControls.stepBackward}
            disabled={busy || animState.totalFrames === 0}
            aria-label="Previous frame"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            className="model-anim-btn model-anim-btn--play"
            onClick={animControls.toggle}
            disabled={busy || animState.totalFrames === 0}
            aria-label={animState.playing ? 'Pause' : 'Play'}
          >
            {busy ? (
              <span className="model-anim-spinner" />
            ) : animState.playing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Step forward */}
          <button
            className="model-anim-btn"
            onClick={animControls.stepForward}
            disabled={busy || animState.totalFrames === 0}
            aria-label="Next frame"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          {/* Scrubber */}
          <div className="model-anim-scrubber">
            <input
              type="range"
              className="model-anim-range"
              min={0}
              max={Math.max(animState.totalFrames - 1, 0)}
              value={animState.frameIndex}
              onChange={(e) => animControls.seek(Number(e.target.value))}
              disabled={busy || animState.totalFrames === 0}
            />
            <div
              className="model-anim-range__fill"
              style={{
                width: animState.totalFrames > 1
                  ? `${(animState.frameIndex / (animState.totalFrames - 1)) * 100}%`
                  : '0%',
              }}
            />
          </div>

          {/* Time label */}
          <span className="model-anim-time">
            {animState.loading
              ? '…'
              : !cacheReady && animState.allTimes.length > 0
                ? `${Math.round(cacheProgress * 100)}%`
                : animState.timeLabel || '—'}
          </span>
        </div>

        {/* Error overlay */}
        {animState.error && (
          <div className="model-map-error">{animState.error}</div>
        )}

        {/* Loading overlay */}
        {animState.loading && (
          <div className="model-map-loading">
            <div className="models-spinner" />
            Loading model times…
          </div>
        )}
      </div>
    </div>
  );
}
