/**
 * ConditionsCard — Glassmorphic card showing current conditions at a glance.
 *
 * Displays weather condition, sunrise/sunset, wind, moon phase,
 * plus sparkline charts for hourly temperature and precipitation.
 */
import type { ConditionsCardData } from '../types';
import type { ReactNode } from 'react';
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
  const size = 36;
  const icons: Record<string, ReactNode> = {
    'clear': (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="#fdd835">
        <circle cx="12" cy="12" r="5" />
        <g stroke="#fdd835" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="1" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
          <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
          <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
        </g>
      </svg>
    ),
    'partly-cloudy': (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <circle cx="10" cy="8" r="4" fill="#fdd835" />
        <g stroke="#fdd835" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
          <line x1="10" y1="1" x2="10" y2="3" />
          <line x1="4" y1="8" x2="2" y2="8" />
          <line x1="5.05" y1="3.05" x2="6.46" y2="4.46" />
          <line x1="14.95" y1="3.05" x2="13.54" y2="4.46" />
        </g>
        <path d="M18.5 18h-11A3.5 3.5 0 0 1 7 11.05a4.5 4.5 0 0 1 8.45-1.55A3 3 0 0 1 18.5 12.5v.01A3 3 0 0 1 18.5 18z"
          fill="#90caf9" opacity="0.8" />
      </svg>
    ),
    'cloudy': (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="#78909c">
        <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.99 5.99 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" opacity="0.7" />
      </svg>
    ),
    'rain': (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.99 5.99 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
          fill="#42a5f5" opacity="0.7" />
        <line x1="9" y1="19" x2="7.5" y2="23" stroke="#42a5f5" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="19" x2="11.5" y2="23" stroke="#42a5f5" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="17" y1="19" x2="15.5" y2="23" stroke="#42a5f5" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };
  return <span className="cc-condition-icon">{icons[icon] ?? icons['partly-cloudy']}</span>;
}

/** Moon phase SVG — shows illumination as a crescent */
function MoonIcon({ illumination }: { illumination: number }) {
  const pct = Math.max(0, Math.min(100, illumination));
  // Simple crescent: offset a dark circle over a light one
  const offset = 10 - (pct / 100) * 20; // -10 (full) to +10 (new)
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" className="cc-moon-icon">
      <defs>
        <mask id="moon-mask">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <circle cx={12 + offset} cy="12" r="8" fill="black" />
        </mask>
      </defs>
      <circle cx="12" cy="12" r="8" fill="#e0e0e0" mask="url(#moon-mask)" />
    </svg>
  );
}

/** Tiny inline icon for metric items */
function MiniIcon({ type, color }: { type: string; color: string }) {
  const s = 14;
  const icons: Record<string, ReactNode> = {
    wind: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
        <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
      </svg>
    ),
    humidity: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill={color}>
        <path d="M12 2c-5.33 8-8 12.67-8 16a8 8 0 0 0 16 0c0-3.33-2.67-8-8-16z" opacity="0.85" />
      </svg>
    ),
    uv: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill={color}>
        <circle cx="12" cy="12" r="4.5" />
        <g stroke={color} strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
        </g>
      </svg>
    ),
    precip: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill={color}>
        <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.99 5.99 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" opacity="0.7" />
      </svg>
    ),
    feelslike: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill={color}>
        <path d="M15 13V5a3 3 0 0 0-6 0v8a5 5 0 1 0 6 0zM12 4a1 1 0 0 1 1 1v7h-2V5a1 1 0 0 1 1-1z" opacity="0.8" />
      </svg>
    ),
    sunrise: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M12 2v4M4.93 10.93l1.41 1.41M2 18h2M20 18h2M17.66 12.34l1.41-1.41" />
        <path d="M18 18a6 6 0 0 0-12 0" />
        <line x1="8" y1="6" x2="12" y2="2" /><line x1="16" y1="6" x2="12" y2="2" />
      </svg>
    ),
    sunset: (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M12 10v-4M4.93 10.93l1.41 1.41M2 18h2M20 18h2M17.66 12.34l1.41-1.41" />
        <path d="M18 18a6 6 0 0 0-12 0" />
        <line x1="8" y1="2" x2="12" y2="6" /><line x1="16" y1="2" x2="12" y2="6" />
      </svg>
    ),
  };
  return <span className="cc-mini-icon">{icons[type] ?? null}</span>;
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
          <span className="cc-mini-icon cc-mini-icon--moon">
            <MoonIcon illumination={data.moonIllumination} />
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
