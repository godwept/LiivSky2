/**
 * TemperatureGauge — Hero radial gauge for the dashboard.
 *
 * Near-full-circle (~330°) SVG arc with rich multi-stop gradient,
 * multi-layer glow, and inner ring.
 *
 * Indicators on the arc:
 *   - Today's low (small cyan dot)
 *   - Today's high (small orange dot)
 *   - Current temperature (larger pulsing white dot)
 *
 * Center displays current temp + feels-like.
 */
import type { TemperatureGaugeData } from '../types';
import './TemperatureGauge.css';

interface TemperatureGaugeProps {
  data: TemperatureGaugeData;
}

/* ---- Gauge geometry ---- */
const CX = 200;
const CY = 200;
const R_OUTER = 155;
const R_INNER = 130;
const STROKE_W = 12;
const GAP = 30;                        // gap degrees at bottom
const ARC_START = 90 + GAP / 2;       // just past 6-o'clock
const ARC_END = 90 - GAP / 2 + 360;   // nearly full circle
const ARC_SWEEP = ARC_END - ARC_START; // ~330°
const MAIN_SEGMENTS = 96;

const ARC_COLOR_STOPS = [
  { at: 0, color: '#b3e5fc' },
  { at: 0.16, color: '#4fc3f7' },
  { at: 0.36, color: '#1e88e5' },
  { at: 0.56, color: '#26c6da' },
  { at: 0.72, color: '#ffb74d' },
  { at: 0.86, color: '#ff7043' },
  { at: 0.95, color: '#f4511e' },
  { at: 1, color: '#d84315' },
] as const;

const toRad = (d: number) => (d * Math.PI) / 180;

