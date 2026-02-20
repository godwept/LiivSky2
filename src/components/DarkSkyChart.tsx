/**
 * DarkSkyChart — Interactive 3-day stargazing forecast chart.
 *
 * Renders the composite stargazing score as a filled area/line chart with
 * layered cloud/transparency/seeing sub-lines. Nighttime bands are
 * highlighted. Hover/touch on any column shows a tooltip with full details.
 *
 * Pure SVG — no charting library required.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import type { DarkSkyForecastItem } from '../types/darksky';
import './DarkSkyChart.css';

interface DarkSkyChartProps {
  items: DarkSkyForecastItem[];
}

// ---- Layout constants ----
const CHART_H  = 170;
const PAD_TOP  = 14;
const PAD_BOT  = 24;
const PAD_L    = 6;
const PAD_R    = 6;

/** Score colour thresholds — matches the rest of the app. */
function scoreColor(score: number): string {
  if (score >= 75) return '#66bb6a';
  if (score >= 50) return '#81c784';
  if (score >= 30) return '#ffa726';
  return '#ef5350';
}

function scoreVerdict(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Very Good';
  if (score >= 50) return 'Good';
  if (score >= 35) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Very Poor';
}

/** Build an SVG polyline "points" string from values 0–100. */
function polyline(
  xs: number[],
  values: number[],
  plotTop: number,
  plotH: number,
): string {
  return values
    .map((v, i) => {
      const y = plotTop + plotH - (v / 100) * plotH;
      return `${xs[i]},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** Build an SVG closed polygon (area fill) string. */
function areaPolygon(
  xs: number[],
  values: number[],
  plotTop: number,
  plotH: number,
  baseline: number,
): string {
  const top = values
    .map((v, i) => {
      const y = plotTop + plotH - (v / 100) * plotH;
      return `${xs[i]},${y.toFixed(1)}`;
    })
    .join(' ');
  const right = `${xs[xs.length - 1]},${baseline}`;
  const left  = `${xs[0]},${baseline}`;
  return `${top} ${right} ${left}`;
}

export default function DarkSkyChart({ items }: DarkSkyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [pointerFrac, setPointerFrac] = useState(0); // 0-1 fraction across container

  const n = items.length;
  // We need at least 2 points to draw
  if (n < 2) return null;

  const plotTop = PAD_TOP;
  const plotH   = CHART_H - PAD_TOP - PAD_BOT;
  const baseline = PAD_TOP + plotH;

  /** Per-item derived scores (0–100) for the sub-lines. */
  const derived = useMemo(() => items.map((item) => ({
    cloud:  Math.round(100 - item.cloudCoverPct),
    trans:  Math.round(((8 - item.transparencyValue) / 7) * 100),
    seeing: Math.round(((8 - item.seeingValue) / 7) * 100),
    score:  item.stargazingScore,
  })), [items]);

  /** Fixed viewBox width — SVG stretches to fill container via width:100%. */
  const chartW = 600;

  /** X positions for each data point (evenly spaced across the viewBox). */
  const xs = useMemo(() => {
    const usable = chartW - PAD_L - PAD_R;
    const step   = usable / (n - 1);
    return Array.from({ length: n }, (_, i) => PAD_L + i * step);
  }, [chartW, n]);

  // ---- Night bands (18:00–06:00) ----
  const nightBands = useMemo(() => {
    const bands: { x1: number; x2: number }[] = [];
    let start: number | null = null;
    const halfStep = (xs[1] - xs[0]) / 2;

    for (let i = 0; i < n; i++) {
      const hour = new Date(items[i].dateTime).getHours();
      const isNight = hour >= 18 || hour < 6;
      if (isNight && start === null) {
        start = Math.max(0, xs[i] - halfStep);
      }
      if ((!isNight || i === n - 1) && start !== null) {
        const end = isNight
          ? Math.min(chartW, xs[i] + halfStep)
          : xs[i] - halfStep;
        bands.push({ x1: start, x2: end });
        start = null;
      }
    }
    return bands;
  }, [xs, items, n, chartW]);

  // ---- Date separator positions ----
  const dateSeps = useMemo(() => {
    const seps: { x: number; label: string }[] = [];
    let prevDate = '';
    const halfStep = n > 1 ? (xs[1] - xs[0]) / 2 : 0;
    for (let i = 0; i < n; i++) {
      const dt = new Date(items[i].dateTime);
      const dateStr = dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      if (dateStr !== prevDate) {
        if (i > 0) seps.push({ x: xs[i] - halfStep, label: dateStr });
        prevDate = dateStr;
      }
    }
    return seps;
  }, [xs, items, n]);

  // ---- Time labels (every 2nd point to avoid crowding) ----
  const timeLabels = useMemo(() => {
    return items.map((item, i) => {
      const dt = new Date(item.dateTime);
      return {
        x: xs[i],
        label: dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
        show: i % 2 === 0,
      };
    });
  }, [xs, items]);

  // ---- Interaction handlers ----
  const resolve = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const idx  = Math.round(frac * (n - 1));
    setPointerFrac(frac);
    setActiveIdx(Math.max(0, Math.min(n - 1, idx)));
  }, [n]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => resolve(e.clientX), [resolve]);
  const handlePointerLeave = useCallback(() => setActiveIdx(null), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) resolve(t.clientX);
  }, [resolve]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) resolve(t.clientX);
  }, [resolve]);

  const handleTouchEnd = useCallback(() => {
    setTimeout(() => setActiveIdx(null), 2000);
  }, []);

  // Active item for tooltip
  const activeItem = activeIdx !== null ? items[activeIdx] : null;

  /** Tooltip position — follows the pointer X, dot Y. */
  const tipPos = useMemo(() => {
    if (activeIdx === null) return null;
    const el = containerRef.current;
    const containerW = el ? el.clientWidth : 320;
    const dotY = plotTop + plotH - (derived[activeIdx].score / 100) * plotH;
    const cursorX = pointerFrac * containerW;
    const clampedX = Math.max(40, Math.min(cursorX, containerW - 40));
    return { left: clampedX, top: dotY };
  }, [activeIdx, pointerFrac, derived, plotTop, plotH]);

  return (
    <div className="dsc-wrapper">
      {/* Compact tooltip — follows the active dot */}
      {activeItem && tipPos && (
        <div
          className="dsc-tooltip"
          style={{
            left: tipPos.left,
            top: tipPos.top,
            '--tip-color': scoreColor(activeItem.stargazingScore),
          } as React.CSSProperties}
        >
          <span className="dsc-tooltip__score" style={{ color: scoreColor(activeItem.stargazingScore) }}>
            {activeItem.stargazingScore}
          </span>
          <span className="dsc-tooltip__verdict">{scoreVerdict(activeItem.stargazingScore)}</span>
          <span className="dsc-tooltip__sep">·</span>
          <span className="dsc-tooltip__metric" style={{ color: '#5c8ee6' }}>☁ {activeItem.cloudCoverPct}%</span>
          <span className="dsc-tooltip__metric" style={{ color: '#c465f0' }}>✦ {activeItem.transparencyLabel.split('(')[0]?.trim()}</span>
          <span className="dsc-tooltip__metric" style={{ color: '#4dd0e1' }}>◉ {activeItem.seeingLabel.split('(')[0]?.trim()}</span>
          <span className="dsc-tooltip__time">
            {new Date(activeItem.dateTime).toLocaleString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
            })}
          </span>
        </div>
      )}

      {/* Chart area — all data visible, no scroll */}
      <div
        className="dsc-chart"
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg
          viewBox={`0 0 ${chartW} ${CHART_H}`}
          preserveAspectRatio="none"
          className="dsc-svg"
        >
          {/* Night bands */}
          {nightBands.map((b, i) => (
            <rect
              key={`night-${i}`}
              x={b.x1} y={plotTop}
              width={b.x2 - b.x1} height={plotH}
              fill="rgba(138,100,255,0.06)"
              rx="4"
            />
          ))}

          {/* Horizontal grid lines at 25/50/75 */}
          {[25, 50, 75].map((v) => {
            const y = plotTop + plotH - (v / 100) * plotH;
            return (
              <line key={`grid-${v}`}
                x1={PAD_L} y1={y} x2={chartW - PAD_R} y2={y}
                stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4"
              />
            );
          })}

          {/* Date separator lines */}
          {dateSeps.map((s, i) => (
            <line key={`sep-${i}`}
              x1={s.x} y1={plotTop} x2={s.x} y2={baseline}
              stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3"
            />
          ))}

          {/* Composite score filled area */}
          <polygon
            points={areaPolygon(xs, derived.map((d) => d.score), plotTop, plotH, baseline)}
            fill="url(#dsc-area-grad)"
          />

          {/* Area gradient */}
          <defs>
            <linearGradient id="dsc-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgba(138,100,255,0.30)" />
              <stop offset="100%" stopColor="rgba(138,100,255,0.02)" />
            </linearGradient>
          </defs>

          {/* Sub-metric lines */}
          <polyline
            points={polyline(xs, derived.map((d) => d.cloud), plotTop, plotH)}
            fill="none" stroke="#5c8ee6" strokeWidth="1.5" opacity="0.45"
            strokeLinejoin="round" strokeLinecap="round"
          />
          <polyline
            points={polyline(xs, derived.map((d) => d.trans), plotTop, plotH)}
            fill="none" stroke="#c465f0" strokeWidth="1.5" opacity="0.45"
            strokeLinejoin="round" strokeLinecap="round"
          />
          <polyline
            points={polyline(xs, derived.map((d) => d.seeing), plotTop, plotH)}
            fill="none" stroke="#4dd0e1" strokeWidth="1.5" opacity="0.45"
            strokeLinejoin="round" strokeLinecap="round"
          />

          {/* Main composite score line */}
          <polyline
            points={polyline(xs, derived.map((d) => d.score), plotTop, plotH)}
            fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round"
          />

          {/* Score dots at each data point */}
          {derived.map((d, i) => {
            const y = plotTop + plotH - (d.score / 100) * plotH;
            return (
              <circle
                key={`dot-${i}`}
                cx={xs[i]} cy={y} r={activeIdx === i ? 5 : 3}
                fill={scoreColor(d.score)}
                stroke={activeIdx === i ? '#fff' : 'none'}
                strokeWidth={activeIdx === i ? 1.5 : 0}
                opacity={activeIdx === i ? 1 : 0.75}
              />
            );
          })}

          {/* Active column highlight */}
          {activeIdx !== null && (
            <line
              x1={xs[activeIdx]} y1={plotTop}
              x2={xs[activeIdx]} y2={baseline}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {/* Time labels along bottom */}
          {timeLabels.map((t, i) => t.show && (
            <text
              key={`time-${i}`}
              x={t.x} y={CHART_H - 4}
              textAnchor="middle"
              fontSize="9"
              fontFamily="Inter, system-ui, sans-serif"
              fill="rgba(255,255,255,0.3)"
            >
              {t.label}
            </text>
          ))}
        </svg>
      </div>

      {/* Sub-line legend */}
      <div className="dsc-legend">
        <span className="dsc-legend__item">
          <span className="dsc-legend__line" style={{ background: 'rgba(255,255,255,0.85)' }} />
          Score
        </span>
        <span className="dsc-legend__item">
          <span className="dsc-legend__line" style={{ background: '#5c8ee6' }} />
          Cloud
        </span>
        <span className="dsc-legend__item">
          <span className="dsc-legend__line" style={{ background: '#c465f0' }} />
          Transp
        </span>
        <span className="dsc-legend__item">
          <span className="dsc-legend__line" style={{ background: '#4dd0e1' }} />
          Seeing
        </span>
        <span className="dsc-legend__item">
          <span className="dsc-legend__night" />
          Night
        </span>
      </div>
    </div>
  );
}
