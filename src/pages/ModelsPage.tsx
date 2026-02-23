/**
 * ModelsPage — Map-first NWP model viewer.
 *
 * Layout (top → bottom):
 *   ModelHero  → map model pills → region pills → product category tabs
 *   → product chips → ModelMapViewer (controlled)
 *   → <details> collapsible chart comparison section
 *
 * State is owned here and passed down; ModelMapViewer is a pure
 * controlled component that renders the map + animation bar.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWeatherStore } from '../store/weatherStore';
import {
  MODEL_CATALOG,
  PARAMETER_CATALOG,
  fetchModelComparison,
} from '../services/modelClient';
import ModelMapViewer from '../components/ModelMapViewer';
import ModelHero from '../components/ModelHero';
import {
  MODEL_REGIONS,
  DEFAULT_REGION_ID,
} from '../services/modelRegions';
import {
  MODEL_PRODUCTS,
  PRODUCT_CATEGORIES,
  DEFAULT_PRODUCT_ID,
  DEFAULT_CATEGORY_ID,
} from '../services/modelProducts';
import { MODEL_MAP_DEFS } from '../services/ecGeometLayers';
import type { ModelMapModelId, ModelMapParamId } from '../services/ecGeometLayers';
import type { ModelId, ModelParameter, ModelComparisonData } from '../types/models';
import './ModelsPage.css';

/** Models enabled by default in the chart comparison view */
const DEFAULT_CHART_MODELS: ModelId[] = ['gfs', 'ecmwf'];
const DEFAULT_CHART_PARAM: ModelParameter = 'temperature_2m';
const DEFAULT_MAP_MODEL: ModelMapModelId = 'hrdps';

/** Chart dimensions */
const CHART_W = 560;
const CHART_H = 200;
const PAD = { top: 20, right: 12, bottom: 28, left: 38 };

