/**
 * HourlyForecast — Horizontally scrollable row of hourly weather data.
 */
import type { HourlyForecastItem } from '../types';
import { useEffect, useRef } from 'react';
import { getWeatherIconPresentation } from './weatherIconMap';
import './HourlyForecast.css';

interface HourlyForecastProps {
  items: HourlyForecastItem[];
  unit: string;
}

/** Simple condition icon */
function ConditionDot({ icon }: { icon: string }) {
  const { className, color } = getWeatherIconPresentation(icon);
  return (
    <span className="condition-dot" style={{ color }}>
      <i className={`wi ${className}`} aria-hidden />
    </span>
  );
}

export default function HourlyForecast({ items, unit }: HourlyForecastProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (container.scrollWidth <= container.clientWidth) return;

      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        container.scrollLeft += event.deltaY;
        return;
      }

      container.scrollLeft += event.deltaX;
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, []);

  return (
    <div className="hourly-section">
      <h3 className="hourly-title">Hourly Forecast</h3>
      <div className="hourly-carousel-viewport" ref={scrollRef}>
        <div className="hourly-track">
          {items.map((item, index) => (
            <div className="hourly-item" key={`${item.time}-${index}`}>
              <span className="hourly-time">{item.time}</span>
              <ConditionDot icon={item.icon} />
              <span className="hourly-temp">{item.temp}°{unit}</span>
              <span className="hourly-precip">{item.precipChance}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
