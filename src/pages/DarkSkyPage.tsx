/**
 * DarkSkyPage — Astronomy / stargazing forecast.
 *
 * Displays a 3-day dark sky forecast using 7Timer! ASTRO API data.
 * Shows cloud cover, seeing, transparency, and an overall stargazing
 * quality score for each 3-hour window.
 */
import { useEffect, useMemo, useState } from 'react';
import { useWeatherStore } from '../store/weatherStore';
import { fetchDarkSkyForecast } from '../services/darkSkyClient';
import type { DarkSkyForecast, DarkSkyForecastItem } from '../types/darksky';
import './DarkSkyPage.css';

/** Score color thresholds */
function scoreColor(score: number): string {
  if (score >= 75) return '#66bb6a';
  if (score >= 50) return '#81c784';
  if (score >= 30) return '#ffa726';
  return '#ef5350';
}

/** Score CSS class */
function scoreClass(score: number): string {
  if (score >= 75) return 'score-excellent';
  if (score >= 50) return 'score-good';
  if (score >= 30) return 'score-fair';
  return 'score-poor';
}

/** Score verdict label */
function scoreVerdict(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Very Good';
  if (score >= 50) return 'Good';
  if (score >= 35) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Very Poor';
}

/**
 * Find the best "tonight" entry — first nighttime entry (after 6 PM local)
 * within the next 24 hours, or the best score tonight.
 */
function findTonightEntry(items: DarkSkyForecastItem[]): DarkSkyForecastItem | null {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 3600_000);

  // Filter to nighttime entries (18:00–06:00) within next 24h
  const nightEntries = items.filter((item) => {
    const dt = new Date(item.dateTime);
    if (dt < now || dt > tomorrow) return false;
    const hour = dt.getHours();
    return hour >= 18 || hour < 6;
  });

  if (nightEntries.length === 0) {
    // Fallback: best score in next 24h
    const next24 = items.filter((item) => {
      const dt = new Date(item.dateTime);
      return dt >= now && dt <= tomorrow;
    });
    if (next24.length === 0) return items[0] ?? null;
    return next24.reduce((best, cur) =>
      cur.stargazingScore > best.stargazingScore ? cur : best,
    );
  }

  // Return the best nighttime entry
  return nightEntries.reduce((best, cur) =>
    cur.stargazingScore > best.stargazingScore ? cur : best,
  );
}

