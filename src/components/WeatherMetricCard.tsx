/**
 * WeatherMetricCard — Small card displaying a single weather metric.
 * Used for humidity, UV, precipitation, wind, etc.
 */
import type { WeatherMetric } from '../types';
import { getMetricIconPresentation } from './weatherIconMap';
import './WeatherMetricCard.css';

interface WeatherMetricCardProps {
  metric: WeatherMetric;
}

/** Simple SVG icons for weather metrics */
function MetricIcon({ icon, color }: { icon: string; color: string }) {
  const { className } = getMetricIconPresentation(icon, color);
  return (
    <span className="metric-icon" style={{ color }}>
      <i className={`wi ${className}`} aria-hidden />
    </span>
  );
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
