/**
 * ModelsPage — Forecast model comparison view.
 *
 * Two sub-views accessible via a Charts / Maps toggle:
 *   - Charts: side-by-side line chart comparison from Open-Meteo
 *   - Maps:   animated WMS model overlays from EC GeoMet
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWeatherStore } from '../store/weatherStore';
import {
  MODEL_CATALOG,
  PARAMETER_CATALOG,
  fetchModelComparison,
} from '../services/modelClient';
import ModelMapViewer from '../components/ModelMapViewer';
import type { ModelId, ModelParameter, ModelComparisonData } from '../types/models';
import './ModelsPage.css';

/** Sub-view mode */
type ViewMode = 'charts' | 'maps';

/** Models enabled by default on first load */
const DEFAULT_MODELS: ModelId[] = ['gfs', 'ecmwf'];
const DEFAULT_PARAM: ModelParameter = 'temperature_2m';

/** Chart dimensions */
const CHART_W = 560;
const CHART_H = 200;
const PAD = { top: 20, right: 12, bottom: 28, left: 38 };

export default function ModelsPage() {
  const lat = useWeatherStore((s) => s.lat);
  const lon = useWeatherStore((s) => s.lon);
  const location = useWeatherStore((s) => s.location);

  const [viewMode, setViewMode] = useState<ViewMode>('charts');
  const [activeModels, setActiveModels] = useState<ModelId[]>(DEFAULT_MODELS);
  const [parameter, setParameter] = useState<ModelParameter>(DEFAULT_PARAM);
  const [data, setData] = useState<ModelComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Toggle a model on/off */
  const toggleModel = useCallback((id: ModelId) => {
    setActiveModels((prev) =>
      prev.includes(id)
        ? prev.filter((m) => m !== id)
        : [...prev, id],
    );
  }, []);

  /** Fetch model data whenever selection changes */
  useEffect(() => {
    if (activeModels.length === 0) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchModelComparison(activeModels, parameter, lat, lon)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch model data');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [activeModels, parameter, lat, lon]);

  const paramInfo = PARAMETER_CATALOG.find((p) => p.id === parameter)!;

  return (
    <div className="models-page">
      {/* Header */}
      <div className="models-header">
        <h1>Forecast Models</h1>
        <p>{location} — {lat.toFixed(2)}°N, {Math.abs(lon).toFixed(2)}°W</p>
      </div>

      {/* Charts / Maps toggle */}
      <div className="models-view-toggle">
        <button
          className={`view-toggle-btn${viewMode === 'charts' ? ' view-toggle-btn--active' : ''}`}
          onClick={() => setViewMode('charts')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity={viewMode === 'charts' ? 1 : 0.5}>
            <path d="M3.5 18.5l6-6 4 4L22 6.92 20.59 5.5l-7.09 8-4-4L2 17l1.5 1.5z" />
          </svg>
          Charts
        </button>
        <button
          className={`view-toggle-btn${viewMode === 'maps' ? ' view-toggle-btn--active' : ''}`}
          onClick={() => setViewMode('maps')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity={viewMode === 'maps' ? 1 : 0.5}>
            <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
          </svg>
          Maps
        </button>
      </div>

      {/* ---- Charts sub-view ---- */}
      {viewMode === 'charts' && (
        <>
      {/* Parameter selector */}
      <div className="models-param-bar" role="tablist" aria-label="Forecast parameter">
        {PARAMETER_CATALOG.map((p) => (
          <button
            key={p.id}
            className={`param-chip${parameter === p.id ? ' param-chip--active' : ''}`}
            role="tab"
            aria-selected={parameter === p.id}
            onClick={() => setParameter(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Model toggle pills */}
      <div className="models-toggle-bar">
        {MODEL_CATALOG.map((m) => {
          const active = activeModels.includes(m.id);
          return (
            <button
              key={m.id}
              className={`model-pill${active ? ' model-pill--active' : ''}`}
              style={active ? { borderColor: `${m.color}55` } : undefined}
              onClick={() => toggleModel(m.id)}
              aria-pressed={active}
            >
              <span
                className="model-pill__dot"
                style={{ background: active ? m.color : 'rgba(255,255,255,0.15)' }}
              />
              <span className="model-pill__name">{m.label}</span>
              <span className="model-pill__res">{m.resolution}</span>
            </button>
          );
        })}
      </div>

      {/* Chart area */}
      {loading && (
        <div className="models-loading">
          <div className="models-spinner" />
          Fetching model data…
        </div>
      )}

      {error && <div className="models-error">{error}</div>}

      {!loading && !error && data && data.forecasts.length > 0 && (
        <ModelChart
          data={data}
          paramInfo={paramInfo}
        />
      )}

      {!loading && !error && activeModels.length === 0 && (
        <div className="models-loading">
          Select at least one model to view forecasts.
        </div>
      )}

      {/* Model detail cards */}
      {!loading && data && data.forecasts.length > 0 && (
        <div className="model-details">
          {data.forecasts.map((fc) => {
            const info = MODEL_CATALOG.find((m) => m.id === fc.modelId)!;
            const values = fc.data.map((d) => d.value);
            const avg = values.length > 0
              ? (values.reduce((a, b) => a + b, 0) / values.length)
              : 0;
            return (
              <div key={fc.modelId} className="model-detail-card">
                <div
                  className="model-detail-card__color"
                  style={{ background: info.color }}
                />
                <div className="model-detail-card__info">
                  <div className="model-detail-card__name">{info.label}</div>
                  <div className="model-detail-card__meta">
                    {info.description} · {info.resolution}
                  </div>
                </div>
                <div className="model-detail-card__stat">
                  <div className="model-detail-card__stat-value">
                    {avg.toFixed(1)}{paramInfo.unit}
                  </div>
                  <div className="model-detail-card__stat-label">avg</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* ---- Maps sub-view ---- */}
      {viewMode === 'maps' && <ModelMapViewer />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline SVG line chart for model comparison                        */
/* ------------------------------------------------------------------ */

interface ModelChartProps {
  data: ModelComparisonData;
  paramInfo: { label: string; unit: string };
}

function ModelChart({ data, paramInfo }: ModelChartProps) {
  /** Compute chart scales and paths */
  const { paths, yTicks, xLabels } = useMemo(() => {
    // Find global min/max across all forecasts
    let globalMin = Infinity;
    let globalMax = -Infinity;

    for (const fc of data.forecasts) {
      for (const d of fc.data) {
        if (d.value < globalMin) globalMin = d.value;
        if (d.value > globalMax) globalMax = d.value;
      }
    }

    // Add 10% padding
    const range = globalMax - globalMin || 1;
    const yMin = globalMin - range * 0.1;
    const yMax = globalMax + range * 0.1;

    const plotW = CHART_W - PAD.left - PAD.right;
    const plotH = CHART_H - PAD.top - PAD.bottom;

    // Build SVG paths for each forecast
    const paths = data.forecasts.map((fc) => {
      const info = MODEL_CATALOG.find((m) => m.id === fc.modelId)!;
      const len = fc.data.length;
      if (len === 0) return { modelId: fc.modelId, d: '', color: info.color };

      const points = fc.data.map((pt, i) => {
        const x = PAD.left + (i / (len - 1)) * plotW;
        const y = PAD.top + plotH - ((pt.value - yMin) / (yMax - yMin)) * plotH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });

      return {
        modelId: fc.modelId,
        d: `M${points.join('L')}`,
        color: info.color,
      };
    });

    // Y-axis ticks (5 ticks)
    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const val = yMin + ((yMax - yMin) * i) / 4;
      const y = PAD.top + plotH - ((val - yMin) / (yMax - yMin)) * plotH;
      return { val: val.toFixed(1), y };
    });

    // X-axis labels — sample every ~24 hours
    const maxForecast = data.forecasts.reduce<(typeof data.forecasts)[number] | undefined>(
      (best, fc) => (!best || fc.data.length > best.data.length ? fc : best),
      undefined,
    );
    if (!maxForecast || maxForecast.data.length === 0) {
      return { paths, yTicks, xLabels: [] };
    }
    const total = maxForecast.data.length;
    const step = Math.max(1, Math.floor(total / 5));
    const xLabels = [];
    for (let i = 0; i < total; i += step) {
      const t = maxForecast.data[i]!.time;
      const d = new Date(t);
      const label = d.toLocaleDateString(undefined, { weekday: 'short', hour: 'numeric' });
      const x = PAD.left + (i / (total - 1)) * plotW;
      xLabels.push({ label, x });
    }

    return { paths, yTicks, xLabels, yMin, yMax };
  }, [data]);

  return (
    <div className="models-chart-card">
      <div className="models-chart-card__title">
        {paramInfo.label} ({paramInfo.unit}) — 5-day forecast
      </div>
      <div className="models-chart">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          preserveAspectRatio="xMidYMid meet"
          width="100%"
          height={CHART_H}
        >
          {/* Grid lines */}
          {yTicks.map((t, i) => (
            <line
              key={i}
              className="chart-grid-line"
              x1={PAD.left}
              y1={t.y}
              x2={CHART_W - PAD.right}
              y2={t.y}
            />
          ))}

          {/* Y-axis labels */}
          {yTicks.map((t, i) => (
            <text
              key={i}
              className="chart-value-label"
              x={PAD.left - 4}
              y={t.y + 3}
              textAnchor="end"
            >
              {t.val}
            </text>
          ))}

          {/* X-axis labels */}
          {xLabels.map((l, i) => (
            <text
              key={i}
              className="chart-time-label"
              x={l.x}
              y={CHART_H - 4}
              textAnchor="middle"
            >
              {l.label}
            </text>
          ))}

          {/* Data lines */}
          {paths.map((p) => (
            <path
              key={p.modelId}
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="models-legend">
        {paths.map((p) => {
          const info = MODEL_CATALOG.find((m) => m.id === p.modelId)!;
          return (
            <div key={p.modelId} className="models-legend__item">
              <span
                className="models-legend__swatch"
                style={{ background: p.color }}
              />
              {info.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
