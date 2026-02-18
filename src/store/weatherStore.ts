/**
 * Zustand store for weather dashboard state.
 * Currently uses mock data for prototyping.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  TemperatureGaugeData,
  WeatherMetric,
  HourlyForecastItem,
  DailyForecastItem,
  ConditionsCardData,
} from '../types';

export type WeatherProvider = 'ec' | 'twn';

export interface WeatherSnapshot {
  location: string;
  temperature: TemperatureGaugeData;
  metrics: WeatherMetric[];
  conditions: ConditionsCardData;
  hourlyForecast: HourlyForecastItem[];
  dailyForecast: DailyForecastItem[];
}

interface WeatherState {
  /** Active provider */
  provider: WeatherProvider;
  /** Selected latitude */
  lat: number;
  /** Selected longitude */
  lon: number;
  /** Network loading state */
  isLoading: boolean;
  /** Last fetch error */
  error: string | null;
  /** Location name */
  location: string;
  /** Main temperature gauge data */
  temperature: TemperatureGaugeData;
  /** Secondary weather metrics */
  metrics: WeatherMetric[];
  /** Conditions card data */
  conditions: ConditionsCardData;
  /** Hourly forecast items */
  hourlyForecast: HourlyForecastItem[];
  /** Daily forecast items */
  dailyForecast: DailyForecastItem[];
  /** Set provider */
  setProvider: (provider: WeatherProvider) => void;
  /** Set location label */
  setLocation: (location: string) => void;
  /** Set selected coordinates */
  setCoords: (lat: number, lon: number) => void;
  /** Replace weather snapshot */
  setWeatherSnapshot: (snapshot: WeatherSnapshot) => void;
  /** Set loading state */
  setLoading: (isLoading: boolean) => void;
  /** Set error state */
  setError: (error: string | null) => void;
}

