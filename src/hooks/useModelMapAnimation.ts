/**
 * useModelMapAnimation — manages playback state for NWP model WMS forecast layers.
 *
 * Similar to useWmsAnimation but specialized for model forecast stepping:
 *   - Fetches the TIME dimension from EC GeoMet GetCapabilities
 *   - Exposes play/pause/seek controls for cycling through forecast hours
 *   - Provides the current WMS TIME string for the overlay
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchTimeDimension } from '../services/geometTime';

/** Maximum forecast frames to animate (hourly steps) */
const MAX_FRAMES = 48;

export interface ModelMapAnimState {
  /** Whether animation is currently playing */
  playing: boolean;
  /** Current frame index */
  frameIndex: number;
  /** Total number of frames */
  totalFrames: number;
  /** Current WMS TIME value (ISO 8601) */
  currentTime: string;
  /** All available TIME values for pre-caching */
  allTimes: string[];
  /** Human-readable label for the current frame */
  timeLabel: string;
  /** Whether time metadata is loading */
  loading: boolean;
  /** Error message if time fetch fails */
  error: string | null;
}

export interface ModelMapAnimControls {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (idx: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
}

/**
 * Hook to manage model map forecast animation.
 *
 * @param wmsLayerName  The EC GeoMet WMS layer name (e.g. `HRDPS.CONTINENTAL_TT`)
 * @param frameIntervalMs  Delay between frames during playback
 */
export function useModelMapAnimation(
  wmsLayerName: string | null,
  frameIntervalMs = 500,
): [ModelMapAnimState, ModelMapAnimControls] {
  const [times, setTimes] = useState<string[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchRef = useRef(0);

  /* ---- Fetch time dimension when layer changes ---- */
  useEffect(() => {
    if (!wmsLayerName) {
      setTimes([]);
      setFrameIndex(0);
      setPlaying(false);
      setError(null);
      return;
    }

    const fetchId = ++fetchRef.current;
    setLoading(true);
    setError(null);
    setPlaying(false);

    fetchTimeDimension(wmsLayerName)
      .then((td) => {
        if (fetchId !== fetchRef.current) return;
        // Take up to MAX_FRAMES evenly spaced from the full list
        const full = td.times;
        let sampled: string[];
        if (full.length <= MAX_FRAMES) {
          sampled = full;
        } else {
          const step = Math.ceil(full.length / MAX_FRAMES);
          sampled = full.filter((_, i) => i % step === 0);
        }
        setTimes(sampled);
        setFrameIndex(0);
        setLoading(false);
      })
      .catch((err) => {
        if (fetchId !== fetchRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load time data');
        setTimes([]);
        setLoading(false);
      });
  }, [wmsLayerName]);

  /* ---- Playback timer ---- */
  const totalFrames = times.length;

  useEffect(() => {
    if (playing && totalFrames > 1) {
      intervalRef.current = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % totalFrames);
      }, frameIntervalMs);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, totalFrames, frameIntervalMs]);

  /* ---- Derived values ---- */
  const currentTime = times[frameIndex] ?? '';

  const timeLabel = useMemo(() => {
    if (!currentTime) return '';
    try {
      const d = new Date(currentTime);
      return d.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return currentTime;
    }
  }, [currentTime]);

  /* ---- Controls ---- */
  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const seek = useCallback(
    (idx: number) => setFrameIndex(Math.max(0, Math.min(idx, totalFrames - 1))),
    [totalFrames],
  );
  const stepForward = useCallback(() => {
    setFrameIndex((prev) => (prev + 1) % Math.max(totalFrames, 1));
  }, [totalFrames]);
  const stepBackward = useCallback(() => {
    setFrameIndex((prev) => (prev - 1 + Math.max(totalFrames, 1)) % Math.max(totalFrames, 1));
  }, [totalFrames]);

  const state: ModelMapAnimState = {
    playing,
    frameIndex,
    totalFrames,
    currentTime,
    allTimes: times,
    timeLabel,
    loading,
    error,
  };

  const controls: ModelMapAnimControls = {
    play,
    pause,
    toggle,
    seek,
    stepForward,
    stepBackward,
  };

  return [state, controls];
}
