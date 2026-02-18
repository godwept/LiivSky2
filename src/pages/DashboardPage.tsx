/**
 * DashboardPage — Main home screen composing all dashboard widgets.
 * Layout: hero gauge → badge stacks flanking conditions card → forecasts.
 */
import { useWeatherStore } from '../store/weatherStore';
import { useDashboardWeather } from '../hooks/useDashboardWeather';
import TemperatureGauge from '../components/TemperatureGauge';
import ConditionsCard from '../components/ConditionsCard';
import MetricBadge from '../components/MetricBadge';
import HourlyForecast from '../components/HourlyForecast';
import DailyForecast from '../components/DailyForecast';
import LocationPicker from '../components/LocationPicker';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GeocodeResult } from '../services/weatherClient';
import './DashboardPage.css';

const providerLabels = {
  ec: 'EC',
  twn: 'TWN',
} as const;

const providerOptions: Array<{ value: 'ec' | 'twn'; label: string }> = [
  { value: 'ec', label: 'Environment Canada' },
  { value: 'twn', label: 'Weather Network' },
];

const CANADIAN_PROVINCES = [
  'alberta',
  'british columbia',
  'manitoba',
  'new brunswick',
  'newfoundland and labrador',
  'nova scotia',
  'ontario',
  'prince edward island',
  'quebec',
  'saskatchewan',
  'northwest territories',
  'nunavut',
  'yukon',
  'ab',
  'bc',
  'mb',
  'nb',
  'nl',
  'ns',
  'on',
  'pe',
  'qc',
  'sk',
  'nt',
  'nu',
  'yt',
];

const LOCATION_EXCLUDE = [
  'county',
  'district',
  'region',
  'regional municipality',
  'country',
  'canada',
  'province',
  'postal',
  'township',
  'ward',
  'parish',
];

const STREET_HINTS = [
  'street',
  'st',
  'road',
  'rd',
  'avenue',
  'ave',
  'lane',
  'ln',
  'drive',
  'dr',
  'boulevard',
  'blvd',
  'highway',
  'hwy',
  'route',
  'trail',
  'court',
  'crescent',
];

function normalizeSegment(segment: string): string {
  return segment.trim().replace(/\s+/g, ' ');
}

function sanitizeProvince(segment: string): string {
  return normalizeSegment(segment.split('/')[0] ?? segment);
}

function isProvinceSegment(segment: string): boolean {
  const normalized = normalizeSegment(segment).toLowerCase();
  return CANADIAN_PROVINCES.some((entry) => normalized === entry || normalized.includes(entry));
}

function isLikelyStreet(segment: string): boolean {
  const normalized = normalizeSegment(segment).toLowerCase();
  if (/\d/.test(normalized)) {
    return true;
  }

  return STREET_HINTS.some((hint) => new RegExp(`\\b${hint}\\b`, 'i').test(normalized));
}

function isExcludedSegment(segment: string): boolean {
  const normalized = normalizeSegment(segment).toLowerCase();
  return LOCATION_EXCLUDE.some((entry) => normalized.includes(entry));
}

function cityFromSegment(segment: string): string {
  const normalized = normalizeSegment(segment);
  const cityOfMatch = normalized.match(/^city of\s+(.+)$/i);
  if (cityOfMatch?.[1]) {
    return normalizeSegment(cityOfMatch[1]);
  }

  return normalized;
}

function formatLocationLabel(raw: string): string {
  const value = raw.trim();
  if (!value) {
    return raw;
  }

  const segments = value
    .split(',')
    .map((segment) => normalizeSegment(segment))
    .filter(Boolean);

  if (segments.length <= 2) {
    return value;
  }

  const provinceSegment = segments.find((segment) => isProvinceSegment(segment));
  const province = provinceSegment ? sanitizeProvince(provinceSegment) : '';

  const cityCandidate =
    segments.find((segment) => /^city of\s+/i.test(segment)) ??
    segments.find((segment) => !isLikelyStreet(segment) && !isExcludedSegment(segment) && !isProvinceSegment(segment));

  const city = cityCandidate ? cityFromSegment(cityCandidate) : segments[0];

  if (city && province) {
    return `${city}, ${province}`;
  }

  return city || value;
}

function formatSelectedLocation(selection: GeocodeResult): string {
  if (selection.region?.trim()) {
    const city = formatLocationLabel(selection.name).split(',')[0]?.trim() || selection.name.trim();
    return `${city}, ${selection.region.trim()}`;
  }

  return formatLocationLabel(selection.name);
}

