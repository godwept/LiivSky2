/**
 * MetricBadge — Compact circular badge for showing a metric value.
 *
 * Used flanking the secondary gauge to condense data.
 * Shows icon + value + label in a small glassmorphic circle.
 */
import type { WeatherMetric } from '../types';
import type { ReactNode } from 'react';
import './MetricBadge.css';

interface MetricBadgeProps {
  metric: WeatherMetric;
}

/** Compact inline SVG icons */
function BadgeIcon({ icon, color }: { icon: string; color: string }) {
  const size = 22;
  const icons: Record<string, ReactNode> = {
    humidity: (
      <svg viewBox="0 0 24 24" fill={color} width={size} height={size}>
        <path d="M12 2c-5.33 8-8 12.67-8 16a8 8 0 0 0 16 0c0-3.33-2.67-8-8-16z" opacity="0.85" />
      </svg>
    ),
    uv: (
      <svg viewBox="0 0 24 24" fill={color} width={size} height={size}>
        <circle cx="12" cy="12" r="4.5" />
        <g stroke={color} strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="4.93" y1="4.93" x2="6.76" y2="6.76" />
          <line x1="17.24" y1="17.24" x2="19.07" y2="19.07" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="19.07" x2="6.76" y2="17.24" />
          <line x1="17.24" y1="6.76" x2="19.07" y2="4.93" />
        </g>
      </svg>
    ),
    'pressure-rising': (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
        <path d="M4 16h16" />
        <path d="M12 17V7" />
        <path d="M8 11l4-4 4 4" />
      </svg>
    ),
    'pressure-falling': (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
        <path d="M4 8h16" />
        <path d="M12 7v10" />
        <path d="M8 13l4 4 4-4" />
      </svg>
    ),
    'pressure-steady': (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
        <path d="M4 12h16" />
        <path d="M8 9l-3 3 3 3" />
        <path d="M16 9l3 3-3 3" />
      </svg>
    ),
    precip: (
      <svg viewBox="0 0 24 24" fill={color} width={size} height={size}>
        <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.99 5.99 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" opacity="0.7" />
        <line x1="9" y1="18" x2="8" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="18" x2="12" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    wind: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" width={size} height={size}>
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
        <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
        <path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2" />
      </svg>
    ),
    dewpoint: (
      <svg viewBox="0 0 24 24" fill={color} width={size} height={size}>
        <path d="M12 2c-5.33 8-8 12.67-8 16a8 8 0 0 0 16 0c0-3.33-2.67-8-8-16zm0 20a6 6 0 0 1-6-6c0-2.4 1.8-5.8 6-12.4C16.2 10.2 18 13.6 18 16a6 6 0 0 1-6 6z" />
        <circle cx="12" cy="16" r="2.5" opacity="0.6" />
      </svg>
    ),
  };
  return <span className="badge-icon">{icons[icon] ?? icons['wind']}</span>;
}

export default function MetricBadge({ metric }: MetricBadgeProps) {
  const accentColor = metric.color ?? '#80cbc4';
  return (
    <div className="metric-badge" style={{ '--badge-accent': accentColor } as React.CSSProperties}>
      <BadgeIcon icon={metric.icon} color={accentColor} />
      <span className="badge-value">{metric.value}{metric.unitLabel}</span>
      <span className="badge-label">{metric.label}</span>
    </div>
  );
}
