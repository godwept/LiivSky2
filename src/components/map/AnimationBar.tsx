/**
 * AnimationBar — play/pause + timeline scrubber for WMS time animation.
 *
 * Docked at the bottom of the map with the same glassmorphic style as
 * the existing layer-control panel.
 * Shows a cache progress bar while frames are pre-loading.
 */
import type { AnimationState, AnimationControls } from '../../hooks/useWmsAnimation';
import './AnimationBar.css';

export interface AnimationBarProps {
  state: AnimationState;
  controls: AnimationControls;
  /** Whether all animation frames are pre-cached and ready for playback */
  cacheReady: boolean;
  /** Pre-cache progress 0–1 */
  cacheProgress: number;
}

export default function AnimationBar({
  state,
  controls,
  cacheReady,
  cacheProgress,
}: AnimationBarProps) {
  const { playing, frameIndex, totalFrames, timeLabel, loading } = state;
  const busy = loading || !cacheReady;

  if (totalFrames === 0 && !loading) return null;

  return (
    <div className="animation-bar">
      {/* Cache progress bar (shown while pre-loading frames) */}
      {busy && !loading && (
        <div className="anim-cache-bar">
          <div
            className="anim-cache-fill"
            style={{ width: `${Math.round(cacheProgress * 100)}%` }}
          />
        </div>
      )}

      {/* Step backward */}
      <button
        className="anim-btn"
        onClick={controls.stepBackward}
        disabled={busy || totalFrames === 0}
        aria-label="Previous frame"
        title="Previous frame"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
        </svg>
      </button>

      {/* Play / Pause */}
      <button
        className="anim-btn anim-btn--play"
        onClick={controls.toggle}
        disabled={busy || totalFrames === 0}
        aria-label={playing ? 'Pause' : 'Play'}
        title={busy ? 'Caching frames…' : playing ? 'Pause' : 'Play'}
      >
        {busy ? (
          <span className="anim-spinner" />
        ) : playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Step forward */}
      <button
        className="anim-btn"
        onClick={controls.stepForward}
        disabled={busy || totalFrames === 0}
        aria-label="Next frame"
        title="Next frame"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>

      {/* Timeline scrubber */}
      <div className="anim-scrubber">
        <input
          type="range"
          className="anim-range"
          min={0}
          max={Math.max(totalFrames - 1, 0)}
          value={frameIndex}
          onChange={(e) => controls.seek(Number(e.target.value))}
          disabled={busy || totalFrames === 0}
        />
        {/* Progress fill */}
        <div
          className="anim-range-fill"
          style={{
            width: totalFrames > 1
              ? `${(frameIndex / (totalFrames - 1)) * 100}%`
              : '0%',
          }}
        />
      </div>

      {/* Current timestamp label */}
      <span className="anim-time">
        {loading
          ? '…'
          : !cacheReady
            ? `${Math.round(cacheProgress * 100)}%`
            : timeLabel}
      </span>
    </div>
  );
}