export default function DashboardPage() {
  useDashboardWeather();
  const [isLocationPickerOpen, setLocationPickerOpen] = useState(false);
  const [isSourceMenuOpen, setSourceMenuOpen] = useState(false);
  const sourceMenuRef = useRef<HTMLDivElement | null>(null);

  const {
    provider,
    location,
    temperature,
    metrics,
    conditions,
    hourlyForecast,
    dailyForecast,
    isLoading,
    error,
    lat,
    lon,
    setProvider,
    setCoords,
    setLocation,
  } =
    useWeatherStore();

  useEffect(() => {
    if (!isSourceMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!sourceMenuRef.current?.contains(target)) {
        setSourceMenuOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setSourceMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isSourceMenuOpen]);

  const overallMin = Math.min(...dailyForecast.map((d) => d.low));
  const overallMax = Math.max(...dailyForecast.map((d) => d.high));

  const humidity = metrics.find((m) => m.id === 'humidity');
  const pressure = metrics.find((m) => m.id === 'pressure') ?? metrics.find((m) => m.id === 'uv');
  const precip = metrics.find((m) => m.id === 'precip');
  const locationLabel = useMemo(() => formatLocationLabel(location), [location]);

  /** Build sparkline data from hourly forecast */
  const tempCurve = hourlyForecast.map((h) => ({ label: h.time, value: h.temp }));
  const precipCurve = hourlyForecast.map((h) => ({ label: h.time, value: h.precipChance }));

  const handleLocationConfirm = (selection: GeocodeResult): void => {
    setCoords(selection.lat, selection.lon);
    setLocation(formatSelectedLocation(selection));
    setLocationPickerOpen(false);
  };

  return (
    <>
      <main className="dashboard">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-location">{locationLabel}</h1>
            {isLoading && <p className="dashboard-status">Updating weather…</p>}
            {error && !isLoading && <p className="dashboard-error">Live data unavailable. Showing latest data.</p>}
          </div>
          <div className="header-actions">
            <div className="source-switch" ref={sourceMenuRef}>
              <button
                className="source-chip"
                aria-label="Change weather source"
                aria-expanded={isSourceMenuOpen}
                type="button"
                onClick={() => setSourceMenuOpen((open) => !open)}
              >
                <span className="source-chip-label">Source</span>
                <span className="source-chip-value">{providerLabels[provider]}</span>
                <span className={`source-chip-caret ${isSourceMenuOpen ? 'source-chip-caret--open' : ''}`} aria-hidden>▾</span>
              </button>

              {isSourceMenuOpen && (
                <div className="source-menu" role="menu" aria-label="Weather source options">
                  {providerOptions.map((option) => {
                    const isSelected = option.value === provider;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isSelected}
                        className={`source-menu-item ${isSelected ? 'source-menu-item--selected' : ''}`}
                        onClick={() => {
                          if (!isSelected) {
                            setProvider(option.value);
                          }
                          setSourceMenuOpen(false);
                        }}
                      >
                        <span>{option.label}</span>
                        {isSelected && <span aria-hidden>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              className="location-map-btn"
              aria-label="Open location picker"
              type="button"
              onClick={() => setLocationPickerOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </button>
          </div>
        </header>

        {/* Hero temperature gauge */}
        <section className="gauge-section" aria-label="Current temperature">
          <TemperatureGauge data={temperature} />
        </section>

        {/* Metrics row: stacked badges flanking conditions card */}
        <section className="metrics-row" aria-label="Current conditions">
          <div className="badge-stack">
            {humidity && <MetricBadge metric={humidity} />}
            {pressure && <MetricBadge metric={pressure} />}
          </div>
          <ConditionsCard data={conditions} tempCurve={tempCurve} precipCurve={precipCurve} />
          <div className="badge-stack">
            {precip && <MetricBadge metric={precip} />}
            <MetricBadge metric={{
              id: 'feelslike',
              label: 'Feels Like',
              value: temperature.feelsLike,
              unitLabel: `°${temperature.unit}`,
              icon: 'dewpoint',
              color: '#ce93d8',
            }} />
          </div>
        </section>

        {/* Hourly forecast */}
        <section aria-label="Hourly forecast">
          <HourlyForecast items={hourlyForecast} unit={temperature.unit} />
        </section>

        {/* Daily forecast */}
        <section aria-label="Daily forecast">
          <DailyForecast
            items={dailyForecast}
            unit={temperature.unit}
            overallMin={overallMin}
            overallMax={overallMax}
          />
        </section>

        <div className="nav-spacer" />
      </main>

      <LocationPicker
        isOpen={isLocationPickerOpen}
        initialLat={lat}
        initialLon={lon}
        onClose={() => setLocationPickerOpen(false)}
        onConfirm={handleLocationConfirm}
      />
    </>
  );
}