/** Mock data for prototyping the dashboard UI */
export const useWeatherStore = create<WeatherState>()(
  persist(
    (set) => ({
  provider: 'ec',
  lat: 43.6532,
  lon: -79.3832,
  isLoading: false,
  error: null,
  location: 'Toronto, ON',

  temperature: {
    current: 78,
    feelsLike: 70,
    low: 65,
    high: 88,
    min: 53,
    max: 100,
    unit: 'C',
  },

  metrics: [
    { id: 'humidity', label: 'Humidity', value: 65, unitLabel: '%', icon: 'humidity', color: '#4fc3f7' },
    { id: 'uv', label: 'UV Index', value: 6, unitLabel: '', icon: 'uv', color: '#ffb74d' },
    { id: 'precip', label: 'Precip', value: 30, unitLabel: '%', icon: 'precip', color: '#90caf9' },
    { id: 'wind', label: 'Wind', value: 12, unitLabel: 'mph', icon: 'wind', color: '#80cbc4' },
  ],

  conditions: {
    condition: 'Partly Cloudy',
    conditionIcon: 'partly-cloudy',
    windSpeed: 12,
    windDirection: 'NW',
    windUnit: 'mph',
    humidity: 65,
    uvIndex: 6,
    precipChance: 30,
    feelsLike: 70,
    tempUnit: 'F',
    sunrise: '6:42 AM',
    sunset: '8:15 PM',
    moonPhase: 'Waxing Crescent',
    moonIllumination: 34,
    sourceUpdatedAt: 'Aug 27, 3:12 PM',
  },

  hourlyForecast: [
    { time: '12PM', temp: 76, icon: 'partly-cloudy', precipChance: 20 },
    { time: '1PM', temp: 77, icon: 'partly-cloudy', precipChance: 30 },
    { time: '2PM', temp: 78, icon: 'cloudy', precipChance: 30 },
    { time: '3PM', temp: 78, icon: 'cloudy', precipChance: 47 },
    { time: '4PM', temp: 76, icon: 'rain', precipChance: 72 },
    { time: '5PM', temp: 74, icon: 'rain', precipChance: 99 },
    { time: '6PM', temp: 72, icon: 'partly-cloudy', precipChance: 40 },
    { time: '7PM', temp: 70, icon: 'clear', precipChance: 10 },
    { time: '8PM', temp: 68, icon: 'clear', precipChance: 5 },
    { time: '9PM', temp: 66, icon: 'clear', precipChance: 3 },
    { time: '10PM', temp: 65, icon: 'clear', precipChance: 2 },
    { time: '11PM', temp: 64, icon: 'clear', precipChance: 2 },
    { time: '12AM', temp: 63, icon: 'clear', precipChance: 1 },
    { time: '1AM', temp: 62, icon: 'clear', precipChance: 1 },
    { time: '2AM', temp: 61, icon: 'clear', precipChance: 1 },
    { time: '3AM', temp: 60, icon: 'clear', precipChance: 2 },
    { time: '4AM', temp: 59, icon: 'clear', precipChance: 5 },
    { time: '5AM', temp: 58, icon: 'clear', precipChance: 8 },
    { time: '6AM', temp: 59, icon: 'partly-cloudy', precipChance: 12 },
    { time: '7AM', temp: 61, icon: 'partly-cloudy', precipChance: 15 },
    { time: '8AM', temp: 64, icon: 'partly-cloudy', precipChance: 18 },
    { time: '9AM', temp: 67, icon: 'partly-cloudy', precipChance: 20 },
    { time: '10AM', temp: 71, icon: 'cloudy', precipChance: 25 },
    { time: '11AM', temp: 74, icon: 'cloudy', precipChance: 30 },
  ],

  dailyForecast: [
    {
      day: 'Mon',
      high: 88,
      low: 65,
      icon: 'partly-cloudy',
      daySummary: 'A mix of sun and cloud with a warmer afternoon and light west wind.',
      nightSummary: 'Partly cloudy overnight. Mild evening before cooling toward dawn.',
    },
    {
      day: 'Tue',
      high: 85,
      low: 62,
      icon: 'rain',
      daySummary: 'Clouds build early with scattered showers developing through the afternoon.',
      nightSummary: 'Periods of rain taper to patchy drizzle late. Breezy at times.',
    },
    {
      day: 'Wed',
      high: 79,
      low: 58,
      icon: 'cloudy',
      daySummary: 'Mostly cloudy and cooler with occasional breaks in the cloud deck.',
      nightSummary: 'Overcast through much of the night with a slight chance of a brief shower.',
    },
    {
      day: 'Thu',
      high: 82,
      low: 60,
      icon: 'partly-cloudy',
      daySummary: 'Partly cloudy skies with improving conditions by midday.',
      nightSummary: 'Clearer in the evening, then some high cloud drifting in overnight.',
    },
    {
      day: 'Fri',
      high: 90,
      low: 68,
      icon: 'clear',
      daySummary: 'Hot and mainly sunny with dry air and low precipitation risk.',
      nightSummary: 'Clear and warm in the evening; comfortable late night temperatures.',
    },
    {
      day: 'Sat',
      high: 92,
      low: 70,
      icon: 'clear',
      daySummary: 'Peak heat of the week under mostly clear skies and light wind.',
      nightSummary: 'Mostly clear and muggy overnight with little cloud cover.',
    },
    {
      day: 'Sun',
      high: 87,
      low: 66,
      icon: 'partly-cloudy',
      daySummary: 'Warm with filtered sun and a slight chance of a late isolated shower.',
      nightSummary: 'Partly cloudy with a gentle cooldown through the night.',
    },
  ],

  setProvider: (provider) => set({ provider }),

  setLocation: (location) => set({ location }),

  setCoords: (lat, lon) => set({ lat, lon }),

  setWeatherSnapshot: (snapshot) =>
    set({
      temperature: snapshot.temperature,
      metrics: snapshot.metrics,
      conditions: snapshot.conditions,
      hourlyForecast: snapshot.hourlyForecast,
      dailyForecast: snapshot.dailyForecast,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
    }),
    {
      name: 'liivsky-weather-location',
      partialize: (state) => ({
        provider: state.provider,
        lat: state.lat,
        lon: state.lon,
        location: state.location,
      }),
    },
  ),
);
