/**
 * Floating layer-toggle control for the weather map.
 *
 * Renders translucent pills for each available layer (radar, satellite, HRRR).
 * When radar is active, a secondary row of radar-product pills appears below.
 * Disabled layers appear muted with a "soon" badge.
 */
import type { MapLayerDefinition, MapLayerId } from '../../types/map';
import type { RadarProduct, RadarProductId, SatelliteProduct, SatelliteProductId } from '../../services/ecGeometLayers';
import './MapLayerControl.css';

export interface MapLayerControlProps {
  /** Layer definitions including active/available state */
  layers: MapLayerDefinition[];
  /** Called when a layer toggle is clicked */
  onToggle: (id: MapLayerId) => void;
  /** Whether the radar layer is currently active */
  radarActive: boolean;
  /** Available radar product options */
  radarProducts: RadarProduct[];
  /** Currently selected radar product */
  selectedRadarProduct: RadarProductId;
  /** Called when user selects a different radar product */
  onRadarProductChange: (id: RadarProductId) => void;
  /** Whether the satellite layer is currently active */
  satelliteActive: boolean;
  /** Available satellite product options */
  satelliteProducts: SatelliteProduct[];
  /** Currently selected satellite product */
  selectedSatelliteProduct: SatelliteProductId;
  /** Called when user selects a different satellite product */
  onSatelliteProductChange: (id: SatelliteProductId) => void;
}

export default function MapLayerControl({
  layers,
  onToggle,
  radarActive,
  radarProducts,
  selectedRadarProduct,
  onRadarProductChange,
  satelliteActive,
  satelliteProducts,
  selectedSatelliteProduct,
  onSatelliteProductChange,
}: MapLayerControlProps) {
  return (
    <div className="map-layer-control">
      {/* Primary layer toggles */}
      <div className="layer-row">
        {layers.map((layer) => {
          const isActive = layer.active && layer.available;
          return (
            <button
              key={layer.id}
              className={[
                'layer-btn',
                isActive ? 'layer-btn--active' : '',
                !layer.available ? 'layer-btn--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={isActive ? { '--layer-accent': layer.color } as React.CSSProperties : undefined}
              onClick={() => layer.available && onToggle(layer.id)}
              disabled={!layer.available}
              aria-pressed={isActive}
              title={layer.available ? layer.label : `${layer.label} — coming soon`}
            >
              <span className="layer-btn__label">{layer.label}</span>
              {!layer.available && <span className="layer-btn__badge">soon</span>}
            </button>
          );
        })}
      </div>

      {/* Radar product sub-selector (visible when radar is toggled on) */}
      {radarActive && (
        <div className="radar-product-row">
          {radarProducts.map((product) => (
            <button
              key={product.id}
              className={[
                'radar-product-btn',
                product.id === selectedRadarProduct ? 'radar-product-btn--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onRadarProductChange(product.id)}
              aria-pressed={product.id === selectedRadarProduct}
              title={product.label}
            >
              {product.label}
            </button>
          ))}
        </div>
      )}

      {/* Satellite product sub-selector (visible when satellite is toggled on) */}
      {satelliteActive && (
        <div className="radar-product-row">
          {satelliteProducts.map((product) => (
            <button
              key={product.id}
              className={[
                'radar-product-btn',
                product.id === selectedSatelliteProduct ? 'radar-product-btn--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSatelliteProductChange(product.id)}
              aria-pressed={product.id === selectedSatelliteProduct}
              title={product.label}
            >
              {product.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
