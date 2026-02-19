/**
 * MetricBadge — Compact circular badge for showing a metric value.
 *
 * Used flanking the secondary gauge to condense data.
 * Shows icon + value + label in a small glassmorphic circle.
 */
import type { WeatherMetric } from '../types';
import { getMetricIconPresentation } from './weatherIconMap';
import './MetricBadge.css';

interface MetricBadgeProps {
  metric: WeatherMetric;
}

function BadgeIcon({ icon, color }: { icon: string; color: string }) {
  const { className } = getMetricIconPresentation(icon, color);
  return (
    <span className="badge-icon" style={{ color }}>
      <i className={`wi ${className}`} aria-hidden />
    </span>
  );
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
