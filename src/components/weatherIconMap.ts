export interface WeatherIconPresentation {
  className: string;
  color: string;
}

export interface MetricIconPresentation {
  className: string;
  color: string;
}

export interface MoonIconPresentation {
  className: string;
  color: string;
}

export function getWeatherIconPresentation(icon: string): WeatherIconPresentation {
  const normalized = icon.toLowerCase();

  if (normalized.includes('snow') || normalized.includes('sleet') || normalized.includes('ice')) {
    return { className: 'wi-snow', color: '#e0e0e0' };
  }

  if (normalized.includes('thunder') || normalized.includes('storm')) {
    return { className: 'wi-thunderstorm', color: '#b39ddb' };
  }

  if (normalized.includes('fog') || normalized.includes('mist') || normalized.includes('haze')) {
    return { className: 'wi-fog', color: '#b0bec5' };
  }

  if (normalized.includes('rain') || normalized.includes('shower') || normalized.includes('drizzle')) {
    return { className: 'wi-rain', color: '#64b5f6' };
  }

  if (normalized.includes('cloud') && !normalized.includes('partly')) {
    return { className: 'wi-cloudy', color: '#90a4ae' };
  }

  if (normalized.includes('partly')) {
    return { className: 'wi-day-cloudy', color: '#90caf9' };
  }

  if (normalized.includes('clear') || normalized.includes('sun')) {
    return { className: 'wi-day-sunny', color: '#ffd54f' };
  }

  if (normalized.startsWith('wi-')) {
    return { className: normalized, color: '#90caf9' };
  }

  switch (normalized) {
    case 'clear':
      return { className: 'wi-day-sunny', color: '#ffd54f' };
    case 'partly-cloudy':
      return { className: 'wi-day-cloudy', color: '#90caf9' };
    case 'cloudy':
      return { className: 'wi-cloudy', color: '#90a4ae' };
    case 'rain':
      return { className: 'wi-rain', color: '#64b5f6' };
    case 'snow':
      return { className: 'wi-snow', color: '#e0e0e0' };
    default:
      return { className: 'wi-day-cloudy', color: '#90caf9' };
  }
}

export function getMetricIconPresentation(icon: string, fallbackColor: string): MetricIconPresentation {
  switch (icon.toLowerCase()) {
    case 'humidity':
      return { className: 'wi-humidity', color: fallbackColor };
    case 'uv':
      return { className: 'wi-hot', color: fallbackColor };
    case 'pressure-rising':
      return { className: 'wi-direction-up', color: fallbackColor };
    case 'pressure-falling':
      return { className: 'wi-direction-down', color: fallbackColor };
    case 'pressure-steady':
      return { className: 'wi-direction-right', color: fallbackColor };
    case 'precip':
      return { className: 'wi-raindrop', color: fallbackColor };
    case 'wind':
      return { className: 'wi-strong-wind', color: fallbackColor };
    case 'dewpoint':
      return { className: 'wi-raindrops', color: fallbackColor };
    case 'sunrise':
      return { className: 'wi-sunrise', color: fallbackColor };
    case 'sunset':
      return { className: 'wi-sunset', color: fallbackColor };
    case 'feelslike':
      return { className: 'wi-thermometer', color: fallbackColor };
    default:
      return { className: 'wi-na', color: fallbackColor };
  }
}

export function getMoonPhaseIconPresentation(phase: string, fallbackColor = '#e0e0e0'): MoonIconPresentation {
  const normalized = phase.toLowerCase();

  if (normalized.includes('new')) {
    return { className: 'wi-moon-new', color: fallbackColor };
  }

  if (normalized.includes('first quarter')) {
    return { className: 'wi-moon-first-quarter', color: fallbackColor };
  }

  if (normalized.includes('third quarter') || normalized.includes('last quarter')) {
    return { className: 'wi-moon-third-quarter', color: fallbackColor };
  }

  if (normalized.includes('full')) {
    return { className: 'wi-moon-full', color: fallbackColor };
  }

  if (normalized.includes('waxing') && normalized.includes('crescent')) {
    return { className: 'wi-moon-waxing-crescent-3', color: fallbackColor };
  }

  if (normalized.includes('waxing') && normalized.includes('gibbous')) {
    return { className: 'wi-moon-waxing-gibbous-3', color: fallbackColor };
  }

  if (normalized.includes('waning') && normalized.includes('gibbous')) {
    return { className: 'wi-moon-waning-gibbous-3', color: fallbackColor };
  }

  if (normalized.includes('waning') && normalized.includes('crescent')) {
    return { className: 'wi-moon-waning-crescent-3', color: fallbackColor };
  }

  return { className: 'wi-moon-alt-full', color: fallbackColor };
}