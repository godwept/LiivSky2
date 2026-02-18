/**
 * WeatherMetricCard — Small card displaying a single weather metric.
 * Used for humidity, UV, precipitation, wind, etc.
 */
import type { WeatherMetric } from '../types';
import './WeatherMetricCard.css';

interface WeatherMetricCardProps {
  metric: WeatherMetric;
}

/** Simple SVG icons for weather metrics */
function MetricIcon({ icon, color }: { icon: string; color: string }) {
  const iconMap: Record<string, JSX.Element> = {
    humidity: (
      <svg viewBox="0 0 24 24" fill={color} width="28" height="28">
        <path d="M12 2c-5.33 8-8 12.67-8 16a8 8 0 0 0 16 0c0-3.33-2.67-8-8-16zm0 20a6 6 0 0 1-6-6c0-2.4 1.8-5.8 6-12.4C16.2 10.2 18 13.6 18 16a6 6 0 0 1-6 6z" />
        <path d="M12 18a4 4 0 0 1-4-4h2a2 2 0 0 0 2 2v2z" opacity="0.7" />
      </svg>
    ),
    uv: (
      <svg viewBox="0 0 24 24" fill={color} width="28" height="28">
        <circle cx="12" cy="12" r="5" />
        <g stroke={color} strokeWidth="2" strokeLinecap="round">
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
    precip: (
      <svg viewBox="0 0 24 24" fill={color} width="28" height="28">
        <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.99 5.99 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" opacity="0.6" />
        <line x1="9" y1="19" x2="8" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="19" x2="12" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    wind: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" width="28" height="28">
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
        <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
        <path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2" />
      </svg>
    ),
  };

  return <span className="metric-icon">{iconMap[icon] ?? iconMap['wind']}</span>;
}

export default function WeatherMetricCard({ metric }: WeatherMetricCardProps) {
  return (
    <div className="metric-card" style={{ '--accent': metric.color ?? '#80cbc4' } as React.CSSProperties}>
      <MetricIcon icon={metric.icon} color={metric.color ?? '#80cbc4'} />
      <span className="metric-value">
        {metric.value}{metric.unitLabel}
      </span>
      <span className="metric-label">{metric.label}</span>
    </div>
  );
}
