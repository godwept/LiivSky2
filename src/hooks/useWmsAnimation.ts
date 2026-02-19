/**
 * useWmsAnimation — manages playback state for time-enabled WMS layers.
 *
 * Fetches available timestamps from EC GeoMet GetCapabilities for each
 * active overlay, then exposes play/pause/seek controls + the current
 * frame timestamp per layer.
 *
 * Each WMS layer has its own time axis (radar = PT6M, satellite = PT10M),
 * but playback uses a single frame index that maps into each layer's array
 * independently (normalised to the same 0→1 progress so they stay in sync).
 *
 * HRRR uses a "forecast-layer" model: each frame is a different WMS layer
 * name rather than a different TIME param.  When `hrrrActive` is true the
 * hook inserts a static HRRR timeline (no fetch needed) and exposes it
 * under the virtual key `HRRR_TIMELINE_KEY`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchTimeDimension } from '../services/geometTime';
import {
  HRRR_FORECAST_LAYERS,
  hrrrLayerLabel,
} from '../services/ecGeometLayers';

/** Maximum number of animation frames to keep per layer.
 *  18 frames ≈ last 1 h 48 m for radar (PT6M) or 3 h for satellite (PT10M).
 *  Fewer frames = faster pre-cache = snappier playback start.
 */
const MAX_ANIMATION_FRAMES = 18;

/**
 * Virtual layer key used to store HRRR forecast timeline data
 * in `layerTimes` / `layerAllTimes`.
 */
export const HRRR_TIMELINE_KEY = '__hrrr__';

export interface AnimationState {
  /** Whether the animation is currently playing */
  playing: boolean;
  /** Current frame index (0-based, keyed to the primary timeline) */
  frameIndex: number;
  /** Total number of frames in the primary timeline */
  totalFrames: number;
  /** ISO timestamp for each active layer keyed by layer WMS name */
  layerTimes: Record<string, string>;
  /** Human-readable label for the current frame */
  timeLabel: string;
  /** Whether we're currently loading time metadata */
  loading: boolean;
  /** All timestamps per layer (keyed by WMS layer name) for pre-caching */
  layerAllTimes: Record<string, string[]>;
}

export interface AnimationControls {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (frameIndex: number) => void;
  /** Advance to the next frame (wraps around) */
  stepForward: () => void;
  /** Go back one frame (wraps around) */
  stepBackward: () => void;
  /** Re-fetch latest available timestamps */
  refresh: () => void;
}

interface LayerTimeline {
  wmsLayer: string;
  times: string[];
}

/**
 * Given a list of active WMS layer names, fetch their time dimensions
 * and return animation state + controls.
 *
 * The "primary" layer is the first one — its frame count defines the
 * scrubber length. Other layers are mapped proportionally.
 *
 * @param activeLayerNames  EC GeoMet layer names to fetch time dims for
 * @param hrrrActive        Whether the HRRR overlay is toggled on
 * @param frameIntervalMs   Delay between frames during playback
 */
