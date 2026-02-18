import type { HomeWeatherResponse, TemperatureUnit } from '../types';

export interface HomeWeatherRequest {
  lat: number;
  lon: number;
  unit: TemperatureUnit;
}

export interface WeatherProviderAdapter {
  getHomeWeather: (request: HomeWeatherRequest) => Promise<HomeWeatherResponse>;
}
