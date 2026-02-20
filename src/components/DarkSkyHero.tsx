/**
 * DarkSkyHero — Sky Dial hero section for the Dark Sky page.
 *
 * Three concentric SVG arcs, each with its own identity colour and a
 * start-to-tip gradient that brightens as the score increases:
 *
 *   Outer  (r=108) — Cloud cover      — Blue family
 *   Middle (r=86)  — Transparency     — Violet / purple family
 *   Inner  (r=64)  — Seeing           — Teal / cyan family
 *
 * The composite stargazing score and location sit at the centre of the dial.
 * A comfort strip (temp / wind / humidity) anchors the bottom of the card.
 */
import type { DarkSkyForecastItem } from '../types/darksky';
import './DarkSkyHero.css';

interface DarkSkyHeroProps {
  /** The best tonight forecast entry to display. */
  tonight: DarkSkyForecastItem;
  /** Location display name shown inside the hero. */
  location: string;
}

// ---- Dial geometry -------------------------------------------------------
const CX = 150;
const CY = 150;
const ARC_START = 150;  // lower-left
const ARC_SWEEP = 240;  // sweeps CW to lower-right
const GAP_ANGLE  = 360 - ARC_SWEEP; // 120° gap at bottom

/** Ring definitions — outer → inner, each with fixed identity colours. */
const RINGS = [
  {
    key:         'cloud'        as const,
    label:       'Cloud Cover',
    r:           108,
    stroke:      11,
    gradId:      'dsh-g-cloud',
    dimColor:    '#0d2b6e',
    brightColor: '#82b1ff',
    trackColor:  'rgba(66,133,244,0.10)',
  },
  {
    key:         'transparency' as const,
    label:       'Transparency',
    r:           86,
    stroke:      11,
    gradId:      'dsh-g-trans',
    dimColor:    '#32006e',
    brightColor: '#ea80fc',
    trackColor:  'rgba(172,80,255,0.10)',
  },
  {
    key:         'seeing'       as const,
    label:       'Seeing',
    r:           64,
    stroke:      11,
    gradId:      'dsh-g-seeing',
    dimColor:    '#003d3f',
    brightColor: '#84ffff',
    trackColor:  'rgba(0,188,212,0.10)',
  },
] as const;

// ---- Helpers ---------------------------------------------------------------
function toRad(deg: number): number { return (deg * Math.PI) / 180; }

function polarPt(r: number, deg: number) {
  return {
    x: CX + r * Math.cos(toRad(deg)),
    y: CY + r * Math.sin(toRad(deg)),
  };
}

/** SVG arc path starting at startDeg, sweeping sweepDeg degrees CW. */
function arcPath(r: number, startDeg: number, sweepDeg: number): string {
  const clamped = Math.min(Math.max(sweepDeg, 0.01), ARC_SWEEP - 0.01);
  const sp    = polarPt(r, startDeg);
  const ep    = polarPt(r, startDeg + clamped);
  const large = clamped > 180 ? 1 : 0;
  return (
    `M ${sp.x.toFixed(2)} ${sp.y.toFixed(2)} ` +
    `A ${r} ${r} 0 ${large} 1 ${ep.x.toFixed(2)} ${ep.y.toFixed(2)}`
  );
}

/** Verdict label for the composite 0–100 score. */
function scoreVerdict(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Very Good';
  if (score >= 50) return 'Good';
  if (score >= 35) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Very Poor';
}

/** Centre score colour — warm gradient from red → gold → green. */
function compositeColor(score: number): string {
  if (score >= 75) return '#aed581';
  if (score >= 50) return '#fff176';
  if (score >= 30) return '#ffb74d';
  return '#ef9a9a';
}

