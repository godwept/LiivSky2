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
import DarkSkyHero from '../components/DarkSkyHero';
import DarkSkyChart from '../components/DarkSkyChart';
import SatellitePasses from '../components/SatellitePasses';
import './DarkSkyPage.css';

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

  return (
    <div className="darksky-page">
      {/* Loading */}
      {loading && (
        <div className="darksky-loading">
          <div className="models-spinner" />
          Loading dark sky forecast…
        </div>
      )}

      {/* Error */}
      {error && <div className="darksky-error">{error}</div>}

      {/* Tonight hero — Sky Dial */}
      {!loading && tonight && <DarkSkyHero tonight={tonight} location={location} />}

      {/* Interactive forecast chart */}
      {!loading && forecast && <DarkSkyChart items={forecast.items} />}

      {/* Upcoming visible satellite passes */}
      {!loading && <SatellitePasses lat={lat} lon={lon} />}

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
