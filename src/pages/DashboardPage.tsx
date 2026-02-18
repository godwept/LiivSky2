/**
 * DashboardPage — Main home screen composing all dashboard widgets.
 * Layout: hero gauge → badge stacks flanking conditions card → forecasts.
 */
import { useWeatherStore } from '../store/weatherStore';
import TemperatureGauge from '../components/TemperatureGauge';
import ConditionsCard from '../components/ConditionsCard';
import MetricBadge from '../components/MetricBadge';
import HourlyForecast from '../components/HourlyForecast';
import DailyForecast from '../components/DailyForecast';
import './DashboardPage.css';

export default function DashboardPage() {
  const { location, temperature, metrics, conditions, hourlyForecast, dailyForecast } =
    useWeatherStore();

  const overallMin = Math.min(...dailyForecast.map((d) => d.low));
  const overallMax = Math.max(...dailyForecast.map((d) => d.high));

  const humidity = metrics.find((m) => m.id === 'humidity');
  const uv = metrics.find((m) => m.id === 'uv');
  const precip = metrics.find((m) => m.id === 'precip');

  /** Build sparkline data from hourly forecast */
  const tempCurve = hourlyForecast.map((h) => ({ label: h.time, value: h.temp }));
  const precipCurve = hourlyForecast.map((h) => ({ label: h.time, value: h.precipChance }));

  return (
    <main className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-location">{location}</h1>
        </div>
        <button className="location-map-btn" aria-label="Open location map">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </button>
      </header>

      {/* Hero temperature gauge */}
      <section className="gauge-section" aria-label="Current temperature">
        <TemperatureGauge data={temperature} />
      </section>

      {/* Metrics row: stacked badges flanking conditions card */}
      <section className="metrics-row" aria-label="Current conditions">
        <div className="badge-stack">
          {humidity && <MetricBadge metric={humidity} />}
          {uv && <MetricBadge metric={uv} />}
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
  );
}
