/**
 * ModelHero — Run-status hero banner for the Models page.
 *
 * Displays the currently active model, product, region, and forecast time
 * in a compact glass-style banner with an animated gradient background —
 * consistent with the DashboardPage and DarkSkyPage hero aesthetic.
 */
import './ModelHero.css';

export interface ModelHeroProps {
  /** Display name of the active model (e.g. "HRDPS") */
  modelLabel: string;
  /** Accent colour for the model badge (hex / rgb) */
  modelColor: string;
  /** Resolution string shown beside the model name (e.g. "2.5 km") */
  modelResolution: string;
  /** Provider label (e.g. "ECCC") */
  modelProvider: string;
  /** Product category label (e.g. "Surface") */
  categoryLabel: string;
  /** Active product display name (e.g. "2m Temperature") */
  productLabel: string;
  /** Active region label (e.g. "Canada") */
  regionLabel: string;
  /** Human-readable timestamp for the current animation frame */
  forecastTime: string;
  /** User location name shown in the sub-row */
  location: string;
}

export default function ModelHero({
  modelLabel,
  modelColor,
  modelResolution,
  modelProvider,
  categoryLabel,
  productLabel,
  regionLabel,
  forecastTime,
  location,
}: ModelHeroProps) {
  return (
    <div className="model-hero">
      {/* Animated background layer */}
      <div className="model-hero__bg" style={{ '--hero-color': modelColor } as React.CSSProperties} />

      {/* Top row: model badge · product · region */}
      <div className="model-hero__top">

        {/* Model badge */}
        <div
          className="model-hero__model-badge"
          style={{
            borderColor: `${modelColor}55`,
            color: modelColor,
            background: `${modelColor}12`,
          }}
        >
          <span className="model-hero__dot" style={{ background: modelColor }} />
          <span className="model-hero__model-name">{modelLabel}</span>
          <span className="model-hero__model-res">{modelResolution}</span>
        </div>

        {/* Product info */}
        <div className="model-hero__product">
          <span className="model-hero__category">{categoryLabel}</span>
          <span className="model-hero__sep">·</span>
          <span className="model-hero__param">{productLabel}</span>
        </div>

        {/* Region */}
        <div className="model-hero__region">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          {regionLabel}
        </div>
      </div>

      {/* Bottom row: forecast time · location */}
      <div className="model-hero__bottom">
        <div className="model-hero__time">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
          </svg>
          <span>{forecastTime || 'Loading…'}</span>
        </div>

        <div className="model-hero__provider-loc">
          <span className="model-hero__provider">{modelProvider}</span>
          <span className="model-hero__sep-dot">·</span>
          <span className="model-hero__location">{location}</span>
        </div>
      </div>
    </div>
  );
}