export default function DarkSkyHero({ tonight, location }: DarkSkyHeroProps) {
  const cloudScore  = Math.round(100 - tonight.cloudCoverPct);
  const transScore  = Math.round(((8 - tonight.transparencyValue) / 7) * 100);
  const seeingScore = Math.round(((8 - tonight.seeingValue) / 7) * 100);

  const scores: Record<typeof RINGS[number]['key'], number> = {
    cloud:        cloudScore,
    transparency: transScore,
    seeing:       seeingScore,
  };

  const metricLabels: Record<typeof RINGS[number]['key'], string> = {
    cloud:        tonight.cloudCoverLabel,
    transparency: tonight.transparencyLabel.split('(')[0]?.trim() ?? '',
    seeing:       tonight.seeingLabel.split('(')[0]?.trim() ?? '',
  };

  const scoreColor = compositeColor(tonight.stargazingScore);

  const timeLabel = new Date(tonight.dateTime).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  return (
    <div className="dsh-hero">
      {/* Location + best window row */}
      <div className="dsh-hero__location-row">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="rgba(138,100,255,0.7)" aria-hidden>
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
        </svg>
        <span className="dsh-hero__location-text">{location}</span>
        <span className="dsh-hero__time-chip">Best Tonight · {timeLabel}</span>
      </div>

      {/* Sky Dial */}
      <svg
        viewBox="0 0 300 300"
        className="dsh-hero__svg"
        aria-label={`Sky dial — stargazing score ${tonight.stargazingScore} out of 100`}
      >
        <defs>
          {/* Per-ring identity gradients — horizontal, UserSpaceOnUse */}
          {RINGS.map((ring) => (
            <linearGradient
              key={ring.gradId}
              id={ring.gradId}
              gradientUnits="userSpaceOnUse"
              x1="20"  y1={CY}
              x2="280" y2={CY}
            >
              <stop offset="0%"   stopColor={ring.dimColor}    stopOpacity="1" />
              <stop offset="60%"  stopColor={ring.brightColor} stopOpacity="0.78" />
              <stop offset="100%" stopColor={ring.brightColor} stopOpacity="1" />
            </linearGradient>
          ))}

          {/* Arc glow */}
          <filter id="dsh-glow" filterUnits="userSpaceOnUse" x="-20" y="-20" width="340" height="340">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Centre score glow */}
          <filter id="dsh-centre-glow" filterUnits="userSpaceOnUse" x="60" y="60" width="180" height="180">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track arcs */}
        {RINGS.map((ring) => (
          <path
            key={`track-${ring.key}`}
            d={arcPath(ring.r, ARC_START, ARC_SWEEP)}
            fill="none"
            stroke={ring.trackColor}
            strokeWidth={ring.stroke}
            strokeLinecap="round"
          />
        ))}

        {/* Filled score arcs with identity gradients */}
        {RINGS.map((ring) => {
          const sweep = (scores[ring.key] / 100) * ARC_SWEEP;
          if (sweep < 1) return null;
          return (
            <path
              key={`fill-${ring.key}`}
              d={arcPath(ring.r, ARC_START, sweep)}
              fill="none"
              stroke={`url(#${ring.gradId})`}
              strokeWidth={ring.stroke}
              strokeLinecap="round"
              filter="url(#dsh-glow)"
            />
          );
        })}

        {/* End-cap glow dots */}
        {RINGS.map((ring) => {
          const sweep = (scores[ring.key] / 100) * ARC_SWEEP;
          if (sweep < 2) return null;
          const ep = polarPt(ring.r, ARC_START + sweep);
          return (
            <circle
              key={`cap-${ring.key}`}
              cx={ep.x} cy={ep.y}
              r="5"
              fill={ring.brightColor}
              opacity="0.85"
              filter="url(#dsh-glow)"
              className="dsh-cap-pulse"
            />
          );
        })}

        {/* Start anchor dots */}
        {RINGS.map((ring) => {
          const sp = polarPt(ring.r, ARC_START);
          return (
            <circle key={`start-${ring.key}`} cx={sp.x} cy={sp.y} r="2.5"
              fill="rgba(255,255,255,0.10)" />
          );
        })}

        {/* Gap centre hint line */}
        {(() => {
          const gapMid = ARC_START + ARC_SWEEP + GAP_ANGLE / 2;
          const ip = polarPt(RINGS[RINGS.length - 1].r - 14, gapMid);
          const op = polarPt(RINGS[0].r + 8, gapMid);
          return (
            <line x1={ip.x} y1={ip.y} x2={op.x} y2={op.y}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          );
        })()}

        {/* Centre disc */}
        <circle cx={CX} cy={CY} r="46" fill="#07090f" fillOpacity="0.9" />
        <circle cx={CX} cy={CY} r="46" fill="none" stroke="rgba(138,100,255,0.2)" strokeWidth="1" />

        {/* Score + /100 as one centered group */}
        <text x={CX} y={CY - 6}
          textAnchor="middle" dominantBaseline="auto"
          fontFamily="Inter, system-ui, sans-serif"
          filter="url(#dsh-centre-glow)"
        >
          <tspan fontSize="30" fontWeight="700" fill={scoreColor}>
            {tonight.stargazingScore}
          </tspan><tspan fontSize="10" fontWeight="400" fill="rgba(255,255,255,0.25)" dy="-12" dx="1">/100</tspan>
        </text>

        {/* Verdict */}
        <text x={CX} y={CY + 17}
          textAnchor="middle" dominantBaseline="auto"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="9" fontWeight="600" letterSpacing="0.07em"
          fill="rgba(255,255,255,0.35)"
        >
          {scoreVerdict(tonight.stargazingScore).toUpperCase()}
        </text>
      </svg>

      {/* Ring legend */}
      <div className="dsh-hero__legend">
        {RINGS.map((ring) => (
          <div key={ring.key} className="dsh-hero__legend-item">
            <span
              className="dsh-hero__legend-swatch"
              style={{
                background: `linear-gradient(135deg, ${ring.dimColor}, ${ring.brightColor})`,
                boxShadow:  `0 0 6px ${ring.brightColor}55`,
              }}
            />
            <div className="dsh-hero__legend-text">
              <span className="dsh-hero__legend-name">{ring.label}</span>
              <span className="dsh-hero__legend-value">{metricLabels[ring.key]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Comfort strip */}
      <div className="dsh-hero__comfort">
        <span className="dsh-hero__comfort-item">
          <span className="dsh-hero__comfort-icon">🌡</span>
          {tonight.temp}°C
        </span>
        <span className="dsh-hero__comfort-sep" />
        <span className="dsh-hero__comfort-item">
          <span className="dsh-hero__comfort-icon">💨</span>
          {tonight.windLabel}&nbsp;{tonight.windDirection}
        </span>
        <span className="dsh-hero__comfort-sep" />
        <span className="dsh-hero__comfort-item">
          <span className="dsh-hero__comfort-icon">💧</span>
          {Math.round(tonight.humidityPct)}%
        </span>
        {tonight.precipType !== 'none' && (
          <>
            <span className="dsh-hero__comfort-sep" />
            <span className="dsh-hero__comfort-item dsh-hero__comfort-item--warn">
              <span className="dsh-hero__comfort-icon">🌧</span>
              {tonight.precipType}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
