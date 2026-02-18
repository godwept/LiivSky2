/**
 * DailyForecast — Temperature range bars for multi-day forecast.
 */
import { useState } from 'react';
import type { DailyForecastItem } from '../types';
import './DailyForecast.css';

interface DailyForecastProps {
  items: DailyForecastItem[];
  unit: string;
  /** Overall min/max across all days, for scaling bars */
  overallMin: number;
  overallMax: number;
}

function DailyIcon({ icon }: { icon: string }) {
  if (icon === 'rain') {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" className="daily-icon" aria-hidden>
        <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.99 5.99 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#64b5f6" opacity="0.8" />
        <line x1="9" y1="19" x2="8" y2="22" stroke="#42a5f5" strokeWidth="1.7" strokeLinecap="round" />
        <line x1="13" y1="19" x2="12" y2="22" stroke="#42a5f5" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === 'cloudy') {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" className="daily-icon" aria-hidden>
        <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.99 5.99 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#90a4ae" opacity="0.82" />
      </svg>
    );
  }

  if (icon === 'clear') {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" className="daily-icon" aria-hidden>
        <circle cx="12" cy="12" r="5" fill="#ffd54f" />
        <g stroke="#ffd54f" strokeWidth="1.8" strokeLinecap="round">
          <line x1="12" y1="2.5" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="21.5" />
          <line x1="2.5" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="21.5" y2="12" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className="daily-icon" aria-hidden>
      <circle cx="9" cy="9" r="4.5" fill="#ffd54f" opacity="0.9" />
      <path d="M18.5 18h-11A3.5 3.5 0 0 1 7 11.05a4.5 4.5 0 0 1 8.45-1.55A3 3 0 0 1 18.5 12.5v.01A3 3 0 0 1 18.5 18z" fill="#90caf9" opacity="0.9" />
    </svg>
  );
}

export default function DailyForecast({ items, unit, overallMin, overallMax }: DailyForecastProps) {
  const [expandedDay, setExpandedDay] = useState<string>(items[0]?.day ?? '');
  const range = overallMax - overallMin;

  return (
    <div className="daily-section">
      <h3 className="daily-title">Daily Forecast</h3>
      <p className="daily-subtitle">Tap a day to view full forecast details</p>
      <div className="daily-list">
        {items.map((item) => {
          const leftPct = range > 0 ? ((item.low - overallMin) / range) * 100 : 0;
          const widthPct = range > 0 ? ((item.high - item.low) / range) * 100 : 50;
          const isExpanded = expandedDay === item.day;

          return (
            <article className={`daily-card ${isExpanded ? 'daily-card--expanded' : ''}`} key={item.day}>
              <button
                className="daily-row"
                type="button"
                onClick={() => setExpandedDay(isExpanded ? '' : item.day)}
                aria-expanded={isExpanded}
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

                <span className={`daily-expand-indicator ${isExpanded ? 'daily-expand-indicator--open' : ''}`} aria-hidden>
                  ▾
                </span>
              </button>

              <div className={`daily-details ${isExpanded ? 'daily-details--open' : ''}`}>
                <p className="daily-detail-item">
                  <span className="daily-detail-label">Day</span>
                  {item.daySummary ?? 'Forecast details coming soon.'}
                </p>
                <p className="daily-detail-item">
                  <span className="daily-detail-label">Night</span>
                  {item.nightSummary ?? 'Night forecast details coming soon.'}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
