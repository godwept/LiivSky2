/**
 * HourlyForecast — Horizontally scrollable row of hourly weather data.
 */
import type { HourlyForecastItem } from '../types';
import { useEffect, useRef } from 'react';
import './HourlyForecast.css';

interface HourlyForecastProps {
  items: HourlyForecastItem[];
  unit: string;
}

/** Simple condition icon */
function ConditionDot({ icon }: { icon: string }) {
  const colorMap: Record<string, string> = {
    'clear': '#fdd835',
    'partly-cloudy': '#90caf9',
    'cloudy': '#78909c',
    'rain': '#42a5f5',
    'snow': '#e0e0e0',
  };
  const color = colorMap[icon] ?? '#90caf9';
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className="condition-dot">
      {icon === 'rain' ? (
        <>
          <circle cx="10" cy="8" r="6" fill={color} opacity="0.7" />
          <line x1="8" y1="16" x2="7" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="16" x2="11" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : icon === 'cloudy' ? (
        <circle cx="10" cy="10" r="7" fill={color} opacity="0.6" />
      ) : icon === 'partly-cloudy' ? (
        <>
          <circle cx="8" cy="10" r="5" fill="#fdd835" opacity="0.6" />
          <circle cx="13" cy="10" r="6" fill={color} opacity="0.5" />
        </>
      ) : (
        <circle cx="10" cy="10" r="6" fill={color} />
      )}
    </svg>
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
          {items.map((item) => (
            <div className="hourly-item" key={item.time}>
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