/** Point on a circle */
function pt(angle: number, r = R_OUTER) {
  const rad = toRad(angle);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

/** SVG arc path between two angles on a given radius */
function arc(s: number, e: number, r = R_OUTER): string {
  const sp = pt(s, r);
  const ep = pt(e, r);
  const sweep = ((e - s) % 360 + 360) % 360;
  return `M ${sp.x} ${sp.y} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${ep.x} ${ep.y}`;
}

/** Map temperature → angle on gauge */
function tempAngle(temp: number, min: number, max: number) {
  const ratio = Math.max(0, Math.min(1, (temp - min) / (max - min)));
  return ARC_START + ratio * ARC_SWEEP;
}

function normalizeAngle(angle: number) {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function shortestAngleDelta(a: number, b: number) {
  const diff = Math.abs(a - b);
  return Math.min(diff, 360 - diff);
}

function markerLabelPlacement(angle: number, point: { x: number; y: number }) {
  const normalized = normalizeAngle(angle);
  const TOP_ANCHOR_ANGLE = 270;
  const TOP_CENTER_THRESHOLD = 24;

  if (shortestAngleDelta(normalized, TOP_ANCHOR_ANGLE) <= TOP_CENTER_THRESHOLD) {
    return {
      x: point.x,
      y: point.y - 19,
      textAnchor: 'middle' as const,
    };
  }

  const isWarmSide = normalized < 90 || normalized > 270;
  if (isWarmSide) {
    return {
      x: point.x + 13,
      y: point.y + 3,
      textAnchor: 'start' as const,
    };
  }

  return {
    x: point.x - 13,
    y: point.y + 3,
    textAnchor: 'end' as const,
  };
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  const normalized = value.length === 3
    ? value.split('').map((c) => `${c}${c}`).join('')
    : value;
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function colorAtRatio(ratio: number) {
  const t = Math.max(0, Math.min(1, ratio));

  for (let i = 0; i < ARC_COLOR_STOPS.length - 1; i += 1) {
    const start = ARC_COLOR_STOPS[i];
    const end = ARC_COLOR_STOPS[i + 1];
    if (!start || !end) continue;
    if (t >= start.at && t <= end.at) {
      const localT = (t - start.at) / (end.at - start.at || 1);
      const from = hexToRgb(start.color);
      const to = hexToRgb(end.color);
      return rgbToHex(
        from.r + (to.r - from.r) * localT,
        from.g + (to.g - from.g) * localT,
        from.b + (to.b - from.b) * localT,
      );
    }
  }

  const lastStop = ARC_COLOR_STOPS[ARC_COLOR_STOPS.length - 1];
  return lastStop?.color ?? '#d84315';
}

export default function TemperatureGauge({ data }: TemperatureGaugeProps) {
  const { current, feelsLike, low, high, min, max, unit } = data;

  const curA = tempAngle(current, min, max);
  const loA = tempAngle(low, min, max);
  const hiA = tempAngle(high, min, max);

  const curPt = pt(curA);
  const loPt = pt(loA);
  const hiPt = pt(hiA);
  const lowLabel = markerLabelPlacement(loA, loPt);
  const highLabel = markerLabelPlacement(hiA, hiPt);

  const mainArc = arc(ARC_START, ARC_END);
  const innerArc = arc(ARC_START, ARC_END, R_INNER);

  return (
    <div className="gauge-container">
      <svg viewBox="0 0 400 400" className="gauge-svg" role="img"
        aria-label={`Temperature: ${current}°${unit}, feels like ${feelsLike}°${unit}`}>
        <defs>
          {/* Inner ring gradient — cool blue to warm orange/red, subtle */}
          <linearGradient id="hg-ig" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0d47a1" />
            <stop offset="45%" stopColor="#1e88e5" />
            <stop offset="75%" stopColor="#fb8c00" />
            <stop offset="100%" stopColor="#e64a19" />
          </linearGradient>

          {/* Outer glow */}
          <filter id="hg-gl" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b2" />
            <feMerge>
              <feMergeNode in="b1" />
              <feMergeNode in="b2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Inner ring glow */}
          <filter id="hg-igl" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Current dot glow */}
          <filter id="hg-dg" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Marker glow */}
          <filter id="hg-mg" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Ambient radial glow behind the gauge */}
          <radialGradient id="hg-amb" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(48, 116, 204, 0.15)" />
            <stop offset="55%" stopColor="rgba(97, 63, 161, 0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Ambient glow circle */}
        <circle cx={CX} cy={CY} r="185" fill="url(#hg-amb)" />

        {/* Dim background track */}
        <path d={mainArc} fill="none" stroke="rgba(255,255,255,0.04)"
          strokeWidth={STROKE_W + 6} strokeLinecap="round" />

        {/* Inner ring — thinner, subtler, glowing */}
        <path d={innerArc} fill="none" stroke="url(#hg-ig)"
          strokeWidth={5} strokeLinecap="round" opacity="0.3" filter="url(#hg-igl)" />

        {/* Main gradient arc with sweep-style color transition around entire ring */}
        <g filter="url(#hg-gl)">
          {Array.from({ length: MAIN_SEGMENTS }, (_, i) => {
            const segmentStep = ARC_SWEEP / MAIN_SEGMENTS;
            const start = ARC_START + i * segmentStep;
            const end = Math.min(ARC_END, start + segmentStep + 0.22);
            const color = colorAtRatio((i + 0.5) / MAIN_SEGMENTS);
            return (
              <path
                key={i}
                d={arc(start, end)}
                fill="none"
                stroke={color}
                strokeWidth={STROKE_W}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* Low indicator */}
        <g filter="url(#hg-mg)">
          <circle cx={loPt.x} cy={loPt.y} r="9" fill="#00d4ff" opacity="0.28" />
          <circle cx={loPt.x} cy={loPt.y} r="6.5" fill="#00d4ff" stroke="rgba(255,255,255,0.95)" strokeWidth="1.4" />
          <text x={lowLabel.x} y={lowLabel.y} textAnchor={lowLabel.textAnchor}
            className="gauge-marker-label" fill="#00d4ff" stroke="rgba(10,12,20,0.9)" strokeWidth="0.85" paintOrder="stroke fill">{low}°</text>
        </g>

        {/* High indicator */}
        <g filter="url(#hg-mg)">
          <circle cx={hiPt.x} cy={hiPt.y} r="9" fill="#ff8a3d" opacity="0.3" />
          <circle cx={hiPt.x} cy={hiPt.y} r="6.5" fill="#ff8a3d" stroke="rgba(255,255,255,0.95)" strokeWidth="1.4" />
          <text x={highLabel.x} y={highLabel.y} textAnchor={highLabel.textAnchor}
            className="gauge-marker-label" fill="#ff8a3d" stroke="rgba(10,12,20,0.9)" strokeWidth="0.85" paintOrder="stroke fill">{high}°</text>
        </g>

        {/* Current temperature indicator — pulsing white dot */}
        <g filter="url(#hg-dg)">
          <circle cx={curPt.x} cy={curPt.y} r="7" fill="#ffffff"
            className="gauge-current-indicator" />
        </g>

        {/* Center temperature text */}
        <text x={CX} y={CY - 6} textAnchor="middle" className="gauge-temp-text">
          {current}°{unit}
        </text>
        <text x={CX} y={CY + 26} textAnchor="middle" className="gauge-feelslike-text">
          Feels Like {feelsLike}°{unit}
        </text>
      </svg>
    </div>
  );
}