export function useWmsAnimation(
  activeLayerNames: string[],
  hrrrActive = false,
  frameIntervalMs = 400,
): [AnimationState, AnimationControls] {
  const [timelines, setTimelines] = useState<LayerTimeline[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- Fetch time metadata when active layers change ---- */
  const fetchRef = useRef(0);
  const fetchTimelines = useCallback(async () => {
    const nothing = activeLayerNames.length === 0 && !hrrrActive;
    if (nothing) {
      setTimelines([]);
      setFrameIndex(0);
      setPlaying(false);
      return;
    }

    const fetchId = ++fetchRef.current;
    setLoading(true);

    try {
      /* Fetch EC GeoMet time dimensions (async) */
      const ecResults = await Promise.all(
        activeLayerNames.map(async (name) => {
          const td = await fetchTimeDimension(name);
          return { wmsLayer: name, times: td.times.slice(-MAX_ANIMATION_FRAMES) };
        }),
      );

      // Only apply if this is still the latest fetch
      if (fetchId !== fetchRef.current) return;

      /* Build HRRR static timeline (no fetch needed) */
      const hrrrTimeline: LayerTimeline | null = hrrrActive
        ? { wmsLayer: HRRR_TIMELINE_KEY, times: [...HRRR_FORECAST_LAYERS] }
        : null;

      /* Combine: EC first (primary when present), HRRR last */
      const combined = hrrrTimeline
        ? [...ecResults, hrrrTimeline]
        : ecResults;

      setTimelines(combined);

      /* Choose initial frame:
       *  • HRRR-only  → frame 0 (+0 h, the analysis)
       *  • EC primary → last frame (most recent observation) */
      const primary = combined[0];
      if (primary) {
        const hrrrIsPrimary = primary.wmsLayer === HRRR_TIMELINE_KEY;
        setFrameIndex(hrrrIsPrimary ? 0 : primary.times.length - 1);
      }
    } catch (err) {
      console.error('[useWmsAnimation] Failed to fetch timelines', err);
    } finally {
      if (fetchId === fetchRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayerNames.join(','), hrrrActive]);

  useEffect(() => {
    fetchTimelines();
    // Stop playback when layers change
    setPlaying(false);
  }, [fetchTimelines]);

  /* ---- Playback timer ---- */
  const totalFrames = timelines[0]?.times.length ?? 0;

  useEffect(() => {
    if (playing && totalFrames > 0) {
      intervalRef.current = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % totalFrames);
      }, frameIntervalMs);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, totalFrames, frameIntervalMs]);

  /* ---- Compute current time for each layer ---- */
  const layerTimes: Record<string, string> = {};
  for (const tl of timelines) {
    if (tl.times.length === 0) continue;
    if (totalFrames <= 1) {
      layerTimes[tl.wmsLayer] = tl.times[tl.times.length - 1]!;
    } else {
      // Map primary frame index proportionally onto this layer's timeline
      const progress = frameIndex / (totalFrames - 1);
      const idx = Math.round(progress * (tl.times.length - 1));
      layerTimes[tl.wmsLayer] = tl.times[idx]!;
    }
  }

  /* ---- All timestamps per layer (for pre-caching) ---- */
  const layerAllTimes = useMemo<Record<string, string[]>>(() => {
    const result: Record<string, string[]> = {};
    for (const tl of timelines) {
      result[tl.wmsLayer] = tl.times;
    }
    return result;
  }, [timelines]);

  /* ---- Time label ---- */
  const primaryTimeline = timelines[0];
  const primaryTime = primaryTimeline?.times[frameIndex];
  const timeLabel = (() => {
    if (!primaryTimeline || !primaryTime) return '';
    // HRRR forecast offset labels
    if (primaryTimeline.wmsLayer === HRRR_TIMELINE_KEY) {
      return `HRRR ${hrrrLayerLabel(primaryTime)}`;
    }
    // EC GeoMet ISO timestamp labels
    return new Date(primaryTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });
  })();

  /* ---- Controls ---- */
  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const seek = useCallback(
    (idx: number) => {
      setFrameIndex(Math.max(0, Math.min(idx, totalFrames - 1)));
    },
    [totalFrames],
  );
  const stepForward = useCallback(() => {
    setFrameIndex((prev) => (prev + 1) % totalFrames);
  }, [totalFrames]);
  const stepBackward = useCallback(() => {
    setFrameIndex((prev) => (prev - 1 + totalFrames) % totalFrames);
  }, [totalFrames]);
  const refresh = useCallback(() => {
    fetchTimelines();
  }, [fetchTimelines]);

  const state: AnimationState = {
    playing,
    frameIndex,
    totalFrames,
    layerTimes,
    timeLabel,
    loading,
    layerAllTimes,
  };

  const controls: AnimationControls = {
    play,
    pause,
    toggle,
    seek,
    stepForward,
    stepBackward,
    refresh,
  };

  return [state, controls];
}
