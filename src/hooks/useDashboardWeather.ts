import { useEffect, useRef } from 'react';
import { fetchHomeWeather, mapHomeResponseToSnapshot } from '../services/weatherClient';
import { useWeatherStore } from '../store/weatherStore';

export function useDashboardWeather(): void {
  const lat = useWeatherStore((state) => state.lat);
  const lon = useWeatherStore((state) => state.lon);
  const provider = useWeatherStore((state) => state.provider);
  const lastRequestKeyRef = useRef<string>('');

  useEffect(() => {
    let cancelled = false;
    const requestKey = `${provider}:${lat.toFixed(4)}:${lon.toFixed(4)}`;

    if (lastRequestKeyRef.current === requestKey) {
      return;
    }

    lastRequestKeyRef.current = requestKey;
    const { setLoading, setError, setWeatherSnapshot } = useWeatherStore.getState();

    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchHomeWeather({
          lat,
          lon,
          provider,
          unit: 'C',
        });

        if (cancelled) {
          return;
        }

        const snapshot = mapHomeResponseToSnapshot(response);
        setWeatherSnapshot(snapshot);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load live weather data.';
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [lat, lon, provider]);
}
