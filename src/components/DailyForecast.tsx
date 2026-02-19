/**
 * DailyForecast — Temperature range bars for multi-day forecast.
 */
import { useState } from 'react';
import type { DailyForecastItem } from '../types';
import { getWeatherIconPresentation } from './weatherIconMap';
import './DailyForecast.css';

interface DailyForecastProps {
  items: DailyForecastItem[];
  unit: string;
  /** Overall min/max across all days, for scaling bars */
  overallMin: number;
  overallMax: number;
}

function DailyIcon({ icon }: { icon: string }) {
  const { className, color } = getWeatherIconPresentation(icon);
  return (
    <span className="daily-icon" style={{ color }}>
      <i className={`wi ${className}`} aria-hidden />
    </span>
  );
}

export default function DailyForecast({ items, unit, overallMin, overallMax }: DailyForecastProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(items.length > 0 ? 0 : null);
  const range = overallMax - overallMin;

  return (
    <div className="daily-section">
      <h3 className="daily-title">Daily Forecast</h3>
      <p className="daily-subtitle">Tap a day to view full forecast details</p>
      <div className="daily-list">
        {items.map((item, index) => {
          const leftPct = range > 0 ? ((item.low - overallMin) / range) * 100 : 0;
          const widthPct = range > 0 ? ((item.high - item.low) / range) * 100 : 50;
          const daySummary = item.daySummary?.trim();
          const nightSummary = item.nightSummary?.trim();
          const hasDetails = Boolean(daySummary || nightSummary);
          const isExpanded = expandedIndex === index;

          return (
            <article className={`daily-card ${isExpanded ? 'daily-card--expanded' : ''}`} key={`${item.day}-${index}`}>
              <button
                className="daily-row"
                type="button"
                onClick={() => {
                  if (!hasDetails) {
                    return;
                  }

                  setExpandedIndex(isExpanded ? null : index);
                }}
                aria-expanded={hasDetails ? isExpanded : false}
              >
                <div className="daily-left">
                  <DailyIcon icon={item.icon} />
                  <span className="daily-day">{item.day}</span>
                </div>

                <div className="daily-middle">
                  <div className="daily-bar-track">
                    <div
                      className="daily-bar-fill"
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(widthPct, 8)}%`,
                      }}
                    />
                  </div>
                  <div className="daily-temps-inline">
                    <span className="daily-low">{item.low}°</span>
                    <span className="daily-high">{item.high}°{unit}</span>
                  </div>
                </div>

                {hasDetails && (
                  <span className={`daily-expand-indicator ${isExpanded ? 'daily-expand-indicator--open' : ''}`} aria-hidden>
                    ▾
                  </span>
                )}
              </button>

              {hasDetails && (
                <div className={`daily-details ${isExpanded ? 'daily-details--open' : ''}`}>
                  {daySummary && (
                    <p className="daily-detail-item">
                      <span className="daily-detail-label">Day</span>
                      {daySummary}
                    </p>
                  )}
                  {nightSummary && (
                    <p className="daily-detail-item">
                      <span className="daily-detail-label">Night</span>
                      {nightSummary}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
