/**
 * SatellitePasses — Upcoming bright satellite passes for the selected location.
 *
 * Displays a compact list of the next visible passes (ISS, Hubble, Tiangong, etc.)
 * with time, direction, max elevation, brightness, and duration.
 */
import { useEffect, useState } from 'react';
import { fetchSatellitePasses } from '../services/satelliteClient';
import type { SatellitePass } from '../types/darksky';
import './SatellitePasses.css';

interface SatellitePassesProps {
  lat: number;
  lon: number;
}

/** Direction arrow from compass degrees. */
function dirArrow(deg: number): string {
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  return arrows[Math.round(deg / 45) % 8];
}

/** Brightness label from visual magnitude. */
function brightnessLabel(mag: number): string {
  if (mag <= -3) return 'Very Bright';
  if (mag <= -1) return 'Bright';
  if (mag <= 1) return 'Visible';
  return 'Faint';
}

/** Returns true if a pass is worth showing (not too faint to see easily). */
function isVisible(mag: number): boolean {
  return mag <= 1;
}

/** Short satellite name. */
function shortName(name: string): string {
  return name
    .replace(/\s*\(.*\)/, '')  // strip parenthetical
    .replace('SPACE STATION', 'ISS')
    .trim();
}

export default function SatellitePasses({ lat, lon }: SatellitePassesProps) {
  const [passes, setPasses] = useState<SatellitePass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSatellitePasses(lat, lon)
      .then((data) => {
        if (!cancelled) {
          setPasses(data.passes);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load passes');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [lat, lon]);

  if (loading) {
    return (
      <div className="sat-section">
        <div className="sat-header">🛰️ Satellite Passes</div>
        <div className="sat-loading">Loading passes…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sat-section">
        <div className="sat-header">🛰️ Satellite Passes</div>
        <div className="sat-empty">Unable to load satellite data</div>
      </div>
    );
  }

  const visiblePasses = passes.filter((p) => isVisible(p.mag));

  if (visiblePasses.length === 0) {
    return (
      <div className="sat-section">
        <div className="sat-header">🛰️ Satellite Passes</div>
        <div className="sat-empty">No visible passes in the next 5 days</div>
      </div>
    );
  }

  return (
    <div className="sat-section">
      <div className="sat-header">🛰️ Visible Satellite Passes</div>

      <div className="sat-list">
        {visiblePasses.map((p, i) => {
          const startDate = new Date(p.startUTC * 1000);
          const mins = Math.round(p.duration / 60);
          const secs = p.duration % 60;
          return (
            <div key={`${p.satId}-${p.startUTC}-${i}`} className="sat-pass">
              <div className="sat-pass__name">{shortName(p.satName)}</div>
              <div className="sat-pass__date">
                {startDate.toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric',
                })}
              </div>
              <div className="sat-pass__time">
                {startDate.toLocaleTimeString(undefined, {
                  hour: '2-digit', minute: '2-digit', hour12: false,
                })}
              </div>
              <div className="sat-pass__dir">
                {dirArrow(p.startAzCompass)} {p.startAz} → {p.endAz}
              </div>
              <div className="sat-pass__el">{p.maxEl}°</div>
              <div className="sat-pass__dur">
                {mins > 0 ? `${mins}m` : ''}{secs > 0 ? `${secs}s` : ''}
              </div>
              <div className={`sat-pass__mag ${p.mag <= -1 ? 'sat-pass__mag--bright' : ''}`}>
                {brightnessLabel(p.mag)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sat-footer">
        Data from <a href="https://www.n2yo.com/" target="_blank" rel="noopener noreferrer">N2YO</a>
        {' · '}Times in browser timezone
      </div>
    </div>
  );
}
