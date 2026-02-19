/**
 * ConditionsCard — Glassmorphic card showing current conditions at a glance.
 *
 * Displays weather condition, sunrise/sunset, wind, moon phase,
 * plus sparkline charts for hourly temperature and precipitation.
 */
import type { ConditionsCardData } from '../types';
import { getMetricIconPresentation, getMoonPhaseIconPresentation, getWeatherIconPresentation } from './weatherIconMap';
import './ConditionsCard.css';

interface SparklinePoint {
  label: string;
  value: number;
}

interface ConditionsCardProps {
  data: ConditionsCardData;
  /** Hourly temperatures for sparkline */
  tempCurve: SparklinePoint[];
  /** Hourly precipitation probabilities for sparkline */
  precipCurve: SparklinePoint[];
}

/** Inline SVG condition icon */
function ConditionIcon({ icon }: { icon: string }) {
  const { className, color } = getWeatherIconPresentation(icon);
  return (
    <span className="cc-condition-icon" style={{ color }}>
      <i className={`wi ${className}`} aria-hidden />
    </span>
  );
}

/** Tiny inline icon for metric items */
function MiniIcon({ type, color }: { type: string; color: string }) {
  const { className } = getMetricIconPresentation(type, color);
  return (
    <span className="cc-mini-icon" style={{ color }}>
      <i className={`wi ${className}`} aria-hidden />
    </span>
  );
}

/** Sparkline — tiny SVG area chart with gradient fill, axis labels, and min/max callouts */
function Sparkline({
  points,
  color,
  label,
  unitSuffix,
}: {
  points: SparklinePoint[];
  color: string;
  label: string;
  unitSuffix: string;
}) {
  if (points.length < 2) return null;

  const W = 200;
  const H = 72;
  const PAD_T = 14;
  const PAD_B = 14; // room for x-axis labels
  const CHART_H = H - PAD_T - PAD_B;

  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const xStep = W / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: i * xStep,
    y: PAD_T + (1 - (p.value - min) / range) * CHART_H,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const fillPath = `${linePath} L ${W} ${H - PAD_B} L 0 ${H - PAD_B} Z`;

  const uid = label.replace(/\s/g, '');

  // Pick ~5 evenly spaced time tick labels
  const tickCount = Math.min(5, points.length);
  const tickStep = (points.length - 1) / (tickCount - 1);
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const idx = Math.round(i * tickStep);
    const safePoint = points[idx] ?? points[0];
    const safeCoord = coords[idx] ?? coords[0];
    return { x: safeCoord?.x ?? 0, label: safePoint?.label ?? '' };
  });

  // Find min & max indices for value callouts
  const minIdx = vals.indexOf(min);
  const maxIdx = vals.indexOf(max);
  const maxCoord = coords[maxIdx] ?? coords[0] ?? { x: 0, y: 0 };
  const minCoord = coords[minIdx] ?? coords[0] ?? { x: 0, y: 0 };

  return (
    <div className="cc-sparkline">
      <span className="cc-spark-label">{label}</span>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="cc-spark-svg">
        <defs>
          <linearGradient id={`sp-f-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* area + line */}
        <path d={fillPath} fill={`url(#sp-f-${uid})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* min/max dots + value labels */}
        <circle cx={maxCoord.x} cy={maxCoord.y} r="2" fill={color} />
        <text
          x={maxCoord.x}
          y={maxCoord.y - 4}
          textAnchor="middle"
          className="cc-spark-val-label"
          fill={color}
        >
          {max}{unitSuffix}
        </text>
        <circle cx={minCoord.x} cy={minCoord.y} r="2" fill={color} opacity="0.7" />
        <text
          x={minCoord.x}
          y={minCoord.y - 4}
          textAnchor="middle"
          className="cc-spark-val-label"
          fill={color}
          opacity="0.7"
        >
          {min}{unitSuffix}
        </text>

        {/* x-axis time labels */}
        {ticks.map((t) => (
          <text
            key={t.label}
            x={t.x}
            y={H - 2}
            textAnchor="middle"
            className="cc-spark-tick"
          >
            {t.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function ConditionsCard({ data, tempCurve, precipCurve }: ConditionsCardProps) {
  const moonPresentation = getMoonPhaseIconPresentation(data.moonPhase, '#e0e0e0');
  const moonPhaseLabel = data.moonPhase.toLowerCase().includes('full')
    ? 'Full'
    : data.moonPhase.toLowerCase().includes('waning')
      ? 'Waning'
      : data.moonPhase.toLowerCase().includes('waxing')
        ? 'Waxing'
        : data.moonPhase;

  return (
    <div className="conditions-card">
      {/* Top: large condition icon + label */}
      <div className="cc-header">
        <div className="cc-header-left">
          <ConditionIcon icon={data.conditionIcon} />
          <span className="cc-condition-label">{data.condition}</span>
        </div>
        {data.sourceUpdatedAt && (
          <span className="cc-updated-at">Last updated {data.sourceUpdatedAt}</span>
        )}
      </div>

      {/* 4-across metric row: wind, sunrise, sunset, moon */}
      <div className="cc-metrics">
        <div className="cc-metric">
          <MiniIcon type="wind" color="#80cbc4" />
          <span className="cc-metric-val">{data.windSpeed} {data.windUnit}</span>
          <span className="cc-metric-lbl">{data.windDirection}</span>
        </div>
        <div className="cc-metric">
          <MiniIcon type="sunrise" color="#ffcc80" />
          <span className="cc-metric-val">{data.sunrise}</span>
          <span className="cc-metric-lbl">Sunrise</span>
        </div>
        <div className="cc-metric">
          <MiniIcon type="sunset" color="#ff8a65" />
          <span className="cc-metric-val">{data.sunset}</span>
          <span className="cc-metric-lbl">Sunset</span>
        </div>
        <div className="cc-metric">
          <span className="cc-mini-icon cc-mini-icon--moon" style={{ color: moonPresentation.color }}>
            <i className={`wi ${moonPresentation.className}`} aria-hidden />
          </span>
          <span className="cc-metric-val">{data.moonIllumination}%</span>
          <span className="cc-metric-lbl">{moonPhaseLabel}</span>
        </div>
      </div>

      {/* Sparkline charts: temp curve + precip probability */}
      <div className="cc-charts">
        <Sparkline
          points={tempCurve}
          color="#ff8a65"
          label="Temp"
          unitSuffix="°"
        />
        <Sparkline
          points={precipCurve}
          color="#42a5f5"
          label="Precip"
          unitSuffix="%"
        />
      </div>

    </div>
  );
}
