/**
 * SecondaryArcGauge — Bold half-arc gauge displayed below the hero gauge.
 *
 * Wide, thick arc with gradient and transparency fade at both ends.
 * Used for wind speed or any prominent secondary metric.
 */
import './SecondaryArcGauge.css';

interface SecondaryArcGaugeProps {
  /** Display value */
  value: number;
  /** Unit label (e.g., '°F', 'mph') — displayed as-is after the value */
  unit: string;
  /** Subtitle text below the value */
  subtitle?: string;
  /** Value position on the arc (0–1) */
  ratio: number;
  /** Gradient start color */
  colorStart?: string;
  /** Gradient end color */
  colorEnd?: string;
}

/* ---- Geometry: wide, gentle arch spanning full section width ---- */
const W = 460;        // viewBox width
const H = 200;        // viewBox height
const CX = W / 2;     // center x
const CY = 250;       // center y — below viewBox so only upper arc is visible
const R = 200;         // radius for a gentle, wide curve
const SW = 14;         // stroke width

const toRad = (d: number) => (d * Math.PI) / 180;

function pt(angle: number, r = R) {
  return {
    x: CX + r * Math.cos(toRad(angle)),
    y: CY + r * Math.sin(toRad(angle)),
  };
}

function arcPath(s: number, e: number, r = R): string {
  const sp = pt(s, r);
  const ep = pt(e, r);
  const sweep = ((e - s) % 360 + 360) % 360;
  return `M ${sp.x} ${sp.y} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${ep.x} ${ep.y}`;
}

export default function SecondaryArcGauge({
  value,
  unit,
  subtitle,
  ratio,
  colorStart = '#00e5ff',
  colorEnd = '#ff6d00',
}: SecondaryArcGaugeProps) {
  /* Arc spans from 200° to 340° (140° sweep) — wide gentle arch */
  const ARC_START = 200;
  const ARC_END = 340;
  const ARC_SWEEP = ARC_END - ARC_START;

  const clamped = Math.max(0, Math.min(1, ratio));
  const indicatorAngle = ARC_START + clamped * ARC_SWEEP;
  const iPt = pt(indicatorAngle);

  const bgArc = arcPath(ARC_START, ARC_END);
  const fillArc = arcPath(ARC_START, indicatorAngle);

  /* Unique IDs for multiple instances */
  const uid = colorStart.replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `sg-g-${uid}`;
  const fadeId = `sg-f-${uid}`;
  const maskId = `sg-m-${uid}`;
  const glowId = `sg-gl-${uid}`;
  const dotId = `sg-dt-${uid}`;

  /* Fade mask anchor points — horizontal projection of arc ends */
  const startPt = pt(ARC_START);
  const endPt = pt(ARC_END);

  return (
    <div className="secondary-gauge">
      <svg viewBox={`0 0 ${W} ${H}`} className="secondary-gauge-svg"
        preserveAspectRatio="xMidYMin meet">
        <defs>
          {/* Arc color gradient */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="50%" stopColor={colorEnd} stopOpacity="0.9" />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>

          {/* Fade-out mask: strong transparent edges → opaque center */}
          <linearGradient id={fadeId}
            x1={startPt.x} y1="0"
            x2={endPt.x} y2="0"
            gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="6%" stopColor="white" stopOpacity="0.15" />
            <stop offset="14%" stopColor="white" stopOpacity="0.5" />
            <stop offset="25%" stopColor="white" stopOpacity="1" />
            <stop offset="75%" stopColor="white" stopOpacity="1" />
            <stop offset="86%" stopColor="white" stopOpacity="0.5" />
            <stop offset="94%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id={maskId}>
            <rect x="0" y="0" width={W} height={H} fill={`url(#${fadeId})`} />
          </mask>

          {/* Glow for the arc */}
          <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b2" />
            <feMerge>
              <feMergeNode in="b1" />
              <feMergeNode in="b2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Indicator dot glow */}
          <filter id={dotId} x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track — thick, dim, faded at edges */}
        <g mask={`url(#${maskId})`}>
          <path d={bgArc} fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={SW + 6}
            strokeLinecap="round" />
        </g>

        {/* Filled gradient arc — thick, glowing, faded at edges */}
        <g mask={`url(#${maskId})`}>
          <path d={fillArc} fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={SW}
            strokeLinecap="round"
            filter={`url(#${glowId})`} />
        </g>

        {/* Indicator dot */}
        <g filter={`url(#${dotId})`}>
          <circle cx={iPt.x} cy={iPt.y} r="7" fill="#ffffff" opacity="0.9" />
        </g>

        {/* Value text — positioned in lower-center area below the arc curve */}
        <text x={CX} y={H - 40} textAnchor="middle" className="sg-value">
          {value}{unit}
        </text>
        {subtitle && (
          <text x={CX} y={H - 16} textAnchor="middle" className="sg-subtitle">
            {subtitle}
          </text>
        )}
      </svg>
    </div>
  );
}