export default function ModelsPage() {
  const lat = useWeatherStore((s) => s.lat);
  const lon = useWeatherStore((s) => s.lon);
  const location = useWeatherStore((s) => s.location);

  /* ---- Map state ---- */
  const [selectedMapModel, setSelectedMapModel] = useState<ModelMapModelId>(DEFAULT_MAP_MODEL);
  const initialRegion = MODEL_REGIONS.find((r) => r.id === DEFAULT_REGION_ID)!;
  const [selectedRegionId, setSelectedRegionId] = useState<string>(DEFAULT_REGION_ID);
  const [selectedCategoryId, setSelectedCategoryId] = useState(DEFAULT_CATEGORY_ID);
  const [selectedProductId, setSelectedProductId] = useState(DEFAULT_PRODUCT_ID);
  const [heroForecastTime, setHeroForecastTime] = useState('—');

  /* ---- Chart state ---- */
  const [activeModels, setActiveModels] = useState<ModelId[]>(DEFAULT_CHART_MODELS);
  const [parameter, setParameter] = useState<ModelParameter>(DEFAULT_CHART_PARAM);
  const [data, setData] = useState<ModelComparisonData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  /* ---- Derived values ---- */
  const selectedRegion = MODEL_REGIONS.find((r) => r.id === selectedRegionId) ?? initialRegion;
  const mapCenter: [number, number] = selectedRegion.id === 'local'
    ? [lat, lon]
    : selectedRegion.center;
  const mapZoom = selectedRegion.zoom;

  const selectedProduct = MODEL_PRODUCTS.find((p) => p.id === selectedProductId)
    ?? MODEL_PRODUCTS.find((p) => p.id === DEFAULT_PRODUCT_ID)!;
  const mapParam: ModelMapParamId = selectedProduct.mapParam ?? 'temperature';

  const categoryProducts = MODEL_PRODUCTS.filter(
    (p) => p.categoryId === selectedCategoryId,
  );

  const mapModelDef = MODEL_MAP_DEFS.find((m) => m.id === selectedMapModel)!;

  /* ---- Toggle a chart model on/off ---- */
  const toggleChartModel = useCallback((id: ModelId) => {
    setActiveModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }, []);

  /* ---- Select a product: keep chart param in sync ---- */
  const selectProduct = useCallback((productId: string) => {
    setSelectedProductId(productId);
    const prod = MODEL_PRODUCTS.find((p) => p.id === productId);
    if (prod?.chartParam) setParameter(prod.chartParam);
  }, []);

  /* ---- Fetch chart data ---- */
  useEffect(() => {
    if (activeModels.length === 0) { setData(null); return; }
    let cancelled = false;
    setChartLoading(true);
    setChartError(null);
    fetchModelComparison(activeModels, parameter, lat, lon)
      .then((result) => { if (!cancelled) { setData(result); setChartLoading(false); } })
      .catch((err) => {
        if (!cancelled) {
          setChartError(err instanceof Error ? err.message : 'Failed to fetch model data');
          setChartLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [activeModels, parameter, lat, lon]);

  const paramInfo = PARAMETER_CATALOG.find((p) => p.id === parameter)!;

  return (
    <div className="models-page">

      {/* ---- Hero ---- */}
      <ModelHero
        modelLabel={mapModelDef.label}
        modelColor={mapModelDef.color}
        modelResolution={mapModelDef.resolution}
        modelProvider={mapModelDef.provider}
        categoryLabel={PRODUCT_CATEGORIES.find((c) => c.id === selectedCategoryId)?.label ?? ''}
        productLabel={selectedProduct.label}
        regionLabel={selectedRegion.label}
        forecastTime={heroForecastTime}
        location={location}
      />

      {/* ---- Map model pills (all models from MODEL_MAP_DEFS) ---- */}
      <div className="models-map-model-bar">
        {MODEL_MAP_DEFS.map((m) => (
          <button
            key={m.id}
            className={`map-model-pill${selectedMapModel === m.id ? ' map-model-pill--active' : ''}`}
            style={selectedMapModel === m.id
              ? { borderColor: `${m.color}55`, color: m.color }
              : undefined}
            onClick={() => setSelectedMapModel(m.id)}
          >
            <span
              className="map-model-pill__dot"
              style={{ background: selectedMapModel === m.id ? m.color : 'rgba(255,255,255,0.18)' }}
            />
            <span className="map-model-pill__name">{m.label}</span>
            <span className="map-model-pill__res">{m.resolution}</span>
          </button>
        ))}
      </div>

      {/* ---- Region pills ---- */}
      <div className="models-region-bar" role="tablist" aria-label="Map region">
        {MODEL_REGIONS.map((r) => (
          <button
            key={r.id}
            className={`region-pill${selectedRegionId === r.id ? ' region-pill--active' : ''}`}
            role="tab"
            aria-selected={selectedRegionId === r.id}
            onClick={() => setSelectedRegionId(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* ---- Product category tabs ---- */}
      <div className="models-category-bar" role="tablist" aria-label="Product category">
        {PRODUCT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`category-tab${selectedCategoryId === c.id ? ' category-tab--active' : ''}`}
            role="tab"
            aria-selected={selectedCategoryId === c.id}
            onClick={() => setSelectedCategoryId(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ---- Product chips ---- */}
      <div className="models-product-bar">
        {categoryProducts.map((p) => (
          <button
            key={p.id}
            className={`product-chip${selectedProductId === p.id ? ' product-chip--active' : ''}${p.comingSoon ? ' product-chip--soon' : ''}`}
            disabled={p.comingSoon}
            onClick={() => !p.comingSoon && selectProduct(p.id)}
          >
            {p.label}
            {p.comingSoon && <span className="product-chip__badge">Soon</span>}
          </button>
        ))}
      </div>

      {/* ---- Map viewer ---- */}
      <ModelMapViewer
        model={selectedMapModel}
        param={mapParam}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        onTimeChange={setHeroForecastTime}
      />

      {/* ---- Collapsible chart comparison ---- */}
      <details className="models-chart-section">
        <summary className="models-chart-summary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3.5 18.5l6-6 4 4L22 6.92 20.59 5.5l-7.09 8-4-4L2 17l1.5 1.5z" />
          </svg>
          Model Chart Comparison
          <span className="models-chart-summary__caret" aria-hidden="true" />
        </summary>

        <div className="models-chart-body">
          {/* Parameter selector */}
          <div className="models-param-bar" role="tablist" aria-label="Chart parameter">
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
                  onClick={() => toggleChartModel(m.id)}
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

          {chartLoading && (
            <div className="models-loading">
              <div className="models-spinner" />
              Fetching model data…
            </div>
          )}

          {chartError && <div className="models-error">{chartError}</div>}

          {!chartLoading && !chartError && data && data.forecasts.length > 0 && (
            <ModelChart data={data} paramInfo={paramInfo} />
          )}

          {!chartLoading && !chartError && activeModels.length === 0 && (
            <div className="models-loading">Select at least one model.</div>
          )}

          {!chartLoading && data && data.forecasts.length > 0 && (
            <div className="model-details">
              {data.forecasts.map((fc) => {
                const info = MODEL_CATALOG.find((m) => m.id === fc.modelId)!;
                const values = fc.data.map((d) => d.value);
                const avg = values.length > 0
                  ? values.reduce((a, b) => a + b, 0) / values.length
                  : 0;
                return (
                  <div key={fc.modelId} className="model-detail-card">
                    <div className="model-detail-card__color" style={{ background: info.color }} />
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
        </div>
      </details>
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
