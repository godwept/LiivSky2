/**
 * ModelMapViewer — Leaflet map with animated NWP model WMS overlays.
 *
 * Displays EC GeoMet model data (HRDPS, RDPS, GDPS) on a dark-themed
 * interactive map with play/pause/scrub controls to step through forecast hours.
 *
 * Similar architecture to the radar/satellite map but specialized for
 * model forecast visualization.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WeatherMap from './map/WeatherMap';
import { useModelMapAnimation } from '../hooks/useModelMapAnimation';
import { useWeatherStore } from '../store/weatherStore';
import {
  EC_GEOMET_WMS_URL,
  MODEL_MAP_DEFS,
  MODEL_MAP_PARAMS,
} from '../services/ecGeometLayers';
import type { ModelMapModelId, ModelMapParamId } from '../services/ecGeometLayers';
import type { WmsOverlayDef } from '../types/map';
import './ModelMapViewer.css';

const DEFAULT_MODEL: ModelMapModelId = 'hrdps';
const DEFAULT_PARAM: ModelMapParamId = 'temperature';

export default function ModelMapViewer() {
  const lat = useWeatherStore((s) => s.lat);
  const lon = useWeatherStore((s) => s.lon);

  const [selectedModel, setSelectedModel] = useState<ModelMapModelId>(DEFAULT_MODEL);
  const [selectedParam, setSelectedParam] = useState<ModelMapParamId>(DEFAULT_PARAM);

  /* ---- Resolve WMS layer name ---- */
  const modelDef = MODEL_MAP_DEFS.find((m) => m.id === selectedModel)!;
  const wmsLayerName = modelDef.layers[selectedParam];

  /* ---- Animation state ---- */
  const [animState, animControls] = useModelMapAnimation(wmsLayerName);

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
        id: `model-${selectedModel}-${selectedParam}`,
        url: EC_GEOMET_WMS_URL,
        layers: wmsLayerName,
        opacity: 0.7,
        format: 'image/png',
        transparent: true,
        time: animState.currentTime,
        allTimes: animState.allTimes,
      },
    ];
  }, [wmsLayerName, selectedModel, selectedParam, animState.currentTime, animState.allTimes]);

  const busy = animState.loading || (!cacheReady && animState.allTimes.length > 0);

  return (
    <div className="model-map-viewer">
      {/* Model selector pills */}
      <div className="model-map-controls">
        <div className="model-map-models">
          {MODEL_MAP_DEFS.map((m) => (
            <button
              key={m.id}
              className={`model-map-pill${selectedModel === m.id ? ' model-map-pill--active' : ''}`}
              style={selectedModel === m.id ? { borderColor: `${m.color}55`, color: m.color } : undefined}
              onClick={() => setSelectedModel(m.id)}
            >
              <span
                className="model-map-pill__dot"
                style={{ background: selectedModel === m.id ? m.color : 'rgba(255,255,255,0.15)' }}
              />
              {m.label}
            </button>
          ))}
        </div>

        {/* Parameter selector */}
        <div className="model-map-params">
          {MODEL_MAP_PARAMS.map((p) => (
            <button
              key={p.id}
              className={`model-map-param${selectedParam === p.id ? ' model-map-param--active' : ''}`}
              onClick={() => setSelectedParam(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div className="model-map-container">
        <WeatherMap
          lat={lat}
          lon={lon}
          zoom={5}
          overlays={overlays}
          onCacheStatus={handleCacheStatus}
        />

        {/* Info chip (model name + resolution) */}
        <div className="model-map-info" style={{ borderLeftColor: modelDef.color }}>
          <span className="model-map-info__name">{modelDef.label}</span>
          <span className="model-map-info__detail">
            {MODEL_MAP_PARAMS.find((p) => p.id === selectedParam)?.label} · {modelDef.resolution}
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