export default function DarkSkyPage() {
  const lat = useWeatherStore((s) => s.lat);
  const lon = useWeatherStore((s) => s.lon);
  const location = useWeatherStore((s) => s.location);

  const [forecast, setForecast] = useState<DarkSkyForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Fetch forecast on mount and when location changes */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchDarkSkyForecast(lat, lon)
      .then((result) => {
        if (!cancelled) {
          setForecast(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch forecast');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [lat, lon]);

  /** Tonight's highlight entry */
  const tonight = useMemo(() => {
    if (!forecast) return null;
    return findTonightEntry(forecast.items);
  }, [forecast]);

  /** Group forecast items by date */
  const groupedByDate = useMemo(() => {
    if (!forecast) return [];
    const groups: { date: string; items: DarkSkyForecastItem[] }[] = [];
    for (const item of forecast.items) {
      const dateStr = new Date(item.dateTime).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      const existing = groups.find((g) => g.date === dateStr);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ date: dateStr, items: [item] });
      }
    }
    return groups;
  }, [forecast]);

  return (
    <div className="darksky-page">
      {/* Header */}
      <div className="darksky-header">
        <h1>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="rgba(138,100,255,0.8)">
            <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
          </svg>
          Dark Sky Forecast
        </h1>
        <p>{location}</p>
        <div className="darksky-subtitle">
          Stargazing & astronomy conditions · 3-day outlook
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="darksky-loading">
          <div className="models-spinner" />
          Loading dark sky forecast…
        </div>
      )}

      {/* Error */}
      {error && <div className="darksky-error">{error}</div>}

      {/* Tonight highlight */}
      {!loading && tonight && (
        <div className="darksky-tonight">
          <div className="darksky-tonight__label">Tonight's Stargazing</div>
          <div className={`darksky-tonight__score ${scoreClass(tonight.stargazingScore)}`}>
            {tonight.stargazingScore}
            <span className="darksky-tonight__score-unit">/100</span>
          </div>
          <div className={`darksky-tonight__verdict ${scoreClass(tonight.stargazingScore)}`}>
            {scoreVerdict(tonight.stargazingScore)}
          </div>
          <div className="darksky-tonight__details">
            <div className="darksky-tonight__detail">
              <div className="darksky-tonight__detail-value">{tonight.cloudCoverLabel}</div>
              <div className="darksky-tonight__detail-label">Cloud Cover</div>
            </div>
            <div className="darksky-tonight__detail">
              <div className="darksky-tonight__detail-value">{tonight.seeingLabel.split('(')[0]?.trim()}</div>
              <div className="darksky-tonight__detail-label">Seeing</div>
            </div>
            <div className="darksky-tonight__detail">
              <div className="darksky-tonight__detail-value">{tonight.transparencyLabel.split('(')[0]?.trim()}</div>
              <div className="darksky-tonight__detail-label">Transparency</div>
            </div>
          </div>
          <div className="darksky-score-gauge" style={{ marginTop: '0.65rem' }}>
            <div
              className="darksky-score-gauge__fill"
              style={{
                width: `${tonight.stargazingScore}%`,
                background: `linear-gradient(90deg, ${scoreColor(tonight.stargazingScore)}, ${scoreColor(tonight.stargazingScore)}88)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Legend */}
      {!loading && forecast && (
        <div className="darksky-legend">
          <div className="darksky-legend__item">
            <span className="darksky-legend__dot" style={{ background: '#66bb6a' }} />
            Excellent (75+)
          </div>
          <div className="darksky-legend__item">
            <span className="darksky-legend__dot" style={{ background: '#81c784' }} />
            Good (50–74)
          </div>
          <div className="darksky-legend__item">
            <span className="darksky-legend__dot" style={{ background: '#ffa726' }} />
            Fair (30–49)
          </div>
          <div className="darksky-legend__item">
            <span className="darksky-legend__dot" style={{ background: '#ef5350' }} />
            Poor (&lt;30)
          </div>
        </div>
      )}

      {/* 3-day timeline */}
      {!loading && groupedByDate.map((group) => (
        <div key={group.date}>
          <div className="darksky-timeline-label">{group.date}</div>
          <div className="darksky-cards">
            {group.items.map((item) => {
              const color = scoreColor(item.stargazingScore);
              const dt = new Date(item.dateTime);
              const hour = dt.getHours();
              const isNight = hour >= 18 || hour < 6;
              return (
                <div
                  key={item.dateTime}
                  className="darksky-card"
                  style={{ opacity: isNight ? 1 : 0.6 }}
                >
                  <div className="darksky-card__score-bar" style={{ background: color }} />
                  <div className="darksky-card__time">
                    <div className="darksky-card__time-main">
                      {dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                    <div className="darksky-card__time-sub">
                      {isNight ? '🌙' : '☀️'} {item.temp}°C
                    </div>
                  </div>
                  <div className="darksky-card__content">
                    <div className="darksky-card__row">
                      <span className={`darksky-card__score ${scoreClass(item.stargazingScore)}`}>
                        {item.stargazingScore}
                      </span>
                      <span className="darksky-card__verdict">
                        {scoreVerdict(item.stargazingScore)}
                      </span>
                    </div>
                    <div className="darksky-card__metrics">
                      <span className="darksky-metric">
                        <span className="darksky-metric__icon">☁️</span>
                        {item.cloudCoverPct}%
                        <span className="darksky-metric__label">cloud</span>
                      </span>
                      <span className="darksky-metric">
                        <span className="darksky-metric__icon">👁</span>
                        {item.seeingLabel.split('(')[0]?.trim()}
                      </span>
                      <span className="darksky-metric">
                        <span className="darksky-metric__icon">✨</span>
                        {item.transparencyLabel.split('(')[0]?.trim()}
                      </span>
                      <span className="darksky-metric">
                        <span className="darksky-metric__icon">💨</span>
                        {item.windLabel} {item.windDirection}
                      </span>
                      {item.humidityPct > 80 && (
                        <span className="darksky-metric" style={{ borderColor: 'rgba(255,167,38,0.2)' }}>
                          <span className="darksky-metric__icon">💧</span>
                          {Math.round(item.humidityPct)}%
                          <span className="darksky-metric__label">humid</span>
                        </span>
                      )}
                      {item.precipType !== 'none' && (
                        <span className="darksky-metric" style={{ borderColor: 'rgba(239,83,80,0.2)' }}>
                          <span className="darksky-metric__icon">🌧</span>
                          {item.precipType}
                        </span>
                      )}
                    </div>
                    <div className="darksky-score-gauge">
                      <div
                        className="darksky-score-gauge__fill"
                        style={{
                          width: `${item.stargazingScore}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}66)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Attribution */}
      {!loading && forecast && (
        <div className="darksky-info">
          Data from <a href="https://www.7timer.info/" target="_blank" rel="noopener noreferrer">7Timer!</a>
          {' · '}Forecast init: {new Date(forecast.initTime).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
          })} UTC
        </div>
      )}
    </div>
  );
}
